#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const baseURL = process.env.W105_BASE_URL || 'http://127.0.0.1:4185';
const auditDir = path.resolve('CodexAuditPack/W105_PERFORMANCE/browser');
const screenshotDir = path.join(auditDir, 'screenshots');
const reportPath = path.join(auditDir, 'W105_ROUTE_LOAD_AND_BROWSER_PROOF.json');
fs.mkdirSync(screenshotDir, { recursive: true });

function loadRoutes() {
  const payload = JSON.parse(fs.readFileSync('CodexAuditPack/lighthouse-routes.json', 'utf8'));
  const seen = new Set();
  return (payload.routes || []).map((row) => String(row.route || '/')).filter((route) => route && !seen.has(route) && seen.add(route));
}
async function ready() {
  try { return (await fetch(`${baseURL}/`, { signal: AbortSignal.timeout(1200) })).ok; } catch { return false; }
}
async function ensureServer() {
  if (await ready()) return null;
  const port = new URL(baseURL).port || '4185';
  const child = spawn(process.execPath, ['scripts/lhci-static-server.mjs', '--port', port, '--root', 'dist'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  for (let i = 0; i < 80; i += 1) {
    if (await ready()) return child;
    if (child.exitCode !== null) throw new Error(`Static server exited early: ${output}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  child.kill('SIGTERM');
  throw new Error(`Static server did not become ready: ${output}`);
}
function localAssetRefs(html) {
  const refs = [];
  const regex = /<(?:script|link|img)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const value = match[1];
    if (!value || /^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(value)) continue;
    if (value.startsWith('/assets/') || value.startsWith('assets/')) refs.push(value.replace(/^\/+/, '').split(/[?#]/)[0]);
  }
  return [...new Set(refs)];
}
function isContentRoute(route) {
  return /^\/(blog|tools\/(?:archetype-scan|creator-workspace|dream-interpreter))(?:\/|$|\.html)/i.test(route);
}
async function httpRouteCheck(route) {
  const url = `${baseURL}${route.startsWith('/') ? route : `/${route}`}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const html = await response.text();
  const refs = localAssetRefs(html);
  const missing = [];
  for (const ref of refs) {
    const assetResponse = await fetch(`${baseURL}/${ref}`, { method: 'HEAD', signal: AbortSignal.timeout(4000) }).catch(() => null);
    if (!assetResponse || assetResponse.status >= 400) missing.push(ref);
  }
  const contentLite = /content-lite-[^"']+\.js/.test(html);
  const fullLanguageBundle = /(?:multi-language|app-language)-[^"']+\.js/.test(html);
  return {
    route,
    ok: response.status >= 200 && response.status < 400 && missing.length === 0 && (!isContentRoute(route) || (contentLite && !fullLanguageBundle)),
    status: response.status,
    bytes: Buffer.byteLength(html),
    assetRefs: refs.length,
    missing,
    contentLite,
    fullLanguageBundle
  };
}
async function browserSampleCheck(browser, route, index) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  const localErrors = [];
  const pageErrors = [];
  page.on('response', (response) => {
    try {
      const url = new URL(response.url());
      if (url.origin === new URL(baseURL).origin && response.status() >= 400) localErrors.push({ url: response.url(), status: response.status() });
    } catch {}
  });
  page.on('pageerror', (error) => pageErrors.push(String(error?.message || error).slice(0, 300)));
  page.on('console', (message) => { if (message.type() === 'error' && !/ERR_FAILED|Failed to load resource/i.test(message.text())) pageErrors.push(message.text().slice(0, 300)); });
  await page.route('**/*', async (intercept) => {
    try {
      const url = new URL(intercept.request().url());
      if (url.origin === new URL(baseURL).origin || url.protocol === 'data:' || url.protocol === 'blob:') return intercept.continue();
    } catch {}
    return intercept.abort();
  });
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(100);
  const metrics = await page.evaluate(() => ({
    title: document.title,
    bodyTextLength: document.body?.innerText?.trim()?.length || 0,
    hasMain: Boolean(document.querySelector('main')),
    scripts: document.querySelectorAll('script[src]').length,
    modulePreloads: document.querySelectorAll('link[rel="modulepreload"]').length,
    stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    overflowPx: Math.max(0, Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
    contentLite: Boolean([...document.scripts].some((script) => /content-lite/.test(script.src || ''))),
    fullLanguageBundle: Boolean([...document.scripts].some((script) => /multi-language|app-language/.test(script.src || '')))
  }));
  const screenshot = path.join(screenshotDir, `${String(index + 1).padStart(2, '0')}-${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}.png`);
  await page.screenshot({ path: screenshot, fullPage: false, animations: 'disabled' }).catch(() => {});
  await context.close();
  return {
    route,
    ok: (response?.status() || 0) >= 200 && (response?.status() || 0) < 400 && localErrors.length === 0 && pageErrors.length === 0 && metrics.hasMain && metrics.overflowPx <= 2 && (!isContentRoute(route) || (metrics.contentLite && !metrics.fullLanguageBundle)),
    status: response?.status() || 0,
    metrics,
    localErrors,
    pageErrors,
    screenshot: path.relative(process.cwd(), screenshot).replaceAll('\\', '/')
  };
}

const report = {
  schema: 'eon.w105.route-load-and-browser-proof.v1',
  generatedAt: new Date().toISOString(),
  baseURL,
  ok: false,
  routeCount: 0,
  http: {},
  browser: {},
  checks: {},
  failures: [],
  notes: [
    'All public routes are loaded through the local dist server and checked for missing local assets.',
    'Representative mobile Chromium routes prove runtime rendering, no local 404s, no page errors and no horizontal overflow.',
    'External network requests are blocked during browser proof; W105 static gate enforces all-route transfer budgets.'
  ]
};
let server = null;
let browser = null;
try {
  server = await ensureServer();
  const routes = loadRoutes();
  report.routeCount = routes.length;
  const httpResults = [];
  for (const route of routes) httpResults.push(await httpRouteCheck(route));
  report.http = {
    passed: httpResults.filter((row) => row.ok).length,
    failed: httpResults.filter((row) => !row.ok).length,
    results: httpResults
  };
  const samples = ['/', '/trade', '/creator-studio', '/blog/', '/tools/archetype-scan', '/realm-code-preview', '/eon-browser'];
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const browserResults = [];
  for (let i = 0; i < samples.length; i += 1) browserResults.push(await browserSampleCheck(browser, samples[i], i));
  report.browser = {
    sampledRoutes: samples.length,
    passed: browserResults.filter((row) => row.ok).length,
    failed: browserResults.filter((row) => !row.ok).length,
    results: browserResults
  };
  report.checks = {
    routeInventoryLargeEnough: routes.length >= 100,
    everyRouteHttpLoaded: report.http.failed === 0,
    contentRoutesUseLiteShell: httpResults.filter((row) => isContentRoute(row.route)).every((row) => row.contentLite && !row.fullLanguageBundle),
    browserSamplesRender: report.browser.failed === 0,
    browserSamplesIncludeCriticalHeavyAndContent: samples.includes('/trade') && samples.includes('/creator-studio') && samples.includes('/blog/') && samples.includes('/tools/archetype-scan')
  };
  report.failures = [
    ...httpResults.filter((row) => !row.ok).map((row) => ({ kind: 'http-route', route: row.route, status: row.status, missing: row.missing, contentLite: row.contentLite, fullLanguageBundle: row.fullLanguageBundle })),
    ...browserResults.filter((row) => !row.ok).map((row) => ({ kind: 'browser-sample', route: row.route, status: row.status, metrics: row.metrics, localErrors: row.localErrors, pageErrors: row.pageErrors }))
  ];
  report.ok = Object.values(report.checks).every(Boolean);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) { try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); } }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: report.ok, routeCount: report.routeCount, http: { passed: report.http?.passed, failed: report.http?.failed }, browser: { passed: report.browser?.passed, failed: report.browser?.failed }, reportPath: path.relative(process.cwd(), reportPath), failures: report.failures.slice(0, 6) }, null, 2));
}
process.exit(report.ok ? 0 : 1);
