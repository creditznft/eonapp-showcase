import assert from 'node:assert/strict';
import test from 'node:test';
import { CITY_VISUAL_CERTIFICATION_CASES, evaluateCityVisualCertificationEvidence, getCityVisualCertificationTruth } from '../../assets/js/city/eon-city-visual-certification.js';
import { W372_VISUAL_CERTIFICATION_CONTRACT, validateW372VisualCertificationContract } from '../../config/w372-visual-certification-contract.mjs';

test('W372 starts pending and cannot create a visual certificate from source alone', () => {
  const board = evaluateCityVisualCertificationEvidence();
  assert.equal(board.status, 'pending-external-evidence');
  assert.equal(board.caseCount, 10);
  assert.equal(board.independentlyCertified, false);
  assert.equal(board.launchApproved, false);
});

test('W372 requires human observations and preserves pending independent review', () => {
  const evidence = CITY_VISUAL_CERTIFICATION_CASES.map((item) => ({ id: item.id, status: 'passed', humanObserved: true, reference: 'operator bundle' }));
  const board = evaluateCityVisualCertificationEvidence(evidence);
  assert.equal(board.status, 'evidence-submitted-awaiting-independent-review');
  assert.equal(board.humanPassedCaseCount, 10);
  assert.equal(board.independentlyCertified, false);
});

test('W372 contract and truth prohibit automatic browser/device/production proof', () => {
  assert.deepEqual(validateW372VisualCertificationContract(), []);
  const truth = getCityVisualCertificationTruth();
  assert.equal(truth.automaticBrowserProof, false);
  assert.equal(truth.automaticProductionProof, false);
  assert.equal(W372_VISUAL_CERTIFICATION_CONTRACT.truthRules.launchApproval, false);
});
