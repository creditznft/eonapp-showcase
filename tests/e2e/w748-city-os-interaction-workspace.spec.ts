import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W748 City Dock and Focus Workspace proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

const STATIONS = [
  'eonbot-nexus', 'create-forge', 'project-atlas', 'library-vault', 'command-console',
  'automation-theatre', 'local-ai-lab', 'share-capture', 'my-realm-portal', 'plans-access'
];

type Runtime = {
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => { ok?: boolean; sessionId?: string };
  getRuntimeSummary?: () => {
    player?: { x?: number; z?: number; heading?: number };
    spatialFoundation?: { camera?: { alpha?: number; beta?: number; radius?: number; target?: { x?: number; y?: number; z?: number } } };
    workspace?: { presentationMode?: string; state?: { active?: boolean; stationId?: string; presentationMode?: string }; interactionRegistry?: { stationCoverage?: number } };
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

async function openStation(page, stationId: string) {
  const receipt = await page.evaluate((id) => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.openStation?.(id, { explicitUserAction: true }) || null;
  }, stationId);
  expect(receipt?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible();
  return host;
}

async function closeWorkspace(page) {
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(page.locator('[data-eon-work-surface-host]')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/eon-work-surface-(dock|focus)-open/);
}

test('W748 opens all ten stations in City Dock and restores the exact City state', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);

  const before = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(before?.workspace?.interactionRegistry?.stationCoverage).toBe(10);

  for (const stationId of STATIONS) {
    const host = await openStation(page, stationId);
    const workspace = await page.evaluate(() => {
      const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
      return runtime?.getRuntimeSummary?.()?.workspace || null;
    });
    expect(workspace?.state?.stationId).toBe(stationId);
    expect(workspace?.state?.presentationMode).toBe('dock');
    await expect(host.locator('[data-eon-work-surface-presentation]')).toHaveText('Focus workspace');
    await closeWorkspace(page);
  }

  const after = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(after?.player).toMatchObject(before?.player || {});
  expect(after?.spatialFoundation?.camera).toEqual(before?.spatialFoundation?.camera);
  expect(pageErrors).toEqual([]);

  const screenshotPath = testInfo.outputPath('w748-city-dock-desktop.png');
  await openStation(page, 'project-atlas');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await closeWorkspace(page);
  const proofPath = testInfo.outputPath('w748-city-dock-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w748.city-dock-browser-proof.v1', before, after, pageErrors }, null, 2));
  await testInfo.attach('w748-city-dock-proof', { path: proofPath, contentType: 'application/json' });
});

test('W748 Focus Workspace is explicit and returns to the same Dock session', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page);
  const host = await openStation(page, 'create-forge');
  const sessionBefore = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.workspace?.state || null;
  });
  await host.locator('[data-eon-work-surface-presentation]').click();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'focus');
  await expect(page.locator('body')).toHaveClass(/eon-work-surface-focus-open/);
  await expect(host.locator('[data-eon-work-surface-presentation]')).toHaveText('Return to City Dock');
  await host.locator('[data-eon-work-surface-presentation]').click();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  const sessionAfter = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.workspace?.state || null;
  });
  expect(sessionAfter?.stationId).toBe(sessionBefore?.stationId);
  await page.screenshot({ path: testInfo.outputPath('w748-focus-workspace.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
});

test('W748 mobile portrait uses a bottom Dock and keyboard close returns to City', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 });
  const host = await openStation(page, 'eonbot-nexus');
  const box = await host.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round((box?.x || 0))).toBe(0);
  expect(Math.abs(((box?.y || 0) + (box?.height || 0)) - 844)).toBeLessThanOrEqual(2);
  expect(Math.abs((box?.width || 0) - 390)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath('w748-city-dock-mobile-portrait.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible();
});
