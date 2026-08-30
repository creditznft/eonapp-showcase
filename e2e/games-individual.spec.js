const { test, expect } = require('@playwright/test');

const routes = [
  '/games/cyber-rogue/',
  '/games/realm-wars-lite/'
];

for (const route of routes) {
  test(`${route} loads without runtime errors`, async ({ page }) => {
    const issues = [];
    page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') issues.push(`console: ${message.text()}`);
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(500);

    const filtered = issues.filter((line) => !/favicon|failed to fetch|net::err/i.test(line));
    expect(filtered).toEqual([]);
  });
}
