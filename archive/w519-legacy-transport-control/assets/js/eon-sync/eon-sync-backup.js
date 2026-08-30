import { getLocalFirstBoundaryNotice } from '../local-first/local-first-boundary.js';
import { CITY_WORLD_STATE_KEY, normalizeCityWorldState } from '../city/city-world-state.js';

/**
 * EONAPP W197 — local encrypted backup/export foundation.
 *
 * This module deliberately provides an encrypted portable backup, not a claim
 * of automatic cross-device cloud sync. It only includes allowlisted product
 * state, redacts sensitive property names recursively, and never reads Vault
 * secrets, recovery material, API keys, exchange credentials or wallet data.
 */

export const EON_SYNC_BACKUP_SCHEMA = 'eon.sync.encrypted-backup.v1';
export const EON_SYNC_LOCAL_ONLY_NOTE = getLocalFirstBoundaryNotice('backup');

const ALLOWED_EXACT_KEYS = Object.freeze([
  // Share Center stores only signed public invite drafts and a local AI Cockpit campaign brief.
  // It never stores chat content, Vault material, credentials, wallets, or private City/Realm state here.
  'eon:share:drafts:v1',
  'eon:share:campaign-intent:v1',
  // Local quality/fallback preference only; it contains no renderer state, account or private City data.
  'eon:city:3d:preferences:v1',
  // User-saved local graphics evidence only. It contains no chat, identity, account, reward or remote telemetry data.
  'eon:city:3d:local-proof:v1',
  // Disabled-program acknowledgement only. It contains no grant, balance, account or entitlement.
  'eon:access-milestones:preferences:v1'
]);

const ALLOWED_KEY_PREFIXES = Object.freeze([
  'eon:chat:history:',
  'eon:projects:',
  'eon:library:',
  'eon:automation-os:',
  'eon:market:private-drop:',
  'eon:city:world-state:',
  'eon:realm:state:',
  'eon:operator:activity:',
  'eon:profile:preferences:',
  'eon:lang:',
  'eon:local-ai:'
]);

const SENSITIVE_KEY_PATTERN = /(api[-_:]?key|secret|token|password|mnemonic|seed|private[-_:]?key|exchange|wallet|recovery)/i;

function isSensitiveFieldName(key = '') {
  // citySeed is a deterministic visual-layout seed, not recovery material.
  if (String(key || '') === 'citySeed') return false;
  return SENSITIVE_KEY_PATTERN.test(String(key || ''));
}
const MAX_RECORDS = 160;
const MAX_VALUE_BYTES = 750_000;
const PBKDF2_ITERATIONS = 210_000;

function getStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function getCryptoApi() {
  try { return globalThis.crypto?.subtle ? globalThis.crypto : null; } catch { return null; }
}

function getTextEncoder() {
  try { return new TextEncoder(); } catch { return null; }
}

function getTextDecoder() {
  try { return new TextDecoder(); } catch { return null; }
}

function bytesToBase64(bytes) {
  let binary = '';
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  for (let index = 0; index < input.length; index += 1) binary += String.fromCharCode(input[index]);
  return btoa(binary);
}

function base64ToBytes(value = '') {
  const binary = atob(String(value || ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function isAllowedStorageKey(key = '') {
  const value = String(key || '');
  if (!value || isSensitiveFieldName(value)) return false;
  return ALLOWED_EXACT_KEYS.includes(value) || ALLOWED_KEY_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function safeJsonParse(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function redactSensitiveValue(value, depth = 0) {
  if (depth > 12) return '[depth-limited]';
  if (Array.isArray(value)) return value.slice(0, 120).map((entry) => redactSensitiveValue(entry, depth + 1));
  if (value && typeof value === 'object') {
    const output = {};
    Object.entries(value).slice(0, 240).forEach(([key, entry]) => {
      if (isSensitiveFieldName(key)) return;
      output[key] = redactSensitiveValue(entry, depth + 1);
    });
    return output;
  }
  if (typeof value === 'string' && value.length > 90_000) return `${value.slice(0, 90_000)}…[truncated]`;
  return value;
}

function sanitiseStorageValue(value = '', key = '') {
  const text = String(value || '');
  if (text.length > MAX_VALUE_BYTES) return null;
  const parsed = safeJsonParse(text);
  if (parsed === null) return text;
  // CityWorldState is a versioned public-safe state contract. Normalising it
  // removes unknown/corrupt fields before export, rather than merely redacting
  // secret-shaped names. This keeps private chat-like or future ad-hoc values
  // from being carried into an encrypted portable backup.
  if (String(key || '') === CITY_WORLD_STATE_KEY) {
    return normalizeCityWorldState(parsed, { fallback: parsed });
  }
  return redactSensitiveValue(parsed);
}

export function collectEonSyncRecords(options = {}) {
  const storage = getStorage(options.storage);
  if (!storage || typeof storage.length !== 'number') return [];
  const records = [];
  for (let index = 0; index < storage.length && records.length < MAX_RECORDS; index += 1) {
    const key = String(storage.key(index) || '');
    if (!isAllowedStorageKey(key)) continue;
    const raw = storage.getItem(key);
    const value = sanitiseStorageValue(raw, key);
    if (value === null) continue;
    records.push({ key, value });
  }
  return records.sort((left, right) => left.key.localeCompare(right.key));
}

export function buildEonSyncPayload(options = {}) {
  const now = Number(options.now || Date.now());
  const records = collectEonSyncRecords(options);
  return Object.freeze({
    schema: 'eon.sync.payload.v1',
    createdAt: new Date(now).toISOString(),
    mode: 'portable-encrypted-backup',
    automaticCrossDeviceSync: false,
    records,
    excluded: ['API keys', 'tokens', 'passwords', 'wallet data', 'seed phrases', 'recovery material', 'exchange credentials'],
    note: EON_SYNC_LOCAL_ONLY_NOTE
  });
}

async function deriveKey(passphrase, salt) {
  const cryptoApi = getCryptoApi();
  const encoder = getTextEncoder();
  if (!cryptoApi || !encoder) throw new Error('Web Crypto is unavailable in this browser.');
  const material = await cryptoApi.subtle.importKey('raw', encoder.encode(String(passphrase || '')), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function ensurePassphrase(passphrase = '') {
  const value = String(passphrase || '');
  if (value.length < 12) throw new Error('Choose a backup passphrase with at least 12 characters.');
  return value;
}

export async function createEncryptedEonSyncBackup(passphrase, options = {}) {
  const safePassphrase = ensurePassphrase(passphrase);
  const cryptoApi = getCryptoApi();
  const encoder = getTextEncoder();
  if (!cryptoApi || !encoder) throw new Error('Web Crypto is unavailable in this browser.');
  const salt = cryptoApi.getRandomValues(new Uint8Array(16));
  const iv = cryptoApi.getRandomValues(new Uint8Array(12));
  const payload = buildEonSyncPayload(options);
  const key = await deriveKey(safePassphrase, salt);
  const ciphertext = await cryptoApi.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(payload)));
  return Object.freeze({
    schema: EON_SYNC_BACKUP_SCHEMA,
    createdAt: payload.createdAt,
    algorithm: { kdf: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, cipher: 'AES-GCM-256' },
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    recordCount: payload.records.length,
    automaticCrossDeviceSync: false,
    note: EON_SYNC_LOCAL_ONLY_NOTE
  });
}

export async function decryptEonSyncBackup(backup, passphrase) {
  const source = backup && typeof backup === 'object' ? backup : safeJsonParse(backup);
  if (!source || source.schema !== EON_SYNC_BACKUP_SCHEMA) throw new Error('This is not a supported EON Sync backup.');
  const cryptoApi = getCryptoApi();
  const decoder = getTextDecoder();
  if (!cryptoApi || !decoder) throw new Error('Web Crypto is unavailable in this browser.');
  const key = await deriveKey(ensurePassphrase(passphrase), base64ToBytes(source.salt));
  let raw;
  try {
    raw = await cryptoApi.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(source.iv) }, key, base64ToBytes(source.ciphertext));
  } catch {
    throw new Error('The backup could not be decrypted. Check the passphrase and file.');
  }
  const payload = safeJsonParse(decoder.decode(raw));
  if (!payload || payload.schema !== 'eon.sync.payload.v1' || !Array.isArray(payload.records)) throw new Error('The decrypted backup is invalid.');
  return Object.freeze({
    ...payload,
    records: payload.records.filter((record) => isAllowedStorageKey(record?.key)).slice(0, MAX_RECORDS)
  });
}

export function restoreEonSyncPayload(payload, options = {}) {
  const storage = getStorage(options.storage);
  if (!storage) return { ok: false, reason: 'storage-unavailable', restored: 0 };
  const records = Array.isArray(payload?.records) ? payload.records : [];
  let restored = 0;
  records.forEach((record) => {
    if (!isAllowedStorageKey(record?.key)) return;
    const value = String(record.key || '') === CITY_WORLD_STATE_KEY
      ? normalizeCityWorldState(record.value, { fallback: record.value })
      : redactSensitiveValue(record.value);
    try {
      storage.setItem(record.key, typeof value === 'string' ? value : JSON.stringify(value));
      restored += 1;
    } catch {}
  });
  return { ok: true, restored, automaticCrossDeviceSync: false };
}

export function createEonSyncFilename(now = Date.now()) {
  const date = new Date(now).toISOString().slice(0, 10);
  return `eonapp-encrypted-backup-${date}.json`;
}

export function getEonSyncTruth(options = {}) {
  const records = collectEonSyncRecords(options);
  return Object.freeze({
    mode: 'portable-encrypted-backup',
    recordCount: records.length,
    automaticCrossDeviceSync: false,
    localOnly: true,
    note: EON_SYNC_LOCAL_ONLY_NOTE,
    excludes: ['API keys', 'tokens', 'passwords', 'wallet data', 'seed phrases', 'recovery material', 'exchange credentials']
  });
}
