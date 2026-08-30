#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  A15_BUILD_HTML_ENTRY_FILES,
  A15_BUILD_ROUTE_ROWS,
  A15_CAPABILITY_AUTHORITY,
  A15_CURRENT_PRODUCT_AUTHORITY_SCHEMA,
  A15_CURRENT_PRODUCT_ROUTES,
  A15_EMITTED_COMPATIBILITY_ROUTES,
  A15_REDIRECT_ONLY_COMPATIBILITY_ROUTES,
  A15_TEST_AUTHORITY,
  validateA15CurrentProductAuthority
} from '../config/a15-current-product-authority.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const VITE_CONFIG = readFileSync(path.join(ROOT, 'vite.config.mjs'), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const missingFiles = A15_BUILD_HTML_ENTRY_FILES.filter((file) => !existsSync(path.join(ROOT, file)));
const errors = [
  ...validateA15CurrentProductAuthority(),
  ...(missingFiles.length ? [`Missing build HTML files: ${missingFiles.join(', ')}`] : []),
  ...(!VITE_CONFIG.includes("from './config/a15-current-product-authority.mjs'") ? ['Vite must import the A15 current product authority.'] : []),
  ...(!VITE_CONFIG.includes('A15_BUILD_HTML_ENTRY_FILES') ? ['Vite must consume A15_BUILD_HTML_ENTRY_FILES.'] : []),
  ...(VITE_CONFIG.includes('...COMPATIBILITY_ROUTES') ? ['Vite must not independently spread all compatibility routes into build inputs.'] : [])
];
const manifestCore = {
  schema: A15_CURRENT_PRODUCT_AUTHORITY_SCHEMA,
  status: errors.length ? 'fail' : 'pass',
  currentProductRoutes: A15_CURRENT_PRODUCT_ROUTES,
  emittedCompatibilityRoutes: A15_EMITTED_COMPATIBILITY_ROUTES,
  redirectOnlyCompatibilityRoutes: A15_REDIRECT_ONLY_COMPATIBILITY_ROUTES,
  buildRouteRows: A15_BUILD_ROUTE_ROWS,
  buildHtmlEntryFiles: A15_BUILD_HTML_ENTRY_FILES,
  capabilityAuthority: A15_CAPABILITY_AUTHORITY,
  testAuthority: A15_TEST_AUTHORITY,
  errors
};
const manifest = { ...manifestCore, digest: digest(JSON.stringify(manifestCore)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(path.join(EVIDENCE_DIR, 'A15_I02_CURRENT_PRODUCT_AUTHORITY.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[A15 I02] ${manifest.status.toUpperCase()}: ${A15_CURRENT_PRODUCT_ROUTES.length} current routes, ${A15_EMITTED_COMPATIBILITY_ROUTES.length} emitted compatibility rows, ${A15_BUILD_HTML_ENTRY_FILES.length} deterministic HTML inputs.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I02] ${error}`);
  process.exitCode = 1;
}
