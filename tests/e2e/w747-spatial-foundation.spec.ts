import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import { EON_CITY_W760_SCENE_PROFILE } from '../../assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W747 spatial foundation proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

type SpatialReport = {
  schema?: string; validation?: { ok?: boolean }; heroZone?: { diameter?: number }; wingCount?: number;
  camera?: { mode?: string; target?: { x?: number; y?: number; z?: number } };
  diagnosticsVisible?: boolean; loadedBounds?: { registeredBoundCount?: number; arrivalOccluders?: string[] };
  centralOrientationShellRetired?: boolean;
};
type Runtime = {
  getRuntimeSummary?: () => { runtimeProvenance?: string; spatialFoundation?: SpatialReport };
  getSpatialDiagnostics?: () => { visible?: boolean; report?: { registeredBoundCount?: number } };
  resetView?: () => { ok?: boolean };
};

async function boot(page) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

test('W747 proves the clean Nexus reveal, protected centre and hidden diagnostics', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);

  const initial = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(initial?.runtimeProvenance).toBe('eon-city-living-nexus-command-core-w757-1');
  expect(initial?.spatialFoundation?.validation?.ok).toBe(true);
  expect(initial?.spatialFoundation?.heroZone?.diameter).toBe(12);
  expect(initial?.spatialFoundation?.wingCount).toBe(5);
  expect(initial?.spatialFoundation?.camera?.mode).toBe('arrival');
  expect(EON_CITY_W760_SCENE_PROFILE.camera.arrival.target).toEqual({ x: 0, y: 1.7, z: 4.9 });
  expect(initial?.spatialFoundation?.camera?.target).toEqual(EON_CITY_W760_SCENE_PROFILE.camera.arrival.target);
  expect(initial?.spatialFoundation?.diagnosticsVisible).toBe(false);
  expect(initial?.spatialFoundation?.centralOrientationShellRetired).toBe(true);

  await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    runtime?.resetView?.();
  });
  const reset = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.spatialFoundation || null;
  });
  expect(reset?.camera?.mode).toBe('arrival');
  expect(pageErrors).toEqual([]);

  const screenshotPath = testInfo.outputPath('w747-spatial-foundation.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const proofPath = testInfo.outputPath('w747-spatial-foundation-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({
    schema: 'eonapp.w747.spatial-foundation-browser-proof.v1', initial, reset, pageErrors
  }, null, 2));
  await testInfo.attach('w747-spatial-foundation-proof', { path: proofPath, contentType: 'application/json' });
});
