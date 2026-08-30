import { EON_CITY_W752_VIEW_EVENT } from '../contracts/city/eon-city-view-events.js';

const freeze = (value) => Object.freeze(value);
const escapeText = (value = '') => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function stateLabel(state = 'available') {
  if (state === 'claimed') return 'XP claimed';
  if (state === 'verified-ready') return 'Verified receipt ready';
  if (state === 'in-progress') return 'In progress';
  if (state === 'blocked') return 'Proof unavailable';
  return 'Available';
}

function percent(value = 0, total = 100) {
  const denominator = Math.max(1, Number(total || 100));
  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / denominator) * 100)));
}

export function renderEonCityW752ProgressionPanel(view = {}, stationId = '') {
  const mission = (Array.isArray(view?.missions) ? view.missions : []).find((entry) => entry.stationId === stationId);
  if (!mission) return '';
  const realm = view?.myRealm || {};
  const showRealm = stationId === 'my-realm-portal';
  const revealReady = Number(view?.pendingReveals || 0) > 0 && view?.nextReveal;
  const claimButton = mission.claimable
    ? `<button type="button" data-eon-w752-claim="${escapeText(stationId)}">Claim verified mission</button>`
    : mission.claimed
      ? '<button type="button" disabled>Mission claimed</button>'
      : '<button type="button" disabled>Native receipt required</button>';
  const revealButton = revealReady
    ? `<button type="button" data-eon-w752-reveal>Reveal ${escapeText(view.nextReveal.label)}</button>`
    : `<button type="button" disabled>${view?.revealCatalogComplete ? 'Cosmetic catalog complete' : 'No reveal ready'}</button>`;
  const actionChoices = Array.isArray(mission.actionChoices) && mission.actionChoices.length
    ? `<div class="eon-city-progression-mission-actions" aria-label="Mission action lanes">${mission.actionChoices.map((choice) => `<button type="button" data-eon-w752-creator-mode="${escapeText(choice.creatorMode)}">${escapeText(choice.label)}</button>`).join('')}</div><p class="eon-city-progression-action-boundary">Choose a lane to work inside the maintained Creator. Opening a lane earns no XP and starts no generation or provider call.</p>`
    : '';
  return `<section class="eon-city-progression-panel" data-eon-w752-progression="${escapeText(stationId)}" data-state="${escapeText(mission.state)}">
    <header><div><small>W752 · productive mission</small><h2>${escapeText(mission.title)}</h2><p>${escapeText(mission.summary)}</p></div><span>${escapeText(stateLabel(mission.state))}</span></header>
    <div class="eon-city-progression-metrics" aria-label="City progression"><article><small>City XP</small><strong>${Number(view?.xp || 0)}</strong></article><article><small>Vault Reveal</small><strong>${Number(view?.revealProgress || 0)} / ${Number(view?.revealThreshold || 100)}</strong><meter min="0" max="100" value="${percent(view?.revealProgress, view?.revealThreshold)}">${percent(view?.revealProgress, view?.revealThreshold)}%</meter></article><article><small>Ready reveals</small><strong>${Number(view?.pendingReveals || 0)}</strong></article></div>
    ${actionChoices}
    <div class="eon-city-progression-actions">${claimButton}${revealButton}<button type="button" data-eon-w752-refresh>Refresh verified state</button></div>
    <p class="eon-city-progression-boundary">Fixed local XP and deterministic, duplicate-protected cosmetics only. No streaks, paid randomness, loot boxes or public-posting rewards.</p>
    ${showRealm ? `<section class="eon-city-my-realm-reflection"><header><div><small>Private My Realm reflection</small><h3>${escapeText(realm.title || 'Quiet Foundation')}</h3><p>${escapeText(realm.line || '')}</p></div><span>${Number(realm.claimedCount || 0)} / 10</span></header><div>${(Array.isArray(realm.facets) ? realm.facets : []).map((facet) => `<article data-complete="${facet.complete ? 'true' : 'false'}"><small>${escapeText(facet.label)}</small><strong>${Number(facet.claimedCount || 0)} / ${Number(facet.total || 0)}</strong><span>${Number(facet.readyCount || 0)} ready</span></article>`).join('')}</div><p>Private reflection only. No public world, multiplayer, transferable asset or private payload is created.</p></section>` : ''}
    <p class="eon-city-progression-status" aria-live="polite">${mission.claimed ? 'Claimed from a verified native receipt.' : mission.claimable ? 'A genuine native receipt is ready for explicit claim.' : 'Complete the maintained work surface and return with its native receipt.'}</p>
  </section>`;
}

export function mountEonCityW752ProgressionPanel({ root, environment = globalThis, invocation = {}, open = null } = {}) {
  if (!root) return freeze({ dispose() {} });
  const stationId = String(invocation?.context?.stationId || invocation?.context?.stationWorkLoop?.stationId || '');
  let current = environment.EON_CITY_COMMAND_HUB_RUNTIME?.getMissionsProgression?.() || null;
  let disposed = false;
  const render = () => {
    const html = renderEonCityW752ProgressionPanel(current || {}, stationId);
    root.hidden = !html;
    root.innerHTML = html;
  };
  const onClick = (event) => {
    const creatorLane = event.target.closest?.('[data-eon-w752-creator-mode]');
    if (creatorLane) {
      const mode = String(creatorLane.dataset.eonW752CreatorMode || '');
      if (!['image', 'video', 'music'].includes(mode)) return;
      const target = root.parentElement?.querySelector?.(`[data-eon-city-create-mode="${mode}"]`);
      const status = root.querySelector?.('.eon-city-progression-status');
      if (target) {
        target.click();
        if (status) status.textContent = `${mode === 'music' ? 'Music / Radio' : mode[0].toUpperCase() + mode.slice(1)} lane opened for review. No XP, generation or provider call was created by this switch.`;
      } else if (typeof open === 'function') {
        if (status) status.textContent = 'Opening the maintained Creator lane. No XP or generation is created by this handoff.';
        void open({ id: 'create', context: { ...(invocation?.context || {}), creatorMode: mode }, explicitUserAction: true }, creatorLane);
      } else if (status) {
        status.textContent = 'Creator lane is unavailable in this surface. No action or XP was created.';
      }
      return;
    }
    const claim = event.target.closest?.('[data-eon-w752-claim]');
    if (claim) {
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.claimProductiveMission?.(String(claim.dataset.eonW752Claim || stationId), { explicitUserAction: true });
      return;
    }
    if (event.target.closest?.('[data-eon-w752-reveal]')) {
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.openDeterministicVaultReveal?.({ explicitUserAction: true });
      return;
    }
    if (event.target.closest?.('[data-eon-w752-refresh]')) environment.EON_CITY_COMMAND_HUB_RUNTIME?.refreshMissionsProgression?.('dock-explicit-refresh', { explicitUserAction: true });
  };
  const onView = (event) => {
    if (disposed) return;
    current = event?.detail?.view || current;
    render();
  };
  render();
  root.addEventListener?.('click', onClick);
  environment.addEventListener?.(EON_CITY_W752_VIEW_EVENT, onView);
  return freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener?.('click', onClick);
      environment.removeEventListener?.(EON_CITY_W752_VIEW_EVENT, onView);
    }
  });
}

export default mountEonCityW752ProgressionPanel;
