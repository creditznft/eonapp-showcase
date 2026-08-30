/**
 * W521 — EON City runtime lifecycle owner.
 *
 * City rendering remains local, foreground-only and user initiated. This small
 * controller owns a single boot generation, its optional AbortSignal and the
 * resources created for that generation. It prevents a late dynamic-import
 * completion from mounting after a reset, page exit, retry or context-loss
 * fallback has already replaced the City surface.
 */
export const EON_CITY_RUNTIME_LIFECYCLE_SCHEMA = 'eon.city.runtime-lifecycle.w521.v1';

export const EON_CITY_RUNTIME_STATES = Object.freeze([
  'idle',
  'booting',
  'running',
  'cancelled',
  'context-lost',
  'disposed'
]);

const MAX_EVENTS = 16;
const freeze = (value) => Object.freeze(value);

function defaultNow() {
  const value = Number(globalThis.performance?.now?.());
  return Number.isFinite(value) ? value : Date.now();
}

function safeString(value, fallback = 'unspecified') {
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, 96);
}

function createAbortController() {
  try {
    return typeof AbortController === 'function' ? new AbortController() : null;
  } catch {
    return null;
  }
}

function invokeDisposer(resource) {
  try {
    if (typeof resource === 'function') resource();
    else if (resource && typeof resource.destroy === 'function') resource.destroy();
    else if (resource && typeof resource.dispose === 'function') resource.dispose();
    else if (resource && typeof resource.abort === 'function') resource.abort();
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates one local City runtime owner. The returned object is intentionally
 * UI-free and can be fault-tested without a browser canvas or Babylon import.
 */
export function createEonCityRuntimeLifecycle({ now = defaultNow } = {}) {
  let generation = 0;
  let state = 'idle';
  let contextLost = false;
  let controller = null;
  let terminal = false;
  const resources = new Map();
  const events = [];

  const record = (type, detail = 'unspecified') => {
    events.push(freeze({
      type: safeString(type),
      detail: safeString(detail),
      generation,
      offsetMs: Math.max(0, Math.round(Number(now?.()) || 0))
    }));
    if (events.length > MAX_EVENTS) events.shift();
  };

  const disposeResources = () => {
    const entries = [...resources.entries()].reverse();
    resources.clear();
    for (const [, resource] of entries) invokeDisposer(resource);
  };

  const snapshot = () => freeze({
    schema: EON_CITY_RUNTIME_LIFECYCLE_SCHEMA,
    state,
    generation,
    active: state === 'booting' || state === 'running',
    contextLost,
    resourceKeys: freeze([...resources.keys()]),
    resourceCount: resources.size,
    abortable: Boolean(controller),
    aborted: Boolean(controller?.signal?.aborted),
    localOnly: true,
    remoteTelemetry: false,
    automaticCertification: false,
    events: freeze(events.map((entry) => freeze({ ...entry })))
  });

  const isCurrent = (token) => !terminal
    && Number(token) === generation
    && (state === 'booting' || state === 'running')
    && !contextLost
    && !controller?.signal?.aborted;

  const ownResource = (key, resource) => {
    if (!resource) return false;
    const normalizedKey = safeString(key, 'resource');
    if (terminal || state === 'disposed') {
      invokeDisposer(resource);
      return false;
    }
    const previous = resources.get(normalizedKey);
    if (previous) invokeDisposer(previous);
    resources.set(normalizedKey, resource);
    record('resource-owned', normalizedKey);
    return true;
  };

  const invalidate = (nextState, reason, { markContextLost = false } = {}) => {
    if (terminal && state === 'disposed') return snapshot();
    generation += 1;
    contextLost = markContextLost || contextLost;
    state = nextState;
    try { controller?.abort?.(safeString(reason)); } catch {}
    disposeResources();
    record(nextState, reason);
    if (nextState === 'disposed') terminal = true;
    return snapshot();
  };

  return freeze({
    beginBoot({ reason = 'station-start' } = {}) {
      if (terminal) return freeze({ ok: false, token: null, snapshot: snapshot() });
      if (state === 'booting' || state === 'running') invalidate('cancelled', 'superseded-boot');
      generation += 1;
      state = 'booting';
      contextLost = false;
      controller = createAbortController();
      record('booting', reason);
      return freeze({ ok: true, token: generation, signal: controller?.signal || null, snapshot: snapshot() });
    },
    isCurrent,
    getSignal(token) {
      return Number(token) === generation && !terminal ? controller?.signal || null : null;
    },
    own: ownResource,
    release(key) {
      const normalizedKey = safeString(key, 'resource');
      const resource = resources.get(normalizedKey);
      if (!resource) return false;
      resources.delete(normalizedKey);
      invokeDisposer(resource);
      record('resource-released', normalizedKey);
      return true;
    },
    attachRuntime(token, runtime) {
      if (!isCurrent(token)) {
        invokeDisposer(runtime);
        record('stale-runtime-rejected', 'late-runtime');
        return false;
      }
      ownResource('babylon-runtime', runtime);
      state = 'running';
      record('running', 'runtime-attached');
      return true;
    },
    cancel(token, reason = 'cancelled') {
      if (Number(token) !== generation || terminal) return false;
      invalidate('cancelled', reason);
      return true;
    },
    markContextLoss(token, reason = 'webgl-context-lost') {
      if (Number(token) !== generation || terminal) return false;
      invalidate('context-lost', reason, { markContextLost: true });
      return true;
    },
    dispose(reason = 'station-dispose') {
      invalidate('disposed', reason);
      return snapshot();
    },
    getSnapshot: snapshot
  });
}
