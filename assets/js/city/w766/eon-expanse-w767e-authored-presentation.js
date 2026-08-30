import { evaluateEonExpanseW767AAssetPresentation } from './eon-expanse-w767a-asset-truth.js';

const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value : [];

export const EON_EXPANSE_W767E_AUTHORED_PRESENTATION_SCHEMA = 'eon.city.expanse.authored-presentation.w767e.v1';

export function collectEonExpanseW767EBounds(meshes = []) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const mesh of list(meshes)) {
    try {
      mesh?.computeWorldMatrix?.(true);
      const box = mesh?.getBoundingInfo?.().boundingBox;
      if (!box) continue;
      const minimum = box.minimumWorld;
      const maximum = box.maximumWorld;
      minX = Math.min(minX, Number(minimum?.x));
      minY = Math.min(minY, Number(minimum?.y));
      minZ = Math.min(minZ, Number(minimum?.z));
      maxX = Math.max(maxX, Number(maximum?.x));
      maxY = Math.max(maxY, Number(maximum?.y));
      maxZ = Math.max(maxZ, Number(maximum?.z));
    } catch {}
  }
  if (![minX, minY, minZ, maxX, maxY, maxZ].every(Number.isFinite)) return null;
  return freeze({ minX, minY, minZ, maxX, maxY, maxZ, width: maxX - minX, height: maxY - minY, depth: maxZ - minZ });
}

export function isEonExpanseW767ERenderableMesh(mesh) {
  try {
    if (!mesh || mesh.isDisposed?.()) return false;
    return Number(mesh.getTotalVertices?.() || 0) > 0 || Boolean(mesh.geometry);
  } catch {
    return false;
  }
}

export function isEonExpanseW767EVisibleMesh(mesh) {
  if (!isEonExpanseW767ERenderableMesh(mesh)) return false;
  try {
    return mesh.isEnabled?.() !== false
      && mesh.isVisible !== false
      && Number(mesh.visibility ?? 1) > 0.01;
  } catch {
    return false;
  }
}

export function collectEonExpanseW767ERenderEvidence(container = {}) {
  const meshes = list(container.meshes);
  const renderableMeshes = meshes.filter(isEonExpanseW767ERenderableMesh);
  const visibleMeshes = renderableMeshes.filter(isEonExpanseW767EVisibleMesh);
  const materials = new Set(list(container.materials));
  for (const mesh of renderableMeshes) if (mesh?.material) materials.add(mesh.material);
  return freeze({
    meshCount: meshes.length,
    renderableMeshCount: renderableMeshes.length,
    visibleMeshCount: visibleMeshes.length,
    materialCount: materials.size,
    drawCallContribution: visibleMeshes.length
  });
}

export function evaluateEonExpanseW767EAuthoredPresentation({
  placement = {},
  assetId = '',
  requestedPath = '',
  variant = 'primary',
  container = {},
  sourceBounds = null,
  worldBounds = null,
  appliedScale = 1,
  finalPosition = null,
  groundOffset = 0,
  lodState = 'full',
  failureDetail = ''
} = {}) {
  const evidence = collectEonExpanseW767ERenderEvidence(container);
  const truth = evaluateEonExpanseW767AAssetPresentation({
    placement,
    assetId,
    requestedPath,
    variant,
    loadStatus: failureDetail ? 'failed' : 'loaded',
    ...evidence,
    animationGroupCount: list(container.animationGroups).length,
    sourceBounds,
    worldBounds,
    appliedScale,
    finalPosition,
    groundOffset,
    lodState,
    failureDetail
  });
  return freeze({
    schema: EON_EXPANSE_W767E_AUTHORED_PRESENTATION_SCHEMA,
    ok: truth.ok,
    truth,
    evidence
  });
}

export function createEonExpanseW767EFailedPresentation({
  placement = {},
  assetId = '',
  requestedPath = '',
  variant = 'primary',
  reason = 'asset-load-failed'
} = {}) {
  return evaluateEonExpanseW767EAuthoredPresentation({
    placement,
    assetId,
    requestedPath,
    variant,
    container: {},
    appliedScale: Number.NaN,
    failureDetail: String(reason || 'asset-load-failed').slice(0, 160)
  });
}

export function disposeEonExpanseW767ERejectedPresentation(container, wrapper) {
  try { container?.dispose?.(); } catch {}
  try { wrapper?.dispose?.(false, true); } catch {}
}
