#!/usr/bin/env node
/** W563 source gate — five useful core City paths with review-first native handoffs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-useful-work-paths.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w563-useful-city-work-paths.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const paths = files['assets/js/city/eon-city-useful-work-paths.js'];
const station = files['assets/js/eon-city-play-station.js'];
const unit = files['tests/unit/w563-useful-city-work-paths.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(paths, /EON_CITY_USEFUL_WORK_PATHS_SCHEMA\s*=\s*'eon\.city\.useful-work-paths\.w563\.v1'/, 'work-path-schema-missing');
need(paths, /id:\s*'creator'/, 'creator-path-missing');
need(paths, /id:\s*'builder'/, 'builder-path-missing');
need(paths, /id:\s*'operator'/, 'operator-path-missing');
need(paths, /id:\s*'analyst'/, 'analyst-path-missing');
need(paths, /id:\s*'guardian'/, 'guardian-path-missing');
need(paths, /state:\s*'available-core'/, 'core-access-state-missing');
need(paths, /createEonCityUsefulWorkPathReview/, 'review-factory-missing');
need(paths, /confirmationRequired:\s*true/, 'second-click-boundary-missing');
need(paths, /privateContentVisible:\s*false/, 'private-content-boundary-missing');
need(paths, /taskCreated:\s*false/, 'task-boundary-missing');
need(paths, /providerRequestCreated:\s*false/, 'provider-boundary-missing');
need(paths, /backgroundWorkStarted:\s*false/, 'background-boundary-missing');
need(paths, /entitlementChecked:\s*false/, 'entitlement-boundary-missing');
need(paths, /commercialOfferShown:\s*false/, 'commercial-boundary-missing');
need(paths, /rewardCreated:\s*false/, 'reward-boundary-missing');
need(paths, /syntheticXpCreated:\s*false/, 'xp-boundary-missing');
need(paths, /automaticRoute:\s*false/, 'automatic-route-boundary-missing');
need(paths, /automaticToolExecution:\s*false/, 'automatic-tool-boundary-missing');
need(paths, /completionClaimed:\s*false/, 'completion-boundary-missing');
forbid(paths, /(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|EventSource)\s*[.(]/i, 'work-paths-must-not-store-or-network');
need(station, /bindEonCityUsefulWorkPaths/, 'station-work-path-binder-missing');
need(station, /data-eon-play-open-work-paths/, 'station-work-path-open-control-missing');
need(station, /data-eon-play-work-paths-panel/, 'station-work-path-panel-missing');
need(station, /City will only open the chosen native surface after your second visible click/, 'station-second-click-copy-missing');
need(station, /no paid district, pricing, entitlement, or checkout is active here/, 'station-no-commercial-copy-missing');
need(unit, /W563 provides exactly five useful core City paths/, 'w563-path-unit-missing');
need(unit, /W563 creates a second-click, privacy-safe native handoff/, 'w563-handoff-unit-missing');
need(runner, /w563-useful-city-work-paths\.test\.mjs/, 'w563-current-suite-registration-missing');

const CHECK_COUNT = 29;
export function inspectW563UsefulCityWorkPaths() {
  return Object.freeze({ wave: 'W563', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW563UsefulCityWorkPaths();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w563-useful-city-work-paths-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
