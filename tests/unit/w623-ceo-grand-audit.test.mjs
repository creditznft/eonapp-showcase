import test from 'node:test';
import assert from 'node:assert/strict';
import { W623_CEO_AUDIT, W623_LAUNCH_WAVES, getW623Score, validateW623CeoAudit } from '../../config/w623-ceo-grand-audit-contract.mjs';
import { inspectW623CeoGrandAudit } from '../../scripts/w623-ceo-grand-audit-gate.mjs';

test('W623 CEO audit remains a limited-preview NO-GO rather than a false launch certification', () => {
  assert.deepEqual(validateW623CeoAudit(), []);
  assert.equal(W623_CEO_AUDIT.verdict, 'NO_GO_FULL_LAUNCH_LIMITED_PREVIEW_ONLY');
  assert.equal(W623_CEO_AUDIT.truth.fullLaunchApproved, false);
  assert.ok(getW623Score('overall-launch').value < 70);
});

test('W623 scorecard separates source integration from real output proof', () => {
  assert.equal(W623_CEO_AUDIT.truth.localImageSourceIntegrated, true);
  assert.equal(W623_CEO_AUDIT.truth.localImageRealDeviceOutputProven, false);
  assert.equal(W623_CEO_AUDIT.truth.localVideoOutputProven, false);
  assert.equal(W623_CEO_AUDIT.truth.billingRealCustomerLifecycleProven, false);
  assert.equal(W623_CEO_AUDIT.truth.cityFlagshipVisualApproved, false);
});

test('W623 launch waves preserve image-first, City proof, billing, referral and final certification order', () => {
  assert.deepEqual(W623_LAUNCH_WAVES.map((wave) => wave.id), ['W623B', 'W624', 'W625', 'W626', 'W627', 'W628', 'W629', 'W630']);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W623 deterministic CEO source gate passes', () => {
  const report = inspectW623CeoGrandAudit({ writeArtifact: false });
  assert.equal(report.gate.status, 'pass');
  assert.ok(report.gate.checks.length >= 9);
});
