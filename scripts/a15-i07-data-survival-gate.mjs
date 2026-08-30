#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_CACHE_PREFIXES,
  EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
  buildEonDataSurvivalInventory,
  createEonDataSurvivalCoverageReceipt
} from '../assets/js/data-survival/eon-data-survival-inventory.js';
import { clearEonAppDataInventory } from '../assets/js/data-survival/eon-data-survival-deletion.js';
import { getCreatorMediaBundleTruth } from '../assets/js/data-survival/eon-creator-media-bundle.js';
import { W145_INDEXEDDB_PROTECTED_DATABASES } from '../assets/js/utils/update-safe-user-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

function cacheStorage(seed = []) {
  const names = new Set(seed);
  return { async keys() { return [...names]; }, async delete(name) { return names.delete(name); } };
}

const localStorage = new MemoryStorage({
  'eon:projects:v3': '{"project":"private-not-in-receipt"}',
  'eon:api-key-vault:v1': '{"ciphertext":"private-not-in-receipt"}',
  'foreign:key': 'preserve'
});
const sessionStorage = new MemoryStorage({ 'eon:chat:prefill:v1': 'private-not-in-receipt', foreign: 'preserve' });
const databaseNames = W145_INDEXEDDB_PROTECTED_DATABASES.map((entry) => entry.name);
const caches = cacheStorage(['eonapp-shell-gate', 'eonapp-offline-pack-gate', 'foreign-cache']);
const indexedDb = { async databases() { return databaseNames.map((name) => ({ name })); } };

const inventory = await buildEonDataSurvivalInventory({
  localStorage,
  sessionStorage,
  indexedDbNames: databaseNames,
  cacheNames: await caches.keys(),
  now: Date.parse('2026-08-04T00:00:00.000Z')
});
const coverage = createEonDataSurvivalCoverageReceipt(inventory, { now: Date.parse('2026-08-04T00:00:00.000Z') });
assert(coverage.complete, `Coverage is incomplete: ${JSON.stringify(coverage)}`);
assert(inventory.valuesIncluded === false && !JSON.stringify(inventory).includes('private-not-in-receipt'), 'Inventory exposed private record values.');

const truth = getCreatorMediaBundleTruth();
assert(truth.encrypted === true && truth.rawMediaIncluded === true, 'Creator raw media is not covered by an encrypted bundle.');
assert(truth.WorkspaceCapsuleIncludesRawMedia === false, 'Raw media was incorrectly merged into Workspace Capsule.');
assert(truth.inspectBeforeApply === true && truth.destructiveOverwriteDefault === false, 'Media restore is not inspect-first/add-only.');
assert(truth.passphrasePersisted === false && truth.automaticUpload === false, 'Media bundle violates local user-held custody.');

const dbSet = new Set(databaseNames);
const deleted = new Set();
const deletion = await clearEonAppDataInventory({
  confirmation: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
  backupAcknowledged: true,
  localStorage,
  sessionStorage,
  indexedDb,
  caches,
  indexedDbNames: databaseNames,
  deleteDatabase: async (name) => { deleted.add(name); dbSet.delete(name); return { ok: true }; },
  afterIndexedDbNames: [],
  now: Date.parse('2026-08-04T00:01:00.000Z')
});
assert(deletion.ok && deletion.zeroUndeclaredResidue, `Deletion did not verify zero residue: ${JSON.stringify(deletion)}`);
assert(localStorage.getItem('foreign:key') === 'preserve' && sessionStorage.getItem('foreign') === 'preserve', 'Deletion changed unrelated same-origin data.');
assert(deleted.size === databaseNames.length, 'Deletion did not cover every declared IndexedDB database.');
assert((await caches.keys()).length === 1 && (await caches.keys())[0] === 'foreign-cache', 'Deletion did not preserve only the unrelated cache.');

const capsuleHtml = read('capsule.html');
const capsulePage = read('assets/js/local-first/eon-workspace-capsule-page.js');
const mediaSource = read('assets/js/data-survival/eon-creator-media-bundle.js');
const inventorySource = read('assets/js/data-survival/eon-data-survival-inventory.js');
const deletionSource = read('assets/js/data-survival/eon-data-survival-deletion.js');
const swSource = read('sw.js');

for (const token of ['A15 Data Survival Centre', 'eon-media-bundle-export', 'eon-media-bundle-inspect', 'eon-media-bundle-commit', 'eon-data-survival-clear']) {
  assert(capsuleHtml.includes(token), `Capsule Data Survival control is missing: ${token}`);
}
for (const token of ['createCreatorMediaBundle', 'createCreatorMediaBundleRestoreSession', 'clearEonAppDataInventory', 'renderDataSurvivalCoverage']) {
  assert(capsulePage.includes(token), `Capsule page is not connected to I07 authority: ${token}`);
}
for (const token of ['AES-GCM', 'PBKDF2', 'sha256', 'restore-failed-rolled-back', 'explicit-confirmation-required']) {
  assert(mediaSource.includes(token), `Creator media bundle invariant is missing: ${token}`);
}
assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(mediaSource), 'Creator media bundle contains a network execution path.');
assert(inventorySource.includes('valuesIncluded: false') && deletionSource.includes('zeroUndeclaredResidue'), 'Inventory/deletion receipt privacy invariants are missing.');
for (const prefix of EONAPP_CACHE_PREFIXES) assert(swSource.includes(prefix), `Data Survival cache prefix is not owned by the service worker: ${prefix}`);
for (const entry of W145_INDEXEDDB_PROTECTED_DATABASES) assert(inventory.items.some((item) => item.medium === 'IndexedDB' && item.name === entry.name), `Protected IndexedDB database is missing from inventory: ${entry.name}`);

const receipt = {
  schema: 'eonapp.a15.i07.data-survival-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I07',
  passed: true,
  coverage: {
    complete: coverage.complete,
    itemCount: coverage.itemCount,
    protectionClasses: inventory.declaredProtectionClasses,
    undeclaredItems: coverage.undeclaredItems
  },
  creatorMedia: {
    encrypted: truth.encrypted,
    rawMediaIncluded: truth.rawMediaIncluded,
    workspaceCapsuleIncludesRawMedia: truth.WorkspaceCapsuleIncludesRawMedia,
    inspectBeforeApply: truth.inspectBeforeApply,
    digestVerified: truth.digestVerified,
    rollbackPrepared: truth.mediaRollbackPrepared
  },
  deletion: {
    ok: deletion.ok,
    removed: deletion.removed,
    zeroUndeclaredResidue: deletion.zeroUndeclaredResidue,
    unrelatedSameOriginStoragePreserved: deletion.unrelatedSameOriginStoragePreserved
  },
  uiConnected: true,
  networkExecutionAdded: false,
  rawValuesIncluded: false
};
const output = path.join(root, 'docs/institutional/a15/evidence/A15_I07_DATA_SURVIVAL_GATE_RECEIPT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I07] PASS: coverage=${coverage.itemCount} classified items; media encrypted=${truth.encrypted}; deletion residue=${deletion.undeclaredResidue.length}.`);
