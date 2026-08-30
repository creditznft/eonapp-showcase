#!/usr/bin/env node
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const argValue = (name, fallback = '') => {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  const match = args.find((arg) => arg.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : fallback;
};
const hasFlag = (name) => args.includes(name);

const envFile = resolve(argValue('--env', process.env.EONAPP_ENV_FILE || '.env.local'));
if (existsSync(envFile)) {
  dotenv.config({ path: envFile, override: false });
} else {
  dotenv.config({ path: '.env.local', override: false });
  dotenv.config({ override: false });
}

const runRemote = !hasFlag('--no-remote');
const runLocal = !hasFlag('--no-local');
const runBrowser = !hasFlag('--no-browser');
const strict = hasFlag('--strict');
const requireKeys = hasFlag('--require-keys');
const allOllama = hasFlag('--all-ollama');
const timeoutMs = Number(argValue('--timeout-ms', process.env.EON_LIVE_AI_TIMEOUT_MS || '30000'));
const localTimeoutMs = Number(argValue('--local-timeout-ms', process.env.EON_LIVE_AI_LOCAL_TIMEOUT_MS || '45000'));
const localModelLimit = Math.max(1, Number(argValue('--local-model-limit', process.env.EON_LIVE_AI_LOCAL_MODEL_LIMIT || (allOllama ? '999' : '10'))));
const baseUrl = String(argValue('--app-url', process.env.EONAPP_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:4173')).replace(/\/$/, '');
const ollamaBaseUrl = String(process.env.OLLAMA_BASE_URL || process.env.EON_OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const lmStudioBaseUrl = String(process.env.LMSTUDIO_BASE_URL || process.env.EON_LMSTUDIO_BASE_URL || 'http://127.0.0.1:1234').replace(/\/$/, '');
const janBaseUrl = String(process.env.JAN_BASE_URL || process.env.EON_JAN_BASE_URL || 'http://127.0.0.1:1337').replace(/\/$/, '');
const runTag = new Date().toISOString().replace(/[:.]/g, '-');
const docsDir = join(process.cwd(), 'CodexDocs');
const proofDir = join(process.cwd(), 'docs', 'qa', 'live-ai-supertest', runTag);
mkdirSync(docsDir, { recursive: true });
mkdirSync(proofDir, { recursive: true });

const results = [];
const discoveredLocalModels = new Map();
const screenshots = [];
const sentinel = 'EON LIVE OK';
const prompt = `Reply with exactly: ${sentinel}`;

const envAliases = (...names) => {
  for (const name of names) {
    const value = String(process.env[name] || '').trim();
    if (value) return { name, value };
  }
  return { name: names[0], value: '' };
};

const mask = (value) => {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return '*'.repeat(text.length);
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
};

const isPlaceholder = (value) => {
  const text = String(value || '').trim();
  if (!text) return false;
  return /^(test|demo|todo|changeme|replace(_me)?|your_|xxx|none|null|undefined)$/i.test(text)
    || /(placeholder|example|sample|dummy|fake[_-]?key|replace[_-]?me|\.\.\.)/i.test(text);
};
const short = (value, max = 320) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

function record(area, name, status, detail = '', extra = {}) {
  const row = {
    area,
    name,
    status,
    detail: short(detail),
    ...extra,
    at: new Date().toISOString()
  };
  results.push(row);
  const icon = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : status === 'WARN' ? 'WARN' : 'SKIP';
  console.log(`[${icon}] ${area} · ${name}${detail ? ` — ${short(detail, 180)}` : ''}`);
  return row;
}

async function fetchText(url, options = {}, timeout = timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeout = timeoutMs) {
  const { response, text } = await fetchText(url, options, timeout);
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { response, text, json };
}

const isLimitOrBilling = (status, text = '') => {
  const body = String(text || '').toLowerCase();
  return status === 402 || status === 429 || body.includes('quota') || body.includes('billing') || body.includes('insufficient') || body.includes('credit limit') || body.includes('rate limit');
};

const isAuthFailure = (status, text = '') => {
  const body = String(text || '').toLowerCase();
  return status === 401
    || status === 403
    || body.includes('authentication fails')
    || body.includes('invalid api key')
    || body.includes('unauthorized')
    || body.includes('forbidden');
};

const blockedModel = /(whisper|tts|audio|speech|embed|embedding|rerank|moderation|vision|image|dall|clip|guard|safety|tokenizer|transcrib|asr|stable-diffusion)/i;
const preferredModel = /(gpt|chat|instruct|llama|qwen|deepseek|mistral|mixtral|gemma|command|sonnet|haiku|opus|grok|glm|kimi|coder|versatile|flash|pro|mini|turbo)/i;

function modelIdOf(item) {
  return String(item?.id || item?.name || item?.model || '').trim();
}

function normalizeModelList(json) {
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.models)) return json.models;
  if (Array.isArray(json)) return json;
  return [];
}

function selectChatModel(list, fallback = '') {
  const ids = normalizeModelList(list).map(modelIdOf).filter(Boolean);
  const clean = ids.filter((id) => !blockedModel.test(id));
  const preferred = clean.find((id) => preferredModel.test(id));
  return preferred || clean[0] || fallback;
}

function chatTextFromOpenAICompatible(json) {
  return String(json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '').trim();
}

async function probeOpenAICompatible(provider) {
  const envHit = envAliases(...provider.envKeys);
  if (!envHit.value) {
    record('remote', provider.id, requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} not set`);
    return;
  }
  if (isPlaceholder(envHit.value)) {
    record('remote', provider.id, requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} looks like placeholder (${mask(envHit.value)})`);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${envHit.value}`,
    ...(provider.headers || {})
  };

  let model = provider.defaultModel;
  let discoveryStatus = 'not-run';
  try {
    if (provider.modelsUrl) {
      const models = await fetchJson(provider.modelsUrl, { headers: { Authorization: `Bearer ${envHit.value}`, ...(provider.modelHeaders || {}) } }, Math.min(timeoutMs, 20000));
      discoveryStatus = `${models.response.status}`;
      if (models.response.ok) {
        model = selectChatModel(models.json, provider.defaultModel);
        record('remote-discovery', provider.id, model ? 'PASS' : 'FAIL', `${normalizeModelList(models.json).length} model(s); selected ${model || 'none'}`, { model, envKey: envHit.name });
      } else if (isLimitOrBilling(models.response.status, models.text)) {
        record('remote-discovery', provider.id, 'WARN', `Provider limit during discovery: HTTP ${models.response.status}`, { envKey: envHit.name });
      } else {
        record('remote-discovery', provider.id, 'WARN', `Discovery HTTP ${models.response.status}; using fallback ${model}`, { envKey: envHit.name });
      }
    }
  } catch (err) {
    record('remote-discovery', provider.id, 'WARN', `Discovery failed; using fallback ${model}: ${err?.message || err}`, { envKey: envHit.name });
  }

  if (!model || blockedModel.test(model) || model === 'auto') {
    record('remote', provider.id, 'FAIL', `Resolved invalid chat model: ${model || 'none'}`, { model, discoveryStatus });
    return;
  }

  try {
    const payload = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: provider.maxTokens || 32,
      temperature: 0,
      ...(provider.payload || {})
    };
    const { response, text, json } = await fetchJson(`${provider.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }, timeoutMs);
    const output = chatTextFromOpenAICompatible(json) || text;
    if (response.ok) {
      record('remote-chat', provider.id, output.includes(sentinel) ? 'PASS' : 'WARN', `HTTP ${response.status}; model ${model}; output: ${short(output, 180)}`, { model, envKey: envHit.name });
    } else if (isLimitOrBilling(response.status, text)) {
      record('remote-chat', provider.id, 'WARN', `Provider limit/billing response HTTP ${response.status}: ${short(text, 220)}`, { model, envKey: envHit.name });
    } else if (isAuthFailure(response.status, text)) {
      record('remote-chat', provider.id, 'WARN', `Provider auth rejected HTTP ${response.status}: ${short(text, 220)}`, { model, envKey: envHit.name });
    } else {
      record('remote-chat', provider.id, 'FAIL', `HTTP ${response.status}: ${short(text, 260)}`, { model, envKey: envHit.name });
    }
  } catch (err) {
    record('remote-chat', provider.id, 'FAIL', String(err?.message || err), { model, envKey: envHit.name });
  }
}

async function probeGemini() {
  const envHit = envAliases('EON_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY');
  if (!envHit.value) return record('remote', 'gemini', requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} not set`);
  if (isPlaceholder(envHit.value)) return record('remote', 'gemini', requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} placeholder (${mask(envHit.value)})`);
  let model = process.env.EON_GEMINI_MODEL || 'gemini-2.0-flash';
  try {
    const discovery = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(envHit.value)}`, {}, Math.min(timeoutMs, 20000));
    if (discovery.response.ok) {
      const models = Array.isArray(discovery.json?.models) ? discovery.json.models : [];
      const usable = models.filter((m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
      const preferred = usable.find((m) => /gemini.*(2\.5|2\.0).*flash/i.test(m.name || '')) || usable.find((m) => /gemini.*flash/i.test(m.name || '')) || usable[0];
      if (preferred?.name) model = String(preferred.name).replace(/^models\//, '');
      record('remote-discovery', 'gemini', 'PASS', `${usable.length} generateContent model(s); selected ${model}`, { model, envKey: envHit.name });
    } else {
      record('remote-discovery', 'gemini', 'WARN', `HTTP ${discovery.response.status}; using fallback ${model}`, { envKey: envHit.name });
    }
  } catch (err) {
    record('remote-discovery', 'gemini', 'WARN', `Discovery failed; using fallback ${model}: ${err?.message || err}`, { envKey: envHit.name });
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(envHit.value)}`;
    const { response, text, json } = await fetchJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 32 }
      })
    }, timeoutMs);
    const output = String(json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || text).trim();
    if (response.ok) record('remote-chat', 'gemini', output.includes(sentinel) ? 'PASS' : 'WARN', `HTTP ${response.status}; model ${model}; output: ${short(output, 180)}`, { model, envKey: envHit.name });
    else if (isLimitOrBilling(response.status, text)) record('remote-chat', 'gemini', 'WARN', `Provider limit/billing HTTP ${response.status}: ${short(text, 220)}`, { model, envKey: envHit.name });
    else record('remote-chat', 'gemini', 'FAIL', `HTTP ${response.status}: ${short(text, 260)}`, { model, envKey: envHit.name });
  } catch (err) {
    record('remote-chat', 'gemini', 'FAIL', String(err?.message || err), { model, envKey: envHit.name });
  }
}

async function probeAnthropic() {
  const envHit = envAliases('EON_ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY');
  if (!envHit.value) return record('remote', 'anthropic', requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} not set`);
  if (isPlaceholder(envHit.value)) return record('remote', 'anthropic', requireKeys ? 'FAIL' : 'SKIP', `${envHit.name} placeholder (${mask(envHit.value)})`);
  const model = process.env.EON_ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
  try {
    const { response, text, json } = await fetchJson('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': envHit.value,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model, max_tokens: 32, temperature: 0, messages: [{ role: 'user', content: prompt }] })
    }, timeoutMs);
    const output = String(json?.content?.map((part) => part.text || '').join('') || text).trim();
    if (response.ok) record('remote-chat', 'anthropic', output.includes(sentinel) ? 'PASS' : 'WARN', `HTTP ${response.status}; model ${model}; output: ${short(output, 180)}`, { model, envKey: envHit.name });
    else if (isLimitOrBilling(response.status, text)) record('remote-chat', 'anthropic', 'WARN', `Provider limit/billing HTTP ${response.status}: ${short(text, 220)}`, { model, envKey: envHit.name });
    else record('remote-chat', 'anthropic', 'FAIL', `HTTP ${response.status}: ${short(text, 260)}`, { model, envKey: envHit.name });
  } catch (err) {
    record('remote-chat', 'anthropic', 'FAIL', String(err?.message || err), { model, envKey: envHit.name });
  }
}

async function probeOllama() {
  try {
    const tags = await fetchJson(`${ollamaBaseUrl}/api/tags`, {}, Math.min(localTimeoutMs, 10000));
    if (!tags.response.ok) {
      record('local-discovery', 'ollama', 'FAIL', `HTTP ${tags.response.status}: ${short(tags.text, 200)}`);
      return;
    }
    const models = Array.isArray(tags.json?.models) ? tags.json.models : [];
    const names = models.map((m) => String(m?.name || m?.model || '').trim()).filter(Boolean);
    discoveredLocalModels.set('ollama', names);
    record('local-discovery', 'ollama', names.length ? 'PASS' : 'WARN', `${names.length} model(s) visible at ${ollamaBaseUrl}${names.length ? `: ${names.slice(0, 8).join(', ')}` : ''}`);
    const toTest = names.filter((name) => !blockedModel.test(name)).slice(0, localModelLimit);
    if (!toTest.length) {
      record('local-chat', 'ollama', 'WARN', 'No chat-like Ollama models selected for generation test');
      return;
    }
    for (const model of toTest) {
      try {
        const { response, text, json } = await fetchJson(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, stream: false, messages: [{ role: 'user', content: prompt }], options: { temperature: 0, num_predict: 32 } })
        }, localTimeoutMs);
        const output = String(json?.message?.content || json?.response || text).trim();
        if (response.ok) record('local-chat', `ollama:${model}`, output.includes(sentinel) ? 'PASS' : 'WARN', `HTTP ${response.status}; output: ${short(output, 180)}`, { model });
        else record('local-chat', `ollama:${model}`, 'FAIL', `HTTP ${response.status}: ${short(text, 260)}`, { model });
      } catch (err) {
        record('local-chat', `ollama:${model}`, 'FAIL', String(err?.message || err), { model });
      }
    }
  } catch (err) {
    record('local-discovery', 'ollama', 'SKIP', `Ollama not reachable at ${ollamaBaseUrl}: ${err?.message || err}`);
  }
}

async function probeOpenAILocal(id, baseUrl) {
  try {
    const models = await fetchJson(`${baseUrl}/v1/models`, {}, Math.min(localTimeoutMs, 10000));
    if (!models.response.ok) {
      record('local-discovery', id, 'FAIL', `HTTP ${models.response.status}: ${short(models.text, 200)}`);
      return;
    }
    const list = normalizeModelList(models.json);
    const names = list.map(modelIdOf).filter(Boolean);
    discoveredLocalModels.set(id, names);
    const model = selectChatModel(list, names[0] || '');
    record('local-discovery', id, names.length ? 'PASS' : 'WARN', `${names.length} model(s) visible at ${baseUrl}; selected ${model || 'none'}`);
    if (!model) return;
    const { response, text, json } = await fetchJson(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 32, temperature: 0 })
    }, localTimeoutMs);
    const output = chatTextFromOpenAICompatible(json) || text;
    if (response.ok) record('local-chat', `${id}:${model}`, output.includes(sentinel) ? 'PASS' : 'WARN', `HTTP ${response.status}; output: ${short(output, 180)}`, { model });
    else record('local-chat', `${id}:${model}`, 'FAIL', `HTTP ${response.status}: ${short(text, 260)}`, { model });
  } catch (err) {
    record('local-discovery', id, 'SKIP', `${id} not reachable at ${baseUrl}: ${err?.message || err}`);
  }
}

async function runRemoteTests() {
  const providers = [
    {
      id: 'openai',
      envKeys: ['EON_OPENAI_API_KEY', 'OPENAI_API_KEY'],
      baseUrl: 'https://api.openai.com/v1',
      modelsUrl: 'https://api.openai.com/v1/models',
      defaultModel: process.env.EON_OPENAI_MODEL || 'gpt-4o-mini'
    },
    {
      id: 'groq',
      envKeys: ['EON_GROQ_API_KEY', 'GROQ_API_KEY'],
      baseUrl: 'https://api.groq.com/openai/v1',
      modelsUrl: 'https://api.groq.com/openai/v1/models',
      defaultModel: process.env.EON_GROQ_MODEL || 'openai/gpt-oss-120b'
    },
    {
      id: 'cerebras',
      envKeys: ['EON_CEREBRAS_API_KEY', 'CEREBRAS_API_KEY'],
      baseUrl: 'https://api.cerebras.ai/v1',
      modelsUrl: 'https://api.cerebras.ai/v1/models',
      defaultModel: process.env.EON_CEREBRAS_MODEL || 'llama3.1-8b'
    },
    {
      id: 'openrouter',
      envKeys: ['EON_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'],
      baseUrl: 'https://openrouter.ai/api/v1',
      modelsUrl: 'https://openrouter.ai/api/v1/models',
      defaultModel: process.env.EON_OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      headers: { 'HTTP-Referer': process.env.EONAPP_PUBLIC_URL || 'https://eonapp.ch', 'X-Title': 'EONAPP AI Live Supertest' }
    },
    {
      id: 'mistral',
      envKeys: ['EON_MISTRAL_API_KEY', 'MISTRAL_API_KEY'],
      baseUrl: 'https://api.mistral.ai/v1',
      modelsUrl: 'https://api.mistral.ai/v1/models',
      defaultModel: process.env.EON_MISTRAL_MODEL || 'mistral-small-latest'
    },
    {
      id: 'deepseek',
      envKeys: ['EON_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'],
      baseUrl: 'https://api.deepseek.com',
      modelsUrl: 'https://api.deepseek.com/models',
      defaultModel: process.env.EON_DEEPSEEK_MODEL || 'deepseek-v4-flash'
    },
    {
      id: 'together',
      envKeys: ['EON_TOGETHER_API_KEY', 'TOGETHER_API_KEY'],
      baseUrl: 'https://api.together.xyz/v1',
      modelsUrl: 'https://api.together.xyz/v1/models',
      defaultModel: process.env.EON_TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'
    },
    {
      id: 'fireworks',
      envKeys: ['EON_FIREWORKS_API_KEY', 'FIREWORKS_API_KEY'],
      baseUrl: 'https://api.fireworks.ai/inference/v1',
      modelsUrl: 'https://api.fireworks.ai/inference/v1/models',
      defaultModel: process.env.EON_FIREWORKS_MODEL || 'accounts/fireworks/models/llama-v3p1-8b-instruct'
    },
    {
      id: 'nvidia',
      envKeys: ['EON_NVIDIA_API_KEY', 'NVIDIA_API_KEY', 'NVIDIA_NIM_API_KEY'],
      baseUrl: 'https://integrate.api.nvidia.com/v1',
      modelsUrl: 'https://integrate.api.nvidia.com/v1/models',
      defaultModel: process.env.EON_NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct'
    },
    {
      id: 'sambanova',
      envKeys: ['EON_SAMBANOVA_API_KEY', 'SAMBANOVA_API_KEY'],
      baseUrl: 'https://api.sambanova.ai/v1',
      modelsUrl: 'https://api.sambanova.ai/v1/models',
      defaultModel: process.env.EON_SAMBANOVA_MODEL || 'Meta-Llama-3.1-8B-Instruct'
    },
    {
      id: 'huggingface-router',
      envKeys: ['EON_HUGGINGFACE_API_KEY', 'HUGGINGFACE_API_KEY', 'HF_TOKEN'],
      baseUrl: 'https://router.huggingface.co/v1',
      modelsUrl: '',
      defaultModel: process.env.EON_HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-Coder-7B-Instruct'
    },
    {
      id: 'xai',
      envKeys: ['EON_XAI_API_KEY', 'XAI_API_KEY'],
      baseUrl: 'https://api.x.ai/v1',
      modelsUrl: 'https://api.x.ai/v1/models',
      defaultModel: process.env.EON_XAI_MODEL || 'grok-3-mini'
    },
    {
      id: 'qwen-dashscope',
      envKeys: ['EON_QWEN_API_KEY', 'EON_DASHSCOPE_API_KEY', 'DASHSCOPE_API_KEY', 'QWEN_API_KEY'],
      baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
      modelsUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
      defaultModel: process.env.EON_QWEN_MODEL || 'qwen-plus'
    }
  ];

  for (const provider of providers) await probeOpenAICompatible(provider);
  await probeGemini();
  await probeAnthropic();
}

async function runLocalTests() {
  await probeOllama();
  await probeOpenAILocal('lmstudio', lmStudioBaseUrl);
  await probeOpenAILocal('jan', janBaseUrl);
}

async function appReachable() {
  try {
    const { response } = await fetchText(baseUrl, {}, 5000);
    return response.ok;
  } catch {
    return false;
  }
}

async function runBrowserAppTests() {
  const reachable = await appReachable();
  if (!reachable) {
    record('browser-app', 'server', 'SKIP', `App not reachable at ${baseUrl}. Start it with: npm run dev -- --host 127.0.0.1 or npm run build && npx vite preview --host 127.0.0.1 --port 4173`);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
    const pages = [
      { path: '/onboarding.html', localExpected: true },
      { path: '/chat.html', localExpected: true },
      { path: '/vault.html', localExpected: false },
      { path: '/realm.html', localExpected: false },
      { path: '/trade.html', localExpected: false },
      { path: '/hustle.html', localExpected: false }
    ];
    const ollamaNames = discoveredLocalModels.get('ollama') || [];
    for (const item of pages) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) consoleErrors.push(message.text());
      });
      page.on('pageerror', (err) => consoleErrors.push(String(err?.message || err)));
      const url = `${baseUrl}${item.path}`;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        record('browser-page', item.path, response?.ok() ? 'PASS' : 'FAIL', `HTTP ${response?.status() || 'n/a'} ${url}`);
        await page.waitForTimeout(1000);
        const body = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
        const localMentions = /ollama|local ai|local model|detect local|lm studio|jan/i.test(body);
        if (item.localExpected) {
          record('browser-local-ui', item.path, localMentions ? 'PASS' : 'WARN', localMentions ? 'Local AI/Ollama UI copy visible' : 'Local AI/Ollama UI copy not obvious on this page');
        }
        const detect = page.locator('button, a, [role="button"]').filter({ hasText: /detect local|local ai|ollama|scan local/i }).first();
        if (await detect.count().catch(() => 0)) {
          await detect.click({ timeout: 5000 }).catch(() => null);
          await page.waitForTimeout(3500);
          const after = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
          const visibleModel = ollamaNames.find((name) => name && after.toLowerCase().includes(name.toLowerCase().split(':')[0]));
          record('browser-local-detect', item.path, visibleModel || !ollamaNames.length ? 'PASS' : 'WARN', visibleModel ? `Detected Ollama model visible in app: ${visibleModel}` : 'Detect action clicked; no local model name found in page text', { visibleModel: visibleModel || '' });
        }
        if (ollamaNames.length) {
          const cspFetch = await page.evaluate(async (ollamaUrl) => {
            try {
              const response = await fetch(`${ollamaUrl}/api/tags`);
              const json = await response.json().catch(() => null);
              return { ok: response.ok, status: response.status, count: Array.isArray(json?.models) ? json.models.length : 0 };
            } catch (err) {
              return { ok: false, status: 0, error: String(err?.message || err) };
            }
          }, ollamaBaseUrl);
          record('browser-csp-localhost', item.path, cspFetch.ok ? 'PASS' : 'FAIL', cspFetch.ok ? `Browser page can fetch ${ollamaBaseUrl}/api/tags (${cspFetch.count} model(s))` : `Browser page could not fetch local Ollama: ${cspFetch.error || cspFetch.status}`);
        }
        const cspErrors = consoleErrors.filter((line) => /content security policy|refused to connect|violates.*connect-src|violates.*frame-src/i.test(line));
        record('browser-console', item.path, cspErrors.length ? 'FAIL' : 'PASS', cspErrors.length ? cspErrors.slice(0, 3).join(' | ') : 'No CSP console violations captured');
        const shot = join(proofDir, `${item.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}.png`);
        await page.screenshot({ path: shot, fullPage: true }).catch(() => null);
        screenshots.push(shot);
      } catch (err) {
        record('browser-page', item.path, 'FAIL', String(err?.message || err));
      } finally {
        await page.close().catch(() => null);
      }
    }
    await context.close();
  } finally {
    await browser.close().catch(() => null);
  }
}

function completionStatus() {
  const hardFails = results.filter((r) => r.status === 'FAIL');
  const warnings = results.filter((r) => r.status === 'WARN');
  const passes = results.filter((r) => r.status === 'PASS');
  const skips = results.filter((r) => r.status === 'SKIP');
  return { hardFails, warnings, passes, skips };
}

function writeReports() {
  const status = completionStatus();
  const jsonPath = join(proofDir, 'ai-live-supertest-results.json');
  const mdPath = join(docsDir, 'EONAPP_AI_LIVE_SUPERTEST_RESULTS.md');
  const latestJson = join(docsDir, 'EONAPP_AI_LIVE_SUPERTEST_RESULTS.json');
  writeFileSync(jsonPath, JSON.stringify({ runTag, envFile, baseUrl, ollamaBaseUrl, strict, results, screenshots }, null, 2));
  writeFileSync(latestJson, JSON.stringify({ runTag, envFile, baseUrl, ollamaBaseUrl, strict, results, screenshots }, null, 2));
  const lines = [];
  lines.push('# EONAPP AI Live Supertest Results');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Env file attempted: \`${envFile}\``);
  lines.push(`App URL: \`${baseUrl}\``);
  lines.push(`Ollama URL: \`${ollamaBaseUrl}\``);
  lines.push('');
  lines.push(`Summary: ${status.passes.length} pass, ${status.warnings.length} warn, ${status.skips.length} skip, ${status.hardFails.length} fail.`);
  lines.push('');
  lines.push('| Area | Test | Status | Detail |');
  lines.push('|---|---:|---:|---|');
  for (const row of results) {
    lines.push(`| ${row.area} | ${row.name} | ${row.status} | ${String(row.detail || '').replace(/\|/g, '\\|')} |`);
  }
  if (screenshots.length) {
    lines.push('');
    lines.push('## Screenshots');
    for (const shot of screenshots) lines.push(`- ${shot}`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('- This report never writes API key values. It only reports env key names and masked existence.');
  lines.push('- `WARN` can mean the provider works but did not echo the exact sentinel, or the provider returned quota/billing/rate-limit while the key was structurally accepted.');
  lines.push('- `SKIP` for local runtimes means the service was not reachable from the test machine. Start Ollama/LM Studio/Jan and rerun.');
  writeFileSync(mdPath, lines.join('\n'));
  console.log(`\nReports written:\n- ${mdPath}\n- ${jsonPath}`);
  return status;
}

async function main() {
  console.log('EONAPP AI Live Supertest');
  console.log(`Env: ${envFile}${existsSync(envFile) ? '' : ' (not found; also checked process env)'}`);
  console.log(`App: ${baseUrl}`);
  console.log(`Ollama: ${ollamaBaseUrl}`);
  console.log(`Mode: remote=${runRemote} local=${runLocal} browser=${runBrowser} strict=${strict}`);

  if (runRemote) await runRemoteTests();
  else record('remote', 'matrix', 'SKIP', '--no-remote set');

  if (runLocal) await runLocalTests();
  else record('local', 'matrix', 'SKIP', '--no-local set');

  if (runBrowser) await runBrowserAppTests();
  else record('browser-app', 'matrix', 'SKIP', '--no-browser set');

  const status = writeReports();
  if (strict && status.hardFails.length) {
    console.error(`\nStrict mode failed with ${status.hardFails.length} hard failure(s).`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  record('runner', 'fatal', 'FAIL', String(err?.stack || err));
  writeReports();
  process.exitCode = 1;
});
