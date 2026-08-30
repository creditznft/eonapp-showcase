import { randomBytes, webcrypto } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export const EON_LOCAL_COMPANION_TRUST_SCHEMA = 'eon.local-companion.trusted-browser.rt90.v1';
export const EON_LOCAL_COMPANION_CHALLENGE_TTL_MS = 30_000;
const MAX_TRUSTED_BROWSERS = 12;
const MAX_CHALLENGES = 16;

function clean(value = '', max = 260) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function safePublicJwk(value = null) {
  if (!value || typeof value !== 'object') return null;
  const kty = clean(value.kty, 8);
  const crv = clean(value.crv, 16);
  const x = clean(value.x, 80);
  const y = clean(value.y, 80);
  if (kty !== 'EC' || crv !== 'P-256' || !/^[A-Za-z0-9_-]{40,60}$/.test(x) || !/^[A-Za-z0-9_-]{40,60}$/.test(y)) return null;
  return Object.freeze({ kty: 'EC', crv: 'P-256', x, y, ext: true, key_ops: ['verify'] });
}

function b64urlBytes(value = '') {
  const text = clean(value, 512);
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try { return Buffer.from(text, 'base64url'); } catch { return null; }
}

export function resolveEonLocalCompanionTrustStorePath({
  platform = process.platform,
  localAppData = process.env.LOCALAPPDATA || '',
  home = homedir(),
  override = process.env.EON_COMPANION_TRUST_STORE || ''
} = {}) {
  const explicit = clean(override, 1024);
  if (explicit) return explicit;
  // This matches the per-user MSI uninstall contract on Windows. Other
  // platforms retain the established home-directory location.
  if (platform === 'win32' && clean(localAppData, 1024)) return join(clean(localAppData, 1024), 'EONAPP', 'local-companion-trusted-browsers.json');
  return join(home, '.eonapp', 'local-companion-trusted-browsers.json');
}

function defaultStorePath() {
  return resolveEonLocalCompanionTrustStorePath();
}

function legacyStorePath() {
  return join(homedir(), '.eonapp', 'local-companion-trusted-browsers.json');
}

export function createEonLocalCompanionTrustedBrowserManager({
  now = () => Date.now(),
  randomId = () => randomBytes(24).toString('base64url'),
  randomNonce = () => randomBytes(32).toString('base64url'),
  storePath = defaultStorePath(),
  persist = true
} = {}) {
  const trusted = new Map();
  const challenges = new Map();

  function key(origin = '', keyId = '') { return `${clean(origin, 240)}\n${clean(keyId, 120)}`; }

  function load() {
    if (!persist) return;
    const legacy = legacyStorePath();
    for (const candidate of [storePath, ...(legacy !== storePath ? [legacy] : [])]) {
      try {
        const parsed = JSON.parse(readFileSync(candidate, 'utf8'));
        if (parsed?.schema !== EON_LOCAL_COMPANION_TRUST_SCHEMA || !Array.isArray(parsed.entries)) continue;
        for (const row of parsed.entries.slice(-MAX_TRUSTED_BROWSERS)) {
          const origin = clean(row?.origin, 240);
          const keyId = clean(row?.keyId, 120);
          const publicKeyJwk = safePublicJwk(row?.publicKeyJwk);
          if (!origin || !keyId || !publicKeyJwk) continue;
          trusted.set(key(origin, keyId), { origin, keyId, publicKeyJwk, createdAt: Number(row?.createdAt) || now(), lastUsedAt: Number(row?.lastUsedAt) || 0 });
        }
        // Migrate a valid legacy record on its next successful read, so the
        // Windows MSI uninstall scope is exact for future runs.
        if (candidate !== storePath) save();
        return;
      } catch {}
    }
  }

  function save() {
    if (!persist) return true;
    try {
      mkdirSync(dirname(storePath), { recursive: true, mode: 0o700 });
      const entries = [...trusted.values()].slice(-MAX_TRUSTED_BROWSERS);
      const body = JSON.stringify({ schema: EON_LOCAL_COMPANION_TRUST_SCHEMA, entries }, null, 2);
      const temp = `${storePath}.tmp`;
      writeFileSync(temp, body, { encoding: 'utf8', mode: 0o600 });
      renameSync(temp, storePath);
      return true;
    } catch { return false; }
  }

  function prune() {
    const at = now();
    for (const [id, row] of challenges) if (!row || row.expiresAt <= at || row.used) challenges.delete(id);
    while (challenges.size > MAX_CHALLENGES) challenges.delete(challenges.keys().next().value);
    while (trusted.size > MAX_TRUSTED_BROWSERS) trusted.delete(trusted.keys().next().value);
  }

  function register(origin = '', keyId = '', publicKeyJwk = null) {
    prune();
    const safeOrigin = clean(origin, 240);
    const safeKeyId = clean(keyId, 120);
    const safeJwk = safePublicJwk(publicKeyJwk);
    if (!safeOrigin || !safeKeyId || !safeJwk) return Object.freeze({ ok: false, error: 'trusted-browser-key-invalid' });
    const id = key(safeOrigin, safeKeyId);
    const previous = trusted.get(id);
    trusted.set(id, { origin: safeOrigin, keyId: safeKeyId, publicKeyJwk: safeJwk, createdAt: previous?.createdAt || now(), lastUsedAt: previous?.lastUsedAt || 0 });
    prune();
    save();
    return Object.freeze({ ok: true, keyId: safeKeyId, origin: safeOrigin });
  }

  function createChallenge(origin = '', keyId = '') {
    prune();
    const safeOrigin = clean(origin, 240);
    const safeKeyId = clean(keyId, 120);
    const trust = trusted.get(key(safeOrigin, safeKeyId));
    if (!trust) return Object.freeze({ ok: false, error: 'trusted-browser-not-found' });
    let challengeId = '';
    do { challengeId = clean(randomId(), 120); } while (!challengeId || challenges.has(challengeId));
    const nonce = clean(randomNonce(), 180);
    if (!nonce) return Object.freeze({ ok: false, error: 'trusted-browser-challenge-failed' });
    const expiresAt = now() + EON_LOCAL_COMPANION_CHALLENGE_TTL_MS;
    challenges.set(challengeId, { challengeId, origin: safeOrigin, keyId: safeKeyId, nonce, expiresAt, used: false });
    return Object.freeze({ ok: true, challengeId, nonce, expiresAt: new Date(expiresAt).toISOString() });
  }

  async function verifyChallenge(origin = '', keyId = '', challengeId = '', signature = '') {
    prune();
    const safeOrigin = clean(origin, 240);
    const safeKeyId = clean(keyId, 120);
    const safeChallengeId = clean(challengeId, 120);
    const row = challenges.get(safeChallengeId);
    const trust = trusted.get(key(safeOrigin, safeKeyId));
    if (!row || !trust || row.origin !== safeOrigin || row.keyId !== safeKeyId || row.used) return Object.freeze({ ok: false, error: 'trusted-browser-challenge-invalid' });
    const bytes = b64urlBytes(signature);
    if (!bytes || bytes.length < 48 || bytes.length > 96) return Object.freeze({ ok: false, error: 'trusted-browser-signature-invalid' });
    const message = new TextEncoder().encode(`eon-local-companion:${safeOrigin}:${safeChallengeId}:${row.nonce}`);
    let verified = false;
    try {
      const publicKey = await webcrypto.subtle.importKey('jwk', trust.publicKeyJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      verified = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, bytes, message);
    } catch { verified = false; }
    row.used = true;
    challenges.delete(safeChallengeId);
    if (!verified) return Object.freeze({ ok: false, error: 'trusted-browser-signature-invalid' });
    trust.lastUsedAt = now();
    save();
    return Object.freeze({ ok: true, keyId: safeKeyId, origin: safeOrigin });
  }

  function revoke(origin = '', keyId = '') {
    const removed = trusted.delete(key(origin, keyId));
    save();
    return Object.freeze({ ok: true, removed });
  }

  function has(origin = '', keyId = '') { return trusted.has(key(origin, keyId)); }
  function clear() { trusted.clear(); challenges.clear(); save(); }

  load();
  return Object.freeze({ register, createChallenge, verifyChallenge, revoke, has, clear, size: () => trusted.size });
}
