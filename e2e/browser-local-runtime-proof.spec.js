const { test, expect } = require('@playwright/test');

test('browser local runtime check publishes structured proof snapshot', async ({ page }) => {
  await page.goto('/eon-browser.html');

  const result = await page.evaluate(async () => {
    const win = /** @type {any} */ (window);
    if (!win.EONBrowserEvidence?.runLocalRuntimeChecks) {
      return { ok: false, reason: 'EONBrowserEvidence missing' };
    }

    const summary = await win.EONBrowserEvidence.runLocalRuntimeChecks();
    const latest = win.EONBrowserEvidence.getLatestLocalRuntimeProof();
    const hasShape = Boolean(latest)
      && Number.isFinite(Number(latest.elapsedMs))
      && typeof latest.tierHint === 'string'
      && typeof latest.gpuHint === 'string'
      && Array.isArray(latest.findings);

    return {
      ok: hasShape,
      reason: hasShape ? 'ok' : 'invalid-proof-shape',
      reachable: Number(summary?.reachable || 0)
    };
  });

  expect(result.ok, result.reason).toBeTruthy();
});
