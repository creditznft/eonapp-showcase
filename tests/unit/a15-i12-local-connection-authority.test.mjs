import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY,
  buildLocalRuntimeAuthorizationHeaders,
  clearAllLocalConnectionSessions,
  clearLocalRuntimeSessionCredential,
  determineLocalRuntimeLocality,
  getLocalConnectionAuthorityTruth,
  getLocalRuntimeSessionCredentialMetadata,
  requestLocalRuntimeJson,
  saveLocalRuntimeSessionCredential
} from '../../assets/js/local-ai/eon-local-connection-authority.js';
import {
  EON_LOCAL_BRIDGE_SESSION_KEY,
  fetchViaEonLocalBridge
} from '../../assets/js/local-ai/eon-local-bridge-client.js';
import { classifyEonLocalBridgeTarget } from '../../config/eon-local-bridge-contract.mjs';
import {
  LOCAL_RUNTIME_STATUS_KEY,
  markLocalRuntimeAsChatRuntime,
  readLocalRuntimeStatus,
  runLocalRuntimeSelfTest
} from '../../assets/js/local-ai/local-runtime-status.js';
import {
  EON_CREATOR_COMPANION_ENDPOINT,
  getCreatorAiActionCspSources
} from '../../config/eon-creator-companion-browser-contract.mjs';

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

function withGlobals({ localStorage = new MemoryStorage(), sessionStorage = new MemoryStorage(), navigator = { onLine: true } } = {}, fn) {
  const previous = {
    localStorage: globalThis.localStorage,
    sessionStorage: globalThis.sessionStorage,
    navigator: globalThis.navigator,
    fetch: globalThis.fetch
  };
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = sessionStorage;
  Object.defineProperty(globalThis, 'navigator', { value: navigator, configurable: true, writable: true });
  return Promise.resolve().then(() => fn({ localStorage, sessionStorage })).finally(() => {
    if (previous.localStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous.localStorage;
    if (previous.sessionStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = previous.sessionStorage;
    if (previous.navigator === undefined) delete globalThis.navigator; else Object.defineProperty(globalThis, 'navigator', { value: previous.navigator, configurable: true, writable: true });
    if (previous.fetch === undefined) delete globalThis.fetch; else globalThis.fetch = previous.fetch;
  });
}

function pairBridge(store) {
  store.setItem(EON_LOCAL_BRIDGE_SESSION_KEY, JSON.stringify({
    token: 'bridge-session-token',
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  }));
}

test('A15 I12 stores optional runtime credentials only in session storage and never exposes the token', () => {
  const store = new MemoryStorage();
  const saved = saveLocalRuntimeSessionCredential({ runtimeId: 'lmstudio', credential: 'local-secret-token' }, { store, now: () => 1000 });
  assert.equal(saved.ok, true);
  assert.equal(saved.sessionOnly, true);
  assert.equal(saved.containsCredential, false);
  assert.deepEqual(buildLocalRuntimeAuthorizationHeaders('lmstudio', { store }), { authorization: 'Bearer local-secret-token' });
  const metadata = getLocalRuntimeSessionCredentialMetadata('lmstudio', { store });
  assert.equal(metadata.runtimeId, 'lmstudio');
  assert.equal(metadata.containsCredential, false);
  assert.doesNotMatch(JSON.stringify({ saved, metadata }), /local-secret-token/);
  assert.match(store.getItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY), /local-secret-token/);
  assert.equal(clearLocalRuntimeSessionCredential('lmstudio', { store }).ok, true);
  assert.equal(store.getItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY), null);
});

test('A15 I12 performs one authenticated direct LM Studio request and emits a redacted receipt', async () => {
  const store = new MemoryStorage();
  saveLocalRuntimeSessionCredential({ runtimeId: 'lmstudio', credential: 'session-only-password' }, { store });
  let calls = 0;
  const result = await requestLocalRuntimeJson({
    runtimeId: 'lmstudio',
    url: 'http://127.0.0.1:1234/v1/models',
    method: 'GET',
    store,
    fetchImpl: async (_url, options) => {
      calls += 1;
      assert.equal(options.headers.authorization, 'Bearer session-only-password');
      return new Response(JSON.stringify({ data: [{ id: 'local-model' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
    allowBridge: false
  });
  assert.equal(calls, 1);
  assert.equal(result.data.data[0].id, 'local-model');
  assert.equal(result.receipt.transport, 'direct-browser');
  assert.equal(result.receipt.authenticated, true);
  assert.equal(result.receipt.containsCredential, false);
  assert.doesNotMatch(JSON.stringify(result.receipt), /session-only-password/);
});

test('A15 I12 surfaces a paired Companion HTTP authorization failure without direct retry', async () => {
  let directCalls = 0;
  let companionCalls = 0;
  await withGlobals({}, async ({ sessionStorage }) => {
    pairBridge(sessionStorage);
    await assert.rejects(requestLocalRuntimeJson({
      runtimeId: 'jan',
      url: 'http://127.0.0.1:1337/v1/models',
      fetchImpl: async () => { directCalls += 1; return new Response('{}', { status: 200 }); },
      bridgeFetchImpl: async () => { companionCalls += 1; return new Response('{}', { status: 401 }); }
    }), (error) => {
      assert.equal(error.message, 'local-runtime-authorization-required');
      assert.equal(error.localConnectionReceipt.status, 401);
      return true;
    });
  });
  assert.equal(companionCalls, 1);
  assert.equal(directCalls, 0);
});

test('A15 I12 prefers paired Local Companion so runtime CORS settings are not part of normal setup', async () => {
  await withGlobals({}, async ({ sessionStorage }) => {
    pairBridge(sessionStorage);
    let directCalls = 0;
    let companionCalls = 0;
    const result = await requestLocalRuntimeJson({
      runtimeId: 'ollama',
      url: 'http://127.0.0.1:11434/api/tags',
      fetchImpl: async () => { directCalls += 1; throw new TypeError('direct browser should not be first'); },
      bridgeFetchImpl: async (_url, options) => {
        companionCalls += 1;
        assert.equal(options.method, 'GET');
        return new Response(JSON.stringify({ models: [{ name: 'llama3' }] }), { status: 200 });
      }
    });
    assert.equal(companionCalls, 1);
    assert.equal(directCalls, 0);
    assert.equal(result.receipt.transport, 'paired-local-companion');
    assert.equal(result.receipt.endpointClass, '127.0.0.1:11434');
  });
});

test('A15 I12 uses direct loopback only when paired Companion transport is unreachable', async () => {
  await withGlobals({}, async ({ sessionStorage }) => {
    pairBridge(sessionStorage);
    let directCalls = 0;
    let companionCalls = 0;
    const result = await requestLocalRuntimeJson({
      runtimeId: 'lmstudio',
      url: 'http://127.0.0.1:1234/v1/models',
      fetchImpl: async () => { directCalls += 1; return new Response(JSON.stringify({ data: [{ id: 'qwen-local' }] }), { status: 200 }); },
      bridgeFetchImpl: async () => { companionCalls += 1; throw new TypeError('companion unavailable'); }
    });
    assert.equal(companionCalls, 1);
    assert.equal(directCalls, 1);
    assert.equal(result.receipt.transport, 'direct-browser-recovery');
  });
});

test('A15 I12 rejects LAN and arbitrary loopback targets before any fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return new Response('{}'); };
  await assert.rejects(requestLocalRuntimeJson({ runtimeId: 'ollama', url: 'http://192.168.1.10:11434/api/tags', fetchImpl }), /local-runtime-endpoint-not-approved/);
  await assert.rejects(requestLocalRuntimeJson({ runtimeId: 'ollama', url: 'http://127.0.0.1:9999/api/tags', fetchImpl }), /local-runtime-endpoint-not-approved/);
  assert.equal(calls, 0);
});

test('A15 I12 grants offline-proven locality only after a successful request while the browser reports offline', () => {
  assert.equal(determineLocalRuntimeLocality({ model: 'llama3', requestSucceeded: true, offlineProofRequested: true, networkOnline: true }), 'loopback-verified-offline-proof-pending');
  assert.equal(determineLocalRuntimeLocality({ model: 'llama3', requestSucceeded: true, offlineProofRequested: true, networkOnline: false }), 'offline-proven');
  assert.equal(determineLocalRuntimeLocality({ model: 'cloud-model', requestSucceeded: true, offlineProofRequested: true, networkOnline: false }), 'cloud-backed-tag-blocked');
});

test('A15 I12 self-test stores a matching proof before Local AI can become the Chat runtime', async () => {
  await withGlobals({}, async ({ localStorage }) => {
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.method, 'POST');
      return new Response(JSON.stringify({ response: 'EON LIVE OK' }), { status: 200 });
    };
    const before = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'llama3' });
    assert.equal(before.error, 'matching-self-test-required');
    const tested = await runLocalRuntimeSelfTest({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'llama3', networkOnline: true });
    assert.equal(tested.ok, true);
    const status = readLocalRuntimeStatus();
    assert.equal(status.runtimeId, 'ollama');
    assert.equal(status.transport, 'direct-browser');
    assert.equal(status.localityState, 'loopback-verified-offline-proof-pending');
    assert.doesNotMatch(localStorage.getItem(LOCAL_RUNTIME_STATUS_KEY), /Bearer|password|token/i);
    const after = markLocalRuntimeAsChatRuntime({ runtimeName: 'Ollama', endpoint: 'http://127.0.0.1:11434', model: 'llama3' });
    assert.equal(after.ok, true);
  });
});

test('A15 I12 Bridge forwards runtime authorization only to approved authenticated runtimes', async () => {
  await withGlobals({}, async ({ sessionStorage }) => {
    pairBridge(sessionStorage);
    const bodies = [];
    globalThis.fetch = async (_url, options) => {
      bodies.push(JSON.parse(options.body));
      return new Response('{}', { status: 200 });
    };
    await fetchViaEonLocalBridge('http://127.0.0.1:1234/v1/models', { headers: { authorization: 'Bearer runtime-token', accept: 'application/json' } });
    await fetchViaEonLocalBridge('http://127.0.0.1:8001/v1/models', { headers: { authorization: 'Bearer acestep-token', accept: 'application/json' } });
    await fetchViaEonLocalBridge('http://127.0.0.1:8188/system_stats', { headers: { authorization: 'Bearer forbidden-media-token', accept: 'application/json' } });
    assert.equal(bodies[0].headers.authorization, 'Bearer runtime-token');
    assert.equal(bodies[1].headers.authorization, 'Bearer acestep-token');
    assert.equal('authorization' in bodies[2].headers, false);
  });
});

test('A15 I12 Bridge admits only the reviewed ACE-Step local API surface and generated audio paths', () => {
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:1234/api/v1/models', 'GET')?.runtimeId, 'lmstudio');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/health', 'GET')?.runtimeId, 'acestep');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/models', 'GET')?.runtimeId, 'acestep');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/release_task', 'POST')?.runtimeId, 'acestep');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/query_result', 'POST')?.runtimeId, 'acestep');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/audio?path=%2Ftmp%2Fapi_audio%2Ftrack.wav', 'GET')?.runtimeId, 'acestep');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/init', 'POST'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/train', 'POST'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/audio?path=%2Fetc%2Fpasswd', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/audio?path=%2Ftmp%2Ftrack.wav', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/audio?path=%2Ftmp%2Fapi_audio%2F..%2Fsecret.wav', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8001/v1/audio?path=%2Ftmp%2Fapi_audio%2Fnested%2Ftrack.wav', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://192.168.1.8:8001/v1/models', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8188/view?filename=output.png&type=output', 'GET')?.runtimeId, 'comfyui');
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8188/view?filename=..%2Fsecret.png&type=output', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8188/view?filename=folder%2Fsecret.png&type=output', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8188/view?filename=output.png&subfolder=..%2Fsecret&type=output', 'GET'), null);
  assert.equal(classifyEonLocalBridgeTarget('http://127.0.0.1:8188/view?filename=output.png&type=arbitrary', 'GET'), null);
});

test('A15 I12 route CSP keeps shared Creator/City AI actions least-privilege', () => {
  const headers = readFileSync(new URL('../../_headers', import.meta.url), 'utf8');
  const publicHeaders = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  assert.equal((headers.match(/# W476_LOCAL_AI_CSP_START/g) || []).length, 1);
  assert.equal((headers.match(/# A15_I12_CREATOR_COMPANION_CSP_START/g) || []).length, 1);
  assert.equal((publicHeaders.match(/# W476_LOCAL_AI_CSP_START/g) || []).length, 1);
  assert.equal((publicHeaders.match(/# A15_I12_CREATOR_COMPANION_CSP_START/g) || []).length, 1);
  assert.equal(headers, publicHeaders);
  assert.match(headers, /# W476_LOCAL_AI_CSP_START[\s\S]*http:\/\/127\.0\.0\.1:17565[\s\S]*# W476_LOCAL_AI_CSP_END/);
  const creatorBlock = headers.match(/# A15_I12_CREATOR_COMPANION_CSP_START([\s\S]*?)# A15_I12_CREATOR_COMPANION_CSP_END/)?.[1] || '';
  assert.match(creatorBlock, /\n\/create\n/);
  assert.match(creatorBlock, /http:\/\/127\.0\.0\.1:47826/);
  assert.match(creatorBlock, /\n\/eoncity\n/);
  assert.match(creatorBlock, /11434|1234|1337|6767|17565|8001|8188/);
  assert.match(creatorBlock, /http:\/\/127\.0\.0\.1:8001/);
  const actionSources = getCreatorAiActionCspSources();
  assert.ok(actionSources.includes(EON_CREATOR_COMPANION_ENDPOINT));
  assert.ok(actionSources.includes('http://127.0.0.1:11434'));
  assert.doesNotMatch(creatorBlock, /192\.168\.|10\.0\.|172\.(?:1[6-9]|2\d|3[01])\./);
});

test('A15 I12 active Chat and status surfaces use the one Local Connection Authority', () => {
  const runtime = readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
  const status = readFileSync(new URL('../../assets/js/local-ai/local-runtime-status.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../../assets/js/local-ai/local-ai-page.js', import.meta.url), 'utf8');
  assert.match(runtime, /requestLocalRuntimeJson/);
  const batchOnlyBlock = runtime.match(/const BATCH_ONLY_PROVIDERS = new Set\(\[([^\]]+)\]\)/)?.[1] || '';
  for (const providerId of ['guide', 'browserlocal', 'ollama', 'lmstudio', 'jan']) {
    assert.match(batchOnlyBlock, new RegExp(`['\"]${providerId}['\"]`));
  }
  assert.doesNotMatch(batchOnlyBlock, /['"]groq['"]/);
  assert.match(runtime, /localConnectionReceipt: execution\.localConnectionReceipt/);
  assert.doesNotMatch(status, /\bfetch\s*\(/);
  assert.match(status, /matching-self-test-required/);
  assert.match(page, /session-only/i);
  assert.match(page, /Prove while offline/);
  assert.match(page, /Disconnect & clear/);
  const truth = getLocalConnectionAuthorityTruth();
  assert.equal(truth.cloudFallback, false);
  assert.equal(truth.credentialStorage, 'sessionStorage-only');
  assert.equal(truth.offlineLocalityClaimRequiresSuccessfulOfflineSelfTest, true);
});

test('A15 I12 disconnect clears runtime and Bridge session material together', async () => {
  await withGlobals({}, async ({ sessionStorage }) => {
    saveLocalRuntimeSessionCredential({ runtimeId: 'jan', credential: 'secret' }, { store: sessionStorage });
    pairBridge(sessionStorage);
    const result = clearAllLocalConnectionSessions({ store: sessionStorage });
    assert.equal(result.ok, true);
    assert.equal(sessionStorage.getItem(EON_LOCAL_RUNTIME_CREDENTIAL_SESSION_KEY), null);
    assert.equal(sessionStorage.getItem(EON_LOCAL_BRIDGE_SESSION_KEY), null);
  });
});
