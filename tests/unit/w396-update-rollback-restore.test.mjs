import assert from 'node:assert/strict';
import test from 'node:test';
import { W396_UPDATE_ROLLBACK_RESTORE_CONTRACT, validateW396UpdateRollbackRestoreContract } from '../../config/w396-update-rollback-restore-contract.mjs';
import { createW396ReleaseRecoveryEvidence, getW396ReleaseRecoveryTruth, W396_MANUAL_LANES } from '../../assets/js/local-first/w396-release-recovery-proof.js';
import { inspectW396UpdateRollbackRestore } from '../../scripts/w396-update-rollback-restore-gate.mjs';

test('W396 creates only a redacted manual evidence board and never a release certificate', () => {
  assert.deepEqual(validateW396UpdateRollbackRestoreContract(), []);
  const board = createW396ReleaseRecoveryEvidence({
    releaseId: 'w396 candidate',
    operatorNotes: 'No sensitive values are included.',
    lanes: { 'pre-update-local-storage-manifest': { completed: true, evidenceRef: 'capture-01' } },
    createdAt: 0
  });
  assert.equal(board.releaseId, 'w396-candidate');
  assert.equal(board.sourceOnly, true);
  assert.equal(board.releaseCertified, false);
  assert.equal(board.manualProofComplete, false);
  assert.equal(board.pending.length, W396_MANUAL_LANES.length - 1);
  assert.equal(board.lanes['pre-update-local-storage-manifest'].completed, true);
});

test('W396 redacts secret-shaped notes and keeps no cloud-sync claims', () => {
  const board = createW396ReleaseRecoveryEvidence({
    operatorNotes: 'api key: not-for-a-proof',
    lanes: { 'redacted-real-browser-evidence': { completed: true, note: 'session_id must not be recorded' } }
  });
  assert.match(board.operatorNotes, /redacted/i);
  assert.match(board.lanes['redacted-real-browser-evidence'].note, /redacted/i);
  const truth = getW396ReleaseRecoveryTruth();
  assert.equal(truth.automaticCloudBackup, false);
  assert.equal(truth.automaticCrossDeviceSync, false);
  assert.equal(truth.releaseCertification, false);
});

test('W396 source gate remains manual-proof-only', () => {
  const report = inspectW396UpdateRollbackRestore();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.manualBrowserProofCertified, false);
  assert.equal(report.releaseCertified, false);
  assert.ok(report.checkCount >= 10);
});
