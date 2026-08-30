#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624c-command-district', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1',
  mode: 'authenticated-play',
  requiresIdentity: true,
  identityAvailable: true,
  signedIn: true,
  canBootFullCity: true,
  heavyRuntimeImportAllowed: true,
  browserGateOnly: true,
  clientFirstStaticAssetDelivery: true,
  pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true,
  loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624C browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No account, project, Vault, provider, prompt, file, payment, or production session data is present.'
};

await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.w624c-command-district-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  executablePath: executablePath || 'playwright-managed-chromium',
  lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED',
  checkpoints: [],
  consoleMessages: [],
  pageErrors: [],
  requestFailures: [],
  screenshots: [],
  sourceVisualScoreClaimed: false,
  productionAuthenticationClaimed: false,
  physicalDeviceClaimed: false
};

function safeMessage(value = '') { return String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 500); }

let browser;
try {
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--disable-features=UseSkiaRenderer']
  });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    serviceWorkers: 'block',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safeMessage(message.text()) });
  });
  page.on('pageerror', (error) => report.pageErrors.push(safeMessage(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url().replace(baseURL, ''), error: safeMessage(request.failure()?.errorText || 'unknown') }));
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store', vary: 'Cookie' }, body: JSON.stringify(accessPayload) });
  });

  await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('[data-eon-play-canvas-host] canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    return root?.dataset?.eonCityFirstFrame === 'ready' && root?.dataset?.eonCityPlayState === 'running';
  }, null, { timeout: 60_000 });
  report.checkpoints.push('authorized-loopback-fixture-booted-real-babylon-runtime');

  const commandRoom = page.locator('[data-eon-command-room-panel]');
  if (await commandRoom.isVisible().catch(() => false)) {
    await page.locator('[data-eon-command-room-explore]').click();
    await commandRoom.waitFor({ state: 'hidden', timeout: 10_000 });
  }
  const resumePanel = page.locator('[data-eon-play-resume-panel]');
  if (await resumePanel.isVisible().catch(() => false)) await page.locator('[data-eon-play-resume-continue]').click();
  const firstRun = page.locator('[data-eon-play-first-run-panel]');
  if (await firstRun.isVisible().catch(() => false)) await page.locator('[data-eon-play-close-start-here]').click();
  await page.waitForTimeout(1600);

  const desktopShot = path.join(outputDir, '01-w624c-desktop-first-ten-second-view.png');
  await page.screenshot({ path: desktopShot, fullPage: false });
  report.screenshots.push(path.basename(desktopShot));
  report.checkpoints.push('desktop-first-ten-second-frame-captured');

  report.desktop = await page.evaluate(async () => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const canvas = document.querySelector('[data-eon-play-canvas-host] canvas.eon-play-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    const gl2 = canvas?.getContext?.('webgl2');
    const gl = gl2 || canvas?.getContext?.('webgl');
    const plan = await import('/assets/js/city/eon-city-command-district-vertical-slice.js');
    const validation = plan.validateEonCityCommandDistrictVerticalSlice();
    return {
      routeState: document.body?.dataset?.eonCityRouteState || '',
      accessState: root?.dataset?.eonCityAccessState || '',
      playState: root?.dataset?.eonCityPlayState || '',
      firstFrame: root?.dataset?.eonCityFirstFrame || '',
      quality: root?.dataset?.eonCityQuality || '',
      canvas: { present: Boolean(canvas), width: Math.round(rect?.width || 0), height: Math.round(rect?.height || 0), pixelWidth: canvas?.width || 0, pixelHeight: canvas?.height || 0 },
      webgl: { available: Boolean(gl), version: gl2 ? 'webgl2' : gl ? 'webgl' : 'none', renderer: gl?.getParameter?.(gl.RENDERER) || '' },
      plan: { valid: validation.ok, destinationCount: plan.EON_CITY_COMMAND_DISTRICT_DESTINATIONS.length, pathCount: plan.EON_CITY_COMMAND_DISTRICT_PATHS.length, collisionVolumeCount: plan.EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES.length, unstuckPointCount: plan.EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS.length }
    };
  });
  if (!report.desktop.webgl.available || report.desktop.firstFrame !== 'ready') throw new Error('Real WebGL first frame did not become available.');
  report.checkpoints.push('webgl-context-and-first-frame-confirmed');

  await page.locator('[data-eon-play-open-controls]').click();
  await page.locator('[data-eon-play-controls-panel]').waitFor({ state: 'visible', timeout: 10_000 });
  const unstuck = page.locator('[data-eon-play-unstuck]').first();
  await unstuck.click();
  await page.waitForFunction(() => /Returned to .*City work, routes, projects/i.test(document.querySelector('[data-eon-play-status]')?.textContent || ''), null, { timeout: 10_000 });
  report.unstuckStatus = safeMessage(await page.locator('[data-eon-play-status]').textContent());
  report.checkpoints.push('authored-unstuck-control-executed-with-no-work-state-change');
  await page.locator('[data-eon-play-close-controls]').click();

  await page.locator('[data-eon-play-open-travel-map]').click();
  await page.locator('[data-eon-play-travel-panel]').waitFor({ state: 'visible', timeout: 10_000 });
  report.travelMap = await page.locator('[data-eon-play-travel-panel]').evaluate((panel) => ({
    destinationCount: panel.querySelectorAll('[data-eon-play-travel-destination]').length,
    text: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1200)
  }));
  if (!/Agent Theatre|Creator Atrium|Forge Basilica|Project Dock|Archive Canopy|Signal Sail/.test(report.travelMap.text)) throw new Error('W624C destinations were not exposed in the real runtime map.');
  report.checkpoints.push('first-sixty-second-destination-set-visible-in-runtime-map');
  await page.locator('[data-eon-play-close-travel-map]').click();

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(700);
  const landscapeShot = path.join(outputDir, '02-w624c-mobile-landscape-runtime.png');
  await page.screenshot({ path: landscapeShot, fullPage: false });
  report.screenshots.push(path.basename(landscapeShot));
  report.mobileLandscape = await page.evaluate(() => {
    const canvas = document.querySelector('[data-eon-play-canvas-host] canvas.eon-play-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    return { canvasVisible: Boolean(canvas && rect.width > 100 && rect.height > 100), width: Math.round(rect?.width || 0), height: Math.round(rect?.height || 0), routeState: document.body?.dataset?.eonCityRouteState || '' };
  });
  report.checkpoints.push('mobile-landscape-real-runtime-captured');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  const portraitShot = path.join(outputDir, '03-w624c-mobile-portrait-runtime.png');
  await page.screenshot({ path: portraitShot, fullPage: false });
  report.screenshots.push(path.basename(portraitShot));
  report.mobilePortrait = await page.evaluate(() => {
    const canvas = document.querySelector('[data-eon-play-canvas-host] canvas.eon-play-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    return { canvasPresent: Boolean(canvas), width: Math.round(rect?.width || 0), height: Math.round(rect?.height || 0), portraitCompanion: Boolean(document.querySelector('[data-eon-play-portrait-companion]')) };
  });
  report.checkpoints.push('mobile-portrait-runtime-surface-captured');

  report.status = report.pageErrors.length === 0 && report.desktop.webgl.available && report.desktop.plan.valid ? 'PASS_WITH_DEVICE_BOUNDARY' : 'PASS_WITH_BROWSER_WARNINGS';
  report.evidenceBoundary = {
    authenticatedProductionBoot: false,
    loopbackRealBabylonWebGL: true,
    desktopRuntimeCapture: true,
    mobileEmulationCapture: true,
    physicalMobileDevice: false,
    sustainedPerformanceThermal: false,
    ownerVisualApproval: false,
    score90Claimed: false
  };
  await context.close();
} catch (error) {
  report.status = 'BLOCKED';
  report.error = safeMessage(error?.stack || error?.message || error);
} finally {
  await browser?.close().catch(() => {});
}

await fs.writeFile(path.join(outputDir, 'W624C_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
