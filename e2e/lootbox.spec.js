const { test, expect } = require('@playwright/test');

test('vault lootbox section renders open controls', async ({ page }) => {
  await page.goto('/vault');
  await expect(page.locator('#lootbox')).toBeVisible();
  await expect(page.locator('#vault-lootbox')).toBeVisible();
  await expect(page.locator('#lootbox-claim-btn')).toBeVisible({ timeout: 15000 });
});

test('lootbox claim button is accessible', async ({ page }) => {
  await page.goto('/vault');
  const claimBtn = page.locator('#lootbox-claim-btn');
  await expect(claimBtn).toBeVisible({ timeout: 15000 });
  // Button should have accessible name
  const text = await claimBtn.textContent();
  expect(text?.trim().length).toBeGreaterThan(0);
});

test('lootbox section has heading', async ({ page }) => {
  await page.goto('/vault');
  // Look for the specific lootbox heading by text content
  const heading = page.locator('h2:has-text("Lootboxes"), h3:has-text("Lootbox"), #lootbox h2');
  await expect(heading.first()).toBeVisible({ timeout: 15000 });
});

