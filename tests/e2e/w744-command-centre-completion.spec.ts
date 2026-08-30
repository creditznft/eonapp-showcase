import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1',
  mode: 'authenticated-play',
  accessState: 'authorized',
  requiresIdentity: true,
  identityAvailable: true,
  signedIn: true,
  canBootFullCity: true,
  heavyRuntimeImportAllowed: true,
  staticPortalOnly: false,
  publicPreviewAvailable: false,
  browserGateOnly: true,
  clientFirstStaticAssetDelivery: true,
  pagesFunctionAssetRelayAllowed: false,
  edgeAssetProtectionConfigured: false,
  edgeAssetProtectionRequiredBeforeBinaryArt: false,
  reason: 'Local W744 Command Centre completion proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

type W744Summary = {
  runtimeProvenance?: string;
  stationCount?: number;
  visibleFrameGate?: {
    authoredEnvironmentRequired?: number;
    authoredEnvironmentReady?: number;
    authoredHeroCharactersRequired?: number;
    authoredHeroCharactersReady?: number;
    heroFallbacksReady?: boolean;
    gateComplete?: boolean;
    degraded?: boolean;
    hardTimeoutMs?: number;
  };
  stationCompletion?: {
    blueprintCount?: number;
    interactionTriads?: boolean;
    commandStatusCharacter?: string;
    rejectedArchitectActive?: boolean;
  };
  characterMotion?: {
    stationNpcLocomotionAllowed?: boolean;
    stationNpcBoundedMicroRoutes?: boolean;
    stationNpcWalkingInPlace?: boolean;
    maintenanceWorkerBoundedRoute?: boolean;
  };
  commandCentreDesign?: {
    microchipCircuitFloor?: boolean;
    circuitNodeCount?: number;
    boundedPointLights?: number;
    stationBeacons?: number;
    transportCapsuleAmbient?: boolean;
    authoredStreetLampInstances?: number;
    allReadyWorldAssetsAssigned?: boolean;
    atmosphericDepth?: boolean;
    themeAwareExposure?: number;
  };
  nexus3d?: {
    centralGenesisCore?: boolean;
    terminal?: boolean;
    commandSeat?: boolean;
    eonbotDock?: boolean;
    interactionParts?: string[];
  };
  oneEngine?: boolean;
  oneScene?: boolean;
  oneRenderLoop?: boolean;
};

type CityRuntime = {
  getRuntimeSummary?: () => W744Summary;
  openStation?: (stationId: string, options: { explicitUserAction: boolean }) => unknown;
  guideToStation?: (stationId: string, options?: { explicitUserAction?: boolean }) => unknown;
};

async function boot(page) {
  await page.route('**/api/city/access', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-play-session[data-eon-city-command-hub="w737"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 15_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME)), { timeout: 20_000 }).toBe(true);
}

test('W744 proves complete stations, premium Command Centre, corrected Status and review-first menu', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);

  await expect.poll(async () => page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.visibleFrameGate?.gateComplete === true;
  }), { timeout: 30_000 }).toBe(true);

  const summary = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(summary?.runtimeProvenance).toBe('eon-city-living-nexus-command-core-w757-1');
  expect(summary?.visibleFrameGate?.gateComplete).toBe(true);
  expect(summary?.visibleFrameGate?.authoredEnvironmentRequired).toBe(5);
  expect(summary?.visibleFrameGate?.authoredHeroCharactersRequired).toBe(2);
  expect(summary?.visibleFrameGate?.heroFallbacksReady).toBe(true);
  expect(summary?.visibleFrameGate?.hardTimeoutMs).toBe(12_000);
  if (summary?.visibleFrameGate?.degraded === false) {
    expect(summary?.visibleFrameGate?.authoredEnvironmentReady).toBe(5);
    expect(summary?.visibleFrameGate?.authoredHeroCharactersReady).toBe(2);
  }
  expect(summary?.stationCount).toBe(10);
  expect(summary?.stationCompletion?.blueprintCount).toBe(10);
  expect(summary?.stationCompletion?.interactionTriads).toBe(true);
  expect(summary?.stationCompletion?.commandStatusCharacter).toBe('security-sentinel');
  expect(summary?.stationCompletion?.rejectedArchitectActive).toBe(false);
  expect(summary?.characterMotion?.stationNpcLocomotionAllowed).toBe(true);
  expect(summary?.characterMotion?.stationNpcBoundedMicroRoutes).toBe(true);
  expect(summary?.characterMotion?.stationNpcWalkingInPlace).toBe(false);
  expect(summary?.characterMotion?.maintenanceWorkerBoundedRoute).toBe(true);
  expect(summary?.commandCentreDesign?.microchipCircuitFloor).toBe(true);
  expect(summary?.commandCentreDesign?.circuitNodeCount || 0).toBeGreaterThan(25);
  expect(summary?.commandCentreDesign?.boundedPointLights).toBe(4);
  expect(summary?.commandCentreDesign?.stationBeacons || 0).toBeGreaterThanOrEqual(30);
  expect(summary?.commandCentreDesign?.transportCapsuleAmbient).toBe(true);
  expect(summary?.commandCentreDesign?.allReadyWorldAssetsAssigned).toBe(true);
  expect(summary?.commandCentreDesign?.atmosphericDepth).toBe(true);
  expect(summary?.commandCentreDesign?.themeAwareExposure || 0).toBeGreaterThanOrEqual(1);
  if (summary?.visibleFrameGate?.degraded === false) {
    expect(summary?.commandCentreDesign?.authoredStreetLampInstances).toBe(8);
  }
  expect(summary?.nexus3d?.centralGenesisCore).toBe(true);
  expect(summary?.nexus3d?.terminal).toBe(true);
  expect(summary?.nexus3d?.commandSeat).toBe(true);
  expect(summary?.nexus3d?.eonbotDock).toBe(true);
  expect(summary?.nexus3d?.interactionParts).toEqual(['structure', 'terminal', 'npc']);
  expect(summary?.oneEngine).toBe(true);
  expect(summary?.oneScene).toBe(true);
  expect(summary?.oneRenderLoop).toBe(true);

  await page.locator('[data-eon-city-menu-open]').click();
  const menu = page.locator('[data-eon-city-command-menu]');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-eon-city-featured="signal-frontier"]')).toContainText('Signal Frontier');
  await expect(menu.locator('[data-eon-city-featured="storm-sector"]')).toContainText('Storm Sector');
  await expect(menu.locator('[data-eon-city-featured="my-frontier"]')).toContainText('My Frontier');
  await expect(menu.locator('[data-eon-city-quick="share"]')).toHaveText('Share Command Center');
  await expect(menu.locator('[data-eon-city-quick="capture"]')).toHaveText('Creator Capture');
  await expect(menu.locator('[data-eon-city-quick="plans"]')).toHaveText('Plans & Access');
  await menu.locator('[data-eon-city-menu-close]').click();
  await expect(menu).toBeHidden();

  await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    runtime?.guideToStation?.('command-console', { explicitUserAction: true });
    runtime?.openStation?.('command-console', { explicitUserAction: true });
  });
  const workSurface = page.locator('[data-eon-work-surface-host]');
  await expect(workSurface).toBeVisible({ timeout: 10_000 });
  await expect(workSurface).toHaveAttribute('data-eon-work-surface-id', 'command-status');
  await expect(workSurface.locator('[data-eon-work-surface-title]')).toHaveText('Command Status');
  await expect(workSurface.locator('[data-eon-work-surface-fallback]')).toHaveAttribute('href', '/projects');
  await expect(workSurface.locator('[data-eon-work-surface-main]')).toContainText('Review projects');
  await expect(workSurface.locator('[data-eon-work-surface-main]')).toContainText('Review automations');
  await expect(workSurface.locator('[data-eon-work-surface-main]')).not.toContainText('advanced workspace');
  await workSurface.locator('[data-eon-work-surface-close]').first().click();
  await expect(workSurface).toBeHidden();

  expect(pageErrors).toEqual([]);
  const screenshotPath = testInfo.outputPath('w744-command-centre-completion.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const proofPath = testInfo.outputPath('w744-command-centre-completion-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({
    schema: 'eonapp.w744.command-centre-completion-browser-proof.v1',
    summary,
    commandStatusFallback: '/projects',
    pageErrors
  }, null, 2));
  await testInfo.attach('w744-command-centre-completion-proof', { path: proofPath, contentType: 'application/json' });
});
