#!/usr/bin/env node
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = String(process.env.EON_STAGE4_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outputDir = path.resolve(process.env.EON_STAGE4_OUTPUT_DIR || 'artifacts/stage4-production-bundle-proof');
const authorizedAccess = Object.freeze({
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
  reason: 'A15 Stage-4 production-bundle regression proof.',
  dataCustody: 'No private user content is used.'
});

await fs.mkdir(outputDir, { recursive: true });
const report = {
  schema: 'eonapp.a15.stage4.production-bundle-proof.v2',
  ok: false,
  baseUrl,
  sourceRevision: process.env.GITHUB_SHA || '',
  consoleMessages: [],
  capturedConsole: [],
  pageErrors: [],
  requestFailures: [],
  firstPartyHttpErrors: [],
  root: null,
  runtimeDiagnostics: null,
  runtimeSummaryAvailable: false,
  outcome: 'not-started'
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  serviceWorkers: 'block'
});
const page = await context.newPage();

await page.addInitScript(() => {
  const capture = [];
  Object.defineProperty(globalThis, '__EON_STAGE4_CONSOLE_CAPTURE__', {
    value: capture,
    configurable: false,
    enumerable: false,
    writable: false
  });
  const serialize = (value) => {
    if (value instanceof Error) {
      return {
        kind: 'error',
        name: String(value.name || 'Error').slice(0, 120),
        message: String(value.message || '').slice(0, 1000),
        stack: String(value.stack || '').slice(0, 4000)
      };
    }
    if (typeof value === 'string') return { kind: 'string', value: value.slice(0, 2000) };
    if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') {
      return { kind: typeof value, value };
    }
    try {
      return { kind: 'json', value: JSON.parse(JSON.stringify(value)) };
    } catch {
      return { kind: typeof value, value: String(value).slice(0, 2000) };
    }
  };
  for (const level of ['warn', 'error']) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      capture.push({ level, args: args.map(serialize) });
      if (capture.length > 100) capture.splice(0, capture.length - 100);
      original(...args);
    };
  }
});

page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error') {
    report.consoleMessages.push({ type: message.type(), text: message.text().slice(0, 2000) });
  }
});
page.on('pageerror', (error) => report.pageErrors.push(String(error?.stack || error?.message || error).slice(0, 4000)));
page.on('requestfailed', (request) => report.requestFailures.push({ url: request.url().replace(/[?#].*$/, ''), reason: request.failure()?.errorText || 'unknown' }));
page.on('response', (response) => {
  const url = response.url();
  if (url.startsWith(baseUrl) && response.status() >= 400) report.firstPartyHttpErrors.push({ status: response.status(), url: url.replace(/[?#].*$/, '') });
});

await page.route('**/api/city/access', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(authorizedAccess) }));
await page.route('**/api/auth/session', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ available: true, signedIn: true }) }));
await page.route('**/api/billing/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, available: true }) }));

async function collectRuntimeEvidence() {
  const evidence = await page.evaluate(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const canvas = document.querySelector('.eon-city-command-hub-canvas');
    const bounds = canvas?.getBoundingClientRect?.();
    return {
      root: root ? {
        ...root.dataset,
        entryState: root.dataset.eonCityEntryState || '',
        renderer: root.dataset.eonCityRenderer || '',
        bootStage: root.dataset.eonCityBootStage || '',
        firstFrame: root.dataset.eonCityFirstFrame || '',
        stage4Outcome: root.dataset.eonCityStage4Outcome || '',
        stage4Reason: root.dataset.eonCityStage4Reason || '',
        canvasPresent: Boolean(canvas),
        canvasWidth: Math.round(Number(bounds?.width || 0)),
        canvasHeight: Math.round(Number(bounds?.height || 0))
      } : null,
      runtimeDiagnostics: globalThis.__EON_CITY_RUNTIME_DIAGNOSTICS__ || null,
      capturedConsole: Array.isArray(globalThis.__EON_STAGE4_CONSOLE_CAPTURE__)
        ? globalThis.__EON_STAGE4_CONSOLE_CAPTURE__
        : [],
      runtimeSummaryAvailable: Boolean(globalThis.EON_CITY_COMMAND_HUB_RUNTIME?.getRuntimeSummary?.())
    };
  });
  report.root = evidence.root;
  report.runtimeDiagnostics = evidence.runtimeDiagnostics;
  report.capturedConsole = evidence.capturedConsole;
  report.runtimeSummaryAvailable = evidence.runtimeSummaryAvailable;
}

try {
  report.outcome = 'navigating';
  await page.goto(`${baseUrl}/eoncity?stage4-production-bundle=1`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-eon-city-play-root]');
    const entryState = root?.dataset?.eonCityEntryState || '';
    const renderer = root?.dataset?.eonCityRenderer || '';
    return (entryState === 'PLAYABLE_3D_CORE' && renderer === 'babylon-core')
      || entryState === 'PLAYABLE_RECOVERY'
      || renderer === 'canvas-2d-fallback'
      || renderer === 'city-core-import-failed';
  }, null, { timeout: 90_000 });
  await collectRuntimeEvidence();
  if (report.root?.entryState !== 'PLAYABLE_3D_CORE') throw new Error(`unexpected-entry-state:${report.root?.entryState || 'missing'}`);
  if (report.root?.renderer !== 'babylon-core') throw new Error(`unexpected-renderer:${report.root?.renderer || 'missing'}`);
  if (report.root?.firstFrame !== 'ready') throw new Error(`first-frame-not-ready:${report.root?.firstFrame || 'missing'}`);
  if (report.root?.stage4Outcome !== 'succeeded') throw new Error(`stage4-outcome-not-success:${report.root?.stage4Outcome || 'missing'}`);
  if (report.root?.stage4Reason !== 'babylon-core-mounted') throw new Error(`stage4-reason-not-success:${report.root?.stage4Reason || 'missing'}`);
  if (!report.root?.canvasPresent || report.root.canvasWidth < 100 || report.root.canvasHeight < 100) throw new Error('babylon-canvas-not-usable');
  if (!report.runtimeSummaryAvailable) throw new Error('command-hub-runtime-unavailable');
  if (report.pageErrors.length) throw new Error(`page-errors:${report.pageErrors.join('|')}`);
  report.ok = true;
  report.outcome = 'PLAYABLE_3D_CORE';
} catch (error) {
  report.outcome = String(error?.message || error);
  await collectRuntimeEvidence().catch(() => {});
  await page.screenshot({ path: path.join(outputDir, 'failure.png'), fullPage: true }).catch(() => {});
} finally {
  await fs.writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
