#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624l-city-completion', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true,
  identityAvailable: true, signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: true,
  loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624J-L browser fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No production account, file, prompt, provider key, payment or session data is present.'
};
const report = {
  schema: 'eonapp.w624l-city-completion-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium',
  lane: 'loopback-authorized-fixture-not-production-auth-or-physical-device-certification', status: 'BLOCKED',
  checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, nativeShareCompletionClaimed: false,
  collaborationDeliveryClaimed: false, audioOutputClaimed: false, controllerHardwareClaimed: false,
  thermalCertificationClaimed: false, flagshipCertificationClaimed: false, ownerVisualApprovalClaimed: false
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 700);
await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) }); });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url().replace(baseURL, ''), error: safe(request.failure()?.errorText || 'unknown') }));
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store', vary: 'Cookie' }, body: JSON.stringify(accessPayload) }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ ok: true, account: { signedIn: false, entitlement: null } }) }));
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('[data-eon-play-canvas-host] canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('[data-eon-city-play-root]')?.dataset?.eonCityFirstFrame === 'ready', null, { timeout: 60_000 });
  for (const [selector, closeSelector] of [['[data-eon-play-resume-panel]', '[data-eon-play-resume-continue]'], ['[data-eon-play-first-run-panel]', '[data-eon-play-close-start-here]']]) if (await page.locator(selector).isVisible().catch(() => false)) await page.locator(closeSelector).click();
  report.checkpoints.push('real-babylon-first-frame');

  await page.locator('[data-eon-play-share-city]').first().click();
  const sharing = page.locator('.eon-city-sharing-center');
  await sharing.waitFor({ state: 'visible', timeout: 10_000 });
  if (await page.locator('[data-eon-sharing-final]').count()) throw new Error('Final sharing actions appeared before manifest review.');
  const shareText = await sharing.textContent();
  if (!/Never included/.test(shareText || '') || !/No click, impression or social-post tracking/.test(shareText || '')) throw new Error('Sharing exclusions or tracking boundary missing.');
  await sharing.locator('button[type="submit"]').click();
  await page.locator('[data-eon-sharing-review-manifest]').click();
  if (await page.locator('[data-eon-sharing-final]').count() < 2) throw new Error('Reviewed platform actions were not exposed.');
  report.checkpoints.push('sharing-review-first-and-private-exclusions');
  await page.locator('[data-eon-sharing-close]').click();

  await page.getByRole('button', { name: 'Accessibility & device' }).click();
  const access = page.locator('.eon-city-accessibility-device-panel');
  await access.waitFor({ state: 'visible', timeout: 10_000 });
  if (!(await access.locator('input[name="muted"]').isChecked()) || !(await access.locator('input[name="captions"]').isChecked())) throw new Error('Muted/captions defaults were not present.');
  await access.locator('input[name="highContrast"]').check();
  await access.locator('button[type="submit"]').click();
  if ((await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-high-contrast')) !== 'true') throw new Error('High-contrast preference was not applied to the City root.');
  report.checkpoints.push('accessibility-local-explicit-and-muted-default');
  await page.locator('[data-eon-accessibility-close]').click();

  await page.getByRole('button', { name: 'Performance evidence' }).click();
  const performance = page.locator('.eon-city-flagship-certification-panel');
  await performance.waitFor({ state: 'visible', timeout: 10_000 });
  const performanceText = await performance.textContent();
  if (!/0\/11 cases passed/.test(performanceText || '') || !/never marks a pass automatically/i.test(performanceText || '')) throw new Error('Flagship evidence boundary was not honest.');
  await page.locator('[data-eon-flagship-case]').first().click();
  if (!/remains pending/i.test(await page.locator('[data-eon-flagship-review]').textContent() || '')) throw new Error('Evidence case review did not remain pending.');
  report.checkpoints.push('flagship-cannot-self-certify');

  const desktop = path.join(outputDir, '01-w624j-l-city-completion-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(400);
  const mobile = path.join(outputDir, '02-w624j-l-city-completion-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');
  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_PHYSICAL_DEVICE_AND_OWNER_APPROVAL_PENDING';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalDevice: false, nativeShareCompletion: false, audioOutput: false, controllerHardware: false, thermalCertification: false, ownerVisualApproval: false };
  await context.close();
} catch (error) {
  report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error);
} finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624L_CITY_COMPLETION_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
