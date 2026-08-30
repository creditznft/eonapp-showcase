/**
 * Onboarding E2E Tests — May 2026
 * Tests the 3-step onboarding wizard: hardware detect → provider pick → key test.
 */
const { test, expect } = require('@playwright/test');

test.describe('Onboarding page', () => {
  test('loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/onboarding.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const real = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('failed to fetch') &&
      !e.includes('Failed to load resource: the server responded with a status of 404') &&
      !e.includes('/healthz') &&
      !e.toLowerCase().includes('net::err')
    );
    expect(real).toHaveLength(0);
  });

  test('shows correct page title', async ({ page }) => {
    await page.goto('/onboarding.html');
    await expect(page).toHaveTitle(/WorkBench|Onboarding|Get Started/i);
  });

  test('renders step 1 (hardware detect) on load', async ({ page }) => {
    await page.goto('/onboarding.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    // Should show the first step (hardware or welcome)
    const stepEl = page.locator('.ob-step.active, [data-step="0"].active, #ob-step-0, .ob-step-title').first();
    await expect(stepEl).toBeVisible({ timeout: 8000 });
  });

  test('progress dots are rendered', async ({ page }) => {
    await page.goto('/onboarding.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const dots = page.locator('.ob-step-dot, .ob-progress-dot, [data-dot]');
    await expect(dots.first()).toBeAttached();
  });

  test('provider selection section is reachable', async ({ page }) => {
    await page.goto('/onboarding.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    // Check provider cards or next button exists
    const provOrNext = page.locator('.ob-provider, .ob-providers, #ob-next-0, [data-action="next"]').first();
    await expect(provOrNext).toBeAttached({ timeout: 8000 });
  });

  test('already-done state stays on onboarding', async ({ page }) => {
    await page.goto('/onboarding.html');
    await page.evaluate(() => {
      localStorage.setItem('eon:onboarding-done:v1', 'true');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const storedFlag = await page.evaluate(() => localStorage.getItem('eon:onboarding-done:v1'));
    expect(storedFlag).toBe('true');
    await expect(page).toHaveURL(/\/onboarding\.html(?:\?.*)?$/);
    await expect(page.locator('#ob-step-0')).toBeVisible();
    await expect(page.locator('#ob-step-3-launch')).toBeAttached();
  });

  test('language chooser is visible and switchable', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('eon:lang:preference:v1', 'ja');
      localStorage.setItem('eon:lang:v1', 'ja');
    });
    await page.goto('/onboarding.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page.locator('#ob-language-rec')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await page.click('#ob-language-english-btn');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
