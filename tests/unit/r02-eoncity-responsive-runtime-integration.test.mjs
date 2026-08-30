import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const css = read('assets/css/eon-city-play.css');

test('R02 replaces engine-only resize with one container-driven viewport director', () => {
  assert.match(runtime, /createEonCityR02ViewportDirector/);
  assert.match(runtime, /host,/);
  assert.match(runtime, /onResize: \(\) => \{ try \{ engine\.resize\(\); \} catch \{\} \}/);
  assert.match(runtime, /recomposeEonCityR02CameraRadius/);
  assert.match(runtime, /camera\.fov = profile\.camera\.fov/);
  assert.match(runtime, /viewportDirector\.destroy\?\.\(\)/);
  assert.doesNotMatch(runtime, /const onResize = \(\) => engine\.resize\(\)/);
});

test('R02 publishes profile selectors and keeps mobile portrait playable instead of dimming controls', () => {
  assert.match(css, /data-eon-city-viewport-profile/);
  assert.match(css, /container-type:inline-size/);
  assert.match(css, /data-eon-city-viewport-profile\^="mobile-"[^}]*\.eon-play-orientation-note[\s\S]{0,80}display:none!important/);
  assert.match(css, /data-eon-city-viewport-profile\^="mobile-"[^}]*:is\(\.eon-play-touch-controls,\.eon-play-actions\)[\s\S]{0,60}opacity:1/);
});
