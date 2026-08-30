import test from 'node:test';
import assert from 'node:assert/strict';
import { W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT, validateW466ProductionReleaseEvidenceContract } from '../../config/w466-production-release-evidence-contract.mjs';
import {
  EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE,
  EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE,
  EON_W466_REQUIRED_SOURCE_VALIDATION,
  assertEonW466HumanReviewReady,
  buildEonW466ProductionReleaseEvidenceBoard,
  getEonW466ProductionReleaseTruth
} from '../../assets/js/release/eon-w466-production-release-evidence.js';
import { inspectW466ProductionReleaseEvidence } from '../../scripts/w466-production-release-evidence-gate.mjs';

const allTrue = (ids) => Object.fromEntries(ids.map((id) => [id, true]));

test('W466 keeps the post-retirement route and source-only contract stable', () => {
  assert.deepEqual(validateW466ProductionReleaseEvidenceContract(), []);
  assert.deepEqual(W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.canonicalRoutes, ['/', '/eoncity', '/insights']);
  assert.equal(W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.boundaries.productionReleaseApproved, false);
  assert.equal(W466_PRODUCTION_RELEASE_EVIDENCE_CONTRACT.boundaries.commercialActivationApproved, false);
});

test('W466 defaults to an explicit blocked evidence board', () => {
  const board = buildEonW466ProductionReleaseEvidenceBoard();
  assert.equal(board.releaseReviewStatus, 'blocked-evidence-required');
  assert.equal(board.coreReviewStatus, 'blocked-source-validation-required');
  assert.equal(board.productionReleaseApproved, false);
  assert.equal(board.commercialActivationApproved, false);
  assert.equal(board.missingSourceValidation.length, EON_W466_REQUIRED_SOURCE_VALIDATION.length);
});

test('W466 permits only human review readiness, never self-certification', () => {
  const board = buildEonW466ProductionReleaseEvidenceBoard({
    sourceValidation: allTrue(EON_W466_REQUIRED_SOURCE_VALIDATION),
    externalEvidence: allTrue(EON_W466_REQUIRED_CORE_EXTERNAL_EVIDENCE),
    commercialEvidence: allTrue(EON_W466_REQUIRED_COMMERCIAL_EXTERNAL_EVIDENCE)
  });
  assert.equal(board.releaseReviewStatus, 'ready-for-human-release-review');
  assert.equal(board.productionReleaseApproved, false);
  assert.equal(board.commercialActivationApproved, false);
  assert.equal(assertEonW466HumanReviewReady(board), board);
  assert.equal(getEonW466ProductionReleaseTruth().productionReleaseApproved, false);
});

test('W466 refuses review readiness with missing evidence', () => {
  assert.throws(() => assertEonW466HumanReviewReady(buildEonW466ProductionReleaseEvidenceBoard()), /release review is blocked/);
});

test('W466 deterministic gate stays green without claiming operational evidence', () => {
  const result = inspectW466ProductionReleaseEvidence();
  assert.equal(result.status, 'pass');
  assert.equal(result.sourceOnly, true);
  assert.equal(result.checkCount, 8);
});
