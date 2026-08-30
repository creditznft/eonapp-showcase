#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createEonCityW758EvidenceTemplate, evaluateEonCityW758MachineScore, validateEonCityW758RedTeamPlan } from '../assets/js/city/w758/eon-city-w758-hostile-red-team-scoring.js';
import { validateEonCityW757ReliabilityPlan } from '../assets/js/city/w757/eon-city-w757-performance-reliability.js';
import { validateEonCityW756ExperiencePlan } from '../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js';
import { validateEonCityW755EnvironmentPlan } from '../assets/js/city/w755/eon-city-w755-environment-art-audio.js';
import { validateEonCityW754Contract } from '../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js';
import { validateEonCityW752MissionsProgression } from '../assets/js/city/w752/eon-city-w752-missions-progression.js';
import { validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { validateEonCityW750CommandCentreContract } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

for (const [name, result] of [
  ['hostile-red-team-plan', validateEonCityW758RedTeamPlan()],
  ['performance-reliability', validateEonCityW757ReliabilityPlan()],
  ['onboarding-navigation-accessibility', validateEonCityW756ExperiencePlan()],
  ['environment-art-audio', validateEonCityW755EnvironmentPlan()],
  ['cast-eonbot-npc-transit', validateEonCityW754Contract()],
  ['missions-progression', validateEonCityW752MissionsProgression()],
  ['productive-stations', validateEonCityW751ProductiveStations()],
  ['command-centre', validateEonCityW750CommandCentreContract()],
  ['living-nexus', validateEonCityW749LivingNexusContract()],
  ['interaction-registry', validateEonCityW748InteractionRegistry()],
  ['workspace-presenter', validateEonCityW748WorkspacePresenterContract()],
  ['spatial-foundation', validateEonCityW747SpatialFoundation()]
]) {
  if (!result?.ok) { console.error(`W758 ${name} failed`, result); process.exit(1); }
}
const blocked = evaluateEonCityW758MachineScore(createEonCityW758EvidenceTemplate());
if (blocked.status !== 'W758 MACHINE BLOCKED — EVIDENCE INCOMPLETE' || blocked.pass !== false || blocked.productionAuthorized !== false) {
  console.error('W758 source-only boundary failed', blocked);
  process.exit(1);
}

for (const file of [
  'assets/js/city/w758/eon-city-w758-hostile-red-team-scoring.js',
  'assets/js/city/w757/eon-city-w757-performance-reliability.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'assets/js/city/w731/eon-city-w731-local-assets.js',
  'assets/js/city/w759/eon-city-w759-attachment-presentation.js',
  'assets/js/city/w731/eon-city-w731-launch-asset-manifest.js',
  'sw.js', 'public/sw.js',
  'tests/unit/w758-hostile-red-team-machine-score.test.mjs',
  'scripts/w758-hostile-red-team-machine-score-gate.mjs'
]) {
  const check = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (check.status !== 0) process.exit(check.status || 1);
}

const tests = spawnSync(process.execPath, ['--test',
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
  'tests/unit/w756-onboarding-navigation-accessibility.test.mjs',
  'tests/unit/w757-performance-loading-memory-disposal-cache.test.mjs',
  'tests/unit/w758-hostile-red-team-machine-score.test.mjs',
  'tests/unit/w759r1-city-functional-hotfix.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);
const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W758 SOURCE/SCORING AUTHORITY PASS — MACHINE STATUS REMAINS BLOCKED UNTIL IMMUTABLE PREVIEW AND REAL BROWSER/DEVICE/API EVIDENCE ARE ATTACHED');
