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
  reason: 'Local W741 browser proof.',
  dataCustody: 'Local browser proof uses no account, project, Vault, provider, prompt or file data.'
};

async function bootCommandHub(page) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-play-session[data-eon-city-command-hub="w737"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-eon-city-menu-open]')).toBeVisible({ timeout: 15_000 });
}

async function clickCenter(locator, page) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
}

test('W741 City Menu has one launcher/controller and survives close, reopen, Escape, focus and restart', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await bootCommandHub(page);

  const menuLauncher = page.locator('[data-eon-city-menu-open]');
  await expect(menuLauncher).toHaveCount(1);
  await expect(page.locator('[data-eon-city-district-actions]')).toHaveCount(0);
  await expect(page.locator('body > [data-eon-city-command-menu]')).toHaveCount(1);

  const visibleHudActions = await page.locator('.eon-city-reduced-actions > *').evaluateAll((nodes) => nodes
    .filter((node) => !node.hasAttribute('hidden') && getComputedStyle(node).display !== 'none')
    .map((node) => String(node.textContent || '').trim()));
  expect(visibleHudActions).toEqual(['Nexus', 'City Menu', 'Share', 'Exit City']);

  await clickCenter(menuLauncher, page);
  const menu = page.locator('body > [data-eon-city-command-menu]');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await expect(menu.locator('[data-eon-city-featured="signal-frontier"]')).toContainText('Signal Frontier');
  await expect(menu.locator('[data-eon-city-featured="storm-sector"]')).toContainText('Storm Sector');
  await expect(menu.locator('[data-eon-city-featured="my-frontier"]')).toContainText('My Frontier');
  await expect(menu.locator('[data-eon-city-quick="share"]')).toHaveText('Share Command Center');
  await expect(menu.locator('[data-eon-city-quick="capture"]')).toHaveText('Creator Capture');
  await expect(menu.locator('[data-eon-city-quick="plans"]')).toHaveText('Plans & Access');
  await expect(page.locator('[data-eon-city-menu-close]')).toBeFocused();

  await menu.locator('[data-eon-city-quick="share"]').click();
  const shareCenter = page.locator('[data-eon-share-sheet]');
  await expect(shareCenter).toBeVisible({ timeout: 15_000 });
  await expect(shareCenter).toContainText('Share Command Center');
  await expect(shareCenter.locator('[data-eon-share-city-capture]')).toBeVisible();
  await shareCenter.locator('[data-eon-share-close]').click();
  await expect(shareCenter).toHaveCount(0);

  await clickCenter(menuLauncher, page);
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-eon-city-menu-close]')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(menuLauncher).toBeFocused();

  await clickCenter(menuLauncher, page);
  await expect(menu).toBeVisible();
  await page.locator('[data-eon-city-menu-close]').click();
  await expect(menu).toBeHidden();
  await expect(menuLauncher).toBeFocused();

  const generationBefore = Number(await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-mount-generation') || 0);
  await clickCenter(menuLauncher, page);
  await page.locator('[data-eon-city-menu-restart]').click();
  await expect.poll(async () => Number(await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-mount-generation') || 0), { timeout: 30_000 })
    .toBeGreaterThan(generationBefore);
  await expect(page.locator('.eon-play-session[data-eon-city-command-hub="w737"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-eon-city-menu-open]')).toHaveCount(1);
  await expect(page.locator('body > [data-eon-city-command-menu]')).toHaveCount(1);
  await expect(page.locator('[data-eon-city-runtime-launcher="w737"]')).toHaveCount(3);

  const markerState = await page.evaluate(() => ({
    visibleMarkers: Number(document.querySelector('[data-eon-city-command-labels]')?.getAttribute('data-visible-count') || 0),
    promptCards: document.querySelectorAll('[data-eon-city-command-prompt]').length,
    engineInvariant: (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: { getRuntimeSummary?: () => unknown } }).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.()
  }));
  expect(markerState.visibleMarkers).toBeLessThanOrEqual(3);
  expect(markerState.promptCards).toBe(1);
  expect(markerState.engineInvariant?.oneEngine).toBe(true);
  expect(markerState.engineInvariant?.oneScene).toBe(true);
  expect(markerState.engineInvariant?.oneRenderLoop).toBe(true);
  expect(pageErrors).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('w741-city-menu-after-restart.png'), fullPage: false });
  const proofPath = testInfo.outputPath('w741-city-menu-controller-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({
    schema: 'eonapp.w741.city-menu-controller-browser-proof.v1',
    visibleHudActions,
    generationBefore,
    generationAfter: Number(await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-mount-generation') || 0),
    markerState,
    pageErrors
  }, null, 2));
  await testInfo.attach('w741-city-menu-controller-proof', { path: proofPath, contentType: 'application/json' });
});
