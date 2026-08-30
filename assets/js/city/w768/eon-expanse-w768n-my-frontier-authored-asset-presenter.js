/** W768N — validated authored-anchor presenter inside the canonical My Frontier scene root. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { evaluateEonExpanseW767AAssetPresentation } from '../w766/eon-expanse-w767a-asset-truth.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../l95/eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from '../l95/eon-city-l95-world-streaming-policy.js';

export const EON_EXPANSE_W768N_AUTHORED_ASSET_PRESENTER_SCHEMA = 'eon.expanse.my-frontier-authored-asset-presenter.w768n.v1';
const freeze = Object.freeze;

function splitAssetPath(path = '') {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
}

function validLocalAsset(path = '') {
  return /^\/assets\/city\/(w649|w659f)\/(primary|fallback)\/world\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || ''));
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

function materialCount(container, meshes) {
  const values = new Set(container?.materials || []);
  for (const mesh of meshes) if (mesh?.material) values.add(mesh.material);
  return values.size;
}

function disposePresentation(slot = {}) {
  try { slot.container?.dispose?.(); } catch {}
  try { slot.wrapper?.dispose?.(false, true); } catch {}
}

function failedTruth(entry, variant, path, detail) {
  return evaluateEonExpanseW767AAssetPresentation({
    placement: { id: `my-frontier-${entry.plotId}`, zoneId: 'my-frontier', assetId: entry.assetId, position: {}, targetHeight: entry.targetHeight },
    assetId: entry.assetId,
    requestedPath: path,
    variant,
    loadStatus: 'failed',
    appliedScale: Number.NaN,
    failureDetail: detail
  });
}

export function mountEonExpanseW768NMyFrontierAuthoredAssetPresenter({ scene, plotNodes, assetAdmission = null } = {}) {
  if (!scene || !(plotNodes instanceof Map)) return freeze({ ok: false, reason: 'canonical-scene-and-plot-map-required' });
  let disposed = false;
  const states = new Map();
  const pending = new Set();
  const revisions = new Map();
  const queue = [];
  const maxConcurrentLoads = 1;
  let admission = buildEonCityL95ProgressiveAssetAdmission({
    pressure: assetAdmission?.pressure || 'nominal',
    visibility: assetAdmission?.visibility || 'visible',
    reason: assetAdmission?.reason || 'my-frontier-authored-buildings',
    maxConcurrentLoads
  });
  let activeLoads = 0;
  let streamingFocus = null;
  let streamingRadius = Number.POSITIVE_INFINITY;

  const clearPlot = (plotId) => {
    revisions.set(plotId, Number(revisions.get(plotId) || 0) + 1);
    const current = states.get(plotId);
    if (current) disposePresentation(current);
    for (let index = queue.length - 1; index >= 0; index -= 1) if (queue[index]?.entry?.plotId === plotId) queue.splice(index, 1);
    states.delete(plotId);
  };

  const load = async (entry, revision) => {
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
        if (disposed || revisions.get(entry.plotId) !== revision) {
          try { container.dispose?.(); } catch {}
          return freeze({ ok: false, reason: 'stale-or-disposed-load', attempts: freeze(attempts) });
        }
        container.addAllToScene?.();
        wrapper = new TransformNode(`w768n-${entry.plotId}-${entry.assetId}`, scene);
        wrapper.parent = target.root;
        wrapper.position.set(0, 0.3, 0);
        for (const node of container.rootNodes || []) node.parent = wrapper;
        for (const mesh of container.meshes || []) {
          mesh.isPickable = false;
          mesh.checkCollisions = false;
          mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'my-frontier-authored-anchor', plotId: entry.plotId, buildingId: entry.buildingId, assetId: entry.assetId, finishedBuilding: false });
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
        const plotPosition = target.root.getAbsolutePosition?.() || target.root.position;
        const requestedY = Number(plotPosition?.y || 0) + 0.3;
        let groundOffset = 0;
        if (scaledBounds) {
          groundOffset = requestedY - scaledBounds.minY;
          wrapper.position.y += groundOffset;
          wrapper.computeWorldMatrix?.(true);
        }
        const finalBounds = collectBounds(meshes);
        const renderableMeshes = meshes.filter(renderable);
        const visibleMeshes = renderableMeshes.filter(visible);
        const truth = evaluateEonExpanseW767AAssetPresentation({
          placement: { id: `my-frontier-${entry.plotId}`, zoneId: 'my-frontier', assetId: entry.assetId, position: { x: Number(plotPosition?.x || 0), y: requestedY, z: Number(plotPosition?.z || 0) }, targetHeight: entry.targetHeight },
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
          lodState: 'full',
          drawCallContribution: visibleMeshes.length
        });
        attempts.push(truth);
        if (!truth.ok) {
          disposePresentation({ container, wrapper });
          container = null; wrapper = null;
          continue;
        }
        if (disposed || revisions.get(entry.plotId) !== revision) {
          disposePresentation({ container, wrapper });
          return freeze({ ok: false, reason: 'stale-or-disposed-load', attempts: freeze(attempts) });
        }
        // Authored building anchors are static after validated placement.
        try { wrapper.freezeWorldMatrix?.(); } catch {}
        for (const mesh of meshes) { try { mesh.freezeWorldMatrix?.(); } catch {} }
        const state = freeze({
          ok: true,
          requestKey: entry.requestKey || '',
          plotId: entry.plotId,
          buildingId: entry.buildingId,
          assetId: entry.assetId,
          variant: variantName,
          status: 'presented-authored-anchor',
          wrapper,
          container,
          truth,
          attempts: freeze(attempts),
          foundationSuppressed: false,
          scaffoldingSuppressed: false,
          finishedBuilding: false
        });
        states.set(entry.plotId, state);
        return state;
      } catch (error) {
        const detail = String(error?.message || error || 'asset-load-failed').slice(0, 160);
        attempts.push(failedTruth(entry, variantName, variant?.path || '', detail));
        disposePresentation({ container, wrapper });
      }
    }
    if (!disposed && revisions.get(entry.plotId) === revision) states.set(entry.plotId, freeze({ ok: false, requestKey: entry.requestKey || '', plotId: entry.plotId, buildingId: entry.buildingId, assetId: entry.assetId, status: 'rejected-authored-anchor', reason: attempts.at(-1)?.failureReason || 'asset-load-failed', attempts: freeze(attempts), foundationSuppressed: false, scaffoldingSuppressed: false, finishedBuilding: false }));
    return states.get(entry.plotId);
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
    const limit = Math.max(0, Number(admission.optionalConcurrencyLimit || 0));
    while (activeLoads < limit && queue.length > 0) {
      const nextIndex = nextEligibleQueueIndex();
      if (nextIndex < 0) break;
      const [next] = queue.splice(nextIndex, 1);
      if (!next || revisions.get(next.entry.plotId) !== next.revision) continue;
      states.set(next.entry.plotId, freeze({ ok: true, plotId: next.entry.plotId, buildingId: next.entry.buildingId, assetId: next.entry.assetId, requestKey: next.entry.requestKey, status: 'loading-authored-anchor', foundationSuppressed: false, scaffoldingSuppressed: false, finishedBuilding: false }));
      activeLoads += 1;
      let task = null;
      task = load(next.entry, next.revision).finally(() => {
        activeLoads = Math.max(0, activeLoads - 1);
        pending.delete(task);
        pump();
      });
      pending.add(task);
    }
  };

  const apply = ({ plan } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'authored-asset-presenter-disposed' });
    const rows = Array.isArray(plan?.plots) ? plan.plots : [];
    const activePlotIds = new Set(rows.filter((entry) => entry.requestAsset === true).map((entry) => entry.plotId));
    for (const plotId of [...states.keys()]) if (!activePlotIds.has(plotId)) clearPlot(plotId);
    for (const entry of rows) {
      if (!entry.requestAsset) continue;
      const requestKey = `${entry.buildingId}:${entry.assetId}:${entry.variants?.primary?.path || ''}`;
      const current = states.get(entry.plotId);
      if (current?.requestKey === requestKey || (current?.buildingId === entry.buildingId && ['presented-authored-anchor', 'loading-authored-anchor'].includes(current.status))) continue;
      clearPlot(entry.plotId);
      const revision = Number(revisions.get(entry.plotId) || 0) + 1;
      revisions.set(entry.plotId, revision);
      const queuedEntry = { ...entry, requestKey };
      states.set(entry.plotId, freeze({ ok: true, plotId: entry.plotId, buildingId: entry.buildingId, assetId: entry.assetId, requestKey, status: 'queued-authored-anchor', foundationSuppressed: false, scaffoldingSuppressed: false, finishedBuilding: false }));
      queue.push({ entry: queuedEntry, revision });
    }
    pump();
    return freeze({ ok: true, requested: activePlotIds.size, queued: queue.length, pending: pending.size, activeLoads });
  };

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W768N_AUTHORED_ASSET_PRESENTER_SCHEMA,
    apply,
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'authored-asset-presenter-disposed' });
      admission = buildEonCityL95ProgressiveAssetAdmission({ ...options, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission, queued: queue.length, activeLoads, pending: pending.size });
    },
    setStreamingFocus(focus = null, { radius = Number.POSITIVE_INFINITY } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'authored-asset-presenter-disposed' });
      streamingFocus = focus?.valid === true ? freeze({ ...focus }) : null;
      streamingRadius = Number.isFinite(Number(radius)) ? Math.max(0, Number(radius)) : Number.POSITIVE_INFINITY;
      pump();
      return freeze({ ok: true, focusValid: streamingFocus?.valid === true, radius: streamingRadius, queued: queue.length, activeLoads });
    },
    ready() { return Promise.allSettled([...pending]); },
    getSummary() {
      const rows = [...states.values()];
      return freeze({
        schema: EON_EXPANSE_W768N_AUTHORED_ASSET_PRESENTER_SCHEMA,
        requested: rows.length,
        queued: rows.filter((row) => row.status === 'queued-authored-anchor').length,
        loading: rows.filter((row) => row.status === 'loading-authored-anchor').length,
        presented: rows.filter((row) => row.status === 'presented-authored-anchor').length,
        rejected: rows.filter((row) => row.status === 'rejected-authored-anchor').length,
        pendingTasks: pending.size,
        queuedTasks: queue.length,
        activeLoads,
        admission,
        streamingFocusValid: streamingFocus?.valid === true,
        streamingRadius: Number.isFinite(streamingRadius) ? streamingRadius : null,
        staticWorldMatrices: true,
        assets: freeze(rows.map((row) => freeze({ plotId: row.plotId, buildingId: row.buildingId, assetId: row.assetId, status: row.status, variant: row.variant || '', reason: row.reason || '', truth: row.truth || null, attempts: row.attempts || freeze([]), foundationSuppressed: false, scaffoldingSuppressed: false, finishedBuilding: false }))),
        canonicalScene: true,
        secondEngineCreated: false,
        secondSceneCreated: false,
        secondRenderLoopCreated: false,
        automaticRetry: false,
        remoteAssets: false,
        privateContentStored: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      for (const plotId of [...new Set([...states.keys(), ...revisions.keys()])]) clearPlot(plotId);
      queue.length = 0;
      pending.clear();
      activeLoads = 0;
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W768N_AUTHORED_ASSET_PRESENTER_SCHEMA, mountEonExpanseW768NMyFrontierAuthoredAssetPresenter });
