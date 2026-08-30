import test from 'node:test';
import assert from 'node:assert/strict';

class LocalStorageMock {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

globalThis.localStorage = new LocalStorageMock();

const registry = await import('../../assets/js/utils/automation-provider-registry.js');
const store = await import('../../assets/js/utils/automation-os-store.js');
const engine = await import('../../assets/js/utils/automation-workflow-engine.js');

test('W103 provider registry is broad, truthful, extensible, and excludes value-bearing connector categories', () => {
  const result = registry.validateAutomationProviderRegistry();
  const stats = registry.getAutomationProviderStats();
  assert.equal(result.ok, true);
  assert.ok(stats.total >= 150, `expected at least 150 current-product providers, got ${stats.total}`);
  assert.ok(stats.categories >= 14);
  for (const id of ['openai', 'anthropic', 'google-gemini', 'xai', 'qwen-cloud', 'azure-openai', 'aws-bedrock', 'gmail', 'slack', 'hubspot', 'github', 'zapier', 'make', 'n8n', 'pipedream', 'power-automate', 'browser-companion', 'local-runner', 'cloud-scheduler']) {
    assert.ok(registry.getAutomationProvider(id), `missing ${id}`);
  }
  for (const id of ['shopify', 'stripe', 'paypal', 'razorpay', 'quickbooks', 'plaid', 'wise-business']) assert.equal(registry.getAutomationProvider(id), null, `retired value connector must remain absent: ${id}`);
  assert.equal(stats.byCategory.commerce, undefined);
  assert.equal(stats.byCategory.finance, undefined);
  assert.equal(registry.getAutomationProvider('browser-companion').state, 'built-in');
  assert.equal(registry.getAutomationProvider('zapier').state, 'bridge-ready');
});

test('W103 durable store migrates old data and strips every secret-like field', () => {
  localStorage.clear();
  localStorage.setItem('eon:automation-os:v1', JSON.stringify({
    schema: 1,
    workflows: [{
      id: 'legacy-flow',
      name: 'Legacy flow',
      apiKey: 'should-not-survive',
      steps: [{ title: 'Call API', providerId: 'rest-api', capability: 'post', approval: 'submit', config: { accessToken: 'hidden', path: '/safe' } }]
    }],
    connections: {
      openai: { status: 'configured', apiKey: 'sk-secret', credentialRef: 'vault://automation/openai', scopes: ['chat'] }
    }
  }));

  const state = store.loadAutomationState();
  assert.equal(state.schema, store.AUTOMATION_OS_SCHEMA);
  assert.equal(state.workflows.length, 1);
  assert.equal(state.workflows[0].apiKey, undefined);
  assert.equal(state.workflows[0].steps[0].config.accessToken, undefined);
  assert.equal(state.workflows[0].steps[0].config.path, '/safe');
  assert.equal(state.connections.openai.apiKey, undefined);
  assert.equal(state.connections.openai.credentialRef, 'vault://automation/openai');
  assert.equal(localStorage.getItem('eon:automation-os:v1'), null);
  assert.ok(localStorage.getItem(store.AUTOMATION_OS_STORAGE_KEY));
  assert.ok(state.migrationHistory.length >= 1);
});

test('W103 workflows, schedules and provider metadata survive a simulated asset update and login cycle', () => {
  localStorage.clear();
  const workflow = engine.savePlannedWorkflow(engine.createWorkflowFromTemplate('lead-crm'));
  store.upsertConnection('hubspot', { status: 'configured', credentialRef: 'vault://automation/hubspot', password: 'never-store-this' });
  store.upsertSchedule({ workflowId: workflow.id, cadence: 'weekdays 09:00', runner: 'browser', enabled: true });
  const before = store.getAutomationPersistenceReport();

  // Simulate new app code loading after a deploy and an auth session ending.
  delete globalThis.sessionStorage;
  const afterState = store.loadAutomationState();
  const after = store.getAutomationPersistenceReport();

  assert.equal(afterState.workflows.some((item) => item.id === workflow.id), true);
  assert.equal(afterState.schedules.some((item) => item.workflowId === workflow.id), true);
  assert.equal(afterState.connections.hubspot.credentialRef, 'vault://automation/hubspot');
  assert.equal(afterState.connections.hubspot.password, undefined);
  assert.equal(before.storageKey, after.storageKey);
  assert.equal(after.survivesAssetUpdate, true);
  assert.equal(after.survivesNormalLogoutLogin, true);
  assert.equal(after.includedInEncryptedVaultExport, true);
  assert.equal(after.plaintextSecretsAllowed, false);
});

test('W103 simulation produces approvals without external side effects', async () => {
  localStorage.clear();
  const workflow = engine.savePlannedWorkflow(engine.createWorkflowFromTemplate('inbox-triage'));
  const run = await engine.runWorkflowSimulation(workflow.id);
  const state = store.loadAutomationState();
  assert.equal(run.mode, 'simulate');
  assert.ok(run.results.some((item) => item.status === 'simulated'));
  assert.ok(run.results.some((item) => item.status === 'approval-required'));
  assert.ok(state.approvals.some((item) => item.status === 'pending'));
  assert.ok(state.audit.some((item) => item.type === 'run-finished'));
  assert.equal(state.workflows.find((item) => item.id === workflow.id).runCount, 1);
});

test('W103 local agent planner builds useful safe workflows', () => {
  const workflow = engine.planWorkflowLocally('Collect new leads, research the company, draft an email, update HubSpot, ask me before sending, and schedule follow-up.');
  assert.ok(workflow.steps.length >= 5);
  assert.ok(workflow.steps.some((item) => item.providerId === 'hubspot'));
  assert.ok(workflow.steps.some((item) => item.type === 'approval'));
  assert.ok(workflow.steps.filter((item) => item.approval === 'submit' || item.approval === 'sensitive').length >= 1);
});

test('W103 portable export and import contain no secrets', () => {
  localStorage.clear();
  const workflow = engine.savePlannedWorkflow(engine.createWorkflowFromTemplate('content-production'));
  store.upsertConnection('openai', { status: 'configured', credentialRef: 'vault://automation/openai', clientSecret: 'forbidden' });
  const bundle = store.exportAutomationState();
  const serialized = JSON.stringify(bundle);
  assert.equal(bundle.containsSecrets, false);
  assert.equal(serialized.includes('forbidden'), false);
  assert.equal(serialized.includes('clientSecret'), false);
  localStorage.clear();
  store.importAutomationState(bundle, { merge: false });
  assert.ok(store.loadAutomationState().workflows.some((item) => item.id === workflow.id));
});
