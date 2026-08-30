import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA,
  W478_RELEASE_DECISION,
  W478_REQUIRED_EXTERNAL_EVIDENCE,
  W478_SOURCE_LANES,
  getW478Truth,
  validateW478ExperienceIdentityDeviceBoard
} from '../../config/w478-experience-identity-device-contract.mjs';
import { inspectW478ExperienceIdentityDevice } from '../../scripts/w478-experience-identity-device-gate.mjs';

test('W478 keeps source readiness separate from real accessibility, identity and device certification', () => {
  const truth = getW478Truth();
  assert.equal(truth.schema, W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA);
  assert.equal(truth.releaseDecision, W478_RELEASE_DECISION);
  assert.equal(truth.accessibilityCertified, false);
  assert.equal(truth.googleOAuthLiveVerified, false);
  assert.equal(truth.androidIosPwaVerified, false);
  assert.equal(truth.updateRollbackVerified, false);
  assert.equal(truth.legacyTransportQuarantineIndependentlyReviewed, false);
  assert.equal(W478_SOURCE_LANES.length, 7);
  assert.equal(W478_REQUIRED_EXTERNAL_EVIDENCE.length, 7);
});

test('W478 source board has the required claim fence and remains NO_GO', () => {
  const board = {
    schema: W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA,
    scope: 'source-readiness-plus-external-evidence-plan',
    releaseDecision: W478_RELEASE_DECISION,
    sourceLanes: W478_SOURCE_LANES.map((lane) => lane.id),
    requiredExternalEvidence: W478_REQUIRED_EXTERNAL_EVIDENCE.map((entry) => entry.id),
    claimFence: ['source only', 'human review', 'voice proof', 'OAuth optional', 'device proof']
  };
  assert.deepEqual(validateW478ExperienceIdentityDeviceBoard(board).errors, []);
});

test('W478 static source gate passes without converting pending live proof into approval', () => {
  const report = inspectW478ExperienceIdentityDevice({ writeArtifact: false });
  assert.equal(report.sourceStatus, 'pass');
  assert.equal(report.releaseStatus, 'blocked-pending-reviewed-external-evidence');
  assert.equal(report.sourceLaneCount, 7);
  assert.equal(report.externalEvidenceCount, 7);
  assert.equal(report.truth.microphoneAutomaticallyStarted, false);
  assert.equal(report.blockers.length, 7);
});
