import assert from 'node:assert/strict';
import test from 'node:test';
import { W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT, validateW395GoogleIdentityD1ReadinessContract } from '../../config/w395-google-identity-d1-readiness-contract.mjs';
import { inspectW395GoogleIdentityD1Readiness } from '../../scripts/w395-google-identity-d1-readiness-gate.mjs';

test('W395 keeps Google identity source readiness separate from live deployment proof', () => {
  assert.deepEqual(validateW395GoogleIdentityD1ReadinessContract(), []);
  assert.equal(W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT.sourceProofOnly, true);
  assert.equal(W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT.liveProofRequired, true);
  assert.equal(W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT.boundaries.automaticCloudBackup, false);
  assert.equal(W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT.boundaries.accountBackedCollection, false);
  assert.equal(W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT.boundaries.referralRewards, false);
});

test('W395 static readiness gate passes without certifying a live login or restore flow', () => {
  const report = inspectW395GoogleIdentityD1Readiness();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.liveIdentityCertified, false);
  assert.equal(report.accountRestoreCertified, false);
  assert.equal(report.collectionOrReferralEligible, false);
  assert.ok(report.checkCount >= 20);
  assert.match(report.limitations.join(' '), /No Cloudflare Pages binding/i);
});
