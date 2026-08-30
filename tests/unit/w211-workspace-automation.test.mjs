import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  addProjectArtifact,
  addProjectTask,
  containsSecretLikeValue,
  createLibraryItem,
  createProject,
  getWorkspaceSnapshot,
  loadLibrary,
  loadProjects,
  recordLibraryUse,
  updateProjectTask
} from '../../assets/js/utils/eon-workspace-store.js';
import { loadAutomationState, upsertWorkflow } from '../../assets/js/utils/automation-os-store.js';
import { createWorkflowFromTemplate, runWorkflowSimulation } from '../../assets/js/utils/automation-workflow-engine.js';

class MemoryStorage {
  constructor(seed = {}) { this.data = { ...seed }; }
  get length() { return Object.keys(this.data).length; }
  key(index) { return Object.keys(this.data)[index] || null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
}

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W211 creates durable local project records with ordinary tasks and artefacts, while rejecting secret-looking input', () => {
  const storage = new MemoryStorage();
  const project = createProject({ title: 'Creator launch', summary: 'Prepare a clean launch plan.' }, { storage });
  assert.equal(loadProjects({ storage }).projects.length, 1);
  const task = addProjectTask(project.id, { title: 'Draft launch checklist' }, { storage });
  assert.equal(task.status, 'todo');
  assert.equal(updateProjectTask(project.id, task.id, { status: 'done' }, { storage }).status, 'done');
  const artifact = addProjectArtifact(project.id, { type: 'brief', title: 'Launch brief', content: 'Three calm public messages.' }, { storage });
  assert.equal(artifact.type, 'brief');
  assert.equal(loadProjects({ storage }).projects[0].artifacts.length, 1);
  assert.equal(containsSecretLikeValue(['sk', 'abcdefghi01234567890'].join('-')), true);
  assert.throws(() => createProject({ title: 'Unsafe', summary: 'api_key=please-do-not-store-this' }, { storage }), /secret/i);
  assert.throws(() => addProjectArtifact(project.id, { title: 'Unsafe', content: 'Bearer abcdefghijklmnopqrst' }, { storage }), /secret/i);
});

test('W211 Library is separate reusable local work storage and records intentional reuse', () => {
  const storage = new MemoryStorage();
  const item = createLibraryItem({ type: 'template', title: 'Product brief', content: 'State the problem, user, outcome and constraint.', tags: 'brief, product' }, { storage });
  assert.equal(loadLibrary({ storage }).items.length, 1);
  assert.deepEqual(item.tags, ['brief', 'product']);
  assert.equal(recordLibraryUse(item.id, { storage }).useCount, 1);
  assert.throws(() => createLibraryItem({ title: 'Unsafe', content: 'password: do-not-store-this' }, { storage }), /secret/i);
});

test('W211 Workspace counts derive from actual local Project, Library, and Automation records', () => {
  const storage = new MemoryStorage();
  const project = createProject({ title: 'One project', summary: 'A local outcome.' }, { storage });
  addProjectTask(project.id, { title: 'Open task' }, { storage });
  addProjectArtifact(project.id, { title: 'Normal note', content: 'Safe local work.' }, { storage });
  createLibraryItem({ title: 'Reusable prompt', type: 'prompt', content: 'Help me create a clear work plan.' }, { storage });
  const snapshot = getWorkspaceSnapshot({ storage, automationState: { workflows: [{ id: 'flow_1', status: 'paused' }], approvals: [{ status: 'pending' }] } });
  assert.equal(snapshot.activeProjects, 1);
  assert.equal(snapshot.openTasks, 1);
  assert.equal(snapshot.artifacts, 1);
  assert.equal(snapshot.libraryItems, 1);
  assert.equal(snapshot.workflows, 1);
  assert.equal(snapshot.pausedWorkflows, 1);
  assert.equal(snapshot.pendingApprovals, 1);
  assert.equal(snapshot.localOnly, true);
});

test('W211 automation links to a project, simulates locally, and stores approvals without calling an external provider', async () => {
  const originalStorage = globalThis.localStorage;
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  try {
    const project = createProject({ title: 'Automation project', summary: 'Local automation only.' }, { storage });
    const workflow = createWorkflowFromTemplate('research-report', { name: 'Research draft' });
    workflow.projectId = project.id;
    const stored = upsertWorkflow(workflow).workflow;
    assert.equal(loadAutomationState().workflows[0].projectId, project.id);
    const result = await runWorkflowSimulation(stored.id);
    assert.equal(result.mode, 'simulate');
    assert.ok(result.results.length > 0);
    assert.ok(loadAutomationState().approvals.some((item) => item.workflowId === stored.id));
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
  }
});

test('W211 public pages and automation surface state local-only, approval-first behavior and exact integration truth labels', () => {
  const projects = read('projects.html');
  const library = read('library.html');
  const workspace = read('workspace.html');
  const runtime = read('assets/js/eon-workspace-pages.js');
  const automations = read('assets/js/eon-automations-page.js');
  assert.match(projects, /projects\/eon-projects-page\.js/);
  assert.match(library, /secret-looking content/i);
  assert.match(workspace, /eon-workspace-pages\.js/);
  assert.match(runtime, /local only/i);
  assert.match(runtime, /Vault/i);
  for (const label of ['Available', 'OAuth required', 'Webhook only', 'Manual export', 'Preview', 'Unsupported']) assert.match(automations, new RegExp(label));
  assert.match(automations, /no external action was sent/i);
  assert.doesNotMatch(automations, /fetch\s*\(/);
});

test('W211 store normalisation never emits a render feedback event, while a real mutation emits exactly once', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalCustomEvent = Object.getOwnPropertyDescriptor(globalThis, 'CustomEvent');
  const storage = new MemoryStorage();
  let emitted = 0;
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { dispatchEvent: () => { emitted += 1; } }
  });
  Object.defineProperty(globalThis, 'CustomEvent', {
    configurable: true,
    value: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }
  });
  try {
    loadProjects({ storage });
    loadLibrary({ storage });
    assert.equal(emitted, 0);
    createProject({ title: 'One local project', summary: 'Normal mutation.' }, { storage });
    assert.equal(emitted, 1);
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument); else delete globalThis.document;
    if (originalCustomEvent) Object.defineProperty(globalThis, 'CustomEvent', originalCustomEvent); else delete globalThis.CustomEvent;
  }
});
