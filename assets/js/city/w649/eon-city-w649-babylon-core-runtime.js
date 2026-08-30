/**
 * W649D — controllable local GLB core for Pathfinder and EONBOT.
 *
 * This module loads only same-origin, content-hashed manifest entries. It
 * configures Babylon's Meshopt decoder to a source-controlled local file,
 * retries with the decoder-free variant, preserves procedural fallbacks until
 * a model is ready, and owns all containers/collision proxies for disposal.
 */
import '@babylonjs/loaders/glTF/index.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { MeshoptCompression } from '@babylonjs/core/Meshes/Compression/meshoptCompression.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import {
  getEonCityW649Character
} from './eon-city-w649-character-manifest.js';
import {
  getEonCityW649AnimationProfile,
  resolveEonCityW649Clip
} from './eon-city-w649-animation-manifest.js';
import {
  detectEonCityW649WebpSupport,
  resolveEonCityW649AssetVariant
} from './eon-city-w649-capability-resolver.js';
import { integrateEonCityW649Container } from './eon-city-w649-visual-integration.js';
import { EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET } from '../w671/eon-city-w671-owner-repair.js';
import { getEonCityW695CharacterAxisCalibration } from '../w695/eon-city-w695-character-motion-truth.js';

export const EON_CITY_W649_BABYLON_CORE_SCHEMA = 'eon.city.w649.babylon-core.v1';
export const EON_CITY_W649_LOCAL_MESHOPT_DECODER = '/assets/vendor/babylon/meshopt_decoder.js';
const LOAD_TIMEOUT_MS = 12_000;
const PLAYER_PRIMARY_ID = 'eoncity-pathfinder-prime-11clips';
const PLAYER_SECONDARY_ID = 'eoncity-pathfinder-a-vanguard-6clips';
const EONBOT_ID = 'eoncity-eonbot-orbit';
const freeze = (value) => Object.freeze(value);

function normalizeState(value = 'idle') {
  const state = String(value || 'idle').trim().toLowerCase();
  return ['idle', 'idle-alt', 'walk', 'run', 'wave', 'talk', 'open', 'interact', 'victory', 'jump'].includes(state) ? state : 'idle';
}

function isMeshoptCspFailure(error) {
  const message = String(error?.message || error || '');
  return /WebAssembly\.(?:instantiate|compile)|unsafe-eval|Content Security Policy/i.test(message);
}

function cloneVector(value) {
  return value?.clone?.() || new Vector3(Number(value?.x || 0), Number(value?.y || 0), Number(value?.z || 0));
}

function snapshotRoots(rootNodes = []) {
  return rootNodes.map((node) => freeze({
    node,
    position: cloneVector(node?.position),
    rotation: cloneVector(node?.rotation),
    scaling: cloneVector(node?.scaling || new Vector3(1, 1, 1))
  }));
}

function restoreRootTransforms(snapshots = []) {
  for (const snapshot of snapshots) {
    try { snapshot.node?.position?.copyFrom?.(snapshot.position); } catch {}
    try { snapshot.node?.rotation?.copyFrom?.(snapshot.rotation); } catch {}
    try { snapshot.node?.scaling?.copyFrom?.(snapshot.scaling); } catch {}
  }
}

/** Pure animation coordinator used by the Babylon runtime and unit tests. */
export function createEonCityW649AnimationStateMachine({ characterId = '', animationGroups = [], rootNodes = [] } = {}) {
  const profile = getEonCityW649AnimationProfile(characterId);
  const groups = new Map();
  for (const group of animationGroups || []) {
    const name = String(group?.name || '');
    if (!name) continue;
    groups.set(name, group);
    groups.set(name.toLowerCase(), group);
  }
  const rootSnapshots = snapshotRoots(rootNodes);
  let activeState = '';
  let activeClip = '';
  let transitionCount = 0;
  let cancellationCount = 0;
  let disposed = false;

  const stopAll = () => {
    let stopped = 0;
    const unique = new Set(groups.values());
    for (const group of unique) {
      try {
        if (group?.isPlaying) stopped += 1;
        group?.stop?.();
      } catch {}
    }
    return stopped;
  };

  const resolveGroup = (clip) => groups.get(String(clip || '')) || groups.get(String(clip || '').toLowerCase()) || null;

  return freeze({
    transition(state = 'idle', { restart = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'animation-state-machine-disposed' });
      const normalized = normalizeState(state);
      const clip = resolveEonCityW649Clip(characterId, normalized);
      const group = resolveGroup(clip);
      if (!clip || !group) return freeze({ ok: false, reason: 'animation-clip-unavailable', state: normalized, clip: clip || null });
      if (!restart && activeState === normalized && activeClip === clip && group.isPlaying) {
        restoreRootTransforms(rootSnapshots);
        return freeze({ ok: true, unchanged: true, state: normalized, clip });
      }
      const stopped = stopAll();
      if (stopped > 0) cancellationCount += stopped;
      const loop = ['idle', 'idle-alt', 'walk', 'run'].includes(normalized);
      try { group.start?.(loop, 1, group.from, group.to, false); } catch {
        return freeze({ ok: false, reason: 'animation-start-failed', state: normalized, clip });
      }
      activeState = normalized;
      activeClip = clip;
      transitionCount += 1;
      restoreRootTransforms(rootSnapshots);
      return freeze({ ok: true, unchanged: false, state: normalized, clip, loop });
    },
    stabilize() {
      if (disposed) return false;
      restoreRootTransforms(rootSnapshots);
      return true;
    },
    getSummary() {
      return freeze({
        characterId,
        profileAvailable: Boolean(profile),
        clipCount: profile?.clipCount || 0,
        availableGroupCount: new Set(groups.values()).size,
        activeState: activeState || null,
        activeClip: activeClip || null,
        transitionCount,
        cancellationCount,
        rootMotionPolicy: profile?.rootMotionPolicy || 'runtime-anchor-lock',
        disposed
      });
    },
    dispose() {
      if (disposed) return;
      stopAll();
      restoreRootTransforms(rootSnapshots);
      disposed = true;
    }
  });
}

export function configureEonCityW649MeshoptDecoder(url = EON_CITY_W649_LOCAL_MESHOPT_DECODER) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl.startsWith('/assets/')) throw new Error('w649-meshopt-decoder-must-be-local');
  MeshoptCompression.Configuration = { decoder: { url: safeUrl } };
  return freeze({ configured: true, url: safeUrl, sameOrigin: true, remoteDecoder: false });
}

function splitAssetPath(assetPath = '') {
  const normalized = String(assetPath || '');
  const slash = normalized.lastIndexOf('/');
  if (slash < 0) return { rootUrl: '/', fileName: normalized };
  return { rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) };
}

async function withTimeout(promise, timeoutMs = LOAD_TIMEOUT_MS) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = globalThis.setTimeout?.(() => reject(new Error('w649-asset-load-timeout')), timeoutMs) || null; })
    ]);
  } finally {
    if (timer) globalThis.clearTimeout?.(timer);
  }
}

async function defaultLoadContainer({ scene, path, signal, onProgress }) {
  if (signal?.aborted) throw new Error('w649-asset-load-aborted');
  const { rootUrl, fileName } = splitAssetPath(path);
  if (!fileName || !rootUrl.startsWith('/assets/city/w649/')) throw new Error('w649-asset-path-invalid');
  const container = await withTimeout(SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const total = Number(event?.total || 0);
    const loaded = Number(event?.loaded || 0);
    onProgress?.(freeze({ path, loaded, total, ratio: total > 0 ? Math.min(1, loaded / total) : null }));
  }));
  if (signal?.aborted) {
    try { container?.dispose?.(); } catch {}
    throw new Error('w649-asset-load-aborted');
  }
  return container;
}

function setEnabled(node, enabled) {
  try { node?.setEnabled?.(enabled); } catch {}
}

function hideProceduralFallback(anchor) {
  setEnabled(anchor?.metadata?.proceduralFallbackRoot, false);
  for (const node of anchor?.metadata?.proceduralFallbackExtras || []) setEnabled(node, false);
}

function showProceduralFallback(anchor) {
  setEnabled(anchor?.metadata?.proceduralFallbackRoot, true);
  for (const node of anchor?.metadata?.proceduralFallbackExtras || []) setEnabled(node, true);
}

function computeContainerBounds(container) {
  const meshes = (container?.meshes || []).filter((mesh) => mesh?.getBoundingInfo && mesh?.isEnabled?.() !== false);
  if (!meshes.length) return null;
  let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  for (const mesh of meshes) {
    try {
      mesh.computeWorldMatrix?.(true);
      const bounds = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, bounds.minimumWorld);
      max = Vector3.Maximize(max, bounds.maximumWorld);
    } catch {}
  }
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return freeze({ min, max, height: Math.max(0.0001, max.y - min.y) });
}

function attachAndNormalize({ scene, container, anchor, id, targetHeight, rotationY = 0, quality = 'balanced', allowShadowCaster = false, role = 'core-visual' }) {
  const wrapper = new TransformNode(`w649-${id}-wrapper`, scene);
  wrapper.parent = anchor;
  wrapper.rotation.y = rotationY;
  wrapper.metadata = freeze({ kind: 'w649-loaded-asset-root', id, localOnly: true, contentHashed: true });
  container?.addAllToScene?.();
  for (const root of container?.rootNodes || []) root.parent = wrapper;
  const visualIntegration = integrateEonCityW649Container({ scene, container, quality, assetId: id, role, allowShadowCaster });
  let bounds = computeContainerBounds(container);
  if (bounds) {
    const scale = Math.min(20, Math.max(0.01, targetHeight / bounds.height));
    wrapper.scaling.setAll(scale);
    bounds = computeContainerBounds(container);
    const anchorY = anchor?.getAbsolutePosition?.().y ?? anchor?.position?.y ?? 0;
    if (bounds) wrapper.position.y += anchorY - bounds.min.y;
  }
  return freeze({ wrapper, roots: freeze([...(container?.rootNodes || [])]), bounds, visualIntegration });
}

function createCollisionCapsule({ scene, anchor, id, height, radius }) {
  let mesh = null;
  try {
    mesh = MeshBuilder.CreateCapsule(`w649-${id}-collision`, { height, radius, tessellation: 8, subdivisions: 2 }, scene);
  } catch {
    mesh = MeshBuilder.CreateCylinder(`w649-${id}-collision`, { height, diameter: radius * 2, tessellation: 8 }, scene);
  }
  mesh.parent = anchor;
  mesh.position.y = height * 0.5;
  mesh.isVisible = false;
  mesh.visibility = 0;
  mesh.isPickable = false;
  mesh.checkCollisions = false;
  mesh.metadata = freeze({ kind: 'w649-collision-capsule', id, primitiveOnly: true, visualMeshCollision: false, height, radius });
  return mesh;
}

function disableSupersededAnchorChildren(anchor, activeWrapper, collision) {
  if (!activeWrapper || !anchor?.getChildren) return;
  for (const child of anchor.getChildren()) {
    if (child === activeWrapper || child === collision) continue;
    setEnabled(child, false);
  }
  setEnabled(activeWrapper, true);
}

function disposeRecord(record) {
  try { record?.animation?.dispose?.(); } catch {}
  try { record?.visualIntegration?.dispose?.(); } catch {}
  try { record?.collision?.dispose?.(false, true); } catch {}
  for (const root of record?.roots || record?.container?.rootNodes || []) {
    try { root.parent = null; } catch {}
  }
  try { record?.container?.removeAllFromScene?.(); } catch {}
  try { record?.container?.dispose?.(); } catch {}
  try { record?.wrapper?.dispose?.(false, true); } catch {}
}

export function createEonCityW649BabylonCoreRuntime({
  scene,
  playerAnchor,
  eonbotAnchor,
  quality = 'balanced',
  reducedMotion = false,
  loadContainer = defaultLoadContainer,
  detectWebp = detectEonCityW649WebpSupport,
  onStatus = null,
  onProgress = null
} = {}) {
  const records = new Map();
  const attempts = [];
  const controller = new AbortController();
  let disposed = false;
  let capabilities = freeze({ meshoptDecoderReady: false, webpTextureReady: false, reducedData: quality === 'lite' });
  let playerAssetId = null;

  const loadVariant = async (asset, variantName, anchor, options) => {
    const variant = asset?.variants?.[variantName];
    if (!variant) throw new Error(`w649-variant-missing:${asset?.id}:${variantName}`);
    const attempt = { assetId: asset.id, variant: variantName, path: variant.path, bytes: variant.bytes, startedAt: Date.now() };
    attempts.push(attempt);
    try {
      const container = await loadContainer({ scene, path: variant.path, signal: controller.signal, onProgress: (progress) => onProgress?.({ assetId: asset.id, variant: variantName, ...progress }) });
      if (disposed || controller.signal.aborted) {
        try { container?.dispose?.(); } catch {}
        throw new Error('w649-runtime-disposed-during-load');
      }
      const calibration = options.slot === 'player' ? getEonCityW695CharacterAxisCalibration(asset.id, variantName) : null;
      const modelHeadingOffset = options.slot === 'player'
        ? Number(calibration?.visualHeadingOffset ?? EON_CITY_W671_PLAYER_MODEL_HEADING_OFFSET)
        : Number(options.rotationY || 0);
      const attached = attachAndNormalize({ scene, container, anchor, id: asset.id, targetHeight: options.targetHeight, rotationY: modelHeadingOffset, quality, allowShadowCaster: options.slot === 'player' && quality === 'cinematic', role: options.slot === 'player' ? 'controllable-player' : 'companion' });
      const animation = createEonCityW649AnimationStateMachine({ characterId: asset.id, animationGroups: container?.animationGroups || [], rootNodes: attached.roots });
      const collision = createCollisionCapsule({ scene, anchor, id: asset.id, height: options.collisionHeight, radius: options.collisionRadius });
      const record = { asset, variantName, variant, calibration, modelHeadingOffset, container, wrapper: attached.wrapper, roots: attached.roots, animation, collision, visualIntegration: attached.visualIntegration, anchor, loadedAt: Date.now() };
      records.set(options.slot, record);
      hideProceduralFallback(anchor);
      animation.transition('idle', { restart: true });
      attempt.ok = true;
      attempt.durationMs = Date.now() - attempt.startedAt;
      return record;
    } catch (error) {
      attempt.ok = false;
      attempt.reason = String(error?.message || error || 'load-failed');
      attempt.durationMs = Date.now() - attempt.startedAt;
      throw error;
    }
  };

  const loadAssetWithFallback = async (assetId, anchor, options) => {
    const asset = getEonCityW649Character(assetId);
    if (!asset || !anchor) throw new Error(`w649-asset-or-anchor-missing:${assetId}`);
    const selection = resolveEonCityW649AssetVariant(asset, capabilities);
    const order = selection.variant === 'primary' ? ['primary', 'fallback'] : ['fallback'];
    let lastError = null;
    for (const variantName of order) {
      try { return await loadVariant(asset, variantName, anchor, options); }
    catch (error) {
      lastError = error;
      if (variantName === 'primary' && isMeshoptCspFailure(error)) {
        capabilities = freeze({ ...capabilities, meshoptDecoderReady: false });
      }
    }
    }
    throw lastError || new Error(`w649-load-failed:${assetId}`);
  };

  return freeze({
    async start() {
      if (disposed) return freeze({ ok: false, reason: 'w649-core-disposed' });
      const decoder = configureEonCityW649MeshoptDecoder();
      let webpTextureReady = false;
      try { webpTextureReady = await Promise.resolve(detectWebp()); } catch {}
      capabilities = freeze({ meshoptDecoderReady: decoder.configured, webpTextureReady: webpTextureReady === true, reducedData: quality === 'lite' || reducedMotion === true });
      onStatus?.('Loading the W649 controllable core from local content-hashed assets.');
      let player = null;
      try {
        player = await loadAssetWithFallback(PLAYER_PRIMARY_ID, playerAnchor, { slot: 'player', targetHeight: 1.86, collisionHeight: 1.82, collisionRadius: 0.34 });
        playerAssetId = PLAYER_PRIMARY_ID;
      } catch {
        try {
          player = await loadAssetWithFallback(PLAYER_SECONDARY_ID, playerAnchor, { slot: 'player', targetHeight: 1.86, collisionHeight: 1.82, collisionRadius: 0.34 });
          playerAssetId = PLAYER_SECONDARY_ID;
        } catch {
          showProceduralFallback(playerAnchor);
        }
      }
      let eonbot = null;
      try {
        eonbot = await loadAssetWithFallback(EONBOT_ID, eonbotAnchor, { slot: 'eonbot', targetHeight: 0.74, collisionHeight: 0.7, collisionRadius: 0.38, rotationY: 0 });
      } catch {
        showProceduralFallback(eonbotAnchor);
      }
      const ok = Boolean(player);
      onStatus?.(ok
        ? `W649 Pathfinder ${playerAssetId === PLAYER_PRIMARY_ID ? 'Prime' : 'A fallback'} is controllable; ${eonbot ? 'EONBOT art is active' : 'procedural EONBOT remains active'}. Visual/deformation approval is still pending.`
        : 'W649 player candidates could not load; the proven procedural Wayfinder remains active.');
      return freeze({ ok, playerLoaded: Boolean(player), eonbotLoaded: Boolean(eonbot), playerAssetId, summary: this.getSummary() });
    },
    update({ playerState = 'idle' } = {}) {
      if (disposed) return false;
      const player = records.get('player');
      const eonbot = records.get('eonbot');
      if (player) {
        const requestedState = normalizeState(playerState);
        const transition = player.animation.transition(requestedState);
        // W671 owner repair: a missing optional gesture/alternate clip must
        // never leave Pathfinder frozen in the previous walk/run state.
        if (transition?.ok !== true && requestedState !== 'idle') {
          player.animation.transition('idle', { restart: true });
        }
        player.animation.stabilize();
        disableSupersededAnchorChildren(player.anchor, player.wrapper, player.collision);
      }
      if (eonbot) disableSupersededAnchorChildren(eonbot.anchor, eonbot.wrapper, eonbot.collision);
      return Boolean(player || eonbot);
    },
    requestPlayerState(state = 'idle', options = {}) {
      const player = records.get('player');
      return player?.animation?.transition?.(state, options) || freeze({ ok: false, reason: 'w649-player-not-loaded' });
    },
    getResidencySummary() {
      const describe = (slot) => {
        const record = records.get(slot);
        return freeze({
          loaded: Boolean(record),
          assetId: record?.asset?.id || null,
          variant: record?.variantName || null,
          bytes: Number(record?.variant?.bytes || 0)
        });
      };
      const player = describe('player');
      const eonbot = describe('eonbot');
      return freeze({
        schema: `${EON_CITY_W649_BABYLON_CORE_SCHEMA}.residency.v1`,
        quality,
        player,
        eonbot,
        loadedBytes: player.bytes + eonbot.bytes,
        localOnly: true,
        disposed
      });
    },
    getSummary() {
      const describe = (slot) => {
        const record = records.get(slot);
        return freeze({
          loaded: Boolean(record),
          assetId: record?.asset?.id || null,
          variant: record?.variantName || null,
          path: record?.variant?.path || null,
          bytes: record?.variant?.bytes || 0,
          animation: record?.animation?.getSummary?.() || null,
          calibration: record?.calibration || null,
          modelHeadingOffset: Number(record?.modelHeadingOffset || 0),
          collision: record?.collision?.metadata || null,
          visualIntegration: record?.visualIntegration?.getSummary?.() || null
        });
      };
      const player = describe('player');
      const eonbot = describe('eonbot');
      return freeze({
        schema: EON_CITY_W649_BABYLON_CORE_SCHEMA,
        quality,
        reducedMotion: Boolean(reducedMotion),
        capabilities,
        localMeshoptDecoder: EON_CITY_W649_LOCAL_MESHOPT_DECODER,
        player,
        eonbot,
        loadedBytes: player.bytes + eonbot.bytes,
        controllableCoreByteTarget: 1_887_437,
        withinControllableCoreTarget: player.loaded && (player.bytes + eonbot.bytes) <= 1_887_437,
        attempts: freeze(attempts.map((attempt) => freeze({ ...attempt }))),
        localOnly: true,
        remoteDecoder: false,
        rootMotionTrusted: false,
        anchorLockActive: player.loaded,
        visualCertificationPending: true,
        disposed
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort('w649-core-dispose');
      for (const record of records.values()) disposeRecord(record);
      records.clear();
      showProceduralFallback(playerAnchor);
      showProceduralFallback(eonbotAnchor);
    }
  });
}
