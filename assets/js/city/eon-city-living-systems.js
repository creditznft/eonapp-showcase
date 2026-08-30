/**
 * W409 — local City living-systems contract.
 *
 * This layer improves the feeling of a living Creator Metropolis without
 * simulating users, fabricating productivity, or starting any work. It is a
 * bounded Babylon presentation profile: visuals remain local, source-only and
 * governed by the existing reduced-effects protection path.
 */
export const EON_CITY_LIVING_SYSTEMS_SCHEMA = 'eon.city.living-systems.w409.v1';

const freeze = (value) => Object.freeze(value);
const QUALITY_PROFILES = freeze({
  lite: freeze({ ambientPodCount: 0, cycleMode: 'static-night', missionBoardDetail: 'compact' }),
  balanced: freeze({ ambientPodCount: 3, cycleMode: 'midnight-dawn', missionBoardDetail: 'full' }),
  cinematic: freeze({ ambientPodCount: 5, cycleMode: 'midnight-dawn', missionBoardDetail: 'full' })
});

export const EON_CITY_LIVING_SYSTEMS_BLUEPRINT = freeze({
  schema: EON_CITY_LIVING_SYSTEMS_SCHEMA,
  id: 'living-creator-metropolis-systems',
  title: 'Living Creator Metropolis Systems',
  publicEngine: 'babylon-eoncity',
  publicRoute: '/eoncity',
  visualTruth: 'bounded authored-procedural atmosphere; binary character and environment art remains unshipped',
  weather: freeze({
    modes: freeze(['rain', 'neon-mist']),
    localVisualOnly: true,
    noRealWorldWeatherClaim: true,
    reducedEffectsFallback: 'pause rain and ambient motion while retaining wayfinding and mission board'
  }),
  dayNight: freeze({
    mode: 'midnight-to-dawn-light-cycle',
    visualOnly: true,
    readsDeviceClock: false,
    cycleMs: 240000,
    reducedEffectsFallback: 'static midnight lighting'
  }),
  npcBehavior: freeze({
    modes: freeze(['idle', 'micro-patrol', 'look-at-landmark']),
    roleCount: 5,
    displaysUserState: false,
    fabricatesWork: false,
    autoStartsWork: false
  }),
  ambientLife: freeze({
    mode: 'distant-light-pods',
    profiles: QUALITY_PROFILES,
    localVisualOnly: true,
    remoteTraffic: false,
    userTracking: false
  }),
  missionBoard: freeze({
    id: 'choose-a-real-work-route',
    title: 'Mission Board',
    source: 'existing local Command District mission card',
    visibleOnly: true,
    autoStart: false,
    autoOpenRoute: false,
    reward: null,
    storesUserContent: false
  }),
  qualityGovernor: freeze({
    source: 'existing Babylon performance protection',
    onProtection: freeze(['pause rain', 'freeze ambient motion', 'static midnight lighting', 'retain routes and mission board']),
    changesUserPreference: false,
    automaticWorkAction: false
  }),
  rendering: freeze({
    originalProcedural: true,
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    binaryAssets: false,
    userData: false
  }),
  nonGoals: freeze(['simulate real people', 'fake work activity', 'reward loop', 'account or project display', 'provider execution', 'final art quality claim'])
});

export function getCityLivingSystemsProfile({ quality = 'balanced', reducedEffects = false } = {}) {
  const key = Object.hasOwn(QUALITY_PROFILES, quality) ? quality : 'balanced';
  const base = QUALITY_PROFILES[key];
  return freeze({
    schema: EON_CITY_LIVING_SYSTEMS_SCHEMA,
    quality: key,
    ambientPodCount: reducedEffects ? 0 : base.ambientPodCount,
    cycleMode: reducedEffects ? 'static-night' : base.cycleMode,
    missionBoardDetail: base.missionBoardDetail,
    rainEnabled: !reducedEffects && key !== 'lite',
    localOnly: true,
    userData: false
  });
}

export function validateCityLivingSystemsBlueprint(blueprint = EON_CITY_LIVING_SYSTEMS_BLUEPRINT) {
  const errors = [];
  if (blueprint?.schema !== EON_CITY_LIVING_SYSTEMS_SCHEMA) errors.push('Unexpected W409 living-systems schema.');
  if (blueprint?.publicEngine !== 'babylon-eoncity' || blueprint?.publicRoute !== '/eoncity') errors.push('W409 must stay on canonical Babylon /eoncity.');
  if (!Array.isArray(blueprint?.weather?.modes) || !blueprint.weather.modes.includes('rain') || !blueprint.weather.modes.includes('neon-mist') || blueprint.weather.localVisualOnly !== true || blueprint.weather.noRealWorldWeatherClaim !== true) errors.push('W409 weather boundary is incomplete.');
  if (blueprint?.dayNight?.visualOnly !== true || blueprint.dayNight.readsDeviceClock !== false || !Number.isFinite(blueprint.dayNight.cycleMs) || blueprint.dayNight.cycleMs < 60000) errors.push('W409 day/night boundary is incomplete.');
  if (!Array.isArray(blueprint?.npcBehavior?.modes) || blueprint.npcBehavior.fabricatesWork !== false || blueprint.npcBehavior.autoStartsWork !== false || blueprint.npcBehavior.displaysUserState !== false) errors.push('W409 NPC behavior boundary is incomplete.');
  if (blueprint?.ambientLife?.remoteTraffic !== false || blueprint.ambientLife.userTracking !== false || blueprint.ambientLife.localVisualOnly !== true) errors.push('W409 ambient-life boundary is incomplete.');
  if (blueprint?.missionBoard?.visibleOnly !== true || blueprint.missionBoard.autoStart !== false || blueprint.missionBoard.autoOpenRoute !== false || blueprint.missionBoard.reward !== null || blueprint.missionBoard.storesUserContent !== false) errors.push('W409 mission-board boundary is incomplete.');
  if (!Array.isArray(blueprint?.qualityGovernor?.onProtection) || blueprint.qualityGovernor.changesUserPreference !== false || blueprint.qualityGovernor.automaticWorkAction !== false) errors.push('W409 quality-governor boundary is incomplete.');
  const rendering = blueprint?.rendering || {};
  if (rendering.originalProcedural !== true || rendering.localOnly !== true || rendering.remoteAssets !== false || rendering.remoteTelemetry !== false || rendering.binaryAssets !== false || rendering.userData !== false) errors.push('W409 renderer boundary is incomplete.');
  if (/https?:\/\//i.test(JSON.stringify(blueprint))) errors.push('W409 contains a forbidden remote URL.');
  return freeze({ schema: EON_CITY_LIVING_SYSTEMS_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}
