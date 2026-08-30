/**
 * gateway-fallback.js
 * Shared helpers for route health, fallback gateway selection, and resilient referral URLs.
 */

const STORE_CONFIG = 'eon:fallback:config:v1';
const STORE_HEALTH = 'eon:fallback:health:v1';
const STORE_RELEASE_REGISTRY = 'eon:fallback:release-registry:v1';

const /** @type {any} */
DEFAULT_CONFIG = {
  canonicalBaseUrl: 'https://eonapp.ch',
  referralBaseUrl: 'https://hub.eonapp.ch',
  fallbackSnapshotBaseUrl: 'https://arweave.net',
  fallbackTxId: '',
  gatewayAllowlist: [
    'https://arweave.net',
    'https://arweave.live',
    'https://ar-io.net'
  ],
  primaryHeartbeatPaths: ['/healthz', '/robots.txt', '/favicon.ico'],
  healthPath: '/favicon.ico',
  healthTimeoutMs: 3500
};

function _safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(String(raw || ''));
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function _toUrl(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    return new URL(String(raw || ''), fallback).toString();
  } catch {
    return String(fallback || '');
  }
}

export function getFallbackConfig() {
  const fromStorage = _safeParse(localStorage.getItem(STORE_CONFIG), {});
  const fromWindow = (/** @type {any} */ (window)).__EON_FALLBACK_CONFIG__ || {};
  const /** @type {any} */
merged = {
    ...DEFAULT_CONFIG,
    ...fromStorage,
    ...fromWindow
  };
  return {
    ...merged,
    canonicalBaseUrl: _toUrl(merged.canonicalBaseUrl, window.location.origin),
    referralBaseUrl: _toUrl(merged.referralBaseUrl, merged.canonicalBaseUrl || window.location.origin),
    fallbackSnapshotBaseUrl: _toUrl(merged.fallbackSnapshotBaseUrl, 'https://arweave.net'),
    gatewayAllowlist: Array.isArray(merged.gatewayAllowlist) && merged.gatewayAllowlist.length
      ? merged.gatewayAllowlist
      : DEFAULT_CONFIG.gatewayAllowlist,
    primaryHeartbeatPaths: Array.isArray(merged.primaryHeartbeatPaths) && merged.primaryHeartbeatPaths.length
      ? merged.primaryHeartbeatPaths.map((/** @type {any} */ item) => String(item || '').trim()).filter(Boolean)
      : DEFAULT_CONFIG.primaryHeartbeatPaths,
    healthTimeoutMs: Math.max(1000, Number(merged.healthTimeoutMs || DEFAULT_CONFIG.healthTimeoutMs))
  };
}

export function setFallbackConfig(/** @type {any} */ patch = {}) {
  const current = getFallbackConfig();
  const /** @type {any} */
merged = {
    ...current,
    ...(patch && typeof patch === 'object' ? patch : {})
  };

  if (Array.isArray(merged.gatewayAllowlist)) {
    merged.gatewayAllowlist = merged.gatewayAllowlist
      .map((/** @type {any} */ item) => String(item || '').trim())
      .filter(Boolean)
      .map((/** @type {any} */ item) => item.replace(/\/$/, ''));
  }

  try {
    localStorage.setItem(STORE_CONFIG, JSON.stringify(merged));
  } catch {}
  return merged;
}

export function clearFallbackConfig() {
  try { localStorage.removeItem(STORE_CONFIG); } catch {}
  return getFallbackConfig();
}

export function updateFallbackSnapshotTxId(/** @type {any} */ txId = '', /** @type {any} */ meta = {}) {
  const normalized = String(txId || '').trim();
  const next = setFallbackConfig({ fallbackTxId: normalized });

  if (normalized) {
    const registry = _safeParse(localStorage.getItem(STORE_RELEASE_REGISTRY), []);
    const rows = Array.isArray(registry) ? registry : [];
    rows.unshift({
      txId: normalized,
      ts: Date.now(),
      note: String(meta.note || '').slice(0, 220),
      source: String(meta.source || 'operator')
    });
    try {
      localStorage.setItem(STORE_RELEASE_REGISTRY, JSON.stringify(rows.slice(0, 80)));
    } catch {}
  }

  return next;
}

export function getFallbackReleaseRegistry() {
  const rows = _safeParse(localStorage.getItem(STORE_RELEASE_REGISTRY), []);
  return Array.isArray(rows) ? rows : [];
}

function _timeout(/** @type {any} */ ms) {
  return new Promise((/** @type {any} */ _, /** @type {any} */ reject) => {
    setTimeout(() => reject(new Error('timeout')), ms);
  });
}

async function _probe(/** @type {any} */ url, /** @type {any} */ timeoutMs) {
  const startedAt = performance.now();
  const abortController = new AbortController();
  let timer = 0;
  try {
    timer = window.setTimeout(() => abortController.abort(), timeoutMs);
    await Promise.race([
      fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: abortController.signal }),
      _timeout(timeoutMs)
    ]);
    const durationMs = Math.round(performance.now() - startedAt);
    return { ok: true, url, durationMs, error: '' };
  } catch (/** @type {any} */
error) {
    const durationMs = Math.round(performance.now() - startedAt);
    return {
      ok: false,
      url,
      durationMs,
      error: String((/** @type {Error} */ (error)).message || 'probe failed')
    };
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

async function _probeFirstHealthy(/** @type {any} */ candidates, /** @type {any} */ timeoutMs) {
  const /** @type {any} */
attempts = [];
  for (const /** @type {any} */
candidate of candidates) {
    const row = await _probe(candidate, timeoutMs);
    attempts.push(row);
    if (row.ok) {
      return {
        ok: true,
        winner: candidate,
        attempts
      };
    }
  }

  return {
    ok: false,
    winner: '',
    attempts
  };
}

function _normalizePath(/** @type {any} */ pathLike = '/favicon.ico') {
  const raw = String(pathLike || '').trim();
  if (!raw) return '/favicon.ico';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function _buildSnapshotUrl(/** @type {any} */ config) {
  const tx = String(config.fallbackTxId || '').trim();
  if (!tx) return '';
  return `${String(config.fallbackSnapshotBaseUrl || 'https://arweave.net').replace(/\/$/, '')}/${encodeURIComponent(tx)}`;
}

export async function checkRouteHealth() {
  const config = getFallbackConfig();
  const canonicalBase = config.canonicalBaseUrl.replace(/\/$/, '');
  const heartbeatPaths = Array.from(new Set([
    ...((Array.isArray(config.primaryHeartbeatPaths) ? config.primaryHeartbeatPaths : []).map((/** @type {any} */ item) => _normalizePath(item))),
    _normalizePath(config.healthPath || '/favicon.ico')
  ])).slice(0, 6);

  const primaryCandidates = heartbeatPaths.map((/** @type {any} */ path) => `${canonicalBase}${path}`);
  const primaryProbe = await _probeFirstHealthy(primaryCandidates, config.healthTimeoutMs);
  const primaryHealthy = primaryProbe.ok;

  let gateway = '';
  const /** @type {any} */
gatewayProbeDetails = [];
  for (const /** @type {any} */
base of config.gatewayAllowlist) {
    const cleanBase = String(base).replace(/\/$/, '');
    const /** @type {any} */
gatewayCandidates = [cleanBase];
    if (config.fallbackTxId) {
      gatewayCandidates.unshift(`${cleanBase}/${encodeURIComponent(String(config.fallbackTxId))}`);
    }

    const gatewayProbe = await _probeFirstHealthy(gatewayCandidates, config.healthTimeoutMs);
    gatewayProbeDetails.push({
      gateway: cleanBase,
      ok: gatewayProbe.ok,
      winner: gatewayProbe.winner,
      attempts: gatewayProbe.attempts
    });

    if (gatewayProbe.ok) {
      gateway = String(base).replace(/\/$/, '');
      break;
    }
  }

  const /** @type {any} */
health = {
    checkedAt: new Date().toISOString(),
    probeVersion: 'heartbeat-v2',
    primaryHealthy,
    healthyGateway: gateway,
    fallbackSnapshotUrl: _buildSnapshotUrl(config),
    canonicalBaseUrl: config.canonicalBaseUrl,
    primaryProbe: {
      heartbeatPaths,
      winner: primaryProbe.winner,
      attempts: primaryProbe.attempts
    },
    gatewayProbeDetails
  };

  try {
    localStorage.setItem(STORE_HEALTH, JSON.stringify(health));
  } catch {}

  return health;
}

export function getCachedRouteHealth(/** @type {any} */ maxAgeMs = 5 * 60 * 1000) {
  const cached = _safeParse(localStorage.getItem(STORE_HEALTH), null);
  if (!cached || !cached.checkedAt) return null;
  const age = Date.now() - Date.parse(String(cached.checkedAt));
  if (!Number.isFinite(age) || age > maxAgeMs) return null;
  return cached;
}

export async function getRouteHealth(/** @type {any} */ options = {}) {
  const maxAgeMs = Number((/** @type {any} */ (options)).maxAgeMs || 5 * 60 * 1000);
  const cached = getCachedRouteHealth(maxAgeMs);
  if (cached) return cached;
  return checkRouteHealth();
}

/**
 * Deprecated W212 compatibility helper. It intentionally does not construct
 * a referral URL from a code, query string, alias, or old route. Public shares
 * must be created asynchronously through generateInviteLink/createRealmShareLink
 * so that they contain a signed eon2/eon3 proof. Returning the neutral landing
 * page is safer than reviving a centrally-resolved legacy link.
 */
export function buildResilientReferralUrl(_options = {}) {
  const config = getFallbackConfig();
  try { return new URL('/r/', config.canonicalBaseUrl).toString(); } catch { return 'https://eonapp.ch/r/'; }
}

export function parseIncomingReferralRoute(/** @type {any} */ locationLike = window.location) {
  const url = new URL(String(locationLike.href || window.location.href));
  const legacyRoute = /^\/(?:r|m)(?:\/|$)/i.test(url.pathname)
    || ['r', 'ref', 'vref', 'referral', 'nonce', 'trail'].some((key) => url.searchParams.has(key));
  return {
    // W212/W215: only referral.html may read a signed eon2/eon3 fragment.
    // This helper deliberately never rebuilds a raw query referral route.
    isRouteLink: false,
    isLegacyRoute: legacyRoute,
    refCode: '',
    fromId: '',
    nonce: '',
    exp: '',
    route: legacyRoute ? 'legacy-route-retired' : 'none',
    realmSlug: '',
    sourceUrl: `${url.origin}${url.pathname}`
  };
}

export async function resolveReferralRouteTarget(_parsed = null) {
  // Signed fragments are verified locally by referral.html. Old short-path or
  // query routes are intentionally not reconstructed or forwarded.
  return null;
}
