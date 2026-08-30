import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { W525B_ACCOUNT_VAULT_UX_CONTRACT } from '../../config/w525b-account-vault-ux-contract.mjs';
import { inspectW525BAccountVaultUx } from '../../scripts/w525b-account-vault-ux-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

test('W525B has one cohesive Vault workspace without mixing recovery, AI keys and visual Reveals', () => {
  const vault = read('vault.html');
  assert.deepEqual(W525B_ACCOUNT_VAULT_UX_CONTRACT.vault.sections, ['overview', 'recovery', 'backup', 'ai-keys', 'reveals', 'safety']);
  for (const section of W525B_ACCOUNT_VAULT_UX_CONTRACT.vault.sections) {
    assert.match(vault, new RegExp(`data-eon-vault-panel="${section}"`));
  }
  assert.match(vault, /One compressed-when-useful encrypted file contains all supported local workspace records from this browser\./);
  assert.match(vault, /Vault Reveals/);
  assert.match(vault, /Google Drive uses a separate encrypted-snapshot permission and never reuses ordinary Google Login permission\./);
  const capsule = read('capsule.html');
  assert.match(capsule, /One user-held encrypted file for every eligible local EONAPP workspace record in this browser/);
  assert.match(capsule, /Every eligible allowlisted local workspace record is collected into this one file/);
  assert.match(capsule, /compressed before encryption/i);
});

test('W525B makes Profile a grouped preference center while retaining local-first account and recovery truth', () => {
  const profile = read('profile.html');
  for (const section of W525B_ACCOUNT_VAULT_UX_CONTRACT.profile.sections) {
    const id = section === 'account-backup' ? 'profile-account-backup' : `profile-${section}`;
    assert.match(profile, new RegExp(`id="${id}"`));
  }
  assert.match(profile, /Sign-in is optional; backup is always a separate, explicit choice\./);
  assert.match(profile, /One encrypted Capsule is the live all-at-once file for eligible workspace records/);
});

test('W525B only enables hover-open account utility on desktop fine pointers and keeps tap/focus paths intact', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const profilePopover = read('assets/js/shell/eon-shell-profile-popover.js');
  assert.match(profilePopover, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(profilePopover, /EON_SHELL_PROFILE_HOVER_OPEN_DELAY_MS = 380/);
  assert.match(shell, /bindEonShellProfileHover/);
  assert.match(profilePopover, /trigger\?\.addEventListener\('click'/);
  assert.match(profilePopover, /menu\?\.addEventListener\('pointerenter'/);
  assert.doesNotMatch(shell, /Sync later/);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W525B keeps the original Drive foundation separately consented while W536 may add a later explicit adapter', () => {
  const drive = read('assets/js/local-first/eon-google-drive-backup-foundation.js');
  assert.match(drive, /googleIdentityConsentReusable: false/);
  assert.doesNotMatch(drive, /fetch\(/);
  assert.doesNotMatch(drive, /requestAccessToken/);
  assert.equal(inspectW525BAccountVaultUx({ root: ROOT }).ok, true);
});
