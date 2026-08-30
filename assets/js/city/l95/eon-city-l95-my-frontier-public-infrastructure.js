/** L95 — canonical-scene presenter for truthful My Frontier public infrastructure. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { buildEonCityL95ProgressiveAssetAdmission } from './eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from './eon-city-l95-world-streaming-policy.js';
import {
  EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA,
  createEonCityL95MyFrontierPublicInfrastructurePlan,
  validateEonCityL95MyFrontierPublicInfrastructurePlan,
  isEonCityL95MyFrontierPublicInfrastructureVariant
} from './eon-city-l95-my-frontier-public-infrastructure-contract.js';

const freeze = Object.freeze;

function splitAssetPath(path = '') {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
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

function disposeEntry(entry = {}) {
  try { entry.container?.dispose?.(); } catch {}
  try { entry.wrapper?.dispose?.(false, true); } catch {}
}

export function mountEonCityL95MyFrontierPublicInfrastructure({ scene, parent = null, quality = 'balanced', assetAdmission = null } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'canonical-scene-and-parent-required' });
  const plan = createEonCityL95MyFrontierPublicInfrastructurePlan({ quality });
  const validation = validateEonCityL95MyFrontierPublicInfrastructurePlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: `public-infrastructure-plan-invalid:${validation.errors.join(',')}`, validation });

  const root = new TransformNode('l95-my-frontier-public-infrastructure-root', scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'my-frontier-public-infrastructure-root', canonicalSceneOnly: true, userBuilding: false, automaticConstruction: false });
  const states = new Map();
  const pending = new Set();
  const queue = [];
  const readyWaiters = new Set();
  const maxConcurrentLoads = quality === 'cinematic' ? 2 : 1;
  let admission = buildEonCityL95ProgressiveAssetAdmission({
    pressure: assetAdmission?.pressure || 'nominal',
    visibility: assetAdmission?.visibility || 'visible',
    reason: assetAdmission?.reason || 'my-frontier-first-entry',
    maxConcurrentLoads
  });
  let activeLoads = 0;
  let streamingFocus = null;
  let streamingRadius = Number.POSITIVE_INFINITY;
  let disposed = false;
  const settleReady = () => {
    if (!disposed && (queue.length > 0 || pending.size > 0 || activeLoads > 0)) return;
    for (const resolve of [...readyWaiters]) { try { resolve(freeze({ ok: !disposed, disposed, queued: queue.length, pending: pending.size })); } catch {} }
    readyWaiters.clear();
  };

  const load = async (entry) => {
    const attempts = [];
    for (const [variantName, variant] of [['primary', entry.variants.primary], ['fallback', entry.variants.fallback]]) {
      let container = null;
      let wrapper = null;
      if (!isEonCityL95MyFrontierPublicInfrastructureVariant(variant)) continue;
      try {
        const { rootUrl, fileName } = splitAssetPath(variant.path);
        container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
        if (disposed) { try { container.dispose?.(); } catch {} return freeze({ ok: false, id: entry.id, status: 'disposed-during-load' }); }
        container.addAllToScene?.();
        wrapper = new TransformNode(`l95-my-frontier-public-${entry.id}`, scene);
        wrapper.parent = root;
        wrapper.position.set(entry.position.x, entry.position.y, entry.position.z);
        wrapper.rotation.y = entry.rotationY;
        for (const node of container.rootNodes || []) node.parent = wrapper;
        for (const mesh of container.meshes || []) {
          mesh.isPickable = false;
          mesh.checkCollisions = false;
          mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'my-frontier-public-infrastructure', district: entry.district, infrastructureId: entry.id, assetId: entry.assetId, ownership: 'public-infrastructure', interactive: false, userBuilding: false });
        }
        const meshes = container.meshes || [];
        const sourceBounds = collectBounds(meshes);
        let appliedScale = 1;
        if (sourceBounds?.height > 0.001) {
          appliedScale = entry.targetHeight / sourceBounds.height;
          wrapper.scaling.setAll(appliedScale);
          wrapper.computeWorldMatrix?.(true);
        }
        const scaledBounds = collectBounds(meshes);
        let groundOffset = 0;
        if (scaledBounds) {
          groundOffset = entry.position.y - scaledBounds.minY;
          wrapper.position.y += groundOffset;
          wrapper.computeWorldMatrix?.(true);
        }
        const finalBounds = collectBounds(meshes);
        const renderableMeshes = meshes.filter(renderable);
        const visibleMeshes = renderableMeshes.filter(visible);
        const truth = evaluateEonExpanseW767AAssetPresentation({
          placement: { id: `my-frontier-public-${entry.id}`, zoneId: 'my-frontier', assetId: entry.assetId, position: entry.position, targetHeight: entry.targetHeight },
          assetId: entry.assetId,
          requestedPath: variant.path,
          variant: variantName,
          loadStatus: 'loaded',
          meshCount: meshes.length,
          renderableMeshCount: renderableMeshes.length,
          visibleMeshCount: visibleMeshes.length,
          materialCount: new Set([...(container.materials || []), ...renderableMeshes.map((mesh) => mesh.material).filter(Boolean)]).size,
          animationGroupCount: container.animationGroups?.length || 0,
          sourceBounds,
          worldBounds: finalBounds,
          appliedScale,
          finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
          groundOffset,
          lodState: 'public-infrastructure',
          drawCallContribution: visibleMeshes.length
        });
        attempts.push(truth);
        if (!truth.ok) { disposeEntry({ container, wrapper }); continue; }
        // L95: public infrastructure is world-owned static scenery. Freeze its
        // validated transforms after final placement so Babylon does not spend
        // frame time recomputing matrices for unchanged GLB roots/meshes.
        try { wrapper.freezeWorldMatrix?.(); } catch {}
        for (const mesh of meshes) { try { mesh.freezeWorldMatrix?.(); } catch {} }
        const state = freeze({ ok: true, id: entry.id, district: entry.district, assetId: entry.assetId, status: 'presented-public-infrastructure', variant: variantName, wrapper, container, truth, attempts: freeze(attempts) });
        states.set(entry.id, state);
        return state;
      } catch (error) {
        attempts.push(freeze({ ok: false, failureReason: String(error?.message || error || 'load-failed').slice(0, 160) }));
        disposeEntry({ container, wrapper });
      }
    }
    const failure = freeze({ ok: false, id: entry.id, district: entry.district, assetId: entry.assetId, status: 'rejected-public-infrastructure', reason: attempts.at(-1)?.failureReason || 'asset-load-failed', attempts: freeze(attempts) });
    if (!disposed) states.set(entry.id, failure);
    return failure;
  };

  const nextEligibleQueueIndex = () => {
    if (!queue.length) return -1;
    if (streamingFocus?.valid !== true || !Number.isFinite(streamingRadius)) return 0;
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < queue.length; index += 1) {
      const distance = distanceToEonCityL95StreamingFocus(streamingFocus, queue[index]?.position);
      if (distance > streamingRadius || distance >= bestDistance) continue;
      bestDistance = distance;
      bestIndex = index;
    }
    return bestIndex;
  };

  const pump = () => {
    if (disposed) return;
    const limit = Math.max(0, Number(admission.optionalConcurrencyLimit || 0));
    while (activeLoads < limit && queue.length > 0) {
      const nextIndex = nextEligibleQueueIndex();
      if (nextIndex < 0) break;
      const [entry] = queue.splice(nextIndex, 1);
      states.set(entry.id, freeze({ ok: true, id: entry.id, district: entry.district, assetId: entry.assetId, status: 'loading-public-infrastructure' }));
      activeLoads += 1;
      let task = null;
      task = load(entry).finally(() => {
        activeLoads = Math.max(0, activeLoads - 1);
        pending.delete(task);
        pump();
        settleReady();
      });
      pending.add(task);
    }
    settleReady();
  };
  for (const entry of plan.entries) {
    states.set(entry.id, freeze({ ok: true, id: entry.id, district: entry.district, assetId: entry.assetId, status: 'queued-public-infrastructure' }));
    queue.push(entry);
  }
  pump();

  return freeze({
    ok: true,
    schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA,
    root,
    ready() {
      if (disposed || (queue.length === 0 && pending.size === 0 && activeLoads === 0)) return Promise.resolve(freeze({ ok: !disposed, disposed, queued: queue.length, pending: pending.size }));
      return new Promise((resolve) => readyWaiters.add(resolve));
    },
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'public-infrastructure-disposed' });
      admission = buildEonCityL95ProgressiveAssetAdmission({ ...options, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission, queued: queue.length, activeLoads, pendingTasks: pending.size });
    },
    setStreamingFocus(focus = null, { radius = Number.POSITIVE_INFINITY } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'public-infrastructure-disposed' });
      streamingFocus = focus?.valid === true ? freeze({ ...focus }) : null;
      streamingRadius = Number.isFinite(Number(radius)) ? Math.max(0, Number(radius)) : Number.POSITIVE_INFINITY;
      pump();
      return freeze({ ok: true, focusValid: streamingFocus?.valid === true, radius: streamingRadius, queued: queue.length, activeLoads });
    },
    getSummary() {
      const rows = [...states.values()];
      return freeze({
        schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA,
        quality: plan.quality,
        requested: plan.entries.length,
        presented: rows.filter((entry) => entry.status === 'presented-public-infrastructure').length,
        queued: rows.filter((entry) => entry.status === 'queued-public-infrastructure').length,
        loading: rows.filter((entry) => entry.status === 'loading-public-infrastructure').length,
        rejected: rows.filter((entry) => entry.status === 'rejected-public-infrastructure').length,
        pendingTasks: pending.size,
        activeLoads,
        maxConcurrentLoads,
        admission,
        streamingFocusValid: streamingFocus?.valid === true,
        streamingRadius: Number.isFinite(streamingRadius) ? streamingRadius : null,
        publicInfrastructureOnly: true,
        userBuildingCount: 0,
        automaticConstruction: false,
        interactiveCount: 0,
        canonicalScene: root.getScene?.() === scene,
        ownsRenderLoop: false,
        staticWorldMatrices: true,
        privateContentStored: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      for (const entry of states.values()) if (entry.container || entry.wrapper) disposeEntry(entry);
      states.clear();
      queue.length = 0;
      pending.clear();
      activeLoads = 0;
      settleReady();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA, mountEonCityL95MyFrontierPublicInfrastructure });
