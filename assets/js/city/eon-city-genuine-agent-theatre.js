/**
 * W624I — Genuine Agent Theatre.
 *
 * Read-only City projection of bounded, genuine job receipts. Existing W435
 * local job-fabric receipts are adapted without exposing prompts or outputs.
 * Native Local and Direct BYOK surfaces may write the dedicated receipt shape
 * only after an explicit user action; Direct BYOK additionally requires an
 * explicit approval. Opening the Theatre never starts, pauses, retries, cancels
 * or resumes work.
 */
import {
  EONBOT_JOB_FABRIC_SCHEMA,
  EONBOT_JOB_FABRIC_STORAGE_KEY,
  readEonbotJobFabricProjection,
  subscribeEonbotJobFabricProjection
} from '../contracts/workflow/eonbot-job-fabric-projection.js';

export const EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA = 'eon.city.genuine-agent-theatre.w624i.v1';
export const EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA = 'eon.city.agent-theatre-receipt.w624i.v1';
export const EON_CITY_AGENT_THEATRE_STORAGE_KEY = 'eon:city:genuine-agent-theatre:w624i:v1';
export const EON_CITY_AGENT_THEATRE_EVENT = 'eon:city:genuine-agent-theatre';
export const EON_CITY_AGENT_THEATRE_STATES = Object.freeze([
  'queued',
  'preparing',
  'waiting-for-user',
  'running',
  'paused',
  'failed',
  'cancelled',
  'completed'
]);
export const EON_CITY_AGENT_THEATRE_RAILS = Object.freeze(['local', 'direct-byok', 'guide', 'unavailable']);
export const EON_CITY_AGENT_THEATRE_SOURCES = Object.freeze([
  Object.freeze({ id: 'chat', label: 'Chat', route: '/' }),
  Object.freeze({ id: 'local-ai', label: 'Local AI', route: '/local-ai' }),
  Object.freeze({ id: 'create', label: 'Create', route: '/create' }),
  Object.freeze({ id: 'forge', label: 'Forge', route: '/forge' }),
  Object.freeze({ id: 'automations', label: 'Automations', route: '/automations' }),
  Object.freeze({ id: 'projects', label: 'Projects', route: '/projects' })
]);

const freeze = (value) => Object.freeze(value);
const MAX_RECEIPTS = 24;
const MAX_VISIBLE = 12;
const MAX_LOGS = 8;
const JOB_ID_RE = /^(?:eonjob|eonagentjob)_[a-z0-9_-]{8,96}$/i;
const RESULT_ID_RE = /^(?:sha256:|receipt_)[a-z0-9_-]{12,160}$/i;
const SAFE_CODE_RE = /^[a-z][a-z0-9-]{1,64}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_:-]{0,100}$/u;
const SOURCE_BY_ID = new Map(EON_CITY_AGENT_THEATRE_SOURCES.map((entry) => [entry.id, entry]));
const STATE_SET = new Set(EON_CITY_AGENT_THEATRE_STATES);
const RAIL_SET = new Set(EON_CITY_AGENT_THEATRE_RAILS);
const FORBIDDEN_FIELD_RE = /(?:prompt|raw|output|response|attachment|file|credential|secret|api.?key|token|cookie|account|email|payment|billing|referral|reward)/i;
const SECRET_TEXT_RE = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:password|api\s*key|access\s*token|session\s*cookie|seed phrase|recovery phrase|mnemonic)\b)/i;

const LOG_LABELS = Object.freeze({
  queued: 'Receipt entered the native queue.',
  preparing: 'Native surface is preparing bounded work.',
  'waiting-for-user': 'Native surface is waiting for a user decision.',
  running: 'Native surface reports active execution.',
  paused: 'Native surface reports execution paused.',
  failed: 'Native surface reports a bounded failure.',
  cancelled: 'Native surface reports cancellation.',
  completed: 'Native surface reports a completed result receipt.',
  'answer-recorded': 'A local answer receipt was recorded.',
  'draft-created': 'A local draft receipt was recorded.',
  'review-ready': 'A local draft is ready for review.',
  'approval-requested': 'The native surface is waiting for approval.',
  'local-review-completed': 'A reviewed local result receipt was recorded.',
  'retry-created': 'A user requested a new local attempt.'
});

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function iso(value = Date.now()) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return new Date(numeric).toISOString();
  const parsed = Date.parse(String(value || ''));
  return new Date(Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now()).toISOString();
}

function time(value = 0) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return Math.floor(numeric);
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function safeCode(value = '', fallback = '') {
  const code = String(value || '').trim().toLowerCase();
  return SAFE_CODE_RE.test(code) ? code : fallback;
}

function safeLabel(value = '', fallback = 'Bounded job receipt') {
  const label = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 101);
  return SAFE_LABEL_RE.test(label) && !SECRET_TEXT_RE.test(label) ? label : fallback;
}

function sourceFor(id = '') {
  return SOURCE_BY_ID.get(String(id || '').trim().toLowerCase()) || SOURCE_BY_ID.get('chat');
}

function privacyFor(rail = 'unavailable') {
  if (rail === 'local') return freeze({ boundary: 'Local execution stays on this device.', leavesDevice: 'Nothing from this receipt leaves the device.' });
  if (rail === 'direct-byok') return freeze({ boundary: 'Direct BYOK runs only after approval in the native surface.', leavesDevice: 'Only the approved request may go directly to the chosen provider; no key, prompt or response is shown here.' });
  if (rail === 'guide') return freeze({ boundary: 'Guide mode is a proposal or review flow, not provider execution.', leavesDevice: 'Nothing is sent by the Theatre.' });
  return freeze({ boundary: 'No execution rail is available.', leavesDevice: 'Nothing is sent by the Theatre.' });
}

function publicActions(state, route, supported = []) {
  const set = new Set(Array.isArray(supported) ? supported : []);
  const nativeOnly = (id, available) => freeze({ id, available: Boolean(available), executionOwner: 'native-surface', route, theatreExecutes: false });
  return freeze([
    nativeOnly('review', true),
    nativeOnly('retry', set.has('retry') || ['failed', 'cancelled'].includes(state)),
    nativeOnly('pause', set.has('pause') && state === 'running'),
    nativeOnly('resume', set.has('resume') && state === 'paused'),
    nativeOnly('cancel', set.has('cancel') || ['queued', 'preparing', 'waiting-for-user', 'running', 'paused'].includes(state)),
    nativeOnly('result-handoff', set.has('result-handoff') || state === 'completed')
  ]);
}

function safeLogs(logs = [], fallbackState = 'queued', fallbackAt = Date.now()) {
  const normalized = [];
  for (const candidate of Array.isArray(logs) ? logs : []) {
    const code = safeCode(candidate?.code || candidate?.type || candidate?.state, 'state-recorded');
    const state = STATE_SET.has(String(candidate?.state || '')) ? String(candidate.state) : fallbackState;
    normalized.push(freeze({ code, state, at: iso(candidate?.at || fallbackAt), message: LOG_LABELS[code] || LOG_LABELS[state] || 'A bounded lifecycle receipt was recorded.' }));
    if (normalized.length >= MAX_LOGS) break;
  }
  if (!normalized.length) normalized.push(freeze({ code: fallbackState, state: fallbackState, at: iso(fallbackAt), message: LOG_LABELS[fallbackState] }));
  return freeze(normalized);
}

function normalizeDedicatedReceipt(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA) return null;
  const jobId = String(candidate.jobId || '').trim();
  const state = String(candidate.state || '').trim();
  const rail = String(candidate.rail || '').trim();
  const source = sourceFor(candidate.sourceSurface);
  if (!JOB_ID_RE.test(jobId) || !STATE_SET.has(state) || !RAIL_SET.has(rail)) return null;
  const createdAt = iso(candidate.createdAt || now);
  const updatedAt = iso(candidate.updatedAt || createdAt);
  const progress = candidate.authoritativeProgress === true && Number.isFinite(Number(candidate.progress))
    ? Math.min(100, Math.max(0, Math.round(Number(candidate.progress))))
    : null;
  const privacy = privacyFor(rail);
  const resultReceiptId = RESULT_ID_RE.test(String(candidate.resultReceiptId || '')) ? String(candidate.resultReceiptId) : '';
  return freeze({
    schema: EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA,
    jobId,
    state,
    jobType: safeCode(candidate.jobType, 'general') || 'general',
    safeLabel: safeLabel(candidate.safeLabel),
    sourceSurface: source.id,
    sourceLabel: source.label,
    route: source.route,
    rail,
    railLabel: rail === 'direct-byok' ? 'Direct BYOK' : rail === 'local' ? 'Local' : rail === 'guide' ? 'Guide / proposal' : 'Unavailable',
    authority: 'native-bounded-receipt',
    createdAt,
    updatedAt,
    authoritativeProgress: progress !== null,
    progress,
    failureCode: state === 'failed' ? safeCode(candidate.failureCode, 'bounded-failure') : '',
    resultReceiptId: state === 'completed' ? resultReceiptId : '',
    logs: safeLogs(candidate.logs, state, updatedAt),
    actions: publicActions(state, source.route, candidate.supportedActions),
    ...privacy,
    receiptVerified: true,
    localProjectionOnly: true,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    fullFileVisible: false,
    paymentDataVisible: false,
    theatreExecutes: false
  });
}

const W435_STATE_MAP = Object.freeze({
  answer: 'queued',
  draft: 'preparing',
  'ready-for-review': 'waiting-for-user',
  'awaiting-approval': 'waiting-for-user',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled'
});

function w435Source(job = {}) {
  if (job.surfaceId === 'flow') return sourceFor('automations');
  if (job.surfaceId === 'forge') return sourceFor('forge');
  if (job.surfaceId === 'studio') return sourceFor('create');
  return sourceFor('chat');
}

function adaptW435Job(job = {}, events = []) {
  const state = W435_STATE_MAP[job.state];
  if (!state || !JOB_ID_RE.test(String(job.jobId || ''))) return null;
  const source = w435Source(job);
  const rail = job.capabilityMode === 'local' ? 'local' : job.capabilityMode === 'connected' ? 'direct-byok' : job.capabilityAvailable === false ? 'unavailable' : 'guide';
  const privacy = privacyFor(rail);
  const matchingEvents = events.filter((entry) => entry?.jobId === job.jobId).slice(0, MAX_LOGS);
  return freeze({
    schema: EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA,
    jobId: job.jobId,
    state,
    jobType: safeCode(job.taskClass, 'chat') || 'chat',
    safeLabel: safeLabel(job.safeLabel),
    sourceSurface: source.id,
    sourceLabel: source.label,
    route: job.route || source.route,
    rail,
    railLabel: rail === 'direct-byok' ? 'Direct BYOK' : rail === 'local' ? 'Local' : rail === 'guide' ? 'Guide / proposal' : 'Unavailable',
    authority: EONBOT_JOB_FABRIC_SCHEMA,
    createdAt: iso(job.createdAt),
    updatedAt: iso(job.updatedAt),
    authoritativeProgress: false,
    progress: null,
    failureCode: state === 'failed' ? safeCode(job.failureCode, 'bounded-failure') : '',
    resultReceiptId: state === 'completed' && job.hasReceipt ? 'receipt_w435_local_result' : '',
    logs: safeLogs(matchingEvents.map((entry) => ({ code: entry.type, state, at: entry.at })), state, job.updatedAt),
    actions: publicActions(state, job.route || source.route, []),
    ...privacy,
    receiptVerified: true,
    localProjectionOnly: true,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    fullFileVisible: false,
    paymentDataVisible: false,
    theatreExecutes: false
  });
}

export function sanitizeEonCityAgentTheatreStore(input = {}, { now = Date.now() } = {}) {
  const clock = Number(now) || Date.now();
  const receipts = (Array.isArray(input?.receipts) ? input.receipts : [])
    .map((entry) => normalizeDedicatedReceipt(entry, clock))
    .filter(Boolean)
    .sort((left, right) => time(right.updatedAt) - time(left.updatedAt))
    .slice(0, MAX_RECEIPTS);
  return freeze({
    schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA,
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

export function readEonCityAgentTheatreStore({ storage = null, now = Date.now() } = {}) {
  const target = storageFor(storage);
  try {
    const parsed = JSON.parse(target?.getItem?.(EON_CITY_AGENT_THEATRE_STORAGE_KEY) || 'null');
    return sanitizeEonCityAgentTheatreStore(parsed || {}, { now });
  } catch { return sanitizeEonCityAgentTheatreStore({}, { now }); }
}

function readDedicated(storage, now) {
  return readEonCityAgentTheatreStore({ storage, now }).receipts;
}

function emit(snapshot) {
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') globalThis.dispatchEvent(new CustomEvent(EON_CITY_AGENT_THEATRE_EVENT, { detail: snapshot }));
  } catch {}
}

function forbiddenInput(candidate = {}) {
  if (!candidate || typeof candidate !== 'object') return true;
  return Object.keys(candidate).some((key) => FORBIDDEN_FIELD_RE.test(key)) || SECRET_TEXT_RE.test(JSON.stringify(candidate));
}

export function recordEonCityAgentTheatreReceipt(candidate = {}, { storage = null, now = () => Date.now(), explicitUserAction = false, explicitUserApproval = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', stored: false, networkRequestCreated: false });
  if (forbiddenInput(candidate)) return freeze({ ok: false, reason: 'private-or-sensitive-fields-rejected', stored: false, networkRequestCreated: false });
  if (candidate.rail === 'direct-byok' && explicitUserApproval !== true) return freeze({ ok: false, reason: 'direct-byok-approval-required', stored: false, networkRequestCreated: false });
  const clock = Number(now()) || Date.now();
  const receipt = normalizeDedicatedReceipt({ ...candidate, schema: EON_CITY_AGENT_THEATRE_RECEIPT_SCHEMA, createdAt: candidate.createdAt || clock, updatedAt: candidate.updatedAt || clock }, clock);
  if (!receipt) return freeze({ ok: false, reason: 'invalid-bounded-receipt', stored: false, networkRequestCreated: false });
  const target = storageFor(storage);
  const existing = readDedicated(target, clock).filter((entry) => entry.jobId !== receipt.jobId);
  const state = sanitizeEonCityAgentTheatreStore({ schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA, updatedAt: clock, receipts: [receipt, ...existing] }, { now: clock });
  let stored = false;
  try { target?.setItem?.(EON_CITY_AGENT_THEATRE_STORAGE_KEY, JSON.stringify(state)); stored = true; } catch {}
  const snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage: target, now: () => clock });
  if (stored) emit(snapshot);
  return freeze({ ok: stored, reason: stored ? 'bounded-receipt-recorded' : 'storage-unavailable', stored, receipt, snapshot, networkRequestCreated: false, externalActionStarted: false });
}

export function recordEonCityLocalJobReceipt(candidate = {}, options = {}) {
  return recordEonCityAgentTheatreReceipt({ ...candidate, rail: 'local' }, options);
}

export function recordEonCityDirectByokJobReceipt(candidate = {}, options = {}) {
  return recordEonCityAgentTheatreReceipt({ ...candidate, rail: 'direct-byok' }, options);
}

export function getEonCityGenuineAgentTheatreSnapshot({ storage = null, now = () => Date.now() } = {}) {
  const target = storageFor(storage);
  const clock = Number(now()) || Date.now();
  const fabric = readEonbotJobFabricProjection({ storage: target });
  const adapted = (Array.isArray(fabric.jobs) ? fabric.jobs : []).map((job) => adaptW435Job(job, fabric.events || [])).filter(Boolean);
  const dedicated = readDedicated(target, clock);
  const seen = new Set();
  const jobs = [...dedicated, ...adapted]
    .sort((left, right) => time(right.updatedAt) - time(left.updatedAt))
    .filter((entry) => !seen.has(entry.jobId) && seen.add(entry.jobId))
    .slice(0, MAX_VISIBLE);
  const countsByState = Object.fromEntries(EON_CITY_AGENT_THEATRE_STATES.map((state) => [state, jobs.filter((job) => job.state === state).length]));
  return freeze({
    schema: EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA,
    updatedAt: iso(Math.max(clock, ...jobs.map((entry) => time(entry.updatedAt)), 0)),
    jobs: freeze(jobs),
    jobCount: jobs.length,
    countsByState: freeze(countsByState),
    empty: jobs.length === 0,
    emptyMessage: jobs.length ? '' : 'No genuine job receipt is present. Run a user-initiated Local AI or EONBOT request to see its bounded local receipt here.',
    selectedJobId: '',
    sourceAuthorities: freeze([EONBOT_JOB_FABRIC_STORAGE_KEY, EON_CITY_AGENT_THEATRE_STORAGE_KEY]),
    lifecycle: EON_CITY_AGENT_THEATRE_STATES,
    receiptBackedOnly: true,
    localAiReceiptProjection: true,
    localAiExecutionAuthority: false,
    startsWork: false,
    autoNavigation: false,
    fakeWorkers: false,
    inventedProgress: false,
    billingMutation: false,
    referralMutation: false,
    rewardMutation: false,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    fullFileVisible: false,
    remoteTelemetry: false
  });
}

export function createEonCityGenuineAgentTheatreController({ storage = null, now = () => Date.now() } = {}) {
  const target = storageFor(storage);
  const listeners = new Set();
  let selectedJobId = '';
  let disposed = false;
  const snapshot = () => freeze({ ...getEonCityGenuineAgentTheatreSnapshot({ storage: target, now }), selectedJobId });
  const notify = () => {
    const next = snapshot();
    for (const listener of listeners) { try { listener(next); } catch {} }
    return next;
  };
  const unsubscribeFabric = subscribeEonbotJobFabricProjection(() => { if (!disposed) notify(); });
  const theatreHandler = () => { if (!disposed) notify(); };
  const storageHandler = (event) => {
    if (!disposed && [EONBOT_JOB_FABRIC_STORAGE_KEY, EON_CITY_AGENT_THEATRE_STORAGE_KEY].includes(String(event?.key || ''))) notify();
  };
  try { globalThis.addEventListener?.(EON_CITY_AGENT_THEATRE_EVENT, theatreHandler); } catch {}
  try { globalThis.addEventListener?.('storage', storageHandler); } catch {}
  return freeze({
    getSnapshot: snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    review(jobId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-review-required', snapshot: snapshot() });
      const job = snapshot().jobs.find((entry) => entry.jobId === String(jobId || ''));
      if (!job) return freeze({ ok: false, reason: 'job-receipt-not-found', snapshot: snapshot() });
      selectedJobId = job.jobId;
      return freeze({ ok: true, reason: 'bounded-job-reviewed', job, snapshot: notify(), networkRequestCreated: false, externalActionStarted: false });
    },
    clearReview() { selectedJobId = ''; return notify(); },
    dispose() {
      if (disposed) return freeze({ disposed: true });
      disposed = true;
      listeners.clear();
      try { unsubscribeFabric?.(); } catch {}
      try { globalThis.removeEventListener?.(EON_CITY_AGENT_THEATRE_EVENT, theatreHandler); } catch {}
      try { globalThis.removeEventListener?.('storage', storageHandler); } catch {}
      return freeze({ disposed: true });
    }
  });
}

export function validateEonCityGenuineAgentTheatreSnapshot(snapshot = getEonCityGenuineAgentTheatreSnapshot()) {
  const errors = [];
  if (snapshot.schema !== EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA) errors.push('Genuine Agent Theatre schema mismatch.');
  if (JSON.stringify(snapshot.lifecycle) !== JSON.stringify(EON_CITY_AGENT_THEATRE_STATES)) errors.push('Required eight-state lifecycle drifted.');
  if (!Array.isArray(snapshot.jobs) || snapshot.jobs.length > MAX_VISIBLE) errors.push('Visible genuine job receipt bound is invalid.');
  for (const job of Array.isArray(snapshot.jobs) ? snapshot.jobs : []) {
    if (!JOB_ID_RE.test(job.jobId) || !STATE_SET.has(job.state) || !RAIL_SET.has(job.rail)) errors.push(`Invalid bounded job receipt: ${job.jobId || '(empty)'}`);
    if (job.progress !== null && job.authoritativeProgress !== true) errors.push(`Invented progress detected: ${job.jobId}`);
    if (job.state === 'running' && job.authority !== 'native-bounded-receipt') errors.push(`Running state lacks native receipt authority: ${job.jobId}`);
    if (job.rawPromptVisible || job.rawOutputVisible || job.credentialVisible || job.fullFileVisible || job.paymentDataVisible || job.theatreExecutes) errors.push(`Private or execution boundary violated: ${job.jobId}`);
  }
  if (!snapshot.receiptBackedOnly || snapshot.startsWork || snapshot.autoNavigation || snapshot.fakeWorkers || snapshot.inventedProgress || snapshot.billingMutation || snapshot.referralMutation || snapshot.rewardMutation || snapshot.rawPromptVisible || snapshot.rawOutputVisible || snapshot.credentialVisible || snapshot.fullFileVisible || snapshot.remoteTelemetry) errors.push('Genuine Agent Theatre global truth boundary failed.');
  return freeze({ schema: `${EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA}.validation`, ok: errors.length === 0, errors: freeze(errors), checks: 18, jobCount: snapshot.jobCount || 0 });
}

export default freeze({
  getEonCityGenuineAgentTheatreSnapshot,
  createEonCityGenuineAgentTheatreController,
  recordEonCityAgentTheatreReceipt,
  recordEonCityLocalJobReceipt,
  recordEonCityDirectByokJobReceipt,
  sanitizeEonCityAgentTheatreStore,
  readEonCityAgentTheatreStore,
  validateEonCityGenuineAgentTheatreSnapshot
});
