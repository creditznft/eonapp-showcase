/**
 * R09 — deterministic City cache retention planning.
 *
 * Immutable City art is content-addressed. Normal app updates never prune it.
 * If explicit storage maintenance is requested, only hashes unreferenced by
 * the current, rollback and installed-offline manifests are eligible.
 */
import { isImmutableEonCityAssetPath } from '../eon-city-asset-cache-policy.js';

export const EON_CITY_R09_CACHE_RETENTION_SCHEMA = 'eon.city.cache-retention.r09.v1';
const freeze = (value) => Object.freeze(value);

function pathOf(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try { return new URL(raw, 'https://eonapp.invalid').pathname; } catch { return raw.split(/[?#]/)[0]; }
}

function collectManifestPaths(manifest = null) {
  const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
  return entries.map((entry) => pathOf(entry?.url || entry?.path || '')).filter(isImmutableEonCityAssetPath);
}

export function planEonCityR09CacheRetention({
  cachedPaths = [],
  currentManifest = null,
  rollbackManifest = null,
  offlineManifests = [],
  storagePressure = false,
  explicitUserAction = false
} = {}) {
  const protectedPaths = new Set([
    ...collectManifestPaths(currentManifest),
    ...collectManifestPaths(rollbackManifest),
    ...(Array.isArray(offlineManifests) ? offlineManifests.flatMap(collectManifestPaths) : [])
  ]);
  const cached = [...new Set((Array.isArray(cachedPaths) ? cachedPaths : []).map(pathOf).filter(isImmutableEonCityAssetPath))];
  const mayPrune = storagePressure === true && explicitUserAction === true;
  const deletablePaths = mayPrune ? cached.filter((pathname) => !protectedPaths.has(pathname)) : [];
  return freeze({
    schema: EON_CITY_R09_CACHE_RETENTION_SCHEMA,
    mayPrune,
    manualEntryLimit: null,
    automaticReleasePruning: false,
    currentReleaseProtected: true,
    rollbackProtected: true,
    offlinePackProtected: true,
    protectedPaths: freeze([...protectedPaths].sort()),
    deletablePaths: freeze(deletablePaths.sort()),
    retainedPaths: freeze(cached.filter((pathname) => !deletablePaths.includes(pathname)).sort())
  });
}

export default freeze({ EON_CITY_R09_CACHE_RETENTION_SCHEMA, planEonCityR09CacheRetention });
