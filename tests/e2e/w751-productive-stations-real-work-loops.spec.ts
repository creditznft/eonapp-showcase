import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W751 productive stations and real work-loop proof.',
  dataCustody: 'No account, project, Vault, provider, prompt, file or payment data is used.'
};

type StationLoop = { stationId?: string; state?: string; steps?: unknown[]; completionClaimed?: boolean; automaticExecution?: boolean; reward?: unknown };
type Runtime = {
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => { ok?: boolean };
  getProductiveStationLoops?: () => { stationCount?: number; verifiedCount?: number; stations?: StationLoop[]; ownsProductState?: boolean; automaticExecution?: boolean; rewardIssued?: boolean };
  getRuntimeSummary?: () => {
    player?: { x?: number; z?: number; heading?: number };
    spatialFoundation?: { camera?: { alpha?: number; beta?: number; radius?: number; target?: { x?: number; y?: number; z?: number } } };
    productiveStations?: { stationCount?: number; verifiedCount?: number; automaticExecution?: boolean; rewardIssued?: boolean };
  };
};

async function boot(page, viewport = { width: 1440, height: 900 }) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.setViewportSize(viewport);
  await page.goto('/eoncity?release=w751-productive-stations', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

async function summary(page) {
  return page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.() || null);
}

test('W751 exposes ten truthful station loops and preserves exact City return state', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);
  const before = await summary(page);
  expect(before?.productiveStations?.stationCount).toBe(10);
  expect(before?.productiveStations?.verifiedCount).toBe(0);
  expect(before?.productiveStations?.automaticExecution).toBe(false);
  expect(before?.productiveStations?.rewardIssued).toBe(false);

  const loops = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.getProductiveStationLoops?.() || null);
  expect(loops?.stationCount).toBe(10);
  expect(loops?.ownsProductState).toBe(false);
  expect(loops?.automaticExecution).toBe(false);
  expect(loops?.rewardIssued).toBe(false);
  expect(loops?.stations?.every((entry) => entry.steps?.length === 3 && entry.completionClaimed === false && entry.automaticExecution === false && entry.reward === null)).toBe(true);

  const opened = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.('create-forge', { explicitUserAction: true }) || null);
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  await expect(page.locator('[data-eon-station-work-loop="create-forge"]')).toBeVisible();
  await expect(page.locator('[data-eon-station-work-loop="create-forge"] li')).toHaveCount(3);
  await expect(page.locator('[data-eon-station-work-loop="create-forge"]')).toContainText('Shape a creator brief');
  await page.screenshot({ path: testInfo.outputPath('w751-create-forge-desktop.png'), fullPage: false });
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(host).toBeHidden();

  const after = await summary(page);
  expect(after?.player).toMatchObject(before?.player || {});
  expect(after?.spatialFoundation?.camera).toEqual(before?.spatialFoundation?.camera);
  expect(pageErrors).toEqual([]);
  const proofPath = testInfo.outputPath('w751-productive-stations-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w751.productive-stations-browser-proof.v1', before, after, loops, pageErrors }, null, 2));
  await testInfo.attach('w751-productive-stations-proof', { path: proofPath, contentType: 'application/json' });
});

test('W751 uses the mobile bottom Dock for a second distinctive station loop', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 });
  const opened = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.('local-ai-lab', { explicitUserAction: true }) || null);
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box?.x || 0)).toBe(0);
  expect(Math.abs(((box?.y || 0) + (box?.height || 0)) - 844)).toBeLessThanOrEqual(2);
  expect(Math.abs((box?.width || 0) - 390)).toBeLessThanOrEqual(2);
  await expect(page.locator('[data-eon-station-work-loop="local-ai-lab"]')).toContainText('Verify a Local AI path');
  await expect(page.locator('[data-eon-station-work-loop="local-ai-lab"] li')).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('w751-local-ai-mobile.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
});
