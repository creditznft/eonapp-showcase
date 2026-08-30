#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
  ['interaction-registry', validateEonCityW748InteractionRegistry()],
  ['workspace-presenter', validateEonCityW748WorkspacePresenterContract()],
  ['w747-spatial-foundation', validateEonCityW747SpatialFoundation()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W748 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w748/eon-city-w748-interaction-registry.js',
  'assets/js/city/w748/eon-city-w748-workspace-presenter.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/work-surface/eon-work-surface-registry.js',
  'assets/js/work-surface/eon-work-surface-host.js',
  'tests/unit/w748-city-os-interaction-workspace.test.mjs',
  'scripts/w748-city-os-interaction-workspace-gate.mjs'
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
  'tests/unit/w748-city-os-interaction-workspace.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W748 LOCAL SOURCE PASS — HEADED DESKTOP/MOBILE DOCK AND FOCUS EVIDENCE STILL REQUIRED');
