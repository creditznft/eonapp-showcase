import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W780C derives the future-region programme from canonical post-campaign state and world seed', () => {
  assert.match(runtime, /deriveEonExpanseW780BFutureRegionProgramme/);
  assert.match(runtime, /\{ postCampaign, worldSeed: expanseState\.seed\?\.value \|\| 1 \}/);
  assert.match(runtime, /futureRegionProgramme,/);
});

test('W780C surfaces programme readiness through the existing frontier card', () => {
  assert.match(overlay, /futureRegionProgramme: lastBoard\.futureRegionProgramme/);
  assert.match(overlay, /Authored programme review ready/);
  assert.match(overlay, /recommended\.label/);
  assert.match(overlay, /recommended\.promise/);
});

test('W780C adds no automatic unlock action or second runtime owner', () => {
  assert.doesNotMatch(overlay, /onUnlockFutureRegion/);
  assert.doesNotMatch(runtime, /futureRegionProgramme[^\n]*createRegion/);
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
});
