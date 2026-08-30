import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_WORK_QUEUE_BUCKETS,
  projectEonWorkQueue,
  validateEonWorkQueueProjection
} from '../../assets/js/workspace/eon-work-queue-projection.js';

const NOW = Date.parse('2026-08-17T05:00:00Z');

function sampleJob(id, state, at, extra = {}) {
  return {
    jobId: id,
    state,
    safeLabel: extra.safeLabel || state,
    route: extra.route || '/',
    updatedAt: at,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    ...extra
  };
}

test('RT92 Work Queue projection validates its read-only truth boundary', () => {
  const report = validateEonWorkQueueProjection();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.deepEqual(EON_WORK_QUEUE_BUCKETS, ['WORKING', 'WAITING_FOR_YOU', 'SCHEDULED', 'COMPLETED', 'FAILED_NEEDS_ATTENTION']);
});

test('RT92 Work Queue projects existing EONBOT lifecycle without creating another job store', () => {
  const queue = projectEonWorkQueue({
    now: NOW,
    jobState: { jobs: [
      sampleJob('eonjob_answer0001', 'answer', '2026-08-17T01:00:00Z'),
      sampleJob('eonjob_draft00002', 'draft', '2026-08-17T02:00:00Z'),
      sampleJob('eonjob_review0003', 'ready-for-review', '2026-08-17T03:00:00Z'),
      sampleJob('eonjob_approve004', 'awaiting-approval', '2026-08-17T03:10:00Z'),
      sampleJob('eonjob_complete05', 'completed', '2026-08-17T03:20:00Z'),
      sampleJob('eonjob_failed0006', 'failed', '2026-08-17T03:30:00Z'),
      sampleJob('eonjob_cancel0007', 'cancelled', '2026-08-17T03:40:00Z')
    ] }
  });
  assert.equal(queue.buckets.WORKING.count, 2);
  assert.equal(queue.buckets.WAITING_FOR_YOU.count, 2);
  assert.equal(queue.buckets.COMPLETED.count, 2);
  assert.equal(queue.buckets.FAILED_NEEDS_ATTENTION.count, 1);
  assert.equal(queue.createsStorage, false);
  assert.equal(queue.mutatesSourceState, false);
  assert.equal(queue.projectTasksIncluded, false);
  assert.deepEqual(queue.sources, ['eonbot-job-fabric', 'automation-os']);
});

test('RT92 Work Queue projects Automation OS approvals schedules and audit without claiming durable execution', () => {
  const automationState = {
    workflows: [{ id: 'flow-1', name: 'Executive brief' }],
    approvals: [
      { id: 'approval-pending', workflowId: 'flow-1', title: 'Approve executive brief', status: 'pending', createdAt: '2026-08-17T03:00:00Z', localApprovalOnly: true, externalEffectCreated: false },
      { id: 'approval-done', workflowId: 'flow-1', status: 'approved', createdAt: '2026-08-17T02:00:00Z' }
    ],
    schedules: [
      { id: 'schedule-browser', workflowId: 'flow-1', label: 'Weekly brief', cadence: 'weekly', runner: 'browser', enabled: true, nextRunAt: '2026-08-18T03:00:00Z' },
      { id: 'schedule-disabled', workflowId: 'flow-1', label: 'Disabled', runner: 'cloud-scheduler', enabled: false, nextRunAt: '2026-08-18T04:00:00Z' }
    ],
    audit: [
      { id: 'audit-running', workflowId: 'flow-1', status: 'running', message: 'Local simulation running', at: '2026-08-17T03:20:00Z' },
      { id: 'audit-ok', workflowId: 'flow-1', status: 'success', message: 'Simulation complete', at: '2026-08-17T03:30:00Z' },
      { id: 'audit-fail', workflowId: 'flow-1', status: 'failed', message: 'Needs attention', at: '2026-08-17T03:40:00Z' }
    ],
    preferences: { localRunnerEnabled: false, cloudSchedulerEnabled: false }
  };
  const queue = projectEonWorkQueue({ now: NOW, automationState });
  assert.equal(queue.buckets.WAITING_FOR_YOU.count, 1);
  assert.equal(queue.buckets.SCHEDULED.count, 1);
  assert.equal(queue.buckets.WORKING.count, 1);
  assert.equal(queue.buckets.COMPLETED.count, 1);
  assert.equal(queue.buckets.FAILED_NEEDS_ATTENTION.count, 1);
  assert.match(queue.buckets.SCHEDULED.items[0].executionTruth, /not durable background execution/i);
  assert.equal(queue.buckets.SCHEDULED.items[0].durableExecutionVerified, false);
  assert.equal(queue.durableRuntimeClaimed, false);
  assert.equal(queue.networkRequestCreated, false);
  assert.equal(queue.externalActionStarted, false);
});

test('RT92 Work Queue does not mutate source state', () => {
  const source = {
    jobs: [sampleJob('eonjob_stable001', 'draft', '2026-08-17T03:00:00Z')]
  };
  const automation = {
    workflows: [{ id: 'flow-1', name: 'Stable workflow' }],
    approvals: [], schedules: [], audit: [], preferences: {}
  };
  const beforeJobs = JSON.stringify(source);
  const beforeAutomation = JSON.stringify(automation);
  projectEonWorkQueue({ now: NOW, jobState: source, automationState: automation });
  assert.equal(JSON.stringify(source), beforeJobs);
  assert.equal(JSON.stringify(automation), beforeAutomation);
});
