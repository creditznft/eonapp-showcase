/** RT91 — source-safe camera/objective occlusion contract; Babylon proof remains external. */
import { deriveEonCityL95HudSafeZone } from '../l95/eon-city-l95-hud-safe-zone.js';
import { getEonCityW719ArrivalCameraTruth } from '../w719/eon-city-w719-arrival-camera.js';

export const EON_CITY_RT91_CAMERA_OCCLUSION_SCHEMA = 'eon.city.camera-occlusion-contract.rt91.v1';
const freeze = Object.freeze;
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function intersects(a = {}, b = {}, pad = 0) {
  return finite(a.left) < finite(b.right) + pad && finite(a.right) > finite(b.left) - pad && finite(a.top) < finite(b.bottom) + pad && finite(a.bottom) > finite(b.top) - pad;
}

export function resolveEonCityRt91ObjectiveScreenPlacement({ width = 1280, height = 720, desiredRect = null, playerRect = null } = {}) {
  const safe = deriveEonCityL95HudSafeZone({ id: width <= 620 ? (height > width ? 'mobile-portrait' : 'mobile-landscape') : 'desktop-standard', width, height });
  const targetWidth = Math.min(360, Math.max(180, finite(desiredRect?.right, 360) - finite(desiredRect?.left, 0) || 280));
  const targetHeight = Math.min(120, Math.max(44, finite(desiredRect?.bottom, 70) - finite(desiredRect?.top, 0) || 64));
  let left = Math.max(8, Math.min(width - targetWidth - 8, finite(desiredRect?.left, (width - targetWidth) / 2)));
  let top = Math.max(safe.objectiveTop, Math.min(height - targetHeight - 8, finite(desiredRect?.top, safe.objectiveTop)));
  let rect = { left, top, right: left + targetWidth, bottom: top + targetHeight };
  const player = playerRect || { left: width * 0.38, right: width * 0.62, top: height * 0.3, bottom: height * 0.78 };
  if (intersects(rect, player, 12)) {
    const above = Math.max(safe.objectiveTop, finite(player.top) - targetHeight - 18);
    const side = Math.min(width - targetWidth - 8, finite(player.right) + 18);
    top = above;
    left = side + targetWidth <= width - 8 ? side : Math.max(8, finite(player.left) - targetWidth - 18);
    rect = { left, top, right: left + targetWidth, bottom: top + targetHeight };
  }
  return freeze({
    schema: EON_CITY_RT91_CAMERA_OCCLUSION_SCHEMA,
    rect: freeze(Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, Math.round(value)]))),
    playerRect: freeze({ ...player }),
    avoidsPlayer: !intersects(rect, player, 8),
    respectsHudTop: rect.top >= safe.objectiveTop,
    cameraOcclusionControllerRequired: true,
    actualBabylonVisualProofRequired: true,
    automaticCameraMove: false,
    automaticPlayerMove: false
  });
}

export function validateEonCityRt91CameraOcclusionContract(plan = resolveEonCityRt91ObjectiveScreenPlacement()) {
  const truth = getEonCityW719ArrivalCameraTruth();
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_CAMERA_OCCLUSION_SCHEMA) errors.push('schema');
  if (!plan.avoidsPlayer || !plan.respectsHudTop) errors.push('screen-occlusion');
  if (!plan.cameraOcclusionControllerRequired || !plan.actualBabylonVisualProofRequired || !truth.structuralBoundsValidated) errors.push('camera-proof');
  if (plan.automaticCameraMove || plan.automaticPlayerMove) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_CAMERA_OCCLUSION_SCHEMA, resolveEonCityRt91ObjectiveScreenPlacement, validateEonCityRt91CameraOcclusionContract });
