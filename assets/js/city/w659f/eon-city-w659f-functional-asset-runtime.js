/**
 * W659F — Babylon runtime for six functional City assets.
 *
 * It starts after the first playable scene is constructed, never blocks the
 * first frame, uses content-hashed same-origin GLBs, keeps a procedural City
 * usable on every load failure, and registers conservative authored collision
 * proxies from the same manifest transforms used by rendering.
 */
import '@babylonjs/loaders/glTF/index.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { configureEonCityW649MeshoptDecoder } from '../w649/eon-city-w649-babylon-core-runtime.js';
import { integrateEonCityW649Container } from '../w649/eon-city-w649-visual-integration.js';
import {
  EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST,
  EON_CITY_W659F_FUNCTIONAL_ASSETS,
  EON_CITY_W659F_FIXED_CORE_ASSET_IDS,
  getEonCityW659fFunctionalAsset
} from './eon-city-w659f-functional-asset-manifest.js';

export const EON_CITY_W659F_FUNCTIONAL_ASSET_RUNTIME_SCHEMA = 'eon.city.w659f.functional-asset-runtime.v1';
const freeze = (value) => Object.freeze(value);
const LOAD_TIMEOUT_MS = 14_000;
const fixedIds = new Set(EON_CITY_W659F_FIXED_CORE_ASSET_IDS);

function splitAssetPath(path = '') {
  const value = String(path || '');
  const index = value.lastIndexOf('/');
  return index < 0 ? { rootUrl: '/', fileName: value } : { rootUrl: value.slice(0, index + 1), fileName: value.slice(index + 1) };
}

async function withTimeout(promise, timeoutMs = LOAD_TIMEOUT_MS) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = globalThis.setTimeout?.(() => reject(new Error('w659f-functional-asset-load-timeout')), timeoutMs) || null; })
    ]);
  } finally {
    if (timer) globalThis.clearTimeout?.(timer);
  }
}

async function defaultLoadContainer({ scene, path, signal, onProgress }) {
  if (signal?.aborted) throw new Error('w659f-functional-load-aborted');
  const { rootUrl, fileName } = splitAssetPath(path);
  if (!rootUrl.startsWith('/assets/city/w659f/') || !fileName) throw new Error('w659f-functional-path-invalid');
  const container = await withTimeout(SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const loaded = Math.max(0, Number(event?.loaded || 0));
    const total = Math.max(0, Number(event?.total || 0));
    onProgress?.(freeze({ path, loaded, total, ratio: total > 0 ? Math.min(1, loaded / total) : null }));
  }));
  if (signal?.aborted) {
    try { container?.dispose?.(); } catch {}
    throw new Error('w659f-functional-load-aborted');
  }
  return container;
}

function computeBounds(container) {
  const meshes = (container?.meshes || []).filter((mesh) => mesh?.getBoundingInfo);
  if (!meshes.length) return null;
  let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, box.minimumWorld);
      max = Vector3.Maximize(max, box.maximumWorld);
    } catch {}
  }
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return freeze({ min, max, height: Math.max(0.001, max.y - min.y), width: Math.max(0.001, max.x - min.x), depth: Math.max(0.001, max.z - min.z) });
}

function attachContainer({ scene, container, entry, variantName, quality }) {
  const wrapper = new TransformNode(`w659f-functional-${entry.id}`, scene);
  wrapper.position.set(entry.placement.x, entry.placement.y || 0, entry.placement.z);
  wrapper.rotation.y = entry.placement.rotationY || 0;
  wrapper.metadata = freeze({
    kind: 'w659f-functional-city-anchor',
    assetId: entry.id,
    label: entry.label,
    districtId: entry.districtId,
    eonCityLandmarkId: entry.landmarkId,
    eonCitySemanticRole: entry.role,
    loadClass: entry.loadClass,
    interactive: true,
    reviewOnly: true,
    autoExecute: false,
    autoNavigate: false,
    opensRoute: false,
    localOnly: true,
    privateDataVisible: false,
    variant: variantName
  });
  container?.addAllToScene?.();
  for (const root of container?.rootNodes || []) root.parent = wrapper;
  let bounds = computeBounds(container);
  if (bounds) {
    const scale = Math.min(24, Math.max(0.005, Number(entry.targetHeight || 2) / bounds.height));
    wrapper.scaling.setAll(scale);
    wrapper.computeWorldMatrix?.(true);
    bounds = computeBounds(container);
    if (bounds) {
      wrapper.position.y += (entry.placement.y || 0) - bounds.min.y;
      wrapper.computeWorldMatrix?.(true);
      bounds = computeBounds(container);
    }
  }
  for (const mesh of container?.meshes || []) {
    mesh.isPickable = true;
    mesh.checkCollisions = false;
    mesh.metadata = freeze({
      ...(mesh.metadata || {}),
      kind: 'w659f-functional-city-anchor-mesh',
      assetId: entry.id,
      eonCityLandmarkId: entry.landmarkId,
      eonCitySemanticRole: entry.role,
      interactive: true,
      reviewOnly: true,
      autoExecute: false,
      localOnly: true,
      visualMeshCollision: false
    });
  }
  const visualIntegration = integrateEonCityW649Container({
    scene,
    container,
    quality,
    assetId: `w659f-${entry.id}`,
    role: 'district-terminal',
    allowShadowCaster: false
  });
  return freeze({ wrapper, roots: freeze([...(container?.rootNodes || [])]), bounds, visualIntegration });
}

function distanceTo(entry, position = {}) {
  return Math.hypot(Number(position.x || 0) - entry.placement.x, Number(position.z || 0) - entry.placement.z);
}

function getColliders(entry) {
  return freeze([entry.collider, ...(entry.additionalColliders || [])]);
}

export function createEonCityW659fFunctionalAssetRuntime({
  scene,
  quality = 'balanced',
  reducedMotion = false,
  collisionRegistry = null,
  loadContainer = defaultLoadContainer,
  onStatus = null,
  onProgress = null
} = {}) {
  const resolvedQuality = quality === 'lite' ? 'lite' : (quality === 'cinematic' ? 'cinematic' : 'balanced');
  const records = new Map();
  const inFlight = new Map();
  const queue = [];
  const transitions = [];
  const preferFallbackVariant = resolvedQuality === 'lite';
  const dynamicResidentBudget = resolvedQuality === 'cinematic' ? 3 : (resolvedQuality === 'balanced' ? 2 : 1);
  const residentLimit = Math.min(EON_CITY_W659F_FUNCTIONAL_ASSETS.length, fixedIds.size + dynamicResidentBudget);
  let activeLoads = 0;
  let disposed = false;
  let failedLoadCount = 0;
  let lastPosition = freeze({ x: 0, z: 0 });
  configureEonCityW649MeshoptDecoder();

  for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
    if (fixedIds.has(entry.id)) {
      for (const volume of getColliders(entry)) collisionRegistry?.registerFixed?.(volume);
    }
  }

  const disposeRecord = (record, reason = 'unloaded') => {
    if (!record) return false;
    if (!fixedIds.has(record.entry.id)) collisionRegistry?.unregisterResident?.(record.entry.id);
    try { record.visualIntegration?.dispose?.(); } catch {}
    for (const root of record.roots || record.container?.rootNodes || []) {
      try { root.parent = null; } catch {}
    }
    try { record.container?.removeAllFromScene?.(); } catch {}
    try { record.container?.dispose?.(); } catch {}
    try { record.wrapper?.dispose?.(false, true); } catch {}
    records.delete(record.entry.id);
    transitions.push(freeze({ type: 'unload', assetId: record.entry.id, reason, at: Date.now() }));
    return true;
  };

  const selectedVariantOrder = () => preferFallbackVariant ? ['fallback'] : ['primary', 'fallback'];

  const loadNow = async (entry) => {
    if (disposed || records.has(entry.id)) return freeze({ ok: records.has(entry.id), assetId: entry.id, cached: records.has(entry.id) });
    const controller = new AbortController();
    const task = { entry, controller, startedAt: Date.now() };
    inFlight.set(entry.id, task);
    activeLoads += 1;
    let lastError = null;
    try {
      for (const variantName of selectedVariantOrder()) {
        const variant = entry.variants[variantName];
        try {
          onStatus?.(`Preparing ${entry.label} as a functional City anchor.`);
          const container = await loadContainer({
            scene,
            path: variant.path,
            signal: controller.signal,
            onProgress: (progress) => onProgress?.({ scope: 'w659f-functional', assetId: entry.id, variant: variantName, ...progress })
          });
          if (disposed || controller.signal.aborted) {
            try { container?.dispose?.(); } catch {}
            throw new Error('w659f-functional-load-aborted-after-container');
          }
          const attached = attachContainer({ scene, container, entry, variantName, quality: resolvedQuality });
          const record = { entry, variantName, variant, container, wrapper: attached.wrapper, roots: attached.roots, bounds: attached.bounds, visualIntegration: attached.visualIntegration, loadedAt: Date.now(), lastNearAt: Date.now() };
          records.set(entry.id, record);
          if (!fixedIds.has(entry.id)) collisionRegistry?.registerResident?.(entry.id, getColliders(entry));
          transitions.push(freeze({ type: 'load', assetId: entry.id, variant: variantName, bytes: variant.bytes, at: Date.now() }));
          onStatus?.(`${entry.label} is resident and connected to ${entry.role.replaceAll('-', ' ')}.`);
          return freeze({ ok: true, assetId: entry.id, variant: variantName, bytes: variant.bytes, bounds: attached.bounds });
        } catch (error) {
          lastError = error;
          if (controller.signal.aborted || disposed) break;
        }
      }
      failedLoadCount += 1;
      transitions.push(freeze({ type: 'failed', assetId: entry.id, reason: String(lastError?.message || lastError || 'load-failed'), at: Date.now() }));
      return freeze({ ok: false, assetId: entry.id, reason: String(lastError?.message || lastError || 'load-failed'), proceduralFallbackActive: true });
    } finally {
      activeLoads = Math.max(0, activeLoads - 1);
      inFlight.delete(entry.id);
      pumpQueue();
    }
  };

  const pumpQueue = () => {
    if (disposed) return;
    const max = EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.maxConcurrentLoads;
    while (activeLoads < max && queue.length) {
      const entry = queue.shift();
      if (!entry || records.has(entry.id) || inFlight.has(entry.id)) continue;
      void loadNow(entry);
    }
  };

  const requestLoad = (entryOrId) => {
    const entry = typeof entryOrId === 'string' ? getEonCityW659fFunctionalAsset(entryOrId) : entryOrId;
    if (!entry || disposed) return false;
    if (records.has(entry.id) || inFlight.has(entry.id) || queue.some((item) => item.id === entry.id)) return true;
    queue.push(entry);
    pumpQueue();
    return true;
  };

  const evictFarResidents = (position) => {
    if (records.size <= residentLimit) return;
    const candidates = [...records.values()]
      .filter((record) => !fixedIds.has(record.entry.id))
      .sort((left, right) => distanceTo(right.entry, position) - distanceTo(left.entry, position));
    while (records.size > residentLimit && candidates.length) disposeRecord(candidates.shift(), 'resident-limit');
  };

  const update = (position = {}) => {
    if (disposed) return null;
    lastPosition = freeze({ x: Number(position.x || 0), z: Number(position.z || 0) });
    const loadRadius = EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.proximityLoadRadius;
    const unloadRadius = EON_CITY_W659F_FUNCTIONAL_ASSET_MANIFEST.loadPolicy.proximityUnloadRadius;
    for (const entry of EON_CITY_W659F_FUNCTIONAL_ASSETS) {
      const distance = distanceTo(entry, lastPosition);
      const record = records.get(entry.id);
      if (record && distance <= unloadRadius) record.lastNearAt = Date.now();
      if (fixedIds.has(entry.id) || distance <= loadRadius) requestLoad(entry);
      if (!fixedIds.has(entry.id) && record && distance > unloadRadius && Date.now() - record.lastNearAt > 5000) disposeRecord(record, 'left-district-residency');
    }
    evictFarResidents(lastPosition);
    return getSummary();
  };

  const getSummary = () => freeze({
    schema: EON_CITY_W659F_FUNCTIONAL_ASSET_RUNTIME_SCHEMA,
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    reducedMotionPreservesVisualDetail: true,
    reducedModeStableWorld: true,
    liteUsesFallbackVariants: preferFallbackVariant,
    districtResidencyEnabled: true,
    cinematicAllAssetsPinned: false,
    residentAssetIds: freeze([...records.keys()]),
    residentCount: records.size,
    residentLimit,
    queuedAssetIds: freeze(queue.map((entry) => entry.id)),
    inFlightAssetIds: freeze([...inFlight.keys()]),
    loadedBytes: [...records.values()].reduce((sum, record) => sum + Number(record.variant.bytes || 0), 0),
    failedLoadCount,
    transitions: freeze(transitions.slice(-24)),
    collision: collisionRegistry?.getSummary?.() || null,
    firstPlayableFrameBlocked: false,
    originalMeshyFilesShippedToRuntime: false,
    sameOriginOnly: true,
    localOnly: true,
    disposed
  });

  return freeze({
    async start() {
      const initial = EON_CITY_W659F_FUNCTIONAL_ASSETS.filter((entry) => fixedIds.has(entry.id));
      for (const entry of initial) requestLoad(entry);
      return freeze({
        ok: true,
        requestedAssetIds: freeze(initial.map((entry) => entry.id)),
        firstPlayableFrameBlocked: false,
        reducedModeStableWorld: true,
        liteUsesFallbackVariants: preferFallbackVariant,
        districtResidencyEnabled: true,
        cinematicAllAssetsPinned: false
      });
    },
    update,
    requestLoad,
    getAssetRecord(id = '') { const record = records.get(String(id || '').trim()); return record ? freeze({ assetId: record.entry.id, variant: record.variantName, bytes: record.variant.bytes, loadedAt: record.loadedAt, bounds: record.bounds }) : null; },
    getSummary,
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      queue.length = 0;
      for (const task of inFlight.values()) task.controller.abort('w659f-runtime-dispose');
      for (const record of [...records.values()]) disposeRecord(record, 'runtime-dispose');
      collisionRegistry?.clearResident?.();
      return getSummary();
    }
  });
}
