/**
 * Canonical encoding helpers for eon.share-link.v1.
 * Browser/worker safe; no third-party dependencies.
 */

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

export function utf8Encode(value = '') {
  return new TextEncoder().encode(String(value));
}

export function utf8Decode(bytes) {
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64Url(bytes) {
  let binary = '';
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < input.length; i += 0x8000) {
    binary += String.fromCharCode(...input.subarray(i, i + 0x8000));
  }
  const base64 = globalThis.btoa ? globalThis.btoa(binary) : globalThis.Buffer.from(input).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlToBytes(value = '') {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (!globalThis.atob) return new Uint8Array(globalThis.Buffer.from(padded, 'base64'));
  const binary = globalThis.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeJsonBase64Url(value) {
  return bytesToBase64Url(utf8Encode(canonicalize(value)));
}

export function decodeJsonBase64Url(value) {
  return JSON.parse(utf8Decode(base64UrlToBytes(value)));
}

export async function sha256Bytes(value) {
  const bytes = typeof value === 'string' ? utf8Encode(value) : value;
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function sha256Base64Url(value) {
  return bytesToBase64Url(await sha256Bytes(value));
}

export function crockfordBase32(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += CROCKFORD[(value << (5 - bits)) & 31];
  return output;
}

export async function deriveMissionCode(fullSignedToken) {
  return `EON-${crockfordBase32(await sha256Bytes(fullSignedToken)).slice(0, 8)}`;
}

export function randomBytes(length = 16) {
  const bytes = new Uint8Array(Math.max(16, Number(length) || 16));
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomId(length = 16) {
  return bytesToBase64Url(randomBytes(length));
}
