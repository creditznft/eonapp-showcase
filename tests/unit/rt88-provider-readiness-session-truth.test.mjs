import assert from 'node:assert/strict';
import test from 'node:test';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(String(key)) ? this.values.get(String(key)) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

test('RT88 never treats cached health as hosted-provider readiness without an active session key', async () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousSessionStorage = globalThis.sessionStorage;
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  try {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorage, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorage, configurable: true });
    const runtime = await import(new URL(`../../assets/js/chat/ai-runtime.js?rt88-provider-readiness=${Date.now()}`, import.meta.url).href);
    const checkedAt = new Date().toISOString();
    localStorage.setItem('eon:ai-provider-health:v1', JSON.stringify({
      cerebras: { ok: true, status: 'verified-model-list', model: 'llama3.1-8b', checkedAt }
    }));

    const stale = runtime.getProviderVerification('cerebras');
    assert.equal(stale.ready, false);
    assert.equal(stale.state, 'stale-health-not-ready');

    localStorage.setItem('eon:api-key-vault:v2', JSON.stringify({
      cerebras: {
        schema: 'eon.api-key-vault.entry.a15-i08.v2',
        salt: 'a', iv: 'b', ciphertext: 'c', createdAt: checkedAt,
        iterations: 310_000, cipher: 'AES-GCM-256', kdf: 'PBKDF2-SHA-256'
      }
    }));
    const restore = runtime.getProviderVerification('cerebras');
    assert.equal(restore.ready, false);
    assert.equal(restore.state, 'encrypted-recovery-available-restore-required');

    sessionStorage.setItem('eon:ai-chat-session-keys:v1', JSON.stringify({ cerebras: 'session-only-test-key' }));
    const session = runtime.getProviderVerification('cerebras');
    assert.equal(session.ready, true, 'a current model receipt becomes usable only after an active session key is present');
    assert.equal(session.state, 'provider/model-ready');
    assert.equal(session.sessionReady, true);
    assert.notEqual(session.state, 'stale-health-not-ready');
  } finally {
    if (typeof previousLocalStorage === 'undefined') delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { value: previousLocalStorage, configurable: true });
    if (typeof previousSessionStorage === 'undefined') delete globalThis.sessionStorage;
    else Object.defineProperty(globalThis, 'sessionStorage', { value: previousSessionStorage, configurable: true });
  }
});
