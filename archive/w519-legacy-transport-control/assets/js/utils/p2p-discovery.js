/**
 * P2P Offer Discovery — GunDB-based
 * ====================================
 * Adapted from eonpackage's PureP2PSwapService_V5.ts + P2PStorageSystem.ts
 *
 * Architecture:
 * - GunDB loaded lazily from CDN (no npm, no build step)
 * - Multiple public relay peers for resilience (same multi-gateway philosophy as eonpackage's IPFS failover)
 * - Falls back to local-only IndexedDB mode when all relays unreachable
 * - Trust anchored to SIGNED OFFER CODES (not to GunDB data integrity)
 *   → Anyone can read GunDB, but only valid signed codes can be redeemed
 * - Offers expire after 7 days (TTL enforced client-side on read)
 * - Per-UID rate limit: max 20 active offers in the namespace
 * - No wallet required — uses EONAPP UID as pseudonymous identity
 *
 * Key difference from eonpackage:
 * - eonpackage uses IPFS PubSub (Node.js/libp2p, not browser-native)
 * - EONAPP.CH uses GunDB which is browser-native, CDN-loadable, and relay-optional
 * - The SIGNED CODE system already provides the cryptographic trust layer
 *   GunDB provides only the BROADCAST / DISCOVERY layer
 *
 * Self-hosting a relay (zero cost, 100% decentralized):
 *   npm install -g gun && gun --port 8765
 *   Then add the relay URL in setCustomRelayPeers()
 *
 * @module utils/p2p-discovery
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const GUN_CDN_URL = 'https://cdn.jsdelivr.net/npm/gun/gun.js';
const GUN_CDN_SRI = 'sha384-kbwmlcfKNZA6XzoIlQUaH+9lLpNh5TWrzzDmSlCpY48SEs49CCDQs50Q6x2xAl4v';
const GUN_NAMESPACE = 'eonapp-swap-offers-v1';

// Community relay peers — GunDB is designed to work with ANY subset of these alive
// Users / operators can add their own relay via setCustomRelayPeers()
const /** @type {any} */
DEFAULT_RELAY_PEERS = [
  'https://relay.peer.ooo/gun',
  'https://peer.wallie.io/gun'
];

const OFFER_TTL_MS    = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_OFFERS_PER_UID = 20;
const MAX_BROWSE_RESULTS  = 200;
const MAX_BROWSE_RESULTS_PER_UID = 5;
const MAX_RELAY_RETRIES   = 5;
const BASE_RELAY_DELAY_MS = 1000;
const MAX_RELAY_DELAY_MS  = 30000;
const appWin = /** @type {any} */ (window);

// ─── Module state ─────────────────────────────────────────────────────────────

/** @type {any} */
let _gun = null;
/** @type {Promise<any> | null} */
let _gunLoadPromise = null;
/** @type {string[]} */
let /** @type {any} */
_customRelayPeers = [];
let _isOnline = false; // tracks whether any relay connected
/** @type {Error | null} */
let _loadError = null;

function _showRelayFallbackMessage(/** @type {any} */ message) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (!body) return;
  const id = 'eon-discovery-relay-fallback';
  /** @type {HTMLElement | null} */
let /** @type {any} */
banner = document.getElementById(id);
  if (!banner) {
    banner = document.createElement('div');
    banner.id = id;
    banner.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;padding:10px 12px;border-radius:10px;background:#2a1a1a;color:#ffd7d7;font-size:12px;line-height:1.35;box-shadow:0 10px 24px rgba(0,0,0,.35)';
    body.appendChild(banner);
  }
  banner.textContent = message;
}

function normalizeRelayPeer(/** @type {any} */ url) {
  try {
    const parsed = new URL(String(url || '').trim());
    const host = parsed.hostname.toLowerCase();
    const isLocalHttp = parsed.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1');
    if (parsed.protocol !== 'https:' && !isLocalHttp) return '';
    if (parsed.username || parsed.password) return '';
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

// ─── GunDB loader ─────────────────────────────────────────────────────────────

/**
 * Override the relay peer list before any Gun operations.
 * Call this before publishOffer() or browseOffers() to use custom/self-hosted relays.
 * @param {string[]} peers - Array of Gun relay URLs (wss:// or https://)
 */
export function setCustomRelayPeers(/** @type {any} */ peers) {
  if (!Array.isArray(peers)) return;
  const /** @type {any} */
unique = [];
  const /** @type {any} */
seen = new Set();
  peers.forEach((/** @type {any} */ peer) => {
    const normalized = normalizeRelayPeer(peer);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });
  _customRelayPeers = unique.slice(0, 12);
}

function _getRelayPeers() {
  return _customRelayPeers.length > 0 ? _customRelayPeers : DEFAULT_RELAY_PEERS;
}

async function _loadGunScript() {
  if (typeof window === 'undefined') throw new Error('GunDB requires a browser environment.');
  if (appWin.Gun) return appWin.Gun;

  return new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    const /** @type {any} */
script = document.createElement('script');
    script.src = GUN_CDN_URL;
  script.integrity = GUN_CDN_SRI;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (appWin.Gun) {
        resolve(appWin.Gun);
      } else {
        reject(new Error('GunDB script loaded but window.Gun is undefined.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load GunDB from CDN. Check network connectivity.'));
    document.head.appendChild(script);
  });
}

export async function _getGun() {
  if (_gun) return _gun;
  if (_gunLoadPromise) return _gunLoadPromise;

  _gunLoadPromise = (async () => {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RELAY_RETRIES; attempt += 1) {
      try {
        const Gun = await _loadGunScript();
        const peers = _getRelayPeers();
        _gun = Gun({ peers, localStorage: false, radisk: false });

        // Track relay connectivity
        _gun.on('hi', () => { _isOnline = true; });
        _gun.on('bye', () => { /* remain online if other peers still connected */ });

        return _gun;
      } catch (/** @type {Error | unknown} */
error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RELAY_RETRIES - 1) {
          const delay = Math.min(MAX_RELAY_DELAY_MS, BASE_RELAY_DELAY_MS * (2 ** attempt));
          await new Promise((/** @type {(value: void) => void} */ resolve) => setTimeout(resolve, delay));
        }
      }
    }
    _loadError = lastError || new Error('Discovery relay connection failed.');
    _showRelayFallbackMessage('P2P discovery relays are unavailable. Showing local cached offers only.');
    _gunLoadPromise = null;
    throw _loadError;
  })();

  return _gunLoadPromise;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _isExpired(/** @type {any} */ offer) {
  if (!offer || !offer.createdAt) return true;
  return (offer.createdAt + OFFER_TTL_MS) < Date.now();
}

function _isValidOffer(/** @type {any} */ offer) {
  if (!offer || typeof offer !== 'object') return false;
  if (typeof offer.offerId !== 'string' || !offer.offerId) return false;
  if (typeof offer.offerCode !== 'string' || !offer.offerCode) return false;
  if (typeof offer.uid !== 'string' || !offer.uid) return false;
  if (offer.status !== 'open') return false;
  if (_isExpired(offer)) return false;
  return true;
}

function _sanitizeOffer(/** @type {any} */ raw) {
  // Only allow known fields through — never pass raw GunDB metadata to UI
  return {
    offerId:          String(raw.offerId || '').slice(0, 120),
    offerCode:        String(raw.offerCode || '').slice(0, 4096),
    uid:              String(raw.uid || '').slice(0, 80),
    offeredItemName:  String(raw.offeredItemName || '').slice(0, 80),
    offeredItemRarity:String(raw.offeredItemRarity || '').slice(0, 20),
    wantedRarity:     String(raw.wantedRarity || '').slice(0, 20),
    wantedCategory:   String(raw.wantedCategory || '').slice(0, 40),
    priceEon:         Number(raw.priceEon) || 0,
    status:           String(raw.status || 'open').slice(0, 20),
    createdAt:        Number(raw.createdAt) || 0,
    expiresAt:        Number(raw.createdAt || 0) + OFFER_TTL_MS
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Publish a swap offer to the P2P discovery network.
 * The offer code itself is the trust anchor — GunDB only provides discovery.
 *
 * @param {any} offer
 * @returns {Promise<{ ok: boolean, offerId: string, mode: 'p2p'|'local-only', relayOnline: boolean }>}
 */
export async function publishOffer(/** @type {any} */ offer) {
  if (!offer || typeof offer !== 'object') throw new Error('Invalid offer object.');
  if (!offer.offerId || !offer.offerCode || !offer.uid) {
    throw new Error('offerId, offerCode, and uid are required.');
  }

  const /** @type {any} */
record = {
    offerId:           String(offer.offerId).slice(0, 120),
    offerCode:         String(offer.offerCode).slice(0, 4096),
    uid:               String(offer.uid).slice(0, 80),
    offeredItemName:   String(offer.offeredItemName || '').slice(0, 80),
    offeredItemRarity: String(offer.offeredItemRarity || '').slice(0, 20),
    wantedRarity:      String(offer.wantedRarity || '').slice(0, 20),
    wantedCategory:    String(offer.wantedCategory || '').slice(0, 40),
    priceEon:          Number(offer.priceEon) || 0,
    status:            'open',
    createdAt:         Date.now(),
    _v:                1
  };

  // Store locally first (always succeeds)
  _storeLocalOffer(record);

  // Attempt P2P broadcast
  /** @type {'p2p'|'local-only'} */
  let mode = 'local-only';
  try {
    const gun = await _getGun();
    gun.get(GUN_NAMESPACE).get(record.offerId).put(record);
    mode = 'p2p';
  } catch {
    // Graceful degradation — offer is still in local cache
  }

  return { ok: true, offerId: record.offerId, mode, relayOnline: _isOnline };
}

/**
 * Update an offer's status to 'withdrawn' in the P2P network.
 * @param {string} offerId
 */
export async function withdrawOffer(/** @type {any} */ offerId) {
  if (!offerId) throw new Error('offerId is required.');
  _removeLocalOffer(offerId);
  try {
    const gun = await _getGun();
    gun.get(GUN_NAMESPACE).get(offerId).put({
      status: 'withdrawn',
      withdrawnAt: Date.now()
    });
  } catch { /* best-effort */ }
  return { ok: true, offerId };
}

/**
 * Mark an offer as accepted (called by the taker after accepting).
 * @param {string} offerId
 * @param {{ acceptorUid?: string }} meta
 */
export async function markOfferAccepted(/** @type {any} */ offerId, /** @type {any} */ meta = {}) {
  if (!offerId) throw new Error('offerId is required.');
  _removeLocalOffer(offerId);
  try {
    const gun = await _getGun();
    gun.get(GUN_NAMESPACE).get(offerId).put({
      status: 'accepted',
      acceptedAt: Date.now(),
      acceptorUid: String(meta.acceptorUid || '').slice(0, 80)
    });
  } catch { /* best-effort */ }
  return { ok: true, offerId };
}

/**
 * Browse live swap offers from the P2P network.
 * Merges GunDB live stream with local cache.
 * Calls `onOffer(offer)` for each valid, non-expired offer seen.
 * Returns a cleanup function — call it to stop listening.
 *
 * @param {any} filters
 * @param {(offer: object) => void} onOffer
 * @returns {Promise<() => void>} cleanup function
 */
export async function browseOffers(/** @type {any} */ filters = {}, /** @type {any} */ onOffer) {
  if (typeof onOffer !== 'function') throw new Error('onOffer callback is required.');
  const /** @type {any} */
seen = new Set();
  const /** @type {any} */
perUidCounts = new Map();
  let stopped = false;
  const /** @type {any} */
count = { value: 0 };

  function _emit(/** @type {any} */ raw) {
    if (stopped) return;
    if (!raw || !raw.offerId || seen.has(raw.offerId)) return;
    if (count.value >= MAX_BROWSE_RESULTS) return;
    const offer = _sanitizeOffer(raw);
    if (!_isValidOffer(offer)) return;
    if (filters.wantedRarity && offer.wantedRarity !== filters.wantedRarity) return;
    if (filters.wantedCategory && offer.wantedCategory !== filters.wantedCategory) return;
    if (filters.excludeUid && offer.uid === filters.excludeUid) return;
    const uidCount = perUidCounts.get(offer.uid) || 0;
    if (uidCount >= MAX_BROWSE_RESULTS_PER_UID) return;
    seen.add(offer.offerId);
    perUidCounts.set(offer.uid, uidCount + 1);
    count.value += 1;
    onOffer(offer);
  }

  // Emit from local cache first (instant, offline-capable)
  for (const /** @type {any} */
offer of _getLocalOffers()) {
    _emit(offer);
  }

  // Subscribe to P2P network (live updates)
  let unsubP2P = null;
  try {
    const gun = await _getGun();
    gun.get(GUN_NAMESPACE).map().on(function handler(/** @type {any} */ data) {
      if (stopped) return;
      _emit(data);
    });
    unsubP2P = () => {
      // GunDB off() — unsubscribe all handlers on this node
      gun.get(GUN_NAMESPACE).map().off();
    };
  } catch {
    // P2P unavailable — local cache is the fallback
  }

  return function cleanup() {
    stopped = true;
    try { unsubP2P?.(); } catch { /* ignore */ }
  };
}

/**
 * Returns true if GunDB loaded and at least one relay responded.
 */
export function isP2POnline() {
  return _gun !== null && _isOnline;
}

/**
 * Returns the last GunDB load error, if any.
 */
export function getP2PLoadError() {
  return _loadError ? _loadError.message : null;
}

// ─── Local offer cache (IndexedDB-backed for persistence) ─────────────────────

const LOCAL_OFFERS_KEY = 'eon:p2p-offers-cache:v1';
const LOCAL_OFFERS_MAX = 500;

/** @typedef {{ offerId: string; uid: string; createdAt: number; status: string; [key: string]: unknown }} Offer */

/** @return {Record<string, Offer>} */
function _loadLocalOffers() {
  try {
    const raw = localStorage.getItem(LOCAL_OFFERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** @param {Record<string, Offer>} map */
function _saveLocalOffers(/** @type {any} */ map) {
  try {
    localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(map));
  } catch { /* quota exceeded — best effort */ }
}

/** @param {Offer} offer */
function _storeLocalOffer(/** @type {any} */ offer) {
  const map = _loadLocalOffers();
  // Enforce max + evict expired
  const ids = Object.keys(map);
  for (const /** @type {any} */
id of ids) {
    if (_isExpired(map[id]) || map[id].status !== 'open') delete map[id];
  }
  // Enforce per-UID rate limit
  const byUid = Object.values(map).filter((/** @type {any} */ o) => o.uid === offer.uid);
  if (byUid.length >= MAX_OFFERS_PER_UID) {
    // Remove oldest offer from this UID
    byUid.sort((/** @type {any} */ a, /** @type {any} */ b) => a.createdAt - b.createdAt);
    delete map[byUid[0].offerId];
  }
  // Enforce global cap
  if (Object.keys(map).length >= LOCAL_OFFERS_MAX) {
    const sorted = Object.values(map).sort((/** @type {any} */ a, /** @type {any} */ b) => a.createdAt - b.createdAt);
    delete map[sorted[0].offerId];
  }
  map[offer.offerId] = offer;
  _saveLocalOffers(map);
}

function _removeLocalOffer(/** @type {any} */ offerId) {
  const map = _loadLocalOffers();
  delete map[offerId];
  _saveLocalOffers(map);
}

function _getLocalOffers() {
  const map = _loadLocalOffers();
  return Object.values(map).filter((/** @type {any} */ o) => o.status === 'open' && !_isExpired(o));
}

// ─── Preference persistence ───────────────────────────────────────────────────

const P2P_PREF_KEY = 'eon:p2p-discovery-enabled:v1';

export function isP2PDiscoveryEnabled() {
  try {
    return localStorage.getItem(P2P_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setP2PDiscoveryEnabled(/** @type {any} */ enabled) {
  try {
    localStorage.setItem(P2P_PREF_KEY, enabled ? 'true' : 'false');
  } catch { /* ignore */ }
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

/**
 * Returns a status snapshot for the P2P discovery layer.
 */
export function getP2PStatus() {
  const localCount = _getLocalOffers().length;
  return {
    gunLoaded: _gun !== null,
    relayOnline: _isOnline,
    relayPeers: _getRelayPeers(),
    loadError: _loadError ? _loadError.message : null,
    localCacheCount: localCount,
    discoveryEnabled: isP2PDiscoveryEnabled()
  };
}
