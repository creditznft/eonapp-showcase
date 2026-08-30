import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonCityVoxelWorld,
  buildMyRealmVoxelWorld,
  buildPrivateWorkstationVoxelWorld
} from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildFinalAaaPolishBlocks, scoreFinalAaaUserExperience } from '../../assets/js/realm3d/engine/EonCityFinalAaaPolish.js';
import { BLOCKS } from '../../assets/js/realm3d/engine/BlockPalette.js';

const requiredFinalBlocks = ['cinemaCyan', 'cinemaViolet', 'cinemaGold', 'screenRibbon', 'lootboxPod', 'agentTrail', 'holoMist', 'softFog'];

function countBlocks(world, predicate) {
  return (world.blocks || []).filter(predicate).length;
}

function assertWorldReady(world, minimumScore, label) {
  const score = world.finalAaaUserScore || scoreFinalAaaUserExperience(world);
  assert.ok(score.total >= minimumScore, `${label} score too low: ${score.total}`);
  assert.ok(countBlocks(world, (block) => block.finalAaaPolish) >= (world.kind === 'eon-city' ? 230 : 80), `${label} lacks final AAA polish blocks`);
  assert.ok(countBlocks(world, (block) => block.animation || block.cinematicAnchor) >= (world.kind === 'eon-city' ? 170 : 60), `${label} lacks animated/cinematic anchors`);
  assert.ok(score.metrics.uniqueBlockTypes >= 40, `${label} needs richer block variety, got ${score.metrics.uniqueBlockTypes}`);
  assert.equal(world.finalAaaVisualQa?.passBeforeRelease, false, `${label} must still require real browser screenshots before release`);
}

test('W92 final AAA polish block palette exists for cinematic EON City visuals', () => {
  for (const id of requiredFinalBlocks) assert.ok(BLOCKS[id], `missing final block type ${id}`);
  const cityPolish = buildFinalAaaPolishBlocks({ kind: 'eon-city' });
  const realmPolish = buildFinalAaaPolishBlocks({ kind: 'my-realm', seed: 'qa' });
  assert.ok(cityPolish.length >= 230, `expected city polish density, got ${cityPolish.length}`);
  assert.ok(realmPolish.length >= 80, `expected user realm polish density, got ${realmPolish.length}`);
  assert.ok(cityPolish.some((block) => block.type === 'lootboxPod'), 'city polish must include lootbox pods');
  assert.ok(realmPolish.some((block) => block.type === 'lootboxPod'), 'user realm polish must include lootbox pods');
});

test('W92 EON City scores as near-AAA web voxel after final polish, but still requires real screenshots', () => {
  const world = buildEonCityVoxelWorld();
  const privateWorkstation = buildPrivateWorkstationVoxelWorld({ owner: 'qa-screen-count' });
  assertWorldReady(world, 94, 'EON City');
  assert.ok(world.cityStationScreens.length >= 12, 'all main city stations should be interactive');
  assert.ok(world.workstationScreens.length >= 12, 'public city should expose its complete safe station set');
  assert.ok(
    world.workstationScreens.length + privateWorkstation.workstationScreens.length >= 20,
    'public city plus the privacy-separated workstation should provide many safe in-world screens'
  );
  assert.ok(JSON.stringify(world).includes('lootbox'), 'lootboxes must be present in city rewards/market');
});

test('W92 private workstation and generated user realms reach the same quality family as EON City', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'qa' });
  const realm = buildMyRealmVoxelWorld({ username: 'qa-owner', seed: 'w92-final' });
  assertWorldReady(room, 90, 'Private workstation');
  assertWorldReady(realm, 92, 'Generated realm');
  assert.ok(room.npcs.some((npc) => npc.agentNpc || npc.id.includes('operator')), 'private room needs agent/EONBot presence');
  assert.ok(realm.npcs.some((npc) => npc.audience === 'realm-visitors-scripted-only'), 'generated realm needs visitor-safe guide NPCs');
});

test('W92 final polish keeps safety rules: no secrets in screens, browser QA still required, lootbox rewards stay app-safe', () => {
  const city = buildEonCityVoxelWorld();
  const unsafeRoute = (city.workstationScreens || []).find((screen) => /javascript:|data:|file:|blob:/i.test(screen.route || ''));
  assert.equal(unsafeRoute, undefined, 'no unsafe workstation screen routes');
  assert.ok(city.finalAaaVisualQa.requiredViewports.length >= 4, 'must cover mobile portrait, mobile landscape, tablet and desktop');
  assert.ok(city.finalAaaVisualQa.secretSafety.includes('no API keys'), 'visual QA must block secret display');
  assert.ok(city.lootboxRewardScore?.total >= 95, 'lootbox runtime should stay ready');
});
