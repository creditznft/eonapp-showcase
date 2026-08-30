/** L95 — lazy, pressure-aware authored ambient cast for My Frontier. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { buildEonCityL95ProgressiveAssetAdmission } from './eon-city-l95-progressive-asset-admission.js';
import { distanceToEonCityL95StreamingFocus } from './eon-city-l95-world-streaming-policy.js';
import {
  EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA,
  createEonCityL95MyFrontierAmbientCastPlan,
  validateEonCityL95MyFrontierAmbientCastPlan
} from './eon-city-l95-my-frontier-ambient-cast-contract.js';

const freeze = Object.freeze;

function splitAssetPath(path = '') {
  const value = String(path || '');
  const slash = value.lastIndexOf('/');
  return freeze({ rootUrl: slash >= 0 ? value.slice(0, slash + 1) : '/', fileName: slash >= 0 ? value.slice(slash + 1) : value });
}

function renderable(mesh) {
  try { return Boolean(mesh && !mesh.isDisposed?.() && (Number(mesh.getTotalVertices?.() || 0) > 0 || mesh.geometry)); } catch { return false; }
}

function collectBounds(meshes = []) {
  let minY = Infinity; let maxY = -Infinity;
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo?.().boundingBox;
      if (!box) continue;
      minY = Math.min(minY, box.minimumWorld.y);
      maxY = Math.max(maxY, box.maximumWorld.y);
    } catch {}
  }
  return Number.isFinite(minY) && Number.isFinite(maxY) ? freeze({ minY, maxY, height: maxY - minY }) : null;
}

function animationKey(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function chooseAnimation(groups = [], preferred = []) {
  for (const name of preferred) {
    const key = animationKey(name);
    const found = groups.find((group) => animationKey(group?.name) === key);
    if (found) return found;
  }
  return groups.find((group) => /idle|inspect|talk/i.test(String(group?.name || ''))) || groups[0] || null;
}

function disposeEntry(entry = {}) {
  try { entry.animation?.stop?.(); } catch {}
  try { entry.container?.dispose?.(); } catch {}
  try { entry.wrapper?.dispose?.(false, true); } catch {}
}

export function mountEonCityL95MyFrontierAmbientCast({ scene, parent = null, quality = 'balanced', assetAdmission = null } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'canonical-scene-and-parent-required' });
  const plan = createEonCityL95MyFrontierAmbientCastPlan({ quality });
  const validation = validateEonCityL95MyFrontierAmbientCastPlan(plan);
  if (!validation.ok) return freeze({ ok: false, reason: `ambient-cast-plan-invalid:${validation.errors.join(',')}`, validation });

  const root = new TransformNode('l95-my-frontier-ambient-cast-root', scene);
  root.parent = parent;
  root.metadata = freeze({ kind: 'my-frontier-public-ambient-cast', ownership: 'public-ambient-cast', resident: false, agent: false, grantsXp: false });

  const states = new Map();
  const queue = [...plan.entries];
  const pending = new Set();
  const readyWaiters = new Set();
  const maxConcurrentLoads = 1;
  let admission = buildEonCityL95ProgressiveAssetAdmission({
    pressure: assetAdmission?.pressure || 'nominal',
    visibility: assetAdmission?.visibility || 'visible',
    reason: assetAdmission?.reason || 'my-frontier-ambient-cast',
    maxConcurrentLoads
  });
  let activeLoads = 0;
  let streamingFocus = null;
  let streamingRadius = Number.POSITIVE_INFINITY;
  let active = false;
  let disposed = false;

  for (const entry of queue) states.set(entry.id, freeze({ ok: true, id: entry.id, status: 'queued-ambient-actor', assetId: entry.assetId }));

  const settleReady = () => {
    if (!disposed && (queue.length || pending.size || activeLoads)) return;
    for (const resolve of [...readyWaiters]) { try { resolve(freeze({ ok: !disposed, disposed })); } catch {} }
    readyWaiters.clear();
  };

  const load = async (entry) => {
    const attempts = [];
    for (const [variantName, variant] of [['primary', entry.variants.primary], ['fallback', entry.variants.fallback]]) {
      let container = null;
      let wrapper = null;
      try {
        const { rootUrl, fileName } = splitAssetPath(variant?.path || '');
        if (!fileName) continue;
        container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
        if (disposed) { try { container.dispose?.(); } catch {} return freeze({ ok: false, id: entry.id, status: 'disposed-during-load' }); }
        container.addAllToScene?.();
        wrapper = new TransformNode(`l95-my-frontier-ambient-${entry.id}`, scene);
        wrapper.parent = root;
        wrapper.position.set(entry.position.x, entry.position.y, entry.position.z);
        wrapper.rotation.y = entry.rotationY;
        for (const node of container.rootNodes || []) node.parent = wrapper;
        const meshes = (container.meshes || []).filter(renderable);
        const bounds = collectBounds(meshes);
        if (bounds?.height > 0.001) wrapper.scaling.setAll(entry.targetHeight / bounds.height);
        wrapper.computeWorldMatrix?.(true);
        const scaled = collectBounds(meshes);
        if (scaled) wrapper.position.y += entry.position.y - scaled.minY;
        wrapper.computeWorldMatrix?.(true);
        for (const mesh of container.meshes || []) {
          mesh.isPickable = false;
          mesh.checkCollisions = false;
          mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'my-frontier-public-ambient-actor', actorId: entry.id, ownership: 'public-ambient-cast', resident: false, agent: false, interactive: false, grantsXp: false });
        }
        const animation = chooseAnimation(container.animationGroups || [], entry.animationNames);
        if (active) try { animation?.start?.(true, 0.82); } catch {}
        try { wrapper.freezeWorldMatrix?.(); } catch {}
        const state = freeze({ ok: true, id: entry.id, assetId: entry.assetId, district: entry.district, status: 'presented-ambient-actor', variant: variantName, animationName: String(animation?.name || ''), wrapper, container, animation });
        states.set(entry.id, state);
        return state;
      } catch (error) {
        attempts.push(String(error?.message || error || 'ambient-actor-load-failed').slice(0, 160));
        disposeEntry({ container, wrapper });
      }
    }
    const failure = freeze({ ok: false, id: entry.id, assetId: entry.assetId, status: 'rejected-ambient-actor', reason: attempts.at(-1) || 'asset-load-failed' });
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
    if (disposed || !active) return;
    const limit = Math.min(maxConcurrentLoads, Math.max(0, Number(admission.optionalConcurrencyLimit || 0)));
    while (activeLoads < limit && queue.length) {
      const nextIndex = nextEligibleQueueIndex();
      if (nextIndex < 0) break;
      const [entry] = queue.splice(nextIndex, 1);
      states.set(entry.id, freeze({ ok: true, id: entry.id, assetId: entry.assetId, status: 'loading-ambient-actor' }));
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
  pump();

  return freeze({
    ok: true,
    schema: EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA,
    root,
    setActive(nextActive = true) {
      if (disposed) return freeze({ ok: false, reason: 'ambient-cast-disposed' });
      active = nextActive === true;
      root.setEnabled?.(active);
      for (const state of states.values()) {
        if (state?.status !== 'presented-ambient-actor' || !state.animation) continue;
        try {
          if (active) state.animation.start?.(true, 0.82);
          else state.animation.stop?.();
        } catch {}
      }
      if (active) pump();
      return freeze({ ok: true, active, retainedPresentedActors: [...states.values()].filter((state) => state?.status === 'presented-ambient-actor').length, sameSessionReuse: true });
    },
    ready() {
      if (disposed || (!queue.length && !pending.size && !activeLoads)) return Promise.resolve(freeze({ ok: !disposed, disposed }));
      return new Promise((resolve) => readyWaiters.add(resolve));
    },
    setOptionalAssetAdmission(options = {}) {
      if (disposed) return freeze({ ok: false, reason: 'ambient-cast-disposed' });
      admission = buildEonCityL95ProgressiveAssetAdmission({ ...options, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission, queued: queue.length, activeLoads, pendingTasks: pending.size });
    },
    setStreamingFocus(focus = null, { radius = Number.POSITIVE_INFINITY } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'ambient-cast-disposed' });
      streamingFocus = focus?.valid === true ? freeze({ ...focus }) : null;
      streamingRadius = Number.isFinite(Number(radius)) ? Math.max(0, Number(radius)) : Number.POSITIVE_INFINITY;
      pump();
      return freeze({ ok: true, focusValid: streamingFocus?.valid === true, radius: streamingRadius, queued: queue.length, activeLoads });
    },
    getSummary() {
      const rows = [...states.values()];
      return freeze({
        schema: EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA,
        quality: plan.quality,
        active,
        requested: plan.entries.length,
        presented: rows.filter((row) => row.status === 'presented-ambient-actor').length,
        queued: queue.length,
        activeLoads,
        pendingTasks: pending.size,
        maxConcurrentLoads,
        admission,
        streamingFocusValid: streamingFocus?.valid === true,
        streamingRadius: Number.isFinite(streamingRadius) ? streamingRadius : null,
        publicAmbienceOnly: true,
        residentCount: 0,
        agentCount: 0,
        interactiveCount: 0,
        grantsXp: false,
        ownsRenderLoop: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      for (const entry of states.values()) if (entry.container || entry.wrapper) disposeEntry(entry);
      states.clear(); queue.length = 0; pending.clear(); activeLoads = 0; settleReady();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_CITY_L95_MY_FRONTIER_AMBIENT_CAST_SCHEMA, mountEonCityL95MyFrontierAmbientCast });
