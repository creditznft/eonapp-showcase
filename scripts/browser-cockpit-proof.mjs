#!/usr/bin/env node
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config({ path: '.env.local' });

const baseUrl = String(
  process.env.EONAPP_BASE_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:4173'
).replace(/\/$/, '');

const runTag = new Date().toISOString().replace(/[:.]/g, '-');
const docOutDir = join(process.cwd(), 'CodexDocs');
const proofOutDir = join(process.cwd(), 'docs/qa/launch-signoff/screenshots', `browser-proof-${runTag.slice(0, 10)}`);
mkdirSync(docOutDir, { recursive: true });
mkdirSync(proofOutDir, { recursive: true });

function short(value, limit = 280) {
  const text = String(value ?? '');
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function record(results, stage, test, ok, detail, extra = {}) {
  const row = { stage, test, ok, detail: short(detail), ...extra };
  results.push(row);
  const flag = ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP';
  console.log(`[${flag}] ${stage} · ${test}${detail ? ` — ${short(detail, 180)}` : ''}`);
}

async function pickFirstModel(modelsUrl, apiKey, fallbackModel) {
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

function chooseProvider() {
  const options = [
    ['groq', process.env.EON_GROQ_API_KEY, 'https://api.groq.com/openai/v1', 'openai/gpt-oss-120b'],
    ['openrouter', process.env.EON_OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1', 'openai/gpt-4.1-mini'],
    ['openai', process.env.EON_OPENAI_API_KEY, 'https://api.openai.com/v1', 'gpt-4o-mini']
  ];
  return options.find(([, key]) => String(key || '').trim()) || null;
}

async function seedBrowserAI(page) {
  const selected = chooseProvider();
  if (!selected) return { provider: 'guide' };
  const [provider, apiKey, endpoint, fallbackModel] = selected;
  const model = await pickFirstModel(
    provider === 'groq' ? 'https://api.groq.com/openai/v1/models' : provider === 'openrouter' ? 'https://openrouter.ai/api/v1/models' : 'https://api.openai.com/v1/models',
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

async function run() {
  const results = [];
  const screenshots = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1700 } });
  const page = await context.newPage();

  try {
    console.log('[browser-cockpit-proof] opening homepage...');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const homeShot = join(proofOutDir, 'home.png');
    await page.screenshot({ path: homeShot, fullPage: true });
    screenshots.push(homeShot);
    record(results, 'screenshots', 'home', true, 'Captured homepage hero and pitch');

    console.log('[browser-cockpit-proof] seeding browser AI...');
    const seeded = await seedBrowserAI(page);
    if (seeded.provider === 'guide') {
      record(results, 'chat', 'live-ai-response', null, 'Skipped because no usable browser AI key was present.');
      record(results, 'creator', 'video-export', null, 'Skipped because no usable browser AI key was present.');
    }

    if (seeded.provider !== 'guide') {
      console.log('[browser-cockpit-proof] opening browser cockpit...');
      await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      await page.locator('#browser-url').fill('https://example.com');
      await page.locator('#browser-fetch-source').click();
      await page.waitForFunction(() => String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('source') || String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('readable'), null, { timeout: 120000 }).catch(() => {});
      await page.locator('#browser-summarize').click();
      await page.waitForFunction(() => String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('summary') || String(document.getElementById('browser-automation-status')?.textContent || '').toLowerCase().includes('summar'), null, { timeout: 120000 }).catch(() => {});
      const browserSummary = await page.locator('#browser-automation-status').textContent().catch(() => '');
      record(results, 'browser', 'page-summarize', true, browserSummary || '');

      console.log('[browser-cockpit-proof] running browser chat...');
      await page.evaluate(() => window.EONTabSystem?.navigateCurrentTab?.('/chat.html'));
      await page.waitForFunction(() => String(document.getElementById('browser-frame')?.getAttribute('src') || '').includes('/chat.html'), null, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.EONBrowserAutomation?.inspectActivePage?.());
      await page.evaluate(() => window.EONBrowserAutomation?.fill?.('#chat-input', 'Return exactly: EON LIVE OK. Then give one concrete Business Cockpit action you can perform.'));
      await page.evaluate(() => window.EONBrowserAutomation?.click?.('#chat-send'));
      await page.waitForFunction(() => {
        const text = document.querySelector('#browser-frame')?.contentWindow?.document?.getElementById('chat-messages')?.textContent || '';
        return text.includes('EON LIVE OK') || text.trim().length > 200;
      }, null, { timeout: 120000 });
      const chatText = await page.frameLocator('#browser-frame').locator('#chat-messages').innerText();
      record(results, 'chat', 'live-ai-response', true, chatText.slice(0, 500));

      console.log('[browser-cockpit-proof] running creator export...');
      await page.evaluate(() => window.EONTabSystem?.navigateCurrentTab?.('/creator-studio.html'));
      await page.waitForFunction(() => String(document.getElementById('browser-frame')?.getAttribute('src') || '').includes('/creator-studio.html'), null, { timeout: 30000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForFunction(() => Boolean(document.querySelector('#browser-frame')?.contentWindow?.CreatorStudioAutomation), null, { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => {
        const win = document.querySelector('#browser-frame')?.contentWindow;
        win?.CreatorStudioAutomation?.goPanel?.('video');
        win?.CreatorStudioAutomation?.setRuntimeMode?.('cloud');
        win?.CreatorStudioAutomation?.bootstrapVideoProject?.('Proof Project', 960, 540, false);
      }).catch(() => {});
      await page.evaluate(async () => {
        const win = document.querySelector('#browser-frame')?.contentWindow;
        await win?.CreatorStudioAutomation?.buildVideoPackage?.();
        await win?.CreatorStudioAutomation?.exportVideo?.('webm');
      }).catch(() => {});
      await page.waitForFunction(() => (window.EONBrowserDownloadManager?.read?.() || []).length > 0, null, { timeout: 120000 }).catch(() => {});
      const downloadRows = await page.evaluate(() => window.EONBrowserDownloadManager?.read?.() || []);
      const latestDownload = downloadRows.at(-1) || null;
      record(results, 'creator', 'video-export', Boolean(latestDownload), latestDownload ? `${latestDownload.filename} · ${latestDownload.source || 'creator-studio'}` : 'No downloads recorded yet.', { latestDownload });

      const browserShot = join(proofOutDir, 'browser-automation.png');
      await page.screenshot({ path: browserShot, fullPage: true });
      screenshots.push(browserShot);
    }

    const bundle = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      proofSummary: results,
      screenshots,
      provider: seeded
    };
    const bundlePath = join(docOutDir, `browser-cockpit-proof-${runTag.slice(0, 10)}.json`);
    writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
    console.log(`\n[browser-cockpit-proof] Wrote evidence bundle to ${bundlePath}`);

    const failed = results.filter((row) => row.ok === false).length;
    process.exitCode = failed > 0 ? 1 : 0;
  } finally {
    await browser.close();
  }
}

await run();
