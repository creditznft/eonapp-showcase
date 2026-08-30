/**
 * W555B — deterministic third-person movement, static collisions, and
 * user-initiated pointer-look support for EON City.
 *
 * This module is deliberately engine-agnostic. It does not create a renderer,
 * fetch assets, inspect user data, or request pointer lock automatically.
 * The Babylon runtime supplies its camera-relative movement vector and uses
 * the returned position/heading. Collision is a bounded local kinematic pass
 * against authored static volumes; it is not a physics or multiplayer system.
 */

export const EON_CITY_THIRD_PERSON_SCHEMA = 'eon.city.third-person-controller.w555b.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 4) => Math.round(value * (10 ** digits)) / (10 ** digits);

function normalizeVector(vector = {}) {
  const x = finite(vector.x);
  const z = finite(vector.z);
  const length = Math.hypot(x, z);
  if (!length) return freeze({ x: 0, z: 0, length: 0 });
  return freeze({ x: x / length, z: z / length, length });
}

function normalizePosition(position = {}) {
  return freeze({ x: finite(position.x), y: finite(position.y), z: finite(position.z) });
}

function normalizeCollider(value = {}, index = 0) {
  const type = String(value.type || value.shape || 'circle').toLowerCase() === 'box' ? 'box' : 'circle';
  const id = String(value.id || `static-${index + 1}`).replace(/[^a-z0-9:_-]/gi, '-').slice(0, 96) || `static-${index + 1}`;
  const x = finite(value.x);
  const z = finite(value.z);
  if (type === 'box') {
    return freeze({
      id,
      type,
      x,
      z,
      halfWidth: Math.max(0.1, finite(value.halfWidth ?? value.width / 2, 0.6)),
      halfDepth: Math.max(0.1, finite(value.halfDepth ?? value.depth / 2, 0.6))
    });
  }
  return freeze({ id, type, x, z, radius: Math.max(0.1, finite(value.radius, 0.6)) });
}

export function normalizeEonCityCollisionVolumes(volumes = []) {
  return freeze((Array.isArray(volumes) ? volumes : []).map(normalizeCollider));
}

/**
 * Supplies small authored blocking volumes for the first City district. These
 * are intentionally conservative approach-zone blockers rather than a claim
 * that every decorative mesh has physics collision.
 */
export function createEonCityStaticCollisionVolumes({ landmarks = [] } = {}) {
  const seeded = [
    { id: 'arrival-gate-core', type: 'box', x: 0, z: 11.82, halfWidth: 3.8, halfDepth: 0.54 },
    { id: 'command-centre-core', type: 'box', x: 0, z: -7.2, halfWidth: 2.05, halfDepth: 1.72 },
    { id: 'creator-atrium-core', type: 'box', x: -8.4, z: -4.1, halfWidth: 1.58, halfDepth: 1.58 },
    { id: 'forge-bay-core', type: 'box', x: 8.2, z: -3.2, halfWidth: 1.62, halfDepth: 1.62 }
  ];
  for (const landmark of Array.isArray(landmarks) ? landmarks : []) {
    const x = finite(landmark?.x, NaN);
    const z = finite(landmark?.z, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    const radius = Math.max(0.5, Math.min(1.25, finite(landmark.radius, 2) * 0.3));
    seeded.push({ id: `landmark:${landmark.id || seeded.length}`, type: 'circle', x, z, radius });
  }
  const unique = new Map();
  for (const volume of normalizeEonCityCollisionVolumes(seeded)) if (!unique.has(volume.id)) unique.set(volume.id, volume);
  return freeze([...unique.values()]);
}

function resolveCircle(candidate, collider, playerRadius, preferred = {}) {
  const dx = candidate.x - collider.x;
  const dz = candidate.z - collider.z;
  const minimum = collider.radius + playerRadius;
  const distance = Math.hypot(dx, dz);
  if (distance >= minimum) return freeze({ position: candidate, collided: false, id: null });
  const fallback = normalizeVector(preferred);
  const direction = distance > 0.00001
    ? { x: dx / distance, z: dz / distance }
    : (fallback.length ? { x: -fallback.x, z: -fallback.z } : { x: 0, z: -1 });
  return freeze({
    position: freeze({ x: collider.x + direction.x * minimum, y: candidate.y, z: collider.z + direction.z * minimum }),
    collided: true,
    id: collider.id
  });
}

function resolveBox(candidate, collider, playerRadius, previous = null) {
  const minX = collider.x - collider.halfWidth - playerRadius;
  const maxX = collider.x + collider.halfWidth + playerRadius;
  const minZ = collider.z - collider.halfDepth - playerRadius;
  const maxZ = collider.z + collider.halfDepth + playerRadius;
  const prior = previous || candidate;
  // A small kinematic sweep prevents a low-frame-rate move from tunnelling
  // across an authored box even though this is intentionally not a full physics engine.
  if (prior.z > minZ && prior.z < maxZ) {
    if (prior.x <= minX && candidate.x > minX) return freeze({ position: freeze({ ...candidate, x: minX }), collided: true, id: collider.id });
    if (prior.x >= maxX && candidate.x < maxX) return freeze({ position: freeze({ ...candidate, x: maxX }), collided: true, id: collider.id });
  }
  if (prior.x > minX && prior.x < maxX) {
    if (prior.z <= minZ && candidate.z > minZ) return freeze({ position: freeze({ ...candidate, z: minZ }), collided: true, id: collider.id });
    if (prior.z >= maxZ && candidate.z < maxZ) return freeze({ position: freeze({ ...candidate, z: maxZ }), collided: true, id: collider.id });
  }
  if (candidate.x <= minX || candidate.x >= maxX || candidate.z <= minZ || candidate.z >= maxZ) return freeze({ position: candidate, collided: false, id: null });
  const distances = [
    { edge: 'minX', value: Math.abs(candidate.x - minX) },
    { edge: 'maxX', value: Math.abs(maxX - candidate.x) },
    { edge: 'minZ', value: Math.abs(candidate.z - minZ) },
    { edge: 'maxZ', value: Math.abs(maxZ - candidate.z) }
  ].sort((a, b) => a.value - b.value);
  const edge = distances[0]?.edge || 'minZ';
  const position = { ...candidate };
  if (edge === 'minX') position.x = minX;
  if (edge === 'maxX') position.x = maxX;
  if (edge === 'minZ') position.z = minZ;
  if (edge === 'maxZ') position.z = maxZ;
  return freeze({ position: freeze(position), collided: true, id: collider.id });
}

export function resolveEonCityThirdPersonPosition({ position = {}, desiredMove = {}, step = 0, bounds = 13, radius = 0.38, colliders = [] } = {}) {
  const current = normalizePosition(position);
  const direction = normalizeVector(desiredMove);
  const distance = Math.max(0, finite(step));
  const worldBounds = Math.max(1, finite(bounds, 13));
  const playerRadius = clamp(finite(radius, 0.38), 0.1, Math.max(0.1, worldBounds * 0.45));
  let candidate = freeze({
    x: clamp(current.x + direction.x * distance, -worldBounds + playerRadius, worldBounds - playerRadius),
    y: current.y,
    z: clamp(current.z + direction.z * distance, -worldBounds + playerRadius, worldBounds - playerRadius)
  });
  const hitIds = [];
  for (const collider of normalizeEonCityCollisionVolumes(colliders)) {
    const result = collider.type === 'box'
      ? resolveBox(candidate, collider, playerRadius, current)
      : resolveCircle(candidate, collider, playerRadius, direction);
    candidate = result.position;
    if (result.collided && result.id) hitIds.push(result.id);
  }
  candidate = freeze({
    x: clamp(candidate.x, -worldBounds + playerRadius, worldBounds - playerRadius),
    y: candidate.y,
    z: clamp(candidate.z, -worldBounds + playerRadius, worldBounds - playerRadius)
  });
  return freeze({
    schema: EON_CITY_THIRD_PERSON_SCHEMA,
    position: freeze({ x: round(candidate.x), y: round(candidate.y), z: round(candidate.z) }),
    requestedStep: round(distance),
    appliedStep: round(Math.hypot(candidate.x - current.x, candidate.z - current.z)),
    collided: hitIds.length > 0,
    collisionIds: freeze([...new Set(hitIds)]),
    atWorldBoundary: Math.abs(candidate.x) >= worldBounds - playerRadius || Math.abs(candidate.z) >= worldBounds - playerRadius
  });
}

export function createEonCityPointerLook({ canvas, documentRef = globalThis.document, sensitivity = 0.0022, onLook, onChange } = {}) {
  let active = false;
  let requested = false;
  let destroyed = false;
  const canUse = Boolean(canvas && documentRef && typeof canvas.requestPointerLock === 'function');
  const emit = (reason = 'state-change') => {
    try { onChange?.(freeze({ schema: EON_CITY_THIRD_PERSON_SCHEMA, active, requested, supported: canUse, reason })); } catch {}
  };
  const sync = () => {
    const next = Boolean(documentRef?.pointerLockElement === canvas);
    if (next !== active) {
      active = next;
      if (!active) requested = false;
      emit(active ? 'locked' : 'released');
    }
  };
  const move = (event) => {
    if (!active || destroyed) return;
    const yaw = clamp(finite(event?.movementX) * sensitivity, -0.18, 0.18);
    const pitch = clamp(finite(event?.movementY) * sensitivity, -0.14, 0.14);
    if (!yaw && !pitch) return;
    try { onLook?.(freeze({ yaw, pitch })); } catch {}
  };
  const onError = () => { requested = false; active = false; emit('request-failed'); };
  try {
    documentRef?.addEventListener?.('pointerlockchange', sync);
    documentRef?.addEventListener?.('pointerlockerror', onError);
    documentRef?.addEventListener?.('mousemove', move);
  } catch {}
  return freeze({
    request() {
      if (destroyed || !canUse) {
        emit('unsupported');
        return freeze({ ok: false, reason: 'pointer-lock-unavailable', supported: canUse });
      }
      requested = true;
      try {
        const result = canvas.requestPointerLock();
        Promise.resolve(result).catch(onError);
        emit('requesting');
        return freeze({ ok: true, requested: true, supported: true });
      } catch {
        onError();
        return freeze({ ok: false, reason: 'pointer-lock-request-failed', supported: true });
      }
    },
    release(reason = 'manual') {
      requested = false;
      if (documentRef?.pointerLockElement === canvas) {
        try { documentRef.exitPointerLock?.(); } catch {}
      }
      active = false;
      emit(reason);
      return true;
    },
    getSnapshot() { return freeze({ schema: EON_CITY_THIRD_PERSON_SCHEMA, active, requested, supported: canUse }); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      this.release('destroyed');
      try {
        documentRef?.removeEventListener?.('pointerlockchange', sync);
        documentRef?.removeEventListener?.('pointerlockerror', onError);
        documentRef?.removeEventListener?.('mousemove', move);
      } catch {}
    }
  });
}
