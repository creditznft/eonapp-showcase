/**
 * A15 I07 — one inventory-driven authority for local EONAPP data survival.
 *
 * The inventory never reads or exposes record values. It classifies each
 * browser persistence domain by backup, restore, migration and deletion
 * policy so a successful Workspace Capsule cannot be mistaken for complete
 * device recovery.
 */

import {
  listEonAppBackupEligibleKeys,
  listEonAppOwnedStorageKeys
} from '../vault/eon-vault-lifecycle.js';
import { W145_INDEXEDDB_PROTECTED_DATABASES } from '../utils/update-safe-user-data.js';
import { EON_CREATOR_MEDIA_DATABASE } from '../create/creator-library-store.js';
import { classifyEonOriginCache } from '../pwa/eon-origin-storage-authority.js';
import { getEonCityDataSurvivalRecord, getEonCityDataSurvivalManifestTruth } from '../contracts/city/eon-city-data-survival-manifest.js';

export const EON_DATA_SURVIVAL_INVENTORY_SCHEMA = 'eonapp.data-survival.inventory.a15.i07.v1';
export const EON_DATA_SURVIVAL_COVERAGE_SCHEMA = 'eonapp.data-survival.coverage-receipt.a15.i07.v1';
export const EON_DATA_SURVIVAL_MIGRATION_SCHEMA = 'eonapp.data-survival.migration-receipt.a15.i07.v1';
export const EON_DATA_SURVIVAL_CLEAR_CONFIRMATION = 'DELETE EONAPP DATA';

export const EONAPP_CACHE_PREFIXES = Object.freeze([
  'eonapp-shell-',
  'eonapp-assets-',
  'eonapp-pages-',
  'eonapp-city-assets-',
  'eonapp-offline-'
]);

export const EON_DATA_SURVIVAL_PROTECTION_CLASSES = Object.freeze(['workspace-capsule', 'local-only-excluded', 'ephemeral-session', 'creator-media-bundle', 'encrypted-secret-bundle', 'device-bound-identity', 'optional-local-runtime-data', 'replaceable-cache', 'durable-offline-cache']);

const SESSION_KEY_PREFIXES = Object.freeze(['eon:', 'eonapp:', 'eon-']);
const KNOWN_SESSION_KEYS = Object.freeze(new Set(['localRuntimeProfile']));

const freeze = (value) => Object.freeze(value);
const clean = (value = '', limit = 180) => String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit);
const iso = (value = Date.now()) => new Date(Number(value)).toISOString();

function keysOf(storage = null) {
  const keys = [];
  if (!storage) return keys;
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(String(key));
    }
  } catch {}
  return [...new Set(keys)].sort();
}

export function isEonAppOwnedSessionKey(key = '') {
  const value = String(key || '');
  return KNOWN_SESSION_KEYS.has(value) || SESSION_KEY_PREFIXES.some((prefix) => value.startsWith(prefix));
}

export function isEonAppOwnedCacheName(name = '') {
  const value = String(name || '');
  return EONAPP_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function declaredIndexedDbDomains() {
  const byName = new Map(W145_INDEXEDDB_PROTECTED_DATABASES.map((entry) => [entry.name, entry]));
  if (!byName.has(EON_CREATOR_MEDIA_DATABASE)) {
    byName.set(EON_CREATOR_MEDIA_DATABASE, { name: EON_CREATOR_MEDIA_DATABASE, purpose: 'optional local Creator media blobs' });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function indexedDbPolicy(name = '') {
  if (name === EON_CREATOR_MEDIA_DATABASE) {
    return freeze({ protectionClass: 'creator-media-bundle', backup: 'encrypted-media-bundle', restore: 'inspect-select-apply', migration: 'bundle-plus-metadata', deletion: 'delete-database-verified' });
  }
  if (name === 'eonapp-local-vault-v1' || name === 'eonapp-quantum-safe') {
    return freeze({ protectionClass: 'encrypted-secret-bundle', backup: 'separate-user-passphrase-export', restore: 'add-only-verified', migration: 'separate-encrypted-archive', deletion: 'delete-database-verified' });
  }
  if (name === 'eon-share-identity') {
    return freeze({ protectionClass: 'device-bound-identity', backup: 'not-portable-by-design', restore: 'regenerate-on-new-device', migration: 'new-device-identity', deletion: 'delete-database-verified' });
  }
  return freeze({ protectionClass: 'optional-local-runtime-data', backup: 'not-user-work', restore: 'rebuild-on-demand', migration: 'not-required', deletion: 'delete-database-verified' });
}

async function observedIndexedDbNames(indexedDb = globalThis.indexedDB, explicitNames = null) {
  if (Array.isArray(explicitNames)) return [...new Set(explicitNames.map(String))].sort();
  if (typeof indexedDb?.databases !== 'function') return [];
  try {
    const rows = await indexedDb.databases();
    return [...new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.name || '')).filter(Boolean))].sort();
  } catch { return []; }
}

async function observedCacheNames(cacheStorage = globalThis.caches, explicitNames = null) {
  if (Array.isArray(explicitNames)) return [...new Set(explicitNames.map(String))].sort();
  if (typeof cacheStorage?.keys !== 'function') return [];
  try { return [...new Set((await cacheStorage.keys()).map(String))].sort(); } catch { return []; }
}

export async function buildEonDataSurvivalInventory(options = {}) {
  const localStorage = options.localStorage || options.storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  const localOwned = listEonAppOwnedStorageKeys({ storage: localStorage });
  const localBackup = new Set(listEonAppBackupEligibleKeys({ storage: localStorage }));
  const sessionOwned = keysOf(sessionStorage).filter(isEonAppOwnedSessionKey);
  const declaredDatabases = declaredIndexedDbDomains();
  const observedDatabases = await observedIndexedDbNames(options.indexedDb, options.indexedDbNames);
  const cacheNames = await observedCacheNames(options.caches, options.cacheNames);
  const ownedCaches = cacheNames.filter(isEonAppOwnedCacheName);

  const localStorageItems = localOwned.map((key) => {
    const cityRecord = getEonCityDataSurvivalRecord(key);
    return freeze({
      id: `local-storage:${key}`,
      medium: 'localStorage',
      name: key,
      protectionClass: localBackup.has(key) ? 'workspace-capsule' : 'local-only-excluded',
      backup: cityRecord ? cityRecord.backup : localBackup.has(key) ? 'encrypted-workspace-capsule' : 'excluded-with-explicit-reason',
      restore: cityRecord ? cityRecord.restore : localBackup.has(key) ? 'inspect-select-atomic-apply' : 'not-restored-by-capsule',
      migration: cityRecord ? cityRecord.migration : localBackup.has(key) ? 'workspace-capsule' : 'separate-or-recreate',
      deletion: cityRecord ? cityRecord.deletion : 'remove-key-verified',
      cityStateAuthority: Boolean(cityRecord),
      cityDomain: cityRecord?.domain || null,
      citySchema: cityRecord?.schema || null,
      valueIncluded: false
    });
  });

  const sessionItems = sessionOwned.map((key) => freeze({
    id: `session-storage:${key}`,
    medium: 'sessionStorage',
    name: key,
    protectionClass: 'ephemeral-session',
    backup: 'not-persisted',
    restore: 'not-applicable',
    migration: 'not-applicable',
    deletion: 'remove-key-verified',
    valueIncluded: false
  }));

  const indexedDbItems = declaredDatabases.map((entry) => {
    const policy = indexedDbPolicy(entry.name);
    return freeze({
      id: `indexeddb:${entry.name}`,
      medium: 'IndexedDB',
      name: entry.name,
      purpose: clean(entry.purpose, 240),
      observed: observedDatabases.includes(entry.name),
      ...policy,
      valueIncluded: false
    });
  });

  const cacheItems = ownedCaches.map((name) => {
    const classification = classifyEonOriginCache(name);
    const durable = classification === 'durable-offline-cache';
    return freeze({
      id: `cache:${name}`,
      medium: 'CacheStorage',
      name,
      protectionClass: durable ? 'durable-offline-cache' : 'replaceable-cache',
      backup: durable ? 'offline-pack-integrity-manifest' : 'not-user-work',
      restore: durable ? 'verify-or-explicit-reinstall' : 'refetch-or-reinstall',
      migration: durable ? 'preserve-across-worker-activation' : 'not-required',
      deletion: durable ? 'explicit-user-uninstall-only' : 'delete-cache-verified',
      valueIncluded: false
    });
  });

  const undeclaredIndexedDb = observedDatabases.filter((name) => /^eon/i.test(name) && !declaredDatabases.some((entry) => entry.name === name));
  const undeclaredCaches = cacheNames.filter((name) => /^eon/i.test(name) && !isEonAppOwnedCacheName(name));
  const items = [...localStorageItems, ...sessionItems, ...indexedDbItems, ...cacheItems];

  return freeze({
    schema: EON_DATA_SURVIVAL_INVENTORY_SCHEMA,
    generatedAt: iso(options.now || Date.now()),
    valuesIncluded: false,
    items: freeze(items),
    counts: freeze({
      localStorageOwned: localStorageItems.length,
      localStorageCapsuleEligible: localStorageItems.filter((item) => item.protectionClass === 'workspace-capsule').length,
      sessionStorageOwned: sessionItems.length,
      indexedDbDeclared: indexedDbItems.length,
      indexedDbObserved: observedDatabases.filter((name) => declaredDatabases.some((entry) => entry.name === name)).length,
      cacheStorageOwned: cacheItems.length,
      cityStateDeclared: getEonCityDataSurvivalManifestTruth().recordCount,
      cityStateObserved: localStorageItems.filter((item) => item.cityStateAuthority).length,
      openWorldStateObserved: localStorageItems.filter((item) => item.cityDomain === 'open-world').length,
      total: items.length
    }),
    undeclared: freeze({ indexedDb: freeze(undeclaredIndexedDb), caches: freeze(undeclaredCaches) }),
    protectionClasses: freeze([...new Set(items.map((item) => item.protectionClass))].sort()),
    declaredProtectionClasses: EON_DATA_SURVIVAL_PROTECTION_CLASSES
  });
}

export function createEonDataSurvivalCoverageReceipt(inventory = {}, options = {}) {
  const items = Array.isArray(inventory?.items) ? inventory.items : [];
  const invalid = items.filter((item) => !item?.backup || !item?.restore || !item?.migration || !item?.deletion || item.valueIncluded !== false);
  const undeclared = [
    ...(Array.isArray(inventory?.undeclared?.indexedDb) ? inventory.undeclared.indexedDb.map((name) => `indexeddb:${name}`) : []),
    ...(Array.isArray(inventory?.undeclared?.caches) ? inventory.undeclared.caches.map((name) => `cache:${name}`) : [])
  ];
  const declaredClasses = Array.isArray(inventory?.declaredProtectionClasses) ? inventory.declaredProtectionClasses : [];
  const missingClasses = EON_DATA_SURVIVAL_PROTECTION_CLASSES.filter((name) => !declaredClasses.includes(name));
  const complete = invalid.length === 0 && undeclared.length === 0 && missingClasses.length === 0;
  return freeze({
    schema: EON_DATA_SURVIVAL_COVERAGE_SCHEMA,
    generatedAt: iso(options.now || Date.now()),
    inventorySchema: inventory?.schema || '',
    complete,
    itemCount: items.length,
    invalidPolicyItems: freeze(invalid.map((item) => clean(item?.id, 240))),
    undeclaredItems: freeze(undeclared),
    missingProtectionClasses: freeze(missingClasses),
    valuesIncluded: false,
    guarantees: freeze({
      oneInventory: true,
      workspaceCapsuleIsNotCompleteDeviceBackup: true,
      rawMediaHasSeparateEncryptedBundle: true,
      secretsHaveSeparateProtectionClass: true,
      deletionIsInventoryDriven: true
    })
  });
}

export function createEonDataSurvivalMigrationReceipt({ before = {}, after = {}, workspaceReceipt = null, mediaReceipt = null, secretReceipt = null } = {}, options = {}) {
  const beforeCounts = before?.counts || {};
  const afterCounts = after?.counts || {};
  const expectedLocal = Number(beforeCounts.localStorageOwned || 0);
  const expectedMedia = Number(options.expectedMediaRecords || 0);
  const migratedMedia = Number(mediaReceipt?.restored || mediaReceipt?.imported || 0);
  const localSatisfied = Number(afterCounts.localStorageOwned || 0) >= expectedLocal || workspaceReceipt?.ok === true;
  const mediaSatisfied = expectedMedia === 0 || migratedMedia === expectedMedia;
  const complete = localSatisfied && mediaSatisfied && (secretReceipt == null || secretReceipt.ok === true);
  return freeze({
    schema: EON_DATA_SURVIVAL_MIGRATION_SCHEMA,
    generatedAt: iso(options.now || Date.now()),
    complete,
    expected: freeze({ localStorageRecords: expectedLocal, creatorMediaRecords: expectedMedia }),
    observed: freeze({ localStorageRecords: Number(afterCounts.localStorageOwned || 0), creatorMediaRecords: migratedMedia }),
    workspaceRestoreVerified: workspaceReceipt?.ok === true,
    mediaRestoreVerified: mediaSatisfied,
    secretRestoreVerified: secretReceipt == null ? 'not-requested' : secretReceipt.ok === true,
    rawValuesIncluded: false,
    rollbackRequired: !complete
  });
}

export function getEonDataSurvivalInventoryTruth() {
  return freeze({
    schema: EON_DATA_SURVIVAL_INVENTORY_SCHEMA,
    oneInventory: true,
    valuesIncluded: false,
    workspaceCapsuleIsPartialByDesign: true,
    rawMediaUsesSeparateEncryptedBundle: true,
    encryptedSecretsRemainSeparate: true,
    accountIdentityIsNotBackup: true,
    deletionCoversLocalStorageSessionStorageIndexedDbAndCaches: true
  });
}
