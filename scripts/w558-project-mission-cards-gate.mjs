#!/usr/bin/env node
/** W558 source gate — approved City mission cards remain private, reviewed and local. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-project-district-manifest.js',
  'assets/js/city/eon-city-project-district-workspace.js',
  'assets/js/city/eon-city-play-babylon.js',
  'tests/unit/w558-project-mission-cards.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const manifest = files['assets/js/city/eon-city-project-district-manifest.js'];
const workspace = files['assets/js/city/eon-city-project-district-workspace.js'];
const babylon = files['assets/js/city/eon-city-play-babylon.js'];
const unit = files['tests/unit/w558-project-mission-cards.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(manifest, /createEonCityApprovedMissionCard/, 'mission-card-factory-missing');
need(manifest, /explicitCitySafeCardApproval/, 'mission-card-approval-boundary-missing');
need(manifest, /city-safe-card-approval-required/, 'mission-card-approval-error-missing');
need(manifest, /addApprovedMissionCard/, 'mission-card-add-api-missing');
need(manifest, /removeApprovedMissionCard/, 'mission-card-remove-api-missing');
need(manifest, /getLocalMissionCardState/, 'mission-card-local-console-api-missing');
need(manifest, /projectReferenceExposed: false/, 'mission-card-project-reference-boundary-missing');
need(manifest, /rawTaskContentExposed: false/, 'mission-card-raw-task-boundary-missing');
need(manifest, /city-mission-card-limit-reached/, 'mission-card-limit-missing');
forbid(manifest, /(?:fetch|WebSocket|EventSource)\s*\(/i, 'mission-manifest-must-not-network');

need(workspace, /missionCardConsole/, 'mission-card-console-missing');
need(workspace, /data-eon-play-project-mission-card-form/, 'mission-card-form-missing');
need(workspace, /citySafeMissionApproved/, 'mission-card-review-checkbox-missing');
need(workspace, /data-eon-play-project-mission-card-remove-confirm/, 'mission-card-remove-confirm-ui-missing');
need(workspace, /raw task, prompt, file name or private detail/i, 'mission-card-private-copy-missing');
need(workspace, /registry\.addApprovedMissionCard/, 'mission-card-registry-add-missing');
need(workspace, /registry\.removeApprovedMissionCard/, 'mission-card-registry-remove-missing');
forbid(workspace, /(?:fetch|WebSocket|EventSource)\s*\(/i, 'mission-workspace-must-not-network');

need(babylon, /normalizePrivateProjectMissionCards/, 'mission-card-babylon-normalizer-missing');
need(babylon, /plan\.taskCards\.forEach/, 'mission-card-babylon-render-loop-missing');
need(babylon, /citySafeLabelOnly: true/, 'mission-card-babylon-safe-label-boundary-missing');
need(babylon, /rawTaskContentExposed: false/, 'mission-card-babylon-raw-task-boundary-missing');
need(babylon, /projectReferenceExposed: false/, 'mission-card-babylon-project-boundary-missing');

need(unit, /W558 requires an explicit action/, 'w558-approval-unit-missing');
need(unit, /W558 projects only reviewed labels/, 'w558-projection-unit-missing');
need(unit, /W558 rejects sensitive labels/, 'w558-sensitive-label-unit-missing');
need(runner, /w558-project-mission-cards\.test\.mjs/, 'w558-current-suite-registration-missing');

const CHECK_COUNT = 30;
const report = Object.freeze({ wave: 'W558', ok: errors.length === 0, checks: CHECK_COUNT - errors.length, required: required.length, errors: Object.freeze(errors) });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w558-project-mission-cards-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
