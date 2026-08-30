/** W627C — provider-neutral Creator lifecycle projected over established rails. */

import { EON_PROJECT_REGISTRY_STORAGE_KEY, canonicalProjectId, registerProjectSource, removeProjectSource } from '../projects/eon-project-registry.js';
import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';

export const EON_CREATOR_JOB_SCHEMA = 'eon.creator.job.w627c.v1';
export const EON_CREATOR_JOB_STORAGE_KEY = 'eon:creator-jobs:v1';
export const EON_CREATOR_JOB_STATES = Object.freeze(['draft', 'preparing', 'waiting', 'running', 'failed', 'cancelled', 'complete', 'saved', 'deleted']);

const STATE_SET = new Set(EON_CREATOR_JOB_STATES);
const ACTIVE_JOB_STATES = new Set(['draft', 'preparing', 'waiting', 'running']);
const TRANSITIONS = Object.freeze({
  draft: Object.freeze(['preparing', 'cancelled', 'deleted']),
  preparing: Object.freeze(['waiting', 'running', 'failed', 'cancelled']),
  waiting: Object.freeze(['running', 'failed', 'cancelled']),
  running: Object.freeze(['complete', 'failed', 'cancelled']),
  failed: Object.freeze(['preparing', 'deleted']),
  cancelled: Object.freeze(['preparing', 'deleted']),
  complete: Object.freeze(['saved', 'deleted']),
  saved: Object.freeze(['deleted']),
  deleted: Object.freeze([])
});

function storage(options = {}) { if (options.storage) return options.storage; try { return globalThis.localStorage || null; } catch { return null; } }
function nowIso(now = () => Date.now()) { return new Date(Number(now())).toISOString(); }
function parse(raw, fallback) { try { const value = JSON.parse(String(raw || '')); return value && typeof value === 'object' ? value : fallback; } catch { return fallback; } }
function clean(value = '', limit = 180) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit); }
function id() { try { return `creatorjob_${globalThis.crypto.randomUUID()}`; } catch { return `creatorjob_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; } }

function normalizeJob(value = {}) {
  const createdAt = String(value.createdAt || new Date().toISOString());
  const state = STATE_SET.has(value.state) ? value.state : 'draft';
  return Object.freeze({
    schema: EON_CREATOR_JOB_SCHEMA,
    jobId: clean(value.jobId || id(), 140),
    intentId: clean(value.intentId, 140),
    mediaKind: ['image', 'video'].includes(value.mediaKind) ? value.mediaKind : 'image',
    rail: ['local-runtime', 'direct-user-owned-byok', 'guide'].includes(value.rail) ? value.rail : 'guide',
    state,
    safeLabel: clean(value.safeLabel || 'Creator job'),
    sourceJobId: clean(value.sourceJobId, 160),
    progress: Number.isFinite(Number(value.progress)) ? Math.min(100, Math.max(0, Math.round(Number(value.progress)))) : null,
    code: clean(value.code || state, 80),
    message: clean(value.message || state, 240),
    output: value.output && typeof value.output === 'object' ? Object.freeze({
      sha256: clean(value.output.sha256, 128),
      contentType: clean(value.output.contentType, 80),
      width: Math.max(0, Number(value.output.width || 0)),
      height: Math.max(0, Number(value.output.height || 0)),
      durationSeconds: Math.max(0, Number(value.output.durationSeconds || 0)),
      bytes: Math.max(0, Number(value.output.bytes || 0))
    }) : null,
    rawPromptStored: false,
    credentialsStored: false,
    eonappServerProxyUsed: false,
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  });
}


function registerCreatorJob(job = {}, options = {}) {
  return registerProjectSource({
    namespace: 'creator-job',
    sourceId: job.jobId,
    projectId: canonicalProjectId('creator-job', job.jobId),
    storageKey: EON_CREATOR_JOB_STORAGE_KEY,
    sourceSchema: EON_CREATOR_JOB_SCHEMA,
    relation: 'job',
    title: job.safeLabel,
    summary: job.message,
    operationalStatus: job.state,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    continueDestination: 'create'
  }, { ...options, emit: false });
}

export function loadCreatorJobs(options = {}) {
  const target = storage(options);
  const state = parse(target?.getItem(EON_CREATOR_JOB_STORAGE_KEY), { schema: EON_CREATOR_JOB_SCHEMA, jobs: [] });
  return Object.freeze((Array.isArray(state.jobs) ? state.jobs : []).map(normalizeJob));
}

function persist(jobs, options = {}) {
  const target = storage(options);
  const payload = { schema: EON_CREATOR_JOB_SCHEMA, updatedAt: nowIso(options.now), jobs: jobs.map(normalizeJob) };
  const serialized = JSON.stringify(payload);
  target?.setItem?.(EON_CREATOR_JOB_STORAGE_KEY, serialized);
  if (target?.getItem?.(EON_CREATOR_JOB_STORAGE_KEY) !== serialized) throw new Error('Creator job write verification failed.');
  try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:creator-jobs-changed', { detail: { updatedAt: payload.updatedAt } })); } catch {}
  return Object.freeze(payload.jobs);
}

function creatorJobCapacityCounts(jobs = []) {
  const totalCount = jobs.length;
  const activeCount = jobs.filter((job) => ACTIVE_JOB_STATES.has(job.state)).length;
  return Object.freeze({ totalCount, activeCount, archivedCount: Math.max(0, totalCount - activeCount) });
}

function creatorJobTransaction(options = {}) {
  return captureEonStorageSnapshot([EON_CREATOR_JOB_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY], options);
}

function rollbackCreatorJobTransaction(snapshot, options = {}) {
  const restored = restoreEonStorageSnapshot(snapshot, options);
  return restored.ok ? null : restored;
}

export function createCreatorJob(intent = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  const timestamp = nowIso(options.now);
  const job = normalizeJob({ intentId: intent.intentId, mediaKind: intent.mediaKind, rail: intent.rail, safeLabel: `${intent.mediaKind === 'video' ? 'Video' : 'Image'} creator draft`, state: 'draft', code: 'draft-created', message: 'Draft created locally. No generation request was sent.', createdAt: timestamp, updatedAt: timestamp });
  const previousJobs = loadCreatorJobs(options);
  const capacity = evaluateEonCapacity({ resourceId: 'creator-jobs', ...creatorJobCapacityCounts(previousJobs), requestedCount: 1, requestedTotalCount: 1 }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  const transaction = creatorJobTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed' });
  try {
    persist([job, ...previousJobs.filter((entry) => entry.jobId !== job.jobId)], options);
    const registered = registerCreatorJob(job, options);
    if (!registered.ok) throw new Error(registered.reason || 'project-registry-write-failed');
  } catch (error) {
    const rollback = rollbackCreatorJobTransaction(transaction, options);
    return Object.freeze({ ok: false, reason: rollback ? 'rollback-failed' : 'project-registry-write-failed', registryReason: String(error?.message || error), rollbackReason: rollback?.reason || '' });
  }
  return Object.freeze({ ok: true, job });
}

export function transitionCreatorJob(jobId = '', nextState = '', patch = {}, options = {}) {
  if (options.explicitUserAction !== true && options.authoritativeRailEvent !== true) return Object.freeze({ ok: false, reason: 'explicit-action-or-authoritative-event-required' });
  const jobs = [...loadCreatorJobs(options)];
  const index = jobs.findIndex((entry) => entry.jobId === jobId);
  if (index < 0) return Object.freeze({ ok: false, reason: 'job-not-found' });
  const current = jobs[index];
  const target = String(nextState || '');
  if (!STATE_SET.has(target)) return Object.freeze({ ok: false, reason: 'unknown-state' });
  if (!TRANSITIONS[current.state].includes(target)) return Object.freeze({ ok: false, reason: 'invalid-transition', from: current.state, to: target });
  const reactivating = !ACTIVE_JOB_STATES.has(current.state) && ACTIVE_JOB_STATES.has(target);
  if (reactivating) {
    const capacity = evaluateEonCapacity({ resourceId: 'creator-jobs', ...creatorJobCapacityCounts(jobs), requestedCount: 1, requestedTotalCount: 0 }, options);
    if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  }
  const job = normalizeJob({ ...current, ...patch, jobId: current.jobId, intentId: current.intentId, state: target, updatedAt: nowIso(options.now) });
  const transaction = creatorJobTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason || 'storage-snapshot-failed' });
  try {
    jobs[index] = job;
    persist(jobs, options);
    const registered = target === 'deleted'
      ? removeProjectSource('creator-job', job.jobId, { ...options, emit: false })
      : registerCreatorJob(job, options);
    if (!registered.ok && registered.reason !== 'source-not-found') throw new Error(registered.reason || 'project-registry-write-failed');
  } catch (error) {
    const rollback = rollbackCreatorJobTransaction(transaction, options);
    return Object.freeze({ ok: false, reason: rollback ? 'rollback-failed' : 'project-registry-write-failed', registryReason: String(error?.message || error), rollbackReason: rollback?.reason || '' });
  }
  return Object.freeze({ ok: true, job });
}

export function projectEstablishedRailEvent(jobId = '', event = {}, options = {}) {
  const sourceState = String(event.state || '').toLowerCase();
  const mapped = ({ queued: 'waiting', 'waiting-for-user': 'waiting', running: 'running', completed: 'complete', complete: 'complete', failed: 'failed', cancelled: 'cancelled', expired: 'failed' })[sourceState];
  if (!mapped) return Object.freeze({ ok: false, reason: 'unmapped-rail-state' });
  return transitionCreatorJob(jobId, mapped, { sourceJobId: event.jobId || event.promptId || '', progress: event.progress, code: event.code || sourceState, message: event.message || sourceState, output: event.output || event.result || null }, { ...options, authoritativeRailEvent: true });
}

export function getCreatorLifecycleTruth() {
  return Object.freeze({ schema: EON_CREATOR_JOB_SCHEMA, states: EON_CREATOR_JOB_STATES, localAndDirectAreProjectedNotReimplemented: true, deletedIsTerminal: true, completeDoesNotEqualSaved: true, rawPromptStored: false, credentialsStored: false });
}
