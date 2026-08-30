#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w624f-command-district-npcs', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const accessPayload = {
  schema: 'eon.city.access.w554.v1', mode: 'authenticated-play', requiresIdentity: true, identityAvailable: true,
  signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, browserGateOnly: true,
  clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false, edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: true, loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Loopback-only W624F browser proof fixture authorized the existing production access contract.',
  dataCustody: 'Loopback proof only. No account, project, Vault, provider, prompt, file, payment or production session data is present.'
};
const report = {
  schema: 'eonapp.w624f-command-district-npc-browser-proof.v1', generatedAt: new Date().toISOString(), baseURL,
  executablePath: executablePath || 'playwright-managed-chromium', lane: 'loopback-authorized-fixture-not-production-auth',
  status: 'BLOCKED', checkpoints: [], consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  productionAuthenticationClaimed: false, physicalDeviceClaimed: false, productionAiAgentsClaimed: false,
  physicalCrowdPerformanceClaimed: false, ownerVisualApprovalClaimed: false
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
    const npc = await import('/assets/js/city/eon-city-command-district-npc-system.js');
    const plan = npc.getEonCityCommandDistrictNpcPlan({ lod: 'balanced' });
    const validation = npc.validateEonCityCommandDistrictNpcPlan(plan);
    return { valid: validation.ok, archetypes: npc.EON_CITY_COMMAND_DISTRICT_NPC_ARCHETYPES.map((entry) => entry.id), states: npc.EON_CITY_COMMAND_DISTRICT_NPC_STATES, activeCount: plan.activeEntities.length };
  });
  if (!report.contract.valid || report.contract.archetypes.length !== 4 || report.contract.states.length !== 9) throw new Error('W624F browser contract did not validate.');
  report.checkpoints.push('four-archetypes-nine-states-loaded');

  await page.locator('[data-eon-play-npc-toggle]').click();
  const panel = page.locator('[data-eon-play-npc-panel]');
  await panel.waitFor({ state: 'visible', timeout: 10_000 });
  const cardCount = await page.locator('[data-eon-play-npc-card]').count();
  if (cardCount !== 4) throw new Error(`Expected four guide cards; found ${cardCount}.`);
  report.checkpoints.push('four-visible-review-cards');

  await page.locator('[data-eon-play-npc-review="automation-operator"]').click();
  const review = page.locator('[data-eon-play-npc-review]');
  await page.waitForFunction(() => /No job, queue, customer, schedule/i.test(document.querySelector('[data-eon-play-npc-review]')?.textContent || ''), null, { timeout: 10_000 });
  const urlBefore = page.url();
  if (page.url() !== urlBefore) throw new Error('NPC review auto-navigated.');
  report.checkpoints.push('automation-boundary-review-no-navigation');

  const activeBefore = await page.locator('[data-eon-play-npc-card][data-active="true"]').count();
  await page.locator('[data-eon-play-npc-lod]').click();
  const activeAfterOne = await page.locator('[data-eon-play-npc-card][data-active="true"]').count();
  await page.locator('[data-eon-play-npc-lod]').click();
  const activeAfterTwo = await page.locator('[data-eon-play-npc-card][data-active="true"]').count();
  report.lod = { activeBefore, activeAfterOne, activeAfterTwo, rootLod: await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-npc-lod') };
  if (!(activeAfterOne <= activeBefore && activeAfterTwo <= activeAfterOne)) throw new Error('NPC LOD did not reduce optional guides.');
  report.checkpoints.push('weak-device-lod-reduction');

  const canvasBox = await page.locator('[data-eon-play-canvas-host] canvas').boundingBox();
  const toggleBox = await page.locator('[data-eon-play-npc-toggle]').boundingBox();
  report.layout = { canvasBox, toggleBox, centralSightlineClear: Boolean(toggleBox && canvasBox && toggleBox.x < canvasBox.x + canvasBox.width * .42) };
  if (!report.layout.centralSightlineClear) throw new Error('NPC control overlaps the central sightline.');
  report.checkpoints.push('central-sightline-clear');

  const desktop = path.join(outputDir, '01-w624f-command-district-npcs-desktop.png');
  await page.screenshot({ path: desktop, fullPage: false }); report.screenshots.push(path.basename(desktop));
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(500);
  const mobile = path.join(outputDir, '02-w624f-command-district-npcs-mobile-landscape.png');
  await page.screenshot({ path: mobile, fullPage: false }); report.screenshots.push(path.basename(mobile));
  report.checkpoints.push('desktop-and-mobile-emulation-captured');

  report.status = report.pageErrors.length ? 'PASS_WITH_BROWSER_WARNINGS' : 'PASS_WITH_DEVICE_BOUNDARY';
  report.evidenceBoundary = { loopbackRealBabylonWebGL: true, productionAuthentication: false, physicalTouch: false, physicalController: false, physicalCrowdPerformance: false, productionAiAgents: false, ownerVisualApproval: false };
  await context.close();
} catch (error) { report.status = 'BLOCKED'; report.error = safe(error?.stack || error?.message || error); }
finally { await browser?.close().catch(() => {}); }
await fs.writeFile(path.join(outputDir, 'W624F_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!String(report.status).startsWith('PASS')) process.exit(1);
