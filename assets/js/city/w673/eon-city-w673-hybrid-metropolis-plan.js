/**
 * W673 — approved C3 Living Hybrid Metropolis plan.
 *
 * The current authored rooms become District Sanctums. This pure authority
 * defines the larger District Belts, transit stations, purposeful population,
 * Expanse gates and scaled metropolis coordinates that the existing Babylon
 * scene will render in later local slices. No scene, storage, network, AI task,
 * travel or private project mutation is owned here.
 */

import { EON_CITY_W660I_DISTRICTS } from '../w660i/eon-city-w660i-district-config.js';

export const EON_CITY_W673_HYBRID_METROPOLIS_SCHEMA = 'eon.city.hybrid-metropolis.w673.v1';
export const EON_CITY_W673_CORE_SCALE = 6.25;
export const EON_CITY_W673_DISTRICT_BELT_RADIUS = 16;

const freeze = (value) => Object.freeze(value);
const QUALITY = freeze({
  lite: freeze({ activeNpcCount: 3, ambientPopulation: 10, secondaryBuildingCount: 2, streetFurnitureCount: 8 }),
  balanced: freeze({ activeNpcCount: 5, ambientPopulation: 22, secondaryBuildingCount: 3, streetFurnitureCount: 14 }),
  cinematic: freeze({ activeNpcCount: 6, ambientPopulation: 38, secondaryBuildingCount: 4, streetFurnitureCount: 20 })
});

const DISTRICT_ROLES = freeze({
  'orientation-hall': freeze(['Guide Academy', 'Device Clinic', 'Mission Commons', 'Arrival Gallery']),
  'transit-network': freeze(['Capsule Depot', 'Route Control', 'Passenger Concourse', 'Mobility Lab']),
  'agent-theatre': freeze(['Proposal Studio', 'Receipt Archive', 'Review Chamber', 'Operator Lounge']),
  'creator-atrium': freeze(['Project Studio', 'Capture Gallery', 'Sharing Salon', 'Media Workshop']),
  'forge-basilica': freeze(['Build Foundry', 'Debug Lab', 'Device Workshop', 'Validation Annex']),
  'command-centre': freeze(['Operations Hall', 'System Observatory', 'Review Command', 'City Coordination']),
  'archive-canopy': freeze(['Research Library', 'Index Garden', 'Knowledge Studio', 'Archive Walk']),
  'vault-station': freeze(['Recovery Office', 'Custody Hall', 'Backup Clinic', 'Reveal Chamber']),
  'trade-dome': freeze(['Membership House', 'Referral Desk', 'EONKEY Gallery', 'Plan Commons'])
});

function qualityProfile(value = 'balanced') { return QUALITY[String(value)] || QUALITY.balanced; }
function point(x = 0, z = 0, y = 0) { return freeze({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 }); }
function offset(center, x, z, y = 0) { return point(center.x + x, center.z + z, y); }

function districtPlan(district, index, profile) {
  const center = point(district.center.x * EON_CITY_W673_CORE_SCALE, district.center.z * EON_CITY_W673_CORE_SCALE);
  const angle = Math.atan2(center.x, center.z);
  const outward = point(Math.sin(angle || 0), Math.cos(angle || 0));
  const station = offset(center, -outward.x * 9.2, -outward.z * 9.2);
  const expanseGate = offset(center, outward.x * 14.2, outward.z * 14.2);
  const roles = DISTRICT_ROLES[district.id] || freeze(['District Studio', 'Public Commons', 'Service Annex', 'Local Gallery']);
  const secondaryBuildings = freeze(roles.slice(0, profile.secondaryBuildingCount).map((label, buildingIndex) => {
    const theta = angle + Math.PI * 0.55 + buildingIndex * (Math.PI * 2 / Math.max(3, profile.secondaryBuildingCount));
    const radius = 8.4 + (buildingIndex % 2) * 2.1;
    return freeze({
      id: `${district.id}:building:${buildingIndex + 1}`,
      label,
      position: offset(center, Math.sin(theta) * radius, Math.cos(theta) * radius),
      floors: 2 + (buildingIndex % 3),
      functional: true,
      enterableLobby: true,
      privateContentStored: false
    });
  }));
  const npcRoles = freeze(['district-specialist', 'route-guide', 'terminal-operator', 'maintenance-specialist', 'public-guide', 'project-liaison']);
  const activeNpcAnchors = freeze(npcRoles.slice(0, profile.activeNpcCount).map((role, npcIndex) => {
    const theta = angle + npcIndex * 1.17;
    const radius = 4.8 + (npcIndex % 2) * 2.2;
    return freeze({
      id: `${district.id}:npc:${npcIndex + 1}`, role,
      position: offset(center, Math.sin(theta) * radius, Math.cos(theta) * radius),
      animationSchedule: freeze(['idle', 'navigate', 'work', 'talk', 'point']),
      explicitInteraction: true,
      automaticWork: false,
      automaticNavigation: false
    });
  }));
  const publicSpaces = freeze([
    freeze({ id: `${district.id}:arrival-plaza`, label: `${district.label} Arrival Plaza`, kind: 'arrival-plaza', position: offset(center, 0, -6.8), productive: true }),
    freeze({ id: `${district.id}:work-commons`, label: `${district.label} Work Commons`, kind: 'public-work-area', position: offset(center, -6.2, 2.5), productive: true }),
    freeze({ id: `${district.id}:quiet-court`, label: `${district.label} Quiet Court`, kind: 'rest-and-orientation', position: offset(center, 6.1, 2.8), productive: false })
  ]);
  const streets = freeze([
    freeze({ id: `${district.id}:street:spine`, kind: 'district-spine', from: offset(center, 0, -14.5), to: offset(center, 0, 14.5), width: 2.2 }),
    freeze({ id: `${district.id}:street:cross`, kind: 'district-cross', from: offset(center, -14.5, 0), to: offset(center, 14.5, 0), width: 1.8 }),
    freeze({ id: `${district.id}:street:promenade`, kind: 'pedestrian-promenade', from: station, to: offset(center, 0, -3.8), width: 1.2 })
  ]);
  return freeze({
    id: district.id,
    label: district.label,
    purpose: district.purpose,
    metropolisCenter: center,
    sanctum: freeze({
      id: `${district.id}:sanctum`, label: `${district.label} Sanctum`, center,
      sourceLandmarkId: district.signatureLandmarkId, sourceAssetGroupId: district.activeAssetGroupId,
      radius: Math.max(5.4, Number(district.radius) || 5.4), productiveTerminalIds: freeze([...district.terminals]), preserved: true
    }),
    belt: freeze({
      id: `${district.id}:belt`, radius: EON_CITY_W673_DISTRICT_BELT_RADIUS,
      streets, publicSpaces, secondaryBuildings,
      transitStation: freeze({ id: `${district.id}:station`, label: `${district.label} Station`, position: station, capsuleCompatible: true, explicitTravelReviewRequired: true }),
      eonbotDock: freeze({ id: `${district.id}:eonbot-dock`, position: offset(center, 2.8, -2.4), automaticDocking: false }),
      activeNpcAnchors,
      ambientPopulation: profile.ambientPopulation,
      streetFurnitureCount: profile.streetFurnitureCount,
      expanseGate: freeze({ id: `${district.id}:expanse-gate`, label: `${district.label} Expanse Gate`, position: expanseGate, automaticEntry: false, atlasRecorded: true }),
      distinctSkyline: freeze([...district.skyline]),
      visualNoiseBudget: freeze({ dominantMotion: 1, secondaryMotion: 2, ambientPeripheralOnly: true }),
      functionalObjectsFirst: true
    }),
    index,
    privateContentStored: false,
    automaticWork: false,
    automaticNavigation: false
  });
}

export function buildEonCityW673HybridMetropolisPlan({ quality = 'balanced', mode = 'explore' } = {}) {
  const resolvedQuality = Object.hasOwn(QUALITY, String(quality)) ? String(quality) : 'balanced';
  const profile = qualityProfile(resolvedQuality);
  const districts = freeze(EON_CITY_W660I_DISTRICTS.map((district, index) => districtPlan(district, index, profile)));
  const stations = freeze(districts.map((district) => district.belt.transitStation));
  const expanseGates = freeze(districts.map((district) => district.belt.expanseGate));
  const minimumCentreDistance = districts.flatMap((left, index) => districts.slice(index + 1).map((right) => Math.hypot(left.metropolisCenter.x - right.metropolisCenter.x, left.metropolisCenter.z - right.metropolisCenter.z))).sort((a, b) => a - b)[0] || 0;
  return freeze({
    schema: EON_CITY_W673_HYBRID_METROPOLIS_SCHEMA,
    quality: resolvedQuality,
    mode: mode === 'focus' ? 'focus' : 'explore',
    scale: EON_CITY_W673_CORE_SCALE,
    districts,
    stations,
    expanseGates,
    minimumCentreDistance: Number(minimumCentreDistance.toFixed(2)),
    districtModel: 'sanctum-plus-belt',
    connectedCoreRetained: true,
    streamedExpanseRetained: true,
    curatedRealmsRetained: true,
    myRealmRetained: true,
    focusModeDirectAccess: true,
    exploreModeDiscovery: true,
    transitCapsuleRequired: true,
    atlasRequired: true,
    oneCanonicalScene: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function validateEonCityW673HybridMetropolisPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W673_HYBRID_METROPOLIS_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(plan.districts) || plan.districts.length !== 9) errors.push('nine-districts-required');
  if (new Set((plan.districts || []).map((district) => district.id)).size !== 9) errors.push('district-identity-invalid');
  for (const district of plan.districts || []) {
    if (!district.sanctum?.preserved || district.sanctum?.productiveTerminalIds?.length < 2) errors.push(`sanctum:${district.id}`);
    if (district.belt?.secondaryBuildings?.length < 2 || district.belt?.publicSpaces?.length < 3 || district.belt?.streets?.length < 3) errors.push(`belt:${district.id}`);
    if (district.belt?.activeNpcAnchors?.length < 3 || district.belt?.activeNpcAnchors?.length > 6) errors.push(`population:${district.id}`);
    if (!district.belt?.transitStation?.capsuleCompatible || district.belt?.transitStation?.explicitTravelReviewRequired !== true) errors.push(`transit:${district.id}`);
    if (district.belt?.expanseGate?.automaticEntry !== false || district.belt?.expanseGate?.atlasRecorded !== true) errors.push(`expanse-gate:${district.id}`);
    if (district.belt?.functionalObjectsFirst !== true || district.belt?.visualNoiseBudget?.dominantMotion !== 1) errors.push(`visual-budget:${district.id}`);
  }
  if (plan.minimumCentreDistance < 18) errors.push('district-scale-too-small');
  if (!plan.transitCapsuleRequired || !plan.atlasRequired || !plan.focusModeDirectAccess || !plan.exploreModeDiscovery) errors.push('product-mode-incomplete');
  if (plan.automaticNavigation || plan.automaticExecution || plan.privateDataRead || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtCount: plan.districts?.length || 0, stationCount: plan.stations?.length || 0, expanseGateCount: plan.expanseGates?.length || 0 });
}

export function getEonCityW673HybridMetropolisTruth() {
  return freeze({
    schema: EON_CITY_W673_HYBRID_METROPOLIS_SCHEMA,
    currentRoomsBecomeSanctums: true,
    realDistrictBeltsRequired: true,
    meaningfulPopulationRequired: true,
    transitCapsuleRequired: true,
    expanseVisibleBeyondEveryDistrict: true,
    functionalObjectsBeforeDecorativeGeometry: true,
    oneDominantMotionBudget: true,
    oneCanonicalScene: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W673_HYBRID_METROPOLIS_SCHEMA,
  EON_CITY_W673_CORE_SCALE,
  EON_CITY_W673_DISTRICT_BELT_RADIUS,
  buildEonCityW673HybridMetropolisPlan,
  validateEonCityW673HybridMetropolisPlan,
  getEonCityW673HybridMetropolisTruth
});
