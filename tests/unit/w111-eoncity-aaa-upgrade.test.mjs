import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const voxelSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/VoxelWorld.js', import.meta.url), 'utf8');
const sceneSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityFlagshipScene.js', import.meta.url), 'utf8');
const characterSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityCharacterKit.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');

test('W111 command room is a central app monitor wall, not a hidden decorative office', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'qa-operator' });
  const labels = room.workstationScreens.map((screen) => screen.label).join(' | ');
  assert.match(labels, /Market Intelligence Terminal/);
  assert.match(labels, /Automation Studio/);
  assert.match(labels, /EONBOT Support/);
  assert.match(labels, /EONBOT Support \+ App Health/);
  assert.match(sceneSource, /workstation-aaa-command-wall-panel/);
  assert.match(sceneSource, /EON CENTRAL COMMAND/);
});

test('W111 interaction repair supports real aim-click targets for interiors, NPCs, and canvas pointer coordinates', () => {
  assert.match(bootSource, /updateInteractionPointerFromEvent/);
  assert.match(bootSource, /pointermove/);
  assert.match(bootSource, /realm3d-aim-ready/);
  assert.match(bootSource, /clearPointedInteraction/);
  assert.match(voxelSource, /clickableInteriorEntry/);
  assert.match(voxelSource, /npc-speech-bubble/);
  assert.match(cssSource, /realm3d-aim-ready/);
});

test('W111 character and world art add role silhouettes and varied lightweight trees', () => {
  assert.match(characterSource, /character-tech-headband/);
  assert.match(characterSource, /character-guardian-helmet/);
  assert.match(characterSource, /facialDetail/);
  assert.match(sceneSource, /flagship-tree-variety/);
  assert.match(sceneSource, /neon-palm/);
  assert.match(sceneSource, /crystal-tree/);
});

test('W111 generated realms expose an AAA generation plan with required use targets', () => {
  const realm = buildMyRealmVoxelWorld({ username: 'qauser', seed: 'aaa' });
  assert.equal(realm.realmGenerationPlan.schema, 'eon.realm3d.realm-generator.w111.aaa-v2');
  assert.ok(realm.realmGenerationPlan.generationLayers.includes('workspace-entrance'));
  assert.ok(realm.realmGenerationPlan.requiredUseTargets.includes('support bot'));
  assert.ok(realm.realmGenerationPlan.performanceRules.includes('low-mode density cap'));
});
