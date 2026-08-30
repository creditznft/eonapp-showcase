/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/eon-city-exploration-pose.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W551 — Exploration-pose continuity.
 *
 * City menu, Command Deck and route reviews may temporarily move the camera to
 * a presentation anchor. A person must always return to the exact local
 * exploration pose they had before opening that surface. This module holds no
 * browser state, does not persist data, and is deliberately engine-agnostic.
 */
export const EON_CITY_EXPLORATION_POSE_SCHEMA = 'eon.city.exploration-pose.v1';

const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeEonCityExplorationPose(value = {}) {
  const player = value?.player || {};
  const camera = value?.camera || {};
  const target = camera?.target || {};
  const controller = value?.controller || {};
  if (!Number.isFinite(Number(player.x)) || !Number.isFinite(Number(player.z))) return null;
  if (!Number.isFinite(Number(camera.alpha)) || !Number.isFinite(Number(camera.beta)) || !Number.isFinite(Number(camera.radius))) return null;

  const normalized = {
    schema: EON_CITY_EXPLORATION_POSE_SCHEMA,
    player: Object.freeze({
      x: clamp(finite(player.x), -10000, 10000),
      y: clamp(finite(player.y), -1000, 1000),
      z: clamp(finite(player.z), -10000, 10000),
      heading: finite(player.heading)
    }),
    camera: Object.freeze({
      alpha: finite(camera.alpha),
      beta: clamp(finite(camera.beta), 0.01, Math.PI - 0.01),
      radius: clamp(finite(camera.radius), 0.1, 10000),
      target: Object.freeze({
        x: finite(target.x, finite(player.x)),
        y: finite(target.y, finite(player.y) + 1.18),
        z: finite(target.z, finite(player.z))
      })
    })
  };
  // Browsers do not permit pointer lock restoration without a fresh gesture.
  // Persist only the fact that it was active, so the runtime can tell the user
  // why their exact spatial pose returned with standard mouse controls.
  if (String(controller.mode || '') === 'third-person' || typeof controller.pointerLookEnabled === 'boolean') {
    normalized.controller = Object.freeze({
      mode: 'third-person',
      pointerLookEnabled: Boolean(controller.pointerLookEnabled)
    });
  }
  return Object.freeze(normalized);
}

export function captureEonCityExplorationPose({ player = {}, camera = {}, controller = {} } = {}) {
  return normalizeEonCityExplorationPose({
    player: {
      x: player.x,
      y: player.y,
      z: player.z,
      heading: player.heading
    },
    camera: {
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
      target: camera.target
    },
    controller
  });
}
