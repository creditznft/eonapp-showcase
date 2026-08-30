import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 FPS samples identify the exact active City world', () => {
  assert.match(runtime, /worldRegionId: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE' \? String\(expanseActiveRegionId \|\| 'signal-frontier'\) : 'command-hub'/);
  assert.match(runtime, /fpsTimeline\.push\(lastFpsSample\)/);
  assert.match(runtime, /fpsSample: lastFpsSample/);
  assert.match(runtime, /\[W766IR2H_FPS_PROTECTION\]/);
});

test('L95 runtime telemetry exposes activeWorldRegionId for owner performance traces', () => {
  assert.match(runtime, /activeWorldRegionId: expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE' \? String\(expanseActiveRegionId \|\| 'signal-frontier'\) : 'command-hub'/);
});
