#!/usr/bin/env node
/** W364A — verifies that optional Google identity cannot be mistaken for cloud backup. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W364A_GOOGLE_DATA_CUSTODY_CONTRACT } from '../config/w364a-google-data-custody-contract.mjs';
import { getAccountDataCustodySummary, getAccountFoundationStatus } from '../assets/js/account/eon-account-foundation.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function runW364AGoogleDataCustodyGate(root = ROOT) {
  const contract = W364A_GOOGLE_DATA_CUSTODY_CONTRACT;
  const errors = [];
  for (const relative of contract.requiredFiles) if (!fs.existsSync(path.join(root, relative))) errors.push(`W364A required file missing: ${relative}`);
  const profile = read(root, 'profile.html');
  const account = read(root, 'assets/js/account/eon-account-foundation.js');
  const runtime = read(root, 'assets/js/profile-page.js');
  const boundary = read(root, 'assets/js/local-first/local-first-boundary.js');
  for (const id of contract.requiredProfileIds) if (!profile.includes(`id="${id}"`)) errors.push(`W364A profile disclosure is missing #${id}.`);
  for (const exclusion of contract.requiredDataExclusions) if (!account.includes(exclusion)) errors.push(`W364A account data exclusion missing: ${exclusion}`);
  for (const phrase of ['Google Login does not copy local Chat', 'Back up this device', 'Cloudflare limit']) if (!`${profile}\n${runtime}`.includes(phrase)) errors.push(`W364A profile copy missing: ${phrase}`);
  for (const forbidden of contract.forbiddenBrowserPatterns) if (account.includes(forbidden)) errors.push(`W364A account code must stay pre-auth: ${forbidden}`);
  if (!boundary.includes("googleLogin: 'planned-optional'")) errors.push('W364A must mark Google identity as planned-optional, not active.');
  if (!boundary.includes('automaticCrossDeviceSync: false')) errors.push('W364A must preserve no automatic cross-device sync.');
  const custody = getAccountDataCustodySummary();
  const status = getAccountFoundationStatus({ alias: 'Audit User', email: 'private@example.test', apiKey: 'secret' });
  if (custody.guestUseAvailable !== true || custody.googleIdentityRequired !== false) errors.push('W364A must retain guest-first access.');
  if (custody.localDataBackupRequired !== true || custody.automaticCloudBackup !== false || custody.automaticCrossDeviceSync !== false) errors.push('W364A must make backup responsibility explicit.');
  if (status.serverAccount.connected !== false || status.optionalGoogleIdentity.configured !== false) errors.push('W364A must not present an unconfigured Google identity as live.');
  if (/private@example|hidden-key/i.test(JSON.stringify(status))) errors.push('W364A display-safe status leaked input data.');
  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors, guestFirst: true, googleIdentity: 'planned-pre-auth', cloudBackup: false });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW364AGoogleDataCustodyGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W364A Google data-custody gate passed: guest-first, no cloud backup claim, optional identity remains pre-auth.');
  process.exitCode = report.ok ? 0 : 1;
}
