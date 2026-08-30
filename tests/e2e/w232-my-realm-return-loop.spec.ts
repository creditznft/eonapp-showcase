import { test, expect } from '@playwright/test';

const REALM_KEY = 'eon:realm:state:v3';
const CITY_KEY = 'eon:city:world-state:v1';
const RECEIPT_KEY = 'eon:eonbot:action-receipts:v1';
const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W232 My Realm return loop and EONBOT City receipt', () => {
  // A Realm-to-City renderer proof needs a genuine owner browser session; do not fabricate one.
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  test('saves a local Realm landmark, carries it into City state, and keeps the receipt review-only', async ({ page }) => {
    await page.goto('/realm-studio');
    await page.evaluate((receiptKey) => {
      localStorage.clear();
      localStorage.setItem('eon:profile:v1', JSON.stringify({ displayName: 'Maya Studio', username: 'maya-studio' }));
      const now = new Date().toISOString();
      localStorage.setItem(receiptKey, JSON.stringify([{
        version: 1,
        id: 'eonact_w232route12345',
        actionId: 'return-to-my-realm',
        actionType: 'city-guidance',
        route: '/eoncity?target=realm&return=realm',
        destination: '/eoncity?target=realm&return=realm',
        targetDistrictId: 'realm',
        focusObjective: false,
        status: 'user-tapped',
        completed: false,
        externalEffect: false,
        createdAt: now,
        updatedAt: now
      }]));
    }, RECEIPT_KEY);
    await page.reload();
    await page.locator('#realm-studio-label').fill('Maya Quiet Garden');
    await page.locator('#realm-studio-handle').fill('maya-quiet');
    await page.locator('#realm-studio-landmark').selectOption('garden');
    await page.getByRole('button', { name: 'Save My Realm locally' }).click();
    await expect(page.locator('#realm-studio-preview')).toContainText(/Circuit Garden/i);

    await page.goto('/eoncity?target=realm&return=realm');
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Command Deck' })).toBeVisible();

    const state = await page.evaluate(({ realmKey, cityKey, receiptKey }) => ({
      realm: JSON.parse(localStorage.getItem(realmKey) || '{}'),
      city: JSON.parse(localStorage.getItem(cityKey) || '{}'),
      receipts: JSON.parse(localStorage.getItem(receiptKey) || '[]')
    }), { realmKey: REALM_KEY, cityKey: CITY_KEY, receiptKey: RECEIPT_KEY });
    expect(state.realm.landmark).toBe('garden');
    expect(state.realm.returnLoop.returnCount).toBe(0);
    expect(state.city.realmAppearance.landmarkStyle).toBe('garden');
    expect(state.city.navigation.lastTransition.fromMode).toBe('realm-studio');
    expect(state.receipts[0].status).toBe('user-tapped');
    expect(state.receipts[0].externalEffect).toBe(false);
    expect(JSON.stringify(state)).not.toMatch(/rewardBalance|poolPoints|token conversion|payout balance/i);
    await expect(page.getByRole('button', { name: /Buy|Claim|Redeem|Withdraw|Subscribe/i })).toHaveCount(0);
  });
});
