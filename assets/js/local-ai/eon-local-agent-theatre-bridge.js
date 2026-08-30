/**
 * Phase G — genuine Local AI -> Agent Theatre lifecycle bridge.
 *
 * This module observes an already-approved, user-initiated local AI request. It
 * does not choose providers/models, start transport, retry, pause City, or own
 * inference. It stores only bounded lifecycle metadata through W624I.
 */
import { recordEonLocalAgentTheatreReceipt } from '../contracts/city/eon-local-agent-theatre-receipt-contract.js';

export const EON_LOCAL_AGENT_THEATRE_BRIDGE_SCHEMA = 'eon.local-ai.agent-theatre-bridge.rt91.v1';
const freeze = Object.freeze;
const SAFE_CODE_RE = /^[a-z][a-z0-9-]{1,64}$/i;
const cleanCode = (value = '', fallback = 'chat') => SAFE_CODE_RE.test(String(value || '').trim().toLowerCase()) ? String(value || '').trim().toLowerCase() : fallback;

function fingerprint(value = '') {
  const text = String(value || '');
  let a = 2166136261;
  let b = 2246822519;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    a ^= code;
    a = Math.imul(a, 16777619) >>> 0;
    b ^= code + index;
    b = Math.imul(b, 3266489917) >>> 0;
  }
  return `${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}`;
}

function randomPart(environment = globalThis) {
  try {
    const id = environment?.crypto?.randomUUID?.();
    if (id) return String(id).replace(/[^a-z0-9]/gi, '').slice(0, 20).toLowerCase();
  } catch {}
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.slice(0, 20);
}

function sourceSurfaceFor(origin = '', taskType = '') {
  const normalizedOrigin = String(origin || '').trim().toLowerCase();
  const normalizedTask = String(taskType || '').trim().toLowerCase();
  if (normalizedOrigin.includes('forge') || normalizedTask === 'forge-code') return 'forge';
  if (normalizedOrigin.includes('local-ai')) return 'local-ai';
  if (normalizedOrigin.includes('create') || ['image', 'video', 'audio', 'media'].includes(normalizedTask)) return 'create';
  if (normalizedOrigin.includes('automation')) return 'automations';
  if (normalizedOrigin.includes('project')) return 'projects';
  return 'chat';
}

function safeLabelFor(sourceSurface = 'chat', taskType = 'chat') {
  if (sourceSurface === 'forge') return 'Local Forge model run';
  if (sourceSurface === 'local-ai') return 'Local AI model run';
  if (sourceSurface === 'create') return 'Local creator model run';
  if (sourceSurface === 'automations') return 'Local automation model run';
  if (sourceSurface === 'projects') return 'Local project model run';
  return taskType === 'chat' ? 'Local EONBOT reply' : 'Local EONBOT model run';
}

export function beginEonLocalAgentTheatreJob({
  userInitiated = false,
  origin = '',
  taskType = 'chat',
  storage = null,
  now = () => Date.now(),
  environment = globalThis,
  jobId = ''
} = {}) {
  if (userInitiated !== true) return freeze({ ok: false, reason: 'user-initiated-local-request-required', jobId: '', networkRequestCreated: false });
  const clock = Number(now()) || Date.now();
  const resolvedJobId = /^eonagentjob_local_[a-z0-9_-]{8,96}$/i.test(String(jobId || ''))
    ? String(jobId)
    : `eonagentjob_local_${clock.toString(36)}_${randomPart(environment)}`.slice(0, 112);
  const sourceSurface = sourceSurfaceFor(origin, taskType);
  const result = recordEonLocalAgentTheatreReceipt({
    jobId: resolvedJobId,
    state: 'running',
    jobType: cleanCode(taskType, 'chat'),
    safeLabel: safeLabelFor(sourceSurface, cleanCode(taskType, 'chat')),
    sourceSurface,
    authoritativeProgress: false,
    logs: [{ code: 'running', state: 'running', at: clock }],
    supportedActions: ['cancel']
  }, { storage, now: () => clock, explicitUserAction: true });
  return freeze({
    schema: EON_LOCAL_AGENT_THEATRE_BRIDGE_SCHEMA,
    ok: result.ok === true,
    reason: result.reason,
    jobId: resolvedJobId,
    sourceSurface,
    startedAt: clock,
    networkRequestCreated: false,
    inferenceAuthority: false
  });
}

export function completeEonLocalAgentTheatreJob(job = {}, {
  requestReceiptId = '',
  elapsedMs = 0,
  storage = null,
  now = () => Date.now()
} = {}) {
  if (!job?.ok || !job?.jobId) return freeze({ ok: false, reason: 'local-theatre-job-not-started', networkRequestCreated: false });
  const clock = Number(now()) || Date.now();
  const opaqueResultReceiptId = `receipt_local_${fingerprint(`${job.jobId}|${String(requestReceiptId || '')}`)}`;
  const result = recordEonLocalAgentTheatreReceipt({
    jobId: job.jobId,
    state: 'completed',
    jobType: 'local-model',
    safeLabel: safeLabelFor(job.sourceSurface, 'chat'),
    sourceSurface: job.sourceSurface,
    authoritativeProgress: false,
    resultReceiptId: opaqueResultReceiptId,
    logs: [
      { code: 'running', state: 'running', at: job.startedAt || clock },
      { code: 'completed', state: 'completed', at: clock }
    ],
    supportedActions: ['result-handoff']
  }, { storage, now: () => clock, explicitUserAction: true });
  return freeze({
    schema: EON_LOCAL_AGENT_THEATRE_BRIDGE_SCHEMA,
    ok: result.ok === true,
    reason: result.reason,
    jobId: job.jobId,
    state: 'completed',
    elapsedMs: Math.max(0, Math.round(Number(elapsedMs) || 0)),
    resultReceiptId: opaqueResultReceiptId,
    networkRequestCreated: false,
    inferenceAuthority: false
  });
}

export function failEonLocalAgentTheatreJob(job = {}, {
  failureCode = 'local-request-failed',
  storage = null,
  now = () => Date.now()
} = {}) {
  if (!job?.ok || !job?.jobId) return freeze({ ok: false, reason: 'local-theatre-job-not-started', networkRequestCreated: false });
  const clock = Number(now()) || Date.now();
  const result = recordEonLocalAgentTheatreReceipt({
    jobId: job.jobId,
    state: 'failed',
    jobType: 'local-model',
    safeLabel: safeLabelFor(job.sourceSurface, 'chat'),
    sourceSurface: job.sourceSurface,
    authoritativeProgress: false,
    failureCode: cleanCode(failureCode, 'local-request-failed'),
    logs: [
      { code: 'running', state: 'running', at: job.startedAt || clock },
      { code: 'failed', state: 'failed', at: clock }
    ],
    supportedActions: ['retry']
  }, { storage, now: () => clock, explicitUserAction: true });
  return freeze({
    schema: EON_LOCAL_AGENT_THEATRE_BRIDGE_SCHEMA,
    ok: result.ok === true,
    reason: result.reason,
    jobId: job.jobId,
    state: 'failed',
    failureCode: cleanCode(failureCode, 'local-request-failed'),
    networkRequestCreated: false,
    inferenceAuthority: false
  });
}

export default freeze({
  EON_LOCAL_AGENT_THEATRE_BRIDGE_SCHEMA,
  beginEonLocalAgentTheatreJob,
  completeEonLocalAgentTheatreJob,
  failEonLocalAgentTheatreJob
});
