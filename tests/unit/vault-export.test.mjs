import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

class MemoryStorage {
  constructor(seed = {}) { this.store = { ...seed }; }
  get length() { return Object.keys(this.store).length; }
  key(index) { return Object.keys(this.store)[index] ?? null; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
globalThis.localStorage = new MemoryStorage({
  'eon:profile:v1': JSON.stringify({ uid: 'test-user', alias: 'Test User' }),
  'eon:entitlements:v1': JSON.stringify({ activePlanId: 'free' })
});

const vault = await import('../../assets/js/utils/vault.js');

test('exportVault blocks plaintext export by default', async () => {
  await assert.rejects(() => vault.exportVault(''), /passphrase/i);
});

test('exportVault allows encrypted export with a strong passphrase', async () => {
  const exported = await vault.exportVault('correct horse battery staple 2026');
  const parsed = JSON.parse(exported);
  assert.equal(parsed.encrypted, true);
  assert.equal(parsed.algorithm, 'AES-GCM-256');
  assert.ok(parsed.cipher);
  assert.ok(parsed.envelopeHash);
});
