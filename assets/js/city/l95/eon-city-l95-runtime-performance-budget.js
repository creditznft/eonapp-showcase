/**
 * L95-W16 — Command Hub runtime performance budget.
 *
 * Pure policy only. It separates gameplay-critical work (movement, camera,
 * interaction dispatch, nearby NPC locomotion) from decorative ambience that
 * does not need to run at display refresh rate. No device certification is
 * inferred here; physical browser evidence remains required.
 */
export const EON_CITY_L95_RUNTIME_PERFORMANCE_SCHEMA = 'eon.city.runtime-performance.l95.v1';

const freeze = Object.freeze;
const QUALITY = new Set(['lite', 'balanced', 'cinematic']);

const PROFILE = freeze({
  lite: freeze({
    pointerHoverIntervalMs: 110,
    skylinePulseIntervalMs: 220,
    distantTransitIntervalMs: 90,
    stationHaloIntervalMs: 120,
    rainAnimationIntervalMs: 80,
    circuitPulseIntervalMs: 70,
    stationMonitorCheckIntervalMs: 240,
    hubHeroAnimationIntervalMs: 50,
    orphanInputReconcileIntervalMs: 180,
    proximitySampleIntervalMs: 96,
    animatedSkylineTiers: freeze([]),
    maximumDecorativeUpdatesPerSecond: 24
  }),
  balanced: freeze({
    pointerHoverIntervalMs: 72,
    skylinePulseIntervalMs: 140,
    distantTransitIntervalMs: 66,
    stationHaloIntervalMs: 84,
    rainAnimationIntervalMs: 40,
    circuitPulseIntervalMs: 45,
    stationMonitorCheckIntervalMs: 180,
    hubHeroAnimationIntervalMs: 40,
    orphanInputReconcileIntervalMs: 150,
    proximitySampleIntervalMs: 72,
    animatedSkylineTiers: freeze(['near']),
    maximumDecorativeUpdatesPerSecond: 40
  }),
  cinematic: freeze({
    pointerHoverIntervalMs: 52,
    skylinePulseIntervalMs: 100,
    distantTransitIntervalMs: 50,
    stationHaloIntervalMs: 66,
    rainAnimationIntervalMs: 33,
    circuitPulseIntervalMs: 36,
    stationMonitorCheckIntervalMs: 150,
    hubHeroAnimationIntervalMs: 33,
    orphanInputReconcileIntervalMs: 120,
    proximitySampleIntervalMs: 60,
    animatedSkylineTiers: freeze(['near']),
    maximumDecorativeUpdatesPerSecond: 56
  })
});

function normalizeQuality(value = 'balanced') {
  const id = String(value || '').trim().toLowerCase();
  return QUALITY.has(id) ? id : 'balanced';
}

export function buildEonCityL95RuntimePerformanceBudget({
  quality = 'balanced',
  reducedMotion = false,
  coarsePointer = false,
  documentHidden = false
} = {}) {
  const id = normalizeQuality(quality);
  const base = PROFILE[id];
  const reduced = reducedMotion === true;
  const coarse = coarsePointer === true;
  const hidden = documentHidden === true;
  return freeze({
    schema: EON_CITY_L95_RUNTIME_PERFORMANCE_SCHEMA,
    quality: id,
    gameplayCriticalAtFrameRate: true,
    pointerHoverPicking: freeze({
      automaticBabylonPointerMovePicking: false,
      enabled: !coarse && !hidden,
      intervalMs: coarse || hidden ? 0 : base.pointerHoverIntervalMs,
      pointerPickStillImmediate: true,
      keyboardInteractionStillImmediate: true
    }),
    ambience: freeze({
      skylinePulseIntervalMs: reduced || hidden ? 0 : base.skylinePulseIntervalMs,
      distantTransitIntervalMs: reduced || hidden ? 0 : base.distantTransitIntervalMs,
      stationHaloIntervalMs: reduced || hidden ? 0 : base.stationHaloIntervalMs,
      rainAnimationIntervalMs: reduced || hidden ? 0 : base.rainAnimationIntervalMs,
      circuitPulseIntervalMs: reduced || hidden ? 0 : base.circuitPulseIntervalMs,
      stationMonitorCheckIntervalMs: hidden ? 0 : base.stationMonitorCheckIntervalMs,
      hubHeroAnimationIntervalMs: reduced || hidden ? 0 : base.hubHeroAnimationIntervalMs,
      animatedSkylineTiers: reduced || hidden ? freeze([]) : base.animatedSkylineTiers,
      maximumDecorativeUpdatesPerSecond: reduced || hidden ? 0 : base.maximumDecorativeUpdatesPerSecond,
      transformAnimationRestrictedToGameplayRelevantOrNearField: true
    }),
    proximitySampling: freeze({
      intervalMs: hidden ? 0 : base.proximitySampleIntervalMs,
      stationAndAmbientDistancesNeverRecomputedEveryFrame: true,
      reliabilityAnimationCadenceRemainsAuthoritative: true
    }),
    housekeeping: freeze({
      orphanInputReconcileIntervalMs: base.orphanInputReconcileIntervalMs,
      domVisibilityInspectionNeverRunsEveryFrame: true,
      interactionDispatchRemainsImmediate: true
    }),
    staticPresentation: freeze({
      freezeSkylineWorldMatrices: true,
      freezeStaticWeatherWorldMatrices: true,
      noVisualQualityDowngradeRequired: true
    }),
    truth: freeze({
      changesQualityAuthority: false,
      changesProgression: false,
      changesInteractionAuthority: false,
      deviceCertified: false,
      realDeviceProofRequired: true
    })
  });
}

export function validateEonCityL95RuntimePerformanceBudget(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_L95_RUNTIME_PERFORMANCE_SCHEMA) errors.push('schema');
  if (!QUALITY.has(plan.quality)) errors.push('quality');
  if (plan.gameplayCriticalAtFrameRate !== true) errors.push('gameplay-frame-rate');
  if (plan.pointerHoverPicking?.automaticBabylonPointerMovePicking !== false) errors.push('automatic-pointermove-picking');
  if (plan.pointerHoverPicking?.pointerPickStillImmediate !== true || plan.pointerHoverPicking?.keyboardInteractionStillImmediate !== true) errors.push('interaction-latency');
  if (Number(plan.pointerHoverPicking?.intervalMs || 0) > 140) errors.push('hover-cadence');
  if (Number(plan.ambience?.maximumDecorativeUpdatesPerSecond || 0) > 60) errors.push('decorative-budget');
  if (Number(plan.ambience?.stationMonitorCheckIntervalMs || 0) > 300) errors.push('station-monitor-cadence');
  if (Number(plan.ambience?.hubHeroAnimationIntervalMs || 0) > 60) errors.push('hub-hero-cadence');
  if (Number(plan.proximitySampling?.intervalMs || 0) > 120 || plan.proximitySampling?.stationAndAmbientDistancesNeverRecomputedEveryFrame !== true || plan.proximitySampling?.reliabilityAnimationCadenceRemainsAuthoritative !== true) errors.push('proximity-sampling');
  if (Number(plan.housekeeping?.orphanInputReconcileIntervalMs || 0) > 250 || plan.housekeeping?.domVisibilityInspectionNeverRunsEveryFrame !== true) errors.push('housekeeping-cadence');
  if (plan.housekeeping?.interactionDispatchRemainsImmediate !== true) errors.push('housekeeping-interaction-latency');
  if (plan.staticPresentation?.freezeSkylineWorldMatrices !== true) errors.push('static-skyline');
  if (plan.staticPresentation?.noVisualQualityDowngradeRequired !== true) errors.push('visual-truth');
  if (plan.truth?.changesQualityAuthority || plan.truth?.changesProgression || plan.truth?.changesInteractionAuthority || plan.truth?.deviceCertified) errors.push('truth-boundary');
  if (plan.truth?.realDeviceProofRequired !== true) errors.push('device-proof');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export default freeze({
  EON_CITY_L95_RUNTIME_PERFORMANCE_SCHEMA,
  buildEonCityL95RuntimePerformanceBudget,
  validateEonCityL95RuntimePerformanceBudget
});
