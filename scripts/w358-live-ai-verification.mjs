#!/usr/bin/env node
/**
 * W358 — Live AI Verification Harness (local operator-only).
 *
 * This runner uses a local .env.local supplied by the operator. It never
 * uploads keys to EONAPP, never prints keys, never writes keys to result files,
 * and never uses a hard-coded model fallback. A model is selected only from a
 * successful user-triggered provider discovery or an explicit local env model
 * setting for providers without public discovery.
 *
 * Outbound requests are blocked unless --confirm-live is supplied.
 * Browser proof is opt-in via --browser and uses sessionStorage only for the
 * temporary key. The resulting evidence stores statuses, model IDs, hashes and
 * timestamps, but no prompts, provider responses, URLs with credentials, or
 * secret values.
 */
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import process from 'node:process';
import { createProviderAdapterRegistry } from '../assets/js/ai-kernel/eon-provider-adapter-registry.js';
import { createModelManifest } from '../assets/js/ai-kernel/eon-model-manifest.js';
import { resolveEonModelPolicy } from '../assets/js/ai-kernel/eon-model-policy-resolver.js';
import { createEonRoutingReceipt } from '../assets/js/ai-kernel/eon-routing-receipt.js';

const args = process.argv.slice(2);
const valueOf = (name, fallback = '') => {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) return args[index + 1];
  const match = args.find((arg) => arg.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : fallback;
};
const flag = (name) => args.includes(name);
const bool = (name) => flag(name);
const splitList = (value) => String(value || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
const now = () => new Date().toISOString();
const runTag = now().replace(/[:.]/g, '-');
const envPath = resolve(valueOf('--env', process.env.EONAPP_ENV_FILE || '.env.local'));
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });
else dotenv.config({ override: false, quiet: true });

const dryRun = bool('--dry-run');
const confirmLive = bool('--confirm-live');
const browserRequested = bool('--browser');
const captureScreenshot = bool('--capture-screenshot');
const strict = bool('--strict');
const requireKeys = bool('--require-keys');
const timeoutMs = Math.max(5_000, Number(valueOf('--timeout-ms', process.env.EON_LIVE_AI_TIMEOUT_MS || '30000')) || 30000);
const appUrl = String(valueOf('--app-url', process.env.EONAPP_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:4173')).replace(/\/$/, '');
const selectedProviders = new Set(splitList(valueOf('--providers', valueOf('--provider', ''))));
const defaultOut = join(process.cwd(), 'docs', 'qa', 'live-ai-v2', runTag, 'results.json');
const outPath = resolve(valueOf('--json-out', defaultOut));
const results = [];

const PLACEHOLDER_RE = /^(test|demo|todo|changeme|replace(_me)?|your[_-]?key|xxx|none|null|undefined)$/i;
const BLOCKED_MODEL_RE = /(embedding|embed|rerank|moderation|guard|safety|tokenizer|vision|image|audio|speech|tts|whisper|transcrib|asr|orpheus)/i;
const PREFERRED_CHAT_MODEL_RE = /(chat|instruct|assistant|flash|haiku|sonnet|opus|llama|qwen|gemma|mixtral|mistral|deepseek|command|nova|kimi|glm|gpt)/i;
const SAFE_STATUS = Object.freeze(['PASS', 'FAIL', 'WARN', 'SKIP', 'BLOCKED']);

const PROVIDERS = Object.freeze([
  { id: 'groq', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_GROQ_API_KEY', 'GROQ_API_KEY'], base: 'https://api.groq.com/openai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'openai', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_OPENAI_API_KEY', 'OPENAI_API_KEY'], base: 'https://api.openai.com/v1', discovery: 'openai', chat: 'openai' },
  { id: 'openrouter', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'], base: 'https://openrouter.ai/api/v1', discovery: 'openai', chat: 'openai', headers: () => ({ 'HTTP-Referer': appUrl, 'X-Title': 'EONAPP Local Live Verification' }) },
  { id: 'xai', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_XAI_API_KEY', 'XAI_API_KEY'], base: 'https://api.x.ai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'deepseek', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'], base: 'https://api.deepseek.com', discovery: 'openai', chat: 'openai' },
  { id: 'qwen', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_QWEN_API_KEY', 'EON_DASHSCOPE_API_KEY', 'DASHSCOPE_API_KEY', 'QWEN_API_KEY'], base: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', discovery: 'openai', chat: 'openai' },
  { id: 'cerebras', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_CEREBRAS_API_KEY', 'CEREBRAS_API_KEY'], base: 'https://api.cerebras.ai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'mistral', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_MISTRAL_API_KEY', 'MISTRAL_API_KEY'], base: 'https://api.mistral.ai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'fireworks', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_FIREWORKS_API_KEY', 'FIREWORKS_API_KEY'], base: 'https://api.fireworks.ai/inference/v1', discovery: 'openai', chat: 'openai' },
  { id: 'nvidia', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_NVIDIA_API_KEY', 'NVIDIA_API_KEY'], base: 'https://integrate.api.nvidia.com/v1', discovery: 'openai', chat: 'openai' },
  { id: 'sambanova', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_SAMBANOVA_API_KEY', 'SAMBANOVA_API_KEY'], base: 'https://api.sambanova.ai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'together', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_TOGETHER_API_KEY', 'TOGETHER_API_KEY'], base: 'https://api.together.xyz/v1', discovery: 'openai', chat: 'openai' },
  { id: 'huggingface', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_HUGGINGFACE_API_KEY', 'HUGGINGFACE_API_KEY'], base: 'https://router.huggingface.co/v1', discovery: 'openai', chat: 'openai' },
  { id: 'perplexity', protocol: 'openai-compatible-chat', route: 'direct-to-provider', env: ['EON_PERPLEXITY_API_KEY', 'PERPLEXITY_API_KEY'], base: 'https://api.perplexity.ai/v1', discovery: 'openai', chat: 'openai' },
  { id: 'gemini', protocol: 'gemini-native', route: 'direct-to-provider', env: ['EON_GEMINI_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY'], base: 'https://generativelanguage.googleapis.com/v1beta', discovery: 'gemini', chat: 'gemini' },
  { id: 'anthropic', protocol: 'anthropic-native', route: 'direct-to-provider', env: ['EON_ANTHROPIC_API_KEY', 'ANTHROPIC_API_KEY'], base: 'https://api.anthropic.com/v1', discovery: 'manual', chat: 'anthropic' },
  { id: 'cohere', protocol: 'custom-direct', route: 'direct-to-provider', env: ['EON_COHERE_API_KEY', 'COHERE_API_KEY'], base: 'https://api.cohere.com/v2', discovery: 'manual', chat: 'cohere' },
  { id: 'ollama', protocol: 'local-openai-compatible', route: 'device-local', env: [], base: String(process.env.OLLAMA_BASE_URL || process.env.EON_OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''), discovery: 'ollama', chat: 'ollama' },
  { id: 'lmstudio', protocol: 'local-openai-compatible', route: 'device-local', env: [], base: String(process.env.LMSTUDIO_BASE_URL || process.env.EON_LMSTUDIO_BASE_URL || 'http://127.0.0.1:1234/v1').replace(/\/$/, ''), discovery: 'openai', chat: 'openai', local: true },
  { id: 'jan', protocol: 'local-openai-compatible', route: 'device-local', env: [], base: String(process.env.JAN_BASE_URL || process.env.EON_JAN_BASE_URL || 'http://127.0.0.1:1337/v1').replace(/\/$/, ''), discovery: 'openai', chat: 'openai', local: true }
]);

function foundEnv(names) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim();
    if (value) return { name, value };
  }
  return { name: names[0] || '', value: '' };
}

function explicitModel(providerId) {
  const keys = [`EON_LIVE_AI_MODEL_${providerId.toUpperCase()}`, `EON_AI_TEST_MODEL_${providerId.toUpperCase()}`];
  for (const key of keys) {
    const value = String(process.env[key] || '').trim();
    if (value) return { key, value };
  }
  return { key: keys[0], value: '' };
}

function classifyHttp(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402 || status === 429) return 'limit-or-billing';
  if (status === 404) return 'not-found';
  if (status >= 500) return 'provider-server';
  if (status >= 400) return 'request-rejected';
  return 'ok';
}

function digest(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function cleanDetail(value) {
  return String(value || '')
    .replace(/(bearer|authorization|x-api-key)\s*[:=]?\s*[^\s,;]+/ig, '$1 [REDACTED]')
    .replace(/AIza[\w-]{12,}/g, '[REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[REDACTED]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function record(providerId, stage, status, detail = '', extra = {}) {
  const safeStatus = SAFE_STATUS.includes(status) ? status : 'FAIL';
  const row = Object.freeze({ providerId, stage, status: safeStatus, detail: cleanDetail(detail), at: now(), ...extra });
  results.push(row);
  console.log(`[${safeStatus}] ${providerId} · ${stage}${row.detail ? ` — ${row.detail}` : ''}`);
  return row;
}

async function request(url, options = {}, timeout = timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { response, text, json };
  } finally {
    clearTimeout(timer);
  }
}

function idsFromOpenAI(json) {
  const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : Array.isArray(json) ? json : [];
  return list.map((entry) => String(entry?.id || entry?.name || entry?.model || '').trim()).filter(Boolean);
}

function selectDiscoveredChatModel(ids) {
  const candidates = ids.filter((id) => !BLOCKED_MODEL_RE.test(id));
  return candidates.find((id) => PREFERRED_CHAT_MODEL_RE.test(id)) || candidates[0] || '';
}

function contentFrom(kind, json) {
  if (kind === 'openai') {
    const content = json?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      return String(content.map((part) => part?.text || part?.content || '').join('') || '').trim();
    }
  }
  if (kind === 'gemini') return String(json?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '').trim();
  if (kind === 'anthropic') return String((json?.content || []).map((part) => part?.text || '').join('') || '').trim();
  if (kind === 'cohere') return String((json?.message?.content || []).map((part) => part?.text || '').join('') || json?.text || '').trim();
  if (kind === 'ollama') return String(json?.message?.content || json?.response || '').trim();
  return String(json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '').trim();
}

function providerHeaders(provider, key) {
  const extra = typeof provider.headers === 'function' ? provider.headers() : {};
  if (provider.chat === 'anthropic') return { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', ...extra };
  if (provider.chat === 'gemini' || provider.chat === 'ollama') return { 'Content-Type': 'application/json', ...extra };
  if (provider.chat === 'cohere') return { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extra };
  return { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}), ...extra };
}

async function discoverModel(provider, key) {
  const manual = explicitModel(provider.id);
  if (manual.value) return { ok: true, modelId: manual.value, source: 'operator-env', count: null, modelEnv: manual.key };
  if (provider.discovery === 'manual') return { ok: false, reason: `model selection required: set ${manual.key}`, count: null };
  if (provider.discovery === 'ollama') {
    const { response, json } = await request(`${provider.base}/api/tags`, { headers: providerHeaders(provider, key) });
    if (!response.ok) return { ok: false, reason: `discovery ${classifyHttp(response.status)} (HTTP ${response.status})`, count: 0 };
    const ids = idsFromOpenAI(json?.models || json);
    const modelId = selectDiscoveredChatModel(ids);
    return modelId ? { ok: true, modelId, source: 'direct-discovery', count: ids.length } : { ok: false, reason: 'no non-specialist local chat model discovered', count: ids.length };
  }
  if (provider.discovery === 'gemini') {
    const url = `${provider.base}/models?key=${encodeURIComponent(key)}`;
    const { response, json } = await request(url, { headers: { 'Content-Type': 'application/json' } });
    if (!response.ok) return { ok: false, reason: `discovery ${classifyHttp(response.status)} (HTTP ${response.status})`, count: 0 };
    const candidates = (Array.isArray(json?.models) ? json.models : []).filter((entry) => Array.isArray(entry?.supportedGenerationMethods) && entry.supportedGenerationMethods.includes('generateContent'));
    const ids = candidates.map((entry) => String(entry?.name || '').replace(/^models\//, '').trim()).filter((id) => id && !BLOCKED_MODEL_RE.test(id));
    return ids[0] ? { ok: true, modelId: ids[0], source: 'direct-discovery', count: ids.length } : { ok: false, reason: 'no generateContent model discovered', count: ids.length };
  }
  const { response, json } = await request(`${provider.base}/models`, { headers: providerHeaders(provider, key) });
  if (!response.ok) return { ok: false, reason: `discovery ${classifyHttp(response.status)} (HTTP ${response.status})`, count: 0 };
  const ids = idsFromOpenAI(json);
  const modelId = selectDiscoveredChatModel(ids);
  return modelId ? { ok: true, modelId, source: 'direct-discovery', count: ids.length } : { ok: false, reason: 'no non-specialist chat model discovered', count: ids.length };
}

async function sendProbe(provider, key, modelId, token) {
  const prompt = `Reply with exactly this token and nothing else: ${token}`;
  let url = '';
  let body = {};
  if (provider.chat === 'gemini') {
    url = `${provider.base}/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(key)}`;
    body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 64, thinkingConfig: { thinkingBudget: 0 } }
    };
  } else if (provider.chat === 'anthropic') {
    url = `${provider.base}/messages`;
    body = { model: modelId, max_tokens: 64, temperature: 0, messages: [{ role: 'user', content: prompt }] };
  } else if (provider.chat === 'cohere') {
    url = `${provider.base}/chat`;
    body = { model: modelId, messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 64 };
  } else if (provider.chat === 'ollama') {
    url = `${provider.base}/api/chat`;
    body = { model: modelId, messages: [{ role: 'user', content: prompt }], stream: false, options: { temperature: 0, num_predict: 64 } };
  } else {
    url = `${provider.base}/chat/completions`;
    body = { model: modelId, messages: [{ role: 'user', content: prompt }], temperature: 0, max_tokens: 64 };
  }
  const { response, json } = await request(url, { method: 'POST', headers: providerHeaders(provider, key), body: JSON.stringify(body) });
  const output = contentFrom(provider.chat, json);
  const tokenSeen = output.includes(token);
  const category = response.ok && !tokenSeen ? 'empty-or-missing-token' : classifyHttp(response.status);
  return { ok: response.ok && tokenSeen, httpStatus: response.status, category, outputLength: output.length, outputDigest: digest(output), tokenSeen };
}

function createKernelProof(provider, modelId) {
  const adapterId = `${provider.protocol}/v1`;
  const registry = createProviderAdapterRegistry([{
    schema: 'eonapp.provider-pack.v2',
    providerId: provider.id,
    label: provider.id,
    adapterId,
    protocol: provider.protocol,
    trustLevel: 'user-custom',
    endpointPolicy: { mode: provider.route === 'device-local' ? 'loopback-local' : 'direct-user-selected' },
    discovery: { mode: 'user-triggered-direct-provider', userActionRequired: true, backgroundProbeAllowed: false, modelCache: 'encrypted-device-local' },
    privacy: { route: provider.route, cloudRelayAllowed: false, defaultCrossProviderFallback: 'none' },
    supportedProfiles: ['chat.fast'],
    adapterVersion: '1'
  }]);
  const manifest = createModelManifest({
    providerId: provider.id,
    adapterId,
    adapterVersion: '1',
    source: 'user-triggered-direct-provider',
    records: [{ modelId, verificationState: 'verified', privacyRoute: provider.route, capabilities: { 'chat.fast': 'verified' }, costGroup: 'user-owned-provider' }]
  });
  const resolution = resolveEonModelPolicy({
    manifest,
    requestedProfile: 'chat.fast',
    selection: { providerId: provider.id, modelId },
    policy: { mode: 'exact-pin' },
    taskPrivacyClass: provider.route
  });
  const receipt = resolution.ok ? createEonRoutingReceipt({ taskId: `eontask_live_${randomBytes(12).toString('hex')}`, resolution }) : null;
  return { ok: registry.packs.length === 1 && resolution.ok === true && receipt?.fallback === 'none' && receipt?.providerId === provider.id && receipt?.modelId === modelId, policy: resolution.reason || 'policy-declined', receipt: receipt ? { providerId: receipt.providerId, modelId: receipt.modelId, privacyRoute: receipt.privacyRoute, fallback: receipt.fallback } : null };
}

async function runBrowserProof(provider, key, modelId, token, resultDir) {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const page = await context.newPage();
    const endpoint = provider.base;
    await page.addInitScript(({ providerId, apiKey, selectedModel, selectedEndpoint }) => {
      sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ [providerId]: apiKey }));
      localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
        assistantMode: 'ai', runtimePreference: 'hybrid', mode: 'ai', provider: providerId,
        model: selectedModel, endpoint: selectedEndpoint, persistApiKey: false, systemPrompt: ''
      }));
      localStorage.removeItem('eon:ai-chat-device-keys:v1');
    }, { providerId: provider.id, apiKey: key, selectedModel: modelId, selectedEndpoint: endpoint });
    await page.goto(`${appUrl}/chat`, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.locator('#chat-input').fill(`Reply with exactly this token and nothing else: ${token}`);
    await page.locator('#chat-send').click();
    await page.waitForFunction((probe) => (document.getElementById('chat-messages')?.textContent || '').includes(probe), token, { timeout: Math.max(timeoutMs * 2, 60_000) });
    const transcript = await page.locator('#chat-messages').innerText();
    let screenshot = '';
    if (captureScreenshot) {
      screenshot = join(resultDir, `${provider.id}-chat.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
    }
    await context.clearCookies();
    await context.close();
    await browser.close();
    return { ok: transcript.includes(token), responseDigest: digest(transcript), responseLength: transcript.length, screenshot: screenshot ? `${provider.id}-chat.png` : '' };
  } catch (error) {
    return { ok: false, error: cleanDetail(error?.message || 'browser proof failed') };
  }
}

function includeProvider(provider) {
  return selectedProviders.size === 0 || selectedProviders.has(provider.id);
}

async function runProvider(provider, resultDir) {
  const env = foundEnv(provider.env);
  const isLocal = provider.route === 'device-local';
  if (!includeProvider(provider)) return;
  if (!isLocal && !env.value) {
    record(provider.id, 'preflight', requireKeys ? 'FAIL' : 'SKIP', `${env.name || provider.id} is not configured`, { envKey: env.name || null });
    return;
  }
  if (!isLocal && PLACEHOLDER_RE.test(env.value)) {
    record(provider.id, 'preflight', requireKeys ? 'FAIL' : 'SKIP', `${env.name} looks like a placeholder`, { envKey: env.name });
    return;
  }
  record(provider.id, 'preflight', 'PASS', isLocal ? 'local runtime candidate' : 'key is locally available', { envKey: isLocal ? null : env.name, protocol: provider.protocol, privacyRoute: provider.route });
  if (dryRun || !confirmLive) {
    record(provider.id, 'live-request', dryRun ? 'SKIP' : 'BLOCKED', dryRun ? 'dry run: no network call created' : 'add --confirm-live to permit direct provider calls');
    return;
  }
  let discovery;
  try { discovery = await discoverModel(provider, env.value); }
  catch (error) { discovery = { ok: false, reason: cleanDetail(error?.message || 'discovery failed') }; }
  if (!discovery.ok) {
    record(provider.id, 'discovery', 'WARN', discovery.reason || 'model discovery was not available', { discoveryMode: provider.discovery, modelEnv: explicitModel(provider.id).key });
    return;
  }
  record(provider.id, 'discovery', 'PASS', `${discovery.source}; ${discovery.count ?? 'operator-selected'} candidate model(s)`, { modelId: discovery.modelId, discoveryMode: provider.discovery, modelEnv: discovery.modelEnv || null });
  const token = `EON_LIVE_${randomBytes(12).toString('hex').toUpperCase()}`;
  let direct;
  try { direct = await sendProbe(provider, env.value, discovery.modelId, token); }
  catch (error) { direct = { ok: false, category: 'network-or-runtime', error: cleanDetail(error?.message || 'direct probe failed') }; }
  if (!direct.ok) {
    record(provider.id, 'direct-probe', direct.category === 'limit-or-billing' || direct.category === 'auth' ? 'WARN' : 'FAIL', `${direct.category || 'probe failed'}${direct.httpStatus ? ` (HTTP ${direct.httpStatus})` : ''}`, { modelId: discovery.modelId, tokenSeen: direct.tokenSeen === true, outputLength: Number(direct.outputLength || 0), outputDigest: direct.outputDigest || null });
    return;
  }
  record(provider.id, 'direct-probe', 'PASS', `live response verified (HTTP ${direct.httpStatus})`, { modelId: discovery.modelId, tokenSeen: true, outputLength: direct.outputLength, outputDigest: direct.outputDigest });
  try {
    const kernel = createKernelProof(provider, discovery.modelId);
    record(provider.id, 'kernel-contract', kernel.ok ? 'PASS' : 'FAIL', kernel.ok ? 'exact-pin route and no-fallback receipt verified' : kernel.policy, { modelId: discovery.modelId, receipt: kernel.receipt });
  } catch (error) {
    record(provider.id, 'kernel-contract', 'FAIL', cleanDetail(error?.message || 'kernel proof failed'), { modelId: discovery.modelId });
  }
  if (browserRequested) {
    const browser = await runBrowserProof(provider, env.value, discovery.modelId, token, resultDir);
    record(provider.id, 'browser-chat', browser.ok ? 'PASS' : 'FAIL', browser.ok ? 'chat UI returned the live probe token with a session-only key' : browser.error || 'browser chat did not return the probe token', { modelId: discovery.modelId, responseLength: browser.responseLength || 0, responseDigest: browser.responseDigest || null, screenshot: browser.screenshot || null });
  }
}

function writeResult() {
  const dir = resolve(outPath, '..');
  mkdirSync(dir, { recursive: true });
  const configured = results.filter((row) => row.stage === 'preflight' && row.status === 'PASS').map((row) => row.providerId);
  const summary = {
    generatedAt: now(),
    schema: 'eonapp.live-ai-verification.v2',
    liveCallsPermitted: confirmLive && !dryRun,
    browserProofRequested: browserRequested,
    strict,
    appUrl: browserRequested ? appUrl : null,
    configuredProviders: [...new Set(configured)],
    counts: Object.fromEntries(SAFE_STATUS.map((status) => [status, results.filter((row) => row.status === status).length])),
    resultSafety: { rawKeysStored: false, rawPromptsStored: false, rawResponsesStored: false, endpointCredentialsStored: false },
    results
  };
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n[W358] Safe live-AI evidence written to ${outPath}`);
  return summary;
}

async function main() {
  if (!dryRun && !confirmLive) console.log('[W358] Live network calls are blocked until --confirm-live is supplied. Running preflight only.');
  const resultDir = resolve(outPath, '..');
  for (const provider of PROVIDERS) await runProvider(provider, resultDir);
  const summary = writeResult();
  const failures = summary.results.filter((row) => row.status === 'FAIL');
  const warnings = summary.results.filter((row) => row.status === 'WARN');
  const livePasses = summary.results.filter((row) => row.stage === 'direct-probe' && row.status === 'PASS');
  if (requireKeys && !summary.configuredProviders.length) process.exitCode = 1;
  if (failures.length) process.exitCode = 1;
  if (strict && warnings.length) process.exitCode = 1;
  if (confirmLive && !dryRun && !livePasses.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[W358] Unexpected safe-harness failure: ${cleanDetail(error?.message || error)}`);
  process.exit(1);
});
