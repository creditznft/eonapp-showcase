#!/usr/bin/env node
/** W460: source-only guard against active emission of retired public routes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { COMPATIBILITY_ROUTES, INFORMATIONAL_ROUTES, PRIMARY_APP_ROUTES, RETIRED_REDIRECTS } from '../config/route-contract.mjs';
import {
  W452B_PRODUCTION_ROUTE_EMISSION_CLEANUP_SCHEMA,
  W452B_RETIRED_EMISSION_ALIASES,
  validateW452bProductionRouteEmissionCleanupContract
} from '../config/w452b-production-route-emission-cleanup-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readAt = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aliasAlternation = W452B_RETIRED_EMISSION_ALIASES.map((value) => escapeRegex(value)).join('|');

// Match actual emitted literal destinations, not a normalizer, redirect table,
// comment, source filename or inbound compatibility parser.
const ACTIVE_RUNTIME_EMISSION_PATTERN = new RegExp(String.raw`(?:(?:\bhref|\burl|\broute|\breturnRoute|\bdestination|\bsetupUrl)\s*[:=]\s*|window\.location\.(?:assign|replace)\s*\()\s*["'](?:${aliasAlternation})(?:[?#][^"']*)?["']`, 'g');
const HTML_HREF_EMISSION_PATTERN = new RegExp(String.raw`\bhref\s*=\s*["'](?:${aliasAlternation})(?:[?#][^"']*)?["']`, 'g');
const count = (source, pattern) => [...source.matchAll(pattern)].length;

function currentRouteDocuments() {
  return [...new Set([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES].map((route) => route.file).filter(Boolean))].sort();
}

function requiredRedirectsAreDeclared() {
  const map = new Map([...COMPATIBILITY_ROUTES, ...RETIRED_REDIRECTS].map((route) => [route.from, route]));
  const expected = Object.freeze({
    '/chat': '/', '/chat.html': '/',
    '/trade': '/insights', '/trade.html': '/insights',
    '/realm': '/eoncity', '/realmworld': '/eoncity', '/game': '/eoncity', '/games': '/eoncity',
    '/marketplace': '/create', '/marketplace.html': '/create',
    '/workbench': '/workspace', '/workbench.html': '/workspace',
    '/eon-browser': '/workspace', '/eon-browser.html': '/workspace'
  });
  return Object.entries(expected).every(([from, to]) => map.get(from)?.to === to && map.get(from)?.status === 301);
}

export function inspectW452bProductionRouteEmissionCleanup({ writeArtifact = false } = {}) {
  const errors = [...validateW452bProductionRouteEmissionCleanupContract()];
  const activeFence = auditActiveSurfaceImports({ root });
  const documents = currentRouteDocuments();
  const missingDocuments = documents.filter((file) => !exists(file));
  const htmlHits = [];
  const runtimeHits = [];

  for (const relative of documents) {
    const matches = count(readAt(relative), HTML_HREF_EMISSION_PATTERN);
    if (matches) htmlHits.push(Object.freeze({ file: relative, count: matches }));
  }
  for (const relative of activeFence.reachableModules) {
    if (!/\.(?:js|mjs)$/i.test(relative)) continue;
    const matches = count(readAt(relative), ACTIVE_RUNTIME_EMISSION_PATTERN);
    if (matches) runtimeHits.push(Object.freeze({ file: relative, count: matches }));
  }

  if (!activeFence.ok) errors.push('W452.2 requires the active import fence to be clean.');
  if (missingDocuments.length) errors.push(`W452.2 current route documents missing: ${missingDocuments.join(', ')}.`);
  if (htmlHits.length) errors.push(`W452.2 current HTML emits retired destinations: ${htmlHits.map((hit) => hit.file).join(', ')}.`);
  if (runtimeHits.length) errors.push(`W452.2 active runtime emits retired destinations: ${runtimeHits.map((hit) => hit.file).join(', ')}.`);
  if (!requiredRedirectsAreDeclared()) errors.push('W452.2 route contract must retain declared retired aliases as explicit 301 redirects to canonical destinations.');

  const report = Object.freeze({
    schema: W452B_PRODUCTION_ROUTE_EMISSION_CLEANUP_SCHEMA,
    wave: 'W460',
    sourceOnly: true,
    status: errors.length ? 'fail' : 'pass',
    activeModuleCount: activeFence.moduleCount,
    inspectedCurrentDocumentCount: documents.length,
    htmlRetiredAliasHits: Object.freeze(htmlHits),
    activeRuntimeRetiredAliasHits: Object.freeze(runtimeHits),
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'Literal source inspection only: dynamic external URLs, browser history, production redirect caching and service-worker behaviour require separate live proof.',
      'This gate intentionally permits aliases inside the central route contract and inbound normalizers; it prevents current public HTML and reachable runtime modules from emitting them.'
    ])
  });

  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w452b-production-route-emission-cleanup-gate');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW452bProductionRouteEmissionCleanup({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W452.2 production route-emission cleanup gate passed (${report.activeModuleCount} active modules; ${report.inspectedCurrentDocumentCount} current documents).\n`);
}
