import {
  EON_WORK_SURFACE_CLOSE_EVENT,
  EON_WORK_SURFACE_OPEN_EVENT,
  EON_WORK_SURFACE_PRESENTATION_EVENT,
  EON_WORK_SURFACE_MINIMIZE_EVENT,
  EON_WORK_SURFACE_RESTORE_EVENT,
  dispatchEonWorkSurfaceOpen,
  normalizeEonWorkSurfacePresentationMode
} from '../../contracts/work-surface/eon-work-surface-registry.js';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_W748_WORKSPACE_PRESENTER_SCHEMA = 'eon.city.workspace-presenter.w748.v1';
export const EON_CITY_W748_DEFAULT_PRESENTATION = 'dock';

function safeCall(callback, ...args) {
  try { return callback?.(...args); } catch { return undefined; }
}

function createSessionId(stationId = '', environment = globalThis) {
  const stamp = Number(environment?.performance?.now?.() || Date.now()).toString(36).replace('.', '');
  const random = typeof environment?.crypto?.randomUUID === 'function'
    ? environment.crypto.randomUUID().slice(0, 12)
    : Math.random().toString(36).slice(2, 12);
  return `city-w748:${String(stationId || 'surface').slice(0, 32)}:${stamp}:${random}`;
}

export function createEonCityW748WorkspacePresenter({
  environment = globalThis,
  captureWorldState = () => null,
  focusWorldObject = () => null,
  restoreWorldState = () => null,
  setMovementPaused = () => {},
  setWorldAudioPaused = () => {},
  setBackgroundPresentation = () => {},
  requestSurfaceOpen = () => ({ ok: true }),
  noteSurfaceClosed = () => {},
  noteSurfaceMinimized = () => {},
  noteSurfaceRestored = () => {},
  onStatus = () => {},
  onReturn = () => {}
} = {}) {
  let disposed = false;
  let active = null;
  let pending = null;

  const setPaused = (paused, mode = 'dock') => {
    safeCall(setMovementPaused, Boolean(paused), { source: 'w748-workspace-presenter', mode });
    safeCall(setWorldAudioPaused, Boolean(paused), { source: 'w748-workspace-presenter', mode });
    safeCall(setBackgroundPresentation, paused ? (mode === 'focus' ? 'focus-background' : 'dock-background') : 'world', { source: 'w748-workspace-presenter', mode });
  };

  const matches = (detail = {}) => {
    const sessionId = String(detail?.sessionId || detail?.context?.citySessionId || '');
    return Boolean((active || pending)?.sessionId && sessionId === (active || pending).sessionId);
  };

  const begin = ({ station, interaction = null, surface = '', trigger = null, context = {} } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'workspace-presenter-disposed' });
    if (active || pending) return freeze({ ok: false, reason: 'workspace-presenter-busy' });
    if (!station?.id) return freeze({ ok: false, reason: 'station-required' });
    const resolvedSurface = String(surface || interaction?.primaryAction?.surface || station.surface || 'chat');
    const cityRoot = environment?.document?.querySelector?.('[data-eon-city-play-root]');
    const presentationMode = cityRoot?.dataset?.eonCityManagedSurfacePresentation === 'sheet' ? 'sheet' : 'dock';
    const surfaceLease = safeCall(requestSurfaceOpen, 'work-surface', { reason: 'workspace-open', stationId: station.id, surface: resolvedSurface });
    if (surfaceLease?.ok === false) return freeze({ ok: false, reason: surfaceLease.reason || 'workspace-surface-busy' });
    const sessionId = createSessionId(station.id, environment);
    const snapshot = safeCall(captureWorldState, { station, interaction, trigger });
    const focusReceipt = safeCall(focusWorldObject, { station, interaction, snapshot, presentationMode });
    pending = freeze({
      schema: EON_CITY_W748_WORKSPACE_PRESENTER_SCHEMA,
      sessionId,
      stationId: station.id,
      stationLabel: station.label,
      surface: resolvedSurface,
      interactionId: interaction?.id || '',
      snapshot,
      focusReceipt,
      presentationMode,
      openedAt: new Date().toISOString()
    });
    setPaused(true, presentationMode);
    const dispatched = dispatchEonWorkSurfaceOpen({
      id: resolvedSurface,
      source: 'eon-city-command-hub',
      explicitUserAction: true,
      presentationMode,
      sessionId,
      trigger,
      context: freeze({
        ...context,
        cityPresentation: true,
        citySessionId: sessionId,
        stationId: station.id,
        stationLabel: station.label,
        interactionId: interaction?.id || '',
        returnToCity: true,
        allowFocusWorkspace: true
      })
    }, environment);
    if (!dispatched) {
      const failed = pending;
      pending = null;
      setPaused(false, 'world');
      safeCall(noteSurfaceClosed, 'work-surface', 'dispatch-failed');
      safeCall(restoreWorldState, failed?.snapshot, { reason: 'dispatch-failed', station });
      return freeze({ ok: false, reason: 'work-surface-dispatch-failed' });
    }
    safeCall(onStatus, `${station.label} is opening in ${presentationMode === 'sheet' ? 'City Sheet' : 'City Dock'}. The same maintained workspace state is used.`);
    return freeze({ ok: true, sessionId, stationId: station.id, surface: resolvedSurface, presentationMode });
  };

  const onOpen = (event) => {
    const detail = event?.detail || {};
    if (!matches(detail)) return;
    const source = pending || active;
    active = freeze({ ...source, presentationMode: normalizeEonWorkSurfacePresentationMode(detail.presentationMode || 'dock') });
    pending = null;
    setPaused(true, active.presentationMode);
  };

  const onPresentation = (event) => {
    const detail = event?.detail || {};
    if (!matches(detail) || !active) return;
    const mode = normalizeEonWorkSurfacePresentationMode(detail.presentationMode || 'dock');
    active = freeze({ ...active, presentationMode: mode });
    setPaused(true, mode);
    safeCall(onStatus, mode === 'focus'
      ? `${active.stationLabel} expanded to Focus Workspace. Return to City remains available.`
      : `${active.stationLabel} returned to ${mode === 'sheet' ? 'City Sheet' : 'City Dock'}.`);
  };

  const onMinimize = (event) => {
    const detail = event?.detail || {};
    if (!matches(detail) || !active) return;
    setPaused(false, 'world');
    safeCall(noteSurfaceMinimized, 'work-surface', 'workspace-minimized');
    safeCall(onStatus, `${active.stationLabel} minimized. City movement resumed; restore it from the workspace shelf.`);
  };

  const onRestore = (event) => {
    const detail = event?.detail || {};
    if (!matches(detail) || !active) return;
    safeCall(noteSurfaceRestored, 'work-surface', 'workspace-restored');
    setPaused(true, active.presentationMode);
    safeCall(onStatus, `${active.stationLabel} restored without reloading its workspace state.`);
  };

  const finish = (detail = {}, reason = 'closed') => {
    const source = active || pending;
    if (!source) return false;
    if (detail && Object.keys(detail).length && !matches(detail)) return false;
    active = null;
    pending = null;
    setPaused(false, 'world');
    safeCall(noteSurfaceClosed, 'work-surface', reason);
    const restoreReceipt = safeCall(restoreWorldState, source.snapshot, { reason, source });
    safeCall(onReturn, freeze({ source, restoreReceipt, reason }));
    safeCall(onStatus, `Returned to ${source.stationLabel}.`);
    return true;
  };

  const onClose = (event) => { finish(event?.detail || {}, 'closed'); };

  environment.addEventListener?.(EON_WORK_SURFACE_OPEN_EVENT, onOpen);
  environment.addEventListener?.(EON_WORK_SURFACE_PRESENTATION_EVENT, onPresentation);
  environment.addEventListener?.(EON_WORK_SURFACE_CLOSE_EVENT, onClose);
  environment.addEventListener?.(EON_WORK_SURFACE_MINIMIZE_EVENT, onMinimize);
  environment.addEventListener?.(EON_WORK_SURFACE_RESTORE_EVENT, onRestore);

  return freeze({
    schema: EON_CITY_W748_WORKSPACE_PRESENTER_SCHEMA,
    begin,
    cancelPending(reason = 'cancelled') { return finish({}, reason); },
    getState: () => freeze({
      active: Boolean(active),
      pending: Boolean(pending),
      sessionId: active?.sessionId || pending?.sessionId || '',
      stationId: active?.stationId || pending?.stationId || '',
      surface: active?.surface || pending?.surface || '',
      presentationMode: active?.presentationMode || pending?.presentationMode || 'world'
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.(EON_WORK_SURFACE_OPEN_EVENT, onOpen);
      environment.removeEventListener?.(EON_WORK_SURFACE_PRESENTATION_EVENT, onPresentation);
      environment.removeEventListener?.(EON_WORK_SURFACE_CLOSE_EVENT, onClose);
      environment.removeEventListener?.(EON_WORK_SURFACE_MINIMIZE_EVENT, onMinimize);
      environment.removeEventListener?.(EON_WORK_SURFACE_RESTORE_EVENT, onRestore);
      finish({}, 'disposed');
    }
  });
}

export function validateEonCityW748WorkspacePresenterContract() {
  const errors = [];
  if (EON_CITY_W748_DEFAULT_PRESENTATION !== 'dock') errors.push('default-presentation');
  if (!EON_WORK_SURFACE_OPEN_EVENT || !EON_WORK_SURFACE_CLOSE_EVENT || !EON_WORK_SURFACE_PRESENTATION_EVENT || !EON_WORK_SURFACE_MINIMIZE_EVENT || !EON_WORK_SURFACE_RESTORE_EVENT) errors.push('surface-events');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), defaultPresentation: EON_CITY_W748_DEFAULT_PRESENTATION });
}
