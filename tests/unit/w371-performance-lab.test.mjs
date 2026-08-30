import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CITY_PERFORMANCE_LAB_CASES,
  CITY_PERFORMANCE_LAB_STORAGE_KEY,
  buildCityPerformanceLabExport,
  getCityPerformanceLabTruth,
  loadCityPerformanceLab,
  saveCityPerformanceLabObservation
} from '../../assets/js/city/eon-city-performance-lab.js';
import { W371_PERFORMANCE_LAB_CONTRACT, validateW371PerformanceLabContract } from '../../config/w371-performance-lab-contract.mjs';

function memoryStorage() { const map = new Map(); return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, String(value)) }; }

test('W371 starts as an incomplete manual City device matrix', () => {
  const snapshot = loadCityPerformanceLab({ storage: memoryStorage() });
  assert.equal(snapshot.status, 'incomplete');
  assert.equal(snapshot.records.length, 6);
  assert.equal(snapshot.autoPassCreated, false);
  assert.deepEqual(snapshot.records.map((row) => row.id), CITY_PERFORMANCE_LAB_CASES.map((entry) => entry.id));
});

test('W371 requires explicit manual save and strips secret-like notes', () => {
  const storage = memoryStorage();
  const denied = saveCityPerformanceLabObservation({ id: 'desktop-integrated', status: 'passed', note: 'manual check' }, { storage });
  assert.equal(denied.ok, false);
  const saved = saveCityPerformanceLabObservation({ id: 'desktop-integrated', status: 'passed', note: 'api_key must not be saved', runtime: { averageFrameMs: 21.5, fps: 58 } }, { storage, confirmedByUser: true, now: 1760000000000 });
  assert.equal(saved.ok, true);
  assert.equal(saved.snapshot.records[0].note, '');
  assert.equal(saved.snapshot.records[0].runtime.averageFrameMs, 21.5);
  assert.equal(storage.getItem(CITY_PERFORMANCE_LAB_STORAGE_KEY).includes('api_key'), false);
});

test('W371 export and contract never create a certification claim', () => {
  const exported = buildCityPerformanceLabExport({ records: [{ id: 'desktop-integrated', status: 'passed' }] }, { now: 1760000000000 });
  assert.match(exported, /"automaticallyVerified": false/);
  assert.match(exported, /"certificationCreated": false/);
  assert.deepEqual(validateW371PerformanceLabContract(), []);
  assert.equal(getCityPerformanceLabTruth().certificationCreated, false);
  assert.equal(W371_PERFORMANCE_LAB_CONTRACT.truthRules.remoteTelemetryCreated, false);
});
