import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  EON_CITY_PERSISTENT_CACHE_NAME,
  isImmutableEonCityAssetPath
} from '../../assets/js/city/eon-city-asset-cache-policy.js';

const root = new URL('../../', import.meta.url);
const text = async (path) => readFile(new URL(path, root), 'utf8');

test('L95 City immutable assets keep a release-stable cache identity and content-hashed URL contract', () => {
  assert.equal(EON_CITY_PERSISTENT_CACHE_NAME, 'eonapp-city-assets-v1');
  assert.equal(isImmutableEonCityAssetPath('/assets/city/immutable/models/pathfinder.012345abcdef.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w649/primary/characters/pathfinder.012345abcdef.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/w659f/primary/world/command-tower.012345abcdef.glb'), true);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/models/pathfinder.glb'), false);
  assert.equal(isImmutableEonCityAssetPath('/assets/city/immutable/models/pathfinder.012345abcdef.glb?release=2'), false);
});

test('L95 production build content-addresses City binaries and fails closed on emitted unhashed assets', async () => {
  const build = await text('scripts/build-production.mjs');
  assert.match(build, /contentAddressEonCityBinaries\(\{ distDir: DIST, removeOriginals: true \}\)/);
  assert.match(build, /auditEonCityContentAddressedDist\(\{ distDir: DIST \}\)/);
  assert.match(build, /content-address/i);
});

test('L95 service worker reuses immutable City art cache-first and preserves the stable cache across activation', async () => {
  const [canonical, rootSw, publicSw] = await Promise.all([
    text('service-worker/eonapp-service-worker.js'),
    text('sw.js'),
    text('public/sw.js')
  ]);
  assert.equal(rootSw, canonical);
  assert.equal(publicSw, canonical);
  assert.match(canonical, /const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'/);
  assert.match(canonical, /async function persistentCityAssetCacheFirst/);
  assert.match(canonical, /fetch\(event\.request, \{ cache: 'force-cache' \}\)/);
  assert.match(canonical, /event\.respondWith\(persistentCityAssetCacheFirst\(event\)\)/);
  assert.match(canonical, /manualEntryEviction:\s*false/);
  assert.match(canonical, /explicit-storage-pressure-maintenance-required/);
  assert.doesNotMatch(canonical, /client\.navigate\s*\(/);
});

test('L95 immutable City response headers permit long-lived browser reuse', async () => {
  const headers = await text('_headers');
  assert.match(headers, /\/assets\/city\/immutable\/\*[^]*Cache-Control: public, max-age=31556952, immutable/);
  assert.match(headers, /\/assets\/city\/w649\/\*[^]*Cache-Control: public, max-age=31556952, immutable/);
  assert.match(headers, /\/assets\/city\/w659f\/\*[^]*Cache-Control: public, max-age=31556952, immutable/);
});

test('L95 normal app activation preserves unchanged content-addressed City art across release updates', async () => {
  const canonical = await text('service-worker/eonapp-service-worker.js');
  assert.match(canonical, /CURRENT_EONAPP_CACHES[^]*PERSISTENT_CITY_ASSET_CACHE/);
  assert.match(canonical, /obsoleteOwnedKeys = keys\.filter\(\(key\) => isReplaceableRuntimeCacheName\(key\) && !CURRENT_EONAPP_CACHES\.has\(key\)\)/);
  assert.match(canonical, /async function persistentCityAssetCacheFirst[^]*matchCurrentCache\(PERSISTENT_CITY_ASSET_CACHE, event\.request\)[^]*if \(cached\) return cached;/);
  assert.match(canonical, /migrateLegacyCityAssetCaches[^]*name\.startsWith\('eonapp-city-assets-'\) && name !== PERSISTENT_CITY_ASSET_CACHE/);
  assert.doesNotMatch(EON_CITY_PERSISTENT_CACHE_NAME, /release|revision|commit|build/i);
});
