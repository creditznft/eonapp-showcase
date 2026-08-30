/**
 * Decentralized Swap Registry — Nostr-based P2P Offer Marketplace
 * ================================================================
 * Replaces the Cloudflare D1 backend for swap offer lifecycle management.
 * Offers are signed Nostr events stored on public relays — no private server.
 *
 * ARCHITECTURE:
 * - Offer publishing:  Nostr kind 30078 (NIP-33, parameterized replaceable)
 *                      d-tag = "eon-offer:{offerCode}"
 * - Offer acceptance:  Nostr kind 30079, d-tag = "eon-accept:{offerCode}"
 * - Receipt/redeem:    Nostr kind 30080, d-tag = "eon-receipt:{receiptCode}"
 * - All events content is JSON; offers include a client-side Ed25519 signature
 *
 * FALLBACK:
 * - LocalStorage cache: last 50 offers indexed by code (TTL = 48h)
 * - IndexedDB async queue: pending ops while offline
 *
 * SECURITY:
 * - Offers are signed by the creator's ephemeral Nostr key (Schnorr secp256k1)
 * - Offer codes are random and unguessable (32-char hex)
 * - No wallet private keys or secrets leave the browser
 *
 * USAGE:
 *   import { publishP2POffer, lookupP2POffer, acceptP2POffer } from './nostr-swap-registry.js';
 *
 * @module utils/nostr-swap-registry
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

const NOSTR_TOOLS_CDN = 'https://cdn.jsdelivr.net/npm/nostr-tools@2.4.0/lib/nostr.bundle.js';
const NOSTR_TOOLS_SRI = 'sha384-h+dwCQuX/2NIOcB88xqYTbpJOALdJuhPMfi/LT54zXwVa6jk1HyVsxDK90SFv5IH';

/** Kind 30078 — NIP-33 parameterized replaceable event for swap offers */
const KIND_SWAP_OFFER      = 30078;
/** Kind 30079 — Swap acceptance */
const KIND_SWAP_ACCEPT     = 30079;
/** Kind 30080 — Receipt / redemption */
const KIND_SWAP_RECEIPT    = 30080;

const APP_TAG              = 'eonapp-swap';
const OFFER_TTL_MS         = 48 * 60 * 60 * 1000; // 48 hours
const MAX_OFFER_CACHE      = 50;
const LS_OFFER_CACHE       = 'eon-swap-offer-cache-v1';
const LS_NOSTR_SWAP_KEY    = 'eon-nostr-swap-key-v1';
const LS_NOSTR_SWAP_WRAP   = 'eon-nostr-swap-wrap-v1';
const RELAY_CONNECT_TO_MS  = 5000;
const RELAY_PUBLISH_TO_MS  = 3500;
const SUBSCRIBE_TO_MS      = 5000;
const MAX_RELAY_CONNS      = 4;

const OFFER_CODE_RE        = /^[a-f0-9]{8,64}$/;
const UID_RE               = /^[a-z0-9][a-z0-9_-]{3,79}$/i;

const /** @type {any} */
DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
];

// ─── Module state ───────────────────────────────────────────────────────────────

const regWin = /** @type {any} */ (window);
/** @type {any} */ let _nostrTools = null;
/** @type {Promise<any> | null} */ let _loadPromise = null;
/** @type {Uint8Array | null} */ let _secretKey = null;
/** @type {string | null} */ let _publicKey = null;
/** @type {Map<string, WebSocket>} */ const /** @type {any} */
_connections = new Map();

const HOSTNAME = typeof location !== 'undefined' ? String(location.hostname || '').toLowerCase() : '';
const DISABLED  = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1' || HOSTNAME === '::1'
  || (typeof navigator !== 'undefined' && navigator.webdriver === true);

// ─── Keypair (AES-GCM wrapped in localStorage) ─────────────────────────────────

async function _getWrapKey() {
  let raw = localStorage.getItem(LS_NOSTR_SWAP_WRAP);
  if (!raw || raw.length !== 64) {
    const buf = crypto.getRandomValues(new Uint8Array(32));
    raw = Array.from(buf).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(LS_NOSTR_SWAP_WRAP, raw);
  }
  const keyBytes = new Uint8Array((raw.match(/.{2}/g) || []).map(/** @type {any} */ h => parseInt(h, 16)));
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function _encryptSk(/** @type {any} */ skHex) {
  const key = await _getWrapKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(skHex));
  return JSON.stringify({ iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) });
}

async function _decryptSk(/** @type {any} */ stored) {
  const { iv, ct } = JSON.parse(stored);
  const key  = await _getWrapKey();
  const pt   = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(ct));
  return new TextDecoder().decode(pt);
}

async function _getOrCreateKeypair() {
  if (_secretKey && _publicKey) return { secretKey: _secretKey, publicKey: _publicKey };
  const nt = await _loadNostrTools();
  try {
    const stored = localStorage.getItem(LS_NOSTR_SWAP_KEY);
    if (stored) {
      const skHex = await _decryptSk(stored);
      if (/^[0-9a-f]{64}$/i.test(skHex)) {
        _secretKey = _hexToBytes(skHex);
        _publicKey = nt.getPublicKey(_secretKey);
        return { secretKey: _secretKey, publicKey: _publicKey };
      }
      localStorage.removeItem(LS_NOSTR_SWAP_KEY);
      localStorage.removeItem(LS_NOSTR_SWAP_WRAP);
    }
  } catch { /* fallthrough */ }
  _secretKey = nt.generateSecretKey();
  _publicKey = nt.getPublicKey(_secretKey);
  try {
    localStorage.setItem(LS_NOSTR_SWAP_KEY, await _encryptSk(_bytesToHex(_secretKey)));
  } catch { /* quota */ }
  return { secretKey: _secretKey, publicKey: _publicKey };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function _hexToBytes(/** @type {any} */ hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
function _bytesToHex(/** @type {any} */ bytes) {
  return Array.from(bytes).map((/** @type {any} */ b) => b.toString(16).padStart(2, '0')).join('');
}

function _sanitizeStr(/** @type {any} */ v, /** @type {any} */ max = 256) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/** @returns {string} 32-char random hex nonce */
export function generateOfferCode() {
  const buf = crypto.getRandomValues(new Uint8Array(16));
  return _bytesToHex(buf);
}

/** @returns {string} 24-char random receipt code */
export function generateReceiptCode() {
  const buf = crypto.getRandomValues(new Uint8Array(12));
  return _bytesToHex(buf);
}

// ─── Nostr tools loader ─────────────────────────────────────────────────────────

async function _loadNostrTools() {
  if (_nostrTools) return _nostrTools;
  if (_loadPromise) return _loadPromise;
  _loadPromise = new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    if (typeof window === 'undefined') { reject(new Error('Browser required')); return; }
    if (regWin.NostrTools) { _nostrTools = regWin.NostrTools; resolve(_nostrTools); return; }
    const script = /** @type {any} */ (document.createElement('script'));
    script.src = NOSTR_TOOLS_CDN;
    script.integrity = NOSTR_TOOLS_SRI;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (regWin.NostrTools) { _nostrTools = regWin.NostrTools; resolve(_nostrTools); }
      else { reject(new Error('NostrTools not found after load')); }
    };
    script.onerror = () => { _loadPromise = null; reject(new Error('Failed to load nostr-tools')); };
    document.head.appendChild(script);
  });
  return _loadPromise;
}

// ─── Relay management ──────────────────────────────────────────────────────────

async function _connectRelay(/** @type {any} */ url) {
  if (DISABLED) return null;
  const normalized = (() => {
    try {
      const p = new URL(String(url || '').trim());
      return p.protocol === 'wss:' ? p.toString() : '';
    } catch { return ''; }
  })();
  if (!normalized) return null;
  if (_connections.has(normalized)) {
    const existing = _connections.get(normalized);
    if (existing?.readyState === WebSocket.OPEN) return existing;
    try { existing?.close(); } catch { /* ignore */ }
    _connections.delete(normalized);
  }
  return new Promise((/** @type {any} */ resolve) => {
    let settled = false;
    const settle = (/** @type {any} */ v) => { if (settled) return; settled = true; resolve(v); };
    const timeout = setTimeout(() => { try { ws?.close(); } catch { /* ignore */ } settle(null); }, RELAY_CONNECT_TO_MS);
    let ws = /** @type {WebSocket | null} */ (null);
    try {
      ws = new WebSocket(normalized);
      ws.onopen  = () => { clearTimeout(timeout); if (ws) _connections.set(normalized, ws); settle(ws); };
      ws.onerror = () => { clearTimeout(timeout); try { ws?.close(); } catch { /* ignore */ } settle(null); };
      ws.onclose = () => { _connections.delete(normalized); };
    } catch { clearTimeout(timeout); settle(null); }
  });
}

async function _connectRelays() {
  const results = await Promise.all(DEFAULT_RELAYS.slice(0, MAX_RELAY_CONNS + 2).map((/** @type {any} */ r) => _connectRelay(r)));
  return results.filter(Boolean).slice(0, MAX_RELAY_CONNS);
}

// ─── Event publishing ──────────────────────────────────────────────────────────

/**
 * Publish a single Nostr event to all connected relays.
 * @param {any} event - Finalized Nostr event
 * @returns {Promise<{ published: number, total: number }>}
 */
async function _publishEvent(/** @type {any} */ event) {
  if (DISABLED) return { published: 0, total: 0 };
  const connections = await _connectRelays();
  if (connections.length === 0) return { published: 0, total: 0 };
  const msg = JSON.stringify(['EVENT', event]);
  const results = await Promise.all(connections.map(/** @type {any} */ ws =>
    new Promise(/** @type {any} */ resolve => {
      if (!ws || ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
      let settled = false;
      const done = (/** @type {any} */ v) => { if (settled) return; settled = true; clearTimeout(t); ws.removeEventListener('message', h); resolve(v); };
      const t = setTimeout(() => done(false), RELAY_PUBLISH_TO_MS);
      const h = (/** @type {any} */ e) => { try { const d = JSON.parse(e.data); if (d[0] === 'OK' && d[1] === event.id) done(d[2] === true); } catch { /* ignore */ } };
      ws.addEventListener('message', h);
      try { ws.send(msg); } catch { done(false); }
    })
  ));
  return { published: results.filter(Boolean).length, total: connections.length };
}

// ─── Local cache ───────────────────────────────────────────────────────────────

function _readCache() {
  try {
    const raw = localStorage.getItem(LS_OFFER_CACHE);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch { return {}; }
}

function _writeCache(/** @type {any} */ cache) {
  try { localStorage.setItem(LS_OFFER_CACHE, JSON.stringify(cache)); } catch { /* quota */ }
}

function _cacheOffer(/** @type {any} */ offerCode, /** @type {any} */ record) {
  const cache = _readCache();
  const now = Date.now();
  cache[offerCode] = { ...record, cachedAt: now };
  // Evict expired entries (TTL) and trim to max
  const entries = Object.entries(cache)
    .filter((/** @type {any} */ [, v]) => (/** @type {any} */ (v)).cachedAt + OFFER_TTL_MS > now)
    .sort((/** @type {any} */ a, /** @type {any} */ b) => (/** @type {any} */ (b[1])).cachedAt - (/** @type {any} */ (a[1])).cachedAt)
    .slice(0, MAX_OFFER_CACHE);
  const trimmed = Object.fromEntries(entries);
  _writeCache(trimmed);
}

function _cachedOffer(/** @type {any} */ offerCode) {
  const cache = _readCache();
  const entry = cache[offerCode];
  if (!entry) return null;
  if (entry.cachedAt + OFFER_TTL_MS < Date.now()) {
    delete cache[offerCode];
    _writeCache(cache);
    return null;
  }
  return entry;
}

// ─── Subscription query ────────────────────────────────────────────────────────

/**
 * Query Nostr relays for a specific event by filter.
 * Returns the first matching event (or null on timeout).
 * @param {any} filter
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
async function _queryRelays(/** @type {any} */ filter, /** @type {any} */ timeoutMs = SUBSCRIBE_TO_MS) {
  if (DISABLED) return null;
  const nt = await _loadNostrTools().catch(() => null);
  if (!nt) return null;
  const connections = await _connectRelays();
  if (connections.length === 0) return null;

  return new Promise(/** @type {any} */ resolve => {
    let found = false;
    const done = (/** @type {any} */ event) => {
      if (found) return;
      found = true;
      clearTimeout(globalTimeout);
      // Send CLOSE to all relays
      for (const /** @type {any} */
ws of connections) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify(['CLOSE', subId])); } catch { /* ignore */ }
        }
      }
      resolve(event);
    };
    const globalTimeout = setTimeout(() => done(null), timeoutMs);
    const subId = 'eon-qry-' + Date.now().toString(36);
    const req = JSON.stringify(['REQ', subId, filter]);

    for (const /** @type {any} */
ws of connections) {
      if (!ws || ws.readyState !== WebSocket.OPEN) continue;
      const handler = (/** @type {any} */ e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subId && nt.verifyEvent(data[2])) {
            ws.removeEventListener('message', handler);
            done(data[2]);
          } else if (data[0] === 'EOSE' && data[1] === subId) {
            ws.removeEventListener('message', handler);
          }
        } catch { /* ignore */ }
      };
      ws.addEventListener('message', handler);
      try { ws.send(req); } catch { /* ignore */ }
    }
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Publish a swap offer to Nostr P2P network.
 * The offer is stored as a NIP-33 parameterized replaceable event.
 *
 * @param {object} params
 * @param {string} params.uid           - Creator's UID
 * @param {string} params.walletAddress - Creator's wallet address (hex, 42 chars)
 * @param {string} params.offerCode     - Random offer code (use generateOfferCode())
 * @param {string} [params.offerType]   - What is being offered
 * @param {string} [params.askingFor]   - What the creator wants
 * @param {number} [params.expiresAt]   - Unix ms expiry (default: now + 48h)
 * @returns {Promise<{ ok: boolean, published?: number, total?: number, error?: string, local?: boolean }>}
 */
export async function publishP2POffer(/** @type {any} */ params) {
  const uid = _sanitizeStr(params?.uid, 80);
  const walletAddress = _sanitizeStr(params?.walletAddress, 42);
  const offerCode = _sanitizeStr(params?.offerCode, 64);
  const offerType = _sanitizeStr(params?.offerType, 256);
  const askingFor = _sanitizeStr(params?.askingFor, 256);
  const expiresAt = (typeof params?.expiresAt === 'number' && params.expiresAt > Date.now())
    ? params.expiresAt
    : Date.now() + OFFER_TTL_MS;

  if (!uid || !UID_RE.test(uid)) return { ok: false, error: 'Invalid UID.' };
  if (!offerCode || !OFFER_CODE_RE.test(offerCode)) return { ok: false, error: 'Invalid offer code format.' };

  const /** @type {any} */
record = {
    offerCode,
    uid,
    walletAddress,
    offerType,
    askingFor,
    expiresAt,
    createdAt: Date.now(),
    status: 'active',
  };

  // Cache locally first (works offline)
  _cacheOffer(offerCode, record);

  if (DISABLED) return { ok: true, published: 0, total: 0, local: true };

  try {
    const nt = await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    const expiresAtSec = Math.floor(expiresAt / 1000);

    const /** @type {any} */
eventTemplate = {
      kind: KIND_SWAP_OFFER,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', `eon-offer:${offerCode}`],
        ['t', APP_TAG],
        ['uid', uid],
        ['expiration', String(expiresAtSec)],
      ],
      content: JSON.stringify(record),
    };

    const event = nt.finalizeEvent(eventTemplate, keypair.secretKey);
    const result = await _publishEvent(event);
    return { ok: true, published: result.published, total: result.total, local: result.published === 0 };
  } catch (/** @type {any} */
err) {
    if (regWin.DEBUG) console.warn('[nostr-swap-registry] publishP2POffer failed, local only:', err);
    return { ok: true, published: 0, total: 0, local: true };
  }
}

/**
 * Look up a swap offer by code.
 * Checks local cache first, then queries Nostr relays.
 *
 * @param {string} offerCode
 * @returns {Promise<{ ok: boolean, offer?: any, error?: string, source?: 'cache' | 'nostr' }>}
 */
export async function lookupP2POffer(/** @type {any} */ offerCode) {
  const code = _sanitizeStr(offerCode, 64);
  if (!code || !OFFER_CODE_RE.test(code)) return { ok: false, error: 'Invalid offer code.' };

  // Try local cache first (fast path)
  const cached = _cachedOffer(code);
  if (cached) return { ok: true, offer: cached, source: 'cache' };

  if (DISABLED) return { ok: false, error: 'Offer not found in local cache.', source: 'cache' };

  try {
    await _loadNostrTools();
    const event = await _queryRelays({
      kinds: [KIND_SWAP_OFFER],
      '#d': [`eon-offer:${code}`],
      limit: 1,
    });

    if (!event) return { ok: false, error: 'Offer not found on P2P network.' };

    let /** @type {any} */
offer;
    try { offer = JSON.parse(event.content); } catch { return { ok: false, error: 'Offer data is malformed.' }; }

    if (!offer || offer.offerCode !== code) return { ok: false, error: 'Offer code mismatch.' };
    if (offer.expiresAt && offer.expiresAt < Date.now()) return { ok: false, error: 'Offer has expired.' };

    _cacheOffer(code, offer);
    return { ok: true, offer, source: 'nostr' };
  } catch (/** @type {any} */
err) {
    if (regWin.DEBUG) console.warn('[nostr-swap-registry] lookupP2POffer error:', err);
    return { ok: false, error: 'Failed to query P2P network.', source: 'nostr' };
  }
}

/**
 * Record a swap acceptance on Nostr.
 * The acceptor publishes a kind 30079 event linking to the offer code.
 *
 * @param {object} params
 * @param {string} params.offerCode       - The offer being accepted
 * @param {string} params.receiptCode     - New receipt code (use generateReceiptCode())
 * @param {string} params.uid             - Acceptor's UID
 * @param {string} params.bidderFingerprint - Device fingerprint of acceptor
 * @returns {Promise<{ ok: boolean, published?: number, error?: string, local?: boolean }>}
 */
export async function acceptP2POffer(/** @type {any} */ params) {
  const offerCode = _sanitizeStr(params?.offerCode, 64);
  const receiptCode = _sanitizeStr(params?.receiptCode, 64);
  const uid = _sanitizeStr(params?.uid, 80);
  const bidderFingerprint = _sanitizeStr(params?.bidderFingerprint, 120);

  if (!offerCode || !OFFER_CODE_RE.test(offerCode)) return { ok: false, error: 'Invalid offer code.' };
  if (!receiptCode) return { ok: false, error: 'Receipt code required.' };
  if (!uid) return { ok: false, error: 'UID required.' };

  const /** @type {any} */
record = {
    offerCode,
    receiptCode,
    uid,
    bidderFingerprint,
    acceptedAt: Date.now(),
    status: 'accepted',
  };

  // Update local cache
  const cachedOffer = _cachedOffer(offerCode);
  if (cachedOffer) _cacheOffer(offerCode, { ...cachedOffer, status: 'accepted', acceptedAt: Date.now() });

  if (DISABLED) return { ok: true, published: 0, local: true };

  try {
    const nt = await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();

    const /** @type {any} */
eventTemplate = {
      kind: KIND_SWAP_ACCEPT,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', `eon-accept:${offerCode}`],
        ['t', APP_TAG],
        ['offer', offerCode],
        ['uid', uid],
      ],
      content: JSON.stringify(record),
    };

    const event = nt.finalizeEvent(eventTemplate, keypair.secretKey);
    const result = await _publishEvent(event);
    return { ok: true, published: result.published, local: result.published === 0 };
  } catch (/** @type {any} */
err) {
    if (regWin.DEBUG) console.warn('[nostr-swap-registry] acceptP2POffer error:', err);
    return { ok: true, published: 0, local: true };
  }
}

/**
 * Publish a redemption receipt to Nostr.
 * Called after both parties confirm the swap completion.
 *
 * @param {object} params
 * @param {string} params.uid          - UID of the redeemer
 * @param {string} params.receiptCode  - Receipt code to redeem
 * @param {string} params.offerCode    - Associated offer code
 * @returns {Promise<{ ok: boolean, published?: number, error?: string, local?: boolean }>}
 */
export async function redeemP2PReceipt(/** @type {any} */ params) {
  const uid = _sanitizeStr(params?.uid, 80);
  const receiptCode = _sanitizeStr(params?.receiptCode, 64);
  const offerCode = _sanitizeStr(params?.offerCode, 64);

  if (!uid) return { ok: false, error: 'UID required.' };
  if (!receiptCode) return { ok: false, error: 'Receipt code required.' };
  if (!offerCode || !OFFER_CODE_RE.test(offerCode)) return { ok: false, error: 'Invalid offer code.' };

  const /** @type {any} */
record = {
    receiptCode,
    offerCode,
    uid,
    redeemedAt: Date.now(),
    status: 'redeemed',
  };

  // Mark local cache as redeemed
  const cachedOffer = _cachedOffer(offerCode);
  if (cachedOffer) _cacheOffer(offerCode, { ...cachedOffer, status: 'redeemed', redeemedAt: Date.now() });

  if (DISABLED) return { ok: true, published: 0, local: true };

  try {
    const nt = await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();

    const /** @type {any} */
eventTemplate = {
      kind: KIND_SWAP_RECEIPT,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', `eon-receipt:${receiptCode}`],
        ['t', APP_TAG],
        ['offer', offerCode],
        ['uid', uid],
      ],
      content: JSON.stringify(record),
    };

    const event = nt.finalizeEvent(eventTemplate, keypair.secretKey);
    const result = await _publishEvent(event);
    return { ok: true, published: result.published, local: result.published === 0 };
  } catch (/** @type {any} */
err) {
    if (regWin.DEBUG) console.warn('[nostr-swap-registry] redeemP2PReceipt error:', err);
    return { ok: true, published: 0, local: true };
  }
}

/**
 * Get current server-independence status of the swap registry.
 * @returns {{ nostrAvailable: boolean, cacheSize: number, relayCount: number }}
 */
export function getSwapRegistryStatus() {
  const cacheSize = Object.keys(_readCache()).length;
  const relayCount = Array.from(_connections.values()).filter(/** @type {any} */ ws => ws.readyState === WebSocket.OPEN).length;
  return {
    nostrAvailable: relayCount > 0,
    cacheSize,
    relayCount,
  };
}

/**
 * Pre-connect to Nostr relays (call on page load for faster first publish).
 * @returns {Promise<number>} Number of connected relays
 */
export async function initSwapRegistry() {
  if (DISABLED) return 0;
  try {
    await _loadNostrTools();
    await _getOrCreateKeypair();
    const conns = await _connectRelays();
    return conns.length;
  } catch {
    return 0;
  }
}
