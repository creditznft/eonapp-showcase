'use strict';

const DEFAULT_PARAM = 'challenge';

function isObject(/** @type {any} */ value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function bytesToBinary(/** @type {any} */ bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function binaryToBytes(/** @type {any} */ binary) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64Encode(/** @type {any} */ binary) {
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  throw new Error('Base64 encoder unavailable');
}

function base64Decode(/** @type {any} */ base64) {
  if (typeof atob === 'function') {
    return atob(base64);
  }
  throw new Error('Base64 decoder unavailable');
}

function utf8Encode(/** @type {any} */ text) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  const encoded = unescape(encodeURIComponent(text));
  return binaryToBytes(encoded);
}

function utf8Decode(/** @type {any} */ bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(escape(bytesToBinary(bytes)));
}

function toBase64Url(/** @type {any} */ text) {
  const binary = bytesToBinary(utf8Encode(text));
  return base64Encode(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(/** @type {any} */ encoded) {
  const padded = encoded + '==='.slice((encoded.length + 3) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = base64Decode(base64);
  return utf8Decode(binaryToBytes(binary));
}

/** @returns {string} */
function stableStringify(/** @type {unknown} */ value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((/** @type {any} */ v) => stableStringify(v)).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const /** @type {any} */
parts = [];
  for (const /** @type {any} */
key of keys) {
    if ((/** @type {any} */ (value))[key] === undefined) continue;
    parts.push(JSON.stringify(key) + ':' + stableStringify((/** @type {any} */ (value))[key]));
  }
  return '{' + parts.join(',') + '}';
}

function fnv1a(/** @type {any} */ str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createPayloadSignature(/** @type {any} */ payload) {
  return fnv1a(stableStringify(payload));
}

export function encodeChallengePayload(/** @type {any} */ payload) {
  if (!isObject(payload)) return '';
  const /** @type {any} */
normalized = { ...payload };
  delete normalized.sig;
  const /** @type {any} */
signed = { ...normalized, sig: createPayloadSignature(normalized) };
  return toBase64Url(JSON.stringify(signed));
}

export function decodeChallengePayload(/** @type {any} */ encoded, /** @type {any} */ options = {}) {
  if (!encoded || typeof encoded !== 'string') return null;

  try {
    const raw = JSON.parse(fromBase64Url(encoded));
    if (!isObject(raw) || typeof raw.sig !== 'string') return null;

    const { sig, ...unsigned } = raw;
    if (sig !== createPayloadSignature(unsigned)) return null;

    if (options.expectedGame && unsigned.g !== options.expectedGame) return null;
    if (
      options.expectedVersion !== undefined &&
      Number(unsigned.v) !== Number(options.expectedVersion)
    ) {
      return null;
    }

    if (options.maxAgeMs && Number.isFinite(unsigned.ts)) {
      const age = Date.now() - Number(unsigned.ts);
      if (age < 0 || age > options.maxAgeMs) return null;
    }

    return unsigned;
  } catch {
    return null;
  }
}

export function buildChallengeUrl(/** @type {any} */ baseUrl, /** @type {any} */ payload, /** @type {any} */ options = {}) {
  const encoded = encodeChallengePayload(payload);
  if (!encoded) return String(baseUrl || '');

  const param = options.param || DEFAULT_PARAM;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://eonapp.ch';
  const u = new URL(baseUrl || '/', origin);
  u.searchParams.set(param, encoded);
  return u.toString();
}

export function parseChallengeFromUrl(/** @type {any} */ urlLike, /** @type {any} */ options = {}) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://eonapp.ch';
    const u = new URL(urlLike || '/', origin);
    const param = options.param || DEFAULT_PARAM;
    const encoded = u.searchParams.get(param);
    if (!encoded) return null;
    return decodeChallengePayload(encoded, options);
  } catch {
    return null;
  }
}
