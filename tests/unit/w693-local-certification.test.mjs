import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  EON_CITY_W693_REQUIRED_OWNER_RECORDINGS,
  buildEonCityW693LongSessionSimulation,
  buildEonCityW693CertificationBoard,
  validateEonCityW693CertificationBoard,
  getEonCityW693Truth
} from '../../assets/js/city/w693/eon-city-w693-local-certification.js';

test('W693 deterministic long-session simulation remains bounded across repeated modes and qualities', () => {
  const result = buildEonCityW693LongSessionSimulation({ cycles: 900 });
  assert.equal(result.ok, true, result.reason || 'simulation failed');
  assert.equal(result.cycles, 900);
  assert.equal(result.coreCardinalityStable, true);
  assert.equal(result.realmCardinalityStable, true);
  assert.equal(result.maximumConnectionCount, 23);
  assert.equal(result.maximumTransformationCount, 6);
  assert.equal(result.automaticQualityUpgrade, false);
  assert.equal(result.automaticRouteChange, false);
  assert.equal(result.automaticExecution, false);
  assert.equal(result.heapMeasurementClaimed, false);
  assert.equal(result.browserFrameRateClaimed, false);
  assert.equal(result.ownerDeviceClaimed, false);
});

test('W693 certification board keeps real-browser and owner evidence pending', () => {
  const board = buildEonCityW693CertificationBoard();
  const validation = validateEonCityW693CertificationBoard(board);
  assert.equal(validation.ok, true, validation.errors.join(' | '));
  assert.equal(board.localSourceSimulation, 'passed');
  assert.equal(board.ownerBrowserCertification, 'pending');
  assert.equal(board.recordingCount, 15);
  assert.equal(board.recordingPassedCount, 0);
  assert.equal(board.localCandidateAllowed, true);
  assert.equal(board.productionReleaseAllowed, false);
  assert.equal(board.visualScoreClaimAllowed, false);
  assert.equal(board.ninePointFiveClaimAllowed, false);
});

test('W693 owner recording matrix covers all final product paths', () => {
  assert.equal(EON_CITY_W693_REQUIRED_OWNER_RECORDINGS.length, 15);
  const required = ['desktop-entry','desktop-core-walk','desktop-capsule','desktop-expanse','desktop-nexus','desktop-handoff','desktop-realms','desktop-my-realm','desktop-focus-explore','desktop-long-session','mobile-landscape','mobile-portrait','keyboard-screenreader','reduced-motion','recovery-fallback'];
  assert.deepEqual(EON_CITY_W693_REQUIRED_OWNER_RECORDINGS.map((entry) => entry.id), required);
  const matrix = JSON.parse(fs.readFileSync(new URL('../../config/w693-owner-recording-matrix.json', import.meta.url), 'utf8'));
  assert.equal(matrix.status, 'pending-owner-browser-evidence');
  assert.deepEqual(matrix.recordings.map((entry) => entry.id), required);
  assert.ok(matrix.recordings.every((entry) => entry.status === 'pending' && entry.requiredProof.length >= 3));
});

test('W693 cannot overclaim a visual or production pass without all recordings', () => {
  const partial = Object.fromEntries(EON_CITY_W693_REQUIRED_OWNER_RECORDINGS.slice(0, 14).map((entry) => [entry.id, true]));
  const board = buildEonCityW693CertificationBoard({ ownerEvidence: partial });
  assert.equal(board.recordingPassedCount, 14);
  assert.equal(board.ownerBrowserCertification, 'pending');
  assert.equal(board.productionReleaseAllowed, false);
  assert.equal(board.ninePointFiveClaimAllowed, false);
  const complete = buildEonCityW693CertificationBoard({ ownerEvidence: Object.fromEntries(EON_CITY_W693_REQUIRED_OWNER_RECORDINGS.map((entry) => [entry.id, true])) });
  assert.equal(complete.ownerBrowserCertification, 'passed');
  assert.equal(complete.productionReleaseAllowed, true);
});

test('W693 truth explicitly separates source simulation from browser proof', () => {
  const truth = getEonCityW693Truth();
  assert.equal(truth.sourceSimulationIsNotBrowserProof, true);
  assert.equal(truth.ownerMatrixRequired, true);
  assert.equal(truth.visualScoreRequiresOwnerEvidence, true);
  assert.equal(truth.browserEvidenceInvented, false);
  assert.equal(truth.productionReleaseAutomatic, false);
});
