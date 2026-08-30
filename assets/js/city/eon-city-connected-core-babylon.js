/** W660Y — connected Core renderer inside the existing Babylon scene/update. */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { buildEonCityConnectedCorePlan, validateEonCityConnectedCorePlan } from './eon-city-connected-core.js';
import { createEonCityW674OrientationDistrictBeltRenderer } from './w674/eon-city-w674-orientation-district-belt-babylon.js';
import { createEonCityW677TransitCapsuleController } from './w677/eon-city-w677-transit-capsule-journey.js';
import { createEonCityW690DistrictBeltsBabylonRenderer } from './w690/eon-city-w690-district-belts-babylon.js';

export const EON_CITY_CONNECTED_CORE_BABYLON_SCHEMA = 'eon.city.connected-core-babylon.w660y.v1';
const freeze = (value) => Object.freeze(value);
function color(value, fallback = '#55eaff') { try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); } }
function material(scene, name, diffuse, emissive, intensity = 0.3, alpha = 1) { const m = new StandardMaterial(name, scene); m.diffuseColor = color(diffuse, '#101827'); m.emissiveColor = color(emissive, '#55eaff').scale(intensity); m.specularColor = Color3.Black(); m.alpha = alpha; m.backFaceCulling = alpha >= 0.98; return m; }
function dispose(node) { try { node?.dispose?.(false, false); } catch { try { node?.dispose?.(); } catch {} } }
function pathPoint(path = [], progress = 0) {
  if (!Array.isArray(path) || path.length < 2) return { x: 0, z: 0, heading: 0 };
  const segments = path.length - 1; const scaled = (((progress % 1) + 1) % 1) * segments; const index = Math.min(segments - 1, Math.floor(scaled)); const local = scaled - index;
  const a = path[index]; const b = path[index + 1]; const dx = Number(b.x) - Number(a.x); const dz = Number(b.z) - Number(a.z);
  return { x: Number(a.x) + dx * local, z: Number(a.z) + dz * local, heading: Math.atan2(dx, dz) };
}
function segment(scene, parent, edge, mat, width, y, kind) {
  const dx = edge.to.x - edge.from.x; const dz = edge.to.z - edge.from.z; const length = Math.max(0.2, Math.hypot(dx, dz));
  const mesh = MeshBuilder.CreateBox(`w660y-${kind}-${edge.id}`, { width, depth: length, height: 0.045 }, scene);
  mesh.parent = parent; mesh.position.set((edge.from.x + edge.to.x) / 2, y, (edge.from.z + edge.to.z) / 2); mesh.rotation.y = Math.atan2(dx, dz); mesh.material = mat; mesh.isPickable = false;
  mesh.metadata = freeze({ kind, edgeId: edge.id, fromId: edge.fromId, toId: edge.toId, automaticNavigation: false, localOnly: true });
  return mesh;
}
function districtIdentityNode(mesh, parent, position, mat, metadata, collection, rotation = null) {
  mesh.parent = parent; mesh.position.set(position.x, position.y, position.z); if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0); mesh.material = mat; mesh.isPickable = false; mesh.metadata = freeze({ automaticNavigation: false, automaticExecution: false, localOnly: true, ...metadata }); collection.push(mesh); return mesh;
}
function createDistrictStreetLandmark(scene, parent, identity, primary, accent, collection) {
  const p = identity.signatureLandmark.position; const h = identity.signatureLandmark.height; const meta = { kind: 'district-street-signature-landmark', districtId: identity.id, landmarkId: identity.signatureLandmark.id, form: identity.form, purposeLine: identity.purposeLine, interactive: false };
  if (identity.form === 'arrival-spire') {
    districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-spire`, { height: h, diameterTop: 0.12, diameterBottom: 1.05, tessellation: 12 }, scene), parent, { x:p.x,y:h/2,z:p.z }, primary, meta, collection);
    districtIdentityNode(MeshBuilder.CreateTorus(`${identity.id}-street-spire-ring`, { diameter: 1.5, thickness: 0.08, tessellation: 32 }, scene), parent, { x:p.x,y:h*.62,z:p.z }, accent, { ...meta, kind: 'district-street-signature-ring' }, collection, { x:Math.PI/2 });
  } else if (identity.form === 'signal-ring') {
    districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-signal-column`, { height: h*.72, diameter: 0.62, tessellation: 12 }, scene), parent, { x:p.x,y:h*.36,z:p.z }, primary, meta, collection);
    districtIdentityNode(MeshBuilder.CreateTorus(`${identity.id}-street-signal-ring`, { diameter: 2.3, thickness: 0.12, tessellation: 36 }, scene), parent, { x:p.x,y:h*.7,z:p.z }, accent, { ...meta, kind: 'district-street-signature-ring' }, collection, { x:Math.PI/2 });
  } else if (identity.form === 'review-steps') {
    for (let level=0; level<3; level+=1) districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-review-step-${level}`, { height: .34, diameter: 2.5-level*.5, tessellation: 24 }, scene), parent, { x:p.x,y:.17+level*.31,z:p.z+level*.16 }, level===2?accent:primary, meta, collection);
  } else if (identity.form === 'creator-frame') {
    for (const side of [-1,1]) districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-frame-${side}`, { width:.26,depth:.42,height:h*.78 }, scene), parent, { x:p.x+side*1.05,y:h*.39,z:p.z }, primary, meta, collection);
    districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-frame-bridge`, { width:2.35,depth:.42,height:.24 }, scene), parent, { x:p.x,y:h*.76,z:p.z }, accent, { ...meta, kind:'district-street-signature-bridge' }, collection);
  } else if (identity.form === 'forge-stack') {
    districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-forge-stack`, { width:1.45,depth:1.45,height:h*.72 }, scene), parent, { x:p.x,y:h*.36,z:p.z }, primary, meta, collection, { y:.2 });
    districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-forge-vent`, { height:h*.48,diameterTop:.18,diameterBottom:.68,tessellation:8 }, scene), parent, { x:p.x,y:h*.96,z:p.z }, accent, { ...meta, kind:'district-street-signature-vent' }, collection);
  } else if (identity.form === 'command-prism') {
    districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-command-prism`, { width:1.55,depth:1.55,height:h }, scene), parent, { x:p.x,y:h/2,z:p.z }, primary, meta, collection, { y:Math.PI/4 });
    districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-command-cap`, { width:1.9,depth:1.9,height:.18 }, scene), parent, { x:p.x,y:h*.82,z:p.z }, accent, { ...meta, kind:'district-street-signature-cap' }, collection, { y:Math.PI/4 });
  } else if (identity.form === 'knowledge-canopy') {
    districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-knowledge-trunk`, { height:h*.68,diameterTop:.38,diameterBottom:.82,tessellation:10 }, scene), parent, { x:p.x,y:h*.34,z:p.z }, primary, meta, collection);
    districtIdentityNode(MeshBuilder.CreateSphere(`${identity.id}-street-knowledge-canopy`, { diameter:2.4,segments:14 }, scene), parent, { x:p.x,y:h*.78,z:p.z }, accent, { ...meta, kind:'district-street-signature-canopy' }, collection);
  } else if (identity.form === 'vault-monolith') {
    districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-vault-monolith`, { width:1.55,depth:1.2,height:h }, scene), parent, { x:p.x,y:h/2,z:p.z }, primary, meta, collection);
    districtIdentityNode(MeshBuilder.CreateTorus(`${identity.id}-street-vault-seal`, { diameter:1.05,thickness:.12,tessellation:28 }, scene), parent, { x:p.x,y:h*.55,z:p.z-.63 }, accent, { ...meta, kind:'district-street-signature-seal' }, collection);
  } else if (identity.form === 'civic-dome') {
    districtIdentityNode(MeshBuilder.CreateCylinder(`${identity.id}-street-civic-base`, { height:h*.32,diameter:2.3,tessellation:24 }, scene), parent, { x:p.x,y:h*.16,z:p.z }, primary, meta, collection);
    const dome = districtIdentityNode(MeshBuilder.CreateSphere(`${identity.id}-street-civic-dome`, { diameter:2.2,segments:16 }, scene), parent, { x:p.x,y:h*.48,z:p.z }, accent, { ...meta, kind:'district-street-signature-dome' }, collection); dome.scaling.y=.55;
  } else districtIdentityNode(MeshBuilder.CreateBox(`${identity.id}-street-district-prism`, { width:1.4,depth:1.4,height:h }, scene), parent, { x:p.x,y:h/2,z:p.z }, primary, meta, collection);
}

export function createEonCityConnectedCoreBabylonRenderer({ scene, parent = null, quality = 'balanced', reducedEffects = false, mode = 'explore', transformations = [] } = {}) {
  if (!scene) throw new Error('connected-core-scene-required');
  const host = new TransformNode('w660y-connected-core-root', scene); host.parent = parent || null;
  const content = new TransformNode('w660y-connected-core-content', scene); content.parent = host;
  let plan = buildEonCityConnectedCorePlan({ quality, reducedEffects, mode, transformations });
  const orientationBeltRenderer = createEonCityW674OrientationDistrictBeltRenderer({
    scene,
    parent: content,
    quality,
    reducedEffects,
    mode
  });
  const districtBeltsRenderer = createEonCityW690DistrictBeltsBabylonRenderer({
    scene,
    parent: content,
    quality,
    reducedEffects,
    mode
  });
  let materials = []; let capsules = []; let ambient = []; let gatewayNodes = []; let fabricNodes = []; let districtIdentityNodes = []; let disposed = false; let visible = true;
  const reviewedTransitController = createEonCityW677TransitCapsuleController({ now: () => globalThis.performance?.now?.() || Date.now() });

  const render = () => {
    const validation = validateEonCityConnectedCorePlan(plan);
    if (!validation.ok) return freeze({ ok: false, errors: validation.errors });
    const road = material(scene, 'w660y-road', '#111923', '#55eaff', 0.08);
    const pedestrian = material(scene, 'w660y-pedestrian', '#1a2030', '#ad78ff', 0.18);
    const lane = material(scene, 'w660y-lane', '#1d2938', '#ffc45c', 0.65);
    const station = material(scene, 'w660y-station', '#142436', '#55eaff', 0.52);
    const dock = material(scene, 'w660y-dock', '#17202c', '#75f7cf', 0.5);
    const npc = material(scene, 'w660y-ambient-npc', '#182232', '#8aa5ff', 0.42);
    const gatewayCyan = material(scene, 'w662f-living-nexus-gateway-cyan', '#071722', '#55eaff', 0.92, 0.96);
    const gatewayGold = material(scene, 'w662f-living-nexus-gateway-gold', '#251b0b', '#ffda73', 0.88, 0.94);
    const gatewayGlass = material(scene, 'w662f-living-nexus-gateway-glass', '#08131e', '#75f7cf', 0.32, 0.28);
    const fabricGround = material(scene, 'w710-continuous-core-ground', '#080d14', '#21364a', 0.09);
    const fabricVoid = material(scene, 'w710-continuous-core-underside', '#010204', '#010204', 0.01);
    const fabricRoad = material(scene, 'w710-road-foundation', '#0b121b', '#315a72', 0.1);
    const fabricBlock = material(scene, 'w710-infill-block', '#101827', '#4d7e9d', 0.18);
    const fabricBlockAccent = material(scene, 'w710-infill-block-accent', '#17152a', '#8d6cff', 0.2);
    const fabricPlaza = material(scene, 'w710-public-plaza', '#111b22', '#75f7cf', 0.22);
    const skylineNear = material(scene, 'w710-skyline-near', '#0d1520', '#40708e', 0.16);
    const skylineMid = material(scene, 'w710-skyline-mid', '#09111b', '#31576f', 0.12);
    const skylineFar = material(scene, 'w710-skyline-far', '#060c13', '#244253', 0.08);
    const borderMaterial = material(scene, 'w710-border-corridor', '#0d1720', '#55eaff', 0.24);
    materials = [road, pedestrian, lane, station, dock, npc, gatewayCyan, gatewayGold, gatewayGlass, fabricGround, fabricVoid, fabricRoad, fabricBlock, fabricBlockAccent, fabricPlaza, skylineNear, skylineMid, skylineFar, borderMaterial];

    const fabric = plan.continuousFabric;
    const deck = MeshBuilder.CreateBox('w710-continuous-core-deck', { width: fabric.continuousGround.width, depth: fabric.continuousGround.depth, height: fabric.continuousGround.thickness }, scene);
    deck.parent = content; deck.position.set(fabric.continuousGround.center.x, fabric.continuousGround.topY - fabric.continuousGround.thickness / 2, fabric.continuousGround.center.z); deck.material = fabricGround; deck.isPickable = false;
    deck.metadata = freeze({ kind: 'continuous-core-ground', seamless: true, occupiedCellRatio: fabric.coverage.occupiedCellRatio, localOnly: true }); fabricNodes.push(deck);
    const shield = MeshBuilder.CreateBox('w710-continuous-core-underside-shield', { width: fabric.undersideShield.width, depth: fabric.undersideShield.depth, height: fabric.undersideShield.height }, scene);
    shield.parent = content; shield.position.set(fabric.undersideShield.center.x, fabric.undersideShield.center.y, fabric.undersideShield.center.z); shield.material = fabricVoid; shield.isPickable = false;
    shield.metadata = freeze({ kind: 'continuous-core-underside-shield', opaqueFromBelow: true, localOnly: true }); fabricNodes.push(shield);
    for (const corridor of fabric.roads) {
      const foundation = segment(scene, content, corridor, fabricRoad, corridor.width, 0.002, 'continuous-core-road-foundation');
      foundation.metadata = freeze({ ...foundation.metadata, hierarchy: corridor.kind, sidewalkWidth: corridor.sidewalkWidth, localOnly: true }); fabricNodes.push(foundation);
    }
    for (const block of fabric.infillBlocks) {
      const node = MeshBuilder.CreateBox(block.id, { width: block.width, depth: block.depth, height: block.height }, scene);
      node.parent = content; node.position.set(block.position.x, block.position.y, block.position.z); node.rotation.y = block.rotationY; node.material = block.family === 'garden-tower' || block.family === 'archive-slab' ? fabricBlockAccent : fabricBlock; node.isPickable = false;
      node.metadata = freeze({ kind: 'continuous-core-infill-block', fabricId: block.id, family: block.family, sanctumPreserved: true, interactive: false, localOnly: true }); fabricNodes.push(node);
    }
    for (const plaza of fabric.plazas) {
      const node = MeshBuilder.CreateCylinder(plaza.id, { diameter: plaza.radius * 2, height: 0.055, tessellation: 28 }, scene);
      node.parent = content; node.position.set(plaza.position.x, plaza.position.y, plaza.position.z); node.material = fabricPlaza; node.isPickable = false;
      node.metadata = freeze({ kind: 'continuous-core-public-plaza', fabricId: plaza.id, identity: plaza.identity, automaticAction: false, localOnly: true }); fabricNodes.push(node);
    }
    const skylineMaterials = { near: skylineNear, mid: skylineMid, far: skylineFar };
    for (const layer of fabric.skylineLayers) {
      for (const skyline of layer.nodes) {
        const node = MeshBuilder.CreateBox(skyline.id, { width: skyline.width, depth: skyline.depth, height: skyline.height }, scene);
        node.parent = content; node.position.set(skyline.position.x, skyline.position.y, skyline.position.z); node.material = skylineMaterials[layer.id] || skylineFar; node.isPickable = false; node.checkCollisions = false;
        node.metadata = freeze({ kind: `continuous-core-skyline-${layer.id}`, fabricId: skyline.id, silhouette: skyline.silhouette, horizonOnly: skyline.horizonOnly, localOnly: true }); fabricNodes.push(node);
      }
    }
    for (const corridor of fabric.borderCorridors) {
      const node = segment(scene, content, corridor, borderMaterial, corridor.width, 0.012, 'continuous-core-border-corridor');
      node.metadata = freeze({ kind: 'continuous-core-border-corridor', corridorId: corridor.id, districtId: corridor.districtId, flagshipGateway: corridor.flagshipGateway, visibleContinuation: true, automaticEntry: false, automaticNavigation: false, localOnly: true }); fabricNodes.push(node);
    }
    for (const edge of plan.streetConnections) {
      const isTransit = edge.kind === 'transit-loop';
      segment(scene, content, edge, isTransit ? road : pedestrian, isTransit ? 1.05 : 0.52, isTransit ? 0.018 : 0.052, isTransit ? 'connected-core-transit-street' : 'connected-core-pedestrian-link');
      if (isTransit) segment(scene, content, edge, lane, 0.055, 0.061, 'connected-core-transit-lane');
      const lampCount = Math.max(1, Math.floor(edge.length / plan.livingStreets.lampSpacing));
      for (let index = 1; index <= lampCount; index += 1) {
        const t = index / (lampCount + 1); const x = edge.from.x + (edge.to.x - edge.from.x) * t; const z = edge.from.z + (edge.to.z - edge.from.z) * t;
        const lamp = MeshBuilder.CreateCylinder(`w660y-lamp-${edge.id}-${index}`, { height: 0.9, diameter: 0.07, tessellation: 8 }, scene);
        lamp.parent = content; lamp.position.set(x + (index % 2 ? 0.46 : -0.46), 0.45, z); lamp.material = lane; lamp.isPickable = false;
        lamp.metadata = freeze({ kind: 'connected-core-street-lamp', edgeId: edge.id, localOnly: true });
      }
    }
    for (const district of plan.districts) {
      const districtMat = material(scene, `w660y-${district.id}`, district.palette.primary, district.palette.accent, district.transformationActive ? 0.95 : 0.48);
      materials.push(districtMat);
      const streetIdentity = plan.districtStreetIdentity.districts.find((entry) => entry.id === district.id);
      if (streetIdentity) {
        const boulevard = segment(scene, content, streetIdentity.boulevard, districtMat, streetIdentity.boulevard.width, 0.068, 'district-arrival-boulevard'); boulevard.metadata = freeze({ kind:'district-arrival-boulevard', districtId:district.id, purposeLine:streetIdentity.purposeLine, pedestrianSafe:true, automaticNavigation:false, localOnly:true }); districtIdentityNodes.push(boulevard);
        const court = districtIdentityNode(MeshBuilder.CreateCylinder(`${district.id}-street-arrival-court`, { diameter:streetIdentity.arrivalCourt.radius*2,height:.09,tessellation:30 }, scene), content, streetIdentity.arrivalCourt.position, station, { kind:'district-arrival-court',districtId:district.id,purposeLine:streetIdentity.purposeLine,reviewFirst:true }, districtIdentityNodes);
        court.position.y=.055;
        for (const [side,pylon] of [['left',streetIdentity.identityGateway.pylonLeft],['right',streetIdentity.identityGateway.pylonRight]]) districtIdentityNode(MeshBuilder.CreateBox(`${district.id}-street-identity-pylon-${side}`, { width:.28,depth:.46,height:streetIdentity.identityGateway.height }, scene), content, pylon, districtMat, { kind:'district-street-identity-gateway',districtId:district.id,purposeLine:streetIdentity.purposeLine }, districtIdentityNodes);
        createDistrictStreetLandmark(scene, content, streetIdentity, districtMat, lane, districtIdentityNodes);
        for (const marker of streetIdentity.wayfinding) districtIdentityNode(MeshBuilder.CreateCylinder(marker.id, { height:.18,diameter:.46,tessellation:12 }, scene), content, marker.position, lane, { kind:'district-street-wayfinding-marker',districtId:district.id,targetId:marker.targetId,actionKind:marker.actionKind,label:marker.label,interactive:false }, districtIdentityNodes);
      }
      const platform = MeshBuilder.CreateCylinder(`w660y-station-${district.id}`, { diameter: 1.65, height: 0.11, tessellation: 28 }, scene);
      platform.parent = content; platform.position.set(district.center.x, 0.07, district.center.z); platform.material = station; platform.isPickable = false;
      platform.metadata = freeze({ kind: 'connected-core-station', stationId: district.stationId, districtId: district.id, explicitTravelReviewRequired: true, automaticTravel: false, localOnly: true });
      const ring = MeshBuilder.CreateTorus(`w660y-station-ring-${district.id}`, { diameter: 1.35, thickness: 0.055, tessellation: 28 }, scene);
      ring.parent = content; ring.position.set(district.center.x, 0.17, district.center.z); ring.rotation.x = Math.PI / 2; ring.material = districtMat; ring.isPickable = false;
      ring.metadata = freeze({ kind: 'connected-core-district-identity', districtId: district.id, label: district.label, signature: district.signature, localOnly: true });
      const beacon = MeshBuilder.CreateCylinder(`w660y-beacon-${district.id}`, { diameter: 0.11, height: 1.8, tessellation: 10 }, scene);
      beacon.parent = content; beacon.position.set(district.center.x, 0.92, district.center.z); beacon.material = districtMat; beacon.isPickable = false;
    }
    const gateway = plan.physicalGateway;
    if (gateway && orientationBeltRenderer.getSummary().expanseGateVisible !== true) {
      const threshold = MeshBuilder.CreateBox('w662f-living-nexus-gateway-threshold', { width: 3.8, depth: 1.9, height: 0.12 }, scene);
      threshold.parent = content; threshold.position.set(gateway.x, 0.08, gateway.z); threshold.material = gatewayGlass; threshold.isPickable = false;
      threshold.metadata = freeze({ kind: 'living-nexus-physical-gateway-threshold', gatewayId: gateway.id, reviewFirst: true, automaticEntry: false, localOnly: true });
      gatewayNodes.push(threshold);
      const outer = MeshBuilder.CreateTorus('w662f-living-nexus-gateway-outer', { diameter: 3.3, thickness: 0.16, tessellation: 64 }, scene);
      outer.parent = content; outer.position.set(gateway.x, gateway.y, gateway.z); outer.rotation.x = Math.PI / 2; outer.material = gatewayCyan; outer.isPickable = false;
      outer.metadata = freeze({ kind: 'living-nexus-physical-gateway', gatewayId: gateway.id, label: gateway.label, destination: gateway.destination, inspectRadius: gateway.inspectRadius, enterRadius: gateway.enterRadius, entryReadyRadius: gateway.entryReadyRadius, discoveryRadius: gateway.discoveryRadius, reviewFirst: true, automaticEntry: false, localOnly: true });
      gatewayNodes.push(outer);
      const inner = MeshBuilder.CreateTorus('w662f-living-nexus-gateway-inner', { diameter: 2.55, thickness: 0.095, tessellation: 64 }, scene);
      inner.parent = content; inner.position.set(gateway.x, gateway.y, gateway.z); inner.rotation.x = Math.PI / 2; inner.rotation.z = Math.PI / 4; inner.material = gatewayGold; inner.isPickable = false;
      inner.metadata = outer.metadata; gatewayNodes.push(inner);
      const core = MeshBuilder.CreateSphere('w662f-living-nexus-gateway-core', { diameter: 0.58, segments: 28 }, scene);
      core.parent = content; core.position.set(gateway.x, gateway.y, gateway.z); core.material = gatewayGlass; core.isPickable = false; core.metadata = outer.metadata; gatewayNodes.push(core);
      for (const side of [-1, 1]) {
        const pylon = MeshBuilder.CreateCylinder(`w662f-living-nexus-gateway-pylon-${side < 0 ? 'left' : 'right'}`, { height: 2.7, diameterTop: 0.08, diameterBottom: 0.28, tessellation: 12 }, scene);
        pylon.parent = content; pylon.position.set(gateway.x + side * 2.05, 1.35, gateway.z); pylon.material = side < 0 ? gatewayCyan : gatewayGold; pylon.isPickable = false; pylon.metadata = outer.metadata; gatewayNodes.push(pylon);
      }
      const guide = MeshBuilder.CreateBox('w662f-living-nexus-gateway-guide-lane', { width: 0.22, depth: 5.2, height: 0.035 }, scene);
      guide.parent = content; guide.position.set(gateway.x, 0.075, gateway.z + 2.55); guide.material = gatewayCyan; guide.isPickable = false;
      guide.metadata = freeze({ kind: 'living-nexus-gateway-guide-lane', gatewayId: gateway.id, automaticNavigation: false, localOnly: true }); gatewayNodes.push(guide);
    }
    for (const entry of plan.eonbotDocks) {
      const base = MeshBuilder.CreateCylinder(`w660y-${entry.id}`, { diameter: 0.72, height: 0.16, tessellation: 20 }, scene);
      base.parent = content; base.position.set(entry.x, 0.08, entry.z); base.material = dock; base.isPickable = false;
      base.metadata = freeze({ kind: 'connected-core-eonbot-dock', dockId: entry.id, districtId: entry.districtId, automaticDocking: false, explicitCallRequired: true, localOnly: true });
    }
    for (let index = 0; index < plan.transitLoop.capsuleCount; index += 1) {
      const capsule = MeshBuilder.CreateCapsule(`w660y-transit-capsule-${index + 1}`, { height: 1.4, radius: 0.28, tessellation: 12 }, scene);
      capsule.parent = content; capsule.rotation.z = Math.PI / 2; capsule.material = index % 2 ? lane : station; capsule.isPickable = false;
      capsule.metadata = freeze({ kind: 'connected-core-transit-capsule', loopId: plan.transitLoop.id, index, visibleUsableLoop: true, automaticTravel: false, reviewFirst: true, localOnly: true });
      capsules.push(freeze({ node: capsule, offset: index / Math.max(1, plan.transitLoop.capsuleCount), periodMs: 26000 - index * 2000 }));
    }
    for (const [index, schedule] of plan.livingStreets.schedules.entries()) {
      if (schedule.districtId === 'orientation-hall') continue;
      const district = plan.districts.find((entry) => entry.id === schedule.districtId);
      if (!district) continue;
      const actor = MeshBuilder.CreateCapsule(`w660y-ambient-${schedule.id}`, { height: 1.25, radius: 0.23, tessellation: 10 }, scene);
      actor.parent = content; actor.position.set(district.center.x + 0.8, 0.64, district.center.z); actor.material = npc; actor.isPickable = false;
      actor.metadata = freeze({ kind: 'connected-core-ambient-schedule', scheduleId: schedule.id, districtId: schedule.districtId, activity: schedule.activity, claimsRealWork: false, localOnly: true });
      ambient.push(freeze({ node: actor, baseX: district.center.x, baseZ: district.center.z, radius: 0.72 + (index % 3) * 0.12, phase: index * 0.71 }));
    }
    host.setEnabled(true);
    return freeze({ ok: true, summary: getSummary() });
  };

  const getSummary = () => freeze({
    schema: EON_CITY_CONNECTED_CORE_BABYLON_SCHEMA,
    visible: visible && !disposed,
    districtCount: plan.districts.length,
    stationCount: plan.transitLoop.stations.length,
    streetConnectionCount: plan.streetConnections.length,
    continuousGroundVisible: fabricNodes.some((node) => node.metadata?.kind === 'continuous-core-ground'),
    continuousCoreFabricNodeCount: fabricNodes.length,
    continuousCoreInfillBlockCount: plan.continuousFabric.counts.infillBlockCount,
    continuousCorePlazaCount: plan.continuousFabric.counts.plazaCount,
    continuousCoreSkylineNodeCount: plan.continuousFabric.counts.skylineNodeCount,
    continuousCoreBorderCorridorCount: plan.continuousFabric.counts.borderCorridorCount,
    continuousCoreOccupiedCellRatio: plan.continuousFabric.coverage.occupiedCellRatio,
    districtStreetIdentityCount: plan.districtStreetIdentity.districtCount,
    districtStreetIdentityNodeCount: districtIdentityNodes.length,
    districtStreetWayfindingMarkerCount: plan.districtStreetIdentity.wayfindingMarkerCount,
    undersideShieldVisible: fabricNodes.some((node) => node.metadata?.kind === 'continuous-core-underside-shield'),
    transitCapsuleCount: capsules.length,
    ambientScheduleCount: ambient.length + (orientationBeltRenderer.getSummary().visible === true ? 1 : 0),
    ambientScheduleNodeCount: ambient.length,
    orientationAmbientScheduleRepresented: orientationBeltRenderer.getSummary().visible === true,
    eonbotDockCount: plan.eonbotDocks.length,
    physicalGatewayVisible: Boolean(plan.physicalGateway && (gatewayNodes.length || orientationBeltRenderer.getSummary().expanseGateVisible)),
    physicalGatewayId: plan.physicalGateway?.id || null,
    physicalGatewayNodeCount: gatewayNodes.length || orientationBeltRenderer.getSummary().expanseGateNodeCount || 0,
    orientationBeltVisible: orientationBeltRenderer.getSummary().visible === true,
    additionalDistrictBeltsVisible: districtBeltsRenderer.getSummary().visible === true,
    additionalDistrictBeltCount: districtBeltsRenderer.getSummary().renderedDistrictCount,
    completeDistrictBeltBuildingNodeCount: districtBeltsRenderer.getSummary().buildingNodeCount,
    completeDistrictBeltTerminalNodeCount: districtBeltsRenderer.getSummary().terminalNodeCount,
    completeDistrictBeltPopulationNodeCount: districtBeltsRenderer.getSummary().populationNodeCount,
    completeDistrictBeltDiscoveryNodeCount: districtBeltsRenderer.getSummary().discoveryNodeCount,
    allNineBeltsVisible: orientationBeltRenderer.getSummary().visible === true && districtBeltsRenderer.getSummary().renderedDistrictCount === 8,
    orientationBeltCenter: orientationBeltRenderer.getSummary().center,
    orientationBeltBuildingCount: orientationBeltRenderer.getSummary().buildingCount,
    orientationBeltResidentCount: orientationBeltRenderer.getSummary().residentCount,
    orientationBeltAuthoredResidentCount: orientationBeltRenderer.getSummary().authoredResidentCount,
    orientationBeltFallbackResidentCount: orientationBeltRenderer.getSummary().fallbackResidentCount,
    orientationBeltDuplicateResidentRepresentations: orientationBeltRenderer.getSummary().duplicateResidentRepresentations,
    orientationBeltTerminalCount: orientationBeltRenderer.getSummary().terminalCount,
    orientationBeltTransitCapsuleVisible: orientationBeltRenderer.getSummary().transitCapsuleVisible === true,
    orientationBeltEonbotDockVisible: orientationBeltRenderer.getSummary().eonbotDockVisible === true,
    orientationBeltExpanseGateVisible: orientationBeltRenderer.getSummary().expanseGateVisible === true,
    reviewedTransitStatus: reviewedTransitController.getSnapshot().status,
    reviewedTransitPhase: reviewedTransitController.getSnapshot().phase,
    reviewedTransitProgress: reviewedTransitController.getSnapshot().progress,
    reviewedTransitDestinationId: reviewedTransitController.getSnapshot().journey?.destinationId || null,
    closedTransitLoop: plan.transitLoop.closed === true,
    motionEnabled: plan.motionEnabled === true,
    mode: plan.mode,
    reducedEffects: plan.reducedEffects,
    focusModeFastTravelRetained: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    disposed
  });

  const rendered = render();
  if (!rendered.ok) throw new Error(`connected-core-plan-invalid:${rendered.errors.join(',')}`);
  return freeze({
    getPlan: () => plan,
    getSummary,
    getGateway() { return plan.physicalGateway ? freeze({ ...plan.physicalGateway }) : null; },
    beginReviewedTransitJourney(journey = null, { explicitUserAction = false, receiptId = '' } = {}) {
      if (disposed || !visible) return freeze({ ok: false, reason: 'connected-core-unavailable', summary: getSummary() });
      const result = reviewedTransitController.begin(journey, { explicitUserAction, receiptId });
      return freeze({ ...result, summary: getSummary(), oneCanonicalScene: true, secondRenderLoopCreated: false });
    },
    getReviewedTransitJourney() { return reviewedTransitController.getSnapshot(); },
    getNearestGateway(position = {}, { maxDistance = plan.physicalGateway?.discoveryRadius || plan.physicalGateway?.inspectRadius || 5.5 } = {}) {
      const gateway = plan.physicalGateway;
      if (!gateway || disposed || !visible) return null;
      const x = Number(position?.x || 0); const z = Number(position?.z || 0);
      const distance = Math.hypot(x - gateway.x, z - gateway.z);
      if (distance > Math.max(0.5, Number(maxDistance || gateway.inspectRadius))) return null;
      return freeze({ ...gateway, distance: Math.round(distance * 10) / 10, inApproachRange: distance <= (gateway.discoveryRadius || gateway.inspectRadius), inInspectRange: distance <= gateway.inspectRadius, inEnterRange: distance <= gateway.enterRadius, inEntryReadyRange: distance <= (gateway.entryReadyRadius || gateway.inspectRadius) });
    },
    setVisible(value) { visible = Boolean(value); host.setEnabled(visible); orientationBeltRenderer.setVisible(visible); districtBeltsRenderer.setVisible(visible); return getSummary(); },
    setPresentation({ nextMode = plan.mode, nextReducedEffects = plan.reducedEffects } = {}) {
      plan = buildEonCityConnectedCorePlan({ quality: plan.quality, reducedEffects: Boolean(nextReducedEffects), mode: nextMode, transformations });
      districtBeltsRenderer.setPresentation({ nextMode, nextReducedEffects });
      return getSummary();
    },
    update(now = globalThis.performance?.now?.() || Date.now()) {
      if (disposed || !visible) return getSummary();
      const orientationResidency = (scene.metadata?.eonCityW649Districts?.residents || []).find((entry) => entry.districtId === 'orientation-hall');
      orientationBeltRenderer.setAuthoredResidentAssets(orientationResidency?.loadedAssetIds || []);
      orientationBeltRenderer.update(now);
      districtBeltsRenderer.update(now);
      const reviewedTransit = reviewedTransitController.update(now);
      if (!plan.motionEnabled && !reviewedTransit.active) return getSummary();
      const passengerCapsule = capsules[0] || null;
      for (const entry of capsules) {
        if (entry === passengerCapsule && reviewedTransit.active && reviewedTransit.journey) {
          const from = reviewedTransit.journey.from;
          const to = reviewedTransit.journey.to;
          const t = Math.max(0, Math.min(1, Number(reviewedTransit.progress) || 0));
          const eased = t * t * (3 - 2 * t);
          const x = from.x + (to.x - from.x) * eased;
          const z = from.z + (to.z - from.z) * eased;
          const y = 0.72 + Math.sin(Math.PI * t) * 1.15;
          entry.node.position.set(x, y, z);
          entry.node.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
          entry.node.rotation.z = Math.PI / 2;
          continue;
        }
        if (!plan.motionEnabled) continue;
        const point = pathPoint(plan.transitLoop.path, Number(now || 0) / entry.periodMs + entry.offset);
        entry.node.position.set(point.x, 0.72, point.z); entry.node.rotation.y = point.heading; entry.node.rotation.z = Math.PI / 2;
      }
      const time = Number(now || 0) * 0.001;
      if (gatewayNodes.length) {
        const outer = gatewayNodes.find((node) => node.name === 'w662f-living-nexus-gateway-outer');
        const inner = gatewayNodes.find((node) => node.name === 'w662f-living-nexus-gateway-inner');
        const core = gatewayNodes.find((node) => node.name === 'w662f-living-nexus-gateway-core');
        if (outer) outer.rotation.z = Math.sin(time * 0.42) * 0.08;
        if (inner) inner.rotation.z = Math.PI / 4 - time * 0.18;
        if (core) core.scaling.setAll(0.92 + Math.sin(time * 1.7) * 0.08);
      }
      for (const entry of ambient) {
        entry.node.position.x = entry.baseX + Math.cos(time * 0.35 + entry.phase) * entry.radius;
        entry.node.position.z = entry.baseZ + Math.sin(time * 0.35 + entry.phase) * entry.radius;
        entry.node.rotation.y = -time * 0.35 - entry.phase;
      }
      return getSummary();
    },
    dispose() { if (disposed) return getSummary(); disposed = true; orientationBeltRenderer.dispose(); districtBeltsRenderer.dispose(); dispose(host); for (const entry of materials) { try { entry.dispose?.(); } catch {} } materials = []; capsules = []; ambient = []; gatewayNodes = []; fabricNodes = []; districtIdentityNodes = []; return getSummary(); }
  });
}
