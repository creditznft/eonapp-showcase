import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W783C rederives and validates the current programme immediately before review', () => {
  assert.match(runtime, /deriveCurrentFutureRegionProgrammeReview/);
  assert.match(runtime, /validateEonExpanseW783AProgrammeReviewAction/);
  assert.match(runtime, /expectedReviewToken/);
  assert.match(runtime, /confirmEonExpanseW783AProgrammeReview/);
});

test('W783C persists reviewed state without activating a gateway or rendering a region', () => {
  assert.match(runtime, /futureRegionProgrammeReview: confirmed\.state/);
  assert.match(runtime, /expansePersistence\.write\(expanseState\)/);
  assert.match(runtime, /gateway remains locked/i);
  assert.doesNotMatch(runtime, /confirmed[^\n]*activateGateway|confirmed[^\n]*mountRegion/);
});

test('W783C exposes one explicit review button and then reports reviewed-not-unlocked truth', () => {
  assert.match(overlay, /data-eon-expanse-ui-action':'future-region-review/);
  assert.match(overlay, /onReviewFutureRegionProgrammeAction/);
  assert.match(overlay, /programme reviewed\. Gateway remains locked/);
  assert.match(overlay, /futureRegionProgrammeReview\?\.available/);
});

test('W783C keeps one canonical Engine, Scene and render loop', () => {
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\(/g) || []).length, 1);
});
