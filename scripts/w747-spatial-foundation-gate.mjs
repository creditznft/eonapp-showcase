#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  validateEonCityW747SpatialFoundation
} from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';
import { validateEonCityW731CommandHubContract } from '../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { validateEonCityW731LaunchAssetManifest } from '../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const validations = [
  ['spatial-foundation', validateEonCityW747SpatialFoundation()],
  ['command-hub-contract', validateEonCityW731CommandHubContract()],
  ['launch-asset-manifest', validateEonCityW731LaunchAssetManifest()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W747 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'sw.js',
  'public/sw.js',
  'assets/js/city/w747/eon-city-w747-spatial-foundation.js',
  'assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js',
  'assets/js/city/w731/eon-city-w731-local-assets.js',
  'tests/unit/w747-spatial-foundation.test.mjs'
];
for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const tests = [
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w736a-city-first-frame-repair.test.mjs',
  'tests/unit/w741-city-menu-label-authority.test.mjs',
  'tests/unit/w742-city-sharing-membership-motion.test.mjs',
  'tests/unit/w743-city-performance-cache-hardening.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w747-spatial-foundation.test.mjs'
];
const sourceTests = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
if (sourceTests.status !== 0) process.exit(sourceTests.status || 1);

for (const [command, args] of [
  [process.execPath, ['scripts/w745-launch-asset-binary-integrity.mjs']],
  ['git', ['diff', '--check']]
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('W747 LOCAL SOURCE PASS — HEADED BROWSER SCREENSHOTS/VIDEO REQUIRED BEFORE W747 CAN BE MARKED COMPLETE');
