import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  createLocalVaultRecordId,
  createLocalVaultSalt,
  deriveLocalVaultKey,
  sealLocalVaultRecord
} from '../../assets/js/local-first/eon-local-vault-crypto.js';
import { createLocalVaultProfile } from '../../assets/js/local-first/eon-local-vault-metadata-store.js';
import {
  createEncryptedPortableBackup,
  getEncryptedPortableBackupTruth,
  importEncryptedPortableBackupToStore,
  inspectEncryptedPortableBackupImport
} from '../../assets/js/local-first/eon-portable-backup.js';
import {
  W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT,
  validateW637PersistenceMigrationRecoveryContract
} from '../../config/w637-persistence-migration-recovery-contract.mjs';
import { inspectW637PersistenceMigrationRecovery } from '../../scripts/w637-persistence-migration-recovery-gate.mjs';

const cryptoApi = webcrypto;

function atomicMemoryStore(seed = [], { failBatch = false, corruptAfterBatch = false } = {}) {
  let values = new Map(seed.map((item) => [item.recordId, structuredClone(item)]));
  let batchCalls = 0;
  return Object.freeze({
    async get(id) {
      return values.has(id) ? structuredClone(values.get(id)) : null;
    },
    async listRecordIds({ limit = 200 } = {}) {
      return [...values.keys()].sort().slice(0, limit);
    },
    async putManyIfAbsent(items = []) {
      batchCalls += 1;
      if (failBatch) throw Object.assign(new Error('simulated atomic failure'), { code: 'atomic-restore-failed' });
      if (items.some((item) => values.has(item.recordId))) {
        throw Object.assign(new Error('simulated race conflict'), { code: 'atomic-restore-conflict' });
      }
      const staged = new Map(values);
      for (const item of items) staged.set(item.recordId, structuredClone(item));
      values = staged;
      if (corruptAfterBatch && items.length) {
        const first = structuredClone(items[0]);
        first.ciphertext = `${first.ciphertext.slice(0, -1)}${first.ciphertext.endsWith('A') ? 'B' : 'A'}`;
        values.set(first.recordId, first);
      }
      return { ok: true, recordIds: items.map((item) => item.recordId), atomic: true, overwritten: false };
    },
    snapshot() {
      return new Map([...values.entries()].map(([key, value]) => [key, structuredClone(value)]));
    },
    get batchCalls() { return batchCalls; }
  });
}

async function makeBackup(count = 2) {
  const salt = createLocalVaultSalt({ cryptoApi });
  const key = await deriveLocalVaultKey('w637 deliberate recovery passphrase', salt, { cryptoApi });
  const records = [];
  for (let index = 0; index < count; index += 1) {
    records.push(await sealLocalVaultRecord(
      { index, privateDraft: `local-only-${index}` },
      { key, recordId: createLocalVaultRecordId({ cryptoApi }), cryptoApi, now: 1_770_000_000_000 + index }
    ));
  }
  const profile = createLocalVaultProfile({ salt, now: 1_770_000_000_000 });
  const backup = await createEncryptedPortableBackup({
    vaultProfile: profile,
    records,
    now: 1_770_000_000_000,
    cryptoApi
  });
  return { backup, records };
}

function changeCiphertext(envelope) {
  const copy = structuredClone(envelope);
  const tail = copy.ciphertext.at(-1);
  copy.ciphertext = `${copy.ciphertext.slice(0, -1)}${tail === 'A' ? 'B' : 'A'}`;
  return copy;
}

test('W637 canonical contract inventories all owned IndexedDB databases and keeps production evidence fenced', () => {
  const validation = validateW637PersistenceMigrationRecoveryContract();
  assert.equal(validation.ok, true);
  assert.equal(W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.indexedDb.length, 5);
  assert.equal(W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.productionCertified, false);
  assert.equal(W637_PERSISTENCE_MIGRATION_RECOVERY_CONTRACT.drive.automaticCrossDeviceSync, false);
  assert.equal(inspectW637PersistenceMigrationRecovery().ok, true);
});

test('W637 detects every conflict before mutation, including a conflict after an earlier add candidate', async () => {
  const { backup, records } = await makeBackup(2);
  const target = atomicMemoryStore([changeCiphertext(records[1])]);
  const before = target.snapshot();
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  assert.deepEqual(preview.adds, [records[0].recordId]);
  assert.deepEqual(preview.conflicts, [records[1].recordId]);
  const result = await importEncryptedPortableBackupToStore(backup, {
    store: target,
    confirmedByUser: true,
    reviewedPreviewId: preview.previewId,
    cryptoApi
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'record-conflict-no-overwrite');
  assert.equal(target.batchCalls, 0);
  assert.deepEqual(target.snapshot(), before);
});

test('W637 requires the exact digest-bound reviewed preview and writes nothing when review is missing or stale', async () => {
  const { backup } = await makeBackup(2);
  const target = atomicMemoryStore();
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  const result = await importEncryptedPortableBackupToStore(backup, {
    store: target,
    confirmedByUser: true,
    reviewedPreviewId: `${preview.previewId}-stale`,
    cryptoApi
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'reviewed-preview-required');
  assert.equal(target.batchCalls, 0);
  assert.equal(target.snapshot().size, 0);
});

test('W637 reports an atomic batch failure with zero partial records', async () => {
  const { backup } = await makeBackup(3);
  const target = atomicMemoryStore([], { failBatch: true });
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  const result = await importEncryptedPortableBackupToStore(backup, {
    store: target,
    confirmedByUser: true,
    reviewedPreviewId: preview.previewId,
    cryptoApi
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'atomic-restore-failed');
  assert.equal(result.atomic, true);
  assert.equal(result.writeState, 'aborted');
  assert.equal(result.recoveryRequired, false);
  assert.equal(target.batchCalls, 1);
  assert.equal(target.snapshot().size, 0);
});

test('W637 applies a reviewed restore in one add-only batch and verifies every stored envelope', async () => {
  const { backup, records } = await makeBackup(3);
  const target = atomicMemoryStore();
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  const result = await importEncryptedPortableBackupToStore(backup, {
    store: target,
    confirmedByUser: true,
    reviewedPreviewId: preview.previewId,
    cryptoApi
  });
  assert.equal(result.ok, true);
  assert.equal(result.restoreApplied, true);
  assert.equal(result.atomic, true);
  assert.equal(result.overwritten, false);
  assert.equal(result.writeState, 'committed-verified');
  assert.equal(result.recoveryRequired, false);
  assert.equal(target.batchCalls, 1);
  assert.deepEqual([...target.snapshot().keys()].sort(), records.map((row) => row.recordId).sort());
});

test('W637 fails closed when post-write verification observes corrupted stored bytes', async () => {
  const { backup } = await makeBackup(1);
  const target = atomicMemoryStore([], { corruptAfterBatch: true });
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  const result = await importEncryptedPortableBackupToStore(backup, {
    store: target,
    confirmedByUser: true,
    reviewedPreviewId: preview.previewId,
    cryptoApi
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'post-restore-verification-failed');
  assert.equal(result.restoreApplied, false);
  assert.equal(result.writeState, 'committed-verification-failed');
  assert.equal(result.recoveryRequired, true);
  assert.equal(result.recordsMayHaveBeenWritten.length, 1);
});

test('W637 backup truth does not misrepresent an unkeyed transport digest as authenticity', () => {
  const truth = getEncryptedPortableBackupTruth();
  assert.equal(truth.integrityScope, 'transport-corruption-detection-not-authenticity');
  assert.equal(truth.atomicAddOnlyRestore, true);
  assert.equal(truth.reviewedPreviewRequired, true);
  assert.equal(truth.postVerificationFailureIsExplicit, true);
  assert.equal(truth.automaticCloudSync, false);
});
