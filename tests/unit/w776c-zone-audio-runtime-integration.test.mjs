import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const source = await readFile(runtimePath, 'utf8');

test('W776C derives zone audio from the current restoration board and dynamic event truth', () => {
  assert.match(source, /deriveEonExpanseW776AZoneAudioState/);
  assert.match(source, /zoneId:\s*expanseState\.currentZone/);
  assert.match(source, /zoneRestorationBoard/);
  assert.match(source, /dynamicEvent:\s*dynamicEventPresentation/);
  assert.match(source, /reducedMotion/);
});

test('W776C applies world audio state through the one existing Expanse audio director', () => {
  assert.match(source, /expanseAudio\.applyWorldState\?\.\(zoneAudioState\)/);
  assert.equal((source.match(/createEonExpanseW766GAudioDirector\(/g) || []).length, 1);
  assert.doesNotMatch(source, /new\s+AudioContext\s*\(/);
  assert.doesNotMatch(source, /setInterval\s*\([^)]*zoneAudioState/);
});

test('W776C keeps audio under explicit user-start and Hub suspend lifecycle', () => {
  assert.match(source, /expanseAudio\.start\(\{\s*explicitUserAction:\s*true\s*\}\)/);
  assert.match(source, /expanseAudio\.suspend\('return-to-command-hub'\)/);
  assert.match(source, /expanseAudio\.dispose\?\.\(\)/);
});
