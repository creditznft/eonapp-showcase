#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPATIBILITY_ROUTES,
  HOME_REDIRECT,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS,
  ROUTE_CONTRACT_VERSION,
  createStaticRouteFileMap,
  getRouteRow,
  targetToFile,
  validateRouteContract
} from '../config/route-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const outDir = path.join(root, 'reports', 'w217-phase1');
fs.mkdirSync(outDir, { recursive: true });

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const routeFiles = createStaticRouteFileMap();
const errors = [...validateRouteContract()];

function parseRedirectFile(file) {
  const rows = [];
  for (const line of read(file).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [from, to, rawStatus] = trimmed.split(/\s+/);
    rows.push({ from, to, status: Number(rawStatus || 200) });
  }
  return rows;
}

function assertRedirectContract() {
  const baseline = parseRedirectFile('_redirects');
  const publicCopy = parseRedirectFile('public/_redirects');
  const signatures = (rows) => rows.map((row) => `${row.from} ${row.to} ${row.status}`);
  if (JSON.stringify(signatures(baseline)) !== JSON.stringify(signatures(publicCopy))) errors.push('_redirects and public/_redirects differ.');
  const origins = new Set();
  for (const row of baseline) {
    if (origins.has(row.from)) errors.push(`Duplicate redirect origin: ${row.from}`);
    origins.add(row.from);
  }
  for (const expected of [HOME_REDIRECT, ...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES, ...RETIRED_REDIRECTS]) {
    const actual = baseline.find((row) => row.from === expected.from);
    if (!actual || actual.to !== expected.to || actual.status !== expected.status) {
      errors.push(`Redirect mismatch: ${expected.from} must be ${expected.to} ${expected.status}.`);
    }
  }
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHref(href) {
  if (!href || /^(?:https?:|mailto:|tel:|sms:|javascript:|data:|blob:|#|\/\/)/i.test(href)) return null;
  return href;
}

function resolveInternalPath(rawPath) {
  const pathname = String(rawPath || '').split('?')[0].split('#')[0] || '/';
  if (routeFiles.has(pathname)) return { ok: true, file: routeFiles.get(pathname), via: 'route-contract' };
  if (pathname.endsWith('.html')) return { ok: exists(pathname.replace(/^\//, '')), file: pathname.replace(/^\//, ''), via: 'html-file' };
  const candidate = `${pathname.replace(/^\//, '')}.html`;
  return { ok: exists(candidate), file: candidate, via: 'clean-html' };
}

function elementIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) ids.add(match[1]);
  for (const match of html.matchAll(/<a\b[^>]*\bname=["']([^"']+)["'][^>]*>/gi)) ids.add(match[1]);
  return ids;
}

function extractHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

assertRedirectContract();

const primaryRows = PRIMARY_APP_ROUTES.map((route) => {
  const pageExists = exists(route.file);
  const text = pageExists ? visibleText(read(route.file)) : '';
  const missingMarkers = (route.expected || []).filter((needle) => !text.toLowerCase().includes(needle.toLowerCase()));
  if (!pageExists) errors.push(`Primary route source is missing: ${route.from} -> ${route.file}`);
  if (missingMarkers.length) errors.push(`Primary route source is stale: ${route.from} missing ${missingMarkers.join(', ')}`);
  return { route: route.from, file: route.file, lifecycle: route.lifecycle, exists: pageExists, missingMarkers };
});

const compatibilityRows = COMPATIBILITY_ROUTES
  .filter((route) => !route.from.includes('*'))
  .map((route) => ({ route: route.from, file: route.file, lifecycle: route.lifecycle, exists: exists(route.file) }));
for (const row of compatibilityRows) if (!row.exists) errors.push(`Compatibility route source is missing: ${row.route} -> ${row.file}`);

const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();
const missingLinks = [];
const missingFragments = [];
for (const source of htmlFiles) {
  const html = read(source);
  for (const href of extractHrefs(html)) {
    const normalized = normalizeHref(href);
    if (!normalized) continue;
    const resolved = resolveInternalPath(normalized);
    if (!resolved.ok) {
      missingLinks.push({ source, href, target: resolved.file });
      continue;
    }
    const [, fragment] = normalized.split('#');
    if (fragment) {
      const ids = elementIds(read(resolved.file));
      if (!ids.has(decodeURIComponent(fragment.split('?')[0]))) missingFragments.push({ source, href, target: resolved.file, fragment });
    }
  }
}
for (const row of missingLinks) errors.push(`Broken internal link: ${row.source} -> ${row.href} (${row.target})`);
for (const row of missingFragments) errors.push(`Broken fragment: ${row.source} -> ${row.href} (${row.target}#${row.fragment})`);

const result = {
  schema: 'eonapp.gpt55.route-truth-device-audit.v2',
  routeContractVersion: ROUTE_CONTRACT_VERSION,
  checkedAt: new Date().toISOString(),
  ok: errors.length === 0,
  primaryRoutes: primaryRows,
  compatibilityRoutes: compatibilityRows,
  retiredRouteCount: RETIRED_REDIRECTS.length,
  htmlFileCount: htmlFiles.length,
  missingLinkCount: missingLinks.length,
  missingFragmentCount: missingFragments.length,
  errors,
  browserProofRequired: [
    'Run the production/preview Playwright route matrix in a permitted browser environment.',
    'Verify every 301 route resolves without loops at Cloudflare Pages.',
    'Verify mobile portrait, mobile landscape, and desktop paths after deployment.'
  ]
};

fs.writeFileSync(path.join(outDir, 'ROUTE_TRUTH_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
const report = `# W217 Phase 1 — Route Truth Audit\n\n- Contract: ${ROUTE_CONTRACT_VERSION}\n- Result: ${result.ok ? 'PASS' : 'FAIL'}\n- Primary routes: ${primaryRows.length}\n- Retired aliases: ${RETIRED_REDIRECTS.length}\n- HTML files checked: ${htmlFiles.length}\n- Broken links: ${missingLinks.length}\n- Broken fragments: ${missingFragments.length}\n\n## Primary route matrix\n\n| Route | Source | Lifecycle | Result |\n|---|---|---|---|\n${primaryRows.map((row) => `| ${row.route} | ${row.file} | ${row.lifecycle} | ${row.exists && row.missingMarkers.length === 0 ? 'PASS' : `FAIL: ${row.missingMarkers.join(', ') || 'missing source'}`} |`).join('\n')}\n\n## Errors\n\n${errors.length ? errors.map((error) => `- ${error}`).join('\n') : 'None.'}\n\n## Browser proof still required\n\n${result.browserProofRequired.map((line) => `- ${line}`).join('\n')}\n`;
fs.writeFileSync(path.join(outDir, 'ROUTE_TRUTH_AUDIT.md'), report);
console.log(JSON.stringify({ ok: result.ok, errors: errors.length, primaryRoutes: primaryRows.length, retiredAliases: RETIRED_REDIRECTS.length }, null, 2));
if (errors.length) process.exit(1);
