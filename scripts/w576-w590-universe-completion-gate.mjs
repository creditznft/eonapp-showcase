#!/usr/bin/env node
/** W576–W590 source gate: local City completion without false live claims. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W576_W590_UNIVERSE_COMPLETION_CONTRACT,
  validateW576W590UniverseCompletionContract
} from '../config/w576-w590-universe-completion-contract.mjs';
import {
  getEonCityUniverseCompletionPlan,
  getEonCityW576W590Truth,
  validateEonCityUniverseCompletionPlan
} from '../assets/js/city/eon-city-universe-completion.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

for (const relative of W576_W590_UNIVERSE_COMPLETION_CONTRACT.requiredFiles) check(exists(relative), `missing-required-file:${relative}`);
for (const error of validateW576W590UniverseCompletionContract()) errors.push(`contract:${error}`);
for (const error of validateEonCityUniverseCompletionPlan(getEonCityUniverseCompletionPlan())) errors.push(`plan:${error}`);

const moduleSource = read('assets/js/city/eon-city-universe-completion.js');
const stationSource = read('assets/js/eon-city-play-station.js');
const board = read('docs/W576_W590_EON_UNIVERSE_SOURCE_COMPLETION_BOARD_2026-07-03.md');
const packageJson = JSON.parse(read('package.json'));

for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage', 'getUserMedia', 'AudioContext', 'SpeechRecognition', 'speechSynthesis', 'PaymentRequest', 'navigator.credentials', 'accounts.google.com']) {
  check(!moduleSource.includes(forbidden), `module-forbidden-primitive:${forbidden}`);
}
for (const id of W576_W590_UNIVERSE_COMPLETION_CONTRACT.waves.map((wave) => wave.id)) check(moduleSource.includes(id), `module-missing-wave:${id}`);
check(stationSource.includes("bindEonCityUniverseCompletionPanel"), 'station-must-bind-universe-panel');
check(stationSource.includes('data-eon-play-open-universe'), 'station-must-expose-universe-control');
check(stationSource.includes('renderEonCityUniverseCompletionPanel'), 'station-must-render-universe-panel');
check(board.includes('No public City access bypass') && board.includes('External evidence remains mandatory') && board.includes('W576') && board.includes('W590'), 'board-must-retain-boundaries-and-wave-range');
check(packageJson.scripts?.['qa:w576-w590-universe-completion'], 'package-must-register-completion-gate');
check(packageJson.scripts?.['verify:w555a-w590-source'] === 'node scripts/verify-w555a-w590-source.mjs', 'package-must-register-cumulative-verifier');
check(exists('scripts/verify-w555a-w590-source.mjs'), 'missing-canonical-source-verifier');

const truth = getEonCityW576W590Truth();
for (const [key, expected] of Object.entries({
  sourceImplementationComplete: true,
  publicCityAccessBypass: false,
  oauthOrCaptchaAutomation: false,
  credentialCollection: false,
  providerCallFromCity: false,
  microphoneOrAudioActivation: false,
  paymentOrEntitlementActivation: false,
  rewardOrChanceMechanic: false,
  publicMultiplayerClaim: false,
  backgroundNetworkOrTelemetry: false,
  automaticCertification: false,
  automaticProductionApproval: false,
  previewEvidenceProven: false,
  productionEvidenceProven: false,
  deviceEvidenceProven: false,
  oauthEvidenceProven: false,
  ownerApprovalProven: false
})) check(truth[key] === expected, `truth-invalid:${key}`);

const report = Object.freeze({ wave: 'W576-W590', ok: errors.length === 0, checks: 53, sourceOnly: true, errors });
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
