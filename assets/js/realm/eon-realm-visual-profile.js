/**
 * W370 — My Realm visual profile and portable encrypted backup.
 *
 * This module stores only a compact local presentation profile. It is not a
 * public Realm registry, marketplace listing, wallet, payment record, cloud
 * sync payload, or account backup. Encryption protects a user-exported file;
 * the passphrase is never stored by EONAPP.
 */
import { MY_REALM_LANDMARKS, MY_REALM_THEMES } from './realm-state.js';

export const REALM_VISUAL_PROFILE_SCHEMA = 'eon.realm.visual-profile.w370.v1';
export const REALM_VISUAL_PROFILE_KEY = 'eon:realm:visual-profile:v1';
export const REALM_VISUAL_BACKUP_SCHEMA = 'eon.realm.visual-backup.w370.v1';
export const REALM_VISUAL_BACKUP_ITERATIONS = 210000;

export const REALM_COMPANION_SHELLS = Object.freeze([
  Object.freeze({ id: 'eonbot-orbit', label: 'EONBOT Orbit', note: 'A calm companion light for local City presentation.' }),
  Object.freeze({ id: 'survey-drone', label: 'Survey Drone', note: 'A small visual guide; it does not observe or transmit.' }),
  Object.freeze({ id: 'archive-lantern', label: 'Archive Lantern', note: 'A quiet research-light motif for the local district.' }),
  Object.freeze({ id: 'quiet-orb', label: 'Quiet Orb', note: 'A minimal companion shell for reduced visual density.' })
]);

export const REALM_ATMOSPHERES = Object.freeze([
  Object.freeze({ id: 'clear-night', label: 'Clear Night', note: 'Crisp skyline and low visual noise.' }),
  Object.freeze({ id: 'soft-rain', label: 'Soft Rain', note: 'Optional visual rain only; no audio starts by itself.' }),
  Object.freeze({ id: 'aurora-current', label: 'Aurora Current', note: 'Slow ambient colour movement when motion is allowed.' }),
  Object.freeze({ id: 'quiet-interior', label: 'Quiet Interior', note: 'Reduced external motion and a calmer command-room palette.' })
]);

export const REALM_PROJECT_DISPLAYS = Object.freeze([
  Object.freeze({ id: 'minimal', label: 'Minimal', note: 'Only landmark and current local route state.' }),
  Object.freeze({ id: 'command', label: 'Command', note: 'Shows bounded local action and return cues.' }),
  Object.freeze({ id: 'gallery', label: 'Gallery', note: 'Prioritises local Realm moodboard references.' })
]);

const freeze = (value) => Object.freeze(value);
const companionIds = new Set(REALM_COMPANION_SHELLS.map((entry) => entry.id));
const atmosphereIds = new Set(REALM_ATMOSPHERES.map((entry) => entry.id));
const displayIds = new Set(REALM_PROJECT_DISPLAYS.map((entry) => entry.id));
const themeIds = new Set(MY_REALM_THEMES.map((entry) => entry.id));
const landmarkIds = new Set(MY_REALM_LANDMARKS.map((entry) => entry.id));

function safeStorage(storage = globalThis.localStorage) {
  try { return storage || null; } catch { return null; }
}

function cleanRealmId(value = '') {
  const id = String(value || '').trim();
  return /^[a-z0-9_:-]{8,128}$/i.test(id) ? id : '';
}

function select(value, allowed, fallback) {
  const candidate = String(value || '').trim();
  return allowed.has(candidate) ? candidate : fallback;
}

function cleanIso(value, now = Date.now()) {
  const candidate = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}T/.test(candidate) && candidate.length <= 40
    ? candidate
    : new Date(Number(now)).toISOString();
}

function encoder() {
  return new TextEncoder();
}

function decoder() {
  return new TextDecoder();
}

function toBase64(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof globalThis.btoa !== 'function') throw new Error('Base64 support is unavailable in this browser.');
  return globalThis.btoa(binary);
}

function fromBase64(value) {
  if (typeof globalThis.atob !== 'function') throw new Error('Base64 support is unavailable in this browser.');
  const binary = globalThis.atob(String(value || ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function getCrypto(cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== 'function') throw new Error('This browser does not provide local Web Crypto.');
  return cryptoApi;
}

function normalizePassphrase(passphrase = '') {
  const value = String(passphrase || '');
  if (value.length < 12 || value.length > 256) throw new Error('Use a backup passphrase between 12 and 256 characters.');
  return value;
}

async function deriveKey(passphrase, salt, cryptoApi) {
  const material = await cryptoApi.subtle.importKey('raw', encoder().encode(normalizePassphrase(passphrase)), 'PBKDF2', false, ['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: REALM_VISUAL_BACKUP_ITERATIONS },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function normalizeRealmVisualProfile(value = {}, { realmId = '', now = Date.now() } = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const resolvedRealmId = cleanRealmId(source.realmId || realmId);
  return freeze({
    schema: REALM_VISUAL_PROFILE_SCHEMA,
    realmId: resolvedRealmId,
    theme: select(source.theme, themeIds, 'dark-purple'),
    landmark: select(source.landmark, landmarkIds, 'observatory'),
    companion: select(source.companion, companionIds, 'eonbot-orbit'),
    atmosphere: select(source.atmosphere, atmosphereIds, 'clear-night'),
    projectDisplay: select(source.projectDisplay, displayIds, 'command'),
    localOnly: true,
    publicPublishingActive: false,
    cloudSyncActive: false,
    updatedAt: cleanIso(source.updatedAt, now)
  });
}

export function readRealmVisualProfile({ storage = safeStorage(), realmId = '', now = Date.now() } = {}) {
  try {
    const parsed = JSON.parse(storage?.getItem(REALM_VISUAL_PROFILE_KEY) || 'null');
    const profile = normalizeRealmVisualProfile(parsed || {}, { realmId, now });
    return freeze({ profile, exists: Boolean(parsed), localOnly: true });
  } catch {
    return freeze({ profile: normalizeRealmVisualProfile({}, { realmId, now }), exists: false, localOnly: true });
  }
}

export function saveRealmVisualProfile(next, { storage = safeStorage(), realmId = '', now = Date.now() } = {}) {
  const profile = normalizeRealmVisualProfile(next, { realmId, now });
  if (!profile.realmId) return freeze({ ok: false, reason: 'missing-realm-id', profile });
  try {
    storage?.setItem(REALM_VISUAL_PROFILE_KEY, JSON.stringify(profile));
    return freeze({ ok: true, reason: null, profile });
  } catch {
    return freeze({ ok: false, reason: 'storage-unavailable', profile });
  }
}

/** Returns only the small presentation profile allowed in a portable backup. */
export function exportRealmVisualProfile(profile = {}, options = {}) {
  const normalized = normalizeRealmVisualProfile(profile, options);
  return freeze({
    schema: REALM_VISUAL_PROFILE_SCHEMA,
    realmId: normalized.realmId,
    theme: normalized.theme,
    landmark: normalized.landmark,
    companion: normalized.companion,
    atmosphere: normalized.atmosphere,
    projectDisplay: normalized.projectDisplay,
    localOnly: true,
    publicPublishingActive: false,
    cloudSyncActive: false,
    updatedAt: normalized.updatedAt
  });
}

export async function createEncryptedRealmVisualBackup(profile = {}, passphrase = '', { cryptoApi = globalThis.crypto, now = Date.now() } = {}) {
  const crypto = getCrypto(cryptoApi);
  const exported = exportRealmVisualProfile(profile, { now });
  if (!exported.realmId) throw new Error('Save a local Realm before creating a visual backup.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, crypto);
  const plaintext = encoder().encode(JSON.stringify(exported));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return freeze({
    schema: REALM_VISUAL_BACKUP_SCHEMA,
    createdAt: cleanIso('', now),
    contains: 'realm-visual-profile-only',
    cloudUpload: false,
    kdf: freeze({ name: 'PBKDF2', hash: 'SHA-256', iterations: REALM_VISUAL_BACKUP_ITERATIONS, salt: toBase64(salt) }),
    cipher: freeze({ name: 'AES-GCM', iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) })
  });
}

export async function restoreEncryptedRealmVisualBackup(backup = {}, passphrase = '', { cryptoApi = globalThis.crypto, now = Date.now() } = {}) {
  const crypto = getCrypto(cryptoApi);
  if (!backup || backup.schema !== REALM_VISUAL_BACKUP_SCHEMA || backup.contains !== 'realm-visual-profile-only') throw new Error('This is not an EONAPP Realm visual backup.');
  if (Number(backup?.kdf?.iterations) !== REALM_VISUAL_BACKUP_ITERATIONS || backup?.kdf?.name !== 'PBKDF2' || backup?.cipher?.name !== 'AES-GCM') throw new Error('This Realm visual backup uses an unsupported protection format.');
  const salt = fromBase64(backup.kdf.salt);
  const iv = fromBase64(backup.cipher.iv);
  const ciphertext = fromBase64(backup.cipher.ciphertext);
  const key = await deriveKey(passphrase, salt, crypto);
  let decoded;
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    decoded = JSON.parse(decoder().decode(plaintext));
  } catch {
    throw new Error('The backup could not be opened. Check the passphrase and backup file.');
  }
  const profile = normalizeRealmVisualProfile(decoded, { now });
  if (!profile.realmId) throw new Error('The backup does not contain a valid Realm visual profile.');
  return freeze({ ok: true, profile, localOnly: true, cloudUpload: false });
}

export function getRealmVisualProfileTruth() {
  return freeze({
    schema: REALM_VISUAL_PROFILE_SCHEMA,
    localOnly: true,
    publicPublishingActive: false,
    globalHandleRegistry: false,
    cloudSyncActive: false,
    stores: freeze(['realmId', 'theme', 'landmark', 'companion', 'atmosphere', 'projectDisplay', 'updatedAt']),
    neverStores: freeze(['Realm label', 'public handle', 'chat', 'Vault data', 'provider key', 'file', 'payment data', 'wallet data', 'passphrase']),
    encryptedBackup: true,
    backupContains: 'realm-visual-profile-only'
  });
}
