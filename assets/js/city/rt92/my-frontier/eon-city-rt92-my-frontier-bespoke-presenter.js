/** RT92 — canonical-scene presenter for the five bespoke My Frontier landmark families. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../../w766/eon-expanse-w767a-asset-truth.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../../l95/eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from '../../l95/eon-city-l95-world-streaming-policy.js';
import {
  EON_CITY_RT92_MY_FRONTIER_BESPOKE_BUILDING_IDS,
  EON_CITY_RT92_MY_FRONTIER_BESPOKE_SCHEMA,
  deriveEonCityRt92MyFrontierBespokePlan
} from './eon-city-rt92-my-frontier-bespoke-landmarks.js';

export const EON_CITY_RT92_MY_FRONTIER_BESPOKE_PRESENTER_SCHEMA = 'eon.city.my-frontier.bespoke-presenter.rt92.v1';
const freeze = Object.freeze;
const LOCAL_CONTENT_ADDRESSED_PATH = /^\/assets\/city\/rt92\/my-frontier\/landmarks\/[a-z0-9-]+\/[a-z0-9-]+-lod[012]\.[a-f0-9]{12}\.glb$/i;

const splitAssetPath = (path = '') => {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
};
const renderable = (mesh) => {
  try { return Boolean(mesh && !mesh.isDisposed?.() && (Number(mesh.getTotalVertices?.() || 0) > 0 || mesh.geometry)); } catch { return false; }
};
const visible = (mesh) => {
  try { return renderable(mesh) && mesh.isEnabled?.() !== false && mesh.isVisible !== false && Number(mesh.visibility ?? 1) > 0.01; } catch { return false; }
};
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
function materialCount(container, meshes) {
  const values = new Set(container?.materials || []);
  for (const mesh of meshes) if (mesh?.material) values.add(mesh.material);
  return values.size;
}
function disposeState(state = {}) {
  try { state.container?.dispose?.(); } catch {}
  try { state.wrapper?.dispose?.(false, true); } catch {}
}

export function mountEonCityRt92MyFrontierBespokePresenter({ scene, plotNodes, quality = 'balanced', assetAdmission = null } = {}) {
  if (!scene || !(plotNodes instanceof Map)) return freeze({ ok: false, reason: 'canonical-scene-and-plot-map-required' });
  let disposed = false;
  let active = false;
  let currentQuality = ['lite', 'balanced', 'cinematic'].includes(quality) ? quality : 'balanced';
  let lastPresentation = freeze({ plots: freeze([]) });
  let lastPlan = deriveEonCityRt92MyFrontierBespokePlan({ presentation: lastPresentation, quality: currentQuality });
  const states = new Map();
  const revisions = new Map();
  const pending = new Set();
  const queue = [];
  const maxConcurrentLoads = 1;
  let activeLoads = 0;
  let admission = buildEonCityL95ProgressiveAssetAdmission({
    pressure: assetAdmission?.pressure || 'nominal',
    visibility: assetAdmission?.visibility || 'visible',
    reason: assetAdmission?.reason || 'rt92-my-frontier-bespoke-landmarks',
    maxConcurrentLoads
  });
  let streamingFocus = null;
  let streamingRadius = Number.POSITIVE_INFINITY;
  let readinessVersion = 0;
  const readinessListeners = new Set();
  const bumpReadinessVersion = () => {
    readinessVersion += 1;
    const snapshot = readinessVersion;
    for (const listener of [...readinessListeners]) {
      try { listener(snapshot); } catch {}
    }
    return snapshot;
  };

  const clearPlot = (plotId) => {
    const key = String(plotId || '');
    revisions.set(key, Number(revisions.get(key) || 0) + 1);
    const current = states.get(key);
    if (current) {
      if (['presented-bespoke-landmark', 'rejected-bespoke-landmark'].includes(current.status)) bumpReadinessVersion();
      disposeState(current);
    }
    for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index]?.entry?.plotId === key) queue.splice(index, 1);
    states.delete(key);
  };

  const failedTruth = (entry, detail) => evaluateEonExpanseW767AAssetPresentation({
    placement: { id: `rt92-my-frontier-${entry.plotId}-${entry.buildingId}`, zoneId: 'my-frontier', assetId: entry.buildingId, position: {}, targetHeight: entry.targetHeight },
    assetId: entry.buildingId,
    requestedPath: entry.path,
    variant: 'primary',
    loadStatus: 'failed',
    appliedScale: Number.NaN,
    failureDetail: detail
  });

  const loadEntry = async (entry, revision) => {
    const target = plotNodes.get(entry.plotId);
    if (!target?.root) return freeze({ ok: false, reason: 'plot-root-missing', plotId: entry.plotId });
    if (!LOCAL_CONTENT_ADDRESSED_PATH.test(entry.path)) return freeze({ ok: false, reason: 'asset-path-invalid', plotId: entry.plotId, truth: failedTruth(entry, 'asset-path-invalid') });
    let container = null;
    let wrapper = null;
    try {
      const { rootUrl, fileName } = splitAssetPath(entry.path);
      container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
      if (disposed || revisions.get(entry.plotId) !== revision) {
        try { container.dispose?.(); } catch {}
        return freeze({ ok: false, reason: 'stale-or-disposed-load', plotId: entry.plotId });
      }
      container.addAllToScene?.();
      wrapper = new TransformNode(`rt92-bespoke-${entry.plotId}-${entry.buildingId}-lod${entry.selectedLod}`, scene);
      wrapper.parent = target.root;
      wrapper.position.set(0, 0.32, 0);
      for (const node of container.rootNodes || []) node.parent = wrapper;
      for (const mesh of container.meshes || []) {
        mesh.isPickable = false;
        // Plot pads/curbs remain the collision authority; detailed art never creates hidden snags.
        mesh.checkCollisions = false;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'my-frontier-rt92-bespoke-landmark', plotId: entry.plotId, buildingId: entry.buildingId, lod: entry.selectedLod, finishedBespokeBuilding: true, presentationOnly: true });
      }
      const meshes = container.meshes || [];
      const sourceBounds = collectBounds(meshes);
      let appliedScale = 1;
      if (sourceBounds?.height > 0.001) {
        appliedScale = Number(entry.targetHeight) / sourceBounds.height;
        wrapper.scaling.setAll(appliedScale);
        wrapper.computeWorldMatrix?.(true);
      }
      const scaledBounds = collectBounds(meshes);
      const desiredGroundY = Number(target.root.getAbsolutePosition?.()?.y ?? 0) + 0.32;
      let groundOffset = 0;
      if (scaledBounds) {
        groundOffset = desiredGroundY - scaledBounds.minY;
        wrapper.position.y += groundOffset;
        wrapper.computeWorldMatrix?.(true);
      }
      const finalBounds = collectBounds(meshes);
      const renderableMeshes = meshes.filter(renderable);
      const visibleMeshes = renderableMeshes.filter(visible);
      const plotPosition = target.root.getAbsolutePosition?.() || target.root.position;
      const truth = evaluateEonExpanseW767AAssetPresentation({
        placement: { id: `rt92-my-frontier-${entry.plotId}-${entry.buildingId}`, zoneId: 'my-frontier', assetId: entry.buildingId, position: { x: plotPosition.x, y: desiredGroundY, z: plotPosition.z }, targetHeight: entry.targetHeight },
        assetId: entry.buildingId,
        requestedPath: entry.path,
        variant: 'primary',
        loadStatus: 'loaded',
        meshCount: meshes.length,
        renderableMeshCount: renderableMeshes.length,
        visibleMeshCount: visibleMeshes.length,
        materialCount: materialCount(container, renderableMeshes),
        animationGroupCount: container.animationGroups?.length || 0,
        sourceBounds,
        worldBounds: finalBounds,
        appliedScale,
        finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
        groundOffset,
        lodState: `lod${entry.selectedLod}`,
        drawCallContribution: visibleMeshes.length
      });
      if (!truth.ok) {
        disposeState({ container, wrapper });
        const rejected = freeze({ ok: false, plotId: entry.plotId, buildingId: entry.buildingId, requestKey: entry.requestKey, status: 'rejected-bespoke-landmark', reason: truth.failureReason || 'presentation-truth-rejected', truth, fallbackPreserved: true, finishedBespokeBuilding: false });
        if (!disposed && revisions.get(entry.plotId) === revision) { states.set(entry.plotId, rejected); bumpReadinessVersion(); }
        return rejected;
      }
      if (disposed || revisions.get(entry.plotId) !== revision) {
        disposeState({ container, wrapper });
        return freeze({ ok: false, reason: 'stale-or-disposed-load', plotId: entry.plotId });
      }
      const state = freeze({
        ok: true,
        plotId: entry.plotId,
        buildingId: entry.buildingId,
        requestKey: entry.requestKey,
        selectedLod: entry.selectedLod,
        bytes: entry.bytes,
        sha256: entry.sha256,
        path: entry.path,
        status: 'presented-bespoke-landmark',
        wrapper,
        container,
        truth,
        fallbackPreserved: false,
        finishedBespokeBuilding: true,
        bespokeArtComplete: true
      });
      wrapper.setEnabled(active);
      states.set(entry.plotId, state);
      bumpReadinessVersion();
      return state;
    } catch (error) {
      disposeState({ container, wrapper });
      const truth = failedTruth(entry, String(error?.message || error || 'asset-load-failed').slice(0, 160));
      const rejected = freeze({ ok: false, plotId: entry.plotId, buildingId: entry.buildingId, requestKey: entry.requestKey, status: 'rejected-bespoke-landmark', reason: truth.failureReason || 'asset-load-failed', truth, fallbackPreserved: true, finishedBespokeBuilding: false });
      if (!disposed && revisions.get(entry.plotId) === revision) { states.set(entry.plotId, rejected); bumpReadinessVersion(); }
      return rejected;
    }
  };

  const nextEligibleQueueIndex = () => {
    if (!queue.length) return -1;
    if (streamingFocus?.valid !== true || !Number.isFinite(streamingRadius)) return 0;
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < queue.length; index += 1) {
      const next = queue[index];
      const position = plotNodes.get(next?.entry?.plotId)?.root?.position;
      const distance = distanceToEonCityL95StreamingFocus(streamingFocus, position);
      if (distance > streamingRadius || distance >= bestDistance) continue;
      bestDistance = distance;
      bestIndex = index;
    }
    return bestIndex;
  };

  const pump = () => {
    if (disposed || !active) return;
    const limit = Math.min(maxConcurrentLoads, Math.max(0, Number(admission.optionalConcurrencyLimit || 0)));
    while (activeLoads < limit && queue.length) {
      const index = nextEligibleQueueIndex();
      if (index < 0) break;
      const [next] = queue.splice(index, 1);
      if (!next || revisions.get(next.entry.plotId) !== next.revision) continue;
      states.set(next.entry.plotId, freeze({ ok: true, plotId: next.entry.plotId, buildingId: next.entry.buildingId, requestKey: next.entry.requestKey, selectedLod: next.entry.selectedLod, status: 'loading-bespoke-landmark', fallbackPreserved: true, finishedBespokeBuilding: false }));
      activeLoads += 1;
      let task = null;
      task = loadEntry(next.entry, next.revision).finally(() => {
        activeLoads = Math.max(0, activeLoads - 1);
        pending.delete(task);
        pump();
      });
      pending.add(task);
    }
  };

  const enqueue = (entry) => {
    clearPlot(entry.plotId);
    const revision = Number(revisions.get(entry.plotId) || 0) + 1;
    revisions.set(entry.plotId, revision);
    states.set(entry.plotId, freeze({ ok: true, plotId: entry.plotId, buildingId: entry.buildingId, requestKey: entry.requestKey, selectedLod: entry.selectedLod, status: 'queued-bespoke-landmark', fallbackPreserved: true, finishedBespokeBuilding: false }));
    queue.push({ entry, revision });
  };

  const apply = ({ presentation = lastPresentation, quality: nextQuality = currentQuality } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'bespoke-presenter-disposed' });
    lastPresentation = presentation || freeze({ plots: freeze([]) });
    currentQuality = ['lite', 'balanced', 'cinematic'].includes(nextQuality) ? nextQuality : 'balanced';
    lastPlan = deriveEonCityRt92MyFrontierBespokePlan({ presentation: lastPresentation, quality: currentQuality });
    const requested = new Map(lastPlan.plots.filter((entry) => entry.requestAsset).map((entry) => [entry.plotId, entry]));
    for (const plotId of [...states.keys()]) if (!requested.has(plotId)) clearPlot(plotId);
    for (const entry of requested.values()) {
      const current = states.get(entry.plotId);
      if (current?.requestKey === entry.requestKey && ['queued-bespoke-landmark', 'loading-bespoke-landmark', 'presented-bespoke-landmark'].includes(current.status)) continue;
      enqueue(entry);
    }
    pump();
    return freeze({ ok: true, requestedCount: requested.size, requestedBytes: lastPlan.requestedBytes, queued: queue.length, pending: pending.size, activeLoads, catalogueCompleteCount: EON_CITY_RT92_MY_FRONTIER_BESPOKE_BUILDING_IDS.length });
  };

  const getSummary = () => {
    const plots = lastPlan.plots.filter((entry) => entry.requestAsset).map((entry) => {
      const state = states.get(entry.plotId) || null;
      const ready = state?.status === 'presented-bespoke-landmark' && state?.truth?.ok === true;
      return freeze({
        plotId: entry.plotId,
        buildingId: entry.buildingId,
        selectedLod: entry.selectedLod,
        path: entry.path,
        bytes: entry.bytes,
        status: state?.status || 'not-loaded-bespoke-landmark',
        ready,
        truth: state?.truth || null,
        fallbackRequired: !ready,
        finishedBespokeBuilding: ready,
        bespokeArtComplete: ready
      });
    });
    return freeze({
      schema: EON_CITY_RT92_MY_FRONTIER_BESPOKE_PRESENTER_SCHEMA,
      catalogueSchema: EON_CITY_RT92_MY_FRONTIER_BESPOKE_SCHEMA,
      catalogueCompleteCount: EON_CITY_RT92_MY_FRONTIER_BESPOKE_BUILDING_IDS.length,
      requestedCount: plots.length,
      presentedCount: plots.filter((entry) => entry.ready).length,
      rejectedCount: plots.filter((entry) => entry.status === 'rejected-bespoke-landmark').length,
      fallbackRequiredCount: plots.filter((entry) => entry.fallbackRequired).length,
      plots: freeze(plots),
      pendingTasks: pending.size,
      queuedTasks: queue.length,
      activeLoads,
      maxConcurrentLoads,
      admission,
      streamingFocusValid: streamingFocus?.valid === true,
      streamingRadius: Number.isFinite(streamingRadius) ? streamingRadius : null,
      active,
      canonicalScene: true,
      oneEngine: true,
      oneScene: true,
      oneRenderLoop: true,
      secondEngineCreated: false,
      secondSceneCreated: false,
      secondRenderLoopCreated: false,
      collisionsOwned: false,
      navigationOwned: false,
      remoteAssets: false,
      externalTextures: 0,
      hubFirstFrameBinaryDelta: 0,
      privateContentStored: false,
      readinessVersion
    });
  };

  return freeze({
    ok: true,
    schema: EON_CITY_RT92_MY_FRONTIER_BESPOKE_PRESENTER_SCHEMA,
    apply,
    ready() { return Promise.allSettled([...pending]); },
    setActive(nextActive = false) {
      active = nextActive === true;
      for (const state of states.values()) state?.wrapper?.setEnabled?.(active && state.status === 'presented-bespoke-landmark');
      pump();
      return freeze({ ok: true, active });
    },
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'bespoke-presenter-disposed' });
      admission = buildEonCityL95ProgressiveAssetAdmission({ ...options, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission, queued: queue.length, activeLoads, pending: pending.size });
    },
    setStreamingFocus(focus = null, { radius = Number.POSITIVE_INFINITY } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'bespoke-presenter-disposed' });
      streamingFocus = focus?.valid === true ? freeze({ ...focus }) : null;
      streamingRadius = Number.isFinite(Number(radius)) ? Math.max(0, Number(radius)) : Number.POSITIVE_INFINITY;
      pump();
      return freeze({ ok: true, focusValid: streamingFocus?.valid === true, radius: streamingRadius, queued: queue.length, activeLoads });
    },
    getSummary,
    getReadinessVersion() { return readinessVersion; },
    onReadinessChange(listener) {
      if (typeof listener !== 'function' || disposed) return () => {};
      readinessListeners.add(listener);
      return () => readinessListeners.delete(listener);
    },
    getPlotReadiness(plotId = '') { return getSummary().plots.find((entry) => entry.plotId === String(plotId || '')) || null; },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      for (const plotId of [...new Set([...states.keys(), ...revisions.keys()])]) clearPlot(plotId);
      queue.length = 0;
      pending.clear();
      readinessListeners.clear();
      activeLoads = 0;
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_RT92_MY_FRONTIER_BESPOKE_PRESENTER_SCHEMA, mountEonCityRt92MyFrontierBespokePresenter });
