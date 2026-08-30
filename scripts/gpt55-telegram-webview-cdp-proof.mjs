#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || '1'];
}));

const cdp = String(args.get('cdp') || process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222');
const out = String(args.get('out') || 'reports/gpt55-launch/session-05-telegram-cdp');
const durationMs = Number(args.get('duration-ms') || 90000);
const botUrl = String(args.get('telegram-url') || 'https://web.telegram.org/');
const tryClick = args.has('try-click');

fs.mkdirSync(out, { recursive: true });
const events = [];
const responses = [];
const pagesSeen = new Map();

function redact(value) {
  return String(value || '')
    .replace(/\b\d{6,}:[A-Za-z0-9_-]{20,}\b/g, '<telegram-token-redacted>')
    .replace(/0x[a-fA-F0-9]{64}\b/g, '<private-key-redacted>')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, '<api-key-redacted>')
    .replace(/([?&](?:hash|auth|token|tgWebAppData|initData)=)[^&#\s]+/gi, '$1<redacted>');
}

function push(type, payload = {}) {
  events.push({ at: new Date().toISOString(), type, ...JSON.parse(JSON.stringify(payload, (_, v) => typeof v === 'string' ? redact(v) : v)) });
}

async function capturePage(page, label) {
  const id = pagesSeen.get(page) || `page-${pagesSeen.size + 1}`;
  pagesSeen.set(page, id);
  let title = '';
  let url = '';
  try { title = await page.title(); } catch {}
  try { url = page.url(); } catch {}
  const safe = `${id}-${label}`.replace(/[^a-z0-9_.-]+/gi, '-').slice(0, 80);
  const screenshotPath = path.join(out, `${safe}.png`);
  try { await page.screenshot({ path: screenshotPath, fullPage: false }); } catch (error) { push('screenshot_failed', { id, error: error.message }); }
  push('snapshot', { id, label, title, url, screenshotPath });
}

function wirePage(page) {
  if (pagesSeen.has(page)) return;
  const id = `page-${pagesSeen.size + 1}`;
  pagesSeen.set(page, id);
  push('page_attached', { id, url: page.url() });
  page.on('console', (msg) => push('console', { id, level: msg.type(), text: msg.text(), url: page.url() }));
  page.on('pageerror', (error) => push('pageerror', { id, message: error.message, stack: error.stack || '' }));
  page.on('requestfailed', (request) => push('requestfailed', { id, url: request.url(), method: request.method(), failure: request.failure()?.errorText || '' }));
  page.on('response', async (response) => {
    const url = response.url();
    if (/eonapp\.ch|telegram|libtl\.com|monetag|propeller/i.test(url)) {
      const headers = response.headers();
      const row = {
        id,
        url,
        status: response.status(),
        ok: response.ok(),
        headers: {
          'content-type': headers['content-type'] || '',
          'content-security-policy': headers['content-security-policy'] || '',
          'x-frame-options': headers['x-frame-options'] || '',
          'location': headers.location || ''
        }
      };
      responses.push(row);
      push('response', row);
    }
  });
}

let browser;
try {
  browser = await chromium.connectOverCDP(cdp);
} catch (error) {
  console.error(`Could not connect to Chrome CDP at ${cdp}: ${error.message}`);
  console.error('Start Chrome first, for example: chrome.exe --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\\chrome-eonapp-audit" https://web.telegram.org/');
  process.exit(2);
}

for (const context of browser.contexts()) {
  context.on('page', wirePage);
  for (const page of context.pages()) wirePage(page);
}

let context = browser.contexts()[0];
if (!context) context = await browser.newContext();
let page = context.pages().find((p) => /web\.telegram\.org|eonapp\.ch/i.test(p.url())) || context.pages()[0] || await context.newPage();
wirePage(page);

if (!/web\.telegram\.org/i.test(page.url())) {
  await page.goto(botUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((error) => push('goto_failed', { url: botUrl, error: error.message }));
}

push('operator_instruction', {
  message: 'If the Mini App is not already open, select @EonAppsBot in Telegram Web and click Open EON Apps. This script will capture pages, frames, console errors, failed requests, and screenshots.'
});

await capturePage(page, 'start');

if (tryClick) {
  try {
    const candidates = [
      page.getByText(/Open EON Apps/i).first(),
      page.getByText(/Open App/i).first(),
      page.getByRole('button', { name: /Open EON Apps|Open App/i }).first()
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      if (count > 0) {
        await locator.click({ timeout: 5000 });
        push('auto_click_attempted', { selector: 'Open EON Apps/Open App' });
        break;
      }
    }
  } catch (error) {
    push('auto_click_failed', { error: error.message });
  }
}

const start = Date.now();
let tick = 0;
while (Date.now() - start < durationMs) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  tick += 1;
  for (const context of browser.contexts()) for (const p of context.pages()) { wirePage(p); await capturePage(p, `tick-${tick}`); }
}

const pageSummaries = [];
for (const context of browser.contexts()) {
  for (const p of context.pages()) {
    let title = '';
    let url = '';
    try { title = await p.title(); } catch {}
    try { url = p.url(); } catch {}
    let telegramBridge = null;
    if (/eonapp\.ch|telegram/i.test(url)) {
      try {
        telegramBridge = await p.evaluate(() => ({
          hasTelegram: Boolean(window.Telegram),
          hasWebApp: Boolean(window.Telegram && window.Telegram.WebApp),
          initDataLength: window.Telegram?.WebApp?.initData?.length || 0,
          platform: window.Telegram?.WebApp?.platform || '',
          colorScheme: window.Telegram?.WebApp?.colorScheme || ''
        }));
      } catch (error) {
        telegramBridge = { error: error.message };
      }
    }
    pageSummaries.push({ id: pagesSeen.get(p), title, url: redact(url), telegramBridge });
  }
}

const eonResponses = responses.filter((r) => /eonapp\.ch/i.test(r.url));
const blankRisk = pageSummaries.some((p) => /eonapp\.ch\/telegram/i.test(p.url) && p.telegramBridge && p.telegramBridge.error);
const summary = {
  schema: 'eonapp.gpt55.telegram-webview-cdp-proof.v1',
  ok: eonResponses.some((r) => r.status >= 200 && r.status < 400) && !responses.some((r) => /eonapp\.ch/i.test(r.url) && r.status >= 500),
  checkedAt: new Date().toISOString(),
  cdp,
  durationMs,
  out,
  pageSummaries,
  responseCount: responses.length,
  eonResponseCount: eonResponses.length,
  blankRisk,
  note: 'This script captures evidence. Human/operator must still inspect screenshots to confirm the Mini App panel is not visually blank.'
};

fs.writeFileSync(path.join(out, 'events.json'), `${JSON.stringify(events, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'responses.json'), `${JSON.stringify(responses, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(out, 'README.md'), `# Telegram WebView CDP Proof\n\nStatus: ${summary.ok ? 'CAPTURED' : 'NEEDS REVIEW'}\n\nInspect the PNG screenshots and SUMMARY.json. A green launch requires visible EONAPP content inside the Telegram Mini App panel, not only HTTP 200 responses.\n`);
console.log(JSON.stringify(summary, null, 2));
await browser.close().catch(() => {});
if (!summary.ok) process.exit(1);
