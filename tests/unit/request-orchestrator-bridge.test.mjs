import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

function loadBridge(deps = {}) {
  const source = fs.readFileSync(path.resolve('assets/js/utils/request-orchestrator-bridge.js'), 'utf8');
  const compat = source
    .replace(/^import\s+\{\s*getAgentOrchestrator\s*\}\s+from\s+'\.\/agent-orchestrator\.js';/m, 'const { getAgentOrchestrator } = __testDeps;')
    .replace(/^import\s+\{\s*ProviderOrchestrator\s*\}\s+from\s+'\.\/provider-orchestrator\.js';/m, 'const { ProviderOrchestrator } = __testDeps;')
    .replace(/^import\s+\{\s*classifyActionTrust\s*\}\s+from\s+'\.\/action-trust-model\.js';/m, 'const { classifyActionTrust } = __testDeps;')
    .replace(/^import\s+\{\s*buildAutoRoutePlan\s*\}\s+from\s+'\.\/eon-auto-router\.js';/m, 'const { buildAutoRoutePlan } = __testDeps;')
    .replace(
      /^import\s+\{\s*PROVIDERS,\s*discoverProviderModels,\s*filterChatCapableModels,\s*isChatCapableModelId,\s*selectBestChatModel\s*\}\s+from\s+'\.\.\/chat\/ai-runtime\.js';/m,
      'const { PROVIDERS, discoverProviderModels, filterChatCapableModels, isChatCapableModelId, selectBestChatModel } = __testDeps;'
    )
    .replace(/^export\s+class\s+/gm, 'class ')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+const\s+/gm, 'var ');

  class FakeProviderOrchestrator {
    constructor() {
      this.availableProviders = { local: [] };
      this.cloudProviderSecrets = new Map();
      this.metrics = {};
      this.activeProvider = null;
    }

    async initialize() {}

    detectTaskType() {
      return 'chat';
    }

    getProviderRankings() {
      return [];
    }

    getCurrentLoad() {
      return 0;
    }
  }

  const defaultDeps = {
    getAgentOrchestrator: () => ({
      getRetryPolicy: () => ({ maxRetries: 3 }),
      getPolicySummary: () => ({}),
      listJobs: () => [],
      getAuditLog: () => []
    }),
    ProviderOrchestrator: FakeProviderOrchestrator,
    classifyActionTrust: () => ({ requiresApproval: false }),
    buildAutoRoutePlan: () => ({ provider: 'guide', fallbackChain: ['guide'] }),
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide Mode', defaultModel: '' }
    },
    discoverProviderModels: async () => [],
    filterChatCapableModels: (models) => models,
    isChatCapableModelId: (modelId) => Boolean(String(modelId || '').trim()),
    selectBestChatModel: (models) => models[0] || ''
  };

  const ctx = vm.createContext({
    __testDeps: { ...defaultDeps, ...deps },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    Math,
    Date
  });

  vm.runInContext(`${compat}; this.__exports = { RequestOrchestratorBridge, getRequestOrchestratorBridge };`, ctx);
  return ctx.__exports;
}

function assertModelSelection(result, model, source) {
  assert.equal(result?.model, model);
  assert.equal(result?.source, source);
}

test('resolveModelForProvider keeps an explicit same-provider model when chat-capable', async () => {
  const { RequestOrchestratorBridge } = loadBridge({
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide Mode', defaultModel: '' },
      openrouter: { id: 'openrouter', label: 'OpenRouter', defaultModel: 'fallback-model' }
    },
    discoverProviderModels: async () => ['live-model'],
    selectBestChatModel: () => 'live-model'
  });

  const bridge = new RequestOrchestratorBridge();
  const result = await bridge.resolveModelForProvider(
    { id: 'openrouter', defaultModel: 'fallback-model' },
    { provider: 'openrouter', model: 'moonshotai/kimi-k2' }
  );

  assertModelSelection(result, 'moonshotai/kimi-k2', 'settings');
});

test('resolveModelForProvider prefers live discovery over provider defaults', async () => {
  const { RequestOrchestratorBridge } = loadBridge({
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide Mode', defaultModel: '' },
      cerebras: { id: 'cerebras', label: 'Cerebras', defaultModel: 'fallback-model' }
    },
    discoverProviderModels: async () => ['llama-4-scout', 'qwen-3'],
    filterChatCapableModels: (models) => models.filter(Boolean),
    selectBestChatModel: (models) => models.at(-1)
  });

  const bridge = new RequestOrchestratorBridge();
  const result = await bridge.resolveModelForProvider(
    { id: 'cerebras', defaultModel: 'fallback-model' },
    {}
  );

  assertModelSelection(result, 'qwen-3', 'discovery');
});

test('resolveModelForProvider falls back to provider default when discovery is empty', async () => {
  const { RequestOrchestratorBridge } = loadBridge({
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide Mode', defaultModel: '' },
      fireworks: { id: 'fireworks', label: 'Fireworks', defaultModel: 'accounts/fireworks/models/deepseek-v3' }
    },
    discoverProviderModels: async () => [],
    selectBestChatModel: () => ''
  });

  const bridge = new RequestOrchestratorBridge();
  const result = await bridge.resolveModelForProvider(
    { id: 'fireworks', defaultModel: 'accounts/fireworks/models/deepseek-v3' },
    {}
  );

  assertModelSelection(result, 'accounts/fireworks/models/deepseek-v3', 'provider-default');
});

test('resolveModelForProvider normalizes provider aliases before discovery and secret lookup', async () => {
  let seenProviderId = '';
  let seenApiKey = '';

  const { RequestOrchestratorBridge } = loadBridge({
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide Mode', defaultModel: '' },
      lmstudio: { id: 'lmstudio', label: 'LM Studio', defaultModel: 'qwen3-8b' }
    },
    discoverProviderModels: async (providerId, apiKey) => {
      seenProviderId = providerId;
      seenApiKey = apiKey;
      return ['qwen3-14b'];
    },
    selectBestChatModel: (models) => models[0] || ''
  });

  const bridge = new RequestOrchestratorBridge();
  bridge.providerOrch = {
    cloudProviderSecrets: new Map([['lmstudio', 'local-secret-token']])
  };

  const result = await bridge.resolveModelForProvider(
    { id: 'lm-studio', defaultModel: 'qwen3-8b' },
    {}
  );

  assert.equal(seenProviderId, 'lmstudio');
  assert.equal(seenApiKey, 'local-secret-token');
  assertModelSelection(result, 'qwen3-14b', 'discovery');
});
