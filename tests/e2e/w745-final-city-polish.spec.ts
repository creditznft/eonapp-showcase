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
  reason: 'Local W745 final City polish proof.',
  dataCustody: 'No account, project, Vault, provider, prompt or file data is used.'
};

type Presentation = {
  companionState?: string;
  playerIdleState?: string;
  maxScoutDistanceFromPlayer?: number;
  companionDistanceFromPlayer?: number;
  automaticStationActivation?: boolean;
  automaticNavigation?: boolean;
  automaticDocking?: boolean;
  autonomousAgent?: boolean;
  localVisualOnly?: boolean;
};

type CitySummary = {
  runtimeProvenance?: string;
  visibleFrameGate?: { gateComplete?: boolean };
  eonbot?: { presentation?: Presentation; schema?: string };
  characterMotion?: {
    playerNonStaticIdle?: boolean;
    playerIdleModes?: string[];
    eonbotPublicScouting?: boolean;
    eonbotStationHostGreetings?: boolean;
    eonbotPlayfulLoops?: boolean;
    eonbotVisualDockVisits?: boolean;
    eonbotCompanionModes?: string[];
    eonbotAutomaticStationActivation?: boolean;
    eonbotAutonomousAgent?: boolean;
  };
  commandCentreDesign?: {
    microchipCircuitFloor?: boolean;
    animatedCircuitPulseCount?: number;
  };
  stationCompletion?: { interactionTriads?: boolean; blueprintCount?: number };
  nexus3d?: { centralGenesisCore?: boolean; terminal?: boolean; commandSeat?: boolean; eonbotDock?: boolean };
};

type CityRuntime = { getRuntimeSummary?: () => CitySummary };

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

test('W745 proves living Pathfinder idle, varied EONBOT curiosity and final Command Centre authority', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  await boot(page);

  await expect.poll(async () => page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.visibleFrameGate?.gateComplete === true;
  }), { timeout: 30_000 }).toBe(true);

  const initial = await page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.() || null;
  });
  expect(initial?.runtimeProvenance).toBe('eon-city-living-nexus-command-core-w757-1');
  expect(initial?.stationCompletion?.blueprintCount).toBe(10);
  expect(initial?.stationCompletion?.interactionTriads).toBe(true);
  expect(initial?.nexus3d?.centralGenesisCore).toBe(true);
  expect(initial?.nexus3d?.terminal).toBe(true);
  expect(initial?.nexus3d?.commandSeat).toBe(true);
  expect(initial?.nexus3d?.eonbotDock).toBe(true);
  expect(initial?.commandCentreDesign?.microchipCircuitFloor).toBe(true);
  expect(initial?.commandCentreDesign?.animatedCircuitPulseCount).toBe(9);
  expect(initial?.characterMotion?.playerNonStaticIdle).toBe(true);
  expect(initial?.characterMotion?.playerIdleModes).toEqual(['idle', 'idle-alt', 'inspect', 'pose', 'wave']);
  expect(initial?.characterMotion?.eonbotPublicScouting).toBe(true);
  expect(initial?.characterMotion?.eonbotStationHostGreetings).toBe(true);
  expect(initial?.characterMotion?.eonbotPlayfulLoops).toBe(true);
  expect(initial?.characterMotion?.eonbotVisualDockVisits).toBe(true);
  expect(initial?.characterMotion?.eonbotAutomaticStationActivation).toBe(false);
  expect(initial?.characterMotion?.eonbotAutonomousAgent).toBe(false);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(450);
  await expect.poll(async () => page.evaluate(() => {
    const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
    return runtime?.getRuntimeSummary?.()?.eonbot?.presentation?.companionState || '';
  }), { timeout: 5_000 }).toBe('formation-follow');
  await page.keyboard.up('KeyW');

  const samples = await page.evaluate(async () => {
    const states: string[] = [];
    const playerStates: string[] = [];
    const distances: number[] = [];
    const flags: Presentation[] = [];
    for (let index = 0; index < 25; index += 1) {
      const runtime = (globalThis as unknown as { EON_CITY_COMMAND_HUB_RUNTIME?: CityRuntime }).EON_CITY_COMMAND_HUB_RUNTIME;
      const presentation = runtime?.getRuntimeSummary?.()?.eonbot?.presentation || {};
      if (presentation.companionState) states.push(presentation.companionState);
      if (presentation.playerIdleState) playerStates.push(presentation.playerIdleState);
      if (Number.isFinite(presentation.companionDistanceFromPlayer)) distances.push(Number(presentation.companionDistanceFromPlayer));
      flags.push(presentation);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    return { states, playerStates, distances, flags };
  });

  const stateSet = new Set(samples.states);
  for (const expectedState of ['scout-structure', 'inspect-terminal', 'greet-host', 'nexus-spiral', 'circuit-scan', 'playful-loop', 'dock-check', 'return-formation']) {
    expect(stateSet.has(expectedState), `missing EONBOT state ${expectedState}: ${[...stateSet].join(', ')}`).toBe(true);
  }
  const playerStateSet = new Set(samples.playerStates);
  expect(playerStateSet.has('idle-alt')).toBe(true);
  expect([...playerStateSet].some((state) => ['inspect', 'pose', 'wave'].includes(state))).toBe(true);
  expect(samples.distances.length).toBeGreaterThan(0);
  expect(samples.distances.every((distance) => distance <= 8.45)).toBe(true);
  expect(samples.flags.every((entry) => entry.automaticStationActivation === false)).toBe(true);
  expect(samples.flags.every((entry) => entry.automaticNavigation === false)).toBe(true);
  expect(samples.flags.every((entry) => entry.automaticDocking === false)).toBe(true);
  expect(samples.flags.every((entry) => entry.autonomousAgent === false)).toBe(true);
  expect(samples.flags.every((entry) => entry.localVisualOnly === true)).toBe(true);

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

  expect(pageErrors).toEqual([]);
  const screenshotPath = testInfo.outputPath('w745-final-city-polish.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const proofPath = testInfo.outputPath('w745-final-city-polish-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({
    schema: 'eonapp.w745.final-city-polish-browser-proof.v1',
    initial,
    observedCompanionStates: [...stateSet],
    observedPlayerIdleStates: [...playerStateSet],
    pageErrors
  }, null, 2));
  await testInfo.attach('w745-final-city-polish-proof', { path: proofPath, contentType: 'application/json' });
});
