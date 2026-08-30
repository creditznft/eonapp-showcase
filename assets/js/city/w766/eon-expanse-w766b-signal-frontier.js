import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents.js';
import { createEonExpanseW766CSectorStreamer } from './eon-expanse-w766c-sector-streamer.js';
import { mountEonExpanseW766IOpenWorldRenderer } from './eon-expanse-w766i-open-world-renderer.js';
import {
  EON_EXPANSE_W766_ROUTE_WIDTH,
  EON_EXPANSE_W766_ZONES,
  deriveEonExpanseW766WorldProgress
} from './eon-expanse-w766-region-contract.js';

const freeze = (value) => Object.freeze(value);
const palette = freeze({ terrain: '#080d18', circuit: '#25b6ff', violet: '#9d72ff', warm: '#ffbc62', danger: '#ff5f79', green: '#58e6b2' });
const makeMaterial = (scene, name, hex, intensity = 0.4) => {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.FromHexString(hex).scale(0.38);
  mat.emissiveColor = Color3.FromHexString(hex).scale(intensity);
  mat.specularColor = Color3.Black();
  return mat;
};

export const EON_EXPANSE_W766B_SIGNAL_FRONTIER_SCHEMA = 'eon.city.expanse.signal-frontier.w766b.v2';
export const EON_EXPANSE_W766B_ZONES = EON_EXPANSE_W766_ZONES;

export function resolveEonExpanseW766BZone(position = {}) {
  let best = null;
  for (const zone of EON_EXPANSE_W766B_ZONES) {
    const distance = Math.hypot(Number(position.x || 0) - zone.x, Number(position.z || 0) - zone.z);
    if (!best || distance < best.distance) best = freeze({ zone, distance });
  }
  return best;
}

export function mountEonExpanseW766BSignalFrontier({
  scene,
  parent = null,
  quality = 'balanced',
  reducedMotion = false,
  worldSeed = 1,
  initialMilestones = [],
  initialDiscovered = ['gateway-overlook'],
  missionLedger = null,
  initialProgress = null,
  onDiscover = null,
  onAction = null
} = {}) {
  if (!scene) return freeze({ ok: false, reason: 'canonical-scene-required' });
  const root = new TransformNode('w766b-signal-frontier-root', scene);
  if (parent) root.parent = parent;
  const materials = freeze({
    terrain: makeMaterial(scene, 'w766b-terrain', palette.terrain, 0.08),
    circuit: makeMaterial(scene, 'w766b-circuit', palette.circuit, 0.68),
    violet: makeMaterial(scene, 'w766b-violet', palette.violet, 0.65),
    warm: makeMaterial(scene, 'w766b-warm', palette.warm, 0.62),
    danger: makeMaterial(scene, 'w766b-danger', palette.danger, 0.5),
    green: makeMaterial(scene, 'w766b-green', palette.green, 0.6)
  });
  const zoneRoots = new Map();
  const discovered = new Set(['gateway-overlook', ...(initialDiscovered || [])].filter(Boolean));
  const sectorMeshes = new Map();
  const archiveRecordMeshes = new Map();
  const relayNodeMeshes = new Map();
  let progress = initialProgress || deriveEonExpanseW766WorldProgress({ milestones: initialMilestones, missionLedger });
  let currentZone = 'gateway-overlook';

  const add = (parentNode, mesh, mat, x, y, z, collisions = true) => {
    mesh.parent = parentNode;
    mesh.material = mat;
    mesh.position.set(x, y, z);
    mesh.checkCollisions = collisions;
    mesh.isPickable = false;
    return mesh;
  };
  const addDecoration = (parentNode, mesh, mat, x, y, z, collisions = true, family = 'frontier-scenery') => {
    const decoration = add(parentNode, mesh, mat, x, y, z, collisions);
    decoration.metadata = freeze({ kind: 'expanse-decoration', family, decorativeOnly: true, interactive: false, eonCityCameraOcclusion: true });
    return decoration;
  };
  const pointOnRoute = (from, to, t) => freeze({
    x: from.x + (to.x - from.x) * t,
    z: from.z + (to.z - from.z) * t
  });
  const createZoneRoot = (zone) => {
    const node = new TransformNode(`w766b-zone-${zone.id}`, scene);
    node.parent = root;
    node.metadata = freeze({ kind: 'expanse-zone', zoneId: zone.id, label: zone.label, truthfulStatus: zone.status });
    zoneRoots.set(zone.id, node);
    return node;
  };
  for (const zone of EON_EXPANSE_W766B_ZONES) createZoneRoot(zone);

  const pathPoints = EON_EXPANSE_W766B_ZONES.map((zone) => ({ x: zone.x, z: zone.z }));
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const from = pathPoints[index];
    const to = pathPoints[index + 1];
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    const route = add(
      root,
      MeshBuilder.CreateBox(`w766b-route-${index + 1}`, { width: EON_EXPANSE_W766_ROUTE_WIDTH, height: 0.2, depth: length }, scene),
      materials.terrain,
      (from.x + to.x) / 2,
      0,
      (from.z + to.z) / 2,
      true
    );
    route.rotation.y = Math.atan2(dx, dz);
    const circuit = add(
      root,
      MeshBuilder.CreateBox(`w766b-route-circuit-${index + 1}`, { width: 0.16, height: 0.04, depth: length * 0.94 }, scene),
      materials.circuit,
      (from.x + to.x) / 2,
      0.13,
      (from.z + to.z) / 2,
      false
    );
    circuit.rotation.y = route.rotation.y;

    // R06: make long frontier routes readable as authored traversal corridors,
    // without adding fake interactions. Shoulders and wayfinding pylons create
    // depth, motion parallax and a visible destination direction.
    const perpendicularX = length > 0 ? dz / length : 0;
    const perpendicularZ = length > 0 ? -dx / length : 0;
    for (const side of [-1, 1]) {
      const offset = side * (EON_EXPANSE_W766_ROUTE_WIDTH * 0.5 - 0.45);
      const shoulder = addDecoration(
        root,
        MeshBuilder.CreateBox(`w766b-route-shoulder-${index + 1}-${side < 0 ? 'l' : 'r'}`, { width: 0.18, height: 0.08, depth: length * 0.9 }, scene),
        index % 2 ? materials.violet : materials.warm,
        (from.x + to.x) / 2 + perpendicularX * offset,
        0.13,
        (from.z + to.z) / 2 + perpendicularZ * offset,
        false,
        'route-shoulder'
      );
      shoulder.rotation.y = route.rotation.y;
    }
    const markerCount = quality === 'lite' ? 2 : 4;
    for (let markerIndex = 1; markerIndex <= markerCount; markerIndex += 1) {
      const t = markerIndex / (markerCount + 1);
      const point = pointOnRoute(from, to, t);
      const side = markerIndex % 2 ? 1 : -1;
      const offset = side * (EON_EXPANSE_W766_ROUTE_WIDTH * 0.5 + 0.7);
      const px = point.x + perpendicularX * offset;
      const pz = point.z + perpendicularZ * offset;
      addDecoration(root, MeshBuilder.CreateCylinder(`w766b-route-pylon-${index + 1}-${markerIndex}`, { diameter: 0.28, height: 1.45, tessellation: 10 }, scene), materials.circuit, px, 0.78, pz, false, 'route-wayfinding');
      const cap = addDecoration(root, MeshBuilder.CreateBox(`w766b-route-pylon-cap-${index + 1}-${markerIndex}`, { width: 0.85, height: 0.1, depth: 0.16 }, scene), materials.warm, px, 1.5, pz, false, 'route-wayfinding');
      cap.rotation.y = route.rotation.y;
    }
  }

  const gatewayRoot = zoneRoots.get('gateway-overlook');
  add(gatewayRoot, MeshBuilder.CreateCylinder('w766b-gateway-overlook-deck', { diameter: 21, height: 0.8, tessellation: 64 }, scene), materials.terrain, 0, 0.1, 10, true);
  const gatewayMap = add(gatewayRoot, MeshBuilder.CreateTorus('w766b-gateway-map-ring', { diameter: 6, thickness: 0.25, tessellation: 48 }, scene), materials.circuit, -5.2, 2.1, 4.8, false);
  gatewayMap.rotation.x = Math.PI / 2;
  gatewayMap.isPickable = true;
  gatewayMap.metadata = freeze({ kind: 'expanse-map-terminal', action: 'activate-expanse-map', interactive: true });
  // Three skyline anchors make the first panorama communicate scale immediately.
  const gatewayLandmarks = [
    freeze({ x: -9.2, z: -2.5, h: 7.5, mat: materials.circuit }),
    freeze({ x: 0, z: -7.8, h: 10.5, mat: materials.warm }),
    freeze({ x: 9.2, z: -2.5, h: 8.5, mat: materials.violet })
  ];
  gatewayLandmarks.forEach((landmark, index) => {
    addDecoration(gatewayRoot, MeshBuilder.CreateBox(`w766b-gateway-landmark-${index + 1}`, { width: 1.15, height: landmark.h, depth: 1.15 }, scene), landmark.mat, landmark.x, landmark.h / 2, landmark.z, true, 'gateway-skyline');
    const crown = addDecoration(gatewayRoot, MeshBuilder.CreateTorus(`w766b-gateway-landmark-crown-${index + 1}`, { diameter: 2.1, thickness: 0.12, tessellation: 28 }, scene), landmark.mat, landmark.x, landmark.h + 0.35, landmark.z, false, 'gateway-skyline');
    crown.rotation.x = Math.PI / 2;
  });
  for (const side of [-1, 1]) {
    const safety = addDecoration(gatewayRoot, MeshBuilder.CreateBox(`w766b-gateway-safety-rail-${side < 0 ? 'l' : 'r'}`, { width: 7.5, height: 0.16, depth: 0.24 }, scene), materials.circuit, side * 6.2, 1.1, 7.4, false, 'gateway-safety');
    safety.rotation.y = side * 0.32;
  }

  const beaconRoot = zoneRoots.get('beacon-fields');
  for (let index = 0; index < (quality === 'lite' ? 8 : 16); index += 1) {
    const angle = (index / (quality === 'lite' ? 8 : 16)) * Math.PI * 2;
    const radius = 11 + (index % 4) * 2.5;
    const shard = add(beaconRoot, MeshBuilder.CreateCylinder(`w766b-beacon-shard-${index}`, { diameterTop: 0.15, diameterBottom: 1.2, height: 3 + (index % 5), tessellation: 12 }, scene), index % 3 === 0 ? materials.warm : materials.circuit, -42 + Math.sin(angle) * radius, 1.6 + (index % 5) / 2, -32 + Math.cos(angle) * radius, true);
    shard.metadata = freeze({ kind: 'expanse-decoration', family: 'beacon-shard', decorativeOnly: true, interactive: false, eonCityCameraOcclusion: true });
    shard.rotation.z = (index % 2 ? 1 : -1) * 0.08;
    if (index % 3 === 0) {
      const crossbar = addDecoration(beaconRoot, MeshBuilder.CreateBox(`w766b-beacon-crossbar-${index}`, { width: 3.4, height: 0.18, depth: 0.32 }, scene), materials.warm, shard.position.x, Math.min(4.8, shard.position.y + 1.1), shard.position.z, false, 'broken-signal-grid');
      crossbar.rotation.z = shard.rotation.z * 2.4;
      crossbar.rotation.y = angle;
    }
  }
  for (let index = 0; index < (quality === 'lite' ? 3 : 6); index += 1) {
    const trench = addDecoration(beaconRoot, MeshBuilder.CreateBox(`w766b-beacon-circuit-trench-${index}`, { width: 0.22, height: 0.06, depth: 9 + (index % 3) * 2 }, scene), index % 2 ? materials.circuit : materials.warm, -51 + index * 3.5, 0.09, -41 + (index % 2) * 12, false, 'broken-circuit-route');
    trench.rotation.y = (index % 3 - 1) * 0.35;
  }
  const beaconOne = add(beaconRoot, MeshBuilder.CreateCylinder('w766b-beacon-one', { diameterTop: 0.7, diameterBottom: 3.5, height: 12, tessellation: 32 }, scene), materials.danger, -42, 6, -32, false);
  beaconOne.isPickable = true;
  beaconOne.metadata = freeze({ kind: 'expanse-beacon-one', action: 'beacon-one-progress', interactive: true });

  const archiveRoot = zoneRoots.get('archive-ruins');
  const archiveBayCount = quality === 'lite' ? 4 : 7;
  for (let index = 0; index < archiveBayCount; index += 1) {
    const x = 30 + (index % 4) * 7.2;
    const z = -60 + Math.floor(index / 4) * 11;
    const height = 4.8 + (index % 3) * 1.7;
    for (const side of [-1, 1]) {
      const pillar = addDecoration(archiveRoot, MeshBuilder.CreateBox(`w766b-archive-pillar-${index}-${side < 0 ? 'l' : 'r'}`, { width: 1.15, height, depth: 1.35 }, scene), index % 3 === 0 ? materials.violet : materials.terrain, x + side * 2.1, height / 2, z, true, 'archive-ruin');
      pillar.rotation.y = (index % 2 ? 1 : -1) * 0.08;
    }
    const lintel = addDecoration(archiveRoot, MeshBuilder.CreateBox(`w766b-archive-lintel-${index}`, { width: 5.3, height: 0.62, depth: 1.2 }, scene), index % 2 ? materials.circuit : materials.violet, x, height - 0.45, z, true, 'archive-ruin');
    lintel.rotation.z = (index % 2 ? 1 : -1) * 0.035;
    if (index < archiveBayCount - 1) {
      const bridge = addDecoration(archiveRoot, MeshBuilder.CreateBox(`w766b-archive-bridge-${index}`, { width: 4.8, height: 0.28, depth: 1.05 }, scene), materials.terrain, x + 3.5, Math.max(2.8, height * 0.62), z - 2.7, true, 'archive-bridge');
      bridge.rotation.y = 0.42;
    }
  }
  for (let index = 0; index < 3; index += 1) {
    const recordId = `archive-record-${index}`;
    const record = add(archiveRoot, MeshBuilder.CreateBox(`w766b-${recordId}`, { width: 1.1, height: 1.6, depth: 0.35 }, scene), materials.violet, 35 + index * 6, 1.1, -46 - (index % 2) * 7, false);
    record.isPickable = true;
    record.metadata = freeze({ kind: 'expanse-archive-record', action: 'archive-record-collected', recordId });
    archiveRecordMeshes.set(recordId, record);
  }
  const routingConsole = add(archiveRoot, MeshBuilder.CreateBox('w766b-archive-routing-console', { width: 2.4, height: 1.4, depth: 1.2 }, scene), materials.circuit, 43, 0.8, -58, true);
  routingConsole.isPickable = true;
  routingConsole.metadata = freeze({ kind: 'expanse-archive-routing', action: 'archive-routing-solved', interactive: true });
  const beaconTwo = add(archiveRoot, MeshBuilder.CreateCylinder('w766b-beacon-two', { diameterTop: 0.5, diameterBottom: 2.2, height: 9, tessellation: 28 }, scene), materials.warm, 50, 4.5, -50, false);
  beaconTwo.isPickable = true;
  beaconTwo.metadata = freeze({ kind: 'expanse-beacon-two', action: 'beacon-two-repaired', interactive: true });

  const transitRoot = zoneRoots.get('transit-scar');
  for (let index = 0; index < 7; index += 1) {
    const rail = add(transitRoot, MeshBuilder.CreateBox(`w766b-transit-rail-${index}`, { width: 0.35, height: 0.25, depth: 12 }, scene), index % 2 ? materials.danger : materials.warm, -15 + index * 1.1, 0.35 + index * 0.28, -75 - index * 6, false);
    rail.rotation.x = (index % 2 ? 1 : -1) * 0.035;
  }
  for (let index = 0; index < (quality === 'lite' ? 6 : 12); index += 1) {
    const z = -77 - index * 3.1;
    addDecoration(transitRoot, MeshBuilder.CreateBox(`w766b-transit-sleeper-${index}`, { width: 9.5, height: 0.18, depth: 0.55 }, scene), materials.terrain, -12, 0.16, z, true, 'transit-scar');
    if (index % 3 === 0) {
      for (const side of [-1, 1]) addDecoration(transitRoot, MeshBuilder.CreateBox(`w766b-transit-gantry-post-${index}-${side < 0 ? 'l' : 'r'}`, { width: 0.55, height: 5.5, depth: 0.55 }, scene), materials.danger, -12 + side * 5.1, 2.75, z, true, 'transit-gantry');
      addDecoration(transitRoot, MeshBuilder.CreateBox(`w766b-transit-gantry-beam-${index}`, { width: 10.7, height: 0.45, depth: 0.55 }, scene), materials.warm, -12, 5.35, z, true, 'transit-gantry');
    }
  }
  for (let index = 0; index < 3; index += 1) {
    const relayNodeId = `relay-node-${index}`;
    const node = add(transitRoot, MeshBuilder.CreateCylinder(`w766b-${relayNodeId}`, { diameter: 1.5, height: 2.8, tessellation: 20 }, scene), materials.danger, -20 + index * 8, 1.4, -84 - (index % 2) * 8, true);
    node.isPickable = true;
    node.metadata = freeze({ kind: 'expanse-relay-node', action: 'relay-node-activated', relayNodeId });
    relayNodeMeshes.set(relayNodeId, node);
  }
  const stabilizer = add(transitRoot, MeshBuilder.CreateTorus('w766b-transit-stabilizer', { diameter: 6.5, thickness: 0.45, tessellation: 48 }, scene), materials.warm, -12, 4.5, -98, false);
  stabilizer.rotation.x = Math.PI / 2;
  stabilizer.isPickable = true;
  stabilizer.metadata = freeze({ kind: 'expanse-transit-stabilizer', action: 'transit-relay-stabilized', interactive: true });
  const transitCore = add(transitRoot, MeshBuilder.CreateBox('w766b-transit-core', { width: 3.2, height: 3.2, depth: 3.2 }, scene), materials.green, -12, 1.8, -108, true);
  transitCore.isPickable = true;
  transitCore.metadata = freeze({ kind: 'expanse-transit-core', action: 'regional-transit-restored', interactive: true });

  const vaultRoot = zoneRoots.get('horizon-vault');
  for (let index = 0; index < (quality === 'lite' ? 3 : 6); index += 1) {
    const z = -113 - index * 4.2;
    const span = 8.5 + index * 0.55;
    for (const side of [-1, 1]) addDecoration(vaultRoot, MeshBuilder.CreateBox(`w766b-vault-approach-pylon-${index}-${side < 0 ? 'l' : 'r'}`, { width: 0.8, height: 3.8 + index * 0.45, depth: 0.8 }, scene), index % 2 ? materials.warm : materials.circuit, 18 + side * span, 2 + index * 0.22, z, true, 'vault-approach');
    const arc = addDecoration(vaultRoot, MeshBuilder.CreateTorus(`w766b-vault-approach-ring-${index}`, { diameter: span * 2, thickness: 0.15, tessellation: 40 }, scene), index % 2 ? materials.violet : materials.circuit, 18, 5.3 + index * 0.15, z, false, 'vault-approach');
    arc.rotation.x = Math.PI / 2;
  }
  add(vaultRoot, MeshBuilder.CreateCylinder('w766b-vault-base', { diameter: 24, height: 2.4, tessellation: 64 }, scene), materials.terrain, 18, 1.2, -132, true);
  const vaultRing = add(vaultRoot, MeshBuilder.CreateTorus('w766b-vault-ring', { diameter: 17, thickness: 0.65, tessellation: 72 }, scene), materials.warm, 18, 8.5, -132, false);
  vaultRing.rotation.x = Math.PI / 2;
  const vaultCore = add(vaultRoot, MeshBuilder.CreateCylinder('w766b-vault-core', { diameterTop: 1, diameterBottom: 4.5, height: 13, tessellation: 40 }, scene), materials.violet, 18, 7, -132, false);
  const verificationConsole = add(vaultRoot, MeshBuilder.CreateBox('w766g-horizon-verification-console', { width: 3.2, height: 1.5, depth: 1.5 }, scene), materials.warm, 8, 0.85, -124, true);
  verificationConsole.isPickable = true;
  verificationConsole.metadata = freeze({ kind: 'expanse-horizon-verification', action: 'verify-three-signals', interactive: true });
  const syncCore = add(vaultRoot, MeshBuilder.CreateCylinder('w766g-horizon-sync-core', { diameter: 3.2, height: 4.8, tessellation: 32 }, scene), materials.violet, 18, 2.6, -132, true);
  syncCore.isPickable = true;
  syncCore.metadata = freeze({ kind: 'expanse-regional-core', action: 'synchronize-regional-core', interactive: true });
  const horizonTransit = add(vaultRoot, MeshBuilder.CreateTorus('w766g-horizon-transit-anchor', { diameter: 6.4, thickness: 0.5, tessellation: 48 }, scene), materials.danger, 29, 2.3, -125, false);
  horizonTransit.rotation.x = Math.PI / 2;
  horizonTransit.isPickable = true;
  horizonTransit.metadata = freeze({ kind: 'expanse-horizon-transit', action: 'unlock-horizon-transit', interactive: true });
  const vaultDoor = add(vaultRoot, MeshBuilder.CreateBox('w766g-vault-route-door', { width: 7, height: 8, depth: 1 }, scene), materials.warm, 18, 4.1, -143, true);
  vaultDoor.isPickable = true;
  vaultDoor.metadata = freeze({ kind: 'expanse-vault-route', action: 'open-vault-route', interactive: true });
  const vaultChamber = add(vaultRoot, MeshBuilder.CreateCylinder('w766g-vault-chamber', { diameter: 11, height: 1, tessellation: 48 }, scene), materials.violet, 18, 0.7, -150, true);
  vaultChamber.isPickable = true;
  vaultChamber.metadata = freeze({ kind: 'expanse-vault-chamber', action: 'enter-vault-chamber', interactive: true });
  const rewardPedestal = add(vaultRoot, MeshBuilder.CreateCylinder('w766g-signal-vanguard-pedestal', { diameterTop: 1.4, diameterBottom: 3.4, height: 3.2, tessellation: 32 }, scene), materials.warm, 18, 2.1, -150, false);
  rewardPedestal.isPickable = true;
  rewardPedestal.metadata = freeze({ kind: 'expanse-vault-reveal', action: 'claim-signal-vanguard', interactive: true });
  const rewardHalo = add(vaultRoot, MeshBuilder.CreateTorus('w766g-signal-vanguard-halo', { diameter: 5, thickness: 0.22, tessellation: 64 }, scene), materials.circuit, 18, 5.8, -150, false);
  rewardHalo.rotation.x = Math.PI / 2;
  rewardHalo.metadata = freeze({ kind: 'expanse-cosmetic-activation', action: 'activate-signal-vanguard', interactive: true });

  function applyProgress(next = progress) {
    progress = next || progress;
    beaconOne.material = progress.beaconOneStage >= 3 ? materials.green : progress.beaconOneStage > 0 ? materials.warm : materials.danger;
    beaconOne.isPickable = progress.beaconOneStage < 3;
    for (const [recordId, mesh] of archiveRecordMeshes) mesh.setEnabled?.(!progress.archiveRecordIds.includes(recordId));
    routingConsole.material = progress.archiveRoutingSolved ? materials.green : materials.circuit;
    beaconTwo.material = progress.beaconTwoRepaired ? materials.green : materials.warm;
    beaconTwo.isPickable = !progress.beaconTwoRepaired;
    for (const [nodeId, mesh] of relayNodeMeshes) {
      const active = progress.activatedRelayNodeIds.includes(nodeId);
      mesh.material = active ? materials.green : materials.danger;
      mesh.isPickable = !active;
    }
    stabilizer.material = progress.transitRelayStabilized ? materials.green : materials.warm;
    transitCore.material = progress.regionalTransitRestored ? materials.green : materials.danger;
    verificationConsole.material = progress.threeSignalsVerified ? materials.green : materials.warm;
    vaultCore.material = progress.regionalCoreSynchronized ? materials.green : materials.violet;
    vaultRing.material = progress.regionalCoreSynchronized ? materials.circuit : materials.warm;
    horizonTransit.material = progress.horizonTransitUnlocked ? materials.green : materials.danger;
    vaultDoor.setEnabled?.(!progress.vaultRouteOpened);
    vaultChamber.setEnabled?.(progress.vaultRouteOpened);
    rewardPedestal.setEnabled?.(progress.vaultChamberEntered);
    rewardPedestal.material = progress.signalVanguardClaimed ? materials.green : materials.warm;
    rewardPedestal.isPickable = progress.vaultChamberEntered && !progress.signalVanguardClaimed;
    rewardHalo.setEnabled?.(progress.signalVanguardClaimed);
    rewardHalo.isPickable = progress.signalVanguardClaimed && !progress.signalVanguardActivated;
    rewardHalo.material = progress.signalVanguardActivated ? materials.green : materials.circuit;
    return getProgressSummary();
  }

  function getProgressSummary() {
    return freeze({
      beaconOneStage: progress.beaconOneStage,
      archiveRecordCount: progress.archiveRecordCount,
      archiveRoutingSolved: progress.archiveRoutingSolved,
      beaconTwoRepaired: progress.beaconTwoRepaired,
      activatedRelayNodes: progress.activatedRelayNodeIds.length,
      transitRelayStabilized: progress.transitRelayStabilized,
      regionalTransitRestored: progress.regionalTransitRestored,
      threeSignalsVerified: progress.threeSignalsVerified,
      regionalCoreSynchronized: progress.regionalCoreSynchronized,
      horizonTransitUnlocked: progress.horizonTransitUnlocked,
      vaultRouteOpened: progress.vaultRouteOpened,
      vaultChamberEntered: progress.vaultChamberEntered,
      signalVanguardClaimed: progress.signalVanguardClaimed,
      signalVanguardActivated: progress.signalVanguardActivated,
      campaignComplete: progress.campaignComplete
    });
  }

  function emit(action, detail = {}) {
    onAction?.(freeze({ action, ...detail }));
  }

  const handleInteraction = (event) => {
    if (event?.type !== PointerEventTypes.POINTERPICK) return;
    const picked = event?.pickInfo?.pickedMesh;
    const metadata = picked?.metadata || {};
    if (!event?.pickInfo?.hit || !metadata.action) return;
    if (metadata.action === 'frontier-contract-interaction') {
      emit('frontier-contract-interaction', { contract: metadata.contract, sectorId: metadata.sectorId, landmark: metadata.landmark, explicitUserAction: true });
      return;
    }
    if (metadata.action === 'frontier-contract-step') {
      emit('frontier-contract-step', { contract: metadata.contract, sectorId: metadata.sectorId, stepId: metadata.stepId, stepIndex: metadata.stepIndex, step: metadata.step, explicitUserAction: true });
      return;
    }
    if (metadata.action === 'procedural-discovery-reviewed') {
      emit('procedural-discovery-reviewed', { discovery: metadata.discovery, visual: metadata.visual, explicitUserAction: true });
      return;
    }
    if (metadata.action === 'activate-expanse-map') {
      emit('activate-expanse-map', { complete: true });
      return;
    }
    if (metadata.action === 'beacon-one-progress') {
      const actions = ['beacon-one-scanned', 'signal-components-recovered', 'beacon-one-repaired'];
      if (progress.beaconOneStage >= actions.length) return;
      const stage = progress.beaconOneStage + 1;
      progress = freeze({ ...progress, beaconOneStage: stage });
      applyProgress(progress);
      emit(actions[stage - 1], { beaconId: 'beacon-one', stage, complete: stage >= actions.length });
      return;
    }
    if (metadata.action === 'archive-record-collected') {
      if (progress.archiveRecordIds.includes(metadata.recordId)) return;
      const ids = freeze([...progress.archiveRecordIds, metadata.recordId]);
      progress = freeze({ ...progress, archiveRecordIds: ids, archiveRecordCount: ids.length });
      applyProgress(progress);
      emit(ids.length >= 3 ? 'archive-records-recovered' : 'archive-record-collected', { recordId: metadata.recordId, count: ids.length, complete: ids.length >= 3 });
      return;
    }
    if (metadata.action === 'archive-routing-solved') {
      if (progress.archiveRecordCount < 3) return emit('archive-routing-blocked', { reason: 'archive-records-required' });
      if (progress.archiveRoutingSolved) return;
      progress = freeze({ ...progress, archiveRoutingSolved: true });
      applyProgress(progress);
      return emit('archive-routing-solved', { complete: true });
    }
    if (metadata.action === 'beacon-two-repaired') {
      if (!progress.archiveRoutingSolved) return emit('beacon-two-blocked', { reason: 'routing-solution-required' });
      if (progress.beaconTwoRepaired) return;
      progress = freeze({ ...progress, beaconTwoRepaired: true });
      applyProgress(progress);
      return emit('beacon-two-repaired', { complete: true });
    }
    if (metadata.action === 'relay-node-activated') {
      if (progress.activatedRelayNodeIds.includes(metadata.relayNodeId)) return;
      const ids = freeze([...progress.activatedRelayNodeIds, metadata.relayNodeId]);
      progress = freeze({ ...progress, activatedRelayNodeIds: ids });
      applyProgress(progress);
      return emit(ids.length >= 3 ? 'relay-nodes-activated' : 'relay-node-activated', { relayNodeId: metadata.relayNodeId, count: ids.length, complete: ids.length >= 3 });
    }
    if (metadata.action === 'transit-relay-stabilized') {
      if (progress.activatedRelayNodeIds.length < 3) return emit('transit-stabilizer-blocked', { reason: 'relay-nodes-required' });
      if (progress.transitRelayStabilized) return;
      progress = freeze({ ...progress, transitRelayStabilized: true });
      applyProgress(progress);
      return emit('transit-relay-stabilized', { complete: true });
    }
    if (metadata.action === 'regional-transit-restored') {
      if (!progress.transitRelayStabilized) return emit('regional-transit-blocked', { reason: 'stabilization-required' });
      if (progress.regionalTransitRestored) return;
      progress = freeze({ ...progress, regionalTransitRestored: true });
      applyProgress(progress);
      return emit('regional-transit-restored', { complete: true });
    }
    if (metadata.action === 'verify-three-signals') {
      if (!(progress.beaconOneStage >= 3 && progress.beaconTwoRepaired && progress.regionalTransitRestored)) return emit('horizon-verification-blocked', { reason: 'three-restored-signals-required' });
      if (progress.threeSignalsVerified) return;
      progress = freeze({ ...progress, threeSignalsVerified: true });
      applyProgress(progress);
      return emit('three-signals-verified', { complete: true });
    }
    if (metadata.action === 'synchronize-regional-core') {
      if (!progress.threeSignalsVerified) return emit('regional-core-blocked', { reason: 'signal-verification-required' });
      if (progress.regionalCoreSynchronized) return;
      progress = freeze({ ...progress, regionalCoreSynchronized: true });
      applyProgress(progress);
      return emit('regional-core-synchronized', { complete: true });
    }
    if (metadata.action === 'unlock-horizon-transit') {
      if (!progress.regionalCoreSynchronized) return emit('horizon-transit-blocked', { reason: 'regional-core-required' });
      if (progress.horizonTransitUnlocked) return;
      progress = freeze({ ...progress, horizonTransitUnlocked: true });
      applyProgress(progress);
      return emit('horizon-transit-unlocked', { complete: true });
    }
    if (metadata.action === 'open-vault-route') {
      if (!progress.horizonTransitUnlocked) return emit('vault-route-blocked', { reason: 'horizon-transit-required' });
      if (progress.vaultRouteOpened) return;
      progress = freeze({ ...progress, vaultRouteOpened: true });
      applyProgress(progress);
      return emit('vault-route-opened', { complete: true });
    }
    if (metadata.action === 'enter-vault-chamber') {
      if (!progress.vaultRouteOpened) return emit('vault-entry-blocked', { reason: 'vault-route-required' });
      if (progress.vaultChamberEntered) return;
      progress = freeze({ ...progress, vaultChamberEntered: true });
      applyProgress(progress);
      return emit('vault-chamber-entered', { complete: true });
    }
    if (metadata.action === 'claim-signal-vanguard') {
      if (!progress.vaultChamberEntered) return emit('vault-reveal-blocked', { reason: 'vault-entry-required' });
      if (progress.signalVanguardClaimed) return;
      progress = freeze({ ...progress, signalVanguardClaimed: true });
      applyProgress(progress);
      return emit('signal-vanguard-claimed', { complete: true, cosmeticId: 'signal-vanguard-glow' });
    }
    if (metadata.action === 'activate-signal-vanguard') {
      if (!progress.signalVanguardClaimed) return emit('cosmetic-activation-blocked', { reason: 'reward-claim-required' });
      if (progress.signalVanguardActivated) return;
      progress = freeze({ ...progress, signalVanguardActivated: true });
      applyProgress(progress);
      return emit('signal-vanguard-activated', { complete: true, cosmeticId: 'signal-vanguard-glow' });
    }
  };
  // L95: the authored route/zone base is transform-static. Progress changes
  // material/enabled truth, not placement, so freeze matrices before the
  // streamed open-world renderer adds its dynamic sector meshes.
  const staticBaseMeshes = root.getChildMeshes?.(false) || [];
  let staticBaseMeshCount = 0;
  for (const mesh of staticBaseMeshes) {
    try { mesh.freezeWorldMatrix?.(); staticBaseMeshCount += 1; } catch {}
  }

  const pointerObserver = scene.onPointerObservable?.add?.(handleInteraction);

  const openWorld = mountEonExpanseW766IOpenWorldRenderer({
    scene,
    parent: root,
    worldSeed,
    quality,
    reducedMotion,
    authoredZones: EON_EXPANSE_W766B_ZONES
  });
  if (!openWorld.ok) return freeze({ ok: false, reason: `open-world-renderer-failed:${openWorld.reason || 'unknown'}` });

  const streamer = createEonExpanseW766CSectorStreamer({
    worldSeed,
    quality,
    mountSector(plan, ringName) {
      const node = openWorld.mountSector(plan, ringName);
      sectorMeshes.set(plan.id, node);
      return node;
    },
    unmountSector(record) {
      openWorld.unmountSector(record);
      sectorMeshes.delete(record.id);
    }
  });

  applyProgress(progress);
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W766B_SIGNAL_FRONTIER_SCHEMA,
    root,
    applyProgress,
    interact(metadata = {}, { source = 'expanse-proximity', explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      if (!metadata?.action) return freeze({ ok: false, reason: 'interaction-action-required' });
      return handleInteraction({ type: PointerEventTypes.POINTERPICK, pickInfo: { hit: true, pickedMesh: { metadata: freeze({ ...metadata, explicitUserAction }), name: source } } }) || freeze({ ok: true, action: metadata.action });
    },
    resume() { return freeze({ ok: true }); },
    suspend() {
      streamer.disposeAll();
      const continuity = openWorld.suspend();
      return freeze({ ok: true, streamedSectorsDisposed: true, continuity });
    },
    update(position = {}, seconds = 0) {
      const nearest = resolveEonExpanseW766BZone(position);
      if (nearest && nearest.distance <= nearest.zone.radius && !discovered.has(nearest.zone.id)) {
        discovered.add(nearest.zone.id);
        onDiscover?.(freeze({ id: nearest.zone.id, label: nearest.zone.label, distance: nearest.distance }));
      }
      if (nearest && nearest.distance <= nearest.zone.radius) currentZone = nearest.zone.id;
      const stream = streamer.update(position);
      const continuity = openWorld.refresh({ position, sectorRecords: streamer.getMountedRecords() });
      const openWorldSummary = openWorld.update(seconds);
      return freeze({ currentZone, nearest, stream, continuity, openWorld: openWorldSummary, discovered: freeze([...discovered]) });
    },
    getSummary() {
      return freeze({
        schema: EON_EXPANSE_W766B_SIGNAL_FRONTIER_SCHEMA,
        zones: EON_EXPANSE_W766B_ZONES,
        currentZone,
        discovered: freeze([...discovered]),
        streamer: streamer.getSummary(),
        openWorld: openWorld.getSummary(),
        canonicalScene: root.getScene?.() === scene,
        hardWorldEdgeShown: false,
        staticBaseWorldMatrices: true,
        staticBaseMeshCount,
        ...getProgressSummary()
      });
    },
    dispose() {
      try { if (pointerObserver) scene.onPointerObservable?.remove?.(pointerObserver); } catch {}
      streamer.disposeAll();
      openWorld.dispose();
      for (const mat of Object.values(materials)) try { mat.dispose?.(); } catch {}
      try { root.dispose?.(false, true); } catch {}
      return freeze({ ok: true });
    }
  });
}
