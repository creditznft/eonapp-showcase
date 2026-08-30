/**
 * referral-par.js — W228 signed invite compatibility layer
 *
 * Public links are self-contained signed envelopes. The browser never creates referral value. A received link is retained only
 * as local invite context; proof-gated EONKEYS may be awarded later only by
 * the canonical server referral ledger after activation and abuse checks.
 *
 * Earlier PAR/Nostr/D1 logic is intentionally retired with the commercial
 * backend. The compatibility exports below keep old callers safe while making
 * every value-producing path a no-op.
 */
import { createSignedShareLink, extractSignedToken } from './signed-share-link.js';
import { createRealmShareLink } from './realm-share-runtime.js';
import { captureShareAttribution, readShareAttribution } from './share-attribution.js';

const LS_ISSUED = 'eon:share:issued:v2';
const LS_RECEIVED = 'eon:share:received-invite:v1';
const MAX_ISSUED = 80;

// Compatibility only. They deliberately create no reward or value.
export const PROOF_ACTIONS = new Set();
export const REWARD_POOL_POINTS = 0;
export const DAILY_CAP = 0;
export const REFERRAL_REWARDS_ENABLED = false;

function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJson(key, value) {
  try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); } catch {}
}

function now() { return Date.now(); }

function clean(value, max = 180) {
  return [...String(value || '')]
    .filter((char) => { const code = char.charCodeAt(0); return code >= 32 && code !== 127; })
    .join('').trim().slice(0, max);
}

function profileId(profile = {}) {
  return clean(profile.id || profile.uid || profile.alias || profile.username || 'local-share-issuer', 120) || 'local-share-issuer';
}

function realmSlug() {
  try {
    const raw = readJson('eon:realm:profile:v2', readJson('eon:realm:profile:v1', null));
    return clean(raw?.handle || raw?.username || raw?.slug || '', 80)
      .toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-').replace(/(^-|-$)/g, '');
  } catch { return ''; }
}

function storeIssued(share, issuer, options = {}) {
  const rows = Array.isArray(readJson(LS_ISSUED, [])) ? readJson(LS_ISSUED, []) : [];
  const payload = share?.payload || {};
  const next = {
    nonce: clean(payload.nonce, 96),
    shareId: clean(payload.shareId, 96),
    linkKind: clean(payload.linkKind || 'referral', 40),
    destination: clean(payload.destination || options.destination || '/', 120),
    issuer: clean(issuer, 120),
    source: clean(options.surface || options.source || 'share-center', 80),
    createdAt: now(),
    // Do not store raw token or link. It remains in the user-controlled share
    // output only. This local record is not a referral ledger.
    status: 'issued-local-only'
  };
  const deduped = rows.filter((row) => row?.nonce !== next.nonce);
  writeJson(LS_ISSUED, [...deduped, next].slice(-MAX_ISSUED));
}

/**
 * Creates a durable signed EONAPP invite or safe Realm identity link.
 * This is an invitation surface, not a browser-side reward or affiliate rail.
 */
export async function generateInviteLink(profile = {}, options = {}) {
  const issuerId = profileId(profile);
  const hasRealmShare = Boolean(options.linkKind === 'realm' || options.realmShare === true);
  const origin = options.origin || globalThis.location?.origin || 'https://eonapp.ch';
  const share = hasRealmShare
    ? await createRealmShareLink({
      ...profile,
      username: realmSlug() || profile.username || profile.alias || 'realm'
    }, {
      source: options.surface || options.source || 'share-center',
      origin,
      missionType: 'realm_identity_invite',
      ...(Object.prototype.hasOwnProperty.call(options, 'expiresAt') ? { expiresAt: options.expiresAt } : {})
    })
    : await createSignedShareLink({
      issuerId,
      rootReferralId: issuerId,
      destination: clean(options.destination || '/', 120) || '/',
      source: clean(options.surface || options.source || 'share-center', 80),
      campaignId: clean(options.campaignId || options.campaign || '', 80),
      missionType: 'invite_only',
      parentShareId: '',
      origin,
      ...(Object.prototype.hasOwnProperty.call(options, 'expiresAt') ? { expiresAt: options.expiresAt } : {}),
      ...(Object.prototype.hasOwnProperty.call(options, 'ttlMs') ? { ttlMs: options.ttlMs } : {})
    });
  storeIssued(share, issuerId, options);
  return share.link;
}

/**
 * Captures only local, signed invite context. No request is made and no raw
 * token is stored. This is not a server conversion, qualification event, or EONKEY grant.
 */
export async function captureSignedReferralFromCurrentLocation(profile = {}) {
  try {
    let attribution = readShareAttribution();
    const token = extractSignedToken(globalThis.location?.href || '');
    if (token) {
      const captured = await captureShareAttribution(token);
      if (captured?.ok) attribution = captured.envelope;
    }
    if (!attribution?.verified || !attribution?.nonce) return false;
    const issuer = clean(attribution.rootReferralId, 120);
    const recipient = profileId(profile);
    if (!issuer || issuer === recipient) return false;
    const local = {
      schema: 'eon.share.local-invite.v1',
      nonce: clean(attribution.nonce, 96),
      shareId: clean(attribution.shareId, 96),
      linkKind: clean(attribution.linkKind || 'referral', 40),
      destination: clean(attribution.destination || '/', 120),
      source: clean(attribution.source || 'invite', 80),
      receivedAt: now(),
      status: 'local-invite-context-only'
    };
    writeJson(LS_RECEIVED, local);
    return true;
  } catch { return false; }
}

/** Legacy query links stay retired. */
export function captureProofOfActivityReferral(_params, _profile) {
  return { ok: false, reason: 'legacy_query_referral_retired' };
}

/**
 * An invitation never creates value in the browser. EONKEYS require the
 * canonical server ledger, signed-in identity, anti-abuse checks, and terms.
 */
export async function trySettleProofOfActivityReferral(_actionKey, _profile) {
  return { ok: false, reason: 'server_ledger_required_for_eonkeys' };
}

/** No relay, Nostr, D1, cloud capture, polling, or server tree exists. */
export function listenForReferralProofs(_profile) {
  return () => {};
}

export async function reconcileReferralProofFallbacks(_profile = {}) {
  return { checked: 0, confirmed: 0, reason: 'server_ledger_required_for_eonkeys' };
}

export function startReferralProofFallbackSweep(_profile = {}) { return false; }
export function stopReferralProofFallbackSweep() { return false; }
export async function flushReferralTreeOutbox(_limit = 4) {
  return { ok: true, attempted: 0, confirmed: 0, pending: 0, reason: 'canonical_server_ledger_required' };
}
export async function onGameRunComplete(_gameId, _profile) {
  return { ok: false, reason: 'server_ledger_required_for_eonkeys' };
}
