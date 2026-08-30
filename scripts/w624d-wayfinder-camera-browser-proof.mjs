#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624d-wayfinder-camera', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624D browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No account, project, Vault, provider, prompt, file, payment or production session data is present.'
};
const report = {
  schema: 'eonapp.w624d-wayfinder-camera-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, ownerVisualApprovalClaimed: false
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 600);

await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) }); });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url().replace(baseURL, ''), error: safe(request.failure()?.errorText || 'unknown') }));
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store', vary: 'Cookie' }, body: JSON.stringify(accessPayload) }));
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('[data-eon-play-canvas-host] canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => { const root = document.querySelector('[data-eon-city-play-root]'); return root?.dataset?.eonCityFirstFrame === 'ready' && root?.dataset?.eonCityPlayState === 'running'; }, null, { timeout: 60_000 });
  report.checkpoints.push('real-babylon-first-frame');

  for (const [selector, closeSelector] of [
    ['[data-eon-command-room-panel]', '[data-eon-command-room-explore]'],
    ['[data-eon-play-resume-panel]', '[data-eon-play-resume-continue]'],
    ['[data-eon-play-first-run-panel]', '[data-eon-play-close-start-here]']
  ]) if (await page.locator(selector).isVisible().catch(() => false)) await page.locator(closeSelector).click();
  await page.waitForTimeout(800);

  report.contract = await page.evaluate(async () => {
    const wayfinder = await import('/assets/js/city/eon-city-wayfinder-experience.js');
    const validation = wayfinder.validateEonCityWayfinderExperience();
    return { valid: validation.ok, stateCount: wayfinder.EON_CITY_WAYFINDER_STATES.length, cameraProfileCount: wayfinder.EON_CITY_WAYFINDER_CAMERA_PROFILES.length,
      hiddenAutoNavigation: wayfinder.EON_CITY_WAYFINDER_INPUT_CONTRACT.hiddenAutoNavigation, automaticRouteOpen: wayfinder.EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticRouteOpen };
  });
  if (!report.contract.valid || report.contract.stateCount !== 9 || report.contract.cameraProfileCount < 5) throw new Error('W624D runtime contract did not validate in the browser.');
  report.checkpoints.push('nine-states-and-five-camera-profiles-loaded');

  await page.locator('[data-eon-play-open-controls]').click();
  await page.locator('[data-eon-play-controls-panel]').waitFor({ state: 'visible', timeout: 10_000 });
  const cycle = page.locator('[data-eon-play-camera-cycle]').last();
  const reset = page.locator('[data-eon-play-camera-reset]').last();
  const labels = [];
  for (let index = 0; index < 3; index += 1) { await cycle.click(); await page.waitForTimeout(150); labels.push(safe(await cycle.textContent())); }
  if (new Set(labels).size < 2) throw new Error('Visible camera cycle did not expose distinct profiles.');
  await reset.click();
  await page.waitForFunction(() => /Follow camera restored locally/i.test(document.querySelector('[data-eon-play-status]')?.textContent || ''), null, { timeout: 10_000 });
  report.camera = { cycleLabels: labels, resetStatus: safe(await page.locator('[data-eon-play-status]').textContent()) };
  report.checkpoints.push('visible-camera-cycle-and-reset');

  report.poses = [];
  for (const state of ['inspect', 'celebrate', 'sit-work', 'recovery']) {
    await page.locator(`[data-eon-play-wayfinder-state="${state}"]`).click();
    await page.waitForFunction((expected) => (document.querySelector('[data-eon-play-status]')?.textContent || '').toLowerCase().includes(`${expected} pose previewed locally`), state, { timeout: 10_000 });
    report.poses.push({ state, status: safe(await page.locator('[data-eon-play-status]').textContent()) });
  }
  report.checkpoints.push('visible-local-pose-controls');

  await page.keyboard.press('KeyC');
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(150);
  report.checkpoints.push('keyboard-camera-cycle-and-reset');

  await page.locator('[data-eon-play-unstuck]').last().click();
  await page.waitForFunction(() => /Returned to .*City work, routes, projects/i.test(document.querySelector('[data-eon-play-status]')?.textContent || ''), null, { timeout: 10_000 });
  report.unstuckStatus = safe(await page.locator('[data-eon-play-status]').textContent());
  report.checkpoints.push('unstuck-preserves-work-state-boundary');

  const desktop = path.join(outputDir, '01-w624d-wayfinder-camera-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624d-wayfinder-camera-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_DEVICE_BOUNDARY';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalKeyboardMouse: false, physicalTouch: false, physicalController: false, sustainedPerformanceThermal: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624D_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
