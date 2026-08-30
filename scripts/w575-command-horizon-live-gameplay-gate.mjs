#!/usr/bin/env node
/** W575 — source gate for Command Horizon live-gameplay evidence readiness. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT,
  validateW575CommandHorizonLiveGameplayContract
} from '../config/w575-command-horizon-live-gameplay-contract.mjs';
import {
  getEonCityCommandHorizonProofManifest,
  validateEonCityCommandHorizonProofManifest,
  getEonCityCommandHorizonProofTruth
} from '../assets/js/city/eon-city-command-horizon-proof-manifest.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

for (const relative of W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredFiles) check(exists(relative), `missing-required-file:${relative}`);
for (const error of validateW575CommandHorizonLiveGameplayContract()) errors.push(`contract:${error}`);
for (const lane of ['public-entry', 'authenticated-preview']) {
  for (const error of validateEonCityCommandHorizonProofManifest(getEonCityCommandHorizonProofManifest({ quality: 'balanced', accessLane: lane }))) errors.push(`manifest:${lane}:${error}`);
}

const manifestSource = read('assets/js/city/eon-city-command-horizon-proof-manifest.js');
const stationSource = read('assets/js/eon-city-play-station.js');
const e2eSource = read('e2e/w575-command-horizon-live-gameplay.spec.js');
const board = read('docs/W575_COMMAND_HORIZON_VERTICAL_SLICE_AND_LIVE_GAMEPLAY_PROOF_BOARD_2026-07-03.md');
const runbook = read('docs/CODEX_W575_COMMAND_HORIZON_DEEP_GAMEPLAY_RUNBOOK_2026-07-03.md');
const packageJson = JSON.parse(read('package.json'));

for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage', 'getUserMedia', 'AudioContext', 'SpeechRecognition', 'speechSynthesis', 'Date(', 'navigator.']) {
  check(!manifestSource.includes(forbidden), `manifest-forbidden-primitive:${forbidden}`);
}
for (const forbidden of ['password=', 'captchaBypass', 'identityBypass', 'page.fill(', 'page.type(', 'google.com/o/oauth', 'accounts.google.com']) {
  check(!e2eSource.includes(forbidden), `e2e-forbidden-auth-automation:${forbidden}`);
}
check(e2eSource.includes("EON_CITY_LIVE_GAMEPLAY_RUN === '1'"), 'e2e-must-be-explicit-opt-in');
check(e2eSource.includes('EON_CITY_LIVE_BASE_URL'), 'e2e-must-require-approved-live-base-url');
check(e2eSource.includes('EON_CITY_AUTH_STORAGE_STATE'), 'e2e-must-use-external-human-created-storage-state');
check(e2eSource.includes("serviceWorkers: 'block'"), 'e2e-must-block-service-workers-for-reproducible-proof');
check(e2eSource.includes('automaticConfirmationUsed = false'), 'e2e-must-record-no-automatic-confirmation');
check(!e2eSource.includes('[data-eon-play-confirm-action]'), 'e2e-must-not-confirm-work-actions');
check(!e2eSource.includes('[data-eon-play-soundscape-enable]'), 'e2e-must-not-enable-audio');
check(board.includes('no public test bypass') && board.includes('CAPTCHA bypass') && board.includes('Google/EONAPP signed-in session'), 'board-must-lock-auth-and-no-bypass-decision');
check(runbook.includes('Do not automate Google username/password entry') && runbook.includes('EON_CITY_AUTH_STORAGE_STATE') && runbook.includes('One continuous gameplay recording'), 'runbook-must-require-human-auth-and-evidence');
check(packageJson.scripts?.['qa:w575-command-horizon-live-gameplay'], 'package-must-register-w575-source-gate');
check(packageJson.scripts?.['verify:w555a-w575-source'], 'package-must-register-w575-cumulative-verifier');

const manifest = getEonCityCommandHorizonProofManifest({ quality: 'balanced', accessLane: 'authenticated-preview' });
for (const group of manifest.controlGroups) {
  for (const selector of group.automationSelectors) check(stationSource.includes(selector.slice(1, -1)), `station-missing-automation-selector:${group.id}:${selector}`);
  for (const selector of group.manualSelectors) check(stationSource.includes(selector.slice(1, -1)), `station-missing-manual-selector:${group.id}:${selector}`);
}
const truth = getEonCityCommandHorizonProofTruth();
for (const [key, expected] of Object.entries({ googleIdentityBypass: false, captchaAutomation: false, credentialsInSource: false, remoteTestBypass: false, automaticCertification: false, automaticLaunchApproval: false, liveGameplayProven: false, deviceProofProven: false, deploymentProven: false })) {
  check(truth[key] === expected, `truth-invalid:${key}`);
}

const report = Object.freeze({ wave: 'W575', ok: errors.length === 0, checks: 42, requiredFiles: W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredFiles.length, errors });
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
