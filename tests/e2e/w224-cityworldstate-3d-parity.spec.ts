import { test, expect } from '@playwright/test';

const CITY_WORLD_STATE_KEY = 'eon:city:world-state:v1';
const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W224 optional 3D City parity', () => {
  // W649 makes renderer access identity-backed; an unsigned test must remain evidence-pending.
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  test('keeps /eoncity canonical and resolves the retired /eoncity/3d alias back to the same local City state', async ({ page }) => {
    await page.addInitScript(({ worldKey }) => {
      localStorage.clear();
      localStorage.setItem(worldKey, JSON.stringify({
        version: 2,
        worldId: 'w224-browser-city',
        citySeed: 'w224-browser-seed',
        avatar: { name: 'Browser Operator', x: 0.5, y: 0.58, appearance: 'classic' },
        realmAppearance: { palette: 'aurora', landmark: 'realm' },
        unlockedDistricts: ['command', 'market'],
        progress: {
          activeObjective: 'first-circuit',
          completedObjectives: ['visit-command-centre'],
          lastDistrictId: 'market',
          visitCounts: { command: 1, market: 2 }
        },
        featureFlags: { city2d: true, optional3d: true, localOnly: true }
      }));
    }, { worldKey: CITY_WORLD_STATE_KEY });

    await page.goto('/eoncity/3d');
    await expect(page).toHaveURL(/\/eoncity$/);
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-eon-city-3d-root]')).toHaveCount(0);
    await expect(page.locator('body')).toContainText(/FIRST CIRCUIT · ROUTE REVIEW/i);
    await expect(page.locator('body')).not.toContainText(/buy now|cash out|payout/i);

    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), CITY_WORLD_STATE_KEY);
    expect(stored.worldId).toBe('w224-browser-city');
    expect(stored.featureFlags.optional3d).toBe(true);
    expect(stored.featureFlags.localOnly).toBe(true);
  });
});
