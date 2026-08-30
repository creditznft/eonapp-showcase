/** W771C — canonical-scene presenter for modular five-zone environment kits. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { deriveEonExpanseW771BEnvironmentKitPlan, validateEonExpanseW771BEnvironmentKitPlan } from './eon-expanse-w771b-zone-environment-kit-plan.js';
import { deriveEonExpanseW771ERestorationArtState } from './eon-expanse-w771e-zone-restoration-art-state.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W771C_ENVIRONMENT_PRESENTER_SCHEMA = 'eon.expanse.zone-environment-kit-presenter.w771c.v1';

const safeColor = (value = '#25b6ff', fallback = '#25b6ff') => { try { return Color3.FromHexString(value); } catch { return Color3.FromHexString(fallback); } };
const materialFor = (scene, name, value, intensity = 0.45) => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = safeColor(value).scale(0.34);
  material.emissiveColor = safeColor(value).scale(intensity);
  material.specularColor = safeColor('#111827');
  return material;
};

function createModuleMesh(scene, entry) {
  const d = entry.dimensions || {};
  if (entry.type === 'ring') {
    const mesh = MeshBuilder.CreateTorus(`w771c-${entry.id}`, { diameter: Number(d.diameter || 4), thickness: Number(d.thickness || 0.12), tessellation: 48 }, scene);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }
  if (entry.type === 'crystal') return MeshBuilder.CreatePolyhedron(`w771c-${entry.id}`, { type: 1, size: Math.max(0.35, Number(d.width || 0.65)) }, scene);
  if (entry.type === 'drone') return MeshBuilder.CreatePolyhedron(`w771c-${entry.id}`, { type: 2, size: Math.max(0.28, Number(d.width || 0.62)) }, scene);
  if (entry.type === 'pylon' || entry.type === 'lamp') return MeshBuilder.CreateCylinder(`w771c-${entry.id}`, { diameterTop: entry.type === 'pylon' ? 0.12 : Number(d.width || 0.18), diameterBottom: Number(d.width || 0.3), height: Number(d.height || 2.4), tessellation: 16 }, scene);
  if (entry.type === 'altar') return MeshBuilder.CreateCylinder(`w771c-${entry.id}`, { diameterTop: Number(d.width || 1.6), diameterBottom: Number(d.depth || 2.2), height: Number(d.height || 1.1), tessellation: 28 }, scene);
  return MeshBuilder.CreateBox(`w771c-${entry.id}`, { width: Number(d.width || 1), height: Number(d.height || 1), depth: Number(d.depth || 1) }, scene);
}

export function mountEonExpanseW771CEnvironmentKitPresenter({
  scene,
  parent = null,
  quality = 'balanced',
  reducedMotion = false,
  worldSeed = 1
} = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const plan = deriveEonExpanseW771BEnvironmentKitPlan({ worldSeed, quality });
  const validation = validateEonExpanseW771BEnvironmentKitPlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: 'environment-kit-plan-invalid', validation });
  const root = new TransformNode('w771c-five-zone-environment-kit-root', scene);
  root.parent = parent || null;
  root.setEnabled(false);
  root.metadata = freeze({ schema: EON_EXPANSE_W771C_ENVIRONMENT_PRESENTER_SCHEMA, canonicalSceneOnly: true, finishedHeroPrimitiveCount: 0 });
  const materials = [];
  const zoneStates = new Map();
  const moduleStates = new Map();
  let active = false;
  let disposed = false;
  let milestones = new Set();
  let restorationArtState = deriveEonExpanseW771ERestorationArtState();
  // L95: these are background ambience only. Keep gameplay/camera full-rate while
  // bounding decorative transform writes in the large Signal scene.
  const animationCadenceSeconds = quality === 'lite' ? 0.12 : quality === 'cinematic' ? 0.06 : 0.08;
  let lastAnimationAt = -Infinity;

  for (const zone of plan.zones) {
    const zoneRoot = new TransformNode(`w771c-${zone.zoneId}-environment-root`, scene);
    zoneRoot.parent = root;
    const palette = zone.palette || {};
    const zoneMaterials = freeze({
      primary: materialFor(scene, `w771c-${zone.zoneId}-primary`, palette.primary || '#25b6ff', 0.52),
      secondary: materialFor(scene, `w771c-${zone.zoneId}-secondary`, palette.secondary || '#9d72ff', 0.44),
      warm: materialFor(scene, `w771c-${zone.zoneId}-warm`, palette.warm || '#ffbc62', 0.58)
    });
    materials.push(...Object.values(zoneMaterials));
    const entries = [];
    for (const entry of zone.modules) {
      const mesh = createModuleMesh(scene, entry);
      mesh.parent = zoneRoot;
      const baseY = Number(entry.position.y || 0) + (entry.type === 'ring' ? 0.32 : entry.type === 'drone' ? Number(entry.dimensions?.hover || 1.55) : Number(entry.dimensions?.height || 1) / 2);
      mesh.position.set(Number(entry.position.x || 0), baseY, Number(entry.position.z || 0));
      mesh.rotation.y = Number(entry.rotationY || 0);
      mesh.material = zoneMaterials[entry.materialSlot] || zoneMaterials.primary;
      mesh.checkCollisions = entry.collision === true;
      mesh.isPickable = false;
      mesh.metadata = freeze({ kind: 'expanse-modular-environment-prop', zoneId: zone.zoneId, moduleId: entry.id, moduleType: entry.type, restoredOnly: entry.restoredOnly, milestone: entry.milestone || '', finishedHeroBuilding: false, interactive: false });
      mesh.setEnabled(!entry.restoredOnly);
      if (!['ring', 'crystal', 'drone'].includes(entry.type)) {
        try { mesh.freezeWorldMatrix?.(); } catch {}
      }
      const state = freeze({ entry, mesh, baseY });
      entries.push(state);
      moduleStates.set(entry.id, state);
    }
    zoneStates.set(zone.zoneId, freeze({ zone, root: zoneRoot, entries: freeze(entries), materials: zoneMaterials }));
  }

  const applyProgress = (progress = {}) => {
    milestones = new Set((progress?.milestones || []).map(String));
    if (progress?.beaconOneStage >= 3) milestones.add('beacon-one-repaired');
    if (progress?.beaconTwoRepaired) milestones.add('beacon-two-repaired');
    if (progress?.regionalTransitRestored) milestones.add('regional-transit-restored');
    if (progress?.campaignComplete) milestones.add('campaign:signal-restoration:complete');
    if (progress?.companionBonded || progress?.companionRecovered) milestones.add('companion-bonded');
    restorationArtState = deriveEonExpanseW771ERestorationArtState({ ...progress, milestones: freeze([...milestones]) });
    const artByZone = new Map(restorationArtState.zones.map((zone) => [zone.zoneId, zone]));
    let restoredVisible = 0;
    for (const { entry, mesh } of moduleStates.values()) {
      const art = artByZone.get(entry.zoneId);
      const visible = !entry.restoredOnly || art?.revealRestorationModules === true;
      mesh.setEnabled(active && visible);
      if (entry.restoredOnly && visible) restoredVisible += 1;
    }
    for (const { zone, materials: zoneMaterials } of zoneStates.values()) {
      const art = artByZone.get(zone.zoneId);
      const palette = zone.palette || {};
      const circuit = Number(art?.circuitIntensity || 0.16);
      const warm = Number(art?.warmIntensity || 0.12);
      zoneMaterials.primary.emissiveColor = safeColor(palette.primary || '#25b6ff').scale(0.18 + circuit * 0.62);
      zoneMaterials.secondary.emissiveColor = safeColor(palette.secondary || '#9d72ff').scale(0.16 + circuit * 0.5);
      zoneMaterials.warm.emissiveColor = safeColor(palette.warm || '#ffbc62').scale(0.14 + warm * 0.68);
    }
    return freeze({ ok: true, restoredVisible, milestoneCount: milestones.size, restorationArtState, mutatesMissionState: false });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W771C_ENVIRONMENT_PRESENTER_SCHEMA,
    root,
    activate({ progress = {} } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'environment-kit-presenter-disposed' });
      active = true;
      root.setEnabled(true);
      applyProgress(progress);
      return freeze({ ok: true, active, canonicalScene: root.getScene?.() === scene });
    },
    deactivate() {
      active = false;
      root.setEnabled(false);
      return freeze({ ok: true, active: false });
    },
    applyProgress,
    update(seconds = 0) {
      if (!active || disposed || reducedMotion) return freeze({ ok: true, active, animatedModuleCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0);
      if (Number.isFinite(lastAnimationAt) && t - lastAnimationAt < animationCadenceSeconds) {
        return freeze({ ok: true, active, animatedModuleCount: 0, throttled: true, animationCadenceSeconds, ownsRenderLoop: false });
      }
      lastAnimationAt = t;
      let animatedModuleCount = 0;
      for (const { entry, mesh, baseY } of moduleStates.values()) {
        if (!mesh.isEnabled?.()) continue;
        if (entry.type === 'ring') { mesh.rotation.z = t * 0.08; animatedModuleCount += 1; }
        if (entry.type === 'crystal') { mesh.rotation.y = Number(entry.rotationY || 0) + t * 0.12; animatedModuleCount += 1; }
        if (entry.type === 'drone') { mesh.rotation.y = Number(entry.rotationY || 0) + t * 0.22; mesh.position.y = Number(baseY || 1.55) + Math.sin(t * 1.15 + mesh.position.x * 0.07) * 0.16; animatedModuleCount += 1; }
      }
      return freeze({ ok: true, active, animatedModuleCount, throttled: false, animationCadenceSeconds, ownsRenderLoop: false });
    },
    getSummary() {
      const artByZone = new Map(restorationArtState.zones.map((zone) => [zone.zoneId, zone]));
      const zoneSummaries = [...zoneStates.values()].map(({ zone, entries }) => freeze({
        zoneId: zone.zoneId,
        signature: zone.signature,
        moduleCount: entries.length,
        visibleModuleCount: entries.filter(({ mesh }) => mesh.isEnabled?.()).length,
        restoredModuleCount: entries.filter(({ entry, mesh }) => entry.restoredOnly && mesh.isEnabled?.()).length,
        artStage: artByZone.get(zone.zoneId)?.artStage || 'damaged',
        restorationPercent: Number(artByZone.get(zone.zoneId)?.restorationPercent || 0),
        transformationLabel: artByZone.get(zone.zoneId)?.transformationLabel || '',
        heroAssetId: zone.heroAssetId,
        finishedHeroPrimitiveCount: 0
      }));
      return freeze({
        schema: EON_EXPANSE_W771C_ENVIRONMENT_PRESENTER_SCHEMA,
        active,
        quality: plan.quality,
        zoneCount: zoneSummaries.length,
        moduleCount: plan.moduleCount,
        visibleModuleCount: zoneSummaries.reduce((sum, zone) => sum + zone.visibleModuleCount, 0),
        zones: freeze(zoneSummaries),
        milestoneCount: milestones.size,
        restorationArtState,
        reducedMotion: Boolean(reducedMotion),
        staticWorldMatrices: true,
        dynamicTransformTypes: freeze(['ring', 'crystal', 'drone']),
        canonicalScene: root.getScene?.() === scene,
        finishedHeroPrimitiveCount: 0,
        interactiveModuleCount: 0,
        ownsRenderLoop: false,
        privateContentStored: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      root.setEnabled(false);
      for (const material of materials) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      moduleStates.clear();
      zoneStates.clear();
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W771C_ENVIRONMENT_PRESENTER_SCHEMA, mountEonExpanseW771CEnvironmentKitPresenter });
