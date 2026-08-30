/**
 * W759R1 — dependency-free authored-asset presentation contract.
 *
 * A successful GLB fetch is not sufficient evidence that the object is usable
 * in the City. This contract verifies the target scale and the post-attachment
 * world bounds before the procedural fallback may be retired.
 */
export const EON_CITY_W759_ATTACHMENT_PRESENTATION_SCHEMA = 'eon.city.attachment-presentation.w759r1.v1';
export const EON_CITY_W759_MIN_SCALE = 0.00001;
export const EON_CITY_W759_MAX_SCALE = 256;
export const EON_CITY_W759_MIN_HEIGHT_RATIO = 0.82;
export const EON_CITY_W759_MAX_HEIGHT_RATIO = 1.18;
export const EON_CITY_W759_DEFAULT_MAX_WORLD_RADIUS = 34;

const freeze = (value) => Object.freeze(value);
const finite = (value) => Number.isFinite(Number(value));

export function computeEonCityW759TargetScale({
  targetHeight,
  sourceHeight,
  minScale = EON_CITY_W759_MIN_SCALE,
  maxScale = EON_CITY_W759_MAX_SCALE
} = {}) {
  const target = Number(targetHeight);
  const source = Number(sourceHeight);
  const minimum = Number(minScale);
  const maximum = Number(maxScale);
  if (!finite(target) || target <= 0 || !finite(source) || source <= 0) {
    return freeze({ ok: false, reason: 'invalid-height', targetHeight: target, sourceHeight: source, scale: null, clamped: false });
  }
  if (!finite(minimum) || !finite(maximum) || minimum <= 0 || maximum <= minimum) {
    return freeze({ ok: false, reason: 'invalid-scale-range', targetHeight: target, sourceHeight: source, scale: null, clamped: false });
  }
  const requestedScale = target / source;
  const scale = Math.min(maximum, Math.max(minimum, requestedScale));
  return freeze({
    ok: finite(scale) && scale > 0,
    reason: finite(scale) && scale > 0 ? 'target-height' : 'invalid-scale',
    targetHeight: target,
    sourceHeight: source,
    requestedScale,
    scale,
    clamped: Math.abs(scale - requestedScale) > Number.EPSILON,
    minScale: minimum,
    maxScale: maximum
  });
}

export function computeEonCityW759GroundCorrection({ currentWorldMinY, anchorWorldY, positionY = 0 } = {}) {
  const current = Number(currentWorldMinY);
  const anchor = Number(anchorWorldY);
  const offset = Number(positionY);
  if (![current, anchor, offset].every(finite)) return freeze({ ok: false, reason: 'invalid-ground-input', desiredWorldGroundY: null, correctionY: null });
  const desiredWorldGroundY = anchor + offset;
  return freeze({ ok: finite(desiredWorldGroundY), reason: 'anchor-relative-ground', desiredWorldGroundY, correctionY: desiredWorldGroundY - current });
}

function readBounds(bounds = null) {
  const min = bounds?.min || null;
  const max = bounds?.max || null;
  const size = bounds?.size || null;
  const height = finite(size?.y)
    ? Number(size.y)
    : finite(min?.y) && finite(max?.y) ? Number(max.y) - Number(min.y) : Number.NaN;
  const width = finite(size?.x)
    ? Number(size.x)
    : finite(min?.x) && finite(max?.x) ? Number(max.x) - Number(min.x) : Number.NaN;
  const depth = finite(size?.z)
    ? Number(size.z)
    : finite(min?.z) && finite(max?.z) ? Number(max.z) - Number(min.z) : Number.NaN;
  return { height, width, depth, min, max };
}

export function evaluateEonCityW759AttachmentPresentation({
  targetHeight,
  bounds,
  wrapperEnabled = true,
  renderableMeshes = 0,
  enabledMeshes = 0,
  visibleMeshes = 0,
  minHeightRatio = EON_CITY_W759_MIN_HEIGHT_RATIO,
  maxHeightRatio = EON_CITY_W759_MAX_HEIGHT_RATIO,
  expectedAnchor = null,
  maxHorizontalOffset = null,
  expectedGroundY = null,
  groundTolerance = null,
  maxWorldRadius = EON_CITY_W759_DEFAULT_MAX_WORLD_RADIUS
} = {}) {
  const target = Number(targetHeight);
  const geometry = readBounds(bounds);
  const ratio = finite(target) && target > 0 && finite(geometry.height) ? geometry.height / target : Number.NaN;
  const finiteBounds = [geometry.height, geometry.width, geometry.depth].every(finite)
    && geometry.height > 0
    && geometry.width >= 0
    && geometry.depth >= 0;
  const renderable = Math.max(0, Number(renderableMeshes || 0));
  const enabled = Math.max(0, Number(enabledMeshes || 0));
  const visible = Math.max(0, Number(visibleMeshes || 0));
  const heightReady = finite(ratio) && ratio >= Number(minHeightRatio) && ratio <= Number(maxHeightRatio);
  const center = bounds?.center || (geometry.min && geometry.max ? {
    x: (Number(geometry.min.x) + Number(geometry.max.x)) / 2,
    y: (Number(geometry.min.y) + Number(geometry.max.y)) / 2,
    z: (Number(geometry.min.z) + Number(geometry.max.z)) / 2
  } : null);
  const anchorCheckEnabled = expectedAnchor && [expectedAnchor.x, expectedAnchor.z, center?.x, center?.z].every(finite);
  const horizontalOffset = anchorCheckEnabled
    ? Math.hypot(Number(center.x) - Number(expectedAnchor.x), Number(center.z) - Number(expectedAnchor.z))
    : null;
  const horizontalLimit = finite(maxHorizontalOffset) && Number(maxHorizontalOffset) >= 0 ? Number(maxHorizontalOffset) : null;
  const anchorReady = !anchorCheckEnabled || horizontalLimit === null || Number(horizontalOffset) <= horizontalLimit;
  const groundCheckEnabled = finite(expectedGroundY) && finite(geometry.min?.y);
  const groundOffset = groundCheckEnabled ? Math.abs(Number(geometry.min.y) - Number(expectedGroundY)) : null;
  const groundLimit = finite(groundTolerance) && Number(groundTolerance) >= 0 ? Number(groundTolerance) : null;
  const groundReady = !groundCheckEnabled || groundLimit === null || Number(groundOffset) <= groundLimit;
  const worldRadius = center && [center.x, center.z].every(finite) ? Math.hypot(Number(center.x), Number(center.z)) : null;
  const worldRadiusLimit = finite(maxWorldRadius) && Number(maxWorldRadius) > 0 ? Number(maxWorldRadius) : null;
  const worldBoundReady = worldRadius === null || worldRadiusLimit === null || worldRadius <= worldRadiusLimit;
  const reasons = [];
  if (!wrapperEnabled) reasons.push('wrapper-disabled');
  if (!finiteBounds) reasons.push('bounds-invalid');
  if (renderable < 1) reasons.push('no-renderable-meshes');
  if (enabled < 1) reasons.push('no-enabled-meshes');
  if (visible < 1) reasons.push('no-visible-meshes');
  if (!heightReady) reasons.push('target-height-mismatch');
  if (!anchorReady) reasons.push('anchor-offset');
  if (!groundReady) reasons.push('ground-offset');
  if (!worldBoundReady) reasons.push('outside-world-radius');
  return freeze({
    schema: EON_CITY_W759_ATTACHMENT_PRESENTATION_SCHEMA,
    ready: reasons.length === 0,
    reasons: freeze(reasons),
    targetHeight: target,
    actualHeight: finite(geometry.height) ? geometry.height : null,
    heightRatio: finite(ratio) ? ratio : null,
    heightReady,
    finiteBounds,
    center: center || null,
    expectedAnchor: expectedAnchor || null,
    horizontalOffset,
    maxHorizontalOffset: horizontalLimit,
    anchorReady,
    expectedGroundY: groundCheckEnabled ? Number(expectedGroundY) : null,
    groundOffset,
    groundTolerance: groundLimit,
    groundReady,
    worldRadius,
    maxWorldRadius: worldRadiusLimit,
    worldBoundReady,
    wrapperEnabled: Boolean(wrapperEnabled),
    renderableMeshes: renderable,
    enabledMeshes: enabled,
    visibleMeshes: visible,
    bounds: bounds || null
  });
}
