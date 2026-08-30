/** W659F/W659H — deterministic boot gates: first frame is independent of streamed art. */
export const EON_CITY_W659F_BOOT_GATES_SCHEMA = 'eon.city.w659f.boot-gates.v2';
const freeze = (value) => Object.freeze(value);

export function createEonCityW659fBootGates({
  now = () => Date.now(),
  coreAssetDeadlineMs = 5200,
  orientationDeadlineMs = 7600
} = {}) {
  const startedAt = now();
  let rendererReady = false;
  let coreSettled = false;
  let coreDegraded = false;
  let playableReported = false;
  let deadlineReached = false;
  let orientationSettled = false;
  let orientationDegraded = false;
  let orientationDeadlineReached = false;
  const events = [];
  const record = (type, detail = '') => events.push(freeze({ type, detail: String(detail || ''), at: now() }));
  const snapshot = () => freeze({
    schema: EON_CITY_W659F_BOOT_GATES_SCHEMA,
    rendererReady,
    coreSettled,
    coreDegraded,
    deadlineReached,
    orientationSettled,
    orientationDegraded,
    orientationDeadlineReached,
    playable: rendererReady,
    playableReported,
    elapsedMs: Math.max(0, now() - startedAt),
    coreAssetDeadlineMs,
    orientationDeadlineMs,
    events: freeze(events.slice(-24))
  });
  const reportPlayable = () => {
    if (!rendererReady || playableReported) return false;
    playableReported = true;
    record('playable', coreSettled ? (coreDegraded ? 'core-degraded' : 'core-ready') : 'optional-core-still-streaming');
    return snapshot();
  };
  return freeze({
    rendererFirstFrame() {
      rendererReady = true;
      record('renderer-first-frame');
      return reportPlayable() || snapshot();
    },
    coreAssetsSettled({ degraded = false, reason = '' } = {}) {
      coreSettled = true;
      coreDegraded = Boolean(degraded);
      record('core-assets-settled', reason || (coreDegraded ? 'degraded' : 'ready'));
      return reportPlayable() || snapshot();
    },
    reachCoreDeadline(reason = 'bounded-core-deadline') {
      deadlineReached = true;
      if (!coreSettled) {
        coreSettled = true;
        coreDegraded = true;
        record('core-assets-deadline', reason);
      }
      return reportPlayable() || snapshot();
    },
    orientationAssetsSettled({ degraded = false, reason = '' } = {}) {
      orientationSettled = true;
      orientationDegraded = Boolean(degraded);
      record('orientation-assets-settled', reason || (orientationDegraded ? 'safe-fallback' : 'ready'));
      return snapshot();
    },
    reachOrientationDeadline(reason = 'bounded-orientation-deadline') {
      orientationDeadlineReached = true;
      if (!orientationSettled) {
        orientationSettled = true;
        orientationDegraded = true;
        record('orientation-assets-deadline', reason);
      }
      return snapshot();
    },
    getSnapshot: snapshot
  });
}
