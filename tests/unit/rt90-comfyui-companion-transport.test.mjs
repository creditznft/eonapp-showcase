import test from 'node:test';
import assert from 'node:assert/strict';

const moduleUrl = new URL('../../assets/js/local-ai/eon-local-bridge-client.js', import.meta.url);

function storageHarness() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function installPairedSession(storage) {
  storage.setItem('eon:local-ai:bridge-session:v1', JSON.stringify({
    schema: 'eon.local-ai.bridge.v1',
    token: 'rt90-test-session-token',
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  }));
}

async function loadFresh(tag) {
  return import(`${moduleUrl.href}?rt90=${encodeURIComponent(tag)}-${Date.now()}-${Math.random()}`);
}

test('RT90 paired ComfyUI requests prefer Local Companion so users do not need ComfyUI CORS changes', async () => {
  const priorFetch = globalThis.fetch;
  const priorStorage = globalThis.sessionStorage;
  const storage = storageHarness();
  installPairedSession(storage);
  globalThis.sessionStorage = storage;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url) === 'http://127.0.0.1:17565/v1/proxy') {
      const payload = JSON.parse(String(options.body || '{}'));
      assert.equal(payload.url, 'http://127.0.0.1:8188/system_stats');
      assert.equal(payload.method, 'GET');
      return new Response(JSON.stringify({ system: { comfyui_version: 'rt90-test' } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error(`unexpected-direct-request:${url}`);
  };
  try {
    const { fetchLocalAiWithBridgeFallback } = await loadFresh('bridge-first');
    const response = await fetchLocalAiWithBridgeFallback('http://127.0.0.1:8188/system_stats', { headers: { accept: 'application/json' } });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://127.0.0.1:17565/v1/proxy');
  } finally {
    globalThis.fetch = priorFetch;
    if (priorStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = priorStorage;
  }
});

test('RT90 ComfyUI uses direct loopback only when the paired Companion transport itself is unreachable', async () => {
  const priorFetch = globalThis.fetch;
  const priorStorage = globalThis.sessionStorage;
  const storage = storageHarness();
  installPairedSession(storage);
  globalThis.sessionStorage = storage;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url) === 'http://127.0.0.1:17565/v1/proxy') throw new TypeError('companion transport unavailable');
    if (String(url) === 'http://127.0.0.1:8188/system_stats') return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    throw new Error(`unexpected:${url}`);
  };
  try {
    const { fetchLocalAiWithBridgeFallback } = await loadFresh('direct-recovery');
    const response = await fetchLocalAiWithBridgeFallback('http://127.0.0.1:8188/system_stats');
    assert.equal(response.status, 200);
    assert.deepEqual(calls, ['http://127.0.0.1:17565/v1/proxy', 'http://127.0.0.1:8188/system_stats']);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = priorStorage;
  }
});

test('RT90 Companion HTTP failures are surfaced and are not hidden by direct ComfyUI retry', async () => {
  const priorFetch = globalThis.fetch;
  const priorStorage = globalThis.sessionStorage;
  const storage = storageHarness();
  installPairedSession(storage);
  globalThis.sessionStorage = storage;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url) === 'http://127.0.0.1:17565/v1/proxy') return new Response(JSON.stringify({ error: 'upstream-unreachable' }), { status: 502, headers: { 'content-type': 'application/json' } });
    throw new Error(`direct retry must not happen:${url}`);
  };
  try {
    const { fetchLocalAiWithBridgeFallback } = await loadFresh('http-truth');
    const response = await fetchLocalAiWithBridgeFallback('http://127.0.0.1:8188/system_stats');
    assert.equal(response.status, 502);
    assert.deepEqual(calls, ['http://127.0.0.1:17565/v1/proxy']);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorStorage === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = priorStorage;
  }
});
