/**
 * W675 — activates the W674 Orientation District Belt across existing product
 * systems without migrating the remaining eight compact Sanctums yet.
 *
 * One projected district authority is shared by travel, Atlas, district
 * identity, terminal placement, the active district composition and Connected
 * Core routes. No route is opened and no player is moved by this pure module.
 */

import { EON_CITY_W660I_DISTRICTS } from '../w660i/eon-city-w660i-district-config.js';
import {
  getEonCityW674OrientationDistrictArrival,
  getEonCityW674OrientationTerminalPosition,
  projectEonCityW674AtlasDistricts,
  resolveEonCityW674OrientationDistrictBeltAtPosition
} from '../w674/eon-city-w674-orientation-district-belt.js';

export const EON_CITY_W675_ORIENTATION_BELT_ACTIVATION_SCHEMA = 'eon.city.orientation-belt-activation.w675.v1';
const freeze = (value) => Object.freeze(value);

export const EON_CITY_W675_PRODUCT_DISTRICTS = projectEonCityW674AtlasDistricts(EON_CITY_W660I_DISTRICTS);
const byId = new Map(EON_CITY_W675_PRODUCT_DISTRICTS.map((entry) => [entry.id, entry]));

export function getEonCityW675ProductDistrict(id = '') {
  return byId.get(String(id || '').trim().toLowerCase()) || null;
}

export function resolveEonCityW675DistrictAtPosition(position = {}, {
  currentDistrictId = '',
  enterMargin = 0.35,
  exitMargin = 1.35,
  switchAdvantage = 1.5
} = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;

  // The authored Orientation Belt receives first authority because its
  // footprint is intentionally much larger than the compact W660I Sanctum.
  const orientation = resolveEonCityW674OrientationDistrictBeltAtPosition({ x, z });
  if (orientation) return getEonCityW675ProductDistrict(orientation.districtId);

  const ranked = EON_CITY_W675_PRODUCT_DISTRICTS
    .map((entry) => freeze({ entry, distance: Math.hypot(x - entry.center.x, z - entry.center.z) }))
    .sort((left, right) => left.distance - right.distance);
  const candidate = ranked[0] || null;
  const current = getEonCityW675ProductDistrict(currentDistrictId);
  if (!current || !candidate) return candidate?.entry || null;
  if (candidate.entry.id === current.id) return current;

  const currentDistance = Math.hypot(x - current.center.x, z - current.center.z);
  const safelyInsideCurrent = currentDistance <= current.radius + Math.max(0, Number(exitMargin) || 0);
  const clearlyInsideCandidate = candidate.distance <= Math.max(0.1, candidate.entry.radius - Math.max(0, Number(enterMargin) || 0));
  const clearlyCloser = candidate.distance + Math.max(0, Number(switchAdvantage) || 0) < currentDistance;
  if (safelyInsideCurrent && (!clearlyInsideCandidate || !clearlyCloser)) return current;
  return candidate.entry;
}

export function getEonCityW675DistrictWorldPose(id = '') {
  const district = getEonCityW675ProductDistrict(id);
  if (!district) return null;
  return freeze({
    districtId: district.id,
    center: freeze({ ...district.center }),
    arrival: freeze({ ...district.arrival }),
    radius: Number(district.radius) || 0,
    spatialModel: district.spatialModel || 'legacy-sanctum'
  });
}

export function projectEonCityW675TransportDestination(district = {}) {
  const projected = getEonCityW675ProductDistrict(district?.id) || district;
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

export function resolveEonCityW675TerminalPlacement({ districtId = '', terminalId = '', legacyLocalPosition = {} } = {}) {
  const district = getEonCityW675ProductDistrict(districtId);
  if (!district) return null;
  const override = district.id === 'orientation-hall'
    ? getEonCityW674OrientationTerminalPosition(terminalId)
    : null;
  const position = override || freeze({
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

export function getEonCityW675OrientationBeltActivationTruth() {
  return freeze({
    schema: EON_CITY_W675_ORIENTATION_BELT_ACTIVATION_SCHEMA,
    oneProjectedDistrictAuthority: true,
    orientationTravelArrivesInBelt: true,
    orientationSanctumRendersInsideBelt: true,
    orientationTerminalsResolveInsideBelt: true,
    atlasShowsBeltLocation: true,
    districtDetectionRecognizesBelt: true,
    connectedCoreCanReachBelt: true,
    remainingEightDistrictsPreserved: true,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W675_ORIENTATION_BELT_ACTIVATION_SCHEMA,
  EON_CITY_W675_PRODUCT_DISTRICTS,
  getEonCityW675ProductDistrict,
  resolveEonCityW675DistrictAtPosition,
  getEonCityW675DistrictWorldPose,
  projectEonCityW675TransportDestination,
  resolveEonCityW675TerminalPlacement,
  getEonCityW675OrientationBeltActivationTruth
});
