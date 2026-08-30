const { test, expect } = require('@playwright/test');

test('browser anti-bot review panel is visible and manual-only', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('#browser-captcha-scan')).toBeVisible();
  await expect(page.locator('#browser-captcha-status')).toContainText(/challenge|CAPTCHA|anti-bot/i);
  await expect(page.locator('summary')).toContainText(/Anti-bot|Challenge Review/i);
  await expect(page.locator('#browser-captcha-solve')).toHaveCount(0);
});
