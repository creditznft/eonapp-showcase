/** Device P-256 identity used only for signed public share links.
 * Primary storage is a non-extractable CryptoKey in IndexedDB. The JWK
 * localStorage path exists only as a compatibility fallback where IndexedDB
 * cannot persist CryptoKey objects.
 */
import { base64UrlToBytes, bytesToBase64Url, canonicalize, sha256Base64Url, sha256Bytes, utf8Encode } from './share-link-codec.js';

const STORAGE_KEY = 'eon:share-link-identity:p256:v1';
const MEMORY_KEY = '__eonShareIdentityV1';
const DB_NAME = 'eon-share-identity';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const RECORD_ID = 'p256-v1';

function readStoredIdentity() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

function saveStoredIdentity(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
}

function clearStoredIdentity() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function openIdentityDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    let request;
    try { request = indexedDB.open(DB_NAME, DB_VERSION); } catch { resolve(null); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function readIndexedIdentity() {
  const db = await openIdentityDb();
  if (!db) return null;
  return new Promise((resolve) => {
    let request;
    try { request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_ID); }
    catch { db.close(); resolve(null); return; }
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); resolve(null); };
  });
}

async function saveIndexedIdentity(value) {
  const db = await openIdentityDb();
  if (!db) return false;
  return new Promise((resolve) => {
    let request;
    try { request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({ id: RECORD_ID, ...value }); }
    catch { db.close(); resolve(false); return; }
    request.onsuccess = () => { db.close(); resolve(true); };
    request.onerror = () => { db.close(); resolve(false); };
  });
}

async function importPublicKey(publicJwk) {
  return crypto.subtle.importKey('jwk', publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
}

async function importIdentity(jwkPair) {
  const algorithm = { name: 'ECDSA', namedCurve: 'P-256' };
  const privateKey = await crypto.subtle.importKey('jwk', jwkPair.privateJwk, algorithm, false, ['sign']);
  const publicKey = await importPublicKey(jwkPair.publicJwk);
  return { privateKey, publicKey, publicJwk: jwkPair.publicJwk };
}

async function fingerprintPublicKey(publicJwk) {
  return (await sha256Base64Url(canonicalize(publicJwk))).slice(0, 24);
}

export async function createShareIdentity() {
  // Generate extractable once so the public key can travel inside the token,
  // then immediately re-import the signing key as non-extractable for storage.
  const generated = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const publicJwk = await crypto.subtle.exportKey('jwk', generated.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', generated.privateKey);
  const privateKey = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const publicKey = await importPublicKey(publicJwk);
  const fingerprint = await fingerprintPublicKey(publicJwk);
  const createdAt = Date.now();

  const persisted = await saveIndexedIdentity({ privateKey, publicJwk, fingerprint, createdAt });
  if (persisted) clearStoredIdentity();
  else saveStoredIdentity({ publicJwk, privateJwk, fingerprint, createdAt, fallback: 'indexeddb-unavailable' });

  const identity = { privateKey, publicKey, publicJwk, fingerprint, storage: persisted ? 'indexeddb-nonextractable' : 'local-fallback' };
  identity.referralAddress = await getShareReferralAddress(identity);
  return identity;
}

export async function getOrCreateShareIdentity() {
  if (globalThis[MEMORY_KEY]) return globalThis[MEMORY_KEY];

  let identity = null;
  const indexed = await readIndexedIdentity();
  if (indexed?.privateKey && indexed?.publicJwk) {
    try {
      identity = {
        privateKey: indexed.privateKey,
        publicKey: await importPublicKey(indexed.publicJwk),
        publicJwk: indexed.publicJwk,
        fingerprint: indexed.fingerprint || await fingerprintPublicKey(indexed.publicJwk),
        storage: 'indexeddb-nonextractable'
      };
    } catch { identity = null; }
  }

  if (!identity && typeof localStorage !== 'undefined') {
    const stored = readStoredIdentity();
    if (stored?.privateJwk && stored?.publicJwk) {
      try {
        const imported = await importIdentity(stored);
        identity = {
          ...imported,
          fingerprint: stored.fingerprint || await fingerprintPublicKey(stored.publicJwk),
          storage: 'local-fallback'
        };
        // Migrate old/fallback JWK material into non-extractable IndexedDB storage
        // whenever the browser supports CryptoKey structured cloning.
        if (await saveIndexedIdentity({
          privateKey: imported.privateKey,
          publicJwk: stored.publicJwk,
          fingerprint: identity.fingerprint,
          createdAt: stored.createdAt || Date.now()
        })) {
          clearStoredIdentity();
          identity.storage = 'indexeddb-nonextractable';
        }
      } catch { identity = null; }
    }
  }

  if (!identity) identity = await createShareIdentity();
  if (identity && !identity.referralAddress) {
    try { identity.referralAddress = await getShareReferralAddress(identity); } catch {}
  }
  globalThis[MEMORY_KEY] = identity;
  return identity;
}

export async function signSharePayload(canonicalPayload, identity = null) {
  const signer = identity || await getOrCreateShareIdentity();
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signer.privateKey, utf8Encode(canonicalPayload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifySharePayload(canonicalPayload, signature, publicJwk) {
  try {
    const key = await crypto.subtle.importKey('jwk', publicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, base64UrlToBytes(signature), utf8Encode(canonicalPayload));
  } catch {
    return false;
  }
}

export async function exportShareIdentityPublicRaw(identity = null) {
  const selected = identity || await getOrCreateShareIdentity();
  if (!selected?.publicKey) throw new Error('missing_share_public_key');
  const raw = await crypto.subtle.exportKey('raw', selected.publicKey);
  return new Uint8Array(raw);
}

/**
 * Stable, self-certifying referral address for this signing identity.
 * It is derived from the public key, never allocated by a central database,
 * and is safe to place inside a signed referral envelope.
 */
export async function getShareReferralAddress(identity = null) {
  const selected = identity || await getOrCreateShareIdentity();
  if (selected?.referralAddress) return selected.referralAddress;
  const raw = await exportShareIdentityPublicRaw(selected);
  const address = `eonr_${bytesToBase64Url((await sha256Bytes(raw)).slice(0, 16))}`;
  try { selected.referralAddress = address; } catch {}
  return address;
}

export function exportShareIdentityPublic(identity) {
  return identity?.publicJwk ? { ...identity.publicJwk } : null;
}
