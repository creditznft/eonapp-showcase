/**
 * A15 C02 — Core-owned provider for the bounded EONCITY Nexus projection.
 * Loaded only by the shared shell on the explicit EONCITY route.
 */
import { createEonNexusEventAdapter } from './eon-nexus-event-adapter.js';
import { readEonNexusContinuitySnapshot } from './eon-nexus-continuity-contract.js';
import {
  EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT,
  EON_NEXUS_CITY_PROJECTION_SCHEMA,
  EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT
} from '../contracts/nexus/eon-nexus-city-projection.js';

const freeze = (value) => Object.freeze(value);
let activeProvider = null;

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

export function installEonNexusCityProjectionProvider({ environment = globalThis, document = environment?.document } = {}) {
  if (activeProvider) return activeProvider;
  const adapter = createEonNexusEventAdapter({ environment, document });
  let disposed = false;

  const buildProjection = (reason = 'manual') => {
    let source = null;
    let continuity = null;
    try { source = adapter.refresh(reason)?.state || adapter.getSnapshot?.() || null; } catch {}
    try { continuity = readEonNexusContinuitySnapshot(); } catch {}
    return freeze({
      schema: EON_NEXUS_CITY_PROJECTION_SCHEMA,
      reason: String(reason || 'manual').slice(0, 80),
      source,
      continuity,
      privacyProjected: true,
      rawPromptVisible: false,
      rawProjectContentVisible: false,
      credentialVisible: false,
      executionAuthority: false
    });
  };

  const publish = (reason = 'manual', respond = null) => {
    if (disposed) return null;
    const projection = buildProjection(reason);
    try { respond?.(projection); } catch {}
    dispatch(environment, EON_NEXUS_CITY_PROJECTION_UPDATE_EVENT, projection);
    return projection;
  };

  const onRequest = (event) => publish(event?.detail?.reason || 'city-request', event?.detail?.respond);
  environment.addEventListener?.(EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT, onRequest);
  try { adapter.start?.(); } catch {}
  publish('provider-installed');

  activeProvider = freeze({
    schema: EON_NEXUS_CITY_PROJECTION_SCHEMA,
    publish,
    getProjection: () => buildProjection('read'),
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.(EON_NEXUS_CITY_PROJECTION_REQUEST_EVENT, onRequest);
      try { adapter.dispose?.(); } catch {}
      activeProvider = null;
    }
  });
  return activeProvider;
}
