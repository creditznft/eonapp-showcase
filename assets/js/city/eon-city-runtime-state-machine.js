/**
 * W624B — one deterministic EON City boot/recovery state machine.
 *
 * Progress is derived from completed named stages. It is never timer-based.
 */
export const EON_CITY_RUNTIME_STATE_SCHEMA = 'eon.city.runtime-state.w624b.v1';

export const EON_CITY_RUNTIME_STATES = Object.freeze([
  'idle',
  'checking-access',
  'preview',
  'loading-shell',
  'loading-core',
  'core-ready',
  'streaming-detail',
  'ready',
  'degraded',
  'recoverable-error',
  'disposed'
]);


export const EON_CITY_RUNTIME_RECOVERY_CASES = Object.freeze([
  Object.freeze({ id: 'cold-boot', trigger: 'first protected entry', response: 'checking-access to loading-shell to loading-core' }),
  Object.freeze({ id: 'warm-boot', trigger: 'owner remount', response: 'dispose superseded owner before re-entry' }),
  Object.freeze({ id: 'refresh-during-load', trigger: 'pagehide', response: 'dispose renderer, listeners and workload lease' }),
  Object.freeze({ id: 'logout', trigger: 'eon:identity-signed-out', response: 'fail closed, dispose and show sign-in action' }),
  Object.freeze({ id: 'session-expiry', trigger: 'eon:session-expired', response: 'fail closed, dispose and show sign-in action' }),
  Object.freeze({ id: 'failed-optional-asset', trigger: 'optional detail stage failure', response: 'degraded core remains usable' }),
  Object.freeze({ id: 'failed-required-asset', trigger: 'engine or required scene failure', response: 'recoverable-error with retry, safe mode and exit' }),
  Object.freeze({ id: 'webgl-context-loss', trigger: 'webglcontextlost', response: 'stop safely and expose recovery actions' }),
  Object.freeze({ id: 'low-memory-downgrade', trigger: 'quality or workload governor', response: 'degraded state with reduced effects' }),
  Object.freeze({ id: 'background-foreground-resume', trigger: 'visibilitychange', response: 'pause hidden rendering and resume from current local state' }),
  Object.freeze({ id: 'clean-disposal', trigger: 'exit or pagehide', response: 'release engine, scene, events, assets and workload lease' }),
  Object.freeze({ id: 're-entry', trigger: 'explicit retry or return', response: 'new owner and new boot token after disposal' })
]);

const STATE_SET = new Set(EON_CITY_RUNTIME_STATES);
const STAGE_INDEX = Object.freeze({
  idle: 0,
  'checking-access': 1,
  preview: 1,
  'loading-shell': 2,
  'loading-core': 3,
  'core-ready': 4,
  'streaming-detail': 5,
  ready: 6,
  degraded: 6,
  'recoverable-error': 0,
  disposed: 0
});
const STAGE_TOTAL = 6;

const TRANSITIONS = Object.freeze({
  idle: ['checking-access', 'disposed'],
  'checking-access': ['preview', 'loading-shell', 'recoverable-error', 'disposed'],
  preview: ['checking-access', 'disposed'],
  'loading-shell': ['loading-core', 'degraded', 'recoverable-error', 'disposed'],
  'loading-core': ['core-ready', 'degraded', 'recoverable-error', 'disposed'],
  'core-ready': ['streaming-detail', 'ready', 'degraded', 'recoverable-error', 'disposed'],
  'streaming-detail': ['ready', 'degraded', 'recoverable-error', 'disposed'],
  ready: ['degraded', 'recoverable-error', 'disposed'],
  degraded: ['loading-core', 'streaming-detail', 'ready', 'recoverable-error', 'disposed'],
  'recoverable-error': ['checking-access', 'loading-shell', 'loading-core', 'disposed'],
  disposed: []
});

export const EON_CITY_RUNTIME_COPY = Object.freeze({
  idle: Object.freeze({ title: 'EON City', detail: 'City is waiting for an explicit foreground entry.', timeoutMs: 0, actions: [] }),
  'checking-access': Object.freeze({ title: 'Checking City access', detail: 'The heavy renderer remains off until the server confirms this session.', timeoutMs: 12000, actions: ['retry', 'exit'] }),
  preview: Object.freeze({ title: 'EON City preview', detail: 'The protected City renderer is not running. Chat and Projects remain available.', timeoutMs: 0, actions: ['retry', 'exit'] }),
  'loading-shell': Object.freeze({ title: 'Preparing the City shell', detail: 'Mounting the local Productive Nocturne interface and recovery controls.', timeoutMs: 10000, actions: ['retry', 'exit'] }),
  'loading-core': Object.freeze({ title: 'Loading the Command District core', detail: 'Creating the local Babylon engine, required geometry, controls and safe fallbacks.', timeoutMs: 30000, actions: ['retry', 'safe-mode', 'exit'] }),
  'core-ready': Object.freeze({ title: 'Command District core ready', detail: 'Movement and the useful-work path are available. Optional detail may continue locally.', timeoutMs: 0, actions: ['continue', 'menu'] }),
  'streaming-detail': Object.freeze({ title: 'Adding optional City detail', detail: 'Loading only nonessential local detail. The core City remains usable.', timeoutMs: 45000, actions: ['skip-detail', 'menu'] }),
  ready: Object.freeze({ title: 'EON City ready', detail: 'The protected local City runtime is ready for reviewable work.', timeoutMs: 0, actions: ['menu', 'exit'] }),
  degraded: Object.freeze({ title: 'EON City is running in reduced mode', detail: 'Some optional detail is unavailable. Core navigation and useful work remain available.', timeoutMs: 0, actions: ['retry-detail', 'menu', 'exit'] }),
  'recoverable-error': Object.freeze({ title: 'EON City stopped safely', detail: 'The renderer did not continue. No project, provider, billing or Vault data changed.', timeoutMs: 0, actions: ['retry', 'safe-mode', 'exit'] }),
  disposed: Object.freeze({ title: 'EON City closed', detail: 'The renderer, listeners and local workload lease were released.', timeoutMs: 0, actions: ['re-enter'] })
});

function safeReason(value = '') {
  return String(value || 'unspecified').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 64) || 'unspecified';
}

function freezeSnapshot(value) {
  return Object.freeze({
    ...value,
    copy: EON_CITY_RUNTIME_COPY[value.state],
    evidence: Object.freeze(value.evidence.map((entry) => Object.freeze({ ...entry })))
  });
}

export function createEonCityRuntimeStateMachine({ now = () => Date.now(), onChange = null } = {}) {
  let state = 'idle';
  let detailCode = 'created';
  let evidence = [{ state, detailCode, at: Number(now()) || Date.now() }];
  let disposed = false;
  const listeners = new Set();

  const snapshot = () => freezeSnapshot({
    schema: EON_CITY_RUNTIME_STATE_SCHEMA,
    state,
    detailCode,
    progress: Math.round((STAGE_INDEX[state] / STAGE_TOTAL) * 100),
    progressBasis: 'completed-named-stages',
    timerBasedProgress: false,
    disposed,
    evidence: evidence.slice(-32)
  });

  const publish = () => {
    const current = snapshot();
    try { onChange?.(current); } catch {}
    for (const listener of listeners) {
      try { listener(current); } catch {}
    }
    return current;
  };

  const transition = (nextState, reason = 'state-change') => {
    const next = String(nextState || '');
    if (!STATE_SET.has(next)) throw new TypeError(`Unknown EON City runtime state: ${next}`);
    if (next === state) return snapshot();
    if (!TRANSITIONS[state].includes(next)) throw new Error(`Invalid EON City runtime transition: ${state} -> ${next}`);
    state = next;
    detailCode = safeReason(reason);
    disposed = next === 'disposed';
    evidence = [...evidence, { state, detailCode, at: Number(now()) || Date.now() }].slice(-32);
    return publish();
  };

  return Object.freeze({
    schema: EON_CITY_RUNTIME_STATE_SCHEMA,
    getSnapshot: snapshot,
    transition,
    fail(reason = 'runtime-failure') {
      if (state === 'disposed') return snapshot();
      if (state === 'recoverable-error') return snapshot();
      return transition('recoverable-error', reason);
    },
    degrade(reason = 'optional-detail-unavailable') {
      if (state === 'disposed' || state === 'recoverable-error') return snapshot();
      if (state === 'degraded') return snapshot();
      return transition('degraded', reason);
    },
    dispose(reason = 'runtime-dispose') {
      if (state === 'disposed') return snapshot();
      return transition('disposed', reason);
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    }
  });
}

export function getEonCityRuntimeStateContract() {
  return Object.freeze({
    schema: EON_CITY_RUNTIME_STATE_SCHEMA,
    states: EON_CITY_RUNTIME_STATES,
    transitions: TRANSITIONS,
    copy: EON_CITY_RUNTIME_COPY,
    progressBasis: 'completed-named-stages',
    timerBasedProgress: false,
    recoveryCases: EON_CITY_RUNTIME_RECOVERY_CASES
  });
}
