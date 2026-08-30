#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624i-genuine-agent-theatre', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624I browser fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No production account, prompt, file, provider key, payment or session data is present.'
};
const report = {
  schema: 'eonapp.w624i-genuine-agent-theatre-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth-or-job-execution',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, localJobExecutionClaimed: false,
  directByokExecutionClaimed: false, providerRequestClaimed: false, privateWorkReadClaimed: false,
  authoritativeProgressClaimedBeyondFixture: false, ownerVisualApprovalClaimed: false
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 700);

await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem('eon:eonbot:job-fabric:v1', JSON.stringify({
      schema: 'eonapp.eonbot-job-fabric.w435.v1', version: 1, updatedAt: new Date(now).toISOString(),
      jobs: [{ schema: 'eonapp.eonbot-job-fabric.w435.v1', version: 1, jobId: 'eonjob_browser_local_1234', state: 'ready-for-review', safeLabel: 'Local review receipt', taskClass: 'research', surfaceId: 'chat', capabilityMode: 'local', capabilityAvailable: true, reviewRequired: true, attempts: 1, createdAt: new Date(now - 2000).toISOString(), updatedAt: new Date(now - 1000).toISOString(), rawPrompt: 'PRIVATE PROMPT MUST NOT APPEAR', rawOutput: 'PRIVATE OUTPUT MUST NOT APPEAR' }],
      events: []
    }));
    localStorage.setItem('eon:city:genuine-agent-theatre:w624i:v1', JSON.stringify({
      schema: 'eon.city.genuine-agent-theatre.w624i.v1', updatedAt: new Date(now).toISOString(),
      receipts: [
        { schema: 'eon.city.agent-theatre-receipt.w624i.v1', jobId: 'eonagentjob_browser_local_1234', state: 'running', jobType: 'local-model', safeLabel: 'Local model fixture', sourceSurface: 'local-ai', rail: 'local', authoritativeProgress: true, progress: 38, createdAt: new Date(now - 3000).toISOString(), updatedAt: new Date(now).toISOString(), supportedActions: ['pause', 'cancel'], logs: [{ code: 'running', state: 'running', at: new Date(now).toISOString() }], prompt: 'PRIVATE LOCAL PROMPT MUST NOT APPEAR' },
        { schema: 'eon.city.agent-theatre-receipt.w624i.v1', jobId: 'eonagentjob_browser_byok_1234', state: 'waiting-for-user', jobType: 'direct-image', safeLabel: 'Direct BYOK fixture', sourceSurface: 'create', rail: 'direct-byok', createdAt: new Date(now - 4000).toISOString(), updatedAt: new Date(now - 500).toISOString(), logs: [{ code: 'waiting-for-user', state: 'waiting-for-user', at: new Date(now - 500).toISOString() }], providerKey: 'PRIVATE KEY MUST NOT APPEAR' }
      ]
    }));
  });
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

  await page.locator('[data-eon-play-open-command-room]').first().click();
  const theatre = page.locator('[data-eon-genuine-agent-theatre]');
  await theatre.waitFor({ state: 'visible', timeout: 10_000 });
  const jobCount = await page.locator('[data-eon-genuine-agent-job]').count();
  if (jobCount < 3) throw new Error(`Expected three bounded fixture receipts; found ${jobCount}.`);
  report.checkpoints.push('bounded-receipts-visible');

  const text = await theatre.textContent();
  if (/PRIVATE PROMPT|PRIVATE OUTPUT|PRIVATE LOCAL PROMPT|PRIVATE KEY/.test(text || '')) throw new Error('Private fixture content appeared in the Theatre.');
  if (!/Local model fixture/.test(text || '') || !/Direct BYOK fixture/.test(text || '')) throw new Error('Bounded safe fixture labels were missing.');
  report.checkpoints.push('private-fields-not-rendered');

  if (await page.locator('[data-eon-agent-native-route]').count() !== 0) throw new Error('Native actions were visible before review.');
  await page.locator('[data-eon-genuine-agent-review-button="eonagentjob_browser_local_1234"]').click();
  const reviewed = page.locator('[data-eon-genuine-agent-review]');
  await reviewed.getByText('Authoritative progress').waitFor({ state: 'visible', timeout: 10_000 });
  if (!/38%/.test(await reviewed.textContent() || '')) throw new Error('Authoritative fixture progress was not rendered.');
  if (await page.locator('[data-eon-agent-native-route]').count() < 2) throw new Error('Reviewed native actions were not exposed.');
  report.checkpoints.push('review-first-authoritative-progress-and-actions');

  const before = page.url();
  await page.locator('[data-eon-genuine-agent-review-button="eonagentjob_browser_byok_1234"]').click();
  const byokText = await reviewed.textContent();
  if (!/Direct BYOK/.test(byokText || '') || !/approved request/i.test(byokText || '')) throw new Error('Direct BYOK privacy boundary was missing.');
  if (page.url() !== before) throw new Error('Receipt review auto-navigated.');
  report.checkpoints.push('direct-byok-review-does-not-execute-or-navigate');

  const desktop = path.join(outputDir, '01-w624i-genuine-agent-theatre-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624i-genuine-agent-theatre-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_EXECUTION_PROOF_PENDING';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalDevice: false, realLocalJobExecution: false, realDirectByokExecution: false, providerRequest: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624I_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
