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
  verifyEncryptedPortableBackup,
  serializeEncryptedPortableBackup,
  inspectEncryptedPortableBackupImport,
  importEncryptedPortableBackupToStore,
  runEncryptedPortableBackupRecoveryDrill,
  getEncryptedPortableBackupTruth
} from '../../assets/js/local-first/eon-portable-backup.js';
import { runW308PortableBackupGate } from '../../scripts/w308-portable-backup-gate.mjs';

const cryptoApi = webcrypto;

function memoryStore(seed = []) {
  const values = new Map(seed.map((item) => [item.recordId, structuredClone(item)]));
  return Object.freeze({
    async get(id) { return values.has(id) ? structuredClone(values.get(id)) : null; },
    async put(value) { values.set(value.recordId, structuredClone(value)); return { ok: true, recordId: value.recordId }; },
    async putManyIfAbsent(items = []) {
      if (items.some((item) => values.has(item.recordId))) throw Object.assign(new Error('conflict'), { code: 'atomic-restore-conflict' });
      for (const item of items) values.set(item.recordId, structuredClone(item));
      return { ok: true, recordIds: items.map((item) => item.recordId), atomic: true, overwritten: false };
    },
    async listRecordIds({ limit = 200 } = {}) { return [...values.keys()].sort().slice(0, limit); }
  });
}

async function makeFixtureEnvelope(value = { project: 'private local draft' }) {
  const salt = createLocalVaultSalt({ cryptoApi });
  const key = await deriveLocalVaultKey('a deliberate local vault passphrase', salt, { cryptoApi });
  const envelope = await sealLocalVaultRecord(value, { key, recordId: createLocalVaultRecordId({ cryptoApi }), cryptoApi, now: 1_770_000_000_000 });
  return { salt, envelope };
}

function mutateBase64Url(value = '') {
  const text = String(value || '');
  if (!text) return 'A';
  const last = text.at(-1);
  const replacement = last === 'A' ? 'B' : 'A';
  return `${text.slice(0, -1)}${replacement}`;
}

test('W308 creates an integrity-checked encrypted portable backup without a passphrase or plaintext record', async () => {
  const { salt, envelope } = await makeFixtureEnvelope({ prompt: 'do not leak this' });
  const profile = createLocalVaultProfile({ salt, now: 1_770_000_000_000 });
  const backup = await createEncryptedPortableBackup({ vaultProfile: profile, records: [envelope], now: 1_770_000_000_000, cryptoApi });
  const serialized = serializeEncryptedPortableBackup(backup);
  assert.equal(serialized.includes('do not leak this'), false);
  assert.equal(serialized.includes('local vault passphrase'), false);
  const verified = await verifyEncryptedPortableBackup(serialized, { cryptoApi });
  assert.equal(verified.ok, true);
  assert.equal(verified.backup.recordCount, 1);
  assert.equal(verified.backup.records[0].recordId, envelope.recordId);
});

test('W308 rejects tampering, requires an explicit import choice, and never overwrites a conflicting local record', async () => {
  const { salt, envelope } = await makeFixtureEnvelope();
  const profile = createLocalVaultProfile({ salt });
  const backup = await createEncryptedPortableBackup({ vaultProfile: profile, records: [envelope], cryptoApi });
  const tampered = structuredClone(backup);
  tampered.records[0].ciphertext = mutateBase64Url(tampered.records[0].ciphertext);
  assert.equal((await verifyEncryptedPortableBackup(tampered, { cryptoApi })).ok, false);

  const target = memoryStore();
  const denied = await importEncryptedPortableBackupToStore(backup, { store: target, cryptoApi });
  assert.equal(denied.ok, false);
  assert.equal(denied.reason, 'explicit-user-confirmation-required');
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: target, cryptoApi });
  assert.equal(preview.readyToApply, true);
  const accepted = await importEncryptedPortableBackupToStore(backup, { store: target, confirmedByUser: true, reviewedPreviewId: preview.previewId, cryptoApi });
  assert.equal(accepted.ok, true);
  assert.deepEqual(accepted.imported, [envelope.recordId]);

  const conflicting = structuredClone(envelope);
  conflicting.ciphertext = mutateBase64Url(conflicting.ciphertext);
  const conflictTarget = memoryStore([conflicting]);
  const conflictPreview = await inspectEncryptedPortableBackupImport(backup, { store: conflictTarget, cryptoApi });
  const conflict = await importEncryptedPortableBackupToStore(backup, { store: conflictTarget, confirmedByUser: true, reviewedPreviewId: conflictPreview.previewId, cryptoApi });
  assert.equal(conflict.ok, false);
  assert.deepEqual(conflict.conflicts, [envelope.recordId]);
  assert.equal(conflict.overwritten, false);
});

test('W308 recovery drill restores an encrypted backup into a separately empty local store', async () => {
  const { salt, envelope } = await makeFixtureEnvelope();
  const backup = await createEncryptedPortableBackup({ vaultProfile: createLocalVaultProfile({ salt }), records: [envelope], cryptoApi });
  const drill = await runEncryptedPortableBackupRecoveryDrill({ backup, emptyStore: memoryStore(), cryptoApi });
  assert.equal(drill.ok, true);
  assert.equal(drill.expected, 1);
  assert.equal(drill.imported, 1);
});

test('W308 local recovery truth and source gate remain fail-closed', () => {
  const truth = getEncryptedPortableBackupTruth();
  assert.equal(truth.directNetwork, false);
  assert.equal(truth.automaticCloudSync, false);
  assert.equal(truth.destructiveOverwrite, false);
  assert.equal(runW308PortableBackupGate().ok, true);
});
