import { test, expect } from '@playwright/test';

const REALM_KEY = 'eon:realm:state:v3';
const LEGACY_REALM_KEY = 'eon:realm:profile:v2';
const CITY_KEY = 'eon:city:world-state:v1';
const MARKET_KEY = 'eon:market:private-drop:v3';

test.describe('W222 My Realm MVP', () => {
  test('creates a local City-linked Realm, keeps a private showcase local, and issues a signed identity link', async ({ page }) => {
    await page.addInitScript(({ marketKey }) => {
      localStorage.clear();
      localStorage.setItem('eon:profile:v1', JSON.stringify({ displayName: 'Maya Studio', username: 'maya-studio' }));
      localStorage.setItem(marketKey, JSON.stringify({
        schema: 'eon.market.private-drop.v3',
        items: [
          { id: 'private-v3-maya1-neon-archive', title: 'Maya Preview One', imageUri: '' },
          { id: 'private-v3-maya2-neon-archive', title: 'Maya Preview Two', imageUri: '' }
        ]
      }));
    }, { marketKey: MARKET_KEY });

    await page.goto('/realm-studio');
    await expect(page.locator('h1.eon-hub-title')).toHaveText('My Realm');
    await expect(page.getByText(/Portable identity, not a public marketplace/i)).toBeVisible();
    await page.locator('#realm-studio-label').fill('Maya City Archive');
    await page.locator('#realm-studio-handle').fill('maya-city');
    await page.locator('#realm-studio-theme').selectOption('aurora');
    await page.locator('#realm-studio-entry').selectOption('market');
    await page.locator('[data-realm-showcase-ref]').first().check();
    await page.getByRole('button', { name: 'Save My Realm locally' }).click();
    await expect(page.getByText(/saved locally and linked to CityWorldState/i)).toBeVisible();

    const state = await page.evaluate(({ realmKey, cityKey }) => ({
      realm: JSON.parse(localStorage.getItem(realmKey) || '{}'),
      city: JSON.parse(localStorage.getItem(cityKey) || '{}')
    }), { realmKey: REALM_KEY, cityKey: CITY_KEY });
    expect(state.realm.label).toBe('Maya City Archive');
    expect(state.realm.handle).toBe('maya-city');
    expect(state.realm.showcaseRefs).toEqual(['private-v3-maya1-neon-archive']);
    expect(state.realm.safety.publicPublishingActive).toBe(false);
    expect(state.realm.safety.officialMarketPlacementActive).toBe(false);
    expect(state.realm.safety.affiliateActive).toBe(false);
    expect(state.realm.safety.payoutActive).toBe(false);
    expect(state.city.realmId).toBe(state.realm.id);
    expect(state.city.realmAppearance.palette).toBe('aurora');
    expect(state.city.realmAppearance.landmark).toBe('market');
    expect(JSON.stringify(state.city)).not.toContain('showcaseRefs');

    await page.getByRole('button', { name: 'Create signed Realm link' }).click();
    await expect(page.locator('#realm-studio-url')).toHaveValue(/\/r\/#eon3\./);
    await expect(page.locator('#realm-studio-status')).toContainText(/identity-only|public identity metadata only/i);
    const share = await page.locator('#realm-studio-url').inputValue();
    expect(share).not.toContain('private-v3');
    expect(share).not.toContain('payout');
  });

  test('copies a legacy local Realm once without deleting the original record', async ({ page }) => {
    const legacy = JSON.stringify({
      publicRealmId: 'eonrealm_AQEBAQEBAQEBAQEBAQEBAQ',
      displayName: 'Legacy Realm',
      username: 'legacy-realm',
      theme: 'forest-circuit',
      entryDistrict: 'library',
      apiKey: 'must-not-copy'
    });
    await page.addInitScript(({ legacyKey, legacyValue }) => {
      localStorage.clear();
      localStorage.setItem(legacyKey, legacyValue);
    }, { legacyKey: LEGACY_REALM_KEY, legacyValue: legacy });
    await page.goto('/realm-studio');
    await expect(page.getByText(/earlier local Realm identity was copied/i)).toBeVisible();
    const saved = await page.evaluate(({ realmKey, legacyKey }) => ({
      realm: JSON.parse(localStorage.getItem(realmKey) || '{}'),
      legacy: localStorage.getItem(legacyKey)
    }), { realmKey: REALM_KEY, legacyKey: LEGACY_REALM_KEY });
    expect(saved.realm.label).toBe('Legacy Realm');
    expect(JSON.stringify(saved.realm)).not.toContain('must-not-copy');
    expect(saved.legacy).toBe(legacy);
  });
});
