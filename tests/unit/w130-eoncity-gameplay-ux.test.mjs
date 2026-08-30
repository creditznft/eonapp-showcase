import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildEonCityVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { W130_REQUIRED_ROOM_IDS, buildW130GameplayUxPlan, scoreW130GameplayUxPlan } from '../../assets/js/realm3d/engine/EonCityW130GameplayUxRuntime.js';
import { buildSession7InteriorCatalog } from '../../assets/js/realm3d/engine/EonCitySession7InteriorRuntime.js';
import { DISTRICTS, NPCS } from '../../assets/js/realm3d/engine/BlockPalette.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W130 runtime scores EON City as a self-teaching gameplay OS', () => {
  const world = buildEonCityVoxelWorld();
  assert.equal(world.w130GameplayUxPlan.schema, 'eon.realm3d.w130.gameplay-ux-pass.v1');
  assert.equal(world.w130GameplayUxScore.score, 100);
  assert.equal(world.w130GameplayUxScore.ok, true);
  assert.equal(world.w130GameplayUxPlan.teleportDirectory.entryCount, 10);
  assert.deepEqual(world.w130GameplayUxPlan.teleportDirectory.missingRoomIds, []);
  assert.equal(world.w130GameplayUxPlan.heroScreens.length, 10);
  assert.equal(world.w130GameplayUxPlan.previewOverlays.length, 10);
  assert.equal(world.w130GameplayUxPlan.approachPrompts.length, 10);
  for (const roomId of W130_REQUIRED_ROOM_IDS) {
    assert.ok(world.w130GameplayUxPlan.approachPrompts.some((prompt) => prompt.roomId === roomId), `missing prompt for ${roomId}`);
    assert.ok(world.w130GameplayUxPlan.heroScreens.some((screen) => screen.roomId === roomId), `missing hero screen for ${roomId}`);
  }
});

test('W130 preview overlays enforce no tiny iframe, app preview, and room choice', () => {
  const plan = buildW130GameplayUxPlan({
    world: { kind: 'eon-city' },
    districts: DISTRICTS,
    interiors: buildSession7InteriorCatalog(DISTRICTS),
    cityScreens: buildEonCityVoxelWorld().cityStationScreens,
    npcs: NPCS,
    mobile: true
  });
  const score = scoreW130GameplayUxPlan(plan);
  assert.equal(score.score, 100);
  for (const overlay of plan.previewOverlays) {
    assert.equal(overlay.layout, 'full-screen-app-preview-overlay');
    assert.equal(overlay.noTinyIframe, true);
    assert.equal(overlay.noSilentRedirect, true);
    assert.ok(overlay.controls.includes('open-full-page'));
    assert.ok(overlay.controls.includes('enter-dedicated-room'));
    assert.ok(overlay.controls.includes('ask-eonbot'));
    assert.ok(overlay.controls.includes('minimize-to-city'));
  }
  assert.equal(plan.mobileNpcPolicy.faceScale >= 1.55, true);
  assert.equal(plan.mobileNpcPolicy.bubbleMinimumTapTarget, 48);
});

test('W130 engine and panels expose Rooms menu, minimap teleport, and first-visit cues', () => {
  const engine = read('assets/js/realm3d/engine/EngineBoot.js');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const css = read('assets/css/realm3d.css');
  assert.match(engine, /realmGameplayUxSession\s*=\s*'w130'/);
  assert.match(engine, /data-realm3d-room-menu/);
  assert.match(engine, /openW130RoomTeleportMenu/);
  assert.match(engine, /buildW130ApproachPrompt/);
  assert.match(engine, /data-w130-approach-prompt/);
  assert.match(panels, /openRoomTeleportMenu/);
  assert.match(panels, /data-w130-room-teleport="true"/);
  assert.match(panels, /Room Teleport Menu/);
  assert.match(css, /W130 gameplay UX pass/);
  assert.match(css, /\.realm3d-room-teleport-grid/);
  assert.match(css, /min-height:\s*48px/);
});
