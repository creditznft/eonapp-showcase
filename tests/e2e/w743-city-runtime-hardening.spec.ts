import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
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
  reason: 'Local W743 runtime hardening browser proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

type CityRuntime = {
  getRuntimeSummary?: () => {
    runtimeProvenance?: string;
    arrivalCamera?: { ok?: boolean; minimumClearance?: number; blockedStationIds?: string[] };
    assets?: { maxConcurrentLoads?: number; maxResidentAssets?: number; materiallessMeshes?: number; pureWhiteUntexturedMaterials?: number };
    lifecycle?: { contextLost?: boolean; contextLossCount?: number; contextRestoreCount?: number; hardwareScalingLevel?: number };
    oneEngine?: boolean;
    oneScene?: boolean;
    oneRenderLoop?: boolean;
  };
  applyWorkloadProtection?: (reason?: string) => { ok?: boolean; changed?: boolean; hardwareScalingLevel?: number };
};

async function bootCommandHub(page) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-play-session[data-eon-city-command-hub="w737"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 15_000 });
}

test('W743 proves provenance, clear arrival, bounded loading, context recovery and real performance protection', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await bootCommandHub(page);

  await expect.poll(async () => page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return Number(runtime?.getRuntimeSummary?.()?.assets?.maxConcurrentLoads || 0);
  }), { timeout: 30_000 }).toBeGreaterThan(0);

  const initial = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(initial).not.toBeNull();
  expect(initial?.runtimeProvenance).toBe('eon-city-living-nexus-command-core-w757-1');
  expect(initial?.arrivalCamera?.ok).toBe(true);
  expect(initial?.arrivalCamera?.blockedStationIds).toEqual([]);
  expect(initial?.arrivalCamera?.minimumClearance || 0).toBeGreaterThanOrEqual(1.25);
  expect(initial?.assets?.maxConcurrentLoads || 0).toBeLessThanOrEqual(2);
  expect(initial?.assets?.maxResidentAssets || 0).toBeGreaterThanOrEqual(12);
  expect(initial?.oneEngine).toBe(true);
  expect(initial?.oneScene).toBe(true);
  expect(initial?.oneRenderLoop).toBe(true);

  const contextControl = await page.evaluate(() => {
    const canvas = document.querySelector('.eon-city-command-hub-canvas') as HTMLCanvasElement | null;
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return { supported: false };
    extension.loseContext();
    return { supported: true };
  });
  test.skip(!contextControl.supported, 'WEBGL_lose_context is unavailable in this browser.');

  const root = page.locator('[data-eon-city-play-root]');
  const retry = page.locator('[data-eon-city-retry-3d]');
  await expect(root).toHaveAttribute('data-eon-city-context-state', 'lost', { timeout: 10_000 });
  await expect(retry).toBeVisible();

  const restored = await page.evaluate(() => {
    const canvas = document.querySelector('.eon-city-command-hub-canvas') as HTMLCanvasElement | null;
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.restoreContext();
    return true;
  });
  expect(restored).toBe(true);
  await expect(root).toHaveAttribute('data-eon-city-context-state', 'restored', { timeout: 15_000 });
  await expect(retry).toBeHidden();

  const protection = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.applyWorkloadProtection?.('w743-browser-proof') || null;
  });
  expect(protection?.ok).toBe(true);
  expect(protection?.changed).toBe(true);
  expect(protection?.hardwareScalingLevel || 0).toBeGreaterThan(1);

  const finalState = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(finalState?.lifecycle?.contextLost).toBe(false);
  expect(finalState?.lifecycle?.contextLossCount || 0).toBeGreaterThanOrEqual(1);
  expect(finalState?.lifecycle?.contextRestoreCount || 0).toBeGreaterThanOrEqual(1);
  expect(finalState?.assets?.materiallessMeshes || 0).toBe(0);
  expect(finalState?.assets?.pureWhiteUntexturedMaterials || 0).toBe(0);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('w743-runtime-hardening.png'), fullPage: false });
  const proofPath = testInfo.outputPath('w743-runtime-hardening-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({
    schema: 'eonapp.w743.city-runtime-hardening-browser-proof.v1',
    initial,
    contextControl,
    protection,
    finalState,
    pageErrors
  }, null, 2));
  await testInfo.attach('w743-runtime-hardening-proof', { path: proofPath, contentType: 'application/json' });
});
