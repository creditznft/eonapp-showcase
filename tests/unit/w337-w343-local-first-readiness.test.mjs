import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assessEonLocalRunnerFeasibility, getEonLocalRunnerFeasibilityTruth } from '../../assets/js/ai-kernel/eon-local-runner-feasibility.js';
import { createEonProviderReviewBoard, getEonProviderReviewBoardTruth } from '../../assets/js/ai-kernel/eon-provider-review-board.js';
import { acknowledgeEonManualSubmission, getEonDirectManualSubmissionTruth, prepareEonManualSubmission } from '../../assets/js/ai-kernel/eon-direct-manual-submission-proof.js';
import { createEonDeviceEvidenceMatrix, getEonDeviceEvidenceMatrixTruth } from '../../assets/js/local-first/eon-device-evidence-matrix.js';
import { assessEonLocalBetaReadiness, getEonLocalBetaReadinessTruth } from '../../assets/js/local-first/eon-local-beta-readiness.js';
import { buildW342EvidenceRecoveryStatus } from '../../config/w342-evidence-recovery-status.mjs';
import { runW337W343LocalFirstReadinessGate } from '../../scripts/w337-w343-local-first-readiness-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('W337 assesses only an explicit coarse profile and never starts a runner', () => {
  const denied = assessEonLocalRunnerFeasibility({ deviceClass: 'desktop-capable' });
  assert.equal(denied.status, 'not-assessed');
  const mobile = assessEonLocalRunnerFeasibility({ userInitiated: true, deviceClass: 'mobile-4gb', memoryGb: 4, freeStorageGb: 32, webGpuAvailable: false });
  assert.equal(mobile.status, 'not-recommended');
  assert.equal(mobile.installStarted, false);
  assert.equal(mobile.backgroundAfterClose, false);
  const desktop = assessEonLocalRunnerFeasibility({ userInitiated: true, deviceClass: 'desktop-capable', memoryGb: 24, freeStorageGb: 100, webGpuAvailable: true });
  assert.equal(desktop.status, 'research-feasible-not-shipped');
  assert.equal(desktop.modelDownloadStarted, false);
  assert.equal(getEonLocalRunnerFeasibilityTruth().automaticDeviceProbe, false);
});

test('W338 accepts one explicit protocol review but never activates or calls a provider', () => {
  const board = createEonProviderReviewBoard({
    providerId: 'future-direct-provider',
    adapterId: 'openai-compatible-chat/v1',
    protocol: 'openai-compatible-chat',
    dataDestination: 'direct-to-provider',
    userInitiatedReview: true,
    models: 'user-discovered-device-local',
    lifecycle: { packVersioned: true, deprecationPrompt: 'explicit-user-prompt' },
    privacy: { cloudRelayAllowed: false, crossProviderFallback: 'none' }
  });
  assert.equal(board.status, 'review-required');
  assert.equal(board.eligibleForActivation, false);
  assert.equal(board.providerCallCreated, false);
  assert.equal(board.modelListFetched, false);
  assert.equal(getEonProviderReviewBoardTruth().hardcodedModels, false);
  const bad = createEonProviderReviewBoard({ providerId: 'bad', models: 'hardcoded-defaults' });
  assert.equal(bad.status, 'incomplete');
  assert.ok(bad.errors.includes('hardcoded-model-defaults-forbidden'));
});

test('W339 prepares an explicit manual handoff and never asserts external completion', () => {
  const prepared = prepareEonManualSubmission({ artifactId: 'artifact_local_01', destination: 'download', userInitiated: true });
  assert.equal(prepared.status, 'prepared-for-user-submission');
  assert.equal(prepared.destinationOpened, false);
  assert.equal(prepared.publishCreated, false);
  const denied = acknowledgeEonManualSubmission(prepared, { confirmedByUser: false });
  assert.equal(denied.status, 'not-acknowledged');
  const acknowledged = acknowledgeEonManualSubmission(prepared, { confirmedByUser: true, now: 1_770_000_000_000 });
  assert.equal(acknowledged.status, 'user-reported-manual-submission');
  assert.equal(acknowledged.externalCompletionVerified, false);
  assert.equal(getEonDirectManualSubmissionTruth().localAcknowledgementIsNotProof, true);
});

test('W341 requires full user-owned device/recovery evidence before invite-only beta readiness', () => {
  const incomplete = createEonDeviceEvidenceMatrix([{ id: 'desktop-standard', status: 'passed' }]);
  assert.equal(incomplete.status, 'incomplete');
  const records = incomplete.cases.map((item) => ({ id: item.id, status: 'passed', note: 'local manual record' }));
  const complete = createEonDeviceEvidenceMatrix(records);
  assert.equal(complete.status, 'complete');
  const beta = assessEonLocalBetaReadiness({ deviceEvidence: records, backupRecoveryDrill: true, privacyReview: true, incidentOwnerRoster: true, inviteOnly: true });
  assert.equal(beta.status, 'ready-for-invite-only-beta');
  assert.equal(beta.remoteTelemetryEnabled, false);
  assert.equal(getEonDeviceEvidenceMatrixTruth().remoteTelemetryCreated, false);
  assert.equal(getEonLocalBetaReadinessTruth().commercialFeaturesAllowed, false);
});

test('W342 reports the missing authoritative evidence rather than creating it', () => {
  const status = buildW342EvidenceRecoveryStatus(root);
  assert.equal(status.fabricated, false);
  assert.equal(status.archiveHashManifestChanged, false);
  assert.equal(status.status, 'blocked-authoritative-recovery-required');
  assert.ok(status.missing.length >= 2);
});

test('W337–W343 source gate passes while retaining the evidence-recovery blocker', () => {
  const report = runW337W343LocalFirstReadinessGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.evidenceStatus, 'blocked-authoritative-recovery-required');
  assert.ok(report.missingEvidenceCount >= 2);
});
