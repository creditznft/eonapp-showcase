/**
 * EONAPP self-contained signed share links.
 *
 * W212/W213 link contract:
 * - Links are signed, self-contained capability-free public references.
 * - No link, alias, click, or open is allocated in Cloudflare D1/KV/Workers.
 * - D1 retains only pseudonymous, qualified referral-tree relationships after
 *   a real qualifying action. It never resolves a share URL.
 * - eon2: compact referral/general link with a fresh 128-bit share id.
 * - eon3: compact portable Realm profile link with a stable 128-bit realm id
 *   plus a fresh 128-bit share id.
 * - eon1: compatibility / lineage-rich envelope for historical links.
 *
 * Links are public identifiers, never wallet private keys, recovery phrases,
 * credentials, payment instructions, or entitlement proofs.
 */
import {
  base64UrlToBytes,
  bytesToBase64Url,
  decodeJsonBase64Url,
  deriveMissionCode,
  encodeJsonBase64Url,
  randomBytes,
  randomId,
  sha256Bytes,
  utf8Decode,
  utf8Encode,
} from './share-link-codec.js';
import {
  exportShareIdentityPublicRaw,
  getOrCreateShareIdentity,
  getShareReferralAddress,
  signSharePayload,
  verifySharePayload,
} from './share-link-identity.js';

export const SHARE_LINK_PROTOCOL = 'eon.share-link.v2';
export const REALM_LINK_PROTOCOL = 'eon.realm-link.v3';
export const LEGACY_SHARE_LINK_PROTOCOL = 'eon.share-link.v1';
export const SHARE_LINK_PREFIX = 'eon2';
export const REALM_LINK_PREFIX = 'eon3';
export const LEGACY_SHARE_LINK_PREFIX = 'eon1';
// `0` means no built-in expiry. Public referral/realm links are intentionally
// durable. Revocation is not claimed because a stateless link has no registry.
export const DEFAULT_TTL_MS = 0;
export const STATELESS_LINK_POLICY = 'self-contained-signed-no-registry';
export const PUBLIC_LINK_NOTICE = 'Public signed link; not a wallet key, password, recovery phrase, or reward proof.';

export const SAFE_DESTINATIONS = Object.freeze([
  '/', '/index.html', '/chat', '/chat.html', '/projects', '/library', '/workspace', '/automations',
  '/market', '/market.html', '/marketplace.html', '/vault', '/vault.html', '/insights', '/trade', '/trade.html', '/eoncity', '/realm.html', '/realmworld.html',
  '/rewards', '/subscription.html', '/creator-studio.html', '/workbench.html', '/eon-browser.html', '/campaign-admin.html',
  '/telegram.html', '/reward-access.html'
]);

const COMPACT_VERSION = 2;
const REALM_COMPACT_VERSION = 3;
const COMPACT_HEADER_BYTES = 1 + 4 + 4 + 1 + 1 + 16 + 16 + 65;
const REALM_FIXED_HEADER_BYTES = 1 + 4 + 4 + 1 + 16 + 16 + 16 + 1 + 1 + 1;
const REALM_PUBLIC_KEY_BYTES = 65;
const COMPACT_DESTINATIONS = Object.freeze([
  '/', '/chat', '/projects', '/library', '/workspace', '/market', '/vault', '/insights', '/trade', '/eoncity', '/rewards', '/profile'
]);
const COMPACT_SOURCES = Object.freeze([
  'generic', 'referral', 'vault', 'share-center', 'realm', 'telegram', 'social', 'qr', 'direct'
]);
const REALM_THEMES = Object.freeze([
  'dark-purple', 'neon-city', 'aurora', 'forest-circuit', 'minimal'
]);
const REALM_HANDLE_MAX_BYTES = 48;
const REALM_LABEL_MAX_BYTES = 48;

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function normalizeShortRoute(value = '', destination = '') {
  const raw = String(value || '').trim().toLowerCase().replace(/^\//, '');
  if (raw === 'm' || raw === 'realm') return 'realm';
  if (raw === 'r' || raw === 'referral') return 'referral';
  const dest = String(destination || '').toLowerCase();
  return dest.includes('realm') || dest.startsWith('/u/') ? 'realm' : 'referral';
}

/**
 * Deprecated compatibility helper. It only returns 128 random bits. It is
 * never registered with a database, KV, Worker, or redirect service.
 */
export function createShortShareCode(bytes = 16) {
  return randomId(Math.max(16, Number(bytes) || 16));
}

export function normalizeDestination(value = '/') {
  const raw = String(value || '/').trim();
  const url = new URL(raw, 'https://eonapp.ch');
  if (url.origin !== 'https://eonapp.ch') throw new Error('Unsafe external destination');
  const path = url.pathname || '/';
  const allowed = SAFE_DESTINATIONS.includes(path) || path.startsWith('/u/');
  if (!allowed) throw new Error('Destination is not allowlisted');
  const canonicalPath = path === '/chat' || path === '/chat.html' ? '/' : path;
  return `${canonicalPath}${url.search}${url.hash}`;
}

export function normalizeRealmHandle(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, REALM_HANDLE_MAX_BYTES);
  if (!normalized) throw new Error('realm_handle_required');
  return normalized;
}

function normalizeRealmLabel(value = '', fallback = 'EON Realm') {
  const text = Array.from(String(value || fallback))
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim() || fallback;
  const bytes = utf8Encode(text);
  return utf8Decode(bytes.slice(0, REALM_LABEL_MAX_BYTES));
}

function normalizeRealmTheme(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  return REALM_THEMES.includes(candidate) ? candidate : REALM_THEMES[0];
}

function normalizeRealmId(value = '') {
  const raw = String(value || '').trim().replace(/^eonrealm_/i, '');
  if (!/^[A-Za-z0-9_-]{22}$/.test(raw)) return '';
  try {
    const bytes = base64UrlToBytes(raw);
    return bytes.length === 16 ? `eonrealm_${raw}` : '';
  } catch {
    return '';
  }
}

export function createRealmPublicId(bytes = randomBytes(16)) {
  const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (raw.length !== 16) throw new Error('invalid_realm_public_id');
  return `eonrealm_${bytesToBase64Url(raw)}`;
}

function realmIdBytes(value = '') {
  const normalized = normalizeRealmId(value);
  if (!normalized) return null;
  return base64UrlToBytes(normalized.slice('eonrealm_'.length));
}

function resolveIssuedAt(options = {}) {
  const issuedAt = hasOwn(options, 'issuedAt') ? Number(options.issuedAt) : Date.now();
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) throw new Error('invalid_share_issued_at');
  return Math.floor(issuedAt);
}

function resolveExpiry(options = {}, issuedAt = Date.now()) {
  const expiresAt = hasOwn(options, 'expiresAt')
    ? Number(options.expiresAt)
    : (Number(options.ttlMs || DEFAULT_TTL_MS) > 0 ? issuedAt + Number(options.ttlMs) : 0);
  if (!Number.isFinite(expiresAt) || expiresAt < 0) throw new Error('invalid_share_expiry');
  if (expiresAt > 0 && expiresAt <= issuedAt) throw new Error('invalid_share_expiry');
  return Math.floor(expiresAt);
}

function isExpired(expiresAt, now = Date.now()) {
  return Number(expiresAt || 0) > 0 && Number(expiresAt) < Number(now);
}

export function extractSignedToken(input = globalThis.location?.href || '') {
  const raw = String(input || '').trim();
  const accepted = [SHARE_LINK_PREFIX, REALM_LINK_PREFIX, LEGACY_SHARE_LINK_PREFIX];
  if (accepted.some((prefix) => raw.startsWith(`${prefix}.`))) return raw;
  try {
    const url = new URL(raw, globalThis.location?.origin || 'https://eonapp.ch');
    const queryToken = url.searchParams.get('t');
    if (accepted.some((prefix) => queryToken?.startsWith(`${prefix}.`))) return queryToken;
    const hash = url.hash.replace(/^#/, '');
    if (accepted.some((prefix) => hash.startsWith(`${prefix}.`))) return hash;
    const hashParams = new URLSearchParams(hash);
    const hashToken = hashParams.get('t');
    if (accepted.some((prefix) => hashToken?.startsWith(`${prefix}.`))) return hashToken;
  } catch {}
  return '';
}

function writeUint32(bytes, offset, value) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  view.setUint32(offset, Math.max(0, Math.floor(Number(value) || 0)), false);
}

function readUint32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false);
}

function compactDestinationCode(destination = '/') {
  const normalized = normalizeDestination(destination);
  const base = normalized.split(/[?#]/)[0];
  const index = COMPACT_DESTINATIONS.indexOf(base);
  if (index < 0) throw new Error('compact_destination_not_supported');
  return index;
}

function compactDestinationFromCode(code) {
  const value = COMPACT_DESTINATIONS[Number(code)];
  if (!value) throw new Error('compact_destination_code_invalid');
  return value;
}

function compactSourceCode(source = '') {
  const normalized = String(source || 'generic').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const index = COMPACT_SOURCES.indexOf(normalized);
  return index >= 0 ? index : 0;
}

function compactSourceFromCode(code) {
  return COMPACT_SOURCES[Number(code)] || 'generic';
}

function rawP256ToJwk(raw) {
  const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw || []);
  if (bytes.length !== REALM_PUBLIC_KEY_BYTES || bytes[0] !== 4) throw new Error('invalid_compact_p256_key');
  return {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToBase64Url(bytes.slice(1, 33)),
    y: bytesToBase64Url(bytes.slice(33, 65)),
    ext: true,
  };
}

async function compactReferralAddress(rawPublicKey) {
  return `eonr_${bytesToBase64Url((await sha256Bytes(rawPublicKey)).slice(0, 16))}`;
}

function buildCanonicalLink(origin, token) {
  return `${String(origin || globalThis.location?.origin || 'https://eonapp.ch').replace(/\/$/, '')}/r/#${token}`;
}

function publicResult({ token, origin, payload, missionCode, destination }) {
  const canonicalLink = buildCanonicalLink(origin, token);
  return {
    token,
    link: canonicalLink,
    canonicalLink,
    longLink: canonicalLink,
    shortLink: '',
    shortCode: '',
    shortRoute: normalizeShortRoute('', destination),
    shortRegistration: { ok: false, disabled: true, reason: 'stateless-self-contained-link-no-registry' },
    storageMode: STATELESS_LINK_POLICY,
    missionCode,
    payload,
    publicNotice: PUBLIC_LINK_NOTICE,
  };
}

async function createCompactSignedShareLink(options = {}) {
  const identity = options.identity || await getOrCreateShareIdentity();
  const issuedAt = resolveIssuedAt(options);
  const expiresAt = resolveExpiry(options, issuedAt);
  const rawPublicKey = await exportShareIdentityPublicRaw(identity);
  const issuerKey = rawP256ToJwk(rawPublicKey);
  const rootReferralId = await compactReferralAddress(rawPublicKey);
  const shareBytes = options.shareBytes instanceof Uint8Array ? options.shareBytes : randomBytes(16);
  if (shareBytes.length !== 16) throw new Error('invalid_share_nonce');
  const referralBytes = (await sha256Bytes(rawPublicKey)).slice(0, 16);
  const destination = normalizeDestination(options.destination || '/');
  const bytes = new Uint8Array(COMPACT_HEADER_BYTES);
  bytes[0] = COMPACT_VERSION;
  writeUint32(bytes, 1, Math.floor(issuedAt / 1000));
  writeUint32(bytes, 5, expiresAt ? Math.floor(expiresAt / 1000) : 0);
  bytes[9] = compactDestinationCode(destination);
  bytes[10] = compactSourceCode(options.source || 'generic');
  bytes.set(referralBytes, 11);
  bytes.set(shareBytes, 27);
  bytes.set(rawPublicKey, 43);
  const payloadEncoded = bytesToBase64Url(bytes);
  const signingInput = `${SHARE_LINK_PREFIX}.${payloadEncoded}`;
  const signature = await signSharePayload(signingInput, identity);
  const token = `${signingInput}.${signature}`;
  const shareId = bytesToBase64Url(shareBytes);
  const payload = {
    v: 2,
    schema: SHARE_LINK_PROTOCOL,
    alg: 'p256-sha256',
    linkKind: 'referral',
    issuer: rootReferralId,
    issuerKey,
    rootReferralId,
    shareId,
    parentShareId: '',
    campaignId: '',
    missionType: String(options.missionType || 'referral_invite').slice(0, 64),
    destination,
    source: compactSourceFromCode(bytes[10]),
    issuedAt,
    expiresAt,
    nonce: shareId,
    policy: STATELESS_LINK_POLICY,
    publicNotice: PUBLIC_LINK_NOTICE,
    versionTag: 'w213',
    compact: true,
    permanent: expiresAt === 0,
  };
  return publicResult({ token, origin: options.origin, payload, missionCode: await deriveMissionCode(token), destination });
}

async function createRealmCompactShareLink(options = {}) {
  const identity = options.identity || await getOrCreateShareIdentity();
  const issuedAt = resolveIssuedAt(options);
  const expiresAt = resolveExpiry(options, issuedAt);
  const rawPublicKey = await exportShareIdentityPublicRaw(identity);
  const issuerKey = rawP256ToJwk(rawPublicKey);
  const rootReferralId = await compactReferralAddress(rawPublicKey);
  const referralBytes = (await sha256Bytes(rawPublicKey)).slice(0, 16);
  const shareBytes = options.shareBytes instanceof Uint8Array ? options.shareBytes : randomBytes(16);
  if (shareBytes.length !== 16) throw new Error('invalid_share_nonce');
  const existingRealmBytes = options.realmBytes instanceof Uint8Array ? options.realmBytes : realmIdBytes(options.realmId || options.publicRealmId);
  const realmBytes = existingRealmBytes || randomBytes(16);
  if (realmBytes.length !== 16) throw new Error('invalid_realm_public_id');
  const handle = normalizeRealmHandle(options.realmHandle || options.handle || options.username || '');
  const label = normalizeRealmLabel(options.realmLabel || options.displayName || handle, handle);
  const theme = normalizeRealmTheme(options.realmTheme || options.theme);
  const handleBytes = utf8Encode(handle);
  const labelBytes = utf8Encode(label);
  if (handleBytes.length > REALM_HANDLE_MAX_BYTES || labelBytes.length > REALM_LABEL_MAX_BYTES) throw new Error('realm_metadata_too_long');
  const totalBytes = REALM_FIXED_HEADER_BYTES + handleBytes.length + labelBytes.length + REALM_PUBLIC_KEY_BYTES;
  const bytes = new Uint8Array(totalBytes);
  bytes[0] = REALM_COMPACT_VERSION;
  writeUint32(bytes, 1, Math.floor(issuedAt / 1000));
  writeUint32(bytes, 5, expiresAt ? Math.floor(expiresAt / 1000) : 0);
  bytes[9] = compactSourceCode(options.source || 'realm');
  bytes.set(referralBytes, 10);
  bytes.set(shareBytes, 26);
  bytes.set(realmBytes, 42);
  bytes[58] = handleBytes.length;
  bytes[59] = labelBytes.length;
  bytes[60] = REALM_THEMES.indexOf(theme);
  let offset = REALM_FIXED_HEADER_BYTES;
  bytes.set(handleBytes, offset); offset += handleBytes.length;
  bytes.set(labelBytes, offset); offset += labelBytes.length;
  bytes.set(rawPublicKey, offset);
  const payloadEncoded = bytesToBase64Url(bytes);
  const signingInput = `${REALM_LINK_PREFIX}.${payloadEncoded}`;
  const signature = await signSharePayload(signingInput, identity);
  const token = `${signingInput}.${signature}`;
  const shareId = bytesToBase64Url(shareBytes);
  const publicRealmId = createRealmPublicId(realmBytes);
  const destination = `/u/${handle}`;
  const payload = {
    v: 3,
    schema: REALM_LINK_PROTOCOL,
    alg: 'p256-sha256',
    linkKind: 'realm',
    issuer: rootReferralId,
    issuerKey,
    rootReferralId,
    shareId,
    parentShareId: '',
    campaignId: '',
    missionType: 'share_realm',
    destination,
    source: compactSourceFromCode(bytes[9]),
    issuedAt,
    expiresAt,
    nonce: shareId,
    policy: STATELESS_LINK_POLICY,
    publicNotice: PUBLIC_LINK_NOTICE,
    versionTag: 'w213',
    compact: true,
    permanent: expiresAt === 0,
    realm: {
      schema: 'eon.realm.public-link.v1',
      id: publicRealmId,
      handle,
      displayName: label,
      theme,
      renderer: 'deterministic-2d-profile-v1',
      cloudRegistryRequired: false,
      cloudSnapshotRequired: false,
    },
  };
  return publicResult({ token, origin: options.origin, payload, missionCode: await deriveMissionCode(token), destination });
}

async function createLegacySignedShareLink(options = {}) {
  const identity = options.identity || await getOrCreateShareIdentity();
  const issuedAt = resolveIssuedAt(options);
  const expiresAt = resolveExpiry(options, issuedAt);
  const shareId = String(options.shareId || randomId(24));
  const nonce = String(options.nonce || shareId);
  const linkKind = options.linkKind === 'realm' ? 'realm' : 'referral';
  const payload = {
    v: 1,
    schema: LEGACY_SHARE_LINK_PROTOCOL,
    alg: 'p256-sha256',
    linkKind,
    issuer: String(options.issuer || identity.fingerprint || '').slice(0, 96),
    issuerKey: identity.publicJwk,
    rootReferralId: String(options.rootReferralId || identity.fingerprint || '').slice(0, 96),
    shareId,
    parentShareId: options.parentShareId ? String(options.parentShareId).slice(0, 128) : '',
    campaignId: options.campaignId ? String(options.campaignId).slice(0, 96) : '',
    missionType: String(options.missionType || (linkKind === 'realm' ? 'share_realm' : 'share_eonapp')).slice(0, 64),
    destination: normalizeDestination(options.destination || '/'),
    source: String(options.source || 'generic').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32) || 'generic',
    issuedAt,
    expiresAt,
    nonce,
    policy: STATELESS_LINK_POLICY,
    publicNotice: PUBLIC_LINK_NOTICE,
    versionTag: String(options.versionTag || 'w213-legacy').slice(0, 24),
    compact: false,
    permanent: expiresAt === 0,
  };
  if (linkKind === 'realm' && options.realm) {
    payload.realm = {
      schema: 'eon.realm.public-link.v1',
      id: normalizeRealmId(options.realm.id || options.realm.realmId) || '',
      handle: String(options.realm.handle || '').slice(0, 80),
      displayName: String(options.realm.displayName || '').slice(0, 80),
      theme: normalizeRealmTheme(options.realm.theme),
      renderer: String(options.realm.renderer || 'portable-realm-snapshot-v1').slice(0, 64),
      locator: options.realm.locator || null,
    };
  }
  const payloadEncoded = encodeJsonBase64Url(payload);
  const signingInput = `${LEGACY_SHARE_LINK_PREFIX}.${payloadEncoded}`;
  const signature = await signSharePayload(signingInput, identity);
  const token = `${signingInput}.${signature}`;
  return publicResult({ token, origin: options.origin, payload, missionCode: await deriveMissionCode(token), destination: payload.destination });
}

/**
 * Create one self-contained signed public link. `linkKind: 'realm'` always
 * emits eon3 by default, so Realm links and referral links use the same
 * signing identity, root referral address, 128-bit share id and no registry.
 */
export async function createSignedShareLink(options = {}) {
  if (options.linkKind === 'realm' || options.realmHandle || options.handle && options.realmId) {
    try {
      return await createRealmCompactShareLink(options);
    } catch (error) {
      const fallback = await createLegacySignedShareLink({ ...options, linkKind: 'realm', forceLegacy: true });
      return { ...fallback, compactFallback: true, compactFallbackReason: String(error?.message || error) };
    }
  }
  // New public links default to compact eon2/eon3. Campaign labels and parent
  // lineage stay in local/app state and in the qualified referral-tree record
  // after a genuine action; they do not force a long public link or create a
  // Cloudflare registry. eon1 remains an explicit compatibility/export mode.
  if (options.forceLegacy === true) return createLegacySignedShareLink(options);
  try {
    return await createCompactSignedShareLink(options);
  } catch (error) {
    const fallback = await createLegacySignedShareLink(options);
    return { ...fallback, compactFallback: true, compactFallbackReason: String(error?.message || error) };
  }
}

async function verifyCompactShareToken(token, options = {}) {
  const result = { ok: false, token, reason: 'invalid-token', payload: null, missionCode: '' };
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== SHARE_LINK_PREFIX) return result;
  try {
    const bytes = base64UrlToBytes(parts[1]);
    if (bytes.length !== COMPACT_HEADER_BYTES || bytes[0] !== COMPACT_VERSION) return { ...result, reason: 'unsupported-version' };
    const issuedAt = readUint32(bytes, 1) * 1000;
    const expiresAt = readUint32(bytes, 5) * 1000;
    const destination = compactDestinationFromCode(bytes[9]);
    const source = compactSourceFromCode(bytes[10]);
    const referralBytes = bytes.slice(11, 27);
    const shareBytes = bytes.slice(27, 43);
    const rawPublicKey = bytes.slice(43);
    const issuerKey = rawP256ToJwk(rawPublicKey);
    const rootReferralId = await compactReferralAddress(rawPublicKey);
    if (bytesToBase64Url(referralBytes) !== rootReferralId.slice('eonr_'.length)) return { ...result, reason: 'referral-address-mismatch' };
    const signatureOk = await verifySharePayload(`${parts[0]}.${parts[1]}`, parts[2], issuerKey);
    if (!signatureOk) return { ...result, reason: 'bad-signature' };
    const now = Number(options.now || Date.now());
    if (!options.allowExpired && isExpired(expiresAt, now)) return { ...result, reason: 'expired' };
    if (issuedAt > now + 5 * 60 * 1000) return { ...result, reason: 'issued-in-future' };
    const shareId = bytesToBase64Url(shareBytes);
    const payload = {
      v: 2,
      schema: SHARE_LINK_PROTOCOL,
      alg: 'p256-sha256',
      linkKind: 'referral',
      issuer: rootReferralId,
      issuerKey,
      rootReferralId,
      shareId,
      parentShareId: '',
      campaignId: '',
      missionType: 'referral_invite',
      destination,
      source,
      issuedAt,
      expiresAt,
      nonce: shareId,
      policy: STATELESS_LINK_POLICY,
      publicNotice: PUBLIC_LINK_NOTICE,
      versionTag: 'w213',
      compact: true,
      permanent: expiresAt === 0,
    };
    return { ok: true, token, payload, missionCode: await deriveMissionCode(token), reason: 'verified' };
  } catch (error) {
    return { ...result, reason: String(error?.message || 'decode-failed') };
  }
}

async function verifyRealmCompactShareToken(token, options = {}) {
  const result = { ok: false, token, reason: 'invalid-token', payload: null, missionCode: '' };
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== REALM_LINK_PREFIX) return result;
  try {
    const bytes = base64UrlToBytes(parts[1]);
    if (bytes.length < REALM_FIXED_HEADER_BYTES + REALM_PUBLIC_KEY_BYTES || bytes[0] !== REALM_COMPACT_VERSION) return { ...result, reason: 'unsupported-version' };
    const issuedAt = readUint32(bytes, 1) * 1000;
    const expiresAt = readUint32(bytes, 5) * 1000;
    const source = compactSourceFromCode(bytes[9]);
    const referralBytes = bytes.slice(10, 26);
    const shareBytes = bytes.slice(26, 42);
    const realmBytes = bytes.slice(42, 58);
    const handleLength = bytes[58];
    const labelLength = bytes[59];
    const themeCode = bytes[60];
    if (!handleLength || handleLength > REALM_HANDLE_MAX_BYTES || labelLength > REALM_LABEL_MAX_BYTES) return { ...result, reason: 'realm-metadata-invalid' };
    const expectedBytes = REALM_FIXED_HEADER_BYTES + handleLength + labelLength + REALM_PUBLIC_KEY_BYTES;
    if (bytes.length !== expectedBytes) return { ...result, reason: 'realm-length-invalid' };
    let offset = REALM_FIXED_HEADER_BYTES;
    const handle = normalizeRealmHandle(utf8Decode(bytes.slice(offset, offset + handleLength))); offset += handleLength;
    const displayName = normalizeRealmLabel(utf8Decode(bytes.slice(offset, offset + labelLength)), handle); offset += labelLength;
    const rawPublicKey = bytes.slice(offset);
    const issuerKey = rawP256ToJwk(rawPublicKey);
    const rootReferralId = await compactReferralAddress(rawPublicKey);
    if (bytesToBase64Url(referralBytes) !== rootReferralId.slice('eonr_'.length)) return { ...result, reason: 'referral-address-mismatch' };
    const signatureOk = await verifySharePayload(`${parts[0]}.${parts[1]}`, parts[2], issuerKey);
    if (!signatureOk) return { ...result, reason: 'bad-signature' };
    const now = Number(options.now || Date.now());
    if (!options.allowExpired && isExpired(expiresAt, now)) return { ...result, reason: 'expired' };
    if (issuedAt > now + 5 * 60 * 1000) return { ...result, reason: 'issued-in-future' };
    const shareId = bytesToBase64Url(shareBytes);
    const payload = {
      v: 3,
      schema: REALM_LINK_PROTOCOL,
      alg: 'p256-sha256',
      linkKind: 'realm',
      issuer: rootReferralId,
      issuerKey,
      rootReferralId,
      shareId,
      parentShareId: '',
      campaignId: '',
      missionType: 'share_realm',
      destination: `/u/${handle}`,
      source,
      issuedAt,
      expiresAt,
      nonce: shareId,
      policy: STATELESS_LINK_POLICY,
      publicNotice: PUBLIC_LINK_NOTICE,
      versionTag: 'w213',
      compact: true,
      permanent: expiresAt === 0,
      realm: {
        schema: 'eon.realm.public-link.v1',
        id: createRealmPublicId(realmBytes),
        handle,
        displayName,
        theme: REALM_THEMES[themeCode] || REALM_THEMES[0],
        renderer: 'deterministic-2d-profile-v1',
        cloudRegistryRequired: false,
        cloudSnapshotRequired: false,
      },
    };
    return { ok: true, token, payload, missionCode: await deriveMissionCode(token), reason: 'verified' };
  } catch (error) {
    return { ...result, reason: String(error?.message || 'decode-failed') };
  }
}

async function verifyLegacyShareToken(token, options = {}) {
  const result = { ok: false, token, reason: 'invalid-token', payload: null, missionCode: '' };
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || parts[0] !== LEGACY_SHARE_LINK_PREFIX) return result;
  try {
    const payload = decodeJsonBase64Url(parts[1]);
    result.payload = payload;
    if (payload?.schema !== LEGACY_SHARE_LINK_PROTOCOL || Number(payload?.v) !== 1) return { ...result, reason: 'unsupported-version' };
    normalizeDestination(payload.destination);
    const signatureOk = await verifySharePayload(`${parts[0]}.${parts[1]}`, parts[2], payload.issuerKey);
    if (!signatureOk) return { ...result, reason: 'bad-signature' };
    const now = Number(options.now || Date.now());
    if (!options.allowExpired && isExpired(Number(payload.expiresAt || 0), now)) return { ...result, reason: 'expired' };
    if (Number(payload.issuedAt || 0) > now + 5 * 60 * 1000) return { ...result, reason: 'issued-in-future' };
    payload.linkKind = payload.linkKind === 'realm' ? 'realm' : 'referral';
    payload.permanent = Number(payload.expiresAt || 0) === 0;
    payload.publicNotice = payload.publicNotice || PUBLIC_LINK_NOTICE;
    return { ok: true, token, payload, missionCode: await deriveMissionCode(token), reason: 'verified' };
  } catch (error) {
    return { ...result, reason: String(error?.message || 'decode-failed') };
  }
}

export async function verifySignedShareToken(input, options = {}) {
  const token = extractSignedToken(input);
  if (!token) return { ok: false, token: '', reason: 'missing-token', payload: null, missionCode: '' };
  if (token.startsWith(`${SHARE_LINK_PREFIX}.`)) return verifyCompactShareToken(token, options);
  if (token.startsWith(`${REALM_LINK_PREFIX}.`)) return verifyRealmCompactShareToken(token, options);
  if (token.startsWith(`${LEGACY_SHARE_LINK_PREFIX}.`)) return verifyLegacyShareToken(token, options);
  return { ok: false, token, reason: 'invalid-token', payload: null, missionCode: '' };
}

export async function createDerivedShareLink(parentInput, options = {}) {
  const parent = await verifySignedShareToken(parentInput);
  if (!parent.ok) throw new Error(`Invalid parent share: ${parent.reason}`);
  const linkKind = options.linkKind || parent.payload.linkKind || 'referral';
  // A re-share is a new public link with its own fresh 128-bit share id. The
  // verified parent attribution remains local until a qualified action records
  // an edge in the existing referral tree; it is deliberately not embedded in
  // every public URL and does not require a central short-link lookup.
  if (linkKind === 'realm') {
    const realm = { ...(parent.payload.realm || {}), ...(options.realm || {}) };
    return createSignedShareLink({
      ...options,
      linkKind: 'realm',
      realmId: options.realmId || options.publicRealmId || realm.id,
      realmHandle: options.realmHandle || options.handle || realm.handle,
      realmLabel: options.realmLabel || options.displayName || realm.displayName || realm.handle,
      realmTheme: options.realmTheme || options.theme || realm.theme,
      destination: options.destination || parent.payload.destination || '/realm',
      source: options.source || parent.payload.source || 'social',
      missionType: options.missionType || 'share_realm',
    });
  }
  return createSignedShareLink({
    ...options,
    linkKind: 'referral',
    destination: options.destination || parent.payload.destination || '/',
    source: options.source || parent.payload.source || 'social',
    missionType: options.missionType || 'referral_invite',
  });
}

export async function getCurrentShareReferralAddress() {
  return getShareReferralAddress();
}
