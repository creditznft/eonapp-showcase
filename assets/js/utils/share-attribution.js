/** Unified eon.attribution.v2 capture and legacy migration. */
import { extractSignedToken, verifySignedShareToken } from './signed-share-link.js';

export const ATTRIBUTION_SCHEMA = 'eon.attribution.v2';
export const ATTRIBUTION_STORAGE_KEY = 'eon:share-attribution:v2';
export const ATTRIBUTION_SESSION_TOKEN_KEY = 'eon:share-attribution-token:v1';
const LEGACY_FIELDS = ['ref', 'r', 'nonce', 'exp', 'camp', 'src', 'vref', 'route', 'placement', 'surface', 'ctx'];

function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeSessionStorage() {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

function withoutRawToken(envelope = {}) {
  const { token: _token, rawToken: _rawToken, ...publicEnvelope } = envelope || {};
  return publicEnvelope;
}

function saveEnvelope(envelope) {
  const safe = withoutRawToken(envelope);
  try { safeStorage()?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(safe)); } catch {}
  return safe;
}

function savePendingShareToken(token = '') {
  const value = String(token || '').trim();
  if (!value) return '';
  try { safeSessionStorage()?.setItem(ATTRIBUTION_SESSION_TOKEN_KEY, value); } catch {}
  return value;
}

export function readPendingShareToken() {
  try { return String(safeSessionStorage()?.getItem(ATTRIBUTION_SESSION_TOKEN_KEY) || '').trim(); } catch { return ''; }
}

export function clearPendingShareToken() {
  try { safeSessionStorage()?.removeItem(ATTRIBUTION_SESSION_TOKEN_KEY); } catch {}
}

export function readShareAttribution() {
  try { return JSON.parse(safeStorage()?.getItem(ATTRIBUTION_STORAGE_KEY) || 'null'); } catch { return null; }
}

export function legacyParamsToAttribution(params, options = {}) {
  const source = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
  const rootReferralId = String(source.get('ref') || source.get('r') || source.get('vref') || '').slice(0, 96);
  if (!rootReferralId && !LEGACY_FIELDS.some((key) => source.has(key))) return null;
  return {
    schema: ATTRIBUTION_SCHEMA,
    version: 2,
    trustLevel: 0,
    verified: false,
    migratedFromLegacy: true,
    rootReferralId,
    shareId: String(source.get('nonce') || '').slice(0, 128),
    parentShareId: '',
    campaignId: String(source.get('camp') || '').slice(0, 96),
    missionCode: '',
    source: String(source.get('src') || source.get('surface') || options.source || 'legacy').slice(0, 40),
    destination: String(source.get('route') || options.destination || globalThis.location?.pathname || '/').slice(0, 180),
    placement: String(source.get('placement') || '').slice(0, 64),
    context: String(source.get('ctx') || '').slice(0, 160),
    nonce: String(source.get('nonce') || '').slice(0, 128),
    expiresAt: Number(source.get('exp') || 0),
    capturedAt: Date.now()
  };
}

export async function signedTokenToAttribution(input, options = {}) {
  const verified = await verifySignedShareToken(input, options);
  if (!verified.ok) return { ok: false, reason: verified.reason, envelope: null, transientToken: '' };
  const p = verified.payload;
  const envelope = {
    schema: ATTRIBUTION_SCHEMA,
    version: 2,
    trustLevel: 1,
    verified: true,
    migratedFromLegacy: false,
    tokenHashCode: verified.missionCode,
    missionCode: verified.missionCode,
    issuer: p.issuer,
    rootReferralId: p.rootReferralId,
    shareId: p.shareId,
    parentShareId: p.parentShareId || '',
    campaignId: p.campaignId || '',
    missionType: p.missionType,
    linkKind: p.linkKind || 'referral',
    realm: p.realm || null,
    source: p.source,
    destination: p.destination,
    nonce: p.nonce,
    issuedAt: p.issuedAt,
    expiresAt: p.expiresAt,
    capturedAt: Date.now()
  };
  return { ok: true, reason: 'verified', envelope, transientToken: verified.token };
}

export async function captureShareAttribution(input = globalThis.location?.href || '', options = {}) {
  const token = extractSignedToken(input);
  if (token) {
    const signed = await signedTokenToAttribution(token, options);
    if (signed.ok) {
      savePendingShareToken(signed.transientToken);
      return { ...signed, envelope: saveEnvelope(signed.envelope) };
    }
    return signed;
  }
  let url;
  try { url = new URL(String(input || ''), globalThis.location?.origin || 'https://eonapp.ch'); } catch { return { ok: false, reason: 'invalid-url', envelope: null }; }
  const legacy = legacyParamsToAttribution(url.searchParams, { ...options, destination: url.pathname });
  if (!legacy) return { ok: false, reason: 'no-attribution', envelope: null };
  return { ok: true, reason: 'legacy-migrated', envelope: saveEnvelope(legacy) };
}

export function clearShareAttribution() {
  try { safeStorage()?.removeItem(ATTRIBUTION_STORAGE_KEY); } catch {}
  clearPendingShareToken();
}

export function buildAttributionEnvelope(overrides = {}) {
  const current = readShareAttribution() || {};
  return withoutRawToken({
    schema: ATTRIBUTION_SCHEMA,
    version: 2,
    capturedAt: Date.now(),
    ...current,
    ...overrides
  });
}
