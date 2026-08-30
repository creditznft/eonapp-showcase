#!/usr/bin/env node
/** W308 — verifies the portable backup path remains encrypted, local, and non-destructive. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W308_PORTABLE_BACKUP_CONTRACT } from '../config/w308-portable-backup-contract.mjs';
import { getEncryptedPortableBackupTruth } from '../assets/js/local-first/eon-portable-backup.js';
import { getLocalVaultMetadataTruth } from '../assets/js/local-first/eon-local-vault-metadata-store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW308PortableBackupGate(root = ROOT) {
  const errors = [];
  const contract = W308_PORTABLE_BACKUP_CONTRACT;
  for (const relative of contract.requiredFiles) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) { errors.push(`Required W308 file missing: ${relative}`); continue; }
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of contract.forbiddenPatterns) if (source.includes(pattern)) errors.push(`W308 source contains forbidden capability ${pattern}: ${relative}`);
  }
  const truth = getEncryptedPortableBackupTruth();
  for (const [key, expected] of Object.entries(contract.requiredTruth)) if (truth[key] !== expected) errors.push(`Portable backup truth mismatch: ${key}`);
  const metadata = getLocalVaultMetadataTruth();
  if (metadata.passphrasePersistence !== false || metadata.keyPersistence !== false || metadata.directNetwork !== false) errors.push('Local vault metadata store is not a non-secret local-only store.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, truth, metadata });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW308PortableBackupGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W308 portable backup gate passed: encrypted local export/import, explicit confirmation, no overwrite, no cloud sync.');
  process.exitCode = report.ok ? 0 : 1;
}
