/**
 * SECURITY HARDENING MODULE
 * Cryptographic verification, request signing, rate limiting for sensitive operations
 *
 * Purpose:
 * - Admin HMAC-SHA256 signature verification for override operations
 * - Request origin verification (same-site policy)
 * - Rate limiting on sensitive actions
 * - Request signing for remote operations
 *
 * Location: assets/js/utils/security-hardening.js
 * Phase 4.1: Security hardening implementation
 */

const REQUEST_SIGNATURES_STORAGE = 'eon:security:request-signatures:v1';
const RETIRED_HMAC_STORAGE_KEY = 'eon:security:hmac-key';
const SENSITIVE_RATE_LIMITS = {
  'admin:override': { limit: 1, windowMs: 5 * 60 * 1000 }, // 1 per 5 min
  'admin:bridge-remote': { limit: 10, windowMs: 60 * 1000 }, // 10 per min
  'admin:delete-data': { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};

const encoder = new TextEncoder();

function getWebCrypto() {
  return (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle)
    ? globalThis.crypto
    : null;
}

function safeStorageGet(/** @type {string} */ key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(/** @type {string} */ key, /** @type {string} */ value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeStorageRemove(/** @type {string} */ key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function parseJson(/** @type {string | null} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(raw || 'null');
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function bytesToHex(/** @type {Uint8Array} */ bytes) {
  return Array.from(bytes).map((/** @type {number} */ b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(/** @type {number} */ byteLength) {
  const webCrypto = getWebCrypto();
  if (!webCrypto) throw new Error('crypto.getRandomValues required');
  const bytes = new Uint8Array(byteLength);
  webCrypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function secureCompare(/** @type {string} */ a, /** @type {string} */ b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * HMAC-SHA256 Signature Verification
 * 
 * Sign request with: HMAC-SHA256(message, adminKey)
 * Verify with: verifyHMACSignature(message, signature, adminKey)
 */
export class HMACSignatureVerifier {
  static generateAdminKey() {
    return randomHex(32);
  }

  static async signRequest(/** @type {string} */ message, /** @type {string} */ adminKey) {
    const webCrypto = getWebCrypto();
    if (!webCrypto || !String(adminKey || '').trim()) {
      return '';
    }

    const key = await webCrypto.subtle.importKey(
      'raw',
      encoder.encode(String(adminKey || '')),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await webCrypto.subtle.sign('HMAC', key, encoder.encode(String(message || '')));
    return bytesToHex(new Uint8Array(signature));
  }

  static async verifySignature(/** @type {string} */ message, /** @type {string} */ signature, /** @type {string} */ adminKey) {
    const expectedSignature = await this.signRequest(message, adminKey);
    if (!expectedSignature) return false;
    return secureCompare(String(signature || ''), expectedSignature);
  }

  static async verifyRequestWithNonce(/** @type {any} */ request, /** @type {string} */ adminKey) {
    const { message, signature, nonce, timestamp } = request;

    // Check timestamp freshness (5 min window)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return { valid: false, reason: 'TIMESTAMP_EXPIRED', timestamp, now };
    }

    // Check nonce uniqueness
    const usedNonces = parseJson(safeStorageGet(REQUEST_SIGNATURES_STORAGE), {});
    if (usedNonces[nonce]) {
      return { valid: false, reason: 'NONCE_REUSED', nonce };
    }

    // Verify HMAC
    const messageForSigning = `${message}:${nonce}:${timestamp}`;
    const isValid = await this.verifySignature(messageForSigning, signature, adminKey);

    if (isValid) {
      // Record nonce usage
      usedNonces[nonce] = { timestamp: now, message };
      safeStorageSet(REQUEST_SIGNATURES_STORAGE, JSON.stringify(usedNonces));

      // Cleanup old nonces (older than 10 min)
      const tenMinAgo = now - 10 * 60 * 1000;
      for (const [n, data] of Object.entries(usedNonces)) {
        if (data.timestamp < tenMinAgo) {
          delete usedNonces[n];
        }
      }
      safeStorageSet(REQUEST_SIGNATURES_STORAGE, JSON.stringify(usedNonces));
    }

    return { valid: isValid, reason: isValid ? 'OK' : 'INVALID_SIGNATURE', nonce };
  }
}

/**
 * Request Origin Verification
 */
export class OriginVerifier {
  static getAllowedOrigins() {
    // W636: trust roots are code-reviewed, not writable by same-origin scripts.
    return ['https://eonapp.ch', 'http://127.0.0.1:8000'];
  }

  static setAllowedOrigins() {
    return { ok: false, reason: 'runtime-origin-trust-mutation-retired' };
  }

  static verifyOrigin(/** @type {string} */ origin) {
    const allowed = this.getAllowedOrigins();
    const isAllowed = allowed.some((/** @type {string} */ allowedOrigin) => {
      // Support wildcards like *.eonapp.ch
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    });

    return { valid: isAllowed, origin, allowed };
  }

  static getRequestOrigin() {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'unknown';
  }
}

/**
 * Sensitive Action Rate Limiter
 */
export class SensitiveRateLimiter {
  static checkRateLimit(/** @type {string} */ action) {
    const limit = /** @type {any} */ (SENSITIVE_RATE_LIMITS)[action];
    if (!limit) {
      return { allowed: true, reason: 'ACTION_NOT_LIMITED', action };
    }

    const key = `eon:security:rate-limit:${action}`;
    const now = Date.now();
    const data = parseJson(safeStorageGet(key), { attempts: [], blockedUntil: 0 });

    // Check if blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      const remainingMs = data.blockedUntil - now;
      return { allowed: false, reason: 'RATE_LIMITED', action, remainingMs };
    }

    // Cleanup old attempts
    data.attempts = data.attempts.filter((/** @type {number} */ t) => now - t < limit.windowMs);

    // Check if at limit
    if (data.attempts.length >= limit.limit) {
      const blockDurationMs = 60 * 1000; // Block for 1 min
      data.blockedUntil = now + blockDurationMs;
      safeStorageSet(key, JSON.stringify(data));
      return { allowed: false, reason: 'LIMIT_EXCEEDED', action, attempts: data.attempts.length, limit: limit.limit };
    }

    // Record attempt
    data.attempts.push(now);
    safeStorageSet(key, JSON.stringify(data));

    return { allowed: true, reason: 'OK', action, attempts: data.attempts.length, limit: limit.limit };
  }

  static resetRateLimit(/** @type {string} */ action) {
    const key = `eon:security:rate-limit:${action}`;
    safeStorageRemove(key);
  }
}

/**
 * Request Signing for Remote Operations
 */
export class RequestSigner {
  static async createSignedRequest(/** @type {any} */ request, /** @type {string} */ adminKey) {
    const nonce = randomHex(16);
    const timestamp = Date.now();
    
    const messageContent = JSON.stringify({
      action: request.action,
      params: request.params,
      timestamp,
    });

    const signature = await HMACSignatureVerifier.signRequest(
      `${messageContent}:${nonce}:${timestamp}`,
      adminKey
    );

    return {
      ...request,
      nonce,
      timestamp,
      signature,
      _signed: true,
    };
  }

  static async verifySignedRequest(/** @type {any} */ signedRequest, /** @type {string} */ adminKey) {
    if (!signedRequest._signed) {
      return { valid: false, reason: 'NOT_SIGNED' };
    }

    const { nonce, timestamp, signature, action, params } = signedRequest;
    const messageContent = JSON.stringify({ action, params, timestamp });

    const verifyResult = await HMACSignatureVerifier.verifyRequestWithNonce(
      {
        message: messageContent,
        signature,
        nonce,
        timestamp,
      },
      adminKey
    );

    return verifyResult;
  }
}

/**
 * Admin Operation Audit
 */
export class AdminOperationAuditor {
  static logAdminAction(/** @type {any} */ action) {
    const key = 'eon:security:admin-audit:v1';
    const log = parseJson(safeStorageGet(key), []);

    log.push({
      timestamp: Date.now(),
      action: action.action,
      actor: action.actor || 'unknown',
      status: action.status || 'executed',
      details: action.details || {},
    });

    // Keep last 1000 entries
    if (log.length > 1000) {
      log.shift();
    }

    safeStorageSet(key, JSON.stringify(log));
  }

  static getAdminAuditLog() {
    const key = 'eon:security:admin-audit:v1';
    const log = parseJson(safeStorageGet(key), []);
    return log;
  }

  static clearAdminAuditLog() {
    safeStorageRemove('eon:security:admin-audit:v1');
  }
}

/**
 * Security Configuration
 */
export class SecurityConfig {
  static getSecurityStatus() {
    const hmacKey = this.getOrCreateHMACKey();
    const allowedOrigins = OriginVerifier.getAllowedOrigins();
    const currentOrigin = OriginVerifier.getRequestOrigin();
    const originValid = OriginVerifier.verifyOrigin(currentOrigin).valid;

    return {
      hmacConfigured: !!hmacKey,
      allowedOrigins,
      currentOrigin,
      originValid,
      signatureVerificationEnabled: Boolean(getWebCrypto()),
      rateLimitingEnabled: true,
    };
  }

  static getOrCreateHMACKey() {
    // W636: browser-generated administrative trust is retired. Remove any
    // historical plaintext key and require an explicit reviewed key per call.
    safeStorageRemove(RETIRED_HMAC_STORAGE_KEY);
    return '';
  }

  static exportSecurityConfig() {
    return JSON.stringify({
      status: this.getSecurityStatus(),
      timestamp: new Date().toISOString(),
    });
  }
}

export default {
  HMACSignatureVerifier,
  OriginVerifier,
  SensitiveRateLimiter,
  RequestSigner,
  AdminOperationAuditor,
  SecurityConfig,
};
