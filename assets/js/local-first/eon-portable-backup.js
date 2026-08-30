/**
 * W308 — encrypted portable backup/import and recovery drill primitives.
 *
 * This module exports only encrypted record envelopes plus non-secret KDF
 * metadata. It never receives a passphrase or CryptoKey, does not upload or
 * synchronize, and cannot overwrite a differing local record during import.
 */

import { EON_LOCAL_VAULT_PROFILE_SCHEMA } from './eon-local-vault-metadata-store.js';

export const EON_PORTABLE_BACKUP_SCHEMA = 'eonapp.encrypted-portable-backup.v1';
export const EON_PORTABLE_BACKUP_VERSION = 1;
export const EON_PORTABLE_BACKUP_MAX_RECORDS = 500;
export const EON_PORTABLE_BACKUP_MAX_BYTES = 8 * 1024 * 1024;

const encoder = new TextEncoder();
const BACKUP_ID_RE = /^eonbak_[a-z0-9_-]{12,120}$/i;
const RECORD_ID_RE = /^eonrec_[a-z0-9_-]{12,120}$/i;

function cryptoFor(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Web Crypto is unavailable in this browser.');
  return api;
}

function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value || []);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa !== 'function') throw new Error('Base64 encoding is unavailable in this browser.');
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function cleanIso(value = '', fallback = Date.now()) {
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function cleanBase64Url(value = '', min = 1, max = 2_000_000) {
  const clean = String(value || '').trim();
  if (!new RegExp(`^[A-Za-z0-9_-]{${min},${max}}$`).test(clean)) throw new Error('Portable backup contains invalid encoded data.');
  return clean;
}

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}


function normalizeProfile(value = {}) {
  const profile = value && typeof value === 'object' ? value : {};
  const kdf = profile.kdf && typeof profile.kdf === 'object' ? profile.kdf : {};
  const iterations = Number(kdf.iterations);
  if (profile.schema !== EON_LOCAL_VAULT_PROFILE_SCHEMA || profile.id !== 'local-vault-profile') throw new Error('Portable backup needs a valid non-secret local vault profile.');
  if (String(kdf.name || '') !== 'PBKDF2-SHA-256' || !Number.isInteger(iterations) || iterations < 150000 || iterations > 2000000) throw new Error('Portable backup local vault KDF metadata is invalid.');
  if (String(profile.cipher || '') !== 'AES-GCM-256') throw new Error('Portable backup cipher metadata is invalid.');
  return Object.freeze({
    id: 'local-vault-profile',
    schema: EON_LOCAL_VAULT_PROFILE_SCHEMA,
    version: 1,
    salt: cleanBase64Url(profile.salt, 16, 128),
    kdf: Object.freeze({ name: 'PBKDF2-SHA-256', iterations }),
    cipher: 'AES-GCM-256',
    createdAt: cleanIso(profile.createdAt),
    updatedAt: cleanIso(profile.updatedAt)
  });
}

function normalizeEnvelope(value = {}) {
  const envelope = value && typeof value === 'object' ? value : {};
  const algorithm = envelope.algorithm && typeof envelope.algorithm === 'object' ? envelope.algorithm : {};
  if (envelope.schema !== 'eonapp.local-vault-record.v1' || !RECORD_ID_RE.test(String(envelope.recordId || ''))) throw new Error('Portable backup contains an invalid encrypted record envelope.');
  if (String(algorithm.kdf || '') !== 'PBKDF2-SHA-256' || Number(algorithm.iterations) !== 310000 || String(algorithm.cipher || '') !== 'AES-GCM-256') throw new Error('Portable backup contains an unsupported encrypted record algorithm.');
  return Object.freeze({
    schema: 'eonapp.local-vault-record.v1',
    recordId: String(envelope.recordId),
    createdAt: cleanIso(envelope.createdAt),
    algorithm: Object.freeze({ kdf: 'PBKDF2-SHA-256', iterations: 310000, cipher: 'AES-GCM-256' }),
    iv: cleanBase64Url(envelope.iv, 16, 32),
    ciphertext: cleanBase64Url(envelope.ciphertext, 16, 2_000_000)
  });
}

function normalizeRecords(value = []) {
  if (!Array.isArray(value) || value.length > EON_PORTABLE_BACKUP_MAX_RECORDS) throw new Error('Portable backup record count is out of bounds.');
  const seen = new Set();
  return Object.freeze(value.map(normalizeEnvelope).sort((a, b) => a.recordId.localeCompare(b.recordId)).map((record) => {
    if (seen.has(record.recordId)) throw new Error('Portable backup contains duplicate record IDs.');
    seen.add(record.recordId);
    return record;
  }));
}

export function createPortableBackupId({ cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const bytes = api.getRandomValues(new Uint8Array(18));
  return `eonbak_${toBase64Url(bytes)}`;
}

async function digestPayload(payload, { cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const digest = await api.subtle.digest('SHA-256', encoder.encode(stable(payload)));
  return toBase64Url(new Uint8Array(digest));
}

function buildPayload({ backupId, profile, records, createdAt }) {
  return Object.freeze({
    schema: EON_PORTABLE_BACKUP_SCHEMA,
    version: EON_PORTABLE_BACKUP_VERSION,
    backupId,
    createdAt,
    vaultProfile: profile,
    recordCount: records.length,
    records
  });
}

export async function createEncryptedPortableBackup({ vaultProfile, records = [], now = Date.now(), backupId = '', cryptoApi = null } = {}) {
  const normalizedProfile = normalizeProfile(vaultProfile);
  const normalizedRecords = normalizeRecords(records);
  const id = BACKUP_ID_RE.test(String(backupId || '')) ? String(backupId) : createPortableBackupId({ cryptoApi });
  const payload = buildPayload({ backupId: id, profile: normalizedProfile, records: normalizedRecords, createdAt: cleanIso('', now) });
  const digest = await digestPayload(payload, { cryptoApi });
  return Object.freeze({
    ...payload,
    integrity: Object.freeze({ algorithm: 'SHA-256', payloadDigest: digest })
  });
}

export function serializeEncryptedPortableBackup(backup = {}) {
  const candidate = backup && typeof backup === 'object' ? backup : {};
  const serialized = JSON.stringify(candidate);
  if (encoder.encode(serialized).byteLength > EON_PORTABLE_BACKUP_MAX_BYTES) throw new Error('Portable backup is too large.');
  return serialized;
}

export async function verifyEncryptedPortableBackup(input, { cryptoApi = null } = {}) {
  let backup = input;
  if (typeof input === 'string') {
    if (encoder.encode(input).byteLength > EON_PORTABLE_BACKUP_MAX_BYTES) return Object.freeze({ ok: false, reason: 'backup-too-large', backup: null });
    try { backup = JSON.parse(input); } catch { return Object.freeze({ ok: false, reason: 'invalid-json', backup: null }); }
  }
  try {
    const candidate = backup && typeof backup === 'object' ? backup : {};
    if (candidate.schema !== EON_PORTABLE_BACKUP_SCHEMA || candidate.version !== EON_PORTABLE_BACKUP_VERSION || !BACKUP_ID_RE.test(String(candidate.backupId || ''))) throw new Error('invalid-backup-header');
    const profile = normalizeProfile(candidate.vaultProfile);
    const records = normalizeRecords(candidate.records);
    if (Number(candidate.recordCount) !== records.length) throw new Error('record-count-mismatch');
    const createdAt = cleanIso(candidate.createdAt);
    const integrity = candidate.integrity && typeof candidate.integrity === 'object' ? candidate.integrity : {};
    if (String(integrity.algorithm || '') !== 'SHA-256') throw new Error('integrity-algorithm-invalid');
    const expected = cleanBase64Url(integrity.payloadDigest, 16, 128);
    const payload = buildPayload({ backupId: String(candidate.backupId), profile, records, createdAt });
    const actual = await digestPayload(payload, { cryptoApi });
    if (actual !== expected) throw new Error('integrity-mismatch');
    return Object.freeze({ ok: true, reason: null, backup: Object.freeze({ ...payload, integrity: Object.freeze({ algorithm: 'SHA-256', payloadDigest: expected }) }) });
  } catch (error) {
    return Object.freeze({ ok: false, reason: String(error?.message || 'invalid-backup').slice(0, 120), backup: null });
  }
}

export async function exportEncryptedPortableBackupFromStore({ store, vaultProfile, now = Date.now(), cryptoApi = null } = {}) {
  if (!store || typeof store.listRecordIds !== 'function' || typeof store.get !== 'function') throw new Error('An encrypted local record store is required for backup export.');
  const ids = await store.listRecordIds({ limit: EON_PORTABLE_BACKUP_MAX_RECORDS });
  const records = [];
  for (const id of ids) {
    const envelope = await store.get(id);
    if (!envelope) continue;
    records.push(envelope);
  }
  return createEncryptedPortableBackup({ vaultProfile, records, now, cryptoApi });
}

function envelopeSame(left, right) {
  return stable(left) === stable(right);
}

function emptyImportResult(reason = '') {
  return Object.freeze({
    ok: false,
    reason: reason || 'restore-not-ready',
    backup: null,
    previewId: '',
    readyToApply: false,
    adds: Object.freeze([]),
    imported: Object.freeze([]),
    skipped: Object.freeze([]),
    conflicts: Object.freeze([]),
    overwritten: false,
    restoreApplied: false,
    atomic: false,
    writeState: 'not-started',
    recoveryRequired: false,
    recordsMayHaveBeenWritten: Object.freeze([]),
    networkRequestCreated: false
  });
}

export async function inspectEncryptedPortableBackupImport(input, { store, cryptoApi = null } = {}) {
  if (!store || typeof store.get !== 'function') throw new Error('An encrypted local record store is required for backup inspection.');
  const verified = await verifyEncryptedPortableBackup(input, { cryptoApi });
  if (!verified.ok) return emptyImportResult(verified.reason);
  const adds = [];
  const skipped = [];
  const conflicts = [];
  for (const envelope of verified.backup.records) {
    const local = await store.get(envelope.recordId);
    if (!local) adds.push(envelope.recordId);
    else if (envelopeSame(local, envelope)) skipped.push(envelope.recordId);
    else conflicts.push(envelope.recordId);
  }
  const previewId = await digestPayload({
    schema: 'eonapp.encrypted-portable-backup-restore-preview.w637.v1',
    backupId: verified.backup.backupId,
    payloadDigest: verified.backup.integrity.payloadDigest,
    adds,
    skipped,
    conflicts
  }, { cryptoApi });
  return Object.freeze({
    ok: true,
    reason: conflicts.length ? 'record-conflict-no-overwrite' : null,
    backup: verified.backup,
    previewId,
    readyToApply: conflicts.length === 0,
    adds: Object.freeze(adds),
    imported: Object.freeze([]),
    skipped: Object.freeze(skipped),
    conflicts: Object.freeze(conflicts),
    overwritten: false,
    restoreApplied: false,
    atomic: false,
    writeState: 'not-started',
    recoveryRequired: false,
    recordsMayHaveBeenWritten: Object.freeze([]),
    networkRequestCreated: false
  });
}

export async function importEncryptedPortableBackupToStore(input, {
  store,
  confirmedByUser = false,
  reviewedPreviewId = '',
  cryptoApi = null
} = {}) {
  if (confirmedByUser !== true) return emptyImportResult('explicit-user-confirmation-required');
  if (!store || typeof store.get !== 'function' || typeof store.putManyIfAbsent !== 'function') {
    return emptyImportResult('atomic-store-capability-required');
  }
  const preview = await inspectEncryptedPortableBackupImport(input, { store, cryptoApi });
  if (!preview.ok) return preview;
  if (!reviewedPreviewId || String(reviewedPreviewId) !== preview.previewId) {
    return Object.freeze({ ...preview, ok: false, reason: 'reviewed-preview-required', readyToApply: false });
  }
  if (preview.conflicts.length) {
    return Object.freeze({ ...preview, ok: false, reason: 'record-conflict-no-overwrite', readyToApply: false });
  }
  const byId = new Map(preview.backup.records.map((envelope) => [envelope.recordId, envelope]));
  const additions = preview.adds.map((id) => byId.get(id)).filter(Boolean);
  try {
    const result = await store.putManyIfAbsent(additions);
    if (result?.ok !== true || result?.atomic !== true || result?.overwritten === true) throw new Error('atomic-restore-contract-rejected');
  } catch (error) {
    const code = String(error?.code || error?.message || 'atomic-restore-failed').slice(0, 120);
    return Object.freeze({ ...preview, ok: false, reason: code, readyToApply: false, imported: Object.freeze([]), restoreApplied: false, atomic: true, writeState: 'aborted', recoveryRequired: false, recordsMayHaveBeenWritten: Object.freeze([]) });
  }
  for (const envelope of additions) {
    const stored = await store.get(envelope.recordId);
    if (!stored || !envelopeSame(stored, envelope)) {
      return Object.freeze({ ...preview, ok: false, reason: 'post-restore-verification-failed', readyToApply: false, imported: Object.freeze([]), restoreApplied: false, atomic: true, writeState: 'committed-verification-failed', recoveryRequired: true, recordsMayHaveBeenWritten: Object.freeze(additions.map((item) => item.recordId)) });
    }
  }
  return Object.freeze({
    ...preview,
    ok: true,
    reason: null,
    readyToApply: false,
    imported: Object.freeze([...preview.adds]),
    restoreApplied: true,
    atomic: true,
    writeState: 'committed-verified',
    recoveryRequired: false,
    recordsMayHaveBeenWritten: Object.freeze([])
  });
}

export async function runEncryptedPortableBackupRecoveryDrill({ backup, emptyStore, cryptoApi = null } = {}) {
  if (!emptyStore || typeof emptyStore.listRecordIds !== 'function') throw new Error('A separate empty local store is required for a recovery drill.');
  const before = await emptyStore.listRecordIds({ limit: EON_PORTABLE_BACKUP_MAX_RECORDS });
  if (before.length) return Object.freeze({ ok: false, reason: 'recovery-target-not-empty', imported: 0, expected: 0 });
  const preview = await inspectEncryptedPortableBackupImport(backup, { store: emptyStore, cryptoApi });
  if (!preview.ok || !preview.readyToApply) return Object.freeze({ ok: false, reason: preview.reason || 'recovery-preview-not-ready', imported: 0, expected: 0 });
  const imported = await importEncryptedPortableBackupToStore(backup, { store: emptyStore, confirmedByUser: true, reviewedPreviewId: preview.previewId, cryptoApi });
  if (!imported.ok) return Object.freeze({ ok: false, reason: imported.reason, imported: imported.imported.length, expected: 0 });
  const after = await emptyStore.listRecordIds({ limit: EON_PORTABLE_BACKUP_MAX_RECORDS });
  const expected = imported.backup.recordCount;
  return Object.freeze({
    ok: after.length === expected && imported.conflicts.length === 0,
    reason: after.length === expected ? null : 'recovery-count-mismatch',
    expected,
    imported: after.length,
    networkRequestCreated: false,
    destructiveOverwrite: false
  });
}

export function getEncryptedPortableBackupTruth() {
  return Object.freeze({
    schema: EON_PORTABLE_BACKUP_SCHEMA,
    encryptedEnvelopesOnly: true,
    vaultProfileIsNonSecret: true,
    passphrasePersistence: false,
    keyExport: false,
    directNetwork: false,
    localStorage: false,
    importRequiresExplicitUserConfirmation: true,
    destructiveOverwrite: false,
    automaticCloudSync: false,
    integrityScope: 'transport-corruption-detection-not-authenticity',
    inspectBeforeApply: true,
    reviewedPreviewRequired: true,
    atomicAddOnlyRestore: true,
    postRestoreVerification: true,
    postVerificationFailureIsExplicit: true
  });
}
