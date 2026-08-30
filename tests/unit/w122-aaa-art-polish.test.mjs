import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W122_AAA_ART_LAYER_SCHEMA,
  W122_AAA_ART_SCHEMA,
  buildW122AaaArtLayer,
  buildW122AaaArtPlan,
  scoreW122AaaArtPolish
} from '../../assets/js/realm3d/engine/EonCityW122AaaArtPolishRuntime.js';
import { createModularCharacter, getCharacterKitStats } from '../../assets/js/realm3d/engine/EonCityCharacterKit.js';

const sceneSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityFlagshipScene.js', import.meta.url), 'utf8');
const runtimeSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityW122AaaArtPolishRuntime.js', import.meta.url), 'utf8');
const packageSource = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

function countUseTargets(group) {
  let count = 0;
  group.traverse((object) => {
    if (object.userData?.useTarget) count += 1;
  });
  return count;
}

test('W122 plan critiques W121 and defines a second-pass AAA art direction', () => {
  const plan = buildW122AaaArtPlan({ quality: 'neon', worldKind: 'eon-city' });
  assert.equal(plan.schema, W122_AAA_ART_SCHEMA);
  assert.ok(plan.critiqueFromW121.some((item) => /facades/.test(item)));
  assert.ok(plan.extraArtPasses.some((item) => /executive command hall/.test(item)));
  assert.ok(plan.extraArtPasses.some((item) => /district hero identity/.test(item)));
  assert.ok(plan.safeguards.some((item) => /no user secrets/.test(item)));
  assert.ok(scoreW122AaaArtPolish(plan) >= 99);
});

test('W122 city layer adds hero identity, NPC scenelets, atmospheric rhythm, and richer desktop detail', () => {
  const city = buildEonCityVoxelWorld();
  const layer = buildW122AaaArtLayer({ map: city, quality: 'neon' });
  assert.equal(layer.stats.schema, W122_AAA_ART_LAYER_SCHEMA);
  assert.equal(layer.stats.districtCount, 9);
  assert.equal(layer.stats.designCritiqueResolved, true);
  assert.equal(layer.stats.noSecretSurfaces, true);
  assert.ok(layer.stats.landmarkIdentityCount >= 9);
  assert.ok(layer.stats.facadeMicroObjects >= 520);
  assert.ok(layer.stats.npcScenelets >= 18);
  assert.ok(layer.stats.atmosphereObjects >= 28);
  assert.ok(layer.stats.botanicalVariants >= 4);
  assert.ok(layer.stats.serviceDroneCount >= 8);
  assert.ok(countUseTargets(layer.group) >= 28);
  assert.ok(scoreW122AaaArtPolish(layer.stats) >= 99);
});

test('W122 private workstation becomes a richer executive AI control hall', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'qa-operator' });
  const layer = buildW122AaaArtLayer({ map: room, quality: 'neon' });
  assert.equal(layer.stats.worldKind, 'private-workstation');
  assert.ok(layer.stats.luxuryCommandObjects >= 110);
  assert.equal(layer.stats.aiBotAnchors, 8);
  assert.ok(layer.stats.commandUseTargets >= 12);
  assert.ok(countUseTargets(layer.group) >= 10);
  assert.match(runtimeSource, /w122-executive-command-hall-second-pass/);
  assert.match(runtimeSource, /w122-eonbot-fast-access-conversation-zone/);
  assert.ok(scoreW122AaaArtPolish(layer.stats) >= 99);
});

test('W122 keeps low/mobile mode lighter while desktop Neon gets more creativity and detail', () => {
  const city = buildEonCityVoxelWorld();
  const low = buildW122AaaArtLayer({ map: city, quality: 'low' });
  const neon = buildW122AaaArtLayer({ map: city, quality: 'neon' });
  assert.equal(low.stats.mobileDowngrade, true);
  assert.equal(neon.stats.desktopAaaDetail, true);
  assert.ok(neon.stats.instanceCount > low.stats.instanceCount);
  assert.ok(neon.stats.facadeMicroObjects > low.stats.facadeMicroObjects);
  assert.ok(neon.stats.useTargetCount >= low.stats.useTargetCount);
});

test('W122 integrates with the flagship scene source and character kit', () => {
  assert.match(sceneSource, /buildW122AaaArtLayer/);
  assert.match(sceneSource, /updateW122AaaArtPolish/);
  assert.match(sceneSource, /w122AaaArtPolish/);
  assert.match(packageSource, /qa:w122-aaa-art-polish/);

  const npc = createModularCharacter({ npc: { id: 'portal-ranger', name: 'Portal Ranger', station: 'portal' }, quality: 'standard', accent: 0xc084fc });
  assert.equal(npc.userData.w122NpcVisualDetail, 'shoulder-light-garment-seam-status-chip');
  assert.match(getCharacterKitStats().visualSchema, /w122/);
});

test('W122 personal realm inherits bespoke decorative diversity with safe use-target rules', () => {
  const realm = buildMyRealmVoxelWorld({ username: 'qauser', seed: 'w122' });
  const layer = buildW122AaaArtLayer({ map: realm, quality: 'neon' });
  assert.equal(layer.stats.worldKind, 'my-realm');
  assert.ok(layer.stats.myRealmObjects >= 30);
  assert.ok(countUseTargets(layer.group) >= 1);
  assert.ok(scoreW122AaaArtPolish(layer.stats) >= 99);
});
