import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W786B derives the release matrix from all six maintained authorities', () => {
  assert.match(runtime, /deriveEonExpanseW786AFutureRegionReleaseMatrix/);
  assert.match(runtime, /postCampaign, programmeReview: futureRegionProgrammeReview, openWorldArtAudit, packageReadiness: futureRegionPackageReadiness, performanceReadiness, releaseGate: futureRegionReleaseGate/);
  assert.match(runtime, /futureRegionReleaseMatrix,/);
});

test('W786B includes release matrix truth in the stable overlay signature', () => {
  assert.match(overlay, /futureRegionReleaseMatrix: lastBoard\.futureRegionReleaseMatrix/);
  assert.match(overlay, /Release matrix:/);
  assert.match(overlay, /completedGates/);
  assert.match(overlay, /totalGates/);
});

test('W786B adds no gateway activation or automatic release control', () => {
  assert.doesNotMatch(overlay, /Activate future gateway|Release future region|Open future gateway/);
  assert.equal((runtime.match(/engine = new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/scene = new Scene\(/g) || []).length, 1);
});
