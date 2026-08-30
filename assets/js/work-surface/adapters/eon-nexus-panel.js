import { EON_CITY_W749_VIEW_EVENT } from '../../contracts/city/eon-city-view-events.js';

const freeze = (value) => Object.freeze(value);
const escapeText = (value = '') => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function viewFromInvocation(invocation = {}) {
  return invocation?.context?.nexusView || null;
}

function statusClass(entry = {}) {
  if (entry.failed) return 'is-failed';
  if (entry.warning) return 'is-warning';
  if (entry.active) return 'is-active';
  return 'is-idle';
}

function render(root, view = {}, selectedRingId = '') {
  const rings = Array.isArray(view?.rings) ? view.rings : [];
  const selected = rings.find((entry) => entry.id === selectedRingId) || rings.find((entry) => entry.id === view?.selectedRingId) || rings[0] || null;
  const workObject = view?.workObject?.present ? `<article class="eon-nexus-dock-work-object">
    <small>Selected work-object continuity</small>
    <strong>${escapeText(view.workObject.label)}</strong>
    <p>${escapeText(view.workObject.placementReason || 'Review the proposed City placement before navigating or acting.')}</p>
    <button type="button" data-eon-nexus-guide-station="${escapeText(view.workObject.stationId)}">Guide to suggested station</button>
  </article>` : '';
  root.innerHTML = `<section class="eon-nexus-dock" data-eon-nexus-dock data-eon-nexus-state="${escapeText(view?.state || 'ready')}">
    <header class="eon-nexus-dock-hero">
      <div class="eon-nexus-dock-pulse" aria-hidden="true"><span></span><span></span><span></span></div>
      <div aria-live="polite"><small>One EONBOT · one privacy-projected state</small><h2>${escapeText(view?.stateLabel || 'EONBOT ready')}</h2><p>${escapeText(view?.summary || 'Choose a real next action.')}</p></div>
      <div class="eon-nexus-dock-freshness" data-state="${escapeText(view?.freshness?.state || 'unknown')}"><strong>${escapeText(view?.freshness?.label || 'Freshness unavailable')}</strong><span>${escapeText(view?.connection?.label || 'Connection unavailable')}</span></div>
    </header>
    <nav class="eon-nexus-dock-actions" aria-label="Nexus quick actions">
      <button type="button" data-eon-nexus-open="chat">Ask EONBOT</button>
      <button type="button" data-eon-nexus-open="projects">Continue work</button>
      <button type="button" data-eon-nexus-open="automations">Approvals</button>
      <button type="button" data-eon-nexus-open="share">Share / Capture</button>
    </nav>
    ${workObject}
    <div class="eon-nexus-dock-layout">
      <section class="eon-nexus-dock-rings" aria-label="Living Nexus rings">
        ${rings.map((entry) => `<button type="button" class="${statusClass(entry)}" data-eon-nexus-ring="${escapeText(entry.id)}" aria-pressed="${entry.id === selected?.id ? 'true' : 'false'}"><span>${escapeText(entry.label)}</span><strong>${entry.total > 0 ? `${entry.count}/${entry.total}` : entry.count}</strong><small>${escapeText(entry.shortLabel)}</small></button>`).join('')}
      </section>
      <article class="eon-nexus-dock-inspector" data-eon-nexus-inspector>
        <small>${escapeText(selected?.source || 'Privacy-projected source')}</small>
        <h3>${escapeText(selected?.label || 'Nexus ring')}</h3>
        <p>${escapeText(selected?.detail || 'No bounded detail is available.')}</p>
        <div><strong>Truth boundary</strong><span>${escapeText(selected?.truthBoundary || 'No private content is shown in City.')}</span></div>
        <button type="button" data-eon-nexus-open="${escapeText(selected?.surface || 'chat')}">Open maintained workspace</button>
      </article>
    </div>
    <footer><span>Raw prompts, files, keys, payment records and identity tokens are never projected here.</span><button type="button" data-eon-nexus-refresh>Refresh bounded state</button></footer>
  </section>`;
}

export async function mountEonWorkSurface({ root, environment = globalThis, invocation = {}, open, close } = {}) {
  let disposed = false;
  let currentView = viewFromInvocation(invocation) || {};
  let selectedRingId = String(invocation?.context?.nexusRingId || currentView?.selectedRingId || '');
  render(root, currentView, selectedRingId);

  const openSurface = (id = '', trigger = null) => open?.({
    id,
    source: 'eon-city-living-nexus',
    explicitUserAction: true,
    presentationMode: invocation.presentationMode || 'dock',
    sessionId: invocation.sessionId,
    trigger,
    context: freeze({
      ...(invocation.context || {}),
      nexusRingId: selectedRingId,
      returnToNexusDock: true,
      cityPresentation: true,
      allowFocusWorkspace: true
    })
  }, trigger);

  const onClick = (event) => {
    const ring = event.target.closest?.('[data-eon-nexus-ring]');
    if (ring) {
      selectedRingId = String(ring.dataset.eonNexusRing || '');
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.inspectLivingNexusRing?.(selectedRingId, { explicitUserAction: true });
      render(root, currentView, selectedRingId);
      return;
    }
    const openButton = event.target.closest?.('[data-eon-nexus-open]');
    if (openButton) {
      void openSurface(String(openButton.dataset.eonNexusOpen || 'chat'), openButton);
      return;
    }
    const guide = event.target.closest?.('[data-eon-nexus-guide-station]');
    if (guide) {
      const stationId = String(guide.dataset.eonNexusGuideStation || '');
      close?.({ restoreFocus: false });
      const guideAfterClose = () => environment.EON_CITY_COMMAND_HUB_RUNTIME?.guideToStation?.(stationId, { explicitUserAction: true });
      if (typeof environment.requestAnimationFrame === 'function') environment.requestAnimationFrame(guideAfterClose);
      else guideAfterClose();
      return;
    }
    if (event.target.closest?.('[data-eon-nexus-refresh]')) {
      environment.EON_CITY_COMMAND_HUB_RUNTIME?.refreshLivingNexus?.('dock-refresh');
    }
  };

  const onView = (event) => {
    const next = event?.detail?.view;
    if (!next || disposed) return;
    currentView = next;
    render(root, currentView, selectedRingId);
  };

  root.addEventListener('click', onClick);
  environment.addEventListener?.(EON_CITY_W749_VIEW_EVENT, onView);
  const refreshAfterMount = () => environment.EON_CITY_COMMAND_HUB_RUNTIME?.refreshLivingNexus?.('nexus-dock-mounted');
  if (typeof environment.queueMicrotask === 'function') environment.queueMicrotask(refreshAfterMount);
  else Promise.resolve().then(refreshAfterMount);
  return freeze({
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener('click', onClick);
      environment.removeEventListener?.(EON_CITY_W749_VIEW_EVENT, onView);
    }
  });
}

export default mountEonWorkSurface;
