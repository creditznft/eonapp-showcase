/**
 * RT91 — content density and performance budget for flagship worlds.
 *
 * This policy limits active work while allowing high perceived density. It is
 * intentionally conservative until owner-machine GPU evidence can tune it.
 * No device certification is inferred by this source contract.
 */
export const EON_CITY_RT91_CONTENT_PERFORMANCE_SCHEMA = 'eon.city.content-performance.rt91.v1';

const freeze = Object.freeze;
const PROFILES = freeze({
  lite: freeze({
    nearRadius: 16,
    warmRadius: 24,
    distantRadius: 38,
    focusIntervalMs: 320,
    maximumConcurrentOptionalAssetLoads: 1,
    maximumNearAnimatedNpcs: 5,
    maximumMidPresenceNpcs: 8,
    maximumNearInteractivePropClusters: 10,
    maximumMidStaticPropClusters: 16,
    maximumActiveParticleEmitters: 8,
    maximumAnimatedAmbientActors: 3,
    maximumDynamicMissionCells: 3,
    maximumWorldStateEvaluationsPerSecond: 4
  }),
  balanced: freeze({
    nearRadius: 20,
    warmRadius: 30,
    distantRadius: 42,
    focusIntervalMs: 250,
    maximumConcurrentOptionalAssetLoads: 2,
    maximumNearAnimatedNpcs: 9,
    maximumMidPresenceNpcs: 14,
    maximumNearInteractivePropClusters: 16,
    maximumMidStaticPropClusters: 28,
    maximumActiveParticleEmitters: 14,
    maximumAnimatedAmbientActors: 6,
    maximumDynamicMissionCells: 5,
    maximumWorldStateEvaluationsPerSecond: 6
  }),
  cinematic: freeze({
    nearRadius: 24,
    warmRadius: 34,
    distantRadius: 46,
    focusIntervalMs: 220,
    maximumConcurrentOptionalAssetLoads: 3,
    maximumNearAnimatedNpcs: 13,
    maximumMidPresenceNpcs: 20,
    maximumNearInteractivePropClusters: 24,
    maximumMidStaticPropClusters: 40,
    maximumActiveParticleEmitters: 20,
    maximumAnimatedAmbientActors: 9,
    maximumDynamicMissionCells: 7,
    maximumWorldStateEvaluationsPerSecond: 8
  })
});

const WORLD_MULTIPLIERS = freeze({
  'signal-frontier': freeze({ particle: 0.9, npc: 1, prop: 1, mission: 1 }),
  'storm-sector': freeze({ particle: 1, npc: 0.75, prop: 1.05, mission: 1 }),
  'my-frontier': freeze({ particle: 0.65, npc: 1, prop: 1.15, mission: 1 })
});

const bounded = (value, min = 0) => Math.max(min, Math.floor(Number(value) || 0));
const scale = (value, multiplier) => bounded(value * multiplier);

export function buildEonCityRt91ContentPerformanceBudget({ quality = 'balanced', worldId = 'signal-frontier', hidden = false, reducedMotion = false } = {}) {
  const qualityId = Object.hasOwn(PROFILES, String(quality || '').toLowerCase()) ? String(quality || '').toLowerCase() : 'balanced';
  const world = Object.hasOwn(WORLD_MULTIPLIERS, String(worldId || '').toLowerCase()) ? String(worldId || '').toLowerCase() : 'signal-frontier';
  const base = PROFILES[qualityId];
  const multiplier = WORLD_MULTIPLIERS[world];
  const suspended = hidden === true;
  const motionReduced = reducedMotion === true;
  return freeze({
    schema: EON_CITY_RT91_CONTENT_PERFORMANCE_SCHEMA,
    quality: qualityId,
    worldId: world,
    streaming: freeze({
      nearRadius: base.nearRadius,
      warmRadius: base.warmRadius,
      distantRadius: base.distantRadius,
      focusIntervalMs: suspended ? 0 : base.focusIntervalMs,
      maximumConcurrentOptionalAssetLoads: suspended ? 0 : base.maximumConcurrentOptionalAssetLoads,
      firstPlayableFrameExcludesOptionalLoads: true,
      nearestEligibleWorkFirst: true,
      wholeMapQueueDrainAllowed: false
    }),
    population: freeze({
      maximumNearAnimatedNpcs: suspended || motionReduced ? 0 : scale(base.maximumNearAnimatedNpcs, multiplier.npc),
      maximumMidPresenceNpcs: suspended ? 0 : scale(base.maximumMidPresenceNpcs, multiplier.npc),
      maximumAnimatedAmbientActors: suspended || motionReduced ? 0 : scale(base.maximumAnimatedAmbientActors, multiplier.npc),
      farPopulationUsesCheapRepresentation: true,
      hiddenWorldPopulationUpdates: false
    }),
    scenery: freeze({
      maximumNearInteractivePropClusters: suspended ? 0 : scale(base.maximumNearInteractivePropClusters, multiplier.prop),
      maximumMidStaticPropClusters: suspended ? 0 : scale(base.maximumMidStaticPropClusters, multiplier.prop),
      horizonUsesInstancesLodOrImpostors: true,
      staticWorldMatricesPreferred: true
    }),
    effects: freeze({
      maximumActiveParticleEmitters: suspended || motionReduced ? 0 : scale(base.maximumActiveParticleEmitters, multiplier.particle),
      distantSpectaclePrefersLightingFogAudio: true,
      noPerFrameWorldStateSimulation: true
    }),
    gameplay: freeze({
      maximumDynamicMissionCells: suspended ? 0 : scale(base.maximumDynamicMissionCells, multiplier.mission),
      maximumWorldStateEvaluationsPerSecond: suspended ? 0 : base.maximumWorldStateEvaluationsPerSecond,
      movementAnimationCameraAndRenderMayRunAtFrameRate: !suspended,
      interactionDispatchImmediate: !suspended,
      saveAndProgressionWritesEventDrivenOnly: true
    }),
    truth: freeze({
      realDeviceProofRequired: true,
      deviceCertified: false,
      changesProgressionAuthority: false,
      changesQualityAuthority: false,
      createsSecondRenderLoop: false
    })
  });
}

export function validateEonCityRt91ContentPerformanceBudget(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT91_CONTENT_PERFORMANCE_SCHEMA) errors.push('schema');
  if (!Object.hasOwn(PROFILES, plan?.quality)) errors.push('quality');
  if (!Object.hasOwn(WORLD_MULTIPLIERS, plan?.worldId)) errors.push('world');
  if (Number(plan?.streaming?.maximumConcurrentOptionalAssetLoads || 0) > 3) errors.push('optional-load-concurrency');
  if (Number(plan?.streaming?.focusIntervalMs || 0) > 350) errors.push('streaming-cadence');
  if (plan?.streaming?.firstPlayableFrameExcludesOptionalLoads !== true || plan?.streaming?.wholeMapQueueDrainAllowed !== false) errors.push('first-frame-streaming');
  if (Number(plan?.population?.maximumNearAnimatedNpcs || 0) > 16 || Number(plan?.population?.maximumMidPresenceNpcs || 0) > 24) errors.push('population-budget');
  if (Number(plan?.scenery?.maximumNearInteractivePropClusters || 0) > 28 || Number(plan?.scenery?.maximumMidStaticPropClusters || 0) > 48) errors.push('scenery-budget');
  if (Number(plan?.effects?.maximumActiveParticleEmitters || 0) > 24 || plan?.effects?.noPerFrameWorldStateSimulation !== true) errors.push('effects-budget');
  if (Number(plan?.gameplay?.maximumWorldStateEvaluationsPerSecond || 0) > 10 || plan?.gameplay?.saveAndProgressionWritesEventDrivenOnly !== true) errors.push('gameplay-cadence');
  if (plan?.truth?.deviceCertified !== false || plan?.truth?.realDeviceProofRequired !== true || plan?.truth?.createsSecondRenderLoop !== false) errors.push('truth-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export function getEonCityRt91ContentPerformanceProfiles() {
  return PROFILES;
}

export default freeze({
  EON_CITY_RT91_CONTENT_PERFORMANCE_SCHEMA,
  buildEonCityRt91ContentPerformanceBudget,
  validateEonCityRt91ContentPerformanceBudget,
  getEonCityRt91ContentPerformanceProfiles
});
