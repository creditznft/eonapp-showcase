#!/usr/bin/env node
import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config({ path: '.env.local' });

const APP_REFERER = process.env.EONAPP_SITE_URL || 'https://eonapp.ch';
const TIMEOUT_MS = Number(process.env.PROVIDER_SMOKE_TIMEOUT_MS || 12000);

const PLACEHOLDER_RE = /(your_|example|sample|dummy|placeholder|changeme|test_|test-|REPLACE_ME|FAKE_KEY|\.\.\.)/i;

function readEnvKey(...names) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim();
    if (value) return value;
  }
  return '';
}

const providers = [
  {
    id: 'groq',
    envKey: 'EON_GROQ_API_KEY',
    request: (key) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'user', content: 'Reply with OK' }], max_completion_tokens: 8 })
      }
    })
  },
  {
    id: 'gemini',
    envKey: 'EON_GEMINI_API_KEY',
    request: (key) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with OK' }] }] })
      }
    })
  },
  {
    id: 'xai',
    envKey: 'XAI_API_KEY',
    envKeys: ['EON_XAI_API_KEY', 'XAI_API_KEY'],
    request: (key) => ({
      url: 'https://api.x.ai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'grok-4.3', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'deepseek',
    envKey: 'EON_DEEPSEEK_API_KEY',
    envKeys: ['EON_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'],
    request: (key) => ({
      url: 'https://api.deepseek.com/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'deepseek-v4-flash', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'perplexity',
    envKey: 'PERPLEXITY_API_KEY',
    envKeys: ['EON_PERPLEXITY_API_KEY', 'PERPLEXITY_API_KEY'],
    request: (key) => ({
      url: 'https://api.perplexity.ai/v1/sonar',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'sonar-pro', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'qwen',
    envKey: 'DASHSCOPE_API_KEY',
    envKeys: ['EON_QWEN_API_KEY', 'DASHSCOPE_API_KEY', 'EON_DASHSCOPE_API_KEY', 'QWEN_API_KEY'],
    request: (key) => ({
      url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'qwen3.6-plus', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'openrouter',
    envKey: 'EON_OPENROUTER_API_KEY',
    request: (key) => ({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'HTTP-Referer': APP_REFERER,
          'X-Title': 'EON Smoke Matrix'
        },
        body: JSON.stringify({ model: 'openai/gpt-3.5-turbo', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'anthropic',
    envKey: 'EON_ANTHROPIC_API_KEY',
    request: (key) => ({
      url: 'https://api.anthropic.com/v1/messages',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 8, messages: [{ role: 'user', content: 'Reply with OK' }] })
      }
    })
  },
  {
    id: 'openai',
    envKey: 'EON_OPENAI_API_KEY',
    request: (key) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  },
  {
    id: 'huggingface',
    envKey: 'EON_HUGGINGFACE_API_KEY',
    request: (key) => ({
      url: 'https://router.huggingface.co/v1/chat/completions',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: 'Qwen/Qwen2.5-Coder-7B-Instruct', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 8 })
      }
    })
  }
];

const localProviders = [
  { id: 'ollama', url: 'http://127.0.0.1:11434/api/tags' },
  { id: 'lmstudio', url: 'http://127.0.0.1:1234/v1/models' },
  { id: 'jan', url: 'http://127.0.0.1:1337/v1/models' }
];

function withTimeout(ms) {
  return AbortSignal.timeout(ms);
}

function mask(value) {
  const src = String(value || '');
  if (!src) return '';
  if (src.length <= 8) return '*'.repeat(src.length);
  return `${src.slice(0, 4)}...${src.slice(-4)}`;
}

function isPlaceholder(value) {
  return PLACEHOLDER_RE.test(String(value || ''));
}

function isProviderLimitResponse(status, body = '') {
  const text = String(body || '').toLowerCase();
  return status === 402 || status === 429 || text.includes('insufficient balance') || text.includes('credit limit') || text.includes('quota') || text.includes('billing');
}

function isProviderAuthResponse(status, body = '') {
  const text = String(body || '').toLowerCase();
  return status === 401
    || status === 403
    || text.includes('authentication fails')
    || text.includes('invalid api key')
    || text.includes('unauthorized')
    || text.includes('forbidden');
}

async function runRemoteProviderSmoke() {
  const results = [];

  for (const provider of providers) {
    const key = readEnvKey(provider.envKey, ...(provider.envKeys || []));
    if (!key) {
      results.push({ provider: provider.id, status: 'SKIP_NO_KEY', detail: `${provider.envKey} not set` });
      continue;
    }
    if (isPlaceholder(key)) {
      results.push({ provider: provider.id, status: 'SKIP_PLACEHOLDER', detail: `${provider.envKey} looks like placeholder (${mask(key)})` });
      continue;
    }

    const { url, options } = provider.request(key);
    try {
      const resp = await fetch(url, { ...options, signal: withTimeout(TIMEOUT_MS) });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        if (isProviderLimitResponse(resp.status, body)) {
          results.push({ provider: provider.id, status: 'SKIP_PROVIDER_LIMIT', detail: `HTTP ${resp.status} ${body.slice(0, 120)}` });
        } else if (isProviderAuthResponse(resp.status, body)) {
          results.push({ provider: provider.id, status: 'WARN_AUTH', detail: `HTTP ${resp.status} ${body.slice(0, 120)}` });
        } else {
          results.push({ provider: provider.id, status: 'FAIL', detail: `HTTP ${resp.status} ${body.slice(0, 120)}` });
        }
        continue;
      }
      results.push({ provider: provider.id, status: 'PASS', detail: `HTTP ${resp.status}` });
    } catch (err) {
      results.push({ provider: provider.id, status: 'FAIL', detail: String(err?.message || err) });
    }
  }

  return results;
}

async function runLocalProviderSmoke() {
  const results = [];
  for (const p of localProviders) {
    try {
      const resp = await fetch(p.url, { signal: withTimeout(2500) });
      if (!resp.ok) {
        results.push({ provider: p.id, status: 'FAIL', detail: `HTTP ${resp.status}` });
        continue;
      }
      const data = await resp.json().catch(() => ({}));
      const count = Array.isArray(data?.models) ? data.models.length : (Array.isArray(data?.data) ? data.data.length : 0);
      results.push({ provider: p.id, status: 'PASS', detail: `${count} model(s) visible` });
    } catch {
      results.push({ provider: p.id, status: 'SKIP_OFFLINE', detail: 'Local runtime not reachable' });
    }
  }
  return results;
}

function printResults(title, rows) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  for (const row of rows) {
    console.log(`${row.provider.padEnd(12)} ${row.status.padEnd(16)} ${row.detail}`);
  }
}

async function main() {
  const remote = await runRemoteProviderSmoke();
  const local = await runLocalProviderSmoke();

  printResults('Remote Provider Smoke Matrix', remote);
  printResults('Local Runtime Smoke Matrix', local);

  const failures = [...remote, ...local].filter((r) => r.status === 'FAIL');
  const passes = [...remote, ...local].filter((r) => r.status === 'PASS');
  if (failures.length) {
    console.error(`\n[provider-smoke] FAIL: ${failures.length} provider checks failed.`);
    process.exit(1);
  }
  if (!passes.length) {
    console.error('\n[provider-smoke] FAIL: no provider or local runtime passed.');
    process.exit(1);
  }

  console.log('\n[provider-smoke] PASS: no failing checks (non-configured providers may be skipped).');
}

main().catch((err) => {
  console.error('[provider-smoke] Unexpected error:', err?.message || err);
  process.exit(1);
});
