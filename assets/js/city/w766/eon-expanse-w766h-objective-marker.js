import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { buildEonExpanseW767BGroundCircuitRoute } from './eon-expanse-w767b-guidance-director.js';

const freeze = (value) => Object.freeze(value);

export function mountEonExpanseW766HObjectiveMarker({ scene, maxRouteSegments = 18 } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w766h-objective-marker-root', scene);
  const routeRoot = new TransformNode('w767b-objective-ground-circuit-root', scene);
  const material = new StandardMaterial('w766h-objective-marker-material', scene);
  material.diffuseColor = Color3.FromHexString('#25b6ff').scale(0.3);
  material.emissiveColor = Color3.FromHexString('#25b6ff').scale(0.9);
  material.specularColor = Color3.Black();
  const routeMaterial = new StandardMaterial('w767b-objective-ground-circuit-material', scene);
  routeMaterial.diffuseColor = Color3.FromHexString('#17466b').scale(0.55);
  routeMaterial.emissiveColor = Color3.FromHexString('#38c8ff').scale(0.82);
  routeMaterial.specularColor = Color3.Black();
  const ring = MeshBuilder.CreateTorus('w766h-objective-marker-ring', { diameter: 2.2, thickness: 0.12, tessellation: 32 }, scene);
  ring.parent = root; ring.material = material; ring.rotation.x = Math.PI / 2; ring.isPickable = false;
  const beam = MeshBuilder.CreateCylinder('w766h-objective-marker-beam', { diameter: 0.12, height: 5, tessellation: 12 }, scene);
  beam.parent = root; beam.position.y = 2.5; beam.material = material; beam.isPickable = false;
  const chevron = MeshBuilder.CreateCylinder('w767b-objective-marker-chevron', { diameterTop: 0, diameterBottom: 0.7, height: 0.72, tessellation: 4 }, scene);
  chevron.parent = root; chevron.position.y = 5.25; chevron.rotation.y = Math.PI / 4; chevron.material = material; chevron.isPickable = false;
  const routeSegments = [];
  for (let index = 0; index < Math.max(1, Number(maxRouteSegments || 18)); index += 1) {
    const segment = MeshBuilder.CreateBox(`w767b-objective-ground-circuit-${index}`, { width: 0.18, height: 0.035, depth: 1.25 }, scene);
    segment.parent = routeRoot;
    segment.material = routeMaterial;
    segment.isPickable = false;
    segment.checkCollisions = false;
    segment.setEnabled(false);
    routeSegments.push(segment);
  }
  root.setEnabled(false);
  routeRoot.setEnabled(false);
  return freeze({
    ok: true,
    update(guidance, seconds = 0, player = null, guideState = null) {
      const active = Boolean(guidance?.active && guidance?.target);
      root.setEnabled(active);
      routeRoot.setEnabled(active);
      if (!active) {
        for (const segment of routeSegments) segment.setEnabled(false);
        return freeze({ active: false, routeSegmentCount: 0 });
      }
      root.position.set(guidance.target.x, Number(guidance.target.y || 0.2), guidance.target.z);
      root.rotation.y = seconds * 0.8;
      const pulse = 0.9 + Math.sin(seconds * 3) * 0.08;
      root.scaling.setAll(pulse);
      const route = buildEonExpanseW767BGroundCircuitRoute({ player: player || guidance.player || {}, target: guidance.target, maxSegments: routeSegments.length });
      for (let index = 0; index < routeSegments.length; index += 1) {
        const segment = routeSegments[index];
        const pose = route.points[index];
        segment.setEnabled(Boolean(pose));
        if (!pose) continue;
        segment.position.set(pose.x, pose.y, pose.z);
        segment.rotation.y = pose.heading;
        const guideBoost = guideState?.active ? 1.18 : 1;
        const segmentPulse = 0.72 + Math.sin(seconds * 4.2 - index * 0.55) * 0.16;
        segment.scaling.set(guideBoost, 1, Math.max(0.55, segmentPulse));
        segment.visibility = Math.min(1, pose.intensity * guideBoost);
      }
      return freeze({
        active: true,
        objective: guidance.objective,
        position: freeze({ x: root.position.x, y: root.position.y, z: root.position.z }),
        routeSegmentCount: route.points.length,
        routeLength: route.length,
        eonbotGuideActive: guideState?.active === true
      });
    },
    dispose() {
      try { root.dispose(false, true); } catch {}
      try { routeRoot.dispose(false, true); } catch {}
      try { material.dispose(); } catch {}
      try { routeMaterial.dispose(); } catch {}
      return freeze({ ok: true });
    }
  });
}
