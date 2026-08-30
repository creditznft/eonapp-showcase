/** A15 I04 — versioned, expiring, single-consume local handoff authority. */

import { buildEonDestinationHref, getEonDestination } from './eon-destination-registry.js';

export const EON_HANDOFF_SCHEMA = 'eonapp.handoff.a15.v1';
export const EON_HANDOFF_RECEIPT_SCHEMA = 'eonapp.handoff-receipt.a15.v1';
export const EON_HANDOFF_STORE_SCHEMA = 'eonapp.handoff-store.a15.v1';
export const EON_HANDOFF_STORAGE_KEY = 'eon:handoffs:a15:v1';
export const EON_HANDOFF_QUERY_KEY = 'handoff';
export const EON_HANDOFF_MAX_ACTIVE = 24;
export const EON_HANDOFF_MAX_RECEIPTS = 64;
export const EON_HANDOFF_DEFAULT_TTL_MS = 30 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const encoder = new TextEncoder();
const FORBIDDEN_KEY = /(?:prompt|output|secret|password|passphrase|token|credential|api.?key|private.?key|media.?body|blob|binary|payment|wallet)/i;
const clean = (value = '', max = 240) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
const safeIso = (value) => new Date(Number(value)).toISOString();

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function cleanPayload(value, depth = 0) {
  if (depth > 3) throw new Error('handoff-payload-too-deep');
  if (value === null || ['boolean', 'number'].includes(typeof value)) return value;
  if (typeof value === 'string') return clean(value, 600);
  if (Array.isArray(value)) return value.slice(0, 16).map((item) => cleanPayload(item, depth + 1));
  if (!value || typeof value !== 'object') return null;
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 24)) {
    const safeKey = clean(key, 80).replace(/[^A-Za-z0-9_-]/g, '');
    if (!safeKey || FORBIDDEN_KEY.test(safeKey)) throw new Error('handoff-payload-sensitive-field');
    output[safeKey] = cleanPayload(item, depth + 1);
  }
  return output;
}

async function sha256(value, cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.subtle) throw new Error('webcrypto-required');
  const bytes = new Uint8Array(await cryptoApi.subtle.digest('SHA-256', encoder.encode(String(value || ''))));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomId(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') return `handoff_${cryptoApi.randomUUID().replaceAll('-', '')}`;
  if (typeof cryptoApi?.getRandomValues !== 'function') throw new Error('secure-random-required');
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return `handoff_${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function emptyStore() { return { schema: EON_HANDOFF_STORE_SCHEMA, handoffs: [], receipts: [] }; }
function readStore(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_HANDOFF_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_HANDOFF_STORE_SCHEMA || !Array.isArray(parsed.handoffs) || !Array.isArray(parsed.receipts)) return emptyStore();
    return parsed;
  } catch { return emptyStore(); }
}
function writeStore(storage, value) {
  try { storage?.setItem?.(EON_HANDOFF_STORAGE_KEY, JSON.stringify(value)); return true; } catch { return false; }
}
function publicFailure(reason, extra = {}) { return freeze({ ok: false, reason, ...extra }); }
function routeWithHandoff(receiverId, handoffId) { return buildEonDestinationHref(receiverId, { [EON_HANDOFF_QUERY_KEY]: handoffId }); }

export async function prepareEonHandoff(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return publicFailure('explicit-user-action-required');
  const sender = getEonDestination(input.senderId);
  const receiver = getEonDestination(input.receiverId);
  if (!sender || !receiver) return publicFailure('registered-sender-and-receiver-required');
  let payload;
  try { payload = cleanPayload(input.payload || {}); } catch (error) { return publicFailure(String(error?.message || error)); }
  const now = Number(options.now ?? Date.now());
  const ttlMs = Math.max(60_000, Math.min(24 * 60 * 60 * 1000, Number(input.ttlMs || EON_HANDOFF_DEFAULT_TTL_MS)));
  const reference = freeze({ id: clean(input.referenceId, 180), label: clean(input.safeLabel || receiver.label, 180) });
  const digestMaterial = { kind: clean(input.kind || 'continue', 80), senderId: sender.id, receiverId: receiver.id, reference, payload };
  let payloadDigest;
  let handoffId;
  try {
    payloadDigest = await sha256(stable(digestMaterial), options.cryptoApi);
    handoffId = clean(input.handoffId, 180) || randomId(options.cryptoApi);
  } catch (error) { return publicFailure(String(error?.message || error)); }
  const handoff = freeze({
    schema: EON_HANDOFF_SCHEMA,
    handoffId,
    kind: digestMaterial.kind,
    sender: freeze({ id: sender.id, route: sender.route }),
    receiver: freeze({ id: receiver.id, route: receiver.route }),
    reference,
    payload: freeze(payload),
    payloadDigest,
    createdAt: safeIso(now),
    expiresAt: safeIso(now + ttlMs),
    consumedAt: null,
    resultReceiptId: null,
    migration: freeze({ sourceSchema: clean(input.sourceSchema, 120) || null }),
    externalExecutionAuthority: false
  });
  return freeze({ ok: true, reason: '', handoff, href: routeWithHandoff(receiver.id, handoffId) });
}

export async function writeEonHandoff(input = {}, options = {}) {
  const prepared = await prepareEonHandoff(input, options);
  if (!prepared.ok) return prepared;
  const storage = options.sessionStorage || globalThis.sessionStorage;
  const state = readStore(storage);
  const now = Number(options.now ?? Date.now());
  const active = state.handoffs.filter((row) => !row.consumedAt && Date.parse(row.expiresAt || '') >= now);
  if (active.some((row) => row.handoffId === prepared.handoff.handoffId)) return publicFailure('handoff-id-already-exists');
  if (active.length >= EON_HANDOFF_MAX_ACTIVE) return publicFailure('handoff-capacity-reached');
  const next = { ...state, handoffs: [...active, prepared.handoff] };
  if (!writeStore(storage, next)) return publicFailure('handoff-storage-unavailable');
  return prepared;
}

export function readEonHandoff(handoffId = '', options = {}) {
  const id = clean(handoffId, 180);
  const state = readStore(options.sessionStorage || globalThis.sessionStorage);
  const handoff = state.handoffs.find((row) => row.handoffId === id) || null;
  return freeze({ ok: Boolean(handoff), reason: handoff ? '' : 'handoff-not-found', handoff });
}

export async function consumeEonHandoff(handoffId = '', options = {}) {
  const storage = options.sessionStorage || globalThis.sessionStorage;
  const state = readStore(storage);
  const id = clean(handoffId, 180);
  const index = state.handoffs.findIndex((row) => row.handoffId === id);
  if (index < 0) return publicFailure('handoff-not-found');
  const handoff = state.handoffs[index];
  const existingReceipt = state.receipts.find((row) => row.handoffId === id) || null;
  if (handoff.consumedAt || existingReceipt) return publicFailure('handoff-already-consumed', { receipt: existingReceipt });
  const now = Number(options.now ?? Date.now());
  if (Date.parse(handoff.expiresAt || '') < now) return publicFailure('handoff-expired');
  const receiver = getEonDestination(options.receiverId);
  if (!receiver || receiver.id !== handoff.receiver?.id) return publicFailure('handoff-receiver-mismatch');
  const material = { kind: handoff.kind, senderId: handoff.sender?.id, receiverId: handoff.receiver?.id, reference: handoff.reference, payload: handoff.payload };
  let computed;
  try { computed = await sha256(stable(material), options.cryptoApi); } catch (error) { return publicFailure(String(error?.message || error)); }
  if (computed !== handoff.payloadDigest) return publicFailure('handoff-digest-mismatch');
  if (state.receipts.length >= EON_HANDOFF_MAX_RECEIPTS) return publicFailure('handoff-receipt-capacity-reached');
  const consumedAt = safeIso(now);
  const receiptId = `handoff_receipt_${id.slice(-32)}`;
  const receipt = freeze({
    schema: EON_HANDOFF_RECEIPT_SCHEMA,
    receiptId,
    handoffId: id,
    senderId: handoff.sender.id,
    receiverId: receiver.id,
    status: options.status === 'error' ? 'error' : 'accepted',
    resultCode: clean(options.resultCode || 'receiver-opened', 100),
    errorCode: options.status === 'error' ? clean(options.errorCode || 'receiver-error', 100) : null,
    consumedAt,
    payloadDigest: handoff.payloadDigest,
    outcomeVerified: false,
    externalExecutionAuthority: false
  });
  const updated = freeze({ ...handoff, consumedAt, resultReceiptId: receiptId });
  const handoffs = [...state.handoffs]; handoffs[index] = updated;
  const next = { ...state, handoffs, receipts: [...state.receipts, receipt] };
  if (!writeStore(storage, next)) return publicFailure('handoff-storage-unavailable');
  return freeze({ ok: true, reason: '', handoff: updated, receipt });
}

export function handoffIdFromLocation(locationLike = globalThis.location) {
  try { return clean(new URLSearchParams(locationLike?.search || '').get(EON_HANDOFF_QUERY_KEY), 180); } catch { return ''; }
}

export async function consumeEonHandoffFromLocation(options = {}) {
  const handoffId = handoffIdFromLocation(options.location || globalThis.location);
  if (!handoffId) return publicFailure('handoff-query-missing');
  return consumeEonHandoff(handoffId, options);
}

export function removeEonHandoffQuery(locationLike = globalThis.location, historyLike = globalThis.history) {
  try {
    const url = new URL(locationLike.href);
    if (!url.searchParams.has(EON_HANDOFF_QUERY_KEY)) return false;
    url.searchParams.delete(EON_HANDOFF_QUERY_KEY);
    historyLike?.replaceState?.(historyLike.state ?? null, '', `${url.pathname}${url.search}${url.hash}`);
    return true;
  } catch { return false; }
}

export function inspectEonHandoffStore(options = {}) {
  const state = readStore(options.sessionStorage || globalThis.sessionStorage);
  return freeze({ schema: EON_HANDOFF_STORE_SCHEMA, activeCount: state.handoffs.filter((row) => !row.consumedAt).length, consumedCount: state.handoffs.filter((row) => row.consumedAt).length, receiptCount: state.receipts.length });
}
