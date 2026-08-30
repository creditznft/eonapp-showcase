#!/usr/bin/env node
import { chromium } from 'playwright';
import { join } from 'node:path';
import { getBaseUrl, makeRunDirs, record, writeEvidenceBundle } from './smoke-shared.mjs';

const baseUrl = getBaseUrl();
const runTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
const { docOutDir, proofOutDir } = makeRunDirs(`homepage-proof-${runTag}`);

async function run() {
  const results = [];
  const screenshots = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const hero = await page.locator('h1').innerText().catch(() => '');
    const cta = await page.locator('.home-cta-row a[href="/build"]').innerText().catch(() => '');
    const builderTitle = await page.locator('[data-i18n-key="home.builder.title"]').innerText().catch(() => '');
    const shot = join(proofOutDir, 'homepage.png');
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);
    record(results, 'home', 'hero-cta', /business cockpit|AI/i.test(hero) && /build/i.test(cta), `Hero: ${hero} | CTA: ${cta}`);
    record(results, 'home', 'builder-teaser', /3 clicks to a live website/i.test(builderTitle), `Builder teaser: ${builderTitle}`);
    writeEvidenceBundle(docOutDir, `smoke-homepage-${runTag}`, {
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
