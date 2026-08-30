#!/usr/bin/env node
/** W555B source gate — third-person City movement, static collision and gesture-only pointer lock. */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const required = Object.freeze([
  'assets/js/city/eon-city-third-person-controller.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/contracts/city/eon-city-exploration-pose.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w555b-third-person-controller.test.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const controller = exists(required[0]) ? read(required[0]) : '';
const runtime = exists(required[1]) ? read(required[1]) : '';
const pose = exists(required[2]) ? read(required[2]) : '';
const station = exists(required[3]) ? read(required[3]) : '';
const unit = exists(required[4]) ? read(required[4]) : '';
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

need(controller, /eon\.city\.third-person-controller\.w555b\.v1/, 'third-person-schema-missing');
need(controller, /resolveEonCityThirdPersonPosition/, 'position-resolver-missing');
need(controller, /createEonCityStaticCollisionVolumes/, 'static-collision-factory-missing');
need(controller, /createEonCityPointerLook/, 'pointer-look-factory-missing');
need(controller, /requestPointerLock/, 'pointer-lock-request-missing');
need(controller, /request\(\) \{/, 'pointer-lock-request-must-remain-explicit-method');
need(controller, /exitPointerLock/, 'pointer-lock-release-missing');
need(controller, /not a physics or multiplayer system/, 'static-only-boundary-missing');
forbid(controller, /(?:fetch|WebSocket|EventSource)\s*\(/, 'controller-must-not-add-network-transport');
forbid(controller, /(?:localStorage|sessionStorage|indexedDB)\s*[.(]/i, 'controller-must-not-persist-browser-state');

need(runtime, /createEonCityStaticCollisionVolumes\(\{ landmarks: CITY_PLAY_LANDMARKS \}\)/, 'runtime-static-collision-volumes-missing');
need(runtime, /resolveEonCityThirdPersonPosition\(\{/, 'runtime-movement-resolver-missing');
need(runtime, /onPointerLookToggle: togglePointerLook/, 'keyboard-pointer-toggle-missing');
// The UI selector belongs in the station, not in the Babylon renderer.
if (/data-eon-play-toggle-pointer-look/.test(runtime)) errors.push('runtime-must-not-mix-station-dom-selector');
need(runtime, /pointerLook\.release\('pose-restored'\)/, 'pose-return-must-release-pointer-lock');
need(runtime, /pointerLook\.destroy\(\)/, 'runtime-must-destroy-pointer-lock-listeners');
need(runtime, /getThirdPersonSummary/, 'runtime-third-person-summary-missing');
need(runtime, /staticCollisionOnly: true/, 'runtime-static-collision-truth-missing');
need(runtime, /camera\.detachControl\(canvas\)/, 'runtime-must-prevent-double-pointer-camera-input');
need(runtime, /camera\.attachControl\(canvas, true\)/, 'runtime-must-restore-standard-camera-input');

need(pose, /controller\.pointerLookEnabled/, 'pose-controller-intent-missing');
need(pose, /fresh (user action|gesture)/, 'pose-browser-gesture-truth-missing');
need(station, /data-eon-play-toggle-pointer-look/, 'station-visible-pointer-control-missing');
need(station, /onPointerLookChange/, 'station-pointer-state-binding-missing');
need(station, /<kbd>L<\/kbd> requests Pointer look/, 'station-keyboard-pointer-guidance-missing');
need(unit, /W555B resolves deterministic static collision volumes/, 'w555b-collision-unit-missing');
need(unit, /W555B pointer look only requests lock after a caller invokes it/, 'w555b-pointer-unit-missing');
need(unit, /W555B keeps third-person intent in an exact pose return/, 'w555b-pose-unit-missing');

const CHECK_COUNT = 30;
const report = Object.freeze({ wave: 'W555B', ok: errors.length === 0, checks: CHECK_COUNT - errors.length, required: required.length, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w555b-third-person-controller-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
