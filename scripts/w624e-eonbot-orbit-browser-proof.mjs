#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624e-eonbot-orbit', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624E browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No account, project, Vault, provider, prompt, file, payment or production session data is present.'
};
const report = {
  schema: 'eonapp.w624e-eonbot-orbit-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, liveAiConversationClaimed: false,
  autonomousAgentClaimed: false, ownerVisualApprovalClaimed: false
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
  await page.waitForFunction(() => document.querySelector('[data-eon-city-play-root]')?.dataset?.eonCityFirstFrame === 'ready', null, { timeout: 60_000 });
  for (const [selector, closeSelector] of [
    ['[data-eon-command-room-panel]', '[data-eon-command-room-explore]'],
    ['[data-eon-play-resume-panel]', '[data-eon-play-resume-continue]'],
    ['[data-eon-play-first-run-panel]', '[data-eon-play-close-start-here]']
  ]) if (await page.locator(selector).isVisible().catch(() => false)) await page.locator(closeSelector).click();
  report.checkpoints.push('real-babylon-first-frame');

  report.contract = await page.evaluate(async () => {
    const orbit = await import('/assets/js/city/eon-city-eonbot-orbit-experience.js');
    const validation = orbit.validateEonCityEonbotOrbitExperience();
    return { valid: validation.ok, states: orbit.EON_CITY_EONBOT_ORBIT_STATES, routeHintCount: validation.routeHintCount, destinationHintCount: validation.destinationHintCount };
  });
  if (!report.contract.valid || report.contract.states.length !== 9) throw new Error('W624E browser contract did not validate.');
  report.checkpoints.push('nine-orbit-states-loaded');

  const guide = page.locator('[data-eon-play-orbit-guide]');
  await guide.waitFor({ state: 'visible', timeout: 10_000 });
  const guideBox = await guide.boundingBox();
  const canvasBox = await page.locator('[data-eon-play-canvas-host] canvas').boundingBox();
  report.layout = { guideBox, canvasBox, centralSightlineClear: Boolean(guideBox && canvasBox && guideBox.x > canvasBox.x + canvasBox.width * 0.5) };
  if (!report.layout.centralSightlineClear) throw new Error('Orbit guide overlaps the central sightline.');
  report.checkpoints.push('caption-shell-keeps-central-sightline-clear');

  await page.locator('[data-eon-play-orbit-help]').click();
  await page.waitForFunction(() => /Move freely, review a named landmark/i.test(document.querySelector('[data-eon-play-orbit-caption]')?.textContent || ''), null, { timeout: 10_000 });
  report.checkpoints.push('explicit-help-caption');

  await page.locator('[data-eon-play-orbit-less]').click();
  report.showLess = await page.locator('[data-eon-play-orbit-less]').getAttribute('aria-pressed');
  await page.locator('[data-eon-play-orbit-mute]').click();
  report.muted = await page.locator('[data-eon-play-orbit-mute]').getAttribute('aria-pressed');
  report.checkpoints.push('show-less-and-mute-controls');

  await page.locator('[data-eon-play-orbit-dismiss]').click();
  await guide.waitFor({ state: 'hidden', timeout: 10_000 });
  await page.locator('[data-eon-play-orbit-restore]').first().click();
  await guide.waitFor({ state: 'visible', timeout: 10_000 });
  report.checkpoints.push('dismiss-and-restore');

  report.runtime = await page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    return { orbitSchema: root?.dataset?.eonCityEonbotOrbit || null, routeState: root?.dataset?.eonCityRouteState || null };
  });
  if (!report.runtime.orbitSchema) throw new Error('Orbit runtime schema missing from City root.');
  report.checkpoints.push('local-runtime-schema-visible');

  const desktop = path.join(outputDir, '01-w624e-eonbot-orbit-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624e-eonbot-orbit-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_DEVICE_BOUNDARY';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalTouch: false, physicalController: false, liveAiConversation: false, autonomousAgent: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624E_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
