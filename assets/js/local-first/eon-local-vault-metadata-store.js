/**
 * W308 — non-secret local-vault profile store.
 *
 * The profile exists only to retain a public salt and algorithm version needed
 * to derive the same in-memory key after a local restart. It cannot contain a
 * passphrase, CryptoKey, prompt, asset, token, account, or provider identity.
 */

import {
  EON_LOCAL_VAULT_DATABASE_NAME,
  EON_LOCAL_VAULT_DATABASE_VERSION,
  EON_LOCAL_VAULT_METADATA_STORE,
  ensureLocalVaultObjectStores
} from './local-vault-db-schema.js';

export const EON_LOCAL_VAULT_PROFILE_SCHEMA = 'eonapp.local-vault-profile.v1';
export const EON_LOCAL_VAULT_PROFILE_ID = 'local-vault-profile';

function getIndexedDb(indexedDb = null) {
  const api = indexedDb || globalThis.indexedDB;
  if (!api || typeof api.open !== 'function') throw new Error('IndexedDB is unavailable in this browser.');
  return api;
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

function cleanSalt(value = '') {
  const salt = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(salt)) throw new Error('Local vault profile salt is invalid.');
  return salt;
}

function cleanIso(value = '', fallback = Date.now()) {
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function normalizeProfile(value = {}, { now = Date.now() } = {}) {
  const candidate = value && typeof value === 'object' ? value : {};
  const kdf = candidate.kdf && typeof candidate.kdf === 'object' ? candidate.kdf : {};
  const iterations = Number(kdf.iterations);
  if (candidate.id !== EON_LOCAL_VAULT_PROFILE_ID || candidate.schema !== EON_LOCAL_VAULT_PROFILE_SCHEMA) return null;
  if (String(kdf.name || '') !== 'PBKDF2-SHA-256' || !Number.isInteger(iterations) || iterations < 150000 || iterations > 2000000) return null;
  if (String(candidate.cipher || '') !== 'AES-GCM-256') return null;
  try {
    return Object.freeze({
      id: EON_LOCAL_VAULT_PROFILE_ID,
      schema: EON_LOCAL_VAULT_PROFILE_SCHEMA,
      version: 1,
      salt: cleanSalt(candidate.salt),
      kdf: Object.freeze({ name: 'PBKDF2-SHA-256', iterations }),
      cipher: 'AES-GCM-256',
      createdAt: cleanIso(candidate.createdAt, now),
      updatedAt: cleanIso(candidate.updatedAt, now)
    });
  } catch {
    return null;
  }
}

export function createLocalVaultProfile({ salt, now = Date.now() } = {}) {
  return normalizeProfile({
    id: EON_LOCAL_VAULT_PROFILE_ID,
    schema: EON_LOCAL_VAULT_PROFILE_SCHEMA,
    salt,
    kdf: { name: 'PBKDF2-SHA-256', iterations: 310000 },
    cipher: 'AES-GCM-256',
    createdAt: new Date(Number(now)).toISOString(),
    updatedAt: new Date(Number(now)).toISOString()
  }, { now });
}

export async function openLocalVaultMetadataStore({ indexedDb = null, dbName = EON_LOCAL_VAULT_DATABASE_NAME } = {}) {
  const api = getIndexedDb(indexedDb);
  const request = api.open(String(dbName || EON_LOCAL_VAULT_DATABASE_NAME), EON_LOCAL_VAULT_DATABASE_VERSION);
  request.onupgradeneeded = () => ensureLocalVaultObjectStores(request.result);
  const db = await requestResult(request);
  const withStore = async (mode, operation) => {
    const transaction = db.transaction(EON_LOCAL_VAULT_METADATA_STORE, mode);
    const store = transaction.objectStore(EON_LOCAL_VAULT_METADATA_STORE);
    const result = await operation(store);
    await transactionDone(transaction);
    return result;
  };
  return Object.freeze({
    schema: 'eonapp.local-vault-metadata-store.v1',
    async getProfile() {
      const value = await withStore('readonly', async (store) => requestResult(store.get(EON_LOCAL_VAULT_PROFILE_ID)));
      return normalizeProfile(value) || null;
    },
    async saveProfile(profile, { now = Date.now() } = {}) {
      const current = normalizeProfile(await withStore('readonly', async (store) => requestResult(store.get(EON_LOCAL_VAULT_PROFILE_ID))), { now });
      const normalized = normalizeProfile({
        ...profile,
        id: EON_LOCAL_VAULT_PROFILE_ID,
        schema: EON_LOCAL_VAULT_PROFILE_SCHEMA,
        createdAt: current?.createdAt || profile?.createdAt || new Date(Number(now)).toISOString(),
        updatedAt: new Date(Number(now)).toISOString()
      }, { now });
      if (!normalized) throw new Error('Only a valid non-secret local vault profile may be saved.');
      await withStore('readwrite', async (store) => requestResult(store.put({ ...normalized, kdf: { ...normalized.kdf } })));
      return normalized;
    },
    async clearProfile() {
      await withStore('readwrite', async (store) => requestResult(store.delete(EON_LOCAL_VAULT_PROFILE_ID)));
      return Object.freeze({ ok: true });
    },
    close() { try { db.close(); } catch {} }
  });
}

export function getLocalVaultMetadataTruth() {
  return Object.freeze({
    schema: 'eonapp.local-vault-metadata-store.v1',
    onlyNonSecretProfile: true,
    directNetwork: false,
    localStorage: false,
    passphrasePersistence: false,
    keyPersistence: false,
    plaintextWorkspacePersistence: false
  });
}
