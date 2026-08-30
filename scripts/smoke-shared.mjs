#!/usr/bin/env node
import dotenv from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config({ path: '.env.local' });

export function getBaseUrl() {
  return String(
    process.env.EONAPP_BASE_URL ||
    process.env.BASE_URL ||
    'http://127.0.0.1:4173'
  ).replace(/\/$/, '');
}

export function makeRunDirs(runTag) {
  const docOutDir = join(process.cwd(), 'CodexDocs');
  const proofOutDir = join(process.cwd(), 'docs/qa/launch-signoff/screenshots', runTag);
  mkdirSync(docOutDir, { recursive: true });
  mkdirSync(proofOutDir, { recursive: true });
  return { docOutDir, proofOutDir };
}

export function short(value, limit = 280) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

export function record(results, stage, test, ok, detail, extra = {}) {
  const row = { stage, test, ok, detail: short(detail), ...extra };
  results.push(row);
  const flag = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP';
  console.log(`[${flag}] ${stage} · ${test}${detail ? ` — ${short(detail, 180)}` : ''}`);
  return row;
}

export function writeEvidenceBundle(docOutDir, name, bundle) {
  const bundlePath = join(docOutDir, `${name}.json`);
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
  console.log(`\n[smoke] Wrote evidence bundle to ${bundlePath}`);
  return bundlePath;
}

export async function pickFirstModel(modelsUrl, apiKey, fallbackModel) {
  try {
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const response = await fetch(modelsUrl, { method: 'GET', headers });
    if (!response.ok) return fallbackModel;
    const json = await response.json().catch(() => null);
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json?.models) ? json.models : Array.isArray(json) ? json : [];
    const blocked = /(guard|moderation|classifier|embedding|tokenizer|rerank|safety)/i;
    const preferred = list.find((item) => {
      const id = String(item?.id || item?.name || '').toLowerCase();
      return !blocked.test(id) && /(instruct|chat|assistant|versatile|llama|qwen|mixtral|gemma|command|deepseek|mistral|opus|sonnet|haiku|phi|wizard)/i.test(id);
    });
    return String(preferred?.id || preferred?.name || fallbackModel || '').trim() || fallbackModel;
  } catch {
    return fallbackModel;
  }
}

export function chooseProvider() {
  const options = [
    ['deepseek', process.env.EON_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY, 'https://api.deepseek.com', 'deepseek-v4-flash'],
    ['perplexity', process.env.EON_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY, 'https://api.perplexity.ai/v1', 'sonar-pro'],
    ['xai', process.env.EON_XAI_API_KEY || process.env.XAI_API_KEY, 'https://api.x.ai/v1', 'grok-4.3'],
    ['qwen', process.env.EON_QWEN_API_KEY || process.env.EON_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', 'qwen3.6-plus'],
    ['groq', process.env.EON_GROQ_API_KEY, 'https://api.groq.com/openai/v1', 'openai/gpt-oss-120b'],
    ['openrouter', process.env.EON_OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1', 'openai/gpt-4.1-mini'],
    ['openai', process.env.EON_OPENAI_API_KEY, 'https://api.openai.com/v1', 'gpt-4o-mini']
  ];
  return options.find(([, key]) => String(key || '').trim()) || null;
}

export async function seedBrowserAI(page) {
  const selected = chooseProvider();
  if (!selected) return { provider: 'guide' };
  const [provider, apiKey, endpoint, fallbackModel] = selected;
  const model = await pickFirstModel(
    provider === 'deepseek' ? 'https://api.deepseek.com/models'
      : provider === 'perplexity' ? 'https://api.perplexity.ai/v1/models'
        : provider === 'groq' ? 'https://api.groq.com/openai/v1/models'
          : provider === 'openrouter' ? 'https://openrouter.ai/api/v1/models'
            : provider === 'xai' ? 'https://api.x.ai/v1/models'
              : provider === 'qwen' ? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models'
                : 'https://api.openai.com/v1/models',
    apiKey,
    fallbackModel
  );
  await page.evaluate(({ providerId: p, key, m, e }) => {
    localStorage.setItem('eon:ai-chat-device-keys:v1', JSON.stringify({ [p]: key }));
    sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ [p]: key }));
    localStorage.setItem('eon:ai-chat-settings:v1', JSON.stringify({
      mode: 'ai',
      provider: p,
      model: m,
      endpoint: e,
      persistApiKey: false,
      systemPrompt: ''
    }));
  }, { providerId: provider, key: apiKey, m: model, e: endpoint });
  return { provider, model, endpoint };
}
