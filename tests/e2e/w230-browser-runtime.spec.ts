import { expect, test } from '@playwright/test';

/**
 * This test deliberately uses an in-memory document. It proves that the
 * selected Chromium binary and Playwright runner can launch in a restricted
 * environment without claiming that local/Preview HTTP navigation worked.
 */
test('W230 Playwright can launch the selected Chromium runtime', async ({ page }) => {
  await page.setContent('<main><h1>W230 Chromium runtime ready</h1><button type="button">Ready</button></main>');
  await expect(page.getByRole('heading', { name: 'W230 Chromium runtime ready' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ready' })).toBeEnabled();
  await expect(page.evaluate(() => navigator.userAgent)).resolves.toMatch(/Chrom/i);
});
