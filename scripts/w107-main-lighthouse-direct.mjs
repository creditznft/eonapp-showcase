#!/usr/bin/env node
/**
 * Core Lighthouse runner.
 * W260-R3 A2: accepts Cloudflare-equivalent exact redirects from lhci-static-server,
 * writes a partial summary after every route, and fails closed when the browser
 * infrastructure returns a chrome-error page or an unusable report.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outDir = path.resolve(root, 'CodexAuditPack/w107-final-merge-prep/lighthouse-direct-main');
const port = Number(process.env.W107_LIGHTHOUSE_PORT || 4195);
const baseURL = `http://127.0.0.1:${port}`;
const routes = [
  ['home', '/'],
  ['chat', '/chat'],
  ['workspace', '/workspace'],
  ['vault', '/vault'],
  ['market', '/market'],
  ['trade', '/trade'],
  ['eoncity', '/eoncity'],
  ['local-ai', '/local-ai'],
  ['profile', '/profile'],
];
const thresholds = {
  performance: 0.82,
  accessibility: 0.88,
  'best-practices': 0.85,
  seo: 0.88,
};

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchReady(url) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

function killGroup(child, signal = 'SIGTERM') {
  if (!child?.pid) return;
  try { process.kill(-child.pid, signal); } catch { try { child.kill(signal); } catch {} }
}

async function waitForFileStable(filePath, timeoutMs) {
  const start = Date.now();
  let lastSize = -1;
  let stableHits = 0;
  while (Date.now() - start < timeoutMs) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 1000 && stat.size === lastSize) {
        stableHits += 1;
        if (stableHits >= 2) return true;
      } else {
        stableHits = 0;
        lastSize = stat.size;
      }
    } catch {}
    await sleep(500);
  }
  return false;
}

/** Returns a fail-closed classification; no score is accepted from a Chrome error page. */
export function classifyLighthouseReport(report = {}) {
  const finalUrl = String(report.finalUrl || '');
  const categories = Object.fromEntries(Object.entries(report.categories || {}).map(([key, value]) => [key, Number(value?.score)]));
  if (!finalUrl || finalUrl.startsWith('chrome-error://')) {
    return { usable: false, environmentBlocked: true, reason: 'chrome-error-final-url', categories };
  }
  const required = ['performance', 'accessibility', 'best-practices', 'seo'];
  if (required.some((key) => !Number.isFinite(categories[key]))) {
    return { usable: false, environmentBlocked: false, reason: 'missing-category-score', categories };
  }
  return { usable: true, environmentBlocked: false, reason: '', categories };
}

/**
 * Classifies Lighthouse CLI failures that occur before a page trace exists.
 * These markers are browser/runtime constraints, not EONAPP page scores. A
 * generic missing report remains fail-closed so transient CLI failures are not
 * silently treated as environmental blocks.
 */
export function classifyLighthouseCommandFailure(output = '') {
  const text = String(output || '');
  if (/\bNO_NAVSTART\b/i.test(text)) {
    return { environmentBlocked: true, reason: 'browser-navigation-trace-unavailable:no-navstart' };
  }
  if (/ERR_BLOCKED_BY_ADMINISTRATOR|URLBlocklist|blocked by administrator/i.test(text)) {
    return { environmentBlocked: true, reason: 'browser-navigation-blocked-by-policy' };
  }
  return { environmentBlocked: false, reason: 'report-not-created-before-timeout' };
}

function closeLog(child, log) {
  try { child.stdout?.unpipe(log); } catch {}
  try { child.stderr?.unpipe(log); } catch {}
  try { log.end(); } catch {}
}

async function runLighthouse(label, route) {
  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, '-');
  const prefix = path.join(outDir, safeLabel);
  const jsonPath = `${prefix}.report.json`;
  const htmlPath = `${prefix}.report.html`;
  const logPath = `${prefix}.cmd.log`;
  for (const file of [jsonPath, htmlPath, logPath]) fs.rmSync(file, { force: true });

  const args = [
    'node_modules/lighthouse/cli/index.js',
    `${baseURL}${route}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-background-networking --disable-extensions',
    '--preset=desktop',
    '--throttling-method=provided',
    '--max-wait-for-load=15000',
    '--pause-after-load=1000',
    '--pause-after-fcp=1000',
    '--disable-full-page-screenshot',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    '--output=html',
    `--output-path=${prefix}`,
    '--quiet',
  ];
  const log = fs.createWriteStream(logPath, { flags: 'a' });
  const child = spawn(process.execPath, args, { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let commandOutput = '';
  const captureOutput = (chunk) => {
    commandOutput = `${commandOutput}${String(chunk)}`.slice(-32768);
  };
  child.stdout.on('data', captureOutput);
  child.stderr.on('data', captureOutput);
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  let exit = null;
  child.on('exit', (code, signal) => { exit = { code, signal }; });

  const timeoutMs = Number(process.env.W107_LIGHTHOUSE_ROUTE_TIMEOUT_MS || 90000);
  const reportReady = await waitForFileStable(jsonPath, timeoutMs);
  // The CLI can leave a handle open after a report is written; never wait on its
  // stream forever. The report itself is the artefact and must still validate.
  if (!exit) {
    killGroup(child, reportReady ? 'SIGTERM' : 'SIGKILL');
    await sleep(300);
  }
  closeLog(child, log);

  if (!reportReady) {
    const failureClassification = classifyLighthouseCommandFailure(commandOutput);
    return {
      label, route, ok: false, reportReady: false, exit, terminatedAfterReport: false,
      jsonPath: path.relative(root, jsonPath), htmlPath: path.relative(root, htmlPath),
      failure: failureClassification.reason, environmentBlocked: failureClassification.environmentBlocked,
    };
  }

  let report;
  try {
    report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    return {
      label, route, ok: false, reportReady: true, exit, terminatedAfterReport: true,
      jsonPath: path.relative(root, jsonPath), htmlPath: path.relative(root, htmlPath),
      failure: `report-json-invalid:${String(error?.message || error)}`, environmentBlocked: false,
    };
  }
  const classification = classifyLighthouseReport(report);
  if (!classification.usable) {
    return {
      label, route, ok: false, reportReady: true, exit, terminatedAfterReport: true,
      jsonPath: path.relative(root, jsonPath), htmlPath: path.relative(root, htmlPath),
      categories: classification.categories, failure: classification.reason,
      environmentBlocked: classification.environmentBlocked,
      finalUrl: report.finalUrl || '',
    };
  }

  const audits = report.audits || {};
  const metrics = {
    firstContentfulPaintMs: audits['first-contentful-paint']?.numericValue ?? null,
    largestContentfulPaintMs: audits['largest-contentful-paint']?.numericValue ?? null,
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue ?? null,
    totalBlockingTimeMs: audits['total-blocking-time']?.numericValue ?? null,
    speedIndexMs: audits['speed-index']?.numericValue ?? null,
  };
  const thresholdChecks = Object.fromEntries(Object.entries(thresholds).map(([key, min]) => [key, { score: classification.categories[key], min, ok: classification.categories[key] >= min }]));
  const ok = Object.values(thresholdChecks).every((row) => row.ok);
  return {
    label, route, ok, reportReady: true, exit, terminatedAfterReport: true,
    categories: classification.categories, metrics, thresholdChecks,
    jsonPath: path.relative(root, jsonPath), htmlPath: path.relative(root, htmlPath),
    environmentBlocked: false, finalUrl: report.finalUrl || '',
  };
}

function writeSummary(results, stoppedEarly = false) {
  const blocked = results.find((row) => row.environmentBlocked) || null;
  const summary = {
    schema: 'eon.w107.core-lighthouse-summary.v2',
    generatedAt: new Date().toISOString(),
    baseURL,
    thresholds,
    plannedRouteCount: routes.length,
    executedRouteCount: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    ok: !stoppedEarly && results.length === routes.length && results.every((r) => r.ok),
    stoppedEarly,
    environmentBlocked: Boolean(blocked),
    blockedReason: blocked?.failure || '',
    claimFence: 'A missing/invalid browser trace or a Chrome error page is not page performance evidence. No Lighthouse pass may be claimed unless all planned routes produced usable reports and met thresholds.',
    results,
  };
  fs.writeFileSync(path.join(outDir, 'W107_MAIN_LIGHTHOUSE_SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return summary;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const serverLog = fs.openSync(path.join(outDir, 'server.log'), 'w');
  const server = spawn(process.execPath, ['scripts/lhci-static-server.mjs', '--port', String(port), '--root', 'dist'], { cwd: root, detached: true, stdio: ['ignore', serverLog, serverLog] });
  try {
    for (let i = 0; i < 80; i += 1) {
      if (await fetchReady(`${baseURL}/`)) break;
      if (server.exitCode !== null) throw new Error('local Lighthouse server exited early');
      await sleep(150);
    }
    if (!(await fetchReady(`${baseURL}/`))) throw new Error('local Lighthouse server did not become ready');
    const results = [];
    let stoppedEarly = false;
    for (const [label, route] of routes) {
      console.log(`[w107-lighthouse] ${label} ${route}`);
      const result = await runLighthouse(label, route);
      results.push(result);
      if (result.environmentBlocked) {
        stoppedEarly = true;
        console.error(`[w107-lighthouse] browser environment blocked: ${result.failure}`);
        writeSummary(results, stoppedEarly);
        break;
      }
      writeSummary(results, stoppedEarly);
    }
    const summary = writeSummary(results, stoppedEarly);
    console.log(JSON.stringify({ ok: summary.ok, plannedRouteCount: summary.plannedRouteCount, executedRouteCount: summary.executedRouteCount, passed: summary.passed, failed: summary.failed, environmentBlocked: summary.environmentBlocked, blockedReason: summary.blockedReason }, null, 2));
    process.exitCode = summary.ok ? 0 : 1;
  } finally {
    killGroup(server, 'SIGTERM');
    await sleep(250);
    fs.closeSync(serverLog);
  }
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
