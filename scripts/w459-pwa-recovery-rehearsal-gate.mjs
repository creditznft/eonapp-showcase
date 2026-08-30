#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonPwaRecoveryRehearsalTruth } from '../assets/js/eon-pwa-recovery-rehearsal.js';
import { W459_PWA_RECOVERY_REHEARSAL_CONTRACT, validateW459PwaRecoveryRehearsalContract } from '../config/w459-pwa-recovery-rehearsal-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW459PwaRecoveryRehearsal() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const rehearsal = read('assets/js/eon-pwa-recovery-rehearsal.js');
  const profile = read('assets/js/profile-page.js');
  const profileHtml = read('profile.html');
  const manager = read('assets/js/eon-pwa-manager.js');
  const updateSafe = read('assets/js/utils/update-safe-user-data.js');
  const truth = getEonPwaRecoveryRehearsalTruth();

  check('required-files', [
    'assets/js/eon-pwa-recovery-rehearsal.js',
    'config/w459-pwa-recovery-rehearsal-contract.mjs',
    'tests/unit/w459-pwa-recovery-rehearsal.test.mjs'
  ].every((relative) => existsSync(path.join(root, relative))), 'rehearsal module, contract and deterministic test exist');
  check('contract-valid', validateW459PwaRecoveryRehearsalContract().length === 0 && W459_PWA_RECOVERY_REHEARSAL_CONTRACT.wave === 'W459.1', 'contract preserves source-only manual rehearsal boundaries');
  check('key-name-only-observation', /storage\.key\(index\)/.test(rehearsal) && /rawValuesRead: false/.test(rehearsal) && !/summarizeW145ProtectedStorage/.test(rehearsal), 'rehearsal counts key names without using the W145 value/fingerprint summary');
  check('redacted-record-only', /keyNamesStored: false/.test(rehearsal) && /rawValuesStored: false/.test(rehearsal) && /inventoryDigest/.test(rehearsal), 'stored rehearsal contains bounded counts and a redacted digest, never raw values or names');
  check('explicit-plan-steps', /explicit-user-action-required/.test(rehearsal) && /explicit-manual-review-confirmation-required/.test(rehearsal) && /backup-check/.test(rehearsal) && /rollback-check/.test(rehearsal), 'owner action and confirmation are required for every recorded rehearsal step');
  check('no-recovery-operation', /actualBackupCreated: false/.test(rehearsal) && /actualRestoreApplied: false/.test(rehearsal) && /actualUpdateApplied: false/.test(rehearsal) && /rollbackApplied: false/.test(rehearsal), 'the source never creates a backup, restores data, applies updates or rolls back');
  check('no-network-or-push', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|Notification\.requestPermission|PushManager|SKIP_WAITING|navigator\.serviceWorker|window\.location/.test(rehearsal), 'rehearsal makes no request, permission, service-worker action or navigation');
  check('profile-wiring', /eon-profile-recovery-rehearse/.test(profile) && /eon-profile-recovery-steps/.test(profileHtml) && /Open Portable Workspace Capsule/.test(profileHtml), 'Profile exposes a recovery-context card and the explicit Capsule route');
  check('pwa-state-wiring', /recoveryRehearsal/.test(manager) && /getEonPwaRecoveryRehearsalTruth/.test(manager), 'PWA state exposes rehearsal truth without asserting PWA proof');
  check('update-safe-key', updateSafe.includes('eon:pwa:recovery-rehearsal:v1'), 'redacted rehearsal state is protected by W145 update-survival registry');
  check('truth-boundary', truth.rawVaultValueRead === false && truth.rawKeyNamesStored === false && truth.backupCreated === false && truth.restoreApplied === false && truth.automaticUpdateApplication === false && truth.recoveryCertified === false && truth.productionPwaProof === false, 'truth object stays fail-closed about recovery and device proof');
  return Object.freeze({
    schema: 'eonapp.w459.pwa-recovery-rehearsal-gate.v1',
    wave: 'W459.1',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    limitations: Object.freeze(['No encrypted backup was created, restored or inspected by this rehearsal.', 'No installed PWA update, rollback, iOS, Android, desktop, service-worker or cross-device evidence was collected.'])
  });
}

export function runW459PwaRecoveryRehearsalGate({ writeArtifact = true } = {}) {
  const result = inspectW459PwaRecoveryRehearsal();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w459-pwa-recovery-rehearsal-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW459PwaRecoveryRehearsalGate();
  process.stdout.write(`W459.1 PWA recovery rehearsal gate passed (${result.checkCount}/${result.checkCount}). No backup, restore, update or recovery was applied.\n`);
}
