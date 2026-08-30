import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W785C derives package readiness from the reviewed programme inside the canonical runtime', () => {
  assert.match(runtime, /deriveEonExpanseW785BRegionPackageReadiness/);
  assert.match(runtime, /reviewView: futureRegionProgrammeReview/);
  assert.match(runtime, /futureRegionPackageReadiness,/);
  assert.equal((runtime.match(/engine = new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/scene = new Scene\(/g) || []).length, 1);
});

test('W785C includes package readiness in the overlay render signature', () => {
  assert.match(overlay, /futureRegionPackageReadiness: lastBoard\.futureRegionPackageReadiness/);
});

test('W785C surfaces the evidence count without adding certification or gateway actions', () => {
  assert.match(overlay, /Package gate:/);
  assert.match(overlay, /completedRequirements/);
  assert.match(overlay, /totalRequirements/);
  assert.doesNotMatch(overlay, /Certify region package|Activate future gateway|Render future region/);
});
