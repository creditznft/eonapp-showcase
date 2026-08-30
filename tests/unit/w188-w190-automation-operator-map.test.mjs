import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  appendOperatorActivity,
  clearOperatorActivity,
  listOperatorActivity
} from '../../assets/js/operator/operator-activity.js';
import { clearAutomationState, loadAutomationState } from '../../assets/js/utils/automation-os-store.js';
import { createWorkflowFromTemplate, runWorkflowSimulation, savePlannedWorkflow } from '../../assets/js/utils/automation-workflow-engine.js';
import { getPrivateMarketDrop, readPrivateMarketDrop } from '../../assets/js/market/market-private-drop.js';
import { createDevRouteRewrites, renderCloudflareRedirects } from '../../config/route-contract.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function installMemoryStorage() {
  const values = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); }
  };
  return () => {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  };
}

test('W188 turns Automation into a simplified simulate-first product surface', async () => {
  const restore = installMemoryStorage();
  try {
    clearAutomationState();
    const workflow = savePlannedWorkflow(createWorkflowFromTemplate('inbox-triage'));
    const result = await runWorkflowSimulation(workflow.id);
    assert.equal(result.mode, 'simulate');
    assert.equal(result.results.some((item) => item.status === 'approval-required'), true);
    const state = loadAutomationState();
    assert.equal(state.workflows.length, 1);
    assert.equal(state.approvals.some((item) => item.status === 'pending'), true);
    assert.equal(result.results.every((item) => item.status !== 'submitted'), true);
  } finally {
    restore();
  }
});

test('W189 records bounded non-secret operator activity only from real local events', () => {
  const restore = installMemoryStorage();
  try {
    clearOperatorActivity();
    appendOperatorActivity({
      source: 'automation',
      status: 'waiting',
      title: 'Automation draft created',
      detail: 'Inbox triage',
      route: '/automations',
      metadata: { workflowId: 'flow-unit', apiKey: 'must-not-persist', nested: { accessToken: 'must-not-persist', count: 1 } }
    });
    const [entry] = listOperatorActivity({ limit: 1 });
    assert.equal(entry.title, 'Automation draft created');
    assert.equal(entry.route, '/automations');
    assert.equal(entry.metadata.workflowId, 'flow-unit');
    assert.equal('apiKey' in entry.metadata, false);
    assert.equal('accessToken' in entry.metadata.nested, false);
  } finally {
    restore();
  }
});

test('W189 lets the 2D Operator Map read a Market drop without regenerating it', () => {
  const restore = installMemoryStorage();
  try {
    assert.equal(readPrivateMarketDrop(), null);
    const created = getPrivateMarketDrop({ regenerate: true, count: 4 });
    const loaded = readPrivateMarketDrop();
    assert.equal(loaded.items.length, 4);
    assert.deepEqual(loaded.items.map((item) => item.id), created.items.map((item) => item.id));
  } finally {
    restore();
  }
});

test('W190 ships a clean 2D City and simplified Automations route without loading the 3D engine', () => {
  for (const page of ['automations.html', 'eoncity.html']) assert.equal(existsSync(new URL(`../../${page}`, import.meta.url)), true);
  const redirects = read('_redirects');
  const vite = read('vite.config.mjs');
  const operator = read('assets/js/eon-operator-map.js');
  const automations = read('assets/js/eon-automations-page.js');
  const workspace = read('workspace.html');
  const workstation = read('assets/js/eon-workstation-page.js');
  const shareLinks = read('assets/js/utils/signed-share-link.js');
  assert.equal(redirects, renderCloudflareRedirects());
  const rewrites = createDevRouteRewrites();
  assert.equal(rewrites.get('/automations'), '/automations.html');
  assert.equal(rewrites.get('/eoncity'), '/eoncity.html');
  assert.match(vite, /createDevRouteRewrites/);
  assert.match(operator, /This map never invents agent work/);
  assert.doesNotMatch(operator, /realm3d|three\.module|EngineBoot/);
  assert.match(automations, /Create safe plan/);
  assert.match(automations, /runWorkflowSimulation/);
  assert.match(workspace, /href="\/automations"/);
  assert.match(workstation, /url: '\/eoncity'/);
  assert.match(workstation, /url: '\/automations'/);
  assert.match(shareLinks, /'\/eoncity'/);
  assert.match(shareLinks, /'\/automations'/);
});
