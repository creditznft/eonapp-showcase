/**
 * W766IR2-D — persistent browser-side cache policy for content-addressed EON City art.
 *
 * The City uses content-hashed, same-origin static URLs. The service worker
 * stores those immutable responses in a cache name that does not include the
 * application release ID, so an app-shell update does not discard unchanged
 * GLBs. This module exposes only local storage/cache status; it never reads or
 * writes project, Vault, identity, provider, chat, or account values.
 */
export const EON_CITY_ASSET_CACHE_SCHEMA = 'eon.city.asset-cache.w766ir2-d.v1';
export const EON_CITY_PERSISTENT_CACHE_NAME = 'eonapp-city-assets-v1';
export const EON_CITY_ASSET_PATH_PREFIX = '/assets/city/';
export const EON_CITY_ASSET_CACHE_ENTRY_LIMIT = null;
export const EON_CITY_ASSET_CACHE_RETENTION = 'content-addressed-browser-managed';
export const EON_CITY_RELEASE_SHELL_CACHE_PREFIX = 'eonapp-city-shell-';

const HASHED_CITY_ASSET_PATTERNS = Object.freeze([
  /^\/assets\/city\/immutable\/(?:[a-z0-9._-]+\/){0,8}[a-z0-9._-]+\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i,
  /^\/assets\/city\/w[a-z0-9-]+\/(?:[a-z0-9_-]+\/){1,4}[a-z0-9_-]+\.[a-f0-9]{12}\.(?:glb|gltf|bin|webp|ktx2)$/i
]);
const freeze = (value) => Object.freeze(value);

export function isImmutableEonCityAssetPath(value = '') {
  const raw = String(value || '').trim();
  if (!raw || raw.includes('?') || raw.includes('#') || raw.includes('\\')) return false;
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
  } catch { return false; }
  return HASHED_CITY_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
}

function normalizeEstimate(value = {}) {
  const usage = Number(value?.usage || 0);
  const quota = Number(value?.quota || 0);
  return freeze({
    usageBytes: Number.isFinite(usage) && usage > 0 ? Math.floor(usage) : 0,
    quotaBytes: Number.isFinite(quota) && quota > 0 ? Math.floor(quota) : 0,
    usageRatio: quota > 0 && usage >= 0 ? Math.min(1, Math.max(0, usage / quota)) : null
  });
}

async function readCachedCityShellEntries(cachesRef) {
  if (!cachesRef || typeof cachesRef.keys !== 'function' || typeof cachesRef.open !== 'function') return freeze({ shellCacheSupported: false, cachedShellEntries: 0, shellCacheName: '' });
  try {
    const names = await cachesRef.keys();
    const shellCacheName = [...names].reverse().find((name) => String(name || '').startsWith(EON_CITY_RELEASE_SHELL_CACHE_PREFIX)) || '';
    if (!shellCacheName) return freeze({ shellCacheSupported: true, cachedShellEntries: 0, shellCacheName: '' });
    const cache = await cachesRef.open(shellCacheName);
    const keys = typeof cache?.keys === 'function' ? await cache.keys() : [];
    return freeze({ shellCacheSupported: true, cachedShellEntries: keys.length, shellCacheName });
  } catch {
    return freeze({ shellCacheSupported: true, cachedShellEntries: 0, shellCacheName: '', shellInspectionFailed: true });
  }
}

async function readCachedCityEntries(cachesRef) {
  if (!cachesRef || typeof cachesRef.open !== 'function') return freeze({ supported: false, cachedEntries: 0, cachedPaths: freeze([]) });
  try {
    if (typeof cachesRef.has === 'function' && !(await cachesRef.has(EON_CITY_PERSISTENT_CACHE_NAME))) {
      return freeze({ supported: true, cachedEntries: 0, cachedPaths: freeze([]) });
    }
    const cache = await cachesRef.open(EON_CITY_PERSISTENT_CACHE_NAME);
    const requests = typeof cache?.keys === 'function' ? await cache.keys() : [];
    const cachedPaths = requests
      .map((request) => {
        try { return new URL(request?.url || String(request || ''), 'https://eonapp.invalid').pathname; }
        catch { return ''; }
      })
      .filter((pathname) => isImmutableEonCityAssetPath(pathname));
    return freeze({ supported: true, cachedEntries: cachedPaths.length, cachedPaths: freeze([...cachedPaths]) });
  } catch {
    return freeze({ supported: true, cachedEntries: 0, cachedPaths: freeze([]), inspectionFailed: true });
  }
}

/**
 * Inspect and optionally request best-effort persistent storage after City
 * access is authorized. Browser persistence is never guaranteed; denial does
 * not block City and does not remove already cached files.
 */
export async function inspectEonCityAssetCache({
  navigatorRef = globalThis.navigator,
  cachesRef = globalThis.caches,
  requestPersistence = false
} = {}) {
  const storage = navigatorRef?.storage || null;
  let persistedBefore = false;
  let persisted = false;
  let persistenceRequested = false;
  let persistenceGranted = false;
  let estimate = normalizeEstimate();

  if (storage) {
    try { persistedBefore = typeof storage.persisted === 'function' ? await storage.persisted() === true : false; } catch {}
    persisted = persistedBefore;
    if (!persisted && requestPersistence === true && typeof storage.persist === 'function') {
      persistenceRequested = true;
      try { persistenceGranted = await storage.persist() === true; } catch {}
      persisted = persistenceGranted || persistedBefore;
    }
    if (typeof storage.estimate === 'function') {
      try { estimate = normalizeEstimate(await storage.estimate()); } catch {}
    }
  }

  const [cache, shell] = await Promise.all([readCachedCityEntries(cachesRef), readCachedCityShellEntries(cachesRef)]);
  return freeze({
    schema: EON_CITY_ASSET_CACHE_SCHEMA,
    cacheName: EON_CITY_PERSISTENT_CACHE_NAME,
    pathPrefix: EON_CITY_ASSET_PATH_PREFIX,
    contentHashedUrls: true,
    releaseStableCacheName: true,
    cacheFirstAfterFirstDownload: true,
    appUpdatePreservesUnchangedAssets: true,
    logoutPreservesAssets: true,
    lazyDistrictLoading: true,
    changedAssetsUseNewUrls: true,
    unchangedAssetsAvoidNetworkAfterCacheHit: true,
    storageManagerSupported: Boolean(storage),
    cacheStorageSupported: cache.supported,
    persistedBefore,
    persisted,
    persistenceRequested,
    persistenceGranted,
    cachedEntries: cache.cachedEntries,
    cachedPaths: cache.cachedPaths,
    cacheInspectionFailed: cache.inspectionFailed === true,
    shellCacheSupported: shell.shellCacheSupported,
    shellCacheName: shell.shellCacheName,
    cachedShellEntries: shell.cachedShellEntries,
    shellInspectionFailed: shell.shellInspectionFailed === true,
    maxManagedEntries: EON_CITY_ASSET_CACHE_ENTRY_LIMIT,
    manualEntryEviction: false,
    retentionPolicy: EON_CITY_ASSET_CACHE_RETENTION,
    usageBytes: estimate.usageBytes,
    quotaBytes: estimate.quotaBytes,
    usageRatio: estimate.usageRatio,
    userDataRead: false,
    userDataWritten: false,
    privateDataIncluded: false,
    guarantee: 'best-effort-browser-storage-subject-to-browser-eviction'
  });
}

export function isEonCityAssetPathCached(status = {}, value = '') {
  const raw = String(value || '').trim();
  if (!raw) return false;
  let pathname = raw;
  try { pathname = new URL(raw, 'https://eonapp.invalid').pathname; } catch {}
  return Array.isArray(status?.cachedPaths) && status.cachedPaths.some((entry) => String(entry || '') === pathname);
}

export function describeEonCityAssetCacheStatus(status = {}) {
  const cachedEntries = Math.max(0, Number(status?.cachedEntries || 0));
  const cachedShellEntries = Math.max(0, Number(status?.cachedShellEntries || 0));
  if (cachedEntries > 0 || cachedShellEntries > 0) {
    const art = cachedEntries > 0 ? `${cachedEntries} saved City art file${cachedEntries === 1 ? '' : 's'}` : 'no saved City art yet';
    const shell = cachedShellEntries > 0 ? `${cachedShellEntries} saved runtime file${cachedShellEntries === 1 ? '' : 's'} for this release` : 'runtime shell not saved yet';
    return `${art}; ${shell}. Unchanged files are restored from this browser before any network transfer.`;
  }
  if (status?.cacheStorageSupported === false) {
    return 'This browser does not expose managed Cache Storage. Standard HTTP caching may still reuse unchanged content-hashed City assets.';
  }
  return 'No saved City art is available yet. Each district will be cached on this device as it is opened; the whole City is not downloaded at once.';
}

export default freeze({
  EON_CITY_ASSET_CACHE_SCHEMA,
  EON_CITY_PERSISTENT_CACHE_NAME,
  EON_CITY_ASSET_PATH_PREFIX,
  EON_CITY_ASSET_CACHE_ENTRY_LIMIT,
  EON_CITY_ASSET_CACHE_RETENTION,
  EON_CITY_RELEASE_SHELL_CACHE_PREFIX,
  isImmutableEonCityAssetPath,
  isEonCityAssetPathCached,
  inspectEonCityAssetCache,
  describeEonCityAssetCacheStatus
});
