#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_DATA_SURVIVAL_RECORDS,
  getEonCityDataSurvivalManifestTruth
} from '../assets/js/contracts/city/eon-city-data-survival-manifest.js';
import { getEonCityDataSurvivalTruth } from '../assets/js/city/c06/eon-city-c06-data-survival.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const checks = [];
const check = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail: String(detail) }));
const manifestTruth = getEonCityDataSurvivalManifestTruth();
const survivalTruth = getEonCityDataSurvivalTruth();
const source = read('assets/js/city/c06/eon-city-c06-data-survival.js');
const manifestSource = read('assets/js/contracts/city/eon-city-data-survival-manifest.js');
const inventorySource = read('assets/js/data-survival/eon-data-survival-inventory.js');
const productiveSource = read('assets/js/contracts/city/eon-city-productive-rpg-loop.js');
const keys = new Set(EON_CITY_DATA_SURVIVAL_RECORDS.map((entry) => entry.key));
const schemas = new Set(EON_CITY_DATA_SURVIVAL_RECORDS.map((entry) => entry.schema));

check('sixteen-declared-critical-records', EON_CITY_DATA_SURVIVAL_RECORDS.length === 16 && keys.size === 16 && schemas.size === 16, `${keys.size} keys`);
check('signal-frontier-covered', manifestTruth.signalFrontierCovered && survivalTruth.signalFrontierCovered, 'canonical Expanse record');
check('my-frontier-covered', manifestTruth.myFrontierCovered && survivalTruth.myFrontierCovered, 'inside W766 state');
check('storm-sector-covered', manifestTruth.stormSectorCovered && survivalTruth.stormSectorCovered, 'exact package progress inside W766 state');
check('rt91-session-covered', keys.has('eon:city:living-frontier-session:rt91:v1'), 'flagship campaigns + repeatable contract continuity');
check('living-nexus-history-covered', keys.has('eon:city:living-nexus:w660p:v1') && keys.has('eon:city:living-nexus:encounters:w660s:v1'), 'atlas/realm/encounter continuity');
check('agent-theatre-history-covered', keys.has('eon:city:genuine-agent-theatre:w624i:v1') && keys.has('eon:eonbot:job-fabric:v1'), 'bounded local lifecycle receipts');
check('command-district-journey-covered', keys.has('eon:city:command-district:v1'), 'bounded Command District journey');
check('legacy-city-world-progress-covered', keys.has('eon:city:world-state:v1'), 'first-circuit/unlocked district continuity');
check('project-district-history-covered', keys.has('eon:city:project-districts:v1'), 'private bounded district manifests');
check('workspace-capsule-subpayload', manifestTruth.encryptedWorkspaceCapsuleRequired && survivalTruth.encryptedWorkspaceCapsuleRequired, 'separate protection class');
check('record-digests-required', survivalTruth.recordDigestsRequired && /recordDigest/.test(source), 'SHA-256 per record');
check('bundle-digest-required', survivalTruth.bundleDigestRequired && /payloadDigest/.test(source), 'SHA-256 payload');
check('future-versions-rejected', survivalTruth.futureVersionsRejected && /bundle\.version !== EON_CITY_DATA_SURVIVAL_VERSION/.test(source), 'exact version');
check('restore-preview-required', survivalTruth.previewRequired && /reviewedPreviewId/.test(source), 'inspect before apply');
check('typed-restore-confirmation', survivalTruth.typedConfirmationRequired === 'RESTORE EONCITY DATA', survivalTruth.typedConfirmationRequired);
check('atomic-restore', survivalTruth.atomicRestore && /const snapshots = new Map/.test(source), 'all owned records snapshotted');
check('rollback-verified', survivalTruth.rollbackVerifiedOnFailure && /rollbackVerified/.test(source), 'exact prior bytes');
check('verified-delete', survivalTruth.verifiedDeletion && /zeroDeclaredResidue/.test(source), 'declared keys only');
check('private-content-forbidden', !manifestTruth.privateProjectContentAllowed && !survivalTruth.privateProjectContentStored && /containsForbiddenPrivateField/.test(source), 'closed schemas');
check('credentials-forbidden', !survivalTruth.credentialsStored && !/providerKey\s*:|apiKey\s*:|credentialValue\s*:/.test(manifestSource), 'no credential payload');
check('raw-media-separated', !survivalTruth.rawMediaStored, 'I15 media bundle remains separate');
check('no-network-execution', !survivalTruth.networkRequestCreated && !/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(source), 'local-only');
check('productive-store-preserved', /export function readEonCityProductiveRpgStore/.test(productiveSource) && /readEonCityProductiveRpgStore/.test(source), 'durable store not public projection');
check('inventory-joined-value-free', /getEonCityDataSurvivalRecord/.test(inventorySource) && /cityStateObserved/.test(inventorySource) && /valueIncluded: false/.test(inventorySource), 'inventory metadata only');
check('manifest-exact-expanse-schema', /eon\.city\.expanse\.foundation\.w766a\.v1/.test(manifestSource), 'matches W766 authority');
check('no-silent-omission-claim', EON_CITY_DATA_SURVIVAL_RECORDS.every((entry) => entry.backup && entry.restore && entry.migration && entry.deletion), 'four lifecycle policies per record');
check('source-has-size-bound', /EON_CITY_DATA_SURVIVAL_MAX_BYTES/.test(source), 'bounded import/export');

const receipt = Object.freeze({
  schema: 'eonapp.a15.c06.city-data-survival-gate.v2',
  wave: 'C06',
  ok: checks.every((entry) => entry.pass),
  passed: checks.filter((entry) => entry.pass).length,
  total: checks.length,
  generatedAt: new Date().toISOString(),
  declaredRecordCount: EON_CITY_DATA_SURVIVAL_RECORDS.length,
  checks: Object.freeze(checks),
  limitations: Object.freeze([
    'Source-only certification.',
    'Encrypted Workspace Capsule browser export/import playthrough remains part of external certification.',
    'Raw Creator media and optional encrypted secrets remain separate protection classes by design.'
  ])
});
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.id} — ${entry.detail}`);
console.log(`\nA15 C06 City Data Survival: ${receipt.passed}/${receipt.total}`);
fs.mkdirSync(path.join(ROOT, 'artifacts', 'a15'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'a15', 'A15_C06_CITY_DATA_SURVIVAL_GATE.json'), `${JSON.stringify(receipt, null, 2)}\n`);
if (!receipt.ok) process.exitCode = 1;
