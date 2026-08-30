import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeEonProjectContext,
  projectEonClientPortfolio,
  validateEonProjectContextFoundation
} from '../../assets/js/projects/eon-project-context.js';
import {
  createProject,
  loadProjects,
  updateProject
} from '../../assets/js/utils/eon-workspace-store.js';
import { EON_PROJECTS_STORAGE_KEY } from '../../assets/js/contracts/projects/eon-project-store-contract.js';

function storage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    key: (index) => [...map.keys()][index] || null,
    get length() { return map.size; }
  };
}

test('RT92 project context validates a project-scoped client boundary', () => {
  const report = validateEonProjectContextFoundation();
  assert.equal(report.ok, true, report.errors.join('\n'));
  const context = normalizeEonProjectContext({ mode: 'client', clientRef: 'client-acme', clientLabel: 'Acme' }, { projectId: 'project_123' });
  assert.equal(context.mode, 'client');
  assert.equal(context.memoryScope, 'project:project_123');
  assert.equal(context.clientSharedMemoryActive, false);
  assert.equal(context.cloudSyncClaimed, false);
});

test('RT92 existing project records remain backward compatible and normalize to personal', () => {
  const store = storage();
  store.setItem(EON_PROJECTS_STORAGE_KEY, JSON.stringify({
    schema: 'eon.projects.v3',
    projects: [{ id: 'project_existing', title: 'Existing project', status: 'active', tasks: [], artifacts: [], automationIds: [] }]
  }));
  const state = loadProjects({ storage: store });
  assert.equal(state.projects.length, 1);
  assert.equal(state.projects[0].workspaceContext.mode, 'personal');
  assert.equal(state.projects[0].workspaceContext.memoryScope, 'project:project_existing');
});

test('RT92 client metadata persists inside the existing Projects store, not a second client store', () => {
  const store = storage();
  const project = createProject({
    title: 'Client launch',
    summary: 'Prepare launch work',
    workspaceContext: { mode: 'client', clientRef: 'client-acme', clientLabel: 'Acme' }
  }, { storage: store, capacitySnapshot: { resources: {} } });
  assert.equal(project.workspaceContext.clientRef, 'client-acme');
  assert.equal(project.workspaceContext.memoryScope, `project:${project.id}`);
  const keys = Array.from({ length: store.length }, (_, index) => store.key(index));
  assert.ok(keys.includes(EON_PROJECTS_STORAGE_KEY));
  assert.equal(keys.some((key) => /client.*workspace|workspace.*client/i.test(key)), false);

  const updated = updateProject(project.id, { summary: 'Updated launch work' }, { storage: store, capacitySnapshot: { resources: {} } });
  assert.equal(updated.workspaceContext.clientRef, 'client-acme');
});

test('RT92 client portfolio is a read-only grouping over existing Project records', () => {
  const projects = [
    { id: 'project_a', title: 'Site', status: 'active', workspaceContext: { mode: 'client', clientRef: 'client-acme', clientLabel: 'Acme' } },
    { id: 'project_b', title: 'Campaign', status: 'complete', workspaceContext: { mode: 'client', clientRef: 'client-acme', clientLabel: 'Acme' } },
    { id: 'project_c', title: 'Personal', status: 'active', workspaceContext: { mode: 'personal' } }
  ];
  const before = JSON.stringify(projects);
  const portfolio = projectEonClientPortfolio(projects);
  assert.equal(portfolio.length, 1);
  assert.equal(portfolio[0].clientRef, 'client-acme');
  assert.equal(portfolio[0].projects.length, 2);
  assert.equal(portfolio[0].activeProjects, 1);
  assert.equal(portfolio[0].completeProjects, 1);
  assert.equal(portfolio[0].projects[0].memoryScope, 'project:project_a');
  assert.equal(JSON.stringify(projects), before);
});
