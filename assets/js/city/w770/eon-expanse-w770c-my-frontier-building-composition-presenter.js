/** W770C — canonical-scene presenter for validated My Frontier compositions. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../l95/eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from '../l95/eon-city-l95-world-streaming-policy.js';

export const EON_EXPANSE_W770C_COMPOSITION_PRESENTER_SCHEMA = 'eon.expanse.my-frontier-building-composition-presenter.w770c.v1';
const freeze = Object.freeze;

const splitAssetPath = (path = '') => {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
};
const validLocalAsset = (path = '') => /^\/assets\/city\/(?:w649|w659f)\/(?:primary|fallback)\/world\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || ''));
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
function failedTruth(entry, variant, path, detail) {
  return evaluateEonExpanseW767AAssetPresentation({
    placement: { id: `my-frontier-${entry.plotId}-${entry.id}`, zoneId: 'my-frontier', assetId: entry.assetId, position: {}, targetHeight: entry.targetHeight },
    assetId: entry.assetId,
    requestedPath: path,
    variant,
    loadStatus: 'failed',
    appliedScale: Number.NaN,
    failureDetail: detail
  });
}

export function mountEonExpanseW770CBuildingCompositionPresenter({ scene, plotNodes, assetAdmission = null } = {}) {
  if (!scene || !(plotNodes instanceof Map)) return freeze({ ok: false, reason: 'canonical-scene-and-plot-map-required' });
  let disposed = false;
  const states = new Map();
  const revisions = new Map();
  const pending = new Set();
  const queue = [];
  const suppressedPlotIds = new Set();
  const maxConcurrentLoads = 1;
  let admission = buildEonCityL95ProgressiveAssetAdmission({
    pressure: assetAdmission?.pressure || 'nominal',
    visibility: assetAdmission?.visibility || 'visible',
    reason: assetAdmission?.reason || 'my-frontier-building-compositions',
    maxConcurrentLoads
  });
  let activeLoads = 0;
  let streamingFocus = null;
  let streamingRadius = Number.POSITIVE_INFINITY;
  let lastPlan = freeze({ plots: freeze([]) });

  const clearKey = (key) => {
    revisions.set(key, Number(revisions.get(key) || 0) + 1);
    const current = states.get(key);
    if (current) disposeState(current);
    for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index]?.key === key) queue.splice(index, 1);
    states.delete(key);
  };

  const loadPart = async (entry, key, revision) => {
    const target = plotNodes.get(entry.plotId);
    if (!target?.root) return freeze({ ok: false, reason: 'plot-root-missing' });
    const attempts = [];
    for (const [variantName, variant] of [['primary', entry.variants?.primary], ['fallback', entry.variants?.fallback]]) {
      if (!validLocalAsset(variant?.path)) {
        attempts.push(failedTruth(entry, variantName, variant?.path || '', 'asset-path-invalid'));
        continue;
      }
      let container = null;
      let wrapper = null;
      try {
        const { rootUrl, fileName } = splitAssetPath(variant.path);
        container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
        if (disposed || revisions.get(key) !== revision) {
          try { container.dispose?.(); } catch {}
          return freeze({ ok: false, reason: 'stale-or-disposed-load', attempts: freeze(attempts) });
        }
        container.addAllToScene?.();
        wrapper = new TransformNode(`w770c-${entry.plotId}-${entry.id}`, scene);
        wrapper.parent = target.root;
        wrapper.position.set(Number(entry.localPosition?.x || 0), 0.32 + Number(entry.localPosition?.y || 0), Number(entry.localPosition?.z || 0));
        wrapper.rotation.y = Number(entry.rotationY || 0);
        for (const node of container.rootNodes || []) node.parent = wrapper;
        for (const mesh of container.meshes || []) {
          mesh.isPickable = false;
          mesh.checkCollisions = false;
          mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'my-frontier-authored-composition-part', plotId: entry.plotId, buildingId: entry.buildingId, partId: entry.id, assetId: entry.assetId, finishedBespokeBuilding: false });
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
        const desiredGroundY = Number(wrapper.getAbsolutePosition?.()?.y ?? wrapper.position.y);
        let groundOffset = 0;
        if (scaledBounds) {
          groundOffset = desiredGroundY - scaledBounds.minY;
          wrapper.position.y += groundOffset;
          wrapper.computeWorldMatrix?.(true);
        }
        const finalBounds = collectBounds(meshes);
        const renderableMeshes = meshes.filter(renderable);
        const visibleMeshes = renderableMeshes.filter(visible);
        const expectedPosition = finalBounds ? freeze({ x: (finalBounds.minX + finalBounds.maxX) / 2, y: desiredGroundY, z: (finalBounds.minZ + finalBounds.maxZ) / 2 }) : (wrapper.getAbsolutePosition?.() || wrapper.position);
        const truth = evaluateEonExpanseW767AAssetPresentation({
          placement: { id: `my-frontier-${entry.plotId}-${entry.id}`, zoneId: 'my-frontier', assetId: entry.assetId, position: expectedPosition, targetHeight: entry.targetHeight },
          assetId: entry.assetId,
          requestedPath: variant.path,
          variant: variantName,
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
          lodState: entry.minimumQuality || 'balanced',
          drawCallContribution: visibleMeshes.length
        });
        attempts.push(truth);
        if (!truth.ok) {
          disposeState({ container, wrapper });
          container = null; wrapper = null;
          continue;
        }
        if (disposed || revisions.get(key) !== revision) {
          disposeState({ container, wrapper });
          return freeze({ ok: false, reason: 'stale-or-disposed-load', attempts: freeze(attempts) });
        }
        wrapper.setEnabled?.(!suppressedPlotIds.has(entry.plotId));
        const state = freeze({
          ok: true,
          key,
          requestKey: entry.requestKey,
          plotId: entry.plotId,
          buildingId: entry.buildingId,
          partId: entry.id,
          assetId: entry.assetId,
          requiredForQuality: entry.requiredForQuality === true,
          variant: variantName,
          status: 'presented-authored-composition-part',
          wrapper,
          container,
          truth,
          attempts: freeze(attempts),
          finishedBespokeBuilding: false
        });
        states.set(key, state);
        return state;
      } catch (error) {
        attempts.push(failedTruth(entry, variantName, variant?.path || '', String(error?.message || error || 'asset-load-failed').slice(0, 160)));
        disposeState({ container, wrapper });
      }
    }
    const rejected = freeze({ ok: false, key, requestKey: entry.requestKey, plotId: entry.plotId, buildingId: entry.buildingId, partId: entry.id, assetId: entry.assetId, requiredForQuality: entry.requiredForQuality === true, status: 'rejected-authored-composition-part', reason: attempts.at(-1)?.failureReason || 'asset-load-failed', attempts: freeze(attempts), finishedBespokeBuilding: false });
    if (!disposed && revisions.get(key) === revision) states.set(key, rejected);
    return rejected;
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
    if (disposed) return;
    const limit = Math.min(maxConcurrentLoads, Math.max(0, Number(admission.optionalConcurrencyLimit || 0)));
    while (activeLoads < limit && queue.length > 0) {
      const nextIndex = nextEligibleQueueIndex();
      if (nextIndex < 0) break;
      const [next] = queue.splice(nextIndex, 1);
      if (!next || revisions.get(next.key) !== next.revision) continue;
      states.set(next.key, freeze({ ok: true, key: next.key, requestKey: next.entry.requestKey, plotId: next.entry.plotId, buildingId: next.entry.buildingId, partId: next.entry.id, assetId: next.entry.assetId, requiredForQuality: next.entry.requiredForQuality === true, status: 'loading-authored-composition-part', finishedBespokeBuilding: false }));
      activeLoads += 1;
      let task = null;
      task = loadPart(next.entry, next.key, next.revision).finally(() => {
        activeLoads = Math.max(0, activeLoads - 1);
        pending.delete(task);
        pump();
      });
      pending.add(task);
    }
  };

  const enqueueEntry = (entry) => {
    const key = `${entry.plotId}:${entry.id}`;
    clearKey(key);
    const revision = Number(revisions.get(key) || 0) + 1;
    revisions.set(key, revision);
    states.set(key, freeze({ ok: true, key, requestKey: entry.requestKey, plotId: entry.plotId, buildingId: entry.buildingId, partId: entry.id, assetId: entry.assetId, requiredForQuality: entry.requiredForQuality === true, status: 'queued-authored-composition-part', finishedBespokeBuilding: false }));
    queue.push({ entry, key, revision });
    pump();
    return freeze({ ok: true, key, queued: true, revision });
  };

  const apply = ({ plan } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'composition-presenter-disposed' });
    lastPlan = freeze({ ...(plan || {}), plots: freeze(Array.isArray(plan?.plots) ? plan.plots : []) });
    const parts = lastPlan.plots.flatMap((plot) => plot.requestComposition ? (plot.parts || []) : []);
    const activeKeys = new Set(parts.map((entry) => `${entry.plotId}:${entry.id}`));
    for (const key of [...states.keys()]) if (!activeKeys.has(key)) clearKey(key);
    for (const entry of parts) {
      const key = `${entry.plotId}:${entry.id}`;
      const current = states.get(key);
      if (current?.requestKey === entry.requestKey && ['queued-authored-composition-part', 'loading-authored-composition-part', 'presented-authored-composition-part'].includes(current.status)) continue;
      enqueueEntry(entry);
    }
    pump();
    return freeze({ ok: true, requestedParts: activeKeys.size, queued: queue.length, pending: pending.size, activeLoads });
  };

  const retryRejected = ({ plotId = '', explicitUserAction = false } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', retriedPartCount: 0, automaticRetry: false });
    if (disposed) return freeze({ ok: false, reason: 'composition-presenter-disposed', retriedPartCount: 0, automaticRetry: false });
    if (pending.size > 0 || queue.length > 0 || activeLoads > 0) return freeze({ ok: false, reason: 'composition-load-pending', retriedPartCount: 0, automaticRetry: false });
    const expectedPlotId = String(plotId || '');
    const entries = lastPlan.plots
      .filter((plot) => plot.requestComposition && (!expectedPlotId || String(plot.plotId || '') === expectedPlotId))
      .flatMap((plot) => plot.parts || [])
      .filter((entry) => states.get(`${entry.plotId}:${entry.id}`)?.status === 'rejected-authored-composition-part');
    if (!entries.length) return freeze({ ok: false, reason: 'rejected-composition-parts-unavailable', retriedPartCount: 0, automaticRetry: false });
    for (const entry of entries) enqueueEntry(entry);
    return freeze({ ok: true, reason: '', plotId: expectedPlotId, retriedPartCount: entries.length, queued: queue.length, pending: pending.size, activeLoads, explicitUserAction: true, automaticRetry: false, scaffoldingPreserved: true, foundationPreserved: true });
  };

  const getSummary = () => {
    const parts = [...states.values()];
    const plotIds = new Set(parts.map((entry) => entry.plotId));
    const plots = [...plotIds].map((plotId) => {
      const rows = parts.filter((entry) => entry.plotId === plotId);
      const required = rows.filter((entry) => entry.requiredForQuality);
      const presentedRequired = required.filter((entry) => entry.status === 'presented-authored-composition-part').length;
      const rejectedRequired = required.filter((entry) => entry.status === 'rejected-authored-composition-part').length;
      const queuedRequired = required.filter((entry) => entry.status === 'queued-authored-composition-part').length;
      const loadingRequired = required.filter((entry) => entry.status === 'loading-authored-composition-part').length;
      const compositionReady = required.length > 0 && presentedRequired === required.length;
      return freeze({
        plotId,
        buildingId: rows[0]?.buildingId || '',
        requestedPartCount: rows.length,
        requiredPartCount: required.length,
        presentedPartCount: rows.filter((entry) => entry.status === 'presented-authored-composition-part').length,
        presentedRequiredCount: presentedRequired,
        rejectedRequiredCount: rejectedRequired,
        queuedRequiredCount: queuedRequired,
        loadingRequiredCount: loadingRequired,
        compositionReady,
        status: compositionReady ? 'presented-authored-composition' : rejectedRequired > 0 ? 'rejected-authored-composition' : 'loading-authored-composition',
        suppressScaffolding: compositionReady,
        preserveFoundation: true,
        finishedBespokeBuilding: false,
        suppressedByBespoke: suppressedPlotIds.has(plotId)
      });
    });
    return freeze({
      schema: EON_EXPANSE_W770C_COMPOSITION_PRESENTER_SCHEMA,
      requestedPartCount: parts.length,
      presentedPartCount: parts.filter((entry) => entry.status === 'presented-authored-composition-part').length,
      rejectedPartCount: parts.filter((entry) => entry.status === 'rejected-authored-composition-part').length,
      queuedPartCount: parts.filter((entry) => entry.status === 'queued-authored-composition-part').length,
      loadingPartCount: parts.filter((entry) => entry.status === 'loading-authored-composition-part').length,
      presentedCompositionCount: plots.filter((entry) => entry.compositionReady).length,
      plots: freeze(plots),
      parts: freeze(parts.map((entry) => freeze({ plotId: entry.plotId, buildingId: entry.buildingId, partId: entry.partId, assetId: entry.assetId, requiredForQuality: entry.requiredForQuality, status: entry.status, variant: entry.variant || '', reason: entry.reason || '', truth: entry.truth || null, attempts: entry.attempts || freeze([]), finishedBespokeBuilding: false }))),
      pendingTasks: pending.size,
      queuedTasks: queue.length,
      activeLoads,
      maxConcurrentLoads,
      admission,
      streamingFocusValid: streamingFocus?.valid === true,
      streamingRadius: Number.isFinite(streamingRadius) ? streamingRadius : null,
      scaffoldingSuppressedOnlyAfterValidation: true,
      bespokeSuppressedPlotCount: suppressedPlotIds.size,
      fallbackHiddenOnlyAfterBespokeValidation: true,
      foundationSuppressed: false,
      automaticRetry: false,
      canonicalScene: true,
      secondEngineCreated: false,
      secondSceneCreated: false,
      secondRenderLoopCreated: false,
      remoteAssets: false,
      privateContentStored: false
    });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W770C_COMPOSITION_PRESENTER_SCHEMA,
    apply,
    ready() { return Promise.allSettled([...pending]); },
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'composition-presenter-disposed' });
      admission = buildEonCityL95ProgressiveAssetAdmission({ ...options, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission, queued: queue.length, activeLoads, pending: pending.size });
    },
    setStreamingFocus(focus = null, { radius = Number.POSITIVE_INFINITY } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'composition-presenter-disposed' });
      streamingFocus = focus?.valid === true ? freeze({ ...focus }) : null;
      streamingRadius = Number.isFinite(Number(radius)) ? Math.max(0, Number(radius)) : Number.POSITIVE_INFINITY;
      pump();
      return freeze({ ok: true, focusValid: streamingFocus?.valid === true, radius: streamingRadius, queued: queue.length, activeLoads });
    },
    setBespokeReadyPlots(plotIds = []) {
      if (disposed) return freeze({ ok: false, reason: 'composition-presenter-disposed' });
      suppressedPlotIds.clear();
      for (const plotId of Array.isArray(plotIds) ? plotIds : []) if (String(plotId || '')) suppressedPlotIds.add(String(plotId));
      for (const state of states.values()) {
        if (state?.status === 'presented-authored-composition-part') state.wrapper?.setEnabled?.(!suppressedPlotIds.has(state.plotId));
      }
      return freeze({ ok: true, suppressedPlotCount: suppressedPlotIds.size, fallbackHiddenOnlyAfterBespokeValidation: true });
    },
    getSummary,
    retryRejected,
    getPlotReadiness(plotId = '') { return getSummary().plots.find((entry) => entry.plotId === String(plotId || '')) || null; },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      for (const key of [...new Set([...states.keys(), ...revisions.keys()])]) clearKey(key);
      queue.length = 0;
      pending.clear();
      suppressedPlotIds.clear();
      activeLoads = 0;
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W770C_COMPOSITION_PRESENTER_SCHEMA, mountEonExpanseW770CBuildingCompositionPresenter });
