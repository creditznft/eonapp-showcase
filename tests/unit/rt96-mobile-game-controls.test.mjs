import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT96 canonical authenticated EON City entry is analogue-joystick first', () => {
  const access = read('assets/js/city/eon-city-access-station.js');

  assert.match(access, /mountCityPlayAnalogJoystick/);
  assert.match(access, /data-eon-play-joystick/);
  assert.match(access, /data-eon-play-joystick-knob/);
  assert.match(access, /runtime\?\.setAnalogMove\?\.\(vector, \{ source: 'touch-joystick', inputKind: 'touch-analog' \}\)/);
  assert.match(access, /eonCityTouchControlScheme = analogJoystick\.active \? 'analog-joystick' : 'fallback-dpad'/);
});

test('RT96 retains the legacy D-pad only as a hidden failure fallback', () => {
  const access = read('assets/js/city/eon-city-access-station.js');
  const css = read('assets/css/eon-city-play.css');

  assert.match(access, /data-eon-city-touch-dpad hidden/);
  assert.match(access, /if \(fallbackDpad && analogJoystick\.active !== true\) fallbackDpad\.hidden = false/);
  assert.match(access, /controlSource: 'touch-dpad'/);
  assert.match(css, /\.eon-play-touch-controls\[hidden\]\{display:none!important\}/);
  assert.match(css, /\.eon-city-full-session>\.eon-city-reduced-dpad\[hidden\]\{display:none!important\}/);
});

test('RT96 mobile joystick occupies a dedicated safe-area-aware left-thumb zone', () => {
  const css = read('assets/css/eon-city-play.css');

  assert.match(css, /\.eon-city-full-session>\.eon-city-reduced-touch\.eon-play-joystick\{/);
  assert.match(css, /left:max\(\.7rem,env\(safe-area-inset-left\)\)/);
  assert.match(css, /bottom:max\(\.7rem,calc\(env\(safe-area-inset-bottom\) \+ \.7rem\)\)/);
  assert.match(css, /inline-size:7\.2rem/);
  assert.match(css, /block-size:7\.2rem/);
});

test('RT96 active W731 runtime exposes analogue motion while Babylon retains drag-look camera input', () => {
  const core = read('assets/js/city/eon-city-play-core.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');

  assert.match(core, /w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.match(runtime, /setAnalogMove\(vector = \{\}, options = \{\}\)/);
  assert.match(runtime, /camera\.attachControl\(canvas, true\)/);
});
