import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DISTRICTS,
  NPCS,
  PORTALS,
  PRIVATE_WORKSTATION,
  WORLD_PANELS,
  buildRealm3dSafetyPolicy
} from '../../assets/js/realm3d/engine/BlockPalette.js';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const read = (file) => readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('Realm exposes Device Lab as a first-class safe EON City district', () => {
  const district = DISTRICTS.find((item) => item.id === 'device');
  assert.ok(district, 'missing Device Lab district');
  assert.equal(district.panel, 'device-lab');
  assert.equal(district.route, '/workbench.html#device-lab');
  assert.match(district.description, /explicit-confirmation|confirmation/i);

  assert.ok(PORTALS.some((portal) => portal.id === 'portal-device' && portal.panel === 'device-lab'));
  assert.ok(NPCS.some((npc) => npc.id === 'device-safety-engineer'));
  assert.ok(PRIVATE_WORKSTATION.some((item) => item.id === 'device-lab'));
  assert.ok(WORLD_PANELS['device-lab'].body.includes('explicit confirmation'));
});

test('EON City and Private Workstation include Device Lab stations without silent control', () => {
  const city = buildEonCityVoxelWorld();
  const privateRoom = buildPrivateWorkstationVoxelWorld({ owner: 'qa-operator' });
  assert.ok(city.districts.some((district) => district.id === 'device'));
  assert.ok(city.portals.some((portal) => portal.id === 'portal-device'));
  assert.ok(city.workstationScreens.some((screen) => screen.panel === 'device-lab'));
  assert.ok(privateRoom.districts.some((district) => district.id === 'workspace-device-lab'));
  assert.ok(privateRoom.cityStationScreens.some((screen) => screen.panel === 'device-lab'));

  const policy = buildRealm3dSafetyPolicy();
  assert.equal(policy.silentDeviceControl, false);
  assert.equal(policy.deviceActionsRequireConfirmation, true);
});

test('Realm landing page presents EON City, Private Workstation, Device Lab, and hidden legacy compatibility', () => {
  const html = read('realm.html');
  const css = read('assets/css/realm3d.css');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');

  assert.match(html, /Enter EON City/);
  assert.match(html, /Open private workstation/);
  assert.match(html, /Generate My Realm/);
  assert.match(css, /realm3d-device-lab-card/);
  assert.match(css, /body\.realm3d-flagship-mode \.realm3d-legacy-surface/);
  assert.match(panels, /renderDeviceLab/);
  assert.match(panels, /silently control real hardware/);
  assert.match(panels, /Separate confirmation gate/i);
});
