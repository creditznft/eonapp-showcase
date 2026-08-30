/**
 * EONAPP W209 — Vault lifecycle, local-account boundary and restore safety.
 *
 * This module is intentionally local-first. It never sends user data anywhere,
 * never renders raw secret values, and never treats browser storage as an
 * authenticated cross-device account. It provides the storage rules used by
 * encrypted Vault backup/restore, safe legacy-provider migration, and explicit
 * local-data clearing.
 */

import { ApiKeyVault, EON_API_KEY_SESSION_STORAGE_KEY, EON_API_KEY_VAULT_STORAGE_KEY } from '../utils/api-key-vault.js';
import { buildPortableStateManifest, isPortableBackupIncludedKey } from '../../../config/w476-portable-state-contract.mjs';
import { EON_CITY_RESUME_STATE_KEY, normalizeEonCityResumeState } from '../contracts/city/eon-city-resume-travel.js';
import { EON_CITY_VAULT_REVEALS_STORAGE_KEY, normalizeEonCityVaultRevealInventory } from '../contracts/city/eon-city-vault-reveals.js';

export const EON_VAULT_LIFECYCLE_SCHEMA = 'eon.vault.lifecycle.v209';
export const EON_VAULT_MIGRATION_RECEIPT_KEY = 'eon:vault:migration-receipt:v1';
export const EON_VAULT_RESTORE_RECEIPT_KEY = 'eon:vault:restore-receipt:v2'; // stable key; receipt schema advances independently
export const EON_VAULT_CLEAR_RECEIPT_KEY = 'eon:vault:clear-receipt:v1';
export const EON_VAULT_CLEAR_CONFIRMATION = 'DELETE EONAPP DATA';

const APP_PREFIXES = Object.freeze(['eon:', 'eonapp:', 'eonapp.']);
const LEGACY_OWNED_KEYS = new Set([
  'eon-credits',
  'eon-license-code',
  'eon-mp-enabled',
  'eon-sub-cta-dismissed',
  'eonapp_language',
  'selectedTradingModel',
  'distributedInferenceState',
  'cuLog',
  'userId'
]);

/**
 * Portable backup eligibility is centralized in
 * config/w476-portable-state-contract.mjs. Keeping a second local allowlist
 * here would let the Vault drift from the published recovery contract.
 */
const BACKUP_KEY_SENSITIVE_RE = /(api[-_:]?key|(?:access|refresh)?[-_:]?token|secret|password|mnemonic|seed|private[-_:]?key|exchange|wallet|recovery|authorization|cookie|bearer|identity|credential|provider)/i;
const MAX_BACKUP_RECORD_BYTES = 750_000;
const MAX_BACKUP_DEPTH = 12;
const MAX_BACKUP_ARRAY_ITEMS = 160;
const MAX_BACKUP_OBJECT_PROPERTIES = 260;
const MAX_BACKUP_STRING_LENGTH = 96_000;

const LEGACY_PROVIDER_SOURCES = Object.freeze([
  'eon:onboarding:providers:v1',
  'eon:ai:keys:v1',
  'eon:vault:api-keys:v1',
  'eon:ai-chat-device-keys:v1'
]);

const SECRET_FIELD_RE = /(?:api[-_ ]?key|token|secret|password|authorization|private[-_ ]?key|access[-_ ]?key)/i;
const PROVIDER_ID_RE = /^[a-z0-9][a-z0-9._-]{0,80}$/i;

function resolveStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function storageKeys(storage = null) {
  const target = resolveStorage(storage);
  if (!target || typeof target.length !== 'number') return [];
  const keys = [];
  for (let index = 0; index < target.length; index += 1) {
    try {
      const key = String(target.key(index) || '');
      if (key) keys.push(key);
    } catch {}
  }
  return keys.sort();
}

function safeJson(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function byteLength(value) {
  try { return new TextEncoder().encode(String(value ?? '')).length; } catch { return String(value ?? '').length; }
}

function nowIso(now = Date.now()) {
  return new Date(Number(now) || Date.now()).toISOString();
}

function readValue(storage, key) {
  try { return storage?.getItem?.(key) ?? null; } catch { return null; }
}

function writeValue(storage, key, value) {
  try { storage?.setItem?.(key, String(value)); return true; } catch { return false; }
}

function removeValue(storage, key) {
  try { storage?.removeItem?.(key); return true; } catch { return false; }
}

function sanitiseProviderId(value) {
  const id = String(value || '').trim().toLowerCase();
  return PROVIDER_ID_RE.test(id) ? id : '';
}

function collectProviderSecrets(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return Object.freeze({ pairs: [], unsupported: true });
  }
  const pairs = [];
  let unsupported = false;
  for (const [providerValue, entry] of Object.entries(value)) {
    const provider = sanitiseProviderId(providerValue);
    if (typeof entry === 'string') {
      const secret = entry.trim();
      if (!secret) continue;
      if (!provider) { unsupported = true; continue; }
      pairs.push({ provider, secret, sourceKind: 'string', secretFields: [] });
      continue;
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const secretEntries = Object.entries(entry)
      .filter(([key, secret]) => SECRET_FIELD_RE.test(key) && typeof secret === 'string' && secret.trim())
      .map(([key, secret]) => ({ key, secret: secret.trim() }));
    if (!secretEntries.length) continue;
    if (!provider) { unsupported = true; continue; }
    const uniqueSecrets = [...new Set(secretEntries.map((row) => row.secret))];
    if (uniqueSecrets.length !== 1) { unsupported = true; continue; }
    pairs.push({
      provider,
      secret: uniqueSecrets[0],
      sourceKind: 'object',
      secretFields: secretEntries.map((row) => row.key).sort()
    });
  }
  return Object.freeze({ pairs, unsupported });
}

function _redactSecretFields(value, depth = 0) {
  if (depth > 16) return '[depth-limited]';
  if (Array.isArray(value)) return value.slice(0, 160).map((entry) => _redactSecretFields(entry, depth + 1));
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, entry] of Object.entries(value).slice(0, 240)) {
    if (SECRET_FIELD_RE.test(key)) continue;
    output[key] = _redactSecretFields(entry, depth + 1);
  }
  return output;
}

function redactBackupValue(value, depth = 0) {
  if (depth > MAX_BACKUP_DEPTH) return '[depth-limited]';
  if (Array.isArray(value)) return value.slice(0, MAX_BACKUP_ARRAY_ITEMS).map((entry) => redactBackupValue(entry, depth + 1));
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, entry] of Object.entries(value).slice(0, MAX_BACKUP_OBJECT_PROPERTIES)) {
      if (SECRET_FIELD_RE.test(key) || BACKUP_KEY_SENSITIVE_RE.test(key)) continue;
      output[key] = redactBackupValue(entry, depth + 1);
    }
    return output;
  }
  if (typeof value === 'string') return value.length > MAX_BACKUP_STRING_LENGTH ? `${value.slice(0, MAX_BACKUP_STRING_LENGTH)}…[truncated]` : value;
  return value;
}

function sanitiseBackupRawValue(value = '', key = '') {
  const raw = String(value ?? '');
  if (byteLength(raw) > MAX_BACKUP_RECORD_BYTES) return null;
  const parsed = safeJson(raw);
  // W559 City resume state is a closed allowlist. Preserve only its bounded
  // player/camera pose and static landmark id, never arbitrary browser data.
  if (String(key || '') === EON_CITY_RESUME_STATE_KEY) {
    const normalized = normalizeEonCityResumeState(parsed);
    return normalized ? JSON.stringify(normalized) : null;
  }
  // W564 City appearance preference is a closed, visual-only local record.
  // Normalisation removes foreign fields before encrypted Vault backup.
  if (String(key || '') === EON_CITY_VAULT_REVEALS_STORAGE_KEY) {
    const normalized = normalizeEonCityVaultRevealInventory(parsed);
    return normalized ? JSON.stringify(normalized) : null;
  }
  const clean = parsed === null ? redactBackupValue(raw) : redactBackupValue(parsed);
  return typeof clean === 'string' ? clean : JSON.stringify(clean);
}

function redactMigratedLegacySource(value, pairs = []) {
  const redacted = value && typeof value === 'object' && !Array.isArray(value)
    ? JSON.parse(JSON.stringify(value))
    : value;
  if (!redacted || typeof redacted !== 'object' || Array.isArray(redacted)) return redacted;
  for (const pair of pairs) {
    if (pair.sourceKind === 'string') {
      delete redacted[pair.provider];
      continue;
    }
    const entry = redacted[pair.provider];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    for (const field of pair.secretFields || []) delete entry[field];
    if (!Object.keys(entry).length) delete redacted[pair.provider];
  }
  return redacted;
}

function containsMeaningfulData(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(String(value || '').trim());
}

export function isEonAppOwnedStorageKey(key = '') {
  const value = String(key || '');
  return APP_PREFIXES.some((prefix) => value.startsWith(prefix)) || LEGACY_OWNED_KEYS.has(value);
}

export function listEonAppOwnedStorageKeys(options = {}) {
  const storage = resolveStorage(options.storage);
  return storageKeys(storage).filter(isEonAppOwnedStorageKey);
}

/** Returns true only for portable-backup records that are both useful and non-sensitive. */
export function isEonAppBackupEligibleKey(key = '') {
  const value = String(key || '');
  return isEonAppOwnedStorageKey(value) && isPortableBackupIncludedKey(value) && !BACKUP_KEY_SENSITIVE_RE.test(value);
}

export function listEonAppBackupEligibleKeys(options = {}) {
  const storage = resolveStorage(options.storage);
  return storageKeys(storage).filter(isEonAppBackupEligibleKey);
}

/**
 * Snapshot only user-work state that is explicitly safe for an encrypted
 * portable export. This is intentionally narrower than all EONAPP-owned
 * browser data: local encrypted provider entries stay on the trusted device
 * and raw legacy stores are never exported.
 */
export function collectEonAppOwnedStorage(options = {}) {
  const storage = resolveStorage(options.storage);
  const snapshot = {};
  for (const key of listEonAppBackupEligibleKeys({ storage })) {
    const safe = sanitiseBackupRawValue(readValue(storage, key), key);
    if (safe !== null) snapshot[key] = safe;
  }
  return snapshot;
}

export function getVaultAccountBoundary(options = {}) {
  const storage = resolveStorage(options.storage);
  const ownedKeys = listEonAppOwnedStorageKeys({ storage });
  const allKeys = storageKeys(storage);
  const externalKeys = allKeys.filter((key) => !isEonAppOwnedStorageKey(key));
  return Object.freeze({
    schema: EON_VAULT_LIFECYCLE_SCHEMA,
    mode: 'local-browser-profile',
    authenticatedCrossDeviceAccount: false,
    cloudSyncActive: false,
    ownedKeyCount: ownedKeys.length,
    backupEligibleKeyCount: listEonAppBackupEligibleKeys({ storage }).length,
    unrelatedSameOriginKeyCount: externalKeys.length,
    portableStateManifest: buildPortableStateManifest(ownedKeys),
    backupScope: 'W476 allowlisted EONAPP workspace state only, including neutral local AI preference/runtime keys under eon:local-ai: when non-sensitive; provider credentials, OAuth/session data, wallets, payments, signed payloads, referral/reward material and recovery material remain excluded.',
    restoreRule: 'A staged restore changes only W476 allowlisted EONAPP workspace records; writes are verified and rolled back on failure, while unrelated same-origin storage and local provider/identity entries are preserved.',
    updateRule: 'Static app deployments must never clear localStorage or IndexedDB.',
    notes: [
      'This browser profile is not an authenticated cross-device account.',
      'Encrypted Vault export is explicit and user-controlled.',
      'IndexedDB media, non-extractable share identity, encrypted local-vault envelopes and offline queues are update-protected but are not included in the portable Vault file.',
      'Raw API keys, recovery phrases, passwords, encrypted provider unlock material, wallets, and exchange credentials are excluded from portable backup and never shown in this status report.'
    ]
  });
}

export function getVaultMigrationState(options = {}) {
  const storage = resolveStorage(options.storage);
  const candidates = LEGACY_PROVIDER_SOURCES
    .filter((key) => readValue(storage, key) !== null)
    .map((key) => ({ key, bytes: byteLength(readValue(storage, key)) }));
  const receipt = safeJson(readValue(storage, EON_VAULT_MIGRATION_RECEIPT_KEY));
  return Object.freeze({
    schema: EON_VAULT_LIFECYCLE_SCHEMA,
    pendingLegacySourceCount: candidates.length,
    pendingLegacySources: candidates.map((row) => row.key),
    candidates,
    lastMigration: receipt && typeof receipt === 'object'
      ? {
          completedAt: String(receipt.completedAt || ''),
          migratedProviderCount: Number(receipt.migratedProviderCount || 0),
          sourceCount: Number(receipt.sourceCount || 0),
          failedSourceCount: Number(receipt.failedSourceCount || 0)
        }
      : null,
    rawValuesReadForStatus: false,
    recommendedAction: candidates.length
      ? 'Run the explicit secure migration before relying on this profile as a long-term secret store.'
      : 'No known legacy provider-storage source is currently present.'
  });
}

/**
 * Migrate known legacy key containers into ApiKeyVault. This function reads raw
 * values only long enough to encrypt them locally. It records provider names
 * and counts, never secret values, and only removes/redacts the source after
 * all entries from that source have been stored successfully.
 */
export async function migrateKnownLegacyProviderStorage(options = {}) {
  const storage = resolveStorage(options.storage);
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage || null; } catch { return null; } })();
  const vault = options.vault || ApiKeyVault;
  const now = Number(options.now || Date.now());
  const passphrase = String(options.passphrase || '');
  if (options.confirmedByUser !== true) {
    return Object.freeze({ schema: EON_VAULT_LIFECYCLE_SCHEMA, ok: false, reason: 'explicit-confirmation-required', migratedProviderCount: 0, sourceCount: 0, failedSourceCount: 0, valuesPersistedInReceipt: false });
  }
  if (passphrase.length < 12) {
    return Object.freeze({ schema: EON_VAULT_LIFECYCLE_SCHEMA, ok: false, reason: 'recovery-passphrase-required', migratedProviderCount: 0, sourceCount: 0, failedSourceCount: 0, valuesPersistedInReceipt: false });
  }
  if (!storage || !vault || typeof vault.store !== 'function') {
    return Object.freeze({
      schema: EON_VAULT_LIFECYCLE_SCHEMA,
      ok: false,
      reason: 'storage-or-vault-unavailable',
      migratedProviderCount: 0,
      sourceCount: 0,
      failedSourceCount: 0,
      valuesPersistedInReceipt: false
    });
  }

  const sources = [];
  const unsupportedSources = [];
  let presentSourceCount = 0;
  for (const sourceKey of LEGACY_PROVIDER_SOURCES) {
    const raw = readValue(storage, sourceKey);
    if (raw === null) continue;
    presentSourceCount += 1;
    const parsed = safeJson(raw);
    const inspection = collectProviderSecrets(parsed);
    if (inspection.unsupported) {
      unsupportedSources.push(sourceKey);
      continue;
    }
    if (inspection.pairs.length) sources.push({ sourceKey, raw, parsed, pairs: inspection.pairs });
  }

  if (unsupportedSources.length) {
    return Object.freeze({
      schema: 'eon.vault.migration-receipt.a15-i08.v2',
      ok: false,
      reason: 'legacy-source-unrecognized',
      migratedProviderCount: 0,
      migratedProviders: [],
      sourceCount: presentSourceCount,
      failedSourceCount: unsupportedSources.length,
      sources: unsupportedSources.map((sourceKey) => ({ sourceKey, ok: false, providerCount: 0, providers: [] })),
      verifiedWrites: false,
      rolledBack: true,
      passphrasePersisted: false,
      rawSecretsIncluded: false,
      valuesPersistedInReceipt: false
    });
  }

  if (!sources.length) {
    const receipt = Object.freeze({
      schema: 'eon.vault.migration-receipt.a15-i08.v2',
      completedAt: nowIso(now),
      migratedProviderCount: 0,
      migratedProviders: [],
      sourceCount: 0,
      failedSourceCount: 0,
      sources: [],
      verifiedWrites: true,
      rawSecretsIncluded: false,
      valuesPersistedInReceipt: false
    });
    const receiptRaw = JSON.stringify(receipt);
    if (!writeValue(storage, EON_VAULT_MIGRATION_RECEIPT_KEY, receiptRaw) || readValue(storage, EON_VAULT_MIGRATION_RECEIPT_KEY) !== receiptRaw) {
      return Object.freeze({ ...receipt, ok: false, reason: 'migration-receipt-write-failed', verifiedWrites: false });
    }
    return Object.freeze({ ...receipt, ok: true });
  }

  const capture = (target, key) => ({ exists: readValue(target, key) !== null, value: readValue(target, key) });
  const restore = (target, key, snapshot) => {
    if (!target) return true;
    const ok = snapshot.exists ? writeValue(target, key, snapshot.value) : removeValue(target, key);
    return ok && readValue(target, key) === (snapshot.exists ? snapshot.value : null);
  };
  const vaultBefore = capture(storage, EON_API_KEY_VAULT_STORAGE_KEY);
  const sessionBefore = capture(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY);
  const receiptBefore = capture(storage, EON_VAULT_MIGRATION_RECEIPT_KEY);
  const sourceBefore = new Map(sources.map((source) => [source.sourceKey, capture(storage, source.sourceKey)]));
  const migratedProviders = new Set();
  const results = [];

  try {
    for (const source of sources) {
      const sourceProviders = [];
      for (const pair of source.pairs) {
        await vault.store(pair.provider, pair.secret, { persist: true, passphrase, storage, sessionStorage, now });
        migratedProviders.add(pair.provider);
        sourceProviders.push(pair.provider);
      }
      const redacted = redactMigratedLegacySource(source.parsed, source.pairs);
      const expected = containsMeaningfulData(redacted) ? JSON.stringify(redacted) : null;
      const changed = expected === null ? removeValue(storage, source.sourceKey) : writeValue(storage, source.sourceKey, expected);
      if (!changed || readValue(storage, source.sourceKey) !== expected) throw new Error(`Legacy source write verification failed: ${source.sourceKey}`);
      results.push({ sourceKey: source.sourceKey, ok: true, providerCount: sourceProviders.length, providers: sourceProviders.sort() });
    }

    const receipt = Object.freeze({
      schema: 'eon.vault.migration-receipt.a15-i08.v2',
      completedAt: nowIso(now),
      migratedProviderCount: migratedProviders.size,
      migratedProviders: [...migratedProviders].sort(),
      sourceCount: results.length,
      failedSourceCount: 0,
      sources: results.map((row) => ({ sourceKey: row.sourceKey, ok: true, providerCount: row.providerCount, providers: row.providers })),
      verifiedWrites: true,
      passphrasePersisted: false,
      rawSecretsIncluded: false,
      valuesPersistedInReceipt: false
    });
    const receiptRaw = JSON.stringify(receipt);
    if (!writeValue(storage, EON_VAULT_MIGRATION_RECEIPT_KEY, receiptRaw) || readValue(storage, EON_VAULT_MIGRATION_RECEIPT_KEY) !== receiptRaw) throw new Error('Migration receipt write did not verify.');
    return Object.freeze({ ...receipt, ok: true });
  } catch {
    let rolledBack = restore(storage, EON_API_KEY_VAULT_STORAGE_KEY, vaultBefore)
      && restore(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY, sessionBefore)
      && restore(storage, EON_VAULT_MIGRATION_RECEIPT_KEY, receiptBefore);
    for (const [key, snapshot] of sourceBefore.entries()) rolledBack = restore(storage, key, snapshot) && rolledBack;
    return Object.freeze({
      schema: 'eon.vault.migration-receipt.a15-i08.v2',
      ok: false,
      reason: rolledBack ? 'migration-failed-rolled-back' : 'migration-failed-rollback-incomplete',
      migratedProviderCount: 0,
      migratedProviders: [],
      sourceCount: sources.length,
      failedSourceCount: sources.length,
      sources: sources.map((source) => ({ sourceKey: source.sourceKey, ok: false, providerCount: 0, providers: [] })),
      verifiedWrites: false,
      rolledBack,
      passphrasePersisted: false,
      rawSecretsIncluded: false,
      valuesPersistedInReceipt: false
    });
  }
}

function canonicalMode(mode = 'merge') {
  const value = String(mode || 'merge');
  if (value === 'merge' || value === 'replace-eonapp') return value;
  throw new Error('Unsupported Vault restore mode.');
}

function buildStagedRestoreEntries(snapshot = {}) {
  const sourceMap = snapshot?.storage && typeof snapshot.storage === 'object' && !Array.isArray(snapshot.storage) ? snapshot.storage : {};
  const entries = {};
  const invalidKeys = [];
  const ignoredKeys = [];
  for (const key of Object.keys(sourceMap).sort()) {
    if (!isEonAppBackupEligibleKey(key)) { ignoredKeys.push(key); continue; }
    const value = sourceMap[key];
    if (typeof value !== 'string') { invalidKeys.push(key); continue; }
    const safe = sanitiseBackupRawValue(value, key);
    if (safe === null) { invalidKeys.push(key); continue; }
    entries[key] = safe;
  }
  return Object.freeze({ entries: Object.freeze(entries), invalidKeys: Object.freeze(invalidKeys), ignoredKeys: Object.freeze(ignoredKeys) });
}

function captureStorageState(storage, keys = []) {
  const captured = {};
  for (const key of [...new Set(keys)].sort()) {
    const value = readValue(storage, key);
    captured[key] = Object.freeze({ exists: value !== null, value });
  }
  return Object.freeze(captured);
}

function rollbackStorageState(storage, captured = {}) {
  let ok = true;
  for (const key of Object.keys(captured).sort()) {
    const row = captured[key];
    if (row.exists) {
      if (!writeValue(storage, key, row.value) || readValue(storage, key) !== row.value) ok = false;
    } else if (!removeValue(storage, key) || readValue(storage, key) !== null) ok = false;
  }
  return ok;
}

export function buildEonAppRestorePlan(snapshot = {}, options = {}) {
  const storage = resolveStorage(options.storage);
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const storageMap = source.storage && typeof source.storage === 'object' && !Array.isArray(source.storage) ? source.storage : {};
  const staged = buildStagedRestoreEntries(source);
  const backupKeys = Object.keys(staged.entries).sort();
  const currentOwnedKeys = listEonAppOwnedStorageKeys({ storage });
  const currentPortableKeys = listEonAppBackupEligibleKeys({ storage });
  const overwriteKeys = backupKeys.filter((key) => readValue(storage, key) !== null);
  const createKeys = backupKeys.filter((key) => readValue(storage, key) === null);
  const staleKeys = currentPortableKeys.filter((key) => !backupKeys.includes(key));
  const preservedLocalOnlyKeys = currentOwnedKeys.filter((key) => !isEonAppBackupEligibleKey(key));
  return Object.freeze({
    schema: EON_VAULT_LIFECYCLE_SCHEMA,
    transactionSchema: 'eon.vault.restore-transaction.w637.v1',
    backupOwnedKeyCount: backupKeys.length,
    currentOwnedKeyCount: currentOwnedKeys.length,
    currentPortableKeyCount: currentPortableKeys.length,
    createKeys,
    overwriteKeys,
    staleKeys,
    preservedLocalOnlyKeys,
    ignoredNonEonBackupKeys: staged.ignoredKeys,
    rejectedInvalidBackupKeys: staged.invalidKeys,
    portableStateManifest: buildPortableStateManifest(Object.keys(storageMap)),
    unrelatedBrowserStoragePreserved: true,
    localCredentialsAndIdentityPreserved: true,
    stagedBeforeMutation: true,
    rollbackPrepared: true,
    defaultMode: 'merge',
    replaceEonAppModeAvailable: true,
    noRawValuesExposed: true
  });
}

export function restoreEonAppOwnedStorage(snapshot = {}, options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', restored: 0, rolledBack: false });
  const mode = canonicalMode(options.mode);
  const staged = buildStagedRestoreEntries(snapshot);
  const plan = buildEonAppRestorePlan(snapshot, { storage });
  if (staged.invalidKeys.length) {
    return Object.freeze({ ok: false, reason: 'invalid-backup-records', restored: 0, rolledBack: false, plan });
  }

  const writeKeys = Object.keys(staged.entries).sort();
  const removalKeys = mode === 'replace-eonapp' ? plan.staleKeys : [];
  const affectedKeys = [...new Set([...writeKeys, ...removalKeys, EON_VAULT_RESTORE_RECEIPT_KEY])].sort();
  const before = captureStorageState(storage, affectedKeys);
  const restoredAt = nowIso(options.now || Date.now());

  try {
    for (const key of removalKeys) {
      if (!removeValue(storage, key) || readValue(storage, key) !== null) throw new Error('remove-verification-failed');
    }
    for (const key of writeKeys) {
      const value = staged.entries[key];
      if (!writeValue(storage, key, value) || readValue(storage, key) !== value) throw new Error('write-verification-failed');
    }
    const receipt = Object.freeze({
      schema: 'eon.vault.restore-receipt.v3',
      transactionSchema: 'eon.vault.restore-transaction.w637.v1',
      restoredAt,
      mode,
      restored: writeKeys.length,
      overwritten: plan.overwriteKeys.length,
      created: plan.createKeys.length,
      removedStaleEonAppKeys: removalKeys.length,
      preservedLocalOnlyKeys: plan.preservedLocalOnlyKeys.length,
      unrelatedBrowserStoragePreserved: true,
      localCredentialsAndIdentityPreserved: true,
      stagedBeforeMutation: true,
      writesVerified: true,
      rollbackPrepared: true,
      rawValuesIncluded: false
    });
    const serializedReceipt = JSON.stringify(receipt);
    if (!writeValue(storage, EON_VAULT_RESTORE_RECEIPT_KEY, serializedReceipt) || readValue(storage, EON_VAULT_RESTORE_RECEIPT_KEY) !== serializedReceipt) {
      throw new Error('receipt-verification-failed');
    }
    return Object.freeze({ ok: true, ...receipt, rolledBack: false, plan });
  } catch (error) {
    const rolledBack = rollbackStorageState(storage, before);
    return Object.freeze({
      ok: false,
      reason: 'storage-transaction-failed',
      failure: String(error?.message || 'storage-write-failed').slice(0, 80),
      restored: 0,
      rolledBack,
      rollbackVerified: rolledBack,
      unrelatedBrowserStoragePreserved: true,
      localCredentialsAndIdentityPreserved: true,
      plan
    });
  }
}

/** Clears only EONAPP-owned storage after an explicit typed confirmation. */
export function clearEonAppOwnedStorage(options = {}) {
  const storage = resolveStorage(options.storage);
  if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', removed: 0 });
  if (String(options.confirmation || '') !== EON_VAULT_CLEAR_CONFIRMATION) {
    return Object.freeze({ ok: false, reason: 'confirmation-required', removed: 0, confirmationRequired: EON_VAULT_CLEAR_CONFIRMATION });
  }
  const keys = listEonAppOwnedStorageKeys({ storage }).filter((key) => key !== EON_VAULT_CLEAR_RECEIPT_KEY);
  let removed = 0;
  for (const key of keys) if (removeValue(storage, key)) removed += 1;
  const receipt = Object.freeze({
    schema: 'eon.vault.clear-receipt.v1',
    clearedAt: nowIso(options.now || Date.now()),
    removed,
    unrelatedBrowserStoragePreserved: true,
    rawValuesIncluded: false,
    warning: 'This action removes EONAPP local browser data only. It cannot delete provider-side accounts or recover a lost backup passphrase.'
  });
  writeValue(storage, EON_VAULT_CLEAR_RECEIPT_KEY, JSON.stringify(receipt));
  return Object.freeze({ ok: true, ...receipt });
}
