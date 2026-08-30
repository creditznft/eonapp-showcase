import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const ROOT = new URL('../../', import.meta.url);
const read = (relative) => fs.readFileSync(new URL(relative, ROOT), 'utf8');

function requestKey(request) {
  const value = request instanceof Request ? request : new Request(request);
  return `${value.method}:${value.url}`;
}

function createCacheStorage(seed = {}) {
  const stores = new Map();
  const ensure = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const createCache = (name) => ({
    async match(request) {
      const stored = ensure(name).get(requestKey(request));
      return stored?.clone?.() || stored || undefined;
    },
    async put(request, response) {
      ensure(name).set(requestKey(request), response.clone());
    },
    async delete(request) {
      return ensure(name).delete(requestKey(request));
    },
    async keys() {
      return [...ensure(name).keys()].map((key) => new Request(key.slice(key.indexOf(':') + 1)));
    },
    async add(request) {
      ensure(name).set(requestKey(request), new Response('precache', { status: 200 }));
    },
    async addAll(requests) {
      for (const request of requests) ensure(name).set(requestKey(request), new Response('precache', { status: 200 }));
    }
  });
  for (const [name, entries] of Object.entries(seed)) {
    const store = ensure(name);
    for (const [url, body] of Object.entries(entries)) {
      store.set(requestKey(new Request(url)), new Response(body, {
        status: 200,
        headers: { 'cache-control': 'public, max-age=31556952, immutable' }
      }));
    }
  }
  return {
    async open(name) { ensure(name); return createCache(name); },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async has(name) { return stores.has(name); },
    stores
  };
}

function createWorkerHarness({ seed = {}, fetchImpl } = {}) {
  const listeners = new Map();
  const messages = [];
  const cacheStorage = createCacheStorage(seed);
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
    Request,
    Response,
    Headers,
    URL,
    AbortController,
    Object,
    Promise,
    Set,
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
  return { listeners, messages, caches: cacheStorage };
}

async function dispatchFetch(harness, url) {
  const waits = [];
  let responsePromise = null;
  harness.listeners.get('fetch')({
    request: new Request(url),
    respondWith(value) { responsePromise = Promise.resolve(value); },
    waitUntil(value) { waits.push(Promise.resolve(value)); }
  });
  assert.ok(responsePromise, `service worker did not handle ${url}`);
  const response = await responsePromise;
  await Promise.all(waits);
  return response;
}

async function dispatchActivate(harness) {
  const waits = [];
  harness.listeners.get('activate')({ waitUntil(value) { waits.push(Promise.resolve(value)); } });
  await Promise.all(waits);
}

test('W766IR2-D keeps one stable content-addressed City cache in both workers', () => {
  const sw = read('sw.js');
  assert.equal(sw, read('public/sw.js'));
  assert.match(sw, /const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.doesNotMatch(sw, /PERSISTENT_CITY_ASSET_CACHE = `eonapp-city-assets-\$\{RELEASE_ID\}`/);
  assert.match(sw, /isPersistentContentHashedCityAsset/);
  assert.match(sw, /migrateLegacyCityAssetCaches/);
});

test('R09 same-release City runtime shell is fetched once and then restored from the release cache', async () => {
  let fetches = 0;
  const harness = createWorkerHarness({
    fetchImpl: async (request) => {
      fetches += 1;
      return new Response(`runtime-${new URL(request.url).pathname}`, {
        status: 200,
        headers: { 'cache-control': 'public, max-age=0, must-revalidate' }
      });
    }
  });
  const core = 'https://eonapp.ch/assets/js/city/eon-city-play-core-DBtGtHBf.js';
  const css = 'https://eonapp.ch/assets/css/eon-city-play-live-3a245e6.css';
  assert.equal(await (await dispatchFetch(harness, core)).text(), `runtime-${new URL(core).pathname}`);
  assert.equal(await (await dispatchFetch(harness, core)).text(), `runtime-${new URL(core).pathname}`);
  assert.equal(fetches, 1, 'same-release City JS must be restored from release-scoped Cache Storage');
  assert.equal(await (await dispatchFetch(harness, css)).text(), `runtime-${new URL(css).pathname}`);
  assert.equal(await (await dispatchFetch(harness, css)).text(), `runtime-${new URL(css).pathname}`);
  assert.equal(fetches, 2, 'same-release City CSS must be restored from release-scoped Cache Storage');
});

test('R09 query-bearing City runtime requests remain network-only and are never persisted', async () => {
  let fetches = 0;
  const harness = createWorkerHarness({
    fetchImpl: async () => { fetches += 1; return new Response(`query-${fetches}`, { status: 200, headers: { 'cache-control': 'public, max-age=0, must-revalidate' } }); }
  });
  const url = 'https://eonapp.ch/assets/js/city/eon-city-play-core.js?state=private';
  assert.equal(await (await dispatchFetch(harness, url)).text(), 'query-1');
  assert.equal(await (await dispatchFetch(harness, url)).text(), 'query-2');
  assert.equal(fetches, 2);
});

test('W766IR2-F cache hit serves unchanged immutable, W649 and W659F bytes without another fetch', async () => {
  let fetches = 0;
  const harness = createWorkerHarness({
    fetchImpl: async (request) => {
      fetches += 1;
      return new Response(`download-${new URL(request.url).pathname}`, {
        status: 200,
        headers: { 'cache-control': 'public, max-age=31556952, immutable' }
      });
    }
  });
  const coreModel = 'https://eonapp.ch/assets/city/immutable/models/command-horizon-arrival-gate-lod2-textured.c47049bd6c5c.glb';
  const pathfinder = 'https://eonapp.ch/assets/city/w649/primary/characters/eoncity_pathfinder_prime_11clips.4fc5f5bc696f.glb';
  const relay = 'https://eonapp.ch/assets/city/w659f/primary/world/eoncity_agent_theatre_relay_console.da4372b861b5.glb';

  assert.equal(await (await dispatchFetch(harness, coreModel)).text(), `download-${new URL(coreModel).pathname}`);
  assert.equal(fetches, 1);
  assert.equal(await (await dispatchFetch(harness, coreModel)).text(), `download-${new URL(coreModel).pathname}`);
  assert.equal(fetches, 1, 'unchanged content-addressed core model must not touch the network');

  assert.equal(await (await dispatchFetch(harness, pathfinder)).text(), `download-${new URL(pathfinder).pathname}`);
  assert.equal(fetches, 2);
  assert.equal(await (await dispatchFetch(harness, pathfinder)).text(), `download-${new URL(pathfinder).pathname}`);
  assert.equal(fetches, 2, 'unchanged cached W649 asset must not touch the network');

  assert.equal(await (await dispatchFetch(harness, relay)).text(), `download-${new URL(relay).pathname}`);
  assert.equal(fetches, 3);
  assert.equal(await (await dispatchFetch(harness, relay)).text(), `download-${new URL(relay).pathname}`);
  assert.equal(fetches, 3, 'unchanged cached W659F asset must not touch the network');
});

test('W766IR2-D changed hash downloads once while unchanged hashes remain local', async () => {
  let fetches = 0;
  const harness = createWorkerHarness({
    fetchImpl: async () => {
      fetches += 1;
      return new Response(`version-${fetches}`, {
        status: 200,
        headers: { 'cache-control': 'public, max-age=31556952, immutable' }
      });
    }
  });
  const oldUrl = 'https://eonapp.ch/assets/city/w649/primary/world/eoncity_portal_gate.d0bb55b17f96.glb';
  const newUrl = 'https://eonapp.ch/assets/city/w649/primary/world/eoncity_portal_gate.aaaaaaaaaaaa.glb';

  assert.equal(await (await dispatchFetch(harness, oldUrl)).text(), 'version-1');
  assert.equal(await (await dispatchFetch(harness, oldUrl)).text(), 'version-1');
  assert.equal(await (await dispatchFetch(harness, newUrl)).text(), 'version-2');
  assert.equal(await (await dispatchFetch(harness, newUrl)).text(), 'version-2');
  assert.equal(fetches, 2, 'each distinct content hash downloads exactly once');
});

test('W766IR2-D migrates prior release-specific City art before deleting the old owned cache', async () => {
  const assetUrl = 'https://eonapp.ch/assets/city/w649/primary/world/eoncity_genesis_core.c706604ac2f6.glb';
  const harness = createWorkerHarness({
    seed: {
      'eonapp-city-assets-w765-old-release': { [assetUrl]: 'legacy-cached-art' },
      'other-product-cache': { 'https://eonapp.ch/other.bin': 'untouched' }
    },
    fetchImpl: async () => { throw new Error('activation must not fetch City art'); }
  });

  await dispatchActivate(harness);
  assert.equal(await harness.caches.has('eonapp-city-assets-w765-old-release'), false);
  assert.equal(await harness.caches.has('eonapp-city-assets-v1'), true);
  assert.equal(await harness.caches.has('other-product-cache'), true, 'unknown cache must remain untouched');
  const stable = await harness.caches.open('eonapp-city-assets-v1');
  assert.equal(await (await stable.match(new Request(assetUrl))).text(), 'legacy-cached-art');
  const activation = harness.messages.find((message) => message.type === 'EONAPP_SW_ACTIVATED');
  assert.equal(activation?.migratedLegacyCityAssetCaches, 1);
  assert.equal(activation?.migratedLegacyCityAssetEntries, 1);
  assert.equal(activation?.persistentCityAssetCache, 'eonapp-city-assets-v1');
});
