import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildW641PredeployReceiptDigest,
  validateW641PredeployReceiptIdentity
} from '../../scripts/lib/w641-predeploy-receipt-identity.mjs';

function receipt(overrides = {}) {
  const steps = Array.from({ length: 82 }, (_, index) => ({
    script: `qa:deterministic-step-${String(index + 1).padStart(2, '0')}`,
    args: index === 81 ? ['--', '--final'] : [],
    status: 0,
    durationMs: 100 + index
  }));
  return {
    schema: 'eonapp.codex-predeploy-receipt.w646.2026-07-11.v1',
    wave: 'W646',
    ok: true,
    startedAt: '2026-08-06T00:00:00.000Z',
    finishedAt: '2026-08-06T00:10:00.000Z',
    resumedStepCount: 0,
    sourceFingerprint: {
      algorithm: 'sha256',
      digest: 'a'.repeat(64),
      fileCount: 5600
    },
    stepCount: steps.length,
    steps,
    ...overrides
  };
}

test('W641 predeploy evidence identity ignores only volatile run timing', () => {
  const first = receipt();
  const second = receipt({
    startedAt: '2026-08-06T01:00:00.000Z',
    finishedAt: '2026-08-06T01:12:00.000Z',
    resumedStepCount: 27
  });
  second.steps = second.steps.map((step, index) => ({ ...step, durationMs: 9000 + index }));
  assert.equal(buildW641PredeployReceiptDigest(first), buildW641PredeployReceiptDigest(second));
});

test('W641 predeploy evidence identity changes when certified semantics change', () => {
  const baseline = receipt();
  const changedStep = receipt();
  changedStep.steps[10] = { ...changedStep.steps[10], script: 'qa:substituted-step' };
  const changedFingerprint = receipt({
    sourceFingerprint: { algorithm: 'sha256', digest: 'b'.repeat(64), fileCount: 5600 }
  });
  assert.notEqual(buildW641PredeployReceiptDigest(baseline), buildW641PredeployReceiptDigest(changedStep));
  assert.notEqual(buildW641PredeployReceiptDigest(baseline), buildW641PredeployReceiptDigest(changedFingerprint));
});

test('W641 predeploy evidence identity fails closed on non-pass or incomplete receipts', () => {
  const failed = receipt();
  failed.steps[7] = { ...failed.steps[7], status: 1 };
  const incomplete = receipt({ stepCount: 83 });
  const failedValidation = validateW641PredeployReceiptIdentity(failed);
  const incompleteValidation = validateW641PredeployReceiptIdentity(incomplete);
  assert.equal(failedValidation.ok, false);
  assert.ok(failedValidation.issues.includes('predeploy-step-not-pass:7'));
  assert.equal(incompleteValidation.ok, false);
  assert.ok(incompleteValidation.issues.includes('predeploy-step-count-mismatch'));
});
