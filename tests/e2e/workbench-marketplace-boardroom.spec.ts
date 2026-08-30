import { test, expect } from '@playwright/test';

test.describe('WorkBench Boardroom + Marketplace Metadata', () => {
  test('renders boardroom decision ledger and reloads mission prompt', async ({ page }) => {
    const now = Date.now();
    await page.addInitScript((seedNow) => {
      localStorage.setItem('eon:boardroom:decisions:v1', JSON.stringify([
        {
          ts: seedNow,
          prompt: 'Boardroom audit my launch risk posture for the next sprint',
          decision: 'approve',
          recommendation: 'approve',
          confidence: 0.84,
          weightedScore: 0.76,
          twin: {
            summary: {
              revenue: '$128k',
              conversion: '2.8% -> 3.4%',
              churn: '4.2% -> 3.8%'
            }
          }
        }
      ]));
    }, now);

    await page.goto('/build');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Boardroom Decision History')).toBeVisible();
    await expect(page.locator('.wb-decision-pill.approve')).toBeVisible();

    await page.locator('.wb-boardroom-reload').first().click();
    await expect(page.locator('#modeTitle')).toContainText(/AI Boardroom/i);
    await expect(page.locator('#wb-mission-input')).toHaveValue(/launch risk posture/i);
  });

  test('filters marketplace by quality and seller reputation chips', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('eon:e2e:disable-marketplace-seeding', '1');

      localStorage.setItem('eon:profile:v1', JSON.stringify({
        wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      }));

      localStorage.setItem('eon:marketplace:listings:v1', JSON.stringify([
        {
          listingId: 'listing-a',
          collectionType: 'dataset',
          collectionAddr: 'offchain',
          tokenId: '1',
          sellerWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          priceEon: 120,
          currency: 'eon',
          status: 'active',
          title: 'Trusted AI Dataset',
          description: 'Verified and curated dataset',
          imageUri: '',
          districtId: '',
          rarityTier: 3,
          upgradeLevel: 1,
          ascensionTier: '',
          settlementMode: 'offchain',
          onchainListingId: null,
          metadata: {
            qualityTier: 'trusted',
            sellerReputation: { tier: 'trusted', score: 92.3 }
          },
          createdAt: new Date().toISOString(),
          expiresAt: ''
        },
        {
          listingId: 'listing-b',
          collectionType: 'workflow',
          collectionAddr: 'offchain',
          tokenId: '2',
          sellerWallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          priceEon: 75,
          currency: 'eon',
          status: 'active',
          title: 'Experimental Workflow Bundle',
          description: 'Early-stage workflow pack',
          imageUri: '',
          districtId: '',
          rarityTier: 1,
          upgradeLevel: 1,
          ascensionTier: '',
          settlementMode: 'offchain',
          onchainListingId: null,
          metadata: {
            qualityTier: 'experimental',
            sellerReputation: { tier: 'watch', score: 41.5 }
          },
          createdAt: new Date().toISOString(),
          expiresAt: ''
        }
      ]));
    });

    await page.goto('/marketplace.html');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('article.mp-card')).toHaveCount(2);
    await expect(page.locator('article.mp-card')).toContainText([
      /Trusted AI/i,
      /Experimental Workflow Bundle/i
    ]);

    await page.locator('.mp-filter-chip[data-filter-group="quality"][data-filter-value="trusted"]').click();
    await page.locator('.mp-filter-chip[data-filter-group="reputation"][data-filter-value="trusted"]').click();
    await page.locator('#mp-apply-filters-btn').click();

    await expect(page.locator('article.mp-card')).toHaveCount(1);
    await expect(page.locator('article.mp-card')).toContainText(/Trusted AI Dataset/i);
  });
});
