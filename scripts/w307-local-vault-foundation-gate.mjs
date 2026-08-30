#!/usr/bin/env node
/** W307 — validates that encrypted local record primitives remain browser-local and non-networked. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W307_LOCAL_VAULT_FOUNDATION_CONTRACT } from '../config/w307-local-vault-foundation-contract.mjs';
import { getLocalVaultCryptoTruth } from '../assets/js/local-first/eon-local-vault-crypto.js';
import { getEncryptedRecordStoreTruth } from '../assets/js/local-first/eon-encrypted-record-store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW307LocalVaultFoundationGate(root = ROOT) {
  const errors = [];
  const contract = W307_LOCAL_VAULT_FOUNDATION_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required W307 file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`W307 source contains forbidden capability ${pattern}: ${relative}`);
  }
  const cryptoTruth = getLocalVaultCryptoTruth();
  for (const [key, expected] of Object.entries(contract.requiredTruth)) if (cryptoTruth[key] !== expected) errors.push(`Local vault crypto truth mismatch: ${key}`);
  const storeTruth = getEncryptedRecordStoreTruth();
  for (const [key, expected] of Object.entries(contract.requiredTruth)) if (key in storeTruth && storeTruth[key] !== expected) errors.push(`Encrypted record store truth mismatch: ${key}`);
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, cryptoTruth, storeTruth });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW307LocalVaultFoundationGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W307 local vault foundation gate passed: encrypted envelopes only, device-local IndexedDB, no network or key export.');
  process.exitCode = report.ok ? 0 : 1;
}
