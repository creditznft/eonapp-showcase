/**
 * Content Signing — Creator & Node Authenticity Layer
 * =====================================================
 * High-level API for signing and verifying:
 *   1. Creator content (posts, assets, NFTs) — proves authorship
 *   2. Admin asset overrides — proves admin bypass is legitimate
 *   3. P2P node announcements — proves node identity hasn't been spoofed
 *
 * Uses pq-signing.js (ML-DSA-65 + ECDSA P-256 hybrid) underneath.
 *
 * SIGNING FLOWS:
 *
 *   Creator signs asset:
 *     const sig = await ContentSigning.signAsset(creatorAddress, assetBundle);
 *     // → stores sig in asset record, verifiable by any peer
 *
 *   Verifier checks asset:
 *     const result = await ContentSigning.verifyAsset(assetBundle, sig, publicKey);
 *     // → result.valid must be true for asset to be displayed
 *
 *   Node operator signs announcement:
 *     const sig = await ContentSigning.signNodeAnnouncement(nodeParams);
 *     // → attached to node record in distributed-inference.js
 *
 *   Router verifies node before routing:
 *     const ok = await ContentSigning.verifyNodeAnnouncement(nodeRecord);
 *     // → routes only to nodes with valid PQ signatures
 *
 * @module utils/content-signing
 */

import {
  generateSigningKeyPair,
  sign as pqSign,
  verify as pqVerify,
  verifyMlDsaOnly,
  getOrCreateKeyPair,
  loadKeyPair,
  storeKeyPair,
  clearKeyPair,
} from './pq-signing.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const CONTENT_SIGNING_VERSION = 'cs-v1';
const SESSION_SLOT_CREATOR    = 'creator-signing';
const SESSION_SLOT_NODE       = 'node-signing';
const SESSION_SLOT_ADMIN      = 'admin-signing';
const SIG_AGE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes — signatures older than this are rejected

// ─── Serialisation helpers ───────────────────────────────────────────────────

/** Canonical JSON serialisation — deterministic key ordering */
function canonicalize(/** @type {any} */ obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/** Derive a session-scoped encryption password from wallet address + tab nonce */
function deriveSessionPassword(/** @type {any} */ address) {
  const nonce = sessionStorage.getItem('eon:tab-nonce') ?? (() => {
    const n = crypto.getRandomValues(new Uint8Array(16))
      .reduce((/** @type {any} */ s, /** @type {any} */ b) => s + b.toString(16).padStart(2, '0'), '');
    sessionStorage.setItem('eon:tab-nonce', n);
    return n;
  })();
  // Deterministic enough for in-session key protection; not exposed outside tab
  return `${address}:${nonce}:eon-content-signing`;
}

// ─── ContentSigning class ────────────────────────────────────────────────────

export class ContentSigning {

  // ── Creator Content ────────────────────────────────────────────────────────

  /**
   * Sign a creator asset bundle.
   * Generates a session key pair on first call (stored in sessionStorage).
   *
   * @param {string} creatorAddress — wallet address of the content creator
   * @param {object} asset          — asset metadata bundle (title, hash, type, etc.)
   * @returns {Promise<{
   *   signature:  object,  // hybrid sig object
   *   publicKey:  object,  // public key bundle (include in asset record)
   *   version:    string,
   *   signerAddr: string,
   *   assetHash:  string   // SHA-256 hex of canonical asset JSON
   * }>}
   */
  static async signAsset(/** @type {any} */ creatorAddress, /** @type {any} */ asset) {
    const password = deriveSessionPassword(creatorAddress);
    const keyPair  = await getOrCreateKeyPair(SESSION_SLOT_CREATOR, password);

    // Canonical message = hash of (version + signerAddr + asset JSON)
    const assetJson  = canonicalize(asset);
    const msgPayload = `${CONTENT_SIGNING_VERSION}|${creatorAddress}|${assetJson}`;
    const assetHash  = await sha256Hex(assetJson);

    const signature  = await pqSign(keyPair, msgPayload);
    const publicKey  = await keyPair.exportPublicKey();

    return {
      signature,
      publicKey,
      version:    CONTENT_SIGNING_VERSION,
      signerAddr: creatorAddress,
      assetHash
    };
  }

  /**
   * Verify a creator asset signature.
   *
   * @param {object} asset      — the asset bundle (must be identical to what was signed)
   * @param {object} sigBundle  — from signAsset()
   * @returns {Promise<{ valid: boolean, mlDsaValid: boolean, ecdsaValid: boolean, reason?: string }>}
   */
  static async verifyAsset(/** @type {any} */ asset, /** @type {any} */ sigBundle) {
    const { signature, publicKey, version, signerAddr } = sigBundle;

    if (version !== CONTENT_SIGNING_VERSION) {
      return { valid: false, mlDsaValid: false, ecdsaValid: false, reason: 'version_mismatch' };
    }

    // Reject signatures older than SIG_AGE_LIMIT_MS (anti-replay)
    if (signature.timestamp && Date.now() - signature.timestamp > SIG_AGE_LIMIT_MS) {
      return { valid: false, mlDsaValid: false, ecdsaValid: false, reason: 'signature_expired' };
    }

    const assetJson  = canonicalize(asset);
    const msgPayload = `${CONTENT_SIGNING_VERSION}|${signerAddr}|${assetJson}`;

    return pqVerify(signature, msgPayload, publicKey);
  }

  // ── Admin Asset Bypass ─────────────────────────────────────────────────────

  /**
   * Sign an admin moderation-bypass assertion.
   * Admin operators call this when posting assets that skip AI moderation.
   *
   * @param {string} adminAddress — must be one of the 10 admin wallet addresses
   * @param {object} asset
   * @param {PQSigningKeyPair} adminKeyPair — must be loaded from secure admin key storage
   * @returns {Promise<object>} signature bundle
   */
  static async signAdminBypass(/** @type {any} */ adminAddress, /** @type {any} */ asset, /** @type {any} */ adminKeyPair) {
    const assetHash  = await sha256Hex(canonicalize(asset));
    const msgPayload = `admin-bypass|${CONTENT_SIGNING_VERSION}|${adminAddress}|${assetHash}`;
    const signature  = await pqSign(adminKeyPair, msgPayload);
    const publicKey  = await adminKeyPair.exportPublicKey();

    return {
      signature,
      publicKey,
      version:    CONTENT_SIGNING_VERSION,
      adminAddr:  adminAddress,
      assetHash,
      bypassType: 'admin-moderation-bypass'
    };
  }

  /**
   * Verify an admin bypass signature.
   * Called by the content pipeline before allowing fee-zero bypass.
   */
  static async verifyAdminBypass(/** @type {any} */ asset, /** @type {any} */ bypassBundle) {
    const { signature, publicKey, version, adminAddr, bypassType } = bypassBundle;

    if (version !== CONTENT_SIGNING_VERSION || bypassType !== 'admin-moderation-bypass') {
      return { valid: false, reason: 'invalid_bypass_bundle' };
    }

    const assetHash  = await sha256Hex(canonicalize(asset));
    const msgPayload = `admin-bypass|${CONTENT_SIGNING_VERSION}|${adminAddr}|${assetHash}`;

    return pqVerify(signature, msgPayload, publicKey);
  }

  // ── P2P Node Announcement ──────────────────────────────────────────────────

  /**
   * Sign a node announcement (used by node operators in distributed-inference.js).
   * Creates or loads a persistent node signing key from sessionStorage.
   *
   * @param {string} nodeAddress   — node operator wallet or identifier
   * @param {object} nodeParams    — { modelId, vramGb, endpoint, tier, ... }
   * @returns {Promise<{
   *   nodeParams:   object,
   *   signature:    object,
   *   publicKey:    object,
   *   nodeAddress:  string,
   *   announcedAt:  number
   * }>}
   */
  static async signNodeAnnouncement(/** @type {any} */ nodeAddress, /** @type {any} */ nodeParams) {
    const password   = deriveSessionPassword(nodeAddress);
    const keyPair    = await getOrCreateKeyPair(SESSION_SLOT_NODE, password);

    const announcedAt = Date.now();
    const msgPayload  = canonicalize({ ...nodeParams, nodeAddress, announcedAt });

    const signature = await pqSign(keyPair, msgPayload);
    const publicKey = await keyPair.exportPublicKey();

    return {
      nodeParams,
      signature,
      publicKey,
      nodeAddress,
      announcedAt
    };
  }

  /**
   * Verify a node announcement signature.
   * Routers call this before accepting a node into the routing table.
   *
   * @param {object} announcement — from signNodeAnnouncement()
   * @param {number} maxAgeMs     — max acceptable announcement age (default: 5 minutes)
   * @returns {Promise<{ valid: boolean, reason?: string }>}
   */
  static async verifyNodeAnnouncement(/** @type {any} */ announcement, /** @type {any} */ maxAgeMs = 5 * 60 * 1000) {
    const { nodeParams, signature, publicKey, nodeAddress, announcedAt } = announcement;

    if (!nodeParams || !signature || !publicKey || !nodeAddress) {
      return { valid: false, reason: 'missing_fields' };
    }

    // Freshness check — prevents replay of stale node records
    if (Date.now() - announcedAt > maxAgeMs) {
      return { valid: false, reason: 'announcement_stale' };
    }

    const msgPayload = canonicalize({ ...nodeParams, nodeAddress, announcedAt });
    const result     = await pqVerify(signature, msgPayload, publicKey);

    return result.valid
      ? { valid: true }
      : { valid: false, reason: result.mlDsaValid ? 'ecdsa_invalid' : 'ml_dsa_invalid' };
  }

  // ── Admin PQ Key Bootstrap ─────────────────────────────────────────────────

  /**
   * Initialise a new admin signing key pair for a given admin address.
   * Called once per session when an admin operator logs in.
   *
   * @param {string} adminAddress
   * @returns {Promise<{ publicKey: object, keySlot: string }>}
   */
  static async bootstrapAdminKeyPair(/** @type {any} */ adminAddress) {
    const password = deriveSessionPassword(adminAddress);
    const keyPair  = await generateSigningKeyPair();
    await storeKeyPair(SESSION_SLOT_ADMIN, keyPair, password);
    const publicKey = await keyPair.exportPublicKey();
    return { publicKey, keySlot: SESSION_SLOT_ADMIN };
  }

  /**
   * Load the stored admin signing key pair for the current session.
   * Returns null if no admin key is present.
   */
  static async getAdminKeyPair(/** @type {any} */ adminAddress) {
    const password = deriveSessionPassword(adminAddress);
    return loadKeyPair(SESSION_SLOT_ADMIN, password);
  }

  /** Clear all signing keys for current session (call on logout). */
  static clearAllSessionKeys() {
    clearKeyPair(SESSION_SLOT_CREATOR);
    clearKeyPair(SESSION_SLOT_NODE);
    clearKeyPair(SESSION_SLOT_ADMIN);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

async function sha256Hex(/** @type {any} */ str) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(digest)).map(/** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Re-exports for consumers who want lower-level access ────────────────────
export { generateSigningKeyPair, pqSign as sign, pqVerify as verify, verifyMlDsaOnly };
