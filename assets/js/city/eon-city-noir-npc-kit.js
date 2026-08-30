/**
 * W456.1 — original EON Noir readable guide cast.
 *
 * This module turns the first City guide cast from generic geometric markers
 * into distinct, source-controlled, readable procedural characters. It is not
 * a substitute for future licensed/rigged character assets: there are no GLB
 * downloads, no facial capture, no telemetry, no private data reads and no
 * fabricated task/activity state.
 */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

const freeze = (value) => Object.freeze(value);
const color = (hex) => Color3.FromHexString(hex);

export const EON_NOIR_NPC_KIT_SCHEMA = 'eon.city.noir-npc-kit.w456.1.v1';
export const EON_NOIR_NPC_KIT_VERSION = 1;

const ARCHETYPES = Object.freeze([
  freeze({
    roleId: 'builder-guide',
    castName: 'Builder',
    visualRole: 'workshop guide',
    silhouette: 'tool-harness artisan with asymmetric shoulder fins',
    faceStyle: 'warm visor with twin eye lamps and mouth cue',
    detail: freeze(['tool-harness', 'shoulder-fins', 'utility-pack']),
    truthRule: 'A local route guide only. It never creates projects, sends work or claims a build finished.'
  }),
  freeze({
    roleId: 'archivist-guide',
    castName: 'Curator',
    visualRole: 'library guide',
    silhouette: 'layered archive mantle beneath a quiet halo',
    faceStyle: 'soft visor with twin eye lamps and mouth cue',
    detail: freeze(['archive-halo', 'mantle-panels', 'memory-badge']),
    truthRule: 'A local route guide only. It never reads files, chat or workspace data inside City.'
  }),
  freeze({
    roleId: 'realm-keeper',
    castName: 'Guardian',
    visualRole: 'Realm Studio guide',
    silhouette: 'split ceremonial mantle with a protected beacon',
    faceStyle: 'shielded visor with twin eye lamps and mouth cue',
    detail: freeze(['guardian-mantle', 'beacon-ring', 'door-key']),
    truthRule: 'A local identity guide only. It never publishes a Realm or claims a public profile exists.'
  }),
  freeze({
    roleId: 'local-ai-observer',
    castName: 'Device Technician',
    visualRole: 'Local AI orientation guide',
    silhouette: 'technical coat with headset orbit and local diagnostic core',
    faceStyle: 'technical visor with twin eye lamps and mouth cue',
    detail: freeze(['headset-orbit', 'local-core', 'device-satchel']),
    truthRule: 'A local setup guide only. It never probes a model, device or endpoint until the user acts in Local AI.'
  }),
  freeze({
    roleId: 'review-steward',
    castName: 'Support Navigator',
    visualRole: 'review boundary guide',
    silhouette: 'high-collar steward with a deliberate approval badge',
    faceStyle: 'calm visor with twin eye lamps and mouth cue',
    detail: freeze(['review-badge', 'collar-ring', 'return-marker']),
    truthRule: 'A review guide only. City can prepare a route but it cannot open or confirm a product action without a visible user choice.'
  })
]);

const ARCHETYPE_BY_ROLE = new Map(ARCHETYPES.map((entry) => [entry.roleId, entry]));
const QUALITY_ORDER = Object.freeze({ silhouette: 0, lite: 0, balanced: 1, cinematic: 2 });

function normalizeQuality(value = 'balanced') {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.hasOwn(QUALITY_ORDER, normalized) ? normalized : 'balanced';
}

function resolveDetail(quality = 'balanced', explicit = '') {
  const requested = String(explicit || '').trim().toLowerCase();
  if (requested === 'silhouette') return 'silhouette';
  return normalizeQuality(quality) === 'lite' ? 'silhouette' : 'readable';
}

export function getEonNoirGuideArchetypes() {
  return ARCHETYPES;
}

export function getEonNoirGuideArchetype(roleId = '') {
  return ARCHETYPE_BY_ROLE.get(String(roleId || '').trim()) || null;
}

/** A render-independent plan keeps the artistic identity reviewable and testable. */
export function getEonNoirGuidePlan({ roleId = '', quality = 'balanced', detail = '' } = {}) {
  const archetype = getEonNoirGuideArchetype(roleId);
  if (!archetype) return null;
  const resolvedQuality = normalizeQuality(quality);
  const resolvedDetail = resolveDetail(resolvedQuality, detail);
  return freeze({
    schema: EON_NOIR_NPC_KIT_SCHEMA,
    roleId: archetype.roleId,
    castName: archetype.castName,
    visualRole: archetype.visualRole,
    silhouette: archetype.silhouette,
    faceStyle: resolvedDetail === 'readable' ? archetype.faceStyle : 'silhouette-only',
    readableFace: resolvedDetail === 'readable',
    quality: resolvedQuality,
    detail: resolvedDetail,
    accessories: resolvedDetail === 'readable' ? archetype.detail : freeze([archetype.detail[0]]),
    originalProcedural: true,
    riggedAsset: false,
    remoteAssets: false,
    remoteTelemetry: false,
    privateDataRead: false,
    taskStatusFabricated: false,
    truthRule: archetype.truthRule
  });
}

function makeMaterial(scene, name, { base, glow = '', intensity = 0, metallic = .36, roughness = .42, alpha = 1 } = {}) {
  const material = new PBRMetallicRoughnessMaterial(name, scene);
  material.baseColor = color(base || '#13243b');
  material.emissiveColor = glow ? color(glow).scale(Math.max(0, intensity)) : Color3.Black();
  material.metallic = metallic;
  material.roughness = roughness;
  material.alpha = alpha;
  material.backFaceCulling = alpha >= .98;
  return material;
}

function child(root, mesh, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, material = null } = {}) {
  mesh.parent = root;
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  if (material) mesh.material = material;
  mesh.isPickable = false;
  return mesh;
}

function buildMaterials(scene, id, accent) {
  return freeze({
    suit: makeMaterial(scene, `${id}-suit`, { base: '#0d1c31', glow: '#143b56', intensity: .2, metallic: .55, roughness: .28 }),
    fabric: makeMaterial(scene, `${id}-fabric`, { base: '#182b41', glow: '#0f263a', intensity: .12, metallic: .12, roughness: .66 }),
    skin: makeMaterial(scene, `${id}-face`, { base: '#2a4966', glow: '#4c88a8', intensity: .16, metallic: .18, roughness: .46 }),
    accent: makeMaterial(scene, `${id}-accent`, { base: accent, glow: accent, intensity: 1.06, metallic: .2, roughness: .15 }),
    eye: makeMaterial(scene, `${id}-eye`, { base: '#dffaff', glow: '#dffaff', intensity: 1.12, metallic: .08, roughness: .1 }),
    dark: makeMaterial(scene, `${id}-dark`, { base: '#081321', glow: '#112b42', intensity: .1, metallic: .48, roughness: .31 })
  });
}

function addReadableHead(scene, root, id, materials, detail) {
  const head = child(root, MeshBuilder.CreateSphere(`${id}-head`, { diameter: .58, segments: detail === 'silhouette' ? 8 : 14 }, scene), { y: 1.74, material: materials.skin });
  const helmet = child(root, MeshBuilder.CreateSphere(`${id}-helmet`, { diameter: .64, segments: detail === 'silhouette' ? 8 : 14, slice: .56 }, scene), { y: 1.83, z: .02, material: materials.dark });
  const visor = child(root, MeshBuilder.CreateBox(`${id}-visor`, { width: .46, height: .13, depth: .06 }, scene), { y: 1.78, z: -.283, material: materials.accent });
  const parts = [head, helmet, visor];
  if (detail === 'readable') {
    for (const side of [-1, 1]) {
      parts.push(child(root, MeshBuilder.CreateSphere(`${id}-eye-${side}`, { diameter: .075, segments: 8 }, scene), { x: side * .125, y: 1.79, z: -.32, material: materials.eye }));
    }
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-mouth-cue`, { diameter: .16, thickness: .018, tessellation: 12 }, scene), { y: 1.64, z: -.305, rx: Math.PI / 2, material: materials.accent }));
  }
  return parts;
}

function addBaseFigure(scene, root, id, materials, detail) {
  const parts = [];
  parts.push(child(root, MeshBuilder.CreateCylinder(`${id}-torso`, { height: 1.0, diameterTop: .48, diameterBottom: .66, tessellation: detail === 'silhouette' ? 8 : 12 }, scene), { y: .94, material: materials.suit }));
  parts.push(child(root, MeshBuilder.CreateBox(`${id}-chest`, { width: .57, height: .38, depth: .18 }, scene), { y: 1.08, z: -.27, material: materials.fabric }));
  parts.push(child(root, MeshBuilder.CreateTorus(`${id}-waist-ring`, { diameter: .58, thickness: .032, tessellation: 16 }, scene), { y: .54, rx: Math.PI / 2, material: materials.accent }));
  for (const side of [-1, 1]) {
    parts.push(child(root, MeshBuilder.CreateCylinder(`${id}-arm-${side}`, { height: .68, diameter: .15, tessellation: 8 }, scene), { x: side * .43, y: 1.02, rz: side * -.13, material: materials.fabric }));
    parts.push(child(root, MeshBuilder.CreateCylinder(`${id}-leg-${side}`, { height: .66, diameter: .20, tessellation: 8 }, scene), { x: side * .18, y: .25, material: materials.dark }));
    parts.push(child(root, MeshBuilder.CreateBox(`${id}-boot-${side}`, { width: .25, height: .12, depth: .4 }, scene), { x: side * .18, y: .045, z: -.08, material: materials.suit }));
  }
  parts.push(...addReadableHead(scene, root, id, materials, detail));
  return parts;
}

function addRoleAccessories(scene, root, id, roleId, materials, detail) {
  const parts = [];
  if (roleId === 'builder-guide') {
    parts.push(child(root, MeshBuilder.CreateBox(`${id}-utility-pack`, { width: .46, height: .52, depth: .16 }, scene), { y: .92, z: .30, material: materials.accent }));
    for (const side of [-1, 1]) parts.push(child(root, MeshBuilder.CreateCylinder(`${id}-shoulder-fin-${side}`, { height: .38, diameterTop: .05, diameterBottom: .18, tessellation: 4 }, scene), { x: side * .36, y: 1.46, rz: side * -.42, material: materials.accent }));
  } else if (roleId === 'archivist-guide') {
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-archive-halo`, { diameter: .76, thickness: .032, tessellation: 20 }, scene), { y: 2.06, rx: Math.PI / 2, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreatePlane(`${id}-mantle`, { width: .88, height: .86 }, scene), { y: .92, z: .27, material: materials.fabric }));
  } else if (roleId === 'realm-keeper') {
    for (const side of [-1, 1]) parts.push(child(root, MeshBuilder.CreateCylinder(`${id}-mantle-wing-${side}`, { height: .82, diameterTop: .08, diameterBottom: .32, tessellation: 3 }, scene), { x: side * .33, y: .95, rz: side * -.28, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-beacon-ring`, { diameter: .56, thickness: .035, tessellation: 18 }, scene), { y: 1.18, z: -.32, rx: Math.PI / 2, material: materials.accent }));
  } else if (roleId === 'local-ai-observer') {
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-headset`, { diameter: .70, thickness: .026, tessellation: 18 }, scene), { y: 1.79, rx: Math.PI / 2, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreatePolyhedron(`${id}-local-core`, { type: 1, size: .16 }, scene), { y: 2.15, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreateBox(`${id}-device-satchel`, { width: .28, height: .42, depth: .15 }, scene), { x: .36, y: .72, z: .10, material: materials.fabric }));
  } else if (roleId === 'review-steward') {
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-collar`, { diameter: .64, thickness: .045, tessellation: 20 }, scene), { y: 1.44, rx: Math.PI / 2, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreateBox(`${id}-review-badge`, { width: .30, height: .16, depth: .04 }, scene), { y: 1.08, z: -.37, material: materials.accent }));
    parts.push(child(root, MeshBuilder.CreateTorus(`${id}-return-marker`, { diameter: .44, thickness: .025, tessellation: 16 }, scene), { y: .28, rx: Math.PI / 2, material: materials.accent }));
  }
  if (detail === 'silhouette') return parts.slice(0, 1);
  return parts;
}

/**
 * Render a guide. Motion remains under the scene caller so this factory cannot
 * imply autonomy, background work, navigation or any external action.
 */
export function createEonNoirGuideNpc(scene, { id = '', roleId = '', accent = '#7cf9ff', parent = null, position = null, heading = 0, quality = 'balanced', detail = '' } = {}) {
  const plan = getEonNoirGuidePlan({ roleId, quality, detail });
  if (!scene || !plan) return null;
  const safeId = String(id || `guide-${plan.roleId}`).replace(/[^a-z0-9-]/gi, '-').slice(0, 72) || `guide-${plan.roleId}`;
  const root = new TransformNode(safeId, scene);
  if (parent) root.parent = parent;
  if (position && Number.isFinite(Number(position.x)) && Number.isFinite(Number(position.z))) root.position.set(Number(position.x), Number(position.y) || 0, Number(position.z));
  root.rotation.y = Number.isFinite(Number(heading)) ? Number(heading) : 0;
  const materials = buildMaterials(scene, safeId, accent);
  const parts = addBaseFigure(scene, root, safeId, materials, plan.detail);
  parts.push(...addRoleAccessories(scene, root, safeId, plan.roleId, materials, plan.detail));
  root.metadata = freeze({
    kind: 'eon-noir-readable-guide',
    roleId: plan.roleId,
    castName: plan.castName,
    visualRole: plan.visualRole,
    readableFace: plan.readableFace,
    originalProcedural: true,
    riggedAsset: false,
    localOnly: true,
    remoteAssets: false,
    remoteTelemetry: false,
    privateDataRead: false,
    taskStatusFabricated: false,
    truthRule: plan.truthRule
  });
  return freeze({ root, plan, parts: freeze(parts), localOnly: true, originalProcedural: true, riggedAsset: false });
}

export function getEonNoirNpcKitSummary() {
  return freeze({
    schema: EON_NOIR_NPC_KIT_SCHEMA,
    version: EON_NOIR_NPC_KIT_VERSION,
    guideCount: ARCHETYPES.length,
    castNames: freeze(ARCHETYPES.map((entry) => entry.castName)),
    readableFacesAtBalanced: ARCHETYPES.length,
    qualityProfiles: freeze(['silhouette', 'balanced', 'cinematic']),
    originalProcedural: true,
    riggedAssets: false,
    remoteAssets: false,
    privateDataRead: false,
    taskStatusFabricated: false,
    deviceVisualProof: false,
    finalNpcCertification: false
  });
}

export function validateEonNoirNpcKit() {
  const errors = [];
  const seen = new Set();
  for (const archetype of ARCHETYPES) {
    if (!/^[a-z0-9-]{4,64}$/.test(archetype.roleId)) errors.push(`Invalid EON Noir guide role: ${archetype.roleId}`);
    if (seen.has(archetype.roleId)) errors.push(`Duplicate EON Noir guide role: ${archetype.roleId}`);
    seen.add(archetype.roleId);
    if (!archetype.castName || !archetype.silhouette || !archetype.faceStyle || !archetype.truthRule) errors.push(`Incomplete EON Noir guide archetype: ${archetype.roleId}`);
    if (!Array.isArray(archetype.detail) || archetype.detail.length < 3) errors.push(`Guide detail kit is incomplete: ${archetype.roleId}`);
  }
  if (!ARCHETYPE_BY_ROLE.has('builder-guide') || !ARCHETYPE_BY_ROLE.has('review-steward')) errors.push('Builder and Support Navigator guide archetypes are required.');
  return freeze({ schema: EON_NOIR_NPC_KIT_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}
