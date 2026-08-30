const { test, expect } = require('@playwright/test');

test('admin fallback drill and proof export are operational', async ({ page }) => {
  await page.goto('/admin.html');

  await page.waitForSelector('#admin-fallback-run-drill', { timeout: 20000 });

  await page.click('#admin-fallback-run-drill');
  await expect(page.locator('#admin-fallback-status')).toContainText(/Fallback drill (passed|failed)/, { timeout: 30000 });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#admin-fallback-export-proof')
  ]);

  const suggested = download.suggestedFilename();
  expect(suggested).toContain('fallback-proof-');
  expect(suggested.endsWith('.json')).toBeTruthy();
});
