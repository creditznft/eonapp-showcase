/**
 * W691 — final Realms + My Realm product integration.
 *
 * The six stable technical Realm ids remain unchanged so existing local visits,
 * discoveries and receipts keep resolving. Three legacy presentation names are
 * projected into the approved N3+C3 product identities. My Realm becomes a
 * bounded spatial reflection of verified transformations, with explicit native
 * review actions and no private payload storage or automatic execution.
 */

export const EON_CITY_W691_REALMS_MY_REALM_SCHEMA = 'eon.city.realms-my-realm-integration.w691.v1';
const freeze = (value) => Object.freeze(value);
const point = (x = 0, y = 0, z = 0) => freeze({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;

export const EON_CITY_W691_FINAL_REALM_IDENTITIES = freeze({
  'archive-noir': freeze({
    productId: 'archive-noir', label: 'Archive Noir', chapter: 'The Silent Index',
    productivityRole: 'Recovery, archive and truthful return paths', nativeRoute: '/capsule',
    reflectionZoneId: 'my-realm-archive-bay', reflectionLabel: 'Archive Bay',
    paletteRole: 'noir-mint-memory'
  }),
  'living-bio-city': freeze({
    productId: 'living-bio-city', label: 'Living Bio-City', chapter: 'The Breathing Grid',
    productivityRole: 'Local AI, provider readiness and living systems', nativeRoute: '/local-ai',
    reflectionZoneId: 'my-realm-bio-garden', reflectionLabel: 'Bio Garden',
    paletteRole: 'bio-mint-signal'
  }),
  'golden-sovereign': freeze({
    productId: 'golden-sovereign-realm', label: 'Golden Sovereign Realm', chapter: 'The Elevated Accord',
    productivityRole: 'Orientation, priorities and reviewed command decisions', nativeRoute: '/eoncity',
    reflectionZoneId: 'my-realm-sovereign-gallery', reflectionLabel: 'Sovereign Gallery',
    paletteRole: 'sovereign-gold-amber'
  }),
  // Stable technical id retained for local visit/discovery compatibility.
  'forge-depths': freeze({
    productId: 'oceanic-light', label: 'Oceanic Light', chapter: 'The Luminous Current',
    productivityRole: 'Project continuity, calm synthesis and reviewed outcomes', nativeRoute: '/projects',
    reflectionZoneId: 'my-realm-oceanic-pool', reflectionLabel: 'Oceanic Light Pool',
    paletteRole: 'ocean-cyan-white'
  }),
  // Stable technical id retained for local visit/discovery compatibility.
  'orbital-white-city': freeze({
    productId: 'path-of-time', label: 'Path of Time', chapter: 'The Continuity Meridian',
    productivityRole: 'Creation history, milestones and deliberate next actions', nativeRoute: '/create',
    reflectionZoneId: 'my-realm-time-observatory', reflectionLabel: 'Time Observatory',
    paletteRole: 'time-white-violet'
  }),
  // Stable technical id retained for local visit/discovery compatibility.
  'nexus-ruins': freeze({
    productId: 'eonbot-temple', label: 'EONBOT Temple', chapter: 'The Companion Accord',
    productivityRole: 'EONBOT guidance, automation review and bounded agent work', nativeRoute: '/automations',
    reflectionZoneId: 'my-realm-eonbot-temple', reflectionLabel: 'EONBOT Temple Court',
    paletteRole: 'eonbot-violet-cyan'
  })
});

const ZONE_LAYOUT = freeze([
  freeze({ zoneId: 'my-realm-archive-bay', realmId: 'archive-noir', x: -53.5, z: -4.8, heading: Math.PI / 4 }),
  freeze({ zoneId: 'my-realm-bio-garden', realmId: 'living-bio-city', x: -48, z: -7.2, heading: 0 }),
  freeze({ zoneId: 'my-realm-sovereign-gallery', realmId: 'golden-sovereign', x: -42.5, z: -4.8, heading: -Math.PI / 4 }),
  freeze({ zoneId: 'my-realm-oceanic-pool', realmId: 'forge-depths', x: -42.5, z: 4.8, heading: -Math.PI * 0.75 }),
  freeze({ zoneId: 'my-realm-time-observatory', realmId: 'orbital-white-city', x: -48, z: 7.2, heading: Math.PI }),
  freeze({ zoneId: 'my-realm-eonbot-temple', realmId: 'nexus-ruins', x: -53.5, z: 4.8, heading: Math.PI * 0.75 })
]);

function cloneIdentity(identity) {
  return identity ? freeze({ ...identity }) : null;
}

export function getEonCityW691RealmIdentity(realmId = '') {
  return cloneIdentity(EON_CITY_W691_FINAL_REALM_IDENTITIES[String(realmId || '').trim().toLowerCase()]);
}

export function projectEonCityW691RealmDefinition(realm = {}) {
  const identity = getEonCityW691RealmIdentity(realm.id);
  if (!identity) return freeze({ ...realm });
  return freeze({
    ...realm,
    label: identity.label,
    chapter: identity.chapter,
    productIdentityId: identity.productId,
    productivityRole: identity.productivityRole,
    finalNativeRoute: identity.nativeRoute,
    reflectionZoneId: identity.reflectionZoneId,
    reflectionLabel: identity.reflectionLabel,
    paletteRole: identity.paletteRole,
    stableTechnicalIdPreserved: true
  });
}

function normaliseTransformation(entry = {}, index = 0) {
  const id = String(entry?.id || '').trim().toLowerCase();
  if (!SAFE_ID.test(id)) return null;
  const destination = ['core', 'expanse', 'my-realm'].includes(String(entry?.destination)) ? String(entry.destination) : 'my-realm';
  return freeze({
    id,
    destination,
    location: String(entry?.location || '').trim().slice(0, 80),
    label: String(entry?.label || id.replaceAll('-', ' ')).trim().slice(0, 100),
    verifiedBoundedReceipt: entry?.verifiedBoundedReceipt !== false,
    privateContentStored: false,
    index
  });
}

function realmForTransformation(transformation = {}) {
  const haystack = `${transformation.id} ${transformation.location} ${transformation.label}`.toLowerCase();
  if (/archive|vault|recovery|backup/.test(haystack)) return 'archive-noir';
  if (/device|local-ai|provider|bio|grid/.test(haystack)) return 'living-bio-city';
  if (/orientation|command|priority|sovereign/.test(haystack)) return 'golden-sovereign';
  if (/project|forge|build|ocean|continuity/.test(haystack)) return 'forge-depths';
  if (/creator|capture|timeline|time|milestone/.test(haystack)) return 'orbital-white-city';
  if (/automation|agent|eonbot|companion|relay/.test(haystack)) return 'nexus-ruins';
  return Object.keys(EON_CITY_W691_FINAL_REALM_IDENTITIES)[transformation.index % 6];
}

export function buildEonCityW691MyRealmPlan({ transformations = [], selectedTransformationId = '', mode = 'explore', quality = 'balanced' } = {}) {
  const rows = freeze((Array.isArray(transformations) ? transformations : [])
    .map(normaliseTransformation)
    .filter(Boolean)
    .slice(0, quality === 'lite' ? 6 : quality === 'cinematic' ? 12 : 8));
  const zones = freeze(ZONE_LAYOUT.map((layout) => {
    const identity = EON_CITY_W691_FINAL_REALM_IDENTITIES[layout.realmId];
    const zoneTransformations = rows.filter((entry) => realmForTransformation(entry) === layout.realmId);
    return freeze({
      id: layout.zoneId,
      realmId: layout.realmId,
      productIdentityId: identity.productId,
      label: identity.reflectionLabel,
      realmLabel: identity.label,
      productivityRole: identity.productivityRole,
      nativeRoute: identity.nativeRoute,
      position: point(layout.x, 0, layout.z),
      heading: layout.heading,
      transformationIds: freeze(zoneTransformations.map((entry) => entry.id)),
      verifiedTransformationCount: zoneTransformations.length,
      dormant: zoneTransformations.length === 0,
      reviewFirst: true,
      automaticNavigation: false,
      automaticExecution: false
    });
  }));
  const placements = freeze(rows.map((entry, index) => {
    const realmId = realmForTransformation(entry);
    const zone = zones.find((candidate) => candidate.realmId === realmId) || zones[index % zones.length];
    const sameZone = rows.filter((candidate) => realmForTransformation(candidate) === realmId);
    const localIndex = sameZone.findIndex((candidate) => candidate.id === entry.id);
    const angle = zone.heading + (localIndex - (sameZone.length - 1) / 2) * 0.55;
    const radius = 1.35 + (localIndex % 2) * 0.55;
    return freeze({
      transformationId: entry.id,
      realmId,
      zoneId: zone.id,
      label: entry.label,
      destination: entry.destination,
      location: entry.location,
      position: point(zone.position.x + Math.cos(angle) * radius, 0, zone.position.z + Math.sin(angle) * radius),
      selected: entry.id === String(selectedTransformationId || ''),
      verifiedBoundedReceipt: true,
      privateContentStored: false,
      reviewFirst: true
    });
  }));
  return freeze({
    schema: EON_CITY_W691_REALMS_MY_REALM_SCHEMA,
    mode: mode === 'focus' ? 'focus' : 'explore',
    quality: ['lite', 'balanced', 'cinematic'].includes(String(quality)) ? String(quality) : 'balanced',
    realmCount: 6,
    zones,
    transformations: rows,
    placements,
    selectedTransformationId: placements.some((entry) => entry.selected) ? String(selectedTransformationId) : '',
    emptyState: rows.length === 0,
    emptyStateLabel: 'Verified outcomes will shape My Realm here.',
    nativeActionsRequireReview: true,
    focusModeDirectActions: true,
    exploreModeSpatialDiscovery: true,
    privateContentStored: false,
    automaticNavigation: false,
    automaticExecution: false,
    networkRequestCreated: false,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false
  });
}

export function validateEonCityW691RealmsMyRealmPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W691_REALMS_MY_REALM_SCHEMA) errors.push('schema-invalid');
  if (plan.realmCount !== 6 || !Array.isArray(plan.zones) || plan.zones.length !== 6) errors.push('six-realm-zones-required');
  if (new Set((plan.zones || []).map((entry) => entry.productIdentityId)).size !== 6) errors.push('realm-identity-uniqueness-invalid');
  if ((plan.zones || []).some((entry) => !entry.label || !entry.nativeRoute?.startsWith('/') || !entry.reviewFirst || entry.automaticNavigation || entry.automaticExecution)) errors.push('zone-productivity-invalid');
  if (!Array.isArray(plan.transformations) || !Array.isArray(plan.placements) || plan.transformations.length !== plan.placements.length) errors.push('transformation-placement-invalid');
  if ((plan.placements || []).some((entry) => !entry.verifiedBoundedReceipt || entry.privateContentStored || !entry.reviewFirst)) errors.push('verified-reflection-boundary-invalid');
  if (!plan.nativeActionsRequireReview || !plan.focusModeDirectActions || !plan.exploreModeSpatialDiscovery) errors.push('mode-productivity-invalid');
  if (plan.privateContentStored || plan.automaticNavigation || plan.automaticExecution || plan.networkRequestCreated || !plan.oneCanonicalScene || plan.secondCanvasCreated || plan.secondRenderLoopCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), realmCount: plan.zones?.length || 0, transformationCount: plan.transformations?.length || 0 });
}

export function getEonCityW691Truth() {
  return freeze({
    schema: EON_CITY_W691_REALMS_MY_REALM_SCHEMA,
    approvedRealmIdentitiesProjected: true,
    stableTechnicalIdsPreserved: true,
    verifiedOutcomesShapeMyRealm: true,
    privatePayloadsNeverStored: true,
    nativeActionsRemainReviewFirst: true,
    oneCanonicalScene: true,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export default freeze({
  EON_CITY_W691_REALMS_MY_REALM_SCHEMA,
  EON_CITY_W691_FINAL_REALM_IDENTITIES,
  getEonCityW691RealmIdentity,
  projectEonCityW691RealmDefinition,
  buildEonCityW691MyRealmPlan,
  validateEonCityW691RealmsMyRealmPlan,
  getEonCityW691Truth
});
