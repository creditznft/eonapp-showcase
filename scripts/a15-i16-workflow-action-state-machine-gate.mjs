import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createEonWorkflowAction,
  createNeutralCoreOutcome,
  getEonWorkflowLaunchTruth,
  prepareEonWorkflowReviewAction,
  transitionEonWorkflowAction
} from '../assets/js/contracts/workflow/eon-workflow-action-state-machine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I16_WORKFLOW_ACTION_STATE_MACHINE_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];

const truth = getEonWorkflowLaunchTruth();
if (truth.launchMode !== 'plan-simulate-review' || truth.localApprovalCreatesExternalAuthority || truth.backgroundExecutionEnabled || truth.certifiedExecutorEnabled) errors.push('Launch workflow truth is not Plan/Simulate/Review-only.');

const draft = createEonWorkflowAction({ actionId: 'workflowaction_i16_gate', workflowId: 'flow_i16_gate', actionType: 'gate-review', risk: 'submit' }, { now: 100 });
const review = prepareEonWorkflowReviewAction(draft, { now: 101 });
const noExplicit = transitionEonWorkflowAction(review.action, 'approved', { now: 102 });
const approved = transitionEonWorkflowAction(review.action, 'approved', { explicitUserAction: true, now: 103 });
const queueBlocked = transitionEonWorkflowAction(approved.action, 'queued', { now: 104 });
if (!review.ok || review.action.state !== 'reviewed' || noExplicit.reason !== 'explicit-user-approval-required' || !approved.ok || approved.action.externalExecutionAuthority || approved.action.externalEffectCreated || queueBlocked.reason !== 'certified-executor-receipt-required') errors.push('Canonical workflow transitions do not fail closed.');
if (createNeutralCoreOutcome(approved.action).reason !== 'verified-action-required') errors.push('Unverified local approval can create a Core outcome.');

const sources = {
  store: read('assets/js/utils/automation-os-store.js'),
  engine: read('assets/js/utils/automation-workflow-engine.js'),
  proposals: read('assets/js/chat/eonbot-action-proposals.js'),
  page: read('assets/js/eon-automations-page.js'),
  gateway: read('assets/js/action-gateway/eon-action-gateway-contract.js'),
  cards: read('assets/js/chat/eonbot-action-cards.js')
};
for (const [id, source] of Object.entries({ store: sources.store, engine: sources.engine, proposals: sources.proposals })) if (!/eon-workflow-action-state-machine\.js|getEonWorkflowLaunchTruth/.test(source)) errors.push(`${id} does not consume the canonical workflow authority.`);
if (!/explicitUserAction: true/.test(sources.page) || !/No provider action was sent/.test(sources.page)) errors.push('Automation approval surface does not preserve explicit local-only review.');
if (!/EON_ACTION_GATEWAY_ROLLOUT = 'disabled'/.test(sources.gateway) || !/browserCanExecuteExternalAction: false/.test(sources.gateway)) errors.push('Action Gateway is not fail-closed.');
if (!/local approval does not trigger an external action or durable job/i.test(sources.cards)) errors.push('EONBOT action-card truth overstates local approval.');

const core = {
  schema: 'eonapp.a15.i16.workflow-action-state-machine-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I16',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  simulation: {
    reviewedState: review.action?.state || '',
    approvalRequiresExplicitUserAction: noExplicit.reason === 'explicit-user-approval-required',
    approvedLocalOnly: approved.action?.localApprovalOnly === true,
    approvedExternalExecutionAuthority: approved.action?.externalExecutionAuthority === true,
    queueWithoutCertifiedExecutor: queueBlocked.reason
  },
  sourceFiles: [
    'assets/js/contracts/workflow/eon-workflow-action-state-machine.js',
    'assets/js/utils/automation-os-store.js',
    'assets/js/utils/automation-workflow-engine.js',
    'assets/js/chat/eonbot-action-proposals.js',
    'assets/js/eon-automations-page.js',
    'tests/unit/a15-i16-workflow-action-state-machine.test.mjs'
  ],
  claims: { backgroundExecutionCertified: false, connectorExecutionCertified: false, externalEffectCreated: false, previewDeployed: false, productionDeployed: false },
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I16] ${receipt.status.toUpperCase()}: one workflow/action/review state machine; launch remains Plan, Simulate and Review.`);
if (errors.length) { for (const error of errors) console.error(`[A15 I16] ${error}`); process.exitCode = 1; }
