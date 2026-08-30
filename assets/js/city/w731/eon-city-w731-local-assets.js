/**
 * W731 local-only progressive GLB loader.
 *
 * This module is dynamically imported after the first playable frame. It owns
 * same-origin content-hashed character and authored environment assets selected by
 * the current launch manifest. Every load may fail without stopping movement or station access.
 */
import '@babylonjs/loaders/glTF/index.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { MeshoptCompression } from '@babylonjs/core/Meshes/Compression/meshoptCompression.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  getEonCityW731QualityBudget
} from './eon-city-w731-launch-asset-manifest.js';
import {
  computeEonCityW759GroundCorrection,
  computeEonCityW759TargetScale,
  evaluateEonCityW759AttachmentPresentation
} from '../w759/eon-city-w759-attachment-presentation.js';
import { buildEonCityL95ProgressiveAssetAdmission } from '../l95/eon-city-l95-progressive-asset-admission.js';
import {
  auditEonCityL95LocalAssetSourceResidency,
  getEonCityL95LocalAssetSourceKey
} from '../l95/eon-city-l95-local-asset-source-residency.js';

export const EON_CITY_W731_LOCAL_ASSET_RUNTIME_SCHEMA = 'eon.city.local-assets.w731.v1';
export const EON_CITY_W731_MESHOPT_DECODER = '/assets/vendor/babylon/meshopt_decoder.js';
const freeze = (value) => Object.freeze(value);
const LOAD_TIMEOUT_MS = 14_000;

function splitPath(path = '') {
  const normalized = String(path || '');
  const index = normalized.lastIndexOf('/');
  return index < 0
    ? { rootUrl: '/', fileName: normalized }
    : { rootUrl: normalized.slice(0, index + 1), fileName: normalized.slice(index + 1) };
}

function withTimeout(promise, timeoutMs = LOAD_TIMEOUT_MS) {
  let timer = null;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = globalThis.setTimeout?.(() => reject(new Error('w731-local-asset-timeout')), timeoutMs) || null; })
  ]).finally(() => { if (timer) globalThis.clearTimeout?.(timer); });
}

function configureMeshopt() {
  MeshoptCompression.Configuration = { decoder: { url: EON_CITY_W731_MESHOPT_DECODER } };
}

function computeBounds(container) {
  const meshes = (container?.meshes || []).filter((mesh) => mesh?.getBoundingInfo);
  if (!meshes.length) return null;
  let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, box.minimumWorld);
      max = Vector3.Maximize(max, box.maximumWorld);
    } catch {}
  }
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return freeze({ min, max, height: Math.max(0.0001, max.y - min.y) });
}

function serializeBounds(bounds) {
  if (!bounds?.min || !bounds?.max) return null;
  const min = { x: Number(bounds.min.x), y: Number(bounds.min.y), z: Number(bounds.min.z) };
  const max = { x: Number(bounds.max.x), y: Number(bounds.max.y), z: Number(bounds.max.z) };
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return freeze({
    min: freeze(min),
    max: freeze(max),
    size: freeze({ x: max.x - min.x, y: max.y - min.y, z: max.z - min.z }),
    center: freeze({ x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 })
  });
}

function materialHasTexture(material) {
  try {
    if ((material?.getActiveTextures?.() || []).length > 0) return true;
  } catch {}
  return ['albedoTexture', 'baseTexture', 'diffuseTexture', 'emissiveTexture', 'opacityTexture', 'metallicTexture', 'bumpTexture']
    .some((key) => Boolean(material?.[key]));
}

function materialIsUntexturedPureWhite(material) {
  if (!material || materialHasTexture(material)) return false;
  const base = material.albedoColor || material.baseColor || material.diffuseColor || null;
  if (!base || !['r', 'g', 'b'].every((key) => Number.isFinite(Number(base?.[key])))) return false;
  const emissive = material.emissiveColor || null;
  const emissiveEnergy = emissive ? Number(emissive.r || 0) + Number(emissive.g || 0) + Number(emissive.b || 0) : 0;
  return Number(base.r) >= 0.96 && Number(base.g) >= 0.96 && Number(base.b) >= 0.96 && emissiveEnergy < 0.06;
}

export function inspectEonCityW743VisualReadiness(container) {
  const renderableMeshes = (container?.meshes || []).filter((mesh) => {
    try { return Number(mesh?.getTotalVertices?.() || 0) > 0 || Number(mesh?.subMeshes?.length || 0) > 0; }
    catch { return false; }
  });
  const materials = new Set();
  let materiallessMeshes = 0;
  for (const mesh of renderableMeshes) {
    if (!mesh?.material) materiallessMeshes += 1;
    else materials.add(mesh.material);
  }
  const textureBearingMaterials = [...materials].filter(materialHasTexture).length;
  const pureWhiteUntexturedMaterials = [...materials].filter(materialIsUntexturedPureWhite).length;
  const allMaterialsPureWhite = materials.size > 0 && pureWhiteUntexturedMaterials === materials.size;
  return freeze({
    ready: renderableMeshes.length > 0 && materiallessMeshes === 0 && !allMaterialsPureWhite,
    renderableMeshes: renderableMeshes.length,
    materiallessMeshes,
    materials: materials.size,
    textureBearingMaterials,
    pureWhiteUntexturedMaterials,
    allMaterialsPureWhite
  });
}

function animationName(group) {
  return String(group?.name || '').trim();
}

function findAnimation(groups = [], state = 'idle', { stationary = false } = {}) {
  const rules = {
    idle: [/^idle_?0?2$/i, /^idle$/i, /^idle/i, /idle/i],
    'idle-alt': [/^idle_?11$/i, /^idle_?0?3$/i, /^idle_?0?2$/i, /idle/i],
    walk: [/^walk/i, /walking/i, /walking_man/i],
    run: [/^run/i, /running/i],
    talk: [/talk/i, /discuss/i, /gesture/i, /agree/i],
    interact: [/checkout/i, /inspect/i, /agree/i, /push/i, /open.?door/i, /gesture/i, /talk/i, /lower.?weapon/i],
    inspect: [/lower.?weapon.?look.?raise/i, /inspect/i, /look/i, /checkout/i],
    pose: [/hand.?on.?hip/i, /gesture/i, /agree/i],
    victory: [/victory/i, /jump.?with.?arms.?open/i, /wave/i],
    wave: [/wave/i],
    open: [/open.?door/i]
  };
  const patterns = rules[state] || rules.idle;
  for (const pattern of patterns) {
    const match = groups.find((group) => pattern.test(animationName(group)));
    if (match) return match;
  }
  if (state !== 'idle') {
    for (const pattern of rules.idle) {
      const idle = groups.find((group) => pattern.test(animationName(group)));
      if (idle) return idle;
    }
  }
  if (stationary) {
    return groups.find((group) => !/(?:^|[_\s-])(?:walk|walking|run|running)(?:$|[_\s-])/i.test(animationName(group))) || null;
  }
  return groups[0] || null;
}

function createAnimationController(container, rootSnapshots = [], { initialStationary = false } = {}) {
  const groups = [...(container?.animationGroups || [])];
  for (const group of groups) {
    for (const targeted of group?.targetedAnimations || []) {
      if (!targeted?.animation) continue;
      targeted.animation.enableBlending = true;
      targeted.animation.blendingSpeed = 0.085;
    }
  }
  let active = null;
  let activeState = '';
  let playRevision = 0;
  const restoreRoots = () => {
    for (const snapshot of rootSnapshots) {
      try { snapshot.node.position.copyFrom(snapshot.position); } catch {}
      try { snapshot.node.rotation.copyFrom(snapshot.rotation); } catch {}
      try { snapshot.node.scaling.copyFrom(snapshot.scaling); } catch {}
    }
  };
  const play = (state = 'idle', { restart = false, stationary = false, speedRatio = 1 } = {}) => {
    const safeSpeedRatio = Math.max(0.35, Math.min(2.5, Number(speedRatio) || 1));
    if (!restart && activeState === state && active?.isPlaying) {
      active.speedRatio = safeSpeedRatio;
      return true;
    }
    const next = findAnimation(groups, state, { stationary });
    if (!next) return false;
    for (const group of groups) {
      try { if (group !== next) group.stop?.(); } catch {}
    }
    const loop = ['idle', 'idle-alt', 'walk', 'run'].includes(state);
    const revision = ++playRevision;
    try { next.start?.(loop, safeSpeedRatio, next.from, next.to, false); } catch { return false; }
    next.speedRatio = safeSpeedRatio;
    active = next;
    activeState = state;
    if (!loop && next.onAnimationGroupEndObservable?.addOnce) {
      next.onAnimationGroupEndObservable.addOnce(() => {
        if (revision !== playRevision || active !== next) return;
        play('idle', { restart: true, stationary: true });
      });
    }
    restoreRoots();
    return true;
  };
  play('idle', { stationary: initialStationary });
  return freeze({
    play,
    playStationary(state = 'idle', options = {}) {
      const safeState = ['idle', 'idle-alt', 'talk', 'wave', 'open', 'interact', 'inspect', 'pose', 'victory'].includes(String(state || '').toLowerCase()) ? String(state).toLowerCase() : 'idle';
      return play(safeState, { ...options, stationary: true });
    },
    canPlay(state = 'idle', { stationary = false } = {}) {
      return Boolean(findAnimation(groups, String(state || 'idle').toLowerCase(), { stationary }));
    },
    getReadiness(requiredStates = ['idle', 'walk', 'run']) {
      const required = [...new Set((Array.isArray(requiredStates) ? requiredStates : ['idle', 'walk', 'run']).map((state) => String(state || '').toLowerCase()).filter(Boolean))];
      const states = freeze(Object.fromEntries(required.map((state) => [state, Boolean(findAnimation(groups, state, { stationary: state === 'idle' }))])));
      return freeze({ ready: required.every((state) => states[state] === true), required: freeze(required), states, availableClipCount: groups.length });
    },
    stabilize: restoreRoots,
    getState: () => freeze({ state: activeState || null, clip: animationName(active) || null, playing: Boolean(active?.isPlaying), available: groups.length }),
    dispose() { playRevision += 1; for (const group of groups) { try { group.stop?.(); } catch {} } restoreRoots(); }
  });
}

async function loadContainer(scene, variant, onProgress = null) {
  const path = String(variant?.path || '');
  if (!/^\/assets\/city\/w649\/(?:primary|fallback)\/(?:characters|world)\//.test(path) || !/\.[a-f0-9]{12}\.glb$/i.test(path)) throw new Error('w731-local-asset-path-invalid');
  const { rootUrl, fileName } = splitPath(path);
  return withTimeout(SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const loaded = Math.max(0, Number(event?.loaded || 0));
    const total = Math.max(0, Number(event?.total || 0));
    onProgress?.(freeze({ path, loaded, total, ratio: total > 0 ? Math.min(1, loaded / total) : null }));
  }));
}

async function attachEntry({ scene, entry, anchor, quality, onProgress, onStatus, instanceKey = entry?.alias || entry?.id }) {
  let error = null;
  for (const variantName of quality === 'lite' ? ['fallback', 'primary'] : ['primary', 'fallback']) {
    const variant = entry.variants[variantName];
    let container = null;
    let wrapper = null;
    let animations = null;
    try {
      onStatus?.(`Preparing ${entry.role.replaceAll('-', ' ')}.`);
      container = await loadContainer(scene, variant, (progress) => onProgress?.({ assetId: entry.id, variant: variantName, ...progress }));
      wrapper = new TransformNode(`w737-${instanceKey}-wrapper`, scene);
      wrapper.parent = anchor;
      wrapper.metadata = freeze({ kind: entry.kind === 'world' ? 'w737-local-world-asset' : 'w731-local-character', assetId: entry.id, alias: entry.alias, instanceKey, role: entry.role, localOnly: true, variant: variantName });
      container.addAllToScene?.();
      const rootSnapshots = [];
      for (const root of container.rootNodes || []) {
        root.parent = wrapper;
        rootSnapshots.push({ node: root, position: root.position.clone(), rotation: root.rotation.clone(), scaling: root.scaling.clone() });
      }
      let bounds = computeBounds(container);
      const targetScale = computeEonCityW759TargetScale({
        targetHeight: Number(entry.targetHeight || 1.8),
        sourceHeight: Number(bounds?.height || 0)
      });
      if (!targetScale.ok) throw new Error(`w759-local-asset-scale-invalid:${targetScale.reason}`);
      wrapper.scaling.setAll(targetScale.scale);
      wrapper.computeWorldMatrix?.(true);
      bounds = computeBounds(container);
      const anchorPosition = anchor.getAbsolutePosition?.() || anchor.absolutePosition || anchor.position || { x: 0, y: 0, z: 0 };
      const positionY = Number(entry.options?.positionY || 0);
      const groundCorrection = computeEonCityW759GroundCorrection({ currentWorldMinY: bounds?.min?.y, anchorWorldY: anchorPosition.y, positionY });
      if (!groundCorrection.ok) throw new Error(`w759-local-asset-ground-invalid:${groundCorrection.reason}`);
      wrapper.position.y += groundCorrection.correctionY;
      wrapper.rotation.y += Number(entry.options?.rotationY || 0);
      wrapper.computeWorldMatrix?.(true);
      bounds = computeBounds(container);
      const finalBounds = serializeBounds(bounds);
      for (const mesh of container.meshes || []) {
        mesh.isPickable = false;
        mesh.checkCollisions = false;
        mesh.receiveShadows = false;
        mesh.metadata = freeze({ ...(mesh.metadata || {}), kind: entry.kind === 'world' ? 'w737-local-world-mesh' : 'w731-local-character-mesh', assetId: entry.id, alias: entry.alias, instanceKey, interactive: false });
      }
      const visualReadiness = inspectEonCityW743VisualReadiness(container);
      if (!visualReadiness.ready) throw new Error(`w743-local-asset-visual-not-ready:${visualReadiness.materiallessMeshes}:${visualReadiness.pureWhiteUntexturedMaterials}`);
      const renderableMeshes = (container.meshes || []).filter((mesh) => {
        try { return Number(mesh?.getTotalVertices?.() || 0) > 0 || Number(mesh?.subMeshes?.length || 0) > 0; }
        catch { return false; }
      });
      const targetHeight = Number(entry.targetHeight || 1.8);
      const presentation = evaluateEonCityW759AttachmentPresentation({
        targetHeight,
        bounds: finalBounds,
        wrapperEnabled: wrapper.isEnabled?.(true) !== false,
        renderableMeshes: renderableMeshes.length,
        enabledMeshes: renderableMeshes.filter((mesh) => mesh.isEnabled?.(true) !== false).length,
        visibleMeshes: renderableMeshes.filter((mesh) => mesh.isEnabled?.(true) !== false && mesh.isVisible !== false && Number(mesh.visibility ?? 1) > 0).length,
        expectedAnchor: { x: Number(anchorPosition.x || 0), y: Number(anchorPosition.y || 0), z: Number(anchorPosition.z || 0) },
        maxHorizontalOffset: Math.max(6, targetHeight * 2.5),
        expectedGroundY: Number(anchorPosition.y || 0) + positionY,
        groundTolerance: Math.max(0.35, targetHeight * 0.15),
        maxWorldRadius: 34
      });
      if (!presentation.ready) throw new Error(`w759-local-asset-presentation-not-ready:${presentation.reasons.join(',')}`);
      animations = createAnimationController(container, rootSnapshots, { initialStationary: entry.tier === 'role-lazy' });
      return freeze({
        ok: true,
        entry,
        instanceKey,
        variantName,
        container,
        wrapper,
        animations,
        visualReadiness,
        presentation,
        targetScale,
        bounds: finalBounds,
        dispose() {
          animations.dispose();
          // Babylon AssetContainer.removeAllFromScene validates that every root
          // parent is also owned by the container. These roots are intentionally
          // parented under our external City wrapper while live, so detach them
          // before container removal to avoid invalid-hierarchy warnings.
          for (const root of container.rootNodes || []) {
            try { root.parent = null; } catch {}
          }
          try { container.removeAllFromScene?.(); } catch {}
          try { container.dispose?.(); } catch {}
          try { wrapper.dispose?.(false, true); } catch {}
        }
      });
    } catch (caught) {
      error = caught;
      try { animations?.dispose?.(); } catch {}
      for (const root of container?.rootNodes || []) {
        try { root.parent = null; } catch {}
      }
      try { container?.removeAllFromScene?.(); } catch {}
      try { container?.dispose?.(); } catch {}
      try { wrapper?.dispose?.(false, true); } catch {}
      onStatus?.(`${entry.role.replaceAll('-', ' ')} is using its safe City fallback.`);
    }
  }
  return freeze({ ok: false, entry, error: String(error?.message || error || 'asset-load-failed'), dispose() {} });
}

export function createEonCityW731LocalAssetRuntime({ scene, quality = 'balanced', qualityAuthority = null, onProgress = null, onStatus = null } = {}) {
  if (!scene) throw new Error('w731-local-asset-scene-required');
  configureMeshopt();
  const budget = getEonCityW731QualityBudget(quality);
  const normalizedQuality = String(budget?.name || quality || 'balanced').trim().toLowerCase();
  const normalizedAuthority = freeze({
    received: String(qualityAuthority?.received || quality || ''),
    effective: normalizedQuality,
    source: String(qualityAuthority?.source || 'automatic'),
    detected: String(qualityAuthority?.detected || normalizedQuality),
    renderer: String(qualityAuthority?.renderer || '')
  });
  const maxConcurrentLoads = Math.max(1, Math.min(2, Number(budget.maxConcurrentLoads || 1)));
  const maxResidentAssets = Math.max(16, Number(budget.maxResidentAssets || 24));
  const records = new Map();
  const inflight = new Map();
  const attempts = new Map();
  const queue = [];
  const activeSourceKeys = new Set();
  const sourceResidency = auditEonCityL95LocalAssetSourceResidency(EON_CITY_W731_LAUNCH_ASSET_MANIFEST, { quality: normalizedQuality });
  let disposed = false;
  let activeLoads = 0;
  let activeOptionalLoads = 0;
  let completedLoads = 0;
  let failedLoads = 0;
  let optionalAdmission = buildEonCityL95ProgressiveAssetAdmission({ maxConcurrentLoads });

  const pump = () => {
    if (disposed) return;
    while (activeLoads < maxConcurrentLoads && queue.length > 0) {
      const taskIndex = queue.findIndex((candidate) => (candidate.priority === 'critical' || activeOptionalLoads < optionalAdmission.optionalConcurrencyLimit) && !activeSourceKeys.has(candidate.sourceKey));
      if (taskIndex < 0) break;
      const [task] = queue.splice(taskIndex, 1);
      const optional = task.priority !== 'critical';
      activeLoads += 1;
      activeSourceKeys.add(task.sourceKey);
      if (optional) activeOptionalLoads += 1;
      attempts.set(task.key, freeze({ ...task.diagnostic, status: 'loading', startedAt: Date.now(), lastUpdatedAt: Date.now() }));
      void attachEntry({ scene, entry: task.entry, anchor: task.anchor, quality, onProgress, onStatus, instanceKey: task.key })
        .then((record) => {
          completedLoads += 1;
          const completedAfterDispose = disposed === true;
          if (record?.ok && !completedAfterDispose) records.set(task.key, record);
          else if (record?.ok) record.dispose?.();
          if (!record?.ok) failedLoads += 1;
          const resolvedRecord = completedAfterDispose
            ? freeze({ ok: false, entry: task.entry, reason: 'local-asset-runtime-disposed', disposedAfterLoad: true, dispose() {} })
            : record;
          attempts.set(task.key, freeze({ ...attempts.get(task.key), status: completedAfterDispose ? 'cancelled' : record?.ok ? 'ready' : 'failed', completedAt: Date.now(), durationMs: Date.now() - Number(attempts.get(task.key)?.requestedAt || Date.now()), presentation: completedAfterDispose ? null : record?.presentation || null, error: completedAfterDispose ? 'local-asset-runtime-disposed' : record?.error || null, lastUpdatedAt: Date.now() }));
          task.resolve(resolvedRecord);
        })
        .catch((error) => {
          failedLoads += 1;
          attempts.set(task.key, freeze({ ...attempts.get(task.key), status: 'failed', completedAt: Date.now(), durationMs: Date.now() - Number(attempts.get(task.key)?.requestedAt || Date.now()), error: String(error?.message || error || 'asset-load-failed'), lastUpdatedAt: Date.now() }));
          task.resolve(freeze({ ok: false, entry: task.entry, error: String(error?.message || error || 'asset-load-failed'), dispose() {} }));
        })
        .finally(() => {
          activeLoads = Math.max(0, activeLoads - 1);
          if (optional) activeOptionalLoads = Math.max(0, activeOptionalLoads - 1);
          activeSourceKeys.delete(task.sourceKey);
          inflight.delete(task.key);
          pump();
        });
    }
  };

  const load = (entry, anchor, instanceKey = entry?.alias || entry?.id, { priority = 'optional' } = {}) => {
    if (disposed || !entry || !anchor) return Promise.resolve(freeze({ ok: false, reason: 'local-asset-runtime-unavailable' }));
    const key = String(instanceKey || entry.alias || entry.id);
    if (records.has(key)) return Promise.resolve(records.get(key));
    if (inflight.has(key)) return inflight.get(key);
    if (records.size + inflight.size >= maxResidentAssets) return Promise.resolve(freeze({ ok: false, reason: 'resident-asset-budget', maxResidentAssets }));
    const requestedAt = Date.now();
    const anchorPosition = anchor.getAbsolutePosition?.() || anchor.absolutePosition || anchor.position || { x: 0, y: 0, z: 0 };
    const normalizedPriority = String(priority || '').toLowerCase() === 'critical' ? 'critical' : 'optional';
    const sourceKey = getEonCityL95LocalAssetSourceKey(entry);
    const diagnostic = freeze({ instanceKey: key, sourceKey, alias: String(entry.alias || ''), kind: String(entry.kind || ''), group: String(entry.group || ''), priority: normalizedPriority, requestedAt, startedAt: null, completedAt: null, durationMs: null, status: 'queued', variants: quality === 'lite' ? ['fallback', 'primary'] : ['primary', 'fallback'], path: String(entry.variants?.primary?.path || ''), targetHeight: Number(entry.targetHeight || 0), anchor: { x: Number(anchorPosition.x || 0), y: Number(anchorPosition.y || 0), z: Number(anchorPosition.z || 0) }, positionY: Number(entry.options?.positionY || 0), lastUpdatedAt: requestedAt });
    attempts.set(key, diagnostic);
    const promise = new Promise((resolve) => queue.push({ key, sourceKey, entry, anchor, resolve, diagnostic, priority: normalizedPriority }));
    inflight.set(key, promise);
    pump();
    return promise;
  };

  const byAlias = (collection = [], alias = '') => collection.find((item) => item.alias === String(alias || ''));

  return freeze({
    schema: EON_CITY_W731_LOCAL_ASSET_RUNTIME_SCHEMA,
    loadCore(alias, anchor) {
      const entry = byAlias(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreLazy, alias);
      return load(entry, anchor, `core:${alias}`, { priority: 'critical' });
    },
    loadRole(stationIdOrIndex, anchor) {
      const budget = getEonCityW731QualityBudget(quality);
      const index = Number.isInteger(stationIdOrIndex)
        ? stationIdOrIndex
        : EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.findIndex((entry) => entry.stationId === String(stationIdOrIndex || ''));
      if (index < 0) return Promise.resolve(freeze({ ok: false, reason: 'role-station' }));
      if (index >= budget.roleCharacters) return Promise.resolve(freeze({ ok: false, reason: 'quality-budget' }));
      const entry = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters[index];
      return load(entry, anchor, `role:${entry.stationId || index}`, { priority: 'optional' });
    },
    loadEnvironment(alias, anchor) {
      const entry = byAlias(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreWorld, alias);
      return load(entry, anchor, `environment:${alias}`, { priority: 'critical' });
    },
    loadStation(alias, anchor, stationId = alias) {
      const budget = getEonCityW731QualityBudget(quality);
      const index = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld.findIndex((item) => item.alias === String(alias || ''));
      if (index < 0 || index >= budget.stationWorld) return Promise.resolve(freeze({ ok: false, reason: index < 0 ? 'asset-alias' : 'quality-budget' }));
      return load(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld[index], anchor, `station:${stationId}`, { priority: 'optional' });
    },
    loadStationProp(alias, anchor, stationId = alias) {
      const budget = getEonCityW731QualityBudget(quality);
      const index = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationProps.findIndex((item) => item.alias === String(alias || ''));
      if (index < 0 || index >= budget.stationProps) return Promise.resolve(freeze({ ok: false, reason: index < 0 ? 'asset-alias' : 'quality-budget' }));
      return load(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationProps[index], anchor, `station-prop:${stationId}`, { priority: 'optional' });
    },
    loadDiscovery(alias, anchor, discoveryId = alias) {
      const budget = getEonCityW731QualityBudget(quality);
      const index = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld.findIndex((item) => item.alias === String(alias || ''));
      if (index < 0 || index >= budget.discoveryWorld) return Promise.resolve(freeze({ ok: false, reason: index < 0 ? 'asset-alias' : 'quality-budget' }));
      return load(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld[index], anchor, `discovery:${discoveryId}`, { priority: 'optional' });
    },
    loadAmbient(alias, anchor, ambientId = alias) {
      const budget = getEonCityW731QualityBudget(quality);
      const index = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.ambientAssets.findIndex((item) => item.alias === String(alias || ''));
      if (index < 0 || index >= budget.ambientAssets) return Promise.resolve(freeze({ ok: false, reason: index < 0 ? 'asset-alias' : 'quality-budget' }));
      return load(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.ambientAssets[index], anchor, `ambient:${ambientId}`, { priority: 'optional' });
    },
    setOptionalAdmission({ pressure = 'nominal', visibility = 'visible', reason = '' } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'local-asset-runtime-disposed' });
      optionalAdmission = buildEonCityL95ProgressiveAssetAdmission({ pressure, visibility, reason, maxConcurrentLoads });
      pump();
      return freeze({ ok: true, admission: optionalAdmission, queued: queue.length, activeLoads, activeOptionalLoads });
    },
    getSummary() {
      const residentRecords = [...records.values()];
      const readiness = residentRecords.map((record) => record.visualReadiness).filter(Boolean);
      const presentations = residentRecords.map((record) => record.presentation).filter(Boolean);
      return freeze({
        schema: EON_CITY_W731_LOCAL_ASSET_RUNTIME_SCHEMA,
        quality: normalizedQuality,
        qualityAuthority: normalizedAuthority,
        budget: freeze({ ...budget, name: String(budget?.name || normalizedQuality) }),
        resident: records.size,
        inflight: inflight.size,
        queued: queue.length,
        activeLoads,
        activeOptionalLoads,
        activeSourceLoads: activeSourceKeys.size,
        activeSourceKeys: [...activeSourceKeys],
        maxConcurrentLoads,
        optionalAdmission,
        sourceResidency,
        maxResidentAssets,
        completedLoads,
        failedLoads,
        materiallessMeshes: readiness.reduce((total, item) => total + Number(item.materiallessMeshes || 0), 0),
        pureWhiteUntexturedMaterials: readiness.reduce((total, item) => total + Number(item.pureWhiteUntexturedMaterials || 0), 0),
        visualReadinessPass: readiness.every((item) => item.ready === true),
        presented: presentations.filter((item) => item.ready === true).length,
        presentationReadinessPass: presentations.length === records.size && presentations.every((item) => item.ready === true),
        presentationFailures: presentations.filter((item) => item.ready !== true).map((item) => item.reasons),
        attempts: [...attempts.values()],
        failures: [...attempts.values()].filter((item) => item.status === 'failed'),
        pendingAliases: [...attempts.values()].filter((item) => item.status === 'queued' || item.status === 'loading').map((item) => item.alias),
        attachments: residentRecords.map((record) => freeze({
          instanceKey: record.instanceKey,
          alias: record.entry?.alias || '',
          kind: record.entry?.kind || '',
          targetHeight: Number(record.entry?.targetHeight || 0),
          actualHeight: record.presentation?.actualHeight ?? null,
          heightRatio: record.presentation?.heightRatio ?? null,
          ready: record.presentation?.ready === true,
          scale: record.targetScale?.scale ?? null,
          scaleClamped: record.targetScale?.clamped === true
        })),
        disposed
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const task of queue.splice(0)) {
        inflight.delete(task.key);
        task.resolve(freeze({ ok: false, reason: 'local-asset-runtime-disposed' }));
      }
      for (const record of records.values()) record.dispose?.();
      records.clear();
      inflight.clear();
      activeSourceKeys.clear();
    }
  });
}
