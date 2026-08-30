/**
 * W439 — receipt-driven City AgentSignal bridge.
 *
 * City can display only sanitized, receipt-backed local job states from W435.
 * It never starts a provider, infers hidden work, reads prompts/results, writes
 * agent-presence storage, or claims an autonomous NPC is doing work.
 */
import { createEonbotJobFabric, EONBOT_JOB_FABRIC_SCHEMA, subscribeEonbotJobFabric } from '../chat/eonbot-job-fabric.js';

export const EON_CITY_AGENT_SIGNAL_SCHEMA = 'eon.city.agent-signal.w439.v1';
export const EON_CITY_AGENT_SIGNAL_STATES = Object.freeze(['planning', 'draft-ready', 'needs-approval', 'paused', 'completed', 'needs-attention']);
export const EON_CITY_AGENT_SIGNAL_MAX_VISIBLE = 4;

const freeze = (value) => Object.freeze(value);
const SIGNAL_PRIORITY = Object.freeze({ 'needs-approval': 0, 'draft-ready': 1, 'needs-attention': 2, planning: 3, completed: 4, paused: 5 });

function cleanText(value = '', max = 120) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function roleForTaskClass(taskClass = '') {
  const kind = String(taskClass || '').toLowerCase();
  if (['build', 'code', 'project', 'workflow', 'automation'].includes(kind)) return freeze({ role: 'builder', action: kind === 'workflow' || kind === 'automation' ? 'automation' : 'build' });
  if (['research', 'insight'].includes(kind)) return freeze({ role: 'researcher', action: 'research' });
  if (['media', 'image', 'video', 'audio', 'studio'].includes(kind)) return freeze({ role: 'builder', action: 'image' });
  if (kind === 'city') return freeze({ role: 'coordinator', action: 'signal' });
  return freeze({ role: 'coordinator', action: 'chat' });
}

function stateForJob(job = {}, eventStates = new Set()) {
  const state = String(job.state || '');
  const stateEventRecorded = eventStates.has(state);
  // A job must have a matching W435 lifecycle receipt/event. Rich output is
  // never shown; we use only the state evidence that W435 already persisted.
  if (!stateEventRecorded) return null;
  if (state === 'draft') return freeze({ id: 'planning', title: 'Planning', bubble: 'A local plan is being prepared for review.', presenceStatus: 'ready', presencePhase: 'planning', accent: '#5eead4' });
  if (state === 'ready-for-review' && job.hasDraftEvidence) return freeze({ id: 'draft-ready', title: 'Draft ready', bubble: 'A local draft is ready for your review.', presenceStatus: 'ready', presencePhase: 'review', accent: '#a5b4fc' });
  if (state === 'awaiting-approval' && job.hasDraftEvidence) return freeze({ id: 'needs-approval', title: 'Needs your approval', bubble: 'A local draft is waiting for your explicit approval.', presenceStatus: 'waiting', presencePhase: 'waiting-approval', accent: '#fbbf24' });
  if (state === 'completed' && job.hasReceipt) return freeze({ id: 'completed', title: 'Completed', bubble: 'A local review record is complete. Open the native surface to inspect it.', presenceStatus: 'complete', presencePhase: 'complete', accent: '#5eead4' });
  if (state === 'failed' && job.failureCode) return freeze({ id: 'needs-attention', title: 'Needs attention', bubble: 'A local work record needs attention. No external action ran.', presenceStatus: 'failed', presencePhase: 'failed', accent: '#fb7185' });
  if (state === 'cancelled') return freeze({ id: 'paused', title: 'Paused', bubble: 'A local work record is paused. It can only resume after a new explicit review.', presenceStatus: 'ready', presencePhase: 'guide', accent: '#94a3b8' });
  return null;
}

function eventsByJob(events = []) {
  const map = new Map();
  for (const event of Array.isArray(events) ? events : []) {
    const jobId = cleanText(event?.jobId, 120);
    const state = cleanText(event?.state, 40);
    if (!jobId || !state) continue;
    if (!map.has(jobId)) map.set(jobId, new Set());
    map.get(jobId).add(state);
  }
  return map;
}

function signalForJob(job = {}, jobEvents = new Set()) {
  const lifecycle = stateForJob(job, jobEvents);
  if (!lifecycle) return null;
  const role = roleForTaskClass(job.taskClass);
  const jobId = cleanText(job.jobId, 120);
  if (!jobId) return null;
  const route = String(job.route || '').startsWith('/') ? String(job.route) : '/';
  const signalId = `signal_${jobId.replace(/[^a-z0-9_-]/gi, '').slice(-80)}`;
  return freeze({
    schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
    signalId,
    // Kept only as a local reference for dedupe; UI and City labels never show it.
    jobReference: jobId,
    state: lifecycle.id,
    title: lifecycle.title,
    bubble: lifecycle.bubble,
    accent: lifecycle.accent,
    route,
    nativeSurface: cleanText(job.surfaceLabel || 'Chat', 80) || 'Chat',
    createdAt: cleanText(job.createdAt, 64),
    updatedAt: cleanText(job.updatedAt, 64),
    receiptVerified: true,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    providerVisible: false,
    presenceEntry: freeze({
      id: signalId,
      source: 'agent-executor',
      workRef: jobId,
      role: role.role,
      action: role.action,
      status: lifecycle.presenceStatus,
      phase: lifecycle.presencePhase,
      providerId: 'guide',
      createdAt: cleanText(job.createdAt, 64),
      updatedAt: cleanText(job.updatedAt, 64),
      localOnly: true,
      externalEffect: false
    })
  });
}

function outcomeFor(signals = []) {
  const completed = signals.find((signal) => signal.state === 'completed');
  const needsAttention = signals.find((signal) => signal.state === 'needs-attention');
  const needsApproval = signals.find((signal) => signal.state === 'needs-approval');
  const source = needsAttention || needsApproval || completed;
  if (!source) return freeze({ visible: false, localOnly: true, externalEffect: false });
  return freeze({
    visible: true,
    mode: source.state === 'needs-attention' ? 'attention' : source.state === 'needs-approval' ? 'review' : 'complete',
    title: source.title,
    bubble: source.bubble,
    accent: source.accent,
    route: source.route,
    nativeSurface: source.nativeSurface,
    localOnly: true,
    externalEffect: false,
    rawContentVisible: false
  });
}

/** Build a sanitized City projection from W435’s local snapshot. */
export function buildEonCityAgentSignalSnapshot(jobSnapshot = {}) {
  const jobs = Array.isArray(jobSnapshot?.jobs) ? jobSnapshot.jobs : [];
  const byJob = eventsByJob(jobSnapshot?.events);
  const signals = jobs.map((job) => signalForJob(job, byJob.get(String(job?.jobId || '')) || new Set())).filter(Boolean)
    .sort((left, right) => (SIGNAL_PRIORITY[left.state] ?? 99) - (SIGNAL_PRIORITY[right.state] ?? 99) || String(right.updatedAt).localeCompare(String(left.updatedAt)));
  const visible = signals.slice(0, EON_CITY_AGENT_SIGNAL_MAX_VISIBLE);
  return freeze({
    schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
    sourceSchema: EONBOT_JOB_FABRIC_SCHEMA,
    signals: freeze(signals),
    visibleSignals: freeze(visible),
    presenceEntries: freeze(visible.map((signal) => signal.presenceEntry)),
    outcome: outcomeFor(signals),
    activeCount: signals.filter((signal) => ['planning', 'draft-ready', 'needs-approval'].includes(signal.state)).length,
    completedCount: signals.filter((signal) => signal.state === 'completed').length,
    attentionCount: signals.filter((signal) => signal.state === 'needs-attention').length,
    receiptBackedOnly: true,
    localOnly: true,
    externalEffect: false,
    writesAgentPresenceStore: false,
    rawPromptVisible: false,
    rawOutputVisible: false,
    credentialVisible: false,
    npcAutonomyClaimed: false
  });
}

export function getEonCityAgentSignalSnapshot({ storage = null } = {}) {
  return buildEonCityAgentSignalSnapshot(createEonbotJobFabric({ storage }).getSnapshot());
}

/** Recomputes from the local W435 event only; no polling/network is used. */
export function subscribeEonCityAgentSignals(listener, { storage = null } = {}) {
  if (typeof listener !== 'function') return () => {};
  const emit = (snapshot = null) => {
    const source = snapshot && snapshot.schema === EONBOT_JOB_FABRIC_SCHEMA ? snapshot : createEonbotJobFabric({ storage }).getSnapshot();
    try { listener(buildEonCityAgentSignalSnapshot(source)); } catch {}
  };
  emit();
  return subscribeEonbotJobFabric((snapshot) => emit(snapshot));
}

export function getEonCityAgentSignalTruth() {
  return freeze({
    schema: EON_CITY_AGENT_SIGNAL_SCHEMA,
    source: 'W435-local-job-receipts',
    receiptBackedOnly: true,
    localOnly: true,
    providerExecutionStarted: false,
    externalActionStarted: false,
    backgroundAgentStarted: false,
    npcAutonomyClaimed: false,
    promptVisible: false,
    outputVisible: false,
    credentialVisible: false,
    providerIdentityVisible: false,
    productionAgentSignalProof: false
  });
}
