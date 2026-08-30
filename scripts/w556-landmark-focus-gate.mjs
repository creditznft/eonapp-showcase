#!/usr/bin/env node
/** W556 source gate — bounded landmark hover/focus and review-first City actions. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const required = Object.freeze([
  'assets/js/city/eon-city-landmark-focus.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w556-landmark-focus.test.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const focus = exists(required[0]) ? read(required[0]) : '';
const runtime = exists(required[1]) ? read(required[1]) : '';
const station = exists(required[2]) ? read(required[2]) : '';
const unit = exists(required[3]) ? read(required[3]) : '';
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

need(focus, /eon\.city\.landmark-focus\.w556\.v1/, 'focus-schema-missing');
need(focus, /id: 'enter'/, 'enter-action-missing');
need(focus, /id: 'guide'/, 'guide-action-missing');
need(focus, /id: 'quick-open'/, 'quick-open-action-missing');
need(focus, /id: 'inspect'/, 'inspect-action-missing');
need(focus, /requiresVisibleReview: true/, 'quick-open-review-boundary-missing');
need(focus, /readsPrivateWork: false/, 'focus-private-data-boundary-missing');
need(focus, /remoteNetwork: false/, 'focus-network-boundary-missing');
need(focus, /createEonCityLandmarkFocusState/, 'focus-state-factory-missing');
forbid(focus, /(?:fetch|WebSocket|EventSource|location\.assign|location\.href)\s*[=(]/, 'focus-module-must-not-navigate-or-network');
forbid(focus, /(?:localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'focus-module-must-not-persist-state');

need(runtime, /createEonCityLandmarkFocusState/, 'runtime-focus-state-import-missing');
need(runtime, /landmarkHoverPointerMove/, 'runtime-hover-handler-missing');
need(runtime, /canvas\.addEventListener\('pointermove', landmarkHoverPointerMove\)/, 'runtime-hover-listener-missing');
need(runtime, /onLandmarkHover/, 'runtime-hover-callback-missing');
need(runtime, /onLandmarkFocus/, 'runtime-focus-callback-missing');
need(runtime, /focusNearestLandmark\('controller'\)/, 'runtime-controller-focus-missing');
need(runtime, /onLandmarkFocusRequest: focusNearestLandmark/, 'runtime-keyboard-focus-missing');
need(runtime, /Choose Enter, Guide, Quick Open or Inspect/, 'runtime-four-action-copy-missing');
need(runtime, /clearLandmarkFocus\(\)/, 'runtime-focus-clear-api-missing');
need(runtime, /hoverFocus: true/, 'runtime-hover-truth-missing');
need(runtime, /controllerFocus: true/, 'runtime-controller-truth-missing');

need(station, /onLandmarkHover:/, 'station-hover-binding-missing');
need(station, /onLandmarkFocus:/, 'station-focus-binding-missing');
need(station, /data-eon-play-landmark-enter/, 'station-enter-control-missing');
need(station, /data-eon-play-landmark-guide/, 'station-guide-control-missing');
need(station, /data-eon-play-landmark-quick-open/, 'station-quick-open-control-missing');
need(station, /data-eon-play-landmark-inspect/, 'station-inspect-control-missing');
need(station, /<kbd>E<\/kbd> or <kbd>Space<\/kbd> focuses a nearby landmark card/, 'station-keyboard-guidance-missing');
need(station, /Quick Open or Inspect yourself/, 'station-controller-guidance-missing');

need(unit, /W556 defines exactly four bounded landmark actions/, 'w556-action-unit-missing');
need(unit, /W556 normalizes a local landmark focus/, 'w556-focus-unit-missing');
need(unit, /W556 focus state safely replaces hover/, 'w556-state-unit-missing');

const CHECK_COUNT = 32;
const report = Object.freeze({ wave: 'W556', ok: errors.length === 0, checks: CHECK_COUNT - errors.length, required: required.length, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w556-landmark-focus-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
