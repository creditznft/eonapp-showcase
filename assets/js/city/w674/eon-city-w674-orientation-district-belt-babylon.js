/**
 * W674 — Orientation Hall District Belt renderer.
 *
 * Renders the first C3 belt into the existing Babylon scene. It intentionally
 * uses bounded procedural architecture and resident silhouettes only while a
 * preferred authored GLB resident is unavailable. W676 hides each fallback as
 * soon as the existing W649 residency runtime reports its real asset. It
 * owns no engine, canvas, render loop, storage, route change or AI execution.
 */

import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import {
  buildEonCityW674OrientationDistrictBeltPlan,
  validateEonCityW674OrientationDistrictBeltPlan
} from './eon-city-w674-orientation-district-belt.js';
import { projectEonCityW676OrientationResidentPresentation } from '../w676/eon-city-w676-orientation-resident-coherence.js';
import { buildEonCityW678ExpanseThresholdPlan } from '../w678/eon-city-w678-expanse-threshold.js';

export const EON_CITY_W674_ORIENTATION_BELT_BABYLON_SCHEMA = 'eon.city.orientation-district-belt-babylon.w674.v1';

const freeze = (value) => Object.freeze(value);
function hex(value, fallback = '#55eaff') { try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); } }
function makeMaterial(scene, name, { diffuse = '#101827', emissive = '#55eaff', intensity = 0.15, alpha = 1 } = {}) {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = hex(diffuse, '#101827');
  result.emissiveColor = hex(emissive, '#55eaff').scale(Math.max(0, Number(intensity) || 0));
  result.specularColor = Color3.Black();
  result.alpha = Math.max(0.04, Math.min(1, Number(alpha) || 1));
  result.backFaceCulling = result.alpha >= 0.98;
  return result;
}
function safeDispose(node) { try { node?.dispose?.(false, false); } catch { try { node?.dispose?.(); } catch {} } }
function attach(mesh, parent, material, metadata = {}) {
  mesh.parent = parent;
  mesh.material = material;
  mesh.isPickable = metadata.interactive === true;
  mesh.metadata = freeze({ localOnly: true, automaticNavigation: false, automaticExecution: false, ...metadata });
  return mesh;
}
function place(mesh, position = {}) {
  mesh.position.set(Number(position.x) || 0, Number(position.y) || 0, Number(position.z) || 0);
  return mesh;
}
function segment(scene, parent, name, from, to, width, height, material, metadata = {}) {
  const dx = Number(to.x) - Number(from.x);
  const dz = Number(to.z) - Number(from.z);
  const length = Math.max(0.2, Math.hypot(dx, dz));
  const mesh = attach(MeshBuilder.CreateBox(name, { width, depth: length, height }, scene), parent, material, metadata);
  mesh.position.set((Number(from.x) + Number(to.x)) / 2, height / 2, (Number(from.z) + Number(to.z)) / 2);
  mesh.rotation.y = Math.atan2(dx, dz);
  return mesh;
}
function addWindowBands(scene, parent, building, buildingMesh, material, count = 3) {
  const windows = [];
  const rows = Math.max(1, Math.min(5, Number(count) || 3));
  for (let row = 0; row < rows; row += 1) {
    const band = attach(MeshBuilder.CreateBox(`w674-${building.id}-window-band-${row + 1}`, {
      width: Math.max(1, building.dimensions.width * 0.72),
      height: 0.11,
      depth: 0.08
    }, scene), parent, material, { kind: 'orientation-building-window-band', buildingId: building.id, decorative: true });
    band.position.set(building.position.x, 1.1 + row * 1.45, building.position.z - building.dimensions.depth / 2 - 0.045);
    windows.push(band);
  }
  buildingMesh.metadata = freeze({ ...buildingMesh.metadata, windowBandCount: windows.length });
  return windows;
}

export function createEonCityW674OrientationDistrictBeltRenderer({
  scene,
  parent = null,
  quality = 'balanced',
  reducedEffects = false,
  mode = 'explore',
  onStatus = null
} = {}) {
  if (!scene) throw new Error('w674-orientation-belt-scene-required');
  const plan = buildEonCityW674OrientationDistrictBeltPlan({ quality, mode });
  const validation = validateEonCityW674OrientationDistrictBeltPlan(plan);
  if (!validation.ok) throw new Error(`w674-orientation-belt-plan-invalid:${validation.errors.join(',')}`);
  const expanseThreshold = buildEonCityW678ExpanseThresholdPlan({ quality, mode });

  const root = new TransformNode('w674-orientation-district-belt-root', scene);
  root.parent = parent || null;
  root.metadata = freeze({ kind: 'orientation-district-belt-root', districtId: plan.districtId, oneCanonicalScene: true, localOnly: true });
  const materials = {
    ground: makeMaterial(scene, 'w674-orientation-ground', { diffuse: '#07131e', emissive: '#0d3650', intensity: 0.14 }),
    road: makeMaterial(scene, 'w674-orientation-road', { diffuse: '#0b1018', emissive: '#1b4052', intensity: 0.12 }),
    lane: makeMaterial(scene, 'w674-orientation-lane', { diffuse: '#163448', emissive: '#55eaff', intensity: 0.72 }),
    architecture: makeMaterial(scene, 'w674-orientation-architecture', { diffuse: '#102435', emissive: '#34d9ff', intensity: 0.22 }),
    architectureDark: makeMaterial(scene, 'w674-orientation-architecture-dark', { diffuse: '#09111d', emissive: '#16384b', intensity: 0.1 }),
    warm: makeMaterial(scene, 'w674-orientation-warm', { diffuse: '#3a2a12', emissive: '#f4b860', intensity: 0.66 }),
    glass: makeMaterial(scene, 'w674-orientation-glass', { diffuse: '#0c2937', emissive: '#55eaff', intensity: 0.34, alpha: 0.42 }),
    green: makeMaterial(scene, 'w674-orientation-ecology', { diffuse: '#123529', emissive: '#75f7cf', intensity: 0.24 }),
    resident: makeMaterial(scene, 'w674-orientation-resident', { diffuse: '#17233a', emissive: '#8aa5ff', intensity: 0.46 }),
    residentWarm: makeMaterial(scene, 'w674-orientation-resident-warm', { diffuse: '#2b2217', emissive: '#ffc45c', intensity: 0.48 }),
    terminal: makeMaterial(scene, 'w674-orientation-terminal', { diffuse: '#122538', emissive: '#55eaff', intensity: 0.64 }),
    expanse: makeMaterial(scene, 'w674-orientation-expanse-gate', { diffuse: '#1d1230', emissive: '#ad78ff', intensity: 0.82 })
  };
  const materialList = Object.values(materials);
  const buildingNodes = [];
  const residentNodes = [];
  const terminalNodes = [];
  const stationNodes = [];
  const gateNodes = [];
  const expansePreviewNodes = [];
  const furnitureNodes = [];
  let capsuleNode = null;
  let dockBeacon = null;
  let horizonBeacon = null;
  let disposed = false;
  let visible = true;
  let authoredResidentAssetIds = freeze([]);
  let residentPresentation = projectEonCityW676OrientationResidentPresentation(plan.residents, authoredResidentAssetIds);

  const districtGround = attach(MeshBuilder.CreateGround('w674-orientation-belt-ground', {
    width: plan.beltRadius * 2.15,
    height: plan.beltRadius * 2.15,
    subdivisions: 1
  }, scene), root, materials.ground, { kind: 'orientation-district-ground', districtId: plan.districtId, decorative: false });
  districtGround.position.set(plan.center.x, 0.012, plan.center.z);

  for (const street of plan.streets) {
    segment(scene, root, `w674-${street.id}`, street.from, street.to, Number(street.width) || 1.5, 0.065, materials.road, {
      kind: 'orientation-district-street', streetId: street.id, districtId: plan.districtId, pedestrianSafe: true
    });
    segment(scene, root, `w674-${street.id}-lane`, street.from, street.to, 0.06, 0.085, materials.lane, {
      kind: 'orientation-district-lane', streetId: street.id, districtId: plan.districtId, decorative: true
    });
  }

  const plaza = plan.publicSpaces.arrivalPlaza;
  const plazaNode = attach(MeshBuilder.CreateCylinder('w674-orientation-arrival-plaza', {
    diameter: 9.8,
    height: 0.12,
    tessellation: 36
  }, scene), root, materials.architecture, { kind: 'orientation-arrival-plaza', publicSpaceId: plaza.id, productive: true });
  place(plazaNode, { ...plaza.position, y: 0.06 });
  const plazaInlay = attach(MeshBuilder.CreateBox('w674-orientation-arrival-plaza-inlay', { width: 5.8, depth: 0.11, height: 0.035 }, scene), root, materials.warm, { kind: 'orientation-arrival-inlay', decorative: true });
  place(plazaInlay, { ...plaza.position, y: 0.135 });

  for (const [index, building] of plan.buildings.entries()) {
    const body = attach(MeshBuilder.CreateBox(`w674-${building.id}`, {
      width: building.dimensions.width,
      depth: building.dimensions.depth,
      height: building.dimensions.totalHeight
    }, scene), root, index % 2 ? materials.architectureDark : materials.architecture, {
      kind: 'orientation-functional-building',
      interactionKind: 'landmark',
      assetId: building.id,
      interactionId: building.id,
      buildingId: building.id,
      buildingKind: building.kind,
      label: building.label,
      route: building.route,
      verbs: building.verbs,
      reviewFirst: true,
      interactive: true,
      privateContentStored: false
    });
    body.position.set(building.position.x, building.dimensions.totalHeight / 2, building.position.z);
    const entrance = attach(MeshBuilder.CreateBox(`w674-${building.id}-entrance`, { width: 1.55, height: 2.2, depth: 0.18 }, scene), root, materials.glass, {
      kind: 'orientation-building-entrance', interactionKind: 'landmark', assetId: building.id, interactionId: building.id, buildingId: building.id, label: building.label, route: building.route, reviewFirst: true, interactive: true
    });
    place(entrance, { ...building.entrancePosition, y: 1.1 });
    const roof = attach(MeshBuilder.CreateBox(`w674-${building.id}-roof`, { width: building.dimensions.width * 0.78, depth: building.dimensions.depth * 0.78, height: 0.24 }, scene), root, index % 2 ? materials.warm : materials.lane, { kind: 'orientation-building-roof-signal', buildingId: building.id, decorative: true });
    roof.position.set(building.position.x, building.dimensions.totalHeight + 0.12, building.position.z);
    buildingNodes.push(body, entrance, roof, ...addWindowBands(scene, root, building, body, index % 2 ? materials.warm : materials.lane, building.windowRows));
  }

  for (const [index, terminal] of plan.terminals.entries()) {
    const pedestal = attach(MeshBuilder.CreateBox(`w674-${terminal.id}-pedestal`, { width: 0.86, height: 0.82, depth: 0.7 }, scene), root, materials.architectureDark, { kind: 'orientation-terminal-pedestal', terminalId: terminal.id, decorative: false });
    place(pedestal, { ...terminal.position, y: 0.41 });
    const screen = attach(MeshBuilder.CreateBox(`w674-${terminal.id}-screen`, { width: 0.72, height: 0.58, depth: 0.08 }, scene), root, index === 2 ? materials.warm : materials.terminal, {
      kind: 'productive-terminal-screen', interactionKind: 'terminal', assetId: terminal.id, terminalId: terminal.id,
      terminalLabel: terminal.label, route: terminal.route, reviewFirst: true, interactive: true, autoExecute: false, autoNavigate: false, decorative: false
    });
    place(screen, { ...terminal.position, y: 1.05 });
    screen.rotation.x = -0.14;
    terminalNodes.push(pedestal, screen);
  }

  for (const [index, resident] of plan.residents.entries()) {
    const actor = attach(MeshBuilder.CreateCapsule(`w674-resident-${resident.id}`, { height: 1.65, radius: 0.28, tessellation: 10 }, scene), root, index % 3 === 2 ? materials.residentWarm : materials.resident, {
      kind: 'orientation-functional-resident',
      interactionKind: 'npc',
      assetId: resident.preferredAssetId,
      interactionId: resident.id,
      residentId: resident.id,
      role: resident.role,
      label: resident.label,
      preferredAssetId: resident.preferredAssetId,
      animationSchedule: resident.schedule,
      fallbackSilhouette: true,
      explicitInteraction: true,
      claimsRealWork: false,
      interactive: true
    });
    place(actor, { ...resident.anchor, y: 0.84 });
    residentNodes.push(freeze({ residentId: resident.id, preferredAssetId: resident.preferredAssetId, node: actor, baseX: resident.anchor.x, baseZ: resident.anchor.z, phase: index * 0.9, radius: 0.45 + (index % 2) * 0.18 }));
  }

  const station = plan.station;
  const stationBase = attach(MeshBuilder.CreateCylinder('w674-orientation-transit-station', { diameter: station.platformRadius * 2, height: 0.16, tessellation: 36 }, scene), root, materials.architecture, {
    kind: 'orientation-transit-station', stationId: station.id, label: station.label, capsuleCompatible: true, explicitTravelReviewRequired: true, interactive: true
  });
  place(stationBase, { ...station.position, y: 0.08 });
  const stationCanopy = attach(MeshBuilder.CreateTorus('w674-orientation-transit-canopy', { diameter: 5.4, thickness: 0.16, tessellation: 40 }, scene), root, materials.warm, { kind: 'orientation-transit-canopy', stationId: station.id, decorative: true });
  place(stationCanopy, { ...station.position, y: 2.35 });
  stationCanopy.rotation.x = Math.PI / 2;
  capsuleNode = attach(MeshBuilder.CreateCapsule('w674-orientation-transit-capsule', { height: 3.2, radius: 0.68, tessellation: 16 }, scene), root, materials.glass, {
    kind: 'orientation-transit-capsule', stationId: station.id, preferredAssetId: station.capsuleAssetPreference,
    fallback: station.capsuleFallback, boardingRequiresReview: true, skipRideAvailable: true, automaticTravel: false, interactive: true
  });
  capsuleNode.position.set(station.position.x, 0.82, station.position.z + 0.3);
  capsuleNode.rotation.z = Math.PI / 2;
  stationNodes.push(stationBase, stationCanopy, capsuleNode);

  const dock = plan.eonbotDock;
  const dockBase = attach(MeshBuilder.CreateCylinder('w674-orientation-eonbot-dock', { diameter: 1.2, height: 0.18, tessellation: 24 }, scene), root, materials.green, {
    kind: 'orientation-eonbot-dock', assetId: dock.id, interactionId: dock.id, interactionKind: 'companion-dock', dockId: dock.id, label: dock.label || 'Orientation EONBOT Dock', purpose: 'Call EONBOT to the visible dock after an explicit review.', interactionRadius: 3.2, explicitCallRequired: true, automaticDocking: false, interactive: true
  });
  place(dockBase, { ...dock.position, y: 0.09 });
  dockBeacon = attach(MeshBuilder.CreateSphere('w674-orientation-eonbot-dock-beacon', { diameter: 0.22, segments: 12 }, scene), root, materials.lane, { kind: 'orientation-eonbot-dock-beacon', dockId: dock.id, decorative: true });
  place(dockBeacon, { ...dock.position, y: 0.88 });

  const gate = plan.expanseGate;
  const gateOuter = attach(MeshBuilder.CreateTorus('w674-orientation-expanse-gate-outer', { diameter: 5.2, thickness: 0.2, tessellation: 56 }, scene), root, materials.expanse, {
    kind: 'orientation-expanse-gate', gatewayId: gate.id, label: gate.label, inspectRadius: gate.inspectRadius, enterRadius: gate.enterRadius,
    reviewFirst: true, separateConfirmationRequired: true, automaticEntry: false, interactive: true
  });
  place(gateOuter, { ...gate.position, y: 2.6 });
  gateOuter.rotation.x = Math.PI / 2;
  const gateInner = attach(MeshBuilder.CreateTorus('w674-orientation-expanse-gate-inner', { diameter: 4.25, thickness: 0.09, tessellation: 56 }, scene), root, materials.warm, gateOuter.metadata);
  place(gateInner, { ...gate.position, y: 2.6 });
  gateInner.rotation.x = Math.PI / 2;
  gateInner.rotation.z = Math.PI / 4;
  const gateThreshold = attach(MeshBuilder.CreateBox('w674-orientation-expanse-gate-threshold', { width: 5.8, depth: 2.4, height: 0.12 }, scene), root, materials.glass, { kind: 'orientation-expanse-threshold', gatewayId: gate.id, reviewFirst: true, automaticEntry: false });
  place(gateThreshold, { ...gate.position, y: 0.06 });
  gateNodes.push(gateOuter, gateInner, gateThreshold);

  for (const corridor of expanseThreshold.corridor) {
    const road = segment(scene, root, `w678-${corridor.id}`, corridor.from, corridor.to, corridor.width, 0.055, materials.road, {
      kind: 'orientation-expanse-preview-road', gatewayId: gate.id, previewOnly: true, interactive: false
    });
    const lane = segment(scene, root, `w678-${corridor.id}-lane`, corridor.from, corridor.to, 0.075, 0.075, materials.expanse, {
      kind: 'orientation-expanse-preview-lane', gatewayId: gate.id, previewOnly: true, interactive: false
    });
    expansePreviewNodes.push(road, lane);
  }
  for (const building of expanseThreshold.skyline) {
    const silhouette = attach(MeshBuilder.CreateBox(`w678-${building.id}`, {
      width: building.width,
      depth: building.depth,
      height: building.height
    }, scene), root, materials.architectureDark, {
      kind: 'orientation-expanse-horizon-silhouette', gatewayId: gate.id, previewOnly: true, containsPrivateData: false, interactive: false
    });
    silhouette.position.set(building.position.x, building.height / 2 - 0.02, building.position.z);
    expansePreviewNodes.push(silhouette);
  }
  horizonBeacon = attach(MeshBuilder.CreateCylinder('w678-expanse-horizon-beacon', { height: 5.8, diameter: 0.18, tessellation: 10 }, scene), root, materials.expanse, {
    kind: 'orientation-expanse-horizon-beacon', gatewayId: gate.id, previewOnly: true, decorative: false, interactive: false
  });
  place(horizonBeacon, expanseThreshold.horizonBeacon);
  expansePreviewNodes.push(horizonBeacon);

  const furniture = plan.streetFurniture;
  for (let index = 0; index < furniture.lampCount; index += 1) {
    const angle = (Math.PI * 2 * index) / Math.max(1, furniture.lampCount);
    const radius = plan.beltRadius - 2.1 - (index % 3) * 0.45;
    const x = plan.center.x + Math.sin(angle) * radius;
    const z = plan.center.z + Math.cos(angle) * radius;
    const post = attach(MeshBuilder.CreateCylinder(`w674-orientation-lamp-${index + 1}`, { height: 1.65, diameter: 0.08, tessellation: 8 }, scene), root, materials.architectureDark, { kind: 'orientation-street-lamp', decorative: true });
    post.position.set(x, 0.825, z);
    const lamp = attach(MeshBuilder.CreateSphere(`w674-orientation-lamp-head-${index + 1}`, { diameter: 0.18, segments: 8 }, scene), root, index % 4 === 0 ? materials.warm : materials.lane, { kind: 'orientation-street-lamp-head', decorative: true });
    lamp.position.set(x, 1.66, z);
    furnitureNodes.push(post, lamp);
  }
  for (let index = 0; index < furniture.treeCount; index += 1) {
    const angle = (Math.PI * 2 * index) / Math.max(1, furniture.treeCount) + 0.35;
    const radius = 8.6 + (index % 2) * 3.1;
    const x = plan.center.x + Math.sin(angle) * radius;
    const z = plan.center.z + Math.cos(angle) * radius;
    const trunk = attach(MeshBuilder.CreateCylinder(`w674-orientation-tree-trunk-${index + 1}`, { height: 1.35, diameterTop: 0.12, diameterBottom: 0.22, tessellation: 8 }, scene), root, materials.architectureDark, { kind: 'orientation-synthetic-tree-trunk', decorative: true });
    trunk.position.set(x, 0.675, z);
    const crown = attach(MeshBuilder.CreatePolyhedron(`w674-orientation-tree-crown-${index + 1}`, { type: 1, size: 0.72 }, scene), root, materials.green, { kind: 'orientation-synthetic-tree-crown', decorative: true });
    crown.position.set(x, 1.7, z);
    furnitureNodes.push(trunk, crown);
  }
  for (let index = 0; index < furniture.benchCount; index += 1) {
    const space = index % 2 ? plan.publicSpaces.quietCourt.position : plan.publicSpaces.workCommons.position;
    const bench = attach(MeshBuilder.CreateBox(`w674-orientation-bench-${index + 1}`, { width: 1.45, height: 0.28, depth: 0.46 }, scene), root, materials.architecture, { kind: 'orientation-public-bench', publicSpaceId: index % 2 ? plan.publicSpaces.quietCourt.id : plan.publicSpaces.workCommons.id, decorative: false });
    bench.position.set(space.x + (index - furniture.benchCount / 2) * 0.7, 0.14, space.z + (index % 2 ? 0.8 : -0.8));
    furnitureNodes.push(bench);
  }

  const applyResidentPresentation = () => {
    residentPresentation = projectEonCityW676OrientationResidentPresentation(plan.residents, authoredResidentAssetIds);
    const byResidentId = new Map(residentPresentation.residents.map((entry) => [entry.residentId, entry]));
    for (const [index, resident] of residentNodes.entries()) {
      const projected = byResidentId.get(resident.residentId);
      const focusVisible = plan.mode !== 'focus' || index <= 1;
      resident.node.setEnabled(Boolean(projected?.fallbackVisible && focusVisible && visible && !disposed));
    }
    return residentPresentation;
  };
  applyResidentPresentation();

  try { onStatus?.(`${plan.districtLabel} District Belt rendered locally with ${plan.buildings.length} functional buildings, ${plan.residents.length} resident anchors, transit, EONBOT dock and a reviewed Expanse gate.`); } catch {}

  const getSummary = () => freeze({
    schema: EON_CITY_W674_ORIENTATION_BELT_BABYLON_SCHEMA,
    visible: visible && !disposed,
    districtId: plan.districtId,
    center: plan.center,
    beltRadius: plan.beltRadius,
    buildingCount: plan.buildings.length,
    buildingNodeCount: buildingNodes.length,
    terminalCount: plan.terminals.length,
    terminalNodeCount: terminalNodes.length,
    residentCount: plan.residents.length,
    residentNodeCount: residentNodes.length,
    authoredResidentCount: residentPresentation.authoredCount,
    fallbackResidentCount: residentPresentation.fallbackCount,
    duplicateResidentRepresentations: residentPresentation.duplicateVisibleRepresentations,
    ambientPopulationTarget: plan.ambientPopulation,
    stationVisible: stationNodes.length > 0,
    transitCapsuleVisible: Boolean(capsuleNode),
    eonbotDockVisible: Boolean(dockBeacon),
    expanseGateVisible: gateNodes.length >= 3,
    expanseGateNodeCount: gateNodes.length,
    expansePreviewVisible: expansePreviewNodes.length > 0,
    expansePreviewNodeCount: expansePreviewNodes.length,
    expansePreviewSkylineCount: expanseThreshold.skyline.length,
    expansePreviewCorridorCount: expanseThreshold.corridor.length,
    furnitureNodeCount: furnitureNodes.length,
    purposefulArchitecture: true,
    genericOrbitClutter: false,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    disposed
  });

  return freeze({
    getPlan: () => plan,
    getSummary,
    setVisible(value) { visible = Boolean(value); root.setEnabled(visible); applyResidentPresentation(); return getSummary(); },
    setAuthoredResidentAssets(assetIds = []) {
      authoredResidentAssetIds = freeze([...new Set((Array.isArray(assetIds) ? assetIds : []).map((value) => String(value || '')).filter(Boolean))]);
      applyResidentPresentation();
      return getSummary();
    },
    getNearestGate(position = {}, { maxDistance = gate.inspectRadius } = {}) {
      if (disposed || !visible) return null;
      const distance = Math.hypot(Number(position?.x || 0) - gate.position.x, Number(position?.z || 0) - gate.position.z);
      if (distance > Math.max(0.5, Number(maxDistance) || gate.inspectRadius)) return null;
      return freeze({ ...gate, distance: Number(distance.toFixed(2)), inInspectRange: distance <= gate.inspectRadius, inEnterRange: distance <= gate.enterRadius });
    },
    update(now = globalThis.performance?.now?.() || Date.now()) {
      if (disposed || !visible || reducedEffects) return getSummary();
      const seconds = Number(now || 0) * 0.001;
      if (dockBeacon) dockBeacon.position.y = plan.eonbotDock.position.y + 0.88 + Math.sin(seconds * 1.2) * 0.08;
      if (capsuleNode && plan.mode === 'explore') capsuleNode.position.y = 0.82 + Math.sin(seconds * 0.55) * 0.035;
      if (horizonBeacon && plan.mode === 'explore') horizonBeacon.scaling.y = 0.96 + Math.sin(seconds * 0.62) * 0.04;
      const presentationByResidentId = new Map(residentPresentation.residents.map((entry) => [entry.residentId, entry]));
      for (const [index, resident] of residentNodes.entries()) {
        const projected = presentationByResidentId.get(resident.residentId);
        if (!projected?.fallbackVisible || (index > 1 && plan.mode === 'focus')) continue;
        resident.node.position.x = resident.baseX + Math.cos(seconds * 0.16 + resident.phase) * resident.radius;
        resident.node.position.z = resident.baseZ + Math.sin(seconds * 0.16 + resident.phase) * resident.radius;
        resident.node.rotation.y = -seconds * 0.16 - resident.phase + Math.PI / 2;
      }
      return getSummary();
    },
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      safeDispose(root);
      for (const entry of materialList) { try { entry.dispose?.(); } catch {} }
      return getSummary();
    }
  });
}

export default freeze({
  EON_CITY_W674_ORIENTATION_BELT_BABYLON_SCHEMA,
  createEonCityW674OrientationDistrictBeltRenderer
});
