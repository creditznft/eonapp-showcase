/**
 * W753 — bounded local receipt for one reviewed Share & Capture handoff.
 *
 * The receipt is intentionally finite and idempotent. It records only that the
 * user explicitly reviewed a signed handoff or explicitly saved a local WebM.
 * It never stores the URL, caption, media, destination, referral token, account,
 * post result or private work content, and it never treats copying or posting as
 * a reward event.
 */
import { recordEonCoreOutcome } from '../outcomes/eon-core-outcome-authority.js';

export const EON_SHARE_W753_RECEIPT_SCHEMA = 'eon.share.reviewed-handoff-receipt.w753.v1';
export const EON_SHARE_W753_RECEIPT_STORAGE_KEY = 'eon:share:reviewed-handoff-receipt:w753:v1';
export const EON_SHARE_W753_RECEIPT_EVENT = 'eon:share-w753-reviewed-handoff-receipt';
export const EON_SHARE_W753_RECEIPT_ID = 'share-capture:reviewed-handoff:v1';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 80) => String(value || '').trim().replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const RECEIPT_SOURCES = Object.freeze(['share-center-local', 'creator-capture-local']);

function resolveStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function emptyReceipt() {
  return freeze({
    schema: EON_SHARE_W753_RECEIPT_SCHEMA,
    receiptId: '',
    kind: '',
    source: '',
    verified: false,
    verifiedAt: 0,
    explicitUserAction: false,
    privateContentStored: false,
    mediaStored: false,
    signedLinkStored: false,
    destinationStored: false,
    publicPostingRequired: false,
    publicPostingClaimed: false,
    referralRewardIssued: false,
    automaticUpload: false,
    automaticPublishing: false
  });
}

export function readEonShareW753ReviewedHandoffReceipt({ storage = null } = {}) {
  try {
    const parsed = JSON.parse(resolveStorage(storage)?.getItem?.(EON_SHARE_W753_RECEIPT_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_SHARE_W753_RECEIPT_SCHEMA || parsed?.verified !== true || parsed?.receiptId !== EON_SHARE_W753_RECEIPT_ID) return emptyReceipt();
    return freeze({
      ...emptyReceipt(),
      receiptId: EON_SHARE_W753_RECEIPT_ID,
      kind: clean(parsed.kind),
      source: clean(parsed.source),
      verified: true,
      verifiedAt: Math.max(0, finite(parsed.verifiedAt)),
      explicitUserAction: true
    });
  } catch {
    return emptyReceipt();
  }
}

function emitReceipt(environment, receipt, reason) {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment?.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(EON_SHARE_W753_RECEIPT_EVENT, {
    detail: freeze({ schema: EON_SHARE_W753_RECEIPT_SCHEMA, reason: clean(reason), receipt })
  }));
  return true;
}

export function recordEonShareW753ReviewedHandoffReceipt({
  kind = '',
  source = '',
  explicitUserAction = false,
  signedLinkReviewed = false,
  localWebmSaved = false
} = {}, { storage = null, environment = globalThis, now = Date.now() } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', receipt: readEonShareW753ReviewedHandoffReceipt({ storage }) });
  const normalizedKind = clean(kind);
  const allowed = normalizedKind === 'reviewed-signed-handoff'
    ? signedLinkReviewed === true
    : normalizedKind === 'creator-capture-saved'
      ? localWebmSaved === true
      : false;
  if (!allowed) return freeze({ ok: false, reason: 'reviewed-handoff-proof-required', receipt: readEonShareW753ReviewedHandoffReceipt({ storage }) });
  const existing = readEonShareW753ReviewedHandoffReceipt({ storage });
  if (existing.verified) {
    recordEonCoreOutcome({ kind: existing.kind, route: '/', source: existing.source, receiptId: existing.receiptId, verified: true, verifiedAt: existing.verifiedAt }, { storage: resolveStorage(storage), environment, now: existing.verifiedAt });
    return freeze({ ok: true, reason: 'already-verified', duplicate: true, receipt: existing });
  }
  const requestedSource = clean(source);
  const receiptSource = RECEIPT_SOURCES.includes(requestedSource)
    ? requestedSource
    : normalizedKind === 'creator-capture-saved' ? 'creator-capture-local' : 'share-center-local';
  const receipt = freeze({
    ...emptyReceipt(),
    receiptId: EON_SHARE_W753_RECEIPT_ID,
    kind: normalizedKind,
    source: receiptSource,
    verified: true,
    verifiedAt: Math.max(1, finite(now, Date.now())),
    explicitUserAction: true
  });
  try {
    const targetStorage = resolveStorage(storage);
    if (!targetStorage || typeof targetStorage.setItem !== 'function') throw new Error('share-receipt-storage-unavailable');
    targetStorage.setItem(EON_SHARE_W753_RECEIPT_STORAGE_KEY, JSON.stringify(receipt));
  } catch {
    return freeze({ ok: false, reason: 'share-receipt-storage-unavailable', receipt: emptyReceipt() });
  }
  recordEonCoreOutcome({ kind: receipt.kind, route: '/', source: receipt.source, receiptId: receipt.receiptId, verified: true, verifiedAt: receipt.verifiedAt }, { storage: resolveStorage(storage), environment, now: receipt.verifiedAt });
  emitReceipt(environment, receipt, 'verified');
  return freeze({ ok: true, reason: 'reviewed-handoff-verified', duplicate: false, receipt });
}

export function validateEonShareW753ReviewedHandoffReceipt(receipt = emptyReceipt()) {
  const errors = [];
  if (receipt?.schema !== EON_SHARE_W753_RECEIPT_SCHEMA) errors.push('schema-invalid');
  if (receipt?.verified && receipt?.receiptId !== EON_SHARE_W753_RECEIPT_ID) errors.push('receipt-id-invalid');
  if (receipt?.verified && !['reviewed-signed-handoff', 'creator-capture-saved'].includes(receipt?.kind)) errors.push('kind-invalid');
  if (receipt?.verified && !RECEIPT_SOURCES.includes(receipt?.source)) errors.push('source-invalid');
  if (receipt?.verified && receipt?.explicitUserAction !== true) errors.push('explicit-action-invalid');
  if (receipt?.verified && finite(receipt?.verifiedAt) <= 0) errors.push('verified-at-invalid');
  if (receipt?.privateContentStored || receipt?.mediaStored || receipt?.signedLinkStored || receipt?.destinationStored) errors.push('private-payload-stored');
  if (receipt?.publicPostingRequired || receipt?.publicPostingClaimed || receipt?.referralRewardIssued || receipt?.automaticUpload || receipt?.automaticPublishing) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), verified: receipt?.verified === true });
}

export default Object.freeze({
  EON_SHARE_W753_RECEIPT_SCHEMA,
  EON_SHARE_W753_RECEIPT_STORAGE_KEY,
  EON_SHARE_W753_RECEIPT_EVENT,
  EON_SHARE_W753_RECEIPT_ID,
  readEonShareW753ReviewedHandoffReceipt,
  recordEonShareW753ReviewedHandoffReceipt,
  validateEonShareW753ReviewedHandoffReceipt
});
