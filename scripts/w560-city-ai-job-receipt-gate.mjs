#!/usr/bin/env node
/** W560 source gate — current, redacted AI job receipt bridge for City. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/city/eon-city-ai-job-receipt.js',
  'assets/js/chat/eonbot-job-fabric.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w560-city-ai-job-receipt.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const bridge = files['assets/js/city/eon-city-ai-job-receipt.js'];
const station = files['assets/js/eon-city-play-station.js'];
const unit = files['tests/unit/w560-city-ai-job-receipt.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(bridge, /EON_CITY_AI_JOB_RECEIPT_SCHEMA\s*=\s*'eon\.city\.ai-job-receipt\.w560\.v1'/, 'receipt-schema-missing');
need(bridge, /subscribeEonbotJobFabricReceipts/, 'current-receipt-subscription-missing');
need(bridge, /projectEonCityAiJobReceipt/, 'redacted-projection-missing');
need(bridge, /currentReceiptOnly:\s*true/, 'current-only-boundary-missing');
need(bridge, /persistedHistoryScanned:\s*false/, 'no-history-boundary-missing');
need(bridge, /browserStorageWritten:\s*false/, 'no-storage-boundary-missing');
need(bridge, /routeAvailable:\s*false/, 'no-route-boundary-missing');
need(bridge, /jobReferenceVisible:\s*false/, 'job-reference-boundary-missing');
need(bridge, /projectReferenceVisible:\s*false/, 'project-reference-boundary-missing');
need(bridge, /rawPromptVisible:\s*false/, 'prompt-boundary-missing');
need(bridge, /rawDraftVisible:\s*false/, 'draft-boundary-missing');
need(bridge, /rawOutputVisible:\s*false/, 'output-boundary-missing');
need(bridge, /providerVisible:\s*false/, 'provider-boundary-missing');
need(bridge, /credentialVisible:\s*false/, 'credential-boundary-missing');
need(bridge, /backgroundWorkStarted:\s*false/, 'background-boundary-missing');
need(bridge, /fabricatedCompletion:\s*false/, 'fabricated-completion-boundary-missing');
need(bridge, /currentReceipt = null/, 'ephemeral-teardown-missing');
forbid(bridge, /(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|EventSource)\s*[.(]/i, 'receipt-bridge-must-not-store-or-network');
forbid(bridge, /receipt\?\.(?:safeLabel|intentText|jobId|projectId|providerId)|receipt\.(?:safeLabel|intentText|jobId|projectId|providerId)|\b(?:safeLabel|intentText|jobId|projectId|providerId)\s*:/i, 'receipt-bridge-private-source-forbidden');
need(station, /createEonCityAiJobReceiptBridge/, 'station-receipt-bridge-import-missing');
need(station, /data-eon-play-ai-receipt/, 'station-receipt-panel-missing');
need(station, /City does not replay old work history as a fresh event/, 'station-no-replay-copy-missing');
need(station, /W560 never opens a route/, 'station-user-route-boundary-missing');
need(unit, /W560 projects only a current verified local receipt/, 'w560-redaction-unit-missing');
need(unit, /never persists or replays history/, 'w560-ephemeral-unit-missing');
need(runner, /w560-city-ai-job-receipt\.test\.mjs/, 'w560-current-suite-registration-missing');

const CHECK_COUNT = 27;
export function inspectW560CityAiJobReceipt() {
  return Object.freeze({ wave: 'W560', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW560CityAiJobReceipt();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w560-city-ai-job-receipt-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
