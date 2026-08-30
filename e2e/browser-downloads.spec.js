const { test, expect } = require('@playwright/test');

test('browser download manager records local exports', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#browser-download-summary')).toContainText(/No downloads recorded yet/i);

  await page.locator('details.browser-details').filter({ has: page.locator('#browser-template-export') }).evaluate((el) => { el.open = true; });
  await page.locator('#browser-template-export').click();

  await expect(page.locator('#browser-download-summary')).toContainText(/download/i);
  await expect(page.locator('#browser-download-list')).toContainText(/eon-browser-templates/i);
});
