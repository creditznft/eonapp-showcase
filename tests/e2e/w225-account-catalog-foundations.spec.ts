import { test, expect } from '@playwright/test';

test.describe('W225 account and official catalog foundations', () => {
  test('shows local-only account, inactive public Realm publishing, and commerce safety boundaries', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());

    // The current profile makes this safety card an explicit Account & backup deep link.
    await page.goto('/profile#profile-account-backup');
    const profile = page.locator('#eon-profile-account-foundation');
    await expect(profile).toBeVisible();
    await expect(profile).toContainText(/guest-first\. your work stays on this device/i);
    await expect(profile).toContainText(/account sign-in is unavailable on this deployment|google login unavailable/i);
    // Optional identity may be disclosed, but this deployment exposes no enabled account action.
    await expect(page.locator('#eon-profile-google-login')).toBeDisabled();

    await page.goto('/realm-studio');
    await expect(page.locator('#realm-studio-publication-status')).toBeVisible();
    await expect(page.locator('#realm-studio-publication-status')).toContainText(/not active|server-backed public Realm publication/i);
    await expect(page.locator('#realm-studio-safety-card, .realm-studio-safety-card')).not.toContainText(/publish now|open store|earn/i);

    await page.goto('/market');
    await page.getByRole('tab', { name: /Future safeguards/i }).click();
    const official = page.locator('[data-commerce-active="false"]');
    await expect(official).toBeVisible();
    await expect(official).toContainText(/This studio is not a marketplace/i);
    // Supersedes the old inactive-catalog heading: the current invariant prohibits user trading
    // and browser-controlled entitlement, while any subscription is a separate hosted service.
    await expect(official).toContainText(/No user seller marketplace/i);
    await expect(official).toContainText(/No wallet, NFT, token, resale, commission, or payout rail/i);
    await expect(official).toContainText(/No browser callback is accepted as payment or entitlement proof/i);
    await expect(page.getByRole('button', { name: /Buy|Checkout|Withdraw|Claim|Trade/i })).toHaveCount(0);
  });
});
