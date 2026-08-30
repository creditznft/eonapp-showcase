/**
 * W518 — Portable Workspace Capsule.
 *
 * One user-held, encrypted local-workspace transfer format. This module is
 * deliberately local-only: it creates no network request, retains no
 * passphrase, and restores only W476 allowlisted workspace records.
 *
 * Restore is a transaction protocol for browser storage:
 * inspect -> stage -> choose -> explicit confirmation -> journal -> verify ->
 * receipt. A failed write rolls back the exact prior values. A leftover
 * encrypted journal is recovered by rolling back unless a verified receipt
 * proves that the transaction already completed.
 */

import {
  collectEonAppOwnedStorage,
  isEonAppBackupEligibleKey
} from '../vault/eon-vault-lifecycle.js';
import {
  buildPortableStateManifest,
  classifyPortableStateKey,
  EON_PORTABLE_STATE_CONTRACT_SCHEMA,
  EON_PORTABLE_STATE_CONTRACT_VERSION,
  isPortableBackupIncludedKey
} from '../../../config/w476-portable-state-contract.mjs';

export const EON_WORKSPACE_CAPSULE_SCHEMA = 'eonapp.portable-workspace-capsule.v1';
export const EON_WORKSPACE_CAPSULE_VERSION = 2;
export const EON_WORKSPACE_CAPSULE_LEGACY_VERSION = 1;
export const EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS = Object.freeze([
  EON_WORKSPACE_CAPSULE_LEGACY_VERSION,
  EON_WORKSPACE_CAPSULE_VERSION
]);
const EON_WORKSPACE_CAPSULE_JOURNAL_VERSION = 1;
const EON_WORKSPACE_CAPSULE_RECEIPT_VERSION = 1;
export const EON_WORKSPACE_CAPSULE_COMPRESSION_ALGORITHMS = Object.freeze(['none', 'gzip']);
export const EON_WORKSPACE_CAPSULE_PAYLOAD_SCHEMA = 'eonapp.portable-workspace-capsule-payload.v1';
export const EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA = 'eonapp.portable-workspace-capsule-journal.v1';
export const EON_WORKSPACE_CAPSULE_RECEIPT_SCHEMA = 'eonapp.portable-workspace-capsule-receipt.v1';
export const EON_WORKSPACE_CAPSULE_JOURNAL_KEY = 'eon:capsule:restore-journal:v1';
export const EON_WORKSPACE_CAPSULE_RECEIPT_KEY = 'eon:capsule:restore-receipt:v1';
export const EON_WORKSPACE_CAPSULE_CONFIRMATION = 'APPLY CAPSULE';
export const EON_WORKSPACE_CAPSULE_MAX_ENTRIES = 500;
export const EON_WORKSPACE_CAPSULE_MAX_ENTRY_BYTES = 750_000;
export const EON_WORKSPACE_CAPSULE_MAX_BYTES = 8 * 1024 * 1024;
export const EON_WORKSPACE_CAPSULE_KDF_ITERATIONS = 310_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CAPSULE_ID_RE = /^eoncap_[a-zA-Z0-9_-]{16,128}$/;
const TRANSACTION_ID_RE = /^eontx_[a-zA-Z0-9_-]{16,128}$/;
const BASE64_URL_RE = /^[A-Za-z0-9_-]+$/;
const PASSPHRASE_MIN = 12;
const PASSPHRASE_MAX = 256;
const EXCLUDED_SUMMARY = Object.freeze([
  'API/provider keys and credentials',
  'Vault encryption material or recovery secrets',
  'wallets, payment methods, payment history and commercial entitlement state',
  'OAuth sessions/tokens, browser caches and service-worker caches',
  'referral, reward, campaign, signed-share and relay material',
  'raw creator media, local model files and unknown browser storage'
]);

function webCrypto(candidate = null) {
  const api = candidate || globalThis.crypto;
  if (!api?.subtle || typeof api.getRandomValues !== 'function') throw new Error('Web Crypto is unavailable.');
  return api;
}

function toBase64Url(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  let binary = '';
  const size = 8192;
  for (let cursor = 0; cursor < bytes.length; cursor += size) {
    binary += String.fromCharCode(...bytes.subarray(cursor, cursor + size));
  }
  const b64 = typeof btoa === 'function'
    ? btoa(binary)
    : globalThis.Buffer?.from(bytes)?.toString('base64');
  if (!b64) throw new Error('Base64 encoding is unavailable.');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value, min = 1, max = EON_WORKSPACE_CAPSULE_MAX_BYTES * 2) {
  const source = String(value || '').trim();
  if (!source || source.length < min || source.length > max || !BASE64_URL_RE.test(source)) throw new Error('Capsule encoded data is invalid.');
  const padded = `${source.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat((4 - (source.length % 4)) % 4)}`;
  const binary = typeof atob === 'function'
    ? atob(padded)
    : globalThis.Buffer?.from(padded, 'base64')?.toString('binary');
  if (typeof binary !== 'string') throw new Error('Base64 decoding is unavailable.');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

function frozen(value) {
  return Object.freeze(value);
}

function byteLength(value) {
  return encoder.encode(String(value ?? '')).byteLength;
}

function validIso(value) {
  const text = String(value || '');
  return /^\d{4}-\d{2}-\d{2}T/.test(text) && Number.isFinite(Date.parse(text));
}

function iso(now = Date.now()) {
  return new Date(Number(now)).toISOString();
}

function randomId(prefix, { cryptoApi = null } = {}) {
  const api = webCrypto(cryptoApi);
  const bytes = api.getRandomValues(new Uint8Array(18));
  return `${prefix}_${toBase64Url(bytes)}`;
}

function validatePassphrase(input) {
  const value = String(input ?? '');
  if (value.length < PASSPHRASE_MIN || value.length > PASSPHRASE_MAX) throw new Error(`Capsule passphrase must be ${PASSPHRASE_MIN}-${PASSPHRASE_MAX} characters.`);
  return value;
}

function validateId(value, expression, label) {
  const id = String(value || '');
  if (!expression.test(id)) throw new Error(`Capsule ${label} is invalid.`);
  return id;
}

function plainClone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function sha256(value, { cryptoApi = null } = {}) {
  const digest = await webCrypto(cryptoApi).subtle.digest('SHA-256', encoder.encode(typeof value === 'string' ? value : canonical(value)));
  return toBase64Url(new Uint8Array(digest));
}

async function deriveAesKey(passphrase, salt, { cryptoApi = null } = {}) {
  const api = webCrypto(cryptoApi);
  const material = await api.subtle.importKey('raw', encoder.encode(validatePassphrase(passphrase)), 'PBKDF2', false, ['deriveKey']);
  return api.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', iterations: EON_WORKSPACE_CAPSULE_KDF_ITERATIONS, salt }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function capsulePublicManifest(entries) {
  const keys = entries.map((entry) => entry.key);
  const bytes = entries.reduce((total, entry) => total + entry.bytes, 0);
  const stateManifest = buildPortableStateManifest(keys);
  return frozen({
    schema: EON_PORTABLE_STATE_CONTRACT_SCHEMA,
    version: EON_PORTABLE_STATE_CONTRACT_VERSION,
    recordCount: entries.length,
    totalBytes: bytes,
    categoryCounts: frozen({ ...stateManifest.counts }),
    excludedByDefault: EXCLUDED_SUMMARY,
    unknownStorageIncluded: false,
    rawValuesExposedInHeader: false,
    source: 'W476 allowlisted local workspace records only'
  });
}

function normalizeEntries(input, { allowKey = isPortableBackupIncludedKey } = {}) {
  if (!Array.isArray(input) || input.length > EON_WORKSPACE_CAPSULE_MAX_ENTRIES) throw new Error('Capsule record count is out of bounds.');
  const seen = new Set();
  return frozen(input.map((candidate) => {
    const item = candidate && typeof candidate === 'object' ? candidate : {};
    const key = String(item.key || '');
    const value = String(item.value ?? '');
    if (!key || !allowKey(key) || !isEonAppBackupEligibleKey(key)) throw new Error(`Capsule record is not allowlisted: ${key || 'unknown'}.`);
    if (seen.has(key)) throw new Error(`Capsule contains duplicate key: ${key}.`);
    const bytes = byteLength(value);
    if (bytes > EON_WORKSPACE_CAPSULE_MAX_ENTRY_BYTES) throw new Error(`Capsule record exceeds size limit: ${key}.`);
    seen.add(key);
    return frozen({ key, value, bytes });
  }).sort((left, right) => left.key.localeCompare(right.key)));
}

function normalizeCapsuleCompression(compression = null, { version = EON_WORKSPACE_CAPSULE_VERSION } = {}) {
  if (Number(version) === EON_WORKSPACE_CAPSULE_LEGACY_VERSION) return null;
  const source = compression && typeof compression === 'object' ? compression : {};
  const algorithm = String(source.algorithm || 'none');
  const uncompressedBytes = Number(source.uncompressedBytes);
  const compressedBytes = Number(source.compressedBytes);
  if (!EON_WORKSPACE_CAPSULE_COMPRESSION_ALGORITHMS.includes(algorithm)) throw new Error('Capsule compression metadata is unsupported.');
  if (!Number.isInteger(uncompressedBytes) || uncompressedBytes < 2 || uncompressedBytes > EON_WORKSPACE_CAPSULE_MAX_BYTES) throw new Error('Capsule uncompressed byte count is invalid.');
  if (!Number.isInteger(compressedBytes) || compressedBytes < 2 || compressedBytes > EON_WORKSPACE_CAPSULE_MAX_BYTES) throw new Error('Capsule compressed byte count is invalid.');
  if (algorithm === 'none' && compressedBytes !== uncompressedBytes) throw new Error('Capsule uncompressed metadata is inconsistent.');
  return frozen({ algorithm, uncompressedBytes, compressedBytes });
}

function publicHeader({ capsuleId, createdAt, manifest, version = EON_WORKSPACE_CAPSULE_VERSION, compression = null }) {
  const header = {
    schema: EON_WORKSPACE_CAPSULE_SCHEMA,
    version: Number(version),
    capsuleId,
    createdAt,
    kdf: frozen({ name: 'PBKDF2', hash: 'SHA-256', iterations: EON_WORKSPACE_CAPSULE_KDF_ITERATIONS }),
    cipher: frozen({ name: 'AES-GCM', length: 256 }),
    manifest
  };
  if (Number(version) !== EON_WORKSPACE_CAPSULE_LEGACY_VERSION) header.compression = normalizeCapsuleCompression(compression, { version });
  return frozen(header);
}

function concatBytes(chunks = [], size = 0) {
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function readStreamBounded(stream, { maxBytes = EON_WORKSPACE_CAPSULE_MAX_BYTES } = {}) {
  if (!stream?.getReader) throw new Error('Capsule compression stream is unavailable.');
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      total += chunk.byteLength;
      if (total > maxBytes) throw new Error('Capsule data exceeds the bounded size limit.');
      chunks.push(chunk);
    }
  } finally {
    try { reader.releaseLock?.(); } catch { /* no-op */ }
  }
  return concatBytes(chunks, total);
}

function bytesAsStream(bytes) {
  if (typeof Blob !== 'function') throw new Error('Capsule compression is unavailable in this browser.');
  return new Blob([bytes]).stream();
}

async function prepareCapsulePayloadBytes(payload, { formatVersion = EON_WORKSPACE_CAPSULE_VERSION } = {}) {
  const raw = encoder.encode(canonical(payload));
  if (raw.byteLength > EON_WORKSPACE_CAPSULE_MAX_BYTES) throw new Error('Capsule plaintext exceeds the bounded size limit.');
  if (Number(formatVersion) === EON_WORKSPACE_CAPSULE_LEGACY_VERSION) return frozen({ bytes: raw, compression: null });
  if (typeof globalThis.CompressionStream !== 'function') {
    return frozen({ bytes: raw, compression: normalizeCapsuleCompression({ algorithm: 'none', uncompressedBytes: raw.byteLength, compressedBytes: raw.byteLength }, { version: formatVersion }) });
  }
  try {
    const compressed = await readStreamBounded(bytesAsStream(raw).pipeThrough(new globalThis.CompressionStream('gzip')));
    if (compressed.byteLength < raw.byteLength) {
      return frozen({ bytes: compressed, compression: normalizeCapsuleCompression({ algorithm: 'gzip', uncompressedBytes: raw.byteLength, compressedBytes: compressed.byteLength }, { version: formatVersion }) });
    }
  } catch {
    // Compression is an optional format optimization. A bounded encrypted
    // uncompressed v2 Capsule remains safe and importable on this device.
  }
  return frozen({ bytes: raw, compression: normalizeCapsuleCompression({ algorithm: 'none', uncompressedBytes: raw.byteLength, compressedBytes: raw.byteLength }, { version: formatVersion }) });
}

async function openCapsulePayloadBytes(bytes, compression = null) {
  const normalized = normalizeCapsuleCompression(compression);
  if (bytes.byteLength !== normalized.compressedBytes) throw new Error('Capsule compressed byte count does not match its header.');
  if (normalized.algorithm === 'none') return bytes;
  if (typeof globalThis.DecompressionStream !== 'function') throw new Error('This browser cannot open a gzip-compressed Capsule yet. Use a current browser or restore it on the device that created it.');
  const plain = await readStreamBounded(bytesAsStream(bytes).pipeThrough(new globalThis.DecompressionStream('gzip')));
  if (plain.byteLength !== normalized.uncompressedBytes) throw new Error('Capsule decompressed byte count does not match its header.');
  return plain;
}

async function encryptEnvelope({ header, payload, payloadBytes = null, passphrase, cryptoApi = null }) {
  const api = webCrypto(cryptoApi);
  const salt = api.getRandomValues(new Uint8Array(16));
  const iv = api.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt, { cryptoApi: api });
  const aad = encoder.encode(canonical(header));
  const bytes = payloadBytes instanceof Uint8Array ? payloadBytes : encoder.encode(canonical(payload));
  const cipher = await api.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, key, bytes);
  const envelope = frozen({
    ...header,
    salt: toBase64Url(salt),
    iv: toBase64Url(iv),
    ciphertext: toBase64Url(new Uint8Array(cipher))
  });
  return frozen({ ...envelope, integrity: frozen({ algorithm: 'SHA-256', envelopeDigest: await sha256(envelope, { cryptoApi: api }) }) });
}

function parseEnvelope(input, { schema, versions = [1] } = {}) {
  let parsed = input;
  if (typeof input === 'string') {
    if (byteLength(input) > EON_WORKSPACE_CAPSULE_MAX_BYTES) throw new Error('Capsule file exceeds the size limit.');
    try { parsed = JSON.parse(input); } catch { throw new Error('Capsule file is not valid JSON.'); }
  }
  const envelope = parsed && typeof parsed === 'object' ? parsed : {};
  const acceptedVersions = Array.isArray(versions) ? versions.map(Number) : [Number(versions)];
  if (envelope.schema !== schema || !acceptedVersions.includes(Number(envelope.version))) throw new Error('Capsule schema is unsupported.');
  validateId(envelope.capsuleId, CAPSULE_ID_RE, 'ID');
  if (!validIso(envelope.createdAt)) throw new Error('Capsule timestamp is invalid.');
  const kdf = envelope.kdf && typeof envelope.kdf === 'object' ? envelope.kdf : {};
  const cipher = envelope.cipher && typeof envelope.cipher === 'object' ? envelope.cipher : {};
  if (kdf.name !== 'PBKDF2' || kdf.hash !== 'SHA-256' || Number(kdf.iterations) !== EON_WORKSPACE_CAPSULE_KDF_ITERATIONS) throw new Error('Capsule KDF is unsupported.');
  if (cipher.name !== 'AES-GCM' || Number(cipher.length) !== 256) throw new Error('Capsule cipher is unsupported.');
  const manifest = envelope.manifest && typeof envelope.manifest === 'object' ? envelope.manifest : {};
  if (!Number.isInteger(manifest.recordCount) || manifest.recordCount < 0 || manifest.recordCount > EON_WORKSPACE_CAPSULE_MAX_ENTRIES) throw new Error('Capsule manifest is invalid.');
  if (schema === EON_WORKSPACE_CAPSULE_SCHEMA && Number(envelope.version) !== EON_WORKSPACE_CAPSULE_LEGACY_VERSION) normalizeCapsuleCompression(envelope.compression, { version: envelope.version });
  fromBase64Url(envelope.salt, 16, 128);
  fromBase64Url(envelope.iv, 16, 64);
  fromBase64Url(envelope.ciphertext, 16);
  const integrity = envelope.integrity && typeof envelope.integrity === 'object' ? envelope.integrity : {};
  if (integrity.algorithm !== 'SHA-256') throw new Error('Capsule integrity metadata is invalid.');
  if (!BASE64_URL_RE.test(String(integrity.envelopeDigest || ''))) throw new Error('Capsule integrity digest is invalid.');
  return frozen(plainClone(envelope));
}

async function decryptEnvelope(input, { schema, payloadSchema, passphrase, cryptoApi = null, versions = [1] } = {}) {
  const envelope = parseEnvelope(input, { schema, versions });
  const integrity = { ...envelope };
  delete integrity.integrity;
  const expected = await sha256(integrity, { cryptoApi });
  if (expected !== envelope.integrity.envelopeDigest) throw new Error('Capsule envelope integrity check failed.');
  const header = publicHeader({ capsuleId: envelope.capsuleId, createdAt: envelope.createdAt, manifest: envelope.manifest, version: envelope.version, compression: envelope.compression || null });
  const api = webCrypto(cryptoApi);
  const key = await deriveAesKey(passphrase, fromBase64Url(envelope.salt, 16, 128), { cryptoApi: api });
  let plaintext;
  try {
    plaintext = await api.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(envelope.iv, 16, 64), additionalData: encoder.encode(canonical(header)), tagLength: 128 }, key, fromBase64Url(envelope.ciphertext, 16));
  } catch {
    throw new Error('Capsule could not be opened. Check the passphrase or file integrity.');
  }
  let payload;
  try {
    const bytes = Number(envelope.version) === EON_WORKSPACE_CAPSULE_LEGACY_VERSION
      ? new Uint8Array(plaintext)
      : await openCapsulePayloadBytes(new Uint8Array(plaintext), envelope.compression);
    payload = JSON.parse(decoder.decode(bytes));
  } catch { throw new Error('Capsule payload is invalid.'); }
  if (!payload || Number(payload.version) !== Number(envelope.version) || payload.schema !== payloadSchema || payload.capsuleId !== envelope.capsuleId || payload.createdAt !== envelope.createdAt || !Array.isArray(payload.entries)) throw new Error('Capsule payload does not match its header.');
  const entries = normalizeEntries(payload.entries);
  if (entries.length !== envelope.manifest.recordCount) throw new Error('Capsule manifest record count does not match payload.');
  const expectedManifest = capsulePublicManifest(entries);
  if (canonical(expectedManifest) !== canonical(envelope.manifest)) throw new Error('Capsule manifest does not match payload.');
  return frozen({ envelope, entries });
}

export function collectWorkspaceCapsuleEntries({ storage = null } = {}) {
  const snapshot = collectEonAppOwnedStorage({ storage });
  return normalizeEntries(Object.entries(snapshot).map(([key, value]) => ({ key, value })));
}

export async function createWorkspaceCapsule({ entries = [], passphrase = '', now = Date.now(), capsuleId = '', cryptoApi = null, formatVersion = EON_WORKSPACE_CAPSULE_VERSION } = {}) {
  const version = Number(formatVersion);
  if (!EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS.includes(version)) throw new Error('Capsule format version is unsupported.');
  const normalized = normalizeEntries(entries);
  const id = capsuleId ? validateId(capsuleId, CAPSULE_ID_RE, 'ID') : randomId('eoncap', { cryptoApi });
  const createdAt = iso(now);
  const manifest = capsulePublicManifest(normalized);
  const payload = frozen({ schema: EON_WORKSPACE_CAPSULE_PAYLOAD_SCHEMA, version, capsuleId: id, createdAt, entries: normalized });
  const prepared = await prepareCapsulePayloadBytes(payload, { formatVersion: version });
  const header = publicHeader({ capsuleId: id, createdAt, manifest, version, compression: prepared.compression });
  return encryptEnvelope({ header, payload, payloadBytes: prepared.bytes, passphrase, cryptoApi });
}

export async function createWorkspaceCapsuleFromStorage({ storage = null, passphrase = '', now = Date.now(), cryptoApi = null } = {}) {
  return createWorkspaceCapsule({ entries: collectWorkspaceCapsuleEntries({ storage }), passphrase, now, cryptoApi });
}

export function serializeWorkspaceCapsule(capsule = {}) {
  const output = JSON.stringify(capsule, null, 2);
  if (byteLength(output) > EON_WORKSPACE_CAPSULE_MAX_BYTES) throw new Error('Capsule file exceeds the size limit.');
  return output;
}

export async function inspectWorkspaceCapsule(input, { passphrase = '', cryptoApi = null } = {}) {
  try {
    const opened = await decryptEnvelope(input, { schema: EON_WORKSPACE_CAPSULE_SCHEMA, payloadSchema: EON_WORKSPACE_CAPSULE_PAYLOAD_SCHEMA, passphrase, cryptoApi, versions: EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS });
    return frozen({
      ok: true,
      reason: null,
      capsule: frozen({ capsuleId: opened.envelope.capsuleId, createdAt: opened.envelope.createdAt, manifest: opened.envelope.manifest, version: opened.envelope.version, compression: opened.envelope.compression || null }),
      entries: frozen(opened.entries.map((entry) => frozen({ key: entry.key, bytes: entry.bytes, category: classifyPortableStateKey(entry.key).category })))
    });
  } catch (error) {
    return frozen({ ok: false, reason: String(error?.message || 'capsule-invalid').slice(0, 160), capsule: null, entries: frozen([]) });
  }
}

function storageApi(storage = null) {
  const target = storage || globalThis.localStorage;
  if (!target || typeof target.getItem !== 'function' || typeof target.setItem !== 'function' || typeof target.removeItem !== 'function') throw new Error('Browser storage is unavailable.');
  return target;
}

function read(storage, key) {
  const value = storage.getItem(String(key));
  return value === null || value === undefined ? null : String(value);
}

function writeAndVerify(storage, key, value) {
  storage.setItem(String(key), String(value));
  if (read(storage, key) !== String(value)) throw new Error(`Storage verification failed for ${key}.`);
}

function removeAndVerify(storage, key) {
  storage.removeItem(String(key));
  if (read(storage, key) !== null) throw new Error(`Storage removal verification failed for ${key}.`);
}

function safeChange(change) {
  return frozen({ key: change.key, action: change.action, status: change.status, incomingBytes: change.incomingBytes, currentBytes: change.currentBytes });
}

function readCurrent(storage, entries) {
  return new Map(entries.map((entry) => [entry.key, read(storage, entry.key)]));
}

function compareStage(entries, current) {
  return entries.map((entry) => {
    const prior = current.get(entry.key);
    const status = prior === null ? 'add' : prior === entry.value ? 'same' : 'conflict';
    return frozen({ key: entry.key, status, incomingBytes: entry.bytes, currentBytes: prior === null ? 0 : byteLength(prior) });
  });
}

function normalizeSelections(changes, selection = []) {
  if (!Array.isArray(selection)) throw new Error('Capsule selection is invalid.');
  const lookup = new Map(changes.map((change) => [change.key, change]));
  const selected = [];
  const seen = new Set();
  for (const candidate of selection) {
    const item = candidate && typeof candidate === 'object' ? candidate : {};
    const key = String(item.key || '');
    const action = String(item.action || '');
    const change = lookup.get(key);
    if (!change || seen.has(key)) throw new Error('Capsule selection contains an unknown or duplicate key.');
    if (change.status === 'add' && action !== 'add') throw new Error(`Capsule selection for ${key} must use add.`);
    if (change.status === 'conflict' && action !== 'overwrite') throw new Error(`Capsule selection for ${key} requires explicit overwrite.`);
    if (change.status === 'same') throw new Error(`Capsule selection cannot change an already identical key: ${key}.`);
    seen.add(key);
    selected.push(frozen({ key, action }));
  }
  return frozen(selected.sort((left, right) => left.key.localeCompare(right.key)));
}

function publicStage({ stageId, sourceFormat, capsule, changes, selection = [] }) {
  const selected = new Map(selection.map((item) => [item.key, item.action]));
  return frozen({
    stageId,
    sourceFormat,
    capsule: frozen({ capsuleId: capsule.capsuleId, createdAt: capsule.createdAt, manifest: capsule.manifest }),
    changes: frozen(changes.map((change) => safeChange({ ...change, action: selected.get(change.key) || null }))),
    selectedCount: selection.length,
    confirmationRequired: EON_WORKSPACE_CAPSULE_CONFIRMATION,
    rawValuesExposed: false,
    next: selection.length ? 'confirm' : 'choose-changes'
  });
}

async function createJournal({ capsuleId, transactionId, before, operations, passphrase, now, cryptoApi = null }) {
  const createdAt = iso(now);
  const manifest = frozen({ recordCount: operations.length, totalBytes: operations.reduce((total, item) => total + byteLength(item.value), 0), transactionId });
  const header = frozen({
    schema: EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA,
    version: EON_WORKSPACE_CAPSULE_JOURNAL_VERSION,
    capsuleId,
    createdAt,
    kdf: frozen({ name: 'PBKDF2', hash: 'SHA-256', iterations: EON_WORKSPACE_CAPSULE_KDF_ITERATIONS }),
    cipher: frozen({ name: 'AES-GCM', length: 256 }),
    manifest
  });
  const payload = frozen({
    schema: EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA,
    version: EON_WORKSPACE_CAPSULE_JOURNAL_VERSION,
    capsuleId,
    transactionId,
    createdAt,
    before: before.map((entry) => ({ key: entry.key, value: entry.value })),
    operations: operations.map((entry) => ({ key: entry.key, value: entry.value, action: entry.action }))
  });
  return encryptEnvelope({ header, payload, passphrase, cryptoApi });
}

async function openJournal(input, { passphrase, cryptoApi = null } = {}) {
  const envelope = parseEnvelope(input, { schema: EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA, versions: [EON_WORKSPACE_CAPSULE_JOURNAL_VERSION] });
  const integrity = { ...envelope };
  delete integrity.integrity;
  const expected = await sha256(integrity, { cryptoApi });
  if (expected !== envelope.integrity.envelopeDigest) throw new Error('Capsule journal integrity check failed.');
  const header = frozen({
    schema: EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA,
    version: EON_WORKSPACE_CAPSULE_JOURNAL_VERSION,
    capsuleId: envelope.capsuleId,
    createdAt: envelope.createdAt,
    kdf: frozen({ name: 'PBKDF2', hash: 'SHA-256', iterations: EON_WORKSPACE_CAPSULE_KDF_ITERATIONS }),
    cipher: frozen({ name: 'AES-GCM', length: 256 }),
    manifest: envelope.manifest
  });
  const api = webCrypto(cryptoApi);
  const key = await deriveAesKey(passphrase, fromBase64Url(envelope.salt, 16, 128), { cryptoApi: api });
  let payload;
  try {
    const plain = await api.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(envelope.iv, 16, 64), additionalData: encoder.encode(canonical(header)), tagLength: 128 }, key, fromBase64Url(envelope.ciphertext, 16));
    payload = JSON.parse(decoder.decode(plain));
  } catch {
    throw new Error('Capsule journal could not be opened. Check the passphrase.');
  }
  const transactionId = validateId(payload?.transactionId, TRANSACTION_ID_RE, 'transaction ID');
  if (payload?.schema !== EON_WORKSPACE_CAPSULE_JOURNAL_SCHEMA || payload?.capsuleId !== envelope.capsuleId || !Array.isArray(payload?.before) || !Array.isArray(payload?.operations) || payload.before.length !== payload.operations.length) throw new Error('Capsule journal is invalid.');
  const before = payload.before.map((item) => ({ key: String(item?.key || ''), value: item?.value === null ? null : String(item?.value ?? '') }));
  const operations = payload.operations.map((item) => ({ key: String(item?.key || ''), value: String(item?.value ?? ''), action: String(item?.action || '') }));
  if (before.some((item) => !isEonAppBackupEligibleKey(item.key)) || operations.some((item) => !isEonAppBackupEligibleKey(item.key))) throw new Error('Capsule journal contains an unapproved key.');
  return frozen({ capsuleId: envelope.capsuleId, transactionId, before: frozen(before), operations: frozen(operations) });
}

async function createReceipt({ capsuleId, transactionId, sourceFormat, operations, now, cryptoApi = null }) {
  const unsigned = frozen({
    schema: EON_WORKSPACE_CAPSULE_RECEIPT_SCHEMA,
    version: EON_WORKSPACE_CAPSULE_RECEIPT_VERSION,
    capsuleId,
    transactionId,
    sourceFormat,
    committedAt: iso(now),
    operationCount: operations.length,
    added: operations.filter((entry) => entry.action === 'add').length,
    overwritten: operations.filter((entry) => entry.action === 'overwrite').length,
    rawValuesIncluded: false,
    networkRequestCreated: false
  });
  return frozen({ ...unsigned, integrity: frozen({ algorithm: 'SHA-256', receiptDigest: await sha256(unsigned, { cryptoApi }) }) });
}

async function verifyReceipt(raw, { cryptoApi = null } = {}) {
  try {
    const receipt = JSON.parse(String(raw || ''));
    if (receipt?.schema !== EON_WORKSPACE_CAPSULE_RECEIPT_SCHEMA || Number(receipt?.version) !== EON_WORKSPACE_CAPSULE_RECEIPT_VERSION || !CAPSULE_ID_RE.test(String(receipt?.capsuleId || '')) || !TRANSACTION_ID_RE.test(String(receipt?.transactionId || ''))) return null;
    const integrity = receipt.integrity && typeof receipt.integrity === 'object' ? receipt.integrity : {};
    if (integrity.algorithm !== 'SHA-256' || !BASE64_URL_RE.test(String(integrity.receiptDigest || ''))) return null;
    const unsigned = { ...receipt };
    delete unsigned.integrity;
    return (await sha256(unsigned, { cryptoApi })) === integrity.receiptDigest ? receipt : null;
  } catch { return null; }
}
async function restoreExact(storage, before) {
  let failed = false;
  for (const entry of [...before].reverse()) {
    try {
      if (entry.value === null) removeAndVerify(storage, entry.key);
      else writeAndVerify(storage, entry.key, entry.value);
    } catch { failed = true; }
  }
  return !failed;
}

/**
 * A private staged session. Public stage/selection objects deliberately carry
 * keys, byte counts and statuses only; incoming values stay inside this
 * closure until the verified transaction runs.
 */
export function createWorkspaceCapsuleRestoreSession({ storage = null, cryptoApi = null, now = () => Date.now() } = {}) {
  const stages = new Map();

  async function stageCapsule(input, { passphrase = '' } = {}) {
    const target = storageApi(storage);
    const opened = await decryptEnvelope(input, { schema: EON_WORKSPACE_CAPSULE_SCHEMA, payloadSchema: EON_WORKSPACE_CAPSULE_PAYLOAD_SCHEMA, passphrase, cryptoApi, versions: EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS });
    const current = readCurrent(target, opened.entries);
    const changes = compareStage(opened.entries, current);
    const stageId = randomId('eonstage', { cryptoApi });
    const sourceFormat = `workspace-capsule-v${opened.envelope.version}`;
    stages.set(stageId, { stageId, sourceFormat, capsule: opened.envelope, entries: opened.entries, observed: current, passphrase: validatePassphrase(passphrase), changes, selection: frozen([]) });
    return publicStage({ stageId, sourceFormat, capsule: opened.envelope, changes });
  }

  async function stageLegacyVaultSnapshot(snapshot = {}, { passphrase = '' } = {}) {
    const target = storageApi(storage);
    const source = snapshot?.storage && typeof snapshot.storage === 'object' ? snapshot.storage : {};
    // Legacy snapshots may contain historic sensitive/unclassified records.
    // They are never staged, decrypted into a public plan, or written through
    // the new transaction; the legacy reader is import-only compatibility.
    const legacyCandidates = Object.entries(source)
      .filter(([key]) => isPortableBackupIncludedKey(key) && isEonAppBackupEligibleKey(key))
      .map(([key, value]) => ({ key, value }));
    const entries = normalizeEntries(legacyCandidates);
    const capsuleId = randomId('eoncap', { cryptoApi });
    const capsule = frozen({ capsuleId, createdAt: iso(now()), manifest: capsulePublicManifest(entries) });
    const current = readCurrent(target, entries);
    const changes = compareStage(entries, current);
    const stageId = randomId('eonstage', { cryptoApi });
    stages.set(stageId, { stageId, sourceFormat: 'legacy-eon-vault-import', capsule, entries, observed: current, passphrase: validatePassphrase(passphrase), changes, selection: frozen([]) });
    return publicStage({ stageId, sourceFormat: 'legacy-eon-vault-import', capsule, changes });
  }

  function choose(stageId, selection = []) {
    const stage = stages.get(String(stageId || ''));
    if (!stage) throw new Error('Capsule stage expired. Inspect the file again.');
    const normalized = normalizeSelections(stage.changes, selection);
    stage.selection = normalized;
    return publicStage(stage);
  }

  async function commit(stageId, { confirmation = '' } = {}) {
    const stage = stages.get(String(stageId || ''));
    if (!stage) return frozen({ ok: false, reason: 'stage-expired', receipt: null, changedKeys: frozen([]) });
    if (String(confirmation || '') !== EON_WORKSPACE_CAPSULE_CONFIRMATION) return frozen({ ok: false, reason: 'explicit-confirmation-required', receipt: null, changedKeys: frozen([]) });
    if (!stage.selection.length) return frozen({ ok: false, reason: 'no-changes-selected', receipt: null, changedKeys: frozen([]) });
    const target = storageApi(storage);
    const current = readCurrent(target, stage.entries);
    const drift = stage.entries.filter((entry) => current.get(entry.key) !== stage.observed.get(entry.key)).map((entry) => entry.key);
    if (drift.length) return frozen({ ok: false, reason: 'local-state-changed-reinspect-required', receipt: null, changedKeys: frozen(drift.sort()) });
    const entryByKey = new Map(stage.entries.map((entry) => [entry.key, entry]));
    const operations = stage.selection.map((selected) => frozen({ key: selected.key, value: entryByKey.get(selected.key).value, action: selected.action }));
    const before = operations.map((operation) => frozen({ key: operation.key, value: current.get(operation.key) }));
    const transactionId = randomId('eontx', { cryptoApi });
    let journal;
    try {
      journal = await createJournal({ capsuleId: stage.capsule.capsuleId, transactionId, before, operations, passphrase: stage.passphrase, now: now(), cryptoApi });
      writeAndVerify(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY, JSON.stringify(journal));
    } catch (error) {
      return frozen({ ok: false, reason: `journal-write-failed:${String(error?.message || 'storage')}`.slice(0, 160), receipt: null, changedKeys: frozen([]) });
    }

    try {
      for (const operation of operations) writeAndVerify(target, operation.key, operation.value);
      const receipt = await createReceipt({ capsuleId: stage.capsule.capsuleId, transactionId, sourceFormat: stage.sourceFormat, operations, now: now(), cryptoApi });
      writeAndVerify(target, EON_WORKSPACE_CAPSULE_RECEIPT_KEY, JSON.stringify(receipt));
      try { removeAndVerify(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY); } catch { /* Receipt makes a retained journal safe to reconcile. */ }
      stages.delete(stage.stageId);
      return frozen({ ok: true, reason: null, receipt, changedKeys: frozen(operations.map((entry) => entry.key).sort()), journalCleanupPending: read(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY) !== null });
    } catch (error) {
      const rolledBack = await restoreExact(target, before);
      if (rolledBack) {
        try { removeAndVerify(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY); } catch { /* The encrypted journal remains as a safe retry artifact. */ }
      }
      return frozen({ ok: false, reason: rolledBack ? 'atomic-commit-failed-rolled-back' : 'atomic-commit-failed-rollback-pending', receipt: null, changedKeys: frozen([]), journalRetained: read(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY) !== null, failure: String(error?.message || 'storage').slice(0, 160) });
    }
  }

  return frozen({ stageCapsule, stageLegacyVaultSnapshot, choose, commit });
}

/** Safely resolves a crash/interruption journal. It never resumes writes. */
export async function recoverPendingWorkspaceCapsule({ storage = null, passphrase = '', cryptoApi = null } = {}) {
  const target = storageApi(storage);
  const raw = read(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY);
  if (raw === null) return frozen({ ok: true, action: 'none', reason: null });
  let journal;
  try { journal = await openJournal(raw, { passphrase, cryptoApi }); } catch (error) {
    return frozen({ ok: false, action: 'preserved', reason: `journal-unavailable:${String(error?.message || 'invalid')}`.slice(0, 160) });
  }
  const receipt = await verifyReceipt(read(target, EON_WORKSPACE_CAPSULE_RECEIPT_KEY), { cryptoApi });
  if (receipt?.transactionId === journal.transactionId && receipt?.capsuleId === journal.capsuleId) {
    try {
      removeAndVerify(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY);
      return frozen({ ok: true, action: 'committed-journal-cleared', reason: null, transactionId: journal.transactionId });
    } catch (error) {
      return frozen({ ok: false, action: 'committed-journal-retained', reason: String(error?.message || 'storage').slice(0, 160), transactionId: journal.transactionId });
    }
  }
  const rolledBack = await restoreExact(target, journal.before);
  if (!rolledBack) return frozen({ ok: false, action: 'rollback-pending', reason: 'Could not restore all pre-import records. The encrypted journal is retained.', transactionId: journal.transactionId });
  try {
    removeAndVerify(target, EON_WORKSPACE_CAPSULE_JOURNAL_KEY);
    return frozen({ ok: true, action: 'rolled-back', reason: null, transactionId: journal.transactionId });
  } catch (error) {
    return frozen({ ok: false, action: 'rolled-back-journal-retained', reason: String(error?.message || 'storage').slice(0, 160), transactionId: journal.transactionId });
  }
}

/** Test-only helper for recovery fault injection; creates no storage write. */
export async function createWorkspaceCapsuleJournalForRecoveryTest({ capsuleId = '', transactionId = '', before = [], operations = [], passphrase = '', now = Date.now(), cryptoApi = null } = {}) {
  return createJournal({
    capsuleId: capsuleId || randomId('eoncap', { cryptoApi }),
    transactionId: transactionId || randomId('eontx', { cryptoApi }),
    before,
    operations,
    passphrase,
    now,
    cryptoApi
  });
}

export function getWorkspaceCapsuleTruth() {
  return frozen({
    schema: EON_WORKSPACE_CAPSULE_SCHEMA,
    version: EON_WORKSPACE_CAPSULE_VERSION,
    localOnly: true,
    networkRequestCreated: false,
    cloudFallback: false,
    googleIdentityRestoresLocalWork: false,
    passphrasePersisted: false,
    selectionRequired: true,
    overwriteRequiresPerKeyChoice: true,
    defaultMerge: 'add-only',
    failureRollsBack: true,
    interruptionRecovery: 'rollback-only unless an integrity receipt proves commit completed',
    compression: 'gzip-before-encryption-when-supported-and-smaller; otherwise encrypted-uncompressed',
    supportedFormatVersions: EON_WORKSPACE_CAPSULE_SUPPORTED_VERSIONS,
    excludedByDefault: EXCLUDED_SUMMARY
  });
}
