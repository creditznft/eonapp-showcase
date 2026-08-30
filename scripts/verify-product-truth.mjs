#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPATIBILITY_ROUTES,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS
} from '../config/route-contract.mjs';
import {
  PRODUCT_CLAIM_EVIDENCE,
  PRODUCT_STATUS_MATRIX,
  renderPublicProductStatusMatrix,
  validateProductEvidenceRegistry
} from '../config/product-evidence-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const SYSTEM_HTML_FILES = new Set(['404.html', 'offline.html']);
const RESTRICTED_ACTIVE_CLAIMS = [
  /pool\s*point(?:s)?\s+conversion/i,
  /eon\s*lite\s+mining/i,
  /passive\s+income/i,
  /earn\s+(?:\d+|up\s+to)\s*%/i,
  /cash(?:-|\s*)out/i,
  /guaranteed\s+yield/i,
  /investment\s+return/i,
  /tradable\s+(?:nft|token)/i
];

function readFile(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function rootHtmlFiles(root) {
  return fs.readdirSync(root).filter((file) => file.endsWith('.html')).sort();
}

export function findUnmappedRootHtml(root = DEFAULT_ROOT) {
  const publicFiles = new Set([
    ...PRIMARY_APP_ROUTES,
    ...INFORMATIONAL_ROUTES,
    ...COMPATIBILITY_ROUTES
  ].map((row) => row.file).filter(Boolean));
  const retiredFileOrigins = new Set(
    RETIRED_REDIRECTS
      .map((row) => row.from)
      .filter((from) => from.endsWith('.html'))
      .map((from) => from.slice(1))
  );
  return rootHtmlFiles(root).filter((file) => !publicFiles.has(file) && !SYSTEM_HTML_FILES.has(file) && !retiredFileOrigins.has(file));
}

function activeSourceFiles(root) {
  const files = new Set([
    ...PRIMARY_APP_ROUTES,
    ...INFORMATIONAL_ROUTES,
    ...COMPATIBILITY_ROUTES
  ].map((row) => row.file).filter(Boolean));
  for (const shared of ['assets/js/eon-app-shell.js', 'assets/js/eon-workspace-pages.js', 'assets/js/utils/eon-share-sheet.js']) {
    if (fs.existsSync(path.join(root, shared))) files.add(shared);
  }
  return [...files];
}

export function findRestrictedActiveClaims(root = DEFAULT_ROOT) {
  const findings = [];
  for (const relative of activeSourceFiles(root)) {
    const source = readFile(root, relative);
    for (const pattern of RESTRICTED_ACTIVE_CLAIMS) {
      const hit = source.match(pattern);
      if (hit) findings.push({ file: relative, claim: hit[0] });
    }
  }
  return findings;
}

export function verifyProductTruth({ root = DEFAULT_ROOT, write = false } = {}) {
  const errors = [...validateProductEvidenceRegistry({ root })];
  const warnings = [];
  const unmapped = findUnmappedRootHtml(root);
  if (unmapped.length) errors.push(`Root HTML pages lack either canonical, system, or explicit retired routing: ${unmapped.join(', ')}`);
  const restricted = findRestrictedActiveClaims(root);
  if (restricted.length) errors.push(`Restricted active product claims found: ${restricted.map((row) => `${row.file} (${row.claim})`).join(', ')}`);
  for (const claim of PRODUCT_CLAIM_EVIDENCE) {
    for (const evidencePath of claim.evidence) {
      if (!fs.existsSync(path.join(root, evidencePath))) errors.push(`Missing claim evidence file: ${claim.id} -> ${evidencePath}`);
    }
  }
  for (const route of PRODUCT_STATUS_MATRIX) {
    for (const evidencePath of route.evidence) {
      if (!fs.existsSync(path.join(root, evidencePath))) errors.push(`Missing route evidence file: ${route.route} -> ${evidencePath}`);
    }
  }
  if (write) {
    const output = path.join(root, 'docs', 'W228_PUBLIC_PRODUCT_STATUS_MATRIX.md');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, renderPublicProductStatusMatrix());
  }
  return { ok: errors.length === 0, errors, warnings, unmapped, restricted };
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    root: argv.includes('--root') ? path.resolve(argv[argv.indexOf('--root') + 1]) : DEFAULT_ROOT,
    write: args.has('--write')
  };
}

export function main(argv = process.argv) {
  const options = parseArgs(argv);
  const result = verifyProductTruth(options);
  if (options.write) console.log('[product-truth] Wrote docs/W228_PUBLIC_PRODUCT_STATUS_MATRIX.md');
  if (result.ok) {
    console.log(`[product-truth] PASS: ${PRODUCT_STATUS_MATRIX.length} route states and ${PRODUCT_CLAIM_EVIDENCE.length} product claims have evidence.`);
    return 0;
  }
  console.error('[product-truth] FAIL:');
  result.errors.forEach((error) => console.error(`- ${error}`));
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
