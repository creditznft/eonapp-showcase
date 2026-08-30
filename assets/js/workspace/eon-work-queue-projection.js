/**
 * RT92 unified EONBOT Work Queue projection.
 *
 * READ-ONLY BY DESIGN:
 * - projects remain in the existing Projects store;
 * - local EONBOT work remains in the existing EONBOT job fabric;
 * - workflow schedules/approvals/history remain in Automation OS;
 * - this module creates no storage key, queue database, runner or authority.
 *
 * A saved schedule is not evidence that a durable/background runner exists.
 * This projection deliberately labels that boundary instead of overstating it.
 */

export const EON_WORK_QUEUE_SCHEMA = 'eonapp.work-queue-projection.rt92.v1';
export const EON_WORK_QUEUE_BUCKETS = Object.freeze([
  'WORKING',
  'WAITING_FOR_YOU',
  'SCHEDULED',
  'COMPLETED',
  'FAILED_NEEDS_ATTENTION'
]);

const freeze = (value) => Object.freeze(value);
const MAX_ITEMS_PER_BUCKET = 48;

function text(value = '', fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim().slice(0, 220);
}

function iso(value = '') {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : '';
}

function item(record = {}) {
  return freeze({
    id: text(record.id, 'work-item'),
    source: text(record.source, 'local'),
    kind: text(record.kind, 'work'),
    state: text(record.state, 'unknown'),
    label: text(record.label, 'Local work'),
    detail: text(record.detail),
    route: text(record.route),
    at: iso(record.at),
    localOnly: record.localOnly !== false,
    durableExecutionVerified: record.durableExecutionVerified === true,
    externalEffectVerified: record.externalEffectVerified === true,
    needsUserAction: record.needsUserAction === true,
    executionTruth: text(record.executionTruth, 'local-record-only')
  });
}

function sortRecent(items = []) {
  return [...items].sort((left, right) => {
    const rightAt = Date.parse(right.at || '') || 0;
    const leftAt = Date.parse(left.at || '') || 0;
    return rightAt - leftAt;
  }).slice(0, MAX_ITEMS_PER_BUCKET);
}

function bucketForJobState(state = '') {
  if (state === 'answer' || state === 'draft') return 'WORKING';
  if (state === 'ready-for-review' || state === 'awaiting-approval') return 'WAITING_FOR_YOU';
  if (state === 'completed' || state === 'cancelled') return 'COMPLETED';
  if (state === 'failed') return 'FAILED_NEEDS_ATTENTION';
  return '';
}

function auditBucket(status = '') {
  const value = String(status || '').trim().toLowerCase();
  if (['started', 'running', 'in-progress', 'in_progress', 'working'].includes(value)) return 'WORKING';
  if (['failed', 'error', 'errored', 'blocked'].includes(value)) return 'FAILED_NEEDS_ATTENTION';
  if (['ok', 'success', 'succeeded', 'complete', 'completed', 'done'].includes(value)) return 'COMPLETED';
  return '';
}

function workflowNameMap(automationState = {}) {
  return new Map((Array.isArray(automationState?.workflows) ? automationState.workflows : [])
    .map((workflow) => [String(workflow?.id || ''), text(workflow?.name, 'Workflow')])
    .filter(([id]) => id));
}

function scheduleTruth(schedule = {}, preferences = {}) {
  const runner = String(schedule?.runner || 'browser');
  if (runner === 'local-runner') {
    return preferences?.localRunnerEnabled === true
      ? 'saved-local-runner-schedule; durable/background execution not certified here'
      : 'saved-local-runner-schedule; local runner currently disabled';
  }
  if (runner === 'cloud-scheduler') {
    return preferences?.cloudSchedulerEnabled === true
      ? 'saved-cloud-scheduler-record; durable server execution not certified here'
      : 'saved-cloud-scheduler-record; cloud scheduler currently disabled';
  }
  return 'saved-browser-schedule; requires an active browser/user flow and is not durable background execution';
}

/**
 * Pure projection over already-existing state objects. It performs no reads,
 * writes, network requests, scheduling or job execution.
 */
export function projectEonWorkQueue({ jobState = {}, automationState = {}, now = Date.now() } = {}) {
  const queues = Object.fromEntries(EON_WORK_QUEUE_BUCKETS.map((bucket) => [bucket, []]));
  const clock = Number(now) || Date.now();

  for (const job of Array.isArray(jobState?.jobs) ? jobState.jobs : []) {
    const bucket = bucketForJobState(String(job?.state || ''));
    if (!bucket) continue;
    const waiting = bucket === 'WAITING_FOR_YOU';
    queues[bucket].push(item({
      id: job?.jobId,
      source: 'eonbot-job-fabric',
      kind: 'eonbot-job',
      state: job?.state,
      label: job?.safeLabel,
      detail: waiting ? 'Review or approval is required before this local work can continue.' : job?.failureCode || '',
      route: job?.route,
      at: job?.updatedAt || job?.createdAt,
      localOnly: job?.localOnly !== false,
      durableExecutionVerified: false,
      externalEffectVerified: job?.externalEffect === true,
      needsUserAction: waiting,
      executionTruth: job?.foregroundOnly === false
        ? 'job-record; background authority is not certified by this projection'
        : 'local foreground EONBOT job record; no background-after-close authority'
    }));
  }

  const names = workflowNameMap(automationState);
  const preferences = automationState?.preferences && typeof automationState.preferences === 'object' ? automationState.preferences : {};

  for (const approval of Array.isArray(automationState?.approvals) ? automationState.approvals : []) {
    if (String(approval?.status || '') !== 'pending') continue;
    const workflowName = names.get(String(approval?.workflowId || '')) || 'Workflow';
    queues.WAITING_FOR_YOU.push(item({
      id: approval?.id,
      source: 'automation-os',
      kind: 'approval',
      state: 'pending',
      label: approval?.title || `${workflowName} approval`,
      detail: approval?.summary || `${workflowName} has a prepared action waiting for your review.`,
      route: '/automations',
      at: approval?.createdAt,
      localOnly: approval?.localApprovalOnly !== false,
      durableExecutionVerified: false,
      externalEffectVerified: approval?.externalEffectCreated === true,
      needsUserAction: true,
      executionTruth: 'prepared approval record; approval does not itself prove an external action ran'
    }));
  }

  for (const schedule of Array.isArray(automationState?.schedules) ? automationState.schedules : []) {
    if (schedule?.enabled !== true) continue;
    const workflowName = names.get(String(schedule?.workflowId || '')) || 'Workflow';
    const nextAt = iso(schedule?.nextRunAt);
    queues.SCHEDULED.push(item({
      id: schedule?.id,
      source: 'automation-os',
      kind: 'schedule',
      state: 'scheduled',
      label: schedule?.label || `${workflowName} schedule`,
      detail: `${workflowName} · ${text(schedule?.cadence, 'manual')} · ${text(schedule?.runner, 'browser')}`,
      route: '/automations',
      at: nextAt || schedule?.updatedAt || schedule?.createdAt || new Date(clock).toISOString(),
      localOnly: schedule?.runner !== 'cloud-scheduler',
      durableExecutionVerified: false,
      externalEffectVerified: false,
      needsUserAction: false,
      executionTruth: scheduleTruth(schedule, preferences)
    }));
  }

  for (const audit of Array.isArray(automationState?.audit) ? automationState.audit : []) {
    const bucket = auditBucket(audit?.status);
    if (!bucket) continue;
    const workflowName = names.get(String(audit?.workflowId || '')) || 'Workflow';
    queues[bucket].push(item({
      id: audit?.id,
      source: 'automation-os',
      kind: 'execution-history',
      state: audit?.status,
      label: workflowName,
      detail: audit?.message || audit?.type || 'Automation history record',
      route: '/automations',
      at: audit?.at,
      localOnly: true,
      durableExecutionVerified: false,
      externalEffectVerified: false,
      needsUserAction: bucket === 'FAILED_NEEDS_ATTENTION',
      executionTruth: 'automation audit/history record; it is not independent proof of a durable external runner'
    }));
  }

  const buckets = {};
  let total = 0;
  for (const bucket of EON_WORK_QUEUE_BUCKETS) {
    const entries = freeze(sortRecent(queues[bucket]));
    buckets[bucket] = freeze({ id: bucket, count: entries.length, items: entries });
    total += entries.length;
  }

  return freeze({
    schema: EON_WORK_QUEUE_SCHEMA,
    generatedAt: new Date(clock).toISOString(),
    total,
    buckets: freeze(buckets),
    sources: freeze(['eonbot-job-fabric', 'automation-os']),
    createsStorage: false,
    mutatesSourceState: false,
    networkRequestCreated: false,
    externalActionStarted: false,
    durableRuntimeClaimed: false,
    projectTasksIncluded: false,
    truthNote: 'This is a read-only view of local EONBOT work, prepared approvals, saved schedules and automation history. Saved schedules are not proof of durable background execution.'
  });
}

export function validateEonWorkQueueProjection() {
  const errors = [];
  const sample = projectEonWorkQueue({
    now: Date.parse('2026-08-17T05:00:00Z'),
    jobState: { jobs: [
      { jobId: 'eonjob_sample1234', state: 'draft', safeLabel: 'Draft website plan', route: '/forge', updatedAt: '2026-08-17T04:00:00Z', localOnly: true, foregroundOnly: true },
      { jobId: 'eonjob_sample5678', state: 'awaiting-approval', safeLabel: 'Review release', route: '/forge', updatedAt: '2026-08-17T04:10:00Z', localOnly: true, foregroundOnly: true }
    ] },
    automationState: {
      workflows: [{ id: 'flow-1', name: 'Weekly brief' }],
      approvals: [{ id: 'approval-1', workflowId: 'flow-1', title: 'Approve brief', status: 'pending', createdAt: '2026-08-17T04:20:00Z', localApprovalOnly: true }],
      schedules: [{ id: 'schedule-1', workflowId: 'flow-1', label: 'Weekly brief', cadence: 'weekly', runner: 'browser', enabled: true, nextRunAt: '2026-08-18T04:00:00Z' }],
      audit: [{ id: 'audit-1', workflowId: 'flow-1', status: 'failed', message: 'Needs review', at: '2026-08-17T04:30:00Z' }],
      preferences: {}
    }
  });
  if (sample.buckets.WORKING.count !== 1) errors.push('Draft EONBOT job must appear in WORKING.');
  if (sample.buckets.WAITING_FOR_YOU.count !== 2) errors.push('Review job and pending automation approval must appear in WAITING_FOR_YOU.');
  if (sample.buckets.SCHEDULED.count !== 1) errors.push('Enabled saved schedule must appear in SCHEDULED.');
  if (sample.buckets.FAILED_NEEDS_ATTENTION.count !== 1) errors.push('Failed automation history must appear in FAILED_NEEDS_ATTENTION.');
  if (sample.createsStorage || sample.networkRequestCreated || sample.externalActionStarted || sample.durableRuntimeClaimed) errors.push('Projection must remain read-only and must not claim a durable runtime.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_WORK_QUEUE_SCHEMA });
}

export default freeze({
  EON_WORK_QUEUE_SCHEMA,
  EON_WORK_QUEUE_BUCKETS,
  projectEonWorkQueue,
  validateEonWorkQueueProjection
});
