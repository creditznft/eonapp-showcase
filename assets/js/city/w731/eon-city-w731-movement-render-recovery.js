/**
 * Bounded recovery for a browser that has retained Babylon's render callback
 * registration but stopped scheduling frames. This owns no renderer and never
 * executes a frame itself: callers restart the existing named callback through
 * Babylon's public stopRenderLoop/runRenderLoop API.
 */
const freeze = (value) => Object.freeze(value);

export function createEonCityW731MovementRenderRecovery({
  now = () => Date.now(),
  setTimer = (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimer = (handle) => globalThis.clearTimeout(handle),
  staleThresholdMs = 80,
  cooldownMs = 260,
  followUpDelaysMs = [80, 200],
  wakeImmediately = false,
  getState = () => ({}),
  restartRenderLoop = () => false
} = {}) {
  const timers = new Set();
  let active = false;
  let destroyed = false;
  let lastRenderCallbackAt = 0;
  let lastReliabilityRenderAcceptedAt = 0;
  let lastMovementUpdateAt = 0;
  let lastSceneRenderAt = 0;
  let lastAcceptedMovementInputAt = 0;
  let lastRenderLoopRestartAt = 0;
  let renderLoopRestartCount = 0;
  let renderLoopRestartReason = '';
  let watchdogCheckCount = 0;
  let currentStallClass = 'none';

  const cancel = (reason = 'cancelled') => {
    for (const handle of timers) clearTimer(handle);
    timers.clear();
    if (reason !== 'movement-activated') renderLoopRestartReason = renderLoopRestartReason || String(reason);
  };

  const guardedStallClass = () => {
    const state = getState() || {};
    if (destroyed || state.destroyed) return 'runtime-destroyed';
    if (!state.engine || !state.scene) return 'runtime-unavailable';
    if (state.documentHidden || state.documentVisible === false) return 'document-hidden';
    if (state.contextLost) return 'context-lost';
    if (state.manualPaused) return 'manual-pause';
    if (state.workSurfaceOpen) return 'work-surface-open';
    if (state.cityMenuOpen) return 'city-menu-open';
    if (!active || !state.axisActive) return 'none';
    const at = now();
    if (at - lastRenderCallbackAt <= staleThresholdMs) {
      if (lastMovementUpdateAt < lastAcceptedMovementInputAt) return 'movement-gate-blocked';
      if (lastReliabilityRenderAcceptedAt < lastAcceptedMovementInputAt) return 'reliability-suppressed';
      return 'none';
    }
    return 'callback-not-scheduled';
  };

  const check = (reason = 'movement-watchdog') => {
    watchdogCheckCount += 1;
    const stallClass = guardedStallClass();
    currentStallClass = stallClass;
    if (stallClass !== 'callback-not-scheduled') return false;
    const at = now();
    if (at - lastRenderLoopRestartAt < cooldownMs) return false;
    const restarted = Boolean(restartRenderLoop({ reason, at }));
    if (!restarted) return false;
    lastRenderLoopRestartAt = at;
    renderLoopRestartCount += 1;
    renderLoopRestartReason = reason;
    return true;
  };

  const schedule = (delay, reason) => {
    const handle = setTimer(() => {
      timers.delete(handle);
      if (active && !destroyed) check(reason);
    }, delay);
    timers.add(handle);
  };

  const activate = ({ source = 'external', reason = 'movement-activated' } = {}) => {
    if (destroyed || active) return false;
    active = true;
    lastAcceptedMovementInputAt = now();
    const activationReason = `${reason}:${String(source).slice(0, 64)}`;
    renderLoopRestartReason = activationReason;
    const restartedForStall = check(activationReason);
    // Some browsers retain a recently-called callback but lose its pending
    // animation handle immediately afterwards. Runtime use opts into this one
    // public re-registration at an actual input transition; the default stays
    // strictly stale-only for isolated controller consumers.
    if (wakeImmediately && !restartedForStall && guardedStallClass() === 'none') {
      const at = now();
      if (at - lastRenderLoopRestartAt >= cooldownMs && restartRenderLoop({ reason: `${activationReason}:input-wake`, at })) {
        lastRenderLoopRestartAt = at;
        renderLoopRestartCount += 1;
        renderLoopRestartReason = `${activationReason}:input-wake`;
      }
    }
    for (const delay of followUpDelaysMs) schedule(delay, activationReason);
    return true;
  };

  const deactivate = (reason = 'movement-inactive') => {
    active = false;
    cancel(reason);
  };

  return freeze({
    activate,
    deactivate,
    cancel,
    destroy() { destroyed = true; deactivate('runtime-destroyed'); },
    resetHeartbeats() {
      lastRenderCallbackAt = 0;
      lastReliabilityRenderAcceptedAt = 0;
      lastMovementUpdateAt = 0;
      lastSceneRenderAt = 0;
      currentStallClass = 'none';
    },
    noteRenderCallback(at = now()) { lastRenderCallbackAt = Number(at) || 0; },
    noteReliabilityRenderAccepted(at = now()) { lastReliabilityRenderAcceptedAt = Number(at) || 0; },
    noteMovementUpdate(at = now()) { lastMovementUpdateAt = Number(at) || 0; },
    noteSceneRender(at = now()) { lastSceneRenderAt = Number(at) || 0; },
    getSnapshot() {
      return freeze({
        stableRenderCallback: true,
        lastRenderCallbackAt,
        lastReliabilityRenderAcceptedAt,
        lastMovementUpdateAt,
        lastSceneRenderAt,
        lastAcceptedMovementInputAt,
        lastRenderLoopRestartAt,
        renderLoopRestartCount,
        renderLoopRestartReason,
        watchdogScheduled: timers.size > 0,
        watchdogCheckCount,
        staleThresholdMs,
        cooldownMs,
        currentStallClass
      });
    }
  });
}
