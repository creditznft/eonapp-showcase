/**
 * HISTORICAL / NOT RUNNABLE — archived during W525 continuity cleanup.
 *
 * This pre-W519 contract imports retired referral and metadata modules. It is
 * retained only as source archaeology and must never be restored to the active
 * test suite or used to justify a current backup, referral, IPFS, or Arweave
 * capability.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
globalThis.window = { location: { origin: 'https://eonapp.ch' } };
globalThis.document = {
  createElement() { return { click() {}, remove() {}, set href(_) {}, set download(_) {} }; },
  body: { appendChild() {} }
};
globalThis.URL = globalThis.URL || URL;
try { Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true }); } catch {}

const referral = await import('../../assets/js/utils/referral-share-center.js');
const cloud = await import('../../assets/js/utils/cloud-backup-connectors.js');
const quiet = await import('../../assets/js/utils/vault-metadata-quiet-mode.js');

test('W21 referral share center builds platform share targets and records local attempts', async () => {
  localStorage.clear();
  const profile = { uid: 'EON-ABC123', alias: 'Neon Builder' };
  const legacyUrl = referral.buildReferralShareUrl(profile, { source: 'unit', origin: 'https://eonapp.ch' });
  assert.equal(legacyUrl, '');
  assert.deepEqual(referral.buildShareTargets({ url: legacyUrl, text: 'Join me' }), []);
  const signed = await referral.buildSignedReferralShareUrl(profile, { source: 'unit', origin: 'https://eonapp.ch' });
  assert.match(signed.link, /^https:\/\/eonapp\.ch\/r\/#eon2\./);
  const targets = referral.buildShareTargets({ url: signed.link, text: 'Join me' });
  assert.deepEqual(targets.map((target) => target.id), ['whatsapp', 'x', 'facebook', 'telegram', 'email']);
  referral.recordReferralShareAttempt('whatsapp', { source: 'unit', url: signed.link });
  referral.recordReferralShareAttempt('copy', { source: 'unit', url: signed.link });
  const stats = referral.getReferralShareStats();
  assert.equal(stats.total, 2);
  assert.equal(stats.byTarget.whatsapp, 1);
  assert.equal(stats.byTarget.copy, 1);
});

test('W21 cloud backup connector stays honest about manual upload phase', () => {
  localStorage.clear();
  const checklist = cloud.buildCloudBackupChecklist('google-drive');
  assert.match(checklist, /Download encrypted \.eon backup/);
  assert.match(checklist, /cannot silently upload/i);
  const record = cloud.recordCloudBackupHandoff('onedrive', { action: 'provider-opened' });
  assert.equal(record.label, 'OneDrive');
  const status = cloud.getCloudBackupStatus();
  assert.equal(status.connectedCount, 1);
  assert.match(status.label, /OneDrive/);
});

test('W21 Vault metadata quiet mode blocks demo and IPNS storms but allows explicit Arweave/IPFS', () => {
  localStorage.clear();
  assert.equal(quiet.shouldHydrateVaultMetadata({ origin: 'demo-drop', metadataUri: 'ipfs://cid/meta.json' }), false);
  assert.equal(quiet.classifyVaultMetadataRequest({ metadataUri: 'ipns://k51example' }).reason, 'ipns-disabled-launch-safety');
  assert.equal(quiet.shouldHydrateVaultMetadata({ metadataUri: 'https://arweave.net/abc123' }), true);
  assert.equal(quiet.shouldHydrateVaultMetadata({ metadataUri: 'ipfs://bafy/meta.json' }), true);
  quiet.markQuietMetadataSkip({ origin: 'demo-drop' });
  assert.equal(quiet.buildQuietMetadataStatus().skipped, 1);
});

test('W21 Vault and Rewards routes retain current safety boundaries after legacy reward-page retirement', () => {
  const vaultCss = fs.readFileSync('assets/css/vault.css', 'utf8');
  const vaultHtml = fs.readFileSync('vault.html', 'utf8');
  const rewardsHtml = fs.readFileSync('rewards.html', 'utf8');
  const vaultBackupHtml = fs.readFileSync('vault-backup.html', 'utf8');
  assert.match(vaultHtml, /vault-command-center|eon-vault-page/i);
  assert.match(rewardsHtml, /No offerwall, rewarded ad, referral reward, revenue-share, payout, or credit campaign is active/i);
  assert.match(vaultBackupHtml, /Portable Workspace Capsule/);
  assert.match(vaultBackupHtml, /window\.location\.replace\('\/capsule'\)/);
  assert.match(vaultCss, /vault-command-grid|vault-/);
  assert.equal(fs.existsSync('vault-rewards.html'), false);
});
