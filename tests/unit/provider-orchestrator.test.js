'use strict';
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

function loadOrchestrator(deps = {}, initialLocal = {}) {
  deps = { PROVIDERS: { openai: { id: 'openai', label: 'OpenAI', requiresApiKey: true, enabled: true }, anthropic: { id: 'anthropic', label: 'Anthropic', requiresApiKey: true, enabled: false }, guide: { id: 'guide', label: 'Guide only', requiresApiKey: false, enabled: true } }, ...deps };
  const source = fs.readFileSync(path.resolve(__dirname, '..', '..', 'assets', 'js', 'utils', 'provider-orchestrator.js'), 'utf8');
  const compat = source
    .replace(/^import\s+\{\s*getApiKey\s*,\s*PROVIDERS\s*\}\s+from\s+'..\/chat\/ai-runtime\.js';/m, 'const { getApiKey, PROVIDERS } = __testDeps;')
    .replace(/^export\s+class\s+/gm, 'class ')
    .replace(/^export\s+const\s+/gm, 'var ');

  const localStore = { ...initialLocal };
  const localStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(localStore, key) ? localStore[key] : null),
    setItem: (key, value) => { localStore[key] = String(value); },
    removeItem: (key) => { delete localStore[key]; }
  };
  const crypto = {
    getRandomValues: (typedArray) => {
      for (let index = 0; index < typedArray.length; index += 1) {
        typedArray[index] = (index * 17 + 29) % 256;
      }
      return typedArray;
    }
  };

  const ctx = vm.createContext({
    __testDeps: deps,
    localStorage,
    window: { crypto },
    document: undefined,
    crypto,
    console,
    fetch: async () => ({ ok: false }),
    setTimeout,
    clearTimeout,
    AbortController
  });

  vm.runInContext(compat, ctx);
  return { ctx, localStorage, localStore };
}

test('getCloudProviderKeys sees session/runtime API keys', async () => {
  const { ctx } = loadOrchestrator({
    getApiKey: (providerId) => (providerId === 'openai' ? 'sk-session-openai' : '')
  });

  const keys = await ctx.providerOrchestrator.getCloudProviderKeys();
  assert.equal(keys.length, 1);
  assert.equal(keys[0].id, 'openai');
  assert.equal(keys[0].label, 'OpenAI');
  assert.equal(keys[0].key, undefined);
  assert.equal(ctx.providerOrchestrator.cloudProviderSecrets.get('openai'), 'sk-session-openai');
});

test('routeRequest recovers when active provider state is invalid', async () => {
  const { ctx } = loadOrchestrator({
    getApiKey: () => ''
  });

  const orchestrator = ctx.providerOrchestrator;
  orchestrator.activeProvider = null;
  orchestrator.availableProviders = { cloud: [], local: [], guide: true };
  orchestrator.saveToStorage = () => {};
  orchestrator.logRouting = () => {};
  orchestrator.tryProvider = async (provider) => {
    if (provider?.type === 'guide') return { success: true, output: 'ok' };
    return { success: false, error: 'not-ready' };
  };

  const result = await orchestrator.routeRequest({ type: 'idea' });
  assert.equal(result.success, true);
  assert.equal(result.provider.type, 'guide');
  assert.equal(result.output, 'ok');
});

test('selectModelForTask prefers task-matched provider over a slightly faster mismatch', () => {
  const { ctx } = loadOrchestrator({
    getApiKey: () => ''
  });

  const orch = ctx.providerOrchestrator;
  orch.availableProviders = {
    cloud: [
      { id: 'openai', label: 'OpenAI' },
      { id: 'anthropic', label: 'Anthropic' }
    ],
    local: [
      { id: 'ollama', label: 'Ollama (local)' }
    ],
    guide: true
  };
  orch.metrics = {
    openai: {
      responseTime: [800],
      successCount: 8,
      errorCount: 2,
      totalRequests: 10,
      lastChecked: Date.now()
    },
    anthropic: {
      responseTime: [700],
      successCount: 8,
      errorCount: 2,
      totalRequests: 10,
      lastChecked: Date.now()
    },
    ollama: {
      responseTime: [2000],
      successCount: 6,
      errorCount: 4,
      totalRequests: 10,
      lastChecked: Date.now()
    }
  };
  orch.concurrentRequests = { openai: 0, anthropic: 0, ollama: 0 };

  const selected = orch.selectModelForTask('code', [
    { id: 'openai', label: 'OpenAI' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'ollama', label: 'Ollama (local)' }
  ]);

  assert.ok(selected);
  assert.equal(selected.id, 'anthropic');
  assert.equal(selected.taskType, 'code');
});


test('getCloudProviderKeys ignores retired plaintext aliases and disabled provider entries', async () => {
  const { ctx } = loadOrchestrator({
    getApiKey: () => '',
    PROVIDERS: {
      openai: { id: 'openai', label: 'OpenAI', requiresApiKey: true, enabled: true },
      anthropic: { id: 'anthropic', label: 'Anthropic', requiresApiKey: true, enabled: false }
    }
  }, {
    'eon:provider-key:openai': 'sk-legacy-plaintext',
    'eon:provider-key:anthropic': 'sk-disabled-legacy'
  });
  const keys = await ctx.providerOrchestrator.getCloudProviderKeys();
  assert.deepEqual(Array.from(keys), []);
  assert.equal(ctx.providerOrchestrator.cloudProviderSecrets.size, 0);
});
