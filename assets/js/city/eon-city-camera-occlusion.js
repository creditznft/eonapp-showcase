/**
 * W613 — third-person camera sightline protection.
 *
 * A City wall may be visually useful while it destroys the player's view of the
 * Navigator. This controller only fades local architectural meshes that sit
 * between the camera and the operator. It never changes collision, routes,
 * inputs, data, network activity, or interaction semantics.
 */
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_CAMERA_OCCLUSION_SCHEMA = 'eon.city.camera-occlusion.w613.v1';

export const EON_CITY_CAMERA_OCCLUSION_POLICY = freeze({
  schema: EON_CITY_CAMERA_OCCLUSION_SCHEMA,
  targetEyeHeight: 1.18,
  fadeVisibility: 0.16,
  maxOccluders: 3,
  updateIntervalMs: 80,
  localVisualOnly: true,
  changesCollision: false,
  changesInput: false,
  changesRoutes: false,
  readsPrivateData: false,
  remoteNetwork: false
});

const NON_OCCLUDER_TOKENS = Object.freeze([
  'operator', 'navigator', 'eonbot', 'companion', 'landmark', 'hit-volume',
  'beacon', 'ring', 'label', 'sign', 'rain', 'sky', 'drone', 'courier',
  'guide', 'ambient-npc', 'agent-presence', 'click-move-marker'
]);

const ARCHITECTURE_TOKENS = Object.freeze([
  'wall', 'building', 'pylon', 'shell', 'canopy', 'tower', 'spire', 'basilica',
  'loom', 'atrium', 'observatory', 'dock', 'gate', 'district', 'module',
  'structure', 'fin', 'frame', 'column', 'beam', 'overpass', 'room', 'interior'
]);

function readable(value = '') {
  return String(value || '').trim().toLowerCase();
}

function meshIdentity(mesh = {}) {
  return `${readable(mesh?.name)} ${readable(mesh?.id)} ${readable(mesh?.metadata?.kind)} ${readable(mesh?.metadata?.type)}`;
}

export function isEonCityCameraOccluder(mesh = {}) {
  if (!mesh || mesh?.isDisposed?.() || mesh?.isVisible === false || mesh?.visibility === 0) return false;
  if (mesh?.metadata?.eonCityCameraOcclusion === false) return false;
  if (mesh?.metadata?.eonCityCameraOcclusion === true) return true;
  if (mesh?.metadata?.decorative === true) return false;
  const identity = meshIdentity(mesh);
  if (!identity || NON_OCCLUDER_TOKENS.some((token) => identity.includes(token))) return false;
  return ARCHITECTURE_TOKENS.some((token) => identity.includes(token));
}

export function resolveEonCityCameraOccluders(hits = [], { maxOccluders = EON_CITY_CAMERA_OCCLUSION_POLICY.maxOccluders } = {}) {
  const seen = new Set();
  const selected = [];
  for (const hit of Array.isArray(hits) ? hits : []) {
    const mesh = hit?.pickedMesh || hit?.mesh || hit;
    if (!mesh || seen.has(mesh) || !isEonCityCameraOccluder(mesh)) continue;
    seen.add(mesh);
    selected.push(mesh);
    if (selected.length >= Math.max(1, Number(maxOccluders) || 1)) break;
  }
  return freeze(selected);
}


function occlusionGroupKey(mesh = {}) {
  const metadata = mesh?.metadata || {};
  for (const key of ['buildingId', 'structureId', 'districtStructureId']) {
    const value = String(metadata[key] || '').trim();
    if (value) return `${key}:${value}`;
  }
  return '';
}

function expandEonCityCameraOccluderGroups(scene, meshes = []) {
  const selected = new Set(meshes);
  const keys = new Set(meshes.map(occlusionGroupKey).filter(Boolean));
  if (!keys.size) return freeze([...selected]);
  for (const mesh of scene?.meshes || []) {
    if (!mesh || mesh?.metadata?.eonCityCameraOcclusion === false) continue;
    if (keys.has(occlusionGroupKey(mesh))) selected.add(mesh);
  }
  return freeze([...selected]);
}

export function validateEonCityCameraOcclusionPolicy(policy = EON_CITY_CAMERA_OCCLUSION_POLICY) {
  const errors = [];
  if (policy?.schema !== EON_CITY_CAMERA_OCCLUSION_SCHEMA) errors.push('schema-invalid');
  if (!Number.isFinite(policy?.targetEyeHeight) || policy.targetEyeHeight < .8 || policy.targetEyeHeight > 1.9) errors.push('target-eye-height-invalid');
  if (!Number.isFinite(policy?.fadeVisibility) || policy.fadeVisibility < .05 || policy.fadeVisibility > .45) errors.push('fade-visibility-invalid');
  if (!Number.isInteger(policy?.maxOccluders) || policy.maxOccluders < 1 || policy.maxOccluders > 6) errors.push('max-occluders-invalid');
  if (!Number.isFinite(policy?.updateIntervalMs) || policy.updateIntervalMs < 32 || policy.updateIntervalMs > 250) errors.push('update-interval-invalid');
  for (const key of ['localVisualOnly', 'changesCollision', 'changesInput', 'changesRoutes', 'readsPrivateData', 'remoteNetwork']) {
    const expected = key === 'localVisualOnly';
    if (policy?.[key] !== expected) errors.push(`${key}-invalid`);
  }
  return freeze({ schema: EON_CITY_CAMERA_OCCLUSION_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}

/**
 * Fades only the closest eligible static architecture meshes along the live
 * camera-to-operator sightline. Original visibility is always restored on
 * clear, pause, destroy, and any non-occluded frame.
 */
export function createEonCityCameraOcclusionController({ scene, camera, target, policy = EON_CITY_CAMERA_OCCLUSION_POLICY } = {}) {
  const validation = validateEonCityCameraOcclusionPolicy(policy);
  const originalVisibility = new Map();
  let active = new Set();
  let lastUpdateAt = 0;
  let destroyed = false;
  let lastCount = 0;

  const restore = (mesh) => {
    if (!mesh || !originalVisibility.has(mesh)) return;
    try { mesh.visibility = originalVisibility.get(mesh); } catch {}
    originalVisibility.delete(mesh);
  };

  const clear = () => {
    active.forEach(restore);
    active = new Set();
    lastCount = 0;
  };

  const update = (now = globalThis.performance?.now?.() || Date.now()) => {
    if (destroyed || !validation.ok || !scene || !camera || !target?.position || scene.metadata?.playPaused) {
      clear();
      return freeze({ activeCount: 0, changed: false, localVisualOnly: true });
    }
    if (now - lastUpdateAt < policy.updateIntervalMs) return freeze({ activeCount: lastCount, changed: false, localVisualOnly: true });
    lastUpdateAt = now;
    const origin = target.position.add(new Vector3(0, policy.targetEyeHeight, 0));
    const destination = camera.globalPosition || camera.position;
    const direction = destination.subtract(origin);
    const length = direction.length();
    if (!Number.isFinite(length) || length < 1.15) {
      clear();
      return freeze({ activeCount: 0, changed: false, localVisualOnly: true });
    }
    direction.scaleInPlace(1 / length);
    let hits = [];
    try {
      const ray = new Ray(origin, direction, length);
      hits = scene.multiPickWithRay?.(ray, (mesh) => isEonCityCameraOccluder(mesh)) || [];
    } catch { hits = []; }
    const next = new Set(expandEonCityCameraOccluderGroups(scene, resolveEonCityCameraOccluders(hits, policy)));
    let changed = false;
    active.forEach((mesh) => {
      if (!next.has(mesh)) {
        restore(mesh);
        changed = true;
      }
    });
    next.forEach((mesh) => {
      if (!originalVisibility.has(mesh)) originalVisibility.set(mesh, Number.isFinite(mesh.visibility) ? mesh.visibility : 1);
      const base = originalVisibility.get(mesh);
      const visibility = Math.min(base, policy.fadeVisibility);
      if (mesh.visibility !== visibility) {
        try { mesh.visibility = visibility; } catch {}
        changed = true;
      }
    });
    active = next;
    lastCount = active.size;
    return freeze({ activeCount: lastCount, changed, localVisualOnly: true });
  };

  return freeze({
    schema: EON_CITY_CAMERA_OCCLUSION_SCHEMA,
    update,
    clear,
    getSummary() {
      return freeze({
        schema: EON_CITY_CAMERA_OCCLUSION_SCHEMA,
        activeOccluderCount: lastCount,
        fadeVisibility: policy.fadeVisibility,
        localVisualOnly: true,
        changesCollision: false,
        changesInput: false,
        changesRoutes: false,
        readsPrivateData: false,
        remoteNetwork: false
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clear();
    }
  });
}
