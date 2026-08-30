/**
 * W426 — EON City visual progression foundation.
 *
 * City architecture and character upgrades are intentionally a presentation
 * roadmap only. This module does not read account status, subscriptions,
 * payments, referral state, rewards, purchase receipts or Vault Reveal data.
 * Any future entitlement must arrive through its own audited server, consent,
 * recovery and anti-abuse release before a tier can be activated.
 */

import { getCityAssetDesignKitSummary } from './eon-city-asset-design-kit.js';

export const EON_CITY_VISUAL_PROGRESSION_SCHEMA = 'eon.city.visual-progression.w426.v1';
export const CITY_VISUAL_TIER_IDS = Object.freeze(['foundation', 'signal', 'studio', 'command', 'skyline']);

const freeze = (value) => Object.freeze(value);
const list = (values = []) => freeze([...values]);

function tier(entry) {
  return freeze({ ...entry, features: list(entry.features), districts: list(entry.districts) });
}

/**
 * The tier sequence describes future visual language, not a currently active
 * monetisation or reward system. Foundation is the only rendered tier today.
 */
export const CITY_VISUAL_TIERS = freeze([
  tier({
    id: 'foundation',
    label: 'Foundation',
    detail: 'The clean default City: clear wayfinding, calm motion, functional stations.',
    features: ['animated local vector surfaces', 'procedural operator and guide silhouettes', 'direct Babylon entry'],
    districts: ['arrival-command', 'forge-bay', 'creator-atrium', 'metropolis']
  }),
  tier({
    id: 'signal',
    label: 'Signal',
    detail: 'Future presentation preview: brighter route inlays and more expressive station beacons.',
    features: ['enhanced façade light language', 'companion halo variation', 'district arrival animation'],
    districts: ['arrival-command', 'forge-bay']
  }),
  tier({
    id: 'studio',
    label: 'Studio',
    detail: 'Future presentation preview: art-led Creator and Forge interior silhouettes.',
    features: ['gallery ribbon motion', 'workstation trim kit', 'guide accessory variants'],
    districts: ['creator-atrium', 'forge-bay']
  }),
  tier({
    id: 'command',
    label: 'Command',
    detail: 'Future presentation preview: richer Command Centre architecture and operator companion detailing.',
    features: ['hero command core', 'expanded companion shell', 'command bridge effects'],
    districts: ['arrival-command', 'metropolis']
  }),
  tier({
    id: 'skyline',
    label: 'Skyline',
    detail: 'Future presentation preview: bounded project-district architecture modules with local visual accents.',
    features: ['project station cluster', 'controlled skyline depth', 'ambient citizen variant set'],
    districts: ['project-instance', 'metropolis']
  })
]);

function normalizeQuality(value = '') {
  return ['lite', 'balanced', 'cinematic'].includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : 'balanced';
}

function normalizeTier(value = '') {
  return CITY_VISUAL_TIER_IDS.includes(String(value || '').toLowerCase()) ? String(value).toLowerCase() : 'foundation';
}

/**
 * Returns a source-only presentation plan. activeTier deliberately remains
 * Foundation until an independent entitlement system exists and has passed its
 * release gates. requestedTier is useful for future art review tooling only.
 */
export function getCityVisualProgressionPlan({ quality = 'balanced', requestedTier = 'foundation', reducedMotion = false } = {}) {
  const selectedQuality = normalizeQuality(quality);
  const previewTier = normalizeTier(requestedTier);
  const motionEnabled = selectedQuality !== 'lite' && !reducedMotion;
  return freeze({
    schema: EON_CITY_VISUAL_PROGRESSION_SCHEMA,
    activeTier: 'foundation',
    requestedTier: previewTier,
    previewOnly: previewTier !== 'foundation',
    activationBlocked: true,
    quality: selectedQuality,
    assetDesign: getCityAssetDesignKitSummary(),
    motion: freeze({
      enabled: motionEnabled,
      textureDrift: motionEnabled,
      beaconPulse: motionEnabled,
      npcIdle: motionEnabled,
      reducedMotion: Boolean(reducedMotion),
      userToggle: 'City settings only; no automatic device permission prompt'
    }),
    futureActivationRequirements: list([
      'separate entitlement data model',
      'explicit person-visible activation control',
      'account recovery and rollback proof',
      'anti-abuse and support policy review',
      'real-device visual and performance evidence'
    ]),
    localOnly: true,
    remoteNetwork: false,
    userData: false,
    finalBinaryArt: false
  });
}

export function getCityDistrictVisualPreview(districtId = '', options = {}) {
  const plan = getCityVisualProgressionPlan(options);
  const target = String(districtId || '').trim() || 'arrival-command';
  const tiers = CITY_VISUAL_TIERS
    .filter((entry) => entry.districts.includes(target))
    .map((entry) => freeze({ id: entry.id, label: entry.label, detail: entry.detail, active: entry.id === plan.activeTier, previewOnly: entry.id !== plan.activeTier }));
  return freeze({
    schema: EON_CITY_VISUAL_PROGRESSION_SCHEMA,
    districtId: target,
    activeTier: plan.activeTier,
    tiers: list(tiers),
    activationBlocked: true,
    localOnly: true
  });
}

export function getCityVisualProgressionTruth() {
  return freeze({
    schema: EON_CITY_VISUAL_PROGRESSION_SCHEMA,
    foundationRendered: true,
    futureVisualTiersPreviewOnly: true,
    entitlementRead: false,
    subscriptionRead: false,
    paymentRead: false,
    rewardRead: false,
    collectionGrantRead: false,
    referralRead: false,
    walletRead: false,
    accountRead: false,
    remoteNetwork: false,
    finalBinaryArt: false
  });
}

export function validateCityVisualProgressionPlan() {
  const errors = [];
  if (CITY_VISUAL_TIERS.length !== CITY_VISUAL_TIER_IDS.length) errors.push('Visual tier list is incomplete.');
  if (CITY_VISUAL_TIERS[0]?.id !== 'foundation') errors.push('Foundation must remain the rendered default tier.');
  if (new Set(CITY_VISUAL_TIERS.map((entry) => entry.id)).size !== CITY_VISUAL_TIERS.length) errors.push('Visual tier ids must be unique.');
  const plan = getCityVisualProgressionPlan({ quality: 'balanced', requestedTier: 'skyline' });
  if (plan.activeTier !== 'foundation' || plan.activationBlocked !== true || plan.requestedTier !== 'skyline') errors.push('Future visual tiers must remain preview-only.');
  return freeze({ schema: EON_CITY_VISUAL_PROGRESSION_SCHEMA, ok: errors.length === 0, errors: list(errors) });
}
