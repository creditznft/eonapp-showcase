const { test, expect } = require('@playwright/test');

test('games route loads as legacy catalog page', async ({ page }) => {
  const response = await page.goto('/games.html', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('h1')).toContainText(/Games/i);
});

test('games route exposes internal game links', async ({ page }) => {
  await page.goto('/games.html');
  const links = page.locator('a[href^="/games/"]');
  await expect(links.first()).toBeVisible();
  expect(await links.count()).toBeGreaterThanOrEqual(2);
});
