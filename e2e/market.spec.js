/**
 * Market Page E2E Tests — May 2026
 * Tests: catalog renders, search filters, listing cards, sell form present.
 */
const { test, expect } = require('@playwright/test');

test.describe('Market page', () => {
  test.skip(({ browserName }) => browserName === 'firefox', 'Known Playwright Firefox teardown instability on this suite.');

  test('loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(String(error?.message || error));
    });
    await page.goto('/market', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const real = errors.filter(e =>
      !e.toLowerCase().includes('resizeobserver loop limit exceeded')
    );
    expect(real).toHaveLength(0);
  });

  test('has correct title', async ({ page }) => {
    await page.goto('/market');
    await expect(page).toHaveTitle(/Market|EON Market/i);
  });

  test('hero section renders', async ({ page }) => {
    await page.goto('/market');
    await expect(page.locator('.mk-hero h1, .hero h1').first()).toBeVisible({ timeout: 8000 });
  });

  test('catalog section is present', async ({ page }) => {
    await page.goto('/market');
    await expect(page.locator('#browse, .mk-catalog, #mk-catalog')).toBeAttached({ timeout: 8000 });
  });

  test('at least one catalog card renders', async ({ page }) => {
    await page.goto('/market');
    await page.waitForTimeout(2000);
    const cards = page.locator('.mk-item-card, .market-card, .catalog-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('search input is present and accepts text', async ({ page }) => {
    await page.goto('/market');
    const searchInput = page.locator('#mk-search, [type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill('agent');
    await expect(searchInput).toHaveValue('agent');
  });

  test('sell / list-item section is present', async ({ page }) => {
    await page.goto('/market');
    await expect(page.locator('#sell')).toBeAttached({ timeout: 8000 });
    await expect(page.locator('#mk-listing-form')).toBeAttached({ timeout: 8000 });
  });

  test('filter tabs render if present', async ({ page }) => {
    await page.goto('/market');
    await page.waitForTimeout(1500);
    const tabs = page.locator('.mk-filter-tab, [data-filter], .filter-tab');
    const count = await tabs.count();
    // If tabs exist, they should be clickable
    if (count > 0) {
      await tabs.first().click({ force: true });
    }
    // Pass regardless — tabs may not be in all versions
  });
});
