#!/usr/bin/env node
/** W410 source gate: manual City validation must remain local and non-certifying. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_VALIDATION_LAB_CASES, createCityValidationLabSnapshot, getCityValidationLabTruth } from '../assets/js/city/eon-city-validation-lab.js';
import { W410_CITY_VALIDATION_LAB_CONTRACT, validateW410CityValidationLabContract } from '../config/w410-city-validation-lab-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW410CityValidationLab() {
  const contract = W410_CITY_VALIDATION_LAB_CONTRACT;
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const lab = read('assets/js/city/eon-city-validation-lab.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const docs = read('docs/W410_CITY_VALIDATION_LAB_2026-06-28.md');
  const truth = getCityValidationLabTruth();
  const empty = createCityValidationLabSnapshot();

  check('contract-valid', validateW410CityValidationLabContract().length === 0, 'W410 contract has no internal mismatch');
  check('required-files-exist', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'W410 required source files exist');
  check('required-case-ids', CITY_VALIDATION_LAB_CASES.map((item) => item.id).join(',') === contract.requiredCaseIds.join(','), 'W410 case IDs match the contract');
  check('empty-remains-pending', empty.status === 'manual-evidence-incomplete' && !empty.certificationIssued && !empty.launchApproved, 'an empty checklist cannot certify City');
  check('truth-is-local-and-noncertifying', Object.entries(contract.expectedTruth).every(([key, expected]) => truth[key] === expected), 'manual evidence remains local and does not auto-pass/certify');
  check('station-has-visible-entry', /data-eon-play-open-validation-lab/.test(station) && /data-eon-play-validation-lab/.test(station) && /bindCityValidationLab/.test(station), 'City controls expose the manual Validation Lab');
  check('station-uses-explicit-local-actions', /saveCityValidationLabObservation/.test(station) && /buildCityValidationLabExport/.test(station) && /clearCityValidationLab/.test(station), 'station saves, exports and clears only after user action');
  check('device-lab-is-separate', /data-eon-play-open-validation-device-lab/.test(station) && /data-eon-play-open-performance-lab/.test(station), 'performance evidence remains a separate explicit Device Lab action');
  check('accessible-style-present', /eon-play-validation-lab/.test(css), 'Validation Lab retains City modal styling and mobile layout');
  check('no-remote-primitive', !/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(`${lab}\n${station}`), 'W410 adds no network transport or telemetry');
  check('no-auto-certification-primitive', !/automaticCertification:\s*true|launchApproval:\s*true|autoMarkPassed/.test(lab), 'W410 cannot make a certification or launch claim');
  check('docs-disclose-limit', /does not certify/i.test(docs) && /No screenshot or video is uploaded/i.test(docs) && /real desktop and mobile evidence/i.test(docs), 'docs disclose manual proof limitations');

  return Object.freeze({ schema: 'eonapp.w410.city-validation-lab-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze([
    'W410 creates a manual local evidence surface only; it does not inspect screenshots, video, browsers, devices, GPU performance or production routes.',
    'No City visual/control certification, launch approval, performance guarantee or live-device claim is created by this source gate.',
    'Real desktop, Android and iOS evidence must be captured and independently reviewed before stronger claims.'
  ]) });
}

export function runW410CityValidationLabGate({ writeArtifact = true } = {}) {
  const report = inspectW410CityValidationLab();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w410-city-validation-lab-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW410CityValidationLabGate();
  process.stdout.write(`W410 City Validation Lab gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
