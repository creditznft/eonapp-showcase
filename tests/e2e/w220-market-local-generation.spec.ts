import { test, expect } from '@playwright/test';

test.describe('W220 Market local generation vertical slice', () => {
  test('starts empty, generates four local previews only after user action, saves locally, and resumes only after a click', async ({ page }) => {
    await page.goto('/market');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Create 4 original local previews' })).toBeVisible();
    await expect(page.locator('[data-market-item]')).toHaveCount(0);
    await expect(page.getByText('Official commerce is not active')).not.toBeVisible();

    await page.locator('#eon-market-theme').selectOption('quiet-cosmos');
    await page.locator('#eon-market-prompt').fill('calm city archive');
    await page.getByRole('button', { name: 'Generate 4 originals' }).click();

    await expect(page.locator('article.eon-market-card:not(.is-revealing)')).toHaveCount(4);
    await expect(page.getByText('4 local previews ready')).toBeVisible();
    await expect(page.locator('article.eon-market-card').first()).toContainText(/Generated on this device · not minted · not a purchase · no financial value/);

    await page.getByRole('button', { name: 'Save locally' }).first().click();
    await expect(page.getByText(/was saved as a local preview record/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Saved locally|Already saved/ }).first()).toBeDisabled();

    const savedState = await page.evaluate(() => ({
      active: localStorage.getItem('eon:market:private-drop:v3'),
      legacy: localStorage.getItem('eon:market:private-drop:v2')
    }));
    expect(savedState.active).toBeTruthy();
    expect(savedState.legacy).toBeNull();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Create 4 original local previews' })).toBeVisible();
    await expect(page.locator('[data-market-item]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Resume local collection' })).toBeVisible();

    await page.getByRole('button', { name: 'Resume local collection' }).click();
    await expect(page.locator('article.eon-market-card:not(.is-revealing)')).toHaveCount(4);
  });

  test('migrates a legacy local collection only after Resume and leaves the original V2 record in storage', async ({ page }) => {
    await page.goto('/market');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Generate 4 originals' }).click();
    await expect(page.locator('article.eon-market-card:not(.is-revealing)')).toHaveCount(4);

    await page.evaluate(() => {
      const active = localStorage.getItem('eon:market:private-drop:v3');
      if (!active) throw new Error('expected generated V3 collection');
      const legacy = JSON.parse(active);
      legacy.schema = 'eon.market.private-drop.v2';
      legacy.items = legacy.items.map((item: Record<string, unknown>) => ({ ...item, source: 'market-private-drop-v2' }));
      localStorage.setItem('eon:market:private-drop:v2', JSON.stringify(legacy));
      localStorage.removeItem('eon:market:private-drop:v3');
    });

    await page.reload();
    await expect(page.getByText('Earlier local collection found')).toBeVisible();
    await expect(page.locator('[data-market-item]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Resume local collection' }).click();

    await expect(page.locator('article.eon-market-card:not(.is-revealing)')).toHaveCount(4);
    await expect(page.getByText(/original record remains unchanged/i)).toBeVisible();
    const migration = await page.evaluate(() => ({
      active: JSON.parse(localStorage.getItem('eon:market:private-drop:v3') || '{}'),
      legacy: localStorage.getItem('eon:market:private-drop:v2')
    }));
    expect(migration.active?.migration?.explicitUserResume).toBe(true);
    expect(migration.active?.migration?.preservedLegacySource).toBe(true);
    expect(migration.legacy).toBeTruthy();
  });

  test('official tab stays explanatory and has no checkout, listing, commission, payout, token, or trading action', async ({ page }) => {
    await page.goto('/market');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('tab', { name: 'Future safeguards' }).click();
    await expect(page.getByRole('heading', { name: 'This studio is not a marketplace' })).toBeVisible();
    const safeguards = page.locator('[data-commerce-active="false"]');
    await expect(safeguards).toContainText(/No user seller marketplace/i);
    await expect(safeguards).toContainText(/No wallet, NFT, token, resale, commission, or payout rail/i);
    await expect(safeguards).toContainText(/No browser callback is accepted as payment or entitlement proof/i);
    await expect(page.getByRole('button', { name: /Buy|Checkout|Withdraw|Claim|Trade/i })).toHaveCount(0);
  });
});
