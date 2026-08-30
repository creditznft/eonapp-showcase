import assert from 'node:assert/strict';
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
globalThis.location = { origin: 'https://eonapp.ch', pathname: '/' };
globalThis.window = {
  location: globalThis.location,
  setTimeout,
  clearTimeout,
  AbortController: globalThis.AbortController,
  navigator: { webdriver: false },
  dispatchEvent() {},
  CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }
};
try { Object.defineProperty(globalThis, 'navigator', { value: globalThis.window.navigator, configurable: true }); } catch {}
globalThis.CustomEvent = globalThis.window.CustomEvent;

const runtime = await import('../../assets/js/chat/ai-runtime.js');

test('RT85 disabled hosted providers fail closed without discovery network calls', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error('disabled provider must not reach network'); };

  for (const providerId of ['cohere', 'anthropic', 'nvidia', 'sambanova']) {
    const result = await runtime.verifyProviderReadiness(providerId, 'legacy_saved_key', { forceRefresh: true });
    assert.equal(result.ok, false, `${providerId} must not verify while disabled`);
    assert.equal(result.status, 'provider-disabled');
    assert.match(result.error, /disabled in this browser runtime/i);
    assert.deepEqual(await runtime.discoverProviderModels(providerId, 'legacy_saved_key', true), []);
    const proof = runtime.getProviderVerification(providerId);
    assert.equal(proof.ready, false);
    assert.equal(proof.state, 'provider-disabled');
  }

  assert.equal(fetchCalls, 0);
});

test('RT85 explicit stale disabled settings cannot execute batch or streaming chat', async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error('disabled provider must not reach network'); };

  await assert.rejects(
    runtime.createAIReply({ input: 'hello', settings: { provider: 'cohere' } }),
    /disabled in this browser runtime/i
  );
  await assert.rejects(
    runtime.createAIReplyStream({ input: 'hello', settings: { provider: 'anthropic' }, onChunk() {} }),
    /disabled in this browser runtime/i
  );
  assert.equal(fetchCalls, 0);
});
