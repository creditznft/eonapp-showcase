/**
 * L95-W16 — pressure-driven scene-detail shedding for the canonical Command Hub.
 *
 * This is not a quality-mode authority. The user's selected Lite/Balanced/
 * Cinematic profile remains unchanged. When the maintained W731 FPS protector
 * detects sustained pressure, only distant/decorative presentation layers are
 * shed. Gameplay silhouettes, authored hero stations, player, EONBOT,
 * interactions and productive surfaces are never disabled here.
 */
export const EON_CITY_L95_ADAPTIVE_SCENE_DETAIL_SCHEMA = 'eon.city.adaptive-scene-detail.l95.v1';

const freeze = Object.freeze;

export function deriveEonCityL95AdaptiveSceneDetail({ protectionLevel = 0 } = {}) {
  const level = Math.max(0, Math.min(3, Math.floor(Number(protectionLevel) || 0)));
  return freeze({
    schema: EON_CITY_L95_ADAPTIVE_SCENE_DETAIL_SCHEMA,
    protectionLevel: level,
    skyline: freeze({
      towerSilhouettes: true,
      nearDecor: true,
      midDecor: level < 2,
      farDecor: level < 1,
      distantTransit: level < 2
    }),
    ambient: freeze({
      cinematicVfx: level < 1,
      exteriorCitizenBudget: level === 0 ? 4 : level === 1 ? 2 : 0,
      maintenanceActor: level < 3,
      stationHaloAnimation: level < 2,
      circuitPulseAnimation: level < 2
    }),
    preserve: freeze({
      commandCentreHero: true,
      livingNexusHero: true,
      stations: true,
      player: true,
      eonbot: true,
      interactions: true,
      objectiveMarkers: true
    }),
    truth: freeze({
      changesSelectedQuality: false,
      changesProgression: false,
      changesInteractionAuthority: false,
      performanceProtectionOnly: true,
      reversibleByNewSessionOrExplicitRuntimeRecovery: true
    })
  });
}

export function validateEonCityL95AdaptiveSceneDetail(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_L95_ADAPTIVE_SCENE_DETAIL_SCHEMA) errors.push('schema');
  if (!Number.isInteger(plan.protectionLevel) || plan.protectionLevel < 0 || plan.protectionLevel > 3) errors.push('level');
  if (plan.skyline?.towerSilhouettes !== true || plan.skyline?.nearDecor !== true) errors.push('skyline-core');
  if (plan.protectionLevel >= 1 && plan.skyline?.farDecor !== false) errors.push('far-pressure-shedding');
  if (plan.protectionLevel >= 2 && (plan.skyline?.midDecor !== false || plan.skyline?.distantTransit !== false)) errors.push('mid-pressure-shedding');
  if (!Number.isInteger(plan.ambient?.exteriorCitizenBudget) || plan.ambient.exteriorCitizenBudget < 0 || plan.ambient.exteriorCitizenBudget > 4) errors.push('ambient-citizen-budget');
  if (plan.protectionLevel >= 1 && plan.ambient?.cinematicVfx !== false) errors.push('cinematic-vfx-pressure-shedding');
  if (plan.protectionLevel >= 2 && plan.ambient?.exteriorCitizenBudget !== 0) errors.push('ambient-citizen-pressure-shedding');
  if (Object.values(plan.preserve || {}).some((value) => value !== true)) errors.push('gameplay-preservation');
  if (plan.truth?.changesSelectedQuality || plan.truth?.changesProgression || plan.truth?.changesInteractionAuthority) errors.push('truth-boundary');
  if (plan.truth?.performanceProtectionOnly !== true) errors.push('protection-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export default freeze({
  EON_CITY_L95_ADAPTIVE_SCENE_DETAIL_SCHEMA,
  deriveEonCityL95AdaptiveSceneDetail,
  validateEonCityL95AdaptiveSceneDetail
});
