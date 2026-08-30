import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W752 missions, XP, deterministic Vault Reveals and My Realm proof.',
  dataCustody: 'Only bounded opaque receipts and local cosmetic progression are used.'
};

type Runtime = {
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => { ok?: boolean };
  getMissionsProgression?: () => {
    missionCount?: number; claimedCount?: number; claimableCount?: number; xp?: number; pendingReveals?: number;
    nextReveal?: { id?: string; label?: string } | null;
    deterministicCosmeticsOnly?: boolean; lootBox?: boolean; paidRandomReward?: boolean; streakPunishment?: boolean;
    missions?: Array<{ stationId?: string; state?: string; claimable?: boolean; claimed?: boolean }>;
    myRealm?: { facetCount?: number; claimedCount?: number; privateReflection?: boolean; publicWorldCreated?: boolean; multiplayerEnabled?: boolean };
  };
  getRuntimeSummary?: () => unknown;
};

async function seedReceipts(page) {
  await page.addInitScript(() => {
    localStorage.setItem('eon:city:productive-rpg:w624g:v1', JSON.stringify({
      schema: 'eon.city.productive-rpg-loop.w624g.v1', updatedAt: 752000,
      missions: {
        project: {
          missionId: 'project', state: 'completed', reviewedAt: 751900, startedAt: 751950, updatedAt: 752000, completedAt: 752000, failureCode: '',
          outcome: {
            missionId: 'project', kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:w752-browser',
            verifiedAt: 752000, verified: true, privateContentStored: false, providerCallClaimed: false, generationClaimed: false,
            automationExecutionClaimed: false, backupClaimed: false, restoreClaimed: false, paymentOrRewardClaimed: false
          }
        }
      }
    }));
    localStorage.setItem('eon:city:progression:w659g:v1', JSON.stringify({
      schema: 'eon.city.w659g.progression.v1', updatedAt: 752000, xp: 240, revealProgress: 70, pendingReveals: 0, openedReveals: 0,
      receipts: {
        'city.real-work-receipt:browser-pre-1': { type: 'city.real-work-receipt', receiptId: 'browser-pre-1', verifiedAt: 751000, accepted: true, source: 'browser-proof' },
        'city.real-work-receipt:browser-pre-2': { type: 'city.real-work-receipt', receiptId: 'browser-pre-2', verifiedAt: 751500, accepted: true, source: 'browser-proof' }
      },
      dailyCounts: {}, ownedCosmetics: [], selectedCosmetics: { eonbotSkin: 'command-orbit', captureOverlay: '', cityTheme: '', arrivalEffect: '' }, revealHistory: []
    }));
  });
}

async function boot(page, viewport = { width: 1440, height: 900 }) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.setViewportSize(viewport);
  await seedReceipts(page);
  await page.goto('/eoncity?release=w752-missions-progression', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

async function progression(page) {
  return page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.getMissionsProgression?.() || null);
}

test('W752 claims a genuine mission, awards fixed XP and opens the deterministic next cosmetic', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);
  const before = await progression(page);
  expect(before?.missionCount).toBe(10);
  expect(before?.claimableCount).toBe(1);
  expect(before?.xp).toBe(240);
  expect(before?.deterministicCosmeticsOnly).toBe(true);
  expect(before?.lootBox).toBe(false);
  expect(before?.paidRandomReward).toBe(false);
  expect(before?.streakPunishment).toBe(false);

  const opened = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.('project-atlas', { explicitUserAction: true }) || null);
  expect(opened?.ok).toBe(true);
  const panel = page.locator('[data-eon-w752-progression="project-atlas"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Genuine native receipt is ready');
  await page.screenshot({ path: testInfo.outputPath('w752-project-mission-ready.png'), fullPage: false });
  await panel.locator('[data-eon-w752-claim="project-atlas"]').click();
  await expect(panel).toContainText('360');
  await expect(panel).toContainText('Mission claimed');
  await expect(panel.locator('[data-eon-w752-reveal]')).toContainText('Signal Mist');
  await panel.locator('[data-eon-w752-reveal]').click();
  await expect(panel).toContainText('Forge Prism');
  const after = await progression(page);
  expect(after?.claimedCount).toBe(1);
  expect(after?.xp).toBe(360);
  expect(after?.pendingReveals).toBe(0);
  expect(after?.nextReveal?.id).toBe('forge-prism');
  expect(pageErrors).toEqual([]);
  const proofPath = testInfo.outputPath('w752-mission-reveal-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w752.mission-reveal-browser-proof.v1', before, after, pageErrors }, null, 2));
  await testInfo.attach('w752-mission-reveal-proof', { path: proofPath, contentType: 'application/json' });
});

test('W752 mobile Dock shows one private My Realm reflection without public-world or multiplayer claims', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 });
  const opened = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.('my-realm-portal', { explicitUserAction: true }) || null);
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  const reflection = page.locator('.eon-city-my-realm-reflection');
  await expect(reflection).toBeVisible();
  await expect(reflection).toContainText('Private My Realm reflection');
  await expect(reflection.locator('article')).toHaveCount(5);
  const view = await progression(page);
  expect(view?.myRealm?.facetCount).toBe(5);
  expect(view?.myRealm?.privateReflection).toBe(true);
  expect(view?.myRealm?.publicWorldCreated).toBe(false);
  expect(view?.myRealm?.multiplayerEnabled).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('w752-my-realm-mobile.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(host).toBeHidden();
});
