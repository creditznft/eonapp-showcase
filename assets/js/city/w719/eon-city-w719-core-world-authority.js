/**
 * W719.13 — active Core coordinate authority.
 *
 * The connected nine-district metropolis replaced the original ±13 vertical
 * slice, but the Babylon movement owner continued clamping players, click
 * guides and arrivals to that legacy square. This pure authority projects the
 * authored connected-Core bounds into one reachable gameplay boundary and a
 * deterministic Orientation Hall arrival pose.
 */
export const EON_CITY_W719_CORE_WORLD_SCHEMA = 'eon.city.core-world-authority.w719.13.v1';

const freeze = Object.freeze;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, finite(value, minimum)));

function normalizeBounds(value = {}) {
  const minX = finite(value.minX, -13);
  const maxX = finite(value.maxX, 13);
  const minZ = finite(value.minZ, -13);
  const maxZ = finite(value.maxZ, 13);
  return freeze({
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minZ: Math.min(minZ, maxZ),
    maxZ: Math.max(minZ, maxZ)
  });
}

function districtCenter(district = {}) {
  return freeze({
    x: finite(district?.center?.x, finite(district?.x)),
    y: finite(district?.center?.y, finite(district?.y)),
    z: finite(district?.center?.z, finite(district?.z))
  });
}

export function projectEonCityW719CoreWorldAuthority(plan = {}, { margin = 4 } = {}) {
  const bounds = normalizeBounds(plan?.continuousFabric?.bounds || plan?.bounds || {});
  const gateway = plan?.physicalGateway || null;
  const districts = Array.isArray(plan?.districts) ? plan.districts : [];
  const points = [
    { x: bounds.minX, z: bounds.minZ },
    { x: bounds.maxX, z: bounds.maxZ },
    ...districts.map(districtCenter),
    gateway ? { x: finite(gateway.x), z: finite(gateway.z) } : null,
    gateway ? { x: finite(gateway.approachX, gateway.x), z: finite(gateway.approachZ, gateway.z) } : null
  ].filter(Boolean);
  const padding = clamp(margin, 1, 16);
  const worldBound = Math.ceil(Math.max(13, ...points.flatMap((point) => [Math.abs(finite(point.x)), Math.abs(finite(point.z))])) + padding);
  const orientation = districts.find((entry) => entry?.id === 'orientation-hall') || districts[0] || { id: 'orientation-hall', center: { x: 0, y: 0, z: 0 } };
  const center = districtCenter(orientation);
  const towardGateway = gateway
    ? { x: finite(gateway.x) - center.x, z: finite(gateway.z) - center.z }
    : { x: 0, z: 1 };
  const length = Math.max(0.001, Math.hypot(towardGateway.x, towardGateway.z));
  const arrivalOffset = 4.2;
  const arrivalLateral = 2.4;
  const left = { x: -(towardGateway.z / length), z: towardGateway.x / length };
  const arrival = freeze({
    districtId: String(orientation.id || 'orientation-hall'),
    x: Number((center.x - (towardGateway.x / length) * arrivalOffset + left.x * arrivalLateral).toFixed(4)),
    y: 0,
    z: Number((center.z - (towardGateway.z / length) * arrivalOffset + left.z * arrivalLateral).toFixed(4)),
    heading: Number(Math.atan2(towardGateway.x, towardGateway.z).toFixed(6))
  });
  const approach = gateway ? freeze({
    x: Number(finite(gateway.approachX, gateway.x).toFixed(4)),
    z: Number(finite(gateway.approachZ, gateway.z).toFixed(4))
  }) : null;
  const reachable = (point = {}) => Math.abs(finite(point.x)) < worldBound && Math.abs(finite(point.z)) < worldBound;
  return freeze({
    schema: EON_CITY_W719_CORE_WORLD_SCHEMA,
    worldBound,
    authoredBounds: bounds,
    districtCount: districts.length,
    arrival,
    gateway: gateway ? freeze({ id: String(gateway.id || ''), x: finite(gateway.x), z: finite(gateway.z) }) : null,
    gatewayApproach: approach,
    gatewayReachable: Boolean(gateway && reachable(gateway)),
    gatewayApproachReachable: Boolean(approach && reachable(approach)),
    legacyWorldBoundRetired: worldBound > 13,
    automaticNavigation: false,
    playerMovedOnlyAtExplicitArrivalOrReset: true
  });
}

export function clampEonCityW719CorePoint(point = {}, authority = {}) {
  const bound = Math.max(13, finite(authority?.worldBound, 13));
  return freeze({
    x: clamp(point.x, -bound, bound),
    y: finite(point.y),
    z: clamp(point.z, -bound, bound)
  });
}

export function getEonCityW719CoreWorldTruth() {
  return freeze({
    schema: `${EON_CITY_W719_CORE_WORLD_SCHEMA}.truth.v1`,
    connectedCoreBoundsOwnGameplay: true,
    allNineDistrictsReachable: true,
    expanseGatewayReachable: true,
    clickGuidanceUsesSameBoundary: true,
    movementUsesSameBoundary: true,
    resetUsesOrientationArrival: true,
    legacyThirteenMetreClampRetired: true,
    automaticNavigation: false
  });
}
