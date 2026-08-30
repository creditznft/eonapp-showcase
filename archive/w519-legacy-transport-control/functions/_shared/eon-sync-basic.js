/**
 * W412 — fail-closed EON Sync Basic transport helpers.
 *
 * This is intentionally separate from Google identity: identity supplies an opaque
 * account session only. Sync cannot become available unless a dedicated D1 binding
 * and two explicit manual-proof configuration flags are present.
 */
import { getIdentityConfig, jsonResponse, readSession } from './eon-auth.js';

export const EON_SYNC_BASIC_TRANSPORT_SCHEMA = 'eonapp.sync-basic-transport.w412.v1';
export const EON_SYNC_BASIC_MANUAL_PROOF_ROLLOUT = 'manual-proof';
export const EON_SYNC_BASIC_RECORD_TYPES = Object.freeze([
  'preferences', 'chat-metadata', 'chat-text', 'project-metadata', 'project-text', 'share-remix-metadata'
]);

const TYPE_SET = new Set(EON_SYNC_BASIC_RECORD_TYPES);
const RECORD_ID_RE = /^[a-z][a-z0-9:_-]{2,220}$/i;
const DEVICE_ID_RE = /^device_[a-z0-9_-]{10,120}$/i;
const HASH_RE = /^sha256:[a-f0-9]{64}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_RECORDS_PER_WRITE = 48;
const MAX_RECORD_BYTES = 350_000;
const MAX_REQUEST_BYTES = 1_200_000;
const SENSITIVE_NAME = /(vault|api[-_:]?key|secret|token|password|mnemonic|seed(?:\s|$|[-_:])|private[-_:]?key|recovery|wallet|payment|credential|auth(?:entication)?|session|cookie)/i;
const SENSITIVE_VALUE = /(sk-[A-Za-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b)/i;

const encoder = new TextEncoder();
const clean = (value = '', limit = 240) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit);
const byteLength = (value) => encoder.encode(String(value ?? '')).byteLength;
const nowMs = () => Date.now();
const dateMs = (value) => {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

function safeJson(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function forbiddenShape(value, depth = 0) {
  if (depth > 16) return true;
  if (typeof value === 'string') return SENSITIVE_VALUE.test(value) || byteLength(value) > MAX_RECORD_BYTES;
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.length > 320 || value.some((entry) => forbiddenShape(entry, depth + 1));
  if (typeof value === 'object') return Object.entries(value).length > 320 || Object.entries(value).some(([key, entry]) => SENSITIVE_NAME.test(key) || forbiddenShape(entry, depth + 1));
  return true;
}

function validIso(value) {
  return ISO_RE.test(String(value || '')) && Number.isFinite(Date.parse(String(value || '')));
}

function numericMilliseconds(value) {
  const parsed = dateMs(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function toHex(bytes) {
  return Array.from(bytes || []).map((value) => Number(value).toString(16).padStart(2, '0')).join('');
}

async function sha256(value, cryptoApi = null) {
  const api = cryptoApi || globalThis.crypto;
  if (!api?.subtle?.digest) throw new Error('Web Crypto is required to verify Sync Basic records.');
  const digest = await api.subtle.digest('SHA-256', encoder.encode(stableJson(value)));
  return `sha256:${toHex(new Uint8Array(digest))}`;
}

export async function hashEonSyncBasicRecordContent({ id = '', type = '', content = null, deletedAt = null } = {}, { cryptoApi = null } = {}) {
  return sha256({ id: clean(id, 240), type: clean(type, 64), content: deletedAt ? null : content, deletedAt: deletedAt || null }, cryptoApi);
}

export async function verifyEonSyncBasicRecordContentHash(record = {}, { cryptoApi = null } = {}) {
  const candidate = record && typeof record === 'object' ? record : {};
  const expected = await hashEonSyncBasicRecordContent(candidate, { cryptoApi });
  return expected === String(candidate.contentHash || '').toLowerCase();
}

export function getEonSyncBasicConfig(request, env = {}) {
  const identity = getIdentityConfig(request, env);
  const rollout = clean(env.EON_SYNC_ROLLOUT || '', 32).toLowerCase();
  const mutationGate = clean(env.EON_SYNC_MUTATION_GATE || '', 32).toLowerCase();
  const database = env.EON_SYNC_DB || null;
  const configured = Boolean(identity.configured && rollout === EON_SYNC_BASIC_MANUAL_PROOF_ROLLOUT && mutationGate === 'reviewed' && database);
  return Object.freeze({
    schema: EON_SYNC_BASIC_TRANSPORT_SCHEMA,
    configured,
    identity,
    rollout: configured ? rollout : 'disabled',
    mutationGate: configured ? mutationGate : 'disabled',
    database: configured ? database : null,
    status: configured ? 'manual-proof-ready' : 'not-configured'
  });
}

export function publicEonSyncBasicStatus(config = {}, session = null) {
  const available = Boolean(config?.configured);
  return Object.freeze({
    schema: EON_SYNC_BASIC_TRANSPORT_SCHEMA,
    available,
    rollout: available ? config.rollout : 'disabled',
    signedIn: Boolean(session),
    status: available && session ? 'manual-proof-review-required' : (available ? 'sign-in-required' : 'not-configured'),
    identityOnly: false,
    automaticUpload: false,
    backgroundSync: false,
    automaticMerge: false,
    automaticDeletion: false,
    secureVaultSync: false,
    rawMediaSync: false,
    localModelSync: false,
    apiKeySync: false,
    liveReleaseApproved: false,
    manualProofRequired: true,
    supportedTypes: EON_SYNC_BASIC_RECORD_TYPES,
    exclusions: Object.freeze([
      'Vault entries, API keys, tokens, recovery material and browser session secrets',
      'raw media, downloads, local model binaries and render caches',
      'wallet, payment, referral/reward and unknown storage'
    ]),
    notice: 'EON Sync Basic remains a manual-proof feature. Google Login is identity only; it does not automatically upload browser work.'
  });
}

export async function requireEonSyncBasicSession(request, env = {}) {
  const config = getEonSyncBasicConfig(request, env);
  if (!config.configured) return Object.freeze({ ok: false, config, session: null, response: jsonResponse({ ok: false, ...publicEonSyncBasicStatus(config), error: 'sync-basic-not-configured' }, 503) });
  const session = await readSession(config.identity, request);
  if (!session) return Object.freeze({ ok: false, config, session: null, response: jsonResponse({ ok: false, ...publicEonSyncBasicStatus(config), error: 'sign-in-required' }, 401) });
  return Object.freeze({ ok: true, config, session, response: null });
}

export function requestHasAllowedSameOrigin(request, config = {}) {
  const origin = request.headers.get('origin') || '';
  const site = String(request.headers.get('sec-fetch-site') || '').toLowerCase();
  return Boolean(config?.configured && origin === config.identity?.appOrigin && (!site || site === 'same-origin'));
}

export async function readJsonBody(request, { maxBytes = MAX_REQUEST_BYTES } = {}) {
  const size = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(size) && size > maxBytes) return Object.freeze({ ok: false, error: 'request-too-large', value: null });
  const raw = await request.text();
  if (byteLength(raw) > maxBytes) return Object.freeze({ ok: false, error: 'request-too-large', value: null });
  const value = safeJson(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return Object.freeze({ ok: false, error: 'invalid-json-body', value: null });
  return Object.freeze({ ok: true, error: null, value });
}

export function normalizeEonSyncBasicRecord(candidate = {}) {
  const value = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const id = clean(value.id, 240);
  const type = clean(value.type, 64);
  const originDeviceId = clean(value.originDeviceId, 140);
  const updatedAt = clean(value.updatedAt, 40);
  const deletedAt = value.deletedAt ? clean(value.deletedAt, 40) : null;
  const contentHash = clean(value.contentHash, 96).toLowerCase();
  const version = Number(value.version);
  if (!RECORD_ID_RE.test(id)) return Object.freeze({ ok: false, error: 'invalid-record-id', record: null });
  if (!TYPE_SET.has(type)) return Object.freeze({ ok: false, error: 'invalid-record-type', record: null });
  if (!DEVICE_ID_RE.test(originDeviceId)) return Object.freeze({ ok: false, error: 'invalid-origin-device', record: null });
  if (!validIso(updatedAt) || (deletedAt && !validIso(deletedAt))) return Object.freeze({ ok: false, error: 'invalid-record-time', record: null });
  if (!Number.isInteger(version) || version < 1 || version > 99) return Object.freeze({ ok: false, error: 'invalid-record-version', record: null });
  if (!HASH_RE.test(contentHash)) return Object.freeze({ ok: false, error: 'invalid-content-hash', record: null });
  const content = deletedAt ? null : value.content;
  if (!deletedAt && (content === undefined || forbiddenShape(content))) return Object.freeze({ ok: false, error: 'unsafe-record-content', record: null });
  if (deletedAt && value.content !== null && value.content !== undefined) return Object.freeze({ ok: false, error: 'tombstone-must-not-include-content', record: null });
  const contentJson = deletedAt ? null : JSON.stringify(content);
  if (contentJson && byteLength(contentJson) > MAX_RECORD_BYTES) return Object.freeze({ ok: false, error: 'record-too-large', record: null });
  return Object.freeze({ ok: true, error: null, record: Object.freeze({
    id, type, updatedAt, updatedAtMs: numericMilliseconds(updatedAt), version, originDeviceId,
    deletedAt, deletedAtMs: deletedAt ? numericMilliseconds(deletedAt) : null, contentHash, content, contentJson
  }) });
}

export function parseSyncCursor(value = '') {
  const raw = clean(value, 40);
  const number = Number(raw);
  return Number.isFinite(number) && number >= 0 ? Math.min(Math.floor(number), nowMs()) : 0;
}

export function serializeSyncRecord(row = {}) {
  const deletedAt = Number(row.deleted_at || 0) > 0 ? new Date(Number(row.deleted_at)).toISOString() : null;
  const content = deletedAt ? null : safeJson(row.content_json);
  return Object.freeze({
    schema: 'eonapp.sync-basic-record.v1',
    id: clean(row.record_id, 240),
    type: clean(row.record_type, 64),
    updatedAt: new Date(Number(row.updated_at || 0)).toISOString(),
    version: Number(row.version || 1),
    originDeviceId: clean(row.origin_device_id, 140),
    deletedAt,
    contentHash: clean(row.content_hash, 96),
    content
  });
}

export async function upsertEonSyncBasicRecords(database, accountId = '', records = []) {
  if (!database?.prepare || !Array.isArray(records)) throw new Error('sync-database-unavailable');
  const safeAccountId = clean(accountId, 96);
  if (!safeAccountId) throw new Error('invalid-sync-account');
  const statements = records.map((record) => database.prepare(`
    INSERT INTO eon_sync_records (account_id, record_id, record_type, updated_at, version, origin_device_id, deleted_at, content_hash, content_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, record_id) DO UPDATE SET
      record_type = excluded.record_type,
      updated_at = excluded.updated_at,
      version = excluded.version,
      origin_device_id = excluded.origin_device_id,
      deleted_at = excluded.deleted_at,
      content_hash = excluded.content_hash,
      content_json = excluded.content_json
    WHERE excluded.updated_at >= eon_sync_records.updated_at
  `).bind(safeAccountId, record.id, record.type, record.updatedAtMs, record.version, record.originDeviceId, record.deletedAtMs, record.contentHash, record.contentJson));
  const devices = [...new Set(records.map((record) => record.originDeviceId))].map((deviceId) => database.prepare(`
    INSERT INTO eon_sync_devices (account_id, device_id, created_at, last_seen_at, revoked_at)
    VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(account_id, device_id) DO UPDATE SET last_seen_at = excluded.last_seen_at
  `).bind(safeAccountId, deviceId, nowMs(), nowMs()));
  if (statements.length || devices.length) await database.batch([...devices, ...statements]);
  return Object.freeze({ accepted: records.length, deviceCount: devices.length });
}

export const EON_SYNC_BASIC_TRANSPORT_LIMITS = Object.freeze({ maxRecordsPerWrite: MAX_RECORDS_PER_WRITE, maxRecordBytes: MAX_RECORD_BYTES, maxRequestBytes: MAX_REQUEST_BYTES });
