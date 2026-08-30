import { test, expect } from '@playwright/test';

const CITY_KEY = 'eon:city:world-state:v1';
const LEGACY_CITY_KEY = 'eon:operator-map:state:v1';
const CITY_PROOF_KEY = 'eon:city:play:w249:local-proof:v1';
const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W221 CityWorldState 2D RPG vertical slice', () => {
  // W649 supersedes the historical unsigned-renderer expectation. Never synthesize
  // browser identity; this lane awaits a real authenticated owner-browser state.
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  test('creates a local City, boots the canonical Babylon direct-entry surface, and keeps proof local-only', async ({ page }) => {
    await page.goto('/eoncity');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const canvas = page.locator('[data-eon-play-canvas-host] canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-eon-play-objective]')).toContainText(/Find a district signal/i);
    await expect(page.getByRole('button', { name: 'Start here' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Command Deck' })).toBeVisible();
    await expect(page.locator('body')).toContainText(/FIRST COMMAND ROUTE · LOCAL ONLY/i);

    const initial = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), CITY_KEY);
    expect(initial.version).toBe(2);
    expect(initial.progress.activeObjective).toBe('first-circuit');
    expect(initial.progress.completedObjectives).toContain('visit-command-centre');
    expect(initial.navigation.currentMode).toBe('immersive-work');
    expect(initial.featureFlags.localOnly).toBe(true);

    await page.getByRole('button', { name: 'Save local frame note' }).click();
    const proofs = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), CITY_PROOF_KEY);
    expect(proofs).toHaveLength(1);
    expect(proofs[0].summary.remoteTelemetry).toBe(false);
    expect(proofs[0].summary.remoteAssets).toBe(false);

    await expect(page.getByRole('button', { name: /Buy|Checkout|Withdraw|Claim|Trade/i })).toHaveCount(0);
  });

  test('copies a legacy City preference only into the new local state and keeps the legacy record untouched', async ({ page }) => {
    const legacy = JSON.stringify({
      worldId: 'city-e2e-legacy',
      avatar: { name: 'Legacy Operator', x: 0.22, y: 0.22, apiKey: 'must-not-copy' },
      progress: { lastDistrictId: 'command', privateChat: 'must-not-copy' },
      vaultSecret: 'must-not-copy'
    });
    await page.addInitScript(({ legacyKey, value }) => {
      localStorage.clear();
      localStorage.setItem(legacyKey, value);
    }, { legacyKey: LEGACY_CITY_KEY, value: legacy });
    await page.goto('/eoncity');

    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    const state = await page.evaluate(({ cityKey, legacyKey }) => ({
      city: JSON.parse(localStorage.getItem(cityKey) || '{}'),
      legacy: localStorage.getItem(legacyKey)
    }), { cityKey: CITY_KEY, legacyKey: LEGACY_CITY_KEY });
    expect(state.city.worldId).toBe('city-e2e-legacy');
    expect(state.city.avatar.name).toBe('Legacy Operator');
    expect(JSON.stringify(state.city)).not.toContain('must-not-copy');
    expect(state.legacy).toBe(legacy);
  });
});
