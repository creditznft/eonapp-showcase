import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const AUTHORIZED_ACCESS = {
  schema: 'eon.city.access.w649b.v1', mode: 'authenticated-play', accessState: 'authorized',
  requiresIdentity: true, identityAvailable: true, signedIn: true, canBootFullCity: true,
  heavyRuntimeImportAllowed: true, staticPortalOnly: false, publicPreviewAvailable: false,
  browserGateOnly: true, clientFirstStaticAssetDelivery: true, pagesFunctionAssetRelayAllowed: false,
  reason: 'Local W765R5 Command Workspace proof.', dataCustody: 'No private user content is used.'
};

type Runtime = {
  getRuntimeSummary?: () => any;
  openStation?: (id: string, options: { explicitUserAction: boolean }) => { ok?: boolean };
  inspectCommandCentreWall?: (id: string, options: { explicitUserAction: boolean; openDock?: boolean }) => { ok?: boolean };
  openCityMenu?: () => { ok?: boolean };
  restoreExplorationPose?: (pose: { x: number; y?: number; z: number; heading: number }) => boolean;
};

async function boot(page: import('@playwright/test').Page) {
  await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AUTHORIZED_ACCESS) }));
  await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"available":false,"signedIn":false}' }));
  await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/eoncity?release=w765r5-command-workspace', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.eon-city-command-hub-canvas')).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => page.evaluate(() => Boolean((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.())), { timeout: 30_000 }).toBe(true);
  await expect(page.locator('[data-eon-city-play-root]')).toHaveAttribute('data-eon-city-first-frame', 'ready', { timeout: 30_000 });
}

async function summary(page: import('@playwright/test').Page) {
  return page.evaluate(() => ((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME as Runtime)?.getRuntimeSummary?.() || null);
}

test('W765R5 boots ten truthful monitor destinations with slab-free wall geometry and dark-glass labels', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await boot(page);
  const state = await summary(page);
  expect(state?.stationMonitors?.validation?.ok).toBe(true);
  expect(state?.stationMonitors?.count).toBe(10);
  expect(state?.stationMonitors?.individualCount).toBe(9);
  expect(state?.stationMonitors?.commandStatusWallCount).toBe(5);
  expect(state?.stationMonitors?.stations).toHaveLength(9);
  for (const monitor of state.stationMonitors.stations) {
    expect(monitor.facingDot, monitor.stationId).toBeGreaterThanOrEqual(0.985);
    expect(monitor.uprightMarker, monitor.stationId).toBe(true);
    expect(monitor.visibleBackingSlab, monitor.stationId).toBe(false);
    expect(monitor.explicitMaterials, monitor.stationId).toBe(true);
    expect(monitor.negativeScale, monitor.stationId).toBe(false);
    expect(monitor.privateDataRead, monitor.stationId).toBe(false);
    expect(monitor.automaticExecution, monitor.stationId).toBe(false);
  }
  expect(state?.commandCentre?.presentation?.ok).toBe(true);
  expect(state?.commandCentre?.presentation?.wallCount).toBe(5);
  expect(state?.commandCentre?.presentation?.visibleBackingSlab).toBe(false);
  expect(state?.commandCentre?.presentation?.explicitMaterials).toBe(true);

  const labelStyle = await page.locator('.eon-city-command-labels button[data-eon-city-label-id]').first().evaluate((node) => {
    const style = getComputedStyle(node as HTMLElement);
    return { appearance: style.appearance, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage, color: style.color, borderStyle: style.borderStyle };
  });
  expect(labelStyle.appearance).toBe('none');
  expect(labelStyle.backgroundImage).toContain('linear-gradient');
  expect(labelStyle.backgroundColor).not.toBe('rgb(255, 255, 255)');
  expect(labelStyle.color).not.toBe('rgb(0, 0, 0)');
  expect(labelStyle.borderStyle).not.toBe('none');

  await page.evaluate(() => ((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME as Runtime).openCityMenu?.());
  await expect(page.locator('.eon-city-command-menu')).toBeVisible();
  await page.locator('[data-eon-city-quick="monitors"]').click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: testInfo.outputPath('w765r5-command-wall-focused.png'), fullPage: false });

  const proofPath = testInfo.outputPath('w765r5-command-workspace-proof.json');
  await fs.writeFile(proofPath, JSON.stringify({ schema: 'eonapp.w765r5.command-workspace-browser-proof.v1', state, labelStyle, pageErrors, consoleErrors }, null, 2));
  await testInfo.attach('w765r5-command-workspace-proof', { path: proofPath, contentType: 'application/json' });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('W765R5 monitor actions open maintained workspaces and keyboard left/right settle safely', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await boot(page);
  const openedNexus = await page.evaluate(() => ((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME as Runtime).openStation?.('eonbot-nexus', { explicitUserAction: true }) || null);
  expect(openedNexus?.ok).toBe(true);
  const host = page.locator('[data-eon-work-surface-host]');
  await expect(host).toBeVisible();
  await expect(host).toHaveAttribute('data-eon-work-surface-presentation', 'dock');
  await page.screenshot({ path: testInfo.outputPath('w765r5-eonbot-workspace-open.png'), fullPage: false });
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(host).toBeHidden();

  const openedWall = await page.evaluate(() => ((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME as Runtime).inspectCommandCentreWall?.('work', { explicitUserAction: true, openDock: true }) || null);
  expect(openedWall?.ok).toBe(true);
  await expect(host).toBeVisible();
  await expect(page.locator('[data-eon-command-wall]')).toHaveCount(5);
  await page.locator('[data-eon-work-surface-close]').first().click();
  await expect(host).toBeHidden();

  await page.evaluate(() => ((globalThis as any).EON_CITY_COMMAND_HUB_RUNTIME as Runtime).restoreExplorationPose?.({ x: 0, y: 0, z: 7.5, heading: 0 }));
  const canvas = page.locator('.eon-city-command-hub-canvas');
  await canvas.click({ position: { x: 720, y: 450 } });
  const before = await summary(page);
  await page.keyboard.down('a');
  await page.waitForTimeout(420);
  await page.keyboard.up('a');
  await page.waitForTimeout(180);
  const afterLeft = await summary(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  await page.waitForTimeout(180);
  const afterRight = await summary(page);
  expect(Math.hypot((afterLeft.player?.x || 0) - (before.player?.x || 0), (afterLeft.player?.z || 0) - (before.player?.z || 0))).toBeGreaterThan(0.05);
  expect(Math.hypot((afterRight.player?.x || 0) - (afterLeft.player?.x || 0), (afterRight.player?.z || 0) - (afterLeft.player?.z || 0))).toBeGreaterThan(0.05);
  expect(afterLeft.player?.heading).not.toBe(afterRight.player?.heading);
  expect(afterRight.player?.animationState).toBe('idle');
  await page.screenshot({ path: testInfo.outputPath('w765r5-pathfinder-after-left-right-release.png'), fullPage: false });
});
