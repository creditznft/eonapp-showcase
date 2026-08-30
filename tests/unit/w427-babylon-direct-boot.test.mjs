import assert from 'node:assert/strict';
import test from 'node:test';
import { createCityBootDiagnostics, CITY_BOOT_MARKERS, getCityBootDiagnosticsTruth } from '../../assets/js/city/eon-city-boot-diagnostics.js';
import { getCityFirstFrameTimeoutMs } from '../../assets/js/eon-city-play-station.js';
import { validateW427BabylonDirectBootContract } from '../../config/w427-babylon-direct-boot-contract.mjs';
import { inspectW427BabylonDirectBoot } from '../../scripts/w427-babylon-direct-boot-gate.mjs';

function memoryStorage() { const values = new Map(); return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) }; }

test('W427 records bounded redacted boot markers locally', () => {
  const storage = memoryStorage();
  const diagnostics = createCityBootDiagnostics({ storage, now: () => 1700000000000 });
  diagnostics.record('CITY_BOOT_STARTED', { quality: 'balanced', entryMode: 'direct', detailCode: 'direct-route' });
  diagnostics.record('CITY_ENGINE_CREATE_FAILED', { quality: 'balanced', entryMode: 'direct', detailCode: 'engine-initialization' });
  const snapshot = diagnostics.getSnapshot();
  assert.equal(snapshot.localOnly, true);
  assert.equal(snapshot.remoteTransport, false);
  assert.equal(snapshot.rawErrorMessages, false);
  assert.equal(snapshot.records.length, 2);
  assert.equal(snapshot.records.at(-1).marker, 'CITY_ENGINE_CREATE_FAILED');
  assert.match(snapshot.records.at(-1).detailCode, /^[a-z0-9-]+$/);
  assert.ok(CITY_BOOT_MARKERS.includes(snapshot.records.at(-1).marker));
});

test('W427 contract and source gate remain green without device claims', () => {
  assert.deepEqual(validateW427BabylonDirectBootContract(), []);
  assert.equal(getCityBootDiagnosticsTruth().defaultPersistence, 'sessionStorage');
  const report = inspectW427BabylonDirectBoot({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 9);
  assert.match(report.limitations.join(' '), /Static source verification only/i);
});

test('W427 gives the direct City route a bounded but less aggressive first-frame window', () => {
  assert.equal(getCityFirstFrameTimeoutMs({ quality: 'lite', directEntry: false }), 10000);
  assert.equal(getCityFirstFrameTimeoutMs({ quality: 'balanced', directEntry: false }), 12000);
  assert.equal(getCityFirstFrameTimeoutMs({ quality: 'cinematic', directEntry: true }), 17000);
});
