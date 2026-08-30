#!/usr/bin/env node
/** W559 source gate — City map travel and update-safe local resume continuity. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/contracts/city/eon-city-resume-travel.js',
  'assets/js/city/eon-city-workroom-overlay.js',
  'assets/js/eon-city-play-station.js',
  'assets/js/local-first/eon-local-encrypted-export.js',
  'assets/js/vault/eon-vault-lifecycle.js',
  'assets/js/utils/update-safe-user-data.js',
  'tests/unit/w559-city-resume-travel.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const resume = files['assets/js/contracts/city/eon-city-resume-travel.js'];
const overlay = files['assets/js/city/eon-city-workroom-overlay.js'];
const station = files['assets/js/eon-city-play-station.js'];
const encryptedExport = files['assets/js/local-first/eon-local-encrypted-export.js'];
const vault = files['assets/js/vault/eon-vault-lifecycle.js'];
const updateSafe = files['assets/js/utils/update-safe-user-data.js'];
const unit = files['tests/unit/w559-city-resume-travel.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(resume, /EON_CITY_RESUME_STATE_KEY\s*=\s*'eon:city:world-state:resume:v1'/, 'resume-storage-key-missing');
need(resume, /getEonCityTravelDestinations/, 'static-destination-api-missing');
need(resume, /filter\(\(landmark\)\s*=>\s*landmark\?\.action\s*&&\s*landmark\?\.play\)/, 'public-landmark-filter-missing');
need(resume, /prepareEonCityMapTravel/, 'travel-preparation-missing');
need(resume, /prepareEonCityResume/, 'resume-preparation-missing');
need(resume, /explicit-user-action-required/, 'explicit-action-boundary-missing');
need(resume, /applyEonCityMapTravel/, 'map-travel-apply-missing');
need(resume, /applyEonCityResume/, 'resume-apply-missing');
need(resume, /captureEonCityResumeFromRuntime/, 'runtime-capture-missing');
need(resume, /normalizeEonCityResumeState/, 'closed-resume-normalizer-missing');
need(resume, /privateWorkIncluded:\s*false/, 'private-work-boundary-missing');
need(resume, /automaticCrossDeviceSync:\s*false/, 'cross-device-boundary-missing');
need(resume, /pointerLockRestored:\s*false/, 'pointer-lock-boundary-missing');
need(resume, /opensRoute:\s*false/, 'route-boundary-missing');
need(resume, /renderEonCityTravelResume/, 'travel-resume-markup-missing');
forbid(resume, /(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/i, 'resume-travel-must-not-network');
forbid(resume, /projectReference|rawTask|providerCredential/i, 'resume-travel-private-content-forbidden');

need(overlay, /onPoseRestored/, 'workroom-pose-return-hook-missing');
need(overlay, /pointerLockRestored:\s*false/, 'workroom-pointer-lock-boundary-missing');
need(station, /bindEonCityTravelResume/, 'station-travel-bind-missing');
need(station, /renderEonCityTravelResume/, 'station-travel-markup-missing');
need(station, /data-eon-play-open-travel-map/, 'station-travel-control-missing');
need(station, /captureEonCityResumeFromRuntime/, 'station-local-capture-missing');
need(station, /onPoseRestored/, 'station-workroom-resume-capture-missing');
need(encryptedExport, /EON_CITY_RESUME_STATE_KEY/, 'portable-export-resume-key-missing');
need(encryptedExport, /normalizeEonCityResumeState/, 'portable-export-resume-sanitizer-missing');
need(vault, /EON_CITY_RESUME_STATE_KEY/, 'vault-resume-key-missing');
need(vault, /normalizeEonCityResumeState/, 'vault-resume-sanitizer-missing');
need(updateSafe, /eon:city:world-state:resume:v1/, 'update-safe-resume-key-missing');
need(unit, /W559 focuses a local landmark/, 'w559-local-travel-unit-missing');
need(unit, /W559 encrypted portability/, 'w559-portability-unit-missing');
need(runner, /w559-city-resume-travel\.test\.mjs/, 'w559-current-suite-registration-missing');

const CHECK_COUNT = 33;
const report = Object.freeze({ wave: 'W559', ok: errors.length === 0, checks: CHECK_COUNT - errors.length, required: required.length, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w559-city-resume-travel-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
