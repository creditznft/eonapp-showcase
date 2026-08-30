/**
 * W249 base scene / W366 Neon Command District vertical slice.
 *
 * The district currently uses original source-controlled procedural geometry
 * while W365-reviewed binary art remains intentionally unshipped. It ships no
 * remote assets, telemetry, copied art, combat, economy, wallet, reward, or
 * app-action execution.
 */
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { PBRMetallicRoughnessMaterial } from '@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { CITY_PLAY_NEON_COMMAND_PALETTE, getCityPlayArtBudget } from './eon-city-play-art-direction.js';
import { CITY_LANDMARKS } from './city-landmark-registry.js';
import { getEonUniverseCityInteractions, getEonUniverseRenderProfile } from './eon-universe-world-grammar.js';
import { getAgentPresenceCollaboration, getAgentPresenceOutcome } from '../operator/agent-presence.js';
import { resolveCityAgentVisual } from './eon-city-agent-director.js';
import { createCityAssetRuntime } from './eon-city-asset-runtime.js';
import { createEonCityOriginalRigRuntime } from './eon-city-original-rig-runtime.js';
import { createEonCityW649BabylonCoreRuntime } from './w649/eon-city-w649-babylon-core-runtime.js';
import { createEonCityW649DistrictRuntime, getEonCityW649DistrictCollisionVolumes } from './w649/eon-city-w649-district-runtime.js';
import { createEonCityOriginalSceneArtRuntime } from './eon-city-original-scene-art-runtime.js';
import { createEonCityCharacterMotionDirector } from './eon-city-character-motion-director.js';
import { createEonCityCompanionDirector, EON_CITY_COMPANION_MODES } from './eon-city-companion-director.js';
import { getCityMaterialPolicySummary } from './eon-city-material-policy.js';
import { getCityArtIntakeSummary } from './eon-city-art-intake.js';
import { EON_COMMAND_DISTRICT_NPC_ROLES, getCommandDistrictSceneBlueprint } from './eon-city-command-district.js';
import { EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT } from './eon-city-arrival-district.js';
import { EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT } from './eon-city-creator-forge-district.js';
import { EON_CITY_LIVING_SYSTEMS_BLUEPRINT, getCityLivingSystemsProfile } from './eon-city-living-systems.js';
import { EON_CITY_METROPOLIS_DISTRICTS, getMetropolisDistrict } from './eon-city-metropolis-districts.js';
import { EON_CITY_PROCEDURAL_RENDERER_PROFILE } from './eon-city-procedural-renderer-profile.js';
import { createCityVectorArtRuntime } from './eon-city-vector-art-runtime.js';
import { getCityVectorArtSummary } from './eon-city-vector-art-kit.js';
import { getCityCinematicArtDirection } from './eon-city-cinematic-art-direction.js';
import { getCityArtReviewSummary, getCityCinematicShot } from './eon-city-art-review.js';
import { getCityDeepArtPlacementPlan, getCityDeepArtSurface, getCityDeepArtDirectionSummary } from './eon-city-deep-art-direction.js';
import { getCityAssetDesignKitSummary } from './eon-city-asset-design-kit.js';
import { getCityVisualProgressionPlan } from './eon-city-visual-progression.js';
import { getCityAuthoredVerticalSlicePlan, getCityAuthoredVerticalSliceRegion, getCityAuthoredVerticalSliceSummary } from './eon-city-authored-vertical-slice.js';
import { createCityQualityGovernor } from './eon-city-quality-governor.js';
import { createEonNoirLandmark, createEonNoirWorldDetailLayer, createEonNoirWorldLayer, getEonNoirArchitectureSummary } from './eon-city-noir-architecture.js';
import { createCityEngineStageQueue } from './eon-city-engine-staging.js';
import { createCityPerformanceObservation } from './eon-city-performance-observation.js';
import { createEonNoirGuideNpc, getEonNoirNpcKitSummary } from './eon-city-noir-npc-kit.js';
import { captureEonCityExplorationPose, normalizeEonCityExplorationPose } from './eon-city-exploration-pose.js';
import { createEonCityPointerLook, createEonCityStaticCollisionVolumes, resolveEonCityThirdPersonPosition } from './eon-city-third-person-controller.js';
import { createEonCityLandmarkFocusState } from './eon-city-landmark-focus.js';
import { EON_CITY_CONTROL_CONVENTION, describeEonCityLandmarkApproach, resolveEonCityCameraRelativeMove, resolveEonCityInputIntent } from './eon-city-gameplay-contract.js';
import { createEonCityCameraOcclusionController, isEonCityCameraOccluder } from './eon-city-camera-occlusion.js';
import { getEonWorkloadGovernor } from '../runtime/eon-workload-governor.js';
import { createEonCityEonbotCompanionPlan } from './eon-city-eonbot-companion.js';
import { createEonCityEonbotRigPlan } from './eon-city-eonbot-rig.js';
import { createEonCityW679EonbotCuriosityController } from './w679/eon-city-w679-eonbot-curiosity.js';
import { EON_CITY_EONBOT_ORBIT_STATES, getEonCityEonbotOrbitPresentation } from './eon-city-eonbot-orbit-experience.js';
import { getEonCitySelectedCompanionSkinId } from './eon-city-vault-reveals.js';
import { getEonCityCommandHorizonStreetKitPlan } from './eon-city-command-horizon-street-kit.js';
import { createEonCityCellResidencyController } from './eon-city-cell-streamer.js';
import { createEonCityLivingNexusBabylonRuntime, EON_CITY_LIVING_NEXUS_ENTRY_POSES, EON_CITY_LIVING_NEXUS_WORLD_BOUND } from './eon-city-living-nexus-babylon-runtime.js';
import { resolveEonCityW712GatewayApproachTarget } from './w712/eon-city-w712-flagship-expanse-entry.js';
import { resolveEonCityW719ArrivalCamera } from './w719/eon-city-w719-arrival-camera.js';
import { resolveEonCityW719KeyboardCode, resolveEonCityW719MovementDirection } from './w719/eon-city-w719-input-authority.js';
import { clampEonCityW719CorePoint, projectEonCityW719CoreWorldAuthority } from './w719/eon-city-w719-core-world-authority.js';
import { getEonCityAmbientNpcCrowdPlan } from './eon-city-npc-archetypes.js';
import { EON_CITY_COMMAND_DISTRICT_NPC_STATES, createEonCityCommandDistrictNpcController, getEonCityCommandDistrictNpcPlan } from './eon-city-command-district-npc-system.js';
import { getEonCitySeededAmbiencePlan } from './eon-city-seeded-ambience.js';
import { EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, getEonCityOpenSkyProfilePlan } from './eon-city-open-sky-profiles.js';
import { getEonCityArtBibleSummary } from './eon-city-art-bible.js';
import { EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES, EON_CITY_COMMAND_DISTRICT_PATHS, EON_CITY_COMMAND_DISTRICT_SPAWN, findEonCityCommandDistrictUnstuckPoint, getEonCityCommandDistrictInteractions, getEonCityCommandDistrictVerticalSlicePlan } from './eon-city-command-district-vertical-slice.js';
import { createEonCityWayfinderStateDirector, EON_CITY_WAYFINDER_CAMERA_PROFILES, EON_CITY_WAYFINDER_VISUAL_PROFILE, getEonCityWayfinderCameraProfile, resolveEonCityWayfinderCamera } from './eon-city-wayfinder-experience.js';

export const BABYLON_PLAY_SCENE_SCHEMA = 'eon.city.play.babylon-proof.v1';

const QUALITY = Object.freeze({
  lite: Object.freeze({ rain: 12, glow: 0.12, shadow: false, hardwareScaling: 1.42, playerSpeed: 4.2 }),
  balanced: Object.freeze({ rain: 36, glow: 0.34, shadow: false, hardwareScaling: 1.1, playerSpeed: 4.8 }),
  cinematic: Object.freeze({ rain: 76, glow: 0.62, shadow: true, hardwareScaling: 0.86, playerSpeed: 5.3 })
});

const LEGACY_CORE_WORLD_BOUND = 13;
const LIVING_NEXUS_WORLD_BOUND = EON_CITY_LIVING_NEXUS_WORLD_BOUND;
const GAMEPAD_DEAD_ZONE = 0.28;
const CLICK_MOVE_TAP_DISTANCE = 14;
const GAMEPAD_INTERACT_BUTTON = 0;
const GAMEPAD_CAMERA_RESET_BUTTON = 4;
const GAMEPAD_CAMERA_CYCLE_BUTTON = 5;
const CITY_BOOT_STAGE_TIMEOUT_MS = 10_000;

/**
 * W255: Play uses the same canonical landmark identities and actions as City
 * the canonical direct EON City route. Only landmarks with authored Immersive Work Mode coordinates render
 * in this first district; the remaining City markers stay discoverable in Lite.
 */
const CITY_PLAY_SOURCE_LANDMARKS = CITY_LANDMARKS.filter((landmark) => landmark.play && landmark.action);

/**
 * W552: The same canonical City registry remains the source of routes and
 * persistence identities. The EON Universe grammar contributes only local
 * presentation labels, visual styles and explicit interaction wording.
 */
const LEGACY_CITY_PLAY_LANDMARKS = getEonUniverseCityInteractions()
  .filter((interaction) => CITY_PLAY_SOURCE_LANDMARKS.some((landmark) => landmark.id === interaction.id))
  .filter((interaction) => !['workshop', 'archive'].includes(interaction.id))
  .map((interaction) => Object.freeze({
    id: interaction.id,
    label: interaction.title,
    sourceLabel: CITY_PLAY_SOURCE_LANDMARKS.find((landmark) => landmark.id === interaction.id)?.name || interaction.title,
    zone: interaction.zone,
    style: interaction.style,
    inspect: interaction.inspect,
    focusLabel: interaction.focusLabel,
    action: interaction.action,
    x: interaction.play.x,
    z: interaction.play.z,
    radius: interaction.play.radius
  }));

const W624C_COMMAND_DISTRICT_LANDMARKS = getEonCityCommandDistrictInteractions().map((interaction) => Object.freeze({
  id: interaction.id,
  label: interaction.title,
  sourceLabel: interaction.title,
  zone: interaction.zone,
  style: interaction.style,
  inspect: interaction.inspect,
  focusLabel: interaction.focusLabel,
  action: interaction.action,
  x: interaction.play.x,
  z: interaction.play.z,
  radius: interaction.play.radius
}));

export const CITY_PLAY_LANDMARKS = Object.freeze(W624C_COMMAND_DISTRICT_LANDMARKS.concat(LEGACY_CITY_PLAY_LANDMARKS));

function getPlayableLandmark(landmarkId = '') {
  return CITY_PLAY_LANDMARKS.find((landmark) => landmark.id === String(landmarkId || '')) || null;
}

function getNearestLandmark(position) {
  let candidate = null;
  for (const landmark of CITY_PLAY_LANDMARKS) {
    const distance = Math.hypot(position.x - landmark.x, position.z - landmark.z);
    if (distance > landmark.radius || (candidate && distance >= candidate.distance)) continue;
    candidate = Object.freeze({
      id: landmark.id,
      label: landmark.label,
      sourceLabel: landmark.sourceLabel,
      zone: landmark.zone,
      style: landmark.style,
      inspect: landmark.inspect,
      focusLabel: landmark.focusLabel,
      action: landmark.action,
      x: landmark.x,
      z: landmark.z,
      radius: landmark.radius,
      distance: Math.round(distance * 10) / 10
    });
  }
  return candidate;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function describeBootError(error) {
  const code = String(error?.code || '').trim() || 'unknown';
  const message = String(error?.message || error || '').trim() || 'unknown';
  return Object.freeze({ code, message: message.slice(0, 240) });
}

function recordCityBootStage(stage, detail = {}) {
  try {
    const label = String(stage || 'unknown').trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_') || 'UNKNOWN';
    console.info(`[CITY_BOOT_STAGE_${label}]`, {
      at: new Date().toISOString(),
      ...detail
    });
  } catch {}
}

function trackAsyncCityBootStage(stage, promise, detail = {}) {
  let settled = false;
  recordCityBootStage(`${stage}_START`, detail);
  const timeoutHandle = globalThis.setTimeout?.(() => {
    if (!settled) recordCityBootStage(`${stage}_TIMEOUT`, detail);
  }, CITY_BOOT_STAGE_TIMEOUT_MS) || null;
  return Promise.resolve(promise)
    .then((result) => {
      settled = true;
      if (timeoutHandle) globalThis.clearTimeout?.(timeoutHandle);
      recordCityBootStage(`${stage}_RESOLVED`, detail);
      return result;
    })
    .catch((error) => {
      settled = true;
      if (timeoutHandle) globalThis.clearTimeout?.(timeoutHandle);
      recordCityBootStage(`${stage}_REJECTED`, { ...detail, error: describeBootError(error) });
      throw error;
    });
}

function runCityBootStage(stage, action, detail = {}) {
  recordCityBootStage(`${stage}_START`, detail);
  try {
    const result = action();
    recordCityBootStage(`${stage}_DONE`, detail);
    return result;
  } catch (error) {
    recordCityBootStage(`${stage}_ERROR`, { ...detail, error: describeBootError(error) });
    throw error;
  }
}

function color(hex) {
  return Color3.FromHexString(hex);
}

const PALETTE = CITY_PLAY_NEON_COMMAND_PALETTE;

/**
 * Original procedural world surfaces use the same metal/roughness workflow as
 * the future reviewed GLB intake. Dynamic text panels stay on StandardMaterial
 * because they use local DynamicTexture surfaces, not world geometry.
 */
function makeMaterial(scene, name, { diffuse, emissive = null, intensity = 0, alpha = 1, metallic = 0.15, roughness = 0.62, baseTexture = null, emissiveTexture = null } = {}) {
  const material = new PBRMetallicRoughnessMaterial(name, scene);
  material.baseColor = color(diffuse || '#172033');
  material.emissiveColor = emissive ? color(emissive).scale(Math.max(0, intensity)) : Color3.Black();
  material.alpha = alpha;
  material.metallic = metallic;
  material.roughness = roughness;
  if (baseTexture) material.baseTexture = baseTexture;
  if (emissiveTexture) material.emissiveTexture = emissiveTexture;
  material.backFaceCulling = alpha >= 0.98;
  return material;
}

function makeDisplayMaterial(scene, name, texture) {
  const material = new StandardMaterial(name, scene);
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.opacityTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.backFaceCulling = false;
  return material;
}

/**
 * CITY-ENGINE: DynamicTexture allocation is a bounded local UI surface only.
 * A zero-size canvas or unavailable 2D context used to leak WebGL warnings and
 * make a display label look like a renderer failure. Callers may omit a label;
 * they must never fail the playable City core because one decorative panel fails.
 */
function createSafeDynamicTexture(scene, name, width, height, mipmaps = false) {
  const safeWidth = Math.max(64, Math.min(2048, Math.round(Number(width) || 0)));
  const safeHeight = Math.max(64, Math.min(2048, Math.round(Number(height) || 0)));
  if (!scene || !Number.isFinite(safeWidth) || !Number.isFinite(safeHeight)) return null;
  try {
    const texture = new DynamicTexture(String(name || 'eon-city-ui'), { width: safeWidth, height: safeHeight }, scene, Boolean(mipmaps));
    const context = texture.getContext?.();
    if (!context || typeof context.clearRect !== 'function') {
      texture.dispose?.();
      return null;
    }
    texture.hasAlpha = true;
    return texture;
  } catch {
    return null;
  }
}

function createVectorArtDecal(scene, vectorArt, { name, artId, position, width = 1.2, height = 1.2, billboard = false, rotation = null } = {}) {
  const texture = vectorArt?.getTexture?.(artId, { clamp: true, alpha: true });
  if (!texture) return null;
  const plane = MeshBuilder.CreatePlane(name, { width, height }, scene);
  plane.position.copyFrom(position);
  if (rotation) plane.rotation.copyFrom(rotation);
  if (billboard) plane.billboardMode = 2;
  plane.material = makeDisplayMaterial(scene, `${name}-material`, texture);
  plane.metadata = { kind: 'original-vector-art-decal', artId, localOnly: true, sameOrigin: true, remoteNetwork: false, finalBinaryArt: false };
  return plane;
}

function addVectorArtSkyline(scene, vectorArt, quality) {
  const texture = vectorArt?.getTexture?.('skyline-depth', { clamp: true });
  if (!texture) return null;
  const plane = MeshBuilder.CreatePlane('vector-art-skyline-depth', { width: 31, height: quality === 'cinematic' ? 11.7 : 9.6 }, scene);
  plane.position.set(0, quality === 'cinematic' ? 8.7 : 7.6, -14.88);
  plane.rotation.y = Math.PI;
  plane.material = makeDisplayMaterial(scene, 'vector-art-skyline-depth-material', texture);
  plane.metadata = { kind: 'original-vector-art-backdrop', artId: 'skyline-depth', localOnly: true, sameOrigin: true, remoteNetwork: false, finalBinaryArt: false };
  return plane;
}

function createVectorWayfinding(scene, vectorArt, id, x, z, artId, rotationZ = 0) {
  const texture = vectorArt?.getTexture?.(artId, { clamp: true, alpha: true });
  if (!texture) return null;
  const plane = MeshBuilder.CreatePlane(`vector-wayfinding-${id}`, { width: 1.3, height: 1.3 }, scene);
  plane.position.set(x, 0.062, z);
  plane.rotation.x = Math.PI / 2;
  plane.rotation.z = rotationZ;
  plane.material = makeDisplayMaterial(scene, `vector-wayfinding-${id}-material`, texture);
  plane.metadata = { kind: 'original-vector-wayfinding', artId, localOnly: true, sameOrigin: true, remoteNetwork: false };
  return plane;
}

function getDeepSurfaceTexture(vectorArt, surfaceId, options = {}, fallbackId = '') {
  const surface = getCityDeepArtSurface(surfaceId);
  const preferred = surface ? vectorArt?.getTexture?.(surface.artId, { uScale: surface.uScale, vScale: surface.vScale, ...options }) : null;
  if (preferred) return preferred;
  return fallbackId ? vectorArt?.getTexture?.(fallbackId, options) : null;
}

function createDeepArtPlacement(scene, vectorArt, placement) {
  const texture = vectorArt?.getTexture?.(placement.artId, { clamp: true, alpha: true });
  if (!texture) return null;
  const plane = MeshBuilder.CreatePlane(`deep-art-${placement.id}`, { width: placement.width, height: placement.height }, scene);
  plane.position.set(placement.position.x, placement.position.y, placement.position.z);
  if (placement.layer === 'floor-decal') {
    plane.rotation.x = Math.PI / 2;
    plane.rotation.z = Number(placement.rotationZ || 0);
  } else {
    plane.rotation.y = Number(placement.rotationY ?? Math.PI);
    if (placement.billboard) plane.billboardMode = 2;
  }
  plane.isPickable = false;
  plane.material = makeDisplayMaterial(scene, `deep-art-${placement.id}-material`, texture);
  plane.metadata = {
    kind: `deep-art-${placement.layer}`,
    artId: placement.artId,
    localOnly: true,
    sameOrigin: true,
    remoteNetwork: false,
    userData: false,
    finalBinaryArt: false,
    capturesMedia: false,
    uploadsMedia: false
  };
  return plane;
}

function addDeepArtDressing(scene, vectorArt, quality) {
  const plan = getCityDeepArtPlacementPlan({ quality });
  const nodes = plan.placements.map((placement) => ({ placement, node: createDeepArtPlacement(scene, vectorArt, placement) })).filter((entry) => entry.node);
  const animated = nodes.filter((entry) => ['aurora-ribbon-horizon', 'aerial-traffic-horizon', 'signal-kite-prop', 'drone-silhouette-prop'].includes(entry.placement.id));
  if (animated.length) {
    scene.registerBeforeRender(() => {
      if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
      const t = performance.now() * 0.00034;
      for (const entry of animated) {
        const { node, placement } = entry;
        if (placement.id === 'aerial-traffic-horizon') node.position.x = placement.position.x + Math.sin(t * 1.2) * 0.44;
        if (placement.id === 'aurora-ribbon-horizon') node.position.y = placement.position.y + Math.sin(t * 0.76) * 0.18;
        if (placement.id === 'signal-kite-prop') node.position.y = placement.position.y + Math.sin(t * 1.7) * 0.16;
        if (placement.id === 'drone-silhouette-prop') node.position.x = placement.position.x + Math.cos(t * 1.5) * 0.32;
      }
    });
  }
  return Object.freeze({
    plan,
    nodes: Object.freeze(nodes.map((entry) => entry.node)),
    activePlacementCount: nodes.length,
    localOnly: true,
    remoteNetwork: false,
    finalBinaryArt: false
  });
}

function applyCinematicArtDirection(scene, quality) {
  const profile = getCityCinematicArtDirection({ quality });
  const configuration = scene.imageProcessingConfiguration || new ImageProcessingConfiguration();
  configuration.toneMappingEnabled = profile.toneMapping === 'aces';
  configuration.toneMappingType = profile.toneMapping === 'aces'
    ? ImageProcessingConfiguration.TONEMAPPING_ACES
    : ImageProcessingConfiguration.TONEMAPPING_STANDARD;
  configuration.exposure = profile.exposure;
  configuration.contrast = profile.contrast;
  configuration.vignetteEnabled = profile.vignette.enabled;
  configuration.vignetteWeight = profile.vignette.weight;
  configuration.vignetteColor = new Color4(...profile.vignette.color);
  configuration.vignetteBlendMode = ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
  configuration.ditheringEnabled = profile.dithering.enabled;
  configuration.ditheringIntensity = profile.dithering.intensity;
  return profile;
}

function proceduralSeed(seed = 'eon') {
  let state = 2166136261;
  for (const char of String(seed)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function addStreet(scene, artBudget, vectorArt) {
  const street = MeshBuilder.CreateGround('street', { width: 30, height: 30, subdivisions: 2 }, scene);
  street.material = makeMaterial(scene, 'street-material', { diffuse: PALETTE.night, metallic: 0.48, roughness: 0.42, baseTexture: vectorArt?.getTexture?.('wet-street', { uScale: 3.4, vScale: 3.4 }) });
  street.position.y = -0.02;

  const laneMaterial = makeMaterial(scene, 'lane-material', { diffuse: '#1d2a43', emissive: '#0b5670', intensity: 0.7, metallic: 0.18, roughness: 0.34, baseTexture: vectorArt?.getTexture?.('neon-circuit', { uScale: 2.2, vScale: 5.2 }) });
  const edgeMaterial = makeMaterial(scene, 'street-edge-material', { diffuse: PALETTE.steelEdge, emissive: PALETTE.teal, intensity: 0.35, metallic: 0.44, roughness: 0.24, baseTexture: vectorArt?.getTexture?.('brushed-graphite', { uScale: 4.3, vScale: 4.3 }) });
  for (const [x, z, width, depth] of [[0, 0, 2.5, 29], [-6.8, 3.5, 9, 1], [6.8, -3.5, 9, 1]]) {
    const lane = MeshBuilder.CreateBox(`lane-${x}-${z}`, { width, height: 0.03, depth }, scene);
    lane.position.set(x, 0.01, z);
    lane.material = laneMaterial;
  }
  const plaza = MeshBuilder.CreateCylinder('command-plaza', { diameter: 8.3, height: 0.08, tessellation: 32 }, scene);
  plaza.position.set(0, 0.02, -5.75);
  plaza.material = makeMaterial(scene, 'command-plaza-material', { diffuse: '#101e35', emissive: '#123754', intensity: 0.24, metallic: 0.58, roughness: 0.3, baseTexture: getDeepSurfaceTexture(vectorArt, 'command', { uScale: 3.8, vScale: 3.8 }, 'carbon-weave') });
  const plazaRing = MeshBuilder.CreateTorus('command-plaza-ring', { diameter: 7.6, thickness: 0.055, tessellation: 48 }, scene);
  plazaRing.position.set(0, 0.105, -5.75);
  plazaRing.rotation.x = Math.PI / 2;
  plazaRing.material = edgeMaterial;
  if (artBudget.streetProps > 8) {
    const innerRing = MeshBuilder.CreateTorus('command-plaza-inner-ring', { diameter: 4.4, thickness: 0.032, tessellation: 40 }, scene);
    innerRing.position.set(0, 0.11, -5.75);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.material = laneMaterial;
  }
}



function addCommandHorizonStreetKit(scene, plan, vectorArt) {
  if (!plan?.props) return Object.freeze({ root: null, plan: null, decorativePropCount: 0 });
  const root = new TransformNode('command-horizon-street-kit', scene);
  const curbMaterial = makeMaterial(scene, 'command-horizon-curb-material', { diffuse: PALETTE.steelEdge, emissive: PALETTE.teal, intensity: 0.2, metallic: 0.64, roughness: 0.28, baseTexture: vectorArt?.getTexture?.('brushed-graphite', { uScale: 3.2, vScale: 3.2 }) });
  const rainMaterial = makeMaterial(scene, 'command-horizon-rain-channel-material', { diffuse: '#0b2135', emissive: '#176281', intensity: 0.46, metallic: 0.72, roughness: 0.14, baseTexture: vectorArt?.getTexture?.('wet-street', { uScale: 1.4, vScale: 5.4 }) });
  const railMaterial = makeMaterial(scene, 'command-horizon-rail-material', { diffuse: '#152943', emissive: PALETTE.cyan, intensity: 0.62, metallic: 0.68, roughness: 0.18, baseTexture: vectorArt?.getTexture?.('carbon-weave', { uScale: 2.1, vScale: 2.1 }) });
  const planterMaterial = makeMaterial(scene, 'command-horizon-planter-material', { diffuse: '#10273d', emissive: PALETTE.teal, intensity: 0.24, metallic: 0.52, roughness: 0.24 });
  const greeneryMaterial = makeMaterial(scene, 'command-horizon-greenery-material', { diffuse: '#154b43', emissive: PALETTE.mint, intensity: 0.42, metallic: 0.1, roughness: 0.58 });
  const paverMaterial = makeMaterial(scene, 'command-horizon-paver-guide-material', { diffuse: '#163650', emissive: PALETTE.violet, intensity: 0.62, metallic: 0.3, roughness: 0.2 });
  const accentMap = Object.freeze({ cyan: PALETTE.cyan, teal: PALETTE.teal, violet: PALETTE.violet, amber: PALETTE.amber, mint: PALETTE.mint });
  const createStreetBox = (entry, kind, height, y, material) => {
    const mesh = MeshBuilder.CreateBox(`command-horizon-${kind}-${entry.id}`, { width: entry.width, height, depth: entry.depth }, scene);
    mesh.parent = root;
    mesh.position.set(entry.x, y, entry.z);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.metadata = { kind: `command-horizon-${kind}`, originalProcedural: true, binaryAsset: false, remoteAsset: false };
    return mesh;
  };
  plan.props.curbs.forEach((entry) => createStreetBox(entry, 'curb', 0.09, 0.055, curbMaterial));
  plan.props.rainChannels.forEach((entry) => createStreetBox(entry, 'rain-channel', 0.035, 0.035, rainMaterial));
  plan.props.rails.forEach((entry) => createStreetBox(entry, 'rail', 0.48, 0.25, railMaterial));
  plan.props.paverGuides.forEach((entry) => createStreetBox(entry, 'paver-guide', 0.024, 0.054, paverMaterial));
  plan.props.planters.forEach((entry) => {
    const base = MeshBuilder.CreateCylinder(`command-horizon-planter-base-${entry.id}`, { diameter: 0.92 * entry.scale, height: 0.28, tessellation: 12 }, scene);
    base.parent = root;
    base.position.set(entry.x, 0.14, entry.z);
    base.material = planterMaterial;
    base.isPickable = false;
    const canopy = MeshBuilder.CreateSphere(`command-horizon-planter-canopy-${entry.id}`, { diameter: 0.72 * entry.scale, segments: 8 }, scene);
    canopy.parent = root;
    canopy.position.set(entry.x, 0.55 * entry.scale, entry.z);
    canopy.material = greeneryMaterial;
    canopy.isPickable = false;
  });
  plan.props.wayfinding.forEach((entry) => {
    const markerMaterial = makeMaterial(scene, `command-horizon-wayfinding-material-${entry.id}`, { diffuse: '#13314e', emissive: accentMap[entry.accent] || PALETTE.cyan, intensity: 1.05, metallic: 0.26, roughness: 0.18 });
    const marker = MeshBuilder.CreateCylinder(`command-horizon-wayfinding-${entry.id}`, { diameter: 0.36, height: 0.045, tessellation: 18 }, scene);
    marker.parent = root;
    marker.position.set(entry.x, 0.062, entry.z);
    marker.material = markerMaterial;
    marker.isPickable = false;
    marker.metadata = { kind: 'command-horizon-wayfinding', originalProcedural: true, binaryAsset: false, remoteAsset: false, accent: entry.accent };
  });
  root.metadata = {
    kind: 'command-horizon-street-kit',
    schema: plan.schema,
    quality: plan.quality,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    userData: false,
    decorativePropCount: plan.budgets.decorativePropCount,
    decorativePropBudgetRespected: plan.budgets.decorativePropBudgetRespected
  };
  return Object.freeze({ root, plan, decorativePropCount: plan.budgets.decorativePropCount });
}

function addArrivalDistrict(scene, quality, artBudget, vectorArt) {
  const root = new TransformNode('arrival-district', scene);
  const steel = makeMaterial(scene, 'arrival-gate-steel', { diffuse: '#101d33', emissive: '#123f5c', intensity: 0.22, metallic: 0.7, roughness: 0.26, baseTexture: vectorArt?.getTexture?.('brushed-graphite', { uScale: 3.1, vScale: 3.1 }) });
  const signal = makeMaterial(scene, 'arrival-gate-signal', { diffuse: '#183553', emissive: PALETTE.cyan, intensity: quality === 'lite' ? 0.62 : 1.02, metallic: 0.24, roughness: 0.15 });
  const violet = makeMaterial(scene, 'arrival-gate-violet', { diffuse: '#2c1b58', emissive: PALETTE.violet, intensity: quality === 'cinematic' ? 1.1 : 0.82, metallic: 0.34, roughness: 0.2 });
  const wetPath = makeMaterial(scene, 'arrival-path-material', { diffuse: '#10243b', emissive: '#0e4f68', intensity: 0.36, metallic: 0.56, roughness: 0.18, baseTexture: getDeepSurfaceTexture(vectorArt, 'arrival', { uScale: 1.25, vScale: 4.2 }, 'wet-street') });
  const path = MeshBuilder.CreateBox('arrival-wet-street-path', { width: 3.2, height: 0.035, depth: 9.5 }, scene);
  path.parent = root;
  path.position.set(0, 0.018, 7.9);
  path.material = wetPath;
  for (const side of [-1, 1]) {
    const edge = MeshBuilder.CreateBox(`arrival-path-edge-${side}`, { width: 0.055, height: 0.045, depth: 9.5 }, scene);
    edge.parent = root;
    edge.position.set(side * 1.52, 0.04, 7.9);
    edge.material = signal;
  }
  const tileCount = quality === 'lite' ? 5 : Math.min(9, Math.max(6, artBudget.streetProps - 1));
  for (let index = 0; index < tileCount; index += 1) {
    const tile = MeshBuilder.CreateBox(`arrival-path-tile-${index}`, { width: 1.7, height: 0.022, depth: 0.065 }, scene);
    tile.parent = root;
    tile.position.set(0, 0.055, 3.8 + index * 0.95);
    tile.material = index % 2 ? signal : violet;
  }
  for (const side of [-1, 1]) {
    const pylon = MeshBuilder.CreateBox(`arrival-gate-pylon-${side}`, { width: 0.72, height: 5.5, depth: 0.94 }, scene);
    pylon.parent = root;
    pylon.position.set(side * 3.35, 2.75, 11.82);
    pylon.material = steel;
    const inlay = MeshBuilder.CreateBox(`arrival-gate-inlay-${side}`, { width: 0.11, height: 4.36, depth: 0.965 }, scene);
    inlay.parent = root;
    inlay.position.set(side * 3.35, 2.82, 11.33);
    inlay.material = side < 0 ? signal : violet;
  }
  const beam = MeshBuilder.CreateBox('arrival-gate-crossbeam', { width: 7.6, height: 0.58, depth: 1.05 }, scene);
  beam.parent = root;
  beam.position.set(0, 5.36, 11.82);
  beam.material = steel;
  const crown = MeshBuilder.CreateTorus('arrival-gate-crown', { diameter: 5.42, thickness: 0.11, tessellation: 36 }, scene);
  crown.parent = root;
  crown.position.set(0, 4.15, 11.3);
  crown.rotation.x = Math.PI / 2;
  crown.material = signal;
  const missionBase = MeshBuilder.CreateCylinder('arrival-mission-beacon-base', { diameter: 0.78, height: 0.09, tessellation: 18 }, scene);
  missionBase.parent = root;
  missionBase.position.set(0, 0.055, 4.58);
  missionBase.material = steel;
  const missionBeacon = MeshBuilder.CreatePolyhedron('arrival-mission-beacon', { type: 1, size: 0.31 }, scene);
  missionBeacon.parent = root;
  missionBeacon.position.set(0, 1.06, 4.58);
  missionBeacon.material = violet;
  const missionRing = MeshBuilder.CreateTorus('arrival-mission-ring', { diameter: 1.12, thickness: 0.048, tessellation: 26 }, scene);
  missionRing.parent = root;
  missionRing.position.set(0, 0.15, 4.58);
  missionRing.rotation.x = Math.PI / 2;
  missionRing.material = signal;
  createDistrictSign(scene, 'sign-arrival-gate', 'ARRIVAL GATE', new Vector3(0, 4.72, 11.18), PALETTE.cyan, 2.22);
  createDistrictSign(scene, 'sign-arrival-mission', 'MEET EONBOT · CHOOSE WORK', new Vector3(0, 2.14, 5.18), PALETTE.violet, 2.76);
  createVectorArtDecal(scene, vectorArt, { name: 'arrival-gate-vector-emblem', artId: 'arrival-emblem', position: new Vector3(0, 4.08, 11.23), width: 1.22, height: 1.22, billboard: true });
  createVectorWayfinding(scene, vectorArt, 'arrival-cyan', 0, 8.46, 'wayfinding-cyan', 0);
  createVectorWayfinding(scene, vectorArt, 'arrival-violet', 0, 6.66, 'wayfinding-violet', 0);
  root.metadata = {
    kind: 'arrival-district-authored-procedural',
    blueprintId: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.id,
    originalProcedural: true,
    binaryAssets: false,
    localOnly: true,
    remoteAssets: false,
    firstMission: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.id
  };
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const time = performance.now() * 0.00062;
    crown.rotation.z = Math.sin(time) * 0.055;
    missionBeacon.rotation.y += 0.028;
    missionBeacon.position.y = 1.06 + Math.sin(time * 1.8) * 0.09;
    missionRing.rotation.z += 0.022;
  });
  return root;
}

function addBuilding(scene, name, position, dimensions, accent, detail = 1, artBudget = getCityPlayArtBudget(), vectorArt = null) {
  const typeByName = {
    relay: 'support-dock',
    observatory: 'device-observatory',
    archive: 'archive-canopy',
    workshop: 'forge-basilica'
  };
  const quality = detail > 1 && artBudget?.facadeFins > 5 ? 'cinematic' : detail > 0 ? 'balanced' : 'lite';
  const landmark = createEonNoirLandmark(scene, {
    id: `city-${name}`,
    type: typeByName[name] || 'support-dock',
    position,
    accent,
    quality,
    vectorArt,
    metadata: {
      legacyName: name,
      dimensions: { width: Number(dimensions?.width || 0), height: Number(dimensions?.height || 0), depth: Number(dimensions?.depth || 0) },
      interactiveViaHud: true,
      displaysPrivateWork: false
    }
  });
  return landmark.root;
}

function addCreatorForgeDistrict(scene, quality, _artBudget, vectorArt) {
  const root = new TransformNode('creator-forge-district', scene);
  const creatorAtrium = createEonNoirLandmark(scene, {
    id: 'creator-atrium',
    type: 'creator-atrium',
    parent: root,
    position: { x: -8.4, z: -4.1 },
    accent: PALETTE.cyan,
    quality,
    vectorArt,
    metadata: { kind: 'creator-atrium', interactiveViaHud: true, displaysPrivateWork: false }
  });
  const forgeBay = createEonNoirLandmark(scene, {
    id: 'forge-bay',
    type: 'forge-basilica',
    parent: root,
    position: { x: 8.2, z: -3.2 },
    accent: PALETTE.violet,
    quality,
    vectorArt,
    metadata: { kind: 'forge-bay', interactiveViaHud: true, displaysPrivateWork: false }
  });

  const beaconMaterial = makeMaterial(scene, 'creator-forge-route-beacon-material', { diffuse: '#173850', emissive: PALETTE.cyan, intensity: quality === 'lite' ? .48 : .9, metallic: .2, roughness: .16 });
  const forgeBeaconMaterial = makeMaterial(scene, 'forge-bay-route-beacon-material', { diffuse: '#2d1d58', emissive: PALETTE.violet, intensity: quality === 'lite' ? .48 : .9, metallic: .2, roughness: .16 });
  const atriumBeacon = MeshBuilder.CreateCylinder('creator-atrium-wayfinding-beacon', { diameter: .58, height: .08, tessellation: 18 }, scene);
  atriumBeacon.parent = root;
  atriumBeacon.position.set(-8.4, .07, -1.68);
  atriumBeacon.material = beaconMaterial;
  const forgeBeacon = MeshBuilder.CreateCylinder('forge-bay-wayfinding-beacon', { diameter: .58, height: .08, tessellation: 18 }, scene);
  forgeBeacon.parent = root;
  forgeBeacon.position.set(8.2, .07, -.65);
  forgeBeacon.material = forgeBeaconMaterial;

  createDistrictSign(scene, 'sign-creator-atrium-noir', 'CREATOR ATRIUM', new Vector3(-8.4, 4.85, -6.6), PALETTE.cyan, 2.9);
  createDistrictSign(scene, 'sign-forge-bay-noir', 'FORGE BASILICA', new Vector3(8.2, 5.1, -5.8), PALETTE.violet, 2.9);
  createVectorArtDecal(scene, vectorArt, { name: 'creator-atrium-vector-emblem', artId: 'creator-emblem', position: new Vector3(-8.4, 3.45, -6.47), width: 1.18, height: 1.18, billboard: true });
  createVectorArtDecal(scene, vectorArt, { name: 'forge-bay-vector-emblem', artId: 'forge-emblem', position: new Vector3(8.2, 3.55, -5.58), width: 1.18, height: 1.18, billboard: true });
  createVectorWayfinding(scene, vectorArt, 'creator-cyan', -4.78, -3.68, 'wayfinding-cyan', -Math.PI / 2);
  createVectorWayfinding(scene, vectorArt, 'forge-violet', 4.7, -3.08, 'wayfinding-violet', Math.PI / 2);
  root.metadata = { kind: 'creator-forge-district', localOnly: true, originalProcedural: true, eonNoirArchitecture: true, nativeLaunchBoard: 'Creator Atrium', automaticNavigation: false, automaticExecution: false, displaysPrivateWork: false };
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const t = performance.now() * .00058;
    atriumBeacon.scaling.setAll(1 + Math.sin(t * 2.2) * .08);
    forgeBeacon.scaling.setAll(1 + Math.cos(t * 2.1) * .08);
  });
  return Object.freeze({ root, creatorAtrium: creatorAtrium.root, forgeBay: forgeBay.root, localOnly: true });
}

function addCommandDistrictVerticalSlice(scene, quality, vectorArt) {
  const plan = getEonCityCommandDistrictVerticalSlicePlan();
  const root = new TransformNode('w624c-command-district-vertical-slice', scene);
  const pathMaterial = makeMaterial(scene, 'w624c-command-path', { diffuse: '#0b2037', emissive: '#1f7084', intensity: quality === 'lite' ? .3 : .5, metallic: .62, roughness: .2, baseTexture: vectorArt?.getTexture?.('wet-street', { uScale: 1.8, vScale: 4.4 }) });
  const edgeMaterial = makeMaterial(scene, 'w624c-command-path-edge', { diffuse: '#16354c', emissive: PALETTE.cyan, intensity: quality === 'lite' ? .46 : .8, metallic: .28, roughness: .18 });
  const amberMaterial = makeMaterial(scene, 'w624c-warm-human-light', { diffuse: '#432d18', emissive: '#ffbc68', intensity: quality === 'lite' ? .42 : .72, metallic: .2, roughness: .28 });
  const plazaMaterial = makeMaterial(scene, 'w624c-arrival-plaza', { diffuse: '#0b192b', emissive: '#173f58', intensity: .24, metallic: .66, roughness: .22, baseTexture: vectorArt?.getTexture?.('brushed-graphite', { uScale: 3, vScale: 3 }) });

  const plaza = MeshBuilder.CreateCylinder('w624c-arrival-plaza-deck', { diameter: 8.4, height: .07, tessellation: quality === 'lite' ? 20 : 36 }, scene);
  plaza.parent = root; plaza.position.set(0, .035, 7.15); plaza.material = plazaMaterial; plaza.isPickable = false;
  const plazaRing = MeshBuilder.CreateTorus('w624c-arrival-plaza-ring', { diameter: 7.45, thickness: .055, tessellation: 36 }, scene);
  plazaRing.parent = root; plazaRing.position.set(0, .09, 7.15); plazaRing.rotation.x = Math.PI / 2; plazaRing.material = edgeMaterial; plazaRing.isPickable = false;

  const createPath = (entry) => {
    const dx = entry.to.x - entry.from.x;
    const dz = entry.to.z - entry.from.z;
    const length = Math.hypot(dx, dz);
    const path = MeshBuilder.CreateBox(`w624c-path-${entry.id}`, { width: entry.width, height: .035, depth: length }, scene);
    path.parent = root;
    path.position.set((entry.from.x + entry.to.x) / 2, .045, (entry.from.z + entry.to.z) / 2);
    path.rotation.y = Math.atan2(dx, dz);
    path.material = pathMaterial;
    path.isPickable = false;
    for (const side of [-1, 1]) {
      const edge = MeshBuilder.CreateBox(`w624c-path-${entry.id}-edge-${side}`, { width: .035, height: .045, depth: length }, scene);
      edge.parent = path;
      edge.position.x = side * Math.max(.14, entry.width / 2 - .06);
      edge.material = edgeMaterial;
      edge.isPickable = false;
    }
    return path;
  };
  const paths = EON_CITY_COMMAND_DISTRICT_PATHS.map(createPath);

  const agentTheatre = createEonNoirLandmark(scene, {
    id: 'agent-theatre', type: 'agent-theatre', parent: root,
    position: { x: 4.75, z: 1.8, heading: -0.24 }, accent: '#ffbc68', quality, vectorArt,
    metadata: { kind: 'agent-theatre-exterior', operationalState: 'dormant-until-receipt', representsLiveAgents: false, executesJobs: false, interactiveViaHud: true }
  });
  const projectDock = createEonNoirLandmark(scene, {
    id: 'project-dock', type: 'support-dock', parent: root,
    position: { x: -4.55, z: 2.2, heading: .28 }, accent: PALETTE.cyan, quality, vectorArt,
    metadata: { kind: 'project-dock-exterior', displaysPrivateWork: false, projectReferenceExposed: false, interactiveViaHud: true }
  });

  createDistrictSign(scene, 'w624c-agent-theatre-sign', 'AGENT THEATRE · RECEIPTS ONLY', new Vector3(4.75, 4.15, -.48), '#ffbc68', 2.25);
  createDistrictSign(scene, 'w624c-project-dock-sign', 'PROJECT DOCK', new Vector3(-4.55, 3.75, .25), PALETTE.cyan, 1.65);
  createDistrictSign(scene, 'w624c-arrival-plaza-sign', 'COMMAND DISTRICT', new Vector3(0, 2.82, 7.5), PALETTE.cyan, 2.35);

  const propCount = quality === 'lite' ? 4 : 8;
  for (let index = 0; index < propCount; index += 1) {
    const phase = (Math.PI * 2 * index) / propCount;
    const x = Math.cos(phase) * 3.42;
    const z = 7.15 + Math.sin(phase) * 3.42;
    const post = MeshBuilder.CreateCylinder(`w624c-plaza-lantern-${index}`, { diameter: .09, height: 1.45, tessellation: 8 }, scene);
    post.parent = root; post.position.set(x, .725, z); post.material = plazaMaterial; post.isPickable = false;
    const lamp = MeshBuilder.CreateSphere(`w624c-plaza-lantern-light-${index}`, { diameter: .23, segments: 8 }, scene);
    lamp.parent = root; lamp.position.set(x, 1.43, z); lamp.material = index % 2 ? amberMaterial : edgeMaterial; lamp.isPickable = false;
    lamp.metadata = { kind: 'emissive-wayfinding-lamp', dynamicLight: false, decorativeOnly: true, localOnly: true };
  }

  root.metadata = {
    kind: 'w624c-command-district-vertical-slice', schema: plan.schema, cacheVersion: plan.cacheVersion,
    artDirection: plan.artDirection, firstTenSecondCueCount: plan.journey.firstTenSeconds.length,
    firstSixtySecondMilestoneCount: plan.journey.firstSixtySeconds.length,
    pathCount: paths.length, destinationCount: plan.destinations.length, collisionVolumeCount: plan.collisionVolumes.length,
    unstuckPointCount: plan.unstuckPoints.length, localOnly: true, remoteArtRequired: false,
    automaticNavigation: false, automaticExecution: false, fakeOperationalActivity: false, ownerVisualApprovalPending: true
  };
  return Object.freeze({ root, plan, paths, agentTheatre: agentTheatre.root, projectDock: projectDock.root, localOnly: true });
}

function addMetropolisDistricts(scene, quality, _artBudget, vectorArt) {
  const root = new TransformNode('living-creator-metropolis-districts', scene);
  const typeByDistrict = {
    'signal-tower': 'signal-sail',
    'automation-observatory': 'automation-observatory',
    'archive-gardens': 'archive-canopy'
  };
  const artByDistrict = { 'signal-tower': 'signal-emblem', 'automation-observatory': 'automation-emblem', 'archive-gardens': 'archive-emblem' };
  const districts = EON_CITY_METROPOLIS_DISTRICTS.map((district) => {
    createEonNoirLandmark(scene, {
      id: `metropolis-${district.id}`,
      type: typeByDistrict[district.id] || 'signal-sail',
      parent: root,
      position: { x: district.x, z: district.z },
      accent: district.accent,
      quality,
      vectorArt,
      metadata: { kind: 'metropolis-district', districtId: district.id, nativeLaunchesUserSelected: true, displaysPrivateWork: false }
    });
    createDistrictSign(scene, `metropolis-${district.id}-sign-noir`, district.title.toUpperCase(), new Vector3(district.x, district.id === 'signal-tower' ? 8.86 : 5.9, district.z - 1.68), district.accent, 3.05);
    createVectorArtDecal(scene, vectorArt, { name: `metropolis-${district.id}-vector-emblem`, artId: artByDistrict[district.id], position: new Vector3(district.x, district.id === 'signal-tower' ? 4.9 : 3.08, district.z - 1.42), width: district.id === 'signal-tower' ? 1.2 : 1.04, height: district.id === 'signal-tower' ? 1.2 : 1.04, billboard: true });
    createVectorWayfinding(scene, vectorArt, `metropolis-${district.id}`, district.x, district.z - 2.06, district.id === 'automation-observatory' ? 'wayfinding-mint' : (district.id === 'signal-tower' ? 'wayfinding-violet' : 'wayfinding-cyan'), 0);
    return district;
  });
  root.metadata = { kind: 'living-creator-metropolis-districts', localOnly: true, originalProcedural: true, eonNoirArchitecture: true, nativeLaunchesUserSelected: true, socialPosting: false, automationExecution: false, collectionGrant: false, remoteAssets: false, finalVisualCertification: false };
  return Object.freeze({ root, districts: Object.freeze(districts), localOnly: true });
}

function addCommandCentre(scene, quality, artBudget, vectorArt) {
  const root = new TransformNode('command-centre', scene);
  createEonNoirLandmark(scene, {
    id: 'command-centre',
    type: 'command-loom',
    parent: root,
    position: { x: 0, z: 0 },
    accent: PALETTE.cyan,
    quality,
    vectorArt,
    metadata: { kind: 'command-centre-exterior', displaysPrivateWork: false, interactiveViaHud: true }
  });

  const entrySteel = makeMaterial(scene, 'command-entry-steel', { diffuse: '#132a47', emissive: '#194c6d', intensity: 0.3, metallic: 0.66, roughness: 0.28 });
  const entrySignal = makeMaterial(scene, 'command-entry-signal', { diffuse: PALETTE.glass, emissive: PALETTE.cyan, intensity: quality === 'lite' ? 0.68 : 1.04, metallic: 0.18, roughness: 0.16 });
  for (let step = 0; step < 4; step += 1) {
    const stair = MeshBuilder.CreateBox(`command-entry-step-${step}`, { width: 3.25 - step * 0.18, height: 0.18, depth: 0.76 }, scene);
    stair.parent = root;
    stair.position.set(0, 0.09 + step * 0.18, -2.37 - step * 0.47);
    stair.material = entrySteel;
  }
  const threshold = MeshBuilder.CreateCylinder('command-entry-threshold', { diameter: 2.95, height: 0.07, tessellation: 28 }, scene);
  threshold.parent = root;
  threshold.position.set(0, 0.77, -4.02);
  threshold.material = entrySignal;
  const doorLeft = MeshBuilder.CreateBox('command-entry-door-left', { width: 0.96, height: 2.28, depth: 0.09 }, scene);
  const doorRight = MeshBuilder.CreateBox('command-entry-door-right', { width: 0.96, height: 2.28, depth: 0.09 }, scene);
  doorLeft.parent = root; doorRight.parent = root;
  doorLeft.position.set(-0.53, 1.92, -2.15); doorRight.position.set(0.53, 1.92, -2.15);
  doorLeft.material = entrySignal; doorRight.material = entrySignal;
  const entryFrame = MeshBuilder.CreateTorus('command-entry-frame', { diameter: 2.86, thickness: 0.09, tessellation: 30 }, scene);
  entryFrame.parent = root;
  entryFrame.position.set(0, 2.03, -2.22);
  entryFrame.rotation.x = Math.PI / 2;
  entryFrame.material = entrySignal;

  const beacon = MeshBuilder.CreateSphere('command-beacon', { diameter: 0.74, segments: 16 }, scene);
  beacon.parent = root;
  beacon.position.y = 8.55;
  beacon.material = makeMaterial(scene, 'command-beacon-material', { diffuse: '#3b1c7a', emissive: PALETTE.violet, intensity: quality === 'cinematic' ? 1.26 : 1.04, metallic: 0.16, roughness: 0.18 });
  const crownMaterial = makeMaterial(scene, 'command-crown-material', { diffuse: PALETTE.steelEdge, emissive: PALETTE.cyan, intensity: 0.74, metallic: 0.62, roughness: 0.18 });
  const crown = MeshBuilder.CreateTorus('command-crown', { diameter: 3.7, thickness: 0.12, tessellation: 32 }, scene);
  crown.parent = root;
  crown.position.y = 7.25;
  crown.rotation.x = Math.PI / 2;
  crown.material = crownMaterial;
  if (artBudget.facadeFins > 3) {
    for (const x of [-3.7, 3.7]) {
      const pylon = MeshBuilder.CreateBox(`command-pylon-${x}`, { width: 0.52, height: 5.2, depth: 0.86 }, scene);
      pylon.parent = root;
      pylon.position.set(x, 2.6, -0.15);
      pylon.material = crownMaterial;
    }
  }
  if (artBudget.facadeFins > 4) {
    for (const x of [-2.15, 2.15]) {
      const fin = MeshBuilder.CreateBox(`command-glass-fin-${x}`, { width: 0.36, height: 4.72, depth: 0.16 }, scene);
      fin.parent = root;
      fin.position.set(x, 3.45, -2.2);
      fin.material = entrySignal;
    }
  }
  createDistrictSign(scene, 'sign-command-entry', 'EON COMMAND', new Vector3(0, 3.32, -9.38), PALETTE.cyan, 2.76);
  createVectorArtDecal(scene, vectorArt, { name: 'command-centre-vector-emblem', artId: 'command-emblem', position: new Vector3(0, 4.28, -9.34), width: 1.3, height: 1.3, billboard: true });
  root.metadata = { kind: 'command-centre-exterior', originalProcedural: true, localOnly: true, remoteAssets: false };
  scene.registerBeforeRender(() => {
    const t = performance.now() * 0.00044;
    crown.rotation.z = Math.sin(t) * 0.09;
    beacon.scaling.setAll(1 + Math.sin(t * 2.2) * 0.045);
  });
  root.position.set(0, 0, -7.2);
  return root;
}

function addCommandDeckDisplays(scene, root, quality) {
  const displays = [
    { id: 'eonbot', label: 'EONBOT', detail: 'ASK & CREATE', accent: PALETTE.cyan, x: -1.82 },
    { id: 'forge', label: 'EON FORGE', detail: 'BUILD LOCALLY', accent: PALETTE.violet, x: -0.91 },
    { id: 'projects', label: 'PROJECTS', detail: 'CONTINUE WORK', accent: PALETTE.teal, x: 0 },
    { id: 'library', label: 'LIBRARY', detail: 'FILES & ASSETS', accent: PALETTE.mint, x: 0.91 },
    { id: 'city-map', label: 'CITY MAP', detail: 'QUICK TRAVEL', accent: PALETTE.amber, x: 1.82 }
  ];
  const visible = displays.slice(0, quality === 'lite' ? 3 : displays.length);
  visible.forEach((display, index) => {
    const texture = createSafeDynamicTexture(scene, `command-deck-display-${display.id}-texture`, 512, 176, false);
    if (!texture) return;
    const context = texture.getContext();
    context.clearRect(0, 0, 512, 176);
    context.fillStyle = 'rgba(4, 15, 31, 0.88)';
    context.fillRect(8, 8, 496, 160);
    context.strokeStyle = display.accent;
    context.lineWidth = 4;
    context.strokeRect(10, 10, 492, 156);
    context.fillStyle = '#dbe8ff';
    context.font = '700 31px monospace';
    context.fillText(display.label, 32, 72);
    context.fillStyle = '#b8d6e9';
    context.font = '600 20px monospace';
    context.fillText(display.detail, 32, 118);
    context.fillStyle = display.accent;
    context.font = '700 17px monospace';
    context.fillText('LOCAL DECK', 32, 145);
    texture.update();

    const material = makeDisplayMaterial(scene, `command-deck-display-${display.id}-material`, texture);
    const panel = MeshBuilder.CreatePlane(`command-deck-display-${display.id}`, { width: 0.98, height: 0.34 }, scene);
    panel.parent = root;
    panel.position.set(display.x, 2.66 + (index % 2) * 0.16, -2.64);
    panel.material = material;
    panel.metadata = { kind: 'command-deck-display', destination: display.id, localOnly: true, displaysPrivateWork: false, interactiveViaHud: true };
  });
  return Object.freeze({ count: visible.length, localOnly: true });
}

function addCreatorAtriumDisplays(scene, root, quality) {
  const texture = createSafeDynamicTexture(scene, 'creator-atrium-display-texture', 840, 300, true);
  if (!texture) return Object.freeze({ display: null, localOnly: true, skipped: 'dynamic-texture-unavailable' });
  const context = texture.getContext();
  context.clearRect(0, 0, 840, 300);
  context.fillStyle = 'rgba(4, 15, 32, 0.95)';
  context.fillRect(0, 0, 840, 300);
  context.strokeStyle = '#7cf9ff';
  context.lineWidth = 4;
  context.strokeRect(14, 14, 812, 272);
  context.fillStyle = '#c9f7ff';
  context.font = '700 64px system-ui, sans-serif';
  context.fillText('CREATOR ATRIUM', 62, 112);
  context.fillStyle = quality === 'lite' ? '#b7d9e7' : '#aeeff7';
  context.font = '500 32px system-ui, sans-serif';
  context.fillText('BRIEF  •  REVIEW  •  FORGE', 62, 182);
  context.fillStyle = '#9ab1c7';
  context.font = '500 22px system-ui, sans-serif';
  context.fillText('Native tools open only after your visible choice', 62, 230);
  texture.update();
  const material = makeDisplayMaterial(scene, 'creator-atrium-display-material', texture);
  const panel = MeshBuilder.CreatePlane('creator-atrium-display', { width: 1.72, height: 0.62 }, scene);
  panel.parent = root;
  panel.position.set(-2.02, 2.5, -2.62);
  panel.material = material;
  panel.metadata = { kind: 'creator-atrium-display', localOnly: true, displaysPrivateWork: false, mediaBodies: false, providerCalls: false, interactiveViaHud: true };
  const beacon = MeshBuilder.CreateTorus('creator-atrium-beacon', { diameter: 0.56, thickness: 0.04, tessellation: 24 }, scene);
  beacon.parent = root;
  beacon.position.set(-2.02, 1.96, -2.52);
  beacon.rotation.x = Math.PI / 2;
  beacon.material = makeMaterial(scene, 'creator-atrium-beacon-material', { diffuse: '#203753', emissive: PALETTE.cyan, intensity: quality === 'lite' ? 0.45 : 0.8, metallic: 0.3, roughness: 0.18 });
  return Object.freeze({ display: panel, localOnly: true });
}

function addCommandRoomInterior(scene, quality, artBudget) {
  const root = new TransformNode('command-room-interior', scene);
  root.position.set(0, 0, -11.4);
  const structural = makeMaterial(scene, 'command-room-structural', { diffuse: '#0d1b31', emissive: '#173959', intensity: 0.18, metallic: 0.58, roughness: 0.3 });
  const glass = makeMaterial(scene, 'command-room-glass', { diffuse: PALETTE.glass, emissive: PALETTE.violet, intensity: quality === 'lite' ? 0.42 : 0.84, metallic: 0.16, roughness: 0.17, alpha: 0.94 });
  const signal = makeMaterial(scene, 'command-room-signal', { diffuse: '#152f51', emissive: PALETTE.teal, intensity: quality === 'lite' ? 0.58 : 0.98, metallic: 0.24, roughness: 0.18 });
  const floor = MeshBuilder.CreateCylinder('command-room-floor', { diameter: 6.5, height: 0.16, tessellation: 36 }, scene);
  floor.parent = root; floor.position.y = 0.08; floor.material = structural;
  const floorRing = MeshBuilder.CreateTorus('command-room-floor-ring', { diameter: 5.8, thickness: 0.055, tessellation: 36 }, scene);
  floorRing.parent = root; floorRing.position.y = 0.19; floorRing.rotation.x = Math.PI / 2; floorRing.material = signal;
  const rearWall = MeshBuilder.CreateBox('command-room-rear-wall', { width: 5.8, height: 4.8, depth: 0.16 }, scene);
  rearWall.parent = root; rearWall.position.set(0, 2.4, -2.45); rearWall.material = structural;
  const window = MeshBuilder.CreateBox('command-room-city-window', { width: 4.3, height: 2.5, depth: 0.05 }, scene);
  window.parent = root; window.position.set(0, 2.72, -2.55); window.material = glass;
  const desk = MeshBuilder.CreateCylinder('command-room-desk', { diameter: 2.35, height: 0.78, tessellation: 24 }, scene);
  desk.parent = root; desk.position.set(0, 0.42, 0.18); desk.material = structural;
  const deskCore = MeshBuilder.CreateCylinder('command-room-desk-core', { diameter: 0.72, height: 0.88, tessellation: 16 }, scene);
  deskCore.parent = root; deskCore.position.set(0, 0.46, 0.18); deskCore.material = signal;
  const monitorCount = quality === 'lite' ? 2 : (quality === 'cinematic' ? 5 : 4);
  for (let index = 0; index < monitorCount; index += 1) {
    const angle = -Math.PI / 2 + (index - (monitorCount - 1) / 2) * 0.45;
    const monitor = MeshBuilder.CreateBox(`command-room-monitor-${index}`, { width: 0.58, height: 0.38, depth: 0.06 }, scene);
    monitor.parent = root;
    monitor.position.set(Math.cos(angle) * 1.46, 1.05, Math.sin(angle) * 1.05 + 0.18);
    monitor.rotation.y = -angle;
    monitor.material = index % 2 ? glass : signal;
  }
  const holo = MeshBuilder.CreateTorus('command-room-holo', { diameter: 1.35, thickness: 0.05, tessellation: 28 }, scene);
  holo.parent = root; holo.position.y = 1.56; holo.rotation.x = Math.PI / 2; holo.material = glass;
  const arc = MeshBuilder.CreateTorus('command-room-arch', { diameter: 5.46, thickness: 0.085, tessellation: 36 }, scene);
  arc.parent = root; arc.position.set(0, 3.55, -1.92); arc.rotation.x = Math.PI / 2; arc.material = signal;
  if (artBudget.streetProps > 8) {
    for (const x of [-2.6, 2.6]) {
      const console = MeshBuilder.CreateBox(`command-room-console-${x}`, { width: 0.7, height: 1.05, depth: 0.62 }, scene);
      console.parent = root; console.position.set(x, 0.52, 0.65); console.material = structural;
      const consoleFace = MeshBuilder.CreateBox(`command-room-console-face-${x}`, { width: 0.52, height: 0.34, depth: 0.035 }, scene);
      consoleFace.parent = root; consoleFace.position.set(x, 0.86, 0.98); consoleFace.material = signal;
    }
  }
  const deckDisplays = addCommandDeckDisplays(scene, root, quality);
  const creatorAtrium = addCreatorAtriumDisplays(scene, root, quality);
  createDistrictSign(scene, 'sign-command-room', 'COMMAND DECK', new Vector3(0, 4.18, -13.72), PALETTE.violet, 2.54);
  createDistrictSign(scene, 'sign-creator-atrium', 'CREATOR ATRIUM', new Vector3(-2.02, 3.56, -13.64), PALETTE.cyan, 1.12);
  root.metadata = { kind: 'command-deck-interior', originalProcedural: true, localOnly: true, displaysRawWork: false, displaysPrivateWork: false, displayCount: deckDisplays.count, creatorAtrium: Boolean(creatorAtrium), interactiveViaHud: true };
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    holo.rotation.z += 0.012;
    arc.rotation.z = Math.sin(performance.now() * 0.00042) * 0.08;
  });
  return root;
}

function addOperator(scene) {
  const root = new TransformNode('operator', scene);
  const fallback = new TransformNode('operator-procedural-fallback', scene);
  fallback.parent = root;
  const suit = makeMaterial(scene, 'operator-suit', { diffuse: '#26354e', emissive: '#176277', intensity: 0.22, metallic: 0.48, roughness: 0.34 });
  const fabric = makeMaterial(scene, 'operator-fabric', { diffuse: '#1e2b41', emissive: '#0f3149', intensity: 0.08, metallic: 0.08, roughness: 0.72 });
  const visor = makeMaterial(scene, 'operator-visor', { diffuse: '#112945', emissive: '#76f5ff', intensity: 1.05, metallic: 0.24, roughness: 0.14 });
  const body = MeshBuilder.CreateBox('operator-body', { width: 0.76, height: 1.08, depth: 0.46 }, scene);
  body.parent = fallback; body.position.y = 0.98; body.material = suit;
  const head = MeshBuilder.CreateSphere('operator-head', { diameter: 0.64, segments: 14 }, scene);
  head.parent = fallback; head.position.y = 1.82; head.material = visor;
  const shoulder = MeshBuilder.CreateBox('operator-shoulder', { width: 1.1, height: 0.22, depth: 0.5 }, scene);
  shoulder.parent = fallback; shoulder.position.y = 1.38; shoulder.material = suit;
  const belt = MeshBuilder.CreateTorus('operator-belt', { diameter: 0.68, thickness: 0.035, tessellation: 16 }, scene);
  belt.parent = fallback; belt.position.y = 0.64; belt.rotation.x = Math.PI / 2; belt.material = visor;
  for (const side of [-1, 1]) {
    const arm = MeshBuilder.CreateBox(`operator-arm-${side}`, { width: 0.18, height: 0.72, depth: 0.22 }, scene);
    arm.parent = fallback; arm.position.set(side * 0.52, 1.03, 0); arm.rotation.z = side * -0.12; arm.material = fabric;
    const leg = MeshBuilder.CreateBox(`operator-leg-${side}`, { width: 0.26, height: 0.72, depth: 0.28 }, scene);
    leg.parent = fallback; leg.position.set(side * 0.2, 0.25, 0.04); leg.material = fabric;
    const boot = MeshBuilder.CreateBox(`operator-boot-${side}`, { width: 0.29, height: 0.16, depth: 0.45 }, scene);
    boot.parent = fallback; boot.position.set(side * 0.2, 0.05, -0.08); boot.material = suit;
  }
  const pack = MeshBuilder.CreateBox('operator-command-pack', { width: 0.38, height: 0.58, depth: 0.15 }, scene);
  pack.parent = fallback; pack.position.set(0, 1.01, 0.3); pack.material = suit;
  const chestSignal = MeshBuilder.CreateBox('operator-chest-signal', { width: 0.26, height: 0.12, depth: 0.04 }, scene);
  chestSignal.parent = fallback; chestSignal.position.set(0, 1.1, -0.255); chestSignal.material = visor;
  const routeSpine = MeshBuilder.CreateBox('wayfinder-route-spine', { width: 0.08, height: 1.08, depth: 0.035 }, scene);
  routeSpine.parent = fallback; routeSpine.position.set(0, 1.04, 0.245); routeSpine.material = visor;
  const coatLeft = MeshBuilder.CreateBox('wayfinder-coat-left', { width: 0.31, height: 0.82, depth: 0.08 }, scene);
  const coatRight = MeshBuilder.CreateBox('wayfinder-coat-right', { width: 0.31, height: 0.64, depth: 0.08 }, scene);
  coatLeft.parent = fallback; coatRight.parent = fallback;
  coatLeft.position.set(-0.18, 0.54, 0.27); coatRight.position.set(0.18, 0.61, 0.27);
  coatLeft.rotation.x = -0.08; coatRight.rotation.x = -0.04;
  coatLeft.material = fabric; coatRight.material = fabric;
  const routeHalo = MeshBuilder.CreateTorus('wayfinder-route-halo', { diameter: 0.88, thickness: 0.035, tessellation: 24 }, scene);
  routeHalo.parent = fallback; routeHalo.position.set(0, 1.82, 0.04); routeHalo.rotation.x = Math.PI / 2; routeHalo.material = visor;
  const stateNodes = Object.freeze({
    arms: Object.freeze([-1, 1].map((side) => fallback.getChildMeshes().find((mesh) => mesh.name === `operator-arm-${side}`)).filter(Boolean)),
    legs: Object.freeze([-1, 1].map((side) => fallback.getChildMeshes().find((mesh) => mesh.name === `operator-leg-${side}`)).filter(Boolean)),
    coatLeft, coatRight, routeHalo, routeSpine
  });
  root.position.set(EON_CITY_COMMAND_DISTRICT_SPAWN.x, EON_CITY_COMMAND_DISTRICT_SPAWN.y, EON_CITY_COMMAND_DISTRICT_SPAWN.z);
  root.metadata = {
    kind: 'productive-nocturne-wayfinder',
    localOnly: true,
    assetFallback: 'operator-hero',
    proceduralFallbackRoot: fallback,
    binaryAssetCandidate: 'operator-hero',
    wayfinderSchema: EON_CITY_WAYFINDER_VISUAL_PROFILE.id,
    inclusive: true,
    sexualized: false,
    cosmeticOnly: true,
    stateNodes,
    applyWayfinderState(state = 'idle', now = performance.now(), reducedMotion = false) {
      const phase = now * 0.008;
      const amplitude = reducedMotion ? 0 : (state === 'run' ? 0.54 : state === 'walk' ? 0.32 : 0.08);
      stateNodes.arms.forEach((node, index) => { node.rotation.x = Math.sin(phase + index * Math.PI) * amplitude; });
      stateNodes.legs.forEach((node, index) => { node.rotation.x = Math.sin(phase + index * Math.PI) * -amplitude; });
      coatLeft.rotation.x = -0.08 + (reducedMotion ? 0 : Math.sin(phase * 0.5) * (state === 'run' ? 0.12 : 0.04));
      coatRight.rotation.x = -0.04 + (reducedMotion ? 0 : Math.cos(phase * 0.5) * (state === 'run' ? 0.1 : 0.035));
      routeHalo.scaling.setAll(state === 'interact' || state === 'inspect' ? 1.12 : state === 'celebrate' ? 1.22 : 1);
      routeSpine.scaling.y = state === 'sit-work' ? 0.82 : 1;
      fallback.position.y = state === 'sit-work' ? -0.34 : state === 'recovery' ? 0.08 : 0;
      fallback.rotation.z = state === 'turn' && !reducedMotion ? Math.sin(phase * .35) * .04 : 0;
    }
  };
  return root;
}

function addEonbot(scene, operator, vectorArt, companionPlan = createEonCityEonbotCompanionPlan(), rigPlan = createEonCityEonbotRigPlan()) {
  const plan = companionPlan || createEonCityEonbotCompanionPlan();
  const rig = rigPlan || createEonCityEonbotRigPlan({ companionSkinId: plan.visual.skinId });
  const palette = plan.visual.palette;
  const profile = rig.rig;
  const staging = rig.staging;
  const root = new TransformNode('eonbot-drone', scene);
  const fallback = new TransformNode('eonbot-procedural-fallback', scene);
  fallback.parent = root;
  const shell = MeshBuilder.CreateSphere('eonbot-shell', { diameter: .6, segments: profile.shellSegments }, scene);
  shell.parent = fallback;
  shell.material = makeMaterial(scene, 'eonbot-shell-material', { diffuse: palette.shell, emissive: palette.caption, intensity: .92, metallic: .38, roughness: .18 });
  const core = MeshBuilder.CreateSphere('eonbot-core', { diameter: .24, segments: profile.coreSegments }, scene);
  core.parent = fallback;
  core.material = makeMaterial(scene, 'eonbot-core-material', { diffuse: palette.core, emissive: palette.ring, intensity: 1.08, metallic: .2, roughness: .12 });
  const ringMaterial = makeMaterial(scene, 'eonbot-ring-material', { diffuse: palette.ring, emissive: palette.ring, intensity: 1.05, metallic: .22, roughness: .14 });
  const orbitRings = profile.componentIds.orbitRings.map((id, index) => {
    const ring = MeshBuilder.CreateTorus(`eonbot-${id}`, { diameter: .86 + (index * .11), thickness: .052, tessellation: 18 + (index * 2) }, scene);
    ring.parent = fallback;
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = index * (Math.PI / Math.max(1, profile.orbitRingCount));
    ring.material = ringMaterial;
    return ring;
  });
  const fins = profile.componentIds.fins.map((id, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const tier = Math.floor(index / 2);
    const fin = MeshBuilder.CreateBox(`eonbot-${id}`, { width: .1, height: .2 + (tier * .03), depth: .38 }, scene);
    fin.parent = fallback;
    fin.position.set(side * (.32 + (tier * .04)), tier === 0 ? 0 : (tier === 1 ? .14 : -.14), 0);
    fin.rotation.z = side * (.38 + (tier * .08));
    fin.material = ringMaterial;
    return fin;
  });
  const stageBeacons = profile.componentIds.stageBeacons.map((id, index) => {
    const beacon = MeshBuilder.CreateCylinder(`eonbot-${id}`, { height: .08 + (index * .02), diameterTop: .075, diameterBottom: .13, tessellation: 10 }, scene);
    beacon.parent = fallback;
    beacon.position.set((index === 0 ? -.24 : .24), -.33, .08);
    beacon.material = ringMaterial;
    return beacon;
  });
  const lamp = new PointLight('eonbot-lamp', new Vector3(0, 0, 0), scene);
  lamp.parent = root;
  lamp.diffuse = color(palette.lamp);
  lamp.intensity = staging.lightIntensity;
  lamp.range = staging.lightRange;
  const haloDecals = profile.componentIds.halos.map((id, index) => createVectorArtDecal(scene, vectorArt, {
    name: `eonbot-${id}`,
    artId: 'eonbot-halo',
    position: new Vector3(0, 2.72 + (index * .05), 5.12),
    width: .84 + (index * .2),
    height: .84 + (index * .2),
    billboard: true
  })).filter(Boolean);
  const caption = createDistrictSign(scene, 'eonbot-companion-caption', plan.caption.text.toUpperCase(), new Vector3(0, staging.captionOffset.y, 0), palette.caption, .96);
  if (caption) caption.parent = fallback;
  root.metadata = {
    kind: 'eonbot-companion-procedural-rig',
    companionSchema: plan.schema,
    rigSchema: rig.schema,
    companionId: plan.identity.id,
    skinId: plan.visual.skinId,
    rigQuality: rig.quality,
    rigDetail: rig.detail,
    meshBudget: profile.meshBudget,
    stageId: staging.id,
    captionKind: plan.caption.kind,
    localOnly: true,
    originalProceduralRig: true,
    proceduralFallbackRoot: fallback,
    proceduralFallbackExtras: haloDecals,
    binaryAssetCandidate: 'eonbot-companion',
    binaryAssets: true,
    remoteAssets: false,
    originalVectorHalo: haloDecals.length > 0,
    captionsFirst: true,
    truth: 'City guide only; task results remain in native work surfaces.',
    autonomousAgent: false,
    backgroundWorkStarted: false,
    providerRequestCreated: false,
    readsPrivateData: false,
    opensRoute: false,
    microphoneRequested: false,
    subscriptionEntitlementClaimed: false
  };
  root.position.set(operator.position.x + staging.followOffset.x, staging.followOffset.y, operator.position.z + staging.followOffset.z);
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused) return;
    const reduced = scene.metadata?.playReducedEffects === true;
    const motionAllowed = staging.motionEnabled && !reduced;
    const t = performance.now() * .0012;
    // W603: root formation is driven by the camera-safe companion director in
    // mountBabylonCityProof. This fallback handler animates only local details.
    haloDecals.forEach((halo, index) => halo.position.set(root.position.x, root.position.y + staging.haloOffset.y + (index * .05), root.position.z + staging.haloOffset.z));
    if (!motionAllowed) return;
    orbitRings.forEach((ring, index) => { ring.rotation.z += staging.orbitSpeed * (index + 1); });
    fins.forEach((fin, index) => { fin.rotation.y = Math.sin((t * 2.2) + index) * .16; });
    stageBeacons.forEach((beacon, index) => { beacon.rotation.y += staging.orbitSpeed * (index + 1.5); });
  });
  return root;
}
function createAmbientNpc(scene, entry, scheduleCue = null) {
  const root = new TransformNode(`ambient-city-npc-${entry.id}`, scene);
  root.position.set(entry.x, 0, entry.z);
  root.rotation.y = entry.heading;
  const accentByArchetype = Object.freeze({
    'human-wayfinder': PALETTE.teal,
    'robot-maintainer': PALETTE.cyan,
    'alien-cartographer': PALETTE.violet
  });
  const accent = accentByArchetype[entry.archetypeId] || PALETTE.cyan;
  const bodyMaterial = makeMaterial(scene, `ambient-city-npc-body-${entry.id}`, { diffuse: entry.archetypeId === 'alien-cartographer' ? '#2c1d48' : '#142940', emissive: '#15334d', intensity: .22, metallic: .42, roughness: .36 });
  const accentMaterial = makeMaterial(scene, `ambient-city-npc-accent-${entry.id}`, { diffuse: accent, emissive: accent, intensity: .88, metallic: .18, roughness: .16 });
  const faceMaterial = makeMaterial(scene, `ambient-city-npc-face-${entry.id}`, { diffuse: entry.archetypeId === 'alien-cartographer' ? '#3a5f78' : '#2a4966', emissive: '#4c88a8', intensity: .14, metallic: .14, roughness: .44 });
  const eyeMaterial = makeMaterial(scene, `ambient-city-npc-eye-${entry.id}`, { diffuse: '#ddfaff', emissive: '#ddfaff', intensity: 1.08, metallic: .08, roughness: .08 });
  const place = (mesh, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, material = bodyMaterial) => {
    mesh.parent = root;
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  };
  if (entry.archetypeId === 'robot-maintainer') {
    place(MeshBuilder.CreateBox(`ambient-city-npc-torso-${entry.id}`, { width: .68, height: .94, depth: .42 }, scene), 0, .78, 0, 0, 0, 0, bodyMaterial);
    place(MeshBuilder.CreateBox(`ambient-city-npc-head-${entry.id}`, { width: .46, height: .32, depth: .32 }, scene), 0, 1.48, -.03, 0, 0, 0, faceMaterial);
    place(MeshBuilder.CreateCylinder(`ambient-city-npc-core-${entry.id}`, { diameter: .18, height: .12, tessellation: 10 }, scene), 0, .9, -.24, Math.PI / 2, 0, 0, accentMaterial);
    for (const side of [-1, 1]) place(MeshBuilder.CreateBox(`ambient-city-npc-arm-${entry.id}-${side}`, { width: .13, height: .58, depth: .16 }, scene), side * .46, .86, 0, 0, 0, side * -.18, bodyMaterial);
  } else {
    const torsoTop = entry.archetypeId === 'alien-cartographer' ? .38 : .46;
    place(MeshBuilder.CreateCylinder(`ambient-city-npc-torso-${entry.id}`, { height: 1.02, diameterTop: torsoTop, diameterBottom: .62, tessellation: 10 }, scene), 0, .84, 0, 0, 0, 0, bodyMaterial);
    place(MeshBuilder.CreateSphere(`ambient-city-npc-head-${entry.id}`, { diameter: entry.archetypeId === 'alien-cartographer' ? .64 : .56, segments: 12 }, scene), 0, 1.58, -.02, 0, 0, 0, faceMaterial);
    place(MeshBuilder.CreateTorus(`ambient-city-npc-orbit-${entry.id}`, { diameter: entry.archetypeId === 'alien-cartographer' ? .72 : .58, thickness: .028, tessellation: 16 }, scene), 0, 2.0, 0, Math.PI / 2, 0, 0, accentMaterial);
    for (const side of [-1, 1]) place(MeshBuilder.CreateCylinder(`ambient-city-npc-leg-${entry.id}-${side}`, { height: .54, diameter: .16, tessellation: 8 }, scene), side * .16, .27, 0, 0, 0, 0, bodyMaterial);
  }
  if (entry.readableFace) {
    for (const side of [-1, 1]) place(MeshBuilder.CreateSphere(`ambient-city-npc-eye-${entry.id}-${side}`, { diameter: .07, segments: 8 }, scene), side * .11, 1.58, -.30, 0, 0, 0, eyeMaterial);
    place(MeshBuilder.CreateTorus(`ambient-city-npc-mouth-${entry.id}`, { diameter: .14, thickness: .016, tessellation: 12 }, scene), 0, 1.43, -.31, Math.PI / 2, 0, 0, accentMaterial);
  }
  root.metadata = {
    kind: 'ambient-city-npc',
    id: entry.id,
    archetypeId: entry.archetypeId,
    localVisualOnly: true,
    readableFace: entry.readableFace,
    seededMotionCue: scheduleCue?.motion || 'idle-shift',
    interactive: false,
    autonomous: false,
    privateDataVisible: false,
    remoteNetwork: false
  };
  scene.registerBeforeRender(() => {
    if (!entry.motionEnabled || scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const cue = scheduleCue || { driftRadius: 0, turnAmplitude: .11, phase: 0, motion: 'idle-shift' };
    const t = performance.now() * .00056 + entry.x * .17 + (Number(cue.phase) || 0);
    const drift = Number(cue.driftRadius) || 0;
    root.position.x = entry.x + Math.sin(t * (cue.motion === 'calibration-turn' ? 1.08 : .82)) * drift;
    root.position.z = entry.z + Math.cos(t * (cue.motion === 'wayfinding-glance' ? .72 : .54)) * drift;
    root.position.y = Math.sin(t) * .026;
    root.rotation.y = entry.heading + Math.sin(t * .7) * (Number(cue.turnAmplitude) || .11);
  });
  return root;
}

function addAmbientNpcCrowd(scene, crowdPlan, seededAmbiencePlan = null) {
  const cues = seededAmbiencePlan?.npcSchedule || [];
  const nodes = (crowdPlan?.entities || []).map((entry, index) => createAmbientNpc(scene, entry, cues[index] || null)).filter(Boolean);
  return Object.freeze({ nodes: Object.freeze(nodes), crowdPlan, cueCount: cues.length });
}

function addSeededAmbience(scene, plan) {
  const root = new TransformNode('seeded-city-ambience', scene);
  const signs = (plan?.signs || []).map((entry) => {
    const sign = createDistrictSign(scene, entry.id, entry.label, new Vector3(entry.x, entry.y, entry.z), entry.accent, entry.scale);
    if (!sign) return null;
    sign.parent = root;
    sign.metadata = { ...(sign.metadata || {}), kind: 'seeded-city-sign', localVisualOnly: true, static: true, interactive: false, privateDataVisible: false };
    return sign;
  }).filter(Boolean);
  const traffic = (plan?.traffic || []).map((entry) => {
    const node = MeshBuilder.CreateSphere(entry.id, { diameter: .18, segments: 10 }, scene);
    node.parent = root;
    node.position.set(entry.startX, entry.y, entry.startZ);
    node.material = makeMaterial(scene, `${entry.id}-material`, { diffuse: entry.accent, emissive: entry.accent, intensity: .88, metallic: .12, roughness: .2 });
    node.isPickable = false;
    node.metadata = { kind: 'seeded-city-traffic-light', localVisualOnly: true, interactive: false, privateDataVisible: false };
    return { entry, node };
  });
  const moments = (plan?.visualMoments || []).map((entry) => {
    const moment = new TransformNode(entry.id, scene);
    moment.parent = root;
    moment.position.set(entry.x, entry.y, entry.z);
    const ring = MeshBuilder.CreateTorus(`${entry.id}-ring`, { diameter: 1.04, thickness: .045, tessellation: 18 }, scene);
    ring.parent = moment;
    ring.rotation.x = Math.PI / 2;
    ring.material = makeMaterial(scene, `${entry.id}-material`, { diffuse: entry.accent, emissive: entry.accent, intensity: .62, metallic: .16, roughness: .22 });
    ring.isPickable = false;
    const label = createDistrictSign(scene, `${entry.id}-label`, entry.label, new Vector3(0, 1.02, 0), entry.accent, .54);
    if (label) label.parent = moment;
    moment.metadata = { kind: 'seeded-city-visual-moment', localVisualOnly: true, interactive: false, notification: false, calendar: false, social: false, reward: null, privateDataVisible: false };
    return { entry, moment, ring };
  });
  root.metadata = {
    kind: 'seeded-city-ambience',
    schema: plan?.schema || 'eon.city.seeded-ambience.w573.v1',
    quality: plan?.quality || 'balanced',
    seed: plan?.seed || 'eon-command-horizon',
    phase: plan?.phase?.id || 'arrival-pulse',
    staticSignCount: signs.length,
    trafficCount: traffic.length,
    visualMomentCount: moments.length,
    localVisualOnly: true,
    interactive: false,
    autonomous: false,
    privateDataVisible: false,
    remoteNetwork: false
  };
  scene.registerBeforeRender(() => {
    if (!plan?.motionEnabled || scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const t = performance.now() * .001;
    traffic.forEach(({ entry, node }) => {
      const progress = (Math.sin((t * Math.PI * 2 * entry.speed) + (entry.phase * Math.PI * 2)) + 1) / 2;
      node.position.x = entry.startX + ((entry.endX - entry.startX) * progress);
      node.position.z = entry.startZ + ((entry.endZ - entry.startZ) * progress);
    });
    moments.forEach(({ entry, moment, ring }) => {
      moment.position.y = entry.y + (Math.sin((t * 1.8) + entry.rotationSpeed) * .06);
      ring.rotation.z += entry.rotationSpeed;
    });
  });
  return Object.freeze({ root, plan, signCount: signs.length, trafficCount: traffic.length, visualMomentCount: moments.length, localVisualOnly: true });
}

function addNpcs(scene, artBudget, seededAmbiencePlan = null) {
  const quality = artBudget.npcDetail === 'silhouette' ? 'lite' : artBudget.npcDetail === 'high' ? 'cinematic' : 'balanced';
  const productionPlan = getEonCityCommandDistrictNpcPlan({ lod: quality });
  const productionController = createEonCityCommandDistrictNpcController({ lod: quality, reducedMotion: scene.metadata?.playReducedEffects === true });
  const noirRoleByArchetype = {
    'project-guide': 'archivist-guide',
    'creator-technician': 'builder-guide',
    'automation-operator': 'review-steward',
    'archive-workspace-guide': 'local-ai-observer'
  };
  const productionNodes = productionPlan.entities.map((entry, index) => {
    const created = createEonNoirGuideNpc(scene, {
      id: `district-guide-w624f-${entry.archetypeId}`,
      roleId: noirRoleByArchetype[entry.archetypeId],
      accent: entry.accent,
      position: { x: entry.path.start.x, y: 0, z: entry.path.start.z },
      quality,
      detail: entry.detail === 'silhouette' ? 'silhouette' : 'readable'
    });
    if (!created) return null;
    const root = created.root;
    root.setEnabled(entry.active);
    root.metadata = {
      ...root.metadata,
      kind: 'command-district-production-npc',
      schema: productionPlan.schema,
      archetypeId: entry.archetypeId,
      castName: entry.castName,
      title: entry.title,
      landmarkId: entry.landmarkId,
      pathId: entry.pathId,
      localOnly: true,
      presentationOnly: true,
      interactiveReviewOnly: true,
      autonomous: false,
      privateDataVisible: false
    };
    let lastUpdate = 0;
    scene.registerBeforeRender(() => {
      if (!root.isEnabled() || scene.metadata?.playPaused) return;
      const snapshot = productionController.getSnapshot();
      const npcState = snapshot.states.find((state) => state.archetypeId === entry.archetypeId)?.state || 'idle';
      root.metadata.presentationState = npcState;
      const now = performance.now();
      const updateInterval = snapshot.lod.updateHz > 0 ? 1000 / snapshot.lod.updateHz : Infinity;
      if (now - lastUpdate < updateInterval) return;
      lastUpdate = now;
      if (!snapshot.lod.motionEnabled || snapshot.reducedMotion || ['idle', 'wait', 'unavailable'].includes(npcState)) {
        root.position.y = 0;
        return;
      }
      if (npcState === 'recover') {
        root.position.set(entry.path.start.x, 0, entry.path.start.z);
        return;
      }
      const t = now * .00012 + (index * .19);
      const progress = (Math.sin(t * Math.PI * 2) + 1) / 2;
      root.position.x = entry.path.start.x + ((entry.path.end.x - entry.path.start.x) * progress);
      root.position.z = entry.path.start.z + ((entry.path.end.z - entry.path.start.z) * progress);
      root.position.y = Math.sin((t * Math.PI * 4) + index) * .025;
      const dx = entry.path.end.x - entry.path.start.x;
      const dz = entry.path.end.z - entry.path.start.z;
      root.rotation.y = Math.atan2(dx, dz) + (progress > .5 ? Math.PI : 0);
      if (['talk', 'listen', 'point'].includes(npcState)) root.rotation.y += Math.sin(t * 2) * .08;
    });
    return Object.freeze({ entry, root });
  }).filter(Boolean);
  const crowdPlan = getEonCityAmbientNpcCrowdPlan({ quality });
  const crowd = addAmbientNpcCrowd(scene, crowdPlan, seededAmbiencePlan);
  const setLod = (lod = quality) => {
    const snapshot = productionController.setLod(lod);
    productionNodes.forEach(({ root }, index) => root.setEnabled(index < snapshot.lod.activeCount));
    return snapshot;
  };
  const requestState = (archetypeId, state, options = {}) => productionController.requestState(archetypeId, state, options);
  return Object.freeze({
    nodes: Object.freeze([...productionNodes.map((entry) => entry.root), ...crowd.nodes]),
    productionNodes: Object.freeze(productionNodes),
    productionPlan,
    productionController,
    setLod,
    requestState,
    guideCount: productionNodes.filter((entry) => entry.root.isEnabled()).length,
    ambientCount: crowd.nodes.length,
    cueCount: crowd.cueCount,
    crowdPlan
  });
}

function agentPresencePosition(role, index) {
  const positions = {
    coordinator: [0.8, -5.8],
    researcher: [7.1, -4.7],
    builder: [-7.0, -4.3],
    reviewer: [7.3, 4.2],
    'local-runner': [6.6, 5.2],
    guide: [-.8, -6.4]
  };
  const base = positions[role] || positions.coordinator;
  const offsets = [[0, 0], [.72, .48], [-.68, .42], [.52, -.58]];
  const offset = offsets[index % offsets.length];
  return new Vector3(base[0] + offset[0], 0, base[1] + offset[1]);
}

function createAgentPresenceLabel(scene, cue, index) {
  const texture = createSafeDynamicTexture(scene, `agent-presence-label-${index}-${Date.now()}`, 720, 176, false);
  if (!texture) return null;
  const context = texture.getContext();
  context.clearRect(0, 0, 720, 176);
  context.fillStyle = 'rgba(4, 14, 30, 0.88)';
  context.fillRect(8, 8, 704, 160);
  context.strokeStyle = cue.accent;
  context.lineWidth = 5;
  context.strokeRect(12, 12, 696, 152);
  texture.drawText(cue.title, null, 72, '700 34px monospace', '#eef8ff', 'transparent', true, true);
  texture.drawText(cue.bubble, null, 122, '500 20px monospace', '#c6d9ef', 'transparent', true, true);
  const material = makeMaterial(scene, `agent-presence-label-material-${index}-${Date.now()}`, { diffuse: PALETTE.glass, emissive: cue.accent, intensity: 1.06, alpha: .98, metallic: .12, roughness: .2 });
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.opacityTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.backFaceCulling = false;
  const plane = MeshBuilder.CreatePlane(`agent-presence-label-${index}`, { width: 3.5, height: .86 }, scene);
  plane.position.set(0, 2.45, 0);
  plane.billboardMode = 2;
  plane.material = material;
  return plane;
}

function makeAgentPresenceActor(scene, entry, index, preferences) {
  const visual = resolveCityAgentVisual(entry, preferences);
  const cue = visual;
  const root = new TransformNode(`agent-presence-${entry.id || index}`, scene);
  const bodyMaterial = makeMaterial(scene, `agent-presence-body-${index}`, { diffuse: '#14243c', emissive: cue.accent, intensity: entry.status === 'waiting' || entry.status === 'queued' ? .36 : .66, metallic: .42, roughness: .26 });
  const visorMaterial = makeMaterial(scene, `agent-presence-visor-${index}`, { diffuse: cue.accent, emissive: cue.accent, intensity: 1.12, metallic: .24, roughness: .14 });
  const body = visual.silhouette === 'orbital-companion' || visual.silhouette === 'guide-light'
    ? MeshBuilder.CreateSphere(`agent-presence-body-${index}`, { diameter: .62, segments: 12 }, scene)
    : MeshBuilder.CreateCylinder(`agent-presence-body-${index}`, { height: 1.08, diameterTop: .42, diameterBottom: .58, tessellation: 10 }, scene);
  body.parent = root;
  body.position.y = visual.silhouette === 'orbital-companion' || visual.silhouette === 'guide-light' ? 1.08 : .54;
  body.material = bodyMaterial;
  const head = MeshBuilder.CreateSphere(`agent-presence-head-${index}`, { diameter: visual.silhouette === 'guide-light' ? .27 : .39, segments: 12 }, scene);
  head.parent = root;
  head.position.y = visual.silhouette === 'orbital-companion' || visual.silhouette === 'guide-light' ? 1.25 : 1.31;
  head.material = visorMaterial;
  const ring = MeshBuilder.CreateTorus(`agent-presence-ring-${index}`, { diameter: visual.silhouette === 'orbital-companion' ? 1.02 : .86, thickness: .06, tessellation: 24 }, scene);
  ring.parent = root;
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .05;
  ring.material = visorMaterial;
  // Original silhouette kit: these inexpensive components distinguish roles
  // while the proper GLB character kit is introduced in a later art wave.
  if (visual.silhouette === 'workshop-builder') {
    for (const side of [-1, 1]) {
      const arm = MeshBuilder.CreateBox(`agent-presence-builder-arm-${index}-${side}`, { width: .16, height: .56, depth: .18 }, scene);
      arm.parent = root; arm.position.set(side * .38, .7, 0); arm.rotation.z = side * .32; arm.material = bodyMaterial;
    }
    const pack = MeshBuilder.CreateBox(`agent-presence-builder-pack-${index}`, { width: .42, height: .5, depth: .16 }, scene);
    pack.parent = root; pack.position.set(0, .82, .30); pack.material = visorMaterial;
  } else if (visual.silhouette === 'archive-scout') {
    const halo = MeshBuilder.CreateTorus(`agent-presence-archive-halo-${index}`, { diameter: .56, thickness: .035, tessellation: 18 }, scene);
    halo.parent = root; halo.rotation.x = Math.PI / 2; halo.position.y = 1.64; halo.material = visorMaterial;
  } else if (visual.silhouette === 'review-steward') {
    const mantle = MeshBuilder.CreateBox(`agent-presence-review-mantle-${index}`, { width: .72, height: .72, depth: .10 }, scene);
    mantle.parent = root; mantle.position.set(0, .65, .24); mantle.material = bodyMaterial;
  } else if (visual.silhouette === 'local-engineer') {
    const core = MeshBuilder.CreatePolyhedron(`agent-presence-local-core-${index}`, { type: 1, size: .22 }, scene);
    core.parent = root; core.position.set(0, 1.55, 0); core.material = visorMaterial;
  }
  const label = createAgentPresenceLabel(scene, cue, index);
  if (label) label.parent = root;
  root.position.copyFrom(agentPresencePosition(entry.role, index));
  root.metadata = { agentPresence: true, cue, visual, role: entry.role, status: entry.status, localOnly: true, externalEffect: false };
  scene.registerBeforeRender(() => {
    const t = performance.now() * .001;
    const bob = visual.motion === 'focus' ? .075 : visual.motion === 'handoff' ? .11 : .045;
    root.position.y = Math.sin(t * (visual.motion === 'focus' ? 2.4 : 1.45) + index) * bob;
    ring.rotation.z += visual.motion === 'attention' ? .045 : .018;
    if (visual.motion === 'handoff') root.rotation.y = Math.sin(t * 2.2 + index) * .42;
    else root.rotation.y = Math.sin(t * .72 + index) * .14;
  });
  return root;
}


function makeAgentPresenceHuddle(scene, entries, preferences) {
  const visible = Array.isArray(entries) ? entries.slice(0, 4) : [];
  const collaboration = getAgentPresenceCollaboration(visible);
  if (preferences?.enabled === false || visible.length < 2 || collaboration.mode === 'idle') return null;
  const root = new TransformNode('agent-presence-huddle', scene);
  const anchors = visible.map((entry, index) => agentPresencePosition(entry.role, index));
  const centre = anchors.reduce((sum, point) => sum.add(point), Vector3.Zero()).scale(1 / anchors.length);
  anchors.forEach((point, index) => {
    const line = MeshBuilder.CreateLines(`agent-presence-huddle-link-${index}`, { points: [centre, point] }, scene);
    line.parent = root;
    line.color = color(collaboration.accent);
    line.alpha = .42;
  });
  const ringMaterial = makeMaterial(scene, 'agent-presence-huddle-material', { diffuse: collaboration.accent, emissive: collaboration.accent, intensity: .9, metallic: .16, roughness: .18 });
  const ring = MeshBuilder.CreateTorus('agent-presence-huddle-ring', { diameter: 1.05, thickness: .055, tessellation: 20 }, scene);
  ring.parent = root;
  ring.rotation.x = Math.PI / 2;
  ring.position.copyFrom(centre);
  ring.position.y = .055;
  ring.material = ringMaterial;
  const label = createAgentPresenceLabel(scene, collaboration, 'huddle');
  if (label) {
    label.parent = root;
    label.position.copyFrom(centre);
    label.position.y = 2.18;
  }
  root.metadata = { agentPresenceHuddle: true, collaboration, localOnly: true, externalEffect: false };
  return root;
}

function makeAgentPresenceOutcomeBeacon(scene, outcome, preferences) {
  if (preferences?.enabled === false || !outcome?.visible) return null;
  const root = new TransformNode('agent-presence-outcome', scene);
  const material = makeMaterial(scene, 'agent-presence-outcome-material', { diffuse: outcome.accent, emissive: outcome.accent, intensity: 1.02, metallic: .22, roughness: .18 });
  const pedestal = MeshBuilder.CreateCylinder('agent-presence-outcome-pedestal', { diameter: .94, height: .1, tessellation: 18 }, scene);
  pedestal.parent = root;
  pedestal.position.y = .05;
  pedestal.material = makeMaterial(scene, 'agent-presence-outcome-pedestal-material', { diffuse: '#14243c', emissive: outcome.accent, intensity: .3, metallic: .34, roughness: .32 });
  const beacon = MeshBuilder.CreatePolyhedron('agent-presence-outcome-beacon', { type: 1, size: .32 }, scene);
  beacon.parent = root;
  beacon.position.y = .55;
  beacon.material = material;
  const ring = MeshBuilder.CreateTorus('agent-presence-outcome-ring', { diameter: 1.05, thickness: .052, tessellation: 20 }, scene);
  ring.parent = root;
  ring.rotation.x = Math.PI / 2;
  ring.position.y = .09;
  ring.material = material;
  const label = createAgentPresenceLabel(scene, outcome, 'outcome');
  if (label) {
    label.parent = root;
    label.position.set(0, 1.72, 0);
  }
  root.position.set(-1.2, 0, -6.6);
  root.metadata = { agentPresenceOutcome: true, mode: outcome.mode, localOnly: true, externalEffect: false };
  return root;
}

function syncAgentPresence(scene, root, actors, huddleRef, outcomeRef, entries = [], preferences = {}, outcome = null) {
  actors.forEach((actor) => actor.dispose(false, true));
  actors.clear();
  if (huddleRef?.current) huddleRef.current.dispose(false, true);
  if (huddleRef) huddleRef.current = null;
  if (outcomeRef?.current) outcomeRef.current.dispose(false, true);
  if (outcomeRef) outcomeRef.current = null;
  if (preferences?.enabled === false) return;
  const visible = entries.slice(0, 4);
  visible.forEach((entry, index) => {
    const actor = makeAgentPresenceActor(scene, entry, index, preferences);
    actor.parent = root;
    actors.set(entry.id || `agent-${index}`, actor);
  });
  const huddle = makeAgentPresenceHuddle(scene, visible, preferences);
  if (huddle) {
    huddle.parent = root;
    if (huddleRef) huddleRef.current = huddle;
  }
  const beacon = makeAgentPresenceOutcomeBeacon(scene, outcome || getAgentPresenceOutcome({ latest: null }), preferences);
  if (beacon) {
    beacon.parent = root;
    if (outcomeRef) outcomeRef.current = beacon;
  }
}

function createDistrictSign(scene, name, label, position, accent, width = 2.3) {
  const texture = createSafeDynamicTexture(scene, `${name}-sign-texture`, 512, 128, false);
  if (!texture) return null;
  const context = texture.getContext();
  context.clearRect(0, 0, 512, 128);
  context.fillStyle = 'rgba(4, 14, 30, 0.78)';
  context.fillRect(8, 8, 496, 112);
  context.strokeStyle = accent;
  context.lineWidth = 4;
  context.strokeRect(10, 10, 492, 108);
  texture.drawText(label, null, 83, '700 42px monospace', '#dbe8ff', 'transparent', true, true);
  const material = makeMaterial(scene, `${name}-sign-material`, { diffuse: PALETTE.glass, emissive: accent, intensity: 1.1, alpha: 0.96, metallic: 0.18, roughness: 0.12 });
  material.diffuseTexture = texture;
  material.emissiveTexture = texture;
  material.opacityTexture = texture;
  material.useAlphaFromDiffuseTexture = true;
  material.backFaceCulling = false;
  const plane = MeshBuilder.CreatePlane(`${name}-sign`, { width, height: width * 0.27 }, scene);
  plane.position.copyFrom(position);
  plane.billboardMode = 2;
  plane.material = material;
  return plane;
}

function addDistrictFurnishings(scene, artBudget, seed, vectorArt, quality = 'balanced') {
  const random = proceduralSeed(`${seed}:furnishings`);
  const railMaterial = makeMaterial(scene, 'district-rail-material', { diffuse: PALETTE.steelEdge, emissive: PALETTE.teal, intensity: 0.42, metallic: 0.58, roughness: 0.25, baseTexture: vectorArt?.getTexture?.('carbon-weave', { uScale: 2.2, vScale: 2.2 }) });
  const lampMaterial = makeMaterial(scene, 'district-lamp-material', { diffuse: PALETTE.glass, emissive: PALETTE.cyan, intensity: 1.15, metallic: 0.22, roughness: 0.16 });
  for (let index = 0; index < artBudget.streetProps; index += 1) {
    const angle = (index / artBudget.streetProps) * Math.PI * 2;
    const radius = 10.5 + random() * 2.1;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const post = MeshBuilder.CreateCylinder(`district-lamp-post-${index}`, { height: 1.85, diameter: 0.075, tessellation: 8 }, scene);
    post.position.set(x, 0.925, z);
    post.material = railMaterial;
    const lamp = MeshBuilder.CreateSphere(`district-lamp-${index}`, { diameter: 0.19, segments: 8 }, scene);
    lamp.position.set(x, 1.9, z);
    lamp.material = lampMaterial;
  }
  // CITY-ART: skyline depth now comes from the original EON Noir tapered-silhouette world layer.
  // Keep this vector horizon as an additional low-cost atmospheric plate.
  addVectorArtSkyline(scene, vectorArt, quality);
  createVectorArtDecal(scene, vectorArt, { name: 'city-eon-monogram', artId: 'eon-monogram', position: new Vector3(0, 1.72, -7.38), width: 1.08, height: 1.08, billboard: true });
  const signs = [
    ['sign-command', 'COMMAND CENTRE', new Vector3(0, 4.9, -9.38), PALETTE.cyan],
    ['sign-workshop', 'BUILD', new Vector3(-8.4, 3.1, -6.38), PALETTE.teal],
    ['sign-archive', 'KNOWLEDGE', new Vector3(8.2, 3.5, -5.62), PALETTE.violet],
    ['sign-relay', 'REALM', new Vector3(-7.2, 2.5, 4.52), PALETTE.amber],
    ['sign-observatory', 'LOCAL AI', new Vector3(7.3, 2.7, 4.68), PALETTE.mint],
    ['sign-eon', 'EON CITY', new Vector3(0, 2.25, 4.2), PALETTE.rose]
  ];
  signs.slice(0, artBudget.signCount).forEach(([name, label, position, accent]) => createDistrictSign(scene, name, label, position, accent));
}

function addDistrictRouteBeacons(scene, artBudget) {
  const beaconSpecs = [
    ['command-centre', 0, -7.2, PALETTE.cyan],
    ['workshop', -8.4, -4.1, PALETTE.teal],
    ['archive', 8.2, -3.2, PALETTE.violet],
    ['relay', -7.2, 6.4, PALETTE.amber],
    ['observatory', 7.3, 6.7, PALETTE.mint]
  ];
  const cap = artBudget.npcDetail === 'silhouette' ? 3 : beaconSpecs.length;
  return beaconSpecs.slice(0, cap).map(([id, x, z, accent], index) => {
    const root = new TransformNode(`district-route-beacon-${id}`, scene);
    const base = MeshBuilder.CreateCylinder(`district-route-beacon-base-${id}`, { diameter: 0.62, height: 0.08, tessellation: 18 }, scene);
    base.parent = root; base.position.y = 0.04;
    base.material = makeMaterial(scene, `district-route-beacon-base-material-${id}`, { diffuse: '#132640', emissive: accent, intensity: 0.24, metallic: 0.42, roughness: 0.3 });
    const beam = MeshBuilder.CreateCylinder(`district-route-beacon-beam-${id}`, { diameter: 0.05, height: 1.8, tessellation: 10 }, scene);
    beam.parent = root; beam.position.y = 0.95;
    beam.material = makeMaterial(scene, `district-route-beacon-beam-material-${id}`, { diffuse: accent, emissive: accent, intensity: 0.68, metallic: 0.16, roughness: 0.16, alpha: 0.82 });
    const ring = MeshBuilder.CreateTorus(`district-route-beacon-ring-${id}`, { diameter: 0.82, thickness: 0.035, tessellation: 18 }, scene);
    ring.parent = root; ring.position.y = 0.12; ring.rotation.x = Math.PI / 2;
    ring.material = beam.material;
    root.position.set(x, 0, z);
    root.metadata = { kind: 'route-beacon', landmarkId: id, localOnly: true, status: 'route-available-on-proximity' };
    scene.registerBeforeRender(() => {
      if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
      ring.rotation.z += 0.014 + index * 0.001;
    });
    return root;
  });
}

function addRain(scene, quality, seed) {
  const random = proceduralSeed(seed);
  const material = makeMaterial(scene, 'rain-material', { diffuse: '#164166', emissive: '#4ae5ff', intensity: 0.55, alpha: 0.48, metallic: 0, roughness: 0.1 });
  const drops = [];
  for (let index = 0; index < quality.rain; index += 1) {
    const drop = MeshBuilder.CreateBox(`rain-${index}`, { width: 0.018, height: 0.66 + random() * 0.72, depth: 0.018 }, scene);
    drop.position.set((random() - 0.5) * 27, random() * 9 + 0.5, (random() - 0.5) * 27);
    drop.material = material;
    drops.push({ mesh: drop, speed: 0.14 + random() * 0.15 });
  }
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const delta = scene.getEngine().getDeltaTime();
    for (const item of drops) {
      item.mesh.position.y -= item.speed * delta * 0.013;
      if (item.mesh.position.y < 0.05) item.mesh.position.y = 8.5 + random() * 3;
    }
  });
  return Object.freeze({
    count: drops.length,
    setEnabled(enabled) {
      for (const item of drops) item.mesh.isVisible = Boolean(enabled);
    }
  });
}

function addLivingCitySystems(scene, quality, _artBudget) {
  const root = new TransformNode('living-city-systems', scene);
  const initialProfile = getCityLivingSystemsProfile({ quality, reducedEffects: quality === 'lite' });
  let reducedEffects = quality === 'lite';
  const boardSteel = makeMaterial(scene, 'living-mission-board-steel', { diffuse: '#101f36', emissive: '#173f5a', intensity: 0.26, metallic: 0.64, roughness: 0.24 });
  const boardSignal = makeMaterial(scene, 'living-mission-board-signal', { diffuse: '#173652', emissive: PALETTE.cyan, intensity: quality === 'lite' ? 0.52 : 0.92, metallic: 0.22, roughness: 0.16 });
  const board = MeshBuilder.CreateBox('living-mission-board', { width: 2.7, height: 2.08, depth: 0.14 }, scene);
  board.parent = root;
  board.position.set(3.22, 1.27, -6.08);
  board.material = boardSteel;
  board.metadata = { kind: 'mission-board', visibleOnly: true, autoStart: false, autoOpenRoute: false, reward: null, storesUserContent: false, localOnly: true };
  const boardFrame = MeshBuilder.CreateBox('living-mission-board-frame', { width: 2.94, height: 2.34, depth: 0.07 }, scene);
  boardFrame.parent = root;
  boardFrame.position.set(3.22, 1.27, -6.16);
  boardFrame.material = boardSignal;
  const boardBase = MeshBuilder.CreateCylinder('living-mission-board-base', { diameter: 1.08, height: 0.12, tessellation: 18 }, scene);
  boardBase.parent = root;
  boardBase.position.set(3.22, 0.06, -6.08);
  boardBase.material = boardSteel;
  const boardRing = MeshBuilder.CreateTorus('living-mission-board-ring', { diameter: 1.22, thickness: 0.035, tessellation: 22 }, scene);
  boardRing.parent = root;
  boardRing.position.set(3.22, 0.14, -6.08);
  boardRing.rotation.x = Math.PI / 2;
  boardRing.material = boardSignal;
  createDistrictSign(scene, 'living-mission-board-title', 'MISSION BOARD', new Vector3(3.22, 2.6, -6.23), PALETTE.cyan, 2.36);

  const dawnWash = new PointLight('living-dawn-wash', new Vector3(-1.8, 7.9, 5.4), scene);
  dawnWash.diffuse = color('#b6a2ff');
  dawnWash.intensity = reducedEffects ? 0.18 : 1.35;
  dawnWash.range = 17;
  const podMaterial = makeMaterial(scene, 'living-ambient-pod-material', { diffuse: '#172a4a', emissive: PALETTE.violet, intensity: 0.88, metallic: 0.2, roughness: 0.14 });
  const podAnchors = [[-10.7, 3.1], [-8.7, 8.3], [9.8, 7.7], [10.9, 2.8], [-1.9, 11.1]];
  const pods = podAnchors.slice(0, initialProfile.ambientPodCount).map(([x, z], index) => {
    const pod = MeshBuilder.CreateSphere(`living-ambient-light-pod-${index}`, { diameter: 0.28, segments: 10 }, scene);
    pod.parent = root;
    pod.position.set(x, 1.72 + index * 0.08, z);
    pod.material = podMaterial;
    pod.metadata = { kind: 'ambient-light-pod', localOnly: true, remoteTraffic: false, userTracking: false };
    return { pod, x, z, index };
  });

  root.metadata = { kind: 'living-city-systems', localOnly: true, weather: 'visual-only', dayNight: 'visual-only', missionBoard: 'local-wayfinding', remoteTraffic: false, userData: false };
  const setReducedEffects = (value) => {
    reducedEffects = Boolean(value);
    dawnWash.intensity = reducedEffects ? 0.18 : (quality === 'cinematic' ? 1.62 : 1.35);
    pods.forEach(({ pod }) => { pod.setEnabled(!reducedEffects); });
    boardRing.setEnabled(true);
    return getCityLivingSystemsProfile({ quality, reducedEffects });
  };
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused) return;
    const cycleMs = EON_CITY_LIVING_SYSTEMS_BLUEPRINT.dayNight.cycleMs;
    const t = performance.now();
    const phase = (Math.sin((t / cycleMs) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    dawnWash.intensity = reducedEffects ? 0.18 : (0.74 + phase * (quality === 'cinematic' ? 1.06 : 0.76));
    if (scene.metadata?.playReducedEffects || reducedEffects) return;
    boardRing.rotation.z += 0.012;
    pods.forEach(({ pod, x, z, index }) => {
      const drift = t * 0.00042 + index;
      pod.position.x = x + Math.sin(drift) * 0.46;
      pod.position.y = 1.72 + index * 0.08 + Math.sin(drift * 1.7) * 0.24;
      pod.position.z = z + Math.cos(drift * 0.84) * 0.32;
    });
  });
  return Object.freeze({
    root,
    setReducedEffects,
    getSummary: () => Object.freeze({
      id: EON_CITY_LIVING_SYSTEMS_BLUEPRINT.id,
      title: EON_CITY_LIVING_SYSTEMS_BLUEPRINT.title,
      profile: getCityLivingSystemsProfile({ quality, reducedEffects }),
      missionBoard: true,
      ambientPodCount: reducedEffects ? 0 : pods.length,
      visualOnly: true,
      localOnly: true,
      remoteTraffic: false,
      userData: false,
      binaryAssets: false
    })
  });
}

function addLighting(scene, quality, artBudget, artDirection = getCityCinematicArtDirection({ quality }), worldRenderProfile = getEonUniverseRenderProfile({ quality })) {
  scene.clearColor = Color4.FromHexString(`${artDirection.clearColor}ff`);
  scene.ambientColor = color('#1a2f56');
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = color(artDirection.fogColor);
  scene.fogDensity = artBudget.fogDensity * artDirection.fogDensityMultiplier * worldRenderProfile.fogMultiplier;
  const hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, -0.3), scene);
  hemi.intensity = quality === 'lite' ? 1.2 : 1.55;
  hemi.diffuse = color('#8fa9ff');
  hemi.groundColor = color('#071220');
  const key = new DirectionalLight('key', new Vector3(-0.45, -1, 0.35), scene);
  key.position = new Vector3(9, 17, -8);
  key.intensity = quality === 'cinematic' ? 1.75 : 1.1;
  key.diffuse = color('#c8dcff');
  const teal = new PointLight('street-teal', new Vector3(-7, 4.4, 2), scene);
  teal.diffuse = color('#39e7d3');
  teal.intensity = quality === 'lite' ? 4.1 : 7.4;
  teal.range = 16;
  const violet = new PointLight('street-violet', new Vector3(6, 5.4, -6), scene);
  violet.diffuse = color(PALETTE.violet);
  violet.intensity = quality === 'lite' ? 3.7 : 7;
  violet.range = 17;
  const amber = new PointLight('archive-amber', new Vector3(8.2, 3.6, -3.2), scene);
  amber.diffuse = color(PALETTE.amber);
  amber.intensity = quality === 'lite' ? 1.2 : 2.8;
  amber.range = 8;
  const glow = quality === 'lite' ? null : (() => {
    const layer = new GlowLayer('neon-command-glow', scene, { mainTextureFixedSize: quality === 'cinematic' ? 1024 : 512, blurKernelSize: quality === 'cinematic' ? 40 : 24 });
    layer.intensity = worldRenderProfile.glowIntensity;
    return layer;
  })();
  return Object.freeze({ glow, key, hemi, teal, violet, amber });
}

function addOpenSkyProfile(scene, initialPlan, lighting) {
  const root = new TransformNode('w574-open-sky-profile-root', scene);
  const shell = MeshBuilder.CreateSphere('w574-open-sky-shell', { diameter: 62, segments: 16 }, scene);
  shell.parent = root;
  shell.position.y = 8.5;
  shell.isPickable = false;
  const shellMaterial = makeMaterial(scene, 'w574-open-sky-shell-material', { diffuse: initialPlan.sky.shellColor, emissive: initialPlan.sky.shellColor, intensity: 0.12, alpha: 0.2, metallic: 0, roughness: 1 });
  shellMaterial.backFaceCulling = false;
  shellMaterial.disableLighting = true;
  shell.material = shellMaterial;
  const bands = Array.from({ length: 2 }, (_, index) => {
    const node = MeshBuilder.CreateTorus(`w574-open-sky-band-${index + 1}`, { diameter: 18 + (index * 6), thickness: 0.052, tessellation: 36 }, scene);
    node.parent = root;
    node.position.y = 7.5 + (index * 2.45);
    node.rotation.x = Math.PI / 2;
    node.isPickable = false;
    const material = makeMaterial(scene, `w574-open-sky-band-material-${index + 1}`, { diffuse: '#ffffff', emissive: '#ffffff', intensity: 0.25, alpha: 0.12, metallic: 0, roughness: 1 });
    material.backFaceCulling = false;
    material.disableLighting = true;
    node.material = material;
    node.setEnabled(false);
    return { node, material };
  });
  let activePlan = initialPlan;
  let localFrame = 0;

  const apply = (plan) => {
    activePlan = plan;
    scene.clearColor = Color4.FromHexString(`${plan.sky.clearColor}ff`);
    scene.ambientColor = color(plan.lighting.ambientColor);
    scene.fogColor = color(plan.sky.fogColor);
    scene.fogDensity = plan.sky.fogDensity;
    shellMaterial.baseColor = color(plan.sky.shellColor);
    shellMaterial.emissiveColor = color(plan.sky.shellColor).scale(0.13);
    shellMaterial.alpha = plan.sky.staticFallback ? 0.14 : 0.2;
    lighting.hemi.diffuse = color(plan.lighting.hemiColor);
    lighting.hemi.groundColor = color(plan.lighting.groundColor);
    lighting.key.diffuse = color(plan.lighting.keyColor);
    lighting.key.intensity = plan.lighting.keyIntensity;
    lighting.key.direction = new Vector3(...plan.lighting.keyDirection);
    if (lighting.glow) lighting.glow.intensity = plan.lighting.glowIntensity;
    bands.forEach(({ node, material }, index) => {
      const layer = plan.atmosphereLayers[index];
      node.setEnabled(Boolean(layer));
      if (!layer) return;
      node.position.y = layer.height;
      node.scaling.x = layer.diameter / (18 + (index * 6));
      node.scaling.z = layer.diameter / (18 + (index * 6));
      material.baseColor = color(layer.color);
      material.emissiveColor = color(layer.color).scale(0.45);
      material.alpha = layer.alpha;
    });
    root.metadata = Object.freeze({ schema: plan.schema, profileId: plan.profile.id, localVisualOnly: true, sessionOnly: true, interactive: false, sourceControlled: true });
    return Object.freeze({ ok: true, profileId: plan.profile.id, label: plan.profile.label, localVisualOnly: true, sessionOnly: true });
  };
  apply(initialPlan);
  scene.registerBeforeRender(() => {
    if (!activePlan.motionEnabled || scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    localFrame = (localFrame + 1) % 100000;
    activePlan.atmosphereLayers.forEach((layer, index) => {
      const band = bands[index]?.node;
      if (!band) return;
      band.rotation.z += layer.rotationStep;
      band.position.y = layer.height + (Math.sin((localFrame * 0.017) + index) * 0.035);
    });
  });
  const getSummary = () => Object.freeze({
    schema: activePlan.schema,
    profileId: activePlan.profile.id,
    label: activePlan.profile.label,
    quality: activePlan.quality,
    atmosphereLayerCount: activePlan.atmosphereLayers.length,
    motionEnabled: activePlan.motionEnabled && !scene.metadata?.playPaused && !scene.metadata?.playReducedEffects,
    motionState: scene.metadata?.playPaused ? 'city-paused' : (scene.metadata?.playReducedEffects ? 'reduced-effects' : activePlan.motionState),
    localVisualOnly: true,
    sourceControlled: true,
    sessionOnly: true,
    interactive: false,
    privateDataVisible: false
  });
  return Object.freeze({ root, apply, getSummary });
}

function addCinematicShadows(scene, key, quality) {
  if (quality !== 'cinematic' || !key) {
    return Object.freeze({ enabled: false, quality: String(quality || 'balanced'), casterCount: 0, reason: 'cinematic-opt-in-required' });
  }
  const shadows = new ShadowGenerator(1024, key);
  shadows.usePercentageCloserFiltering = true;
  shadows.bias = 0.0008;
  shadows.normalBias = 0.02;
  shadows.setDarkness(0.34);
  const excluded = /(?:rain|ambient-light-pod|display|beacon|signal|marker|ring|inlay|window)/i;
  const casters = scene.meshes
    .filter((mesh) => mesh && mesh.isEnabled() && mesh.getTotalVertices() > 0 && !excluded.test(String(mesh.name || '')))
    // The one approved W649 dynamic shadow owner (the controllable player) is
    // prioritised ahead of decorative procedural geometry. District visuals
    // receive shadows but do not become unbounded dynamic casters.
    .sort((left, right) => Number(Boolean(right?.metadata?.eonCityShadowCasterEligible)) - Number(Boolean(left?.metadata?.eonCityShadowCasterEligible)))
    .slice(0, 144);
  for (const mesh of casters) {
    shadows.addShadowCaster(mesh, false);
    mesh.receiveShadows = true;
  }
  return Object.freeze({ enabled: true, quality: 'cinematic', casterCount: casters.length, resolution: 1024, filtering: 'PCF', localOnly: true });
}

const AUTHORED_SLICE_ACCENTS = Object.freeze({
  'arrival-gate': PALETTE.mint,
  'command-district': PALETTE.violet,
  'creator-atrium': '#8ee7ff',
  'forge-bay': PALETTE.amber
});

function createAuthoredSliceLabel(scene, region, position, accent, visible = true) {
  if (!visible) return null;
  const texture = createSafeDynamicTexture(scene, `authored-slice-label-${region.id}`, 512, 144, true);
  if (!texture) return null;
  const context = texture.getContext();
  context.clearRect(0, 0, 512, 144);
  context.fillStyle = 'rgba(5, 11, 22, .78)';
  context.fillRect(0, 0, 512, 144);
  context.strokeStyle = accent;
  context.lineWidth = 4;
  context.strokeRect(3, 3, 506, 138);
  context.font = '600 27px system-ui, sans-serif';
  context.fillStyle = '#eff7ff';
  context.fillText(region.chapter.toUpperCase(), 26, 47);
  context.font = '700 39px system-ui, sans-serif';
  context.fillStyle = accent;
  context.fillText(region.title, 26, 101);
  texture.update();
  const label = MeshBuilder.CreatePlane(`authored-slice-label-${region.id}`, { width: 2.55, height: .72 }, scene);
  label.position.copyFrom(position);
  label.billboardMode = 2;
  label.isPickable = false;
  label.material = makeDisplayMaterial(scene, `authored-slice-label-${region.id}-material`, texture);
  label.metadata = { kind: 'authored-vertical-slice-label', regionId: region.id, localOnly: true, remoteNetwork: false, finalBinaryArt: false, userData: false };
  return label;
}

function addAuthoredVerticalSliceWayfinding(scene, vectorArt, quality) {
  const plan = getCityAuthoredVerticalSlicePlan({ quality });
  const root = new TransformNode('authored-vertical-slice-wayfinding', scene);
  const markers = [];
  let labels = 0;
  for (const region of plan.regions) {
    const accent = AUTHORED_SLICE_ACCENTS[region.id] || PALETTE.mint;
    const scale = Math.max(.6, Number(region.wayfinding?.scale || 1) * Number(plan.markerBudget.markerScale || 1));
    const markerPosition = new Vector3(region.wayfinding.x, .11, region.wayfinding.z);
    const plinth = MeshBuilder.CreateCylinder(`authored-slice-marker-${region.id}`, { diameter: .82 * scale, height: .12, tessellation: 20 }, scene);
    plinth.position.copyFrom(markerPosition);
    plinth.isPickable = false;
    plinth.parent = root;
    plinth.material = makeMaterial(scene, `authored-slice-marker-${region.id}-material`, { diffuse: '#111b2c', emissive: accent, intensity: quality === 'lite' ? .34 : .68, metallic: .3, roughness: .48 });
    plinth.metadata = { kind: 'authored-vertical-slice-marker', regionId: region.id, localOnly: true, remoteNetwork: false, finalBinaryArt: false, userData: false };
    const artId = region.artIds.find((id) => /emblem|prism|stripe/i.test(id)) || region.artIds[0];
    const decal = createVectorArtDecal(scene, vectorArt, {
      name: `authored-slice-decal-${region.id}`,
      artId,
      position: new Vector3(region.wayfinding.x, .14, region.wayfinding.z),
      width: .64 * scale,
      height: .64 * scale
    });
    if (decal) {
      decal.rotation.x = Math.PI / 2;
      decal.isPickable = false;
      decal.parent = root;
      decal.metadata = { ...decal.metadata, kind: 'authored-vertical-slice-decal', regionId: region.id };
    }
    const shouldShowLabel = labels < plan.markerBudget.maxLabelTextures;
    const label = createAuthoredSliceLabel(scene, region, new Vector3(region.wayfinding.x, region.wayfinding.y, region.wayfinding.z), accent, shouldShowLabel);
    if (label) {
      labels += 1;
      label.parent = root;
    }
    markers.push(Object.freeze({ id: region.id, artId, labelVisible: Boolean(label), scale: Math.round(scale * 100) / 100 }));
  }
  return Object.freeze({ root, plan, markers: Object.freeze(markers), activeMarkerCount: markers.length, activeLabelCount: labels, localOnly: true, remoteNetwork: false, finalBinaryArt: false });
}


function normalizePrivateProjectMissionCards(cards = [], quality = 'balanced') {
  const labelRe = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_-]{0,80}$/u;
  const states = new Set(['ready', 'focus', 'paused', 'completed', 'needs-review']);
  const seen = new Set();
  const maxCards = quality === 'lite' ? 1 : 3;
  const result = [];
  for (const card of Array.isArray(cards) ? cards : []) {
    const id = String(card?.id || '');
    const label = String(card?.label || '').replace(/\s+/g, ' ').trim().slice(0, 81);
    const state = String(card?.state || 'needs-review');
    if (!/^mission_[a-z0-9]{8,24}$/i.test(id) || seen.has(id) || !labelRe.test(label) || !states.has(state)) continue;
    seen.add(id);
    result.push(Object.freeze({ label, state }));
    if (result.length >= maxCards) break;
  }
  return Object.freeze(result);
}

function normalizePrivateProjectDistrictPlans(plans = [], quality = 'balanced') {
  const maxVisible = quality === 'lite' ? 3 : quality === 'cinematic' ? 8 : 6;
  const seen = new Set();
  const result = [];
  for (const plan of Array.isArray(plans) ? plans : []) {
    const id = String(plan?.districtId || '');
    const accent = String(plan?.palette?.accent || '');
    const label = String(plan?.displayLabel || '').replace(/\s+/g, ' ').trim().slice(0, 81);
    const anchor = plan?.geometry?.anchor || {};
    if (!/^district_[a-z0-9_-]{8,80}$/i.test(id) || seen.has(id) || !/^#[0-9a-f]{6}$/i.test(accent) || !label) continue;
    const x = clamp(Number(anchor.x) || 0, -11.2, 11.2);
    const z = clamp(Number(anchor.z) || 0, -10.4, 10.4);
    seen.add(id);
    result.push(Object.freeze({
      districtId: id,
      displayLabel: label,
      palette: Object.freeze({ id: String(plan?.palette?.id || 'signal'), label: String(plan?.palette?.label || 'Signal').slice(0, 40), accent }),
      missionState: String(plan?.missionState || 'needs-review').slice(0, 40),
      taskCards: normalizePrivateProjectMissionCards(plan?.taskCards, quality),
      visualProfile: Object.freeze({
        id: String(plan?.visualProfile?.id || 'signal-spire').replace(/[^a-z-]/gi, '').slice(0, 48) || 'signal-spire',
        silhouette: String(plan?.visualProfile?.silhouette || 'signal-spire').replace(/[^a-z-]/gi, '').slice(0, 48) || 'signal-spire'
      }),
      geometry: Object.freeze({
        anchor: Object.freeze({ x, z, heading: Number(anchor.heading) || 0 }),
        towerHeight: clamp(Number(plan?.geometry?.towerHeight) || 2.6, 2.1, 3.8),
        deckWidth: clamp(Number(plan?.geometry?.deckWidth) || 1.9, 1.4, 2.4),
        spireCount: Math.max(2, Math.min(4, Math.floor(Number(plan?.geometry?.spireCount) || 2))),
        ringRadius: clamp(Number(plan?.geometry?.ringRadius) || .72, .58, .96)
      }),
      localOnly: true,
      privateByDefault: true,
      projectReferenceExposed: false,
      promptExposed: false,
      fileExposed: false,
      secretExposed: false,
      publicRouteCreated: false,
      remoteRequestCreated: false
    }));
    if (result.length >= maxVisible) break;
  }
  return Object.freeze(result);
}

/** Render only the W438 sanitized deterministic projection, never the manifest. */
function addPrivateProjectDistricts(scene, plans = [], quality = 'balanced') {
  const root = new TransformNode('private-project-districts', scene);
  const visiblePlans = normalizePrivateProjectDistrictPlans(plans, quality);
  visiblePlans.forEach((plan, index) => {
    const anchor = plan.geometry.anchor;
    const district = createEonNoirLandmark(scene, {
      id: `private-${plan.districtId}`,
      type: 'project-district',
      parent: root,
      position: { x: anchor.x, z: anchor.z, heading: anchor.heading },
      accent: plan.palette.accent,
      quality,
      geometry: plan.geometry,
      visualProfile: plan.visualProfile,
      metadata: {
        kind: 'private-project-district',
        districtId: plan.districtId,
        privateByDefault: true,
        missionState: plan.missionState,
        visualProfile: plan.visualProfile.id,
        projectReferenceExposed: false,
        promptExposed: false,
        fileExposed: false,
        secretExposed: false,
        publicRouteCreated: false,
        remoteRequestCreated: false
      }
    });
    const label = createDistrictSign(scene, `private-project-district-label-${index}`, plan.displayLabel.toUpperCase(), new Vector3(anchor.x, plan.geometry.towerHeight + 1.3, anchor.z), plan.palette.accent, 1.82);
    if (label) label.parent = root;
    // W558 renders only separately reviewed mission-card labels. Raw Project
    // tasks, IDs, prompts, files and details never enter the 3D scene.
    plan.taskCards.forEach((card, cardIndex) => {
      const side = cardIndex % 2 === 0 ? -1 : 1;
      const row = Math.floor(cardIndex / 2);
      const sign = createDistrictSign(
        scene,
        `private-project-mission-card-${index}-${cardIndex}`,
        card.label.toUpperCase(),
        new Vector3(anchor.x + side * (1.2 + row * .24), 1.16 + row * .62, anchor.z + 1.06 + row * .38),
        plan.palette.accent,
        .72
      );
      if (sign) {
        sign.parent = root;
        sign.metadata = { ...(sign.metadata || {}), kind: 'private-project-mission-card', citySafeLabelOnly: true, missionState: card.state, rawTaskContentExposed: false, projectReferenceExposed: false };
      }
    });
    district.root.metadata = { ...district.root.metadata, projectDistrict: true, citySafeLabelOnly: true, missionCardCount: plan.taskCards.length, rawTaskContentExposed: false };
  });
  root.metadata = { kind: 'private-project-district-root', visibleCount: visiblePlans.length, localOnly: true, originalProcedural: true, eonNoirArchitecture: true, privateByDefault: true, projectReferenceExposed: false, promptExposed: false, fileExposed: false, secretExposed: false, rawTaskContentExposed: false, publicRouteCreated: false, remoteRequestCreated: false };
  return Object.freeze({ root, visiblePlans, visibleCount: visiblePlans.length, localOnly: true, privateByDefault: true });
}

function createOriginalSceneArtAnchors(scene) {
  const createAnchor = (id, position, rotationY = 0, scale = 1) => {
    const anchor = new TransformNode(`original-scene-art-${id}`, scene);
    anchor.position.set(position.x, position.y || 0, position.z);
    anchor.rotation.y = rotationY;
    anchor.scaling.setAll(scale);
    anchor.metadata = Object.freeze({ kind: 'original-command-horizon-art-anchor', id, localOnly: true, remoteNetwork: false, containsUserData: false, ownerVisualApprovalPending: true });
    return anchor;
  };
  return Object.freeze({
    arrivalGate: createAnchor('arrival-gate', { x: 0, y: 0, z: 9.1 }, Math.PI, 0.92),
    commandDeck: createAnchor('command-deck', { x: 0, y: 0, z: -9.45 }, 0, 0.9),
    wayfinding: createAnchor('wayfinding', { x: 4.2, y: 0, z: 2.6 }, -0.28, 0.9)
  });
}

function createScene(engine, canvas, { quality = 'balanced', citySeed = '', openSkyProfileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, reducedMotion = false, projectDistrictRenderPlans = [], onDetailStage = null } = {}) {
  const settings = QUALITY[quality] || QUALITY.balanced;
  const worldRenderProfile = getEonUniverseRenderProfile({ quality });
  engine.setHardwareScalingLevel(settings.hardwareScaling);
  const stageDetail = { quality };
  const scene = runCityBootStage('SCENE_CONSTRUCTOR', () => new Scene(engine), stageDetail);
  scene.metadata = {
    playPaused: false,
    playReducedEffects: false,
    artBible: getEonCityArtBibleSummary(),
    artIntake: getCityArtIntakeSummary({ quality }),
    eonUniverseWorldGrammar: worldRenderProfile,
    w624cCommandDistrict: getEonCityCommandDistrictVerticalSlicePlan(),
    engineStaging: { schema: 'eon.city.engine-staging.v1', status: 'core-building' }
  };
  const camera = runCityBootStage('CAMERA_ATTACH', () => {
    const nextCamera = new ArcRotateCamera('city-play-camera', -Math.PI / 4, worldRenderProfile.cameraBeta, worldRenderProfile.cameraRadius, new Vector3(0, 1.25, 0), scene);
    nextCamera.lowerRadiusLimit = worldRenderProfile.cameraRadiusLimits[0];
    nextCamera.upperRadiusLimit = worldRenderProfile.cameraRadiusLimits[1];
    nextCamera.lowerBetaLimit = 0.72;
    nextCamera.upperBetaLimit = 1.6;
    nextCamera.wheelDeltaPercentage = 0.012;
    nextCamera.panningSensibility = 0;
    nextCamera.attachControl(canvas, true);
    return nextCamera;
  }, stageDetail);

  const artBudget = getCityPlayArtBudget(quality);
  const commandHorizonStreetKitPlan = getEonCityCommandHorizonStreetKitPlan({ quality });
  const artDirection = applyCinematicArtDirection(scene, quality);
  const vectorArtRuntime = createCityVectorArtRuntime(scene, { quality });
  const visualProgression = getCityVisualProgressionPlan({ quality, reducedMotion });
  const eonbotCompanionPlan = createEonCityEonbotCompanionPlan({ skinId: getEonCitySelectedCompanionSkinId(), quality, reducedMotion });
  const eonbotRigPlan = createEonCityEonbotRigPlan({ quality, reducedMotion, companionSkinId: eonbotCompanionPlan.visual.skinId });
  scene.metadata.vectorArt = { ...getCityVectorArtSummary({ quality }), runtime: vectorArtRuntime.getSummary() };
  scene.metadata.artDirection = artDirection;
  scene.metadata.assetDesign = getCityAssetDesignKitSummary();
  scene.metadata.visualProgression = visualProgression;
  scene.metadata.eonbotCompanion = Object.freeze({ schema: eonbotCompanionPlan.schema, skinId: eonbotCompanionPlan.visual.skinId, detail: eonbotCompanionPlan.visual.detail, captionKind: eonbotCompanionPlan.caption.kind, localOnly: true, autonomousAgent: false, privateContentVisible: false, subscriptionEntitlementClaimed: false });
  scene.metadata.eonbotRig = Object.freeze({ schema: eonbotRigPlan.schema, quality: eonbotRigPlan.quality, detail: eonbotRigPlan.detail, stageId: eonbotRigPlan.staging.id, meshBudget: eonbotRigPlan.rig.meshBudget, localOnly: true, visualOnly: true, binaryAssets: false, remoteAssets: false, sameSafePanel: true, subscriptionEntitlementClaimed: false });
  const lighting = runCityBootStage('LIGHTING', () => addLighting(scene, quality, artBudget, artDirection, worldRenderProfile), stageDetail);
  const initialOpenSkyPlan = getEonCityOpenSkyProfilePlan({ quality, profileId: openSkyProfileId, reducedEffects: Boolean(reducedMotion) });
  const openSky = runCityBootStage('OPEN_SKY', () => addOpenSkyProfile(scene, initialOpenSkyPlan, lighting), { ...stageDetail, profileId: openSkyProfileId });
  const glow = lighting.glow;
  scene.metadata.noirArchitecture = getEonNoirArchitectureSummary();
  scene.metadata.noirNpcKit = getEonNoirNpcKitSummary();

  // Core stage: enough genuine City to render and navigate before ornamental work
  // competes for the first WebGL frame.
  runCityBootStage('CORE_STREET', () => addStreet(scene, artBudget, vectorArtRuntime), stageDetail);
  const noirWorldLayer = runCityBootStage('NOIR_WORLD_LAYER', () => createEonNoirWorldLayer(scene, { quality, vectorArt: vectorArtRuntime, seed: citySeed }), stageDetail);
  scene.metadata.noirWorldComposition = noirWorldLayer?.composition || null;
  const arrivalDistrict = runCityBootStage('ARRIVAL_DISTRICT', () => addArrivalDistrict(scene, quality, artBudget, vectorArtRuntime), stageDetail);
  const creatorForgeDistrict = runCityBootStage('CREATOR_FORGE_DISTRICT', () => addCreatorForgeDistrict(scene, quality, artBudget, vectorArtRuntime), stageDetail);
  const districtBlueprint = getCommandDistrictSceneBlueprint();
  const commandCentre = runCityBootStage('COMMAND_CENTRE', () => addCommandCentre(scene, quality, artBudget, vectorArtRuntime), stageDetail);
  const commandDistrictVerticalSlice = runCityBootStage('W624C_COMMAND_DISTRICT_SLICE', () => addCommandDistrictVerticalSlice(scene, quality, vectorArtRuntime), stageDetail);
  const operator = runCityBootStage('OPERATOR_RIG', () => addOperator(scene), stageDetail);
  // The camera is constructed before the operator. Bind its first frame to the
  // authored Arrival Plaza pose instead of leaving it aimed at world origin.
  camera.alpha = EON_CITY_COMMAND_DISTRICT_SPAWN.camera.alpha;
  camera.beta = clamp(EON_CITY_COMMAND_DISTRICT_SPAWN.camera.beta, camera.lowerBetaLimit, camera.upperBetaLimit);
  camera.radius = clamp(EON_CITY_COMMAND_DISTRICT_SPAWN.camera.radius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
  camera.setTarget(operator.position.add(new Vector3(0, 1.18, 0)));
  const eonbot = runCityBootStage('EONBOT_RIG', () => addEonbot(scene, operator, vectorArtRuntime, eonbotCompanionPlan, eonbotRigPlan), stageDetail);
  const originalSceneArtAnchors = runCityBootStage('SCENE_ART_ANCHORS', () => createOriginalSceneArtAnchors(scene), stageDetail);
  const projectDistricts = runCityBootStage('PROJECT_DISTRICTS', () => addPrivateProjectDistricts(scene, projectDistrictRenderPlans, quality), stageDetail);
  const vectorArtMotion = runCityBootStage('VECTOR_MOTION', () => vectorArtRuntime.attachSubtleMotion(visualProgression.motion), stageDetail);

  const runtimeState = {
    metropolisDistricts: null,
    commandDistrictVerticalSlice,
    commandRoom: null,
    deepArtDressing: null,
    authoredVerticalSlice: null,
    routeBeacons: [],
    guides: [],
    npcCrowdPlan: null,
    commandDistrictNpcPlan: null,
    commandDistrictNpcSystem: null,
    commandDistrictNpcSetLod: null,
    commandDistrictNpcRequestState: null,
    seededAmbience: null,
    openSky,
    livingSystems: null,
    noirWorldDetail: null,
    commandHorizonStreetKit: null,
    rain: null,
    cinematicShadows: Object.freeze({ enabled: false, quality: String(quality || 'balanced'), casterCount: 0, reason: 'staged-cinematic-pending' }),
    projectDistricts,
    stageErrors: []
  };

  const refreshSceneMetadata = () => {
    const deepArtDressing = runtimeState.deepArtDressing;
    const authoredVerticalSlice = runtimeState.authoredVerticalSlice;
    const metropolisDistricts = runtimeState.metropolisDistricts;
    const commandRoom = runtimeState.commandRoom;
    const livingSystems = runtimeState.livingSystems;
    const noirWorldDetail = runtimeState.noirWorldDetail;
    const commandHorizonStreetKit = runtimeState.commandHorizonStreetKit;
    const npcCrowdPlan = runtimeState.npcCrowdPlan;
    const commandDistrictNpcPlan = runtimeState.commandDistrictNpcPlan;
    const seededAmbience = runtimeState.seededAmbience;
    const openSkyProfile = runtimeState.openSky;
    scene.metadata.deepArt = {
      ...getCityDeepArtDirectionSummary({ quality }),
      activePlacementCount: deepArtDressing?.activePlacementCount || 0,
      staged: true
    };
    scene.metadata.authoredVerticalSlice = {
      ...getCityAuthoredVerticalSliceSummary({ quality }),
      activeMarkerCount: authoredVerticalSlice?.activeMarkerCount || 0,
      activeLabelCount: authoredVerticalSlice?.activeLabelCount || 0,
      staged: true
    };
    scene.metadata.privateProjectDistricts = {
      visibleCount: runtimeState.projectDistricts?.visibleCount || 0,
      localOnly: true,
      privateByDefault: true,
      projectReferenceExposed: false,
      promptExposed: false,
      fileExposed: false,
      secretExposed: false,
      publicRouteCreated: false,
      remoteRequestCreated: false
    };
    scene.metadata.rendererProfile = { ...EON_CITY_PROCEDURAL_RENDERER_PROFILE, cinematicShadows: runtimeState.cinematicShadows };
    scene.metadata.commandDistrict = {
      schema: districtBlueprint.schema,
      id: districtBlueprint.id,
      title: districtBlueprint.title,
      originalProceduralFallback: true,
      commandCentre: Boolean(commandCentre),
      verticalSlice: { schema: commandDistrictVerticalSlice?.plan?.schema || null, cacheVersion: commandDistrictVerticalSlice?.plan?.cacheVersion || null, destinationCount: commandDistrictVerticalSlice?.plan?.destinations?.length || 0, pathCount: commandDistrictVerticalSlice?.paths?.length || 0, firstTenSecondCueCount: commandDistrictVerticalSlice?.plan?.journey?.firstTenSeconds?.length || 0, firstSixtySecondMilestoneCount: commandDistrictVerticalSlice?.plan?.journey?.firstSixtySeconds?.length || 0, ownerVisualApprovalPending: true },
      arrivalDistrict: Boolean(arrivalDistrict),
      arrivalBlueprint: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.id,
      firstMission: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.id,
      commandRoom: Boolean(commandRoom),
      commandDeck: Boolean(commandRoom),
      creatorAtrium: Boolean(commandRoom?.metadata?.creatorAtrium),
      creatorForgeDistrict: Boolean(creatorForgeDistrict?.root),
      creatorForgeBlueprint: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.id,
      metropolisDistricts: Boolean(metropolisDistricts?.root),
      metropolisDistrictCount: metropolisDistricts?.districts?.length || 0,
      livingSystems: Boolean(livingSystems?.root),
      livingSystemsBlueprint: EON_CITY_LIVING_SYSTEMS_BLUEPRINT.id,
      guideCount: runtimeState.guides.length,
      productionNpcSystem: {
        schema: commandDistrictNpcPlan?.schema || 'eon.city.command-district-npc-system.w624f.v1',
        archetypeCount: commandDistrictNpcPlan?.archetypes?.length || 0,
        activeCount: commandDistrictNpcPlan?.activeEntities?.length || 0,
        stateCount: EON_CITY_COMMAND_DISTRICT_NPC_STATES.length,
        lod: runtimeState.commandDistrictNpcSystem?.getSnapshot?.()?.lod?.id || commandDistrictNpcPlan?.lod?.id || 'disabled',
        authoredPathCount: commandDistrictNpcPlan?.authoredPathIds?.length || 0,
        localOnly: true, presentationOnly: true, autoNavigation: false, automaticExecution: false, privateDataVisible: false
      },
      npcCrowd: {
        schema: npcCrowdPlan?.schema || 'eon.city.npc-archetypes.w570.v1',
        ambientCount: npcCrowdPlan?.ambientCount || 0,
        readableFaces: npcCrowdPlan?.readableFaces === true,
        localVisualOnly: true,
        interactive: false,
        autonomous: false,
        privateDataVisible: false
      },
      seededAmbience: {
        schema: seededAmbience?.plan?.schema || 'eon.city.seeded-ambience.w573.v1',
        quality: seededAmbience?.plan?.quality || String(quality || 'balanced'),
        phase: seededAmbience?.plan?.phase?.id || 'arrival-pulse',
        staticSignCount: seededAmbience?.signCount || 0,
        trafficCount: seededAmbience?.trafficCount || 0,
        visualMomentCount: seededAmbience?.visualMomentCount || 0,
        localVisualOnly: true,
        interactive: false,
        autonomous: false,
        privateDataVisible: false
      },
      openSkyProfile: openSkyProfile?.getSummary?.() || Object.freeze({ schema: 'eon.city.open-sky.w574.v1', profileId: EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, localVisualOnly: true, sessionOnly: true, interactive: false, privateDataVisible: false }),
      routeBeaconCount: runtimeState.routeBeacons.length,
      eonbot: Boolean(eonbot),
      localOnly: true,
      remoteAssets: false,
      remoteTelemetry: false,
      displaysPrivateWork: false,
      privateProjectDistrictVisuals: runtimeState.projectDistricts?.visibleCount || 0,
      noirWorldLayer: Boolean(noirWorldLayer?.root),
      noirWorldComposition: {
        schema: noirWorldLayer?.composition?.schema || null,
        quality: noirWorldLayer?.composition?.quality || quality,
        skylineCount: noirWorldLayer?.skylineCount || 0,
        ambientTransitCount: noirWorldLayer?.ambientTransitCount || 0,
        decorativeOnly: noirWorldLayer?.composition?.ambientTransit?.decorativeOnly === true
      },
      commandHorizonStreetKit: {
        schema: commandHorizonStreetKit?.plan?.schema || commandHorizonStreetKitPlan.schema,
        staged: 'street-life',
        active: Boolean(commandHorizonStreetKit?.root),
        quality: commandHorizonStreetKit?.plan?.quality || commandHorizonStreetKitPlan.quality,
        decorativePropCount: commandHorizonStreetKit?.decorativePropCount || 0,
        originalProcedural: true,
        binaryAssets: false,
        remoteAssets: false,
        userData: false
      },
      noirStreetDetail: {
        staged: 'street-life',
        active: Boolean(noirWorldDetail?.root),
        detailCount: noirWorldDetail?.detailCount || 0,
        reflectorCount: noirWorldDetail?.reflectorCount || 0,
        gardenCount: noirWorldDetail?.gardenCount || 0,
        decorativeOnly: true
      },
      cityStyle: 'EON Noir',
      firstFrameCore: true,
      deferredStageErrors: runtimeState.stageErrors.map((entry) => entry.id)
    };
  };

  const applyOpenSkyProfile = (profileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID) => {
    const plan = getEonCityOpenSkyProfilePlan({
      quality,
      profileId,
      paused: scene.metadata?.playPaused === true,
      reducedEffects: scene.metadata?.playReducedEffects === true || Boolean(reducedMotion)
    });
    const result = runtimeState.openSky?.apply?.(plan) || Object.freeze({ ok: false, profileId: plan.profile.id, label: plan.profile.label });
    refreshSceneMetadata();
    return result;
  };

  const engineStages = createCityEngineStageQueue({
    quality,
    reducedMotion,
    onStage: ({ id, summary }) => {
      scene.metadata.engineStaging = { ...summary, lastStage: id, status: 'streaming' };
      refreshSceneMetadata();
      try { onDetailStage?.({ id, status: 'complete', summary }); } catch {}
    },
    onError: ({ id }) => {
      runtimeState.stageErrors.push({ id, at: Date.now() });
      const summary = engineStages.getSummary();
      scene.metadata.engineStaging = { ...summary, lastStage: id, status: 'partial-detail-failure' };
      refreshSceneMetadata();
      try { onDetailStage?.({ id, status: 'failed', summary }); } catch {}
    }
  });

  engineStages.add('districts', () => {
    runtimeState.metropolisDistricts = addMetropolisDistricts(scene, quality, artBudget, vectorArtRuntime);
    addBuilding(scene, 'relay', new Vector3(-7.2, 0, 6.4), { width: 3.8, height: 4.1, depth: 3.6 }, PALETTE.amber, 1, artBudget, vectorArtRuntime);
    addBuilding(scene, 'observatory', new Vector3(7.3, 0, 6.7), { width: 3.7, height: 4.5, depth: 3.8 }, PALETTE.mint, 1, artBudget, vectorArtRuntime);
    runtimeState.commandRoom = addCommandRoomInterior(scene, quality, artBudget);
  });
  engineStages.add('street-life', () => {
    runtimeState.commandHorizonStreetKit = addCommandHorizonStreetKit(scene, commandHorizonStreetKitPlan, vectorArtRuntime);
    runtimeState.noirWorldDetail = createEonNoirWorldDetailLayer(scene, { quality, vectorArt: vectorArtRuntime, seed: citySeed });
    addDistrictFurnishings(scene, artBudget, citySeed, vectorArtRuntime, quality);
    runtimeState.deepArtDressing = addDeepArtDressing(scene, vectorArtRuntime, quality);
    runtimeState.authoredVerticalSlice = addAuthoredVerticalSliceWayfinding(scene, vectorArtRuntime, quality);
    runtimeState.routeBeacons = addDistrictRouteBeacons(scene, artBudget);
    const seededAmbiencePlan = getEonCitySeededAmbiencePlan({ quality, seed: citySeed, phaseIndex: 0, reducedEffects: scene.metadata?.playReducedEffects === true });
    runtimeState.seededAmbience = addSeededAmbience(scene, seededAmbiencePlan);
    const npcRoster = addNpcs(scene, artBudget, seededAmbiencePlan);
    runtimeState.guides = npcRoster.nodes;
    runtimeState.npcCrowdPlan = npcRoster.crowdPlan;
    runtimeState.commandDistrictNpcPlan = npcRoster.productionPlan;
    runtimeState.commandDistrictNpcSystem = npcRoster.productionController;
    runtimeState.commandDistrictNpcSetLod = npcRoster.setLod;
    runtimeState.commandDistrictNpcRequestState = npcRoster.requestState;
    runtimeState.livingSystems = addLivingCitySystems(scene, quality, artBudget);
  });
  engineStages.add('atmosphere', () => {
    if (!scene.metadata?.playReducedEffects) runtimeState.rain = addRain(scene, settings, citySeed);
  });
  engineStages.add('cinematic', () => {
    if (!scene.metadata?.playReducedEffects) runtimeState.cinematicShadows = addCinematicShadows(scene, lighting.key, quality);
  });

  refreshSceneMetadata();
  scene.metadata.engineStaging = { ...engineStages.getSummary(), status: 'core-ready' };
  return {
    scene,
    camera,
    operator,
    eonbot,
    settings,
    artBudget,
    commandHorizonStreetKitPlan,
    artDirection,
    worldRenderProfile,
    glow,
    districtBlueprint,
    arrivalDistrict,
    creatorForgeDistrict,
    vectorArtRuntime,
    noirWorldLayer,
    visualProgression,
    vectorArtMotion,
    runtimeState,
    originalSceneArtAnchors,
    applyOpenSkyProfile,
    engineStages
  };
}

function normalizeInputVector(vector = {}) {
  const x = clamp(vector.x, -1, 1);
  const z = clamp(vector.z, -1, 1);
  const length = Math.hypot(x, z);
  if (!length || length <= 1) return { x, z };
  return { x: x / length, z: z / length };
}

function readGamepadState() {
  const state = { x: 0, z: 0, connected: false, interactPressed: false, cameraResetPressed: false, cameraCyclePressed: false };
  const pads = globalThis.navigator?.getGamepads?.() || [];
  for (const pad of pads) {
    if (!pad?.connected) continue;
    state.connected = true;
    const axisX = Number(pad.axes?.[0] || 0);
    const axisZ = Number(pad.axes?.[1] || 0);
    const dpadX = (pad.buttons?.[15]?.pressed ? 1 : 0) - (pad.buttons?.[14]?.pressed ? 1 : 0);
    const dpadZ = (pad.buttons?.[13]?.pressed ? 1 : 0) - (pad.buttons?.[12]?.pressed ? 1 : 0);
    state.x = Math.abs(axisX) >= GAMEPAD_DEAD_ZONE ? axisX : dpadX;
    state.z = Math.abs(axisZ) >= GAMEPAD_DEAD_ZONE ? axisZ : dpadZ;
    state.interactPressed = Boolean(pad.buttons?.[GAMEPAD_INTERACT_BUTTON]?.pressed);
    state.cameraResetPressed = Boolean(pad.buttons?.[GAMEPAD_CAMERA_RESET_BUTTON]?.pressed);
    state.cameraCyclePressed = Boolean(pad.buttons?.[GAMEPAD_CAMERA_CYCLE_BUTTON]?.pressed);
    if (Math.abs(state.x) > 0 || Math.abs(state.z) > 0 || state.interactPressed || state.cameraResetPressed || state.cameraCyclePressed) return { ...state, ...normalizeInputVector(state) };
  }
  return state;
}

function isEditableInputTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'));
}

function makeInputHandlers(canvas, movement, { onPauseRequest, onMinimapToggle, onInteractRequest: _onInteractRequest, onLandmarkFocusRequest, onPointerLookToggle, onCameraCycle, onCameraReset, onInputModeChange } = {}) {
  const shortcutCodes = new Set(['Escape', 'KeyM', 'KeyE', 'KeyL', 'KeyC', 'KeyR', 'Space']);
  // W405: listen on the City document, not only a focused canvas. A person can
  // click a visible HUD button and still keep reliable keyboard movement.
  const target = globalThis.window || canvas;
  const onKeyDown = (event) => {
    if (isEditableInputTarget(event.target)) return;
    const code = resolveEonCityW719KeyboardCode(event);
    const direction = resolveEonCityW719MovementDirection(event);
    if (direction) {
      movement.add(direction);
      onInputModeChange?.('Keyboard movement active. Press M for the local map, L for optional pointer look, E or Space to review a nearby named landmark, or Escape to pause.');
      event.preventDefault();
      return;
    }
    if (!shortcutCodes.has(code) || event.repeat) return;
    if (code === 'Escape') onPauseRequest?.('keyboard');
    if (code === 'KeyM') onMinimapToggle?.('keyboard');
    if (code === 'KeyL') onPointerLookToggle?.('keyboard');
    if (code === 'KeyC') onCameraCycle?.('keyboard');
    if (code === 'KeyR') onCameraReset?.('keyboard');
    if (code === 'KeyE' || code === 'Space') {
      const focused = onLandmarkFocusRequest?.('keyboard');
      if (!focused) onInputModeChange?.('No named landmark is in range. Move closer, click/tap a visible City signal, or open Districts.');
    }
    event.preventDefault();
  };
  const onKeyUp = (event) => {
    if (isEditableInputTarget(event.target)) return;
    const direction = resolveEonCityW719MovementDirection(event);
    if (!direction) return;
    movement.delete(direction);
    event.preventDefault();
  };
  const restoreCanvasFocus = () => canvas.focus?.({ preventScroll: true });
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', restoreCanvasFocus);
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('pointerdown', restoreCanvasFocus);
  };
}

function createClickMoveMarker(scene) {
  const marker = MeshBuilder.CreateTorus('city-click-move-marker', { diameter: 0.78, thickness: 0.05, tessellation: 28 }, scene);
  marker.rotation.x = Math.PI / 2;
  marker.position.y = 0.08;
  marker.material = makeMaterial(scene, 'city-click-move-marker-material', { diffuse: '#33245e', emissive: PALETTE.amber, intensity: 1.05, metallic: 0.24, roughness: 0.2 });
  marker.setEnabled(false);
  return marker;
}


const EON_UNIVERSE_LANDMARK_ACCENTS = Object.freeze({
  cyan: PALETTE.cyan,
  violet: PALETTE.violet,
  mint: PALETTE.mint,
  amber: PALETTE.amber
});

function createLandmarkInteractionRuntime(scene, landmarks = CITY_PLAY_LANDMARKS) {
  const root = new TransformNode('eon-universe-landmark-interactions', scene);
  const nodes = new Map();
  let hoveredId = null;
  let selectedId = null;
  const accentFor = (landmark) => EON_UNIVERSE_LANDMARK_ACCENTS[landmark.style] || PALETTE.cyan;
  const interactionMetadata = (landmark) => ({
    kind: 'eon-universe-landmark-interaction',
    eonCityLandmarkId: landmark.id,
    localOnly: true,
    opensRoute: false,
    executesWork: false,
    tracksUser: false
  });
  const mark = (mesh, landmark) => {
    mesh.isPickable = true;
    mesh.metadata = interactionMetadata(landmark);
    mesh.parent = root;
    return mesh;
  };
  const markTree = (node, landmark) => {
    if (!node) return null;
    node.metadata = interactionMetadata(landmark);
    node.getChildMeshes?.().forEach((mesh) => {
      mesh.isPickable = true;
      mesh.metadata = interactionMetadata(landmark);
    });
    return node;
  };
  for (const [index, landmark] of landmarks.entries()) {
    const accent = accentFor(landmark);
    const pedestal = mark(MeshBuilder.CreateCylinder(`eon-universe-landmark-pedestal-${landmark.id}`, { diameter: Math.max(2.2, Math.min(3.6, landmark.radius * 0.9)), height: 0.065, tessellation: 32 }, scene), landmark);
    pedestal.position.set(landmark.x, 0.055, landmark.z);
    pedestal.material = makeMaterial(scene, `eon-universe-landmark-pedestal-material-${landmark.id}`, { diffuse: '#122238', emissive: accent, intensity: 0.16, metallic: 0.56, roughness: 0.3, alpha: 0.96 });
    const ring = mark(MeshBuilder.CreateTorus(`eon-universe-landmark-ring-${landmark.id}`, { diameter: Math.max(2.58, Math.min(4.18, landmark.radius * 1.05)), thickness: 0.065, tessellation: 48 }, scene), landmark);
    ring.position.set(landmark.x, 0.105, landmark.z);
    ring.rotation.x = Math.PI / 2;
    ring.material = makeMaterial(scene, `eon-universe-landmark-ring-material-${landmark.id}`, { diffuse: '#1a2940', emissive: accent, intensity: 0.72, metallic: 0.28, roughness: 0.18, alpha: 0.94 });
    const beacon = mark(MeshBuilder.CreateCylinder(`eon-universe-landmark-beacon-${landmark.id}`, { diameter: 0.14, height: 0.82, tessellation: 18 }, scene), landmark);
    beacon.position.set(landmark.x, 0.51, landmark.z);
    beacon.material = makeMaterial(scene, `eon-universe-landmark-beacon-material-${landmark.id}`, { diffuse: '#162e44', emissive: accent, intensity: 1.02, metallic: 0.22, roughness: 0.16, alpha: 0.95 });
    // W607: a transparent local-only pick volume makes the named world signal
    // easier to select on mouse and touch without creating invisible routes or
    // auto-navigation. The volume exists only for direct raycasting.
    const interactionVolume = mark(MeshBuilder.CreateCylinder(`eon-universe-landmark-hit-volume-${landmark.id}`, { diameter: Math.max(3.7, Math.min(6.25, landmark.radius * 1.42)), height: 2.55, tessellation: 28 }, scene), landmark);
    interactionVolume.position.set(landmark.x, 1.23, landmark.z);
    interactionVolume.material = makeMaterial(scene, `eon-universe-landmark-hit-volume-material-${landmark.id}`, { diffuse: '#09182a', emissive: accent, intensity: 0, metallic: 0, roughness: 1, alpha: 0.001 });
    interactionVolume.metadata = Object.freeze({ ...interactionMetadata(landmark), kind: 'eon-universe-landmark-hit-volume', visibleSignalRequired: true, directClickTapOnly: true, autoNavigation: false });
    const label = markTree(createDistrictSign(scene, `eon-universe-landmark-label-${landmark.id}`, landmark.label.toUpperCase(), new Vector3(landmark.x, 1.18, landmark.z), accent, Math.max(.68, Math.min(.95, landmark.radius * .25))), landmark);
    if (label) label.parent = root;
    nodes.set(landmark.id, Object.freeze({ landmark, ring, beacon, interactionVolume, label, phase: index * 0.78 }));
  }
  scene.registerBeforeRender(() => {
    if (scene.metadata?.playPaused || scene.metadata?.playReducedEffects) return;
    const now = performance.now() * 0.001;
    nodes.forEach(({ landmark, ring, beacon, interactionVolume, label, phase }) => {
      ring.rotation.z += 0.004;
      beacon.position.y = 0.31 + Math.sin(now * 1.2 + phase) * 0.035;
      const targetScale = selectedId === landmark.id ? 1.14 : hoveredId === landmark.id ? 1.07 : 1;
      const nextScale = ring.scaling.x + (targetScale - ring.scaling.x) * 0.16;
      ring.scaling.x = nextScale;
      ring.scaling.y = nextScale;
      ring.scaling.z = nextScale;
      const beaconScale = selectedId === landmark.id ? 1.1 : hoveredId === landmark.id ? 1.04 : 1;
      beacon.scaling.x = beaconScale;
      beacon.scaling.z = beaconScale;
      if (interactionVolume) {
        const volumeScale = selectedId === landmark.id ? 1.1 : hoveredId === landmark.id ? 1.045 : 1;
        interactionVolume.scaling.x = volumeScale;
        interactionVolume.scaling.z = volumeScale;
      }
      if (label) {
        const labelScale = selectedId === landmark.id ? 1.12 : hoveredId === landmark.id ? 1.06 : 1;
        label.scaling.x = labelScale;
        label.scaling.y = labelScale;
        label.scaling.z = labelScale;
      }
    });
  });
  const getLandmarkIdFromMesh = (mesh) => {
    let current = mesh || null;
    while (current) {
      const id = current.metadata?.eonCityLandmarkId;
      if (id) return id;
      current = current.parent || null;
    }
    return null;
  };
  const resolveId = (landmarkId) => nodes.has(String(landmarkId || '')) ? String(landmarkId) : null;
  const select = (landmarkId = '') => {
    selectedId = resolveId(landmarkId);
    return selectedId ? getPlayableLandmark(selectedId) : null;
  };
  const setHover = (landmarkId = '') => {
    hoveredId = resolveId(landmarkId);
    return hoveredId ? getPlayableLandmark(hoveredId) : null;
  };
  return Object.freeze({
    root,
    count: nodes.size,
    pickAt(x, y) {
      const hit = scene.pick(x, y, (mesh) => Boolean(getLandmarkIdFromMesh(mesh)));
      const landmarkId = hit?.hit ? getLandmarkIdFromMesh(hit.pickedMesh) : null;
      return landmarkId ? getPlayableLandmark(landmarkId) : null;
    },
    select,
    setHover,
    clearSelection() { selectedId = null; },
    clearHover() { hoveredId = null; },
    getSnapshot() { return Object.freeze({ count: nodes.size, hoveredId, selectedId, localOnly: true, autoNavigation: false }); },
    getLandmarkIdFromMesh
  });
}
function cityBootError(code) {
  const error = new Error(String(code || 'CITY_ENGINE_CREATE_FAILED'));
  error.code = String(code || 'CITY_ENGINE_CREATE_FAILED');
  return error;
}

/**
 * Mounts the bounded W249 proof scene. No remote content is fetched; callers
 * receive local frame metrics and an idempotent destroy method.
 */
export function mountBabylonCityProof({ host, state = {}, quality = 'balanced', openSkyProfileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, reducedMotion = false, agentPresence = [], agentPresencePreferences = {}, agentOutcome = null, projectDistrictRenderPlans = [], defaultClickMove = EON_CITY_CONTROL_CONVENTION.clickToMoveDefaultForDirectCity, onStatus, onTelemetry, onContextLoss, onFallback, onFirstFrame, onInitialAssetsReady, onAssetProgress, onDetailStage, onLandmarkChange, onLandmarkHover, onLandmarkFocus, onLandmarkApproach, onInputModeChange, onPerformanceChange, onPauseRequest, onMinimapToggle, onInteractRequest, onLandmarkSelect, onClickMoveChange, onPointerLookChange, onLivingNexusOpportunityChange, onLivingNexusRealmSignalChange, onLivingNexusGatewayChange } = {}) {
  if (typeof Ray !== 'function') throw new Error('eon-city-babylon-ray-side-effect-unavailable');
  if (!host || typeof document === 'undefined') throw cityBootError('CITY_CANVAS_MOUNT_FAILED');
  const resolvedQuality = reducedMotion ? 'lite' : (QUALITY[quality] ? quality : 'balanced');
  const performanceObservation = createCityPerformanceObservation();
  performanceObservation.recordStage('route-entered');
  const canvas = document.createElement('canvas');
  canvas.className = 'eon-play-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'EON City Command World — use W or Up to move forward, A or Left for screen-left, D or Right for screen-right, and click visible district signals.');
  try {
    host.replaceChildren(canvas);
  } catch {
    throw cityBootError('CITY_CANVAS_MOUNT_FAILED');
  }
  recordCityBootStage('CANVAS_ATTACHED', { quality: resolvedQuality });

  let engine;
  try {
    engine = new Engine(canvas, resolvedQuality !== 'lite', { stencil: false, preserveDrawingBuffer: false, doNotHandleContextLost: false });
    performanceObservation.recordStage('engine-created');
  } catch {
    throw cityBootError('CITY_ENGINE_CREATE_FAILED');
  }
  recordCityBootStage('ENGINE_CREATED', { quality: resolvedQuality });
  let sceneBundle;
  try {
    sceneBundle = createScene(engine, canvas, { quality: resolvedQuality, citySeed: state.citySeed || state.worldId || 'eon-command', openSkyProfileId, reducedMotion, projectDistrictRenderPlans, onDetailStage });
    performanceObservation.recordStage('scene-created');
  } catch (error) {
    recordCityBootStage('SCENE_CREATE_ERROR', { quality: resolvedQuality, error: describeBootError(error) });
    try { engine.dispose(); } catch {}
    throw cityBootError('CITY_ASSET_LOAD_FAILED');
  }
  recordCityBootStage('SCENE_CREATED', { quality: resolvedQuality });
  const { scene, camera, operator, eonbot, settings, artBudget, artDirection, worldRenderProfile, glow, districtBlueprint, arrivalDistrict, creatorForgeDistrict, vectorArtRuntime, visualProgression, runtimeState, originalSceneArtAnchors, applyOpenSkyProfile, engineStages } = sceneBundle;
  let projectDistricts = runtimeState.projectDistricts;
  // W602 loads only catalogued same-origin original GLB candidates. Each anchor
  // retains its procedural fallback until the local asset container is ready.
  const assetRuntime = createCityAssetRuntime({ engine: 'babylon', quality: resolvedQuality });
  const originalRigRuntime = createEonCityOriginalRigRuntime({
    scene,
    assetRuntime,
    quality: resolvedQuality,
    navigatorAnchor: operator,
    companionAnchor: eonbot,
    onStatus,
    enabled: false
  });
  scene.metadata.eonCityOriginalRigRuntime = originalRigRuntime.getSummary();
  void trackAsyncCityBootStage('ORIGINAL_RIG_RUNTIME', originalRigRuntime.start(), { quality: resolvedQuality }).then(() => {
    scene.metadata.eonCityOriginalRigRuntime = originalRigRuntime.getSummary();
  }).catch(() => {
    scene.metadata.eonCityOriginalRigRuntime = originalRigRuntime.getSummary();
  });
  const originalSceneArtRuntime = createEonCityOriginalSceneArtRuntime({
    scene,
    assetRuntime,
    quality: resolvedQuality,
    anchors: originalSceneArtAnchors,
    onStatus,
    onProgress: (progress) => onAssetProgress?.({ scope: 'core', ...progress })
  });
  scene.metadata.eonCityOriginalSceneArtRuntime = originalSceneArtRuntime.getSummary();
  void trackAsyncCityBootStage('ORIGINAL_SCENE_ART_RUNTIME', originalSceneArtRuntime.start(), { quality: resolvedQuality }).then(() => {
    scene.metadata.eonCityOriginalSceneArtRuntime = originalSceneArtRuntime.getSummary();
  }).catch(() => {
    scene.metadata.eonCityOriginalSceneArtRuntime = originalSceneArtRuntime.getSummary();
  });
  scene.metadata.eonCityAssetRuntime = assetRuntime.getSummary();
  const w649CoreRuntime = createEonCityW649BabylonCoreRuntime({
    scene,
    playerAnchor: operator,
    eonbotAnchor: eonbot,
    quality: resolvedQuality,
    reducedMotion,
    onStatus,
    onProgress: (progress) => onAssetProgress?.({ scope: 'district', ...progress })
  });
  scene.metadata.eonCityW649Core = w649CoreRuntime.getSummary();
  const w649DistrictRuntime = createEonCityW649DistrictRuntime({
    scene,
    quality: resolvedQuality,
    reducedMotion,
    capabilities: { meshoptDecoderReady: true, webpTextureReady: true, reducedData: resolvedQuality === 'lite' || reducedMotion === true },
    onStatus
  });
  scene.metadata.eonCityW649Districts = w649DistrictRuntime.getSummary();
  const w649CoreStart = trackAsyncCityBootStage('W649_CONTROLLABLE_CORE', w649CoreRuntime.start(), { quality: resolvedQuality });
  void w649CoreStart.then((coreResult) => {
    scene.metadata.eonCityW649Core = w649CoreRuntime.getSummary();
    return trackAsyncCityBootStage('W649_ORIENTATION_DISTRICT', w649DistrictRuntime.start(), { quality: resolvedQuality })
      .then((districtResult) => ({ coreResult, districtResult }));
  }).then(({ coreResult, districtResult }) => {
    scene.metadata.eonCityW649Districts = w649DistrictRuntime.getSummary();
    onInitialAssetsReady?.({ ok: Boolean(coreResult?.playerLoaded || districtResult?.loadedCount), degraded: !coreResult?.playerLoaded || districtResult?.ok !== true, core: scene.metadata.eonCityW649Core, districts: scene.metadata.eonCityW649Districts });
  }).catch((error) => {
    scene.metadata.eonCityW649Core = w649CoreRuntime.getSummary();
    scene.metadata.eonCityW649Districts = w649DistrictRuntime.getSummary();
    onInitialAssetsReady?.({ ok: true, degraded: true, reason: String(error?.message || error || 'w649-initial-assets-failed'), proceduralFallbackActive: true, core: scene.metadata.eonCityW649Core, districts: scene.metadata.eonCityW649Districts });
  });
  const cellResidency = createEonCityCellResidencyController({ quality: resolvedQuality });
  const initialCellResidency = cellResidency.update(operator.position);
  scene.metadata.cityCellResidency = initialCellResidency.summary;
  const livingNexusRuntime = createEonCityLivingNexusBabylonRuntime({
    scene,
    playerAnchor: operator,
    quality: resolvedQuality,
    reducedMotion,
    seed: state.citySeed || state.worldId || 'eon-command',
    onStatus
  });
  scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
  const coreWorldAuthority = projectEonCityW719CoreWorldAuthority(livingNexusRuntime.getConnectedCorePlan?.() || {});
  const CORE_WORLD_BOUND = Math.max(LEGACY_CORE_WORLD_BOUND, coreWorldAuthority.worldBound);
  const initialCoreArrival = coreWorldAuthority.arrival;
  operator.position.set(initialCoreArrival.x, initialCoreArrival.y, initialCoreArrival.z);
  operator.rotation.y = initialCoreArrival.heading;
  const structuralBounds = scene.meshes
    .filter((mesh) => isEonCityCameraOccluder(mesh))
    .map((mesh) => {
      try {
        const box = mesh.getBoundingInfo?.().boundingBox;
        return box ? { min: box.minimumWorld, max: box.maximumWorld } : null;
      } catch { return null; }
    })
    .filter(Boolean);
  const arrivalCamera = resolveEonCityW719ArrivalCamera({
    districtId: initialCoreArrival.districtId,
    playerPosition: initialCoreArrival,
    structuralBounds
  });
  camera.alpha = arrivalCamera.cameraAlpha;
  camera.beta = clamp(arrivalCamera.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
  camera.radius = clamp(arrivalCamera.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
  camera.setTarget(new Vector3(arrivalCamera.target.x, arrivalCamera.target.y, arrivalCamera.target.z));
  let activeCameraTargetOffset = Object.freeze({ ...arrivalCamera.targetOffset });
  scene.metadata.eonCityCoreWorld = Object.freeze({ ...coreWorldAuthority, arrivalCamera });
  let livingNexusCorePose = null;
  const movement = new Set();
  const analogMovement = { x: 0, z: 0 };
  const clickMove = { enabled: Boolean(defaultClickMove), destination: null, pointerStart: null };
  if (clickMove.enabled) onClickMoveChange?.({ enabled: true, defaultEnabled: true });
  const clickMoveMarker = createClickMoveMarker(scene);
  const thirdPersonCollisionVolumes = Object.freeze([
    ...createEonCityStaticCollisionVolumes({ landmarks: CITY_PLAY_LANDMARKS }),
    ...EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES.map((entry) => Object.freeze({ ...entry, type: 'circle' })),
    ...getEonCityW649DistrictCollisionVolumes()
  ]);
  const landmarkInteractions = createLandmarkInteractionRuntime(scene, CITY_PLAY_LANDMARKS);
  const cameraOcclusion = createEonCityCameraOcclusionController({ scene, camera, target: operator });
  const landmarkFocusState = createEonCityLandmarkFocusState();
  const characterMotionDirector = createEonCityCharacterMotionDirector({ initialHeading: operator.rotation.y, walkSpeed: settings.playerSpeed });
  const wayfinderStateDirector = createEonCityWayfinderStateDirector({ reducedMotion: Boolean(reducedMotion) });
  let wayfinderCameraProfileId = 'follow';
  let wayfinderCameraProfile = getEonCityWayfinderCameraProfile(wayfinderCameraProfileId);
  let wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
  const setCameraTargetOffset = (offset = {}) => {
    activeCameraTargetOffset = Object.freeze({
      x: Number.isFinite(Number(offset.x)) ? Number(offset.x) : 0,
      y: clamp(Number.isFinite(Number(offset.y)) ? Number(offset.y) : wayfinderCameraProfile.targetHeight, 0.7, 4.5),
      z: Number.isFinite(Number(offset.z)) ? Number(offset.z) : 0
    });
    return activeCameraTargetOffset;
  };
  const syncCameraTarget = () => {
    camera.target.copyFromFloats(
      operator.position.x + activeCameraTargetOffset.x,
      operator.position.y + activeCameraTargetOffset.y,
      operator.position.z + activeCameraTargetOffset.z
    );
    return camera.target;
  };
  const setFollowCameraTarget = () => {
    setCameraTargetOffset({ x: 0, y: wayfinderCameraProfile.targetHeight, z: 0 });
    return syncCameraTarget();
  };
  const applyCoreArrivalCamera = () => {
    const nextArrival = resolveEonCityW719ArrivalCamera({
      districtId: initialCoreArrival.districtId,
      playerPosition: operator.position,
      structuralBounds
    });
    camera.alpha = nextArrival.cameraAlpha;
    camera.beta = clamp(nextArrival.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
    camera.radius = clamp(nextArrival.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
    wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
    setCameraTargetOffset(nextArrival.targetOffset);
    syncCameraTarget();
    scene.metadata.eonCityCoreWorld = Object.freeze({ ...coreWorldAuthority, arrivalCamera: nextArrival });
    return nextArrival;
  };
  let wayfinderCameraSnapshot = resolveEonCityWayfinderCamera({ target: camera.target, alpha: camera.alpha, beta: camera.beta, radius: wayfinderCameraDesiredRadius, minRadius: wayfinderCameraProfile.minRadius, maxRadius: wayfinderCameraProfile.maxRadius, colliders: thirdPersonCollisionVolumes });
  let wayfinderStateSnapshot = wayfinderStateDirector.getSnapshot();
  const companionDirector = createEonCityCompanionDirector({ initialPosition: { x: eonbot.position.x, y: eonbot.position.y, z: eonbot.position.z } });
  const eonbotCuriosityController = createEonCityW679EonbotCuriosityController({ now: () => globalThis.performance?.now?.() || Date.now() });
  let characterMotionSnapshot = characterMotionDirector.getSnapshot();
  let companionMotionSnapshot = companionDirector.getSnapshot();
  let eonbotCuriositySnapshot = eonbotCuriosityController.getSnapshot();
  let companionIntent = Object.freeze({ mode: '', until: 0 });
  let eonbotOrbitPresentation = getEonCityEonbotOrbitPresentation('follow');
  let lastFocusedNavigatorId = null;
  const publishLandmarkFocus = (landmark, source = 'ui', { selected = false } = {}) => {
    if (!landmark) return null;
    const playable = getPlayableLandmark(landmark.id) || landmark;
    if (selected) landmarkInteractions.select(playable.id);
    const distance = Math.hypot(operator.position.x - playable.x, operator.position.z - playable.z);
    const focus = landmarkFocusState.focus({ id: playable.id, source, distance, radius: playable.radius });
    onLandmarkFocus?.(playable, focus);
    return focus;
  };
  const focusNearestLandmark = (source = 'keyboard') => {
    const landmark = getNearestLandmark(operator.position);
    if (!landmark) {
      onInputModeChange?.('No landmark is in range. Move closer or select a visible City signal first.');
      return false;
    }
    publishLandmarkFocus(landmark, source, { selected: true });
    wayfinderStateDirector.request('inspect', { durationMs: 900 });
    onStatus?.(`${landmark.label} is focused locally. Choose Enter, Guide, Quick Open or Inspect from the visible landmark card.`);
    return true;
  };
  scene.metadata.eonUniverseLandmarkInteractions = { count: landmarkInteractions.count, localOnly: true, opensRoute: false, executesWork: false, hoverFocus: true, controllerFocus: true };
  const agentPresenceRoot = new TransformNode('agent-presence-root', scene);
  const agentActors = new Map();
  const agentHuddleRef = { current: null };
  const agentOutcomeRef = { current: null };
  const setAgentPresence = (entries = [], preferences = agentPresencePreferences, outcome = agentOutcome) => syncAgentPresence(scene, agentPresenceRoot, agentActors, agentHuddleRef, agentOutcomeRef, Array.isArray(entries) ? entries : [], preferences || {}, outcome || getAgentPresenceOutcome({ latest: null }));
  setAgentPresence(agentPresence, agentPresencePreferences, agentOutcome);
  let destroyed = false;
  let paused = false;
  // Babylon's standard ArcRotate pointer input is intentionally detached only
  // while the person has explicitly locked the pointer. This prevents two
  // camera handlers from applying the same mouse movement. It is reattached on
  // release, so normal mouse drag remains available without pointer lock.
  let cameraControlAttached = true;
  const applyWayfinderCameraProfile = (profileId = 'follow', reason = 'user') => {
    const next = getEonCityWayfinderCameraProfile(profileId);
    const previous = wayfinderCameraProfile;
    wayfinderCameraProfileId = next.id;
    wayfinderCameraProfile = next;
    wayfinderCameraDesiredRadius = next.radius;
    camera.alpha += next.alphaOffset - (previous?.alphaOffset || 0);
    camera.beta = clamp(next.beta, camera.lowerBetaLimit, camera.upperBetaLimit);
    camera.radius = clamp(next.radius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
    onInputModeChange?.(`${next.label} camera selected locally (${reason}). C cycles views; R resets to Follow.`);
    return Object.freeze({ ok: true, profileId: next.id, label: next.label, localOnly: true, opensRoute: false, workStateChanged: false });
  };
  const cycleWayfinderCamera = (reason = 'user') => {
    const index = Math.max(0, EON_CITY_WAYFINDER_CAMERA_PROFILES.findIndex((entry) => entry.id === wayfinderCameraProfileId));
    return applyWayfinderCameraProfile(EON_CITY_WAYFINDER_CAMERA_PROFILES[(index + 1) % EON_CITY_WAYFINDER_CAMERA_PROFILES.length].id, reason);
  };
  const resetWayfinderCamera = (reason = 'user') => applyWayfinderCameraProfile('follow', reason);
  const pointerLook = createEonCityPointerLook({
    canvas,
    documentRef: document,
    onLook: ({ yaw, pitch }) => {
      if (destroyed || paused || contextLost) return;
      camera.alpha += yaw;
      camera.beta = clamp(camera.beta + pitch, camera.lowerBetaLimit, camera.upperBetaLimit);
    },
    onChange: (snapshot) => {
      const { active, requested, supported, reason } = snapshot;
      if (active && cameraControlAttached) {
        try { camera.detachControl(canvas); } catch {}
        cameraControlAttached = false;
      } else if (!active && !cameraControlAttached && !destroyed && !contextLost) {
        try { camera.attachControl(canvas, true); } catch {}
        cameraControlAttached = true;
      }
      const message = !supported
        ? 'Pointer look is unavailable in this browser. Mouse drag controls remain available.'
        : active
          ? 'Pointer look is active locally. Press Escape to release it; WASD still moves the operator.'
          : requested
            ? 'Pointer look requested. Confirm the browser prompt if it appears.'
            : reason === 'request-failed'
              ? 'Pointer look was not enabled. Mouse drag controls remain available.'
              : 'Pointer look is off. Use the visible Pointer look control or press L to request it.';
      onInputModeChange?.(message);
      onPointerLookChange?.(snapshot);
    }
  });
  const togglePointerLook = () => {
    const snapshot = pointerLook.getSnapshot();
    if (snapshot.active || snapshot.requested) return pointerLook.release('user-toggle-off');
    return pointerLook.request();
  };
  const detachKeyboard = makeInputHandlers(canvas, movement, { onPauseRequest, onMinimapToggle, onInteractRequest, onLandmarkFocusRequest: focusNearestLandmark, onPointerLookToggle: togglePointerLook, onCameraCycle: cycleWayfinderCamera, onCameraReset: resetWayfinderCamera, onInputModeChange });
  let contextLost = false;
  let lastTelemetryAt = 0;
  let lastCollisionAt = 0;
  let totalFrameMs = 0;
  let frameCount = 0;
  let minFrameMs = Infinity;
  let maxFrameMs = 0;
  let lastFrameAt = performance.now();
  let activeLandmarkId = null;
  let activeApproachId = null;
  let latestNearbyLandmark = null;
  let activeLivingNexusOpportunityId = null;
  let latestLivingNexusOpportunity = null;
  let activeLivingNexusRealmSignalId = null;
  let activeLivingNexusGatewayId = null;
  let latestLivingNexusGateway = null;
  let latestLivingNexusRealmSignal = null;
  let latestInputIntent = resolveEonCityInputIntent();
  let gamepadAnnounced = false;
  let gamepadInteractLatched = false;
  let gamepadCameraCycleLatched = false;
  let gamepadCameraResetLatched = false;
  let clickMoveAnnounced = false;
  const qualityGovernor = createCityQualityGovernor({ quality: resolvedQuality });
  const workloadGovernor = getEonWorkloadGovernor();
  let activeCinematicShotId = null;
  let firstFrameReported = false;
  let firstRenderAttempted = false;
  let firstRenderCompleted = false;
  let engineStagesStarted = false;

  const contextLossHandler = (event) => {
    event.preventDefault?.();
    contextLost = true;
    performanceObservation.recordStage('webgl-context-lost');
    paused = true;
    scene.metadata.playPaused = true;
    qualityGovernor.recordContextLoss();
    onStatus?.('Graphics context was lost. Try EON City again or use low-detail mode.');
    onContextLoss?.({ reason: 'webgl-context-lost', localOnly: true });
    onFallback?.({ reason: 'webgl-context-lost' });
  };
  const visibilityHandler = () => {
    const hidden = document.visibilityState === 'hidden';
    qualityGovernor.setVisibility(hidden);
    workloadGovernor.setVisibility(hidden ? 'hidden' : 'visible');
    if (hidden) {
      pointerLook.release('tab-hidden');
      paused = true;
      scene.metadata.playPaused = true;
    }
  };
  const resizeHandler = () => engine.resize();
  const clickMovePointerDown = (event) => {
    if (event.button !== 0) return;
    clickMove.pointerStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, pointerType: event.pointerType || 'mouse' };
  };
  const clickMovePointerUp = (event) => {
    const start = clickMove.pointerStart;
    clickMove.pointerStart = null;
    if (!start || start.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (distance > CLICK_MOVE_TAP_DISTANCE) return;
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const selectedLandmark = landmarkInteractions.pickAt(localX, localY);
    if (selectedLandmark) {
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      const source = start.pointerType === 'touch' ? 'touch' : 'mouse';
      const focus = publishLandmarkFocus(selectedLandmark, source, { selected: true });
      onLandmarkSelect?.(selectedLandmark, { source, focus });
      onStatus?.(`${selectedLandmark.label} selected locally. Choose Enter, Guide, Quick Open or Inspect from the visible landmark card.`);
      return;
    }
    if (!clickMove.enabled || start.pointerType === 'touch') return;
    const hit = scene.pick(localX, localY, (mesh) => mesh.name === 'street');
    if (!hit?.hit || !hit.pickedPoint) return;
    const activeWorldBound = livingNexusRuntime.getSummary().destination === 'core' ? CORE_WORLD_BOUND : LIVING_NEXUS_WORLD_BOUND;
    clickMove.destination = new Vector3(clamp(hit.pickedPoint.x, -activeWorldBound, activeWorldBound), 0, clamp(hit.pickedPoint.z, -activeWorldBound, activeWorldBound));
    activeCinematicShotId = null;
    clickMoveMarker.setEnabled(true);
    if (!clickMoveAnnounced) {
      clickMoveAnnounced = true;
      onInputModeChange?.('Mouse travel is active. Click a district signal to inspect it, or click the floor to move locally; keyboard, touch or controller movement cancels the marker.');
    }
    onStatus?.('Local movement marker set. Click a named district signal to review it; no route, work action, or data transfer was created.');
  };

  const clickMovePointerCancel = () => { clickMove.pointerStart = null; };
  const landmarkHoverPointerMove = (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    if (pointerLook.getSnapshot().active) return;
    const rect = canvas.getBoundingClientRect();
    const hovered = landmarkInteractions.pickAt(event.clientX - rect.left, event.clientY - rect.top);
    const previous = landmarkInteractions.getSnapshot().hoveredId;
    if ((hovered?.id || null) === previous) return;
    landmarkInteractions.setHover(hovered?.id || '');
    if (!hovered) {
      if (landmarkFocusState.getSnapshot()?.source === 'hover') landmarkFocusState.clear();
      onLandmarkHover?.(null, null);
      return;
    }
    const playable = getPlayableLandmark(hovered.id) || hovered;
    const distance = Math.hypot(operator.position.x - playable.x, operator.position.z - playable.z);
    const focus = landmarkFocusState.focus({ id: playable.id, source: 'hover', distance, radius: playable.radius });
    onLandmarkHover?.(playable, focus);
  };
  const landmarkHoverPointerLeave = () => {
    landmarkInteractions.clearHover();
    if (landmarkFocusState.getSnapshot()?.source === 'hover') landmarkFocusState.clear();
    onLandmarkHover?.(null, null);
  };
  canvas.addEventListener('webglcontextlost', contextLossHandler, false);
  canvas.addEventListener('pointerdown', clickMovePointerDown);
  canvas.addEventListener('pointerup', clickMovePointerUp);
  canvas.addEventListener('pointercancel', clickMovePointerCancel);
  canvas.addEventListener('pointermove', landmarkHoverPointerMove);
  canvas.addEventListener('pointerleave', landmarkHoverPointerLeave);
  document.addEventListener('visibilitychange', visibilityHandler);
  globalThis.addEventListener?.('resize', resizeHandler);

  const getRuntimeSummary = () => {
    const companion = scene.metadata?.eonbotCompanion || Object.freeze({ id: 'eonbot-city-companion', skinId: 'command-orbit', detail: 'full', captionKind: 'orientation', localOnly: true, autonomousAgent: false, privateContentVisible: false, subscriptionEntitlementClaimed: false });
    const eonbotRig = scene.metadata?.eonbotRig || Object.freeze({ schema: 'eon.city.eonbot-rig.w571.v1', quality: 'balanced', detail: 'full', stageId: 'operator-sidecar-stage', meshBudget: 17, localOnly: true, visualOnly: true, binaryAssets: false, remoteAssets: false, sameSafePanel: true, subscriptionEntitlementClaimed: false });
    return Object.freeze({
    schema: BABYLON_PLAY_SCENE_SCHEMA,
    quality: resolvedQuality,
    engine: 'Babylon WebGL',
    running: !destroyed && !paused && !contextLost,
    paused,
    contextLost,
    frameSamples: frameCount,
    averageFrameMs: frameCount ? Math.round((totalFrameMs / frameCount) * 100) / 100 : null,
    minFrameMs: Number.isFinite(minFrameMs) ? Math.round(minFrameMs * 100) / 100 : null,
    maxFrameMs: maxFrameMs ? Math.round(maxFrameMs * 100) / 100 : null,
    fps: Math.round(engine.getFps() || 0),
    activeMeshes: scene.meshes.length,
    activeLights: scene.lights.length,
    cameraSightline: cameraOcclusion.getSummary(),
    agentPresenceVisible: agentActors.size,
    agentPresenceHuddleVisible: Boolean(agentHuddleRef.current),
    agentPresenceOutcomeVisible: Boolean(agentOutcomeRef.current),
    agentPresenceLocalOnly: true,
    eonbotCompanion: Object.freeze({ id: 'eonbot-city-companion', skinId: companion.skinId, detail: companion.detail, captionKind: companion.captionKind, localOnly: true, autonomousAgent: false, privateContentVisible: false, subscriptionEntitlementClaimed: false }),
    eonbotRig: Object.freeze({ schema: eonbotRig.schema, quality: eonbotRig.quality, detail: eonbotRig.detail, stageId: eonbotRig.stageId, meshBudget: eonbotRig.meshBudget, localOnly: true, visualOnly: true, binaryAssets: true, remoteAssets: false, sameSafePanel: true, subscriptionEntitlementClaimed: false }),
    originalRigs: originalRigRuntime.getSummary(),
    w649Core: w649CoreRuntime.getSummary(),
    w649Districts: w649DistrictRuntime.getSummary(),
    originalSceneArt: originalSceneArtRuntime.getSummary(),
    characterMotion: characterMotionSnapshot,
    wayfinder: Object.freeze({ visual: EON_CITY_WAYFINDER_VISUAL_PROFILE, state: wayfinderStateSnapshot, camera: wayfinderCameraSnapshot, cameraProfileId: wayfinderCameraProfileId, cameraProfiles: EON_CITY_WAYFINDER_CAMERA_PROFILES.map((entry) => entry.id), localOnly: true }),
    companionMotion: companionMotionSnapshot,
    eonbotCuriosity: eonbotCuriositySnapshot,
    eonbotOrbit: Object.freeze({ ...eonbotOrbitPresentation, localOnly: true, dismissed: false, autoNavigation: false, privateDataRead: false }),
    privateProjectDistrictVisible: Number(runtimeState.projectDistricts?.visibleCount || 0),
    privateProjectDistrictLocalOnly: true,
    effectMode: resolvedQuality === 'cinematic' ? 'PBR + glow + local soft shadows + procedural rain + authored district detail' : (resolvedQuality === 'balanced' ? 'PBR + glow + bounded authored district detail' : 'PBR + reduced effects + simplified silhouettes'),
    rendererProfile: Object.freeze({ ...EON_CITY_PROCEDURAL_RENDERER_PROFILE, cinematicShadows: runtimeState.cinematicShadows }),
    artDirection,
    worldGrammar: worldRenderProfile,
    landmarkInteractions: Object.freeze({ ...landmarkInteractions.getSnapshot(), localOnly: true, clickSelect: true, hoverFocus: true, controllerFocus: true, autoNavigation: false, focus: landmarkFocusState.getSnapshot() }),
    artReview: getCityArtReviewSummary({ quality: resolvedQuality }),
    activeCinematicShotId,
    artProfile: w649CoreRuntime.getSummary().player.loaded
      ? 'w649-content-hashed-controllable-core-owner-review-pending'
      : 'original-procedural-source-controlled-fallback',
    commandDistrict: Object.freeze({ id: districtBlueprint.id, title: districtBlueprint.title, structures: districtBlueprint.structures.length, guideRoles: EON_COMMAND_DISTRICT_NPC_ROLES.length, originalProceduralFallback: true, commandDeck: true, creatorAtrium: true, displaysPrivateWork: false, localNavigationOnly: true }),
    arrivalDistrict: Object.freeze({ id: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.id, title: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.title, rendered: Boolean(arrivalDistrict), firstMission: EON_CITY_ARRIVAL_DISTRICT_BLUEPRINT.firstMission.id, originalProcedural: true, binaryAssets: false, localOnly: true }),
    creatorForgeDistrict: Object.freeze({ id: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.id, title: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.title, rendered: Boolean(creatorForgeDistrict?.root), districts: EON_CITY_CREATOR_FORGE_DISTRICT_BLUEPRINT.districts.map((district) => district.id), nativeLaunchBoard: 'W404 Creator Atrium', originalProcedural: true, binaryAssets: false, localOnly: true }),
    livingSystems: runtimeState.livingSystems?.getSummary?.() || Object.freeze({ staged: true, pending: true, localOnly: true, remoteTraffic: false, userData: false }),
    commandDistrictNpcSystem: Object.freeze({ schema: runtimeState.commandDistrictNpcPlan?.schema || 'eon.city.command-district-npc-system.w624f.v1', archetypeCount: runtimeState.commandDistrictNpcPlan?.archetypes?.length || 0, activeCount: runtimeState.commandDistrictNpcSystem?.getSnapshot?.()?.activeCount || 0, stateCount: EON_CITY_COMMAND_DISTRICT_NPC_STATES.length, lod: runtimeState.commandDistrictNpcSystem?.getSnapshot?.()?.lod?.id || 'disabled', authoredPathCount: runtimeState.commandDistrictNpcPlan?.authoredPathIds?.length || 0, localOnly: true, presentationOnly: true, autoNavigation: false, privateDataVisible: false }),
    npcCrowd: Object.freeze({ schema: runtimeState.npcCrowdPlan?.schema || 'eon.city.npc-archetypes.w570.v1', ambientCount: runtimeState.npcCrowdPlan?.ambientCount || 0, readableFaces: runtimeState.npcCrowdPlan?.readableFaces === true, localVisualOnly: true, interactive: false, autonomous: false, privateDataVisible: false }),
    seededAmbience: Object.freeze({ schema: runtimeState.seededAmbience?.plan?.schema || 'eon.city.seeded-ambience.w573.v1', quality: runtimeState.seededAmbience?.plan?.quality || resolvedQuality, phase: runtimeState.seededAmbience?.plan?.phase?.id || 'arrival-pulse', staticSignCount: runtimeState.seededAmbience?.signCount || 0, trafficCount: runtimeState.seededAmbience?.trafficCount || 0, visualMomentCount: runtimeState.seededAmbience?.visualMomentCount || 0, motionEnabled: runtimeState.seededAmbience?.plan?.motionEnabled === true && !scene.metadata?.playPaused && !scene.metadata?.playReducedEffects, localVisualOnly: true, interactive: false, autonomous: false, privateDataVisible: false }),
    openSkyProfile: runtimeState.openSky?.getSummary?.() || Object.freeze({ schema: 'eon.city.open-sky.w574.v1', profileId: EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, localVisualOnly: true, sourceControlled: true, sessionOnly: true, interactive: false, privateDataVisible: false }),
    artBudget: Object.freeze({ facadeFins: artBudget.facadeFins, streetProps: artBudget.streetProps, signCount: artBudget.signCount }),
    assetPipeline: assetRuntime.getSummary(),
    cellResidency: cellResidency.getSummary(),
    livingNexus: livingNexusRuntime.getSummary(),
    vectorArt: vectorArtRuntime.getSummary(),
    visualProgression,
    artIntake: getCityArtIntakeSummary({ quality: resolvedQuality }),
    materialPolicy: getCityMaterialPolicySummary(resolvedQuality),
    inputSupport: Object.freeze(['keyboard-screen-relative', 'touch-analog-joystick', 'touch-direction-pad', 'mouse-direct-click-and-click-to-move', 'optional-gamepad']),
    controls: Object.freeze({ clickToMove: clickMove.enabled, destination: clickMove.destination ? Object.freeze({ x: Math.round(clickMove.destination.x * 10) / 10, z: Math.round(clickMove.destination.z * 10) / 10 }) : null, activeInputSource: latestInputIntent?.source || 'none', screenRelativeDirection: EON_CITY_CONTROL_CONVENTION.positiveStrafeMeans, analogActive: Math.hypot(analogMovement.x, analogMovement.z) > 0, gamepadDetected: gamepadAnnounced, approach: latestNearbyLandmark ? describeEonCityLandmarkApproach({ player: operator.position, landmark: latestNearbyLandmark }) : null }),
    performanceGovernor: qualityGovernor.getSnapshot(),
    performanceObservation: performanceObservation.getSnapshot(),
    authoredVerticalSlice: Object.freeze({ ...getCityAuthoredVerticalSliceSummary({ quality: resolvedQuality }), activeMarkerCount: runtimeState.authoredVerticalSlice?.activeMarkerCount || 0, activeLabelCount: runtimeState.authoredVerticalSlice?.activeLabelCount || 0, staged: !runtimeState.authoredVerticalSlice }),
    engineStaging: engineStages.getSummary(),
    remoteTelemetry: false,
    remoteAssets: false
    });
  };

  const applyPerformanceProtection = (reason) => {
    if (resolvedQuality === 'lite' || qualityGovernor.getSnapshot().protectionApplied) {
      return Object.freeze({ applied: false, reason: 'already-lite-or-protected', governor: qualityGovernor.getSnapshot() });
    }
    const governorSnapshot = qualityGovernor.markProtectionApplied(reason);
    scene.metadata.playReducedEffects = true;
    performanceObservation.recordStage('performance-protection-applied');
    const rain = runtimeState.rain;
    const livingSystems = runtimeState.livingSystems;
    const noirWorldDetail = runtimeState.noirWorldDetail;
    rain?.setEnabled(false);
    livingSystems?.setReducedEffects?.(true);
    noirWorldDetail?.root?.setEnabled(false);
    runtimeState.commandDistrictNpcSetLod?.('lite');
    livingNexusRuntime.setReducedEffects(true);
    engineStages.skipOptional();
    if (glow) glow.intensity = 0;
    engine.setHardwareScalingLevel(Math.min(1.75, Math.max(settings.hardwareScaling, settings.hardwareScaling * 1.28)));
    engine.resize();
    onPerformanceChange?.({
      reason,
      effectiveEffects: 'reduced locally',
      governor: governorSnapshot,
      message: 'Performance protection reduced local visual effects. Your selected profile is not overwritten; low-detail mode remains available in this City.'
    });
    return Object.freeze({ applied: true, reason, governor: governorSnapshot });
  };

  scene.registerBeforeRender(() => {
    if (!firstFrameReported) {
      firstFrameReported = true;
      performanceObservation.recordFirstFrame();
      performanceObservation.captureMemory();
      recordCityBootStage('FIRST_FRAME_REPORTED', { quality: resolvedQuality });
      onFirstFrame?.({ quality: resolvedQuality, renderer: 'babylon' });
    }
    const now = performance.now();
    const deltaMs = Math.min(80, Math.max(0, now - lastFrameAt));
    lastFrameAt = now;
    if (paused || contextLost || destroyed) return;
    totalFrameMs += deltaMs;
    frameCount += 1;
    performanceObservation.recordFrame(deltaMs);
    workloadGovernor.recordFrame(deltaMs);
    if (frameCount % 180 === 0) performanceObservation.captureMemory();
    minFrameMs = Math.min(minFrameMs, deltaMs);
    maxFrameMs = Math.max(maxFrameMs, deltaMs);
    // Legacy W254 threshold equivalence: frameCount >= 150 and warmupAverage > 36ms for balanced City are now delegated to the bounded W431 policy instead of a mutable inline governor.
    const governorDecision = qualityGovernor.recordFrame(deltaMs).decision;
    if (governorDecision?.action === 'apply-protection') {
      applyPerformanceProtection(governorDecision.reason);
    } else if (governorDecision?.action === 'recommend-safe-mode') {
      onPerformanceChange?.({
        reason: governorDecision.reason,
        effectiveEffects: 'already reduced locally',
        governor: governorDecision.snapshot,
        message: 'Local performance remains constrained after the protection pass. Low-detail mode is available as a visible choice; EON City will not restart or change your preference automatically.'
      });
    }
    const gamepad = readGamepadState();
    if (gamepad.connected && !gamepadAnnounced) {
      gamepadAnnounced = true;
      onInputModeChange?.('Optional controller detected. The action button can request the visible interaction review, but never confirms a destination.');
    }
    if (gamepad.interactPressed && !gamepadInteractLatched) {
      gamepadInteractLatched = true;
      const focused = focusNearestLandmark('controller');
      // The controller action is never a generic global Interact. It only
      // requests the already focused named landmark review, remains local, and
      // still requires a separate visible Enter/Quick Open confirmation.
      if (focused) onInteractRequest?.('gamepad');
      else onInputModeChange?.('No named landmark is in range. Move closer, use the visible Districts control, or click/tap a City signal.');
    }
    if (!gamepad.interactPressed) gamepadInteractLatched = false;
    if (gamepad.cameraCyclePressed && !gamepadCameraCycleLatched) {
      gamepadCameraCycleLatched = true;
      cycleWayfinderCamera('controller right shoulder');
    }
    if (!gamepad.cameraCyclePressed) gamepadCameraCycleLatched = false;
    if (gamepad.cameraResetPressed && !gamepadCameraResetLatched) {
      gamepadCameraResetLatched = true;
      resetWayfinderCamera('controller left shoulder');
    }
    if (!gamepad.cameraResetPressed) gamepadCameraResetLatched = false;

    const keyboardX = (movement.has('right') ? 1 : 0) - (movement.has('left') ? 1 : 0);
    const keyboardForward = (movement.has('up') ? 1 : 0) - (movement.has('down') ? 1 : 0);
    const inputIntent = resolveEonCityInputIntent({
      keyboard: { x: keyboardX, z: keyboardForward },
      touch: { x: analogMovement.x, z: -analogMovement.z },
      controller: { x: gamepad.x, z: -gamepad.z }
    });
    latestInputIntent = inputIntent;
    const manualInputActive = inputIntent.active;
    if (manualInputActive) clickMove.destination = null;

    const move = new Vector3(0, 0, 0);
    if (manualInputActive) {
      const forward = camera.getForwardRay().direction.clone();
      forward.y = 0;
      if (forward.lengthSquared() > 0.0001) forward.normalize();
      const screenRelativeMove = resolveEonCityCameraRelativeMove({
        input: inputIntent,
        cameraForward: { x: forward.x, z: forward.z }
      });
      move.set(screenRelativeMove.x, 0, screenRelativeMove.z);
    } else if (clickMove.destination) {
      const toward = clickMove.destination.subtract(operator.position);
      toward.y = 0;
      if (toward.length() <= 0.18) {
        clickMove.destination = null;
        clickMoveMarker.setEnabled(false);
        onStatus?.('Reached the local movement marker. Approach a district signal to request an interaction review.');
      } else {
        toward.normalize();
        move.copyFrom(toward);
      }
    }
    let appliedStep = 0;
    let movementCollided = false;
    if (move.lengthSquared() > 0) {
      move.normalize();
      const step = settings.playerSpeed * (deltaMs / 1000);
      const livingNexusSummary = livingNexusRuntime.getSummary();
      const livingNexusColliders = ['expanse', 'realm'].includes(livingNexusSummary.destination) ? livingNexusRuntime.getCollisionVolumes() : [];
      const resolvedMovement = resolveEonCityThirdPersonPosition({
        position: operator.position,
        desiredMove: move,
        step,
        bounds: livingNexusSummary.destination === 'core' ? CORE_WORLD_BOUND : LIVING_NEXUS_WORLD_BOUND,
        radius: 0.38,
        colliders: livingNexusColliders.length ? [...thirdPersonCollisionVolumes, ...livingNexusColliders] : thirdPersonCollisionVolumes
      });
      operator.position.x = resolvedMovement.position.x;
      operator.position.z = resolvedMovement.position.z;
      appliedStep = resolvedMovement.appliedStep;
      movementCollided = resolvedMovement.collided;
      if (movementCollided && now - lastCollisionAt > 900) {
        lastCollisionAt = now;
        onInputModeChange?.('A local City boundary or structure blocked movement. Choose another route; no work or data changed.');
      }
    }
    characterMotionSnapshot = characterMotionDirector.update({
      desiredMove: move,
      appliedStep,
      deltaMs,
      focused: Boolean(landmarkFocusState.getSnapshot()?.focusedId),
      heading: operator.rotation.y
    });
    wayfinderStateSnapshot = wayfinderStateDirector.update({
      moving: characterMotionSnapshot.moving,
      speed: characterMotionSnapshot.speed,
      turnRate: characterMotionSnapshot.turnRate,
      focused: Boolean(landmarkFocusState.getSnapshot()?.focusedId)
    });
    operator.metadata?.applyWayfinderState?.(wayfinderStateSnapshot.state, now, scene.metadata?.playReducedEffects === true);
    operator.rotation.y = characterMotionSnapshot.heading;
    if (clickMove.destination) {
      clickMoveMarker.position.x = clickMove.destination.x;
      clickMoveMarker.position.z = clickMove.destination.z;
      if (!scene.metadata?.playReducedEffects) clickMoveMarker.rotation.z += 0.024;
    }
    const cellResidencyUpdate = cellResidency.update(operator.position);
    if (cellResidencyUpdate.ok && (cellResidencyUpdate.entered.length || cellResidencyUpdate.unloaded.length)) {
      scene.metadata.cityCellResidency = cellResidencyUpdate.summary;
    }
    scene.metadata.eonCityLivingNexus = livingNexusRuntime.update({ position: operator.position, now });
    const livingNexusGateway = livingNexusRuntime.getNearestPhysicalGateway?.(operator.position, { maxDistance: livingNexusRuntime.getPhysicalGateway?.()?.discoveryRadius || 18 }) || null;
    latestLivingNexusGateway = livingNexusGateway;
    const livingNexusGatewayFlowStateId = livingNexusGateway?.flowState?.id || null;
    if ((livingNexusGateway?.id || null) !== activeLivingNexusGatewayId || livingNexusGatewayFlowStateId !== (scene.metadata?.eonCityLivingNexusGatewayFlowStateId || null)) {
      activeLivingNexusGatewayId = livingNexusGateway?.id || null;
      scene.metadata.eonCityLivingNexusGatewayInEnterRange = Boolean(livingNexusGateway?.inEntryReadyRange);
      scene.metadata.eonCityLivingNexusGatewayFlowStateId = livingNexusGatewayFlowStateId;
      onLivingNexusGatewayChange?.(livingNexusGateway);
    }
    const livingNexusOpportunity = livingNexusRuntime.getNearestOpportunity(operator.position);
    latestLivingNexusOpportunity = livingNexusOpportunity;
    if ((livingNexusOpportunity?.id || null) !== activeLivingNexusOpportunityId) {
      activeLivingNexusOpportunityId = livingNexusOpportunity?.id || null;
      onLivingNexusOpportunityChange?.(livingNexusOpportunity);
    }
    const livingNexusRealmSignal = livingNexusRuntime.getSummary().destination === 'realm'
      ? livingNexusRuntime.getNearestRealmFeature(operator.position)
      : livingNexusRuntime.getNearestRarePortal(operator.position);
    latestLivingNexusRealmSignal = livingNexusRealmSignal
      ? Object.freeze({ ...livingNexusRealmSignal, signalType: livingNexusRuntime.getSummary().destination === 'realm' ? 'realm-feature' : 'rare-portal', activeRealmId: livingNexusRuntime.getSummary().activeRealmId || null })
      : null;
    if ((latestLivingNexusRealmSignal?.id || null) !== activeLivingNexusRealmSignalId) {
      activeLivingNexusRealmSignalId = latestLivingNexusRealmSignal?.id || null;
      onLivingNexusRealmSignalChange?.(latestLivingNexusRealmSignal);
    }
    w649DistrictRuntime.update(operator.position);
    scene.metadata.eonCityW649Districts = w649DistrictRuntime.getSummary();
    const cameraTarget = syncCameraTarget();
    if (!wayfinderCameraSnapshot.clipped) wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
    wayfinderCameraSnapshot = resolveEonCityWayfinderCamera({
      target: cameraTarget,
      alpha: camera.alpha,
      beta: camera.beta,
      radius: wayfinderCameraDesiredRadius,
      minRadius: wayfinderCameraProfile.minRadius,
      maxRadius: wayfinderCameraProfile.maxRadius,
      colliders: thirdPersonCollisionVolumes
    });
    camera.radius = wayfinderCameraSnapshot.safeRadius;
    scene.metadata.eonCityWayfinder = Object.freeze({ state: wayfinderStateSnapshot, camera: wayfinderCameraSnapshot, profileId: wayfinderCameraProfileId, localOnly: true });
    scene.metadata.eonCityCameraSightline = cameraOcclusion.update(now);
    const nearestLandmark = getNearestLandmark(operator.position);
    latestNearbyLandmark = nearestLandmark;
    if ((nearestLandmark?.id || null) !== activeLandmarkId) {
      activeLandmarkId = nearestLandmark?.id || null;
      onLandmarkChange?.(nearestLandmark);
    }
    const approach = nearestLandmark ? describeEonCityLandmarkApproach({ player: operator.position, landmark: nearestLandmark }) : null;
    if ((approach?.id || null) !== activeApproachId) {
      activeApproachId = approach?.id || null;
      onLandmarkApproach?.(nearestLandmark, approach);
    }
    const focusedNavigatorId = landmarkFocusState.getSnapshot()?.focusedId || null;
    if (focusedNavigatorId && focusedNavigatorId !== lastFocusedNavigatorId) {
      originalRigRuntime.playNavigatorEmote('Inspect', { durationMs: 900 });
    }
    lastFocusedNavigatorId = focusedNavigatorId;
    const activeIntent = companionIntent.until > now ? companionIntent.mode : '';
    if (!activeIntent && companionIntent.mode) companionIntent = Object.freeze({ mode: '', until: 0 });
    const focusedLandmark = focusedNavigatorId ? getPlayableLandmark(focusedNavigatorId) : null;
    const publicNearbyTarget = nearestLandmark ? Object.freeze({
      id: nearestLandmark.id,
      label: nearestLandmark.label,
      kind: nearestLandmark.type || 'landmark',
      position: Object.freeze({ x: nearestLandmark.x, y: nearestLandmark.y || 0, z: nearestLandmark.z })
    }) : null;
    eonbotCuriositySnapshot = eonbotCuriosityController.update({
      deltaMs,
      playerPosition: operator.position,
      companionPosition: eonbot.position,
      moving: characterMotionSnapshot.moving,
      nearby: publicNearbyTarget,
      reducedMotion: scene.metadata?.playReducedEffects === true
    });
    const curiosityTarget = eonbotCuriositySnapshot.target?.position ? Object.freeze({
      id: eonbotCuriositySnapshot.target.id,
      label: eonbotCuriositySnapshot.target.label,
      ...eonbotCuriositySnapshot.target.position
    }) : null;
    companionMotionSnapshot = companionDirector.update({
      operatorPosition: operator.position,
      operatorHeading: operator.rotation.y,
      cameraPosition: camera.position,
      landmark: focusedLandmark,
      nearbyLandmark: curiosityTarget || nearestLandmark,
      dockPosition: eonbotCuriositySnapshot.dockTarget?.position || null,
      moving: characterMotionSnapshot.moving,
      intent: activeIntent || eonbotCuriositySnapshot.directorMode,
      deltaMs,
      reducedMotion: scene.metadata?.playReducedEffects === true
    });
    eonbot.position.set(companionMotionSnapshot.position.x, companionMotionSnapshot.position.y, companionMotionSnapshot.position.z);
    eonbot.rotation.y = companionMotionSnapshot.heading;
    scene.metadata.eonCityCompanionDirector = companionMotionSnapshot;
    scene.metadata.eonCityW679EonbotCuriosity = eonbotCuriositySnapshot;
    scene.metadata.eonCityCharacterMotion = Object.freeze({ ...characterMotionSnapshot, collided: movementCollided });
    let agentIndex = 0;
    agentActors.forEach((actor) => {
      const ring = actor.getChildMeshes?.().find((mesh) => String(mesh.name).includes('agent-presence-ring'));
      if (!scene.metadata?.playReducedEffects) {
        actor.position.y = Math.sin(now * .003 + agentIndex) * .045;
        if (ring) ring.rotation.z += .035;
      }
      agentIndex += 1;
    });
    const huddleRing = agentHuddleRef.current?.getChildMeshes?.().find((mesh) => String(mesh.name).includes('agent-presence-huddle-ring'));
    if (huddleRing && !scene.metadata?.playReducedEffects) huddleRing.rotation.z += .024;
    const outcomeBeacon = agentOutcomeRef.current?.getChildMeshes?.().find((mesh) => String(mesh.name).includes('agent-presence-outcome-beacon'));
    const outcomeRing = agentOutcomeRef.current?.getChildMeshes?.().find((mesh) => String(mesh.name).includes('agent-presence-outcome-ring'));
    if (!scene.metadata?.playReducedEffects) {
      if (outcomeBeacon) outcomeBeacon.rotation.y += .018;
      if (outcomeRing) outcomeRing.rotation.z += .018;
    }
    if (now - lastTelemetryAt > 850) {
      lastTelemetryAt = now;
      onTelemetry?.(getRuntimeSummary());
    }
  });

  engine.runRenderLoop(() => {
    if (destroyed || contextLost) return;
    try {
      if (!firstRenderAttempted) {
        firstRenderAttempted = true;
        recordCityBootStage('FIRST_RENDER_ATTEMPT', { quality: resolvedQuality });
      }
      const transientClip = ({ interact: 'Interact', inspect: 'Inspect', celebrate: 'Celebrate', 'sit-work': 'SitWork', recovery: 'Recovery' })[wayfinderStateSnapshot.state] || '';
      originalRigRuntime.updateNavigator({
        moving: characterMotionSnapshot.moving,
        speed: characterMotionSnapshot.speed,
        turn: characterMotionSnapshot.turnRate,
        emote: wayfinderStateSnapshot.transient ? transientClip : ''
      });
      originalRigRuntime.updateCompanion({ mode: companionMotionSnapshot.mode });
      const w649PlayerState = wayfinderStateSnapshot.transient
        ? ({ interact: 'interact', inspect: 'interact', celebrate: 'victory', 'sit-work': 'idle', recovery: 'idle' })[wayfinderStateSnapshot.state] || 'idle'
        : characterMotionSnapshot.moving
          ? (characterMotionSnapshot.speed > settings.playerSpeed * 0.88 ? 'run' : 'walk')
          : 'idle';
      w649CoreRuntime.update({ playerState: w649PlayerState });
      scene.metadata.eonCityOriginalRigRuntime = originalRigRuntime.getSummary();
      scene.metadata.eonCityW649Core = w649CoreRuntime.getSummary();
      scene.metadata.eonCityW649Districts = w649DistrictRuntime.getSummary();
      scene.metadata.eonCityOriginalSceneArtRuntime = originalSceneArtRuntime.getSummary();
      scene.render();
      if (!firstRenderCompleted) {
        firstRenderCompleted = true;
        recordCityBootStage('FIRST_RENDER_COMPLETED', { quality: resolvedQuality });
      }
      if (!engineStagesStarted) {
        engineStagesStarted = true;
        performanceObservation.recordStage('deferred-stages-started');
        recordCityBootStage('DEFERRED_STAGES_STARTED', { quality: resolvedQuality });
        engineStages.start();
      }
    } catch (error) {
      contextLost = true;
      performanceObservation.recordStage('render-loop-error');
      recordCityBootStage('RENDER_LOOP_ERROR', {
        quality: resolvedQuality,
        firstFrameReported,
        firstRenderAttempted,
        firstRenderCompleted,
        error: describeBootError(error)
      });
      onStatus?.('City hit a local render-stage issue. Safe recovery is preparing.');
      onFallback?.({ reason: 'render-loop-error', error: describeBootError(error) });
    }
  });
  recordCityBootStage('RENDER_LOOP_REGISTERED', { quality: resolvedQuality });
  onStatus?.('EON City is controllable. W649 Pathfinder, EONBOT, and the nearest district now stream from same-origin content-hashed files; only one district is resident and no account, wallet, provider, reward, or private work content enters the renderer.');
  canvas.focus({ preventScroll: true });

  return Object.freeze({
    schema: BABYLON_PLAY_SCENE_SCHEMA,
    canvas,
    getRuntimeSummary,
    getPerformanceObservation() {
      return performanceObservation.getSnapshot();
    },
    getAssetSummary() {
      return Object.freeze({ legacy: assetRuntime.getSummary(), w649: w649CoreRuntime.getSummary(), districts: w649DistrictRuntime.getSummary() });
    },
    getNearestLandmark() {
      return getNearestLandmark(operator.position);
    },
    getLandmark(landmarkId = '') {
      const landmark = getPlayableLandmark(landmarkId);
      return landmark ? Object.freeze({ ...landmark }) : null;
    },
    guideToLandmark(landmarkId = '') {
      if (destroyed || contextLost) return false;
      const landmark = getPlayableLandmark(landmarkId);
      if (!landmark) return false;
      const approachZ = clamp(landmark.z + Math.max(1.25, Math.min(2.25, landmark.radius * 0.56)), -CORE_WORLD_BOUND, CORE_WORLD_BOUND);
      clickMove.destination = new Vector3(landmark.x, 0, approachZ);
      clickMoveMarker.setEnabled(true);
      clickMoveMarker.position.x = landmark.x;
      clickMoveMarker.position.z = approachZ;
      activeCinematicShotId = null;
      onStatus?.(`Local guide set for ${landmark.label}. Manual movement cancels it; no app route opens automatically.`);
      return Object.freeze({ id: landmark.id, label: landmark.label, localOnly: true, opensRoute: false, executesWork: false });
    },
    focusLandmark(landmarkId = '') {
      if (destroyed || contextLost) return false;
      const landmark = getPlayableLandmark(landmarkId);
      if (!landmark) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      const approachZ = clamp(landmark.z + Math.max(1.25, Math.min(2.25, landmark.radius * 0.56)), -CORE_WORLD_BOUND, CORE_WORLD_BOUND);
      operator.position.set(landmark.x, 0, approachZ);
      operator.rotation.y = Math.PI;
      camera.alpha = -Math.PI / 2;
      camera.beta = clamp(worldRenderProfile.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
      camera.radius = clamp(Math.min(worldRenderProfile.cameraRadius, 14.6), camera.lowerRadiusLimit, camera.upperRadiusLimit);
      wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
      setFollowCameraTarget();
      activeCinematicShotId = null;
      const nearby = getNearestLandmark(operator.position);
      activeLandmarkId = nearby?.id || null;
      onLandmarkChange?.(nearby);
      publishLandmarkFocus(landmark, 'ui', { selected: true });
      onStatus?.(`${landmark.label} is in local focus. Choose Quick Open only when you want a separate route review.`);
      return Object.freeze({ id: landmark.id, label: landmark.label, localOnly: true, opensRoute: false, executesWork: false });
    },
    getLandmarkFocus() {
      return landmarkFocusState.getSnapshot();
    },
    clearLandmarkFocus() {
      landmarkInteractions.clearHover();
      landmarkInteractions.clearSelection();
      landmarkFocusState.clear();
      onLandmarkHover?.(null, null);
      return true;
    },
    setAgentPresence(entries = [], preferences = {}, outcome = null) {
      if (destroyed) return;
      setAgentPresence(entries, preferences, outcome);
    },
    setOpenSkyProfile(profileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      const result = applyOpenSkyProfile(profileId);
      if (result.ok) onStatus?.(`${result.label} open-sky visual style applied locally for this City session. It is not time, weather, or a forecast.`);
      return result;
    },
    setProjectDistrictRenderPlans(plans = []) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      try { projectDistricts?.root?.dispose?.(false, true); } catch {}
      projectDistricts = addPrivateProjectDistricts(scene, plans, resolvedQuality);
      runtimeState.projectDistricts = projectDistricts;
      scene.metadata.privateProjectDistricts = { visibleCount: projectDistricts.visibleCount, localOnly: true, privateByDefault: true, projectReferenceExposed: false, promptExposed: false, fileExposed: false, secretExposed: false, publicRouteCreated: false, remoteRequestCreated: false };
      onStatus?.(`${projectDistricts.visibleCount} private City district${projectDistricts.visibleCount === 1 ? '' : 's'} visible locally. No project reference or private content is shown.`);
      return Object.freeze({ ok: true, visibleCount: projectDistricts.visibleCount, localOnly: true, remoteRequestCreated: false });
    },
    getPlayerPosition() {
      return Object.freeze({ x: Math.round(operator.position.x * 100) / 100, z: Math.round(operator.position.z * 100) / 100, heading: Math.round(operator.rotation.y * 100) / 100 });
    },
    getExplorationPose() {
      if (destroyed || contextLost) return null;
      return captureEonCityExplorationPose({
        player: { x: operator.position.x, y: operator.position.y, z: operator.position.z, heading: operator.rotation.y },
        camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: { x: camera.target.x, y: camera.target.y, z: camera.target.z } },
        controller: { mode: 'third-person', pointerLookEnabled: pointerLook.getSnapshot().active }
      });
    },
    restoreExplorationPose(pose = null) {
      if (destroyed || contextLost) return false;
      const restored = normalizeEonCityExplorationPose(pose);
      if (!restored) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(restored.player.x, restored.player.y, restored.player.z);
      operator.rotation.y = restored.player.heading;
      camera.alpha = restored.camera.alpha;
      camera.beta = clamp(restored.camera.beta, camera.lowerBetaLimit, camera.upperBetaLimit);
      camera.radius = clamp(restored.camera.radius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
      wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
      setCameraTargetOffset({
        x: restored.camera.target.x - restored.player.x,
        y: restored.camera.target.y - restored.player.y,
        z: restored.camera.target.z - restored.player.z
      });
      syncCameraTarget();
      pointerLook.release('pose-restored');
      if (restored.controller?.pointerLookEnabled) {
        onInputModeChange?.('Your City location and camera returned exactly. Pointer look stays off until you choose it again, because browsers require a fresh user action.');
      }
      activeCinematicShotId = null;
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.('Returned to your previous City location and camera view.');
      return restored;
    },
    getWorldBounds() {
      return livingNexusRuntime.getSummary().destination === 'core' ? CORE_WORLD_BOUND : LIVING_NEXUS_WORLD_BOUND;
    },
    getLivingNexusSummary() {
      return livingNexusRuntime.getSummary();
    },
    getLivingNexusWorldSystems() {
      return livingNexusRuntime.getWorldSystemsPlan();
    },
    getConnectedCorePlan() {
      return livingNexusRuntime.getConnectedCorePlan();
    },
    getConnectedCoreSummary() {
      return livingNexusRuntime.getConnectedCoreSummary();
    },
    beginConnectedCoreTransitJourney(journey = null, options = {}) {
      return livingNexusRuntime.beginConnectedCoreTransitJourney?.(journey, options) || Object.freeze({ ok: false, reason: 'connected-core-transit-unavailable' });
    },
    getConnectedCoreTransitJourney() {
      return livingNexusRuntime.getConnectedCoreTransitJourney?.() || null;
    },
    getLivingNexusOpportunities() {
      return livingNexusRuntime.getOpportunities();
    },
    getLivingNexusPhysicalGateway() { return livingNexusRuntime.getPhysicalGateway?.() || null; },
    getNearestLivingNexusPhysicalGateway() { return latestLivingNexusGateway || livingNexusRuntime.getNearestPhysicalGateway?.(operator.position, { maxDistance: livingNexusRuntime.getPhysicalGateway?.()?.discoveryRadius || 18 }) || null; },
    getLivingNexusFlagshipExpanseEntryState() { return livingNexusRuntime.getFlagshipExpanseEntryState?.(operator.position) || null; },
    guideToLivingNexusPhysicalGateway({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
      const gateway = livingNexusRuntime.getPhysicalGateway?.();
      if (!gateway) return Object.freeze({ ok: false, reason: 'physical-gateway-unavailable' });
      const approach = resolveEonCityW712GatewayApproachTarget({ gateway, fromPosition: operator.position });
      clickMove.destination = new Vector3(clampEonCityW719CorePoint({ x: approach.x, y: 0, z: approach.z }, coreWorldAuthority).x, 0, clampEonCityW719CorePoint({ x: approach.x, y: 0, z: approach.z }, coreWorldAuthority).z);
      clickMoveMarker.setEnabled(true);
      clickMoveMarker.position.x = clickMove.destination.x;
      clickMoveMarker.position.z = clickMove.destination.z;
      return Object.freeze({ ok: true, gatewayId: gateway.id, x: clickMove.destination.x, z: clickMove.destination.z, approachLane: true, automaticEntry: false, explicitUserAction: true });
    },
    inspectLivingNexusPhysicalGateway({ explicitUserAction = false } = {}) {
      const result = livingNexusRuntime.inspectPhysicalGateway?.(operator.position, { explicitUserAction }) || Object.freeze({ ok: false, reason: 'physical-gateway-unavailable' });
      latestLivingNexusGateway = livingNexusRuntime.getNearestPhysicalGateway?.(operator.position, { maxDistance: livingNexusRuntime.getPhysicalGateway?.()?.discoveryRadius || 18 }) || null;
      onLivingNexusGatewayChange?.(latestLivingNexusGateway ? Object.freeze({ ...latestLivingNexusGateway, prepared: result.ok === true }) : null);
      return result;
    },
    enterLivingNexusPhysicalGateway({ explicitUserAction = false } = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      if (livingNexusRuntime.getSummary().destination !== 'core') return Object.freeze({ ok: false, reason: 'core-not-active' });
      livingNexusCorePose = captureEonCityExplorationPose({
        player: { x: operator.position.x, y: operator.position.y, z: operator.position.z, heading: operator.rotation.y },
        camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: { x: camera.target.x, y: camera.target.y, z: camera.target.z } },
        controller: { mode: 'third-person', pointerLookEnabled: false }
      });
      const result = livingNexusRuntime.enterPhysicalGateway?.(operator.position, { explicitUserAction }) || Object.freeze({ ok: false, reason: 'physical-gateway-unavailable' });
      if (!result.ok) return result;
      movement.clear(); analogMovement.x = 0; analogMovement.z = 0; clickMove.destination = null; clickMoveMarker.setEnabled(false); pointerLook.release('living-nexus-physical-gateway-entry');
      const entryPose = result.entryPose || EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse;
      operator.position.set(entryPose.x, entryPose.y, entryPose.z); operator.rotation.y = entryPose.heading;
      camera.alpha = entryPose.cameraAlpha; camera.beta = clamp(entryPose.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit); camera.radius = clamp(entryPose.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
      setFollowCameraTarget();
      livingNexusRuntime.update({ position: operator.position, now: globalThis.performance?.now?.() || Date.now() });
      activeLivingNexusGatewayId = null; latestLivingNexusGateway = null; onLivingNexusGatewayChange?.(null);
      activeLivingNexusOpportunityId = null; latestLivingNexusOpportunity = null; onLivingNexusOpportunityChange?.(null);
      activeLivingNexusRealmSignalId = null; latestLivingNexusRealmSignal = null; onLivingNexusRealmSignalChange?.(null);
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      onStatus?.('The Expanse is active in the same City scene. EONBOT guidance, Atlas discoveries and physical Realm signals are available.');
      return Object.freeze({ ...result, playerPosition: this.getPlayerPosition(), coreReturnPoseCaptured: Boolean(livingNexusCorePose), safeCoreReturnAvailable: true, oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false });
    },
    getNearestLivingNexusOpportunity() {
      return latestLivingNexusOpportunity || livingNexusRuntime.getNearestOpportunity(operator.position);
    },
    getLivingNexusRealmCatalog() {
      return livingNexusRuntime.getRealmCatalog();
    },
    getLivingNexusRealmSummary() {
      return livingNexusRuntime.getRealmSummary();
    },
    getLivingNexusRealmPlan() {
      return livingNexusRuntime.getRealmPlan();
    },
    getNearestLivingNexusRealmSignal() {
      if (latestLivingNexusRealmSignal) return latestLivingNexusRealmSignal;
      const signal = livingNexusRuntime.getSummary().destination === 'realm'
        ? livingNexusRuntime.getNearestRealmFeature(operator.position)
        : livingNexusRuntime.getNearestRarePortal(operator.position);
      return signal ? Object.freeze({ ...signal, signalType: livingNexusRuntime.getSummary().destination === 'realm' ? 'realm-feature' : 'rare-portal', activeRealmId: livingNexusRuntime.getSummary().activeRealmId || null }) : null;
    },
    prepareLivingNexusRealm(realmId = '', portalId = '', { explicitUserAction = false } = {}) {
      return livingNexusRuntime.prepareRealm(realmId, portalId, { explicitUserAction });
    },
    enterLivingNexusRealm(realmId = '', portalId = '', { explicitUserAction = false } = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      if (!explicitUserAction) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
      const summary = livingNexusRuntime.getSummary();
      if (summary.destination !== 'expanse') return Object.freeze({ ok: false, reason: 'expanse-not-active' });
      const returnPoint = Object.freeze({ x: operator.position.x, z: operator.position.z, cellId: summary.currentCellId || '' });
      const result = livingNexusRuntime.enterRealm(realmId, portalId, { explicitUserAction: true, returnPoint });
      if (!result.ok) return result;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      pointerLook.release('living-nexus-realm-entry');
      const entryPose = result.entryPose;
      if (entryPose) {
        operator.position.set(entryPose.x, entryPose.y, entryPose.z);
        operator.rotation.y = entryPose.heading;
        camera.alpha = entryPose.cameraAlpha;
        camera.beta = clamp(entryPose.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
        camera.radius = clamp(entryPose.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
        setFollowCameraTarget();
      }
      activeLivingNexusOpportunityId = null;
      latestLivingNexusOpportunity = null;
      onLivingNexusOpportunityChange?.(null);
      activeLivingNexusRealmSignalId = null;
      latestLivingNexusRealmSignal = null;
      onLivingNexusRealmSignalChange?.(null);
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      return Object.freeze({ ...result, playerPosition: this.getPlayerPosition(), oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false });
    },
    exitLivingNexusRealm({ explicitUserAction = false } = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      if (!explicitUserAction) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
      const result = livingNexusRuntime.exitRealm({ explicitUserAction: true });
      if (!result.ok) return result;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      pointerLook.release('living-nexus-realm-exit');
      const entryPose = result.entryPose;
      if (entryPose) {
        operator.position.set(entryPose.x, entryPose.y, entryPose.z);
        operator.rotation.y = entryPose.heading;
        camera.alpha = entryPose.cameraAlpha;
        camera.beta = clamp(entryPose.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
        camera.radius = clamp(entryPose.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
        setFollowCameraTarget();
      }
      livingNexusRuntime.update({ position: operator.position, now: globalThis.performance?.now?.() || Date.now() });
      activeLivingNexusRealmSignalId = null;
      latestLivingNexusRealmSignal = null;
      onLivingNexusRealmSignalChange?.(null);
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      return Object.freeze({ ...result, playerPosition: this.getPlayerPosition(), oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false });
    },
    syncLivingNexusRealmVerifiedOutcome({ explicitUserAction = false } = {}) {
      const result = livingNexusRuntime.syncRealmVerifiedOutcome({ explicitUserAction });
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      return result;
    },
    syncLivingNexusEncounterResolutions(resolutions = []) {
      const result = livingNexusRuntime.setEncounterResolutions(resolutions);
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      latestLivingNexusOpportunity = livingNexusRuntime.getNearestOpportunity(operator.position);
      activeLivingNexusOpportunityId = latestLivingNexusOpportunity?.id || null;
      onLivingNexusOpportunityChange?.(latestLivingNexusOpportunity);
      return result;
    },
    setLivingNexusMode(mode = 'explore', { explicitUserAction = false } = {}) {
      return livingNexusRuntime.setMode(mode, { explicitUserAction });
    },
    syncLivingNexusTransformations(transformations = []) {
      const result = livingNexusRuntime.setTransformations(transformations);
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      return result;
    },
    enterLivingNexusDestination(destination = 'core', { explicitUserAction = false, transformations = [], returnPoint = null } = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      if (!explicitUserAction) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
      const returnTarget = destination === 'expanse' && /^cell--?\d+--?\d+$/.test(String(returnPoint?.cellId || '')) && Number.isFinite(Number(returnPoint?.x)) && Number.isFinite(Number(returnPoint?.z)) && Math.abs(Number(returnPoint.x)) <= LIVING_NEXUS_WORLD_BOUND && Math.abs(Number(returnPoint.z)) <= LIVING_NEXUS_WORLD_BOUND
        ? Object.freeze({ cellId: String(returnPoint.cellId), x: Number(returnPoint.x), z: Number(returnPoint.z), privateContentStored: false, automaticNavigation: false })
        : null;
      const currentDestination = livingNexusRuntime.getSummary().destination;
      if (currentDestination === destination && !returnTarget) return Object.freeze({ ok: true, unchanged: true, destination: currentDestination, summary: livingNexusRuntime.getSummary(), playerPosition: this.getPlayerPosition(), oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false });
      if (currentDestination === 'core' && destination !== 'core') {
        livingNexusCorePose = captureEonCityExplorationPose({
          player: { x: operator.position.x, y: operator.position.y, z: operator.position.z, heading: operator.rotation.y },
          camera: { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: { x: camera.target.x, y: camera.target.y, z: camera.target.z } },
          controller: { mode: 'third-person', pointerLookEnabled: false }
        });
      }
      if (Array.isArray(transformations)) livingNexusRuntime.setTransformations(transformations);
      const result = livingNexusRuntime.setDestination(destination, { explicitUserAction: true });
      if (!result.ok) return result;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      pointerLook.release('living-nexus-destination-change');
      const restoreCore = result.destination === 'core' ? normalizeEonCityExplorationPose(livingNexusCorePose) : null;
      const entryPose = returnTarget
        ? Object.freeze({ ...(result.entryPose || EON_CITY_LIVING_NEXUS_ENTRY_POSES.expanse), x: returnTarget.x, z: returnTarget.z })
        : result.entryPose;
      if (restoreCore) {
        operator.position.set(restoreCore.player.x, restoreCore.player.y, restoreCore.player.z);
        operator.rotation.y = restoreCore.player.heading;
        camera.alpha = restoreCore.camera.alpha;
        camera.beta = clamp(restoreCore.camera.beta, camera.lowerBetaLimit, camera.upperBetaLimit);
        camera.radius = clamp(restoreCore.camera.radius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
        setCameraTargetOffset({
          x: restoreCore.camera.target.x - restoreCore.player.x,
          y: restoreCore.camera.target.y - restoreCore.player.y,
          z: restoreCore.camera.target.z - restoreCore.player.z
        });
        syncCameraTarget();
        wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
      } else if (entryPose) {
        operator.position.set(entryPose.x, entryPose.y, entryPose.z);
        operator.rotation.y = entryPose.heading;
        camera.alpha = entryPose.cameraAlpha;
        camera.beta = clamp(entryPose.cameraBeta, camera.lowerBetaLimit, camera.upperBetaLimit);
        camera.radius = clamp(entryPose.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
        setFollowCameraTarget();
      } else if (result.destination === 'core') {
        operator.position.set(initialCoreArrival.x, initialCoreArrival.y, initialCoreArrival.z);
        operator.rotation.y = initialCoreArrival.heading;
        applyCoreArrivalCamera();
      }
      if (result.destination === 'expanse') livingNexusRuntime.update({ position: operator.position, now: globalThis.performance?.now?.() || Date.now() });
      activeCinematicShotId = null;
      activeLandmarkId = null;
      activeApproachId = null;
      activeLivingNexusOpportunityId = null;
      latestLivingNexusOpportunity = null;
      onLivingNexusOpportunityChange?.(null);
      activeLivingNexusRealmSignalId = null;
      latestLivingNexusRealmSignal = null;
      onLivingNexusRealmSignalChange?.(null);
      activeLivingNexusGatewayId = null;
      latestLivingNexusGateway = null;
      onLivingNexusGatewayChange?.(null);
      landmarkFocusState.clear();
      scene.metadata.eonCityLivingNexus = livingNexusRuntime.getSummary();
      const nearby = result.destination === 'core' ? getNearestLandmark(operator.position) : null;
      onLandmarkChange?.(nearby);
      return Object.freeze({ ...result, playerPosition: this.getPlayerPosition(), atlasReturnApplied: Boolean(returnTarget), atlasReturnCellId: returnTarget?.cellId || null, privateContentStored: false, automaticNavigation: false, oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false });
    },
    guideToLivingNexusCell(cellId = '', { explicitUserAction = false } = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      if (!explicitUserAction) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (livingNexusRuntime.getSummary().destination !== 'expanse') return Object.freeze({ ok: false, reason: 'expanse-not-active' });
      const target = livingNexusRuntime.getCellGuideTarget(cellId);
      if (!target) return Object.freeze({ ok: false, reason: 'cell-not-resident' });
      clickMove.destination = new Vector3(clamp(target.x, -LIVING_NEXUS_WORLD_BOUND, LIVING_NEXUS_WORLD_BOUND), 0, clamp(target.z, -LIVING_NEXUS_WORLD_BOUND, LIVING_NEXUS_WORLD_BOUND));
      clickMoveMarker.setEnabled(true);
      clickMoveMarker.position.x = clickMove.destination.x;
      clickMoveMarker.position.z = clickMove.destination.z;
      activeCinematicShotId = null;
      onStatus?.(`${cellId} local guide is active. Manual movement cancels it; no route, work action or network request was created.`);
      return Object.freeze({ ok: true, ...target, explicitUserAction: true });
    },
    resetView() {
      if (destroyed || contextLost) return false;
      livingNexusRuntime.setDestination('core', { explicitUserAction: true });
      livingNexusCorePose = null;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(initialCoreArrival.x, initialCoreArrival.y, initialCoreArrival.z);
      wayfinderStateDirector.request('recovery', { durationMs: 700 });
      activeCinematicShotId = null;
      operator.rotation.y = initialCoreArrival.heading;
      applyCoreArrivalCamera();
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.('Camera and player view reset locally at Arrival Plaza.');
      return true;
    },
    unstuck() {
      if (destroyed || contextLost) return false;
      livingNexusRuntime.setDestination('core', { explicitUserAction: true });
      livingNexusCorePose = null;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      const safePoint = findEonCityCommandDistrictUnstuckPoint(operator.position);
      wayfinderStateDirector.request('recovery', { durationMs: 950 });
      operator.position.set(safePoint.x, safePoint.y, safePoint.z);
      operator.rotation.y = safePoint.heading;
      setFollowCameraTarget();
      activeCinematicShotId = null;
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.(`Returned to the nearest authored safe point: ${safePoint.id}. No work or route state changed.`);
      return Object.freeze({ ok: true, safePointId: safePoint.id, x: safePoint.x, z: safePoint.z, localOnly: true, workStateChanged: false });
    },
    setCinematicShot(shotId = '') {
      if (destroyed || contextLost) return false;
      const shot = getCityCinematicShot(shotId);
      if (!shot) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(shot.operator.x, shot.operator.y, shot.operator.z);
      operator.rotation.y = shot.operator.heading;
      camera.alpha = shot.camera.alpha;
      camera.beta = shot.camera.beta;
      camera.radius = clamp(shot.camera.radius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
      wayfinderCameraDesiredRadius = clamp(camera.radius, wayfinderCameraProfile.minRadius, wayfinderCameraProfile.maxRadius);
      setCameraTargetOffset({
        x: shot.target.x - shot.operator.x,
        y: shot.target.y - shot.operator.y,
        z: shot.target.z - shot.operator.z
      });
      syncCameraTarget();
      activeCinematicShotId = shot.id;
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.(`${shot.title} composition applied locally. No screenshot, video, upload, route or work action was created.`);
      return Object.freeze({ id: shot.id, title: shot.title, localOnly: true, capturesMedia: false, uploadsMedia: false, opensRoute: false });
    },
    focusAuthoredVerticalSliceRegion(regionId = '') {
      if (destroyed || contextLost) return false;
      const region = getCityAuthoredVerticalSliceRegion(regionId);
      if (!region) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(region.focus.x, 0, region.focus.z);
      activeCinematicShotId = null;
      operator.rotation.y = region.focus.heading;
      camera.alpha = region.focus.cameraAlpha;
      camera.beta = region.focus.cameraBeta;
      camera.radius = clamp(region.focus.cameraRadius, camera.lowerRadiusLimit, camera.upperRadiusLimit);
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.(`${region.title} focus set locally. This is authored original vector/procedural City art; no route, work action, private project content, or remote request was opened.`);
      return Object.freeze({ id: region.id, title: region.title, chapter: region.chapter, localOnly: true, remoteNetwork: false, opensRoute: false, executesWork: false });
    },
    focusCommandDeck() {
      if (destroyed || contextLost) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(0, 0, -10.72);
      activeCinematicShotId = null;
      operator.rotation.y = Math.PI;
      camera.alpha = -Math.PI / 2;
      camera.beta = 1.03;
      camera.radius = Math.max(camera.lowerRadiusLimit, 12.4);
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.('Command Deck focus set locally. Choose a destination only through the visible Command Deck.');
      return true;
    },
    focusCreatorAtrium() {
      if (destroyed || contextLost) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(-1.92, 0, -10.68);
      activeCinematicShotId = null;
      operator.rotation.y = Math.PI;
      camera.alpha = -Math.PI / 2 + 0.14;
      camera.beta = 1.02;
      camera.radius = Math.max(camera.lowerRadiusLimit, 12.7);
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.('Creator Atrium focus set locally. Open a native creator or Forge surface only through the visible Atrium.');
      return true;
    },
    focusCreatorForgeDistrict() {
      if (destroyed || contextLost) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(-8.4, 0, -0.68);
      activeCinematicShotId = null;
      operator.rotation.y = Math.PI;
      camera.alpha = -Math.PI / 2 + 0.36;
      camera.beta = 1.04;
      camera.radius = Math.max(camera.lowerRadiusLimit, 14.4);
      const landmark = getNearestLandmark(operator.position);
      activeLandmarkId = landmark?.id || null;
      onLandmarkChange?.(landmark);
      onStatus?.('Creator Atrium and Forge Bay focus set locally. Choose a native destination only through the visible Creator Atrium launch board.');
      return true;
    },
    focusMetropolisDistrict(districtId = '') {
      if (destroyed || contextLost) return false;
      const district = getMetropolisDistrict(districtId);
      if (!district) return false;
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      operator.position.set(district.x, 0, clampEonCityW719CorePoint({ x: district.x, z: district.z - 3.1 }, coreWorldAuthority).z);
      activeCinematicShotId = null;
      operator.rotation.y = Math.PI;
      camera.alpha = -Math.PI / 2 + (district.x < 0 ? -0.18 : 0.18);
      camera.beta = 1.04;
      camera.radius = Math.max(camera.lowerRadiusLimit, 13.2);
      onStatus?.(`${district.title} focus set locally. Choose a native route only through the visible district panel.`);
      return true;
    },
    getControlSummary() {
      return Object.freeze({
        schema: 'eon.city.play.controls-summary.w364.v1',
        clickToMove: clickMove.enabled,
        destination: clickMove.destination ? Object.freeze({ x: Math.round(clickMove.destination.x * 10) / 10, z: Math.round(clickMove.destination.z * 10) / 10 }) : null,
        analogActive: Math.hypot(analogMovement.x, analogMovement.z) > 0,
        gamepadDetected: gamepadAnnounced,
        directionConvention: EON_CITY_CONTROL_CONVENTION.positiveStrafeMeans,
        landmarkHitVolumes: landmarkInteractions.count,
        thirdPerson: Object.freeze({ collisionVolumeCount: thirdPersonCollisionVolumes.length, pointerLook: pointerLook.getSnapshot(), cameraProfileId: wayfinderCameraProfileId, cameraClipped: wayfinderCameraSnapshot.clipped })
      });
    },
    clearInput() {
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      return Object.freeze({ ok: true, released: true });
    },
    setMove(direction, active) {
      const resolved = direction === 'forward' ? 'up' : direction === 'backward' ? 'down' : direction;
      if (!['up', 'down', 'left', 'right'].includes(resolved)) return;
      if (active) {
        movement.add(resolved);
        activeCinematicShotId = null;
      } else movement.delete(resolved);
    },
    setAnalogMove(vector = {}) {
      const normalized = normalizeInputVector(vector);
      analogMovement.x = normalized.x;
      analogMovement.z = normalized.z;
      if (Math.hypot(normalized.x, normalized.z) > 0) {
        clickMove.destination = null;
        activeCinematicShotId = null;
      }
    },
    setClickMove(enabled) {
      clickMove.enabled = Boolean(enabled);
      clickMove.destination = null;
      clickMoveMarker.setEnabled(false);
      onClickMoveChange?.({ enabled: clickMove.enabled });
      return clickMove.enabled;
    },
    togglePointerLook() {
      return togglePointerLook();
    },
    setWayfinderCameraProfile(profileId = 'follow') {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return applyWayfinderCameraProfile(profileId, 'visible control');
    },
    cycleWayfinderCamera() {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return cycleWayfinderCamera('visible control');
    },
    resetWayfinderCamera() {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return resetWayfinderCamera('visible control');
    },
    requestWayfinderState(state = 'inspect', options = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      const result = wayfinderStateDirector.request(state, options);
      if (result.ok) onStatus?.(`${state} Wayfinder pose applied locally. No route, work, account, provider, billing or referral state changed.`);
      return result;
    },
    requestW649PlayerState(state = 'idle', options = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return w649CoreRuntime.requestPlayerState(state, options);
    },
    getW649CoreSummary() {
      return w649CoreRuntime.getSummary();
    },
    enterW649District(districtId = '', options = {}) {
      if (destroyed || contextLost) return Promise.resolve(Object.freeze({ ok: false, reason: 'city-not-running' }));
      return w649DistrictRuntime.enterDistrict(districtId, options);
    },
    getW649DistrictSummary() {
      return w649DistrictRuntime.getSummary();
    },
    getW649DistrictActions(districtId = '') {
      return w649DistrictRuntime.getActionBindings(districtId || undefined);
    },
    requestW649NpcState(assetId = '', state = 'idle', options = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return w649DistrictRuntime.requestNpcState(assetId, state, options);
    },
    getWayfinderSummary() {
      return Object.freeze({ schema: 'eon.city.wayfinder-runtime.w624d.v1', visual: EON_CITY_WAYFINDER_VISUAL_PROFILE, state: wayfinderStateSnapshot, camera: wayfinderCameraSnapshot, cameraProfileId: wayfinderCameraProfileId, cameraProfiles: EON_CITY_WAYFINDER_CAMERA_PROFILES.map((entry) => entry.id), collisionVolumeCount: thirdPersonCollisionVolumes.length, localOnly: true, opensRoute: false, changesWorkState: false });
    },
    setCompanionIntent(mode = '', { durationMs = 2400 } = {}) {
      const normalized = String(mode || '').trim().toLowerCase();
      if (!EON_CITY_COMPANION_MODES.includes(normalized)) return false;
      companionIntent = Object.freeze({ mode: normalized, until: (globalThis.performance?.now?.() || Date.now()) + Math.max(240, Number(durationMs) || 2400) });
      if (normalized === 'speak') originalRigRuntime.playCompanionEmote('Speak', { durationMs: Math.min(3200, Math.max(420, durationMs)) });
      if (normalized === 'listen') originalRigRuntime.playCompanionEmote('Listen', { durationMs: Math.min(3200, Math.max(420, durationMs)) });
      return Object.freeze({ mode: normalized, localOnly: true, autonomousAgent: false, microphoneRequested: false, remoteNetwork: false });
    },
    setEonbotOrbitPresentation(state = 'follow', { durationMs = 2400 } = {}) {
      const normalized = String(state || '').trim().toLowerCase();
      if (!EON_CITY_EONBOT_ORBIT_STATES.includes(normalized)) return Object.freeze({ ok: false, reason: 'invalid-orbit-state' });
      eonbotOrbitPresentation = getEonCityEonbotOrbitPresentation(normalized);
      const boundedDuration = Math.min(8000, Math.max(240, Number(durationMs) || 2400));
      companionIntent = Object.freeze({ mode: eonbotOrbitPresentation.directorMode, until: (globalThis.performance?.now?.() || Date.now()) + boundedDuration });
      originalRigRuntime.playCompanionEmote(eonbotOrbitPresentation.animation, { durationMs: boundedDuration });
      scene.metadata.eonCityEonbotOrbit = Object.freeze({ ...eonbotOrbitPresentation, localOnly: true, autonomousAgent: false, microphoneRequested: false, remoteNetwork: false });
      return Object.freeze({ ok: true, ...eonbotOrbitPresentation, localOnly: true, autonomousAgent: false, microphoneRequested: false, remoteNetwork: false });
    },
    getEonbotOrbitSummary() {
      return Object.freeze({ schema: 'eon.city.eonbot-orbit-runtime.w624e.v1', ...eonbotOrbitPresentation, localOnly: true, autoNavigation: false, privateDataRead: false, microphoneRequested: false, speechStarted: false, networkRequestCreated: false });
    },
    requestEonbotDock(targetId = 'nearest', options = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      const result = eonbotCuriosityController.requestDock(targetId, {
        explicitUserAction: options.explicitUserAction === true,
        playerPosition: operator.position,
        districtId: String(options.districtId || '')
      });
      if (result.ok) onStatus?.(`EONBOT docking reviewed for ${result.target.label}. This changes only local companion presentation.`);
      return result;
    },
    releaseEonbotDock(options = {}) {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      return eonbotCuriosityController.releaseDock({ explicitUserAction: options.explicitUserAction === true });
    },
    getEonbotCuriositySummary() {
      return Object.freeze({ ...eonbotCuriositySnapshot });
    },
    requestCommandDistrictNpcState(archetypeId = '', state = 'talk', options = {}) {
      if (destroyed || contextLost || !EON_CITY_COMMAND_DISTRICT_NPC_STATES.includes(String(state || '').trim().toLowerCase())) return Object.freeze({ ok: false, reason: 'city-not-running-or-invalid-state' });
      return runtimeState.commandDistrictNpcRequestState?.(archetypeId, state, { explicitUserAction: options.explicitUserAction === true }) || Object.freeze({ ok: false, reason: 'npc-system-not-ready' });
    },
    setCommandDistrictNpcLod(lod = 'balanced') {
      if (destroyed || contextLost) return Object.freeze({ ok: false, reason: 'city-not-running' });
      const snapshot = runtimeState.commandDistrictNpcSetLod?.(lod);
      return snapshot || Object.freeze({ ok: false, reason: 'npc-system-not-ready' });
    },
    getCommandDistrictNpcSummary() {
      const snapshot = runtimeState.commandDistrictNpcSystem?.getSnapshot?.();
      return Object.freeze({ schema: 'eon.city.command-district-npc-runtime.w624f.v1', archetypeCount: runtimeState.commandDistrictNpcPlan?.archetypes?.length || 0, activeCount: snapshot?.activeCount || 0, stateCount: EON_CITY_COMMAND_DISTRICT_NPC_STATES.length, lod: snapshot?.lod?.id || 'disabled', authoredPathCount: runtimeState.commandDistrictNpcPlan?.authoredPathIds?.length || 0, localOnly: true, presentationOnly: true, autoNavigation: false, privateDataRead: false, networkRequestCreated: false, operationalStateClaimed: false });
    },
    getCharacterMotionSummary() { return Object.freeze({ ...characterMotionSnapshot }); },
    getCompanionMotionSummary() { return Object.freeze({ ...companionMotionSnapshot }); },
    getThirdPersonSummary() {
      return Object.freeze({ schema: 'eon.city.third-person-runtime.w555b.v1', collisionVolumeCount: thirdPersonCollisionVolumes.length, pointerLook: pointerLook.getSnapshot(), cameraSightline: cameraOcclusion.getSummary(), wayfinderCamera: wayfinderCameraSnapshot, cameraProfileId: wayfinderCameraProfileId, staticCollisionOnly: true, physicsEngine: false, naturalMotionDirector: characterMotionSnapshot.schema, companionDirector: companionMotionSnapshot.schema });
    },
    applyWorkloadProtection(reason = 'universal-workload-governor') {
      return applyPerformanceProtection(String(reason || 'universal-workload-governor').slice(0, 100));
    },
    isPaused() {
      return Boolean(paused);
    },
    pause() {
      if (destroyed || contextLost) return;
      pointerLook.release('city-paused');
      cameraOcclusion.clear();
      paused = true;
      scene.metadata.playPaused = true;
      movement.clear();
      onStatus?.('Immersive Work Mode paused locally.');
    },
    resume() {
      if (destroyed || contextLost) return;
      paused = false;
      scene.metadata.playPaused = false;
      qualityGovernor.setVisibility(false);
      lastFrameAt = performance.now();
      onStatus?.('Immersive Work Mode resumed.');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      performanceObservation.recordStage('renderer-destroyed');
      cameraOcclusion.destroy();
      pointerLook.destroy();
      movement.clear();
      analogMovement.x = 0;
      analogMovement.z = 0;
      clickMove.destination = null;
      engine.stopRenderLoop();
      engineStages.dispose();
      detachKeyboard();
      canvas.removeEventListener('webglcontextlost', contextLossHandler, false);
      canvas.removeEventListener('pointerdown', clickMovePointerDown);
      canvas.removeEventListener('pointerup', clickMovePointerUp);
      canvas.removeEventListener('pointercancel', clickMovePointerCancel);
      canvas.removeEventListener('pointermove', landmarkHoverPointerMove);
      canvas.removeEventListener('pointerleave', landmarkHoverPointerLeave);
      document.removeEventListener('visibilitychange', visibilityHandler);
      globalThis.removeEventListener?.('resize', resizeHandler);
      camera.detachControl(canvas);
      cellResidency.dispose();
      livingNexusRuntime.dispose();
      w649DistrictRuntime.dispose();
      w649CoreRuntime.dispose();
      originalRigRuntime.dispose();
      originalSceneArtRuntime.dispose();
      assetRuntime.dispose();
      runtimeState.commandDistrictNpcSystem?.dispose?.();
      vectorArtRuntime.dispose();
      scene.dispose();
      engine.dispose();
      if (canvas.parentNode === host) canvas.remove();
    }
  });
}
