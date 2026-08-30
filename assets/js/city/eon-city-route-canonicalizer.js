/**
 * CITY-ROUTE: browser-side canonicalization for the one public Babylon City.
 *
 * Edge redirects handle path aliases, but fragments never reach an edge worker.
 * This module removes legacy City fragments after the canonical document loads
 * without dropping approved query parameters used by visible City missions.
 */
export const EON_CITY_CANONICAL_PATH = '/eoncity';

const LEGACY_CITY_PATHS = new Set([
  '/realm', '/realm/', '/realm.html', '/realmworld', '/realmworld.html', '/team-realm', '/team-realm.html', '/world', '/game', '/games.html',
  '/eoncity.html', '/eoncity/', '/eoncity/tour', '/eoncity/lite', '/eoncity/3d', '/eoncity/play',
  '/eoncity/lite.html', '/eoncity-lite.html', '/eoncity-3d', '/eoncity-3d.html', '/eoncity-play', '/eoncity-play.html'
]);

export function getCanonicalCityUrl(input, base = globalThis.location?.origin || 'https://eonapp.ch') {
  const url = input instanceof URL ? new URL(input.href) : new URL(String(input || EON_CITY_CANONICAL_PATH), base);
  const originalPath = url.pathname.replace(/\/{2,}/g, '/') || '/';
  const normalizedPath = originalPath.length > 1 ? originalPath.replace(/\/$/, '') : originalPath;
  const hadLegacyPath = LEGACY_CITY_PATHS.has(normalizedPath);
  const hadFragment = Boolean(url.hash);
  const isCanonicalPath = normalizedPath === EON_CITY_CANONICAL_PATH;
  const shouldCanonicalize = hadLegacyPath || isCanonicalPath || originalPath === `${EON_CITY_CANONICAL_PATH}/`;

  if (shouldCanonicalize) {
    url.pathname = EON_CITY_CANONICAL_PATH;
    // EON City currently has no public client hash contract. Keeping old hashes
    // makes a fully canonical route look stale and can re-open legacy UI state.
    if (hadFragment) url.hash = '';
  }

  return Object.freeze({
    url,
    changed: shouldCanonicalize && (url.pathname !== originalPath || (hadFragment && !url.hash)),
    hadLegacyPath,
    hadFragment,
    canonicalPath: EON_CITY_CANONICAL_PATH
  });
}

export function canonicalizeCityLocation(locationLike = globalThis.location, historyLike = globalThis.history) {
  if (!locationLike?.href) return Object.freeze({ changed: false, reason: 'location-unavailable', canonicalPath: EON_CITY_CANONICAL_PATH });
  const result = getCanonicalCityUrl(locationLike.href, locationLike.origin);
  const current = new URL(locationLike.href, locationLike.origin);
  const target = `${result.url.pathname}${result.url.search}${result.url.hash}`;
  const currentTarget = `${current.pathname}${current.search}${current.hash}`;
  if (!result.changed || target === currentTarget) {
    return Object.freeze({ changed: false, reason: result.changed ? 'already-canonical' : 'outside-city-route', canonicalPath: EON_CITY_CANONICAL_PATH, target: currentTarget });
  }
  try {
    historyLike?.replaceState?.(historyLike.state ?? null, '', target);
    return Object.freeze({ changed: true, reason: 'legacy-city-url-canonicalized', canonicalPath: EON_CITY_CANONICAL_PATH, target });
  } catch {
    return Object.freeze({ changed: false, reason: 'history-replace-failed', canonicalPath: EON_CITY_CANONICAL_PATH, target });
  }
}
