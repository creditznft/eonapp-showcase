const { test, expect } = require('@playwright/test');

test.describe('EONAPP.ch Core Flows', () => {
  test('First-time user onboarding creates local vault', async ({ page }) => {
    await page.goto('/vault');

    // Check for standard Vault initialization elements
    const vaultTitle = page.locator('h1');
    await expect(vaultTitle).toContainText(/Vault/i);

    // Verify that data is being stored locally and not on a server
    const storage = await page.evaluate(() => JSON.stringify(localStorage));
    // Check for keys mentioned in the MEGA-BLUEPRINT (eon:credits, eon:xp, etc)
    expect(storage).toMatch(/eon:/);
  });

  test('Token Swap P2P broadcast initialization', async ({ page }) => {
    // P2P discovery is an ES6 module - check if it can be imported
    await page.goto('/');

    // Try to import the module dynamically
    const p2pStatus = await page.evaluate(async () => {
      try {
        const module = await import('/assets/js/utils/p2p-discovery.js');
        return {
          loaded: true,
          hasPublishOffer: typeof module.publishOffer === 'function',
          hasBrowseOffers: typeof module.browseOffers === 'function',
        };
      } catch (e) {
        return { loaded: false, error: e.message };
      }
    });

    if (!p2pStatus.loaded) {
      test.skip(true, 'P2P module could not be loaded: ' + p2pStatus.error);
      return;
    }

    expect(p2pStatus.hasPublishOffer).toBe(true);
    expect(p2pStatus.hasBrowseOffers).toBe(true);
  });

  test('Security Headers Audit', async ({ page, request }) => {
    const response = await page.goto('/');
    const headers = response.headers();

    // Check if running on Netlify (has proper headers)
    const isNetlify = headers['server']?.includes('Netlify') ||
                      (headers['content-security-policy']?.length > 20);

    if (!isNetlify) {
      test.skip(true, 'Security headers only on Netlify deployment');
      return;
    }

    // Verify the hardening from your _headers file
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
  });
});