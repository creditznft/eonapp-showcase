import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const enabled = process.env.EON_CITY_FINAL_REHEARSAL === '1';
const baseURL = String(process.env.EON_CITY_LIVE_BASE_URL || '').replace(/\/$/, '');
const storageState = String(process.env.EON_CITY_AUTH_STORAGE_STATE || '');
const outputDir = path.resolve(process.env.EON_CITY_FINAL_PROOF_OUTPUT_DIR || 'reports/w592-city-final-rehearsal');

function configured() {
  return enabled && /^https?:\/\//.test(baseURL);
}
function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value || '').split('?')[0].split('#')[0];
  }
}
function safeText(value) {
  return String(value || '').replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]').slice(0, 600);
}
function writeArtifact(name, value) {
  ensureOutputDir();
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}
function addLogs(page, record) {
  page.on('console', (message) => {
    if (message.type() === 'error') record.consoleErrors.push(safeText(message.text()));
  });
  page.on('pageerror', (error) => record.pageErrors.push(safeText(error?.message || error)));
  page.on('requestfailed', (request) => record.failedRequests.push({ url: safeUrl(request.url()), failure: safeText(request.failure()?.errorText || 'unknown') }));
}

async function closeOpenOverlay(page) {
  const candidates = [
    '[data-eon-play-close-controls]',
    '[data-eon-play-close-command-deck]',
    '[data-eon-play-close-start-here]'
  ];
  for (const selector of candidates) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 5_000 }).catch(() => {});
      return;
    }
  }
}

test.describe('W592 EON City flagship rehearsal', () => {
  test.skip(!configured(), 'Set EON_CITY_FINAL_REHEARSAL=1 and EON_CITY_LIVE_BASE_URL for an approved named preview only.');

  test('guest lane stays gated and never boots the heavy City renderer', async ({ browser }) => {
    const record = { lane: 'guest', consoleErrors: [], pageErrors: [], failedRequests: [], accessState: null, heavyRendererVisible: null };
    const context = await browser.newContext({ baseURL, serviceWorkers: 'block', recordVideo: { dir: outputDir, size: { width: 1280, height: 720 } } });
    const page = await context.newPage();
    addLogs(page, record);
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('[data-eon-city-play-root]')).toBeVisible();
    await page.screenshot({ path: path.join(outputDir, '01-guest-entry.png'), fullPage: false });
    record.accessState = await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-access-state');
    record.heavyRendererVisible = await page.locator('[data-eon-play-canvas-host]').count() > 0;
    record.url = safeUrl(page.url());
    record.status = record.heavyRendererVisible ? 'FAIL' : 'PASS';
    writeArtifact('01-guest-entry.json', record);
    expect(record.heavyRendererVisible).toBe(false);
    await context.close();
  });

  test('authenticated lane rehearses simple controls without confirming native routes or work', async ({ browser }) => {
    test.skip(!storageState, 'A human-created short-lived EON_CITY_AUTH_STORAGE_STATE file outside the repository is required.');
    const record = { lane: 'authenticated-preview', consoleErrors: [], pageErrors: [], failedRequests: [], checks: [], automaticConfirmationUsed: false };
    const context = await browser.newContext({
      baseURL,
      storageState,
      serviceWorkers: 'block',
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } }
    });
    const page = await context.newPage();
    addLogs(page, record);
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('[data-eon-city-play-root]')).toBeVisible();
    await expect(page.locator('[data-eon-play-open-command-deck]')).toBeVisible({ timeout: 45_000 });
    await page.screenshot({ path: path.join(outputDir, '02-authenticated-initial-frame.png'), fullPage: false });

    await page.locator('[data-eon-play-open-controls]').click();
    const groups = page.locator('[data-eon-play-menu-section]');
    await expect(groups).toHaveCount(5);
    record.checks.push({ id: 'menu-groups', expected: 5, observed: await groups.count(), result: 'PASS' });
    await page.screenshot({ path: path.join(outputDir, '03-menu-groups.png'), fullPage: false });
    await closeOpenOverlay(page);

    await page.locator('[data-eon-play-open-command-deck]').click();
    const primaryCards = page.locator('[data-eon-play-command-deck-card]');
    await expect(primaryCards).toHaveCount(5);
    record.checks.push({ id: 'command-deck-primary-cards', expected: 5, observed: await primaryCards.count(), result: 'PASS' });
    await primaryCards.filter({ hasText: 'EON Forge' }).click();
    await expect(page.locator('[data-eon-play-command-deck-confirm="forge"]')).toBeVisible();
    record.checks.push({ id: 'forge-review', nativeRouteConfirmed: false, result: 'PASS' });
    await page.screenshot({ path: path.join(outputDir, '04-command-deck-review.png'), fullPage: false });
    await closeOpenOverlay(page);

    await page.locator('[data-eon-play-open-start-here]').click();
    await page.locator('[data-eon-play-first-run-path]').first().click();
    await expect(page.locator('[data-eon-play-first-run-review]')).toBeVisible();
    await expect(page.locator('[data-eon-play-confirm-first-run-path]')).toBeVisible();
    record.checks.push({ id: 'first-run-review', secondConfirmationRequired: true, nativeRouteConfirmed: false, result: 'PASS' });
    await page.screenshot({ path: path.join(outputDir, '05-first-run-review.png'), fullPage: false });
    await page.locator('[data-eon-play-cancel-first-run-review]').click();
    await closeOpenOverlay(page);

    const inventory = await page.locator('[data-eon-play-hud-direct] button, [data-eon-play-arrival-compass] button').evaluateAll((nodes) => nodes.map((node) => ({
      text: String(node.textContent || '').replace(/\s+/g, ' ').trim(),
      action: [...node.attributes].find((attribute) => attribute.name.startsWith('data-eon-play-'))?.name || null
    })));
    record.directHudInventory = inventory;
    record.url = safeUrl(page.url());
    record.status = record.checks.every((entry) => entry.result === 'PASS') ? 'PASS' : 'FAIL';
    writeArtifact('02-authenticated-preview.json', record);
    expect(record.automaticConfirmationUsed).toBe(false);
    await context.close();
  });
});
