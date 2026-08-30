/**
 * W347-A — local Realm Share Relic Passport.
 *
 * This intentionally creates only zero-value, non-transferable local creative
 * records. It is not a referral ledger, visitor tracker, entitlement engine,
 * wallet, payment instrument, NFT mint, lootbox, or proof that anyone shared,
 * opened, or converted from a link.
 */

export const EON_REALM_RELIC_PASSPORT_SCHEMA = 'eon.realm-relic-passport.v1';
export const EON_REALM_RELIC_PASSPORT_VERSION = 1;
export const EON_REALM_RELIC_PASSPORT_STORAGE_KEY = 'eon:realm:relic-passport:v1';
export const EON_REALM_RELIC_PASSPORT_MAX_RECORDS = 36;

export const EON_REALM_RELIC_PASSPORT_EVENTS = Object.freeze({
  OUTBOUND_SYSTEM_SHARE: 'outbound-system-share',
  INCOMING_VERIFIED_REALM_LINK: 'incoming-verified-realm-link'
});

export const EON_REALM_RELIC_PASSPORT_TRUTH = Object.freeze({
  localCollectionActive: true,
  network: false,
  cloudSync: false,
  referralConversionTracking: false,
  visitorTracking: false,
  purchaseRequired: false,
  paidFeatureEntitlement: false,
  subscriptionEntitlement: false,
  walletRequired: false,
  mintActive: false,
  transferAllowed: false,
  saleAllowed: false,
  resaleAllowed: false,
  royaltyProgramActive: false,
  cashOrCryptoValue: false,
  automaticRewardValue: false
});

const EVENT_DEFINITIONS = Object.freeze({
  [EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE]: Object.freeze({
    label: 'Signal Relic',
    visualClass: 'signal',
    triggerLabel: 'System share completed on this device',
    verificationLabel: 'No delivery, click, visitor, referral, or conversion is verified.'
  }),
  [EON_REALM_RELIC_PASSPORT_EVENTS.INCOMING_VERIFIED_REALM_LINK]: Object.freeze({
    label: 'Welcome Relic',
    visualClass: 'welcome',
    triggerLabel: 'A signed Realm identity link verified in this browser',
    verificationLabel: 'This verifies the link signature only; it does not create a referral conversion or value for the sender.'
  })
});

function storageFor(storage = null) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function cleanText(value = '', max = 96) {
  return Array.from(String(value || '').trim(), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', fallback = '') {
  const id = String(value || '').trim().replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 160);
  return id || fallback;
}

function cleanTheme(value = '') {
  const theme = String(value || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 32);
  return theme || 'dark-purple';
}

function getCrypto(cryptoApi = null) {
  const api = cryptoApi || globalThis.crypto;
  if (!api || typeof api.getRandomValues !== 'function') throw new Error('WebCrypto is unavailable; a local Relic cannot be created safely.');
  return api;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const value of bytes) binary += String.fromCharCode(value);
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(binary).replace(/[+/=]/g, (char) => ({ '+': '-', '/': '_', '=': '' })[char]);
  const nodeBuffer = globalThis.Buffer;
  if (nodeBuffer && typeof nodeBuffer.from === 'function') return nodeBuffer.from(bytes).toString('base64url');
  throw new Error('Base64URL support is unavailable; a local Relic cannot be created safely.');
}

function localRelicId(cryptoApi = null) {
  const bytes = new Uint8Array(12);
  getCrypto(cryptoApi).getRandomValues(bytes);
  return `relic_${toBase64Url(bytes)}`;
}

function iso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function normalizeRealm(realm = {}) {
  const source = realm && typeof realm === 'object' ? realm : {};
  const id = cleanId(source.id || source.realmId || source.publicRealmId, 'local-realm');
  const handle = cleanText(source.handle || source.username || source.realmHandle || 'my-eon-realm', 48).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48) || 'my-eon-realm';
  const label = cleanText(source.label || source.displayName || handle, 48);
  return Object.freeze({ id, handle, label, theme: cleanTheme(source.theme) });
}

function eventDefinition(eventType = '') {
  return EVENT_DEFINITIONS[String(eventType || '')] || null;
}

function eventKey(eventType, realm) {
  return `${String(eventType || '')}:${realm.id}:${realm.handle}`;
}

function normalizeRelic(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const definition = eventDefinition(source.eventType);
  if (!definition || source.schema !== EON_REALM_RELIC_PASSPORT_SCHEMA || source.version !== EON_REALM_RELIC_PASSPORT_VERSION) return null;
  const realm = normalizeRealm(source.realm);
  const createdAt = String(source.createdAt || '');
  if (!/^relic_[A-Za-z0-9_-]{8,80}$/.test(String(source.id || '')) || !Number.isFinite(Date.parse(createdAt))) return null;
  if (String(source.eventKey || '') !== eventKey(source.eventType, realm)) return null;
  return Object.freeze({
    schema: EON_REALM_RELIC_PASSPORT_SCHEMA,
    version: EON_REALM_RELIC_PASSPORT_VERSION,
    id: String(source.id),
    eventType: String(source.eventType),
    eventKey: String(source.eventKey),
    label: definition.label,
    visualClass: definition.visualClass,
    realm,
    createdAt: new Date(Date.parse(createdAt)).toISOString(),
    triggerLabel: definition.triggerLabel,
    verificationLabel: definition.verificationLabel,
    localOnly: true,
    transferAllowed: false,
    saleAllowed: false,
    financialValueAssigned: false,
    paidFeatureEntitlementCreated: false,
    subscriptionEntitlementCreated: false,
    note: 'This Relic is a free local cosmetic record. It is not an NFT, token, wallet asset, referral conversion, payment reward, premium entitlement, sale item, or financial asset.'
  });
}

function readRaw(storage = null) {
  try { return storageFor(storage)?.getItem(EON_REALM_RELIC_PASSPORT_STORAGE_KEY) || ''; } catch { return ''; }
}

function readPassport(storage = null) {
  const raw = readRaw(storage);
  if (!raw || raw.length > 36000) return Object.freeze([]);
  try {
    const parsed = JSON.parse(raw);
    const relics = Array.isArray(parsed?.relics) ? parsed.relics.map(normalizeRelic).filter(Boolean) : [];
    return Object.freeze(relics.slice(-EON_REALM_RELIC_PASSPORT_MAX_RECORDS));
  } catch {
    return Object.freeze([]);
  }
}

function writePassport(relics, storage = null) {
  const target = storageFor(storage);
  if (!target) throw new Error('Local storage is unavailable; the Relic Passport could not be saved on this device.');
  const safe = relics.map(normalizeRelic).filter(Boolean).slice(-EON_REALM_RELIC_PASSPORT_MAX_RECORDS);
  target.setItem(EON_REALM_RELIC_PASSPORT_STORAGE_KEY, JSON.stringify({
    schema: EON_REALM_RELIC_PASSPORT_SCHEMA,
    version: EON_REALM_RELIC_PASSPORT_VERSION,
    relics: safe
  }));
  return Object.freeze(safe);
}

export function listLocalRealmShareRelics({ storage = null } = {}) {
  return readPassport(storage);
}

export function awardLocalRealmShareRelic({ eventType = '', realm = {}, storage = null, cryptoApi = null, now = Date.now() } = {}) {
  const definition = eventDefinition(eventType);
  if (!definition) return Object.freeze({ ok: false, created: false, reason: 'unsupported-local-relic-event', relic: null });
  const safeRealm = normalizeRealm(realm);
  const key = eventKey(eventType, safeRealm);
  const relics = [...readPassport(storage)];
  const existing = relics.find((relic) => relic.eventKey === key) || null;
  if (existing) return Object.freeze({ ok: true, created: false, reason: 'already-recorded-on-this-device', relic: existing });
  const relic = normalizeRelic({
    schema: EON_REALM_RELIC_PASSPORT_SCHEMA,
    version: EON_REALM_RELIC_PASSPORT_VERSION,
    id: localRelicId(cryptoApi),
    eventType,
    eventKey: key,
    realm: safeRealm,
    createdAt: iso(now)
  });
  const next = writePassport([...relics, relic], storage);
  return Object.freeze({ ok: true, created: true, reason: 'local-cosmetic-record-created', relic, count: next.length });
}

export function clearLocalRealmShareRelics({ confirmedByUser = false, storage = null } = {}) {
  if (confirmedByUser !== true) return Object.freeze({ ok: false, reason: 'explicit-user-confirmation-required', removed: 0 });
  const existing = readPassport(storage);
  try { storageFor(storage)?.removeItem(EON_REALM_RELIC_PASSPORT_STORAGE_KEY); } catch {}
  return Object.freeze({ ok: true, reason: null, removed: existing.length, directNetwork: false, cloudSync: false });
}

export function getLocalRealmShareRelicPassportTruth() {
  return Object.freeze({
    schema: EON_REALM_RELIC_PASSPORT_SCHEMA,
    ...EON_REALM_RELIC_PASSPORT_TRUTH,
    storageScope: 'this-browser-profile',
    rawShareMessageStored: false,
    rawChatStored: false,
    providerKeyStored: false,
    clearRequiresExplicitUserConfirmation: true
  });
}

export default Object.freeze({
  EON_REALM_RELIC_PASSPORT_SCHEMA,
  EON_REALM_RELIC_PASSPORT_VERSION,
  EON_REALM_RELIC_PASSPORT_STORAGE_KEY,
  EON_REALM_RELIC_PASSPORT_MAX_RECORDS,
  EON_REALM_RELIC_PASSPORT_EVENTS,
  EON_REALM_RELIC_PASSPORT_TRUTH,
  listLocalRealmShareRelics,
  awardLocalRealmShareRelic,
  clearLocalRealmShareRelics,
  getLocalRealmShareRelicPassportTruth
});
