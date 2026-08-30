import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPortableStateManifest,
  classifyPortableStateKey,
  EON_PORTABLE_STATE_CATEGORIES,
  getPortableStateContract,
  isPortableBackupIncludedKey
} from '../../config/w476-portable-state-contract.mjs';
import {
  buildEonAppRestorePlan,
  collectEonAppOwnedStorage,
  getVaultAccountBoundary,
  isEonAppBackupEligibleKey,
  restoreEonAppOwnedStorage
} from '../../assets/js/vault/eon-vault-lifecycle.js';

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] || null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

test('W476 portable state contract includes durable workspace records and excludes sensitive/payment records', () => {
  assert.equal(isPortableBackupIncludedKey('eon:projects:alpha'), true);
  assert.equal(isPortableBackupIncludedKey('eon:city:preferences:v1'), true);
  assert.equal(isPortableBackupIncludedKey('eon:realm:settings:v1'), true);
  assert.equal(isPortableBackupIncludedKey('eon:local-ai:runtime-status:v1'), true);
  assert.equal(isPortableBackupIncludedKey('eon:ai:api-key:v1'), false);
  assert.equal(isPortableBackupIncludedKey('eon:oauth:state:v1'), false);
  assert.equal(isPortableBackupIncludedKey('eon:checkout:session:v1'), false);
  assert.equal(isPortableBackupIncludedKey('eon:referral:signed:v1'), false);
  assert.equal(classifyPortableStateKey('eon:ai:api-key:v1').category, EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED);
  assert.equal(classifyPortableStateKey('eon:checkout:session:v1').category, EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED);
});

test('W476 manifest explains all reviewed key categories', () => {
  const manifest = buildPortableStateManifest([
    'eon:projects:alpha',
    'eon:city:preferences:v1',
    'eon:theme',
    'eon:oauth:state:v1',
    'random-third-party-key'
  ]);
  assert.equal(manifest.schema, getPortableStateContract().schema);
  assert.equal(manifest.counts[EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP], 2);
  assert.equal(manifest.counts[EON_PORTABLE_STATE_CATEGORIES.EPHEMERAL_NOT_BACKED_UP], 1);
  assert.equal(manifest.counts[EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED], 1);
  assert.equal(manifest.counts[EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED], 1);
  assert.match(manifest.userVisibleExclusionExplanation, /Credentials/);
});

test('Vault collection follows W476 contract and sanitizes excluded/sensitive data', () => {
  const storage = new MemoryStorage({
    'eon:projects:alpha': JSON.stringify({ title: 'Alpha', body: 'draft' }),
    'eon:city:preferences:v1': JSON.stringify({ quality: 'balanced' }),
    'eon:local-ai:runtime-status:v1': JSON.stringify({ mode: 'local-first', apiKey: 'must-not-export', modelName: 'private-model' }),
    'eon:ai:api-key:v1': 'secret',
    'eon:oauth:state:v1': 'oauth-state',
    'eon:checkout:session:v1': 'payment',
    'third-party': 'keep-out'
  });
  assert.equal(isEonAppBackupEligibleKey('eon:projects:alpha'), true);
  assert.equal(isEonAppBackupEligibleKey('eon:ai:api-key:v1'), false);
  const snapshot = collectEonAppOwnedStorage({ storage });
  assert.deepEqual(Object.keys(snapshot).sort(), ['eon:city:preferences:v1', 'eon:local-ai:runtime-status:v1', 'eon:projects:alpha']);
  assert.equal(snapshot['eon:ai:api-key:v1'], undefined);
  assert.equal(snapshot['eon:checkout:session:v1'], undefined);
  assert.doesNotMatch(snapshot['eon:local-ai:runtime-status:v1'], /must-not-export/);
});

test('Vault boundary and restore plan expose portable state manifest', () => {
  const storage = new MemoryStorage({
    'eon:projects:alpha': '{"title":"Alpha"}',
    'eon:oauth:state:v1': 'nope',
    'other': 'preserve'
  });
  const boundary = getVaultAccountBoundary({ storage });
  assert.equal(boundary.portableStateManifest.counts[EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP], 1);
  assert.equal(boundary.portableStateManifest.counts[EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED], 1);
  const plan = buildEonAppRestorePlan({ storage: { 'eon:projects:beta': '{"title":"Beta"}', 'eon:oauth:state:v1': 'ignored' } }, { storage });
  assert.equal(plan.backupOwnedKeyCount, 1);
  assert.equal(plan.ignoredNonEonBackupKeys.includes('eon:oauth:state:v1'), true);
  assert.equal(plan.portableStateManifest.counts[EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP], 1);
  assert.equal(plan.portableStateManifest.counts[EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED], 1);
});

test('Vault restore only writes W476 allowlisted keys and preserves unrelated storage', () => {
  const storage = new MemoryStorage({
    'third-party': 'preserve',
    'eon:ai:api-key:v1': 'local-secret'
  });
  const result = restoreEonAppOwnedStorage({
    storage: {
      'eon:projects:alpha': JSON.stringify({ title: 'Alpha' }),
      'eon:oauth:state:v1': 'nope',
      'eon:checkout:session:v1': 'nope'
    }
  }, { storage, mode: 'merge', now: Date.parse('2026-07-01T00:00:00Z') });
  assert.equal(result.ok, true);
  assert.equal(storage.getItem('eon:projects:alpha'), JSON.stringify({ title: 'Alpha' }));
  assert.equal(storage.getItem('eon:oauth:state:v1'), null);
  assert.equal(storage.getItem('eon:checkout:session:v1'), null);
  assert.equal(storage.getItem('eon:ai:api-key:v1'), 'local-secret');
  assert.equal(storage.getItem('third-party'), 'preserve');
});
