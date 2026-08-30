import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { buildEonCityRt91StormIndustrialKit } from '../../rt91/storm/eon-city-rt91-storm-industrial-kit.js';
import {
  EON_EXPANSE_W792B_STORM_SECTOR_ZONES,
  EON_EXPANSE_W792B_STORM_SECTOR_ROUTES
} from '../../w792/eon-expanse-w792b-storm-sector-layout.js';

export const EON_CITY_RT92_STORM_DEEP_ART_SCHEMA = 'eon.city.storm-sector.deep-art.rt92.v1';
const freeze = Object.freeze;
const QUALITY = freeze({ lite: 0.66, balanced: 0.86, cinematic: 1 });
const QUALITY_COUNTS = freeze({
  lite: freeze({ burnMarks: 12, routeDetails: 8, setPieceDetail: 3 }),
  balanced: freeze({ burnMarks: 18, routeDetails: 12, setPieceDetail: 5 }),
  cinematic: freeze({ burnMarks: 24, routeDetails: 16, setPieceDetail: 7 })
});

function qualityId(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return Object.hasOwn(QUALITY, id) ? id : 'balanced';
}
function color(value, fallback = '#8d7dff') {
  try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); }
}
function material(scene, name, diffuse, emissive = diffuse, emission = 0.08, alpha = 1) {
  const row = new StandardMaterial(name, scene);
  row.diffuseColor = color(diffuse).scale(0.32);
  row.emissiveColor = color(emissive).scale(emission);
  row.specularColor = color('#131820');
  row.alpha = alpha;
  return row;
}
function routePose(route, offset = 0) {
  const dx = route.to.x - route.from.x;
  const dz = route.to.z - route.from.z;
  const length = Math.max(0.001, Math.hypot(dx, dz));
  const nx = -dz / length;
  const nz = dx / length;
  return freeze({
    x: (route.from.x + route.to.x) / 2 + nx * offset,
    y: Math.max(route.from.y, route.to.y),
    z: (route.from.z + route.to.z) / 2 + nz * offset,
    length,
    rotationY: Math.atan2(dx, dz),
    normalX: nx,
    normalZ: nz
  });
}

export function buildEonCityRt92StormDeepArtPlan({ quality = 'balanced', reducedMotion = false } = {}) {
  const resolvedQuality = qualityId(quality);
  const industrial = buildEonCityRt91StormIndustrialKit({ quality: resolvedQuality, worldSeed: 92 });
  const counts = QUALITY_COUNTS[resolvedQuality];
  return freeze({
    schema: EON_CITY_RT92_STORM_DEEP_ART_SCHEMA,
    worldId: 'storm-sector',
    quality: resolvedQuality,
    industrial,
    continuity: freeze({
      connectedHeroInstallation: true,
      routeInfrastructureFamilies: freeze(['power-trunk', 'coolant-pipe', 'ground-cable', 'maintenance-lights']),
      routeDetailCount: counts.routeDetails,
      heroLandmarksPreserved: 3
    }),
    groundStory: freeze({
      burnMarkCount: counts.burnMarks,
      families: freeze(['electrical-burn', 'fracture-seam', 'cable-trench', 'hazard-band']),
      collisionFree: true
    }),
    setPieces: freeze([
      freeze({ id: 'lightning-capture-field', zoneId: 'charged-gateway', signature: 'grounded-collector-array' }),
      freeze({ id: 'maintenance-yard', zoneId: 'relay-basin', signature: 'cabinets-pipes-service-bridge' }),
      freeze({ id: 'stabilizer-support-deck', zoneId: 'stabilizer-ridge', signature: 'gantries-grounding-platform' }),
      freeze({ id: 'storm-eye-emergency-site', zoneId: 'storm-eye', signature: 'shelter-wreckage-rescue-beacons' })
    ]),
    setPieceDetail: counts.setPieceDetail,
    motion: freeze({ warningPulse: !reducedMotion, collectorRotation: !reducedMotion, cableSway: !reducedMotion }),
    performance: freeze({
      proceduralGeometryOnly: true,
      newBinaryBytes: 0,
      firstFrameHubBinaryDelta: 0,
      mountedOnlyWithStormPresenter: true,
      ownsEngine: false,
      ownsScene: false,
      ownsRenderLoop: false,
      remoteTextures: false,
      wholeWorldEagerBinaryLoad: false
    })
  });
}

export function validateEonCityRt92StormDeepArtPlan(plan = buildEonCityRt92StormDeepArtPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT92_STORM_DEEP_ART_SCHEMA || plan?.worldId !== 'storm-sector') errors.push('schema-world');
  if (plan?.industrial?.zones?.length !== 4 || plan?.industrial?.optionalOnly !== true) errors.push('industrial-kit');
  if (plan?.continuity?.connectedHeroInstallation !== true || plan?.continuity?.heroLandmarksPreserved !== 3) errors.push('continuity');
  if ((plan?.continuity?.routeInfrastructureFamilies?.length || 0) < 4 || plan?.continuity?.routeDetailCount < 8) errors.push('route-detail');
  if ((plan?.groundStory?.families?.length || 0) < 4 || plan?.groundStory?.burnMarkCount < 12 || plan?.groundStory?.collisionFree !== true) errors.push('ground-story');
  if (plan?.setPieces?.length !== 4 || new Set(plan.setPieces.map((entry) => entry.zoneId)).size !== 4) errors.push('set-pieces');
  const performance = plan?.performance || {};
  if (performance.proceduralGeometryOnly !== true || performance.newBinaryBytes !== 0 || performance.firstFrameHubBinaryDelta !== 0 || performance.mountedOnlyWithStormPresenter !== true) errors.push('payload');
  if (performance.ownsEngine || performance.ownsScene || performance.ownsRenderLoop || performance.remoteTextures || performance.wholeWorldEagerBinaryLoad) errors.push('runtime-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export function mountEonCityRt92StormDeepArt({ scene, parent = null, quality = 'balanced', reducedMotion = false } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  let plan = buildEonCityRt92StormDeepArtPlan({ quality, reducedMotion });
  const validation = validateEonCityRt92StormDeepArtPlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: 'rt92-storm-plan-invalid', validation });

  const root = new TransformNode('rt92-storm-deep-art-root', scene);
  root.parent = parent || null;
  root.setEnabled(false);
  root.metadata = freeze({ kind: 'rt92-storm-deep-art-root', worldId: 'storm-sector', interactive: false, canonicalScene: true });

  const materials = freeze({
    structure: material(scene, 'rt92-storm-structure', '#1d2630', '#283846', 0.035),
    burned: material(scene, 'rt92-storm-burned', '#19191d', '#3c302d', 0.025),
    utility: material(scene, 'rt92-storm-utility', '#35414a', '#48616e', 0.055),
    electric: material(scene, 'rt92-storm-electric', '#544d7f', '#b5a7ff', 0.48),
    route: material(scene, 'rt92-storm-route-light', '#234b59', '#2cbcff', 0.34),
    warning: material(scene, 'rt92-storm-warning', '#674a31', '#ff9f5a', 0.48),
    rescue: material(scene, 'rt92-storm-rescue', '#5b2831', '#ff667c', 0.42),
    wet: material(scene, 'rt92-storm-wet', '#111b23', '#1d3948', 0.035, 0.9)
  });
  const materialRows = Object.values(materials);
  const animated = [];
  const staticNodes = [];
  const qualityRoots = new Map();
  let active = false;
  let disposed = false;
  let severity = 2;

  const add = (mesh, mat, x, y, z, rotationY = 0, options = {}) => {
    mesh.parent = options.parent || root;
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    mesh.material = mat;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({
      kind: 'rt92-storm-environment-art',
      family: options.family || 'support',
      setPieceId: options.setPieceId || '',
      animated: Boolean(options.animate),
      interactive: false,
      finishedHeroBuilding: false,
      bootCritical: false
    });
    if (options.animate) animated.push(freeze({ mesh, kind: options.animate, phase: animated.length * 0.67, baseY: y, baseRy: rotationY }));
    else staticNodes.push(mesh);
    return mesh;
  };

  const addRod = (name, x, z, height = 5, mat = materials.structure, options = {}) => {
    const rod = add(MeshBuilder.CreateCylinder(name, { diameterTop: 0.08, diameterBottom: 0.28, height, tessellation: 10 }, scene), mat, x, height / 2, z, 0, options);
    const crown = add(MeshBuilder.CreateTorus(`${name}-crown`, { diameter: 0.82, thickness: 0.045, tessellation: 24 }, scene), options.crownMaterial || materials.electric, x, height * 0.78, z, 0, { ...options, animate: options.animate || 'collector' });
    crown.rotation.x = Math.PI / 2;
    return rod;
  };

  const buildIndustrialProp = (prop) => {
    const { x, z } = prop.position;
    const ry = prop.rotationY || 0;
    if (prop.type === 'grounding-rod') return addRod(`rt92-${prop.id}`, x, z, 4.2, materials.structure, { family: prop.type, animate: 'collector' });
    if (prop.type === 'cable-segment') {
      const cable = add(MeshBuilder.CreateBox(`rt92-${prop.id}`, { width: 0.12, height: 0.08, depth: 5.8 }, scene), materials.electric, x, 0.12, z, ry, { family: prop.type, animate: 'cable' });
      cable.rotation.z = 0.015;
      return cable;
    }
    if (prop.type === 'pipe-segment') return add(MeshBuilder.CreateCylinder(`rt92-${prop.id}`, { diameter: 0.34, height: 6.2, tessellation: 12 }, scene), materials.utility, x, 0.54, z, ry, { family: prop.type });
    if (prop.type === 'storm-barrier') return add(MeshBuilder.CreateBox(`rt92-${prop.id}`, { width: 3.4, height: 1.05, depth: 0.34 }, scene), materials.warning, x, 0.54, z, ry, { family: prop.type });
    if (prop.type === 'broken-platform') {
      const platform = add(MeshBuilder.CreateBox(`rt92-${prop.id}`, { width: 4.4, height: 0.28, depth: 3.2 }, scene), materials.burned, x, 0.18, z, ry, { family: prop.type });
      platform.rotation.z = 0.04;
      return platform;
    }
    if (prop.type === 'rescue-wreckage') {
      const wreck = add(MeshBuilder.CreateCapsule(`rt92-${prop.id}`, { height: 3.8, radius: 0.72, tessellation: 16 }, scene), materials.burned, x, 0.82, z, ry + Math.PI / 2, { family: prop.type });
      wreck.rotation.z = 1.16;
      return wreck;
    }
    if (prop.type === 'service-gantry') {
      add(MeshBuilder.CreateBox(`rt92-${prop.id}-left`, { width: 0.28, height: 3.6, depth: 0.34 }, scene), materials.structure, x - 1.8, 1.8, z, ry, { family: prop.type });
      add(MeshBuilder.CreateBox(`rt92-${prop.id}-right`, { width: 0.28, height: 3.6, depth: 0.34 }, scene), materials.structure, x + 1.8, 1.8, z, ry, { family: prop.type });
      return add(MeshBuilder.CreateBox(`rt92-${prop.id}-beam`, { width: 4.0, height: 0.24, depth: 0.38 }, scene), materials.utility, x, 3.42, z, ry, { family: prop.type });
    }
    return add(MeshBuilder.CreateCylinder(`rt92-${prop.id}`, { diameter: 0.34, height: 2.1, tessellation: 10 }, scene), materials.warning, x, 1.05, z, ry, { family: 'warning-beacon', animate: 'warning' });
  };

  const disposeBuiltArt = () => {
    for (const child of [...root.getChildren?.() || []]) try { child.dispose?.(false, true); } catch {}
    animated.length = 0;
    staticNodes.length = 0;
    qualityRoots.clear();
  };

  const buildArt = (nextPlan) => {
    disposeBuiltArt();
    plan = nextPlan;
    const factor = QUALITY[plan.quality];

    // RT91's semantic support kit becomes visible authored continuity here.
    for (const zone of plan.industrial.zones) for (const prop of zone.props) buildIndustrialProp(prop);

    // Continuous infrastructure trunks make the three authored hero GLBs read
    // as one functioning installation rather than isolated monuments.
    for (const route of EON_EXPANSE_W792B_STORM_SECTOR_ROUTES) {
      for (const [index, offset] of [-2.6, -1.65, 1.65, 2.6].entries()) {
        const pose = routePose(route, offset);
        const mat = index === 0 ? materials.utility : index === 1 ? materials.electric : index === 2 ? materials.structure : materials.route;
        const width = index === 1 ? 0.11 : index === 3 ? 0.08 : 0.22;
        const height = index === 0 ? 0.22 : 0.08;
        add(MeshBuilder.CreateBox(`rt92-storm-${route.id}-trunk-${index}`, { width, height, depth: pose.length * 0.94 }, scene), mat, pose.x, 0.22 + index * 0.055, pose.z, pose.rotationY, { family: plan.continuity.routeInfrastructureFamilies[index] });
      }
      const pose = routePose(route, 0);
      const markerCount = Math.max(2, Math.round(plan.continuity.routeDetailCount / 3));
      for (let i = 0; i < markerCount; i += 1) {
        const t = (i + 1) / (markerCount + 1);
        const x = route.from.x + (route.to.x - route.from.x) * t;
        const z = route.from.z + (route.to.z - route.from.z) * t;
        add(MeshBuilder.CreateCylinder(`rt92-storm-${route.id}-route-beacon-${i}`, { diameter: 0.22, height: 1.2, tessellation: 8 }, scene), i % 2 ? materials.warning : materials.route, x + pose.normalX * 3.7, 0.6, z + pose.normalZ * 3.7, pose.rotationY, { family: 'maintenance-lights', animate: 'warning' });
      }
    }

    // Ground storytelling: scorched strike paths, fractured seams, hazard bands
    // and low-profile wet plates. These are collision-free and very cheap.
    const burnCount = plan.groundStory.burnMarkCount;
    const centers = EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((zone) => zone.center);
    for (let i = 0; i < burnCount; i += 1) {
      const center = centers[i % centers.length];
      const a = i * 2.399963 + (i % 4) * 0.17;
      const radius = 8 + (i % 6) * 3.2;
      const x = center.x + Math.cos(a) * radius;
      const z = center.z + Math.sin(a) * radius;
      const family = plan.groundStory.families[i % plan.groundStory.families.length];
      if (family === 'electrical-burn') {
        const burn = add(MeshBuilder.CreateTorus(`rt92-storm-burn-${i}`, { diameter: 1.5 + (i % 4) * 0.45, thickness: 0.055, tessellation: 24, arc: 0.66 }, scene), materials.burned, x, 0.04, z, a, { family });
        burn.rotation.x = Math.PI / 2;
      } else if (family === 'fracture-seam') {
        add(MeshBuilder.CreateBox(`rt92-storm-fracture-${i}`, { width: 0.08, height: 0.035, depth: 2.4 + (i % 3) * 1.4 }, scene), materials.burned, x, 0.045, z, a, { family });
      } else if (family === 'cable-trench') {
        add(MeshBuilder.CreateBox(`rt92-storm-trench-${i}`, { width: 0.34, height: 0.045, depth: 3.2 + (i % 4) }, scene), materials.utility, x, 0.03, z, a, { family });
      } else {
        add(MeshBuilder.CreateBox(`rt92-storm-hazard-band-${i}`, { width: 0.14, height: 0.025, depth: 2.8 }, scene), materials.warning, x, 0.05, z, a, { family });
      }
      if (i % 5 === 0 && plan.quality !== 'lite') add(MeshBuilder.CreateDisc(`rt92-storm-wet-plate-${i}`, { radius: 1.6 + (i % 3) * 0.5, tessellation: 24 }, scene), materials.wet, x + 1.1, 0.035, z - 0.8, a, { family: 'wet-ground' }).rotation.x = Math.PI / 2;
    }

    const byZone = new Map(EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((zone) => [zone.id, zone]));
    const detail = plan.setPieceDetail;

    // Charged Gateway — lightning capture field.
    {
      const zone = byZone.get('charged-gateway');
      const setPieceId = 'lightning-capture-field';
      for (let i = 0; i < detail + 2; i += 1) {
        const a = -0.9 + i * (1.8 / Math.max(1, detail + 1));
        const r = 19 + (i % 2) * 3.8;
        addRod(`rt92-storm-capture-rod-${i}`, zone.center.x + Math.sin(a) * r, zone.center.z + Math.cos(a) * r, 5.5 + (i % 3) * 1.1, materials.structure, { family: 'lightning-capture', setPieceId, animate: 'collector' });
      }
      const collector = add(MeshBuilder.CreateTorus('rt92-storm-capture-ground-ring', { diameter: 22, thickness: 0.12, tessellation: 48 }, scene), materials.electric, zone.center.x, 0.12, zone.center.z + 4.5, 0, { family: 'lightning-capture', setPieceId, animate: 'collector' });
      collector.rotation.x = Math.PI / 2;
    }

    // Relay Basin — maintenance yard + elevated service bridge.
    {
      const zone = byZone.get('relay-basin');
      const setPieceId = 'maintenance-yard';
      for (let i = 0; i < detail; i += 1) {
        const row = Math.floor(i / 3); const col = i % 3;
        add(MeshBuilder.CreateBox(`rt92-storm-maint-cabinet-${i}`, { width: 1.25, height: 1.9 + (i % 2) * 0.45, depth: 0.82 }, scene), i % 3 === 0 ? materials.warning : materials.utility, zone.center.x - 11 + col * 3.3, 1.0, zone.center.z + 12 + row * 3.0, 0.12 * (col - 1), { family: 'maintenance-yard', setPieceId });
      }
      add(MeshBuilder.CreateBox('rt92-storm-relay-service-bridge', { width: 13.5, height: 0.34, depth: 1.45 }, scene), materials.structure, zone.center.x + 8, 3.5, zone.center.z - 10, -0.22, { family: 'service-bridge', setPieceId });
      for (const side of [-1, 1]) add(MeshBuilder.CreateBox(`rt92-storm-relay-bridge-support-${side}`, { width: 0.45, height: 6.6, depth: 0.52 }, scene), materials.structure, zone.center.x + 8 + side * 5.5, 1.7, zone.center.z - 10, -0.22, { family: 'service-bridge', setPieceId });
    }

    // Stabilizer Ridge — grounded support deck surrounding the hero asset.
    {
      const zone = byZone.get('stabilizer-ridge');
      const setPieceId = 'stabilizer-support-deck';
      const deck = add(MeshBuilder.CreateCylinder('rt92-storm-stabilizer-support-deck', { diameter: 31, height: 0.24, tessellation: 48 }, scene), materials.burned, zone.center.x, 0.09, zone.center.z, 0, { family: 'support-deck', setPieceId });
      deck.scaling.z = 0.68;
      for (let i = 0; i < detail + 1; i += 1) {
        const a = (i / (detail + 1)) * Math.PI * 2;
        const r = 18.5;
        addRod(`rt92-storm-stabilizer-grounder-${i}`, zone.center.x + Math.cos(a) * r, zone.center.z + Math.sin(a) * r, 4.4 + (i % 2) * 0.8, materials.structure, { family: 'stabilizer-grounding', setPieceId, animate: 'collector' });
      }
    }

    // Storm Eye — emergency shelter, fallen capsule and rescue perimeter.
    {
      const zone = byZone.get('storm-eye');
      const setPieceId = 'storm-eye-emergency-site';
      add(MeshBuilder.CreateBox('rt92-storm-emergency-shelter', { width: 7.2, height: 3.4, depth: 5.2 }, scene), materials.structure, zone.center.x - 16, 1.7, zone.center.z + 14, 0.38, { family: 'emergency-shelter', setPieceId });
      const roof = add(MeshBuilder.CreateCylinder('rt92-storm-emergency-shelter-roof', { diameter: 7.8, height: 0.28, tessellation: 6 }, scene), materials.warning, zone.center.x - 16, 3.48, zone.center.z + 14, Math.PI / 6, { family: 'emergency-shelter', setPieceId });
      roof.scaling.z = 0.7;
      const wreck = add(MeshBuilder.CreateCapsule('rt92-storm-fallen-transit-capsule', { height: 7.2, radius: 1.15, tessellation: 20 }, scene), materials.burned, zone.center.x + 14, 1.12, zone.center.z - 10, 0.82, { family: 'fallen-transit-capsule', setPieceId });
      wreck.rotation.z = 1.22;
      for (let i = 0; i < detail + 2; i += 1) {
        const a = (i / (detail + 2)) * Math.PI * 2;
        const r = 21 + (i % 2) * 3.4;
        add(MeshBuilder.CreateCylinder(`rt92-storm-rescue-beacon-${i}`, { diameter: 0.28, height: 1.55, tessellation: 8 }, scene), materials.rescue, zone.center.x + Math.cos(a) * r, 0.78, zone.center.z + Math.sin(a) * r, 0, { family: 'rescue-perimeter', setPieceId, animate: 'warning' });
      }
    }

    // Low-cost overhead gantry accents along the routes. Kept bounded by tier.
    const overheadCount = Math.max(2, Math.round(plan.continuity.routeDetailCount * factor / 3));
    EON_EXPANSE_W792B_STORM_SECTOR_ROUTES.forEach((route, routeIndex) => {
      for (let i = 0; i < overheadCount; i += 1) {
        const t = (i + 1) / (overheadCount + 1);
        const x = route.from.x + (route.to.x - route.from.x) * t;
        const z = route.from.z + (route.to.z - route.from.z) * t;
        const pose = routePose(route, 0);
        const h = 3.2 + ((i + routeIndex) % 3) * 0.55;
        add(MeshBuilder.CreateBox(`rt92-storm-overhead-gantry-${routeIndex}-${i}-a`, { width: 0.24, height: h, depth: 0.3 }, scene), materials.structure, x + pose.normalX * 3.15, h / 2, z + pose.normalZ * 3.15, pose.rotationY, { family: 'route-gantry' });
        add(MeshBuilder.CreateBox(`rt92-storm-overhead-gantry-${routeIndex}-${i}-b`, { width: 0.24, height: h, depth: 0.3 }, scene), materials.structure, x - pose.normalX * 3.15, h / 2, z - pose.normalZ * 3.15, pose.rotationY, { family: 'route-gantry' });
        add(MeshBuilder.CreateBox(`rt92-storm-overhead-gantry-${routeIndex}-${i}-beam`, { width: 6.6, height: 0.18, depth: 0.26 }, scene), materials.utility, x, h - 0.16, z, pose.rotationY, { family: 'route-gantry' });
      }
    });

    for (const node of staticNodes) try { node.freezeWorldMatrix?.(); } catch {}
    return freeze({ ok: true, quality: plan.quality, staticNodeCount: staticNodes.length, animatedNodeCount: animated.length });
  };

  buildArt(plan);

  const setQuality = (nextQuality = plan.quality) => {
    const resolved = qualityId(nextQuality);
    if (resolved === plan.quality) return freeze({ ok: true, changed: false, quality: plan.quality });
    const next = buildEonCityRt92StormDeepArtPlan({ quality: resolved, reducedMotion });
    const checked = validateEonCityRt92StormDeepArtPlan(next);
    if (!checked.ok) return freeze({ ok: false, reason: 'rt92-storm-quality-plan-invalid', validation: checked });
    const wasActive = active;
    const built = buildArt(next);
    root.setEnabled(wasActive);
    return freeze({ ok: true, changed: true, quality: plan.quality, built });
  };

  return freeze({
    ok: true,
    schema: EON_CITY_RT92_STORM_DEEP_ART_SCHEMA,
    root,
    activate({ quality: nextQuality = plan.quality } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'disposed' });
      const qResult = setQuality(nextQuality);
      if (!qResult.ok) return qResult;
      active = true;
      root.setEnabled(true);
      return freeze({ ok: true, active: true, quality: plan.quality });
    },
    deactivate() { active = false; root.setEnabled(false); return freeze({ ok: true, active: false }); },
    setQuality,
    setWeather({ severity: nextSeverity = severity } = {}) {
      severity = Math.max(0, Math.min(4, Number(nextSeverity) || 0));
      return freeze({ ok: true, severity, writesWeatherState: false });
    },
    update(seconds = 0) {
      if (!active || disposed || reducedMotion) return freeze({ ok: true, active, animatedCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0);
      let animatedCount = 0;
      for (const entry of animated) {
        if (entry.mesh.isDisposed?.() || entry.mesh.isEnabled?.() === false) continue;
        if (entry.kind === 'warning') {
          const pulse = 0.72 + Math.sin(t * (2.4 + severity * 0.28) + entry.phase) * (0.14 + severity * 0.018);
          entry.mesh.scaling.y = Math.max(0.82, pulse);
        } else if (entry.kind === 'collector') {
          entry.mesh.rotation.z = entry.baseRy + t * (0.08 + severity * 0.018) * (entry.phase % 2 > 1 ? -1 : 1);
        } else if (entry.kind === 'cable') {
          entry.mesh.rotation.z = Math.sin(t * 0.72 + entry.phase) * (0.012 + severity * 0.003);
        }
        animatedCount += 1;
      }
      const electricScale = 0.34 + severity * 0.055 + Math.sin(t * 1.45) * 0.035;
      materials.electric.emissiveColor = color('#b5a7ff').scale(electricScale);
      materials.warning.emissiveColor = color('#ff9f5a').scale(0.30 + severity * 0.035);
      return freeze({ ok: true, active, animatedCount, severity, ownsRenderLoop: false });
    },
    getSummary() {
      return freeze({
        schema: EON_CITY_RT92_STORM_DEEP_ART_SCHEMA,
        active,
        quality: plan.quality,
        severity,
        industrialPropCount: plan.industrial.propCount,
        setPieceCount: plan.setPieces.length,
        groundStoryCount: plan.groundStory.burnMarkCount,
        staticNodeCount: staticNodes.length,
        animatedNodeCount: animated.length,
        connectedHeroInstallation: true,
        firstFrameHubBinaryDelta: 0,
        newBinaryBytes: 0,
        ownsRenderLoop: false,
        remoteTextures: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true; active = false;
      disposeBuiltArt();
      root.setEnabled(false);
      for (const row of materialRows) try { row.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({
  EON_CITY_RT92_STORM_DEEP_ART_SCHEMA,
  buildEonCityRt92StormDeepArtPlan,
  validateEonCityRt92StormDeepArtPlan,
  mountEonCityRt92StormDeepArt
});
