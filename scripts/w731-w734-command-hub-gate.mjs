#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const files = [
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w732-command-atrium.test.mjs',
  'tests/unit/w733-functional-stations.test.mjs',
  'tests/unit/w734-city-characters-polish.test.mjs',
  'tests/unit/w724-quick-command-surface.test.mjs'
];
const checks = [
  'assets/js/city/eon-city-play-core.js',
  'assets/js/city/eon-city-access-station.js',
  'assets/js/city/eon-city-entry-experience.js',
  'assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js',
  'assets/js/city/w731/eon-city-w731-local-assets.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'
];
for (const file of checks) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(result.status || 0);
