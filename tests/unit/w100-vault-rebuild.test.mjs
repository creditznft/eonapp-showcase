import test from 'node:test';
import assert from 'node:assert/strict';
import { routeForVaultHash, summarizeVaultState } from '../../assets/js/vault/vault-shell.js';

class MemoryStorage {
  constructor(seed = {}) { this.store = { ...seed }; }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
}

test('legacy Vault hashes route to focused modules', () => {
  assert.equal(routeForVaultHash('#api-keys'), '/vault');
  assert.equal(routeForVaultHash('#backup'), '/capsule');
  assert.equal(routeForVaultHash('#profile'), '/profile');
  assert.equal(routeForVaultHash('#claims'), '/rewards');
  assert.equal(routeForVaultHash('#wallet'), '/rewards');
  assert.equal(routeForVaultHash('#nft-collection'), '/market');
  assert.equal(routeForVaultHash('#unknown'), null);
});

test('Vault Home summary exposes status only, never secret values', () => {
  const secret = 'REDACTED_OPENAI_KEY';
  const storage = new MemoryStorage({
    'eon:profile:v1': JSON.stringify({ id: 'local-id', alias: 'Safe Alias', recovery: { lastExportAt: '2026-06-10T00:00:00.000Z' } }),
    'eon:ai-provider-health:v1': JSON.stringify({ openai: { ok: true, checkedAt: '2026-06-10T00:00:00.000Z', rawKey: secret } }),
    'eon:pool-points:v2': JSON.stringify({ total: 420 }),
    'eon:entitlements:v1': JSON.stringify({ activePlanId: 'pro' }),
    'eon:nft:collection:v1': JSON.stringify([{ id: 'one' }, { id: 'two' }]),
    'eon:ai:keys:v1': JSON.stringify({ openai: secret })
  });
  const summary = summarizeVaultState(storage);
  const serialized = JSON.stringify(summary);
  assert.equal(summary.providers.label, '1 verified');
  assert.equal(summary.backup.label, 'Protected');
  assert.equal(summary.identity.label, 'Ready');
  assert.equal(summary.rewards.label, '420 points');
  assert.equal(summary.payments.label, 'pro active');
  assert.equal(summary.inventory.label, '2 items');
  assert.equal(serialized.includes(secret), false);
});

test('Vault Home summary has clear empty states', () => {
  const summary = summarizeVaultState(new MemoryStorage());
  assert.equal(summary.providers.label, 'Not configured');
  assert.equal(summary.backup.label, 'Backup needed');
  assert.equal(summary.identity.label, 'Local setup');
  assert.equal(summary.rewards.label, '0 points');
  assert.equal(summary.payments.label, 'Free plan');
  assert.equal(summary.inventory.label, '0 items');
});
