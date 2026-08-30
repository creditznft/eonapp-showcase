import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';

const UNSAFE_COPY = /cash out|payout|commission|buy now|checkout|browser-only entitlement|raw prompt|provider key|credential value|crypto wallet|NFT reward/i;
const ROUTE_SCREENS = [
  { id: 'projects', shortcut: 'P', path: '/projects' },
  { id: 'create', shortcut: 'N', path: '/create' },
  { id: 'forge', shortcut: 'F', path: '/forge' },
  { id: 'library', shortcut: 'B', path: '/library' },
  { id: 'research', shortcut: 'I', path: '/insights' },
  { id: 'automations', shortcut: 'A', path: '/automations' },
  { id: 'workspace', shortcut: 'W', path: '/workspace' },
  { id: 'local-ai', shortcut: 'L', path: '/local-ai' },
  { id: 'vault', shortcut: 'V', path: '/vault' },
  { id: 'realm-studio', shortcut: 'R', path: '/realm-studio' }
] as const;
const LOCAL_SCREENS = [{ id: 'eonbot', shortcut: 'C', target: 'eonbot-panel' }] as const;

async function openCity(page, viewport = { width: 1440, height: 960 }) {
  await page.setViewportSize(viewport);
  await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-eon-command-room-panel]')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'EON Command Room' })).toBeVisible();
}
async function ensureCommandRoom(page) {
  const panel = page.locator('[data-eon-command-room-panel]');
  if (await panel.isHidden()) await page.keyboard.press('R');
  await expect(panel).toBeVisible({ timeout: 8_000 });
}
async function assertNoUnsafeCopy(page) { await expect(page.locator('body')).not.toContainText(UNSAFE_COPY); }
function addBrowserTelemetry(page, proof) {
  page.on('console', (message) => { if (['error','warning'].includes(message.type())) proof.consoleMessages.push({ type: message.type(), text: message.text() }); });
  page.on('pageerror', (error) => proof.pageErrors.push(String(error?.message || error)));
  page.on('requestfailed', (request) => proof.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' }));
}
async function writeProof(testInfo, name, proof) {
  const output = testInfo.outputPath(`${name}.json`);
  await fs.writeFile(output, JSON.stringify({ schema: 'eonapp.w618f.browser-proof.v2', name, ...proof }, null, 2));
  await testInfo.attach(name, { path: output, contentType: 'application/json' });
}
async function expectPath(page, expectedPath) { await expect.poll(() => new URL(page.url()).pathname, { timeout: 10_000 }).toBe(expectedPath); }

async function reviewAndConfirm(page, screen) {
  const initialPath = new URL(page.url()).pathname;
  const button = page.locator(`[data-eon-command-room-screen="${screen.id}"]`);
  await expect(button).toBeVisible();
  await button.click();
  await expectPath(page, initialPath);
  const review = page.locator('[data-eon-command-room-review]');
  await expect(review).toContainText(/second click required/i);
  const confirm = review.locator(`[data-eon-command-room-confirm="${screen.id}"]`);
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expectPath(page, screen.path);
}

test.describe('W618F/W653 EON City Command Room real browser proof', () => {
  test('desktop default renders the all-in-one cockpit, truthful dashboard and optional Explore', async ({ page }, testInfo) => {
    const proof = { checkpoints: [] as string[], consoleMessages: [] as unknown[], requestFailures: [] as unknown[], pageErrors: [] as string[] };
    addBrowserTelemetry(page, proof);
    await openCity(page);
    const panel = page.locator('[data-eon-command-room-panel]');
    await expect(panel).toHaveAttribute('data-eon-command-room-state', 'open');
    await expect(page.locator('[data-eon-command-room-action]')).toHaveCount(11);
    await expect(page.locator('[data-eon-command-room-tier="primary"]')).toHaveCount(7);
    await expect(page.locator('[data-eon-command-room-tier="systems"]')).toHaveCount(4);
    await expect(page.locator('[data-eon-command-room-signal]')).toHaveCount(5);
    await expect(page.locator('[data-eon-command-room-agent]')).toHaveCount(5);
    await expect(page.locator('[data-eon-play-command-room-strip]')).toBeVisible();
    await assertNoUnsafeCopy(page);
    await page.locator('[data-eon-command-room-highlight]').click();
    await expect(page.locator('[data-eon-command-room-highlight]')).toHaveAttribute('aria-pressed', 'true');
    proof.checkpoints.push('command-room-default-visible','seven-primary-four-systems','living-dashboard-visible','agent-theater-proof-bound','interactive-highlight-visible');
    await page.screenshot({ path: testInfo.outputPath('w618f-command-room-desktop-default.png'), fullPage: true });
    await page.locator('[data-eon-command-room-explore]').click();
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-eon-play-canvas-host] canvas')).toBeVisible({ timeout: 15_000 });
    await page.mouse.move(640, 480); await page.mouse.click(640, 480); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowLeft');
    proof.checkpoints.push('3d-explore-mouse-keyboard-input-accepted');
    await page.keyboard.press('R'); await expect(panel).toBeVisible();
    proof.checkpoints.push('r-shortcut-reopens-command-room');
    await writeProof(testInfo, 'w618f-desktop-default-proof', proof);
  });

  test('screen-click matrix requires review and a second visible click for every native EONAPP route', async ({ page }, testInfo) => {
    const proof = { checkpoints: [] as string[], consoleMessages: [] as unknown[], requestFailures: [] as unknown[], pageErrors: [] as string[] };
    addBrowserTelemetry(page, proof);
    for (const screen of ROUTE_SCREENS) {
      await openCity(page); await ensureCommandRoom(page); await reviewAndConfirm(page, screen); await assertNoUnsafeCopy(page);
      proof.checkpoints.push(`screen-click-matrix:${screen.id}->review->${screen.path}`);
    }
    await openCity(page); await ensureCommandRoom(page);
    await page.locator('[data-eon-command-room-screen="eonbot"]').click();
    await expect(page.locator('[data-eon-command-room-review]')).toContainText(/In-City control/i);
    await page.locator('[data-eon-command-room-local-confirm="eonbot-panel"]').click();
    await expect(page.locator('[data-eon-play-eonbot-panel]')).toBeVisible({ timeout: 10_000 });
    proof.checkpoints.push('screen-click-matrix:eonbot->in-city-panel');
    await page.screenshot({ path: testInfo.outputPath('w618f-screen-click-matrix-after-eonbot.png'), fullPage: true });
    await writeProof(testInfo, 'w618f-screen-click-matrix-proof', proof);
  });

  test('Share and District Map remain deliberate hero actions', async ({ page }, testInfo) => {
    const proof = { checkpoints: [] as string[], consoleMessages: [] as unknown[], requestFailures: [] as unknown[], pageErrors: [] as string[] };
    addBrowserTelemetry(page, proof);
    await openCity(page);
    await page.locator('[data-eon-command-room-share]').click();
    await expect(page.locator('[data-eon-share-popover]')).toBeVisible({ timeout: 10_000 });
    await page.locator('[data-eon-share-popover-close]').click();
    proof.checkpoints.push('hero-action:share-popover');
    await page.locator('[data-eon-command-room-map]').click();
    await expect(page.locator('[data-eon-play-travel-panel]')).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => page.locator('[data-eon-play-travel-destination]').count()).toBeGreaterThanOrEqual(1);
    await page.locator('[data-eon-play-close-travel-map]').click();
    proof.checkpoints.push('hero-action:district-map');
    await writeProof(testInfo, 'w618f-hero-actions-proof', proof);
  });

  test('keyboard shortcuts select a review without silently navigating', async ({ page }, testInfo) => {
    const proof = { checkpoints: [] as string[], consoleMessages: [] as unknown[], requestFailures: [] as unknown[], pageErrors: [] as string[] };
    addBrowserTelemetry(page, proof);
    for (const screen of ROUTE_SCREENS) {
      await openCity(page); const before = new URL(page.url()).pathname; await page.keyboard.press(screen.shortcut);
      await expectPath(page, before); await expect(page.locator(`[data-eon-command-room-confirm="${screen.id}"]`)).toBeVisible();
      proof.checkpoints.push(`shortcut:${screen.shortcut}->review:${screen.id}`);
    }
    await openCity(page); await page.keyboard.press(LOCAL_SCREENS[0].shortcut);
    await expect(page.locator('[data-eon-command-room-local-confirm="eonbot-panel"]')).toBeVisible();
    proof.checkpoints.push('shortcut:C->review:eonbot');
    await page.keyboard.press('Escape'); await expect(page.locator('[data-eon-command-room-panel]')).toBeHidden();
    proof.checkpoints.push('shortcut:Escape->3d-explore');
    await page.keyboard.press('R'); await expect(page.locator('[data-eon-command-room-panel]')).toBeVisible();
    proof.checkpoints.push('shortcut:R->command-room');
    await writeProof(testInfo, 'w618f-keyboard-shortcut-proof', proof);
  });

  test('mobile portrait, landscape, controls, share and cache reload remain usable', async ({ page }, testInfo) => {
    const proof = { checkpoints: [] as string[], consoleMessages: [] as unknown[], requestFailures: [] as unknown[], pageErrors: [] as string[], cache: {} as Record<string, unknown> };
    addBrowserTelemetry(page, proof);
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/eoncity', { waitUntil: 'domcontentloaded' });
    const portraitPanel = page.locator('[data-eon-command-room-panel]');
    const portraitCompanion = page.getByText(/EON NOIR · PORTRAIT COMPANION/i);
    if (await portraitCompanion.count()) { await expect(portraitCompanion).toBeVisible(); proof.checkpoints.push('mobile-portrait-companion-visible'); }
    else { await expect(portraitPanel).toBeVisible(); await expect(page.locator('[data-eon-command-room-action]')).toHaveCount(11); proof.checkpoints.push('mobile-portrait-command-room-visible'); }
    await page.screenshot({ path: testInfo.outputPath('w618f-mobile-portrait.png'), fullPage: true });
    await openCity(page, { width: 844, height: 390 });
    await page.locator('[data-eon-play-open-controls]').first().click();
    await expect(page.getByText(/CITY CONTROLS|Command Room, work & share|Explore City/i)).toBeVisible();
    proof.checkpoints.push('mobile-landscape-sidebar-menu-visible');
    await page.screenshot({ path: testInfo.outputPath('w618f-mobile-landscape.png'), fullPage: true });
    await page.locator('[data-eon-play-share-city]').first().click(); await expect(page.locator('[data-eon-share-popover]')).toBeVisible(); await page.locator('[data-eon-share-popover-close]').click();
    proof.checkpoints.push('mobile-landscape-share-center-visible');
    proof.cache = await page.evaluate(async () => { const registrations = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : []; return { serviceWorkerAvailable: 'serviceWorker' in navigator, registrations: registrations.length, controller: Boolean(navigator.serviceWorker?.controller), routeState: document.body?.dataset?.eonCityRouteState || null }; });
    await page.reload({ waitUntil: 'domcontentloaded' }); await expect(page.locator('[data-eon-command-room-panel]')).toBeVisible({ timeout: 15_000 }); await expect(page.locator('[data-eon-command-room-action]')).toHaveCount(11);
    proof.checkpoints.push('cache-reload-command-room-not-stale'); await assertNoUnsafeCopy(page); await writeProof(testInfo, 'w618f-mobile-cache-proof', proof);
  });
});
