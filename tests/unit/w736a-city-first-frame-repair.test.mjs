import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const entry = read('assets/js/city/eon-city-play-core.js');
const guard = read('assets/js/city/w736a/eon-city-w736a-first-frame-guard.js');

test('W736A installs the bounded first-frame guard before exporting W731', () => {
  assert.match(entry, /installEonCityW736AFirstFrameGuard/);
  assert.match(entry, /installEonCityW736AFirstFrameGuard\(\);[\s\S]*w731\/eon-city-w731-command-hub-runtime\.js/);
  assert.doesNotMatch(entry, /w649|district-belt|expanse-runtime/i);
});

test('W736A imports Babylon Ray and supplies bounded matrix fallbacks', () => {
  assert.match(guard, /import '@babylonjs\/core\/Culling\/ray\.js'/);
  assert.match(guard, /prototype\.getViewMatrix/);
  assert.match(guard, /prototype\.getTransformMatrix/);
  assert.match(guard, /cameraView\(this\) \|\| Matrix\.IdentityReadOnly/);
  assert.match(guard, /cameraTransform\(this\) \|\| Matrix\.IdentityReadOnly/);
});

test('W736A guard cannot create a second Babylon owner', () => {
  assert.match(guard, /createsEngine:\s*false/);
  assert.match(guard, /createsScene:\s*false/);
  assert.match(guard, /createsRenderLoop:\s*false/);
  assert.doesNotMatch(guard, /new Engine|new Scene|runRenderLoop/);
});
