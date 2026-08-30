import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

import {
  EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
  buildEonDataSurvivalInventory,
  createEonDataSurvivalCoverageReceipt,
  createEonDataSurvivalMigrationReceipt
} from '../../assets/js/data-survival/eon-data-survival-inventory.js';
import {
  EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION,
  createCreatorMediaBundle,
  createCreatorMediaBundleRestoreSession,
  getCreatorMediaBundleTruth,
  serializeCreatorMediaBundle
} from '../../assets/js/data-survival/eon-creator-media-bundle.js';
import { clearEonAppDataInventory } from '../../assets/js/data-survival/eon-data-survival-deletion.js';

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

function asset(assetId, title = assetId) {
  return Object.freeze({
    assetId,
    versionId: 'v1',
    mediaKind: 'image',
    title,
    promptSavedByUser: false,
    providerId: 'local',
    rail: 'local-runtime',
    sourceJobId: '',
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z',
    mediaStoredLocally: true
  });
}

function blob(text, type = 'image/png') { return new Blob([new TextEncoder().encode(text)], { type }); }

function makeCacheStorage(seed = []) {
  const names = new Set(seed);
  return {
    async keys() { return [...names]; },
    async delete(name) { return names.delete(name); }
  };
}

test('I07 inventory classifies every persistence medium without exposing values', async () => {
  const localStorage = new MemoryStorage({
    'eon:projects:v3': '{"private":"body"}',
    'eon:api-key-vault:v1': '{"ciphertext":"hidden"}',
    'foreign:key': 'preserve'
  });
  const sessionStorage = new MemoryStorage({ 'eon:chat:prefill:v1': 'private prompt', foreign: 'preserve' });
  const inventory = await buildEonDataSurvivalInventory({
    localStorage,
    sessionStorage,
    indexedDbNames: ['eonapp-local-vault-v1', 'eonapp-creator-media-v1', 'eon-share-identity', 'eon-offline-db', 'eonapp-quantum-safe'],
    cacheNames: ['eonapp-shell-test', 'foreign-cache'],
    now: Date.parse('2026-08-04T00:00:00.000Z')
  });
  assert.equal(inventory.valuesIncluded, false);
  assert.equal(inventory.items.some((item) => item.name === 'eon:projects:v3' && item.protectionClass === 'workspace-capsule'), true);
  assert.equal(inventory.items.some((item) => item.name === 'eon:api-key-vault:v1' && item.protectionClass === 'local-only-excluded'), true);
  assert.equal(inventory.items.some((item) => item.name === 'eonapp-creator-media-v1' && item.protectionClass === 'creator-media-bundle'), true);
  assert.equal(inventory.items.some((item) => item.name === 'eonapp-local-vault-v1' && item.protectionClass === 'encrypted-secret-bundle'), true);
  assert.equal(inventory.items.some((item) => item.name === 'eon-share-identity' && item.protectionClass === 'device-bound-identity'), true);
  assert.equal(inventory.items.some((item) => item.name === 'eonapp-shell-test' && item.protectionClass === 'replaceable-cache'), true);
  assert.equal(JSON.stringify(inventory).includes('private prompt'), false);
  assert.equal(JSON.stringify(inventory).includes('ciphertext'), false);
  const coverage = createEonDataSurvivalCoverageReceipt(inventory);
  assert.equal(coverage.complete, true);
  assert.deepEqual(coverage.undeclaredItems, []);
});

test('I07 coverage fails closed for undeclared EONAPP IndexedDB or cache domains', async () => {
  const inventory = await buildEonDataSurvivalInventory({
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    indexedDbNames: ['eonapp-unknown-private-v1'],
    cacheNames: ['eon-unknown-cache']
  });
  const coverage = createEonDataSurvivalCoverageReceipt(inventory);
  assert.equal(coverage.complete, false);
  assert.deepEqual(coverage.undeclaredItems, ['indexeddb:eonapp-unknown-private-v1', 'cache:eon-unknown-cache']);
});

test('I07 encrypted Creator media bundle round-trips raw bytes and rejects transport tampering', async () => {
  const media = new Map([['asset-one', { blob: blob('real raw media') }]]);
  const bundle = await createCreatorMediaBundle({
    assets: [asset('asset-one', 'One')],
    getMedia: async (id) => media.get(id),
    passphrase: 'correct horse battery staple',
    cryptoApi: webcrypto,
    now: Date.parse('2026-08-04T00:00:00.000Z')
  });
  assert.equal(bundle.recordCount, 1);
  assert.equal(bundle.rawValuesVisibleInEnvelope, false);
  assert.equal(JSON.stringify(bundle).includes('real raw media'), false);

  const targetMedia = new Map();
  const targetAssets = new Map();
  const storage = new MemoryStorage({
    'eon:creator-library:v1': '{"schema":"fixture","assets":[]}',
    'eon:project-registry:a15:v1': '{"schema":"fixture","projects":[]}',
    'eon:library-index:a15:v1': '{"schema":"fixture","items":[]}'
  });
  const restore = createCreatorMediaBundleRestoreSession({
    storage,
    cryptoApi: webcrypto,
    listAssets: () => [...targetAssets.values()],
    getMedia: async (id) => targetMedia.get(id) || null,
    saveAsset: async (record, nextBlob) => {
      targetAssets.set(record.assetId, { ...record, mediaStoredLocally: true });
      targetMedia.set(record.assetId, { blob: nextBlob });
      storage.setItem('eon:creator-library:v1', JSON.stringify({ assets: [...targetAssets.values()] }));
      return { ok: true };
    },
    putMedia: async (id, nextBlob) => { targetMedia.set(id, { blob: nextBlob }); return { ok: true }; },
    deleteMedia: async (id) => { targetMedia.delete(id); return { ok: true }; },
    now: Date.parse('2026-08-04T00:01:00.000Z')
  });
  const stage = await restore.stageBundle(serializeCreatorMediaBundle(bundle), { passphrase: 'correct horse battery staple' });
  assert.equal(stage.ok, true);
  assert.equal(stage.changes[0].status, 'add');
  const receipt = await restore.commit(stage.stageId, { confirmation: EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.restored, 1);
  assert.equal(await targetMedia.get('asset-one').blob.text(), 'real raw media');

  const tampered = { ...bundle, ciphertextSha256: `${bundle.ciphertextSha256[0] === '0' ? '1' : '0'}${bundle.ciphertextSha256.slice(1)}` };
  const second = createCreatorMediaBundleRestoreSession({ cryptoApi: webcrypto, listAssets: () => [], getMedia: async () => null });
  await assert.rejects(() => second.stageBundle(tampered, { passphrase: 'correct horse battery staple' }), /transport digest/i);
});

test('I07 Creator media restore requires explicit replace choice and rolls back metadata plus bytes on failure', async () => {
  const sourceMedia = new Map([
    ['asset-one', { blob: blob('new-one') }],
    ['asset-two', { blob: blob('new-two') }]
  ]);
  const bundle = await createCreatorMediaBundle({
    assets: [asset('asset-one'), asset('asset-two')],
    getMedia: async (id) => sourceMedia.get(id),
    passphrase: 'restore failure rollback passphrase',
    cryptoApi: webcrypto
  });
  const oldOne = blob('old-one');
  const targetMedia = new Map([['asset-one', { blob: oldOne }]]);
  const targetAssets = new Map([['asset-one', { ...asset('asset-one'), mediaStoredLocally: true }]]);
  const initialStorage = '{"before":"exact"}';
  const storage = new MemoryStorage({
    'eon:creator-library:v1': initialStorage,
    'eon:project-registry:a15:v1': 'registry-before',
    'eon:library-index:a15:v1': 'library-before'
  });
  let calls = 0;
  const restore = createCreatorMediaBundleRestoreSession({
    storage,
    cryptoApi: webcrypto,
    listAssets: () => [...targetAssets.values()],
    getMedia: async (id) => targetMedia.get(id) || null,
    saveAsset: async (record, nextBlob) => {
      calls += 1;
      targetMedia.set(record.assetId, { blob: nextBlob });
      storage.setItem('eon:creator-library:v1', `changed-${calls}`);
      return calls === 2 ? { ok: false, reason: 'injected-failure' } : { ok: true };
    },
    putMedia: async (id, nextBlob) => { targetMedia.set(id, { blob: nextBlob }); return { ok: true }; },
    deleteMedia: async (id) => { targetMedia.delete(id); return { ok: true }; }
  });
  const stage = await restore.stageBundle(bundle, { passphrase: 'restore failure rollback passphrase' });
  assert.equal(stage.changes.find((row) => row.assetId === 'asset-one').status, 'replace');
  assert.equal(stage.changes.find((row) => row.assetId === 'asset-one').selectedAction, 'skip');
  const chosen = restore.choose(stage.stageId, [
    { assetId: 'asset-one', action: 'replace' },
    { assetId: 'asset-two', action: 'add' }
  ]);
  assert.equal(chosen.ok, true);
  const failed = await restore.commit(stage.stageId, { confirmation: EON_CREATOR_MEDIA_BUNDLE_CONFIRMATION });
  assert.equal(failed.ok, false);
  assert.equal(failed.rolledBack, true);
  assert.equal(storage.getItem('eon:creator-library:v1'), initialStorage);
  assert.equal(storage.getItem('eon:project-registry:a15:v1'), 'registry-before');
  assert.equal(storage.getItem('eon:library-index:a15:v1'), 'library-before');
  assert.equal(await targetMedia.get('asset-one').blob.text(), 'old-one');
  assert.equal(targetMedia.has('asset-two'), false);
});

test('I07 clear local data requires backup acknowledgement and removes all declared browser stores with zero residue', async () => {
  const localStorage = new MemoryStorage({ 'eon:projects:v3': 'private', 'foreign:key': 'preserve' });
  const sessionStorage = new MemoryStorage({ 'eon:chat:prefill:v1': 'private', foreign: 'preserve' });
  const databases = new Set(['eonapp-local-vault-v1', 'eonapp-creator-media-v1', 'eon-share-identity', 'eon-offline-db', 'eonapp-quantum-safe']);
  const indexedDb = { async databases() { return [...databases].map((name) => ({ name })); } };
  const caches = makeCacheStorage(['eonapp-shell-old', 'eonapp-offline-pack-old', 'foreign-cache']);
  const denied = await clearEonAppDataInventory({ confirmation: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION, backupAcknowledged: false, localStorage, sessionStorage, indexedDb, caches });
  assert.equal(denied.reason, 'backup-acknowledgement-required');
  const receipt = await clearEonAppDataInventory({
    confirmation: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
    backupAcknowledged: true,
    localStorage,
    sessionStorage,
    indexedDb,
    caches,
    deleteDatabase: async (name) => { databases.delete(name); return { ok: true }; }
  });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.zeroUndeclaredResidue, true);
  assert.deepEqual(receipt.undeclaredResidue, []);
  assert.equal(localStorage.getItem('eon:projects:v3'), null);
  assert.equal(localStorage.getItem('foreign:key'), 'preserve');
  assert.equal(sessionStorage.getItem('eon:chat:prefill:v1'), null);
  assert.equal(sessionStorage.getItem('foreign'), 'preserve');
  assert.deepEqual(await indexedDb.databases(), []);
  assert.deepEqual(await caches.keys(), ['foreign-cache']);
  assert.equal(receipt.receiptPersistedLocally, false);
});

test('I07 migration receipt binds Workspace, media and optional secret restore evidence without raw values', () => {
  const receipt = createEonDataSurvivalMigrationReceipt({
    before: { counts: { localStorageOwned: 4 } },
    after: { counts: { localStorageOwned: 4 } },
    workspaceReceipt: { ok: true },
    mediaReceipt: { ok: true, restored: 2 },
    secretReceipt: { ok: true }
  }, { expectedMediaRecords: 2, now: Date.parse('2026-08-04T00:00:00.000Z') });
  assert.equal(receipt.complete, true);
  assert.equal(receipt.rawValuesIncluded, false);
  assert.equal(receipt.rollbackRequired, false);
});

test('I07 truth does not merge raw media into the Workspace Capsule or persist passphrases', () => {
  const truth = getCreatorMediaBundleTruth();
  assert.equal(truth.WorkspaceCapsuleIncludesRawMedia, false);
  assert.equal(truth.rawMediaIncluded, true);
  assert.equal(truth.passphrasePersisted, false);
  assert.equal(truth.automaticUpload, false);
});

test('I07 Creator metadata export preserves over-cap legacy records and restore blocks instead of slicing', async () => {
  const { buildCreatorLibraryExport, inspectCreatorLibraryRestore, applyCreatorLibraryRestore, EON_CREATOR_RESTORE_CONFIRMATION } = await import('../../assets/js/create/creator-data-survival.js');
  const rows = Array.from({ length: 301 }, (_, index) => ({
    schema: 'eon.creator-library.w627d.v1',
    assetId: `legacy-${index}`,
    versionId: 'v1',
    mediaKind: 'image',
    title: `Legacy ${index}`,
    providerId: 'local',
    rail: 'guide',
    sha256: `digest-${index}`,
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-04T00:00:00.000Z'
  }));
  const source = new MemoryStorage({ 'eon:creator-library:v1': JSON.stringify({ schema: 'eon.creator-library.w627d.v1', assets: rows }) });
  const exported = buildCreatorLibraryExport({ storage: source });
  assert.equal(exported.assetCount, 301);
  assert.equal(exported.assets.length, 301);
  const target = new MemoryStorage();
  const before = target.getItem('eon:creator-library:v1');
  const preview = inspectCreatorLibraryRestore(exported, { storage: target });
  const result = applyCreatorLibraryRestore(preview, [], { storage: target, explicitUserAction: true, confirmation: EON_CREATOR_RESTORE_CONFIRMATION });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'capacity-reached');
  assert.equal(target.getItem('eon:creator-library:v1'), before);
});
