/** W797B — bounded Storm Sector Transit node symbols in the canonical scene. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { EON_EXPANSE_W797A_STORM_TRANSIT_NODES, deriveEonExpanseW797AStormTransitView } from './eon-expanse-w797a-storm-sector-transit.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W797B_STORM_TRANSIT_PRESENTER_SCHEMA = 'eon.expanse.storm-sector.transit-presenter.w797b.v1';

export function mountEonExpanseW797BStormTransitPresenter({ scene, parent = null, reducedMotion = false, onInteract = null } = {}) {
  if (!scene || !MeshBuilder || !TransformNode) return freeze({ ok: false, reason: 'storm-transit-presenter-scene-required' });
  const root = new TransformNode('w797b-storm-sector-transit-root', scene);
  if (parent) root.parent = parent;
  root.setEnabled(false);
  const nodes = new Map();
  let active = false;
  let activationId = '';
  let packageDigest = '';
  let view = deriveEonExpanseW797AStormTransitView();
  let disposed = false;

  const material = (id, color) => {
    const value = new StandardMaterial(`w797b-${id}-material`, scene);
    value.diffuseColor = color.scale(0.16);
    value.emissiveColor = color;
    value.alpha = 0.82;
    value.disableLighting = false;
    return value;
  };

  for (const entry of EON_EXPANSE_W797A_STORM_TRANSIT_NODES) {
    const anchor = new TransformNode(`w797b-${entry.id}-anchor`, scene);
    anchor.parent = root;
    anchor.position.set(entry.position.x, entry.position.y, entry.position.z);
    const ring = MeshBuilder.CreateTorus(`w797b-${entry.id}-ring`, { diameter: 2.4, thickness: 0.12, tessellation: 28 }, scene);
    ring.parent = anchor;
    ring.rotation.x = Math.PI / 2;
    ring.isPickable = true;
    const core = MeshBuilder.CreateCylinder(`w797b-${entry.id}-core`, { diameter: 0.72, height: 0.16, tessellation: 24 }, scene);
    core.parent = anchor;
    core.position.y = 0.08;
    core.isPickable = true;
    const availableMaterial = material(`${entry.id}-available`, Color3.FromHexString('#45D7FF'));
    const lockedMaterial = material(`${entry.id}-locked`, Color3.FromHexString('#556273'));
    ring.material = availableMaterial;
    core.material = availableMaterial;
    nodes.set(entry.id, { entry, anchor, ring, core, availableMaterial, lockedMaterial, unlocked: false, token: '' });
  }

  const apply = ({ regionActive = false, missionState = null, expectedActivationId = '', expectedPackageDigest = '', journeyState = null, currentPosition = null } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'storm-transit-presenter-disposed' });
    const identityOk = regionActive === true && Boolean(expectedActivationId) && String(expectedPackageDigest || '').toLowerCase() === EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST;
    if (!identityOk) {
      active = false;
      activationId = '';
      packageDigest = '';
      root.setEnabled(false);
      return freeze({ ok: true, active: false, grantsXp: false, automaticTravel: false });
    }
    active = true;
    activationId = String(expectedActivationId);
    packageDigest = String(expectedPackageDigest).toLowerCase();
    view = deriveEonExpanseW797AStormTransitView({ missionState, currentPosition, journeyState });
    root.setEnabled(true);
    for (const nodeView of view.nodes) {
      const state = nodes.get(nodeView.id);
      if (!state) continue;
      state.unlocked = nodeView.unlocked;
      state.token = `storm-transit:${activationId}:${packageDigest.slice(0, 12)}:${nodeView.id}:${nodeView.unlocked ? 'open' : 'locked'}`;
      state.ring.material = nodeView.unlocked ? state.availableMaterial : state.lockedMaterial;
      state.core.material = nodeView.unlocked ? state.availableMaterial : state.lockedMaterial;
      const metadata = freeze({
        kind: 'storm-sector-transit-node',
        action: 'storm-transit-start',
        nodeId: nodeView.id,
        label: nodeView.unlocked ? `Transit to ${nodeView.label}` : `${nodeView.label} locked`,
        activationId,
        packageDigest,
        expectedToken: state.token,
        interactive: nodeView.unlocked,
        grantsXp: false,
        automaticTravel: false,
        developmentHeroProxy: false,
        interactionSymbol: true
      });
      state.ring.metadata = metadata;
      state.core.metadata = metadata;
      state.ring.isPickable = nodeView.unlocked;
      state.core.isPickable = nodeView.unlocked;
    }
    return freeze({ ok: true, active: true, unlockedNodeCount: view.unlockedNodeCount, totalNodeCount: view.totalNodeCount, grantsXp: false, automaticTravel: false });
  };

  const interact = (metadata = {}, source = 'storm-transit') => {
    if (!active) return freeze({ ok: false, reason: 'storm-sector-not-active' });
    const state = nodes.get(String(metadata.nodeId || ''));
    if (!state || !state.unlocked) return freeze({ ok: false, reason: 'storm-transit-node-locked' });
    if (metadata.activationId !== activationId || metadata.packageDigest !== packageDigest || metadata.expectedToken !== state.token) return freeze({ ok: false, reason: 'storm-transit-node-identity-stale' });
    const result = onInteract?.(freeze({ ...metadata, source, explicitUserAction: true })) || freeze({ ok: true, nodeId: state.entry.id });
    return freeze({ ...result, nodeId: state.entry.id, label: state.entry.label, grantsXp: false, automaticTravel: false });
  };

  const getCandidates = (position = {}, maxDistance = 6.2) => {
    if (!active) return freeze([]);
    const x = Number(position.x || 0);
    const z = Number(position.z || 0);
    const rows = [];
    for (const state of nodes.values()) {
      if (!state.unlocked) continue;
      const distance = Math.hypot(state.entry.position.x - x, state.entry.position.z - z);
      if (distance > maxDistance) continue;
      const metadata = state.ring.metadata;
      rows.push(freeze({
        targetId: `storm-transit:${state.entry.id}:${activationId}`,
        meshName: state.ring.name,
        metadata,
        world: state.entry.position,
        distance,
        visible: true,
        pickable: true,
        enabled: true
      }));
    }
    return freeze(rows.sort((a, b) => a.distance - b.distance));
  };

  const pointerObserver = scene.onPointerObservable?.add?.((event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK || !event?.pickInfo?.hit) return;
    const metadata = event.pickInfo.pickedMesh?.metadata;
    if (metadata?.kind === 'storm-sector-transit-node') interact(metadata, event.pickInfo.pickedMesh?.name || 'storm-transit-pointer');
  });

  return freeze({
    ok: true,
    schema: EON_EXPANSE_W797B_STORM_TRANSIT_PRESENTER_SCHEMA,
    root,
    apply,
    getInteractionCandidates(position = {}, options = {}) { return getCandidates(position, Math.max(1, Number(options.maxDistance || 6.2))); },
    interactNearest(position = {}, options = {}) {
      if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const candidate = getCandidates(position, Math.max(1, Number(options.maxDistance || 5.2)))[0] || null;
      if (!candidate) return freeze({ ok: false, reason: 'no-nearby-storm-transit-node' });
      if (options.expectedTargetId && options.expectedTargetId !== candidate.targetId) return freeze({ ok: false, reason: 'storm-transit-target-changed', expectedTargetId: options.expectedTargetId, currentTargetId: candidate.targetId });
      return freeze({ ...interact(candidate.metadata, `${options.source || 'storm-transit-proximity'}:${candidate.meshName}`), targetId: candidate.targetId, distance: candidate.distance });
    },
    update(seconds = 0, journeyState = null) {
      if (!active) return freeze({ ok: true, active: false });
      const time = Number(seconds || 0);
      for (const state of nodes.values()) {
        if (!state.unlocked) continue;
        const selected = journeyState?.status === 'active' && journeyState.destinationNodeId === state.entry.id;
        const pulse = reducedMotion ? 1 : 1 + Math.sin(time * (selected ? 5.2 : 2.4)) * (selected ? 0.16 : 0.06);
        state.anchor.scaling.setAll(pulse);
        state.ring.rotation.z = reducedMotion ? 0 : time * (selected ? 1.4 : 0.45);
      }
      return freeze({ ok: true, active: true });
    },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W797B_STORM_TRANSIT_PRESENTER_SCHEMA,
        active,
        activationId,
        packageDigest,
        unlockedNodeCount: view.unlockedNodeCount,
        totalNodeCount: view.totalNodeCount,
        developmentHeroProxyCount: 0,
        interactionSymbolCount: nodes.size,
        grantsXp: false,
        automaticTravel: false,
        ownsEngine: false,
        ownsScene: false,
        ownsRenderLoop: false
      });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      active = false;
      try { if (pointerObserver) scene.onPointerObservable?.remove?.(pointerObserver); } catch {}
      for (const state of nodes.values()) {
        try { state.availableMaterial.dispose?.(); } catch {}
        try { state.lockedMaterial.dispose?.(); } catch {}
      }
      nodes.clear();
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W797B_STORM_TRANSIT_PRESENTER_SCHEMA, mountEonExpanseW797BStormTransitPresenter });
