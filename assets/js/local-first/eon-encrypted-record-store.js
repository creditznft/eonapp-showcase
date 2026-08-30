/**
 * W307/W308 — small IndexedDB envelope store for encrypted local records.
 *
 * The record store receives already-encrypted envelopes only. It cannot
 * decrypt them, does not know passphrases, and uses opaque record IDs rather
 * than titles, prompts, account names, or provider identity. W308 adds a
 * separate non-secret metadata store through the shared DB schema; this record
 * store remains envelope-only.
 */

import {
  EON_LOCAL_VAULT_DATABASE_NAME,
  EON_LOCAL_VAULT_DATABASE_VERSION,
  EON_LOCAL_VAULT_ENCRYPTED_RECORDS_STORE,
  ensureLocalVaultObjectStores
} from './local-vault-db-schema.js';

export const EON_ENCRYPTED_RECORD_STORE_SCHEMA = 'eonapp.encrypted-record-store.v1';
export const EON_ENCRYPTED_RECORD_STORE_DB = EON_LOCAL_VAULT_DATABASE_NAME;
export const EON_ENCRYPTED_RECORD_STORE_NAME = EON_LOCAL_VAULT_ENCRYPTED_RECORDS_STORE;

function getIndexedDb(indexedDb = null) {
  const api = indexedDb || globalThis.indexedDB;
  if (!api || typeof api.open !== 'function') throw new Error('IndexedDB is unavailable in this browser.');
  return api;
}

function isEnvelope(value = {}) {
  return value && typeof value === 'object'
    && value.schema === 'eonapp.local-vault-record.v1'
    && /^eonrec_[a-z0-9_-]{12,120}$/i.test(String(value.recordId || ''))
    && typeof value.iv === 'string'
    && typeof value.ciphertext === 'string';
}

function normalizeEnvelopeBatch(values = []) {
  if (!Array.isArray(values) || values.length > 500) throw new Error('Encrypted restore batch is out of bounds.');
  const seen = new Set();
  return values.map((value) => {
    if (!isEnvelope(value)) throw new Error('Only valid encrypted local-vault envelopes may be restored.');
    const copy = JSON.parse(JSON.stringify(value));
    if (seen.has(copy.recordId)) throw new Error('Encrypted restore batch contains duplicate record IDs.');
    seen.add(copy.recordId);
    return copy;
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function openEncryptedRecordStore({ indexedDb = null, dbName = EON_ENCRYPTED_RECORD_STORE_DB } = {}) {
  const api = getIndexedDb(indexedDb);
  const request = api.open(String(dbName || EON_ENCRYPTED_RECORD_STORE_DB), EON_LOCAL_VAULT_DATABASE_VERSION);
  request.onupgradeneeded = () => ensureLocalVaultObjectStores(request.result);
  const db = await requestResult(request);
  const withStore = async (mode, operation) => {
    const transaction = db.transaction(EON_ENCRYPTED_RECORD_STORE_NAME, mode);
    const store = transaction.objectStore(EON_ENCRYPTED_RECORD_STORE_NAME);
    const result = await operation(store);
    await transactionDone(transaction);
    return result;
  };
  return Object.freeze({
    schema: EON_ENCRYPTED_RECORD_STORE_SCHEMA,
    async put(envelope) {
      if (!isEnvelope(envelope)) throw new Error('Only a valid encrypted local-vault envelope may be stored.');
      const copy = JSON.parse(JSON.stringify(envelope));
      await withStore('readwrite', async (store) => requestResult(store.put(copy)));
      return Object.freeze({ ok: true, recordId: copy.recordId });
    },
    async putManyIfAbsent(envelopes = []) {
      const copies = normalizeEnvelopeBatch(envelopes);
      if (!copies.length) return Object.freeze({ ok: true, recordIds: Object.freeze([]), atomic: true, overwritten: false });
      const transaction = db.transaction(EON_ENCRYPTED_RECORD_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(EON_ENCRYPTED_RECORD_STORE_NAME);
      const done = transactionDone(transaction);
      try {
        // IDBObjectStore.add is intentionally used instead of put. A record
        // appearing after preview causes the entire transaction to abort rather
        // than overwriting either the existing record or a partial restore.
        const requests = copies.map((copy) => store.add(copy));
        await Promise.all(requests.map(requestResult));
        await done;
      } catch (error) {
        try { transaction.abort(); } catch {}
        try { await done; } catch {}
        const conflict = String(error?.name || '').toLowerCase().includes('constraint');
        const failure = new Error(conflict ? 'Encrypted restore conflict appeared after preview.' : 'Atomic encrypted restore transaction failed.');
        failure.code = conflict ? 'atomic-restore-conflict' : 'atomic-restore-failed';
        throw failure;
      }
      return Object.freeze({ ok: true, recordIds: Object.freeze(copies.map((copy) => copy.recordId)), atomic: true, overwritten: false });
    },
    async get(recordId) {
      const value = await withStore('readonly', async (store) => requestResult(store.get(String(recordId || ''))));
      return value && isEnvelope(value) ? Object.freeze(value) : null;
    },
    async remove(recordId) {
      await withStore('readwrite', async (store) => requestResult(store.delete(String(recordId || ''))));
      return Object.freeze({ ok: true, recordId: String(recordId || '') });
    },
    async listRecordIds({ limit = 200 } = {}) {
      const max = Math.max(1, Math.min(500, Number(limit) || 200));
      const keys = await withStore('readonly', async (store) => requestResult(store.getAllKeys()));
      return Object.freeze((Array.isArray(keys) ? keys : []).map(String).filter((id) => /^eonrec_[a-z0-9_-]{12,120}$/i.test(id)).slice(0, max));
    },
    close() { try { db.close(); } catch {} }
  });
}

export function getEncryptedRecordStoreTruth() {
  return Object.freeze({
    schema: EON_ENCRYPTED_RECORD_STORE_SCHEMA,
    encryptedEnvelopesOnly: true,
    opaqueRecordIdsOnly: true,
    localStorage: false,
    network: false,
    passphrasePersistence: false,
    atomicAddOnlyBatchRestore: true,
    overwriteOnRestore: false
  });
}
