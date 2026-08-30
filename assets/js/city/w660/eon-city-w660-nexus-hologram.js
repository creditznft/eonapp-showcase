/**
 * W660F/W660N — Babylon presentation of the shared privacy-projected EON NEXUS.
 *
 * One visible hologram belongs to each City district. The layer owns no render
 * loop and no Chat, project, task or provider store. It renders only normalized
 * state supplied by the shared Nexus adapter and exposes review-first station
 * metadata to the maintained Productive City owner.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { createEonNexusEventAdapter } from '../../nexus/eon-nexus-event-adapter.js';
import { EON_CITY_W660_NEXUS_STATIONS } from './eon-city-w660-nexus-stations.js';
import { readEonNexusContinuitySnapshot } from '../../nexus/eon-nexus-continuity-contract.js';

export const EON_CITY_W660_NEXUS_HOLOGRAM_SCHEMA = 'eon.city.w660.nexus-hologram.w660n.v2';
export const EON_CITY_W660_NEXUS_VISIBILITY_RADIUS = 11.5;
const freeze = (value) => Object.freeze(value);

const STATE_COLOR = freeze({
  ready: freeze([0.2, 0.8, 1]),
  listening: freeze([0.25, 1, 0.75]),
  processing: freeze([1, 0.72, 0.2]),
  speaking: freeze([0.78, 0.5, 1]),
  'waiting-approval': freeze([1, 0.44, 0.18]),
  complete: freeze([0.96, 0.78, 0.28]),
  error: freeze([1, 0.2, 0.22]),
  offline: freeze([0.42, 0.48, 0.58])
});

function colorForState(state = 'ready') {
  const value = STATE_COLOR[state] || STATE_COLOR.ready;
  return new Color3(value[0], value[1], value[2]);
}

function distanceTo(station, position = {}) {
  return Math.hypot(Number(position.x || 0) - station.position.x, Number(position.z || 0) - station.position.z);
}

function phaseFor(id = '') {
  let hash = 2166136261;
  for (const character of String(id || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 6283) / 1000;
}

function markPickable(mesh, metadata) {
  mesh.isPickable = true;
  mesh.metadata = { ...metadata, kind: 'eon-city-w660-nexus-station-mesh' };
  return mesh;
}

function createStationVisual(scene, station, quality) {
  const root = new TransformNode(`w660-nexus-${station.id}`, scene);
  root.position.copyFromFloats(station.position.x, station.position.y, station.position.z);
  root.metadata = {
    kind: 'eon-city-w660-nexus-station',
    schema: EON_CITY_W660_NEXUS_HOLOGRAM_SCHEMA,
    stationId: station.id,
    districtId: station.districtId,
    purpose: station.purpose,
    actionIds: station.actions.map((entry) => entry.id),
    privacyProjected: true,
    reviewOnly: true,
    ownsRenderLoop: false
  };

  const material = new StandardMaterial(`w660-nexus-material-${station.id}`, scene);
  material.disableLighting = false;
  material.alpha = quality === 'lite' ? 0.78 : 0.9;
  material.specularColor = new Color3(0.38, 0.38, 0.38);

  const approvalMaterial = new StandardMaterial(`w660-nexus-approval-material-${station.id}`, scene);
  approvalMaterial.disableLighting = false;
  approvalMaterial.alpha = 0.92;
  approvalMaterial.diffuseColor = new Color3(0.52, 0.2, 0.04);
  approvalMaterial.emissiveColor = new Color3(1, 0.42, 0.1);

  const shieldMaterial = new StandardMaterial(`w660-nexus-shield-material-${station.id}`, scene);
  shieldMaterial.disableLighting = true;
  shieldMaterial.wireframe = true;
  shieldMaterial.alpha = quality === 'lite' ? 0.12 : 0.18;
  shieldMaterial.emissiveColor = new Color3(0.15, 0.86, 1);

  const beaconMaterial = new StandardMaterial(`w660-nexus-beacon-material-${station.id}`, scene);
  beaconMaterial.disableLighting = true;
  beaconMaterial.alpha = quality === 'lite' ? 0.2 : 0.3;
  beaconMaterial.emissiveColor = new Color3(0.2, 0.8, 1);

  const tessellation = quality === 'lite' ? 16 : quality === 'cinematic' ? 40 : 28;
  const pedestal = markPickable(MeshBuilder.CreateCylinder(`w660-nexus-pedestal-${station.id}`, {
    height: 0.18,
    diameterTop: 1.04,
    diameterBottom: 1.28,
    tessellation
  }, scene), root.metadata);
  pedestal.parent = root;
  pedestal.position.y = 0.09;
  pedestal.material = material;

  const stem = markPickable(MeshBuilder.CreateCylinder(`w660-nexus-stem-${station.id}`, {
    height: 0.78,
    diameter: 0.065,
    tessellation: quality === 'lite' ? 8 : 12
  }, scene), root.metadata);
  stem.parent = root;
  stem.position.y = 0.54;
  stem.material = material;

  const ring = markPickable(MeshBuilder.CreateTorus(`w660-nexus-ring-${station.id}`, {
    diameter: 1.12,
    thickness: quality === 'lite' ? 0.035 : 0.045,
    tessellation
  }, scene), root.metadata);
  ring.parent = root;
  ring.position.y = 1.13;
  ring.rotation.x = Math.PI / 2;
  ring.material = material;

  const crossRing = markPickable(MeshBuilder.CreateTorus(`w660-nexus-cross-ring-${station.id}`, {
    diameter: 0.88,
    thickness: quality === 'lite' ? 0.022 : 0.03,
    tessellation
  }, scene), root.metadata);
  crossRing.parent = root;
  crossRing.position.y = 1.13;
  crossRing.rotation.z = Math.PI / 2;
  crossRing.material = material;

  const orb = markPickable(MeshBuilder.CreatePolyhedron(`w660-nexus-orb-${station.id}`, {
    type: 2,
    size: quality === 'lite' ? 0.29 : 0.36
  }, scene), root.metadata);
  orb.parent = root;
  orb.position.y = 1.13;
  orb.material = material;

  const approvalRing = markPickable(MeshBuilder.CreateTorus(`w660-nexus-approval-ring-${station.id}`, {
    diameter: 1.38,
    thickness: quality === 'lite' ? 0.024 : 0.034,
    tessellation
  }, scene), root.metadata);
  approvalRing.parent = root;
  approvalRing.position.y = 1.13;
  approvalRing.rotation.x = Math.PI / 2;
  approvalRing.material = approvalMaterial;
  approvalRing.setEnabled(false);

  const shield = markPickable(MeshBuilder.CreateSphere(`w660-nexus-private-shield-${station.id}`, {
    diameter: quality === 'lite' ? 0.75 : 0.9,
    segments: quality === 'lite' ? 8 : 14
  }, scene), root.metadata);
  shield.parent = root;
  shield.position.y = 1.13;
  shield.material = shieldMaterial;
  shield.setEnabled(false);

  const beacon = markPickable(MeshBuilder.CreateCylinder(`w660-nexus-beacon-${station.id}`, {
    height: quality === 'lite' ? 1.7 : 2.25,
    diameter: quality === 'lite' ? 0.028 : 0.04,
    tessellation: quality === 'lite' ? 6 : 10
  }, scene), root.metadata);
  beacon.parent = root;
  beacon.position.y = quality === 'lite' ? 2.05 : 2.32;
  beacon.material = beaconMaterial;

  const beaconRing = markPickable(MeshBuilder.CreateTorus(`w660-nexus-beacon-ring-${station.id}`, {
    diameter: quality === 'lite' ? 1.35 : 1.7,
    thickness: quality === 'lite' ? 0.018 : 0.026,
    tessellation
  }, scene), root.metadata);
  beaconRing.parent = root;
  beaconRing.position.y = quality === 'lite' ? 2.82 : 3.22;
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.material = beaconMaterial;

  root.setEnabled(false);
  return {
    station,
    root,
    ring,
    crossRing,
    orb,
    approvalRing,
    shield,
    beacon,
    beaconRing,
    material,
    approvalMaterial,
    shieldMaterial,
    beaconMaterial,
    phase: phaseFor(station.id),
    visible: false,
    baseAlpha: material.alpha
  };
}


function createWorkObjectVisual(scene, station, handoff, quality) {
  if (!station || !handoff?.workObject?.id) return null;
  const object = handoff.workObject;
  const root = new TransformNode(`w686-work-object-${object.id}`, scene);
  root.position.copyFromFloats(station.position.x + 0.95, station.position.y, station.position.z - 0.75);
  root.metadata = {
    kind: 'eon-city-w686-work-object',
    interactionKind: 'nexus-work-object',
    interactionId: object.id,
    assetId: object.id,
    interactive: true,
    label: object.label,
    interactionRadius: 3.4,
    schema: object.schema,
    workObjectId: object.id,
    workObjectKind: object.kind,
    stationId: station.id,
    districtId: station.districtId,
    reviewOnly: true,
    explicitUserAction: true,
    autoNavigate: false,
    autoExecute: false,
    privacyProjected: true
  };
  const material = new StandardMaterial(`w686-work-object-material-${object.id}`, scene);
  material.disableLighting = false;
  material.alpha = quality === 'lite' ? 0.72 : 0.9;
  const accent = object.kind === 'approval' ? new Color3(1, 0.44, 0.18)
    : object.kind === 'result' ? new Color3(0.96, 0.78, 0.28)
      : object.kind === 'project' ? new Color3(0.66, 0.55, 0.98)
        : new Color3(0.2, 0.8, 1);
  material.diffuseColor = accent.scale(0.25);
  material.emissiveColor = accent;
  const base = MeshBuilder.CreateCylinder(`w686-work-object-base-${object.id}`, { height: 0.12, diameter: 0.72, tessellation: quality === 'lite' ? 8 : 18 }, scene);
  base.parent = root; base.position.y = 0.08; base.material = material; base.isPickable = false;
  const prism = MeshBuilder.CreatePolyhedron(`w686-work-object-prism-${object.id}`, { type: object.kind === 'result' ? 1 : 2, size: quality === 'lite' ? 0.24 : 0.32 }, scene);
  prism.parent = root; prism.position.y = 0.88; prism.material = material; prism.isPickable = true;
  const orbit = MeshBuilder.CreateTorus(`w686-work-object-orbit-${object.id}`, { diameter: 0.86, thickness: quality === 'lite' ? 0.018 : 0.026, tessellation: quality === 'lite' ? 12 : 28 }, scene);
  orbit.parent = root; orbit.position.y = 0.88; orbit.rotation.x = Math.PI / 2; orbit.material = material; orbit.isPickable = false;
  root.setEnabled(false);
  return { root, prism, orbit, material, station, handoff, visible: false, phase: phaseFor(object.id) };
}

export function createEonCityW660NexusHologram({
  scene,
  quality = 'balanced',
  reducedMotion = false,
  environment = globalThis,
  adapter = null,
  onStatus = () => {}
} = {}) {
  if (!scene) throw new Error('w660-city-nexus-scene-required');
  const resolvedQuality = quality === 'lite' ? 'lite' : (quality === 'cinematic' ? 'cinematic' : 'balanced');
  const ownsAdapter = !adapter;
  const stateAdapter = adapter || createEonNexusEventAdapter({ environment, document: environment?.document || null });
  const visuals = EON_CITY_W660_NEXUS_STATIONS.map((station) => createStationVisual(scene, station, resolvedQuality));
  const continuity = readEonNexusContinuitySnapshot({ storage: environment.sessionStorage });
  const handoff = continuity?.workObjectHandoff || null;
  const targetStation = handoff?.workObject?.stationId ? EON_CITY_W660_NEXUS_STATIONS.find((station) => station.id === handoff.workObject.stationId) : null;
  const workObjectVisual = createWorkObjectVisual(scene, targetStation, handoff, resolvedQuality);
  let snapshot = stateAdapter.getSnapshot?.() || freeze({ eonbot: freeze({ state: 'ready' }), route: freeze({ privateOnDevice: false }) });
  let unsubscribe = null;
  let started = false;
  let disposed = false;
  let lastPosition = freeze({ x: 0, z: 0 });
  let elapsed = 0;

  const applySnapshot = (next = snapshot) => {
    snapshot = next || snapshot;
    const state = String(snapshot?.eonbot?.state || 'ready');
    const color = colorForState(state);
    const privateOnDevice = snapshot?.route?.privateOnDevice === true;
    const approvalPending = snapshot?.approval?.pending === true;
    for (const visual of visuals) {
      visual.material.emissiveColor = color;
      visual.material.diffuseColor = color.scale(0.38);
      visual.beaconMaterial.emissiveColor = color;
      visual.root.metadata.eonbotState = state;
      visual.root.metadata.privateOnDevice = privateOnDevice;
      visual.root.metadata.approvalPending = approvalPending;
      visual.root.metadata.projectSelected = snapshot?.project?.selected === true;
      visual.root.metadata.resultCount = Math.max(0, Number(snapshot?.results?.count) || 0);
      visual.approvalRing.setEnabled(approvalPending);
      visual.shield.setEnabled(privateOnDevice);
    }
  };

  const getNearestStation = (position = lastPosition) => {
    const nearest = EON_CITY_W660_NEXUS_STATIONS
      .map((station) => freeze({ station, distance: distanceTo(station, position) }))
      .sort((left, right) => left.distance - right.distance)[0] || null;
    return nearest ? freeze({
      ...nearest,
      inRange: nearest.distance <= nearest.station.interactionRadius,
      visible: nearest.distance <= EON_CITY_W660_NEXUS_VISIBILITY_RADIUS,
      state: String(snapshot?.eonbot?.state || 'ready'),
      privateOnDevice: snapshot?.route?.privateOnDevice === true,
      approvalPending: snapshot?.approval?.pending === true,
      projectSelected: snapshot?.project?.selected === true,
      resultCount: Math.max(0, Number(snapshot?.results?.count) || 0)
    }) : null;
  };

  const start = () => {
    if (disposed) return freeze({ ok: false, reason: 'disposed' });
    if (started) return freeze({ ok: true, reason: 'already-started' });
    stateAdapter.start?.();
    unsubscribe = stateAdapter.subscribe?.((next) => applySnapshot(next)) || null;
    applySnapshot(stateAdapter.getSnapshot?.() || snapshot);
    started = true;
    onStatus(`EON NEXUS continuity is active at ${visuals.length} district-scale, review-first City holograms.`);
    return freeze({ ok: true, stationCount: visuals.length, ownsRenderLoop: false });
  };

  const update = (position = lastPosition, deltaSeconds = 0.016) => {
    if (disposed) return null;
    lastPosition = freeze({ x: Number(position.x || 0), z: Number(position.z || 0) });
    const delta = Math.max(0, Math.min(0.1, Number(deltaSeconds) || 0));
    elapsed += delta;
    const state = String(snapshot?.eonbot?.state || 'ready');
    const speed = state === 'processing' ? 1.8 : state === 'listening' ? 1.15 : state === 'speaking' ? 1.35 : 0.55;
    for (const visual of visuals) {
      const distance = distanceTo(visual.station, lastPosition);
      const visible = distance <= EON_CITY_W660_NEXUS_VISIBILITY_RADIUS;
      if (visible !== visual.visible) {
        visual.visible = visible;
        visual.root.setEnabled(visible);
      }
      if (!visible) continue;
      const fade = Math.max(0.48, 1 - (distance / EON_CITY_W660_NEXUS_VISIBILITY_RADIUS) * 0.44);
      visual.material.alpha = visual.baseAlpha * fade;
      visual.beaconMaterial.alpha = (resolvedQuality === 'lite' ? 0.2 : 0.3) * fade;
      if (reducedMotion) {
        visual.orb.position.y = 1.13;
        visual.orb.scaling.setAll(1);
        visual.beaconRing.scaling.setAll(1);
        continue;
      }
      visual.ring.rotation.z += delta * speed;
      visual.crossRing.rotation.x += delta * speed * 0.62;
      visual.crossRing.rotation.y -= delta * speed * 0.38;
      visual.approvalRing.rotation.z -= delta * 0.72;
      visual.shield.rotation.y += delta * 0.24;
      visual.beaconRing.rotation.z -= delta * speed * 0.22;
      visual.orb.position.y = 1.13 + Math.sin(elapsed * speed * 2 + visual.phase) * 0.075;
      const beaconPulse = 1 + Math.max(0, Math.sin(elapsed * 1.25 + visual.phase)) * 0.08;
      visual.beaconRing.scaling.setAll(beaconPulse);
      const completionPulse = state === 'complete' ? 1 + Math.max(0, Math.sin(elapsed * 2.4 + visual.phase)) * 0.14 : 1;
      visual.orb.scaling.setAll(completionPulse);
    }
    if (workObjectVisual) {
      const distance = distanceTo(workObjectVisual.station, lastPosition);
      const visible = distance <= EON_CITY_W660_NEXUS_VISIBILITY_RADIUS;
      if (visible !== workObjectVisual.visible) { workObjectVisual.visible = visible; workObjectVisual.root.setEnabled(visible); }
      if (visible && !reducedMotion) {
        workObjectVisual.prism.position.y = 0.88 + Math.sin(elapsed * 1.5 + workObjectVisual.phase) * 0.08;
        workObjectVisual.prism.rotation.y += delta * 0.6;
        workObjectVisual.orbit.rotation.z -= delta * 0.42;
      }
    }
    return getNearestStation(lastPosition);
  };

  const getSummary = () => freeze({
    schema: EON_CITY_W660_NEXUS_HOLOGRAM_SCHEMA,
    started,
    disposed,
    quality: resolvedQuality,
    reducedMotion: Boolean(reducedMotion),
    stationCount: visuals.length,
    renderedStationIds: freeze(visuals.map((visual) => visual.station.id)),
    visibleStationIds: freeze(visuals.filter((visual) => visual.visible).map((visual) => visual.station.id)),
    visibilityRadius: EON_CITY_W660_NEXUS_VISIBILITY_RADIUS,
    interactionRadius: Math.max(...EON_CITY_W660_NEXUS_STATIONS.map((entry) => entry.interactionRadius)),
    visualProfile: 'district-landmark-orb-with-state-rings-private-shield-approval-band-and-overhead-beacon',
    overheadBeacon: true,
    workObjectHandoffVisible: Boolean(workObjectVisual),
    workObjectId: workObjectVisual?.handoff?.workObject?.id || '',
    workObjectStationId: workObjectVisual?.station?.id || '',
    state: String(snapshot?.eonbot?.state || 'ready'),
    routeMode: String(snapshot?.route?.mode || 'guide'),
    privateOnDevice: snapshot?.route?.privateOnDevice === true,
    approvalPending: snapshot?.approval?.pending === true,
    projectSelected: snapshot?.project?.selected === true,
    resultCount: Math.max(0, Number(snapshot?.results?.count) || 0),
    nearest: getNearestStation(lastPosition),
    sharedPrivacyProjection: true,
    ownsConversation: false,
    ownsProjectStore: false,
    ownsRenderLoop: false,
    secondCanvas: false,
    glbDependency: false
  });

  return freeze({
    start,
    update,
    getNearestStation,
    getSnapshot: () => snapshot,
    getSummary,
    dispose() {
      if (disposed) return getSummary();
      disposed = true;
      try { unsubscribe?.(); } catch {}
      if (ownsAdapter) stateAdapter.dispose?.();
      if (workObjectVisual) {
        try { workObjectVisual.root.dispose(false, true); } catch {}
        try { workObjectVisual.material.dispose(); } catch {}
      }
      for (const visual of visuals) {
        try { visual.root.dispose(false, true); } catch {}
        try { visual.material.dispose(); } catch {}
        try { visual.approvalMaterial.dispose(); } catch {}
        try { visual.shieldMaterial.dispose(); } catch {}
        try { visual.beaconMaterial.dispose(); } catch {}
      }
      return getSummary();
    }
  });
}

export default freeze({
  EON_CITY_W660_NEXUS_HOLOGRAM_SCHEMA,
  EON_CITY_W660_NEXUS_VISIBILITY_RADIUS,
  createEonCityW660NexusHologram
});
