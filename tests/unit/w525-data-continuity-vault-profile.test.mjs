import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
  clear() { this.values.clear(); }
}

globalThis.localStorage = new MemoryStorage();

const continuity = await import('../../assets/js/local-first/eon-data-continuity.js');
const cloud = await import('../../assets/js/utils/cloud-backup-connectors.js');
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W525 makes encrypted manual continuity explicit and refuses to imply automatic sync', () => {
  const truth = continuity.getEonDataContinuityTruth();
  assert.equal(truth.localFirst, true);
  assert.equal(truth.automaticCrossDeviceSyncActive, false);
  assert.equal(truth.automaticCloudUploadActive, false);
  assert.equal(truth.managedRecoveryVaultActive, false);
  assert.equal(truth.providerCredentialsStoredForBackup, false);
  assert.deepEqual(truth.futureConnectorOrder.map((lane) => lane.id), ['google-drive', 'onedrive']);
  assert.match(continuity.getEonDataContinuityLabel(), /not active/i);
  assert.match(truth.conflictPolicy, /No background merge exists/i);
});

test('W525 treats manual storage handoff as unverified local activity, never a connected provider', () => {
  localStorage.clear();
  const checklist = cloud.buildCloudBackupChecklist('google-drive');
  assert.match(checklist, /manual encrypted-storage checklist/i);
  assert.match(checklist, /cannot silently upload, verify, synchronize, or restore/i);
  const receipt = cloud.recordCloudBackupHandoff('onedrive', { action: 'provider-opened' });
  assert.equal(receipt.manualOnly, true);
  assert.equal(receipt.uploadVerified, false);
  assert.equal(receipt.connected, false);
  const status = cloud.getCloudBackupStatus();
  assert.equal(status.manualHandoffCount, 1);
  assert.equal(status.connectedCount, 0);
  assert.equal(status.connected, false);
  assert.equal(status.automaticUploadActive, false);
  assert.equal(status.crossDeviceSyncActive, false);
});

test('W525 retires the dormant remote Vault publishing contract and aligns Vault and Profile copy', () => {
  const vault = read('assets/js/utils/vault.js');
  const vaultPage = read('assets/js/vault/eon-vault-page.js');
  const vaultHtml = read('vault.html');
  const profile = read('assets/js/profile-page.js');
  const profileHtml = read('profile.html');

  assert.doesNotMatch(vault, /registerVaultBackupHook|vaultBackupHooks|publishVaultToHooks|optionalMirrors/);
  assert.match(vault, /Remote Vault publishing is retired/);
  assert.match(vault, /automaticCrossDeviceSyncActive: false/);
  assert.match(vault, /futureConnectorOrder: \['Google Drive encrypted backup', 'OneDrive encrypted backup'\]/);
  assert.match(vaultPage, /getEonDataContinuityTruth/);
  assert.match(vaultPage, /renderDataContinuity/);
  assert.match(vaultHtml, /id="eon-vault-continuity"/);
  assert.match(profileHtml, /Manual encrypted Capsule restore is the live transfer path; automatic multi-device sync is not active/);
  assert.match(profile, /getEonDataContinuityLabel/);
  assert.match(profile, /Google Drive backup uses a separate explicit permission only from the Capsule page and never reuses Google Login consent/);
  assert.doesNotMatch(profile, /future paired device/);
});

test('W525 keeps Vault Reveals as visual-only, non-sensitive planned progression', () => {
  const collection = read('assets/js/collection/eon-collection-workspace.js');
  const css = read('assets/css/eon-vault-v2.css');
  assert.match(collection, /visual progression language only/i);
  assert.match(collection, /never money, tokens, NFTs, paid chance, or a marketplace/i);
  assert.match(collection, /Nothing can be earned, bought, traded, transferred, sold, or used as an account entitlement/i);
  assert.doesNotMatch(collection, /fetch\s*\(/);
  assert.match(css, /prefers-reduced-motion/);
});
