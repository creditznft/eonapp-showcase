/**
 * RT91 — flagship Open World product/authority contract.
 *
 * RT90 proved the three playable world foundations. RT91 builds long-term game
 * depth on top of them without creating a second Babylon runtime or moving
 * progression authority into AI-generated content.
 */
export const EON_CITY_RT91_FLAGSHIP_WORLD_SCHEMA = 'eon.city.flagship-world.rt91.v1';

const freeze = Object.freeze;
const frozenArray = (values = []) => freeze([...values]);

const world = ({ id, label, identity, authoredMacro, deterministicMicro, pillars, longTermLoop }) => freeze({
  id,
  label,
  identity,
  authoredMacro: frozenArray(authoredMacro),
  deterministicMicro: frozenArray(deterministicMicro),
  pillars: frozenArray(pillars),
  longTermLoop: frozenArray(longTermLoop),
  aiRequiredForBasicGameplay: false,
  aiMayEnhanceBriefingAndDialogue: true,
  deterministicProgressionAuthority: true,
  authoredHeroLandmarksRequired: true,
  directReviewDoesNotGrantProgression: true
});

export const EON_CITY_RT91_FLAGSHIP_WORLDS = freeze([
  world({
    id: 'signal-frontier',
    label: 'Signal Frontier',
    identity: 'narrative-restoration-exploration',
    authoredMacro: ['five authored zones', 'main campaign', 'hero landmarks', 'restoration milestones', 'major transit route'],
    deterministicMicro: ['zone contracts', 'discovery cells', 'maintenance activity', 'salvage locations', 'bounded dynamic events'],
    pillars: ['story continuity', 'visual restoration', 'discoverability', 'clear next action', 'zone mastery'],
    longTermLoop: ['campaign', 'zone mastery', 'frontier contracts', 'discoveries', 'post-campaign restoration activity']
  }),
  world({
    id: 'storm-sector',
    label: 'Storm Sector',
    identity: 'environmental-hazard-rescue-restoration',
    authoredMacro: ['storm command spire', 'atmospheric stabilizer', 'charged transit gate', 'main storm campaign', 'safe-route topology'],
    deterministicMicro: ['storm cells', 'rescue sites', 'relay failures', 'maintenance incidents', 'weather event variants'],
    pillars: ['hazard readability', 'rescue', 'infrastructure repair', 'weather transformation', 'route adaptation'],
    longTermLoop: ['campaign', 'storm mastery', 'rescue contracts', 'repair contracts', 'bounded regional events']
  }),
  world({
    id: 'my-frontier',
    label: 'My Frontier',
    identity: 'persistent-city-builder-productive-rpg',
    authoredMacro: ['seven district anchors', 'collision-safe primary plots', 'district hero buildings', 'public transit spine', 'persistent district evolution'],
    deterministicMicro: ['civic support sites', 'public streets', 'plazas', 'ambient city cells', 'bounded resident activity'],
    pillars: ['personal evolution', 'safe construction', 'productive RPG', 'district identity', 'persistent city life'],
    longTermLoop: ['district questlines', 'productive missions', 'district upgrades', 'city contracts', 'world customization']
  })
]);

export const EON_CITY_RT91_SHARED_INVARIANTS = freeze({
  canonicalBabylonEngineCount: 1,
  canonicalActiveSceneOwnerCount: 1,
  canonicalRenderLoopOwnerCount: 1,
  firstPlayableFrameBeforeOptionalWorldDressing: true,
  hiddenWorldHeavyWorkSuspended: true,
  sameSessionValidatedAssetReuseAllowed: true,
  wholeMapEagerLoadingForbidden: true,
  contentAddressedSameOriginAssetsRequired: true,
  authoredMacroDeterministicMicro: true,
  runtimeAiGeometryGenerationAllowed: false,
  runtimeAiMissionAuthorityAllowed: false,
  rawUserWorldCoordinatesAllowed: false,
  tradableLandCreated: false,
  privatePromptContentRequiredForProgression: false,
  localAiOptionalForGameCompletion: true,
  generatedContentMustBeSeedDeterministic: true,
  generatedObjectivesMustUseCertifiedTemplates: true,
  persistentNextActionRequired: true,
  inaccessibleDecorativeInteractablesForbidden: true
});

export const EON_CITY_RT91_CONTENT_LAYERS = freeze([
  freeze({ id: 'boot-critical', purpose: 'terrain, player, camera, essential collision, lighting and orientation-critical landmarks', mayBlockFirstPlayableFrame: true }),
  freeze({ id: 'near-player', purpose: 'interactive buildings, NPCs, mission props and high-detail authored assets', mayBlockFirstPlayableFrame: false }),
  freeze({ id: 'mid-distance', purpose: 'static prop clusters, lower LOD architecture and landscape continuity', mayBlockFirstPlayableFrame: false }),
  freeze({ id: 'horizon', purpose: 'instanced silhouettes, impostors, sky, fog, lighting and very cheap scale cues', mayBlockFirstPlayableFrame: false })
]);

export function getEonCityRt91FlagshipWorld(worldId = '') {
  const id = String(worldId || '').trim().toLowerCase();
  return EON_CITY_RT91_FLAGSHIP_WORLDS.find((entry) => entry.id === id) || null;
}

export function validateEonCityRt91FlagshipWorldContract({
  worlds = EON_CITY_RT91_FLAGSHIP_WORLDS,
  invariants = EON_CITY_RT91_SHARED_INVARIANTS,
  layers = EON_CITY_RT91_CONTENT_LAYERS
} = {}) {
  const errors = [];
  const ids = new Set((worlds || []).map((entry) => entry?.id));
  for (const required of ['signal-frontier', 'storm-sector', 'my-frontier']) if (!ids.has(required)) errors.push(`world-missing:${required}`);
  if ((worlds || []).length !== 3 || ids.size !== 3) errors.push('exactly-three-flagship-worlds-required');
  for (const entry of worlds || []) {
    if (!entry?.identity || (entry.authoredMacro?.length || 0) < 4 || (entry.deterministicMicro?.length || 0) < 4) errors.push(`world-depth:${entry?.id || 'unknown'}`);
    if (entry?.aiRequiredForBasicGameplay !== false || entry?.deterministicProgressionAuthority !== true) errors.push(`authority-boundary:${entry?.id || 'unknown'}`);
  }
  if (invariants?.canonicalBabylonEngineCount !== 1 || invariants?.canonicalActiveSceneOwnerCount !== 1 || invariants?.canonicalRenderLoopOwnerCount !== 1) errors.push('single-runtime-authority');
  if (invariants?.firstPlayableFrameBeforeOptionalWorldDressing !== true || invariants?.hiddenWorldHeavyWorkSuspended !== true || invariants?.wholeMapEagerLoadingForbidden !== true) errors.push('performance-invariants');
  if (invariants?.runtimeAiGeometryGenerationAllowed !== false || invariants?.runtimeAiMissionAuthorityAllowed !== false || invariants?.localAiOptionalForGameCompletion !== true) errors.push('ai-truth-boundary');
  if (invariants?.rawUserWorldCoordinatesAllowed !== false || invariants?.tradableLandCreated !== false) errors.push('world-safety-boundary');
  if (invariants?.generatedContentMustBeSeedDeterministic !== true || invariants?.generatedObjectivesMustUseCertifiedTemplates !== true) errors.push('generation-boundary');
  if (invariants?.persistentNextActionRequired !== true || invariants?.inaccessibleDecorativeInteractablesForbidden !== true) errors.push('gameplay-continuity');
  const layerIds = new Set((layers || []).map((entry) => entry?.id));
  for (const required of ['boot-critical', 'near-player', 'mid-distance', 'horizon']) if (!layerIds.has(required)) errors.push(`content-layer:${required}`);
  if ((layers || []).filter((entry) => entry?.mayBlockFirstPlayableFrame === true).map((entry) => entry.id).join('|') !== 'boot-critical') errors.push('first-frame-layer-boundary');
  return freeze({ ok: errors.length === 0, errors: frozenArray(errors), worldCount: worlds?.length || 0, contentLayerCount: layers?.length || 0 });
}

export default freeze({
  EON_CITY_RT91_FLAGSHIP_WORLD_SCHEMA,
  EON_CITY_RT91_FLAGSHIP_WORLDS,
  EON_CITY_RT91_SHARED_INVARIANTS,
  EON_CITY_RT91_CONTENT_LAYERS,
  getEonCityRt91FlagshipWorld,
  validateEonCityRt91FlagshipWorldContract
});
