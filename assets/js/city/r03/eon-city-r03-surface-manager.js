/**
 * R03 — one presentation authority for EON City overlay surfaces.
 *
 * This manager owns only presentation arbitration. It never owns station,
 * mission, project, billing, identity, or workspace business state.
 */
const freeze = (value) => Object.freeze(value);

export const EON_CITY_R03_SURFACE_SCHEMA = 'eon.city.surface-manager.r03.v1';
export const EON_CITY_R03_SURFACE_STATE_EVENT = 'eon:city:surface-state:r03';

const normalizeResult = (value, fallbackReason = 'surface-action-failed') => {
  if (value && typeof value === 'object') return freeze({ ok: value.ok !== false, ...value });
  return freeze({ ok: value !== false, reason: value === false ? fallbackReason : '' });
};

export function resolveEonCityR03SurfacePresentation(profile = {}) {
  const id = String(profile?.id || profile?.profileId || profile || '').toLowerCase();
  const requested = String(profile?.surfaceMode || '').toLowerCase();
  if (requested === 'bottom-sheet' || requested === 'sheet' || id.startsWith('mobile-') || id === 'tablet-portrait') return 'sheet';
  if (requested === 'dock-or-sheet' || id === 'desktop-compact') return 'dock';
  return 'dock';
}

export function createEonCityR03SurfaceManager({
  environment = globalThis,
  root = environment?.document?.querySelector?.('[data-eon-city-play-root]') || null,
  initialViewportProfile = null
} = {}) {
  const registrations = new Map();
  const state = new Map();
  let activeBlockingId = '';
  let viewportProfile = initialViewportProfile || null;
  let disposed = false;

  const publish = (reason = 'state-change') => {
    const presentationMode = resolveEonCityR03SurfacePresentation(viewportProfile || root?.dataset?.eonCityViewportProfile || '');
    if (root?.dataset) {
      root.dataset.eonCitySurfaceManager = EON_CITY_R03_SURFACE_SCHEMA;
      root.dataset.eonCityActiveBlockingSurface = activeBlockingId;
      root.dataset.eonCityManagedSurfacePresentation = presentationMode;
    }
    if (environment?.document?.body?.dataset) {
      environment.document.body.dataset.eonCityActiveBlockingSurface = activeBlockingId;
      environment.document.body.dataset.eonCityManagedSurfacePresentation = presentationMode;
    }
    const snapshot = getSnapshot();
    if (typeof environment?.dispatchEvent === 'function' && typeof environment?.CustomEvent === 'function') {
      environment.dispatchEvent(new environment.CustomEvent(EON_CITY_R03_SURFACE_STATE_EVENT, { detail: freeze({ reason, snapshot }) }));
    }
    return snapshot;
  };

  const ensureState = (id) => {
    const key = String(id || '').trim();
    if (!state.has(key)) state.set(key, { id: key, open: false, minimized: false, changedAt: Date.now() });
    return state.get(key);
  };

  const mark = (id, patch = {}, reason = 'surface-state') => {
    const record = ensureState(id);
    Object.assign(record, patch, { changedAt: Date.now() });
    if (record.open && !record.minimized && registrations.get(id)?.blocking !== false) activeBlockingId = id;
    else if (activeBlockingId === id) activeBlockingId = '';
    publish(reason);
    return freeze({ ...record });
  };

  const closeIncumbent = (nextId, reason) => {
    const incumbentId = activeBlockingId;
    if (!incumbentId || incumbentId === nextId) return freeze({ ok: true, previousId: incumbentId, action: 'none' });
    const registration = registrations.get(incumbentId);
    if (!registration) {
      mark(incumbentId, { open: false, minimized: false }, 'orphan-surface-cleared');
      return freeze({ ok: true, previousId: incumbentId, action: 'cleared-orphan' });
    }
    const context = freeze({ reason: reason || 'surface-handoff', successorId: nextId, restoreFocus: false });
    if (typeof registration.minimize === 'function' && registration.preferMinimizeOnHandoff === true) {
      const result = normalizeResult(registration.minimize(context), 'surface-minimize-failed');
      if (!result.ok) return freeze({ ok: false, reason: result.reason || 'surface-minimize-failed', previousId: incumbentId });
      mark(incumbentId, { open: true, minimized: true }, 'surface-handoff-minimized');
      return freeze({ ok: true, previousId: incumbentId, action: 'minimized' });
    }
    const result = normalizeResult(registration.close?.(context), 'surface-close-failed');
    if (!result.ok) return freeze({ ok: false, reason: result.reason || 'surface-close-failed', previousId: incumbentId });
    mark(incumbentId, { open: false, minimized: false }, 'surface-handoff-closed');
    return freeze({ ok: true, previousId: incumbentId, action: 'closed' });
  };

  const requestOpen = (id, options = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'surface-manager-disposed' });
    const key = String(id || '').trim();
    const registration = registrations.get(key);
    if (!registration) return freeze({ ok: false, reason: 'surface-unregistered', id: key });
    if (registration.blocking !== false) {
      const handoff = closeIncumbent(key, options.reason || 'surface-open');
      if (!handoff.ok) return handoff;
    }
    mark(key, { open: true, minimized: false }, options.reason || 'surface-open-requested');
    return freeze({ ok: true, id: key, presentationMode: resolveEonCityR03SurfacePresentation(viewportProfile || root?.dataset?.eonCityViewportProfile || ''), previousId: activeBlockingId === key ? '' : activeBlockingId });
  };

  const noteOpen = (id, reason = 'surface-opened') => mark(String(id || ''), { open: true, minimized: false }, reason);
  const noteClosed = (id, reason = 'surface-closed') => mark(String(id || ''), { open: false, minimized: false }, reason);
  const noteMinimized = (id, reason = 'surface-minimized') => mark(String(id || ''), { open: true, minimized: true }, reason);
  const noteRestored = (id, reason = 'surface-restored') => mark(String(id || ''), { open: true, minimized: false }, reason);

  const minimize = (id, options = {}) => {
    const key = String(id || '').trim();
    const registration = registrations.get(key);
    const current = ensureState(key);
    if (!registration || !current.open) return freeze({ ok: false, reason: 'surface-not-open', id: key });
    if (typeof registration.minimize !== 'function') return freeze({ ok: false, reason: 'surface-not-minimizable', id: key });
    const result = normalizeResult(registration.minimize(freeze({ reason: options.reason || 'explicit-minimize', restoreFocus: true })), 'surface-minimize-failed');
    if (!result.ok) return result;
    mark(key, { open: true, minimized: true }, options.reason || 'surface-minimized');
    return freeze({ ok: true, id: key });
  };

  const restore = (id, options = {}) => {
    const key = String(id || '').trim();
    const registration = registrations.get(key);
    const current = ensureState(key);
    if (!registration || !current.open || !current.minimized) return freeze({ ok: false, reason: 'surface-not-minimized', id: key });
    const handoff = registration.blocking === false ? freeze({ ok: true }) : closeIncumbent(key, options.reason || 'surface-restore');
    if (!handoff.ok) return handoff;
    const result = normalizeResult(registration.restore?.(freeze({ reason: options.reason || 'explicit-restore' })), 'surface-restore-failed');
    if (!result.ok) return result;
    mark(key, { open: true, minimized: false }, options.reason || 'surface-restored');
    return freeze({ ok: true, id: key });
  };

  function getSnapshot() {
    const surfaces = [...state.values()].map((entry) => freeze({ ...entry })).sort((a, b) => a.id.localeCompare(b.id));
    return freeze({
      schema: EON_CITY_R03_SURFACE_SCHEMA,
      activeBlockingId,
      presentationMode: resolveEonCityR03SurfacePresentation(viewportProfile || root?.dataset?.eonCityViewportProfile || ''),
      openBlockingCount: surfaces.filter((entry) => entry.open && !entry.minimized && registrations.get(entry.id)?.blocking !== false).length,
      surfaces: freeze(surfaces)
    });
  }

  const register = (id, definition = {}) => {
    const key = String(id || '').trim();
    if (!key) return freeze({ ok: false, reason: 'surface-id-required', dispose() {} });
    registrations.set(key, freeze({
      id: key,
      blocking: definition.blocking !== false,
      close: typeof definition.close === 'function' ? definition.close : null,
      minimize: typeof definition.minimize === 'function' ? definition.minimize : null,
      restore: typeof definition.restore === 'function' ? definition.restore : null,
      preferMinimizeOnHandoff: definition.preferMinimizeOnHandoff === true
    }));
    ensureState(key);
    publish('surface-registered');
    return freeze({
      ok: true,
      id: key,
      dispose() {
        registrations.delete(key);
        state.delete(key);
        if (activeBlockingId === key) activeBlockingId = '';
        publish('surface-unregistered');
      }
    });
  };

  const setViewportProfile = (profile) => {
    viewportProfile = profile || null;
    return publish('viewport-profile');
  };

  publish('surface-manager-created');
  return freeze({
    schema: EON_CITY_R03_SURFACE_SCHEMA,
    register,
    requestOpen,
    noteOpen,
    noteClosed,
    noteMinimized,
    noteRestored,
    minimize,
    restore,
    setViewportProfile,
    getSnapshot,
    dispose() {
      disposed = true;
      registrations.clear();
      state.clear();
      activeBlockingId = '';
      if (root?.dataset) {
        delete root.dataset.eonCityActiveBlockingSurface;
        delete root.dataset.eonCityManagedSurfacePresentation;
      }
      if (environment?.document?.body?.dataset) {
        delete environment.document.body.dataset.eonCityActiveBlockingSurface;
        delete environment.document.body.dataset.eonCityManagedSurfacePresentation;
      }
    }
  });
}

export default freeze({
  EON_CITY_R03_SURFACE_SCHEMA,
  EON_CITY_R03_SURFACE_STATE_EVENT,
  resolveEonCityR03SurfacePresentation,
  createEonCityR03SurfaceManager
});
