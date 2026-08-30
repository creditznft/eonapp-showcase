import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W750 Command Centre and genuine Agent Theatre proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

type Runtime = {
  inspectCommandCentreWall?: (id: string, options: { explicitUserAction: boolean; openDock?: boolean }) => { ok?: boolean };
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => { ok?: boolean };
  getRuntimeSummary?: () => {
    player?: { x?: number; z?: number; heading?: number };
    spatialFoundation?: { camera?: { alpha?: number; beta?: number; radius?: number; target?: { x?: number; y?: number; z?: number } } };
    commandCentre?: { wallCount?: number; fakeWorkers?: boolean; inventedProgress?: boolean; automaticExecution?: boolean };
  };
};

async function boot(page, viewport = { width: 1440, height: 900 }) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize(viewport);
  await page.goto('/eoncity?release=w750-command-centre', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

async function runtimeSummary(page) {
  return page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
}

test('W750 opens five live walls in City Dock and restores the exact City state', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);
  const before = await runtimeSummary(page);
  expect(before?.commandCentre?.wallCount).toBe(5);
  expect(before?.commandCentre?.fakeWorkers).toBe(false);
  expect(before?.commandCentre?.inventedProgress).toBe(false);
  expect(before?.commandCentre?.automaticExecution).toBe(false);

  const opened = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.inspectCommandCentreWall?.('work', { explicitUserAction: true, openDock: true }) || null;
  });
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  await expect(page.locator('[data-eon-command-wall]')).toHaveCount(5);
  await page.locator('[data-eon-command-wall="agent-theatre"]').click();
  await expect(page.locator('.eon-command-centre-inspector')).toContainText('Genuine Agent Theatre');
  await page.screenshot({ path: testInfo.outputPath('w750-command-centre-desktop.png'), fullPage: false });
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(host).toBeHidden();

  const after = await runtimeSummary(page);
  expect(after?.player).toMatchObject(before?.player || {});
  expect(after?.spatialFoundation?.camera).toEqual(before?.spatialFoundation?.camera);
  expect(pageErrors).toEqual([]);
  const proofPath = testInfo.outputPath('w750-command-centre-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w750.command-centre-browser-proof.v1', before, after, pageErrors }, null, 2));
  await testInfo.attach('w750-command-centre-proof', { path: proofPath, contentType: 'application/json' });
});

test('W750 keeps Agent Theatre still without receipts and uses the mobile bottom Dock', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 });
  const opened = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.openStation?.('automation-theatre', { explicitUserAction: true }) || null;
  });
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box?.x || 0)).toBe(0);
  expect(Math.abs(((box?.y || 0) + (box?.height || 0)) - 844)).toBeLessThanOrEqual(2);
  expect(Math.abs((box?.width || 0) - 390)).toBeLessThanOrEqual(2);
  await expect(page.locator('.eon-command-centre-theatre-empty')).toContainText('stage is still');
  await expect(page.locator('[data-eon-command-job]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('w750-agent-theatre-mobile.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
});
