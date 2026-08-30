/**
 * RT91 Phase G — contract-only Local AI -> Agent Theatre receipt writer.
 *
 * Shared/Core code may use this contract without importing EONCITY runtime
 * implementation. It owns no inference/provider/model/network authority and
 * stores only the bounded W624I local lifecycle receipt shape.
 */
export const EON_LOCAL_AGENT_THEATRE_RECEIPT_CONTRACT_SCHEMA = 'eon.local-ai.agent-theatre-receipt-contract.rt91.v1';
export const EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA_CONTRACT = 'eon.city.genuine-agent-theatre.w624i.v1';
export const EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA_CONTRACT = 'eon.city.agent-theatre-receipt.w624i.v1';
export const EON_CITY_AGENT_THEATRE_STORAGE_KEY_CONTRACT = 'eon:city:genuine-agent-theatre:w624i:v1';
export const EON_CITY_AGENT_THEATRE_EVENT_CONTRACT = 'eon:city:genuine-agent-theatre';

const freeze = Object.freeze;
const MAX_RECEIPTS = 24;
const MAX_LOGS = 8;
const SAFE_STATES = new Set(['queued', 'preparing', 'waiting-for-user', 'running', 'paused', 'failed', 'cancelled', 'completed']);
const SAFE_SOURCES = new Set(['chat', 'local-ai', 'create', 'forge', 'automations', 'projects']);
const JOB_ID_RE = /^(?:eonjob|eonagentjob)_[a-z0-9_-]{8,96}$/i;
const RESULT_ID_RE = /^(?:sha256:|receipt_)[a-z0-9_-]{12,160}$/i;
const SAFE_CODE_RE = /^[a-z][a-z0-9-]{1,64}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_:-]{0,100}$/u;
const FORBIDDEN_FIELD_RE = /(?:prompt|raw|output|response|attachment|file|credential|secret|api.?key|token|cookie|account|email|payment|billing|referral|reward)/i;
const SECRET_TEXT_RE = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:password|api\s*key|access\s*token|session\s*cookie|seed phrase|recovery phrase|mnemonic)\b)/i;

const safeCode = (value = '', fallback = '') => {
  const text = String(value || '').trim().toLowerCase();
  return SAFE_CODE_RE.test(text) ? text : fallback;
};
const safeLabel = (value = '', fallback = 'Bounded local job') => {
  const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 101);
  return SAFE_LABEL_RE.test(text) && !SECRET_TEXT_RE.test(text) ? text : fallback;
};
const iso = (value = Date.now()) => {
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(String(value || ''));
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
};
const time = (value = '') => {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
};
const storageFor = (candidate = null) => {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
};

function forbiddenInput(candidate = {}) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return true;
  return Object.keys(candidate).some((key) => FORBIDDEN_FIELD_RE.test(key)) || SECRET_TEXT_RE.test(JSON.stringify(candidate));
}


function safeExistingStoredReceipt(entry = {}) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  if (entry.schema !== EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA_CONTRACT) return false;
  if (!JOB_ID_RE.test(String(entry.jobId || '')) || !SAFE_STATES.has(String(entry.state || ''))) return false;
  if (!new Set(['local', 'direct-byok', 'guide', 'unavailable']).has(String(entry.rail || ''))) return false;
  if (entry.rawPromptVisible === true || entry.rawOutputVisible === true || entry.credentialVisible === true || entry.fullFileVisible === true || entry.paymentDataVisible === true || entry.theatreExecutes === true) return false;
  if (entry.authoritativeProgress === true && !Number.isFinite(Number(entry.progress))) return false;
  try { if (SECRET_TEXT_RE.test(JSON.stringify(entry))) return false; } catch { return false; }
  return true;
}

function sourceFor(value = '') {
  const source = String(value || '').trim().toLowerCase();
  return SAFE_SOURCES.has(source) ? source : 'chat';
}

function safeLogs(logs = [], fallbackState = 'queued', fallbackAt = Date.now()) {
  const normalized = [];
  for (const candidate of Array.isArray(logs) ? logs : []) {
    const state = SAFE_STATES.has(String(candidate?.state || '')) ? String(candidate.state) : fallbackState;
    normalized.push(freeze({
      code: safeCode(candidate?.code || candidate?.type || candidate?.state, 'state-recorded'),
      state,
      at: iso(candidate?.at || fallbackAt)
    }));
    if (normalized.length >= MAX_LOGS) break;
  }
  if (!normalized.length) normalized.push(freeze({ code: fallbackState, state: fallbackState, at: iso(fallbackAt) }));
  return freeze(normalized);
}

function normalizeLocalReceipt(candidate = {}, now = Date.now()) {
  const jobId = String(candidate?.jobId || '').trim();
  const state = String(candidate?.state || '').trim();
  if (!JOB_ID_RE.test(jobId) || !SAFE_STATES.has(state)) return null;
  const createdAt = iso(candidate?.createdAt || now);
  const updatedAt = iso(candidate?.updatedAt || createdAt);
  const sourceSurface = sourceFor(candidate?.sourceSurface);
  const resultReceiptId = state === 'completed' && RESULT_ID_RE.test(String(candidate?.resultReceiptId || ''))
    ? String(candidate.resultReceiptId)
    : '';
  return freeze({
    schema: EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA_CONTRACT,
    jobId,
    state,
    jobType: safeCode(candidate?.jobType, 'local-model'),
    safeLabel: safeLabel(candidate?.safeLabel),
    sourceSurface,
    rail: 'local',
    authoritativeProgress: false,
    progress: null,
    failureCode: state === 'failed' ? safeCode(candidate?.failureCode, 'bounded-failure') : '',
    resultReceiptId,
    createdAt,
    updatedAt,
    logs: safeLogs(candidate?.logs, state, updatedAt),
    supportedActions: freeze((Array.isArray(candidate?.supportedActions) ? candidate.supportedActions : [])
      .map((entry) => safeCode(entry, ''))
      .filter(Boolean)
      .slice(0, 8))
  });
}

export function sanitizeEonLocalAgentTheatreStore(input = {}, { now = Date.now() } = {}) {
  const clock = Number(now) || Date.now();
  const receipts = (Array.isArray(input?.receipts) ? input.receipts : [])
    .filter((entry) => entry?.schema === EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA_CONTRACT && !forbiddenInput(entry))
    .map((entry) => normalizeLocalReceipt(entry, clock))
    .filter(Boolean)
    .sort((left, right) => time(right.updatedAt) - time(left.updatedAt))
    .slice(0, MAX_RECEIPTS);
  return freeze({
    schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA_CONTRACT,
    updatedAt: iso(input?.updatedAt || Math.max(clock, ...receipts.map((entry) => time(entry.updatedAt)), 0)),
    receipts: freeze(receipts),
    privateContentStored: false,
    rawPromptStored: false,
    rawOutputStored: false,
    credentialStored: false,
    fileContentStored: false,
    executionAuthority: false,
    networkRequestCreated: false
  });
}

export function recordEonLocalAgentTheatreReceipt(candidate = {}, {
  storage = null,
  now = () => Date.now(),
  explicitUserAction = false
} = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', stored: false, networkRequestCreated: false });
  if (forbiddenInput(candidate)) return freeze({ ok: false, reason: 'private-or-sensitive-fields-rejected', stored: false, networkRequestCreated: false });
  const clock = Number(now()) || Date.now();
  const receipt = normalizeLocalReceipt(candidate, clock);
  if (!receipt) return freeze({ ok: false, reason: 'invalid-bounded-receipt', stored: false, networkRequestCreated: false });
  const target = storageFor(storage);
  let parsed = null;
  try { parsed = JSON.parse(target?.getItem?.(EON_CITY_AGENT_THEATRE_STORAGE_KEY_CONTRACT) || 'null'); } catch {}
  const existing = (Array.isArray(parsed?.receipts) ? parsed.receipts : [])
    .filter((entry) => safeExistingStoredReceipt(entry) && entry.jobId !== receipt.jobId);
  const receipts = [receipt, ...existing]
    .sort((left, right) => time(right.updatedAt) - time(left.updatedAt))
    .slice(0, MAX_RECEIPTS);
  const state = freeze({
    schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA_CONTRACT,
    updatedAt: iso(clock),
    receipts: freeze(receipts),
    privateContentStored: false,
    rawPromptStored: false,
    rawOutputStored: false,
    credentialStored: false,
    fileContentStored: false,
    executionAuthority: false,
    networkRequestCreated: false
  });
  let stored = false;
  try { target?.setItem?.(EON_CITY_AGENT_THEATRE_STORAGE_KEY_CONTRACT, JSON.stringify(state)); stored = true; } catch {}
  if (stored) {
    try {
      if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
        globalThis.dispatchEvent(new CustomEvent(EON_CITY_AGENT_THEATRE_EVENT_CONTRACT, { detail: { schema: EON_LOCAL_AGENT_THEATRE_RECEIPT_CONTRACT_SCHEMA, jobId: receipt.jobId } }));
      }
    } catch {}
  }
  return freeze({
    schema: EON_LOCAL_AGENT_THEATRE_RECEIPT_CONTRACT_SCHEMA,
    ok: stored,
    reason: stored ? 'bounded-receipt-recorded' : 'storage-unavailable',
    stored,
    receipt,
    networkRequestCreated: false,
    externalActionStarted: false,
    inferenceAuthority: false
  });
}

export default freeze({
  EON_LOCAL_AGENT_THEATRE_RECEIPT_CONTRACT_SCHEMA,
  EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA_CONTRACT,
  EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA_CONTRACT,
  EON_CITY_AGENT_THEATRE_STORAGE_KEY_CONTRACT,
  recordEonLocalAgentTheatreReceipt,
  sanitizeEonLocalAgentTheatreStore
});
