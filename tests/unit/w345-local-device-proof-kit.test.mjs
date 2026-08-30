import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_REQUIRED_DEVICE_EVIDENCE_CASES } from '../../assets/js/local-first/eon-device-evidence-matrix.js';
import {
  EON_DEVICE_EVIDENCE_STORAGE_KEY,
  buildEonDeviceEvidenceExport,
  clearEonDeviceEvidenceRecords,
  getEonDeviceEvidenceRecordsTruth,
  loadEonDeviceEvidenceRecords,
  saveEonDeviceEvidenceRecords
} from '../../assets/js/local-first/eon-device-evidence-records.js';
import { runW345LocalDeviceProofKitGate } from '../../scripts/w345-local-device-proof-kit-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W345 starts as a local incomplete checklist and never marks a device case passed itself', () => {
  const snapshot = loadEonDeviceEvidenceRecords({ storage: memoryStorage() });
  assert.equal(snapshot.matrix.status, 'incomplete');
  assert.equal(snapshot.matrix.passedCaseCount, 0);
  assert.equal(snapshot.autoPassCreated, false);
  assert.deepEqual(snapshot.records.map((record) => record.id), EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => item.id));
});

test('W345 requires an explicit save, stores only bounded case state, and discards secret-like notes', () => {
  const storage = memoryStorage();
  const records = [{ id: 'desktop-standard', status: 'passed', note: 'Ran manually on desktop.' }, { id: 'android-4gb', status: 'blocked', note: 'api_key should never be written here' }];
  const denied = saveEonDeviceEvidenceRecords(records, { storage });
  assert.equal(denied.ok, false);
  assert.equal(storage.getItem(EON_DEVICE_EVIDENCE_STORAGE_KEY), null);
  const saved = saveEonDeviceEvidenceRecords(records, { storage, confirmedByUser: true });
  assert.equal(saved.ok, true);
  assert.equal(saved.snapshot.records.find((item) => item.id === 'desktop-standard').status, 'passed');
  assert.equal(saved.snapshot.records.find((item) => item.id === 'android-4gb').note, '');
  assert.equal(storage.getItem(EON_DEVICE_EVIDENCE_STORAGE_KEY).includes('api_key'), false);
});

test('W345 exports a user-owned checklist without automatic verification and clears only after confirmation', () => {
  const storage = memoryStorage();
  const records = EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => ({ id: item.id, status: 'passed', note: 'manual local check' }));
  saveEonDeviceEvidenceRecords(records, { storage, confirmedByUser: true });
  const exported = buildEonDeviceEvidenceExport(records, { now: 1_770_000_000_000 });
  assert.equal(exported.includes('"automaticallyVerified": false'), true);
  assert.equal(exported.includes('"betaOrLaunchApproval": false'), true);
  const denied = clearEonDeviceEvidenceRecords({ storage });
  assert.equal(denied.ok, false);
  assert.ok(storage.getItem(EON_DEVICE_EVIDENCE_STORAGE_KEY));
  const cleared = clearEonDeviceEvidenceRecords({ storage, confirmedByUser: true });
  assert.equal(cleared.ok, true);
  assert.equal(storage.getItem(EON_DEVICE_EVIDENCE_STORAGE_KEY), null);
});

test('W345 truth and source gate remain local-only and fail-closed', () => {
  const truth = getEonDeviceEvidenceRecordsTruth();
  assert.equal(truth.remoteTelemetryCreated, false);
  assert.equal(truth.screenshotUploadCreated, false);
  assert.equal(truth.automaticBetaApproval, false);
  assert.equal(runW345LocalDeviceProofKitGate(root).ok, true);
});
