import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';
import {
  EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS,
  EON_EXPANSE_W766_ROUTE_LAMP_PLACEMENTS
} from './eon-expanse-w766-region-contract.js';
import { evaluateEonExpanseW767AAssetPresentation } from './eon-expanse-w767a-asset-truth.js';

const freeze = (value) => Object.freeze(value);
const QUALITY_RANK = freeze({ lite: 0, balanced: 1, cinematic: 2 });

export const EON_EXPANSE_W766B_HERO_ASSETS_SCHEMA = 'eon.city.expanse.hero-assets.w767a.v2';

function splitAssetPath(path = '') {
  const normalized = String(path || '');
  const slash = normalized.lastIndexOf('/');
  return slash < 0
    ? freeze({ rootUrl: '/', fileName: normalized })
    : freeze({ rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) });
}

function isLocalW649Asset(path = '') {
  return /^\/assets\/city\/w649\/(primary|fallback)\/world\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || ''));
}

function collectBounds(meshes = []) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo?.().boundingBox;
      if (!box) continue;
      const minimum = box.minimumWorld;
      const maximum = box.maximumWorld;
      minX = Math.min(minX, minimum.x);
      minY = Math.min(minY, minimum.y);
      minZ = Math.min(minZ, minimum.z);
      maxX = Math.max(maxX, maximum.x);
      maxY = Math.max(maxY, maximum.y);
      maxZ = Math.max(maxZ, maximum.z);
    } catch {}
  }
  if (![minX, minY, minZ, maxX, maxY, maxZ].every(Number.isFinite)) return null;
  return freeze({ minX, minY, minZ, maxX, maxY, maxZ, width: maxX - minX, height: maxY - minY, depth: maxZ - minZ });
}

function isRenderableMesh(mesh) {
  try {
    if (!mesh || mesh.isDisposed?.()) return false;
    const vertices = Number(mesh.getTotalVertices?.() || 0);
    return vertices > 0 || Boolean(mesh.geometry);
  } catch {
    return false;
  }
}

function isVisiblyPresentedMesh(mesh) {
  if (!isRenderableMesh(mesh)) return false;
  try {
    return mesh.isEnabled?.() !== false
      && mesh.isVisible !== false
      && Number(mesh.visibility ?? 1) > 0.01;
  } catch {
    return false;
  }
}

function countMaterials(container, meshes) {
  const materials = new Set(container.materials || []);
  for (const mesh of meshes) {
    if (mesh?.material) materials.add(mesh.material);
  }
  return materials.size;
}

function disposeRejectedPresentation(container, wrapper) {
  try { container?.dispose?.(); } catch {}
  try { wrapper?.dispose?.(false, true); } catch {}
}

function createFailedAttempt({ placement, assetId = '', variant = 'primary', path = '', reason = 'asset-load-failed' } = {}) {
  return evaluateEonExpanseW767AAssetPresentation({
    placement,
    assetId,
    requestedPath: path,
    variant,
    loadStatus: 'failed',
    appliedScale: Number.NaN,
    failureDetail: reason
  });
}

async function loadPlacement({ scene, parent, placement, quality, disposed }) {
  const asset = getEonCityW649WorldAsset(placement.assetId);
  if (!asset) {
    const attempt = createFailedAttempt({ placement, assetId: placement.assetId, reason: 'asset-not-registered' });
    return freeze({ ok: false, id: placement.id, assetId: placement.assetId, reason: attempt.failureReason, attempts: freeze([attempt]) });
  }
  const variants = quality === 'lite'
    ? [asset.variants.primary, asset.variants.fallback]
    : [asset.variants.primary, asset.variants.fallback];
  const attempts = [];
  let lastReason = 'asset-load-failed';
  for (const variant of variants) {
    const variantName = variant === asset.variants.primary ? 'primary' : 'fallback';
    if (!isLocalW649Asset(variant?.path)) {
      const attempt = createFailedAttempt({ placement, assetId: asset.id, variant: variantName, path: variant?.path, reason: 'asset-path-invalid' });
      attempts.push(attempt);
      lastReason = attempt.failureReason;
      continue;
    }
    const { rootUrl, fileName } = splitAssetPath(variant.path);
    let container = null;
    let wrapper = null;
    try {
      container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
      if (disposed()) {
        try { container.dispose?.(); } catch {}
        const attempt = createFailedAttempt({ placement, assetId: asset.id, variant: variantName, path: variant.path, reason: 'disposed-during-load' });
        attempts.push(attempt);
        return freeze({ ok: false, id: placement.id, assetId: asset.id, reason: attempt.failureReason, attempts: freeze(attempts) });
      }
      container.addAllToScene?.();
      wrapper = new TransformNode(`w766b-hero-${placement.id}`, scene);
      wrapper.parent = parent;
      wrapper.position.set(placement.position.x, placement.position.y, placement.position.z);
      wrapper.rotation.y = Number(placement.rotationY || 0);
      for (const rootNode of container.rootNodes || []) rootNode.parent = wrapper;
      for (const mesh of container.meshes || []) {
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: 'expanse-authored-zone-asset', placementId: placement.id, zoneId: placement.zoneId || '', assetId: asset.id, presentationRole: placement.presentationRole || 'hero' });
      }
      const meshes = container.meshes || [];
      const initialBounds = collectBounds(meshes);
      let appliedScale = 1;
      if (initialBounds?.height > 0.001 && Number(placement.targetHeight) > 0) {
        appliedScale = Number(placement.targetHeight) / initialBounds.height;
        wrapper.scaling.setAll(appliedScale);
        wrapper.computeWorldMatrix?.(true);
      }
      const scaledBounds = collectBounds(meshes);
      let groundOffset = 0;
      if (scaledBounds) {
        groundOffset = Number(placement.position.y || 0) - scaledBounds.minY;
        wrapper.position.y += groundOffset;
        wrapper.computeWorldMatrix?.(true);
      }
      const finalBounds = collectBounds(meshes);
      const renderableMeshes = meshes.filter(isRenderableMesh);
      const visibleMeshes = renderableMeshes.filter(isVisiblyPresentedMesh);
      const truth = evaluateEonExpanseW767AAssetPresentation({
        placement,
        assetId: asset.id,
        requestedPath: variant.path,
        variant: variantName,
        loadStatus: 'loaded',
        meshCount: meshes.length,
        renderableMeshCount: renderableMeshes.length,
        visibleMeshCount: visibleMeshes.length,
        materialCount: countMaterials(container, renderableMeshes),
        animationGroupCount: container.animationGroups?.length || 0,
        sourceBounds: initialBounds,
        worldBounds: finalBounds,
        appliedScale,
        finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
        groundOffset,
        lodState: placement.distantOnly === true ? 'distant' : 'full',
        drawCallContribution: visibleMeshes.length
      });
      attempts.push(truth);
      if (!truth.ok) {
        lastReason = truth.failureReason;
        disposeRejectedPresentation(container, wrapper);
        container = null;
        wrapper = null;
        continue;
      }
      const suppressedProxies = [];
      for (const meshName of placement.proxyMeshNames || []) {
        const proxy = scene.getMeshByName?.(meshName);
        if (!proxy) continue;
        suppressedProxies.push(freeze({ mesh: proxy, visibility: Number(proxy.visibility ?? 1) }));
        proxy.visibility = 0.025;
        proxy.metadata = freeze({ ...(proxy.metadata || {}), visualProxySuppressedBy: placement.id });
      }
      return freeze({
        ok: true,
        id: placement.id,
        assetId: asset.id,
        path: variant.path,
        variant: variantName,
        wrapper,
        container,
        meshCount: meshes.length,
        zoneId: placement.zoneId || '',
        distantOnly: placement.distantOnly === true,
        suppressedProxies: freeze(suppressedProxies),
        truth,
        attempts: freeze(attempts)
      });
    } catch (error) {
      const reason = String(error?.message || error || 'asset-load-failed').slice(0, 220);
      const attempt = createFailedAttempt({ placement, assetId: asset.id, variant: variantName, path: variant.path, reason });
      attempts.push(attempt);
      lastReason = attempt.failureReason;
      disposeRejectedPresentation(container, wrapper);
    }
  }
  return freeze({ ok: false, id: placement.id, assetId: asset.id, reason: lastReason, attempts: freeze(attempts) });
}

export function mountEonExpanseW766BHeroAssets({ scene, parent, quality = 'balanced' } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'scene-and-parent-required' });
  const resolvedQuality = QUALITY_RANK[quality] == null ? 'balanced' : quality;
  const root = new TransformNode('w766b-hero-assets-root', scene);
  root.parent = parent;
  let isDisposed = false;
  const loaded = new Map();
  const failures = new Map();
  const pending = new Set();
  const pendingPlacementIds = new Set();
  const allowed = EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS.filter((placement) => QUALITY_RANK[resolvedQuality] >= QUALITY_RANK[placement.minimumQuality || 'lite']);
  const placements = [...allowed];
  if (QUALITY_RANK[resolvedQuality] >= QUALITY_RANK.balanced) {
    // L95: authored route lamps are accents, not a repeated GLB wall. Keep the
    // same authored lighting language while reducing duplicate decode/draw cost.
    const lampStride = resolvedQuality === 'cinematic' ? 2 : 3;
    for (let index = 0; index < EON_EXPANSE_W766_ROUTE_LAMP_PLACEMENTS.length; index += lampStride) {
      const position = EON_EXPANSE_W766_ROUTE_LAMP_PLACEMENTS[index];
      placements.push(freeze({
        id: `route-lamp-${index + 1}`,
        zoneId: 'signal-frontier-route',
        assetId: 'eoncity-street-lamp',
        position,
        rotationY: index % 2 === 0 ? 0 : Math.PI,
        targetHeight: 3.6,
        minimumQuality: 'balanced',
        presentationRole: 'route-accent'
      }));
    }
  }
  for (const placement of placements) {
    pendingPlacementIds.add(placement.id);
    const task = loadPlacement({ scene, parent: root, placement, quality: resolvedQuality, disposed: () => isDisposed })
      .then((result) => {
        if (result.ok) loaded.set(placement.id, result);
        else failures.set(placement.id, result);
        return result;
      })
      .finally(() => { pending.delete(task); pendingPlacementIds.delete(placement.id); });
    pending.add(task);
  }
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766B_HERO_ASSETS_SCHEMA,
    root,
    ready() { return Promise.allSettled([...pending]); },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W766B_HERO_ASSETS_SCHEMA,
        quality: resolvedQuality,
        requested: placements.length,
        loaded: loaded.size,
        pending: pending.size,
        failed: failures.size,
        assets: freeze([...loaded.values()].map((entry) => freeze({
          id: entry.id,
          zoneId: entry.zoneId,
          assetId: entry.assetId,
          variant: entry.variant,
          meshCount: entry.meshCount,
          distantOnly: entry.distantOnly,
          truth: entry.truth,
          attempts: entry.attempts
        }))),
        failures: freeze([...failures.values()].map((entry) => {
          const placement = placements.find((candidate) => candidate.id === entry.id);
          return freeze({ id: entry.id, zoneId: placement?.zoneId || '', assetId: entry.assetId, reason: entry.reason, attempts: entry.attempts });
        })),
        pendingAssets: freeze([...pendingPlacementIds].map((id) => {
          const placement = placements.find((candidate) => candidate.id === id);
          return freeze({ id, zoneId: placement?.zoneId || '', assetId: placement?.assetId || '' });
        })),
        assetTruth: freeze({
          presented: loaded.size,
          rejected: failures.size,
          proxySuppressionRequiresPresentation: true
        }),
        canonicalScene: root.getScene?.() === scene,
        remoteAssets: false
      });
    },
    dispose() {
      isDisposed = true;
      for (const entry of loaded.values()) {
        for (const proxy of entry.suppressedProxies || []) {
          try {
            proxy.mesh.visibility = proxy.visibility;
            if (proxy.mesh.metadata?.visualProxySuppressedBy === entry.id) {
              const { visualProxySuppressedBy: _visualProxySuppressedBy, ...metadata } = proxy.mesh.metadata;
              proxy.mesh.metadata = freeze(metadata);
            }
          } catch {}
        }
        try { entry.container?.dispose?.(); } catch {}
      }
      loaded.clear();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}
