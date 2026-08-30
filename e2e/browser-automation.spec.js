const { test, expect } = require('@playwright/test');

test('browser DOM automation can fill a same-origin cockpit page', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    win.EONTabSystem?.navigateCurrentTab?.('/build');
  });

  await expect(page.frameLocator('#browser-frame').locator('#wb-mission-input')).toBeVisible();

  await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    return win.EONBrowserAutomation?.fill?.('#wb-mission-input', 'Mirror Node 01');
  });

  await expect(page.frameLocator('#browser-frame').locator('#wb-mission-input')).toHaveValue('Mirror Node 01');
  await expect(page.locator('#browser-automation-status')).toContainText(/Filled #wb-mission-input/i);
});
