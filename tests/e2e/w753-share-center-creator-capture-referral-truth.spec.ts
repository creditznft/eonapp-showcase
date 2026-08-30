import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W753 Share Center 2.0, Creator Capture and referral truth proof.',
  dataCustody: 'Only signed public links and one bounded local reviewed-handoff receipt are projected.'
};

type Runtime = {
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => { ok?: boolean };
  getMissionsProgression?: () => { claimableCount?: number; claimedCount?: number; xp?: number; missions?: Array<{ stationId?: string; state?: string; claimable?: boolean }> };
};

async function boot(page, viewport = { width: 1440, height: 900 }, referralBody: Record<string, unknown> = {}) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.route('**/api/referrals', async (route) => route.fulfill({
    status: Number(referralBody.httpStatus || 503),
    contentType: 'application/json',
    headers: { 'cache-control': 'no-store' },
    body: JSON.stringify({
      ok: false, active: false, signedIn: true, statusState: 'unavailable', endpoint: '/api/referrals',
      referenceCode: 'w753-browser-referral-unavailable', checkedAt: '2026-07-29T15:30:00.000Z',
      authority: { endpoint: '/api/referrals', databaseMode: 'unavailable', databaseBinding: 'EON_REFERRALS_DB', serverRole: 'server-authoritative-referral-ledger' },
      error: 'referral_status_unavailable',
      ...referralBody
    })
  }));
  await page.setViewportSize(viewport);
  await page.goto('/eoncity?release=w753-share-capture-referral-truth', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

async function openShareStation(page) {
  const opened = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.openStation?.('share-capture', { explicitUserAction: true }) || null);
  expect(opened?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  return host;
}

test('W753 keeps Share Center 2.0 inside City Dock and exposes unavailable referral truth without blocking sharing', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);
  const host = await openShareStation(page);
  const center = host.locator('[data-eon-share-center-schema="eon.share-command-center.w753.v1"]');
  await expect(center).toBeVisible();
  await expect(center).toContainText('Share Command Center 2.0');
  await expect(center.locator('[data-eon-share-target="city"]')).toHaveAttribute('aria-selected', 'true');
  await expect(center.locator('[data-eon-share-link]')).toHaveValue(/\/eoncity/);
  await expect(center.locator('[data-eon-share-copy]')).toBeEnabled();
  await expect(center.locator('[data-eon-share-platform="whatsapp"]')).toBeEnabled();
  await expect(center.locator('[data-eon-share-download-qr]')).toBeEnabled();
  await expect(center.locator('[data-eon-share-city-capture]')).toBeVisible();
  await expect(center.locator('[data-eon-referral-pill]')).toHaveText('Unavailable');
  await expect(center.locator('[data-eon-referral-reference]')).toContainText('/api/referrals');
  await expect(center.locator('[data-eon-referral-reference]')).toContainText('w753-browser-referral-unavailable');
  await expect(page.locator('[data-eon-share-sheet]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('w753-share-center-dock-unavailable.png'), fullPage: false });

  await center.locator('[data-eon-share-review-confirm]').check();
  await center.locator('[data-eon-share-review-receipt]').click();
  await expect(center.locator('[data-eon-share-review-status]')).toContainText('Reviewed handoff verified');
  const progression = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.getMissionsProgression?.() || null);
  expect(progression?.claimableCount).toBe(1);
  expect(progression?.missions?.find((mission) => mission.stationId === 'share-capture')?.claimable).toBe(true);
  const panel = host.locator('[data-eon-w752-progression="share-capture"]');
  await panel.locator('[data-eon-w752-claim="share-capture"]').click();
  await expect(panel).toContainText('Mission claimed');
  const claimed = await page.evaluate(() => (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: Runtime }).EON_CITY_COMMAND_HUB_RUNTIME?.getMissionsProgression?.() || null);
  expect(claimed?.claimedCount).toBe(1);
  expect(claimed?.xp).toBe(120);
  expect(pageErrors).toEqual([]);
  const proof = testInfo.outputPath('w753-share-receipt-proof.json');
  await fs.writeFile(proof, JSON.stringify({ schema: 'eonapp.w753.share-browser-proof.v1', progression, claimed, pageErrors }, null, 2));
  await testInfo.attach('w753-share-receipt-proof', { path: proof, contentType: 'application/json' });
});

test('W753 Creator Capture opens in the same mobile Dock with microphone off and local-only review controls', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page, { width: 390, height: 844 }, { httpStatus: 200, ok: true, active: false, signedIn: true, statusState: 'inactive', referenceCode: 'referral-programme-inactive' });
  const host = await openShareStation(page);
  await host.locator('[data-eon-share-capture]').click();
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  const capture = host.locator('[data-capture-form]');
  await expect(capture).toBeVisible();
  await expect(capture.locator('input[name="microphone"]')).not.toBeChecked();
  await expect(capture.locator('input[name="facecam"]')).not.toBeChecked();
  await expect(capture.locator('[data-capture-start]')).toBeVisible();
  await expect(capture.locator('[data-capture-save]')).toHaveText('Save WebM');
  await expect(host).toContainText('Nothing uploads or posts automatically');
  await expect(page.locator('[data-eon-share-sheet]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('w753-creator-capture-mobile-dock.png'), fullPage: false });
});
