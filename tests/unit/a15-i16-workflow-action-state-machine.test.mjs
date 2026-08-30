import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  createEonWorkflowAction,
  createNeutralCoreOutcome,
  getEonWorkflowLaunchTruth,
  prepareEonWorkflowReviewAction,
  transitionEonWorkflowAction
} from '../../assets/js/contracts/workflow/eon-workflow-action-state-machine.js';
import {
  clearAutomationState,
  loadAutomationState,
  resolveAutomationApproval
} from '../../assets/js/utils/automation-os-store.js';
import {
  createWorkflowFromTemplate,
  runWorkflowSimulation,
  savePlannedWorkflow
} from '../../assets/js/utils/automation-workflow-engine.js';
import { buildEonbotCommandHubPlan } from '../../assets/js/chat/eonbot-command-hub.js';
import { approveEonbotActionProposal, createEonbotActionProposal } from '../../assets/js/chat/eonbot-action-proposals.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

const read = (relative) => readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('A15 I16 enforces the exact draft→simulate→review→approve sequence', () => {
  const draft = createEonWorkflowAction({ actionId: 'workflowaction_i16_sequence', workflowId: 'flow_i16', stepId: 'step_i16', risk: 'submit' }, { now: 1 });
  assert.equal(draft.state, 'draft');
  assert.equal(transitionEonWorkflowAction(draft, 'approved', { explicitUserAction: true, now: 2 }).ok, false);
  const review = prepareEonWorkflowReviewAction(draft, { now: 3 });
  assert.equal(review.ok, true);
  assert.equal(review.action.state, 'reviewed');
  assert.equal(transitionEonWorkflowAction(review.action, 'approved', { now: 4 }).reason, 'explicit-user-approval-required');
  const approved = transitionEonWorkflowAction(review.action, 'approved', { explicitUserAction: true, now: 5 });
  assert.equal(approved.ok, true);
  assert.equal(approved.action.state, 'approved');
  assert.equal(approved.action.localApprovalOnly, true);
  assert.equal(approved.action.externalExecutionAuthority, false);
  assert.equal(approved.action.externalEffectCreated, false);
});

test('A15 I16 local approval cannot queue or execute without a certified server receipt', () => {
  const reviewed = prepareEonWorkflowReviewAction({ actionId: 'workflowaction_i16_queue', risk: 'sensitive' }, { now: 10 }).action;
  const approved = transitionEonWorkflowAction(reviewed, 'approved', { explicitUserAction: true, now: 11 }).action;
  assert.equal(transitionEonWorkflowAction(approved, 'queued', { now: 12 }).reason, 'certified-executor-receipt-required');
  const queued = transitionEonWorkflowAction(approved, 'queued', { now: 13, evidence: { certifiedExecutor: true, serverIssued: true, externalExecutionAuthority: true, receiptId: 'executor:receipt:1234', idempotencyKey: 'idem:i16:1234' } });
  assert.equal(queued.ok, true);
  assert.equal(queued.action.externalExecutionAuthority, true);
  assert.equal(queued.action.externalEffectCreated, false);
});

test('A15 I16 verified external outcomes require evidence and project only redacted neutral metadata', () => {
  let action = prepareEonWorkflowReviewAction({ actionId: 'workflowaction_i16_outcome', workflowId: 'flow_i16', actionType: 'document-export', risk: 'submit' }, { now: 20 }).action;
  action = transitionEonWorkflowAction(action, 'approved', { explicitUserAction: true, now: 21 }).action;
  action = transitionEonWorkflowAction(action, 'queued', { now: 22, evidence: { certifiedExecutor: true, serverIssued: true, externalExecutionAuthority: true, receiptId: 'executor:receipt:5678', idempotencyKey: 'idem:i16:5678' } }).action;
  action = transitionEonWorkflowAction(action, 'executing', { now: 23, evidence: { certifiedExecutor: true, serverIssued: true, externalExecutionAuthority: true, receiptId: 'executor:receipt:5678', idempotencyKey: 'idem:i16:5678' } }).action;
  assert.equal(transitionEonWorkflowAction(action, 'verified', { now: 24 }).reason, 'verified-outcome-receipt-required');
  action = transitionEonWorkflowAction(action, 'verified', { now: 25, evidence: { verifiedOutcome: true, receiptId: 'outcome:receipt:5678', prompt: 'must-not-survive', credential: 'must-not-survive' } }).action;
  const neutral = createNeutralCoreOutcome(action, { outcomeId: 'outcome:i16:1', cityMaySubscribe: true });
  assert.equal(neutral.ok, true);
  assert.equal(neutral.outcome.cityMaySubscribe, true);
  assert.equal(neutral.outcome.containsPrivateContent, false);
  assert.doesNotMatch(JSON.stringify(neutral.outcome), /must-not-survive|prompt|credential/i);
});

test('A15 I16 Automation simulation creates reviewed actions and approval remains local-only', async () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = new MemoryStorage();
  try {
    clearAutomationState();
    const workflow = savePlannedWorkflow(createWorkflowFromTemplate('inbox-triage'));
    const run = await runWorkflowSimulation(workflow.id);
    assert.equal(run.mode, 'simulate');
    assert.equal(run.externalEffectCreated, false);
    assert.equal(run.providerRequestCreated, false);
    const approval = loadAutomationState().approvals.find((item) => item.status === 'pending');
    assert.equal(approval.action.state, 'reviewed');
    assert.equal(approval.externalExecutionAuthority, false);
    const blocked = resolveAutomationApproval(approval.id, 'approved', 'fixture', { explicitUserAction: false, now: 30 });
    assert.equal(blocked.resolutionBlocked, true);
    const resolved = resolveAutomationApproval(approval.id, 'approved', 'reviewed locally', { explicitUserAction: true, now: 31 });
    assert.equal(resolved.status, 'approved');
    assert.equal(resolved.action.state, 'approved');
    assert.equal(resolved.externalExecutionAuthority, false);
    assert.equal(resolved.externalEffectCreated, false);
  } finally {
    if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous;
  }
});

test('A15 I16 EONBOT action approval adapts to the same local-only state machine', () => {
  const storage = new MemoryStorage();
  const plan = buildEonbotCommandHubPlan('open vault');
  const created = createEonbotActionProposal(plan.commandReceipt, { storage, now: 40, returnRoute: '/?thread=i16' });
  assert.equal(created.ok, true);
  assert.equal(created.proposal.workflowAction.state, 'reviewed');
  const approved = approveEonbotActionProposal(created.proposal.id, { storage, now: 41 });
  assert.equal(approved.ok, true);
  assert.equal(approved.proposal.workflowAction.state, 'approved');
  assert.equal(approved.proposal.localApprovalOnly, true);
  assert.equal(approved.proposal.externalExecutionAuthority, false);
  assert.equal(approved.proposal.externalEffect, false);
});

test('A15 I16 active authorities import the canonical state machine and launch remains Plan/Simulate/Review', () => {
  const store = read('assets/js/utils/automation-os-store.js');
  const engine = read('assets/js/utils/automation-workflow-engine.js');
  const proposals = read('assets/js/chat/eonbot-action-proposals.js');
  const gateway = read('assets/js/action-gateway/eon-action-gateway-contract.js');
  assert.match(store, /eon-workflow-action-state-machine\.js/);
  assert.match(engine, /getEonWorkflowLaunchTruth/);
  assert.match(proposals, /eon-workflow-action-state-machine\.js/);
  assert.match(gateway, /EON_ACTION_GATEWAY_ROLLOUT = 'disabled'/);
  assert.deepEqual(getEonWorkflowLaunchTruth(), {
    schema: 'eon.workflow-action.a15.v1', launchMode: 'plan-simulate-review',
    localApprovalCreatesExternalAuthority: false, backgroundExecutionEnabled: false,
    certifiedExecutorEnabled: false, queuedStateRequiresServerReceipt: true,
    verifiedStateRequiresOutcomeReceipt: true, cityConsumesNeutralOutcomesOnly: true
  });
});
