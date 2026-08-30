import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import {
  REALM_VISUAL_PROFILE_KEY,
  createEncryptedRealmVisualBackup,
  exportRealmVisualProfile,
  getRealmVisualProfileTruth,
  readRealmVisualProfile,
  restoreEncryptedRealmVisualBackup,
  saveRealmVisualProfile
} from '../../assets/js/realm/eon-realm-visual-profile.js';
import { W370_MY_REALM_VISUAL_PROFILE_CONTRACT, validateW370MyRealmVisualProfileContract } from '../../config/w370-my-realm-visual-profile-contract.mjs';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) || null, setItem: (key, value) => map.set(key, String(value)) };
}

test('W370 saves only a bounded local Realm visual profile', () => {
  const storage = memoryStorage();
  const result = saveRealmVisualProfile({ theme: 'aurora', landmark: 'garden', companion: 'survey-drone', atmosphere: 'soft-rain', projectDisplay: 'gallery' }, { storage, realmId: 'realm_7x3p9q7d8v', now: 1760000000000 });
  assert.equal(result.ok, true);
  assert.match(storage.getItem(REALM_VISUAL_PROFILE_KEY), /"companion":"survey-drone"/);
  const loaded = readRealmVisualProfile({ storage, realmId: 'realm_7x3p9q7d8v', now: 1760000000000 });
  assert.equal(loaded.profile.atmosphere, 'soft-rain');
  assert.equal(JSON.stringify(loaded.profile).match(/Vault|provider|payment|wallet/i), null);
});

test('W370 encrypted backup restores only presentation preferences', async () => {
  const profile = { realmId: 'realm_7x3p9q7d8v', theme: 'aurora', landmark: 'garden', companion: 'quiet-orb', atmosphere: 'quiet-interior', projectDisplay: 'minimal' };
  const backup = await createEncryptedRealmVisualBackup(profile, 'correct horse battery staple', { cryptoApi: webcrypto, now: 1760000000000 });
  assert.equal(backup.contains, 'realm-visual-profile-only');
  assert.equal(JSON.stringify(backup).match(/correct horse|chat|vault|provider|wallet/i), null);
  const restored = await restoreEncryptedRealmVisualBackup(backup, 'correct horse battery staple', { cryptoApi: webcrypto, now: 1760000000000 });
  assert.equal(restored.profile.companion, 'quiet-orb');
  assert.equal(restored.profile.projectDisplay, 'minimal');
  await assert.rejects(() => restoreEncryptedRealmVisualBackup(backup, 'wrong passphrase', { cryptoApi: webcrypto }), /could not be opened/);
});

test('W370 contract and truth prohibit public publishing and cloud sync', () => {
  assert.deepEqual(validateW370MyRealmVisualProfileContract(), []);
  const truth = getRealmVisualProfileTruth();
  assert.equal(truth.cloudSyncActive, false);
  assert.equal(truth.publicPublishingActive, false);
  assert.equal(exportRealmVisualProfile({ realmId: 'realm_7x3p9q7d8v' }).realmId, 'realm_7x3p9q7d8v');
  assert.equal(W370_MY_REALM_VISUAL_PROFILE_CONTRACT.backup.passphraseStored, false);
});
