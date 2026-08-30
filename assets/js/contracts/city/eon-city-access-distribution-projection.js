/**
 * A15 C07 — bounded server-capability and Core-distribution projection for EONCITY.
 *
 * City receives only the current effective tier label, finite limits and
 * allowlisted active unlock summaries. It never receives account ids, billing
 * objects, referral ledgers, unlock record ids, provider keys or private work.
 * Base City, Signal Frontier, reviewed sharing and local Creator Capture remain
 * available independently of a paid tier; subscriptions/EONKEYS only affect
 * the exact capabilities declared by the canonical Capability Service.
 */
import {
  EON_CAPABILITY_SERVICE_SCHEMA,
  fetchEonCapabilitySnapshot,
  getCurrentCapabilitySnapshot,
  getFreeCapabilitySnapshot
} from '../../capabilities/eon-capability-service.js';

export const EON_CITY_ACCESS_PROJECTION_SCHEMA = 'eon.city.access-projection.a15.c07.v1';
export const EON_CITY_DISTRIBUTION_PROJECTION_SCHEMA = 'eon.city.distribution-projection.a15.c07.v1';
export const EON_CITY_ACCESS_PROJECTION_EVENT = 'eon:city-access-projection-changed';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 160) => String(value || '').trim().replace(/[^a-zA-Z0-9._:@/-]/g, '').slice(0, max);
const integer = (value = 0) => Math.max(0, Math.floor(Number(value) || 0));
const CITY_FEATURE_GROUPS = freeze(new Set([
  'max-city-skins',
  'max-vault-relics',
  'creator-preset-packs',
  'power-showcase',
  'private-builder-circle',
  'feature-voting'
]));
const CITY_UNLOCK_CATEGORIES = freeze(new Set(['city-cosmetic', 'vault-relic', 'creator-preset', 'showcase', 'profile', 'community']));

function usableSnapshot(snapshot = null, now = Date.now()) {
  if (snapshot?.schema !== EON_CAPABILITY_SERVICE_SCHEMA) return getFreeCapabilitySnapshot({ now, source: 'city-invalid-capability-fallback' });
  if (Number(snapshot.expiresAt || 0) <= Number(now)) return getFreeCapabilitySnapshot({ now, source: 'city-expired-capability-fallback' });
  return snapshot;
}

function boundedUnlock(row = {}) {
  const unlockId = clean(row.unlockId, 120);
  const featureGroup = clean(row.featureGroup, 120);
  const category = clean(row.category, 80);
  if (!unlockId || (!CITY_FEATURE_GROUPS.has(featureGroup) && !CITY_UNLOCK_CATEGORIES.has(category))) return null;
  return freeze({
    unlockId,
    featureGroup,
    category,
    permanent: row.permanent === true,
    expiresAt: Number(row.expiresAt || 0) > 0 ? Number(row.expiresAt) : null
  });
}

export function projectEonCityAccess(snapshot = getCurrentCapabilitySnapshot(), { now = Date.now() } = {}) {
  const source = usableSnapshot(snapshot, now);
  const unlocks = freeze((Array.isArray(source.unlocks) ? source.unlocks : []).map(boundedUnlock).filter(Boolean));
  const featureGroups = freeze((Array.isArray(source.featureGroups) ? source.featureGroups : []).map((value) => clean(value, 120)).filter((value) => CITY_FEATURE_GROUPS.has(value)).sort());
  return freeze({
    schema: EON_CITY_ACCESS_PROJECTION_SCHEMA,
    tierId: clean(source.tierId || 'free', 24).toLowerCase() || 'free',
    tierLabel: clean(source.tierLabel || 'Free', 48) || 'Free',
    entitlementStatus: clean(source.entitlementStatus || 'free', 32).toLowerCase() || 'free',
    accessVerified: source.serverAuthoritative === true,
    serverAuthoritative: source.serverAuthoritative === true,
    expiresAt: Number(source.expiresAt || 0),
    effectiveLimits: freeze({
      projectSlots: integer(source.limits?.projectSlots),
      automationDrafts: integer(source.limits?.automationDrafts),
      creatorPresetPacks: integer(source.limits?.creatorPresetPacks),
      showcaseSlots: integer(source.limits?.showcaseSlots)
    }),
    cityFeatureGroups: featureGroups,
    activeCityUnlocks: unlocks,
    baseCityAvailable: true,
    signalFrontierAvailable: true,
    reviewedSharingAvailable: true,
    localCreatorCaptureAvailable: true,
    plansSurfaceAvailable: true,
    eonKeysGrantWholeTier: false,
    eonKeysCreateSubscription: false,
    eonKeysPayProviderCosts: false,
    shareActionIssuesReward: false,
    accountIdStored: false,
    sourceRecordIdStored: false,
    billingObjectStored: false,
    privateContentStored: false
  });
}


export async function fetchEonCityAccessProjection({ environment = globalThis, now = Date.now(), force = false } = {}) {
  const result = await fetchEonCapabilitySnapshot({
    fetchImpl: environment?.fetch?.bind?.(environment) || environment?.fetch,
    now,
    ...(force ? { endpoint: '/api/capabilities/status' } : {})
  });
  const projection = projectEonCityAccess(result?.snapshot || getFreeCapabilitySnapshot({ now, source: 'city-capability-fetch-fallback' }), { now });
  if (typeof environment?.dispatchEvent === 'function' && typeof environment?.CustomEvent === 'function') {
    environment.dispatchEvent(new environment.CustomEvent(EON_CITY_ACCESS_PROJECTION_EVENT, { detail: projection }));
  }
  return freeze({ ok: result?.ok === true && projection.serverAuthoritative === true, reason: result?.reason || (projection.serverAuthoritative ? 'verified' : 'free-fallback'), projection });
}

export function projectEonCityDistribution({
  snapshot = getCurrentCapabilitySnapshot(),
  captureCapability = {},
  shareReceipt = null,
  now = Date.now()
} = {}) {
  const access = projectEonCityAccess(snapshot, { now });
  const shareVerified = shareReceipt?.verified === true;
  return freeze({
    schema: EON_CITY_DISTRIBUTION_PROJECTION_SCHEMA,
    access,
    creatorPresetPacks: access.effectiveLimits.creatorPresetPacks,
    captureReadyOnDevice: captureCapability?.ready === true,
    captureStartsAutomatically: false,
    captureUploadsToEonapp: false,
    captureRequiresPaidTier: false,
    reviewedShareReceiptPresent: shareVerified,
    reviewedShareKind: shareVerified ? clean(shareReceipt.kind, 80) : '',
    signedLinkStored: false,
    mediaStored: false,
    destinationStored: false,
    automaticUpload: false,
    automaticPublishing: false,
    publicPostingClaimed: false,
    referralRewardIssued: false,
    eonKeyIssuedByShare: false,
    explicitUserActionRequired: true,
    privateContentStored: false
  });
}

export function validateEonCityAccessProjection(projection = {}) {
  const errors = [];
  if (projection?.schema !== EON_CITY_ACCESS_PROJECTION_SCHEMA) errors.push('schema-invalid');
  if (!projection?.tierId || !projection?.tierLabel) errors.push('tier-invalid');
  if (!projection?.baseCityAvailable || !projection?.signalFrontierAvailable || !projection?.reviewedSharingAvailable || !projection?.localCreatorCaptureAvailable) errors.push('base-capability-paywalled');
  if (projection?.eonKeysGrantWholeTier || projection?.eonKeysCreateSubscription || projection?.eonKeysPayProviderCosts || projection?.shareActionIssuesReward) errors.push('commercial-boundary-invalid');
  if (projection?.accountIdStored || projection?.sourceRecordIdStored || projection?.billingObjectStored || projection?.privateContentStored) errors.push('private-field-invalid');
  if (!Array.isArray(projection?.activeCityUnlocks) || projection.activeCityUnlocks.some((row) => 'sourceRecordId' in row || 'accountId' in row)) errors.push('unlock-projection-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function validateEonCityDistributionProjection(projection = {}) {
  const errors = [];
  if (projection?.schema !== EON_CITY_DISTRIBUTION_PROJECTION_SCHEMA) errors.push('schema-invalid');
  if (projection?.captureStartsAutomatically || projection?.captureUploadsToEonapp || projection?.captureRequiresPaidTier) errors.push('capture-boundary-invalid');
  if (projection?.signedLinkStored || projection?.mediaStored || projection?.destinationStored || projection?.automaticUpload || projection?.automaticPublishing || projection?.publicPostingClaimed || projection?.referralRewardIssued || projection?.eonKeyIssuedByShare || projection?.privateContentStored) errors.push('distribution-boundary-invalid');
  if (projection?.explicitUserActionRequired !== true) errors.push('explicit-action-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function dispatchEonCityAccessProjection(snapshot = getCurrentCapabilitySnapshot(), environment = globalThis) {
  const projection = projectEonCityAccess(snapshot);
  if (typeof environment?.dispatchEvent === 'function' && typeof environment?.CustomEvent === 'function') {
    environment.dispatchEvent(new environment.CustomEvent(EON_CITY_ACCESS_PROJECTION_EVENT, { detail: projection }));
  }
  return projection;
}

export function getEonCityAccessDistributionTruth() {
  return freeze({
    schema: EON_CITY_ACCESS_PROJECTION_SCHEMA,
    consumesCanonicalCapabilityServiceOnly: true,
    localStorageEntitlementAccepted: false,
    baseCityPaywalled: false,
    signalFrontierPaywalled: false,
    creatorCapturePaywalled: false,
    sharingPaywalled: false,
    eonKeyWholeTierGrantAllowed: false,
    eonKeySubscriptionGrantAllowed: false,
    eonKeyProviderCreditAllowed: false,
    shareRewardAllowed: false,
    automaticUpload: false,
    automaticPublishing: false,
    privateContentStored: false
  });
}

export default freeze({
  projectEonCityAccess,
  fetchEonCityAccessProjection,
  projectEonCityDistribution,
  validateEonCityAccessProjection,
  validateEonCityDistributionProjection,
  dispatchEonCityAccessProjection,
  getEonCityAccessDistributionTruth
});
