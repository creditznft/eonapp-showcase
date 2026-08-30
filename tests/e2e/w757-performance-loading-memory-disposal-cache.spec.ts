import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W757 performance and reliability proof.',
  dataCustody: 'Performance observation remains local and excludes private work.'
};

test('W757 records first playable and local reliability state without self-certifying', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.goto('/eoncity?release=w757-performance-reliability', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getPerformanceReliabilityPlan?.().snapshot?.observation?.firstFrameMs !== null), null, { timeout: 30_000 });
  const proof = await page.evaluate(() => {
    const runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
    const report = runtime.getPerformanceReliabilityPlan();
    const memory = runtime.capturePerformanceMemory({ explicitUserAction: true });
    return {
      schema: report.schema,
      firstFrameMs: report.snapshot.observation.firstFrameMs,
      fps: report.snapshot.observation.estimatedFps,
      contextLost: report.snapshot.observation.contextLost,
      automaticallyCertified: report.snapshot.automaticallyCertified,
      headedEvidenceRequired: report.snapshot.headedEvidenceRequired,
      memoryLocalOnly: memory.localOnly
    };
  });
  expect(proof.firstFrameMs).not.toBeNull();
  expect(proof.automaticallyCertified).toBe(false);
  expect(proof.headedEvidenceRequired).toBe(true);
  expect(proof.memoryLocalOnly).toBe(true);
  const file = testInfo.outputPath('w757-performance-reliability-proof.json');
  await fs.writeFile(file, JSON.stringify(proof, null, 2));
  await testInfo.attach('w757-performance-reliability-proof', { path: file, contentType: 'application/json' });
});
