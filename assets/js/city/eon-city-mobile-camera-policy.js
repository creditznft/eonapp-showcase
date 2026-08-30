/**
 * RT96 — mobile camera input policy.
 *
 * Keeps Babylon's single camera owner and only tunes its existing pointer
 * input. The analogue joystick owns its captured pointer independently, so a
 * second finger can drag the world while movement remains active. No synthetic
 * touch events and no second camera controller are introduced.
 */
const freeze = (value) => Object.freeze(value);

export const EON_CITY_RT96_MOBILE_CAMERA_SCHEMA = 'eon.city.mobile-camera.rt96.v1';

export function deriveEonCityRt96CameraInputPolicy({ coarsePointer = false, width = 1280, height = 720 } = {}) {
  const compact = Math.min(Number(width) || 1280, Number(height) || 720) < 720;
  const touch = coarsePointer === true;
  return freeze({
    schema: EON_CITY_RT96_MOBILE_CAMERA_SCHEMA,
    mode: touch ? 'touch-drag' : 'pointer-drag',
    simultaneousMovementAndLook: touch,
    angularSensibilityX: touch ? (compact ? 1180 : 1320) : 1000,
    angularSensibilityY: touch ? (compact ? 1320 : 1450) : 1000,
    wheelDeltaPercentage: touch ? 0 : 0.012,
    panningSensibility: 0,
    pinchZoom: touch,
    multiTouchPanning: false,
    touchAction: 'none'
  });
}

export function applyEonCityRt96CameraInputPolicy(camera, canvas, policy = deriveEonCityRt96CameraInputPolicy()) {
  if (!camera) return freeze({ ok: false, reason: 'camera-missing', policy });
  camera.panningSensibility = policy.panningSensibility;
  camera.wheelDeltaPercentage = policy.wheelDeltaPercentage;
  if (canvas?.style) canvas.style.touchAction = policy.touchAction;

  const pointers = camera.inputs?.attached?.pointers || null;
  if (pointers) {
    if ('angularSensibilityX' in pointers) pointers.angularSensibilityX = policy.angularSensibilityX;
    if ('angularSensibilityY' in pointers) pointers.angularSensibilityY = policy.angularSensibilityY;
    if ('multiTouchPanning' in pointers) pointers.multiTouchPanning = policy.multiTouchPanning;
    if ('multiTouchPanAndZoom' in pointers) pointers.multiTouchPanAndZoom = false;
    // Leave pinch math under Babylon's own implementation; only disable it if
    // the policy says so and that input exposes an explicit pinch precision.
    if (!policy.pinchZoom && 'pinchPrecision' in pointers) pointers.pinchPrecision = 0;
  }
  return freeze({ ok: true, policy, pointerInputAvailable: Boolean(pointers) });
}
