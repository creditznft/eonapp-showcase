#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624g-productive-rpg-loop', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624G browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No account, project, Vault, provider, prompt, file, payment or production session data is present.'
};
const report = {
  schema: 'eonapp.w624g-productive-rpg-loop-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, productionOutcomeClaimed: false,
  providerExecutionClaimed: false, automationExecutionClaimed: false, backupExecutionClaimed: false,
  rewardOrEconomyClaimed: false, ownerVisualApprovalClaimed: false
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 700);

await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.removeItem('eon:city:productive-rpg:w624g:v1'));
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
    const rpg = await import('/assets/js/contracts/city/eon-city-productive-rpg-loop.js');
    const plan = rpg.getEonCityProductiveRpgPlan();
    const validation = rpg.validateEonCityProductiveRpgPlan(plan);
    return { valid: validation.ok, missions: plan.missions.map((entry) => entry.id), states: plan.states, completedCount: plan.completedCount };
  });
  if (!report.contract.valid || report.contract.missions.length !== 6 || report.contract.states.length !== 9) throw new Error('W624G browser contract did not validate.');
  report.checkpoints.push('six-missions-nine-states-loaded');

  await page.locator('[data-eon-play-rpg-toggle]').click();
  const panel = page.locator('[data-eon-play-rpg-panel]');
  await panel.waitFor({ state: 'visible', timeout: 10_000 });
  const cardCount = await page.locator('[data-eon-play-rpg-card]').count();
  if (cardCount !== 6) throw new Error(`Expected six mission cards; found ${cardCount}.`);
  report.checkpoints.push('six-visible-review-cards');

  const urlBeforeReview = page.url();
  await page.locator('[data-eon-play-rpg-review="automation"]').click();
  await page.waitForFunction(() => /No completion is claimed until a bounded receipt/i.test(document.querySelector('[data-eon-play-rpg-review]')?.textContent || ''), null, { timeout: 10_000 });
  if (page.url() !== urlBeforeReview) throw new Error('Mission review auto-navigated.');
  const routeHref = await page.locator('[data-eon-play-rpg-route="automation"]').getAttribute('href');
  if (routeHref !== '/automations') throw new Error(`Automation review exposed unexpected route ${routeHref}.`);
  report.checkpoints.push('review-first-second-action-route');

  await page.locator('[data-eon-play-rpg-start]').click();
  const activeState = await page.locator('[data-eon-play-rpg-review] article').getAttribute('data-state');
  if (!['active', 'resumed', 'review'].includes(activeState || '')) throw new Error(`Unexpected mission state after explicit start: ${activeState}.`);
  await page.locator('[data-eon-play-rpg-cancel]').click();
  const cancelledState = await page.locator('[data-eon-play-rpg-review] article').getAttribute('data-state');
  if (cancelledState !== 'cancelled') throw new Error(`Mission cancel state was ${cancelledState}.`);
  await page.locator('[data-eon-play-rpg-start]').click();
  const resumedState = await page.locator('[data-eon-play-rpg-review] article').getAttribute('data-state');
  if (resumedState !== 'resumed') throw new Error(`Mission resume state was ${resumedState}.`);
  report.checkpoints.push('explicit-start-cancel-resume');

  await page.locator('[data-eon-play-rpg-review="orientation"]').click();
  await page.locator('[data-eon-play-rpg-orientation]').click();
  await page.locator('[data-eon-play-rpg-refresh]').click();
  const orientationState = await page.locator('[data-eon-play-rpg-card="orientation"]').getAttribute('data-state');
  if (orientationState !== 'completed') throw new Error(`Orientation receipt did not produce completed state: ${orientationState}.`);
  report.checkpoints.push('verified-local-orientation-receipt');

  report.storage = await page.evaluate(() => {
    const raw = localStorage.getItem('eon:city:productive-rpg:w624g:v1');
    return raw ? JSON.parse(raw) : null;
  });
  const serialised = JSON.stringify(report.storage || {});
  if (/prompt|providerKey|passphrase|fileContent|walletAddress|emailAddress|projectTitle/i.test(serialised)) throw new Error('Private-work field appeared in mission storage.');
  report.checkpoints.push('bounded-local-storage-only');

  const desktop = path.join(outputDir, '01-w624g-productive-rpg-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624g-productive-rpg-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_DEVICE_BOUNDARY';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalTouch: false, physicalController: false, productionOutcomes: false, providerExecution: false, automationExecution: false, backupExecution: false, rewardsOrEconomy: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624G_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
