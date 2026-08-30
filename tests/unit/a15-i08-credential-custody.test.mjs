import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import test from 'node:test';
import { migrateKnownLegacyProviderStorage } from '../../assets/js/vault/eon-vault-lifecycle.js';

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); this.reads = []; }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { this.reads.push(String(key)); return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}


class OneShotKeyFailureStorage extends MemoryStorage {
  constructor(seed = {}, failKey = '') { super(seed); this.failKey = failKey; this.failed = false; }
  setItem(key, value) {
    if (!this.failed && String(key) === this.failKey) {
      this.failed = true;
      throw new Error('simulated-storage-failure');
    }
    super.setItem(key, value);
  }
}

class OneShotCorruptStorage extends MemoryStorage {
  corruptNextVaultWrite = false;
  setItem(key, value) {
    if (this.corruptNextVaultWrite && String(key) === 'eon:api-key-vault:v2') {
      this.corruptNextVaultWrite = false;
      this.map.set(String(key), `${String(value)}-corrupt`);
      return;
    }
    super.setItem(key, value);
  }
}

async function loadVault({ localStorage = new MemoryStorage(), sessionStorage = new MemoryStorage() } = {}) {
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = sessionStorage;
  const module = await import(`../../assets/js/utils/api-key-vault.js?i08=${Date.now()}-${Math.random()}`);
  return { ...module, localStorage, sessionStorage };
}

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('A15 I08 keeps BYOK credentials session-only unless durable recovery is explicitly requested', async () => {
  const { ApiKeyVault, localStorage, sessionStorage } = await loadVault();
  const receipt = await ApiKeyVault.store('groq', 'gsk_session_only');
  assert.equal(receipt.ok, true);
  assert.equal(receipt.custody, 'session-only');
  assert.equal(receipt.durableRecoveryCreated, false);
  assert.equal(localStorage.getItem('eon:api-key-vault:v2'), null);
  assert.match(sessionStorage.getItem('eon:ai-chat-session-keys:v1') || '', /groq/);
  assert.doesNotMatch(JSON.stringify(receipt), /gsk_session_only/);
});

test('A15 I08 creates only passphrase-encrypted recovery and never persists the passphrase or a device secret', async () => {
  const { ApiKeyVault, localStorage, sessionStorage } = await loadVault();
  const rawKey = 'gsk_durable_private_value';
  const passphrase = 'institutional recovery passphrase';
  const receipt = await ApiKeyVault.store('groq', rawKey, { persist: true, passphrase });
  const stored = localStorage.getItem('eon:api-key-vault:v2') || '';
  assert.equal(receipt.custody, 'encrypted-passphrase');
  assert.doesNotMatch(stored, new RegExp(rawKey));
  assert.doesNotMatch(stored, new RegExp(passphrase));
  assert.equal(localStorage.getItem('eon:api-key-vault:device-secret:v1'), null);
  sessionStorage.removeItem('eon:ai-chat-session-keys:v1');
  assert.equal((await ApiKeyVault.diagnoseRetrieve('groq')).failureStage, 'passphrase-required');
  assert.equal(await ApiKeyVault.retrieve('groq', { passphrase }), rawKey);
  assert.equal(await ApiKeyVault.retrieve('groq', { passphrase: 'wrong passphrase value' }), null);
});

test('A15 I08 rolls back a durable write that cannot be read back exactly', async () => {
  const storage = new OneShotCorruptStorage({ 'eon:api-key-vault:v2': '{}' });
  const sessionStorage = new MemoryStorage();
  const { ApiKeyVault } = await loadVault({ localStorage: storage, sessionStorage });
  storage.corruptNextVaultWrite = true;
  await assert.rejects(
    ApiKeyVault.store('openai', 'sk_verified_write', { persist: true, passphrase: 'institutional recovery passphrase' }),
    /did not verify|verification failed/i
  );
  assert.equal(storage.getItem('eon:api-key-vault:v2'), '{}');
  assert.equal(await ApiKeyVault.retrieve('openai'), 'sk_verified_write', 'failed durable persistence must leave the already-verified session key available');
});

test('A15 I08 never reads legacy credential values during ordinary status inspection', async () => {
  const secretField = ['api', 'Key'].join('');
  const legacyFixture = ['never', 'read', 'automatically'].join('-');
  const localStorage = new MemoryStorage({
    'eon:onboarding:providers:v1': JSON.stringify({ openai: { [secretField]: legacyFixture } }),
    'eon:api-key-vault:v1': JSON.stringify({ openai: { ciphertext: 'legacy' } }),
    'eon:api-key-vault:device-secret:v1': 'legacy-device-secret'
  });
  const { ApiKeyVault } = await loadVault({ localStorage });
  localStorage.reads.length = 0;
  const status = ApiKeyVault.status();
  assert.equal(status.automaticLegacyRead, false);
  assert.equal(status.legacyPlaintextSourcePresent, true);
  assert.equal(status.legacyEncryptedSourcePresent, true);
  assert.equal(status.legacyDeviceSecretSourcePresent, true);
  assert.equal(status.legacyPlaintextProviders.length, 0);
  assert.equal(status.legacyEncryptedProviders.length, 0);
  assert.ok(!localStorage.reads.includes('eon:onboarding:providers:v1'));
  assert.ok(!localStorage.reads.includes('eon:api-key-vault:v1'));
  assert.ok(!localStorage.reads.includes('eon:api-key-vault:device-secret:v1'));
});

test('A15 I08 requires explicit reviewed migration and removes plaintext only after verified encrypted writes', async () => {
  const rawSecret = 'sk_plaintext_migration_value';
  const localStorage = new MemoryStorage({
    'eon:onboarding:providers:v1': JSON.stringify({ openai: { apiKey: rawSecret, region: 'local' } })
  });
  const sessionStorage = new MemoryStorage();
  const { ApiKeyVault } = await loadVault({ localStorage, sessionStorage });
  const blocked = await ApiKeyVault.migrateFromPlaintext({ storage: localStorage, sessionStorage, passphrase: 'institutional recovery passphrase' });
  assert.equal(blocked.reason, 'explicit-confirmation-required');
  assert.match(localStorage.getItem('eon:onboarding:providers:v1') || '', new RegExp(rawSecret));

  const migrated = await ApiKeyVault.migrateFromPlaintext({
    storage: localStorage,
    sessionStorage,
    passphrase: 'institutional recovery passphrase',
    confirmedByUser: true
  });
  assert.equal(migrated.ok, true);
  assert.equal(migrated.migrated, 1);
  assert.doesNotMatch(localStorage.getItem('eon:onboarding:providers:v1') || '', new RegExp(rawSecret));
  assert.doesNotMatch(localStorage.getItem('eon:api-key-vault:v2') || '', new RegExp(rawSecret));
  assert.doesNotMatch(JSON.stringify(migrated), new RegExp(rawSecret));
});

test('A15 I08 preserves malformed legacy credential sources without mutation', async () => {
  const localStorage = new MemoryStorage({ 'eon:onboarding:providers:v1': '{malformed-json' });
  const before = localStorage.getItem('eon:onboarding:providers:v1');
  const result = await migrateKnownLegacyProviderStorage({
    storage: localStorage,
    sessionStorage: new MemoryStorage(),
    confirmedByUser: true,
    passphrase: 'institutional recovery passphrase'
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'legacy-source-unrecognized');
  assert.equal(result.rolledBack, true);
  assert.equal(localStorage.getItem('eon:onboarding:providers:v1'), before);
  assert.equal(localStorage.getItem('eon:api-key-vault:v2'), null);
});

test('A15 I08 migrates the duplicate profile authority through a verified allowlisted write', async () => {
  const providerSecretField = ['api', 'Key'].join('');
  const identitySecretField = ['private', 'Key'].join('');
  const providerFixture = ['never', 'copy', 'api', 'value'].join('-');
  const identityFixture = ['never', 'copy', 'identity', 'value'].join('-');
  const rawProfile = {
    uid: 'user-profile-migration',
    alias: 'Safe User',
    [providerSecretField]: providerFixture,
    [identitySecretField]: identityFixture,
    stats: { totalRuns: 3 }
  };
  const localStorage = new MemoryStorage({ 'eon:profile:v1': JSON.stringify(rawProfile) });
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = new MemoryStorage();
  globalThis.window = { location: { origin: 'https://eonapp.ch', pathname: '/' }, dispatchEvent() {} };
  globalThis.document = { dispatchEvent() {} };
  const profileModule = await import(`../../assets/js/utils/profile.js?i08=${Date.now()}-${Math.random()}`);
  const profile = profileModule.getProfile();
  const canonical = localStorage.getItem('eon:profile') || '';
  const receipt = localStorage.getItem(profileModule.EON_PROFILE_MIGRATION_RECEIPT_KEY) || '';
  assert.match(profile.uid, /^g_[a-f0-9]+$/);
  assert.equal(profileModule.getProfile().uid, profile.uid);
  assert.equal(profile.stats.totalRuns, 3);
  assert.equal(localStorage.getItem('eon:profile:v1'), null);
  assert.ok(!canonical.includes(providerFixture) && !canonical.includes(identityFixture));
  assert.ok(!canonical.includes(providerSecretField) && !canonical.includes(identitySecretField));
  assert.ok(!receipt.includes(providerFixture) && !receipt.includes(identityFixture) && !receipt.includes('Safe User'));
  assert.equal(profileModule.getProfileMigrationTruth().duplicateProfileAuthority, false);
});

test('A15 I08 rolls profile migration back when its receipt cannot be verified', async () => {
  const legacyRaw = JSON.stringify({ uid: 'profile-rollback-user', alias: 'Rollback User', stats: { totalRuns: 2 } });
  const localStorage = new OneShotKeyFailureStorage(
    { 'eon:profile:v1': legacyRaw },
    'eon:profile:migration-receipt:a15-i08:v1'
  );
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = new MemoryStorage();
  globalThis.window = { location: { origin: 'https://eonapp.ch', pathname: '/' }, dispatchEvent() {} };
  globalThis.document = { dispatchEvent() {} };
  const profileModule = await import(`../../assets/js/utils/profile.js?rollback=${Date.now()}-${Math.random()}`);
  assert.equal(profileModule.getProfile(), null);
  assert.equal(localStorage.getItem('eon:profile:v1'), legacyRaw);
  assert.equal(localStorage.getItem('eon:profile'), null);
  assert.equal(localStorage.getItem(profileModule.EON_PROFILE_MIGRATION_RECEIPT_KEY), null);
});

test('A15 I08 exposes passphrase recovery in Vault and removes automatic legacy key bridges', () => {
  const apiVault = read('assets/js/utils/api-key-vault.js');
  const vaultHtml = read('vault.html');
  const vaultPage = read('assets/js/vault/eon-vault-page.js');
  const workbench = read('assets/js/workbench-ai.js');
  const freeAi = read('assets/js/free-ai-power-page.js');
  assert.match(vaultHtml, /session-only by default/i);
  assert.match(vaultHtml, /eon-vault-provider-passphrase/);
  assert.match(vaultHtml, /autocomplete="new-password"/);
  assert.match(vaultPage, /persist: true, passphrase/);
  assert.doesNotMatch(apiVault, /eon:identity:session|eon:identity:v1|\.privateKey|Math\.random\(|eon-vault-session-fallback/);
  assert.doesNotMatch(workbench, /localStorage\.getItem\(WORKBENCH_KEYS_KEY\)|bridgeWorkbenchKeys\(/);
  assert.doesNotMatch(freeAi, /localStorage\.getItem\(LEGACY_STORAGE_KEY\)/);
});
