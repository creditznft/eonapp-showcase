import assert from 'node:assert/strict';
import test from 'node:test';
import { W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT, validateW4795FinalNonpaymentCertificationContract } from '../../config/w4795-final-nonpayment-certification-contract.mjs';
import { buildW4795FinalNonpaymentCertificationBoard, inspectW4795FinalNonpaymentCertification } from '../../scripts/w4795-final-nonpayment-certification-gate.mjs';

test('W479.5 contract remains source-only and proof-gated', () => {
  assert.deepEqual(validateW4795FinalNonpaymentCertificationContract(), []);
  assert.equal(W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT.certificationTruth.productionCertifiedBySourceBundle, false);
  assert.equal(W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT.certificationTruth.physicalDeviceProofIncluded, false);
  assert.ok(W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT.codexEvidenceRows.includes('currentMainRebase'));
  assert.ok(W4795_FINAL_NONPAYMENT_CERTIFICATION_CONTRACT.codexEvidenceRows.includes('humanGoNoGo'));
});

test('W479.5 board refuses commerce, social connector, local media, and autopost claims', () => {
  const board = buildW4795FinalNonpaymentCertificationBoard();
  assert.equal(board.sourceOnly, true);
  assert.equal(board.certificationTruth.commerceApproved, false);
  assert.equal(board.certificationTruth.dodoCheckoutActive, false);
  assert.equal(board.certificationTruth.directSocialConnectorsActive, false);
  assert.equal(board.certificationTruth.localImageVideoAdaptersActive, false);
  assert.equal(board.certificationTruth.automaticPostingActive, false);
});

test('W479.5 gate exposes live and physical-device blockers before Codex handoff', () => {
  const report = inspectW4795FinalNonpaymentCertification();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.board.codexEvidenceRows.includes('cityDesktopColdWarm90s'));
  assert.ok(report.board.codexEvidenceRows.includes('cityAndroidPhysical'));
  assert.ok(report.board.codexEvidenceRows.includes('cityIphoneSafariPhysical'));
  assert.ok(report.board.codexEvidenceRows.includes('cityTabletPhysical'));
  assert.ok(report.checkCount >= 10);
});
