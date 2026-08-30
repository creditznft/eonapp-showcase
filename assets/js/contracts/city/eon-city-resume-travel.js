/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/eon-city-resume-travel.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W559 — local City resume and map travel continuity.
 *
 * This module stores only a tightly normalised local camera/player pose and a
 * static public landmark id. It never stores a project id, task, prompt, file,
 * account attribute, route, provider state, credential, or remote location.
 * Resume and map travel always require a visible user action; pointer lock is
 * never restored programmatically.
 */
import { CITY_LANDMARKS } from './city-landmark-registry.js';
import { normalizeEonCityExplorationPose } from './eon-city-exploration-pose.js';

export const EON_CITY_RESUME_TRAVEL_SCHEMA = 'eon.city.resume-travel.w559.v1';
export const EON_CITY_RESUME_STATE_KEY = 'eon:city:world-state:resume:v1';
export const EON_CITY_RESUME_STATE_VERSION = 1;
export const EON_CITY_RESUME_WORLD_BOUNDARY = 13;

const MAX_PLAYER_Y = 2;
const MAX_CAMERA_RADIUS = 40;
const MAX_CAMERA_ALPHA = Math.PI * 12;
const MAX_HEADING = Math.PI * 4;
const ALLOWED_REASONS = new Set([
  'explicit-map-travel',
  'explicit-resume',
  'explicit-arrival-reset',
  'local-workroom-return',
  'local-page-exit',
  'local-runtime-dispose',
  'local-city-pause'
]);

const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeGet(storage, key) {
  try { return storage?.getItem?.(key) ?? null; } catch { return null; }
}

function safeSet(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function') return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeJson(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function iso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function normalizeTimestamp(value, now = Date.now()) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : iso(now);
}

export function getEonCityTravelDestinations() {
  return freeze(CITY_LANDMARKS
    .filter((landmark) => landmark?.action && landmark?.play)
    .map((landmark) => freeze({
      id: String(landmark.id),
      districtId: String(landmark.districtId),
      label: String(landmark.name),
      detail: String(landmark.description),
      x: Number(landmark.play.x),
      z: Number(landmark.play.z),
      radius: Number(landmark.play.radius),
      localOnly: true,
      opensRoute: false,
      executesWork: false,
      containsPrivateWork: false
    })));
}

function destinationFor(value = '') {
  const id = String(value || '').trim();
  return getEonCityTravelDestinations().find((destination) => destination.id === id) || null;
}

function normalizeBoundedPose(value = {}) {
  const pose = normalizeEonCityExplorationPose(value);
  if (!pose) return null;
  const controller = pose.controller
    ? freeze({ mode: 'third-person', pointerLookEnabled: Boolean(pose.controller.pointerLookEnabled) })
    : null;
  const normalized = {
    schema: pose.schema,
    player: freeze({
      x: clamp(pose.player.x, -EON_CITY_RESUME_WORLD_BOUNDARY, EON_CITY_RESUME_WORLD_BOUNDARY),
      y: clamp(pose.player.y, -0.5, MAX_PLAYER_Y),
      z: clamp(pose.player.z, -EON_CITY_RESUME_WORLD_BOUNDARY, EON_CITY_RESUME_WORLD_BOUNDARY),
      heading: clamp(finite(pose.player.heading), -MAX_HEADING, MAX_HEADING)
    }),
    camera: freeze({
      alpha: clamp(finite(pose.camera.alpha), -MAX_CAMERA_ALPHA, MAX_CAMERA_ALPHA),
      beta: clamp(finite(pose.camera.beta), 0.01, Math.PI - 0.01),
      radius: clamp(finite(pose.camera.radius), 0.1, MAX_CAMERA_RADIUS),
      target: freeze({
        x: clamp(pose.camera.target.x, -EON_CITY_RESUME_WORLD_BOUNDARY, EON_CITY_RESUME_WORLD_BOUNDARY),
        y: clamp(pose.camera.target.y, -0.5, MAX_PLAYER_Y + 4),
        z: clamp(pose.camera.target.z, -EON_CITY_RESUME_WORLD_BOUNDARY, EON_CITY_RESUME_WORLD_BOUNDARY)
      })
    })
  };
  if (controller) normalized.controller = controller;
  return freeze(normalized);
}

function normalizeReason(value = '') {
  const reason = String(value || '').trim();
  return ALLOWED_REASONS.has(reason) ? reason : 'local-page-exit';
}

/**
 * Normalises a W559 record into the only durable City resume fields. Unknown
 * source properties are deliberately dropped instead of recursively redacted.
 */
export function normalizeEonCityResumeState(value = {}, { now = Date.now() } = {}) {
  const source = asObject(value);
  if (source.schema !== EON_CITY_RESUME_TRAVEL_SCHEMA) return null;
  const pose = normalizeBoundedPose(source.pose);
  if (!pose) return null;
  const destination = destinationFor(source.lastDestinationId);
  return freeze({
    schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
    version: EON_CITY_RESUME_STATE_VERSION,
    updatedAt: normalizeTimestamp(source.updatedAt, now),
    lastDestinationId: destination?.id || null,
    reason: normalizeReason(source.reason),
    pose,
    localOnly: true,
    remoteNetwork: false,
    automaticCrossDeviceSync: false,
    pointerLockRestored: false,
    privateWorkIncluded: false,
    routeOpened: false
  });
}

export function readEonCityResumeState({ storage = safeStorage(), now = Date.now() } = {}) {
  return normalizeEonCityResumeState(safeJson(safeGet(storage, EON_CITY_RESUME_STATE_KEY)), { now });
}

export function persistEonCityResumeState({ pose = null, lastDestinationId = null, reason = 'local-page-exit' } = {}, { storage = safeStorage(), now = Date.now() } = {}) {
  const next = normalizeEonCityResumeState({
    schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
    version: EON_CITY_RESUME_STATE_VERSION,
    updatedAt: iso(now),
    lastDestinationId,
    reason,
    pose
  }, { now });
  if (!next) return freeze({ ok: false, error: 'city-resume-pose-required', state: null });
  const written = safeSet(storage, EON_CITY_RESUME_STATE_KEY, JSON.stringify(next));
  return freeze({
    ok: written,
    error: written ? null : 'city-resume-storage-unavailable',
    state: next,
    localOnly: true,
    remoteNetwork: false,
    automaticCrossDeviceSync: false
  });
}

export function clearEonCityResumeState({ storage = safeStorage(), explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required' });
  const removed = safeRemove(storage, EON_CITY_RESUME_STATE_KEY);
  return freeze({ ok: removed, error: removed ? null : 'city-resume-storage-unavailable', localOnly: true, remoteNetwork: false });
}

export function prepareEonCityMapTravel(destinationId = '', { explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required' });
  const destination = destinationFor(destinationId);
  if (!destination) return freeze({ ok: false, error: 'city-travel-destination-required' });
  return freeze({
    ok: true,
    destination,
    localOnly: true,
    opensRoute: false,
    executesWork: false,
    remoteNetwork: false,
    automaticTeleport: false
  });
}

export function prepareEonCityResume(state = null, { explicitUserAction = false, now = Date.now() } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required' });
  const normalized = normalizeEonCityResumeState(state, { now });
  if (!normalized) return freeze({ ok: false, error: 'city-resume-state-unavailable' });
  return freeze({
    ok: true,
    state: normalized,
    localOnly: true,
    remoteNetwork: false,
    pointerLockRestored: false,
    automaticTeleport: false
  });
}

/** Applies only a public static landmark focus after an explicit person action. */
export function applyEonCityMapTravel(runtime = null, destinationId = '', options = {}) {
  const plan = prepareEonCityMapTravel(destinationId, options);
  if (!plan.ok) return plan;
  if (!runtime || typeof runtime.focusLandmark !== 'function' || typeof runtime.getExplorationPose !== 'function') {
    return freeze({ ok: false, error: 'city-runtime-unavailable' });
  }
  const focused = runtime.focusLandmark(plan.destination.id);
  if (!focused) return freeze({ ok: false, error: 'city-travel-focus-failed' });
  const persisted = persistEonCityResumeState({
    pose: runtime.getExplorationPose(),
    lastDestinationId: plan.destination.id,
    reason: 'explicit-map-travel'
  }, options);
  return freeze({
    ok: persisted.ok,
    error: persisted.error,
    destination: plan.destination,
    state: persisted.state,
    localOnly: true,
    opensRoute: false,
    executesWork: false,
    remoteNetwork: false
  });
}

/** Restores an exact local pose only when the person explicitly selects Resume. */
export function applyEonCityResume(runtime = null, options = {}) {
  const state = readEonCityResumeState(options);
  const plan = prepareEonCityResume(state, options);
  if (!plan.ok) return plan;
  if (!runtime || typeof runtime.restoreExplorationPose !== 'function' || typeof runtime.getExplorationPose !== 'function') {
    return freeze({ ok: false, error: 'city-runtime-unavailable' });
  }
  const restored = runtime.restoreExplorationPose(plan.state.pose);
  if (!restored) return freeze({ ok: false, error: 'city-resume-restore-failed' });
  const persisted = persistEonCityResumeState({
    pose: runtime.getExplorationPose(),
    lastDestinationId: plan.state.lastDestinationId,
    reason: 'explicit-resume'
  }, options);
  return freeze({
    ok: persisted.ok,
    error: persisted.error,
    state: persisted.state,
    localOnly: true,
    remoteNetwork: false,
    pointerLockRestored: false,
    routeOpened: false
  });
}

/** Captures a bounded local snapshot on page exit, pause or same-tab return. */
export function captureEonCityResumeFromRuntime(runtime = null, { lastDestinationId = undefined, reason = 'local-runtime-dispose', ...options } = {}) {
  if (!runtime || typeof runtime.getExplorationPose !== 'function') return freeze({ ok: false, error: 'city-runtime-unavailable', state: null });
  let pose = null;
  try { pose = runtime.getExplorationPose(); } catch {}
  const existing = readEonCityResumeState(options);
  const destinationId = lastDestinationId === undefined
    ? existing?.lastDestinationId || null
    : destinationFor(lastDestinationId)?.id || null;
  return persistEonCityResumeState({
    pose,
    lastDestinationId: destinationId,
    reason
  }, options);
}

export function getEonCityResumeTruth({ storage = safeStorage(), now = Date.now() } = {}) {
  const state = readEonCityResumeState({ storage, now });
  return freeze({
    schema: EON_CITY_RESUME_TRAVEL_SCHEMA,
    statePresent: Boolean(state),
    storageKey: EON_CITY_RESUME_STATE_KEY,
    localOnly: true,
    encryptedExportEligible: true,
    automaticCrossDeviceSync: false,
    remoteNetwork: false,
    privateWorkIncluded: false,
    pointerLockRestored: false,
    mapTravelRequiresExplicitUserAction: true,
    resumeRequiresExplicitUserAction: true
  });
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

export function renderEonCityTravelResume() {
  const destinationCards = getEonCityTravelDestinations().map((destination) => `<button type="button" data-eon-play-travel-destination="${escapeHtml(destination.id)}"><strong>${escapeHtml(destination.label)}</strong><span>${escapeHtml(destination.detail)}</span><small>Focus locally · no route opens</small></button>`).join('');
  return `
    <section class="eon-play-command-deck-panel eon-play-travel-panel" data-eon-play-travel-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-travel-title">
      <div class="eon-play-command-deck-card">
        <p class="eon-play-kicker">EON City · local travel map</p>
        <h2 id="eon-play-travel-title">Choose a public City landmark</h2>
        <p>Travel focuses a public landmark inside this browser. It does not open a route, read private work, start an AI job, or change a membership.</p>
        <div class="eon-play-command-deck-grid eon-play-travel-grid">${destinationCards}</div>
        <p class="eon-play-command-deck-note">The City pauses while this map is open and returns to the same local view until you choose a destination.</p>
        <button type="button" data-eon-play-close-travel-map>Return to City</button>
      </div>
    </section>
    <section class="eon-play-command-deck-panel eon-play-resume-panel" data-eon-play-resume-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-resume-title">
      <div class="eon-play-command-deck-card">
        <p class="eon-play-kicker">EON City · local continuity</p>
        <h2 id="eon-play-resume-title">Continue from your last local view?</h2>
        <p data-eon-play-resume-detail>Your City location and camera are available only in this browser.</p>
        <p class="eon-play-command-deck-note">Resume restores City position and camera after your tap. Pointer look remains off until you choose it again. No project, prompt, file, account, or cloud data is included.</p>
        <div class="eon-play-command-deck-grid eon-play-resume-actions">
          <button type="button" data-eon-play-resume-continue>Continue locally</button>
          <button type="button" data-eon-play-resume-arrival>Start at Arrival Gate</button>
          <button type="button" data-eon-play-resume-clear>Clear saved view</button>
        </div>
      </div>
    </section>`;
}

/** Binds W559’s local map and explicit resume controls to a live City runtime. */
export function bindEonCityTravelResume(root, runtime, { workroomOverlay = null, onStatus = () => {}, storage = safeStorage(), now = () => Date.now() } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-travel-panel]');
  const openButtons = Array.from(root?.querySelectorAll?.('[data-eon-play-open-travel-map]') || []);
  const closeButton = panel?.querySelector?.('[data-eon-play-close-travel-map]');
  const destinationButtons = Array.from(panel?.querySelectorAll?.('[data-eon-play-travel-destination]') || []);
  const resumePanel = root?.querySelector?.('[data-eon-play-resume-panel]');
  const firstRunPanel = root?.querySelector?.('[data-eon-play-first-run-panel]');
  const resumeDetail = resumePanel?.querySelector?.('[data-eon-play-resume-detail]');
  const resumeContinue = resumePanel?.querySelector?.('[data-eon-play-resume-continue]');
  const resumeArrival = resumePanel?.querySelector?.('[data-eon-play-resume-arrival]');
  const resumeClear = resumePanel?.querySelector?.('[data-eon-play-resume-clear]');
  if (!panel || !closeButton || !resumePanel || !resumeContinue || !resumeArrival || !resumeClear || !openButtons.length || !workroomOverlay?.open || !workroomOverlay?.close) return () => {};

  let lastOpen = openButtons[0] || null;
  const resolvedNow = () => Number(now?.()) || Date.now();
  const report = (message) => { try { onStatus(String(message || '')); } catch {} };
  const capture = (reason, lastDestinationId = undefined) => captureEonCityResumeFromRuntime(runtime, {
    storage,
    now: resolvedNow(),
    reason,
    lastDestinationId
  });
  const refreshResume = () => {
    const state = readEonCityResumeState({ storage, now: resolvedNow() });
    resumePanel.hidden = !state;
    if (state && firstRunPanel && !firstRunPanel.hidden) firstRunPanel.hidden = true;
    if (state && resumeDetail) {
      const destination = destinationFor(state.lastDestinationId);
      resumeDetail.textContent = destination
        ? `A local view near ${destination.label} is available on this browser.`
        : 'A local City location and camera are available on this browser.';
    }
    return state;
  };
  const closeTravel = ({ reason = 'local-workroom-return', focus = true } = {}) => {
    panel.hidden = true;
    const result = workroomOverlay.close({ explicitUserAction: true, reason: 'city-travel-map-close' });
    if (result?.ok !== false) capture(reason);
    if (focus) lastOpen?.focus?.({ preventScroll: true });
    return result;
  };
  const showTravel = (trigger = null) => {
    if (trigger?.matches?.('[data-eon-play-open-travel-map]')) lastOpen = trigger;
    const result = workroomOverlay.open({ id: 'city-travel-map', explicitUserAction: true });
    if (result?.ok !== true) {
      report('The local City map could not open safely. City was not changed.');
      return;
    }
    panel.hidden = false;
    closeButton.focus({ preventScroll: true });
    report('Local City map is open. Choose a landmark or return to the same City view.');
  };
  const onOpen = (event) => showTravel(event.currentTarget);
  const onClose = () => {
    const result = closeTravel();
    if (result?.ok !== false) report('Returned to the same local City view.');
  };
  const onDestination = (event) => {
    const id = event.currentTarget?.dataset?.eonPlayTravelDestination || '';
    const close = closeTravel({ focus: false, reason: 'local-workroom-return' });
    if (close?.ok === false) {
      report('City travel was not started because the map could not close safely.');
      return;
    }
    const result = applyEonCityMapTravel(runtime, id, { storage, now: resolvedNow(), explicitUserAction: true });
    if (!result.ok) {
      report('That City landmark could not be focused. No route or work was opened.');
      return;
    }
    report(`${result.destination.label} is in local focus. No route or work was opened.`);
    refreshResume();
  };
  const onResume = () => {
    const result = applyEonCityResume(runtime, { storage, now: resolvedNow(), explicitUserAction: true });
    if (!result.ok) {
      report('Your saved local City view could not be restored. City remains at its current view.');
      refreshResume();
      return;
    }
    resumePanel.hidden = true;
    report('Your local City location and camera returned. Pointer look stays off until you choose it again.');
  };
  const onArrival = () => {
    const reset = runtime?.resetView?.();
    if (!reset) {
      report('Arrival Gate could not be restored in this browser. City state was not changed.');
      return;
    }
    capture('explicit-arrival-reset', null);
    resumePanel.hidden = true;
    report('City restarted at Arrival Gate locally. No work, route, or account data changed.');
  };
  const onClear = () => {
    const result = clearEonCityResumeState({ storage, explicitUserAction: true });
    if (!result.ok) {
      report('The saved local City view could not be cleared in this browser.');
      return;
    }
    resumePanel.hidden = true;
    report('Saved local City view cleared. Current City remains open.');
  };
  const onPanelClick = (event) => { if (event.target === panel) onClose(); };

  openButtons.forEach((button) => button.addEventListener('click', onOpen));
  closeButton.addEventListener('click', onClose);
  destinationButtons.forEach((button) => button.addEventListener('click', onDestination));
  panel.addEventListener('click', onPanelClick);
  resumeContinue.addEventListener('click', onResume);
  resumeArrival.addEventListener('click', onArrival);
  resumeClear.addEventListener('click', onClear);
  refreshResume();

  return () => {
    if (!panel.hidden) closeTravel({ focus: false, reason: 'local-workroom-return' });
    panel.hidden = true;
    resumePanel.hidden = true;
    openButtons.forEach((button) => button.removeEventListener('click', onOpen));
    closeButton.removeEventListener('click', onClose);
    destinationButtons.forEach((button) => button.removeEventListener('click', onDestination));
    panel.removeEventListener('click', onPanelClick);
    resumeContinue.removeEventListener('click', onResume);
    resumeArrival.removeEventListener('click', onArrival);
    resumeClear.removeEventListener('click', onClear);
  };
}
