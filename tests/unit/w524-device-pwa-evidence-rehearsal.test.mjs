import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_REQUIRED_DEVICE_EVIDENCE_CASES } from '../../assets/js/local-first/eon-device-evidence-matrix.js';
import {
  W524_REQUIRED_CASE_IDS,
  W524_REQUIRED_OPERATOR_ARTIFACT_KINDS,
  W524_TRUTH,
  validateW524DevicePwaEvidenceRehearsalContract
} from '../../config/w524-device-pwa-evidence-rehearsal-contract.mjs';
import {
  buildEonDevicePwaEvidenceHandoff,
  createEonDevicePwaEvidenceRehearsal,
  getEonDevicePwaEvidenceRehearsalTruth
} from '../../assets/js/local-first/eon-device-pwa-evidence-rehearsal.js';
import { inspectW524DevicePwaEvidenceRehearsal } from '../../scripts/w524-device-pwa-evidence-rehearsal-gate.mjs';

test('W524 completes a user-reported checklist only into independent-review readiness', () => {
  assert.deepEqual(validateW524DevicePwaEvidenceRehearsalContract(), []);
  const incomplete = createEonDevicePwaEvidenceRehearsal([], { now: 1_772_000_000_000 });
  assert.equal(incomplete.status, 'evidence-rehearsal-incomplete');
  assert.equal(incomplete.passedCaseCount, 0);
  const passed = EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => ({ id: item.id, status: 'passed', note: 'manual review complete' }));
  const complete = createEonDevicePwaEvidenceRehearsal(passed, { sourceRevision: 'portable:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', deploymentTarget: 'https://preview.eonapp.ch', now: 1_772_000_000_000 });
  assert.equal(complete.status, 'ready-for-independent-review');
  assert.equal(complete.requiredCaseCount, W524_REQUIRED_CASE_IDS.length);
  assert.equal(complete.independentlyVerified, false);
  assert.equal(complete.productionApproved, false);
  assert.equal(complete.launchApproval, false);
  assert.deepEqual(complete.requiredOperatorArtifacts, W524_REQUIRED_OPERATOR_ARTIFACT_KINDS);
  assert.equal(buildEonDevicePwaEvidenceHandoff(passed).includes('"independentlyVerified": false'), true);
});

test('W524 retains no secret-like note or raw external evidence payload', () => {
  const record = createEonDevicePwaEvidenceRehearsal([{ id: 'desktop-standard', status: 'passed', note: 'sk-example-secret-do-not-copy' }]);
  assert.equal(record.cases.find((entry) => entry.id === 'desktop-standard').note, '');
  const truth = getEonDevicePwaEvidenceRehearsalTruth();
  assert.equal(truth.remoteTelemetryCreated, false);
  assert.equal(truth.screenshotUploadCreated, false);
  assert.equal(truth.deviceIdentifiersStored, false);
  assert.equal(truth.userReportedChecklistCanApproveProduction, false);
});

test('W524 gate rejects missing evidence cases and preserves source-only truth', () => {
  const fixture = EON_REQUIRED_DEVICE_EVIDENCE_CASES.filter((item) => item.id !== 'ios-safari-pwa');
  const failed = inspectW524DevicePwaEvidenceRehearsal({ cases: fixture });
  assert.equal(failed.ok, false);
  assert.ok(failed.issues.includes('required-device-case-missing:ios-safari-pwa'));
  const report = inspectW524DevicePwaEvidenceRehearsal();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.deepEqual(report.truth, W524_TRUTH);
});
