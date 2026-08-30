import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  REALM3D_SCHEMA,
  buildRealm3dSafetyPolicy,
  getRealm3dDistricts,
  getRealm3dNpcs,
  getRealm3dPortals,
  getRealm3dWorldPanels
} from '../../assets/js/realm3d/engine/BlockPalette.js';
import { buildEonCityVoxelWorld, buildMyRealm3dSeed } from '../../assets/js/realm3d/engine/EonCityMap.js';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W28 Realm public route is real Three.js EON City 3D first', () => {
  const html = read('realm.html');
  assert.match(html, /EON City 3D/);
  assert.match(html, /data-eon-city-3d-root/);
  assert.match(html, /realm3d\/eon-city-app\.js/);
  assert.match(html, /AI workstation world|living AI city/i);
  assert.doesNotMatch(html.slice(0, html.indexOf('Legacy Realm profile')), /Canvas voxel preview/);
});

test('W28 has a real realm3d module tree and imports Three.js', () => {
  const app = read('assets/js/realm3d/eon-city-app.js');
  const boot = read('assets/js/realm3d/engine/EngineBoot.js');
  const world = read('assets/js/realm3d/engine/VoxelWorld.js');
  assert.match(app, /EonCity3dEngine/);
  assert.match(boot, /WebGLRenderer/);
  assert.match(world, /InstancedMesh/);
  assert.match(world, /vendor\/three\.module\.min\.js/);
  assert.equal(REALM3D_SCHEMA, 'eon.realm3d.city.v28.threejs.voxel.v1');
});

test('W28 city map is playable-style districts, not 2D cards', () => {
  const map = buildEonCityVoxelWorld();
  const districts = getRealm3dDistricts();
  const labels = new Set(districts.map((district) => district.label));
  ['Spawn Plaza', 'AI Tower', 'Builder Forge', 'Vault Bank', 'Trade Dome', 'EON Team Store', 'Mission Control', 'Referral Arcade', 'Portal Hall'].forEach((label) => {
    assert.ok(labels.has(label), `missing ${label}`);
  });
  assert.ok(map.blocks.length > 1200, 'city needs actual voxel blocks');
  assert.ok(map.blocks.some((block) => block.y > 8), 'city needs vertical towers');
  assert.ok(map.portals.length >= 8);
  assert.ok(map.npcs.length >= 6);
});

test('W28 controls and device rails are explicit for desktop and mobile', () => {
  const player = read('assets/js/realm3d/engine/PlayerController.js');
  const mobile = read('assets/js/realm3d/engine/MobileControls.js');
  const css = read('assets/css/realm3d.css');
  assert.match(player, /KeyW/);
  assert.match(player, /requestPointerLock/);
  assert.match(player, /KeyE|Space/);
  assert.match(mobile, /realm3d-stick-move/);
  assert.match(mobile, /data-action="interact"/);
  assert.match(mobile, /Interact with the nearest station, door, monitor, or character/);
  assert.match(css, /pointer: coarse/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /prefers-reduced-motion/);
});

test('W28 safety policy keeps public Realm launch-safe', () => {
  const policy = buildRealm3dSafetyPolicy();
  assert.equal(policy.mainExperience, 'real-threejs-voxel-city');
  assert.equal(policy.old2dModesPublic, false);
  assert.equal(policy.noPublicChat, true);
  assert.equal(policy.noUserUploads, true);
  assert.equal(policy.noArbitraryHtml, true);
  assert.equal(policy.noCloudflareGameStateServer, true);
  assert.equal(policy.liveTradingExecution, false);
});

test('W28 app panels, NPCs, portals, and My Realm seed are safe templates', () => {
  const panels = getRealm3dWorldPanels();
  const panelIds = new Set(panels.map((panel) => panel.id));
  ['ai', 'builder', 'vault', 'trade', 'store', 'mission', 'referral', 'workspace', 'my-realm'].forEach((id) => assert.ok(panelIds.has(id), id));
  assert.ok(getRealm3dPortals().every((portal) => !/^https?:\/\//.test(portal.href)));
  assert.ok(getRealm3dNpcs().every((npc) => !/public chat/i.test(npc.script)));
  const realm = buildMyRealm3dSeed({ username: 'tester', seed: 'abc' });
  assert.equal(realm.safeTemplatesOnly, true);
  assert.equal(realm.noUploads, true);
  assert.equal(realm.noPublicChat, true);
  assert.equal(realm.noArbitraryHtml, true);
});

test('W28 old RealmWorld modes are not the public first screen', () => {
  const html = read('realm.html');
  const firstScreen = html.slice(0, html.indexOf('<section class="realm3d-roadmap"'));
  assert.doesNotMatch(firstScreen, /Ghost 3D/);
  assert.doesNotMatch(firstScreen, /2\.5D CSS/);
  assert.doesNotMatch(firstScreen, /Canvas map/);
  assert.match(read('assets/css/realm3d.css'), /rl-hub-hero[\s\S]*display: none/);
});
