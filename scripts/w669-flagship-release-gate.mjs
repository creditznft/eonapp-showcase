#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W669_EVIDENCE_LANES,
  W669_FLAGSHIP_RELEASE_CONTRACT,
  createW669OwnerReceiptTemplate,
  validateW669FlagshipReleaseContract,
  validateW669OwnerReceipt
} from '../config/w669-flagship-release-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));

const required = [
  'config/w669-flagship-release-contract.mjs',
  'scripts/w669-flagship-release-gate.mjs',
  'tests/unit/w669-flagship-release-gate.test.mjs',
  'docs/W669_FLAGSHIP_RELEASE_AUTHORITY_2026-07-24.md',
  'assets/js/city/eon-city-input-contract.js',
  'assets/js/city/eon-city-camera-relative-movement.js',
  'assets/js/city/w660i/eon-city-w660i-district-config.js',
  'assets/js/city/w660i/eon-city-w660i-district-composition.js',
  'assets/js/city/w666/eon-city-w666-asset-function-registry.js',
  'assets/js/city/eon-city-living-nexus-hybrid.js',
  'assets/js/nexus/w668/eon-nexus-w668-flagship-state.js',
  'assets/js/nexus/w668/eon-nexus-w668-command-model.js'
];
add('required-authority-files', required.every(exists), 'W664–W669 source authorities, release contract, gate, tests and runbook exist');

const contractValidation = validateW669FlagshipReleaseContract();
add('contract-valid', contractValidation.ok, contractValidation.errors.join(', ') || 'evidence-gated contract validates');
add('seven-independent-lanes', W669_EVIDENCE_LANES.length === 7 && new Set(W669_EVIDENCE_LANES.map((lane) => lane.id)).size === 7, 'movement, Core, assets, Expanse, Nexus, Realms and performance are separate');
add('nine-point-five-owner-only', W669_FLAGSHIP_RELEASE_CONTRACT.quality.overallMinimum === 9.5 && W669_FLAGSHIP_RELEASE_CONTRACT.quality.automationMayAssignScore === false, 'automation cannot award the flagship score');
add('zero-critical-defects', W669_FLAGSHIP_RELEASE_CONTRACT.quality.criticalDefectsMaximum === 0, 'any critical defect blocks release');
add('browser-device-realm-matrix', W669_FLAGSHIP_RELEASE_CONTRACT.evidence.browsers.length === 4 && W669_FLAGSHIP_RELEASE_CONTRACT.evidence.devices.length === 2 && W669_FLAGSHIP_RELEASE_CONTRACT.evidence.realms.length === 6, 'required human matrix is explicit');
add('zero-artifact-local-first', W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.localFirst === true && W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.githubActionsArtifactsRequired === false && W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.codexRequired === false, 'local source work needs no Codex or Actions artifacts');

const blank = createW669OwnerReceiptTemplate();
const blankValidation = validateW669OwnerReceipt(blank);
add('blank-receipt-cannot-release', blankValidation.releaseApproved === false && blankValidation.blockers.length >= 8, 'template remains blocked until owner/live proof exists');

const packageJson = JSON.parse(read('package.json'));
add('package-command', packageJson.scripts?.['qa:w669-flagship-release'] === 'node scripts/w669-flagship-release-gate.mjs && node --test tests/unit/w669-flagship-release-gate.test.mjs', 'focused W669 source command exists');
add('recovery-chain-command', /qa:w669-flagship-release/.test(packageJson.scripts?.['qa:w664-w669-local-recovery'] || ''), 'consolidated local recovery chain ends at W669');

const movement = `${read('assets/js/city/eon-city-input-contract.js')}\n${read('assets/js/city/eon-city-camera-relative-movement.js')}`;
const transition = `${read('assets/js/city/w660i/eon-city-w660i-district-config.js')}\n${read('assets/js/city/w660i/eon-city-w660i-district-composition.js')}`;
const functions = read('assets/js/city/w666/eon-city-w666-asset-function-registry.js');
const expanse = read('assets/js/city/eon-city-living-nexus-hybrid.js');
const flagship = read('assets/js/nexus/w668/eon-nexus-w668-flagship-state.js');
const panel = read('assets/js/city/eon-city-living-nexus-panel.js');
add('w664-authority-present', /camera-relative|cameraRelative|camera ground basis/i.test(movement) && /controlSource|source/.test(movement), 'canonical movement authority remains source-aware');
add('w665-transition-present', /resolveEonCityW660iDistrictTransition/.test(transition) && /enterMargin/.test(transition) && /exitMargin/.test(transition) && /overlap-start|overlap-complete|cross-fade/i.test(transition), 'seamless district authority remains explicit');
add('w666-asset-functions-present', /ASSET_FUNCTION|asset function|reviewFirst/i.test(functions), 'complete shipped-asset function authority remains explicit');
add('w667-infinite-world-present', /practicallyInfinite|visibleCellCount|horizonCellCount/.test(expanse), 'streamed deterministic-infinite Expanse remains explicit');
add('w668-one-nexus-present', /continuityId|morphSignature/.test(flagship) && /maximumVisualNodes|EON_NEXUS_W668_MAX_NODES/.test(flagship), 'one flagship state morphs across three Nexus forms');
add('w668c-world-first-present', /ONE WORLD · ONE CLEAR CHOICE/.test(panel) && /eon-play-living-nexus-advanced/.test(panel), 'City presents the world before the technical controls');

const manifest = JSON.parse(read('config/w624d-current-unit-test-manifest.json'));
add('maintained-suite-aligned', manifest.testFileCount === manifest.testFiles.length && manifest.testFiles.includes('tests/unit/w669-flagship-release-gate.test.mjs'), `${manifest.testFileCount} maintained tests include W669`);

const report = Object.freeze({ schema: 'eonapp.w669.flagship-release-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, releaseApproved: false, sourceStatus: 'source-ready-human-proof-required', checks: Object.freeze(checks) });
for (const check of report.checks) console.log(`[W669] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W669] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total} · releaseApproved=false · authenticated owner proof still required`);
if (!report.ok) process.exitCode = 1;
