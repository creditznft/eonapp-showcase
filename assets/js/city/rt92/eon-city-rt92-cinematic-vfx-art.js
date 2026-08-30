/** RT92 Wave 8 — bounded cinematic reveal/VFX layer shared by all canonical EONCITY worlds. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { createEonCityRt92ArtCadence } from './eon-city-rt92-art-performance-master.js';

export const EON_CITY_RT92_CINEMATIC_VFX_SCHEMA = 'eon.city.cinematic-vfx-art.rt92.v1';
const freeze = Object.freeze;
const QUALITY = freeze({ lite: freeze({ rings: 1, motes: 4, fins: 2 }), balanced: freeze({ rings: 2, motes: 8, fins: 3 }), cinematic: freeze({ rings: 3, motes: 12, fins: 4 }) });
const PROFILES = freeze({
  'command-hub': freeze({ anchor: freeze({ x: 0, y: 0.8, z: 0 }), primary: '#5eeaff', secondary: '#9b82ff', radius: 4.6, height: 3.6, motion: 0.24 }),
  'signal-frontier': freeze({ anchor: freeze({ x: 0, y: 0.7, z: -4 }), primary: '#74f0c9', secondary: '#63dfff', radius: 5.4, height: 4.2, motion: 0.2 }),
  'storm-sector': freeze({ anchor: freeze({ x: 928, y: 0.8, z: -180 }), primary: '#8ee6ff', secondary: '#ab96ff', radius: 6.4, height: 5.0, motion: 0.34 }),
  'my-frontier': freeze({ anchor: freeze({ x: 0, y: 0.65, z: 0 }), primary: '#69e7ca', secondary: '#62dfff', radius: 5.0, height: 3.8, motion: 0.18 })
});

function makeMaterial(scene, name, color, emissiveScale = 0.5, alpha = 0.72) {
  const material = new StandardMaterial(name, scene);
  const c = Color3.FromHexString(color);
  material.diffuseColor = c.scale(0.16);
  material.emissiveColor = c.scale(emissiveScale);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  material.disableLighting = false;
  return material;
}

export function mountEonCityRt92CinematicVfxArt({ scene, parent = null, worldId = 'command-hub', quality = 'balanced', reducedMotion = false } = {}) {
  const profile = PROFILES[worldId];
  if (!scene || !profile) return freeze({ ok: false, reason: 'canonical-scene-and-known-world-required' });
  const cadence = createEonCityRt92ArtCadence({ quality, reducedMotion });
  const limits = QUALITY[quality] || QUALITY.balanced;
  const root = new TransformNode(`rt92-cinematic-vfx-${worldId}`, scene);
  if (parent) root.parent = parent;
  root.position.set(profile.anchor.x, profile.anchor.y, profile.anchor.z);
  root.metadata = freeze({ kind: 'rt92-cinematic-vfx', worldId, presentationOnly: true, blocksControl: false, cameraAuthority: false });
  root.setEnabled(false);

  const primary = makeMaterial(scene, `rt92-cinematic-${worldId}-primary`, profile.primary, 0.56, 0.58);
  const secondary = makeMaterial(scene, `rt92-cinematic-${worldId}-secondary`, profile.secondary, 0.46, 0.46);
  const rings = [];
  for (let i = 0; i < limits.rings; i += 1) {
    const ring = MeshBuilder.CreateTorus(`rt92-cinematic-${worldId}-ring-${i}`, { diameter: profile.radius * 2 + i * 1.15, thickness: 0.035 + i * 0.012, tessellation: 72 }, scene);
    ring.parent = root;
    ring.position.y = 0.12 + i * 0.42;
    ring.rotation.x = Math.PI / 2 + i * 0.12;
    ring.rotation.z = i * 0.44;
    ring.material = i % 2 ? secondary : primary;
    ring.isPickable = false;
    ring.checkCollisions = false;
    ring.metadata = freeze({ kind: 'rt92-cinematic-reveal-ring', worldId, decorativeOnly: true });
    rings.push(ring);
  }

  const fins = [];
  for (let i = 0; i < limits.fins; i += 1) {
    const angle = (i / Math.max(1, limits.fins)) * Math.PI * 2 + 0.28;
    const fin = MeshBuilder.CreateBox(`rt92-cinematic-${worldId}-fin-${i}`, { width: 0.055, height: profile.height * (0.7 + (i % 2) * 0.18), depth: 0.42 }, scene);
    fin.parent = root;
    fin.position.set(Math.sin(angle) * profile.radius * 0.74, profile.height * 0.38, Math.cos(angle) * profile.radius * 0.74);
    fin.rotation.y = angle;
    fin.material = i % 2 ? secondary : primary;
    fin.isPickable = false;
    fin.checkCollisions = false;
    fin.metadata = freeze({ kind: 'rt92-cinematic-light-fin', worldId, decorativeOnly: true });
    fins.push(fin);
  }

  const motes = [];
  for (let i = 0; i < limits.motes; i += 1) {
    const mote = MeshBuilder.CreatePolyhedron(`rt92-cinematic-${worldId}-mote-${i}`, { type: i % 2 ? 1 : 2, size: 0.055 + (i % 3) * 0.014 }, scene);
    mote.parent = root;
    mote.material = i % 3 === 0 ? secondary : primary;
    mote.isPickable = false;
    mote.checkCollisions = false;
    mote.metadata = freeze({ kind: 'rt92-cinematic-data-mote', worldId, decorativeOnly: true });
    motes.push(mote);
  }

  let active = false;
  let activatedAt = 0;
  let intensity = 1;
  let hazardSeverity = 0;
  const setActive = (next = false, at = 0) => {
    active = next === true;
    if (active) activatedAt = Number(at || 0);
    root.setEnabled(active);
    return freeze({ ok: true, active, activatedAt });
  };

  return freeze({
    ok: true,
    schema: EON_CITY_RT92_CINEMATIC_VFX_SCHEMA,
    worldId,
    root,
    setActive,
    activate(options = {}) {
      intensity = Math.max(0.35, Math.min(1.5, Number(options.intensity || 1)));
      hazardSeverity = Math.max(0, Math.min(4, Number(options.hazardSeverity || 0)));
      return setActive(true, options.at || 0);
    },
    deactivate() { return setActive(false); },
    applyState(options = {}) {
      intensity = Math.max(0.35, Math.min(1.5, Number(options.intensity ?? intensity)));
      hazardSeverity = Math.max(0, Math.min(4, Number(options.hazardSeverity ?? hazardSeverity)));
      if ('active' in options) setActive(options.active === true, options.at || 0);
      return freeze({ ok: true, active, intensity, hazardSeverity });
    },
    update(seconds = 0) {
      if (!active) return freeze({ ok: true, active: false, animatedCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0);
      const cadenceState = cadence.shouldUpdate('cinematic-vfx', t);
      if (!cadenceState.update) return freeze({ ok: true, active: true, animatedCount: 0, cadenceSkipped: true, ownsRenderLoop: false });
      if (!activatedAt && t > 0) activatedAt = t;
      const revealAge = Math.max(0, t - activatedAt);
      const reveal = reducedMotion ? 1 : Math.min(1, revealAge / 1.8);
      const hazardBoost = worldId === 'storm-sector' ? 1 + hazardSeverity * 0.08 : 1;
      let animatedCount = 0;
      for (let i = 0; i < rings.length; i += 1) {
        const ring = rings[i];
        if (!reducedMotion) ring.rotation.z += (i % 2 ? -1 : 1) * (0.0018 + profile.motion * 0.0022);
        const pulse = 0.94 + Math.sin(t * (0.72 + profile.motion) + i * 1.4) * 0.045 * intensity;
        ring.scaling.setAll(Math.max(0.2, reveal) * pulse * hazardBoost);
        ring.visibility = Math.min(0.82, (0.36 + reveal * 0.28) * intensity);
        animatedCount += 1;
      }
      for (let i = 0; i < fins.length; i += 1) {
        const fin = fins[i];
        fin.visibility = 0.28 + (Math.sin(t * 1.05 + i * 1.7) + 1) * 0.12 * intensity;
        animatedCount += 1;
      }
      for (let i = 0; i < motes.length; i += 1) {
        const phase = i * 1.913;
        const radius = profile.radius * (0.42 + (i % 4) * 0.11);
        const speed = profile.motion * (0.42 + (i % 3) * 0.13);
        const mote = motes[i];
        mote.position.set(Math.sin(t * speed + phase) * radius, 0.45 + ((i * 7) % 9) * 0.34 + Math.sin(t * 0.9 + phase) * 0.18, Math.cos(t * speed + phase) * radius);
        if (!reducedMotion) mote.rotation.y += 0.008 + speed * 0.02;
        mote.visibility = 0.44 + (Math.sin(t * 1.2 + phase) + 1) * 0.16;
        animatedCount += 1;
      }
      return freeze({ ok: true, active: true, animatedCount, reveal, hazardSeverity, ownsRenderLoop: false });
    },
    getSummary() {
      return freeze({ schema: EON_CITY_RT92_CINEMATIC_VFX_SCHEMA, worldId, quality: QUALITY[quality] ? quality : 'balanced', active, updateHz: cadence.plan.cinematicVfxHz, ringCount: rings.length, finCount: fins.length, moteCount: motes.length, blocksControl: false, ownsCamera: false, ownsEngine: false, ownsScene: false, ownsRenderLoop: false, ownsNavigation: false, ownsCollision: false, writesProgression: false, firstFrameNewBinaryBytes: 0, externalTextures: 0 });
    },
    dispose() {
      active = false;
      try { root.dispose?.(false, true); } catch {}
      try { primary.dispose?.(); } catch {}
      try { secondary.dispose?.(); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_RT92_CINEMATIC_VFX_SCHEMA, mountEonCityRt92CinematicVfxArt });
