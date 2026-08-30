import { chromium } from '@playwright/test';
import fs from 'node:fs';

const origin = 'http://127.0.0.1:4173';
const routes = [
  { path: '/projects', surface: 'projects' },
  { path: '/workspace', surface: 'workspace' },
  { path: '/local-ai', surface: 'local-ai' },
  { path: '/automations', surface: 'automations' },
  { path: '/vault', surface: 'vault' },
  { path: '/eon-keys', surface: null }
];

const requests = [];
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
page.on('request', (request) => requests.push(request.url()));
const results = [];
for (const route of routes) {
  const url = `${origin}${route.path}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(900);
  const surfaceCount = route.surface ? await page.locator(`[data-eon-premium-surface="${route.surface}"]`).count() : 0;
  const resolverExamples = route.path === '/eon-keys' ? await page.locator('.eon-key-lock-card').count() : 0;
  const disabledButtons = await page.locator('button[data-eon-lock-action][disabled], .eon-feature-lock-action[disabled]').count();
  const enabledLockButtons = await page.locator('button[data-eon-lock-action]:not([disabled])').count();
  const commercialActiveTrue = await page.locator('[data-commercial-active="true"], [data-checkout-active="true"], [data-live-grant-active="true"], [data-browser-unlock-allowed="true"]').count();
  const text = await page.locator('body').innerText({ timeout: 10000 });
  results.push({
    path: route.path,
    expectedSurface: route.surface,
    surfaceCount,
    resolverExamples,
    disabledButtons,
    enabledLockButtons,
    commercialActiveTrue,
    hasDodoDisabledCopy: /Dodo checkout|checkout.*off|No checkout|not active/i.test(text),
    hasReferPath: /Refer to earn EON Keys|Refer users to earn EON Keys/i.test(text),
    ok: route.surface ? surfaceCount >= 1 && disabledButtons >= 1 && enabledLockButtons === 0 && commercialActiveTrue === 0 : resolverExamples >= 1 && commercialActiveTrue === 0
  });
}
await browser.close();

const forbiddenNetwork = requests.filter((url) => /dodo|checkout|redeem|entitlement|payment/i.test(url) && !/billing|eon-keys/.test(url));
const receipt = {
  schema: 'eonapp.w616d.browser-surface-proof.v1',
  origin,
  ok: results.every((item) => item.ok) && forbiddenNetwork.length === 0,
  routes: results,
  forbiddenNetwork,
  requestCount: requests.length
};
fs.writeFileSync('EVIDENCE/W616D_LOCKED_FEATURE_SURFACES_2026-07-10/w616d-browser-surface-proof.json', `${JSON.stringify(receipt, null, 2)}\n`);
if (!receipt.ok) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(receipt, null, 2));
