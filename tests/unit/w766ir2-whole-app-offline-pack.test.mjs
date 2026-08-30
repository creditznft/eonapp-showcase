import assert from 'node:assert/strict';
import crypto, { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createEonOfflinePackManifest } from '../../scripts/eon-offline-pack-manifest.mjs';
import { createSession } from '../../functions/_shared/eon-auth.js';
import { onRequestPost as issueOfflineCapability } from '../../functions/api/offline/capability.js';
import { inspectEonOfflineStorage, isApprovedEonLocalAiLoopback } from '../../assets/js/eon-offline-manager.js';
import { resolveInstalledOfflineCityAccess } from '../../assets/js/city/eon-city-access-station.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function canonicalManifest({ releaseId = 'test-release', sourceRevision = 'test-source', entries = [] } = {}) {
  const normalized = entries.map((entry) => ({
    url: entry.url,
    sourcePath: entry.sourcePath || entry.url.replace(/^\//, ''),
    pack: entry.pack,
    navigation: entry.navigation === true,
    bytes: Buffer.byteLength(entry.body),
    sha256: sha256(Buffer.from(entry.body)),
    contentType: entry.contentType || (entry.navigation ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8'),
    body: entry.body
  }));
  const publicEntries = normalized.map(({ body, ...entry }) => entry);
  const packs = {
    core: { entries: normalized.filter((entry) => entry.pack === 'core').length, bytes: normalized.filter((entry) => entry.pack === 'core').reduce((sum, entry) => sum + entry.bytes, 0) },
    city: { entries: normalized.filter((entry) => entry.pack === 'city').length, bytes: normalized.filter((entry) => entry.pack === 'city').reduce((sum, entry) => sum + entry.bytes, 0) }
  };
  const unsigned = {
    schema: 'eonapp.offline-pack-manifest.w766ir2.v1',
    releaseId,
    sourceRevision,
    generatedAt: new Date().toISOString(),
    packs,
    entries: normalized
  };
  const digest = sha256(Buffer.from(JSON.stringify({ schema: unsigned.schema, releaseId, sourceRevision, packs, entries: publicEntries })));
  return { ...unsigned, entries: normalized, digest };
}

function requestKey(request) {
  const value = request instanceof Request ? request : new Request(request);
  return `${value.method}:${value.url}`;
}

function createCacheStorage() {
  const stores = new Map();
  const ensure = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const cache = (name) => ({
    async match(request) {
      const found = ensure(name).get(requestKey(request));
      return found?.clone?.() || found || undefined;
    },
    async put(request, response) { ensure(name).set(requestKey(request), response.clone()); },
    async delete(request) { return ensure(name).delete(requestKey(request)); },
    async keys() { return [...ensure(name).keys()].map((key) => new Request(key.slice(key.indexOf(':') + 1))); },
    async add(request) { ensure(name).set(requestKey(request), new Response('precache', { status: 200 })); },
    async addAll(requests) { for (const request of requests) ensure(name).set(requestKey(request), new Response('precache', { status: 200 })); }
  });
  return {
    stores,
    async open(name) { ensure(name); return cache(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async has(name) { return stores.has(name); }
  };
}

function createWorkerHarness({ manifest, online = true } = {}) {
  const listeners = new Map();
  const messages = [];
  const cacheStorage = createCacheStorage();
  let activeManifest = manifest;
  let bodies = new Map(activeManifest.entries.map((entry) => [entry.url, entry.body]));
  let networkOnline = online;
  let corruptUrl = '';
  let assetFetches = 0;
  let capabilityFetches = 0;

  const fetchImpl = async (input, init = {}) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), 'https://eonapp.ch').toString(), init);
    const url = new URL(request.url);
    if (!networkOnline) throw new Error('offline');
    if (url.pathname === '/offline/eonapp-offline-pack-manifest.json') {
      return new Response(JSON.stringify({ ...activeManifest, entries: activeManifest.entries.map(({ body, ...entry }) => entry) }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.pathname === '/api/offline/capability') {
      capabilityFetches += 1;
      const payload = JSON.parse(await request.text());
      return new Response(JSON.stringify({
        ok: true,
        receipt: {
          schema: 'eonapp.offline-capability.w766ir2.v1',
          installationId: payload.installationId,
          entitlementClass: 'identity-session-local-offline',
          packs: payload.packs,
          manifestDigest: payload.manifestDigest,
          issuedAt: Date.now(),
          expiresAt: Date.now() + 86_400_000,
          automaticCloudSync: false,
          privateContentIncluded: false,
          signature: `hmac-sha256.${'a'.repeat(43)}`
        }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const body = bodies.get(url.pathname);
    if (body === undefined) throw new Error(`unexpected fetch ${url.pathname}`);
    assetFetches += 1;
    const actual = url.pathname === corruptUrl ? `${body}-corrupt` : body;
    return new Response(actual, { status: 200, headers: { 'content-type': activeManifest.entries.find((entry) => entry.url === url.pathname)?.contentType || 'application/octet-stream' } });
  };

  const self = {
    location: { origin: 'https://eonapp.ch' },
    clients: {
      async claim() {},
      async matchAll() { return [{ postMessage(message) { messages.push(message); } }]; },
      async openWindow() { return null; }
    },
    registration: { async showNotification() {} },
    addEventListener(type, listener) { listeners.set(type, listener); },
    async skipWaiting() {}
  };
  const context = vm.createContext({
    self,
    caches: cacheStorage,
    fetch: fetchImpl,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Request,
    Response,
    Headers,
    URL,
    AbortController,
    Uint8Array,
    Object,
    Array,
    JSON,
    Promise,
    Set,
    Map,
    Math,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Date,
    console,
    setTimeout,
    clearTimeout
  });
  vm.runInContext(read('sw.js'), context, { filename: 'sw.js' });
  return {
    context,
    listeners,
    messages,
    caches: cacheStorage,
    setOnline(value) { networkOnline = value; },
    setManifest(value) {
      activeManifest = value;
      bodies = new Map(activeManifest.entries.map((entry) => [entry.url, entry.body]));
    },
    corrupt(value = '') { corruptUrl = value; },
    get assetFetches() { return assetFetches; },
    get capabilityFetches() { return capabilityFetches; },
    fn(name) { return vm.runInContext(name, context); }
  };
}

function memoryIdentityDb() {
  const sessions = new Map();
  return {
    prepare(sql = '') {
      const statement = String(sql);
      return {
        bind(...args) {
          return {
            async run() {
              if (statement.includes('INSERT INTO eon_identity_sessions')) sessions.set(String(args[0]), { session_id_hmac: String(args[0]), account_id: String(args[1]), expires_at: Number(args[3]) });
              if (statement.includes('DELETE FROM eon_identity_sessions WHERE session_id_hmac')) sessions.delete(String(args[0]));
              return { success: true };
            },
            async first() {
              if (statement.includes('FROM eon_schema_authority')) return { domain: 'identity', schema_version: 6, migration_name: '0006_notification_policy_authority.sql', applied_at: 1 };
              if (statement.includes('SELECT session_id_hmac')) return sessions.get(String(args[0])) || null;
              return null;
            }
          };
        }
      };
    }
  };
}

function identityEnv(database, manifest) {
  return {
    APP_ORIGIN: 'https://eonapp.ch',
    EON_AUTH_ROLLOUT: 'testing',
    GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
    GOOGLE_OAUTH_CLIENT_ID: 'test-client.apps.googleusercontent.com',
    GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
    EON_AUTH_SUBJECT_PEPPER: 'test-subject-pepper',
    EON_SESSION_SIGNING_KEY: 'test-session-key',
    EON_OAUTH_FLOW_SIGNING_KEY: 'test-flow-key',
    EON_IDENTITY_DB: database,
    ASSETS: {
      async fetch() { return new Response(JSON.stringify(manifest), { status: 200, headers: { 'content-type': 'application/json' } }); }
    }
  };
}

test('W766IR2-E build manifest covers canonical EONAPP routes and separates City bytes with SHA-256 integrity', () => {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'eon-offline-manifest-'));
  try {
    const files = {
      'index.html': '<!doctype html><title>EONAPP</title>',
      'workspace/index.html': '<!doctype html><title>Workspace</title>',
      'eoncity/index.html': '<!doctype html><title>City</title>',
      'assets/js/app.js': 'export const app = true;',
      'assets/js/city/runtime.js': 'export const city = true;',
      'assets/city/w649/primary/world/gate.aaaaaaaaaaaa.glb': 'city-binary',
      'offline.html': '<!doctype html><title>Offline</title>',
      'manifest.webmanifest': '{"name":"EONAPP"}'
    };
    for (const [relative, body] of Object.entries(files)) {
      const absolute = path.join(dist, relative);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, body);
    }
    const manifest = createEonOfflinePackManifest({ distDir: dist, releaseId: 'r1', sourceRevision: 's1' });
    assert.match(manifest.digest, /^[a-f0-9]{64}$/);
    assert.equal(manifest.generatedAt, 'source-controlled-deterministic');
    assert.ok(manifest.entries.some((entry) => entry.url === '/workspace' && entry.pack === 'core' && entry.navigation));
    assert.ok(manifest.entries.some((entry) => entry.url === '/eoncity' && entry.pack === 'city' && entry.navigation));
    const cityRuntime = manifest.entries.find((entry) => entry.url === '/assets/js/city/runtime.js');
    assert.equal(cityRuntime.pack, 'city');
    const city = manifest.entries.find((entry) => entry.url.includes('/assets/city/'));
    assert.equal(city.pack, 'city');
    assert.equal(city.sha256, sha256(Buffer.from('city-binary')));
    assert.ok(manifest.packs.core.entries > 0);
    assert.ok(manifest.packs.city.entries > 0);
  } finally {
    fs.rmSync(dist, { recursive: true, force: true });
  }
});

test('W766IR2-E authenticated capability is bound to the deployed manifest and returns no private account data', async () => {
  const manifest = canonicalManifest({ entries: [{ url: '/eoncity', pack: 'city', navigation: true, body: '<city>' }] });
  const publicManifest = { ...manifest, entries: manifest.entries.map(({ body, ...entry }) => entry) };
  const database = memoryIdentityDb();
  const env = identityEnv(database, publicManifest);
  const session = await createSession({ database, sessionKey: env.EON_SESSION_SIGNING_KEY }, 'account_private_test');
  const request = new Request('https://eonapp.ch/api/offline/capability', {
    method: 'POST',
    headers: {
      origin: 'https://eonapp.ch',
      'sec-fetch-site': 'same-origin',
      cookie: `__Host-eon_session=${session.sessionId}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ installationId: 'offline-1234567890abcdef', manifestDigest: manifest.digest, packs: ['core', 'city'] })
  });
  const response = await issueOfflineCapability({ request, env });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.receipt.manifestDigest, manifest.digest);
  assert.deepEqual(payload.receipt.packs, ['city', 'core'].sort());
  assert.match(payload.receipt.signature, /^hmac-sha256\./);
  const serialized = JSON.stringify(payload);
  assert.doesNotMatch(serialized, /account_private_test|email|cookie|provider|prompt|project|file/i);

  const mismatchRequest = new Request('https://eonapp.ch/api/offline/capability', {
    method: 'POST',
    headers: { origin: 'https://eonapp.ch', cookie: `__Host-eon_session=${session.sessionId}`, 'content-type': 'application/json' },
    body: JSON.stringify({ installationId: 'offline-1234567890abcdef', manifestDigest: 'f'.repeat(64), packs: ['core', 'city'] })
  });
  const mismatch = await issueOfflineCapability({ request: mismatchRequest, env });
  assert.equal(mismatch.status, 409);
});

test('W766IR2-E atomically installs whole EONAPP + City, reloads both offline, keeps APIs truthful, and bypasses Local AI loopback', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace>' },
      { url: '/assets/js/app.js', pack: 'core', body: 'export const app=true;' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell>' },
      { url: '/assets/js/city/runtime.js', pack: 'city', body: 'export const city=true;' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  const navigationNetworkOnly = harness.fn('navigationNetworkOnly');
  const navigationNetworkFirst = harness.fn('navigationNetworkFirst');
  const apiNetworkOnly = harness.fn('apiNetworkOnly');
  const matchActiveOfflinePack = harness.fn('matchActiveOfflinePack');
  const isLoopbackUrl = harness.fn('isLoopbackUrl');

  const installed = await install({ packs: ['core', 'city'], explicitUserAction: true });
  assert.equal(installed.ok, true);
  assert.equal(harness.capabilityFetches, 1);
  const ready = await status();
  assert.equal(ready.coreReady, true);
  assert.equal(ready.cityReady, true);
  assert.equal(ready.localAiPathReady, true);
  assert.equal(ready.packCacheInventoryVerified, true);
  assert.equal(ready.cachedEntries, 5);
  assert.equal(ready.downloadedEntries, 5);

  const fetchedDuringInstall = harness.assetFetches;
  const delta = await install({ packs: ['core', 'city'], explicitUserAction: true });
  assert.equal(delta.status.reusedEntries, 5);
  assert.equal(delta.status.downloadedEntries, 0);
  assert.equal(harness.assetFetches, fetchedDuringInstall, 'same-manifest repair must reuse every verified local entry');
  harness.setOnline(false);
  const workspace = await navigationNetworkFirst({ request: new Request('https://eonapp.ch/workspace'), waitUntil() {} });
  assert.equal(await workspace.text(), '<workspace>');
  const city = await navigationNetworkOnly({ request: new Request('https://eonapp.ch/eoncity'), waitUntil() {} });
  assert.equal(await city.text(), '<city-shell>');
  assert.equal(harness.assetFetches, fetchedDuringInstall, 'hard offline reloads must not re-download installed shell files');
  assert.equal(await matchActiveOfflinePack(new Request('https://eonapp.ch/workspace?token=private'), { navigation: true, requirePack: 'core' }), undefined, 'sensitive query navigations must never reuse a cached shell');

  const api = await apiNetworkOnly({ request: new Request('https://eonapp.ch/api/projects', { method: 'POST', body: '{}' }) });
  assert.equal(api.status, 503);
  assert.deepEqual(await api.json(), { ok: false, offline: true, error: 'network_unavailable', cloudActionQueued: false, localWorkChanged: false });
  assert.equal(isLoopbackUrl(new URL('http://127.0.0.1:11434/api/chat')), true);
  assert.equal(isLoopbackUrl(new URL('http://localhost:1234/v1/chat/completions')), true);
  assert.equal(isLoopbackUrl(new URL('https://example.com/v1/chat')), false);
});

test('W766IR2-E serves installed JSON, media and compressed City textures offline instead of bypassing the pack', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/assets/config/local-workspace.json', pack: 'core', body: '{"local":true}', contentType: 'application/json; charset=utf-8' },
      { url: '/assets/audio/command.ogg', pack: 'core', body: 'offline-audio', contentType: 'audio/ogg' },
      { url: '/assets/city/w766/textures/gate.aaaaaaaaaaaa.ktx2', pack: 'city', body: 'offline-texture', contentType: 'image/ktx2' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const staticCacheFirst = harness.fn('staticCacheFirst');
  const isStaticAsset = harness.fn('isStaticAsset');
  await install({ packs: ['core', 'city'], explicitUserAction: true });
  const installedFetches = harness.assetFetches;
  harness.setOnline(false);

  for (const [pathname, expected] of [
    ['/assets/config/local-workspace.json', '{"local":true}'],
    ['/assets/audio/command.ogg', 'offline-audio']
  ]) {
    const response = await staticCacheFirst({ request: new Request(`https://eonapp.ch${pathname}`), waitUntil() {} });
    assert.equal(await response.text(), expected);
  }
  assert.equal(isStaticAsset('/assets/config/local-workspace.json'), true);
  assert.equal(isStaticAsset('/assets/audio/command.ogg'), true);
  assert.equal(isStaticAsset('/assets/city/w766/textures/gate.aaaaaaaaaaaa.ktx2'), true);
  assert.equal(harness.assetFetches, installedFetches);
});

test('W766IR2-E requests best-effort persistent browser storage only during explicit installation', async () => {
  let persistCalls = 0;
  const navigatorRef = {
    storage: {
      async persist() { persistCalls += 1; return true; },
      async persisted() { return true; },
      async estimate() { return { usage: 25, quota: 100 }; }
    }
  };
  const inspected = await inspectEonOfflineStorage({ navigatorRef, requestPersistence: false });
  assert.equal(persistCalls, 0);
  assert.equal(inspected.storagePersisted, true);
  assert.equal(inspected.storageUsageRatio, 0.25);
  const requested = await inspectEonOfflineStorage({ navigatorRef, requestPersistence: true });
  assert.equal(persistCalls, 1);
  assert.equal(requested.storagePersistenceRequested, true);
  assert.equal(requested.storagePersistenceGranted, true);
});

test('W766IR2-E release updates reuse unchanged offline bytes and download only changed entries', async () => {
  const firstManifest = canonicalManifest({
    releaseId: 'test-release-1',
    sourceRevision: 'test-source-1',
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell-v1>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace-stable>' },
      { url: '/assets/js/app.js', pack: 'core', body: 'export const app=true;' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell-stable>' },
      { url: '/assets/js/city/runtime.js', pack: 'city', body: 'export const city=true;' }
    ]
  });
  const harness = createWorkerHarness({ manifest: firstManifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  const navigationNetworkFirst = harness.fn('navigationNetworkFirst');

  const first = await install({ packs: ['core', 'city'], explicitUserAction: true });
  assert.equal(first.status.downloadedEntries, 5);
  assert.equal(first.status.reusedEntries, 0);
  const firstFetches = harness.assetFetches;

  const secondManifest = canonicalManifest({
    releaseId: 'test-release-2',
    sourceRevision: 'test-source-2',
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell-v2>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace-stable>' },
      { url: '/assets/js/app.js', pack: 'core', body: 'export const app=true;' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell-stable>' },
      { url: '/assets/js/city/runtime.js', pack: 'city', body: 'export const city=true;' }
    ]
  });
  harness.setManifest(secondManifest);
  const second = await install({ packs: ['core', 'city'], explicitUserAction: true });
  assert.equal(second.status.reusedEntries, 4);
  assert.equal(second.status.downloadedEntries, 1);
  assert.equal(harness.assetFetches - firstFetches, 1, 'only the changed app shell may be fetched from hosting');

  harness.setOnline(false);
  const app = await navigationNetworkFirst({ request: new Request('https://eonapp.ch/'), waitUntil() {} });
  assert.equal(await app.text(), '<app-shell-v2>');
  assert.equal(harness.assetFetches - firstFetches, 1, 'offline use after the update must not contact hosting');
  const ready = await status();
  assert.equal(ready.releaseId, 'test-release-2');
  assert.equal(ready.reusedEntries, 4);
  assert.equal(ready.downloadedEntries, 1);
});

test('W766IR2-E City authorization expiry keeps core EONAPP and Local AI ready while denying offline City', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell>' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  const readState = harness.fn('readActiveOfflinePackState');
  const writeState = harness.fn('writeActiveOfflinePackState');
  const matchActive = harness.fn('matchActiveOfflinePack');

  await install({ packs: ['core', 'city'], explicitUserAction: true });
  const installed = await readState({ fresh: true });
  await writeState({
    ...installed,
    receipt: { ...installed.receipt, expiresAt: Date.now() - 1_000 }
  });

  const expired = await status();
  assert.equal(expired.installed, true);
  assert.equal(expired.coreReady, true);
  assert.equal(expired.localAiPathReady, true);
  assert.equal(expired.cityReady, false);
  assert.equal(expired.cityAuthorizationExpired, true);
  assert.equal(expired.repairRequired, false, 'authorization renewal is distinct from damaged local bytes');

  const core = await matchActive(new Request('https://eonapp.ch/workspace'), { navigation: true, requirePack: 'core' });
  assert.equal(await core.text(), '<workspace>');
  const city = await matchActive(new Request('https://eonapp.ch/eoncity'), { navigation: true, requirePack: 'city' });
  assert.equal(city, undefined);
});

test('W766IR2-E detects missing offline bytes and marks the installed pack for repair', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell>' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  const readState = harness.fn('readActiveOfflinePackState');

  await install({ packs: ['core', 'city'], explicitUserAction: true });
  const installed = await readState({ fresh: true });
  const cache = await harness.caches.open(installed.cacheName);
  assert.equal(await cache.delete(new Request('https://eonapp.ch/workspace')), true);

  const damaged = await status();
  assert.equal(damaged.installed, true);
  assert.equal(damaged.coreReady, false);
  assert.equal(damaged.cityReady, false);
  assert.equal(damaged.localAiPathReady, false);
  assert.equal(damaged.repairRequired, true);
  assert.equal(damaged.missingEntries, 1);
  assert.equal(damaged.packCacheEntries, 2);
  assert.equal(damaged.expectedEntries, 3);
});

test('W766IR2-F detects wrong cached URLs even when the total entry count is unchanged', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/workspace', pack: 'core', navigation: true, body: '<workspace>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell>' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  const readState = harness.fn('readActiveOfflinePackState');

  await install({ packs: ['core', 'city'], explicitUserAction: true });
  const installed = await readState({ fresh: true });
  const cache = await harness.caches.open(installed.cacheName);
  assert.equal(await cache.delete(new Request('https://eonapp.ch/workspace')), true);
  await cache.put(new Request('https://eonapp.ch/not-in-the-installed-pack'), new Response('wrong-entry', { status: 200 }));

  const damaged = await status();
  assert.equal(damaged.packCacheEntries, 3, 'the count remains unchanged');
  assert.equal(damaged.packCacheInventoryVerified, true);
  assert.equal(damaged.missingPackEntries, 1);
  assert.equal(damaged.unexpectedPackEntries, 1);
  assert.equal(damaged.coreReady, false);
  assert.equal(damaged.repairRequired, true);
});

test('W766IR2-E failed integrity repair preserves the previously active offline pack', async () => {
  const manifest = canonicalManifest({
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell>' }
    ]
  });
  const harness = createWorkerHarness({ manifest });
  const install = harness.fn('installOfflinePack');
  const status = harness.fn('inspectOfflinePackStatus');
  await install({ packs: ['core', 'city'], explicitUserAction: true });
  const before = await status();
  const cacheNamesBefore = await harness.caches.keys();

  harness.setManifest(canonicalManifest({
    releaseId: 'test-release-2',
    sourceRevision: 'test-source-2',
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell-v2>' }
    ]
  }));
  const changedManifest = canonicalManifest({
    releaseId: 'test-release-2',
    sourceRevision: 'test-source-2',
    entries: [
      { url: '/', pack: 'core', navigation: true, body: '<app-shell>' },
      { url: '/eoncity', pack: 'city', navigation: true, body: '<city-shell-v2>' }
    ]
  });
  harness.setManifest(changedManifest);
  harness.corrupt('/eoncity');
  let repairError = null;
  try { await install({ packs: ['core', 'city'], explicitUserAction: true }); } catch (error) { repairError = error; }
  assert.match(String(repairError?.message || repairError || ''), /offline-entry-size-mismatch|offline-entry-integrity-mismatch/);
  const after = await status();
  assert.equal(after.installationId, before.installationId);
  assert.equal(after.manifestDigest, before.manifestDigest);
  assert.equal(after.cityReady, true);
  assert.ok((await harness.caches.keys()).includes(cacheNamesBefore.find((name) => name.startsWith('eonapp-offline-pack-'))));
});

test('W766IR2-E offline City access requires a valid installed City pack and never invents cloud synchronization', async () => {
  const access = await resolveInstalledOfflineCityAccess(async () => ({ cityReady: true, packs: ['core', 'city'], expiresAt: Date.now() + 60_000 }));
  assert.equal(access.accessState, 'authorized');
  assert.equal(access.offlineAuthorized, true);
  assert.equal(access.canBootFullCity, true);
  assert.equal(access.heavyRuntimeImportAllowed, true);
  assert.match(access.dataCustody, /no work is synchronized automatically/i);
  assert.equal(await resolveInstalledOfflineCityAccess(async () => ({ cityReady: false, packs: ['core'] })), null);
});

test('W766IR2-E exposes truthful whole-app offline status and accepts only device-local AI endpoints', () => {
  const shell = read('assets/js/eon-app-shell.js');
  const installPage = read('assets/js/install-page.js');
  const worker = read('sw.js');
  assert.match(shell, /Offline · EONAPP \+ City ready/);
  assert.match(shell, /Local Lite can continue when its cached browser model is ready/);
  assert.match(shell, /desktop Local AI continues when its verified runtime is running/);
  assert.match(shell, /hosted-only actions stay disabled/);
  assert.match(installPage, /Local AI continues when its device runtime is running/);
  assert.match(installPage, /await runOfflineInstall\(state\.packs\?\.includes\('city'\)/);
  assert.match(installPage, /browser granted persistent storage/i);
  assert.match(worker, /cloudActionQueued: false, localWorkChanged: false/);
  assert.match(worker, /if \(isLoopbackUrl\(url\)\) return/);
  const offlineManager = read('assets/js/eon-offline-manager.js');
  assert.match(offlineManager, /const listeners = new Set\(\)/);
  assert.match(offlineManager, /requestPersistence: true/);
  assert.doesNotMatch(shell, /indicator\.setAttribute\('role', 'status'\)/);
  const aiRuntime = read('assets/js/chat/ai-runtime.js');
  assert.doesNotMatch(aiRuntime, /navigator\.onLine/);
  assert.match(aiRuntime, /function isLocalProvider\(provider = \{\}\) \{/);
  assert.match(aiRuntime, /return isLocalAIProvider\(provider\)/);
  const cityAccess = read('assets/js/city/eon-city-access-station.js');
  assert.match(cityAccess, /error\.offlineFallbackAllowed = error\.status >= 500/);
  assert.match(cityAccess, /error\?\.offlineFallbackAllowed === false/);
  assert.equal(isApprovedEonLocalAiLoopback('http://127.0.0.1:11434/api/chat'), true);
  assert.equal(isApprovedEonLocalAiLoopback('http://localhost:1234/v1/chat/completions'), true);
  assert.equal(isApprovedEonLocalAiLoopback('https://eonapp.ch/api/chat'), false);
  assert.equal(isApprovedEonLocalAiLoopback('file:///tmp/model'), false);
});


test('W766IR2-E serializes offline-pack mutations and requests persistent browser storage only from an explicit install flow', async () => {
  const manifest = canonicalManifest({ entries: [{ url: '/', pack: 'core', navigation: true, body: '<app-shell>' }] });
  const harness = createWorkerHarness({ manifest });
  const runExclusive = harness.fn('runExclusiveOfflinePackMutation');
  let release = null;
  const first = runExclusive(() => new Promise((resolve) => { release = resolve; }));
  await Promise.resolve();
  await assert.rejects(runExclusive(async () => true), /offline-pack-operation-busy/);
  release('complete');
  assert.equal(await first, 'complete');
  assert.equal(await runExclusive(async () => 'next'), 'next');

  let persistCalls = 0;
  const storage = await inspectEonOfflineStorage({
    requestPersistence: true,
    navigatorRef: {
      storage: {
        async persisted() { return false; },
        async persist() { persistCalls += 1; return true; },
        async estimate() { return { usage: 10, quota: 100 }; }
      }
    }
  });
  assert.equal(persistCalls, 1);
  assert.equal(storage.storagePersistenceRequested, true);
  assert.equal(storage.storagePersistenceGranted, true);
  assert.equal(storage.storagePersisted, true);
  assert.equal(storage.storageUsageRatio, 0.1);
});
