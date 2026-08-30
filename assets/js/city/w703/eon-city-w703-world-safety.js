/**
 * W703 EON City world and camera safety authority.
 *
 * Pure sanitation functions plus one bounded Babylon-compatible enforcement
 * function. The authority prevents below-ground views, unsafe restored poses,
 * non-finite coordinates and accidental escape from the resident world.
 */
export const EON_CITY_W703_WORLD_SAFETY_SCHEMA = 'eon.city.world-safety.w703.v1';

const freeze = Object.freeze;
const TAU = Math.PI * 2;

export const EON_CITY_W703_CORE_BOUNDS = freeze({
  minX: -92,
  maxX: 92,
  minZ: -92,
  maxZ: 92,
  groundY: 0,
  playerY: 0,
  cameraTargetMinY: 0.8,
  cameraTargetMaxY: 4.5,
  cameraTargetLeadMax: 6,
  cameraBetaMin: 0.35,
  cameraBetaMax: 1.35,
  cameraRadiusMin: 7.5,
  cameraRadiusMax: 34,
  cameraPositionMinY: 1.6,
  undersideTopY: -0.06
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, finite(value, minimum))); }
function resolveBounds(value = {}) {
  const candidate = { ...EON_CITY_W703_CORE_BOUNDS, ...(value || {}) };
  const minX = Math.min(finite(candidate.minX, -92), finite(candidate.maxX, 92));
  const maxX = Math.max(finite(candidate.minX, -92), finite(candidate.maxX, 92));
  const minZ = Math.min(finite(candidate.minZ, -92), finite(candidate.maxZ, 92));
  const maxZ = Math.max(finite(candidate.minZ, -92), finite(candidate.maxZ, 92));
  return freeze({
    ...candidate,
    minX,
    maxX,
    minZ,
    maxZ,
    playerY: finite(candidate.playerY, 0),
    cameraTargetMinY: finite(candidate.cameraTargetMinY, 0.8),
    cameraTargetMaxY: Math.max(finite(candidate.cameraTargetMinY, 0.8), finite(candidate.cameraTargetMaxY, 4.5)),
    cameraTargetLeadMax: Math.max(0, Math.min(12, finite(candidate.cameraTargetLeadMax, 6))),
    cameraBetaMin: clamp(candidate.cameraBetaMin, 0.08, 1.45),
    cameraBetaMax: clamp(candidate.cameraBetaMax, 0.12, 1.5),
    cameraRadiusMin: Math.max(2, finite(candidate.cameraRadiusMin, 7.5)),
    cameraRadiusMax: Math.max(finite(candidate.cameraRadiusMin, 7.5), finite(candidate.cameraRadiusMax, 34)),
    cameraPositionMinY: Math.max(finite(candidate.groundY, 0) + 0.2, finite(candidate.cameraPositionMinY, 1.6))
  });
}
function normalizeAlpha(value) {
  const alpha = finite(value, -Math.PI / 2);
  return ((alpha % TAU) + TAU) % TAU;
}

export function isEonCityW703PositionInsideBounds(position = {}, bounds = EON_CITY_W703_CORE_BOUNDS, margin = 0) {
  const safeBounds = resolveBounds(bounds);
  const inset = Math.max(0, finite(margin, 0));
  const x = Number(position.x);
  const z = Number(position.z);
  return Number.isFinite(x) && Number.isFinite(z)
    && x >= safeBounds.minX + inset && x <= safeBounds.maxX - inset
    && z >= safeBounds.minZ + inset && z <= safeBounds.maxZ - inset;
}

export function sanitizeEonCityW703PlayerPosition(position = {}, { bounds = EON_CITY_W703_CORE_BOUNDS, fallback = null, margin = 0.45 } = {}) {
  const safeBounds = resolveBounds(bounds);
  const safeFallback = fallback && isEonCityW703PositionInsideBounds(fallback, safeBounds)
    ? fallback
    : { x: 0, y: safeBounds.playerY, z: 0 };
  const inset = Math.max(0, Math.min(8, finite(margin, 0.45)));
  return freeze({
    x: Number(clamp(finite(position.x, safeFallback.x), safeBounds.minX + inset, safeBounds.maxX - inset).toFixed(4)),
    y: Number(safeBounds.playerY.toFixed(4)),
    z: Number(clamp(finite(position.z, safeFallback.z), safeBounds.minZ + inset, safeBounds.maxZ - inset).toFixed(4))
  });
}

export function sanitizeEonCityW703CameraPose(pose = {}, { bounds = EON_CITY_W703_CORE_BOUNDS, playerPosition = null } = {}) {
  const safeBounds = resolveBounds(bounds);
  const safePlayer = sanitizeEonCityW703PlayerPosition(playerPosition || pose.target || {}, { bounds: safeBounds, margin: 0.45 });
  const betaMin = Math.min(safeBounds.cameraBetaMin, safeBounds.cameraBetaMax);
  const betaMax = Math.max(safeBounds.cameraBetaMin, safeBounds.cameraBetaMax);
  let beta = clamp(pose.beta ?? pose.cameraBeta, betaMin, betaMax);
  let radius = clamp(pose.radius ?? pose.cameraRadius, safeBounds.cameraRadiusMin, safeBounds.cameraRadiusMax);
  const targetY = clamp(pose.target?.y ?? pose.targetY ?? safeBounds.cameraTargetMinY, safeBounds.cameraTargetMinY, safeBounds.cameraTargetMaxY);
  const desiredTargetX = finite(pose.target?.x, safePlayer.x);
  const desiredTargetZ = finite(pose.target?.z, safePlayer.z);
  const targetDeltaX = desiredTargetX - safePlayer.x;
  const targetDeltaZ = desiredTargetZ - safePlayer.z;
  const targetDistance = Math.hypot(targetDeltaX, targetDeltaZ);
  const targetScale = targetDistance > safeBounds.cameraTargetLeadMax && targetDistance > 0
    ? safeBounds.cameraTargetLeadMax / targetDistance
    : 1;
  const targetX = clamp(safePlayer.x + targetDeltaX * targetScale, safeBounds.minX + 0.45, safeBounds.maxX - 0.45);
  const targetZ = clamp(safePlayer.z + targetDeltaZ * targetScale, safeBounds.minZ + 0.45, safeBounds.maxZ - 0.45);
  const minimumVerticalOffset = Math.max(0.25, safeBounds.cameraPositionMinY - targetY);
  if (radius * Math.cos(beta) < minimumVerticalOffset) {
    beta = Math.min(beta, Math.acos(Math.min(0.999, minimumVerticalOffset / Math.max(radius, safeBounds.cameraRadiusMin))));
    beta = clamp(beta, betaMin, betaMax);
  }
  if (radius * Math.cos(beta) < minimumVerticalOffset) {
    radius = clamp(minimumVerticalOffset / Math.max(0.05, Math.cos(beta)), safeBounds.cameraRadiusMin, safeBounds.cameraRadiusMax);
  }
  const cameraY = targetY + radius * Math.cos(beta);
  return freeze({
    alpha: Number(normalizeAlpha(pose.alpha ?? pose.cameraAlpha).toFixed(6)),
    beta: Number(beta.toFixed(6)),
    radius: Number(radius.toFixed(4)),
    target: freeze({ x: Number(targetX.toFixed(4)), y: Number(targetY.toFixed(4)), z: Number(targetZ.toFixed(4)) }),
    estimatedPositionY: Number(cameraY.toFixed(4)),
    aboveGround: cameraY >= safeBounds.cameraPositionMinY
  });
}

export function sanitizeEonCityW703TransitionPose(pose = {}, { bounds = EON_CITY_W703_CORE_BOUNDS, fallback = null } = {}) {
  const position = sanitizeEonCityW703PlayerPosition(pose, { bounds, fallback, margin: 0.45 });
  const camera = sanitizeEonCityW703CameraPose(pose, { bounds, playerPosition: position });
  return freeze({
    x: position.x,
    y: position.y,
    z: position.z,
    heading: Number(finite(pose.heading, 0).toFixed(6)),
    cameraAlpha: camera.alpha,
    cameraBeta: camera.beta,
    cameraRadius: camera.radius,
    sanitized: true,
    automaticNavigation: false
  });
}

export function resolveEonCityW703UnstuckPose({ currentPosition = {}, lastSafePosition = null, spawn = { x: 0, z: 0 }, bounds = EON_CITY_W703_CORE_BOUNDS } = {}) {
  const safeBounds = resolveBounds(bounds);
  const currentSafe = isEonCityW703PositionInsideBounds(currentPosition, safeBounds, 1.2);
  const lastSafe = lastSafePosition && isEonCityW703PositionInsideBounds(lastSafePosition, safeBounds, 1.2);
  const checkpointDistance = currentSafe && lastSafe
    ? Math.hypot(finite(currentPosition.x) - finite(lastSafePosition.x), finite(currentPosition.z) - finite(lastSafePosition.z))
    : 0;
  const useCheckpoint = Boolean(lastSafe && (!currentSafe || checkpointDistance > 0.75));
  const source = useCheckpoint ? lastSafePosition : currentSafe ? currentPosition : spawn;
  const sourceId = useCheckpoint ? 'last-safe' : currentSafe ? 'current-safe' : 'spawn';
  const position = sanitizeEonCityW703PlayerPosition(source, { bounds: safeBounds, fallback: spawn, margin: 1.2 });
  return freeze({ ...position, source: sourceId, explicitUserActionRequired: true });
}

export function enforceEonCityW703WorldSafety({ camera = null, playerAnchor = null, bounds = EON_CITY_W703_CORE_BOUNDS, lastSafePosition = null } = {}) {
  const safeBounds = resolveBounds(bounds);
  const originalPlayer = { x: finite(playerAnchor?.position?.x, 0), y: finite(playerAnchor?.position?.y, 0), z: finite(playerAnchor?.position?.z, 0) };
  const player = sanitizeEonCityW703PlayerPosition(originalPlayer, { bounds: safeBounds, fallback: lastSafePosition, margin: 0.45 });
  if (playerAnchor?.position?.copyFromFloats) playerAnchor.position.copyFromFloats(player.x, player.y, player.z);
  else if (playerAnchor?.position) Object.assign(playerAnchor.position, player);
  const cameraPose = sanitizeEonCityW703CameraPose({
    alpha: camera?.alpha,
    beta: camera?.beta,
    radius: camera?.radius,
    target: camera?.target
  }, { bounds: safeBounds, playerPosition: player });
  if (camera) {
    camera.alpha = cameraPose.alpha;
    camera.beta = cameraPose.beta;
    camera.radius = cameraPose.radius;
    camera.lowerBetaLimit = safeBounds.cameraBetaMin;
    camera.upperBetaLimit = safeBounds.cameraBetaMax;
    camera.lowerRadiusLimit = safeBounds.cameraRadiusMin;
    camera.upperRadiusLimit = safeBounds.cameraRadiusMax;
    if (camera.target?.copyFromFloats) camera.target.copyFromFloats(cameraPose.target.x, cameraPose.target.y, cameraPose.target.z);
    else if (camera.target) Object.assign(camera.target, cameraPose.target);
  }
  const changed = Math.abs(finite(originalPlayer.x, player.x) - player.x) > 0.0001
    || Math.abs(finite(originalPlayer.y, player.y) - player.y) > 0.0001
    || Math.abs(finite(originalPlayer.z, player.z) - player.z) > 0.0001
    || !cameraPose.aboveGround;
  return freeze({ schema: EON_CITY_W703_WORLD_SAFETY_SCHEMA, player, camera: cameraPose, changed, aboveGround: cameraPose.aboveGround });
}

export function getEonCityW703WorldSafetyTruth() {
  return freeze({
    schema: `${EON_CITY_W703_WORLD_SAFETY_SCHEMA}.truth.v1`,
    hardPlayerBounds: true,
    hardCameraTargetFloor: true,
    hardCameraPositionFloor: true,
    sanitizedRestoredPoses: true,
    sanitizedTransitions: true,
    perFrameEnforcementSupported: true,
    explicitUnstuckOnly: true,
    automaticTravel: false,
    undersideOccluderRequired: true
  });
}
