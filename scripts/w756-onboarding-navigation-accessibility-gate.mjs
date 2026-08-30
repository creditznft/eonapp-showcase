#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { validateEonCityW756ExperiencePlan } from '../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js';
import { validateEonCityW755EnvironmentPlan } from '../assets/js/city/w755/eon-city-w755-environment-art-audio.js';
import { validateEonCityW754Contract } from '../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js';
import { validateEonShareW753ReviewedHandoffReceipt } from '../assets/js/share/eon-share-w753-reviewed-handoff-receipt.js';
import { validateEonCityW752MissionsProgression } from '../assets/js/city/w752/eon-city-w752-missions-progression.js';
import { validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { validateEonCityW750CommandCentreContract } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
  ['onboarding-navigation-accessibility', validateEonCityW756ExperiencePlan()],
  ['environment-art-audio', validateEonCityW755EnvironmentPlan()],
  ['cast-eonbot-npc-transit', validateEonCityW754Contract()],
  ['reviewed-handoff-receipt', validateEonShareW753ReviewedHandoffReceipt()],
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
    console.error(`W756 ${name} failed`, result);
    process.exit(1);
  }
}

const syntaxFiles = [
  'assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js',
  'assets/js/city/w755/eon-city-w755-environment-art-audio.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'sw.js',
  'public/sw.js',
  'tests/unit/w756-onboarding-navigation-accessibility.test.mjs',
  'scripts/w756-onboarding-navigation-accessibility-gate.mjs'
];
for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const testFiles = [
  'tests/unit/w623h-minimal-referral-ledger.test.mjs',
  'tests/unit/w629a-signed-referral-attribution.test.mjs',
  'tests/unit/w629f-referral-key-ux.test.mjs',
  'tests/unit/w724-quick-command-surface.test.mjs',
  'tests/unit/w725-shared-work-surface.test.mjs',
  'tests/unit/w728-share-capture-plans.test.mjs',
  'tests/unit/w731-city-runtime-consolidation.test.mjs',
  'tests/unit/w733-functional-stations.test.mjs',
  'tests/unit/w736a-frontend-command-convergence.test.mjs',
  'tests/unit/w742-city-sharing-membership-motion.test.mjs',
  'tests/unit/w743-city-performance-cache-hardening.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w747-spatial-foundation.test.mjs',
  'tests/unit/w748-city-os-interaction-workspace.test.mjs',
  'tests/unit/w749-central-living-nexus.test.mjs',
  'tests/unit/w750-command-centre-live-walls.test.mjs',
  'tests/unit/w751-productive-stations-real-work-loops.test.mjs',
  'tests/unit/w752-missions-xp-vault-reveals-my-realm.test.mjs',
  'tests/unit/w753-share-center-creator-capture-referral-truth.test.mjs',
  'tests/unit/w754-cast-eonbot-npc-schedules-transit.test.mjs',
  'tests/unit/w755-environment-art-audio.test.mjs',
  'tests/unit/w756-onboarding-navigation-accessibility.test.mjs'
];
const tests = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);
const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W756 LOCAL SOURCE PASS — SCRIPTED NOVICE, KEYBOARD, TOUCH, SCREEN-READER AND MOBILE BROWSER EVIDENCE STILL REQUIRED');
