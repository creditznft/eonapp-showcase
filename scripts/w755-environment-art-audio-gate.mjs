import { spawnSync } from 'node:child_process';

const syntaxFiles = [
  'assets/js/city/w755/eon-city-w755-environment-art-audio.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'tests/unit/w755-environment-art-audio.test.mjs',
  'scripts/w755-environment-art-audio-gate.mjs'
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
  'tests/unit/w755-environment-art-audio.test.mjs'
];
const tests = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);
const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W755 LOCAL SOURCE PASS — FINAL HEADED SKYLINE, WEATHER, MATERIAL, LIGHTING AND AUDIO EVIDENCE STILL REQUIRED');
