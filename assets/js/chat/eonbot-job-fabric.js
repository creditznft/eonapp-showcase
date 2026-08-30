/**
 * W435 — EONBOT job fabric, capability truth and local receipt/event stream.
 *
 * This is a local-first truth layer for work the person deliberately asks
 * EONBOT to prepare. It stores safe labels, opaque identifiers, lifecycle
 * state and bounded local receipts only. It never stores the original prompt
 * or output, starts a provider request, executes an external action, schedules
 * background work, requests browser permission, or exposes Vault data.
 *
 * The job fabric is intentionally not a replacement for provider adapters or
 * Action Gateway. Those remain separately gated. A completed job here means a
 * reviewed local result receipt exists; it never means publishing, deployment,
 * payment, social posting, account connection, or remote execution occurred.
 */

import { resolveEonbotCapabilityMode } from './eonbot-capability-registry.js';
import { classifyEonKernelIntent } from '../ai-kernel/eon-role-profiles.js';
import {
  EONBOT_JOB_EVENT_SCHEMA,
  EONBOT_JOB_FABRIC_EVENT,
  EONBOT_JOB_FABRIC_SCHEMA,
  EONBOT_JOB_FABRIC_STORAGE_KEY
} from '../contracts/workflow/eonbot-job-fabric-projection.js';
export { EONBOT_JOB_EVENT_SCHEMA, EONBOT_JOB_FABRIC_EVENT, EONBOT_JOB_FABRIC_SCHEMA, EONBOT_JOB_FABRIC_STORAGE_KEY };
export const EONBOT_JOB_STATES = Object.freeze([
  'answer',
  'draft',
  'ready-for-review',
  'awaiting-approval',
  'completed',
  'failed',
  'cancelled'
]);
export const EONBOT_JOB_SURFACES = Object.freeze([
  Object.freeze({ id: 'chat', label: 'Chat', route: '/' }),
  Object.freeze({ id: 'forge', label: 'EON Forge', route: '/forge' }),
  Object.freeze({ id: 'studio', label: 'EON Studio', route: '/?new=1' }),
  Object.freeze({ id: 'insight', label: 'EON Insight', route: '/insights?desk=research' }),
  Object.freeze({ id: 'flow', label: 'EON Flow', route: '/automations' }),
  Object.freeze({ id: 'city', label: 'EON City', route: '/eoncity' }),
  Object.freeze({ id: 'unavailable', label: 'Unavailable', route: '' })
]);

const MAX_JOBS = 48;
const MAX_EVENTS = 192;
const JOB_ID_RE = /^eonjob_[a-z0-9_-]{8,96}$/i;
const EVENT_ID_RE = /^eonjobevt_[a-z0-9_-]{8,112}$/i;
const HASH_RE = /^sha256:[a-z0-9_-]{20,160}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_:-]{0,100}$/u;
const SAFE_CODE_RE = /^[a-z][a-z0-9-]{1,80}$/i;
const STATE_SET = new Set(EONBOT_JOB_STATES);
const SURFACE_MAP = new Map(EONBOT_JOB_SURFACES.map((entry) => [entry.id, entry]));
const SENSITIVE_TEXT = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b|\b(?:password|api\s*key|access\s*token|session\s*cookie|prompt|raw output|attachment)\b)/i;
const freeze = (value) => Object.freeze(value);

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function time(value = Date.now()) {
  const candidate = Number(value);
  if (Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : Date.now();
}

function iso(value = Date.now()) {
  return new Date(time(value)).toISOString();
}

function cleanLabel(value = '', fallback = 'Local EONBOT work') {
  const label = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 101);
  return SAFE_LABEL_RE.test(label) && !SENSITIVE_TEXT.test(label) ? label : fallback;
}

function cleanCode(value = '', fallback = '') {
  const code = String(value || '').trim().toLowerCase();
  return SAFE_CODE_RE.test(code) ? code : fallback;
}

function cleanHash(value = '') {
  const hash = String(value || '').trim();
  return HASH_RE.test(hash) ? hash : '';
}

function randomToken(now = Date.now()) {
  let token = '';
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    token = `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  } catch {}
  if (!token) token = `${Math.floor(Math.random() * 0x7fffffff).toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
  return `${Number(now).toString(36)}_${token}`.slice(0, 80);
}

function makeJobId(now = Date.now()) {
  return `eonjob_${randomToken(now)}`.slice(0, 96);
}

function makeEventId(now = Date.now()) {
  return `eonjobevt_${randomToken(now)}`.slice(0, 112);
}

function surfaceFor(id = '') {
  return SURFACE_MAP.get(String(id || '')) || SURFACE_MAP.get('unavailable');
}

function surfaceForTaskClass(taskClass = '') {
  const normalized = String(taskClass || 'chat');
  if (normalized === 'build' || normalized === 'code' || normalized === 'project') return surfaceFor('forge');
  if (normalized === 'media' || normalized === 'image' || normalized === 'video' || normalized === 'audio') return surfaceFor('studio');
  if (normalized === 'research') return surfaceFor('insight');
  if (normalized === 'workflow' || normalized === 'automation') return surfaceFor('flow');
  if (normalized === 'city') return surfaceFor('city');
  if (normalized === 'review' && String(taskClass || '').toLowerCase() === 'unavailable') return surfaceFor('unavailable');
  return surfaceFor('chat');
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function sanitizeEonbotJobFabricState(input = {}, { now = Date.now() } = {}) {
  const clock = time(now);
  try {
    const parsed = input && typeof input === 'object' ? input : {};
    const jobs = [];
    const seen = new Set();
    for (const candidate of Array.isArray(parsed?.jobs) ? parsed.jobs : []) {
      const job = normalizeJob(candidate, clock);
      if (!job || seen.has(job.jobId)) continue;
      seen.add(job.jobId);
      jobs.push(job);
    }
    const events = [];
    const eventSeen = new Set();
    for (const candidate of Array.isArray(parsed?.events) ? parsed.events : []) {
      const event = normalizeEvent(candidate, clock);
      if (!event || eventSeen.has(event.eventId)) continue;
      eventSeen.add(event.eventId);
      events.push(event);
    }
    jobs.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    events.sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
    return freeze({
      schema: EONBOT_JOB_FABRIC_SCHEMA,
      version: 1,
      updatedAt: iso(parsed?.updatedAt || clock),
      jobs: freeze(jobs.slice(0, MAX_JOBS)),
      events: freeze(events.slice(0, MAX_EVENTS)),
      rawPromptStored: false,
      rawOutputStored: false,
      credentialStored: false,
      fileContentStored: false,
      executionPayloadStored: false,
      networkRequestCreated: false
    });
  } catch {
    return freeze({
      schema: EONBOT_JOB_FABRIC_SCHEMA, version: 1, updatedAt: iso(clock), jobs: freeze([]), events: freeze([]),
      rawPromptStored: false, rawOutputStored: false, credentialStored: false, fileContentStored: false,
      executionPayloadStored: false, networkRequestCreated: false
    });
  }
}

export function readEonbotJobFabricState({ storage = null, now = Date.now() } = {}) {
  const target = storageFor(storage);
  try {
    const parsed = JSON.parse(target?.getItem?.(EONBOT_JOB_FABRIC_STORAGE_KEY) || 'null');
    return sanitizeEonbotJobFabricState(parsed || {}, { now });
  } catch { return sanitizeEonbotJobFabricState({}, { now }); }
}

function readState(storage, now = Date.now()) {
  return readEonbotJobFabricState({ storage, now });
}

function writeState(storage, state) {
  try { storage?.setItem?.(EONBOT_JOB_FABRIC_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function normalizeJob(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EONBOT_JOB_FABRIC_SCHEMA) return null;
  const jobId = String(candidate.jobId || '');
  const state = String(candidate.state || '');
  const surface = surfaceFor(candidate.surfaceId);
  if (!JOB_ID_RE.test(jobId) || !STATE_SET.has(state) || surface.id === 'unavailable' && candidate.surfaceId !== 'unavailable') return null;
  const createdAt = iso(candidate.createdAt || now);
  const updatedAt = iso(candidate.updatedAt || createdAt);
  const attempts = Math.min(Math.max(Number.parseInt(candidate.attempts, 10) || 1, 1), 9);
  const job = {
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    version: 1,
    jobId,
    state,
    safeLabel: cleanLabel(candidate.safeLabel),
    taskClass: cleanCode(candidate.taskClass, 'chat') || 'chat',
    surfaceId: surface.id,
    surfaceLabel: surface.label,
    route: surface.route,
    capabilityMode: ['guide', 'local', 'connected'].includes(String(candidate.capabilityMode || '')) ? String(candidate.capabilityMode) : 'guide',
    capabilityAvailable: candidate.capabilityAvailable !== false,
    reviewRequired: candidate.reviewRequired !== false,
    draftHash: cleanHash(candidate.draftHash),
    receiptHash: cleanHash(candidate.receiptHash),
    failureCode: cleanCode(candidate.failureCode),
    attempts,
    createdAt,
    updatedAt,
    reviewReadyAt: candidate.reviewReadyAt ? iso(candidate.reviewReadyAt) : '',
    approvalRequestedAt: candidate.approvalRequestedAt ? iso(candidate.approvalRequestedAt) : '',
    completedAt: candidate.completedAt ? iso(candidate.completedAt) : '',
    failedAt: candidate.failedAt ? iso(candidate.failedAt) : '',
    cancelledAt: candidate.cancelledAt ? iso(candidate.cancelledAt) : '',
    localOnly: true,
    foregroundOnly: true,
    backgroundAfterClose: false,
    externalEffect: false,
    rawPromptStored: false,
    rawOutputStored: false,
    credentialRead: false,
    publishOrSendStarted: false
  };
  return freeze(job);
}

function normalizeEvent(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EONBOT_JOB_EVENT_SCHEMA) return null;
  const eventId = String(candidate.eventId || '');
  const jobId = String(candidate.jobId || '');
  const state = String(candidate.state || '');
  if (!EVENT_ID_RE.test(eventId) || !JOB_ID_RE.test(jobId) || !STATE_SET.has(state)) return null;
  return freeze({
    schema: EONBOT_JOB_EVENT_SCHEMA,
    version: 1,
    eventId,
    jobId,
    type: cleanCode(candidate.type, 'state-recorded') || 'state-recorded',
    state,
    safeLabel: cleanLabel(candidate.safeLabel),
    at: iso(candidate.at || now),
    localOnly: true,
    externalEffect: false,
    rawContentStored: false
  });
}

function eventFor(job, type = 'state-recorded', now = Date.now()) {
  return normalizeEvent({
    schema: EONBOT_JOB_EVENT_SCHEMA,
    eventId: makeEventId(now),
    jobId: job.jobId,
    type,
    state: job.state,
    safeLabel: job.safeLabel,
    at: now
  }, now);
}

function publicJob(job) {
  return freeze({
    jobId: job.jobId,
    state: job.state,
    safeLabel: job.safeLabel,
    taskClass: job.taskClass,
    surfaceId: job.surfaceId,
    surfaceLabel: job.surfaceLabel,
    route: job.route,
    capabilityMode: job.capabilityMode,
    capabilityAvailable: job.capabilityAvailable,
    reviewRequired: job.reviewRequired,
    hasDraftEvidence: Boolean(job.draftHash),
    hasReceipt: Boolean(job.receiptHash),
    failureCode: job.failureCode,
    attempts: job.attempts,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false
  });
}

function emitEonbotJobFabricSnapshot(snapshot, currentReceipt = null) {
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      const receipt = currentReceipt && currentReceipt.schema === EONBOT_JOB_EVENT_SCHEMA ? currentReceipt : null;
      globalThis.dispatchEvent(new CustomEvent(EONBOT_JOB_FABRIC_EVENT, { detail: Object.freeze({ snapshot, currentReceipt: receipt }) }));
    }
  } catch {}
}

/** Subscribe to sanitized local job-fabric changes. No network channel is opened. */
export function subscribeEonbotJobFabric(listener) {
  if (typeof listener !== 'function' || typeof globalThis.addEventListener !== 'function') return () => {};
  const handler = (event) => {
    try { listener(event?.detail?.snapshot || null); } catch {}
  };
  globalThis.addEventListener(EONBOT_JOB_FABRIC_EVENT, handler);
  return () => {
    try { globalThis.removeEventListener?.(EONBOT_JOB_FABRIC_EVENT, handler); } catch {}
  };
}

/**
 * Subscribe only to a receipt created by a current successful local mutation.
 * The callback is never seeded from persisted history, which prevents old jobs
 * from being presented as fresh Activity Center events after page load.
 */
export function subscribeEonbotJobFabricReceipts(listener) {
  if (typeof listener !== 'function' || typeof globalThis.addEventListener !== 'function') return () => {};
  const handler = (event) => {
    const receipt = event?.detail?.currentReceipt;
    if (!receipt || receipt.schema !== EONBOT_JOB_EVENT_SCHEMA) return;
    try { listener(receipt, event?.detail?.snapshot || null); } catch {}
  };
  globalThis.addEventListener(EONBOT_JOB_FABRIC_EVENT, handler);
  return () => {
    try { globalThis.removeEventListener?.(EONBOT_JOB_FABRIC_EVENT, handler); } catch {}
  };
}

function snapshotOf(state, capability) {
  const active = state.jobs.filter((job) => !['completed', 'failed', 'cancelled'].includes(job.state));
  const byState = Object.fromEntries(EONBOT_JOB_STATES.map((entry) => [entry, 0]));
  for (const job of state.jobs) byState[job.state] += 1;
  return freeze({
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    updatedAt: state.updatedAt,
    jobs: freeze(state.jobs.map(publicJob)),
    events: freeze(state.events.map((event) => freeze({ ...event }))),
    activeCount: active.length,
    countsByState: freeze(byState),
    capability: capability ? freeze({ activeId: capability.activeId, activeLabel: capability.activeLabel, connectedReady: capability.connectedReady, localRuntimeReady: capability.localRuntimeReady }) : null,
    localOnly: true,
    transportStarted: false,
    externalActionStarted: false,
    browserPermissionRequested: false
  });
}

function findJob(state, jobId = '') {
  return state.jobs.find((job) => job.jobId === String(jobId || '')) || null;
}

function canTransition(from = '', to = '') {
  const transitions = {
    answer: new Set(['draft', 'failed', 'cancelled']),
    draft: new Set(['ready-for-review', 'failed', 'cancelled']),
    'ready-for-review': new Set(['awaiting-approval', 'failed', 'cancelled']),
    'awaiting-approval': new Set(['completed', 'failed', 'cancelled']),
    completed: new Set(),
    failed: new Set(['draft', 'cancelled']),
    cancelled: new Set(['draft'])
  };
  return Boolean(transitions[from]?.has(to));
}

function withState(job, state, now = Date.now(), extra = {}) {
  return normalizeJob({
    ...clone(job),
    ...extra,
    state,
    updatedAt: now,
    reviewReadyAt: state === 'ready-for-review' ? now : job.reviewReadyAt,
    approvalRequestedAt: state === 'awaiting-approval' ? now : job.approvalRequestedAt,
    completedAt: state === 'completed' ? now : job.completedAt,
    failedAt: state === 'failed' ? now : job.failedAt,
    cancelledAt: state === 'cancelled' ? now : job.cancelledAt
  }, now);
}

function routeIntent(intentText = '') {
  const classification = classifyEonKernelIntent(String(intentText || ''));
  const surface = classification.blocked ? surfaceFor('unavailable') : surfaceForTaskClass(classification.taskClass);
  return freeze({
    taskClass: classification.taskClass,
    role: classification.role,
    safeLabel: cleanLabel(classification.safeLabel),
    blocked: classification.blocked === true,
    reason: cleanCode(classification.reason, 'foreground-plan') || 'foreground-plan',
    surfaceId: surface.id,
    surfaceLabel: surface.label,
    route: surface.route,
    rawIntentStored: false
  });
}

/**
 * Creates a local-only fabric. All mutating methods require an explicit user
 * gesture argument and return bounded receipts, never raw chat/provider data.
 */
export function createEonbotJobFabric({ storage = null, now = () => Date.now(), capabilitySettings = {}, localRuntimeStatus = null, readiness = null } = {}) {
  const targetStorage = storageFor(storage);
  const clock = () => time(now());
  const capability = () => resolveEonbotCapabilityMode({ settings: capabilitySettings, localRuntimeStatus, readiness });
  const current = () => readState(targetStorage, clock());
  const persist = (state, currentReceipt = null) => {
    const stored = writeState(targetStorage, state);
    const snapshot = snapshotOf(readState(targetStorage, clock()), capability());
    if (stored) emitEonbotJobFabricSnapshot(snapshot, currentReceipt);
    return freeze({ stored, browserStorageChanged: stored, networkRequestCreated: false, externalActionStarted: false, snapshot });
  };
  const transition = (jobId, targetState, type, { explicitUserAction = false, explicitUserApproval = false, draftHash = '', receiptHash = '', failureCode = '' } = {}) => {
    if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    const state = current();
    const job = findJob(state, jobId);
    if (!job) return freeze({ ok: false, error: 'job-not-found', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    if (!canTransition(job.state, targetState)) return freeze({ ok: false, error: 'invalid-job-state-transition', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    if (targetState === 'awaiting-approval' && explicitUserApproval !== true) return freeze({ ok: false, error: 'explicit-user-approval-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    if (targetState === 'ready-for-review' && !cleanHash(draftHash)) return freeze({ ok: false, error: 'local-draft-hash-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    if (targetState === 'completed' && !cleanHash(receiptHash)) return freeze({ ok: false, error: 'local-result-receipt-hash-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    if (targetState === 'failed' && !cleanCode(failureCode)) return freeze({ ok: false, error: 'safe-failure-code-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
    const next = withState(job, targetState, clock(), {
      draftHash: targetState === 'ready-for-review' ? cleanHash(draftHash) : job.draftHash,
      receiptHash: targetState === 'completed' ? cleanHash(receiptHash) : job.receiptHash,
      failureCode: targetState === 'failed' ? cleanCode(failureCode) : ''
    });
    const receipt = eventFor(next, type, clock());
    const updated = freeze({ ...state, updatedAt: iso(clock()), jobs: freeze(state.jobs.map((entry) => entry.jobId === job.jobId ? next : entry)), events: freeze([receipt, ...state.events].slice(0, MAX_EVENTS)) });
    const saved = persist(updated, receipt);
    return freeze({ ok: saved.stored, job: publicJob(next), receipt, ...saved });
  };

  return freeze({
    getSnapshot() { return snapshotOf(current(), capability()); },
    routeIntent,
    createAnswer({ intentText = '', safeLabel = '' } = {}, { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      const route = routeIntent(intentText);
      const cap = capability();
      const state = current();
      if (state.jobs.length >= MAX_JOBS) return freeze({ ok: false, error: 'job-fabric-limit-reached', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      const job = normalizeJob({
        schema: EONBOT_JOB_FABRIC_SCHEMA,
        jobId: makeJobId(clock()),
        state: 'answer',
        safeLabel: cleanLabel(safeLabel, route.safeLabel),
        taskClass: route.taskClass,
        surfaceId: route.surfaceId,
        capabilityMode: cap.activeId,
        capabilityAvailable: route.blocked ? false : true,
        reviewRequired: true,
        attempts: 1,
        createdAt: clock(),
        updatedAt: clock()
      }, clock());
      const receipt = eventFor(job, 'answer-recorded', clock());
      const next = freeze({ ...state, updatedAt: iso(clock()), jobs: freeze([job, ...state.jobs].slice(0, MAX_JOBS)), events: freeze([receipt, ...state.events].slice(0, MAX_EVENTS)) });
      const saved = persist(next, receipt);
      return freeze({ ok: saved.stored, job: publicJob(job), route, receipt, ...saved });
    },
    createDraftFromAnswer(jobId = '', { explicitUserAction = false } = {}) {
      return transition(jobId, 'draft', 'draft-created', { explicitUserAction });
    },
    markReadyForReview(jobId = '', { explicitUserAction = false, localDraftHash = '' } = {}) {
      if (!cleanHash(localDraftHash)) return freeze({ ok: false, error: 'local-draft-hash-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      return transition(jobId, 'ready-for-review', 'review-ready', { explicitUserAction, draftHash: localDraftHash });
    },
    requestApproval(jobId = '', { explicitUserAction = false, explicitUserApproval = false } = {}) {
      return transition(jobId, 'awaiting-approval', 'approval-requested', { explicitUserAction, explicitUserApproval });
    },
    completeLocalReview(jobId = '', { explicitUserAction = false, localResultReceiptHash = '' } = {}) {
      return transition(jobId, 'completed', 'local-review-completed', { explicitUserAction, receiptHash: localResultReceiptHash });
    },
    fail(jobId = '', { explicitUserAction = false, safeFailureCode = '' } = {}) {
      return transition(jobId, 'failed', 'failed', { explicitUserAction, failureCode: safeFailureCode });
    },
    cancel(jobId = '', { explicitUserAction = false } = {}) {
      return transition(jobId, 'cancelled', 'cancelled', { explicitUserAction });
    },
    retry(jobId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      const state = current();
      const job = findJob(state, jobId);
      if (!job) return freeze({ ok: false, error: 'job-not-found', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      if (!['failed', 'cancelled'].includes(job.state)) return freeze({ ok: false, error: 'retry-not-available', browserStorageChanged: false, networkRequestCreated: false, externalActionStarted: false });
      const next = withState(job, 'draft', clock(), { attempts: Math.min(job.attempts + 1, 9), failureCode: '' });
      const receipt = eventFor(next, 'retry-created', clock());
      const updated = freeze({ ...state, updatedAt: iso(clock()), jobs: freeze(state.jobs.map((entry) => entry.jobId === job.jobId ? next : entry)), events: freeze([receipt, ...state.events].slice(0, MAX_EVENTS)) });
      const saved = persist(updated, receipt);
      return freeze({ ok: saved.stored, job: publicJob(next), receipt, ...saved });
    },
    getJob(jobId = '') {
      const job = findJob(current(), jobId);
      return job ? publicJob(job) : null;
    }
  });
}

export function getEonbotJobFabricTruth() {
  return freeze({
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    lifecycle: freeze(EONBOT_JOB_STATES.slice()),
    capabilityTruth: true,
    localReceiptEventStream: true,
    explicitUserActionRequired: true,
    explicitApprovalRequired: true,
    externalExecution: false,
    providerRequestCreated: false,
    backgroundAfterClose: false,
    rawPromptStored: false,
    rawOutputStored: false,
    credentialRead: false,
    browserPermissionRequested: false,
    liveAgentOrNpcClaim: false,
    productionExecutionProof: false
  });
}
