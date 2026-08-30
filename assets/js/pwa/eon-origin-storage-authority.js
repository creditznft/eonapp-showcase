/** A15 I22 — browser-origin storage classification. No record values are read. */
export const EON_ORIGIN_STORAGE_AUTHORITY_SCHEMA = 'eonapp.origin-storage-authority.a15.i22.v1';
export const EON_REPLACEABLE_CACHE_PREFIXES = Object.freeze(['eonapp-shell-', 'eonapp-assets-', 'eonapp-pages-', 'eonapp-offline-staging-']);
export const EON_DURABLE_OFFLINE_CACHE_PREFIXES = Object.freeze(['eonapp-city-assets-', 'eonapp-offline-meta-', 'eonapp-offline-pack-']);
const freeze = Object.freeze;

export function classifyEonOriginCache(name = '') {
  const value = String(name || '');
  if (EON_REPLACEABLE_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix))) return 'replaceable-cache';
  if (EON_DURABLE_OFFLINE_CACHE_PREFIXES.some((prefix) => value.startsWith(prefix))) return 'durable-offline-cache';
  return 'unowned-cache';
}

export async function inspectEonOriginStorage({ caches = globalThis.caches, indexedDb = globalThis.indexedDB } = {}) {
  let cacheNames = [];
  let databaseNames = [];
  try { cacheNames = typeof caches?.keys === 'function' ? await caches.keys() : []; } catch {}
  try { databaseNames = typeof indexedDb?.databases === 'function' ? (await indexedDb.databases()).map((row) => String(row?.name || '')).filter(Boolean) : []; } catch {}
  const cacheClasses = cacheNames.map((name) => freeze({ name: String(name), classification: classifyEonOriginCache(name) }));
  return freeze({
    schema: EON_ORIGIN_STORAGE_AUTHORITY_SCHEMA,
    valuesIncluded: false,
    cacheClasses: freeze(cacheClasses),
    replaceableCacheCount: cacheClasses.filter((row) => row.classification === 'replaceable-cache').length,
    durableOfflineCacheCount: cacheClasses.filter((row) => row.classification === 'durable-offline-cache').length,
    unownedCacheCount: cacheClasses.filter((row) => row.classification === 'unowned-cache').length,
    protectedDatabaseCount: databaseNames.length,
    serviceWorkerMayDeleteProtectedDatabases: false,
    activationMayDeleteDurableOfflineCaches: false,
    explicitOfflineUninstallMayDeleteActivePack: true
  });
}

export function getEonOriginStorageTruth() {
  return freeze({
    schema: EON_ORIGIN_STORAGE_AUTHORITY_SCHEMA,
    serviceWorkerSourceGenerated: true,
    serviceWorkerMayReadUserRecordValues: false,
    serviceWorkerMayDeleteProtectedDatabases: false,
    activationDeletesReplaceableCachesOnly: true,
    durableOfflinePackRemovalRequiresExplicitUserAction: true,
    unknownCachesPreserved: true
  });
}
