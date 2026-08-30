#!/usr/bin/env node
/** W433 static gate: validates source boundaries; it does not activate Sync. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonSyncBasicMergeRecoveryTruth } from '../assets/js/eon-sync/eon-sync-basic-merge-recovery.js';
import { W433_SYNC_BASIC_MERGE_RECOVERY_CONTRACT, validateW433SyncBasicMergeRecoveryContract } from '../config/w433-sync-basic-merge-recovery-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW433SyncBasicMergeRecovery() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const implementation = read('assets/js/eon-sync/eon-sync-basic-merge-recovery.js');
  const foundation = read('assets/js/eon-sync/eon-sync-basic-foundation.js');
  const truth = getEonSyncBasicMergeRecoveryTruth();

  check('required-files', ['assets/js/eon-sync/eon-sync-basic-merge-recovery.js', 'config/w433-sync-basic-merge-recovery-contract.mjs', 'tests/unit/w433-sync-basic-merge-recovery.test.mjs'].every((relative) => existsSync(path.join(root, relative))), 'implementation, contract and tests are present');
  check('contract-valid', validateW433SyncBasicMergeRecoveryContract().length === 0 && W433_SYNC_BASIC_MERGE_RECOVERY_CONTRACT.wave === 'W433', 'contract keeps W433 as a source-only review foundation');
  check('safe-type-boundary', /EON_SYNC_BASIC_TYPES/.test(implementation) && /EON_SYNC_BASIC_EXCLUSIONS/.test(foundation), 'merge validation reuses the approved Sync Basic type boundary while Vault exclusions remain in the base foundation');
  check('integrity-validation', /record-content-hash-mismatch/.test(implementation) && /record-byte-count-mismatch/.test(implementation) && /createEonSyncBasicRecord/.test(implementation), 'every candidate is rebuilt and checked before planning');
  check('review-not-auto-merge', /explicit-user-action-required/.test(implementation) && /explicit-import-consent-required/.test(implementation) && /explicit-deletion-consent-required/.test(implementation) && /explicit-conflict-copy-consent-required/.test(implementation), 'imports, tombstones and conflict copies require deliberate review consent');
  check('stage-not-write', /stageOnly: true/.test(implementation) && /browserStorageChanged: false/.test(implementation) && /externalCommitRequired: true/.test(implementation), 'the merge result is staged only and cannot mutate application storage');
  check('no-network-or-storage-api', !/\bfetch\s*\(/.test(implementation) && !/localStorage|sessionStorage|indexedDB|navigator\.storage/i.test(implementation), 'the W433 module contains no transport or browser-storage access');
  check('truth-boundary', truth.liveSync === false && truth.networkTransport === false && truth.browserStorageWrite === false && truth.automaticMerge === false && truth.physicalTwoDeviceProofCompleted === false && truth.secureVaultSyncIncluded === false, 'source work does not claim live Sync, device proof, or Vault Sync');
  return Object.freeze({ schema: 'eonapp.w433.sync-basic-merge-recovery-gate.v1', wave: 'W433', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['No real account, two-device, browser persistence, transport, D1, update/rollback, or production proof was run.', 'The staged replica needs a separately audited UI commit adapter before Sync Basic can be called live.']) });
}

export function runW433SyncBasicMergeRecoveryGate({ writeArtifact = true } = {}) {
  const result = inspectW433SyncBasicMergeRecovery();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w433-sync-basic-merge-recovery-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW433SyncBasicMergeRecoveryGate();
  process.stdout.write(`W433 Sync Basic merge/recovery gate passed (${result.checkCount}/${result.checkCount}). No live Sync claim issued.\n`);
}
