import { expect, test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  reason: 'W766IR2 built-Preview recovery proof.', dataCustody: 'No private user content is used by the mocked source-level City proof.'
};

const EVIDENCE_SCHEMA = 'eonapp.w766ir2.preview-browser-proof.v1';
const EVIDENCE_DIR = process.env.EONAPP_W766IR2_EVIDENCE_DIR || path.resolve('reports', 'w766ir2', 'browser');
const BUILT_PREVIEW = process.env.EONAPP_W766IR2_BUILT_PREVIEW === '1';
const AUTHENTICATED_OFFLINE = process.env.EONAPP_W766IR2_AUTHENTICATED_OFFLINE_PROOF === '1';
const LOCAL_AI_URL = String(process.env.EONAPP_W766IR2_LOCAL_AI_URL || '').trim();
const CITY_BINARY_PATTERN = /\/assets\/city\/.*\.(?:glb|gltf|bin|webp|ktx2)(?:[?#]|$)/i;

async function writeProof(testInfo, baseProofId, data) {
  const proofId = `${baseProofId}-${testInfo.project.name}`;
  const proof = {
    schema: EVIDENCE_SCHEMA,
    proofId,
    browser: testInfo.project.name,
    baseUrl: String(data.baseUrl || ''),
    authenticated: data.authenticated === true,
    generatedAt: new Date().toISOString(),
    ...data,
    ok: true,
    productionChanged: false
  };
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const file = path.join(EVIDENCE_DIR, `${proofId}.json`);
  await fs.writeFile(file, `${JSON.stringify(proof, null, 2)}\n`);
  await testInfo.attach(proofId, { path: file, contentType: 'application/json' });
}


async function clickVisibleCityMenu(page) {
  const launcher = page.locator('[data-eon-city-menu-open]').first();
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator('.eon-city-command-menu')).toBeVisible();
}

async function clickVisibleAccessibleMap(page) {
  const launcher = page.locator('[data-eon-city-semantic-map-open]').first();
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator('.eon-city-w756-semantic-map')).toBeVisible();
}

function startSurfaceLifecycleConsoleAudit(page) {
  const records = [];
  page.on('console', (message) => {
    const text = String(message.text() || '');
    if (/Recovered City movement after a hidden surface failed to complete/i.test(text)
      || /aria-hidden.*focused|focused.*aria-hidden|Blocked aria-hidden/i.test(text)) {
      records.push({ type: message.type(), text });
    }
  });
  return records;
}

async function captureEvidenceScreenshot(page, testInfo, baseProofId, view) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const fileName = `${baseProofId}-${testInfo.project.name}-${view}.png`;
  const absolute = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: absolute, fullPage: false });
  const bytes = await fs.readFile(absolute);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  await testInfo.attach(`${baseProofId}-${view}`, { path: absolute, contentType: 'image/png' });
  return { file: fileName, sha256, bytes: bytes.byteLength };
}

async function startCityBinaryNetworkAudit(context, page) {
  const session = await context.newCDPSession(page);
  const responses = new Map();
  await session.send('Network.enable');
  session.on('Network.responseReceived', (event) => {
    const url = String(event?.response?.url || '');
    if (!CITY_BINARY_PATTERN.test(url)) return;
    responses.set(event.requestId, {
      url,
      status: Number(event.response.status || 0),
      fromDiskCache: event.response.fromDiskCache === true,
      fromServiceWorker: event.response.fromServiceWorker === true,
      fromPrefetchCache: event.response.fromPrefetchCache === true,
      encodedDataLength: 0
    });
  });
  session.on('Network.loadingFinished', (event) => {
    const record = responses.get(event.requestId);
    if (record) record.encodedDataLength = Number(event.encodedDataLength || 0);
  });
  return {
    reset() { responses.clear(); },
    snapshot() {
      const entries = [...responses.values()];
      const originTransfers = entries.filter((entry) => !entry.fromDiskCache && !entry.fromServiceWorker && !entry.fromPrefetchCache && entry.encodedDataLength > 0);
      const locallyServed = entries.filter((entry) => entry.fromDiskCache || entry.fromServiceWorker || entry.fromPrefetchCache || entry.encodedDataLength === 0);
      return { entries, binaryResponses: entries.length, locallyServed: locallyServed.length, originTransfers: originTransfers.length, originTransferEntries: originTransfers };
    },
    async stop() { try { await session.detach(); } catch {} }
  };
}

function assertPreviewAuthority(url) {
  const parsed = new URL(url);
  if (parsed.hostname === 'eonapp.ch' && process.env.EONAPP_W766IR2_ALLOW_PRODUCTION_READONLY_PROOF !== '1') {
    throw new Error('W766IR2 browser certification must run against a built Preview, not production.');
  }
  return parsed.origin;
}

async function bootCity(page, { mockedAccess = true } = {}) {
  if (mockedAccess) {
    await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
    await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"available":false,"signedIn":false}' }));
    await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  }
  await page.goto('/eoncity?release=w766ir2-final-recovery&cityProof=1', { waitUntil: 'domcontentloaded' });
  const baseUrl = assertPreviewAuthority(page.url());
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 45_000 });
  await expect.poll(async () => page.evaluate(() => Boolean(globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.())), { timeout: 45_000 }).toBe(true);
  await expect(page.locator('[data-eon-city-play-root]')).toHaveAttribute('data-eon-city-first-frame', 'ready', { timeout: 45_000 });
  return baseUrl;
}

async function runtimeSnapshot(page) {
  return page.evaluate(() => {
    const runtime = globalThis.EON_CITY_COMMAND_HUB_RUNTIME;
    const root = document.querySelector('[data-eon-city-play-root]');
    return {
      identity: runtime?.getRuntimeSummary?.()?.runtimeIdentity || null,
      summary: runtime?.getRuntimeSummary?.() || null,
      preparationScreenCount: Number(root?.dataset?.eonCityPreparationScreenCount || 0),
      lifecycle: String(root?.dataset?.eonCityRuntimeLifecycle || '')
    };
  });
}

async function runtimeActionState(page) {
  return page.evaluate(() => {
    const runtime = globalThis.EON_CITY_COMMAND_HUB_RUNTIME;
    const summary = runtime?.getRuntimeSummary?.() || null;
    const camera = summary?.spatialFoundation?.camera || null;
    const cameraY = camera
      ? Number(camera.target?.y || 0) + Math.cos(Number(camera.beta || 0)) * Number(camera.radius || 0)
      : Number.NaN;
    const player = summary?.player || null;
    return {
      identity: summary?.runtimeIdentity || null,
      player,
      radialDistance: player ? Math.hypot(Number(player.x || 0), Number(player.z || 0)) : Number.NaN,
      camera,
      cameraY,
      cameraFloorSafety: summary?.lifecycle?.cameraFloorSafety || null,
      cameraSafetyRecoveryCount: Number(summary?.lifecycle?.cameraSafetyRecoveryCount || 0),
      worldMode: runtime?.getExpanseWorldMode?.()?.mode || summary?.worldMode?.mode || 'UNKNOWN',
      inputLocks: summary?.inputLocks || null,
      movementPaused: summary?.movementPaused === true,
      movementBlockReason: String(summary?.movementBlockReason || ''),
      performanceProtectionLevel: Number(summary?.lifecycle?.performanceProtectionLevel || 0),
      lastPerformanceProtectionReason: String(summary?.lifecycle?.lastPerformanceProtectionReason || ''),
      fps: Number(summary?.fps || 0)
    };
  });
}

function travelledDistance(before, after) {
  return Math.hypot(Number(after?.player?.x || 0) - Number(before?.player?.x || 0), Number(after?.player?.z || 0) - Number(before?.player?.z || 0));
}

async function pressMovementKey(page, key = 'w', durationMs = 750) {
  const canvas = page.locator('.eon-city-command-hub-canvas');
  await expect(canvas).toBeVisible();
  await canvas.focus();
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
  await page.waitForTimeout(180);
  return runtimeActionState(page);
}

async function proveKeyboardMovement(page, { minimumDistance = 0.32, durationMs = 720 } = {}) {
  const before = await runtimeActionState(page);
  for (const key of ['w', 's', 'a', 'd']) {
    const after = await pressMovementKey(page, key, durationMs);
    if (travelledDistance(before, after) >= minimumDistance) return { key, before, after, distance: travelledDistance(before, after) };
  }
  const after = await runtimeActionState(page);
  expect(travelledDistance(before, after), `Movement remained blocked: ${JSON.stringify(after, null, 2)}`).toBeGreaterThanOrEqual(minimumDistance);
  return { key: '', before, after, distance: travelledDistance(before, after) };
}

async function proveExpanseMovementBeyondHubRadius(page) {
  const start = await runtimeActionState(page);
  expect(start.worldMode).toBe('EXPANSE_ACTIVE');
  let selectedKey = '';
  for (const [key, opposite] of [['w', 's'], ['a', 'd']]) {
    const beforeProbe = await runtimeActionState(page);
    const afterProbe = await pressMovementKey(page, key, 620);
    if (afterProbe.radialDistance > beforeProbe.radialDistance + 0.18) { selectedKey = key; break; }
    await pressMovementKey(page, opposite, 620);
  }
  if (!selectedKey) {
    const beforeProbe = await runtimeActionState(page);
    const afterProbe = await pressMovementKey(page, 's', 620);
    selectedKey = afterProbe.radialDistance > beforeProbe.radialDistance ? 's' : 'd';
  }
  await pressMovementKey(page, selectedKey, 3_800);
  await expect.poll(async () => (await runtimeActionState(page)).radialDistance, { timeout: 10_000 }).toBeGreaterThan(26);
  const after = await runtimeActionState(page);
  return { selectedKey, start, after, radialDistance: after.radialDistance };
}

async function guideToPhysicalDiscovery(page, discoveryId) {
  await clickVisibleAccessibleMap(page);
  const guide = page.locator(`[data-eon-city-semantic-guide-discovery="${discoveryId}"]`);
  await expect(guide).toBeVisible();
  await guide.click();
  await expect(page.locator('.eon-city-w756-semantic-map')).toBeHidden();
  const prompt = page.locator('[data-eon-city-command-prompt]');
  await expect(prompt).toBeVisible({ timeout: 10_000 });
  const primary = prompt.locator('[data-eon-city-command-open]');
  await expect(primary).toBeVisible();
  return { prompt, primary };
}

function expectCameraFloorSafe(state) {
  expect(state?.cameraFloorSafety?.ok, JSON.stringify(state?.cameraFloorSafety || {}, null, 2)).toBe(true);
  expect(Number(state?.cameraY || Number.NaN)).toBeGreaterThan(0.35);
}

async function ensureServiceWorkerController(page) {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!controlled) await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 30_000 }).toBe(true);
}

const identityFields = ['documentId', 'accessMountId', 'generation', 'canvasId', 'engineId', 'sceneId', 'playerRootId', 'cameraId', 'renderLoopId'];

function expectSameRuntime(before, after) {
  for (const field of identityFields) expect(after?.identity?.[field], field).toBe(before?.identity?.[field]);
  expect(after?.preparationScreenCount).toBe(before?.preparationScreenCount);
  expect(after?.summary?.inputLocks?.activeOwnerIds || []).toEqual([]);
  expect(after?.summary?.movementPaused).toBe(false);
}

test('20 Menu and accessible-map cycles preserve one Babylon runtime', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const pageErrors = [];
  const surfaceLifecycleWarnings = startSurfaceLifecycleConsoleAudit(page);
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  const baseUrl = await bootCity(page);
  const before = await runtimeSnapshot(page);

  await clickVisibleCityMenu(page);
  const stableMenu = page.locator('.eon-city-command-menu');
  await page.waitForTimeout(5_000);
  await expect(stableMenu).toBeVisible();
  await expect(stableMenu.locator('[data-eon-city-menu-close]')).toBeEnabled();
  const menuAfterGraceScreenshot = await captureEvidenceScreenshot(page, testInfo, 'runtime-stability', 'menu-after-five-seconds');
  await stableMenu.locator('[data-eon-city-menu-close]').click();
  await expect(stableMenu).toBeHidden();

  for (let cycle = 0; cycle < 20; cycle += 1) {
    await clickVisibleCityMenu(page);
    await page.locator('[data-eon-city-menu-close]').click();
    await expect(page.locator('.eon-city-command-menu')).toBeHidden();

    await clickVisibleAccessibleMap(page);
    await page.locator('[data-eon-city-semantic-close]').click();
    await expect(page.locator('.eon-city-w756-semantic-map')).toBeHidden();
  }

  const after = await runtimeSnapshot(page);
  const movement = await proveKeyboardMovement(page);
  const finalState = await runtimeActionState(page);
  expectSameRuntime(before, after);
  expect(finalState.performanceProtectionLevel).toBe(Number(before?.summary?.lifecycle?.performanceProtectionLevel || 0));
  expect(finalState.lastPerformanceProtectionReason).not.toBe('sustained-11-fps');
  expectCameraFloorSafe(finalState);
  expect(pageErrors).toEqual([]);
  expect(surfaceLifecycleWarnings).toEqual([]);
  await writeProof(testInfo, 'runtime-stability', {
    baseUrl, authenticated: false, cycles: 20, menuStableBeyondGraceMs: 5_000, menuAfterGraceScreenshot,
    before, after, movement, finalState, pageErrors, surfaceLifecycleWarnings,
    claims: { clickedVisibleLaunchers: true, menuRemainedVisibleBeyondGrace: true, runtimePreserved: true, preparationScreenUnchanged: true, movementReleased: true, postCycleMovementObserved: true, noFalseOrphanRecovery: true, noAriaHiddenFocusedDescendantWarning: true, noFalseLowFpsProtection: true, cameraFloorSafe: true }
  });
});

test('Gate, Relay and Transit use maintained controllers and release movement', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const surfaceLifecycleWarnings = startSurfaceLifecycleConsoleAudit(page);
  const baseUrl = await bootCity(page);
  const before = await runtimeSnapshot(page);

  await clickVisibleCityMenu(page);
  await page.locator('[data-eon-city-menu-open-world]').click();
  await expect(page.locator('[data-eon-city-expanse-review]')).toBeVisible();
  await expect(page.locator('[data-eon-city-expanse-enter]')).toBeVisible();
  await page.locator('[data-eon-city-expanse-cancel]').click();
  await expect(page.locator('[data-eon-city-expanse-review]')).toBeHidden();

  await clickVisibleCityMenu(page);
  await page.locator('[data-eon-city-menu-review-transit]').click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeVisible();
  await page.locator('[data-eon-city-transit-cancel]').click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeHidden();
  const postMenuTransitMovement = await proveKeyboardMovement(page);

  await clickVisibleCityMenu(page);
  await page.locator('[data-eon-city-menu-open-readiness]').click();
  await expect(page.locator('.eon-city-command-menu')).toBeHidden();
  await expect(page.locator('[data-eon-city-command-prompt]')).toBeVisible();
  await page.locator('[data-eon-city-command-prompt] [data-eon-city-command-open]').click();
  await expect(page.locator('[data-eon-city-runtime-readiness-output]')).toBeVisible();
  await page.locator('[data-eon-city-runtime-readiness-close]').click();
  const postMenuReadinessMovement = await proveKeyboardMovement(page);

  await clickVisibleAccessibleMap(page);
  const styledButton = page.locator('[data-eon-city-semantic-open-readiness]').first();
  const style = await styledButton.evaluate((button) => {
    const value = getComputedStyle(button);
    return { appearance: value.appearance, backgroundImage: value.backgroundImage, borderRadius: value.borderRadius, minHeight: value.minHeight, color: value.color };
  });
  expect(style.appearance).toBe('none');
  expect(style.backgroundImage).not.toBe('none');
  expect(parseFloat(style.borderRadius)).toBeGreaterThan(0);
  expect(parseFloat(style.minHeight)).toBeGreaterThanOrEqual(48);
  await styledButton.focus();
  await expect(styledButton).toBeFocused();
  await page.locator('[data-eon-city-semantic-guide-discovery="maintenance-relay"]').click();
  await expect(page.locator('.eon-city-w756-semantic-map')).toBeHidden();
  await expect(page.locator('[data-eon-city-command-prompt]')).toBeVisible();
  await page.locator('[data-eon-city-command-prompt] [data-eon-city-command-open]').click();
  await expect(page.locator('[data-eon-city-runtime-readiness-output]')).toBeVisible();
  await page.locator('[data-eon-city-runtime-readiness-close]').click();

  const transitPhysical = await guideToPhysicalDiscovery(page, 'transit-overlook');
  await transitPhysical.primary.click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeVisible();
  await page.locator('[data-eon-city-transit-cancel]').click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeHidden();
  const postTransitMovement = await proveKeyboardMovement(page);

  const expansePhysical = await guideToPhysicalDiscovery(page, 'expanse-gate');
  await expansePhysical.primary.click();
  await expect(page.locator('[data-eon-city-expanse-review]')).toBeVisible();
  await page.locator('[data-eon-city-expanse-enter]').click();
  await expect.poll(async () => page.evaluate(() => globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getExpanseWorldMode?.()?.mode), { timeout: 90_000 }).toBe('EXPANSE_ACTIVE');

  const expanseMovement = await proveExpanseMovementBeyondHubRadius(page);
  const expanseState = await runtimeActionState(page);
  expect(expanseState.inputLocks?.activeOwnerIds || []).toEqual([]);
  expect(expanseState.movementPaused).toBe(false);
  expectCameraFloorSafe(expanseState);
  await expect(page.locator('[data-eon-expanse-ui="return-hub"]')).toBeVisible();
  await page.locator('[data-eon-expanse-ui="return-hub"]').click();
  await expect.poll(async () => page.evaluate(() => globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getExpanseWorldMode?.()?.mode), { timeout: 30_000 }).toBe('COMMAND_HUB');
  const postReturnMovement = await proveKeyboardMovement(page);

  const after = await runtimeSnapshot(page);
  for (const field of identityFields) expect(after?.identity?.[field], field).toBe(before?.identity?.[field]);
  expect(after?.preparationScreenCount).toBe(before?.preparationScreenCount);
  expect(after?.summary?.inputLocks?.activeOwnerIds || []).toEqual([]);
  const finalState = await runtimeActionState(page);
  expect(finalState.worldMode).toBe('COMMAND_HUB');
  expect(finalState.performanceProtectionLevel).toBe(Number(before?.summary?.lifecycle?.performanceProtectionLevel || 0));
  expect(finalState.lastPerformanceProtectionReason).not.toBe('sustained-11-fps');
  expectCameraFloorSafe(finalState);
  expect(surfaceLifecycleWarnings).toEqual([]);
  await writeProof(testInfo, 'command-actions', {
    baseUrl, authenticated: false, style, before, after, expanseMode: 'EXPANSE_ACTIVE', finalWorldMode: finalState.worldMode,
    postMenuTransitMovement, postMenuReadinessMovement, postTransitMovement, expanseMovement, expanseState, postReturnMovement, finalState, surfaceLifecycleWarnings,
    claims: {
      clickedVisibleLaunchers: true, canonicalExpanseGate: true, menuTransitReviewOpened: true, menuReadinessOpened: true, relayOpened: true, transitReviewOpened: true,
      physicalRelayInteractionClicked: true, physicalTransitInteractionClicked: true, physicalExpanseInteractionClicked: true,
      expanseActive: true, expanseMovementBeyondHubRadius: true, returnedToCommandHub: true, postTransitMovementObserved: true,
      postMenuTransitMovementObserved: true, postMenuReadinessMovementObserved: true, postReturnMovementObserved: true, movementReleased: true, greyControlsCleared: true, runtimePreserved: true,
      noFalseOrphanRecovery: true, noAriaHiddenFocusedDescendantWarning: true,
      noFalseLowFpsProtection: true, cameraFloorSafe: true
    }
  });
});

test('five Command Centre walls expose ten readable interactive faces', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const baseUrl = await bootCity(page);
  const before = await runtimeSnapshot(page);
  const presentation = before?.summary?.commandCentre?.presentation;
  expect(before?.summary?.commandCentre?.wallCount).toBe(5);
  expect(presentation?.faceCount).toBe(10);
  expect(presentation?.dualReadableFaces).toBe(true);
  expect(presentation?.frontFaceOnly).toBe(true);
  expect(presentation?.independentTextures).toBe(true);
  expect(presentation?.independentMaterials).toBe(true);
  expect(presentation?.sameWorkspaceInteraction).toBe(true);
  expect(presentation?.faces).toHaveLength(5);
  for (const wall of presentation?.faces || []) expect(wall.faces).toHaveLength(2);

  const front = await page.evaluate(() => globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.setCommandCentreMonitorProofView?.('front', { explicitUserAction: true }));
  expect(front?.ok).toBe(true);
  await page.waitForTimeout(600);
  const frontScreenshot = await captureEvidenceScreenshot(page, testInfo, 'monitor-rendering', 'front');

  const rear = await page.evaluate(() => globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.setCommandCentreMonitorProofView?.('rear', { explicitUserAction: true }));
  expect(rear?.ok).toBe(true);
  await page.waitForTimeout(600);
  const rearScreenshot = await captureEvidenceScreenshot(page, testInfo, 'monitor-rendering', 'rear');

  const after = await runtimeSnapshot(page);
  for (const field of identityFields) expect(after?.identity?.[field], field).toBe(before?.identity?.[field]);
  await writeProof(testInfo, 'monitor-rendering', {
    baseUrl, authenticated: false, presentation, frontCamera: front?.camera, rearCamera: rear?.camera,
    screenshots: [frontScreenshot, rearScreenshot],
    claims: { tenIndependentFaces: true, sameWorkspaceInteraction: true, renderedReviewRequired: true }
  });
});


test('mobile controls release movement after Menu, Map and Transit cycles', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const baseUrl = await bootCity(page);
  const before = await runtimeSnapshot(page);

  for (let cycle = 0; cycle < 5; cycle += 1) {
    await clickVisibleCityMenu(page);
    await page.locator('[data-eon-city-menu-close]').click();
    await clickVisibleAccessibleMap(page);
    await expect(page.locator('.eon-city-w756-semantic-map')).toBeVisible();
    await page.locator('[data-eon-city-semantic-close]').click();
  }

  await clickVisibleAccessibleMap(page);
  await page.locator('[data-eon-city-semantic-review-transit]').click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeVisible();
  await page.locator('[data-eon-city-transit-cancel]').click();
  await expect(page.locator('[data-eon-city-transit-review]')).toBeHidden();

  const touchForward = page.locator('[data-eon-city-move="forward"]').first();
  await expect(touchForward).toBeVisible();
  const beforeTouch = await runtimeActionState(page);
  await touchForward.dispatchEvent('pointerdown', { pointerId: 17, pointerType: 'touch', isPrimary: true, buttons: 1 });
  await page.waitForTimeout(850);
  await touchForward.dispatchEvent('pointerup', { pointerId: 17, pointerType: 'touch', isPrimary: true, buttons: 0 });
  await page.waitForTimeout(180);
  const afterTouch = await runtimeActionState(page);
  expect(travelledDistance(beforeTouch, afterTouch), JSON.stringify({ beforeTouch, afterTouch }, null, 2)).toBeGreaterThan(0.25);

  const after = await runtimeSnapshot(page);
  expectSameRuntime(before, after);
  const finalState = await runtimeActionState(page);
  expectCameraFloorSafe(finalState);
  await writeProof(testInfo, 'mobile-controls', { baseUrl, authenticated: false, viewport: { width: 844, height: 390 }, cycles: 5, before, after, beforeTouch, afterTouch, finalState, claims: { clickedVisibleLaunchers: true, visibleTransitActionClicked: true, touchMovementObserved: true, runtimePreserved: true, movementReleased: true, cameraFloorSafe: true } });
});

test('core EONAPP pack hard-reloads offline and does not queue cloud writes', async ({ page, context }, testInfo) => {
  test.skip(!BUILT_PREVIEW, 'Requires EONAPP_W766IR2_BUILT_PREVIEW=1 and a built Preview with the emitted offline manifest.');
  test.setTimeout(20 * 60_000);
  await page.goto('/install', { waitUntil: 'domcontentloaded' });
  const baseUrl = assertPreviewAuthority(page.url());
  await ensureServiceWorkerController(page);
  const first = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core'], explicitUserAction: true }));
  expect(first?.ok).toBe(true);
  expect(first?.coreReady).toBe(true);
  const second = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core'], explicitUserAction: true }));
  expect(second?.ok).toBe(true);
  expect(Number(second?.downloadedEntries || 0)).toBe(0);
  expect(Number(second?.reusedEntries || 0)).toBeGreaterThan(0);

  await context.setOffline(true);
  for (const route of ['/', '/workspace', '/local-ai']) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('body')).toBeVisible();
  }
  await expect(page.locator('[data-eon-offline-indicator]')).toContainText(/Offline/i);
  const cloudFailure = await page.evaluate(async () => {
    const response = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    return { status: response.status, body: await response.json() };
  });
  expect(cloudFailure.status).toBe(503);
  expect(cloudFailure.body).toMatchObject({ offline: true, cloudActionQueued: false, localWorkChanged: false });
  const loopbackApproved = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).isApprovedEonLocalAiLoopback('http://127.0.0.1:1234/v1/models'));
  expect(loopbackApproved).toBe(true);
  await context.setOffline(false);
  await writeProof(testInfo, 'core-offline', { baseUrl, authenticated: false, first, second, cloudFailure, loopbackApproved, routes: ['/', '/workspace', '/local-ai'], claims: { hardOfflineReload: true, exactInventoryVerified: second?.packCacheInventoryVerified === true, zeroRepeatDownloads: Number(second?.downloadedEntries || 0) === 0, cloudWritesNotQueued: cloudFailure?.body?.cloudActionQueued === false } });
});


test('unchanged City binaries create zero origin transfers on a second authenticated browser entry', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chrome' || !BUILT_PREVIEW || !AUTHENTICATED_OFFLINE, 'Requires Chrome, built Preview, authenticated storage state and full offline proof mode.');
  test.setTimeout(30 * 60_000);
  await page.goto('/install', { waitUntil: 'domcontentloaded' });
  const baseUrl = assertPreviewAuthority(page.url());
  await ensureServiceWorkerController(page);
  const install = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core', 'city'], explicitUserAction: true }));
  expect(install?.ok).toBe(true);
  expect(install?.cityReady).toBe(true);

  await bootCity(page, { mockedAccess: false });
  const secondPage = await context.newPage();
  const audit = await startCityBinaryNetworkAudit(context, secondPage);
  try {
    await bootCity(secondPage, { mockedAccess: false });
    await secondPage.waitForTimeout(1500);
    const network = audit.snapshot();
    expect(network.binaryResponses).toBeGreaterThan(0);
    expect(network.locallyServed).toBeGreaterThan(0);
    expect(network.originTransfers, JSON.stringify(network.originTransferEntries, null, 2)).toBe(0);
    await writeProof(testInfo, 'asset-reuse', {
      baseUrl, authenticated: true, network,
      claims: { secondEntryObserved: true, binaryResponsesObserved: true, zeroCloudflareBinaryTransfers: true, stableBrowserCacheUsed: true }
    });
  } finally {
    await audit.stop();
    await secondPage.close();
  }
});

test('installed EONAPP remains usable when public origin is blocked and reaches a real localhost Local AI runtime', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chrome' || !BUILT_PREVIEW || !LOCAL_AI_URL, 'Requires Chrome, built Preview and EONAPP_W766IR2_LOCAL_AI_URL pointing to a running CORS-enabled local provider.');
  test.setTimeout(20 * 60_000);
  await page.goto('/install', { waitUntil: 'domcontentloaded' });
  const baseUrl = assertPreviewAuthority(page.url());
  await ensureServiceWorkerController(page);
  const installed = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core'], explicitUserAction: true }));
  expect(installed?.ok).toBe(true);
  expect(installed?.coreReady).toBe(true);

  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setBlockedURLs', { urls: [`${baseUrl}/*`] });
  try {
    const response = await page.goto('/local-ai', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('[data-eon-offline-indicator]')).toContainText(/Offline/i);
    const cloudFailure = await page.evaluate(async () => {
      const response = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      return { status: response.status, body: await response.json() };
    });
    expect(cloudFailure.status).toBe(503);
    expect(cloudFailure.body).toMatchObject({ offline: true, cloudActionQueued: false, localWorkChanged: false });
    const localAi = await page.evaluate(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      return { ok: response.ok, status: response.status, contentType: response.headers.get('content-type') || '' };
    }, LOCAL_AI_URL);
    expect(localAi.ok, JSON.stringify(localAi)).toBe(true);
    await writeProof(testInfo, 'local-ai-offline', {
      baseUrl, authenticated: false, localAi: { ...localAi, endpointClass: 'loopback' }, cloudFailure,
      claims: { publicOriginBlocked: true, offlineRouteLoaded: true, realLocalAiRequestSucceeded: true, cloudWritesNotQueued: true }
    });
  } finally {
    await session.send('Network.setBlockedURLs', { urls: [] }).catch(() => {});
    await session.detach().catch(() => {});
  }
});

test('authenticated full pack hard-reloads EON City and reuses unchanged bytes', async ({ page, context }, testInfo) => {
  test.skip(!BUILT_PREVIEW || !AUTHENTICATED_OFFLINE, 'Requires built Preview, EONAPP_W766IR2_AUTHENTICATED_OFFLINE_PROOF=1 and EONAPP_W766IR2_STORAGE_STATE.');
  test.setTimeout(30 * 60_000);
  await page.goto('/install', { waitUntil: 'domcontentloaded' });
  const baseUrl = assertPreviewAuthority(page.url());
  const session = await page.evaluate(async () => { const response = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' }); return { status: response.status, body: await response.json() }; });
  expect(session.status).toBe(200);
  expect(session.body?.signedIn).toBe(true);
  await ensureServiceWorkerController(page);
  const first = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core', 'city'], explicitUserAction: true }));
  expect(first?.ok).toBe(true);
  expect(first?.cityReady).toBe(true);
  const second = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).installEonOfflinePack({ packs: ['core', 'city'], explicitUserAction: true }));
  expect(second?.ok).toBe(true);
  expect(Number(second?.downloadedEntries || 0)).toBe(0);
  expect(Number(second?.reusedEntries || 0)).toBeGreaterThan(0);

  await context.setOffline(true);
  const response = await page.goto('/eoncity?cityProof=1&offlineProof=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 60_000 });
  await expect.poll(async () => page.evaluate(() => Boolean(globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.())), { timeout: 60_000 }).toBe(true);
  const identity = await runtimeSnapshot(page);
  await clickVisibleAccessibleMap(page);
  await page.locator('[data-eon-city-semantic-review-expanse]').click();
  await page.locator('[data-eon-city-expanse-enter]').click();
  await expect.poll(async () => page.evaluate(() => globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getExpanseWorldMode?.()?.mode), { timeout: 90_000 }).toBe('EXPANSE_ACTIVE');
  const loopbackApproved = await page.evaluate(async () => (await import('/assets/js/eon-offline-manager.js')).isApprovedEonLocalAiLoopback('http://localhost:11434/api/tags'));
  expect(loopbackApproved).toBe(true);
  await context.setOffline(false);
  await writeProof(testInfo, 'authenticated-full-offline', {
    baseUrl, authenticated: true, session: { status: session.status, signedIn: true }, first, second, identity,
    expanseMode: 'EXPANSE_ACTIVE', loopbackApproved,
    claims: { hardOfflineCityReload: true, exactInventoryVerified: second?.packCacheInventoryVerified === true, zeroRepeatDownloads: Number(second?.downloadedEntries || 0) === 0, expanseAvailableOffline: true }
  });
});
