import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { getEonCityCommandHorizonProofManifest } from '../assets/js/city/eon-city-command-horizon-proof-manifest.js';

const enabled = process.env.EON_CITY_LIVE_GAMEPLAY_RUN === '1';
const baseURL = String(process.env.EON_CITY_LIVE_BASE_URL || '').replace(/\/$/, '');
const storageState = String(process.env.EON_CITY_AUTH_STORAGE_STATE || '');
const outputDir = path.resolve(process.env.EON_CITY_PROOF_OUTPUT_DIR || 'artifacts/w575-live-gameplay-proof');
const manifest = getEonCityCommandHorizonProofManifest({ quality: 'balanced', accessLane: 'authenticated-preview' });

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function writeArtifact(name, value) {
  ensureOutputDir();
  fs.writeFileSync(path.join(outputDir, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2));
}

function requiredLiveRun() {
  return enabled && /^https?:\/\//.test(baseURL);
}

async function attachBrowserLogs(page, records) {
  page.on('console', (message) => {
    if (message.type() === 'error') records.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => records.pageErrors.push(String(error?.message || error)));
  page.on('requestfailed', (request) => records.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || 'unknown' }));
}

test.describe('W575 Command Horizon live gameplay evidence', () => {
  test.skip(!requiredLiveRun(), 'Set EON_CITY_LIVE_GAMEPLAY_RUN=1 and EON_CITY_LIVE_BASE_URL only for an approved live preview run.');

  test('guest entry stays truthful and does not rely on an auth bypass', async ({ browser }) => {
    const records = { lane: 'public-entry', consoleErrors: [], pageErrors: [], failedRequests: [] };
    const context = await browser.newContext({ baseURL, serviceWorkers: 'block' });
    const page = await context.newPage();
    await attachBrowserLogs(page, records);
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('[data-eon-city-play-root]')).toBeVisible();
    await page.screenshot({ path: path.join(outputDir, '01-public-entry.png'), fullPage: false });
    records.url = page.url();
    records.accessState = await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-access-state');
    writeArtifact('01-public-entry.json', records);
    await context.close();
  });

  test('authenticated preview exercises only safe control actions and captures an inventory', async ({ browser }) => {
    test.skip(!storageState, 'A human-created EON_CITY_AUTH_STORAGE_STATE path is required for post-login preview gameplay.');
    const records = { lane: 'authenticated-preview', consoleErrors: [], pageErrors: [], failedRequests: [], groups: [] };
    const context = await browser.newContext({ baseURL, storageState, serviceWorkers: 'block', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await attachBrowserLogs(page, records);
    await page.goto('/eoncity', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('[data-eon-city-play-root]')).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, '02-authenticated-initial-frame.png'), fullPage: false });

    for (const group of manifest.controlGroups) {
      const selectorResults = [];
      for (const selector of group.automationSelectors) {
        const locator = page.locator(selector).first();
        const count = await locator.count();
        const visible = count > 0 ? await locator.isVisible().catch(() => false) : false;
        selectorResults.push({ selector, count, visible });
      }
      records.groups.push({ id: group.id, actionClass: group.actionClass, selectorResults });
      if (group.actionClass === 'safe-in-place') {
        for (const entry of selectorResults.filter((item) => item.visible)) {
          const locator = page.locator(entry.selector).first();
          if (await locator.isEnabled().catch(() => false)) await locator.click({ timeout: 5_000 }).catch(() => {});
        }
      }
      await page.screenshot({ path: path.join(outputDir, `03-${group.id}.png`), fullPage: false });
    }

    const allInteractive = await page.locator('button, a[href], input, select, [role="button"]').evaluateAll((nodes) => nodes.map((node) => ({
      tag: node.tagName.toLowerCase(),
      text: String(node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      disabled: 'disabled' in node ? Boolean(node.disabled) : false,
      data: [...node.attributes].filter((attribute) => attribute.name.startsWith('data-eon-')).map((attribute) => `${attribute.name}=${attribute.value}`)
    })));
    records.controlInventory = allInteractive;
    records.url = page.url();
    records.accessState = await page.locator('[data-eon-city-play-root]').getAttribute('data-eon-city-access-state');
    records.manifestSchema = manifest.schema;
    records.automaticConfirmationUsed = false;
    writeArtifact('02-authenticated-preview.json', records);
    await context.close();
  });
});
