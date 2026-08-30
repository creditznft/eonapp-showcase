#!/usr/bin/env node
/**
 * W260-R3 A2 — all-route static delivery gate.
 *
 * This starts the local Cloudflare-equivalent static server and resolves every
 * route in CodexAuditPack/lighthouse-routes.json through internal redirects.
 * It deliberately validates route delivery only: a green result is NOT a
 * Lighthouse score, browser render, device result, or Cloudflare edge proof.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from './lhci-static-server.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const INVENTORY = path.join(ROOT, 'CodexAuditPack', 'lighthouse-routes.json');
const REPORT = path.join(ROOT, 'artifacts', 'W260_R3_A2_ALL_PUBLIC_ROUTES_STATIC_GATE_REPORT.json');
const MAX_REDIRECTS = 6;

export function isInternalLocation(location = '', origin = '') {
  try {
    const next = new URL(String(location || ''), origin);
    return next.origin === origin;
  } catch {
    return false;
  }
}

export function isRedirectStatus(status) {
  return [301, 302, 303, 307, 308].includes(Number(status));
}

async function startServer() {
  const server = await createStaticServer({ root: DIST });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Static route gate could not resolve a local listening port.');
  }
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

async function resolveRoute(origin, route) {
  let current = new URL(String(route || '/'), origin);
  const chain = [];
  for (let step = 0; step <= MAX_REDIRECTS; step += 1) {
    let response;
    try {
      response = await fetch(current, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
    } catch (error) {
      return { route, ok: false, chain, error: `request-error:${String(error?.message || error)}` };
    }
    const location = response.headers.get('location') || '';
    chain.push({ url: `${current.pathname}${current.search}`, status: response.status, location });
    if (isRedirectStatus(response.status)) {
      if (!location) return { route, ok: false, chain, error: 'redirect-without-location' };
      if (!isInternalLocation(location, origin)) return { route, ok: false, chain, error: 'redirect-leaves-local-origin' };
      current = new URL(location, current);
      continue;
    }
    if (response.status !== 200) return { route, ok: false, chain, error: `terminal-http-${response.status}` };
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/html')) return { route, ok: false, chain, error: `terminal-not-html:${contentType || 'missing'}` };
    return { route, ok: true, chain, final: `${current.pathname}${current.search}`, contentType };
  }
  return { route, ok: false, chain, error: `redirect-limit-exceeded:${MAX_REDIRECTS}` };
}

async function main() {
  const errors = [];
  if (!fs.existsSync(DIST)) errors.push('dist is missing; run npm run build before the all-route static gate.');
  if (!fs.existsSync(INVENTORY)) errors.push('Lighthouse route inventory is missing; run npm run lighthouse:routes before the all-route static gate.');
  let inventory = null;
  if (!errors.length) {
    try { inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8')); } catch { errors.push('Lighthouse route inventory is not valid JSON.'); }
  }
  const rows = Array.isArray(inventory?.routes) ? inventory.routes : [];
  if (!errors.length && !rows.length) errors.push('Lighthouse route inventory is empty.');
  if (!errors.length && new Set(rows.map((row) => row?.route)).size !== rows.length) errors.push('Lighthouse route inventory contains duplicate routes.');

  const report = {
    schema: 'eonapp.w260-r3.a2.all-public-routes-static-gate.v1',
    checkedAt: new Date().toISOString(),
    inventoryPath: path.relative(ROOT, INVENTORY),
    plannedRoutes: rows.length,
    passedRoutes: 0,
    failedRoutes: 0,
    ok: false,
    evidenceLimit: 'PASS proves only local static route delivery and internal redirect resolution. It is not a Lighthouse score, JavaScript render, browser/device result, PWA proof or Cloudflare edge result.',
    results: [],
    errors
  };

  if (!errors.length) {
    let running;
    try {
      running = await startServer();
      for (const row of rows) {
        const result = await resolveRoute(running.origin, row?.route);
        report.results.push({ source: row?.source || '', group: row?.group || '', ...result });
      }
    } catch (error) {
      report.errors.push(`server-error:${String(error?.message || error)}`);
    } finally {
      if (running?.server) await new Promise((resolve) => running.server.close(resolve));
    }
  }

  report.passedRoutes = report.results.filter((row) => row.ok).length;
  report.failedRoutes = report.results.filter((row) => !row.ok).length;
  report.ok = report.errors.length === 0 && report.plannedRoutes > 0 && report.failedRoutes === 0 && report.passedRoutes === report.plannedRoutes;
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) {
    console.error(JSON.stringify({ ok: false, plannedRoutes: report.plannedRoutes, passedRoutes: report.passedRoutes, failedRoutes: report.failedRoutes, errors: report.errors, sampleFailures: report.results.filter((row) => !row.ok).slice(0, 10) }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`W260-R3 A2 all-public-routes static gate: PASS (${report.passedRoutes}/${report.plannedRoutes} routes resolved to local HTML).`);
  }
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) main().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
