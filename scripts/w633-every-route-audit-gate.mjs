#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { inspectW452bProductionRouteEmissionCleanup } from './w452b-production-route-emission-cleanup-gate.mjs';
import {
  COMPATIBILITY_ROUTES,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS,
  renderCloudflareRedirects
} from '../config/route-contract.mjs';
import {
  W633_ADVANCED_NAVIGATION_DESTINATIONS,
  W633_CANONICAL_OVERRIDE_BY_FILE,
  W633_ROUTE_AUDIT_SCHEMA,
  W633_SOURCE_ONLY_ALIAS_DOCUMENTS,
  validateW633RouteGraph
} from '../config/w633-every-route-audit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const allRows = Object.freeze([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES]);
const publicRows = Object.freeze([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES.filter((row) => Number(row.status) === 200)]);
const emittedFiles = Object.freeze([...new Set(allRows.map((row) => row.file).filter(Boolean).concat(['404.html', 'offline.html']))].sort());
const publicFiles = Object.freeze([...new Set(publicRows.map((row) => row.file).filter(Boolean))].sort());
const retiredExactPaths = new Set(RETIRED_REDIRECTS.filter((row) => !row.from.includes('*')).map((row) => row.from));

function canonicalTags(source = '') {
  return [...String(source).matchAll(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi)]
    .map((match) => match[0].match(/\bhref=["']([^"']+)["']/i)?.[1] || '');
}

function internalHrefs(source = '') {
  return [...String(source).matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/'));
}

function expectedCanonicalForFile(file) {
  const override = W633_CANONICAL_OVERRIDE_BY_FILE[file];
  if (override) return `https://eonapp.ch${override}`;
  const route = publicRows.find((row) => row.file === file);
  if (!route || route.from.includes('*')) return '';
  return `https://eonapp.ch${route.from === '/' ? '/' : route.from}`;
}

function inspectRootHtmlClassification() {
  const rootHtml = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
  const rootEmittedFiles = emittedFiles.filter((file) => !file.includes('/'));
  const allowed = new Set([...rootEmittedFiles, ...W633_SOURCE_ONLY_ALIAS_DOCUMENTS]);
  return Object.freeze({
    rootHtml,
    undeclared: Object.freeze(rootHtml.filter((file) => !allowed.has(file))),
    missingEmitted: Object.freeze(rootEmittedFiles.filter((file) => !rootHtml.includes(file))),
    missingSourceOnly: Object.freeze(W633_SOURCE_ONLY_ALIAS_DOCUMENTS.filter((file) => !rootHtml.includes(file)))
  });
}

function inspectCanonicalDocuments() {
  const issues = [];
  for (const file of publicFiles) {
    const tags = canonicalTags(read(file));
    const expected = expectedCanonicalForFile(file);
    if (tags.length !== 1) issues.push(Object.freeze({ file, reason: 'canonical-count', expected: 1, actual: tags.length }));
    else if (expected && tags[0] !== expected) issues.push(Object.freeze({ file, reason: 'canonical-href', expected, actual: tags[0] }));
  }
  return Object.freeze(issues);
}

function inspectCurrentDocumentLinks() {
  const issues = [];
  for (const file of publicFiles) {
    for (const href of internalHrefs(read(file))) {
      const pathname = href.split(/[?#]/, 1)[0] || '/';
      if (pathname.endsWith('.html')) issues.push(Object.freeze({ file, href, reason: 'html-alias-emission' }));
      else if (retiredExactPaths.has(pathname)) issues.push(Object.freeze({ file, href, reason: 'retired-alias-emission' }));
    }
  }
  return Object.freeze(issues);
}

function inspectAdvancedNavigation() {
  const shell = read('assets/js/eon-app-shell.js');
  const navigation = read('assets/js/shell/eon-shell-navigation.js');
  const commandRegistry = read('assets/js/command/eon-command-registry.js');
  const issues = [];
  for (const destination of W633_ADVANCED_NAVIGATION_DESTINATIONS) {
    const ownerSource = destination.surface === 'utilities' ? navigation : commandRegistry;
    if (!ownerSource.includes(`href: '${destination.href}'`) && !ownerSource.includes(`href: "${destination.href}"`)) {
      issues.push(Object.freeze({ href: destination.href, reason: `missing-${destination.surface || 'discoverability'}-destination` }));
    }
    if (!navigation.includes(`${destination.id}: Object.freeze({ label:`) && !navigation.includes(`'${destination.id}': Object.freeze({ label:`)) {
      issues.push(Object.freeze({ href: destination.href, reason: 'missing-page-context-label' }));
    }
  }
  if (!/getEonShellPageLabel\(currentPage\)/.test(shell)) issues.push(Object.freeze({ href: '', reason: 'mobile-title-not-route-aware' }));
  return Object.freeze(issues);
}

export function inspectW633EveryRouteAudit({ writeArtifact = false } = {}) {
  const contract = JSON.parse(read('config/w633-every-route-audit-contract.json'));
  const graph = validateW633RouteGraph();
  const rootHtml = inspectRootHtmlClassification();
  const canonicalIssues = inspectCanonicalDocuments();
  const linkIssues = inspectCurrentDocumentLinks();
  const navigationIssues = inspectAdvancedNavigation();
  const activeFence = auditActiveSurfaceImports({ root });
  const retiredEmission = inspectW452bProductionRouteEmissionCleanup();
  const redirectText = renderCloudflareRedirects();
  const checks = [
    Object.freeze({ id: 'route-graph', pass: graph.ok, detail: graph.errors.join(' ') || `${graph.publicRouteCount} public routes; ${graph.redirectCount} one-hop redirects` }),
    Object.freeze({ id: 'ten-requirements', pass: contract.requirements.length === 10, detail: `${contract.requirements.length}/10` }),
    Object.freeze({ id: 'root-html-classified', pass: rootHtml.undeclared.length === 0 && rootHtml.missingEmitted.length === 0 && rootHtml.missingSourceOnly.length === 0, detail: `${rootHtml.rootHtml.length} root documents; ${rootHtml.undeclared.length} undeclared` }),
    Object.freeze({ id: 'source-only-aliases-not-built', pass: W633_SOURCE_ONLY_ALIAS_DOCUMENTS.every((file) => !emittedFiles.includes(file)), detail: `${W633_SOURCE_ONLY_ALIAS_DOCUMENTS.length} source-only aliases` }),
    Object.freeze({ id: 'canonical-documents', pass: canonicalIssues.length === 0, detail: `${publicFiles.length} public documents; ${canonicalIssues.length} canonical issues` }),
    Object.freeze({ id: 'clean-internal-links', pass: linkIssues.length === 0, detail: `${linkIssues.length} alias links` }),
    Object.freeze({ id: 'advanced-navigation', pass: navigationIssues.length === 0, detail: `${W633_ADVANCED_NAVIGATION_DESTINATIONS.length} destinations; ${navigationIssues.length} issues` }),
    Object.freeze({ id: 'active-import-fence', pass: activeFence.ok, detail: `${activeFence.moduleCount} reachable modules` }),
    Object.freeze({ id: 'retired-emission-fence', pass: retiredEmission.status === 'pass', detail: `${retiredEmission.htmlRetiredAliasHits.length + retiredEmission.activeRuntimeRetiredAliasHits.length} retired emissions` }),
    Object.freeze({ id: 'generated-redirects', pass: read('_redirects') === redirectText && read('public/_redirects') === redirectText, detail: `${Buffer.byteLength(redirectText)} generated bytes` }),
    Object.freeze({ id: 'real-evidence-pending', pass: contract.publicCertification === 'NO-GO' && contract.realEvidencePending.length === 6, detail: `${contract.realEvidencePending.length} external evidence lanes` })
  ];
  const report = Object.freeze({
    schema: W633_ROUTE_AUDIT_SCHEMA,
    wave: 'W633',
    sourceComplete: checks.every((entry) => entry.pass),
    publicCertification: 'NO-GO',
    ok: checks.every((entry) => entry.pass),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length,
    routeGraph: graph,
    rootHtml,
    canonicalIssues,
    linkIssues,
    navigationIssues,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'Source certification does not prove deployed Cloudflare redirect behaviour, CDN cache state, browser history, or service-worker update continuity.',
      'Desktop and mobile route walkthroughs remain owner/device evidence and are not fabricated by this gate.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'reports', 'w633-every-route-audit');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'receipt.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW633EveryRouteAudit({ writeArtifact: true });
  for (const check of report.checks) console.log(`[W633] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
  console.log(`[W633] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
  if (!report.ok) process.exitCode = 1;
}
