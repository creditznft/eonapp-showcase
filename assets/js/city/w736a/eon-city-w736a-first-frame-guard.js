/**
 * W736A — bounded Babylon first-frame compatibility guard.
 *
 * The W731 runtime asks the Scene for view/transform matrices before its first
 * render. Babylon normally initializes those matrices in time, but on some
 * production WebGL paths the first query can be undefined. This guard returns
 * the active camera matrices only for that bounded first-frame gap. It does not
 * create another Engine, Scene, camera or render loop.
 */
import '@babylonjs/core/Culling/ray.js';
import { Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Scene } from '@babylonjs/core/scene.js';

export const EON_CITY_W736A_FIRST_FRAME_GUARD_SCHEMA = 'eon.city.first-frame-guard.w736a.v1';
const INSTALL_KEY = Symbol.for('eonapp.city.w736a.first-frame-guard');
const PATCH_KEY = Symbol.for('eonapp.city.w736a.scene-matrix-patch');

function validMatrix(value) {
  return Boolean(value?.m && value.m.length >= 16);
}

function cameraView(scene) {
  try {
    const value = scene?.activeCamera?.getViewMatrix?.();
    return validMatrix(value) ? value : null;
  } catch {
    return null;
  }
}

function cameraTransform(scene) {
  try {
    const camera = scene?.activeCamera;
    const view = camera?.getViewMatrix?.();
    const projection = camera?.getProjectionMatrix?.(true);
    if (!validMatrix(view) || !validMatrix(projection)) return null;
    const value = view.multiply(projection);
    return validMatrix(value) ? value : null;
  } catch {
    return null;
  }
}

export function installEonCityW736AFirstFrameGuard() {
  if (globalThis[INSTALL_KEY]) return globalThis[INSTALL_KEY];
  const prototype = Scene?.prototype;
  if (!prototype) return Object.freeze({ ok: false, reason: 'scene-prototype-unavailable' });

  if (!prototype[PATCH_KEY]) {
    const originalView = prototype.getViewMatrix;
    const originalTransform = prototype.getTransformMatrix;

    Object.defineProperty(prototype, PATCH_KEY, { value: true, configurable: false, enumerable: false });

    prototype.getViewMatrix = function getEonCityW736AViewMatrix() {
      try {
        const value = originalView?.call(this);
        if (validMatrix(value)) return value;
      } catch {}
      return cameraView(this) || Matrix.IdentityReadOnly;
    };

    prototype.getTransformMatrix = function getEonCityW736ATransformMatrix() {
      try {
        const value = originalTransform?.call(this);
        if (validMatrix(value)) return value;
      } catch {}
      return cameraTransform(this) || Matrix.IdentityReadOnly;
    };
  }

  const controller = Object.freeze({
    ok: true,
    schema: EON_CITY_W736A_FIRST_FRAME_GUARD_SCHEMA,
    raySideEffectImported: true,
    createsEngine: false,
    createsScene: false,
    createsRenderLoop: false
  });
  globalThis[INSTALL_KEY] = controller;
  return controller;
}
