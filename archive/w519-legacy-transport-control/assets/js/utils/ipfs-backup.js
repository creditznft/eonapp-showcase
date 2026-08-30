/**
 * IPFS Backup — Encrypted user data backup to IPFS
 * ===================================================
 * Provides encrypted backup/restore of vault data, Pool Points, NFTs,
 * and user preferences to IPFS via local Kubo node or public gateways.
 *
 * Architecture:
 * - Data is AES-GCM encrypted before upload (user's vault key)
 * - IPFS CID is the restore key (no server knows the content)
 * - Optional Nostr broadcast of CID for cross-device discovery
 *
 * @module utils/ipfs-backup
 */

const IPFS_LOCAL_API = 'http://127.0.0.1:5001';
const /** @type {any} */
IPFS_PUBLIC_GATEWAYS = [
  'https://ipfs.io',
  'https://dweb.link',
  'https://w3s.link',
  'https://cloudflare-ipfs.com'
];
const BACKUP_VERSION = 1;
const LS_BACKUP_META = 'eon:ipfs-backup:meta:v1';

// -- Helpers --

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

async function deriveVaultKey(/** @type {any} */ password, /** @type {any} */ salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBackup(/** @type {any} */ data, /** @type {any} */ password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(password, Array.from(salt).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join(''));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    v: BACKUP_VERSION,
    salt: Array.from(salt),
    iv: Array.from(iv),
    ct: Array.from(new Uint8Array(ciphertext)),
    ts: Date.now()
  };
}

async function decryptBackup(/** @type {any} */ encrypted, /** @type {any} */ password) {
  const saltHex = Array.from(encrypted.salt).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
  const key = await deriveVaultKey(password, saltHex);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    new Uint8Array(encrypted.ct)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// -- IPFS upload/download --

async function uploadToLocalNode(/** @type {any} */ data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob);
  try {
    const resp = await fetch(`${IPFS_LOCAL_API}/api/v0/add`, { method: 'POST', body: formData });
    if (!resp.ok) return null;
    const result = await resp.json();
    return result.Hash || null;
  } catch { return null; }
}

async function uploadToPublicGateway(/** @type {any} */ _data) {
  // Try nft.storage / web3.storage style pinning endpoints
  // Falls back to simple add via public API if available
  return null; // Public write requires API key — user configures their own
}

async function downloadFromGateway(/** @type {any} */ cid) {
  for (const /** @type {any} */
gateway of IPFS_PUBLIC_GATEWAYS) {
    try {
      const resp = await fetch(`${gateway}/ipfs/${cid}`, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) return await resp.json();
    } catch { continue; }
  }
  // Try local node
  try {
    const resp = await fetch(`${IPFS_LOCAL_API}/api/v0/cat?arg=${cid}`, { method: 'POST' });
    if (resp.ok) return await resp.json();
  } catch {}
  return null;
}

// -- Collect all user data for backup --

function collectUserData() {
  const /** @type {any} */
keys = [
    'eon:vault:v1', 'eon:profile:v1', 'eon:wallet:v1', 'eon:pool-points:v1',
    'eon:entitlements:v1', 'eon:subscription:v1', 'eon:iot:devices:v1',
    'eon:iot:rules:v1', 'eon:iot:scenes:v1', 'eon:nft-collection:v1',
    'eon:lang:preference:v1', 'eon:lang:cache:v1', 'eon:voice:prefs:v1',
    'eon:skill-tree:v1', 'eon:xp:v1', 'eon:marketplace:v1',
    'eon:bounty-board:v1', 'eon:constitution:v1', 'eon:twin:v1',
    'eon:community-triggers:v1', 'eon:realm-parcels:v1', 'eon:realm-events:v1',
    'eon:district-traffic:v1', 'eon:creator-pool:v1', 'eon:compute-provider:v1',
    'eon:nostr-keypair-v2', 'eon:analytics:v1'
  ];
  const /** @type {any} */
data = {};
  for (const /** @type {any} */
key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) (/** @type {any} */ (data))[key] = JSON.parse(raw);
    } catch {}
  }
  return data;
}

// -- Public API --

/**
 * Create an encrypted backup of all user data to IPFS.
 * @param {string} password - User-provided encryption password
 * @returns {Promise<{ cid: string|null, error?: string }>}
 */
export async function createBackup(/** @type {any} */ password) {
  if (!password || password.length < 8) return { cid: null, error: 'Password must be at least 8 characters' };

  const userData = collectUserData();
  if (Object.keys(userData).length === 0) return { cid: null, error: 'No user data found to backup' };

  const encrypted = await encryptBackup(userData, password);

  // Try local IPFS node first, then public gateway
  let cid = await uploadToLocalNode(encrypted);
  if (!cid) cid = await uploadToPublicGateway(encrypted);

  if (cid) {
    const /** @type {any} */
meta = { cid, ts: Date.now(), keys: Object.keys(userData).length, version: BACKUP_VERSION };
    saveJson(LS_BACKUP_META, meta);
    return { cid };
  }

  // If no IPFS node available, store encrypted backup locally as fallback
  saveJson('eon:ipfs-backup:local-fallback', encrypted);
  return { cid: null, error: 'No IPFS node available — backup saved locally as fallback' };
}

/**
 * Restore user data from an IPFS CID using the encryption password.
 * @param {string} cid - IPFS content identifier
 * @param {string} password - Encryption password used during backup
 * @returns {Promise<{ restored: number, error?: string }>}
 */
export async function restoreBackup(/** @type {any} */ cid, /** @type {any} */ password) {
  if (!cid || !password) return { restored: 0, error: 'CID and password required' };

  // Try to download from IPFS
  let encrypted = await downloadFromGateway(cid);

  // Fallback to local fallback
  if (!encrypted) encrypted = loadJson('eon:ipfs-backup:local-fallback', null);
  if (!encrypted) return { restored: 0, error: 'Backup not found on IPFS or locally' };

  try {
    const data = await decryptBackup(encrypted, password);
    if (!data || typeof data !== 'object') return { restored: 0, error: 'Decryption failed — wrong password?' };

    let restored = 0;
    for (const [key, value] of Object.entries(data)) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        restored++;
      } catch {}
    }
    return { restored };
  } catch {
    return { restored: 0, error: 'Decryption failed — wrong password or corrupted backup' };
  }
}

/**
 * Get metadata about the last backup.
 * @returns {{ cid: string, ts: number, keys: number, version: number }|null}
 */
export function getBackupMeta() {
  return loadJson(LS_BACKUP_META, null);
}

/**
 * Get the list of public IPFS gateways for manual CID access.
 * @returns {string[]}
 */
export function getPublicGateways() {
  return [...IPFS_PUBLIC_GATEWAYS];
}
