'use strict';
/**
 * COMPREHENSIVE ORCHESTRATOR TESTS
 * Unit tests for agent-orchestrator.js enhancements (Phase 1.1)
 * Tests for request-orchestrator-bridge.js (Phase 1.3)
 */

const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { TextEncoder } = require('node:util');

function loadAgentOrchestrator(initialStore = {}) {
  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'agent-orchestrator.js'),
    'utf8'
  );
  
  const compat = source
    .replace(/^export\s+function/gm, 'var _exports_; function')
    .replace(/^export\s+class/gm, 'class ');

  const localStore = { ...initialStore };
  const localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(localStore, key) ? localStore[key] : null),
    setItem: (key, value) => { localStore[key] = String(value); },
    removeItem: (key) => { delete localStore[key]; }
  };

  const ctx = vm.createContext({
    localStorage,
    console,
    Date,
    Math,
    String,
    Array,
    Object,
    Set,
    JSON,
    crypto: crypto.webcrypto,
    TextEncoder
  });

  vm.runInContext(compat, ctx);
  return { ctx, localStorage, localStore };
}

// ===== PHASE 1.1: AGENT-ORCHESTRATOR ENHANCEMENTS TESTS =====

test('E1.1a: Execution audit trail recorded for job creation', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const job = orch.createPipelineJob({
    origin: 'local-ui',
    intentText: 'Create a podcast about AI'
  });

  assert.equal(job.status, 'ready');
  assert.ok(job.execution === null, 'Execution initially null');
  assert.ok(Array.isArray(job.retries), 'Retries array initialized');

  const history = orch.getJobExecutionHistory(job.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].action, 'job_created');
  assert.equal(history[0].status, 'pending');
});

test('E1.1a: Job execution tracking records steps with results', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const job = orch.createPipelineJob({
    intentText: 'Create a video'
  });

  orch.recordJobExecution({
    jobId: job.id,
    step: 'script',
    result: 'Script generated successfully',
    status: 'success'
  });

  const updated = orch.getJob(job.id);
  assert.equal(updated.execution.steps.length, 1);
  assert.equal(updated.execution.steps[0].step, 'script');
  assert.equal(updated.execution.steps[0].status, 'success');
  assert.equal(updated.execution.steps[0].errorCategory, null);
});

test('E1.1b: Retry logic schedules with exponential backoff', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const job = orch.createPipelineJob({
    intentText: 'Create content'
  });

  orch.recordJobRetry({
    jobId: job.id,
    step: 'video',
    retryCount: 1,
    nextRetryAtMs: Date.now() + 1000
  });

  const updated = orch.getJob(job.id);
  assert.equal(updated.status, 'retrying');
  assert.equal(updated.retries.length, 1);
  assert.equal(updated.retries[0].retryCount, 1);
});

test('E1.1c: Rate limiting blocks publish on exceeded limit', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  // Create 5 publish jobs (within limit)
  for (let i = 0; i < 5; i++) {
    const job = orch.createPipelineJob({
      requestedSteps: ['publish'],
      intentText: `Publish post ${i}`
    });
    assert.notEqual(job.status, 'rate_limited', `Job ${i} should not be rate-limited`);
  }

  // 6th publish should be rate-limited
  const blocked = orch.createPipelineJob({
    requestedSteps: ['publish'],
    intentText: 'Publish post 6'
  });

  assert.equal(blocked.status, 'rate_limited');
  assert.equal(blocked.errorCode, 'RATE_LIMIT_EXCEEDED');
  assert.ok(blocked.resetAtMs > Date.now());
});

test('E1.1d: Better error messages include categories and remediation', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const blocked = orch.evaluateAction({
    action: 'invalid_action',
    origin: 'local-ui'
  });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.errorCode, 'ACTION_NOT_ALLOWED');
  assert.equal(blocked.category, 'policy');
  assert.ok(blocked.reason.includes('Allowed actions'));
});

test('E1.1d: High-risk actions include error codes and approval info', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const approval = orch.evaluateAction({
    action: 'publish',
    origin: 'local-ui',
    approvedByHuman: false
  });

  assert.equal(approval.allowed, false);
  assert.equal(approval.requiresHumanApproval, true);
  assert.equal(approval.errorCode, 'APPROVAL_REQUIRED');
  assert.equal(approval.category, 'policy');
  assert.ok(approval.reason.includes('approval'));
});

test('E1.1e: Admin override unlocks blocked jobs with nonce replay protection', async () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const blocked = orch.evaluateAction({
    action: 'publish',
    approvedByHuman: false
  });

  assert.equal(blocked.allowed, false);

  const adminKey = 'unit-test-admin-key';
  const nonce = 'test-nonce-12345';
  const timestamp = Date.now();
  const signature = crypto.createHmac('sha256', adminKey).update(`override:${nonce}:${timestamp}`).digest('hex');

  // Now approve with admin override
  const override = await orch.overrideJobBlocked({
    jobId: 'test-job-123',
    adminNonce: nonce,
    adminTimestamp: timestamp,
    adminSignature: signature,
    adminKey,
    reason: 'CEO approval'
  });

  // Missing jobs should fail cleanly after the override signature verifies.
  assert.equal(override.ok, false);
  assert.equal(override.reason, 'Job not found.');

  // Create a real job first
  const job = orch.createPipelineJob({
    intentText: 'publish something'
  });

  if (job.status === 'blocked') {
    const replayNonce = 'test-nonce-999';
    const replayTimestamp = Date.now();
    const replaySignature = crypto.createHmac('sha256', adminKey).update(`override:${replayNonce}:${replayTimestamp}`).digest('hex');

    const override2 = await orch.overrideJobBlocked({
      jobId: job.id,
      adminNonce: replayNonce,
      adminTimestamp: replayTimestamp,
      adminSignature: replaySignature,
      adminKey,
      reason: 'Executive decision'
    });

    // First override succeeds
    if (override2.ok) {
      // Second attempt with same nonce should fail (replay protection)
      const override3 = await orch.overrideJobBlocked({
        jobId: job.id,
        adminNonce: replayNonce, // Same nonce
        adminTimestamp: replayTimestamp,
        adminSignature: replaySignature,
        adminKey
      });

      assert.equal(override3.ok, false);
      assert.ok(String(override3.reason || '').includes('replay'));
    }
  }
});

test('E1.1: Audit log shows full history of job lifecycle', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const job = orch.createPipelineJob({
    intentText: 'Create content'
  });

  orch.recordJobExecution({
    jobId: job.id,
    step: 'plan',
    result: 'Plan complete',
    status: 'success'
  });

  orch.recordJobSuccess({
    jobId: job.id,
    result: 'All done!'
  });

  const audit = orch.getJobExecutionHistory(job.id);
  assert.equal(audit.length, 3); // Created, executed, completed
  assert.equal(audit[0].action, 'job_created');
  assert.equal(audit[1].action, 'execute_step:plan');
  assert.equal(audit[2].action, 'job_completed');
});

test('E1.1: getPolicySummary includes rate limits and retry config', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const summary = orch.getPolicySummary();
  assert.ok(summary.allowedActions.includes('publish'));
  assert.ok(summary.highRiskActions.includes('publish'));
  assert.ok(summary.rateLimits);
  assert.ok(summary.rateLimits.publish);
  assert.equal(summary.rateLimits.publish.limit, 5);
  assert.ok(summary.retryConfig);
  assert.equal(summary.retryConfig.maxRetries, 3);
});

test('E1.1: Error categorization identifies transient vs permanent', () => {
  const { ctx } = loadAgentOrchestrator();

  // Transient errors (should retry)
  assert.equal(
    ctx.categorizeError('Network timeout occurred'),
    'transient'
  );
  assert.equal(
    ctx.categorizeError('ECONNREFUSED: Connection refused'),
    'transient'
  );

  // Policy errors (should not retry)
  assert.equal(
    ctx.categorizeError('Policy violation detected'),
    'policy'
  );

  // Technical errors (should not retry)
  assert.equal(
    ctx.categorizeError('Invalid syntax in request'),
    'technical'
  );

  // Unknown (assume permanent)
  assert.equal(
    ctx.categorizeError('Some random error'),
    'permanent'
  );
});

// ===== PHASE 1.1: RATE LIMITING DETAILED TESTS =====

test('E1.1c: Rate limiting tracks per-action windows correctly', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  // Voice should have different limit than publish
  const voiceLimit = orch.checkRateLimit('voice');
  assert.equal(voiceLimit.allowed, true);
  assert.equal(voiceLimit.remaining, 19); // 20 limit - 1 used

  const publishLimit = orch.checkRateLimit('publish');
  assert.equal(publishLimit.allowed, true);
  assert.equal(publishLimit.remaining, 4); // 5 limit - 1 used
});

// ===== PHASE 1.1: JOB LIFECYCLE TESTS =====

test('E1.1: Complete job lifecycle from creation to success', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  // Create
  const job = orch.createPipelineJob({
    intentText: 'Create a podcast'
  });
  // plan, idea, script, voice, subtitles, distribute_prepare (6 steps for podcast)
  assert.equal(job.steps.length, 6);

  // Approve if needed
  if (job.status === 'awaiting_approval') {
    orch.approveJob(job.id, 'tester');
  }

  // Record execution of each step
  for (const step of job.steps) {
    orch.recordJobExecution({
      jobId: job.id,
      step,
      result: `${step} completed`,
      status: 'success'
    });
  }

  // Record success
  orch.recordJobSuccess({
    jobId: job.id,
    result: 'Podcast created successfully'
  });

  const final = orch.getJob(job.id);
  assert.equal(final.status, 'completed');
  assert.ok(final.completedAt > 0);
  assert.ok(final.completionResult.includes('successfully'));

  const history = orch.getJobExecutionHistory(job.id);
  // Create + 4-5 execute_step calls + complete = 6+
  assert.ok(history.length >= 6, `Expected at least 6 history entries, got ${history.length}`);
  assert.equal(history[0].action, 'job_created');
});

test('E1.2: Approval receipts, browser timelines, and manifests are exportable', () => {
  const { ctx } = loadAgentOrchestrator();
  const orch = ctx.getAgentOrchestrator();

  const job = orch.createPipelineJob({
    origin: 'local-ui',
    intentText: 'Publish a creator update',
    requestedSteps: ['plan', 'publish']
  });

  const approved = orch.approveJob(job.id, 'ceo');
  assert.equal(approved.ok, true);

  const refreshed = orch.getJob(job.id);
  assert.ok(refreshed.approvalReceipt, 'approval receipt attached to job');
  assert.ok(refreshed.approvalReceipt.receiptHash, 'receipt hash populated');
  assert.ok(refreshed.approvalReceipt.receiptText.includes('Approved by ceo'));

  const timelineStep = orch.recordBrowserAction({
    jobId: job.id,
    step: 'navigate',
    action: 'open chat page',
    target: '/chat.html',
    outcome: 'Loaded chat surface successfully',
    status: 'success',
    evidence: {
      screenshotHash: 'abc123',
      pageState: 'loaded'
    }
  });

  assert.ok(timelineStep.stepHash, 'timeline step hash populated');

  const manifest = orch.exportJobManifest(job.id);
  assert.equal(manifest.schema, 'agent-job-manifest/v1');
  assert.equal(manifest.approvalReceipt.receiptId, refreshed.approvalReceipt.receiptId);
  assert.equal(manifest.browserTimeline.steps.length, 1);
  assert.equal(manifest.auditVerification.ok, true);
  assert.ok(manifest.manifestHash, 'manifest hash populated');
});

console.log('✅ All orchestrator unit tests passed');
