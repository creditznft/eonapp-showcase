/** A15 I07 — verified, inventory-driven deletion of local EONAPP browser data. */

import {
  EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
  EON_DATA_SURVIVAL_INVENTORY_SCHEMA,
  buildEonDataSurvivalInventory,
  isEonAppOwnedCacheName,
  isEonAppOwnedSessionKey
} from './eon-data-survival-inventory.js';
import { isEonAppOwnedStorageKey } from '../vault/eon-vault-lifecycle.js';
import { W145_INDEXEDDB_PROTECTED_DATABASES } from '../utils/update-safe-user-data.js';

export const EON_DATA_SURVIVAL_DELETION_RECEIPT_SCHEMA = 'eonapp.data-survival.deletion-receipt.a15.i07.v1';

const freeze = (value) => Object.freeze(value);
const iso = (value = Date.now()) => new Date(Number(value)).toISOString();

function storageKeys(storage = null) {
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

function removeAndVerify(storage, key) {
  try {
    storage?.removeItem?.(key);
    return storage?.getItem?.(key) === null;
  } catch { return false; }
}

function deleteDatabase(indexedDb, name, deleteDatabaseFn = null) {
  if (typeof deleteDatabaseFn === 'function') return Promise.resolve(deleteDatabaseFn(name));
  if (typeof indexedDb?.deleteDatabase !== 'function') return Promise.resolve({ ok: false, reason: 'indexeddb-delete-unavailable' });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };
    let request;
    try { request = indexedDb.deleteDatabase(name); } catch { finish({ ok: false, reason: 'indexeddb-delete-threw' }); return; }
    request.onsuccess = () => finish({ ok: true });
    request.onerror = () => finish({ ok: false, reason: 'indexeddb-delete-failed' });
    request.onblocked = () => finish({ ok: false, reason: 'indexeddb-delete-blocked' });
  });
}

async function listDatabaseNames(indexedDb, explicitNames = null) {
  if (Array.isArray(explicitNames)) return [...new Set(explicitNames.map(String))].sort();
  if (typeof indexedDb?.databases !== 'function') return null;
  try { return [...new Set((await indexedDb.databases()).map((row) => String(row?.name || '')).filter(Boolean))].sort(); } catch { return null; }
}

async function listCacheNames(cacheStorage, explicitNames = null) {
  if (Array.isArray(explicitNames)) return [...new Set(explicitNames.map(String))].sort();
  if (typeof cacheStorage?.keys !== 'function') return [];
  try { return [...new Set((await cacheStorage.keys()).map(String))].sort(); } catch { return []; }
}

export async function clearEonAppDataInventory(options = {}) {
  if (String(options.confirmation || '') !== EON_DATA_SURVIVAL_CLEAR_CONFIRMATION) {
    return freeze({ ok: false, reason: 'confirmation-required', confirmationRequired: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION, removed: freeze({}) });
  }
  if (options.backupAcknowledged !== true) {
    return freeze({ ok: false, reason: 'backup-acknowledgement-required', confirmationRequired: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION, removed: freeze({}) });
  }

  const localStorage = options.localStorage || options.storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  const indexedDb = options.indexedDb || globalThis.indexedDB;
  const cacheStorage = options.caches || globalThis.caches;
  const before = await buildEonDataSurvivalInventory({
    localStorage,
    sessionStorage,
    indexedDb,
    caches: cacheStorage,
    indexedDbNames: options.indexedDbNames,
    cacheNames: options.cacheNames,
    now: options.now
  });

  const localKeys = storageKeys(localStorage).filter(isEonAppOwnedStorageKey);
  const sessionKeys = storageKeys(sessionStorage).filter(isEonAppOwnedSessionKey);
  const localFailures = localKeys.filter((key) => !removeAndVerify(localStorage, key));
  const sessionFailures = sessionKeys.filter((key) => !removeAndVerify(sessionStorage, key));

  const declaredDatabases = [...new Set(W145_INDEXEDDB_PROTECTED_DATABASES.map((entry) => entry.name))].sort();
  const databaseResults = [];
  for (const name of declaredDatabases) {
    const result = await deleteDatabase(indexedDb, name, options.deleteDatabase);
    databaseResults.push(freeze({ name, ok: result?.ok === true, reason: result?.reason || null }));
  }

  const observedCaches = await listCacheNames(cacheStorage, options.cacheNames);
  const ownedCaches = observedCaches.filter(isEonAppOwnedCacheName);
  const cacheResults = [];
  for (const name of ownedCaches) {
    let ok = false;
    try { ok = await cacheStorage.delete(name); } catch {}
    cacheResults.push(freeze({ name, ok: ok === true }));
  }

  const remainingLocal = storageKeys(localStorage).filter(isEonAppOwnedStorageKey);
  const remainingSession = storageKeys(sessionStorage).filter(isEonAppOwnedSessionKey);
  const afterDatabaseNames = await listDatabaseNames(indexedDb, options.afterIndexedDbNames);
  const remainingDatabases = afterDatabaseNames === null
    ? databaseResults.filter((row) => !row.ok).map((row) => row.name)
    : afterDatabaseNames.filter((name) => declaredDatabases.includes(name));
  const afterCacheNames = typeof cacheStorage?.keys === 'function' ? await listCacheNames(cacheStorage, options.afterCacheNames) : [];
  const remainingCaches = afterCacheNames.filter(isEonAppOwnedCacheName);
  const undeclaredResidue = [
    ...remainingLocal.map((key) => `localStorage:${key}`),
    ...remainingSession.map((key) => `sessionStorage:${key}`),
    ...remainingDatabases.map((name) => `IndexedDB:${name}`),
    ...remainingCaches.map((name) => `CacheStorage:${name}`)
  ];
  const failures = [
    ...localFailures.map((key) => `localStorage:${key}`),
    ...sessionFailures.map((key) => `sessionStorage:${key}`),
    ...databaseResults.filter((row) => !row.ok).map((row) => `IndexedDB:${row.name}:${row.reason || 'delete-failed'}`),
    ...cacheResults.filter((row) => !row.ok).map((row) => `CacheStorage:${row.name}`)
  ];
  const ok = failures.length === 0 && undeclaredResidue.length === 0;

  return freeze({
    ok,
    schema: EON_DATA_SURVIVAL_DELETION_RECEIPT_SCHEMA,
    inventorySchema: before.schema || EON_DATA_SURVIVAL_INVENTORY_SCHEMA,
    clearedAt: iso(options.now || Date.now()),
    removed: freeze({
      localStorage: localKeys.length - localFailures.length,
      sessionStorage: sessionKeys.length - sessionFailures.length,
      indexedDb: databaseResults.filter((row) => row.ok).length,
      caches: cacheResults.filter((row) => row.ok).length
    }),
    declaredBefore: before.counts,
    failures: freeze(failures),
    undeclaredResidue: freeze(undeclaredResidue),
    zeroUndeclaredResidue: undeclaredResidue.length === 0,
    unrelatedSameOriginStoragePreserved: true,
    providerSideAccountsDeleted: false,
    rawValuesIncluded: false,
    receiptPersistedLocally: false,
    warning: 'This receipt proves only the declared EONAPP data removed from this browser origin. Provider-side accounts, Drive files and user-saved exports require separate deletion.'
  });
}

export function getEonDataSurvivalDeletionTruth() {
  return freeze({
    schema: EON_DATA_SURVIVAL_DELETION_RECEIPT_SCHEMA,
    typedConfirmationRequired: EON_DATA_SURVIVAL_CLEAR_CONFIRMATION,
    backupAcknowledgementRequired: true,
    localStorage: 'owned-keys-only',
    sessionStorage: 'owned-keys-only',
    indexedDb: 'declared-databases',
    cacheStorage: 'owned-cache-prefixes-only',
    verificationRequired: true,
    receiptPersistedLocally: false,
    externalDeletionClaim: false
  });
}
