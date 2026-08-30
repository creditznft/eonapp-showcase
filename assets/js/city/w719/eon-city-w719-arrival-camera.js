/**
 * W719.13 — active progressive City arrival-camera authority.
 *
 * Pure geometry only: selects a bounded ArcRotate pose that starts outside
 * authored structural boxes and looks across the playable district rather than
 * directly into a foreground facade. It does not move the player, navigate,
 * read private state, or create a second render owner.
 */
export const EON_CITY_W719_ARRIVAL_CAMERA_SCHEMA = 'eon.city.arrival-camera.w719.13.v1';

const freeze = Object.freeze;
const TAU = Math.PI * 2;

const PROFILES = freeze({
  'orientation-hall': freeze({
    alpha: -1.16,
    beta: 0.86,
    radius: 20.5,
    targetOffset: freeze({ x: 0, y: 1.22, z: 3.4 })
  }),
  default: freeze({
    alpha: -1.12,
    beta: 0.94,
    radius: 18,
    targetOffset: freeze({ x: 0, y: 1.08, z: 0 })
  })
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function normalizeAlpha(value) {
  const alpha = finite(value, -Math.PI / 2);
  return ((alpha % TAU) + TAU) % TAU;
}
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, finite(value, minimum)));
}
function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function profileFor(districtId = '') {
  return PROFILES[String(districtId || '').trim()] || PROFILES.default;
}

export function estimateEonCityW719ArcRotatePosition({ target = {}, alpha = -Math.PI / 2, beta = 0.94, radius = 18 } = {}) {
  const safeAlpha = normalizeAlpha(alpha);
  const safeBeta = clamp(beta, 0.32, 1.34);
  const safeRadius = clamp(radius, 7.5, 34);
  const horizontal = safeRadius * Math.sin(safeBeta);
  return freeze({
    x: Number((finite(target.x) + horizontal * Math.cos(safeAlpha)).toFixed(4)),
    y: Number((finite(target.y, 1.08) + safeRadius * Math.cos(safeBeta)).toFixed(4)),
    z: Number((finite(target.z) + horizontal * Math.sin(safeAlpha)).toFixed(4))
  });
}

export function isEonCityW719PointInsideStructuralBounds(point = {}, bounds = {}, margin = 0.65) {
  const inset = Math.max(0, finite(margin, 0.65));
  const min = bounds?.min || bounds?.minimum || {};
  const max = bounds?.max || bounds?.maximum || {};
  const minX = finite(min.x, Number.POSITIVE_INFINITY) - inset;
  const maxX = finite(max.x, Number.NEGATIVE_INFINITY) + inset;
  const minY = finite(min.y, Number.POSITIVE_INFINITY) - inset;
  const maxY = finite(max.y, Number.NEGATIVE_INFINITY) + inset;
  const minZ = finite(min.z, Number.POSITIVE_INFINITY) - inset;
  const maxZ = finite(max.z, Number.NEGATIVE_INFINITY) + inset;
  return Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)) && Number.isFinite(Number(point.z))
    && point.x >= minX && point.x <= maxX
    && point.y >= minY && point.y <= maxY
    && point.z >= minZ && point.z <= maxZ;
}

function candidateProfiles(base) {
  return freeze([
    base,
    freeze({ ...base, alpha: base.alpha - 0.42, beta: Math.max(0.74, base.beta - 0.04), radius: base.radius + 1.5 }),
    freeze({ ...base, alpha: base.alpha + 0.42, beta: Math.max(0.74, base.beta - 0.04), radius: base.radius + 1.5 }),
    freeze({ ...base, alpha: -Math.PI / 2, beta: 0.78, radius: Math.min(25, base.radius + 3.5) }),
    freeze({ ...base, alpha: Math.PI, beta: 0.82, radius: Math.min(25, base.radius + 3) })
  ]);
}

export function resolveEonCityW719ArrivalCamera({
  districtId = 'orientation-hall',
  playerPosition = {},
  structuralBounds = [],
  preferredPose = null
} = {}) {
  const authored = profileFor(districtId);
  const base = freeze({
    alpha: finiteOr(preferredPose?.cameraAlpha ?? preferredPose?.alpha, authored.alpha),
    beta: clamp(finiteOr(preferredPose?.cameraBeta ?? preferredPose?.beta, authored.beta), 0.35, 1.22),
    radius: clamp(finiteOr(preferredPose?.cameraRadius ?? preferredPose?.radius, authored.radius), 8.5, 30),
    targetOffset: freeze({
      x: finite(preferredPose?.targetOffset?.x, authored.targetOffset.x),
      y: clamp(finiteOr(preferredPose?.targetOffset?.y, authored.targetOffset.y), 0.8, 4.5),
      z: finite(preferredPose?.targetOffset?.z, authored.targetOffset.z)
    })
  });
  const target = freeze({
    x: finite(playerPosition.x) + base.targetOffset.x,
    y: base.targetOffset.y,
    z: finite(playerPosition.z) + base.targetOffset.z
  });
  const boxes = Array.isArray(structuralBounds) ? structuralBounds.filter(Boolean) : [];
  let selected = null;
  let selectedIndex = -1;
  for (const [index, candidate] of candidateProfiles(base).entries()) {
    const estimatedPosition = estimateEonCityW719ArcRotatePosition({ target, ...candidate });
    const blocked = boxes.some((bounds) => isEonCityW719PointInsideStructuralBounds(estimatedPosition, bounds));
    if (!blocked) {
      selected = freeze({ ...candidate, estimatedPosition });
      selectedIndex = index;
      break;
    }
  }
  if (!selected) {
    const fallback = freeze({ ...base, beta: 0.68, radius: 28 });
    selected = freeze({ ...fallback, estimatedPosition: estimateEonCityW719ArcRotatePosition({ target, ...fallback }) });
    selectedIndex = 5;
  }
  return freeze({
    schema: EON_CITY_W719_ARRIVAL_CAMERA_SCHEMA,
    districtId: String(districtId || 'orientation-hall'),
    cameraAlpha: Number(normalizeAlpha(selected.alpha).toFixed(6)),
    cameraBeta: Number(clamp(selected.beta, 0.35, 1.22).toFixed(6)),
    cameraRadius: Number(clamp(selected.radius, 8.5, 30).toFixed(4)),
    targetOffset: base.targetOffset,
    target,
    estimatedPosition: selected.estimatedPosition,
    candidateIndex: selectedIndex,
    structuralBoundsChecked: boxes.length,
    outsideStructuralBounds: selectedIndex < 5,
    automaticNavigation: false,
    playerMoved: false
  });
}

export function getEonCityW719ArrivalCameraTruth() {
  return freeze({
    schema: `${EON_CITY_W719_ARRIVAL_CAMERA_SCHEMA}.truth.v1`,
    activeProgressiveCoreAuthority: true,
    structuralBoundsValidated: true,
    openPlazaTargetLead: true,
    restartUsesSameAuthority: true,
    districtArrivalUsesSameAuthority: true,
    playerMovedAutomatically: false,
    navigationStartedAutomatically: false
  });
}
