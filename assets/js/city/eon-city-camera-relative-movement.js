/**
 * W662B — canonical camera-relative ground movement.
 *
 * Every manual input path provides a screen-relative right/forward intent.
 * This module projects that intent onto the horizontal camera basis without
 * owning input events, collision, animation, routing or transition state.
 */

export const EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA = 'eon.city.camera-relative-movement.w662b.v1';
export const EON_CITY_CAMERA_RELATIVE_EPSILON = 1e-6;

const freeze = (value) => Object.freeze(value);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeGround(x = 0, z = 0, fallback = null) {
  const safeX = finite(x);
  const safeZ = finite(z);
  const length = Math.hypot(safeX, safeZ);
  if (length <= EON_CITY_CAMERA_RELATIVE_EPSILON) return fallback;
  return freeze({ x: safeX / length, z: safeZ / length });
}

function alphaForward(alpha = Number.NaN) {
  const safeAlpha = Number(alpha);
  if (!Number.isFinite(safeAlpha)) return freeze({ x: 0, z: 1 });
  // Babylon ArcRotateCamera alpha describes the target-to-camera horizontal
  // orbit. Camera-forward is therefore the inverse horizontal vector.
  return normalizeGround(-Math.cos(safeAlpha), -Math.sin(safeAlpha), freeze({ x: 0, z: 1 }));
}

export function resolveEonCityCameraGroundBasis({
  cameraPosition = null,
  cameraTarget = null,
  cameraAlpha = Number.NaN
} = {}) {
  const fromPose = cameraPosition && cameraTarget
    ? normalizeGround(
        finite(cameraTarget.x) - finite(cameraPosition.x),
        finite(cameraTarget.z) - finite(cameraPosition.z)
      )
    : null;
  const forward = fromPose || alphaForward(cameraAlpha);
  // On an X/Z ground plane, this is the screen-right vector for a camera
  // looking along `forward`: +Z forward maps to +X right.
  const right = freeze({ x: forward.z, z: -forward.x });
  return freeze({
    schema: `${EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA}.basis.v1`,
    forward,
    right,
    source: fromPose ? 'camera-pose' : Number.isFinite(Number(cameraAlpha)) ? 'camera-alpha' : 'default-forward'
  });
}

export function resolveEonCityCameraRelativeMovement({
  inputRight = 0,
  inputForward = 0,
  cameraPosition = null,
  cameraTarget = null,
  cameraAlpha = Number.NaN,
  deadZone = 0.04
} = {}) {
  const rightIntent = finite(inputRight);
  const forwardIntent = finite(inputForward);
  const inputMagnitude = Math.hypot(rightIntent, forwardIntent);
  const safeDeadZone = Math.max(0, finite(deadZone, 0.04));
  if (inputMagnitude <= safeDeadZone) {
    return freeze({
      schema: EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA,
      active: false,
      x: 0,
      z: 0,
      inputMagnitude,
      basis: resolveEonCityCameraGroundBasis({ cameraPosition, cameraTarget, cameraAlpha })
    });
  }

  const normalizedRight = rightIntent / inputMagnitude;
  const normalizedForward = forwardIntent / inputMagnitude;
  const basis = resolveEonCityCameraGroundBasis({ cameraPosition, cameraTarget, cameraAlpha });
  const world = normalizeGround(
    basis.right.x * normalizedRight + basis.forward.x * normalizedForward,
    basis.right.z * normalizedRight + basis.forward.z * normalizedForward,
    freeze({ x: 0, z: 0 })
  );

  return freeze({
    schema: EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA,
    active: Math.hypot(world.x, world.z) > EON_CITY_CAMERA_RELATIVE_EPSILON,
    x: world.x,
    z: world.z,
    inputMagnitude,
    basis
  });
}

export function resolveEonCityWorldTargetMovement({
  position = null,
  target = null,
  arrivalRadius = 0.32
} = {}) {
  const dx = finite(target?.x) - finite(position?.x);
  const dz = finite(target?.z) - finite(position?.z);
  const distance = Math.hypot(dx, dz);
  const safeArrivalRadius = Math.max(0, finite(arrivalRadius, 0.32));
  if (distance <= safeArrivalRadius || distance <= EON_CITY_CAMERA_RELATIVE_EPSILON) {
    return freeze({ active: false, arrived: true, x: 0, z: 0, distance });
  }
  return freeze({ active: true, arrived: false, x: dx / distance, z: dz / distance, distance });
}

export default freeze({
  EON_CITY_CAMERA_RELATIVE_MOVEMENT_SCHEMA,
  EON_CITY_CAMERA_RELATIVE_EPSILON,
  resolveEonCityCameraGroundBasis,
  resolveEonCityCameraRelativeMovement,
  resolveEonCityWorldTargetMovement
});
