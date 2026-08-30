import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W253 gives City Play an explicit touch, keyboard, controller and safe-exit control guide', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  assert.match(station, /data-eon-play-open-controls/);
  assert.match(station, /data-eon-play-controls-panel/);
  assert.match(station, /City controls · local only/);
  assert.match(station, /WASD or arrow keys/);
  assert.match(station, /left stick or D-pad/);
  assert.match(station, /It never confirms a work route/);
  assert.match(station, /bindControlGuide/);
  assert.match(station, /data-eon-play-exit-fullscreen/);
  assert.match(station, /Mini map/);
  assert.match(scene, /GAMEPAD_DEAD_ZONE/);
  assert.match(scene, /getGamepads/);
  assert.match(scene, /onInputModeChange/);
  assert.match(scene, /optional-gamepad/);
  assert.match(css, /eon-play-controls-panel/);
  assert.match(css, /min-height:3rem/);
});

test('W253 keeps orientation/fullscreen best-effort and City app actions separately confirmed', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /requestFullscreen/);
  assert.match(station, /orientation\?\.lock\?\.\('landscape'\)/);
  assert.match(station, /cannot force orientation in every browser/);
  assert.match(station, /Prepared route · review required/);
  assert.match(station, /confirmPreparedCityAction/);
  assert.doesNotMatch(`${station}\n${scene}`, /location\.assign|window\.location|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
});
