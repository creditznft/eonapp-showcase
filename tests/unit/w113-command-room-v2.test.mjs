import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { buildW113CommandRoomInteractionMatrix, buildW113CommandRoomPanelCatalog, W113_COMMAND_ROOM_SCHEMA } from '../../assets/js/realm3d/engine/EonCityCommandRoomV2.js';

const sceneSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityFlagshipScene.js', import.meta.url), 'utf8');
const panelsSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/WorldPanels.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');

test('W113 command room v2 expands the private room into the flagship native app cockpit', () => {
  assert.equal(W113_COMMAND_ROOM_SCHEMA, 'eon.realm3d.w113.central-private-command-room.v2');
  const catalog = buildW113CommandRoomPanelCatalog({ quality: 'neon' });
  assert.equal(catalog.length, 12);
  assert.deepEqual(catalog.map((panel) => panel.id).slice(0, 6), ['ai-chat', 'code-maker', 'automation', 'vault', 'realm-generator', 'market']);
  assert.ok(catalog.every((panel) => panel.liveNativePanel));
  assert.ok(catalog.every((panel) => panel.proximityAudio));
  assert.ok(catalog.every((panel) => panel.safeMode));
});

test('W113 command room interaction matrix preserves voice/mic safety and typed fallback', () => {
  const matrix = buildW113CommandRoomInteractionMatrix({ quality: 'low' });
  assert.equal(matrix.centralOfficeIsPrimaryHub, true);
  assert.equal(matrix.everyMonitorIsAUseTarget, true);
  assert.equal(matrix.typedInputAlwaysAvailable, true);
  assert.equal(matrix.voiceOutputOptIn, true);
  assert.equal(matrix.microphoneRequiresTap, true);
  assert.match(matrix.proximityVolume, /distance-based/);
  assert.equal(matrix.deviceQuality.tier, 'mobile-basic');
  assert.match(matrix.failSafe, /typed EONBOT/);
});

test('W113 is wired into the 3D scene and native panel shell', () => {
  assert.match(sceneSource, /buildW113CommandRoomV2Layer/);
  assert.match(sceneSource, /updateW113CommandRoomV2/);
  assert.match(sceneSource, /w113CommandRoom/);
  assert.match(panelsSource, /renderCommandRoomV2/);
  assert.match(panelsSource, /data-command-room-panel/);
  assert.match(cssSource, /realm3d-command-room-v2-card/);
});
