/** L95-W13 — low-cost public landscape presenter for first-entry My Frontier. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import {
  EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA,
  createEonCityL95MyFrontierPublicLandscapePlan,
  validateEonCityL95MyFrontierPublicLandscapePlan
} from './eon-city-l95-my-frontier-public-landscape-contract.js';

const freeze = Object.freeze;

function material(scene, name, diffuse, emissive, intensity, alpha = 1) {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = Color3.FromHexString(diffuse);
  value.emissiveColor = Color3.FromHexString(emissive).scale(intensity);
  value.specularColor = Color3.Black();
  value.alpha = alpha;
  value.backFaceCulling = alpha >= 1;
  return value;
}

export function mountEonCityL95MyFrontierPublicLandscape({ scene, parent = null, quality = 'balanced' } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'canonical-scene-and-parent-required' });
  const plan = createEonCityL95MyFrontierPublicLandscapePlan({ quality });
  const validation = validateEonCityL95MyFrontierPublicLandscapePlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: `public-landscape-plan-invalid:${validation.errors.join(',')}` });

  const root = new TransformNode('l95-my-frontier-public-landscape-root', scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'my-frontier-public-landscape', canonicalSceneOnly: true, userBuilding: false, interactive: false });
  const materials = freeze({
    trace: material(scene, 'l95-my-frontier-landscape-trace', '#0a2940', '#39c7ff', 0.72, 0.86),
    pylon: material(scene, 'l95-my-frontier-landscape-pylon', '#122336', '#62e6c5', 0.58),
    fin: material(scene, 'l95-my-frontier-landscape-fin', '#101827', '#755cff', 0.28)
  });
  const nodes = [];
  const track = (mesh, kind) => {
    mesh.parent = root;
    mesh.material = kind === 'fin' ? materials.fin : kind === 'pylon' ? materials.pylon : materials.trace;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({ kind: `my-frontier-public-landscape-${kind}`, ownership: 'public-landscape', userBuilding: false, interactive: false, grantsXp: false });
    nodes.push(mesh);
    return mesh;
  };

  for (const ring of plan.perimeterRings) {
    const mesh = track(MeshBuilder.CreateTorus(`l95-${ring.id}`, { diameter: ring.diameter, thickness: ring.thickness, tessellation: quality === 'lite' ? 64 : 96 }, scene), 'trace');
    mesh.position.y = 0.205;
    mesh.rotation.x = Math.PI / 2;
  }
  for (const halo of plan.districtHalos) {
    const mesh = track(MeshBuilder.CreateTorus(`l95-${halo.id}`, { diameter: halo.diameter, thickness: 0.07, tessellation: quality === 'lite' ? 40 : 56 }, scene), 'trace');
    mesh.position.set(halo.x, 0.225, halo.z);
    mesh.rotation.x = Math.PI / 2;
  }
  for (const fin of plan.fins) {
    const mesh = track(MeshBuilder.CreateBox(`l95-${fin.id}`, { width: fin.width, height: fin.height, depth: fin.depth }, scene), 'fin');
    mesh.position.set(fin.x, fin.height / 2 - 0.02, fin.z);
    mesh.rotation.y = fin.heading;
  }
  for (const pylon of plan.pylons) {
    const mesh = track(MeshBuilder.CreateCylinder(`l95-${pylon.id}`, { diameter: 0.22, height: pylon.height, tessellation: 12 }, scene), 'pylon');
    mesh.position.set(pylon.x, pylon.height / 2, pylon.z);
    const cap = track(MeshBuilder.CreateTorus(`l95-${pylon.id}-cap`, { diameter: 0.72, thickness: 0.065, tessellation: 24 }, scene), 'trace');
    cap.position.set(pylon.x, pylon.height, pylon.z);
    cap.rotation.x = Math.PI / 2;
  }
  for (const node of nodes) {
    try { node.freezeWorldMatrix?.(); } catch {}
  }

  return freeze({
    ok: true,
    schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA,
    root,
    getSummary() {
      return freeze({
        schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA,
        quality: plan.quality,
        meshCount: nodes.length,
        plannedMeshBudget: plan.meshBudget,
        districtHaloCount: plan.districtHalos.length,
        horizonFinCount: plan.fins.length,
        energyPylonCount: plan.pylons.length,
        perimeterRingCount: plan.perimeterRings.length,
        staticWorldMatrices: true,
        publicLandscapeOnly: true,
        userBuildingCount: 0,
        interactiveCount: 0,
        createsRenderLoop: false,
        canonicalScene: root.getScene?.() === scene
      });
    },
    dispose() {
      for (const value of Object.values(materials)) try { value.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA, mountEonCityL95MyFrontierPublicLandscape });
