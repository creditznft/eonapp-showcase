/**
 * W660R / W667 — rendered Living Nexus destinations inside the one canonical Babylon scene.
 *
 * The Expanse is a deterministic 5×5 visible streaming horizon with a 3×3 interactive neighbourhood. My Realm is
 * a bounded local reflection of verified transformation ids. This runtime does
 * not create an engine, canvas, render loop, network request, project store,
 * task store, assistant, reward, payment or background work execution.
 */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { EON_CITY_LIVING_NEXUS_ENTRY_POSES, buildEonCityLivingNexusExpanse } from './eon-city-living-nexus-hybrid.js';
import { buildEonCityLivingNexusEncounter, getEonCityLivingNexusMissionIdForOutcomeKind, resolveNearestEonCityLivingNexusEncounter } from './eon-city-living-nexus-encounters.js';
import { buildEonCityLivingNexusWorldSystemsPlan } from './eon-city-living-nexus-world-systems.js';
import { buildEonCityLivingNexusRealmPlan, getEonCityLivingNexusRealmCatalog } from './eon-city-living-nexus-realms.js';
import { createEonCityLivingNexusRealmBabylonRenderer } from './eon-city-living-nexus-realm-babylon.js';
import { createEonCityConnectedCoreBabylonRenderer } from './eon-city-connected-core-babylon.js';
import { EON_CITY_W667_PRACTICAL_WORLD_BOUND } from './w667/eon-city-w667-expanse-world-grammar.js';
import { resolveEonCityW670BuildingVisual, resolveEonCityW670CellVisualLanguage } from './w670/eon-city-w670-expanse-visual-language.js';
import { buildEonCityW681ExpanseMacroRegionPlan } from './w681/eon-city-w681-expanse-macro-regions.js';
import { buildEonCityW682ExpansePopulationPlan } from './w682/eon-city-w682-expanse-population.js';
import { buildEonCityW691MyRealmPlan } from './w691/eon-city-w691-realms-my-realm-integration.js';
import { resolveEonCityW692ExperienceProfile } from './w692/eon-city-w692-experience-quality.js';
import { buildEonCityW698ExpansePresentation, resolveEonCityW698DiscoveryVisual, resolveEonCityW698StreetActivityVisual, validateEonCityW698ExpansePresentation } from './w698/eon-city-w698-expanse-open-world-presentation.js';
import {
  buildEonCityW712FlagshipExpansePlan,
  createEonCityW712GatewayReview,
  resolveEonCityW712FlagshipExpanseEntryState,
  validateEonCityW712GatewayReview
} from './w712/eon-city-w712-flagship-expanse-entry.js';

export const EON_CITY_LIVING_NEXUS_BABYLON_SCHEMA = 'eon.city.living-nexus-babylon.w660r.v1';
export const EON_CITY_LIVING_NEXUS_WORLD_BOUND = EON_CITY_W667_PRACTICAL_WORLD_BOUND;
export { EON_CITY_LIVING_NEXUS_ENTRY_POSES };

const freeze = (value) => Object.freeze(value);
const DESTINATIONS = freeze(['core', 'expanse', 'my-realm', 'realm']);
const MODES = freeze(['focus', 'explore']);
const QUALITY = freeze({
  lite: freeze({ buildingCount: 2, activity: false, routeMarkers: false, streetFurnitureCount: 0, realmCapacity: 5 }),
  balanced: freeze({ buildingCount: 3, activity: true, routeMarkers: true, streetFurnitureCount: 2, realmCapacity: 8 }),
  cinematic: freeze({ buildingCount: 5, activity: true, routeMarkers: true, streetFurnitureCount: 4, realmCapacity: 12 })
});
const IDENTITY_COLOURS = freeze({
  'cyan-command': '#55eaff',
  'violet-forge': '#ad78ff',
  'amber-transit': '#ffc45c',
  'mint-archive': '#75f7cf',
  'gold-sovereign': '#ffda73'
});
const TRANSFORMATION_COLOURS = freeze({
  core: '#55eaff',
  expanse: '#ffc45c',
  'my-realm': '#ad78ff'
});
const CELL_SIZE = 10;
const MAX_TRANSFORMATIONS = 12;

function color(value, fallback = '#55eaff') {
  try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); }
}

function normalizeQuality(value = 'balanced') {
  return QUALITY[String(value)] ? String(value) : 'balanced';
}

function normalizeDestination(value = 'core') {
  return DESTINATIONS.includes(String(value)) ? String(value) : 'core';
}

function normalizePosition(position = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  return freeze({ x: Number.isFinite(x) ? x : 0, z: Number.isFinite(z) ? z : 0 });
}

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'living-nexus')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function boundedTransformations(entries = [], capacity = MAX_TRANSFORMATIONS) {
  const rows = [];
  const seen = new Set();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const id = String(entry?.id || entry?.transformationId || '').trim();
    const destination = normalizeDestination(entry?.destination);
    const location = String(entry?.location || 'living-nexus').trim().slice(0, 80) || 'living-nexus';
    const label = String(entry?.label || id || 'Verified transformation').trim().slice(0, 100) || 'Verified transformation';
    if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(id) || seen.has(id)) continue;
    seen.add(id);
    rows.push(freeze({ id, destination, location, label, privateContentStored: false }));
    if (rows.length >= Math.min(MAX_TRANSFORMATIONS, Math.max(1, Number(capacity) || MAX_TRANSFORMATIONS))) break;
  }
  return freeze(rows);
}

function makeMaterial(scene, name, { diffuse = '#101b2e', emissive = '#55eaff', intensity = 0.18, alpha = 1 } = {}) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color(diffuse, '#101b2e');
  material.emissiveColor = color(emissive, '#55eaff').scale(Math.max(0, Number(intensity) || 0));
  material.alpha = Math.max(0.04, Math.min(1, Number(alpha) || 1));
  material.backFaceCulling = material.alpha >= 0.98;
  material.specularColor = Color3.Black();
  return material;
}

function disposeNode(node) {
  try { node?.dispose?.(false, false); } catch { try { node?.dispose?.(); } catch {} }
}

function cellCenter(cell = {}) {
  return freeze({ x: Number(cell.x || 0) * CELL_SIZE + CELL_SIZE / 2, z: Number(cell.z || 0) * CELL_SIZE + CELL_SIZE / 2 });
}

function createGroundSegment({ scene, parent, name, from = {}, to = {}, width = 1, height = 0.04, y = 0, material = null, metadata = null } = {}) {
  const dx = Number(to.x || 0) - Number(from.x || 0);
  const dz = Number(to.z || 0) - Number(from.z || 0);
  const length = Math.max(0.1, Math.hypot(dx, dz));
  const mesh = MeshBuilder.CreateBox(name, { width: Math.max(0.08, Number(width) || 1), depth: length, height: Math.max(0.02, Number(height) || 0.04) }, scene);
  mesh.parent = parent;
  mesh.position.set((Number(from.x || 0) + Number(to.x || 0)) / 2, Number(y || 0), (Number(from.z || 0) + Number(to.z || 0)) / 2);
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.material = material;
  mesh.isPickable = false;
  if (metadata) mesh.metadata = freeze({ ...metadata });
  return mesh;
}
function createW698SkylineMesh({ scene, parent, entry, material }) {
  const name = `w698-skyline-${entry.id}`;
  const s = String(entry.silhouette || 'block');
  let mesh;
  if (/dome|reef|shell|pod|canopy|garden/.test(s)) {
    mesh = MeshBuilder.CreateSphere(name, { diameter: 2, segments: 10 }, scene);
    mesh.scaling.set(entry.width / 2, entry.height / 2, entry.depth / 2);
  } else if (/spire|tower|needle|obelisk|stack|beacon/.test(s)) {
    mesh = MeshBuilder.CreateCylinder(name, { height: entry.height, diameterTop: Math.max(.2, entry.width * .18), diameterBottom: entry.width, tessellation: /crystal|obelisk/.test(s) ? 5 : 8 }, scene);
  } else if (/bridge|gantry|arcade|arch/.test(s)) {
    mesh = MeshBuilder.CreateBox(name, { width: entry.width * 1.5, depth: Math.max(.25, entry.depth * .28), height: Math.max(.35, entry.height * .14) }, scene);
  } else if (/terrace|citadel|cathedral|sanctum/.test(s)) {
    mesh = MeshBuilder.CreateCylinder(name, { height: entry.height, diameterTop: entry.width * .55, diameterBottom: entry.width, tessellation: 6 }, scene);
  } else {
    mesh = MeshBuilder.CreateBox(name, { width: entry.width, depth: entry.depth, height: entry.height }, scene);
  }
  mesh.parent = parent; mesh.position.set(entry.position.x, entry.position.y, entry.position.z); mesh.material = material; mesh.isPickable = false;
  mesh.metadata = freeze({ kind: 'w698-expanse-skyline', regionId: entry.regionId, architectureFamily: entry.family, silhouette: entry.silhouette, lod: entry.lod, collision: false, interactive: false, localOnly: true });
  return mesh;
}
function createW698DiscoveryMesh({ scene, name, visual }) {
  if (visual.shape === 'signal-garden') return MeshBuilder.CreateSphere(name, { diameter: .7, segments: 10 }, scene);
  if (visual.shape === 'obelisk' || visual.shape === 'atlas-prism' || visual.shape === 'crystal-display') return MeshBuilder.CreateCylinder(name, { height: 1.2 * visual.verticalScale, diameterTop: .08, diameterBottom: .52, tessellation: visual.shape === 'crystal-display' ? 5 : 6 }, scene);
  if (visual.shape === 'echo-portal') return MeshBuilder.CreateTorus(name, { diameter: 1.12, thickness: .075, tessellation: 22 }, scene);
  if (visual.shape === 'performance-stage') return MeshBuilder.CreateCylinder(name, { height: .14, diameter: 1.15, tessellation: 18 }, scene);
  if (visual.shape === 'overlook-bridge') return MeshBuilder.CreateBox(name, { width: 1.35, height: .16, depth: .42 }, scene);
  return MeshBuilder.CreateBox(name, { width: .72, height: .82 * visual.verticalScale, depth: .55 }, scene);
}
function createW698StreetMesh({ scene, name, visual }) {
  if (visual.shape === 'kinetic-art') return MeshBuilder.CreateTorus(name, { diameter: .52, thickness: .04, tessellation: 16 }, scene);
  if (visual.shape === 'maintenance-cone') return MeshBuilder.CreateCylinder(name, { height: .45, diameterTop: .08, diameterBottom: .34, tessellation: 8 }, scene);
  if (visual.shape === 'kiosk-light') return MeshBuilder.CreateBox(name, { width: .28, height: .55, depth: .22 }, scene);
  if (visual.shape === 'rail-segment' || visual.shape === 'crossing-bars') return MeshBuilder.CreateBox(name, { width: .68, height: .06, depth: visual.shape === 'rail-segment' ? 1.2 : .46 }, scene);
  if (visual.shape === 'plaza-cluster') return MeshBuilder.CreateSphere(name, { diameter: .48, segments: 8 }, scene);
  return MeshBuilder.CreateBox(name, { width: .46, height: .08, depth: .46 }, scene);
}


export function resolveEonCityLivingNexusCellGuideTarget(cellId = '', cells = []) {
  const cell = (Array.isArray(cells) ? cells : []).find((entry) => entry?.id === String(cellId || ''));
  if (!cell) return null;
  const center = cellCenter(cell);
  return freeze({ cellId: cell.id, x: center.x, y: 0, z: center.z, localOnly: true, automaticNavigation: false, opensRoute: false });
}

function createCellRenderer({ scene, cell, encounter = null, parent, materials, qualityProfile }) {
  const activityNodes = [];
  const routeNodes = [];
  const collisionVolumes = [];
  const opportunityNodes = [];
  const center = cellCenter(cell);
  const interactive = cell?.residencyTier !== 'horizon' && cell?.interactive !== false;
  const accentHex = IDENTITY_COLOURS[cell.visualIdentity?.id] || cell.visualIdentity?.accent || '#55eaff';
  const roadWidth = Math.max(0.68, Math.min(1.7, Number(cell.roadGrammar?.roadWidth || 1.18)));
  const visualLanguage = resolveEonCityW670CellVisualLanguage(cell);
  const groundY = Number(visualLanguage.terrain.tileY || 0);
  const root = new TransformNode(`w667-expanse-${cell.id}`, scene);
  root.parent = parent;
  root.position.y = groundY;
  root.metadata = freeze({
    kind: 'living-nexus-expanse-cell',
    cellId: cell.id,
    role: cell.role,
    residencyTier: interactive ? 'interactive' : 'horizon',
    interactive,
    deterministic: true,
    practicallyInfinite: true,
    regionId: cell.region?.id || '',
    regionArchetypeId: cell.region?.archetype?.id || '',
    streetProfileId: cell.streetProfile?.id || cell.roadGrammar?.pattern || '',
    variationSignature: cell.variationSignature || '',
    terrainProfileId: cell.terrainProfile?.id || '',
    publicSpaceProfileId: cell.publicSpaceProfile?.id || '',
    skylineProfileId: cell.skylineProfile?.id || '',
    microClimateId: cell.microClimate?.id || '',
    streetTopology: visualLanguage.street.topology,
    discoveryCode: cell.discovery?.code || '',
    localOnly: true,
    containsUserData: false,
    remoteNetwork: false
  });

  const tile = MeshBuilder.CreateBox(`w667-expanse-tile-${cell.id}`, { width: CELL_SIZE - 0.08, depth: CELL_SIZE - 0.08, height: 0.08 }, scene);
  tile.parent = root;
  tile.position.set(center.x, -0.065, center.z);
  tile.material = visualLanguage.terrain.materialRole === 'activity' ? materials.activity : materials.cell;
  tile.isPickable = false;

  {
    const terrainFeature = visualLanguage.terrain.waterVisible
      ? MeshBuilder.CreateCylinder(`w670-expanse-terrain-feature-${cell.id}`, { height: 0.035, diameter: 5.8, tessellation: 32 }, scene)
      : visualLanguage.terrain.kind === 'relief'
        ? MeshBuilder.CreatePolyhedron(`w670-expanse-terrain-feature-${cell.id}`, { type: 1, size: 2.35 }, scene)
        : MeshBuilder.CreateTorus(`w670-expanse-terrain-feature-${cell.id}`, { diameter: 4.6, thickness: 0.12, tessellation: 24 }, scene);
    terrainFeature.parent = root;
    terrainFeature.position.set(center.x, visualLanguage.terrain.waterVisible ? -0.015 : 0.04 + Math.min(0.44, visualLanguage.terrain.reliefHeight * 0.18), center.z);
    terrainFeature.rotation.x = visualLanguage.terrain.kind === 'living' ? Math.PI / 2 : 0;
    terrainFeature.material = visualLanguage.terrain.materialRole === 'activity' ? materials.activity : (materials.identity.get(cell.visualIdentity?.id) || materials.cell);
    terrainFeature.isVisible = visualLanguage.terrain.reliefHeight > 0.12 || visualLanguage.terrain.waterVisible || visualLanguage.terrain.vegetationVisible;
    terrainFeature.isPickable = false;
    terrainFeature.metadata = freeze({ kind: 'w670-expanse-terrain-feature', cellId: cell.id, terrainProfileId: cell.terrainProfile?.id || '', localOnly: true });
  }

  const roadX = MeshBuilder.CreateBox(`w667-street-x-${cell.id}`, { width: CELL_SIZE + 0.06, depth: interactive ? roadWidth : Math.min(1.08, roadWidth), height: 0.055 }, scene);
  roadX.parent = root;
  roadX.position.set(center.x, 0.012, center.z);
  roadX.material = materials.road;
  roadX.isPickable = false;
  roadX.metadata = freeze({ kind: 'living-nexus-expanse-street', cellId: cell.id, axis: 'east-west', pattern: cell.roadGrammar?.pattern, residencyTier: interactive ? 'interactive' : 'horizon', localOnly: true, automaticNavigation: false });

  const roadZ = MeshBuilder.CreateBox(`w667-street-z-${cell.id}`, { width: interactive ? roadWidth : Math.min(1.08, roadWidth), depth: CELL_SIZE + 0.06, height: 0.055 }, scene);
  roadZ.parent = root;
  roadZ.position.set(center.x, 0.014, center.z);
  roadZ.material = materials.road;
  roadZ.isPickable = false;
  roadZ.metadata = freeze({ kind: 'living-nexus-expanse-street', cellId: cell.id, axis: 'north-south', pattern: cell.roadGrammar?.pattern, residencyTier: interactive ? 'interactive' : 'horizon', localOnly: true, automaticNavigation: false });

  const laneX = MeshBuilder.CreateBox(`w667-expanse-lane-x-${cell.id}`, { width: CELL_SIZE - 0.24, depth: 0.045, height: 0.014 }, scene);
  laneX.parent = root;
  laneX.position.set(center.x, 0.048, center.z);
  laneX.material = materials.lane;
  laneX.isPickable = false;
  const laneZ = MeshBuilder.CreateBox(`w667-expanse-lane-z-${cell.id}`, { width: 0.045, depth: CELL_SIZE - 0.24, height: 0.014 }, scene);
  laneZ.parent = root;
  laneZ.position.set(center.x, 0.049, center.z);
  laneZ.material = materials.lane;
  laneZ.isPickable = false;

  if (visualLanguage.street.secondaryVisible) {
    let secondaryStreet;
    if (visualLanguage.street.kind === 'radial' || visualLanguage.street.kind === 'loop' || visualLanguage.street.kind === 'crescent') {
      secondaryStreet = MeshBuilder.CreateTorus(`w670-expanse-secondary-street-${cell.id}`, { diameter: visualLanguage.street.kind === 'radial' ? 4.8 : 5.6, thickness: Math.max(0.08, roadWidth * 0.12), tessellation: 28 }, scene);
      secondaryStreet.position.set(center.x, visualLanguage.street.elevated ? 0.26 : 0.055, center.z);
      secondaryStreet.rotation.x = Math.PI / 2;
    } else {
      secondaryStreet = MeshBuilder.CreateBox(`w670-expanse-secondary-street-${cell.id}`, { width: CELL_SIZE * 1.08, depth: Math.max(0.18, roadWidth * 0.32), height: 0.045 }, scene);
      secondaryStreet.position.set(center.x, visualLanguage.street.elevated ? 0.28 : 0.05, center.z);
      secondaryStreet.rotation.y = visualLanguage.street.kind === 'diagonal' ? Math.PI / 4 : 0;
      if (visualLanguage.street.kind === 'parallel') secondaryStreet.position.z += 1.35;
    }
    secondaryStreet.parent = root;
    secondaryStreet.material = materials.road;
    secondaryStreet.isVisible = visualLanguage.street.secondaryVisible;
    secondaryStreet.isPickable = false;
    secondaryStreet.metadata = freeze({ kind: 'w670-expanse-secondary-street', cellId: cell.id, topology: visualLanguage.street.topology, localOnly: true });
  }

  if (visualLanguage.publicSpace.visible) {
    const publicSpace = visualLanguage.publicSpace.kind === 'signal-field'
      ? MeshBuilder.CreateTorus(`living-nexus-expanse-plaza-w670-expanse-public-space-${cell.id}`, { diameter: visualLanguage.publicSpace.diameter, thickness: 0.11, tessellation: visualLanguage.publicSpace.tessellation }, scene)
      : MeshBuilder.CreateCylinder(`living-nexus-expanse-plaza-w670-expanse-public-space-${cell.id}`, { height: visualLanguage.publicSpace.height, diameter: visualLanguage.publicSpace.diameter, tessellation: visualLanguage.publicSpace.tessellation }, scene);
    publicSpace.parent = root;
    publicSpace.position.set(center.x, visualLanguage.publicSpace.kind === 'elevated-deck' ? 0.24 : 0.04, center.z);
    if (visualLanguage.publicSpace.kind === 'signal-field') publicSpace.rotation.x = Math.PI / 2;
    publicSpace.material = visualLanguage.publicSpace.materialRole === 'activity'
      ? materials.activity
      : visualLanguage.publicSpace.materialRole === 'route'
        ? materials.route
        : materials.road;
    publicSpace.isVisible = visualLanguage.publicSpace.visible;
    publicSpace.isPickable = false;
    publicSpace.metadata = freeze({ kind: 'living-nexus-expanse-plaza', visualKind: 'w670-expanse-public-space', cellId: cell.id, publicSpaceProfileId: cell.publicSpaceProfile?.id || '', localOnly: true });
  }

  const buildingMaterial = materials.identity.get(cell.visualIdentity?.id) || materials.identity.get('cyan-command');
  const lots = Array.isArray(cell.lotPlan) && cell.lotPlan.length
    ? cell.lotPlan
    : [
        freeze({ id: 'nw', x: -3.05, z: -3.05, form: cell.buildingComposition?.[0] || 'signal tower', heightClass: 'mid', rotationQuarter: 0 }),
        freeze({ id: 'se', x: 3.05, z: 3.05, form: cell.buildingComposition?.[1] || 'project habitat', heightClass: 'mid', rotationQuarter: 0 }),
        freeze({ id: 'sw', x: -3.05, z: 3.05, form: cell.buildingComposition?.[2] || 'creator studio', heightClass: 'low', rotationQuarter: 0 })
      ];
  const buildingCount = interactive ? Math.min(qualityProfile.buildingCount, lots.length) : 1;
  for (let index = 0; index < buildingCount; index += 1) {
    const lot = lots[index % lots.length];
    const form = String(lot.form || cell.buildingComposition?.[index] || 'signal tower');
    const seeded = hash32(`${cell.id}:${index}:${form}`);
    const horizonBoost = interactive ? 0 : 1.8 + (seeded % 11) / 10;
    const heightBase = lot.heightClass === 'tall' ? 3.1 : lot.heightClass === 'low' ? 1.35 : 2.1;
    const skylineBias = Number(cell.skylineProfile?.heightBias || 0);
    const height = Math.max(0.9, heightBase + (seeded % 13) / 10 + horizonBoost + skylineBias);
    const width = 1.15 + ((seeded >>> 5) % 8) / 10;
    const depth = 1.05 + ((seeded >>> 9) % 8) / 10;
    const worldX = center.x + Number(lot.x || 0);
    const worldZ = center.z + Number(lot.z || 0);
    const buildingVisual = resolveEonCityW670BuildingVisual(form);
    let building;
    if (buildingVisual.shape === 'tower') {
      building = MeshBuilder.CreateCylinder(`w667-expanse-building-${cell.id}-${index}`, { height, diameterTop: Math.max(0.36, width * 0.45), diameterBottom: Math.max(width, depth), tessellation: interactive ? 12 : 6 }, scene);
    } else if (buildingVisual.shape === 'faceted') {
      building = MeshBuilder.CreatePolyhedron(`w667-expanse-building-${cell.id}-${index}`, { type: 2, size: Math.max(width, depth) * 0.72 }, scene);
      building.scaling.y = Math.max(1, height / Math.max(width, depth));
    } else if (buildingVisual.shape === 'arch') {
      building = MeshBuilder.CreateTorus(`w667-expanse-building-${cell.id}-${index}`, { diameter: Math.max(1.35, width * 1.45), thickness: Math.max(0.14, width * 0.15), tessellation: interactive ? 24 : 12 }, scene);
      building.rotation.x = Math.PI / 2;
      building.scaling.y = Math.max(0.9, height / Math.max(1.2, width * 1.45));
    } else if (buildingVisual.shape === 'crystal') {
      building = MeshBuilder.CreatePolyhedron(`w667-expanse-building-${cell.id}-${index}`, { type: 1, size: Math.max(width, depth) * 0.74 }, scene);
      building.scaling.y = Math.max(1.4, height / Math.max(width, depth));
    } else if (buildingVisual.shape === 'terrace') {
      building = MeshBuilder.CreateBox(`w667-expanse-building-${cell.id}-${index}`, { width: width * 1.25, depth: depth * 1.12, height: Math.max(0.9, height * 0.72) }, scene);
      building.scaling.y = 0.92;
    } else if (buildingVisual.shape === 'lattice') {
      building = MeshBuilder.CreateCylinder(`w667-expanse-building-${cell.id}-${index}`, { height, diameterTop: Math.max(0.48, width * 0.8), diameterBottom: Math.max(width, depth), tessellation: 4 }, scene);
      building.rotation.y = Math.PI / 4;
    } else {
      building = MeshBuilder.CreateBox(`w667-expanse-building-${cell.id}-${index}`, { width, depth, height }, scene);
    }
    building.parent = root;
    building.position.set(worldX, height / 2, worldZ);
    building.rotation.y = Number(lot.rotationQuarter || 0) * Math.PI / 2;
    building.material = buildingMaterial;
    building.isPickable = false;
    building.metadata = freeze({ kind: interactive ? 'living-nexus-expanse-building' : 'living-nexus-expanse-horizon-silhouette', cellId: cell.id, lotId: lot.id, form, visualShape: buildingVisual.shape, roofProfile: lot.roofProfile || buildingVisual.roof, facadeRhythm: lot.facadeRhythm || '', footprint: lot.footprint || '', regionArchetypeId: cell.region?.archetype?.id || '', terrainProfileId: cell.terrainProfile?.id || '', skylineProfileId: cell.skylineProfile?.id || '', residencyTier: interactive ? 'interactive' : 'horizon', sourceControlledProcedural: true, localOnly: true });
    if (interactive) collisionVolumes.push(freeze({ id: `w667-${cell.id}-building-${index}`, type: 'circle', x: worldX, z: worldZ, radius: Math.max(width, depth) * 0.58, localOnly: true }));
  }

  if (interactive) {
    const beacon = MeshBuilder.CreateCylinder(`w667-expanse-beacon-${cell.id}`, { height: cell.role === 'current' ? 1.35 : 0.86, diameter: cell.role === 'current' ? 0.22 : 0.15, tessellation: 10 }, scene);
    beacon.parent = root;
    beacon.position.set(center.x, cell.role === 'current' ? 0.73 : 0.48, center.z);
    beacon.material = buildingMaterial;
    beacon.isPickable = false;
    const ring = MeshBuilder.CreateTorus(`w667-expanse-ring-${cell.id}`, { diameter: cell.role === 'current' ? 1.2 : 0.72, thickness: 0.045, tessellation: 18 }, scene);
    ring.parent = root;
    ring.position.set(center.x, cell.role === 'current' ? 1.28 : 0.82, center.z);
    ring.rotation.x = Math.PI / 2;
    ring.material = buildingMaterial;
    ring.isPickable = false;
    activityNodes.push(freeze({ node: ring, cellId: cell.id, phase: (hash32(cell.id) % 360) * Math.PI / 180, kind: 'ring', baseY: ring.position.y }));

    if (cell.landmark) {
      const landmarkHeight = cell.landmark.rarity === 'legendary' ? 4.4 : cell.landmark.rarity === 'epic' ? 3.6 : cell.landmark.rarity === 'rare' ? 3 : 2.3;
      const landmark = /rift|portal/i.test(cell.landmark.typeId)
        ? MeshBuilder.CreateTorus(`w667-expanse-landmark-${cell.id}`, { diameter: 2.4, thickness: 0.16, tessellation: 28 }, scene)
        : MeshBuilder.CreateCylinder(`w667-expanse-landmark-${cell.id}`, { height: landmarkHeight, diameterTop: 0.28, diameterBottom: 0.88, tessellation: 12 }, scene);
      landmark.parent = root;
      landmark.position.set(center.x + 2.2, /rift|portal/i.test(cell.landmark.typeId) ? 1.45 : landmarkHeight / 2, center.z - 1.9);
      if (/rift|portal/i.test(cell.landmark.typeId)) landmark.rotation.y = Math.PI / 2;
      landmark.material = buildingMaterial;
      landmark.isPickable = true;
      landmark.metadata = freeze({
        kind: 'living-nexus-expanse-landmark',
        interactive: true,
        assetId: cell.landmark.id,
        interactionId: cell.landmark.id,
        interactionKind: 'expanse-landmark',
        interactionRadius: cell.landmark.interactionRadius,
        label: cell.landmark.label,
        purpose: cell.landmark.purpose,
        rarity: cell.landmark.rarity,
        panel: cell.landmark.panel || '',
        route: cell.landmark.route || '',
        cellId: cell.id,
        discoveryCode: cell.discovery?.code || '',
        reviewFirst: true,
        autoExecute: false,
        autoNavigate: false,
        privateDataRead: false,
        localOnly: true
      });
      activityNodes.push(freeze({ node: landmark, cellId: cell.id, phase: (hash32(`${cell.id}:landmark`) % 360) * Math.PI / 180, kind: 'landmark', baseY: landmark.position.y }));
      collisionVolumes.push(freeze({ id: `w667-${cell.id}-landmark`, type: 'circle', x: landmark.position.x, z: landmark.position.z, radius: 0.72, localOnly: true }));
    }

    if (encounter) {
      const npc = MeshBuilder.CreateCapsule(`w667-expanse-npc-${cell.id}`, { height: 1.05, radius: 0.22, tessellation: 8, subdivisions: 1 }, scene);
      npc.parent = root;
      npc.position.set(encounter.position.x, 0.53, encounter.position.z);
      npc.material = encounter.state === 'transformed' ? materials.npcResolved : materials.npc;
      npc.isPickable = true;
      npc.metadata = freeze({ kind: 'living-nexus-functional-npc-signal', interactive: true, assetId: encounter.id, interactionKind: 'expanse-encounter', interactionId: encounter.id, encounterId: encounter.id, cellId: cell.id, specialistId: encounter.specialistId, specialistName: encounter.specialistName, missionId: encounter.missionId, landmarkLabel: encounter.landmarkLabel, encounterState: encounter.state, activity: cell.activityLayer, gameplayPurpose: cell.gameplayPurpose, reviewFirst: true, requiresSeparateRouteConfirmation: true, executesWork: false, autonomousAgent: false, privateDataRead: false, localOnly: true });
      const opportunityRing = MeshBuilder.CreateTorus(`w667-expanse-opportunity-ring-${cell.id}`, { diameter: 0.72, thickness: 0.055, tessellation: 18 }, scene);
      opportunityRing.parent = root;
      opportunityRing.position.set(encounter.position.x, 1.22, encounter.position.z);
      opportunityRing.rotation.x = Math.PI / 2;
      opportunityRing.material = encounter.state === 'transformed' ? materials.npcResolved : materials.activity;
      opportunityRing.isPickable = true;
      opportunityRing.metadata = freeze({ kind: 'living-nexus-functional-encounter-beacon', interactive: true, assetId: encounter.id, interactionKind: 'expanse-encounter', interactionId: encounter.id, encounterId: encounter.id, cellId: cell.id, missionId: encounter.missionId, encounterState: encounter.state, reviewFirst: true, automaticExecution: false, localOnly: true });
      opportunityNodes.push(freeze({ encounter, npc, ring: opportunityRing }));
      activityNodes.push(freeze({ node: npc, cellId: cell.id, phase: (hash32(`${cell.id}:npc`) % 360) * Math.PI / 180, kind: 'npc', baseY: npc.position.y }));
      activityNodes.push(freeze({ node: opportunityRing, cellId: cell.id, phase: (hash32(`${cell.id}:opportunity`) % 360) * Math.PI / 180, kind: 'ring', baseY: opportunityRing.position.y }));
    }

    if (qualityProfile.activity) {
      const activity = MeshBuilder.CreateSphere(`w667-expanse-activity-${cell.id}`, { diameter: 0.2, segments: 8 }, scene);
      activity.parent = root;
      activity.position.set(center.x - 1.8, 1.15, center.z + 1.7);
      activity.material = materials.activity;
      activity.isPickable = false;
      activity.metadata = freeze({ kind: 'living-nexus-activity-signal', cellId: cell.id, label: cell.activityLayer, localOnly: true, autonomousAgent: false });
      activityNodes.push(freeze({ node: activity, cellId: cell.id, phase: (hash32(`${cell.id}:activity`) % 360) * Math.PI / 180, kind: 'activity', baseY: activity.position.y }));
    }

    const furnitureCount = Math.max(0, Number(qualityProfile.streetFurnitureCount || 0));
    for (let index = 0; index < furnitureCount; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const post = MeshBuilder.CreateCylinder(`w667-expanse-furniture-${cell.id}-${index}`, { height: 0.72 + (index % 2) * 0.24, diameter: 0.08, tessellation: 8 }, scene);
      post.parent = root;
      post.position.set(center.x + side * (1.45 + index * 0.28), 0.4, center.z + (index < 2 ? 2.2 : -2.2));
      post.material = materials.route;
      post.isPickable = false;
      post.metadata = freeze({ kind: 'living-nexus-expanse-street-furniture', cellId: cell.id, furniture: cell.roadGrammar?.furniture || 'signal-posts', localOnly: true });
    }

    if (qualityProfile.routeMarkers) {
      for (const [index, waypoint] of (cell.safeNavigationRoute?.waypoints || []).entries()) {
        const marker = MeshBuilder.CreateSphere(`w667-expanse-route-${cell.id}-${index}`, { diameter: 0.085, segments: 6 }, scene);
        marker.parent = root;
        marker.position.set(waypoint.x, 0.09, waypoint.z);
        marker.material = materials.route;
        marker.isPickable = false;
        marker.metadata = freeze({ kind: 'living-nexus-safe-route-marker', cellId: cell.id, index, localOnly: true, automaticNavigation: false });
        routeNodes.push(marker);
      }
    }
  }

  root.metadata = freeze({ ...root.metadata, accent: accentHex, meshCount: root.getChildMeshes?.().length || 0, landmarkId: cell.landmark?.id || '' });
  return freeze({
    cellId: cell.id,
    role: cell.role,
    residencyTier: interactive ? 'interactive' : 'horizon',
    regionId: cell.region?.id || '',
    variationSignature: cell.variationSignature || '',
    landmark: cell.landmark || null,
    root,
    activityNodes: freeze(activityNodes),
    routeNodes: freeze(routeNodes),
    collisionVolumes: freeze(collisionVolumes),
    opportunityNodes: freeze(opportunityNodes),
    dispose() { disposeNode(root); }
  });
}
function createRealmBase({ scene, parent, materials, activityNodes }) {
  const entry = EON_CITY_LIVING_NEXUS_ENTRY_POSES['my-realm'];
  const platform = MeshBuilder.CreateCylinder('w660r-my-realm-platform', { height: 0.22, diameter: 16, tessellation: 32 }, scene);
  platform.parent = parent;
  platform.position.set(entry.x, -0.11, entry.z);
  platform.material = materials.realmFloor;
  platform.isPickable = false;
  const inner = MeshBuilder.CreateTorus('w660r-my-realm-nexus-ring', { diameter: 4.8, thickness: 0.09, tessellation: 32 }, scene);
  inner.parent = parent;
  inner.position.set(entry.x, 0.1, entry.z);
  inner.rotation.x = Math.PI / 2;
  inner.material = materials.realmAccent;
  inner.isPickable = false;
  activityNodes.push(freeze({ node: inner, cellId: 'my-realm', phase: 0, kind: 'realm-ring', baseY: inner.position.y }));
  const portal = MeshBuilder.CreateTorus('w660r-my-realm-return-portal', { diameter: 3.2, thickness: 0.16, tessellation: 28 }, scene);
  portal.parent = parent;
  portal.position.set(entry.x - 5.1, 1.72, entry.z);
  portal.rotation.y = Math.PI / 2;
  portal.material = materials.realmAccent;
  portal.isPickable = false;
  portal.metadata = freeze({ kind: 'living-nexus-return-portal', destination: 'core', reviewFirst: true, automaticNavigation: false, localOnly: true });
  activityNodes.push(freeze({ node: portal, cellId: 'my-realm', phase: 1.8, kind: 'portal', baseY: portal.position.y }));
}

function renderRealmTransformations({ scene, parent, materials, entries, qualityProfile, activityNodes }) {
  const rows = boundedTransformations(entries, qualityProfile.realmCapacity);
  const plan = buildEonCityW691MyRealmPlan({ transformations: rows, quality: qualityProfile.realmCapacity <= 5 ? 'lite' : qualityProfile.realmCapacity >= 12 ? 'cinematic' : 'balanced' });

  for (const zone of plan.zones) {
    const zoneMaterial = zone.dormant ? materials.dormant : materials.realmAccent;
    const platform = MeshBuilder.CreateCylinder(`w691-my-realm-zone-${zone.id}`, { height: 0.12, diameter: zone.dormant ? 2.2 : 2.75, tessellation: 24 }, scene);
    platform.parent = parent;
    platform.position.set(zone.position.x, 0.01, zone.position.z);
    platform.material = zoneMaterial;
    platform.isPickable = true;
    platform.metadata = freeze({
      kind: 'w691-my-realm-productivity-zone',
      zoneId: zone.id,
      realmId: zone.realmId,
      productIdentityId: zone.productIdentityId,
      label: zone.label,
      realmLabel: zone.realmLabel,
      nativeRoute: zone.nativeRoute,
      productivityRole: zone.productivityRole,
      verifiedTransformationCount: zone.verifiedTransformationCount,
      reviewFirst: true,
      automaticNavigation: false,
      automaticExecution: false,
      privateContentStored: false,
      localOnly: true
    });
    const marker = MeshBuilder.CreateTorus(`w691-my-realm-zone-marker-${zone.id}`, { diameter: zone.dormant ? 1.2 : 1.65, thickness: 0.055, tessellation: 24 }, scene);
    marker.parent = parent;
    marker.position.set(zone.position.x, 0.18, zone.position.z);
    marker.rotation.x = Math.PI / 2;
    marker.material = zoneMaterial;
    marker.isPickable = false;
    activityNodes.push(freeze({ node: marker, cellId: zone.id, phase: zone.heading, kind: zone.dormant ? 'realm-zone-dormant' : 'realm-zone-active', baseY: marker.position.y }));
  }

  for (const placement of plan.placements) {
    const transformation = rows.find((entry) => entry.id === placement.transformationId);
    if (!transformation) continue;
    const height = 1.25 + (hash32(transformation.id) % 12) / 10;
    const material = materials.transformation.get(transformation.destination) || materials.realmAccent;
    const pylon = MeshBuilder.CreateCylinder(`w691-my-realm-transformation-${transformation.id}`, { height, diameterTop: 0.24, diameterBottom: 0.54, tessellation: 10 }, scene);
    pylon.parent = parent;
    pylon.position.set(placement.position.x, height / 2, placement.position.z);
    pylon.material = material;
    pylon.isPickable = true;
    pylon.metadata = freeze({
      kind: 'living-nexus-verified-transformation',
      transformationId: transformation.id,
      realmId: placement.realmId,
      zoneId: placement.zoneId,
      destination: transformation.destination,
      location: transformation.location,
      label: transformation.label,
      verifiedBoundedReceipt: true,
      reviewFirst: true,
      privateContentStored: false,
      rewardIssued: false,
      paymentClaimed: false,
      localOnly: true
    });
    const orb = MeshBuilder.CreateSphere(`w691-my-realm-orb-${transformation.id}`, { diameter: 0.32, segments: 8 }, scene);
    orb.parent = parent;
    orb.position.set(placement.position.x, height + 0.22, placement.position.z);
    orb.material = material;
    orb.isPickable = false;
    activityNodes.push(freeze({ node: orb, cellId: transformation.id, phase: hash32(transformation.id) % 360, kind: 'transformation', baseY: orb.position.y }));
  }
  if (!rows.length) {
    const entry = EON_CITY_LIVING_NEXUS_ENTRY_POSES['my-realm'];
    const dormant = MeshBuilder.CreatePolyhedron('w691-my-realm-dormant-seed', { type: 1, size: 0.48 }, scene);
    dormant.parent = parent;
    dormant.position.set(entry.x, 0.48, entry.z);
    dormant.material = materials.dormant;
    dormant.isPickable = false;
    dormant.metadata = freeze({ kind: 'living-nexus-dormant-transformation-seed', verifiedTransformationCount: 0, localOnly: true, fakeCompletion: false });
  }
  return rows;
}

function renderLivingWorldSystems({ scene, parent, materials, plan }) {
  const root = new TransformNode(`w660u-living-world-${plan.currentCellId || 'none'}-${plan.phase?.index || 0}`, scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'living-nexus-world-systems', schema: plan.schema, currentCellId: plan.currentCellId, weatherId: plan.weather?.id, phaseId: plan.phase?.id, localOnly: true, userData: false, networkRequest: false });
  const transitNodes = [];
  const maintenanceNodes = [];
  const weatherNodes = [];
  const featureNodes = [];

  for (const transit of plan.transit || []) {
    const capsule = new TransformNode(`w660u-${transit.id}`, scene);
    capsule.parent = root;
    capsule.position.set(transit.start.x, transit.start.y, transit.start.z);
    capsule.rotation.y = transit.axis === 'east-west' ? Math.PI / 2 : 0;
    capsule.metadata = freeze({ kind: 'living-nexus-transit-capsule', transitId: transit.id, label: transit.label, visibleEncounterOnly: true, boardable: false, automaticTravel: false, localOnly: true });
    const body = MeshBuilder.CreateBox(`w660u-${transit.id}-body`, { width: 0.5, height: 0.32, depth: 1.25 }, scene);
    body.parent = capsule;
    body.material = materials.transit;
    body.isPickable = false;
    const nose = MeshBuilder.CreateSphere(`w660u-${transit.id}-nose`, { diameter: 0.42, segments: 10 }, scene);
    nose.parent = capsule;
    nose.position.z = 0.58;
    nose.scaling.y = 0.72;
    nose.material = materials.transitAccent;
    nose.isPickable = false;
    const tail = nose.clone?.(`w660u-${transit.id}-tail`) || null;
    if (tail) { tail.parent = capsule; tail.position.z = -0.58; tail.isPickable = false; }
    transitNodes.push(freeze({ node: capsule, ...transit }));
  }

  for (const maintenance of plan.maintenance || []) {
    const drone = MeshBuilder.CreatePolyhedron(`w660u-${maintenance.id}`, { type: 1, size: 0.26 }, scene);
    drone.parent = root;
    drone.position.set(maintenance.position.x, maintenance.position.y, maintenance.position.z);
    drone.material = materials.maintenance;
    drone.isPickable = false;
    drone.metadata = freeze({ kind: 'living-nexus-maintenance-cue', maintenanceId: maintenance.id, cellId: maintenance.cellId, visualCueOnly: true, claimsWorkComplete: false, readsUserState: false, localOnly: true });
    maintenanceNodes.push(freeze({ node: drone, base: freeze({ ...maintenance.position }), phase: maintenance.schedulePhase * Math.PI / 2 }));
  }

  if (plan.weather?.id === 'rain-veil') {
    const count = Math.max(0, Number(plan.weather.rainStrandCount || 0));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / Math.max(1, count)) * Math.PI * 2;
      const radius = 2.2 + (index % 4) * 1.15;
      const strand = MeshBuilder.CreateBox(`w660u-rain-${index}`, { width: 0.018, height: 1.55 + (index % 3) * 0.35, depth: 0.018 }, scene);
      strand.parent = root;
      strand.position.set(plan.anchor.x + Math.cos(angle) * radius, 2.2 + (index % 4) * 0.34, plan.anchor.z + Math.sin(angle) * radius);
      strand.rotation.z = -0.12;
      strand.material = materials.weatherRain;
      strand.isPickable = false;
      strand.metadata = freeze({ kind: 'living-nexus-local-rain', localVisualOnly: true, realWeather: false, index });
      weatherNodes.push(freeze({ node: strand, baseY: strand.position.y, phase: angle, kind: 'rain' }));
    }
  } else if (plan.weather?.id === 'neon-mist') {
    const mist = MeshBuilder.CreateCylinder('w660u-neon-mist', { height: 1.1, diameter: 12, tessellation: 32 }, scene);
    mist.parent = root;
    mist.position.set(plan.anchor.x, 0.55, plan.anchor.z);
    mist.material = materials.weatherMist;
    mist.isPickable = false;
    mist.metadata = freeze({ kind: 'living-nexus-local-mist', localVisualOnly: true, realWeather: false });
    weatherNodes.push(freeze({ node: mist, baseY: mist.position.y, phase: 0, kind: 'mist' }));
  }

  if (plan.shelter) {
    const shelter = new TransformNode(plan.shelter.id, scene);
    shelter.parent = root;
    shelter.position.set(plan.shelter.position.x, plan.shelter.position.y, plan.shelter.position.z);
    shelter.metadata = freeze({ kind: 'living-nexus-weather-shelter', cellId: plan.shelter.cellId, visibleWayfindingOnly: true, automaticMovement: false, localOnly: true });
    const canopy = MeshBuilder.CreateCylinder(`${plan.shelter.id}-canopy`, { height: 0.12, diameter: 1.7, tessellation: 12 }, scene);
    canopy.parent = shelter;
    canopy.position.y = 0.7;
    canopy.material = materials.shelter;
    canopy.isPickable = false;
    const post = MeshBuilder.CreateCylinder(`${plan.shelter.id}-post`, { height: 1.35, diameter: 0.08, tessellation: 8 }, scene);
    post.parent = shelter;
    post.material = materials.shelter;
    post.isPickable = false;
    featureNodes.push(freeze({ node: shelter, kind: 'shelter', cellId: plan.shelter.cellId }));
  }

  if (plan.worldEvent) {
    const event = MeshBuilder.CreateTorus(`w660u-world-event-${plan.worldEvent.id}`, { diameter: 1.4, thickness: 0.055, tessellation: 24 }, scene);
    event.parent = root;
    event.position.set(plan.worldEvent.position.x, plan.worldEvent.position.y, plan.worldEvent.position.z);
    event.rotation.x = Math.PI / 2;
    event.material = materials.worldEvent;
    event.isPickable = false;
    event.metadata = freeze({ kind: 'living-nexus-authored-world-event', eventId: plan.worldEvent.id, label: plan.worldEvent.label, authored: true, localVisualOnly: true, automaticAction: false });
    featureNodes.push(freeze({ node: event, kind: 'world-event', cellId: plan.worldEvent.cellId, phase: 0.8 }));
  }

  if (plan.rarePortal) {
    const portal = new TransformNode(`w660u-${plan.rarePortal.id}`, scene);
    portal.parent = root;
    portal.position.set(plan.rarePortal.position.x, plan.rarePortal.position.y, plan.rarePortal.position.z);
    portal.metadata = freeze({ kind: 'living-nexus-rare-portal', portalId: plan.rarePortal.id, realmId: plan.rarePortal.realmId, label: plan.rarePortal.label, cellId: plan.rarePortal.cellId, inspectOnly: true, authoredRealm: true, automaticNavigation: false, routePrepared: false, privateContentStored: false, localOnly: true });
    const outer = MeshBuilder.CreateTorus(`${plan.rarePortal.id}-outer`, { diameter: 2.2, thickness: 0.11, tessellation: 32 }, scene);
    outer.parent = portal;
    outer.rotation.y = Math.PI / 2;
    outer.material = materials.portal;
    outer.isPickable = false;
    const inner = MeshBuilder.CreateTorus(`${plan.rarePortal.id}-inner`, { diameter: 1.55, thickness: 0.045, tessellation: 28 }, scene);
    inner.parent = portal;
    inner.rotation.x = Math.PI / 2;
    inner.material = materials.portalAccent;
    inner.isPickable = false;
    featureNodes.push(freeze({ node: portal, kind: 'rare-portal', cellId: plan.rarePortal.cellId, phase: 1.7 }));
  }

  return freeze({ root, transitNodes: freeze(transitNodes), maintenanceNodes: freeze(maintenanceNodes), weatherNodes: freeze(weatherNodes), featureNodes: freeze(featureNodes) });
}

export function createEonCityLivingNexusBabylonRuntime({
  scene,
  playerAnchor = null,
  quality = 'balanced',
  reducedMotion = false,
  initialMode = 'explore',
  seed = 'eoncity-living-nexus',
  transformations = [],
  onStatus = null
} = {}) {
  if (!scene) throw new Error('living-nexus-scene-required');
  const experienceProfile = resolveEonCityW692ExperienceProfile({ mode: initialMode, quality, reducedMotion });
  const resolvedQuality = normalizeQuality(experienceProfile.quality);
  const qualityProfile = QUALITY[resolvedQuality];
  const materials = {
    cell: makeMaterial(scene, 'w660r-expanse-cell-material', { diffuse: '#071224', emissive: '#1c5a78', intensity: 0.13 }),
    road: makeMaterial(scene, 'w660r-expanse-road-material', { diffuse: '#050a14', emissive: '#23516a', intensity: 0.14 }),
    lane: makeMaterial(scene, 'w660r-expanse-lane-material', { diffuse: '#85f4ff', emissive: '#85f4ff', intensity: 0.78 }),
    npc: makeMaterial(scene, 'w660r-expanse-npc-material', { diffuse: '#121d32', emissive: '#73e9ff', intensity: 0.58 }),
    npcResolved: makeMaterial(scene, 'w660s-expanse-npc-resolved-material', { diffuse: '#10281f', emissive: '#75f7cf', intensity: 0.86 }),
    activity: makeMaterial(scene, 'w660r-expanse-activity-material', { diffuse: '#ffbf52', emissive: '#ffbf52', intensity: 0.82 }),
    route: makeMaterial(scene, 'w660r-expanse-route-material', { diffuse: '#9df8ff', emissive: '#9df8ff', intensity: 0.85 }),
    realmFloor: makeMaterial(scene, 'w660r-my-realm-floor-material', { diffuse: '#100a24', emissive: '#53298c', intensity: 0.2 }),
    realmAccent: makeMaterial(scene, 'w660r-my-realm-accent-material', { diffuse: '#b67dff', emissive: '#b67dff', intensity: 0.72 }),
    dormant: makeMaterial(scene, 'w660r-my-realm-dormant-material', { diffuse: '#243044', emissive: '#56708b', intensity: 0.18 }),
    transit: makeMaterial(scene, 'w660u-transit-material', { diffuse: '#13243b', emissive: '#55eaff', intensity: 0.78 }),
    transitAccent: makeMaterial(scene, 'w660u-transit-accent-material', { diffuse: '#fff4d0', emissive: '#ffc45c', intensity: 0.92 }),
    maintenance: makeMaterial(scene, 'w660u-maintenance-material', { diffuse: '#17223a', emissive: '#75f7cf', intensity: 0.72 }),
    weatherRain: makeMaterial(scene, 'w660u-weather-rain-material', { diffuse: '#89e8ff', emissive: '#55b9ff', intensity: 0.45, alpha: 0.42 }),
    weatherMist: makeMaterial(scene, 'w660u-weather-mist-material', { diffuse: '#7a87c7', emissive: '#6c75d9', intensity: 0.18, alpha: 0.12 }),
    shelter: makeMaterial(scene, 'w660u-shelter-material', { diffuse: '#15263b', emissive: '#ffc45c', intensity: 0.62 }),
    portal: makeMaterial(scene, 'w660u-portal-material', { diffuse: '#21123b', emissive: '#ad78ff', intensity: 0.9 }),
    portalAccent: makeMaterial(scene, 'w660u-portal-accent-material', { diffuse: '#f6ecff', emissive: '#75f7cf', intensity: 0.82 }),
    worldEvent: makeMaterial(scene, 'w660u-world-event-material', { diffuse: '#18233a', emissive: '#ffda73', intensity: 0.78 }),
    macroRoad: makeMaterial(scene, 'w681-expanse-macro-road-material', { diffuse: '#07101d', emissive: '#2f6f8f', intensity: 0.22 }),
    macroRegion: makeMaterial(scene, 'w681-expanse-macro-region-material', { diffuse: '#101a2c', emissive: '#55eaff', intensity: 0.28, alpha: 0.82 }),
    population: makeMaterial(scene, 'w682-expanse-population-material', { diffuse: '#101b30', emissive: '#73e9ff', intensity: 0.58 }),
    discovery: makeMaterial(scene, 'w682-expanse-discovery-material', { diffuse: '#24153b', emissive: '#ad78ff', intensity: 0.86 }),
    streetActivity: makeMaterial(scene, 'w682-expanse-street-activity-material', { diffuse: '#2a2112', emissive: '#ffc45c', intensity: 0.72 }),
    identity: new Map(),
    transformation: new Map()
  };
  for (const [identity, hex] of Object.entries(IDENTITY_COLOURS)) materials.identity.set(identity, makeMaterial(scene, `w660r-expanse-${identity}-material`, { diffuse: '#111b2b', emissive: hex, intensity: 0.55 }));
  for (const [destination, hex] of Object.entries(TRANSFORMATION_COLOURS)) materials.transformation.set(destination, makeMaterial(scene, `w660r-transformation-${destination}-material`, { diffuse: '#171127', emissive: hex, intensity: 0.68 }));

  const root = new TransformNode('w660r-living-nexus-root', scene);
  const expanseRoot = new TransformNode('w660r-living-nexus-expanse-root', scene);
  const realmRoot = new TransformNode('w660r-living-nexus-my-realm-root', scene);
  const nexusRealmRenderer = createEonCityLivingNexusRealmBabylonRenderer({ scene, parent: root });
  let worldSystemsRoot = new TransformNode('w660u-living-nexus-world-systems-root', scene);
  let macroRegionRoot = new TransformNode('w681-expanse-macro-regions-root', scene);
  let expansePopulationRoot = new TransformNode('w682-expanse-population-root', scene);
  expanseRoot.parent = root;
  realmRoot.parent = root;
  worldSystemsRoot.parent = expanseRoot;
  macroRegionRoot.parent = expanseRoot;
  expansePopulationRoot.parent = expanseRoot;
  expanseRoot.setEnabled(false);
  realmRoot.setEnabled(false);

  let disposed = false;
  let destination = 'core';
  let mode = experienceProfile.mode;
  let reducedEffects = Boolean(reducedMotion);
  let activeCellId = '';
  let activeExpanse = null;
  const renderedCells = new Map();
  let expanseStreamStats = { created: 0, reused: 0, disposed: 0, syncCount: 0, lastEntered: [], lastExited: [], lastRebuilt: [] };
  let renderedTransformations = boundedTransformations(transformations, qualityProfile.realmCapacity);
  let connectedCoreRenderer = null;
  let connectedCorePlan = null;
  let connectedCoreSummary = null;
  let connectedCoreGateway = null;
  let connectedCoreTransitJourney = null;
  const captureConnectedCoreAuthority = () => {
    if (!connectedCoreRenderer) return;
    connectedCorePlan = connectedCoreRenderer.getPlan();
    connectedCoreSummary = connectedCoreRenderer.getSummary();
    connectedCoreGateway = connectedCoreRenderer.getGateway();
    connectedCoreTransitJourney = connectedCoreRenderer.getReviewedTransitJourney();
  };
  const mountConnectedCore = ({ visible = destination === 'core' } = {}) => {
    if (!connectedCoreRenderer) {
      connectedCoreRenderer = createEonCityConnectedCoreBabylonRenderer({ scene, parent: root, quality: resolvedQuality, reducedEffects, mode, transformations: renderedTransformations });
      captureConnectedCoreAuthority();
    }
    connectedCoreRenderer.setVisible(Boolean(visible));
    captureConnectedCoreAuthority();
    return connectedCoreRenderer;
  };
  const unmountConnectedCore = () => {
    if (!connectedCoreRenderer) return connectedCoreSummary;
    connectedCoreRenderer.setVisible(false);
    captureConnectedCoreAuthority();
    connectedCoreRenderer.dispose();
    connectedCoreRenderer = null;
    connectedCoreSummary = freeze({ ...(connectedCoreSummary || {}), visible: false, disposed: false, destinationScopedDormant: true });
    return connectedCoreSummary;
  };
  mountConnectedCore({ visible: true });
  const flagshipExpansePlan = buildEonCityW712FlagshipExpansePlan({ gateway: connectedCoreGateway, position: EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, seed, quality: resolvedQuality, reducedMotion: reducedEffects });
  let expanseActivityNodes = [];
  let expanseRouteNodes = [];
  let expanseCollisionVolumes = [];
  let expanseOpportunityNodes = [];
  let encounterResolutions = [];
  let realmActivityNodes = [];
  let worldSystemsPlan = null;
  let accessiblePortalOverride = null;
  let worldTransitNodes = [];
  let worldMaintenanceNodes = [];
  let worldWeatherNodes = [];
  let worldFeatureNodes = [];
  let macroRegionPlan = null;
  let expansePresentationPlan = null;
  let macroRegionNodes = [];
  let expansePopulationPlan = null;
  let expansePopulationNodes = [];
  let expanseDiscoveryNodes = [];
  let expanseStreetActivityNodes = [];
  let worldPhaseIndex = 0;
  let activeRealmPlan = null;
  let realmReturnPoint = null;
  let physicalGatewayReview = null;
  let realmTransformationRoot = new TransformNode('w660r-my-realm-transformations', scene);
  realmTransformationRoot.parent = realmRoot;
  createRealmBase({ scene, parent: realmRoot, materials, activityNodes: realmActivityNodes });

  const rebuildRealm = () => {
    disposeNode(realmTransformationRoot);
    realmActivityNodes = realmActivityNodes.filter((entry) => !['transformation'].includes(entry.kind));
    realmTransformationRoot = new TransformNode('w660r-my-realm-transformations', scene);
    realmTransformationRoot.parent = realmRoot;
    renderedTransformations = renderRealmTransformations({ scene, parent: realmTransformationRoot, materials, entries: renderedTransformations, qualityProfile, activityNodes: realmActivityNodes });
  };
  rebuildRealm();

  const rebuildWorldSystems = () => {
    disposeNode(worldSystemsRoot);
    worldSystemsRoot = new TransformNode('w660u-living-nexus-world-systems-root', scene);
    worldSystemsRoot.parent = expanseRoot;
    const generatedPlan = buildEonCityLivingNexusWorldSystemsPlan({
      cells: activeExpanse?.cells || [],
      currentCellId: activeCellId,
      seed,
      quality: resolvedQuality,
      reducedEffects,
      phaseIndex: worldPhaseIndex
    });
    worldSystemsPlan = accessiblePortalOverride
      ? freeze({ ...generatedPlan, rarePortal: accessiblePortalOverride, accessiblePortalWayfinding: true })
      : generatedPlan;
    const rendered = renderLivingWorldSystems({ scene, parent: worldSystemsRoot, materials, plan: worldSystemsPlan });
    worldTransitNodes = rendered.transitNodes;
    worldMaintenanceNodes = rendered.maintenanceNodes;
    worldWeatherNodes = rendered.weatherNodes;
    worldFeatureNodes = rendered.featureNodes;
    return worldSystemsPlan;
  };

  const rebuildMacroRegions = (position = EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse) => {
    const nextPlan = buildEonCityW681ExpanseMacroRegionPlan({ position: normalizePosition(position), seed, quality: resolvedQuality });
    if (macroRegionPlan?.currentRegionId === nextPlan.currentRegionId && macroRegionNodes.length > 0) return macroRegionPlan;
    disposeNode(macroRegionRoot);
    macroRegionRoot = new TransformNode('w698-expanse-open-world-root', scene);
    macroRegionRoot.parent = expanseRoot;
    macroRegionPlan = nextPlan;
    expansePresentationPlan = buildEonCityW698ExpansePresentation({ macroPlan: nextPlan, quality: resolvedQuality, seed });
    const presentationValidation = validateEonCityW698ExpansePresentation(expansePresentationPlan);
    if (!presentationValidation.ok) throw new Error(`w698-expanse-presentation-invalid:${presentationValidation.errors.join(',')}`);
    macroRegionNodes = [];
    for (const region of macroRegionPlan.regions) {
      const marker = MeshBuilder.CreateCylinder(`w698-macro-region-${region.id}`, { height: .035, diameter: region.role === 'current' ? 4.2 : 2.7, tessellation: 12 }, scene);
      marker.parent = macroRegionRoot; marker.position.set(region.center.x, -.085, region.center.z); marker.material = region.role === 'current' ? materials.route : materials.macroRegion; marker.isPickable = false;
      marker.metadata = freeze({ kind:'w698-expanse-region-anchor', regionId:region.id, role:region.role, archetypeId:region.archetype.id, hardBorder:false, interactive:false, localOnly:true });
      macroRegionNodes.push(marker);
    }
    for (const road of expansePresentationPlan.roadHierarchy) {
      macroRegionNodes.push(createGroundSegment({ scene, parent:macroRegionRoot, name:`w681-expanse-macro-arterial-${road.id}`, from:road.from, to:road.to, width:road.width, height:.04, y:-.095, material:materials.macroRoad, metadata:{kind:'w698-expanse-road',roadId:road.id,hierarchy:road.hierarchy,curbs:road.curbs,centerLine:road.centerLine,continuity:true,interactive:false,localOnly:true} }));
      const dx=Number(road.to.x)-Number(road.from.x); const dz=Number(road.to.z)-Number(road.from.z); const length=Math.max(1,Math.hypot(dx,dz)); const lamps=Math.min(8,Math.max(2,Math.floor(length/Math.max(12,road.lightSpacing))));
      for(let i=1;i<lamps;i+=1){const t=i/lamps;const lamp=MeshBuilder.CreateCylinder(`w698-road-lamp-${road.id}-${i}`,{height:.85,diameter:.08,tessellation:6},scene);lamp.parent=macroRegionRoot;lamp.position.set(road.from.x+dx*t,.42,road.from.z+dz*t);lamp.material=materials.route;lamp.isPickable=false;lamp.metadata=freeze({kind:'w698-road-light',roadId:road.id,lod:'mid',interactive:false,localOnly:true});macroRegionNodes.push(lamp);}
    }
    for (const cluster of expansePresentationPlan.skylineClusters) for (const entry of cluster.nodes) macroRegionNodes.push(createW698SkylineMesh({scene,parent:macroRegionRoot,entry,material:materials.macroRegion}));
    return macroRegionPlan;
  };

  const rebuildExpansePopulation = () => {
    disposeNode(expansePopulationRoot);
    expansePopulationRoot = new TransformNode('w682-expanse-population-root', scene);
    expansePopulationRoot.parent = expanseRoot;
    expansePopulationPlan = buildEonCityW682ExpansePopulationPlan({
      cells: activeExpanse?.cells || [],
      seed,
      quality: resolvedQuality,
      reducedMotion: reducedEffects
    });
    expansePopulationNodes = [];
    expanseDiscoveryNodes = [];
    expanseStreetActivityNodes = [];
    for (const actor of expansePopulationPlan.population) {
      const silhouette = actor.archetype.silhouette;
      const node = silhouette === 'orb'
        ? MeshBuilder.CreateSphere(actor.id, { diameter: 0.42, segments: 8 }, scene)
        : silhouette === 'drone'
          ? MeshBuilder.CreateBox(actor.id, { width: 0.5, height: 0.22, depth: 0.42 }, scene)
          : silhouette === 'robot'
            ? MeshBuilder.CreateCylinder(actor.id, { height: 0.92, diameter: 0.38, tessellation: 8 }, scene)
            : MeshBuilder.CreateCapsule(actor.id, { height: 1.18, radius: 0.2, tessellation: 8 }, scene);
      node.parent = expansePopulationRoot;
      node.position.set(actor.start.x, actor.start.y, actor.start.z);
      node.scaling.setAll(actor.scale);
      node.material = silhouette === 'orb' || silhouette === 'drone' ? materials.maintenance : materials.population;
      node.isPickable = false;
      node.metadata = freeze({ kind: 'w682-expanse-ambient-population', populationId: actor.id, archetypeId: actor.archetype.id, activity: actor.activity, scheduleId: actor.scheduleId, claimsRealWork: false, autonomousAgent: false, interactive: false, localOnly: true });
      expansePopulationNodes.push(freeze({ node, actor }));
    }
    for (const discovery of expansePopulationPlan.discoveries) {
      const discoveryVisual = resolveEonCityW698DiscoveryVisual(discovery.kind, discovery.rarity);
      const node = createW698DiscoveryMesh({ scene, name: `w698-discovery-${discovery.id}`, visual: discoveryVisual });
      node.parent = expansePopulationRoot;
      node.position.set(discovery.position.x, discovery.position.y + 0.34, discovery.position.z);
      if (discoveryVisual.shape === 'echo-portal') node.rotation.x = Math.PI / 2;
      node.material = discovery.rarity === 'rare' ? materials.worldEvent : materials.discovery;
      node.isPickable = true;
      node.metadata = freeze({
        kind: 'w682-expanse-discovery',
        interactionKind: 'expanse-landmark',
        assetId: discovery.id,
        interactionId: discovery.id,
        label: discovery.label,
        purpose: `Review this ${discovery.kind.replaceAll('-', ' ')} discovery in the Expanse.`,
        rarity: discovery.rarity,
        visualShape: discoveryVisual.shape,
        visualAnimation: discoveryVisual.animation,
        panel: 'living-nexus',
        route: '',
        interactionRadius: 3.5,
        reviewFirst: true,
        automaticOpen: false,
        privateDataRead: false,
        interactive: true,
        localOnly: true
      });
      expanseDiscoveryNodes.push(freeze({ node, discovery, visual: discoveryVisual, baseY: node.position.y, phase: discovery.rarity === 'rare' ? 0.8 : 0.2 }));
    }
    for (const activity of expansePopulationPlan.streetActivity) {
      const streetVisual = resolveEonCityW698StreetActivityVisual(activity.kind);
      const node = createW698StreetMesh({ scene, name: `w698-street-${activity.id}`, visual: streetVisual });
      node.parent = expansePopulationRoot;
      node.position.set(activity.position.x, activity.position.y, activity.position.z);
      node.material = materials.streetActivity;
      node.isPickable = false;
      node.metadata = freeze({ kind: 'w698-expanse-street-activity', activityId: activity.id, activityKind: activity.kind, visualShape: streetVisual.shape, claimsRealActivity: false, interactive: false, localOnly: true });
      expanseStreetActivityNodes.push(freeze({ node, activity, visual: streetVisual, baseY: node.position.y }));
    }
    return expansePopulationPlan;
  };

  const collectRenderedCellState = () => {
    const records = [...renderedCells.values()];
    expanseActivityNodes = records.flatMap((record) => [...(record.activityNodes || [])]);
    expanseRouteNodes = records.flatMap((record) => [...(record.routeNodes || [])]);
    expanseCollisionVolumes = records.flatMap((record) => [...(record.collisionVolumes || [])]);
    expanseOpportunityNodes = records.flatMap((record) => [...(record.opportunityNodes || [])]);
  };

  const createRenderedCell = (cell) => {
    const encounter = cell?.interactive === false || cell?.residencyTier === 'horizon'
      ? null
      : buildEonCityLivingNexusEncounter(cell, { seed, state: { resolutions: encounterResolutions } });
    return createCellRenderer({ scene, cell, encounter, parent: expanseRoot, materials, qualityProfile });
  };

  const rebuildExpanse = (position = EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, { force = false } = {}) => {
    const candidate = buildEonCityLivingNexusExpanse({ position: normalizePosition(position), seed });
    const nextCells = new Map(candidate.cells.map((cell) => [cell.id, cell]));
    const entered = [];
    const exited = [];
    const rebuilt = [];
    let reused = 0;

    for (const [cellId, record] of [...renderedCells.entries()]) {
      const nextCell = nextCells.get(cellId);
      const tierChanged = nextCell && record.residencyTier !== nextCell.residencyTier;
      const roleChanged = nextCell && record.role !== nextCell.role;
      if (nextCell && !force && !tierChanged && !roleChanged) {
        reused += 1;
        continue;
      }
      try { record.dispose?.(); } catch { disposeNode(record.root); }
      renderedCells.delete(cellId);
      expanseStreamStats.disposed += 1;
      if (!nextCell) exited.push(cellId);
      else rebuilt.push(cellId);
    }

    for (const [cellId, cell] of nextCells) {
      if (renderedCells.has(cellId)) continue;
      renderedCells.set(cellId, createRenderedCell(cell));
      expanseStreamStats.created += 1;
      if (!rebuilt.includes(cellId)) entered.push(cellId);
    }

    activeExpanse = candidate;
    activeCellId = candidate.currentCellId || '';
    collectRenderedCellState();
    rebuildMacroRegions(position);
    rebuildExpansePopulation();
    expanseStreamStats = {
      ...expanseStreamStats,
      reused: expanseStreamStats.reused + reused,
      syncCount: expanseStreamStats.syncCount + 1,
      lastEntered: freeze(entered),
      lastExited: freeze(exited),
      lastRebuilt: freeze(rebuilt)
    };
    rebuildWorldSystems();
    if (reducedEffects) for (const marker of expanseRouteNodes) marker.setEnabled(false);
    return activeExpanse;
  };
  rebuildExpanse(EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse);

  const getPhysicalGatewayFlow = (position = playerAnchor?.position || {}, now = Date.now()) => {
    const authority = connectedCoreRenderer?.getGateway?.() || connectedCoreGateway;
    const gateway = destination === 'core' && connectedCoreRenderer
      ? connectedCoreRenderer.getNearestGateway(position, { maxDistance: authority?.discoveryRadius || authority?.inspectRadius || 8.5 })
      : null;
    const reviewValidation = physicalGatewayReview && authority
      ? validateEonCityW712GatewayReview(physicalGatewayReview, authority, { now })
      : freeze({ ok: false, errors: freeze(['review-missing']) });
    if (physicalGatewayReview && !reviewValidation.ok && reviewValidation.errors.includes('review-expired')) physicalGatewayReview = null;
    const prepared = Boolean(gateway && physicalGatewayReview?.gatewayId === gateway.id && reviewValidation.ok);
    return freeze({ gateway, prepared, reviewValidation, flowState: resolveEonCityW712FlagshipExpanseEntryState({ gateway, destination, prepared }) });
  };

  const getSummary = () => {
    const gatewayFlow = getPhysicalGatewayFlow();
    const coreSummary = connectedCoreRenderer?.getSummary?.() || connectedCoreSummary || {};
    return freeze({
    schema: EON_CITY_LIVING_NEXUS_BABYLON_SCHEMA,
    destination,
    mode,
    quality: resolvedQuality,
    reducedEffects,
    mobileProfile: experienceProfile.mobile,
    portraitSafeLayout: experienceProfile.portraitSafeLayout,
    accessibilityKeyboardNavigation: experienceProfile.keyboardNavigation,
    minimumTouchTargetPx: experienceProfile.minimumTouchTargetPx,
    essentialFeatureRequiresExploration: experienceProfile.essentialFeatureRequiresExploration,
    rendered: !disposed,
    expanseVisible: destination === 'expanse',
    myRealmVisible: destination === 'my-realm',
    nexusRealmVisible: destination === 'realm',
    activeRealmId: activeRealmPlan?.id || null,
    activeRealmLabel: activeRealmPlan?.label || null,
    authoredRealmCount: getEonCityLivingNexusRealmCatalog().length,
    authoredRealmZoneCount: activeRealmPlan?.zones?.length || 0,
    authoredRealmDiscoveryCount: activeRealmPlan?.discoveries?.length || 0,
    authoredRealmTransformationActive: activeRealmPlan?.transformation?.active === true,
    connectedCoreVisible: coreSummary.visible,
    connectedCoreDistrictCount: coreSummary.districtCount,
    connectedCoreStationCount: coreSummary.stationCount,
    connectedCoreStreetConnectionCount: coreSummary.streetConnectionCount,
    connectedCoreTransitCapsuleCount: coreSummary.transitCapsuleCount,
    connectedCoreAmbientScheduleCount: coreSummary.ambientScheduleCount,
    connectedCoreEonbotDockCount: coreSummary.eonbotDockCount,
    physicalGatewayVisible: coreSummary.physicalGatewayVisible === true,
    physicalGatewayId: coreSummary.physicalGatewayId || null,
    physicalGatewayPrepared: gatewayFlow.prepared,
    physicalGatewayEntryReady: gatewayFlow.flowState.entryReady === true,
    physicalGatewayFlowState: gatewayFlow.flowState.id,
    physicalGatewayReviewExpiresAt: gatewayFlow.prepared ? physicalGatewayReview?.expiresAt || 0 : 0,
    flagshipExpanseReady: destination === 'expanse' && renderedCells.size === 25 && (macroRegionPlan?.macroRegionCount || 0) === 9 && (expansePopulationPlan?.populationCount || 0) >= 14,
    flagshipExpanseContractReady: flagshipExpansePlan.world.ready === true,
    flagshipExpanseRegionCount: flagshipExpansePlan.world.macroRegionCount,
    flagshipExpanseDiscoveryCount: flagshipExpansePlan.world.discoveryCount,
    flagshipExpansePopulationCount: flagshipExpansePlan.world.populationCount,
    safeCoreReturnAvailable: destination !== 'core',
    currentCellId: activeCellId || activeExpanse?.currentCellId || null,
    residentCellCount: activeExpanse?.cellCount || 0,
    renderedCellCount: renderedCells.size,
    interactiveCellCount: activeExpanse?.interactiveCellCount || 0,
    horizonCellCount: activeExpanse?.horizonCellCount || 0,
    streamedCellCreatedCount: expanseStreamStats.created,
    streamedCellReusedCount: expanseStreamStats.reused,
    streamedCellDisposedCount: expanseStreamStats.disposed,
    streamedCellSyncCount: expanseStreamStats.syncCount,
    lastStreamEnteredCellIds: expanseStreamStats.lastEntered,
    lastStreamExitedCellIds: expanseStreamStats.lastExited,
    lastStreamRebuiltCellIds: expanseStreamStats.lastRebuilt,
    renderedTransformationCount: renderedTransformations.length,
    activityNodeCount: expanseActivityNodes.length + realmActivityNodes.length,
    routeMarkerCount: expanseRouteNodes.length,
    collisionVolumeCount: expanseCollisionVolumes.length,
    opportunityCount: expanseOpportunityNodes.length,
    resolvedOpportunityCount: expanseOpportunityNodes.filter((entry) => entry.encounter?.state === 'transformed').length,
    macroRegionCount: macroRegionPlan?.macroRegionCount || 0,
    macroArterialCount: macroRegionPlan?.arterials?.length || 0,
    macroApproachCount: macroRegionPlan?.approaches?.length || 0,
    macroCurrentRegionId: macroRegionPlan?.currentRegionId || null,
    macroHorizonAnchorCount: macroRegionPlan?.horizonAnchors?.length || 0,
    macroRenderedNodeCount: macroRegionNodes.length,
    expanseArchitectureFamilyCount: expansePresentationPlan?.uniqueArchitectureFamilies || 0,
    expanseSkylineNodeCount: expansePresentationPlan?.skylineNodeCount || 0,
    expanseRoadHierarchyCount: expansePresentationPlan?.roadHierarchy?.length || 0,
    expanseNearMidFarComposition: expansePresentationPlan?.nearMidFarComposition === true,
    expansePopulationCount: expansePopulationPlan?.populationCount || 0,
    expanseDiscoveryCount: expansePopulationPlan?.discoveryCount || 0,
    expanseStreetActivityCount: expansePopulationPlan?.streetActivityCount || 0,
    expanseArchetypeVariety: expansePopulationPlan?.archetypeVariety || 0,
    expanseActivityVariety: expansePopulationPlan?.activityVariety || 0,
    expanseAdjacentArchetypeRepeats: expansePopulationPlan?.adjacentArchetypeRepeats || 0,
    expanseRepetitionScore: expansePopulationPlan?.repetitionScore ?? 1,
    worldSystemsPhaseId: worldSystemsPlan?.phase?.id || null,
    worldSystemsWeatherId: worldSystemsPlan?.weather?.id || null,
    transitCapsuleCount: worldTransitNodes.length,
    maintenanceCueCount: worldMaintenanceNodes.length,
    weatherNodeCount: worldWeatherNodes.length,
    weatherShelterCount: worldFeatureNodes.filter((entry) => entry.kind === 'shelter').length,
    rarePortalCount: worldSystemsPlan?.rarePortal ? 1 : 0,
    authoredWorldEventCount: worldSystemsPlan?.worldEvent ? 1 : 0,
    localVisualWeather: true,
    realWeatherRead: false,
    sceneMeshCount: scene.meshes?.filter?.((mesh) => String(mesh.name || '').startsWith('w660r-') || mesh.metadata?.kind?.startsWith?.('living-nexus-')).length || 0,
    worldBound: EON_CITY_LIVING_NEXUS_WORLD_BOUND,
    visibleHardBorder: false,
    streamedWorld: true,
    incrementalCellRecycling: true,
    deterministic: true,
    sourceControlledProcedural: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    secondAssistantCreated: false,
    secondProjectStoreCreated: false,
    secondTaskStoreCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    disposed
    });
  };

  return freeze({
    schema: EON_CITY_LIVING_NEXUS_BABYLON_SCHEMA,
    getSummary,
    getEntryPose(requestedDestination = destination) {
      const pose = EON_CITY_LIVING_NEXUS_ENTRY_POSES[normalizeDestination(requestedDestination)];
      return pose ? freeze({ ...pose }) : null;
    },
    setDestination(requestedDestination = 'core', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (!DESTINATIONS.includes(String(requestedDestination))) return freeze({ ok: false, reason: 'unknown-living-nexus-destination', summary: getSummary() });
      const next = String(requestedDestination);
      if (next === 'core') mountConnectedCore({ visible: true });
      if (next === 'expanse') rebuildExpanse(EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, { force: true });
      destination = next;
      if (next !== 'core') physicalGatewayReview = null;
      if (next === 'core') accessiblePortalOverride = null;
      if (next !== 'core') unmountConnectedCore();
      expanseRoot.setEnabled(next === 'expanse');
      realmRoot.setEnabled(next === 'my-realm');
      if (next === 'realm') nexusRealmRenderer.show();
      else nexusRealmRenderer.hide();
      const destinationLabel = next === 'core' ? 'EONCITY CORE' : next === 'expanse' ? 'THE EXPANSE' : next === 'my-realm' ? 'MY REALM' : activeRealmPlan?.label || 'NEXUS REALM';
      try { onStatus?.(`${destinationLabel} activated in the existing City scene after explicit confirmation.`); } catch {}
      const summary = getSummary();
      return freeze({ ok: true, destination: next, entryPose: next === 'realm' ? nexusRealmRenderer.getEntryPose() || this.getEntryPose(next) : this.getEntryPose(next), summary, flagshipExpanseReady: next === 'expanse' ? summary.flagshipExpanseReady : false, renderedCellCount: summary.renderedCellCount, macroRegionCount: summary.macroRegionCount, discoveryCount: summary.expanseDiscoveryCount, safeCoreReturnAvailable: next !== 'core', automaticNavigation: false, opensRoute: false });
    },
    getConnectedCorePlan() { return connectedCoreRenderer?.getPlan?.() || connectedCorePlan; },
    getConnectedCoreSummary() { return connectedCoreRenderer?.getSummary?.() || connectedCoreSummary; },
    beginConnectedCoreTransitJourney(journey = null, options = {}) {
      if (!connectedCoreRenderer || destination !== 'core') return freeze({ ok: false, reason: 'connected-core-unavailable', summary: getSummary() });
      const result = connectedCoreRenderer.beginReviewedTransitJourney(journey, options);
      captureConnectedCoreAuthority();
      return result;
    },
    getConnectedCoreTransitJourney() { return connectedCoreRenderer?.getReviewedTransitJourney?.() || connectedCoreTransitJourney; },
    getPhysicalGateway() { return connectedCoreRenderer?.getGateway?.() || connectedCoreGateway; },
    getNearestPhysicalGateway(position = playerAnchor?.position || {}, options = {}) {
      if (destination !== 'core') return null;
      if (!connectedCoreRenderer) return null;
      const authority = connectedCoreRenderer.getGateway();
      const gateway = connectedCoreRenderer.getNearestGateway(position, { maxDistance: options.maxDistance || authority?.discoveryRadius || authority?.inspectRadius || 8.5 });
      if (!gateway) return null;
      const flow = getPhysicalGatewayFlow(position);
      return freeze({ ...gateway, prepared: flow.prepared, flowState: flow.flowState, reviewExpiresAt: flow.prepared ? physicalGatewayReview?.expiresAt || 0 : 0 });
    },
    getFlagshipExpanseEntryState(position = playerAnchor?.position || {}) {
      return getPhysicalGatewayFlow(position).flowState;
    },
    inspectPhysicalGateway(position = playerAnchor?.position || {}, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'core') return freeze({ ok: false, reason: 'core-not-active', summary: getSummary() });
      if (!connectedCoreRenderer) return freeze({ ok: false, reason: 'connected-core-unavailable', summary: getSummary() });
      const gateway = connectedCoreRenderer.getNearestGateway(position, { maxDistance: connectedCoreRenderer.getGateway()?.inspectRadius || 5.5 });
      if (!gateway) return freeze({ ok: false, reason: 'physical-gateway-out-of-range', summary: getSummary() });
      physicalGatewayReview = createEonCityW712GatewayReview(gateway, { now: Date.now() });
      const flowState = resolveEonCityW712FlagshipExpanseEntryState({ gateway: { ...gateway, inEntryReadyRange: true }, destination, prepared: true });
      try { onStatus?.(`${gateway.label} inspected. Choose Enter the Expanse when ready; no extra movement step is required.`); } catch {}
      return freeze({ ok: true, gateway: freeze({ ...gateway, prepared: true, inEntryReadyRange: true, flowState }), flowState, reviewRequired: false, entryConfirmed: false, separateConfirmationRequired: true, noExtraMovementRequired: true, summary: getSummary(), automaticNavigation: false });
    },
    enterPhysicalGateway(position = playerAnchor?.position || {}, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'core') return freeze({ ok: false, reason: 'core-not-active', summary: getSummary() });
      if (!connectedCoreRenderer) return freeze({ ok: false, reason: 'connected-core-unavailable', summary: getSummary() });
      const gatewayAuthority = connectedCoreRenderer.getGateway();
      const gateway = connectedCoreRenderer.getNearestGateway(position, { maxDistance: gatewayAuthority?.entryReadyRadius || gatewayAuthority?.inspectRadius || 8.5 });
      if (physicalGatewayReview?.gatewayId !== gateway?.id) return freeze({ ok: false, reason: 'physical-gateway-inspection-required', flowState: resolveEonCityW712FlagshipExpanseEntryState({ gateway, destination, prepared: false }), summary: getSummary() });
      const reviewValidation = validateEonCityW712GatewayReview(physicalGatewayReview, gatewayAuthority, { now: Date.now() });
      if (!reviewValidation.ok) {
        physicalGatewayReview = null;
        return freeze({ ok: false, reason: reviewValidation.errors.includes('review-expired') ? 'physical-gateway-review-expired' : 'physical-gateway-inspection-required', reviewValidation, flowState: resolveEonCityW712FlagshipExpanseEntryState({ gateway, destination, prepared: false }), summary: getSummary() });
      }
      if (!gateway?.inEntryReadyRange) return freeze({ ok: false, reason: 'physical-gateway-entry-ready-range-required', flowState: resolveEonCityW712FlagshipExpanseEntryState({ gateway, destination, prepared: true }), summary: getSummary() });
      physicalGatewayReview = null;
      const result = this.setDestination(gateway.destination, { explicitUserAction: true });
      return freeze({ ...result, gatewayId: gateway.id, enteredThroughPhysicalGateway: result.ok === true, directWorldEntry: true, technicalPanelRequired: false, eonbotIntroduction: gateway.eonbotIntroduction, safeCoreReturnAvailable: result.ok === true, noExtraMovementRequired: true, automaticNavigation: false });
    },
    clearPhysicalGatewayReview() { physicalGatewayReview = null; return getSummary(); },
    getRealmCatalog() { return getEonCityLivingNexusRealmCatalog(); },
    getRealmPlan() { return activeRealmPlan ? freeze({ ...activeRealmPlan }) : null; },
    getRealmSummary() { return nexusRealmRenderer.getSummary(); },
    getNearestRarePortal(position = playerAnchor?.position || {}, { maxDistance = 3.2 } = {}) {
      if (destination !== 'expanse' || !worldSystemsPlan?.rarePortal) return null;
      const point = normalizePosition(position);
      const portal = worldSystemsPlan.rarePortal;
      const distance = Math.hypot(point.x - Number(portal.position?.x || 0), point.z - Number(portal.position?.z || 0));
      return distance <= Math.max(0.5, Number(maxDistance || 3.2)) ? freeze({ ...portal, distance: Math.round(distance * 10) / 10, reviewFirst: true, requiresSeparateEntryConfirmation: true }) : null;
    },
    locateRealmPortal(realmId = '', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'expanse') return freeze({ ok: false, reason: 'expanse-not-active', summary: getSummary() });
      const realm = getEonCityLivingNexusRealmCatalog().find((entry) => entry.id === String(realmId || ''));
      if (!realm) return freeze({ ok: false, reason: 'unknown-realm', summary: getSummary() });
      const currentCell = activeExpanse?.cells?.find?.((entry) => entry.id === activeCellId) || activeExpanse?.cells?.find?.((entry) => entry.role === 'current') || activeExpanse?.cells?.[0];
      if (!currentCell) return freeze({ ok: false, reason: 'expanse-cell-unavailable', summary: getSummary() });
      const point = normalizePosition(playerAnchor?.position || EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse);
      accessiblePortalOverride = freeze({
        id: `accessible-portal-${realm.id}-${currentCell.id}`,
        realmId: realm.id,
        label: realm.label,
        accent: realm.accent || realm.palette?.accent || '#ad78ff',
        cellId: currentCell.id,
        position: freeze({ x: point.x + 1.7, y: 1.65, z: point.z - 1.25 }),
        inspectOnly: true,
        authoredRealm: true,
        generatedGeometry: false,
        automaticNavigation: false,
        routePrepared: false,
        privateContentStored: false,
        localOnly: true,
        accessibleWayfinding: true
      });
      rebuildWorldSystems();
      try { onStatus?.(`${realm.label} portal located in the current Expanse cell. Inspect and confirm separately before entry.`); } catch {}
      return freeze({ ok: true, portal: accessiblePortalOverride, realm, reviewRequired: true, entryConfirmed: false, automaticNavigation: false, summary: getSummary() });
    },
    prepareRealm(realmId = '', portalId = '', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'expanse') return freeze({ ok: false, reason: 'expanse-not-active', summary: getSummary() });
      const portal = worldSystemsPlan?.rarePortal || null;
      if (!portal || portal.id !== String(portalId || '') || portal.realmId !== String(realmId || '')) return freeze({ ok: false, reason: 'rare-portal-not-resident', summary: getSummary() });
      const plan = buildEonCityLivingNexusRealmPlan(realmId, { quality: resolvedQuality, reducedEffects, portalId: portal.id });
      return freeze({ ok: true, portal: freeze({ ...portal }), plan, opensRealm: false, automaticNavigation: false, privateContentStored: false, summary: getSummary() });
    },
    enterRealm(realmId = '', portalId = '', { explicitUserAction = false, returnPoint = null } = {}) {
      const prepared = this.prepareRealm(realmId, portalId, { explicitUserAction });
      if (!prepared.ok) return prepared;
      const candidateReturn = returnPoint && Number.isFinite(Number(returnPoint.x)) && Number.isFinite(Number(returnPoint.z))
        ? freeze({ x: Number(returnPoint.x), z: Number(returnPoint.z), cellId: String(returnPoint.cellId || prepared.portal.cellId || ''), portalId: prepared.portal.id, realmId: prepared.plan.id, privateContentStored: false, automaticNavigation: false })
        : freeze({ x: Number(prepared.portal.position?.x || 0), z: Number(prepared.portal.position?.z || 0), cellId: prepared.portal.cellId, portalId: prepared.portal.id, realmId: prepared.plan.id, privateContentStored: false, automaticNavigation: false });
      activeRealmPlan = prepared.plan;
      realmReturnPoint = candidateReturn;
      const rendered = nexusRealmRenderer.render(activeRealmPlan);
      if (!rendered.ok) { activeRealmPlan = null; realmReturnPoint = null; return freeze({ ok: false, reason: rendered.reason || 'realm-render-failed', errors: rendered.errors || [], summary: getSummary() }); }
      destination = 'realm';
      expanseRoot.setEnabled(false);
      realmRoot.setEnabled(false);
      nexusRealmRenderer.show();
      try { onStatus?.(`${activeRealmPlan.label} entered after explicit portal review. The return portal remains available.`); } catch {}
      return freeze({ ok: true, destination: 'realm', realmId: activeRealmPlan.id, plan: activeRealmPlan, entryPose: nexusRealmRenderer.getEntryPose(), returnPoint: realmReturnPoint, summary: getSummary(), oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false, automaticNavigation: false, automaticExecution: false, privateContentStored: false });
    },
    exitRealm({ explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'realm' || !activeRealmPlan) return freeze({ ok: false, reason: 'realm-not-active', summary: getSummary() });
      const returnPoint = realmReturnPoint;
      const exitedRealmId = activeRealmPlan.id;
      destination = 'expanse';
      nexusRealmRenderer.hide();
      expanseRoot.setEnabled(true);
      realmRoot.setEnabled(false);
      activeRealmPlan = null;
      realmReturnPoint = null;
      try { onStatus?.(`${exitedRealmId} closed. The exact Expanse portal context is ready to restore after explicit return.`); } catch {}
      return freeze({ ok: true, destination: 'expanse', exitedRealmId, returnPoint, entryPose: returnPoint ? freeze({ ...EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, x: returnPoint.x, z: returnPoint.z }) : freeze({ ...EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse }), summary: getSummary(), automaticNavigation: false, privateContentStored: false });
    },
    getNearestRealmFeature(position = playerAnchor?.position || {}) { return destination === 'realm' ? nexusRealmRenderer.getNearestFeature(position) : null; },
    syncRealmVerifiedOutcome({ explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (destination !== 'realm' || !activeRealmPlan) return freeze({ ok: false, reason: 'realm-not-active', summary: getSummary() });
      const previous = activeRealmPlan.transformation?.active === true;
      const refreshed = buildEonCityLivingNexusRealmPlan(activeRealmPlan.id, { quality: resolvedQuality, reducedEffects, portalId: activeRealmPlan.portalId || '' });
      activeRealmPlan = refreshed;
      const rendered = nexusRealmRenderer.render(activeRealmPlan);
      return freeze({ ok: rendered.ok, realmId: activeRealmPlan.id, transformed: activeRealmPlan.transformation.active === true, newlyTransformed: !previous && activeRealmPlan.transformation.active === true, transformation: activeRealmPlan.transformation, plan: activeRealmPlan, summary: getSummary(), fakeCompletion: false, privateContentStored: false });
    },
    setMode(requestedMode = 'explore', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', summary: getSummary() });
      if (!MODES.includes(String(requestedMode))) return freeze({ ok: false, reason: 'unknown-living-nexus-mode', summary: getSummary() });
      mode = String(requestedMode);
      if (connectedCoreRenderer) { connectedCoreRenderer.setPresentation({ nextMode: mode, nextReducedEffects: reducedEffects }); captureConnectedCoreAuthority(); }
      return freeze({ ok: true, mode, summary: getSummary(), automaticExecution: false });
    },
    setReducedEffects(value = false) {
      reducedEffects = Boolean(value);
      if (connectedCoreRenderer) { connectedCoreRenderer.setPresentation({ nextMode: mode, nextReducedEffects: reducedEffects }); captureConnectedCoreAuthority(); }
      for (const marker of expanseRouteNodes) marker.setEnabled(!reducedEffects && qualityProfile.routeMarkers);
      if (activeExpanse) { rebuildWorldSystems(); rebuildExpansePopulation(); }
      return getSummary();
    },
    setTransformations(entries = []) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      renderedTransformations = boundedTransformations(entries, qualityProfile.realmCapacity);
      rebuildRealm();
      return freeze({ ok: true, recorded: renderedTransformations.length, summary: getSummary(), privateContentStored: false, rewardIssued: false });
    },
    setEncounterResolutions(entries = []) {
      if (disposed) return freeze({ ok: false, reason: 'living-nexus-renderer-disposed', summary: getSummary() });
      const seen = new Set();
      encounterResolutions = freeze((Array.isArray(entries) ? entries : []).filter((entry) => {
        const encounterId = String(entry?.encounterId || '').trim();
        const missionId = String(entry?.missionId || getEonCityLivingNexusMissionIdForOutcomeKind(entry?.outcomeKind) || '').trim();
        const receiptId = String(entry?.receiptId || '').trim();
        if (!/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(encounterId) || !/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(missionId) || !/^[a-z0-9][a-z0-9:_-]{0,119}$/i.test(receiptId) || seen.has(encounterId)) return false;
        seen.add(encounterId);
        return true;
      }).slice(0, 18).map((entry) => freeze({ encounterId: String(entry.encounterId), cellId: String(entry.cellId || ''), missionId: String(entry.missionId || getEonCityLivingNexusMissionIdForOutcomeKind(entry.outcomeKind) || ''), receiptId: String(entry.receiptId), outcomeKind: String(entry.outcomeKind || ''), resolvedAt: Number(entry.resolvedAt || 0), privateContentStored: false })));
      rebuildExpanse(playerAnchor?.position || EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse, { force: true });
      return freeze({ ok: true, recorded: encounterResolutions.length, summary: getSummary(), privateContentStored: false, rewardIssued: false });
    },
    getWorldSystemsPlan() { return worldSystemsPlan ? freeze({ ...worldSystemsPlan, transit: freeze(worldSystemsPlan.transit.map((entry) => freeze({ ...entry }))), maintenance: freeze(worldSystemsPlan.maintenance.map((entry) => freeze({ ...entry }))), rarePortal: worldSystemsPlan.rarePortal ? freeze({ ...worldSystemsPlan.rarePortal }) : null, worldEvent: worldSystemsPlan.worldEvent ? freeze({ ...worldSystemsPlan.worldEvent }) : null }) : null; },
    getMacroRegionPlan() { return macroRegionPlan ? freeze({ ...macroRegionPlan, regions: freeze(macroRegionPlan.regions.map((entry) => freeze({ ...entry }))), arterials: freeze(macroRegionPlan.arterials.map((entry) => freeze({ ...entry }))), horizonAnchors: freeze(macroRegionPlan.horizonAnchors.map((entry) => freeze({ ...entry }))) }) : null; },
    getPopulationPlan() { return expansePopulationPlan ? freeze({ ...expansePopulationPlan, population: freeze(expansePopulationPlan.population.map((entry) => freeze({ ...entry }))), discoveries: freeze(expansePopulationPlan.discoveries.map((entry) => freeze({ ...entry }))), streetActivity: freeze(expansePopulationPlan.streetActivity.map((entry) => freeze({ ...entry }))) }) : null; },
    getOpportunities() { return destination === 'expanse' ? freeze(expanseOpportunityNodes.map((entry) => freeze({ ...entry.encounter }))) : freeze([]); },
    getCellGuideTarget(cellId = '') { return resolveEonCityLivingNexusCellGuideTarget(cellId, activeExpanse?.cells || []); },
    getCollisionVolumes() {
      if (destination === 'expanse') return freeze(expanseCollisionVolumes.map((entry) => freeze({ ...entry })));
      if (destination === 'realm') return nexusRealmRenderer.getCollisionVolumes();
      return freeze([]);
    },
    getNearestOpportunity(position = playerAnchor?.position || {}) {
      if (destination !== 'expanse' || !activeExpanse) return null;
      return resolveNearestEonCityLivingNexusEncounter(normalizePosition(position), expanseOpportunityNodes.map((entry) => entry.encounter), { maxDistance: 3.1 });
    },
    update({ position = playerAnchor?.position || {}, now = globalThis.performance?.now?.() || Date.now() } = {}) {
      if (disposed) return getSummary();
      const point = normalizePosition(position);
      if (destination === 'core' && connectedCoreRenderer) { connectedCoreRenderer.update(now); captureConnectedCoreAuthority(); }
      if (destination === 'expanse') {
        const candidate = buildEonCityLivingNexusExpanse({ position: point, seed });
        if (candidate.currentCellId && candidate.currentCellId !== activeCellId) rebuildExpanse(point);
        const nextPhaseIndex = reducedEffects ? 0 : Math.abs(Math.trunc(Number(now || 0) / 60000)) % 4;
        if (nextPhaseIndex !== worldPhaseIndex) { worldPhaseIndex = nextPhaseIndex; rebuildWorldSystems(); }
      }
      if (!reducedEffects && mode === 'explore') {
        const time = Number(now || 0) * 0.001;
        if (destination === 'expanse') {
          for (const transit of worldTransitNodes) {
            if (!transit.node || transit.node.isDisposed?.()) continue;
            const progress = (transit.phase + time * transit.speed) % 1;
            transit.node.position.x = transit.start.x + (transit.end.x - transit.start.x) * progress;
            transit.node.position.y = transit.start.y + Math.sin(time * 1.2 + transit.phase * Math.PI * 2) * 0.045;
            transit.node.position.z = transit.start.z + (transit.end.z - transit.start.z) * progress;
          }
          for (const maintenance of worldMaintenanceNodes) {
            if (!maintenance.node || maintenance.node.isDisposed?.()) continue;
            maintenance.node.position.x = maintenance.base.x + Math.cos(time * 0.7 + maintenance.phase) * 0.28;
            maintenance.node.position.y = maintenance.base.y + Math.sin(time * 1.1 + maintenance.phase) * 0.12;
            maintenance.node.position.z = maintenance.base.z + Math.sin(time * 0.7 + maintenance.phase) * 0.28;
            maintenance.node.rotation.y += 0.009;
          }
          for (const weather of worldWeatherNodes) {
            if (!weather.node || weather.node.isDisposed?.()) continue;
            if (weather.kind === 'rain') weather.node.position.y = 0.7 + ((weather.baseY - time * 1.8 + weather.phase) % 4.6 + 4.6) % 4.6;
            else weather.node.rotation.y += 0.0014;
          }
          for (const feature of worldFeatureNodes) {
            if (!feature.node || feature.node.isDisposed?.()) continue;
            if (feature.kind === 'rare-portal' || feature.kind === 'world-event') feature.node.rotation.z += 0.0045;
          }
          for (const record of expansePopulationNodes) {
            if (!record.node || record.node.isDisposed?.()) continue;
            const actor = record.actor;
            const phase = (actor.phase + time * actor.speed) % 2;
            const progress = phase <= 1 ? phase : 2 - phase;
            record.node.position.x = actor.start.x + (actor.end.x - actor.start.x) * progress;
            record.node.position.y = actor.start.y + Math.sin(time * 1.6 + actor.phase * Math.PI * 2) * 0.035;
            record.node.position.z = actor.start.z + (actor.end.z - actor.start.z) * progress;
            record.node.rotation.y = Math.atan2(actor.end.x - actor.start.x, actor.end.z - actor.start.z) + (phase > 1 ? Math.PI : 0);
          }
          for (const record of expanseDiscoveryNodes) {
            if (!record.node || record.node.isDisposed?.()) continue;
            if (record.visual?.animation === 'rotate') record.node.rotation.z += record.discovery.rarity === 'rare' ? 0.009 : 0.0045;
            if (record.visual?.animation === 'float' || record.visual?.animation === 'pulse') record.node.position.y = record.baseY + Math.sin(time * 1.1 + record.phase) * 0.06;
          }
          for (const record of expanseStreetActivityNodes) {
            if (!record.node || record.node.isDisposed?.()) continue;
            if (record.visual?.motion === 'rotate' || record.activity.motion === 'rotate') record.node.rotation.y += 0.008;
            else record.node.position.y = record.baseY + Math.sin(time * 1.35 + record.activity.phase * Math.PI * 2) * 0.025;
          }
        }
        if (destination === 'realm') nexusRealmRenderer.update(now, { reducedEffects, mode });
        const activeNodes = destination === 'expanse' ? expanseActivityNodes : destination === 'my-realm' ? realmActivityNodes : [];
        for (const [index, entry] of activeNodes.entries()) {
          if (!entry.node || entry.node.isDisposed?.()) continue;
          if (entry.kind === 'ring' || entry.kind === 'realm-ring' || entry.kind === 'portal') entry.node.rotation.z += 0.006 + (index % 3) * 0.0015;
          else entry.node.position.y = Number(entry.baseY || 0) + Math.sin(time * 1.4 + entry.phase) * 0.035;
        }
      }
      return getSummary();
    },
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      nexusRealmRenderer.dispose();
      if (connectedCoreRenderer) connectedCoreRenderer.dispose();
      for (const record of renderedCells.values()) { try { record.dispose?.(); } catch {} }
      renderedCells.clear();
      disposeNode(root);
      for (const material of [materials.cell, materials.road, materials.lane, materials.npc, materials.npcResolved, materials.activity, materials.route, materials.realmFloor, materials.realmAccent, materials.dormant, materials.transit, materials.transitAccent, materials.maintenance, materials.weatherRain, materials.weatherMist, materials.shelter, materials.portal, materials.portalAccent, materials.worldEvent, materials.macroRoad, materials.macroRegion, materials.population, materials.discovery, materials.streetActivity, ...materials.identity.values(), ...materials.transformation.values()]) {
        try { material.dispose?.(); } catch {}
      }
      return getSummary();
    }
  });
}

export function validateEonCityLivingNexusBabylonSummary(summary = {}) {
  const errors = [];
  if (summary?.schema !== EON_CITY_LIVING_NEXUS_BABYLON_SCHEMA) errors.push('schema-invalid');
  if (!DESTINATIONS.includes(summary?.destination)) errors.push('destination-invalid');
  if (!MODES.includes(summary?.mode)) errors.push('mode-invalid');
  if (summary?.residentCellCount !== 25 || summary?.renderedCellCount !== 25) errors.push('rendered-5x5-required');
  if (summary?.interactiveCellCount !== 9 || summary?.horizonCellCount !== 16) errors.push('rendered-streaming-tiers-invalid');
  if (summary?.macroRegionCount !== 9 || summary?.macroArterialCount !== 12 || summary?.macroHorizonAnchorCount !== 8) errors.push('macro-region-continuity-invalid');
  if (!(summary?.expansePopulationCount >= 14) || !(summary?.expanseDiscoveryCount >= 6) || !(summary?.expanseStreetActivityCount >= 8) || summary?.expanseAdjacentArchetypeRepeats !== 0 || !(summary?.expanseRepetitionScore >= 0.95)) errors.push('expanse-population-variety-invalid');
  if (!(summary?.streamedCellSyncCount >= 1) || summary?.worldBound !== EON_CITY_LIVING_NEXUS_WORLD_BOUND || summary?.visibleHardBorder !== false || summary?.incrementalCellRecycling !== true) errors.push('streaming-authority-invalid');
  if (summary?.secondCanvasCreated || summary?.secondRenderLoopCreated || summary?.secondAssistantCreated || summary?.secondProjectStoreCreated || summary?.secondTaskStoreCreated) errors.push('parallel-system-created');
  if (summary?.automaticNavigation || summary?.automaticExecution || summary?.privateDataRead || summary?.privateContentStored || summary?.networkRequestCreated || summary?.rewardIssued || summary?.paymentClaimed) errors.push('truth-boundary-invalid');
  if (summary?.oneCanonicalScene !== true || summary?.deterministic !== true || summary?.sourceControlledProcedural !== true) errors.push('canonical-renderer-contract-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonCityLivingNexusEntryPose(destination = '') {
  const pose = EON_CITY_LIVING_NEXUS_ENTRY_POSES[normalizeDestination(destination)];
  return pose ? freeze({ ...pose }) : null;
}

export function toEonCityLivingNexusVector(position = {}) {
  const point = normalizePosition(position);
  return new Vector3(point.x, 0, point.z);
}
