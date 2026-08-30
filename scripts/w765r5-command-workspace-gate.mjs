#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { EON_CITY_W731_STATIONS } from '../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { validateEonCityW731LaunchAssetManifest } from '../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';
import { validateEonCityW750CommandCentreContract, validateEonCityW750WallPresentation } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW765R5StationMonitorContract } from '../assets/js/city/w765/eon-city-w765r5-station-monitor.js';
import { validateEonCityW754Contract } from '../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js';
import { validateEonCityW695CalibrationRegistry } from '../assets/js/city/w695/eon-city-w695-character-motion-truth.js';

const commandStation = EON_CITY_W731_STATIONS.find((entry) => entry.id === 'command-console');
const validations = [
  ['station-monitors', validateEonCityW765R5StationMonitorContract()],
  ['command-centre', validateEonCityW750CommandCentreContract()],
  ['command-wall-presentation', validateEonCityW750WallPresentation({ station: commandStation })],
  ['authored-cast-npc-transit', validateEonCityW754Contract()],
  ['character-motion', validateEonCityW695CalibrationRegistry()],
  ['launch-assets', validateEonCityW731LaunchAssetManifest()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W765R5 ${name} failed`, result);
    process.exit(1);
  }
}

const html = fs.readFileSync('eoncity.html', 'utf8');
const css = fs.readFileSync('assets/css/eon-city-play.css', 'utf8');
const runtime = fs.readFileSync('assets/js/city/w731/eon-city-w731-command-hub-runtime.js', 'utf8');
const serviceWorker = fs.readFileSync('sw.js', 'utf8');
const publicServiceWorker = fs.readFileSync('public/sw.js', 'utf8');
const sourceChecks = [
  ['versioned-city-css', /eon-city-play\.css\?v=w765r5/.test(html)],
  ['dark-glass-label-css', /button\[data-eon-city-label-id\][\s\S]*appearance:none!important[\s\S]*linear-gradient\(145deg,rgba\(4,18,28/.test(css)],
  ['inline-label-failsafe', /button\.style\.setProperty\('appearance', 'none', 'important'\)/.test(runtime)],
  ['nine-individual-monitors', /if \(station\.id === 'command-console'\) continue/.test(runtime)],
  ['render-cadence-update', /monitor\.update\?\.\(frameAt, camera\.position\)/.test(runtime)],
  ['monitor-disposal', /monitor\.dispose\?\.\(\)/.test(runtime)],
  ['service-worker-update-waits-for-explicit-choice', /requiresUserReloadChoice:\s*true/.test(serviceWorker) && !/addEventListener\('install'[\s\S]*?skipWaiting\(\)[\s\S]*?addEventListener\('activate'/.test(serviceWorker)],
  ['service-worker-release-scoped-activation', /EONAPP_APPLY_UPDATE[\s\S]*releaseId === RELEASE_ID[\s\S]*explicitUserAction === true[\s\S]*skipWaiting\(\)/.test(serviceWorker)],
  ['service-worker-public-mirror', serviceWorker === publicServiceWorker]
];
for (const [name, pass] of sourceChecks) {
  if (!pass) {
    console.error(`W765R5 source check failed: ${name}`);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w765/eon-city-w765r5-station-monitor.js',
  'assets/js/city/w750/eon-city-w750-command-centre.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'tests/unit/w765r5-command-workspace.test.mjs',
  'scripts/w765r5-command-workspace-gate.mjs'
];
for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const tests = spawnSync(process.execPath, ['--test',
  'tests/unit/w662-camera-relative-movement.test.mjs',
  'tests/unit/w695-character-motion-truth.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w750-command-centre-live-walls.test.mjs',
  'tests/unit/w754-cast-eonbot-npc-schedules-transit.test.mjs',
  'tests/unit/w765r4-live-city-repair.test.mjs',
  'tests/unit/w765r5-command-workspace.test.mjs',
  'tests/unit/w275-pwa-asset-policy.test.mjs',
  'tests/unit/w476-service-worker-contract.test.mjs',
  'tests/unit/w635-performance-cache-update-safety.test.mjs',
  'tests/unit/w757-performance-loading-memory-disposal-cache.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['-c', 'core.whitespace=cr-at-eol', 'diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W765R5 LOCAL SOURCE PASS — HEADED OWNER VISUAL ACCEPTANCE AND PREVIEW DEPLOYMENT STILL REQUIRED');
