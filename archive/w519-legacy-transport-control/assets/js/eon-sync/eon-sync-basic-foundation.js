/**
 * W411 — EON Sync Basic local foundation.
 *
 * This module is deliberately schema/migration preparation only. It never
 * creates a network request, cloud account, device pairing, background job or
 * automatic upload. Google identity remains separate from Sync Basic.
 */

export const EON_SYNC_BASIC_SCHEMA = 'eonapp.sync-basic-record.v1';
export const EON_SYNC_BASIC_PLAN_SCHEMA = 'eonapp.sync-basic-plan.v1';
export const EON_SYNC_BASIC_VERSION = 1;
export const EON_SYNC_BASIC_STATUS = 'planned-local-schema-only';

export const EON_SYNC_BASIC_TYPES = Object.freeze([
  'preferences',
  'chat-metadata',
  'chat-text',
  'project-metadata',
  'project-text',
  'share-remix-metadata'
]);

export const EON_SYNC_BASIC_EXCLUSIONS = Object.freeze([
  'Vault entries and encrypted Vault envelopes',
  'API keys, tokens, provider credentials and recovery material',
  'raw media, downloads, local model binaries and render caches',
  'browser caches, service-worker caches and browser-only diagnostics',
  'wallets, payment data, referral/reward state and any unknown storage'
]);

const TYPE_SET = new Set(EON_SYNC_BASIC_TYPES);
const SENSITIVE_NAME = /(vault|api[-_:]?key|secret|token|password|mnemonic|seed(?:\s|$|[-_:])|private[-_:]?key|recovery|wallet|payment|credential|auth(?:entication)?|session|cookie)/i;
const SENSITIVE_VALUE = /(sk-[A-Za-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b)/i;
const RECORD_ID_RE = /^[a-z][a-z0-9:_-]{2,220}$/i;
const DEVICE_ID_RE = /^device_[a-z0-9_-]{10,120}$/i;
const MAX_SAFE_TEXT_BYTES = 350_000;
const encoder = new TextEncoder();

const CANDIDATE_SOURCES = Object.freeze([
  Object.freeze({ storage: 'local', key: 'eon:lang:preference:v1', type: 'preferences', id: 'preferences:language', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:lang:v1', type: 'preferences', id: 'preferences:language-legacy', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:chat:language:v1', type: 'preferences', id: 'preferences:chat-language', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:chat:speech-language:v1', type: 'preferences', id: 'preferences:speech-language', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:theme', type: 'preferences', id: 'preferences:theme', requiresTextConsent: false }),
  Object.freeze({ storage: 'session', key: 'eon:chat:active-thread:v1', type: 'chat-metadata', id: 'chat-metadata:active-thread', requiresTextConsent: false }),
  Object.freeze({ storage: 'session', key: 'eon:chat:threads:v1', type: 'chat-text', id: 'chat-text:threads', requiresTextConsent: true }),
  Object.freeze({ storage: 'local', key: 'eon:forge:active-project:v1', type: 'project-metadata', id: 'project-metadata:active-forge-project', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:forge:projects:v1', type: 'project-text', id: 'project-text:forge-projects', requiresTextConsent: true }),
  Object.freeze({ storage: 'local', key: 'eon:share:drafts:v1', type: 'share-remix-metadata', id: 'share-remix-metadata:drafts', requiresTextConsent: false }),
  Object.freeze({ storage: 'local', key: 'eon:share:campaign-intent:v1', type: 'share-remix-metadata', id: 'share-remix-metadata:campaign-intent', requiresTextConsent: false })
]);

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}

function normalizeIso(value = '', fallback = Date.now()) {
  const raw = String(value || '').trim();
  const timestamp = raw && Number.isFinite(Date.parse(raw)) ? Date.parse(raw) : Number(fallback);
  return new Date(Number.isFinite(timestamp) ? timestamp : Date.now()).toISOString();
}

function byteLength(value) {
  return encoder.encode(String(value || '')).byteLength;
}

function digestApi(cryptoApi = null) {
  const api = cryptoApi || globalThis.crypto;
  if (!api?.subtle?.digest) throw new Error('Web Crypto is required to prepare Sync Basic records.');
  return api;
}

function toHex(bytes) {
  return Array.from(bytes || []).map((value) => Number(value).toString(16).padStart(2, '0')).join('');
}

export async function hashEonSyncBasicContent(content, { cryptoApi = null } = {}) {
  const digest = await digestApi(cryptoApi).subtle.digest('SHA-256', encoder.encode(stable(content)));
  return `sha256:${toHex(new Uint8Array(digest))}`;
}

function cloneSafe(value, depth = 0) {
  if (depth > 16) return undefined;
  if (typeof value === 'string') {
    if (SENSITIVE_VALUE.test(value) || byteLength(value) > MAX_SAFE_TEXT_BYTES) return undefined;
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.map((entry) => cloneSafe(entry, depth + 1)).filter((entry) => entry !== undefined).slice(0, 320);
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, entry] of Object.entries(value).slice(0, 320)) {
      if (SENSITIVE_NAME.test(key)) continue;
      const safe = cloneSafe(entry, depth + 1);
      if (safe !== undefined) output[key] = safe;
    }
    return output;
  }
  return undefined;
}

function parseSafeStorageValue(value = '') {
  const raw = String(value || '');
  if (!raw || byteLength(raw) > MAX_SAFE_TEXT_BYTES || SENSITIVE_VALUE.test(raw)) return undefined;
  try { return cloneSafe(JSON.parse(raw)); } catch { return cloneSafe(raw); }
}

function readStorage(source, storage = {}) {
  const target = source.storage === 'session' ? storage.sessionStorage : storage.localStorage;
  try { return target?.getItem?.(source.key) || ''; } catch { return ''; }
}

function selectedTypesSet(value = []) {
  return new Set((Array.isArray(value) ? value : []).map((entry) => String(entry || '')).filter((entry) => TYPE_SET.has(entry)));
}

function assertDeviceId(value = '') {
  const id = String(value || '').trim();
  if (!DEVICE_ID_RE.test(id)) throw new Error('Sync Basic requires a locally generated device ID.');
  return id;
}

function assertRecordId(value = '') {
  const id = String(value || '').trim();
  if (!RECORD_ID_RE.test(id)) throw new Error('Sync Basic record ID is invalid.');
  return id;
}

function assertType(value = '') {
  const type = String(value || '').trim();
  if (!TYPE_SET.has(type)) throw new Error('Sync Basic record type is not allowed.');
  return type;
}

export function createEonSyncBasicDeviceId({ cryptoApi = null } = {}) {
  const api = cryptoApi || globalThis.crypto;
  if (!api?.getRandomValues) throw new Error('Web Crypto is required to create a local Sync Basic device ID.');
  const bytes = api.getRandomValues(new Uint8Array(18));
  return `device_${Array.from(bytes).map((value) => Number(value).toString(36).padStart(2, '0')).join('').slice(0, 48)}`;
}

export async function createEonSyncBasicRecord({ id, type, content, updatedAt = '', version = EON_SYNC_BASIC_VERSION, originDeviceId, deletedAt = null, cryptoApi = null } = {}) {
  const safeId = assertRecordId(id);
  const safeType = assertType(type);
  const safeDevice = assertDeviceId(originDeviceId);
  const normalizedDeletedAt = deletedAt ? normalizeIso(deletedAt) : null;
  const safeContent = normalizedDeletedAt ? null : cloneSafe(content);
  if (!normalizedDeletedAt && safeContent === undefined) throw new Error('Sync Basic record content is unsafe or unavailable.');
  const normalizedVersion = Number.isInteger(version) && version >= 1 && version <= 99 ? version : EON_SYNC_BASIC_VERSION;
  const contentHash = await hashEonSyncBasicContent({ id: safeId, type: safeType, content: safeContent, deletedAt: normalizedDeletedAt }, { cryptoApi });
  return Object.freeze({
    schema: EON_SYNC_BASIC_SCHEMA,
    id: safeId,
    type: safeType,
    updatedAt: normalizeIso(updatedAt),
    version: normalizedVersion,
    originDeviceId: safeDevice,
    deletedAt: normalizedDeletedAt,
    contentHash,
    content: safeContent
  });
}

export async function createEonSyncBasicTombstone({ id, type, originDeviceId, deletedAt = '', version = EON_SYNC_BASIC_VERSION, cryptoApi = null } = {}) {
  return createEonSyncBasicRecord({ id, type, originDeviceId, deletedAt: deletedAt || Date.now(), version, content: null, cryptoApi });
}

export async function buildEonSyncBasicLocalMigrationPreview({ localStorage = null, sessionStorage = null, selectedTypes = [], explicitUserConsent = false, originDeviceId = '', now = Date.now(), cryptoApi = null } = {}) {
  const selected = selectedTypesSet(selectedTypes);
  const storage = { localStorage, sessionStorage };
  const candidates = [];
  const skipped = [];
  const records = [];
  const canMaterialize = explicitUserConsent === true && selected.size > 0 && DEVICE_ID_RE.test(String(originDeviceId || ''));

  for (const source of CANDIDATE_SOURCES) {
    const raw = readStorage(source, storage);
    if (!raw) continue;
    const candidate = Object.freeze({ id: source.id, type: source.type, storage: source.storage, key: source.key, requiresTextConsent: source.requiresTextConsent });
    candidates.push(candidate);
    if (!selected.has(source.type)) {
      skipped.push(Object.freeze({ ...candidate, reason: 'type-not-selected' }));
      continue;
    }
    if (source.requiresTextConsent && explicitUserConsent !== true) {
      skipped.push(Object.freeze({ ...candidate, reason: 'explicit-text-consent-required' }));
      continue;
    }
    if (!canMaterialize) {
      skipped.push(Object.freeze({ ...candidate, reason: explicitUserConsent === true ? 'local-device-id-required' : 'explicit-opt-in-required' }));
      continue;
    }
    const content = parseSafeStorageValue(raw);
    if (content === undefined) {
      skipped.push(Object.freeze({ ...candidate, reason: 'unsafe-or-oversized-content' }));
      continue;
    }
    try {
      records.push(await createEonSyncBasicRecord({ id: source.id, type: source.type, content, originDeviceId, updatedAt: now, cryptoApi }));
    } catch {
      skipped.push(Object.freeze({ ...candidate, reason: 'record-not-prepared' }));
    }
  }

  return Object.freeze({
    schema: EON_SYNC_BASIC_PLAN_SCHEMA,
    status: EON_SYNC_BASIC_STATUS,
    generatedAt: normalizeIso('', now),
    explicitUserConsentRequired: true,
    explicitUserConsent: explicitUserConsent === true,
    automaticUpload: false,
    networkRequestCreated: false,
    deviceRegistrationCreated: false,
    selectedTypes: Object.freeze([...selected]),
    candidates: Object.freeze(candidates),
    records: Object.freeze(records),
    skipped: Object.freeze(skipped),
    exclusions: EON_SYNC_BASIC_EXCLUSIONS,
    nextStep: records.length ? 'review-only-not-uploadable' : 'choose-safe-types-and-explicitly-opt-in-later'
  });
}

function timestamp(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sameRecord(left, right) {
  return String(left?.contentHash || '') === String(right?.contentHash || '')
    && String(left?.deletedAt || '') === String(right?.deletedAt || '');
}

function conflictCopyId(record) {
  const base = String(record?.id || 'record').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 180);
  const suffix = String(record?.contentHash || 'unknown').replace(/[^a-zA-Z0-9]/g, '').slice(-12) || 'copy';
  return `${base}:conflict-${suffix}`;
}

export function resolveEonSyncBasicConflict(localRecord = null, remoteRecord = null) {
  if (!localRecord || !remoteRecord || localRecord.id !== remoteRecord.id || localRecord.type !== remoteRecord.type) {
    return Object.freeze({ strategy: 'invalid-record-pair', primary: null, conflictCopy: null, automaticOverwrite: false });
  }
  if (sameRecord(localRecord, remoteRecord)) return Object.freeze({ strategy: 'identical', primary: localRecord, conflictCopy: null, automaticOverwrite: false });
  const localTime = timestamp(localRecord.updatedAt);
  const remoteTime = timestamp(remoteRecord.updatedAt);
  const newer = remoteTime > localTime ? remoteRecord : localRecord;
  const older = newer === localRecord ? remoteRecord : localRecord;
  const preferenceType = localRecord.type === 'preferences' || localRecord.type === 'chat-metadata' || localRecord.type === 'project-metadata' || localRecord.type === 'share-remix-metadata';
  if (preferenceType) return Object.freeze({ strategy: 'last-write-wins-low-risk', primary: newer, conflictCopy: null, automaticOverwrite: false });
  if (newer.deletedAt) return Object.freeze({ strategy: 'tombstone-newer', primary: newer, conflictCopy: null, automaticOverwrite: false });
  return Object.freeze({ strategy: 'conflict-copy-required', primary: newer, conflictCopy: Object.freeze({ ...older, id: conflictCopyId(older) }), automaticOverwrite: false });
}

export function getEonSyncBasicTruth() {
  return Object.freeze({
    schema: EON_SYNC_BASIC_PLAN_SCHEMA,
    status: EON_SYNC_BASIC_STATUS,
    enabled: false,
    googleLoginIsSync: false,
    automaticUpload: false,
    backgroundSync: false,
    networkEndpoints: Object.freeze([]),
    d1IndexLive: false,
    r2BlobStoreLive: false,
    secureVaultSyncIncluded: false,
    explicitOptInRequired: true,
    userImportMergeChoiceRequired: true,
    conflictCopyForText: true,
    deletionTombstonePlanned: true,
    exclusions: EON_SYNC_BASIC_EXCLUSIONS
  });
}
