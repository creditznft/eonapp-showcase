import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';

// The two contracts intentionally exercise the constrained software-renderer
// path. Certification may override that detected Lite profile to Cinematic;
// automatic entry must remain Lite and playable.
test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'] } });

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'W759R1 headed functional hotfix evidence fixture.', dataCustody: 'No secrets or private work in evidence.'
};

async function prepareCity(page: Page, certification = false) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  // The production build is served statically for this local test. Mirror the
  // two safe Pages Function reads that the app shell performs on every route.
  await page.route('**/api/auth/session', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: false, signedIn: false, rollout: 'disabled' }) }));
  await page.route('**/api/billing/status', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false, account: { signedIn: false } }) }));
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const networkFailures: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  page.on('response', (response) => { if (response.status() >= 400) networkFailures.push(`${response.status()} ${response.url()}`); });
  const query = certification ? '?release=w759r1-functional-hotfix&eon-city-certification=1&eon-city-quality=cinematic' : '?release=w759r1-functional-hotfix';
  await page.goto(`/eoncity${query}`, { waitUntil: 'domcontentloaded' });
  await page.bringToFront();
  const canvas = page.locator('.eon-city-command-hub-canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.()), null, { timeout: 30_000 });
  const dismiss = page.getByRole('button', { name: 'Not now' });
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
  return { canvas, consoleErrors, pageErrors, networkFailures };
}

async function diagnostics(page: Page) {
  return page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.() || null);
}

async function writeDiagnostics(page: Page, testInfo: TestInfo, name: string) {
  const value = await diagnostics(page);
  await fs.writeFile(testInfo.outputPath(name), JSON.stringify(value, null, 2));
  return value;
}

async function assertCinematicHandshake(page: Page, testInfo: TestInfo) {
  try {
    await page.waitForFunction(() => {
      const value = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.();
      return value?.qualityHandshake?.state === 'ready';
    }, null, { timeout: 30_000 });
    const handshake = await diagnostics(page);
    expect(handshake.qualityAuthority.entry).toMatchObject({ detected: 'lite', requested: 'cinematic', effective: 'cinematic', source: 'certification-override', overrideAccepted: true });
    expect(handshake.qualityAuthority.runtime).toMatchObject({ effective: 'cinematic', source: 'certification-override' });
    expect(handshake.qualityAuthority.assetLoader).toMatchObject({ effective: 'cinematic', budgetName: 'cinematic' });
    expect(handshake.qualityHandshake).toMatchObject({ entryToRuntimePass: true, runtimeToLoaderPass: true, pass: true });
    expect(handshake.assets.budget).toMatchObject({ stationWorld: 9, stationProps: 10, roleCharacters: 9, discoveryWorld: 4, maxResidentAssets: 46 });
    return handshake;
  } catch (error) {
    await writeDiagnostics(page, testInfo, 'w759r1-quality-handshake-failure.json');
    throw error;
  }
}

async function proveMovement(page: Page, canvas: ReturnType<Page['locator']>) {
  await canvas.focus();
  const before = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.getInputDiagnostics());
  await page.keyboard.down('w'); await page.waitForTimeout(600); await page.keyboard.up('w');
  const afterW = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.getInputDiagnostics());
  expect(Math.hypot(afterW.player.x - before.player.x, afterW.player.z - before.player.z), JSON.stringify(afterW.renderRecovery)).toBeGreaterThan(0.45);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(450); await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.getInputDiagnostics());
  expect(Math.hypot(after.player.x - afterW.player.x, after.player.z - afterW.player.z), JSON.stringify(after.renderRecovery)).toBeGreaterThan(0.45);
  expect(after.keyboardKeys).toBe(0);
  expect(after.active).toBe(false);
  expect(after.workSurfaceOpen).toBe(false);
  expect(after.manualPaused).toBe(false);
  const dpad = page.getByRole('button', { name: 'Move forward' });
  await expect(dpad).toBeVisible();
  const dpadBefore = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.getInputDiagnostics());
  const box = await dpad.boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.waitForTimeout(550); await page.mouse.up(); await page.waitForTimeout(120);
  const dpadAfter = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.getInputDiagnostics());
  expect(Math.hypot(dpadAfter.player.x - dpadBefore.player.x, dpadAfter.player.z - dpadBefore.player.z)).toBeGreaterThan(0.2);
  expect(dpadAfter.active).toBe(false);
  await expect(dpad).toHaveAttribute('aria-pressed', 'false');
  return { before, afterW, after, dpadBefore, dpadAfter };
}

async function movementSnapshot(page: Page, label: string) {
  return page.evaluate((snapshotLabel) => {
    const runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
    const root = document.querySelector('[data-eon-city-play-root]') as any;
    const canvas = document.querySelector('.eon-city-command-hub-canvas');
    const ids = (globalThis as any).__w759r1RuntimeIds || ((globalThis as any).__w759r1RuntimeIds = new WeakMap());
    let next = (globalThis as any).__w759r1RuntimeIdNext || 1;
    const identity = (value: any) => { if (!value) return null; if (!ids.has(value)) ids.set(value, next++); return ids.get(value); };
    (globalThis as any).__w759r1RuntimeIdNext = next;
    return {
      label: snapshotLabel, at: Date.now(), visibilityState: document.visibilityState, hidden: document.hidden, hasFocus: document.hasFocus(),
      activeElement: { tag: document.activeElement?.tagName?.toLowerCase() || '', className: String((document.activeElement as HTMLElement)?.className || ''), ariaLabel: document.activeElement?.getAttribute?.('aria-label') || '' },
      canvasFocused: canvas === document.activeElement, canvasCount: document.querySelectorAll('.eon-city-command-hub-canvas').length,
      runtimeIdentity: identity(runtime), rootRuntimeIdentity: identity(root?.__eonCityRuntime), reducedRuntimeIdentity: identity(root?.__eonCityReducedRuntime), mountGeneration: root?.dataset?.eonCityMountGeneration || null,
      input: runtime?.getInputDiagnostics?.() || null, summary: runtime?.getRuntimeSummary?.() || null
    };
  }, label);
}

test('W759R1 diagnostic captures the held-key movement pipeline before attachment waiting', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  const { canvas } = await prepareCity(page, false);
  const timeline: unknown[] = [];
  timeline.push(await movementSnapshot(page, 'before-canvas-focus'));
  await canvas.focus(); timeline.push(await movementSnapshot(page, 'after-canvas-focus'));
  for (const key of ['w', 'ArrowRight']) {
    timeline.push(await movementSnapshot(page, `${key}-before-keydown`));
    await page.keyboard.down(key); await page.waitForTimeout(50); timeline.push(await movementSnapshot(page, `${key}-held-50ms`));
    await page.waitForTimeout(250); timeline.push(await movementSnapshot(page, `${key}-held-300ms`));
    timeline.push(await movementSnapshot(page, `${key}-before-keyup`)); await page.keyboard.up(key); timeline.push(await movementSnapshot(page, `${key}-after-keyup`));
    await page.waitForTimeout(150); timeline.push(await movementSnapshot(page, `${key}-after-keyup-150ms`));
  }
  await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.setMove('forward', true, { source: 'w759r1-diagnostic-direct' }));
  await page.waitForTimeout(500); timeline.push(await movementSnapshot(page, 'direct-held-500ms'));
  await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME.setMove('forward', false, { source: 'w759r1-diagnostic-direct' }));
  await page.waitForTimeout(150); timeline.push(await movementSnapshot(page, 'direct-released'));
  const dpad = page.getByRole('button', { name: 'Move forward' }); const box = await dpad.boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down(); await page.waitForTimeout(300); timeline.push(await movementSnapshot(page, 'dpad-held-300ms'));
  await page.waitForTimeout(300); await page.mouse.up(); await page.waitForTimeout(150); timeline.push(await movementSnapshot(page, 'dpad-released'));
  await fs.writeFile(testInfo.outputPath('w759r1-movement-pipeline-timeline.json'), JSON.stringify(timeline, null, 2));
});

test('W759R1 automatic Lite remains playable before progressive authored loading completes', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const { canvas, consoleErrors, pageErrors, networkFailures } = await prepareCity(page, false);
  const earlyMovement = await proveMovement(page, canvas);
  await page.waitForFunction(() => {
    const value = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.();
    return value?.assets && value.assets.queued === 0 && value.assets.inflight === 0;
  }, null, { timeout: 30_000 });
  const presentation = await diagnostics(page);
  expect(presentation.qualityAuthority.entry.detected).toBe('lite');
  expect(presentation.qualityAuthority.entry.effective).toBe('lite');
  expect(presentation.qualityAuthority.assetLoader.effective).toBe('lite');
  expect(presentation.qualityHandshake.pass).toBe(true);
  expect(presentation.assets.failedLoads).toBe(0);
  expect(presentation.assets.pendingAliases).toEqual([]);
  expect(presentation.assets.presentationReadinessPass).toBe(true);
  for (const station of presentation.stations) {
    expect(station.terminal.ready || station.fallbackTerminalVisualsEnabled > 0, `${station.id} terminal representation`).toBe(true);
    if (station.id !== 'eonbot-nexus') expect(station.structure.ready || station.fallbackStructureVisualsEnabled > 0, `${station.id} structure representation`).toBe(true);
    if (station.roleNpcRequired) {
      expect(station.fallbackNpcEnabled, `${station.id} procedural NPC must remain hidden`).toBe(false);
      expect(station.proceduralNpcVisible, `${station.id} procedural NPC visibility truth`).toBe(false);
      expect(['authored', 'absent']).toContain(station.npcRepresentation);
      if (station.npc.ready) expect(station.npcRepresentation).toBe('authored');
    }
  }
  for (const discovery of presentation.discoveries) expect(discovery.world.ready || discovery.fallbackVisualsEnabled > 0, `${discovery.id} representation`).toBe(true);
  await fs.writeFile(testInfo.outputPath('w759r1-lite-receipt.json'), JSON.stringify({ earlyMovement, presentation, consoleErrors, pageErrors, networkFailures }, null, 2));
  expect(consoleErrors).toEqual([]); expect(pageErrors).toEqual([]); expect(networkFailures).toEqual([]);
});

test('W759R1 certification Cinematic quality authority handshakes before attachment waiting', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const { consoleErrors, pageErrors, networkFailures } = await prepareCity(page, true);
  const handshake = await assertCinematicHandshake(page, testInfo);
  await fs.writeFile(testInfo.outputPath('w759r1-quality-handshake.json'), JSON.stringify({ handshake, consoleErrors, pageErrors, networkFailures }, null, 2));
  expect(consoleErrors).toEqual([]); expect(pageErrors).toEqual([]); expect(networkFailures).toEqual([]);
});

test('W759R1 certification Cinematic handshakes early then proves all authored attachments', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const { canvas, consoleErrors, pageErrors, networkFailures } = await prepareCity(page, true);
  await assertCinematicHandshake(page, testInfo);
  const earlyMovement = await proveMovement(page, canvas);
  try {
    await page.waitForFunction(() => {
      const value = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getW759PresentationDiagnostics?.();
      return value?.player?.authored?.ready === true && value?.eonbot?.authored?.ready === true
        && value?.counts?.stationWorldReady === 9 && value?.counts?.stationTerminalsReady === 10
        && value?.counts?.roleNpcsReady === 9 && value?.counts?.discoveriesReady === 4
        && value?.assets?.failedLoads === 0 && value?.assets?.pendingAliases?.length === 0
        && value?.assets?.presentationReadinessPass === true;
    }, null, { timeout: 180_000 });
  } catch (error) {
    await writeDiagnostics(page, testInfo, 'w759r1-attachment-diagnostics-final.json');
    throw error;
  }
  const presentation = await diagnostics(page);
  expect(presentation.counts).toMatchObject({ stationWorldReady: 9, stationWorldRequired: 9, stationTerminalsReady: 10, stationTerminalsRequired: 10, roleNpcsReady: 9, roleNpcsRequired: 9, discoveriesReady: 4, discoveriesRequired: 4 });
  expect(presentation.player.fallbackEnabled).toBe(false); expect(presentation.eonbot.fallbackEnabled).toBe(false);
  for (const attachment of presentation.assets.attachments) { expect(attachment.ready, attachment.alias).toBe(true); expect(attachment.heightRatio, attachment.alias).toBeGreaterThanOrEqual(0.82); expect(attachment.heightRatio, attachment.alias).toBeLessThanOrEqual(1.18); }
  const finalMovement = await proveMovement(page, canvas);
  const screenshot = testInfo.outputPath('w759r1-cinematic-complete.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await fs.writeFile(testInfo.outputPath('w759r1-cinematic-receipt.json'), JSON.stringify({ earlyMovement, finalMovement, presentation, consoleErrors, pageErrors, networkFailures }, null, 2));
  expect(consoleErrors).toEqual([]); expect(pageErrors).toEqual([]); expect(networkFailures).toEqual([]);
});
