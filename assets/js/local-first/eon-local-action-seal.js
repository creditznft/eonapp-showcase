/**
 * W309 — sealed, expiring, local-only action records.
 *
 * These records bind a safe capability, hashes, route, and expiry into an
 * immutable SHA-256 seal. Confirmation only records an explicit local choice;
 * it cannot call providers, publish, schedule, connect accounts, run after
 * close, or create external side effects.
 */

export const EON_LOCAL_ACTION_SEAL_SCHEMA = 'eonapp.local-action-seal.v1';
export const EON_LOCAL_ACTION_CONFIRMATION_SCHEMA = 'eonapp.local-action-confirmation.v1';
export const EON_LOCAL_ACTION_TTL_MAX_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();
const ACTION_ID_RE = /^eonact_[a-z0-9_-]{12,120}$/i;
const HASH_RE = /^sha256:[A-Za-z0-9_-]{32,128}$/;
const SAFE_KINDS = new Set(['review-local-draft', 'export-local-artifact', 'open-manual-composer', 'open-local-workspace']);

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

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
}

async function hash(value, { cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const digest = await api.subtle.digest('SHA-256', encoder.encode(stable(value)));
  return `sha256:${toBase64Url(new Uint8Array(digest))}`;
}

function cleanIso(value = '', fallback = Date.now()) {
  const source = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(source) && Number.isFinite(Date.parse(source))) return new Date(Date.parse(source)).toISOString();
  return new Date(Number(fallback)).toISOString();
}

function safeRoute(value = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/') || /(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeArtifactHashes(value = []) {
  if (!Array.isArray(value) || value.length > 16) throw new Error('Local action records allow up to 16 artifact hashes.');
  const hashes = value.map((item) => String(item || '').trim()).filter(Boolean);
  if (!hashes.every((item) => HASH_RE.test(item))) throw new Error('Local action records require SHA-256 artifact hashes only.');
  return Object.freeze([...new Set(hashes)].sort());
}

function makeActionPayload(record) {
  return Object.freeze({
    schema: EON_LOCAL_ACTION_SEAL_SCHEMA,
    version: 1,
    actionId: record.actionId,
    kind: record.kind,
    capabilityId: record.capabilityId,
    route: record.route,
    summary: record.summary,
    artifactHashes: record.artifactHashes,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    externalEffect: false,
    execution: 'manual-local-only'
  });
}

function normalizePreparedRecord(value = {}, { now = Date.now() } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const actionId = String(source.actionId || '').trim();
  const kind = String(source.kind || '').trim();
  const capabilityId = String(source.capabilityId || '').trim();
  const route = safeRoute(source.route);
  const summary = cleanText(source.summary, 240);
  const createdAt = cleanIso(source.createdAt, now);
  const expiresAt = cleanIso(source.expiresAt, now);
  if (!ACTION_ID_RE.test(actionId) || !SAFE_KINDS.has(kind) || !/^[a-z0-9][a-z0-9-]{1,96}$/i.test(capabilityId) || !route || !summary) return null;
  if (Date.parse(expiresAt) <= Date.parse(createdAt) || Date.parse(expiresAt) - Date.parse(createdAt) > EON_LOCAL_ACTION_TTL_MAX_MS) return null;
  let artifactHashes;
  try { artifactHashes = normalizeArtifactHashes(source.artifactHashes || []); } catch { return null; }
  return Object.freeze({ actionId, kind, capabilityId, route, summary, artifactHashes, createdAt, expiresAt });
}

export function createLocalActionId({ cryptoApi = null } = {}) {
  const api = cryptoFor(cryptoApi);
  const bytes = api.getRandomValues(new Uint8Array(18));
  return `eonact_${toBase64Url(bytes)}`;
}

export async function prepareSealedLocalAction(input = {}, { now = Date.now(), cryptoApi = null } = {}) {
  const createdAt = cleanIso(input.createdAt, now);
  const expiresAt = cleanIso(input.expiresAt, Number(now) + 10 * 60 * 1000);
  const normalized = normalizePreparedRecord({
    actionId: ACTION_ID_RE.test(String(input.actionId || '')) ? input.actionId : createLocalActionId({ cryptoApi }),
    kind: input.kind,
    capabilityId: input.capabilityId,
    route: input.route,
    summary: input.summary,
    artifactHashes: input.artifactHashes || [],
    createdAt,
    expiresAt
  }, { now });
  if (!normalized) throw new Error('Local action details are invalid or unsafe.');
  const payload = makeActionPayload(normalized);
  const seal = await hash(payload, { cryptoApi });
  return Object.freeze({
    ...payload,
    status: 'prepared',
    seal,
    confirmation: null,
    externalEffectStarted: false,
    networkRequestCreated: false
  });
}

export async function verifySealedLocalAction(record, { now = Date.now(), cryptoApi = null } = {}) {
  const source = record && typeof record === 'object' ? record : {};
  const prepared = normalizePreparedRecord(source, { now });
  if (!prepared || source.schema !== EON_LOCAL_ACTION_SEAL_SCHEMA || source.version !== 1 || !HASH_RE.test(String(source.seal || ''))) return Object.freeze({ ok: false, reason: 'invalid-action-record', status: 'invalid' });
  const expected = await hash(makeActionPayload(prepared), { cryptoApi });
  if (expected !== source.seal) return Object.freeze({ ok: false, reason: 'seal-mismatch', status: 'invalid' });
  if (Date.parse(prepared.expiresAt) <= Number(now)) return Object.freeze({ ok: false, reason: 'action-expired', status: 'expired' });
  if (source.status === 'confirmed' && source.confirmation) {
    const confirmation = source.confirmation;
    const confirmationPayload = Object.freeze({
      schema: EON_LOCAL_ACTION_CONFIRMATION_SCHEMA,
      actionId: prepared.actionId,
      actionSeal: source.seal,
      confirmedAt: cleanIso(confirmation.confirmedAt, now),
      mode: 'explicit-local-confirmation'
    });
    if (confirmation.schema !== EON_LOCAL_ACTION_CONFIRMATION_SCHEMA || confirmation.seal !== await hash(confirmationPayload, { cryptoApi })) {
      return Object.freeze({ ok: false, reason: 'confirmation-seal-mismatch', status: 'invalid' });
    }
    return Object.freeze({ ok: true, reason: null, status: 'confirmed', action: Object.freeze({ ...source, ...prepared, artifactHashes: prepared.artifactHashes }) });
  }
  if (source.status !== 'prepared' || source.confirmation !== null) return Object.freeze({ ok: false, reason: 'invalid-action-status', status: 'invalid' });
  return Object.freeze({ ok: true, reason: null, status: 'prepared', action: Object.freeze({ ...source, ...prepared, artifactHashes: prepared.artifactHashes }) });
}

export async function confirmSealedLocalAction(record, { explicitConfirmation = false, now = Date.now(), cryptoApi = null } = {}) {
  if (explicitConfirmation !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', action: null });
  const verified = await verifySealedLocalAction(record, { now, cryptoApi });
  if (!verified.ok) return Object.freeze({ ok: false, reason: verified.reason, action: null });
  if (verified.status === 'confirmed') return Object.freeze({ ok: false, reason: 'action-already-confirmed', action: verified.action });
  const confirmationPayload = Object.freeze({
    schema: EON_LOCAL_ACTION_CONFIRMATION_SCHEMA,
    actionId: verified.action.actionId,
    actionSeal: verified.action.seal,
    confirmedAt: cleanIso('', now),
    mode: 'explicit-local-confirmation'
  });
  const confirmation = Object.freeze({ ...confirmationPayload, seal: await hash(confirmationPayload, { cryptoApi }) });
  return Object.freeze({
    ok: true,
    reason: null,
    action: Object.freeze({
      ...verified.action,
      status: 'confirmed',
      confirmation,
      externalEffectStarted: false,
      networkRequestCreated: false,
      executionAllowed: false,
      nextStep: 'Open the named local/manual surface yourself. This confirmation does not execute any provider or publishing action.'
    })
  });
}

export function getLocalActionSealTruth() {
  return Object.freeze({
    schema: EON_LOCAL_ACTION_SEAL_SCHEMA,
    sealedWith: 'SHA-256',
    immutablePayload: true,
    expiryRequired: true,
    explicitUserConfirmationRequired: true,
    externalExecution: false,
    unattendedScheduling: false,
    directNetwork: false,
    localStorage: false,
    providerOrAccountConnection: false
  });
}
