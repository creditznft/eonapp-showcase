/** L95-W12 — static outer-landscape presenter for Signal Frontier. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import {
  EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
  createEonCityL95SignalFrontierOuterLandscapePlan,
  validateEonCityL95SignalFrontierOuterLandscapePlan
} from './eon-city-l95-signal-frontier-outer-landscape-contract.js';

const freeze = Object.freeze;

function safeColor(value = '#25b6ff', fallback = '#25b6ff') {
  try { return Color3.FromHexString(value); } catch { return Color3.FromHexString(fallback); }
}

function makeMaterial(scene, name, hex, intensity = 0.3, alpha = 1) {
  const material = new StandardMaterial(name, scene);
  const source = safeColor(hex);
  material.diffuseColor = source.scale(0.24);
  material.emissiveColor = source.scale(intensity);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  material.backFaceCulling = alpha >= 1;
  return material;
}

function createSupport(scene, entry) {
  if (entry.style === 'signal-pylon') {
    return MeshBuilder.CreateCylinder(`l95-${entry.id}`, { diameterTop: 0.16, diameterBottom: Math.max(0.34, Number(entry.width || 0.6)), height: Number(entry.height || 4), tessellation: 10 }, scene);
  }
  if (entry.style === 'vault-monolith') {
    return MeshBuilder.CreateCylinder(`l95-${entry.id}`, { diameterTop: Math.max(0.3, Number(entry.width || 0.6) * 0.45), diameterBottom: Math.max(0.55, Number(entry.width || 0.8)), height: Number(entry.height || 4.5), tessellation: 8 }, scene);
  }
  return MeshBuilder.CreateBox(`l95-${entry.id}`, { width: Number(entry.width || 0.7), height: Number(entry.height || 4), depth: Number(entry.depth || 1.2) }, scene);
}

export function mountEonCityL95SignalFrontierOuterLandscape({ scene, parent = null, quality = 'balanced', worldSeed = 1 } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'canonical-scene-and-parent-required' });
  const plan = createEonCityL95SignalFrontierOuterLandscapePlan({ quality, worldSeed });
  const validation = validateEonCityL95SignalFrontierOuterLandscapePlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: `outer-landscape-plan-invalid:${validation.errors.join(',')}` });

  const root = new TransformNode('l95-signal-frontier-outer-landscape-root', scene);
  root.parent = parent;
  root.setEnabled(false);
  root.metadata = freeze({
    schema: EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
    kind: 'signal-frontier-public-landscape',
    canonicalSceneOnly: true,
    authoredHeroRemainsDominant: true,
    interactive: false
  });

  const materials = [];
  const nodes = [];
  const zoneRoots = new Map();
  const track = (mesh, zoneId, role, material) => {
    mesh.parent = zoneRoots.get(zoneId);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({
      kind: 'signal-frontier-public-landscape',
      zoneId,
      role,
      ownership: 'signal-frontier-public-landscape',
      visualWeight: role.includes('ground') ? 'ground-support' : 'background-support',
      finishedHeroBuilding: false,
      interactive: false,
      grantsXp: false,
      mutatesMissionState: false
    });
    nodes.push(mesh);
    return mesh;
  };

  for (const zone of plan.zones) {
    const zoneRoot = new TransformNode(`l95-signal-frontier-${zone.zoneId}-outer-root`, scene);
    zoneRoot.parent = root;
    zoneRoots.set(zone.zoneId, zoneRoot);
    const palette = zone.palette || {};
    const groundMaterial = makeMaterial(scene, `l95-${zone.zoneId}-ground`, palette.base || '#07111f', 0.1, 0.92);
    const primaryMaterial = makeMaterial(scene, `l95-${zone.zoneId}-outer-primary`, palette.primary || '#25b6ff', 0.38);
    const secondaryMaterial = makeMaterial(scene, `l95-${zone.zoneId}-outer-secondary`, palette.secondary || '#9d72ff', 0.28);
    materials.push(groundMaterial, primaryMaterial, secondaryMaterial);

    const terrain = track(MeshBuilder.CreateCylinder(`l95-${zone.terrainPatch.id}`, { diameter: zone.terrainPatch.diameter, height: zone.terrainPatch.height, tessellation: quality === 'lite' ? 36 : 48 }, scene), zone.zoneId, 'ground-terrain-patch', groundMaterial);
    terrain.position.set(zone.terrainPatch.x, -0.13, zone.terrainPatch.z);

    const perimeter = track(MeshBuilder.CreateTorus(`l95-${zone.perimeterTrace.id}`, { diameter: zone.perimeterTrace.diameter, thickness: zone.perimeterTrace.thickness, tessellation: quality === 'lite' ? 48 : 64 }, scene), zone.zoneId, 'ground-perimeter-trace', primaryMaterial);
    perimeter.position.set(zone.perimeterTrace.x, 0.07, zone.perimeterTrace.z);
    perimeter.rotation.x = Math.PI / 2;

    for (const entry of zone.boundaryBeacons) {
      const beacon = track(MeshBuilder.CreateCylinder(`l95-${entry.id}`, { diameterTop: 0.08, diameterBottom: 0.24, height: entry.height, tessellation: 8 }, scene), zone.zoneId, 'boundary-beacon', primaryMaterial);
      beacon.position.set(entry.x, entry.height / 2, entry.z);
      beacon.rotation.y = entry.heading;
    }
    for (const entry of zone.skylineSupports) {
      const support = track(createSupport(scene, entry), zone.zoneId, `outer-${entry.style}`, secondaryMaterial);
      support.position.set(entry.x, entry.height / 2 - 0.04, entry.z);
      support.rotation.y = entry.heading;
    }
  }

  for (const node of nodes) {
    try { node.freezeWorldMatrix?.(); } catch {}
  }

  let active = false;
  let disposed = false;
  return freeze({
    ok: true,
    schema: EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
    root,
    activate() {
      if (disposed) return freeze({ ok: false, reason: 'outer-landscape-disposed' });
      active = true;
      root.setEnabled(true);
      return freeze({ ok: true, active: true, canonicalScene: root.getScene?.() === scene });
    },
    deactivate() {
      active = false;
      root.setEnabled(false);
      return freeze({ ok: true, active: false });
    },
    getSummary() {
      return freeze({
        schema: EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
        active,
        quality: plan.quality,
        zoneCount: plan.zoneCount,
        meshCount: nodes.length,
        plannedMeshBudget: plan.meshBudget,
        staticWorldMatrices: true,
        authoredHeroRemainsDominant: true,
        backgroundSupportOnly: true,
        finishedHeroPrimitiveCount: 0,
        interactiveCount: 0,
        createsRenderLoop: false,
        canonicalScene: root.getScene?.() === scene
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      root.setEnabled(false);
      for (const value of materials) try { value.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      zoneRoots.clear();
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA, mountEonCityL95SignalFrontierOuterLandscape });
