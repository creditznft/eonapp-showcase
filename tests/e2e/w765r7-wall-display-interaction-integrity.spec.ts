import { expect, test } from '@playwright/test';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  reason: 'Local W765R7 browser proof.', dataCustody: 'No private user content is used.'
};

async function boot(page: import('@playwright/test').Page, width = 1440, height = 900) {
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"available":false,"signedIn":false}' }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.setViewportSize({ width, height });
  await page.goto('/eoncity?release=w765r7-wall-display-integrity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.())), { timeout: 30_000 }).toBe(true);
  await expect(page.locator('[data-eon-city-play-root]')).toHaveAttribute('data-eon-city-first-frame', 'ready', { timeout: 30_000 });
}

async function closeWorkspace(page: import('@playwright/test').Page) {
  const close = page.locator('[data-eon-work-surface-close]').first();
  if (await close.isVisible().catch(() => false)) await close.click();
  await expect(page.locator('[data-eon-work-surface-host]')).toBeHidden();
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeFocused();
}

test('W765R7 renders upright large wall displays and every display opens its maintained workspace', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await boot(page);
  const root = page.locator('[data-eon-city-play-root]');
  await expect(root).toHaveAttribute('data-eon-city-interaction-matrix', 'pass');
  const summary = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.());
  expect(summary?.stationMonitors?.individualCount).toBe(10);
  for (const display of summary.stationMonitors.stations) {
    expect(display.width, display.stationId).toBeGreaterThanOrEqual(6);
    expect(display.height, display.stationId).toBeGreaterThanOrEqual(3.3);
    expect(display.textureInvertY, display.stationId).toBe(true);
    expect(display.calibrationPattern, display.stationId).toBe(true);
    expect(display.clickableHitProxy, display.stationId).toBe(true);
    expect(display.facingDot, display.stationId).toBeGreaterThanOrEqual(0.995);
  }
  await page.screenshot({ path: testInfo.outputPath('w765r7-upright-wall-display-gallery.png'), fullPage: false });

  const ids = ['eonbot-nexus','create-forge','projects-archive','library-vault','share-capture','command-console','automation-theatre','local-ai-lab','my-realm-portal','plans-access'];
  for (const id of ids) {
    const result = await page.evaluate((stationId) => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.(stationId, { explicitUserAction: true }), id);
    expect(result?.ok, id).toBe(true);
    await expect(page.locator('[data-eon-work-surface-host]')).toBeVisible();
    await closeWorkspace(page);
  }
});

test('W765R7 Transit, menu and mobile control paths restore City controls', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page, 844, 390);
  await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.openTransitReview?.());
  const transit = page.locator('[data-eon-city-transit-review]');
  await expect(transit).toBeVisible();
  await transit.locator('[data-eon-city-transit-cancel]').click();
  await expect(transit).toBeHidden();
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeFocused();

  await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.openCityMenu?.());
  await expect(page.locator('.eon-city-command-menu')).toBeVisible();
  await page.locator('[data-eon-city-menu-close]').click();
  await expect(page.locator('.eon-city-command-menu')).toBeHidden();
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeFocused();

  const left = page.locator('[data-eon-city-direction="left"]').first();
  const right = page.locator('[data-eon-city-direction="right"]').first();
  if (await left.isVisible().catch(() => false)) {
    await left.dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch' });
    await page.waitForTimeout(180);
    await left.dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch' });
    await right.dispatchEvent('pointerdown', { pointerId: 2, pointerType: 'touch' });
    await page.waitForTimeout(180);
    await right.dispatchEvent('pointerup', { pointerId: 2, pointerType: 'touch' });
  }
  const state = await page.evaluate(() => (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.());
  expect(state?.player?.animationState).toBe('idle');
});
