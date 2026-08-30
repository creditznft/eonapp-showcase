/**
 * W687 — reusable District Belt construction system.
 *
 * Generalises the W674 Orientation District Belt pattern into a reusable,
 * data-first construction authority for additional productive districts. The
 * module is pure: it builds spatial plans, terminal placements, discovery
 * markers and work loops, but never performs navigation, network activity,
 * approval or execution.
 */

import { getEonCityW660iDistrictConfig } from '../w660i/eon-city-w660i-district-config.js';
import { buildEonCityW673HybridMetropolisPlan, EON_CITY_W673_DISTRICT_BELT_RADIUS } from '../w673/eon-city-w673-hybrid-metropolis-plan.js';

export const EON_CITY_W687_DISTRICT_BELT_SYSTEM_SCHEMA = 'eon.city.district-belt-system.w687.v1';
const freeze = (value) => Object.freeze(value);
const point = (x = 0, y = 0, z = 0) => freeze({ x: Number(x) || 0, y: Number(y) || 0, z: Number(z) || 0 });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const EON_CITY_W687_TERMINAL_LOCAL_POSITIONS = freeze([
  freeze({ x: -2.6, y: 0, z: 1.65 }),
  freeze({ x: 0, y: 0, z: 2.25 }),
  freeze({ x: 2.6, y: 0, z: 1.65 })
]);

const DISTRICT_SPECIALISATION = freeze({
  'creator-atrium': freeze({
    buildingKinds: freeze([
      freeze({ label: 'Project Studio', role: 'continue-projects' }),
      freeze({ label: 'Capture Gallery', role: 'creator-capture' }),
      freeze({ label: 'Sharing Salon', role: 'share-review' }),
      freeze({ label: 'Media Workshop', role: 'asset-prep' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Project Continuation Court', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.2) }),
      freeze({ label: 'Capture Commons', kind: 'public-work-area', productive: true, offset: point(-6.4, 0, 2.2) }),
      freeze({ label: 'Sharing Review Walk', kind: 'review-lounge', productive: true, offset: point(6.25, 0, 2.5) })
    ]),
    workLoops: freeze([
      freeze({ id: 'creator-loop-projects', label: 'Continue project', terminalId: 'project-continuation-seat', route: '/projects', reviewRequired: true }),
      freeze({ id: 'creator-loop-capture', label: 'Record and inspect capture', terminalId: 'creator-capture-console', panel: 'creator-capture', reviewRequired: true }),
      freeze({ id: 'creator-loop-share', label: 'Prepare public-safe share', terminalId: 'sharing-review-terminal', panel: 'share-center', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'creator-discovery-command-seat', label: 'Creator Command Seat', kind: 'equipment' }),
      freeze({ id: 'creator-discovery-gallery', label: 'Capture Gallery', kind: 'space' }),
      freeze({ id: 'creator-discovery-sharing', label: 'Sharing Review Promenade', kind: 'space' })
    ])
  }),
  'forge-basilica': freeze({
    buildingKinds: freeze([
      freeze({ label: 'Build Foundry', role: 'forge-build' }),
      freeze({ label: 'Debug Lab', role: 'validation' }),
      freeze({ label: 'Device Workshop', role: 'device-lab' }),
      freeze({ label: 'Validation Annex', role: 'evidence-review' })
    ]),
    publicSpaces: freeze([
      freeze({ label: 'Forge Reactor Court', kind: 'arrival-plaza', productive: true, offset: point(0, 0, -6.35) }),
      freeze({ label: 'Build Lane', kind: 'public-work-area', productive: true, offset: point(-6.5, 0, 2.3) }),
      freeze({ label: 'Validation Terrace', kind: 'review-lounge', productive: true, offset: point(6.2, 0, 2.6) })
    ]),
    workLoops: freeze([
      freeze({ id: 'forge-loop-build', label: 'Open Forge', terminalId: 'forge-workbench-terminal', route: '/forge', reviewRequired: true }),
      freeze({ id: 'forge-loop-validate', label: 'Inspect build validation', terminalId: 'build-validation-console', route: '/workspace', reviewRequired: true }),
      freeze({ id: 'forge-loop-device', label: 'Review device readiness', terminalId: 'device-lab-console', route: '/local-ai', reviewRequired: true })
    ]),
    discoveries: freeze([
      freeze({ id: 'forge-discovery-reactor', label: 'Forge Reactor Spire', kind: 'landmark' }),
      freeze({ id: 'forge-discovery-workbench', label: 'Forge Workbench', kind: 'equipment' }),
      freeze({ id: 'forge-discovery-device-lab', label: 'Device Lab Bay', kind: 'space' })
    ])
  })
});

export function getEonCityW687MetropolisDistrict(districtId = '', quality = 'balanced', mode = 'explore') {
  const plan = buildEonCityW673HybridMetropolisPlan({ quality, mode });
  return plan.districts.find((entry) => entry.id === String(districtId || '').trim().toLowerCase()) || null;
}

function toTerminal(terminalId, localPosition, center, districtId) {
  return freeze({
    id: terminalId,
    districtId,
    localPosition,
    position: point(center.x + localPosition.x, localPosition.y, center.z + localPosition.z),
    reviewFirst: true,
    automaticNavigation: false,
    automaticExecution: false
  });
}

function offsetPoint(center, offset) {
  return point(center.x + Number(offset?.x || 0), Number(offset?.y || 0), center.z + Number(offset?.z || 0));
}

export function buildEonCityW687DistrictBeltPlanFromSpecialisation(districtId = '', specialisation = null, { quality = 'balanced', mode = 'explore' } = {}) {
  const id = String(districtId || '').trim().toLowerCase();
  const district = getEonCityW660iDistrictConfig(id);
  const metro = getEonCityW687MetropolisDistrict(id, quality, mode);
  const special = specialisation;
  if (!district || !metro || !special) return null;

  const center = point(metro.metropolisCenter.x, 0, metro.metropolisCenter.z);
  const arrival = point(center.x, 0, center.z - 10.8);
  const terminals = freeze(district.terminals.map((terminalId, index) => toTerminal(terminalId, EON_CITY_W687_TERMINAL_LOCAL_POSITIONS[index % EON_CITY_W687_TERMINAL_LOCAL_POSITIONS.length], center, id)));
  const buildings = freeze(special.buildingKinds.map((entry, index) => {
    const theta = Math.PI * 0.65 + index * (Math.PI * 2 / Math.max(4, special.buildingKinds.length));
    const radius = 8.5 + (index % 2) * 1.9;
    return freeze({
      id: `${id}:building:${index + 1}`,
      label: entry.label,
      role: entry.role,
      position: point(center.x + Math.sin(theta) * radius, 0, center.z + Math.cos(theta) * radius),
      functional: true,
      enterableLobby: true,
      reviewFirst: true,
      privateContentStored: false
    });
  }));
  const publicSpaces = freeze(special.publicSpaces.map((entry, index) => freeze({
    id: `${id}:space:${index + 1}`,
    label: entry.label,
    kind: entry.kind,
    productive: entry.productive,
    position: offsetPoint(center, entry.offset)
  })));
  const residents = freeze(metro.belt.activeNpcAnchors.map((entry, index) => freeze({
    id: entry.id,
    role: entry.role,
    position: point(entry.position.x, entry.position.y, entry.position.z),
    routine: freeze(index % 2 === 0 ? ['idle', 'guide', 'review', 'walk'] : ['idle', 'work', 'talk', 'walk']),
    claimsRealWork: false,
    automaticWork: false
  })));
  const discoverables = freeze(special.discoveries.map((entry, index) => freeze({
    ...entry,
    districtId: id,
    reviewFirst: true,
    position: index < buildings.length
      ? buildings[index].position
      : index - buildings.length < publicSpaces.length
        ? publicSpaces[index - buildings.length].position
        : center
  })));
  const beltRadius = Number(metro.belt.radius || EON_CITY_W673_DISTRICT_BELT_RADIUS);
  return freeze({
    schema: EON_CITY_W687_DISTRICT_BELT_SYSTEM_SCHEMA,
    districtId: id,
    districtLabel: district.label,
    quality,
    mode: mode === 'focus' ? 'focus' : 'explore',
    center,
    arrival: freeze({ ...arrival, heading: Math.PI }),
    sanctum: freeze({
      id: `${id}:sanctum`,
      label: `${district.label} Sanctum`,
      center,
      radius: clamp(Number(district.radius) || 5.2, 4.8, 6.4),
      preserved: true,
      productiveTerminalIds: freeze([...district.terminals])
    }),
    beltRadius,
    streets: freeze(metro.belt.streets.map((entry) => freeze({ ...entry, pedestrianSafe: true, automaticNavigation: false }))),
    station: freeze({ ...metro.belt.transitStation, boardingRequiresReview: true, automaticTravel: false, position: point(metro.belt.transitStation.position.x, 0, metro.belt.transitStation.position.z) }),
    eonbotDock: freeze({ ...metro.belt.eonbotDock, explicitDockActionRequired: true, automaticDocking: false, position: point(metro.belt.eonbotDock.position.x, 0, metro.belt.eonbotDock.position.z) }),
    expanseGate: freeze({ ...metro.belt.expanseGate, reviewFirst: true, separateConfirmationRequired: true, automaticEntry: false, position: point(metro.belt.expanseGate.position.x, 0, metro.belt.expanseGate.position.z) }),
    buildings,
    publicSpaces,
    terminals,
    residents,
    workLoops: special.workLoops,
    discoveries: discoverables,
    visualNoiseBudget: freeze({ dominantMotion: 1, secondaryMotion: 2, genericOrbitClutterForbidden: true }),
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


export function buildEonCityW687DistrictBeltPlan(districtId = '', options = {}) {
  const id = String(districtId || '').trim().toLowerCase();
  return buildEonCityW687DistrictBeltPlanFromSpecialisation(id, DISTRICT_SPECIALISATION[id] || null, options);
}

export function getEonCityW687SupportedDistricts() {
  return freeze(Object.keys(DISTRICT_SPECIALISATION));
}

export function getEonCityW687DistrictTerminalPosition(districtId = '', terminalId = '', options = {}) {
  const plan = buildEonCityW687DistrictBeltPlan(districtId, options);
  const terminal = plan?.terminals?.find((entry) => entry.id === String(terminalId || '').trim());
  return terminal ? freeze({ ...terminal.position }) : null;
}

export function resolveEonCityW687DistrictBeltAtPosition(districtId = '', position = {}, options = {}) {
  const plan = buildEonCityW687DistrictBeltPlan(districtId, options);
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!plan || !Number.isFinite(x) || !Number.isFinite(z)) return null;
  const distance = Math.hypot(x - plan.center.x, z - plan.center.z);
  if (distance > plan.beltRadius) return null;
  return freeze({
    districtId: plan.districtId,
    label: plan.districtLabel,
    center: plan.center,
    distance: Number(distance.toFixed(2)),
    radius: plan.beltRadius,
    insideSanctum: distance <= plan.sanctum.radius,
    insideBelt: true
  });
}

export function validateEonCityW687DistrictBeltPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_W687_DISTRICT_BELT_SYSTEM_SCHEMA) errors.push('schema-invalid');
  if (!getEonCityW687SupportedDistricts().includes(plan.districtId)) errors.push('unsupported-district');
  if (!plan.sanctum?.preserved || plan.sanctum?.productiveTerminalIds?.length < 2) errors.push('sanctum-invalid');
  if (!Array.isArray(plan.terminals) || plan.terminals.length < 2 || plan.terminals.some((entry) => !entry.reviewFirst || entry.automaticNavigation || entry.automaticExecution)) errors.push('terminals-invalid');
  if (!Array.isArray(plan.workLoops) || plan.workLoops.length < 2 || plan.workLoops.some((entry) => entry.reviewRequired !== true)) errors.push('work-loops-invalid');
  if (!Array.isArray(plan.buildings) || plan.buildings.length < 2 || plan.buildings.some((entry) => !entry.functional || entry.privateContentStored)) errors.push('buildings-invalid');
  if (!Array.isArray(plan.publicSpaces) || plan.publicSpaces.length < 3) errors.push('public-spaces-invalid');
  if (!Array.isArray(plan.residents) || plan.residents.length < 3 || plan.residents.some((entry) => entry.claimsRealWork || entry.automaticWork)) errors.push('residents-invalid');
  if (!Array.isArray(plan.discoveries) || plan.discoveries.length < 3) errors.push('discoveries-invalid');
  if (!plan.station?.boardingRequiresReview || plan.station?.automaticTravel) errors.push('station-invalid');
  if (!plan.expanseGate?.reviewFirst || !plan.expanseGate?.separateConfirmationRequired || plan.expanseGate?.automaticEntry) errors.push('expanse-gate-invalid');
  if (!plan.oneCanonicalScene || plan.secondCanvasCreated || plan.secondRenderLoopCreated || plan.automaticNavigation || plan.automaticExecution || plan.privateDataRead || plan.privateContentStored || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtId: plan.districtId || '', terminalCount: plan.terminals?.length || 0, buildingCount: plan.buildings?.length || 0 });
}

export function getEonCityW687DistrictBeltSystemTruth() {
  return freeze({
    schema: EON_CITY_W687_DISTRICT_BELT_SYSTEM_SCHEMA,
    reusableBuilder: true,
    productiveBeltsShareOneAuthorityPattern: true,
    creatorAtriumSupported: true,
    forgeBasilicaSupported: true,
    reviewFirstWorkLoops: true,
    visibleDiscoveries: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W687_DISTRICT_BELT_SYSTEM_SCHEMA,
  EON_CITY_W687_TERMINAL_LOCAL_POSITIONS,
  getEonCityW687MetropolisDistrict,
  buildEonCityW687DistrictBeltPlanFromSpecialisation,
  buildEonCityW687DistrictBeltPlan,
  getEonCityW687SupportedDistricts,
  getEonCityW687DistrictTerminalPosition,
  resolveEonCityW687DistrictBeltAtPosition,
  validateEonCityW687DistrictBeltPlan,
  getEonCityW687DistrictBeltSystemTruth
});
