/** W792B — fixed authored Storm Sector layout and deterministic streaming plan. */
import {
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE,
  selectEonExpanseW792AStormSectorLod,
  validateEonExpanseW792AStormSectorPackage
} from './eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
const point = (x, y, z) => freeze({ x, y, z });
const zone = (id, label, x, z, radius) => freeze({ id, label, center: point(x, 0, z), radius });

export const EON_EXPANSE_W792B_STORM_SECTOR_LAYOUT_SCHEMA = 'eon.expanse.storm-sector.layout.w792b.v1';
export const EON_EXPANSE_W792B_STORM_SECTOR_ORIGIN = point(960, 0, -180);
export const EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL = point(928, 0.45, -180);
export const EON_EXPANSE_W792B_STORM_SECTOR_RETURN = point(944, 0.45, -180);

export const EON_EXPANSE_W792B_STORM_SECTOR_ZONES = freeze([
  zone('charged-gateway', 'Charged Gateway', 944, -180, 34),
  zone('relay-basin', 'Relay Basin', 1000, -146, 42),
  zone('stabilizer-ridge', 'Stabilizer Ridge', 1062, -214, 46),
  zone('storm-eye', 'Storm Eye', 1124, -180, 52)
]);

export const EON_EXPANSE_W792B_STORM_SECTOR_HERO_PLACEMENTS = freeze([
  freeze({ id: 'charged-transit-gate', zoneId: 'charged-gateway', position: point(944, 0, -180), rotationY: Math.PI / 2, targetHeight: 14, collisionRadius: 10 }),
  freeze({ id: 'storm-command-spire', zoneId: 'relay-basin', position: point(1002, 0, -148), rotationY: -Math.PI / 8, targetHeight: 22, collisionRadius: 12 }),
  freeze({ id: 'atmospheric-stabilizer', zoneId: 'stabilizer-ridge', position: point(1064, 0, -214), rotationY: Math.PI / 10, targetHeight: 20, collisionRadius: 13 })
]);

export const EON_EXPANSE_W792B_STORM_SECTOR_ROUTES = freeze([
  freeze({ id: 'gateway-relay-route', from: point(950, 0.12, -178), to: point(988, 0.12, -154), width: 6 }),
  freeze({ id: 'relay-stabilizer-route', from: point(1014, 0.12, -158), to: point(1052, 0.12, -202), width: 6 }),
  freeze({ id: 'stabilizer-eye-route', from: point(1078, 0.12, -208), to: point(1112, 0.12, -184), width: 6 })
]);

export const EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS = freeze([
  freeze({ id: 'storm-weather-array', familyId: 'weather-restoration', zoneId: 'relay-basin', position: point(1015, 1.1, -134), action: 'storm-weather-array-reviewed' }),
  freeze({ id: 'storm-relay-console', familyId: 'relay-repair', zoneId: 'stabilizer-ridge', position: point(1047, 1.0, -226), action: 'storm-relay-console-reviewed' }),
  freeze({ id: 'storm-rescue-signal', familyId: 'storm-rescue', zoneId: 'storm-eye', position: point(1120, 1.2, -168), action: 'storm-rescue-signal-reviewed' })
]);

const CELL_OFFSETS = freeze([
  freeze({ id: 'gateway', x: -1, z: 0, rings: freeze(['lite', 'balanced', 'cinematic']) }),
  freeze({ id: 'relay', x: 0, z: 0, rings: freeze(['lite', 'balanced', 'cinematic']) }),
  freeze({ id: 'stabilizer', x: 1, z: -1, rings: freeze(['lite', 'balanced', 'cinematic']) }),
  freeze({ id: 'storm-eye', x: 2, z: 0, rings: freeze(['lite', 'balanced', 'cinematic']) }),
  freeze({ id: 'north-relay', x: 0, z: -1, rings: freeze(['lite', 'balanced', 'cinematic']) }),
  freeze({ id: 'south-relay', x: 0, z: 1, rings: freeze(['balanced', 'cinematic']) }),
  freeze({ id: 'north-eye', x: 2, z: -1, rings: freeze(['balanced', 'cinematic']) }),
  freeze({ id: 'south-eye', x: 2, z: 1, rings: freeze(['balanced', 'cinematic']) }),
  freeze({ id: 'west-gateway', x: -2, z: 0, rings: freeze(['balanced', 'cinematic']) }),
  freeze({ id: 'ridge-east', x: 3, z: -1, rings: freeze(['cinematic']) }),
  freeze({ id: 'eye-east', x: 3, z: 0, rings: freeze(['cinematic']) }),
  freeze({ id: 'north-horizon', x: 1, z: -2, rings: freeze(['cinematic']) }),
  freeze({ id: 'south-horizon', x: 1, z: 2, rings: freeze(['cinematic']) })
]);

export function createEonExpanseW792BStormSectorPlan({ quality = 'balanced', packageCandidate = EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE } = {}) {
  const packageValidation = validateEonExpanseW792AStormSectorPackage(packageCandidate);
  const normalizedQuality = ['lite', 'balanced', 'cinematic'].includes(String(quality)) ? String(quality) : 'balanced';
  const profile = packageCandidate?.qualityProfiles?.[normalizedQuality] || packageCandidate?.qualityProfiles?.balanced;
  const lodRows = selectEonExpanseW792AStormSectorLod(normalizedQuality);
  const lodById = new Map(lodRows.map((entry) => [entry.id, entry]));
  const cellSize = 48;
  const cells = CELL_OFFSETS
    .filter((entry) => entry.rings.includes(normalizedQuality))
    .slice(0, profile.activeCells)
    .map((entry, index) => freeze({
      id: `storm-sector-cell:${entry.id}`,
      index,
      worldOrigin: point(EON_EXPANSE_W792B_STORM_SECTOR_ORIGIN.x + entry.x * cellSize, 0, EON_EXPANSE_W792B_STORM_SECTOR_ORIGIN.z + entry.z * cellSize),
      ring: index < 4 ? 'interactive' : index < 9 ? 'visible' : 'horizon',
      deterministicSignature: `${packageCandidate.packageDigest.slice(0, 12)}:${entry.id}:${normalizedQuality}`
    }));
  const heroes = EON_EXPANSE_W792B_STORM_SECTOR_HERO_PLACEMENTS.map((entry) => freeze({
    ...entry,
    packageDigest: packageCandidate.packageDigest,
    lod: lodById.get(entry.id),
    developmentProxy: false,
    finishedHeroPrimitive: false
  }));
  return freeze({
    schema: EON_EXPANSE_W792B_STORM_SECTOR_LAYOUT_SCHEMA,
    regionId: 'storm-sector',
    gatewayId: 'future-gateway-storm-sector',
    packageDigest: packageCandidate.packageDigest,
    quality: normalizedQuality,
    packageValidation,
    origin: EON_EXPANSE_W792B_STORM_SECTOR_ORIGIN,
    arrival: EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL,
    returnPoint: EON_EXPANSE_W792B_STORM_SECTOR_RETURN,
    zones: EON_EXPANSE_W792B_STORM_SECTOR_ZONES,
    heroPlacements: freeze(heroes),
    routes: EON_EXPANSE_W792B_STORM_SECTOR_ROUTES,
    missionAnchors: EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS,
    cells: freeze(cells),
    streamingBudget: freeze({
      activeCellCount: cells.length,
      maxParticles: profile.maxParticles,
      maxDynamicLights: profile.maxDynamicLights,
      heroLod: profile.heroLod
    }),
    collisionSafeAuthoredLayout: true,
    rawCoordinateInputAccepted: false,
    oneCanonicalScene: true,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    automaticActivation: false,
    privateContentStored: false
  });
}

function circlesOverlap(a, b) {
  const distance = Math.hypot(Number(a.position.x) - Number(b.position.x), Number(a.position.z) - Number(b.position.z));
  return distance < Number(a.collisionRadius) + Number(b.collisionRadius) + 4;
}

export function validateEonExpanseW792BStormSectorPlan(plan = createEonExpanseW792BStormSectorPlan()) {
  const errors = [];
  if (plan?.schema !== EON_EXPANSE_W792B_STORM_SECTOR_LAYOUT_SCHEMA) errors.push('schema-invalid');
  if (plan?.regionId !== 'storm-sector' || plan?.gatewayId !== 'future-gateway-storm-sector') errors.push('region-authority-invalid');
  if (plan?.packageValidation?.ok !== true || plan?.packageDigest !== plan?.packageValidation?.packageDigest) errors.push('package-invalid');
  if ((plan?.heroPlacements?.length || 0) !== 3 || plan.heroPlacements.some((entry) => !entry?.lod?.url || entry?.developmentProxy || entry?.finishedHeroPrimitive)) errors.push('hero-placement-invalid');
  for (let i = 0; i < (plan?.heroPlacements?.length || 0); i += 1) for (let j = i + 1; j < plan.heroPlacements.length; j += 1) if (circlesOverlap(plan.heroPlacements[i], plan.heroPlacements[j])) errors.push(`hero-collision:${plan.heroPlacements[i].id}:${plan.heroPlacements[j].id}`);
  if ((plan?.routes?.length || 0) !== 3 || plan.routes.some((entry) => !(entry.width >= 5))) errors.push('route-layout-invalid');
  if ((plan?.missionAnchors?.length || 0) !== 3 || new Set(plan.missionAnchors.map((entry) => entry.familyId)).size !== 3) errors.push('mission-anchor-invalid');
  if ((plan?.cells?.length || 0) !== Number(plan?.streamingBudget?.activeCellCount || -1)) errors.push('cell-budget-invalid');
  if (plan?.rawCoordinateInputAccepted || !plan?.collisionSafeAuthoredLayout) errors.push('placement-policy-invalid');
  if (!plan?.oneCanonicalScene || plan?.ownsEngine || plan?.ownsScene || plan?.ownsRenderLoop) errors.push('runtime-authority-invalid');
  if (plan?.automaticActivation || plan?.privateContentStored) errors.push('safety-boundary-invalid');
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    regionId: plan?.regionId || '',
    quality: plan?.quality || '',
    activeCellCount: plan?.cells?.length || 0,
    heroCount: plan?.heroPlacements?.length || 0,
    routeCount: plan?.routes?.length || 0,
    missionAnchorCount: plan?.missionAnchors?.length || 0,
    rendersRegion: false,
    activatesGateway: false
  });
}

export function resolveEonExpanseW792BStormSectorZone(position = {}) {
  let nearest = null;
  for (const entry of EON_EXPANSE_W792B_STORM_SECTOR_ZONES) {
    const distance = Math.hypot(Number(position?.x || 0) - entry.center.x, Number(position?.z || 0) - entry.center.z);
    if (!nearest || distance < nearest.distance) nearest = freeze({ zone: entry, distance, inside: distance <= entry.radius });
  }
  return nearest;
}

export default freeze({
  EON_EXPANSE_W792B_STORM_SECTOR_LAYOUT_SCHEMA,
  EON_EXPANSE_W792B_STORM_SECTOR_ORIGIN,
  EON_EXPANSE_W792B_STORM_SECTOR_ARRIVAL,
  EON_EXPANSE_W792B_STORM_SECTOR_RETURN,
  EON_EXPANSE_W792B_STORM_SECTOR_ZONES,
  EON_EXPANSE_W792B_STORM_SECTOR_HERO_PLACEMENTS,
  EON_EXPANSE_W792B_STORM_SECTOR_ROUTES,
  EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS,
  createEonExpanseW792BStormSectorPlan,
  validateEonExpanseW792BStormSectorPlan,
  resolveEonExpanseW792BStormSectorZone
});
