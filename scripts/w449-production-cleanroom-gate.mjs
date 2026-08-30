#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPATIBILITY_ROUTES, RETIRED_REDIRECTS } from '../config/route-contract.mjs';
import { A15_BUILD_HTML_ENTRY_FILES, A15_REDIRECT_ONLY_COMPATIBILITY_FILES } from '../config/a15-current-product-authority.mjs';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { W449_PRODUCTION_CLEANROOM_RULES, W449_QUARANTINE_OUTPUT_EXCEPTIONS, W449_QUARANTINE_ROOTS, W449_SYSTEM_HTML_DOCUMENTS, validateW449ProductionCleanroomContract } from '../config/w449-production-cleanroom-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const relative = (file) => path.relative(root, file).replaceAll('\\', '/');
const fail = (condition, message, errors) => { if (!condition) errors.push(message); };

function rootHtmlFiles() {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name)
    .sort();
}

function retiredRootHtml() {
  return new Set([
    ...A15_REDIRECT_ONLY_COMPATIBILITY_FILES,
    ...RETIRED_REDIRECTS
      .map((row) => String(row.from || ''))
      .filter((from) => from.startsWith('/') && from.endsWith('.html'))
      .map((from) => from.slice(1))
  ]);
}

function listRelativeFiles(directory, prefix = '') {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const next = path.join(directory, entry.name);
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...listRelativeFiles(next, `${rel}/`));
    else if (entry.isFile()) files.push(rel);
  }
  return files.sort();
}

function isDeclaredQuarantineOutputException(directory) {
  const exception = W449_QUARANTINE_OUTPUT_EXCEPTIONS[directory];
  if (!exception) return { allowed: false, reason: 'no-output-exception' };
  const route = COMPATIBILITY_ROUTES.find((row) => row.from === `/${directory}` && Number(row.status) === 200 && row.file === exception.sourceFile);
  if (!route) return { allowed: false, reason: 'route-contract-mismatch' };
  const actual = listRelativeFiles(path.join(dist, directory));
  const expected = [...exception.allowedOutputFiles].sort();
  return { allowed: actual.length === expected.length && actual.every((file, index) => file === expected[index]), reason: actual.join(', ') || 'empty', actual, expected };
}

function outputHtmlFiles() {
  if (!fs.existsSync(dist)) return [];
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(relative(full));
    }
  };
  walk(dist);
  return files.sort();
}

export function inspectW449ProductionCleanroom({ requireDist = false, writeArtifact = false } = {}) {
  const errors = [...validateW449ProductionCleanroomContract()];
  const allowedEntries = new Set(A15_BUILD_HTML_ENTRY_FILES);
  const retired = retiredRootHtml();
  const roots = rootHtmlFiles();
  const unplannedRootHtml = roots.filter((file) => !allowedEntries.has(file) && !retired.has(file));
  const activeFence = auditActiveSurfaceImports({ root });
  const vite = read('vite.config.mjs');

  fail(/EXPLICIT_HTML_ENTRY_FILES/.test(vite), 'vite.config.mjs must declare explicit HTML build inputs.', errors);
  fail(/function buildInputs\(\)[\s\S]*EXPLICIT_HTML_ENTRY_FILES/.test(vite), 'Vite input builder must use the explicit entry allowlist.', errors);
  fail(!/function collectHtmlEntries\(/.test(vite), 'Vite must not recursively discover arbitrary HTML source entries.', errors);
  fail(!/readdirSync\(/.test(vite), 'Vite production input must not depend on repository-wide directory walking.', errors);
  fail(unplannedRootHtml.length === 0, `Unplanned root HTML files: ${unplannedRootHtml.join(', ') || 'none'}.`, errors);
  fail(activeFence.ok, `Active source import fence failed: ${JSON.stringify({ legacyPrefixHits: activeFence.legacyPrefixHits, legacyValueHits: activeFence.legacyValueHits, forbiddenLiteralHits: activeFence.forbiddenLiteralHits, evmAddressLiteralHits: activeFence.evmAddressLiteralHits })}`, errors);
  fail(W449_QUARANTINE_ROOTS.every((entry) => entry.endsWith('/')), 'Every quarantine root must be normalized as a directory prefix.', errors);

  const emitted = outputHtmlFiles();
  if (requireDist) {
    fail(fs.existsSync(dist), 'dist/ is required for the production cleanroom output check.', errors);
    const emittedRetiredRootHtml = emitted.filter((file) => retired.has(file) && !allowedEntries.has(file));
    fail(emittedRetiredRootHtml.length === 0, `Retired root HTML emitted into dist/: ${emittedRetiredRootHtml.join(', ') || 'none'}.`, errors);
    for (const entry of ['games', 'tools', 'blog', 'docs', 'archive', 'NEXT_CHAT']) {
      const outputDirectory = path.join(dist, entry);
      if (!fs.existsSync(outputDirectory)) continue;
      const exception = isDeclaredQuarantineOutputException(entry);
      fail(exception.allowed, `Quarantined directory escaped into dist/: ${entry}/. ${exception.reason === 'no-output-exception' ? '' : `Allowed output files: ${(exception.expected || []).join(', ') || 'none'}; found: ${(exception.actual || []).join(', ') || exception.reason}.`}`, errors);
    }
  }

  const report = Object.freeze({
    schema: 'eonapp.w449.production-cleanroom-gate.v1',
    wave: 'W449',
    sourceOnly: !requireDist,
    status: errors.length ? 'fail' : 'pass',
    rules: W449_PRODUCTION_CLEANROOM_RULES,
    allowedEntryCount: allowedEntries.size,
    rootHtmlCount: roots.length,
    unplannedRootHtml: Object.freeze(unplannedRootHtml),
    activeModuleCount: activeFence.moduleCount,
    activeFenceOk: activeFence.ok,
    emittedHtmlCount: emitted.length,
    outputQuarantineExceptions: W449_QUARANTINE_OUTPUT_EXCEPTIONS,
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'This gate proves source/build boundaries only.',
      'It does not prove Cloudflare redirect behavior, Service Worker adoption, live browser rendering or a deployed release.'
    ])
  });

  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w449-production-cleanroom-gate');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW449ProductionCleanroom({ requireDist: process.argv.includes('--require-dist'), writeArtifact: true });
  assert.equal(result.status, 'pass', result.errors.join('\n'));
  process.stdout.write(`W449 production cleanroom gate passed (${result.activeModuleCount} active modules; ${result.allowedEntryCount} explicit HTML entries).\n`);
}
