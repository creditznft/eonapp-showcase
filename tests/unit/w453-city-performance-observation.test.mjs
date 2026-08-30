import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA,
  buildCityPerformanceObservationExport,
  createCityPerformanceObservation,
  getCityPerformanceObservationTruth
} from '../../assets/js/city/eon-city-performance-observation.js';
import { validateW453CityPerformanceObservationContract } from '../../config/w453-city-performance-observation-contract.mjs';
import { inspectW453CityPerformanceObservation } from '../../scripts/w453-city-performance-observation-gate.mjs';

test('W453 records bounded local renderer metrics without persisting or identifying a device', () => {
  let now = 0;
  const memorySamples = [
    { usedBytes: 1000, totalBytes: 2000, limitBytes: 10000 },
    { usedBytes: 2500, totalBytes: 3000, limitBytes: 10000 }
  ];
  const observation = createCityPerformanceObservation({ now: () => now, readMemory: () => memorySamples.shift() || null, maxFrameSamples: 12 });
  observation.recordStage('route-entered');
  now = 42;
  observation.recordStage('engine-created');
  now = 124;
  observation.recordFirstFrame();
  observation.captureMemory();
  for (const frame of [12, 16, 22, 40, 18, 20]) observation.recordFrame(frame);
  now = 60124;
  observation.captureMemory();
  const snapshot = observation.getSnapshot();
  assert.equal(snapshot.schema, EON_CITY_PERFORMANCE_OBSERVATION_SCHEMA);
  assert.equal(snapshot.firstFrameMs, 124);
  assert.equal(snapshot.frameSamples, 6);
  assert.equal(snapshot.averageFrameMs, 21.33);
  assert.equal(snapshot.p95FrameMs, 40);
  assert.equal(snapshot.p99FrameMs, 40);
  assert.equal(snapshot.memory.support, 'available');
  assert.equal(snapshot.memory.sampleCount, 2);
  assert.equal(snapshot.memory.slopeBytesPerMinute, 1500);
  assert.equal(snapshot.remoteTelemetry, false);
  assert.equal(snapshot.deviceIdentifierCollected, false);
  assert.equal(snapshot.consoleCaptured, false);
  assert.equal(snapshot.certificationCreated, false);
});

test('W453 ignores unusable frame samples and makes context loss a manual review condition', () => {
  let now = 0;
  const observation = createCityPerformanceObservation({ now: () => now, readMemory: () => null });
  observation.recordFrame(-1);
  observation.recordFrame('not-a-frame');
  observation.recordStage('webgl-context-lost');
  observation.recordFrame(16);
  const snapshot = observation.getSnapshot();
  assert.equal(snapshot.frameSamples, 0);
  assert.equal(snapshot.contextLost, true);
  assert.equal(snapshot.memory.support, 'unavailable');
  assert.ok(snapshot.manualReviewRequired.includes('console-webgl-warnings'));
});

test('W453 export is local-session supporting evidence and never an automatic device pass', () => {
  const observation = createCityPerformanceObservation({ now: () => 100, readMemory: () => null });
  observation.recordFirstFrame();
  observation.recordFrame(16);
  const exported = buildCityPerformanceObservationExport(observation.getSnapshot(), { exportedAt: '2026-06-30T00:00:00.000Z' });
  assert.match(exported, /"scope": "user-exported-local-eon-city-renderer-session"/);
  assert.match(exported, /"automaticallyCertified": false/);
  assert.match(exported, /"consoleCaptured": false/);
  assert.equal(validateW453CityPerformanceObservationContract().length, 0);
  assert.equal(getCityPerformanceObservationTruth().automaticCertification, false);
});

test('W453 source gate remains green', () => {
  const report = inspectW453CityPerformanceObservation();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 9);
});
