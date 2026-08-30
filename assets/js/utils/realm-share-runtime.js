/**
 * Runtime helpers for portable EON Realm links.
 *
 * The signed eon3 envelope is the portable public snapshot. The browser keeps
 * only a verified, minimal renderer profile after opening it; no raw token is
 * copied into a referral database, and no Cloudflare registry is required.
 */
import { createRealmPublicId, createSignedShareLink, normalizeRealmHandle } from './signed-share-link.js';

export const INCOMING_REALM_SHARE_STORAGE_KEY = 'eon:realm:incoming-verified-share:v1';
export const REALM_PUBLIC_ID_STORAGE_KEY = 'eon:realm:public-id:v1';
export const REALM_PUBLIC_ID_MAP_STORAGE_KEY = 'eon:realm:public-id-map:v1';

function safeStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 80) {
  return Array.from(String(value || ''))
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, max);
}

function getStoredRealmId() {
  try { return String(safeStorage()?.getItem(REALM_PUBLIC_ID_STORAGE_KEY) || ''); } catch { return ''; }
}

function readRealmIdMap() {
  try {
    const parsed = JSON.parse(safeStorage()?.getItem(REALM_PUBLIC_ID_MAP_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function writeRealmIdMap(value) {
  try { safeStorage()?.setItem(REALM_PUBLIC_ID_MAP_STORAGE_KEY, JSON.stringify(value || {})); } catch {}
}

function normalizeRealmIdentityKey(profile = {}) {
  const raw = profile?.realmHandle || profile?.username || profile?.slug || profile?.alias || profile?.id || profile?.uid || '';
  try { return normalizeRealmHandle(raw); } catch { return 'default'; }
}

function persistRealmId(value, key = 'default') {
  const safe = String(value || '');
  try { safeStorage()?.setItem(REALM_PUBLIC_ID_STORAGE_KEY, safe); } catch {}
  const map = readRealmIdMap();
  map[String(key || 'default').slice(0, 64)] = safe;
  writeRealmIdMap(map);
  return safe;
}

/**
 * Returns a stable public id per local Realm identity. It is intentionally
 * not a global singleton: two different local Realm handles get different
 * 128-bit ids, while every new share of the same Realm keeps the same id.
 */
export function getOrCreateRealmPublicId(profile = {}) {
  const key = normalizeRealmIdentityKey(profile);
  const supplied = String(profile?.publicRealmId || profile?.realmPublicId || '');
  const map = readRealmIdMap();
  const mapped = String(map[key] || '');
  const legacy = key === 'default' ? getStoredRealmId() : '';
  const existing = supplied || mapped || legacy;
  if (/^eonrealm_[A-Za-z0-9_-]{22}$/.test(existing)) return persistRealmId(existing, key);
  return persistRealmId(createRealmPublicId(), key);
}

export async function createRealmShareLink(profile = {}, options = {}) {
  const handle = normalizeRealmHandle(options.handle || profile.username || profile.slug || profile.alias || '');
  const realmId = options.realmId || getOrCreateRealmPublicId(profile);
  const displayName = cleanText(options.displayName || profile.displayName || profile.name || profile.alias || handle, 48);
  const theme = cleanText(options.theme || profile.theme || 'dark-purple', 32);
  const share = await createSignedShareLink({
    linkKind: 'realm',
    realmId,
    realmHandle: handle,
    realmLabel: displayName,
    realmTheme: theme,
    destination: `/u/${handle}`,
    source: options.source || 'realm',
    missionType: 'share_realm',
    origin: options.origin,
    identity: options.identity,
    // Defaults to 0: durable public link. Caller may opt into a time-bound link.
    ...(Object.prototype.hasOwnProperty.call(options, 'expiresAt') ? { expiresAt: options.expiresAt } : {}),
    ...(Object.prototype.hasOwnProperty.call(options, 'ttlMs') ? { ttlMs: options.ttlMs } : {}),
  });
  return share;
}

export function saveIncomingRealmShare(payload = {}, missionCode = '') {
  const realm = payload?.realm;
  if (!realm?.id || !realm?.handle) return null;
  const safe = {
    schema: 'eon.realm.incoming-share.v1',
    verified: true,
    receivedAt: Date.now(),
    missionCode: cleanText(missionCode, 24),
    rootReferralId: cleanText(payload.rootReferralId, 96),
    shareId: cleanText(payload.shareId, 128),
    source: cleanText(payload.source || 'realm', 40),
    expiresAt: Number(payload.expiresAt || 0),
    realm: {
      id: cleanText(realm.id, 48),
      handle: cleanText(realm.handle, 48),
      displayName: cleanText(realm.displayName || realm.handle, 48),
      theme: cleanText(realm.theme || 'dark-purple', 32),
      renderer: cleanText(realm.renderer || 'deterministic-2d-profile-v1', 64),
    }
  };
  try { safeStorage()?.setItem(INCOMING_REALM_SHARE_STORAGE_KEY, JSON.stringify(safe)); } catch {}
  return safe;
}

export function readIncomingRealmShare(expectedHandle = '') {
  try {
    const record = JSON.parse(safeStorage()?.getItem(INCOMING_REALM_SHARE_STORAGE_KEY) || 'null');
    if (!record?.verified || !record?.realm?.id || !record?.realm?.handle) return null;
    if (Number(record.expiresAt || 0) > 0 && Number(record.expiresAt) < Date.now()) return null;
    if (expectedHandle) {
      const normalized = normalizeRealmHandle(expectedHandle);
      if (normalized !== record.realm.handle) return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function clearIncomingRealmShare() {
  try { safeStorage()?.removeItem(INCOMING_REALM_SHARE_STORAGE_KEY); } catch {}
}

export function buildPortableRealmProfile(record = {}) {
  const realm = record?.realm || {};
  if (!realm.id || !realm.handle) return null;
  return {
    publicRealmId: realm.id,
    username: realm.handle,
    displayName: realm.displayName || realm.handle,
    emoji: '⚡',
    theme: realm.theme || 'dark-purple',
    referralCode: '',
    compute: { hardware: '', pricePerCU: 0.01, minUnitsPerRequest: 10, maxParallelJobs: 1, available: false, serviceTypes: [] },
    portableShare: true,
    incomingShareMissionCode: record.missionCode || '',
    incomingShareRootReferralId: record.rootReferralId || '',
  };
}
