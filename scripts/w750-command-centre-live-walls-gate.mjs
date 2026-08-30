#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { validateEonCityTruthfulCommandCenterSnapshot } from '../assets/js/city/eon-city-truthful-command-center.js';
import { validateEonCityGenuineAgentTheatreSnapshot } from '../assets/js/city/eon-city-genuine-agent-theatre.js';
import { validateEonCityW750CommandCentreContract } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
  ['command-centre', validateEonCityW750CommandCentreContract()],
  ['living-nexus', validateEonCityW749LivingNexusContract()],
  ['interaction-registry', validateEonCityW748InteractionRegistry()],
  ['workspace-presenter', validateEonCityW748WorkspacePresenterContract()],
  ['w747-spatial-foundation', validateEonCityW747SpatialFoundation()],
  ['truthful-command-center', validateEonCityTruthfulCommandCenterSnapshot()],
  ['genuine-agent-theatre', validateEonCityGenuineAgentTheatreSnapshot()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W750 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w750/eon-city-w750-command-centre.js',
  'assets/js/city/w749/eon-city-w749-living-nexus.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/work-surface/adapters/eon-command-centre-panel.js',
  'assets/js/work-surface/eon-work-surface-registry.js',
  'assets/js/work-surface/eon-work-surface-host.js',
  'scripts/build-production.mjs',
  'sw.js',
  'public/sw.js',
  'tests/unit/w750-command-centre-live-walls.test.mjs',
  'scripts/w750-command-centre-live-walls-gate.mjs'
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
  'tests/unit/w743-city-performance-cache-hardening.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w747-spatial-foundation.test.mjs',
  'tests/unit/w748-city-os-interaction-workspace.test.mjs',
  'tests/unit/w749-central-living-nexus.test.mjs',
  'tests/unit/w750-command-centre-live-walls.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W750 LOCAL SOURCE PASS — HEADED DESKTOP/MOBILE COMMAND CENTRE VISUAL EVIDENCE STILL REQUIRED');
