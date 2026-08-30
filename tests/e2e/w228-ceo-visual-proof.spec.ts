import { expect, test } from '@playwright/test';

const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W228 CEO visual proof matrix', () => {
  // Visual City evidence requires the genuine owner session contract, never seeded browser storage.
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  test('captures the canonical City surface, Share Center, and legacy 3D alias without commercial claims', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto('/eoncity');
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-eon-play-objective]')).toContainText(/Find a district signal/i);
    await expect(page.locator('body')).not.toContainText(/pool point|cash out|payout|buy now|reward campaign/i);
    await page.screenshot({ path: testInfo.outputPath('w228-city-desktop.png'), fullPage: true });

    await page.goto('/profile');
    await page.getByRole('button', { name: 'Open EON Share' }).click();
    const dialog = page.getByRole('dialog', { name: 'Invite & Share Center' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/does not publish this chat, your Vault, keys, recovery material, saved work, or a public profile database/i)).toBeVisible();
    await expect(dialog.getByText(/No click tracking, reward, payout, commission, public storefront, or automatic posting is active/i)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('w228-share-center-desktop.png'), fullPage: true });

    await page.goto('/eoncity/3d');
    await expect(page).toHaveURL(/\/eoncity$/);
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-eon-city-3d-root]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('w228-city-legacy-3d-alias-desktop.png'), fullPage: true });
  });

  test('captures the narrow portrait and landscape City control layouts without unsafe claims', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/eoncity');
    const portraitCompanion = page.getByText(/EON NOIR · PORTRAIT COMPANION/i);
    if (await portraitCompanion.count()) {
      await expect(portraitCompanion).toBeVisible();
      await expect(page.getByRole('link', { name: /Explore in landscape/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Ask EONBOT/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Open Workspace/i })).toBeVisible();
    } else {
      await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).toContainText(/Landscape is recommended/i);
      await expect(page.locator('[data-play-move]')).toHaveCount(4);
    }
    await page.screenshot({ path: testInfo.outputPath('w228-city-portrait-companion.png'), fullPage: true });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/eoncity');
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-play-move]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByText(/CITY CONTROLS · LOCAL ONLY/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Touch controls/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pause/i })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('w228-city-landscape-controls.png'), fullPage: true });
  });
});
