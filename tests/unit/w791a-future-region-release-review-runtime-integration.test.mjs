import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W791A derives final review only from current matrix, package and persisted review truth', () => {
  assert.match(runtime, /deriveEonExpanseW788AReleaseReviewAction/);
  assert.match(runtime, /releaseMatrix: futureRegionReleaseMatrix, packageReadiness: futureRegionPackageReadiness, reviewState: expanseState\.futureRegionReleaseReview/);
  assert.match(runtime, /futureRegionReleaseReview: expanseFutureRegionReleaseReview/);
});

test('W791A exposes exact owner review with stale digest and token validation', () => {
  assert.match(runtime, /reviewExpanseFutureRegionRelease/);
  assert.match(runtime, /expectedPackageDigest/);
  assert.match(runtime, /expectedReviewToken/);
  assert.match(runtime, /futureRegionReleaseReview: confirmed\.state/);
});

test('W791A surfaces review truth without adding a public release button or activation', () => {
  assert.match(overlay, /futureRegionReleaseReview: lastBoard\.futureRegionReleaseReview/);
  assert.match(overlay, /Final owner release review is available through the certification runtime/);
  assert.doesNotMatch(overlay, /Release future region|Activate future gateway/);
  assert.match(runtime, /gatewayActivated: false, regionRendered: false, automaticRelease: false/);
});
