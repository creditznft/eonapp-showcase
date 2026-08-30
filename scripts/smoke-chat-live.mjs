#!/usr/bin/env node
import { chromium } from 'playwright';
import { join } from 'node:path';
import { getBaseUrl, makeRunDirs, record, seedBrowserAI, writeEvidenceBundle } from './smoke-shared.mjs';

const baseUrl = getBaseUrl();
const runTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
const { docOutDir, proofOutDir } = makeRunDirs(`chat-proof-${runTag}`);

async function run() {
  const results = [];
  const screenshots = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const seeded = await seedBrowserAI(page);
    if (seeded.provider === 'guide') {
      record(results, 'chat', 'live-ai-response', null, 'Skipped because no usable browser AI key was present.');
    } else {
      await page.goto(`${baseUrl}/chat.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.fill('#chat-input', 'Return exactly: EON LIVE OK. Then give one concrete Business Cockpit action you can perform.');
      await page.click('#chat-send');
      await page.waitForFunction(() => {
        const text = document.getElementById('chat-messages')?.textContent || '';
        return text.includes('EON LIVE OK') || text.trim().length > 200;
      }, null, { timeout: 120000 });
      const text = await page.locator('#chat-messages').innerText();
      const shot = join(proofOutDir, 'chat.png');
      await page.screenshot({ path: shot, fullPage: false });
      screenshots.push(shot);
      record(results, 'chat', 'live-ai-response', true, text.slice(0, 500), { provider: seeded.provider, model: seeded.model });
    }
    writeEvidenceBundle(docOutDir, `smoke-chat-${runTag}`, {
      generatedAt: new Date().toISOString(),
      baseUrl,
      results,
      screenshots
    });
    process.exitCode = results.some((row) => row.ok === false) ? 1 : 0;
  } finally {
    await browser.close();
  }
}

await run();
