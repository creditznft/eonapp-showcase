const { test, expect } = require('@playwright/test');

test('vault community trigger path shows wallet guardrail when no provider is available', async ({ page }) => {
  await page.goto('/vault');

  const errorMessage = await page.evaluate(async () => {
    try {
      const module = await import('/assets/js/utils/community-triggers.js');
      await module.triggerSettlement(1);
      return 'no-error';
    } catch (error) {
      return String(error?.message || error);
    }
  });

  expect(errorMessage).toContain('Wallet provider unavailable');
});
