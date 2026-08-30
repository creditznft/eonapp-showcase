import test from 'node:test';
import assert from 'node:assert/strict';
import { runRt97CityLocalReadinessGate } from '../../scripts/rt97-city-local-readiness-gate.mjs';

test('RT97 City local readiness gate certifies source boundaries but never fabricates physical-device readiness', () => {
  const result = runRt97CityLocalReadinessGate();
  assert.equal(result.codeReady, true, result.errors.join('\n'));
  assert.equal(result.status, 'code-pass-physical-pending');
  assert.equal(result.releaseReady, false);
  assert.equal(result.districtCount, 9);
  assert.equal(result.characterCoverage, '14/14');
  assert.equal(result.maxResidentDistricts, 2);
  assert.ok(result.physicalPending.length >= 5);
});
