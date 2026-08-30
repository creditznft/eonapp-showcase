/**
 * Legacy encrypted provider-key compatibility store.
 *
 * This module is retained only to read/delete records created by older builds
 * before migration into the current secure keystore. It uses PBKDF2 plus
 * AES-GCM and MUST NOT be described as post-quantum, Dilithium, or quantum-safe.
 * New writes and independent key backup import/export are retired.
 */

const STORE_NAME = 'eon:quantum:v1';
const KEY_STORE_DB = 'eonapp-quantum-safe';
const ENCRYPTION_KEY_SALT = 'eon:quantum:derivation:salt';

/**
 * Open the legacy compatibility store for migration or deletion only.
 */
export async function initQuantumSafeKeys() {
  try {
    return await openKeyDatabase();
  } catch (/** @type {any} */
e) {
    console.warn('[LegacyKeyStore] DB init failed:', e.message);
    return null;
  }
}

/**
 * Open or create IndexedDB for encrypted key storage
 */
function openKeyDatabase() {
  return new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
    const request = indexedDB.open(KEY_STORE_DB, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (/** @type {any} */ e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'provider' });
      }
    };
  });
}

/**
 * Derive an encryption key from password and device ID
 * Uses the historical PBKDF2 parameters required to decrypt legacy records.
 * This is compatibility behavior, not a current cryptographic recommendation.
 */
async function deriveEncryptionKey(/** @type {any} */ userPassword) {
  const encoder = new TextEncoder();
  const deviceId = getOrCreateDeviceId();
  const salt = encoder.encode(ENCRYPTION_KEY_SALT + deviceId);
  const passwordBuffer = encoder.encode(userPassword);
  
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  } catch (/** @type {any} */
e) {
    console.error('[LegacyKeyStore] Key derivation failed:', e);
    throw e;
  }
}

/**
 * Get or create device ID (permanent device identifier)
 */
function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('eon:device:id');
  if (!deviceId) {
    deviceId = 'device-' + crypto.getRandomValues(new Uint8Array(16)).join('');
    try {
      localStorage.setItem('eon:device:id', deviceId);
    } catch {}
  }
  return deviceId;
}

/**
 * Decrypt API key
 */
async function decryptApiKey(/** @type {any} */ encrypted, /** @type {any} */ derivedKey) {
  try {
    const ciphertext = new Uint8Array(encrypted.ciphertext);
    const iv = new Uint8Array(encrypted.iv);
    
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      ciphertext
    );
    
    return new TextDecoder().decode(plaintext);
  } catch (/** @type {any} */
e) {
    console.error('[LegacyKeyStore] Decryption failed:', e);
    return null;
  }
}

/**
 * Store API key encrypted in IndexedDB
 */
export async function storeQuantumSafeKey() {
  const error = new Error('Legacy provider-key writes are retired. Use the current secure keystore.');
  error.code = 'legacy-provider-key-store-retired';
  throw error;
}

/**
 * Retrieve and decrypt API key from IndexedDB
 */
export async function retrieveQuantumSafeKey(/** @type {any} */ provider, /** @type {any} */ userPassword, /** @type {any} */ db) {
  try {
    if (!db) {
      db = await openKeyDatabase();
    }
    
    return new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(provider);
      
      req.onerror = () => reject(req.error);
      req.onsuccess = async () => {
        const record = req.result;
        if (!record) {
          resolve(null);
          return;
        }
        
        try {
          const derivedKey = await deriveEncryptionKey(userPassword);
          const decrypted = await decryptApiKey(record.encrypted, derivedKey);
          resolve(decrypted);
        } catch (/** @type {any} */
e) {
          reject(e);
        }
      };
    });
  } catch (/** @type {any} */
e) {
    console.error('[LegacyKeyStore] Retrieve failed:', e);
    return null;
  }
}

/**
 * Delete encrypted key from storage
 */
export async function deleteQuantumSafeKey(/** @type {any} */ provider, /** @type {any} */ db) {
  try {
    if (!db) {
      db = await openKeyDatabase();
    }
    
    return new Promise((/** @type {any} */ resolve, /** @type {any} */ reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(provider);
      
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(true);
    });
  } catch (/** @type {any} */
e) {
    console.error('[LegacyKeyStore] Delete failed:', e);
    return false;
  }
}

/**
 * Export encrypted key backup (password-protected)
 * User can save and restore on another device
 */
export async function exportKeyBackup() {
  const error = new Error('Legacy provider-key backup export is retired. Provider keys are excluded from ordinary backup and sync.');
  error.code = 'legacy-provider-key-export-retired';
  throw error;
}

/**
 * Import encrypted key backup
 */
export async function importKeyBackup() {
  const error = new Error('Legacy provider-key backup import is retired. Migrate records through the reviewed credential lifecycle.');
  error.code = 'legacy-provider-key-import-retired';
  throw error;
}

/**
 * Get security posture info
 */
export async function getQuantumSafeStatus() {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onerror = () => resolve({ enabled: false, keyCount: 0, legacyMigrationOnly: true, writable: false, exportable: false, postQuantumReady: false });
        req.onsuccess = () => resolve({
          enabled: true,
          keyCount: Array.isArray(req.result) ? req.result.length : 0,
          algorithm: 'legacy PBKDF2-SHA-256 plus AES-GCM-256',
          legacyMigrationOnly: true,
          writable: false,
          exportable: false,
          postQuantumReady: false
        });
      } catch {
        resolve({ enabled: false, keyCount: 0, legacyMigrationOnly: true, writable: false, exportable: false, postQuantumReady: false });
      }
    });
  } catch (error) {
    return {
      enabled: false,
      keyCount: 0,
      error: error?.message || 'Legacy database initialization failed',
      legacyMigrationOnly: true,
      writable: false,
      exportable: false,
      postQuantumReady: false
    };
  }
}
