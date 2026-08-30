/**
 * W766A — canonical Command Hub ↔ Expanse world-mode authority.
 *
 * Pure state authority only. It never creates an Engine, Scene, canvas or
 * render loop. The active Babylon runtime owns all visual mounting.
 */
export const EON_CITY_W766A_WORLD_MODE_SCHEMA = 'eon.city.expanse-world-mode.w766a.v1';
export const EON_CITY_W766A_MODES = Object.freeze({
  COMMAND_HUB: 'COMMAND_HUB',
  EXPANSE_ENTRY_REVIEW: 'EXPANSE_ENTRY_REVIEW',
  EXPANSE_LOADING: 'EXPANSE_LOADING',
  EXPANSE_ACTIVE: 'EXPANSE_ACTIVE',
  RETURNING_TO_HUB: 'RETURNING_TO_HUB',
  HUB_RESTORING: 'HUB_RESTORING'
});

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const text = (value, fallback = '') => String(value ?? fallback).slice(0, 160);
const copyPoint = (value = {}) => freeze({ x: finite(value.x), y: finite(value.y), z: finite(value.z) });

function sanitizeMissionSnapshot(missionState = null) {
  if (!missionState || typeof missionState !== 'object') return null;
  const completedMissions = freeze([...new Set((Array.isArray(missionState.completedMissions) ? missionState.completedMissions : []).map((value) => text(value)).filter(Boolean))].slice(0, 32));
  return freeze({
    activeMissionId: text(missionState.activeMissionId),
    currentObjective: text(missionState.currentObjective || missionState?.missions?.[missionState.activeMissionId]?.currentObjective),
    completedMissions,
    totalXp: Math.max(0, finite(missionState.totalXp, 0)),
    currentLevel: Math.max(1, Math.min(99, Math.floor(finite(missionState.currentLevel, 1))))
  });
}

export function createEonCityW766AReturnSnapshot({ player = {}, camera = {}, selectedWorkspace = '', missionState = null, inputState = {}, graphicsProfile = 'balanced', capturedAt = Date.now() } = {}) {
  return freeze({
    schema: `${EON_CITY_W766A_WORLD_MODE_SCHEMA}.return-snapshot.v1`,
    player: freeze({ position: copyPoint(player.position || player), heading: finite(player.heading ?? player.rotationY) }),
    camera: freeze({ alpha: finite(camera.alpha), beta: finite(camera.beta), radius: finite(camera.radius), target: copyPoint(camera.target), mode: text(camera.mode, 'follow') }),
    selectedWorkspace: text(selectedWorkspace),
    missionState: sanitizeMissionSnapshot(missionState),
    inputState: freeze({ movementCleared: true, pointerLockReleased: true, source: text(inputState.source, 'expanse-entry') }),
    graphicsProfile: ['lite', 'balanced', 'cinematic'].includes(String(graphicsProfile)) ? String(graphicsProfile) : 'balanced',
    capturedAt: Math.max(0, finite(capturedAt, Date.now())),
    privateContentStored: false
  });
}

export function validateEonCityW766AReturnSnapshot(snapshot = {}) {
  const errors = [];
  if (snapshot?.schema !== `${EON_CITY_W766A_WORLD_MODE_SCHEMA}.return-snapshot.v1`) errors.push('schema-invalid');
  if (!Number.isFinite(snapshot?.player?.position?.x) || !Number.isFinite(snapshot?.player?.position?.z)) errors.push('player-position-invalid');
  if (!snapshot?.inputState?.movementCleared || !snapshot?.inputState?.pointerLockReleased) errors.push('input-snapshot-unsafe');
  if (snapshot?.privateContentStored) errors.push('private-content-stored');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function createEonCityW766AWorldModeController({ now = Date.now, onChange = null } = {}) {
  let state = freeze({
    schema: EON_CITY_W766A_WORLD_MODE_SCHEMA,
    mode: EON_CITY_W766A_MODES.COMMAND_HUB,
    reviewed: false,
    loadingProgress: 0,
    returnSnapshot: null,
    failure: null,
    changedAt: now(),
    oneEngine: true,
    oneScene: true,
    oneRenderLoop: true,
    automaticEntry: false
  });

  const publish = (patch, reason) => {
    state = freeze({ ...state, ...patch, changedAt: now(), reason: text(reason) });
    onChange?.(state);
    return state;
  };
  const reject = (reason) => freeze({ ok: false, reason, state });

  return freeze({
    getState: () => state,
    review: ({ explicitUserAction = false } = {}) => {
      if (!explicitUserAction) return reject('explicit-review-required');
      if (state.mode !== EON_CITY_W766A_MODES.COMMAND_HUB && state.mode !== EON_CITY_W766A_MODES.EXPANSE_ENTRY_REVIEW) return reject('review-not-available');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.EXPANSE_ENTRY_REVIEW, reviewed: true, failure: null }, 'gateway-reviewed') });
    },
    cancelReview: ({ explicitUserAction = false, safeNavigationAway = false } = {}) => {
      if (!explicitUserAction && !safeNavigationAway) return reject('explicit-cancel-required');
      if (state.mode !== EON_CITY_W766A_MODES.EXPANSE_ENTRY_REVIEW) return reject('review-not-active');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.COMMAND_HUB, reviewed: false, loadingProgress: 0 }, safeNavigationAway ? 'gateway-review-cancelled-by-navigation' : 'gateway-review-cancelled') });
    },
    beginEntry: ({ snapshot, explicitUserAction = false } = {}) => {
      if (!explicitUserAction) return reject('explicit-entry-required');
      if (state.mode !== EON_CITY_W766A_MODES.EXPANSE_ENTRY_REVIEW || !state.reviewed) return reject('gateway-review-required');
      const validation = validateEonCityW766AReturnSnapshot(snapshot);
      if (!validation.ok) return reject(`return-snapshot-invalid:${validation.errors.join(',')}`);
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.EXPANSE_LOADING, returnSnapshot: snapshot, loadingProgress: 0, failure: null }, 'expanse-entry-confirmed') });
    },
    // My Frontier has an explicitly opted-in starter route. It is distinct from
    // Signal Frontier: the caller must still hold a real starter-access receipt
    // before it can use this transition, while Signal and Storm remain review-gated.
    beginStarterEntry: ({ snapshot, explicitUserAction = false } = {}) => {
      if (!explicitUserAction) return reject('explicit-entry-required');
      if (state.mode !== EON_CITY_W766A_MODES.COMMAND_HUB) return reject('starter-entry-not-available');
      const validation = validateEonCityW766AReturnSnapshot(snapshot);
      if (!validation.ok) return reject(`return-snapshot-invalid:${validation.errors.join(',')}`);
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.EXPANSE_LOADING, reviewed: false, returnSnapshot: snapshot, loadingProgress: 0, failure: null }, 'my-frontier-starter-entry-confirmed') });
    },
    reportLoading: (progress = 0) => {
      if (state.mode !== EON_CITY_W766A_MODES.EXPANSE_LOADING) return reject('expanse-not-loading');
      const loadingProgress = Math.max(0, Math.min(1, finite(progress)));
      return freeze({ ok: true, state: publish({ loadingProgress }, 'expanse-loading-progress') });
    },
    activate: ({ mountedInCanonicalScene = false } = {}) => {
      if (state.mode !== EON_CITY_W766A_MODES.EXPANSE_LOADING) return reject('expanse-not-loading');
      if (!mountedInCanonicalScene || state.loadingProgress < 1) return reject('canonical-scene-mount-incomplete');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.EXPANSE_ACTIVE, loadingProgress: 1 }, 'expanse-active') });
    },
    // The Babylon runtime remains the authority for whether a World is visibly
    // mounted. This deliberately narrow recovery exists for an interrupted UI
    // handoff: it may restore the controller only when the runtime proves a
    // canonical World is still active and the original safe Hub snapshot exists.
    // It cannot create a World, replace the snapshot, or bypass explicit input.
    reconcileActiveWorld: ({ explicitUserAction = false, canonicalSceneMounted = false } = {}) => {
      if (!explicitUserAction) return reject('explicit-world-reconciliation-required');
      if (state.mode === EON_CITY_W766A_MODES.EXPANSE_ACTIVE) return freeze({ ok: true, reconciled: false, state });
      if (!canonicalSceneMounted) return reject('canonical-world-presentation-required');
      const validation = validateEonCityW766AReturnSnapshot(state.returnSnapshot || {});
      if (!validation.ok) return reject(`return-snapshot-invalid:${validation.errors.join(',')}`);
      return freeze({ ok: true, reconciled: true, state: publish({ mode: EON_CITY_W766A_MODES.EXPANSE_ACTIVE, reviewed: false, loadingProgress: 1, failure: null }, 'runtime-world-authority-reconciled') });
    },
    requestReturn: ({ explicitUserAction = false } = {}) => {
      if (!explicitUserAction) return reject('explicit-return-required');
      if (state.mode !== EON_CITY_W766A_MODES.EXPANSE_ACTIVE) return reject('expanse-not-active');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.RETURNING_TO_HUB }, 'return-requested') });
    },
    beginHubRestore: ({ expanseDisposed = false, expanseSuspended = false } = {}) => {
      if (state.mode !== EON_CITY_W766A_MODES.RETURNING_TO_HUB) return reject('return-not-active');
      if (!expanseDisposed && !expanseSuspended) return reject('expanse-suspension-or-disposal-required');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.HUB_RESTORING }, expanseSuspended ? 'hub-restoring-from-suspended-world' : 'hub-restoring') });
    },
    completeHubRestore: ({ snapshotRestored = false } = {}) => {
      if (state.mode !== EON_CITY_W766A_MODES.HUB_RESTORING) return reject('hub-restore-not-active');
      if (!snapshotRestored) return reject('return-snapshot-restore-required');
      return freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.COMMAND_HUB, reviewed: false, loadingProgress: 0, returnSnapshot: null, failure: null }, 'hub-restored') });
    },
    failSafeToHub: (reason = 'unknown') => freeze({ ok: true, state: publish({ mode: EON_CITY_W766A_MODES.COMMAND_HUB, reviewed: false, loadingProgress: 0, returnSnapshot: null, failure: text(reason) }, 'fail-safe-to-hub') })
  });
}

export function validateEonCityW766AWorldModeState(state = {}) {
  const errors = [];
  if (state?.schema !== EON_CITY_W766A_WORLD_MODE_SCHEMA) errors.push('schema-invalid');
  if (!Object.values(EON_CITY_W766A_MODES).includes(state?.mode)) errors.push('mode-invalid');
  if (!state?.oneEngine || !state?.oneScene || !state?.oneRenderLoop) errors.push('runtime-ownership-invalid');
  if (state?.automaticEntry) errors.push('automatic-entry-forbidden');
  if ([EON_CITY_W766A_MODES.EXPANSE_LOADING, EON_CITY_W766A_MODES.EXPANSE_ACTIVE, EON_CITY_W766A_MODES.RETURNING_TO_HUB, EON_CITY_W766A_MODES.HUB_RESTORING].includes(state?.mode) && !state?.returnSnapshot) errors.push('return-snapshot-required');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}
