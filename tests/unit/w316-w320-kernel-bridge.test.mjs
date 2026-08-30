import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { beginEonKernelForegroundTask, completeEonKernelForegroundTask, createEonKernelMissionDraft, failEonKernelForegroundTask, getEonKernelBridgeTruth } from '../../assets/js/ai-kernel/eon-ai-kernel-bridge.js';
import { listEonKernelForegroundReviewItems } from '../../assets/js/ai-kernel/eon-ai-kernel-review-inbox.js';
import { readEonKernelForegroundSession, getEonKernelSessionTruth } from '../../assets/js/ai-kernel/eon-ai-kernel-session-store.js';
import { getEonKernelRoleProfile, roleCanRequestExternalEffect, classifyEonKernelIntent } from '../../assets/js/ai-kernel/eon-role-profiles.js';
import { createGuidedWorkflowBlueprint, getGuidedWorkflowTruth } from '../../assets/js/ai-kernel/eon-guided-workflow-blueprints.js';
import { listAgentPresence } from '../../assets/js/operator/agent-presence.js';
import { runW316W320KernelBridgeGate } from '../../scripts/w316-w320-kernel-bridge-gate.mjs';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}

const cryptoApi = webcrypto;
const now = 1_770_100_000_000;

test('W316 creates a foreground task and stores no input or output in the session record', async () => {
  const sessionStorage = memoryStorage();
  const cityStorage = memoryStorage();
  const privateInput = 'Draft a private campaign with the phrase NEVER_PERSIST_THIS_INPUT';
  const context = beginEonKernelForegroundTask({ intentText: privateInput, now }, { cryptoApi, sessionStorage, cityStorage });
  assert.equal(context.task.foregroundOnly, true);
  assert.equal(context.task.rawPromptStored, false);
  const complete = await completeEonKernelForegroundTask(context, { output: 'NEVER_PERSIST_THIS_OUTPUT', provenance: 'guide', truthLabel: 'drafted', requiresReview: true, now: now + 1, cryptoApi, sessionStorage, cityStorage });
  assert.equal(complete.ok, true);
  const raw = sessionStorage.getItem('eon:ai-kernel:foreground-session:v1');
  assert.doesNotMatch(raw, /NEVER_PERSIST_THIS_(INPUT|OUTPUT)/);
  assert.match(raw, /eontask_/);
  assert.equal(readEonKernelForegroundSession({ storage: sessionStorage }).records.length, 1);
});

test('W317–W319 role profiles and guided workflows cannot publish, schedule, deploy or continue after close', () => {
  const profile = getEonKernelRoleProfile('writer');
  assert.equal(profile.cityRole, 'researcher');
  assert.equal(roleCanRequestExternalEffect('writer', 'publish').allowed, false);
  const classification = classifyEonKernelIntent('Upload this to YouTube and schedule it');
  assert.equal(classification.role, 'reviewer');
  const workflow = createGuidedWorkflowBlueprint({ taskId: 'eontask_abcdefghijklmnop', taskClass: 'content', role: 'writer', now });
  assert.equal(workflow.backgroundAfterClose, false);
  assert.equal(workflow.resumeRequiresUserAction, true);
  assert.ok(workflow.steps.every((step) => step.externalEffect === false));
});

test('W318 merges a redacted kernel review with existing action cards without granting approval power', async () => {
  const sessionStorage = memoryStorage();
  const context = beginEonKernelForegroundTask({ intentText: 'Prepare a content brief', now }, { cryptoApi, sessionStorage, cityStorage: memoryStorage() });
  await completeEonKernelForegroundTask(context, { output: 'brief only', requiresReview: true, now: now + 2, cryptoApi, sessionStorage, cityStorage: memoryStorage() });
  const items = listEonKernelForegroundReviewItems({ storage: sessionStorage, legacyCards: [{ id: 'eoncard_demo', title: 'Legacy safe card', summary: 'Local preview', route: '/workspace' }] });
  assert.equal(items.length, 2);
  assert.ok(items.every((item) => item.externalEffect === false && item.canApproveExternalEffect === false));
});

test('W320 City receives only a redacted lifecycle cue and the failure path remains local', () => {
  const sessionStorage = memoryStorage();
  const cityStorage = memoryStorage();
  const context = beginEonKernelForegroundTask({ intentText: 'Build a local app', now }, { cryptoApi, sessionStorage, cityStorage });
  const failed = failEonKernelForegroundTask(context, { now: now + 5, sessionStorage, cityStorage });
  assert.equal(failed.ok, true);
  const entries = listAgentPresence({ storage: cityStorage });
  assert.equal(entries.length, 1);
  const entry = entries[0];
  assert.equal(entry.localOnly, true);
  assert.equal(entry.externalEffect, false);
  assert.equal(entry.status, 'failed');
  assert.equal('prompt' in entry, false);
  assert.equal('model' in entry, false);
  assert.equal('token' in entry, false);
});

test('W316–W320 source gate and truth remain foreground-only', () => {
  assert.equal(getEonKernelBridgeTruth().externalExecution, false);
  assert.equal(getEonKernelSessionTruth().storage, 'session-only-redacted');
  assert.equal(getGuidedWorkflowTruth().providerCall, false);
  const report = runW316W320KernelBridgeGate();
  assert.equal(report.ok, true, report.errors.join('\n'));
});
