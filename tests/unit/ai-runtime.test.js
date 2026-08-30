'use strict';
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

function createStorage(seed = {}) {
  const store = { ...seed };
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    _store: store
  };
}

function installBrowserGlobals(initialLocal = {}, initialSession = {}) {
  const localStorage = createStorage(initialLocal);
  const sessionStorage = createStorage(initialSession);
  const previous = {
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    window: global.window,
    performance: global.performance,
    AbortController: global.AbortController,
    console: global.console
  };

  global.localStorage = localStorage;
  global.sessionStorage = sessionStorage;
  global.window = {
    location: { origin: 'https://eonapp.ch' },
    setTimeout: () => 0,
    clearTimeout: () => {}
  };
  global.performance = { now: () => Date.now() };
  global.AbortController = class AbortController {
    constructor() { this.signal = {}; }
    abort() {}
  };
  global.console = { log() {}, warn() {}, error() {} };

  return {
    localStore: localStorage._store,
    sessionStore: sessionStorage._store,
    restore() {
      global.localStorage = previous.localStorage;
      global.sessionStorage = previous.sessionStorage;
      global.window = previous.window;
      global.performance = previous.performance;
      global.AbortController = previous.AbortController;
      global.console = previous.console;
    }
  };
}

async function loadRuntime(initialLocal = {}, initialSession = {}) {
  const runtimeUrl = pathToFileURL(path.resolve(__dirname, '..', '..', 'assets', 'js', 'chat', 'ai-runtime.js'));
  const globals = installBrowserGlobals(initialLocal, initialSession);
  const module = await import(`${runtimeUrl.href}?test=${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return { ...globals, module };
}

// ─── PROVIDERS constant ──────────────────────────────────────────────────────

test('PROVIDERS exposes the current shipping provider set', async () => {
  const runtime = await loadRuntime();
  const { PROVIDERS } = runtime.module;
  const expected = [
    'guide', 'browserlocal', 'ollama', 'lmstudio', 'jan', 'groq', 'gemini', 'cerebras',
    'mistral', 'deepseek', 'perplexity', 'together', 'cohere', 'nvidia',
    'sambanova', 'fireworks', 'huggingface', 'openai', 'openrouter',
    'xai', 'qwen', 'anthropic', 'custom'
  ];
  assert.deepEqual(Object.keys(PROVIDERS), expected);
  runtime.restore();
});

test('every PROVIDER entry has required fields', async () => {
  const runtime = await loadRuntime();
  const { PROVIDERS } = runtime.module;
  for (const [id, provider] of Object.entries(PROVIDERS)) {
    assert.equal(provider.id, id, `id mismatch for ${id}`);
    assert.ok(typeof provider.label === 'string' && provider.label.length > 0, `${id} missing label`);
    assert.ok(typeof provider.kind === 'string', `${id} missing kind`);
    assert.ok(typeof provider.requiresApiKey === 'boolean', `${id} missing requiresApiKey`);
    assert.ok(typeof provider.supportsEndpoint === 'boolean', `${id} missing supportsEndpoint`);
  }
  runtime.restore();
});

test('guide provider does not require API key', async () => {
  const runtime = await loadRuntime();
  assert.equal(runtime.module.PROVIDERS.guide.requiresApiKey, false);
  runtime.restore();
});

test('openai provider requires API key', async () => {
  const runtime = await loadRuntime();
  assert.equal(runtime.module.PROVIDERS.openai.requiresApiKey, true);
  runtime.restore();
});

test('ollama provider does not require API key', async () => {
  const runtime = await loadRuntime();
  assert.equal(runtime.module.PROVIDERS.ollama.requiresApiKey, false);
  runtime.restore();
});

// ─── loadAISettings ──────────────────────────────────────────────────────────

test('loadAISettings returns defaults when storage is empty', async () => {
  const runtime = await loadRuntime();
  const settings = runtime.module.loadAISettings();
  assert.equal(settings.assistantMode, 'auto');
  assert.equal(settings.runtimePreference, 'hybrid');
  assert.equal(settings.mode, 'guide');
  assert.equal(settings.provider, 'guide');
  assert.equal(settings.persistApiKey, false);
  assert.ok(typeof settings.systemPrompt === 'string' && settings.systemPrompt.length > 0);
  runtime.restore();
});

test('loadAISettings normalizes unknown provider to guide', async () => {
  const runtime = await loadRuntime({
    'eon:ai-chat-settings:v1': JSON.stringify({ provider: 'unknown-provider' })
  });
  const settings = runtime.module.loadAISettings();
  assert.equal(settings.provider, 'guide');
  runtime.restore();
});

test('loadAISettings loads saved provider from storage', async () => {
  const runtime = await loadRuntime({
    'eon:ai-chat-settings:v1': JSON.stringify({ provider: 'openai', model: 'gpt-4', endpoint: 'https://api.openai.com/v1' })
  });
  const settings = runtime.module.loadAISettings();
  assert.equal(settings.provider, 'openai');
  assert.equal(settings.model, 'gpt-4');
  runtime.restore();
});

test('loadAISettings normalizes invalid mode to hybrid', async () => {
  const runtime = await loadRuntime({
    'eon:ai-chat-settings:v1': JSON.stringify({ mode: 'turbo-mode' })
  });
  const settings = runtime.module.loadAISettings();
  assert.equal(settings.assistantMode, 'auto');
  assert.equal(settings.runtimePreference, 'hybrid');
  assert.equal(settings.mode, 'guide');
  runtime.restore();
});

// ─── saveAISettings ──────────────────────────────────────────────────────────

test('saveAISettings persists and returns normalized settings', async () => {
  const runtime = await loadRuntime();
  runtime.module.saveAISettings({
    provider: 'anthropic',
    assistantMode: 'advanced',
    runtimePreference: 'provider-connected'
  });
  const settings = runtime.module.loadAISettings();
  assert.equal(settings.provider, 'anthropic');
  assert.equal(settings.mode, 'ai');
  assert.equal(settings.assistantMode, 'advanced');
  assert.equal(settings.runtimePreference, 'provider-connected');
  runtime.restore();
});

test('saveAISettings truncates systemPrompt to 4000 chars', async () => {
  const runtime = await loadRuntime();
  runtime.module.saveAISettings({ systemPrompt: 'x'.repeat(5000) });
  const settings = runtime.module.loadAISettings();
  assert.ok(settings.systemPrompt.length <= 4000);
  runtime.restore();
});

test('saveAISettings sanitizes endpoint - rejects non-http/https', async () => {
  const runtime = await loadRuntime();
  const settings = runtime.module.saveAISettings({ provider: 'custom', endpoint: 'ftp://evil.com' });
  assert.equal(settings.endpoint, '');
  runtime.restore();
});

test('saveAISettings allows localhost http endpoint', async () => {
  const runtime = await loadRuntime();
  const settings = runtime.module.saveAISettings({ provider: 'ollama', endpoint: 'http://127.0.0.1:11434' });
  assert.ok(settings.endpoint.includes('127.0.0.1'));
  runtime.restore();
});

test('saveAISettings rejects endpoint with embedded credentials', async () => {
  const runtime = await loadRuntime();
  const settings = runtime.module.saveAISettings({ provider: 'openai', endpoint: 'https://user:pass@api.openai.com/v1' });
  assert.ok(!settings.endpoint.includes('user:pass'), 'endpoint must not contain embedded credentials');
  runtime.restore();
});

// ─── setApiKey / getApiKey / clearApiKey ─────────────────────────────────────

test('setApiKey (persist=true) keeps runtime key session-only and scrubs plaintext localStorage', async () => {
  const runtime = await loadRuntime();
  runtime.module.setApiKey('openai', 'sk-test1234', true);
  const key = runtime.module.getApiKey('openai');
  assert.equal(key, 'sk-test1234');
  const localParsed = JSON.parse(runtime.localStore['eon:ai-chat-device-keys:v1'] || '{}');
  const sessionParsed = JSON.parse(runtime.sessionStore['eon:ai-chat-session-keys:v1'] || '{}');
  assert.ok(!localParsed.openai);
  assert.equal(sessionParsed.openai, 'sk-test1234');
  runtime.restore();
});

test('setApiKey (persist=false) stores key in sessionStorage only', async () => {
  const runtime = await loadRuntime();
  runtime.module.setApiKey('anthropic', 'sk-ant-xxx', false);
  const key = runtime.module.getApiKey('anthropic');
  assert.equal(key, 'sk-ant-xxx');
  const localParsed = JSON.parse(runtime.localStore['eon:ai-chat-device-keys:v1'] || '{}');
  const sessionParsed = JSON.parse(runtime.sessionStore['eon:ai-chat-session-keys:v1'] || '{}');
  assert.ok(!localParsed.anthropic);
  assert.equal(sessionParsed.anthropic, 'sk-ant-xxx');
  runtime.restore();
});

test('clearApiKey removes stored key', async () => {
  const runtime = await loadRuntime();
  runtime.module.setApiKey('gemini', 'AIzaXXX', true);
  runtime.module.clearApiKey('gemini');
  assert.equal(runtime.module.getApiKey('gemini'), '');
  runtime.restore();
});

test('setApiKey strips newlines from API key', async () => {
  const runtime = await loadRuntime();
  runtime.module.setApiKey('openai', 'sk-\ntest\r1234', true);
  const key = runtime.module.getApiKey('openai');
  assert.ok(!key.includes('\n') && !key.includes('\r'));
  runtime.restore();
});

test('setApiKey truncates long API key to 512 chars', async () => {
  const runtime = await loadRuntime();
  runtime.module.setApiKey('openai', 'x'.repeat(1000), true);
  const key = runtime.module.getApiKey('openai');
  assert.ok(key.length <= 512);
  runtime.restore();
});

// ─── getRateStatus ───────────────────────────────────────────────────────────

test('getRateStatus returns zero usage on fresh context', async () => {
  const runtime = await loadRuntime();
  const status = runtime.module.getRateStatus();
  assert.equal(status.hourUsed, 0);
  assert.equal(status.dayUsed, 0);
  assert.ok(status.hourLimit > 0);
  assert.ok(status.dayLimit > 0);
  runtime.restore();
});

test('getRateStatus reflects free tier limits when no paid plan', async () => {
  const runtime = await loadRuntime();
  const status = runtime.module.getRateStatus();
  assert.equal(status.hourLimit, 20);
  assert.equal(status.dayLimit, 60);
  runtime.restore();
});

test('getRateStatus uses paid limits when entitlement is set', async () => {
  const runtime = await loadRuntime({
    'eon:entitlements:v1': JSON.stringify({ activePlanId: 'pro' }),
    'eon:ai-rate:v1': JSON.stringify({ ts: [] })
  });
  const status = runtime.module.getRateStatus();
  assert.equal(status.hourLimit, 60);
  assert.equal(status.dayLimit, 200);
  runtime.restore();
});
