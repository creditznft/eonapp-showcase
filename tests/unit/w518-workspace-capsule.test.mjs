import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  collectWorkspaceCapsuleEntries,
  createWorkspaceCapsule,
  createWorkspaceCapsuleJournalForRecoveryTest,
  createWorkspaceCapsuleRestoreSession,
  EON_WORKSPACE_CAPSULE_LEGACY_VERSION,
  EON_WORKSPACE_CAPSULE_VERSION,
  EON_WORKSPACE_CAPSULE_CONFIRMATION,
  EON_WORKSPACE_CAPSULE_JOURNAL_KEY,
  EON_WORKSPACE_CAPSULE_RECEIPT_KEY,
  inspectWorkspaceCapsule,
  recoverPendingWorkspaceCapsule,
  serializeWorkspaceCapsule
} from '../../assets/js/local-first/eon-workspace-capsule.js';

const cryptoApi = webcrypto;
const passphrase = 'a deliberately long Capsule test passphrase';

class MemoryStorage {
  constructor(entries = [], { failOnSetCall = 0 } = {}) {
    this.values = new Map(entries.map(([key, value]) => [key, String(value)]));
    this.failOnSetCall = failOnSetCall;
    this.setCalls = 0;
  }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) {
    this.setCalls += 1;
    if (this.failOnSetCall && this.setCalls === this.failOnSetCall) {
      const error = new Error('simulated full storage');
      error.name = 'QuotaExceededError';
      throw error;
    }
    this.values.set(String(key), String(value));
  }
  removeItem(key) { this.values.delete(String(key)); }
  key(index) { return [...this.values.keys()].sort()[index] ?? null; }
  get length() { return this.values.size; }
}

async function fixture() {
  return createWorkspaceCapsule({
    entries: [
      { key: 'eon:projects:alpha', value: JSON.stringify({ title: 'local project' }) },
      { key: 'eon:settings:theme', value: 'graphite' }
    ],
    passphrase,
    now: 1_770_000_000_000,
    cryptoApi
  });
}

test('W518 creates a passphrase-encrypted Capsule whose public header never exposes workspace values', async () => {
  const capsule = await fixture();
  const serialized = serializeWorkspaceCapsule(capsule);
  assert.equal(serialized.includes('local project'), false);
  assert.equal(serialized.includes(passphrase), false);
  assert.equal(capsule.manifest.recordCount, 2);

  const inspected = await inspectWorkspaceCapsule(serialized, { passphrase, cryptoApi });
  assert.equal(inspected.ok, true);
  assert.deepEqual(inspected.entries.map((entry) => entry.key), ['eon:projects:alpha', 'eon:settings:theme']);
  assert.equal(JSON.stringify(inspected).includes('local project'), false);

  const wrong = await inspectWorkspaceCapsule(serialized, { passphrase: 'the wrong but still long passphrase', cryptoApi });
  assert.equal(wrong.ok, false);

  const tampered = structuredClone(capsule);
  tampered.ciphertext = `${tampered.ciphertext.slice(0, -1)}${tampered.ciphertext.endsWith('A') ? 'B' : 'A'}`;
  assert.equal((await inspectWorkspaceCapsule(tampered, { passphrase, cryptoApi })).ok, false);

  const future = structuredClone(capsule);
  future.version = 3;
  assert.equal((await inspectWorkspaceCapsule(future, { passphrase, cryptoApi })).ok, false);
});


test('W536 emits compression metadata before encryption, imports v1 Capsules, and fails closed on unsupported future formats', async () => {
  const repeated = 'local-only-compression-proof-'.repeat(2_000);
  const compressed = await createWorkspaceCapsule({
    entries: [{ key: 'eon:projects:compression-proof', value: repeated }],
    passphrase,
    now: 1_770_000_000_500,
    cryptoApi
  });
  assert.equal(compressed.version, EON_WORKSPACE_CAPSULE_VERSION);
  assert.ok(compressed.compression);
  assert.equal(compressed.compression.uncompressedBytes > 0, true);
  assert.equal(compressed.compression.compressedBytes > 0, true);
  assert.equal(compressed.compression.algorithm, typeof CompressionStream === 'function' ? 'gzip' : 'none');
  if (compressed.compression.algorithm === 'gzip') assert.equal(compressed.compression.compressedBytes < compressed.compression.uncompressedBytes, true);
  assert.equal(JSON.stringify(compressed).includes(repeated), false);
  const openedCompressed = await inspectWorkspaceCapsule(compressed, { passphrase, cryptoApi });
  assert.equal(openedCompressed.ok, true);
  assert.deepEqual(openedCompressed.entries.map((entry) => entry.key), ['eon:projects:compression-proof']);

  const legacy = await createWorkspaceCapsule({
    entries: [{ key: 'eon:settings:theme', value: 'graphite' }],
    passphrase,
    now: 1_770_000_000_600,
    formatVersion: EON_WORKSPACE_CAPSULE_LEGACY_VERSION,
    cryptoApi
  });
  assert.equal(legacy.version, EON_WORKSPACE_CAPSULE_LEGACY_VERSION);
  assert.equal(Object.hasOwn(legacy, 'compression'), false);
  assert.equal((await inspectWorkspaceCapsule(legacy, { passphrase, cryptoApi })).ok, true);

  const tamperedCompression = structuredClone(compressed);
  tamperedCompression.compression.algorithm = tamperedCompression.compression.algorithm === 'gzip' ? 'none' : 'gzip';
  assert.equal((await inspectWorkspaceCapsule(tamperedCompression, { passphrase, cryptoApi })).ok, false);

  const unsupported = structuredClone(compressed);
  unsupported.version = 99;
  assert.equal((await inspectWorkspaceCapsule(unsupported, { passphrase, cryptoApi })).ok, false);
});

test('W536 falls back to encrypted-uncompressed v2 Capsules when the browser lacks compression streams', async () => {
  const original = globalThis.CompressionStream;
  try {
    Object.defineProperty(globalThis, 'CompressionStream', { value: undefined, configurable: true, writable: true });
    const capsule = await createWorkspaceCapsule({
      entries: [{ key: 'eon:settings:theme', value: 'graphite' }],
      passphrase,
      now: 1_770_000_000_700,
      cryptoApi
    });
    assert.equal(capsule.version, EON_WORKSPACE_CAPSULE_VERSION);
    assert.deepEqual(capsule.compression, { algorithm: 'none', uncompressedBytes: capsule.compression.uncompressedBytes, compressedBytes: capsule.compression.uncompressedBytes });
    assert.equal((await inspectWorkspaceCapsule(capsule, { passphrase, cryptoApi })).ok, true);
  } finally {
    Object.defineProperty(globalThis, 'CompressionStream', { value: original, configurable: true, writable: true });
  }
});

test('W518 excludes unapproved local storage and rejects duplicate Capsule records before encryption', async () => {
  const storage = new MemoryStorage([
    ['eon:projects:alpha', '{"title":"local"}'],
    ['eon:api-key:provider', 'do-not-export'],
    ['eon:reward:campaign', 'do-not-export'],
    ['unrelated-same-origin-key', 'do-not-export']
  ]);
  assert.deepEqual(collectWorkspaceCapsuleEntries({ storage }).map((entry) => entry.key), ['eon:projects:alpha']);
  await assert.rejects(
    createWorkspaceCapsule({
      entries: [
        { key: 'eon:projects:alpha', value: 'a' },
        { key: 'eon:projects:alpha', value: 'b' }
      ],
      passphrase,
      cryptoApi
    }),
    /duplicate key/
  );
});

test('W518 stages only key/byte metadata, defaults to add-only, and requires an explicit per-key overwrite', async () => {
  const storage = new MemoryStorage([['eon:settings:theme', 'obsidian']]);
  const session = createWorkspaceCapsuleRestoreSession({ storage, cryptoApi, now: () => 1_770_000_000_100 });
  const staged = await session.stageCapsule(await fixture(), { passphrase });
  assert.equal(JSON.stringify(staged).includes('local project'), false);
  assert.deepEqual(staged.changes.map((row) => [row.key, row.status]), [
    ['eon:projects:alpha', 'add'],
    ['eon:settings:theme', 'conflict']
  ]);
  assert.throws(() => session.choose(staged.stageId, [{ key: 'eon:settings:theme', action: 'add' }]), /requires explicit overwrite/);
  const selected = session.choose(staged.stageId, [{ key: 'eon:projects:alpha', action: 'add' }]);
  const denied = await session.commit(selected.stageId, { confirmation: 'not the phrase' });
  assert.equal(denied.ok, false);
  assert.equal(storage.getItem('eon:projects:alpha'), null);

  const completed = await session.commit(selected.stageId, { confirmation: EON_WORKSPACE_CAPSULE_CONFIRMATION });
  assert.equal(completed.ok, true);
  assert.equal(storage.getItem('eon:projects:alpha'), '{"title":"local project"}');
  assert.equal(storage.getItem('eon:settings:theme'), 'obsidian');
  assert.ok(storage.getItem(EON_WORKSPACE_CAPSULE_RECEIPT_KEY));
});

test('W518 detects local drift before journaling and changes no record', async () => {
  const storage = new MemoryStorage();
  const session = createWorkspaceCapsuleRestoreSession({ storage, cryptoApi });
  const staged = await session.stageCapsule(await fixture(), { passphrase });
  const selected = session.choose(staged.stageId, [{ key: 'eon:projects:alpha', action: 'add' }]);
  storage.setItem('eon:projects:alpha', 'other tab changed it');
  const result = await session.commit(selected.stageId, { confirmation: EON_WORKSPACE_CAPSULE_CONFIRMATION });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'local-state-changed-reinspect-required');
  assert.equal(storage.getItem('eon:projects:alpha'), 'other tab changed it');
  assert.equal(storage.getItem(EON_WORKSPACE_CAPSULE_JOURNAL_KEY), null);
});

test('W518 returns no partial success and restores every selected pre-write value after an injected data-write failure', async () => {
  // set #1 = encrypted journal; set #2 = first selected record; set #3 fails.
  const storage = new MemoryStorage([['eon:settings:theme', 'obsidian']], { failOnSetCall: 3 });
  const session = createWorkspaceCapsuleRestoreSession({ storage, cryptoApi });
  const staged = await session.stageCapsule(await fixture(), { passphrase });
  const selected = session.choose(staged.stageId, [
    { key: 'eon:projects:alpha', action: 'add' },
    { key: 'eon:settings:theme', action: 'overwrite' }
  ]);
  const result = await session.commit(selected.stageId, { confirmation: EON_WORKSPACE_CAPSULE_CONFIRMATION });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'atomic-commit-failed-rolled-back');
  assert.equal(storage.getItem('eon:projects:alpha'), null);
  assert.equal(storage.getItem('eon:settings:theme'), 'obsidian');
  assert.equal(storage.getItem(EON_WORKSPACE_CAPSULE_RECEIPT_KEY), null);
});

test('W518 fails closed before writes when journal persistence cannot start', async () => {
  const storage = new MemoryStorage([], { failOnSetCall: 1 });
  const session = createWorkspaceCapsuleRestoreSession({ storage, cryptoApi });
  const staged = await session.stageCapsule(await fixture(), { passphrase });
  const selected = session.choose(staged.stageId, [{ key: 'eon:projects:alpha', action: 'add' }]);
  const result = await session.commit(selected.stageId, { confirmation: EON_WORKSPACE_CAPSULE_CONFIRMATION });
  assert.equal(result.ok, false);
  assert.match(result.reason, /^journal-write-failed:/);
  assert.equal(storage.getItem('eon:projects:alpha'), null);
  assert.equal(storage.getItem(EON_WORKSPACE_CAPSULE_JOURNAL_KEY), null);
});

test('W518 crash recovery rolls a pending encrypted journal back exactly and preserves it on a wrong passphrase', async () => {
  const journal = await createWorkspaceCapsuleJournalForRecoveryTest({
    before: [{ key: 'eon:projects:alpha', value: 'before' }],
    operations: [{ key: 'eon:projects:alpha', value: 'after', action: 'overwrite' }],
    passphrase,
    now: 1_770_000_000_200,
    cryptoApi
  });
  const storage = new MemoryStorage([
    ['eon:projects:alpha', 'after'],
    [EON_WORKSPACE_CAPSULE_JOURNAL_KEY, JSON.stringify(journal)]
  ]);
  const denied = await recoverPendingWorkspaceCapsule({ storage, passphrase: 'wrong but still sufficiently long', cryptoApi });
  assert.equal(denied.ok, false);
  assert.equal(storage.getItem('eon:projects:alpha'), 'after');
  assert.ok(storage.getItem(EON_WORKSPACE_CAPSULE_JOURNAL_KEY));

  const recovered = await recoverPendingWorkspaceCapsule({ storage, passphrase, cryptoApi });
  assert.equal(recovered.ok, true);
  assert.equal(recovered.action, 'rolled-back');
  assert.equal(storage.getItem('eon:projects:alpha'), 'before');
  assert.equal(storage.getItem(EON_WORKSPACE_CAPSULE_JOURNAL_KEY), null);
});

test('W518 treats legacy Vault snapshots as inspect-only inputs and records their source only after atomic selection', async () => {
  const storage = new MemoryStorage();
  const session = createWorkspaceCapsuleRestoreSession({ storage, cryptoApi });
  const staged = await session.stageLegacyVaultSnapshot({ storage: { 'eon:projects:alpha': 'legacy value', 'eon:api-key:legacy': 'excluded' } }, { passphrase });
  assert.equal(staged.sourceFormat, 'legacy-eon-vault-import');
  assert.deepEqual(staged.changes.map((entry) => entry.key), ['eon:projects:alpha']);
  const selected = session.choose(staged.stageId, [{ key: 'eon:projects:alpha', action: 'add' }]);
  const result = await session.commit(selected.stageId, { confirmation: EON_WORKSPACE_CAPSULE_CONFIRMATION });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.sourceFormat, 'legacy-eon-vault-import');
  assert.equal(storage.getItem('eon:projects:alpha'), 'legacy value');
});
