#!/usr/bin/env node
/** W561 source gate — EONBOT companion identity, captions, skins and behavior contract. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const required = Object.freeze([
  'assets/js/contracts/city/eon-city-eonbot-companion.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'tests/unit/w561-eonbot-companion.test.mjs',
  'scripts/run-current-unit-suite.mjs'
]);
const errors = [];
for (const relative of required) if (!exists(relative)) errors.push(`missing:${relative}`);
const files = Object.fromEntries(required.map((relative) => [relative, exists(relative) ? read(relative) : '']));
const need = (text, expression, code) => { if (!expression.test(text)) errors.push(code); };
const forbid = (text, expression, code) => { if (expression.test(text)) errors.push(code); };

const companion = files['assets/js/contracts/city/eon-city-eonbot-companion.js'];
const babylon = files['assets/js/city/eon-city-play-babylon.js'];
const station = files['assets/js/eon-city-play-station.js'];
const unit = files['tests/unit/w561-eonbot-companion.test.mjs'];
const runner = files['scripts/run-current-unit-suite.mjs'];

need(companion, /EON_CITY_EONBOT_COMPANION_SCHEMA\s*=\s*'eon\.city\.eonbot-companion\.w561\.v1'/, 'companion-schema-missing');
need(companion, /createEonCityEonbotCompanionPlan/, 'companion-plan-factory-missing');
need(companion, /getEonCityEonbotCompanionSkins/, 'companion-skins-missing');
need(companion, /visualOnly:\s*true/, 'visual-only-skins-missing');
need(companion, /commercialEntitlementRequired:\s*false/, 'commercial-entitlement-firewall-missing');
need(companion, /subscriptionBenefitClaimed:\s*false/, 'subscription-benefit-firewall-missing');
need(companion, /captionsFirst:\s*true/, 'captions-first-contract-missing');
need(companion, /voiceStarted:\s*false/, 'no-voice-start-contract-missing');
need(companion, /microphoneRequested:\s*false/, 'no-microphone-contract-missing');
need(companion, /autonomousNavigation:\s*false/, 'no-autonomous-navigation-contract-missing');
need(companion, /autonomousTask:\s*false/, 'no-autonomous-task-contract-missing');
need(companion, /backgroundAgent:\s*false/, 'no-background-agent-contract-missing');
need(companion, /readsPrivateData:\s*false/, 'private-data-firewall-missing');
need(companion, /providerRequestCreated:\s*false/, 'provider-firewall-missing');
need(companion, /opensRoute:\s*false/, 'route-firewall-missing');
need(companion, /browserStorageWritten:\s*false/, 'storage-firewall-missing');
need(companion, /networkRequestCreated:\s*false/, 'network-firewall-missing');
forbid(companion, /(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|EventSource)\s*[.(]/i, 'companion-must-not-store-or-network');
need(babylon, /createEonCityEonbotCompanionPlan/, 'babylon-plan-import-missing');
need(babylon, /function addEonbot\(scene, operator, vectorArt, companionPlan/, 'babylon-companion-plan-wiring-missing');
need(babylon, /eonbotCompanion/, 'babylon-runtime-summary-missing');
need(babylon, /subscriptionEntitlementClaimed:\s*false/, 'babylon-commercial-firewall-missing');
need(station, /bindEonbotCompanionPanel/, 'station-companion-panel-binder-missing');
need(station, /data-eon-play-open-companion/, 'station-companion-open-control-missing');
need(station, /data-eon-play-companion-panel/, 'station-companion-panel-missing');
need(station, /Appearance choices are local visual preferences/, 'station-visual-only-copy-missing');
need(station, /never bought, unlocked, transferred, or treated as an account entitlement/, 'station-no-entitlement-copy-missing');
need(unit, /W561 defines original visual-only EONBOT skins/, 'w561-skin-unit-missing');
need(unit, /W561 Lite or reduced-motion companion stays local/, 'w561-behavior-unit-missing');
need(runner, /w561-eonbot-companion\.test\.mjs/, 'w561-current-suite-registration-missing');

const CHECK_COUNT = 30;
export function inspectW561EonbotCompanion() {
  return Object.freeze({ wave: 'W561', status: errors.length ? 'fail' : 'pass', checkCount: CHECK_COUNT - errors.length, requiredCount: required.length, errors: Object.freeze([...errors]) });
}
const report = inspectW561EonbotCompanion();
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w561-eonbot-companion-gate.json'), `${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'pass') {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
