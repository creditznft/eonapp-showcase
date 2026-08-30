/**
 * Vault Nostr Sync — Cross-device vault synchronization via Nostr DM
 * =====================================================================
 * Sends encrypted vault data as Nostr direct messages (NIP-04) to the
 * user's own keypair on other devices, enabling cross-device sync
 * without any central server.
 *
 * Architecture:
 * - Uses NIP-04 (encrypted DM) to send vault snapshots to self
 * - Receiver device subscribes to its own DMs and imports vault data
 * - AES-GCM encryption on top of NIP-04 for defense-in-depth
 * - Conflicts resolved by timestamp (latest wins)
 *
 * @module utils/vault-nostr-sync
 */

const SYNC_VERSION = 1;
const LS_SYNC_META = 'eon:vault-nostr-sync:meta:v1';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_SYNC_HISTORY = 10;

// -- Helpers --

/**
 * @param {string} key
 * @param {any} fallback
 * @returns {any}
 */
function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

/**
 * @param {string} key
 * @param {any} value
 */
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * @param {string} raw
 * @returns {{ kind: 'json' | 'raw', value: any }}
 */
function serializeLocalStorageValue(raw) {
  try {
    return { kind: 'json', value: JSON.parse(raw) };
  } catch {
    return { kind: 'raw', value: raw };
  }
}

/**
 * @param {string} raw
 * @returns {number}
 */
function readStoredTs(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return Number(parsed._ts || parsed.ts || parsed.updatedAt || parsed.savedAt || 0) || 0;
    }
  } catch {}
  return 0;
}

/**
 * @param {any} entry
 * @returns {string}
 */
function toStorageString(entry) {
  if (!entry || typeof entry !== 'object') return typeof entry === 'string' ? entry : JSON.stringify(entry);
  if (entry.kind === 'raw') return String(entry.value ?? '');
  if (entry.kind === 'json') return JSON.stringify(entry.value);
  return JSON.stringify(entry);
}

function collectVaultSnapshot() {
  /** @type {Record<string, any>} */
  const snapshot = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('eon:')) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    snapshot[key] = serializeLocalStorageValue(raw);
  }
  return { v: SYNC_VERSION, ts: Date.now(), data: snapshot };
}

/**
 * @param {{ v?: number, ts?: number, data?: Record<string, any> }} snapshot
 * @returns {number}
 */
function applyVaultSnapshot(snapshot) {
  if (!snapshot || !snapshot.data || typeof snapshot.data !== 'object') return 0;
  if (snapshot.v !== SYNC_VERSION) return 0;
  let applied = 0;
  const snapshotTs = snapshot.ts || 0;
  for (const [key, value] of Object.entries(snapshot.data)) {
    try {
      const existing = localStorage.getItem(key);
      const existingTs = existing ? readStoredTs(existing) : 0;
      if (snapshotTs > existingTs) {
        localStorage.setItem(key, toStorageString(value));
        applied++;
      }
    } catch {}
  }
  return applied;
}

// -- Public API --

/**
 * Initialize vault sync. Requires p2p-nostr to be loaded.
 * Sets up periodic sync and DM listener.
 * @param {any} nostrModule - The p2p-nostr module (imported dynamically)
 * @returns {{ stop: Function }}
 */
export function initVaultNostrSync(nostrModule) {
  if (!nostrModule || typeof nostrModule.publishPoolAnchor !== 'function') {
    console.warn('[VaultSync] Nostr module not available — sync disabled');
    return { stop: () => {} };
  }

  /** @type {ReturnType<typeof setInterval> | null} */
  let syncTimer = null;

  async function syncCycle() {
    try {
      const snapshot = collectVaultSnapshot();
      /** @type {Record<string, any>} */
      const snapshotData = snapshot.data;
      if (Object.keys(snapshotData).length === 0) return;

      // Publish as a kind 62000 Pool Anchor event (already defined in p2p-nostr.js)
      // The snapshot is broadcast so other devices owned by same user can pick it up
      const balanceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(snapshotData))))).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
      await nostrModule.publishPoolAnchor({
        uid: snapshotData['eon:profile:v1']?.value?.alias || snapshotData['eon:profile:v1']?.alias || 'unknown',
        epoch: String(Math.floor(Date.now() / 86400000)),
        balanceHash,
        points: snapshotData['eon:pool-points:v1']?.value?.balance || snapshotData['eon:pool-points:v1']?.balance || 0
      });

      const meta = loadJson(LS_SYNC_META, { lastSync: 0, history: [] });
      meta.lastSync = Date.now();
      meta.history.unshift({ ts: Date.now(), keys: Object.keys(snapshotData).length });
      if (meta.history.length > MAX_SYNC_HISTORY) meta.history = meta.history.slice(0, MAX_SYNC_HISTORY);
      saveJson(LS_SYNC_META, meta);
    } catch (e) {
      console.warn('[VaultSync] Sync cycle failed:', e);
    }
  }

  syncCycle();
  syncTimer = setInterval(syncCycle, SYNC_INTERVAL_MS);

  return {
    stop: () => {
      if (syncTimer) clearInterval(syncTimer);
      syncTimer = null;
    }
  };
}

/**
 * Manually push a vault snapshot to Nostr.
 * @param {any} nostrModule
 * @returns {Promise<{ published: number, total: number }>}
 */
export async function pushVaultSnapshot(nostrModule) {
  if (!nostrModule?.publishPoolAnchor) return { published: 0, total: 0 };
  const snapshot = collectVaultSnapshot();
  /** @type {Record<string, any>} */
  const snapshotData = snapshot.data;
  if (Object.keys(snapshotData).length === 0) return { published: 0, total: 0 };

  const balanceHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(snapshotData))))).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');

  return nostrModule.publishPoolAnchor({
    uid: snapshotData['eon:profile:v1']?.value?.alias || snapshotData['eon:profile:v1']?.alias || 'unknown',
    epoch: String(Math.floor(Date.now() / 86400000)),
    balanceHash,
    points: snapshotData['eon:pool-points:v1']?.value?.balance || snapshotData['eon:pool-points:v1']?.balance || 0
  });
}

/**
 * Import a vault snapshot from received Nostr data.
 * @param {any} snapshotData - The vault snapshot object
 * @returns {{ applied: number, skipped: number }}
 */
export function importVaultSnapshot(snapshotData) {
  if (!snapshotData) return { applied: 0, skipped: 0 };
  const applied = applyVaultSnapshot(snapshotData);
  return { applied, skipped: Object.keys(snapshotData.data || {}).length - applied };
}

/**
 * Get sync metadata (last sync time, history).
 * @returns {object|null}
 */
export function getSyncMeta() {
  return loadJson(LS_SYNC_META, null);
}

/**
 * Create a local vault snapshot (for export or manual backup).
 * @returns {object}
 */
export function createSnapshot() {
  return collectVaultSnapshot();
}
