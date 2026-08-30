import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonbotJobFabric, getEonbotJobFabricTruth } from '../../assets/js/chat/eonbot-job-fabric.js';
import { inspectW435EonbotJobFabric } from '../../scripts/w435-eonbot-job-fabric-gate.mjs';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; }
  };
}

function fabric() {
  return createEonbotJobFabric({
    storage: memoryStorage(),
    now: () => Date.parse('2026-06-29T12:00:00.000Z'),
    capabilitySettings: { provider: 'guide' }
  });
}

const HASH_A = 'sha256:abcdefghijklmnopqrstuvwxyz_1234567890';
const HASH_B = 'sha256:zyxwvutsrqponmlkjihgfedcba_0987654321';

test('W435 routes intent without retaining prompt text and requires a deliberate answer record', () => {
  const instance = fabric();
  const missing = instance.createAnswer({ intentText: 'Build a private new website' });
  assert.equal(missing.error, 'explicit-user-action-required');
  const created = instance.createAnswer({ intentText: 'Build a private new website', safeLabel: 'Website plan' }, { explicitUserAction: true });
  assert.equal(created.ok, true);
  assert.equal(created.job.state, 'answer');
  assert.equal(created.route.surfaceId, 'forge');
  assert.equal(JSON.stringify(instance.getSnapshot()).includes('Build a private new website'), false);
  assert.equal(created.job.rawPromptVisible, false);
});

test('W435 enforces answer → draft → review → approval → completed with evidence receipts', () => {
  const instance = fabric();
  const created = instance.createAnswer({ intentText: 'Create a campaign concept', safeLabel: 'Campaign concept' }, { explicitUserAction: true });
  const jobId = created.job.jobId;
  assert.equal(instance.createDraftFromAnswer(jobId).error, 'explicit-user-action-required');
  assert.equal(instance.createDraftFromAnswer(jobId, { explicitUserAction: true }).job.state, 'draft');
  assert.equal(instance.markReadyForReview(jobId, { explicitUserAction: true }).error, 'local-draft-hash-required');
  const ready = instance.markReadyForReview(jobId, { explicitUserAction: true, localDraftHash: HASH_A });
  assert.equal(ready.job.state, 'ready-for-review');
  assert.equal(ready.job.hasDraftEvidence, true);
  assert.equal(instance.requestApproval(jobId, { explicitUserAction: true }).error, 'explicit-user-approval-required');
  assert.equal(instance.requestApproval(jobId, { explicitUserAction: true, explicitUserApproval: true }).job.state, 'awaiting-approval');
  assert.equal(instance.completeLocalReview(jobId, { explicitUserAction: true }).error, 'local-result-receipt-hash-required');
  const complete = instance.completeLocalReview(jobId, { explicitUserAction: true, localResultReceiptHash: HASH_B });
  assert.equal(complete.job.state, 'completed');
  assert.equal(complete.job.hasReceipt, true);
  assert.equal(complete.externalActionStarted, false);
});

test('W435 keeps failure, cancellation and retry local and reviewable', () => {
  const instance = fabric();
  const created = instance.createAnswer({ intentText: 'Research two options', safeLabel: 'Option research' }, { explicitUserAction: true });
  const jobId = created.job.jobId;
  instance.createDraftFromAnswer(jobId, { explicitUserAction: true });
  assert.equal(instance.fail(jobId, { explicitUserAction: true }).error, 'safe-failure-code-required');
  const failed = instance.fail(jobId, { explicitUserAction: true, safeFailureCode: 'local-review-interrupted' });
  assert.equal(failed.job.state, 'failed');
  const retried = instance.retry(jobId, { explicitUserAction: true });
  assert.equal(retried.job.state, 'draft');
  assert.equal(retried.job.attempts, 2);
  const cancelled = instance.cancel(jobId, { explicitUserAction: true });
  assert.equal(cancelled.job.state, 'cancelled');
  assert.equal(cancelled.networkRequestCreated, false);
});

test('W435 gate and truth prevent agent or NPC release claims', () => {
  const gate = inspectW435EonbotJobFabric();
  const truth = getEonbotJobFabricTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 9);
  assert.equal(truth.externalExecution, false);
  assert.equal(truth.providerRequestCreated, false);
  assert.equal(truth.liveAgentOrNpcClaim, false);
  assert.equal(truth.productionExecutionProof, false);
});
