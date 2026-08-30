/**
 * A15 I09 — canonical Capability and Entitlement Service.
 *
 * The server combines the verified billing lifecycle with active EONKEY unlock
 * rows. The browser never reads a paid tier or an unlock from localStorage.
 * Until a same-origin signed snapshot arrives, product behavior fails closed to
 * the maintained Free plan.
 */

import {
  EON_SUBSCRIPTION_PLANS,
  getEonSubscriptionPlan
} from '../commerce/eon-commercial-catalog.js';
import { buildBillingPublicState } from '../billing/eon-billing-lifecycle.js';
import { EON_KEY_UNLOCK_MENU } from '../referrals/eon-keys-catalog.js';
import { EON_PREMIUM_CAPABILITIES, getEonPremiumSoftwareTier } from './eon-premium-capability-registry.js';
import { resolveEonPremiumAccessState } from './eon-premium-access-state.js';

export const EON_CAPABILITY_SERVICE_SCHEMA = 'eonapp.capability-service.a15.v1';
export const EON_CAPABILITY_ENVELOPE_SCHEMA = 'eonapp.capability-envelope.a15.v1';
export const EON_CAPABILITY_ENDPOINT = '/api/capabilities/status';
export const EON_CAPABILITY_MAX_AGE_MS = 5 * 60 * 1000;

const encoder = new TextEncoder();
const PAID_ACTIVE = new Set(['trialing', 'active', 'cancelling', 'grace']);
const PREMIUM_RECURRING_TIERS = new Set(['pro', 'ultra']);
const KNOWN_PLANS = new Set([...EON_SUBSCRIPTION_PLANS.map((plan) => plan.id), ...PREMIUM_RECURRING_TIERS]);
const UNLOCK_BY_ID = new Map(EON_KEY_UNLOCK_MENU.map((unlock) => [unlock.id, unlock]));
const LIMIT_DELTAS = Object.freeze({
  'signal-project-slot-30d': Object.freeze({ projectSlots: 1 }),
  'signal-automation-draft': Object.freeze({ automationDrafts: 1 }),
  'builder-project-slots-90d': Object.freeze({ projectSlots: 3 }),
  'builder-premium-workflow-pack': Object.freeze({ premiumWorkflowPacks: 1 }),
  'builder-creator-preset-pack': Object.freeze({ creatorPresetPacks: 1 }),
  'builder-automation-pack': Object.freeze({ automationDrafts: 3 }),
  'builder-showcase-slot-30d': Object.freeze({ showcaseSlots: 1 }),
  'power-project-slots-90d': Object.freeze({ projectSlots: 10 }),
  'power-workflow-packs': Object.freeze({ premiumWorkflowPacks: 3 }),
  'power-creator-presets': Object.freeze({ creatorPresetPacks: 3 }),
  'power-automation-system': Object.freeze({ automationDrafts: 10 }),
  'power-showcase-slots': Object.freeze({ showcaseSlots: 3 })
});

let currentSnapshot = null;
let installPromise = null;

function freeze(value) { return Object.freeze(value); }
function clean(value = '', max = 180) { return String(value || '').replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max); }
function integer(value = 0) { return Math.max(0, Math.floor(Number(value) || 0)); }
function epoch(value = 0) {
  if (Number.isFinite(Number(value)) && Number(value) > 0) return Math.floor(Number(value));
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function timingSafeEqual(left = '', right = '') {
  const a = String(left || ''); const b = String(right || '');
  const length = Math.max(a.length, b.length); let mismatch = a.length ^ b.length;
  for (let index = 0; index < length; index += 1) mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return mismatch === 0;
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
async function hmac(payload = '', secret = '') {
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(secret || '')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

function planForAccess(entitlement = null, lifecycle = null, now = Date.now()) {
  const publicState = buildBillingPublicState(entitlement, lifecycle, { now });
  const candidate = clean(publicState.tierId, 24).toLowerCase();
  const active = publicState.accessActive === true && PAID_ACTIVE.has(publicState.status) && KNOWN_PLANS.has(candidate) && candidate !== 'free';
  const subscriptionTierId = active ? candidate : 'free';
  const basePlanId = PREMIUM_RECURRING_TIERS.has(subscriptionTierId) ? 'max' : subscriptionTierId;
  const plan = getEonSubscriptionPlan(basePlanId) || getEonSubscriptionPlan('free');
  const premiumDefinition = PREMIUM_RECURRING_TIERS.has(subscriptionTierId) ? getEonPremiumSoftwareTier(subscriptionTierId) : null;
  return freeze({ plan, basePlanId: plan?.id || 'free', subscriptionTierId, premiumDefinition, publicState, active });
}

function normalizeSoftwareLicenses(rows = []) {
  const source = Array.isArray(rows) ? rows : [];
  const licenses = new Set();
  for (const row of source) {
    const status = clean(row?.status, 24).toLowerCase();
    const bundleId = clean(row?.bundleId || row?.bundle_id, 40).toLowerCase();
    if (status === 'active' && bundleId === 'ultimate') licenses.add('ultimate');
  }
  return freeze([...licenses].sort());
}

function resolvePremiumCapabilities(subscriptionTierId = 'free', perpetualLicenses = []) {
  const rows = EON_PREMIUM_CAPABILITIES.map((capability) => resolveEonPremiumAccessState(capability, { subscriptionTierId, perpetualLicenses }));
  return freeze(rows.filter((row) => row?.ok && row.softwareAccess === true).map((row) => row.capability.id).sort());
}

export function normalizeCapabilityUnlocks(rows = [], { now = Date.now() } = {}) {
  const seen = new Set();
  return freeze((Array.isArray(rows) ? rows : []).map((row) => {
    const unlockId = clean(row?.unlockId || row?.unlock_catalog_id, 120);
    const catalog = UNLOCK_BY_ID.get(unlockId);
    const status = clean(row?.status, 32).toLowerCase();
    const expiresAt = epoch(row?.expiresAt || row?.expires_at);
    const issuedAt = epoch(row?.issuedAt || row?.issued_at);
    if (!catalog || status !== 'active' || (expiresAt > 0 && expiresAt <= now) || seen.has(unlockId)) return null;
    seen.add(unlockId);
    return freeze({
      unlockId,
      featureGroup: catalog.featureGroup,
      category: catalog.category,
      keyType: catalog.keyType,
      issuedAt,
      expiresAt: expiresAt || null,
      permanent: catalog.permanent === true,
      sourceRecordId: clean(row?.recordId || row?.unlock_record_id, 128)
    });
  }).filter(Boolean));
}

function effectiveLimits(plan, unlocks) {
  const limits = {
    projectSlots: integer(plan?.limits?.projectSlots),
    showcaseSlots: integer(plan?.limits?.showcaseSlots),
    automationDrafts: integer(plan?.limits?.automationDrafts),
    premiumWorkflowPacks: integer(plan?.limits?.premiumWorkflowPacks),
    creatorPresetPacks: integer(plan?.limits?.creatorPresetPacks)
  };
  for (const unlock of unlocks) {
    const delta = LIMIT_DELTAS[unlock.unlockId] || {};
    for (const [key, value] of Object.entries(delta)) limits[key] = integer(limits[key]) + integer(value);
  }
  return freeze({
    ...limits,
    'universal-projects': limits.projectSlots,
    'ordinary-projects': limits.projectSlots,
    'forge-projects': limits.projectSlots,
    'w631-projects': limits.projectSlots,
    'project-automation-links': limits.automationDrafts,
    'w631-automations': limits.automationDrafts
  });
}

export function buildEffectiveCapabilitySnapshot(input = {}) {
  const now = Number(input.now || Date.now());
  const access = planForAccess(input.entitlement, input.lifecycle, now);
  const unlocks = normalizeCapabilityUnlocks(input.unlocks, { now });
  const perpetualLicenses = normalizeSoftwareLicenses(input.softwareGrants);
  const premiumCapabilities = resolvePremiumCapabilities(access.subscriptionTierId, perpetualLicenses);
  const featureGroups = new Set(access.plan?.featureGroups || []);
  for (const unlock of unlocks) featureGroups.add(unlock.featureGroup);
  for (const capabilityId of premiumCapabilities) featureGroups.add(`premium:${capabilityId}`);
  const issuedAt = Number(input.issuedAt || now);
  const expiresAt = Number(input.expiresAt || (issuedAt + EON_CAPABILITY_MAX_AGE_MS));
  return freeze({
    schema: EON_CAPABILITY_SERVICE_SCHEMA,
    version: 2,
    accountId: clean(input.accountId, 96),
    signedIn: Boolean(input.accountId),
    tierId: access.subscriptionTierId,
    tierLabel: access.premiumDefinition?.label || access.plan?.label || 'Free',
    basePlanId: access.basePlanId,
    entitlementStatus: access.publicState.status || 'free',
    entitlementAccessActive: access.active,
    featureGroups: freeze([...featureGroups].sort()),
    limits: effectiveLimits(access.plan, unlocks),
    unlocks,
    perpetualLicenses,
    premiumCapabilities,
    premiumCapabilityCount: premiumCapabilities.length,
    capacitySeparateFromSoftwareCapability: true,
    hostedCapacityGrantedByUltimate: false,
    issuedAt,
    expiresAt,
    source: input.source || 'server-ledger',
    serverAuthoritative: input.serverAuthoritative !== false,
    browserClaimAccepted: false,
    localStorageRead: false,
    subscriptionCreatedByUnlock: false,
    providerCreditsIncluded: false
  });
}

export function getFreeCapabilitySnapshot({ now = Date.now(), source = 'local-free-fallback' } = {}) {
  return buildEffectiveCapabilitySnapshot({ now, issuedAt: now, expiresAt: now + EON_CAPABILITY_MAX_AGE_MS, source, serverAuthoritative: false });
}

export async function signCapabilitySnapshot(snapshot = {}, signingKey = '') {
  if (!String(signingKey || '').trim()) return freeze({ ok: false, reason: 'capability-signing-key-missing' });
  const payload = canonical(snapshot);
  const signature = await hmac(payload, signingKey);
  return freeze({
    ok: true,
    schema: EON_CAPABILITY_ENVELOPE_SCHEMA,
    algorithm: 'HMAC-SHA-256',
    keyId: 'eon-entitlement-signing-key',
    snapshot,
    signature,
    containsSigningKey: false
  });
}

export async function verifyCapabilityEnvelope(envelope = {}, signingKey = '', { now = Date.now(), allowExpired = false } = {}) {
  if (envelope?.schema !== EON_CAPABILITY_ENVELOPE_SCHEMA || envelope?.algorithm !== 'HMAC-SHA-256' || !envelope?.snapshot || !envelope?.signature) return freeze({ ok: false, reason: 'capability-envelope-invalid' });
  if (!String(signingKey || '').trim()) return freeze({ ok: false, reason: 'capability-signing-key-missing' });
  const expected = await hmac(canonical(envelope.snapshot), signingKey);
  if (!timingSafeEqual(expected, envelope.signature)) return freeze({ ok: false, reason: 'capability-signature-invalid' });
  if (!allowExpired && Number(envelope.snapshot.expiresAt || 0) <= Number(now)) return freeze({ ok: false, reason: 'capability-snapshot-expired' });
  return freeze({ ok: true, snapshot: envelope.snapshot });
}

export function validateCapabilityEnvelopeForBrowser(envelope = {}, { now = Date.now() } = {}) {
  const snapshot = envelope?.snapshot;
  if (envelope?.schema !== EON_CAPABILITY_ENVELOPE_SCHEMA || envelope?.algorithm !== 'HMAC-SHA-256' || !snapshot || !envelope?.signature) return freeze({ ok: false, reason: 'capability-envelope-invalid' });
  if (snapshot.schema !== EON_CAPABILITY_SERVICE_SCHEMA || snapshot.serverAuthoritative !== true || snapshot.browserClaimAccepted !== false) return freeze({ ok: false, reason: 'capability-snapshot-untrusted' });
  if (Number(snapshot.expiresAt || 0) <= Number(now)) return freeze({ ok: false, reason: 'capability-snapshot-expired' });
  if (!KNOWN_PLANS.has(String(snapshot.tierId || ''))) return freeze({ ok: false, reason: 'capability-tier-invalid' });
  return freeze({ ok: true, snapshot: freeze({ ...snapshot, featureGroups: freeze([...(snapshot.featureGroups || [])]), limits: freeze({ ...(snapshot.limits || {}) }), unlocks: freeze([...(snapshot.unlocks || [])]), perpetualLicenses: freeze([...(snapshot.perpetualLicenses || [])]), premiumCapabilities: freeze([...(snapshot.premiumCapabilities || [])]) }) });
}

export function setCurrentCapabilitySnapshot(snapshot = null, { emit = true } = {}) {
  const candidate = snapshot?.schema === EON_CAPABILITY_SERVICE_SCHEMA ? snapshot : getFreeCapabilitySnapshot();
  currentSnapshot = freeze(candidate);
  globalThis.__EON_CAPABILITY_SNAPSHOT__ = currentSnapshot;
  globalThis.EONCapabilityService = freeze({
    schema: EON_CAPABILITY_SERVICE_SCHEMA,
    getCurrentSnapshot: () => currentSnapshot,
    hasFeature: (featureGroup) => hasEonCapability(featureGroup, currentSnapshot),
    getLimit: (resourceId) => getEonCapabilityLimit(resourceId, currentSnapshot)
  });
  if (emit) {
    try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:capability-snapshot-changed', { detail: { tierId: currentSnapshot.tierId, expiresAt: currentSnapshot.expiresAt, serverAuthoritative: currentSnapshot.serverAuthoritative } })); } catch {}
  }
  return currentSnapshot;
}

export function getCurrentCapabilitySnapshot() {
  if (!currentSnapshot || Number(currentSnapshot.expiresAt || 0) <= Date.now()) return setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot(), { emit: false });
  return currentSnapshot;
}

export function hasEonCapability(featureGroup = '', snapshot = getCurrentCapabilitySnapshot()) {
  const wanted = clean(featureGroup, 140);
  return Boolean(wanted && Array.isArray(snapshot?.featureGroups) && snapshot.featureGroups.includes(wanted));
}

export function getEonCapabilityLimit(resourceId = '', snapshot = getCurrentCapabilitySnapshot()) {
  const value = Number(snapshot?.limits?.[clean(resourceId, 120)]);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export async function fetchEonCapabilitySnapshot(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') return freeze({ ok: false, reason: 'fetch-unavailable', snapshot: getFreeCapabilitySnapshot() });
  try {
    const response = await fetchImpl(options.endpoint || EON_CAPABILITY_ENDPOINT, { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' }, signal: options.signal });
    if (!response?.ok) return freeze({ ok: false, reason: `capability-http-${Number(response?.status || 0)}`, snapshot: getFreeCapabilitySnapshot() });
    const envelope = await response.json();
    const validated = validateCapabilityEnvelopeForBrowser(envelope, { now: options.now || Date.now() });
    if (!validated.ok) return freeze({ ...validated, snapshot: getFreeCapabilitySnapshot() });
    setCurrentCapabilitySnapshot(validated.snapshot);
    return freeze({ ok: true, snapshot: validated.snapshot, envelope: freeze({ schema: envelope.schema, algorithm: envelope.algorithm, keyId: envelope.keyId, signaturePresent: Boolean(envelope.signature) }) });
  } catch (error) {
    return freeze({ ok: false, reason: 'capability-fetch-failed', message: clean(error?.message, 180), snapshot: getFreeCapabilitySnapshot() });
  }
}

export function installEonCapabilityService(options = {}) {
  if (!currentSnapshot) setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot(), { emit: false });
  if (!installPromise || options.force === true) {installPromise = fetchEonCapabilitySnapshot(options).then((result) => {
    if (!result.ok) setCurrentCapabilitySnapshot(getFreeCapabilitySnapshot());
    return result;
  });}
  return installPromise;
}

export function getEonCapabilityServiceTruth() {
  const snapshot = getCurrentCapabilitySnapshot();
  return freeze({
    schema: EON_CAPABILITY_SERVICE_SCHEMA,
    endpoint: EON_CAPABILITY_ENDPOINT,
    tierId: snapshot.tierId,
    serverAuthoritative: snapshot.serverAuthoritative,
    paidBrowserClaimAccepted: false,
    browserCryptographicVerification: false,
    browserTrustBoundary: 'same-origin-no-store-response',
    localStorageEntitlementAccepted: false,
    eonKeyWholeTierGrantAllowed: false,
    effectiveLimitCount: Object.keys(snapshot.limits || {}).length,
    activeUnlockCount: snapshot.unlocks?.length || 0
  });
}

export default freeze({
  buildEffectiveCapabilitySnapshot,
  getFreeCapabilitySnapshot,
  signCapabilitySnapshot,
  verifyCapabilityEnvelope,
  validateCapabilityEnvelopeForBrowser,
  fetchEonCapabilitySnapshot,
  installEonCapabilityService,
  getCurrentCapabilitySnapshot,
  setCurrentCapabilitySnapshot,
  hasEonCapability,
  getEonCapabilityLimit,
  getEonCapabilityServiceTruth
});
