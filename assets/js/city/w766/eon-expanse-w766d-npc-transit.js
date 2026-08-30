import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { getEonCityW649AnimationProfile } from '../w649/eon-city-w649-animation-manifest.js';
import { EON_EXPANSE_W766_TRANSIT_NODES } from './eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W766D_ROUTE_GRAPHS, sampleEonExpanseW766DRoutePosition, validateEonExpanseW766DRouteRegistry } from './eon-expanse-w766d-route-validator.js';
import {
  collectEonExpanseW767EBounds,
  createEonExpanseW767EFailedPresentation,
  disposeEonExpanseW767ERejectedPresentation,
  evaluateEonExpanseW767EAuthoredPresentation
} from './eon-expanse-w767e-authored-presentation.js';

const freeze = (value) => Object.freeze(value);
export const EON_EXPANSE_W766D_NPCS = freeze([
  freeze({ id: 'pathfinder-guide', label: 'Pathfinder', role: 'guide', zoneId: 'gateway-overlook', routeId: 'pathfinder-gateway-patrol', accent: '#25b6ff', action: 'meet-pathfinder', assetAlias: 'player-primary', fallbackAlias: 'player-fallback', targetHeight: 2.25, speed: 0.75 }),
  freeze({ id: 'archive-navigator', label: 'Navigator', role: 'archive', zoneId: 'archive-ruins', routeId: 'navigator-archive-loop', accent: '#9d72ff', action: 'meet-navigator', assetAlias: 'archive-guide', targetHeight: 2.18, speed: 0.52 }),
  freeze({ id: 'transit-maintainer', label: 'Maintenance Worker', role: 'transit', zoneId: 'transit-scar', routeId: 'maintenance-transit-loop', accent: '#ffbc62', action: 'meet-maintainer', assetAlias: 'forge-worker', targetHeight: 2.15, speed: 0.52 })
]);
export const EON_EXPANSE_W766D_TRANSIT_NODES = EON_EXPANSE_W766_TRANSIT_NODES;

const material = (scene, name, hex) => {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hex).scale(0.35);
  mat.emissiveColor = Color3.FromHexString(hex).scale(0.55);
  mat.specularColor = Color3.Black();
  return mat;
};

function splitAssetPath(path = '') {
  const normalized = String(path || '');
  const slash = normalized.lastIndexOf('/');
  return slash < 0 ? freeze({ rootUrl: '/', fileName: normalized }) : freeze({ rootUrl: normalized.slice(0, slash + 1), fileName: normalized.slice(slash + 1) });
}

function animationGroup(groups = [], name = '') {
  const target = String(name || '').toLowerCase();
  return groups.find((group) => String(group?.name || '').toLowerCase() === target) || null;
}

function startNpcAnimation(record, kind = 'idle') {
  if (record.runtimeActive === false) return false;
  const name = record.animationPlan?.aliases?.[kind]
    || (kind === 'talk' ? record.animationPlan?.aliases?.interact : null)
    || record.animationPlan?.aliases?.idle
    || '';
  const next = animationGroup(record.animationGroups, name);
  if (!next || next === record.activeAnimation) return false;
  try { record.activeAnimation?.stop?.(); } catch {}
  try {
    next.start?.(true, 1, next.from, next.to, false);
    record.activeAnimation = next;
    record.animationState = kind;
    return true;
  } catch { return false; }
}

function npcPlacement(record, assetId = '') {
  const position = record.anchor.getAbsolutePosition?.() || record.anchor.position || {};
  return freeze({
    id: `npc:${record.npc.id}`,
    zoneId: record.npc.zoneId || '',
    assetId,
    position: freeze({ x: Number(position.x || 0), y: Number(position.y || 0), z: Number(position.z || 0) }),
    targetHeight: Number(record.npc.targetHeight || 0)
  });
}

function variantName(path = '') {
  return String(path || '').includes('/fallback/') ? 'fallback' : 'primary';
}

function attemptRecord(path, presentation) {
  const truth = presentation?.truth || null;
  return freeze({
    path: String(path || ''),
    variant: variantName(path),
    ok: presentation?.ok === true,
    reason: String(truth?.failureReason || ''),
    truth
  });
}

async function loadCharacterVariant({ scene, record, character, variant }) {
  const placement = npcPlacement(record, character.id);
  const variantType = variantName(variant?.path);
  const { rootUrl, fileName } = splitAssetPath(variant?.path);
  if (!rootUrl.startsWith('/assets/city/w649/') || !/\.[a-f0-9]{12}\.glb$/i.test(fileName)) {
    const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId: character.id, requestedPath: variant?.path, variant: variantType, reason: 'asset-path-invalid' });
    return freeze({ ok: false, reason: presentation.truth.failureReason, attempt: attemptRecord(variant?.path, presentation) });
  }
  let container = null;
  let wrapper = null;
  try {
    container = await SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, scene);
    if (record.disposed) {
      const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId: character.id, requestedPath: variant.path, variant: variantType, reason: 'disposed-during-load' });
      disposeEonExpanseW767ERejectedPresentation(container, wrapper);
      return freeze({ ok: false, reason: 'disposed-during-load', attempt: attemptRecord(variant.path, presentation) });
    }
    container.addAllToScene?.();
    wrapper = new TransformNode(`w766d-npc-asset-${record.npc.id}`, scene);
    wrapper.parent = record.anchor;
    for (const rootNode of container.rootNodes || []) rootNode.parent = wrapper;
    for (const mesh of container.meshes || []) {
      mesh.isPickable = true;
      mesh.metadata = record.anchor.metadata;
      mesh.checkCollisions = false;
    }
    const initialBounds = collectEonExpanseW767EBounds(container.meshes || []);
    let appliedScale = 1;
    if (initialBounds?.height > 0.01) {
      appliedScale = record.npc.targetHeight / initialBounds.height;
      wrapper.scaling.setAll(appliedScale);
    }
    wrapper.rotation.y = Math.PI;
    wrapper.computeWorldMatrix?.(true);
    const groundedBounds = collectEonExpanseW767EBounds(container.meshes || []);
    let groundOffset = 0;
    if (groundedBounds) {
      groundOffset = placement.position.y - groundedBounds.minY;
      wrapper.position.y += groundOffset;
      wrapper.computeWorldMatrix?.(true);
    }
    const finalBounds = collectEonExpanseW767EBounds(container.meshes || []);
    const presentation = evaluateEonExpanseW767EAuthoredPresentation({
      placement,
      assetId: character.id,
      requestedPath: variant.path,
      variant: variantType,
      container,
      sourceBounds: initialBounds,
      worldBounds: finalBounds,
      appliedScale,
      finalPosition: wrapper.getAbsolutePosition?.() || wrapper.position,
      groundOffset
    });
    const attempt = attemptRecord(variant.path, presentation);
    if (!presentation.ok) {
      disposeEonExpanseW767ERejectedPresentation(container, wrapper);
      return freeze({ ok: false, reason: presentation.truth.failureReason, attempt });
    }
    record.container = container;
    record.assetRoot = wrapper;
    record.animationGroups = [...(container.animationGroups || [])];
    record.animationPlan = getEonCityW649AnimationProfile(character.id);
    record.characterId = character.id;
    record.variantPath = variant.path;
    record.presentationTruth = presentation.truth;
    startNpcAnimation(record, 'idle');
    record.fallbackRoot.setEnabled(false);
    record.assetState = 'loaded';
    record.failureReason = '';
    return freeze({
      ok: true,
      assetId: character.id,
      animationCount: record.animationGroups.length,
      path: variant.path,
      truth: presentation.truth,
      attempt
    });
  } catch (error) {
    const reason = String(error?.message || error || 'asset-load-failed').slice(0, 220);
    const presentation = createEonExpanseW767EFailedPresentation({ placement, assetId: character.id, requestedPath: variant?.path, variant: variantType, reason });
    disposeEonExpanseW767ERejectedPresentation(container, wrapper);
    return freeze({ ok: false, reason: presentation.truth.failureReason, attempt: attemptRecord(variant?.path, presentation) });
  }
}

async function loadNpcAsset({ scene, record } = {}) {
  const aliases = [record.npc.assetAlias, record.npc.fallbackAlias].filter(Boolean);
  let lastReason = 'asset-not-registered';
  for (const alias of aliases) {
    const character = getEonCityW649Character(alias);
    if (!character) continue;
    for (const variant of [character.variants.primary, character.variants.fallback]) {
      const result = await loadCharacterVariant({ scene, record, character, variant });
      if (result.attempt) record.assetAttempts.push(result.attempt);
      if (result.ok) return result;
      lastReason = result.reason;
      if (result.reason === 'disposed-during-load') return result;
    }
  }
  record.assetState = 'fallback';
  record.failureReason = lastReason;
  record.presentationTruth = null;
  return freeze({ ok: false, reason: lastReason, attempts: freeze([...record.assetAttempts]) });
}

export function createEonExpanseW766DTransitController({ getUnlocked = () => ['gateway-overlook'], onTravel = null } = {}) {
  let review = null;
  return freeze({
    list() {
      const unlocked = new Set(getUnlocked());
      return freeze(EON_EXPANSE_W766D_TRANSIT_NODES.map((node) => freeze({ ...node, unlocked: node.unlockedByDefault || unlocked.has(node.id) })));
    },
    request(nodeId, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const node = this.list().find((candidate) => candidate.id === nodeId);
      if (!node) return freeze({ ok: false, reason: 'transit-node-not-found' });
      if (!node.unlocked) return freeze({ ok: false, reason: 'transit-node-locked' });
      review = freeze({ token: `expanse-transit:${nodeId}`, node });
      return freeze({ ok: true, review });
    },
    confirm(token, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!review || token !== review.token) return freeze({ ok: false, reason: 'transit-review-required' });
      const result = onTravel?.(review.node) || freeze({ ok: true, node: review.node });
      review = null;
      return result;
    },
    cancel({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      review = null;
      return freeze({ ok: true });
    },
    getReview() { return review; }
  });
}

export function mountEonExpanseW766DNpcs({ scene, parent, onInteract = null, quality = 'balanced' } = {}) {
  if (!scene || !parent) return freeze({ ok: false, reason: 'scene-and-parent-required' });
  const validation = validateEonExpanseW766DRouteRegistry();
  if (!validation.ok) return freeze({ ok: false, reason: `route-validation-failed:${validation.failures.join('|')}` });
  const root = new TransformNode('w766d-expanse-npc-root', scene);
  root.parent = parent;
  const records = [];
  const materials = [];
  let elapsed = 0;
  let active = true;
  for (let index = 0; index < EON_EXPANSE_W766D_NPCS.length; index += 1) {
    const npc = EON_EXPANSE_W766D_NPCS[index];
    const route = EON_EXPANSE_W766D_ROUTE_GRAPHS.find((candidate) => candidate.id === npc.routeId);
    const start = sampleEonExpanseW766DRoutePosition(route, 0);
    const anchor = new TransformNode(`w766d-npc-${npc.id}`, scene);
    anchor.parent = root;
    anchor.position.set(start.x, 0, start.z);
    anchor.metadata = freeze({ kind: 'expanse-npc', npcId: npc.id, npcLabel: npc.label, role: npc.role, action: npc.action, interactive: true });
    const fallbackRoot = new TransformNode(`w766d-npc-fallback-${npc.id}`, scene);
    fallbackRoot.parent = anchor;
    const mat = material(scene, `w766d-npc-material-${npc.id}`, npc.accent);
    materials.push(mat);
    const body = MeshBuilder.CreateCylinder(`w766d-npc-body-${npc.id}`, { diameterTop: 0.72, diameterBottom: 0.95, height: 1.8, tessellation: 18 }, scene);
    body.parent = fallbackRoot;
    body.position.y = 0.95;
    body.material = mat;
    body.isPickable = true;
    body.metadata = anchor.metadata;
    body.checkCollisions = true;
    const head = MeshBuilder.CreateSphere(`w766d-npc-head-${npc.id}`, { diameter: 0.72, segments: 16 }, scene);
    head.parent = fallbackRoot;
    head.position.y = 2.05;
    head.material = mat;
    head.isPickable = true;
    head.metadata = anchor.metadata;
    const record = {
      npc,
      route,
      anchor,
      fallbackRoot,
      distance: 0,
      disposed: false,
      assetState: 'loading',
      failureReason: '',
      assetAttempts: [],
      container: null,
      assetRoot: null,
      animationGroups: [],
      animationPlan: null,
      activeAnimation: null,
      animationState: 'idle',
      characterId: '',
      variantPath: '',
      presentationTruth: null,
      talkUntil: 0,
      pauseOffset: index * 2.7,
      runtimeActive: true
    };
    records.push(record);
    loadNpcAsset({ scene, record, quality });
  }
  const handleInteraction = (event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK || !event?.pickInfo?.hit) return freeze({ ok: false, reason: 'npc-interaction-miss' });
    const meta = event.pickInfo.pickedMesh?.metadata;
    if (meta?.kind !== 'expanse-npc') return freeze({ ok: false, reason: 'npc-interaction-metadata-invalid' });
    const record = records.find((candidate) => candidate.npc.id === meta.npcId);
    if (record) {
      record.talkUntil = elapsed + 2.6;
      startNpcAnimation(record, record.animationPlan?.aliases?.talk ? 'talk' : 'interact');
    }
    onInteract?.(freeze({ action: meta.action, npcId: meta.npcId, source: event.pickInfo.pickedMesh.name, explicitUserAction: true }));
    return freeze({ ok: true, action: meta.action, npcId: meta.npcId });
  };
  const observer = scene.onPointerObservable?.add?.(handleInteraction);
  return freeze({
    ok: true,
    setActive(nextActive = true) {
      active = nextActive === true;
      root.setEnabled?.(active);
      for (const record of records) {
        record.runtimeActive = active;
        if (!active) {
          try { record.activeAnimation?.stop?.(); } catch {}
          record.activeAnimation = null;
          record.animationState = 'paused';
        } else startNpcAnimation(record, 'idle');
      }
      return freeze({ ok: true, active, retainedDecodedNpcCount: records.filter((record) => record.assetState === 'loaded').length, sameSessionReuse: true });
    },
    interact(metadata = {}, { source = 'expanse-proximity', explicitUserAction = false } = {}) {
      if (!active) return freeze({ ok: false, reason: 'expanse-npc-runtime-inactive' });
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      return handleInteraction({ type: PointerEventTypes.POINTERPICK, pickInfo: { hit: true, pickedMesh: { metadata, name: source } } });
    },
    update(deltaSeconds = 0.016) {
      if (!active) return freeze({ ok: true, active: false, ownsRenderLoop: false });
      const delta = Math.min(0.1, Math.max(0, Number(deltaSeconds || 0)));
      elapsed += delta;
      for (const record of records) {
        if (elapsed < record.talkUntil) continue;
        const cycle = (elapsed + record.pauseOffset) % 12;
        const paused = cycle >= 9.6;
        if (!paused) {
          record.distance += delta * record.npc.speed;
          const pose = sampleEonExpanseW766DRoutePosition(record.route, record.distance);
          record.anchor.position.x = pose.x;
          record.anchor.position.z = pose.z;
          record.anchor.rotation.y = pose.heading;
        }
        startNpcAnimation(record, paused ? 'idle' : 'walk');
      }
    },
    getSummary() {
      return freeze({
        active,
        npcCount: records.length,
        routeValidation: validation,
        npcIds: freeze(records.map((record) => record.npc.id)),
        assetStates: freeze(records.map((record) => freeze({
          npcId: record.npc.id,
          zoneId: record.npc.zoneId || '',
          role: record.npc.role || '',
          assetAlias: record.npc.assetAlias,
          fallbackAlias: record.npc.fallbackAlias || '',
          characterId: record.characterId,
          state: record.assetState,
          animationState: record.animationState,
          animationCount: record.animationGroups.length,
          variantPath: record.variantPath,
          visibleMeshCount: Number(record.presentationTruth?.visibleMeshCount || 0),
          materialCount: Number(record.presentationTruth?.materialCount || 0),
          worldBounds: record.presentationTruth?.worldBounds || null,
          truth: record.presentationTruth,
          failureReason: record.failureReason,
          attempts: freeze([...record.assetAttempts])
        })))
      });
    },
    dispose() {
      try { if (observer) scene.onPointerObservable?.remove?.(observer); } catch {}
      for (const record of records) {
        record.disposed = true;
        try { record.activeAnimation?.stop?.(); } catch {}
        try { record.container?.dispose?.(); } catch {}
      }
      for (const mat of materials) try { mat.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}
