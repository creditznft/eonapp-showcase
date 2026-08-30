#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyProductTruth } from './verify-product-truth.mjs';
import {
  W344_COMMERCE_STATUS,
  W344_FLOATING_GUIDE_FILE,
  W344_FLOATING_GUIDE_FORBIDDEN,
  W344_FLOATING_GUIDE_REQUIRED,
  W344_PUBLIC_TRUTH_SCHEMA,
  W344_REQUIRED_STATUS_SURFACES
} from '../config/w344-public-truth-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function verifyW344PublicTruthCopy({ root = DEFAULT_ROOT } = {}) {
  const errors = [];
  const warnings = [];
  const productTruth = verifyProductTruth({ root, write: false });
  if (!productTruth.ok) errors.push(...productTruth.errors.map((message) => `W228 product truth: ${message}`));

  for (const surface of W344_REQUIRED_STATUS_SURFACES) {
    const source = read(root, surface.file);
    for (const requirement of surface.required) {
      if (!requirement.test(source)) errors.push(`${surface.file} missing required public-status language: ${requirement}`);
    }
  }

  const guide = read(root, W344_FLOATING_GUIDE_FILE);
  for (const forbidden of W344_FLOATING_GUIDE_FORBIDDEN) {
    if (forbidden.test(guide)) errors.push(`${W344_FLOATING_GUIDE_FILE} still contains a retired or unsafe claim: ${forbidden}`);
  }
  for (const required of W344_FLOATING_GUIDE_REQUIRED) {
    if (!required.test(guide)) errors.push(`${W344_FLOATING_GUIDE_FILE} missing local-first guide boundary: ${required}`);
  }

  return {
    schema: W344_PUBLIC_TRUTH_SCHEMA,
    ok: errors.length === 0,
    errors,
    warnings,
    commerceStatus: W344_COMMERCE_STATUS,
    checkedSurfaceCount: W344_REQUIRED_STATUS_SURFACES.length,
    checkedGuideFile: W344_FLOATING_GUIDE_FILE
  };
}

export function main() {
  const result = verifyW344PublicTruthCopy();
  if (!result.ok) {
    console.error(`[W344] Public truth/copy gate failed (${result.errors.length} finding(s)): `);
    result.errors.forEach((error) => console.error(` - ${error}`));
    return 1;
  }
  console.log(`[W344] Public truth/copy gate passed: ${result.checkedSurfaceCount} status surfaces and local-only floating guide verified.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
