import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false, edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'W758 headed hostile evidence fixture.', dataCustody: 'No secrets or private work in evidence.'
};

test('W758 candidate exposes one current runtime, ten stations and blocked-until-evidence reliability truth', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.route('**/api/city/access', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/eoncity?release=w758-hostile-red-team', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await page.waitForFunction(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.()), null, { timeout: 30_000 });
  const proof = await page.evaluate(() => {
    const runtime = (globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME;
    const summary = runtime.getRuntimeSummary();
    const reliability = runtime.getPerformanceReliabilityPlan();
    return {
      runtimeSchema: summary.schema,
      runtimeProvenance: summary.runtimeProvenance,
      oneEngine: summary.oneEngine,
      oneScene: summary.oneScene,
      oneRenderLoop: summary.oneRenderLoop,
      stationCount: summary.stations?.length,
      firstFrameMs: reliability.snapshot.observation.firstFrameMs,
      automaticallyCertified: reliability.snapshot.automaticallyCertified
    };
  });
  expect(proof.runtimeProvenance).toBe('eon-city-living-nexus-command-core-w757-1');
  expect(proof.oneEngine).toBe(true);
  expect(proof.oneScene).toBe(true);
  expect(proof.oneRenderLoop).toBe(true);
  expect(proof.stationCount).toBe(10);
  expect(proof.automaticallyCertified).toBe(false);
  const path = testInfo.outputPath('w758-headed-smoke-proof.json');
  await fs.writeFile(path, JSON.stringify({ proof, consoleErrors }, null, 2));
  await testInfo.attach('w758-headed-smoke-proof', { path, contentType: 'application/json' });
});
