import assert from 'node:assert/strict';
import test from 'node:test';
import { W535_ALLOWED_BOARD_STATES, validateW535ReleaseTruthContract } from '../../config/w535-release-truth-reaudit-contract.mjs';
import { buildW535ReleaseTruthBoard } from '../../scripts/w535-release-truth-reaudit.mjs';

test('W535 returns an evidence-bounded limited-preview board for a green local source candidate', () => {
  assert.deepEqual(validateW535ReleaseTruthContract(), []);
  const board = buildW535ReleaseTruthBoard();
  assert.equal(W535_ALLOWED_BOARD_STATES.includes(board.boardState), true);
  assert.equal(board.boardState, 'LIMITED_PREVIEW_ONLY');
  assert.equal(board.localSourceGreen, true, board.issues.join('\n'));
  assert.equal(board.productTruth.automaticMultiDeviceSync, 'not-active');
  assert.equal(board.productTruth.googleDrive, 'separate-encrypted-snapshot-source-present-not-externally-proven');
  assert.equal(board.productTruth.trustHub, 'separate-static-package-not-published-from-this-worktree');
  assert.equal(board.productTruth.machineEvidence, 'source-static-shape-pass-emulated-browser-pending');
  assert.equal(board.productTruth.androidEmulator, 'source-lane-pass-emulator-pending');
  assert.equal(board.productTruth.securityOauth, 'source-structural-review-pass-external-evidence-pending');
  assert.equal(board.prohibitedClaims.includes('production-certified'), true);
  assert.equal(board.externalEvidenceRequired.includes('google-drive-consent-upload-restore-proof'), true);
});
