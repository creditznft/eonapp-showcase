const { test, expect } = require('@playwright/test');

test('browser tabs keep hidden iframe pools per tab', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    win.EONTabSystem?.navigateCurrentTab?.('/build');
  });

  await page.getByRole('button', { name: /New tab/i }).click();
  await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    win.EONTabSystem?.navigateCurrentTab?.('/create');
  });

  await expect(page.locator('#browser-frame')).toHaveAttribute('src', /create/i);
  await expect.poll(async () => page.locator('#browser-frame-pool iframe').count()).toBeGreaterThanOrEqual(1);

  await page.getByRole('tab', { name: /Build/i }).click();
  await expect(page.locator('#browser-frame')).toHaveAttribute('src', /build/i);
  await expect.poll(async () => page.locator('#browser-frame-pool iframe').count()).toBeGreaterThanOrEqual(1);
});
