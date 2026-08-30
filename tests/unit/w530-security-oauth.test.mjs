import assert from 'node:assert/strict';
import test from 'node:test';
import { W530_SECURITY_OAUTH_CONTRACT, validateW530SecurityOauthContract } from '../../config/w530-security-oauth-contract.mjs';
import { buildW530SecurityOauthStructuralReview } from '../../scripts/w530-security-oauth-structural-review.mjs';
import { inspectW530SecurityOauth } from '../../scripts/w530-security-oauth-gate.mjs';

test('W530 confirms identity-only Google Login and a separate future Drive consent contract from source only', () => {
  assert.deepEqual(validateW530SecurityOauthContract(), []);
  const review = buildW530SecurityOauthStructuralReview();
  assert.equal(review.ok, true, review.issues.join('\n'));
  assert.equal(review.requiredIdentityScope, 'openid email profile');
  assert.equal(review.oauthStarted, false);
  assert.equal(review.consentRequested, false);
  assert.equal(review.secretsRead, false);
  assert.ok(review.pendingExternalEvidence.includes('google-drive-consent-upload-restore-proof') || W530_SECURITY_OAUTH_CONTRACT.pendingExternalEvidence.includes('controlled-google-oauth-completion'));
});

test('W530 never turns static source review into network header, session, or consent evidence', () => {
  const review = buildW530SecurityOauthStructuralReview();
  assert.equal(review.targetFetched, false);
  assert.equal(review.headersCapturedFromNetwork, false);
  assert.equal(review.sessionRead, false);
  assert.equal(review.sourceOnly, true);
});

test('W530 gate remains secret-safe and requires later controlled external evidence', () => {
  const report = inspectW530SecurityOauth();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.review.pendingExternalEvidence.length, 4);
  assert.equal(report.review.oauthStarted, false);
});
