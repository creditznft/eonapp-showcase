#!/usr/bin/env node
/** W415 source gate: final handover must stay code-complete but proof-honest. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonSyncBasicTruth } from '../assets/js/eon-sync/eon-sync-basic-foundation.js';
import { getEonSyncBasicClientTruth } from '../assets/js/eon-sync/eon-sync-basic-client.js';
import { EON_SIGNAL_EXPEDITION_TEMPLATES, getSignalExpeditionTruth } from '../assets/js/city/eon-signal-expeditions.js';
import { EON_CITY_METROPOLIS_DISTRICTS } from '../assets/js/city/eon-city-metropolis-districts.js';
import { getCityValidationLabTruth } from '../assets/js/city/eon-city-validation-lab.js';
import { W415_FINAL_SOURCE_READINESS_CONTRACT, validateW415FinalSourceReadinessContract } from '../config/w415-final-source-readiness-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

const requiredFiles = Object.freeze([
  'functions/_shared/eon-sync-basic.js',
  'functions/api/sync/status.js',
  'functions/api/sync/records.js',
  'functions/api/sync/records/tombstone.js',
  'sync/migrations/0001_eon_sync_basic.sql',
  'assets/js/city/eon-signal-expeditions.js',
  'assets/js/city/eon-city-metropolis-districts.js',
  'assets/js/city/eon-city-play-babylon.js',
  'assets/js/eon-city-play-station.js',
  'docs/W412_SYNC_BASIC_TRANSPORT_2026-06-28.md',
  'docs/W413_W414_CITY_EXPEDITIONS_METROPOLIS_2026-06-28.md',
  'NEXT_CHAT/48_FINAL_CODEX_START_HERE_2026-06-28.md',
  'NEXT_CHAT/49_FINAL_CODEX_MANUAL_PROOF_RUNBOOK_2026-06-28.md',
  'NEXT_CHAT/50_FINAL_CODEX_CHANGED_FILES_W412_W413_W414_2026-06-28.md',
  'NEXT_CHAT/51_FINAL_VALIDATION_RECEIPT_2026-06-28.md',
  'NEXT_CHAT/52_FINAL_COMPLETION_AND_BLOCKERS_2026-06-28.md'
]);

export function inspectW415FinalSourceReadiness() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const records = read('functions/api/sync/records.js');
  const tombstone = read('functions/api/sync/records/tombstone.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const station = read('assets/js/eon-city-play-station.js');
  const finalStart = read('NEXT_CHAT/48_FINAL_CODEX_START_HERE_2026-06-28.md');
  const runbook = read('NEXT_CHAT/49_FINAL_CODEX_MANUAL_PROOF_RUNBOOK_2026-06-28.md');
  const blockerDoc = read('NEXT_CHAT/52_FINAL_COMPLETION_AND_BLOCKERS_2026-06-28.md');
  const syncTruth = getEonSyncBasicTruth();
  const syncClientTruth = getEonSyncBasicClientTruth();
  const expeditionTruth = getSignalExpeditionTruth();
  const validationTruth = getCityValidationLabTruth();

  check('contract-valid', validateW415FinalSourceReadinessContract().length === 0, 'W415 contract has no internal mismatch');
  check('required-final-files-exist', requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'final code, docs and Codex runbooks are all present');
  check('sync-remains-identity-separate', syncTruth.googleLoginIsSync === false && syncTruth.enabled === false && syncTruth.secureVaultSyncIncluded === false, 'Google identity is separate from Sync and Vault Sync remains excluded');
  check('sync-client-stays-explicit', syncClientTruth.importNetworkOnModuleLoad === false && syncClientTruth.automaticUpload === false && syncClientTruth.automaticMerge === false && syncClientTruth.vaultSync === false, 'browser Sync client has no import-time network, auto upload/merge or Vault scope');
  check('sync-server-verifies-integrity', /verifyEonSyncBasicRecordContentHash/.test(records) && /content-hash-mismatch/.test(records) && /verifyEonSyncBasicRecordContentHash/.test(tombstone) && /content-hash-mismatch/.test(tombstone), 'Worker verifies canonical record hashes before D1 writes');
  check('expeditions-are-finite-authored-sessions', EON_SIGNAL_EXPEDITION_TEMPLATES.length === 4 && EON_SIGNAL_EXPEDITION_TEMPLATES.every((entry) => entry.durationMinutes >= 5 && entry.durationMinutes <= 15) && expeditionTruth.finiteTemplates === true && expeditionTruth.remoteAssetDownload === false, 'Option B remains four finite authored local sessions, not an open-world or remote-asset claim');
  check('metropolis-option-a-is-complete-in-source', EON_CITY_METROPOLIS_DISTRICTS.length === 3 && /addArrivalDistrict/.test(renderer) && /addCreatorForgeDistrict/.test(renderer) && /Creator Atrium/.test(station), 'Option A includes Arrival, Creator, Forge plus the three remaining district surfaces in the canonical City source');
  check('city-remains-babylon-canonical', /@babylonjs\/core/.test(renderer) && /focusMetropolisDistrict/.test(renderer) && /Three\.js/i.test(renderer) === false, 'one canonical Babylon City owns the City route and district focus');
  check('validation-lab-does-not-certify', validationTruth.localOnly === true && validationTruth.automaticCertification === false && validationTruth.screenshotUploadCreated === false && validationTruth.videoUploadCreated === false && validationTruth.remoteTelemetryCreated === false, 'City Validation Lab records local observations but cannot certify or upload proof');
  check('station-exposes-user-initiated-city-actions', /data-eon-play-open-command-deck/.test(station) && /data-eon-play-open-settings/.test(station) && /data-eon-play-open-controls/.test(station) && /explicitUserAction/.test(station), 'City controls expose the Command Deck, graphics settings and optional work routes only through visible user actions');
  check('codex-start-is-single-baseline', /only source baseline/i.test(finalStart) && /npm ci/.test(finalStart) && /qa:w415-final-source-readiness/.test(finalStart), 'Codex start guide names one source baseline and reproducible checks');
  check('runbook-keeps-real-proof-external', /disposable approved Google test account/i.test(runbook) && /Android\/iOS/i.test(runbook) && /two-device/i.test(runbook) && /license\/original|licensed or original/i.test(runbook), 'manual runbook covers OAuth, devices, Sync and art provenance without faking evidence');
  check('blockers-are-explicit', /Not completed in this source package/i.test(blockerDoc) && /do not claim/i.test(blockerDoc), 'blocker doc makes external evidence and forbidden claims explicit');
  check('no-activation-or-commercial-claim', /automaticUpload:\s*false/.test(records) && /automaticMerge:\s*false/.test(records) && /social OAuth connectors\/posting/i.test(blockerDoc) && /referral rewards\/grants/i.test(blockerDoc), 'final handover keeps Sync, social, rewards and commercial behavior explicitly inactive');

  return Object.freeze({
    schema: 'eonapp.w415.final-source-readiness-gate.v1',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate certifies source readiness and handover completeness only. It does not prove live production OAuth, device controls, Cloudflare D1 bindings or cross-device Sync.',
      'Final licensed City assets, KTX2/Basis conversion, LOD measurements and art-direction screenshots remain an asset/provenance intake task.',
      'No social posting, OAuth connector, reward, referral, payment or Secure Vault Sync capability is activated by this source package.'
    ])
  });
}

export function runW415FinalSourceReadinessGate({ writeArtifact = true } = {}) {
  const report = inspectW415FinalSourceReadiness();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w415-final-source-readiness-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW415FinalSourceReadinessGate();
  process.stdout.write(`W415 final source readiness gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
