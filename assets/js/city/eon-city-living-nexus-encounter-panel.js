import { createEonCityLivingNexusEncounterController } from './eon-city-living-nexus-encounters.js';

const escapeHtml = (value = '') => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const routeLabel = (route = '') => String(route || '/eoncity').replace(/^\//, '').replaceAll('-', ' ') || 'EONCITY';

function dispatch(root, type, detail = {}) {
  try {
    const ViewCustomEvent = root?.ownerDocument?.defaultView?.CustomEvent || globalThis.CustomEvent;
    root?.dispatchEvent?.(new ViewCustomEvent(type, { detail }));
    return true;
  } catch { return false; }
}

export function renderEonCityLivingNexusEncounterPanel() {
  return `<section class="eon-play-living-nexus-encounter" data-eon-play-living-nexus-encounter hidden aria-live="polite"><button type="button" class="eon-play-living-nexus-encounter-signal" data-eon-encounter-open aria-expanded="false"><span data-eon-encounter-signal-kicker>EXPANSE SIGNAL</span><strong data-eon-encounter-signal-title>Functional encounter nearby</strong><small>Inspect first · nothing opens automatically</small></button><section class="eon-play-living-nexus-encounter-panel" data-eon-encounter-panel hidden role="dialog" aria-modal="false" aria-label="Living Nexus functional encounter"><header><div><small>W660S · functional encounter</small><h2 data-eon-encounter-title>Encounter</h2></div><button type="button" data-eon-encounter-close>Close</button></header><div data-eon-encounter-content></div></section></section>`;
}

export function bindEonCityLivingNexusEncounterPanel(root, { getRuntime = () => null, onStatus = null } = {}) {
  if (!root) return () => {};
  const shell = root.ownerDocument.createElement('div');
  shell.innerHTML = renderEonCityLivingNexusEncounterPanel();
  const container = shell.firstElementChild;
  root.append(container);
  const signal = container.querySelector('[data-eon-encounter-open]');
  const signalKicker = container.querySelector('[data-eon-encounter-signal-kicker]');
  const signalTitle = container.querySelector('[data-eon-encounter-signal-title]');
  const panel = container.querySelector('[data-eon-encounter-panel]');
  const title = container.querySelector('[data-eon-encounter-title]');
  const content = container.querySelector('[data-eon-encounter-content]');
  const close = container.querySelector('[data-eon-encounter-close]');
  const status = (message) => onStatus?.(String(message || ''));
  let nearby = null;
  let selectedId = '';
  let detailMode = 'inspect';
  let routeReview = false;

  const controller = createEonCityLivingNexusEncounterController({
    getEncounters: () => getRuntime?.()?.getLivingNexusOpportunities?.() || [],
    getPosition: () => getRuntime?.()?.getPlayerPosition?.() || { x: 0, z: 0 }
  });

  const encounter = () => controller.getSnapshot().encounters.find((entry) => entry.id === selectedId)
    || (nearby ? controller.getSnapshot().encounters.find((entry) => entry.id === nearby.id) : null)
    || null;

  const updateSignal = () => {
    const current = nearby ? controller.getSnapshot().encounters.find((entry) => entry.id === nearby.id) || nearby : null;
    container.hidden = !current;
    if (!current) {
      selectedId = '';
      panel.hidden = true;
      signal?.setAttribute('aria-expanded', 'false');
      return;
    }
    if (signalKicker) signalKicker.textContent = current.state === 'transformed' ? 'VERIFIED LOCATION' : current.state === 'prepared' ? 'MISSION PREPARED' : 'EXPANSE SIGNAL';
    if (signalTitle) signalTitle.textContent = `${current.specialistName} · ${current.landmarkLabel}`;
    container.dataset.encounterState = current.state;
  };

  const render = () => {
    const current = encounter();
    if (!current) {
      content.innerHTML = '<p>The encounter moved outside the active streamed interaction neighbourhood. Continue exploring or return to the last signal.</p>';
      return;
    }
    selectedId = current.id;
    if (title) title.textContent = current.landmarkLabel;
    const stateCopy = current.state === 'transformed'
      ? `<p class="eon-play-encounter-success"><strong>Verified transformation active.</strong> This exact location changed after the matching bounded receipt returned.</p>`
      : current.state === 'prepared'
        ? '<p class="eon-play-encounter-prepared"><strong>Mission prepared locally.</strong> The native route still requires a separate visible click and real completion.</p>'
        : '<p>No route, provider, project, automation, backup, reward or payment action has started.</p>';
    const interpretation = detailMode === 'interpret'
      ? `<article class="eon-play-encounter-interpretation"><small>EONBOT local interpretation · no provider request</small><p>${escapeHtml(current.interpretation)}</p></article>`
      : `<article class="eon-play-encounter-inspection"><small>${escapeHtml(current.specialistRole)} · ${escapeHtml(current.cellId)}</small><p><strong>Opportunity:</strong> ${escapeHtml(current.worldVerb)}.</p><p><strong>Required real action:</strong> ${escapeHtml(current.requiredAction)}</p><p><strong>Privacy boundary:</strong> ${escapeHtml(current.privacyBoundary)}</p></article>`;
    const route = routeReview
      ? `<article class="eon-play-encounter-route-review"><strong>Open ${escapeHtml(routeLabel(current.route))}?</strong><p>This second click leaves City. Only the bounded mission id is carried in local review state; no private work content or Expanse seed is transferred.</p><a href="${escapeHtml(current.route)}" data-eon-encounter-confirm-route>Confirm and open ${escapeHtml(routeLabel(current.route))}</a>${current.alternateRoute ? `<a href="${escapeHtml(current.alternateRoute)}" data-eon-encounter-confirm-route>Confirm alternate route</a>` : ''}<button type="button" data-eon-encounter-cancel-route>Stay in City</button></article>`
      : '';
    content.innerHTML = `${stateCopy}${interpretation}<div class="eon-play-encounter-actions"><button type="button" data-eon-encounter-inspect>Inspect</button><button type="button" data-eon-encounter-interpret>Ask EONBOT</button><button type="button" data-eon-encounter-guide>Guide to signal</button><button type="button" data-eon-encounter-review-mission>${current.state === 'transformed' ? 'Review completed mission' : 'Review productive mission'}</button><button type="button" data-eon-encounter-check-return>Check return receipt</button></div>${route}`;
  };

  const open = (id = nearby?.id || '') => {
    selectedId = String(id || '');
    detailMode = 'inspect';
    routeReview = false;
    panel.hidden = false;
    signal?.setAttribute('aria-expanded', 'true');
    render();
    close?.focus?.({ preventScroll: true });
    const current = encounter();
    if (current) status(`${current.specialistName} opened a local review card. Nothing has executed or navigated.`);
  };
  const hide = () => {
    panel.hidden = true;
    routeReview = false;
    signal?.setAttribute('aria-expanded', 'false');
    signal?.focus?.({ preventScroll: true });
  };

  const onOpportunity = (event) => {
    nearby = event?.detail || null;
    if (!nearby && !panel.hidden) hide();
    updateSignal();
  };
  const onOpenRequest = (event) => open(event?.detail?.encounterId || nearby?.id || '');
  const onSyncResult = () => { updateSignal(); if (!panel.hidden) render(); };

  signal?.addEventListener('click', () => panel.hidden ? open() : hide());
  close?.addEventListener('click', hide);
  container.addEventListener('click', (event) => {
    if (event.target === panel) hide();
    const current = encounter();
    if (!current) return;
    if (event.target?.closest?.('[data-eon-encounter-inspect]')) {
      const result = controller.inspect(current.id, { explicitUserAction: true });
      detailMode = 'inspect'; routeReview = false; render();
      status(result.ok ? `${current.landmarkLabel} inspected locally. No route or work action opened.` : 'That encounter is no longer resident.');
      return;
    }
    if (event.target?.closest?.('[data-eon-encounter-interpret]')) {
      const result = controller.interpret(current.id, { explicitUserAction: true });
      detailMode = 'interpret'; routeReview = false;
      getRuntime?.()?.setCompanionIntent?.('guide', { durationMs: 3000 });
      render();
      status(result.ok ? 'EONBOT interpreted the public encounter locally. No AI provider request or private-data read occurred.' : 'EONBOT could not interpret that expired encounter.');
      return;
    }
    if (event.target?.closest?.('[data-eon-encounter-guide]')) {
      const result = getRuntime?.()?.guideToLivingNexusCell?.(current.cellId, { explicitUserAction: true });
      if (result?.ok) { hide(); status(`${current.landmarkLabel} guide activated locally. Manual movement cancels it.`); }
      else status('That encounter guide could not be activated. Remain in the Expanse and refresh the streamed neighbourhood.');
      return;
    }
    if (event.target?.closest?.('[data-eon-encounter-review-mission]')) {
      const prepared = controller.prepareMission(current.id, { explicitUserAction: true });
      if (!prepared.ok) { status(`Mission review was not prepared: ${prepared.reason}.`); return; }
      routeReview = true;
      dispatch(root, 'eon:city:productive-rpg:review', { missionId: current.missionId, source: 'living-nexus-encounter', encounterId: current.id });
      updateSignal(); render();
      status(`${current.missionTitle} is prepared for visible review. Choose the separate route confirmation or stay in City.`);
      return;
    }
    if (event.target?.closest?.('[data-eon-encounter-check-return]')) {
      const result = controller.syncVerifiedReturn({ explicitUserAction: true });
      getRuntime?.()?.syncLivingNexusEncounterResolutions?.(result.snapshot.resolutions || []);
      dispatch(root, 'eon:city:living-nexus:sync-request', { source: 'living-nexus-encounter', explicitUserAction: true });
      nearby = getRuntime?.()?.getNearestLivingNexusOpportunity?.() || nearby;
      updateSignal(); render();
      status(result.resolved
        ? `${current.landmarkLabel} transformed from the matching verified ${result.resolved.outcomeKind.replaceAll('-', ' ')} receipt.`
        : result.reason === 'matching-verified-receipt-not-found'
          ? 'No matching verified return receipt exists yet. The location remains unchanged.'
          : 'No pending encounter return was found. No transformation was claimed.');
      return;
    }
    if (event.target?.closest?.('[data-eon-encounter-cancel-route]')) { routeReview = false; render(); status('Stayed in City. No route or work action opened.'); return; }
    if (event.target?.closest?.('[data-eon-encounter-confirm-route]')) {
      status(`You explicitly confirmed ${routeLabel(event.target.closest('a')?.getAttribute?.('href') || current.route)}. Completion remains proof-gated until the native surface writes a verified receipt.`);
    }
  });
  container.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); hide(); } });
  root.addEventListener('eon:city:living-nexus:opportunity', onOpportunity);
  root.addEventListener('eon:city:living-nexus:open-encounter', onOpenRequest);
  root.addEventListener('eon:city:living-nexus:sync-result', onSyncResult);

  nearby = getRuntime?.()?.getNearestLivingNexusOpportunity?.() || null;
  updateSignal();

  return () => {
    root.removeEventListener('eon:city:living-nexus:opportunity', onOpportunity);
    root.removeEventListener('eon:city:living-nexus:open-encounter', onOpenRequest);
    root.removeEventListener('eon:city:living-nexus:sync-result', onSyncResult);
    controller.dispose();
    container.remove();
  };
}
