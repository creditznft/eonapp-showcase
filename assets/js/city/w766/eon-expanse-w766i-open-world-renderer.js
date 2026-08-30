import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import {
  buildEonExpanseW766IFrontierContract,
  buildEonExpanseW766IOpenWorldContinuity,
  validateEonExpanseW766IOpenWorldContinuity
} from './eon-expanse-w766i-open-world-continuity.js';
import {
  resolveEonCityW698DiscoveryVisual,
  resolveEonCityW698StreetActivityVisual
} from '../w698/eon-city-w698-expanse-open-world-presentation.js';

const freeze = (value) => Object.freeze(value);
const QUALITY = freeze({
  lite: freeze({ lots: 3, skyline: 2, actors: 14, discoveries: 6, street: 8 }),
  balanced: freeze({ lots: 5, skyline: 4, actors: 30, discoveries: 12, street: 16 }),
  cinematic: freeze({ lots: 5, skyline: 6, actors: 52, discoveries: 18, street: 28 })
});

export const EON_EXPANSE_W766I_RENDERER_SCHEMA = 'eon.city.expanse.open-world-renderer.w766i.v1';

function makeMaterial(scene, name, hex, intensity = 0.32, alpha = 1) {
  const material = new StandardMaterial(name, scene);
  let color;
  try { color = Color3.FromHexString(hex); } catch { color = Color3.FromHexString('#55eaff'); }
  material.diffuseColor = color.scale(0.22);
  material.emissiveColor = color.scale(intensity);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  return material;
}

function heightFor(lot = {}, ring = 'interactive') {
  const base = lot.heightClass === 'tall' ? 8.5 : lot.heightClass === 'mid' ? 5.4 : 3.1;
  return ring === 'horizon' ? base * 1.4 : ring === 'visible' ? base * 1.12 : base;
}

function shapeForLot(scene, name, lot = {}, width = 3, depth = 3, height = 5) {
  const footprint = String(lot.footprint || 'rectangular');
  const roof = String(lot.roofProfile || 'open-frame');
  const form = String(lot.form || 'frontier structure');
  if (footprint.includes('hexagonal') || roof.includes('dome') || form.includes('rotunda') || form.includes('pavilion')) {
    return MeshBuilder.CreateCylinder(name, { diameter: Math.max(width, depth), height, tessellation: footprint.includes('hexagonal') ? 6 : 16 }, scene);
  }
  if (form.includes('spire') || form.includes('tower') || form.includes('needle') || form.includes('mast') || roof.includes('signal-crown')) {
    const mesh = MeshBuilder.CreateCylinder(name, { diameterTop: form.includes('needle') ? width * 0.08 : width * 0.32, diameterBottom: width, height, tessellation: 8 }, scene);
    mesh.rotation.y = Math.PI / 4;
    return mesh;
  }
  if (form.includes('crystal') || form.includes('shard') || form.includes('prism')) {
    const mesh = MeshBuilder.CreateCylinder(name, { diameterTop: 0, diameterBottom: width * 1.15, height, tessellation: 4 }, scene);
    mesh.rotation.y = Math.PI / 4;
    return mesh;
  }
  if (footprint.includes('bridge-span') || form.includes('bridge') || form.includes('gantry') || form.includes('skywalk')) {
    return MeshBuilder.CreateBox(name, { width: width * 1.8, height: Math.max(1.8, height * 0.55), depth: depth * 0.62 }, scene);
  }
  if (footprint.includes('arc') || form.includes('arch') || form.includes('gate')) {
    return MeshBuilder.CreateCapsule?.(name, { height, radius: Math.max(width, depth) * 0.36, tessellation: 12 }, scene)
      || MeshBuilder.CreateCylinder(name, { diameter: Math.max(width, depth) * 0.72, height, tessellation: 12 }, scene);
  }
  if (roof.includes('terraced') || form.includes('ziggurat') || footprint.includes('courtyard')) {
    return MeshBuilder.CreateBox(name, { width: width * 1.2, height: height * 0.82, depth: depth * 1.2 }, scene);
  }
  return MeshBuilder.CreateBox(name, { width, height, depth }, scene);
}

function isProtectedByAuthoredZone(plan = {}, zones = []) {
  const origin = plan.worldOrigin || { x: 0, z: 0 };
  return zones.some((zone) => Math.hypot(origin.x - Number(zone.x || 0), origin.z - Number(zone.z || 0)) <= Number(zone.radius || 0) + 34);
}

function attach(mesh, parent, material, position, { collisions = false, pickable = false, metadata = null } = {}) {
  mesh.parent = parent;
  mesh.position.set(position.x, position.y, position.z);
  mesh.material = material;
  mesh.checkCollisions = collisions;
  mesh.isPickable = pickable;
  if (metadata) mesh.metadata = freeze(metadata);
  return mesh;
}

export function mountEonExpanseW766IOpenWorldRenderer({
  scene,
  parent,
  worldSeed = 1,
  quality = 'balanced',
  reducedMotion = false,
  authoredZones = [],
  developmentPreview = false
} = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'scene-and-parent-required' });
  const resolvedQuality = QUALITY[quality] ? quality : 'balanced';
  const profile = QUALITY[resolvedQuality];
  const root = new TransformNode('w766i-open-world-root', scene);
  root.parent = parent;
  const sectorRoot = new TransformNode('w766i-sector-root', scene); sectorRoot.parent = root;
  const continuityRoot = new TransformNode('w766i-continuity-root', scene); continuityRoot.parent = root;
  const materialCache = new Map();
  const sectorNodes = new Map();
  let macroRoot = null;
  let populationRoot = null;
  let lastMacroId = '';
  let lastPopulationCenter = '';
  let continuity = null;
  let actorVisuals = [];
  let discoveryVisuals = [];
  let streetVisuals = [];
  let lastSeconds = 0;

  const materialFor = (accent = '#55eaff', role = 'building', alpha = 1) => {
    const key = `${accent}:${role}:${alpha}`;
    if (materialCache.has(key)) return materialCache.get(key);
    const intensity = role === 'road' ? 0.48 : role === 'landmark' ? 0.78 : role === 'population' ? 0.55 : 0.28;
    const material = makeMaterial(scene, `w766i-${role}-${materialCache.size}`, accent, intensity, alpha);
    materialCache.set(key, material);
    return material;
  };

  const mountSector = (plan = {}, ring = 'interactive') => {
    const protectedHero = isProtectedByAuthoredZone(plan, authoredZones);
    const node = new TransformNode(`w766i-${plan.id}`, scene);
    node.parent = sectorRoot;
    node.metadata = freeze({ kind: 'expanse-streamed-sector', sectorId: plan.id, ring, protectedHero });
    sectorNodes.set(plan.id, node);
    if (protectedHero) return node;
    const cell = plan.worldCell || {};
    const accent = cell?.visualIdentity?.accent || '#55eaff';
    const origin = plan.worldOrigin || { x: 0, z: 0 };
    const terrain = materialFor(accent, 'terrain', ring === 'horizon' ? 0.16 : 0.34);
    const road = materialFor(accent, 'road', ring === 'horizon' ? 0.18 : 0.5);
    const building = materialFor(accent, 'building', ring === 'horizon' ? 0.42 : 0.74);
    const landmark = materialFor(accent, 'landmark', 0.92);
    const size = ring === 'interactive' ? 43 : ring === 'visible' ? 38 : 31;
    attach(MeshBuilder.CreateBox(`w766i-ground-${plan.id}`, { width: size, height: 0.12, depth: size }, scene), node, terrain, { x: origin.x, y: -0.2, z: origin.z }, { collisions: ring === 'interactive' });
    if (ring !== 'horizon') {
      attach(MeshBuilder.CreateBox(`w766i-road-x-${plan.id}`, { width: size * 0.94, height: 0.04, depth: 2.8 }, scene), node, road, { x: origin.x, y: -0.1, z: origin.z }, { collisions: false });
      attach(MeshBuilder.CreateBox(`w766i-road-z-${plan.id}`, { width: 2.8, height: 0.04, depth: size * 0.94 }, scene), node, road, { x: origin.x, y: -0.09, z: origin.z }, { collisions: false });
    }
    const lots = Array.isArray(cell.lotPlan) ? cell.lotPlan.slice(0, ring === 'horizon' ? profile.skyline : ring === 'visible' ? Math.min(profile.lots, 4) : profile.lots) : [];
    lots.forEach((lot, index) => {
      const height = heightFor(lot, ring);
      const width = ring === 'horizon' ? 4.2 + index % 3 : 3.2 + (index % 3) * 0.9;
      const depth = ring === 'horizon' ? 3.5 + (index + 1) % 3 : 2.8 + ((index + 1) % 3) * 0.8;
      const mesh = shapeForLot(scene, `w766i-lot-${plan.id}-${index}`, lot, width, depth, height);
      mesh.rotation.y += Number(lot.rotationQuarter || 0) * Math.PI / 2;
      attach(mesh, node, building, {
        x: origin.x + Number(lot.x || 0) * 3.8,
        y: height / 2 - 0.12,
        z: origin.z + Number(lot.z || 0) * 3.8
      }, { collisions: ring === 'interactive' && developmentPreview === true, metadata: { kind: 'expanse-streamed-building', sectorId: plan.id, form: lot.form, regionId: cell?.region?.id, presentationTruth: 'development-proxy', releaseReady: false, finishedHeroArt: false } });
      mesh.setEnabled(developmentPreview === true);
    });
    if (ring === 'interactive' && cell.publicSpaceProfile?.id && cell.publicSpaceProfile.id !== 'none') {
      const plaza = MeshBuilder.CreateCylinder(`w766i-plaza-${plan.id}`, { diameter: 7 * Number(cell.publicSpaceProfile.scale || 1), height: 0.14, tessellation: 24 }, scene);
      attach(plaza, node, road, { x: origin.x, y: -0.02, z: origin.z }, { collisions: false, metadata: { kind: 'expanse-public-space', sectorId: plan.id, profileId: cell.publicSpaceProfile.id, presentationTruth: 'layout-proxy', releaseReady: false, finishedHeroArt: false } });
      plaza.setEnabled(developmentPreview === true);
    }
    if (ring === 'interactive') {
      const contract = buildEonExpanseW766IFrontierContract({ sectorPlan: plan, cycleKey: new Date().toISOString().slice(0, 10) });
      const height = contract.rarity === 'legendary' ? 7.5 : contract.rarity === 'epic' ? 6.4 : contract.rarity === 'rare' ? 5.4 : contract.rarity === 'uncommon' ? 4.8 : 4.2;
      const contractX = origin.x + 8;
      const contractZ = origin.z - 8;
      const marker = MeshBuilder.CreateCylinder(`w766i-landmark-${plan.id}`, { diameterTop: cell.landmark ? 0.55 : 0.18, diameterBottom: cell.landmark ? 2.4 : 1.35, height, tessellation: cell.landmark ? 16 : 10 }, scene);
      attach(marker, node, landmark, { x: contractX, y: height / 2, z: contractZ }, {
        collisions: false,
        pickable: true,
        metadata: { kind: 'expanse-frontier-contract', action: 'frontier-contract-interaction', sectorId: plan.id, landmark: cell.landmark || null, contract, presentationTruth: 'interaction-target-only', releaseReady: true, finishedHeroArt: false }
      });
      const stepOffsets = [[3.4, 1.8], [-3.1, 2.4], [0.2, -3.6]];
      for (let stepIndex = 0; stepIndex < contract.steps.length; stepIndex += 1) {
        const step = contract.steps[stepIndex];
        const offset = stepOffsets[stepIndex] || [Math.cos(stepIndex * 2.1) * 3.5, Math.sin(stepIndex * 2.1) * 3.5];
        const stepMesh = stepIndex === 0
          ? MeshBuilder.CreateTorus(`w766i-contract-step-${plan.id}-${step.id}`, { diameter: 1.15, thickness: 0.14, tessellation: 18 }, scene)
          : stepIndex === 1
            ? MeshBuilder.CreateSphere(`w766i-contract-step-${plan.id}-${step.id}`, { diameter: 0.9, segments: 10 }, scene)
            : MeshBuilder.CreateCylinder(`w766i-contract-step-${plan.id}-${step.id}`, { diameterTop: 0.25, diameterBottom: 0.85, height: 1.4, tessellation: 12 }, scene);
        if (stepIndex === 0) stepMesh.rotation.x = Math.PI / 2;
        attach(stepMesh, node, landmark, { x: contractX + offset[0], y: stepIndex === 2 ? 0.7 : 0.55, z: contractZ + offset[1] }, {
          collisions: false,
          pickable: true,
          metadata: { kind: 'expanse-frontier-contract-step', action: 'frontier-contract-step', sectorId: plan.id, contract, stepId: step.id, stepIndex, step, presentationTruth: 'interaction-target-only', releaseReady: true, finishedHeroArt: false }
        });
      }
    }
    return node;
  };

  const unmountSector = (record = {}) => {
    const node = sectorNodes.get(record.id);
    try { node?.dispose?.(false, true); } catch {}
    sectorNodes.delete(record.id);
  };

  const rebuildMacro = (next) => {
    try { macroRoot?.dispose?.(false, true); } catch {}
    macroRoot = new TransformNode('w766i-macro-root', scene); macroRoot.parent = continuityRoot;
    const currentRegionId = next.macroPlan.currentRegionId;
    for (const cluster of next.presentation.skylineClusters || []) {
      if (cluster.regionId === currentRegionId) continue;
      const region = next.macroPlan.regions.find((entry) => entry.id === cluster.regionId);
      const accent = region?.archetype?.accent || '#55eaff';
      const material = materialFor(accent, 'skyline', region?.role === 'horizon' ? 0.28 : 0.42);
      for (const entry of cluster.nodes || []) {
        const mesh = MeshBuilder.CreateBox(`w766i-macro-${entry.id}`, { width: entry.width, height: entry.height, depth: entry.depth }, scene);
        attach(mesh, macroRoot, material, entry.position, { collisions: false, metadata: { kind: 'expanse-macro-skyline', regionId: entry.regionId, family: entry.family, silhouette: entry.silhouette, presentationTruth: 'distant-silhouette', releaseReady: true, finishedHeroArt: false } });
      }
    }
    const roadMaterial = materialFor('#55eaff', 'road', 0.18);
    for (const road of next.presentation.roadHierarchy || []) {
      const dx = road.to.x - road.from.x;
      const dz = road.to.z - road.from.z;
      const length = Math.hypot(dx, dz);
      if (!Number.isFinite(length) || length < 1) continue;
      const mesh = MeshBuilder.CreateBox(`w766i-macro-road-${road.id}`, { width: Number(road.width || 2.4), height: 0.05, depth: length }, scene);
      mesh.rotation.y = Math.atan2(dx, dz);
      attach(mesh, macroRoot, roadMaterial, { x: (road.from.x + road.to.x) / 2, y: -0.32, z: (road.from.z + road.to.z) / 2 }, { collisions: false });
    }
  };

  const rebuildPopulation = (next) => {
    try { populationRoot?.dispose?.(false, true); } catch {}
    populationRoot = new TransformNode('w766i-population-root', scene); populationRoot.parent = continuityRoot;
    actorVisuals = [];
    discoveryVisuals = [];
    streetVisuals = [];
    const populationMaterial = materialFor('#75f7cf', 'population', 0.7);
    const discoveryMaterial = materialFor('#d6f5ff', 'landmark', 0.9);
    const streetMaterial = materialFor('#ffc45c', 'road', 0.62);
    for (const actor of (next.population.population || []).slice(0, profile.actors)) {
      const mesh = actor.archetype?.silhouette === 'orb' || actor.archetype?.silhouette === 'drone'
        ? MeshBuilder.CreateSphere(`w766i-${actor.id}`, { diameter: 0.44, segments: 8 }, scene)
        : MeshBuilder.CreateCapsule?.(`w766i-${actor.id}`, { height: 1.5, radius: 0.23, tessellation: 8 }, scene) || MeshBuilder.CreateCylinder(`w766i-${actor.id}`, { height: 1.5, diameter: 0.42, tessellation: 8 }, scene);
      attach(mesh, populationRoot, populationMaterial, actor.start, { collisions: false, metadata: { kind: 'expanse-ambient-actor', archetypeId: actor.archetype?.id, activity: actor.activity, claimsRealWork: false, presentationTruth: 'ambient-development-proxy', releaseReady: false, finishedCharacterArt: false } });
      mesh.scaling.setAll(Number(actor.scale || 1));
      mesh.setEnabled(developmentPreview === true);
      actorVisuals.push({ mesh, actor });
    }
    for (const discovery of (next.population.discoveries || []).slice(0, profile.discoveries)) {
      const visual = resolveEonCityW698DiscoveryVisual(discovery.kind, discovery.rarity);
      const mesh = MeshBuilder.CreateTorus(`w766i-${discovery.id}`, { diameter: 1.15 * visual.scale, thickness: 0.11, tessellation: 18 }, scene);
      mesh.rotation.x = Math.PI / 2;
      attach(mesh, populationRoot, discoveryMaterial, discovery.position, { pickable: true, metadata: { kind: 'expanse-procedural-discovery', action: 'procedural-discovery-reviewed', discovery, visual, presentationTruth: 'interaction-symbol', releaseReady: true, finishedHeroArt: false } });
      discoveryVisuals.push({ mesh, discovery, visual });
    }
    for (const activity of (next.population.streetActivity || []).slice(0, profile.street)) {
      const visual = resolveEonCityW698StreetActivityVisual(activity.kind);
      const mesh = MeshBuilder.CreateBox(`w766i-${activity.id}`, { width: 0.7, height: 0.08, depth: 0.7 }, scene);
      attach(mesh, populationRoot, streetMaterial, activity.position, { collisions: false, metadata: { kind: 'expanse-street-activity', activityId: activity.id, activityKind: activity.kind, claimsRealActivity: false, presentationTruth: 'ambient-symbol', releaseReady: true, finishedHeroArt: false } });
      streetVisuals.push({ mesh, activity, visual });
    }
  };

  const refresh = ({ position = {}, sectorRecords = [] } = {}) => {
    const next = buildEonExpanseW766IOpenWorldContinuity({ worldSeed, position, quality: resolvedQuality, reducedMotion, sectorRecords });
    const validation = validateEonExpanseW766IOpenWorldContinuity(next);
    if (!validation.ok) return freeze({ ok: false, reason: 'continuity-validation-failed', errors: validation.errors });
    continuity = next;
    if (lastMacroId !== next.macroPlan.currentRegionId) {
      lastMacroId = next.macroPlan.currentRegionId;
      rebuildMacro(next);
    }
    const populationCenter = `${Math.round(Number(position.x || 0) / 48)}:${Math.round(Number(position.z || 0) / 48)}`;
    if (lastPopulationCenter !== populationCenter) {
      lastPopulationCenter = populationCenter;
      rebuildPopulation(next);
    }
    return freeze({ ok: true, currentMacroId: lastMacroId, populationCenter: lastPopulationCenter, retentionMatrix: next.retentionMatrix });
  };

  const suspend = () => {
    try { macroRoot?.dispose?.(false, true); } catch {}
    try { populationRoot?.dispose?.(false, true); } catch {}
    macroRoot = null;
    populationRoot = null;
    actorVisuals = [];
    discoveryVisuals = [];
    streetVisuals = [];
    lastMacroId = '';
    lastPopulationCenter = '';
    continuity = null;
    return freeze({ ok: true, retainedSectorCount: sectorNodes.size, macroDisposed: true, populationDisposed: true });
  };

  const update = (seconds = 0) => {
    lastSeconds = Number(seconds || 0);
    if (!reducedMotion) {
      for (const { mesh, actor } of actorVisuals) {
        const t = (Math.sin(lastSeconds * Number(actor.speed || 0.02) * 30 + Number(actor.phase || 0) * Math.PI * 2) + 1) / 2;
        mesh.position.x = actor.start.x + (actor.end.x - actor.start.x) * t;
        mesh.position.z = actor.start.z + (actor.end.z - actor.start.z) * t;
      }
      for (const { mesh, discovery, visual } of discoveryVisuals) {
        mesh.position.y = discovery.position.y + Math.sin(lastSeconds * 1.4 + discovery.position.x) * 0.12 * Number(visual.verticalScale || 1);
        mesh.rotation.z = lastSeconds * 0.28;
      }
      for (const { mesh, activity, visual } of streetVisuals) {
        if (visual.motion === 'rotate') mesh.rotation.y = lastSeconds * 0.45;
        if (visual.motion === 'pulse') mesh.scaling.setAll(0.9 + (Math.sin(lastSeconds * 2 + activity.phase * 6) + 1) * 0.08);
      }
    }
    return getSummary();
  };

  const getSummary = () => {
    const childMeshes = root.getChildMeshes?.() || [];
    const developmentBuildingProxyCount = childMeshes.filter((mesh) => mesh.metadata?.presentationTruth === 'development-proxy').length;
    const ambientDevelopmentProxyCount = childMeshes.filter((mesh) => mesh.metadata?.presentationTruth === 'ambient-development-proxy').length;
    const visibleDevelopmentProxyCount = childMeshes.filter((mesh) => ['development-proxy', 'layout-proxy', 'ambient-development-proxy'].includes(mesh.metadata?.presentationTruth) && mesh.isEnabled?.() !== false).length;
    const interactionPrimitiveCount = childMeshes.filter((mesh) => mesh.metadata?.presentationTruth === 'interaction-target-only').length;
    const distantSilhouetteCount = childMeshes.filter((mesh) => mesh.metadata?.presentationTruth === 'distant-silhouette').length;
    return freeze({
    schema: EON_EXPANSE_W766I_RENDERER_SCHEMA,
    mountedSectorCount: sectorNodes.size,
    currentMacroId: lastMacroId,
    macroSkylineCount: macroRoot?.getChildMeshes?.().filter((mesh) => mesh.metadata?.kind === 'expanse-macro-skyline').length || 0,
    ambientActorCount: actorVisuals.length,
    proceduralDiscoveryCount: discoveryVisuals.length,
    streetActivityCount: streetVisuals.length,
    developmentBuildingProxyCount,
    ambientDevelopmentProxyCount,
    visibleDevelopmentProxyCount,
    developmentPreviewEnabled: developmentPreview === true,
    releasePresentationHidesDevelopmentProxies: developmentPreview !== true,
    interactionPrimitiveCount,
    distantSilhouetteCount,
    futureRegionReleaseArtReady: developmentBuildingProxyCount === 0 && ambientDevelopmentProxyCount === 0,
    presentationTruth: developmentBuildingProxyCount || ambientDevelopmentProxyCount ? 'development-proxies-present' : 'authored-presentation-only',
    rawPrimitiveHeroCount: 0,
    quality: resolvedQuality,
    performanceEstimate: continuity?.performanceEstimate || null,
    performanceBudget: continuity?.performanceBudget || null,
    retentionMatrix: continuity?.retentionMatrix || null,
    canonicalScene: root.getScene?.() === scene,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    visibleHardBorder: false
  });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766I_RENDERER_SCHEMA,
    root,
    mountSector,
    unmountSector,
    refresh,
    suspend,
    update,
    getSummary,
    dispose() {
      actorVisuals = []; discoveryVisuals = []; streetVisuals = [];
      sectorNodes.clear(); materialCache.clear();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W766I_RENDERER_SCHEMA, mountEonExpanseW766IOpenWorldRenderer });
