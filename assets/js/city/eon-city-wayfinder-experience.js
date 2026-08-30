/**
 * W624D — Productive Nocturne Wayfinder and camera contract.
 *
 * Pure local movement/presentation policy. It never opens routes, reads work,
 * changes account/commercial state, requests a provider, or performs network IO.
 */
export const EON_CITY_WAYFINDER_SCHEMA = 'eon.city.wayfinder-experience.w624d.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 4) => Math.round(value * (10 ** digits)) / (10 ** digits);

export const EON_CITY_WAYFINDER_STATES = freeze([
  'idle', 'walk', 'run', 'turn', 'interact', 'inspect', 'celebrate', 'sit-work', 'recovery'
]);

export const EON_CITY_WAYFINDER_VISUAL_PROFILE = freeze({
  id: 'productive-nocturne-wayfinder',
  silhouette: 'asymmetric service coat, luminous route spine, readable visor and grounded boots',
  inclusive: true,
  sexualized: false,
  bodyTypeStatEffect: false,
  cosmeticOnly: true,
  payToWin: false,
  defaultAccent: 'cyan',
  allowedAccents: freeze(['cyan', 'violet', 'mint', 'amber', 'warm-white']),
  heightMeters: 1.82,
  localOnly: true,
  remoteArtRequired: false
});

export const EON_CITY_WAYFINDER_CAMERA_PROFILES = freeze([
  freeze({ id: 'follow', label: 'Follow', alphaOffset: 0, beta: 1.02, radius: 10.8, minRadius: 3.2, maxRadius: 16.5, targetHeight: 1.22 }),
  freeze({ id: 'shoulder-left', label: 'Left shoulder', alphaOffset: -0.18, beta: 1.01, radius: 8.4, minRadius: 3.0, maxRadius: 14.5, targetHeight: 1.28 }),
  freeze({ id: 'shoulder-right', label: 'Right shoulder', alphaOffset: 0.18, beta: 1.01, radius: 8.4, minRadius: 3.0, maxRadius: 14.5, targetHeight: 1.28 }),
  freeze({ id: 'close', label: 'Close', alphaOffset: 0, beta: 1.0, radius: 6.2, minRadius: 2.8, maxRadius: 10.5, targetHeight: 1.3 }),
  freeze({ id: 'wide', label: 'Wide', alphaOffset: 0, beta: 1.06, radius: 14.2, minRadius: 5.0, maxRadius: 18.0, targetHeight: 1.16 })
]);

export const EON_CITY_WAYFINDER_INPUT_CONTRACT = freeze({
  keyboardMouse: freeze({ move: freeze(['WASD', 'Arrow keys']), inspect: freeze(['E', 'Space']), pointerLook: 'L after explicit gesture', cameraCycle: 'C', cameraReset: 'R' }),
  touch: freeze({ move: 'visible joystick or visible D-pad', inspect: 'visible context action', camera: 'visible camera buttons; browser pinch/drag where supported' }),
  controller: freeze({ move: 'left stick or D-pad', inspect: 'south face button requests review only', cameraCycle: 'right shoulder button', cameraReset: 'left shoulder button' }),
  hiddenAutoNavigation: false,
  automaticInteraction: false,
  automaticRouteOpen: false,
  localOnly: true
});

export function getEonCityWayfinderCameraProfile(profileId = 'follow') {
  return EON_CITY_WAYFINDER_CAMERA_PROFILES.find((entry) => entry.id === String(profileId || '')) || EON_CITY_WAYFINDER_CAMERA_PROFILES[0];
}

export function resolveEonCityWayfinderState({ moving = false, speed = 0, turnRate = 0, focused = false, transient = '', reducedMotion = false } = {}) {
  const requested = String(transient || '').trim().toLowerCase();
  if (EON_CITY_WAYFINDER_STATES.includes(requested) && !['idle', 'walk', 'run', 'turn'].includes(requested)) {
    if (reducedMotion && requested === 'celebrate') return 'inspect';
    return requested;
  }
  if (moving) return finite(speed) >= 5.15 ? 'run' : 'walk';
  if (Math.abs(finite(turnRate)) > 1.7) return 'turn';
  if (focused) return 'inspect';
  return 'idle';
}

export function createEonCityWayfinderStateDirector({ reducedMotion = false, now = () => globalThis.performance?.now?.() || Date.now() } = {}) {
  let transient = null;
  let snapshot = freeze({ schema: EON_CITY_WAYFINDER_SCHEMA, state: 'idle', reducedMotion: Boolean(reducedMotion), transient: false, localOnly: true });
  return freeze({
    request(state, { durationMs = 900 } = {}) {
      const normalized = String(state || '').trim().toLowerCase();
      if (!EON_CITY_WAYFINDER_STATES.includes(normalized)) return freeze({ ok: false, reason: 'unknown-wayfinder-state' });
      transient = { state: normalized, until: now() + clamp(finite(durationMs, 900), 180, 5000) };
      return freeze({ ok: true, state: normalized, localOnly: true });
    },
    update(motion = {}) {
      if (transient && now() >= transient.until) transient = null;
      const state = resolveEonCityWayfinderState({ ...motion, transient: transient?.state || '', reducedMotion });
      snapshot = freeze({ schema: EON_CITY_WAYFINDER_SCHEMA, state, reducedMotion: Boolean(reducedMotion), transient: Boolean(transient), localOnly: true, readsPrivateData: false, remoteNetwork: false });
      return snapshot;
    },
    reset() { transient = null; snapshot = freeze({ ...snapshot, state: 'idle', transient: false }); return snapshot; },
    getSnapshot() { return snapshot; }
  });
}

function segmentCircleIntersection(start, end, collider, padding) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const fx = start.x - finite(collider.x);
  const fz = start.z - finite(collider.z);
  const radius = Math.max(0.1, finite(collider.radius, 0.6) + padding);
  const a = dx * dx + dz * dz;
  if (a < 1e-9) return null;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const candidates = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((value) => value > 0 && value < 1);
  return candidates.length ? Math.min(...candidates) : null;
}

function segmentBoxIntersection(start, end, collider, padding) {
  const minX = finite(collider.x) - Math.max(0.1, finite(collider.halfWidth ?? finite(collider.width) / 2, 0.6)) - padding;
  const maxX = finite(collider.x) + Math.max(0.1, finite(collider.halfWidth ?? finite(collider.width) / 2, 0.6)) + padding;
  const minZ = finite(collider.z) - Math.max(0.1, finite(collider.halfDepth ?? finite(collider.depth) / 2, 0.6)) - padding;
  const maxZ = finite(collider.z) + Math.max(0.1, finite(collider.halfDepth ?? finite(collider.depth) / 2, 0.6)) + padding;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  let tMin = 0;
  let tMax = 1;
  for (const [origin, delta, min, max] of [[start.x, dx, minX, maxX], [start.z, dz, minZ, maxZ]]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < min || origin > max) return null;
      continue;
    }
    const t1 = (min - origin) / delta;
    const t2 = (max - origin) / delta;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
    if (tMin > tMax) return null;
  }
  return tMin > 0 && tMin < 1 ? tMin : null;
}

export function resolveEonCityWayfinderCamera({ target = {}, alpha = 0, beta = 1.02, radius = 10.8, minRadius = 3, maxRadius = 18, colliders = [], padding = 0.34 } = {}) {
  const requestedRadius = clamp(finite(radius, 10.8), Math.max(1, finite(minRadius, 3)), Math.max(1.1, finite(maxRadius, 18)));
  const safeBeta = clamp(finite(beta, 1.02), 0.7, 1.35);
  const safeAlpha = finite(alpha);
  const start = { x: finite(target.x), y: finite(target.y), z: finite(target.z) };
  const end = {
    x: start.x + requestedRadius * Math.cos(safeAlpha) * Math.sin(safeBeta),
    y: start.y + requestedRadius * Math.cos(safeBeta),
    z: start.z + requestedRadius * Math.sin(safeAlpha) * Math.sin(safeBeta)
  };
  let nearest = null;
  let collisionId = null;
  for (const collider of Array.isArray(colliders) ? colliders : []) {
    const type = String(collider?.type || collider?.shape || 'circle').toLowerCase() === 'box' ? 'box' : 'circle';
    const hit = type === 'box' ? segmentBoxIntersection(start, end, collider, padding) : segmentCircleIntersection(start, end, collider, padding);
    if (hit !== null && (nearest === null || hit < nearest)) { nearest = hit; collisionId = String(collider?.id || 'authored-volume'); }
  }
  const safeRadius = nearest === null ? requestedRadius : clamp(requestedRadius * nearest - padding, minRadius, requestedRadius);
  return freeze({
    schema: EON_CITY_WAYFINDER_SCHEMA,
    requestedRadius: round(requestedRadius),
    safeRadius: round(safeRadius),
    clipped: nearest !== null,
    collisionId,
    target: freeze({ x: round(start.x), y: round(start.y), z: round(start.z) }),
    camera: freeze({
      x: round(start.x + safeRadius * Math.cos(safeAlpha) * Math.sin(safeBeta)),
      y: round(start.y + safeRadius * Math.cos(safeBeta)),
      z: round(start.z + safeRadius * Math.sin(safeAlpha) * Math.sin(safeBeta))
    }),
    localOnly: true,
    changesRoutes: false,
    changesWorkState: false
  });
}

export function validateEonCityWayfinderExperience() {
  const errors = [];
  if (EON_CITY_WAYFINDER_STATES.length !== 9 || new Set(EON_CITY_WAYFINDER_STATES).size !== 9) errors.push('wayfinder-states-invalid');
  if (!EON_CITY_WAYFINDER_VISUAL_PROFILE.inclusive || EON_CITY_WAYFINDER_VISUAL_PROFILE.sexualized || EON_CITY_WAYFINDER_VISUAL_PROFILE.payToWin) errors.push('visual-profile-boundary-invalid');
  if (EON_CITY_WAYFINDER_CAMERA_PROFILES.length < 5 || new Set(EON_CITY_WAYFINDER_CAMERA_PROFILES.map((entry) => entry.id)).size !== EON_CITY_WAYFINDER_CAMERA_PROFILES.length) errors.push('camera-profiles-invalid');
  if (EON_CITY_WAYFINDER_INPUT_CONTRACT.hiddenAutoNavigation || EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticInteraction || EON_CITY_WAYFINDER_INPUT_CONTRACT.automaticRouteOpen) errors.push('input-contract-broadened');
  return freeze({ schema: EON_CITY_WAYFINDER_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}
