/**
 * W689 — complete productive District Belt authority.
 *
 * Extends the reusable W687 builder to the six remaining compact districts,
 * while preserving the authored Orientation belt and W688 Creator/Forge
 * activation. All nine product districts now resolve through one projected
 * sanctum-plus-belt authority for travel, terminals, identity and proximity.
 */

import {
  buildEonCityW687DistrictBeltPlan,
  buildEonCityW687DistrictBeltPlanFromSpecialisation
} from '../w687/eon-city-w687-district-belt-system.js';
import {
  EON_CITY_W688_PRODUCT_DISTRICTS,
  getEonCityW688DistrictWorldPose,
  projectEonCityW688TransportDestination,
  resolveEonCityW688TerminalPlacement
} from '../w688/eon-city-w688-creator-forge-belt-activation.js';
import {
  getEonCityW674OrientationDistrictArrival,
  getEonCityW674OrientationTerminalPosition,
  resolveEonCityW674OrientationDistrictBeltAtPosition
} from '../w674/eon-city-w674-orientation-district-belt.js';

export const EON_CITY_W689_ALL_DISTRICT_BELTS_SCHEMA = 'eon.city.all-district-belts.w689.v1';
const freeze = (value) => Object.freeze(value);
const point = (x = 0, y = 0, z = 0) => freeze({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });

const REMAINING_SPECIALISATIONS = freeze({
  'transit-network': freeze({
    identity: freeze({ silhouette: 'layered capsule concourse and signal bridges', streetFamily: 'radial-platform-grid', populationFamily: 'travellers-dispatchers-guides', accentRole: 'mobility-cyan' }),
    buildingKinds: freeze([
      freeze({ label: 'Capsule Depot', role: 'capsule-operations' }),
      freeze({ label: 'Route Control', role: 'route-review' }),
      freeze({ label: 'Passenger Concourse', role: 'accessible-travel' }),
      freeze({ label: 'Mobility Lab', role: 'transit-guidance' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Arrival Concourse', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.4) }),
      freeze({ label: 'Route Review Forum', kind: 'public-work-area', productive: true, offset: point(-6.2, 0, 2.4) }),
      freeze({ label: 'Accessible Mobility Walk', kind: 'accessibility-court', productive: true, offset: point(6.2, 0, 2.6) })
    ]),
    workLoops: freeze([
      freeze({ id: 'transit-loop-map', label: 'Review district routes', terminalId: 'district-route-console', panel: 'travel-map', reviewRequired: true }),
      freeze({ id: 'transit-loop-capsule', label: 'Inspect capsule status', terminalId: 'capsule-status-terminal', panel: 'travel-map', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'transit-discovery-signal-bridge', label: 'Signal Bridge', kind: 'landmark' }),
      freeze({ id: 'transit-discovery-capsule-depot', label: 'Capsule Depot', kind: 'equipment' }),
      freeze({ id: 'transit-discovery-accessible-walk', label: 'Accessible Mobility Walk', kind: 'space' })
    ])
  }),
  'agent-theatre': freeze({
    identity: freeze({ silhouette: 'stepped review amphitheatre and receipt towers', streetFamily: 'terraced-review-arc', populationFamily: 'operators-reviewers-liaisons', accentRole: 'proposal-violet' }),
    buildingKinds: freeze([
      freeze({ label: 'Proposal Studio', role: 'proposal-review' }),
      freeze({ label: 'Receipt Archive', role: 'receipt-verification' }),
      freeze({ label: 'Review Chamber', role: 'human-approval' }),
      freeze({ label: 'Operator Lounge', role: 'agent-guidance' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Review Arrival Dais', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.25) }),
      freeze({ label: 'Proposal Commons', kind: 'public-work-area', productive: true, offset: point(-6.35, 0, 2.4) }),
      freeze({ label: 'Receipt Walk', kind: 'review-lounge', productive: true, offset: point(6.1, 0, 2.8) })
    ]),
    workLoops: freeze([
      freeze({ id: 'agent-loop-proposals', label: 'Review proposals', terminalId: 'proposal-review-dais', panel: 'command-room', reviewRequired: true }),
      freeze({ id: 'agent-loop-receipts', label: 'Verify receipts', terminalId: 'receipt-verification-console', panel: 'command-room', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'agent-discovery-review-arch', label: 'Review Arch', kind: 'landmark' }),
      freeze({ id: 'agent-discovery-receipt-vault', label: 'Receipt Archive', kind: 'space' }),
      freeze({ id: 'agent-discovery-proposal-stage', label: 'Proposal Stage', kind: 'equipment' })
    ])
  }),
  'command-centre': freeze({
    identity: freeze({ silhouette: 'layered command citadel and horizon arrays', streetFamily: 'orthogonal-command-grid', populationFamily: 'coordinators-operators-observers', accentRole: 'command-blue' }),
    buildingKinds: freeze([
      freeze({ label: 'Operations Hall', role: 'city-operations' }),
      freeze({ label: 'System Observatory', role: 'system-state' }),
      freeze({ label: 'Review Command', role: 'review-inbox' }),
      freeze({ label: 'City Coordination', role: 'district-coordination' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Command Arrival Court', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.35) }),
      freeze({ label: 'Operations Commons', kind: 'public-work-area', productive: true, offset: point(-6.4, 0, 2.45) }),
      freeze({ label: 'Horizon Observatory', kind: 'observation-court', productive: true, offset: point(6.25, 0, 2.65) })
    ]),
    workLoops: freeze([
      freeze({ id: 'command-loop-status', label: 'Review City status', terminalId: 'city-status-command-table', panel: 'command-room', reviewRequired: true }),
      freeze({ id: 'command-loop-agents', label: 'Inspect agent operations', terminalId: 'agent-operations-console', panel: 'command-room', reviewRequired: true }),
      freeze({ id: 'command-loop-inbox', label: 'Review attention queue', terminalId: 'review-inbox-terminal', route: '/workspace', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'command-discovery-horizon-array', label: 'Horizon Array', kind: 'landmark' }),
      freeze({ id: 'command-discovery-city-table', label: 'City Command Table', kind: 'equipment' }),
      freeze({ id: 'command-discovery-observatory', label: 'System Observatory', kind: 'space' })
    ])
  }),
  'archive-canopy': freeze({
    identity: freeze({ silhouette: 'luminous canopy towers linked by knowledge bridges', streetFamily: 'garden-index-paths', populationFamily: 'navigators-researchers-indexers', accentRole: 'archive-green' }),
    buildingKinds: freeze([
      freeze({ label: 'Research Library', role: 'library-search' }),
      freeze({ label: 'Index Garden', role: 'knowledge-navigation' }),
      freeze({ label: 'Knowledge Studio', role: 'research-work' }),
      freeze({ label: 'Archive Walk', role: 'saved-context' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Canopy Arrival Garden', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.2) }),
      freeze({ label: 'Research Commons', kind: 'public-work-area', productive: true, offset: point(-6.2, 0, 2.3) }),
      freeze({ label: 'Index Garden', kind: 'knowledge-garden', productive: true, offset: point(6.1, 0, 2.8) })
    ]),
    workLoops: freeze([
      freeze({ id: 'archive-loop-library', label: 'Search Library', terminalId: 'library-search-terminal', route: '/library', reviewRequired: true }),
      freeze({ id: 'archive-loop-research', label: 'Review research archive', terminalId: 'research-archive-console', route: '/insights', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'archive-discovery-knowledge-tree', label: 'Knowledge Tree', kind: 'landmark' }),
      freeze({ id: 'archive-discovery-index-garden', label: 'Index Garden', kind: 'space' }),
      freeze({ id: 'archive-discovery-research-bridge', label: 'Research Bridge', kind: 'space' })
    ])
  }),
  'vault-station': freeze({
    identity: freeze({ silhouette: 'fortified custody gate and recovery arches', streetFamily: 'secure-processional-lanes', populationFamily: 'stewards-sentinels-recovery-guides', accentRole: 'vault-blue-gold' }),
    buildingKinds: freeze([
      freeze({ label: 'Recovery Office', role: 'recovery-review' }),
      freeze({ label: 'Custody Hall', role: 'custody-boundaries' }),
      freeze({ label: 'Backup Clinic', role: 'backup-guidance' }),
      freeze({ label: 'Reveal Chamber', role: 'verified-reveals' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Custody Arrival Court', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.3) }),
      freeze({ label: 'Recovery Commons', kind: 'public-work-area', productive: true, offset: point(-6.2, 0, 2.45) }),
      freeze({ label: 'Backup Boundary Walk', kind: 'trust-court', productive: true, offset: point(6.15, 0, 2.65) })
    ]),
    workLoops: freeze([
      freeze({ id: 'vault-loop-recovery', label: 'Review recovery', terminalId: 'vault-recovery-console', route: '/vault', reviewRequired: true }),
      freeze({ id: 'vault-loop-backup', label: 'Inspect backup boundaries', terminalId: 'backup-boundary-terminal', route: '/vault', reviewRequired: true }),
      freeze({ id: 'vault-loop-reveals', label: 'Review verified Reveals', terminalId: 'reveal-status-altar', panel: 'missions-rewards', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'vault-discovery-custody-gate', label: 'Custody Gate', kind: 'landmark' }),
      freeze({ id: 'vault-discovery-recovery-arch', label: 'Recovery Arch', kind: 'space' }),
      freeze({ id: 'vault-discovery-reveal-chamber', label: 'Reveal Chamber', kind: 'space' })
    ])
  }),
  'trade-dome': freeze({
    identity: freeze({ silhouette: 'public membership dome and key-light arcades', streetFamily: 'civic-market-radials', populationFamily: 'membership-guides-referral-liaisons-citizens', accentRole: 'trade-amber-teal' }),
    buildingKinds: freeze([
      freeze({ label: 'Membership House', role: 'plan-status' }),
      freeze({ label: 'Referral Desk', role: 'referral-status' }),
      freeze({ label: 'EONKEY Gallery', role: 'feature-unlocks' }),
      freeze({ label: 'Plan Commons', role: 'membership-guidance' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Dome Arrival Plaza', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.25) }),
      freeze({ label: 'Membership Commons', kind: 'public-work-area', productive: true, offset: point(-6.25, 0, 2.35) }),
      freeze({ label: 'EONKEY Gallery Walk', kind: 'public-gallery', productive: true, offset: point(6.15, 0, 2.75) })
    ]),
    workLoops: freeze([
      freeze({ id: 'trade-loop-membership', label: 'Review membership', terminalId: 'membership-plan-console', panel: 'membership', reviewRequired: true }),
      freeze({ id: 'trade-loop-referrals', label: 'Review referral status', terminalId: 'referral-status-terminal', panel: 'share-center', reviewRequired: true }),
      freeze({ id: 'trade-loop-eonkeys', label: 'Review EONKEY unlocks', terminalId: 'eonkeys-unlock-terminal', route: '/eon-keys', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'trade-discovery-membership-dome', label: 'Membership Dome', kind: 'landmark' }),
      freeze({ id: 'trade-discovery-referral-desk', label: 'Referral Desk', kind: 'equipment' }),
      freeze({ id: 'trade-discovery-eonkey-gallery', label: 'EONKEY Gallery', kind: 'space' })
    ])
  })
});

const CREATOR_FORGE_IDS = freeze(['creator-atrium', 'forge-basilica']);
const REMAINING_IDS = freeze(Object.keys(REMAINING_SPECIALISATIONS));
const ALL_NON_ORIENTATION_IDS = freeze([...CREATOR_FORGE_IDS, ...REMAINING_IDS]);

export function getEonCityW689SupportedDistricts() {
  return ALL_NON_ORIENTATION_IDS;
}

export function buildEonCityW689DistrictBeltPlan(districtId = '', options = {}) {
  const id = String(districtId || '').trim().toLowerCase();
  const base = CREATOR_FORGE_IDS.includes(id)
    ? buildEonCityW687DistrictBeltPlan(id, options)
    : buildEonCityW687DistrictBeltPlanFromSpecialisation(id, REMAINING_SPECIALISATIONS[id] || null, options);
  if (!base) return null;
  const identity = REMAINING_SPECIALISATIONS[id]?.identity || freeze({
    silhouette: id === 'creator-atrium' ? 'stepped creator terraces and luminous capture sails' : 'industrial cathedral and validation towers',
    streetFamily: id === 'creator-atrium' ? 'creative-promenade-grid' : 'foundry-processional-grid',
    populationFamily: id === 'creator-atrium' ? 'creators-project-guides-media-operators' : 'builders-debuggers-device-specialists',
    accentRole: id === 'creator-atrium' ? 'creator-rose-gold' : 'forge-orange-cyan'
  });
  return freeze({ ...base, sourceSchema: base.schema, schema: EON_CITY_W689_ALL_DISTRICT_BELTS_SCHEMA, identity, completeProductiveBelt: true });
}

function projectDistrict(district) {
  const plan = buildEonCityW689DistrictBeltPlan(district.id);
  if (!plan) return district;
  return freeze({
    ...district,
    center: freeze({ x: plan.center.x, z: plan.center.z }),
    arrival: freeze({ x: plan.arrival.x, z: plan.arrival.z, heading: plan.arrival.heading }),
    radius: plan.beltRadius,
    spatialModel: 'sanctum-plus-belt',
    beltPlanId: `${district.id}:belt`,
    productiveWorkLoops: freeze(plan.workLoops.map((entry) => entry.id)),
    visibleDiscoveries: freeze(plan.discoveries.map((entry) => entry.id)),
    identityGrammar: plan.identity
  });
}

export const EON_CITY_W689_PRODUCT_DISTRICTS = freeze(EON_CITY_W688_PRODUCT_DISTRICTS.map((district) => ALL_NON_ORIENTATION_IDS.includes(district.id) ? projectDistrict(district) : district));
const projectedById = new Map(EON_CITY_W689_PRODUCT_DISTRICTS.map((entry) => [entry.id, entry]));

export function getEonCityW689ProductDistrict(id = '') {
  return projectedById.get(String(id || '').trim().toLowerCase()) || null;
}

export function resolveEonCityW689DistrictAtPosition(position = {}, {
  currentDistrictId = '',
  enterMargin = 0.35,
  exitMargin = 1.35,
  switchAdvantage = 1.5
} = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;

  const orientation = resolveEonCityW674OrientationDistrictBeltAtPosition({ x, z });
  if (orientation) return getEonCityW689ProductDistrict('orientation-hall');

  const insideBelts = ALL_NON_ORIENTATION_IDS
    .map((id) => {
      const plan = buildEonCityW689DistrictBeltPlan(id);
      const distance = plan ? Math.hypot(x - plan.center.x, z - plan.center.z) : Number.POSITIVE_INFINITY;
      return { id, plan, distance };
    })
    .filter((entry) => entry.plan && entry.distance <= entry.plan.beltRadius)
    .sort((left, right) => left.distance - right.distance);
  if (insideBelts.length) return getEonCityW689ProductDistrict(insideBelts[0].id);

  const ranked = EON_CITY_W689_PRODUCT_DISTRICTS
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.center.x, z - entry.center.z) }))
    .sort((left, right) => left.distance - right.distance);
  const candidate = ranked[0] || null;
  const current = getEonCityW689ProductDistrict(currentDistrictId);
  if (!current || !candidate) return candidate?.entry || null;
  if (candidate.entry.id === current.id) return current;
  const currentDistance = Math.hypot(x - current.center.x, z - current.center.z);
  const safelyInsideCurrent = currentDistance <= current.radius + Math.max(0, Number(exitMargin) || 0);
  const clearlyInsideCandidate = candidate.distance <= Math.max(0.1, candidate.entry.radius - Math.max(0, Number(enterMargin) || 0));
  const clearlyCloser = candidate.distance + Math.max(0, Number(switchAdvantage) || 0) < currentDistance;
  if (safelyInsideCurrent && (!clearlyInsideCandidate || !clearlyCloser)) return current;
  return candidate.entry;
}

export function getEonCityW689DistrictWorldPose(id = '') {
  const district = getEonCityW689ProductDistrict(id);
  if (!district) return getEonCityW688DistrictWorldPose(id);
  return freeze({ districtId: district.id, center: freeze({ ...district.center }), arrival: freeze({ ...district.arrival }), radius: Number(district.radius) || 0, spatialModel: district.spatialModel || 'legacy-sanctum' });
}

export function projectEonCityW689TransportDestination(district = {}) {
  const projected = getEonCityW689ProductDistrict(district?.id) || district;
  if (!projected?.id) return projectEonCityW688TransportDestination(district);
  const arrival = projected.id === 'orientation-hall' ? getEonCityW674OrientationDistrictArrival() : projected.arrival;
  return freeze({
    id: projected.id,
    label: projected.label,
    x: Number(arrival?.x) || 0,
    z: Number(arrival?.z) || 0,
    heading: Number(arrival?.heading) || 0,
    signatureLandmarkId: projected.signatureLandmarkId,
    activeAssetGroupId: projected.activeAssetGroupId,
    spatialModel: projected.spatialModel || 'legacy-sanctum'
  });
}

export function resolveEonCityW689TerminalPlacement({ districtId = '', terminalId = '', legacyLocalPosition = {} } = {}) {
  const id = String(districtId || '').trim().toLowerCase();
  const district = getEonCityW689ProductDistrict(id);
  if (!district) return resolveEonCityW688TerminalPlacement({ districtId, terminalId, legacyLocalPosition });
  const orientation = id === 'orientation-hall' ? getEonCityW674OrientationTerminalPosition(terminalId) : null;
  const plan = ALL_NON_ORIENTATION_IDS.includes(id) ? buildEonCityW689DistrictBeltPlan(id) : null;
  const beltTerminal = plan?.terminals?.find((entry) => entry.id === String(terminalId || '').trim())?.position || null;
  const position = orientation || beltTerminal || freeze({
    x: district.center.x + (Number(legacyLocalPosition?.x) || 0),
    y: Number(legacyLocalPosition?.y) || 0,
    z: district.center.z + (Number(legacyLocalPosition?.z) || 0)
  });
  return freeze({
    districtId: district.id,
    position: freeze({ ...position }),
    localPosition: freeze({ x: position.x - district.center.x, y: Number(position.y) || 0, z: position.z - district.center.z }),
    spatialModel: district.spatialModel || 'legacy-sanctum'
  });
}

export function validateEonCityW689AllDistrictBelts(entries = EON_CITY_W689_PRODUCT_DISTRICTS) {
  const errors = [];
  if (!Array.isArray(entries) || entries.length !== 9 || new Set(entries.map((entry) => entry.id)).size !== 9) errors.push('nine-districts-required');
  for (const district of entries || []) {
    if (district.spatialModel !== 'sanctum-plus-belt' || district.radius < 14) errors.push(`belt-not-active:${district.id}`);
    if (district.id === 'orientation-hall') continue;
    const plan = buildEonCityW689DistrictBeltPlan(district.id);
    if (!plan || plan.buildings?.length < 2 || plan.terminals?.length < 2 || plan.workLoops?.length < 2 || plan.residents?.length < 3 || !plan.station?.boardingRequiresReview || plan.station?.automaticTravel || !plan.expanseGate?.reviewFirst || plan.expanseGate?.automaticEntry) errors.push(`plan-invalid:${district.id}`);
    if (!plan?.identity?.silhouette || !plan.identity?.streetFamily || !plan.identity?.populationFamily) errors.push(`identity-invalid:${district.id}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtCount: entries?.length || 0, productiveBeltCount: (entries || []).filter((entry) => entry.spatialModel === 'sanctum-plus-belt').length });
}

export function getEonCityW689AllDistrictBeltsTruth() {
  return freeze({
    schema: EON_CITY_W689_ALL_DISTRICT_BELTS_SCHEMA,
    allNineDistrictBeltsActive: true,
    allSanctumsPreserved: true,
    allDistrictsHaveFunctionalBuildings: true,
    allDistrictsHaveReviewedWorkLoops: true,
    allDistrictsHaveStationsAndDocks: true,
    distinctIdentityGrammarRequired: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W689_ALL_DISTRICT_BELTS_SCHEMA,
  EON_CITY_W689_PRODUCT_DISTRICTS,
  getEonCityW689SupportedDistricts,
  buildEonCityW689DistrictBeltPlan,
  getEonCityW689ProductDistrict,
  resolveEonCityW689DistrictAtPosition,
  getEonCityW689DistrictWorldPose,
  projectEonCityW689TransportDestination,
  resolveEonCityW689TerminalPlacement,
  validateEonCityW689AllDistrictBelts,
  getEonCityW689AllDistrictBeltsTruth
});
