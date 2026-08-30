/**
 * Secure Key Store — Hardened
 * ============================
 * Non-extractable cryptographic keys for Nostr, game signing, and swap verification.
 * Ported from eonpackage's QuantumWalletService_V5 + WalletBackupService_V5.
 *
 * Security features:
 * - AES-256-GCM encryption for persisted keys (PBKDF2 600k iterations, quantum-resistant)
 * - ECDSA P-256 for browser signing (non-extractable CryptoKey objects)
 * - ML-DSA-65 (CRYSTALS-Dilithium Level 3, NIST FIPS 204) for quantum-resistant signing
 * - Hybrid session tokens (ECDSA P-256 + ML-DSA-65) — both must verify
 * - HMAC-SHA256 for offer/receipt integrity verification
 * - Session-only storage for sensitive material (not localStorage)
 * - All random values from crypto.getRandomValues (no Math.random)
 * - 32-byte salts (OWASP 2025 recommendation for quantum resistance)
 *
 * Post-Quantum Upgrade (Session PQC-1):
 * ML-DSA-65 (CRYSTALS-Dilithium Level 3, NIST FIPS 204) is now integrated directly.
 * generatePQKeyPair / pqSign / pqVerify / createHybridSessionToken are available.
 * Hybrid mode (ML-DSA-65 + ECDSA P-256) is used for session tokens: BOTH signatures
 * must verify, providing security equivalent to the stronger algorithm.
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

export class SecureKeyStore {
  constructor() {
    this.keys = new Map();
    this.publicKeys = new Map();
    this._hmacKeys = new Map();
    /** @type {Map<string, { publicKey: Uint8Array, secretKey: Uint8Array }>} */
    this._pqKeys = new Map();
  }

  // Generate a new non-extractable signing key
  async generateKey(/** @type {any} */ keyId = 'default') {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, // non-extractable
      ['sign', 'verify']
    );

    this.keys.set(keyId, keyPair.privateKey);

    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyHex = this.bufferToHex(publicKeyRaw);
    this.publicKeys.set(keyId, publicKeyHex);

    return { id: keyId, publicKey: publicKeyHex };
  }

  // Generate an HMAC key for integrity verification
  async generateHmacKey(/** @type {any} */ keyId = 'hmac-default') {
    const hmacKey = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      false,
      ['sign', 'verify']
    );
    this._hmacKeys.set(keyId, hmacKey);
    return keyId;
  }

  // Sign data with stored key
  async sign(/** @type {any} */ keyId, /** @type {any} */ data) {
    const key = this.keys.get(keyId);
    if (!key) throw new Error(`Key not found: ${keyId}`);

    const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, dataBuffer);
    return this.bufferToHex(signature);
  }

  // Sign with HMAC key (for offer/receipt integrity)
  async signHmac(/** @type {any} */ keyId, /** @type {any} */ data) {
    if (!this._hmacKeys.has(keyId)) await this.generateHmacKey(keyId);
    const key = this._hmacKeys.get(keyId);
    const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const sig = await crypto.subtle.sign('HMAC', key, dataBuffer);
    return this.bufferToHex(sig);
  }

  // Verify HMAC signature
  async verifyHmac(/** @type {any} */ keyId, /** @type {any} */ signature, /** @type {any} */ data) {
    const key = this._hmacKeys.get(keyId);
    if (!key) return false;
    const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    try { return await crypto.subtle.verify('HMAC', key, this.hexToBuffer(signature), dataBuffer); }
    catch { return false; }
  }

  // Verify signature
  async verify(/** @type {any} */ keyId, /** @type {any} */ signature, /** @type {any} */ data) {
    const publicKeyHex = this.publicKeys.get(keyId);
    if (!publicKeyHex) throw new Error(`Public key not found: ${keyId}`);

    const publicKey = await crypto.subtle.importKey(
      'raw', this.hexToBuffer(publicKeyHex),
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
    );
    const dataBuffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, this.hexToBuffer(signature), dataBuffer);
  }

  getPublicKey(/** @type {any} */ keyId = 'default') { return this.publicKeys.get(keyId) || null; }
  hasKey(/** @type {any} */ keyId = 'default') { return this.keys.has(keyId); }
  deleteKey(/** @type {any} */ keyId = 'default') { this.keys.delete(keyId); this.publicKeys.delete(keyId); this._hmacKeys.delete(keyId); }
  listKeys() { return Array.from(this.keys.keys()); }

  // Create a session token
  async createSessionToken(/** @type {any} */ keyId, /** @type {any} */ payload) {
    const /** @type {any} */
token = { ...payload, ts: Date.now(), nonce: this.randomHex(16) };
    const signature = await this.sign(keyId, JSON.stringify(token));
    return { token, signature, publicKey: this.getPublicKey(keyId) };
  }

  // Verify a session token
  async verifySessionToken(/** @type {any} */ token, /** @type {any} */ signature, /** @type {any} */ publicKey) {
    const pubKey = await crypto.subtle.importKey(
      'raw', this.hexToBuffer(publicKey),
      { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
    );
    const dataBuffer = new TextEncoder().encode(JSON.stringify(token));
    const isValid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, this.hexToBuffer(signature), dataBuffer);
    const age = Date.now() - token.ts;
    return isValid && age >= 0 && age < 5 * 60 * 1000;
  }

  // ─── AES-256-GCM Encryption (from eonpackage) ────────────────────────────────

  /**
   * Encrypt data with password using AES-256-GCM + PBKDF2 (600k iterations).
   * 32-byte salt (OWASP 2025 quantum-resistant recommendation).
   */
  async encryptWithPassword(/** @type {any} */ data, /** @type {any} */ password) {
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, keyMaterial,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(data));

    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return this.bufferToBase64(combined);
  }

  /**
   * Decrypt data with password using AES-256-GCM + PBKDF2.
   */
  async decryptWithPassword(/** @type {any} */ encryptedBase64, /** @type {any} */ password) {
    const combined = this.base64ToBuffer(encryptedBase64);
    const salt = combined.slice(0, 32);
    const iv = combined.slice(32, 44);
    const ciphertext = combined.slice(44);

    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, keyMaterial,
      { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  // ─── Secure Storage (sessionStorage, not localStorage) ──────────────────────

  /**
   * Save encrypted data to sessionStorage (cleared on tab close — limits XSS surface).
   * Per eonpackage S341-DILITHIUM-1: never store sensitive material in localStorage.
   */
  async saveEncrypted(/** @type {any} */ key, /** @type {any} */ data, /** @type {any} */ password) {
    const encrypted = await this.encryptWithPassword(JSON.stringify(data), password);
    try { sessionStorage.setItem(`eon:secure:${key}`, encrypted); } catch {}
  }

  async loadEncrypted(/** @type {any} */ key, /** @type {any} */ password) {
    try {
      const encrypted = sessionStorage.getItem(`eon:secure:${key}`);
      if (!encrypted) return null;
      const decrypted = await this.decryptWithPassword(encrypted, password);
      return JSON.parse(decrypted);
    } catch { return null; }
  }

  // ─── Post-Quantum Signing (ML-DSA-65 / CRYSTALS-Dilithium Level 3) ──────────

  /**
   * Generate an ML-DSA-65 signing key pair and store in memory for this session.
   * @param {string} keyId — slot identifier (default: 'pq-default')
   * @returns {{ publicKeyHex: string }} — 1952-byte public key as hex
   */
  generatePQKeyPair(/** @type {any} */ keyId = 'pq-default') {
    const { publicKey, secretKey } = ml_dsa65.keygen();
    this._pqKeys.set(keyId, { publicKey, secretKey });
    return { publicKeyHex: this.bufferToHex(publicKey) };
  }

  /**
   * Sign data with a stored ML-DSA-65 key.
   * @param {string}              keyId
   * @param {string | Uint8Array} data
   * @returns {string} — hex-encoded ML-DSA-65 signature (3309 bytes)
   */
  pqSign(/** @type {any} */ keyId, /** @type {any} */ data) {
    const kp = this._pqKeys.get(keyId);
    if (!kp) throw new Error(`PQ key not found: ${keyId}. Call generatePQKeyPair first.`);
    const msgBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const sig = ml_dsa65.sign(msgBytes, kp.secretKey);  // v0.6.1: (msg, secretKey)
    return this.bufferToHex(sig);
  }

  /**
   * Verify an ML-DSA-65 signature.
   * @param {string}              keyId
   * @param {string | Uint8Array} data
   * @param {string}              signatureHex
   * @returns {boolean}
   */
  pqVerify(/** @type {any} */ keyId, /** @type {any} */ data, /** @type {any} */ signatureHex) {
    const kp = this._pqKeys.get(keyId);
    if (!kp) return false;
    try {
      const msgBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      return /** @type {any} */ (ml_dsa65.verify(/** @type {any} */ (this.hexToBuffer(signatureHex)), /** @type {any} */ (msgBytes), kp.publicKey));
    } catch { return false; }
  }

  /**
   * Verify an ML-DSA-65 signature using a raw public key (for externally supplied keys).
   * @param {string | Uint8Array} publicKeyRaw
   * @param {string | Uint8Array} data
   * @param {string | Uint8Array} signature
   * @returns {boolean}
   */
  pqVerifyExternal(/** @type {any} */ publicKeyRaw, /** @type {any} */ data, /** @type {any} */ signature) {
    try {
      const pub = typeof publicKeyRaw === 'string' ? this.hexToBuffer(publicKeyRaw) : publicKeyRaw;
      const msg = typeof data        === 'string' ? new TextEncoder().encode(data)  : data;
      const sig = typeof signature   === 'string' ? this.hexToBuffer(signature)     : new Uint8Array(signature);
      return ml_dsa65.verify(/** @type {any} */ (sig), /** @type {any} */ (msg), pub);  // v0.6.1: (sig, msg, pk)
    } catch { return false; }
  }

  /**
   * Create a HYBRID session token signed with BOTH ECDSA P-256 AND ML-DSA-65.
   * Both signatures must verify for the token to be considered valid.
   *
   * SECURITY: Quantum computers can break ECDSA P-256; the ML-DSA-65 component
   * remains secure. Classical attackers face both barriers simultaneously.
   *
   * @param {string} ecKeyId  — ECDSA key slot (from generateKey)
   * @param {string} pqKeyId  — ML-DSA-65 key slot (from generatePQKeyPair)
   * @param {object} payload  — arbitrary token payload
   * @returns {Promise<{ token: object, ecSig: string, pqSig: string, ecPublicKey: string, pqPublicKey: string }>}
   */
  async createHybridSessionToken(/** @type {any} */ ecKeyId, /** @type {any} */ pqKeyId, /** @type {any} */ payload) {
    const /** @type {any} */
token = { ...payload, ts: Date.now(), nonce: this.randomHex(16), tokenVersion: 'hybrid-v1' };
    const tokenJson = JSON.stringify(token);
    const ecSig = await this.sign(ecKeyId, tokenJson);
    const pqSig = this.pqSign(pqKeyId, tokenJson);
    return {
      token,
      ecSig,
      pqSig,
      ecPublicKey: this.getPublicKey(ecKeyId),
      pqPublicKey: this.bufferToHex(this._pqKeys.get(pqKeyId)?.publicKey ?? new Uint8Array())
    };
  }

  /**
   * Verify a hybrid session token. BOTH signatures must be valid.
   * @param {object} token
   * @param {string} ecSig
   * @param {string} pqSig
   * @param {string} ecPublicKeyHex
   * @param {string} pqPublicKeyHex
   * @param {number} [maxAgeMs=300000] - default 5 minutes
   * @returns {Promise<boolean>}
   */
  async verifyHybridSessionToken(/** @type {any} */ token, /** @type {any} */ ecSig, /** @type {any} */ pqSig, /** @type {any} */ ecPublicKeyHex, /** @type {any} */ pqPublicKeyHex, /** @type {any} */ maxAgeMs = 5 * 60 * 1000) {
    const age = Date.now() - token.ts;
    if (age < 0 || age > maxAgeMs) return false;
    if (token.tokenVersion !== 'hybrid-v1') return false;
    const tokenJson = JSON.stringify(token);

    // ECDSA P-256 verification
    let ecValid = false;
    try {
      const pubKey = await crypto.subtle.importKey(
        'raw', this.hexToBuffer(ecPublicKeyHex),
        { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
      );
      ecValid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' }, pubKey,
        this.hexToBuffer(ecSig), new TextEncoder().encode(tokenJson)
      );
    } catch { ecValid = false; }

    // ML-DSA-65 verification
    const pqValid = this.pqVerifyExternal(pqPublicKeyHex, tokenJson, pqSig);

    return ecValid && pqValid;
  }

  hasPQKey(/** @type {any} */ keyId = 'pq-default') { return this._pqKeys.has(keyId); }
  deletePQKey(/** @type {any} */ keyId = 'pq-default') { this._pqKeys.delete(keyId); }

  // ─── Integrity Verification ─────────────────────────────────────────────────

  async createSignedPayload(/** @type {any} */ prefix, /** @type {any} */ payload) {
    const json = JSON.stringify(payload);
    const hmacKeyId = `hmac-${prefix}`;
    if (!this._hmacKeys.has(hmacKeyId)) await this.generateHmacKey(hmacKeyId);
    const hmac = await this.signHmac(hmacKeyId, json);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${prefix}.v1.${encoded}.${hmac.slice(0, 16)}`;
  }

  async verifySignedPayload(/** @type {any} */ prefix, /** @type {any} */ code) {
    const parts = String(code || '').split('.');
    if (parts[0] !== prefix || parts[1] !== 'v1' || parts.length < 4) {
      throw new Error(`Invalid ${prefix} code format.`);
    }
    const hmacSlice = parts[parts.length - 1];
    const encoded = parts.slice(2, -1).join('.');
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);

    const hmacKeyId = `hmac-${prefix}`;
    const expectedHmac = await this.signHmac(hmacKeyId, json);
    if (expectedHmac.slice(0, 16) !== hmacSlice) {
      throw new Error('Integrity check failed — payload may be tampered.');
    }
    return payload;
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  bufferToHex(/** @type {any} */ buffer) {
    return Array.from(new Uint8Array(buffer)).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
  }

  hexToBuffer(/** @type {any} */ hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes.buffer;
  }

  bufferToBase64(/** @type {any} */ buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  base64ToBuffer(/** @type {any} */ base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  randomHex(/** @type {any} */ length) {
    const bytes = new Uint8Array(length / 2);
    crypto.getRandomValues(bytes);
    return this.bufferToHex(bytes);
  }
}

// Singleton instance
/** @type {SecureKeyStore | null} */
let keyStore = null;

export function getKeyStore() {
  if (!keyStore) keyStore = new SecureKeyStore();
  return keyStore;
}

export async function initKeyStore() {
  const store = getKeyStore();
  if (!store.hasKey('default')) await store.generateKey('default');
  return store;
}

export async function signData(/** @type {any} */ data, /** @type {any} */ keyId = 'default') {
  const store = getKeyStore();
  if (!store.hasKey(keyId)) await store.generateKey(keyId);
  return store.sign(keyId, data);
}

export async function verifySignature(/** @type {any} */ signature, /** @type {any} */ data, /** @type {any} */ publicKey) {
  const store = getKeyStore();
  return store.verifySessionToken(typeof data === 'object' ? data : { data }, signature, publicKey);
}

export default SecureKeyStore;


// compatibility wrappers reconstructed from the hardening branch
export async function loadOrCreateDeviceKeys(keyId = 'default') {
  const store = getKeyStore();
  if (!store.hasKey(keyId)) await store.generateKey(keyId);
  return { publicKeyBase64: store.getPublicKey(keyId), privateKey: null };
}

export async function sign(message, keyId = 'default') {
  return signData(message, keyId);
}

export async function verify(message, signature, publicKey) {
  return verifySignature(signature, message, publicKey);
}
