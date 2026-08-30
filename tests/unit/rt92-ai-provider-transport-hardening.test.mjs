import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildGeminiGenerateContentPayload,
  buildOpenAICompatibleChatPayload,
  filterChatCapableModels,
  getApiKey,
  resolveVerifiedRequestModel,
  saveAISettings,
  selectBestChatModel
} from '../../assets/js/chat/ai-runtime.js';
import {
  extractProviderModelManifest,
  normalizeProviderModelManifestForExecution
} from '../../assets/js/chat/ai-provider-model-manifest.mjs';
import { AI_PROVIDER_CONTRACTS, evaluateAiProviderModelCompatibility } from '../../config/ai-api-contracts.mjs';
import { PROVIDERS } from '../../assets/js/chat/ai-provider-catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT92 Gemini emits the system instruction exactly once and maps conversation roles correctly', () => {
  const payload = buildGeminiGenerateContentPayload(
    { systemPrompt: 'fallback system', temperature: 0.4 },
    [
      { role: 'system', content: 'authoritative system' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
      { role: 'user', content: 'continue' }
    ],
    { maxOutputTokens: 321 }
  );
  assert.equal(payload.systemInstruction.parts[0].text, 'authoritative system');
  assert.deepEqual(payload.contents.map((row) => row.role), ['user', 'model', 'user']);
  assert.equal(payload.contents.some((row) => row.parts.some((part) => part.text === 'authoritative system')), false);
  assert.equal(payload.generationConfig.maxOutputTokens, 321);
  assert.equal(payload.generationConfig.temperature, 0.4);

  const runtime = read('assets/js/chat/ai-runtime.js');
  const helperUses = runtime.match(/buildGeminiGenerateContentPayload\(/g) || [];
  assert.ok(helperUses.length >= 3, 'helper must be defined and used by batch + stream Gemini transports');
  assert.doesNotMatch(runtime, /const parts = messages\.map\(\(m\) => \(\{[\s\S]*?streamGenerateContent/);
});

test('RT92 reviewed OpenAI-compatible providers use their current output token field', () => {
  const messages = [{ role: 'user', content: 'hello' }];
  for (const provider of ['groq', 'cerebras', 'openrouter']) {
    const payload = buildOpenAICompatibleChatPayload({ provider, model: 'test-model' }, messages, { maxOutputTokens: 222 });
    assert.equal(payload.max_completion_tokens, 222, `${provider} must use max_completion_tokens`);
    assert.equal(payload.max_tokens, undefined, `${provider} must not send legacy max_tokens from this adapter`);
  }
  const mistral = buildOpenAICompatibleChatPayload({ provider: 'mistral', model: 'test-model' }, messages, { maxOutputTokens: 222 });
  assert.equal(mistral.max_tokens, 222);
});

test('RT92 OpenRouter cannot silently fallback or route through a data-collection provider', () => {
  const payload = buildOpenAICompatibleChatPayload(
    { provider: 'openrouter', model: 'openai/test', temperature: 0.5 },
    [{ role: 'user', content: 'hello' }],
    { maxOutputTokens: 100 },
    { stream: true }
  );
  assert.deepEqual(payload.provider, {
    allow_fallbacks: false,
    require_parameters: true,
    data_collection: 'deny'
  });
  assert.equal(payload.stream, true);
});

test('RT92 Perplexity model discovery cannot feed third-party Agent API model IDs into Sonar', () => {
  const manifest = extractProviderModelManifest({ data: [
    { id: 'openai/gpt-example', publisher: 'openai' },
    { id: 'perplexity/sonar', publisher: 'perplexity' },
    { id: 'anthropic/claude-example', publisher: 'anthropic' }
  ] }, 'perplexity');
  const executable = normalizeProviderModelManifestForExecution(manifest, 'perplexity');
  assert.deepEqual(executable.map((row) => row.id), ['sonar']);
  assert.equal(executable[0].metadata.publisher, 'perplexity');

  assert.equal(evaluateAiProviderModelCompatibility('perplexity', 'sonar').allowed, true);
  assert.equal(evaluateAiProviderModelCompatibility('perplexity', 'sonar-pro').allowed, true);
  assert.equal(evaluateAiProviderModelCompatibility('perplexity', 'openai/gpt-example').allowed, false);
  assert.equal(evaluateAiProviderModelCompatibility('perplexity', 'openai/gpt-example').reason, 'provider-requires-sonar-model-id');
});

test('RT92 provider manifest retains bounded nested provider limits without arbitrary metadata', () => {
  const [row] = extractProviderModelManifest({ data: [{
    id: 'model-a',
    owned_by: 'provider-a',
    limits: { max_context_length: 131072, max_completion_tokens: 8192, secret_blob: 'do-not-copy' },
    capabilities: { tool_calling: true },
    description: 'arbitrary provider prose must not be retained'
  }] }, 'cerebras');
  assert.equal(row.metadata.contextWindow, 131072);
  assert.equal(row.metadata.outputTokenLimit, 8192);
  assert.equal(row.metadata.toolCalling, true);
  assert.equal('description' in row.metadata, false);
  assert.equal('secret_blob' in row.metadata, false);
});


test('RT92 Hugging Face execution pins one explicit live upstream provider instead of router auto-failover', () => {
  const manifest = extractProviderModelManifest({ data: [{
    id: 'openai/gpt-oss-test',
    providers: [
      { provider: 'slow-provider', status: 'live', throughput: 8, first_token_latency_ms: 900, supports_tools: true },
      { provider: 'fast-provider', status: 'live', throughput: 42, first_token_latency_ms: 500, supports_tools: true },
      { provider: 'broken-provider', status: 'error', throughput: 100 }
    ]
  }] }, 'huggingface');
  const executable = normalizeProviderModelManifestForExecution(manifest, 'huggingface');
  assert.equal(executable.length, 1);
  assert.equal(executable[0].metadata.routingProvider, 'fast-provider');
  assert.equal(executable[0].metadata.routingPolicy, 'eon-pinned-live-provider');

  const decision = resolveVerifiedRequestModel(PROVIDERS.huggingface, { modelSelectionPolicy: 'auto' }, {
    model: 'openai/gpt-oss-test',
    models: ['openai/gpt-oss-test'],
    modelMetadata: { 'openai/gpt-oss-test': executable[0].metadata }
  });
  assert.equal(decision.model, 'openai/gpt-oss-test:fast-provider');
  assert.equal(decision.upstreamProvider, 'fast-provider');
  assert.match(decision.reason, /upstream-pinned/);
  assert.equal(AI_PROVIDER_CONTRACTS.huggingface.routing.eonExecutionPolicy, 'pin-one-live-upstream-provider-from-current-model-catalogue');
});

test('RT92 Perplexity public model catalogue is not misrepresented as API-key proof', () => {
  assert.equal(PROVIDERS.perplexity.modelListCredentialProof, false);
  assert.equal(AI_PROVIDER_CONTRACTS.perplexity.modelListCredentialProof, false);
  assert.equal(AI_PROVIDER_CONTRACTS.perplexity.readinessProof, 'user-initiated-public-model-catalogue-plus-first-inference-key-proof');
  const runtime = read('assets/js/chat/ai-runtime.js');
  const vault = read('assets/js/vault/eon-vault-page.js');
  assert.match(runtime, /credentialProof: provider\.modelListCredentialProof === false \? 'first-successful-inference-required'/);
  assert.match(runtime, /markHostedCredentialVerified\(provider\.id\)/);
  assert.match(vault, /public model catalogue cannot validate the key/);
  assert.match(vault, /first real request you explicitly send/);
});


test('RT92 OpenAI catalogue admission rejects legacy/base/specialized IDs and picks current chat families by policy', () => {
  const models = [
    'babbage-002', 'davinci-002', 'gpt-5.6-codex', 'gpt-realtime',
    'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-4.1'
  ];
  assert.deepEqual(filterChatCapableModels(models, 'openai'), [
    'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-4.1'
  ]);
  assert.equal(selectBestChatModel(models, 'openai', { mode: 'auto' }), 'gpt-5.6-sol');
  assert.equal(selectBestChatModel(models, 'openai', { mode: 'best' }), 'gpt-5.6-sol');
  assert.equal(selectBestChatModel(models, 'openai', { mode: 'fast' }), 'gpt-5.6-luna');
  assert.equal(selectBestChatModel(models, 'openai', { mode: 'economy' }), 'gpt-5.6-luna');
});

test('RT92 current OpenAI Chat Completions transport uses developer instructions, max_completion_tokens and store:false', () => {
  const current = buildOpenAICompatibleChatPayload(
    { provider: 'openai', model: 'gpt-5.6-sol', temperature: 0.3 },
    [{ role: 'system', content: 'system truth' }, { role: 'user', content: 'hello' }],
    { maxOutputTokens: 333 }
  );
  assert.deepEqual(current.messages, [
    { role: 'developer', content: 'system truth' },
    { role: 'user', content: 'hello' }
  ]);
  assert.equal(current.max_completion_tokens, 333);
  assert.equal(current.max_tokens, undefined);
  assert.equal(current.store, false);

  const legacyChat = buildOpenAICompatibleChatPayload(
    { provider: 'openai', model: 'gpt-4.1' },
    [{ role: 'system', content: 'system truth' }, { role: 'user', content: 'hello' }],
    { maxOutputTokens: 111 }
  );
  assert.equal(legacyChat.messages[0].role, 'system');
  assert.equal(legacyChat.max_completion_tokens, 111);
  assert.equal(legacyChat.store, false);
});

test('RT92 hosted credential custody cannot redirect named provider keys to arbitrary HTTPS endpoints', () => {
  assert.equal(PROVIDERS.openai.supportsEndpoint, false);
  assert.equal(PROVIDERS.openrouter.supportsEndpoint, false);
  assert.equal(PROVIDERS.xai.supportsEndpoint, false);
  assert.equal(PROVIDERS.deepseek.supportsEndpoint, false);
  assert.equal(PROVIDERS.perplexity.supportsEndpoint, false);

  const openai = saveAISettings({ provider: 'openai', endpoint: 'https://evil.example/v1' });
  assert.equal(openai.endpoint, 'https://api.openai.com/v1');

  const qwenReviewed = saveAISettings({ provider: 'qwen', endpoint: 'https://workspace1.eu-central-1.maas.aliyuncs.com/compatible-mode/v1' });
  assert.equal(qwenReviewed.endpoint, 'https://workspace1.eu-central-1.maas.aliyuncs.com/compatible-mode/v1');

  const qwenRejected = saveAISettings({ provider: 'qwen', endpoint: 'https://evil.example/compatible-mode/v1' });
  assert.equal(qwenRejected.endpoint, PROVIDERS.qwen.defaultEndpoint);
  assert.equal(AI_PROVIDER_CONTRACTS.qwen.migration.arbitraryHttpsEndpoint, 'forbidden');
});


test('RT92 current provider catalogues use chat-specific metadata to reject non-chat models', () => {
  const mistral = extractProviderModelManifest({ data: [
    { id: 'mistral-chat', type: 'base', capabilities: { completion_chat: true } },
    { id: 'mistral-embed', type: 'base', capabilities: { completion_chat: false } }
  ] }, 'mistral');
  assert.equal(mistral[0].metadata.chat, true);
  assert.equal(mistral[1].metadata.chat, false);

  const together = extractProviderModelManifest([
    { id: 'org/chat-model', type: 'chat' },
    { id: 'org/embed-model', type: 'embedding' }
  ], 'together');
  assert.equal(together[0].metadata.chat, true);
  assert.equal(together[1].metadata.chat, false);

  const xai = extractProviderModelManifest({ models: [
    { id: 'grok-chat', output_modalities: ['text'], input_modalities: ['text'] },
    { id: 'grok-image', output_modalities: ['image'], input_modalities: ['text'] }
  ] }, 'xai');
  assert.equal(xai[0].metadata.chat, true);
  assert.equal(xai[1].metadata.chat, false);
});

test('RT92 model discovery asks Gemini for a full bounded page and xAI for language models only', () => {
  assert.equal(PROVIDERS.gemini.modelsUrl, 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000');
  assert.equal(PROVIDERS.xai.modelsUrl, 'https://api.x.ai/v1/language-models');
  assert.equal(AI_PROVIDER_CONTRACTS.gemini.modelsUrl, PROVIDERS.gemini.modelsUrl);
  assert.equal(AI_PROVIDER_CONTRACTS.xai.modelsUrl, PROVIDERS.xai.modelsUrl);
});

test('RT92 Groq tier-specific deprecations are avoided automatically but remain usable for verified Enterprise accounts', () => {
  assert.equal(evaluateAiProviderModelCompatibility('groq', 'llama-3.1-8b-instant').allowed, true);
  assert.equal(evaluateAiProviderModelCompatibility('groq', 'llama-3.3-70b-versatile').allowed, true);
  const chosen = selectBestChatModel(
    ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3.6-27b'],
    'groq',
    { mode: 'auto' }
  );
  assert.notEqual(chosen, 'llama-3.3-70b-versatile');
});

test('RT92 realistic OpenAI catalogue never promotes legacy/base/specialized models above current chat families', () => {
  const rows = [
    'babbage-002',
    'davinci-002',
    'gpt-4o-realtime-preview',
    'gpt-4o-search-preview',
    'gpt-image-1',
    'text-embedding-3-large',
    'gpt-4.1',
    'gpt-5',
    'gpt-5-mini'
  ];
  const filtered = filterChatCapableModels(rows, 'openai');
  assert.deepEqual(filtered.includes('babbage-002'), false);
  assert.deepEqual(filtered.includes('davinci-002'), false);
  assert.deepEqual(filtered.includes('gpt-4o-realtime-preview'), false);
  assert.deepEqual(filtered.includes('gpt-image-1'), false);
  assert.ok(['gpt-5', 'gpt-5-mini'].includes(selectBestChatModel(rows, 'openai', { mode: 'auto' })));
});


test('RT92 model policy prefers full current chat generations for Auto/Best and compact variants for Fast/Economy', () => {
  const rows = ['gpt-4.1', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano'];
  assert.equal(selectBestChatModel(rows, 'openai', { mode: 'auto' }), 'gpt-5');
  assert.equal(selectBestChatModel(rows, 'openai', { mode: 'best' }), 'gpt-5');
  assert.equal(selectBestChatModel(rows, 'openai', { mode: 'fast' }), 'gpt-5-mini');
  assert.equal(selectBestChatModel(rows, 'openai', { mode: 'economy' }), 'gpt-5-mini');
});

test('RT92 Groq remains on the reviewed OpenAI-compatible SSE streaming path', () => {
  const runtime = read('assets/js/chat/ai-runtime.js');
  assert.match(runtime, /BATCH_ONLY_PROVIDERS = new Set\(\['guide', 'cohere', 'browserlocal', 'ollama', 'lmstudio', 'jan'\]\)/);
  assert.doesNotMatch(runtime, /BATCH_ONLY_PROVIDERS = new Set\([^\n]*'groq'/);
  assert.match(runtime, /buildOpenAICompatibleChatPayload\(runtimeSettings, messages, cappedBudget, \{ stream: true \}\)/);
});


test('RT92 Fireworks discovery uses the documented full serverless page and admits only Chat-Completions-enabled models', () => {
  assert.equal(PROVIDERS.fireworks.modelsUrl, 'https://api.fireworks.ai/v1/accounts/fireworks/models?filter=supports_serverless%3Dtrue&pageSize=200');
  assert.equal(AI_PROVIDER_CONTRACTS.fireworks.modelsUrl, PROVIDERS.fireworks.modelsUrl);
  const manifest = extractProviderModelManifest({ models: [
    { name: 'accounts/fireworks/models/chat-ready', conversationConfig: { contextLength: 32768 }, supportsServerless: true },
    { name: 'accounts/fireworks/models/not-chat', supportsServerless: true }
  ] }, 'fireworks');
  assert.equal(manifest[0].metadata.chat, true);
  assert.equal(manifest[1].metadata.chat, false);
});


test('RT92 xAI Auto/Best follows current discovered Grok generation rather than alphabetical model order', () => {
  const rows = ['grok-4.3', 'grok-4.5'];
  assert.equal(selectBestChatModel(rows, 'xai', { mode: 'auto' }), 'grok-4.5');
  assert.equal(selectBestChatModel(rows, 'xai', { mode: 'best' }), 'grok-4.5');
  assert.equal(selectBestChatModel(rows, 'xai', { mode: 'fast' }), 'grok-4.5');
});

test('RT92 canonical inference never revives a legacy plaintext device API key', () => {
  const priorLocal = globalThis.localStorage;
  const priorSession = globalThis.sessionStorage;
  const makeStorage = (entries = {}) => {
    const rows = new Map(Object.entries(entries));
    return {
      getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
      setItem(key, value) { rows.set(String(key), String(value)); },
      removeItem(key) { rows.delete(String(key)); },
      key(index) { return Array.from(rows.keys())[index] ?? null; },
      get length() { return rows.size; }
    };
  };
  globalThis.localStorage = makeStorage({
    'eon:ai-chat-device-keys:v1': JSON.stringify({ openai: 'sk-legacy-plaintext' })
  });
  globalThis.sessionStorage = makeStorage();
  try {
    assert.equal(getApiKey('openai'), '', 'legacy plaintext localStorage must never authorize inference');
    globalThis.sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ openai: 'sk-session-only' }));
    assert.equal(getApiKey('openai'), 'sk-session-only');
  } finally {
    if (priorLocal === undefined) delete globalThis.localStorage; else globalThis.localStorage = priorLocal;
    if (priorSession === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = priorSession;
  }
});


test('RT92 credential-bearing AI surfaces never load aggregate third-party analytics', () => {
  for (const relative of ['index.html', 'chat.html', 'vault.html', 'local-ai.html', 'create.html', 'eoncity.html']) {
    const html = read(relative);
    assert.match(html, /<body[^>]*data-eon-analytics=["']off["']/i, `${relative} must disable aggregate analytics while AI credentials may be live`);
  }
  const bridge = read('assets/js/utils/analytics-bridge.js');
  assert.match(bridge, /value === 'off' \|\| value === 'disabled'/);
  assert.match(bridge, /isAnalyticsExplicitlyDisabled\(doc\)/);
});
