import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEonStorageGateway,
  EON_STORAGE_CLASSES,
  EON_STORAGE_STATUSES,
  getEonStorageRecoveryMessage
} from '../../assets/js/utils/storage-gateway.js';

class MemoryStorage {
  constructor(seed = {}) { this.rows = new Map(Object.entries(seed).map(([key, value]) => [String(key), String(value)])); }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
}

class ThrowingStorage extends MemoryStorage {
  constructor(name) { super(); this.name = name; }
  getItem() { const err = new Error(this.name); err.name = this.name; throw err; }
  setItem() { const err = new Error(this.name); err.name = this.name; throw err; }
  removeItem() { const err = new Error(this.name); err.name = this.name; throw err; }
}

class LostWriteStorage extends MemoryStorage {
  setItem() { /* pretend success but lose data */ }
}

test('W476 durable writes read back and report ok only when verified', () => {
  const gateway = createEonStorageGateway(new MemoryStorage());
  const result = gateway.setJson('eon:test:durable', { ok: true });
  assert.equal(result.status, EON_STORAGE_STATUSES.OK);
  assert.equal(result.ok, true);
  assert.deepEqual(gateway.getJson('eon:test:durable').value, { ok: true });
});

test('W476 lost durable writes become verification-failed, not false success', () => {
  const result = createEonStorageGateway(new LostWriteStorage()).setRaw('eon:test:lost', 'value');
  assert.equal(result.ok, false);
  assert.equal(result.status, EON_STORAGE_STATUSES.VERIFICATION_FAILED);
  assert.match(getEonStorageRecoveryMessage(result), /verify|saved copy/i);
});

test('W476 quota, security and unavailable storage return explicit statuses', () => {
  assert.equal(createEonStorageGateway(new ThrowingStorage('QuotaExceededError')).setRaw('a', 'b').status, EON_STORAGE_STATUSES.QUOTA_EXCEEDED);
  assert.equal(createEonStorageGateway(new ThrowingStorage('SecurityError')).setRaw('a', 'b').status, EON_STORAGE_STATUSES.SECURITY_ERROR);
  assert.equal(createEonStorageGateway(null).available().status, EON_STORAGE_STATUSES.UNAVAILABLE);
});

test('W476 malformed JSON is serialization-error with fallback value', () => {
  const storage = new MemoryStorage({ 'eon:bad:json': '{bad json' });
  const result = createEonStorageGateway(storage).getJson('eon:bad:json', { safe: true });
  assert.equal(result.status, EON_STORAGE_STATUSES.SERIALIZATION_ERROR);
  assert.deepEqual(result.value, { safe: true });
});

test('W476 ephemeral writes are explicitly marked and do not claim durable verification', () => {
  const gateway = createEonStorageGateway(new MemoryStorage());
  const result = gateway.setRaw('eon:ephemeral:test', '1', { storageClass: EON_STORAGE_CLASSES.EPHEMERAL });
  assert.equal(result.status, EON_STORAGE_STATUSES.OK);
  assert.equal(result.storageClass, EON_STORAGE_CLASSES.EPHEMERAL);
});

