const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const proofDir = path.join(process.cwd(), 'docs', 'qa', 'proof-screenshots');

function ensureProofDir() {
  fs.mkdirSync(proofDir, { recursive: true });
}

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

test('capture marketplace permanence proof screenshot', async ({ page }) => {
  ensureProofDir();
  await stabilizeMarketplaceUi(page);

  await page.addInitScript(({ walletAddress }) => {
    localStorage.setItem('eon:profile:v1', JSON.stringify({ wallet: walletAddress }));
  }, { walletAddress: '0xf0DbE1026a4CbfD00bad66163Db6f30C62197862' });

  await page.goto('/marketplace.html');
  await closeWidgetIfOpen(page);

  const listingTitle = `E2E Evidence Permanent ${Date.now()}`;
  const arweaveUri = `https://arweave.net/${'b'.repeat(43)}`;

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
  await listingCard.locator('.mp-buy-btn').click();
  await expect(page.locator('.mp-buy-modal')).toBeVisible();

  await page.screenshot({ path: path.join(proofDir, 'marketplace-permanence-proof.png'), fullPage: true });
});

test('capture admin fallback drill proof screenshot', async ({ page }) => {
  ensureProofDir();

  await page.goto('/admin.html');
  await page.waitForSelector('#admin-fallback-run-drill', { timeout: 20000 });

  await page.click('#admin-fallback-run-drill');
  await expect(page.locator('#admin-fallback-status')).toContainText(/Fallback drill (passed|failed)/, { timeout: 30000 });

  await page.screenshot({ path: path.join(proofDir, 'admin-fallback-drill-proof.png'), fullPage: true });
});

test('capture browser local-runtime proof screenshot', async ({ page }) => {
  ensureProofDir();

  await page.goto('/eon-browser.html');
  await page.click('#browser-local-check');
  await expect(page.locator('#browser-local-status')).toContainText(/Check completed in|No local runtime reachable yet|Local runtime checks complete/, { timeout: 20000 });

  await page.screenshot({ path: path.join(proofDir, 'browser-local-runtime-proof.png'), fullPage: true });
});
