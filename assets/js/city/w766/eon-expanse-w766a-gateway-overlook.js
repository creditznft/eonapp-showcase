import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { mountEonExpanseW766BSignalFrontier } from './eon-expanse-w766b-signal-frontier.js';
import { mountEonExpanseW766BHeroAssets } from './eon-expanse-w766b-hero-assets.js';
import { mountEonExpanseW766DNpcs } from './eon-expanse-w766d-npc-transit.js';
import { mountEonExpanseW766FActivityAnchors } from './eon-expanse-w766f-activity-anchors.js';
import { deriveEonExpanseW766WorldProgress, EON_EXPANSE_W766_ZONES } from './eon-expanse-w766-region-contract.js';
import { buildEonExpanseW767DAssetTruthReport } from './eon-expanse-w767d-asset-diagnostics.js';
import { EON_EXPANSE_W767A_RESCUE_POSE, EON_EXPANSE_W767A_SIGNAL_CORE_POSE } from './eon-expanse-w767a-companion-continuity.js';
import { deriveEonExpanseW767LCompanionDockPresentation, EON_EXPANSE_W767L_DOCK_POSE } from './eon-expanse-w767l-companion-dock.js';
import { getEonExpanseW767BInteractionTargetId } from './eon-expanse-w767b-guidance-director.js';
import { mountEonExpanseW771CEnvironmentKitPresenter } from '../w771/eon-expanse-w771c-zone-environment-kit-presenter.js';
import { mountEonCityRt92SignalDeepArt } from '../rt92/signal/eon-city-rt92-signal-deep-art.js';
import { mountEonCityRt92EnvironmentalLifeArt } from '../rt92/eon-city-rt92-environmental-life-art.js';
import { mountEonCityRt92CinematicVfxArt } from '../rt92/eon-city-rt92-cinematic-vfx-art.js';
import { mountEonCityL95SignalFrontierOuterLandscape } from '../l95/eon-city-l95-signal-frontier-outer-landscape.js';
import { mountEonExpanseW774BProductiveTransformationPresenter } from '../w774/eon-expanse-w774b-productive-transformation-presenter.js';
import { mountEonExpanseW778BSideTransformationPresenter } from '../w778/eon-expanse-w778b-side-transformation-presenter.js';
import { mountEonExpanseW794BStormSectorGatewayPresenter } from '../w794/eon-expanse-w794b-storm-sector-gateway-presenter.js';

const freeze = (value) => Object.freeze(value);
const color = (value, fallback) => { try { return Color3.FromHexString(value); } catch { return Color3.FromHexString(fallback); } };
const material = (scene, name, diffuse, emissive = diffuse, intensity = 0.2) => {
  const next = new StandardMaterial(name, scene);
  next.diffuseColor = color(diffuse, '#111111');
  next.emissiveColor = color(emissive, diffuse).scale(intensity);
  next.specularColor = color('#11151d', '#11151d');
  return next;
};

export const EON_EXPANSE_W766A_GATEWAY_SCHEMA = 'eon.city.expanse.gateway-overlook.w767l.v5';

export function mountEonExpanseW766AGatewayOverlook({
  scene,
  quality = 'balanced',
  reducedMotion = false,
  worldSeed = 1,
  initialMilestones = [],
  initialDiscovered = ['gateway-overlook'],
  missionLedger = null,
  initialProgress = null,
  initialLivingContent = {},
  initialFutureRegionActivation = null,
  onInteract = null
} = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w766a-expanse-gateway-overlook-root', scene);
  root.setEnabled(false);
  root.metadata = freeze({ schema: EON_EXPANSE_W766A_GATEWAY_SCHEMA, worldMode: 'EXPANSE_ACTIVE', canonicalSceneOnly: true });
  // L95: keep Signal Frontier as one disable-able region beneath the Expanse
  // umbrella. My Frontier can remain mounted/reused without rendering Signal
  // geometry 170m away, and Storm can own its own certified presenter.
  const signalRoot = new TransformNode('w766a-signal-frontier-region-root', scene);
  signalRoot.parent = root;
  signalRoot.setEnabled(false);
  signalRoot.metadata = freeze({ kind: 'signal-frontier-region-root', canonicalSceneOnly: true, regionId: 'signal-frontier' });
  const terrain = material(scene, 'w766a-expanse-terrain', '#090d17', '#101d36', 0.12);
  const circuit = material(scene, 'w766a-expanse-circuit', '#163853', '#25b6ff', 0.72);
  const signal = material(scene, 'w766a-expanse-signal', '#34235d', '#9d72ff', 0.82);
  const warm = material(scene, 'w766a-expanse-warm', '#4b351c', '#ffbc62', 0.72);
  const glass = material(scene, 'w766a-expanse-glass', '#172333', '#3277a8', 0.18);
  glass.alpha = 0.42;
  glass.backFaceCulling = false;
  const materials = [terrain, circuit, signal, warm, glass];
  // L95: Signal-only scene content is mounted on first explicit Signal entry,
  // not while the player is still using Command Hub. This keeps the gold-master
  // Hub from paying hidden scene-construction cost for an inactive world.
  let cinematicEnvironment = null;
  let rt92SignalDeepArt = null;
  let rt92EnvironmentalLife = null;
  let rt92CinematicVfx = null;
  let signalLandscape = null;
  const productiveTransformations = mountEonExpanseW774BProductiveTransformationPresenter({ scene, parent: signalRoot, quality, reducedMotion, initialState: initialLivingContent });
  if (!productiveTransformations?.ok) return freeze({ ok: false, reason: `productive-transformation-presenter-failed:${productiveTransformations?.reason || 'unknown'}` });
  const sideTransformations = mountEonExpanseW778BSideTransformationPresenter({ scene, parent: signalRoot, quality, reducedMotion, initialState: initialLivingContent });
  if (!sideTransformations?.ok) return freeze({ ok: false, reason: `side-transformation-presenter-failed:${sideTransformations?.reason || 'unknown'}` });
  const stormSectorGateway = mountEonExpanseW794BStormSectorGatewayPresenter({ scene, parent: signalRoot, reducedMotion });
  if (!stormSectorGateway?.ok) return freeze({ ok: false, reason: `storm-sector-gateway-presenter-failed:${stormSectorGateway?.reason || 'unknown'}` });
  let futureRegionActivation = initialFutureRegionActivation || null;
  stormSectorGateway.applyActivation?.(futureRegionActivation);
  const nodes = [];
  let frontier = null;
  let heroAssets = null;
  let npcRuntime = null;
  let activityAnchors = null;
  let livingContentState = initialLivingContent || {};
  let dynamicEventState = null;
  let lastUpdateAt = Date.now();
  let progress = initialProgress || deriveEonExpanseW766WorldProgress({ milestones: initialMilestones, missionLedger });
  let companionState = null;
  let companionDockPresentation = deriveEonExpanseW767LCompanionDockPresentation();
  let authoredAssetReloadCount = 0;
  let lastAuthoredAssetReloadAt = 0;

  const add = (mesh, mat, position = {}, rotation = {}) => {
    mesh.parent = signalRoot;
    mesh.material = mat;
    mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
    mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
    mesh.isPickable = false;
    mesh.checkCollisions = true;
    nodes.push(mesh);
    return mesh;
  };
  const rescueRoot = new TransformNode('w767a-companion-rescue-relay-root', scene);
  rescueRoot.parent = signalRoot;
  rescueRoot.position.set(EON_EXPANSE_W767A_RESCUE_POSE.x, 0, EON_EXPANSE_W767A_RESCUE_POSE.z);
  rescueRoot.rotation.y = -0.32;
  const relayBase = MeshBuilder.CreateCylinder('w767a-companion-rescue-relay-base', { diameterTop: 1.1, diameterBottom: 1.65, height: 0.7, tessellation: 24 }, scene);
  relayBase.parent = rescueRoot; relayBase.position.y = 0.35; relayBase.material = terrain; relayBase.checkCollisions = true; nodes.push(relayBase);
  const relayMast = MeshBuilder.CreateCylinder('w767a-companion-rescue-relay-mast', { diameter: 0.24, height: 2.1, tessellation: 18 }, scene);
  relayMast.parent = rescueRoot; relayMast.position.set(-0.42, 1.45, 0.18); relayMast.rotation.z = -0.3; relayMast.material = circuit; relayMast.checkCollisions = false; nodes.push(relayMast);
  const relayHalo = MeshBuilder.CreateTorus('w767a-companion-rescue-relay-halo', { diameter: 1.45, thickness: 0.08, tessellation: 36 }, scene);
  relayHalo.parent = rescueRoot; relayHalo.position.set(-0.72, 2.18, 0.18); relayHalo.rotation.x = Math.PI / 2; relayHalo.material = signal; relayHalo.checkCollisions = false; nodes.push(relayHalo);
  const scanProxy = MeshBuilder.CreateSphere('w767a-dormant-eonbot-scan-proxy', { diameter: 1.8, segments: 12 }, scene);
  scanProxy.parent = signalRoot; scanProxy.position.set(EON_EXPANSE_W767A_RESCUE_POSE.x, EON_EXPANSE_W767A_RESCUE_POSE.y, EON_EXPANSE_W767A_RESCUE_POSE.z); scanProxy.material = glass; scanProxy.visibility = 0.035; scanProxy.isPickable = true; scanProxy.checkCollisions = false; nodes.push(scanProxy);
  const signalCore = MeshBuilder.CreatePolyhedron('w767a-companion-signal-core', { type: 1, size: 0.52 }, scene);
  signalCore.parent = signalRoot; signalCore.position.set(EON_EXPANSE_W767A_SIGNAL_CORE_POSE.x, EON_EXPANSE_W767A_SIGNAL_CORE_POSE.y, EON_EXPANSE_W767A_SIGNAL_CORE_POSE.z); signalCore.material = warm; signalCore.isPickable = true; signalCore.checkCollisions = false; nodes.push(signalCore);
  rescueRoot.setEnabled(false); scanProxy.setEnabled(false); signalCore.setEnabled(false);
  const companionDockRoot = new TransformNode('w767l-eonbot-dock-root', scene);
  companionDockRoot.parent = signalRoot;
  companionDockRoot.position.set(EON_EXPANSE_W767L_DOCK_POSE.x, EON_EXPANSE_W767L_DOCK_POSE.y, EON_EXPANSE_W767L_DOCK_POSE.z);
  companionDockRoot.rotation.y = EON_EXPANSE_W767L_DOCK_POSE.heading;
  const companionDockBase = MeshBuilder.CreateCylinder('w767l-eonbot-dock-base', { diameterTop: 1.35, diameterBottom: 1.75, height: 0.22, tessellation: 36 }, scene);
  companionDockBase.parent = companionDockRoot; companionDockBase.position.y = 0.02; companionDockBase.material = terrain; companionDockBase.checkCollisions = true; nodes.push(companionDockBase);
  const companionDockRing = MeshBuilder.CreateTorus('w767l-eonbot-dock-ring', { diameter: 1.18, thickness: 0.075, tessellation: 48 }, scene);
  companionDockRing.parent = companionDockRoot; companionDockRing.position.y = 0.18; companionDockRing.rotation.x = Math.PI / 2; companionDockRing.material = circuit; companionDockRing.checkCollisions = false; nodes.push(companionDockRing);
  const companionDockCore = MeshBuilder.CreateCylinder('w767l-eonbot-dock-core', { diameter: 0.42, height: 0.38, tessellation: 24 }, scene);
  companionDockCore.parent = companionDockRoot; companionDockCore.position.y = 0.28; companionDockCore.material = signal; companionDockCore.checkCollisions = false; nodes.push(companionDockCore);
  const companionDockHit = MeshBuilder.CreateCylinder('w767l-eonbot-dock-hit-proxy', { diameter: 2.15, height: 1.35, tessellation: 20 }, scene);
  companionDockHit.parent = companionDockRoot; companionDockHit.position.y = 0.62; companionDockHit.material = glass; companionDockHit.visibility = 0.025; companionDockHit.checkCollisions = false; nodes.push(companionDockHit);
  companionDockRoot.setEnabled(false);
  const applyCompanionDockState = ({ guideActive = false, transitActive = false } = {}) => {
    companionDockPresentation = deriveEonExpanseW767LCompanionDockPresentation({
      expanseActive: companionState?.expanseActive === true,
      bonded: companionState?.bonded === true,
      transitActive: transitActive || companionState?.movementMode === 'transit-formation',
      guideActive
    });
    companionDockRoot.setEnabled(companionDockPresentation.visible);
    companionDockHit.isPickable = companionDockPresentation.interactive;
    companionDockHit.metadata = companionDockPresentation.interactive
      ? freeze({ kind: 'expanse-companion-dock', action: 'dock-eonbot', label: 'Recharge EONBOT', interactive: true, dockId: 'w767l-companion-dock' })
      : freeze({ kind: 'expanse-companion-dock', interactive: false, dockId: 'w767l-companion-dock' });
    return companionDockPresentation;
  };
  const setRescueAction = (mesh, action = '', label = '') => {
    mesh.isPickable = Boolean(action);
    mesh.metadata = action ? freeze({ kind: 'w767a-companion-rescue', action, label, interactive: true }) : freeze({ kind: 'w767a-companion-rescue', interactive: false });
  };
  const applyCompanionState = (nextState = null, runtimeState = {}) => {
    companionState = nextState || companionState;
    const rescueVisible = Boolean(companionState?.rescuePresentationVisible);
    rescueRoot.setEnabled(rescueVisible);
    scanProxy.setEnabled(rescueVisible && ['scan-dormant-eonbot', 'restore-companion-link'].includes(companionState?.nextAction));
    signalCore.setEnabled(rescueVisible && companionState?.nextAction === 'recover-companion-signal-core');
    setRescueAction(scanProxy, scanProxy.isEnabled?.() ? companionState.nextAction : '', companionState?.nextAction === 'restore-companion-link' ? 'Restore EONBOT link' : 'Scan dormant EONBOT');
    setRescueAction(signalCore, signalCore.isEnabled?.() ? 'recover-companion-signal-core' : '', 'Recover signal core');
    const dock = applyCompanionDockState(runtimeState);
    cinematicEnvironment?.applyProgress?.({ ...progress, companionBonded: companionState?.bonded === true });
    rt92SignalDeepArt?.applyProgress?.({ ...progress, companionBonded: companionState?.bonded === true });
    return freeze({ ok: true, phase: companionState?.phase || 'unknown', rescueVisible, nextAction: companionState?.nextAction || '', dock });
  };
  add(MeshBuilder.CreateCylinder('w766a-overlook-platform', { diameter: 29, height: 0.5, tessellation: 72 }, scene), terrain, { y: -0.25 });
  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const trace = add(MeshBuilder.CreateBox(`w766a-overlook-trace-${index}`, { width: 0.12, height: 0.04, depth: 12 }, scene), index % 3 === 0 ? warm : circuit, { x: Math.sin(angle) * 5.6, y: 0.04, z: Math.cos(angle) * 5.6 }, { y: angle });
    trace.checkCollisions = false;
  }
  const gate = add(MeshBuilder.CreateTorus('w766a-return-gate', { diameter: 7.2, thickness: 0.3, tessellation: 72 }, scene), signal, { y: 3.7, z: 10 }, { y: Math.PI / 2 });
  gate.isPickable = true;
  gate.checkCollisions = false;
  gate.metadata = freeze({ kind: 'w766a-expanse-return-gate', action: 'return-to-command-hub', label: 'Return to Command Hub', interactive: true });
  const returnProxy = add(MeshBuilder.CreateBox('w766a-return-gate-hit-proxy', { width: 5.8, height: 5.8, depth: 0.5 }, scene), glass, { y: 3.1, z: 10 });
  returnProxy.isPickable = true;
  returnProxy.checkCollisions = false;
  returnProxy.visibility = 0.03;
  returnProxy.metadata = gate.metadata;
  for (let index = 0; index < (quality === 'lite' ? 10 : quality === 'cinematic' ? 32 : 20); index += 1) {
    const distance = 56 + (index % 6) * 15;
    const angle = -1.35 + (index / Math.max(1, (quality === 'lite' ? 9 : quality === 'cinematic' ? 31 : 19))) * 2.7;
    const height = 7 + ((index * 11) % 18);
    const tower = add(MeshBuilder.CreateBox(`w766a-horizon-tower-${index}`, { width: 4 + index % 3, height, depth: 4 + (index + 1) % 3 }, scene), index % 4 === 0 ? signal : terrain, { x: Math.sin(angle) * distance, y: height / 2 - 0.6, z: -Math.cos(angle) * distance - 14 });
    tower.checkCollisions = false;
  }
  const beacon = add(MeshBuilder.CreateCylinder('w766a-beacon-fields-silhouette', { diameterTop: 0.7, diameterBottom: 3.4, height: 18, tessellation: 32 }, scene), circuit, { x: -30, y: 9, z: -26 });
  beacon.checkCollisions = false;
  const archive = add(MeshBuilder.CreateBox('w766a-archive-ruins-silhouette', { width: 16, height: 9, depth: 9 }, scene), signal, { x: 20, y: 4.5, z: -30 });
  archive.checkCollisions = false;
  const vault = add(MeshBuilder.CreateCylinder('w766a-horizon-vault-silhouette', { diameter: 13, height: 6, tessellation: 48 }, scene), warm, { x: 4, y: 3, z: -62 });
  vault.checkCollisions = false;

  const mountDeferredSignalWorld = () => {
    if (frontier?.ok && cinematicEnvironment?.ok && rt92SignalDeepArt?.ok && rt92EnvironmentalLife?.ok && signalLandscape?.ok) return freeze({ ok: true, alreadyMounted: true });
    frontier = mountEonExpanseW766BSignalFrontier({
      scene,
      parent: signalRoot,
      quality,
      reducedMotion,
      worldSeed,
      initialMilestones,
      initialDiscovered,
      missionLedger,
      initialProgress: progress,
      onDiscover: (discovery) => onInteract?.(freeze({ action: 'discover-zone', discovery })),
      onAction: (event) => onInteract?.(event)
    });
    if (!frontier?.ok) {
      const reason = frontier?.reason || 'unknown';
      frontier = null;
      return freeze({ ok: false, reason: `signal-frontier-mount-failed:${reason}` });
    }
    cinematicEnvironment = mountEonExpanseW771CEnvironmentKitPresenter({ scene, parent: signalRoot, quality, reducedMotion, worldSeed });
    if (!cinematicEnvironment?.ok) {
      const reason = cinematicEnvironment?.reason || 'unknown';
      try { frontier?.dispose?.(); } catch {}
      frontier = null;
      cinematicEnvironment = null;
      return freeze({ ok: false, reason: `cinematic-environment-kit-failed:${reason}` });
    }
    rt92SignalDeepArt = mountEonCityRt92SignalDeepArt({ scene, parent: signalRoot, quality, reducedMotion });
    if (!rt92SignalDeepArt?.ok) {
      const reason = rt92SignalDeepArt?.reason || 'unknown';
      try { cinematicEnvironment?.dispose?.(); frontier?.dispose?.(); } catch {}
      rt92SignalDeepArt = null;
      cinematicEnvironment = null;
      frontier = null;
      return freeze({ ok: false, reason: `rt92-signal-deep-art-failed:${reason}` });
    }
    rt92EnvironmentalLife = mountEonCityRt92EnvironmentalLifeArt({ scene, parent: signalRoot, worldId: 'signal-frontier', quality, reducedMotion });
    if (!rt92EnvironmentalLife?.ok) {
      const reason = rt92EnvironmentalLife?.reason || 'unknown';
      try { rt92SignalDeepArt?.dispose?.(); cinematicEnvironment?.dispose?.(); frontier?.dispose?.(); } catch {}
      rt92EnvironmentalLife = null;
      rt92SignalDeepArt = null;
      cinematicEnvironment = null;
      frontier = null;
      return freeze({ ok: false, reason: `rt92-signal-environmental-life-failed:${reason}` });
    }
    rt92CinematicVfx = mountEonCityRt92CinematicVfxArt({ scene, parent: signalRoot, worldId: 'signal-frontier', quality, reducedMotion });
    if (!rt92CinematicVfx?.ok) {
      const reason = rt92CinematicVfx?.reason || 'unknown';
      try { rt92CinematicVfx?.dispose?.(); rt92EnvironmentalLife?.dispose?.(); rt92SignalDeepArt?.dispose?.(); cinematicEnvironment?.dispose?.(); frontier?.dispose?.(); } catch {}
      rt92CinematicVfx = null; rt92EnvironmentalLife = null; rt92SignalDeepArt = null; cinematicEnvironment = null; frontier = null;
      return freeze({ ok: false, reason: `rt92-signal-cinematic-vfx-failed:${reason}` });
    }
    signalLandscape = mountEonCityL95SignalFrontierOuterLandscape({ scene, parent: signalRoot, quality, worldSeed });
    if (!signalLandscape?.ok) {
      const reason = signalLandscape?.reason || 'unknown';
      try { rt92CinematicVfx?.dispose?.(); rt92EnvironmentalLife?.dispose?.(); rt92SignalDeepArt?.dispose?.(); cinematicEnvironment?.dispose?.(); frontier?.dispose?.(); } catch {}
      rt92CinematicVfx = null;
      rt92EnvironmentalLife = null;
      signalLandscape = null;
      rt92SignalDeepArt = null;
      cinematicEnvironment = null;
      frontier = null;
      return freeze({ ok: false, reason: `signal-frontier-outer-landscape-failed:${reason}` });
    }
    return freeze({ ok: true, alreadyMounted: false });
  };
  // Heavy GLB-backed hero and NPC assets are intentionally deferred until
  // explicit Expanse entry. This preserves the launch contract that the Hub
  // does not download Expanse assets before review/confirmation.
  const mountDeferredAssets = () => {
    if (heroAssets?.ok && npcRuntime?.ok && activityAnchors?.ok) return freeze({ ok: true, alreadyMounted: true });
    heroAssets = mountEonExpanseW766BHeroAssets({ scene, parent: signalRoot, quality });
    if (!heroAssets?.ok) {
      const reason = heroAssets?.reason || 'unknown';
      heroAssets = null;
      return freeze({ ok: false, reason: `hero-assets-mount-failed:${reason}` });
    }
    npcRuntime = mountEonExpanseW766DNpcs({ scene, parent: signalRoot, quality, onInteract: (event) => onInteract?.(event) });
    if (!npcRuntime?.ok) {
      const reason = npcRuntime?.reason || 'unknown';
      try { heroAssets?.dispose?.(); } catch {}
      heroAssets = null;
      npcRuntime = null;
      return freeze({ ok: false, reason: `npc-mount-failed:${reason}` });
    }
    activityAnchors = mountEonExpanseW766FActivityAnchors({ scene, parent: signalRoot, quality, initialState: livingContentState, onInteract: (event) => onInteract?.(event) });
    if (!activityAnchors?.ok) {
      const reason = activityAnchors?.reason || 'unknown';
      try { npcRuntime?.dispose?.(); heroAssets?.dispose?.(); } catch {}
      heroAssets = null;
      npcRuntime = null;
      activityAnchors = null;
      return freeze({ ok: false, reason: `activity-anchor-mount-failed:${reason}` });
    }
    return freeze({ ok: true, alreadyMounted: false });
  };
  const disposeDeferredAssets = () => {
    try { activityAnchors?.dispose?.(); } catch {}
    try { npcRuntime?.dispose?.(); } catch {}
    try { heroAssets?.dispose?.(); } catch {}
    activityAnchors = null;
    npcRuntime = null;
    heroAssets = null;
    return freeze({ ok: true });
  };
  const readInteractionPosition = (mesh) => {
    try {
      mesh.computeWorldMatrix?.(true);
      const box = mesh.getBoundingInfo?.().boundingBox;
      if (box?.centerWorld && box?.maximumWorld) return freeze({ x: box.centerWorld.x, y: box.maximumWorld.y + 0.42, z: box.centerWorld.z });
    } catch {}
    const absolute = mesh.getAbsolutePosition?.() || mesh.absolutePosition || mesh.position || {};
    return freeze({ x: Number(absolute.x || 0), y: Number(absolute.y || 0) + 0.8, z: Number(absolute.z || 0) });
  };
  const getInteractionCandidates = (position = {}, { maxDistance = 40 } = {}) => {
    if (root.isEnabled?.() !== true) return freeze([]);
    const playerX = Number(position.x || 0);
    const playerZ = Number(position.z || 0);
    const deduped = new Map();
    for (const mesh of root.getChildMeshes?.(false) || []) {
      const metadata = mesh?.metadata || {};
      if (!metadata.action || mesh.isPickable === false || mesh.isEnabled?.() === false || mesh.isVisible === false || Number(mesh.visibility ?? 1) <= 0) continue;
      const world = readInteractionPosition(mesh);
      const distance = Math.hypot(world.x - playerX, world.z - playerZ);
      if (!Number.isFinite(distance) || distance > Math.max(1, Number(maxDistance || 40))) continue;
      const targetId = getEonExpanseW767BInteractionTargetId(metadata, mesh.name);
      const candidate = freeze({ targetId, mesh, meshName: String(mesh.name || ''), metadata, world, distance, enabled: true, pickable: true, visible: true });
      const previous = deduped.get(targetId);
      if (!previous || candidate.distance < previous.distance) deduped.set(targetId, candidate);
    }
    return freeze([...deduped.values()].sort((a, b) => a.distance - b.distance));
  };
  const handleGatewayInteraction = (event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK || !event?.pickInfo?.hit) return freeze({ ok: false, reason: 'gateway-interaction-miss' });
    const picked = event.pickInfo.pickedMesh;
    const metadata = picked?.metadata || {};
    const action = metadata.action || '';
    if (action === 'return-to-command-hub') { onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true })); return freeze({ ok: true, action }); }
    if (['scan-dormant-eonbot', 'recover-companion-signal-core', 'restore-companion-link'].includes(action)) { onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true })); return freeze({ ok: true, action }); }
    if (action === 'dock-eonbot') { const result = onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true, dockId: metadata.dockId || '' })) || freeze({ ok: false, reason: 'companion-dock-handler-unavailable' }); return result?.ok === false ? freeze({ ...result, action }) : freeze({ ok: true, action, result }); }
    if (action === 'inspect-my-frontier-plot') { const result = onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true, plotId: metadata.plotId || '', expectedToken: metadata.expectedToken || '' })) || freeze({ ok: false, reason: 'my-frontier-inspection-handler-unavailable' }); return result?.ok === false ? freeze({ ...result, action }) : freeze({ ok: true, action, result }); }
    if (action === 'open-my-frontier-building-terminal') { const result = onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true, plotId: metadata.plotId || '', buildingId: metadata.buildingId || '', expectedTerminalToken: metadata.expectedTerminalToken || '', stationId: metadata.stationId || '', surface: metadata.surface || '', nativeRoute: metadata.nativeRoute || '' })) || freeze({ ok: false, reason: 'my-frontier-terminal-handler-unavailable' }); return result?.ok === false ? freeze({ ...result, action }) : freeze({ ok: true, action, result }); }
    if (action === 'inspect-my-frontier-resident-station') { const result = onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true, slotId: metadata.slotId || '', residentId: metadata.residentId || '', expectedToken: metadata.expectedToken || '' })) || freeze({ ok: false, reason: 'my-frontier-resident-inspection-handler-unavailable' }); return result?.ok === false ? freeze({ ...result, action }) : freeze({ ok: true, action, result }); }
    if (action === 'enter-storm-sector') { const result = onInteract?.(freeze({ action, source: picked.name, explicitUserAction: true, regionId: metadata.regionId || '', gatewayId: metadata.gatewayId || '', activationId: metadata.activationId || '', packageDigest: metadata.packageDigest || '' })) || freeze({ ok: false, reason: 'storm-sector-journey-handler-unavailable' }); return result?.ok === false ? freeze({ ...result, action }) : freeze({ ok: true, action, result }); }
    return freeze({ ok: false, reason: 'gateway-interaction-not-owned', action });
  };
  const dispatchInteraction = (candidate, { source = 'expanse-proximity', explicitUserAction = true } = {}) => {
    const metadata = candidate?.metadata || {};
    if (!metadata.action) return freeze({ ok: false, reason: 'interaction-action-required' });
    if (metadata.kind === 'w767a-companion-rescue' || metadata.kind === 'w766a-expanse-return-gate' || metadata.kind === 'expanse-companion-dock' || metadata.kind === 'expanse-my-frontier-plot' || metadata.kind === 'expanse-my-frontier-resident-station' || metadata.kind === 'future-region-authored-gateway') {
      return handleGatewayInteraction({ type: PointerEventTypes.POINTERPICK, pickInfo: { hit: true, pickedMesh: { metadata, name: source } } });
    }
    if (metadata.kind === 'expanse-npc') return npcRuntime?.interact?.(metadata, { source, explicitUserAction }) || freeze({ ok: false, reason: 'npc-runtime-unavailable' });
    if (metadata.kind === 'expanse-living-content') return activityAnchors?.interact?.(metadata, { source, explicitUserAction }) || freeze({ ok: false, reason: 'activity-runtime-unavailable' });
    return frontier?.interact?.(metadata, { source, explicitUserAction }) || freeze({ ok: false, reason: 'frontier-runtime-unavailable' });
  };
  const pointerObserver = scene.onPointerObservable?.add?.(handleGatewayInteraction);
  const getAssetTruthReport = () => buildEonExpanseW767DAssetTruthReport({
    hero: heroAssets?.getSummary?.() || {},
    npcs: npcRuntime?.getSummary?.() || {},
    activities: activityAnchors?.getSummary?.() || {},
    expectedZoneIds: EON_EXPANSE_W766_ZONES.map((zone) => zone.id)
  });
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766A_GATEWAY_SCHEMA,
    root,
    activate() {
      const signalMounted = mountDeferredSignalWorld();
      if (!signalMounted.ok) return signalMounted;
      const mounted = mountDeferredAssets();
      if (!mounted.ok) return mounted;
      frontier?.resume?.();
      root.setEnabled(true);
      signalRoot.setEnabled(true);
      npcRuntime?.setActive?.(true);
      cinematicEnvironment?.activate?.({ progress: { ...progress, companionBonded: companionState?.bonded === true } });
      rt92SignalDeepArt?.activate?.({ progress: { ...progress, companionBonded: companionState?.bonded === true } });
      rt92EnvironmentalLife?.applyState?.({ active: true, activityLevel: Math.min(4, Number(progress?.restoredZoneCount || progress?.restoredCount || 1)) });
      rt92CinematicVfx?.activate?.({ intensity: 1 });
      signalLandscape?.activate?.();
      activityAnchors?.applyState?.(livingContentState);
      productiveTransformations.applyState?.(livingContentState);
      sideTransformations.applyState?.(livingContentState);
      activityAnchors?.updateEvent?.(dynamicEventState, 0);
      applyCompanionState(companionState);
      return freeze({ ok: true, mountedInCanonicalScene: root.getScene?.() === scene, assetsDeferredUntilEntry: true, signalWorldDeferredUntilEntry: true });
    },
    deactivate() {
      npcRuntime?.setActive?.(false);
      signalRoot.setEnabled(false);
      root.setEnabled(false);
      cinematicEnvironment?.deactivate?.();
      rt92SignalDeepArt?.deactivate?.();
      rt92EnvironmentalLife?.setActive?.(false);
      rt92CinematicVfx?.deactivate?.();
      signalLandscape?.deactivate?.();
      frontier?.suspend?.();
      // R09: retain decoded GLB/NPC/activity resources while the canonical City
      // runtime stays alive. The root is disabled, so they render/collide with
      // nothing in the Hub; final runtime disposal and explicit asset repair
      // remain the only normal paths that destroy these decoded resources.
      return freeze({ ok: true, expanseAssetsSuspended: true, decodedAssetsRetained: true, expanseAssetsDisposed: false });
    },
    suspendSignalPresentation(reason = 'region-switch') {
      npcRuntime?.setActive?.(false);
      signalRoot.setEnabled(false);
      cinematicEnvironment?.deactivate?.();
      rt92SignalDeepArt?.deactivate?.();
      rt92EnvironmentalLife?.setActive?.(false);
      rt92CinematicVfx?.deactivate?.();
      signalLandscape?.deactivate?.();
      frontier?.suspend?.();
      return freeze({ ok: true, reason, signalRegionActive: false, expanseUmbrellaActive: root.isEnabled?.() === true, decodedSignalAssetsRetained: true });
    },
    resumeSignalPresentation(reason = 'region-switch') {
      const signalMounted = mountDeferredSignalWorld();
      if (!signalMounted.ok) return signalMounted;
      root.setEnabled(true);
      signalRoot.setEnabled(true);
      npcRuntime?.setActive?.(true);
      frontier?.resume?.();
      cinematicEnvironment?.activate?.({ progress: { ...progress, companionBonded: companionState?.bonded === true } });
      rt92SignalDeepArt?.activate?.({ progress: { ...progress, companionBonded: companionState?.bonded === true } });
      rt92EnvironmentalLife?.applyState?.({ active: true, activityLevel: Math.min(4, Number(progress?.restoredZoneCount || progress?.restoredCount || 1)) });
      rt92CinematicVfx?.activate?.({ intensity: 1 });
      signalLandscape?.activate?.();
      applyCompanionState(companionState);
      return freeze({ ok: true, reason, signalRegionActive: true, expanseUmbrellaActive: true, sameSessionReuse: signalMounted.alreadyMounted === true });
    },
    applyProgress(nextProgress) {
      progress = nextProgress || progress;
      frontier?.applyProgress?.(progress);
      cinematicEnvironment?.applyProgress?.({ ...progress, companionBonded: companionState?.bonded === true });
      rt92SignalDeepArt?.applyProgress?.({ ...progress, companionBonded: companionState?.bonded === true });
      return freeze({ ok: true, progress });
    },
    applyCompanionState(nextState, runtimeState = {}) {
      return applyCompanionState(nextState, runtimeState);
    },
    applyFutureRegionActivation(nextActivation = null) {
      futureRegionActivation = nextActivation || null;
      return stormSectorGateway.applyActivation?.(futureRegionActivation) || freeze({ ok: false, reason: 'storm-sector-gateway-presenter-unavailable' });
    },
    getInteractionCandidates(position = {}, options = {}) {
      return getInteractionCandidates(position, options);
    },
    getAssetTruthReport() {
      return getAssetTruthReport();
    },
    reloadAuthoredAssets({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (root.isEnabled?.() !== true) return freeze({ ok: false, reason: 'expanse-not-active' });
      const previousReport = getAssetTruthReport();
      if (Number(previousReport?.totals?.pending || 0) > 0) return freeze({ ok: false, reason: 'asset-load-pending', report: previousReport });
      const repairRequired = Number(previousReport?.totals?.rejected || 0) > 0
        || Number(previousReport?.totals?.proceduralFallback || 0) > 0
        || Number(previousReport?.missingZoneIds?.length || 0) > 0;
      if (!repairRequired) return freeze({ ok: false, reason: 'authored-assets-retry-not-required', report: previousReport });
      disposeDeferredAssets();
      authoredAssetReloadCount += 1;
      lastAuthoredAssetReloadAt = Date.now();
      const mounted = mountDeferredAssets();
      if (!mounted.ok) return freeze({ ok: false, reason: mounted.reason || 'authored-asset-reload-failed', reloadCount: authoredAssetReloadCount, previousReport, report: getAssetTruthReport() });
      activityAnchors?.applyState?.(livingContentState);
      productiveTransformations.applyState?.(livingContentState);
      sideTransformations.applyState?.(livingContentState);
      activityAnchors?.updateEvent?.(dynamicEventState, 0);
      applyCompanionState(companionState);
      return freeze({ ok: true, explicitUserAction: true, reloadCount: authoredAssetReloadCount, previousReport, report: getAssetTruthReport(), canonicalScene: root.getScene?.() === scene, automaticRetry: false });
    },
    interactNearest(position = {}, { maxDistance = 5.2, explicitUserAction = false, expectedTargetId = '', source = 'expanse-proximity' } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const candidate = getInteractionCandidates(position, { maxDistance })[0] || null;
      if (!candidate) return freeze({ ok: false, reason: 'no-nearby-expanse-interaction' });
      const expected = String(expectedTargetId || '');
      if (expected && expected !== candidate.targetId) return freeze({ ok: false, reason: 'expanse-interaction-target-changed', expectedTargetId: expected, currentTargetId: candidate.targetId });
      const dispatchSource = String(source || 'expanse-proximity').replace(/[^a-z0-9:_-]+/gi, '-').slice(0, 80);
      const result = dispatchInteraction(candidate, { source: `${dispatchSource}:${candidate.meshName}`, explicitUserAction });
      return freeze({ ...result, targetId: candidate.targetId, distance: candidate.distance, label: candidate.metadata?.label || '' });
    },
    applyLivingContent(nextState = {}) {
      livingContentState = nextState || {};
      const activities = activityAnchors?.applyState?.(livingContentState) || freeze({ ok: true, deferredUntilEntry: true });
      const transformations = productiveTransformations.applyState?.(livingContentState) || freeze({ ok: true });
      const sideMissionTransformations = sideTransformations.applyState?.(livingContentState) || freeze({ ok: true });
      return freeze({ ok: true, activities, transformations, sideMissionTransformations });
    },
    updateDynamicEvent(event = null, seconds = 0, at = Date.now()) {
      dynamicEventState = event || null;
      return activityAnchors?.updateEvent?.(dynamicEventState, seconds, at) || freeze({ ok: true, deferredUntilEntry: true });
    },
    update(position = {}) {
      if (signalRoot.isEnabled?.() !== true) return freeze({ currentZone: '', signalRegionActive: false, suspended: true });
      const now = Date.now();
      const deltaSeconds = Math.min(0.05, Math.max(0.001, (now - lastUpdateAt) / 1000));
      lastUpdateAt = now;
      const seconds = now / 1000;
      if (companionDockRoot.isEnabled?.() && !reducedMotion) companionDockRing.rotation.z += deltaSeconds * 0.55;
      if (rescueRoot.isEnabled?.()) {
        relayHalo.rotation.z += deltaSeconds * 1.6;
        relayHalo.scaling.setAll(0.92 + Math.sin(seconds * 3.1) * 0.08);
        if (signalCore.isEnabled?.()) { signalCore.rotation.y += deltaSeconds * 1.8; signalCore.position.y = EON_EXPANSE_W767A_SIGNAL_CORE_POSE.y + Math.sin(seconds * 2.6) * 0.12; }
      }
      cinematicEnvironment?.update?.(seconds);
      rt92SignalDeepArt?.update?.(seconds);
      rt92EnvironmentalLife?.update?.(seconds);
      rt92CinematicVfx?.update?.(seconds);
      productiveTransformations.update?.(seconds);
      sideTransformations.update?.(seconds);
      stormSectorGateway.update?.(seconds);
      npcRuntime?.update?.(deltaSeconds);
      return frontier?.update?.(position, seconds) || freeze({ currentZone: 'gateway-overlook' });
    },
    dispose() {
      try { if (pointerObserver) scene.onPointerObservable?.remove?.(pointerObserver); } catch {}
      disposeDeferredAssets();
      try { frontier?.dispose?.(); } catch {}
      try { signalLandscape?.dispose?.(); } catch {}
      try { rt92CinematicVfx?.dispose?.(); } catch {}
      try { rt92EnvironmentalLife?.dispose?.(); } catch {}
      try { rt92SignalDeepArt?.dispose?.(); } catch {}
      try { cinematicEnvironment?.dispose?.(); } catch {}
      try { productiveTransformations?.dispose?.(); } catch {}
      try { sideTransformations?.dispose?.(); } catch {}
      try { stormSectorGateway?.dispose?.(); } catch {}
      for (const mat of materials) try { mat.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    },
    getSummary() {
      return freeze({
        enabled: root.isEnabled?.() === true,
        signalRegionActive: signalRoot.isEnabled?.() === true,
        nodeCount: nodes.length,
        canonicalScene: root.getScene?.() === scene,
        returnGateInteractive: true,
        hardWorldEdgeShown: false,
        worldSeed,
        frontier: frontier?.getSummary?.() || null,
        cinematicEnvironment: cinematicEnvironment?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilSignalEntry: true }),
        rt92SignalDeepArt: rt92SignalDeepArt?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilSignalEntry: true, firstFrameHubBinaryDelta: 0 }),
        rt92EnvironmentalLife: rt92EnvironmentalLife?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilSignalEntry: true, firstFrameNewBinaryBytes: 0 }),
        rt92CinematicVfx: rt92CinematicVfx?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilSignalEntry: true, firstFrameNewBinaryBytes: 0 }),
        outerLandscape: signalLandscape?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilSignalEntry: true }),
        signalWorldDeferredUntilEntry: true,
        productiveTransformations: productiveTransformations?.getSummary?.() || null,
        sideTransformations: sideTransformations?.getSummary?.() || null,
        stormSectorGateway: stormSectorGateway?.getSummary?.() || null,
        futureRegionActivationPresent: Boolean(futureRegionActivation),
        assetsDeferredUntilEntry: true,
        heroAssets: heroAssets?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilEntry: true }),
        npcs: npcRuntime?.getSummary?.() || freeze({ state: 'not-loaded', deferredUntilEntry: true }),
        activities: activityAnchors?.getSummary?.() || null,
        assetTruth: getAssetTruthReport(),
        assetRecovery: freeze({ reloadCount: authoredAssetReloadCount, lastReloadAt: lastAuthoredAssetReloadAt, automaticRetry: false }),
        companionRescue: freeze({ phase: companionState?.phase || 'unknown', nextAction: companionState?.nextAction || '', visible: rescueRoot.isEnabled?.() === true, oneCanonicalCompanion: true }),
        companionDock: freeze({ ...companionDockPresentation, visible: companionDockRoot.isEnabled?.() === true, pickable: companionDockHit.isPickable === true })
      });
    }
  });
}
