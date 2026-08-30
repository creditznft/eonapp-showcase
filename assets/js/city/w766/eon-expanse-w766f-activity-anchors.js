import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { getEonCityW649AnimationProfile } from '../w649/eon-city-w649-animation-manifest.js';
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';
import {
  EON_EXPANSE_W766F_DISCOVERIES,
  EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS
} from './eon-expanse-w766f-living-content.js';
import { EON_EXPANSE_W766_ZONES } from './eon-expanse-w766-region-contract.js';
import {
  collectEonExpanseW767EBounds,
  createEonExpanseW767EFailedPresentation,
  disposeEonExpanseW767ERejectedPresentation,
  evaluateEonExpanseW767EAuthoredPresentation
} from './eon-expanse-w767e-authored-presentation.js';
import { deriveEonExpanseW767MActivityAssetPresentation } from './eon-expanse-w767m-activity-presentation.js';
import { deriveEonExpanseW767ODynamicEventLifecycle } from './eon-expanse-w767o-dynamic-event-lifecycle.js';
import { deriveEonExpanseW767PDynamicEventPresentation } from './eon-expanse-w767p-dynamic-event-presentation.js';

const freeze = (value) => Object.freeze(value);
export const EON_EXPANSE_W766F_ACTIVITY_ANCHOR_SCHEMA = 'eon.city.expanse.activity-anchors.w766f.v1';

const SIDE_ANCHORS = freeze([
  freeze({ action: 'signal-fragment-collected', missionId: 'signal-salvage', itemId: 'signal-fragment-a', x: -49, y: 1.05, z: -27, shape: 'fragment' }),
  freeze({ action: 'signal-fragment-collected', missionId: 'signal-salvage', itemId: 'signal-fragment-b', x: -35, y: 1.05, z: -37, shape: 'fragment' }),
  freeze({ action: 'signal-fragment-collected', missionId: 'signal-salvage', itemId: 'signal-fragment-c', x: -44, y: 1.05, z: -43, shape: 'fragment' }),
  freeze({ action: 'archive-sweep-record-inspected', missionId: 'archive-sweep', itemId: 'archive-sweep-a', x: 31, y: 1.1, z: -53, shape: 'record' }),
  freeze({ action: 'archive-sweep-record-inspected', missionId: 'archive-sweep', itemId: 'archive-sweep-b', x: 52, y: 1.1, z: -61, shape: 'record' }),
  freeze({ action: 'eonbot-signal-followed', missionId: 'eonbot-curiosity-trail', itemId: 'eonbot-signal-a', x: 7, y: 1.15, z: 3, shape: 'signal' }),
  freeze({ action: 'eonbot-signal-followed', missionId: 'eonbot-curiosity-trail', itemId: 'eonbot-signal-b', x: -8, y: 1.15, z: 1, shape: 'signal' }),
  freeze({ action: 'eonbot-signal-followed', missionId: 'eonbot-curiosity-trail', itemId: 'eonbot-signal-c', x: 1, y: 1.15, z: -7, shape: 'signal' }),
  freeze({ action: 'lost-worker-located', missionId: 'lost-worker', itemId: 'lost-worker', x: -24, y: 1.3, z: -92, shape: 'worker' }),
  freeze({ action: 'lost-worker-terminal-activated', missionId: 'lost-worker', itemId: 'lost-worker-route-terminal', x: -2, y: 1.0, z: -96, shape: 'terminal' })
]);

const DISCOVERY_POSITIONS = freeze({
  'overlook-panorama': freeze({ x: 0, y: 1.2, z: -9 }),
  'beacon-echo': freeze({ x: -52, y: 1.3, z: -35 }),
  'archive-memory-wall': freeze({ x: 49, y: 1.4, z: -43 }),
  'scar-rail-fracture': freeze({ x: -20, y: 1.0, z: -103 }),
  'vault-horizon-window': freeze({ x: 27, y: 2.0, z: -137 })
});

const PRODUCTIVE_POSITIONS = freeze({
  'create-expedition': freeze({ x: -6.5, y: 1.05, z: 12 }),
  'local-ai-survey': freeze({ x: -32, y: 1.05, z: -24 }),
  'automation-relay': freeze({ x: -3, y: 1.05, z: -84 }),
  'knowledge-recovery': freeze({ x: 47, y: 1.05, z: -40 }),
  'status-review': freeze({ x: 9, y: 1.05, z: -126 })
});

const PRODUCTIVE_ASSETS = freeze({
  'create-expedition': freeze({ assetId: 'eoncity-forge-workbench', zoneId: 'gateway-overlook', targetHeight: 2.2 }),
  'local-ai-survey': freeze({ assetId: 'eoncity-ai-tower-core', zoneId: 'beacon-fields', targetHeight: 4.4 }),
  'automation-relay': freeze({ assetId: 'eoncity-district-info', zoneId: 'transit-scar', targetHeight: 2.8 }),
  'knowledge-recovery': freeze({ assetId: 'eoncity-district-hologram', zoneId: 'archive-ruins', targetHeight: 3.2 }),
  'status-review': freeze({ assetId: 'eoncity-nav-info-kiosk', zoneId: 'horizon-vault', targetHeight: 2.7 })
});

function splitAssetPath(path = '') {
  const normalized = String(path || '');
  const slash = normalized.lastIndexOf('/');
  return slash < 0 ? freeze({ rootUrl: '/', fileName: normalized }) : freeze({ rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) });
}

function variantName(path = '') {
  return String(path || '').includes('/fallback/') ? 'fallback' : 'primary';
}

function activityPlacement({ placementId = '', zoneId = '', assetId = '', position = {}, targetHeight = 0 } = {}) {
  return freeze({
    id: placementId,
    zoneId,
    assetId,
    position: freeze({ x: Number(position.x || 0), y: Number(position.y || 0), z: Number(position.z || 0) }),
    targetHeight: Number(targetHeight || 0)
  });
}

function activityAttempt(path, presentation) {
  const truth = presentation?.truth || null;
  return freeze({
    path: String(path || ''),
    variant: variantName(path),
    ok: presentation?.ok === true,
    reason: String(truth?.failureReason || ''),
    truth
  });
}

async function loadW649Asset({
  scene,
  parent,
  path,
  position,
  targetHeight,
  metadata,
  placementId = '',
  zoneId = '',
  assetId = '',
  characterId = '',
  disposed
}) {
  const placement = activityPlacement({ placementId, zoneId, assetId, position, targetHeight });
  const variant = variantName(path);
  if (!/^\/assets\/city\/w649\/(primary|fallback)\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || ''))) {
    const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId, requestedPath: path, variant, reason: 'asset-path-invalid' });
    return freeze({ ok: false, reason: presentation.truth.failureReason, attempt: activityAttempt(path, presentation) });
  }
  const { rootUrl, fileName } = splitAssetPath(path);
  let container = null;
  let wrapper = null;
  try {
    container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
    if (disposed()) {
      const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId, requestedPath: path, variant, reason: 'disposed-during-load' });
      disposeEonExpanseW767ERejectedPresentation(container, wrapper);
      return freeze({ ok: false, reason: 'disposed-during-load', attempt: activityAttempt(path, presentation) });
    }
    container.addAllToScene?.();
    wrapper = new TransformNode(`w766f-authored-${metadata.itemId || metadata.missionId}`, scene);
    wrapper.parent = parent;
    wrapper.position.set(position.x, position.y, position.z);
    wrapper.rotation.y = Math.PI;
    for (const rootNode of container.rootNodes || []) rootNode.parent = wrapper;
    for (const mesh of container.meshes || []) {
      mesh.isPickable = true;
      mesh.checkCollisions = false;
      mesh.metadata = metadata;
    }
    const initialBounds = collectEonExpanseW767EBounds(container.meshes || []);
    let appliedScale = 1;
    if (initialBounds?.height > 0.01) {
      appliedScale = Number(targetHeight || 2.2) / initialBounds.height;
      wrapper.scaling.setAll(appliedScale);
    }
    wrapper.computeWorldMatrix?.(true);
    const groundedBounds = collectEonExpanseW767EBounds(container.meshes || []);
    let groundOffset = 0;
    if (groundedBounds) {
      groundOffset = Number(position.y || 0) - groundedBounds.minY;
      wrapper.position.y += groundOffset;
      wrapper.computeWorldMatrix?.(true);
    }
    const finalBounds = collectEonExpanseW767EBounds(container.meshes || []);
    let activeAnimation = null;
    if (characterId) {
      const profile = getEonCityW649AnimationProfile(characterId);
      const idleName = profile?.aliases?.idle || profile?.clips?.[0] || '';
      activeAnimation = (container.animationGroups || []).find((group) => String(group?.name || '').toLowerCase() === String(idleName).toLowerCase()) || null;
      try { activeAnimation?.start?.(true, 1, activeAnimation.from, activeAnimation.to, false); } catch {}
    }
    const presentation = evaluateEonExpanseW767EAuthoredPresentation({
      placement,
      assetId,
      requestedPath: path,
      variant,
      container,
      sourceBounds: initialBounds,
      worldBounds: finalBounds,
      appliedScale,
      finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
      groundOffset
    });
    const attempt = activityAttempt(path, presentation);
    if (!presentation.ok) {
      try { activeAnimation?.stop?.(); } catch {}
      disposeEonExpanseW767ERejectedPresentation(container, wrapper);
      return freeze({ ok: false, reason: presentation.truth.failureReason, attempt });
    }
    return freeze({
      ok: true,
      wrapper,
      container,
      activeAnimation,
      meshCount: presentation.evidence.meshCount,
      path,
      truth: presentation.truth,
      attempt
    });
  } catch (error) {
    const reason = String(error?.message || error || 'asset-load-failed').slice(0, 180);
    const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId, requestedPath: path, variant, reason });
    disposeEonExpanseW767ERejectedPresentation(container, wrapper);
    return freeze({ ok: false, reason: presentation.truth.failureReason, attempt: activityAttempt(path, presentation) });
  }
}

function makeMaterial(scene, name, hex, intensity = 0.6, alpha = 1) {
  const value = new StandardMaterial(name, scene);
  value.diffuseColor = Color3.FromHexString(hex).scale(0.28);
  value.emissiveColor = Color3.FromHexString(hex).scale(intensity);
  value.specularColor = Color3.Black();
  value.alpha = alpha;
  return value;
}

function attach(mesh, root, metadata, material, position) {
  mesh.parent = root;
  mesh.position.set(position.x, position.y, position.z);
  mesh.material = material;
  mesh.isPickable = true;
  mesh.checkCollisions = false;
  mesh.metadata = freeze({ kind: 'expanse-living-content', ...metadata });
  return mesh;
}

function createSideMesh(scene, root, anchor, materials, quality) {
  let mesh;
  if (anchor.shape === 'fragment') {
    mesh = MeshBuilder.CreatePolyhedron(`w766f-${anchor.itemId}`, { type: 1, size: 0.72 }, scene);
    mesh.rotation.z = Math.PI / 4;
  } else if (anchor.shape === 'record') {
    mesh = MeshBuilder.CreateBox(`w766f-${anchor.itemId}`, { width: 0.9, height: 1.25, depth: 0.22 }, scene);
  } else if (anchor.shape === 'worker') {
    mesh = MeshBuilder.CreateCapsule?.(`w766f-${anchor.itemId}`, { height: 2.4, radius: 0.45, tessellation: quality === 'lite' ? 8 : 14 }, scene)
      || MeshBuilder.CreateCylinder(`w766f-${anchor.itemId}`, { height: 2.2, diameter: 0.85, tessellation: 12 }, scene);
  } else if (anchor.shape === 'terminal') {
    mesh = MeshBuilder.CreateBox(`w766f-${anchor.itemId}`, { width: 1.7, height: 1.5, depth: 0.9 }, scene);
  } else {
    mesh = MeshBuilder.CreateSphere(`w766f-${anchor.itemId}`, { diameter: 0.78, segments: quality === 'lite' ? 8 : 14 }, scene);
  }
  const material = anchor.shape === 'worker' ? materials.warm : anchor.shape === 'terminal' ? materials.green : anchor.shape === 'record' ? materials.violet : materials.signal;
  return attach(mesh, root, { action: 'living-world-interaction', interactionAction: anchor.action, missionId: anchor.missionId, itemId: anchor.itemId }, material, anchor);
}

export function mountEonExpanseW766FActivityAnchors({
  scene,
  parent = null,
  quality = 'balanced',
  initialState = {},
  onInteract = null
} = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w766f-activity-anchor-root', scene);
  if (parent) root.parent = parent;
  const materials = freeze({
    signal: makeMaterial(scene, 'w766f-activity-signal', '#33c9ff', 0.85),
    violet: makeMaterial(scene, 'w766f-activity-violet', '#a27bff', 0.78),
    warm: makeMaterial(scene, 'w766f-activity-warm', '#ffbd68', 0.72),
    green: makeMaterial(scene, 'w766f-activity-green', '#5ce6b7', 0.78),
    discovery: makeMaterial(scene, 'w766f-activity-discovery', '#d6f5ff', 0.7, 0.82),
    event: makeMaterial(scene, 'w766f-activity-event', '#ff6688', 0.86, 0.78)
  });

  const sideMeshes = new Map();
  for (const anchor of SIDE_ANCHORS) sideMeshes.set(anchor.itemId, createSideMesh(scene, root, anchor, materials, quality));

  const discoveryMeshes = new Map();
  for (const discovery of EON_EXPANSE_W766F_DISCOVERIES) {
    const position = DISCOVERY_POSITIONS[discovery.id];
    if (!position) continue;
    const mesh = MeshBuilder.CreateTorus(`w766f-discovery-${discovery.id}`, { diameter: 1.6, thickness: 0.12, tessellation: quality === 'lite' ? 16 : 28 }, scene);
    mesh.rotation.x = Math.PI / 2;
    discoveryMeshes.set(discovery.id, attach(mesh, root, { action: 'living-discovery', discoveryId: discovery.id, discoveryLabel: discovery.label, label: `Review ${discovery.label}`, zoneId: discovery.zoneId }, materials.discovery, position));
  }

  const productiveMeshes = new Map();
  for (const mission of EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS) {
    const position = PRODUCTIVE_POSITIONS[mission.id];
    if (!position) continue;
    const mesh = MeshBuilder.CreateBox(`w766f-productive-${mission.id}`, { width: 1.7, height: 1.4, depth: 0.75 }, scene);
    productiveMeshes.set(mission.id, attach(mesh, root, { action: 'productive-mission-review', missionId: mission.id, missionLabel: mission.label, label: `Review ${mission.label}`, workspaceId: mission.workspaceId }, materials.green, position));
  }

  let isDisposed = false;
  let state = initialState || {};
  const authoredAssets = new Map();
  const authoredFailures = new Map();
  const pendingAssets = new Set();
  const pendingAssetKeys = new Set();
  const authoredFallbacks = new Map();
  const syncAuthoredPresentation = (key) => {
    const presentation = deriveEonExpanseW767MActivityAssetPresentation({ assetKey: key, state, at: Date.now() });
    const entry = authoredAssets.get(key) || null;
    const fallbackMesh = authoredFallbacks.get(key) || null;
    if (entry?.ok) {
      entry.wrapper?.setEnabled?.(presentation.visible);
      for (const mesh of entry.container?.meshes || []) mesh.isPickable = presentation.interactive;
      fallbackMesh?.setEnabled?.(false);
    } else {
      fallbackMesh?.setEnabled?.(presentation.visible);
    }
    return presentation;
  };
  const scheduleAsset = (key, loader, fallbackMesh) => {
    authoredFallbacks.set(key, fallbackMesh || null);
    pendingAssetKeys.add(key);
    const task = loader().then((result) => {
      if (result.ok) { authoredAssets.set(key, result); fallbackMesh?.setEnabled?.(false); }
      if (result.ok) syncAuthoredPresentation(key);
      else { authoredFailures.set(key, result); syncAuthoredPresentation(key); }
      return result;
    }).catch((error) => {
      const reason = String(error?.message || error || 'asset-load-failed').slice(0, 180);
      const result = freeze({ ok: false, reason, attempts: freeze([]) });
      authoredFailures.set(key, result);
      syncAuthoredPresentation(key);
      return result;
    }).finally(() => { pendingAssets.delete(task); pendingAssetKeys.delete(key); });
    pendingAssets.add(task);
  };

  const lostWorkerFallback = sideMeshes.get('lost-worker');
  const workerCharacter = getEonCityW649Character('forge-worker');
  if (workerCharacter && lostWorkerFallback) {
    const workerMetadata = lostWorkerFallback.metadata;
    scheduleAsset('lost-worker', async () => {
      let last = freeze({ ok: false, reason: 'worker-asset-load-failed' });
      const attempts = [];
      for (const variant of [workerCharacter.variants.primary, workerCharacter.variants.fallback]) {
        last = await loadW649Asset({
          scene, parent: root, path: variant.path, position: { x: -24, y: 0, z: -92 }, targetHeight: 2.15,
          metadata: workerMetadata, placementId: 'activity:lost-worker', zoneId: 'transit-scar', assetId: workerCharacter.id,
          characterId: workerCharacter.id, disposed: () => isDisposed
        });
        if (last.attempt) attempts.push(last.attempt);
        if (last.ok || last.reason === 'disposed-during-load') return freeze({ ...last, attempts: freeze(attempts) });
      }
      return freeze({ ...last, attempts: freeze(attempts) });
    }, lostWorkerFallback);
  }

  for (const mission of EON_EXPANSE_W766F_PRODUCTIVE_MISSIONS) {
    const fallbackMesh = productiveMeshes.get(mission.id);
    const config = PRODUCTIVE_ASSETS[mission.id];
    const position = PRODUCTIVE_POSITIONS[mission.id];
    const asset = config ? getEonCityW649WorldAsset(config.assetId) : null;
    if (!fallbackMesh || !asset || !position) continue;
    const metadata = fallbackMesh.metadata;
    scheduleAsset(`productive:${mission.id}`, async () => {
      let last = freeze({ ok: false, reason: 'productive-asset-load-failed' });
      const attempts = [];
      for (const variant of [asset.variants.primary, asset.variants.fallback]) {
        last = await loadW649Asset({
          scene, parent: root, path: variant.path, position: { x: position.x, y: 0, z: position.z }, targetHeight: config.targetHeight,
          metadata, placementId: `activity:productive:${mission.id}`, zoneId: config.zoneId, assetId: asset.id, disposed: () => isDisposed
        });
        if (last.attempt) attempts.push(last.attempt);
        if (last.ok || last.reason === 'disposed-during-load') return freeze({ ...last, attempts: freeze(attempts) });
      }
      return freeze({ ...last, attempts: freeze(attempts) });
    }, fallbackMesh);
  }

  const eventMarker = MeshBuilder.CreateTorus('w766f-dynamic-event-marker', { diameter: 3.4, thickness: 0.18, tessellation: quality === 'lite' ? 18 : 32 }, scene);
  eventMarker.parent = root;
  eventMarker.rotation.x = Math.PI / 2;
  eventMarker.material = materials.event;
  eventMarker.isPickable = true;
  eventMarker.checkCollisions = false;
  eventMarker.setEnabled(false);

  let activeEvent = null;

  const applyState = (next = {}) => {
    state = next || {};
    const progress = state.activityProgress || {};
    const activeCycleKey = new Date().toISOString().slice(0, 10);
    const repeatableProgressActive = String(progress.cycleKey || '') === activeCycleKey;
    for (const [id, mesh] of sideMeshes) {
      const collected = (repeatableProgressActive && (progress.signalFragments || []).includes(id))
        || (repeatableProgressActive && (progress.archiveSweepRecords || []).includes(id))
        || (repeatableProgressActive && (progress.eonbotSignals || []).includes(id))
        || (id === 'lost-worker' && progress.lostWorkerLocated)
        || (id === 'lost-worker-route-terminal' && progress.routeTerminalActivated);
      mesh.setEnabled(!collected);
    }
    for (const [id, mesh] of discoveryMeshes) mesh.setEnabled(!(state.discoveries || []).includes(id));
    for (const key of authoredFallbacks.keys()) syncAuthoredPresentation(key);
    return getSummary();
  };

  const updateEvent = (event = null, seconds = 0, at = Date.now()) => {
    const lifecycle = deriveEonExpanseW767ODynamicEventLifecycle(event, { at });
    const presentation = deriveEonExpanseW767PDynamicEventPresentation(event, { at });
    activeEvent = lifecycle.active ? event : null;
    if (!activeEvent) { eventMarker.setEnabled(false); eventMarker.isPickable = false; eventMarker.metadata = null; return freeze({ ok: true, active: false, reason: lifecycle.status === 'expired' ? 'dynamic-event-expired' : 'dynamic-event-inactive', lifecycle, presentation }); }
    const zone = EON_EXPANSE_W766_ZONES.find((item) => item.id === activeEvent.zoneId);
    if (!zone) { eventMarker.setEnabled(false); return freeze({ ok: false, reason: 'event-zone-not-found' }); }
    eventMarker.position.set(zone.x + 4.5, 1.2 + Math.sin(Number(seconds || 0) * 2.2) * 0.2, zone.z + 3.5);
    eventMarker.rotation.z = Number(seconds || 0) * 0.55;
    eventMarker.metadata = freeze({ kind: 'expanse-living-content', action: 'dynamic-event-reviewed', eventId: activeEvent.id, zoneId: activeEvent.zoneId, windowId: activeEvent.windowId, endsAt: activeEvent.endsAt, label: presentation.markerLabel, remainingMs: presentation.remainingMs, endingSoon: presentation.endingSoon });
    eventMarker.isPickable = true;
    eventMarker.setEnabled(true);
    return freeze({ ok: true, active: true, event: activeEvent, presentation });
  };

  const handleInteraction = (event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK || !event?.pickInfo?.hit) return freeze({ ok: false, reason: 'living-interaction-miss' });
    const metadata = event?.pickInfo?.pickedMesh?.metadata || {};
    if (metadata.kind !== 'expanse-living-content' || !metadata.action) return freeze({ ok: false, reason: 'living-interaction-metadata-invalid' });
    onInteract?.(freeze({ ...metadata, explicitUserAction: true }));
    return freeze({ ok: true, action: metadata.action });
  };
  const pointerObserver = scene.onPointerObservable?.add?.(handleInteraction);

  const getSummary = () => freeze({
    schema: EON_EXPANSE_W766F_ACTIVITY_ANCHOR_SCHEMA,
    mounted: true,
    sideAnchorCount: sideMeshes.size,
    discoveryAnchorCount: discoveryMeshes.size,
    productiveAnchorCount: productiveMeshes.size,
    authoredAssetCount: authoredAssets.size,
    authoredAssetPending: pendingAssets.size,
    authoredAssetFailures: authoredFailures.size,
    assetStates: freeze([
      ...[...authoredAssets.entries()].map(([id, entry]) => {
        const missionId = id.startsWith('productive:') ? id.slice('productive:'.length) : '';
        const descriptor = missionId ? PRODUCTIVE_ASSETS[missionId] : id === 'lost-worker' ? { assetId: 'forge-worker', zoneId: 'transit-scar' } : {};
        return freeze({
          id, assetId: descriptor?.assetId || '', zoneId: descriptor?.zoneId || '', state: 'loaded', path: entry.path || '',
          meshCount: entry.meshCount || 0, visibleMeshCount: Number(entry.truth?.visibleMeshCount || 0), materialCount: Number(entry.truth?.materialCount || 0),
          worldBounds: entry.truth?.worldBounds || null, truth: entry.truth || null, attempts: entry.attempts || freeze([]), failureReason: '',
          presentationVisible: entry.wrapper?.isEnabled?.() === true, presentationInteractive: (entry.container?.meshes || []).some((mesh) => mesh.isPickable === true)
        });
      }),
      ...[...authoredFailures.entries()].map(([id, entry]) => {
        const missionId = id.startsWith('productive:') ? id.slice('productive:'.length) : '';
        const descriptor = missionId ? PRODUCTIVE_ASSETS[missionId] : id === 'lost-worker' ? { assetId: 'forge-worker', zoneId: 'transit-scar' } : {};
        const lastAttempt = entry?.attempts?.[entry.attempts.length - 1] || entry?.attempt || null;
        return freeze({
          id, assetId: descriptor?.assetId || '', zoneId: descriptor?.zoneId || '', state: 'failed', path: lastAttempt?.path || '', meshCount: 0,
          visibleMeshCount: 0, materialCount: 0, worldBounds: null, truth: lastAttempt?.truth || null, attempts: entry?.attempts || freeze([]),
          failureReason: entry?.reason || lastAttempt?.reason || 'asset-presentation-rejected',
          presentationVisible: authoredFallbacks.get(id)?.isEnabled?.() === true, presentationInteractive: authoredFallbacks.get(id)?.isPickable === true
        });
      }),
      ...[...pendingAssetKeys].map((id) => {
        const missionId = id.startsWith('productive:') ? id.slice('productive:'.length) : '';
        const descriptor = missionId ? PRODUCTIVE_ASSETS[missionId] : id === 'lost-worker' ? { assetId: 'forge-worker', zoneId: 'transit-scar' } : {};
        return freeze({ id, assetId: descriptor?.assetId || '', zoneId: descriptor?.zoneId || '', state: 'pending', path: '', meshCount: 0, visibleMeshCount: 0, materialCount: 0, worldBounds: null, truth: null, attempts: freeze([]), failureReason: '', presentationVisible: authoredFallbacks.get(id)?.isEnabled?.() === true, presentationInteractive: authoredFallbacks.get(id)?.isPickable === true });
      })
    ]),
    activeEvent: activeEvent ? freeze({ id: activeEvent.id, zoneId: activeEvent.zoneId, windowId: activeEvent.windowId }) : null,
    canonicalScene: root.getScene?.() === scene,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false
  });

  applyState(state);
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766F_ACTIVITY_ANCHOR_SCHEMA,
    root,
    ready() { return Promise.allSettled([...pendingAssets]); },
    interact(metadata = {}, { source = 'expanse-proximity', explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return handleInteraction({ type: PointerEventTypes.POINTERPICK, pickInfo: { hit: true, pickedMesh: { metadata, name: source } } });
    },
    applyState,
    updateEvent,
    getSummary,
    dispose() {
      isDisposed = true;
      for (const entry of authoredAssets.values()) { try { entry.activeAnimation?.stop?.(); } catch {} try { entry.container?.dispose?.(); } catch {} }
      authoredAssets.clear();
      try { if (pointerObserver) scene.onPointerObservable?.remove?.(pointerObserver); } catch {}
      for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}
