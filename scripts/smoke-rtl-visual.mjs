#!/usr/bin/env node
import { chromium } from 'playwright';
import { join } from 'node:path';
import { getBaseUrl, makeRunDirs, record, writeEvidenceBundle } from './smoke-shared.mjs';

const baseUrl = getBaseUrl();
const runTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
const { docOutDir, proofOutDir } = makeRunDirs(`rtl-proof-${runTag}`);

async function setArabicLocale(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('eon:lang:preference:v1', 'ar');
      localStorage.setItem('eon:lang:v1', 'ar');
      localStorage.setItem('eon:widget:auto-opened:v2', JSON.stringify({
        'chat:ar': Date.now(),
        'creator-studio:ar': Date.now(),
        'marketplace:ar': Date.now()
      }));
    } catch {}
  });
}

async function closeWidgetIfOpen(page) {
  const closeBtn = page.locator('#ew-close-btn');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
  }
}

async function captureSurface(page, results, screenshots, route, name) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  await closeWidgetIfOpen(page);
  const dir = await page.evaluate(() => document.documentElement.dir || '');
  const lang = await page.evaluate(() => document.documentElement.lang || '');
  const ok = dir === 'rtl' && lang === 'ar';
  record(results, 'rtl', name, ok, `dir=${dir} lang=${lang}`);
  const shot = join(proofOutDir, `${name}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  screenshots.push(shot);
}

async function run() {
  const results = [];
  const screenshots = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  try {
    await setArabicLocale(page);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
    const homeDir = await page.evaluate(() => document.documentElement.dir || '');
    record(results, 'rtl', 'home-precheck', homeDir === 'rtl', `dir=${homeDir}`);

    await captureSurface(page, results, screenshots, '/chat.html', 'rtl-chat-ar');
    await captureSurface(page, results, screenshots, '/create', 'rtl-creator-ar');
    await captureSurface(page, results, screenshots, '/marketplace.html', 'rtl-marketplace-ar');

    writeEvidenceBundle(docOutDir, `smoke-rtl-${runTag}`, {
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
