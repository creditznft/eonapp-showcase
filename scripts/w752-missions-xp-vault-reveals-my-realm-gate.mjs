#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { validateEonCityW752MissionsProgression } from '../assets/js/city/w752/eon-city-w752-missions-progression.js';
import { validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { validateEonCityW750CommandCentreContract } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
  ['missions-progression', validateEonCityW752MissionsProgression()],
  ['productive-stations', validateEonCityW751ProductiveStations()],
  ['command-centre', validateEonCityW750CommandCentreContract()],
  ['living-nexus', validateEonCityW749LivingNexusContract()],
  ['interaction-registry', validateEonCityW748InteractionRegistry()],
  ['workspace-presenter', validateEonCityW748WorkspacePresenterContract()],
  ['spatial-foundation', validateEonCityW747SpatialFoundation()]
];
for (const [name, result] of validations) {
  if (!result?.ok) {
    console.error(`W752 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w752/eon-city-w752-missions-progression.js',
  'assets/js/work-surface/eon-city-progression-panel.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/work-surface/eon-work-surface-host.js',
  'scripts/build-production.mjs',
  'sw.js',
  'public/sw.js',
  'tests/unit/w752-missions-xp-vault-reveals-my-realm.test.mjs',
  'scripts/w752-missions-xp-vault-reveals-my-realm-gate.mjs'
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
  'tests/unit/w750-command-centre-live-walls.test.mjs',
  'tests/unit/w751-productive-stations-real-work-loops.test.mjs',
  'tests/unit/w752-missions-xp-vault-reveals-my-realm.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W752 LOCAL SOURCE PASS — HEADED DESKTOP/MOBILE MISSION, REVEAL AND MY REALM EVIDENCE STILL REQUIRED');
