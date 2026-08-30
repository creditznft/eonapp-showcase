import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W766H_TRANSIT_PRESENTER_SCHEMA = 'eon.city.expanse.transit-presenter.w766h.v1';

const QUALITY = freeze({
  lite: freeze({ trailCount: 0, ringCount: 1, windowAlpha: 0.42 }),
  balanced: freeze({ trailCount: 5, ringCount: 2, windowAlpha: 0.5 }),
  cinematic: freeze({ trailCount: 9, ringCount: 3, windowAlpha: 0.58 })
});

function material(scene, name, { diffuse = [0.04, 0.12, 0.2], emissive = [0.05, 0.4, 0.72], alpha = 1 } = {}) {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = new Color3(...diffuse);
  value.emissiveColor = new Color3(...emissive);
  value.alpha = alpha;
  value.disableLighting = false;
  value.backFaceCulling = false;
  return value;
}

function makeNonInteractive(mesh) {
  if (!mesh) return mesh;
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.receiveShadows = false;
  return mesh;
}

/**
 * Lightweight regional Transit presentation for Signal Frontier.
 *
 * The repository does not contain a certified regional capsule GLB, so this
 * intentionally uses a bounded Babylon primitive assembly rather than
 * pretending an unrelated asset is the capsule. It mounts in the canonical
 * scene, owns no render loop, and is driven by the canonical journey state.
 */
export function mountEonExpanseW766HTransitPresenter({
  scene,
  quality = 'balanced',
  reducedMotion = false
} = {}) {
  if (!scene) return freeze({ ok: false, reason: 'scene-required' });
  const profileId = QUALITY[quality] ? quality : 'balanced';
  const profile = QUALITY[profileId];
  const root = new TransformNode('w766h-regional-transit-capsule-root', scene);
  root.setEnabled(false);

  const shellMaterial = material(scene, 'w766h-transit-shell-material', {
    diffuse: [0.025, 0.08, 0.14], emissive: [0.04, 0.34, 0.68]
  });
  const windowMaterial = material(scene, 'w766h-transit-window-material', {
    diffuse: [0.04, 0.2, 0.28], emissive: [0.08, 0.72, 0.96], alpha: profile.windowAlpha
  });
  const signalMaterial = material(scene, 'w766h-transit-signal-material', {
    diffuse: [0.06, 0.22, 0.3], emissive: [0.15, 0.9, 1]
  });
  const goldMaterial = material(scene, 'w766h-transit-gold-material', {
    diffuse: [0.28, 0.19, 0.04], emissive: [0.82, 0.48, 0.07]
  });

  // The authored long axis is local +Z. The two domes and central hull create
  // a readable capsule silhouette without relying on an unverified asset.
  const hull = makeNonInteractive(MeshBuilder.CreateCylinder('w766h-transit-hull', {
    height: 4.8, diameter: 2.15, tessellation: profileId === 'lite' ? 14 : 24
  }, scene));
  hull.rotation.x = Math.PI / 2;
  hull.parent = root;
  hull.material = shellMaterial;

  const nose = makeNonInteractive(MeshBuilder.CreateSphere('w766h-transit-nose', {
    diameter: 2.16, segments: profileId === 'lite' ? 10 : 18
  }, scene));
  nose.scaling.z = 0.72;
  nose.position.z = 2.4;
  nose.parent = root;
  nose.material = shellMaterial;

  const tail = makeNonInteractive(MeshBuilder.CreateSphere('w766h-transit-tail', {
    diameter: 2.16, segments: profileId === 'lite' ? 10 : 18
  }, scene));
  tail.scaling.z = 0.72;
  tail.position.z = -2.4;
  tail.parent = root;
  tail.material = shellMaterial;

  const window = makeNonInteractive(MeshBuilder.CreateCylinder('w766h-transit-window', {
    height: 2.65, diameter: 2.19, tessellation: profileId === 'lite' ? 14 : 24
  }, scene));
  window.rotation.x = Math.PI / 2;
  window.position.z = 0.35;
  window.parent = root;
  window.material = windowMaterial;

  const spine = makeNonInteractive(MeshBuilder.CreateBox('w766h-transit-spine', {
    width: 0.22, height: 0.18, depth: 5.35
  }, scene));
  spine.position.y = 1.08;
  spine.parent = root;
  spine.material = goldMaterial;

  const rings = [];
  for (let index = 0; index < profile.ringCount; index += 1) {
    const ring = makeNonInteractive(MeshBuilder.CreateTorus(`w766h-transit-ring-${index}`, {
      diameter: 2.42, thickness: 0.08, tessellation: profileId === 'lite' ? 16 : 28
    }, scene));
    ring.rotation.x = Math.PI / 2;
    ring.position.z = (index - (profile.ringCount - 1) / 2) * 1.5;
    ring.parent = root;
    ring.material = index % 2 ? goldMaterial : signalMaterial;
    rings.push(ring);
  }

  const trail = [];
  for (let index = 0; index < (reducedMotion ? 0 : profile.trailCount); index += 1) {
    const point = makeNonInteractive(MeshBuilder.CreateSphere(`w766h-transit-trail-${index}`, {
      diameter: Math.max(0.08, 0.22 - index * 0.012), segments: 6
    }, scene));
    point.parent = root;
    point.position.z = -3.15 - index * 0.58;
    point.material = signalMaterial;
    trail.push(point);
  }

  let active = false;
  let lastProgress = 0;
  let lastYaw = 0;

  const update = (journey = {}, seconds = 0) => {
    const journeyActive = ['active', 'complete'].includes(String(journey?.status || '')) && journey?.pose;
    if (!journeyActive) {
      if (active) root.setEnabled(false);
      active = false;
      return freeze({ ok: true, active: false });
    }
    const from = journey.from || journey.pose;
    const to = journey.to || journey.pose;
    const dx = Number(to.x || 0) - Number(from.x || 0);
    const dz = Number(to.z || 0) - Number(from.z || 0);
    if (Math.hypot(dx, dz) > 0.001) lastYaw = Math.atan2(dx, dz);
    root.position.set(Number(journey.pose.x || 0), Number(journey.pose.y || 0.15) + 1.12, Number(journey.pose.z || 0));
    root.rotation.y = lastYaw;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(Number(seconds || 0) * 8) * 0.035;
    root.scaling.set(pulse, pulse, pulse);
    for (let index = 0; index < rings.length; index += 1) {
      rings[index].rotation.z = reducedMotion ? 0 : Number(seconds || 0) * (index % 2 ? -1.2 : 1.35);
    }
    for (let index = 0; index < trail.length; index += 1) {
      const wave = Math.sin(Number(seconds || 0) * 9 - index * 0.7) * 0.16;
      trail[index].position.x = wave;
      trail[index].position.y = Math.cos(Number(seconds || 0) * 7 - index) * 0.08;
      trail[index].visibility = Math.max(0.16, 0.9 - index / Math.max(1, trail.length));
    }
    root.setEnabled(true);
    active = true;
    lastProgress = Number(journey.progress || 0);
    return freeze({ ok: true, active: true, progress: lastProgress, yaw: lastYaw });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766H_TRANSIT_PRESENTER_SCHEMA,
    update,
    hide() { root.setEnabled(false); active = false; return freeze({ ok: true }); },
    dispose() {
      root.dispose(false, true);
      shellMaterial.dispose();
      windowMaterial.dispose();
      signalMaterial.dispose();
      goldMaterial.dispose();
    },
    getSummary() {
      return freeze({
        mounted: true,
        active,
        quality: profileId,
        reducedMotion: Boolean(reducedMotion),
        primitiveFallbackTruthful: true,
        certifiedCapsuleGlbPresent: false,
        trailCount: trail.length,
        ringCount: rings.length,
        progress: lastProgress,
        yaw: lastYaw,
        ownsEngine: false,
        ownsScene: false,
        ownsRenderLoop: false
      });
    }
  });
}
