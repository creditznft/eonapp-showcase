/** RT92 Wave 7 — lightweight environmental service life shared across all EONCITY worlds. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { createEonCityRt92ArtCadence } from './eon-city-rt92-art-performance-master.js';

export const EON_CITY_RT92_ENVIRONMENTAL_LIFE_SCHEMA = 'eon.city.environmental-life-art.rt92.v1';
const freeze = Object.freeze;
const QUALITY_LIMITS = freeze({ lite: 2, balanced: 4, cinematic: 6 });

const WORLD_ACTORS = freeze({
  'command-hub': freeze([
    freeze({ id: 'hub-spider-maintenance', type: 'spider', x: -11, z: 8, route: 'patrol', radius: 3.4, speed: 0.23 }),
    freeze({ id: 'hub-inspection-drone', type: 'drone', x: 9, z: -9, y: 1.7, route: 'orbit', radius: 2.8, speed: 0.31 }),
    freeze({ id: 'hub-cargo-unit', type: 'cart', x: 15, z: 10, route: 'line', radius: 4.2, speed: 0.16 }),
    freeze({ id: 'hub-floor-service', type: 'service', x: -17, z: -8, route: 'patrol', radius: 2.5, speed: 0.19 }),
    freeze({ id: 'hub-survey-drone', type: 'drone', x: 2, z: 19, y: 2.1, route: 'orbit', radius: 4.1, speed: 0.21 }),
    freeze({ id: 'hub-nexus-inspector', type: 'scanner', x: 4.5, z: 4.5, y: 1.25, route: 'service', radius: 1.2, speed: 0.28 })
  ]),
  'signal-frontier': freeze([
    freeze({ id: 'signal-beacon-spider', type: 'spider', x: -38, z: -31, route: 'patrol', radius: 4.2, speed: 0.18 }),
    freeze({ id: 'signal-archive-drone', type: 'drone', x: 45, z: -44, y: 2.2, route: 'orbit', radius: 4.8, speed: 0.2 }),
    freeze({ id: 'signal-transit-service', type: 'cart', x: -9, z: -84, route: 'line', radius: 5.5, speed: 0.15 }),
    freeze({ id: 'signal-vault-scanner', type: 'scanner', x: 17, z: -125, y: 1.5, route: 'service', radius: 1.4, speed: 0.24 }),
    freeze({ id: 'signal-gateway-survey', type: 'drone', x: -7, z: 5, y: 1.8, route: 'orbit', radius: 3.2, speed: 0.26 }),
    freeze({ id: 'signal-repair-service', type: 'service', x: -29, z: -25, route: 'patrol', radius: 3.1, speed: 0.17 })
  ]),
  'storm-sector': freeze([
    freeze({ id: 'storm-relay-spider', type: 'spider', x: 1008, z: -139, route: 'patrol', radius: 3.5, speed: 0.16 }),
    freeze({ id: 'storm-stabilizer-drone', type: 'drone', x: 1051, z: -219, y: 2.4, route: 'orbit', radius: 4.4, speed: 0.25 }),
    freeze({ id: 'storm-rescue-cart', type: 'cart', x: 1115, z: -171, route: 'line', radius: 4.8, speed: 0.13 }),
    freeze({ id: 'storm-gateway-scanner', type: 'scanner', x: 952, z: -185, y: 1.35, route: 'service', radius: 1.2, speed: 0.28 }),
    freeze({ id: 'storm-grounding-service', type: 'service', x: 1072, z: -204, route: 'patrol', radius: 3.2, speed: 0.17 }),
    freeze({ id: 'storm-eye-survey', type: 'drone', x: 1121, z: -186, y: 2.8, route: 'orbit', radius: 5.2, speed: 0.22 })
  ]),
  'my-frontier': freeze([
    freeze({ id: 'frontier-central-spider', type: 'spider', x: -4, z: 8, route: 'patrol', radius: 3.2, speed: 0.2 }),
    freeze({ id: 'frontier-creator-drone', type: 'drone', x: 20, z: -7, y: 1.9, route: 'orbit', radius: 3.6, speed: 0.25 }),
    freeze({ id: 'frontier-transit-cart', type: 'cart', x: -22, z: 8, route: 'line', radius: 5.0, speed: 0.14 }),
    freeze({ id: 'frontier-systems-service', type: 'service', x: 9, z: 22, route: 'patrol', radius: 3.4, speed: 0.18 }),
    freeze({ id: 'frontier-knowledge-scanner', type: 'scanner', x: -11, z: -21, y: 1.3, route: 'service', radius: 1.1, speed: 0.22 }),
    freeze({ id: 'frontier-personal-garden-drone', type: 'drone', x: 17, z: 18, y: 1.7, route: 'orbit', radius: 2.8, speed: 0.16 })
  ])
});

const makeMaterial = (scene, name, diffuse, emissive, intensity = 0.2) => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(diffuse);
  material.emissiveColor = Color3.FromHexString(emissive).scale(intensity);
  material.specularColor = Color3.Black();
  return material;
};

function buildActor(scene, parent, spec, materials) {
  const root = new TransformNode(`rt92-life-${spec.id}`, scene);
  root.parent = parent;
  root.position.set(spec.x, Number(spec.y || 0.34), spec.z);
  root.metadata = freeze({ kind: 'rt92-environmental-service-life', actorId: spec.id, actorType: spec.type, decorativeOnly: true, authoredHumanNpc: false, interactive: false });
  const meshes = [];
  const add = (mesh, material, x = 0, y = 0, z = 0) => {
    mesh.parent = root; mesh.position.set(x, y, z); mesh.material = material; mesh.isPickable = false; mesh.checkCollisions = false; meshes.push(mesh); return mesh;
  };
  let animatedPart = null;
  if (spec.type === 'spider') {
    add(MeshBuilder.CreateBox(`${spec.id}-body`, { width: 0.72, height: 0.28, depth: 0.9 }, scene), materials.body, 0, 0.32, 0);
    animatedPart = add(MeshBuilder.CreateSphere(`${spec.id}-sensor`, { diameter: 0.26, segments: 10 }, scene), materials.signal, 0, 0.58, 0.22);
    for (let i = 0; i < 4; i += 1) {
      const side = i < 2 ? -1 : 1; const front = i % 2 === 0 ? -1 : 1;
      const leg = add(MeshBuilder.CreateBox(`${spec.id}-leg-${i}`, { width: 0.48, height: 0.08, depth: 0.09 }, scene), materials.metal, side * 0.48, 0.2, front * 0.28);
      leg.rotation.z = side * 0.28;
    }
  } else if (spec.type === 'drone') {
    add(MeshBuilder.CreateSphere(`${spec.id}-core`, { diameter: 0.55, segments: 12 }, scene), materials.body, 0, 0, 0);
    animatedPart = add(MeshBuilder.CreateTorus(`${spec.id}-halo`, { diameter: 0.82, thickness: 0.055, tessellation: 28 }, scene), materials.signal, 0, 0, 0);
    animatedPart.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i += 1) { const a = i * Math.PI * 2 / 3; const fin = add(MeshBuilder.CreateBox(`${spec.id}-fin-${i}`, { width: 0.12, height: 0.1, depth: 0.42 }, scene), materials.metal, Math.sin(a) * 0.38, -0.02, Math.cos(a) * 0.38); fin.rotation.y = a; }
  } else if (spec.type === 'cart') {
    add(MeshBuilder.CreateBox(`${spec.id}-deck`, { width: 1.1, height: 0.28, depth: 1.55 }, scene), materials.body, 0, 0.28, 0);
    add(MeshBuilder.CreateBox(`${spec.id}-cargo`, { width: 0.78, height: 0.58, depth: 0.82 }, scene), materials.metal, 0, 0.68, 0.15);
    animatedPart = add(MeshBuilder.CreateBox(`${spec.id}-guide`, { width: 0.18, height: 0.08, depth: 0.46 }, scene), materials.signal, 0, 0.44, -0.62);
  } else if (spec.type === 'scanner') {
    add(MeshBuilder.CreateCylinder(`${spec.id}-mast`, { diameter: 0.18, height: 1.05, tessellation: 12 }, scene), materials.metal, 0, 0.42, 0);
    animatedPart = add(MeshBuilder.CreateTorus(`${spec.id}-scan-ring`, { diameter: 0.72, thickness: 0.05, tessellation: 28 }, scene), materials.signal, 0, 1.0, 0);
    animatedPart.rotation.x = Math.PI / 2;
    add(MeshBuilder.CreateSphere(`${spec.id}-head`, { diameter: 0.26, segments: 10 }, scene), materials.body, 0, 0.92, 0);
  } else {
    add(MeshBuilder.CreateCylinder(`${spec.id}-service-base`, { diameter: 0.7, height: 0.28, tessellation: 18 }, scene), materials.body, 0, 0.22, 0);
    animatedPart = add(MeshBuilder.CreateBox(`${spec.id}-service-arm`, { width: 0.12, height: 0.72, depth: 0.12 }, scene), materials.signal, 0.12, 0.66, 0);
  }
  return freeze({ root, meshes: freeze(meshes), animatedPart, spec, base: freeze({ x: spec.x, y: Number(spec.y || 0.34), z: spec.z }) });
}

export function mountEonCityRt92EnvironmentalLifeArt({ scene, parent = null, worldId = 'command-hub', quality = 'balanced', reducedMotion = false } = {}) {
  if (!scene || !WORLD_ACTORS[worldId]) return freeze({ ok: false, reason: 'canonical-scene-and-known-world-required' });
  const root = new TransformNode(`rt92-environmental-life-${worldId}`, scene); if (parent) root.parent = parent;
  const materials = freeze({
    body: makeMaterial(scene, `rt92-life-${worldId}-body`, '#111a24', '#1b3448', 0.12),
    metal: makeMaterial(scene, `rt92-life-${worldId}-metal`, '#303844', '#101722', 0.04),
    signal: makeMaterial(scene, `rt92-life-${worldId}-signal`, worldId === 'storm-sector' ? '#544d72' : '#225c70', worldId === 'storm-sector' ? '#b5a7ff' : '#5edcff', 0.72)
  });
  const cadence = createEonCityRt92ArtCadence({ quality, reducedMotion });
  const limit = QUALITY_LIMITS[quality] || QUALITY_LIMITS.balanced;
  const actors = freeze(WORLD_ACTORS[worldId].slice(0, limit).map((spec) => buildActor(scene, root, spec, materials)));
  let active = false;
  let hazardSeverity = 0;
  let activityLevel = 1;
  root.setEnabled(false);

  const setActive = (value = false) => { active = value === true; root.setEnabled(active); return freeze({ ok: true, active }); };
  return freeze({
    ok: true,
    schema: EON_CITY_RT92_ENVIRONMENTAL_LIFE_SCHEMA,
    worldId,
    root,
    setActive,
    applyState({ active: nextActive = active, hazardSeverity: nextHazardSeverity = hazardSeverity, activityLevel: nextActivityLevel = activityLevel } = {}) {
      hazardSeverity = Math.max(0, Math.min(4, Number(nextHazardSeverity || 0)));
      activityLevel = Math.max(0, Math.min(4, Number(nextActivityLevel || 0)));
      return setActive(nextActive);
    },
    update(seconds = 0) {
      if (!active || reducedMotion) return freeze({ ok: true, active, animatedCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0);
      const cadenceState = cadence.shouldUpdate('service-life', t);
      if (!cadenceState.update) return freeze({ ok: true, active, animatedCount: 0, cadenceSkipped: true, ownsRenderLoop: false });
      let animatedCount = 0;
      for (let i = 0; i < actors.length; i += 1) {
        const actor = actors[i]; const { spec, base } = actor; const phase = i * 1.73;
        if (spec.route === 'orbit') {
          actor.root.position.x = base.x + Math.sin(t * spec.speed + phase) * spec.radius;
          actor.root.position.z = base.z + Math.cos(t * spec.speed + phase) * spec.radius;
          actor.root.position.y = base.y + Math.sin(t * 1.3 + phase) * 0.16;
        } else if (spec.route === 'line') {
          const q = Math.sin(t * spec.speed + phase);
          actor.root.position.x = base.x + q * spec.radius;
          actor.root.position.z = base.z + q * spec.radius * 0.28;
          actor.root.rotation.y = q >= 0 ? Math.PI * 0.42 : -Math.PI * 0.58;
        } else if (spec.route === 'patrol') {
          actor.root.position.x = base.x + Math.sin(t * spec.speed + phase) * spec.radius;
          actor.root.position.z = base.z + Math.sin(t * spec.speed * 0.72 + phase) * spec.radius * 0.52;
          actor.root.rotation.y = t * spec.speed + phase;
        } else actor.root.rotation.y = Math.sin(t * spec.speed + phase) * 0.55;
        if (actor.animatedPart) actor.animatedPart.rotation.y += 0.008 + spec.speed * 0.012;
        if (worldId === 'storm-sector') actor.root.rotation.z = Math.sin(t * 1.7 + phase) * (0.018 + hazardSeverity * 0.008);
        const activityPulse = 0.86 + Math.sin(t * (1.2 + activityLevel * 0.08) + phase) * 0.08;
        actor.root.scaling.setAll(activityPulse);
        animatedCount += 1;
      }
      return freeze({ ok: true, active, animatedCount, hazardSeverity, activityLevel, ownsRenderLoop: false });
    },
    getSummary() { return freeze({ schema: EON_CITY_RT92_ENVIRONMENTAL_LIFE_SCHEMA, worldId, actorCount: actors.length, actorTypes: freeze(actors.map((actor) => actor.spec.type)), active, hazardSeverity, activityLevel, authoredHumanNpcCount: 0, proceduralHumanNpcCount: 0, serviceRobotCount: actors.length, updateHz: cadence.plan.serviceLifeHz, firstFrameNewBinaryBytes: 0, externalTextures: 0, ownsEngine: false, ownsScene: false, ownsRenderLoop: false, ownsNavigation: false, ownsCollision: false, writesProgression: false }); },
    dispose() { active = false; for (const material of Object.values(materials)) try { material.dispose?.(); } catch {} try { root.dispose?.(false, true); } catch {} return freeze({ ok: true }); }
  });
}

export default freeze({ EON_CITY_RT92_ENVIRONMENTAL_LIFE_SCHEMA, mountEonCityRt92EnvironmentalLifeArt });
