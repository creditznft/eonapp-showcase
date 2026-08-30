const freeze = (value) => Object.freeze(value);

export const EON_EXPANSE_W767A_ASSET_TRUTH_SCHEMA = 'eon.city.expanse.asset-truth.w767a.v1';

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePoint(value = {}) {
  return freeze({
    x: finiteNumber(value.x),
    y: finiteNumber(value.y),
    z: finiteNumber(value.z)
  });
}

function normalizeBounds(value = null) {
  if (!value) return null;
  const minX = finiteNumber(value.minX, Number.NaN);
  const minY = finiteNumber(value.minY, Number.NaN);
  const minZ = finiteNumber(value.minZ, Number.NaN);
  const maxX = finiteNumber(value.maxX, Number.NaN);
  const maxY = finiteNumber(value.maxY, Number.NaN);
  const maxZ = finiteNumber(value.maxZ, Number.NaN);
  if (![minX, minY, minZ, maxX, maxY, maxZ].every(Number.isFinite)) return null;
  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;
  if (![width, height, depth].every(Number.isFinite)) return null;
  return freeze({ minX, minY, minZ, maxX, maxY, maxZ, width, height, depth });
}

function boundsCenter(bounds) {
  if (!bounds) return null;
  return freeze({
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2
  });
}

function distance2d(a, b) {
  return Math.hypot(finiteNumber(a?.x) - finiteNumber(b?.x), finiteNumber(a?.z) - finiteNumber(b?.z));
}

export function evaluateEonExpanseW767AAssetPresentation({
  placement = {},
  assetId = '',
  requestedPath = '',
  variant = 'primary',
  loadStatus = 'loaded',
  meshCount = 0,
  renderableMeshCount = 0,
  visibleMeshCount = 0,
  materialCount = 0,
  animationGroupCount = 0,
  sourceBounds = null,
  worldBounds = null,
  appliedScale = 1,
  finalPosition = null,
  groundOffset = 0,
  lodState = 'full',
  drawCallContribution = 0,
  failureDetail = ''
} = {}) {
  const normalizedSourceBounds = normalizeBounds(sourceBounds);
  const normalizedWorldBounds = normalizeBounds(worldBounds);
  const requestedPosition = normalizePoint(placement.position || {});
  const normalizedFinalPosition = normalizePoint(finalPosition || placement.position || {});
  const targetHeight = finiteNumber(placement.targetHeight);
  const scale = finiteNumber(appliedScale, Number.NaN);
  const renderable = Math.max(0, Math.trunc(finiteNumber(renderableMeshCount)));
  const visible = Math.max(0, Math.trunc(finiteNumber(visibleMeshCount)));
  const materials = Math.max(0, Math.trunc(finiteNumber(materialCount)));
  const worldCenter = boundsCenter(normalizedWorldBounds);
  const placementDistance = worldCenter ? distance2d(worldCenter, requestedPosition) : Number.POSITIVE_INFINITY;
  const groundDelta = normalizedWorldBounds
    ? Math.abs(normalizedWorldBounds.minY - requestedPosition.y)
    : Number.POSITIVE_INFINITY;
  const groundingTolerance = Math.max(0.4, targetHeight > 0 ? targetHeight * 0.08 : 0.4);
  const placementTolerance = Math.max(8, targetHeight > 0 ? targetHeight * 2.5 : 8);
  const reasons = [];

  if (String(loadStatus) !== 'loaded') reasons.push('load-not-complete');
  if (String(failureDetail || '').trim()) reasons.push(`load-detail:${String(failureDetail).trim().slice(0, 160)}`);
  if (!String(requestedPath || '').trim()) reasons.push('requested-path-missing');
  if (renderable < 1) reasons.push('no-renderable-meshes');
  if (visible < 1) reasons.push('no-visible-meshes');
  if (materials < 1) reasons.push('materials-missing');
  if (!normalizedSourceBounds || normalizedSourceBounds.height <= 0.001) reasons.push('source-bounds-invalid');
  if (!normalizedWorldBounds || normalizedWorldBounds.height <= 0.001) reasons.push('world-bounds-invalid');
  if (!Number.isFinite(scale) || scale <= 0.0001 || scale > 1000) reasons.push('scale-invalid');
  if (targetHeight > 0 && normalizedWorldBounds) {
    const heightDelta = Math.abs(normalizedWorldBounds.height - targetHeight);
    if (heightDelta > Math.max(0.6, targetHeight * 0.18)) reasons.push('target-height-mismatch');
  }
  if (groundDelta > groundingTolerance) reasons.push('grounding-invalid');
  if (placementDistance > placementTolerance) reasons.push('outside-expected-zone');

  const ok = reasons.length === 0;
  return freeze({
    schema: EON_EXPANSE_W767A_ASSET_TRUTH_SCHEMA,
    ok,
    status: ok ? 'presented' : 'rejected',
    placementId: String(placement.id || ''),
    zoneId: String(placement.zoneId || ''),
    assetId: String(assetId || placement.assetId || ''),
    requestedPath: String(requestedPath || ''),
    variant: variant === 'fallback' ? 'fallback' : 'primary',
    loadStatus: String(loadStatus || ''),
    failureReason: ok ? '' : reasons.join(','),
    failureDetail: String(failureDetail || '').trim().slice(0, 160),
    meshCount: Math.max(0, Math.trunc(finiteNumber(meshCount))),
    renderableMeshCount: renderable,
    visibleMeshCount: visible,
    materialCount: materials,
    animationGroupCount: Math.max(0, Math.trunc(finiteNumber(animationGroupCount))),
    sourceDimensions: normalizedSourceBounds,
    targetHeight,
    appliedScale: scale,
    requestedPosition,
    finalPosition: normalizedFinalPosition,
    groundOffset: finiteNumber(groundOffset),
    visibility: freeze({ visible, renderable, ratio: renderable > 0 ? visible / renderable : 0 }),
    worldBounds: normalizedWorldBounds,
    placementDistance,
    groundDelta,
    lodState: String(lodState || 'full'),
    drawCallContribution: Math.max(0, Math.trunc(finiteNumber(drawCallContribution))),
    reasons: freeze(reasons)
  });
}

export function validateEonExpanseW767AAssetTruthRecord(record = {}) {
  return Boolean(
    record
    && record.schema === EON_EXPANSE_W767A_ASSET_TRUTH_SCHEMA
    && typeof record.ok === 'boolean'
    && typeof record.assetId === 'string'
    && typeof record.requestedPath === 'string'
    && Array.isArray(record.reasons)
  );
}
