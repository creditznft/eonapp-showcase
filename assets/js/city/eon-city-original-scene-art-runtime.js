/**
 * W603 — Command Horizon original scene-art runtime.
 *
 * Loads only catalogued, same-origin, source-controlled environment GLBs. It
 * attaches each kit to a deliberate City anchor and leaves procedural detail
 * available when a load fails. The runtime does not fetch remote art, write
 * user data, start audio, or infer visual approval.
 */
import '@babylonjs/loaders/glTF';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { getEonCitySceneArtTextureMode, resolveEonCitySceneArtAssetId } from './eon-city-scene-art-quality.js';

export const EON_CITY_ORIGINAL_SCENE_ART_RUNTIME_SCHEMA = 'eon.city.original-scene-art-runtime.w603.v1';
const CITY_BOOT_AWAIT_TIMEOUT_MS = 10_000;

function freeze(value) {
  return Object.freeze(value);
}

function splitAssetPath(assetPath = '') {
  const normalized = String(assetPath || '');
  const slash = normalized.lastIndexOf('/');
  if (slash < 0) return { rootUrl: '/', fileName: normalized };
  return { rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) };
}

async function loadLocalContainer({ variant, scene, signal, onProgress }) {
  if (signal?.aborted) throw new Error('asset-load-aborted');
  const { rootUrl, fileName } = splitAssetPath(variant?.sourcePath);
  if (!fileName || !rootUrl.startsWith('/assets/city/')) throw new Error('asset-path-not-local-city');
  onProgress?.({ stage: 'loader-open', value: 0.25, sourcePath: variant.sourcePath, localOnly: true });
  const container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const total = Number(event?.total || 0);
    const loaded = Number(event?.loaded || 0);
    onProgress?.({ stage: 'loader-progress', value: total > 0 ? Math.min(0.95, loaded / total) : null, sourcePath: variant.sourcePath, localOnly: true });
  });
  if (signal?.aborted) {
    try { container?.dispose?.(); } catch {}
    throw new Error('asset-load-aborted');
  }
  return container;
}

function attachToAnchor(container, anchor) {
  const roots = container?.rootNodes || [];
  for (const root of roots) {
    try { root.parent = anchor; } catch {}
  }
  return roots;
}

const ART_KITS = Object.freeze([
  Object.freeze({
    assetId: 'command-horizon-arrival-gate',
    texturedAssetId: 'command-horizon-arrival-gate-textured',
    anchorKey: 'arrivalGate',
    required: true
  }),
  Object.freeze({
    assetId: 'command-horizon-command-deck',
    texturedAssetId: 'command-horizon-command-deck-textured',
    anchorKey: 'commandDeck',
    required: true
  }),
  Object.freeze({
    assetId: 'command-horizon-wayfinding',
    texturedAssetId: 'command-horizon-wayfinding-textured',
    anchorKey: 'wayfinding',
    required: false
  })
]);

/**
 * The loaded files are original environment art candidates. A loaded result
 * proves only asset/runtime integrity, never human visual approval.
 */
export function createEonCityOriginalSceneArtRuntime({ scene, assetRuntime, quality = 'balanced', anchors = {}, onStatus = null } = {}) {
  const records = new Map();
  let disposed = false;

  const loadOne = async ({ assetId, texturedAssetId, anchorKey, required }) => {
    const anchor = anchors?.[anchorKey];
    const resolvedAssetId = resolveEonCitySceneArtAssetId({ assetId, texturedAssetId, quality });
    if (disposed || !anchor) return freeze({ ok: false, assetId: resolvedAssetId, fallbackAssetId: assetId, required, reason: disposed ? 'scene-art-runtime-disposed' : 'anchor-missing' });
    const cacheKey = `original-scene-art:${resolvedAssetId}:${quality}`;
    const result = await assetRuntime.loadBabylonAsset(resolvedAssetId, {
      scene,
      quality,
      cacheKey,
      timeoutMs: CITY_BOOT_AWAIT_TIMEOUT_MS,
      loadAssetContainer: loadLocalContainer,
      onProgress: (progress) => onStatus?.(`Loading local Command Horizon art: ${resolvedAssetId} ${progress.stage}.`)
    });
    if (!result.ok) return freeze({ ...result, assetId: resolvedAssetId, fallbackAssetId: assetId, required });
    const handle = assetRuntime.handles.get(cacheKey)?.handle;
    if (!handle) return freeze({ ok: false, assetId: resolvedAssetId, fallbackAssetId: assetId, required, reason: 'loaded-handle-unavailable' });
    attachToAnchor(handle, anchor);
    records.set(resolvedAssetId, freeze({
      assetId: resolvedAssetId,
      fallbackAssetId: assetId,
      required,
      quality: result.quality,
      sourcePath: result.sourcePath,
      textured: resolvedAssetId !== assetId,
      loaded: true
    }));
    return freeze({ ...result, assetId: resolvedAssetId, fallbackAssetId: assetId, required });
  };

  return freeze({
    async start() {
      const plan = quality === 'lite' ? ART_KITS.filter((item) => item.assetId !== 'command-horizon-wayfinding') : ART_KITS;
      const results = await Promise.all(plan.map(loadOne));
      const requiredOk = results.filter((item) => item.required).every((item) => item.ok);
      const textureMode = getEonCitySceneArtTextureMode(quality);
      onStatus?.(requiredOk
        ? `Original Command Horizon ${textureMode} art loaded locally. Owner visual and device review are still required.`
        : 'One or more Command Horizon art candidates could not load; procedural City detail remains available.');
      return freeze({
        results: freeze(results),
        requiredOk,
        localOnly: true,
        textureMode,
        ktx2BasisTexturePackShipped: false,
        ownerVisualApprovalPending: true
      });
    },
    getSummary() {
      return freeze({
        schema: EON_CITY_ORIGINAL_SCENE_ART_RUNTIME_SCHEMA,
        quality,
        configuredAssetIds: freeze(ART_KITS.map((item) => resolveEonCitySceneArtAssetId({ ...item, quality }))),
        texturelessFallbackAssetIds: freeze(ART_KITS.map((item) => item.assetId)),
        loadedAssetIds: freeze([...records.keys()]),
        loadedCount: records.size,
        localOnly: true,
        remoteNetwork: false,
        containsUserData: false,
        textureAuthoringComplete: false,
        textureMode: getEonCitySceneArtTextureMode(quality),
        sourceGeneratedPbrTextures: quality !== 'lite',
        ktx2BasisTexturePackShipped: false,
        ownerVisualApprovalPending: true,
        disposed
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      records.clear();
    }
  });
}
