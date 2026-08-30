import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_ASSET_CACHE_ENTRY_LIMIT,
  EON_CITY_ASSET_CACHE_RETENTION,
  EON_CITY_PERSISTENT_CACHE_NAME,
  describeEonCityAssetCacheStatus,
  inspectEonCityAssetCache,
  isImmutableEonCityAssetPath
} from '../../assets/js/city/eon-city-asset-cache-policy.js';
import { mountEonCityAccessStation } from '../../assets/js/city/eon-city-access-station.js';
import { buildEonCityAccessDecision } from '../../config/w554-eon-city-access-project-portals-contract.mjs';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

function createRoot() {
  return {
    dataset: {},
    innerHTML: '',
    querySelector() { return null; }
  };
}

function createRuntimeMachine() {
  let state = 'idle';
  return {
    getSnapshot() { return { state }; },
    transition(next) { state = next; return { state }; },
    fail() { state = 'recoverable-error'; return { state }; }
  };
}

test('W766IR2-D accepts content-hashed City assets as release-stable cache entries', () => {
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w649/primary/characters/eoncity_pathfinder_prime_11clips.4fc5f5bc696f.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('https://eonapp.ch/assets/city/w649/fallback/world/eoncity_portal_gate.af1f4365aa6c.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w659f/primary/world/eoncity_transit_hub_beacon_terminal.19fe9d112c53.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w649/primary/world/unhashed.glb'), false);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w649/primary/world/item.123456789abc.glb?release=w651'), false);
  assert.equal(isImmutableEonCityAssetPath('/assets/js/eon-city-play-station.js'), false);
  assert.equal(EON_CITY_PERSISTENT_CACHE_NAME, 'eonapp-city-assets-v1');
  assert.equal(EON_CITY_ASSET_CACHE_ENTRY_LIMIT, null);
  assert.equal(EON_CITY_ASSET_CACHE_RETENTION, 'content-addressed-browser-managed');
});

test('W650 cache inspection requests persistence only locally and reports reusable saved assets', async () => {
  let persistCalls = 0;
  const navigatorRef = {
    storage: {
      persisted: async () => false,
      persist: async () => { persistCalls += 1; return true; },
      estimate: async () => ({ usage: 50_000_000, quota: 500_000_000 })
    }
  };
  const requests = [
    { url: 'https://eonapp.ch/assets/city/w649/primary/characters/eoncity_pathfinder_prime_11clips.4fc5f5bc696f.glb' },
    { url: 'https://eonapp.ch/assets/city/w649/fallback/world/eoncity_portal_gate.af1f4365aa6c.glb' },
    { url: 'https://eonapp.ch/assets/js/app.js' }
  ];
  const cachesRef = {
    has: async (name) => name === EON_CITY_PERSISTENT_CACHE_NAME,
    open: async () => ({ keys: async () => requests })
  };
  const status = await inspectEonCityAssetCache({ navigatorRef, cachesRef, requestPersistence: true });
  assert.equal(persistCalls, 1);
  assert.equal(status.persisted, true);
  assert.equal(status.cachedEntries, 2);
  assert.equal(status.releaseStableCacheName, true);
  assert.equal(status.appUpdatePreservesUnchangedAssets, true);
  assert.equal(status.changedAssetsUseNewUrls, true);
  assert.equal(status.unchangedAssetsAvoidNetworkAfterCacheHit, true);
  assert.equal(status.logoutPreservesAssets, true);
  assert.equal(status.userDataRead, false);
  assert.equal(status.userDataWritten, false);
  assert.match(describeEonCityAssetCacheStatus(status), /2 saved City art files/);
  assert.equal(status.manualEntryEviction, false);
});

test('W650 persistence denial never blocks City or creates a false guarantee', async () => {
  const status = await inspectEonCityAssetCache({
    navigatorRef: { storage: { persisted: async () => false, persist: async () => false, estimate: async () => ({}) } },
    cachesRef: { has: async () => false, open: async () => ({ keys: async () => [] }) },
    requestPersistence: true
  });
  assert.equal(status.persisted, false);
  assert.equal(status.persistenceRequested, true);
  assert.equal(status.persistenceGranted, false);
  assert.equal(status.guarantee, 'best-effort-browser-storage-subject-to-browser-eviction');
  assert.match(describeEonCityAssetCacheStatus(status), /cached on this device as it is opened/);
});

test('W650 checks the City asset cache only after authenticated access succeeds', async () => {
  let cacheInspections = 0;
  let imports = 0;
  const cacheInspector = async () => {
    cacheInspections += 1;
    return {
      cacheName: EON_CITY_PERSISTENT_CACHE_NAME,
      cachedEntries: 17,
      persisted: true,
      cacheStorageSupported: true,
      releaseStableCacheName: true,
      appUpdatePreservesUnchangedAssets: true
    };
  };
  const signedOutRoot = createRoot();
  await mountEonCityAccessStation(signedOutRoot, {
    runtimeStateMachine: createRuntimeMachine(),
    cacheInspector,
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: false }))),
    importImpl: async () => { imports += 1; return {}; }
  });
  assert.equal(cacheInspections, 0);
  assert.equal(imports, 0);

  const signedInRoot = createRoot();
  const result = await mountEonCityAccessStation(signedInRoot, {
    runtimeStateMachine: createRuntimeMachine(),
    cacheInspector,
    fetchImpl: async () => new Response(JSON.stringify(buildEonCityAccessDecision({ identityAvailable: true, signedIn: true }))),
    importImpl: async () => ({ mountEonCityRuntimeOwner: () => ({ mounted: true }) })
  });
  assert.equal(result.ok, true);
  assert.equal(cacheInspections, 1);
  assert.equal(signedInRoot.dataset.eonCityCachedAssetEntries, '17');
  assert.equal(signedInRoot.dataset.eonCityStoragePersisted, 'true');
});

test('W650 Cloudflare and service-worker policy preserve unchanged GLBs while app code revalidates', () => {
  const headers = read('_headers');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const versioning = read('assets/js/utils/app-versioning.js');
  assert.match(headers, /\/assets\/\*\s+Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(headers, /\/assets\/city\/w649\/\*[\s\S]*! Cache-Control[\s\S]*Cache-Control: public, max-age=31556952, immutable/);
  assert.match(headers, /\/assets\/city\/w659f\/\*[\s\S]*! Cache-Control[\s\S]*Cache-Control: public, max-age=31556952, immutable/);
  // The immutable City-art namespace is stable across shell releases. New or
  // changed bytes use a new hash-bearing URL; unchanged URLs remain local.
  assert.match(sw, /const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.match(sw, /CURRENT_EONAPP_CACHES[\s\S]*PERSISTENT_CITY_ASSET_CACHE/);
  assert.match(sw, /isPersistentContentHashedCityAsset[\s\S]*persistentCityAssetCacheFirst/);
  assert.match(sw, /const CITY_SHELL_CACHE = `eonapp-city-shell-\$\{RELEASE_ID\}`/);
  assert.match(sw, /cityRuntimeReleaseCacheFirst/);
  assert.doesNotMatch(sw, /MAX_PERSISTENT_CITY_ASSET_ENTRIES/);
  assert.match(sw, /migrateLegacyCityAssetCaches/);
  assert.match(sw, /EON_CITY_ASSET_CACHE_STATUS_REQUEST/);
  assert.equal(sw, publicSw);
  assert.doesNotMatch(versioning, /VERSION_SWITCH/);
  assert.doesNotMatch(versioning, /Force cache clear/);
});

test('W650 loading shield waits for both the renderer frame and premium starter assets', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const districtRuntime = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  assert.match(station, /let rendererFirstFrameReady = false/);
  assert.match(station, /let initialAssetsReady = false/);
  assert.match(station, /!rendererFirstFrameReady \|\| !initialAssetsReady/);
  assert.match(station, /onAssetProgress: reportInitialAssetProgress/);
  assert.match(station, /onInitialAssetsReady: \(result = \{\}\)/);
  assert.match(station, /onFirstFrame: \(\) => \{[\s\S]*rendererFirstFrameReady = true/);
  assert.match(station, /Pathfinder, EONBOT, and Orientation Hall are ready/);
  assert.match(renderer, /onInitialAssetsReady\?\.\(\{ ok:/);
  assert.match(renderer, /onAssetProgress\?\.\(\{ scope: 'core'/);
  assert.match(renderer, /onAssetProgress\?\.\(\{ scope: 'district'/);
  assert.match(districtRuntime, /onProgress\?\.\(freeze\(\{ path, loaded, total/);
});
