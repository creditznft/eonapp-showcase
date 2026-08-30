#!/usr/bin/env node
import { chromium } from 'playwright';
import { join } from 'node:path';
import { getBaseUrl, makeRunDirs, record, writeEvidenceBundle } from './smoke-shared.mjs';

const baseUrl = getBaseUrl();
const runTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
const { docOutDir, proofOutDir } = makeRunDirs(`browser-proof-${runTag}`);

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
    if (workstationFrame && String(workstationFrame.getAttribute('src') || '').includes(requestedRoute)) return '#ew-app-frame';
    const legacyFrame = document.getElementById('browser-frame');
    if (legacyFrame && String(legacyFrame.getAttribute('src') || '').includes(requestedRoute)) return '#browser-frame';
    return '';
  }, target, { timeout: 30000 });

  const frameSelector = await page.evaluate((requestedRoute) => {
    const workstationFrame = document.getElementById('ew-app-frame');
    if (workstationFrame && String(workstationFrame.getAttribute('src') || '').includes(requestedRoute)) return '#ew-app-frame';
    const legacyFrame = document.getElementById('browser-frame');
    if (legacyFrame && String(legacyFrame.getAttribute('src') || '').includes(requestedRoute)) return '#browser-frame';
    return '';
  }, target);

  if (!frameSelector) {
    throw new Error(`No active iframe matched ${target}`);
  }

  return { ...shell, frameSelector };
}

async function run() {
  const results = [];
  const screenshots = [];
  console.log('[smoke-browser] launching browser');
  const browser = await chromium.launch({ headless: true });
  console.log('[smoke-browser] browser launched');
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  console.log('[smoke-browser] page created');
  try {
    console.log('[smoke-browser] open base');
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    console.log('[smoke-browser] open cockpit');
    await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    const homeShot = join(proofOutDir, 'browser-home.png');
    await page.screenshot({ path: homeShot, fullPage: true });
    screenshots.push(homeShot);
    console.log('[smoke-browser] navigate chat');
    const chatSurface = await openInternalAppSurface(page, '/chat.html');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1200);
    console.log('[smoke-browser] inspect chat');
    await page.evaluate(() => window.EONBrowserAutomation?.inspectActivePage?.());
    console.log('[smoke-browser] seed chat input');
    const chatFrame = page.frameLocator(chatSurface.frameSelector);
    await chatFrame.locator('#chat-input').fill('Return exactly: EON LIVE OK.');
    const inputValue = await chatFrame.locator('#chat-input').inputValue();
    record(results, 'browser', 'dom-automation-mission', /EON LIVE OK/i.test(inputValue), `Chat input seeded: ${inputValue.slice(0, 120)}`);

    const shot = join(proofOutDir, 'browser-automation.png');
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);

    writeEvidenceBundle(docOutDir, `smoke-browser-${runTag}`, {
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
