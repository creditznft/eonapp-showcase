import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimePath = new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url);
const source = await readFile(runtimePath, 'utf8');

test('W777C owns one restoration cue director beside the existing objective feedback director', () => {
  assert.match(source, /createEonExpanseW777ARestorationAudioCueDirector/);
  assert.equal((source.match(/createEonExpanseW777ARestorationAudioCueDirector\(/g) || []).length, 1);
  assert.match(source, /const expanseRestorationAudioCues = createEonExpanseW777ARestorationAudioCueDirector\(\)/);
});

test('W777C derives cues from the same canonical zone restoration board and current zone', () => {
  assert.match(source, /expanseRestorationAudioCues\.update\(zoneRestorationBoard, \{ expanseActive, currentZoneId: expanseState\.currentZone \}\)/);
  assert.match(source, /if \(restorationAudioCue\.cue\) expanseAudio\.playRestorationCue\?\.\(restorationAudioCue\.cue\)/);
});

test('W777C seeds entry and Hub return so saves never replay old restoration cues', () => {
  const resetMatches = source.match(/expanseRestorationAudioCues\.reset\(deriveEonExpanseW773AZoneRestorationBoard\(getExpanseWorldProgress\(\)\)\)/g) || [];
  assert.equal(resetMatches.length, 2);
  assert.match(source, /expanseAudio\.start\(\{ explicitUserAction: true \}\)/);
  assert.doesNotMatch(source, /playRestorationCue[^\n]*start\(/);
});

test('W777C adds no second Engine, Scene, audio context or render loop', () => {
  assert.equal((source.match(/createEonExpanseW766GAudioDirector\(/g) || []).length, 1);
  assert.doesNotMatch(source, /new\s+AudioContext\s*\(/);
  assert.doesNotMatch(source, /setInterval\s*\([^)]*restorationAudioCue/);
});
