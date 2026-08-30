/** W768I — canonical-scene My Frontier platform, roads and plot pads. */
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { deriveEonExpanseW768IVisualFoundation } from './eon-expanse-w768i-my-frontier-visual-model.js';
import { deriveEonExpanseW768JMyFrontierPresentation } from './eon-expanse-w768j-my-frontier-presentation.js';
import { deriveEonExpanseW768MAuthoredAssetPlan } from './eon-expanse-w768m-my-frontier-authored-asset-plan.js';
import { mountEonExpanseW768NMyFrontierAuthoredAssetPresenter } from './eon-expanse-w768n-my-frontier-authored-asset-presenter.js';
import { deriveEonExpanseW768RBuildingTerminal } from './eon-expanse-w768r-my-frontier-building-terminal.js';
import { createEonExpanseW768SConstructionCeremonyDirector } from './eon-expanse-w768s-my-frontier-construction-ceremony.js';
import { deriveEonExpanseW768TResidentStations } from './eon-expanse-w768t-my-frontier-resident-stations.js';
import { deriveEonExpanseW768UResidentInspection } from './eon-expanse-w768u-my-frontier-resident-inspection.js';
import { deriveEonExpanseW768XResidentAssetPlan } from './eon-expanse-w768x-my-frontier-resident-asset-plan.js';
import { mountEonExpanseW768YResidentPresenter } from './eon-expanse-w768y-my-frontier-resident-presenter.js';
import { deriveEonExpanseW769CThemePresentation } from '../w769/eon-expanse-w769c-my-frontier-theme-presentation.js';
import { createEonExpanseW769JUpgradeCeremonyDirector } from '../w769/eon-expanse-w769j-my-frontier-upgrade-ceremony.js';
import { deriveEonExpanseW770BCompositionPlan } from '../w770/eon-expanse-w770b-my-frontier-building-composition-plan.js';
import { mountEonExpanseW770CBuildingCompositionPresenter } from '../w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js';
import { mountEonCityL95MyFrontierPublicInfrastructure } from '../l95/eon-city-l95-my-frontier-public-infrastructure.js';
import { mountEonCityL95MyFrontierPublicLandscape } from '../l95/eon-city-l95-my-frontier-public-landscape.js';
import { mountEonCityL95MyFrontierAmbientCast } from '../l95/eon-city-l95-my-frontier-ambient-cast.js';
import { deriveEonCityL95WorldStreamingFocus } from '../l95/eon-city-l95-world-streaming-policy.js';
import { mountEonCityRt92MyFrontierUrbanFabric } from '../rt92/my-frontier/eon-city-rt92-my-frontier-urban-fabric.js';
import { mountEonCityRt92MyFrontierBespokePresenter } from '../rt92/my-frontier/eon-city-rt92-my-frontier-bespoke-presenter.js';
import { mountEonCityRt92EnvironmentalLifeArt } from '../rt92/eon-city-rt92-environmental-life-art.js';
import { mountEonCityRt92CinematicVfxArt } from '../rt92/eon-city-rt92-cinematic-vfx-art.js';

export const EON_EXPANSE_W768I_RENDERER_SCHEMA = 'eon.expanse.my-frontier-renderer.w768i.v1';
const freeze = Object.freeze;

const applyMaterialSlot = (material, slot = null) => {
  if (!material || !slot) return;
  material.diffuseColor = Color3.FromHexString(slot.diffuse);
  material.emissiveColor = Color3.FromHexString(slot.emissive).scale(Number(slot.intensity || 0));
  material.alpha = Number.isFinite(Number(slot.alpha)) ? Number(slot.alpha) : 1;
  material.backFaceCulling = material.alpha >= 1;
};

const makeMaterial = (scene, name, diffuse, emissive = diffuse, intensity = 0.25, alpha = 1) => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = Color3.FromHexString(diffuse);
  material.emissiveColor = Color3.FromHexString(emissive).scale(intensity);
  material.specularColor = Color3.Black();
  material.alpha = alpha;
  if (alpha < 1) material.backFaceCulling = false;
  return material;
};

export function mountEonExpanseW768IMyFrontierRenderer({ scene, parent = null, quality = 'balanced', reducedMotion = false, assetAdmission = null } = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const model = deriveEonExpanseW768IVisualFoundation({ unlocked: false });
  const root = new TransformNode('w768i-my-frontier-root', scene);
  if (parent) root.parent = parent;
  root.position.set(model.worldOffset.x, model.worldOffset.y, model.worldOffset.z);
  root.setEnabled(false);
  root.metadata = freeze({ schema: EON_EXPANSE_W768I_RENDERER_SCHEMA, canonicalSceneOnly: true, authoredFixedLayout: true });

  const materials = freeze({
    terrain: makeMaterial(scene, 'w768i-my-frontier-terrain', '#08101c', '#132946', 0.16),
    underlay: makeMaterial(scene, 'w768i-my-frontier-underlay', '#04070c', '#07101c', 0.08),
    circuit: makeMaterial(scene, 'w768i-my-frontier-circuit', '#123c58', '#25b6ff', 0.78),
    pad: makeMaterial(scene, 'w768i-my-frontier-pad', '#121b2a', '#27435f', 0.22),
    boundary: makeMaterial(scene, 'w768i-my-frontier-boundary', '#202b3d', '#9d72ff', 0.4),
    marker: makeMaterial(scene, 'w768i-my-frontier-marker', '#342419', '#ffbc62', 0.62),
    hologram: makeMaterial(scene, 'w768j-my-frontier-hologram', '#142c42', '#25b6ff', 0.9, 0.24),
    foundation: makeMaterial(scene, 'w768j-my-frontier-foundation', '#192332', '#58e6b2', 0.42),
    scaffold: makeMaterial(scene, 'w768j-my-frontier-scaffold', '#382a18', '#ffbc62', 0.72)
  });
  const nodes = [];
  const plotNodes = new Map();
  const residentNodes = new Map();

  const track = (mesh, material, { x = 0, y = 0, z = 0 } = {}, collisions = false) => {
    mesh.parent = root;
    mesh.material = material;
    mesh.position.set(x, y, z);
    mesh.checkCollisions = collisions;
    mesh.isPickable = false;
    nodes.push(mesh);
    return mesh;
  };

  track(MeshBuilder.CreateCylinder('w768i-my-frontier-underlay', { diameter: 84, height: 4.6, tessellation: quality === 'lite' ? 48 : 80 }, scene), materials.underlay, { y: -2.75 }, true);
  track(MeshBuilder.CreateCylinder('w768i-my-frontier-platform', { diameter: 82, height: 1.1, tessellation: quality === 'lite' ? 48 : 80 }, scene), materials.terrain, { y: -0.45 }, true);
  const circuitRing = track(MeshBuilder.CreateTorus('w768i-my-frontier-central-circuit', { diameter: 17, thickness: 0.16, tessellation: 72 }, scene), materials.circuit, { y: 0.17 }, false);
  circuitRing.rotation.x = Math.PI / 2;

  for (const road of model.roads) {
    const localX = road.center.x - model.worldOffset.x;
    const localZ = road.center.z - model.worldOffset.z;
    const deck = track(MeshBuilder.CreateBox(`w768i-${road.id}`, { width: road.width, height: 0.18, depth: road.length }, scene), materials.terrain, { x: localX, y: 0.04, z: localZ }, true);
    deck.rotation.y = road.heading;
    const trace = track(MeshBuilder.CreateBox(`w768i-${road.id}-circuit`, { width: 0.16, height: 0.045, depth: Math.max(1, road.length - 1.2) }, scene), materials.circuit, { x: localX, y: 0.155, z: localZ }, false);
    trace.rotation.y = road.heading;
  }

  for (const plot of model.plots) {
    const x = plot.worldPosition.x - model.worldOffset.x;
    const z = plot.worldPosition.z - model.worldOffset.z;
    const plotRoot = new TransformNode(`w768i-${plot.plotId}-root`, scene);
    plotRoot.parent = root;
    plotRoot.position.set(x, 0, z);
    plotRoot.rotation.y = plot.heading;
    plotRoot.metadata = freeze({ kind: 'my-frontier-authored-plot-root', plotId: plot.plotId, district: plot.district });
    const pad = MeshBuilder.CreateBox(`w768i-${plot.plotId}-pad`, { width: plot.maxFootprint.width + 1.2, height: 0.28, depth: plot.maxFootprint.depth + 1.2 }, scene);
    pad.parent = plotRoot; pad.position.y = 0.13; pad.material = materials.pad; pad.checkCollisions = true; pad.isPickable = false; nodes.push(pad);
    const halo = MeshBuilder.CreateTorus(`w768i-${plot.plotId}-halo`, { diameter: Math.min(plot.maxFootprint.width, plot.maxFootprint.depth) * 0.82, thickness: 0.08, tessellation: 48 }, scene);
    halo.parent = plotRoot; halo.position.y = 0.35; halo.rotation.x = Math.PI / 2; halo.material = plot.district === 'central' ? materials.marker : materials.circuit; halo.checkCollisions = false; halo.isPickable = false; nodes.push(halo);
    const halfW = plot.maxFootprint.width / 2 + 0.7;
    const halfD = plot.maxFootprint.depth / 2 + 0.7;
    const curbSpecs = [
      { name: 'north', width: halfW * 2, depth: 0.18, x: 0, z: -halfD },
      { name: 'south', width: halfW * 2, depth: 0.18, x: 0, z: halfD },
      { name: 'west', width: 0.18, depth: halfD * 2, x: -halfW, z: 0 },
      { name: 'east', width: 0.18, depth: halfD * 2, x: halfW, z: 0 }
    ];
    for (const curb of curbSpecs) {
      const mesh = MeshBuilder.CreateBox(`w768i-${plot.plotId}-boundary-${curb.name}`, { width: curb.width, height: 0.48, depth: curb.depth }, scene);
      mesh.parent = plotRoot; mesh.position.set(curb.x, 0.34, curb.z); mesh.material = materials.boundary; mesh.checkCollisions = true; mesh.isPickable = false; nodes.push(mesh);
    }
    const marker = MeshBuilder.CreateCylinder(`w768i-${plot.plotId}-district-marker`, { diameter: 0.32, height: 2.1, tessellation: 16 }, scene);
    marker.parent = root;
    marker.position.set(plot.interactionAnchor.x - model.worldOffset.x, 1.05, plot.interactionAnchor.z - model.worldOffset.z);
    marker.material = materials.marker; marker.checkCollisions = false; marker.isPickable = false; nodes.push(marker);
    const inspectionHit = MeshBuilder.CreateCylinder(`w768k-${plot.plotId}-inspection-hit`, { diameter: 2.4, height: 1.8, tessellation: 20 }, scene);
    inspectionHit.parent = root; inspectionHit.position.set(plot.interactionAnchor.x - model.worldOffset.x, 0.9, plot.interactionAnchor.z - model.worldOffset.z);
    inspectionHit.material = materials.hologram; inspectionHit.visibility = 0.025; inspectionHit.checkCollisions = false; inspectionHit.isPickable = true;
    inspectionHit.metadata = freeze({ kind: 'expanse-my-frontier-plot', action: 'inspect-my-frontier-plot', plotId: plot.plotId, district: plot.district, label: `Inspect ${plot.label}`, interactive: true, grantsXp: false });
    nodes.push(inspectionHit);
    const ceremonyRing = MeshBuilder.CreateTorus(`w768s-${plot.plotId}-construction-ring`, { diameter: Math.min(plot.maxFootprint.width, plot.maxFootprint.depth) * 0.72, thickness: 0.15, tessellation: 56 }, scene);
    ceremonyRing.parent = plotRoot; ceremonyRing.position.y = 0.48; ceremonyRing.rotation.x = Math.PI / 2; ceremonyRing.material = materials.circuit; ceremonyRing.isPickable = false; ceremonyRing.checkCollisions = false; ceremonyRing.setEnabled(false); nodes.push(ceremonyRing);
    const ceremonyBeam = MeshBuilder.CreateCylinder(`w768s-${plot.plotId}-construction-beam`, { diameter: Math.min(plot.maxFootprint.width, plot.maxFootprint.depth) * 0.38, height: 5.5, tessellation: 32 }, scene);
    ceremonyBeam.parent = plotRoot; ceremonyBeam.position.y = 2.9; ceremonyBeam.material = materials.hologram; ceremonyBeam.isPickable = false; ceremonyBeam.checkCollisions = false; ceremonyBeam.setEnabled(false); nodes.push(ceremonyBeam);
    const stateRoot = new TransformNode(`w768j-${plot.plotId}-state-root`, scene);
    stateRoot.parent = plotRoot;
    const hologram = MeshBuilder.CreateBox(`w768j-${plot.plotId}-planned-hologram`, { width: 1, height: 1, depth: 1 }, scene);
    hologram.parent = stateRoot; hologram.material = materials.hologram; hologram.checkCollisions = false; hologram.isPickable = false; hologram.setEnabled(false); nodes.push(hologram);
    const foundation = MeshBuilder.CreateBox(`w768j-${plot.plotId}-verified-foundation`, { width: 1, height: 0.65, depth: 1 }, scene);
    foundation.parent = stateRoot; foundation.position.y = 0.62; foundation.material = materials.foundation; foundation.checkCollisions = true; foundation.isPickable = false; foundation.setEnabled(false); nodes.push(foundation);
    const operationalRing = MeshBuilder.CreateTorus(`w769g-${plot.plotId}-operational-ring`, { diameter: Math.min(plot.maxFootprint.width, plot.maxFootprint.depth) * 0.58, thickness: 0.12, tessellation: 56 }, scene);
    operationalRing.parent = stateRoot; operationalRing.position.y = 0.98; operationalRing.rotation.x = Math.PI / 2; operationalRing.material = materials.circuit; operationalRing.checkCollisions = false; operationalRing.isPickable = false; operationalRing.setEnabled(false); nodes.push(operationalRing);
    const operationalBeacon = MeshBuilder.CreateCylinder(`w769g-${plot.plotId}-utility-beacon`, { diameter: 0.22, height: 2.8, tessellation: 18 }, scene);
    operationalBeacon.parent = stateRoot; operationalBeacon.position.set(0, 1.75, Math.max(0.6, plot.maxFootprint.depth * 0.28)); operationalBeacon.material = materials.marker; operationalBeacon.checkCollisions = false; operationalBeacon.isPickable = false; operationalBeacon.setEnabled(false); nodes.push(operationalBeacon);
    const scaffoldRoot = new TransformNode(`w768j-${plot.plotId}-scaffold-root`, scene);
    scaffoldRoot.parent = stateRoot; scaffoldRoot.setEnabled(false);
    const scaffoldPosts = [];
    for (const [index, corner] of [[-1,-1], [1,-1], [1,1], [-1,1]].entries()) {
      const post = MeshBuilder.CreateBox(`w768j-${plot.plotId}-scaffold-post-${index}`, { width: 0.18, height: 1, depth: 0.18 }, scene);
      post.parent = scaffoldRoot; post.material = materials.scaffold; post.checkCollisions = false; post.isPickable = false; scaffoldPosts.push(freeze({ mesh: post, corner })); nodes.push(post);
    }
    plotNodes.set(plot.plotId, freeze({ root: plotRoot, pad, halo, marker, inspectionHit, ceremonyRing, ceremonyBeam, stateRoot, hologram, foundation, operationalRing, operationalBeacon, scaffoldRoot, scaffoldPosts }));
  }

  const initialResidentStations = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: false } });
  for (const slot of initialResidentStations.slots) {
    const localX = slot.worldPosition.x - model.worldOffset.x;
    const localZ = slot.worldPosition.z - model.worldOffset.z;
    const station = track(MeshBuilder.CreateCylinder(`w768t-${slot.slotId}-station`, { diameter: 1.5, height: 0.22, tessellation: 28 }, scene), materials.pad, { x: localX, y: 0.2, z: localZ }, false);
    station.metadata = freeze({ kind: 'my-frontier-resident-station', slotId: slot.slotId, residentId: slot.residentId, interactive: false, residentBody: false });
    const routeEnvelope = track(MeshBuilder.CreateTorus(`w768t-${slot.slotId}-route-envelope`, { diameter: slot.routeRadius * 2, thickness: 0.055, tessellation: 48 }, scene), materials.boundary, { x: localX, y: 0.24, z: localZ }, false);
    routeEnvelope.rotation.x = Math.PI / 2; routeEnvelope.metadata = freeze({ kind: 'my-frontier-resident-route-envelope', slotId: slot.slotId, collisionSafe: true, interactive: false });
    const invitedSignal = track(MeshBuilder.CreateCylinder(`w768t-${slot.slotId}-invited-signal`, { diameter: 0.18, height: 2.25, tessellation: 16 }, scene), materials.circuit, { x: localX, y: 1.22, z: localZ }, false);
    invitedSignal.metadata = freeze({ kind: 'my-frontier-resident-invited-signal', slotId: slot.slotId, residentId: slot.residentId, truthfulPlaceholderOnly: true, residentBody: false, interactive: false }); invitedSignal.setEnabled(false);
    const inspectionHit = track(MeshBuilder.CreateCylinder(`w768u-${slot.slotId}-inspection-hit`, { diameter: 2.15, height: 1.8, tessellation: 20 }, scene), materials.hologram, { x: slot.interactionAnchor.x - model.worldOffset.x, y: 0.9, z: slot.interactionAnchor.z - model.worldOffset.z }, false);
    inspectionHit.visibility = 0.025; inspectionHit.isPickable = true; inspectionHit.metadata = freeze({ kind: 'expanse-my-frontier-resident-station', action: 'inspect-my-frontier-resident-station', slotId: slot.slotId, residentId: slot.residentId, label: `Inspect ${slot.label}`, expectedToken: `${slot.slotId}:${slot.residentId}:${slot.status}`, interactive: true, grantsXp: false });
    residentNodes.set(slot.slotId, freeze({ station, routeEnvelope, invitedSignal, inspectionHit }));
  }

  const publicInfrastructurePresenter = mountEonCityL95MyFrontierPublicInfrastructure({ scene, parent: root, quality, assetAdmission });
  if (!publicInfrastructurePresenter?.ok) return freeze({ ok: false, reason: `public-infrastructure-presenter-failed:${publicInfrastructurePresenter?.reason || 'unknown'}` });
  const publicLandscapePresenter = mountEonCityL95MyFrontierPublicLandscape({ scene, parent: root, quality });
  if (!publicLandscapePresenter?.ok) {
    try { publicInfrastructurePresenter?.dispose?.(); } catch {}
    return freeze({ ok: false, reason: `public-landscape-presenter-failed:${publicLandscapePresenter?.reason || 'unknown'}` });
  }
  const rt92UrbanFabricPresenter = mountEonCityRt92MyFrontierUrbanFabric({ scene, parent: root, quality, reducedMotion });
  if (!rt92UrbanFabricPresenter?.ok) {
    try { publicLandscapePresenter?.dispose?.(); } catch {}
    try { publicInfrastructurePresenter?.dispose?.(); } catch {}
    return freeze({ ok: false, reason: `rt92-urban-fabric-presenter-failed:${rt92UrbanFabricPresenter?.reason || 'unknown'}` });
  }
  const ambientCastPresenter = mountEonCityL95MyFrontierAmbientCast({ scene, parent: root, quality, assetAdmission });
  if (!ambientCastPresenter?.ok) {
    try { rt92UrbanFabricPresenter?.dispose?.(); } catch {}
    try { publicLandscapePresenter?.dispose?.(); } catch {}
    try { publicInfrastructurePresenter?.dispose?.(); } catch {}
    return freeze({ ok: false, reason: `ambient-cast-presenter-failed:${ambientCastPresenter?.reason || 'unknown'}` });
  }
  const authoredAssetPresenter = mountEonExpanseW768NMyFrontierAuthoredAssetPresenter({ scene, plotNodes, assetAdmission });
  const buildingCompositionPresenter = mountEonExpanseW770CBuildingCompositionPresenter({ scene, plotNodes, assetAdmission });
  const rt92EnvironmentalLife = mountEonCityRt92EnvironmentalLifeArt({ scene, parent: root, worldId: 'my-frontier', quality, reducedMotion });
  if (!rt92EnvironmentalLife?.ok) {
    try { rt92UrbanFabricPresenter?.dispose?.(); } catch {}
    for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
    try { root.dispose?.(false, true); } catch {}
    return freeze({ ok: false, reason: `rt92-my-frontier-environmental-life-failed:${rt92EnvironmentalLife?.reason || 'unknown'}` });
  }
  const rt92CinematicVfx = mountEonCityRt92CinematicVfxArt({ scene, parent: root, worldId: 'my-frontier', quality, reducedMotion });
  if (!rt92CinematicVfx?.ok) {
    try { rt92EnvironmentalLife?.dispose?.(); rt92UrbanFabricPresenter?.dispose?.(); } catch {}
    return freeze({ ok: false, reason: `rt92-my-frontier-cinematic-vfx-failed:${rt92CinematicVfx?.reason || 'unknown'}` });
  }
  const bespokeLandmarkPresenter = mountEonCityRt92MyFrontierBespokePresenter({ scene, plotNodes, quality, assetAdmission });
  const residentAssetPresenter = mountEonExpanseW768YResidentPresenter({ scene, residentNodes, assetAdmission });
  const ceremonyDirector = createEonExpanseW768SConstructionCeremonyDirector({ reducedMotion });
  const upgradeCeremonyDirector = createEonExpanseW769JUpgradeCeremonyDirector({ reducedMotion });
  const ceremonyClock = () => globalThis.performance?.now?.() || Date.now();
  let ceremonyState = ceremonyDirector.getState({ at: ceremonyClock() });
  let upgradeCeremonyState = upgradeCeremonyDirector.getState({ at: ceremonyClock() });
  let previousConstructionCeremonyPlots = new Set();
  let previousUpgradeCeremonyPlots = new Set();
  let active = false;
  let unlocked = false;
  let disposed = false;
  let presentation = deriveEonExpanseW768JMyFrontierPresentation();
  let residentPresentation = deriveEonExpanseW768TResidentStations({ myFrontierState: { unlocked: false } });
  let residentAssetPlan = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState: { unlocked: false } });
  let authoredAssetPlan = deriveEonExpanseW768MAuthoredAssetPlan({ presentation });
  let buildingCompositionPlan = deriveEonExpanseW770BCompositionPlan({ presentation, quality });
  let buildingCompositionSummary = buildingCompositionPresenter?.getSummary?.() || freeze({ plots: freeze([]), presentedCompositionCount: 0, requestedPartCount: 0 });
  let bespokeLandmarkSummary = bespokeLandmarkPresenter?.getSummary?.() || freeze({ plots: freeze([]), catalogueCompleteCount: 0, presentedCount: 0, readinessVersion: 0 });
  let themePresentation = deriveEonExpanseW769CThemePresentation({ unlocked: false });
  const applyThemePresentation = (myFrontierState = {}) => {
    themePresentation = deriveEonExpanseW769CThemePresentation({ themeId: myFrontierState?.themeId, unlocked: myFrontierState?.unlocked === true });
    for (const [name, slot] of Object.entries(themePresentation.materials)) applyMaterialSlot(materials[name], slot);
    return themePresentation;
  };
  let desiredOptionalAssetAdmission = freeze({
    pressure: String(assetAdmission?.pressure || 'nominal'),
    visibility: String(assetAdmission?.visibility || 'visible'),
    reason: String(assetAdmission?.reason || 'my-frontier-runtime').slice(0, 120)
  });
  let streamingFocus = null;
  let lastStreamingFocusAt = -Infinity;

  const applyOptionalAssetAdmission = (options = desiredOptionalAssetAdmission) => {
    desiredOptionalAssetAdmission = freeze({
      pressure: String(options?.pressure || 'nominal'),
      visibility: String(options?.visibility || 'visible'),
      reason: String(options?.reason || 'my-frontier-runtime').slice(0, 120)
    });
    const effective = active && unlocked && streamingFocus?.valid === true
      ? desiredOptionalAssetAdmission
      : freeze({
          pressure: 'critical',
          visibility: active && unlocked ? 'visible' : 'hidden',
          reason: active && unlocked ? 'my-frontier-awaiting-streaming-focus' : 'my-frontier-inactive'
        });
    const publicInfrastructure = publicInfrastructurePresenter?.setOptionalAssetAdmission?.(effective) || null;
    const ambientCast = ambientCastPresenter?.setOptionalAssetAdmission?.(effective) || null;
    const authoredBuildings = authoredAssetPresenter?.setOptionalAssetAdmission?.(effective) || null;
    const buildingCompositions = buildingCompositionPresenter?.setOptionalAssetAdmission?.(effective) || null;
    const bespokeLandmarks = bespokeLandmarkPresenter?.setOptionalAssetAdmission?.(effective) || null;
    const residents = residentAssetPresenter?.setOptionalAssetAdmission?.(effective) || null;
    return freeze({ ok: true, effective, publicInfrastructure, ambientCast, authoredBuildings, buildingCompositions, bespokeLandmarks, residents });
  };

  const syncStreamingFocus = (playerPosition = null, at = ceremonyClock(), { force = false } = {}) => {
    if (!active || !unlocked || !playerPosition) return streamingFocus;
    const projected = deriveEonCityL95WorldStreamingFocus({ playerPosition, worldOffset: model.worldOffset, quality });
    if (!projected.valid) return streamingFocus;
    if (!force && Number(at) - lastStreamingFocusAt < projected.focusIntervalMs) return streamingFocus;
    streamingFocus = projected;
    lastStreamingFocusAt = Number(at) || 0;
    publicInfrastructurePresenter?.setStreamingFocus?.(projected, { radius: projected.warmRadius });
    ambientCastPresenter?.setStreamingFocus?.(projected, { radius: projected.nearRadius });
    authoredAssetPresenter?.setStreamingFocus?.(projected, { radius: projected.nearRadius });
    buildingCompositionPresenter?.setStreamingFocus?.(projected, { radius: projected.nearRadius });
    bespokeLandmarkPresenter?.setStreamingFocus?.(projected, { radius: projected.warmRadius });
    residentAssetPresenter?.setStreamingFocus?.(projected, { radius: projected.nearRadius });
    rt92UrbanFabricPresenter?.setStreamingFocus?.(projected);
    // Releasing the desired admission only after the current entry has a valid
    // player-local focus prevents stale-location queue drains on re-entry.
    applyOptionalAssetAdmission(desiredOptionalAssetAdmission);
    return streamingFocus;
  };

  let operationalCount = 0;
  const applyCompositionValidation = () => {
    bespokeLandmarkSummary = bespokeLandmarkPresenter?.getSummary?.() || freeze({ plots: freeze([]), catalogueCompleteCount: 0, presentedCount: 0, readinessVersion: 0 });
    const bespokeReadyPlotIds = (bespokeLandmarkSummary.plots || []).filter((entry) => entry.ready === true).map((entry) => String(entry.plotId || '')).filter(Boolean);
    // W770 remains the truthful visible fallback until the replacement GLB has
    // passed real Babylon presentation truth; only then is the composition hidden.
    buildingCompositionPresenter?.setBespokeReadyPlots?.(bespokeReadyPlotIds);
    buildingCompositionSummary = buildingCompositionPresenter?.getSummary?.() || freeze({ plots: freeze([]), presentedCompositionCount: 0, requestedPartCount: 0 });
    const compositionReadiness = new Map((buildingCompositionSummary.plots || []).map((entry) => [String(entry.plotId || ''), entry]));
    const bespokeReadiness = new Map((bespokeLandmarkSummary.plots || []).map((entry) => [String(entry.plotId || ''), entry]));
    for (const entry of presentation.plots || []) {
      const target = plotNodes.get(entry.plotId);
      if (!target) continue;
      const ready = bespokeReadiness.get(entry.plotId)?.ready === true || compositionReadiness.get(entry.plotId)?.compositionReady === true;
      target.scaffoldRoot.setEnabled(entry.scaffoldingVisible === true && !ready);
    }
    return freeze({ compositions: buildingCompositionSummary, bespoke: bespokeLandmarkSummary });
  };
  const releaseBespokeReadinessListener = bespokeLandmarkPresenter?.onReadinessChange?.(() => {
    if (!disposed) applyCompositionValidation();
  }) || (() => {});
  const applyPresentation = ({ myFrontierState = {}, constructionProjection = {}, upgradeProjection = {} } = {}) => {
    applyThemePresentation(myFrontierState);
    presentation = deriveEonExpanseW768JMyFrontierPresentation({ myFrontierState, constructionProjection });
    const upgradeByPlot = new Map((Array.isArray(upgradeProjection?.plots) ? upgradeProjection.plots : []).map((entry) => [String(entry.plotId || ''), entry]));
    operationalCount = 0;
    ceremonyState = ceremonyDirector.notePresentation(presentation, { at: ceremonyClock() });
    upgradeCeremonyState = upgradeCeremonyDirector.noteProjection(upgradeProjection, { at: ceremonyClock() });
    for (const entry of presentation.plots) {
      const target = plotNodes.get(entry.plotId);
      if (!target) continue;
      const width = Math.max(1, Number(entry.footprint?.width || 1));
      const depth = Math.max(1, Number(entry.footprint?.depth || 1));
      const height = Math.max(1, Number(entry.footprint?.height || 1));
      target.hologram.scaling.set(width, height, depth);
      target.hologram.position.y = 0.45 + height / 2;
      target.hologram.setEnabled(entry.hologramVisible);
      target.foundation.scaling.set(width, 1, depth);
      target.foundation.setEnabled(entry.foundationVisible);
      target.scaffoldRoot.setEnabled(entry.scaffoldingVisible);
      const upgrade = upgradeByPlot.get(entry.plotId) || null;
      const operational = entry.foundationVisible && Number(upgrade?.level || 0) >= 2 && upgrade?.upgradeStatus === 'operational';
      target.operationalRing.setEnabled(operational);
      target.operationalRing.scaling.set(Math.max(0.6, width / Math.max(1, entry.footprint?.width || 1)), 1, Math.max(0.6, depth / Math.max(1, entry.footprint?.depth || 1)));
      target.operationalBeacon.setEnabled(operational);
      if (operational) operationalCount += 1;
      const terminal = deriveEonExpanseW768RBuildingTerminal({ plotId: entry.plotId, buildingId: entry.constructedBuildingId, presentationStatus: entry.status });
      target.inspectionHit.metadata = terminal.available
        ? freeze({ kind: 'expanse-my-frontier-plot', action: terminal.action.type, plotId: entry.plotId, district: entry.district, buildingId: terminal.action.buildingId, label: terminal.action.label, interactive: true, grantsXp: false, expectedTerminalToken: terminal.action.terminalToken, stationId: terminal.action.stationId, surface: terminal.action.surface, nativeRoute: terminal.action.nativeRoute, districtLevel: operational ? 2 : 1, districtUpgradeStatus: operational ? 'operational' : 'foundation' })
        : freeze({ kind: 'expanse-my-frontier-plot', action: 'inspect-my-frontier-plot', plotId: entry.plotId, district: entry.district, buildingId: entry.selectedBuildingId, label: `Inspect ${target.root.metadata?.district || entry.district} plot`, interactive: true, grantsXp: false, presentationStatus: entry.status, expectedToken: `${entry.plotId}:${entry.selectedBuildingId || 'empty'}:${entry.status}` });
      for (const { mesh, corner } of target.scaffoldPosts) {
        mesh.scaling.y = Math.max(1, height * 0.72);
        mesh.position.set(corner[0] * Math.max(0.5, width / 2 - 0.35), 0.62 + (height * 0.72) / 2, corner[1] * Math.max(0.5, depth / 2 - 0.35));
      }
    }
    residentPresentation = deriveEonExpanseW768TResidentStations({ myFrontierState });
    for (const slot of residentPresentation.slots) {
      const target = residentNodes.get(slot.slotId);
      if (!target) continue;
      target.station.setEnabled(slot.stationVisible);
      target.routeEnvelope.setEnabled(slot.routeEnvelopeVisible);
      target.invitedSignal.setEnabled(slot.invitedSignalVisible);
      target.inspectionHit.setEnabled(slot.stationVisible);
      const inspection = deriveEonExpanseW768UResidentInspection({ slotId: slot.slotId, myFrontierState });
      target.inspectionHit.metadata = freeze({ ...target.inspectionHit.metadata, label: `Inspect ${slot.label}`, expectedToken: inspection.expectedToken || '', residentStatus: inspection.status || slot.status });
    }
    residentAssetPlan = deriveEonExpanseW768XResidentAssetPlan({ myFrontierState });
    residentAssetPresenter?.apply?.({ plan: residentAssetPlan });
    buildingCompositionPlan = deriveEonExpanseW770BCompositionPlan({ presentation, quality });
    buildingCompositionPresenter?.apply?.({ plan: buildingCompositionPlan });
    bespokeLandmarkPresenter?.apply?.({ presentation, quality });
    authoredAssetPlan = deriveEonExpanseW768MAuthoredAssetPlan({ presentation });
    const composedBuildingIds = new Set(buildingCompositionPlan.plots.filter((entry) => entry.requestComposition).map((entry) => entry.buildingId));
    const fallbackAnchorPlan = freeze({ ...authoredAssetPlan, plots: freeze(authoredAssetPlan.plots.map((entry) => composedBuildingIds.has(entry.buildingId) ? freeze({ ...entry, requestAsset: false, status: 'superseded-by-authored-composition', reason: 'W770 validated multi-asset composition owns presentation.' }) : entry)) });
    authoredAssetPresenter?.apply?.({ plan: fallbackAnchorPlan });
    rt92UrbanFabricPresenter?.applyState?.({ myFrontierState, upgradeProjection });
    rt92EnvironmentalLife?.applyState?.({ active: active && unlocked, activityLevel: Math.min(4, operationalCount) });
    applyCompositionValidation();
    return presentation;
  };
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W768I_RENDERER_SCHEMA,
    root,
    apply({ unlocked: nextUnlocked = false, myFrontierState = {}, constructionProjection = {}, upgradeProjection = {} } = {}) {
      unlocked = nextUnlocked === true;
      applyPresentation({ myFrontierState, constructionProjection, upgradeProjection });
      root.setEnabled(active && unlocked);
      ambientCastPresenter?.setActive?.(active && unlocked);
      bespokeLandmarkPresenter?.setActive?.(active && unlocked);
      residentAssetPresenter?.setActive?.(active && unlocked);
      rt92EnvironmentalLife?.setActive?.(active && unlocked);
      rt92CinematicVfx?.applyState?.({ active: active && unlocked, intensity: Math.min(1.35, 0.72 + operationalCount * 0.08) });
      applyOptionalAssetAdmission(desiredOptionalAssetAdmission);
      return freeze({ ok: true, active, unlocked, visible: root.isEnabled?.() === true, presentation });
    },
    activate({ unlocked: nextUnlocked = false, myFrontierState = {}, constructionProjection = {}, upgradeProjection = {} } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'my-frontier-renderer-disposed' });
      active = true;
      unlocked = nextUnlocked === true;
      applyPresentation({ myFrontierState, constructionProjection, upgradeProjection });
      root.setEnabled(unlocked);
      if (unlocked) rt92UrbanFabricPresenter?.activate?.({ myFrontierState, upgradeProjection });
      else rt92UrbanFabricPresenter?.deactivate?.();
      ambientCastPresenter?.setActive?.(unlocked);
      bespokeLandmarkPresenter?.setActive?.(unlocked);
      residentAssetPresenter?.setActive?.(unlocked);
      rt92EnvironmentalLife?.applyState?.({ active: unlocked, activityLevel: Math.min(4, operationalCount) });
      rt92CinematicVfx?.applyState?.({ active: unlocked, intensity: Math.min(1.35, 0.72 + operationalCount * 0.08) });
      applyOptionalAssetAdmission(desiredOptionalAssetAdmission);
      return freeze({ ok: true, active, unlocked, visible: root.isEnabled?.() === true, canonicalScene: root.getScene?.() === scene });
    },
    deactivate() {
      active = false;
      rt92UrbanFabricPresenter?.deactivate?.();
      root.setEnabled(false);
      ambientCastPresenter?.setActive?.(false);
      bespokeLandmarkPresenter?.setActive?.(false);
      residentAssetPresenter?.setActive?.(false);
      rt92EnvironmentalLife?.setActive?.(false);
      rt92CinematicVfx?.deactivate?.();
      const assetAdmissionState = applyOptionalAssetAdmission(desiredOptionalAssetAdmission);
      streamingFocus = null;
      lastStreamingFocusAt = -Infinity;
      publicInfrastructurePresenter?.setStreamingFocus?.(null, { radius: 0 });
      ambientCastPresenter?.setStreamingFocus?.(null, { radius: 0 });
      authoredAssetPresenter?.setStreamingFocus?.(null, { radius: 0 });
      buildingCompositionPresenter?.setStreamingFocus?.(null, { radius: 0 });
      bespokeLandmarkPresenter?.setStreamingFocus?.(null, { radius: 0 });
      residentAssetPresenter?.setStreamingFocus?.(null, { radius: 0 });
      rt92UrbanFabricPresenter?.setStreamingFocus?.(null);
      return freeze({ ok: true, active: false, visible: false, optionalLoadsPaused: assetAdmissionState.effective?.optionalConcurrencyLimit === 0 || assetAdmissionState.effective?.pressure === 'critical', decodedAssetsRetained: true, streamingFocusReset: true });
    },
    update(at = ceremonyClock(), playerPosition = null) {
      syncStreamingFocus(playerPosition, at);
      ceremonyState = ceremonyDirector.update({ at });
      upgradeCeremonyState = upgradeCeremonyDirector.update({ at });
      const currentConstructionCeremonyPlots = new Set((ceremonyState.active || []).map((event) => String(event.plotId || '')).filter(Boolean));
      const currentUpgradeCeremonyPlots = new Set((upgradeCeremonyState.active || []).map((event) => String(event.plotId || '')).filter(Boolean));
      // Reset only plots that are currently animated or were animated on the
      // previous frame. Idle My Frontier frames therefore perform no ceremony
      // mesh writes, while the first frame after an event ends restores the
      // authored baseline exactly once.
      for (const plotId of new Set([...previousConstructionCeremonyPlots, ...currentConstructionCeremonyPlots])) {
        const target = plotNodes.get(plotId);
        if (!target) continue;
        target.ceremonyRing.setEnabled(false);
        target.ceremonyBeam.setEnabled(false);
      }
      for (const plotId of new Set([...previousUpgradeCeremonyPlots, ...currentUpgradeCeremonyPlots])) {
        const target = plotNodes.get(plotId);
        if (!target) continue;
        if (target.operationalRing.isEnabled?.()) { target.operationalRing.scaling.setAll(1); target.operationalRing.visibility = 1; target.operationalRing.rotation.z = 0; }
        if (target.operationalBeacon.isEnabled?.()) { target.operationalBeacon.scaling.setAll(1); target.operationalBeacon.visibility = 1; }
      }
      previousConstructionCeremonyPlots = currentConstructionCeremonyPlots;
      previousUpgradeCeremonyPlots = currentUpgradeCeremonyPlots;
      // Composition readiness changes on authored-load completion, not on every
      // animation frame. getSummary()/explicit apply paths refresh validation at
      // the bounded Expanse UI cadence, avoiding per-frame allocation/GC churn.
      for (const event of ceremonyState.active) {
        const target = plotNodes.get(event.plotId);
        if (!target || !active || !unlocked) continue;
        const progress = Math.max(0, Math.min(1, Number(event.progress || 0)));
        const pulse = reducedMotion ? 0.65 : Math.sin(Math.PI * progress);
        target.ceremonyRing.setEnabled(true); target.ceremonyRing.scaling.setAll(0.68 + progress * 0.82); target.ceremonyRing.visibility = Math.max(0.05, 1 - progress); target.ceremonyRing.rotation.z = reducedMotion ? 0 : progress * Math.PI * 1.5;
        target.ceremonyBeam.setEnabled(true); target.ceremonyBeam.scaling.y = Math.max(0.08, pulse); target.ceremonyBeam.visibility = Math.max(0.04, (1 - progress) * 0.42);
      }
      for (const event of upgradeCeremonyState.active) {
        const target = plotNodes.get(event.plotId);
        if (!target || !active || !unlocked || !target.operationalRing.isEnabled?.()) continue;
        const progress = Math.max(0, Math.min(1, Number(event.progress || 0)));
        const pulse = reducedMotion ? 0.12 : Math.sin(Math.PI * progress);
        target.operationalRing.scaling.setAll(1 + pulse * 0.24);
        target.operationalRing.visibility = Math.min(1, 0.82 + pulse * 0.18);
        target.operationalRing.rotation.z = reducedMotion ? 0 : progress * Math.PI;
        target.operationalBeacon.scaling.y = 1 + pulse * 0.48;
        target.operationalBeacon.visibility = Math.min(1, 0.78 + pulse * 0.22);
      }
      const rt92UrbanFabric = rt92UrbanFabricPresenter?.update?.(at) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      const rt92EnvironmentalLifeUpdate = rt92EnvironmentalLife?.update?.(Number(at || 0) / 1000) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      const rt92Cinematic = rt92CinematicVfx?.update?.(Number(at || 0) / 1000) || freeze({ ok: false, animatedCount: 0, ownsRenderLoop: false });
      return freeze({ construction: ceremonyState, operationalUpgrade: upgradeCeremonyState, rt92UrbanFabric, rt92EnvironmentalLife: rt92EnvironmentalLifeUpdate, rt92Cinematic, ownsRenderLoop: false });
    },
    reactResident({ slotId = '', residentId = '', explicitUserAction = false } = {}) {
      return residentAssetPresenter?.react?.({ slotId, residentId, explicitUserAction }) || freeze({ ok: false, reason: 'resident-presenter-unavailable', grantsXp: false, mutatesMissionState: false });
    },
    retryBuildingCompositions({ plotId = '', explicitUserAction = false } = {}) {
      const result = buildingCompositionPresenter?.retryRejected?.({ plotId, explicitUserAction }) || freeze({ ok: false, reason: 'building-composition-presenter-unavailable', retriedPartCount: 0, automaticRetry: false });
      applyCompositionValidation();
      return result;
    },
    getBuildingCompositionRecoveryReport() {
      applyCompositionValidation();
      return buildingCompositionSummary;
    },
    setOptionalAssetAdmission(options = {}) {
      return applyOptionalAssetAdmission(options);
    },
    setStreamingFocus(playerPosition = null, { force = true } = {}) {
      return syncStreamingFocus(playerPosition, ceremonyClock(), { force });
    },
    getSummary() {
      const residentAssets = residentAssetPresenter?.getSummary?.() || null;
      applyCompositionValidation();
      return freeze({ schema: EON_EXPANSE_W768I_RENDERER_SCHEMA, active, unlocked, visible: root.isEnabled?.() === true, plotCount: plotNodes.size, roadCount: model.roads.length, nodeCount: nodes.length, publicInfrastructure: publicInfrastructurePresenter?.getSummary?.() || null, publicLandscape: publicLandscapePresenter?.getSummary?.() || null, rt92UrbanFabric: rt92UrbanFabricPresenter?.getSummary?.() || null, rt92EnvironmentalLife: rt92EnvironmentalLife?.getSummary?.() || null, rt92CinematicVfx: rt92CinematicVfx?.getSummary?.() || null, ambientCast: ambientCastPresenter?.getSummary?.() || null, plannedCount: presentation.plannedCount, constructedFoundationCount: presentation.constructedFoundationCount, authoredAssetRequests: authoredAssetPlan.requestedCount, authoredAssets: authoredAssetPresenter?.getSummary?.() || null, buildingCompositionRequests: buildingCompositionPlan.requestedPlotCount, buildingCompositionPartRequests: buildingCompositionPlan.requestedPartCount, buildingCompositions: buildingCompositionSummary, rt92BespokeLandmarks: bespokeLandmarkSummary, presentedBespokeLandmarkCount: Number(bespokeLandmarkSummary.presentedCount || 0), presentedBuildingCompositionCount: buildingCompositionSummary.presentedCompositionCount || 0, scaffoldingSuppressedAfterValidationCount: (buildingCompositionSummary.plots || []).filter((entry) => entry.suppressScaffolding).length, bespokeBuildingArtCompleteCount: Number(bespokeLandmarkSummary.catalogueCompleteCount || 0), activeConstructionCeremonies: ceremonyState.active.length, activeOperationalUpgradeCeremonies: upgradeCeremonyState.active.length, reducedMotionCeremony: Boolean(reducedMotion), residentStationCount: residentPresentation.slotCount, invitedResidentSignalCount: residentPresentation.invitedCount, residentAssetRequests: residentAssetPlan.requestedCount, residentAssets, residentBodyCount: residentAssets?.residentBodyCount || 0, operationalDistrictCount: operationalCount, operationalPresentation: 'circuit-ring-and-utility-beacon', levelThreeLandmarkArtPending: Number(bespokeLandmarkSummary.catalogueCompleteCount || 0) < 5, themeId: themePresentation.themeId, themeLabel: themePresentation.themeLabel, themeAppliedToMyFrontierOnly: themePresentation.myFrontierMaterialsOnly, sceneEnvironmentMutated: themePresentation.sceneEnvironmentMutated, authoredAssetMaterialsOverwritten: themePresentation.authoredAssetMaterialsOverwritten, residentAssetMaterialsOverwritten: themePresentation.residentAssetMaterialsOverwritten, streamingFocus: streamingFocus ? freeze({ x: streamingFocus.x, z: streamingFocus.z, nearRadius: streamingFocus.nearRadius, warmRadius: streamingFocus.warmRadius, distantRadius: streamingFocus.distantRadius }) : null, optionalAssetAdmission: active && unlocked && streamingFocus?.valid === true ? desiredOptionalAssetAdmission : freeze({ pressure: 'critical', visibility: active && unlocked ? 'visible' : 'hidden', reason: active && unlocked ? 'my-frontier-awaiting-streaming-focus' : 'my-frontier-inactive' }), interactivePlotCount: unlocked ? plotNodes.size : 0, canonicalScene: root.getScene?.() === scene, oneEngine: true, oneScene: true, oneRenderLoop: true, finishedHeroPrimitives: 0, rawCoordinatePlacementAllowed: false });
    },
    dispose() {
      if (disposed) return freeze({ ok: true, alreadyDisposed: true });
      disposed = true;
      root.setEnabled(false);
      try { ambientCastPresenter?.dispose?.(); } catch {}
      try { rt92CinematicVfx?.dispose?.(); } catch {}
      try { rt92EnvironmentalLife?.dispose?.(); } catch {}
      try { rt92UrbanFabricPresenter?.dispose?.(); } catch {}
      try { publicLandscapePresenter?.dispose?.(); } catch {}
      try { publicInfrastructurePresenter?.dispose?.(); } catch {}
      try { authoredAssetPresenter?.dispose?.(); } catch {}
      try { releaseBespokeReadinessListener(); } catch {}
      try { bespokeLandmarkPresenter?.dispose?.(); } catch {}
      try { buildingCompositionPresenter?.dispose?.(); } catch {}
      try { residentAssetPresenter?.dispose?.(); } catch {}
      for (const material of Object.values(materials)) try { material.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}

export default freeze({ EON_EXPANSE_W768I_RENDERER_SCHEMA, mountEonExpanseW768IMyFrontierRenderer });
