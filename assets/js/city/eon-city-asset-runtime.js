/**
 * W365 — Engine-neutral asset lifecycle adapter.
 *
 * It never fetches a model by itself. A renderer can hand it a loader adapter
 * only after an asset passes the catalog's local provenance and release checks.
 * This avoids silently introducing remote art, copied packs, credentials or
 * private user data into either the Babylon or Three.js City renderers.
 */
import {
  CITY_ASSET_CATALOG,
  CITY_ASSET_CATALOG_SCHEMA,
  getCityAssetFallback,
  getCityAssetLoadPlan,
  isCityAssetLoadable,
  normalizeCityAssetQuality
} from './eon-city-asset-catalog.js';

export const CITY_ASSET_RUNTIME_SCHEMA = 'eon.city.asset-runtime.w365.v1';
export const CITY_ASSET_LOAD_TIMEOUT_MS = 10_000;

const LOAD_TIMEOUT_SENTINEL = Object.freeze({ timeout: true });

function releaseMaterial(material) {
  if (!material) return;
  for (const key of ['map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap', 'specularMap']) {
    material[key]?.dispose?.();
  }
  material.dispose?.();
}

/** Dispose a Three.js GLTF scene or group without leaving GPU resources behind. */
export function disposeThreeCityAsset(object) {
  object?.traverse?.((node) => {
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(releaseMaterial);
  });
  object?.removeFromParent?.();
}

/** Dispose a Babylon asset container or imported mesh collection safely. */
export function disposeBabylonCityAsset(handle) {
  if (!handle) return;
  try { handle.animationGroups?.forEach?.((group) => { group.stop?.(); group.dispose?.(); }); } catch {}
  try { handle.removeAllFromScene?.(); } catch {}
  try { handle.dispose?.(); } catch {}
  if (Array.isArray(handle.meshes)) {
    handle.meshes.forEach((mesh) => {
      try { mesh.dispose?.(false, true); } catch {}
    });
  }
}

function blockedResult(asset, reason) {
  return Object.freeze({
    schema: CITY_ASSET_RUNTIME_SCHEMA,
    ok: false,
    assetId: asset?.id || null,
    status: asset?.status || 'unknown',
    reason,
    fallback: getCityAssetFallback(asset),
    remoteNetwork: false,
    containsUserData: false
  });
}

function successResult(asset, { cached = false } = {}) {
  return Object.freeze({
    schema: CITY_ASSET_RUNTIME_SCHEMA,
    ok: true,
    assetId: asset.id,
    status: asset.status,
    cached,
    fallback: null,
    remoteNetwork: false,
    containsUserData: false
  });
}

/**
 * The runtime owns only loaded handles. It cannot mark an entry shipped,
 * bypass provenance checks, or use a URL outside the catalog. Loader adapters
 * receive an AbortSignal, cache key and optional progress callback so the
 * renderer stays in control of engine-specific GLB/GLTF setup.
 */
export class EonCityAssetRuntime {
  constructor({ engine = 'unknown', quality = 'balanced', catalog = CITY_ASSET_CATALOG } = {}) {
    this.engine = String(engine || 'unknown');
    this.quality = normalizeCityAssetQuality(quality);
    this.catalog = Array.isArray(catalog) ? catalog : CITY_ASSET_CATALOG;
    this.handles = new Map();
    this.pending = new Map();
    this.disposed = false;
  }

  resolveAsset(assetId) {
    return this.catalog.find((entry) => entry.id === assetId) || null;
  }

  getPlan(options = {}) {
    // The published catalog is immutable in normal runtime. A custom catalog
    // is accepted only for local renderer tests and still faces the same
    // per-entry release checks before any adapter is invoked.
    if (this.catalog === CITY_ASSET_CATALOG) {
      return getCityAssetLoadPlan({ quality: options.quality || this.quality, families: options.families || null });
    }
    const quality = normalizeCityAssetQuality(options.quality || this.quality);
    const entries = this.catalog
      .filter((entry) => !options.families || options.families.includes(entry.family))
      .map((entry) => Object.freeze({
        id: entry.id,
        family: entry.family,
        role: entry.role,
        tier: entry.qualityTiers?.[quality] || 'fallback',
        status: entry.status,
        loadable: isCityAssetLoadable(entry),
        sourcePath: isCityAssetLoadable(entry) ? entry.sourcePath : null,
        fallback: getCityAssetFallback(entry),
        constraints: Object.freeze({ ...(entry.constraints || {}) })
      }));
    return Object.freeze({
      schema: CITY_ASSET_CATALOG_SCHEMA,
      quality,
      entries: Object.freeze(entries),
      shippedCount: entries.filter((entry) => entry.loadable).length,
      plannedCount: entries.filter((entry) => entry.status === 'planned').length,
      remoteNetwork: false,
      containsUserData: false
    });
  }

  getSummary() {
    const plan = this.getPlan();
    return Object.freeze({
      schema: CITY_ASSET_RUNTIME_SCHEMA,
      catalogSchema: CITY_ASSET_CATALOG_SCHEMA,
      engine: this.engine,
      quality: this.quality,
      plannedAssets: plan.plannedCount,
      declaredShippedAssets: plan.shippedCount,
      loadedAssets: this.handles.size,
      pendingAssets: this.pending.size,
      loadedAssetIds: Object.freeze([...this.handles.keys()]),
      localFallbacksActive: plan.plannedCount > 0 && plan.shippedCount === 0,
      remoteNetwork: false,
      containsUserData: false,
      disposed: this.disposed
    });
  }

  async loadBabylonAsset(assetId, { scene, loadAssetContainer, signal, onProgress, cacheKey = assetId, timeoutMs = CITY_ASSET_LOAD_TIMEOUT_MS } = {}) {
    return this.load(assetId, {
      engine: 'babylon', scene, adapter: loadAssetContainer, signal, onProgress, cacheKey, timeoutMs,
      attach(handle) { handle.addAllToScene?.(); }
    });
  }

  async loadThreeAsset(assetId, { scene, loadGltf, signal, onProgress, cacheKey = assetId, timeoutMs = CITY_ASSET_LOAD_TIMEOUT_MS } = {}) {
    return this.load(assetId, {
      engine: 'three', scene, adapter: loadGltf, signal, onProgress, cacheKey, timeoutMs,
      attach(handle) { const object = handle?.scene || handle; scene?.add?.(object); return object; }
    });
  }

  async load(assetId, { engine, scene, adapter, signal, onProgress, cacheKey, attach, timeoutMs = CITY_ASSET_LOAD_TIMEOUT_MS } = {}) {
    if (this.disposed) return blockedResult(null, 'asset-runtime-disposed');
    const asset = this.resolveAsset(assetId);
    if (!asset) return blockedResult(null, 'unknown-asset');
    if (signal?.aborted) return blockedResult(asset, 'asset-load-aborted-before-start');
    if (!isCityAssetLoadable(asset)) return blockedResult(asset, 'asset-not-shipped-or-not-provenanced');
    if (typeof adapter !== 'function') return blockedResult(asset, `${engine || 'asset'}-loader-adapter-required`);
    const key = String(cacheKey || asset.id);
    if (this.handles.has(key)) return successResult(asset, { cached: true });
    if (this.pending.has(key)) return this.pending.get(key);
    const run = (async () => {
      const safeTimeoutMs = Math.max(250, Math.min(30_000, Number(timeoutMs) || CITY_ASSET_LOAD_TIMEOUT_MS));
      try {
        onProgress?.({ assetId: asset.id, stage: 'validated', value: 0, localOnly: true });
        let timedOut = false;
        let timeoutHandle = null;
        const adapterPromise = Promise.resolve().then(() => adapter({ asset, scene, signal, cacheKey: key, onProgress }));
        adapterPromise.then((lateResult) => {
          if (!timedOut) return;
          try {
            if (engine === 'three') disposeThreeCityAsset(lateResult?.scene || lateResult);
            else disposeBabylonCityAsset(lateResult);
          } catch {}
        }).catch(() => {});
        const timeoutPromise = new Promise((resolve) => {
          timeoutHandle = globalThis.setTimeout?.(() => {
            timedOut = true;
            resolve(LOAD_TIMEOUT_SENTINEL);
          }, safeTimeoutMs) || null;
        });
        const result = await Promise.race([adapterPromise, timeoutPromise]);
        if (timeoutHandle) globalThis.clearTimeout?.(timeoutHandle);
        if (result === LOAD_TIMEOUT_SENTINEL) return blockedResult(asset, `${engine || 'asset'}-load-timeout`);
        if (signal?.aborted) {
          if (engine === 'three') disposeThreeCityAsset(result?.scene || result);
          else disposeBabylonCityAsset(result);
          return blockedResult(asset, 'asset-load-aborted-after-adapter');
        }
        if (!result) return blockedResult(asset, `${engine || 'asset'}-loader-returned-empty`);
        const handle = attach?.(result) || result;
        this.handles.set(key, { engine, handle });
        onProgress?.({ assetId: asset.id, stage: 'ready', value: 1, localOnly: true });
        return successResult(asset);
      } catch (error) {
        return blockedResult(asset, `${engine || 'asset'}-load-failed:${String(error?.message || 'unknown')}`);
      } finally {
        this.pending.delete(key);
      }
    })();
    this.pending.set(key, run);
    return run;
  }

  disposeAsset(cacheKey) {
    const record = this.handles.get(cacheKey);
    if (!record) return false;
    if (record.engine === 'three') disposeThreeCityAsset(record.handle);
    else disposeBabylonCityAsset(record.handle);
    this.handles.delete(cacheKey);
    return true;
  }

  dispose() {
    if (this.disposed) return;
    [...this.handles.keys()].forEach((cacheKey) => this.disposeAsset(cacheKey));
    this.pending.clear();
    this.disposed = true;
  }
}

export function createCityAssetRuntime(options = {}) {
  return new EonCityAssetRuntime(options);
}
