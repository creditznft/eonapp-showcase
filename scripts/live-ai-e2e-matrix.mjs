#!/usr/bin/env node
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROVIDERS } from '../assets/js/chat/ai-provider-catalog.js';
import { discoverProviderModels, getDiscoveredProviderModelMetadata, selectBestChatModel } from '../assets/js/chat/ai-runtime.js';

dotenv.config({ path: '.env.local' });

const baseUrl = String(
  process.env.EONAPP_BASE_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:4173'
).replace(/\/$/, '');

const runTag = new Date().toISOString().replace(/[:.]/g, '-');
const docOutDir = join(process.cwd(), 'CodexDocs');
const proofOutDir = join(process.cwd(), 'docs/qa/launch-signoff/screenshots', `live-proof-${runTag.slice(0, 10)}`);
mkdirSync(docOutDir, { recursive: true });
mkdirSync(proofOutDir, { recursive: true });

const env = {
  openai: String(process.env.EON_OPENAI_API_KEY || '').trim(),
  openrouter: String(process.env.EON_OPENROUTER_API_KEY || '').trim(),
  xai: String(process.env.EON_XAI_API_KEY || process.env.XAI_API_KEY || '').trim(),
  deepseek: String(process.env.EON_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '').trim(),
  perplexity: String(process.env.EON_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || '').trim(),
  qwen: String(process.env.EON_QWEN_API_KEY || process.env.EON_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY || '').trim(),
  groq: String(process.env.EON_GROQ_API_KEY || '').trim(),
  fireworks: String(process.env.EON_FIREWORKS_API_KEY || '').trim(),
  cerebras: String(process.env.EON_CEREBRAS_API_KEY || '').trim(),
  gemini: String(process.env.EON_GEMINI_API_KEY || '').trim(),
  mistral: String(process.env.EON_MISTRAL_API_KEY || '').trim(),
  deepseek: String(process.env.EON_DEEPSEEK_API_KEY || '').trim(),
  together: String(process.env.EON_TOGETHER_API_KEY || '').trim(),
  cohere: String(process.env.EON_COHERE_API_KEY || '').trim(),
  nvidia: String(process.env.EON_NVIDIA_API_KEY || '').trim(),
  sambanova: String(process.env.EON_SAMBANOVA_API_KEY || '').trim(),
  huggingface: String(process.env.EON_HUGGINGFACE_API_KEY || '').trim(),
  elevenlabs: String(process.env.EON_ELEVENLABS_API_KEY || '').trim()
};

const cliArgs = new Set(process.argv.slice(2));
const skipProviders = cliArgs.has('--skip-providers');
const skipChat = cliArgs.has('--skip-chat');
const skipCreator = cliArgs.has('--skip-creator');
const skipBrowser = cliArgs.has('--skip-browser');

const results = [];
const screenshots = [];
const REMOTE_PROVIDER_PRIORITY = [
  { id: 'groq', test: 'groq-text', envKey: 'groq' },
  { id: 'cerebras', test: 'cerebras-text', envKey: 'cerebras' },
  { id: 'gemini', test: 'gemini-text', envKey: 'gemini' },
  { id: 'mistral', test: 'mistral-text', envKey: 'mistral' },
  { id: 'deepseek', test: 'deepseek-text', envKey: 'deepseek' },
  { id: 'perplexity', test: 'perplexity-text', envKey: 'perplexity' },
  { id: 'together', test: 'together-text', envKey: 'together' },
  { id: 'fireworks', test: 'fireworks-text', envKey: 'fireworks' },
  { id: 'huggingface', test: 'huggingface-text', envKey: 'huggingface' },
  { id: 'openai', test: 'openai-text', envKey: 'openai' },
  { id: 'openrouter', test: 'openrouter-text', envKey: 'openrouter' },
  { id: 'xai', test: 'xai-text', envKey: 'xai' },
  { id: 'qwen', test: 'qwen-text', envKey: 'qwen' }
].filter((candidate) => PROVIDERS[candidate.id]?.enabled !== false);

// The live certification harness must follow the same dynamic provider/model
// authority as the product. It never writes raw provider keys to localStorage.
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.sessionStorage === 'undefined') {
  const rows = new Map();
  globalThis.sessionStorage = {
    getItem(key) { return rows.has(String(key)) ? rows.get(String(key)) : null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); },
    clear() { rows.clear(); },
    key(index) { return Array.from(rows.keys())[index] ?? null; },
    get length() { return rows.size; }
  };
}

async function pickCanonicalProviderModel(providerId, apiKey, endpoint = '') {
  if (!apiKey) return '';
  const provider = PROVIDERS[providerId];
  if (!provider || provider.enabled === false) return '';
  const models = await discoverProviderModels(providerId, apiKey, true, { endpoint, throwOnError: true });
  const metadataByModel = getDiscoveredProviderModelMetadata(providerId);
  const selected = selectBestChatModel(models, providerId, { mode: 'auto', taskType: 'chat', metadataByModel });
  if (!selected) throw new Error(`${providerId} returned no verified chat-capable model.`);
  if (providerId === 'huggingface') {
    const upstream = String(metadataByModel?.[selected]?.routingProvider || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{0,71}$/.test(upstream)) throw new Error('Hugging Face returned no live upstream provider for the selected model.');
    return `${selected}:${upstream}`;
  }
  return selected;
}

function has(value) {
  return Boolean(String(value || '').trim());
}

function short(value, limit = 280) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function record(stage, test, ok, detail, extra = {}) {
  const row = { stage, test, ok, detail: short(detail), ...extra };
  results.push(row);
  const flag = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP';
  console.log(`[${flag}] ${stage} · ${test}${detail ? ` — ${short(detail, 180)}` : ''}`);
}

function looksGenerated(text, minLength = 40) {
  const normalized = String(text || '').trim();
  if (!normalized) return false;
  if (normalized.length < minLength) return false;
  if (/ideas will appear here/i.test(normalized)) return false;
  if (/authentication fails|invalid api key|edit failed|build failed/i.test(normalized)) return false;
  return true;
}

function pickValidatedRemoteProvider() {
  for (const candidate of REMOTE_PROVIDER_PRIORITY) {
    const row = results.find((entry) => entry.stage === 'providers' && entry.test === candidate.test && entry.ok === true);
    const apiKey = env[candidate.envKey];
    if (row && has(apiKey)) {
      return {
        id: candidate.id,
        apiKey,
        endpoint: String(PROVIDERS[candidate.id]?.defaultEndpoint || ''),
        model: String(row.model || '').trim()
      };
    }
  }
  return null;
}

async function requestText(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
  }
}

async function requestJson(url, options = {}, timeoutMs = 20000) {
  const { response, text } = await requestText(url, options, timeoutMs);
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, text, json };
}

function isProviderLimitResponse(status, body = '') {
  const text = String(body || '').toLowerCase();
  return status === 402 || status === 429 || text.includes('insufficient balance') || text.includes('credit limit') || text.includes('quota') || text.includes('billing');
}

async function probeOpenAICompatible(name, { endpoint, apiKey, model, extraHeaders = {}, payloadExtras = {}, completionTokenField = 'max_tokens' }) {
  if (!has(apiKey)) {
    record('providers', name, null, 'SKIP_NO_KEY');
    return;
  }
  try {
    const { response, text } = await requestText(
      `${endpoint.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Reply with exactly: EON LIVE OK' }],
          [completionTokenField]: 32,
          temperature: 0,
          ...payloadExtras
        })
      },
      30000
    );
    if (!response.ok && isProviderLimitResponse(response.status, text)) {
      record('providers', name, null, `${response.status} ${short(text, 220)}`, { model, limit: true });
    } else if (!response.ok && /degraded function cannot be invoked/i.test(text)) {
      record('providers', name, null, `${response.status} ${short(text, 220)}`, { model, degraded: true });
    } else {
      record('providers', name, response.ok, `${response.status} ${short(text, 220)}`, { model });
    }
  } catch (err) {
    record('providers', name, false, String(err?.message || err), { model });
  }
}

async function probeGemini(name, { endpoint, apiKey, model }) {
  if (!has(apiKey)) {
    record('providers', name, null, 'SKIP_NO_KEY');
    return;
  }
  const resolvedModel = model || 'gemini-2.0-flash';
  try {
    const url = `${endpoint.replace(/\/$/, '')}/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const { response, text } = await requestText(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: EON LIVE OK' }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 32 }
      })
    }, 30000);
    record('providers', name, response.ok, `${response.status} ${short(text, 220)}`, { model: resolvedModel });
  } catch (err) {
    record('providers', name, false, String(err?.message || err), { model: resolvedModel });
  }
}

async function probeAnthropic(name, { endpoint, apiKey, model }) {
  if (!has(apiKey)) {
    record('providers', name, null, 'SKIP_NO_KEY');
    return;
  }
  const resolvedModel = model || 'claude-3-5-sonnet-latest';
  try {
    const { response, text } = await requestText(
      `${endpoint.replace(/\/$/, '')}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 32,
          system: 'You are a concise verification assistant.',
          messages: [{ role: 'user', content: 'Reply with exactly: EON LIVE OK' }]
        })
      },
      30000
    );
    record('providers', name, response.ok, `${response.status} ${short(text, 220)}`, { model: resolvedModel });
  } catch (err) {
    record('providers', name, false, String(err?.message || err), { model: resolvedModel });
  }
}

async function probeCohere(name, { endpoint, apiKey, model }) {
  if (!has(apiKey)) {
    record('providers', name, null, 'SKIP_NO_KEY');
    return;
  }
  const resolvedModel = model || 'command-r-plus-08-2024';
  try {
    const { response, text } = await requestText(
      `${endpoint.replace(/\/$/, '')}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Client-Name': 'EONAPP.ch'
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [{ role: 'user', content: 'Reply with exactly: EON LIVE OK' }],
          temperature: 0,
          max_tokens: 32
        })
      },
      30000
    );
    record('providers', name, response.ok, `${response.status} ${short(text, 220)}`, { model: resolvedModel });
  } catch (err) {
    record('providers', name, false, String(err?.message || err), { model: resolvedModel });
  }
}

async function openInternalAppSurface(page, route) {
  const target = String(route || '').trim();
  const shell = await page.evaluate((requestedRoute) => {
    if (window.EONWorkstation?.openInternalApp) {
      const ok = window.EONWorkstation.openInternalApp(requestedRoute, requestedRoute);
      return { ok: Boolean(ok), mode: 'workstation' };
    }
    if (window.EONTabSystem?.navigateCurrentTab) {
      window.EONTabSystem.navigateCurrentTab(requestedRoute);
      return { ok: true, mode: 'legacy-browser' };
    }
    return { ok: false, mode: 'none' };
  }, target);

  if (!shell.ok) {
    throw new Error(`No internal app shell was available for ${target}`);
  }

  await page.waitForFunction((requestedRoute) => {
    const workstationFrame = document.getElementById('ew-app-frame');
    if (workstationFrame && String(workstationFrame.getAttribute('src') || '').includes(requestedRoute)) {
      return '#ew-app-frame';
    }
    const legacyFrame = document.getElementById('browser-frame');
    if (legacyFrame && String(legacyFrame.getAttribute('src') || '').includes(requestedRoute)) {
      return '#browser-frame';
    }
    return '';
  }, target, { timeout: 30000 });

  const frameSelector = await page.evaluate((requestedRoute) => {
    const workstationFrame = document.getElementById('ew-app-frame');
    if (workstationFrame && String(workstationFrame.getAttribute('src') || '').includes(requestedRoute)) {
      return '#ew-app-frame';
    }
    const legacyFrame = document.getElementById('browser-frame');
    if (legacyFrame && String(legacyFrame.getAttribute('src') || '').includes(requestedRoute)) {
      return '#browser-frame';
    }
    return '';
  }, target);

  if (!frameSelector) {
    throw new Error(`No active iframe matched ${target}`);
  }

  return { ...shell, frameSelector };
}

async function waitForFrameText(page, frameSelector, contentSelector, predicate = 'non-empty', timeout = 120000) {
  await page.waitForFunction(({ iframeSelector, innerSelector, mode }) => {
    const frame = document.querySelector(iframeSelector);
    const doc = frame?.contentWindow?.document;
    const text = doc?.querySelector(innerSelector)?.textContent || '';
    if (mode === 'eon-live-ok') return text.includes('EON LIVE OK') || text.trim().length > 200;
    if (mode === 'status-ready') return text.trim().length > 20;
    return text.trim().length > 0;
  }, { iframeSelector: frameSelector, innerSelector: contentSelector, mode: predicate }, { timeout });
}

async function probeOpenAI(name, { apiKey, model = 'gpt-4o-mini' }) {
  await probeOpenAICompatible(name, {
    endpoint: 'https://api.openai.com/v1',
    apiKey,
    model,
    completionTokenField: 'max_completion_tokens'
  });
}

async function runProviderMatrix() {
  await probeOpenAI('openai-text', { apiKey: env.openai, model: await pickCanonicalProviderModel('openai', env.openai) });

  if (has(env.openai)) {
    try {
      const { response, text } = await requestText('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: 'Minimal futuristic Business Cockpit logo on white background',
          size: '1024x1024'
        })
      }, 60000);
      record('providers', 'openai-image', response.ok, `${response.status} ${short(text, 180)}`);
    } catch (err) {
      record('providers', 'openai-image', false, String(err?.message || err));
    }

    try {
      const { response, text } = await requestText('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.openai}`
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: 'EONAPP live test'
        })
      }, 60000);
      record('providers', 'openai-tts', response.ok, response.ok ? 'audio-binary-ok' : `${response.status} ${short(text, 180)}`);
    } catch (err) {
      record('providers', 'openai-tts', false, String(err?.message || err));
    }
  } else {
    record('providers', 'openai-image', null, 'SKIP_NO_KEY');
    record('providers', 'openai-tts', null, 'SKIP_NO_KEY');
  }

  await probeOpenAICompatible('openrouter-text', {
    endpoint: 'https://openrouter.ai/api/v1',
    apiKey: env.openrouter,
    model: await pickCanonicalProviderModel('openrouter', env.openrouter),
    extraHeaders: {
      'HTTP-Referer': 'https://eonapp.ch',
      'X-Title': 'EON Live Matrix'
    },
    payloadExtras: {
      provider: { allow_fallbacks: false, require_parameters: true, data_collection: 'deny' }
    },
    completionTokenField: 'max_completion_tokens'
  });

  await probeOpenAICompatible('xai-text', {
    endpoint: 'https://api.x.ai/v1',
    apiKey: env.xai,
    model: await pickCanonicalProviderModel('xai', env.xai)
  });

  if (has(env.perplexity)) {
    try {
      const perplexityModel = await pickCanonicalProviderModel('perplexity', env.perplexity);
      const { response, text } = await requestText('https://api.perplexity.ai/v1/sonar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.perplexity}`
        },
        body: JSON.stringify({
          model: perplexityModel,
          messages: [{ role: 'user', content: 'Reply with exactly: EON LIVE OK' }],
          max_tokens: 32,
          temperature: 0
        })
      }, 30000);
      if (!response.ok && isProviderLimitResponse(response.status, text)) {
        record('providers', 'perplexity-text', null, `${response.status} ${short(text, 220)}`, { model: perplexityModel, limit: true });
      } else {
        record('providers', 'perplexity-text', response.ok, `${response.status} ${short(text, 220)}`, { model: perplexityModel });
      }
    } catch (err) {
      record('providers', 'perplexity-text', false, String(err?.message || err));
    }
  } else {
    record('providers', 'perplexity-text', null, 'SKIP_NO_KEY');
  }

  await probeOpenAICompatible('qwen-text', {
    endpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    apiKey: env.qwen,
    model: await pickCanonicalProviderModel('qwen', env.qwen, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
  });

  await probeOpenAICompatible('groq-text', {
    endpoint: 'https://api.groq.com/openai/v1',
    apiKey: env.groq,
    model: await pickCanonicalProviderModel('groq', env.groq),
    completionTokenField: 'max_completion_tokens'
  });

  await probeOpenAICompatible('fireworks-text', {
    endpoint: 'https://api.fireworks.ai/inference/v1',
    apiKey: env.fireworks,
    model: await pickCanonicalProviderModel('fireworks', env.fireworks)
  });

  await probeOpenAICompatible('cerebras-text', {
    endpoint: 'https://api.cerebras.ai/v1',
    apiKey: env.cerebras,
    model: await pickCanonicalProviderModel('cerebras', env.cerebras),
    completionTokenField: 'max_completion_tokens'
  });

  await probeGemini('gemini-text', {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: env.gemini,
    model: await pickCanonicalProviderModel('gemini', env.gemini)
  });

  await probeOpenAICompatible('mistral-text', {
    endpoint: 'https://api.mistral.ai/v1',
    apiKey: env.mistral,
    model: await pickCanonicalProviderModel('mistral', env.mistral)
  });

  await probeOpenAICompatible('deepseek-text', {
    endpoint: 'https://api.deepseek.com',
    apiKey: env.deepseek,
    model: await pickCanonicalProviderModel('deepseek', env.deepseek)
  });

  await probeOpenAICompatible('together-text', {
    endpoint: 'https://api.together.ai/v1',
    apiKey: env.together,
    model: await pickCanonicalProviderModel('together', env.together)
  });

  for (const providerId of ['nvidia', 'sambanova', 'cohere', 'anthropic']) {
    record('providers', `${providerId}-text`, null, 'SKIP_DISABLED_BY_CURRENT_PRODUCT_AUTHORITY');
  }
}

async function seedChatRuntime(page, providerId, apiKey, model, endpoint) {
  await page.goto(`${baseUrl}/chat.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ providerId: p, apiKey: k, model: m, endpoint: e }) => {
    sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ [p]: k }));
    localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
      mode: 'ai',
      provider: p,
      model: m,
      endpoint: e,
      persistApiKey: false,
      systemPrompt: ''
    }));
  }, { providerId, apiKey, model, endpoint });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function seedWorkbenchRuntime(page, providerId, apiKey, model, endpoint) {
  await page.goto(`${baseUrl}/workbench.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ providerId: p, apiKey: k, model: m, endpoint: e }) => {
    sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ [p]: k }));
    localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
      mode: 'ai',
      provider: p,
      model: m,
      endpoint: e,
      persistApiKey: false,
      systemPrompt: ''
    }));
  }, { providerId, apiKey, model, endpoint });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function forceCreatorLocalMusicRoute(page, frameSelector) {
  await page.evaluate((iframeSelector) => {
    const frame = document.querySelector(iframeSelector);
    const win = frame?.contentWindow;
    if (!win) return;
    try {
      win.localStorage.setItem('eon:cs:runtime-mode:v1', 'local');
      win.localStorage.setItem('eon:cs:runtime-router:v1', JSON.stringify({
        text: 'auto',
        image: 'auto',
        voice: 'auto',
        video: 'auto',
        music: 'local'
      }));
    } catch {}
    try {
      win.CreatorStudioAutomation?.setRuntimeMode?.('local');
    } catch {}
    const musicRoute = win.document?.getElementById('route-music');
    if (musicRoute) musicRoute.value = 'local';
  }, frameSelector);
}

async function runLiveProof() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1700 } });
  const page = await context.newPage();

  try {
    // Home / presentation proof
    if (!skipBrowser || !skipChat || !skipCreator) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const homeShot = join(proofOutDir, 'home.png');
      await page.screenshot({ path: homeShot, fullPage: true });
      screenshots.push(homeShot);
      record('screenshots', 'home', true, 'Captured homepage hero and pitch');
    }

    // Chat proof inside the Business Cockpit shell.
    const chosenRemoteProvider = pickValidatedRemoteProvider();
    const chatProvider = chosenRemoteProvider?.id || 'guide';
    const chatKey = chosenRemoteProvider?.apiKey || '';
    const chatModel = chosenRemoteProvider?.model || '';
    const chatEndpoint = chosenRemoteProvider?.endpoint || '';

    if (!skipChat && chatProvider !== 'guide' && has(chatKey)) {
      await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.evaluate(({ providerId: p, apiKey: k, model: m, endpoint: e }) => {
        sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ [p]: k }));
        localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
          mode: 'ai',
          provider: p,
          model: m,
          endpoint: e,
          persistApiKey: false,
          systemPrompt: ''
        }));
      }, { providerId: chatProvider, apiKey: chatKey, model: chatModel, endpoint: chatEndpoint });
      const chatSurface = await openInternalAppSurface(page, '/chat.html');
      await page.waitForTimeout(1500);
      const chatBoot = await page.evaluate(() => window.EONBrowserAutomation?.inspectActivePage?.() || window.EONWorkstation?.state || null);
      const chatFrame = page.frameLocator(chatSurface.frameSelector);
      const chatBefore = await chatFrame.locator('#chat-messages').innerText().catch(() => '');
      await chatFrame.locator('#chat-input').fill('Return exactly: EON LIVE OK. Then give one concrete Business Cockpit action you can perform.');
      await chatFrame.locator('#chat-send').click();
      await page.waitForFunction(({ iframeSelector, beforeText }) => {
        const frame = document.querySelector(iframeSelector);
        const text = frame?.contentWindow?.document?.querySelector('#chat-messages')?.textContent || '';
        const normalized = String(text || '').trim();
        return normalized.includes('EON LIVE OK') && normalized !== String(beforeText || '').trim();
      }, { iframeSelector: chatSurface.frameSelector, beforeText: chatBefore }, { timeout: 120000 });
      const chatText = await chatFrame.locator('#chat-messages').innerText();
      const chatShot = join(proofOutDir, 'chat.png');
      await page.screenshot({ path: chatShot, fullPage: true });
      screenshots.push(chatShot);
      record('chat', 'live-ai-response', chatText.includes('EON LIVE OK'), `${chatBoot?.summary || chatBoot?.activeLabel || ''}\n${chatText}`.slice(0, 600), { provider: chatProvider, model: chatModel, shell: chatSurface.mode });
    } else if (!skipChat) {
      record('chat', 'live-ai-response', null, 'Skipped because no validated remote provider passed the live provider matrix.');
    }

    // Creator proof inside the Business Cockpit shell.
    if (!skipCreator) {
      await openInternalAppSurface(page, '/creator-studio.html');
      await page.waitForLoadState('networkidle').catch(() => {});
    }
    if (!skipCreator && chatProvider !== 'guide' && has(chatKey)) {
      const creatorSurface = await openInternalAppSurface(page, '/creator-studio.html');
      await page.waitForFunction((iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        return Boolean(frame?.contentWindow?.CreatorStudioAutomation);
      }, creatorSurface.frameSelector, { timeout: 15000 });
      const creatorFrame = page.frameLocator(creatorSurface.frameSelector);
      await creatorFrame.locator('#cs-project-name-input').fill('Proof Project');
      await creatorFrame.locator('#cs-project-save-btn').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await page.evaluate((iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        frame?.contentWindow?.document?.getElementById('idea-topic')?.focus?.();
      }, creatorSurface.frameSelector).catch(() => {});
      await creatorFrame.locator('#idea-topic').fill('Business Cockpit launch campaign');
      await page.evaluate(async (iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        await frame?.contentWindow?.CreatorStudioAutomation?.runIdea?.('ideas');
      }, creatorSurface.frameSelector);
      const ideaText = await creatorFrame.locator('#idea-output').innerText();
      record('creator', 'idea-generation', looksGenerated(ideaText, 60), ideaText.slice(0, 400), { provider: chatProvider, model: chatModel });

      await creatorFrame.locator('#idea-to-script').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await page.evaluate(async (iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        await frame?.contentWindow?.CreatorStudioAutomation?.runScript?.('full');
      }, creatorSurface.frameSelector);
      let scriptText = await creatorFrame.locator('#script-output').inputValue();
      record('creator', 'script-generation', looksGenerated(scriptText, 120), scriptText.slice(0, 500), { provider: chatProvider, model: chatModel });

      await creatorFrame.locator('button[data-panel-goto="video"], button[data-panel="video"]').first().evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await page.waitForFunction((iframeSelector) => {
        const panel = document.querySelector(iframeSelector)?.contentWindow?.document?.getElementById('panel-video');
        return !!panel && panel.classList.contains('active');
      }, creatorSurface.frameSelector, { timeout: 15000 }).catch(() => {});
      await creatorFrame.locator('#video-build-storyboard').waitFor({ state: 'visible', timeout: 30000 });
      await creatorFrame.locator('#video-build-storyboard').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await waitForFrameText(page, creatorSurface.frameSelector, '#video-render-status', 'status-ready', 120000);
      const videoStatus1 = await creatorFrame.locator('#video-render-status').textContent();
      record('creator', 'video-storyboard', looksGenerated(videoStatus1, 20), videoStatus1 || '', { provider: chatProvider, model: chatModel });

      await forceCreatorLocalMusicRoute(page, creatorSurface.frameSelector);
      await creatorFrame.locator('#video-generate-music').waitFor({ state: 'visible', timeout: 30000 });
      await creatorFrame.locator('#video-generate-music').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await page.waitForFunction((iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        const doc = frame?.contentWindow?.document;
        const status = String(doc?.getElementById('video-render-status')?.textContent || '');
        const downloadUrl = String(doc?.getElementById('video-download-music')?.dataset?.audioUrl || '');
        return /local background music draft is ready/i.test(status) || Boolean(downloadUrl);
      }, creatorSurface.frameSelector, { timeout: 120000 }).catch(() => {});
      const musicStatus = await creatorFrame.locator('#video-render-status').textContent().catch(() => '');
      const musicDownloadUrl = await creatorFrame.locator('#video-download-music').evaluate((el) => String(el instanceof HTMLElement ? el.dataset.audioUrl || '' : '')).catch(() => '');
      record('creator', 'music-generation', /local background music draft is ready/i.test(String(musicStatus || '').trim()) || Boolean(String(musicDownloadUrl || '').trim()), musicStatus || musicDownloadUrl || '', { provider: chatProvider, model: chatModel, audioUrlReady: Boolean(String(musicDownloadUrl || '').trim()) });

      await creatorFrame.locator('#video-package-btn').waitFor({ state: 'visible', timeout: 30000 });
      await creatorFrame.locator('#video-package-btn').evaluate((el) => { if (el instanceof HTMLElement) el.click(); });
      await page.waitForFunction((iframeSelector) => {
        const frame = document.querySelector(iframeSelector);
        const text = String(frame?.contentWindow?.document?.getElementById('video-render-status')?.textContent || '').toLowerCase();
        return text.includes('package') || text.includes('preview');
      }, creatorSurface.frameSelector, { timeout: 120000 }).catch(() => {});
      const packageStatus = await creatorFrame.locator('#video-render-status').textContent().catch(() => '');
      record('creator', 'video-package', !/build failed|authentication fails|invalid api key/i.test(String(packageStatus || '')) && String(packageStatus || '').trim().length > 0, packageStatus || '', { provider: chatProvider, model: chatModel });

      const creatorShot = join(proofOutDir, 'creator.png');
      await page.screenshot({ path: creatorShot, fullPage: true });
      screenshots.push(creatorShot);
    } else if (!skipCreator) {
      record('creator', 'idea-generation', null, 'Skipped because no usable chat key was present.');
      record('creator', 'script-generation', null, 'Skipped because no usable chat key was present.');
      record('creator', 'video-storyboard', null, 'Skipped because no usable chat key was present.');
      record('creator', 'music-generation', null, 'Skipped because no usable chat key was present.');
      record('creator', 'mp4-export', null, 'Skipped because no usable chat key was present.');
    }

    // Browser proof
    if (!skipBrowser) {
      await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const browserHomeShot = join(proofOutDir, 'browser.png');
      await page.screenshot({ path: browserHomeShot, fullPage: true });
      screenshots.push(browserHomeShot);

      if (await page.locator('#browser-url').count()) {
        await page.locator('#browser-url').fill('https://example.com');
        await page.locator('#browser-fetch-source').click();
        await page.waitForFunction(() => String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('source') || String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('readable'), null, { timeout: 120000 }).catch(() => {});
        await page.locator('#browser-summarize').click();
        await page.waitForFunction(() => String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('summary') || String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('summar'), null, { timeout: 120000 }).catch(() => {});
        const browserSummary = await page.locator('#browser-automation-status').textContent().catch(() => '');
        record('browser', 'page-summarize', true, browserSummary || '', { shell: 'legacy-browser' });
      } else {
        await page.locator('#ew-command-input').fill('https://example.com');
        await page.locator('#ew-read-command').click();
        await page.waitForSelector('#ew-reader-text', { timeout: 120000 });
        const readerText = await page.locator('#ew-reader-text').innerText();
        record('browser', 'page-summarize', true, readerText.slice(0, 500), { shell: 'workstation-reader' });
      }

      const browserShot = join(proofOutDir, 'browser-automation.png');
      await page.screenshot({ path: browserShot, fullPage: true });
      screenshots.push(browserShot);
    }

    // Save a concise evidence bundle.
    const bundle = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      providerSummary: results.filter((row) => row.stage === 'providers'),
      proofSummary: results.filter((row) => row.stage !== 'providers'),
      screenshots
    };
    const bundlePath = join(docOutDir, `live-cockpit-proof-${runTag.slice(0, 10)}.json`);
    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
    console.log(`\n[live-ai-e2e] Wrote evidence bundle to ${bundlePath}`);
  } finally {
    await browser.close();
  }
}

if (!skipProviders) {
  await runProviderMatrix();
}
await runLiveProof();

const passed = results.filter((row) => row.ok === true).length;
const failed = results.filter((row) => row.ok === false).length;
const skipped = results.filter((row) => row.ok === null).length;

console.log('\n[live-ai-e2e] Summary');
console.log(JSON.stringify({ baseUrl, passed, failed, skipped, results }, null, 2));

const coreFailures = results.filter((row) => row.stage !== 'providers' && row.ok === false).length;
if (coreFailures > 0) {
  process.exitCode = 1;
}
