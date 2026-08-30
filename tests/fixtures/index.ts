import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

type TestFixtures = {
  signalPage: Page;
  mockExchangeData: (page: Page) => Promise<void>;
  setupBinanceAPI: (page: Page, apiKey: string, apiSecret: string) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  signalPage: async ({ page }, use) => {
    await page.goto('/signal');
    await page.waitForLoadState('networkidle');
    await use(page);
  },

  mockExchangeData: async ({}, use) => {
    await use(async (page: Page) => {
      // Mock fetch for exchange APIs
      await page.addInitScript(() => {
        const originalFetch = window.fetch;
        (window as any).fetch = function(...args: any[]) {
          const [url] = args;
          if (url.includes('api.binance.com') && url.includes('ticker')) {
            return Promise.resolve(
              new Response(JSON.stringify({
                symbol: 'BTCUSDT',
                lastPrice: '65234.50',
                volume: '1234567.89',
              }), { status: 200 })
            );
          }
          if (url.includes('api.coinbase.com') && url.includes('products')) {
            return Promise.resolve(
              new Response(JSON.stringify({
                id: 'BTC-USD',
                price: '65234.50',
                volume_24h: 1234567,
              }), { status: 200 })
            );
          }
          return originalFetch.apply(this, args);
        };
      });
    });
  },

  setupBinanceAPI: async ({}, use) => {
    await use(async (page: Page, apiKey: string, apiSecret: string) => {
      await page.locator('input[placeholder*="Binance"][placeholder*="key"]')
        .fill(apiKey);
      await page.locator('input[placeholder*="Binance"][placeholder*="secret"]')
        .fill(apiSecret);
      await page.locator('button:has-text("Connect Binance")').click();
      await page.waitForTimeout(1000);
    });
  },
});

export { expect };
