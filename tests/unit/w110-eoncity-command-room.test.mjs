import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');

test('W110 EON City exposes a visible central workspace gateway near spawn', () => {
  const world = buildEonCityVoxelWorld();
  const portal = world.portals.find((item) => item.id === 'spawn-central-workspace');
  assert.ok(portal, 'spawn central workspace portal exists');
  assert.equal(portal.panel, 'workspace');
  assert.equal(portal.href, '#private-workstation-3d');
  assert.deepEqual(portal.position, [0, 14]);
  const gatewayBlocks = world.blocks.filter((block) => block.module === 'central-workstation-gateway');
  assert.ok(gatewayBlocks.length >= 40, 'gateway has visible architecture, not just metadata');
  assert.ok(world.blocks.some((block) => /Central Workspace/i.test(String(block.sign || ''))));
});

test('W110 private workstation remains a real command room with W123 command-wall safe screens', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'qa-operator' });
  assert.equal(room.kind, 'private-workstation');
  assert.ok(room.workstationScreens.length >= 10);
  const labels = room.workstationScreens.map((screen) => screen.label).join(' | ');
  assert.match(labels, /EONBot Chat/);
  assert.match(labels, /Market Intelligence Terminal/);
  assert.match(labels, /Automation Studio/);
  assert.ok(room.blocks.some((block) => /Command Wall/i.test(String(block.sign || ''))));
});

test('W110 desktop interaction now supports Use button, aim-click, and a live interaction chip', () => {
  assert.match(bootSource, /data-realm3d-use-nearest/);
  assert.match(bootSource, /usePointedInteraction/);
  assert.match(bootSource, /findPointedInteractionTarget/);
  assert.match(bootSource, /resolveInteractionObject/);
  assert.match(bootSource, /data-realm3d-interaction-chip/);
  assert.match(cssSource, /realm3d-interaction-chip/);
});
