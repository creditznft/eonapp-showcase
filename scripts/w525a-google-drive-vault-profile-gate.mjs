#!/usr/bin/env node
/**
 * W525A source gate — Google Drive backup foundation and Vault/Profile clarity.
 *
 * This is intentionally a local source-contract gate. It verifies that Google
 * Drive is described as a future, separately-consented encrypted snapshot
 * connector while the shipping product stays local-first and manual.
 * It does not perform OAuth, call Google APIs, upload, restore, or prove a
 * cloud provider/device flow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'assets/js/local-first/eon-google-drive-backup-foundation.js',
  'assets/js/local-first/eon-data-continuity.js',
  'assets/js/utils/cloud-backup-connectors.js',
  'assets/js/vault/eon-vault-page.js',
  'assets/js/profile-page.js',
  'vault.html',
  'profile.html',
  'assets/js/trust-showcase-page.js',
  'archive/w519-legacy-transport-control/assets/js/utils/cloud-backup-handoff.js'
];
const activeLegacyPath = 'assets/js/utils/cloud-backup-handoff.js';
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const has = (relative) => fs.existsSync(path.join(ROOT, relative));

export function inspectW525AGoogleDriveVaultProfile({ root = ROOT } = {}) {
  const issues = [];
  const text = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const exists = (relative) => fs.existsSync(path.join(root, relative));

  for (const relative of required) {
    if (!exists(relative)) issues.push(`missing-required-source:${relative}`);
  }
  if (exists(activeLegacyPath)) issues.push(`legacy-active-helper-present:${activeLegacyPath}`);
  if (issues.length) return Object.freeze({ wave: 'W525A', sourceOnly: true, ok: false, issues: Object.freeze(issues.sort()) });

  const foundation = text('assets/js/local-first/eon-google-drive-backup-foundation.js');
  const continuity = text('assets/js/local-first/eon-data-continuity.js');
  const connectors = text('assets/js/utils/cloud-backup-connectors.js');
  const vault = text('assets/js/vault/eon-vault-page.js');
  const vaultHtml = text('vault.html');
  const profile = text('assets/js/profile-page.js');
  const profileHtml = text('profile.html');
  const showcase = text('assets/js/trust-showcase-page.js');

  const mustContain = [
    [foundation, "EON_GOOGLE_DRIVE_BACKUP_SCOPE = 'https://www.googleapis.com/auth/drive.file'", 'drive-file-scope-contract-missing'],
    [foundation, 'approved-foundation-not-enabled', 'foundation-disabled-state-missing'],
    [foundation, 'googleIdentityConsentReusable: false', 'identity-consent-separation-missing'],
    [foundation, 'Explicit encrypted snapshot backup, not background sync.', 'snapshot-only-boundary-missing'],
    [continuity, 'providerConnectedBackupActive: false', 'provider-connection-boundary-missing'],
    [continuity, 'Google Drive encrypted backup', 'google-drive-first-lane-missing'],
    [connectors, 'Google Login is not Google Drive permission.', 'manual-connector-identity-boundary-missing'],
    [connectors, 'LEGACY_CLOUD_BACKUP_STATUS_KEY', 'manual-status-migration-missing'],
    [vault, 'renderGoogleDriveFoundation', 'vault-drive-foundation-render-missing'],
    [vaultHtml, 'id="eon-vault-google-drive"', 'vault-drive-card-missing'],
    [vaultHtml, 'id="eon-vault-manual-storage"', 'vault-manual-storage-card-missing'],
    [profile, 'eon-profile-drive-backup-status', 'profile-drive-state-missing'],
    [profileHtml, 'Google Login</strong><span>Optional account access only. It does not grant Drive access', 'profile-google-login-boundary-missing'],
    [showcase, "path: 'assets/js/local-first/eon-data-continuity.js'", 'showcase-active-continuity-path-missing']
  ];
  for (const [source, needle, issue] of mustContain) if (!source.includes(needle)) issues.push(issue);

  for (const [label, source] of [
    ['foundation', foundation],
    ['connectors', connectors]
  ]) {
    for (const marker of ['fetch(', 'requestAccessToken', 'google.accounts', 'drive.readonly', 'drive.metadata.readonly', '/api/drive/']) {
      if (source.includes(marker)) issues.push(`${label}-unexpected-live-provider-operation:${marker}`);
    }
  }

  if (showcase.includes('cloud-backup-handoff.js') || showcase.includes('buildCloudBackupHandoffPlan')) {
    issues.push('showcase-still-points-to-archived-backup-helper');
  }

  return Object.freeze({
    wave: 'W525A',
    schema: 'eonapp.w525a.google-drive-vault-profile.v1',
    sourceOnly: true,
    providerConnected: false,
    deviceEvidence: 'not-proven',
    ok: issues.length === 0,
    checked: Object.freeze(required),
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW525AGoogleDriveVaultProfile();
  const target = path.join(ROOT, 'tmp', 'w525a-google-drive-vault-profile-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W525A Google Drive/Vault/Profile source gate failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}`);
  console.log('W525A Google Drive/Vault/Profile source gate passed. Source contract only; no OAuth, Drive upload, restore, sync, device, preview, or deployment proof.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
