import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCityValidationLabExport, CITY_VALIDATION_LAB_CASES, clearCityValidationLab, createCityValidationLabSnapshot, getCityValidationLabTruth, loadCityValidationLab, saveCityValidationLabObservation } from '../../assets/js/city/eon-city-validation-lab.js';
import { inspectW410CityValidationLab } from '../../scripts/w410-city-validation-lab-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test('W410 names an exact manual City validation matrix and stays pending without observations', () => {
  const empty = createCityValidationLabSnapshot();
  assert.equal(CITY_VALIDATION_LAB_CASES.length, 10);
  assert.equal(empty.requiredCaseCount, 10);
  assert.equal(empty.passedCaseCount, 0);
  assert.equal(empty.status, 'manual-evidence-incomplete');
  assert.equal(empty.certificationIssued, false);
  assert.equal(empty.launchApproved, false);
});

test('W410 requires a foreground save and strips secret-like notes', () => {
  const storage = memoryStorage();
  const noConsent = saveCityValidationLabObservation({ id: 'desktop-controls-reset', status: 'passed', note: 'checked' }, { storage });
  assert.equal(noConsent.ok, false);
  const saved = saveCityValidationLabObservation({ id: 'desktop-controls-reset', status: 'passed', note: 'token: ' + ['sk', 'bbbbbbbbbbbbbbbbbbbb'].join('-') }, { storage, confirmedByUser: true, now: 1 });
  assert.equal(saved.ok, true);
  assert.equal(saved.snapshot.records.find((row) => row.id === 'desktop-controls-reset').note, '');
  assert.equal(loadCityValidationLab({ storage }).passedCaseCount, 1);
});

test('W410 local export and clear never claim upload or certification', () => {
  const storage = memoryStorage();
  const saved = saveCityValidationLabObservation({ id: 'android-touch-safe-areas', status: 'blocked', note: 'Test device unavailable' }, { storage, confirmedByUser: true, now: 2 });
  const exported = JSON.parse(buildCityValidationLabExport(saved.snapshot, { now: 3 }));
  assert.equal(exported.proofBoundary.screenshotUploadCreated, false);
  assert.equal(exported.proofBoundary.videoUploadCreated, false);
  assert.equal(exported.proofBoundary.automaticCertification, false);
  assert.equal(clearCityValidationLab({ storage, confirmedByUser: true }).ok, true);
  assert.equal(loadCityValidationLab({ storage }).passedCaseCount, 0);
});

test('W410 truth and source gate remain manual, local and non-certifying', () => {
  const truth = getCityValidationLabTruth();
  assert.equal(truth.localOnly, true);
  assert.equal(truth.remoteTelemetryCreated, false);
  assert.equal(truth.automaticCertification, false);
  const report = inspectW410CityValidationLab();
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 12);
});
