import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W756 onboarding, navigation, mobile and accessibility proof.',
  dataCustody: 'The accessible map is a semantic projection of the same local City runtime.'
};

async function boot(page, width = 1440, height = 900) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.setViewportSize({ width, height });
  await page.goto('/eoncity?release=w756-onboarding-navigation-accessibility', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-eon-city-semantic-map-open]')).toBeVisible({ timeout: 20_000 });
}

test('W756 keyboard-only semantic map covers all ten stations and restores focus', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page);
  const launcher = page.locator('[data-eon-city-semantic-map-open]');
  await launcher.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('[data-eon-city-semantic-map]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-eon-city-semantic-station]')).toHaveCount(10);
  await expect(panel.locator('button,select').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(launcher).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('w756-accessible-map-desktop.png'), fullPage: false });
});

test('W756 mobile portrait keeps 48px controls and one non-3D path', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, 390, 844);
  await page.locator('[data-eon-city-semantic-map-open]').click();
  const result = await page.evaluate(() => {
    const panel = document.querySelector('[data-eon-city-semantic-map]');
    const controls = [...(panel?.querySelectorAll('button,select') || [])];
    return {
      stationCount: panel?.querySelectorAll('[data-eon-city-semantic-station]').length || 0,
      minimumHeight: Math.min(...controls.map((node) => (node as HTMLElement).getBoundingClientRect().height)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  expect(result.stationCount).toBe(10);
  expect(result.minimumHeight).toBeGreaterThanOrEqual(48);
  expect(result.horizontalOverflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('w756-accessible-map-mobile-portrait.png'), fullPage: true });
  const file = testInfo.outputPath('w756-mobile-accessibility-proof.json');
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  await testInfo.attach('w756-mobile-accessibility-proof', { path: file, contentType: 'application/json' });
});
