/**
 * W757 — performance, progressive loading, memory, disposal and cache authority.
 *
 * This controller composes the maintained local performance observer and W731
 * asset budgets. It may reduce background work locally, but it never uploads
 * telemetry or awards certification by itself.
 */
import { createCityPerformanceObservation } from '../eon-city-performance-observation.js';
import { getEonCityW731QualityBudget } from '../w731/eon-city-w731-launch-asset-manifest.js';

export const EON_CITY_W757_SCHEMA = 'eon.city.performance-reliability.w757.v2';
const freeze = (value) => Object.freeze(value);
const QUALITY = new Set(['lite', 'balanced', 'cinematic']);

const PERFORMANCE_TARGETS = freeze({
  lite: freeze({ targetFps: 30, sustainedFloorFps: 25, warmFirstPlayableMs: 12_000 }),
  balanced: freeze({ targetFps: 50, sustainedFloorFps: 40, warmFirstPlayableMs: 8_000 }),
  cinematic: freeze({ targetFps: 60, sustainedFloorFps: 45, warmFirstPlayableMs: 8_000 })
});

const ANIMATION_BUDGETS = freeze({
  lite: freeze({ nearMetres: 10, midMetres: 22, nearIntervalMs: 0, midIntervalMs: 180, farIntervalMs: 500 }),
  balanced: freeze({ nearMetres: 14, midMetres: 32, nearIntervalMs: 0, midIntervalMs: 100, farIntervalMs: 320 }),
  cinematic: freeze({ nearMetres: 18, midMetres: 40, nearIntervalMs: 0, midIntervalMs: 70, farIntervalMs: 220 })
});

export function buildEonCityW757ReliabilityPlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = QUALITY.has(String(quality)) ? String(quality) : 'balanced';
  const assetBudget = getEonCityW731QualityBudget(resolvedQuality);
  const performance = PERFORMANCE_TARGETS[resolvedQuality];
  return freeze({
    schema: EON_CITY_W757_SCHEMA,
    quality: resolvedQuality,
    firstPlayableBudgetMs: performance.warmFirstPlayableMs,
    lowerDeviceLowModeFirstPlayableBudgetMs: 12_000,
    sustainedFpsTarget: performance.targetFps,
    sustainedFpsFloor: performance.sustainedFloorFps,
    supportedMobileLandscapeFpsTarget: 30,
    loading: freeze({
      firstFrameDoesNotWaitForAllAssets: true,
      coreCharactersBeforeBackgroundCast: true,
      authoredEnvironmentProgressive: true,
      maxConcurrentLoads: assetBudget.maxConcurrentLoads,
      maxResidentAssets: assetBudget.maxResidentAssets,
      failedAssetsUseBrandedDegradedMode: true,
      loadAllAtBoot: false
    }),
    rendering: freeze({
      backgroundDockFrameCapFps: 12,
      hiddenFrameCapFps: 0,
      animationDistanceThrottling: true,
      animation: ANIMATION_BUDGETS[resolvedQuality],
      oneCanvas: true,
      oneEngine: true,
      oneScene: true,
      oneRenderLoop: true
    }),
    memory: freeze({
      localOnly: true,
      sampleIntervalMs: 15_000,
      maxSamples: 16,
      privateContentCollected: false,
      browserSupportOptional: true,
      unboundedGrowthMayNotSelfPass: true
    }),
    lifecycle: freeze({
      hiddenRenderingPaused: true,
      contextLossHandled: true,
      contextRestoreHandled: true,
      disposerIdempotent: true,
      dockFocusCyclesRequired: 20,
      restartsRequired: 10,
      contextRestoreProofRequired: 1,
      longSessionMinutesRequired: 30
    }),
    cache: freeze({
      contentHashedCityAssets: true,
      unchangedAssetsReused: true,
      staleRuntimeChunksRejected: true,
      runtimeModulesNetworkOnly: true,
      provenanceHeaderRequired: true,
      explicitUpdateChoice: true,
      automaticReload: false,
      logoutPreservesPublicAssets: true,
      privateWorkInCache: false
    }),
    localObservationOnly: true,
    headedBrowserEvidenceRequired: true,
    automaticallyCertified: false
  });
}

export function validateEonCityW757ReliabilityPlan(plan = buildEonCityW757ReliabilityPlan()) {
  const errors = [];
  if (plan.schema !== EON_CITY_W757_SCHEMA) errors.push('schema');
  if (!QUALITY.has(plan.quality)) errors.push('quality');
  if (plan.firstPlayableBudgetMs > 12_000 || plan.lowerDeviceLowModeFirstPlayableBudgetMs !== 12_000) errors.push('first-playable-budget');
  if (!(plan.sustainedFpsTarget >= 30) || !(plan.sustainedFpsFloor >= 25) || plan.supportedMobileLandscapeFpsTarget !== 30) errors.push('performance-budget');
  if (!(plan.loading?.maxConcurrentLoads >= 1) || !(plan.loading?.maxResidentAssets >= 20)) errors.push('asset-budget');
  if (plan.loading?.firstFrameDoesNotWaitForAllAssets !== true || plan.loading?.failedAssetsUseBrandedDegradedMode !== true || plan.loading?.loadAllAtBoot !== false) errors.push('progressive-loading');
  if (plan.rendering?.backgroundDockFrameCapFps !== 12 || plan.rendering?.animationDistanceThrottling !== true) errors.push('render-throttling');
  if (plan.rendering?.oneCanvas !== true || plan.rendering?.oneEngine !== true || plan.rendering?.oneScene !== true || plan.rendering?.oneRenderLoop !== true) errors.push('single-runtime');
  if (!(plan.rendering?.animation?.midIntervalMs > 0) || !(plan.rendering?.animation?.farIntervalMs > plan.rendering?.animation?.midIntervalMs)) errors.push('animation-budget');
  if (plan.memory?.localOnly !== true || plan.memory?.privateContentCollected !== false || plan.memory?.maxSamples !== 16 || plan.memory?.unboundedGrowthMayNotSelfPass !== true) errors.push('memory-truth');
  if (plan.lifecycle?.dockFocusCyclesRequired !== 20 || plan.lifecycle?.restartsRequired !== 10 || plan.lifecycle?.contextRestoreProofRequired !== 1) errors.push('soak-boundary');
  if (plan.cache?.staleRuntimeChunksRejected !== true || plan.cache?.runtimeModulesNetworkOnly !== true || plan.cache?.provenanceHeaderRequired !== true || plan.cache?.explicitUpdateChoice !== true || plan.cache?.automaticReload !== false || plan.cache?.privateWorkInCache !== false) errors.push('cache-boundary');
  if (plan.localObservationOnly !== true || plan.headedBrowserEvidenceRequired !== true || plan.automaticallyCertified !== false) errors.push('certification-boundary');
  return freeze({ schema: EON_CITY_W757_SCHEMA, ok: errors.length === 0, errors: freeze(errors), plan });
}

export function createEonCityW757ReliabilityController({ quality = 'balanced', now = () => globalThis.performance?.now?.() ?? Date.now(), readMemory, onState = () => {} } = {}) {
  const plan = buildEonCityW757ReliabilityPlan({ quality });
  const validation = validateEonCityW757ReliabilityPlan(plan);
  if (!validation.ok) throw new Error(`w757-invalid-plan:${validation.errors.join(',')}`);
  const observation = createCityPerformanceObservation({ now, readMemory, maxMemorySamples: plan.memory.maxSamples });
  const disposers = new Map();
  const animationLastAt = new Map();
  let disposed = false;
  let lastMemorySampleAt = Number(now()) || 0;
  let lastStateEmitAt = Number(now()) || 0;
  let lastBackgroundRenderAt = Number.NEGATIVE_INFINITY;
  let dockFocusCycles = 0;
  let restarts = 0;
  let contextLosses = 0;
  let contextRestores = 0;
  let performanceProtections = 0;
  let backgroundFramesSkipped = 0;
  let distanceAnimationUpdatesSkipped = 0;
  let lastPresentation = 'world';
  let assetSummary = freeze({ resident: 0, inflight: 0, queued: 0, proceduralFallback: true });

  const snapshot = (type = 'snapshot', { emit = true } = {}) => {
    const observed = observation.getSnapshot();
    const firstPlayableWithinBudget = Number.isFinite(observed.firstFrameMs) ? observed.firstFrameMs <= plan.firstPlayableBudgetMs : null;
    const sustainedFpsWithinFloor = Number.isFinite(observed.estimatedFps) ? observed.estimatedFps >= plan.sustainedFpsFloor : null;
    const value = freeze({
      schema: EON_CITY_W757_SCHEMA,
      type,
      plan,
      validation,
      observation: observed,
      counters: freeze({ dockFocusCycles, restarts, contextLosses, contextRestores, performanceProtections, backgroundFramesSkipped, distanceAnimationUpdatesSkipped }),
      assets: assetSummary,
      firstPlayableWithinBudget,
      sustainedFpsWithinFloor,
      disposed,
      sourceReady: validation.ok,
      headedEvidenceRequired: true,
      automaticallyCertified: false
    });
    if (emit) { try { onState(value); } catch {} }
    return value;
  };

  const recordStage = (stage) => { observation.recordStage(stage); return snapshot(`stage:${stage}`); };
  const recordFrame = (frameMs) => {
    if (disposed) return null;
    observation.recordFrame(frameMs);
    const at = Number(now()) || 0;
    if (at - lastMemorySampleAt >= plan.memory.sampleIntervalMs) {
      lastMemorySampleAt = at;
      observation.captureMemory();
    }
    if (at - lastStateEmitAt < 1_000) return null;
    lastStateEmitAt = at;
    return snapshot('frame-sample');
  };

  const intervalForDistance = (distance = 0) => {
    const value = Math.max(0, Number(distance || 0));
    const budget = plan.rendering.animation;
    if (value <= budget.nearMetres) return budget.nearIntervalMs;
    if (value <= budget.midMetres) return budget.midIntervalMs;
    return budget.farIntervalMs;
  };

  return freeze({
    schema: EON_CITY_W757_SCHEMA,
    getPlan: () => plan,
    getSnapshot: () => snapshot(),
    recordStage,
    recordFrame,
    recordFirstFrame() { observation.recordFirstFrame(); return snapshot('first-frame'); },
    captureMemory() { observation.captureMemory(); return snapshot('memory'); },
    shouldRenderFrame({ at = now(), background = false, hidden = false, contextLost = false } = {}) {
      if (disposed || hidden || contextLost) return false;
      if (!background) return true;
      const minimumInterval = 1000 / plan.rendering.backgroundDockFrameCapFps;
      const timestamp = Number(at) || 0;
      if (timestamp - lastBackgroundRenderAt + 0.001 < minimumInterval) {
        backgroundFramesSkipped += 1;
        return false;
      }
      lastBackgroundRenderAt = timestamp;
      return true;
    },
    shouldUpdateAnimation({ id = '', distance = 0, at = now(), essential = false } = {}) {
      if (disposed || essential) return !disposed;
      const key = String(id || '').trim();
      if (!key) return true;
      const timestamp = Number(at) || 0;
      const interval = intervalForDistance(distance);
      const previous = animationLastAt.get(key);
      if (interval > 0 && Number.isFinite(previous) && timestamp - previous + 0.001 < interval) {
        distanceAnimationUpdatesSkipped += 1;
        return false;
      }
      animationLastAt.set(key, timestamp);
      return true;
    },
    noteWorkspacePresentation(mode = 'world') {
      const next = String(mode || 'world');
      if (lastPresentation !== 'world' && next === 'world') dockFocusCycles += 1;
      lastPresentation = next;
      return snapshot('workspace-transition');
    },
    noteRestart() { restarts += 1; return snapshot('restart'); },
    noteContextLoss() { contextLosses += 1; observation.recordStage('webgl-context-lost'); return snapshot('context-loss'); },
    noteContextRestore() { contextRestores += 1; return snapshot('context-restore'); },
    notePerformanceProtection() { performanceProtections += 1; observation.recordStage('performance-protection-applied'); return snapshot('performance-protection'); },
    noteAssets(summary = {}) {
      assetSummary = freeze({
        resident: Math.max(0, Number(summary.resident || 0)),
        inflight: Math.max(0, Number(summary.inflight || 0)),
        queued: Math.max(0, Number(summary.queued || 0)),
        maxResidentAssets: Math.max(0, Number(summary.maxResidentAssets || plan.loading.maxResidentAssets)),
        maxConcurrentLoads: Math.max(0, Number(summary.maxConcurrentLoads || plan.loading.maxConcurrentLoads)),
        proceduralFallback: summary.proceduralFallback === true,
        disposed: summary.disposed === true
      });
      return snapshot('assets');
    },
    registerDisposer(id = '', disposer = null) {
      const key = String(id || '').trim();
      if (disposed || !key || typeof disposer !== 'function' || disposers.has(key)) return false;
      disposers.set(key, disposer);
      return true;
    },
    dispose() {
      if (disposed) return snapshot('disposed-idempotent');
      disposed = true;
      for (const disposer of [...disposers.values()].reverse()) { try { disposer(); } catch {} }
      disposers.clear();
      animationLastAt.clear();
      observation.recordStage('renderer-destroyed');
      return snapshot('disposed');
    }
  });
}
