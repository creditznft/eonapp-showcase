#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { normalizeReferralStatus } from '../assets/js/referrals/eon-referral-server-client.js';
import { validateEonShareW753ReviewedHandoffReceipt } from '../assets/js/share/eon-share-w753-reviewed-handoff-receipt.js';
import { validateEonCityW752MissionsProgression } from '../assets/js/city/w752/eon-city-w752-missions-progression.js';
import { validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { validateEonCityW750CommandCentreContract } from '../assets/js/city/w750/eon-city-w750-command-centre.js';
import { validateEonCityW749LivingNexusContract } from '../assets/js/city/w749/eon-city-w749-living-nexus.js';
import { validateEonCityW748InteractionRegistry } from '../assets/js/city/w748/eon-city-w748-interaction-registry.js';
import { validateEonCityW748WorkspacePresenterContract } from '../assets/js/city/w748/eon-city-w748-workspace-presenter.js';
import { validateEonCityW747SpatialFoundation } from '../assets/js/city/w747/eon-city-w747-spatial-foundation.js';

const validations = [
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
    console.error(`W753 ${name} failed`, result);
    process.exit(1);
  }
}

const triState = [
  normalizeReferralStatus({ ok: true, active: true }, { httpStatus: 200 }),
  normalizeReferralStatus({ ok: true, active: false }, { httpStatus: 200 }),
  normalizeReferralStatus({ ok: false, error: 'referral_status_unavailable' }, { httpStatus: 0 })
].map((entry) => entry.state);
if (triState.join(',') !== 'active,inactive,unavailable') {
  console.error('W753 referral tri-state validation failed', triState);
  process.exit(1);
}

const syntaxFiles = [
  'assets/js/utils/eon-share-sheet.js',
  'assets/js/share/eon-share-w753-reviewed-handoff-receipt.js',
  'assets/js/referrals/eon-referral-server-client.js',
  'assets/js/work-surface/adapters/eon-share-panel.js',
  'assets/js/work-surface/adapters/eon-creator-capture-panel.js',
  'assets/js/city/w751/eon-city-w751-productive-stations.js',
  'assets/js/city/w731/eon-city-w731-command-hub-runtime.js',
  'functions/api/referrals.js',
  'scripts/build-production.mjs',
  'sw.js',
  'public/sw.js',
  'tests/unit/w753-share-center-creator-capture-referral-truth.test.mjs',
  'tests/e2e/w753-share-center-creator-capture-referral-truth.spec.ts',
  'scripts/w753-share-center-creator-capture-referral-truth-gate.mjs'
];
for (const file of syntaxFiles.filter((entry) => !entry.endsWith('.ts'))) {
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
  'tests/unit/w743-city-performance-cache-hardening.test.mjs',
  'tests/unit/w744-command-centre-completion-red-team.test.mjs',
  'tests/unit/w742-city-sharing-membership-motion.test.mjs',
  'tests/unit/w745-final-city-polish-red-team.test.mjs',
  'tests/unit/w747-spatial-foundation.test.mjs',
  'tests/unit/w748-city-os-interaction-workspace.test.mjs',
  'tests/unit/w749-central-living-nexus.test.mjs',
  'tests/unit/w750-command-centre-live-walls.test.mjs',
  'tests/unit/w751-productive-stations-real-work-loops.test.mjs',
  'tests/unit/w752-missions-xp-vault-reveals-my-realm.test.mjs',
  'tests/unit/w753-share-center-creator-capture-referral-truth.test.mjs'
], { stdio: 'inherit' });
if (tests.status !== 0) process.exit(tests.status || 1);

const diff = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' });
if (diff.status !== 0) process.exit(diff.status || 1);
console.log('W753 LOCAL SOURCE PASS — HEADED SHARE, CAPTURE, QR AND REFERRAL-TRUTH EVIDENCE STILL REQUIRED');
