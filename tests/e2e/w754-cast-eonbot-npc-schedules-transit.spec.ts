import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W754 cast, EONBOT, NPC schedule and transit proof.',
  dataCustody: 'All movement is local presentation; travel remains separately reviewed and explicitly confirmed.'
};

type Runtime = {
  getRuntimeSummary?: () => any;
  getCastNpcTransitPlan?: () => any;
  listTransitDestinations?: () => Array<{ id: string }>;
  requestTransit?: (id: string, options: { explicitUserAction: boolean; fromDistrictId: string }) => any;
  confirmTransit?: (token: string, options: { explicitUserAction: boolean; choice: 'board' | 'skip' }) => any;
  getTransitState?: () => any;
};

async function boot(page) {
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity?release=w754-cast-eonbot-npc-transit', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

test('W754 exposes one complete cast, safe schedules and a non-blocking companion contract', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);
  const proof = await page.evaluate(() => {
    const runtime: Runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
    return { plan: runtime.getCastNpcTransitPlan?.(), summary: runtime.getRuntimeSummary?.() };
  });
  expect(proof.plan?.validation?.ok).toBe(true);
  expect(proof.plan?.cast?.slots?.length).toBe(12);
  expect(proof.plan?.cast?.stationRoleCount).toBe(9);
  expect(proof.plan?.schedules?.scheduleCount).toBe(9);
  expect(proof.plan?.schedules?.uniqueCollisionLayers).toBe(true);
  expect(proof.summary?.castNpcTransit?.uniqueCapsuleCount).toBe(1);
  expect(proof.summary?.castNpcTransit?.capsuleForwardAxis).toBe('+x');
  expect(proof.summary?.eonbot?.presentation).toBeTruthy();
  expect(pageErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('w754-high-detail-cast.png'), fullPage: false });
  const file = testInfo.outputPath('w754-cast-schedule-proof.json');
  await fs.writeFile(file, JSON.stringify({ schema: 'eonapp.w754.cast-schedule-browser-proof.v1', ...proof, pageErrors }, null, 2));
  await testInfo.attach('w754-cast-schedule-proof', { path: file, contentType: 'application/json' });
});

test('W754 Board and Skip are explicit and animate the same unique forward-calibrated capsule', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  await boot(page);
  const result = await page.evaluate(() => {
    const runtime: Runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
    const destination = runtime.listTransitDestinations?.().find((entry) => entry.id !== 'orientation-hall');
    const denied = runtime.requestTransit?.(destination?.id || '', { explicitUserAction: false, fromDistrictId: 'orientation-hall' });
    const review = runtime.requestTransit?.(destination?.id || '', { explicitUserAction: true, fromDistrictId: 'orientation-hall' });
    const board = runtime.confirmTransit?.(review?.token || '', { explicitUserAction: true, choice: 'board' });
    return { denied, review, board, state: runtime.getTransitState?.() };
  });
  expect(result.denied?.reason).toBe('explicit-user-action-required');
  expect(result.review?.reviewRequired).toBe(true);
  expect(result.review?.choices).toEqual(['board', 'skip']);
  expect(result.board?.ok).toBe(true);
  expect(result.board?.state?.uniqueCapsuleCount).toBe(1);
  expect(result.board?.state?.pose?.forwardAxis).toBe('+x');
  expect(result.board?.receipt?.routeOpened).toBe(false);
  expect(result.board?.receipt?.workExecuted).toBe(false);
  await page.waitForTimeout(500);
  await page.screenshot({ path: testInfo.outputPath('w754-board-capsule.png'), fullPage: false });
});
