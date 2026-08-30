/**
 * W792C — canonical-scene Storm Sector presenter with LOD, stale-load cancellation and disposal.
 * It remains dormant until an exact later activation authority is supplied.
 */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../l95/eon-city-l95-progressive-asset-admission.js';
import {
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
  validateEonExpanseW792AStormSectorPackage
} from './eon-expanse-w792a-storm-sector-authored-package.js';
import {
  createEonExpanseW792BStormSectorPlan,
  validateEonExpanseW792BStormSectorPlan,
  resolveEonExpanseW792BStormSectorZone
} from './eon-expanse-w792b-storm-sector-layout.js';
import { mountEonCityRt92StormDeepArt } from '../rt92/storm/eon-city-rt92-storm-deep-art.js';
import { mountEonCityRt92EnvironmentalLifeArt } from '../rt92/eon-city-rt92-environmental-life-art.js';
import { mountEonCityRt92CinematicVfxArt } from '../rt92/eon-city-rt92-cinematic-vfx-art.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W792C_STORM_SECTOR_PRESENTER_SCHEMA = 'eon.expanse.storm-sector.presenter.w792c.v1';

function splitAssetPath(assetPath = '') {
  const value = String(assetPath || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
}

function validStormAsset(assetPath = '') {
  return /^\/assets\/city\/future-regions\/storm-sector\/models\/(storm-command-spire|atmospheric-stabilizer|charged-transit-gate)-lod[012]\.glb$/i.test(String(assetPath || ''));
}

function renderable(mesh) {
  try { return Boolean(mesh && !mesh.isDisposed?.() && (Number(mesh.getTotalVertices?.() || 0) > 0 || mesh.geometry)); } catch { return false; }
}

function visible(mesh) {
  try { return renderable(mesh) && mesh.isEnabled?.() !== false && mesh.isVisible !== false && Number(mesh.visibility ?? 1) > 0.01; } catch { return false; }
}

function collectBounds(meshes = []) {
  let minX = Infinity; let minY = Infinity; let minZ = Infinity;
  let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo?.().boundingBox;
      if (!box) continue;
      minX = Math.min(minX, box.minimumWorld.x); minY = Math.min(minY, box.minimumWorld.y); minZ = Math.min(minZ, box.minimumWorld.z);
      maxX = Math.max(maxX, box.maximumWorld.x); maxY = Math.max(maxY, box.maximumWorld.y); maxZ = Math.max(maxZ, box.maximumWorld.z);
    } catch {}
  }
  if (![minX, minY, minZ, maxX, maxY, maxZ].every(Number.isFinite)) return null;
  return freeze({ minX, minY, minZ, maxX, maxY, maxZ, width: maxX - minX, height: maxY - minY, depth: maxZ - minZ });
}

function makeMaterial(scene, name, color, emission = 0.2, alpha = 1) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(color).scale(0.34);
  material.emissiveColor = Color3.FromHexString(color).scale(emission);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  return material;
}

function freezeStaticNode(node) {
  try { node?.freezeWorldMatrix?.(); } catch {}
  return node;
}

function disposeHero(entry = {}) {
  try { entry.container?.dispose?.(); } catch {}
  try { entry.wrapper?.dispose?.(false, true); } catch {}
}

function authorizedActivation(activation = null) {
  return activation?.active === true
    && activation?.regionId === 'storm-sector'
    && activation?.gatewayId === 'future-gateway-storm-sector'
    && activation?.packageDigest === EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST
    && activation?.explicitOwnerAction === true
    && activation?.automaticActivation === false;
}

export function mountEonExpanseW792CStormSectorPresenter({ scene, parent = null, reducedMotion = false, assetAdmission = null } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const packageValidation = validateEonExpanseW792AStormSectorPackage();
  if (!packageValidation.ok) return freeze({ ok: false, reason: `storm-package-invalid:${packageValidation.errors.join(',')}` });

  const root = new TransformNode('w792c-storm-sector-root', scene);
  if (parent) root.parent = parent;
  root.setEnabled?.(false);
  root.metadata = freeze({ kind: 'future-region-root', regionId: 'storm-sector', canonicalScene: true, developmentProxy: false });

  const materials = freeze({
    ground: makeMaterial(scene, 'w792c-storm-ground', '#07101a', 0.05),
    route: makeMaterial(scene, 'w792c-storm-route', '#2cbcff', 0.42),
    circuit: makeMaterial(scene, 'w792c-storm-circuit', '#8d7dff', 0.62),
    warning: makeMaterial(scene, 'w792c-storm-warning', '#ff9f5a', 0.68),
    storm: makeMaterial(scene, 'w792c-storm-electric', '#b5a7ff', 0.76, 0.86),
    cell: makeMaterial(scene, 'w792c-storm-cell', '#102133', 0.12, 0.82)
  });
  const cells = new Map();
  const heroes = new Map();
  const pending = new Set();
  const heroQueue = [];
  const maxConcurrentHeroLoads = 2;
  let desiredHeroAdmission = freeze({ pressure: assetAdmission?.pressure || 'nominal', visibility: assetAdmission?.visibility || 'visible', reason: assetAdmission?.reason || 'storm-first-entry' });
  let heroAdmission = buildEonCityL95ProgressiveAssetAdmission({ ...desiredHeroAdmission, maxConcurrentLoads: maxConcurrentHeroLoads });
  let activeHeroLoads = 0;
  const revisions = new Map();
  const routeMeshes = new Map();
  const environmentMeshes = new Map();
  let stormEyeRoot = null;
  let disposed = false;
  let active = false;
  let suspended = false;
  let currentQuality = 'balanced';
  let currentPlan = null;
  let lastZone = null;
  let lastActivationDigest = '';
  const rt92StormDeepArt = mountEonCityRt92StormDeepArt({ scene, parent: root, quality: currentQuality, reducedMotion });
  const rt92EnvironmentalLife = mountEonCityRt92EnvironmentalLifeArt({ scene, parent: root, worldId: 'storm-sector', quality: currentQuality, reducedMotion });
  const rt92CinematicVfx = mountEonCityRt92CinematicVfxArt({ scene, parent: root, worldId: 'storm-sector', quality: currentQuality, reducedMotion });
  if (!rt92StormDeepArt?.ok || !rt92EnvironmentalLife?.ok || !rt92CinematicVfx?.ok) {
    try { root.dispose?.(false, true); } catch {}
    for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
    try { rt92CinematicVfx?.dispose?.(); rt92EnvironmentalLife?.dispose?.(); rt92StormDeepArt?.dispose?.(); } catch {}
    return freeze({ ok: false, reason: `rt92-storm-art-mount-failed:${rt92StormDeepArt?.reason || rt92EnvironmentalLife?.reason || rt92CinematicVfx?.reason || 'unknown'}` });
  }

  const clearHero = (heroId) => {
    revisions.set(heroId, Number(revisions.get(heroId) || 0) + 1);
    const current = heroes.get(heroId);
    if (current) disposeHero(current);
    heroes.delete(heroId);
  };

  const clearWorld = () => {
    for (const heroId of [...new Set([...heroes.keys(), ...revisions.keys()])]) clearHero(heroId);
    heroQueue.length = 0;
    for (const node of cells.values()) try { node.dispose?.(false, true); } catch {}
    cells.clear();
    for (const mesh of routeMeshes.values()) try { mesh.dispose?.(); } catch {}
    routeMeshes.clear();
    for (const mesh of environmentMeshes.values()) try { mesh.dispose?.(); } catch {}
    environmentMeshes.clear();
    try { stormEyeRoot?.dispose?.(false, true); } catch {}
    stormEyeRoot = null;
    currentPlan = null;
    active = false;
    suspended = false;
    lastZone = null;
    rt92StormDeepArt?.deactivate?.();
    rt92EnvironmentalLife?.setActive?.(false);
    rt92CinematicVfx?.deactivate?.();
    root.setEnabled?.(false);
  };

  const syncCellsAndRoutes = (plan) => {
    const desiredCellIds = new Set(plan.cells.map((cell) => cell.id));
    for (const [cellId, node] of [...cells.entries()]) {
      if (desiredCellIds.has(cellId)) continue;
      try { node.dispose?.(false, true); } catch {}
      cells.delete(cellId);
    }

    for (const cell of plan.cells) {
      if (cells.has(cell.id)) continue;
      const node = new TransformNode(`w792c-${cell.id}`, scene);
      node.parent = root;
      node.position.set(cell.worldOrigin.x, cell.worldOrigin.y, cell.worldOrigin.z);
      node.metadata = freeze({ kind: 'future-region-stream-cell', regionId: 'storm-sector', cellId: cell.id, ring: cell.ring, interactive: false });
      const platform = MeshBuilder.CreateCylinder(`w792c-${cell.id}-platform`, { diameter: cell.ring === 'interactive' ? 42 : 34, height: 0.45, tessellation: 48 }, scene);
      platform.parent = node;
      platform.position.y = -0.2;
      platform.material = materials.cell;
      platform.checkCollisions = cell.ring === 'interactive';
      platform.isPickable = false;
      platform.metadata = freeze({ kind: 'future-region-ground-connector', regionId: 'storm-sector', developmentProxy: false, finishedHero: false });
      freezeStaticNode(platform);

      // L95: give every streamed shelf an authored visual grammar without
      // manufacturing another hero mesh. Rims and pylons are low-cost support
      // geometry and disappear automatically when this cell is pruned.
      const rim = MeshBuilder.CreateTorus(`w792c-${cell.id}-charged-rim`, { diameter: cell.ring === 'interactive' ? 39 : 31, thickness: 0.12, tessellation: 48 }, scene);
      rim.parent = node;
      rim.position.y = 0.08;
      rim.rotation.x = Math.PI / 2;
      rim.material = cell.ring === 'interactive' ? materials.circuit : materials.route;
      rim.checkCollisions = false;
      rim.isPickable = false;
      rim.metadata = freeze({ kind: 'storm-sector-environment-support', family: 'charged-fog', finishedHero: false, interactive: false });
      freezeStaticNode(rim);

      const pylonCount = cell.ring === 'interactive' ? 2 : cell.ring === 'visible' ? 1 : 0;
      for (let index = 0; index < pylonCount; index += 1) {
        const side = index === 0 ? -1 : 1;
        const pylon = MeshBuilder.CreateCylinder(`w792c-${cell.id}-signal-pylon-${index + 1}`, { diameterTop: 0.16, diameterBottom: 0.52, height: cell.ring === 'interactive' ? 5.4 : 4.2, tessellation: 12 }, scene);
        pylon.parent = node;
        pylon.position.set(side * 11.5, cell.ring === 'interactive' ? 2.7 : 2.1, (index % 2 === 0 ? 1 : -1) * 7.5);
        pylon.material = index % 2 === 0 ? materials.route : materials.warning;
        pylon.checkCollisions = false;
        pylon.isPickable = false;
        pylon.metadata = freeze({ kind: 'storm-sector-environment-support', family: 'signal-pylons', finishedHero: false, interactive: false });
        freezeStaticNode(pylon);
      }
      cells.set(cell.id, node);
    }

    for (const route of plan.routes) {
      if (routeMeshes.has(route.id)) continue;
      const dx = route.to.x - route.from.x;
      const dz = route.to.z - route.from.z;
      const length = Math.hypot(dx, dz);
      const mesh = MeshBuilder.CreateBox(`w792c-${route.id}`, { width: route.width, height: 0.24, depth: length }, scene);
      mesh.parent = root;
      mesh.position.set((route.from.x + route.to.x) / 2, route.from.y, (route.from.z + route.to.z) / 2);
      mesh.rotation.y = Math.atan2(dx, dz);
      mesh.material = materials.ground;
      mesh.checkCollisions = true;
      mesh.isPickable = false;
      mesh.metadata = freeze({ kind: 'future-region-authored-route-connector', regionId: 'storm-sector', routeId: route.id, developmentProxy: false, finishedHero: false });
      const circuit = MeshBuilder.CreateBox(`w792c-${route.id}-circuit`, { width: 0.18, height: 0.04, depth: length * 0.92 }, scene);
      circuit.parent = root;
      circuit.position.set(mesh.position.x, mesh.position.y + 0.16, mesh.position.z);
      circuit.rotation.y = mesh.rotation.y;
      circuit.material = materials.circuit;
      circuit.isPickable = false;
      circuit.checkCollisions = false;
      routeMeshes.set(route.id, mesh);
      routeMeshes.set(`${route.id}:circuit`, circuit);
    }

    // Storm Eye is a region-scale environmental spectacle rather than another
    // fake building. Its ring count follows the live quality tier and is pruned
    // immediately when the renderer degrades under pressure.
    if (!stormEyeRoot) {
      stormEyeRoot = new TransformNode('w792c-storm-eye-vortex-root', scene);
      stormEyeRoot.parent = root;
      stormEyeRoot.position.set(1124, 0, -180);
      stormEyeRoot.metadata = freeze({ kind: 'storm-sector-environment-root', family: 'electrical-storms', finishedHero: false, interactive: false });
    }
    const desiredRingCount = plan.quality === 'cinematic' ? 3 : plan.quality === 'balanced' ? 2 : 1;
    for (let index = 0; index < desiredRingCount; index += 1) {
      const id = `storm-eye-ring:${index}`;
      if (environmentMeshes.has(id)) continue;
      const ring = MeshBuilder.CreateTorus(`w792c-storm-eye-ring-${index + 1}`, { diameter: 17 + index * 8, thickness: 0.16 + index * 0.035, tessellation: plan.quality === 'lite' ? 40 : 56 }, scene);
      ring.parent = stormEyeRoot;
      ring.position.y = 3.2 + index * 3.0;
      ring.rotation.x = Math.PI / 2 + index * 0.12;
      ring.rotation.z = index * 0.4;
      ring.material = index === 1 ? materials.warning : materials.storm;
      ring.checkCollisions = false;
      ring.isPickable = false;
      ring.metadata = freeze({ kind: 'storm-sector-environment-support', family: 'electrical-storms', ringIndex: index, finishedHero: false, interactive: false });
      environmentMeshes.set(id, ring);
    }
    for (const [id, mesh] of [...environmentMeshes.entries()]) {
      if (!id.startsWith('storm-eye-ring:')) continue;
      const index = Number(id.split(':')[1]);
      if (index < desiredRingCount) continue;
      try { mesh.dispose?.(); } catch {}
      environmentMeshes.delete(id);
    }

    return freeze({
      ok: true,
      activeCellCount: cells.size,
      expectedCellCount: plan.cells.length,
      stormEyeRingCount: desiredRingCount,
      qualityPruningApplied: cells.size === plan.cells.length
    });
  };

  const loadHero = async (placement, revision) => {
    const lod = placement?.lod;
    const heroId = String(placement?.id || '');
    if (!validStormAsset(lod?.url)) {
      const rejected = freeze({ ok: false, heroId, status: 'rejected-authored-hero', reason: 'storm-asset-path-invalid', truth: null });
      if (!disposed && revisions.get(heroId) === revision) heroes.set(heroId, rejected);
      return rejected;
    }
    let container = null;
    let wrapper = null;
    try {
      const { rootUrl, fileName } = splitAssetPath(lod.url);
      container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
      if (disposed || revisions.get(heroId) !== revision || !active) {
        try { container.dispose?.(); } catch {}
        if (!disposed && suspended && revisions.get(heroId) === revision && !heroQueue.some((item) => item?.placement?.id === heroId && item?.revision === revision)) {
          heroes.set(heroId, freeze({ ok: true, heroId, status: 'queued-authored-hero', lod: placement.lod.level }));
          heroQueue.push({ placement, revision });
        }
        return freeze({ ok: false, heroId, status: 'stale-authored-hero-load' });
      }
      container.addAllToScene?.();
      wrapper = new TransformNode(`w792c-${heroId}-wrapper`, scene);
      wrapper.parent = root;
      wrapper.position.set(placement.position.x, placement.position.y, placement.position.z);
      wrapper.rotation.y = placement.rotationY;
      for (const node of container.rootNodes || []) node.parent = wrapper;
      for (const mesh of container.meshes || []) {
        mesh.isPickable = false;
        mesh.checkCollisions = true;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'future-region-authored-hero', regionId: 'storm-sector', heroId, lod: lod.level, developmentProxy: false, finishedHeroPrimitive: false });
      }
      const meshes = container.meshes || [];
      const sourceBounds = collectBounds(meshes);
      let appliedScale = 1;
      if (sourceBounds?.height > 0.001) {
        appliedScale = Number(placement.targetHeight) / sourceBounds.height;
        wrapper.scaling.setAll(appliedScale);
        wrapper.computeWorldMatrix?.(true);
      }
      const scaledBounds = collectBounds(meshes);
      let groundOffset = 0;
      if (scaledBounds) {
        groundOffset = placement.position.y - scaledBounds.minY;
        wrapper.position.y += groundOffset;
        wrapper.computeWorldMatrix?.(true);
      }
      const finalBounds = collectBounds(meshes);
      const renderableMeshes = meshes.filter(renderable);
      const visibleMeshes = renderableMeshes.filter(visible);
      const materialsValid = new Set([...(container.materials || []), ...renderableMeshes.map((mesh) => mesh.material).filter(Boolean)]).size;
      const truth = evaluateEonExpanseW767AAssetPresentation({
        placement: { id: `storm-sector-${heroId}`, zoneId: 'storm-sector', assetId: heroId, position: placement.position, targetHeight: placement.targetHeight },
        assetId: heroId,
        requestedPath: lod.url,
        variant: `lod${lod.level}`,
        loadStatus: 'loaded',
        meshCount: meshes.length,
        renderableMeshCount: renderableMeshes.length,
        visibleMeshCount: visibleMeshes.length,
        materialCount: materialsValid,
        animationGroupCount: container.animationGroups?.length || 0,
        sourceBounds,
        worldBounds: finalBounds,
        appliedScale,
        finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
        groundOffset,
        lodState: `lod${lod.level}`,
        drawCallContribution: visibleMeshes.length
      });
      if (!truth.ok) {
        disposeHero({ container, wrapper });
        const rejected = freeze({ ok: false, heroId, status: 'rejected-authored-hero', reason: truth.failureReason || 'visible-validation-failed', truth });
        if (!disposed && revisions.get(heroId) === revision) heroes.set(heroId, rejected);
        return rejected;
      }
      // Storm hero structures are static authored architecture. Keep only the
      // storm-eye effects dynamic; validated GLB transforms can remain frozen.
      freezeStaticNode(wrapper);
      for (const mesh of meshes) freezeStaticNode(mesh);
      const state = freeze({ ok: true, heroId, status: 'presented-authored-hero', lod: lod.level, wrapper, container, truth, developmentProxy: false });
      if (!disposed && revisions.get(heroId) === revision && (active || suspended)) heroes.set(heroId, state);
      else disposeHero(state);
      return state;
    } catch (error) {
      disposeHero({ container, wrapper });
      const rejected = freeze({ ok: false, heroId, status: 'rejected-authored-hero', reason: String(error?.message || error || 'load-failed').slice(0, 160), truth: null });
      if (!disposed && revisions.get(heroId) === revision) heroes.set(heroId, rejected);
      return rejected;
    }
  };

  const pumpHeroLoads = () => {
    if (disposed || !active) return;
    const limit = Math.max(0, Number(heroAdmission.optionalConcurrencyLimit || 0));
    while (activeHeroLoads < limit && heroQueue.length > 0) {
      const next = heroQueue.shift();
      const { placement, revision } = next;
      const heroId = placement.id;
      if (revisions.get(heroId) !== revision) continue;
      heroes.set(heroId, freeze({ ok: true, heroId, status: 'loading-authored-hero', lod: placement.lod.level }));
      activeHeroLoads += 1;
      let task = null;
      task = loadHero(placement, revision).finally(() => {
        activeHeroLoads = Math.max(0, activeHeroLoads - 1);
        pending.delete(task);
        pumpHeroLoads();
      });
      pending.add(task);
    }
  };

  const startHero = (placement) => {
    const heroId = placement.id;
    clearHero(heroId);
    const revision = Number(revisions.get(heroId) || 0) + 1;
    revisions.set(heroId, revision);
    heroes.set(heroId, freeze({ ok: true, heroId, status: 'queued-authored-hero', lod: placement.lod.level }));
    heroQueue.push({ placement, revision });
    pumpHeroLoads();
  };

  const apply = ({ activation = null, quality = 'balanced', playerPosition = null } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'storm-sector-presenter-disposed' });
    if (!authorizedActivation(activation)) {
      if (active || suspended || currentPlan) clearWorld();
      return freeze({ ok: true, active: false, reason: 'exact-owner-activation-required', automaticActivation: false });
    }
    const plan = createEonExpanseW792BStormSectorPlan({ quality });
    const validation = validateEonExpanseW792BStormSectorPlan(plan);
    if (!validation.ok) return freeze({ ok: false, active: false, reason: `storm-layout-invalid:${validation.errors.join(',')}` });
    const changed = !currentPlan || currentQuality !== plan.quality || lastActivationDigest !== activation.packageDigest;
    active = true;
    suspended = false;
    heroAdmission = buildEonCityL95ProgressiveAssetAdmission({ ...desiredHeroAdmission, maxConcurrentLoads: maxConcurrentHeroLoads });
    currentQuality = plan.quality;
    currentPlan = plan;
    lastActivationDigest = activation.packageDigest;
    root.setEnabled?.(true);
    const rt92DeepArt = rt92StormDeepArt.activate?.({ quality: currentQuality }) || freeze({ ok: false, reason: 'rt92-storm-deep-art-unavailable' });
    const rt92Life = rt92EnvironmentalLife.applyState?.({ active: true, hazardSeverity: 2, activityLevel: 2 }) || freeze({ ok: false, reason: 'rt92-storm-environmental-life-unavailable' });
    const rt92Cinematic = rt92CinematicVfx.activate?.({ hazardSeverity: 2, intensity: currentQuality === 'cinematic' ? 1.2 : 1 }) || freeze({ ok: false, reason: 'rt92-storm-cinematic-vfx-unavailable' });
    const environmentSync = syncCellsAndRoutes(plan);
    if (changed) {
      heroQueue.length = 0;
      for (const placement of plan.heroPlacements) startHero(placement);
    }
    pumpHeroLoads();
    if (playerPosition) lastZone = resolveEonExpanseW792BStormSectorZone(playerPosition);
    return freeze({ ok: true, active: true, quality: currentQuality, requestedHeroCount: plan.heroPlacements.length, activeCellCount: cells.size, environmentSync, rt92DeepArt, rt92Life, rt92Cinematic, pending: pending.size, currentZoneId: lastZone?.inside ? lastZone.zone.id : '' });
  };

  const getSummary = () => {
    const rows = [...heroes.values()];
    return freeze({
      schema: EON_EXPANSE_W792C_STORM_SECTOR_PRESENTER_SCHEMA,
      active,
      suspended,
      regionId: 'storm-sector',
      packageDigest: (active || suspended) ? lastActivationDigest : '',
      quality: currentQuality,
      currentZoneId: lastZone?.inside ? lastZone.zone.id : '',
      activeCellCount: cells.size,
      routeMeshCount: routeMeshes.size,
      environmentSupportMeshCount: [...cells.values()].reduce((sum, node) => sum + (node.getChildMeshes?.(false)?.length || 0), 0) + environmentMeshes.size,
      stormEyeRingCount: environmentMeshes.size,
      qualityPruningGuaranteed: currentPlan ? cells.size === currentPlan.cells.length : true,
      requestedHeroCount: currentPlan?.heroPlacements?.length || 0,
      presentedHeroCount: rows.filter((entry) => entry.status === 'presented-authored-hero').length,
      queuedHeroCount: rows.filter((entry) => entry.status === 'queued-authored-hero').length,
      loadingHeroCount: rows.filter((entry) => entry.status === 'loading-authored-hero').length,
      rejectedHeroCount: rows.filter((entry) => entry.status === 'rejected-authored-hero').length,
      heroes: freeze(rows.map((entry) => freeze({ heroId: entry.heroId, status: entry.status, lod: entry.lod ?? -1, reason: entry.reason || '', truth: entry.truth || null, developmentProxy: false }))),
      pendingTasks: pending.size,
      queuedTasks: heroQueue.length,
      activeHeroLoads,
      heroAdmission,
      reducedMotion: Boolean(reducedMotion),
      staticWorldMatrices: true,
      dynamicEnvironmentLimitedToStormEye: true,
      exactActivationRequired: true,
      automaticActivation: false,
      oneCanonicalScene: true,
      secondEngineCreated: false,
      secondSceneCreated: false,
      secondRenderLoopCreated: false,
      privateContentStored: false,
      rt92DeepArt: rt92StormDeepArt?.getSummary?.() || null,
      rt92EnvironmentalLife: rt92EnvironmentalLife?.getSummary?.() || null,
      rt92CinematicVfx: rt92CinematicVfx?.getSummary?.() || null
    });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W792C_STORM_SECTOR_PRESENTER_SCHEMA,
    root,
    apply,
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'storm-sector-presenter-disposed' });
      desiredHeroAdmission = freeze({ pressure: options?.pressure || 'nominal', visibility: options?.visibility || 'visible', reason: String(options?.reason || 'storm-runtime').slice(0, 120) });
      const effective = active ? desiredHeroAdmission : freeze({ pressure: 'critical', visibility: 'hidden', reason: 'storm-sector-inactive' });
      heroAdmission = buildEonCityL95ProgressiveAssetAdmission({ ...effective, maxConcurrentLoads: maxConcurrentHeroLoads });
      pumpHeroLoads();
      return freeze({ ok: true, admission: heroAdmission, queued: heroQueue.length, activeLoads: activeHeroLoads, pending: pending.size });
    },
    ready() { return Promise.allSettled([...pending]); },
    getSummary,
    update(seconds = 0) {
      if (!active || disposed || reducedMotion) return freeze({ ok: true, active, animatedEnvironmentCount: 0, ownsRenderLoop: false });
      const t = Number(seconds || 0);
      let animatedEnvironmentCount = 0;
      for (const [id, mesh] of environmentMeshes.entries()) {
        if (!id.startsWith('storm-eye-ring:') || mesh.isDisposed?.()) continue;
        const index = Number(id.split(':')[1] || 0);
        mesh.rotation.z = (index % 2 === 0 ? 1 : -1) * t * (0.055 + index * 0.018);
        mesh.rotation.y = Math.sin(t * 0.18 + index) * 0.16;
        animatedEnvironmentCount += 1;
      }
      const pulse = 0.62 + Math.sin(t * 1.7) * 0.12;
      materials.storm.emissiveColor = Color3.FromHexString('#b5a7ff').scale(pulse);
      const rt92DeepArt = rt92StormDeepArt?.update?.(seconds) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      const rt92Life = rt92EnvironmentalLife?.update?.(seconds) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      const rt92Cinematic = rt92CinematicVfx?.update?.(seconds) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      return freeze({ ok: true, active, animatedEnvironmentCount, rt92DeepArt, rt92Life, rt92Cinematic, ownsRenderLoop: false });
    },
    suspend() {
      if (disposed) return freeze({ ok: false, reason: 'storm-sector-presenter-disposed' });
      active = false;
      suspended = currentPlan !== null;
      heroAdmission = buildEonCityL95ProgressiveAssetAdmission({ pressure: 'critical', visibility: 'hidden', reason: 'storm-sector-suspended', maxConcurrentLoads: maxConcurrentHeroLoads });
      rt92StormDeepArt?.deactivate?.();
      rt92EnvironmentalLife?.setActive?.(false);
      rt92CinematicVfx?.deactivate?.();
      root.setEnabled?.(false);
      lastZone = null;
      return freeze({ ok: true, active: false, suspended, decodedAssetsRetained: suspended, disposedRegionResources: false, optionalLoadsPaused: heroAdmission.optionalConcurrencyLimit === 0, inflightLoadsAttachWhileSuspended: false });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      clearWorld();
      heroQueue.length = 0;
      pending.clear();
      activeHeroLoads = 0;
      rt92CinematicVfx?.dispose?.();
      rt92EnvironmentalLife?.dispose?.();
      rt92StormDeepArt?.dispose?.();
      for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W792C_STORM_SECTOR_PRESENTER_SCHEMA, mountEonExpanseW792CStormSectorPresenter });
