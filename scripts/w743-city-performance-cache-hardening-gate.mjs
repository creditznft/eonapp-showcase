#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const syntaxFiles = [
  'sw.js',
  'public/sw.js',
  'assets/js/city/eon-city-access-station.js',
  'assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js',
  'assets/js/city/w731/eon-city-w731-local-assets.js'
];

const tests = [
  'tests/unit/w635-performance-cache-update-safety.test.mjs',
  'tests/unit/w650-eoncity-cache-update-safety.test.mjs',
  'tests/unit/w719-13-city-control-authority.test.mjs',
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w732-command-atrium.test.mjs',
  'tests/unit/w733-functional-stations.test.mjs',
  'tests/unit/w734-city-characters-polish.test.mjs',
  'tests/unit/w736a-city-first-frame-repair.test.mjs',
  'tests/unit/w741-city-menu-label-authority.test.mjs',
  'tests/unit/w742-city-sharing-membership-motion.test.mjs',
  'tests/unit/w743-city-performance-cache-hardening.test.mjs'
];

for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const test = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
if (test.status !== 0) process.exit(test.status || 1);

console.log('W743 SOURCE PASS — PRODUCTION-STYLE BROWSER MATRIX STILL REQUIRED');
