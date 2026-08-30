import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_CITY_IMMERSIVE_CONTROLS_SCHEMA, normalizeCityPlayVector } from '../../assets/js/city/eon-city-immersive-controls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W364 normalizes local analogue movement vectors without retaining input state', () => {
  assert.equal(EON_CITY_IMMERSIVE_CONTROLS_SCHEMA, 'eon.city.immersive-controls.w364.v1');
  assert.deepEqual(normalizeCityPlayVector({ x: 0.25, z: -0.5 }), { x: 0.25, z: -0.5 });
  const diagonal = normalizeCityPlayVector({ x: 1, z: 1 });
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 1) < 0.00001);
  const clamped = normalizeCityPlayVector({ x: 99, z: -99 });
  assert.ok(Math.abs(clamped.x - Math.SQRT1_2) < 0.0000001);
  assert.ok(Math.abs(clamped.z + Math.SQRT1_2) < 0.0000001);
});

test('W364 gives City Play a real analogue, keyboard, mouse, gamepad and minimap contract', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const controls = read('assets/js/city/eon-city-immersive-controls.js');
  const css = read('assets/css/eon-city-play.css');

  assert.match(station, /data-eon-play-joystick/);
  assert.match(station, /data-eon-play-minimap-canvas/);
  assert.match(station, /data-eon-play-toggle-click-move/);
  assert.match(station, /<kbd>M<\/kbd>/);
  assert.match(station, /<kbd>E<\/kbd>/);
  assert.match(station, /Click-to-move enabled locally/);
  assert.match(station, /Separate confirmation is still required/);
  assert.match(controls, /mountCityPlayAnalogJoystick/);
  assert.match(controls, /mountCityPlayMinimap/);
  assert.match(controls, /lostpointercapture/);
  assert.match(controls, /pointercancel/);
  assert.match(scene, /GAMEPAD_INTERACT_BUTTON/);
  assert.match(scene, /readGamepadState/);
  assert.match(scene, /setAnalogMove/);
  assert.match(scene, /setClickMove/);
  assert.match(scene, /getPlayerPosition/);
  assert.match(scene, /scene\.pick\(.*mesh\.name === 'street'/s);
  assert.match(scene, /onInteractRequest\?\.\('gamepad'\)/);
  assert.match(scene, /never confirms a destination/);
  assert.match(css, /eon-play-joystick/);
  assert.match(css, /eon-play-minimap/);
  assert.match(css, /safe-area-inset-bottom/);
});

test('W364 retains route review, local-only limits and lifecycle cleanup', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const controls = read('assets/js/city/eon-city-immersive-controls.js');
  const combined = `${station}\n${scene}\n${controls}`;

  assert.match(station, /Prepared route · review required/);
  assert.match(station, /confirmPreparedCityAction/);
  assert.match(station, /Separate confirmation is still required/);
  assert.match(controls, /trigger application routes/);
  assert.match(controls, /private data/);
  assert.match(scene, /clickMovePointerCancel/);
  assert.match(scene, /removeEventListener\('pointercancel', clickMovePointerCancel\)/);
  assert.match(station, /controlUnsubscribers/);
  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.assign|window\.location/);
});
