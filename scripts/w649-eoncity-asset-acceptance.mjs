import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader.js';
import { Logger } from '@babylonjs/core/Misc/logger.js';
import { Tools } from '@babylonjs/core/Misc/tools.js';
import { MeshoptCompression } from '@babylonjs/core/Meshes/Compression/meshoptCompression.js';
import '@babylonjs/loaders/glTF/index.js';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';
import { createEonCityW649BabylonCoreRuntime } from '../assets/js/city/w649/eon-city-w649-babylon-core-runtime.js';
import { createEonCityW649DistrictRuntime } from '../assets/js/city/w649/eon-city-w649-district-runtime.js';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BIN_CHUNK = 0x004e4942;
const LOAD_TIMEOUT_MS = 45_000;

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function canonicalNames(value = []) {
  return [...value].map((name) => String(name)).sort((left, right) => left.localeCompare(right));
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assetFile(root, publicPath) {
  return path.join(root, String(publicPath || '').replace(/^\//, ''));
}

function countPrimitives(gltf) {
  return (gltf.meshes || []).reduce((total, mesh) => total + (mesh.primitives || []).length, 0);
}

function countJoints(gltf) {
  return (gltf.skins || []).reduce((total, skin) => total + (skin.joints || []).length, 0);
}

function primitiveSignature(gltf) {
  return (gltf.meshes || []).map((mesh) => (mesh.primitives || []).map((primitive) => ({
    mode: primitive.mode ?? 4,
    attributes: Object.keys(primitive.attributes || {}).sort(),
    hasIndices: Number.isInteger(primitive.indices),
    morphTargetCount: (primitive.targets || []).length
  })));
}

export function parseW649Glb(buffer, label = 'asset.glb') {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) throw new TypeError(`${label}: expected binary data`);
  const bytes = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (bytes.length < 20) throw new Error(`${label}: GLB is too short`);
  if (bytes.toString('ascii', 0, 4) !== 'glTF') throw new Error(`${label}: invalid GLB magic`);
  const version = bytes.readUInt32LE(4);
  const declaredLength = bytes.readUInt32LE(8);
  if (version !== 2) throw new Error(`${label}: expected GLB v2, received v${version}`);
  if (declaredLength !== bytes.length) throw new Error(`${label}: declared length ${declaredLength} does not match ${bytes.length}`);

  const chunks = [];
  let json = null;
  let offset = 12;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw new Error(`${label}: truncated chunk header at ${offset}`);
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + length;
    if (end > bytes.length) throw new Error(`${label}: chunk overruns file at ${offset}`);
    chunks.push({ type, length });
    if (type === GLB_JSON_CHUNK) {
      if (json) throw new Error(`${label}: duplicate JSON chunk`);
      const text = bytes.toString('utf8', start, end).replace(/[\u0000\u0020]+$/g, '');
      json = JSON.parse(text);
    }
    offset = end;
  }
  if (offset !== bytes.length) throw new Error(`${label}: invalid final chunk boundary`);
  if (!json) throw new Error(`${label}: missing JSON chunk`);
  if (!chunks.some((chunk) => chunk.type === GLB_BIN_CHUNK)) throw new Error(`${label}: missing BIN chunk`);

  const animationNames = (json.animations || []).map((animation, index) => String(animation.name || `animation-${index}`));
  const extensionsUsed = [...(json.extensionsUsed || [])].sort();
  const extensionsRequired = [...(json.extensionsRequired || [])].sort();
  const imageMimeTypes = (json.images || []).map((image) => String(image.mimeType || ''));

  return {
    version,
    declaredLength,
    chunks,
    json,
    signature: {
      scenes: (json.scenes || []).length,
      nodes: (json.nodes || []).length,
      meshes: (json.meshes || []).length,
      primitives: countPrimitives(json),
      skins: (json.skins || []).length,
      joints: countJoints(json),
      animations: (json.animations || []).length,
      animationNames,
      materials: (json.materials || []).length,
      textures: (json.textures || []).length,
      images: (json.images || []).length,
      imageMimeTypes,
      primitiveSignature: primitiveSignature(json),
      extensionsUsed,
      extensionsRequired
    }
  };
}

function recordError(errors, scope, message) {
  errors.push({ scope, message: String(message) });
}

function getGitCommit(root) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function validateStaticEntry({ root, entry, errors }) {
  const scope = `${entry.id}:${entry.variant}`;
  const filePath = assetFile(root, entry.path);
  if (!fs.existsSync(filePath)) {
    recordError(errors, scope, `missing file ${entry.path}`);
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  const digest = sha256(buffer);
  const fileNameDigest = path.basename(filePath).match(/\.([a-f0-9]{12})\.glb$/i)?.[1]?.toLowerCase() || null;
  if (buffer.length !== entry.bytes) recordError(errors, scope, `byte count ${buffer.length} does not match ${entry.bytes}`);
  if (digest !== entry.sha256) recordError(errors, scope, `SHA-256 ${digest} does not match manifest`);
  if (entry.integrity !== `sha256-${entry.sha256}`) recordError(errors, scope, 'integrity field does not match SHA-256');
  if (fileNameDigest !== digest.slice(0, 12)) recordError(errors, scope, 'content-hash filename prefix does not match file SHA-256');

  let parsed;
  try {
    parsed = parseW649Glb(buffer, entry.path);
  } catch (error) {
    recordError(errors, scope, error?.message || error);
    return null;
  }
  const signature = parsed.signature;
  if (signature.skins !== entry.skins) recordError(errors, scope, `skin count ${signature.skins} does not match ${entry.skins}`);
  if (signature.animations !== entry.animations) recordError(errors, scope, `animation count ${signature.animations} does not match ${entry.animations}`);
  if (!sameJson(signature.animationNames, entry.animationNames)) recordError(errors, scope, 'animation names/order do not match intake receipt');
  if (!signature.extensionsUsed.includes('EXT_texture_webp')) recordError(errors, scope, 'EXT_texture_webp is not declared');
  if (!signature.extensionsRequired.includes('EXT_texture_webp')) recordError(errors, scope, 'EXT_texture_webp is not required');
  if (signature.images > 0 && signature.imageMimeTypes.some((mimeType) => mimeType !== 'image/webp')) recordError(errors, scope, 'non-WebP embedded image detected');
  if (entry.variant === 'primary') {
    if (!signature.extensionsUsed.includes('EXT_meshopt_compression')) recordError(errors, scope, 'primary asset is missing EXT_meshopt_compression');
    if (!signature.extensionsRequired.includes('EXT_meshopt_compression')) recordError(errors, scope, 'primary asset does not require EXT_meshopt_compression');
  } else if (signature.extensionsUsed.includes('EXT_meshopt_compression') || signature.extensionsRequired.includes('EXT_meshopt_compression')) {
    recordError(errors, scope, 'decoder-free fallback still declares EXT_meshopt_compression');
  }

  return {
    id: entry.id,
    variant: entry.variant,
    lifecycle: entry.lifecycle,
    path: entry.path,
    bytes: buffer.length,
    sha256: digest,
    signature
  };
}

function validatePair(primary, fallback, errors) {
  const scope = `${primary?.id || fallback?.id || 'unknown'}:pair`;
  if (!primary || !fallback) {
    recordError(errors, scope, 'primary/fallback pair is incomplete');
    return;
  }
  const comparableKeys = ['scenes', 'nodes', 'meshes', 'primitives', 'skins', 'joints', 'animations', 'animationNames', 'primitiveSignature'];
  for (const key of comparableKeys) {
    if (!sameJson(primary.signature[key], fallback.signature[key])) {
      recordError(errors, scope, `primary/fallback ${key} mismatch`);
    }
  }
}

export function auditW649StaticLibrary({ root = DEFAULT_ROOT, intake } = {}) {
  const resolvedIntake = intake || JSON.parse(fs.readFileSync(path.join(root, 'config/w649-eoncity-asset-intake.json'), 'utf8'));
  const errors = [];
  const entries = [];
  const pairs = new Map();
  for (const entry of resolvedIntake.entries || []) {
    const result = validateStaticEntry({ root, entry, errors });
    if (!result) continue;
    entries.push(result);
    if (!pairs.has(entry.id)) pairs.set(entry.id, {});
    pairs.get(entry.id)[entry.variant] = result;
  }
  for (const pair of pairs.values()) validatePair(pair.primary, pair.fallback, errors);

  const activeManifestIds = new Set([
    ...EON_CITY_W649_CHARACTER_MANIFEST.entries,
    ...EON_CITY_W649_WORLD_MANIFEST.entries
  ].map((entry) => entry.id));
  const activeIntakeIds = new Set((resolvedIntake.entries || []).filter((entry) => entry.lifecycle === 'active').map((entry) => entry.id));
  if (!sameJson([...activeManifestIds].sort(), [...activeIntakeIds].sort())) recordError(errors, 'manifest', 'active runtime manifests do not match active intake IDs');
  if ((resolvedIntake.entries || []).length !== resolvedIntake.assetCount) recordError(errors, 'intake', 'assetCount does not match entries length');
  if (pairs.size !== resolvedIntake.logicalAssetCount) recordError(errors, 'intake', 'logicalAssetCount does not match pair count');
  if (activeIntakeIds.size !== resolvedIntake.activeLogicalAssetCount) recordError(errors, 'intake', 'activeLogicalAssetCount does not match active IDs');

  return {
    ok: errors.length === 0,
    errors,
    intake: resolvedIntake,
    entries,
    pairs: [...pairs.entries()].map(([id, pair]) => ({ id, primary: pair.primary, fallback: pair.fallback }))
  };
}

async function withTimeout(promise, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label}: Babylon load exceeded ${LOAD_TIMEOUT_MS}ms`)), LOAD_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function configureLocalMeshopt(root) {
  const decoderPath = path.join(root, 'assets/vendor/babylon/meshopt_decoder.js');
  if (!globalThis.MeshoptDecoder?.ready) {
    const source = `${fs.readFileSync(decoderPath, 'utf8')}\n;globalThis.MeshoptDecoder = MeshoptDecoder;`;
    vm.runInThisContext(source, { filename: decoderPath });
  }
  if (!globalThis.MeshoptDecoder?.supported) throw new Error('local Meshopt decoder reports unsupported');
  await globalThis.MeshoptDecoder.ready;
  globalThis.MeshoptDecoder.useWorkers = () => {};
  Tools.LoadBabylonScriptAsync = async () => {};
  MeshoptCompression.Configuration = { decoder: { url: decoderPath } };
  MeshoptCompression._Default = null;
  return decoderPath;
}

async function loadEntryWithBabylon({ root, entry, engine }) {
  const startedAt = performance.now();
  const scene = new Scene(engine);
  let container = null;
  try {
    const data = new Uint8Array(fs.readFileSync(assetFile(root, entry.path)));
    container = await withTimeout(LoadAssetContainerAsync(data, scene, {
      pluginExtension: '.glb',
      name: path.basename(entry.path),
      pluginOptions: { gltf: { skipMaterials: true } }
    }), `${entry.id}:${entry.variant}`);
    const animationNames = (container.animationGroups || []).map((group) => String(group.name));
    const result = {
      id: entry.id,
      variant: entry.variant,
      path: entry.path,
      loaded: true,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      meshes: (container.meshes || []).length,
      transformNodes: (container.transformNodes || []).length,
      skeletons: (container.skeletons || []).length,
      animationGroups: animationNames
    };
    if (result.meshes < 1) throw new Error('Babylon returned no meshes');
    if (result.skeletons !== entry.skins) throw new Error(`Babylon skeleton count ${result.skeletons} does not match ${entry.skins}`);
    if (!sameJson(animationNames, entry.animationNames)) throw new Error('Babylon animation groups do not match intake receipt');
    return result;
  } finally {
    try { container?.dispose?.(); } catch {}
    try { scene.dispose(); } catch {}
  }
}

export async function auditW649BabylonLoads({ root = DEFAULT_ROOT, intake } = {}) {
  const resolvedIntake = intake || JSON.parse(fs.readFileSync(path.join(root, 'config/w649-eoncity-asset-intake.json'), 'utf8'));
  const errors = [];
  const results = [];
  Logger.LogLevels = Logger.NoneLogLevel;
  const decoderPath = await configureLocalMeshopt(root);
  const engine = new NullEngine({ renderWidth: 64, renderHeight: 64, deterministicLockstep: true, lockstepMaxSteps: 1 });
  try {
    for (const entry of resolvedIntake.entries || []) {
      try {
        results.push(await loadEntryWithBabylon({ root, entry, engine }));
      } catch (error) {
        recordError(errors, `${entry.id}:${entry.variant}`, error?.message || error);
        results.push({ id: entry.id, variant: entry.variant, path: entry.path, loaded: false, reason: String(error?.message || error) });
      }
    }
  } finally {
    try { engine.dispose(); } catch {}
  }
  return { ok: errors.length === 0, errors, decoderPath: path.relative(root, decoderPath).replaceAll(path.sep, '/'), results };
}

function finiteTransform(node) {
  const values = [
    node?.position?.x, node?.position?.y, node?.position?.z,
    node?.rotation?.x, node?.rotation?.y, node?.rotation?.z,
    node?.scaling?.x, node?.scaling?.y, node?.scaling?.z
  ];
  return values.every(Number.isFinite) && Number(node?.scaling?.x) > 0 && Number(node?.scaling?.y) > 0 && Number(node?.scaling?.z) > 0;
}

function runtimeSceneSnapshot(scene, districtId = null) {
  const districtRoots = (scene.transformNodes || []).filter((node) => node?.metadata?.kind === 'w649-district-root');
  const districtAssets = (scene.transformNodes || []).filter((node) => node?.metadata?.kind === 'w649-district-asset');
  const coreAssets = (scene.transformNodes || []).filter((node) => node?.metadata?.kind === 'w649-loaded-asset-root');
  const collisionCapsules = (scene.meshes || []).filter((mesh) => mesh?.metadata?.kind === 'w649-collision-capsule');
  return {
    districtId,
    meshes: (scene.meshes || []).length,
    transformNodes: (scene.transformNodes || []).length,
    skeletons: (scene.skeletons || []).length,
    animationGroups: (scene.animationGroups || []).length,
    districtRootIds: districtRoots.map((node) => node.metadata?.districtId || null),
    districtAssetIds: districtAssets.map((node) => node.metadata?.assetId || null),
    coreAssetIds: coreAssets.map((node) => node.metadata?.id || null),
    collisionCapsules: collisionCapsules.map((mesh) => mesh.metadata?.id || null),
    finiteDistrictTransforms: districtAssets.every(finiteTransform),
    finiteCoreTransforms: coreAssets.every(finiteTransform)
  };
}

export async function auditW649RealRuntimeIntegration({ root = DEFAULT_ROOT } = {}) {
  const errors = [];
  const transitions = [];
  Logger.LogLevels = Logger.NoneLogLevel;
  await configureLocalMeshopt(root);
  const engine = new NullEngine({ renderWidth: 128, renderHeight: 128, deterministicLockstep: true, lockstepMaxSteps: 1 });
  const scene = new Scene(engine);
  const playerAnchor = new TransformNode('w649-acceptance-player-anchor', scene);
  const eonbotAnchor = new TransformNode('w649-acceptance-eonbot-anchor', scene);
  const loadContainer = async ({ path: publicPath, signal }) => {
    if (signal?.aborted) throw new Error('w649-acceptance-load-aborted');
    const data = new Uint8Array(fs.readFileSync(assetFile(root, publicPath)));
    const container = await withTimeout(LoadAssetContainerAsync(data, scene, {
      pluginExtension: '.glb',
      name: path.basename(publicPath),
      pluginOptions: { gltf: { skipMaterials: true } }
    }), publicPath);
    if (signal?.aborted) {
      container.dispose();
      throw new Error('w649-acceptance-load-aborted');
    }
    return container;
  };
  const core = createEonCityW649BabylonCoreRuntime({
    scene,
    playerAnchor,
    eonbotAnchor,
    quality: 'balanced',
    reducedMotion: false,
    loadContainer,
    detectWebp: async () => true
  });
  const district = createEonCityW649DistrictRuntime({
    scene,
    quality: 'balanced',
    reducedMotion: false,
    capabilities: { meshoptDecoderReady: true, webpTextureReady: true, reducedData: false },
    loadContainer
  });
  let coreStart = null;
  try {
    coreStart = await core.start();
    const coreSummary = core.getSummary();
    if (!coreStart?.ok || !coreSummary.player.loaded) recordError(errors, 'runtime:core', 'Pathfinder did not load into the real core runtime');
    if (coreSummary.player.assetId !== 'eoncity-pathfinder-prime-11clips') recordError(errors, 'runtime:core', `unexpected player ${coreSummary.player.assetId}`);
    if (coreSummary.player.variant !== 'primary' || coreSummary.eonbot.variant !== 'primary') recordError(errors, 'runtime:core', 'real runtime did not select primary Meshopt variants');
    if (!coreSummary.withinControllableCoreTarget) recordError(errors, 'runtime:core', 'controllable core exceeds its byte target');
    for (const state of ['idle', 'walk', 'run', 'wave', 'interact']) {
      const result = core.requestPlayerState(state, { restart: true, durationMs: 120 });
      if (!result?.ok) recordError(errors, `runtime:player:${state}`, result?.reason || 'state transition failed');
      core.update({ playerState: state });
    }
    const afterCore = runtimeSceneSnapshot(scene, 'bootstrap');
    if (afterCore.coreAssetIds.length !== 2 || !afterCore.finiteCoreTransforms) recordError(errors, 'runtime:core', 'core wrapper attachment/normalization is invalid');
    if (afterCore.collisionCapsules.length !== 2) recordError(errors, 'runtime:core', 'core collision capsule count is not two');

    const districtIds = EON_CITY_W649_DISTRICT_MANIFEST.districts.map((entry) => entry.id).filter((id) => id !== 'bootstrap');
    const npcProbes = {
      'orientation-hall': ['eoncity-eon-architect-12clips', 'talk'],
      'creator-atrium': ['eoncity-civilian-creator-13clips', 'talk'],
      'forge-basilica': ['eon-x1-worker-9clips', 'interact'],
      'archive-canopy': ['eoncity-navigator-archive-vault-6clips', 'talk'],
      'vault-station': ['eoncity-vault-steward-6clips', 'talk'],
      'trade-dome': ['eoncity-creator-trade-6clips', 'talk'],
      'agent-theatre': ['eoncity-holo-interface-operator-6clips', 'talk']
    };
    for (const districtId of districtIds) {
      const result = districtId === 'orientation-hall'
        ? await district.start()
        : await district.enterDistrict(districtId, { reason: 'w649-real-runtime-acceptance' });
      const summary = district.getSummary();
      const sceneSnapshot = runtimeSceneSnapshot(scene, districtId);
      transitions.push({ districtId, result, summary, scene: sceneSnapshot });
      if (!result?.ok) recordError(errors, `runtime:district:${districtId}`, result?.reason || 'district load failed');
      if (summary.activeDistrictId !== districtId || summary.residentDistrictCount !== 1) recordError(errors, `runtime:district:${districtId}`, 'district residency is not exactly one');
      if (summary.loadedAssetCount !== result.loadedCount || result.loadedCount < 1) recordError(errors, `runtime:district:${districtId}`, 'loaded asset accounting mismatch');
      if (!summary.actionsValidated) recordError(errors, `runtime:district:${districtId}`, 'district action bindings are invalid');
      if (sceneSnapshot.districtRootIds.length !== 1 || sceneSnapshot.districtRootIds[0] !== districtId) recordError(errors, `runtime:district:${districtId}`, 'stale or missing district root after transition');
      if (sceneSnapshot.districtAssetIds.length !== result.loadedCount || !sceneSnapshot.finiteDistrictTransforms) recordError(errors, `runtime:district:${districtId}`, 'district wrappers are missing or have invalid transforms');
      const probe = npcProbes[districtId];
      if (probe) {
        const [assetId, state] = probe;
        const animation = district.requestNpcState(assetId, state, { restart: true, durationMs: 120 });
        if (!animation?.ok) recordError(errors, `runtime:npc:${districtId}:${assetId}:${state}`, animation?.reason || 'NPC state transition failed');
      }
    }
  } catch (error) {
    recordError(errors, 'runtime', error?.stack || error?.message || error);
  } finally {
    try { district.dispose(); } catch {}
    try { core.dispose(); } catch {}
  }
  const afterDispose = runtimeSceneSnapshot(scene, 'disposed');
  if (afterDispose.districtRootIds.length || afterDispose.districtAssetIds.length || afterDispose.coreAssetIds.length || afterDispose.collisionCapsules.length) {
    recordError(errors, 'runtime:dispose', 'W649 runtime assets remain attached after disposal');
  }
  try { playerAnchor.dispose(); } catch {}
  try { eonbotAnchor.dispose(); } catch {}
  try { scene.dispose(); } catch {}
  try { engine.dispose(); } catch {}
  return {
    ok: errors.length === 0,
    errors,
    coreStart,
    transitions,
    afterDispose
  };
}

export async function runW649AssetAcceptance({ root = DEFAULT_ROOT, reportPath } = {}) {
  const startedAt = performance.now();
  const staticAudit = auditW649StaticLibrary({ root });
  let babylonAudit = { ok: false, errors: [{ scope: 'babylon', message: 'Babylon audit was not run' }], results: [] };
  if (staticAudit.ok) {
    try {
      babylonAudit = await auditW649BabylonLoads({ root, intake: staticAudit.intake });
    } catch (error) {
      babylonAudit = { ok: false, errors: [{ scope: 'babylon', message: String(error?.message || error) }], results: [] };
    }
  }
  let runtimeAudit = { ok: false, errors: [{ scope: 'runtime', message: 'Real runtime audit was not run' }], transitions: [] };
  if (staticAudit.ok && babylonAudit.ok) {
    try { runtimeAudit = await auditW649RealRuntimeIntegration({ root }); }
    catch (error) { runtimeAudit = { ok: false, errors: [{ scope: 'runtime', message: String(error?.message || error) }], transitions: [] }; }
  }
  const allErrors = [...staticAudit.errors, ...babylonAudit.errors, ...runtimeAudit.errors];
  const logicalIds = new Set((staticAudit.intake.entries || []).map((entry) => entry.id));
  const activeIds = new Set((staticAudit.intake.entries || []).filter((entry) => entry.lifecycle === 'active').map((entry) => entry.id));
  const primaryLoads = babylonAudit.results.filter((entry) => entry.variant === 'primary' && entry.loaded).length;
  const fallbackLoads = babylonAudit.results.filter((entry) => entry.variant === 'fallback' && entry.loaded).length;
  const report = {
    schema: 'eon.city.w649.asset-acceptance.v1',
    generatedAt: new Date().toISOString(),
    sourceCommit: getGitCommit(root),
    ok: allErrors.length === 0,
    truthBoundary: {
      proves: [
        'all immutable W649 GLBs match their content hashes and intake metadata',
        'primary and fallback GLBs retain matching scene, rig, primitive, and animation structure',
        'all primary Meshopt and decoder-free fallback binaries load through Babylon.js 9.7.0',
        'animation groups and skeleton counts match the source-controlled intake receipt',
        'every loaded Babylon asset container can be disposed without aborting the gate'
      ],
      doesNotProve: [
        'visual quality, material appearance, lighting, or WebP raster decoding in a real browser',
        'deformation quality, clipping, foot sliding, scale, placement, collision feel, or camera composition',
        'real Google authentication, Cloudflare Preview behavior, real-device FPS, memory, or context-loss recovery',
        'owner approval of Pathfinder Prime versus Pathfinder A'
      ],
      materialPolicy: 'Babylon loading skips material creation so the gate remains deterministic in NullEngine; GLB metadata separately requires embedded WebP textures.'
    },
    summary: {
      logicalAssets: logicalIds.size,
      activeLogicalAssets: activeIds.size,
      inactiveLogicalAssets: logicalIds.size - activeIds.size,
      immutableBinaries: (staticAudit.intake.entries || []).length,
      staticValidatedBinaries: staticAudit.entries.length,
      babylonLoadedBinaries: babylonAudit.results.filter((entry) => entry.loaded).length,
      primaryBabylonLoads: primaryLoads,
      fallbackBabylonLoads: fallbackLoads,
      meshoptPrimaries: staticAudit.entries.filter((entry) => entry.variant === 'primary' && entry.signature.extensionsRequired.includes('EXT_meshopt_compression')).length,
      decoderFreeFallbacks: staticAudit.entries.filter((entry) => entry.variant === 'fallback' && !entry.signature.extensionsUsed.includes('EXT_meshopt_compression')).length,
      webpBinaries: staticAudit.entries.filter((entry) => entry.signature.extensionsRequired.includes('EXT_texture_webp')).length,
      realRuntimeDistrictTransitions: runtimeAudit.transitions.filter((entry) => entry.result?.ok).length,
      realRuntimeDisposeClean: runtimeAudit.afterDispose ? runtimeAudit.afterDispose.districtAssetIds.length === 0 && runtimeAudit.afterDispose.coreAssetIds.length === 0 : false,
      elapsedMs: Math.round((performance.now() - startedAt) * 100) / 100,
      errorCount: allErrors.length
    },
    errors: allErrors,
    staticEntries: staticAudit.entries,
    babylonLoads: babylonAudit.results,
    realRuntime: runtimeAudit
  };
  const resolvedReportPath = reportPath || path.join(root, 'reports/w649/W649_ASSET_ACCEPTANCE_RECEIPT_2026-07-14.json');
  fs.mkdirSync(path.dirname(resolvedReportPath), { recursive: true });
  fs.writeFileSync(resolvedReportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { report, reportPath: resolvedReportPath };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH;
if (isCli) {
  const reportArgIndex = process.argv.indexOf('--report');
  const reportPath = reportArgIndex >= 0 && process.argv[reportArgIndex + 1]
    ? path.resolve(process.argv[reportArgIndex + 1])
    : undefined;
  const { report, reportPath: writtenPath } = await runW649AssetAcceptance({ reportPath });
  const relativeReport = path.relative(DEFAULT_ROOT, writtenPath).replaceAll(path.sep, '/');
  console.log(JSON.stringify({ ok: report.ok, summary: report.summary, report: relativeReport, errors: report.errors }, null, 2));
  if (!report.ok) process.exitCode = 1;
}
