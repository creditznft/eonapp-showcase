#!/usr/bin/env node
/**
 * W525B source gate — coherent Account, Preferences and Vault UX.
 *
 * Static contract only. It proves source boundaries and information
 * architecture; it does not connect Google Drive, upload a Capsule, create
 * automatic sync, or prove browser/device rendering.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W525B_ACCOUNT_VAULT_UX_CONTRACT } from '../config/w525b-account-vault-ux-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = Object.freeze([
  'vault.html',
  'capsule.html',
  'profile.html',
  'assets/js/vault/eon-vault-page.js',
  'assets/js/profile-page.js',
  'assets/js/eon-app-shell.js',
  'assets/js/shell/eon-shell-profile-popover.js',
  'assets/css/eon-vault-v2.css',
  'assets/css/eon-hubs.css',
  'assets/js/local-first/eon-google-drive-backup-foundation.js',
  'config/w525b-account-vault-ux-contract.mjs'
]);

const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const has = (root, relative) => fs.existsSync(path.join(root, relative));

export function inspectW525BAccountVaultUx({ root = ROOT } = {}) {
  const issues = [];
  for (const relative of REQUIRED) if (!has(root, relative)) issues.push(`missing-required-source:${relative}`);
  if (issues.length) return Object.freeze({ wave: W525B_ACCOUNT_VAULT_UX_CONTRACT.wave, sourceOnly: true, ok: false, issues: Object.freeze(issues.sort()) });

  const vaultHtml = read(root, 'vault.html');
  const capsuleHtml = read(root, 'capsule.html');
  const vaultJs = read(root, 'assets/js/vault/eon-vault-page.js');
  const profileHtml = read(root, 'profile.html');
  const profileJs = read(root, 'assets/js/profile-page.js');
  const shell = read(root, 'assets/js/eon-app-shell.js');
  const profilePopover = read(root, 'assets/js/shell/eon-shell-profile-popover.js');
  const drive = read(root, 'assets/js/local-first/eon-google-drive-backup-foundation.js');

  const requiredNeedles = [
    [vaultHtml, 'data-eon-vault-tab="overview"', 'vault-overview-tab-missing'],
    [vaultHtml, 'data-eon-vault-tab="recovery"', 'vault-recovery-tab-missing'],
    [vaultHtml, 'data-eon-vault-tab="backup"', 'vault-backup-tab-missing'],
    [vaultHtml, 'data-eon-vault-tab="ai-keys"', 'vault-ai-key-tab-missing'],
    [vaultHtml, 'data-eon-vault-tab="reveals"', 'vault-reveals-tab-missing'],
    [vaultHtml, 'data-eon-vault-tab="safety"', 'vault-safety-tab-missing'],
    [vaultHtml, 'One compressed-when-useful encrypted file contains all supported local workspace records from this browser.', 'one-capsule-explanation-missing'],
    [capsuleHtml, 'Every eligible allowlisted local workspace record is collected into this one file.', 'capsule-all-eligible-one-file-copy-missing'],
    [capsuleHtml, 'compressed before encryption', 'capsule-compression-truth-missing'],
    [vaultJs, 'function activateVaultTab', 'vault-tab-behavior-missing'],
    [vaultJs, "providerIds: ['google-drive']", 'vault-primary-manual-storage-not-google-drive-only'],
    [profileHtml, 'class="eon-preferences-nav"', 'profile-preferences-nav-missing'],
    [profileHtml, 'id="profile-account-backup"', 'profile-account-backup-section-missing'],
    [profileHtml, 'id="profile-privacy"', 'profile-privacy-section-missing'],
    [profileJs, 'function bindPreferenceNavigation', 'profile-section-navigation-missing'],
    [profilePopover, 'supportsEonShellProfileHover', 'desktop-profile-hover-capability-missing'],
    [profilePopover, 'desktop-fine-pointer-delayed-only', 'shell-hover-contract-missing'],
    [profilePopover, 'EON_SHELL_PROFILE_HOVER_OPEN_DELAY_MS = 380', 'shell-hover-open-delay-missing'],
    [shell, 'Profile & preferences', 'account-menu-preferences-link-missing'],
    [shell, 'Vault & recovery', 'account-menu-vault-link-missing'],
    [drive, 'googleIdentityConsentReusable: false', 'drive-identity-consent-separation-missing']
  ];
  for (const [source, needle, issue] of requiredNeedles) if (!source.includes(needle)) issues.push(issue);

  for (const marker of ['fetch(', 'requestAccessToken', 'google.accounts', '/api/drive/', 'drive.readonly']) {
    if (drive.includes(marker)) issues.push(`drive-foundation-unexpected-live-operation:${marker}`);
  }
  if (/Sync later/.test(shell)) issues.push('stale-sync-later-copy-present');
  if (/automatic multi-device sync/i.test(vaultHtml) && !/not active/i.test(vaultHtml)) issues.push('vault-sync-copy-may-imply-activation');

  return Object.freeze({
    wave: W525B_ACCOUNT_VAULT_UX_CONTRACT.wave,
    schema: W525B_ACCOUNT_VAULT_UX_CONTRACT.schema,
    sourceOnly: true,
    driveConnected: false,
    deviceEvidence: 'not-proven',
    ok: issues.length === 0,
    checked: REQUIRED,
    issues: Object.freeze(issues.sort())
  });
}

function main() {
  const result = inspectW525BAccountVaultUx();
  const target = path.join(ROOT, 'tmp', 'w525b-account-vault-ux-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) throw new Error(`W525B Account/Vault UX source gate failed:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}`);
  console.log('W525B Account/Vault UX source gate passed. This UI-contract receipt does not prove W536 Drive OAuth/upload, automatic sync, device proof, preview, or deployment evidence.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
