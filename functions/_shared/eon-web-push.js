/** Institutional AI V2 — standards-based Web Push custody + delivery helpers.
 *
 * Cloudflare/WHATWG runtime only: Web Crypto + fetch, no Node compatibility flag
 * and no third-party push package. Subscription endpoints are allow-listed to
 * known browser push services to prevent a forged subscription becoming SSRF.
 */
import { normalizeEonNotificationRoute } from '../../config/eon-notification-route-authority.mjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PUSH_ENDPOINT_HOSTS = Object.freeze([
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com'
]);
const PUSH_ENDPOINT_SUFFIXES = Object.freeze(['.push.services.mozilla.com', '.push.apple.com', '.notify.windows.com']);
const CONSENT_VERSION = 'service-device-alerts-v1';
const PAYLOAD_LIMIT = 3000;
const PUSH_FETCH_TIMEOUT_MS = 10_000;

function clean(value = '', max = 1024) {
  let out = '';
  for (const ch of String(value || '').trim()) {
    const code = ch.codePointAt(0) || 0;
    if (code < 32 || code === 127) continue;
    out += ch;
    if (out.length >= max) break;
  }
  return out;
}
function concatBytes(...parts) {
  const arrays = parts.map((part) => part instanceof Uint8Array ? part : new Uint8Array(part || []));
  const total = arrays.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of arrays) { out.set(part, offset); offset += part.byteLength; }
  return out;
}
function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || [])) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromBase64Url(value = '') {
  const raw = clean(value, 4096);
  if (!raw || !/^[A-Za-z0-9_-]+$/.test(raw)) throw new Error('invalid_base64url');
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function uint32be(value) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, Number(value) >>> 0, false);
  return out;
}
async function sha256Bytes(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', value instanceof Uint8Array ? value : encoder.encode(String(value || ''))));
}
async function hmac(keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, dataBytes));
}
async function hkdfExpand(prk, info, length) {
  if (length <= 0 || length > 32) throw new Error('hkdf_length_unsupported');
  const block = await hmac(prk, concatBytes(info, new Uint8Array([1])));
  return block.slice(0, length);
}
function isAllowedPushEndpoint(endpoint = '') {
  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) return false;
    const host = parsed.hostname.toLowerCase();
    return PUSH_ENDPOINT_HOSTS.includes(host) || PUSH_ENDPOINT_SUFFIXES.some((suffix) => host.endsWith(suffix));
  } catch { return false; }
}
function normalizeKey(value = '', expectedBytes = 0) {
  const raw = clean(value, 512);
  const bytes = fromBase64Url(raw);
  if (expectedBytes && bytes.byteLength !== expectedBytes) throw new Error('push_subscription_key_length_invalid');
  return toBase64Url(bytes);
}

export function normalizeEonPushSubscription(value = {}) {
  const endpoint = clean(value?.endpoint, 2048);
  if (!isAllowedPushEndpoint(endpoint)) throw new Error('push_endpoint_not_allowed');
  const expirationTime = value?.expirationTime == null ? null : Number(value.expirationTime);
  if (expirationTime != null && (!Number.isFinite(expirationTime) || expirationTime <= 0)) throw new Error('push_expiration_invalid');
  const p256dh = normalizeKey(value?.keys?.p256dh, 65);
  const auth = normalizeKey(value?.keys?.auth, 16);
  return Object.freeze({ endpoint, expirationTime, keys: Object.freeze({ p256dh, auth }) });
}

export async function fingerprintEonPushSubscriptionEndpoint(value = {}) {
  const normalized = normalizeEonPushSubscription(value);
  return toBase64Url(await sha256Bytes(normalized.endpoint));
}

function pushConfig(env = {}) {
  const publicKey = clean(env.EON_PUSH_VAPID_PUBLIC_KEY, 256);
  const privateKey = clean(env.EON_PUSH_VAPID_PRIVATE_KEY, 256);
  const subject = clean(env.EON_PUSH_VAPID_SUBJECT, 320);
  const encryptionKey = String(env.EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY || '');
  let publicBytes = null;
  let privateBytes = null;
  try { publicBytes = fromBase64Url(publicKey); privateBytes = fromBase64Url(privateKey); } catch {}
  let subjectOk = false;
  try {
    if (/^mailto:/i.test(subject)) subjectOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject.slice(7));
    else { const parsed = new URL(subject); subjectOk = parsed.protocol === 'https:' && !parsed.username && !parsed.password; }
  } catch {}
  const enabled = String(env.EON_PUSH_ROLLOUT || '').toLowerCase();
  const configured = ['testing', 'production'].includes(enabled)
    && publicBytes?.byteLength === 65 && publicBytes[0] === 4
    && privateBytes?.byteLength === 32
    && subjectOk
    && encryptionKey.length >= 32;
  return Object.freeze({ configured, rollout: configured ? enabled : 'disabled', publicKey: configured ? publicKey : '', privateKey: configured ? privateKey : '', subject: configured ? subject : '', encryptionKey: configured ? encryptionKey : '' });
}

export function getEonWebPushConfig(env = {}) {
  const config = pushConfig(env);
  return Object.freeze({ configured: config.configured, rollout: config.rollout, applicationServerKey: config.publicKey, consentVersion: CONSENT_VERSION, payloadLimit: PAYLOAD_LIMIT });
}

async function subscriptionAesKey(secret = '') {
  const digest = await sha256Bytes(encoder.encode(`eonapp:web-push-subscription:v1\0${String(secret || '')}`));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function sealEonPushSubscription(subscription, secret = '') {
  if (String(secret || '').length < 32) throw new Error('push_subscription_encryption_key_invalid');
  const normalized = normalizeEonPushSubscription(subscription);
  const key = await subscriptionAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(normalized));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const endpointHash = toBase64Url(await sha256Bytes(normalized.endpoint));
  return Object.freeze({ encryptedSubscription: toBase64Url(ciphertext), encryptionIv: toBase64Url(iv), endpointHash });
}

export async function openEonPushSubscription(value = {}, secret = '') {
  const encryptedSubscription = String(value?.encryptedSubscription || value?.encrypted_subscription || '');
  const encryptionIv = String(value?.encryptionIv || value?.encryption_iv || '');
  if (String(secret || '').length < 32) throw new Error('push_subscription_encryption_key_invalid');
  const key = await subscriptionAesKey(secret);
  const iv = fromBase64Url(encryptionIv);
  if (iv.byteLength !== 12) throw new Error('push_subscription_iv_invalid');
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64Url(encryptedSubscription));
  return normalizeEonPushSubscription(JSON.parse(decoder.decode(plaintext)));
}

function safeNotificationPayload(value = {}) {
  const title = clean(value?.title || 'EONAPP', 96) || 'EONAPP';
  const body = clean(value?.body, 220);
  const tag = clean(value?.tag || 'eonapp-service-alert', 80).replace(/[^a-z0-9._:-]/gi, '-');
  const route = normalizeEonNotificationRoute(clean(value?.route || '/', 300));
  const secretLike = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;
  if (secretLike.test(`${title}\n${body}`)) throw new Error('push_payload_sensitive_text_blocked');
  const payload = { title, body, tag, route };
  if (encoder.encode(JSON.stringify(payload)).byteLength > PAYLOAD_LIMIT) throw new Error('push_payload_too_large');
  return Object.freeze(payload);
}

async function importVapidSigningKey(publicKey, privateKey) {
  const pub = fromBase64Url(publicKey);
  const d = fromBase64Url(privateKey);
  if (pub.byteLength !== 65 || pub[0] !== 4 || d.byteLength !== 32) throw new Error('vapid_key_invalid');
  const jwk = { kty: 'EC', crv: 'P-256', x: toBase64Url(pub.slice(1, 33)), y: toBase64Url(pub.slice(33, 65)), d: toBase64Url(d), ext: true };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

async function buildVapidAuthorization(endpoint, config, nowMs = Date.now()) {
  const audience = new URL(endpoint).origin;
  const header = toBase64Url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = toBase64Url(encoder.encode(JSON.stringify({ aud: audience, exp: Math.floor(nowMs / 1000) + 12 * 60 * 60, sub: config.subject })));
  const signingInput = `${header}.${payload}`;
  const key = await importVapidSigningKey(config.publicKey, config.privateKey);
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(signingInput)));
  if (signature.byteLength !== 64) throw new Error('vapid_signature_shape_invalid');
  return `vapid t=${signingInput}.${toBase64Url(signature)}, k=${config.publicKey}`;
}

async function encryptPushMessage(subscription, payload) {
  const userPublic = fromBase64Url(subscription.keys.p256dh);
  const authSecret = fromBase64Url(subscription.keys.auth);
  const applicationKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const applicationPublic = new Uint8Array(await crypto.subtle.exportKey('raw', applicationKeys.publicKey));
  const userPublicKey = await crypto.subtle.importKey('raw', userPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: userPublicKey }, applicationKeys.privateKey, 256));

  const prkKey = await hmac(authSecret, sharedSecret);
  const keyInfo = concatBytes(encoder.encode('WebPush: info'), new Uint8Array([0]), userPublic, applicationPublic);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = await hkdfExpand(prk, concatBytes(encoder.encode('Content-Encoding: aes128gcm'), new Uint8Array([0])), 16);
  const nonce = await hkdfExpand(prk, concatBytes(encoder.encode('Content-Encoding: nonce'), new Uint8Array([0])), 12);
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const plaintext = concatBytes(encoder.encode(JSON.stringify(payload)), new Uint8Array([2]));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, plaintext));
  const recordSize = 4096;
  if (ciphertext.byteLength > recordSize) throw new Error('push_ciphertext_record_too_large');
  return concatBytes(salt, uint32be(recordSize), new Uint8Array([applicationPublic.byteLength]), applicationPublic, ciphertext);
}

export async function sendEonWebPush({ subscription, payload, env = {}, fetchImpl = fetch, ttlSeconds = 300 } = {}) {
  const config = pushConfig(env);
  if (!config.configured) return Object.freeze({ ok: false, status: 503, reason: 'web-push-not-configured', permanentFailure: false });
  const normalized = normalizeEonPushSubscription(subscription);
  const safePayload = safeNotificationPayload(payload);
  const body = await encryptPushMessage(normalized, safePayload);
  const authorization = await buildVapidAuthorization(normalized.endpoint, config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PUSH_FETCH_TIMEOUT_MS);
  let response;
  try {
    response = await fetchImpl(normalized.endpoint, {
      method: 'POST',
      headers: {
        authorization,
        'content-encoding': 'aes128gcm',
        'content-type': 'application/octet-stream',
        ttl: String(Math.max(0, Math.min(86400, Math.floor(Number(ttlSeconds) || 0))))
      },
      body,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
  const status = Number(response?.status || 0);
  try { await response?.body?.cancel?.(); } catch {}
  return Object.freeze({ ok: Boolean(response?.ok), status, reason: response?.ok ? 'push-accepted' : `push-service-${status || 'failed'}`, permanentFailure: status === 404 || status === 410 });
}

export function getEonWebPushTruth() {
  return Object.freeze({
    schema: 'eonapp.web-push.institutional-ai-v2.v1',
    explicitSubscriptionOnly: true,
    subscriptionEncryptedAtRest: true,
    endpointAllowlist: true,
    payloadSecretsBlocked: true,
    notificationRoutesUsePublicAppAllowlist: true,
    apiNotificationRoutesAllowed: false,
    contentEncoding: 'aes128gcm',
    authentication: 'vapid-es256',
    marketingConsentImplied: false,
    silentPushSupported: false,
    outboundFetchTimeoutMs: PUSH_FETCH_TIMEOUT_MS
  });
}
