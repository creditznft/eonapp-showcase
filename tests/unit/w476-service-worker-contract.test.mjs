import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const swSource = fs.readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');
const publicSwSource = fs.readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const pwaManagerSource = fs.readFileSync(new URL('../../assets/js/eon-pwa-manager.js', import.meta.url), 'utf8');

function extractPrecache(source) {
  const match = source.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
  assert.ok(match, 'PRECACHE Object.freeze list must exist');
  return [...match[1].matchAll(/'([^']+)'/g)].map((row) => row[1]);
}

test('W476 service worker uses a dated release identity and no fixed v54 cache namespace', () => {
  assert.match(swSource, /const RELEASE_ID = 'w\d{3}-\d{4}-\d{2}-\d{2}-[a-z0-9-]+'/);
  assert.doesNotMatch(swSource, /const VERSION = 'v54'/);
  assert.doesNotMatch(swSource, /eonapp-shell-v54/);
});

test('W476 service worker deletes only replaceable EONAPP caches and preserves durable offline data', () => {
  assert.match(swSource, /isReplaceableRuntimeCacheName\(key\) && !CURRENT_EONAPP_CACHES\.has\(key\)/);
  assert.match(swSource, /staleStagingKeys = keys\.filter\(\(key\) => isReplaceableStagingCacheName\(key\)\)/);
  assert.match(swSource, /durableOfflineCachesPreservedDuringActivation/);
  assert.match(swSource, /protectedBrowserDatabasesTouched: false/);
  assert.doesNotMatch(swSource, /filter\(\(key\) => !\[SHELL_CACHE, ASSET_CACHE, PAGE_CACHE\]\.includes\(key\)\)/);
  assert.match(swSource, /unknownCachesPreserved: true/);
});

test('W476 service worker precaches canonical URLs only', () => {
  const precache = extractPrecache(swSource);
  const forbidden = ['/chat.html', '/projects.html', '/library.html', '/workspace.html', '/automations.html', '/local-ai.html', '/market.html', '/profile.html', '/realm-studio.html', '/eoncity.html', '/eoncity/play', '/eoncity/3d'];
  for (const url of forbidden) assert.equal(precache.includes(url), false, `${url} must not be precached`);
  for (const url of ['/', '/projects', '/library', '/workspace', '/automations', '/local-ai', '/market', '/insights', '/profile', '/realm-studio']) {
    assert.equal(precache.includes(url), true, `${url} should be the canonical precache entry`);
  }
  assert.equal(precache.includes('/eoncity'), false, 'Authenticated City must stay out of precache');
  assert.match(swSource, /NO_STORE_NAVIGATION_PREFIXES[\s\S]*'\/eoncity'/);
  assert.match(swSource, /CITY_RUNTIME_RELEASE_CACHE_PREFIXES[\s\S]*\/assets\/css\/eon-city-play/);
});

test('W476 service worker applies update only after release-scoped user choice message', () => {
  assert.match(swSource, /EONAPP_SW_UPDATE_WAITING/);
  assert.match(swSource, /requiresUserReloadChoice: true/);
  assert.match(swSource, /EONAPP_RELEASE_ID_REQUEST/);
  assert.match(swSource, /EONAPP_SW_RELEASE_ID/);
  assert.match(swSource, /EONAPP_APPLY_UPDATE/);
  assert.match(swSource, /event\.data\?\.releaseId === RELEASE_ID/);
});


test('W766IR2-0 service-worker activation never navigates or reloads an open City client', () => {
  assert.doesNotMatch(swSource, /refreshEligibleCityClientsOnce/);
  assert.doesNotMatch(swSource, /client\.navigate\(/);
  assert.match(swSource, /automaticCityNavigation:\s*false/);
  assert.match(swSource, /reloadRequired:\s*true/);
});

test('W476 PWA manager requests and verifies a waiting worker release identity before update', () => {
  assert.match(pwaManagerSource, /worker\.postMessage\(\{ type: 'EONAPP_RELEASE_ID_REQUEST' \}\)/);
  assert.match(pwaManagerSource, /type === 'EONAPP_SW_RELEASE_ID'/);
  assert.match(pwaManagerSource, /reason: 'update-release-identity-unavailable'/);
  assert.match(pwaManagerSource, /waitingWorker\.postMessage\(\{ type: 'EONAPP_APPLY_UPDATE', releaseId, explicitUserAction: true \}\)/);
  assert.match(pwaManagerSource, /reloadEonPwaAfterUpdate/);
  assert.match(pwaManagerSource, /automaticReload:\s*false/);
  assert.doesNotMatch(pwaManagerSource, /controllerchange[\s\S]{0,500}location\.reload\(/);
});

test('public service worker mirror matches root service worker', () => {
  assert.equal(publicSwSource, swSource);
});
