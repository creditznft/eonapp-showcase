/**
 * P2P Nostr Discovery — Decentralized Challenge Broadcasting via Nostr Protocol
 * ==============================================================================
 * This module replaces GunDB as the optional discovery/broadcast layer.
 *
 * WHY NOSTR INSTEAD OF GUNDB:
 * - GunDB uses 2 community relays (volunteer-hosted, volatile)
 * - Nostr has 50+ independent public relays worldwide (no single entity)
 * - Nostr is an open protocol (NIPs) — browsers connect via WebSocket directly
 * - No CDN dependency — pure WebSocket, built into every browser
 * - Events are cryptographically signed — prevents spoofing
 *
 * ARCHITECTURE:
 * - Each player has an ephemeral secp256k1 keypair (generated once, stored in localStorage)
 * - Challenge events are NIP-01 kind 20001 (application-specific ephemeral events)
 * - Events are tagged with #e:gameId for subscription filtering
 * - Module connects to 3-5 relays; at least 1 must respond for discovery to work
 * - All relay I/O is non-blocking; failures degrade silently to URL-only mode
 *
 * USAGE:
 * - Call initNostr() on app boot (optional, lazy-init works too)
 * - Call publishChallenge(record) after posting a local challenge
 * - Call subscribeToGame(gameId, callback) for the discovery board
 * - URL-only challenges ALWAYS work regardless of Nostr relay status
 *
 * NOSTR TOOLS CDN:
 * - https://cdn.jsdelivr.net/npm/nostr-tools@2.4.0/lib/nostr.bundle.js
 * - ~60kb, provides: generateSecretKey(), getPublicKey(), finalizeEvent(), verifyEvent()
 *
 * @module utils/p2p-nostr
 */

import { buildPublicAlias, normalizeIdentityId } from './identity.js';

// ─── Constants ─────────────────────────────────────────────────────────────────

const NOSTR_TOOLS_CDN = 'https://cdn.jsdelivr.net/npm/nostr-tools@2.4.0/lib/nostr.bundle.js';
const NOSTR_TOOLS_SRI = 'sha384-h+dwCQuX/2NIOcB88xqYTbpJOALdJuhPMfi/LT54zXwVa6jk1HyVsxDK90SFv5IH';

/** Application-specific event kind (20001-29999 are ephemeral, not stored by relays) */
const NOSTR_KIND_CHALLENGE = 20001;

/** Tag used to identify EONAPP challenges */
const NOSTR_APP_TAG = 'eonapp';

/** localStorage key for encrypted ephemeral keypair (v2 — AES-GCM wrapped) */
const LS_NOSTR_KEY = 'eon-nostr-keypair-v2';
/** Key used for the AES-GCM wrapping key material (random, device-local) */
const LS_NOSTR_WRAP = 'eon-nostr-wrap-v2';

/** TTL for challenge events in seconds (48 hours to match challenge TTL) */
const NOSTR_EVENT_TTL_SEC = 48 * 60 * 60;

/**
 * Public Nostr relay list — diverse operators, geographically distributed.
 * Relays are tried in order; connection to any subset is sufficient.
 * Updated list: https://nostr.watch/
 */
/** @type {string[]} */
const /** @type {any} */
DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.wine',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
  'wss://nostr.fmt.wiz.biz'
];

const RELAY_CONNECT_TIMEOUT_MS = 5000;
const RELAY_PUBLISH_TIMEOUT_MS = 3000;
const SUBSCRIBE_TIMEOUT_MS     = 4000;
const MAX_RELAY_CONNECTIONS    = 4;
const MAX_RELAY_LIST_SIZE      = 12;
const MAX_GAME_ID_LENGTH       = 64;
const MAX_RELAY_RETRIES        = 5;
const MAX_RECONNECT_DELAY_MS   = 30000;
const RECONNECT_BASE_DELAY_MS  = 1000;
const LS_NOSTR_AUTO_INIT       = 'eon:p2p:auto-init:v1';
const HOSTNAME = typeof location !== 'undefined' ? String(location.hostname || '').toLowerCase() : '';
const IS_LOCALHOST = HOSTNAME === 'localhost' || HOSTNAME === '127.0.0.1' || HOSTNAME === '::1';
const IS_AUDIT_AUTOMATION = typeof navigator !== 'undefined' && navigator.webdriver === true;
const NOSTR_NETWORK_DISABLED = IS_LOCALHOST || IS_AUDIT_AUTOMATION;

// ─── Module state ───────────────────────────────────────────────────────────────

/** @type {any} */
let _nostrTools = null;   // Loaded nostr-tools module
/** @type {Promise<any> | null} */
let _loadPromise = null;
/** @type {Uint8Array | null} */
let _secretKey = null;   // Uint8Array (32 bytes)
/** @type {string | null} */
let _publicKey = null;   // hex string
/** @type {Map<string, WebSocket>} */
const /** @type {any} */
_connections = new Map(); // relay URL → WebSocket
/** @type {Map<string, any>} */
const /** @type {any} */
_subscriptions = new Map(); // subId → { ws, callback, gameId }
let _subCounter = 0;
/** @type {string[]} */
let /** @type {any} */
_customRelays = [];
/** @type {Map<string, { retries: number; timer: number | null; isReconnecting: boolean; unavailableNotified: boolean }>} */
const /** @type {any} */
_relayState = new Map(); // relay URL → state
const appWin = /** @type {any} */ (window);

// ─── Keypair management (AES-GCM encrypted in localStorage) ────────────────────

/**
 * Derive an AES-GCM wrapping key from a device-local random secret.
 * The secret is itself stored in localStorage (not high-entropy crypto), but
 * this protects against casual localStorage scraping and XSS that exfiltrates
 * localStorage values without also running additional code to decrypt them.
 */
async function _getWrapKey() {
  let raw = localStorage.getItem(LS_NOSTR_WRAP);
  if (!raw || raw.length !== 64) {
    const buf = new Uint8Array(32);
    crypto.getRandomValues(buf);
    raw = Array.from(buf).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(LS_NOSTR_WRAP, raw);
  }
  const keyBytes = new Uint8Array((raw.match(/.{2}/g) || []).map((/** @type {any} */ h) => parseInt(h, 16)));
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function _encryptSk(/** @type {any} */ skHex) {
  const key = await _getWrapKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(skHex));
  return JSON.stringify({
    iv:  Array.from(iv),
    ct:  Array.from(new Uint8Array(ct)),
  });
}

async function _decryptSk(/** @type {any} */ stored) {
  const { iv, ct } = JSON.parse(stored);
  const key    = await _getWrapKey();
  const ptBuf  = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ct)
  );
  return new TextDecoder().decode(ptBuf);
}

/**
 * Get or generate the player's ephemeral Nostr keypair.
 * Secret key is AES-GCM encrypted before writing to localStorage.
 * @returns {Promise<any>}
 */
async function _getOrCreateKeypair() {
  if (_secretKey && _publicKey) return { secretKey: _secretKey, publicKey: _publicKey };

  try {
    const stored = localStorage.getItem(LS_NOSTR_KEY);
    if (stored) {
      try {
        const skHex = await _decryptSk(stored);
        if (/^[0-9a-f]{64}$/i.test(skHex)) {
          _secretKey = _hexToBytes(skHex);
          _publicKey = _nostrTools.getPublicKey(_secretKey);
          return { secretKey: _secretKey, publicKey: _publicKey };
        }
      } catch {
        if (typeof window !== 'undefined' && appWin.DEBUG) {
          console.warn('[p2p-nostr] Keypair decrypt failed, regenerating');
        }
        localStorage.removeItem(LS_NOSTR_KEY);
        localStorage.removeItem(LS_NOSTR_WRAP);
      }
    }
  } catch {
    localStorage.removeItem(LS_NOSTR_KEY);
    localStorage.removeItem(LS_NOSTR_WRAP);
  }

  // Generate fresh keypair
  _secretKey = _nostrTools.generateSecretKey();
  _publicKey = _nostrTools.getPublicKey(_secretKey);

  try {
    const encrypted = await _encryptSk(_bytesToHex(_secretKey));
    localStorage.setItem(LS_NOSTR_KEY, encrypted);
  } catch {}

  return { secretKey: _secretKey, publicKey: _publicKey };
}

// ─── Byte/hex helpers (avoid pulling in full noble library separately) ───────────

function _hexToBytes(/** @type {any} */ hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function _bytesToHex(/** @type {any} */ bytes) {
  return Array.from(bytes).map((/** @type {any} */ b) => b.toString(16).padStart(2, '0')).join('');
}

/** @param {any} url */
function _normalizeRelayUrl(/** @type {any} */ url) {
  try {
    const parsed = new URL(String(url || '').trim());
    if (parsed.protocol !== 'wss:' || parsed.username || parsed.password) return '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
}

// ─── nostr-tools CDN loader ─────────────────────────────────────────────────────

async function _loadNostrTools() {
  if (_nostrTools) return _nostrTools;
  if (_loadPromise) return _loadPromise;

  _loadPromise = new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Nostr requires a browser environment.'));
      return;
    }

    // Check if already loaded (e.g., via manual script tag)
    if (appWin.NostrTools) {
      _nostrTools = appWin.NostrTools;
      resolve(_nostrTools);
      return;
    }

    const /** @type {any} */
script = document.createElement('script');
    script.src = NOSTR_TOOLS_CDN;
  script.integrity = NOSTR_TOOLS_SRI;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (appWin.NostrTools) {
        _nostrTools = appWin.NostrTools;
        resolve(_nostrTools);
      } else {
        reject(new Error('nostr-tools loaded but window.NostrTools is undefined.'));
      }
    };
    script.onerror = () => {
      _loadPromise = null;
      reject(new Error('Failed to load nostr-tools from CDN.'));
    };
    document.head.appendChild(script);
  });

  return _loadPromise;
}

// ─── Relay connection management ───────────────────────────────────────────────

function _getRelayState(/** @type {any} */ url) {
  if (!_relayState.has(url)) {
    _relayState.set(url, {
      retries: 0,
      timer: null,
      isReconnecting: false,
      unavailableNotified: false
    });
  }
  return /** @type {any} */ (_relayState.get(url));
}

function _showRelayFallbackMessage(/** @type {any} */ message) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (!body) return;
  const id = 'eon-p2p-relay-fallback';
  let /** @type {any} */
banner = document.getElementById(id);
  if (!banner) {
    banner = document.createElement('div');
    banner.id = id;
    banner.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:2147483647;padding:9px 12px;border-radius:10px;background:#2a1a1a;color:#ffd7d7;font-size:12px;line-height:1.35;box-shadow:0 10px 24px rgba(0,0,0,.35);display:flex;justify-content:space-between;gap:12px;align-items:flex-start';
    body.appendChild(banner);
  }
  banner.innerHTML = `<span>${message}</span><button type="button" aria-label="Dismiss relay notice" style="border:0;background:transparent;color:#ffd7d7;font-size:16px;line-height:1;cursor:pointer">×</button>`;
  const /** @type {any} */
closeBtn = banner.querySelector('button');
  closeBtn?.addEventListener('click', () => banner.remove());
  setTimeout(() => {
    const /** @type {any} */
current = document.getElementById(id);
    if (current) current.remove();
  }, 7000);
}

function _announceRelaysUnavailable(/** @type {any} */ context) {
  const message = 'P2P relays are temporarily unavailable. Falling back to local-only mode.';
  if (typeof window !== 'undefined' && appWin.DEBUG) {
    console.warn(`[p2p-nostr] ${context}: ${message}`);
  }
  _showRelayFallbackMessage(message);
}

function _clearReconnectTimer(/** @type {any} */ relayUrl) {
  const state = _getRelayState(relayUrl);
  if (state?.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
}

function _cleanupSubscriptionsForSocket(/** @type {any} */ ws) {
  for (const [subId, sub] of _subscriptions.entries()) {
    if (!sub?.connections?.length) continue;
    const survivors = sub.connections.filter((/** @type {any} */ entry) => entry.ws !== ws);
    if (survivors.length === sub.connections.length) continue;
    sub.connections.forEach((/** @type {any} */ { ws: subWs, onMessage, subId: sid }) => {
      if (subWs !== ws) return;
      ws.removeEventListener('message', onMessage);
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify(['CLOSE', sid])); } catch {}
      }
    });
    sub.connections = survivors;
    if (survivors.length === 0) {
      if (sub.timeoutId) clearTimeout(sub.timeoutId);
      _subscriptions.delete(subId);
    }
  }
}

/** @param {string} relayUrl */
function _scheduleReconnect(/** @type {any} */ relayUrl) {
  const state = _getRelayState(relayUrl);
  if (state.isReconnecting || state.retries >= MAX_RELAY_RETRIES) {
    if (state.retries >= MAX_RELAY_RETRIES && !state.unavailableNotified) {
      state.unavailableNotified = true;
      _announceRelaysUnavailable(`relay ${relayUrl}`);
    }
    return;
  }
  state.retries += 1;
  state.isReconnecting = true;
  const delay = Math.min(MAX_RECONNECT_DELAY_MS, RECONNECT_BASE_DELAY_MS * (2 ** (state.retries - 1)));
  _clearReconnectTimer(relayUrl);
  state.timer = setTimeout(async () => {
    state.timer = null;
    const ws = await _connectRelay(relayUrl, { allowReconnect: true });
    state.isReconnecting = false;
    if (!ws) {
      _scheduleReconnect(relayUrl);
    }
  }, delay);
}

/**
 * Connect to a single relay with timeout.
 * @param {string} url - WebSocket URL (wss://)
 * @returns {Promise<WebSocket | null>}
 */
/**
 * @param {string} url
 * @param {object} [opts]
 * @param {boolean} [opts.allowReconnect]
 */
async function _connectRelay(/** @type {any} */ url, /** @type {any} */ { allowReconnect = true } = {}) {
  if (NOSTR_NETWORK_DISABLED) return null;
  const relayUrl = _normalizeRelayUrl(url);
  if (!relayUrl) return null;
  const relayState = _getRelayState(relayUrl);
  if (_connections.has(relayUrl)) {
    const existing = _connections.get(relayUrl);
    if (existing?.readyState === WebSocket.OPEN) return existing;
    // Clean up stale connection
    try { existing?.close(); } catch {}
    _connections.delete(relayUrl);
  }

  return new Promise((/** @type {any} */ resolve) => {
    /** @type {WebSocket | null} */
    let ws = null;
    let settled = false;
    const settle = ((/** @type {any} */ value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    });
    const timeout = setTimeout(() => {
      try { ws?.close(); } catch {}
      settle(null);
    }, RELAY_CONNECT_TIMEOUT_MS);

    try {
      ws = new WebSocket(relayUrl);

      ws.onopen = () => {
        clearTimeout(timeout);
        if (!ws) return settle(null);
        _connections.set(relayUrl, ws);
        if (!relayState) return settle(ws);
        relayState.retries = 0;
        relayState.isReconnecting = false;
        relayState.unavailableNotified = false;
        settle(ws);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        try { ws?.close(); } catch {}
        if (allowReconnect) {
          _scheduleReconnect(relayUrl);
        }
        settle(null);
      };

      ws.onclose = () => {
        _connections.delete(relayUrl);
        _cleanupSubscriptionsForSocket(ws);
        if (allowReconnect) {
          _scheduleReconnect(relayUrl);
        }
      };
    } catch {
      clearTimeout(timeout);
      try { ws?.close(); } catch {}
      if (allowReconnect) {
        _scheduleReconnect(relayUrl);
      }
      settle(null);
    }
  });
}

/**
 * Connect to multiple relays in parallel, return those that succeed.
 * @param {number} [limit] - Max connections to open
 * @returns {Promise<WebSocket[]>}
 */
/**
 * @param {number} [limit]
 */
async function _connectRelays(/** @type {any} */ limit = MAX_RELAY_CONNECTIONS) {
  const relays = _customRelays.length > 0 ? _customRelays : DEFAULT_RELAYS;
  const pool = relays.slice(0, limit + 2); // Try a few extras in case some fail

  const results = await Promise.all(pool.map((/** @type {any} */ relay) => _connectRelay(relay, { allowReconnect: true })));
  const connected = results.filter(Boolean).slice(0, limit);
  if (connected.length === 0) {
    _announceRelaysUnavailable('connect-relays');
  }
  return connected;
}

// ─── Event building ────────────────────────────────────────────────────────────

/**
 * Build a Nostr event for a challenge announcement.
 * @param {any} challenge - Challenge record from p2p-multiplayer.postChallenge()
 * @param {string} challengeUrl - Shareable challenge URL
 * @param {{ secretKey: Uint8Array, publicKey: string }} keypair
 * @returns {any} Signed Nostr event
 */
/**
 * @param {any} challenge
 * @param {string} challengeUrl
 * @param {{ secretKey: Uint8Array, publicKey: string }} keypair
 */
function _buildChallengeEvent(/** @type {any} */ challenge, /** @type {any} */ challengeUrl, /** @type {any} */ keypair) {
  const content = JSON.stringify({
    id:         challenge.id,
    gameId:     challenge.gameId,
    score:      challenge.score,
    uid:        normalizeIdentityId(challenge.uid) || '',
    url:        challengeUrl,
    expiresAt:  challenge.expiresAt
  });

  const /** @type {any} */
eventTemplate = {
    kind:       NOSTR_KIND_CHALLENGE,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['t', NOSTR_APP_TAG],
      ['t', `eon-game:${challenge.gameId}`],
      ['expiration', String(Math.floor(challenge.expiresAt / 1000))]
    ],
    content
  };

  return _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
}

/**
 * Parse a Nostr event content back into a challenge record.
 * Returns null if the event is invalid or expired.
 * @param {any} event - Nostr event
 * @returns {any}
 */
/** @param {any} event */
function _parseChallengeEvent(/** @type {any} */ event) {
  try {
    if (!event || event.kind !== NOSTR_KIND_CHALLENGE) return null;
    if (!_nostrTools.verifyEvent(event)) return null;

    const data = JSON.parse(event.content);
    if (!data.id || !data.gameId || typeof data.score !== 'number') return null;

    // Reject expired challenges
    if (data.expiresAt && data.expiresAt < Date.now()) return null;

    return {
      id:           data.id,
      gameId:       data.gameId,
      score:        data.score,
      uid:          normalizeIdentityId(data.uid) || '',
      alias:        normalizeIdentityId(data.uid)
        ? buildPublicAlias(data.uid, data.uid)
        : 'A friend',
      challengeUrl: data.url || '',
      expiresAt:    data.expiresAt || (Date.now() + 48 * 60 * 60 * 1000),
      nostrEventId: event.id,
      nostrPubkey:  event.pubkey
    };
  } catch {
    return null;
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialize Nostr connectivity. Call on page load for fastest response.
 * Non-blocking — failures are silently swallowed.
 * @returns {Promise<boolean>} true if at least one relay connected
 */
export async function initNostr() {
  if (NOSTR_NETWORK_DISABLED) return false;
  try {
    await _loadNostrTools();
    await _getOrCreateKeypair();
    const connections = await _connectRelays();
    return connections.length > 0;
  } catch {
    return false;
  }
}

/**
 * Override relay list before calling any Nostr functions.
 * @param {string[]} relays - WebSocket URLs (wss://)
 */
/** @param {string[]} relays */
export function setNostrRelays(/** @type {any} */ relays) {
  if (!Array.isArray(relays)) return;
  /** @type {string[]} */
  const /** @type {any} */
unique = [];
  const /** @type {any} */
seen = new Set();
  relays.forEach((/** @type {any} */ relay) => {
    const normalized = _normalizeRelayUrl(relay);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });
  _customRelays = unique.slice(0, MAX_RELAY_LIST_SIZE);
}

/**
 * Publish a challenge record to Nostr relays for discovery.
 * Call after p2p-multiplayer.postChallenge() returns success.
 *
 * @param {object} challenge - Challenge record
 * @param {string} challengeUrl - The URL from buildChallengeUrl()
 * @returns {Promise<{ published: number, total: number }>}
 */
/**
 * @param {object} challenge
 * @param {string} challengeUrl
 */
export async function publishChallenge(/** @type {any} */ challenge, /** @type {any} */ challengeUrl) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    const event = _buildChallengeEvent(challenge, challengeUrl, keypair);

    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };

    let published = 0;
    const msg = JSON.stringify(['EVENT', event]);

    const publishPromises = connections.map((/** @type {any} */ ws) =>
      new Promise((/** @type {any} */ resolve) => {
        if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
        let settled = false;
        const onDone = ((/** @type {any} */ value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          ws.removeEventListener('message', onMessage);
          resolve(value);
        });
        const timeout = setTimeout(() => onDone(false), RELAY_PUBLISH_TIMEOUT_MS);
        const onMessage = ((/** @type {any} */ e) => {
          try {
            const data = JSON.parse(e.data);
            // NIP-01: ["OK", event_id, true/false, message]
            if (data[0] === 'OK' && data[1] === event.id) {
              onDone(data[2] === true);
            }
          } catch {}
        });
        ws.addEventListener('message', onMessage);
        try {
          ws.send(msg);
        } catch {
          onDone(false);
        }
      })
    );

    const results = await Promise.all(publishPromises);
    published = results.filter(Boolean).length;

    return { published, total: connections.length };
  } catch {
    return { published: 0, total: 0 };
  }
}

/**
 * Publish a referral proof event to Nostr relays.
 * Broadcasts the invite link + proof-of-activity data so other vaults can discover it.
 * @param {{ shareUrl: string, referrerId: string, tier: string }} referralData
 * @returns {Promise<{ published: number, total: number }>}
 */
export async function publishReferralProof(/** @type {any} */ referralData) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    if (!keypair) return { published: 0, total: 0 };

    const /** @type {any} */
eventTemplate = {
      kind: 20002, // EON-specific: referral proof event
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', NOSTR_APP_TAG],
        ['t', 'referral-proof'],
        ['referrer', String(referralData.referrerId || '')],
        ['tier', String(referralData.tier || 'free')],
      ],
      content: String(referralData.shareUrl || ''),
    };

    const event = _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };

    let published = 0;
    const msg = JSON.stringify(['EVENT', event]);

    const publishPromises = connections.map((/** @type {any} */ ws) =>
      new Promise((/** @type {any} */ resolve) => {
        if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
        let settled = false;
        const onDone = ((/** @type {any} */ value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          ws.removeEventListener('message', onMessage);
          resolve(value);
        });
        const timeout = setTimeout(() => onDone(false), RELAY_PUBLISH_TIMEOUT_MS);
        const onMessage = ((/** @type {any} */ e) => {
          try {
            const data = JSON.parse(e.data);
            if (data[0] === 'OK' && data[1] === event.id) {
              onDone(data[2] === true);
            }
          } catch {}
        });
        ws.addEventListener('message', onMessage);
        try { ws.send(msg); } catch { onDone(false); }
      })
    );

    const results = await Promise.all(publishPromises);
    published = results.filter(Boolean).length;
    return { published, total: connections.length };
  } catch {
    return { published: 0, total: 0 };
  }
}

/**
 * Broadcast an NFT milestone achievement to Nostr relays.
 * Used when a user earns a rare/legendary/quantum NFT or completes a merge.
 * @param {{ nftId: string, nftName: string, rarity: string, trigger?: string }} milestone
 * @returns {Promise<{ published: number, total: number }>}
 */
export async function publishNFTMilestone(/** @type {any} */ milestone) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    if (!keypair) return { published: 0, total: 0 };

    const /** @type {any} */
eventTemplate = {
      kind: 20003, // EON-specific: NFT milestone event
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', NOSTR_APP_TAG],
        ['t', 'nft-milestone'],
        ['nft', String(milestone.nftId || '')],
        ['rarity', String(milestone.rarity || '')],
      ],
      content: JSON.stringify({ nftName: String(milestone.nftName || ''), rarity: String(milestone.rarity || ''), trigger: String(milestone.trigger || ''), ts: Date.now() }),
    };

    const event = _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };

    let published = 0;
    const msg = JSON.stringify(['EVENT', event]);
    const results = await Promise.all(connections.map((/** @type {any} */ ws) =>
      new Promise((/** @type {any} */ resolve) => {
        if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
        let settled = false;
        const onDone = ((/** @type {any} */ v) => { if (settled) return; settled = true; clearTimeout(t); ws.removeEventListener('message', h); resolve(v); });
        const t = setTimeout(() => onDone(false), RELAY_PUBLISH_TIMEOUT_MS);
        const h = ((/** @type {any} */ e) => { try { const d = JSON.parse(e.data); if (d[0] === 'OK' && d[1] === event.id) onDone(d[2] === true); } catch {} });
        ws.addEventListener('message', h);
        try { ws.send(msg); } catch { onDone(false); }
      })
    ));
    published = results.filter(Boolean).length;
    return { published, total: connections.length };
  } catch {
    return { published: 0, total: 0 };
  }
}

/**
 * Broadcast a WorkBench mission completion to Nostr relays.
 * Announces mode used + pts earned to the EON discovery network.
 * @param {{ mode: string, pts: number, missionSnippet: string }} mission
 * @returns {Promise<{ published: number, total: number }>}
 */
export async function publishMissionComplete(/** @type {any} */ mission) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    if (!keypair) return { published: 0, total: 0 };

    const /** @type {any} */
eventTemplate = {
      kind: 20004, // EON-specific: mission complete event
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', NOSTR_APP_TAG],
        ['t', 'mission-complete'],
        ['mode', String(mission.mode || 'ask')],
        ['pts', String(mission.pts || 0)],
      ],
      content: String(mission.missionSnippet || '').slice(0, 140),
    };

    const event = _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };

    let published = 0;
    const msg = JSON.stringify(['EVENT', event]);
    const results = await Promise.all(connections.map((/** @type {any} */ ws) =>
      new Promise((/** @type {any} */ resolve) => {
        if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
        let settled = false;
        const onDone = ((/** @type {any} */ v) => { if (settled) return; settled = true; clearTimeout(t); ws.removeEventListener('message', h); resolve(v); });
        const t = setTimeout(() => onDone(false), RELAY_PUBLISH_TIMEOUT_MS);
        const h = ((/** @type {any} */ e) => { try { const d = JSON.parse(e.data); if (d[0] === 'OK' && d[1] === event.id) onDone(d[2] === true); } catch {} });
        ws.addEventListener('message', h);
        try { ws.send(msg); } catch { onDone(false); }
      })
    ));
    published = results.filter(Boolean).length;
    return { published, total: connections.length };
  } catch {
    return { published: 0, total: 0 };
  }
}

// ─── EON Platform Event Kinds (62000-62006) ──────────────────────────────────
// These replace backend database tables with Nostr broadcast events.
// Kind range 62000-62099 is reserved for EON platform data.

async function _publishEonEvent(/** @type {any} */ kind, /** @type {any} */ tags, /** @type {any} */ content) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    if (!keypair) return { published: 0, total: 0 };

    const /** @type {any} */
eventTemplate = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['t', NOSTR_APP_TAG], ...tags],
      content: typeof content === 'string' ? content : JSON.stringify(content),
    };

    const event = _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };

    const msg = JSON.stringify(['EVENT', event]);
    const results = await Promise.all(connections.map((/** @type {any} */ ws) =>
      new Promise((/** @type {any} */ resolve) => {
        if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
        let settled = false;
        const onDone = ((/** @type {any} */ v) => { if (settled) return; settled = true; clearTimeout(t); ws.removeEventListener('message', h); resolve(v); });
        const t = setTimeout(() => onDone(false), RELAY_PUBLISH_TIMEOUT_MS);
        const h = ((/** @type {any} */ e) => { try { const d = JSON.parse(e.data); if (d[0] === 'OK' && d[1] === event.id) onDone(d[2] === true); } catch {} });
        ws.addEventListener('message', h);
        try { ws.send(msg); } catch { onDone(false); }
      })
    ));
    return { published: results.filter(Boolean).length, total: connections.length };
  } catch {
    return { published: 0, total: 0 };
  }
}

export async function publishPoolAnchor(/** @type {any} */ data) {
  return _publishEonEvent(62000, [
    ['t', 'pool-anchor'],
    ['uid', String(data.uid || '')],
    ['epoch', String(data.epoch || '')],
  ], { balanceHash: String(data.balanceHash || ''), points: Number(data.points || 0), ts: Date.now() });
}

export async function publishSwapReconciliation(/** @type {any} */ data) {
  return _publishEonEvent(62001, [
    ['t', 'swap-reconciliation'],
    ['offerId', String(data.offerId || '')],
    ['receiptId', String(data.receiptId || '')],
  ], { ts: Date.now() });
}

export async function publishComputeProvider(/** @type {any} */ data) {
  return _publishEonEvent(62002, [
    ['t', 'compute-provider'],
    ['tier', String(data.tier || 'basic')],
  ], { endpoint: String(data.endpoint || ''), pricing: String(data.pricing || ''), ts: Date.now() });
}

export async function publishBounty(/** @type {any} */ data) {
  return _publishEonEvent(62003, [
    ['t', 'bounty'],
    ['bountyId', String(data.bountyId || '')],
    ['type', String(data.type || '')],
    ['reward', String(data.reward || '')],
    ['deadline', String(data.deadline || '')],
  ], { description: String(data.description || '').slice(0, 280), ts: Date.now() });
}

export async function publishSkillAttestation(/** @type {any} */ data) {
  return _publishEonEvent(62004, [
    ['t', 'skill-attestation'],
    ['track', String(data.track || '')],
    ['level', String(data.level || 1)],
  ], { badges: Array.isArray(data.badges) ? data.badges : [], xp: Number(data.xp || 0), ts: Date.now() });
}

export async function publishRealmEvent(/** @type {any} */ data) {
  return _publishEonEvent(62005, [
    ['t', 'realm-event'],
    ['districtId', String(data.districtId || '')],
    ['eventType', String(data.eventType || '')],
  ], { startTs: Number(data.startTs || Date.now()), durationSec: Number(data.durationSec || 3600), ts: Date.now() });
}

export async function publishSubscriptionNFT(/** @type {any} */ data) {
  return _publishEonEvent(62006, [
    ['t', 'subscription-nft'],
    ['tier', String(data.tier || 'free')],
  ], { tokenId: String(data.tokenId || ''), expiresAt: String(data.expiresAt || ''), ts: Date.now() });
}

export async function publishMissionCapsule(/** @type {any} */ capsule) {
  return _publishEonEvent(62007, [
    ['t', 'mission-capsule'],
    ['jobId', String(capsule?.jobId || capsule?.manifest?.job?.id || '')],
    ['capsuleHash', String(capsule?.capsuleHash || capsule?.manifest?.manifestHash || '')],
    ['encrypted', String(Boolean(capsule?.encrypted))],
  ], {
    title: String(capsule?.title || capsule?.manifest?.job?.title || ''),
    status: String(capsule?.status || capsule?.manifest?.job?.status || ''),
    payload: capsule?.payload || capsule?.manifest || capsule,
    ts: Date.now()
  });
}

/**
 * Subscribe to open challenges for a specific game.
 * Calls callback for each valid challenge found.
 *
 * @param {string} gameId - Game identifier
 * @param {(challenge: any) => void} callback
 * @returns {Promise<function>} Unsubscribe function
 */
/**
 * @param {string} gameId
 * @param {Function} callback
 */
export async function subscribeToGame(/** @type {any} */ gameId, /** @type {any} */ callback) {
  const normalizedGameId = String(gameId || '').trim().toLowerCase();
  if (!normalizedGameId || normalizedGameId.length > MAX_GAME_ID_LENGTH || typeof callback !== 'function') return () => {};

  try {
    await _loadNostrTools();
    const connections = await _connectRelays();
    if (connections.length === 0) return () => {};

    const subId = `eon-sub-${++_subCounter}-${normalizedGameId}`;
    const /** @type {any} */
seen = new Set();
    const now   = Math.floor(Date.now() / 1000);

      const /** @type {any} */
filter = {
        kinds: [NOSTR_KIND_CHALLENGE],
        since: now - NOSTR_EVENT_TTL_SEC,
        '#t':  [`eon-game:${normalizedGameId}`],
        limit: 100
      };

    const req = JSON.stringify(['REQ', subId, filter]);

    /** @type {any[]} */
    const /** @type {any} */
activeSubs = [];

    connections.forEach((/** @type {any} */ ws) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const onMessage = ((/** @type {any} */ e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subId) {
            const event = data[2];
            if (!seen.has(event.id)) {
              seen.add(event.id);
              const challenge = _parseChallengeEvent(event);
              if (challenge) callback(challenge);
            }
          }
        } catch {}
      });

      ws.addEventListener('message', onMessage);
      try {
        ws.send(req);
        activeSubs.push({ ws, subId, onMessage });
      } catch {
        ws.removeEventListener('message', onMessage);
      }
    });

    const timeoutId = setTimeout(() => {
      activeSubs.forEach((/** @type {any} */ { ws, subId: sid, onMessage }) => {
        ws.removeEventListener('message', onMessage);
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify(['CLOSE', sid])); } catch {}
        }
      });
      _subscriptions.delete(subId);
    }, SUBSCRIBE_TIMEOUT_MS);

    _subscriptions.set(subId, { connections: activeSubs, gameId: normalizedGameId, timeoutId });

    return () => {
      const existing = _subscriptions.get(subId);
      if (existing?.timeoutId) {
        clearTimeout(existing.timeoutId);
      }
      activeSubs.forEach((/** @type {any} */ { ws, subId: sid, onMessage }) => {
        ws.removeEventListener('message', onMessage);
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.send(JSON.stringify(['CLOSE', sid])); } catch {}
        }
      });
      _subscriptions.delete(subId);
    };
  } catch {
    return () => {};
  }
}

/**
 * Fetch recent EON platform events by kind/tag.
 * Used by compute + bounty discovery flows.
 * @param {number} kind
 * @param {string} tagValue
 * @param {number} limit
 * @returns {Promise<Array<any>>}
 */
export async function fetchRecentEonEvents(/** @type {any} */ kind, /** @type {any} */ tagValue = '', /** @type {any} */ limit = 50) {
  try {
    await _loadNostrTools();
    const connections = await _connectRelays();
    if (connections.length === 0) return [];

    const subId = `eon-fetch-${++_subCounter}-${kind}`;
    const now = Math.floor(Date.now() / 1000);
    const /** @type {any} */
seen = new Set();
    /** @type {any[]} */
    const /** @type {any} */
events = [];

    const filter = /** @type {any} */ ({
      kinds: [Number(kind) || 0],
      since: now - NOSTR_EVENT_TTL_SEC,
      limit: Math.max(1, Math.min(200, Number(limit) || 50))
    });
    if (tagValue) {
      filter['#t'] = [String(tagValue)];
    }

    const req = JSON.stringify(['REQ', subId, filter]);

    await Promise.all(connections.map((/** @type {any} */ ws) => new Promise((/** @type {any} */ resolve) => {
      if (ws.readyState !== WebSocket.OPEN) {
        resolve(null);
        return;
      }
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        clearTimeout(t);
        ws.removeEventListener('message', onMessage);
        try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
        resolve(null);
      };
      const t = setTimeout(done, SUBSCRIBE_TIMEOUT_MS);
      const onMessage = ((/** @type {any} */ e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'EVENT' && data[1] === subId) {
            const event = data[2];
            if (event?.id && !seen.has(event.id)) {
              seen.add(event.id);
              events.push(event);
            }
          } else if (data[0] === 'EOSE' && data[1] === subId) {
            done();
          }
        } catch {}
      });
      ws.addEventListener('message', onMessage);
      try { ws.send(req); } catch { done(); }
    })));

    return events.sort((/** @type {any} */ a, /** @type {any} */ b) => (b.created_at || 0) - (a.created_at || 0));
  } catch {
    return [];
  }
}

/**
 * Get the player's Nostr public key (hex string).
 * Used to attribute challenge events to this player's Nostr identity.
 * @returns {Promise<string | null>}
 */
export async function getNostrPublicKey() {
  try {
    await _loadNostrTools();
    const { publicKey } = await _getOrCreateKeypair();
    return publicKey;
  } catch {
    return null;
  }
}

/**
 * Get the player's Nostr secret key as a hex string.
 * Used only for local, device-bound signing flows such as subscription license verification.
 * @returns {Promise<string | null>}
 */
export async function getNostrSecretKeyHex() {
  try {
    await _loadNostrTools();
    const { secretKey } = await _getOrCreateKeypair();
    return secretKey ? _bytesToHex(secretKey) : null;
  } catch {
    return null;
  }
}

/**
 * Get current Nostr relay status.
 * @returns {Array<{ url: string, connected: boolean }>}
 */
export function getRelayStatus() {
  const relays = _customRelays.length > 0 ? _customRelays : DEFAULT_RELAYS;
    return relays.slice(0, MAX_RELAY_CONNECTIONS + 2).map((/** @type {any} */ url) => ({
    url,
    connected: _connections.has(url) && _connections.get(url)?.readyState === WebSocket.OPEN
  }));
}

/**
 * Disconnect all relay WebSockets.
 * Call on page unload if desired (not required — browser handles cleanup).
 */
export function disconnectRelays() {
  for (const /** @type {any} */
relayUrl of _relayState.keys()) {
    _clearReconnectTimer(relayUrl);
  }
  for (const [url, ws] of _connections.entries()) {
    try { ws.close(); } catch {}
    _connections.delete(url);
  }
  for (const [, sub] of _subscriptions.entries()) {
    if (sub?.timeoutId) clearTimeout(sub.timeoutId);
  }
  _subscriptions.clear();
}

// ─── Offline Queue for Referral Proofs ────────────────────────────────────────

const LS_OFFLINE_QUEUE = 'eon-nostr-offline-queue';
const MAX_QUEUE_SIZE = 50;
const QUEUE_FLUSH_INTERVAL_MS = 30_000;

/** @type {any} */
let _flushTimer = null;

function _loadQueue() {
  try {
    const raw = localStorage.getItem(LS_OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function _saveQueue(/** @type {any} */ queue) {
  try {
    localStorage.setItem(LS_OFFLINE_QUEUE, JSON.stringify(queue.slice(0, MAX_QUEUE_SIZE)));
  } catch {}
}

function _enqueueReferralProof(/** @type {any} */ referralData) {
  const queue = _loadQueue();
  queue.push({ ...referralData, enqueuedAt: Date.now() });
  _saveQueue(queue);
}

async function _flushOfflineQueue() {
  const queue = _loadQueue();
  if (queue.length === 0) return;

  const /** @type {any} */
remaining = [];
  for (const /** @type {any} */
item of queue) {
    try {
      const result = await publishReferralProof(item);
      if (result.published === 0) {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }
  _saveQueue(remaining);
}

/**
 * Start periodic flush of offline referral proof queue.
 * Call on app boot after initNostr().
 */
export function startOfflineQueueFlush() {
  if (_flushTimer) return;
  _flushOfflineQueue();
  _flushTimer = setInterval(_flushOfflineQueue, QUEUE_FLUSH_INTERVAL_MS);
}

/**
 * Stop periodic flush (e.g., on page unload).
 */
export function stopOfflineQueueFlush() {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
}

/**
 * Get count of pending items in offline queue.
 * @returns {number}
 */
export function getOfflineQueueSize() {
  return _loadQueue().length;
}

// ─── Auto-init: connect relays silently on module import ─────────────────────
// This ensures relays are always connected without manual user action.
/** @type {any} */
let _autoReconnectTimer = null;
const AUTO_RECONNECT_INTERVAL_MS = 60_000; // check every 60s

function _isAutoInitEnabled() {
  try {
    return localStorage.getItem(LS_NOSTR_AUTO_INIT) === 'true';
  } catch {
    return false;
  }
}

function _startAutoReconnect() {
  if (_autoReconnectTimer) return;
  _autoReconnectTimer = setInterval(async () => {
    const statuses = getRelayStatus();
    const anyDown = statuses.some(/** @type {any} */ s => !s.connected);
    if (anyDown) {
      try {
        await _connectRelays();
      } catch {}
    }
  }, AUTO_RECONNECT_INTERVAL_MS);
}

// Kick off silent connection when module loads (non-blocking)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const _doAutoInit = async () => {
    if (!_isAutoInitEnabled()) return;
    try {
      await initNostr();
      startOfflineQueueFlush();
      _startAutoReconnect();
    } catch {}
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _doAutoInit, { once: true });
  } else {
    // Already loaded — defer slightly so page init runs first
    setTimeout(_doAutoInit, 800);
  }
}

// ─── Relay Health Check ────────────────────────────────────────────────────────

const RELAY_PING_TIMEOUT_MS = 3000;
const RELAY_HEALTH_CACHE_MS = 60_000;

/** @type {Map<string, { healthy: boolean, latencyMs: number, checkedAt: number }>} */
const /** @type {any} */
_relayHealthCache = new Map();

/**
 * Ping a single relay to check if it's responsive.
 * Sends a NIP-01 REQ with limit:0 (no-op subscription) and measures round-trip.
 * @param {string} relayUrl
 * @returns {Promise<{ healthy: boolean, latencyMs: number }>}
 */
export async function pingRelay(/** @type {any} */ relayUrl) {
  const normalized = _normalizeRelayUrl(relayUrl);
  if (!normalized) return { healthy: false, latencyMs: -1 };

  const cached = _relayHealthCache.get(normalized);
  if (cached && (Date.now() - cached.checkedAt) < RELAY_HEALTH_CACHE_MS) {
    return { healthy: cached.healthy, latencyMs: cached.latencyMs };
  }

  const start = Date.now();
  try {
    const ws = await _connectRelay(normalized, { allowReconnect: false });
    if (!ws) {
      _relayHealthCache.set(normalized, { healthy: false, latencyMs: -1, checkedAt: Date.now() });
      return { healthy: false, latencyMs: -1 };
    }

    const result = await new Promise((/** @type {any} */ resolve) => {
      const subId = `eon-ping-${++_subCounter}`;
      let settled = false;
      const done = ((/** @type {any} */ value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        ws.removeEventListener('message', onMessage);
        try { ws.send(JSON.stringify(['CLOSE', subId])); } catch {}
        resolve(value);
      });
      const timeout = setTimeout(() => done(false), RELAY_PING_TIMEOUT_MS);
      const onMessage = ((/** @type {any} */ e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'EOSE' || data[0] === 'EVENT') {
            done(true);
          }
        } catch {}
      });
      ws.addEventListener('message', onMessage);
      try {
        ws.send(JSON.stringify(['REQ', subId, { kinds: [0], limit: 0 }]));
      } catch { done(false); }
    });

    const latencyMs = Date.now() - start;
    const healthy = result === true;
    _relayHealthCache.set(normalized, { healthy, latencyMs, checkedAt: Date.now() });
    return { healthy, latencyMs };
  } catch {
    _relayHealthCache.set(normalized, { healthy: false, latencyMs: -1, checkedAt: Date.now() });
    return { healthy: false, latencyMs: -1 };
  }
}

/**
 * Check health of all configured relays.
 * @returns {Promise<Array<{ url: string, healthy: boolean, latencyMs: number }>>}
 */
export async function checkAllRelayHealth() {
  const relays = _customRelays.length > 0 ? _customRelays : DEFAULT_RELAYS;
  const results = await Promise.all(
    relays.slice(0, MAX_RELAY_CONNECTIONS + 2).map(async (/** @type {any} */ url) => {
      const { healthy, latencyMs } = await pingRelay(url);
      return { url, healthy, latencyMs };
    })
  );
  return results;
}

// ─── Auto-publish referral proof with offline fallback ────────────────────────

/**
 * Publish referral proof with automatic offline queueing.
 * If relays are unreachable, the proof is queued and flushed later.
 * @param {{ shareUrl: string, referrerId: string, tier: string }} referralData
 * @returns {Promise<{ published: number, total: number, queued: boolean }>}
 */
export async function publishReferralProofWithQueue(/** @type {any} */ referralData) {
  try {
    const result = await publishReferralProof(referralData);
    if (result.published > 0) {
      return { ...result, queued: false };
    }
  } catch {}
  _enqueueReferralProof(referralData);
  return { published: 0, total: 0, queued: true };
}

// ─── W66 decentralized share-performance receipts ─────────────────────────────
const NOSTR_KIND_SHARE_RECEIPT = 20003;
const LS_SHARE_RECEIPT_QUEUE = 'eon:share-receipt-nostr-queue:v1';

/** Publish a signed/local EON share receipt using the existing Nostr identity. */
export async function publishShareReceipt(receipt) {
  try {
    await _loadNostrTools();
    const keypair = await _getOrCreateKeypair();
    if (!keypair || !receipt?.eventId || !receipt?.shareId) return { published: 0, total: 0 };
    const eventTemplate = {
      kind: NOSTR_KIND_SHARE_RECEIPT,
      created_at: Math.floor(Number(receipt.occurredAt || Date.now()) / 1000),
      tags: [
        ['t', NOSTR_APP_TAG],
        ['t', 'share-receipt'],
        ['schema', String(receipt.schema || 'eon.share-receipt.v1')],
        ['share', String(receipt.shareId || '')],
        ['root', String(receipt.rootReferralId || '')],
        ['event', String(receipt.eventType || '')],
        ['eventId', String(receipt.eventId || '')],
        ['campaign', String(receipt.campaignId || '')]
      ],
      content: JSON.stringify(receipt)
    };
    const event = _nostrTools.finalizeEvent(eventTemplate, keypair.secretKey);
    const connections = await _connectRelays();
    if (connections.length === 0) return { published: 0, total: 0 };
    const msg = JSON.stringify(['EVENT', event]);
    const results = await Promise.all(connections.map((ws) => new Promise((resolve) => {
      if (ws.readyState !== WebSocket.OPEN) { resolve(false); return; }
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        ws.removeEventListener('message', onMessage);
        resolve(value);
      };
      const timeout = setTimeout(() => finish(false), RELAY_PUBLISH_TIMEOUT_MS);
      const onMessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data[0] === 'OK' && data[1] === event.id) finish(data[2] === true);
        } catch {}
      };
      ws.addEventListener('message', onMessage);
      try { ws.send(msg); } catch { finish(false); }
    })));
    return { published: results.filter(Boolean).length, total: connections.length, eventId: event.id };
  } catch {
    return { published: 0, total: 0 };
  }
}

export async function publishShareReceiptWithQueue(receipt) {
  const result = await publishShareReceipt(receipt);
  if (result.published > 0) return { ...result, queued: false };
  try {
    const queue = JSON.parse(localStorage.getItem(LS_SHARE_RECEIPT_QUEUE) || '[]');
    if (!queue.some((row) => row?.eventId === receipt?.eventId)) queue.push({ ...receipt, queuedAt: Date.now(), attempts: 0 });
    localStorage.setItem(LS_SHARE_RECEIPT_QUEUE, JSON.stringify(queue.slice(-500)));
  } catch {}
  return { ...result, queued: true };
}

export async function fetchShareReceipts(shareId = '', limit = 100) {
  const rows = await fetchRecentEonEvents(NOSTR_KIND_SHARE_RECEIPT, 'share-receipt', limit);
  return rows.map((event) => {
    try { return { ...JSON.parse(event.content || '{}'), nostrEventId: event.id, nostrPubkey: event.pubkey }; }
    catch { return null; }
  }).filter((row) => row && (!shareId || row.shareId === shareId));
}
