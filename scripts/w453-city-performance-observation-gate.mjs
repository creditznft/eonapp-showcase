#!/usr/bin/env node
/** W453 static source gate: foreground City metrics and fail-closed evidence boundary. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCityPerformanceObservationTruth } from '../assets/js/city/eon-city-performance-observation.js';
import { W453_CITY_PERFORMANCE_OBSERVATION_CONTRACT, validateW453CityPerformanceObservationContract } from '../config/w453-city-performance-observation-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

export function inspectW453CityPerformanceObservation() {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push(Object.freeze({ id, pass: Boolean(condition), detail }));
    assert.equal(Boolean(condition), true, `${id}: ${detail}`);
  };
  const contract = W453_CITY_PERFORMANCE_OBSERVATION_CONTRACT;
  const recorder = read('assets/js/city/eon-city-performance-observation.js');
  const babylon = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const truth = getCityPerformanceObservationTruth();

  check('required-files', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'the recorder, Babylon integration, Device Lab integration, source gate and tests are present');
  check('contract-valid', validateW453CityPerformanceObservationContract().length === 0, 'the W453 metric and truth contract is internally consistent');
  check('foreground-metrics', /recordFirstFrame/.test(recorder) && /recordFrame/.test(recorder) && /p95FrameMs/.test(recorder) && /p99FrameMs/.test(recorder) && /estimatedFps/.test(recorder), 'the recorder keeps bounded first-frame and frame-time metrics in memory');
  check('memory-boundary', /captureMemory/.test(recorder) && /slopeBytesPerMinute/.test(recorder) && !/localStorage|sessionStorage|indexedDB/i.test(recorder), 'optional heap summaries are memory-only and never persisted by the recorder');
  check('privacy-boundary', !/navigator\.userAgent|navigator\.deviceMemory|navigator\.hardwareConcurrency|navigator\.sendBeacon|XMLHttpRequest|\bfetch\s*\(/.test(recorder), 'the recorder does not collect device identifiers or use remote transport');
  check('babylon-wiring', /createCityPerformanceObservation/.test(babylon) && /performanceObservation\.recordFirstFrame/.test(babylon) && /performanceObservation\.recordFrame/.test(babylon) && /getPerformanceObservation/.test(babylon), 'Babylon records the foreground session and exposes a local summary to Device Lab');
  check('staged-world-wiring', /deferred-stages-started/.test(babylon) && /performance-protection-applied/.test(babylon) && /webgl-context-lost/.test(babylon), 'the session record makes core/deferred/protection/context events inspectable without claiming success');
  check('device-lab-export', /buildCityPerformanceObservationExport/.test(station) && /Export renderer session/.test(station) && /console\/WebGL warnings still need a human review/i.test(station), 'Device Lab shows and exports the local renderer summary while retaining a manual evidence requirement');
  check('truth-boundary', truth.localOnly && truth.persistence === 'memory-only' && !truth.remoteTelemetry && !truth.deviceIdentifierCollected && !truth.userAgentCollected && !truth.consoleCaptured && !truth.automaticCertification && !truth.automaticLaunchApproval, 'runtime truth remains local-only and cannot certify or approve launch');

  return Object.freeze({
    schema: 'eonapp.w453.city-performance-observation-gate.v1',
    wave: 'W453',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate does not run EON City in a browser or on a device.',
      'It does not capture console warnings, GPU trace, screenshots, thermal behaviour, battery impact, Lighthouse reports or production service-worker adoption.',
      'A local renderer-session export is supporting evidence only; real-device review and human release approval remain required.'
    ])
  });
}

export function runW453CityPerformanceObservationGate({ writeArtifact = true } = {}) {
  const report = inspectW453CityPerformanceObservation();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w453-city-performance-observation-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW453CityPerformanceObservationGate();
  process.stdout.write(`W453 City performance observation gate passed (${report.checkCount}/${report.checkCount}). No device certification was issued.\n`);
}
