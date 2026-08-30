/**
 * Offline Storage — IndexedDB Sync Queue + CacheStorage Companion
 * ================================================================
 * Provides full offline capability for EONAPP.CH.
 *
 * ARCHITECTURE:
 * - IndexedDB "eon-offline-db" for structured persistent storage
 *   - Object store "kv"    : generic key-value pairs (vault summaries, user prefs)
 *   - Object store "queue" : pending outbound operations (publish, reconcile, etc.)
 *   - Object store "offers": swap offer cache with TTL index
 *
 * - Sync queue: operations queued while offline drain automatically when online
 * - Background sync: registers with Service Worker when available (falls back to
 *   online event listener)
 *
 * USAGE:
 *   import { offlineStorage } from './offline-storage.js';
 *   await offlineStorage.set('vault:summary', { ... });
 *   const summary = await offlineStorage.get('vault:summary');
 *   await offlineStorage.queue({ type: 'swap:publish', data: { ... } });
 *
 * @module utils/offline-storage
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

const DB_NAME     = 'eon-offline-db';
const DB_VERSION  = 2;
const STORE_KV    = 'kv';
const STORE_QUEUE = 'queue';
const STORE_CACHE = 'offline-cache';

const _MAX_QUEUE_SIZE   = 500;
const _MAX_KV_ENTRIES   = 2000;
const DEFAULT_TTL_MS   = 7 * 24 * 60 * 60 * 1000; // 7 days
const SW_SYNC_TAG      = 'eon-offline-sync';
const ONLINE_DEBOUNCE_MS = 2000;

void _MAX_QUEUE_SIZE;
void _MAX_KV_ENTRIES;

// ─── DB helpers ────────────────────────────────────────────────────────────────

/** @type {IDBDatabase | null} */
let _db = null;
/** @type {Promise<IDBDatabase> | null} */
let _dbPromise = null;

function _openDB() {
  if (_db) return Promise.resolve(_db);
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (/** @type {any} */ event) => {
      const db = /** @type {IDBDatabase} */ (/** @type {any} */ (event).target.result);
      const oldVer = event.oldVersion;

      // KV store: generic key-value with TTL
      if (!db.objectStoreNames.contains(STORE_KV)) {
        const kv = db.createObjectStore(STORE_KV, { keyPath: 'key' });
        kv.createIndex('expiresAt', 'expiresAt');
      }

      // Queue store: pending operations
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const q = db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        q.createIndex('type', 'type');
        q.createIndex('createdAt', 'createdAt');
      }

      // Offline cache store (for versioned asset caching metadata)
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        const c = db.createObjectStore(STORE_CACHE, { keyPath: 'url' });
        c.createIndex('cachedAt', 'cachedAt');
      }

      void oldVer;
    };
    req.onsuccess  = (/** @type {any} */ e) => { _db = /** @type {any} */ (e.target).result; resolve(_db); };
    req.onerror    = (/** @type {any} */ e) => reject(/** @type {any} */ (e.target).error);
  });
  return _dbPromise;
}

/* global IDBRequest */
async function _tx(/** @type {any} */ storeName, /** @type {any} */ mode, /** @type {any} */ fn) {
  const db = await _openDB();
  return new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    const tx  = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let /** @type {any} */
result;
    try { result = fn(store); } catch (/** @type {any} */
err) { reject(err); return; }
    if (result instanceof IDBRequest) {
      result.onsuccess = () => resolve(result.result);
      result.onerror   = () => reject(result.error);
    } else {
      tx.oncomplete = () => resolve(result);
      tx.onerror    = () => reject(tx.error);
    }
  });
}

// ─── KV store ──────────────────────────────────────────────────────────────────

/**
 * Store a value in the offline KV store.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlMs] - Optional TTL in ms (default 7 days)
 */
async function kvSet(/** @type {any} */ key, /** @type {any} */ value, /** @type {any} */ ttlMs = DEFAULT_TTL_MS) {
  const /** @type {any} */
entry = {
    key: String(key),
    value,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  await _tx(STORE_KV, 'readwrite', (/** @type {any} */ store) => store.put(entry));
  // Evict expired entries occasionally
  _evictExpiredKV().catch(() => { /* non-fatal */ });
}

/**
 * Retrieve a value from the offline KV store.
 * Returns null if not found or expired.
 * @param {string} key
 * @returns {Promise<any>}
 */
async function kvGet(/** @type {any} */ key) {
  const entry = /** @type {any} */ (await _tx(STORE_KV, 'readonly', (/** @type {any} */ store) => store.get(String(key))));
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    await _tx(STORE_KV, 'readwrite', (/** @type {any} */ store) => store.delete(String(key)));
    return null;
  }
  return entry.value;
}

/**
 * Delete a KV entry.
 * @param {string} key
 */
async function kvDelete(/** @type {any} */ key) {
  await _tx(STORE_KV, 'readwrite', (/** @type {any} */ store) => store.delete(String(key)));
}

/** Evict expired KV entries. */
async function _evictExpiredKV() {
  const db = await _openDB();
  return new Promise((/** @type {any} */ resolve) => {
    const tx    = db.transaction(STORE_KV, 'readwrite');
    const store = tx.objectStore(STORE_KV);
    const index = store.index('expiresAt');
    const now   = Date.now();
    const range = IDBKeyRange.upperBound(now);
    const req   = index.openCursor(range);
    req.onsuccess = (/** @type {any} */ e) => {
      const cursor = e.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
    tx.oncomplete = () => resolve(undefined);
    tx.onerror    = () => resolve(undefined);
  });
}

// ─── Sync queue ────────────────────────────────────────────────────────────────

/**
 * Enqueue an operation for later sync.
 * When online (or SW background sync fires) the queue is drained.
 *
 * @param {object} op
 * @param {string} op.type   - Operation type (e.g. 'swap:publish', 'vault:update')
 * @param {any}    op.data   - Payload
 * @param {number} [op.maxRetries] - Max retry attempts (default 3)
 * @returns {Promise<number>} Assigned queue ID
 */
async function enqueue(/** @type {any} */ op) {
  const /** @type {any} */
entry = {
    type: String(op.type || 'unknown'),
    data: op.data || {},
    retries: 0,
    maxRetries: typeof op.maxRetries === 'number' ? op.maxRetries : 3,
    createdAt: Date.now(),
    lastAttemptAt: null,
  };
  const id = /** @type {number} */ (await _tx(STORE_QUEUE, 'readwrite', (/** @type {any} */ store) => store.add(entry)));
  // Try to drain immediately if online
  if (navigator.onLine) {
    _scheduleDrain();
  }
  return id;
}

/**
 * Get all pending queue items.
 * @returns {Promise<any[]>}
 */
async function getPendingOps() {
  const db = await _openDB();
  return new Promise((/** @type {any} */ resolve) => {
    const tx   = db.transaction(STORE_QUEUE, 'readonly');
    const req  = tx.objectStore(STORE_QUEUE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

/**
 * Remove a queue item after successful processing.
 * @param {number} id
 */
async function dequeue(/** @type {any} */ id) {
  await _tx(STORE_QUEUE, 'readwrite', (/** @type {any} */ store) => store.delete(id));
}

/**
 * Update retry count on a failed queue item.
 * Removes item if max retries reached.
 * @param {number} id
 * @param {any} item
 */
async function _updateQueueItemRetry(/** @type {any} */ id, /** @type {any} */ item) {
  item.retries = (item.retries || 0) + 1;
  item.lastAttemptAt = Date.now();
  if (item.retries >= item.maxRetries) {
    await dequeue(id);
  } else {
    const db = await _openDB();
    await new Promise((/** @type {any} */ resolve) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      tx.objectStore(STORE_QUEUE).put({ ...item, id });
      tx.oncomplete = resolve;
      tx.onerror    = resolve;
    });
  }
}

// ─── Drain loop ────────────────────────────────────────────────────────────────

/** @type {ReturnType<typeof setTimeout> | null} */
let _drainTimer = null;
/** @type {Map<string, (op: any) => Promise<boolean>>} */
const /** @type {any} */
_handlers = new Map();

/** Schedule a drain with debounce */
function _scheduleDrain(/** @type {any} */ delayMs = ONLINE_DEBOUNCE_MS) {
  if (_drainTimer) clearTimeout(_drainTimer);
  _drainTimer = setTimeout(() => { _drainTimer = null; drainQueue().catch(() => {}); }, delayMs);
}

/**
 * Register a handler for a queue operation type.
 * Handler returns true if op was processed successfully, false to retry.
 *
 * @param {string} type
 * @param {(op: any) => Promise<boolean>} handler
 */
export function registerSyncHandler(/** @type {any} */ type, /** @type {any} */ handler) {
  _handlers.set(String(type), handler);
}

/**
 * Drain the sync queue, calling registered handlers for each item.
 * Called automatically on online event and by SW background sync.
 *
 * @returns {Promise<{ processed: number, failed: number, remaining: number }>}
 */
export async function drainQueue() {
  const pending = await getPendingOps();
  if (pending.length === 0) return { processed: 0, failed: 0, remaining: 0 };

  let processed = 0, failed = 0;

  for (const /** @type {any} */
item of pending) {
    const handler = _handlers.get(item.type);
    if (!handler) {
      // No handler registered — skip (don't consume retries)
      continue;
    }
    try {
      const ok = await handler(item.data);
      if (ok) { await dequeue(item.id); processed++; }
      else { await _updateQueueItemRetry(item.id, item); failed++; }
    } catch {
      await _updateQueueItemRetry(item.id, item);
      failed++;
    }
  }

  const remaining = (await getPendingOps()).length;
  return { processed, failed, remaining };
}

// ─── Offline cache metadata ────────────────────────────────────────────────────

/**
 * Record that a URL was successfully cached by the Service Worker.
 * @param {string} url
 * @param {number} [ttlMs]
 */
async function markCached(/** @type {any} */ url, /** @type {any} */ ttlMs = DEFAULT_TTL_MS) {
  await _tx(STORE_CACHE, 'readwrite', (/** @type {any} */ store) => store.put({
    url: String(url),
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  }));
}

/**
 * Check if a URL is recorded as cached.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isCached(/** @type {any} */ url) {
  const entry = /** @type {any} */ (await _tx(STORE_CACHE, 'readonly', (/** @type {any} */ store) => store.get(String(url))));
  if (!entry) return false;
  return entry.expiresAt > Date.now();
}

// ─── Online/offline event wiring ───────────────────────────────────────────────

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', () => {
    _scheduleDrain(ONLINE_DEBOUNCE_MS);
    // Register SW background sync if supported
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready
        .then(/** @type {any} */ reg => {
          if (/** @type {any} */ (reg).sync) {
            return /** @type {any} */ (reg).sync.register(SW_SYNC_TAG);
          }
        })
        .catch(() => { /* SW sync not supported */ });
    }
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const /** @type {any} */
offlineStorage = {
  /**
   * Get a value from offline KV store.
   * @param {string} key
   * @returns {Promise<any>}
   */
  get: kvGet,

  /**
   * Set a value in offline KV store.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs]
   */
  set: kvSet,

  /**
   * Delete a value from offline KV store.
   * @param {string} key
   */
  delete: kvDelete,

  /**
   * Queue an operation for deferred sync.
   * @param {{ type: string, data: any, maxRetries?: number }} op
   * @returns {Promise<number>} Queue item ID
   */
  queue: enqueue,

  /**
   * Drain the sync queue manually.
   * @returns {Promise<{ processed: number, failed: number, remaining: number }>}
   */
  drain: drainQueue,

  /**
   * Get count of pending queue items.
   * @returns {Promise<number>}
   */
  async pendingCount() {
    const items = await getPendingOps();
    return items.length;
  },

  /**
   * Check if a URL is cached offline.
   * @param {string} url
   */
  isCached,

  /**
   * Mark a URL as cached.
   * @param {string} url
   * @param {number} [ttlMs]
   */
  markCached,

  /**
   * Register a sync handler for a queue operation type.
   * @param {string} type
   * @param {(data: any) => Promise<boolean>} handler
   */
  onSync: registerSyncHandler,

  /**
   * Get current offline storage status.
   * @returns {Promise<{ online: boolean, pendingOps: number, dbAvailable: boolean }>}
   */
  async status() {
    const online = navigator.onLine;
    let pendingOps = 0;
    let dbAvailable = false;
    try {
      await _openDB();
      dbAvailable = true;
      const items = await getPendingOps();
      pendingOps = items.length;
    } catch { /* DB not available */ }
    return { online, pendingOps, dbAvailable };
  },
};

