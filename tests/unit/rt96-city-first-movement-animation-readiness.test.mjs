import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT96 local asset controller can verify idle walk and run before authored player takeover', async () => {
  const source = await read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(source, /canPlay\(state = 'idle'/);
  assert.match(source, /getReadiness\(requiredStates = \['idle', 'walk', 'run'\]\)/);
  assert.match(source, /required\.every\(\(state\) => states\[state\] === true\)/);
});

test('RT96 keeps the animated procedural Pathfinder until authored locomotion clips are verified', async () => {
  const source = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(source, /authoredPlayerAnimationReadiness\.ready === true/);
  assert.match(source, /eonCityPlayerAnimationReady = 'authored'/);
  assert.match(source, /eonCityPlayerAnimationReady = 'procedural-fallback'/);
  assert.match(source, /playerAsset\?\.wrapper\?\.setEnabled\?\.\(false\)/);
});

test('RT96 animates fallback locomotion instead of allowing a static sliding player', async () => {
  const source = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(source, /applyProceduralWalk\(fallbackPlayer,[\s\S]*nextMotion === 'run' \? 1\.55 : 1\)/);
  assert.match(source, /animationReadiness: playerAnimationReadiness/);
});
