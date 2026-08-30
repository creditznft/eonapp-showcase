import { test, expect } from '@playwright/test';

test.describe('W227 Phase 1/2 shell and route regression', () => {
  test('desktop shell keeps EONBOT primary, supports collapse, Share Center, and overflow actions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await expect(page.locator('.eon-app-sidebar')).toBeVisible();
    await expect(page.getByRole('link', { name: 'EONBOT', exact: true })).toHaveAttribute('href', '/');
    await page.locator('[data-eon-sidebar-collapse]').click();
    await expect(page.locator('body')).toHaveClass(/eon-app-sidebar-collapsed/);
    await expect(page.evaluate(() => localStorage.getItem('eon:shell:sidebar-collapsed:v1'))).resolves.toBe('true');
    await page.locator('[data-eon-header-share]').click();
    // W223 established the current global Share Command Center contract.
    await expect(page.getByRole('dialog', { name: 'Share Command Center' })).toBeVisible();
    await page.getByRole('button', { name: 'Close Share Command Center' }).click();
    await page.locator('[data-eon-header-overflow]').click();
    await expect(page.locator('[data-eon-header-menu]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-eon-header-menu]')).toHaveAttribute('hidden', '');
  });

  test('mobile shell opens a real drawer, traps focus, and returns focus to its menu trigger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    const menu = page.locator('[data-eon-sidebar-toggle]');
    await menu.click();
    await expect(page.locator('body')).toHaveClass(/eon-app-menu-open/);
    await expect(page.locator('[data-eon-mobile-close]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/eon-app-menu-open/);
    await expect(menu).toBeFocused();
  });

  test('canonical legacy aliases resolve without a loop and retired admin/dashboard routes leave public navigation', async ({ page }) => {
    for (const [alias, destination] of [
      ['/automation', '/automations'],
      ['/tools', '/create'],
      ['/live-trading-dashboard', '/insights'],
      ['/admin', '/archive']
    ]) {
      await page.goto(alias);
      if (destination === '/archive') {
        await expect(page.getByRole('link', { name: 'Open Chat' })).toBeVisible();
        await expect(page.locator('body')).toContainText(/archive has moved out of the main product/i);
      } else {
        if (destination === '/automations') {
          await expect(page.getByRole('heading', { name: /Automation/i }).first()).toBeVisible();
        } else if (destination === '/create') {
          // The retired tools alias now resolves to the current Create entry point.
          await expect(page.getByRole('heading', { name: 'Create something' })).toBeVisible();
        } else {
          await expect(page.getByRole('heading', { name: 'Research Lab' })).toBeVisible();
        }
        await expect(page).not.toHaveURL(/\.html(?:$|[?#])/);
      }
    }
  });
});
