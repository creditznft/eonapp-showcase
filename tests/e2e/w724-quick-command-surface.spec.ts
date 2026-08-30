import { expect, test } from '@playwright/test';

test.describe('W724 full-screen Quick Command', () => {
  test('desktop Orb opens a full-screen productive surface', async ({ page }) => {
    await page.goto('/create');
    const orb = page.locator('[data-eon-command-orb]');
    await expect(orb).toBeVisible();
    await orb.click();
    const surface = page.locator('[data-eon-command-surface]');
    await expect(surface).toBeVisible();
    await expect(surface).toHaveAttribute('aria-modal', 'true');
    const viewport = page.viewportSize();
    const box = await surface.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box?.width || 0) - (viewport?.width || 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((box?.height || 0) - (viewport?.height || 0))).toBeLessThanOrEqual(2);
    await expect(surface.locator('[data-eon-command-id]')).toHaveCount(4);
    await expect(surface.getByRole('button', { name: /Ask EONBOT/i })).toBeVisible();
    await expect(surface.getByRole('button', { name: /Share/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(surface).toBeHidden();
    await expect(orb).toBeFocused();
  });

  test('mobile surface remains full-screen and keyboard shortcut works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');
    await page.keyboard.press('Alt+k');
    const surface = page.locator('[data-eon-command-surface]');
    await expect(surface).toBeVisible();
    const box = await surface.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(389);
    expect(box?.height).toBeGreaterThanOrEqual(843);
    await expect(surface.getByText('Projects', { exact: true })).toBeVisible();
  });
});
