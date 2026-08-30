/** RT91 Signal — composed read-only flagship projection for runtime/UI consumers. */
import { buildEonCityRt91SignalDensityPlan, validateEonCityRt91SignalDensityPlan } from './eon-city-rt91-signal-density-plan.js';
import { buildEonCityRt91SignalRouteLanguage, validateEonCityRt91SignalRouteLanguage } from './eon-city-rt91-signal-route-language.js';
import { EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS, validateEonCityRt91SignalZoneMastery } from './eon-city-rt91-signal-zone-mastery.js';
import { buildEonCityRt91SignalContractCells, validateEonCityRt91SignalContractCells } from './eon-city-rt91-signal-contract-cells.js';
import { projectEonCityRt91SignalTransformation, validateEonCityRt91SignalTransformation } from './eon-city-rt91-signal-transformation.js';
import { validateEonCityRt91SignalZoneIdentities } from './eon-city-rt91-signal-zone-identity.js';

export const EON_CITY_RT91_SIGNAL_FLAGSHIP_SCHEMA = 'eon.city.signal.flagship.rt91.v1';
const freeze = Object.freeze;

export function buildEonCityRt91SignalFlagshipProjection({ quality = 'balanced', worldSeed = 1, progress = {} } = {}) {
  const transformation = projectEonCityRt91SignalTransformation(progress);
  const restorationByZone = Object.fromEntries(transformation.zones.map((zone) => [zone.id, zone.progressRatio]));
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_FLAGSHIP_SCHEMA,
    worldId: 'signal-frontier',
    density: buildEonCityRt91SignalDensityPlan({ quality, worldSeed }),
    routeLanguage: buildEonCityRt91SignalRouteLanguage({ restorationByZone }),
    zoneMasteryMissions: EON_CITY_RT91_SIGNAL_ZONE_MASTERY_MISSIONS,
    contractCells: buildEonCityRt91SignalContractCells(),
    transformation,
    campaignReplacement: false,
    existingSevenMissionCampaignPreserved: true,
    firstFrameAssetDelta: 0,
    wholeMapEagerLoadAllowed: false,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    writesProgression: false
  });
}

export function validateEonCityRt91SignalFlagshipProjection(projection = {}) {
  const errors = [];
  if (projection.schema !== EON_CITY_RT91_SIGNAL_FLAGSHIP_SCHEMA || projection.worldId !== 'signal-frontier') errors.push('schema-world');
  const checks = [
    validateEonCityRt91SignalZoneIdentities(),
    validateEonCityRt91SignalDensityPlan(projection.density),
    validateEonCityRt91SignalRouteLanguage(projection.routeLanguage),
    validateEonCityRt91SignalZoneMastery(),
    validateEonCityRt91SignalContractCells(projection.contractCells),
    validateEonCityRt91SignalTransformation(projection.transformation)
  ];
  checks.forEach((result, index) => { if (!result.ok) errors.push(`check-${index}:${result.errors.join('|')}`); });
  if (projection.zoneMasteryMissions?.length !== 10 || projection.firstFrameAssetDelta !== 0) errors.push('content-count-budget');
  if (projection.campaignReplacement || projection.existingSevenMissionCampaignPreserved !== true) errors.push('campaign-boundary');
  if (projection.wholeMapEagerLoadAllowed || projection.ownsEngine || projection.ownsScene || projection.ownsRenderLoop || projection.writesProgression) errors.push('runtime-authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), zoneMasteryMissionCount: projection.zoneMasteryMissions?.length || 0, contractCellCount: projection.contractCells?.cellCount || 0 });
}

export default freeze({ EON_CITY_RT91_SIGNAL_FLAGSHIP_SCHEMA, buildEonCityRt91SignalFlagshipProjection, validateEonCityRt91SignalFlagshipProjection });
