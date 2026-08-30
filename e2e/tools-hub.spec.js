const { test, expect } = require('@playwright/test');

test('tools route loads as legacy utility hub', async ({ page }) => {
  const response = await page.goto('/tools.html', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('h1')).toContainText(/Tools/i);
});

test('tools route links into active workbench flow', async ({ page }) => {
  await page.goto('/tools.html');
  const link = page.locator('a[href="/build"]').first();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/build');
});
