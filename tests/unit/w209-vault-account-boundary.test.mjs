import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { RETIRED_REDIRECTS, createDevRouteRewrites, renderCloudflareRedirects } from '../../config/route-contract.mjs';

import {
  buildEonAppRestorePlan,
  clearEonAppOwnedStorage,
  collectEonAppOwnedStorage,
  EON_VAULT_CLEAR_CONFIRMATION,
  getVaultAccountBoundary,
  isEonAppBackupEligibleKey,
  isEonAppOwnedStorageKey,
  migrateKnownLegacyProviderStorage,
  restoreEonAppOwnedStorage
} from '../../assets/js/vault/eon-vault-lifecycle.js';

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

class MemoryStorage {
  constructor(seed = {}) { this.store = { ...seed }; }
  get length() { return Object.keys(this.store).length; }
  key(index) { return Object.keys(this.store)[index] ?? null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
}

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W209 defines a local profile boundary and excludes unrelated same-origin storage from Vault scope', () => {
  const storage = new MemoryStorage({
    'eon:profile:v1': JSON.stringify({ alias: 'EON user' }),
    'eonapp.user.slug': 'eon-user',
    'eon:vault:api-keys:v1': JSON.stringify({ openai: { apiKey: 'never-export' } }),
    'thirdparty:session': 'do-not-back-up',
    'random:key': 'do-not-back-up'
  });
  assert.equal(isEonAppOwnedStorageKey('eon:profile:v1'), true);
  assert.equal(isEonAppOwnedStorageKey('eonapp.user.slug'), true);
  assert.equal(isEonAppOwnedStorageKey('thirdparty:session'), false);
  assert.equal(isEonAppBackupEligibleKey('eon:profile:v1'), true);
  assert.equal(isEonAppBackupEligibleKey('eon:vault:api-keys:v1'), false);
  assert.equal(isEonAppBackupEligibleKey('eonapp.user.slug'), false);
  assert.deepEqual(Object.keys(collectEonAppOwnedStorage({ storage })).sort(), ['eon:profile:v1']);
  const boundary = getVaultAccountBoundary({ storage });
  assert.equal(boundary.authenticatedCrossDeviceAccount, false);
  assert.equal(boundary.cloudSyncActive, false);
  assert.equal(boundary.unrelatedSameOriginKeyCount, 2);
  assert.match(boundary.restoreRule, /unrelated/i);
});

test('W209 defaults to merge restore and preserves current-only EON data plus unrelated storage', () => {
  const storage = new MemoryStorage({
    'eon:profile:v1': 'before',
    'eon:library:current-only:v1': 'keep-current',
    'thirdparty:session': 'preserve-me'
  });
  const snapshot = {
    storage: {
      'eon:profile:v1': 'from-backup',
      'eon:projects:restored:v1': 'new-record',
      'thirdparty:malicious': 'must-ignore'
    }
  };
  const plan = buildEonAppRestorePlan(snapshot, { storage });
  assert.equal(plan.defaultMode, 'merge');
  assert.deepEqual(plan.overwriteKeys, ['eon:profile:v1']);
  assert.deepEqual(plan.createKeys, ['eon:projects:restored:v1']);
  assert.deepEqual(plan.ignoredNonEonBackupKeys, ['thirdparty:malicious']);
  const result = restoreEonAppOwnedStorage(snapshot, { storage });
  assert.equal(result.ok, true);
  assert.equal(storage.getItem('eon:profile:v1'), 'from-backup');
  assert.equal(storage.getItem('eon:projects:restored:v1'), 'new-record');
  assert.equal(storage.getItem('eon:library:current-only:v1'), 'keep-current');
  assert.equal(storage.getItem('thirdparty:session'), 'preserve-me');
  assert.equal(storage.getItem('thirdparty:malicious'), null);
});

test('W209 replace mode removes stale EONAPP keys but still preserves unrelated storage', () => {
  const storage = new MemoryStorage({
    'eon:profile:v1': 'before',
    'eon:projects:stale:v1': 'remove-me',
    'external:settings': 'keep-me'
  });
  const result = restoreEonAppOwnedStorage({ storage: { 'eon:profile:v1': 'after' } }, { storage, mode: 'replace-eonapp' });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'replace-eonapp');
  assert.equal(storage.getItem('eon:profile:v1'), 'after');
  assert.equal(storage.getItem('eon:projects:stale:v1'), null);
  assert.equal(storage.getItem('external:settings'), 'keep-me');
});

test('W209 clear-data action requires exact confirmation and cannot clear unrelated storage', () => {
  const storage = new MemoryStorage({ 'eon:profile:v1': 'delete-me', 'external:keep': 'keep-me' });
  const blocked = clearEonAppOwnedStorage({ storage, confirmation: 'DELETE' });
  assert.equal(blocked.ok, false);
  assert.equal(storage.getItem('eon:profile:v1'), 'delete-me');
  const cleared = clearEonAppOwnedStorage({ storage, confirmation: EON_VAULT_CLEAR_CONFIRMATION, now: 100 });
  assert.equal(cleared.ok, true);
  assert.equal(storage.getItem('eon:profile:v1'), null);
  assert.equal(storage.getItem('external:keep'), 'keep-me');
  assert.match(storage.getItem('eon:vault:clear-receipt:v1'), /unrelatedBrowserStoragePreserved/);
});

test('W209 known legacy provider migration encrypts through the supplied vault and stores no raw value in receipt or source', async () => {
  const rawSecret = 'REDACTED_OPENAI_KEY';
  const storage = new MemoryStorage({
    'eon:onboarding:providers:v1': JSON.stringify({ openai: { apiKey: rawSecret, region: 'local' } }),
    'eon:ai:keys:v1': JSON.stringify({ groq: rawSecret })
  });
  const stored = [];
  const sessionStorage = new MemoryStorage();
  const result = await migrateKnownLegacyProviderStorage({
    storage,
    sessionStorage,
    now: 100,
    confirmedByUser: true,
    passphrase: 'institutional recovery passphrase',
    vault: { store: async (provider, secret, options) => {
      assert.equal(options.persist, true);
      assert.equal(options.passphrase, 'institutional recovery passphrase');
      stored.push({ provider, secret });
    } }
  });
  assert.equal(result.ok, true);
  assert.deepEqual(stored.map((row) => row.provider).sort(), ['groq', 'openai']);
  assert.ok(stored.every((row) => row.secret === rawSecret));
  assert.doesNotMatch(storage.getItem('eon:onboarding:providers:v1') || '', new RegExp(rawSecret));
  assert.doesNotMatch(storage.getItem('eon:ai:keys:v1') || '', new RegExp(rawSecret));
  assert.doesNotMatch(storage.getItem('eon:vault:migration-receipt:v1') || '', new RegExp(rawSecret));
  assert.match(storage.getItem('eon:vault:migration-receipt:v1') || '', /migratedProviderCount/);
});

test('W209 portable backup excludes raw credential containers and restores only allowlisted state', () => {
  const storage = new MemoryStorage({
    'eon:projects:v2': JSON.stringify({ title: 'Safe project', apiKey: 'nested-secret', keep: true }),
    'eon:vault:api-keys:v1': JSON.stringify({ openai: { apiKey: 'raw-secret' } }),
    'eon:api-key-vault:v1': JSON.stringify({ openai: { ct: 'encrypted-but-local-only' } }),
    'eon:wallet:v1': JSON.stringify({ seed: 'never-export' }),
    'thirdparty:session': 'unrelated'
  });
  const backup = collectEonAppOwnedStorage({ storage });
  assert.deepEqual(Object.keys(backup), ['eon:projects:v2']);
  assert.doesNotMatch(backup['eon:projects:v2'], /nested-secret/);
  const result = restoreEonAppOwnedStorage({ storage: {
    'eon:projects:v2': JSON.stringify({ title: 'restore', token: 'strip-this' }),
    'eon:vault:api-keys:v1': JSON.stringify({ apiKey: 'ignore-this' }),
    'eon:wallet:v1': JSON.stringify({ seed: 'ignore-this' })
  } }, { storage });
  assert.equal(result.ok, true);
  assert.doesNotMatch(storage.getItem('eon:projects:v2') || '', /strip-this/);
  assert.match(storage.getItem('eon:vault:api-keys:v1') || '', /raw-secret/);
  assert.match(storage.getItem('eon:wallet:v1') || '', /never-export/);
});

test('W518 replaces the retired Vault backup page with a single encrypted Capsule route', () => {
  const legacyPage = read('vault-backup.html');
  const capsule = read('capsule.html');
  const runtime = read('assets/js/local-first/eon-workspace-capsule-page.js');
  const vaultHome = read('vault.html');
  const redirects = read('_redirects');
  const vite = read('vite.config.mjs');
  assert.match(legacyPage, /window\.location\.replace\('\/capsule'\)/);
  assert.doesNotMatch(legacyPage, /<input\b|eon-vault-backup-page\.js/);
  assert.match(capsule, /Portable Workspace Capsule/);
  assert.match(capsule, /eon-workspace-capsule-page\.js/);
  assert.match(runtime, /stageCapsule|createWorkspaceCapsule/);
  assert.match(vaultHome, /href="\/capsule"/);
  assert.equal(redirects, renderCloudflareRedirects());
  assert.equal(RETIRED_REDIRECTS.some((row) => row.from === '/vault/backup' && row.to === '/capsule' && row.status === 301), true);
  assert.equal(RETIRED_REDIRECTS.some((row) => row.from === '/vault-payments.html' && row.to === '/archive' && row.status === 301), true);
  const rewrites = createDevRouteRewrites();
  assert.equal(rewrites.get('/capsule'), '/capsule.html');
  assert.equal(rewrites.get('/vault/backup'), '/capsule.html');
  assert.match(vite, /createDevRouteRewrites/);
});
