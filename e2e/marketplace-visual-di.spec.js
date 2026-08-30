const { test, expect } = require('@playwright/test');

async function stabilizeMarketplaceUi(page) {
  await page.addInitScript(() => {
    try {
      const opened = {
        'marketplace:en': Date.now(),
        'marketplace:ar': Date.now(),
        'marketplace:ja': Date.now(),
        'marketplace:hi': Date.now(),
        'marketplace:es': Date.now()
      };
      localStorage.setItem('eon:widget:auto-opened:v2', JSON.stringify(opened));
    } catch {}
  });
}

async function closeWidgetIfOpen(page) {
  const closeBtn = page.locator('#ew-close-btn');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true });
  }
}

test('marketplace checkout modal is high-contrast and readable', async ({ page }) => {
  await stabilizeMarketplaceUi(page);
  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);

  await page.locator('.mp-buy-btn').first().click();
  await expect(page.locator('.mp-buy-modal')).toBeVisible();

  const styles = await page.evaluate(() => {
    const modal = document.querySelector('.mp-buy-modal');
    if (!modal) return null;
    const m = getComputedStyle(modal);
    return {
      modalBorderTopWidth: m.borderTopWidth,
      modalBoxShadow: m.boxShadow,
      modalBackgroundImage: m.backgroundImage
    };
  });

  expect(styles).toBeTruthy();
  expect(parseFloat(styles.modalBorderTopWidth)).toBeGreaterThanOrEqual(2);
  expect(String(styles.modalBoxShadow)).not.toBe('none');
  expect(String(styles.modalBackgroundImage)).toContain('gradient');
});

test('distributed inference lets user announce and discover contributed model', async ({ page }) => {
  await stabilizeMarketplaceUi(page);
  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);

  const result = await page.evaluate(async () => {
    const win = /** @type {any} */ (window);
    if (!win.DistributedInferenceIntegration) {
      return { ok: false, reason: 'DistributedInferenceIntegration missing' };
    }

    const wallet = '0x84fB9245267780D480B8F3720bec7C6F2544c583';
    const modelId = `ollama/test-${Date.now()}`;

    const announce = await win.DistributedInferenceIntegration.announceNode({
      userId: wallet,
      displayName: 'E2E Node',
      runtimeType: 'ollama',
      supportedModels: [modelId],
      tier: 0,
      stakeEON: 0,
      gpu: 'CPU',
      vramGB: 0,
      maxContextTokens: 2048
    });

    if (!announce?.success) {
      return { ok: false, reason: announce?.error || 'announce failed' };
    }

    const models = await win.DistributedInferenceIntegration.getAvailableModels();
    const found = Array.isArray(models) && models.some((m) => String(m.modelId) === modelId);

    return { ok: found, reason: found ? 'found' : 'not found', nodeId: announce.nodeId };
  });

  expect(result.ok, result.reason).toBeTruthy();
});

test('distributed inference supports hosted API provider contribution mode', async ({ page }) => {
  await stabilizeMarketplaceUi(page);
  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);

  const result = await page.evaluate(async () => {
    const win = /** @type {any} */ (window);
    if (!win.DistributedInferenceIntegration?.announceApiProvider) {
      return { ok: false, reason: 'announceApiProvider missing' };
    }

    const wallet = '0x8fBbE1AD5EC08fDEAb07E232B2d062B870D208F2';
    const modelId = `openrouter/test-${Date.now()}`;

    const announced = await win.DistributedInferenceIntegration.announceApiProvider({
      userId: wallet,
      providerId: 'openrouter',
      keyAlias: 'ops-key',
      supportedModels: [modelId],
      tier: 0,
      stakeEON: 0,
      maxContextTokens: 8192
    });

    if (!announced?.success) {
      return { ok: false, reason: announced?.error || 'announce api provider failed' };
    }

    const registry = win.DistributedInferenceIntegration.getModelRegistry(modelId);
    const found = Array.isArray(registry) && registry.some((row) => String(row.modelId) === modelId);
    return { ok: found, reason: found ? 'found' : 'not found', nodeId: announced.nodeId };
  });

  expect(result.ok, result.reason).toBeTruthy();
});

test('marketplace renders permanence badge and anchored archive row for Arweave listing', async ({ page }) => {
  await stabilizeMarketplaceUi(page);
  await page.addInitScript(({ walletAddress }) => {
    localStorage.setItem('eon:profile:v1', JSON.stringify({ wallet: walletAddress }));
  }, { walletAddress: '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862' });

  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);

  const listingTitle = `E2E Permanent ${Date.now()}`;
  const arweaveUri = `https://arweave.net/${'a'.repeat(43)}`;

  await page.click('.mp-tab[data-tab="create"]', { force: true });
  await expect(page.locator('#mp-create-panel')).toBeVisible();
  await page.fill('#mp-create-title', listingTitle);
  await page.fill('#mp-create-price', '5');
  await page.fill('#mp-create-image', arweaveUri);
  await page.fill('#mp-create-token-id', '0');
  await page.click('#mp-create-submit-btn');
  await expect(page.locator('#mp-create-result')).toContainText(/Listed!|Listing created/, { timeout: 15000 });

  const listingCard = page.locator('.mp-card').filter({ hasText: listingTitle }).first();
  await expect(listingCard).toBeVisible();
  await expect(listingCard.locator('.mp-tag-permanent')).toContainText('Permanent');

  await listingCard.locator('.mp-buy-btn').click();
  await expect(page.locator('.mp-buy-modal')).toBeVisible();
  await expect(page.locator('.mp-buy-row').filter({ hasText: 'Archive' })).toContainText('Arweave Anchored');
});
