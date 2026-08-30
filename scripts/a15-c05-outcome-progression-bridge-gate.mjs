#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CORE_OUTCOME_POLICIES,
  getEonCoreOutcomeTruth
} from '../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { getEonCityProgressTruth } from '../assets/js/contracts/city/eon-city-progress-bridge.js';
import { projectEonCityW751ProductiveStations, validateEonCityW751ProductiveStations } from '../assets/js/city/w751/eon-city-w751-productive-stations.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WRITE_EVIDENCE = process.env.EONAPP_GATE_WRITE_EVIDENCE !== '0';
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const checks = [];
const check = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail: String(detail) }));
const outcomeTruth = getEonCoreOutcomeTruth();
const progressTruth = getEonCityProgressTruth();
const coreFiles = [
  'assets/js/create/eon-create-hub.js',
  'assets/js/forge/eon-forge-quick-build.js',
  'assets/js/projects/eon-projects-page.js',
  'assets/js/eon-workspace-pages.js',
  'assets/js/local-ai/local-ai-page.js',
  'assets/js/eon-automations-page.js',
  'assets/js/local-first/eon-workspace-capsule-page.js',
  'assets/js/vault/eon-vault-page.js'
];
const coreSources = coreFiles.map((file) => [file, read(file)]);
const outcomeSource = read('assets/js/contracts/outcomes/eon-core-outcome-authority.js');
const bridgeSource = read('assets/js/contracts/city/eon-city-progress-bridge.js');
const stationSource = read('assets/js/city/w751/eon-city-w751-productive-stations.js');
const missionSource = read('assets/js/city/w752/eon-city-w752-missions-progression.js');
const shareSource = read('assets/js/contracts/share/eon-share-w753-reviewed-handoff-receipt.js');
const stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} }, shareReceipt: null, progressReceipts: [] });
const stationValidation = validateEonCityW751ProductiveStations(stationView);
const stations = new Set(EON_CORE_OUTCOME_POLICIES.map((entry) => entry.stationId));
const kinds = new Set(EON_CORE_OUTCOME_POLICIES.map((entry) => entry.kind));

check('nineteen-native-outcome-policies', EON_CORE_OUTCOME_POLICIES.length === 19 && kinds.size === 19, `${EON_CORE_OUTCOME_POLICIES.length} policies`);
check('nine-launch-station-families', stations.size === 9 && ['create-forge', 'project-atlas', 'library-vault', 'local-ai-lab', 'automation-theatre', 'command-console', 'my-realm-portal', 'plans-access', 'share-capture'].every((id) => stations.has(id)), [...stations].join(','));
check('native-proof-required', outcomeTruth.nativeProofRequired && outcomeTruth.cityMaySubscribeToApprovedProof, 'neutral Core authority');
check('no-private-outcome-content', !outcomeTruth.privateContentStored && !outcomeTruth.promptsStored && !outcomeTruth.filesStored && !outcomeTruth.credentialsStored && !outcomeTruth.mediaStored, 'redacted proof only');
check('no-navigation-outcome', !outcomeTruth.routeOpeningGrantsOutcome && !outcomeTruth.cityReturnReceiptGrantsOutcome, 'C04 receipts excluded');
check('no-outcome-reward', !outcomeTruth.xpGranted && !outcomeTruth.rewardGranted && !outcomeTruth.automaticExecution, 'Core cannot award City progress');
check('no-silent-outcome-eviction', outcomeTruth.silentEviction === false && /outcome-capacity-reached/.test(outcomeSource), 'capacity blocks');
check('city-one-receipt-per-outcome', progressTruth.oneReceiptPerCoreOutcome && /seen\.has\(outcome\.outcomeId\)/.test(bridgeSource), 'idempotent bridge');
check('city-consumes-policy-approved-only', progressTruth.consumesOnlyPolicyApprovedCoreOutcomes && /validateEonCoreOutcome/.test(bridgeSource), 'validation required');
check('city-progress-no-xp', !progressTruth.xpGranted && !progressTruth.rewardGranted && !progressTruth.completionClaimed, 'verified-ready only');
check('explicit-claim-still-required', progressTruth.explicitMissionClaimRequired && /explicitUserAction-required|explicit-user-action-required/.test(missionSource), 'W752 claim boundary');
check('review-open-return-not-progress', !progressTruth.routeOpeningGrantsXp && !progressTruth.cityReturnReceiptGrantsXp && !progressTruth.localReviewGrantsXp, 'navigation is not proof');
check('all-core-surfaces-use-neutral-authority', coreSources.every(([, source]) => /recordEonCoreOutcome/.test(source)), coreFiles.join(','));
check('no-core-surface-writes-city-rpg', coreSources.every(([, source]) => !/recordEonCityProductiveRpgOutcome/.test(source)), 'zero direct Core→City progress writes');
check('forge-apply-native-proof', /forge-source-applied/.test(coreSources.find(([file]) => file.includes('forge'))?.[1] || '') && /saveProject\(updated\)/.test(coreSources.find(([file]) => file.includes('forge'))?.[1] || ''), 'after saved Apply');
check('library-reuse-native-proof', /library-item-reused/.test(read('assets/js/eon-workspace-pages.js')) && /recordLibraryUse/.test(read('assets/js/eon-workspace-pages.js')), 'explicit reuse');
check('share-receipt-projects-neutral-outcome', /recordEonCoreOutcome/.test(shareSource) && /reviewed-signed-handoff/.test(shareSource) && /creator-capture-saved/.test(shareSource), 'reviewed receipt only');
check('w751-progress-bridge-connected', /syncEonCoreOutcomesToCity/.test(stationSource) && /getLatestEonCityProgressReceipt/.test(stationSource), 'City projection connected');
check('w751-projection-valid', stationValidation.ok && stationView.rewardIssued === false, stationValidation.errors.join(','));
check('w752-does-not-auto-claim', /if \(!explicitUserAction\)/.test(missionSource) && /recordEonCityW659gVerifiedAction/.test(missionSource), 'separate explicit ledger write');
check('contracts-have-no-network', !/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|location\.(?:assign|replace)/.test(`${outcomeSource}\n${bridgeSource}`), 'local contracts only');
check('contracts-have-no-sensitive-fields', !/(rawPrompt|promptText|providerKey|apiKey|fileContent|mediaBlob|cardNumber)\s*:/.test(`${outcomeSource}\n${bridgeSource}`), 'no private payload schema');

const receipt = Object.freeze({
  schema: 'eonapp.a15.c05.outcome-progression-bridge-gate.v1',
  wave: 'C05',
  ok: checks.every((entry) => entry.pass),
  passed: checks.filter((entry) => entry.pass).length,
  total: checks.length,
  generatedAt: new Date().toISOString(),
  policyCount: EON_CORE_OUTCOME_POLICIES.length,
  checks: Object.freeze(checks),
  limitations: Object.freeze([
    'Source-only certification.',
    'No authenticated browser mission playthrough evidence.',
    'Core outcomes and City progress receipts grant no XP until W752 explicit claim.'
  ])
});
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.id} — ${entry.detail}`);
console.log(`\nA15 C05 Outcome Progression Bridge: ${receipt.passed}/${receipt.total}`);
if (WRITE_EVIDENCE) {
  fs.mkdirSync(path.join(ROOT, 'artifacts', 'a15'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'a15', 'A15_C05_OUTCOME_PROGRESSION_BRIDGE_GATE.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
if (!receipt.ok) process.exitCode = 1;
