import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W121_VISUAL_LAYER_SCHEMA,
  W121_VISUAL_OVERHAUL_SCHEMA,
  buildW121VisualOverhaulLayer,
  buildW121VisualOverhaulPlan,
  scoreW121VisualOverhaul
} from '../../assets/js/realm3d/engine/EonCityW121VisualOverhaulRuntime.js';
import { createModularCharacter, getCharacterKitStats } from '../../assets/js/realm3d/engine/EonCityCharacterKit.js';

const sceneSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityFlagshipScene.js', import.meta.url), 'utf8');
const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const visualRuntimeSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityW121VisualOverhaulRuntime.js', import.meta.url), 'utf8');
const packageSource = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

function countUseTargets(group) {
  let count = 0;
  group.traverse((object) => {
    if (object.userData?.useTarget) count += 1;
  });
  return count;
}

test('W121 plan codifies the first-class visual overhaul contract', () => {
  const plan = buildW121VisualOverhaulPlan({ quality: 'neon', worldKind: 'eon-city' });
  assert.equal(plan.schema, W121_VISUAL_OVERHAUL_SCHEMA);
  assert.ok(plan.nonNegotiables.some((item) => /private command room/.test(item)));
  assert.ok(plan.nonNegotiables.some((item) => /Every|every/.test(item)));
  assert.ok(plan.artPasses.some((item) => /luxury command-room/.test(item)));
  assert.ok(plan.artPasses.some((item) => /NPC pass/.test(item)));
  assert.ok(scoreW121VisualOverhaul(plan) >= 99);
});

test('W121 city layer adds detailed facades, props, plants, and use targets without secrets', () => {
  const city = buildEonCityVoxelWorld();
  const layer = buildW121VisualOverhaulLayer({ map: city, quality: 'neon' });
  assert.equal(layer.stats.schema, W121_VISUAL_LAYER_SCHEMA);
  assert.equal(layer.stats.districtCount, 9);
  assert.equal(layer.stats.noSecretSurfaces, true);
  assert.equal(layer.stats.everyMajorVisualHasUseTarget, true);
  assert.ok(layer.stats.upgradedDistricts.includes('ai'));
  assert.ok(layer.stats.upgradedDistricts.includes('portal'));
  assert.ok(layer.stats.upgradedDistricts.includes('device'));
  assert.ok(layer.stats.facadeMicroObjects >= 240);
  assert.ok(layer.stats.cityPlants >= 12);
  assert.ok(layer.stats.cityProps >= 10);
  assert.ok(layer.stats.navigationCues >= 8);
  assert.ok(countUseTargets(layer.group) >= 27);
  assert.ok(scoreW121VisualOverhaul(layer.stats) >= 99);
});

test('W121 private workstation becomes a luxury command hall with AI bot anchors', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'qa-operator' });
  const layer = buildW121VisualOverhaulLayer({ map: room, quality: 'neon' });
  assert.equal(layer.stats.worldKind, 'private-workstation');
  assert.ok(layer.stats.commandRoomMicroObjects >= 60);
  assert.equal(layer.stats.commandRoomScreenUseTargets, 9);
  assert.equal(layer.stats.aiBotAnchors, 6);
  assert.ok(countUseTargets(layer.group) >= 10);
  assert.match(visualRuntimeSource, /w121-luxury-command-room-grand-hall/);
  assert.match(sceneSource, /buildW121VisualOverhaulLayer/);
});

test('W121 keeps mobile/basic mode functional while desktop Neon is richer', () => {
  const city = buildEonCityVoxelWorld();
  const low = buildW121VisualOverhaulLayer({ map: city, quality: 'low' });
  const neon = buildW121VisualOverhaulLayer({ map: city, quality: 'neon' });
  assert.equal(low.stats.mobileDowngrade, true);
  assert.equal(neon.stats.desktopRichDetail, true);
  assert.ok(neon.stats.instanceCount > low.stats.instanceCount);
  assert.ok(neon.stats.useTargetCount >= low.stats.useTargetCount);
});

test('W121 updates NPC micro-detail, generated realms, EngineBoot marker, and QA script', () => {
  const character = createModularCharacter({ npc: { id: 'market-curator', name: 'Market Curator', station: 'store' }, quality: 'standard', accent: 0xfacc15 });
  assert.equal(character.userData.w121NpcVisualDetail, 'role-gadget-cable-tag');
  assert.match(getCharacterKitStats().visualSchema, /w121/);
  const realm = buildMyRealmVoxelWorld({ username: 'qauser', seed: 'w121' });
  assert.equal(realm.visualOverhaulPlan.schema, W121_VISUAL_OVERHAUL_SCHEMA);
  assert.ok(realm.visualOverhaulScore >= 99);
  assert.match(bootSource, /realmVisualOverhaulSession = 'w121'/);
  assert.match(packageSource, /qa:w121-eoncity-visual-overhaul/);
});
