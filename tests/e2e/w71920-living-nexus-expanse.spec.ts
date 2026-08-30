import { expect, test } from '@playwright/test';

const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 }
];

test.describe('W719.21 Living Nexus direct-City mount and physical Expanse journey', () => {
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  for (const viewport of VIEWPORTS) {
    test(`canonical close and unobstructed HUD at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
      const nexus = page.getByRole('button', { name: 'Open EONCITY Living Nexus' });
      const panel = page.locator('[data-eon-play-living-nexus-panel]');
      await expect(nexus).toBeVisible({ timeout: 15_000 });
      await expect(panel).toHaveCount(1);
      await expect(page.locator('.eon-w659g-capture > button, .eon-w659g-membership > button, .eon-w659g-progress > button')).toBeHidden();
      for (const closeWithEscape of [false, true, false]) {
        await nexus.click();
        await expect(panel).toBeVisible();
        if (closeWithEscape) await page.keyboard.press('Escape');
        else await panel.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(panel).toBeHidden();
        await expect(panel).toHaveCount(1);
      }
    });
  }

  test('Expanse selection preserves Nexus and exposes the physical gateway journey', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open EONCITY Living Nexus' }).click();
    const panel = page.locator('[data-eon-play-living-nexus-panel]');
    await panel.getByRole('button', { name: /The Expanse/i }).click();
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: /Guide Pathfinder to the physical gateway/i })).toBeVisible();
    await panel.getByRole('button', { name: /Guide Pathfinder to the physical gateway/i }).click();
    await expect(panel).toBeVisible();
    await expect(page.locator('[data-eon-play-living-nexus-gateway]')).toBeVisible();
  });
});
