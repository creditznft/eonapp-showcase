const { test, expect } = require('@playwright/test');

test('browser bookmarks persist and render in the cockpit', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    win.EONTabSystem?.navigateCurrentTab?.('/build');
  });

  await page.getByRole('button', { name: /Bookmark current page/i }).click();

  await expect(page.locator('#eon-user-bookmarks')).toContainText(/Build|build/i);

  await page.locator('#eon-bookmarks-btn').click();
  await expect(page.locator('#eon-bookmark-list')).toContainText(/Build|build/i);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#eon-user-bookmarks')).toContainText(/Build|build/i);
});
