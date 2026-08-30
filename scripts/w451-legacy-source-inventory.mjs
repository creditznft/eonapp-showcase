#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import {
  W451_HISTORICAL_ROOTS,
  W451_IGNORED_ROOTS,
  W451_LEGACY_INVENTORY_SCHEMA,
  W451_NON_RUNTIME_PREFIXES,
  validateW451LegacyInventoryContract
} from '../config/w451-legacy-source-inventory-contract.mjs';
import { W449_SYSTEM_HTML_DOCUMENTS } from '../config/w449-production-cleanroom-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normal = (value) => String(value || '').replaceAll('\\', '/');
const relative = (file) => normal(path.relative(root, file));
const startsWithOneOf = (file, roots) => roots.some((prefix) => file.startsWith(prefix));
const staticFiles = new Set([
  'package.json', 'package-lock.json', 'vite.config.mjs', 'sw.js', '_headers', '_redirects', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml', '404.html', 'offline.html'
]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const rel = relative(full);
    if (entry.isDirectory()) {
      if (!startsWithOneOf(`${rel}/`, W451_IGNORED_ROOTS)) walk(full, files);
      continue;
    }
    if (entry.isFile()) files.push(rel);
  }
  return files.sort();
}

function compatibilityFiles() {
  return new Set(COMPATIBILITY_ROUTES.map((row) => row.file).filter(Boolean));
}

function routeFiles() {
  return new Set([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES].map((row) => row.file).filter(Boolean));
}

function classify(file, context) {
  if (startsWithOneOf(file, W451_HISTORICAL_ROOTS)) return 'historical';
  if (startsWithOneOf(file, W451_NON_RUNTIME_PREFIXES)) return file.startsWith('tests/') || file.startsWith('e2e/') ? 'test-only' : 'release-tooling';
  if (context.activeModules.has(file)) return 'active-runtime';
  if (context.routeFiles.has(file)) return 'active-route-document';
  if (context.compatibilityFiles.has(file)) return 'compatibility-document';
  if (staticFiles.has(file) || file.startsWith('public/') || file.startsWith('functions/') || file.startsWith('migrations/')) return 'release-tooling';
  if (file.startsWith('assets/css/') || file.startsWith('assets/fonts/') || file.startsWith('assets/img/')) return 'review-before-quarantine';
  if (file.startsWith('assets/js/')) return 'review-before-quarantine';
  if (file.startsWith('config/') || file.startsWith('scripts/')) return 'release-tooling';
  return 'review-before-quarantine';
}

function summarize(records) {
  const counts = {};
  for (const record of records) counts[record.classification] = (counts[record.classification] || 0) + 1;
  return Object.freeze(counts);
}

export function buildW451LegacySourceInventory({ writeArtifact = false } = {}) {
  const errors = [...validateW451LegacyInventoryContract()];
  const activeFence = auditActiveSurfaceImports({ root });
  const activeModules = new Set(activeFence.reachableModules);
  const context = Object.freeze({ activeModules, routeFiles: routeFiles(), compatibilityFiles: compatibilityFiles() });
  const files = walk(root);
  const records = files.map((file) => Object.freeze({ file, classification: classify(file, context) }));
  const historicalActive = records.filter((record) => record.classification === 'historical' && activeModules.has(record.file));
  const missingRouteDocuments = [...context.routeFiles, ...context.compatibilityFiles, ...W449_SYSTEM_HTML_DOCUMENTS].filter((file) => !files.includes(file));
  const unclassified = records.filter((record) => !record.classification);

  if (!activeFence.ok) errors.push('Active import fence is not clean.');
  if (historicalActive.length) errors.push(`Historical material is reachable from active sources: ${historicalActive.map((record) => record.file).join(', ')}.`);
  if (missingRouteDocuments.length) errors.push(`Required route/system documents are missing: ${missingRouteDocuments.join(', ')}.`);
  if (unclassified.length) errors.push(`Unclassified source files found: ${unclassified.map((record) => record.file).join(', ')}.`);

  const report = Object.freeze({
    schema: W451_LEGACY_INVENTORY_SCHEMA,
    wave: 'W451',
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    activeModuleCount: activeFence.moduleCount,
    totalTrackedFiles: records.length,
    classifications: summarize(records),
    historicalRoots: W451_HISTORICAL_ROOTS,
    candidatesForHumanReview: Object.freeze(records.filter((record) => record.classification === 'review-before-quarantine').map((record) => record.file)),
    records: Object.freeze(records),
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This inventory does not delete, move or rewrite historical files.',
      'A candidate remains review-only until Codex confirms the canonical branch, build output and active import graph.',
      'No source-only classification is a production deployment or external provider proof.'
    ])
  });

  if (writeArtifact) {
    const output = path.join(root, 'artifacts', 'w451-legacy-source-inventory');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'inventory.json'), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(output, 'summary.md'), [
      '# W451 legacy source inventory',
      '',
      `- Status: **${report.status}**`,
      `- Active reachable modules: **${report.activeModuleCount}**`,
      `- Tracked source files: **${report.totalTrackedFiles}**`,
      '',
      '## Classification counts',
      '',
      ...Object.entries(report.classifications).sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => `- ${name}: ${count}`),
      '',
      '## Review-only candidates',
      '',
      ...report.candidatesForHumanReview.map((file) => `- \`${file}\``),
      ''
    ].join('\n'));
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildW451LegacySourceInventory({ writeArtifact: true });
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  process.stdout.write(`W451 legacy inventory passed (${report.totalTrackedFiles} tracked files; ${report.candidatesForHumanReview.length} review-only candidates).\n`);
}
