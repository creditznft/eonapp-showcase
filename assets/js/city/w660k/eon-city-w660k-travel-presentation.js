/**
 * W660K — truthful district transition presentation.
 *
 * This module only presents local loading state. It does not own travel,
 * network requests, the Babylon scene, player state, routes, or receipts.
 */
export const EON_CITY_W660K_TRAVEL_PRESENTATION_SCHEMA = 'eon.city.w660k.travel-presentation.v1';

const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const now = (environment) => Number(environment?.performance?.now?.() ?? Date.now());

export function describeEonCityW660kTravelTiming(elapsedMs = 0) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  if (elapsed < 1_200) return freeze({ phase: 'core', progress: 24, detail: 'Switching the active district composition and arrival camera.' });
  if (elapsed < 4_500) return freeze({ phase: 'assets', progress: 52, detail: 'Streaming the district landmark, characters and functional stations.' });
  if (elapsed < 9_000) return freeze({ phase: 'first-visit', progress: 74, detail: 'First-visit assets are still arriving. Cached visits should be faster.' });
  return freeze({ phase: 'slow', progress: 86, detail: 'The lightweight district is ready while detailed assets continue loading.' });
}

export function createEonCityW660kTravelPresentation(root, { environment = globalThis } = {}) {
  const overlay = root?.querySelector?.('[data-eon-w660k-travel-transition]');
  const destination = overlay?.querySelector?.('[data-eon-w660k-travel-destination]');
  const detail = overlay?.querySelector?.('[data-eon-w660k-travel-detail]');
  const elapsedNode = overlay?.querySelector?.('[data-eon-w660k-travel-elapsed]');
  const progress = overlay?.querySelector?.('[data-eon-w660k-travel-progress]');
  const continueButton = overlay?.querySelector?.('[data-eon-w660k-travel-continue]');
  const arrival = root?.querySelector?.('[data-eon-w660k-arrival-toast]');
  const arrivalTitle = arrival?.querySelector?.('[data-eon-w660k-arrival-title]');
  const arrivalDetail = arrival?.querySelector?.('[data-eon-w660k-arrival-detail]');
  let startedAt = 0;
  let ticker = null;
  let arrivalTimer = null;
  let activeDestination = '';
  let state = 'idle';

  const setProgress = (value) => {
    const resolved = clamp(value, 0, 100);
    if (progress) {
      progress.style.setProperty('--eon-city-travel-progress', `${resolved}%`);
      progress.setAttribute('aria-valuenow', String(Math.round(resolved)));
    }
    return resolved;
  };

  const refresh = () => {
    if (!startedAt || state !== 'loading') return;
    const elapsedMs = Math.max(0, now(environment) - startedAt);
    const timing = describeEonCityW660kTravelTiming(elapsedMs);
    if (elapsedNode) elapsedNode.textContent = `${(elapsedMs / 1000).toFixed(1)} s`;
    if (detail) detail.textContent = timing.detail;
    setProgress(timing.progress);
    if (overlay) overlay.dataset.eonW660kTravelPhase = timing.phase;
    if (continueButton) continueButton.hidden = elapsedMs < 4_500;
  };

  const stopTicker = () => {
    if (ticker != null) environment?.clearInterval?.(ticker);
    ticker = null;
  };

  const hideOverlay = () => {
    stopTicker();
    if (overlay) overlay.hidden = true;
    root?.classList?.remove?.('eon-city-traveling');
  };

  const showArrival = ({ label = activeDestination || 'District', elapsedMs = 0, degraded = false, detailText = '' } = {}) => {
    if (!arrival) return;
    if (arrivalTimer != null) environment?.clearTimeout?.(arrivalTimer);
    arrival.hidden = false;
    arrival.dataset.eonW660kArrivalState = degraded ? 'degraded' : 'ready';
    if (arrivalTitle) arrivalTitle.textContent = `${label} online`;
    if (arrivalDetail) arrivalDetail.textContent = detailText || `${(Math.max(0, elapsedMs) / 1000).toFixed(1)} s · ${degraded ? 'Lightweight composition active; detailed assets continue.' : 'Landmark, camera and district systems are ready.'}`;
    arrivalTimer = environment?.setTimeout?.(() => { if (arrival) arrival.hidden = true; }, 4_200) ?? null;
  };

  const begin = ({ label = 'District', accent = '#69e7ff', warm = '#f4b860' } = {}) => {
    activeDestination = String(label || 'District');
    state = 'loading';
    startedAt = now(environment);
    if (overlay) {
      overlay.hidden = false;
      overlay.dataset.eonW660kTravelState = 'loading';
      overlay.dataset.eonW660kTravelPhase = 'core';
      overlay.style.setProperty('--eon-city-travel-accent', accent || '#69e7ff');
      overlay.style.setProperty('--eon-city-travel-warm', warm || '#f4b860');
    }
    root?.classList?.add?.('eon-city-traveling');
    if (destination) destination.textContent = activeDestination;
    if (detail) detail.textContent = 'Switching the active district composition and arrival camera.';
    if (elapsedNode) elapsedNode.textContent = '0.0 s';
    if (continueButton) continueButton.hidden = true;
    setProgress(12);
    stopTicker();
    ticker = environment?.setInterval?.(refresh, 180) ?? null;
    refresh();
    return getSnapshot();
  };

  const stage = ({ id = 'assets', detailText = '', progressValue = 50 } = {}) => {
    if (state !== 'loading') return getSnapshot();
    if (overlay) overlay.dataset.eonW660kTravelPhase = String(id || 'assets');
    if (detail && detailText) detail.textContent = String(detailText);
    setProgress(progressValue);
    return getSnapshot();
  };

  const complete = ({ label = activeDestination, elapsedMs = null, degraded = false, detailText = '' } = {}) => {
    const resolvedElapsed = elapsedMs == null ? Math.max(0, now(environment) - startedAt) : Math.max(0, Number(elapsedMs) || 0);
    state = degraded ? 'degraded' : 'ready';
    if (overlay) overlay.dataset.eonW660kTravelState = state;
    if (detail) detail.textContent = degraded ? 'District core is ready. Detailed assets continue progressively.' : 'District landmark, camera, terminals and resident assets are ready.';
    if (elapsedNode) elapsedNode.textContent = `${(resolvedElapsed / 1000).toFixed(1)} s`;
    setProgress(100);
    stopTicker();
    environment?.setTimeout?.(() => hideOverlay(), 520);
    showArrival({ label, elapsedMs: resolvedElapsed, degraded, detailText });
    return freeze({ ...getSnapshot(), elapsedMs: resolvedElapsed });
  };

  const fail = ({ label = activeDestination, reason = 'district-load-stopped' } = {}) => {
    state = 'failed';
    stopTicker();
    if (overlay) overlay.dataset.eonW660kTravelState = 'failed';
    if (destination) destination.textContent = `${label} needs attention`;
    if (detail) detail.textContent = `Travel stopped safely: ${String(reason || 'district-load-stopped').replaceAll('-', ' ')}.`;
    if (continueButton) continueButton.hidden = false;
    setProgress(100);
    return getSnapshot();
  };

  const getSnapshot = () => freeze({
    schema: EON_CITY_W660K_TRAVEL_PRESENTATION_SCHEMA,
    state,
    destination: activeDestination,
    elapsedMs: startedAt ? Math.max(0, now(environment) - startedAt) : 0,
    visible: Boolean(overlay && !overlay.hidden),
    localOnly: true,
    ownsTravel: false,
    ownsRenderLoop: false
  });

  const onContinue = () => hideOverlay();
  continueButton?.addEventListener?.('click', onContinue);

  return freeze({
    begin,
    stage,
    complete,
    fail,
    hide: hideOverlay,
    getSnapshot,
    dispose() {
      stopTicker();
      if (arrivalTimer != null) environment?.clearTimeout?.(arrivalTimer);
      continueButton?.removeEventListener?.('click', onContinue);
      hideOverlay();
      if (arrival) arrival.hidden = true;
      state = 'disposed';
      return getSnapshot();
    }
  });
}

export default freeze({
  EON_CITY_W660K_TRAVEL_PRESENTATION_SCHEMA,
  describeEonCityW660kTravelTiming,
  createEonCityW660kTravelPresentation
});
