/**
 * W690 — complete Core transit, streets, population and functional identity.
 *
 * Reconciles the nine District Belts into one deterministic public-safe Core
 * authority. Every district retains a productive Sanctum, a visible Belt,
 * distinct identity grammar, reviewed terminals, residents, street activity,
 * transit station, EONBOT dock and Expanse threshold. This module performs no
 * navigation, route opening, work execution, approval, payment or data read.
 */

import { buildEonCityW674OrientationDistrictBeltPlan } from '../w674/eon-city-w674-orientation-district-belt.js';
import {
  EON_CITY_W689_PRODUCT_DISTRICTS,
  buildEonCityW689DistrictBeltPlan,
  validateEonCityW689AllDistrictBelts
} from '../w689/eon-city-w689-all-district-belts.js';

export const EON_CITY_W690_COMPLETE_CORE_IDENTITY_SCHEMA = 'eon.city.complete-core-identity.w690.v1';
const freeze = (value) => Object.freeze(value);
const point = (x = 0, y = 0, z = 0) => freeze({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });
const QUALITY = freeze({
  lite: freeze({ visibleAmbientPerDistrict: 2, streetActivityPerLink: 0, capsuleCount: 1, lampSpacing: 5.2, motionEnabled: false }),
  balanced: freeze({ visibleAmbientPerDistrict: 4, streetActivityPerLink: 1, capsuleCount: 2, lampSpacing: 3.6, motionEnabled: true }),
  cinematic: freeze({ visibleAmbientPerDistrict: 7, streetActivityPerLink: 2, capsuleCount: 3, lampSpacing: 2.7, motionEnabled: true })
});

export const EON_CITY_W690_TRANSIT_ORDER = freeze([
  'transit-network', 'orientation-hall', 'archive-canopy', 'vault-station', 'agent-theatre',
  'forge-basilica', 'command-centre', 'creator-atrium', 'trade-dome'
]);

const ARTERIAL_PAIRS = freeze([
  freeze(['orientation-hall', 'trade-dome']),
  freeze(['orientation-hall', 'vault-station']),
  freeze(['orientation-hall', 'transit-network']),
  freeze(['transit-network', 'agent-theatre']),
  freeze(['transit-network', 'creator-atrium']),
  freeze(['transit-network', 'forge-basilica']),
  freeze(['agent-theatre', 'command-centre']),
  freeze(['agent-theatre', 'vault-station']),
  freeze(['archive-canopy', 'trade-dome']),
  freeze(['archive-canopy', 'vault-station']),
  freeze(['vault-station', 'forge-basilica']),
  freeze(['creator-atrium', 'command-centre']),
  freeze(['forge-basilica', 'command-centre']),
  freeze(['trade-dome', 'creator-atrium'])
]);

const ORIENTATION_IDENTITY = freeze({
  silhouette: 'arrival gateway, guide spires and open Expanse threshold',
  streetFamily: 'orientation-axis-and-learning-courts',
  populationFamily: 'guides-creators-specialists-citizens',
  accentRole: 'orientation-cyan-gold'
});

const DISTRICT_ACTIVITY = freeze({
  'orientation-hall': freeze(['welcome', 'device-guidance', 'mission-review', 'expanse-orientation']),
  'transit-network': freeze(['route-review', 'capsule-dispatch', 'accessibility-guidance', 'platform-inspection']),
  'agent-theatre': freeze(['proposal-review', 'receipt-verification', 'operator-guidance', 'approval-waiting']),
  'creator-atrium': freeze(['project-continuation', 'capture-review', 'sharing-review', 'media-preparation']),
  'forge-basilica': freeze(['build-review', 'debug-inspection', 'device-guidance', 'validation-review']),
  'command-centre': freeze(['city-status', 'operations-review', 'attention-triage', 'horizon-watch']),
  'archive-canopy': freeze(['library-search', 'research-review', 'indexing', 'knowledge-navigation']),
  'vault-station': freeze(['recovery-review', 'backup-guidance', 'custody-boundary', 'reveal-review']),
  'trade-dome': freeze(['membership-review', 'referral-status', 'eonkey-guidance', 'plan-comparison'])
});

function normalizeQuality(value = 'balanced') {
  return Object.hasOwn(QUALITY, String(value)) ? String(value) : 'balanced';
}

function orientationPlan(options = {}) {
  const plan = buildEonCityW674OrientationDistrictBeltPlan(options);
  return freeze({
    districtId: plan.districtId,
    districtLabel: plan.districtLabel,
    center: plan.center,
    arrival: plan.station.position,
    sanctum: plan.sanctum,
    beltRadius: plan.beltRadius,
    streets: plan.streets,
    publicSpaces: freeze(Object.values(plan.publicSpaces)),
    buildings: plan.buildings,
    terminals: plan.terminals,
    residents: plan.residents,
    ambientPopulation: plan.ambientPopulation,
    station: plan.station,
    eonbotDock: plan.eonbotDock,
    expanseGate: plan.expanseGate,
    workLoops: freeze(plan.terminals.map((terminal) => freeze({ id: `orientation-loop:${terminal.id}`, terminalId: terminal.id, label: terminal.label, reviewRequired: true }))),
    discoveries: freeze([
      freeze({ id: 'orientation-discovery-atlas-table', label: 'Physical Atlas Table', kind: 'equipment', position: plan.publicSpaces.workCommons.position, reviewFirst: true }),
      freeze({ id: 'orientation-discovery-expanse-gate', label: 'The Expanse Gateway', kind: 'landmark', position: plan.expanseGate.position, reviewFirst: true }),
      freeze({ id: 'orientation-discovery-guide-spire', label: 'Guide Spire', kind: 'landmark', position: plan.center, reviewFirst: true })
    ]),
    identity: ORIENTATION_IDENTITY,
    completeProductiveBelt: true
  });
}

function districtPlan(districtId = '', options = {}) {
  return districtId === 'orientation-hall' ? orientationPlan(options) : buildEonCityW689DistrictBeltPlan(districtId, options);
}

function stationPoint(plan) {
  const position = plan?.station?.position || plan?.arrival || plan?.center || {};
  return point(position.x, Number(position.y) || 0, position.z);
}

function connection(fromPlan, toPlan, kind, index) {
  if (!fromPlan || !toPlan) return null;
  const from = stationPoint(fromPlan);
  const to = stationPoint(toPlan);
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  return freeze({
    id: `w690:${kind}:${fromPlan.districtId}:${toPlan.districtId}`,
    index,
    kind,
    hierarchy: kind === 'transit-loop' ? 'core-transit-arterial' : 'district-connector',
    fromId: fromPlan.districtId,
    toId: toPlan.districtId,
    from,
    to,
    length: Number(length.toFixed(2)),
    width: kind === 'transit-loop' ? 1.4 : 0.72,
    pedestrianSafe: true,
    capsuleCompatible: kind === 'transit-loop',
    publicSafe: true,
    automaticNavigation: false
  });
}

function buildAmbientActors(plan, profile, districtIndex) {
  const roles = String(plan.identity?.populationFamily || 'citizens-guides').split('-').filter(Boolean);
  const activities = DISTRICT_ACTIVITY[plan.districtId] || freeze(['inspect', 'guide', 'walk']);
  const spaces = plan.publicSpaces?.length ? plan.publicSpaces : freeze([{ position: plan.center }]);
  return freeze(Array.from({ length: profile.visibleAmbientPerDistrict }, (_, index) => {
    const space = spaces[index % spaces.length];
    const angle = districtIndex * 0.73 + index * 1.61;
    const radius = 1.15 + (index % 3) * 0.55;
    return freeze({
      id: `${plan.districtId}:ambient:${index + 1}`,
      districtId: plan.districtId,
      archetype: roles[index % roles.length] || 'citizen',
      activity: activities[index % activities.length],
      anchor: point(Number(space.position?.x || plan.center.x) + Math.cos(angle) * radius, 0, Number(space.position?.z || plan.center.z) + Math.sin(angle) * radius),
      pathRadius: 0.65 + (index % 3) * 0.28,
      phase: Number((districtIndex * 0.71 + index * 1.13).toFixed(3)),
      speed: Number((0.12 + (index % 4) * 0.025).toFixed(3)),
      claimsRealWork: false,
      automaticWork: false,
      publicSafe: true
    });
  }));
}

function buildStreetActivity(connections, profile) {
  if (profile.streetActivityPerLink <= 0) return freeze([]);
  return freeze(connections.flatMap((link, linkIndex) => Array.from({ length: profile.streetActivityPerLink }, (_, index) => freeze({
    id: `${link.id}:activity:${index + 1}`,
    linkId: link.id,
    fromId: link.fromId,
    toId: link.toId,
    progressOffset: Number((((linkIndex * 0.173) + index * 0.37) % 1).toFixed(3)),
    speed: Number((0.012 + (linkIndex % 5) * 0.002 + index * 0.003).toFixed(3)),
    mode: link.kind === 'transit-loop' && index % 2 ? 'service-cart' : 'pedestrian',
    claimsRealWork: false,
    automaticNavigation: false,
    publicSafe: true
  }))));
}

export function buildEonCityW690CompleteCoreIdentityPlan({ quality = 'balanced', mode = 'explore', reducedEffects = false } = {}) {
  const resolvedQuality = normalizeQuality(quality);
  const profile = QUALITY[resolvedQuality];
  const resolvedMode = mode === 'focus' ? 'focus' : 'explore';
  const plans = freeze(EON_CITY_W689_PRODUCT_DISTRICTS.map((district) => districtPlan(district.id, { quality: resolvedQuality, mode: resolvedMode })));
  const planById = new Map(plans.map((plan) => [plan.districtId, plan]));
  const transitConnections = EON_CITY_W690_TRANSIT_ORDER.map((id, index) => connection(planById.get(id), planById.get(EON_CITY_W690_TRANSIT_ORDER[(index + 1) % EON_CITY_W690_TRANSIT_ORDER.length]), 'transit-loop', index));
  const arterialConnections = ARTERIAL_PAIRS.map(([fromId, toId], index) => connection(planById.get(fromId), planById.get(toId), 'district-arterial', index));
  const streetConnections = freeze([...transitConnections, ...arterialConnections].filter(Boolean));
  const districts = freeze(plans.map((plan, districtIndex) => {
    const product = EON_CITY_W689_PRODUCT_DISTRICTS.find((entry) => entry.id === plan.districtId);
    const ambientActors = buildAmbientActors(plan, profile, districtIndex);
    return freeze({
      id: plan.districtId,
      label: plan.districtLabel || product?.label,
      purpose: product?.purpose || '',
      center: point(plan.center.x, 0, plan.center.z),
      radius: Number(plan.beltRadius) || 16,
      spatialModel: 'sanctum-plus-belt',
      palette: freeze({ ...(product?.palette || {}) }),
      signature: product?.signature || '',
      signatureLandmarkId: product?.signatureLandmarkId || '',
      identity: plan.identity,
      sanctum: plan.sanctum,
      station: freeze({ ...plan.station, position: stationPoint(plan), explicitTravelReviewRequired: true, automaticTravel: false }),
      eonbotDock: freeze({ ...plan.eonbotDock, position: point(plan.eonbotDock.position.x, 0, plan.eonbotDock.position.z), explicitDockActionRequired: true, automaticDocking: false }),
      expanseGate: freeze({ ...plan.expanseGate, position: point(plan.expanseGate.position.x, 0, plan.expanseGate.position.z), reviewFirst: true, separateConfirmationRequired: true, automaticEntry: false }),
      streets: freeze([...plan.streets]),
      publicSpaces: freeze([...plan.publicSpaces]),
      buildings: freeze([...plan.buildings]),
      terminals: freeze([...plan.terminals]),
      activeResidents: freeze([...plan.residents]),
      ambientActors,
      workLoops: freeze([...plan.workLoops]),
      discoveries: freeze([...plan.discoveries]),
      functionalIdentity: freeze({
        visibleBuildingCount: plan.buildings.length,
        terminalCount: plan.terminals.length,
        workLoopCount: plan.workLoops.length,
        discoveryCount: plan.discoveries.length,
        activeResidentCount: plan.residents.length,
        visibleAmbientCount: ambientActors.length,
        distinctSilhouette: plan.identity?.silhouette || '',
        distinctStreetFamily: plan.identity?.streetFamily || ''
      }),
      privateContentStored: false,
      automaticWork: false,
      automaticNavigation: false
    });
  }));
  const stations = freeze(EON_CITY_W690_TRANSIT_ORDER.map((id, index) => {
    const district = districts.find((entry) => entry.id === id);
    return freeze({
      id: district.station.id || `core-station:${id}`,
      districtId: id,
      label: district.station.label || `${district.label} Station`,
      index,
      x: district.station.position.x,
      y: Number(district.station.position.y) || 0,
      z: district.station.position.z,
      visible: true,
      capsuleCompatible: true,
      explicitTravelReviewRequired: true,
      automaticTravel: false
    });
  }));
  const transitPath = freeze([...stations.map((entry) => freeze({ x: entry.x, z: entry.z, districtId: entry.districtId })), freeze({ x: stations[0].x, z: stations[0].z, districtId: stations[0].districtId })]);
  const streetActivity = buildStreetActivity(streetConnections, profile);
  return freeze({
    schema: EON_CITY_W690_COMPLETE_CORE_IDENTITY_SCHEMA,
    quality: resolvedQuality,
    mode: resolvedMode,
    reducedEffects: Boolean(reducedEffects),
    motionEnabled: !reducedEffects && profile.motionEnabled && resolvedMode === 'explore',
    districts,
    streetConnections,
    transitLoop: freeze({
      id: 'eoncity-complete-core-loop',
      label: 'EONCITY Complete Core Loop',
      order: EON_CITY_W690_TRANSIT_ORDER,
      stations,
      path: transitPath,
      closed: true,
      capsuleCount: profile.capsuleCount,
      visible: true,
      explicitReviewRequired: true,
      automaticTravel: false
    }),
    streetActivity,
    visibleAmbientPopulation: districts.reduce((total, district) => total + district.ambientActors.length, 0),
    activeResidentAnchors: districts.reduce((total, district) => total + district.activeResidents.length, 0),
    functionalBuildingCount: districts.reduce((total, district) => total + district.buildings.length, 0),
    terminalCount: districts.reduce((total, district) => total + district.terminals.length, 0),
    discoveryCount: districts.reduce((total, district) => total + district.discoveries.length, 0),
    lampSpacing: profile.lampSpacing,
    completeCoreIdentity: true,
    allNineBeltsVisible: true,
    focusModeDirectAccess: true,
    exploreModePhysicalContinuity: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    deterministic: true,
    localOnly: true
  });
}

export function validateEonCityW690CompleteCoreIdentityPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W690_COMPLETE_CORE_IDENTITY_SCHEMA) errors.push('schema-invalid');
  const beltValidation = validateEonCityW689AllDistrictBelts(EON_CITY_W689_PRODUCT_DISTRICTS);
  if (!beltValidation.ok) errors.push(...beltValidation.errors.map((entry) => `belt:${entry}`));
  if (!Array.isArray(plan.districts) || plan.districts.length !== 9 || new Set(plan.districts.map((entry) => entry.id)).size !== 9) errors.push('nine-districts-required');
  const silhouettes = new Set();
  const streetFamilies = new Set();
  for (const district of plan.districts || []) {
    if (district.spatialModel !== 'sanctum-plus-belt' || !district.sanctum?.preserved) errors.push(`belt:${district.id}`);
    if (district.buildings?.length < 2 || district.terminals?.length < 2 || district.workLoops?.length < 2 || district.discoveries?.length < 3) errors.push(`functional-identity:${district.id}`);
    if (district.activeResidents?.length < 3 || district.ambientActors?.length < 2) errors.push(`population:${district.id}`);
    if (!district.station?.explicitTravelReviewRequired || district.station?.automaticTravel) errors.push(`station:${district.id}`);
    if (!district.eonbotDock?.explicitDockActionRequired || district.eonbotDock?.automaticDocking) errors.push(`dock:${district.id}`);
    if (!district.expanseGate?.reviewFirst || !district.expanseGate?.separateConfirmationRequired || district.expanseGate?.automaticEntry) errors.push(`expanse:${district.id}`);
    if (!district.identity?.silhouette || !district.identity?.streetFamily || !district.identity?.populationFamily) errors.push(`identity:${district.id}`);
    silhouettes.add(district.identity?.silhouette);
    streetFamilies.add(district.identity?.streetFamily);
  }
  if (silhouettes.size !== 9 || streetFamilies.size !== 9) errors.push('district-repetition-too-high');
  if (!plan.transitLoop?.closed || plan.transitLoop?.stations?.length !== 9 || plan.transitLoop?.path?.length !== 10) errors.push('transit-loop-invalid');
  if (!Array.isArray(plan.streetConnections) || plan.streetConnections.length < 20) errors.push('street-continuity-incomplete');
  const ids = new Set((plan.districts || []).map((entry) => entry.id));
  const adjacency = new Map([...ids].map((id) => [id, new Set()]));
  for (const link of plan.streetConnections || []) {
    if (ids.has(link.fromId) && ids.has(link.toId)) {
      adjacency.get(link.fromId).add(link.toId);
      adjacency.get(link.toId).add(link.fromId);
    }
  }
  const first = [...ids][0];
  const seen = new Set(first ? [first] : []);
  const queue = first ? [first] : [];
  while (queue.length) for (const next of adjacency.get(queue.shift()) || []) if (!seen.has(next)) { seen.add(next); queue.push(next); }
  if (seen.size !== 9) errors.push('street-graph-disconnected');
  if (!plan.completeCoreIdentity || !plan.allNineBeltsVisible || !plan.focusModeDirectAccess || !plan.exploreModePhysicalContinuity) errors.push('product-mode-incomplete');
  if (plan.secondCanvasCreated || plan.secondRenderLoopCreated || plan.automaticNavigation || plan.automaticExecution || plan.privateDataRead || plan.privateContentStored || plan.networkRequestCreated || plan.rewardIssued || plan.paymentClaimed) errors.push('truth-boundary-invalid');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    districtCount: plan.districts?.length || 0,
    connectionCount: plan.streetConnections?.length || 0,
    stationCount: plan.transitLoop?.stations?.length || 0,
    visibleAmbientPopulation: plan.visibleAmbientPopulation || 0,
    activeResidentAnchors: plan.activeResidentAnchors || 0,
    functionalBuildingCount: plan.functionalBuildingCount || 0,
    terminalCount: plan.terminalCount || 0,
    discoveryCount: plan.discoveryCount || 0
  });
}

export function getEonCityW690DistrictIdentity(districtId = '', plan = null) {
  const resolvedPlan = plan || buildEonCityW690CompleteCoreIdentityPlan();
  return resolvedPlan.districts.find((entry) => entry.id === String(districtId || '').trim().toLowerCase()) || null;
}

export function getEonCityW690CompleteCoreTruth() {
  return freeze({
    schema: EON_CITY_W690_COMPLETE_CORE_IDENTITY_SCHEMA,
    nineDistinctProductiveDistricts: true,
    closedReviewedTransitLoop: true,
    connectedLivingStreetGraph: true,
    visibleBoundedPopulation: true,
    discoveriesRemainReviewFirst: true,
    oneCanonicalScene: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W690_COMPLETE_CORE_IDENTITY_SCHEMA,
  EON_CITY_W690_TRANSIT_ORDER,
  buildEonCityW690CompleteCoreIdentityPlan,
  validateEonCityW690CompleteCoreIdentityPlan,
  getEonCityW690DistrictIdentity,
  getEonCityW690CompleteCoreTruth
});
