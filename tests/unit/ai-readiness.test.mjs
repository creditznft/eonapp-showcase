import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

function loadAiReadiness(deps = {}) {
  const source = fs.readFileSync(path.resolve('assets/js/utils/ai-readiness.js'), 'utf8');
  const compat = source
    .replace(/^import\s+\{\s*PROVIDERS,\s*getApiKey,\s*getProviderVerification,\s*loadAISettings\s*\}\s+from\s+'..\/chat\/ai-runtime\.js';/m, 'const { PROVIDERS, getApiKey, getProviderVerification, loadAISettings } = __testDeps;')
    .replace(/^import\s+\{\s*buildModeGuidance,\s*buildModeHeadline,\s*normalizeModeSettings\s*\}\s+from\s+'.\/eon-mode-system\.js';/m, 'const { buildModeGuidance, buildModeHeadline, normalizeModeSettings } = __testDeps;')
    .replace(/^import\s+\{\s*buildAutoRoutePlan\s*\}\s+from\s+'.\/eon-auto-router\.js';/m, 'const { buildAutoRoutePlan } = __testDeps;')
    .replace(/^import\s+\{\s*detectLocalAiCapabilityProfile,\s*buildLocalWorkloadMatrix,\s*buildLocalModelDiscoveryPlan,\s*summarizeLocalCapabilityTruth\s*\}\s+from\s+'.\/local-ai-capability-matrix\.js';/m, 'const { detectLocalAiCapabilityProfile, buildLocalWorkloadMatrix, buildLocalModelDiscoveryPlan, summarizeLocalCapabilityTruth } = __testDeps;')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+const\s+/gm, 'var ');

  const defaultDeps = {
    buildModeGuidance: () => 'Mode guidance',
    buildModeHeadline: (_settings, { providerLabel } = {}) => `${providerLabel || 'AI'} mode`,
    normalizeModeSettings: (settings = {}) => ({ ...settings }),
    buildAutoRoutePlan: ({ settings, providers } = {}) => {
      const providerId = String(settings?.provider || 'guide');
      const providerLabel = providers?.[providerId]?.label || providerId;
      return {
        providerId,
        providerLabel,
        fallbackChain: [providerId]
      };
    },
    detectLocalAiCapabilityProfile: ({ hardwareTier } = {}) => ({ tier: hardwareTier || 'high' }),
    buildLocalWorkloadMatrix: () => [],
    buildLocalModelDiscoveryPlan: () => ({ steps: [] }),
    summarizeLocalCapabilityTruth: () => ({ summary: 'Local models are available.' })
  };

  const ctx = vm.createContext({
    __testDeps: { ...defaultDeps, ...deps },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    performance: { now: () => 0 },
    AbortController: class {},
    URL
  });

  vm.runInContext(`${compat}; this.__exports = { getAIReadiness, getSuperappSetupPlan, CANONICAL_AI_SETUP_PATH, CANONICAL_AI_KEYS_PATH, CANONICAL_AI_CHAT_PATH };`, ctx);
  return ctx.__exports;
}

test('getSuperappSetupPlan prefers local runtimes when available', () => {
  const api = loadAiReadiness({
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide', defaultModel: '', defaultEndpoint: '', requiresApiKey: false },
      ollama: { id: 'ollama', label: 'Ollama', defaultModel: 'llama3.2', defaultEndpoint: 'http://127.0.0.1:11434', requiresApiKey: false }
    },
    getApiKey: () => '',
    getProviderVerification: () => ({ ready: false, state: 'guide', reason: 'Guide mode is active.' }),
    loadAISettings: () => ({ provider: 'guide', mode: 'guide' })
  });

  const plan = api.getSuperappSetupPlan({ provider: 'guide', mode: 'guide' }, {
    hardwareTier: 'high',
    localProviders: [
      { provider: 'ollama', available: true, models: ['llama3.2', 'qwen2.5'] }
    ]
  });

  assert.equal(plan.hasLocalRuntime, true);
  assert.equal(plan.recommendedProviderId, 'ollama');
  assert.ok(plan.recommendedReason.includes('local models'));
  assert.equal(plan.suggestedNextStep, 'Open Local AI setup');
});

test('getAIReadiness requires a current provider verification instead of treating a saved key as ready', () => {
  const provider = { id: 'openai', label: 'OpenAI', defaultModel: '', defaultEndpoint: 'https://api.openai.com/v1', requiresApiKey: true, supportsEndpoint: true };
  const base = {
    PROVIDERS: {
      guide: { id: 'guide', label: 'Guide', defaultModel: '', defaultEndpoint: '', requiresApiKey: false },
      openai: provider
    },
    getApiKey: () => 'sk-test',
    loadAISettings: () => ({ provider: 'openai', mode: 'hybrid', model: 'stale-model', endpoint: 'https://api.openai.com/v1' })
  };

  const unverified = loadAiReadiness({
    ...base,
    getProviderVerification: () => ({ ready: false, state: 'verification-required', reason: 'Run a current compatibility check in Vault.' })
  }).getAIReadiness(base.loadAISettings());
  assert.equal(unverified.ready, false);
  assert.equal(unverified.primaryAction.url, '/vault#provider-check');
  assert.match(unverified.bannerLabel, /verification needed/i);

  const verified = loadAiReadiness({
    ...base,
    getProviderVerification: () => ({ ready: true, state: 'verified-model-list', model: 'current-model', checkedAt: '2026-06-25T00:00:00.000Z' })
  }).getAIReadiness(base.loadAISettings());
  assert.equal(verified.ready, true);
  assert.equal(verified.model, 'current-model');
  assert.equal(verified.primaryAction.url, '/');
  assert.match(verified.bannerLabel, /OpenAI verified/i);
});
