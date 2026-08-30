#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
  ['living-nexus', validateEonCityW749LivingNexusContract()],
  ['interaction-registry', validateEonCityW748InteractionRegistry()],
  ['workspace-presenter', validateEonCityW748WorkspacePresenterContract()],
  ['w747-spatial-foundation', validateEonCityW747SpatialFoundation()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W749 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w749/eon-city-w749-living-nexus.js',
  'assets/js/city/w731/eon-city-w731-command-hub-contract.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/work-surface/adapters/eon-nexus-panel.js',
  'assets/js/work-surface/eon-work-surface-registry.js',
  'assets/js/work-surface/eon-work-surface-host.js',
  'scripts/build-production.mjs',
  'sw.js',
  'public/sw.js',
  'tests/unit/w749-central-living-nexus.test.mjs',
  'scripts/w749-central-living-nexus-gate.mjs'
];
for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const tests = spawnSync(process.execPath, ['--test',
  'tests/unit/w725-shared-work-surface.test.mjs',
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w733-functional-stations.test.mjs',
  'tests/unit/w736a-frontend-command-convergence.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w747-spatial-foundation.test.mjs',
  'tests/unit/w748-city-os-interaction-workspace.test.mjs',
  'tests/unit/w749-central-living-nexus.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W749 LOCAL SOURCE PASS — HEADED DESKTOP/MOBILE NEXUS VISUAL EVIDENCE STILL REQUIRED');
