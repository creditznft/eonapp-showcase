/**
 * Post-Quantum Signing Module — ML-DSA-65 (CRYSTALS-Dilithium Level 3)
 * ======================================================================
 * Implements hybrid digital signatures combining:
 *   - ML-DSA-65 (NIST FIPS 204) — quantum-resistant lattice signature
 *   - ECDSA P-256 (WebCrypto)   — classical signature for backwards compatibility
 *
 * HYBRID SIGNATURE SCHEME:
 *   A hybrid signature bundles both signatures. Verification requires BOTH to be valid.
 *   This gives security equivalent to the stronger of the two algorithms.
 *
 * KEY SIZES (ML-DSA-65 / Level 3):
 *   Public key:  1952 bytes
 *   Secret key:  4000 bytes
 *   Signature:   3309 bytes
 *
 * SESSION KEY STORAGE:
 *   Keys are stored encrypted in sessionStorage (cleared on tab close).
 *   Persistent keys (node operators, admins) are encrypted with AES-256-GCM + PBKDF2.
 *
 * @module utils/pq-signing
 * @see https://github.com/paulmillr/noble-post-quantum
 * @see https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const ML_DSA_65_PK_SIZE = 1952;
const SESSION_KEY_PREFIX = 'eon:pq-signing:';

// ─── Utility helpers ─────────────────────────────────────────────────────────

function bufToHex(/** @type {any} */ buf) {
  return Array.from(new Uint8Array(buf)).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(/** @type {any} */ hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

function toBytes(/** @type {any} */ data) {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

// ─── Classical ECDSA P-256 helpers (WebCrypto) ───────────────────────────────

async function generateECDSAKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true, ['sign', 'verify']
  );
}

async function ecdsaSign(/** @type {any} */ privateKey, /** @type {any} */ data) {
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    toBytes(data)
  );
  return new Uint8Array(sig);
}

async function ecdsaVerify(/** @type {any} */ publicKey, /** @type {any} */ signature, /** @type {any} */ data) {
  try {
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signature,
      toBytes(data)
    );
  } catch { return false; }
}

async function exportECDSAPublic(/** @type {any} */ key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw); // 65 bytes uncompressed
}

async function exportECDSAPrivate(/** @type {any} */ key) {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
  return new Uint8Array(pkcs8);
}

async function importECDSAPublic(/** @type {any} */ bytes) {
  return crypto.subtle.importKey(
    'raw', bytes, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']
    // extractable: true so exportPublicKey() works on loaded key pairs
  );
}

async function importECDSAPrivate(/** @type {any} */ bytes) {
  return crypto.subtle.importKey(
    'pkcs8', bytes, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']
  );
}

// ─── AES-GCM encryption for key persistence ─────────────────────────────────

async function encryptKeyBytes(/** @type {any} */ keyBytes, /** @type {any} */ password) {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, keyBytes);
  const out = new Uint8Array(32 + 12 + enc.byteLength);
  out.set(salt, 0); out.set(iv, 32); out.set(new Uint8Array(enc), 44);
  return btoa(String.fromCharCode(...out));
}

async function decryptKeyBytes(/** @type {any} */ b64, /** @type {any} */ password) {
  const raw = Uint8Array.from(atob(b64), /** @type {any} */ c => c.charCodeAt(0));
  const salt = raw.slice(0, 32), iv = raw.slice(32, 44), ct = raw.slice(44);
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ct);
  return new Uint8Array(dec);
}

// ─── PQSigningKeyPair class ───────────────────────────────────────────────────

/**
 * Represents a hybrid ML-DSA-65 + ECDSA P-256 key pair.
 */
export class PQSigningKeyPair {
  /**
   * @param {Uint8Array} mlDsaPublicKey
   * @param {Uint8Array} mlDsaSecretKey
   * @param {CryptoKey}  ecdsaPublicKey
   * @param {CryptoKey}  ecdsaPrivateKey
   */
  constructor(/** @type {any} */ mlDsaPublicKey, /** @type {any} */ mlDsaSecretKey, /** @type {any} */ ecdsaPublicKey, /** @type {any} */ ecdsaPrivateKey) {
    this.mlDsaPublicKey  = mlDsaPublicKey;   // 1952 bytes
    this.mlDsaSecretKey  = mlDsaSecretKey;   // 4000 bytes
    this.ecdsaPublicKey  = ecdsaPublicKey;   // CryptoKey
    this.ecdsaPrivateKey = ecdsaPrivateKey;  // CryptoKey
  }

  /** Export a serialisable public key bundle (hex) */
  async exportPublicKey() {
    const ecdsaPub = await exportECDSAPublic(this.ecdsaPublicKey);
    return {
      mlDsa: bufToHex(this.mlDsaPublicKey),
      ecdsa: bufToHex(ecdsaPub),
      algorithm: 'hybrid-ml-dsa-65+ecdsa-p256-v1'
    };
  }

  /** Export encrypted private key for persistent sessionStorage storage */
  async exportEncryptedPrivateKey(/** @type {any} */ password) {
    const ecdsaPrivBytes = await exportECDSAPrivate(this.ecdsaPrivateKey);
    const combined = JSON.stringify({
      mlDsa:  bufToHex(this.mlDsaSecretKey),
      ecdsa:  bufToHex(ecdsaPrivBytes),
    });
    return encryptKeyBytes(new TextEncoder().encode(combined), password);
  }
}

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Generate a new hybrid ML-DSA-65 + ECDSA P-256 signing key pair.
 * @returns {Promise<PQSigningKeyPair>}
 */
export async function generateSigningKeyPair() {
  // ML-DSA-65 key generation (pure JS, synchronous)
  const { publicKey: mlDsaPub, secretKey: mlDsaSec } = ml_dsa65.keygen();

  // ECDSA P-256 key generation (WebCrypto)
  const { publicKey: ecPub, privateKey: ecPriv } = await generateECDSAKeyPair();

  return new PQSigningKeyPair(mlDsaPub, mlDsaSec, ecPub, ecPriv);
}

/**
 * Create a hybrid signature for a message.
 *
 * @param {PQSigningKeyPair} keyPair
 * @param {string | Uint8Array} message
 * @returns {Promise<{
 *   mlDsa:      string,   // hex ML-DSA-65 signature (3309 bytes)
 *   ecdsa:      string,   // hex ECDSA P-256 signature
 *   algorithm:  string,
 *   timestamp:  number
 * }>}
 */
export async function sign(/** @type {any} */ keyPair, /** @type {any} */ message) {
  const msgBytes = toBytes(message);

  const mlDsaSig  = ml_dsa65.sign(msgBytes, keyPair.mlDsaSecretKey);  // v0.6.1: (msg, secretKey)
  const ecdsaSig  = await ecdsaSign(keyPair.ecdsaPrivateKey, msgBytes);

  return {
    mlDsa:     bufToHex(mlDsaSig),
    ecdsa:     bufToHex(ecdsaSig),
    algorithm: 'hybrid-ml-dsa-65+ecdsa-p256-v1',
    timestamp: Date.now()
  };
}

/**
 * Verify a hybrid signature. BOTH components must be valid.
 *
 * @param {{ mlDsa: string, ecdsa: string, algorithm: string }} signature
 * @param {string | Uint8Array} message
 * @param {{ mlDsa: string, ecdsa: string }} publicKey  — from PQSigningKeyPair.exportPublicKey()
 * @returns {Promise<{ valid: boolean, mlDsaValid: boolean, ecdsaValid: boolean }>}
 */
export async function verify(/** @type {any} */ signature, /** @type {any} */ message, /** @type {any} */ publicKey) {
  const msgBytes = toBytes(message);

  // ML-DSA-65 verification
  let mlDsaValid = false;
  try {
    mlDsaValid = ml_dsa65.verify(
      hexToBuf(signature.mlDsa),     // v0.6.1: sig first
      msgBytes,
      hexToBuf(publicKey.mlDsa)
    );
  } catch (/** @type {any} */
e) {
    console.warn('[PQSigning] ML-DSA-65 verify error:', e.message);
  }

  // ECDSA P-256 verification
  let ecdsaValid = false;
  try {
    const ecPubKey = await importECDSAPublic(hexToBuf(publicKey.ecdsa));
    ecdsaValid = await ecdsaVerify(ecPubKey, hexToBuf(signature.ecdsa), msgBytes);
  } catch (/** @type {any} */
e) {
    console.warn('[PQSigning] ECDSA verify error:', e.message);
  }

  return {
    valid:      mlDsaValid && ecdsaValid,
    mlDsaValid,
    ecdsaValid
  };
}

/**
 * Verify only the ML-DSA-65 component (for PQ-only verification contexts).
 */
export function verifyMlDsaOnly(/** @type {any} */ signature, /** @type {any} */ message, /** @type {any} */ mlDsaPublicKeyHex) {
  try {
    return ml_dsa65.verify(
      hexToBuf(signature.mlDsa),     // v0.6.1: sig first
      toBytes(message),
      hexToBuf(mlDsaPublicKeyHex)
    );
  } catch { return false; }
}

// ─── Session key management ───────────────────────────────────────────────────

/**
 * Store a signing key pair in sessionStorage under a named slot.
 * Private key is encrypted with AES-256-GCM + PBKDF2 (600k iters).
 *
 * @param {string}           slotId    — identifier for this key (e.g. 'node-operator', 'creator')
 * @param {PQSigningKeyPair} keyPair
 * @param {string}           password  — used to encrypt the private key
 */
export async function storeKeyPair(/** @type {any} */ slotId, /** @type {any} */ keyPair, /** @type {any} */ password) {
  const publicKey  = await keyPair.exportPublicKey();
  const privateEnc = await keyPair.exportEncryptedPrivateKey(password);
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${slotId}:pub`, JSON.stringify(publicKey));
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${slotId}:priv`, privateEnc);
  } catch (/** @type {any} */
e) {
    console.error('[PQSigning] Failed to store key pair:', e);
  }
}

/**
 * Load a stored signing key pair from sessionStorage.
 * Returns null if not found or decryption fails.
 *
 * @param {string} slotId
 * @param {string} password
 * @returns {Promise<PQSigningKeyPair | null>}
 */
export async function loadKeyPair(/** @type {any} */ slotId, /** @type {any} */ password) {
  try {
    const pubRaw  = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${slotId}:pub`);
    const privEnc = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${slotId}:priv`);
    if (!pubRaw || !privEnc) return null;

    const publicKeyData = JSON.parse(pubRaw);

    // Decrypt private key
    const privBytes = await decryptKeyBytes(privEnc, password);
    const privData  = JSON.parse(new TextDecoder().decode(privBytes));

    const mlDsaPublicKey  = hexToBuf(publicKeyData.mlDsa);
    const mlDsaSecretKey  = hexToBuf(privData.mlDsa);
    const ecdsaPublicKey  = await importECDSAPublic(hexToBuf(publicKeyData.ecdsa));
    const ecdsaPrivateKey = await importECDSAPrivate(hexToBuf(privData.ecdsa));

    return new PQSigningKeyPair(mlDsaPublicKey, mlDsaSecretKey, ecdsaPublicKey, ecdsaPrivateKey);
  } catch (/** @type {any} */
e) {
    console.warn('[PQSigning] Could not load key pair:', e.message);
    return null;
  }
}

/** Remove a stored key pair from session. */
export function clearKeyPair(/** @type {any} */ slotId) {
  try {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${slotId}:pub`);
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${slotId}:priv`);
  } catch {}
}

/**
 * Get or create a signing key pair for a given slot.
 * Creates a new key if none exists; stores it encrypted in sessionStorage.
 *
 * @param {string} slotId
 * @param {string} password — session-derived password (e.g. from PBKDF2(userId + sessionId))
 * @returns {Promise<PQSigningKeyPair>}
 */
export async function getOrCreateKeyPair(/** @type {any} */ slotId, /** @type {any} */ password) {
  const existing = await loadKeyPair(slotId, password);
  if (existing) return existing;

  const keyPair = await generateSigningKeyPair();
  await storeKeyPair(slotId, keyPair, password);
  return keyPair;
}

/**
 * Get the stored public key for a slot (without decrypting private key).
 * Returns null if no key stored.
 *
 * @param {string} slotId
 * @returns {{ mlDsa: string, ecdsa: string, algorithm: string } | null}
 */
export function getPublicKey(/** @type {any} */ slotId) {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${slotId}:pub`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── ML-DSA-65 public key size constant ─────────────────────────────────────
export { ML_DSA_65_PK_SIZE };
