#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const syntaxFiles = [
  'sw.js',
  'public/sw.js',
  'assets/js/city/eon-city-access-station.js',
  'assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js',
  'assets/js/city/w731/eon-city-w731-local-assets.js',
  'assets/js/city/w731/eon-city-w744-station-completion-contract.js',
  'assets/js/city/w731/eon-city-w745-hero-companion-polish.js',
  'scripts/w745-launch-asset-binary-integrity.mjs',
  'assets/js/work-surface/eon-work-surface-registry.js',
  'assets/js/work-surface/adapters/eon-productivity-panel.js',
  'tests/unit/w745-final-city-polish-red-team.test.mjs'
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
  'tests/unit/w743-city-performance-cache-hardening.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs'
];

for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const sourceTests = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
if (sourceTests.status !== 0) process.exit(sourceTests.status || 1);

for (const command of [
  [process.execPath, ['scripts/w745-launch-asset-binary-integrity.mjs']],
  ['git', ['diff', '--check']],
  [process.execPath, ['scripts/site-audit.mjs']],
  [process.execPath, ['scripts/launch-page-invariants.mjs']],
  [process.execPath, ['scripts/launch-identity-surface-gate.mjs']],
  [process.execPath, ['scripts/app-surface-quality-gate.mjs']]
]) {
  const result = spawnSync(command[0], command[1], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('W745 SOURCE PASS — CODEX BUILD, HEADED BROWSER, PREVIEW AND PRODUCTION GATES STILL REQUIRED');
