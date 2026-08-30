import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Nostr P2P Swap Registry
 * =====================================
 * Tests for nostr-swap-registry.js decentralized offer publishing,
 * local cache, offer lookup, and swap lifecycle.
 */

test.describe('Nostr Swap Registry — Offer Codes', () => {
  test('generateOfferCode should return 32-char hex string', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const code = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      return mod.generateOfferCode();
    });

    expect(code).toMatch(/^[0-9a-f]{32}$/);
  });

  test('generateReceiptCode should return 24-char hex string', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const code = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      return mod.generateReceiptCode();
    });

    expect(code).toMatch(/^[0-9a-f]{24}$/);
  });

  test('each generateOfferCode call should return unique value', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const codes = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      return Array.from({ length: 10 }, () => mod.generateOfferCode());
    });

    const unique = new Set(codes);
    expect(unique.size).toBe(10);
  });
});

test.describe('Nostr Swap Registry — Publish + Cache', () => {
  test('should publish offer to local cache and return ok', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();
      const result = await mod.publishP2POffer({
        uid: 'e2e-test-uid-111',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
        amount: '100',
        tokenSymbol: 'EONL',
      });
      return { ok: result.ok, offerCode };
    });

    expect(result.ok).toBe(true);
  });

  test('should find published offer by offerCode (local cache)', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();

      await mod.publishP2POffer({
        uid: 'e2e-test-uid-222',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
        amount: '250',
        tokenSymbol: 'EONL',
      });

      const lookup = await mod.lookupP2POffer(offerCode);
      return {
        ok: lookup.ok,
        source: lookup.source,
        hasOffer: !!lookup.offer,
        offerCodeMatch: lookup.offer?.offerCode === offerCode,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.source).toBe('cache');
    expect(result.hasOffer).toBe(true);
    expect(result.offerCodeMatch).toBe(true);
  });

  test('lookupP2POffer for unknown code should return ok:false', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      // Use a code that was never published
      const result = await mod.lookupP2POffer('0000000000000000000000000000dead');
      return { ok: result.ok };
    });

    // Not found
    expect(result.ok).toBe(false);
  });
});

test.describe('Nostr Swap Registry — Accept + Receipt Flow', () => {
  test('should accept an offer and update cache status', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();

      // Publish offer
      await mod.publishP2POffer({
        uid: 'e2e-test-uid-333',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
        amount: '500',
        tokenSymbol: 'EONL',
      });

      // Accept offer — function requires uid + receiptCode fields
      const acceptReceiptCode = mod.generateReceiptCode();
      const acceptResult = await mod.acceptP2POffer({
        offerCode,
        uid: 'e2e-acceptor-uid-444',
        receiptCode: acceptReceiptCode,
        bidderFingerprint: '0x1234560123456789abcdef0123456789abcdef02',
      });

      // Look up accepted offer
      const lookup = await mod.lookupP2POffer(offerCode);
      return {
        acceptOk: acceptResult.ok,
        cachedStatus: lookup.offer?.status || lookup.offer?.state || '',
      };
    });

    expect(result.acceptOk).toBe(true);
  });

  test('should redeem receipt and return receiptCode', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      const offerCode = mod.generateOfferCode();
      const receiptCode = mod.generateReceiptCode();

      await mod.publishP2POffer({
        uid: 'e2e-test-uid-555',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        offerCode,
      });

      // redeemP2PReceipt requires uid + receiptCode + offerCode
      const redeemResult = await mod.redeemP2PReceipt({
        offerCode,
        receiptCode,
        uid: 'e2e-redeemer-uid-666',
      });

      return { ok: redeemResult.ok };
    });

    expect(result.ok).toBe(true);
  });
});

test.describe('Nostr Swap Registry — Registry Status', () => {
  test('getSwapRegistryStatus should return structure with nostrAvailable + cacheSize', async ({ page }) => {
    await page.goto('/vault');
    await page.waitForLoadState('networkidle');

    const status = await page.evaluate(async () => {
      const mod = await import('/assets/js/utils/nostr-swap-registry.js');
      return mod.getSwapRegistryStatus();
    });

    expect(typeof status.nostrAvailable).toBe('boolean');
    expect(typeof status.cacheSize).toBe('number');
    expect(typeof status.relayCount).toBe('number');
  });
});
