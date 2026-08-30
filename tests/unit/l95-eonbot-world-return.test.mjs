import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 persistent EONBOT launcher remains visible in every Expanse world', () => {
  assert.match(runtime, /eonbotLauncher\.hidden = false/);
  assert.match(runtime, /eonbotLauncher\.setAttribute\('aria-hidden', 'false'\)/);
  assert.match(runtime, /eonCityPersistentWorkLauncher = 'true'/);
});

test('L95 EONBOT workspace records the actual world it must return to', () => {
  assert.match(runtime, /getActiveWorldRegion: \(\) => expanseActiveRegionId/);
  assert.match(runtime, /const returnWorld = fromExpanse \? String\(getActiveWorldRegion\?\.\(\) \|\| 'signal-frontier'\) : 'command-hub'/);
  assert.doesNotMatch(runtime, /returnWorld: 'signal-frontier'/);
});
