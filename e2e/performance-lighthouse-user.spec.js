const { test, expect } = require('@playwright/test');

// Optional lighthouse import - test skipped if not installed
let playAudit;
try {
  ({ playAudit } = require('playwright-lighthouse'));
} catch {
  playAudit = null;
}

test.describe('EONAPP.ch Performance Audit', () => {
  test('Homepage should pass Lighthouse threshold', async ({ page, browserName }) => {
    test.skip(true, 'Lighthouse configuration needs Chrome DevTools Protocol');
    test.skip(browserName !== 'chromium', 'Lighthouse only works on Chromium');
    if (!playAudit) {
      test.skip('playwright-lighthouse not installed');
      return;
    }
    await page.goto('/');

    // Ensure the flagship content is loaded before auditing
    await expect(page.locator('#trending-tools')).toBeVisible();

    await playAudit({
      page: page,
      port: new URL(page.url()).port || 8080,
      thresholds: {
        performance: 75,
        accessibility: 80,
        'best-practices': 80,
        seo: 80,
        pwa: 50,
      },
      opts: {
        loglevel: 'error',
      },
    });
  });

  test('Network Audit: No central DB/API leaks', async ({ page }) => {
    const leaks = [];
    
    // Monitor all network requests
    page.on('request', request => {
      const url = request.url();
      // List of allowed external dependencies (from your CSP)
      const allowedSubstrings = [
        'eonapp.ch',
        'localhost',
        'cdn.jsdelivr.net',
        'coingecko.com',
        'ipfs.io',
        'arweave.net',
        '127.0.0.1' // Local GunDB/Relay
      ];

      const isAllowed = allowedSubstrings.some(sub => url.includes(sub));
      if (!isAllowed) {
        leaks.push(url);
      }
    });

    await page.goto('/');
    expect(leaks, `Detected potential unauthorized tracking/central DB calls: ${leaks.join(', ')}`).toHaveLength(0);
  });
});