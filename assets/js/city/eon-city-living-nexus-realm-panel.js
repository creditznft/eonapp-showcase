/**
 * W660V — review-first UI for rare Expanse portals and authored Nexus Realms.
 */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));

export function renderEonCityLivingNexusRealmPanel() {
  return `<section class="eon-play-living-nexus-realm-signal" data-eon-play-living-nexus-realm-signal hidden aria-live="polite"><button type="button" data-eon-realm-signal-open aria-expanded="false"><span data-eon-realm-signal-kicker>RARE NEXUS SIGNAL</span><strong data-eon-realm-signal-title>Curated Realm nearby</strong><small>Inspect first · explicit entry and safe return</small></button><section class="eon-play-living-nexus-realm-panel" data-eon-realm-panel hidden role="dialog" aria-modal="false" aria-label="Curated Nexus Realm review"><header><div><small>W660V–W660W · Curated Nexus Realms</small><h2 data-eon-realm-title>Nexus Realm</h2></div><button type="button" data-eon-realm-close>Close</button></header><div data-eon-realm-content></div></section></section>`;
}

function routeLabel(route = '') {
  const value = String(route || '');
  if (value.startsWith('/capsule')) return 'Capsule and Recovery';
  if (value.startsWith('/local-ai')) return 'Local AI';
  if (value.startsWith('/projects')) return 'Projects';
  if (value.startsWith('/create')) return 'Creator';
  if (value.startsWith('/automations')) return 'Automations';
  return 'native EONAPP surface';
}

export function bindEonCityLivingNexusRealmPanel(root, { getRuntime = () => null, onStatus = null } = {}) {
  if (!root?.append) return () => {};
  const shell = root.ownerDocument.createElement('div');
  shell.innerHTML = renderEonCityLivingNexusRealmPanel();
  const container = shell.firstElementChild;
  root.append(container);
  const signalButton = container.querySelector('[data-eon-realm-signal-open]');
  const signalKicker = container.querySelector('[data-eon-realm-signal-kicker]');
  const signalTitle = container.querySelector('[data-eon-realm-signal-title]');
  const panel = container.querySelector('[data-eon-realm-panel]');
  const title = container.querySelector('[data-eon-realm-title]');
  const content = container.querySelector('[data-eon-realm-content]');
  const close = container.querySelector('[data-eon-realm-close]');
  const status = (message) => { try { onStatus?.(String(message || '')); } catch {} };
  let signal = null;
  let prepared = null;
  let routeReview = false;

  const runtime = () => getRuntime?.() || null;
  const summary = () => runtime()?.getLivingNexusSummary?.() || {};
  const plan = () => runtime()?.getLivingNexusRealmPlan?.() || null;

  const updateSignal = () => {
    const activeRealm = summary().destination === 'realm';
    container.hidden = !signal && !activeRealm;
    if (activeRealm) {
      if (signalKicker) signalKicker.textContent = 'CURATED REALM ACTIVE';
      if (signalTitle) signalTitle.textContent = plan()?.label || summary().activeRealmLabel || 'Nexus Realm';
      container.dataset.realmState = 'active';
    } else if (signal?.signalType === 'rare-portal') {
      if (signalKicker) signalKicker.textContent = 'RARE NEXUS SIGNAL';
      if (signalTitle) signalTitle.textContent = signal.label || 'Curated Realm portal';
      container.dataset.realmState = prepared ? 'prepared' : 'portal';
    } else {
      container.dataset.realmState = '';
    }
    if (container.hidden) {
      panel.hidden = true;
      signalButton?.setAttribute('aria-expanded', 'false');
    }
  };

  const renderPortal = () => {
    const portal = signal;
    const catalogEntry = runtime()?.getLivingNexusRealmCatalog?.()?.find?.((entry) => entry.id === portal?.realmId) || null;
    if (!portal || !catalogEntry) {
      content.innerHTML = '<p>The rare portal moved outside the active Expanse residency window. Continue exploring or use the Living Nexus guide.</p>';
      return;
    }
    if (title) title.textContent = catalogEntry.label;
    const preparedCopy = prepared?.ok
      ? `<article class="eon-play-realm-prepared"><strong>${escapeHtml(catalogEntry.label)} is prepared.</strong><p>Entry still requires the separate confirmation below. The Realm will reuse the existing Babylon scene and return to this exact Expanse portal context.</p><button type="button" data-eon-realm-confirm-entry>Confirm and enter ${escapeHtml(catalogEntry.label)}</button><button type="button" data-eon-realm-cancel-entry>Cancel entry</button></article>`
      : '';
    content.innerHTML = `<article class="eon-play-realm-inspection"><small>${escapeHtml(catalogEntry.chapter)}</small><h3>${escapeHtml(catalogEntry.tagline)}</h3><p>${escapeHtml(catalogEntry.summary)}</p><dl><div><dt>Productive path</dt><dd>${escapeHtml(catalogEntry.nativeRouteLabel)}</dd></div><div><dt>World change</dt><dd>${escapeHtml(catalogEntry.transformationLabel)}</dd></div><div><dt>Boundary</dt><dd>Authored local geometry, explicit entry, no runtime AI generation, no private work content.</dd></div></dl></article><div class="eon-play-realm-actions"><button type="button" data-eon-realm-inspect>Inspect portal</button><button type="button" data-eon-realm-ask-eonbot>Ask EONBOT</button><button type="button" data-eon-realm-guide>Guide to portal cell</button><button type="button" data-eon-realm-prepare>Prepare Realm entry</button></div>${preparedCopy}`;
  };

  const renderActiveRealm = () => {
    const activePlan = plan();
    if (!activePlan) {
      content.innerHTML = '<p>The authored Realm plan is unavailable. Use the immediate safe return.</p><button type="button" data-eon-realm-exit>Return to the Expanse</button>';
      return;
    }
    if (title) title.textContent = activePlan.label;
    const feature = signal?.signalType === 'realm-feature' ? signal : runtime()?.getNearestLivingNexusRealmSignal?.() || null;
    const featureCopy = feature
      ? `<article class="eon-play-realm-feature"><small>${escapeHtml(feature.kind || 'realm signal')}</small><strong>${escapeHtml(feature.label || feature.id)}</strong><span>${Number(feature.distance || 0).toFixed(1)}m · local authored feature</span></article>`
      : '<article class="eon-play-realm-feature"><strong>Explore the authored route.</strong><span>The safe return remains available at all times.</span></article>';
    const mission = activePlan.mission;
    const transformed = activePlan.transformation?.active === true;
    const route = routeReview
      ? `<article class="eon-play-realm-route-review"><strong>Open ${escapeHtml(routeLabel(mission.route))}?</strong><p>This second click leaves the Realm. Completion remains proof-gated until the native surface writes a matching verified receipt.</p><a href="${escapeHtml(mission.route)}" data-eon-realm-native-route>Confirm and open ${escapeHtml(routeLabel(mission.route))}</a>${mission.alternateRoute ? `<a href="${escapeHtml(mission.alternateRoute)}" data-eon-realm-native-route>Confirm alternate route</a>` : ''}<button type="button" data-eon-realm-cancel-route>Stay in Realm</button></article>`
      : '';
    content.innerHTML = `<article class="eon-play-realm-active-summary"><small>${escapeHtml(activePlan.chapter)} · ${escapeHtml(activePlan.atmosphere.label)}</small><h3>${escapeHtml(activePlan.tagline)}</h3><p>${escapeHtml(activePlan.summary)}</p><p><strong>${transformed ? 'Verified transformation active:' : 'Transformation pending:'}</strong> ${escapeHtml(activePlan.transformation.label)}.</p><div class="eon-play-realm-premium-grid"><span><small>Functional specialist</small><strong>${escapeHtml(activePlan.specialist?.label || 'Realm specialist')}</strong><em>${escapeHtml(activePlan.specialist?.role || 'review-first guide')}</em></span><span><small>Living movement</small><strong>${escapeHtml(activePlan.movementSystem?.label || 'Authored movement')}</strong><em>${escapeHtml(activePlan.atmosphere.motionEnabled ? activePlan.movementSystem?.kind || 'local motion' : activePlan.movementSystem?.reducedEffectsFallback || 'static fallback')}</em></span><span><small>My Realm reflection</small><strong>${escapeHtml(activePlan.realmReflection?.label || 'Verified reflection')}</strong><em>${transformed ? 'active from matching receipt' : 'locked until verified transformation'}</em></span></div></article>${featureCopy}<div class="eon-play-realm-actions">${feature?.kind === 'discovery' ? '<button type="button" data-eon-realm-record-discovery>Record nearby discovery in private Atlas</button>' : ''}<button type="button" data-eon-realm-review-mission>Review ${escapeHtml(mission.title)}</button><button type="button" data-eon-realm-sync>Check matching verified receipt</button><button type="button" data-eon-realm-open-capture>Open Creator Capture</button><button type="button" data-eon-realm-open-share>Open global Sharing Center</button><button type="button" data-eon-realm-exit>Immediate safe return to Expanse</button></div>${route}`;
  };

  const render = () => {
    if (summary().destination === 'realm') renderActiveRealm();
    else renderPortal();
  };

  const open = () => {
    panel.hidden = false;
    signalButton?.setAttribute('aria-expanded', 'true');
    routeReview = false;
    render();
    close?.focus?.({ preventScroll: true });
    status(summary().destination === 'realm' ? 'Curated Realm controls opened. Immediate safe return remains available.' : 'Rare Nexus portal opened for inspection. Nothing entered automatically.');
  };
  const hide = () => {
    panel.hidden = true;
    routeReview = false;
    signalButton?.setAttribute('aria-expanded', 'false');
    signalButton?.focus?.({ preventScroll: true });
  };

  const onSignal = (event) => {
    signal = event?.detail || null;
    if (signal?.signalType !== 'rare-portal' && signal?.signalType !== 'realm-feature') signal = null;
    if (!signal && summary().destination !== 'realm' && !panel.hidden) hide();
    updateSignal();
    if (!panel.hidden) render();
  };

  const onOpenRealm = () => {
    signal = runtime()?.getNearestLivingNexusRealmSignal?.() || signal;
    updateSignal();
    if (panel.hidden) open();
    else render();
  };

  signalButton?.addEventListener('click', () => panel.hidden ? open() : hide());
  close?.addEventListener('click', hide);
  container.addEventListener('click', (event) => {
    if (event.target === panel) { hide(); return; }
    if (event.target?.closest?.('[data-eon-realm-inspect]')) { status('The portal is source-authored and inspect-only until you prepare and separately confirm entry.'); return; }
    if (event.target?.closest?.('[data-eon-realm-ask-eonbot]')) {
      runtime()?.setCompanionIntent?.('guide', { durationMs: 3200 });
      status('EONBOT identified a curated authored Realm. No AI provider request or private-data read occurred.');
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-guide]')) {
      const result = runtime()?.guideToLivingNexusCell?.(signal?.cellId || '', { explicitUserAction: true });
      if (result?.ok) { hide(); status(`${signal.cellId} portal guide activated locally. Manual movement cancels it.`); }
      else status('The rare portal cell is no longer resident. Refresh the Expanse window.');
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-prepare]')) {
      prepared = runtime()?.prepareLivingNexusRealm?.(signal?.realmId || '', signal?.id || '', { explicitUserAction: true }) || null;
      render(); updateSignal();
      status(prepared?.ok ? `${prepared.plan.label} prepared for a separate explicit entry confirmation.` : 'The portal could not be prepared because it is no longer resident.');
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-cancel-entry]')) { prepared = null; render(); updateSignal(); status('Realm entry cancelled. You remain in the Expanse.'); return; }
    if (event.target?.closest?.('[data-eon-realm-confirm-entry]')) {
      const preparedPortalId = prepared?.portal?.id || '';
      const result = prepared?.ok ? runtime()?.enterLivingNexusRealm?.(prepared.plan.id, preparedPortalId, { explicitUserAction: true }) : null;
      if (result?.ok) {
        signal = null; prepared = null; routeReview = false; updateSignal(); render();
        root.dispatchEvent(new CustomEvent('eon:city:living-nexus:record-realm-visit', { detail: { realmId: result.plan.id, portalId: preparedPortalId, enteredAt: Date.now(), explicitUserAction: true } }));
        status(`${result.plan.label} entered inside the one existing Babylon scene. The immediate safe return is active.`);
      } else status('Realm entry failed safely. You remain in the Expanse.');
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-record-discovery]')) {
      const activePlan = plan();
      const feature = signal?.signalType === 'realm-feature' ? signal : runtime()?.getNearestLivingNexusRealmSignal?.() || null;
      if (!activePlan || feature?.kind !== 'discovery') { status('Move closer to an authored Realm discovery before recording it.'); return; }
      root.dispatchEvent(new CustomEvent('eon:city:living-nexus:record-realm-discovery', { detail: { realmId: activePlan.id, discoveryId: feature.id, label: feature.label || feature.id, discoveredAt: Date.now(), explicitUserAction: true } }));
      status(`${feature.label || feature.id} sent to the private Realm Atlas. No share action occurred.`);
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-review-mission]')) {
      const activePlan = plan();
      if (!activePlan) return;
      routeReview = true;
      root.dispatchEvent(new CustomEvent('eon:city:productive-rpg:review', { detail: { missionId: activePlan.mission.id, source: 'living-nexus-realm', realmId: activePlan.id } }));
      render();
      status(`${activePlan.mission.title} prepared for visible review. The native route still needs a separate click.`);
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-sync]')) {
      const result = runtime()?.syncLivingNexusRealmVerifiedOutcome?.({ explicitUserAction: true });
      root.dispatchEvent(new CustomEvent('eon:city:living-nexus:sync-request', { detail: { source: 'living-nexus-realm', realmId: plan()?.id || '', explicitUserAction: true } }));
      render();
      status(result?.newlyTransformed ? `${result.transformation.label} activated from the matching verified receipt.` : result?.transformed ? `${result.transformation.label} is already verified.` : 'No matching verified native receipt exists yet. The Realm remains unchanged.');
      return;
    }
    if (event.target?.closest?.('[data-eon-realm-cancel-route]')) { routeReview = false; render(); status('Stayed in the Realm. No native route opened.'); return; }
    if (event.target?.closest?.('[data-eon-realm-native-route]')) { status('Native route explicitly confirmed. Realm completion remains proof-gated until a matching verified receipt returns.'); return; }
    if (event.target?.closest?.('[data-eon-realm-open-capture]')) { hide(); root.querySelector('[data-capture-toggle]')?.click?.(); status('Creator Capture opened. Screen, microphone and facecam permissions remain separate browser choices.'); return; }
    if (event.target?.closest?.('[data-eon-realm-open-share]')) { hide(); root.querySelector('[data-eon-play-share-city]')?.click?.(); status('The one global Sharing Center opened for explicit review. Nothing was posted automatically.'); return; }
    if (event.target?.closest?.('[data-eon-realm-exit]')) {
      const result = runtime()?.exitLivingNexusRealm?.({ explicitUserAction: true });
      if (result?.ok) { signal = null; prepared = null; routeReview = false; hide(); updateSignal(); status(`${result.exitedRealmId} closed and the exact Expanse portal context was restored.`); }
      else status('Safe return was unavailable because no authored Realm is active.');
    }
  });
  container.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); hide(); } });
  root.addEventListener('eon:city:living-nexus:realm-signal', onSignal);
  root.addEventListener('eon:city:living-nexus:open-realm', onOpenRealm);
  signal = runtime()?.getNearestLivingNexusRealmSignal?.() || null;
  updateSignal();

  return () => {
    root.removeEventListener('eon:city:living-nexus:realm-signal', onSignal);
    root.removeEventListener('eon:city:living-nexus:open-realm', onOpenRealm);
    container.remove();
  };
}
