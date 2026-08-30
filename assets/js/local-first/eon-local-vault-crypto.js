/**
 * W307 — local encrypted-record cryptography primitives.
 *
 * Designed for device-local IndexedDB storage. Keys are derived in memory from
 * a passphrase supplied by the user; the module never writes to localStorage,
 * does not export raw keys, and makes no network request.
 */

export const EON_LOCAL_VAULT_CRYPTO_SCHEMA = 'eonapp.local-vault-crypto.v1';
export const EON_LOCAL_VAULT_KDF = Object.freeze({ name: 'PBKDF2-SHA-256', iterations: 310_000, saltBytes: 16 });
export const EON_LOCAL_VAULT_CIPHER = 'AES-GCM-256';

const RECORD_ID_PATTERN = /^eonrec_[a-z0-9_-]{12,120}$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Web Crypto is unavailable in this browser.');
  return api;
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return new Uint8Array(value || []);
}

function toBase64Url(value) {
  const bytes = toBytes(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable in this browser.');
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value = '') {
  const normalized = String(value || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized || !/^[A-Za-z0-9+/]+={0,2}$/.test(`${normalized}${'='.repeat((4 - (normalized.length % 4 || 4)) % 4)}`)) throw new Error('Invalid local-vault encoding.');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  if (typeof atob !== 'function') throw new Error('Base64 decoding is unavailable in this browser.');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function ensurePassphrase(passphrase = '') {
  const value = String(passphrase || '');
  if (value.length < 12) throw new Error('Choose a local vault passphrase with at least 12 characters.');
  return value;
}

function ensureRecordId(recordId = '') {
  const value = String(recordId || '').trim();
  if (!RECORD_ID_PATTERN.test(value)) throw new Error('Local vault record IDs must be opaque eonrec_ identifiers.');
  return value;
}

function safeJson(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function makeAad(recordId) {
  return encoder.encode(JSON.stringify({ schema: EON_LOCAL_VAULT_CRYPTO_SCHEMA, recordId }));
}

export function createLocalVaultRecordId({ cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const bytes = api.getRandomValues(new Uint8Array(18));
  return `eonrec_${toBase64Url(bytes)}`;
}

export function createLocalVaultSalt({ cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  return toBase64Url(api.getRandomValues(new Uint8Array(EON_LOCAL_VAULT_KDF.saltBytes)));
}

export async function deriveLocalVaultKey(passphrase, salt, { cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const material = await api.subtle.importKey('raw', encoder.encode(ensurePassphrase(passphrase)), 'PBKDF2', false, ['deriveKey']);
  return api.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(salt), iterations: EON_LOCAL_VAULT_KDF.iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function sealLocalVaultRecord(value, { key, recordId, cryptoApi = null, now = Date.now() } = {}) {
  const api = cryptoFor(cryptoApi);
  const id = ensureRecordId(recordId);
  if (!key) throw new Error('A local vault key is required.');
  const iv = api.getRandomValues(new Uint8Array(12));
  const createdAt = new Date(Number(now)).toISOString();
  const payload = JSON.stringify({ schema: 'eonapp.local-vault-record-data.v1', value });
  const ciphertext = await api.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: makeAad(id) },
    key,
    encoder.encode(payload)
  );
  return Object.freeze({
    schema: 'eonapp.local-vault-record.v1',
    recordId: id,
    createdAt,
    algorithm: Object.freeze({ kdf: EON_LOCAL_VAULT_KDF.name, iterations: EON_LOCAL_VAULT_KDF.iterations, cipher: EON_LOCAL_VAULT_CIPHER }),
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(ciphertext)
  });
}

export async function openLocalVaultRecord(envelope, { key, recordId = '', cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const source = envelope && typeof envelope === 'object' ? envelope : safeJson(envelope);
  if (!source || source.schema !== 'eonapp.local-vault-record.v1') throw new Error('This is not a supported local vault record.');
  const id = ensureRecordId(recordId || source.recordId);
  if (id !== source.recordId) throw new Error('Local vault record binding did not match.');
  if (!key) throw new Error('A local vault key is required.');
  let plaintext;
  try {
    plaintext = await api.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64Url(source.iv), additionalData: makeAad(id) },
      key,
      fromBase64Url(source.ciphertext)
    );
  } catch {
    throw new Error('The local vault record could not be decrypted. Check the passphrase and record binding.');
  }
  const payload = safeJson(decoder.decode(plaintext));
  if (!payload || payload.schema !== 'eonapp.local-vault-record-data.v1' || !Object.prototype.hasOwnProperty.call(payload, 'value')) throw new Error('The decrypted local vault record is invalid.');
  return Object.freeze({ recordId: id, createdAt: String(source.createdAt || ''), value: payload.value });
}

export function getLocalVaultCryptoTruth() {
  return Object.freeze({
    schema: EON_LOCAL_VAULT_CRYPTO_SCHEMA,
    directNetwork: false,
    localStorage: false,
    keyExport: false,
    passphrasePersistence: false,
    recordBinding: 'AES-GCM additional authenticated data',
    keyDerivation: EON_LOCAL_VAULT_KDF,
    cipher: EON_LOCAL_VAULT_CIPHER
  });
}
