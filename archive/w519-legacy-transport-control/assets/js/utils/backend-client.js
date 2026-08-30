import {
  publishP2POffer,
  lookupP2POffer,
  acceptP2POffer,
  redeemP2PReceipt,
  generateOfferCode,
  generateReceiptCode,
} from './nostr-swap-registry.js';

const appWin = /** @type {any} */ (window);
const EXPLICIT_API_BASE = typeof window !== 'undefined' ? appWin.__EON_API_BASE__ : '';
const DEFAULT_TIMEOUT_MS = 12000;
const MAX_RESPONSE_TEXT = 100_000;
const UID_RE = /^(g_[0-9a-f]{48}|eon_[0-9a-f]{12}|[a-z0-9][a-z0-9_-]{3,79})$/i;
const WALLET_RE = /^0x[a-f0-9]{40}$/i;
const NONCE_RE = /^[a-z0-9_-]{16,120}$/i;

export { generateOfferCode, generateReceiptCode };

function isDefaultEdgeHost() {
  const host = String(window.location.hostname || '').toLowerCase();
  return host === 'eonapp.ch' || host === 'www.eonapp.ch';
}

function sanitizeApiBase(/** @type {any} */ value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/')) {
    return raw.replace(/\/+$/, '');
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();
    const isLocalHttp = parsed.protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
    if (parsed.protocol !== 'https:' && !isLocalHttp) {
      return '';
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function resolveApiBase() {
  const explicit = sanitizeApiBase(EXPLICIT_API_BASE);
  if (explicit) {
    return explicit;
  }
  return isDefaultEdgeHost() ? '/api' : '';
}

async function readJson(/** @type {any} */ response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const text = (await response.text()).slice(0, MAX_RESPONSE_TEXT);
  let /** @type {any} */
data = {};
  const expectsJson = contentType.includes('application/json');
  if (expectsJson) {
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    const error = /** @type {any} */ (new Error('Backend request failed. Please try again.'));
    error.status = response.status;
    error.payload = expectsJson ? data : {};
    error.code = typeof data?.code === 'string' ? data.code : null;
    throw error;
  }
  if (!expectsJson || !data || typeof data !== 'object') {
    throw new Error('Backend response format was invalid.');
  }
  return data;
}

async function fetchWithTimeout(/** @type {any} */ url, /** @type {any} */ options = {}, /** @type {any} */ timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (/** @type {any} */
error) {
    if ((/** @type {any} */ (error))?.name === 'AbortError') {
      throw new Error('Backend request timed out. Please retry.');
    }
    throw new Error('Backend request failed to reach the server.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function getApiBase() {
  return resolveApiBase();
}

export function hasConfiguredBackend() {
  return Boolean(resolveApiBase());
}

function normalizeUid(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase().slice(0, 80);
  return UID_RE.test(normalized) ? normalized : '';
}

function normalizeWalletAddress(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return WALLET_RE.test(normalized) ? normalized : '';
}

function createNonce(/** @type {any} */ length = 24) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  if (!window.crypto?.getRandomValues) {
    throw new Error('Secure randomness unavailable for nonce generation.');
  }
  window.crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

function normalizeNonce(/** @type {any} */ value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return NONCE_RE.test(normalized) ? normalized : createNonce();
}

export async function fetchBackendHealth() {
  const apiBase = resolveApiBase();
  if (!apiBase) {
    throw new Error('No edge backend configured for this host.');
  }
  const response = await fetchWithTimeout(`${apiBase}/health`, {
    headers: { accept: 'application/json' }
  });
  return readJson(response);
}

export async function fetchVaultSummary(/** @type {any} */ uid) {
  const apiBase = resolveApiBase();
  const normalizedUid = normalizeUid(uid);
  if (!apiBase) {
    throw new Error('No edge backend configured for this host.');
  }
  if (!normalizedUid) {
    throw new Error('A valid vault uid is required.');
  }
  const response = await fetchWithTimeout(`${apiBase}/v1/vault/${encodeURIComponent(normalizedUid)}`, {
    headers: { accept: 'application/json' }
  });
  return readJson(response);
}

async function postJson(/** @type {any} */ path, /** @type {any} */ payload, /** @type {any} */ timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiBase = resolveApiBase();
  if (!apiBase) {
    throw new Error('No edge backend configured for this host.');
  }
  const response = await fetchWithTimeout(`${apiBase}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, timeoutMs);
  return readJson(response);
}

function buildSwapPayload(/** @type {any} */ payload = {}) {
  return {
    uid: normalizeUid(payload.uid),
    walletAddress: normalizeWalletAddress(payload.walletAddress || ''),
    offerCode: typeof payload.offerCode === 'string' ? payload.offerCode.trim() : '',
    receiptCode: typeof payload.receiptCode === 'string' ? payload.receiptCode.trim() : '',
    bidderFingerprint: typeof payload.bidderFingerprint === 'string' ? payload.bidderFingerprint.trim().slice(0, 120) : '',
    clientNonce: normalizeNonce(payload.clientNonce || '')
  };
}

/**
 * Publish a swap offer.
 * Primary path: Nostr P2P registry (server-independent).
 * Fallback: Cloudflare D1 backend (when configured and online).
 */
export async function publishSwapOffer(/** @type {any} */ payload = {}) {
  const data = buildSwapPayload(payload);
  if (!data.uid) throw new Error('A valid uid is required for offer publication.');
  if (!data.offerCode) throw new Error('A valid offer code is required.');

  // Try P2P first (always available — works offline with local cache)
  const p2pResult = await publishP2POffer({
    uid: data.uid,
    walletAddress: data.walletAddress,
    offerCode: data.offerCode,
  });
  if (p2pResult.ok) {
    // Also mirror to D1 backend if configured (non-blocking)
    const apiBase = resolveApiBase();
    if (apiBase) {
      postJson('/v1/swap/offers/publish', {
        uid: data.uid,
        walletAddress: data.walletAddress,
        offerCode: data.offerCode,
        clientNonce: data.clientNonce,
      }).catch(() => { /* Mirror failure is non-fatal */ });
    }
    return { ok: true, offerCode: data.offerCode, source: p2pResult.local ? 'local' : 'nostr' };
  }
  // P2P failed — try backend only if configured
  const apiBase = resolveApiBase();
  if (!apiBase) throw new Error('Offer could not be published: P2P network unavailable and no backend configured.');
  return postJson('/v1/swap/offers/publish', {
    uid: data.uid,
    walletAddress: data.walletAddress,
    offerCode: data.offerCode,
    clientNonce: data.clientNonce,
  });
}

/**
 * Verify/look up a swap offer by code.
 * Primary path: local cache → Nostr P2P query.
 * Fallback: Cloudflare D1 backend.
 */
export async function verifySwapOffer(/** @type {any} */ payload = {}) {
  const data = buildSwapPayload(payload);
  if (!data.offerCode) throw new Error('A valid offer code is required.');

  // Try P2P (cache then Nostr relay query)
  const p2pResult = await lookupP2POffer(data.offerCode);
  if (p2pResult.ok && p2pResult.offer) {
    return { ok: true, offer: p2pResult.offer, source: p2pResult.source };
  }
  // Fall back to backend if configured
  const apiBase = resolveApiBase();
  if (!apiBase) return { ok: false, error: 'Offer not found on P2P network and no backend configured.' };
  return postJson('/v1/swap/offers/verify', { offerCode: data.offerCode });
}

/**
 * Reconcile a swap acceptance.
 * Publishes acceptance event to Nostr P2P; mirrors to backend if configured.
 */
export async function reconcileSwapAcceptance(/** @type {any} */ payload = {}) {
  const data = buildSwapPayload(payload);
  if (!data.uid) throw new Error('A valid uid is required for swap reconciliation.');
  if (!data.offerCode || !data.receiptCode) throw new Error('Offer and receipt codes are required.');

  // Publish acceptance on P2P
  const p2pResult = await acceptP2POffer({
    offerCode: data.offerCode,
    receiptCode: data.receiptCode,
    uid: data.uid,
    bidderFingerprint: data.bidderFingerprint,
  });
  if (p2pResult.ok) {
    const apiBase = resolveApiBase();
    if (apiBase) {
      postJson('/v1/swap/offers/reconcile', {
        uid: data.uid,
        walletAddress: data.walletAddress,
        offerCode: data.offerCode,
        receiptCode: data.receiptCode,
        bidderFingerprint: data.bidderFingerprint,
        clientNonce: data.clientNonce,
      }).catch(() => { /* Mirror failure is non-fatal */ });
    }
    return { ok: true, receiptCode: data.receiptCode, source: p2pResult.local ? 'local' : 'nostr' };
  }
  const apiBase = resolveApiBase();
  if (!apiBase) throw new Error('Swap reconciliation failed on P2P and no backend configured.');
  return postJson('/v1/swap/offers/reconcile', {
    uid: data.uid,
    walletAddress: data.walletAddress,
    offerCode: data.offerCode,
    receiptCode: data.receiptCode,
    bidderFingerprint: data.bidderFingerprint,
    clientNonce: data.clientNonce,
  });
}

/**
 * Redeem a swap receipt.
 * Publishes redemption event to Nostr P2P; mirrors to backend if configured.
 */
export async function reconcileSwapReceiptRedeem(/** @type {any} */ payload = {}) {
  const data = buildSwapPayload(payload);
  if (!data.uid) throw new Error('A valid uid is required for receipt redemption.');
  if (!data.receiptCode) throw new Error('A receipt code is required.');

  // Redeem on P2P
  const p2pResult = await redeemP2PReceipt({
    uid: data.uid,
    receiptCode: data.receiptCode,
    offerCode: data.offerCode || '',
  });
  if (p2pResult.ok) {
    const apiBase = resolveApiBase();
    if (apiBase) {
      postJson('/v1/swap/receipts/redeem', {
        uid: data.uid,
        walletAddress: data.walletAddress,
        receiptCode: data.receiptCode,
        clientNonce: data.clientNonce,
      }).catch(() => { /* Mirror failure is non-fatal */ });
    }
    return { ok: true, receiptCode: data.receiptCode, source: p2pResult.local ? 'local' : 'nostr' };
  }
  const apiBase = resolveApiBase();
  if (!apiBase) throw new Error('Receipt redemption failed on P2P and no backend configured.');
  return postJson('/v1/swap/receipts/redeem', {
    uid: data.uid,
    walletAddress: data.walletAddress,
    receiptCode: data.receiptCode,
    clientNonce: data.clientNonce,
  });
}
