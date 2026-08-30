#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  W452_APP_SHELL_QUALITY_SCHEMA,
  W452_BILLING_COPY_REQUIREMENTS,
  W452_CANONICAL_PUBLIC_ROUTES,
  validateW452AppShellQualityContract
} from '../config/w452-app-shell-quality-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const fail = (condition, message, errors) => { if (!condition) errors.push(message); };

// User-facing navigation only. Compatibility parsers may still recognize an
// incoming historical path; this gate deliberately ignores comparison lists
// and redirect normalizers and catches actual href/route/return destinations.
const LEGACY_CHAT_NAVIGATION_PATTERN = /(?:(?:\bhref|\burl|\broute|\breturnRoute|\bdestination|\bsetupUrl)\s*[:=]\s*|\breturn\s+|\blocation\.(?:assign|replace)\s*\()\s*["']\/chat(?:\.html)?(?:[?#][^"']*)?["']/g;
const LEGACY_CHAT_HTML_HREF_PATTERN = /\bhref\s*=\s*["']\/chat(?:\.html)?(?:[?#][^"']*)?["']/g;

function routeDocuments() {
  return [...new Set([
    ...PRIMARY_APP_ROUTES,
    ...INFORMATIONAL_ROUTES,
    ...COMPATIBILITY_ROUTES
  ].map((route) => route.file).filter(Boolean).concat(['404.html', 'offline.html']))].sort();
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

export function inspectW452AppShellQuality({ writeArtifact = false } = {}) {
  const errors = [...validateW452AppShellQualityContract()];
  const activeFence = auditActiveSurfaceImports({ root });
  const documents = routeDocuments();
  const missingDocuments = documents.filter((file) => !exists(file));
  const documentLegacyHrefHits = [];
  const activeModuleLegacyNavigationHits = [];

  for (const file of documents) {
    const source = read(file);
    const count = countMatches(source, LEGACY_CHAT_HTML_HREF_PATTERN);
    if (count) documentLegacyHrefHits.push({ file, count });
  }

  for (const file of activeFence.reachableModules) {
    if (!/\.(?:js|mjs)$/i.test(file)) continue;
    const source = read(file);
    const count = countMatches(source, LEGACY_CHAT_NAVIGATION_PATTERN);
    if (count) activeModuleLegacyNavigationHits.push({ file, count });
  }

  const shell = read('assets/js/utils/site-shell.js');
  const billingPage = read('billing.html');
  const shellRuntime = read('assets/js/eon-app-shell.js');

  fail(activeFence.ok, 'Active import fence must be clean before navigation quality can certify.', errors);
  fail(missingDocuments.length === 0, `Missing current route/system documents: ${missingDocuments.join(', ') || 'none'}.`, errors);
  fail(documentLegacyHrefHits.length === 0, `Current route/system HTML still links to legacy Chat aliases: ${documentLegacyHrefHits.map((hit) => hit.file).join(', ') || 'none'}.`, errors);
  fail(activeModuleLegacyNavigationHits.length === 0, `Current active runtime still navigates to legacy Chat aliases: ${activeModuleLegacyNavigationHits.map((hit) => hit.file).join(', ') || 'none'}.`, errors);
  fail(/\{ href: '\/', label: 'Chat'/.test(shell), 'Desktop shell must link Chat directly to the canonical root.', errors);
  fail(/\{ href: '\/', label: 'Chat', icon: '💬'/.test(shell), 'Mobile shell must link Chat directly to the canonical root.', errors);
  fail(/normalized === '\/' \|\| normalized === '\/chat' \|\| normalized === '\/chat\.html'/.test(shell), 'Shell must recognize legacy inbound Chat aliases without emitting them.', errors);
  fail(!/window\.open\([^)]*(?:billing|checkout)/i.test(shellRuntime), 'App shell must not bypass the canonical Billing page or server status check.', errors);
  fail(/Billing status & plan|Open Billing status/.test(shellRuntime), 'App shell must expose the canonical Billing status and plan surface.', errors);
  fail(/data-billing-provider="dodo"/.test(billingPage) && /data-checkout-authority="server-only"/.test(billingPage), 'Billing must declare Dodo and server-only checkout authority.', errors);
  for (const phrase of W452_BILLING_COPY_REQUIREMENTS) fail(billingPage.includes(phrase), `Billing page is missing required transparent copy: ${phrase}`, errors);
  fail(!/<h2>Future wallet policy<\/h2>/i.test(billingPage), 'Billing page must not preserve a future wallet activation lane.', errors);
  fail(!/href="\/chat(?:\.html)?(?:[?\"]|$)/.test(billingPage), 'Billing page must not link through a legacy Chat alias.', errors);
  fail((billingPage.match(/href="\/legal"/g) || []).length <= 1, 'Billing footer must not duplicate the Product boundary link.', errors);

  const report = Object.freeze({
    schema: W452_APP_SHELL_QUALITY_SCHEMA,
    wave: 'W452',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    canonicalRoutes: W452_CANONICAL_PUBLIC_ROUTES,
    activeModuleCount: activeFence.moduleCount,
    inspectedDocumentCount: documents.length,
    documentLegacyHrefHits: Object.freeze(documentLegacyHrefHits),
    activeModuleLegacyNavigationHits: Object.freeze(activeModuleLegacyNavigationHits),
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This source gate does not replace browser, screen-reader, device, viewport or production redirect testing.',
      'Inbound legacy aliases remain supported only through the route contract and parsing compatibility; this gate prevents current UI from emitting them.'
    ])
  });

  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w452-app-shell-quality-gate');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW452AppShellQuality({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W452 app-shell quality gate passed (${report.activeModuleCount} active modules; ${report.inspectedDocumentCount} route/system documents).\n`);
}
