import assert from 'node:assert/strict';
import test from 'node:test';
import { W397_RELEASE_AUDIT_CONTRACT, validateW397ReleaseAuditContract } from '../../config/w397-release-audit-contract.mjs';
import { createW397ReleaseAuditBoard, getW397ReleaseAuditTruth } from '../../assets/js/local-first/w397-release-audit-board.js';
import { inspectW397ReleaseAudit } from '../../scripts/w397-release-audit-gate.mjs';

test('W397 keeps source success separate from human production release approval', () => {
  assert.deepEqual(validateW397ReleaseAuditContract(), []);
  const board = createW397ReleaseAuditBoard({
    releaseId: 'candidate 397',
    notes: 'token must not be kept',
    manualBlockers: { 'real-device-city-mobile-proof': { observed: true, evidenceRef: 'device-proof-01' } },
    createdAt: 0
  });
  assert.equal(board.releaseId, 'candidate-397');
  assert.equal(board.productionReleaseCertified, false);
  assert.equal(board.manualEvidenceComplete, false);
  assert.match(board.notes, /redacted/i);
  assert.ok(board.pending.includes('cloudflare-d1-and-google-testing-proof'));
});

test('W397 board has no release, storage, network, Collection, referral or connector activation', () => {
  const truth = getW397ReleaseAuditTruth();
  assert.equal(truth.browserStorageRead, false);
  assert.equal(truth.browserStorageWrite, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.releaseCertification, false);
  assert.equal(truth.collectionEnabled, false);
  assert.equal(truth.referralRewardsEnabled, false);
  assert.equal(truth.socialConnectorEnabled, false);
});

test('W397 source audit gate exposes every remaining manual blocker', () => {
  const report = inspectW397ReleaseAudit();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.productionReleaseCertified, false);
  assert.deepEqual(report.requiredManualBlockers, W397_RELEASE_AUDIT_CONTRACT.manualBlockers);
  assert.ok(report.checkCount >= 20);
});
