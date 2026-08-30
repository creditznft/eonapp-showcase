/**
 * W747 — deterministic spatial authority for the Living Nexus Command Core.
 *
 * This module is intentionally Babylon-free so layout, camera and safety
 * invariants can be certified in Node before a browser scene is created.
 */
const freeze = (value) => Object.freeze(value);
const deepPoint = (point = {}) => freeze({
  x: Number(point.x || 0),
  y: Number(point.y || 0),
  z: Number(point.z || 0)
});

export const EON_CITY_W747_SPATIAL_SCHEMA = 'eon.city.spatial-foundation.w747.v1';
export const EON_CITY_W747_WORLD_FLOOR_Y = 0;

export const EON_CITY_W747_HERO_ZONE = freeze({
  id: 'living-nexus-hero-zone',
  center: deepPoint({ x: 0, y: 0, z: 0 }),
  radius: 6,
  diameter: 12,
  reservedPrimaryRole: 'living-nexus-core',
  allowedFloorDecorationHeight: 0.24,
  minimumPrimaryClearance: 0.45
});

export const EON_CITY_W747_ARRIVAL_CORRIDOR = freeze({
  id: 'arrival-reveal-corridor',
  from: deepPoint({ x: 0, y: 0, z: 16.2 }),
  to: deepPoint({ x: 0, y: 0, z: 6.25 }),
  halfWidth: 2.65,
  minimumVerticalClearance: 2.15
});

export const EON_CITY_W747_FIVE_WING_ANCHORS = freeze([
  freeze({ id: 'creator', label: 'Creator Wing', position: deepPoint({ x: -11.3, y: 0, z: 0.6 }) }),
  freeze({ id: 'operations', label: 'Operations Wing', position: deepPoint({ x: 0, y: 0, z: -11.6 }) }),
  freeze({ id: 'knowledge', label: 'Knowledge Wing', position: deepPoint({ x: 11.3, y: 0, z: 0.6 }) }),
  freeze({ id: 'systems', label: 'Systems Wing', position: deepPoint({ x: 16.2, y: 0, z: 6.8 }) }),
  freeze({ id: 'personal-transit', label: 'Personal / Transit Wing', position: deepPoint({ x: -15.1, y: 0, z: 10.8 }) })
]);

const placement = (id, wing, position, focus, footprintRadius, primaryRole = id) => freeze({
  id,
  wing,
  position: deepPoint(position),
  focus: deepPoint(focus),
  footprintRadius: Number(footprintRadius),
  primaryRole
});

export const EON_CITY_W747_PRIMARY_PLACEMENTS = freeze([
  placement('eonbot-nexus', 'hero', { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4.35 }, 2.45, 'living-nexus-core'),
  placement('create-forge', 'creator', { x: -10.8, y: 0, z: -3.6 }, { x: -7.65, y: 0, z: -2.05 }, 3.05),
  placement('share-capture', 'creator', { x: -11.8, y: 0, z: 4.8 }, { x: -8.55, y: 0, z: 3.55 }, 2.65),
  placement('command-console', 'operations', { x: -5.2, y: 0, z: -11.6 }, { x: -3.55, y: 0, z: -8.25 }, 2.75),
  placement('automation-theatre', 'operations', { x: 5.2, y: 0, z: -11.6 }, { x: 3.55, y: 0, z: -8.25 }, 2.75),
  placement('project-atlas', 'knowledge', { x: 10.8, y: 0, z: -3.6 }, { x: 7.65, y: 0, z: -2.05 }, 2.5),
  placement('library-vault', 'knowledge', { x: 11.8, y: 0, z: 4.8 }, { x: 8.55, y: 0, z: 3.55 }, 2.55),
  placement('local-ai-lab', 'systems', { x: 18, y: 0, z: 8.5 }, { x: 14.62, y: 0, z: 7.0 }, 3.05),
  placement('my-realm-portal', 'personal-transit', { x: -18, y: 0, z: 8.5 }, { x: -14.4, y: 0, z: 6.9 }, 3.0),
  placement('plans-access', 'personal-transit', { x: -14, y: 0, z: 14.2 }, { x: -11.43, y: 0, z: 11.54 }, 3.05)
]);

export const EON_CITY_W747_SPAWN = freeze({ x: 0, y: 0, z: 16.2, heading: Math.PI });

const cameraPose = (id, values) => freeze({
  id,
  alpha: Number(values.alpha),
  beta: Number(values.beta),
  radius: Number(values.radius),
  target: deepPoint(values.target),
  targetHeight: Number(values.targetHeight ?? values.target?.y ?? 1.5),
  lowerRadiusLimit: Number(values.lowerRadiusLimit || 6.5),
  upperRadiusLimit: Number(values.upperRadiusLimit || 18.5),
  lowerBetaLimit: Number(values.lowerBetaLimit || 0.72),
  // L95: allow a near-horizontal / slight upward third-person view while
  // retaining floor clearance at the authored radius/target envelopes.
  upperBetaLimit: Number(values.upperBetaLimit || 1.6)
});

export const EON_CITY_W747_CAMERA_POSES = freeze({
  arrival: cameraPose('arrival', {
    alpha: Math.PI / 2,
    beta: 1.08,
    radius: 15.9,
    target: { x: 0, y: 1.55, z: 3.8 },
    lowerRadiusLimit: 7,
    upperRadiusLimit: 18.5
  }),
  return: cameraPose('return', {
    alpha: Math.PI / 2,
    beta: 1.08,
    radius: 15.9,
    target: { x: 0, y: 1.55, z: 3.8 },
    lowerRadiusLimit: 7,
    upperRadiusLimit: 18.5
  }),
  nexusFocus: cameraPose('nexus-focus', {
    alpha: Math.PI / 2,
    beta: 1.04,
    radius: 10.2,
    target: { x: 0, y: 1.75, z: 0 },
    lowerRadiusLimit: 7,
    upperRadiusLimit: 14
  }),
  follow: cameraPose('follow', {
    alpha: Math.PI / 2,
    beta: 1.08,
    radius: 10.8,
    target: { x: 0, y: 1.35, z: 0 },
    lowerRadiusLimit: 6.5,
    upperRadiusLimit: 15.5
  })
});

export const EON_CITY_W747_OPERATIONS_CRESCENT = freeze({
  commandTable: freeze({ position: deepPoint({ x: 0, y: 0.46, z: -8.05 }), footprintRadius: 1.6 }),
  commandSeat: freeze({ position: deepPoint({ x: -2.55, y: 0, z: -8.45 }), rotationY: Math.PI, footprintRadius: 1.05 }),
  districtHologram: freeze({ position: deepPoint({ x: 2.65, y: 0, z: -8.35 }), rotationY: Math.PI, footprintRadius: 2.15 }),
  eonbotDock: freeze({ position: deepPoint({ x: 2.35, y: 0, z: 2.15 }), rotationY: Math.PI, footprintRadius: 0.8 }),
  canopy: freeze({ radius: 11.55, height: 7.2, columnRadius: 11.25, columnAngleOffset: Math.PI / 8 })
});

function finite(value) {
  return Number.isFinite(Number(value));
}

export function sanitizeEonCityW747WorldPoint(point = {}, { floorY = EON_CITY_W747_WORLD_FLOOR_Y } = {}) {
  const x = finite(point.x) ? Number(point.x) : 0;
  const y = finite(point.y) ? Math.max(Number(floorY), Number(point.y)) : Number(floorY);
  const z = finite(point.z) ? Number(point.z) : 0;
  return freeze({ x, y, z, sanitized: x !== point.x || y !== point.y || z !== point.z });
}

export function getEonCityW747Placement(id = '') {
  const key = String(id || '').trim().toLowerCase();
  return EON_CITY_W747_PRIMARY_PLACEMENTS.find((entry) => entry.id === key) || null;
}

export function deriveEonCityW747CameraPosition(pose = EON_CITY_W747_CAMERA_POSES.arrival) {
  const horizontalRadius = Number(pose.radius) * Math.sin(Number(pose.beta));
  return freeze({
    x: Number(pose.target.x) + Math.cos(Number(pose.alpha)) * horizontalRadius,
    y: Number(pose.target.y) + Math.cos(Number(pose.beta)) * Number(pose.radius),
    z: Number(pose.target.z) + Math.sin(Number(pose.alpha)) * horizontalRadius
  });
}

export function inspectEonCityW747CameraFloorSafety({
  position = {},
  target = {},
  beta = EON_CITY_W747_CAMERA_POSES.follow.beta,
  floorY = EON_CITY_W747_WORLD_FLOOR_Y,
  minimumCameraClearance = 0.35,
  minimumTargetHeight = 0.65,
  lowerBetaLimit = EON_CITY_W747_CAMERA_POSES.follow.lowerBetaLimit,
  upperBetaLimit = EON_CITY_W747_CAMERA_POSES.follow.upperBetaLimit
} = {}) {
  const safeFloor = finite(floorY) ? Number(floorY) : EON_CITY_W747_WORLD_FLOOR_Y;
  const cameraClearance = Math.max(0.05, Number(minimumCameraClearance || 0.35));
  const targetHeight = Math.max(0.05, Number(minimumTargetHeight || 0.65));
  const lowerBeta = Math.min(Number(lowerBetaLimit), Number(upperBetaLimit));
  const upperBeta = Math.max(Number(lowerBetaLimit), Number(upperBetaLimit));
  const reasons = [];
  if (![position.x, position.y, position.z].every(finite)) reasons.push('camera-position-non-finite');
  else if (Number(position.y) < safeFloor + cameraClearance) reasons.push('camera-below-floor-clearance');
  if (![target.x, target.y, target.z].every(finite)) reasons.push('camera-target-non-finite');
  else if (Number(target.y) < safeFloor + targetHeight) reasons.push('camera-target-below-safe-height');
  if (!finite(beta)) reasons.push('camera-beta-non-finite');
  else if (Number(beta) < lowerBeta - 0.001 || Number(beta) > upperBeta + 0.001) reasons.push('camera-beta-out-of-bounds');
  return freeze({
    ok: reasons.length === 0,
    reasons: freeze(reasons),
    floorY: safeFloor,
    minimumCameraY: safeFloor + cameraClearance,
    minimumTargetY: safeFloor + targetHeight,
    betaBounds: freeze({ lower: lowerBeta, upper: upperBeta })
  });
}

function circleDistance(left, right) {
  return Math.hypot(Number(left.position.x) - Number(right.position.x), Number(left.position.z) - Number(right.position.z));
}

export function inspectEonCityW747PrimaryFootprints(entries = EON_CITY_W747_PRIMARY_PLACEMENTS, {
  minimumClearance = 0.45,
  heroZone = EON_CITY_W747_HERO_ZONE
} = {}) {
  const overlaps = [];
  const heroZoneViolations = [];
  const records = Array.isArray(entries) ? entries : [];
  for (let index = 0; index < records.length; index += 1) {
    const entry = records[index];
    if (!entry?.id || !finite(entry?.position?.x) || !finite(entry?.position?.z) || !finite(entry?.footprintRadius)) {
      overlaps.push(freeze({ leftId: entry?.id || `index-${index}`, rightId: '', reason: 'invalid-footprint' }));
      continue;
    }
    if (entry.id !== 'eonbot-nexus') {
      const distance = Math.hypot(entry.position.x - heroZone.center.x, entry.position.z - heroZone.center.z);
      const required = heroZone.radius + entry.footprintRadius + heroZone.minimumPrimaryClearance;
      if (distance < required) heroZoneViolations.push(freeze({ id: entry.id, distance, required }));
    }
    for (let rightIndex = index + 1; rightIndex < records.length; rightIndex += 1) {
      const right = records[rightIndex];
      const distance = circleDistance(entry, right);
      const required = Number(entry.footprintRadius) + Number(right.footprintRadius) + Number(minimumClearance);
      if (distance < required) overlaps.push(freeze({ leftId: entry.id, rightId: right.id, distance, required }));
    }
  }
  return freeze({
    ok: overlaps.length === 0 && heroZoneViolations.length === 0,
    overlaps: freeze(overlaps),
    heroZoneViolations: freeze(heroZoneViolations),
    footprintCount: records.length
  });
}

function distancePointToSegment2d(point, from, to) {
  const dx = Number(to.x) - Number(from.x);
  const dz = Number(to.z) - Number(from.z);
  const denominator = dx * dx + dz * dz;
  const projection = denominator > 0
    ? Math.max(0, Math.min(1, (((Number(point.x) - Number(from.x)) * dx) + ((Number(point.z) - Number(from.z)) * dz)) / denominator))
    : 0;
  const x = Number(from.x) + dx * projection;
  const z = Number(from.z) + dz * projection;
  return Math.hypot(Number(point.x) - x, Number(point.z) - z);
}

export function inspectEonCityW747ArrivalCorridor(entries = EON_CITY_W747_PRIMARY_PLACEMENTS, corridor = EON_CITY_W747_ARRIVAL_CORRIDOR) {
  const blockers = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry?.id || entry.id === 'eonbot-nexus') continue;
    const distance = distancePointToSegment2d(entry.position, corridor.from, corridor.to);
    const required = Number(corridor.halfWidth) + Number(entry.footprintRadius || 0);
    if (distance < required) blockers.push(freeze({ id: entry.id, distance, required }));
  }
  return freeze({ ok: blockers.length === 0, blockers: freeze(blockers) });
}

function normalizeBoundPoint(point = {}) {
  return freeze({
    x: finite(point.x) ? Number(point.x) : 0,
    y: finite(point.y) ? Number(point.y) : 0,
    z: finite(point.z) ? Number(point.z) : 0
  });
}

export function normalizeEonCityW747Bounds(bounds = {}) {
  const min = normalizeBoundPoint(bounds.min);
  const max = normalizeBoundPoint(bounds.max);
  const normalized = freeze({
    min: freeze({ x: Math.min(min.x, max.x), y: Math.min(min.y, max.y), z: Math.min(min.z, max.z) }),
    max: freeze({ x: Math.max(min.x, max.x), y: Math.max(min.y, max.y), z: Math.max(min.z, max.z) })
  });
  return freeze({
    ...normalized,
    size: freeze({
      x: normalized.max.x - normalized.min.x,
      y: normalized.max.y - normalized.min.y,
      z: normalized.max.z - normalized.min.z
    }),
    center: freeze({
      x: (normalized.min.x + normalized.max.x) / 2,
      y: (normalized.min.y + normalized.max.y) / 2,
      z: (normalized.min.z + normalized.max.z) / 2
    })
  });
}

function segmentIntersectsAabb(from, to, bounds, padding = 0) {
  const box = normalizeEonCityW747Bounds(bounds);
  const min = { x: box.min.x - padding, y: box.min.y - padding, z: box.min.z - padding };
  const max = { x: box.max.x + padding, y: box.max.y + padding, z: box.max.z + padding };
  let low = 0;
  let high = 1;
  for (const axis of ['x', 'y', 'z']) {
    const start = Number(from[axis]);
    const delta = Number(to[axis]) - start;
    if (Math.abs(delta) < 1e-9) {
      if (start < min[axis] || start > max[axis]) return false;
      continue;
    }
    let near = (min[axis] - start) / delta;
    let far = (max[axis] - start) / delta;
    if (near > far) [near, far] = [far, near];
    low = Math.max(low, near);
    high = Math.min(high, far);
    if (low > high) return false;
  }
  return high >= 0 && low <= 1;
}

function boundsIntersectHeroZone(bounds, heroZone = EON_CITY_W747_HERO_ZONE) {
  const box = normalizeEonCityW747Bounds(bounds);
  const nearestX = Math.max(box.min.x, Math.min(heroZone.center.x, box.max.x));
  const nearestZ = Math.max(box.min.z, Math.min(heroZone.center.z, box.max.z));
  return Math.hypot(nearestX - heroZone.center.x, nearestZ - heroZone.center.z) < heroZone.radius;
}

function boundsOverlap2d(left, right, clearance = 0) {
  const a = normalizeEonCityW747Bounds(left);
  const b = normalizeEonCityW747Bounds(right);
  return a.min.x < b.max.x + clearance && a.max.x > b.min.x - clearance
    && a.min.z < b.max.z + clearance && a.max.z > b.min.z - clearance;
}

export function createEonCityW747SpatialDiagnostics({
  arrivalPose = EON_CITY_W747_CAMERA_POSES.arrival,
  heroZone = EON_CITY_W747_HERO_ZONE
} = {}) {
  const records = new Map();
  const cameraPosition = deriveEonCityW747CameraPosition(arrivalPose);
  const arrivalTarget = arrivalPose.target;

  const registerLoadedAsset = ({ id, bounds, primaryRole = '', groupId = '', allowHeroZone = false, allowArrivalRay = false, floorDecoration = false } = {}) => {
    const key = String(id || '').trim();
    if (!key || !bounds?.min || !bounds?.max) return freeze({ ok: false, reason: 'invalid-loaded-bound' });
    const normalizedBounds = normalizeEonCityW747Bounds(bounds);
    const record = freeze({
      id: key,
      bounds: normalizedBounds,
      primaryRole: String(primaryRole || ''),
      groupId: String(groupId || key),
      allowHeroZone: Boolean(allowHeroZone),
      allowArrivalRay: Boolean(allowArrivalRay),
      floorDecoration: Boolean(floorDecoration)
    });
    records.set(key, record);
    return freeze({ ok: true, record });
  };

  const unregisterLoadedAsset = (id = '') => records.delete(String(id || ''));

  const getReport = () => {
    const values = [...records.values()];
    const arrivalOccluders = values.filter((entry) => !entry.allowArrivalRay && segmentIntersectsAabb(cameraPosition, arrivalTarget, entry.bounds, 0.08));
    const heroZoneIntersections = values.filter((entry) => {
      if (entry.allowHeroZone) return false;
      if (entry.floorDecoration && entry.bounds.max.y <= heroZone.allowedFloorDecorationHeight) return false;
      return boundsIntersectHeroZone(entry.bounds, heroZone);
    });
    const primaryOverlaps = [];
    for (let index = 0; index < values.length; index += 1) {
      const left = values[index];
      if (!left.primaryRole) continue;
      for (let rightIndex = index + 1; rightIndex < values.length; rightIndex += 1) {
        const right = values[rightIndex];
        if (!right.primaryRole || left.groupId === right.groupId) continue;
        if (boundsOverlap2d(left.bounds, right.bounds, 0.2)) primaryOverlaps.push(freeze({ leftId: left.id, rightId: right.id }));
      }
    }
    const roleCounts = new Map();
    for (const entry of values) {
      if (!entry.primaryRole) continue;
      roleCounts.set(entry.primaryRole, (roleCounts.get(entry.primaryRole) || 0) + 1);
    }
    const duplicatePrimaryRoles = [...roleCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([role, count]) => freeze({ role, count }));
    const belowFloor = values.filter((entry) => entry.bounds.min.y < EON_CITY_W747_WORLD_FLOOR_Y - 0.08);
    return freeze({
      schema: EON_CITY_W747_SPATIAL_SCHEMA,
      ok: arrivalOccluders.length === 0 && heroZoneIntersections.length === 0 && primaryOverlaps.length === 0 && duplicatePrimaryRoles.length === 0 && belowFloor.length === 0,
      registeredBoundCount: values.length,
      arrivalOccluders: freeze(arrivalOccluders.map((entry) => entry.id)),
      heroZoneIntersections: freeze(heroZoneIntersections.map((entry) => entry.id)),
      primaryOverlaps: freeze(primaryOverlaps),
      duplicatePrimaryRoles: freeze(duplicatePrimaryRoles),
      belowFloor: freeze(belowFloor.map((entry) => entry.id)),
      cameraPosition,
      arrivalTarget
    });
  };

  return freeze({
    schema: EON_CITY_W747_SPATIAL_SCHEMA,
    registerLoadedAsset,
    unregisterLoadedAsset,
    getReport,
    listLoadedBounds: () => freeze([...records.values()])
  });
}

export function validateEonCityW747SpatialFoundation() {
  const errors = [];
  if (EON_CITY_W747_HERO_ZONE.diameter < 10 || EON_CITY_W747_HERO_ZONE.diameter > 12) errors.push('hero-zone-diameter');
  if (EON_CITY_W747_FIVE_WING_ANCHORS.length !== 5) errors.push('wing-count');
  if (new Set(EON_CITY_W747_FIVE_WING_ANCHORS.map((entry) => entry.id)).size !== 5) errors.push('wing-ids');
  if (EON_CITY_W747_PRIMARY_PLACEMENTS.length !== 10) errors.push('placement-count');
  if (new Set(EON_CITY_W747_PRIMARY_PLACEMENTS.map((entry) => entry.id)).size !== 10) errors.push('placement-ids');
  const footprints = inspectEonCityW747PrimaryFootprints();
  if (!footprints.ok) errors.push('primary-footprints');
  const corridor = inspectEonCityW747ArrivalCorridor();
  if (!corridor.ok) errors.push('arrival-corridor');
  for (const pose of Object.values(EON_CITY_W747_CAMERA_POSES)) {
    const values = [pose.alpha, pose.beta, pose.radius, pose.target.x, pose.target.y, pose.target.z];
    if (!values.every(finite)) errors.push(`camera-finite:${pose.id}`);
    if (pose.target.y < EON_CITY_W747_WORLD_FLOOR_Y) errors.push(`camera-target-floor:${pose.id}`);
    const cameraPosition = deriveEonCityW747CameraPosition(pose);
    if (![cameraPosition.x, cameraPosition.y, cameraPosition.z].every(finite) || cameraPosition.y <= EON_CITY_W747_WORLD_FLOOR_Y) errors.push(`camera-position:${pose.id}`);
  }
  const centralShellRoles = EON_CITY_W747_PRIMARY_PLACEMENTS.filter((entry) => entry.primaryRole === 'command-centre-shell');
  if (centralShellRoles.length > 0) errors.push('central-shell-not-retired');
  return freeze({
    schema: EON_CITY_W747_SPATIAL_SCHEMA,
    ok: errors.length === 0,
    errors: freeze(errors),
    footprintReport: footprints,
    corridorReport: corridor
  });
}
