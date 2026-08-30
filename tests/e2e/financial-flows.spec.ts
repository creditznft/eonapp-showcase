import { test, expect } from '@playwright/test';

const WALLET_ADDRESS = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';

declare global {
  interface Window {
    EonWallet: any;
    EonLootbox: any;
  }
}

test.describe('Financial flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/vault.html');
  });

  test('wallet settlement flow updates balance and produces a claim snapshot', async ({ page }) => {
    const result = await page.evaluate(async (walletAddress) => {
      await import('/assets/js/utils/wallet.js');
      const wallet = window.EonWallet;

      wallet.addWallet(walletAddress, { setDefault: true });
      const credited = wallet.addCoins(250, 'tool-completed', 'e2e settlement seed');
      const settled = wallet.spend(75, 'e2e settlement');
      const history = wallet.getHistory();
      const snapshot = wallet.getPoolSnapshot({
        collection: [],
        shareCount: 4,
        referralReturns: 2,
        historyCount: history.length,
      });

      return {
        credited,
        settled,
        balance: wallet.getBalance(),
        historyLength: history.length,
        snapshot,
      };
    }, WALLET_ADDRESS);

    expect(result.credited).toBe(250);
    expect(result.settled).toBe(true);
    expect(result.balance).toBe(175);
    expect(result.historyLength).toBeGreaterThanOrEqual(2);
    expect(result.snapshot).toMatchObject({
      policy: expect.any(Object),
      pooledTotal: expect.any(Number),
      estimatedClaims: expect.any(Object),
      estimatedShares: expect.any(Object),
    });
    expect(result.snapshot.estimatedClaims).toMatchObject({
      gamer: expect.any(Number),
      creator: expect.any(Number),
      referral: expect.any(Number),
      nft: expect.any(Number),
    });
  });

  test('claim lifecycle helper resolves published and swept states', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const claims = await import('/assets/js/utils/claims.js');
      return {
        published: claims.describeClaimLifecycle(
          { latestEpoch: { status: 'published', remainder_amount: '0' } },
          { status: 'published' }
        ),
        swept: claims.describeClaimLifecycle(
          { latestEpoch: { status: 'swept', remainder_amount: '500' } },
          { status: 'swept' }
        )
      };
    });

    expect(result.published.label).toBe('Published');
    expect(result.swept.label).toBe('Swept');
    expect(result.swept.detail).toContain('500 EonLite');
  });

  test('lootbox pending rewards can be claimed into the collection', async ({ page }) => {
    const result = await page.evaluate(async () => {
      await import('/assets/js/utils/wallet.js');
      await import('/assets/js/utils/lootbox.js');

      const lootbox = window.EonLootbox;
      const startCollection = lootbox.getCollection().length;
      const reward = lootbox.awardItem(
        { id: 'e2e-lootbox-reward', name: 'E2E Lootbox Reward', rarity: 'rare', category: 'artifact' },
        { pending: true }
      );

      const pendingBefore = lootbox.pendingCount();
      const claimed = lootbox.claimPending(10);
      const pendingAfter = lootbox.pendingCount();
      const collection = lootbox.getCollection();

      return {
        rewardId: reward.id,
        startCollection,
        pendingBefore,
        claimedCount: claimed.length,
        pendingAfter,
        collectionHasReward: collection.some((item) => item.id === reward.id),
        collectionDelta: collection.length - startCollection
      };
    });

    expect(result.rewardId).toBe('e2e-lootbox-reward');
    expect(result.pendingBefore).toBe(1);
    expect(result.claimedCount).toBe(1);
    expect(result.pendingAfter).toBe(0);
    expect(result.collectionHasReward).toBe(true);
    expect(result.collectionDelta).toBeGreaterThanOrEqual(1);
  });
});
