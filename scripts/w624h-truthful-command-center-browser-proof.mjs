#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624h-truthful-command-center', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624H browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No production account, project, Vault, provider, payment or session data is present.'
};
const report = {
  schema: 'eonapp.w624h-truthful-command-center-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, productionBillingClaimed: false,
  privateWorkReadClaimed: false, providerExecutionClaimed: false, jobExecutionClaimed: false,
  backupExecutionClaimed: false, ownerVisualApprovalClaimed: false
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 700);

await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.setItem('eon:workspace:projects:v1', JSON.stringify({ updatedAt: Date.now(), projects: [{ id: 'proof-project', name: 'PRIVATE PROJECT NAME MUST NOT APPEAR', content: 'PRIVATE CONTENT MUST NOT APPEAR', updatedAt: Date.now() }] }));
    localStorage.setItem('eon:chat:job-fabric:v1', JSON.stringify({ updatedAt: Date.now(), jobs: [{ id: 'proof-job', state: 'ready-for-review', label: 'PRIVATE JOB LABEL MUST NOT APPEAR', prompt: 'PRIVATE PROMPT MUST NOT APPEAR', updatedAt: Date.now() }] }));
    localStorage.setItem('eon:city:productive-rpg:w624g:v1', JSON.stringify({ missions: { 'local-ai-byok': { outcome: { verified: true, kind: 'local-ai-self-test', verifiedAt: Date.now() } }, 'vault-recovery': { outcome: { verified: true, kind: 'backup-readiness-receipt', verifiedAt: Date.now() } } } }));
  });
  const page = await context.newPage();
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) }); });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url().replace(baseURL, ''), error: safe(request.failure()?.errorText || 'unknown') }));
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store', vary: 'Cookie' }, body: JSON.stringify(accessPayload) }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify({ ok: true, account: { signedIn: true, accountId: 'PRIVATE-ACCOUNT-ID', entitlement: { tier_id: 'studio', status: 'active', updated_at: new Date().toISOString(), payment_record: 'PRIVATE-PAYMENT' } } }) }));
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('[data-eon-play-canvas-host] canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('[data-eon-city-play-root]')?.dataset?.eonCityFirstFrame === 'ready', null, { timeout: 60_000 });
  for (const [selector, closeSelector] of [['[data-eon-play-resume-panel]', '[data-eon-play-resume-continue]'], ['[data-eon-play-first-run-panel]', '[data-eon-play-close-start-here]']]) if (await page.locator(selector).isVisible().catch(() => false)) await page.locator(closeSelector).click();
  report.checkpoints.push('real-babylon-first-frame');

  await page.locator('[data-eon-play-open-command-room]').first().click();
  const center = page.locator('[data-eon-truthful-command-center]');
  await center.waitFor({ state: 'visible', timeout: 10_000 });
  const cardCount = await page.locator('[data-eon-truth-family]').count();
  if (cardCount < 6) throw new Error(`Expected at least six truthful status cards; found ${cardCount}.`);
  report.checkpoints.push('six-status-cards-visible');

  const text = await center.textContent();
  if (/PRIVATE PROJECT NAME|PRIVATE CONTENT|PRIVATE JOB LABEL|PRIVATE PROMPT|PRIVATE-ACCOUNT-ID|PRIVATE-PAYMENT/.test(text || '')) throw new Error('Private fixture content appeared in the Command Center.');
  if (!/Source/i.test(text || '') || !/Authority/i.test(text || '') || !/Freshness/i.test(text || '')) throw new Error('Traceability labels were not visible.');
  report.checkpoints.push('privacy-and-traceability-boundary');

  const urlBefore = page.url();
  if (await page.locator('[data-eon-truth-route]').count() !== 0) throw new Error('A route was visible before review.');
  await page.locator('[data-eon-truth-review-button="projects"]').click();
  const projectRoute = page.locator('[data-eon-truth-route][data-eon-truth-family="projects"]').first();
  await projectRoute.waitFor({ state: 'visible', timeout: 10_000 });
  if (await projectRoute.getAttribute('href') !== '/projects') throw new Error('Reviewed project route was not canonical.');
  if (page.url() !== urlBefore) throw new Error('Review auto-navigated.');
  report.checkpoints.push('review-first-second-action-route');

  await page.locator('[data-eon-truth-refresh]').click();
  await page.waitForFunction(() => /Server entitlement: studio · active/i.test(document.querySelector('[data-eon-truthful-command-center]')?.textContent || ''), null, { timeout: 10_000 });
  const refreshedText = await center.textContent();
  if (/PRIVATE-ACCOUNT-ID|PRIVATE-PAYMENT/.test(refreshedText || '')) throw new Error('Private billing fields appeared after refresh.');
  report.checkpoints.push('server-authoritative-billing-refresh');

  const desktop = path.join(outputDir, '01-w624h-command-center-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624h-command-center-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_DEVICE_BOUNDARY';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalTouch: false, physicalController: false, productionBilling: false, providerExecution: false, jobExecution: false, backupExecution: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624H_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
