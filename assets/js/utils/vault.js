import { buildVaultPersistenceManifest, recordVaultPersistenceRestore } from './vault-persistence-proof.js';
import { buildW145UpdateSurvivalManifest, getW145UpdateSurvivalStatus, recordW145UpdateSurvivalReceipt } from './update-safe-user-data.js';
import { getGoogleDriveBackupFoundationTruth } from '../local-first/eon-google-drive-backup-foundation.js';
import { getW637PersistenceRecoveryTruth } from '../../../config/w637-persistence-migration-recovery-contract.mjs';
import {
  collectEonAppOwnedStorage,
  getVaultAccountBoundary,
  restoreEonAppOwnedStorage
} from '../vault/eon-vault-lifecycle.js';
function arrayBufferToBase64(/** @type {any} */ buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

function base64ToArrayBuffer(/** @type {any} */ base64, { label = 'base64', maxBytes = 16 * 1024 * 1024 } = {}) {
  const raw = String(base64 || '');
  if (!raw || raw.length > Math.ceil(maxBytes * 4 / 3) + 8 || raw.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
    throw new Error(`Invalid ${label} encoding`);
  }
  let binary = '';
  try { binary = atob(raw); } catch { throw new Error(`Invalid ${label} encoding`); }
  if (binary.length > maxBytes) throw new Error(`${label} exceeds the restore limit`);
  return Uint8Array.from(binary, (/** @type {any} */ char) => char.charCodeAt(0));
}

export const SNAPSHOT_VERSION = 5;
export const EON_VAULT_STORAGE_SCHEMA = 'eonapp.portable-storage.w637.v1';
export const MAX_VAULT_IMPORT_BYTES = 16 * 1024 * 1024;
const MAX_SNAPSHOT_PLAINTEXT_BYTES = 12 * 1024 * 1024;
const MAX_SNAPSHOT_KEYS = 1200;
const SUPPORTED_SNAPSHOT_VERSIONS = Object.freeze([1, 2, 3, 4, 5]);
const MIN_ACCEPTED_KDF_ITERATIONS = 200000;
const MAX_ACCEPTED_KDF_ITERATIONS = 2000000;
const KDF_ITERATIONS = 750000;
const MIN_PASSPHRASE_LENGTH = 12;
const MAX_PASSPHRASE_LENGTH = 256;
const RESTORE_ATTEMPTS_KEY = 'eon:vault-restore-attempts:v1';
const RESTORE_WINDOW_MS = 60 * 60 * 1000;
const MAX_RESTORE_ATTEMPTS = 3;
/** @returns {any} */
function normalizeJsonObject(/** @type {any} */ value) {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonObject);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((/** @type {any} */ acc, /** @type {any} */ key) => {
        (/** @type {any} */ (acc))[key] = normalizeJsonObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

async function sha256Hex(/** @type {any} */ value) {
  const encoded = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), /** @type {any} */ byte => byte.toString(16).padStart(2, '0')).join('');
}

function readRestoreAttempts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RESTORE_ATTEMPTS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((/** @type {any} */ entry) => Number.isFinite(entry?.ts) && typeof entry?.ok === 'boolean');
  } catch {
    return [];
  }
}

function writeRestoreAttempts(/** @type {any} */ attempts) {
  try {
    localStorage.setItem(RESTORE_ATTEMPTS_KEY, JSON.stringify(attempts.slice(-50)));
  } catch {
    // ignore storage quota failures
  }
}

function enforceRestoreRateLimit() {
  const cutoff = Date.now() - RESTORE_WINDOW_MS;
  const attempts = readRestoreAttempts().filter((/** @type {any} */ entry) => Number(entry.ts) >= cutoff);
  writeRestoreAttempts(attempts);
  const failedAttempts = attempts.filter((entry) => entry.ok === false);
  if (failedAttempts.length >= MAX_RESTORE_ATTEMPTS) {
    throw new Error('Too many restore attempts. Try again later.');
  }
}

function recordRestoreAttempt(/** @type {any} */ ok, /** @type {any} */ reason = '') {
  const cutoff = Date.now() - RESTORE_WINDOW_MS;
  const attempts = readRestoreAttempts().filter((/** @type {any} */ entry) => Number(entry.ts) >= cutoff);
  attempts.push({ ts: Date.now(), ok: Boolean(ok), reason: String(reason || '').slice(0, 80) });
  writeRestoreAttempts(attempts);
}

function getRestoreAttemptSummary() {
  const cutoff = Date.now() - RESTORE_WINDOW_MS;
  const attempts = readRestoreAttempts().filter((/** @type {any} */ entry) => Number(entry.ts) >= cutoff);
  return {
    attemptsUsed: attempts.filter((entry) => entry.ok === false).length,
    attemptsRemaining: Math.max(0, MAX_RESTORE_ATTEMPTS - attempts.filter((entry) => entry.ok === false).length),
    windowMs: RESTORE_WINDOW_MS,
  };
}

// Validate passphrase for security
function validatePassphrase(/** @type {any} */ passphrase) {
  if (typeof passphrase !== 'string') {
    throw new Error('Passphrase must be a string');
  }
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new Error(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`);
  }
  if (passphrase.length > MAX_PASSPHRASE_LENGTH) {
    throw new Error(`Passphrase must be at most ${MAX_PASSPHRASE_LENGTH} characters`);
  }
  return passphrase;
}

// Validate salt is proper Uint8Array
function validateSalt(/** @type {any} */ salt) {
  if (!(salt instanceof Uint8Array) || salt.length !== 16) {
    throw new Error('Invalid salt: must be 16-byte Uint8Array');
  }
  return salt;
}

async function deriveKey(/** @type {any} */ passphrase, /** @type {any} */ salt) {
  const validatedPassphrase = validatePassphrase(passphrase);
  validateSalt(salt);
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(validatedPassphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

function collectLocalSnapshot(options = {}) {
  const storage = options.storage || globalThis.localStorage;
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    // W209: full Vault backups deliberately contain EONAPP-owned keys only.
    // This prevents exporting unrelated same-origin storage and makes restore
    // preserve unrelated browser data by construction.
    storage: collectEonAppOwnedStorage({ storage })
  };
}

async function addSnapshotMetadata(/** @type {any} */ snapshot) {
  const normalizedStorage = normalizeJsonObject(snapshot.storage || {});
  const /** @type {any} */
payloadForHash = {
    version: snapshot.version,
    exportedAt: snapshot.exportedAt,
    storage: normalizedStorage,
  };
  const payloadHash = await sha256Hex(JSON.stringify(payloadForHash));

  const w139Persistence = buildVaultPersistenceManifest(snapshot.storage || {}, { reason: 'vault-export-metadata' });
  const w145UpdateSurvival = buildW145UpdateSurvivalManifest(snapshot.storage || {}, snapshot.storage || {}, { reason: 'vault-export-metadata', simulatedFrom: 'current-local-state', simulatedTo: 'cloudflare-next-deploy' });

  return {
    ...snapshot,
    metadata: {
      fileKind: 'eonapp-vault',
      storageSchema: EON_VAULT_STORAGE_SCHEMA,
      payloadHash,
      storageKeyCount: Object.keys(normalizedStorage).length,
      integrityMode: 'sha256',
      w139Persistence,
      w145UpdateSurvival,
    }
  };
}

function snapshotByteLength(value = '') {
  try { return new TextEncoder().encode(String(value || '')).byteLength; }
  catch { return String(value || '').length; }
}

function assertSnapshotIntegrity(/** @type {any} */ snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot) || !snapshot.storage || typeof snapshot.storage !== 'object' || Array.isArray(snapshot.storage)) {
    throw new Error('Invalid vault snapshot');
  }
  const version = Number(snapshot.version || 1);
  if (!SUPPORTED_SNAPSHOT_VERSIONS.includes(version)) throw new Error('Unsupported vault snapshot version');
  const keys = Object.keys(snapshot.storage);
  if (keys.length > MAX_SNAPSHOT_KEYS) throw new Error('Vault snapshot contains too many records');
  let totalBytes = 0;
  for (const key of keys) {
    if (!key || key.length > 240 || typeof snapshot.storage[key] !== 'string') throw new Error('Vault snapshot contains an invalid record');
    totalBytes += snapshotByteLength(key) + snapshotByteLength(snapshot.storage[key]);
    if (totalBytes > MAX_SNAPSHOT_PLAINTEXT_BYTES) throw new Error('Vault snapshot exceeds the restore limit');
  }
  if (snapshot.metadata?.fileKind && snapshot.metadata.fileKind !== 'eonapp-vault') throw new Error('Unsupported vault file kind');
  return snapshot;
}

async function verifySnapshotIntegrity(/** @type {any} */ snapshot) {
  const validSnapshot = assertSnapshotIntegrity(snapshot);
  if (!validSnapshot.metadata?.payloadHash) return validSnapshot;

  const normalizedStorage = normalizeJsonObject(validSnapshot.storage || {});
  const /** @type {any} */ payloadForHash = {
    version: validSnapshot.version,
    exportedAt: validSnapshot.exportedAt,
    storage: normalizedStorage,
  };
  const actualHash = await sha256Hex(JSON.stringify(payloadForHash));
  if (actualHash !== validSnapshot.metadata.payloadHash) throw new Error('Vault integrity check failed');
  return validSnapshot;
}

async function migrateSnapshotToCurrent(snapshot) {
  const verified = await verifySnapshotIntegrity(snapshot);
  const sourceVersion = Number(verified.version || 1);
  const current = sourceVersion === SNAPSHOT_VERSION && verified.metadata?.storageSchema === EON_VAULT_STORAGE_SCHEMA;
  if (current) {
    return {
      ...verified,
      migrationReceipt: Object.freeze({ schema: 'eon.vault.snapshot-migration.w637.v1', applied: false, fromVersion: sourceVersion, toVersion: SNAPSHOT_VERSION, rawValuesIncluded: false })
    };
  }
  const migrated = await addSnapshotMetadata({
    version: SNAPSHOT_VERSION,
    exportedAt: String(verified.exportedAt || new Date().toISOString()),
    storage: normalizeJsonObject(verified.storage || {})
  });
  return {
    ...migrated,
    migrationReceipt: Object.freeze({ schema: 'eon.vault.snapshot-migration.w637.v1', applied: true, fromVersion: sourceVersion, toVersion: SNAPSHOT_VERSION, rawValuesIncluded: false })
  };
}

async function buildEnvelopeHash(/** @type {any} */ envelope) {
  return sha256Hex(JSON.stringify(normalizeJsonObject({
    version: envelope.version,
    encrypted: envelope.encrypted,
    exportedAt: envelope.exportedAt,
    kdfIterations: envelope.kdfIterations,
    algorithm: envelope.algorithm,
    salt: envelope.salt,
    iv: envelope.iv,
    cipher: envelope.cipher,
    metadata: envelope.metadata || null,
  })));
}

async function encryptSnapshot(/** @type {any} */ snapshot, /** @type {any} */ passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(snapshot))
  );

  const /** @type {any} */
envelope = {
    version: SNAPSHOT_VERSION,
    encrypted: true,
    exportedAt: snapshot.exportedAt,
    kdfIterations: KDF_ITERATIONS,
    algorithm: 'AES-GCM-256',
    metadata: snapshot.metadata,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    cipher: arrayBufferToBase64(cipher)
  };

  return {
    ...envelope,
    envelopeHash: await buildEnvelopeHash(envelope)
  };
}

async function decryptSnapshot(/** @type {any} */ parsed, /** @type {any} */ passphrase) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.encrypted !== true) throw new Error('Invalid encrypted Vault envelope');
  const version = Number(parsed.version || 0);
  if (!SUPPORTED_SNAPSHOT_VERSIONS.includes(version)) throw new Error('Unsupported Vault envelope version');
  if (parsed.algorithm !== 'AES-GCM-256') throw new Error('Unsupported Vault encryption algorithm');
  const iterations = Number(parsed.kdfIterations || (version >= 2 ? KDF_ITERATIONS : MIN_ACCEPTED_KDF_ITERATIONS));
  if (!Number.isInteger(iterations) || iterations < MIN_ACCEPTED_KDF_ITERATIONS || iterations > MAX_ACCEPTED_KDF_ITERATIONS) {
    throw new Error('Vault KDF settings are outside the accepted safety range');
  }
  validatePassphrase(passphrase);
  if (version >= 4 && !parsed.envelopeHash) throw new Error('Vault envelope integrity hash is required');
  if (parsed.envelopeHash) {
    const actualEnvelopeHash = await buildEnvelopeHash(parsed);
    if (actualEnvelopeHash !== parsed.envelopeHash) throw new Error('Vault backup file appears corrupted');
  }

  const salt = base64ToArrayBuffer(parsed.salt, { label: 'salt', maxBytes: 16 });
  const iv = base64ToArrayBuffer(parsed.iv, { label: 'iv', maxBytes: 12 });
  const cipher = base64ToArrayBuffer(parsed.cipher, { label: 'cipher', maxBytes: MAX_VAULT_IMPORT_BYTES });
  if (salt.byteLength !== 16 || iv.byteLength !== 12 || cipher.byteLength < 17) throw new Error('Invalid Vault encryption envelope');
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  let plainBuffer;
  try { plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher); }
  catch { throw new Error('Vault backup could not be decrypted with this passphrase'); }
  if (plainBuffer.byteLength > MAX_SNAPSHOT_PLAINTEXT_BYTES) throw new Error('Decrypted Vault snapshot exceeds the restore limit');
  let snapshot;
  try { snapshot = JSON.parse(new TextDecoder().decode(plainBuffer)); }
  catch { throw new Error('Decrypted Vault snapshot is invalid'); }
  return verifySnapshotIntegrity(snapshot);
}

function restoreSnapshot(snapshot, options = {}) {
  const result = restoreEonAppOwnedStorage(snapshot, {
    storage: options.storage || globalThis.localStorage,
    mode: options.mode || 'merge'
  });
  if (!result.ok) throw new Error(result.rolledBack ? 'Vault restore failed safely and the previous browser state was restored.' : 'Vault restore could not be completed safely.');
  return result;
}

export async function exportVault(/** @type {any} */ passphrase = '', /** @type {any} */ options = {}) {
  const snapshot = await addSnapshotMetadata(collectLocalSnapshot({ storage: options.storage || globalThis.localStorage }));
  let /** @type {any} */
serialized;
  if (!passphrase && options?.allowPlaintextExport !== true) {
    throw new Error('Vault exports require a passphrase. Plaintext exports are disabled for launch safety.');
  }
  if (!passphrase) {
    serialized = JSON.stringify({
      version: SNAPSHOT_VERSION,
      encrypted: false,
      metadata: snapshot.metadata,
      payload: snapshot
    }, null, 2);
  } else {
    const encrypted = await encryptSnapshot(snapshot, passphrase);
    serialized = JSON.stringify(encrypted, null, 2);
  }

  if (Object.prototype.hasOwnProperty.call(options || {}, 'publishToP2P')) {
    throw new Error('Remote Vault publishing is retired. Export the encrypted file and place it in user-controlled storage manually.');
  }

  return serialized;
}

export function downloadVault(/** @type {any} */ contents) {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const /** @type {any} */
link = document.createElement('a');
  link.href = url;
  link.download = `eonapp-vault-${new Date().toISOString().slice(0, 10)}.eonvault`;
  link.click();
  URL.revokeObjectURL(url);
}

async function readVaultFileText(file) {
  if (!file || typeof file.text !== 'function') throw new Error('Choose a Vault backup file first');
  const declaredSize = Number(file.size || 0);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_VAULT_IMPORT_BYTES) throw new Error('Vault backup file exceeds the 16 MB import limit');
  let text = '';
  try { text = await file.text(); } catch { throw new Error('Vault backup file could not be read'); }
  if (snapshotByteLength(text) > MAX_VAULT_IMPORT_BYTES) throw new Error('Vault backup file exceeds the 16 MB import limit');
  return text;
}

function equalReviewToken(left = '', right = '') {
  const a = String(left || '');
  const b = String(right || '');
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return mismatch === 0;
}

export async function inspectVaultImportFile(file, passphrase = '', options = {}) {
  const text = await readVaultFileText(file);
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('Vault backup file is not valid JSON'); }
  let verified;
  if (parsed?.encrypted === true) verified = await decryptSnapshot(parsed, passphrase);
  else {
    if (options.allowPlaintextImport !== true) throw new Error('Plaintext Vault imports are disabled. Use an encrypted EONAPP backup.');
    verified = await verifySnapshotIntegrity(parsed?.payload);
  }
  const snapshot = await migrateSnapshotToCurrent(verified);
  const fileDigest = await sha256Hex(text);
  const payloadHash = String(snapshot.metadata?.payloadHash || '');
  const reviewToken = await sha256Hex(`w637:${fileDigest}:${payloadHash}:${snapshot.version}`);
  return {
    ...snapshot,
    reviewToken,
    review: Object.freeze({
      schema: 'eon.vault.restore-review.w637.v1',
      fileDigest,
      payloadHash,
      fileBytes: snapshotByteLength(text),
      recordCount: Object.keys(snapshot.storage || {}).length,
      encrypted: parsed?.encrypted === true,
      exactFileRequiredForApply: true,
      rawValuesIncluded: false
    })
  };
}

export async function importVaultFile(file, passphrase = '', options = {}) {
  enforceRestoreRateLimit();
  try {
    if (!String(options.reviewToken || '')) throw new Error('Preview and review this exact encrypted backup before restoring it.');
    const snapshot = await inspectVaultImportFile(file, passphrase, { allowPlaintextImport: options.allowPlaintextImport === true });
    if (!equalReviewToken(options.reviewToken, snapshot.reviewToken)) throw new Error('The selected backup changed after review. Preview it again before restoring.');
    const storage = options.storage || globalThis.localStorage;
    const restoreReceipt = restoreSnapshot(snapshot, { storage, mode: options.mode || 'merge' });
    const w139RestoreReceipt = recordVaultPersistenceRestore(storage, { reason: 'vault-import-file' });
    const updateReceiptOptions = { reason: 'vault-import-file-update-survival-check', previousVersion: 'restored-vault-snapshot', nextVersion: 'current-cloudflare-build' };
    const w145UpdateReceipt = options.storage
      ? recordW145UpdateSurvivalReceipt(storage, updateReceiptOptions)
      : recordW145UpdateSurvivalReceipt(localStorage, updateReceiptOptions);
    snapshot.w139RestoreReceipt = w139RestoreReceipt;
    snapshot.w145UpdateReceipt = w145UpdateReceipt;
    snapshot.restoreReceipt = restoreReceipt;
    recordRestoreAttempt(true, 'import-success');
    return snapshot;
  } catch (error) {
    recordRestoreAttempt(false, error instanceof Error ? error.message : 'import-failed');
    throw error;
  }
}

export function getVaultSecuritySummary() {
  const snapshot = collectLocalSnapshot();
  const restoreSummary = getRestoreAttemptSummary();
  const boundary = getVaultAccountBoundary();
  return {
    version: SNAPSHOT_VERSION,
    encryptedExportAlgorithm: 'AES-GCM-256',
    kdfIterations: KDF_ITERATIONS,
    trackedKeys: Object.keys(snapshot.storage || {}).length,
    storageKeys: Object.keys(snapshot.storage || {}),
    restoreAttemptsRemaining: restoreSummary.attemptsRemaining,
    restoreAttemptsWindowMs: restoreSummary.windowMs,
    remotePublishActive: false,
    automaticCloudBackupActive: false,
    automaticCrossDeviceSyncActive: false,
    persistenceRecovery: getW637PersistenceRecoveryTruth(),
    accountBoundary: boundary,
    backupScope: boundary.backupScope,
    restoreRule: boundary.restoreRule,
    w139Persistence: buildVaultPersistenceManifest(snapshot.storage || {}, { reason: 'vault-security-summary' }),
    w145UpdateSurvival: getW145UpdateSurvivalStatus(snapshot.storage || {}),
  };
}


export function getVaultAccountSurvivalPolicy() {
  return {
    architecture: 'local-first',
    traditionalAccountServerRequired: false,
    centralDatabaseAsOnlyCopyAllowed: false,
    requiredUserOwnedBackup: true,
    encryptedExportAlgorithm: 'AES-GCM-256',
    kdfIterations: KDF_ITERATIONS,
    minPassphraseLength: MIN_PASSPHRASE_LENGTH,
    restoreRateLimit: {
      maxAttempts: MAX_RESTORE_ATTEMPTS,
      windowMs: RESTORE_WINDOW_MS
    },
    protects: [
      'profile',
      'NFT inventory',
      'lootboxes',
      'receipts',
      'subscriptions',
      'reward status',
      'API-key status',
      'settings',
      'language preference'
    ],
    cloudflareUpdateRule: 'New deployments must not wipe app-owned localStorage/IndexedDB state; restore receipts must run after import.',
    backupScope: 'Encrypted Vault export contains allowlisted EONAPP local state only; unrelated same-origin storage and credential containers are excluded.',
    restoreRule: 'Merge restore is the default. Replace mode changes only portable allowlisted EONAPP records; all writes are staged, verified and rolled back on failure, while unrelated storage, local credentials and local identities remain preserved.',
    liveStoragePath: 'The user downloads an encrypted file and manually stores it in user-controlled storage; keep one offline copy.',
    remotePublishActive: false,
    automaticCloudBackupActive: false,
    automaticCrossDeviceSyncActive: false,
    providerCredentialsStoredForBackup: false,
    indexedDbRecovery: getW637PersistenceRecoveryTruth(),
    futureConnectorOrder: ['Google Drive encrypted backup', 'OneDrive encrypted backup'],
    googleDriveBackup: getGoogleDriveBackupFoundationTruth(),
    advancedMirrorStatus: 'Design-only. Any user-owned encrypted mirror requires separate opt-in security, privacy, recovery, and provider proof.'
  };
}
