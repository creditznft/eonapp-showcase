import assert from 'node:assert/strict';
import test from 'node:test';
import { W415_FINAL_SOURCE_READINESS_CONTRACT, validateW415FinalSourceReadinessContract } from '../../config/w415-final-source-readiness-contract.mjs';
import { inspectW415FinalSourceReadiness } from '../../scripts/w415-final-source-readiness-gate.mjs';

test('W415 retains all code-complete waves and four external proof tracks', () => {
  assert.deepEqual(validateW415FinalSourceReadinessContract(), []);
  assert.equal(W415_FINAL_SOURCE_READINESS_CONTRACT.codeCompleteWaves.includes('W412'), true);
  assert.equal(W415_FINAL_SOURCE_READINESS_CONTRACT.codeCompleteWaves.includes('W413'), true);
  assert.equal(W415_FINAL_SOURCE_READINESS_CONTRACT.codeCompleteWaves.includes('W414'), true);
  assert.equal(W415_FINAL_SOURCE_READINESS_CONTRACT.manualProofRequired.length, 4);
});

test('W415 final source gate passes without claiming deployment or device proof', () => {
  const report = inspectW415FinalSourceReadiness();
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 14);
  assert.equal(report.sourceOnly, true);
  assert.match(report.limitations.join(' '), /does not prove live production OAuth/i);
});
