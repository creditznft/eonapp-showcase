/**
 * W688 — activates reusable District Belts for Forge Basilica and Creator
 * Atrium while keeping the W675 Orientation belt and all remaining districts
 * intact.
 *
 * The module projects truthful product districts for spatial detection,
 * transport destinations and terminal placement. It remains local-only and
 * review-first.
 */

import { EON_CITY_W660I_DISTRICTS } from '../w660i/eon-city-w660i-district-config.js';
import {
  buildEonCityW687DistrictBeltPlan,
  getEonCityW687SupportedDistricts,
  getEonCityW687DistrictTerminalPosition,
  resolveEonCityW687DistrictBeltAtPosition
} from '../w687/eon-city-w687-district-belt-system.js';
import {
  getEonCityW674OrientationDistrictArrival,
  getEonCityW674OrientationTerminalPosition,
  projectEonCityW674AtlasDistricts,
  resolveEonCityW674OrientationDistrictBeltAtPosition
} from '../w674/eon-city-w674-orientation-district-belt.js';

export const EON_CITY_W688_CREATOR_FORGE_BELT_SCHEMA = 'eon.city.creator-forge-belt-activation.w688.v1';
const freeze = (value) => Object.freeze(value);

const CREATOR_AND_FORGE = freeze(getEonCityW687SupportedDistricts());
const legacyById = new Map(EON_CITY_W660I_DISTRICTS.map((entry) => [entry.id, entry]));

function projectGenericDistrict(district) {
  const plan = buildEonCityW687DistrictBeltPlan(district.id);
  if (!plan) return district;
  return freeze({
    ...district,
    center: freeze({ x: plan.center.x, z: plan.center.z }),
    arrival: freeze({ x: plan.arrival.x, z: plan.arrival.z, heading: plan.arrival.heading }),
    radius: plan.beltRadius,
    spatialModel: 'sanctum-plus-belt',
    beltPlanId: `${district.id}:belt`,
    productiveWorkLoops: freeze(plan.workLoops.map((entry) => entry.id)),
    visibleDiscoveries: freeze(plan.discoveries.map((entry) => entry.id))
  });
}

const orientationProjected = projectEonCityW674AtlasDistricts(EON_CITY_W660I_DISTRICTS);
export const EON_CITY_W688_PRODUCT_DISTRICTS = freeze(orientationProjected.map((district) => CREATOR_AND_FORGE.includes(district.id) ? projectGenericDistrict(district) : district));
const projectedById = new Map(EON_CITY_W688_PRODUCT_DISTRICTS.map((entry) => [entry.id, entry]));

export function getEonCityW688ProductDistrict(id = '') {
  return projectedById.get(String(id || '').trim().toLowerCase()) || null;
}

function resolveGenericAtPosition(position = {}, options = {}) {
  for (const districtId of CREATOR_AND_FORGE) {
    const resolved = resolveEonCityW687DistrictBeltAtPosition(districtId, position, options);
    if (resolved) return getEonCityW688ProductDistrict(districtId);
  }
  return null;
}

export function resolveEonCityW688DistrictAtPosition(position = {}, {
  currentDistrictId = '',
  enterMargin = 0.35,
  exitMargin = 1.35,
  switchAdvantage = 1.5
} = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;

  const orientation = resolveEonCityW674OrientationDistrictBeltAtPosition({ x, z });
  if (orientation) return getEonCityW688ProductDistrict(orientation.districtId);

  const generic = resolveGenericAtPosition({ x, z });
  if (generic) return generic;

  const ranked = EON_CITY_W688_PRODUCT_DISTRICTS
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.center.x, z - entry.center.z) }))
    .sort((left, right) => left.distance - right.distance);
  const candidate = ranked[0] || null;
  const current = getEonCityW688ProductDistrict(currentDistrictId);
  if (!current || !candidate) return candidate?.entry || null;
  if (candidate.entry.id === current.id) return current;

  const currentDistance = Math.hypot(x - current.center.x, z - current.center.z);
  const safelyInsideCurrent = currentDistance <= current.radius + Math.max(0, Number(exitMargin) || 0);
  const clearlyInsideCandidate = candidate.distance <= Math.max(0.1, candidate.entry.radius - Math.max(0, Number(enterMargin) || 0));
  const clearlyCloser = candidate.distance + Math.max(0, Number(switchAdvantage) || 0) < currentDistance;
  if (safelyInsideCurrent && (!clearlyInsideCandidate || !clearlyCloser)) return current;
  return candidate.entry;
}

export function getEonCityW688DistrictWorldPose(id = '') {
  const district = getEonCityW688ProductDistrict(id);
  if (!district) return null;
  return freeze({
    districtId: district.id,
    center: freeze({ ...district.center }),
    arrival: freeze({ ...district.arrival }),
    radius: Number(district.radius) || 0,
    spatialModel: district.spatialModel || 'legacy-sanctum'
  });
}

export function projectEonCityW688TransportDestination(district = {}) {
  const projected = getEonCityW688ProductDistrict(district?.id) || district;
  const arrival = projected.id === 'orientation-hall'
    ? getEonCityW674OrientationDistrictArrival()
    : projected.arrival;
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

export function resolveEonCityW688TerminalPlacement({ districtId = '', terminalId = '', legacyLocalPosition = {} } = {}) {
  const id = String(districtId || '').trim().toLowerCase();
  const district = getEonCityW688ProductDistrict(id);
  if (!district) return null;
  const orientation = id === 'orientation-hall' ? getEonCityW674OrientationTerminalPosition(terminalId) : null;
  const generic = CREATOR_AND_FORGE.includes(id) ? getEonCityW687DistrictTerminalPosition(id, terminalId) : null;
  const position = orientation || generic || freeze({
    x: district.center.x + (Number(legacyLocalPosition?.x) || 0),
    y: Number(legacyLocalPosition?.y) || 0,
    z: district.center.z + (Number(legacyLocalPosition?.z) || 0)
  });
  return freeze({
    districtId: district.id,
    position: freeze({ ...position }),
    localPosition: freeze({
      x: position.x - district.center.x,
      y: Number(position.y) || 0,
      z: position.z - district.center.z
    }),
    spatialModel: district.spatialModel || 'legacy-sanctum'
  });
}

export function validateEonCityW688CreatorForgeBeltActivation(entries = EON_CITY_W688_PRODUCT_DISTRICTS) {
  const errors = [];
  if (!Array.isArray(entries) || entries.length !== 9) errors.push('nine-districts-required');
  for (const id of ['orientation-hall', 'creator-atrium', 'forge-basilica']) {
    const district = entries.find((entry) => entry.id === id);
    if (!district || district.spatialModel !== 'sanctum-plus-belt' || district.radius < 14) errors.push(`activated-belt:${id}`);
  }
  for (const id of ['transit-network', 'agent-theatre', 'command-centre', 'archive-canopy', 'vault-station', 'trade-dome']) {
    const legacy = legacyById.get(id);
    const district = entries.find((entry) => entry.id === id);
    if (!district || district.spatialModel === 'sanctum-plus-belt' || district.center.x !== legacy.center.x || district.center.z !== legacy.center.z) errors.push(`legacy-preserved:${id}`);
  }
  for (const id of ['creator-atrium', 'forge-basilica']) {
    const plan = buildEonCityW687DistrictBeltPlan(id);
    if (!plan || !plan.workLoops?.length || !plan.discoveries?.length) errors.push(`plan:${id}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), activatedCount: 3, totalDistricts: Array.isArray(entries) ? entries.length : 0 });
}

export function getEonCityW688CreatorForgeBeltTruth() {
  return freeze({
    schema: EON_CITY_W688_CREATOR_FORGE_BELT_SCHEMA,
    orientationCreatorForgeBeltsActive: true,
    reuseW687Builder: true,
    creatorAtriumHasProductiveBelt: true,
    forgeBasilicaHasProductiveBelt: true,
    remainingDistrictsPreserved: true,
    reviewFirstTravel: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W688_CREATOR_FORGE_BELT_SCHEMA,
  EON_CITY_W688_PRODUCT_DISTRICTS,
  getEonCityW688ProductDistrict,
  resolveEonCityW688DistrictAtPosition,
  getEonCityW688DistrictWorldPose,
  projectEonCityW688TransportDestination,
  resolveEonCityW688TerminalPlacement,
  validateEonCityW688CreatorForgeBeltActivation,
  getEonCityW688CreatorForgeBeltTruth
});
