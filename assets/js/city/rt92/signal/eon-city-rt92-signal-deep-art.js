import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { EON_EXPANSE_W766_ZONES } from '../../w766/eon-expanse-w766-region-contract.js';

export const EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA = 'eon.city.signal-frontier.deep-art.rt92.v1';
const freeze = Object.freeze;
const QUALITY = freeze({ lite: 0.62, balanced: 0.84, cinematic: 1 });

function q(value = 'balanced') { const id = String(value || '').toLowerCase(); return QUALITY[id] ? id : 'balanced'; }
function c(value, fallback = '#77ddd8') { try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); } }
function mat(scene, name, base, emissive = base, intensity = 0.14) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = c(base).scale(0.28);
  m.emissiveColor = c(emissive).scale(intensity);
  m.specularColor = c('#111717');
  return m;
}

export function buildEonCityRt92SignalDeepArtPlan({ quality = 'balanced', reducedMotion = false } = {}) {
  const qualityId = q(quality);
  const factor = QUALITY[qualityId];
  const scale = (base, min = 1) => Math.max(min, Math.round(base * factor));
  return freeze({
    schema: EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA,
    worldId: 'signal-frontier',
    quality: qualityId,
    zones: freeze([
      freeze({ id: 'gateway-overlook', signature: 'broken-grand-signal-arch', supports: scale(10, 6), storyProps: scale(8, 5) }),
      freeze({ id: 'beacon-fields', signature: 'rhythmic-relay-field', supports: scale(18, 10), storyProps: scale(10, 6) }),
      freeze({ id: 'archive-ruins', signature: 'monolith-excavation-ruins', supports: scale(14, 8), storyProps: scale(12, 7) }),
      freeze({ id: 'transit-scar', signature: 'fractured-linear-transit-wound', supports: scale(16, 9), storyProps: scale(10, 6) }),
      freeze({ id: 'horizon-vault', signature: 'monumental-ordered-vault-approach', supports: scale(16, 9), storyProps: scale(8, 5) })
    ]),
    restoration: freeze({ brokenToOperational: true, activateRouteLights: true, alignSignalElements: !reducedMotion, increaseLocalActivity: true }),
    performance: freeze({ proceduralGeometryOnly: true, firstFrameHubBinaryDelta: 0, mountedOnlyOnSignalEntry: true, ownsRenderLoop: false, remoteTextures: false })
  });
}

export function validateEonCityRt92SignalDeepArtPlan(plan = buildEonCityRt92SignalDeepArtPlan()) {
  const errors = [];
  if (plan?.schema !== EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA || plan?.worldId !== 'signal-frontier') errors.push('schema-world');
  if (plan?.zones?.length !== 5) errors.push('zone-count');
  for (const zone of plan?.zones || []) if (!zone.signature || zone.supports < 6 || zone.storyProps < 5) errors.push(`zone:${zone?.id || 'missing'}`);
  if (plan?.restoration?.brokenToOperational !== true || plan?.restoration?.activateRouteLights !== true) errors.push('restoration');
  if (plan?.performance?.proceduralGeometryOnly !== true || plan?.performance?.mountedOnlyOnSignalEntry !== true || plan?.performance?.ownsRenderLoop !== false || plan?.performance?.remoteTextures !== false) errors.push('performance');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plan });
}

export function mountEonCityRt92SignalDeepArt({ scene, parent = null, quality = 'balanced', reducedMotion = false } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const plan = buildEonCityRt92SignalDeepArtPlan({ quality, reducedMotion });
  const validation = validateEonCityRt92SignalDeepArtPlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: 'rt92-signal-plan-invalid', validation });
  const root = new TransformNode('rt92-signal-deep-art-root', scene);
  root.parent = parent || null;
  root.setEnabled(false);
  const structural = mat(scene, 'rt92-signal-structural', '#202d2e', '#315052', 0.06);
  const weathered = mat(scene, 'rt92-signal-weathered', '#26383a', '#395d60', 0.08);
  const accent = mat(scene, 'rt92-signal-accent', '#315b5c', '#77ddd8', 0.34);
  const archive = mat(scene, 'rt92-signal-archive', '#355a4d', '#8ed5b5', 0.26);
  const warm = mat(scene, 'rt92-signal-warm', '#6a5132', '#dfaf72', 0.28);
  const materials = [structural, weathered, accent, archive, warm];
  const animated = [];
  const restoredOnly = [];
  const staticNodes = [];
  let active = false;
  let disposed = false;
  let restoration = 0;

  const add = (mesh, material, x, y, z, ry = 0, { animate = '', restored = false } = {}) => {
    mesh.parent = root; mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.material = material; mesh.isPickable = false; mesh.checkCollisions = false;
    mesh.metadata = freeze({ kind: 'rt92-signal-environment-art', animate, restoredOnly: restored, interactive: false, finishedHeroBuilding: false });
    if (animate) animated.push(freeze({ mesh, kind: animate, baseY: y, phase: animated.length * 0.71 })); else staticNodes.push(mesh);
    if (restored) { restoredOnly.push(mesh); mesh.setEnabled(false); }
    return mesh;
  };

  for (const zonePlan of plan.zones) {
    const zone = EON_EXPANSE_W766_ZONES.find((entry) => entry.id === zonePlan.id);
    if (!zone) continue;
    const zx = zone.x; const zz = zone.z;
    if (zone.id === 'gateway-overlook') {
      for (let i = 0; i < zonePlan.supports; i += 1) {
        const side = i % 2 ? -1 : 1; const row = Math.floor(i / 2); const h = 2.3 + (row % 3) * 0.55;
        add(MeshBuilder.CreateBox(`rt92-signal-gateway-rib-${i}`, { width: 0.22, height: h, depth: 0.34 }, scene), structural, zx + side * (4.2 + row * 1.5), h / 2, zz - 3.5 - row * 1.4, side * 0.14);
      }
      for (let i = 0; i < zonePlan.storyProps; i += 1) {
        const a = (i / zonePlan.storyProps) * Math.PI * 1.25 - 0.7;
        add(MeshBuilder.CreateCylinder(`rt92-signal-overlook-relay-${i}`, { diameterTop: 0.08, diameterBottom: 0.28, height: 2.1 + (i % 3) * 0.45, tessellation: 10 }, scene), i % 3 === 0 ? warm : accent, zx + Math.sin(a) * 10.5, 1.2, zz + Math.cos(a) * 7.2, -a, { animate: i % 4 === 0 ? 'scan' : '' });
      }
      const archA = add(MeshBuilder.CreateTorus('rt92-signal-broken-grand-arch-a', { diameter: 15.5, thickness: 0.22, tessellation: 72, arc: 0.43 }, scene), weathered, zx, 5.6, zz - 10.5, Math.PI / 2);
      archA.rotation.x = Math.PI / 2; archA.rotation.z = -0.22;
      const archB = add(MeshBuilder.CreateTorus('rt92-signal-broken-grand-arch-b', { diameter: 15.5, thickness: 0.18, tessellation: 72, arc: 0.31 }, scene), accent, zx, 5.6, zz - 10.5, Math.PI / 2, { restored: true, animate: 'ring' });
      archB.rotation.x = Math.PI / 2; archB.rotation.z = 0.34;
    }
    if (zone.id === 'beacon-fields') {
      for (let i = 0; i < zonePlan.supports; i += 1) {
        const row = Math.floor(i / 4); const col = i % 4; const x = zx - 10 + col * 6.2 + (row % 2) * 1.7; const z = zz - 10 + row * 5.1;
        const h = 2.4 + (i % 5) * 0.5;
        add(MeshBuilder.CreateCylinder(`rt92-signal-beacon-mast-${i}`, { diameterTop: 0.06, diameterBottom: 0.26 + (i % 2) * 0.08, height: h, tessellation: 10 }, scene), i % 5 === 0 ? warm : structural, x, h / 2, z, (i % 3) * 0.2, { animate: i % 4 === 0 ? 'scan' : '' });
        if (i % 3 === 0) { const r = add(MeshBuilder.CreateTorus(`rt92-signal-beacon-ring-${i}`, { diameter: 1.1 + (i % 2) * 0.3, thickness: 0.045, tessellation: 28 }, scene), accent, x, h * 0.72, z, 0, { animate: 'ring' }); r.rotation.x = Math.PI / 2; }
      }
      for (let i = 0; i < zonePlan.storyProps; i += 1) add(MeshBuilder.CreateBox(`rt92-signal-beacon-trench-${i}`, { width: 0.12, height: 0.025, depth: 3.6 + (i % 3) }, scene), i % 2 ? accent : archive, zx - 11 + i * 3.4, 0.05, zz + 8 - (i % 3) * 5, (i % 2 ? 0.2 : -0.2), { restored: i % 3 === 0 });
    }
    if (zone.id === 'archive-ruins') {
      for (let i = 0; i < zonePlan.supports; i += 1) {
        const a = (i / zonePlan.supports) * Math.PI * 2; const r = 8 + (i % 3) * 3.2; const h = 2.2 + (i % 5) * 0.9;
        const monolith = add(MeshBuilder.CreateBox(`rt92-signal-archive-monolith-${i}`, { width: 1.05 + (i % 2) * 0.5, height: h, depth: 0.62 }, scene), i % 4 === 0 ? archive : weathered, zx + Math.sin(a) * r, h / 2 - 0.15, zz + Math.cos(a) * r, -a + (i % 2 ? 0.18 : -0.24));
        monolith.rotation.z = (i % 4 - 1.5) * 0.055;
      }
      for (let i = 0; i < zonePlan.storyProps; i += 1) {
        const x = zx - 10 + (i % 4) * 6.4; const z = zz - 8 + Math.floor(i / 4) * 7.2;
        add(MeshBuilder.CreateBox(`rt92-signal-archive-scaffold-${i}`, { width: 2.6, height: 0.12, depth: 0.55 }, scene), i % 2 ? structural : warm, x, 1.0 + (i % 3) * 0.65, z, (i % 2 ? 0.35 : -0.35), { restored: i % 4 === 0 });
      }
    }
    if (zone.id === 'transit-scar') {
      for (let i = 0; i < zonePlan.supports; i += 1) {
        const x = zx - 18 + i * 2.5; const z = zz + Math.sin(i * 0.72) * 5.5; const y = 1.6 + (i % 4) * 0.38;
        const rail = add(MeshBuilder.CreateBox(`rt92-signal-transit-fracture-${i}`, { width: 3.6, height: 0.18, depth: 0.42 }, scene), i % 5 === 0 ? warm : structural, x, y, z, 0.08 + (i % 3 - 1) * 0.18);
        rail.rotation.z = (i % 4 - 1.5) * 0.06;
      }
      for (let i = 0; i < zonePlan.storyProps; i += 1) {
        const x = zx - 12 + i * 4.6; const z = zz + 9 - (i % 3) * 8;
        add(MeshBuilder.CreateBox(`rt92-signal-transit-gantry-${i}`, { width: 0.25, height: 3.5 + (i % 3) * 0.7, depth: 0.32 }, scene), i % 3 === 0 ? accent : weathered, x, 2.0, z, (i % 2 ? 0.15 : -0.15), { restored: i % 4 === 0 });
      }
    }
    if (zone.id === 'horizon-vault') {
      for (let i = 0; i < zonePlan.supports; i += 1) {
        const side = i % 2 ? -1 : 1; const row = Math.floor(i / 2); const z = zz + 18 - row * 4.2; const x = zx + side * (6.8 + (row % 2) * 1.2); const h = 2.6 + row * 0.16;
        add(MeshBuilder.CreateBox(`rt92-signal-vault-approach-pylon-${i}`, { width: 0.35, height: h, depth: 0.52 }, scene), row % 3 === 0 ? archive : structural, x, h / 2, z, side * 0.08, { restored: row > 2 && row % 2 === 0 });
      }
      for (let i = 0; i < zonePlan.storyProps; i += 1) {
        const ring = add(MeshBuilder.CreateTorus(`rt92-signal-vault-ceremony-ring-${i}`, { diameter: 4.6 + i * 1.55, thickness: 0.06, tessellation: 56 }, scene), i % 2 ? archive : accent, zx, 0.32 + i * 0.03, zz + 8 - i * 3.2, 0, { animate: i % 2 === 0 ? 'ring' : '', restored: i >= Math.floor(zonePlan.storyProps / 2) });
        ring.rotation.x = Math.PI / 2;
      }
    }
  }

  for (const mesh of staticNodes) try { mesh.freezeWorldMatrix?.(); } catch {}
  const applyProgress = (progress = {}) => {
    const milestones = Array.isArray(progress?.milestones) ? progress.milestones.length : 0;
    const completed = progress?.campaignComplete === true || progress?.campaignCompleted === true;
    restoration = completed ? 1 : Math.min(0.85, milestones / 8 + (progress?.regionalTransitRestored ? 0.18 : 0));
    const revealCount = Math.round(restoredOnly.length * restoration);
    restoredOnly.forEach((mesh, index) => mesh.setEnabled(active && index < revealCount));
    return freeze({ ok: true, restoration, revealCount, mutatesMissionState: false });
  };
  return freeze({
    ok: true,
    schema: EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA,
    root,
    activate({ progress = {} } = {}) { if (disposed) return freeze({ ok: false, reason: 'disposed' }); active = true; root.setEnabled(true); applyProgress(progress); return freeze({ ok: true, active: true }); },
    deactivate() { active = false; root.setEnabled(false); return freeze({ ok: true, active: false }); },
    applyProgress,
    update(seconds = 0) {
      if (!active || disposed || reducedMotion) return freeze({ ok: true, animatedCount: 0, ownsRenderLoop: false });
      let count = 0; const t = Number(seconds || 0);
      for (const entry of animated) {
        if (!entry.mesh.isEnabled?.()) continue;
        if (entry.kind === 'ring') entry.mesh.rotation.z += 0.0012 + (entry.phase % 3) * 0.0002;
        else if (entry.kind === 'scan') entry.mesh.rotation.y = Math.sin(t * 0.22 + entry.phase) * 0.4;
        count += 1;
      }
      return freeze({ ok: true, animatedCount: count, ownsRenderLoop: false });
    },
    getSummary() { return freeze({ schema: EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA, active, quality: plan.quality, zoneCount: plan.zones.length, staticNodeCount: staticNodes.length, animatedNodeCount: animated.length, restoredNodeCount: restoredOnly.length, restoration, firstFrameHubBinaryDelta: 0, ownsRenderLoop: false, remoteTextures: false }); },
    dispose() { if (disposed) return freeze({ ok: true, alreadyDisposed: true }); disposed = true; active = false; root.setEnabled(false); for (const m of materials) try { m.dispose?.(); } catch {} try { root.dispose?.(false, true); } catch {} return freeze({ ok: true }); }
  });
}

export default freeze({ EON_CITY_RT92_SIGNAL_DEEP_ART_SCHEMA, buildEonCityRt92SignalDeepArtPlan, validateEonCityRt92SignalDeepArtPlan, mountEonCityRt92SignalDeepArt });
