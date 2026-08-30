/**
 * W649E–H — proximity-resident district asset runtime.
 *
 * The current and immediately previous district may overlap during traversal.
 * Every GLB comes from the W649
 * content-hashed same-origin manifests, primary Meshopt/WebP candidates fall
 * back to decoder-free files, and each district owns an AbortController plus
 * disposable Babylon containers. Real product actions are declared separately
 * from decorative art so premium-looking dead controls are not invented.
 */
import '@babylonjs/loaders/glTF/index.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import {
  EON_CITY_W649_CHARACTER_MANIFEST,
  getEonCityW649Character
} from './eon-city-w649-character-manifest.js';
import {
  EON_CITY_W649_WORLD_MANIFEST,
  getEonCityW649WorldAsset
} from './eon-city-w649-world-manifest.js';
import {
  EON_CITY_W649_DISTRICT_MANIFEST,
  getEonCityW649District
} from './eon-city-w649-district-manifest.js';
import { resolveEonCityW649AssetVariant } from './eon-city-w649-capability-resolver.js';
import { createEonCityW649AnimationStateMachine, configureEonCityW649MeshoptDecoder } from './eon-city-w649-babylon-core-runtime.js';
import { getEonCityW649AnimationProfile } from './eon-city-w649-animation-manifest.js';
import { getEonCityW649PerformanceProfile } from './eon-city-w649-performance-profile.js';
import { normalizeEonCityDistrictId } from '../eon-city-district-identity.js';
import { EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS } from '../w659f/eon-city-w659f-functional-asset-manifest.js';
import { integrateEonCityW649Container } from './eon-city-w649-visual-integration.js';
import {
  EON_CITY_W655_DISTRICT_ACTIONS,
  getEonCityW655DistrictActions,
  getEonCityW655DistrictExperience
} from '../w655/eon-city-w655-experience-contract.js';
import { resolveEonCityW660mNpcDirective } from '../w660m/eon-city-w660m-experience-director.js';
import { getEonCityW666AssetFunction } from '../w666/eon-city-w666-asset-function-registry.js';
import { resolveEonCityW675DistrictAtPosition } from '../w675/eon-city-w675-orientation-belt-activation.js';
// W675 predecessor authority: EON_CITY_W675_PRODUCT_DISTRICTS.
import { resolveEonCityW688DistrictAtPosition } from '../w688/eon-city-w688-creator-forge-belt-activation.js';
// W688 predecessor authority: EON_CITY_W688_PRODUCT_DISTRICTS.
import { EON_CITY_W689_PRODUCT_DISTRICTS, resolveEonCityW689DistrictAtPosition } from '../w689/eon-city-w689-all-district-belts.js';

export const EON_CITY_W649_DISTRICT_RUNTIME_SCHEMA = 'eon.city.w649.district-runtime.v1';
const freeze = (value) => Object.freeze(value);
const LOAD_TIMEOUT_MS = 14_000;
const MAX_RESIDENT_DISTRICTS = 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const EON_CITY_W649_DISTRICT_CENTERS = freeze(Object.fromEntries(
  EON_CITY_W689_PRODUCT_DISTRICTS.map((district) => [district.id, freeze({
    x: district.center.x,
    z: district.center.z,
    radius: district.radius,
    spatialModel: district.spatialModel || 'legacy-sanctum',
    proceduralComposition: district.id === 'command-centre'
  })])
));

export const EON_CITY_W649_ACTION_BINDINGS = EON_CITY_W655_DISTRICT_ACTIONS;

const DISTRICT_PLACEMENT_OVERRIDES = freeze({
  'orientation-hall': freeze({
    'eoncity-orientation-hall': freeze({ x: 0, z: 0, targetHeight: 5.7, rotationY: Math.PI }),
    'eoncity-eon-architect-12clips': freeze({ x: 0, z: 4.8, targetHeight: 1.82, rotationY: Math.PI }),
    'eoncity-holo-interface-operator-6clips': freeze({ x: 6.45, z: 2.73, targetHeight: 1.82, rotationY: -Math.PI / 2 }),
    'eon-x1-worker-9clips': freeze({ x: 3.45, z: -3.34, targetHeight: 1.82, rotationY: Math.PI }),
    'citizen-variant-6clips': freeze({ x: -2.52, z: -6.53, targetHeight: 1.8, rotationY: 0 }),
    'forge-device-lab-specialist-6clips': freeze({ x: -4.8, z: -0.16, targetHeight: 1.82, rotationY: Math.PI / 2 }),
    'eoncity-civilian-creator-13clips': freeze({ x: -2.94, z: 6.35, targetHeight: 1.82, rotationY: 0 }),
    'eoncity-nav-info-kiosk': freeze({ x: 1.75, z: 1.4, targetHeight: 1.75, rotationY: Math.PI }),
    'eoncity-district-info': freeze({ x: 2.4, z: -1.1, targetHeight: 1.6, rotationY: -Math.PI / 2 }),
    'eoncity-ascension-portal': freeze({ x: -2.5, z: -1.3, targetHeight: 3.3, rotationY: Math.PI / 2 })
  }),
  'creator-atrium': freeze({
    'eoncity-civilian-creator-13clips': freeze({ x: -1.5, z: 1.0, targetHeight: 1.8, rotationY: Math.PI }),
    'eoncity-command-chair': freeze({ x: 0, z: -0.4, targetHeight: 1.55, rotationY: 0 }),
    'eoncity-district-hologram': freeze({ x: 1.6, z: 0.4, targetHeight: 2.1, rotationY: 0 }),
    'eoncity-holo-map-beacon': freeze({ x: 2.25, z: -1.4, targetHeight: 2.25, rotationY: 0 }),
    'eoncity-eonbot-charging-station': freeze({ x: -2.25, z: -1.25, targetHeight: 1.0, rotationY: 0 })
  }),
  'forge-basilica': freeze({
    'eoncity-forge-basilica': freeze({ x: 0, z: 0.6, targetHeight: 6.2, rotationY: Math.PI }),
    'eoncity-forge-workbench': freeze({ x: -1.5, z: 1.6, targetHeight: 1.25, rotationY: Math.PI }),
    'eoncity-ai-tower-core': freeze({ x: 2.0, z: -0.3, targetHeight: 3.7, rotationY: 0 }),
    'eon-x1-worker-9clips': freeze({ x: -2.1, z: -0.8, targetHeight: 1.82, rotationY: Math.PI / 2 }),
    'eoncity-holo-interface-operator-6clips': freeze({ x: 1.3, z: 1.9, targetHeight: 1.82, rotationY: Math.PI }),
    'forge-device-lab-specialist-6clips': freeze({ x: 2.5, z: 1.2, targetHeight: 1.82, rotationY: -Math.PI / 2 })
  }),
  'archive-canopy': freeze({
    'eoncity-navigator-arc': freeze({ x: 0, z: 0, targetHeight: 4.8, rotationY: Math.PI }),
    'eoncity-navigator-archive-vault-6clips': freeze({ x: -1.4, z: 1.1, targetHeight: 1.82, rotationY: Math.PI })
  }),
  'vault-station': freeze({
    'eoncity-vault-steward-6clips': freeze({ x: -1.25, z: 0.9, targetHeight: 1.82, rotationY: Math.PI }),
    'eoncity-vault-steward-male-6clips': freeze({ x: -1.25, z: 0.9, targetHeight: 1.82, rotationY: Math.PI }),
    'security-sentinel-6clips': freeze({ x: 1.65, z: 1.25, targetHeight: 1.85, rotationY: -Math.PI / 2 }),
    'eoncity-portal-gate': freeze({ x: 0, z: -1.4, targetHeight: 3.2, rotationY: 0 })
  }),
  'trade-dome': freeze({
    'eoncity-trade-dome-entrance': freeze({ x: 0, z: 0, targetHeight: 4.8, rotationY: Math.PI }),
    'eoncity-market-trade-terminal': freeze({ x: 1.5, z: 1.2, targetHeight: 1.75, rotationY: Math.PI }),
    'eoncity-creator-trade-6clips': freeze({ x: -1.5, z: 1.1, targetHeight: 1.82, rotationY: Math.PI }),
    'citizen-variant-6clips': freeze({ x: 2.2, z: -1.3, targetHeight: 1.8, rotationY: -Math.PI / 2 })
  }),
  'transit-network': freeze({
    'eoncity-transit-core': freeze({ x: 0, z: 0, targetHeight: 3.5, rotationY: 0 }),
    'eoncity-street-lamp': freeze({ x: 2.0, z: 1.4, targetHeight: 2.8, rotationY: 0 }),
    'eoncity-genesis-core': freeze({ x: -2.0, z: -1.2, targetHeight: 3.4, rotationY: 0 })
  }),
  'agent-theatre': freeze({
    'eoncity-holo-interface-landmark': freeze({ x: 0, z: 0, targetHeight: 4.2, rotationY: Math.PI }),
    'eoncity-holo-interface-operator-6clips': freeze({ x: -1.4, z: 1.15, targetHeight: 1.82, rotationY: Math.PI })
  })
});

function getAsset(assetId) {
  return getEonCityW649Character(assetId) || getEonCityW649WorldAsset(assetId) || null;
}

function isCharacter(assetId) {
  return Boolean(getEonCityW649Character(assetId));
}

function splitAssetPath(assetPath = '') {
  const normalized = String(assetPath || '');
  const slash = normalized.lastIndexOf('/');
  return slash < 0 ? { rootUrl: '/', fileName: normalized } : { rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) };
}

async function withTimeout(promise, timeoutMs = LOAD_TIMEOUT_MS) {
  let timer = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = globalThis.setTimeout?.(() => reject(new Error('w649-district-load-timeout')), timeoutMs) || null; })
    ]);
  } finally {
    if (timer) globalThis.clearTimeout?.(timer);
  }
}

async function defaultLoadContainer({ scene, path, signal, onProgress }) {
  if (signal?.aborted) throw new Error('w649-district-load-aborted');
  const { rootUrl, fileName } = splitAssetPath(path);
  if (!rootUrl.startsWith('/assets/city/w649/') || !fileName) throw new Error('w649-district-path-invalid');
  const container = await withTimeout(SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene, (event) => {
    const loaded = Number(event?.loaded || 0);
    const total = Number(event?.total || 0);
    onProgress?.(freeze({ path, loaded, total, ratio: total > 0 ? Math.min(1, loaded / total) : null }));
  }));
  if (signal?.aborted) {
    try { container?.dispose?.(); } catch {}
    throw new Error('w649-district-load-aborted');
  }
  return container;
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
  return freeze({ min, max, height: Math.max(0.001, max.y - min.y) });
}

function attachContainer({ scene, container, districtRoot, districtId, assetId, placement, quality = 'balanced' }) {
  const interactiveCharacter = isCharacter(assetId);
  const structuralAsset = !interactiveCharacter;
  const assetFunction = getEonCityW666AssetFunction(assetId);
  const interactive = Boolean(assetFunction);
  const interactionKind = interactiveCharacter ? 'npc' : String(assetFunction?.interactionKind || 'world-asset');
  const wrapper = new TransformNode(`w649-district-${districtId}-${assetId}`, scene);
  wrapper.parent = districtRoot;
  wrapper.position.set(placement.x || 0, 0, placement.z || 0);
  wrapper.rotation.y = placement.rotationY || 0;
  wrapper.metadata = freeze({
    kind: interactiveCharacter ? 'w649-district-npc' : 'w649-district-functional-asset',
    districtId,
    assetId,
    assetFunctionRole: assetFunction?.role || '',
    interactionKind,
    interactionRadius: Number(assetFunction?.interactionRadius || 3.2),
    interactive,
    reviewOnly: interactive,
    autoExecute: false,
    autoNavigate: false,
    eonCityCameraOcclusion: structuralAsset,
    structureId: structuralAsset ? assetId : '',
    localOnly: true
  });
  container?.addAllToScene?.();
  for (const root of container?.rootNodes || []) root.parent = wrapper;
  const visualIntegration = integrateEonCityW649Container({ scene, container, quality, assetId, role: isCharacter(assetId) ? 'district-character' : 'district-landmark', allowShadowCaster: false });
  let bounds = computeBounds(container);
  if (bounds) {
    wrapper.scaling.setAll(Math.min(24, Math.max(0.005, Number(placement.targetHeight || 2) / bounds.height)));
    bounds = computeBounds(container);
    const districtY = districtRoot?.getAbsolutePosition?.().y || 0;
    if (bounds) wrapper.position.y += districtY - bounds.min.y;
  }
  for (const mesh of container?.meshes || []) {
    if (!mesh) continue;
    if (interactive) {
      mesh.isPickable = true;
    } else {
      mesh.isPickable = false;
    }
    mesh.checkCollisions = false;
    mesh.metadata = freeze({
      ...(mesh.metadata || {}),
      kind: interactiveCharacter ? 'w649-district-npc-mesh' : 'w649-district-functional-asset-mesh',
      districtId,
      assetId,
      assetFunctionRole: assetFunction?.role || '',
      interactionKind,
      interactionRadius: Number(assetFunction?.interactionRadius || 3.2),
      interactive,
      reviewOnly: interactive,
      autoExecute: false,
      autoNavigate: false,
      eonCityCameraOcclusion: structuralAsset,
      structureId: structuralAsset ? assetId : '',
      localOnly: true,
      visualMeshCollision: false
    });
  }
  return freeze({ wrapper, roots: freeze([...(container?.rootNodes || [])]), visualIntegration, assetFunction });
}

function disposeRecord(record) {
  try { record?.animation?.dispose?.(); } catch {}
  try { record?.visualIntegration?.dispose?.(); } catch {}
  for (const root of record?.roots || record?.container?.rootNodes || []) {
    try { root.parent = null; } catch {}
  }
  try { record?.container?.removeAllFromScene?.(); } catch {}
  try { record?.container?.dispose?.(); } catch {}
  try { record?.wrapper?.dispose?.(false, true); } catch {}
}

function selectedDistrictAssets(district, quality, reducedMotion = false, capabilities = {}, excludedAssetIds = EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS) {
  const profile = getEonCityW649PerformanceProfile(quality, { reducedMotion, reducedData: capabilities?.reducedData === true });
  const excluded = excludedAssetIds instanceof Set ? excludedAssetIds : new Set(excludedAssetIds || []);
  let assets = [...(district?.assets || [])].filter((assetId) => !excluded.has(assetId));
  if (district?.id === 'vault-station') {
    const chosenSteward = quality === 'cinematic' ? 'eoncity-vault-steward-male-6clips' : 'eoncity-vault-steward-6clips';
    assets = assets.filter((assetId) => !['eoncity-vault-steward-6clips', 'eoncity-vault-steward-male-6clips'].includes(assetId) || assetId === chosenSteward);
  }
  if (profile.id === 'lite') {
    const optionalPopulation = ['citizen-variant-6clips', 'security-sentinel-6clips'];
    if (district?.id !== 'agent-theatre') optionalPopulation.push('eoncity-holo-interface-operator-6clips');
    assets = assets.filter((assetId) => !optionalPopulation.includes(assetId));
    const populationIds = assets.filter((assetId) => isCharacter(assetId) && assetId !== 'eoncity-eonbot-charging-station');
    const keep = new Set(populationIds.slice(0, profile.maxPopulationCharactersPerDistrict));
    assets = assets.filter((assetId) => !populationIds.includes(assetId) || keep.has(assetId));
  }
  return freeze(assets);
}

function orderDistrictAssets(assetIds = []) {
  return [...assetIds].sort((left, right) => {
    const a = getAsset(left);
    const b = getAsset(right);
    const aCharacter = isCharacter(left) ? 1 : 0;
    const bCharacter = isCharacter(right) ? 1 : 0;
    const aHero = /hall|basilica|entrance|landmark|arc|core|gate/.test(left) ? -1 : 0;
    const bHero = /hall|basilica|entrance|landmark|arc|core|gate/.test(right) ? -1 : 0;
    return (aHero + aCharacter) - (bHero + bCharacter) || Number(a?.variants?.fallback?.bytes || 0) - Number(b?.variants?.fallback?.bytes || 0);
  });
}

export function resolveEonCityW649DistrictAtPosition(position = {}, { currentDistrictId = '' } = {}) {
  const x = Number(position?.x);
  const z = Number(position?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  if (currentDistrictId) {
    const resolved = resolveEonCityW689DistrictAtPosition({ x, z }, { currentDistrictId })
      || resolveEonCityW688DistrictAtPosition({ x, z }, { currentDistrictId })
      || resolveEonCityW675DistrictAtPosition({ x, z }, { currentDistrictId });
    const center = EON_CITY_W649_DISTRICT_CENTERS[resolved?.id];
    if (!resolved || !center) return null;
    const currentCenter = EON_CITY_W649_DISTRICT_CENTERS[currentDistrictId];
    const insideResolved = Math.hypot(x - center.x, z - center.z) <= center.radius + 0.35;
    const insideCurrentExit = currentCenter && Math.hypot(x - currentCenter.x, z - currentCenter.z) <= currentCenter.radius + 1.35;
    if (!insideResolved && !insideCurrentExit) return null;
    return freeze({ districtId: resolved.id, distance: Math.hypot(x - center.x, z - center.z), center, spatialModel: center.spatialModel });
  }
  let nearest = null;
  for (const [districtId, center] of Object.entries(EON_CITY_W649_DISTRICT_CENTERS)) {
    const distance = Math.hypot(x - center.x, z - center.z);
    if (distance > center.radius || (nearest && distance >= nearest.distance)) continue;
    nearest = freeze({ districtId, distance, center, spatialModel: center.spatialModel });
  }
  return nearest;
}

export function getEonCityW649DistrictCollisionVolumes() {
  const volumes = [];
  for (const [districtId, center] of Object.entries(EON_CITY_W649_DISTRICT_CENTERS)) {
    const district = getEonCityW649District(districtId);
    const hero = selectedDistrictAssets(district, 'balanced').find((assetId) => !isCharacter(assetId));
    if (!hero) continue;
    volumes.push(freeze({ id: `w649-${districtId}-hero`, assetId: hero, type: 'circle', x: center.x, z: center.z, radius: Math.max(1.1, Math.min(2.35, center.radius * 0.38)), source: 'w649-primitive-collision-proxy', visualMeshCollision: false }));
  }
  return freeze(volumes);
}

export function validateEonCityW649ActionBindings(bindings = EON_CITY_W649_ACTION_BINDINGS) {
  const errors = [];
  const knownDistricts = new Set(EON_CITY_W649_DISTRICT_MANIFEST.districts.map((district) => district.id).filter((id) => id !== 'bootstrap'));
  const safeRoutes = new Set(['/help', '/local-ai', '/projects', '/workspace', '/forge', '/library', '/vault', '/settings', '/realm-studio', '/market', '/automations']);
  for (const [districtId, actions] of Object.entries(bindings || {})) {
    if (!knownDistricts.has(districtId)) errors.push(`unknown-district:${districtId}`);
    for (const action of actions || []) {
      if (!action.id || !action.label) errors.push(`invalid-action:${districtId}`);
      if (action.kind === 'route' && !safeRoutes.has(action.route)) errors.push(`unsafe-route:${districtId}:${action.route}`);
      if (action.kind === 'city-panel' && !['command-room', 'travel-map'].includes(action.panel)) errors.push(`unsafe-panel:${districtId}:${action.panel}`);
      if (!['route', 'city-panel'].includes(action.kind)) errors.push(`fake-action-kind:${districtId}:${action.kind}`);
    }
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), districtCount: Object.keys(bindings || {}).length });
}

export function createEonCityW649DistrictRuntime({
  scene,
  quality = 'balanced',
  reducedMotion = false,
  capabilities = { meshoptDecoderReady: true, webpTextureReady: true, reducedData: false },
  loadContainer = defaultLoadContainer,
  onStatus = null,
  onProgress = null,
  excludedAssetIds = EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS
} = {}) {
  const residents = new Map();
  const suppressedAssetIds = new Set(excludedAssetIds || []);
  const transitions = [];
  let activeDistrictId = null;
  let activeLoad = null;
  let disposed = false;
  let abortedLoadCount = 0;
  let failedAssetCount = 0;
  const failedAssets = [];
  let livingElapsedMs = 0;
  let livingActorCount = 0;
  let livingActivities = freeze([]);

  const performanceProfile = getEonCityW649PerformanceProfile(quality, { reducedMotion, reducedData: capabilities?.reducedData === true });
  const residentLimit = Math.max(1, Math.min(MAX_RESIDENT_DISTRICTS, Number(performanceProfile.maxResidentDistricts || 1)));

  configureEonCityW649MeshoptDecoder();

  const unloadDistrict = (districtId, reason = 'district-left') => {
    const resident = residents.get(districtId);
    if (!resident) return false;
    resident.controller?.abort?.(reason);
    for (const record of resident.records.values()) disposeRecord(record);
    try { resident.root?.dispose?.(false, true); } catch {}
    residents.delete(districtId);
    transitions.push(freeze({ type: 'unload', districtId, reason, at: Date.now() }));
    return true;
  };

  const enforceResidentLimit = (reason = 'district-residency-budget') => {
    while (residents.size > residentLimit) {
      const candidate = [...residents.entries()]
        .filter(([districtId]) => districtId !== activeDistrictId)
        .sort((left, right) => Number(left[1]?.lastActiveAt || left[1]?.loadedAt || 0) - Number(right[1]?.lastActiveAt || right[1]?.loadedAt || 0))[0];
      if (!candidate) break;
      unloadDistrict(candidate[0], reason);
    }
    return residents.size;
  };

  const loadAsset = async ({ district, districtRoot, assetId, controller, records }) => {
    if (suppressedAssetIds.has(assetId)) return freeze({ ok: false, assetId, reason: 'asset-superseded-before-load' });
    const asset = getAsset(assetId);
    const placement = DISTRICT_PLACEMENT_OVERRIDES[district.id]?.[assetId] || freeze({ x: 0, z: 0, targetHeight: isCharacter(assetId) ? 1.82 : 2.5, rotationY: 0 });
    if (!asset) throw new Error(`w649-district-asset-unknown:${assetId}`);
    const selected = resolveEonCityW649AssetVariant(asset, { ...capabilities, reducedData: capabilities.reducedData === true || quality === 'lite' || reducedMotion === true });
    const order = selected.variant === 'primary' ? ['primary', 'fallback'] : ['fallback'];
    let lastError = null;
    const attempts = [];
    for (const variantName of order) {
      const variant = asset.variants[variantName];
      try {
        const container = await loadContainer({ scene, path: variant.path, signal: controller.signal, onProgress: (progress) => onProgress?.({ districtId: district.id, assetId, variant: variantName, ...progress }) });
        if (controller.signal.aborted || disposed || suppressedAssetIds.has(assetId)) {
          try { container?.dispose?.(); } catch {}
          throw new Error(suppressedAssetIds.has(assetId) ? 'w649-district-asset-superseded-after-container' : 'w649-district-load-aborted-after-container');
        }
        const attached = attachContainer({ scene, container, districtRoot, districtId: district.id, assetId, placement, quality });
        const animation = isCharacter(assetId)
          ? createEonCityW649AnimationStateMachine({ characterId: assetId, animationGroups: container?.animationGroups || [], rootNodes: attached.roots })
          : null;
        animation?.transition?.('idle', { restart: true });
        const record = {
          assetId, asset, variantName, variant, container, wrapper: attached.wrapper, roots: attached.roots, animation, visualIntegration: attached.visualIntegration, assetFunction: attached.assetFunction,
          living: animation ? {
            basePosition: attached.wrapper.position.clone(),
            baseRotationY: Number(attached.wrapper.rotation.y || 0),
            offsetX: 0,
            offsetZ: 0,
            lastState: 'idle',
            activity: 'standing by',
            reactive: false,
            overrideState: '',
            overrideUntilMs: 0
          } : null
        };
        records.set(assetId, record);
        return freeze({ ok: true, assetId, variant: variantName, bytes: variant.bytes });
      } catch (error) {
        lastError = error;
        attempts.push(freeze({
          variant: variantName,
          path: variant.path,
          reason: String(error?.message || error || 'load-failed')
        }));
        if (controller.signal.aborted) break;
      }
    }
    failedAssetCount += 1;
    const failure = freeze({
      districtId: district.id,
      assetId,
      attempts: freeze(attempts),
      reason: String(lastError?.message || lastError || 'load-failed'),
      at: Date.now()
    });
    failedAssets.push(failure);
    if (failedAssets.length > 40) failedAssets.splice(0, failedAssets.length - 40);
    transitions.push(freeze({ type: 'asset-failure', districtId: district.id, assetId, reason: failure.reason, at: failure.at }));
    return freeze({ ok: false, assetId, reason: failure.reason, attempts: failure.attempts });
  };

  const enterDistrict = async (requestedDistrictId, { reason = 'explicit-enter' } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'district-runtime-disposed' });
    const districtId = normalizeEonCityDistrictId(requestedDistrictId);
    const district = getEonCityW649District(districtId);
    const center = EON_CITY_W649_DISTRICT_CENTERS[districtId];
    const proceduralDistrict = districtId === 'command-centre' && center?.proceduralComposition === true;
    if ((!district && !proceduralDistrict) || !center || districtId === 'bootstrap') return freeze({ ok: false, reason: 'district-unavailable' });
    if (residents.has(districtId) && activeLoad?.districtId !== districtId) {
      activeDistrictId = districtId;
      residents.get(districtId).lastActiveAt = Date.now();
      enforceResidentLimit('district-cached-reactivation');
      transitions.push(freeze({ type: 'reactivate', districtId, reason, at: Date.now() }));
      return freeze({ ok: true, cached: true, districtId, summary: getSummary() });
    }
    if (activeLoad?.districtId === districtId && !activeLoad.controller.signal.aborted) {
      return freeze({ ok: false, pending: true, districtId, reason: 'district-load-in-progress', summary: getSummary() });
    }
    const previousActiveDistrictId = activeDistrictId;
    if (previousActiveDistrictId && residents.has(previousActiveDistrictId)) residents.get(previousActiveDistrictId).lastActiveAt = Date.now();
    if (activeLoad?.controller && !activeLoad.controller.signal.aborted) {
      activeLoad.controller.abort('district-superseded');
      abortedLoadCount += 1;
    }
    const controller = new AbortController();
    activeLoad = { districtId, controller, settled: false, previousActiveDistrictId };
    activeDistrictId = districtId;
    const root = new TransformNode(`w649-district-root-${districtId}`, scene);
    root.position.set(center.x, 0, center.z);
    root.metadata = freeze({ kind: 'w649-district-root', districtId, spatialModel: center.spatialModel, proximityResident: true, localOnly: true, privateData: false });
    const records = new Map();
    const residentDistrict = district || freeze({ id: districtId, label: 'Command Centre', assets: freeze([]), proceduralComposition: true });
    residents.set(districtId, { district: residentDistrict, root, records, controller, loadedAt: Date.now(), lastActiveAt: Date.now(), transitionFrom: previousActiveDistrictId || null });
    transitions.push(freeze({ type: 'enter-start', districtId, previousActiveDistrictId: previousActiveDistrictId || null, reason, proceduralComposition: proceduralDistrict, at: Date.now() }));
    if (proceduralDistrict) {
      activeLoad = null;
      enforceResidentLimit('district-overlap-complete');
      transitions.push(freeze({ type: 'enter-ready', districtId, previousActiveDistrictId: previousActiveDistrictId || null, proceduralComposition: true, at: Date.now() }));
      onStatus?.('Command Centre residency is active. W660I owns its citadel, skyline, lighting and productive terminals in the existing Babylon scene.');
      return freeze({ ok: true, districtId, proceduralComposition: true, loadedCount: 0, requestedCount: 0, results: freeze([]), summary: getSummary() });
    }
    onStatus?.(`Loading ${districtId.replaceAll('-', ' ')} from local W649 assets.`);
    const results = [];
    for (const assetId of orderDistrictAssets(selectedDistrictAssets(district, quality, reducedMotion, capabilities, suppressedAssetIds))) {
      if (controller.signal.aborted || disposed) break;
      results.push(await loadAsset({ district, districtRoot: root, assetId, controller, records }));
    }
    if (controller.signal.aborted || disposed) {
      if (activeLoad?.districtId === districtId) activeLoad = null;
      unloadDistrict(districtId, 'district-load-aborted');
      if (!disposed && previousActiveDistrictId && residents.has(previousActiveDistrictId)) activeDistrictId = previousActiveDistrictId;
      return freeze({ ok: false, districtId, reason: 'district-load-aborted', results: freeze(results) });
    }
    for (const record of records.values()) record.animation?.transition?.('idle', { restart: true });
    const okCount = results.filter((result) => result.ok).length;
    if (activeLoad?.districtId === districtId) activeLoad = null;
    if (okCount === 0) {
      unloadDistrict(districtId, 'district-empty-after-load');
      if (previousActiveDistrictId && residents.has(previousActiveDistrictId)) activeDistrictId = previousActiveDistrictId;
      return freeze({ ok: false, districtId, reason: 'district-assets-unavailable', loadedCount: 0, requestedCount: results.length, results: freeze(results), summary: getSummary() });
    }
    residents.get(districtId).lastActiveAt = Date.now();
    enforceResidentLimit('district-overlap-complete');
    transitions.push(freeze({ type: 'enter-ready', districtId, previousActiveDistrictId: previousActiveDistrictId || null, loadedCount: okCount, at: Date.now() }));
    onStatus?.(`${districtId.replaceAll('-', ' ')} loaded ${okCount}/${results.length} local assets. Actions remain explicit and route-backed.`);
    return freeze({ ok: true, districtId, loadedCount: okCount, requestedCount: results.length, results: freeze(results), summary: getSummary() });
  };


  const excludeAssets = (assetIds = [], { reason = 'functional-replacement-active' } = {}) => {
    const requested = [...new Set([...(assetIds || [])].map((assetId) => String(assetId || '').trim()).filter(Boolean))];
    const disposedAssetIds = [];
    for (const assetId of requested) {
      suppressedAssetIds.add(assetId);
      for (const resident of residents.values()) {
        const record = resident.records.get(assetId);
        if (!record) continue;
        disposeRecord(record);
        resident.records.delete(assetId);
        disposedAssetIds.push(assetId);
        transitions.push(freeze({ type: 'replacement-exclusion', districtId: resident.district.id, assetId, reason, at: Date.now() }));
      }
    }
    return freeze({
      ok: true,
      reason,
      excludedAssetIds: freeze([...suppressedAssetIds].sort()),
      disposedAssetIds: freeze(disposedAssetIds),
      noSupersededResidents: [...residents.values()].every((resident) => [...resident.records.keys()].every((assetId) => !suppressedAssetIds.has(assetId)))
    });
  };


  const updateLivingActors = (playerPosition = {}, deltaSeconds = 0.016) => {
    const safeDelta = clamp(Number(deltaSeconds) || 0.016, 0.001, 0.08);
    livingElapsedMs += safeDelta * 1000;
    const alpha = 1 - Math.exp(-5.5 * safeDelta);
    const activities = [];
    let count = 0;
    for (const resident of residents.values()) {
      const districtPosition = resident.root?.position || { x: 0, z: 0 };
      for (const record of resident.records.values()) {
        const living = record.living;
        if (!living || !record.animation || record.assetId === 'eoncity-eonbot-charging-station') continue;
        const actorWorld = {
          x: Number(districtPosition.x || 0) + Number(living.basePosition.x || 0) + Number(living.offsetX || 0),
          z: Number(districtPosition.z || 0) + Number(living.basePosition.z || 0) + Number(living.offsetZ || 0)
        };
        const playerDistance = Math.hypot(Number(playerPosition?.x || 0) - actorWorld.x, Number(playerPosition?.z || 0) - actorWorld.z);
        const playerBearing = Math.atan2(Number(playerPosition?.x || 0) - actorWorld.x, Number(playerPosition?.z || 0) - actorWorld.z);
        const directive = living.overrideUntilMs > livingElapsedMs && living.overrideState
          ? freeze({ state: living.overrideState, offsetX: living.offsetX, offsetZ: living.offsetZ, headingOffset: playerBearing, activity: 'responding to Pathfinder', reactive: true })
          : resolveEonCityW660mNpcDirective({ assetId: record.assetId, elapsedMs: livingElapsedMs, reducedMotion, playerDistance, playerBearing });
        living.offsetX += (Number(directive.offsetX || 0) - living.offsetX) * alpha;
        living.offsetZ += (Number(directive.offsetZ || 0) - living.offsetZ) * alpha;
        record.wrapper.position.x = living.basePosition.x + living.offsetX;
        record.wrapper.position.z = living.basePosition.z + living.offsetZ;
        const directiveHeading = Number.isFinite(Number(directive.headingOffset)) ? Number(directive.headingOffset) : 0;
        const desiredRotation = directive.reactive
          ? directiveHeading
          : living.baseRotationY + directiveHeading;
        record.wrapper.rotation.y += (desiredRotation - record.wrapper.rotation.y) * Math.min(1, alpha * 1.35);
        const animationProfile = getEonCityW649AnimationProfile(record.assetId);
        const requestedState = animationProfile?.aliases?.[directive.state] ? directive.state : 'idle';
        if (requestedState !== living.lastState) {
          const result = record.animation.transition(requestedState);
          if (result?.ok) living.lastState = requestedState;
        }
        record.animation.stabilize?.();
        living.activity = directive.activity;
        living.reactive = directive.reactive === true;
        count += 1;
        activities.push(freeze({ assetId: record.assetId, districtId: resident.district.id, state: living.lastState, activity: living.activity, reactive: living.reactive }));
      }
    }
    livingActorCount = count;
    livingActivities = freeze(activities);
    return freeze({ actorCount: count, activities: livingActivities, elapsedMs: Math.round(livingElapsedMs) });
  };

  const getLivingSummary = () => freeze({
    schema: `${EON_CITY_W649_DISTRICT_RUNTIME_SCHEMA}.w660m-living.v1`,
    actorCount: livingActorCount,
    elapsedMs: Math.round(livingElapsedMs),
    activities: livingActivities,
    reactiveActors: livingActivities.filter((entry) => entry.reactive).length,
    reducedMotion: Boolean(reducedMotion),
    localOnly: true,
    ownsRenderLoop: false
  });

  const getFunctionalAssets = () => freeze([...residents.values()].flatMap((resident) => [...resident.records.values()].map((record) => {
    if (!record.assetFunction) return null;
    let world = null;
    try { world = record.wrapper?.getAbsolutePosition?.() || null; } catch {}
    return freeze({
      ...record.assetFunction,
      districtId: resident.district.id,
      residentAssetId: record.assetId,
      position: freeze({
        x: Number(world?.x ?? (resident.root?.position?.x || 0) + (record.wrapper?.position?.x || 0)),
        y: Number(world?.y ?? (record.wrapper?.position?.y || 0)),
        z: Number(world?.z ?? (resident.root?.position?.z || 0) + (record.wrapper?.position?.z || 0))
      }),
      loaded: true,
      visible: true,
      exactWorldPick: true
    });
  }).filter(Boolean)));

  const getResidencySummary = () => {
    const residentRows = [...residents.entries()].map(([districtId, resident]) => freeze({
      districtId,
      loadedAssetIds: freeze([...resident.records.keys()]),
      loadedCount: resident.records.size,
      loadedBytes: [...resident.records.values()].reduce((sum, record) => sum + Number(record.variant?.bytes || 0), 0),
      lastActiveAt: Number(resident.lastActiveAt || resident.loadedAt || 0),
      transitionFrom: resident.transitionFrom || null
    }));
    return freeze({
      schema: `${EON_CITY_W649_DISTRICT_RUNTIME_SCHEMA}.residency.v1`,
      quality,
      activeDistrictId,
      residentDistrictCount: residents.size,
      residents: freeze(residentRows),
      loadedAssetCount: residentRows.reduce((sum, row) => sum + row.loadedCount, 0),
      loadedBytes: residentRows.reduce((sum, row) => sum + row.loadedBytes, 0),
      functionalAssetCount: getFunctionalAssets().length,
      functionalAssets: getFunctionalAssets(),
      excludedAssetIds: freeze([...suppressedAssetIds].sort()),
      localOnly: true,
      disposed
    });
  };

  const getSummary = () => {
    const residentRows = [...residents.entries()].map(([districtId, resident]) => freeze({
      districtId,
      loadedAssetIds: freeze([...resident.records.keys()]),
      loadedCount: resident.records.size,
      loadedBytes: [...resident.records.values()].reduce((sum, record) => sum + Number(record.variant?.bytes || 0), 0),
      lastActiveAt: Number(resident.lastActiveAt || resident.loadedAt || 0),
      transitionFrom: resident.transitionFrom || null,
      actions: EON_CITY_W649_ACTION_BINDINGS[districtId] || freeze([]),
      visualIntegration: freeze([...resident.records.values()].map((record) => record.visualIntegration?.getSummary?.()).filter(Boolean))
    }));
    return freeze({
      schema: EON_CITY_W649_DISTRICT_RUNTIME_SCHEMA,
      quality,
      performanceProfile,
      reducedMotion: Boolean(reducedMotion),
      activeDistrictId,
      residentDistrictCount: residents.size,
      maxResidentDistricts: residentLimit,
      residents: freeze(residentRows),
      loadedAssetCount: residentRows.reduce((sum, row) => sum + row.loadedCount, 0),
      loadedBytes: residentRows.reduce((sum, row) => sum + row.loadedBytes, 0),
      abortedLoadCount,
      failedAssetCount,
      failedAssets: freeze(failedAssets.slice(-20)),
      transitions: freeze(transitions.slice(-20)),
      preloadAll: false,
      localOnly: true,
      remoteAssets: false,
      actionsValidated: validateEonCityW649ActionBindings().ok,
      activeExperience: getEonCityW655DistrictExperience(activeDistrictId),
      living: getLivingSummary(),
      excludedAssetIds: freeze([...suppressedAssetIds].sort()),
      replacementState: freeze({
        noSupersededResidents: residentRows.every((row) => row.loadedAssetIds.every((assetId) => !suppressedAssetIds.has(assetId))),
        activeSupersededAssetIds: freeze(residentRows.flatMap((row) => row.loadedAssetIds.filter((assetId) => suppressedAssetIds.has(assetId))))
      }),
      visualCertificationPending: true,
      disposed
    });
  };

  return freeze({
    async start() { return enterDistrict('orientation-hall', { reason: 'post-core-orientation' }); },
    enterDistrict,
    update(position = {}, deltaSeconds = 0.016) {
      if (disposed) return null;
      const resolved = resolveEonCityW649DistrictAtPosition(position, { currentDistrictId: activeDistrictId });
      updateLivingActors(position, deltaSeconds);
      if (!resolved || resolved.districtId === activeDistrictId) return resolved;
      void enterDistrict(resolved.districtId, { reason: 'operator-proximity' });
      return resolved;
    },
    requestNpcState(assetId = '', state = 'idle', options = {}) {
      for (const resident of residents.values()) {
        const record = resident.records.get(String(assetId));
        if (!record?.animation) continue;
        if (record.living) {
          const profile = getEonCityW649AnimationProfile(record.assetId);
          record.living.overrideState = profile?.aliases?.[String(state || '').trim().toLowerCase()] ? String(state || '').trim().toLowerCase() : 'idle';
          record.living.overrideUntilMs = livingElapsedMs + clamp(Number(options.durationMs) || 2600, 300, 12_000);
        }
        return record.animation.transition(record.living?.overrideState || state, options);
      }
      return freeze({ ok: false, reason: 'npc-not-resident' });
    },
    getLivingSummary,
    getFunctionalAssets,
    getActionBindings(districtId = activeDistrictId) { return getEonCityW655DistrictActions(normalizeEonCityDistrictId(districtId)); },
    excludeAssets,
    getResidencySummary,
    getSummary,
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      if (activeLoad?.controller && !activeLoad.controller.signal.aborted) activeLoad.controller.abort('district-runtime-dispose');
      for (const districtId of [...residents.keys()]) unloadDistrict(districtId, 'city-runtime-dispose');
      activeDistrictId = null;
      return getSummary();
    }
  });
}

export function getEonCityW649DistrictRuntimeTruth() {
  const activeIds = new Set([
    ...EON_CITY_W649_CHARACTER_MANIFEST.entries.map((entry) => entry.id),
    ...EON_CITY_W649_WORLD_MANIFEST.entries.map((entry) => entry.id)
  ]);
  const unknownAssets = [];
  for (const district of EON_CITY_W649_DISTRICT_MANIFEST.districts) {
    for (const assetId of district.assets) if (!activeIds.has(assetId)) unknownAssets.push(`${district.id}:${assetId}`);
  }
  return freeze({
    schema: EON_CITY_W649_DISTRICT_RUNTIME_SCHEMA,
    districtCount: Object.keys(EON_CITY_W649_DISTRICT_CENTERS).length,
    activeAssetCount: activeIds.size,
    unknownAssets: freeze(unknownAssets),
    actionValidation: validateEonCityW649ActionBindings(),
    collisionVolumeCount: getEonCityW649DistrictCollisionVolumes().length,
    excludedAssetIds: freeze([...EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS].sort()),
    maxResidentDistricts: MAX_RESIDENT_DISTRICTS,
    preloadAll: false,
    localOnly: true
  });
}
