/** W795B — bounded Storm Sector mission markers and explicit return terminal. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS, EON_EXPANSE_W792B_STORM_SECTOR_RETURN } from '../w792/eon-expanse-w792b-storm-sector-layout.js';
import { deriveEonExpanseW795AStormMissionView } from './eon-expanse-w795a-storm-sector-mission-runtime.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W795B_STORM_INTERACTION_SCHEMA = 'eon.expanse.storm-sector.interactions.w795b.v1';

function makeMaterial(scene, name, hex, intensity = 0.5, alpha = 1) {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(hex).scale(0.3);
  material.emissiveColor = Color3.FromHexString(hex).scale(intensity);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  return material;
}

function targetId(metadata = {}) {
  return [metadata.action, metadata.anchorId, metadata.activationId, metadata.expectedToken].filter(Boolean).join(':');
}

function worldPosition(mesh) {
  const position = mesh.getAbsolutePosition?.() || mesh.absolutePosition || mesh.position || {};
  return freeze({ x: Number(position.x || 0), y: Number(position.y || 0) + 1, z: Number(position.z || 0) });
}

export function mountEonExpanseW795BStormSectorInteractionPresenter({ scene, parent = null, reducedMotion = false, onInteract = null } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w795b-storm-sector-interaction-root', scene);
  if (parent) root.parent = parent;
  root.setEnabled?.(false);
  root.metadata = freeze({ kind: 'storm-sector-interaction-root', regionId: 'storm-sector', canonicalScene: true });

  const materials = freeze({
    mission: makeMaterial(scene, 'w795b-storm-mission-material', '#2cbcff', 0.72),
    missionWarm: makeMaterial(scene, 'w795b-storm-mission-warm-material', '#ffbc62', 0.68),
    return: makeMaterial(scene, 'w795b-storm-return-material', '#8d7dff', 0.76),
    hit: makeMaterial(scene, 'w795b-storm-hit-material', '#2cbcff', 0.05, 0.03)
  });
  const missionNodes = new Map();
  const pickMeshes = [];
  let missionState = null;
  let activationId = '';
  let packageDigest = '';
  let active = false;
  let disposed = false;
  let revision = 0;

  for (const anchor of EON_EXPANSE_W792B_STORM_SECTOR_MISSION_ANCHORS) {
    const node = new TransformNode(`w795b-${anchor.id}-root`, scene);
    node.parent = root;
    node.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
    const base = MeshBuilder.CreateCylinder(`w795b-${anchor.id}-base`, { diameterTop: 1.6, diameterBottom: 2.1, height: 0.28, tessellation: 32 }, scene);
    base.parent = node; base.position.y = -0.12; base.material = materials.mission; base.checkCollisions = false; base.isPickable = false;
    base.metadata = freeze({ kind: 'storm-sector-contract-marker', regionId: 'storm-sector', anchorId: anchor.id, finishedHero: false, developmentProxy: false, interactive: false });
    const ring = MeshBuilder.CreateTorus(`w795b-${anchor.id}-ring`, { diameter: 1.35, thickness: 0.08, tessellation: 40 }, scene);
    ring.parent = node; ring.position.y = 0.18; ring.rotation.x = Math.PI / 2; ring.material = materials.missionWarm; ring.checkCollisions = false; ring.isPickable = false;
    const hit = MeshBuilder.CreateCylinder(`w795b-${anchor.id}-hit`, { diameter: 2.8, height: 2.2, tessellation: 20 }, scene);
    hit.parent = node; hit.position.y = 0.8; hit.material = materials.hit; hit.visibility = 0.03; hit.checkCollisions = false; hit.isPickable = false;
    node.setEnabled?.(false);
    missionNodes.set(anchor.id, freeze({ anchor, node, base, ring, hit }));
    pickMeshes.push(hit);
  }

  const returnRoot = new TransformNode('w795b-storm-sector-return-root', scene);
  returnRoot.parent = root;
  returnRoot.position.set(EON_EXPANSE_W792B_STORM_SECTOR_RETURN.x, EON_EXPANSE_W792B_STORM_SECTOR_RETURN.y, EON_EXPANSE_W792B_STORM_SECTOR_RETURN.z);
  const returnBase = MeshBuilder.CreateCylinder('w795b-storm-sector-return-base', { diameterTop: 2.2, diameterBottom: 2.8, height: 0.34, tessellation: 40 }, scene);
  returnBase.parent = returnRoot; returnBase.position.y = -0.15; returnBase.material = materials.return; returnBase.checkCollisions = false; returnBase.isPickable = false;
  returnBase.metadata = freeze({ kind: 'storm-sector-return-connector', regionId: 'storm-sector', finishedHero: false, developmentProxy: false });
  const returnRing = MeshBuilder.CreateTorus('w795b-storm-sector-return-ring', { diameter: 2.0, thickness: 0.1, tessellation: 48 }, scene);
  returnRing.parent = returnRoot; returnRing.position.y = 0.22; returnRing.rotation.x = Math.PI / 2; returnRing.material = materials.return; returnRing.isPickable = false; returnRing.checkCollisions = false;
  const returnHit = MeshBuilder.CreateCylinder('w795b-storm-sector-return-hit', { diameter: 4.2, height: 2.4, tessellation: 24 }, scene);
  returnHit.parent = returnRoot; returnHit.position.y = 0.9; returnHit.material = materials.hit; returnHit.visibility = 0.03; returnHit.checkCollisions = false; returnHit.isPickable = false;
  pickMeshes.push(returnHit);

  const apply = ({ regionActive = false, state = null, expectedActivationId = '', expectedPackageDigest = '' } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'storm-interaction-presenter-disposed' });
    active = regionActive === true && Boolean(expectedActivationId) && /^[a-f0-9]{64}$/i.test(String(expectedPackageDigest || ''));
    missionState = state || null;
    activationId = active ? String(expectedActivationId) : '';
    packageDigest = active ? String(expectedPackageDigest).toLowerCase() : '';
    revision += 1;
    root.setEnabled?.(active);
    const view = deriveEonExpanseW795AStormMissionView(missionState);
    const next = active ? view.nextObjective : null;
    for (const [anchorId, entry] of missionNodes) {
      const ownsObjective = next && entry.anchor.familyId === next.missionId;
      entry.node.setEnabled?.(Boolean(ownsObjective));
      entry.hit.isPickable = Boolean(ownsObjective);
      entry.hit.metadata = ownsObjective ? freeze({
        kind: 'storm-sector-mission-anchor', action: next.action, label: next.label, objective: next.objective,
        anchorId, missionId: next.missionId, objectiveId: next.id, zoneId: next.zoneId,
        activationId, packageDigest, expectedToken: `${activationId}:${next.action}:${view.completedObjectiveCount}`,
        interactive: true, explicitUserActionRequired: true, grantsXp: false, automaticProgression: false
      }) : null;
    }
    returnRoot.setEnabled?.(active);
    returnHit.isPickable = active;
    returnHit.metadata = active ? freeze({ kind: 'storm-sector-return-gateway', action: 'return-signal-frontier', label: 'Return to Signal Frontier', regionId: 'storm-sector', gatewayId: 'future-gateway-storm-sector', activationId, packageDigest, expectedToken: `${activationId}:return:${revision}`, interactive: true, grantsXp: false, automaticTravel: false }) : null;
    return freeze({ ok: true, active, nextObjective: next, completedObjectiveCount: view.completedObjectiveCount, regionCompleted: view.regionCompleted, activationId, packageDigest });
  };

  const getInteractionCandidates = (position = {}, { maxDistance = 8 } = {}) => {
    if (!active || root.isEnabled?.() !== true) return freeze([]);
    const x = Number(position.x || 0); const z = Number(position.z || 0);
    const rows = [];
    for (const mesh of pickMeshes) {
      const metadata = mesh.metadata || {};
      if (!metadata.action || mesh.isPickable !== true || mesh.isEnabled?.() === false) continue;
      const world = worldPosition(mesh);
      const distance = Math.hypot(world.x - x, world.z - z);
      if (distance > Math.max(1, Number(maxDistance) || 8)) continue;
      rows.push(freeze({ targetId: targetId(metadata), mesh, meshName: mesh.name, metadata, world, distance, visible: true, pickable: true, enabled: true }));
    }
    return freeze(rows.sort((a, b) => a.distance - b.distance));
  };

  const dispatch = (metadata = {}, { explicitUserAction = false, expectedTargetId = '', source = 'storm-sector-interaction' } = {}) => {
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    if (!active) return freeze({ ok: false, reason: 'storm-sector-not-active' });
    const current = getInteractionCandidates(metadata.world || {}, { maxDistance: Number.POSITIVE_INFINITY }).find((candidate) => candidate.metadata?.action === metadata.action && candidate.metadata?.expectedToken === metadata.expectedToken) || null;
    const currentTargetId = current ? targetId(current.metadata) : targetId(metadata);
    if (expectedTargetId && expectedTargetId !== currentTargetId) return freeze({ ok: false, reason: 'storm-sector-interaction-target-changed', expectedTargetId, currentTargetId });
    const result = onInteract?.(freeze({ ...metadata, source, explicitUserAction: true })) || freeze({ ok: false, reason: 'storm-sector-interaction-handler-unavailable' });
    return result?.ok === false ? freeze({ ...result, action: metadata.action || '' }) : freeze({ ok: true, action: metadata.action || '', result });
  };

  const handlePointer = (event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK || !event?.pickInfo?.hit) return;
    const mesh = event.pickInfo.pickedMesh;
    if (!mesh?.metadata?.action) return;
    dispatch(mesh.metadata, { explicitUserAction: true, expectedTargetId: targetId(mesh.metadata), source: mesh.name || 'storm-sector-pointer' });
  };
  const pointerObserver = scene.onPointerObservable?.add?.(handlePointer);

  return freeze({
    ok: true, schema: EON_EXPANSE_W795B_STORM_INTERACTION_SCHEMA, root, apply,
    getInteractionCandidates,
    interactNearest(position = {}, { maxDistance = 5.2, explicitUserAction = false, expectedTargetId = '', source = 'storm-sector-proximity' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const candidate = getInteractionCandidates(position, { maxDistance })[0] || null;
      if (!candidate) return freeze({ ok: false, reason: 'no-nearby-storm-sector-interaction' });
      if (expectedTargetId && expectedTargetId !== candidate.targetId) return freeze({ ok: false, reason: 'storm-sector-interaction-target-changed', expectedTargetId, currentTargetId: candidate.targetId });
      const result = onInteract?.(freeze({ ...candidate.metadata, source: `${source}:${candidate.meshName}`, explicitUserAction: true })) || freeze({ ok: false, reason: 'storm-sector-interaction-handler-unavailable' });
      return freeze({ ...result, targetId: candidate.targetId, distance: candidate.distance, label: candidate.metadata.label || '' });
    },
    update(seconds = 0) {
      if (active && !reducedMotion) {
        for (const entry of missionNodes.values()) if (entry.node.isEnabled?.()) entry.ring.rotation.z = Number(seconds || 0) * 0.65;
        returnRing.rotation.z = Number(seconds || 0) * 0.24;
      }
      return freeze({ ok: true, active });
    },
    getSummary() {
      const view = deriveEonExpanseW795AStormMissionView(missionState);
      return freeze({ schema: EON_EXPANSE_W795B_STORM_INTERACTION_SCHEMA, active, activationId, packageDigest, nextObjectiveAction: view.nextObjective?.action || '', completedObjectiveCount: view.completedObjectiveCount, totalObjectiveCount: view.totalObjectiveCount, regionCompleted: view.regionCompleted, missionMarkerCount: [...missionNodes.values()].filter((entry) => entry.node.isEnabled?.()).length, returnInteractive: returnHit.isPickable === true, developmentHeroProxyCount: 0, grantsXp: false, automaticProgression: false, privateContentStored: false, oneCanonicalScene: true });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true; active = false;
      try { if (pointerObserver) scene.onPointerObservable?.remove?.(pointerObserver); } catch {}
      for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W795B_STORM_INTERACTION_SCHEMA, mountEonExpanseW795BStormSectorInteractionPresenter });
