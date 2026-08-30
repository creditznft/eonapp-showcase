import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W718_BABYLON_REQUIRED_TESTS,
  W718_QUANTITATIVE_GATES,
  W718_REQUIRED_JOURNEYS,
  W718_SCORE_PILLARS,
  createW718OwnerScorecardTemplate,
  evaluateW718OwnerScorecard,
  getW718IndependentCertificationTruth
} from '../../config/w718-independent-certification-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));

test('W718 locks the twelve-pillar 9.5 score model and critical thresholds', () => {
  assert.equal(W718_SCORE_PILLARS.length, 12);
  assert.equal(W718_SCORE_PILLARS.reduce((sum, row) => sum + row.weight, 0), 100);
  assert.equal(W718_QUANTITATIVE_GATES.length, 14);
  assert.equal(W718_REQUIRED_JOURNEYS.length, 9);
  const pending = evaluateW718OwnerScorecard(createW718OwnerScorecardTemplate());
  assert.equal(pending.ok, false);
  assert.equal(pending.weightedScore, null);
});

test('W718 awards acceptance only with evidence, 9.5 weighted, 9.0 minimum and owner approval', () => {
  const scorecard = JSON.parse(JSON.stringify(createW718OwnerScorecardTemplate()));
  scorecard.ownerApproved = true;
  for (const row of scorecard.pillars) { row.score = 9.5; row.evidence = [`evidence:${row.id}`]; }
  for (const row of scorecard.quantitativeGates) { row.passed = true; row.evidence = [`evidence:${row.id}`]; }
  for (const row of scorecard.journeys) { row.passed = true; row.evidence = [`evidence:${row.id}`]; }
  const result = evaluateW718OwnerScorecard(scorecard);
  assert.equal(result.ok, true);
  assert.equal(result.weightedScore, 9.5);
  scorecard.pillars[0].score = 8.9;
  assert.equal(evaluateW718OwnerScorecard(scorecard).ok, false);
});

test('W718 preserves the complete Babylon test closure across current certification and the W721 non-certifying archive', () => {
  const manifest = json('config/w624d-current-unit-test-manifest.json');
  const archive = json('config/archive/w721-superseded-launch-tests.json');
  assert.equal(W718_BABYLON_REQUIRED_TESTS.length, 24);
  const maintained = W718_BABYLON_REQUIRED_TESTS.filter((relative) => manifest.testFiles.includes(relative));
  const superseded = W718_BABYLON_REQUIRED_TESTS.filter((relative) => archive.testFiles.includes(relative));
  assert.equal(maintained.length, 13);
  assert.equal(superseded.length, 11);
  for (const relative of W718_BABYLON_REQUIRED_TESTS) {
    assert.equal(Number(manifest.testFiles.includes(relative)) + Number(archive.testFiles.includes(relative)), 1, relative);
    assert.ok(fs.existsSync(path.join(root, relative)));
  }
});

test('W718 records registry 503 as infrastructure without weakening exact dependencies', () => {
  const receipt = json('config/w718-dependency-install-attempt.json');
  assert.equal(receipt.exactLockfile, true);
  assert.equal(receipt.outcome, 'infrastructure-blocked');
  assert.equal(receipt.errorCode, 'E503');
  assert.equal(receipt.sourceFailure, false);
  assert.equal(receipt.alternateVersionUsed, false);
  assert.equal(receipt.cdnSubstituteUsed, false);
  assert.equal(receipt.babylonShimUsed, false);
});

test('W718 truth refuses to convert source readiness into browser or owner certification', () => {
  const truth = getW718IndependentCertificationTruth();
  assert.equal(truth.sourceReadinessCanRunWithoutDependencies, true);
  assert.equal(truth.exactCertificationRequiresDependencies, true);
  assert.equal(truth.realBrowsersRequired, true);
  assert.equal(truth.ownerDeviceRequired, true);
  assert.equal(truth.sourceReadinessIsCertification, false);
  assert.equal(truth.infrastructureFailureIsProductFailure, false);
  assert.equal(truth.automaticScoreAwarded, false);
  assert.equal(truth.automaticDeployment, false);
});
