const { test, expect } = require('@playwright/test');

test('browser tabs keep per-tab history and survive reloads', async ({ page }) => {
  await page.goto('/eon-browser.html', { waitUntil: 'domcontentloaded' });

  const stateShape = await page.evaluate(() => {
    const win = /** @type {any} */ (window);
    const system = win.EONTabSystem;
    if (!system?.navigateCurrentTab || !system?.goBack || !system?.goForward) {
      return { ok: false, reason: 'EONTabSystem missing history controls' };
    }

    system.navigateCurrentTab('/build');
    system.navigateCurrentTab('/create');

    const beforeBack = {
      url: String(document.getElementById('browser-url')?.value || ''),
      history: system.state.tabs[0]?.history || [],
      historyIndex: system.state.tabs[0]?.historyIndex ?? -1
    };

    system.goBack();
    const afterBack = String(document.getElementById('browser-url')?.value || '');
    system.goForward();
    const afterForward = String(document.getElementById('browser-url')?.value || '');

    return {
      ok: beforeBack.history.length >= 2
        && beforeBack.historyIndex >= 1
        && afterBack.includes('/build')
        && afterForward.includes('/create'),
      reason: 'history-flow',
      beforeBack,
      afterBack,
      afterForward
    };
  });

  expect(stateShape.ok, stateShape.reason).toBeTruthy();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#browser-url')).toHaveValue(/\/create$/);
});
