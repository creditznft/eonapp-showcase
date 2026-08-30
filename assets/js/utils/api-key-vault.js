/**
 * A15 I08 — canonical provider credential custody.
 *
 * Security contract:
 * - Provider keys are session-only by default.
 * - Durable browser recovery is opt-in and requires an explicit user passphrase.
 * - The passphrase is never stored with the ciphertext.
 * - Every durable write is read back and cryptographically verified.
 * - Legacy plaintext/device-bound stores are never read automatically.
 * - Receipts and diagnostics contain provider names and states only, never keys,
 *   ciphertext, salts, passphrases, identity material, or key fragments.
 */

export const EON_API_KEY_VAULT_SCHEMA = 'eon.api-key-vault.a15-i08.v2';
export const EON_API_KEY_VAULT_ENTRY_SCHEMA = 'eon.api-key-vault.entry.a15-i08.v2';
export const EON_API_KEY_VAULT_BACKUP_SCHEMA = 'eon.api-key-vault.backup.a15-i08.v2';
export const EON_API_KEY_VAULT_STORAGE_KEY = 'eon:api-key-vault:v2';
export const EON_API_KEY_SESSION_STORAGE_KEY = 'eon:ai-chat-session-keys:v1';

export const EON_API_KEY_VAULT_LEGACY_KEYS = Object.freeze({
  encryptedVault: 'eon:api-key-vault:v1',
  salt: 'eon:api-key-vault:salt:v1',
  deviceSecret: 'eon:api-key-vault:device-secret:v1',
  migrationMarker: 'eon:api-key-vault:migrated:v1',
  onboardingProviders: 'eon:onboarding:providers:v1'
});

const PBKDF2_ITERATIONS = 310_000;
const MIN_PASSPHRASE_LENGTH = 12;
const MAX_PROVIDER_LENGTH = 80;
const MAX_KEY_LENGTH = 4096;
const PROVIDER_PATTERN = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getCrypto(cryptoApi = null) {
  const api = cryptoApi || globalThis.crypto;
  if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Secure browser cryptography is unavailable. The key remains session-only.');
  return api;
}

function getLocalStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function getSessionStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function nowIso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function normalizeProvider(value = '') {
  const provider = String(value || '').trim().toLowerCase();
  if (!PROVIDER_PATTERN.test(provider) || provider.length > MAX_PROVIDER_LENGTH) throw new Error('Choose a supported provider before storing a key.');
  return provider;
}

function normalizeKey(value = '') {
  const key = String(value || '').trim();
  if (!key) throw new Error('Enter a provider key first.');
  if (key.length > MAX_KEY_LENGTH) throw new Error('The provider key is larger than the supported local limit.');
  return key;
}

function normalizePassphrase(value = '') {
  const passphrase = String(value || '');
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) throw new Error(`Choose a recovery passphrase with at least ${MIN_PASSPHRASE_LENGTH} characters.`);
  return passphrase;
}

function safeJson(raw, fallback = null) {
  try { return JSON.parse(String(raw || '')); } catch { return fallback; }
}

function readRaw(storage, key) {
  try { return storage?.getItem?.(key) ?? null; } catch { return null; }
}

function writeVerified(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') throw new Error('Browser storage is unavailable.');
  const raw = String(value);
  storage.setItem(key, raw);
  if (readRaw(storage, key) !== raw) throw new Error('Browser storage did not verify the credential write.');
  return true;
}

function removeVerified(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function') throw new Error('Browser storage is unavailable.');
  storage.removeItem(key);
  if (readRaw(storage, key) !== null) throw new Error('Browser storage did not verify credential removal.');
  return true;
}

function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value = '') {
  const source = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = source.padEnd(Math.ceil(source.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function readSessionMap(storage = null) {
  const parsed = safeJson(readRaw(getSessionStorage(storage), EON_API_KEY_SESSION_STORAGE_KEY), {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function writeSessionMap(map, storage = null) {
  const target = getSessionStorage(storage);
  writeVerified(target, EON_API_KEY_SESSION_STORAGE_KEY, JSON.stringify(map));
  return map;
}

function readVault(storage = null) {
  const parsed = safeJson(readRaw(getLocalStorage(storage), EON_API_KEY_VAULT_STORAGE_KEY), {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function isEnvelope(entry) {
  return Boolean(entry
    && typeof entry === 'object'
    && entry.schema === EON_API_KEY_VAULT_ENTRY_SCHEMA
    && typeof entry.salt === 'string'
    && typeof entry.iv === 'string'
    && typeof entry.ciphertext === 'string'
    && entry.iterations === PBKDF2_ITERATIONS
    && entry.cipher === 'AES-GCM-256'
    && entry.kdf === 'PBKDF2-SHA-256');
}

function normalizeVault(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const output = {};
  for (const [providerValue, entry] of Object.entries(source)) {
    let provider = '';
    try { provider = normalizeProvider(providerValue); } catch { continue; }
    if (isEnvelope(entry)) output[provider] = { ...entry };
  }
  return output;
}

function makeAad(provider) {
  return encoder.encode(JSON.stringify({ schema: EON_API_KEY_VAULT_ENTRY_SCHEMA, provider }));
}

async function deriveKey(passphrase, salt, cryptoApi = null) {
  const api = getCrypto(cryptoApi);
  const material = await api.subtle.importKey('raw', encoder.encode(normalizePassphrase(passphrase)), 'PBKDF2', false, ['deriveKey']);
  return api.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function seal(provider, apiKey, passphrase, { cryptoApi = null, now = Date.now(), createdAt = '' } = {}) {
  const api = getCrypto(cryptoApi);
  const salt = api.getRandomValues(new Uint8Array(32));
  const iv = api.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, api);
  const ciphertext = await api.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: makeAad(provider) },
    key,
    encoder.encode(apiKey)
  );
  return Object.freeze({
    schema: EON_API_KEY_VAULT_ENTRY_SCHEMA,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    cipher: 'AES-GCM-256',
    salt: toBase64Url(salt),
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(ciphertext),
    createdAt: createdAt || nowIso(now),
    updatedAt: nowIso(now)
  });
}

async function open(provider, entry, passphrase, { cryptoApi = null } = {}) {
  if (!isEnvelope(entry)) throw new Error('The encrypted provider-key envelope is invalid.');
  const api = getCrypto(cryptoApi);
  try {
    const salt = fromBase64Url(entry.salt);
    const iv = fromBase64Url(entry.iv);
    const ciphertext = fromBase64Url(entry.ciphertext);
    if (salt.length !== 32 || iv.length !== 12 || !ciphertext.length) throw new Error('Malformed envelope');
    const key = await deriveKey(passphrase, salt, api);
    const plaintext = await api.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: makeAad(provider) },
      key,
      ciphertext
    );
    return decoder.decode(plaintext);
  } catch {
    throw new Error('The encrypted provider key could not be opened. Check the recovery passphrase.');
  }
}

function captureRaw(storage, key) {
  const raw = readRaw(storage, key);
  return Object.freeze({ exists: raw !== null, raw });
}

function rollbackRaw(storage, key, snapshot) {
  try {
    if (snapshot.exists) writeVerified(storage, key, snapshot.raw);
    else removeVerified(storage, key);
    return true;
  } catch {
    return false;
  }
}

async function retrieveDiagnostic(providerValue, options = {}) {
  const startedAt = Date.now();
  let provider;
  try { provider = normalizeProvider(providerValue); } catch {
    return { key: null, failureStage: 'provider-invalid', durationMs: Date.now() - startedAt, custody: 'none' };
  }
  const sessionMap = readSessionMap(options.sessionStorage);
  const sessionKey = String(sessionMap[provider] || '').trim();
  if (sessionKey) return { key: sessionKey, failureStage: '', durationMs: Date.now() - startedAt, custody: 'session-only' };

  const rawVault = readVault(options.storage);
  if (Object.prototype.hasOwnProperty.call(rawVault, provider) && !isEnvelope(rawVault[provider])) {
    return { key: null, failureStage: 'envelope-malformed', durationMs: Date.now() - startedAt, custody: 'encrypted-passphrase' };
  }
  const vault = normalizeVault(rawVault);
  const entry = vault[provider];
  if (!entry) return { key: null, failureStage: 'provider-entry-missing', durationMs: Date.now() - startedAt, custody: 'none' };
  if (!options.passphrase) return { key: null, failureStage: 'passphrase-required', durationMs: Date.now() - startedAt, custody: 'encrypted-passphrase' };

  const work = open(provider, entry, options.passphrase, options)
    .then((key) => ({ key, failureStage: '', custody: 'encrypted-passphrase' }))
    .catch(() => ({ key: null, failureStage: 'decrypt-failed', custody: 'encrypted-passphrase' }));
  const timeoutMs = Math.max(250, Math.min(60_000, Number(options.timeoutMs || 30_000)));
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve({ key: null, failureStage: 'operation-timeout', custody: 'encrypted-passphrase' }), timeoutMs);
  });
  const result = await Promise.race([work, timeout]);
  clearTimeout(timeoutId);
  return { ...result, durationMs: Date.now() - startedAt };
}

function storageContainsKey(storage, wantedKey) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') return false;
  for (let index = 0; index < storage.length; index += 1) {
    try { if (String(storage.key(index) || '') === wantedKey) return true; } catch {}
  }
  return false;
}

function legacySourcePresence(storage = null) {
  const target = getLocalStorage(storage);
  return Object.freeze({
    plaintextSourcePresent: storageContainsKey(target, EON_API_KEY_VAULT_LEGACY_KEYS.onboardingProviders),
    encryptedSourcePresent: storageContainsKey(target, EON_API_KEY_VAULT_LEGACY_KEYS.encryptedVault),
    deviceSecretPresent: storageContainsKey(target, EON_API_KEY_VAULT_LEGACY_KEYS.deviceSecret),
    saltPresent: storageContainsKey(target, EON_API_KEY_VAULT_LEGACY_KEYS.salt)
  });
}

export const ApiKeyVault = Object.freeze({
  schema: EON_API_KEY_VAULT_SCHEMA,

  /**
   * Store a key for the current browser session. Durable recovery is created
   * only when persist=true and a user-supplied passphrase is present.
   */
  async store(providerValue, apiKeyValue, options = {}) {
    const provider = normalizeProvider(providerValue);
    const apiKey = normalizeKey(apiKeyValue);
    const sessionStorage = getSessionStorage(options.sessionStorage);
    const sessionMap = readSessionMap(sessionStorage);
    const previousSession = captureRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY);
    sessionMap[provider] = apiKey;
    try {
      writeSessionMap(sessionMap, sessionStorage);
      if (String(readSessionMap(sessionStorage)[provider] || '') !== apiKey) throw new Error('Session key verification failed.');
    } catch (error) {
      rollbackRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY, previousSession);
      throw error;
    }

    const persist = options.persist === true || Boolean(options.passphrase);
    if (!persist) {
      return Object.freeze({
        schema: 'eon.api-key-vault.write-receipt.a15-i08.v1',
        ok: true,
        provider,
        custody: 'session-only',
        durableRecoveryCreated: false,
        verifiedWrite: true,
        rawSecretIncluded: false,
        at: nowIso(options.now)
      });
    }

    const passphrase = normalizePassphrase(options.passphrase);
    const storage = getLocalStorage(options.storage);
    if (!storage) throw new Error('Durable browser storage is unavailable. The key remains session-only.');
    const before = captureRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY);
    const vault = normalizeVault(readVault(storage));
    const entry = await seal(provider, apiKey, passphrase, { ...options, createdAt: vault[provider]?.createdAt || '' });
    vault[provider] = entry;
    try {
      const raw = JSON.stringify(vault);
      writeVerified(storage, EON_API_KEY_VAULT_STORAGE_KEY, raw);
      const written = normalizeVault(readVault(storage))[provider];
      if (!written || JSON.stringify(written) !== JSON.stringify(entry)) throw new Error('Encrypted credential write did not verify.');
      const reopened = await open(provider, written, passphrase, options);
      if (reopened !== apiKey) throw new Error('Encrypted credential verification failed.');
    } catch (error) {
      rollbackRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY, before);
      throw error;
    }
    return Object.freeze({
      schema: 'eon.api-key-vault.write-receipt.a15-i08.v1',
      ok: true,
      provider,
      custody: 'encrypted-passphrase',
      durableRecoveryCreated: true,
      verifiedWrite: true,
      rawSecretIncluded: false,
      at: nowIso(options.now)
    });
  },

  async retrieve(provider, options = {}) {
    return (await retrieveDiagnostic(provider, options)).key;
  },

  async diagnoseRetrieve(provider, options = {}) {
    const result = await retrieveDiagnostic(provider, options);
    return Object.freeze({
      schema: 'eon.api-key-vault.diagnostic.a15-i08.v1',
      resolved: result.failureStage !== 'operation-timeout',
      nonEmptyKeyReturned: Boolean(result.key),
      durationMs: result.durationMs,
      failureStage: result.failureStage || '',
      custody: result.custody,
      errorName: result.failureStage ? 'VaultRestoreError' : '',
      rawSecretIncluded: false
    });
  },

  list(options = {}) {
    const sessionProviders = Object.keys(readSessionMap(options.sessionStorage));
    const encryptedProviders = Object.keys(normalizeVault(readVault(options.storage)));
    return [...new Set([...sessionProviders, ...encryptedProviders])].sort();
  },

  hasKeys(options = {}) {
    return this.list(options).length > 0;
  },

  status(options = {}) {
    const sessionProviders = Object.keys(readSessionMap(options.sessionStorage)).sort();
    const encryptedProviders = Object.keys(normalizeVault(readVault(options.storage))).sort();
    const legacy = legacySourcePresence(options.storage);
    return Object.freeze({
      schema: 'eon.api-key-vault.status.a15-i08.v2',
      hasSessionEntries: sessionProviders.length > 0,
      hasEncryptedEntries: encryptedProviders.length > 0,
      providers: [...new Set([...sessionProviders, ...encryptedProviders])].sort(),
      sessionProviders,
      encryptedProviders,
      legacyPlaintextProviders: [],
      legacyEncryptedProviders: [],
      legacyPlaintextSourcePresent: legacy.plaintextSourcePresent,
      legacyEncryptedSourcePresent: legacy.encryptedSourcePresent,
      legacyDeviceSecretSourcePresent: legacy.deviceSecretPresent,
      legacySaltSourcePresent: legacy.saltPresent,
      sessionOnlyByDefault: true,
      explicitPassphraseRequiredForPersistence: true,
      passphrasePersisted: false,
      deviceSecretCreated: false,
      legacyIdentityDecryptFallback: false,
      automaticLegacyRead: false,
      plaintextStorageDisabled: true,
      verifiedWrites: true
    });
  },

  exportEncryptedBackup(options = {}) {
    const vault = normalizeVault(readVault(options.storage));
    return Object.freeze({
      schema: EON_API_KEY_VAULT_BACKUP_SCHEMA,
      exportedAt: nowIso(options.now),
      vault,
      providerNames: Object.keys(vault).sort(),
      plaintextKeysIncluded: false,
      passphraseIncluded: false,
      deviceSecretIncluded: false,
      warning: 'This file contains passphrase-encrypted provider-key envelopes. Keep the passphrase separately.'
    });
  },

  importEncryptedBackup(bundle = {}, options = {}) {
    if (options.confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required', imported: 0 });
    const source = bundle && typeof bundle === 'object' ? bundle : {};
    if (source.schema !== EON_API_KEY_VAULT_BACKUP_SCHEMA || !source.vault || typeof source.vault !== 'object') {
      return Object.freeze({ ok: false, reason: 'unsupported-backup', imported: 0 });
    }
    const incoming = normalizeVault(source.vault);
    if (Object.keys(incoming).length !== Object.keys(source.vault).length) return Object.freeze({ ok: false, reason: 'invalid-encrypted-entry', imported: 0 });
    const storage = getLocalStorage(options.storage);
    if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', imported: 0 });
    const before = captureRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY);
    const current = options.merge === false ? {} : normalizeVault(readVault(storage));
    const next = { ...current, ...incoming };
    try {
      writeVerified(storage, EON_API_KEY_VAULT_STORAGE_KEY, JSON.stringify(next));
      if (JSON.stringify(normalizeVault(readVault(storage))) !== JSON.stringify(next)) throw new Error('Encrypted backup import did not verify.');
    } catch {
      rollbackRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY, before);
      return Object.freeze({ ok: false, reason: 'verified-write-failed', imported: 0 });
    }
    return Object.freeze({ ok: true, reason: '', imported: Object.keys(incoming).length, providerNames: Object.keys(incoming).sort(), rawSecretIncluded: false });
  },

  remove(providerValue, options = {}) {
    const provider = normalizeProvider(providerValue);
    const sessionStorage = getSessionStorage(options.sessionStorage);
    const storage = getLocalStorage(options.storage);
    const sessionBefore = captureRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY);
    const localBefore = storage ? captureRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY) : null;
    const sessionMap = readSessionMap(sessionStorage);
    const vault = normalizeVault(readVault(storage));
    delete sessionMap[provider];
    delete vault[provider];
    try {
      writeSessionMap(sessionMap, sessionStorage);
      if (storage) {
        if (Object.keys(vault).length) writeVerified(storage, EON_API_KEY_VAULT_STORAGE_KEY, JSON.stringify(vault));
        else if (readRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY) !== null) removeVerified(storage, EON_API_KEY_VAULT_STORAGE_KEY);
      }
      if (readSessionMap(sessionStorage)[provider] || normalizeVault(readVault(storage))[provider]) throw new Error('Credential removal did not verify.');
    } catch (error) {
      rollbackRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY, sessionBefore);
      if (storage && localBefore) rollbackRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY, localBefore);
      throw error;
    }
    return Object.freeze({ ok: true, provider, sessionRemoved: true, encryptedRecoveryRemoved: true, verifiedRemoval: true, rawSecretIncluded: false });
  },

  /**
   * Reviewed one-time migration for the legacy onboarding provider container.
   * The source is untouched unless every detected key is stored and verified.
   */
  async migrateFromPlaintext(options = {}) {
    if (options.confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required', migrated: 0, rawSecretIncluded: false });
    const passphrase = normalizePassphrase(options.passphrase);
    const storage = getLocalStorage(options.storage);
    if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', migrated: 0, rawSecretIncluded: false });
    const sourceKey = EON_API_KEY_VAULT_LEGACY_KEYS.onboardingProviders;
    const sourceRaw = readRaw(storage, sourceKey);
    if (sourceRaw === null) return Object.freeze({ ok: true, reason: 'source-absent', migrated: 0, providerNames: [], rawSecretIncluded: false });
    const parsed = safeJson(sourceRaw, null);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return Object.freeze({ ok: false, reason: 'legacy-source-malformed', migrated: 0, rawSecretIncluded: false });
    const pairs = Object.entries(parsed).map(([providerValue, entry]) => {
      let provider = '';
      try { provider = normalizeProvider(providerValue); } catch { return null; }
      const apiKey = entry && typeof entry === 'object' ? String(entry.apiKey || '').trim() : '';
      return provider && apiKey ? { provider, apiKey } : null;
    }).filter(Boolean);
    if (!pairs.length) return Object.freeze({ ok: true, reason: 'no-plaintext-keys', migrated: 0, providerNames: [], rawSecretIncluded: false });

    const vaultBefore = captureRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY);
    const sessionStorage = getSessionStorage(options.sessionStorage);
    const sessionBefore = captureRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY);
    try {
      for (const pair of pairs) await this.store(pair.provider, pair.apiKey, { ...options, persist: true, passphrase });
      const redacted = { ...parsed };
      for (const pair of pairs) {
        const current = redacted[pair.provider];
        if (current && typeof current === 'object') {
          const next = { ...current };
          delete next.apiKey;
          if (Object.keys(next).length) redacted[pair.provider] = next;
          else delete redacted[pair.provider];
        }
      }
      if (Object.keys(redacted).length) writeVerified(storage, sourceKey, JSON.stringify(redacted));
      else removeVerified(storage, sourceKey);
    } catch {
      rollbackRaw(storage, EON_API_KEY_VAULT_STORAGE_KEY, vaultBefore);
      rollbackRaw(sessionStorage, EON_API_KEY_SESSION_STORAGE_KEY, sessionBefore);
      if (readRaw(storage, sourceKey) !== sourceRaw) writeVerified(storage, sourceKey, sourceRaw);
      return Object.freeze({ ok: false, reason: 'migration-failed-rolled-back', migrated: 0, providerNames: [], rawSecretIncluded: false });
    }
    return Object.freeze({
      ok: true,
      reason: '',
      migrated: pairs.length,
      providerNames: pairs.map((pair) => pair.provider).sort(),
      sourceRemovedOrRedacted: true,
      verifiedWrites: true,
      rawSecretIncluded: false
    });
  }
});

export function getApiKeyVaultCustodyTruth(options = {}) {
  const status = ApiKeyVault.status(options);
  return Object.freeze({
    schema: EON_API_KEY_VAULT_SCHEMA,
    sessionOnlyByDefault: true,
    persistentRecovery: 'explicit-passphrase-encrypted',
    passphrasePersistence: false,
    deviceSecretPersistence: false,
    identityPrivateKeyLookup: false,
    automaticPlaintextMigration: false,
    verifiedWritesAndRemoval: true,
    rawSecretsInReceipts: false,
    status
  });
}
