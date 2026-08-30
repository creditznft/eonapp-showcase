#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = 'http://localhost:5173';
const outDir = join(process.cwd(), 'docs', 'qa', 'voice-hardware-evidence');
const locales = ['en', 'de', 'ar', 'ja', 'hi', 'es'];

mkdirSync(outDir, { recursive: true });

async function captureChatEvidence(page) {
  await page.goto(`${baseUrl}/chat.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#chat-messages', { timeout: 20000 });

  const report = {};
  for (const lang of locales) {
    await page.evaluate((code) => {
      localStorage.setItem('eon:lang:v1', code);
    }, lang);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#chat-messages', { timeout: 20000 });
    const diag = await page.evaluate(async (code) => {
      const win = /** @type {any} */ (window);
      if (!win.ChatVoiceEvidence?.runVoiceSelfTest) return null;
      return await win.ChatVoiceEvidence.runVoiceSelfTest([code]);
    }, lang);
    report[lang] = diag;
    await page.screenshot({ path: join(outDir, `chat-voice-ui-${lang}.png`), fullPage: false });
  }
  return report;
}

async function captureCreatorEvidence(page) {
  await page.goto(`${baseUrl}/create`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#voice-text', { state: 'attached', timeout: 25000 });
  const voiceNav = page.locator('.cs-nav-btn[data-panel="voice"], [data-panel="voice"]');
  if (await voiceNav.count()) {
    await voiceNav.first().click().catch(() => {});
  }
  await page.waitForTimeout(500);

  const report = {};
  for (const lang of locales) {
    const diag = await page.evaluate(async (code) => {
      const win = /** @type {any} */ (window);
      localStorage.setItem('eon:lang:v1', code);
      if (!win.CreatorStudioEvidence?.runVoiceSelfTest) return null;
      return await win.CreatorStudioEvidence.runVoiceSelfTest([code]);
    }, lang);
    report[lang] = diag;
  }
  await page.screenshot({ path: join(outDir, 'creator-voice-ui.png'), fullPage: false });
  return report;
}

async function captureBrowserEvidence(page) {
  await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#browser-url, #browser-query', { timeout: 20000 });
  const diag = await page.evaluate(async () => {
    const win = /** @type {any} */ (window);
    if (!win.EONBrowserEvidence?.runVoiceSelfTest) return null;
    return await win.EONBrowserEvidence.runVoiceSelfTest();
  });
  await page.screenshot({ path: join(outDir, 'eon-browser-voice-ui.png'), fullPage: false });
  return diag;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.grantPermissions(['microphone'], { origin: baseUrl });
  const page = await context.newPage();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    chat: null,
    creatorStudio: null,
    eonBrowser: null
  };

  try {
    report.chat = await captureChatEvidence(page);
    report.creatorStudio = await captureCreatorEvidence(page);
    report.eonBrowser = await captureBrowserEvidence(page);
  } finally {
    await context.close();
    await browser.close();
  }

  writeFileSync(join(outDir, 'voice-launch-evidence.json'), JSON.stringify(report, null, 2));
  console.log('[voice-evidence] wrote docs/qa/voice-hardware-evidence/voice-launch-evidence.json');
}

main().catch((err) => {
  console.error('[voice-evidence] failed:', err?.message || err);
  process.exit(1);
});
