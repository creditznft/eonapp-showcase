/**
 * W557 — foreground City Workroom Overlay lifecycle.
 *
 * A City workroom is a same-tab local panel, not a route, network request,
 * provider action or background process. Opening a workroom captures the
 * current exploration pose and cooperatively pauses the renderer. Closing it
 * restores that pose and resumes only when the overlay itself paused City.
 *
 * Browser pointer lock cannot be restored programmatically. The Babylon
 * runtime deliberately releases it on pause/pose restore; a person may choose
 * Pointer look again after returning.
 */
export const EON_CITY_WORKROOM_OVERLAY_SCHEMA = 'eon.city.workroom-overlay.w557.v1';

const WORKROOM_ID_RE = /^[a-z][a-z0-9-]{2,80}$/;
const freeze = (value) => Object.freeze(value);

function normalizeId(value = '') {
  const id = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return WORKROOM_ID_RE.test(id) ? id : '';
}

function snapshot({ activeId = '', pose = null, pausedByOverlay = false, disposed = false } = {}) {
  return freeze({
    schema: EON_CITY_WORKROOM_OVERLAY_SCHEMA,
    active: Boolean(activeId),
    activeId: activeId || null,
    poseCaptured: Boolean(pose),
    pausedByOverlay: Boolean(pausedByOverlay),
    sameTab: true,
    localOnly: true,
    remoteNetwork: false,
    automaticRoute: false,
    pointerLockRestored: false,
    disposed: Boolean(disposed)
  });
}

/**
 * Creates a small cooperative lifecycle around a real City runtime.
 * The runtime is expected to expose pause(), resume(), getExplorationPose(),
 * restoreExplorationPose(), and optionally isPaused().
 */
export function createEonCityWorkroomOverlay({ runtime = null, onStatus = () => {}, onPoseRestored = () => {} } = {}) {
  let activeId = '';
  let pose = null;
  let pausedByOverlay = false;
  let disposed = false;

  const report = (message) => {
    try { onStatus(String(message || '')); } catch {}
  };

  const getSnapshot = () => snapshot({ activeId, pose, pausedByOverlay, disposed });

  const close = ({ explicitUserAction = false, reason = 'workroom-close' } = {}) => {
    if (disposed) return freeze({ ok: false, error: 'workroom-overlay-disposed', snapshot: getSnapshot() });
    if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', snapshot: getSnapshot() });
    if (!activeId) return freeze({ ok: true, alreadyClosed: true, snapshot: getSnapshot() });

    const closedId = activeId;
    let restored = false;
    try {
      restored = Boolean(pose && runtime?.restoreExplorationPose?.(pose));
    } catch {}
    try {
      if (pausedByOverlay) runtime?.resume?.();
    } catch {}

    activeId = '';
    pose = null;
    pausedByOverlay = false;
    if (restored) {
      try {
        onPoseRestored({
          id: closedId,
          reason: String(reason || 'workroom-close').slice(0, 100),
          localOnly: true,
          remoteNetwork: false,
          pointerLockRestored: false
        });
      } catch {}
    }
    report(restored
      ? `Returned from ${closedId} to the same City location and camera. Pointer look stays off until you choose it again.`
      : `Returned from ${closedId}. City state stayed local; Pointer look requires a fresh browser action.`);
    return freeze({
      ok: true,
      id: closedId,
      reason: String(reason || 'workroom-close').slice(0, 100),
      poseRestored: restored,
      pointerLockRestored: false,
      remoteNetwork: false,
      snapshot: getSnapshot()
    });
  };

  const open = ({ id = '', explicitUserAction = false } = {}) => {
    if (disposed) return freeze({ ok: false, error: 'workroom-overlay-disposed', snapshot: getSnapshot() });
    if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', snapshot: getSnapshot() });
    const normalizedId = normalizeId(id);
    if (!normalizedId) return freeze({ ok: false, error: 'workroom-id-required', snapshot: getSnapshot() });
    if (activeId && activeId !== normalizedId) return freeze({ ok: false, error: 'another-workroom-active', activeId, snapshot: getSnapshot() });
    if (activeId === normalizedId) return freeze({ ok: true, deduped: true, id: activeId, snapshot: getSnapshot() });
    if (!runtime || typeof runtime.pause !== 'function') return freeze({ ok: false, error: 'city-runtime-unavailable', snapshot: getSnapshot() });

    let captured = null;
    try { captured = runtime.getExplorationPose?.() || null; } catch {}
    let wasPaused = false;
    try { wasPaused = runtime.isPaused?.() === true; } catch {}
    try {
      if (!wasPaused) runtime.pause();
    } catch {
      return freeze({ ok: false, error: 'city-pause-failed', snapshot: getSnapshot() });
    }

    activeId = normalizedId;
    pose = captured;
    pausedByOverlay = !wasPaused;
    report(`City paused while ${normalizedId.replace(/-/g, ' ')} is open. Close it to return to your saved view.`);
    return freeze({
      ok: true,
      id: normalizedId,
      poseCaptured: Boolean(captured),
      pausedByOverlay,
      localOnly: true,
      remoteNetwork: false,
      automaticRoute: false,
      snapshot: getSnapshot()
    });
  };

  return freeze({
    getSnapshot,
    open,
    close,
    dispose(reason = 'workroom-overlay-dispose') {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      const hadActiveWorkroom = Boolean(activeId);
      let closeResult = null;
      if (hadActiveWorkroom) closeResult = close({ explicitUserAction: true, reason });
      disposed = true;
      return freeze({ ok: true, hadActiveWorkroom, closeResult, snapshot: getSnapshot() });
    }
  });
}
