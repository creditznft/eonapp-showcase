#!/usr/bin/env node
import { chromium } from 'playwright';
import { join } from 'node:path';
import { getBaseUrl, makeRunDirs, record, seedBrowserAI, writeEvidenceBundle } from './smoke-shared.mjs';

const baseUrl = getBaseUrl();
const runTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 10);
const { docOutDir, proofOutDir } = makeRunDirs(`creator-proof-${runTag}`);

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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1700 } });
  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const seeded = await seedBrowserAI(page);
    if (seeded.provider === 'guide') {
      record(results, 'creator', 'video-export', null, 'Skipped because no usable browser AI key was present.');
    } else {
      await page.goto(`${baseUrl}/eon-browser.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const creatorSurface = await openInternalAppSurface(page, '/creator-studio.html');
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForFunction((iframeSelector) => Boolean(document.querySelector(iframeSelector)?.contentWindow?.CreatorStudioAutomation), creatorSurface.frameSelector, { timeout: 15000 }).catch(() => {});
      await page.evaluate((iframeSelector) => {
        const win = document.querySelector(iframeSelector)?.contentWindow;
        win?.CreatorStudioAutomation?.goPanel?.('video');
        win?.CreatorStudioAutomation?.setRuntimeMode?.('cloud');
        win?.CreatorStudioAutomation?.bootstrapVideoProject?.('Proof Project', 960, 540, false);
      }, creatorSurface.frameSelector).catch(() => {});
      const buildResult = await page.evaluate(async (iframeSelector) => {
        const win = document.querySelector(iframeSelector)?.contentWindow;
        return await win?.CreatorStudioAutomation?.buildVideoPackage?.();
      }, creatorSurface.frameSelector);
      const exportResult = await page.evaluate(async (iframeSelector) => {
        const win = document.querySelector(iframeSelector)?.contentWindow;
        return await win?.CreatorStudioAutomation?.exportVideo?.('webm');
      }, creatorSurface.frameSelector);
      await page.waitForFunction(() => (window.EONBrowserDownloadManager?.read?.() || []).length > 0, null, { timeout: 120000 }).catch(() => {});
      const downloadRows = await page.evaluate(() => window.EONBrowserDownloadManager?.read?.() || []);
      const latestDownload = downloadRows.at(-1) || null;
      const exportStatus = String(exportResult?.status || buildResult?.status || '').trim();
      const exportCompleted = /export complete/i.test(exportStatus);
      const shot = join(proofOutDir, 'creator-export.png');
      await page.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      record(
        results,
        'creator',
        'video-export',
        Boolean(latestDownload) || exportCompleted,
        latestDownload
          ? `${latestDownload.filename} · ${latestDownload.source || 'creator-studio'}`
          : exportCompleted
            ? exportStatus
            : 'No downloads recorded yet.',
        { latestDownload, buildResult, exportResult }
      );
    }

    writeEvidenceBundle(docOutDir, `smoke-creator-${runTag}`, {
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
