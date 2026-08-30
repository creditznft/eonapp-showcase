import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W749 central Living Nexus proof.',
  dataCustody: 'Only the existing privacy-projected Nexus state is used.'
};

type Runtime = {
  openStation?: (stationId: string, options: { explicitUserAction: boolean; surface?: string }) => { ok?: boolean };
  inspectLivingNexusRing?: (id: string, options: { explicitUserAction: boolean; openDock?: boolean }) => { ok?: boolean };
  refreshLivingNexus?: (reason?: string) => unknown;
  getRuntimeSummary?: () => {
    nexus3d?: { livingHero?: boolean; ringCount?: number; state?: string; schema?: string; privacy?: { providerCredentials?: boolean } };
    workspace?: { state?: { stationId?: string; surface?: string; active?: boolean } };
  };
};

async function boot(page, viewport = { width: 1440, height: 900 }) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize(viewport);
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

test('W749 central 3D Nexus and its six rings share one live Dock projection', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);

  const before = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(before?.nexus3d?.schema).toBe('eon.city.living-nexus.w749.v1');
  expect(before?.nexus3d?.livingHero).toBe(true);
  expect(before?.nexus3d?.ringCount).toBe(6);
  expect(before?.nexus3d?.privacy?.providerCredentials).toBe(false);

  const opened = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.openStation?.('eonbot-nexus', { explicitUserAction: true }) || null;
  });
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-id', 'nexus');
  await expect(page.locator('[data-eon-nexus-dock]')).toBeVisible();
  await expect(page.locator('[data-eon-nexus-ring]')).toHaveCount(6);
  await page.locator('[data-eon-nexus-ring="approval"]').click();
  await expect(page.locator('[data-eon-nexus-ring="approval"]')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.refreshLivingNexus?.('browser-proof'));
  await expect(page.locator('[data-eon-nexus-dock]')).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath('w749-central-living-nexus-desktop.png'), fullPage: false });
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(host).toBeHidden();
  expect(pageErrors).toEqual([]);
  const proofPath = testInfo.outputPath('w749-central-living-nexus-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w749.central-living-nexus-browser-proof.v1', before, pageErrors }, null, 2));
  await testInfo.attach('w749-central-living-nexus-proof', { path: proofPath, contentType: 'application/json' });
});

test('W749 mobile portrait keeps the world visible behind the Nexus bottom Dock', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 });
  const result = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.inspectLivingNexusRing?.('project', { explicitUserAction: true, openDock: true }) || null;
  });
  expect(result?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible();
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box?.x || 0)).toBe(0);
  expect(Math.abs(((box?.y || 0) + (box?.height || 0)) - 844)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath('w749-central-living-nexus-mobile.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
});
