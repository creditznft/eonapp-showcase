#!/usr/bin/env node
/** W396 source gate: local update/restore readiness and no-cloud-local export truth. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W396_UPDATE_ROLLBACK_RESTORE_CONTRACT, validateW396UpdateRollbackRestoreContract } from '../config/w396-update-rollback-restore-contract.mjs';
import { getW396ReleaseRecoveryTruth } from '../assets/js/local-first/w396-release-recovery-proof.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW396UpdateRollbackRestore() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const contract = W396_UPDATE_ROLLBACK_RESTORE_CONTRACT;
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const localExport = read('assets/js/local-first/eon-local-encrypted-export.js');
  const portable = read('assets/js/local-first/eon-portable-backup.js');
  const proof = read('assets/js/local-first/w396-release-recovery-proof.js');
  const docs = read('docs/W396_UPDATE_ROLLBACK_RESTORE_PROOF_2026-06-28.md');
  const profile = read('assets/js/profile-page.js');
  const truth = getW396ReleaseRecoveryTruth();

  check('contract-valid', validateW396UpdateRollbackRestoreContract(contract).length === 0, 'W396 contract has no internal violations');
  check('w145-byte-exact', /buildW145UpdateSurvivalManifest/.test(updateSafe) && /byteExact/.test(updateSafe) && /noBootClear: true/.test(updateSafe), 'existing update survival model remains byte-exact and no-clear');
  check('encrypted-local-export-only', /createEncryptedLocalExport/.test(localExport) && /PBKDF2-SHA-256/.test(localExport) && /AES-GCM-256/.test(localExport) && /automaticCrossDeviceSync: false/.test(localExport), 'local encrypted export remains an explicit encrypted local-only recovery action');
  check('empty-target-recovery', /runEncryptedPortableBackupRecoveryDrill/.test(portable) && /recovery-target-not-empty/.test(portable) && /destructiveOverwrite: false/.test(portable), 'portable recovery requires a separate empty target and never overwrites');
  check('profile-explicit-capsule', /Portable Workspace Capsule/.test(profile) && /Google Login does not copy local Chat/.test(profile) && !/createEncryptedEonSyncBackup|restoreEonSyncPayload/.test(profile), 'Profile exposes the explicit local Capsule and never treats identity as local-work restore.');
  check('proof-board-local-only', /networkRequestCreated: false/.test(proof) && /browserStorageRead: false/.test(proof) && /releaseCertified: false/.test(proof), 'W396 evidence board does not inspect state or certify a release');
  check('truth-boundaries', truth.localProofBoardOnly === true && truth.automaticCloudBackup === false && truth.automaticCrossDeviceSync === false && truth.releaseCertification === false, 'W396 runtime truth preserves local-only, no-certification boundaries');
  check('manual-lanes-documented', contract.requiredLanes.every((lane) => docs.includes(lane) || docs.includes(lane.replaceAll('-', ' '))), 'all manual recovery lanes are documented');
  check('no-account-restore-claim', /Google identity is not a backup,\s*sync or local-work\s+restore/i.test(docs) && /identityRestoresLocalWork: false/.test(proof), 'W396 rejects account-based local-work restore claims');
  check('collection-relay-blocked', contract.boundaries.collectionOrReferralRestore === false && /Collection, Vault Reveals, EON Relay referral grants/.test(docs), 'Collection/Relay remain blocked before real proof');

  return Object.freeze({
    schema: 'eonapp.w396.update-rollback-restore-gate.v1',
    wave: 'W396',
    status: 'pass',
    sourceOnly: true,
    manualBrowserProofCertified: false,
    releaseCertified: false,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    requiredManualLanes: contract.requiredLanes,
    limitations: Object.freeze([
      'This gate does not execute a browser deployment, service-worker update, backup download, restore, rollback, Cloudflare operation or Google session.',
      'A human must complete the W396 browser recovery drill and W397 release audit before Collection, Relay, social tokens or cloud-backed creator work can be enabled.'
    ])
  });
}

export function runW396UpdateRollbackRestoreGate({ writeArtifact = true } = {}) {
  const result = inspectW396UpdateRollbackRestore();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w396-update-rollback-restore-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW396UpdateRollbackRestoreGate();
  process.stdout.write(`W396 update/rollback/restore gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
