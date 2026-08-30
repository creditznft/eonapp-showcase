/**
 * W408 — Creator Atrium and Forge Bay authored-procedural district contract.
 *
 * The City may orient a person toward real Creator and Forge work without
 * duplicating editors, reading a project, or starting a route. The visible
 * handoff stays the existing W404 Creator Atrium launch board: every native
 * destination requires a separate foreground user choice.
 */
export const EON_CITY_CREATOR_FORGE_DISTRICT_SCHEMA = 'eon.city.creator-forge-district.w408.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ROUTES = new Set(['/workspace#creator-engine', '/forge', '/local-ai#creator-media', '/workspace#eon-asset-provenance-title']);

export const EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT = freeze({
  schema: EON_CITY_CREATOR_FORGE_DISTRICT_SCHEMA,
  id: 'creator-atrium-forge-bay',
  title: 'Creator Atrium & Forge Bay',
  publicEngine: 'babylon-eoncity',
  publicRoute: '/eoncity',
  visualTruth: 'authored-procedural district slice; provenance-reviewed binary art remains unshipped',
  districts: freeze([
    freeze({
      id: 'creator-atrium',
      title: 'Creator Atrium',
      purpose: 'Orient visual, audio, video and campaign planning toward a native local workspace.',
      visibleLaunches: freeze([
        freeze({ id: 'creator-engine', route: '/workspace#creator-engine', label: 'Creator Engine' }),
        freeze({ id: 'local-media', route: '/local-ai#creator-media', label: 'Local Media Path' })
      ]),
      fallback: 'procedural-creator-atrium'
    }),
    freeze({
      id: 'forge-bay',
      title: 'Forge Bay',
      purpose: 'Orient local website and prototype work toward Forge with a separate visible choice.',
      visibleLaunches: freeze([
        freeze({ id: 'forge', route: '/forge', label: 'Forge' }),
        freeze({ id: 'asset-receipts', route: '/workspace#eon-asset-provenance-title', label: 'Asset Receipts' })
      ]),
      fallback: 'procedural-forge-bay'
    })
  ]),
  handoff: freeze({
    launchBoard: 'W404 Creator Atrium',
    foregroundUserGestureOnly: true,
    visibleReviewRequired: true,
    automaticNavigation: false,
    automaticExecution: false,
    transfersPrivateWork: false,
    readsAccountState: false,
    startsProviderWork: false
  }),
  rendering: freeze({
    originalProcedural: true,
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    binaryAssets: false,
    userData: false,
    mobileFallback: 'retain both facade silhouettes, labels and launch-board route on reduced detail'
  }),
  nonGoals: freeze(['duplicate editor', 'private project display', 'automatic route opening', 'provider run', 'public posting', 'commerce, reward or referral loop', 'final art quality claim'])
});

export function getCreatorForgeDistrictDestinations() {
  return EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.districts.flatMap((district) => district.visibleLaunches.map((entry) => ({ ...entry, districtId: district.id })));
}

export function validateCreatorForgeDistrictBlueprint(blueprint = EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT) {
  const errors = [];
  if (blueprint?.schema !== EON_CITY_CREATOR_FORGE_DISTRICT_SCHEMA) errors.push('Unexpected W408 Creator/Forge district schema.');
  if (blueprint?.publicEngine !== 'babylon-eoncity' || blueprint?.publicRoute !== '/eoncity') errors.push('Creator/Forge district must stay on canonical Babylon /eoncity.');
  if (!Array.isArray(blueprint?.districts) || blueprint.districts.length !== 2) errors.push('Creator/Forge district requires exactly two authored locations.');
  const ids = new Set();
  const routes = new Set();
  for (const district of blueprint?.districts || []) {
    const id = String(district?.id || '');
    if (!['creator-atrium', 'forge-bay'].includes(id)) errors.push(`Unexpected W408 district id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate W408 district id: ${id}`);
    ids.add(id);
    if (!String(district?.title || '').trim() || !String(district?.purpose || '').trim()) errors.push(`Incomplete W408 district: ${id || '(empty)'}`);
    if (!Array.isArray(district?.visibleLaunches) || district.visibleLaunches.length !== 2) errors.push(`W408 district needs two visible native choices: ${id || '(empty)'}`);
    for (const launch of district?.visibleLaunches || []) {
      const route = String(launch?.route || '');
      if (!SAFE_ROUTES.has(route)) errors.push(`Unsafe W408 launch route: ${route || '(empty)'}`);
      if (routes.has(route)) errors.push(`Duplicate W408 launch route: ${route}`);
      routes.add(route);
    }
  }
  for (const required of ['creator-atrium', 'forge-bay']) if (!ids.has(required)) errors.push(`W408 is missing ${required}.`);
  if (blueprint?.handoff?.launchBoard !== 'W404 Creator Atrium' || blueprint?.handoff?.foregroundUserGestureOnly !== true || blueprint?.handoff?.visibleReviewRequired !== true || blueprint?.handoff?.automaticNavigation !== false || blueprint?.handoff?.automaticExecution !== false || blueprint?.handoff?.transfersPrivateWork !== false || blueprint?.handoff?.readsAccountState !== false || blueprint?.handoff?.startsProviderWork !== false) errors.push('W408 handoff boundary is incomplete.');
  const rendering = blueprint?.rendering || {};
  if (rendering.originalProcedural !== true || rendering.localOnly !== true || rendering.remoteAssets !== false || rendering.remoteTelemetry !== false || rendering.binaryAssets !== false || rendering.userData !== false) errors.push('W408 rendering boundary is incomplete.');
  if (/https?:\/\//i.test(JSON.stringify(blueprint))) errors.push('W408 contains a forbidden remote URL.');
  return freeze({ schema: EON_CITY_CREATOR_FORGE_DISTRICT_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}
