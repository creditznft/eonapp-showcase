const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const EON_EXPANSE_W766D_ROUTE_SCHEMA = 'eon.city.expanse.routes.w766d.v1';
export const EON_EXPANSE_W766D_ROUTE_GRAPHS = freeze([
  freeze({ id: 'pathfinder-gateway-patrol', npcId: 'pathfinder-guide', loop: true, points: freeze([{ x: -4, z: 12 }, { x: -7, z: 4 }, { x: -2, z: -5 }, { x: 4, z: 2 }]) }),
  freeze({ id: 'navigator-archive-loop', npcId: 'archive-navigator', loop: true, points: freeze([{ x: 35, z: -43 }, { x: 43, z: -52 }, { x: 50, z: -44 }, { x: 42, z: -38 }]) }),
  freeze({ id: 'maintenance-transit-loop', npcId: 'transit-maintainer', loop: true, points: freeze([{ x: -18, z: -78 }, { x: -10, z: -88 }, { x: -4, z: -98 }, { x: -15, z: -96 }]) })
]);

export function validateEonExpanseW766DRouteGraph(graph = {}, { maxSegmentLength = 24, worldBounds = 220, blockers = [] } = {}) {
  const errors = [];
  if (!graph.id || !graph.npcId) errors.push('identity-required');
  if (!Array.isArray(graph.points) || graph.points.length < 2) errors.push('minimum-two-points');
  const points = Array.isArray(graph.points) ? graph.points : [];
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.z)) errors.push(`point-${index}-invalid`);
    if (Math.abs(finite(point?.x)) > worldBounds || Math.abs(finite(point?.z)) > worldBounds) errors.push(`point-${index}-outside-world`);
    const next = points[index + 1] || (graph.loop ? points[0] : null);
    if (next && Math.hypot(next.x - point.x, next.z - point.z) > maxSegmentLength) errors.push(`segment-${index}-too-long`);
    for (const blocker of blockers) {
      const distance = Math.hypot(point.x - finite(blocker.x), point.z - finite(blocker.z));
      if (distance < finite(blocker.radius, 0) + 0.8) errors.push(`point-${index}-inside-blocker:${blocker.id || 'unknown'}`);
    }
  }
  return freeze({ ok: errors.length === 0, errors: freeze([...new Set(errors)]) });
}

export function validateEonExpanseW766DRouteRegistry(routes = EON_EXPANSE_W766D_ROUTE_GRAPHS, options = {}) {
  const seen = new Set(); const failures = [];
  for (const route of routes) {
    if (seen.has(route.id)) failures.push(`${route.id}:duplicate-id`);
    seen.add(route.id);
    const result = validateEonExpanseW766DRouteGraph(route, options);
    if (!result.ok) failures.push(...result.errors.map((error) => `${route.id}:${error}`));
  }
  return freeze({ ok: failures.length === 0, failures: freeze(failures), routeCount: routes.length });
}

export function sampleEonExpanseW766DRoutePosition(graph, distance = 0) {
  const points = graph?.points || [];
  if (points.length < 2) return freeze({ x: finite(points[0]?.x), z: finite(points[0]?.z), heading: 0, segment: 0 });
  const segments = [];
  for (let index = 0; index < points.length - 1 + (graph.loop ? 1 : 0); index += 1) {
    const from = points[index % points.length]; const to = points[(index + 1) % points.length];
    segments.push({ from, to, length: Math.hypot(to.x - from.x, to.z - from.z), index });
  }
  const total = segments.reduce((sum, segment) => sum + segment.length, 0) || 1;
  let cursor = ((finite(distance) % total) + total) % total;
  for (const segment of segments) {
    if (cursor <= segment.length) {
      const t = segment.length ? cursor / segment.length : 0;
      return freeze({ x: segment.from.x + (segment.to.x - segment.from.x) * t, z: segment.from.z + (segment.to.z - segment.from.z) * t, heading: Math.atan2(segment.to.x - segment.from.x, segment.to.z - segment.from.z), segment: segment.index });
    }
    cursor -= segment.length;
  }
  return freeze({ x: points[0].x, z: points[0].z, heading: 0, segment: 0 });
}
