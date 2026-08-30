/**
 * Post-Quantum Hybrid Key Encapsulation Mechanism (KEM)
 * ======================================================
 * Implements ML-KEM-768 (NIST FIPS 203, formerly Kyber-768) combined with
 * X25519 (classical ECDH) in a hybrid mode.
 *
 * SECURITY MODEL:
 *   Security requires BOTH algorithms to be broken simultaneously.
 *   - If quantum computer breaks X25519 → ML-KEM-768 still protects
 *   - If ML-KEM-768 has an undiscovered flaw → X25519 still protects
 *
 * HYBRID KEM CONSTRUCTION (following IETF draft-irtf-cfrg-hybrid):
 *   sharedSecret = HKDF-SHA256(
 *     ikm  = kyber_shared_secret || x25519_shared_secret,
 *     info = "eonapp-hybrid-kem-v1"
 *   )
 *
 * WIRE FORMAT for encapsulated key (returned by encapsulate()):
 *   [ x25519_public_key (32 bytes) || kyber_ciphertext (1088 bytes) ]
 *   Total: 1120 bytes
 *
 * KEY FORMAT for generateKeyPair():
 *   publicKey:  { kyber: Uint8Array(1184), x25519: CryptoKey }
 *   privateKey: { kyber: Uint8Array(2400), x25519: CryptoKey }
 *   publicKeyRaw: Uint8Array(1216)  [kyber_pk(1184) || x25519_pk(32)]
 *
 * @module utils/pq-hybrid-kem
 * @see https://github.com/paulmillr/noble-post-quantum
 * @see https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { x25519 } from '@noble/curves/ed25519.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const KEM_INFO = new TextEncoder().encode('eonapp-hybrid-kem-v1');
const KYBER_PK_SIZE = 1184;  // ML-KEM-768 public key bytes
const _KYBER_SK_SIZE = 2400;  // ML-KEM-768 secret key bytes (reserved for validation)
const KYBER_CT_SIZE = 1088;  // ML-KEM-768 ciphertext bytes
const X25519_KEY_SIZE = 32;  // X25519 public key bytes

void _KYBER_SK_SIZE;

// ─── HKDF helper using WebCrypto ────────────────────────────────────────────

/**
 * HKDF-SHA256 extract-and-expand.
 * @param {Uint8Array} ikm  Input key material
 * @param {Uint8Array} info Context / application label
 * @returns {Promise<Uint8Array>} 32-byte derived key
 */
async function hkdf(/** @type {any} */ ikm, /** @type {any} */ info) {
  const baseKey = await crypto.subtle.importKey(
    'raw', ikm, { name: 'HKDF' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

// ─── X25519 helpers ──────────────────────────────────────────────────────────

function generateX25519KeyPair() {
  return x25519.keygen(); // { secretKey: Uint8Array(32), publicKey: Uint8Array(32) }
}

function exportX25519Public(/** @type {{ publicKey: Uint8Array }} */ keyPair) {
  return keyPair.publicKey;
}

function x25519DH(/** @type {Uint8Array} */ secretKey, /** @type {Uint8Array} */ peerPublicBytes) {
  return x25519.getSharedSecret(secretKey, peerPublicBytes); // Uint8Array(32)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a hybrid (ML-KEM-768 + X25519) key pair.
 *
 * @returns {Promise<{
 *   publicKey:    { kyber: Uint8Array, x25519: Uint8Array },
 *   privateKey:   { kyber: Uint8Array, x25519: Uint8Array },
 *   publicKeyRaw: Uint8Array  // kyber_pk || x25519_pk (1216 bytes)
 * }>}
 */
export async function generateKeyPair() {
  // ML-KEM-768 key pair (synchronous — pure JS)
  const kyberKeys = ml_kem768.keygen();

  // X25519 key pair (pure JS — @noble/curves, no WebCrypto X25519 required)
  const x25519Pair = generateX25519KeyPair();
  const x25519PublicBytes = exportX25519Public(x25519Pair);

  // Combined raw public key for serialisation/transmission
  const publicKeyRaw = new Uint8Array(KYBER_PK_SIZE + X25519_KEY_SIZE);
  publicKeyRaw.set(kyberKeys.publicKey, 0);
  publicKeyRaw.set(x25519PublicBytes, KYBER_PK_SIZE);

  return {
    publicKey:  { kyber: kyberKeys.publicKey, x25519: x25519Pair.publicKey },
    privateKey: { kyber: kyberKeys.secretKey, x25519: x25519Pair.secretKey }, // secretKey (not privateKey)
    publicKeyRaw
  };
}

/**
 * Encapsulate — called by the sender (e.g. client connecting to a peer).
 * Produces a ciphertext and a shared secret.
 *
 * @param {Uint8Array} recipientPublicKeyRaw — raw bytes from generateKeyPair().publicKeyRaw
 * @returns {Promise<{
 *   ciphertext:   Uint8Array  // x25519_ephemeral_pk || kyber_ct (1120 bytes)
 *   sharedSecret: Uint8Array  // 32-byte HKDF-combined secret
 * }>}
 */
export async function encapsulate(/** @type {any} */ recipientPublicKeyRaw) {
  if (recipientPublicKeyRaw.length !== KYBER_PK_SIZE + X25519_KEY_SIZE) {
    throw new Error(`[PQHybridKEM] Invalid public key size: expected ${KYBER_PK_SIZE + X25519_KEY_SIZE}, got ${recipientPublicKeyRaw.length}`);
  }

  const kyberPublicKey = recipientPublicKeyRaw.slice(0, KYBER_PK_SIZE);
  const x25519PublicKey = recipientPublicKeyRaw.slice(KYBER_PK_SIZE);

  // ML-KEM-768 encapsulate → { cipherText, sharedSecret }
  const { cipherText: kyberCt, sharedSecret: kyberSS } = ml_kem768.encapsulate(kyberPublicKey);

  // X25519 ephemeral key pair + DH (pure JS)
  const ephemeral = generateX25519KeyPair();
  const ephemeralPublicBytes = exportX25519Public(ephemeral);
  const x25519SS = x25519DH(ephemeral.secretKey, x25519PublicKey); // use secretKey

  // Hybrid shared secret: HKDF(kyber_ss || x25519_ss)
  const ikmCombined = new Uint8Array(kyberSS.length + x25519SS.length);
  ikmCombined.set(kyberSS, 0);
  ikmCombined.set(x25519SS, kyberSS.length);
  const sharedSecret = await hkdf(ikmCombined, KEM_INFO);

  // Ciphertext: ephemeral_x25519_pk || kyber_ciphertext
  const ciphertext = new Uint8Array(X25519_KEY_SIZE + KYBER_CT_SIZE);
  ciphertext.set(ephemeralPublicBytes, 0);
  ciphertext.set(kyberCt, X25519_KEY_SIZE);

  return { ciphertext, sharedSecret };
}

/**
 * Decapsulate — called by the recipient to recover the shared secret.
 *
 * @param {Uint8Array} ciphertext  — from encapsulate()
 * @param {{ kyber: Uint8Array, x25519: Uint8Array }} privateKey — from generateKeyPair()
 * @returns {Promise<Uint8Array>} 32-byte shared secret (must match sender's)
 */
export async function decapsulate(/** @type {any} */ ciphertext, /** @type {any} */ privateKey) {
  if (ciphertext.length !== X25519_KEY_SIZE + KYBER_CT_SIZE) {
    throw new Error(`[PQHybridKEM] Invalid ciphertext size: expected ${X25519_KEY_SIZE + KYBER_CT_SIZE}, got ${ciphertext.length}`);
  }

  const ephemeralPublicBytes = ciphertext.slice(0, X25519_KEY_SIZE);
  const kyberCt = ciphertext.slice(X25519_KEY_SIZE);

  // ML-KEM-768 decapsulate
  const kyberSS = ml_kem768.decapsulate(kyberCt, privateKey.kyber);

  // X25519 DH with ephemeral public key (pure JS)
  const x25519SS = x25519DH(privateKey.x25519, ephemeralPublicBytes);

  // Hybrid shared secret: HKDF(kyber_ss || x25519_ss)
  const ikmCombined = new Uint8Array(kyberSS.length + x25519SS.length);
  ikmCombined.set(kyberSS, 0);
  ikmCombined.set(x25519SS, kyberSS.length);

  return hkdf(ikmCombined, KEM_INFO);
}

/**
 * Derive an AES-256-GCM key from a shared secret (output of encapsulate/decapsulate).
 * Use this to encrypt messages after key agreement.
 *
 * @param {Uint8Array} sharedSecret
 * @returns {Promise<CryptoKey>} AES-256-GCM CryptoKey
 */
export async function sharedSecretToAESKey(/** @type {any} */ sharedSecret) {
  const baseKey = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('eonapp-aes-session-v1')
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Serialise a private key for secure session storage.
 * X25519 private key is exported as raw JWK bytes.
 * Returns a hex string.
 */
export function serializePrivateKey(/** @type {any} */ privateKey) {
  const /** @type {any} */
result = {
    kyber:   bufToHex(privateKey.kyber),
    x25519:  bufToHex(privateKey.x25519)  // raw 32-byte private key
  };
  return JSON.stringify(result);
}

/**
 * Deserialise a private key from session storage.
 */
export function deserializePrivateKey(/** @type {any} */ serialized) {
  const parsed = JSON.parse(serialized);
  return {
    kyber:  hexToBuf(parsed.kyber),
    x25519: hexToBuf(parsed.x25519),  // raw 32-byte Uint8Array
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function bufToHex(/** @type {any} */ buf) {
  return Array.from(buf).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(/** @type {any} */ hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}
