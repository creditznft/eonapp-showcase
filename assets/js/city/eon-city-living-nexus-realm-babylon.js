/**
 * W660V — authored Nexus Realm renderer for the existing Babylon scene.
 *
 * This renderer owns only a TransformNode subtree. It never creates an Engine,
 * Scene, canvas, render loop, network request, project/task store or assistant.
 */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { resolveNearestEonCityLivingNexusRealmFeature, validateEonCityLivingNexusRealmPlan } from './eon-city-living-nexus-realms.js';

export const EON_CITY_LIVING_NEXUS_REALM_BABYLON_SCHEMA = 'eon.city.living-nexus-realm-babylon.w660v.v1';
const freeze = (value) => Object.freeze(value);

function color(value, fallback = '#75f7cf') {
  try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); }
}

function material(scene, name, { diffuse, emissive, intensity = 0.4, alpha = 1 } = {}) {
  const next = new StandardMaterial(name, scene);
  next.diffuseColor = color(diffuse, '#101827');
  next.emissiveColor = color(emissive, '#75f7cf').scale(Math.max(0, Number(intensity) || 0));
  next.specularColor = Color3.Black();
  next.alpha = Math.max(0.04, Math.min(1, Number(alpha) || 1));
  next.backFaceCulling = next.alpha >= 0.98;
  return next;
}

function dispose(node) {
  try { node?.dispose?.(false, false); } catch { try { node?.dispose?.(); } catch {} }
}

function safeMaterialDispose(value) {
  try { value?.dispose?.(); } catch {}
}

function createPathSegment(scene, parent, from, to, mat, index) {
  const dx = Number(to.x) - Number(from.x);
  const dz = Number(to.z) - Number(from.z);
  const length = Math.max(0.5, Math.hypot(dx, dz));
  const mesh = MeshBuilder.CreateBox(`w660v-realm-route-${index}`, { width: 1.15, depth: length, height: 0.055 }, scene);
  mesh.parent = parent;
  mesh.position.set((Number(from.x) + Number(to.x)) / 2, 0.02, (Number(from.z) + Number(to.z)) / 2);
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.material = mat;
  mesh.isPickable = false;
  mesh.metadata = freeze({ kind: 'living-nexus-realm-safe-route', routeIndex: index, automaticNavigation: false, localOnly: true });
  return mesh;
}

function createArch(scene, parent, landmark, materials) {
  const root = new TransformNode(`w660v-${landmark.id}`, scene);
  root.parent = parent;
  root.position.set(landmark.x, 0, landmark.z);
  const scale = Number(landmark.scale || 1);
  const left = MeshBuilder.CreateBox(`${landmark.id}-left`, { width: 0.35 * scale, height: 3 * scale, depth: 0.5 * scale }, scene);
  left.parent = root; left.position.set(-1.05 * scale, 1.5 * scale, 0); left.material = materials.structure;
  const right = left.clone(`${landmark.id}-right`); right.parent = root; right.position.x = 1.05 * scale;
  const crown = MeshBuilder.CreateBox(`${landmark.id}-crown`, { width: 2.45 * scale, height: 0.32 * scale, depth: 0.55 * scale }, scene);
  crown.parent = root; crown.position.set(0, 2.85 * scale, 0); crown.material = materials.accent;
  return root;
}

function createLandmark(scene, parent, landmark, materials, animatedNodes) {
  if (landmark.kind === 'arch') return createArch(scene, parent, landmark, materials);
  const root = new TransformNode(`w660v-${landmark.id}`, scene);
  root.parent = parent;
  root.position.set(landmark.x, 0, landmark.z);
  const scale = Number(landmark.scale || 1);
  if (['orb', 'crown'].includes(landmark.kind)) {
    const orb = MeshBuilder.CreateSphere(`${landmark.id}-orb`, { diameter: 2.1 * scale, segments: 20 }, scene);
    orb.parent = root; orb.position.y = Number(landmark.y || 2.2); orb.material = materials.accent;
    const ring = MeshBuilder.CreateTorus(`${landmark.id}-ring`, { diameter: 3 * scale, thickness: 0.09 * scale, tessellation: 32 }, scene);
    ring.parent = root; ring.position.y = orb.position.y; ring.rotation.x = Math.PI / 2.7; ring.material = materials.signal;
    animatedNodes.push(freeze({ node: ring, kind: 'ring', phase: 0.7 }));
  } else if (['ring'].includes(landmark.kind)) {
    const ring = MeshBuilder.CreateTorus(`${landmark.id}-ring`, { diameter: 3.4 * scale, thickness: 0.16 * scale, tessellation: 36 }, scene);
    ring.parent = root; ring.position.y = Number(landmark.y || 2.4); ring.rotation.y = Math.PI / 2; ring.material = materials.accent;
    const fragment = MeshBuilder.CreateBox(`${landmark.id}-fragment`, { width: 0.35, height: 2.6, depth: 0.35 }, scene);
    fragment.parent = root; fragment.position.set(1.4, 1.3, 0.2); fragment.rotation.z = 0.28; fragment.material = materials.secondary;
    animatedNodes.push(freeze({ node: ring, kind: 'ring', phase: 1.3 }));
  } else if (['dais'].includes(landmark.kind)) {
    const dais = MeshBuilder.CreateCylinder(`${landmark.id}-dais`, { diameter: 3 * scale, height: 0.35 * scale, tessellation: 24 }, scene);
    dais.parent = root; dais.position.y = 0.18; dais.material = materials.structure;
    const signal = MeshBuilder.CreateCylinder(`${landmark.id}-signal`, { diameter: 0.14, height: 2.2, tessellation: 12 }, scene);
    signal.parent = root; signal.position.y = 1.25; signal.material = materials.signal;
  } else {
    const core = MeshBuilder.CreateBox(`${landmark.id}-core`, { width: 1.65 * scale, height: 4.2 * scale, depth: 1.65 * scale }, scene);
    core.parent = root; core.position.y = Number(landmark.y || 2.2); core.material = landmark.kind === 'furnace' ? materials.secondary : materials.structure;
    const ring = MeshBuilder.CreateTorus(`${landmark.id}-halo`, { diameter: 2.55 * scale, thickness: 0.1, tessellation: 28 }, scene);
    ring.parent = root; ring.position.y = core.position.y; ring.rotation.x = Math.PI / 2; ring.material = materials.accent;
    animatedNodes.push(freeze({ node: ring, kind: 'ring', phase: 1.9 }));
  }
  return root;
}

function interpolatePath(path = [], phase = 0) {
  if (!Array.isArray(path) || path.length < 2) return { x: 0, z: 0 };
  const wrapped = ((Number(phase) % 1) + 1) % 1;
  const scaled = wrapped * path.length;
  const index = Math.floor(scaled) % path.length;
  const nextIndex = (index + 1) % path.length;
  const local = scaled - Math.floor(scaled);
  const from = path[index];
  const to = path[nextIndex];
  return {
    x: Number(from.x || 0) + (Number(to.x || 0) - Number(from.x || 0)) * local,
    z: Number(from.z || 0) + (Number(to.z || 0) - Number(from.z || 0)) * local
  };
}

function createFunctionalSpecialist(scene, parent, plan, materials, animatedNodes, featureNodes, collisionVolumes) {
  const specialist = plan.specialist;
  if (!specialist) return null;
  const root = new TransformNode(`w660x-${plan.id}-${specialist.id}`, scene);
  root.parent = parent;
  root.position.set(Number(specialist.x || 0), 0, Number(specialist.z || 0));
  const body = MeshBuilder.CreateCapsule(`w660x-${specialist.id}-body`, { height: 1.55, radius: 0.3, tessellation: 12 }, scene);
  body.parent = root; body.position.y = 0.82; body.material = materials.structure; body.isPickable = false;
  const head = MeshBuilder.CreateSphere(`w660x-${specialist.id}-head`, { diameter: 0.48, segments: 12 }, scene);
  head.parent = root; head.position.y = 1.72; head.material = materials.accent; head.isPickable = false;
  const halo = MeshBuilder.CreateTorus(`w660x-${specialist.id}-halo`, { diameter: 0.86, thickness: 0.055, tessellation: 24 }, scene);
  halo.parent = root; halo.position.y = 1.76; halo.rotation.x = Math.PI / 2; halo.material = materials.signal; halo.isPickable = false;
  root.metadata = freeze({ kind: 'living-nexus-realm-functional-specialist', realmId: plan.id, specialistId: specialist.id, label: specialist.label, role: specialist.role, reviewFirst: true, automaticExecution: false, privateContentStored: false, localOnly: true });
  animatedNodes.push(freeze({ node: root, kind: 'specialist', baseY: 0, phase: 0.4, originX: root.position.x, originZ: root.position.z, motionEnabled: specialist.motionEnabled === true }));
  animatedNodes.push(freeze({ node: halo, kind: 'ring', phase: 0.4 }));
  featureNodes.push(freeze({ kind: 'functional-specialist', id: specialist.id, label: specialist.label, role: specialist.role, x: root.position.x, y: 0, z: root.position.z }));
  collisionVolumes.push(freeze({ id: specialist.id, type: 'circle', x: root.position.x, z: root.position.z, radius: 0.52, localOnly: true }));
  return root;
}

function createMovementSystem(scene, parent, plan, materials, animatedNodes) {
  const system = plan.movementSystem;
  if (!system || !Array.isArray(system.path) || system.path.length < 2) return [];
  const nodes = [];
  const count = plan.quality === 'cinematic' ? 3 : plan.quality === 'balanced' ? 2 : 1;
  for (let index = 0; index < count; index += 1) {
    const node = MeshBuilder.CreateSphere(`w660x-${plan.id}-${system.id}-${index + 1}`, { diameter: 0.34 + index * 0.04, segments: 10 }, scene);
    node.parent = parent; node.material = index % 2 ? materials.secondary : materials.signal; node.isPickable = false;
    const start = interpolatePath(system.path, index / count);
    node.position.set(start.x, 1.45 + index * 0.16, start.z);
    node.metadata = freeze({ kind: 'living-nexus-realm-movement-system', realmId: plan.id, movementId: system.id, movementKind: system.kind, label: system.label, localVisualOnly: true, automaticNavigation: false, reducedEffectsFallback: system.reducedEffectsFallback });
    animatedNodes.push(freeze({ node, kind: 'path', path: system.path, periodMs: system.periodMs, offset: index / count, baseY: node.position.y, motionEnabled: system.motionEnabled === true }));
    nodes.push(node);
  }
  return nodes;
}

export function createEonCityLivingNexusRealmBabylonRenderer({ scene, parent = null } = {}) {
  if (!scene) throw new Error('living-nexus-realm-scene-required');
  const host = new TransformNode('w660v-living-nexus-realm-root', scene);
  host.parent = parent || null;
  host.setEnabled(false);
  let activePlan = null;
  let contentRoot = new TransformNode('w660v-living-nexus-realm-content', scene);
  contentRoot.parent = host;
  let materials = [];
  let animatedNodes = [];
  let collisionVolumes = [];
  let featureNodes = [];
  let disposed = false;

  const clear = () => {
    dispose(contentRoot);
    for (const entry of materials) safeMaterialDispose(entry);
    materials = [];
    animatedNodes = [];
    collisionVolumes = [];
    featureNodes = [];
    contentRoot = new TransformNode('w660v-living-nexus-realm-content', scene);
    contentRoot.parent = host;
  };

  const render = (plan) => {
    if (disposed) return freeze({ ok: false, reason: 'disposed' });
    const validation = validateEonCityLivingNexusRealmPlan(plan);
    if (!validation.ok) return freeze({ ok: false, reason: 'realm-plan-invalid', errors: validation.errors });
    clear();
    activePlan = plan;
    const palette = plan.palette;
    const mats = {
      floor: material(scene, `w660v-${plan.id}-floor`, { diffuse: palette.floor, emissive: palette.accent, intensity: 0.08 }),
      structure: material(scene, `w660v-${plan.id}-structure`, { diffuse: palette.structure, emissive: palette.secondary, intensity: 0.18 }),
      accent: material(scene, `w660v-${plan.id}-accent`, { diffuse: palette.accent, emissive: palette.accent, intensity: plan.transformation.active ? 0.95 : 0.62 }),
      secondary: material(scene, `w660v-${plan.id}-secondary`, { diffuse: palette.secondary, emissive: palette.secondary, intensity: 0.72 }),
      signal: material(scene, `w660v-${plan.id}-signal`, { diffuse: palette.signal, emissive: palette.signal, intensity: 0.92 }),
      haze: material(scene, `w660v-${plan.id}-haze`, { diffuse: palette.secondary, emissive: palette.secondary, intensity: 0.12, alpha: 0.11 })
    };
    materials = Object.values(mats);

    const floor = MeshBuilder.CreateBox(`w660v-${plan.id}-floor`, { width: 20, depth: 24, height: 0.12 }, scene);
    floor.parent = contentRoot; floor.position.set(0, -0.09, -71.5); floor.material = mats.floor; floor.isPickable = false;
    floor.metadata = freeze({ kind: 'living-nexus-authored-realm-floor', realmId: plan.id, generatedGeometry: false, localOnly: true });

    for (let index = 0; index < plan.safeRoute.length - 1; index += 1) createPathSegment(scene, contentRoot, plan.safeRoute[index], plan.safeRoute[index + 1], mats.signal, index);

    for (const [index, tower] of plan.towers.entries()) {
      const mesh = MeshBuilder.CreateBox(`w660v-${plan.id}-tower-${index + 1}`, { width: tower.width, depth: tower.width, height: tower.height }, scene);
      mesh.parent = contentRoot; mesh.position.set(tower.x, tower.height / 2, tower.z); mesh.material = index % 3 === 0 ? mats.secondary : mats.structure; mesh.isPickable = false;
      mesh.metadata = freeze({ kind: 'living-nexus-authored-realm-tower', realmId: plan.id, index, generatedGeometry: false, localOnly: true });
      collisionVolumes.push(freeze({ id: `${plan.id}-tower-${index + 1}`, type: 'circle', x: tower.x, z: tower.z, radius: Math.max(0.7, tower.width * 0.72), localOnly: true }));
      const beacon = MeshBuilder.CreateBox(`w660v-${plan.id}-tower-beacon-${index + 1}`, { width: tower.width * 0.42, depth: tower.width * 0.42, height: 0.18 }, scene);
      beacon.parent = contentRoot; beacon.position.set(tower.x, tower.height + 0.14, tower.z); beacon.material = mats.accent; beacon.isPickable = false;
      animatedNodes.push(freeze({ node: beacon, kind: 'pulse', baseY: beacon.position.y, phase: index * 0.61 }));
    }

    for (const landmark of plan.landmarks) createLandmark(scene, contentRoot, landmark, mats, animatedNodes);
    createMovementSystem(scene, contentRoot, plan, mats, animatedNodes);
    createFunctionalSpecialist(scene, contentRoot, plan, mats, animatedNodes, featureNodes, collisionVolumes);

    for (const [index, discovery] of plan.discoveries.entries()) {
      const orb = MeshBuilder.CreateSphere(`w660v-${discovery.id}`, { diameter: 0.38, segments: 12 }, scene);
      orb.parent = contentRoot; orb.position.set(discovery.x, discovery.y, discovery.z); orb.material = index % 2 ? mats.secondary : mats.accent; orb.isPickable = false;
      orb.metadata = freeze({ kind: 'living-nexus-realm-discovery', realmId: plan.id, discoveryId: discovery.id, label: discovery.label, privateContentStored: false, localOnly: true });
      animatedNodes.push(freeze({ node: orb, kind: 'pulse', baseY: discovery.y, phase: 1 + index * 0.8 }));
      featureNodes.push(freeze({ kind: 'discovery', id: discovery.id, label: discovery.label, x: discovery.x, y: discovery.y, z: discovery.z }));
    }

    const missionZone = plan.zones.find((entry) => entry.id === plan.missionZoneId) || plan.zones.at(-1);
    const terminal = MeshBuilder.CreateBox(`w660v-${plan.id}-mission-terminal`, { width: 1.15, height: 1.65, depth: 0.72 }, scene);
    terminal.parent = contentRoot; terminal.position.set(missionZone.x, 0.825, missionZone.z); terminal.material = plan.transformation.active ? mats.accent : mats.structure; terminal.isPickable = false;
    terminal.metadata = freeze({ kind: 'living-nexus-realm-mission-terminal', realmId: plan.id, missionId: plan.mission.id, reviewFirst: true, automaticExecution: false, privateContentStored: false, localOnly: true });
    const terminalRing = MeshBuilder.CreateTorus(`w660v-${plan.id}-mission-ring`, { diameter: 1.75, thickness: 0.08, tessellation: 28 }, scene);
    terminalRing.parent = contentRoot; terminalRing.position.set(missionZone.x, 1.1, missionZone.z); terminalRing.rotation.x = Math.PI / 2; terminalRing.material = mats.signal;
    animatedNodes.push(freeze({ node: terminalRing, kind: 'ring', phase: 2.4 }));
    featureNodes.push(freeze({ kind: 'mission-terminal', id: missionZone.id, label: missionZone.label, x: missionZone.x, y: 0, z: missionZone.z }));

    const returnPortal = MeshBuilder.CreateTorus(`w660v-${plan.id}-return-portal`, { diameter: 2.4, thickness: 0.13, tessellation: 32 }, scene);
    returnPortal.parent = contentRoot; returnPortal.position.set(plan.entry.x, 1.45, plan.entry.z + 1.9); returnPortal.rotation.y = Math.PI / 2; returnPortal.material = mats.accent; returnPortal.isPickable = false;
    returnPortal.metadata = freeze({ kind: 'living-nexus-realm-return-portal', realmId: plan.id, explicitUserActionRequired: true, immediateSafeReturn: true, automaticNavigation: false, localOnly: true });
    animatedNodes.push(freeze({ node: returnPortal, kind: 'ring', phase: 3.1 }));
    featureNodes.push(freeze({ kind: 'return-portal', id: `${plan.id}-return`, label: 'Return to the Expanse portal', x: plan.entry.x, y: 0, z: plan.entry.z + 1.9 }));

    if (plan.atmosphere.mist) {
      const haze = MeshBuilder.CreateSphere(`w660v-${plan.id}-haze`, { diameter: 17, segments: 16 }, scene);
      haze.parent = contentRoot; haze.position.set(0, 2.8, -71.5); haze.scaling.y = 0.34; haze.material = mats.haze; haze.isPickable = false;
      animatedNodes.push(freeze({ node: haze, kind: 'haze', phase: 0.2 }));
    }
    if (plan.atmosphere.rain && plan.atmosphere.motionEnabled) {
      for (let index = 0; index < 14; index += 1) {
        const strand = MeshBuilder.CreateBox(`w660v-${plan.id}-rain-${index}`, { width: 0.018, height: 1.1, depth: 0.018 }, scene);
        strand.parent = contentRoot; strand.position.set(-8 + (index % 7) * 2.6, 1.2 + (index % 4), -80 + Math.floor(index / 7) * 12); strand.material = mats.signal; strand.isPickable = false;
        animatedNodes.push(freeze({ node: strand, kind: 'rain', baseY: strand.position.y, phase: index * 0.37 }));
      }
    }
    host.setEnabled(true);
    return freeze({ ok: true, realmId: plan.id, summary: getSummary() });
  };

  const getSummary = () => freeze({
    schema: EON_CITY_LIVING_NEXUS_REALM_BABYLON_SCHEMA,
    activeRealmId: activePlan?.id || null,
    activeRealmLabel: activePlan?.label || null,
    visible: host.isEnabled?.() === true && Boolean(activePlan) && !disposed,
    authored: activePlan?.authored === true,
    proceduralGeometry: activePlan?.proceduralGeometry === true,
    zoneCount: activePlan?.zones?.length || 0,
    towerCount: activePlan?.towers?.length || 0,
    discoveryCount: activePlan?.discoveries?.length || 0,
    featureCount: featureNodes.length,
    collisionVolumeCount: collisionVolumes.length,
    verifiedTransformationActive: activePlan?.transformation?.active === true,
    premiumAuthoredDepth: activePlan?.premiumAuthoredDepth === true,
    specialistId: activePlan?.specialist?.id || null,
    specialistCount: featureNodes.filter((entry) => entry.kind === 'functional-specialist').length,
    movementSystemId: activePlan?.movementSystem?.id || null,
    movementNodeCount: animatedNodes.filter((entry) => entry.kind === 'path').length,
    realmReflectionId: activePlan?.realmReflection?.id || null,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    disposed
  });

  return freeze({
    render,
    hide() { host.setEnabled(false); return getSummary(); },
    show() { if (activePlan) host.setEnabled(true); return getSummary(); },
    getPlan() { return activePlan ? freeze({ ...activePlan }) : null; },
    getSummary,
    getEntryPose() { return activePlan?.entry ? freeze({ ...activePlan.entry }) : null; },
    getCollisionVolumes() { return freeze(collisionVolumes.map((entry) => freeze({ ...entry }))); },
    getNearestFeature(position = {}) {
      return activePlan ? resolveNearestEonCityLivingNexusRealmFeature(position, activePlan, { maxDistance: 3.2 }) : null;
    },
    update(now = globalThis.performance?.now?.() || Date.now(), { reducedEffects = false, mode = 'explore' } = {}) {
      if (disposed || !activePlan || host.isEnabled?.() !== true || reducedEffects || mode !== 'explore') return getSummary();
      const time = Number(now || 0) * 0.001;
      for (const entry of animatedNodes) {
        if (!entry.node || entry.node.isDisposed?.()) continue;
        if (entry.kind === 'ring') entry.node.rotation.z += 0.0048;
        else if (entry.kind === 'pulse') entry.node.position.y = Number(entry.baseY || 0) + Math.sin(time * 1.25 + entry.phase) * 0.045;
        else if (entry.kind === 'haze') entry.node.rotation.y += 0.0008;
        else if (entry.kind === 'rain') entry.node.position.y = 0.7 + ((Number(entry.baseY || 1) - time * 1.8 + entry.phase) % 5 + 5) % 5;
        else if (entry.kind === 'path' && entry.motionEnabled) {
          const point = interpolatePath(entry.path, (Number(now || 0) / Math.max(2000, Number(entry.periodMs || 12000))) + Number(entry.offset || 0));
          entry.node.position.x = point.x; entry.node.position.z = point.z; entry.node.position.y = Number(entry.baseY || 1.4) + Math.sin(time * 1.6 + Number(entry.offset || 0) * 6) * 0.08;
        } else if (entry.kind === 'specialist' && entry.motionEnabled) {
          entry.node.position.x = Number(entry.originX || 0) + Math.sin(time * 0.42 + entry.phase) * 0.38;
          entry.node.position.z = Number(entry.originZ || 0) + Math.cos(time * 0.42 + entry.phase) * 0.22;
          entry.node.rotation.y = Math.atan2(Math.cos(time * 0.42 + entry.phase), Math.sin(time * 0.42 + entry.phase));
        }
      }
      return getSummary();
    },
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      dispose(host);
      for (const entry of materials) safeMaterialDispose(entry);
      materials = [];
      return getSummary();
    }
  });
}

export function toEonCityLivingNexusRealmVector(position = {}) {
  return new Vector3(Number(position?.x || 0), Number(position?.y || 0), Number(position?.z || 0));
}
