import test from 'node:test';
import assert from 'node:assert/strict';

import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W156_ULTRA_SHOWCASE_LAYERS,
  W156_ULTRA_SHOWCASE_ROADMAP,
  W156_ULTRA_SHOWCASE_SCHEMA,
  applyW156UltraShowcasePlanToWorld,
  buildW156EonCityUltraShowcasePlan,
  createW156UltraShowcaseLayer,
  resolveW156UltraShowcaseTier,
  scoreW156UltraShowcasePlan
} from '../../assets/js/realm3d/engine/EonCityW156UltraShowcaseRuntime.js';

test('W156 builds a desktop-ultra showcase plan with safe room, NPC, portal, photo, and GPU proofs', () => {
  const world = buildEonCityVoxelWorld();
  const plan = buildW156EonCityUltraShowcasePlan({
    worldKind: 'eon-city',
    quality: 'neon',
    world,
    device: { mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true, saveData: false, reducedMotion: false }
  });
  const score = scoreW156UltraShowcasePlan(plan);
  assert.equal(plan.schema, W156_ULTRA_SHOWCASE_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(plan.tier.id, 'desktop-ultra');
  assert.ok(W156_ULTRA_SHOWCASE_LAYERS.length >= 9);
  assert.ok(W156_ULTRA_SHOWCASE_ROADMAP.length >= 10);
  assert.ok(plan.roomAudit.allRoomsSafe);
  assert.ok(plan.npcFaceKits.length >= 6);
  assert.ok(plan.photoModeSpots.length >= 8);
  assert.equal(plan.gpuGovernor.mobileHeavyMeshes, 0);
  assert.equal(plan.safety.userDataMutation, false);
  assert.equal(plan.safety.navigationRequiresUserTap, true);
});

test('W156 protects low, touch, save-data, and reduced-motion devices', () => {
  const tier = resolveW156UltraShowcaseTier({
    quality: 'neon',
    mobile: true,
    touch: true,
    deviceMemory: 2,
    hardwareConcurrency: 2,
    webgl2: true,
    saveData: true,
    reducedMotion: true
  });
  const runtime = createW156UltraShowcaseLayer({ map: buildEonCityVoxelWorld(), quality: 'low' });
  assert.equal(tier.id, 'protected-low');
  assert.equal(tier.enabled, false);
  assert.equal(tier.maxSkylineObjects, 0);
  assert.equal(runtime.group, null);
  assert.equal(runtime.stats.skipped, true);
  assert.equal(runtime.stats.mobileHeavyMeshes, 0);
});

test('W156 applies to generated realms without breaking EON City quality parity', () => {
  const realm = buildMyRealmVoxelWorld({ username: 'tester' });
  applyW156UltraShowcasePlanToWorld(realm, {
    quality: 'neon',
    device: { mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true, saveData: false, reducedMotion: false }
  });
  assert.equal(realm.w156UltraShowcaseScore.score, 100);
  assert.ok(Array.isArray(realm.ultraShowcaseRoadmap));
  assert.ok(realm.ultraShowcaseRoadmap.some((phase) => phase.id === 'W163'));
  assert.ok(realm.npcs.some((npc) => npc.w156HeroFaceKit?.schema === `${W156_ULTRA_SHOWCASE_SCHEMA}.npc-face-kit`));
  assert.equal(realm.w156UltraShowcasePlan.safety.rawApiKeysRendered, false);
});
