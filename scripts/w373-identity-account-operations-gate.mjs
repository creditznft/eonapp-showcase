#!/usr/bin/env node
/** W373 — source gate for minimal identity account operations. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT } from '../config/w373-identity-account-operations-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW373IdentityAccountOperationsGate(root = ROOT) {
  const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const errors = [];
  const check = (value, message) => { if (!value) errors.push(message); };
  const contract = W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT;

  for (const relative of contract.requiredFiles) check(fs.existsSync(path.join(root, relative)), `W373 missing required file: ${relative}`);
  const migration = read('identity/migrations/0001_eon_identity.sql');
  const auth = read('functions/_shared/eon-auth.js');
  const deletion = read('functions/api/account/delete-request.js');
  const profile = read('profile.html');
  const profileRuntime = read('assets/js/profile-page.js');
  const docs = read('docs/W373_IDENTITY_ACCOUNT_OPERATIONS_CONTRACT_2026-06-26.md');

  for (const table of contract.requiredD1Tables) check(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`).test(migration), `W373 D1 table missing: ${table}`);
  for (const column of contract.prohibitedSchemaColumns) check(!migration.includes(column), `W373 prohibited schema column found: ${column}`);
  for (const id of contract.requiredProfileIds) check(profile.includes(`id="${id}"`), `W373 Profile disclosure/control missing: #${id}`);
  for (const item of contract.localDataNeverUploaded) check(`${auth}\n${profile}\n${profileRuntime}\n${docs}`.includes(item), `W373 local-data boundary missing: ${item}`);
  check(auth.includes('identity_ref_hmac') && auth.includes('hmacBase64Url'), 'W373 must HMAC the Google identity reference before D1 persistence.');
  check(auth.includes('deleteAuthenticatedAccount') && deletion.includes(contract.accountDeleteConfirmation), 'W373 deletion must use explicit confirmation and delete minimal cloud account data.');
  check(deletion.includes('enforceSameOriginMutation') && deletion.includes('readSession'), 'W373 deletion must require same-origin and an authenticated session.');
  check(!/localStorage|sessionStorage|indexedDB|caches\.open|fetch\s*\(/i.test(deletion), 'W373 cloud-account deletion must not alter local browser work or call external services.');
  check(/current work stays on this device|does not copy local work/i.test(`${profile}\n${profileRuntime}\n${docs}`) && !/eon-profile-google-data-ack|dataCustodyAck/.test(`${profile}\n${profileRuntime}`), 'W373 keeps the local-work boundary visible without a backup acknowledgement gate before identity-only sign-in.');

  return Object.freeze({
    schema: 'eonapp.w373.identity-account-operations-gate.v2',
    ok: errors.length === 0,
    sourceOnly: true,
    accountStore: 'minimal-D1-metadata-only',
    automaticCloudBackup: false,
    errors
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW373IdentityAccountOperationsGate();
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'W373_IDENTITY_ACCOUNT_OPERATIONS_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
