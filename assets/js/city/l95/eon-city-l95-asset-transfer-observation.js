/**
 * L95 browser-local transfer observation for immutable EON City art.
 *
 * This does not claim whether a zero-transfer response came specifically from
 * CacheStorage, the HTTP cache, memory cache, or another browser-local reuse
 * layer. It combines Resource Timing with the already-inspected persistent City
 * cache to separate observed network transfer from local reuse without remote
 * telemetry.
 */
import { isImmutableEonCityAssetPath } from '../eon-city-asset-cache-policy.js';

export const EON_CITY_L95_ASSET_TRANSFER_OBSERVATION_SCHEMA = 'eon.city.asset-transfer-observation.l95.v1';
const freeze = (value) => Object.freeze(value);

function pathnameOf(value = '', baseUrl = 'https://eonapp.invalid/') {
  try { return new URL(String(value || ''), baseUrl).pathname; } catch { return ''; }
}

function finiteBytes(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function normalizeResourceEntry(entry, baseUrl) {
  const pathname = pathnameOf(entry?.name || '', baseUrl);
  if (!isImmutableEonCityAssetPath(pathname)) return null;
  const transferSize = finiteBytes(entry?.transferSize);
  const encodedBodySize = finiteBytes(entry?.encodedBodySize);
  const decodedBodySize = finiteBytes(entry?.decodedBodySize);
  const deliveryType = String(entry?.deliveryType || '').trim().toLowerCase();
  const localReuseSignal = transferSize === 0 && (encodedBodySize > 0 || decodedBodySize > 0 || /cache|local/.test(deliveryType));
  return freeze({
    pathname,
    transferSize,
    encodedBodySize,
    decodedBodySize,
    durationMs: Math.max(0, Number(entry?.duration || 0)),
    workerStart: Math.max(0, Number(entry?.workerStart || 0)),
    deliveryType,
    networkTransferObserved: transferSize > 0,
    localReuseSignal
  });
}

export function buildEonCityL95AssetTransferObservation({ resourceEntries = [], cacheStatus = {}, baseUrl = 'https://eonapp.invalid/' } = {}) {
  const cachedPaths = new Set((Array.isArray(cacheStatus?.cachedPaths) ? cacheStatus.cachedPaths : []).map((value) => pathnameOf(value, baseUrl)).filter(Boolean));
  const normalized = (Array.isArray(resourceEntries) ? resourceEntries : [])
    .map((entry) => normalizeResourceEntry(entry, baseUrl))
    .filter(Boolean);
  const byPath = new Map();
  for (const entry of normalized) {
    if (!byPath.has(entry.pathname)) byPath.set(entry.pathname, []);
    byPath.get(entry.pathname).push(entry);
  }

  const assets = [...byPath.entries()].map(([pathname, entries]) => {
    const networkRequests = entries.filter((entry) => entry.networkTransferObserved);
    const localReuseRequests = entries.filter((entry) => entry.localReuseSignal);
    const transferBytes = networkRequests.reduce((total, entry) => total + entry.transferSize, 0);
    const cachedBeforeSession = cachedPaths.has(pathname);
    const serviceWorkerObserved = entries.some((entry) => entry.workerStart > 0);
    const delivery = networkRequests.length > 0
      ? 'network-transfer-observed'
      : cachedBeforeSession && entries.length > 0
        ? 'saved-browser-cache-reuse-observed'
        : localReuseRequests.length > 0
          ? 'browser-local-reuse-observed'
          : 'resource-timing-observed-no-transfer-size';
    return freeze({
      pathname,
      requestCount: entries.length,
      networkRequestCount: networkRequests.length,
      localReuseRequestCount: localReuseRequests.length,
      transferBytes,
      encodedBodyBytes: Math.max(0, ...entries.map((entry) => entry.encodedBodySize)),
      decodedBodyBytes: Math.max(0, ...entries.map((entry) => entry.decodedBodySize)),
      cachedBeforeSession,
      serviceWorkerObserved,
      delivery
    });
  });

  const observedPaths = new Set(assets.map((asset) => asset.pathname));
  const cachedButNotObserved = [...cachedPaths].filter((path) => isImmutableEonCityAssetPath(path) && !observedPaths.has(path));
  const networkTransferAssets = assets.filter((asset) => asset.networkRequestCount > 0);
  const reuseOnlyAssets = assets.filter((asset) => asset.networkRequestCount === 0 && (asset.localReuseRequestCount > 0 || asset.cachedBeforeSession));
  const totalTransferBytes = networkTransferAssets.reduce((total, asset) => total + asset.transferBytes, 0);

  const sessionProfile = cachedPaths.size > 0
    ? (networkTransferAssets.length === 0 ? 'warm-reuse-observed' : 'mixed-reuse-and-network')
    : (networkTransferAssets.length > 0 ? 'cold-or-cache-empty-network-observed' : 'cache-empty-no-transfer-observed');

  return freeze({
    schema: EON_CITY_L95_ASSET_TRANSFER_OBSERVATION_SCHEMA,
    sessionProfile,
    observedAssetCount: assets.length,
    resourceRequestCount: normalized.length,
    networkTransferAssetCount: networkTransferAssets.length,
    networkRequestCount: assets.reduce((total, asset) => total + asset.networkRequestCount, 0),
    localReuseOnlyAssetCount: reuseOnlyAssets.length,
    cachedBeforeSessionAssetCount: assets.filter((asset) => asset.cachedBeforeSession).length,
    serviceWorkerObservedAssetCount: assets.filter((asset) => asset.serviceWorkerObserved).length,
    persistentCacheEntryCount: Math.max(0, Number(cacheStatus?.cachedEntries || cachedPaths.size || 0)),
    cachedButNotObservedCount: cachedButNotObserved.length,
    totalTransferBytes,
    assets: freeze(assets),
    cachedButNotObserved: freeze(cachedButNotObserved),
    truth: freeze({
      localOnly: true,
      remoteTelemetry: false,
      zeroTransferDoesNotClaimSpecificCacheLayer: true,
      cacheStorageEvictionRemainsBrowserControlled: true,
      resourceTimingIsSupportingEvidenceNotNetworkCertification: true
    })
  });
}

export function observeEonCityL95AssetTransfer({ performanceRef = globalThis.performance, cacheStatus = {}, baseUrl = globalThis.location?.href || 'https://eonapp.invalid/' } = {}) {
  let resourceEntries = [];
  try { resourceEntries = performanceRef?.getEntriesByType?.('resource') || []; } catch {}
  return buildEonCityL95AssetTransferObservation({ resourceEntries, cacheStatus, baseUrl });
}

export function describeEonCityL95AssetTransferObservation(observation = {}) {
  const observed = Math.max(0, Number(observation?.observedAssetCount || 0));
  const network = Math.max(0, Number(observation?.networkTransferAssetCount || 0));
  const reused = Math.max(0, Number(observation?.localReuseOnlyAssetCount || 0));
  const bytes = Math.max(0, Number(observation?.totalTransferBytes || 0));
  const saved = Math.max(0, Number(observation?.persistentCacheEntryCount || 0));
  if (observed === 0) return `${saved} immutable City art file${saved === 1 ? '' : 's'} saved; no City-art Resource Timing entries observed yet.`;
  return `${observed} immutable City art source${observed === 1 ? '' : 's'} observed this session · ${reused} reused without observed network transfer · ${network} with network transfer · ${Math.round(bytes / 1024)} KB observed transfer · ${saved} saved in the persistent City cache.`;
}

export default freeze({
  EON_CITY_L95_ASSET_TRANSFER_OBSERVATION_SCHEMA,
  buildEonCityL95AssetTransferObservation,
  observeEonCityL95AssetTransfer,
  describeEonCityL95AssetTransferObservation
});
