/* EONAPP.ch — Canonical generated Service Worker source — A15 I22 */
/* W476 owned-cache/update-safety boundary remains in force. */
/* Explicit-update bounded cache policy remains in force. */
// W765R3: this token is materialized by the production build. A release must
// never share a Cache Storage namespace with an earlier shell.
const RELEASE_ID = 'w765-2026-07-31-release-identity-source-template';
const RELEASE_SOURCE_REVISION = '__EONAPP_RELEASE_SOURCE_REVISION__';
const CITY_RUNTIME_PROVENANCE = 'eon-city-living-nexus-command-core-w757-1';
const REPLACEABLE_RUNTIME_CACHE_PREFIXES = Object.freeze(['eonapp-shell-', 'eonapp-assets-', 'eonapp-pages-', 'eonapp-city-shell-']);
const DURABLE_OFFLINE_CACHE_PREFIXES = Object.freeze(['eonapp-city-assets-', 'eonapp-offline-meta-', 'eonapp-offline-pack-']);
const REPLACEABLE_STAGING_CACHE_PREFIXES = Object.freeze(['eonapp-offline-staging-']);
const EONAPP_CACHE_PREFIXES = Object.freeze([...REPLACEABLE_RUNTIME_CACHE_PREFIXES, ...DURABLE_OFFLINE_CACHE_PREFIXES, ...REPLACEABLE_STAGING_CACHE_PREFIXES]);
const SHELL_CACHE = `eonapp-shell-${RELEASE_ID}`;
const ASSET_CACHE = `eonapp-assets-${RELEASE_ID}`;
const PAGE_CACHE = `eonapp-pages-${RELEASE_ID}`;
const CITY_SHELL_CACHE = `eonapp-city-shell-${RELEASE_ID}`;
const PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1';
const OFFLINE_META_CACHE = 'eonapp-offline-meta-v1';
const OFFLINE_PACK_CACHE_PREFIX = 'eonapp-offline-pack-';
const OFFLINE_STAGING_CACHE_PREFIX = 'eonapp-offline-staging-';
const OFFLINE_MANIFEST_URL = '/offline/eonapp-offline-pack-manifest.json';
const OFFLINE_ACTIVE_META_URL = '/__eonapp/offline/active';
const OFFLINE_MANIFEST_SCHEMA = 'eonapp.offline-pack-manifest.w766ir2.v1';
const OFFLINE_CITY_CAPABILITY_SCHEMA = 'eonapp.offline-capability.w766ir2.v1';
const CURRENT_EONAPP_CACHES = Object.freeze(new Set([SHELL_CACHE, ASSET_CACHE, PAGE_CACHE, CITY_SHELL_CACHE, PERSISTENT_CITY_ASSET_CACHE, OFFLINE_META_CACHE]));
const OFFLINE_FALLBACK = '/offline.html';
const MAX_ASSET_ENTRIES = 160;
// R09: immutable City binaries are content-addressed and cross-release. Do not
// evict them by an arbitrary FIFO entry count; browser quota/explicit manifest-
// aware maintenance owns storage pressure instead.
const MAX_PAGE_ENTRIES = 32;
const NAVIGATION_NETWORK_TIMEOUT_MS = 4500;
const OFFLINE_CORE_RECEIPT_MS = 180 * 24 * 60 * 60 * 1000;
let activeOfflinePackMemory = null;
let offlinePackMutationActive = false;
const sw = /** @type {any} */ (self);

// Canonical public documents only. Redirect aliases, .html duplicates, retired
// City paths, sensitive surfaces and dynamic routes must not be precached.
const /** @type {any} */ PRECACHE = Object.freeze([
  '/', '/projects', '/library', '/workspace', '/automations', '/local-ai',
  '/market', '/insights', '/profile', '/realm-studio',
  '/offline.html', '/404.html', '/manifest.webmanifest', '/favicon.svg',
  '/assets/img/icons/icon-192.png', '/assets/img/icons/icon-512.png'
]);
const CRITICAL_PRECACHE = Object.freeze([OFFLINE_FALLBACK, '/manifest.webmanifest', '/favicon.svg']);

const LEGACY_CITY_NAVIGATION_PATHS = Object.freeze(new Set([
  '/realm', '/realm/', '/realm.html', '/realmworld', '/realmworld.html', '/realm-world', '/team-realm', '/team-realm.html', '/world', '/game', '/games.html',
  '/eoncity.html', '/eoncity/', '/eoncity/lite', '/eoncity/lite/', '/eoncity/lite.html', '/eoncity/tour', '/eoncity/tour/',
  '/eoncity/3d', '/eoncity/3d/', '/eoncity/play', '/eoncity/play/',
  '/eoncity-lite.html', '/eoncity-3d', '/eoncity-3d.html', '/eoncity-play', '/eoncity-play.html'
]));

const NO_STORE_NAVIGATION_PREFIXES = Object.freeze([
  '/admin', '/campaign-admin', '/billing', '/subscription', '/payment', '/api/', '/functions/', '/reward-access', '/rewards', '/telegram',
  '/vault', '/capsule', '/vault-backup', '/eoncity'
]);

// R09: City access/navigation stays network-only, but static City runtime JS/CSS
// is cached inside the exact release namespace. A new release gets a new cache,
// preventing mixed runtimes while same-release re-entry avoids repeat transfers.
const CITY_RUNTIME_RELEASE_CACHE_PREFIXES = Object.freeze([
  // City surface CSS is part of the authenticated runtime contract. Match the
  // release-addressed family, not only its retired stable filename, so a new
  // Menu/Transit/Expanse stylesheet can never fall through to CacheFirst.
  '/assets/css/eon-city-play',
  '/assets/js/eon-city-play-station.js',
  '/assets/js/city/'
]);
const NETWORK_ONLY_STATIC_PATHS = Object.freeze(new Set(['/sw.js']));
const SENSITIVE_QUERY_KEY = /^(?:access_token|auth|authorization|code|credential|key|password|secret|session|signature|state|token)$/i;

function isEonAppOwnedCacheName(cacheName = '') {
  const value = String(cacheName || '');
  return EONAPP_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix));
}
void isEonAppOwnedCacheName;

function isReplaceableRuntimeCacheName(cacheName = '') {
  const value = String(cacheName || '');
  return REPLACEABLE_RUNTIME_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isDurableOfflineCacheName(cacheName = '') {
  const value = String(cacheName || '');
  return DURABLE_OFFLINE_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isReplaceableStagingCacheName(cacheName = '') {
  const value = String(cacheName || '');
  return REPLACEABLE_STAGING_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function isStaticAsset(pathname = '') {
  return /\.(?:js|mjs|css|json|webmanifest|png|jpg|jpeg|webp|avif|svg|ico|woff2|woff|ttf|glb|gltf|bin|ktx2|wasm|mp3|ogg|wav|mp4|webm)$/i.test(pathname);
}

function isPersistentContentHashedCityAsset(pathname = '') {
  const clean = String(pathname || '');
  return /^\/assets\/city\/immutable\/(?:[a-z0-9._-]+\/){0,8}[a-z0-9._-]+\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i.test(clean)
    || /^\/assets\/city\/w[a-z0-9-]+\/(?:[a-z0-9_-]+\/){1,4}[a-z0-9_-]+\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i.test(clean);
}


function isNoStoreNavigationPath(pathname = '') {
  const clean = String(pathname || '/').toLowerCase();
  return NO_STORE_NAVIGATION_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`) || clean.startsWith(`${prefix}.html`));
}

function isCityRuntimeReleaseCachePath(pathname = '') {
  const clean = String(pathname || '').toLowerCase();
  return CITY_RUNTIME_RELEASE_CACHE_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(prefix));
}

function isOfflineCityPath(pathname = '') {
  const clean = String(pathname || '').toLowerCase();
  return clean === '/eoncity'
    || clean.startsWith('/eoncity/')
    || clean.startsWith('/city-private/')
    || clean.startsWith('/assets/city/')
    || clean.startsWith('/assets/js/city/')
    || clean.startsWith('/assets/js/eon-city-')
    || clean.startsWith('/assets/css/eon-city-');
}

function hasSensitiveQuery(url) {
  for (const key of url.searchParams.keys()) if (SENSITIVE_QUERY_KEY.test(key)) return true;
  return false;
}

function isLoopbackUrl(url) {
  const hostname = String(url?.hostname || '').toLowerCase();
  return (url?.protocol === 'http:' || url?.protocol === 'https:')
    && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1');
}

function isOfflinePackCacheName(name = '') {
  const value = String(name || '');
  return value.startsWith(OFFLINE_PACK_CACHE_PREFIX) || value.startsWith(OFFLINE_STAGING_CACHE_PREFIX);
}

function normalizePackIds(value = []) {
  const allowed = new Set(['core', 'city']);
  const packs = Array.isArray(value) ? value.map((item) => String(item || '').trim().toLowerCase()).filter((item) => allowed.has(item)) : [];
  const unique = [...new Set(packs)];
  if (unique.includes('city') && !unique.includes('core')) unique.unshift('core');
  return unique.sort();
}

function randomInstallationId() {
  if (typeof crypto?.randomUUID === 'function') return `offline-${crypto.randomUUID().toLowerCase()}`;
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `offline-${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function offlineMetaRequest() {
  return new Request(new URL(OFFLINE_ACTIVE_META_URL, sw.location.origin).toString(), { method: 'GET' });
}

function isOfflineReceiptBound(receipt, { requireCity = false, installationId = '', manifestDigest = '', packs: expectedPacks = [] } = {}) {
  if (!receipt || typeof receipt !== 'object') return false;
  const packs = normalizePackIds(receipt.packs);
  const expected = normalizePackIds(expectedPacks);
  if (!packs.includes('core')) return false;
  if (installationId && String(receipt.installationId || '') !== String(installationId)) return false;
  if (manifestDigest && String(receipt.manifestDigest || '') !== String(manifestDigest)) return false;
  if (expected.length && JSON.stringify(packs) !== JSON.stringify(expected)) return false;
  if (!requireCity) return receipt.schema === 'eonapp.offline-core-local-receipt.w766ir2.v1' && !packs.includes('city');
  return receipt.schema === OFFLINE_CITY_CAPABILITY_SCHEMA
    && packs.includes('city')
    && /^hmac-sha256\.[A-Za-z0-9_-]{32,}$/.test(String(receipt.signature || ''));
}

function isValidOfflineReceipt(receipt, options = {}) {
  if (!isOfflineReceiptBound(receipt, options)) return false;
  return Number.isFinite(Number(receipt.expiresAt)) && Number(receipt.expiresAt) > Number(options.now || Date.now());
}

async function readActiveOfflinePackState({ fresh = false } = {}) {
  if (!fresh && activeOfflinePackMemory) return activeOfflinePackMemory;
  try {
    const cache = await caches.open(OFFLINE_META_CACHE);
    const response = await cache.match(offlineMetaRequest());
    if (!response?.ok) return null;
    const state = await response.json();
    const cacheName = String(state?.cacheName || '');
    const packs = normalizePackIds(state?.packs);
    const valid = state?.schema === 'eonapp.offline-pack-installation.w766ir2.v1'
      && cacheName.startsWith(OFFLINE_PACK_CACHE_PREFIX)
      && /^[a-f0-9]{64}$/.test(String(state?.manifestDigest || ''))
      && packs.includes('core')
      && isOfflineReceiptBound(state?.receipt, {
        requireCity: packs.includes('city'),
        installationId: String(state?.installationId || ''),
        manifestDigest: String(state?.manifestDigest || ''),
        packs
      });
    if (!valid) return null;
    activeOfflinePackMemory = Object.freeze({ ...state, packs: Object.freeze(packs) });
    return activeOfflinePackMemory;
  } catch {
    return null;
  }
}

async function writeActiveOfflinePackState(state) {
  const cache = await caches.open(OFFLINE_META_CACHE);
  const response = new Response(JSON.stringify(state), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-eon-offline-meta': 'active' }
  });
  await cache.put(offlineMetaRequest(), response);
  activeOfflinePackMemory = Object.freeze({ ...state, packs: Object.freeze(normalizePackIds(state.packs)) });
  return activeOfflinePackMemory;
}

function offlineLookupRequest(request, { navigation = false } = {}) {
  const source = request instanceof Request ? request : new Request(request);
  const url = new URL(source.url, sw.location.origin);
  if (navigation) url.search = '';
  return new Request(url.toString(), { method: 'GET', headers: { accept: navigation ? 'text/html' : (source.headers.get('accept') || '*/*') } });
}

async function matchActiveOfflinePack(request, { navigation = false, requirePack = '' } = {}) {
  const sourceUrl = new URL(request?.url || request, sw.location.origin);
  if (hasSensitiveQuery(sourceUrl)) return undefined;
  const state = await readActiveOfflinePackState();
  if (!state || (requirePack && !state.packs.includes(requirePack))) return undefined;
  if (requirePack === 'city' && !isValidOfflineReceipt(state.receipt, {
    requireCity: true,
    installationId: state.installationId,
    manifestDigest: state.manifestDigest,
    packs: state.packs
  })) return undefined;
  try {
    const cache = await caches.open(state.cacheName);
    const lookup = offlineLookupRequest(request, { navigation });
    const lookupUrl = new URL(lookup.url);
    return cache.match(lookup, { ignoreSearch: navigation || !hasSensitiveQuery(lookupUrl), ignoreMethod: false, ignoreVary: true });
  } catch {
    return undefined;
  }
}

async function inspectOfflinePackStatus() {
  const state = await readActiveOfflinePackState({ fresh: true });
  if (!state) return Object.freeze({ installed: false, packs: Object.freeze([]), coreReady: false, cityReady: false, localAiPathReady: false, repairRequired: false });
  let packCacheEntries = 0;
  let persistentCityEntries = 0;
  let cachedPackPaths = new Set();
  try {
    const packKeys = await (await caches.open(state.cacheName)).keys();
    packCacheEntries = packKeys.length;
    cachedPackPaths = new Set(packKeys.map((request) => {
      try { return new URL(request.url || request, sw.location.origin).pathname; } catch { return ''; }
    }).filter(Boolean));
  } catch {}
  const expectedPackUrls = Array.isArray(state.packCacheUrls) ? state.packCacheUrls.map((url) => String(url || '')).filter(Boolean) : [];
  const expectedPackPaths = expectedPackUrls.map((url) => {
    try { return new URL(url, sw.location.origin).pathname; } catch { return ''; }
  }).filter(Boolean);
  const missingPackPaths = expectedPackPaths.filter((pathname) => !cachedPackPaths.has(pathname));
  const unexpectedPackPaths = expectedPackPaths.length ? [...cachedPackPaths].filter((pathname) => !expectedPackPaths.includes(pathname)) : [];
  const expectedPersistentUrls = Array.isArray(state.persistentCityUrls) ? state.persistentCityUrls.map((url) => String(url || '')).filter(Boolean) : [];
  let missingPersistentPaths = [...expectedPersistentUrls];
  if (expectedPersistentUrls.length) {
    try {
      const stable = await caches.open(PERSISTENT_CITY_ASSET_CACHE);
      const cachedUrls = new Set((await stable.keys()).map((request) => {
        try { return new URL(request.url || request, sw.location.origin).pathname; } catch { return ''; }
      }).filter(Boolean));
      missingPersistentPaths = expectedPersistentUrls.filter((url) => !cachedUrls.has(new URL(url, sw.location.origin).pathname));
      persistentCityEntries = expectedPersistentUrls.length - missingPersistentPaths.length;
    } catch {}
  }
  const expectedPackEntries = Math.max(0, Number(state.stagedEntries || 0));
  const packCacheReady = expectedPackPaths.length
    ? missingPackPaths.length === 0 && unexpectedPackPaths.length === 0 && packCacheEntries === expectedPackPaths.length
    : expectedPackEntries > 0 && packCacheEntries === expectedPackEntries;
  const cityReceiptValid = state.packs.includes('city') && isValidOfflineReceipt(state.receipt, {
    requireCity: true,
    installationId: state.installationId,
    manifestDigest: state.manifestDigest,
    packs: state.packs
  });
  const persistentCityReady = persistentCityEntries === expectedPersistentUrls.length;
  const coreReady = state.packs.includes('core') && packCacheReady;
  const cityReady = coreReady && state.packs.includes('city') && cityReceiptValid && persistentCityReady;
  return Object.freeze({
    installed: true,
    installationId: String(state.installationId || ''),
    releaseId: String(state.releaseId || ''),
    currentReleaseId: RELEASE_ID,
    updateAvailable: String(state.releaseId || '') !== RELEASE_ID,
    manifestDigest: String(state.manifestDigest || ''),
    packs: Object.freeze([...state.packs]),
    coreReady,
    cityReady,
    cityAuthorizationExpired: state.packs.includes('city') && !cityReceiptValid,
    repairRequired: !coreReady || (state.packs.includes('city') && !persistentCityReady),
    localAiPathReady: coreReady,
    installedAt: Number(state.installedAt || 0),
    expiresAt: Number(state.receipt?.expiresAt || 0),
    cachedEntries: packCacheEntries + persistentCityEntries,
    packCacheEntries,
    persistentCityEntries,
    expectedEntries: Math.max(0, Number(state.entries || 0)),
    missingEntries: missingPackPaths.length + missingPersistentPaths.length,
    missingPackEntries: missingPackPaths.length,
    missingPersistentCityEntries: missingPersistentPaths.length,
    unexpectedPackEntries: unexpectedPackPaths.length,
    packCacheInventoryVerified: expectedPackPaths.length > 0,
    reusedEntries: Number(state.reusedEntries || 0),
    downloadedEntries: Number(state.downloadedEntries || 0)
  });
}

async function fetchOfflineManifest() {
  const request = new Request(new URL(OFFLINE_MANIFEST_URL, sw.location.origin).toString(), { cache: 'no-store', credentials: 'same-origin', headers: { accept: 'application/json' } });
  const response = await fetch(request);
  if (!response?.ok) throw new Error('offline-manifest-unavailable');
  const manifest = await response.json();
  if (manifest?.schema !== OFFLINE_MANIFEST_SCHEMA || !/^[a-f0-9]{64}$/.test(String(manifest?.digest || '')) || !Array.isArray(manifest?.entries)) throw new Error('offline-manifest-invalid');
  const entries = manifest.entries.filter((entry) => {
    if (!entry || typeof entry !== 'object' || !['core', 'city'].includes(entry.pack)) return false;
    if (!String(entry.url || '').startsWith('/') || String(entry.url).startsWith('//')) return false;
    return /^[a-f0-9]{64}$/.test(String(entry.sha256 || '')) && Number(entry.bytes || 0) >= 0;
  }).map((entry) => Object.freeze({
    url: String(entry.url),
    sourcePath: String(entry.sourcePath || ''),
    pack: String(entry.pack),
    navigation: entry.navigation === true,
    bytes: Number(entry.bytes || 0),
    sha256: String(entry.sha256),
    contentType: String(entry.contentType || '')
  }));
  if (!entries.length || entries.length !== manifest.entries.length) throw new Error('offline-manifest-entry-invalid');
  const packs = {
    core: { entries: Number(manifest?.packs?.core?.entries || 0), bytes: Number(manifest?.packs?.core?.bytes || 0) },
    city: { entries: Number(manifest?.packs?.city?.entries || 0), bytes: Number(manifest?.packs?.city?.bytes || 0) }
  };
  const digestInput = JSON.stringify({
    schema: manifest.schema,
    releaseId: String(manifest.releaseId || ''),
    sourceRevision: String(manifest.sourceRevision || ''),
    packs,
    entries
  });
  const computedDigest = await sha256Hex(new TextEncoder().encode(digestInput));
  if (computedDigest !== String(manifest.digest || '')) throw new Error('offline-manifest-digest-mismatch');
  return Object.freeze({ ...manifest, packs: Object.freeze(packs), entries: Object.freeze(entries) });
}

async function issueOfflineCapability({ installationId, manifestDigest, packs }) {
  if (!packs.includes('city')) {
    const now = Date.now();
    return Object.freeze({
      schema: 'eonapp.offline-core-local-receipt.w766ir2.v1',
      installationId,
      entitlementClass: 'public-local-core',
      packs: Object.freeze(['core']),
      manifestDigest,
      issuedAt: now,
      expiresAt: now + OFFLINE_CORE_RECEIPT_MS,
      automaticCloudSync: false,
      privateContentIncluded: false
    });
  }
  const response = await fetch('/api/offline/capability', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ installationId, manifestDigest, packs })
  });
  let body = null;
  try { body = await response.json(); } catch {}
  if (!response.ok || body?.ok !== true || !isValidOfflineReceipt(body?.receipt, { requireCity: true })) {
    const reason = String(body?.error || (response.status === 401 ? 'signed-in-required' : 'offline-capability-unavailable'));
    throw new Error(reason);
  }
  return Object.freeze({ ...body.receipt, packs: Object.freeze(normalizePackIds(body.receipt.packs)) });
}

function sanitizeOfflineResponseHeaders(response, entry) {
  const headers = new Headers();
  const contentType = String(response.headers.get('content-type') || entry.contentType || '').trim();
  if (contentType) headers.set('content-type', contentType);
  const contentLanguage = String(response.headers.get('content-language') || '').trim();
  if (contentLanguage) headers.set('content-language', contentLanguage);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('x-eon-offline-pack', String(entry.pack || 'core'));
  headers.set('x-eon-offline-sha256', String(entry.sha256 || ''));
  return headers;
}

async function verifiedOfflineEntryResponse(entry) {
  const absoluteUrl = new URL(entry.url, sw.location.origin).toString();
  const request = new Request(absoluteUrl, { method: 'GET', credentials: 'same-origin', cache: 'reload' });
  const response = await fetch(request);
  if (!response?.ok || response.redirected || !['basic', 'default'].includes(String(response.type || 'default'))) throw new Error(`offline-entry-fetch-failed:${entry.url}`);
  const body = await response.arrayBuffer();
  if (Number(entry.bytes || 0) !== body.byteLength) throw new Error(`offline-entry-size-mismatch:${entry.url}`);
  const digest = await sha256Hex(body);
  if (digest !== String(entry.sha256 || '')) throw new Error(`offline-entry-integrity-mismatch:${entry.url}`);
  return Object.freeze({ request, response: new Response(body, { status: 200, headers: sanitizeOfflineResponseHeaders(response, entry) }) });
}

async function cachedResponseMatchesOfflineEntry(response, entry) {
  if (!response?.ok || response.redirected) return false;
  const expectedDigest = String(entry?.sha256 || '');
  const certifiedDigest = String(response.headers.get('x-eon-offline-sha256') || '');
  if (certifiedDigest && certifiedDigest === expectedDigest) return true;
  try {
    const body = await response.clone().arrayBuffer();
    if (body.byteLength !== Number(entry?.bytes || 0)) return false;
    return await sha256Hex(body) === expectedDigest;
  } catch {
    return false;
  }
}

async function matchReusableOfflineEntry(entry, previousState = null) {
  const absoluteUrl = new URL(entry.url, sw.location.origin).toString();
  const request = offlineLookupRequest(new Request(absoluteUrl), { navigation: entry.navigation === true });
  const cacheNames = [];
  if (previousState?.cacheName && isOfflinePackCacheName(previousState.cacheName)) cacheNames.push(previousState.cacheName);
  if (entry.pack === 'core') cacheNames.push(SHELL_CACHE, ASSET_CACHE, PAGE_CACHE);
  if (entry.pack === 'city' && isPersistentContentHashedCityAsset(new URL(absoluteUrl).pathname)) cacheNames.push(PERSISTENT_CITY_ASSET_CACHE);
  for (const cacheName of [...new Set(cacheNames)]) {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(request, { ignoreSearch: true, ignoreMethod: false, ignoreVary: true });
      if (await cachedResponseMatchesOfflineEntry(response, entry)) return Object.freeze({ request, response, cacheName });
    } catch {}
  }
  return null;
}

async function copyCache(sourceName, targetName) {
  const source = await caches.open(sourceName);
  const target = await caches.open(targetName);
  const requests = await source.keys();
  for (const request of requests) {
    const response = await source.match(request);
    if (response) await target.put(request, response.clone());
  }
  return requests.length;
}

async function runExclusiveOfflinePackMutation(operation) {
  if (offlinePackMutationActive) throw new Error('offline-pack-operation-busy');
  offlinePackMutationActive = true;
  try { return await operation(); }
  finally { offlinePackMutationActive = false; }
}

async function performOfflinePackInstall({ packs: requestedPacks = ['core'], explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) throw new Error('explicit-user-action-required');
  const packs = normalizePackIds(requestedPacks);
  if (!packs.length) throw new Error('offline-pack-selection-required');
  const manifest = await fetchOfflineManifest();
  const selected = manifest.entries.filter((entry) => packs.includes(entry.pack));
  if (!selected.length) throw new Error('offline-pack-empty');
  const installationId = randomInstallationId();
  const receipt = await issueOfflineCapability({ installationId, manifestDigest: manifest.digest, packs });
  const stagingName = `${OFFLINE_STAGING_CACHE_PREFIX}${installationId.slice(-24)}`;
  const finalName = `${OFFLINE_PACK_CACHE_PREFIX}${manifest.digest.slice(0, 20)}-${installationId.slice(-12)}`;
  const previous = await readActiveOfflinePackState({ fresh: true });
  await caches.delete(stagingName);
  const staging = await caches.open(stagingName);
  let completed = 0;
  let stagedEntries = 0;
  let reusedEntries = 0;
  let downloadedEntries = 0;
  let activated = false;
  try {
    for (const entry of selected) {
      const absoluteUrl = new URL(entry.url, sw.location.origin).toString();
      if (entry.pack === 'city' && isPersistentContentHashedCityAsset(new URL(absoluteUrl).pathname)) {
        const stable = await caches.open(PERSISTENT_CITY_ASSET_CACHE);
        const reusable = await matchReusableOfflineEntry(entry, previous);
        if (reusable) {
          if (reusable.cacheName !== PERSISTENT_CITY_ASSET_CACHE) await stable.put(new Request(absoluteUrl), reusable.response.clone());
          reusedEntries += 1;
        } else {
          const verified = await verifiedOfflineEntryResponse(entry);
          await stable.put(verified.request, verified.response.clone());
          downloadedEntries += 1;
        }
      } else {
        const reusable = await matchReusableOfflineEntry(entry, previous);
        if (reusable) {
          await staging.put(offlineLookupRequest(reusable.request, { navigation: entry.navigation === true }), reusable.response.clone());
          reusedEntries += 1;
        } else {
          const verified = await verifiedOfflineEntryResponse(entry);
          await staging.put(offlineLookupRequest(verified.request, { navigation: entry.navigation === true }), verified.response.clone());
          downloadedEntries += 1;
        }
        stagedEntries += 1;
      }
      completed += 1;
      if (completed === 1 || completed === selected.length || completed % 25 === 0) {
        await notifyClients({ type: 'EONAPP_OFFLINE_PACK_PROGRESS', installationId, completed, total: selected.length, reusedEntries, downloadedEntries, packs, phase: 'downloading' });
      }
    }
    await caches.delete(finalName);
    const copiedEntries = await copyCache(stagingName, finalName);
    if (copiedEntries !== stagedEntries) throw new Error('offline-pack-atomic-copy-mismatch');
    await caches.delete(stagingName);
    const state = await writeActiveOfflinePackState({
      schema: 'eonapp.offline-pack-installation.w766ir2.v1',
      installationId,
      releaseId: String(manifest.releaseId || RELEASE_ID),
      sourceRevision: String(manifest.sourceRevision || RELEASE_SOURCE_REVISION),
      manifestDigest: manifest.digest,
      cacheName: finalName,
      packs,
      installedAt: Date.now(),
      entries: selected.length,
      stagedEntries,
      packCacheUrls: selected.filter((entry) => !(entry.pack === 'city' && isPersistentContentHashedCityAsset(new URL(entry.url, sw.location.origin).pathname))).map((entry) => entry.url),
      persistentCityEntries: selected.length - stagedEntries,
      persistentCityUrls: selected.filter((entry) => entry.pack === 'city' && isPersistentContentHashedCityAsset(new URL(entry.url, sw.location.origin).pathname)).map((entry) => entry.url),
      reusedEntries,
      downloadedEntries,
      receipt
    });
    activated = true;
    if (previous?.cacheName && previous.cacheName !== finalName && isOfflinePackCacheName(previous.cacheName)) {
      try { await caches.delete(previous.cacheName); } catch {}
    }
    const status = await inspectOfflinePackStatus();
    try { await notifyClients({ type: 'EONAPP_OFFLINE_PACK_INSTALLED', ...status }); } catch {}
    return Object.freeze({ ok: true, state, status });
  } catch (error) {
    try { await caches.delete(stagingName); } catch {}
    if (!activated) {
      try { await caches.delete(finalName); } catch {}
    }
    throw error;
  }
}

async function installOfflinePack(options = {}) {
  return runExclusiveOfflinePackMutation(() => performOfflinePackInstall(options));
}

async function performOfflinePackUninstall({ explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) throw new Error('explicit-user-action-required');
  const current = await readActiveOfflinePackState({ fresh: true });
  const meta = await caches.open(OFFLINE_META_CACHE);
  await meta.delete(offlineMetaRequest());
  activeOfflinePackMemory = null;
  if (current?.cacheName && isOfflinePackCacheName(current.cacheName)) {
    try { await caches.delete(current.cacheName); } catch {}
  }
  const status = await inspectOfflinePackStatus();
  try { await notifyClients({ type: 'EONAPP_OFFLINE_PACK_REMOVED', ...status }); } catch {}
  return Object.freeze({ ok: true, status, persistentCityAssetCachePreserved: true });
}

async function uninstallOfflinePack(options = {}) {
  return runExclusiveOfflinePackMutation(() => performOfflinePackUninstall(options));
}

function isCacheSafeRequest(request, url) {
  if (request.method !== 'GET' || url.origin !== sw.location.origin) return false;
  if (request.headers.has('authorization') || request.headers.has('range')) return false;
  if (/no-store/i.test(String(request.headers.get('cache-control') || ''))) return false;
  return !hasSensitiveQuery(url);
}

function isCacheSafeResponse(response, requestUrl, { navigation = false } = {}) {
  if (!response?.ok || response.redirected) return false;
  if (!['basic', 'default'].includes(String(response.type || 'default'))) return false;
  const cacheControl = String(response.headers.get('cache-control') || '');
  if (/(?:^|,)\s*(?:no-store|private|no-cache)(?:\s|,|=|$)/i.test(cacheControl)) return false;
  if (String(response.headers.get('vary') || '').trim() === '*') return false;
  let responseUrl = null;
  try { responseUrl = new URL(response.url || requestUrl.toString(), sw.location.origin); } catch { return false; }
  if (responseUrl.origin !== sw.location.origin) return false;
  if (navigation && responseUrl.pathname.replace(/\/+$/, '') !== requestUrl.pathname.replace(/\/+$/, '')) return false;
  return true;
}

async function matchCurrentCache(cacheName, request) {
  const cache = await caches.open(cacheName);
  return cache.match(request, { ignoreSearch: false, ignoreMethod: false, ignoreVary: false });
}

async function matchOfflineFallback() {
  const shell = await caches.open(SHELL_CACHE);
  return shell.match(OFFLINE_FALLBACK);
}

async function trimCache(cacheName, maxEntries = 50) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maxEntries)).map((key) => cache.delete(key)));
}

async function putInCache(cacheName, request, response, maxEntries = null, options = {}) {
  let requestUrl = null;
  try { requestUrl = new URL(request.url || request, sw.location.origin); } catch { return response; }
  if (!isCacheSafeRequest(request, requestUrl) || !isCacheSafeResponse(response, requestUrl, options)) return response;
  const cache = await caches.open(cacheName);
  try { await cache.put(request, response.clone()); } catch { return response; }
  if (Number.isFinite(Number(maxEntries)) && Number(maxEntries) > 0) void trimCache(cacheName, Number(maxEntries)).catch(() => {});
  return response;
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try { return await fetch(request, { cache: 'no-cache', ...(controller ? { signal: controller.signal } : {}) }); }
  finally { if (timeout) clearTimeout(timeout); }
}

async function navigationNetworkOnly(event) {
  try { return await fetch(event.request, { cache: 'no-store' }); }
  catch {
    const pathname = new URL(event.request.url).pathname.toLowerCase();
    const installed = await matchActiveOfflinePack(event.request, { navigation: true, requirePack: pathname === '/eoncity' ? 'city' : 'core' });
    return installed || (await matchOfflineFallback()) || Response.error();
  }
}

async function apiNetworkOnly(event) {
  try { return await fetch(event.request.clone(), { cache: 'no-store' }); }
  catch {
    return new Response(JSON.stringify({ ok: false, offline: true, error: 'network_unavailable', cloudActionQueued: false, localWorkChanged: false }), {
      status: 503,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-eon-offline': 'true' }
    });
  }
}

async function cityRuntimeReleaseCacheFirst(event) {
  let requestUrl = null;
  try { requestUrl = new URL(event.request.url); } catch {}
  // Query-bearing City runtime requests are never persisted: signed/session-like
  // query material must not become a cache key, and release static assets do not
  // require cache-busting queries because the cache namespace already changes.
  if (!requestUrl || requestUrl.search || hasSensitiveQuery(requestUrl)) return staticNetworkOnly(event);
  const cached = await matchCurrentCache(CITY_SHELL_CACHE, event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request, { cache: 'no-store' });
    if (!response?.ok || response.type === 'opaque') return response;
    const headers = new Headers(response.headers);
    headers.set('x-eon-city-runtime-provenance', CITY_RUNTIME_PROVENANCE);
    const projected = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    return await putInCache(CITY_SHELL_CACHE, event.request, projected);
  } catch {
    return (await matchActiveOfflinePack(event.request, { navigation: false, requirePack: 'city' })) || Response.error();
  }
}

async function navigationNetworkFirst(event) {
  try {
    const response = await fetchWithTimeout(event.request, NAVIGATION_NETWORK_TIMEOUT_MS);
    event.waitUntil(putInCache(PAGE_CACHE, event.request, response, MAX_PAGE_ENTRIES, { navigation: true }));
    return response;
  } catch {
    return (await matchActiveOfflinePack(event.request, { navigation: true, requirePack: 'core' }))
      || (await matchCurrentCache(PAGE_CACHE, event.request))
      || (await matchOfflineFallback())
      || Response.error();
  }
}

async function staticNetworkOnly(event) {
  try { return await fetch(event.request, { cache: 'no-store' }); }
  catch {
    const pathname = new URL(event.request.url).pathname;
    return (await matchActiveOfflinePack(event.request, { navigation: false, requirePack: isOfflineCityPath(pathname) ? 'city' : 'core' })) || Response.error();
  }
}

async function persistentCityAssetCacheFirst(event) {
  const cached = await matchCurrentCache(PERSISTENT_CITY_ASSET_CACHE, event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request, { cache: 'force-cache' });
    return await putInCache(PERSISTENT_CITY_ASSET_CACHE, event.request, response);
  } catch {
    return Response.error();
  }
}

async function migrateLegacyCityAssetCaches(cacheNames = []) {
  const legacyNames = cacheNames.filter((name) => name.startsWith('eonapp-city-assets-') && name !== PERSISTENT_CITY_ASSET_CACHE);
  if (!legacyNames.length) return Object.freeze({ legacyCaches: 0, migratedEntries: 0, deletedLegacyCaches: 0, preservedLegacyCaches: 0 });
  const stableCache = await caches.open(PERSISTENT_CITY_ASSET_CACHE);
  let migratedEntries = 0;
  let deletedLegacyCaches = 0;
  let preservedLegacyCaches = 0;
  for (const cacheName of legacyNames) {
    const legacyCache = await caches.open(cacheName);
    const requests = await legacyCache.keys();
    let migrationFailed = false;
    for (const request of requests) {
      let url = null;
      try { url = new URL(request.url || request, sw.location.origin); } catch { continue; }
      if (url.origin !== sw.location.origin || url.search || !isPersistentContentHashedCityAsset(url.pathname)) continue;
      const existing = await stableCache.match(request, { ignoreSearch: false, ignoreMethod: false, ignoreVary: false });
      if (existing) continue;
      const response = await legacyCache.match(request, { ignoreSearch: false, ignoreMethod: false, ignoreVary: false });
      if (!response?.ok || response.redirected) { migrationFailed = true; continue; }
      try { await stableCache.put(request, response.clone()); migratedEntries += 1; }
      catch { migrationFailed = true; }
    }
    if (migrationFailed) {
      preservedLegacyCaches += 1;
      continue;
    }
    try {
      if (await caches.delete(cacheName)) deletedLegacyCaches += 1;
      else preservedLegacyCaches += 1;
    } catch { preservedLegacyCaches += 1; }
  }
  return Object.freeze({ legacyCaches: legacyNames.length, migratedEntries, deletedLegacyCaches, preservedLegacyCaches, manualEntryEviction: false });
}

function normalizeProtectedCityAssetPaths(values = []) {
  const protectedPaths = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    try {
      const url = new URL(String(value || ''), sw.location.origin);
      if (url.origin === sw.location.origin && !url.search && isPersistentContentHashedCityAsset(url.pathname)) protectedPaths.add(url.pathname);
    } catch {}
  }
  return protectedPaths;
}

async function prunePersistentCityAssetCache({ protectedUrls = [], explicitUserAction = false, storagePressure = false } = {}) {
  if (explicitUserAction !== true || storagePressure !== true) return Object.freeze({ ok: false, reason: 'explicit-storage-pressure-maintenance-required', deletedEntries: 0, automaticPruning: false });
  const activePack = await readActiveOfflinePackState({ fresh: true });
  const protectedPaths = normalizeProtectedCityAssetPaths([...(Array.isArray(protectedUrls) ? protectedUrls : []), ...(activePack?.persistentCityUrls || [])]);
  const cache = await caches.open(PERSISTENT_CITY_ASSET_CACHE);
  const keys = await cache.keys();
  let deletedEntries = 0;
  for (const request of keys) {
    let url = null;
    try { url = new URL(request.url || request, sw.location.origin); } catch { continue; }
    if (url.origin !== sw.location.origin || url.search || !isPersistentContentHashedCityAsset(url.pathname) || protectedPaths.has(url.pathname)) continue;
    if (await cache.delete(request)) deletedEntries += 1;
  }
  return Object.freeze({ ok: true, deletedEntries, protectedEntries: protectedPaths.size, automaticPruning: false, currentRollbackOfflineProtectionRequired: true });
}

async function inspectPersistentCityAssetCache() {
  try {
    const cache = await caches.open(PERSISTENT_CITY_ASSET_CACHE);
    const keys = await cache.keys();
    const immutableKeys = keys.filter((request) => {
      try {
        const url = new URL(request.url || request, sw.location.origin);
        return url.origin === sw.location.origin && !url.search && isPersistentContentHashedCityAsset(url.pathname);
      } catch { return false; }
    });
    return Object.freeze({ cacheName: PERSISTENT_CITY_ASSET_CACHE, cachedEntries: immutableKeys.length, releaseStable: true, cacheFirst: true, manualEntryEviction: false });
  } catch {
    return Object.freeze({ cacheName: PERSISTENT_CITY_ASSET_CACHE, cachedEntries: 0, releaseStable: true, cacheFirst: true, inspectionFailed: true });
  }
}

async function staticCacheFirst(event) {
  const url = new URL(event.request.url);
  // Query-bearing assets stay out of runtime caches. Release/version query
  // strings remain effective in the browser HTTP cache without multiplying
  // Cache API entries or retaining accidental token-bearing URLs.
  if (url.search) return staticNetworkOnly(event);
  const cached = await matchCurrentCache(ASSET_CACHE, event.request);
  if (cached) {
    event.waitUntil(fetch(event.request).then((response) => putInCache(ASSET_CACHE, event.request, response, MAX_ASSET_ENTRIES)).catch(() => {}));
    return cached;
  }
  try { return await putInCache(ASSET_CACHE, event.request, await fetch(event.request), MAX_ASSET_ENTRIES); }
  catch {
    return (await matchActiveOfflinePack(event.request, { navigation: false, requirePack: isOfflineCityPath(url.pathname) ? 'city' : 'core' })) || Response.error();
  }
}

async function notifyClients(message) {
  const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    try { client.postMessage(message); } catch {}
  }
}

async function precacheReleaseShell() {
  const cache = await caches.open(SHELL_CACHE);
  // The offline document is a real install prerequisite; optional warm routes
  // must not block installation when one route is temporarily unavailable.
  await cache.addAll(CRITICAL_PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
  const optional = PRECACHE.filter((url) => !CRITICAL_PRECACHE.includes(url));
  await Promise.allSettled(optional.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
}

async function purgeRetiredCitySurfaceCss(cacheKeys = []) {
  const ownedRuntimeCaches = cacheKeys.filter((key) => key === SHELL_CACHE || key === ASSET_CACHE || key === PAGE_CACHE || isReplaceableRuntimeCacheName(key));
  let removed = 0;
  for (const key of ownedRuntimeCaches) {
    if (isOfflinePackCacheName(key) || key === OFFLINE_META_CACHE || key === PERSISTENT_CITY_ASSET_CACHE) continue;
    try {
      const cache = await caches.open(key);
      const requests = await cache.keys();
      await Promise.all(requests.filter((request) => {
        try { return new URL(request.url).pathname.startsWith('/assets/css/eon-city-play'); } catch { return false; }
      }).map(async (request) => { if (await cache.delete(request)) removed += 1; }));
    } catch {}
  }
  return removed;
}

sw.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precacheReleaseShell();
    await notifyClients({ type: 'EONAPP_SW_UPDATE_WAITING', releaseId: RELEASE_ID, sourceRevision: RELEASE_SOURCE_REVISION, cityRuntimeProvenance: CITY_RUNTIME_PROVENANCE, requiresUserReloadChoice: true, controlledCitySurfaceRecovery: true });
  })());
});

sw.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const cityAssetMigration = await migrateLegacyCityAssetCaches(keys);
    const activeOfflinePack = await readActiveOfflinePackState({ fresh: true });
    const removedCitySurfaceCss = await purgeRetiredCitySurfaceCss(keys);
    const obsoleteOwnedKeys = keys.filter((key) => isReplaceableRuntimeCacheName(key) && !CURRENT_EONAPP_CACHES.has(key));
    const staleStagingKeys = keys.filter((key) => isReplaceableStagingCacheName(key));
    await Promise.all([...obsoleteOwnedKeys, ...staleStagingKeys].map((key) => caches.delete(key)));
    await sw.clients.claim();
    await notifyClients({
      type: 'EONAPP_SW_ACTIVATED',
      releaseId: RELEASE_ID,
      sourceRevision: RELEASE_SOURCE_REVISION,
      cityRuntimeProvenance: CITY_RUNTIME_PROVENANCE,
      deletedOwnedCaches: obsoleteOwnedKeys.length + staleStagingKeys.length,
      deletedReplaceableRuntimeCaches: obsoleteOwnedKeys.length,
      deletedStaleStagingCaches: staleStagingKeys.length,
      migratedLegacyCityAssetCaches: cityAssetMigration.legacyCaches,
      migratedLegacyCityAssetEntries: cityAssetMigration.migratedEntries,
      deletedLegacyCityAssetCaches: cityAssetMigration.deletedLegacyCaches,
      preservedLegacyCityAssetCaches: cityAssetMigration.preservedLegacyCaches,
      removedCitySurfaceCss,
      cityShellCache: CITY_SHELL_CACHE,
      persistentCityAssetCache: PERSISTENT_CITY_ASSET_CACHE,
      activeOfflinePackPreserved: Boolean(activeOfflinePack?.cacheName),
      durableOfflineCachesPreservedDuringActivation: keys.filter((key) => isDurableOfflineCacheName(key)).length,
      protectedBrowserDatabasesTouched: false,
      offlinePacks: activeOfflinePack?.packs || [],
      unknownCachesPreserved: true,
      reloadRequired: true,
      automaticCityNavigation: false
    });
    // W766IR2-0: activation never navigates or reloads an open City tab. The
    // PWA manager keeps apply-update and reload-now as two separate, explicit
    // user choices so a menu/map action cannot be mistaken for a release boot.
  })());
});

sw.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Loopback Local AI stays browser-to-device. It is never cached, proxied,
  // queued or rewritten by the EONAPP service worker, including while offline.
  if (isLoopbackUrl(url)) return;
  if (url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiNetworkOnly(event));
    return;
  }
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    const pathname = url.pathname.toLowerCase();
    if (LEGACY_CITY_NAVIGATION_PATHS.has(pathname)) {
      event.respondWith(Promise.resolve(Response.redirect(new URL('/eoncity', sw.location.origin).toString(), 302)));
      return;
    }
    event.respondWith(isNoStoreNavigationPath(pathname) ? navigationNetworkOnly(event) : navigationNetworkFirst(event));
    return;
  }
  if (isCityRuntimeReleaseCachePath(url.pathname)) {
    event.respondWith(cityRuntimeReleaseCacheFirst(event));
    return;
  }
  if (isPersistentContentHashedCityAsset(url.pathname) && !url.search && !hasSensitiveQuery(url)) {
    event.respondWith(persistentCityAssetCacheFirst(event));
    return;
  }
  if (NETWORK_ONLY_STATIC_PATHS.has(url.pathname) || hasSensitiveQuery(url)) {
    event.respondWith(staticNetworkOnly(event));
    return;
  }
  if (isStaticAsset(url.pathname)) event.respondWith(staticCacheFirst(event));
});

sw.addEventListener('message', (event) => {
  const type = String(event.data?.type || '');
  if (type === 'EONAPP_RELEASE_ID_REQUEST') {
    const response = { type: 'EONAPP_SW_RELEASE_ID', releaseId: RELEASE_ID, sourceRevision: RELEASE_SOURCE_REVISION, cityRuntimeProvenance: CITY_RUNTIME_PROVENANCE };
    try { (event.ports?.[0] || event.source)?.postMessage?.(response); } catch {}
    return;
  }
  if (type === 'EON_CITY_ASSET_CACHE_STATUS_REQUEST') {
    event.waitUntil((async () => {
      const status = await inspectPersistentCityAssetCache();
      const response = { type: 'EON_CITY_ASSET_CACHE_STATUS', ...status };
      try { (event.ports?.[0] || event.source)?.postMessage?.(response); } catch {}
    })());
    return;
  }
  if (type === 'EONAPP_CITY_ASSET_CACHE_PRUNE') {
    event.waitUntil((async () => {
      const result = await prunePersistentCityAssetCache({
        protectedUrls: event.data?.protectedUrls,
        explicitUserAction: event.data?.explicitUserAction === true,
        storagePressure: event.data?.storagePressure === true
      });
      try { (event.ports?.[0] || event.source)?.postMessage?.({ type: 'EONAPP_CITY_ASSET_CACHE_PRUNE_RESULT', ...result }); } catch {}
    })());
    return;
  }
  if (type === 'EONAPP_OFFLINE_PACK_STATUS_REQUEST') {
    event.waitUntil((async () => {
      const status = await inspectOfflinePackStatus();
      const response = { type: 'EONAPP_OFFLINE_PACK_STATUS', ...status };
      try { (event.ports?.[0] || event.source)?.postMessage?.(response); } catch {}
    })());
    return;
  }
  if (type === 'EONAPP_OFFLINE_PACK_INSTALL') {
    event.waitUntil((async () => {
      try {
        const result = await installOfflinePack({ packs: event.data?.packs, explicitUserAction: event.data?.explicitUserAction === true });
        try { (event.ports?.[0] || event.source)?.postMessage?.({ type: 'EONAPP_OFFLINE_PACK_INSTALL_RESULT', ok: true, ...result.status }); } catch {}
      } catch (error) {
        try { (event.ports?.[0] || event.source)?.postMessage?.({ type: 'EONAPP_OFFLINE_PACK_INSTALL_RESULT', ok: false, error: String(error?.message || error || 'offline-pack-install-failed') }); } catch {}
      }
    })());
    return;
  }
  if (type === 'EONAPP_OFFLINE_PACK_UNINSTALL') {
    event.waitUntil((async () => {
      try {
        const result = await uninstallOfflinePack({ explicitUserAction: event.data?.explicitUserAction === true });
        try { (event.ports?.[0] || event.source)?.postMessage?.({ type: 'EONAPP_OFFLINE_PACK_UNINSTALL_RESULT', ok: true, ...result.status }); } catch {}
      } catch (error) {
        try { (event.ports?.[0] || event.source)?.postMessage?.({ type: 'EONAPP_OFFLINE_PACK_UNINSTALL_RESULT', ok: false, error: String(error?.message || error || 'offline-pack-uninstall-failed') }); } catch {}
      }
    })());
    return;
  }
  if (type === 'EONAPP_APPLY_UPDATE' && event.data?.releaseId === RELEASE_ID && event.data?.explicitUserAction === true) {
    event.waitUntil((async () => { await sw.skipWaiting(); })());
    return;
  }
  // Compatibility with older UI shells is safe only when the waiting worker
  // release identity is explicitly supplied and matches this worker.
  if (type === 'SKIP_WAITING' && event.data?.releaseId === RELEASE_ID && event.data?.explicitUserAction === true) {
    event.waitUntil((async () => { await sw.skipWaiting(); })());
  }
});

const EON_NOTIFICATION_SAFE_PATHS = new Set([
  '/', '/create', '/projects', '/library', '/workspace', '/forge', '/eoncity',
  '/insights', '/automations', '/profile', '/vault', '/capsule', '/local-ai',
  '/realm-studio', '/settings', '/help', '/status', '/billing', '/eon-keys', '/referral'
]);
const EON_NOTIFICATION_SECRET_LIKE = /(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)/i;
function safePushText(value = '', max = 240) {
  // Sanitization deliberately strips control characters from push payload metadata.
  // eslint-disable-next-line no-control-regex
  const clean = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return EON_NOTIFICATION_SECRET_LIKE.test(clean) ? '' : clean;
}
function safePushRoute(value = '/') {
  const raw = String(value || '/').trim().slice(0, 300);
  // Reject control characters and backslashes before parsing a push return route.
  // eslint-disable-next-line no-control-regex
  if (!raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(raw)) return '/';
  try {
    const parsed = new URL(raw, sw.location.origin);
    if (parsed.origin !== sw.location.origin || !EON_NOTIFICATION_SAFE_PATHS.has(parsed.pathname)) return '/';
    return `${parsed.pathname}${parsed.search || ''}${parsed.hash || ''}`.slice(0, 300);
  } catch { return '/'; }
}

sw.addEventListener('push', (event) => {
  const fallback = { title: 'EONAPP', body: 'A requested EONAPP service alert is ready to review.', url: '/' };
  let raw = {};
  try { raw = event.data?.json?.() || {}; } catch { raw = {}; }
  const title = safePushText(raw?.title, 96) || fallback.title;
  const body = safePushText(raw?.body, 220) || fallback.body;
  const url = safePushRoute(raw?.route || raw?.url || fallback.url);
  const tag = safePushText(raw?.tag, 80).replace(/[^a-z0-9._:-]/gi, '-') || 'eonapp-service-alert';
  event.waitUntil(sw.registration.showNotification(title, {
    body,
    icon: '/assets/img/icons/icon-192.png',
    badge: '/assets/img/icons/icon-192.png',
    tag,
    renotify: false,
    data: { url, eonSchema: 'eonapp.device-notification-delivery.ai-v2.v1' }
  }));
});

sw.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = safePushRoute(event.notification.data?.url || '/');
  const targetUrl = new URL(targetPath, sw.location.origin).href;
  event.waitUntil(sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const exact = clients.find((client) => {
      try { return new URL(client.url).href === targetUrl; } catch { return false; }
    });
    if (exact?.focus) return exact.focus();
    const sameOrigin = clients.find((client) => {
      try { return new URL(client.url).origin === sw.location.origin; } catch { return false; }
    });
    if (sameOrigin?.navigate) {
      try { await sameOrigin.navigate(targetUrl); return sameOrigin.focus?.(); } catch {}
    }
    return sw.clients.openWindow?.(targetUrl);
  }));
});
