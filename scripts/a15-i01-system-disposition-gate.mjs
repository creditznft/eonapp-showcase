#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A15_BUILD_HTML_ENTRY_FILES,
  A15_CURRENT_PRODUCT_ROUTE_FILES,
  A15_EMITTED_COMPATIBILITY_FILES,
  A15_REDIRECT_ONLY_COMPATIBILITY_FILES,
  A15_SYSTEM_HTML_DOCUMENTS,
  validateA15CurrentProductAuthority
} from '../config/a15-current-product-authority.mjs';
import {
  A15_DISPOSITIONS,
  A15_DISPOSITION_OWNERS,
  A15_HISTORICAL_PREFIXES,
  A15_NON_RUNTIME_PREFIXES,
  A15_SYSTEM_DISPOSITION_SCHEMA,
  validateA15SystemDispositionContract
} from '../config/a15-system-disposition-contract.mjs';
import {
  A15_REPOSITORY_ROOT,
  buildModuleClosure,
  inspectModuleImports,
  normalizeRepoPath,
  parseHtmlModuleEntries,
  sha256
} from './lib/a15-source-authority.mjs';

const ROOT = A15_REPOSITORY_ROOT;
const OUT_DIR = path.join(ROOT, 'config/generated');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const normal = (value) => normalizeRepoPath(value);
const startsWithAny = (file, prefixes) => prefixes.some((prefix) => file.startsWith(prefix));
const isJs = (file) => /\.(?:js|mjs|cjs)$/i.test(file);
const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(normal).sort();
const trackedSet = new Set(trackedFiles);

function extractAllLocalScriptEntries(htmlFile) {
  const absolute = path.join(ROOT, htmlFile);
  if (!existsSync(absolute)) return [];
  const source = readFileSync(absolute, 'utf8');
  const entries = new Set(parseHtmlModuleEntries(htmlFile, { root: ROOT }));
  for (const match of source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const specifier = match[1].split('?')[0].split('#')[0];
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
    const normalized = normal(specifier);
    if (existsSync(path.join(ROOT, normalized))) entries.add(normalized);
  }
  return [...entries].sort();
}

const buildEntries = A15_BUILD_HTML_ENTRY_FILES.flatMap(extractAllLocalScriptEntries);
const activeClosure = buildModuleClosure(buildEntries, { root: ROOT });
const activeModules = new Set(activeClosure.modules);
const currentRoutes = new Set(A15_CURRENT_PRODUCT_ROUTE_FILES);
const emittedCompatibility = new Set(A15_EMITTED_COMPATIBILITY_FILES);
const redirectOnlyDocuments = new Set(A15_REDIRECT_ONLY_COMPATIBILITY_FILES);
const systemDocuments = new Set(A15_SYSTEM_HTML_DOCUMENTS);

const missingImportsByFile = new Map();
for (const file of trackedFiles.filter(isJs)) {
  const inspected = inspectModuleImports(file, { root: ROOT });
  if (inspected.unresolved.length) missingImportsByFile.set(file, [...inspected.unresolved]);
}

function ownerFor(file) {
  if (file.startsWith('assets/js/city/')) return A15_DISPOSITION_OWNERS.city;
  if (file.startsWith('functions/') || file.startsWith('migrations/')) return A15_DISPOSITION_OWNERS.backend;
  if (file.startsWith('tests/') || file.startsWith('e2e/')) return A15_DISPOSITION_OWNERS.test;
  if (startsWithAny(file, A15_HISTORICAL_PREFIXES)) return A15_DISPOSITION_OWNERS.archive;
  if (file.startsWith('docs/institutional/a15/')) return A15_DISPOSITION_OWNERS.evidence;
  if (file.startsWith('docs/')) return A15_DISPOSITION_OWNERS.archive;
  if (file.startsWith('scripts/') || file.startsWith('config/') || file === 'vite.config.mjs' || file === 'package.json' || file === 'package-lock.json') return A15_DISPOSITION_OWNERS.release;
  if (/^(?:assets\/css|assets\/fonts|assets\/img|public)\//.test(file)) return A15_DISPOSITION_OWNERS.static;
  return A15_DISPOSITION_OWNERS.core;
}

function classify(file) {
  const missingImports = missingImportsByFile.get(file) || [];
  if (activeModules.has(file)) return ['active-runtime', 'keep-active-runtime', 'Reachable from a status-200 emitted route document.'];
  if (currentRoutes.has(file)) return ['current-route-document', 'keep-current-route', 'Declared by the current product route authority.'];
  if (emittedCompatibility.has(file)) return ['emitted-compatibility-document', 'keep-emitted-compatibility', 'Emitted only for bounded compatibility; not current product authority.'];
  if (systemDocuments.has(file)) return ['system-document', 'keep-system-document', 'Required recovery or fallback document.'];
  if (redirectOnlyDocuments.has(file)) return ['redirect-only-document', 'quarantine-retired-document', 'Cloudflare redirect authority replaces this document; it must not be emitted.'];
  if (missingImports.length) return ['inactive-missing-import', 'quarantine-missing-import', 'Inactive source has unresolved local imports and cannot be reactivated without a current review.'];
  if (startsWithAny(file, A15_HISTORICAL_PREFIXES)) return ['historical', 'archive-historical-evidence', 'Historical evidence is preserved outside current runtime authority.'];
  if (file.startsWith('docs/institutional/a15/')) return ['current-evidence', 'keep-current-evidence', 'Current A15 institutional plan or evidence.'];
  if (file.startsWith('docs/')) return ['historical-documentation', 'archive-historical-evidence', 'Documentation predates the A15 current authority unless explicitly promoted.'];
  if (startsWithAny(file, A15_NON_RUNTIME_PREFIXES)) return file.startsWith('tests/') || file.startsWith('e2e/')
    ? ['test-only', 'keep-current-test', 'Test source remains outside production runtime.']
    : ['release-support', 'keep-current-release-tooling', 'Repository or CI support source.'];
  if (file.startsWith('functions/')) return ['backend-function', 'keep-current-backend', 'Cloudflare Function remains source-controlled pending later endpoint disposition waves.'];
  if (file.startsWith('migrations/')) return ['database-migration', 'keep-current-migration', 'Ordered migration evidence remains source-controlled.'];
  if (file.startsWith('config/') || file.startsWith('scripts/') || ['vite.config.mjs', 'package.json', 'package-lock.json', '_headers', '_redirects', 'wrangler.toml'].includes(file)) return ['release-tooling', 'keep-current-release-tooling', 'Current source/build/test/release authority or input.'];
  if (/^(?:assets\/css|assets\/fonts|assets\/img|public)\//.test(file) || /\.(?:glb|gltf|png|jpe?g|webp|svg|woff2?|mp3|wav|ogg|webmanifest)$/i.test(file)) return ['shipping-static-or-candidate', 'keep-shipping-static', 'Static product asset remains shipping or candidate material; built-artifact ownership is verified later.'];
  if (file.endsWith('.html')) return ['orphan-document', 'review-before-quarantine', 'Document is outside current route/build authority and requires redirect proof before removal.'];
  if (file.startsWith('assets/js/')) return ['inactive-runtime-candidate', 'review-before-quarantine', 'Not reachable from current emitted route entries; no reactivation without import closure and owner review.'];
  return ['repository-support', 'review-before-quarantine', 'Tracked source requires an explicit later reduction decision.'];
}

const records = trackedFiles.map((file) => {
  const [reachability, disposition, reason] = classify(file);
  return Object.freeze({
    file,
    owner: ownerFor(file),
    reachability,
    disposition,
    missingLocalImports: Object.freeze(missingImportsByFile.get(file) || []),
    reason
  });
});

const counts = {};
for (const record of records) counts[record.disposition] = (counts[record.disposition] || 0) + 1;
const activeMissingImports = records.filter((record) => record.disposition === 'keep-active-runtime' && record.missingLocalImports.length);
const quarantinedInActiveGraph = records.filter((record) => activeModules.has(record.file) && record.disposition.startsWith('quarantine-'));
const archivedInActiveGraph = records.filter((record) => activeModules.has(record.file) && record.disposition === 'archive-historical-evidence');
const unclassified = records.filter((record) => !A15_DISPOSITIONS.includes(record.disposition) || !record.owner || !record.reachability);
const missingTrackedBuildDocuments = A15_BUILD_HTML_ENTRY_FILES.filter((file) => !trackedSet.has(file));
const redirectDocumentsInBuild = A15_REDIRECT_ONLY_COMPATIBILITY_FILES.filter((file) => A15_BUILD_HTML_ENTRY_FILES.includes(file));
const errors = [
  ...validateA15CurrentProductAuthority(),
  ...validateA15SystemDispositionContract(),
  ...(activeClosure.unresolved.length ? [`Active route graph has unresolved local imports: ${JSON.stringify(activeClosure.unresolved)}`] : []),
  ...(activeMissingImports.length ? [`Active files have missing imports: ${activeMissingImports.map((row) => row.file).join(', ')}`] : []),
  ...(quarantinedInActiveGraph.length ? [`Quarantined files are active: ${quarantinedInActiveGraph.map((row) => row.file).join(', ')}`] : []),
  ...(archivedInActiveGraph.length ? [`Archived files are active: ${archivedInActiveGraph.map((row) => row.file).join(', ')}`] : []),
  ...(unclassified.length ? [`Unclassified files: ${unclassified.map((row) => row.file).join(', ')}`] : []),
  ...(missingTrackedBuildDocuments.length ? [`Build documents are not tracked: ${missingTrackedBuildDocuments.join(', ')}`] : []),
  ...(redirectDocumentsInBuild.length ? [`Redirect-only documents are build inputs: ${redirectDocumentsInBuild.join(', ')}`] : [])
];

const systemFamilies = new Map();
for (const record of records) {
  const family = record.file.startsWith('assets/js/city/') ? 'assets/js/city'
    : record.file.startsWith('assets/js/') ? `assets/js/${record.file.split('/')[2] || '(root)'}`
    : record.file.startsWith('functions/') ? `functions/${record.file.split('/')[1] || '(root)'}`
    : record.file.startsWith('tests/') ? 'tests'
    : record.file.startsWith('docs/institutional/a15/') ? 'docs/institutional/a15'
    : record.file.split('/')[0];
  const key = `${family}\0${record.owner}\0${record.disposition}`;
  const current = systemFamilies.get(key) || { family, owner: record.owner, disposition: record.disposition, fileCount: 0 };
  current.fileCount += 1;
  systemFamilies.set(key, current);
}

const registryCore = {
  schema: A15_SYSTEM_DISPOSITION_SCHEMA,
  sourceBaseline: 'fdc92595ca6d8fb941f45afb598a4a282dc70e62',
  status: errors.length ? 'fail' : 'pass',
  trackedFileCount: records.length,
  activeRuntimeModuleCount: activeModules.size,
  buildEntryCount: A15_BUILD_HTML_ENTRY_FILES.length,
  dispositionCounts: Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))),
  inactiveMissingImportFileCount: records.filter((record) => record.disposition === 'quarantine-missing-import').length,
  activeMissingImportFileCount: activeMissingImports.length,
  systemFamilies: [...systemFamilies.values()].sort((a, b) => `${a.family}\0${a.disposition}`.localeCompare(`${b.family}\0${b.disposition}`)),
  records,
  errors,
  invariants: [
    'Every tracked file has one owner, reachability class and disposition.',
    'No archived or quarantined module is reachable from current status-200 build entries.',
    'Redirect-only compatibility HTML is not a Vite input.',
    'Inactive missing-import modules remain quarantined and cannot be reactivated by source presence alone.'
  ]
};
const registry = { ...registryCore, digest: sha256(JSON.stringify(registryCore)) };

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'a15-system-disposition-registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I01_SYSTEM_DISPOSITION_RECEIPT.json'), `${JSON.stringify({
  schema: 'eonapp.a15.i01.system-disposition-receipt.v1',
  status: registry.status,
  trackedFileCount: registry.trackedFileCount,
  activeRuntimeModuleCount: registry.activeRuntimeModuleCount,
  inactiveMissingImportFileCount: registry.inactiveMissingImportFileCount,
  dispositionCounts: registry.dispositionCounts,
  registry: 'config/generated/a15-system-disposition-registry.json',
  registryDigest: registry.digest,
  errors: registry.errors
}, null, 2)}\n`);

console.log(`[A15 I01] ${registry.status.toUpperCase()}: ${registry.trackedFileCount} tracked files, ${registry.activeRuntimeModuleCount} active modules, ${registry.inactiveMissingImportFileCount} missing-import files quarantined.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I01] ${error}`);
  process.exitCode = 1;
}
