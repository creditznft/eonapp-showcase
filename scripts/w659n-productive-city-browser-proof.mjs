#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityW660CompletionMatrix } from '../assets/js/city/w660/eon-city-w660-completion-matrix.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, 'reports', 'w659n-productive-city', 'browser-proof');
const baseURL = String(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4178').replace(/\/$/, '');
const executablePath = String(process.env.CHROMIUM_PATH || '').trim();
const headed = process.env.W659N_HEADED === '1';
const completionMatrix = buildEonCityW660CompletionMatrix();
const expectedEffectiveAssets = new Set(completionMatrix.effectiveAssetIds);
const allowedNonResidentFallbacks = new Set(['eoncity-pathfinder-prime-11clips', 'eoncity-pathfinder-a-vanguard-6clips']);

const accessPayload = {
  schema: 'eon.city.access.w649b.v1',
  mode: 'authenticated-play',
  accessState: 'authorized',
  requiresIdentity: true,
  identityAvailable: true,
  signedIn: true,
  canBootFullCity: true,
  heavyRuntimeImportAllowed: true,
  staticPortalOnly: false,
  publicPreviewAvailable: false,
  browserGateOnly: true,
  clientFirstStaticAssetDelivery: true,
  pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: false,
  loginRoute: '/api/auth/google/start?returnTo=%2Feoncity',
  reason: 'Local W660 milestone fixture authorizes the existing signed-in City contract.',
  dataCustody: 'Local fixture only; no production account, prompt, project, file, provider key or payment data is present.'
};
const billingPayload = {
  ok: true,
  checkoutActive: true,
  account: {
    signedIn: true,
    billing: { tierId: 'free', status: 'free' },
    entitlement: { tier_id: 'free', status: 'free' }
  }
};
const referralPayload = {
  ok: true,
  active: true,
  signedIn: true,
  account: { signedIn: true },
  balances: { available: 0, reserved: 0, redeemed: 0 }
};
const districtTargets = [
  ['orientation', 'orientation-hall'],
  ['transit', 'transit-network'],
  ['agent', 'agent-theatre'],
  ['creator', 'creator-atrium'],
  ['forge', 'forge-basilica'],
  ['command', 'command-centre'],
  ['archive', 'archive-canopy'],
  ['vault', 'vault-station'],
  ['trade', 'trade-dome']
];

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.w660.productive-city-local-browser-proof.v2',
  generatedAt: new Date().toISOString(),
  baseURL,
  lane: 'local-authorized-real-babylon-nine-district-product-integration',
  headed,
  status: 'BLOCKED',
  checkpoints: [],
  consoleMessages: [],
  pageErrors: [],
  requestFailures: [],
  failedResponses: [],
  cityAssetResponses: [],
  screenshots: [],
  districts: [],
  completionMatrix: {
    effectiveAssetCount: completionMatrix.effectiveAssetCount,
    playableDistrictCount: completionMatrix.playableDistrictCount,
    nexusStationCount: completionMatrix.nexusStationCount
  },
  physicalDeviceClaimed: false,
  productionAuthenticationClaimed: false,
  cameraPermissionClaimed: false,
  microphonePermissionClaimed: false,
  actualRecordingClaimed: false,
  actualCheckoutClaimed: false,
  actualSocialPostClaimed: false
};
const safe = (value = '') => String(value)
  .replace(/(token|cookie|authorization|key|session)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
  .slice(0, 1000);
const normalizePath = (url = '') => String(url).replace(baseURL, '');
const relevantFailedResponse = (url = '') => {
  const pathname = normalizePath(url);
  return pathname.startsWith('/assets/') || pathname.startsWith('/api/') || pathname.startsWith('/eoncity');
};

let browser;
try {
  browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: !headed,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-features=UseSkiaRenderer',
      ...(process.env.W659N_HOST_RESOLVER_RULES ? [`--host-resolver-rules=${process.env.W659N_HOST_RESOLVER_RULES}`] : [])
    ]
  });

  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1100, height: 700 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    reducedMotion: 'no-preference'
  });
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, 'deviceMemory', { configurable: true, get: () => 16 }); } catch {}
    try { Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, get: () => 16 }); } catch {}
  });

  const page = await context.newPage();
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
      report.consoleMessages.push({ type: message.type(), text: safe(message.text()) });
    }
  });
  page.on('pageerror', (error) => report.pageErrors.push(safe(error?.message || error)));
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (relevantFailedResponse(url)) report.requestFailures.push({ url: normalizePath(url), error: safe(request.failure()?.errorText || 'unknown') });
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/assets/city/')) {
      report.cityAssetResponses.push({ path: normalizePath(url), status: response.status(), contentType: response.headers()['content-type'] || '' });
    }
    if (response.status() >= 400 && relevantFailedResponse(url)) {
      report.failedResponses.push({ path: normalizePath(url), status: response.status() });
    }
  });

  await page.route('**/api/city/access', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store', vary: 'Cookie' },
    body: JSON.stringify(accessPayload)
  }));
  await page.route('**/api/billing/status', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify(billingPayload)
  }));
  await page.route('**/api/referrals**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify(referralPayload)
  }));
  await page.route('**/release/candidate-provenance.json', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify({ wave: 'W660-local', commit: 'local-unpublished', source: 'local-proof' })
  }));

  await page.goto('/eoncity?w660LocalProof=1&cityDebug=0', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 90_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const runtime = root?.__eonCityReducedRuntime;
    return root?.dataset?.eonCityProductiveCity === 'ready'
      && runtime?.getRuntimeSummary?.()?.firstFrame === true
      && runtime?.getProductiveCitySummary?.()?.nexus?.stationCount === 9;
  }, null, { timeout: 120_000 });
  report.checkpoints.push('authorized-entry-real-babylon-productive-city-nine-nexus-ready');

  const runtimeSnapshot = async () => page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const runtime = root?.__eonCityReducedRuntime;
    const canvas = document.querySelector('canvas.eon-play-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    const gl2 = canvas?.getContext?.('webgl2');
    const gl = gl2 || canvas?.getContext?.('webgl');
    const core = runtime?.getRuntimeSummary?.() || null;
    const product = runtime?.getProductiveCitySummary?.() || null;
    return {
      root: {
        accessState: root?.dataset?.eonCityAccessState || '',
        renderer: root?.dataset?.eonCityRenderer || '',
        qualityProfile: root?.dataset?.eonCityQualityProfile || '',
        qualitySelection: root?.dataset?.eonCityQualitySelection || '',
        gpuRenderer: root?.dataset?.eonCityGpuRenderer || '',
        discreteGpu: root?.dataset?.eonCityDiscreteGpu === 'true',
        softwareRenderer: root?.dataset?.eonCitySoftwareRenderer === 'true',
        productiveCity: root?.dataset?.eonCityProductiveCity || '',
        nexusStationCount: Number(root?.dataset?.eonCityNexusStationCount || 0),
        functionalStationCount: Number(root?.dataset?.eonCityFunctionalStationCount || 0),
        productDistrict: root?.dataset?.eonCityProductDistrict || ''
      },
      canvas: {
        present: Boolean(canvas),
        width: Math.round(rect?.width || 0),
        height: Math.round(rect?.height || 0),
        pixelWidth: canvas?.width || 0,
        pixelHeight: canvas?.height || 0
      },
      webgl: {
        available: Boolean(gl),
        version: gl2 ? 'webgl2' : gl ? 'webgl' : 'none',
        renderer: gl?.getParameter?.(gl.RENDERER) || ''
      },
      core,
      product,
      dom: {
        productDock: Boolean(document.querySelector('.eon-city-product-dock')),
        progressionPanel: Boolean(document.querySelector('[data-eon-city-w659g-progression]')),
        captureStudio: Boolean(document.querySelector('[data-eon-city-w659g-capture]')),
        membershipConsole: Boolean(document.querySelector('[data-eon-city-w659g-membership]')),
        sharingCenter: Boolean(document.querySelector('.eon-city-sharing-center')),
        eonbotInput: Boolean(document.querySelector('[data-eon-city-eonbot-input]'))
      }
    };
  });

  report.runtime = await runtimeSnapshot();
  if (!report.runtime.webgl.available) throw new Error('Local proof did not obtain a real WebGL context.');
  if (!['lite', 'balanced', 'cinematic'].includes(report.runtime.root.qualityProfile)) {
    throw new Error(`Unknown quality profile: ${report.runtime.root.qualityProfile || 'none'}`);
  }
  if (report.runtime.product?.stationCount !== 6) throw new Error('Productive City did not expose all six functional stations.');
  if (report.runtime.product?.nexus?.stationCount !== 9) throw new Error('Productive City did not render all nine Nexus stations.');
  if (!report.runtime.product?.oneBabylonOwner || report.runtime.product?.legacyRuntimeOwnerImported) {
    throw new Error('One-Babylon-owner boundary was not preserved.');
  }
  if (!report.runtime.dom.productDock || !report.runtime.dom.progressionPanel || !report.runtime.dom.captureStudio || !report.runtime.dom.membershipConsole || !report.runtime.dom.sharingCenter || !report.runtime.dom.eonbotInput) {
    throw new Error('One or more Productive City DOM systems are missing.');
  }
  report.checkpoints.push('truthful-local-quality-one-owner-six-stations-nine-nexus');

  const observedAssetIds = new Set();
  const observedFunctionalAssetIds = new Set();
  const observedStreamedDistrictIds = new Set();
  const addObservedAssets = (snapshot) => {
    for (const id of snapshot?.product?.activeAssetIds || []) observedAssetIds.add(id);
    for (const id of snapshot?.product?.functionalAssets?.residentAssetIds || []) observedFunctionalAssetIds.add(id);
    for (const row of snapshot?.core?.district?.residents || []) for (const id of row.loadedAssetIds || []) observedAssetIds.add(id);
    const playerId = snapshot?.core?.w649Core?.player?.assetId;
    const eonbotId = snapshot?.core?.w649Core?.eonbot?.assetId;
    if (playerId) observedAssetIds.add(playerId);
    if (eonbotId) observedAssetIds.add(eonbotId);
  };
  addObservedAssets(report.runtime);

  for (let index = 0; index < districtTargets.length; index += 1) {
    const [landmarkId, districtId] = districtTargets[index];
    const focused = await page.evaluate((id) => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.focusLandmark?.(id) === true, landmarkId);
    if (!focused) throw new Error(`Could not focus City landmark: ${landmarkId}`);

    await page.waitForFunction((expectedDistrictId) => {
      const runtime = document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime;
      const product = runtime?.getProductiveCitySummary?.();
      if (product?.currentDistrictId !== expectedDistrictId) return false;
      const assets = product?.functionalAssets;
      if (!assets || assets.queuedAssetIds?.length || assets.inFlightAssetIds?.length) return false;
      if (expectedDistrictId === 'command-centre') return true;
      const district = runtime?.getCoreResidencySummary?.()?.district;
      const row = district?.residents?.find?.((entry) => entry.districtId === expectedDistrictId);
      return district?.activeDistrictId === expectedDistrictId && Number(row?.loadedCount || 0) > 0;
    }, districtId, { timeout: 120_000 });

    await page.waitForTimeout(500);
    const snapshot = await runtimeSnapshot();
    addObservedAssets(snapshot);
    const districtRow = snapshot.core?.district?.residents?.find?.((entry) => entry.districtId === districtId) || null;
    if (districtId !== 'command-centre') observedStreamedDistrictIds.add(districtId);
    const record = {
      landmarkId,
      districtId,
      productDistrictId: snapshot.product?.currentDistrictId || '',
      streamedDistrictId: snapshot.core?.district?.activeDistrictId || '',
      loadedDistrictAssetIds: districtRow?.loadedAssetIds || [],
      residentFunctionalAssetIds: snapshot.product?.functionalAssets?.residentAssetIds || [],
      nearestNexusId: snapshot.product?.nexus?.nearest?.station?.id || null,
      failedDistrictAssets: Number(snapshot.core?.district?.failedAssetCount || 0),
      failedFunctionalAssets: Number(snapshot.product?.functionalAssets?.failedLoadCount || 0)
    };
    if (record.failedDistrictAssets || record.failedFunctionalAssets) throw new Error(`Asset failure recorded in ${districtId}.`);
    report.districts.push(record);

    if ([0, 4, 8].includes(index)) {
      const screenshotName = `${String(index + 1).padStart(2, '0')}-${districtId}.png`;
      await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false, timeout: 30_000 });
      report.screenshots.push(screenshotName);
    }
    console.log(`[W660_LOCAL_PROOF] district ${index + 1}/${districtTargets.length} ${districtId} districtAssets=${record.loadedDistrictAssetIds.length} functionalResidents=${record.residentFunctionalAssetIds.length}`);
  }
  report.checkpoints.push('all-nine-districts-traversed-with-progressive-residency');

  const missingEffectiveAssets = [...expectedEffectiveAssets].filter((id) => !observedAssetIds.has(id));
  const unexpectedAssets = [...observedAssetIds].filter((id) => !expectedEffectiveAssets.has(id));
  const missingAllowed = missingEffectiveAssets.length <= 1 && missingEffectiveAssets.every((id) => allowedNonResidentFallbacks.has(id));
  const expectedFunctionalIds = new Set(completionMatrix.functionalReplacementAssetIds);
  const missingFunctionalAssets = [...expectedFunctionalIds].filter((id) => !observedFunctionalAssetIds.has(id));
  const expectedStreamedDistricts = completionMatrix.playableDistrictIds.filter((id) => id !== 'command-centre');
  const missingStreamedDistricts = expectedStreamedDistricts.filter((id) => !observedStreamedDistrictIds.has(id));
  report.assetAuthority = {
    expectedEffectiveCount: expectedEffectiveAssets.size,
    observedUniqueCount: observedAssetIds.size,
    observedAssetIds: [...observedAssetIds].sort(),
    observedFunctionalAssetIds: [...observedFunctionalAssetIds].sort(),
    missingEffectiveAssets,
    missingFunctionalAssets,
    missingStreamedDistricts,
    unexpectedAssets,
    fullEffectiveResidencyRequired: report.runtime.root.qualityProfile === 'cinematic',
    nonSelectedPathfinderFallbackAllowed: missingAllowed
  };
  if (unexpectedAssets.length || missingFunctionalAssets.length || missingStreamedDistricts.length) {
    throw new Error(`Runtime asset authority mismatch. Missing functional=${missingFunctionalAssets.join(',') || 'none'} missing districts=${missingStreamedDistricts.join(',') || 'none'} unexpected=${unexpectedAssets.join(',') || 'none'}.`);
  }
  if (report.runtime.root.qualityProfile === 'cinematic' && !missingAllowed) {
    throw new Error(`Cinematic runtime did not expose the complete effective authority: ${missingEffectiveAssets.join(',') || 'none'}.`);
  }
  report.checkpoints.push('effective-asset-authority-observed-across-traversal');

  const closePanels = async () => {
    await page.locator('[data-eon-w659n-close]:visible').first().click({ timeout: 1500 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
  };
  async function openPanel(id, selector, checkpoint, screenshotName = '') {
    await closePanels();
    const opened = await page.evaluate((panelId) => document.querySelector('[data-eon-city-play-root]')?.__eonCityReducedRuntime?.openProductPanel?.(panelId) === true, id);
    if (!opened) throw new Error(`Product panel did not open: ${id}`);
    await page.locator(selector).waitFor({ state: 'visible', timeout: 10_000 });
    report.checkpoints.push(checkpoint);
    if (screenshotName) {
      await page.screenshot({ path: path.join(outputDir, screenshotName), fullPage: false });
      report.screenshots.push(screenshotName);
    }
  }

  await openPanel('city-menu', '[data-eon-w659n-panel="city-menu"]', 'city-command-menu-opens', '10-city-command-menu.png');
  await openPanel('travel-map', '[data-eon-w659n-panel="travel-map"]', 'transit-hub-review-first-panel-opens');
  report.travel = await page.locator('[data-eon-w659n-panel="travel-map"]').evaluate((panel) => ({
    destinationCount: panel.querySelectorAll('[data-eon-w659n-travel]').length,
    confirmationCount: panel.querySelectorAll('[data-eon-w659n-confirm-travel]').length,
    text: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1600)
  }));
  if (report.travel.destinationCount !== 9 || !/Travel never starts from proximity alone/i.test(report.travel.text)) {
    throw new Error(`Transit Hub contract mismatch: ${report.travel.destinationCount} destinations.`);
  }

  await openPanel('eonbot', '[data-eon-w659n-panel="eonbot"]', 'eonbot-mini-chat-and-voice-panel-opens', '11-eonbot-mini-chat-voice.png');
  report.eonbot = await page.locator('[data-eon-w659n-panel="eonbot"]').evaluate((panel) => ({
    textInput: Boolean(panel.querySelector('[data-eon-city-eonbot-input]')),
    dictate: Boolean(panel.querySelector('[data-eon-city-eonbot-dictate]')),
    voiceConversation: Boolean(panel.querySelector('[data-eon-city-eonbot-conversation]')),
    liveVoice: Boolean(panel.querySelector('[data-eon-city-eonbot-live]')),
    fullChatRoute: panel.querySelector('[data-eon-city-eonbot-open-chat]')?.getAttribute('href') || ''
  }));
  if (!Object.values(report.eonbot).every(Boolean)) throw new Error('EONBOT text/voice surface is incomplete.');

  await openPanel('missions-rewards', '[data-w659g-panel]', 'missions-xp-vault-eonkeys-panel-opens');
  report.progression = await page.locator('[data-w659g-panel]').evaluate((panel) => ({
    text: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1800),
    revealButton: Boolean(panel.querySelector('[data-w659g-reveal]'))
  }));
  if (!/City XP/i.test(report.progression.text) || !/EONKEYS/i.test(report.progression.text) || !report.progression.revealButton) {
    throw new Error('Progression panel is missing XP, EONKEYS or Vault Reveal controls.');
  }

  await openPanel('creator-capture', '[data-capture-panel]', 'creator-capture-panel-opens', '12-creator-capture.png');
  report.capture = await page.locator('[data-capture-panel]').evaluate((panel) => ({
    microphoneOption: Boolean(panel.querySelector('[data-capture-mic]')),
    facecamOption: Boolean(panel.querySelector('[data-capture-face]')),
    startButton: Boolean(panel.querySelector('[data-capture-start]')),
    saveButton: Boolean(panel.querySelector('[data-capture-save]')),
    shareButton: Boolean(panel.querySelector('[data-capture-share]')),
    truth: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1400)
  }));
  if (!report.capture.microphoneOption || !report.capture.facecamOption || !report.capture.startButton || !report.capture.saveButton || !report.capture.shareButton || !/Nothing uploads to EONAPP/i.test(report.capture.truth)) {
    throw new Error('Creator Capture surface or privacy boundary is incomplete.');
  }

  await openPanel('membership', '[data-membership-panel]', 'server-backed-membership-panel-opens');
  await page.waitForFunction(() => /Current server state|Hosted checkout/.test(document.querySelector('[data-membership-content]')?.textContent || ''), null, { timeout: 10_000 });
  report.membership = await page.locator('[data-membership-panel]').evaluate((panel) => ({
    planCount: panel.querySelectorAll('[data-membership-checkout]').length,
    text: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1800)
  }));
  if (report.membership.planCount < 4 || !/Dodo Payments/i.test(report.membership.text)) {
    throw new Error('Membership console did not expose the reviewed hosted billing lifecycle.');
  }

  await openPanel('command-room', '[data-eon-w659n-panel="command-room"]', 'genuine-agent-theatre-panel-opens');
  await openPanel('share-center', '.eon-city-sharing-center', 'review-first-sharing-center-opens', '13-sharing-center.png');
  report.sharing = await page.locator('.eon-city-sharing-center').evaluate((panel) => ({
    text: String(panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1700),
    form: Boolean(panel.querySelector('[data-eon-sharing-form]'))
  }));
  if (!report.sharing.form || !/Nothing is copied, posted, invited or shared yet/i.test(report.sharing.text)) {
    throw new Error('Sharing Center review-first boundary is incomplete.');
  }

  await closePanels();
  const nexusOpened = await page.evaluate(() => {
    const button = document.querySelector('[data-eon-w659n-nexus]');
    button?.click?.();
    return Boolean(button);
  });
  if (!nexusOpened) throw new Error('Visible Nexus control is missing.');
  await page.locator('[data-eon-w659n-panel="nearby"]').waitFor({ state: 'visible', timeout: 10_000 });
  report.checkpoints.push('visible-nexus-control-opens-nearest-review-first-station');

  const successfulCityAssetPaths = [...new Set(report.cityAssetResponses.filter((entry) => entry.status === 200).map((entry) => entry.path))];
  report.assetDelivery = {
    successfulUniquePaths: successfulCityAssetPaths,
    successfulUniqueCount: successfulCityAssetPaths.length,
    allResponses: report.cityAssetResponses
  };
  if (successfulCityAssetPaths.length < 20) {
    throw new Error(`Only ${successfulCityAssetPaths.length} unique City asset paths returned 200 across the full traversal.`);
  }

  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 412, height: 915 });
  await mobilePage.goto('/eoncity?w660LocalProof=mobile', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await mobilePage.locator('canvas.eon-play-canvas').waitFor({ state: 'visible', timeout: 90_000 });
  await mobilePage.waitForFunction(() => document.querySelector('[data-eon-city-play-root]')?.dataset?.eonCityProductiveCity === 'ready', null, { timeout: 120_000 });
  const mobileShot = '14-mobile-productive-city.png';
  await mobilePage.screenshot({ path: path.join(outputDir, mobileShot), fullPage: false });
  report.screenshots.push(mobileShot);
  report.mobile = await mobilePage.evaluate(() => ({
    dock: Boolean(document.querySelector('.eon-city-product-dock')),
    canvas: Boolean(document.querySelector('canvas.eon-play-canvas')),
    nexusCount: Number(document.querySelector('[data-eon-city-play-root]')?.dataset?.eonCityNexusStationCount || 0),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
  }));
  if (!report.mobile.dock || !report.mobile.canvas || report.mobile.nexusCount !== 9 || report.mobile.horizontalOverflow) {
    throw new Error(`Mobile City surface failed: ${JSON.stringify(report.mobile)}`);
  }
  await mobilePage.close();
  report.checkpoints.push('mobile-city-canvas-dock-and-nine-nexus-without-horizontal-overflow');

  if (report.pageErrors.length) throw new Error(`Page errors: ${report.pageErrors.join(' | ')}`);
  if (report.requestFailures.length) throw new Error(`Request failures: ${JSON.stringify(report.requestFailures)}`);
  if (report.failedResponses.length) throw new Error(`Failed relevant responses: ${JSON.stringify(report.failedResponses)}`);

  report.status = 'PASS';
  report.evidenceBoundary = {
    realBabylonWebGL: true,
    localSoftwareRenderer: report.runtime.root.softwareRenderer,
    localQualityProfile: report.runtime.root.qualityProfile,
    rtx3050CinematicCapabilityCoveredByUnitTestOnly: true,
    allNineDistrictsTraversed: true,
    allNineNexusStationsRendered: true,
    functionalAssetsDistrictResident: true,
    productPanelsBound: true,
    localCaptureSurfaceVerified: true,
    actualCameraMicPermission: false,
    actualVideoRecorded: false,
    productionGoogleSession: false,
    physicalDevice: false,
    liveBillingMutation: false,
    socialPublication: false
  };
  await context.close();
} catch (error) {
  report.status = 'BLOCKED';
  report.error = safe(error?.stack || error?.message || error);
} finally {
  await browser?.close().catch(() => {});
}

await fs.writeFile(path.join(outputDir, 'W660_PRODUCTIVE_CITY_LOCAL_BROWSER_PROOF.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exit(1);
