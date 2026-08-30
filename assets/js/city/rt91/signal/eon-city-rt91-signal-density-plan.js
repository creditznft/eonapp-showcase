/** RT91 Signal — perceived-density plan layered over existing bounded presenters. */
import { deriveEonExpanseW771BEnvironmentKitPlan } from '../../w771/eon-expanse-w771b-zone-environment-kit-plan.js';
import { createEonCityL95SignalFrontierOuterLandscapePlan } from '../../l95/eon-city-l95-signal-frontier-outer-landscape-contract.js';
import { EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES } from './eon-city-rt91-signal-zone-identity.js';

export const EON_CITY_RT91_SIGNAL_DENSITY_SCHEMA = 'eon.city.signal.density-plan.rt91.v1';
const freeze = Object.freeze;
const QUALITY = freeze({
  lite: freeze({ nearClusters: 2, midClusters: 2, horizonCards: 1, optionalConcurrentLoads: 1 }),
  balanced: freeze({ nearClusters: 3, midClusters: 3, horizonCards: 2, optionalConcurrentLoads: 2 }),
  cinematic: freeze({ nearClusters: 4, midClusters: 4, horizonCards: 3, optionalConcurrentLoads: 3 })
});

export function buildEonCityRt91SignalDensityPlan({ quality = 'balanced', worldSeed = 1 } = {}) {
  const resolvedQuality = Object.hasOwn(QUALITY, quality) ? quality : 'balanced';
  const budget = QUALITY[resolvedQuality];
  const environment = deriveEonExpanseW771BEnvironmentKitPlan({ quality: resolvedQuality, worldSeed });
  const outer = createEonCityL95SignalFrontierOuterLandscapePlan({ quality: resolvedQuality, worldSeed });
  const environmentByZone = new Map(environment.zones.map((zone) => [zone.zoneId, zone]));
  const outerByZone = new Map(outer.zones.map((zone) => [zone.zoneId, zone]));
  const zones = EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES.map((identity) => {
    const environmentZone = environmentByZone.get(identity.zoneId);
    const outerZone = outerByZone.get(identity.zoneId);
    return freeze({
      zoneId: identity.zoneId,
      heroAssetId: identity.heroAssetId,
      existingEnvironmentModuleCount: environmentZone?.moduleCount || 0,
      existingOuterSupportMeshBudget: outerZone?.supportMeshBudget || 0,
      density: freeze({
        nearPlayerClusters: budget.nearClusters,
        midDistanceClusters: budget.midClusters,
        horizonRepresentations: budget.horizonCards
      }),
      clusterPolicy: freeze({
        near: 'small-instanced-zone-prop-family',
        mid: 'instanced-or-low-lod-static-silhouette',
        horizon: 'impostor-billboard-or-low-poly-silhouette'
      }),
      activeDetailFollowsPlayer: true,
      optionalOnly: true,
      firstFrameExcluded: true,
      backgroundIsInteractive: false,
      authoredHeroRemainsDominant: true
    });
  });
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_DENSITY_SCHEMA,
    quality: resolvedQuality,
    worldSeed: Number(worldSeed || 1),
    zones: freeze(zones),
    zoneCount: zones.length,
    optionalConcurrentLoads: budget.optionalConcurrentLoads,
    existingOuterLandscapeMeshBudget: outer.meshBudget,
    bootCriticalAssetDelta: 0,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    rawUserCoordinatesAccepted: false,
    wholeMapEagerLoadAllowed: false
  });
}

export function validateEonCityRt91SignalDensityPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_SIGNAL_DENSITY_SCHEMA) errors.push('schema');
  if (plan.zoneCount !== 5 || plan.zones?.length !== 5) errors.push('zone-count');
  if (plan.bootCriticalAssetDelta !== 0 || plan.wholeMapEagerLoadAllowed !== false) errors.push('first-frame-boundary');
  if (plan.ownsEngine || plan.ownsScene || plan.ownsRenderLoop || plan.rawUserCoordinatesAccepted) errors.push('runtime-authority');
  if (!Number.isInteger(plan.optionalConcurrentLoads) || plan.optionalConcurrentLoads < 1 || plan.optionalConcurrentLoads > 3) errors.push('load-budget');
  for (const zone of plan.zones || []) {
    if (!zone.zoneId || !zone.heroAssetId || zone.optionalOnly !== true || zone.firstFrameExcluded !== true || zone.backgroundIsInteractive !== false) errors.push(`zone:${zone?.zoneId || 'missing'}`);
    if (zone.authoredHeroRemainsDominant !== true || zone.activeDetailFollowsPlayer !== true) errors.push(`hierarchy:${zone?.zoneId || 'missing'}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), zoneCount: plan.zones?.length || 0, bootCriticalAssetDelta: Number(plan.bootCriticalAssetDelta || 0) });
}

export default freeze({ EON_CITY_RT91_SIGNAL_DENSITY_SCHEMA, buildEonCityRt91SignalDensityPlan, validateEonCityRt91SignalDensityPlan });
