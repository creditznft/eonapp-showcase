/**
 * A15 C02 — read-only projection contract for bounded EONBOT job receipts.
 * It owns no provider, model, prompt, output, approval or execution behavior.
 */
export const EONBOT_JOB_FABRIC_SCHEMA = 'eonapp.eonbot-job-fabric.w435.v1';
export const EONBOT_JOB_FABRIC_STORAGE_KEY = 'eon:eonbot:job-fabric:v1';
export const EONBOT_JOB_EVENT_SCHEMA = 'eonapp.eonbot-job-event.w435.v1';
export const EONBOT_JOB_FABRIC_EVENT = 'eon:eonbot-job-fabric';

const freeze = (value) => Object.freeze(value);
const MAX_JOBS = 48;
const MAX_EVENTS = 192;
const SAFE_STATES = new Set(['answer', 'draft', 'ready-for-review', 'awaiting-approval', 'completed', 'failed', 'cancelled']);
const SAFE_MODES = new Set(['guide', 'connected', 'local', 'unavailable']);
const safeText = (value = '', max = 160) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
const safeId = (value = '', max = 160) => String(value || '').trim().replace(/[^a-z0-9:_-]+/gi, '').slice(0, max);
const storageFor = (candidate = null) => {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
};

function projectJob(job = {}) {
  const state = SAFE_STATES.has(String(job?.state || '')) ? String(job.state) : 'failed';
  const capabilityMode = SAFE_MODES.has(String(job?.capabilityMode || '')) ? String(job.capabilityMode) : 'unavailable';
  return freeze({
    jobId: safeId(job.jobId, 112),
    state,
    surfaceId: safeId(job.surfaceId, 48),
    taskClass: safeId(job.taskClass, 64),
    safeLabel: safeText(job.safeLabel || 'Bounded job receipt', 101),
    route: String(job.route || '').startsWith('/') ? String(job.route).slice(0, 200) : '',
    capabilityMode,
    capabilityAvailable: job.capabilityAvailable === true,
    reviewRequired: job.reviewRequired === true,
    hasReceipt: job.hasReceipt === true || Boolean(job.receiptHash),
    failureCode: safeId(job.failureCode, 80),
    createdAt: safeText(job.createdAt, 40),
    updatedAt: safeText(job.updatedAt, 40)
  });
}

function projectEvent(event = {}) {
  return freeze({
    eventId: safeId(event.eventId, 128),
    jobId: safeId(event.jobId, 112),
    type: safeId(event.type, 80),
    at: safeText(event.at, 40)
  });
}

export function readEonbotJobFabricProjection({ storage = null } = {}) {
  let parsed = null;
  try { parsed = JSON.parse(storageFor(storage)?.getItem?.(EONBOT_JOB_FABRIC_STORAGE_KEY) || 'null'); } catch {}
  const jobs = Array.isArray(parsed?.jobs) ? parsed.jobs.slice(0, MAX_JOBS).map(projectJob).filter((job) => job.jobId) : [];
  const events = Array.isArray(parsed?.events) ? parsed.events.slice(0, MAX_EVENTS).map(projectEvent).filter((event) => event.jobId) : [];
  return freeze({
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    updatedAt: safeText(parsed?.updatedAt, 40),
    jobs: freeze(jobs),
    events: freeze(events),
    privacyProjected: true,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    executionAuthority: false
  });
}

export function subscribeEonbotJobFabricProjection(listener, environment = globalThis) {
  if (typeof listener !== 'function' || typeof environment?.addEventListener !== 'function') return () => {};
  const onFabric = (event) => {
    const snapshot = event?.detail?.snapshot;
    listener(snapshot?.schema === EONBOT_JOB_FABRIC_SCHEMA ? readEonbotJobFabricProjection() : readEonbotJobFabricProjection());
  };
  const onStorage = (event) => {
    if (String(event?.key || '') === EONBOT_JOB_FABRIC_STORAGE_KEY) listener(readEonbotJobFabricProjection());
  };
  environment.addEventListener(EONBOT_JOB_FABRIC_EVENT, onFabric);
  environment.addEventListener('storage', onStorage);
  return () => {
    try { environment.removeEventListener?.(EONBOT_JOB_FABRIC_EVENT, onFabric); } catch {}
    try { environment.removeEventListener?.('storage', onStorage); } catch {}
  };
}
