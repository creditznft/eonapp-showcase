import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { saveEonDeviceEvidenceRecords } from '../../assets/js/local-first/eon-device-evidence-records.js';
import {
  buildEonLocalBetaReadinessExport,
  clearEonLocalBetaReadinessRecords,
  loadEonLocalBetaReadinessRecords,
  saveEonLocalBetaReadinessRecords
} from '../../assets/js/local-first/eon-beta-readiness-records.js';
import { createEonLocalReleaseGovernanceBoard } from '../../assets/js/local-first/eon-release-governance-board.js';
import { assessEonReferralReentry } from '../../assets/js/realm-relic/eon-referral-reentry-firewall.js';
import { runW353W356LocalBetaReleaseGovernanceGate } from '../../scripts/w353-w356-local-beta-release-governance-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function fakeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); }
  };
}

const declarations = Object.freeze({ backupRecoveryDrill: true, privacyReview: true, incidentOwnerRoster: true, inviteOnly: true });

test('W353 saves only explicit local boolean declarations and joins them with separate device proof state', () => {
  const storage = fakeStorage();
  const deviceStorage = fakeStorage();
  const denied = saveEonLocalBetaReadinessRecords(declarations, { storage, deviceStorage });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'explicit-user-confirmation-required');

  const saved = saveEonLocalBetaReadinessRecords(declarations, { confirmedByUser: true, storage, deviceStorage });
  assert.equal(saved.ok, true);
  assert.equal(saved.snapshot.readiness.status, 'not-ready');
  assert.equal(saved.snapshot.inviteCreated, false);
  assert.equal(saved.snapshot.automaticEnrollment, false);
  assert.equal(saved.snapshot.remoteTelemetryCreated, false);
  assert.equal(saved.snapshot.commercialFeaturesEnabled, false);

  const record = loadEonLocalBetaReadinessRecords({ storage, deviceStorage });
  assert.deepEqual(record.declarations, declarations);
  const exported = JSON.parse(buildEonLocalBetaReadinessExport(record.declarations, { deviceStorage, now: 1_770_100_000_000 }));
  assert.equal(exported.proofBoundary.releaseApproved, false);
  assert.equal(exported.proofBoundary.automaticEnrollment, false);
  assert.equal(clearEonLocalBetaReadinessRecords({ storage }).ok, false);
  assert.equal(clearEonLocalBetaReadinessRecords({ confirmedByUser: true, storage }).ok, true);
});

test('W353 can become locally ready for invite-only beta only after user-recorded device proof; it still does not enroll anyone', () => {
  const storage = fakeStorage();
  const deviceStorage = fakeStorage();
  const ids = ['desktop-standard', 'android-4gb', 'offline', 'private-browsing', 'storage-denied', 'backup-restore', 'direct-byok-failure'];
  saveEonDeviceEvidenceRecords(ids.map((id) => ({ id, status: 'passed', note: 'Manually checked.' })), { confirmedByUser: true, storage: deviceStorage });
  const saved = saveEonLocalBetaReadinessRecords(declarations, { confirmedByUser: true, storage, deviceStorage });
  assert.equal(saved.snapshot.readiness.status, 'ready-for-invite-only-beta');
  assert.equal(saved.snapshot.inviteCreated, false);
  assert.equal(saved.snapshot.automaticEnrollment, false);
});

test('W356 release board remains blocked even when local beta readiness is complete', () => {
  const board = createEonLocalReleaseGovernanceBoard({ betaReadiness: { status: 'ready-for-invite-only-beta', blockers: [] } });
  assert.equal(board.status, 'blocked');
  assert.equal(board.releaseApproved, false);
  assert.equal(board.deploymentCreated, false);
  assert.equal(board.betaEnrollmentCreated, false);
  assert.equal(board.blockers.includes('canonical-evidence-recovery-required'), true);
  assert.equal(board.blockers.includes('git-history-secret-remediation-owner-required'), true);
});

test('W355 referral re-entry never activates from prerequisite-like inputs', () => {
  const assessment = assessEonReferralReentry({ processorTestModeProven: true, refundWindowProven: true, abuseControlsProven: true, supportOwnerProven: true });
  assert.equal(assessment.status, 'separate-ceo-decision-required');
  assert.equal(assessment.referralActive, false);
  assert.equal(assessment.attributionTrackingActive, false);
  assert.equal(assessment.discountIssued, false);
  assert.equal(assessment.cashOrCryptoIssued, false);
  assert.equal(assessment.payoutCreated, false);
});

test('W353–W356 local beta/release governance source gate remains green', () => {
  const result = runW353W356LocalBetaReleaseGovernanceGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});
