/**
 * IPFS Loot Gateway Client — 21-Gateway Failover
 * ================================================
 * Fetches ERC-1155 loot token metadata from IPFS/IPNS using 21 public gateways.
 * Races all gateways in parallel and returns from the fastest responding one.
 * Blacklists failed gateways for 5 minutes to avoid retrying known-dead endpoints.
 *
 * EONAPP.CH IPNS Key : eonapp-ch-site-key
 * IPNS Key ID        : k2k4r8lu0s69o8w5xalwwnlcnr7pdyfvxeimp81rohru4zc5gxzmiktd
 * Loot metadata path : /loot/{tokenId}.json  (under the EONAPP.CH IPNS tree)
 *
 * Usage (browser):
 *   <script src="scripts/ipfsLootGatewayClient.js"></script>
 *   const metadata = await window.ipfsLootClient.fetchTokenMetadata(1);
 *
 * Usage (Node.js / build tools):
 *   const { createLootGatewayClient } = require('./scripts/ipfsLootGatewayClient.js');
 *   const client = createLootGatewayClient();
 *   const metadata = await client.fetchTokenMetadata(1);
 */

'use strict';

// ─── EONAPP.CH IPNS KEY ──────────────────────────────────────────────────────
// This is the dedicated EONAPP.CH key. DO NOT use the eonpackage key.
// eonpackage key (k2k4r8p9xf...) is for the main EON Platform app only.
const EONAPP_IPNS_KEY = 'k2k4r8lu0s69o8w5xalwwnlcnr7pdyfvxeimp81rohru4zc5gxzmiktd';

// ─── 21-GATEWAY LIST ─────────────────────────────────────────────────────────
// Ordered by priority. The client races all in parallel; order matters only for
// tiebreaking when multiple respond within the same ms window.
//
// Format: each entry is either:
//   { base: '<prefix>', suffix: '/loot/${id}.json' }         ← path-style IPNS
//   { base: '<subdomain-prefix>', suffix: '/loot/${id}.json' } ← subdomain-style IPNS
//   { base: 'https://eonapp.ch/loot', suffix: '/${id}.json' } ← HTTPS fallback

function buildGatewayList(ipnsKey) {
  const K = ipnsKey;
  return [
    // ── PRIORITY 1: Protocol Labs official (most reliable) ──────────────────
    {
      name: 'dweb.link path',
      url: (id) => `https://dweb.link/ipns/${K}/loot/${id}.json`,
      group: 'protocol-labs',
    },
    {
      name: 'ipfs.io path',
      url: (id) => `https://ipfs.io/ipns/${K}/loot/${id}.json`,
      group: 'protocol-labs',
    },

    // ── PRIORITY 2: Subdomain-format IPNS ───────────────────────────────────
    {
      name: 'dweb.link subdomain',
      url: (id) => `https://${K}.ipns.dweb.link/loot/${id}.json`,
      group: 'subdomain',
    },
    {
      name: 'flk-ipfs.io subdomain',
      url: (id) => `https://${K}.ipns.flk-ipfs.io/loot/${id}.json`,
      group: 'subdomain',
    },
    {
      name: 'w3s.link subdomain',
      url: (id) => `https://${K}.ipns.w3s.link/loot/${id}.json`,
      group: 'subdomain',
    },

    // ── PRIORITY 3: Major pinning services ──────────────────────────────────
    {
      name: 'pinata',
      url: (id) => `https://gateway.pinata.cloud/ipns/${K}/loot/${id}.json`,
      group: 'pinning',
    },
    {
      name: 'w3s.link path',
      url: (id) => `https://w3s.link/ipns/${K}/loot/${id}.json`,
      group: 'pinning',
    },
    {
      name: 'nftstorage.link',
      url: (id) => `https://nftstorage.link/ipns/${K}/loot/${id}.json`,
      group: 'pinning',
    },

    // ── PRIORITY 4: Decentralized / international ────────────────────────────
    {
      name: '4everland',
      url: (id) => `https://4everland.io/ipns/${K}/loot/${id}.json`,
      group: 'decentralized',
    },
    {
      name: 'fleek',
      url: (id) => `https://flk-ipfs.io/ipns/${K}/loot/${id}.json`,
      group: 'decentralized',
    },
    {
      name: 'aragon',
      url: (id) => `https://ipfs.eth.aragon.network/ipns/${K}/loot/${id}.json`,
      group: 'decentralized',
    },
    {
      name: 'jorropo',
      url: (id) => `https://jorropo.net/ipns/${K}/loot/${id}.json`,
      group: 'decentralized',
    },

    // ── PRIORITY 5: Additional public gateways ───────────────────────────────
    {
      name: 'fission',
      url: (id) => `https://ipfs.runfission.com/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'best-practice.se',
      url: (id) => `https://ipfs.best-practice.se/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'joaoleitao',
      url: (id) => `https://ipfs.joaoleitao.org/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'via0',
      url: (id) => `https://via0.com/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'imonu',
      url: (id) => `https://ipfs.imonu.com/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'jpu.jp',
      url: (id) => `https://ipfs.jpu.jp/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'hardbin',
      url: (id) => `https://hardbin.com/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },
    {
      name: 'storry',
      url: (id) => `https://storry.tv/ipns/${K}/loot/${id}.json`,
      group: 'public',
    },

    // ── PRIORITY 6: HTTPS fallback (ad-network approved, no IPFS required) ──
    // This is always available as long as eonapp.ch is live.
    // If ALL IPFS gateways fail, the app still works via this fallback.
    {
      name: 'eonapp.ch',
      url: (id) => `https://eonapp.ch/loot/${id}.json`,
      group: 'https-fallback',
    },
  ];
}

function normalizeIpfsUri(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/^ipfs:\/\//i, 'ipfs://');
}

function parseIpfsUri(value) {
  const normalized = normalizeIpfsUri(value);
  if (!normalized.startsWith('ipfs://')) {
    return null;
  }

  const withoutScheme = normalized.slice('ipfs://'.length);
  const firstSlash = withoutScheme.indexOf('/');
  if (firstSlash === -1) {
    return { cid: withoutScheme, path: '' };
  }

  return {
    cid: withoutScheme.slice(0, firstSlash),
    path: withoutScheme.slice(firstSlash),
  };
}

function buildIpfsGatewayUrls(gateways, ipfsUri) {
  const parsed = parseIpfsUri(ipfsUri);
  if (!parsed || !parsed.cid) {
    return [];
  }

  const ipfsHosts = [
    ['dweb.link ipfs', 'protocol-labs', 'https://dweb.link'],
    ['ipfs.io ipfs', 'protocol-labs', 'https://ipfs.io'],
    ['pinata ipfs', 'pinning', 'https://gateway.pinata.cloud'],
    ['w3s.link ipfs', 'pinning', 'https://w3s.link'],
    ['nftstorage ipfs', 'pinning', 'https://nftstorage.link'],
    ['4everland ipfs', 'decentralized', 'https://4everland.io'],
    ['fleek ipfs', 'decentralized', 'https://flk-ipfs.io'],
    ['aragon ipfs', 'decentralized', 'https://ipfs.eth.aragon.network'],
    ['jorropo ipfs', 'decentralized', 'https://jorropo.net'],
    ['fission ipfs', 'public', 'https://ipfs.runfission.com'],
    ['best-practice ipfs', 'public', 'https://ipfs.best-practice.se'],
    ['joaoleitao ipfs', 'public', 'https://ipfs.joaoleitao.org'],
    ['via0 ipfs', 'public', 'https://via0.com'],
    ['imonu ipfs', 'public', 'https://ipfs.imonu.com'],
    ['jpu ipfs', 'public', 'https://ipfs.jpu.jp'],
    ['hardbin ipfs', 'public', 'https://hardbin.com'],
    ['storry ipfs', 'public', 'https://storry.tv'],
  ];

  return ipfsHosts.map(([name, group, base]) => ({
    name,
    group,
    url: `${base}/ipfs/${parsed.cid}${parsed.path}`,
  }));
}

function toHttpCandidates(value, gateways, ipnsKey) {
  const normalized = String(value || '').trim();
  if (!normalized) return [];
  if (/^https?:\/\//i.test(normalized)) return [normalized];
  if (/^ipfs:\/\//i.test(normalized)) {
    return buildIpfsGatewayUrls(gateways, normalized).map((gateway) => gateway.url);
  }
  if (/^ipns:\/\//i.test(normalized)) {
    const tokenPath = normalized.slice('ipns://'.length).replace(/^\/+/, '');
    return buildGatewayList(ipnsKey)
      .filter((gateway) => gateway.group !== 'https-fallback')
      .map((gateway) => gateway.url(tokenPath.replace(/\.json$/i, '')));
  }
  return [];
}

// ─── HEALTH TRACKING ─────────────────────────────────────────────────────────
const BLACKLIST_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const GATEWAY_TIMEOUT_MS    = 5000;           // 5s per gateway
const MAX_CONSECUTIVE_FAILS = 3;

class GatewayHealth {
  constructor() {
    this._map = new Map(); // name → { failures, successes, blacklistedUntil, avgLatency }
  }

  _get(name) {
    if (!this._map.has(name)) {
      this._map.set(name, {
        failures: 0,
        successes: 0,
        blacklistedUntil: 0,
        avgLatency: Infinity,
      });
    }
    return this._map.get(name);
  }

  isBlacklisted(name) {
    return this._get(name).blacklistedUntil > Date.now();
  }

  recordSuccess(name, latencyMs) {
    const h = this._get(name);
    h.failures = 0;
    h.successes++;
    h.avgLatency = h.avgLatency === Infinity
      ? latencyMs
      : Math.round((h.avgLatency * 0.8) + (latencyMs * 0.2));
    h.blacklistedUntil = 0;
  }

  recordFailure(name) {
    const h = this._get(name);
    h.failures++;
    if (h.failures >= MAX_CONSECUTIVE_FAILS) {
      h.blacklistedUntil = Date.now() + BLACKLIST_DURATION_MS;
    }
  }

  getStats() {
    const result = {};
    for (const [name, h] of this._map) {
      result[name] = { ...h, blacklisted: this.isBlacklisted(name) };
    }
    return result;
  }
}

// ─── SIMPLE IN-MEMORY CACHE ──────────────────────────────────────────────────
class MetadataCache {
  constructor(ttlMs = 10 * 60 * 1000) { // 10 min default TTL
    this._map = new Map();
    this._ttl = ttlMs;
  }

  get(key) {
    const entry = this._map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._map.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value) {
    this._map.set(key, { value, expiresAt: Date.now() + this._ttl });
  }
}

// ─── GATEWAY CLIENT ──────────────────────────────────────────────────────────
function createLootGatewayClient(options = {}) {
  const gateways = buildGatewayList(options.ipnsKey || EONAPP_IPNS_KEY);
  const health   = new GatewayHealth();
  const cache    = new MetadataCache(options.cacheTtlMs);
  const timeout  = options.timeoutMs || GATEWAY_TIMEOUT_MS;

  /**
   * Fetch JSON metadata for a loot token ID.
   * Races all non-blacklisted gateways and returns from the fastest.
   *
   * @param {number|string} tokenId  — token ID (decimal integer)
   * @returns {Promise<object>}      — ERC-1155 metadata JSON
   */
  async function fetchTokenMetadata(tokenId) {
    const id = String(tokenId);
    const cacheKey = `loot:${id}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const active = gateways.filter(g => !health.isBlacklisted(g.name));
    if (active.length === 0) {
      // All gateways blacklisted — try HTTPS fallback unconditionally
      const fallback = gateways.find(g => g.group === 'https-fallback');
      if (fallback) {
        return fetchOne(fallback, id, cacheKey);
      }
      throw new Error('All IPFS gateways are currently unavailable. Try again shortly.');
    }

    return raceAll(
      active.map((gateway) => ({
        name: gateway.name,
        group: gateway.group,
        url: gateway.url(id),
      })),
      cacheKey
    );
  }

  /**
   * Fetch JSON metadata from an immutable ipfs:// URI.
   *
   * @param {string} ipfsUri
   * @returns {Promise<{ data: object, gateway: string, url: string }>} 
   */
  async function fetchIpfsMetadata(ipfsUri) {
    const normalized = normalizeIpfsUri(ipfsUri);
    const cacheKey = `ipfs:${normalized}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const candidates = buildIpfsGatewayUrls(gateways, normalized)
      .filter((gateway) => !health.isBlacklisted(gateway.name));

    if (candidates.length === 0) {
      throw new Error('All IPFS gateways are currently unavailable. Try again shortly.');
    }

    return raceAll(candidates, cacheKey);
  }

  /**
   * Fetch metadata from either an ipfs:// URI or a tokenId resolved through the IPNS tree.
   *
   * @param {{ ipfsUri?: string, tokenId?: number|string }} request
   * @returns {Promise<{ data: object, gateway: string, url: string }>}
   */
  async function fetchMetadata(request = {}) {
    if (request.ipfsUri) {
      return fetchIpfsMetadata(request.ipfsUri);
    }
    if (request.tokenId !== undefined && request.tokenId !== null) {
      return fetchTokenMetadata(request.tokenId);
    }
    throw new Error('fetchMetadata requires either ipfsUri or tokenId');
  }

  /**
   * Race all active gateways in parallel.
   * Returns the first successful JSON response.
   */
  async function raceAll(activeGateways, cacheKey) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let remaining = activeGateways.length;

      const settle = (value, error) => {
        if (settled) return;
        if (value) {
          settled = true;
          resolve(value);
        } else {
          remaining--;
          if (remaining === 0) {
            reject(error || new Error('All gateways failed'));
          }
        }
      };

      for (const gateway of activeGateways) {
        fetchOne(gateway, cacheKey)
          .then(data => settle(data, null))
          .catch(err => settle(null, err));
      }
    });
  }

  /**
   * Fetch from a single gateway with timeout.
   */
  async function fetchOne(gateway, cacheKey) {
    const url = gateway.url;
    const start = Date.now();

    const controller = typeof AbortController !== 'undefined'
      ? new AbortController()
      : null;

    const timer = controller
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const response = await fetch(url, {
        signal: controller ? controller.signal : undefined,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - start;
      const result = {
        data,
        gateway: gateway.name,
        url,
      };

      health.recordSuccess(gateway.name, latency);
      cache.set(cacheKey, result);

      return result;
    } catch (err) {
      clearTimeout(timer);
      health.recordFailure(gateway.name);
      throw err;
    }
  }

  /**
   * Pre-fetch metadata for a list of token IDs (e.g. on page load).
   * Errors are silently swallowed — call fetchTokenMetadata() for individual tokens.
   */
  async function prefetch(tokenIds) {
    await Promise.allSettled(tokenIds.map(id => fetchTokenMetadata(id)));
  }

  /**
   * Get current gateway health statistics.
   */
  function getGatewayStats() {
    return health.getStats();
  }

  /**
   * Manually clear the blacklist (useful after recovering from a network outage).
   */
  function resetBlacklist() {
    for (const g of gateways) {
      const h = health._get(g.name);
      h.failures = 0;
      h.blacklistedUntil = 0;
    }
  }

  return {
    fetchTokenMetadata,
    fetchIpfsMetadata,
    fetchMetadata,
    toHttpCandidates: (value) => toHttpCandidates(value, gateways, options.ipnsKey || EONAPP_IPNS_KEY),
    prefetch,
    getGatewayStats,
    resetBlacklist,
    ipnsKey: options.ipnsKey || EONAPP_IPNS_KEY,
    gateways: gateways.map(g => g.name),
  };
}

// ─── BROWSER GLOBAL ──────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.ipfsLootClient = createLootGatewayClient();
}

// ─── NODE / ESM EXPORTS ──────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createLootGatewayClient, EONAPP_IPNS_KEY };
}
if (typeof globalThis !== 'undefined' && typeof globalThis.exports !== 'undefined') {
  globalThis.exports = { createLootGatewayClient, EONAPP_IPNS_KEY };
}
