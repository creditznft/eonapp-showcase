import { sign, verify, loadOrCreateDeviceKeys } from './secure-keystore.js';
import { getActiveProfileUid, ensureTrustedDeviceKey, isTrustedDeviceKey } from './profile.js';

const MAX_NONCES = 64;

function getNonceKey(uid) {
  return `eon:${uid}:nonceCache:v1`;
}

function randomNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function nowTs() {
  return Math.floor(Date.now() / 1000);
}

function loadCache(uid) {
  try {
    return JSON.parse(localStorage.getItem(getNonceKey(uid)) || '{}');
  } catch {
    return {};
  }
}

function saveCache(uid, cache) {
  try {
    localStorage.setItem(getNonceKey(uid), JSON.stringify(cache));
  } catch (e) {
    console.warn('[nonce cache failed]', e);
  }
}

function hasNonce(uid, type, nonce) {
  const cache = loadCache(uid);
  return Boolean(cache?.[uid]?.[type]?.includes(nonce));
}

function registerNonce(uid, type, nonce) {
  const cache = loadCache(uid);
  cache[uid] = cache[uid] || {};
  cache[uid][type] = cache[uid][type] || [];
  cache[uid][type].push(nonce);
  if (cache[uid][type].length > MAX_NONCES) cache[uid][type].shift();
  saveCache(uid, cache);
}

function canonicalMessage(uid, type, nonce, ts, payload) {
  return JSON.stringify({ uid, type, nonce, ts, payload });
}

export async function makeEnvelope(type, payload) {
  const uid = getActiveProfileUid();
  const nonce = randomNonce();
  const ts = nowTs();
  const message = canonicalMessage(uid, type, nonce, ts, payload);
  const sig = await sign(message);
  const { publicKeyBase64 } = await loadOrCreateDeviceKeys();
  ensureTrustedDeviceKey(publicKeyBase64);
  return { uid, type, payload, nonce, ts, sig, pubKey: publicKeyBase64 };
}

export async function verifyEnvelope(env) {
  if (!env || typeof env !== 'object') return false;
  if (!env.sig) return true; // legacy read-only path

  const { uid, type, payload, nonce, ts, sig, pubKey } = env;
  if (!uid || !type || !nonce || !ts || !sig || !pubKey) return false;

  const activeUid = getActiveProfileUid();
  if (uid !== activeUid) return false;
  if (!isTrustedDeviceKey(pubKey)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(ts - now) > 86400) return false;

  const message = canonicalMessage(uid, type, nonce, ts, payload);
  return Boolean(await verify(message, sig, pubKey));
}

export async function consumeEnvelope(env) {
  if (!env || typeof env !== 'object') return false;
  if (!env.sig) return true;

  const { uid, type, nonce } = env;
  if (!uid || !type || !nonce) return false;
  if (hasNonce(uid, type, nonce)) return false;

  const ok = await verifyEnvelope(env);
  if (!ok) return false;

  registerNonce(uid, type, nonce);
  return true;
}
