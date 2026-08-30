import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT96 WebGL loss checkpoints pose and exposes truthful recovery state', () => {
  assert.match(runtime, /const onContextLost = \(event\) => \{[\s\S]{0,900}clearInput\('webgl-context-lost'\)[\s\S]{0,500}writeResume\(playerAnchor\.position, playerAnchor\.rotation\.y, activeStationId\)/);
  assert.match(runtime, /productRoot\.dataset\.eonCityGraphicsState = 'context-lost'/);
  assert.match(runtime, /productRoot\.dataset\.eonCityContextLossCount = String\(contextLossCount\)/);
});

test('RT96 WebGL restoration reuses the single camera/input authority', () => {
  assert.match(runtime, /const handleContextRestored = \(\) => \{[\s\S]{0,900}applyEonCityRt96CameraInputPolicy\(camera, canvas, rt96CameraPolicy\)/);
  assert.match(runtime, /productRoot\.dataset\.eonCityGraphicsState = 'ready'/);
  const renderLoopOwners = runtime.match(/engine\.runRenderLoop\(/g) || [];
  assert.equal(renderLoopOwners.length, 1, 'one Babylon render-loop owner must remain authoritative');
});

test('RT96 runtime removes WebGL lifecycle listeners during destroy', () => {
  assert.match(runtime, /canvas\.removeEventListener\('webglcontextlost', onContextLost, false\)/);
  assert.match(runtime, /canvas\.removeEventListener\('webglcontextrestored', handleContextRestored, false\)/);
  assert.match(runtime, /globalThis\.document\?\.removeEventListener\?\.\('visibilitychange', onVisibilityChange\)/);
});
