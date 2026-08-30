import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const store = {};
const localStorage = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
  },
  setItem(key, value) {
    store[key] = String(value);
  },
  removeItem(key) {
    delete store[key];
  },
  clear() {
    for (const key of Object.keys(store)) delete store[key];
  }
};

globalThis.window = globalThis;
globalThis.document = {
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  body: { appendChild() {} }
};
globalThis.localStorage = localStorage;
if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', {
    value: crypto.webcrypto,
    configurable: true
  });
}
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'en-US', languages: ['en-US'], userAgent: 'NodeTest' },
  configurable: true
});
globalThis.performance = {
  now: () => Date.now(),
  markResourceTiming() {}
};

const executorUrl = pathToFileURL(path.resolve('assets/js/utils/agent-executor.js')).href;
const orchestratorUrl = pathToFileURL(path.resolve('assets/js/utils/agent-orchestrator.js')).href;
const browserUrl = pathToFileURL(path.resolve('assets/js/utils/eon-browser.js')).href;

const executorModule = await import(executorUrl);
const orchestratorModule = await import(orchestratorUrl);
const browserModule = await import(browserUrl);
const browserService = browserModule.default;

function resetWorkspace() {
  localStorage.clear();
  const orch = orchestratorModule.getAgentOrchestrator();
  orch.jobs = [];
  const executor = executorModule.getAgentExecutor();
  executor.state = { schema: 'agent-executor-state/v1', events: [], lastJobId: '', runningJobId: '' };
  if (browserService) {
    browserService.agentTasks = [];
    browserService.tabs = [];
    browserService.sessions = [];
    browserService.bookmarks = [];
    browserService.history = [];
    browserService.activeTabId = null;
    browserService.activeSessionId = null;
  }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

test('agent executor completes a safe plan-only job', async () => {
  resetWorkspace();
  const orch = orchestratorModule.getAgentOrchestrator();
  const exec = executorModule.getAgentExecutor();

  const job = orch.createPipelineJob({
    origin: 'local-ui',
    intentText: 'Prepare a project kickoff checklist',
    requestedSteps: ['plan']
  });

  const result = await exec.runJob(job.id, { surface: 'test' });
  assert.equal(result.ok, true);
  assert.equal(result.state, 'completed');

  const updated = orch.getJob(job.id);
  assert.equal(updated.status, 'completed');
  assert.equal(updated.execution.runtime.state, 'completed');
  assert.equal(updated.execution.runtime.currentStepIndex, 1);
  assert.equal(updated.execution.steps[0].step, 'plan');
});

test('agent executor pauses publish jobs for approval and resumes after approval', async () => {
  resetWorkspace();
  const orch = orchestratorModule.getAgentOrchestrator();
  const exec = executorModule.getAgentExecutor();

  const job = orch.createPipelineJob({
    origin: 'local-ui',
    intentText: 'Prepare and publish a launch update',
    requestedSteps: ['plan', 'publish']
  });

  const firstPass = await exec.runJob(job.id, { surface: 'test' });
  assert.equal(firstPass.ok, true);
  assert.equal(firstPass.state, 'waiting_approval');

  const paused = orch.getJob(job.id);
  assert.equal(paused.status, 'awaiting_approval');
  assert.equal(paused.execution.runtime.state, 'waiting_approval');
  assert.equal(paused.execution.runtime.currentStep, 'publish');

  orch.approveJob(job.id, 'tester');
  const secondPass = await exec.runJob(job.id, { surface: 'test' });
  assert.equal(secondPass.ok, true);
  assert.equal(secondPass.state, 'completed');

  const final = orch.getJob(job.id);
  assert.equal(final.status, 'completed');
  assert.equal(final.approvedByHuman, true);
  assert.equal(final.execution.runtime.state, 'completed');
});

test('agent executor keeps browser task status in sync with execution receipts', async () => {
  resetWorkspace();
  const orch = orchestratorModule.getAgentOrchestrator();
  const exec = executorModule.getAgentExecutor();
  const browserTask = browserService?.createAgentTask
    ? browserService.createAgentTask('Research launch competitors', 'browser')
    : null;

  assert.ok(browserTask, 'browser task should be creatable');

  const job = orch.createPipelineJob({
    origin: 'browser',
    intentText: 'Research launch competitors',
    requestedSteps: ['plan'],
    metadata: {
      browserTaskId: browserTask.id,
      browserGoal: 'Research launch competitors'
    }
  });

  const result = await exec.runJob(job.id, { surface: 'browser' });
  assert.equal(result.state, 'completed');

  const browserTasks = readJson('eon:browser:agent-tasks:v1') || [];
  const task = browserTasks.find((row) => row.id === browserTask.id);
  assert.ok(task, 'browser task should persist');
  assert.equal(task.status, 'done');
  assert.ok(String(task.extractedData || '').length > 0);
});
