import assert from 'node:assert/strict';
import test from 'node:test';
import { getDodoApprovalReadinessPublicStatus, requestDodoCheckout } from '../../assets/js/commerce/dodo-approval-readiness.js';
import { W450_DODO_STATUS, W450_DODO_TRIAL_POLICY, W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY, validateW450DodoApprovalReadinessContract } from '../../config/w450-dodo-approval-readiness-contract.mjs';
import { inspectW450DodoApprovalReadiness } from '../../scripts/w450-dodo-approval-readiness-gate.mjs';

test('W450 records Dodo as approval-pending while every commerce action remains unavailable', () => {
  assert.deepEqual(validateW450DodoApprovalReadinessContract(), []);
  assert.equal(W450_DODO_STATUS.provider, 'Dodo Payments');
  assert.equal(W450_DODO_STATUS.merchantApproved, false);
  const status = getDodoApprovalReadinessPublicStatus();
  assert.equal(status.checkoutActive, false);
  assert.equal(status.publicTrialActive, false);
  assert.equal(W450_DODO_TRIAL_POLICY.lifecycle, 'planned-not-public');
  assert.equal(W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY.status, 'merchant-guidance-reported-not-account-verified');
  assert.match(W450_DODO_PROVIDER_GUIDANCE_TO_VERIFY.indiaRenewalTiming, /48–51/);
  assert.match(status.approvalNote, /Do not publish a timing promise/i);
  const request = requestDodoCheckout();
  assert.equal(request.ok, false);
  assert.equal(request.entitlementCreated, false);
  assert.equal(request.trialCreated, false);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W450 source gate proves Dodo readiness remains a no-network, fail-closed boundary', () => {
  const report = inspectW450DodoApprovalReadiness();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.checkoutActive, false);
  assert.equal(report.trialActive, false);
});
