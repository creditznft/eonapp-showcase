/** W626B — short-lived loopback origin-authenticated pairing. */
import crypto from 'node:crypto';
import { EON_DIRECT_ALLOWED_APP_ORIGINS } from '../../assets/js/direct-byok/direct-job-contract.js';

const SESSION_MS = 30 * 60 * 1000;
const CHALLENGE_MS = 5 * 60 * 1000;
const PAIR_START_WINDOW_MS = 60 * 1000;
const MAX_PAIR_STARTS_PER_ORIGIN_WINDOW = 3;
const MAX_ACTIVE_CHALLENGES_PER_ORIGIN = 3;
const SAFE_ORIGINS = new Set(EON_DIRECT_ALLOWED_APP_ORIGINS);
const b64 = (value) => Buffer.from(value).toString('base64url');
const unb64 = (value) => Buffer.from(value, 'base64url').toString('utf8');
const hmac = (secret, value) => crypto.createHmac('sha256', secret).update(value).digest('base64url');
const hashCode = (challengeId, code) => crypto.createHash('sha256').update(`${challengeId}:${code}`).digest('hex');

export class CompanionPairingAuthority {
  constructor({ credentialStore, now = () => Date.now(), announce = console.log } = {}) {
    this.store = credentialStore;
    this.now = now;
    this.announce = announce;
    this.challenges = new Map();
    this.startWindows = new Map();
  }
  secret() {
    let value = this.store.get('__session_signing_secret');
    if (!value) { value = crypto.randomBytes(32).toString('base64url'); this.store.set('__session_signing_secret', value); }
    return value;
  }
  sweepChallenges() {
    const now = this.now();
    for (const [challengeId, row] of this.challenges) if (row.expiresAt <= now || row.attempts >= 5) this.challenges.delete(challengeId);
  }
  start(origin) {
    if (!SAFE_ORIGINS.has(String(origin))) throw new Error('origin rejected');
    this.sweepChallenges();
    const safeOrigin = String(origin);
    const now = Number(this.now());
    const recent = (this.startWindows.get(safeOrigin) || []).filter((at) => Number(at) > now - PAIR_START_WINDOW_MS);
    const activeChallenges = [...this.challenges.values()].filter((row) => row.origin === safeOrigin && row.expiresAt > now).length;
    if (recent.length >= MAX_PAIR_STARTS_PER_ORIGIN_WINDOW || activeChallenges >= MAX_ACTIVE_CHALLENGES_PER_ORIGIN) { this.startWindows.set(safeOrigin, recent); throw new Error('pairing start rate limited'); }
    recent.push(now);
    this.startWindows.set(safeOrigin, recent);
    const challengeId = crypto.randomUUID();
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const expiresAt = this.now() + CHALLENGE_MS;
    this.challenges.set(challengeId, { origin, codeHash: hashCode(challengeId, code), expiresAt, attempts: 0 });
    this.announce(`[EON Creator Companion] Pairing code for ${origin}: ${code}`);
    return Object.freeze({ challengeId, expiresAt, codeDisplayedByCompanion: true });
  }
  confirm(origin, challengeId, code) {
    this.sweepChallenges();
    const id = String(challengeId);
    const row = this.challenges.get(id);
    if (!row || row.origin !== origin || row.expiresAt <= this.now()) throw new Error('pairing challenge expired or rejected');
    row.attempts += 1;
    const valid = row.attempts <= 5 && crypto.timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(hashCode(challengeId, String(code))));
    if (!valid) {
      if (row.attempts >= 5) this.challenges.delete(id);
      throw new Error('pairing code rejected');
    }
    this.challenges.delete(id);
    const expiresAt = this.now() + SESSION_MS;
    const payload = b64(JSON.stringify({ origin, issuedAt: this.now(), expiresAt, nonce: crypto.randomUUID() }));
    return Object.freeze({ sessionToken: `${payload}.${hmac(this.secret(), payload)}`, expiresAt });
  }
  authorize(origin, token = '') {
    const [payload, signature] = String(token).split('.');
    if (!payload || !signature) return null;
    const expected = hmac(this.secret(), payload);
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    try {
      const parsed = JSON.parse(unb64(payload));
      const safeOrigin = String(origin);
      const expiresAt = Number(parsed.expiresAt || 0);
      const nonce = String(parsed.nonce || '');
      if (parsed.origin !== safeOrigin || !SAFE_ORIGINS.has(safeOrigin) || expiresAt <= this.now() || !/^[0-9a-f-]{36}$/i.test(nonce)) return null;
      return Object.freeze({ origin: safeOrigin, sessionId: `session:${nonce}`, expiresAt });
    } catch { return null; }
  }
  verify(origin, token = '') { return Boolean(this.authorize(origin, token)); }
}

export function getPairingTruth() { return Object.freeze({ sessionLifetimeMinutes: 30, pairingCodeLifetimeMinutes: 5, maxPairingAttempts: 5, pairStartWindowSeconds: 60, maxPairStartsPerOriginWindow: 3, maxActiveChallengesPerOrigin: 3, challengeReplay: false, sessionOriginBound: true, jobOwnershipSessionBound: true, originAllowlist: [...SAFE_ORIGINS], lanOriginAllowed: false, publicOriginAllowed: false }); }
