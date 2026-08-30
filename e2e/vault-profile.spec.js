const { test, expect } = require('@playwright/test');

test('vault profile section and XP bar render', async ({ page }) => {
  await page.goto('/vault');
  await expect(page.locator('#vault-profile')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Profile snapshot' })).toBeVisible();
  await expect(page.locator('#vault-xp .daily-progress[aria-label="XP progress bar"]')).toBeVisible({ timeout: 15000 });
});

test('vault page has correct title', async ({ page }) => {
  await page.goto('/vault');
  await expect(page).toHaveTitle(/Vault/i);
});

test('vault invite section renders share link', async ({ page }) => {
  await page.goto('/vault');
  await expect(page.locator('#vault-invite')).toBeVisible({ timeout: 10000 });
});

test('vault wallet section renders', async ({ page }) => {
  await page.goto('/vault');
  const walletSection = page.locator('#vault-wallet, #vault-claims');
  await expect(walletSection.first()).toBeVisible({ timeout: 10000 });
});

test('vault has manifest link for PWA installability', async ({ page }) => {
  await page.goto('/vault');
  const manifestLink = page.locator('link[rel="manifest"]');
  await expect(manifestLink).toHaveCount(1);
  await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');
});

test('vault mirror targets panel renders and persists targets', async ({ page }) => {
  await page.goto('/vault');
  await page.evaluate(() => {
    const input = document.getElementById('vault-mirror-input');
    const saveBtn = document.getElementById('vault-mirror-save-btn');
    if (input) {
      input.value = 'ipfs://mirror-a, https://mirror.example/vault';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (saveBtn) {
      saveBtn.click();
    }
  });
  await expect(page.locator('#vault-mirror-targets')).toContainText('2 mirror targets configured', { timeout: 10000 });
  await page.reload();
  await expect.poll(async () => page.evaluate(() => {
    try {
      const raw = localStorage.getItem('eon:profile');
      if (!raw) return 0;
      const profile = JSON.parse(raw);
      return Array.isArray(profile?.recovery?.mirrorTargets) ? profile.recovery.mirrorTargets.length : 0;
    } catch {
      return -1;
    }
  })).toBe(2);
});

