#!/usr/bin/env node
/** W371 — EON City Performance Lab source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { CITY_PERFORMANCE_LAB_CASES, getCityPerformanceLabTruth } from '../assets/js/city/eon-city-performance-lab.js';
import { W371_PERFORMANCE_LAB_CONTRACT, validateW371PerformanceLabContract } from '../config/w371-performance-lab-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const lab = read('assets/js/city/eon-city-performance-lab.js');
const play = read('assets/js/eon-city-play-station.js');
const css = read('assets/css/eon-city-play.css');
const docs = read('docs/W371_CITY_PERFORMANCE_LAB_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const truth = getCityPerformanceLabTruth();

check(validateW371PerformanceLabContract().length === 0, `W371 contract invalid: ${validateW371PerformanceLabContract().join(' | ')}`);
check(CITY_PERFORMANCE_LAB_CASES.map((entry) => entry.id).join(',') === W371_PERFORMANCE_LAB_CONTRACT.requiredCases.join(','), 'W371 required device cases drifted.');
check(truth.localOnly && !truth.deviceProbeCreated && !truth.remoteTelemetryCreated && !truth.screenshotUploadCreated && !truth.autoPassCreated && !truth.certificationCreated, 'W371 must remain manual, local and non-certifying.');
check(/data-eon-play-open-performance-lab/.test(play) && /saveCityPerformanceLabObservation/.test(play) && /buildCityPerformanceLabExport/.test(play), 'W371 Immersive Work Mode needs an explicit manual performance-lab panel.');
check(/eon-play-performance-lab/.test(css), 'W371 requires accessible performance-lab styles.');
check(/No device probe, telemetry, screenshot upload, automatic pass, certification/i.test(docs) && /does not claim/i.test(docs), 'W371 docs must disclose evidence limits.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(`${lab}\n${play}`), 'W371 cannot add remote transport or telemetry.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w371.performance-lab-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  lab: { caseCount: CITY_PERFORMANCE_LAB_CASES.length, localOnly: true, manualSave: true, automaticCertification: false },
  limitations: [
    'W371 proves a source-controlled manual performance checklist only.',
    'No device probe, telemetry, screenshot upload, automatic pass, certification, browser, GPU or production proof is delivered in this code-only wave.',
    'The performance lab remains incomplete until people conduct and record actual device checks.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W371_CITY_PERFORMANCE_LAB_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
