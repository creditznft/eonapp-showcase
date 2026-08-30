import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectW525AGoogleDriveVaultProfile } from '../../scripts/w525a-google-drive-vault-profile-gate.mjs';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

globalThis.localStorage = new MemoryStorage();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const drive = await import('../../assets/js/local-first/eon-google-drive-backup-foundation.js');
const continuity = await import('../../assets/js/local-first/eon-data-continuity.js');
const cloud = await import('../../assets/js/utils/cloud-backup-connectors.js');

test('W525A keeps ordinary Google Login separate from the future Drive backup consent', () => {
  const truth = drive.getGoogleDriveBackupFoundationTruth();
  const preview = drive.buildGoogleDriveBackupConsentPreview();
  assert.equal(truth.state, 'approved-foundation-not-enabled');
  assert.equal(truth.connected, false);
  assert.equal(truth.uploadActive, false);
  assert.equal(truth.automaticUploadActive, false);
  assert.equal(truth.automaticCrossDeviceSyncActive, false);
  assert.equal(truth.automaticRestoreActive, false);
  assert.equal(truth.providerCredentialsStored, false);
  assert.equal(truth.googleIdentityConsentReusable, false);
  assert.equal(truth.requestedScopeWhenEnabled, 'https://www.googleapis.com/auth/drive.file');
  assert.match(truth.scopeRule, /only after a user explicitly chooses Google Drive backup/i);
  assert.match(preview.willNotDo.join(' '), /Reuse ordinary Google Login permission for Drive/i);
});

test('W525A retains Capsule transfer as the live path and Drive as a disabled snapshot foundation', () => {
  const truth = continuity.getEonDataContinuityTruth();
  assert.equal(truth.currentRecoveryPath, 'user-confirmed encrypted Capsule or Vault export/import');
  assert.equal(truth.providerConnectedBackupActive, false);
  assert.equal(truth.automaticCrossDeviceSyncActive, false);
  assert.equal(truth.googleDriveBackup.connected, false);
  assert.deepEqual(truth.futureConnectorOrder.map((lane) => lane.id), ['google-drive', 'onedrive']);
  assert.match(truth.futureConnectorOrder[0].rule, /separate Drive consent/i);
  assert.match(continuity.getEonDataContinuityLabel(), /Google Drive connection are not active/i);
});

test('W525A migrates local manual-storage activity without claiming a provider connection', () => {
  localStorage.clear();
  localStorage.setItem('eon:cloud-backup-handoff:v2', JSON.stringify({
    'google-drive': { providerId: 'google-drive', label: 'Google Drive', action: 'provider-opened', at: '2026-07-03T00:00:00.000Z' }
  }));
  const before = cloud.getCloudBackupStatus();
  assert.equal(before.connected, false);
  assert.equal(before.manualHandoffCount, 1);
  const receipt = cloud.recordCloudBackupHandoff('google-drive', { action: 'consent-plan-reviewed' });
  assert.equal(receipt.connected, false);
  assert.equal(receipt.uploadVerified, false);
  assert.ok(localStorage.getItem('eon:manual-encrypted-backup-status:v3'));
  assert.equal(localStorage.getItem('eon:cloud-backup-handoff:v2'), null);
});

test('W525A separates recovery, Drive readiness, AI keys, and visual Reveals in Vault/Profile surfaces', () => {
  const vaultHtml = read('vault.html');
  const vaultPage = read('assets/js/vault/eon-vault-page.js');
  const profileHtml = read('profile.html');
  const profilePage = read('assets/js/profile-page.js');
  assert.match(vaultHtml, /1 · Recovery/);
  assert.match(vaultHtml, /id="eon-vault-google-drive"/);
  assert.match(vaultHtml, /id="eon-vault-manual-storage"/);
  assert.match(vaultHtml, /AI provider keys/);
  assert.match(vaultHtml, /Vault Reveals/);
  assert.match(vaultPage, /Google Login stays identity-only/);
  assert.match(profileHtml, /Google Drive backup/);
  assert.match(profilePage, /eon-profile-drive-backup-status/);
});

test('W525A archives obsolete cloud-backup claims and exposes only local-source evidence', () => {
  const active = path.join(ROOT, 'assets/js/utils/cloud-backup-handoff.js');
  const archived = path.join(ROOT, 'archive/w519-legacy-transport-control/assets/js/utils/cloud-backup-handoff.js');
  assert.equal(fs.existsSync(active), false);
  assert.equal(fs.existsSync(archived), true);
  assert.match(read('assets/js/trust-showcase-page.js'), /assets\/js\/local-first\/eon-data-continuity\.js/);
  assert.equal(inspectW525AGoogleDriveVaultProfile({ root: ROOT }).ok, true);
});
