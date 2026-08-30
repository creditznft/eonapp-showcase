/**
 * P2P Async Multiplayer — Decentralized Challenge Duel System
 * =============================================================
 * Adapted from eonpackage's P2PMultiplayerService_V5.ts (signaling layer replaced with URL encoding)
 *
 * ARCHITECTURE — THREE TIERS:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TIER 0: URL-only async challenges  ← PRIMARY, ZERO DEPENDENCY │
 * │  buildChallengeUrl() encodes all challenge data into a URL.     │
 * │  Share via WhatsApp, Discord, Twitter, QR code — anything.     │
 * │  Recipient plays the same deterministic seed. Scores compared. │
 * │  Works FOREVER with zero servers, zero hosting, zero relays.   │
 * └─────────────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TIER 1: Nostr relay discovery  ← OPTIONAL, no hosting needed  │
 * │  Module: p2p-nostr.js                                           │
 * │  Protocol: Nostr (NIP-01) over public WebSocket relays          │
 * │  50+ independent public relays worldwide (relay.damus.io, etc) │
 * │  Used for: "Browse open challenges" discovery board only       │
 * └─────────────────────────────────────────────────────────────────┘
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  TIER 2: GunDB  ← OPTIONAL, legacy compatibility               │
 * │  Uses two community relays (relay.peer.ooo, peer.wallie.io)    │
 * │  Wrapped in try/catch — failure is fully silent                │
 * │  Status: will be replaced by Tier 1 Nostr in next build wave   │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Trust model: both players play the same deterministic seed = same game = fair comparison.
 * No wallet, no auth, no server needed. UID is pseudonymous identity stored in localStorage.
 */

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

/**
 * @module utils/p2p-multiplayer
 */

import { buildPublicAlias, normalizeIdentityId } from './identity.js';

// ─── GunDB configuration (shared settings with p2p-discovery) ─────────────────

const GUN_CDN_URL = 'https://cdn.jsdelivr.net/npm/gun/gun.js';
const GUN_CDN_SRI = 'sha384-kbwmlcfKNZA6XzoIlQUaH+9lLpNh5TWrzzDmSlCpY48SEs49CCDQs50Q6x2xAl4v';
const GUN_NAMESPACE = 'eonapp-challenges-v1';

/** @type {string[]} */
const /** @type {any} */
DEFAULT_RELAY_PEERS = [
  'https://relay.peer.ooo/gun',
  'https://peer.wallie.io/gun'
];

// ─── Challenge constants ───────────────────────────────────────────────────────

const CHALLENGE_TTL_MS     = 48 * 60 * 60 * 1000; // 48 hours
const MAX_CHALLENGES_PER_UID = 5;
const MAX_BROWSE_RESULTS    = 100;
const MAX_DUEL_PARAM_LENGTH = 1800;
const LS_CHALLENGES_KEY     = 'eon-mp-challenges-v1';
const LS_MY_CHALLENGES_KEY  = 'eon-mp-my-challenges-v1';
const LS_INBOX_KEY          = 'eon-mp-inbox-v1';
const MAX_RELAY_RETRIES     = 5;
const MAX_RELAY_DELAY_MS    = 30000;
const BASE_RELAY_DELAY_MS   = 1000;

// ─── Module state ─────────────────────────────────────────────────────────────

/** @type {any} */
let _gun = null;
/** @type {Promise<any> | null} */
let _gunLoadPromise = null;
/** @type {string[]} */
let /** @type {any} */
_customRelayPeers = [];
let _isOnline     = false;
let _enabled      = true;

/** @param {string | unknown} url */
function _normalizeRelayPeer(/** @type {any} */ url) {
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

// ─── Seeded PRNG — mulberry32 ─────────────────────────────────────────────────

/**
 * Creates a deterministic pseudo-random number generator from a 32-bit seed.
 * Both players must use the SAME seed to get the same sequence of random numbers.
 *
 * Adapted from: https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 * mulberry32 passes PractRand and is suitable for game use.
 *
 * @param {number} seed - 32-bit integer seed (use generateChallengeSeed() for fresh seeds)
 * @returns {function(): number} PRNG function returning [0, 1) values
 */
/** @param {number} seed */
export function mulberry32(/** @type {any} */ seed) {
  let s = seed >>> 0; // force unsigned 32-bit
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a random 32-bit seed suitable for a challenge.
 * Uses crypto.getRandomValues when available (secure), falls back to Math.random.
 * @returns {number} Positive 32-bit integer
 */
export function generateChallengeSeed() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] >>> 0;
  }
  const arr = new Uint32Array(1);
  const seed = Date.now() ^ (arr[0] || 0);
  return (Math.imul(seed, 0x5DEECE66D) >>> 0);
}

// ─── GunDB loader (same pattern as p2p-discovery) ─────────────────────────────

/**
 * Override relay peers before any Gun operations.
 * Call before postChallenge() or browseOpenChallenges().
 * @param {string[]} peers - Gun relay URLs (https://)
 */
/** @param {unknown[]} peers */
export function setCustomRelayPeers(/** @type {any} */ peers) {
  if (!Array.isArray(peers)) return;
  /** @type {string[]} */
  const /** @type {any} */
unique = [];
  const /** @type {any} */
seen = new Set();
  peers.forEach((/** @type {any} */ peer) => {
    const normalized = _normalizeRelayPeer(peer);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });
  _customRelayPeers = unique.slice(0, 12);
}

function _getRelayPeers() {
  return _customRelayPeers.length > 0 ? _customRelayPeers : DEFAULT_RELAY_PEERS;
}

/** @param {string} message */
function _showRelayFallbackMessage(/** @type {any} */ message) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (!body) return;
  const id = 'eon-mp-relay-fallback';
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
      if (appWin.Gun) resolve(appWin.Gun);
      else reject(new Error('GunDB script loaded but appWin.Gun is undefined.'));
    };
    script.onerror = () => reject(new Error('Failed to load GunDB from CDN.'));
    document.head.appendChild(script);
  });
}

async function _getGun() {
  if (_gun) return _gun;
  if (_gunLoadPromise) return _gunLoadPromise;

  _gunLoadPromise = (async () => {
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RELAY_RETRIES; attempt += 1) {
      try {
        const Gun = await _loadGunScript();
        const peers = _getRelayPeers();
        _gun = Gun({ peers, localStorage: false, radisk: false });
        _gun.on('hi', () => { _isOnline = true; });
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
    _showRelayFallbackMessage('Multiplayer relays are unavailable. URL challenges still work in local mode.');
    _gunLoadPromise = null;
    throw lastError || new Error('Multiplayer relay connection failed.');
  })();

  return _gunLoadPromise;
}

// ─── Local cache helpers ───────────────────────────────────────────────────────

/** @param {string} key */
function _readLocalCache(/** @type {any} */ key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** @param {string} key @param {unknown} data */
function _writeLocalCache(/** @type {any} */ key, /** @type {any} */ data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full — silently skip
  }
}

// ─── Challenge ID generator ────────────────────────────────────────────────────

function _generateChallengeId() {
  const timestamp = Date.now().toString(36);
  const rand = crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'');
  return `c-${timestamp}-${rand}`;
}

// ─── Expiry helpers ────────────────────────────────────────────────────────────

/** @param {{expiresAt?: number}} challenge */
function _isExpired(/** @type {any} */ challenge) {
  if (!challenge || typeof challenge.expiresAt !== 'number') return true;
  return challenge.expiresAt < Date.now();
}

/** @param {unknown} challenge */
function _isValidChallenge(/** @type {any} */ challenge) {
  if (!challenge || typeof challenge !== 'object') return false;
  if (typeof (/** @type {any} */ (challenge)).id !== 'string' || !(/** @type {any} */ (challenge)).id) return false;
  if (typeof (/** @type {any} */ (challenge)).gameId !== 'string' || !(/** @type {any} */ (challenge)).gameId) return false;
  if (typeof (/** @type {any} */ (challenge)).uid !== 'string' || !(/** @type {any} */ (challenge)).uid) return false;
  if (typeof (/** @type {any} */ (challenge)).score !== 'number') return false;
  if ((/** @type {any} */ (challenge)).status !== 'open') return false;
  if (_isExpired(challenge)) return false;
  return true;
}

// ─── Rate limit helpers ────────────────────────────────────────────────────────

/** @param {string} uid */
function _countMyChallenges(/** @type {any} */ uid) {
  const cache = _readLocalCache(LS_MY_CHALLENGES_KEY);
  const mine = Object.values(cache).filter(
    (/** @type {any} */ c) => c.uid === uid && c.status === 'open' && !_isExpired(c)
  );
  return mine.length;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Post a challenge to the P2P network.
 * Both players will play the SAME seed — whoever scores higher wins.
 *
 * @param {object} params
 * @param {string} params.gameId     - Game identifier ('reaction-sprint' | 'word-blitz' | etc.)
 * @param {number} params.seed       - Seeded PRNG seed (use generateChallengeSeed())
 * @param {number} params.score      - Challenger's score (to beat)
 * @param {string} params.uid        - Challenger's UID
 * @param {string} [params.alias]    - Legacy parameter; remote display is derived from generated identity
 * @param {object} [params.meta]     - Extra game-specific data (grade, guesses, etc.)
 * @returns {Promise<{success: boolean, challengeId?: string, challengeUrl?: string, error?: string}>}
 */
/**
 * @param {object} params
 * @param {string} params.gameId
 * @param {number} params.seed
 * @param {number} params.score
 * @param {string} params.uid
 * @param {string} [params.alias]
 * @param {object} [params.meta]
 */
export async function postChallenge(/** @type {any} */ { gameId, seed, score, uid, alias: _alias = 'Anonymous', meta = {} }) {
  // Input validation
  if (!gameId || typeof gameId !== 'string') return { success: false, error: 'Invalid gameId.' };
  if (typeof seed !== 'number' || seed < 0) return { success: false, error: 'Invalid seed.' };
  if (typeof score !== 'number') return { success: false, error: 'Invalid score.' };
  if (!uid || typeof uid !== 'string') return { success: false, error: 'Invalid uid.' };

  // Sanitize alias (prevent XSS through GunDB broadcast)
  const safeAlias = buildPublicAlias(uid, normalizeIdentityId(uid) || uid);

  // Rate limit check
  if (_countMyChallenges(uid) >= MAX_CHALLENGES_PER_UID) {
    return { success: false, error: `Maximum ${MAX_CHALLENGES_PER_UID} open challenges reached. Withdraw one first.` };
  }

  const id = _generateChallengeId();
  const now = Date.now();
  const expiresAt = now + CHALLENGE_TTL_MS;

  const /** @type {any} */
record = {
    id,
    gameId,
    seed,
    score,
    uid,
    alias: safeAlias,
    meta: JSON.stringify(meta).slice(0, 512), // limit metadata size
    createdAt: now,
    expiresAt,
    status: 'open'
  };

  // Build challenge URL
  const challengeUrl = buildChallengeUrl(record);

  // Store locally first (works offline)
  const localCache = _readLocalCache(LS_MY_CHALLENGES_KEY);
  localCache[id] = record;
  _writeLocalCache(LS_MY_CHALLENGES_KEY, localCache);

  // Broadcast to GunDB if enabled
  if (_enabled) {
    try {
      const gun = await _getGun();
      await new Promise((/** @type {any} */ resolve) => {
        const timeoutId = setTimeout(resolve, 3000);
        gun.get(GUN_NAMESPACE).get(gameId).get(id).put(record, (/** @type {any} */ ack) => {
          clearTimeout(timeoutId);
          resolve(ack);
        });
      });
    } catch {
      // GunDB unavailable — challenge is still stored locally, URL still works
    }
  }

  return { success: true, challengeId: id, challengeUrl };
}

/**
 * Browse open challenges for a specific game from the P2P network.
 * Falls back to local cache if GunDB is unavailable.
 *
 * @param {string} gameId - Game identifier to browse challenges for
 * @param {object} [opts]
 * @param {string} [opts.excludeUid] - Exclude challenges from this UID (to hide own challenges)
 * @returns {Promise<Array<{id, gameId, seed, score, uid, alias, meta, createdAt, expiresAt, challengeUrl}>>}
 */
/**
 * @param {string} gameId
 * @param {object} [opts]
 * @param {string} [opts.excludeUid]
 */
export async function browseOpenChallenges(/** @type {any} */ gameId, /** @type {any} */ { excludeUid = '' } = {}) {
  if (!gameId) return [];

  const /** @type {any} */
results = [];

  // Start with local cache
  const localCache = _readLocalCache(LS_CHALLENGES_KEY);
  for (const /** @type {any} */
record of Object.values(localCache)) {
    if (!_isValidChallenge(record)) continue;
    if (record.gameId !== gameId) continue;
    if (excludeUid && record.uid === excludeUid) continue;
    results.push({ ...record, challengeUrl: buildChallengeUrl(record) });
  }

  // Fetch from GunDB
  if (_enabled) {
    try {
      const gun = await _getGun();
      const fresh = await new Promise((/** @type {any} */ resolve) => {
        const /** @type {any} */
found = {};
        setTimeout(() => resolve(found), 2500);
        gun.get(GUN_NAMESPACE).get(gameId).map().once((/** @type {any} */ data, /** @type {any} */ key) => {
          if (_isValidChallenge(data)) {
            (/** @type {any} */ (found))[key] = data;
          }
        });
        // GunDB's .map().once() fires synchronously for cached data, then async for network
      });

      // Merge with results, avoiding duplicates
      const /** @type {any} */
existingIds = new Set(results.map((/** @type {any} */ r) => r.id));
      for (const /** @type {any} */
record of Object.values(fresh)) {
        if (!existingIds.has(record.id) && record.gameId === gameId) {
          if (excludeUid && record.uid === excludeUid) continue;
          results.push({ ...record, challengeUrl: buildChallengeUrl(record) });
        }
      }

      // Update local cache with fresh data
      const /** @type {any} */
updatedCache = { ...localCache };
      for (const [k, v] of Object.entries(fresh)) {
        updatedCache[k] = v;
      }
      _writeLocalCache(LS_CHALLENGES_KEY, updatedCache);

    } catch {
      // GunDB unavailable — return what we have from local cache
    }
  }

  // Sort by recency, deduplicate, trim to limit
  const /** @type {any} */
seen = new Set();
  const deduped = results
    .filter((/** @type {any} */ r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b.createdAt - a.createdAt)
    .slice(0, MAX_BROWSE_RESULTS);

  return deduped;
}

/**
 * Accept (play against) a challenge and record the result.
 * Call this AFTER the player has finished playing with the challenge seed.
 *
 * @param {object} params
 * @param {string} params.challengeId  - ID of the challenge being accepted
 * @param {string} params.gameId       - Game identifier
 * @param {number} params.myScore      - The acceptor's score
 * @param {string} params.uid          - Acceptor's UID
 * @param {string} [params.alias]      - Legacy parameter; remote display is derived from generated identity
 * @param {object} [params.meta]       - Extra game-specific data
 * @returns {{won: boolean, tiedWith?: number, challengerScore: number, myScore: number, diff: number, challengerAlias: string, result: 'win'|'loss'|'tie'} | null}
 */
export function acceptChallenge(/** @type {any} */ { challengeId, gameId, myScore, uid }) {
  // Look up challenge in local caches
  const localCache   = _readLocalCache(LS_CHALLENGES_KEY);
  const myCache      = _readLocalCache(LS_MY_CHALLENGES_KEY);
  const challenge    = localCache[challengeId] || myCache[challengeId];

  if (!challenge) return null;
  if (_isExpired(challenge)) return null;

  const challengerScore = challenge.score;
  const diff = myScore - challengerScore;
  /** @type {'win'|'loss'|'tie'} */
  let result = 'tie';
  if (diff > 0) result = 'win';
  else if (diff < 0) result = 'loss';

  // Record duel result in inbox
  const /** @type {any} */
inboxRecord = {
    challengeId,
    gameId,
    challengerUid: challenge.uid,
    challengerAlias: challenge.alias,
    challengerScore,
    myScore,
    result,
    diff,
    playedAt: Date.now(),
    seed: challenge.seed
  };

  const inbox = _readLocalCache(LS_INBOX_KEY);
  inbox[`${challengeId}-vs-${uid}`] = inboxRecord;
  _writeLocalCache(LS_INBOX_KEY, inbox);

  // Broadcast acceptance to GunDB so challenger can see
  if (_enabled && _gun) {
    try {
      const /** @type {any} */
acceptanceRecord = {
        challengeId,
        gameId,
        acceptorUid: uid,
        acceptorAlias: buildPublicAlias(uid, normalizeIdentityId(uid) || uid),
        acceptorScore: myScore,
        result,
        playedAt: Date.now()
      };
      _gun.get(`${GUN_NAMESPACE}-results`).get(challengeId).get(`${uid.slice(0, 12)}`).put(acceptanceRecord);
    } catch {
      // Non-critical — local record is what matters
    }
  }

  return {
    won: result === 'win',
    result,
    challengerScore,
    myScore,
    diff,
    challengerAlias: challenge.alias
  };
}

/**
 * Withdraw (close) a challenge you posted.
 * Marks it as withdrawn locally and broadcasts to GunDB.
 * @param {string} challengeId - ID of the challenge to withdraw
 * @param {string} uid - Must match the challenge's uid
 * @returns {Promise<boolean>} true if withdrawn, false if not found or uid mismatch
 */
export async function withdrawChallenge(/** @type {any} */ challengeId, /** @type {any} */ uid) {
  const myCache = _readLocalCache(LS_MY_CHALLENGES_KEY);
  const challenge = myCache[challengeId];
  if (!challenge) return false;
  if (challenge.uid !== uid) return false;

  challenge.status = 'withdrawn';
  myCache[challengeId] = challenge;
  _writeLocalCache(LS_MY_CHALLENGES_KEY, myCache);

  if (_enabled) {
    try {
      const gun = await _getGun();
      gun.get(GUN_NAMESPACE).get(challenge.gameId).get(challengeId).put(
        { ...challenge, status: 'withdrawn' }
      );
    } catch {
      // Non-critical
    }
  }

  return true;
}

/**
 * Subscribe to new challenges posted for a specific game (live stream from GunDB).
 * @param {string} gameId - Game to subscribe to
 * @param {function(any): void} callback - Called with each new open challenge
 * @returns {Promise<function>} Unsubscribe function
 */
export async function onChallengePosted(/** @type {any} */ gameId, /** @type {any} */ callback) {
  if (!_enabled || typeof callback !== 'function') return () => {};

  try {
    const gun = await _getGun();
    const ref = gun.get(GUN_NAMESPACE).get(gameId);

    const handler = (/** @type {any} */ data) => {
      if (_isValidChallenge(data)) {
        callback({ ...data, challengeUrl: buildChallengeUrl(data) });
      }
    };

    ref.map().on(handler);

    return () => {
      try { ref.map().off(); } catch {}
    };
  } catch {
    return () => {};
  }
}

/**
 * Get your own active challenges (from local cache).
 * @param {string} uid - Your UID
 * @returns {Array<any>}
 */
export function getMyActiveChallenges(/** @type {any} */ uid) {
  if (!uid) return [];
  const cache = _readLocalCache(LS_MY_CHALLENGES_KEY);
  return Object.values(cache)
    .filter((/** @type {any} */ c) => c.uid === uid && c.status === 'open' && !_isExpired(c))
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b.createdAt - a.createdAt);
}

/**
 * Get your duel history (inbox of accepted challenges).
 * @returns {Array<any>}
 */
export function getDuelHistory() {
  const inbox = _readLocalCache(LS_INBOX_KEY);
  return Object.values(inbox)
    .sort((/** @type {any} */ a, /** @type {any} */ b) => b.playedAt - a.playedAt)
    .slice(0, 50);
}

// ─── Challenge URL encoding ────────────────────────────────────────────────────

/**
 * Builds a challenge URL that can be shared.
 * The URL contains: gameId, seed, score, uid, challengeId, expiresAt.
 * Uses URLSearchParams + btoa for compact encoding.
 *
 * Security: The URL is a BROADCAST — anyone who receives it can play the same seed.
 * There is no way to prevent a player from cheating their score; trust is social.
 * For higher-stakes games, the Worker can optionally record scores server-side.
 *
 * @param {object} challenge - Challenge record from postChallenge()
 * @returns {string} Full shareable URL
 */
export function buildChallengeUrl(/** @type {any} */ challenge) {
  const /** @type {any} */
BASE_URLS = {
    'void-raider':      '/games/void-raider.html',
    'reaction-sprint':  '/games/reaction-sprint.html',
    'word-blitz':       '/games/word-blitz.html',
    'memory-chain':     '/games/memory-chain.html',
    'neon-dash':        '/games/neon-dash.html',
    'merge-grid':       '/games/merge-grid.html',
    'color-sprint':     '/games/color-sprint.html',
    'orbit-survivor':   '/games/orbit-survivor.html',
    'tap-reactor':      '/games/tap-reactor.html',
    // Flagship games — reserved IDs for next build wave
    'dungeon-crawl-zero': '/games/dungeon-crawl-zero/',
    'neural-override':    '/games/neural-override/',
    'realm-wars-lite':    '/games/realm-wars-lite/index.html'
  };

  const basePath = BASE_URLS[challenge.gameId] || `/games/${challenge.gameId}.html`;
  const origin   = typeof location !== 'undefined' ? location.origin : 'https://eonapp.ch';

  const /** @type {any} */
payload = {
    i: challenge.id,
    g: challenge.gameId,
    s: challenge.seed,
    sc: challenge.score,
    u: challenge.uid || '',
    e: challenge.expiresAt
  };

  const encoded = btoa(JSON.stringify(payload));
  return `${origin}${basePath}?duel=${encodeURIComponent(encoded)}`;
}

/**
 * Parse a challenge URL (or the current page URL) to extract duel parameters.
 * @param {string} [url] - URL to parse (defaults to window.location.href)
 * @returns {{id: string, gameId: string, seed: number, score: number, uid: string, alias: string, expiresAt: number} | null}
 */
export function parseChallengeUrl(/** @type {any} */ url) {
  try {
    const href = url || (typeof location !== 'undefined' ? location.href : '');
    const params = new URLSearchParams(new URL(href).search);
    const encoded = params.get('duel');
    if (!encoded) return null;
    if (encoded.length > MAX_DUEL_PARAM_LENGTH) return null;

    const normalized = decodeURIComponent(encoded);
    if (!/^[A-Za-z0-9+/=_-]+$/.test(normalized) || normalized.length > MAX_DUEL_PARAM_LENGTH) {
      return null;
    }

    const payload = JSON.parse(atob(normalized));
    if (!payload.i || !payload.g || typeof payload.s !== 'number' || typeof payload.sc !== 'number') {
      return null;
    }
    if (!Number.isFinite(payload.s) || !Number.isFinite(payload.sc)) {
      return null;
    }

    // Reject expired challenges
    if (payload.e && payload.e < Date.now()) {
      return null;
    }

    return {
      id:        String(payload.i).slice(0, 120),
      gameId:    String(payload.g).slice(0, 80),
      seed:      payload.s,
      score:     payload.sc,
      uid:       normalizeIdentityId(payload.u) || '',
      alias:     normalizeIdentityId(payload.u)
        ? buildPublicAlias(payload.u, payload.u)
        : String(payload.a || 'Anonymous').slice(0, 48),
      expiresAt: payload.e || (Date.now() + CHALLENGE_TTL_MS)
    };
  } catch {
    return null;
  }
}

// ─── Status / enable-disable ──────────────────────────────────────────────────

/** Returns current P2P multiplayer status */
export function getMultiplayerStatus() {
  return {
    enabled: _enabled,
    online: _isOnline,
    pendingChallenges: Object.keys(_readLocalCache(LS_MY_CHALLENGES_KEY)).length
  };
}

/** Enable or disable P2P multiplayer (persists in localStorage) */
export function setMultiplayerEnabled(/** @type {any} */ enabled) {
  _enabled = !!enabled;
  try { localStorage.setItem('eon-mp-enabled', String(_enabled)); } catch {}
}

/** Load enabled state from localStorage */
export function initMultiplayer() {
  try {
    const saved = localStorage.getItem('eon-mp-enabled');
    _enabled = saved !== 'false'; // enabled by default
  } catch {}
}

// Auto-init
initMultiplayer();
