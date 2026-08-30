/**
 * A15 C02 — event-only bridge between the Core Nexus projection provider and EONCITY.
 * City receives bounded snapshots; it cannot import or invoke Core implementation modules.
 */
export const EON_NEXUS_CITY_PROJECTION_SCHEMA = 'eonapp.nexus.city-projection.a15.v1';
export const EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT = 'eon:nexus-city-projection-request';
export const EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT = 'eon:nexus-city-projection-update';

const freeze = (value) => Object.freeze(value);
let latestSource = null;
let latestContinuity = null;
const listeners = new Set();

function acceptProjection(candidate = null) {
  if (!candidate || candidate.schema !== EON_NEXUS_CITY_PROJECTION_SCHEMA) return false;
  latestSource = candidate.source && typeof candidate.source === 'object' ? freeze({ ...candidate.source }) : null;
  latestContinuity = candidate.continuity && typeof candidate.continuity === 'object' ? freeze({ ...candidate.continuity }) : null;
  for (const listener of listeners) { try { listener(latestSource); } catch {} }
  return true;
}

function dispatch(environment, name, detail) {
  if (typeof environment?.dispatchEvent !== 'function') return false;
  let event = null;
  if (typeof environment.CustomEvent === 'function') event = new environment.CustomEvent(name, { detail });
  else if (typeof environment.Event === 'function') {
    event = new environment.Event(name);
    try { Object.defineProperty(event, 'detail', { value: detail, enumerable: true }); } catch {}
  }
  if (!event) return false;
  environment.dispatchEvent(event);
  return true;
}

export function readEonNexusCityContinuityProjection() {
  return latestContinuity;
}

export function getEonNexusCityProjectionTruth() {
  return freeze({
    schema: EON_NEXUS_CITY_PROJECTION_SCHEMA,
    eventOnly: true,
    privacyProjected: true,
    rawConversationTextRead: false,
    rawProjectContentRead: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false,
    ownsRenderLoop: false,
    privateContentStored: false
  });
}

export function createEonNexusCityProjectionAdapter({ environment = globalThis } = {}) {
  let started = false;
  let disposed = false;
  const onUpdate = (event) => { if (!disposed) acceptProjection(event?.detail); };
  const refresh = (reason = 'manual') => {
    if (disposed) return freeze({ ok: false, reason: 'adapter-disposed', state: latestSource });
    const requested = dispatch(environment, EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT, freeze({
      reason: String(reason || 'manual').slice(0, 80),
      respond: (projection) => acceptProjection(projection)
    }));
    return freeze({ ok: requested, reason: requested ? null : 'projection-provider-unavailable', state: latestSource });
  };
  return freeze({
    getSnapshot: () => latestSource,
    subscribe(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      listeners.add(listener);
      if (latestSource) listener(latestSource);
      return () => listeners.delete(listener);
    },
    refresh,
    start() {
      if (disposed) return freeze({ ok: false, reason: 'adapter-disposed' });
      if (!started) environment.addEventListener?.(EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT, onUpdate);
      started = true;
      return refresh('adapter-start');
    },
    stop() {
      if (started) environment.removeEventListener?.(EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT, onUpdate);
      started = false;
      return freeze({ ok: true });
    },
    dispose() {
      if (disposed) return;
      if (started) environment.removeEventListener?.(EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT, onUpdate);
      listeners.clear();
      started = false;
      disposed = true;
    },
    getStatus: () => freeze({ started, disposed, projectionAvailable: Boolean(latestSource) })
  });
}
