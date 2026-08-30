#!/usr/bin/env node
/**
 * W242 — active-source and public-output quarantine.
 *
 * This gate treats the route contract, built HTML allowlist, and reachable JS
 * graph as one release boundary. It does not claim Preview/device evidence.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES, ROUTE_CONTRACT_VERSION } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PRODUCT_MAP = path.join(ROOT, 'PRODUCT_MAP.md');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const toPosix = (value) => value.replaceAll('\\', '/');

function walkHtml(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) found.push(...walkHtml(next, relative));
    else if (entry.isFile() && entry.name.endsWith('.html')) found.push(relative);
  }
  return found.sort();
}

const routes = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES];
const allowedHtml = new Set(['404.html', 'offline.html']);
for (const route of routes) {
  if (route.file) allowedHtml.add(route.file);
  if (Number(route.status) === 200 && route.from && !route.from.includes('*')) {
    const clean = route.from.replace(/^\/+|\/+$/g, '');
    if (clean) allowedHtml.add(`${clean}/index.html`);
  }
}

assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before W242 quarantine.');
const emittedHtml = walkHtml(DIST);
const unexpectedHtml = emittedHtml.filter((relative) => !allowedHtml.has(relative));
const missingHtml = [...allowedHtml].filter((relative) => !emittedHtml.includes(relative));
assert(unexpectedHtml.length === 0, `unexpected public HTML output: ${unexpectedHtml.join(', ')}`);
assert(missingHtml.length === 0, `expected public HTML output missing: ${missingHtml.join(', ')}`);
for (const retiredDir of ['tools', 'games', 'blog', 'nowpayments', 'admin']) {
  assert(!fs.existsSync(path.join(DIST, retiredDir)), `retired directory emitted to dist/: ${retiredDir}`);
}

const imports = auditActiveSurfaceImports({ root: ROOT });
assert(imports.ok, `active import fence failed: ${[
  ...imports.legacyPrefixHits,
  ...imports.legacyValueHits,
  ...imports.forbiddenLiteralHits,
  ...imports.evmAddressLiteralHits
].join(', ')}`);

assert(fs.existsSync(PRODUCT_MAP), 'PRODUCT_MAP.md is missing.');
const productMap = fs.existsSync(PRODUCT_MAP) ? fs.readFileSync(PRODUCT_MAP, 'utf8') : '';
assert(productMap.includes(ROUTE_CONTRACT_VERSION), 'PRODUCT_MAP.md does not name the current route-contract version.');
assert(/W242/i.test(productMap), 'PRODUCT_MAP.md does not record the W242 quarantine boundary.');

const report = {
  schema: 'eonapp.w242.active-source-quarantine-report.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  routeContractVersion: ROUTE_CONTRACT_VERSION,
  allowedHtml: [...allowedHtml].sort(),
  emittedHtml,
  unexpectedHtml,
  missingHtml,
  activeSurface: {
    routeEntryCount: imports.routeEntryCount,
    moduleCount: imports.moduleCount,
    legacyPrefixHits: imports.legacyPrefixHits,
    legacyValueHits: imports.legacyValueHits,
    forbiddenLiteralHits: imports.forbiddenLiteralHits,
    evmAddressLiteralHits: imports.evmAddressLiteralHits
  },
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W242_ACTIVE_SOURCE_QUARANTINE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error('[W242] Active-source quarantine failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`[W242] PASS: ${emittedHtml.length} approved HTML files; ${imports.moduleCount} reachable modules; no legacy wallet/payment/contract runtime residue.`);
