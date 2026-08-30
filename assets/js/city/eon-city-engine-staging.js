/**
 * CITY-ENGINE: deterministic non-network staging for non-critical City detail.
 * Core geometry still renders synchronously; later stages run one frame apart
 * so an arrival view can reach the GPU before detail, atmosphere and cinematic
 * dressing compete for the main thread.
 */
export const EON_CITY_ENGINE_STAGING_SCHEMA = 'eon.city.engine-staging.v1';

const STAGE_ORDER = Object.freeze(['districts', 'street-life', 'atmosphere', 'cinematic']);
const DEFAULT_FRAME_BUDGET_MS = 8;

function normalizeQuality(value = 'balanced') {
  return ['lite', 'balanced', 'cinematic'].includes(String(value)) ? String(value) : 'balanced';
}

export function getCityEngineStagePlan({ quality = 'balanced', reducedMotion = false } = {}) {
  const normalizedQuality = normalizeQuality(quality);
  const reduce = Boolean(reducedMotion);
  const stages = [
    Object.freeze({ id: 'districts', required: true, enabled: true, description: 'Nearby secondary districts and work surfaces.' }),
    Object.freeze({ id: 'street-life', required: false, enabled: true, description: 'Wayfinding, guides, furnishings and local ambient systems.' }),
    Object.freeze({ id: 'atmosphere', required: false, enabled: normalizedQuality !== 'lite' && !reduce, description: 'Bounded visual weather and subtle motion.' }),
    Object.freeze({ id: 'cinematic', required: false, enabled: normalizedQuality === 'cinematic' && !reduce, description: 'Opt-in local shadow pass.' })
  ];
  return Object.freeze({ schema: EON_CITY_ENGINE_STAGING_SCHEMA, quality: normalizedQuality, reducedMotion: reduce, stages: Object.freeze(stages) });
}

function defaultRequestFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') return globalThis.requestAnimationFrame(callback);
  return globalThis.setTimeout?.(() => callback(Date.now()), 16) ?? null;
}

function defaultCancelFrame(handle) {
  if (typeof globalThis.cancelAnimationFrame === 'function') return globalThis.cancelAnimationFrame(handle);
  return globalThis.clearTimeout?.(handle);
}

export function createCityEngineStageQueue({ quality = 'balanced', reducedMotion = false, requestFrame = defaultRequestFrame, cancelFrame = defaultCancelFrame, onStage = null, onError = null, frameBudgetMs = DEFAULT_FRAME_BUDGET_MS } = {}) {
  const plan = getCityEngineStagePlan({ quality, reducedMotion });
  const tasks = new Map();
  const status = new Map(plan.stages.map((stage) => [stage.id, stage.enabled ? 'pending' : 'skipped']));
  let started = false;
  let disposed = false;
  let handle = null;
  let cursor = 0;
  const ledger = [];
  const safeBudgetMs = Math.max(3, Math.min(14, Number(frameBudgetMs) || DEFAULT_FRAME_BUDGET_MS));

  const getSummary = () => Object.freeze({
    schema: EON_CITY_ENGINE_STAGING_SCHEMA,
    quality: plan.quality,
    reducedMotion: plan.reducedMotion,
    started,
    disposed,
    frameBudgetMs: safeBudgetMs,
    ledger: Object.freeze(ledger.slice(-24).map((entry) => Object.freeze({ ...entry }))),
    stages: Object.freeze(plan.stages.map((stage) => Object.freeze({ ...stage, status: status.get(stage.id) || 'pending' })))
  });

  const scheduleNext = () => {
    if (disposed) return;
    while (cursor < STAGE_ORDER.length) {
      const id = STAGE_ORDER[cursor++];
      const stage = plan.stages.find((candidate) => candidate.id === id);
      if (!stage?.enabled) continue;
      const task = tasks.get(id);
      if (typeof task !== 'function') {
        status.set(id, 'skipped');
        continue;
      }
      handle = requestFrame(() => {
        handle = null;
        if (disposed) return;
        const startedAt = Number(globalThis.performance?.now?.() || Date.now());
        try {
          task();
          const durationMs = Math.max(0, Number(globalThis.performance?.now?.() || Date.now()) - startedAt);
          ledger.push({ id, status: 'complete', durationMs: Math.round(durationMs * 100) / 100, overBudget: durationMs > safeBudgetMs });
          if (ledger.length > 40) ledger.splice(0, ledger.length - 40);
          status.set(id, 'complete');
          onStage?.({ id, status: 'complete', summary: getSummary() });
        } catch (error) {
          const durationMs = Math.max(0, Number(globalThis.performance?.now?.() || Date.now()) - startedAt);
          ledger.push({ id, status: 'failed', durationMs: Math.round(durationMs * 100) / 100, overBudget: durationMs > safeBudgetMs });
          if (ledger.length > 40) ledger.splice(0, ledger.length - 40);
          status.set(id, 'failed');
          onError?.({ id, error, summary: getSummary() });
        }
        scheduleNext();
      });
      return;
    }
  };

  return Object.freeze({
    schema: EON_CITY_ENGINE_STAGING_SCHEMA,
    plan,
    add(id, task) {
      if (!STAGE_ORDER.includes(String(id)) || typeof task !== 'function' || disposed) return false;
      tasks.set(String(id), task);
      return true;
    },
    start() {
      if (started || disposed) return getSummary();
      started = true;
      scheduleNext();
      return getSummary();
    },
    skipOptional() {
      for (const stage of plan.stages) {
        if (!stage.required && status.get(stage.id) === 'pending') status.set(stage.id, 'skipped');
      }
      return getSummary();
    },
    getSummary,
    dispose() {
      disposed = true;
      if (handle !== null) cancelFrame(handle);
      handle = null;
      tasks.clear();
    }
  });
}
