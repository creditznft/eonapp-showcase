/** RT92 Command Hub Gold Master visual plan. */
export const EON_CITY_RT92_COMMAND_HUB_GOLD_MASTER_SCHEMA = 'eon.city.command-hub-gold-master.rt92.v1';
const freeze = Object.freeze;
const QUALITY = freeze({
  lite: freeze({ microTraceCount: 18, nexusOrbitCount: 2, guidePylonCount: 6, overheadFinCount: 6, pulseNodeCount: 6 }),
  balanced: freeze({ microTraceCount: 30, nexusOrbitCount: 3, guidePylonCount: 8, overheadFinCount: 8, pulseNodeCount: 10 }),
  cinematic: freeze({ microTraceCount: 42, nexusOrbitCount: 3, guidePylonCount: 10, overheadFinCount: 10, pulseNodeCount: 14 })
});

function qualityId(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(QUALITY, id) ? id : 'balanced';
}

export function buildEonCityRt92CommandHubGoldMasterPlan({ quality = 'balanced', reducedMotion = false } = {}) {
  const id = qualityId(quality);
  const budget = QUALITY[id];
  return freeze({
    schema: EON_CITY_RT92_COMMAND_HUB_GOLD_MASTER_SCHEMA,
    worldId: 'command-hub',
    quality: id,
    thesis: 'Living Circuit Citadel — technological heart, not generic neon lobby',
    nexus: freeze({
      orbitCount: budget.nexusOrbitCount,
      cradlePylonCount: 4,
      crownHeight: 4.7,
      orbitalMotion: !reducedMotion,
      focalOnlyBloom: true,
      fakeActivity: false
    }),
    motherboard: freeze({
      microTraceCount: budget.microTraceCount,
      pulseNodeCount: budget.pulseNodeCount,
      stationConnectivityPreserved: true,
      randomCrossings: false,
      readableWalkingRoutes: true
    }),
    verticality: freeze({
      guidePylonCount: budget.guidePylonCount,
      overheadFinCount: budget.overheadFinCount,
      cameraCorridorSafe: true,
      collisionFreeDecoration: true
    }),
    skyline: freeze({ existingAuthoredSkylineExtended: true, noNewBinaryAssets: true, layeredSilhouettesRequired: true }),
    materialLaw: freeze({ neutralStructureShareMin: 0.7, emissiveShareMax: 0.1, allEdgeNeonForbidden: true }),
    performance: freeze({ firstFrameNewBinaryBytes: 0, proceduralGeometryOnly: true, newRemoteTextures: 0, sameScene: true, sameRenderLoop: true })
  });
}

export function validateEonCityRt92CommandHubGoldMasterPlan(plan = buildEonCityRt92CommandHubGoldMasterPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT92_COMMAND_HUB_GOLD_MASTER_SCHEMA || plan?.worldId !== 'command-hub') errors.push('schema-world');
  if (Number(plan?.nexus?.orbitCount || 0) < 2 || plan?.nexus?.cradlePylonCount !== 4 || plan?.nexus?.fakeActivity !== false) errors.push('nexus');
  if (Number(plan?.motherboard?.microTraceCount || 0) < 18 || Number(plan?.motherboard?.pulseNodeCount || 0) < 6 || plan?.motherboard?.randomCrossings !== false) errors.push('motherboard');
  if (Number(plan?.verticality?.guidePylonCount || 0) < 6 || plan?.verticality?.cameraCorridorSafe !== true || plan?.verticality?.collisionFreeDecoration !== true) errors.push('verticality');
  if (Number(plan?.materialLaw?.neutralStructureShareMin || 0) < 0.7 || Number(plan?.materialLaw?.emissiveShareMax || 1) > 0.1 || plan?.materialLaw?.allEdgeNeonForbidden !== true) errors.push('material-law');
  if (plan?.performance?.firstFrameNewBinaryBytes !== 0 || plan?.performance?.proceduralGeometryOnly !== true || plan?.performance?.newRemoteTextures !== 0 || plan?.performance?.sameScene !== true || plan?.performance?.sameRenderLoop !== true) errors.push('performance-authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export default freeze({ EON_CITY_RT92_COMMAND_HUB_GOLD_MASTER_SCHEMA, buildEonCityRt92CommandHubGoldMasterPlan, validateEonCityRt92CommandHubGoldMasterPlan });
