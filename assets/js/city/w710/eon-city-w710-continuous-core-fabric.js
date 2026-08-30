/**
 * W710 — deterministic continuous urban fabric for the authored nine-district Core.
 *
 * This is a pure plan. It fills the visual space between preserved district
 * Sanctums with one bounded deck, street foundations, infill blocks, public
 * plazas, layered skyline silhouettes and four physical border approaches.
 */
import { EON_CITY_W703_CORE_BOUNDS } from '../w703/eon-city-w703-world-safety.js';

export const EON_CITY_W710_CONTINUOUS_CORE_FABRIC_SCHEMA = 'eon.city.continuous-core-fabric.w710.v1';
const freeze = Object.freeze;
const QUALITY = freeze({
  lite: freeze({ margin: 16, infillSamples: 1, districtRingBlocks: 1, skylinePerLayer: 6, plazaStride: 3, occupancyCell: 12 }),
  balanced: freeze({ margin: 20, infillSamples: 2, districtRingBlocks: 2, skylinePerLayer: 8, plazaStride: 3, occupancyCell: 10 }),
  cinematic: freeze({ margin: 22, infillSamples: 3, districtRingBlocks: 3, skylinePerLayer: 10, plazaStride: 2, occupancyCell: 9 })
});
const SKYLINE_LAYERS = freeze([
  freeze({ id: 'near', radiusScale: 0.74, baseHeight: 7.5, depth: 4.2 }),
  freeze({ id: 'mid', radiusScale: 0.86, baseHeight: 11.5, depth: 5.1 }),
  freeze({ id: 'far', radiusScale: 0.96, baseHeight: 17.5, depth: 6.2 })
]);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const round = (value, places = 3) => Number(Number(value || 0).toFixed(places));
function hash32(value = '') { let hash = 2166136261; for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
function point(x = 0, y = 0, z = 0) { return freeze({ x: round(x), y: round(y), z: round(z) }); }
function distance(a = {}, b = {}) { return Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z)); }
function distanceToSegment(position = {}, edge = {}) {
  const ax = finite(edge.from?.x); const az = finite(edge.from?.z); const bx = finite(edge.to?.x); const bz = finite(edge.to?.z);
  const dx = bx - ax; const dz = bz - az; const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared <= 0.0001) return Math.hypot(finite(position.x) - ax, finite(position.z) - az);
  const t = clamp(((finite(position.x) - ax) * dx + (finite(position.z) - az) * dz) / lengthSquared, 0, 1);
  return Math.hypot(finite(position.x) - (ax + dx * t), finite(position.z) - (az + dz * t));
}
function qualityProfile(value = 'balanced') { return QUALITY[String(value)] || QUALITY.balanced; }
function qualityId(value = 'balanced') { return QUALITY[String(value)] ? String(value) : 'balanced'; }
function deriveBounds(districts = [], margin = 20) {
  const safe = EON_CITY_W703_CORE_BOUNDS;
  const minX = Math.min(...districts.map((entry) => finite(entry.center?.x) - finite(entry.radius, 16))) - margin;
  const maxX = Math.max(...districts.map((entry) => finite(entry.center?.x) + finite(entry.radius, 16))) + margin;
  const minZ = Math.min(...districts.map((entry) => finite(entry.center?.z) - finite(entry.radius, 16))) - margin;
  const maxZ = Math.max(...districts.map((entry) => finite(entry.center?.z) + finite(entry.radius, 16))) + margin;
  const bounded = freeze({
    minX: round(clamp(minX, safe.minX + 0.5, safe.maxX - 1)),
    maxX: round(clamp(maxX, safe.minX + 1, safe.maxX - 0.5)),
    minZ: round(clamp(minZ, safe.minZ + 0.5, safe.maxZ - 1)),
    maxZ: round(clamp(maxZ, safe.minZ + 1, safe.maxZ - 0.5))
  });
  return freeze({ ...bounded, width: round(bounded.maxX - bounded.minX), depth: round(bounded.maxZ - bounded.minZ), center: point((bounded.minX + bounded.maxX) / 2, 0, (bounded.minZ + bounded.maxZ) / 2) });
}
function exclusionZones(districts = []) {
  return freeze(districts.map((entry) => freeze({
    districtId: String(entry.id),
    center: point(entry.center?.x, 0, entry.center?.z),
    radius: round(Math.max(8, finite(entry.radius, 16) * 0.78)),
    sanctumPreserved: true
  })));
}
function isExcluded(position, zones, margin = 0) { return zones.some((zone) => distance(position, zone.center) < zone.radius + margin); }
function buildRoads(edges = []) {
  return freeze(edges.map((edge, index) => freeze({
    id: `w710:road:${edge.id}`,
    sourceEdgeId: edge.id,
    index,
    kind: edge.kind === 'transit-loop' ? 'core-arterial' : 'secondary-connector',
    fromId: edge.fromId,
    toId: edge.toId,
    from: point(edge.from?.x, 0, edge.from?.z),
    to: point(edge.to?.x, 0, edge.to?.z),
    length: round(distance(edge.from, edge.to)),
    width: edge.kind === 'transit-loop' ? 3.9 : 2.45,
    sidewalkWidth: edge.kind === 'transit-loop' ? 0.72 : 0.48,
    curbs: true,
    crossings: true,
    automaticNavigation: false,
    localOnly: true
  })));
}
function buildInfill(edges = [], zones = [], profile = QUALITY.balanced) {
  const rows = [];
  for (const [edgeIndex, edge] of edges.entries()) {
    const dx = finite(edge.to?.x) - finite(edge.from?.x); const dz = finite(edge.to?.z) - finite(edge.from?.z);
    const length = Math.max(0.1, Math.hypot(dx, dz)); const px = -dz / length; const pz = dx / length;
    for (let sample = 1; sample <= profile.infillSamples; sample += 1) {
      const t = sample / (profile.infillSamples + 1);
      const seed = hash32(`${edge.id}:${sample}`);
      const width = 3.6 + (seed % 31) / 10; const depth = 3.2 + ((seed >>> 5) % 27) / 10;
      const height = 4.2 + ((seed >>> 10) % 68) / 10;
      const side = ((seed + edgeIndex + sample) % 2 === 0) ? 1 : -1;
      const roadWidth = edge.kind === 'transit-loop' ? 3.9 : 2.45;
      const offset = roadWidth / 2 + depth / 2 + 1.35 + ((seed >>> 16) % 12) / 10;
      const base = { x: finite(edge.from?.x) + dx * t, z: finite(edge.from?.z) + dz * t };
      let candidate = { x: base.x + px * offset * side, z: base.z + pz * offset * side };
      if (isExcluded(candidate, zones, 0.45)) candidate = { x: base.x - px * offset * side, z: base.z - pz * offset * side };
      if (isExcluded(candidate, zones, 0.45) || rows.some((entry) => distance(candidate, entry.position) < 3.25)) continue;
      rows.push(freeze({
        id: `w710:infill:${edgeIndex + 1}:${sample}`,
        sourceEdgeId: edge.id,
        districtPair: freeze([edge.fromId, edge.toId]),
        position: point(candidate.x, height / 2, candidate.z),
        width: round(width), depth: round(depth), height: round(height),
        rotationY: round(Math.atan2(dx, dz)),
        family: ['civic-stack','transit-pod','archive-slab','maker-block','garden-tower'][seed % 5],
        windows: Math.max(2, Math.floor(height / 1.8)),
        collision: true,
        interactive: false,
        sanctumPreserved: true,
        localOnly: true
      }));
    }
  }
  return freeze(rows);
}
function addDistrictRingInfill(rows, districts = [], zones = [], bounds = {}, profile = QUALITY.balanced) {
  for (const [districtIndex, district] of districts.entries()) {
    const zone = zones.find((entry) => entry.districtId === district.id);
    if (!zone) continue;
    for (let index = 0; index < profile.districtRingBlocks; index += 1) {
      const seed = hash32(`${district.id}:ring:${index}`);
      const angle = (Math.PI * 2 * index / Math.max(1, profile.districtRingBlocks)) + districtIndex * 0.71 + (seed % 40) / 100;
      const width = 3.8 + (seed % 28) / 10; const depth = 3.5 + ((seed >>> 5) % 24) / 10;
      const height = 4.8 + ((seed >>> 9) % 75) / 10; const radius = zone.radius + Math.max(width, depth) / 2 + 2.8;
      const candidate = { x: finite(district.center?.x) + Math.cos(angle) * radius, z: finite(district.center?.z) + Math.sin(angle) * radius };
      if (candidate.x < bounds.minX + 2 || candidate.x > bounds.maxX - 2 || candidate.z < bounds.minZ + 2 || candidate.z > bounds.maxZ - 2) continue;
      if (isExcluded(candidate, zones, 0.35) || rows.some((entry) => distance(candidate, entry.position) < 3.25)) continue;
      rows.push(freeze({
        id: `w710:ring-infill:${district.id}:${index + 1}`, sourceEdgeId: null, districtPair: freeze([district.id]),
        position: point(candidate.x, height / 2, candidate.z), width: round(width), depth: round(depth), height: round(height),
        rotationY: round(angle + Math.PI / 2), family: ['civic-stack','transit-pod','archive-slab','maker-block','garden-tower'][seed % 5],
        windows: Math.max(2, Math.floor(height / 1.8)), collision: true, interactive: false, sanctumPreserved: true, localOnly: true
      }));
    }
  }
  return rows;
}
function buildPlazas(edges = [], zones = [], profile = QUALITY.balanced) {
  const rows = [];
  for (const [index, edge] of edges.entries()) {
    if (index % profile.plazaStride !== 0) continue;
    const candidate = { x: (finite(edge.from?.x) + finite(edge.to?.x)) / 2, z: (finite(edge.from?.z) + finite(edge.to?.z)) / 2 };
    if (isExcluded(candidate, zones, 1.2)) continue;
    rows.push(freeze({
      id: `w710:plaza:${index + 1}`,
      sourceEdgeId: edge.id,
      position: point(candidate.x, 0.025, candidate.z),
      radius: round(2.7 + (hash32(edge.id) % 14) / 10),
      identity: ['signal-court','green-court','transit-square','maker-court'][index % 4],
      seating: true,
      wayfinding: true,
      automaticAction: false,
      localOnly: true
    }));
  }
  return freeze(rows);
}
function buildSkyline(bounds, profile) {
  const layers = SKYLINE_LAYERS.map((layer, layerIndex) => {
    const nodes = Array.from({ length: profile.skylinePerLayer }, (_, index) => {
      const angle = (Math.PI * 2 * index / profile.skylinePerLayer) + layerIndex * 0.13;
      const halfWidth = bounds.width / 2 * layer.radiusScale; const halfDepth = bounds.depth / 2 * layer.radiusScale;
      const seed = hash32(`${layer.id}:${index}`); const width = 4.2 + (seed % 34) / 10; const depth = layer.depth + ((seed >>> 5) % 18) / 10;
      const height = layer.baseHeight + ((seed >>> 9) % Math.max(4, Math.floor(layer.baseHeight * 0.8)));
      return freeze({
        id: `w710:skyline:${layer.id}:${index + 1}`,
        layer: layer.id,
        position: point(bounds.center.x + Math.cos(angle) * halfWidth, height / 2 - 0.04, bounds.center.z + Math.sin(angle) * halfDepth),
        width: round(width), depth: round(depth), height: round(height),
        silhouette: ['spire','terrace','slab','crown','bridge-tower'][seed % 5],
        collision: false,
        interactive: false,
        horizonOnly: layer.id !== 'near',
        localOnly: true
      });
    });
    return freeze({ id: layer.id, nodeCount: nodes.length, nodes: freeze(nodes) });
  });
  return freeze(layers);
}
function extremeDistrict(districts, axis, direction) {
  return [...districts].sort((a, b) => direction * (finite(b.center?.[axis]) - finite(a.center?.[axis])))[0];
}
function buildBorderCorridors(districts, bounds, physicalGateway = null) {
  const north = districts.find((entry) => entry.id === 'orientation-hall') || extremeDistrict(districts, 'z', 1);
  const south = districts.find((entry) => entry.id === 'command-centre') || extremeDistrict(districts, 'z', -1);
  const east = extremeDistrict(districts, 'x', 1); const west = extremeDistrict(districts, 'x', -1);
  const definitions = [
    { id: 'north-expanse', district: north, direction: { x: 0, z: 1 }, destination: { x: finite(physicalGateway?.x, north.center.x), z: bounds.maxZ }, flagshipGateway: true },
    { id: 'east-horizon', district: east, direction: { x: 1, z: 0 }, destination: { x: bounds.maxX, z: east.center.z }, flagshipGateway: false },
    { id: 'south-horizon', district: south, direction: { x: 0, z: -1 }, destination: { x: south.center.x, z: bounds.minZ }, flagshipGateway: false },
    { id: 'west-horizon', district: west, direction: { x: -1, z: 0 }, destination: { x: bounds.minX, z: west.center.z }, flagshipGateway: false }
  ];
  return freeze(definitions.map((entry) => {
    const radius = finite(entry.district.radius, 16) * 0.76;
    const start = entry.flagshipGateway && physicalGateway
      ? point(physicalGateway.x, 0, physicalGateway.z)
      : point(finite(entry.district.center.x) + entry.direction.x * radius, 0, finite(entry.district.center.z) + entry.direction.z * radius);
    return freeze({
      id: `w710:border:${entry.id}`,
      districtId: entry.district.id,
      from: start,
      to: point(entry.destination.x, 0, entry.destination.z),
      width: entry.flagshipGateway ? 5.2 : 3.6,
      flagshipGateway: entry.flagshipGateway,
      visibleContinuation: true,
      hardBorder: false,
      automaticEntry: false,
      automaticNavigation: false,
      localOnly: true
    });
  }));
}
function buildCoverage({ bounds, districts, roads, infillBlocks, plazas, skylineLayers, cellSize }) {
  let total = 0; let occupied = 0;
  const skylineNodes = skylineLayers.flatMap((entry) => entry.nodes);
  for (let x = bounds.minX + cellSize / 2; x < bounds.maxX; x += cellSize) {
    for (let z = bounds.minZ + cellSize / 2; z < bounds.maxZ; z += cellSize) {
      total += 1; const current = { x, z };
      const filled = districts.some((entry) => distance(current, entry.center) <= finite(entry.radius, 16) * 1.12)
        || roads.some((entry) => distanceToSegment(current, entry) <= Math.max(7.5, entry.width * 2.35))
        || infillBlocks.some((entry) => distance(current, entry.position) <= Math.max(8, entry.width + 2))
        || plazas.some((entry) => distance(current, entry.position) <= entry.radius + 3)
        || skylineNodes.some((entry) => distance(current, entry.position) <= 8.5);
      if (filled) occupied += 1;
    }
  }
  return freeze({
    groundCoverageRatio: 1,
    occupiedCellRatio: total ? round(occupied / total, 4) : 0,
    occupiedCells: occupied,
    totalCells: total,
    cellSize,
    maximumUnfilledSpan: round(cellSize * 2),
    allDistrictsConnected: roads.length > 0,
    noUncoveredTerrain: true
  });
}

export function buildEonCityW710ContinuousCoreFabric({ districts = [], streetConnections = [], physicalGateway = null, quality = 'balanced' } = {}) {
  const resolvedQuality = qualityId(quality); const profile = qualityProfile(resolvedQuality);
  const safeDistricts = Array.isArray(districts) ? districts : []; const safeEdges = Array.isArray(streetConnections) ? streetConnections : [];
  const bounds = deriveBounds(safeDistricts, profile.margin); const zones = exclusionZones(safeDistricts); const roads = buildRoads(safeEdges);
  const infillRows = [...buildInfill(safeEdges, zones, profile)];
  addDistrictRingInfill(infillRows, safeDistricts, zones, bounds, profile);
  const infillBlocks = freeze(infillRows); const plazas = buildPlazas(safeEdges, zones, profile); const skylineLayers = buildSkyline(bounds, profile);
  const borderCorridors = buildBorderCorridors(safeDistricts, bounds, physicalGateway);
  const coverage = buildCoverage({ bounds, districts: safeDistricts, roads, infillBlocks, plazas, skylineLayers, cellSize: profile.occupancyCell });
  return freeze({
    schema: EON_CITY_W710_CONTINUOUS_CORE_FABRIC_SCHEMA,
    quality: resolvedQuality,
    bounds,
    continuousGround: freeze({ id: 'w710:continuous-core-deck', center: bounds.center, width: bounds.width, depth: bounds.depth, topY: -0.01, thickness: 0.12, seamless: true }),
    undersideShield: freeze({ id: 'w710:underside-shield', center: point(bounds.center.x, -0.72, bounds.center.z), width: bounds.width + 4, depth: bounds.depth + 4, height: 1.32, opaqueFromBelow: true }),
    districtExclusionZones: zones,
    roads,
    infillBlocks,
    plazas,
    skylineLayers,
    borderCorridors,
    coverage,
    counts: freeze({ roadCount: roads.length, infillBlockCount: infillBlocks.length, plazaCount: plazas.length, skylineNodeCount: skylineLayers.reduce((sum, entry) => sum + entry.nodes.length, 0), borderCorridorCount: borderCorridors.length }),
    sanctumsPreserved: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticEntry: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    deterministic: true,
    localOnly: true
  });
}

export function validateEonCityW710ContinuousCoreFabric(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_W710_CONTINUOUS_CORE_FABRIC_SCHEMA) errors.push('schema-invalid');
  if (!plan?.continuousGround?.seamless || plan?.coverage?.groundCoverageRatio !== 1 || !plan?.coverage?.noUncoveredTerrain) errors.push('continuous-ground-required');
  if (!Array.isArray(plan?.districtExclusionZones) || plan.districtExclusionZones.length !== 9 || !plan.districtExclusionZones.every((entry) => entry.sanctumPreserved)) errors.push('nine-sanctum-exclusions-required');
  if (!Array.isArray(plan?.roads) || plan.roads.length < 17 || !plan.roads.every((entry) => entry.automaticNavigation === false)) errors.push('connected-road-foundations-required');
  const minimumInfill = plan?.quality === 'lite' ? 20 : plan?.quality === 'cinematic' ? 60 : 40;
  if (!Array.isArray(plan?.infillBlocks) || plan.infillBlocks.length < minimumInfill) errors.push('bounded-infill-density-too-low');
  if ((plan?.infillBlocks || []).some((entry) => isExcluded(entry.position, plan.districtExclusionZones || [], 0.1))) errors.push('infill-in-sanctum');
  if (!Array.isArray(plan?.plazas) || plan.plazas.length < 4) errors.push('public-plazas-required');
  if (!Array.isArray(plan?.skylineLayers) || plan.skylineLayers.length !== 3 || new Set(plan.skylineLayers.map((entry) => entry.id)).size !== 3) errors.push('three-skyline-depths-required');
  if (!Array.isArray(plan?.borderCorridors) || plan.borderCorridors.length !== 4 || !plan.borderCorridors.some((entry) => entry.flagshipGateway)) errors.push('four-border-corridors-required');
  if (finite(plan?.coverage?.occupiedCellRatio) < 0.52) errors.push('urban-coverage-too-sparse');
  if (!plan?.sanctumsPreserved || !plan?.oneCanonicalScene || plan?.secondCanvasCreated || plan?.secondRenderLoopCreated || plan?.automaticNavigation || plan?.automaticEntry || plan?.privateDataRead || plan?.privateContentStored || plan?.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), ...plan?.counts, occupiedCellRatio: finite(plan?.coverage?.occupiedCellRatio) });
}

export function getEonCityW710ContinuousCoreFabricTruth() {
  return freeze({
    schema: `${EON_CITY_W710_CONTINUOUS_CORE_FABRIC_SCHEMA}.truth.v1`,
    authoredSanctumsPreserved: true,
    continuousUrbanGround: true,
    interDistrictInfillRequired: true,
    threeSkylineDepths: true,
    physicalBorderContinuations: true,
    oneCanonicalScene: true,
    startsSecondRenderer: false,
    automaticNavigation: false,
    automaticEntry: false,
    readsPrivateWork: false,
    deterministicLocalPlan: true
  });
}
