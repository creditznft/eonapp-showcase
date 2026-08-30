/**
 * W660I — active-district procedural composition layer.
 *
 * This adds explicit foreground/midground/background identity around the paid
 * W649 assets. It owns no canvas or render loop: the existing City owner calls
 * update. W665 keeps the outgoing composition resident for a short visual
 * overlap so walking across a district boundary cannot replace a room in one
 * frame.
 */
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import {
  EON_CITY_W660I_DISTRICTS,
  getEonCityW660iDistrictConfig,
  validateEonCityW660iDistrictConfigs
} from './eon-city-w660i-district-config.js';
import { getEonCityW660iTerminalsForDistrict } from './eon-city-w660i-terminal-registry.js';
import { getEonCityW675DistrictWorldPose } from '../w675/eon-city-w675-orientation-belt-activation.js';
import { getEonCityW688DistrictWorldPose } from '../w688/eon-city-w688-creator-forge-belt-activation.js';
import { getEonCityW689DistrictWorldPose } from '../w689/eon-city-w689-all-district-belts.js';

export const EON_CITY_W660I_DISTRICT_COMPOSITION_SCHEMA = 'eon.city.w660i.district-composition.w665.v1';
const freeze = (value) => Object.freeze(value);
const DISTRICT_OVERLAP_SECONDS = 0.85;

function hex3(value, fallback = '#67e8f9') {
  try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); }
}
function hex4(value, alpha = 1, fallback = '#07131a') {
  const color = hex3(value, fallback);
  return new Color4(color.r, color.g, color.b, alpha);
}
function material(scene, name, color, { emissive = 0.12, alpha = 1, metallic = false } = {}) {
  const value = hex3(color);
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = value.scale(metallic ? 0.42 : 0.66);
  mat.emissiveColor = value.scale(emissive);
  mat.ambientColor = value.scale(0.16);
  mat.specularColor = metallic ? new Color3(0.65, 0.65, 0.68) : new Color3(0.18, 0.18, 0.2);
  mat.alpha = alpha;
  mat.backFaceCulling = false;
  return mat;
}
function attach(mesh, root, metadata = {}) {
  mesh.parent = root;
  mesh.isPickable = metadata.interactive === true;
  mesh.metadata = { decorative: metadata.decorative !== false, ownsRenderLoop: false, ...metadata };
  return mesh;
}
function box(scene, root, name, dimensions, position, mat, metadata = {}) {
  const mesh = attach(MeshBuilder.CreateBox(name, dimensions, scene), root, metadata);
  mesh.position.copyFromFloats(position.x || 0, position.y || 0, position.z || 0);
  mesh.material = mat;
  return mesh;
}
function cylinder(scene, root, name, options, position, mat, metadata = {}) {
  const mesh = attach(MeshBuilder.CreateCylinder(name, options, scene), root, metadata);
  mesh.position.copyFromFloats(position.x || 0, position.y || 0, position.z || 0);
  mesh.material = mat;
  return mesh;
}
function torus(scene, root, name, options, position, rotation, mat, metadata = {}) {
  const mesh = attach(MeshBuilder.CreateTorus(name, options, scene), root, metadata);
  mesh.position.copyFromFloats(position.x || 0, position.y || 0, position.z || 0);
  mesh.rotation.copyFromFloats(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  mesh.material = mat;
  return mesh;
}

function buildPlatform(scene, root, config, mats) {
  const ground = attach(MeshBuilder.CreateGround(`w660i-${config.id}-platform`, { width: 9.6, height: 9.6, subdivisions: 1 }, scene), root, { kind: 'district-platform', districtId: config.id });
  ground.position.y = 0.025;
  ground.material = mats.floor;
  const pathPositions = [
    { x: 0, z: -2.55, width: 1.15, depth: 4.4, rotation: 0 },
    { x: -2.25, z: 0.4, width: 3.8, depth: 0.34, rotation: 0 },
    { x: 2.25, z: 0.4, width: 3.8, depth: 0.34, rotation: 0 }
  ];
  for (const [index, path] of pathPositions.entries()) {
    const strip = box(scene, root, `w660i-${config.id}-path-${index}`, { width: path.width, height: 0.035, depth: path.depth }, { x: path.x, y: 0.065, z: path.z }, mats.accent, { kind: 'district-path', districtId: config.id });
    strip.rotation.y = path.rotation;
  }
  for (let i = 0; i < 8; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    cylinder(scene, root, `w660i-${config.id}-path-light-${i}`, { height: 0.42, diameter: 0.08, tessellation: 8 }, { x: side * 0.72, y: 0.23, z: -3.75 + row * 1.12 }, mats.accent, { kind: 'path-light', districtId: config.id });
  }
  for (const [index, diameter] of [8.6, 7.4, 5.8].entries()) {
    const ring = torus(scene, root, `w660k-${config.id}-plaza-ring-${index}`, { diameter, thickness: index === 0 ? 0.055 : 0.038, tessellation: 56 }, { x: 0, y: 0.08 + index * 0.006, z: 0.2 }, { x: Math.PI / 2 }, index === 1 ? mats.warm : mats.accent, { kind: 'district-plaza-ring', districtId: config.id });
    ring.visibility = index === 0 ? 0.52 : 0.7;
  }
}

function buildTerminals(scene, root, config, mats) {
  return getEonCityW660iTerminalsForDistrict(config.id).map((terminal, index) => {
    const p = terminal.localPosition;
    const pedestal = box(scene, root, `w660i-${config.id}-${terminal.id}-base`, { width: 0.7, height: 0.72, depth: 0.58 }, { x: p.x, y: 0.36, z: p.z }, mats.dark, { kind: 'productive-terminal-base', districtId: config.id, terminalId: terminal.id, terminalLabel: terminal.label });
    const screen = box(scene, root, `w660i-${config.id}-${terminal.id}-screen`, { width: 0.58, height: 0.52, depth: 0.055 }, { x: p.x, y: 0.92, z: p.z - 0.19 }, index === 1 ? mats.warm : mats.accent, {
      kind: 'productive-terminal-screen',
      interactionKind: 'terminal',
      assetId: terminal.id,
      districtId: config.id,
      terminalId: terminal.id,
      terminalLabel: terminal.label,
      terminalPurpose: terminal.purpose,
      reviewFirst: true,
      interactive: true,
      autoExecute: false,
      autoNavigate: false,
      decorative: false
    });
    screen.rotation.x = -0.16;
    return freeze({ terminalId: terminal.id, label: terminal.label, pedestal, screen });
  });
}

function buildSkyline(scene, root, config, mats) {
  const positions = [
    { x: -5.15, z: 4.65, h: 3.2, d: 0.78 }, { x: -4.25, z: 5.15, h: 5.4, d: 0.92 },
    { x: -3.05, z: 5.45, h: 4.1, d: 0.72 }, { x: -1.65, z: 5.65, h: 6.1, d: 0.94 },
    { x: 0, z: 5.85, h: 4.65, d: 0.82 }, { x: 1.65, z: 5.65, h: 5.55, d: 0.9 },
    { x: 3.05, z: 5.45, h: 3.85, d: 0.72 }, { x: 4.25, z: 5.15, h: 6.35, d: 0.96 },
    { x: 5.15, z: 4.65, h: 3.45, d: 0.78 }, { x: -5.55, z: 2.75, h: 4.15, d: 0.72 },
    { x: 5.55, z: 2.75, h: 4.75, d: 0.78 }, { x: 0, z: 6.75, h: 7.1, d: 1.02 }
  ];
  return positions.map((p, index) => {
    const tower = box(scene, root, `w660k-${config.id}-skyline-${index}`, { width: p.d, height: p.h, depth: p.d * 0.95 }, { x: p.x, y: p.h / 2, z: p.z }, index % 4 === 1 ? mats.primary : mats.dark, { kind: 'district-skyline', districtId: config.id, skylineId: config.skyline[index % config.skyline.length] });
    const crown = box(scene, root, `w660k-${config.id}-skyline-crown-${index}`, { width: p.d * 0.72, height: 0.08, depth: p.d * 0.72 }, { x: p.x, y: p.h + 0.12, z: p.z }, index % 3 === 1 ? mats.warm : mats.accent, { kind: 'district-skyline-crown', districtId: config.id });
    const windowBand = box(scene, root, `w660k-${config.id}-skyline-band-${index}`, { width: p.d * 1.03, height: 0.055, depth: p.d * 1.03 }, { x: p.x, y: Math.max(0.8, p.h * 0.58), z: p.z }, index % 2 ? mats.accent : mats.warm, { kind: 'district-skyline-light', districtId: config.id });
    return freeze({ tower, crown, windowBand });
  });
}

function buildDistrictVista(scene, root, config, mats, animated, quality) {
  const structures = [];
  const pylonCount = quality === 'lite' ? 6 : quality === 'cinematic' ? 12 : 9;
  for (let index = 0; index < pylonCount; index += 1) {
    const angle = (Math.PI * 2 * index) / pylonCount;
    const radius = 4.5 + (index % 2) * 0.28;
    const height = 1.4 + (index % 4) * 0.55;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius + 0.2;
    const pylon = box(scene, root, `w660k-${config.id}-vista-pylon-${index}`, { width: 0.22, height, depth: 0.32 }, { x, y: height / 2, z }, index % 3 === 0 ? mats.warm : mats.primary, { kind: 'district-vista-pylon', districtId: config.id });
    pylon.rotation.y = -angle;
    const signal = box(scene, root, `w660k-${config.id}-vista-signal-${index}`, { width: 0.3, height: 0.08, depth: 0.38 }, { x, y: height + 0.12, z }, index % 3 === 0 ? mats.accent : mats.warm, { kind: 'district-vista-signal', districtId: config.id });
    signal.rotation.y = -angle;
    structures.push(pylon, signal);
  }
  const bridgePairs = quality === 'lite' ? 1 : 2;
  for (let index = 0; index < bridgePairs; index += 1) {
    const side = index === 0 ? -1 : 1;
    const bridge = box(scene, root, `w660k-${config.id}-sky-bridge-${index}`, { width: 3.6, height: 0.12, depth: 0.26 }, { x: side * 3.1, y: 2.1 + index * 0.55, z: 3.65 }, mats.primary, { kind: 'district-sky-bridge', districtId: config.id });
    bridge.rotation.y = side * 0.22;
    structures.push(bridge);
  }
  const courierCount = quality === 'lite' ? 1 : quality === 'cinematic' ? 4 : 3;
  for (let index = 0; index < courierCount; index += 1) {
    const courier = box(scene, root, `w660k-${config.id}-courier-${index}`, { width: 0.28, height: 0.12, depth: 0.55 }, { x: 0, y: 3.3 + index * 0.42, z: 0 }, index % 2 ? mats.warm : mats.accent, { kind: 'district-aerial-courier', districtId: config.id });
    animated.push({ mesh: courier, kind: 'orbit', radius: 3.3 + index * 0.55, angle: index * 2.1, speed: (index % 2 ? -1 : 1) * (0.22 + index * 0.035), y: 3.2 + index * 0.42, zOffset: 0.7 });
    structures.push(courier);
  }
  return structures;
}

function buildGateway(scene, root, config, mats, animated) {
  const left = box(scene, root, `w660i-${config.id}-gateway-left`, { width: 0.72, height: 4.5, depth: 0.8 }, { x: -2.05, y: 2.25, z: 0.85 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const right = box(scene, root, `w660i-${config.id}-gateway-right`, { width: 0.72, height: 4.5, depth: 0.8 }, { x: 2.05, y: 2.25, z: 0.85 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const bridge = box(scene, root, `w660i-${config.id}-gateway-bridge`, { width: 4.8, height: 0.5, depth: 0.82 }, { x: 0, y: 4.05, z: 0.85 }, mats.warm, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const ring = torus(scene, root, `w660i-${config.id}-gateway-ring`, { diameter: 2.7, thickness: 0.11, tessellation: 36 }, { x: 0, y: 2.35, z: 0.45 }, { x: Math.PI / 2 }, mats.accent, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: ring, axis: 'z', speed: 0.24 });
  return [left, right, bridge, ring];
}
function buildRings(scene, root, config, mats, animated) {
  const items = [];
  for (let i = 0; i < 3; i += 1) {
    const ring = torus(scene, root, `w660i-${config.id}-orbit-${i}`, { diameter: 2.7 + i * 0.9, thickness: 0.09, tessellation: 40 }, { x: 0, y: 1.7 + i * 0.48, z: 0.8 }, { x: Math.PI / 2, y: i * 0.25 }, i === 1 ? mats.warm : mats.accent, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
    animated.push({ mesh: ring, axis: i % 2 ? 'y' : 'z', speed: 0.22 + i * 0.08 });
    items.push(ring);
  }
  items.push(cylinder(scene, root, `w660i-${config.id}-transit-core`, { height: 3.7, diameterTop: 0.48, diameterBottom: 1.15, tessellation: 20 }, { x: 0, y: 1.85, z: 0.8 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId }));
  return items;
}
function buildTheatre(scene, root, config, mats, animated) {
  const items = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = -2; column <= 2; column += 1) {
      items.push(box(scene, root, `w660i-${config.id}-seat-${row}-${column}`, { width: 0.65, height: 0.24 + row * 0.14, depth: 0.62 }, { x: column * 0.78, y: 0.12 + row * 0.07, z: 2.9 + row * 0.62 }, row === 3 ? mats.primary : mats.dark, { kind: 'theatre-tier', districtId: config.id }));
    }
  }
  const dais = cylinder(scene, root, `w660i-${config.id}-dais`, { height: 0.42, diameter: 3.2, tessellation: 36 }, { x: 0, y: 0.21, z: 0.8 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const halo = torus(scene, root, `w660i-${config.id}-receipt-halo`, { diameter: 2.15, thickness: 0.08, tessellation: 36 }, { x: 0, y: 2.45, z: 0.8 }, { x: Math.PI / 2 }, mats.warm, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: halo, axis: 'z', speed: -0.28 });
  items.push(dais, halo);
  return items;
}
function buildAtrium(scene, root, config, mats, animated) {
  const base = cylinder(scene, root, `w660i-${config.id}-atrium-base`, { height: 0.42, diameter: 5.1, tessellation: 40 }, { x: 0, y: 0.21, z: 0.9 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const sailA = box(scene, root, `w660i-${config.id}-sail-a`, { width: 0.35, height: 4.5, depth: 1.3 }, { x: -1.35, y: 2.25, z: 0.85 }, mats.accent, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  sailA.rotation.z = -0.28;
  const sailB = box(scene, root, `w660i-${config.id}-sail-b`, { width: 0.35, height: 4.5, depth: 1.3 }, { x: 1.35, y: 2.25, z: 0.85 }, mats.warm, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  sailB.rotation.z = 0.28;
  const halo = torus(scene, root, `w660i-${config.id}-capture-halo`, { diameter: 2.7, thickness: 0.08, tessellation: 40 }, { x: 0, y: 3.55, z: 0.85 }, { x: Math.PI / 2 }, mats.accent, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: halo, axis: 'z', speed: 0.3 });
  return [base, sailA, sailB, halo];
}
function buildSpire(scene, root, config, mats, animated) {
  const core = cylinder(scene, root, `w660i-${config.id}-forge-core`, { height: 5.6, diameterTop: 0.28, diameterBottom: 1.8, tessellation: 6 }, { x: 0, y: 2.8, z: 0.85 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const rings = [1.35, 2.65, 4.0].map((height, index) => {
    const ring = torus(scene, root, `w660i-${config.id}-forge-ring-${index}`, { diameter: 1.7 + index * 0.38, thickness: 0.08, tessellation: 32 }, { x: 0, y: height, z: 0.85 }, { x: Math.PI / 2 }, index === 1 ? mats.warm : mats.accent, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
    animated.push({ mesh: ring, axis: 'z', speed: (index % 2 ? -1 : 1) * (0.25 + index * 0.1) });
    return ring;
  });
  return [core, ...rings];
}
function buildCitadel(scene, root, config, mats, animated) {
  const levels = [
    { y: 0.4, width: 5.2, height: 0.8, depth: 3.6 },
    { y: 1.25, width: 3.9, height: 0.9, depth: 2.8 },
    { y: 2.15, width: 2.5, height: 0.9, depth: 2.0 }
  ];
  const items = levels.map((level, index) => box(scene, root, `w660i-${config.id}-citadel-${index}`, level, { x: 0, y: level.y, z: 0.95 }, index === 1 ? mats.primary : mats.dark, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId }));
  const crown = cylinder(scene, root, `w660i-${config.id}-command-crown`, { height: 2.7, diameterTop: 0.25, diameterBottom: 1.25, tessellation: 5 }, { x: 0, y: 3.9, z: 0.95 }, mats.warm, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const orbit = torus(scene, root, `w660i-${config.id}-command-orbit`, { diameter: 3.4, thickness: 0.08, tessellation: 40 }, { x: 0, y: 3.5, z: 0.95 }, { x: Math.PI / 2 }, mats.accent, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: orbit, axis: 'z', speed: 0.22 });
  items.push(crown, orbit);
  return items;
}
function buildCanopy(scene, root, config, mats, animated) {
  const trunk = cylinder(scene, root, `w660i-${config.id}-archive-trunk`, { height: 4.2, diameterTop: 0.45, diameterBottom: 1.4, tessellation: 12 }, { x: 0, y: 2.1, z: 0.85 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const canopy = MeshBuilder.CreateSphere(`w660i-${config.id}-archive-canopy`, { diameter: 4.6, segments: 18, slice: 0.52 }, scene);
  attach(canopy, root, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  canopy.position.copyFromFloats(0, 4.25, 0.85);
  canopy.material = mats.accent;
  canopy.scaling.y = 0.45;
  const orbit = torus(scene, root, `w660i-${config.id}-archive-index`, { diameter: 3.2, thickness: 0.07, tessellation: 36 }, { x: 0, y: 3.45, z: 0.85 }, { x: Math.PI / 2 }, mats.warm, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: orbit, axis: 'z', speed: -0.2 });
  return [trunk, canopy, orbit];
}
function buildVault(scene, root, config, mats, animated) {
  const wall = box(scene, root, `w660i-${config.id}-vault-wall`, { width: 5.2, height: 4.7, depth: 0.8 }, { x: 0, y: 2.35, z: 1.15 }, mats.dark, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const door = cylinder(scene, root, `w660i-${config.id}-vault-door`, { height: 0.42, diameter: 3.2, tessellation: 36 }, { x: 0, y: 2.25, z: 0.68 }, mats.primary, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  door.rotation.x = Math.PI / 2;
  const lock = torus(scene, root, `w660i-${config.id}-vault-lock`, { diameter: 1.75, thickness: 0.11, tessellation: 32 }, { x: 0, y: 2.25, z: 0.42 }, { x: Math.PI / 2 }, mats.warm, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: lock, axis: 'z', speed: 0.16 });
  return [wall, door, lock];
}
function buildDome(scene, root, config, mats, animated) {
  const dome = MeshBuilder.CreateSphere(`w660i-${config.id}-trade-dome`, { diameter: 5.4, segments: 24, slice: 0.5 }, scene);
  attach(dome, root, { kind: 'signature-landmark', districtId: config.id, landmarkId: config.signatureLandmarkId });
  dome.position.copyFromFloats(0, 0.1, 0.9);
  dome.scaling.y = 0.72;
  dome.material = mats.primary;
  const equator = torus(scene, root, `w660i-${config.id}-trade-equator`, { diameter: 4.7, thickness: 0.09, tessellation: 44 }, { x: 0, y: 1.55, z: 0.9 }, { x: Math.PI / 2 }, mats.accent, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  const crown = torus(scene, root, `w660i-${config.id}-trade-crown`, { diameter: 2.3, thickness: 0.08, tessellation: 36 }, { x: 0, y: 3.05, z: 0.9 }, { x: Math.PI / 2 }, mats.warm, { kind: 'signature-landmark-energy', districtId: config.id, landmarkId: config.signatureLandmarkId });
  animated.push({ mesh: equator, axis: 'z', speed: 0.13 }, { mesh: crown, axis: 'z', speed: -0.21 });
  return [dome, equator, crown];
}

const SIGNATURE_BUILDERS = Object.freeze({
  gateway: buildGateway,
  rings: buildRings,
  theatre: buildTheatre,
  atrium: buildAtrium,
  spire: buildSpire,
  citadel: buildCitadel,
  canopy: buildCanopy,
  vault: buildVault,
  dome: buildDome
});

function applyCamera(camera, playerAnchor, config) {
  if (!camera || !config) return;
  const target = playerAnchor?.position || new Vector3(config.arrival.x, 0, config.arrival.z);
  try { camera.target.copyFromFloats(target.x, config.camera.targetY, target.z); } catch {}
  for (const key of ['alpha', 'beta', 'radius']) {
    if (Number.isFinite(config.camera[key]) && key in camera) camera[key] = config.camera[key];
  }
}

export function createEonCityW660iDistrictComposition({
  scene,
  camera = null,
  playerAnchor = null,
  quality = 'balanced',
  reducedMotion = false,
  onStatus = () => {}
} = {}) {
  if (!scene) throw new Error('w660i-district-composition-scene-required');
  const validation = validateEonCityW660iDistrictConfigs();
  if (!validation.ok) throw new Error(`w660i-district-config-invalid:${validation.errors.join(',')}`);
  let active = null;
  let retiring = null;
  let disposed = false;
  let elapsed = 0;
  let transitionElapsed = 0;
  const transitions = [];

  const disposeRecord = (record, reason = 'district-switch') => {
    if (!record) return;
    try { record.root.dispose(false, true); } catch {}
    try { record.hemi.dispose(); } catch {}
    try { record.keyLight.dispose(); } catch {}
    try { record.rimLight.dispose(); } catch {}
    transitions.push(freeze({ type: 'unload', districtId: record.config.id, reason, at: Date.now() }));
  };

  const disposeAll = (reason = 'district-switch') => {
    disposeRecord(retiring, reason);
    disposeRecord(active, reason);
    retiring = null;
    active = null;
  };

  const setRecordVisibility = (record, ratio = 1) => {
    if (!record) return;
    const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
    for (const entry of record.fadeMeshes || []) {
      if (!entry.mesh || entry.mesh.isDisposed?.()) continue;
      entry.mesh.visibility = entry.baseVisibility * safeRatio;
    }
    record.hemi.intensity = record.baseLight.hemi * safeRatio;
    record.keyLight.intensity = record.baseLight.key * safeRatio;
    record.rimLight.intensity = record.baseLight.rim * safeRatio;
  };

  const retireActive = () => {
    if (!active) return;
    if (retiring) disposeRecord(retiring, 'district-transition-superseded');
    retiring = active;
    for (const mesh of retiring.root.getChildMeshes?.(false) || []) mesh.isPickable = false;
    active = null;
    transitionElapsed = 0;
    transitions.push(freeze({ type: 'overlap-start', districtId: retiring.config.id, at: Date.now() }));
  };

  const enterDistrict = (districtId = '', { reason = 'explicit-district-transition' } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'composition-disposed' });
    const config = getEonCityW660iDistrictConfig(districtId);
    if (!config) return freeze({ ok: false, reason: 'unknown-district', districtId: String(districtId || '') });
    if (active?.config.id === config.id) {
      applyCamera(camera, playerAnchor, config);
      return freeze({ ok: true, cached: true, districtId: config.id, summary: getSummary() });
    }
    retireActive();
    const worldPose = getEonCityW689DistrictWorldPose(config.id) || getEonCityW688DistrictWorldPose(config.id) || getEonCityW675DistrictWorldPose(config.id);
    const worldCenter = worldPose?.center || config.center;
    const root = new TransformNode(`w660i-district-root-${config.id}`, scene);
    root.position.copyFromFloats(worldCenter.x, 0, worldCenter.z);
    root.metadata = {
      kind: 'w660i-active-district-composition', districtId: config.id,
      signatureLandmarkId: config.signatureLandmarkId, activeAssetGroupId: config.activeAssetGroupId,
      terminalIds: [...config.terminals], skylineIds: [...config.skyline], spatialModel: worldPose?.spatialModel || 'legacy-sanctum', ownsRenderLoop: false, localOnly: true
    };
    const mats = {
      floor: material(scene, `w660i-${config.id}-floor-mat`, config.palette.primary, { emissive: 0.035, alpha: 0.94, metallic: true }),
      dark: material(scene, `w660i-${config.id}-dark-mat`, config.palette.sky, { emissive: 0.02, metallic: true }),
      primary: material(scene, `w660i-${config.id}-primary-mat`, config.palette.primary, { emissive: 0.1, metallic: true }),
      accent: material(scene, `w660i-${config.id}-accent-mat`, config.palette.accent, { emissive: 0.55, alpha: quality === 'lite' ? 0.82 : 0.95 }),
      warm: material(scene, `w660i-${config.id}-warm-mat`, config.palette.warm, { emissive: 0.44, alpha: 0.94 })
    };
    const animated = [];
    buildPlatform(scene, root, config, mats);
    const terminals = buildTerminals(scene, root, config, mats);
    const skyline = quality === 'lite' ? [] : buildSkyline(scene, root, config, mats);
    const vista = buildDistrictVista(scene, root, config, mats, animated, quality);
    const signatureBuilder = SIGNATURE_BUILDERS[config.signature] || buildGateway;
    const signatureMeshes = signatureBuilder(scene, root, config, mats, animated);

    const hemi = new HemisphericLight(`w660i-${config.id}-ambient`, new Vector3(0.2, 1, -0.15), scene);
    hemi.intensity = quality === 'lite' ? 0.68 : quality === 'cinematic' ? 0.96 : 0.84;
    hemi.diffuse = hex3(config.palette.accent).scale(0.58).add(hex3('#d8e7ff').scale(0.38));
    hemi.groundColor = hex3(config.palette.primary).scale(0.28);
    const keyLight = new PointLight(`w660i-${config.id}-key`, new Vector3(worldCenter.x, 5.5, worldCenter.z - 1), scene);
    keyLight.diffuse = hex3(config.palette.warm);
    keyLight.intensity = quality === 'lite' ? 0.92 : quality === 'cinematic' ? 1.75 : 1.45;
    keyLight.range = 18;
    const rimLight = new PointLight(`w660k-${config.id}-rim`, new Vector3(worldCenter.x - 4.2, 3.4, worldCenter.z + 3.8), scene);
    rimLight.diffuse = hex3(config.palette.accent);
    rimLight.intensity = quality === 'lite' ? 0.55 : 1.05;
    rimLight.range = 15;

    scene.clearColor = hex4(config.palette.sky, 1);
    scene.fogMode = scene.constructor.FOGMODE_EXP2 ?? 2;
    scene.fogColor = hex3(config.palette.fog);
    scene.fogDensity = quality === 'lite' ? 0.007 : quality === 'cinematic' ? 0.012 : 0.0095;
    applyCamera(camera, playerAnchor, config);
    const fadeMeshes = (root.getChildMeshes?.(false) || []).map((mesh) => freeze({ mesh, baseVisibility: Number.isFinite(Number(mesh.visibility)) ? Number(mesh.visibility) : 1 }));
    active = {
      config, root, mats, animated, terminals, skyline, vista, signatureMeshes, hemi, keyLight, rimLight,
      fadeMeshes,
      baseLight: freeze({ hemi: hemi.intensity, key: keyLight.intensity, rim: rimLight.intensity }),
      enteredAt: Date.now()
    };
    if (retiring && !reducedMotion) setRecordVisibility(active, 0.16);
    transitions.push(freeze({ type: 'enter', districtId: config.id, landmarkId: config.signatureLandmarkId, assetGroupId: config.activeAssetGroupId, reason, at: active.enteredAt }));
    onStatus(`${config.label} composition is active: ${config.signatureLandmarkId}, ${config.terminals.length} productive terminals, layered skyline and animated district traffic.`);
    return freeze({ ok: true, districtId: config.id, landmarkId: config.signatureLandmarkId, assetGroupId: config.activeAssetGroupId, summary: getSummary() });
  };

  const update = (deltaSeconds = 0.016) => {
    if ((!active && !retiring) || disposed) return;
    const delta = Math.max(0, Math.min(0.1, Number(deltaSeconds) || 0.016));
    elapsed += delta;
    const animateRecord = (record) => {
      if (!record || reducedMotion) return;
      for (const item of record.animated) {
        if (!item?.mesh || item.mesh.isDisposed?.()) continue;
        if (item.kind === 'orbit') {
          item.angle += delta * item.speed;
          item.mesh.position.x = Math.sin(item.angle) * item.radius;
          item.mesh.position.z = Math.cos(item.angle) * item.radius + Number(item.zOffset || 0);
          item.mesh.position.y = item.y + Math.sin(elapsed * 1.8 + item.angle) * 0.12;
          item.mesh.rotation.y = item.angle + Math.PI / 2;
        } else {
          item.mesh.rotation[item.axis] += delta * item.speed;
        }
      }
    };
    animateRecord(active);
    animateRecord(retiring);
    if (retiring) {
      transitionElapsed += reducedMotion ? DISTRICT_OVERLAP_SECONDS : delta;
      const progress = Math.max(0, Math.min(1, transitionElapsed / DISTRICT_OVERLAP_SECONDS));
      setRecordVisibility(retiring, 1 - progress);
      setRecordVisibility(active, reducedMotion ? 1 : 0.16 + progress * 0.84);
      if (progress >= 1) {
        const retiredId = retiring.config.id;
        disposeRecord(retiring, 'district-overlap-complete');
        retiring = null;
        transitions.push(freeze({ type: 'overlap-complete', districtId: retiredId, activeDistrictId: active?.config.id || null, at: Date.now() }));
      }
    } else if (active) {
      active.keyLight.intensity += (1.25 + Math.sin(elapsed * 1.4) * 0.16 - active.keyLight.intensity) * Math.min(1, delta * 3);
      active.rimLight.intensity += (0.92 + Math.sin(elapsed * 1.1 + 1.3) * 0.1 - active.rimLight.intensity) * Math.min(1, delta * 2.4);
    }
  };

  const getSummary = () => freeze({
    schema: EON_CITY_W660I_DISTRICT_COMPOSITION_SCHEMA,
    activeDistrictId: active?.config.id || null,
    activeLandmarkId: active?.config.signatureLandmarkId || null,
    activeAssetGroupId: active?.config.activeAssetGroupId || null,
    retiringDistrictId: retiring?.config.id || null,
    overlapProgress: retiring ? Math.max(0, Math.min(1, transitionElapsed / DISTRICT_OVERLAP_SECONDS)) : 1,
    terminalIds: freeze([...(active?.config.terminals || [])]),
    terminalCount: active?.config.terminals.length || 0,
    skylineIds: freeze([...(active?.config.skyline || [])]),
    skylineMeshCount: active?.skyline.length || 0,
    signatureMeshCount: active?.signatureMeshes.length || 0,
    vistaMeshCount: active?.vista.length || 0,
    animatedElementCount: active?.animated.length || 0,
    districtLightCount: active ? 3 : 0,
    quality,
    reducedMotion: Boolean(reducedMotion),
    residentDistrictCount: Number(Boolean(active)) + Number(Boolean(retiring)),
    maxResidentDistrictCount: 2,
    allDistrictCount: EON_CITY_W660I_DISTRICTS.length,
    ownsCanvas: false,
    ownsRenderLoop: false,
    localOnly: true,
    transitions: freeze(transitions.slice(-18)),
    disposed
  });

  return freeze({
    enterDistrict,
    update,
    getSummary,
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      disposeAll('composition-dispose');
      return getSummary();
    }
  });
}

export default freeze({
  EON_CITY_W660I_DISTRICT_COMPOSITION_SCHEMA,
  createEonCityW660iDistrictComposition
});
