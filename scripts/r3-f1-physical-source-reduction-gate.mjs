#!/usr/bin/env node
/**
 * R3-F1 — physical active-source reduction gate.
 *
 * Historical value-bearing source is retained only under the hash-manifested
 * archive. Active EONAPP sources may not import that archive, restore any
 * original path, retain a direct transaction primitive, or ship a raw EVM
 * address in generated output. This is a source/output boundary, not a claim
 * about a live chain or third-party service.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports, RETIRED_VALUE_SYSTEM_PATHS } from './active-surface-import-fence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ARCHIVE = path.join(ROOT, 'archive', 'retired-value-systems');
const MANIFEST_FILE = path.join(ARCHIVE, 'MANIFEST.json');
const REQUIRE_DIST = process.argv.includes('--require-dist');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

const EVM_ADDRESS = /0x[a-fA-F0-9]{40}/g;
const RUNTIME_PRIMITIVES = Object.freeze([
  /window\.ethereum\b/,
  /ethereum\.request\b/,
  /eth_sendTransaction\b/,
  /eth_requestAccounts\b/,
  /wallet_switchEthereumChain\b/,
  /personal_sign\b/,
  /\bWalletConnect\b/,
  /DIRECT_EVM_RECIPIENT\b/,
  /ADMIN_PAYMENT_RECEIVER\b/,
  /EVM_SUBSCRIPTION_PAYOUT\b/
]);

function relative(absolute) { return path.relative(ROOT, absolute).replaceAll('\\', '/'); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, predicate));
    else if (entry.isFile() && predicate(full)) files.push(full);
  }
  return files;
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function collectRuntimeFiles() {
  const files = walk(path.join(ROOT, 'assets', 'js'), (file) => /\.m?js$/i.test(file));
  const canonicalHtml = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES]
    .map((route) => route.file).filter(Boolean).map((file) => path.join(ROOT, file)).filter(fs.existsSync);
  return [...new Set([...files, ...canonicalHtml])].sort();
}

let manifest = null;
try { manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8')); }
catch (error) { errors.push(`Unable to read R3-F1 manifest: ${error.message}`); }
assert(manifest?.schema === 'eonapp.r3-f1.retired-value-systems.v1', 'R3-F1 archive manifest schema is missing or invalid.');
const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
assert(entries.length >= 80, `R3-F1 manifest unexpectedly small: ${entries.length} archived files.`);
const archivedPaths = new Set();
const restoredOriginals = [];
const hashFailures = [];
for (const entry of entries) {
  const original = String(entry?.originalPath || '');
  const archived = String(entry?.archivePath || '');
  const expected = String(entry?.sha256 || '');
  if (!original || !archived || !expected) { hashFailures.push(`Malformed manifest entry: ${JSON.stringify(entry)}`); continue; }
  archivedPaths.add(original);
  const originalFile = path.join(ROOT, original);
  const archiveFile = path.join(ROOT, archived);
  if (fs.existsSync(originalFile)) restoredOriginals.push(original);
  if (!fs.existsSync(archiveFile)) hashFailures.push(`Archive file missing: ${archived}`);
  else if (sha256(archiveFile) !== expected) hashFailures.push(`Archive hash mismatch: ${archived}`);
}
assert(restoredOriginals.length === 0, `Retired value source restored outside archive: ${restoredOriginals.join(', ')}`);
assert(hashFailures.length === 0, `R3-F1 archive verification failed: ${hashFailures.join('; ')}`);
for (const tracked of RETIRED_VALUE_SYSTEM_PATHS) {
  assert(archivedPaths.has(tracked) || (manifest?.previouslyAbsentPaths || []).includes(tracked), `Active-fence retired path is neither archived nor declared previously absent: ${tracked}`);
}

const imports = auditActiveSurfaceImports({ root: ROOT });
assert(imports.ok, `Active import fence failed: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);
assert(imports.reachableModules.every((module) => !module.startsWith('archive/')), 'Active import graph reaches archive/.');
assert(imports.reachableModules.every((module) => !archivedPaths.has(module)), 'Active import graph reaches an archived original path.');

const sourcePrimitiveHits = [];
const sourceEvmHits = [];
for (const file of collectRuntimeFiles()) {
  const text = read(file); const rel = relative(file);
  if (RUNTIME_PRIMITIVES.some((pattern) => pattern.test(text))) sourcePrimitiveHits.push(rel);
  EVM_ADDRESS.lastIndex = 0;
  if (EVM_ADDRESS.test(text)) sourceEvmHits.push(rel);
}
assert(sourcePrimitiveHits.length === 0, `Active runtime source contains a transaction/wallet primitive: ${sourcePrimitiveHits.join(', ')}`);
assert(sourceEvmHits.length === 0, `Active runtime source contains a raw EVM address: ${sourceEvmHits.join(', ')}`);

const outputPrimitiveHits = [];
const outputEvmHits = [];
if (REQUIRE_DIST) {
  assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before R3-F1 output proof.');
  for (const file of walk(DIST, (candidate) => /\.(?:html|m?js)$/i.test(candidate))) {
    const text = read(file); const rel = relative(file);
    if (RUNTIME_PRIMITIVES.some((pattern) => pattern.test(text))) outputPrimitiveHits.push(rel);
    EVM_ADDRESS.lastIndex = 0;
    if (EVM_ADDRESS.test(text)) outputEvmHits.push(rel);
  }
}
assert(outputPrimitiveHits.length === 0, `Generated output contains a transaction/wallet primitive: ${outputPrimitiveHits.join(', ')}`);
assert(outputEvmHits.length === 0, `Generated output contains a raw EVM address: ${outputEvmHits.join(', ')}`);

const report = {
  schema: 'eonapp.r3-f1.physical-source-reduction-report.v1', generatedAt: new Date().toISOString(), requireDist: REQUIRE_DIST,
  ok: errors.length === 0,
  archive: { manifest: relative(MANIFEST_FILE), archivedEntries: entries.length, previouslyAbsentPaths: manifest?.previouslyAbsentPaths || [], restoredOriginals, hashFailures },
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount, legacyPrefixHits: imports.legacyPrefixHits, legacyValueHits: imports.legacyValueHits },
  sourcePrimitiveHits, sourceEvmHits, outputPrimitiveHits, outputEvmHits, errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'R3_F1_PHYSICAL_SOURCE_REDUCTION_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) { console.error('[R3-F1] Physical source reduction failed:'); for (const error of errors) console.error(` - ${error}`); process.exitCode = 1; }
else console.log(`[R3-F1] PASS: ${entries.length} archived source files hash-verified; ${imports.moduleCount} reachable modules; no active transaction primitive or raw EVM address.`);

export function auditR3F1PhysicalSourceReduction() { return report; }
