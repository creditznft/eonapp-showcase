import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W793C canonical runtime derives activation from exact evidence only', () => {
  assert.match(runtime, /deriveEonExpanseW793AActivationAction/);
  assert.match(runtime, /releaseReview: expanseState\.futureRegionReleaseReview/);
  assert.match(runtime, /packageCertification: expanseState\.futureRegionPackageCertification/);
  assert.match(runtime, /performanceEvidence: expanseVerifiedPerformanceEvidence/);
  assert.match(runtime, /ownerAuthorization: expanseFutureRegionOwnerAuthorization/);
  assert.match(runtime, /currentActivation: expanseState\.futureRegionActivation/);
});

test('W793C owner authorization is explicit, validated and persisted as gateway-only state', () => {
  assert.match(runtime, /submitExpanseFutureRegionOwnerAuthorization/);
  assert.match(runtime, /explicit-owner-action-required/);
  assert.match(runtime, /sanitizeEonExpanseW793AOwnerAuthorization/);
  assert.match(runtime, /validateEonExpanseW793AActivationAction/);
  assert.match(runtime, /confirmEonExpanseW793AActivation/);
  assert.match(runtime, /futureRegionActivation: confirmed\.state/);
  assert.match(runtime, /regionRendered: false/);
  assert.match(runtime, /automaticActivation: false/);
});

test('W793C adds no public gateway opening or second runtime authority', () => {
  assert.doesNotMatch(runtime, /runRenderLoop\s*\([^)]*futureRegion/);
  assert.doesNotMatch(runtime, /new\s+Engine\s*\([^)]*futureRegion/);
  assert.doesNotMatch(runtime, /new\s+Scene\s*\([^)]*futureRegion/);
  assert.match(runtime, /getExpanseFutureRegionActivation/);
});
