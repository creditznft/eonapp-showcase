import { test, expect } from '@playwright/test';

const CITY_KEY = 'eon:city:world-state:v1';
const CITY_PROOF_KEY = 'eon:city:play:w249:local-proof:v1';
const AUTH_STORAGE_STATE = String(process.env.EONAPP_W649_AUTH_STORAGE_STATE || '').trim();

test.describe('W231 flagship EON City', () => {
  // The unconditional historical canvas contract is superseded by W649's real-session boundary.
  test.use({ storageState: AUTH_STORAGE_STATE || undefined });
  test.skip(!AUTH_STORAGE_STATE, 'Pending real authenticated owner-browser evidence.');

  test('normal direct entry keeps the City readable and hides evidence-only controls', async ({ page }) => {
    await page.goto('/eoncity?focus=objective');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Start here' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Command Deck' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(page.locator('[data-eon-play-objective-panel]')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Save local frame note' })).toHaveCount(0);
    await expect(page.locator('[data-eon-play-landmark-panel]')).toBeHidden();

    const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), CITY_KEY);
    expect(state.version).toBe(2);
    expect(state.progress.activeObjective).toBe('first-circuit');
    expect(state.progress.completedObjectives).toContain('visit-command-centre');
    expect(state.navigation.currentMode).toBe('immersive-work');

    await expect(page.getByRole('button', { name: /Buy|Checkout|Withdraw|Claim|Subscribe|Redeem/i })).toHaveCount(0);
  });

  test('explicit preview mode retains local-only frame evidence without putting it in normal play', async ({ page }) => {
    await page.goto('/eoncity?preview=1');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Save local frame note' })).toBeVisible();
    await page.getByRole('button', { name: 'Save local frame note' }).click();

    const proofs = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), CITY_PROOF_KEY);
    expect(proofs).toHaveLength(1);
    expect(proofs[0].summary.remoteTelemetry).toBe(false);
    expect(proofs[0].summary.remoteAssets).toBe(false);
  });

  test('keeps legacy deep-link queries on the canonical City surface without auto-opening a second app surface', async ({ page }) => {
    await page.goto('/eoncity?target=workspace');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/eoncity?target=workspace');

    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Command Deck' })).toBeVisible();
    await expect(page.locator('[data-eon-play-objective-panel]')).toBeHidden();
    await expect(page.getByRole('link', { name: /Open Workspace/i })).toHaveCount(0);

    const state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), CITY_KEY);
    expect(state.navigation.currentMode).toBe('immersive-work');
    expect(state.featureFlags.localOnly).toBe(true);
    expect(state.progress.activeObjective).toBe('first-circuit');
  });
});
