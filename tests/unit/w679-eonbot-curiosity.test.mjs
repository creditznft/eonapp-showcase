import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_W679_EONBOT_TARGETS,
  createEonCityW679EonbotCuriosityController,
  getEonCityW679EonbotCuriosityTruth,
  resolveNearestEonCityW679EonbotDock
} from '../../assets/js/city/w679/eon-city-w679-eonbot-curiosity.js';

test('W679 keeps EONBOT visibly non-static while Pathfinder is idle', () => {
  let clock = 0;
  const controller = createEonCityW679EonbotCuriosityController({ now: () => clock });
  clock = 1000;
  assert.equal(controller.update({ moving: false, playerPosition: { x: 0, z: 44 } }).state, 'curious-hover');
  clock = 3400;
  const scan = controller.update({ moving: false, playerPosition: { x: 0, z: 44 } });
  assert.equal(scan.state, 'scan');
  assert.equal(scan.directorMode, 'scan');
  assert.equal(scan.nonStaticIdle, true);
  clock = 7200;
  assert.equal(controller.update({ moving: false, playerPosition: { x: 0, z: 44 } }).state, 'circle');
});

test('W679 docking is bounded to public docks and requires explicit user action', () => {
  const controller = createEonCityW679EonbotCuriosityController({ now: () => 2000 });
  assert.equal(controller.requestDock('nearest', { playerPosition: { x: 0, z: 44 }, districtId: 'orientation-hall' }).ok, false);
  const requested = controller.requestDock('nearest', { explicitUserAction: true, playerPosition: { x: 0, z: 44 }, districtId: 'orientation-hall' });
  assert.equal(requested.ok, true);
  assert.equal(requested.target.kind, 'dock');
  const approaching = controller.update({ playerPosition: { x: 0, z: 44 }, companionPosition: { x: 0, z: 44 } });
  assert.equal(approaching.directorMode, 'dock');
  assert.equal(approaching.automaticDocking, false);
  assert.equal(controller.releaseDock().ok, false);
  assert.equal(controller.releaseDock({ explicitUserAction: true }).ok, true);
});

test('W679 exposes both Orientation and Creator public dock authority', () => {
  const docks = EON_CITY_W679_EONBOT_TARGETS.filter((entry) => entry.kind === 'dock');
  assert.equal(docks.length, 2);
  assert.ok(docks.some((entry) => entry.districtId === 'orientation-hall'));
  assert.ok(docks.some((entry) => entry.districtId === 'creator-atrium'));
  assert.equal(resolveNearestEonCityW679EonbotDock({ x: 0, z: 44 }, 'orientation-hall').entry.districtId, 'orientation-hall');
});

test('W679 is wired into the canonical companion renderer and visible dock review', () => {
  const play = fs.readFileSync('assets/js/city/eon-city-play-babylon.js', 'utf8');
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  const orientation = fs.readFileSync('assets/js/city/w674/eon-city-w674-orientation-district-belt-babylon.js', 'utf8');
  assert.match(play, /createEonCityW679EonbotCuriosityController/);
  assert.match(play, /requestEonbotDock/);
  assert.match(product, /data-eon-w679-dock-target/);
  assert.match(orientation, /interactionKind: 'companion-dock'/);
  const truth = getEonCityW679EonbotCuriosityTruth();
  assert.equal(truth.autonomousAgent, false);
  assert.equal(truth.ownsRenderLoop, false);
});
