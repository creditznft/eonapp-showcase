/**
 * W765R6 — deterministic spatial-control repair authority.
 *
 * Babylon-free contracts keep spawn clearance, structural supports, route
 * visibility and NPC lanes testable before the scene is created.
 */
const freeze = (value) => Object.freeze(value);
const point = (value = {}) => freeze({ x: Number(value.x || 0), y: Number(value.y || 0), z: Number(value.z || 0) });
const distance2d = (left = {}, right = {}) => Math.hypot(Number(left.x || 0) - Number(right.x || 0), Number(left.z || 0) - Number(right.z || 0));

export const EON_CITY_W765R6_SPATIAL_REPAIR_SCHEMA = 'eon.city.spatial-control-repair.w765r6.v1';

export const EON_CITY_W765R6_CAMERA_SAFE_ZONE = freeze({
  center: point({ x: 0, y: 0, z: 7.2 }),
  radius: 4.2,
  corridorFrom: point({ x: 0, y: 0, z: 16.2 }),
  corridorTo: point({ x: 0, y: 0, z: 2.8 }),
  halfWidth: 3.15,
  minimumVerticalClearance: 2.4
});

// Four slim diagonal supports preserve the canopy silhouette without creating
// a forest of black columns across the spawn and station approach corridors.
export const EON_CITY_W765R6_CANOPY_SUPPORTS = freeze([
  freeze({ id: 'north-west', angle: Math.PI * 1.25, radius: 11.65, width: 0.32, depth: 0.42, height: 4.15 }),
  freeze({ id: 'north-east', angle: Math.PI * 0.75, radius: 11.65, width: 0.32, depth: 0.42, height: 4.15 }),
  freeze({ id: 'south-west', angle: Math.PI * 1.75, radius: 11.65, width: 0.32, depth: 0.42, height: 4.15 }),
  freeze({ id: 'south-east', angle: Math.PI * 0.25, radius: 11.65, width: 0.32, depth: 0.42, height: 4.15 })
]);

export const EON_CITY_W765R6_ROUTE_VISUAL_POLICY = freeze({
  floorOnly: true,
  inactiveOpacity: 0.34,
  activeOpacity: 0.82,
  maximumRaisedDecorationY: 0.24,
  maximumTraceWidth: 0.12,
  cameraCorridorClearance: 0.45
});

export const EON_CITY_W765R6_DISCOVERY_POLICY = freeze({
  'transit-overlook': freeze({ visible: true, interactive: true, action: 'inspect' }),
  'maintenance-relay': freeze({ visible: true, interactive: true, action: 'inspect' }),
  'expanse-gate': freeze({ visible: true, interactive: true, action: 'review-enter-cancel', truthfulRole: 'canonical-expanse-entry-gateway' })
});

function distancePointToSegment2d(value, from, to) {
  const dx = Number(to.x) - Number(from.x);
  const dz = Number(to.z) - Number(from.z);
  const denominator = dx * dx + dz * dz;
  const projection = denominator > 0
    ? Math.max(0, Math.min(1, (((Number(value.x) - Number(from.x)) * dx) + ((Number(value.z) - Number(from.z)) * dz)) / denominator))
    : 0;
  const x = Number(from.x) + dx * projection;
  const z = Number(from.z) + dz * projection;
  return Math.hypot(Number(value.x) - x, Number(value.z) - z);
}

export function inspectEonCityW765R6CanopySupports(supports = EON_CITY_W765R6_CANOPY_SUPPORTS, safeZone = EON_CITY_W765R6_CAMERA_SAFE_ZONE) {
  const violations = [];
  for (const support of supports) {
    const position = { x: Math.sin(support.angle) * support.radius, z: Math.cos(support.angle) * support.radius };
    const corridorDistance = distancePointToSegment2d(position, safeZone.corridorFrom, safeZone.corridorTo);
    const footprintRadius = Math.hypot(support.width, support.depth) / 2;
    if (corridorDistance < safeZone.halfWidth + footprintRadius) violations.push(freeze({ id: support.id, reason: 'camera-corridor', corridorDistance }));
    if (distance2d(position, safeZone.center) < safeZone.radius + footprintRadius) violations.push(freeze({ id: support.id, reason: 'camera-safe-zone' }));
  }
  return freeze({ ok: violations.length === 0, violations: freeze(violations), supportCount: supports.length });
}

export function createEonCityW765R6NpcExclusionZones(stations = []) {
  return freeze((Array.isArray(stations) ? stations : []).map((station) => freeze({
    id: `station:${station.id}`,
    stationId: station.id,
    center: point(station.position),
    radius: Number(station.footprintRadius || 2.5) + 0.72,
    blocksAmbientNpc: true,
    blocksCrossZoneNpc: true,
    allowsAssignedStationNpc: true
  })));
}



export const EON_CITY_W765R6_PLAYER_COLLISION_RADIUS = 0.42;

export function createEonCityW765R6PlayerCollisionZones(entries = [], { margin = EON_CITY_W765R6_PLAYER_COLLISION_RADIUS } = {}) {
  const safeMargin = Math.max(0, Number(margin || 0));
  return freeze((Array.isArray(entries) ? entries : []).flatMap((entry) => {
    const center = entry?.center || entry?.position;
    const baseRadius = Number(entry?.radius ?? entry?.footprintRadius ?? 0);
    if (!center || !Number.isFinite(Number(center.x)) || !Number.isFinite(Number(center.z)) || !Number.isFinite(baseRadius) || baseRadius <= 0) return [];
    return [freeze({
      id: String(entry?.id || entry?.stationId || 'collision-zone'),
      kind: String(entry?.kind || 'structure'),
      center: point(center),
      radius: baseRadius + safeMargin
    })];
  }));
}

function projectOutsideCircle(value, previous, zone) {
  const dx = Number(value.x || 0) - Number(zone.center.x || 0);
  const dz = Number(value.z || 0) - Number(zone.center.z || 0);
  const distance = Math.hypot(dx, dz);
  if (distance >= Number(zone.radius || 0)) return { ...value, blocked: false };

  const previousDx = Number(previous.x || 0) - Number(zone.center.x || 0);
  const previousDz = Number(previous.z || 0) - Number(zone.center.z || 0);
  const previousDistance = Math.hypot(previousDx, previousDz);
  // If a saved/legacy pose starts inside a new exclusion zone, always permit
  // movement that increases clearance so the player can escape naturally.
  if (previousDistance < Number(zone.radius || 0) && distance > previousDistance + 0.0001) {
    return { ...value, blocked: false, escaping: true };
  }

  const basisX = distance > 0.0001 ? dx / distance : previousDistance > 0.0001 ? previousDx / previousDistance : 1;
  const basisZ = distance > 0.0001 ? dz / distance : previousDistance > 0.0001 ? previousDz / previousDistance : 0;
  return {
    ...value,
    x: Number(zone.center.x || 0) + basisX * Number(zone.radius || 0),
    z: Number(zone.center.z || 0) + basisZ * Number(zone.radius || 0),
    blocked: true,
    zoneId: zone.id
  };
}

export function resolveEonCityW765R6PlayerCollision(requested = {}, previous = {}, zones = []) {
  let candidate = point(requested);
  const previousPoint = point(previous);
  const collisions = [];
  for (const zone of Array.isArray(zones) ? zones : []) {
    const projected = projectOutsideCircle(candidate, previousPoint, zone);
    if (projected.blocked) collisions.push(String(zone.id || 'collision-zone'));
    candidate = point(projected);
  }
  return freeze({
    x: candidate.x,
    y: candidate.y,
    z: candidate.z,
    collisionBlocked: collisions.length > 0,
    collisionZoneIds: freeze(collisions)
  });
}

export function isEonCityW765R6PositionCollisionFree(position = {}, zones = []) {
  const candidate = point(position);
  const blockingZoneIds = [];
  for (const zone of Array.isArray(zones) ? zones : []) {
    if (distance2d(candidate, zone.center) < Number(zone.radius || 0) - 0.0001) blockingZoneIds.push(String(zone.id || 'collision-zone'));
  }
  return freeze({ ok: blockingZoneIds.length === 0, position: candidate, blockingZoneIds: freeze(blockingZoneIds) });
}

/**
 * Finds a deterministic nearby recovery pose without teleporting the player to
 * the global spawn unless no local solution is available. This is used by the
 * visible "unstuck" recovery action and by saved-pose repair. The search is
 * bounded, Babylon-free and stable across browsers so it can be regression
 * tested without creating a 3D scene.
 */
export function findEonCityW765R6NearestSafePosition(position = {}, zones = [], {
  fallback = { x: 0, y: 0, z: 8.8 },
  worldRadius = 25.5,
  step = 0.7,
  rings = 18,
  samplesPerRing = 24
} = {}) {
  const origin = point(position);
  const clampWorld = (candidate) => {
    const distance = Math.hypot(Number(candidate.x || 0), Number(candidate.z || 0));
    const limit = Math.max(0.5, Number(worldRadius || 25.5));
    if (distance <= limit || distance <= 0.0001) return point(candidate);
    const scale = limit / distance;
    return point({ x: Number(candidate.x || 0) * scale, y: Number(candidate.y || 0), z: Number(candidate.z || 0) * scale });
  };
  const originCheck = isEonCityW765R6PositionCollisionFree(origin, zones);
  if (originCheck.ok) return freeze({ ok: true, recovered: false, reason: 'already-safe', position: originCheck.position, distance: 0 });

  const safeStep = Math.max(0.2, Number(step || 0.7));
  const ringCount = Math.max(1, Math.floor(Number(rings || 18)));
  const sampleCount = Math.max(8, Math.floor(Number(samplesPerRing || 24)));
  for (let ring = 1; ring <= ringCount; ring += 1) {
    const radius = ring * safeStep;
    for (let sample = 0; sample < sampleCount; sample += 1) {
      const angle = (Math.PI * 2 * sample) / sampleCount;
      const candidate = clampWorld({ x: origin.x + Math.sin(angle) * radius, y: origin.y, z: origin.z + Math.cos(angle) * radius });
      const check = isEonCityW765R6PositionCollisionFree(candidate, zones);
      if (check.ok) return freeze({ ok: true, recovered: true, reason: 'nearest-safe-ring', position: check.position, distance: distance2d(origin, check.position), ring, sample });
    }
  }
  const safeFallback = clampWorld(fallback);
  const fallbackCheck = isEonCityW765R6PositionCollisionFree(safeFallback, zones);
  return freeze({
    ok: fallbackCheck.ok,
    recovered: fallbackCheck.ok,
    reason: fallbackCheck.ok ? 'fallback-safe-position' : 'no-safe-position-found',
    position: fallbackCheck.ok ? fallbackCheck.position : origin,
    distance: fallbackCheck.ok ? distance2d(origin, fallbackCheck.position) : 0,
    blockingZoneIds: fallbackCheck.blockingZoneIds
  });
}
export function inspectEonCityW765R6NpcRoute(route = [], exclusionZones = [], { allowedStationId = '' } = {}) {
  const violations = [];
  const points = Array.isArray(route) ? route : [];
  for (const [index, waypoint] of points.entries()) {
    for (const zone of exclusionZones) {
      if (allowedStationId && zone.stationId === allowedStationId) continue;
      const distance = distance2d(waypoint, zone.center);
      if (distance < zone.radius) violations.push(freeze({ waypointIndex: index, zoneId: zone.id, distance, required: zone.radius }));
    }
    if (distance2d(waypoint, EON_CITY_W765R6_CAMERA_SAFE_ZONE.center) < EON_CITY_W765R6_CAMERA_SAFE_ZONE.radius) {
      violations.push(freeze({ waypointIndex: index, zoneId: 'camera-safe-zone', distance: distance2d(waypoint, EON_CITY_W765R6_CAMERA_SAFE_ZONE.center), required: EON_CITY_W765R6_CAMERA_SAFE_ZONE.radius }));
    }
  }
  return freeze({ ok: violations.length === 0, violations: freeze(violations), waypointCount: points.length });
}

export function validateEonCityW765R6DiscoveryPolicy(discoveries = []) {
  const ids = new Set((Array.isArray(discoveries) ? discoveries : []).map((entry) => String(entry.id || '')));
  const missing = Object.keys(EON_CITY_W765R6_DISCOVERY_POLICY).filter((id) => !ids.has(id));
  const dead = Object.entries(EON_CITY_W765R6_DISCOVERY_POLICY)
    .filter(([, policy]) => policy.visible && (!policy.interactive || !policy.action))
    .map(([id]) => id);
  return freeze({ ok: missing.length === 0 && dead.length === 0, missing: freeze(missing), dead: freeze(dead) });
}

export function inspectEonCityW765R6MonitorLayout(stations = [], profiles = {}, resolvePose = null) {
  const records = [];
  const violations = [];
  for (const station of Array.isArray(stations) ? stations : []) {
    const profile = profiles?.[station.id];
    if (!profile || typeof resolvePose !== 'function') {
      violations.push(freeze({ stationId: station.id, reason: 'monitor-contract-missing' }));
      continue;
    }
    const pose = resolvePose({ station, profile });
    if (!pose?.ok) {
      violations.push(freeze({ stationId: station.id, reason: 'monitor-pose-invalid' }));
      continue;
    }
    const footprintRadius = Math.hypot(Number(profile.width || 0), Number(profile.height || 0)) * 0.5;
    const safeDistance = distance2d(pose.worldPosition, EON_CITY_W765R6_CAMERA_SAFE_ZONE.center);
    if (safeDistance < EON_CITY_W765R6_CAMERA_SAFE_ZONE.radius + footprintRadius * 0.35) {
      violations.push(freeze({ stationId: station.id, reason: 'camera-safe-zone', distance: safeDistance }));
    }
    records.push(freeze({ stationId: station.id, worldPosition: point(pose.worldPosition), footprintRadius }));
  }
  for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < records.length; rightIndex += 1) {
      const left = records[leftIndex];
      const right = records[rightIndex];
      const separation = distance2d(left.worldPosition, right.worldPosition);
      const required = (left.footprintRadius + right.footprintRadius) * 0.55;
      if (separation < required) violations.push(freeze({ stationId: left.stationId, otherStationId: right.stationId, reason: 'monitor-overlap', separation, required }));
    }
  }
  return freeze({ ok: violations.length === 0, records: freeze(records), violations: freeze(violations) });
}

export function auditEonCityW765R6VisibleDestinations({ stations = [], discoveries = [], interactionIds = [] } = {}) {
  const ids = new Set((Array.isArray(interactionIds) ? interactionIds : []).map((value) => String(value || '')));
  const missing = [];
  for (const station of Array.isArray(stations) ? stations : []) {
    if (!station?.id || !station?.label || !station?.surface || !station?.npc?.action) {
      missing.push(freeze({ id: station?.id || '', kind: 'station', reason: 'incomplete-destination-contract' }));
      continue;
    }
    if (!ids.has(`station:${station.id}:structure`) && !ids.has(`station:${station.id}`)) {
      missing.push(freeze({ id: station.id, kind: 'station', reason: 'interaction-not-registered' }));
    }
  }
  for (const discovery of Array.isArray(discoveries) ? discoveries : []) {
    const policy = EON_CITY_W765R6_DISCOVERY_POLICY[discovery?.id];
    if (!policy?.visible) continue;
    if (!discovery?.label || !discovery?.npc?.action || !policy.interactive || !policy.action) {
      missing.push(freeze({ id: discovery?.id || '', kind: 'discovery', reason: 'dead-visible-destination' }));
      continue;
    }
    if (!ids.has(`discovery:${discovery.id}`)) missing.push(freeze({ id: discovery.id, kind: 'discovery', reason: 'interaction-not-registered' }));
  }
  return freeze({ ok: missing.length === 0, missing: freeze(missing) });
}

export function resolveEonCityW765R6AnimationReturnState({ moving = false, running = false, interactionUntil = 0, now = 0 } = {}) {
  if (Number(interactionUntil || 0) > Number(now || 0)) return 'interact';
  if (running) return 'run';
  if (moving) return 'walk';
  return 'idle';
}
