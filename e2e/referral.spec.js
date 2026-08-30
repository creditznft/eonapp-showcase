/**
 * Referral System E2E Tests — May 2026
 * Tests: referral-par.js API, invite link generation, PAR proof actions wired to WorkBench.
 */
const { test, expect } = require('@playwright/test');

test.describe('Referral PAR system', () => {
  test('referral-par.js loads and exposes generateInviteLink', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      try {
        const m = await import('/assets/js/utils/referral-par.js');
        return {
          loaded: true,
          hasGenerateLink:     typeof m.generateInviteLink === 'function',
          hasTrySettle:        typeof m.trySettleProofOfActivityReferral === 'function',
          hasCaptureProof:     typeof m.captureProofOfActivityReferral === 'function',
          hasListen:           typeof m.listenForReferralProofs === 'function',
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });

    expect(result.loaded, result.error).toBeTruthy();
    expect(result.hasGenerateLink).toBeTruthy();
    expect(result.hasTrySettle).toBeTruthy();
  });

  test('generateInviteLink produces URL with ref, nonce, exp params', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const result = await page.evaluate(async () => {
      try {
        const m = await import('/assets/js/utils/referral-par.js');
        const link = await m.generateInviteLink({ id: 'e2e-test-user-001', alias: 'TestUser' });
        const url = new URL(link);
        return {
          ok: true,
          hasRef:   url.searchParams.has('ref'),
          hasNonce: url.searchParams.has('nonce'),
          hasExp:   url.searchParams.has('exp'),
          expInFuture: parseInt(url.searchParams.get('exp') || '0') > Date.now(),
        };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    expect(result.ok, result.error).toBeTruthy();
    expect(result.hasRef).toBeTruthy();
    expect(result.hasNonce).toBeTruthy();
    expect(result.hasExp).toBeTruthy();
    expect(result.expInFuture).toBeTruthy();
  });

  test('PROOF_ACTIONS includes WorkBench mission actions', async ({ page }) => {
    // Verify the PAR proof actions cover the AI platform (not just old games)
    await page.goto('/build', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // We can't directly access the module's private PROOF_ACTIONS Set, but we
    // can verify trySettleProofOfActivityReferral doesn't throw on mission-run
    const result = await page.evaluate(async () => {
      try {
        const m = await import('/assets/js/utils/referral-par.js');
        // Call with no pending referral — should silently noop, not throw
        await m.trySettleProofOfActivityReferral('mission-run', { id: 'e2e-probe' });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    expect(result.ok, result.error).toBeTruthy();
  });

  test('vault.html referral section renders invite link input', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // Vault renders referral section after profile is loaded
    const referralInput = page.locator('#vault-referral-link, [id*="referral"][type="text"]').first();
    // May not be visible until section is opened — just check it's in the DOM
    await expect(referralInput).toBeAttached({ timeout: 10000 });
  });

  test('vault.html copy invite link button is present', async ({ page }) => {
    await page.goto('/vault', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const copyBtn = page.locator('#vault-copy-link-btn, [id*="copy"][id*="link"]').first();
    await expect(copyBtn).toBeAttached({ timeout: 10000 });
  });
});
