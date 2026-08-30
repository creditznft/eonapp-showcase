#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'reports', 'w660z-living-nexus', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4182').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '/usr/bin/chromium');
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const accessPayload = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized', requiresIdentity: true,
  identityAvailable: true, signedIn: true, canBootFullCity: true, heavyRuntimeImportAllowed: true, staticPortalOnly: false,
  publicPreviewAvailable: false, browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  loginRoute: '/api/auth/google/start?returnTo=%2Feoncity', reason: 'Local W660Z fixture authorizes the existing signed-in City contract.',
  dataCustody: 'Local fixture only. No production identity, project, prompt, file, provider key or payment data is present.'
};
const billingPayload = { ok: true, checkoutActive: true, account: { signedIn: true, billing: { tierId: 'free', status: 'free' }, entitlement: { tier_id: 'free', status: 'free' } } };
const referralPayload = { ok: true, active: true, signedIn: true, account: { signedIn: true }, balances: { available: 0, reserved: 0, redeemed: 0 } };
const outcomeByRealm = {
  'archive-noir': { kind: 'backup-readiness-receipt', route: '/capsule', source: 'capsule-local' },
  'living-bio-city': { kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device' },
  'golden-sovereign': { kind: 'orientation-receipt', route: '/eoncity', source: 'city-local' },
  'forge-depths': { kind: 'project-shell', route: '/projects', source: 'projects-local' },
  'orbital-white-city': { kind: 'creator-guide-artifact', route: '/create', source: 'create-local-guide' },
  'nexus-ruins': { kind: 'automation-proposal', route: '/automations', source: 'automations-local' }
};
const safe = (value = '') => String(value).replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]').slice(0, 1600);
const report = {
  schema: 'eonapp.w660z.local-chromium-living-nexus-browser-proof.2026-07-21.v1', generatedAt: new Date().toISOString(), baseURL,
  status: 'BLOCKED', desktop: {}, mobile: {}, consoleMessages: [], pageErrors: [], requestFailures: [], screenshots: [],
  claims: { realLocalChromium: false, realLocalWebGL: false, productionAuthentication: false, productionDeployment: false, physicalMobileDevice: false, Opera: false, localFixtureOnly: true }
};

async function installRoutes(page) {
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(accessPayload) }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(billingPayload) }));
  await page.route('**/api/referrals**', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'cache-control': 'no-store' }, body: JSON.stringify(referralPayload) }));
  await page.route('**/release/candidate-provenance.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ wave: 'W660Z-local', commitSha: 'local-unpublished', source: 'local-browser-proof' }) }));
}
async function waitForCity(page) {
  await page.goto('/eoncity?w660zLocalProof=1&cityDebug=0', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 90_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const runtime = root?.__eonCityReducedRuntime;
    return runtime?.getRuntimeSummary?.()?.firstFrame === true && runtime?.getConnectedCoreSummary?.()?.districtCount === 9;
  }, null, { timeout: 120_000 });
}
async function localFrameObservation(page, frames = 120) {
  return page.evaluate(async (count) => {
    const samples = [];
    let previous = performance.now();
    for (let index = 0; index < count; index += 1) {
      await new Promise(requestAnimationFrame);
      const now = performance.now(); samples.push(now - previous); previous = now;
    }
    const ordered = [...samples].sort((a, b) => a - b);
    const averageMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return { frames: samples.length, averageFrameMs: Math.round(averageMs * 100) / 100, approximateFps: Math.round((1000 / averageMs) * 10) / 10, p95FrameMs: Math.round(ordered[Math.floor(ordered.length * 0.95)] * 100) / 100, localObservationOnly: true };
  }, frames);
}

let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--ignore-gpu-blocklist','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-features=UseSkiaRenderer','--no-proxy-server','--proxy-bypass-list=*'] });
  report.claims.realLocalChromium = true;
  const desktopContext = await browser.newContext({ baseURL, viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'no-preference' });
  await desktopContext.addInitScript(() => { try { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 16 }); } catch {} try { Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 16 }); } catch {} localStorage.clear(); });
  const page = await desktopContext.newPage();
  page.on('console', (message) => { if (['error','warning'].includes(message.type())) report.consoleMessages.push({ type: message.type(), text: safe(message.text()) }); });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => { if (/\/assets\/|\/api\/|\/eoncity/.test(request.url())) report.requestFailures.push({ url: safe(request.url().replace(baseURL,'')), error: safe(request.failure()?.errorText || 'unknown') }); });
  await installRoutes(page);
  await waitForCity(page);

  const initial = await page.evaluate(() => {
    const runtime = document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime;
    const canvas = document.querySelector('canvas.eon-play-canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    return { webgl: Boolean(gl), webglVersion: canvas?.getContext('webgl2') ? 'webgl2' : gl ? 'webgl' : 'none', runtime: runtime?.getRuntimeSummary?.(), core: runtime?.getConnectedCoreSummary?.(), nexus: runtime?.getLivingNexusSummary?.(), catalog: runtime?.getLivingNexusRealmCatalog?.() };
  });
  report.claims.realLocalWebGL = initial.webgl;
  if (!initial.webgl) throw new Error('Real local WebGL context unavailable.');
  if (initial.core?.districtCount !== 9 || initial.core?.stationCount !== 9 || initial.core?.streetConnectionCount < 17) throw new Error(`Connected Core not ready: ${JSON.stringify(initial.core)}`);
  if (initial.catalog?.length !== 6 || initial.catalog.some((entry) => entry.premiumAuthoredDepth !== true)) throw new Error('Six premium Realm catalog not ready.');

  const movement = [];
  for (const direction of ['forward','backward','left','right']) {
    await page.evaluate(() => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.restoreExplorationPose?.({ player: { x: 18, y: 0, z: 18, heading: 0 }, camera: { alpha: -1.57, beta: 1.03, radius: 12, target: { x: 18, y: 1.2, z: 18 } }, controller: { mode: 'third-person', pointerLookEnabled: false } }));
    const before = await page.evaluate(() => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.getPlayerPosition?.());
    const button = page.locator(`[data-eon-city-move="${direction}"]`);
    const box = await button.boundingBox(); if (!box) throw new Error(`Missing touch control ${direction}`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(280); await page.mouse.up(); await page.waitForTimeout(100);
    const after = await page.evaluate(() => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.getPlayerPosition?.());
    const distance = before && after ? Math.hypot(after.x-before.x, after.z-before.z) : 0;
    movement.push({ direction, distance, pathname: new URL(page.url()).pathname, passed: distance > 0.01 && new URL(page.url()).pathname === '/eoncity' });
  }
  if (movement.some((entry) => !entry.passed)) throw new Error(`Desktop movement failed: ${JSON.stringify(movement)}`);

  const expedition = await page.evaluate(async (outcomes) => {
    const runtime = document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime;
    const enterExpanse = runtime.enterLivingNexusDestination('expanse', { explicitUserAction: true });
    const deterministicPortalCell = { cellId: 'cell--10--5', x: -95, z: -45 };
    runtime.enterLivingNexusDestination('expanse', { explicitUserAction: true, returnPoint: deterministicPortalCell });
    const world = runtime.getLivingNexusWorldSystems();
    const returnPoint = world?.rarePortal ? { ...runtime.getPlayerPosition(), cellId: runtime.getLivingNexusSummary().currentCellId } : null;
    if (!world?.rarePortal) return { ok: false, reason: 'no-deterministic-portal-found', enterExpanse };
    const portal = world.rarePortal;
    const prepared = runtime.prepareLivingNexusRealm(portal.realmId, portal.id, { explicitUserAction: true });
    const entered = runtime.enterLivingNexusRealm(portal.realmId, portal.id, { explicitUserAction: true });
    const beforePlan = runtime.getLivingNexusRealmPlan();
    const outcome = outcomes[portal.realmId];
    const module = await import('/assets/js/contracts/city/eon-city-productive-rpg-loop.js');
    const recorded = module.recordEonCityProductiveRpgOutcome({ ...outcome, receiptId: `w660z-${portal.realmId}-browser-receipt`, verified: true }, { storage: localStorage, now: Date.now() });
    const synced = runtime.syncLivingNexusRealmVerifiedOutcome({ explicitUserAction: true });
    const afterPlan = runtime.getLivingNexusRealmPlan();
    const exited = runtime.exitLivingNexusRealm({ explicitUserAction: true });
    const afterExit = runtime.getPlayerPosition();
    const exactReturnDistance = returnPoint ? Math.hypot(afterExit.x-returnPoint.x, afterExit.z-returnPoint.z) : null;
    const myRealm = runtime.enterLivingNexusDestination('my-realm', { explicitUserAction: true, transformations: [{ id: afterPlan.transformation.id, destination: 'my-realm', location: afterPlan.id, label: afterPlan.transformation.label, receiptId: afterPlan.transformation.receiptId }] });
    const realmSummary = runtime.getLivingNexusSummary();
    const core = runtime.enterLivingNexusDestination('core', { explicitUserAction: true });
    return { ok: true, portal, prepared: { ok: prepared.ok, realmId: prepared.plan?.id }, entered: { ok: entered.ok, destination: entered.destination }, before: { transformation: beforePlan?.transformation, zones: beforePlan?.zones?.length, discoveries: beforePlan?.discoveries?.length, specialist: beforePlan?.specialist?.label }, recorded, synced: { ok: synced.ok, transformed: synced.transformed, newlyTransformed: synced.newlyTransformed }, after: { transformation: afterPlan?.transformation, reflection: afterPlan?.realmReflection }, exited: { ok: exited.ok, destination: exited.destination, exactReturnDistance }, myRealm: { ok: myRealm.ok, renderedTransformationCount: realmSummary.renderedTransformationCount }, core: { ok: core.ok, destination: core.destination }, finalSummary: runtime.getLivingNexusSummary() };
  }, outcomeByRealm);
  if (!expedition.ok || !expedition.prepared.ok || !expedition.entered.ok || !expedition.recorded.ok || !expedition.synced.transformed || expedition.exited.exactReturnDistance > 0.05 || !expedition.myRealm.ok || !expedition.core.ok) throw new Error(`Expedition loop failed: ${JSON.stringify(expedition)}`);

  const frameObservation = await localFrameObservation(page, 120);
  const desktopShot = 'w660z-desktop-connected-core-return.png'; await page.screenshot({ path: path.join(outputDir, desktopShot), fullPage: false }); report.screenshots.push(desktopShot);
  report.desktop = { initial, movement, expedition, frameObservation, pathname: new URL(page.url()).pathname, status: 'PASS' };
  await desktopContext.close();

  const mobileContext = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await mobileContext.addInitScript(() => { localStorage.clear(); try { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 4 }); } catch {} try { Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 4 }); } catch {} });
  const mobilePage = await mobileContext.newPage(); await installRoutes(mobilePage); await waitForCity(mobilePage);
  const mobileInitial = await mobilePage.evaluate(() => { const runtime=document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime; const controls=document.querySelector('[data-eon-city-touch-controls]'); const rect=controls?.getBoundingClientRect(); return { summary: runtime?.getRuntimeSummary?.(), nexus: runtime?.getLivingNexusSummary?.(), core: runtime?.getConnectedCoreSummary?.(), controlCount: document.querySelectorAll('[data-eon-city-move]').length, controlsRect: rect ? { width: rect.width, height: rect.height, left: rect.left, top: rect.top } : null, horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
  if (mobileInitial.controlCount !== 4 || mobileInitial.horizontalOverflow || mobileInitial.nexus?.reducedEffects !== true || mobileInitial.core?.motionEnabled !== false) throw new Error(`Mobile/reduced-effects contract failed: ${JSON.stringify(mobileInitial)}`);
  const mobileMovement = [];
  for (const direction of ['forward','backward','left','right']) {
    const before = await mobilePage.evaluate(() => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.getPlayerPosition?.());
    const button = mobilePage.locator(`[data-eon-city-move="${direction}"]`); const box = await button.boundingBox(); if (!box) throw new Error(`Mobile ${direction} missing`);
    await mobilePage.touchscreen.tap(box.x + box.width/2, box.y + box.height/2); await mobilePage.waitForTimeout(220);
    const after = await mobilePage.evaluate(() => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.getPlayerPosition?.());
    mobileMovement.push({ direction, distance: before&&after?Math.hypot(after.x-before.x,after.z-before.z):0, pathname:new URL(mobilePage.url()).pathname });
  }
  if (mobileMovement.some((entry) => entry.pathname !== '/eoncity')) throw new Error(`Mobile route escaped EONCITY: ${JSON.stringify(mobileMovement)}`);
  const portraitShot='w660z-mobile-portrait-reduced-effects.png'; await mobilePage.screenshot({path:path.join(outputDir,portraitShot),fullPage:false}); report.screenshots.push(portraitShot);
  await mobilePage.setViewportSize({ width: 844, height: 390 }); await mobilePage.waitForTimeout(250);
  const landscape = await mobilePage.evaluate(() => ({ horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, controls: document.querySelectorAll('[data-eon-city-move]').length, pathname: location.pathname }));
  const landscapeShot='w660z-mobile-landscape-reduced-effects.png'; await mobilePage.screenshot({path:path.join(outputDir,landscapeShot),fullPage:false}); report.screenshots.push(landscapeShot);
  if (landscape.horizontalOverflow || landscape.controls !== 4 || landscape.pathname !== '/eoncity') throw new Error(`Mobile landscape contract failed: ${JSON.stringify(landscape)}`);
  report.mobile = { initial: mobileInitial, movement: mobileMovement, landscape, status: 'PASS', emulatedMobileOnly: true, physicalDeviceClaimed: false };
  await mobileContext.close();

  const substantiveConsoleErrors = report.consoleMessages.filter((entry) => entry.type === 'error' && !/extension|wallet|favicon/i.test(entry.text));
  if (report.pageErrors.length || substantiveConsoleErrors.length) throw new Error(`Browser errors: ${JSON.stringify({ pageErrors: report.pageErrors, consoleErrors: substantiveConsoleErrors })}`);
  report.status = 'PASS';
} catch (error) {
  report.status = report.claims.realLocalChromium && report.claims.realLocalWebGL ? 'FAIL' : 'BLOCKED';
  report.error = safe(error?.stack || error?.message || error);
} finally {
  await browser?.close().catch(() => {});
}
await fs.writeFile(path.join(outputDir, 'W660Z_LOCAL_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
