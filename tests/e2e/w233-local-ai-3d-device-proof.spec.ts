import { test, expect } from '@playwright/test';

const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W233 Local AI onboarding and optional 3D proof', () => {
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });

  test('keeps model onboarding user-tapped, device-local, and free of cloud-download claims', async ({ page }) => {
    await page.goto('/local-ai');
    await expect(page.getByRole('heading', { name: 'Local AI setup' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Choose a conservative starting profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Scan installed models/i }).first()).toBeVisible();
    await expect(page.getByText(/does not maintain a hidden model marketplace/i)).toBeVisible();
    await expect(page.getByText(/127\.0\.0\.1/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download model|Install automatically/i })).toHaveCount(0);
  });

  test('resolves the retired optional 3D route to canonical City and keeps all evidence local-only', async ({ page }) => {
    // W649 requires a real session for City rendering; an unsigned run is pending owner evidence.
    test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');
    await page.goto('/eoncity/3d');
    await expect(page).toHaveURL(/\/eoncity$/);
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-eon-city-3d-root]')).toHaveCount(0);
    await expect(page.locator('body')).toContainText(/local-only frame evidence/i);
    await expect(page.locator('body')).toContainText(/no account, wallet, provider, reward/i);
  });
});
