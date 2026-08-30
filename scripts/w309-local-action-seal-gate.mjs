#!/usr/bin/env node
/** W309 — prevents action-record confirmation from becoming execution. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W309_LOCAL_ACTION_SEAL_CONTRACT } from '../config/w309-local-action-seal-contract.mjs';
import { getLocalActionSealTruth } from '../assets/js/local-first/eon-local-action-seal.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW309LocalActionSealGate(root = ROOT) {
  const errors = [];
  const contract = W309_LOCAL_ACTION_SEAL_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required W309 file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`W309 source contains forbidden capability ${pattern}: ${relative}`);
  }
  const truth = getLocalActionSealTruth();
  for (const [key, expected] of Object.entries(contract.requiredTruth)) if (truth[key] !== expected) errors.push(`Local action seal truth mismatch: ${key}`);
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truth });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW309LocalActionSealGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W309 local action seal gate passed: immutable, expiring, explicit-confirmation records with no execution path.');
  process.exitCode = report.ok ? 0 : 1;
}
