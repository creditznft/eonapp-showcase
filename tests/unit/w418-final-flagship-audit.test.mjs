import assert from 'node:assert/strict';
import test from 'node:test';
import { W418_FINAL_FLAGSHIP_AUDIT_CONTRACT, validateW418FinalFlagshipAuditContract } from '../../config/w418-final-flagship-audit-contract.mjs';
import { inspectW418FinalFlagshipAudit } from '../../scripts/w418-final-flagship-audit-gate.mjs';

test('W418 records every source-complete late-stage wave and keeps external proof separate', () => {
  assert.equal(validateW418FinalFlagshipAuditContract().length, 0);
  assert.ok(['W412', 'W413', 'W414', 'W415', 'W416', 'W417'].every((wave) => W418_FINAL_FLAGSHIP_AUDIT_CONTRACT.completedSourceWaves.includes(wave)));
  assert.equal(W418_FINAL_FLAGSHIP_AUDIT_CONTRACT.externalEvidenceRequired.length, 4);
});

test('W418 prohibits final visual-grade and activation claims without external evidence', () => {
  assert.ok(W418_FINAL_FLAGSHIP_AUDIT_CONTRACT.prohibitedStatusClaims.includes('institutional-grade final visual art certification'));
  assert.ok(W418_FINAL_FLAGSHIP_AUDIT_CONTRACT.prohibitedStatusClaims.includes('public Sync release'));
});

test('W418 final-audit gate confirms the professional handover boundary', () => {
  const report = inspectW418FinalFlagshipAudit();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 8);
});
