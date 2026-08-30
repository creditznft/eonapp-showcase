import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('W789C revalidates persisted package certification against the reviewed maintained region', () => {
  assert.match(runtime, /validateEonExpanseW789ARegionPackageCertificationState/);
  assert.match(runtime, /expectedRegionId: futureRegionProgrammeReview\.reviewedRegion\?\.regionId/);
  assert.match(runtime, /certificationReceipt: expanseState\.futureRegionPackageCertification/);
  assert.match(runtime, /authoredRegionPackageCertification: futureRegionPackageCertification/);
});

test('W789C accepts certification only through explicit reviewed-region submission', () => {
  assert.match(runtime, /submitExpanseFutureRegionPackageCertification/);
  assert.match(runtime, /explicit-user-action-required/);
  assert.match(runtime, /future-region-programme-review-required/);
  assert.match(runtime, /exact-reviewed-region-package-certification-required/);
  assert.match(runtime, /sanitizeEonExpanseW789ARegionPackageCertification/);
});

test('W789C submission persists evidence but cannot activate or render the region', () => {
  assert.match(runtime, /futureRegionPackageCertification: certification/);
  assert.match(runtime, /gatewayActivated: false, regionRendered: false, automaticRelease: false/);
  assert.equal((runtime.match(/engine = new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/scene = new Scene\(/g) || []).length, 1);
});
