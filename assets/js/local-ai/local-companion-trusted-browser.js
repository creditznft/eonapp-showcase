/** RT90 trusted-browser credential: persistent public-key identity without a persistent bearer token. */
const DB_NAME = 'eon-local-companion-trust-v1';
const STORE_NAME = 'credentials';
const RECORD_ID = 'primary';

function hasBrowserCrypto() {
  return Boolean(globalThis.crypto?.subtle && globalThis.indexedDB && typeof TextEncoder !== 'undefined');
}

function openDb() {
  if (!hasBrowserCrypto()) return Promise.resolve(null);
  return new Promise((resolve) => {
    let request;
    try { request = globalThis.indexedDB.open(DB_NAME, 1); } catch { resolve(null); return; }
    request.onupgradeneeded = () => {
      try {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } catch {}
    };
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function readRecord() {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(RECORD_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
      tx.oncomplete = () => { try { db.close(); } catch {} };
    } catch { try { db.close(); } catch {}; resolve(null); }
  });
}

async function writeRecord(record) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => { try { db.close(); } catch {}; resolve(true); };
      tx.onerror = () => { try { db.close(); } catch {}; resolve(false); };
      tx.onabort = () => { try { db.close(); } catch {}; resolve(false); };
    } catch { try { db.close(); } catch {}; resolve(false); }
  });
}

function b64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function keyIdFor(publicKeyJwk = {}) {
  const stable = JSON.stringify({ kty: publicKeyJwk.kty, crv: publicKeyJwk.crv, x: publicKeyJwk.x, y: publicKeyJwk.y });
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable));
  return `eon-${b64url(digest).slice(0, 32)}`;
}

function validRecord(record = null) {
  return Boolean(
    record?.id === RECORD_ID
    && /^eon-[A-Za-z0-9_-]{16,40}$/.test(String(record?.keyId || ''))
    && record?.privateKey?.type === 'private'
    && record?.privateKey?.extractable === false
    && record?.publicKeyJwk?.kty === 'EC'
    && record?.publicKeyJwk?.crv === 'P-256'
  );
}

export async function readEonLocalCompanionTrustCredential() {
  if (!hasBrowserCrypto()) return null;
  try {
    const record = await readRecord();
    return validRecord(record) ? record : null;
  } catch { return null; }
}

export async function ensureEonLocalCompanionTrustCredential() {
  const existing = await readEonLocalCompanionTrustCredential();
  if (existing) return existing;
  if (!hasBrowserCrypto()) return null;
  try {
    // Generate exportable only long enough to extract the public point and re-import
    // the private key as non-extractable before anything is persisted.
    const generated = await globalThis.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const publicKeyJwk = await globalThis.crypto.subtle.exportKey('jwk', generated.publicKey);
    const temporaryPrivateJwk = await globalThis.crypto.subtle.exportKey('jwk', generated.privateKey);
    const privateKey = await globalThis.crypto.subtle.importKey('jwk', temporaryPrivateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const keyId = await keyIdFor(publicKeyJwk);
    const record = Object.freeze({ id: RECORD_ID, keyId, privateKey, publicKeyJwk: Object.freeze({ kty: 'EC', crv: 'P-256', x: publicKeyJwk.x, y: publicKeyJwk.y, ext: true, key_ops: ['verify'] }), createdAt: new Date().toISOString() });
    if (!await writeRecord(record)) return null;
    return record;
  } catch { return null; }
}

export async function eonLocalCompanionTrustRegistration() {
  const record = await ensureEonLocalCompanionTrustCredential();
  if (!record) return null;
  return Object.freeze({ keyId: record.keyId, publicKeyJwk: record.publicKeyJwk });
}

export async function signEonLocalCompanionChallenge({ challengeId = '', nonce = '', origin = globalThis.location?.origin || '' } = {}) {
  const record = await readEonLocalCompanionTrustCredential();
  if (!record || !challengeId || !nonce || !origin) return null;
  try {
    const message = new TextEncoder().encode(`eon-local-companion:${origin}:${challengeId}:${nonce}`);
    const signature = await globalThis.crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, record.privateKey, message);
    return Object.freeze({ keyId: record.keyId, signature: b64url(signature) });
  } catch { return null; }
}

export async function clearEonLocalCompanionTrustCredential() {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(RECORD_ID);
      tx.oncomplete = () => { try { db.close(); } catch {}; resolve(true); };
      tx.onerror = () => { try { db.close(); } catch {}; resolve(false); };
    } catch { try { db.close(); } catch {}; resolve(false); }
  });
}
