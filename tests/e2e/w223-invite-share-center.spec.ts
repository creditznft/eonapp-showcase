import { test, expect } from '@playwright/test';

const DRAFTS_KEY = 'eon:share:drafts:v1';
const CAMPAIGN_KEY = 'eon:share:campaign-intent:v1';

test.describe('W223 Invite & Share Center', () => {
  test('creates a signed City invite and stores only a local reusable campaign draft', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    await page.locator('[data-eon-header-share]').click();
    const dialog = page.getByRole('dialog', { name: 'Share Command Center' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Everything is review-first; private work stays private/i)).toBeVisible();
    await dialog.getByRole('tab', { name: 'EON City' }).click();
    const link = dialog.getByLabel('Generated signed invite link');
    await expect(link).toHaveValue(/\/r\/#eon2\./);
    await dialog.locator('[data-eon-share-label]').fill('City launch invite');
    await dialog.locator('[data-eon-share-message]').fill('Explore EON City with me in EONAPP.');
    await dialog.getByRole('button', { name: 'Save local draft' }).click();
    await expect(page.getByText(/Local campaign draft saved\. It will not post automatically\./i)).toBeVisible();

    const storage = await page.evaluate(({ draftsKey, campaignKey }) => ({
      drafts: JSON.parse(localStorage.getItem(draftsKey) || '{}'),
      campaign: localStorage.getItem(campaignKey)
    }), { draftsKey: DRAFTS_KEY, campaignKey: CAMPAIGN_KEY });
    expect(storage.drafts.drafts).toHaveLength(1);
    expect(storage.drafts.drafts[0].type).toBe('city');
    expect(storage.drafts.drafts[0].url).toMatch(/\/r\/#eon2\./);
    expect(storage.campaign).toBeNull();

    await dialog.getByRole('button', { name: 'Build a viral share kit with EONBOT' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#chat-input')).toHaveValue(/Create a clear organic sharing kit for EONAPP/i);
    const campaign = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), CAMPAIGN_KEY);
    expect(campaign.activeRewards).toBe(false);
    expect(campaign.activePayouts).toBe(false);
    expect(campaign.automatedPosting).toBe(false);
  });

  test('Profile opens the same Share Center and never exposes a chat-sharing control', async ({ page }) => {
    await page.goto('/profile');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Open EON Share' }).click();
    const dialog = page.getByRole('dialog', { name: 'Share Command Center' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'EONAPP' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'My Realm' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Share EONAPP' })).toHaveCount(0);
    await expect(dialog.getByText(/Everything is review-first; private work stays private/i)).toBeVisible();
  });
});
