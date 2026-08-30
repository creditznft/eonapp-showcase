import { test, expect } from '@playwright/test';

test.describe('W226 commercial safety decision gate', () => {
  test('keeps unauthenticated hosted billing disabled and preserves server-authoritative payment safeguards', async ({ page }) => {
    await page.goto('/billing');
    // The former no-go snapshot is superseded by hosted subscriptions. The authoritative
    // invariant is still that an unsigned browser cannot activate checkout or entitlement.
    const gate = page.locator('#eon-billing-runtime-status');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText(/Billing status could not be verified|No checkout or subscription action has been enabled/i);
    const planButtons = page.getByRole('button', { name: /Sign in for (Plus|Studio|Power|Max)/i });
    await expect(planButtons).toHaveCount(4);
    expect(await planButtons.evaluateAll((buttons) => buttons.every((button) => (button as HTMLButtonElement).disabled))).toBe(true);
    await expect(page.locator('main')).toContainText(/Checkout is created only by the same-origin server route after sign-in/i);
    await expect(page.locator('main')).toContainText(/signed server webhook updates the entitlement ledger/i);
    await expect(page.locator('main')).toContainText(/Crypto, direct wallet payment, NFT purchase, referral payout, ad reward and offerwall payment paths are not EONAPP subscription rails/i);
  });
});
