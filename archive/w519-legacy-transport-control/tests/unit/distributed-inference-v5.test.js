'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function makeStorage() {
  const store = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
}

function loadServiceContext() {
  const localStorage = makeStorage();
  const window = { localStorage };
  const context = vm.createContext({
    window,
    localStorage,
    fetch: async () => { throw new Error('offline'); },
    AbortController,
    setTimeout,
    clearTimeout,
    console,
  });

  const source = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'assets', 'js', 'services', 'DistributedInferenceService_V5.js'),
    'utf8'
  );
  vm.runInContext(source, context);
  return context;
}

test('submitInference gracefully rejects non-string/empty prompt input', async () => {
  const ctx = loadServiceContext();
  const service = new ctx.window.DistributedInferenceService();
  const result = await service.submitInference('user-1', 'test-model', null, 128);
  assert.equal(result.success, false);
  assert.equal(result.error, 'Prompt cannot be empty');
});

test('completeInference marks stale-node requests as failed, not completed', async () => {
  const ctx = loadServiceContext();
  const service = new ctx.window.DistributedInferenceService();
  service.requests.set('req-1', {
    id: 'req-1',
    status: 'routing',
    assignedNodeId: 'missing-node',
    costUSD: 0.01,
    modelId: 'test-model',
    userId: 'user-1',
  });

  const result = await service.completeInference('req-1', 100, 50);
  assert.equal(result.success, false);
  assert.equal(result.error, 'Node not found');
  assert.equal(service.requests.get('req-1').status, 'failed');
});

test('persisted distributed inference state omits raw prompt text', async () => {
  const ctx = loadServiceContext();
  const service = new ctx.window.DistributedInferenceService();
  service.requests.set('req-2', {
    id: 'req-2',
    status: 'routing',
    assignedNodeId: 'node-1',
    modelId: 'test-model',
    userId: 'user-1',
    prompt: 'super secret prompt',
  });

  service._persistState();
  const persisted = JSON.parse(ctx.window.localStorage.getItem('distributedInferenceState'));
  const persistedRequest = persisted.requests.find((entry) => entry[0] === 'req-2')?.[1];
  assert.ok(persistedRequest);
  assert.equal(Object.prototype.hasOwnProperty.call(persistedRequest, 'prompt'), false);
});
