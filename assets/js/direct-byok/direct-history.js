/** W626H — redacted local Direct BYOK receipt history, deletion and export. */
import { EON_DIRECT_RECEIPT_SCHEMA } from './direct-job-contract.js';

export const EON_DIRECT_HISTORY_KEY = 'eon:direct-byok:receipt-history:w626h:v1';
const MAX_ROWS = 24;
const FORBIDDEN_RE = /(prompt|credential|secret|authorization|api.?key|reference|providerPayload|mediaBody)/i;
const ALLOWED_REDACTION_FLAGS = new Set([
  'rawPromptIncluded',
  'rawReferenceIncluded',
  'rawProviderPayloadIncluded',
  'credentialStoredInBrowser'
]);
const freeze = Object.freeze;

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}
function safeReceipt(receipt = {}) {
  if (receipt.schema !== EON_DIRECT_RECEIPT_SCHEMA) return null;
  if (Object.keys(receipt).some((key) => !ALLOWED_REDACTION_FLAGS.has(key) && FORBIDDEN_RE.test(key))) return null;
  if (receipt.rawPromptIncluded !== undefined && receipt.rawPromptIncluded !== false) return null;
  if (receipt.rawReferenceIncluded !== undefined && receipt.rawReferenceIncluded !== false) return null;
  if (receipt.rawProviderPayloadIncluded !== undefined && receipt.rawProviderPayloadIncluded !== false) return null;
  if (receipt.credentialStoredInBrowser !== undefined && receipt.credentialStoredInBrowser !== false) return null;
  return freeze({ ...receipt, safeLabel: String(receipt.safeLabel || 'Direct creator job').slice(0, 120), message: String(receipt.message || '').slice(0, 180) });
}
export function readDirectHistory({ storage = null } = {}) {
  try {
    const parsed = JSON.parse(storageFor(storage)?.getItem(EON_DIRECT_HISTORY_KEY) || '[]');
    return freeze((Array.isArray(parsed) ? parsed : []).map(safeReceipt).filter(Boolean).slice(0, MAX_ROWS));
  } catch { return freeze([]); }
}
export function recordDirectHistoryReceipt(receipt, { storage = null } = {}) {
  const safe = safeReceipt(receipt);
  if (!safe) return freeze({ ok: false, reason: 'receipt-rejected' });
  try {
    const rows = [safe, ...readDirectHistory({ storage }).filter((row) => row.jobId !== safe.jobId)].slice(0, MAX_ROWS);
    storageFor(storage)?.setItem(EON_DIRECT_HISTORY_KEY, JSON.stringify(rows));
    return freeze({ ok: true, count: rows.length });
  } catch { return freeze({ ok: false, reason: 'local-history-unavailable' }); }
}
export function clearDirectHistory({ storage = null, explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  try { storageFor(storage)?.removeItem(EON_DIRECT_HISTORY_KEY); return freeze({ ok: true }); } catch { return freeze({ ok: false, reason: 'local-history-unavailable' }); }
}
export function buildDirectHistoryExport({ storage = null } = {}) {
  const rows = readDirectHistory({ storage });
  return freeze({ schema: 'eon.direct-byok.history-export.w626h.v1', exportedAt: new Date().toISOString(), redacted: true, includesCredentials: false, includesPrompts: false, includesMedia: false, receipts: rows });
}
export function downloadDirectHistoryExport(options = {}) {
  const payload = buildDirectHistoryExport(options);
  if (typeof Blob === 'undefined' || typeof URL?.createObjectURL !== 'function' || typeof document === 'undefined') return freeze({ ok: false, reason: 'download-unavailable', payload });
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'eonapp-direct-byok-redacted-history.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return freeze({ ok: true, payload });
}
