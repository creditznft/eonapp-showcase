/**
 * W674 — first rendered C3 District Belt vertical slice.
 *
 * Orientation Hall remains the productive Sanctum while this pure authority
 * adds a real arrival plaza, three functional secondary buildings, a transit
 * station, EONBOT dock, bounded resident cast, street furniture and one
 * explicit Expanse threshold. It owns no Babylon scene, storage, route change,
 * AI execution, voice capture, payment, reward or private project content.
 */

import { buildEonCityW673HybridMetropolisPlan } from '../w673/eon-city-w673-hybrid-metropolis-plan.js';
import { EON_CITY_W676_ORIENTATION_RESIDENT_CAST } from '../w676/eon-city-w676-orientation-resident-coherence.js';

export const EON_CITY_W674_ORIENTATION_BELT_SCHEMA = 'eon.city.orientation-district-belt.w674.v1';
export const EON_CITY_W674_ORIENTATION_DISTRICT_ID = 'orientation-hall';

const freeze = (value) => Object.freeze(value);
const QUALITY = freeze({
  lite: freeze({ residentCount: 3, ambientCount: 8, lampCount: 10, treeCount: 4, benchCount: 3, windowRows: 2 }),
  balanced: freeze({ residentCount: 5, ambientCount: 18, lampCount: 16, treeCount: 8, benchCount: 5, windowRows: 3 }),
  cinematic: freeze({ residentCount: 6, ambientCount: 30, lampCount: 22, treeCount: 12, benchCount: 7, windowRows: 4 })
});

const CAST = EON_CITY_W676_ORIENTATION_RESIDENT_CAST;

const BUILDING_FUNCTIONS = freeze({
  'Guide Academy': freeze({ kind: 'academy', route: '/help', verbs: freeze(['Learn', 'Ask EONBOT', 'Open guide']) }),
  'Device Clinic': freeze({ kind: 'device-clinic', route: '/local-ai', verbs: freeze(['Inspect device', 'Open Local AI', 'Review setup']) }),
  'Mission Commons': freeze({ kind: 'mission-commons', route: '/projects', verbs: freeze(['Review missions', 'Open Projects', 'Continue work']) }),
  'Arrival Gallery': freeze({ kind: 'arrival-gallery', route: '/about', verbs: freeze(['Explore EONAPP', 'Open Atlas', 'Meet EONBOT']) })
});

function point(source = {}) {
  return freeze({ x: Number(source?.x) || 0, y: Number(source?.y) || 0, z: Number(source?.z) || 0 });
}
function offset(center, x = 0, z = 0, y = 0) {
  return point({ x: center.x + x, y, z: center.z + z });
}
function profile(value = 'balanced') { return QUALITY[String(value)] || QUALITY.balanced; }

function buildingFrom(source, center, index, qualityProfile) {
  const authority = BUILDING_FUNCTIONS[source.label] || BUILDING_FUNCTIONS['Arrival Gallery'];
  const width = 5.8 + (index % 2) * 1.4;
  const depth = 4.8 + ((index + 1) % 2) * 1.2;
  const floors = Math.max(2, Number(source.floors) || 2);
  return freeze({
    ...source,
    kind: authority.kind,
    route: authority.route,
    verbs: authority.verbs,
    position: point(source.position),
    dimensions: freeze({ width, depth, floorHeight: 2.6, floors, totalHeight: Number((floors * 2.6).toFixed(2)) }),
    windowRows: qualityProfile.windowRows,
    entrancePosition: offset(point(source.position), 0, -depth / 2 - 0.15),
    reviewFirst: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateContentStored: false,
    centreDistance: Number(Math.hypot(source.position.x - center.x, source.position.z - center.z).toFixed(2))
  });
}

export function buildEonCityW674OrientationDistrictBeltPlan({ quality = 'balanced', mode = 'explore' } = {}) {
  const resolvedQuality = Object.hasOwn(QUALITY, String(quality)) ? String(quality) : 'balanced';
  const qualityProfile = profile(resolvedQuality);
  const metropolis = buildEonCityW673HybridMetropolisPlan({ quality: resolvedQuality, mode });
  const district = metropolis.districts.find((entry) => entry.id === EON_CITY_W674_ORIENTATION_DISTRICT_ID);
  if (!district) throw new Error('w674-orientation-district-authority-missing');
  const center = point(district.metropolisCenter);
  const belt = district.belt;
  const buildings = freeze(belt.secondaryBuildings.map((entry, index) => buildingFrom(entry, center, index, qualityProfile)));
  const residents = freeze(CAST.slice(0, qualityProfile.residentCount).map((entry, index) => freeze({
    ...entry,
    anchor: point(belt.activeNpcAnchors[index]?.position || offset(center, index - 2, 2)),
    explicitInteraction: true,
    fallbackSilhouette: true,
    claimsRealWork: false,
    automaticWork: false,
    automaticNavigation: false
  })));
  const terminalPositions = freeze([
    freeze({ id: 'start-here-terminal', label: 'Start Here Terminal', position: offset(center, -2.4, -1.8), route: '/help' }),
    freeze({ id: 'device-guidance-terminal', label: 'Device Guidance Terminal', position: offset(center, 2.4, -1.8), route: '/local-ai' }),
    freeze({ id: 'missions-rewards-terminal', label: 'Missions & Rewards Terminal', position: offset(center, 0, 3.2), route: '/projects' })
  ].map((entry) => freeze({ ...entry, reviewFirst: true, automaticNavigation: false, automaticExecution: false })));
  const station = freeze({
    ...belt.transitStation,
    position: point(belt.transitStation.position),
    platformRadius: 3.3,
    capsuleAssetPreference: 'eoncity-transit-core',
    capsuleFallback: 'bounded-procedural-capsule',
    boardingRequiresReview: true,
    skipRideAvailable: true,
    automaticTravel: false
  });
  const expanseGate = freeze({
    ...belt.expanseGate,
    position: point(belt.expanseGate.position),
    inspectRadius: 8.5,
    enterRadius: 2.4,
    entryReadyRadius: 8.5,
    discoveryRadius: 24,
    reviewFirst: true,
    separateConfirmationRequired: true,
    automaticEntry: false
  });
  const arrivalPlaza = belt.publicSpaces.find((entry) => entry.kind === 'arrival-plaza') || belt.publicSpaces[0];
  const workCommons = belt.publicSpaces.find((entry) => entry.kind === 'public-work-area') || belt.publicSpaces[1];
  const quietCourt = belt.publicSpaces.find((entry) => entry.kind === 'rest-and-orientation') || belt.publicSpaces[2];
  return freeze({
    schema: EON_CITY_W674_ORIENTATION_BELT_SCHEMA,
    quality: resolvedQuality,
    mode: mode === 'focus' ? 'focus' : 'explore',
    districtId: district.id,
    districtLabel: district.label,
    districtPurpose: district.purpose,
    center,
    sanctum: freeze({ ...district.sanctum, center: point(district.sanctum.center), productiveTerminalIds: freeze([...district.sanctum.productiveTerminalIds]) }),
    beltRadius: belt.radius,
    streets: freeze(belt.streets.map((entry) => freeze({ ...entry, from: point(entry.from), to: point(entry.to), pedestrianSafe: true, automaticNavigation: false }))),
    publicSpaces: freeze({
      arrivalPlaza: freeze({ ...arrivalPlaza, position: point(arrivalPlaza.position) }),
      workCommons: freeze({ ...workCommons, position: point(workCommons.position) }),
      quietCourt: freeze({ ...quietCourt, position: point(quietCourt.position) })
    }),
    buildings,
    terminals: terminalPositions,
    residents,
    ambientPopulation: qualityProfile.ambientCount,
    streetFurniture: freeze({ lampCount: qualityProfile.lampCount, treeCount: qualityProfile.treeCount, benchCount: qualityProfile.benchCount }),
    station,
    eonbotDock: freeze({ ...belt.eonbotDock, position: point(belt.eonbotDock.position), explicitCallRequired: true, automaticDocking: false }),
    expanseGate,
    skyline: freeze([...belt.distinctSkyline]),
    visualNoiseBudget: freeze({ dominantMotion: 1, secondaryMotion: 2, ambientPeripheralOnly: true, genericOrbitClutterForbidden: true }),
    focusModeDirectTerminalAccess: true,
    exploreModeFreeMovement: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false
  });
}

const DEFAULT_ORIENTATION_BELT_PLAN = buildEonCityW674OrientationDistrictBeltPlan({ quality: 'balanced', mode: 'explore' });

export function getEonCityW674OrientationDistrictArrival() {
  const plaza = DEFAULT_ORIENTATION_BELT_PLAN.publicSpaces.arrivalPlaza.position;
  return freeze({
    districtId: EON_CITY_W674_ORIENTATION_DISTRICT_ID,
    x: plaza.x,
    y: 0,
    z: plaza.z,
    heading: Math.PI,
    source: 'w674-orientation-district-belt'
  });
}

export function resolveEonCityW674OrientationDistrictBeltAtPosition(position = {}, { padding = 1.4 } = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const distance = Math.hypot(x - DEFAULT_ORIENTATION_BELT_PLAN.center.x, z - DEFAULT_ORIENTATION_BELT_PLAN.center.z);
  const radius = DEFAULT_ORIENTATION_BELT_PLAN.beltRadius + Math.max(0, Math.min(8, Number(padding) || 0));
  if (distance > radius) return null;
  return freeze({
    districtId: EON_CITY_W674_ORIENTATION_DISTRICT_ID,
    label: DEFAULT_ORIENTATION_BELT_PLAN.districtLabel,
    center: DEFAULT_ORIENTATION_BELT_PLAN.center,
    distance: Number(distance.toFixed(2)),
    radius,
    insideSanctum: distance <= Math.max(5.4, Number(DEFAULT_ORIENTATION_BELT_PLAN.sanctum.radius) || 5.4),
    insideBelt: true
  });
}

export function projectEonCityW674AtlasDistricts(districts = []) {
  return freeze((Array.isArray(districts) ? districts : []).map((district) => {
    if (district?.id !== EON_CITY_W674_ORIENTATION_DISTRICT_ID) return district;
    return freeze({
      ...district,
      center: DEFAULT_ORIENTATION_BELT_PLAN.center,
      arrival: freeze({ ...getEonCityW674OrientationDistrictArrival() }),
      radius: DEFAULT_ORIENTATION_BELT_PLAN.beltRadius,
      spatialModel: 'sanctum-plus-belt'
    });
  }));
}

export function getEonCityW674OrientationTerminalPosition(terminalId = '') {
  const terminal = DEFAULT_ORIENTATION_BELT_PLAN.terminals.find((entry) => entry.id === String(terminalId || ''));
  return terminal ? freeze({ ...terminal.position }) : null;
}

export function validateEonCityW674OrientationDistrictBeltPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W674_ORIENTATION_BELT_SCHEMA) errors.push('schema-invalid');
  if (plan.districtId !== EON_CITY_W674_ORIENTATION_DISTRICT_ID) errors.push('orientation-authority-required');
  if (!plan.sanctum?.preserved || plan.sanctum?.productiveTerminalIds?.length !== 3) errors.push('productive-sanctum-required');
  if (!Array.isArray(plan.streets) || plan.streets.length < 3) errors.push('street-network-required');
  if (!Array.isArray(plan.buildings) || plan.buildings.length < 2 || plan.buildings.some((entry) => !entry.functional || !entry.route || entry.automaticExecution)) errors.push('functional-buildings-required');
  if (!Array.isArray(plan.terminals) || plan.terminals.length !== 3 || plan.terminals.some((entry) => !entry.reviewFirst || entry.automaticNavigation)) errors.push('terminal-contract-invalid');
  if (!Array.isArray(plan.residents) || plan.residents.length < 3 || plan.residents.length > 6 || plan.residents.some((entry) => entry.claimsRealWork || entry.automaticWork)) errors.push('bounded-resident-cast-invalid');
  if (!plan.station?.capsuleCompatible || !plan.station?.boardingRequiresReview || plan.station?.automaticTravel) errors.push('reviewed-transit-required');
  if (!plan.expanseGate?.reviewFirst || !plan.expanseGate?.separateConfirmationRequired || plan.expanseGate?.automaticEntry) errors.push('reviewed-expanse-gate-required');
  if (plan.visualNoiseBudget?.dominantMotion !== 1 || !plan.visualNoiseBudget?.genericOrbitClutterForbidden) errors.push('visual-noise-budget-invalid');
  if (!plan.oneCanonicalScene || plan.secondCanvasCreated || plan.secondRenderLoopCreated || plan.automaticNavigation || plan.automaticExecution || plan.privateDataRead || plan.privateContentStored || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), buildingCount: plan.buildings?.length || 0, residentCount: plan.residents?.length || 0, terminalCount: plan.terminals?.length || 0 });
}

export function getEonCityW674OrientationDistrictBeltTruth() {
  return freeze({
    schema: EON_CITY_W674_ORIENTATION_BELT_SCHEMA,
    currentRoomPreservedAsSanctum: true,
    realDistrictBeltRenderedNext: true,
    purposefulArchitectureRequired: true,
    visibleResidentPopulationRequired: true,
    transitCapsuleStationRequired: true,
    eonbotDockRequired: true,
    physicalExpanseGatewayRequired: true,
    atlasCompatible: true,
    focusExploreParity: true,
    decorativeGeometrySubordinateToFunction: true,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export default freeze({
  EON_CITY_W674_ORIENTATION_BELT_SCHEMA,
  EON_CITY_W674_ORIENTATION_DISTRICT_ID,
  buildEonCityW674OrientationDistrictBeltPlan,
  validateEonCityW674OrientationDistrictBeltPlan,
  getEonCityW674OrientationDistrictArrival,
  resolveEonCityW674OrientationDistrictBeltAtPosition,
  projectEonCityW674AtlasDistricts,
  getEonCityW674OrientationTerminalPosition,
  getEonCityW674OrientationDistrictBeltTruth
});
