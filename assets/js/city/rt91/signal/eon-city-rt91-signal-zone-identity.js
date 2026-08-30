/** RT91 Signal — five-zone flagship identity and distance-tier contract. */
import { EON_EXPANSE_W771A_ZONE_IDENTITIES } from '../../w771/eon-expanse-w771a-five-zone-cinematic-art-contract.js';

export const EON_CITY_RT91_SIGNAL_ZONE_IDENTITY_SCHEMA = 'eon.city.signal.zone-identity.rt91.v1';
const freeze = Object.freeze;

const SILHOUETTES = freeze({
  'gateway-overlook': freeze({ mid: 'layered-overlook-frames', horizon: 'gateway-relay-spines', routeLanguage: 'cyan-signal-rails' }),
  'beacon-fields': freeze({ mid: 'staggered-beacon-pylons', horizon: 'emerald-grid-spires', routeLanguage: 'energized-circuit-trenches' }),
  'archive-ruins': freeze({ mid: 'broken-vertical-archive-walls', horizon: 'violet-memory-towers', routeLanguage: 'fragmented-memory-walkways' }),
  'transit-scar': freeze({ mid: 'industrial-gantry-chain', horizon: 'amber-rail-cranes', routeLanguage: 'sequenced-rail-lights' }),
  'horizon-vault': freeze({ mid: 'monumental-vault-rings', horizon: 'gold-violet-thresholds', routeLanguage: 'vault-convergence-lines' })
});

export const EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES = freeze(EON_EXPANSE_W771A_ZONE_IDENTITIES.map((identity) => {
  const silhouette = SILHOUETTES[identity.zoneId];
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_ZONE_IDENTITY_SCHEMA,
    zoneId: identity.zoneId,
    title: identity.title,
    signature: identity.signature,
    heroAssetId: identity.heroAssetId,
    palette: identity.palette,
    audioFamily: identity.audioFamily,
    transformationMilestone: identity.transformation.milestone,
    routeLanguage: silhouette.routeLanguage,
    distancePresentation: freeze({
      near: freeze({ role: 'authored-hero-and-interactive-detail', fullDetailAllowed: true }),
      mid: freeze({ role: silhouette.mid, fullDetailAllowed: false, instancingPreferred: true }),
      horizon: freeze({ role: silhouette.horizon, fullDetailAllowed: false, impostorOrLowPolyPreferred: true })
    }),
    bootCriticalAssetAddedByRt91: false,
    authoredHeroRemainsDominant: true,
    screenshotDistinctWithoutLabels: true
  });
}));

export function validateEonCityRt91SignalZoneIdentities() {
  const errors = [];
  const seen = new Set();
  for (const zone of EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES) {
    if (!zone.zoneId || seen.has(zone.zoneId)) errors.push(`zone:${zone.zoneId || 'missing'}`);
    seen.add(zone.zoneId);
    if (!zone.heroAssetId || !zone.signature || !zone.routeLanguage) errors.push(`identity:${zone.zoneId}`);
    if (!zone.distancePresentation?.near || !zone.distancePresentation?.mid || !zone.distancePresentation?.horizon) errors.push(`distance-tiers:${zone.zoneId}`);
    if (zone.distancePresentation?.mid?.fullDetailAllowed !== false || zone.distancePresentation?.horizon?.fullDetailAllowed !== false) errors.push(`distance-budget:${zone.zoneId}`);
    if (zone.bootCriticalAssetAddedByRt91 !== false || zone.authoredHeroRemainsDominant !== true || zone.screenshotDistinctWithoutLabels !== true) errors.push(`boundary:${zone.zoneId}`);
  }
  if (seen.size !== 5) errors.push('zone-count');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), zoneCount: seen.size, bootCriticalAssetsAdded: 0 });
}

export function getEonCityRt91SignalZoneIdentity(zoneId = '') {
  return EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES.find((entry) => entry.zoneId === String(zoneId || '')) || null;
}

export default freeze({ EON_CITY_RT91_SIGNAL_ZONE_IDENTITY_SCHEMA, EON_CITY_RT91_SIGNAL_ZONE_IDENTITIES, validateEonCityRt91SignalZoneIdentities, getEonCityRt91SignalZoneIdentity });
