/** W690 — visible renderer for the eight non-Orientation District Belts. */
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { buildEonCityW690CompleteCoreIdentityPlan, validateEonCityW690CompleteCoreIdentityPlan } from './eon-city-w690-complete-core-identity.js';
import { buildEonCityW697BuildingVariant, getEonCityW697DistrictVisualIdentity, validateEonCityW697DistrictVisualIdentities } from '../w697/eon-city-w697-district-visual-identity.js';

export const EON_CITY_W690_DISTRICT_BELTS_BABYLON_SCHEMA = 'eon.city.district-belts-babylon.w690.v1';
const freeze = (value) => Object.freeze(value);
function color(value, fallback = '#55eaff') { try { return Color3.FromHexString(String(value || fallback)); } catch { return Color3.FromHexString(fallback); } }
function makeMaterial(scene, name, diffuse, emissive, intensity = 0.2, alpha = 1) { const result = new StandardMaterial(name, scene); result.diffuseColor = color(diffuse, '#101827'); result.emissiveColor = color(emissive, '#55eaff').scale(intensity); result.specularColor = Color3.Black(); result.alpha = alpha; result.backFaceCulling = alpha >= 0.98; return result; }
function attach(mesh, parent, material, metadata = {}) { mesh.parent = parent; mesh.material = material; mesh.isPickable = metadata.interactive === true; mesh.metadata = freeze({ localOnly: true, automaticNavigation: false, automaticExecution: false, ...metadata }); return mesh; }
function segment(scene, parent, name, from, to, width, material, metadata = {}) { const dx = Number(to.x) - Number(from.x); const dz = Number(to.z) - Number(from.z); const length = Math.max(0.2, Math.hypot(dx, dz)); const mesh = attach(MeshBuilder.CreateBox(name, { width, depth: length, height: 0.055 }, scene), parent, material, metadata); mesh.position.set((Number(from.x) + Number(to.x)) / 2, 0.035, (Number(from.z) + Number(to.z)) / 2); mesh.rotation.y = Math.atan2(dx, dz); return mesh; }
function addNode(collection, mesh) { collection.push(mesh); return mesh; }
function boxNode(scene, parent, name, size, position, material, metadata, collection, rotationY = 0) { const mesh = attach(MeshBuilder.CreateBox(name, size, scene), parent, material, metadata); mesh.position.set(position.x, position.y, position.z); mesh.rotation.y = rotationY; return addNode(collection, mesh); }
function cylinderNode(scene, parent, name, options, position, material, metadata, collection, rotationY = 0) { const mesh = attach(MeshBuilder.CreateCylinder(name, options, scene), parent, material, metadata); mesh.position.set(position.x, position.y, position.z); mesh.rotation.y = rotationY; return addNode(collection, mesh); }
function sphereNode(scene, parent, name, options, position, scaling, material, metadata, collection) { const mesh = attach(MeshBuilder.CreateSphere(name, options, scene), parent, material, metadata); mesh.position.set(position.x, position.y, position.z); mesh.scaling.set(scaling.x, scaling.y, scaling.z); return addNode(collection, mesh); }
function torusNode(scene, parent, name, options, position, rotation, material, metadata, collection) { const mesh = attach(MeshBuilder.CreateTorus(name, options, scene), parent, material, metadata); mesh.position.set(position.x, position.y, position.z); mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0); return addNode(collection, mesh); }
function createDistinctBuilding(scene, parent, district, building, index, mats, collection) {
  const variant = buildEonCityW697BuildingVariant(district.id, index);
  const baseHeight = (3.5 + ((index + district.id.length) % 4) * 1.05) * variant.heightScale;
  const width = (2.45 + (index % 2) * 0.72) * variant.widthScale;
  const depth = (2.3 + ((index + 1) % 2) * 0.68) * variant.depthScale;
  const metadata = { kind: 'complete-district-functional-building', interactionKind: 'landmark', districtId: district.id, buildingId: building.id, label: building.label, role: building.role, visualGrammar: variant.grammar, visualFingerprint: variant.fingerprint, reviewFirst: true, interactive: true, privateContentStored: false };
  const p = building.position;
  const primary = index % 3 === 2 ? mats.warm : mats.primary;
  if (variant.grammar === 'terrace') {
    for (let level = 0; level < 3; level += 1) boxNode(scene, parent, `${building.id}-terrace-${level}`, { width: width * (1 - level * .16), depth: depth * (1 - level * .13), height: baseHeight / 3 }, { x: p.x + level * .13, y: baseHeight / 6 + level * baseHeight / 3, z: p.z - level * .08 }, level === 2 ? mats.glass : primary, metadata, collection, variant.rotationStep);
    boxNode(scene, parent, `${building.id}-capture-sail`, { width: .16, depth: depth * .8, height: baseHeight * .78 }, { x: p.x + width * .37, y: baseHeight * .76, z: p.z }, mats.accent, { ...metadata, kind: 'district-signature-sail', interactive: false }, collection, variant.rotationStep + .22);
  } else if (variant.grammar === 'cathedral') {
    boxNode(scene, parent, `${building.id}-nave`, { width, depth, height: baseHeight }, { x:p.x,y:baseHeight/2,z:p.z }, primary, metadata, collection, variant.rotationStep);
    for (const side of [-1,1]) boxNode(scene,parent,`${building.id}-buttress-${side}`,{width:.34,depth:depth*1.18,height:baseHeight*.72},{x:p.x+side*width*.58,y:baseHeight*.36,z:p.z},mats.warm,{...metadata,kind:'district-forge-buttress',interactive:false},collection,variant.rotationStep);
    cylinderNode(scene,parent,`${building.id}-vent`,{height:baseHeight*.42,diameterTop:.22,diameterBottom:.6,tessellation:8},{x:p.x,y:baseHeight*1.18,z:p.z},mats.accent,{...metadata,kind:'district-forge-vent',interactive:false},collection);
  } else if (variant.grammar === 'citadel') {
    for (let level=0; level<3; level+=1) boxNode(scene,parent,`${building.id}-citadel-${level}`,{width:width*(1-level*.18),depth:depth*(1-level*.15),height:baseHeight*.34},{x:p.x,y:baseHeight*.17+level*baseHeight*.32,z:p.z},level===2?mats.accent:primary,metadata,collection,variant.rotationStep);
    for (const side of [-1,1]) cylinderNode(scene,parent,`${building.id}-array-${side}`,{height:baseHeight*.65,diameter:.22,tessellation:6},{x:p.x+side*width*.42,y:baseHeight*.96,z:p.z},mats.warm,{...metadata,kind:'district-command-array',interactive:false},collection);
  } else if (variant.grammar === 'canopy') {
    cylinderNode(scene,parent,`${building.id}-trunk`,{height:baseHeight*.78,diameterTop:.7,diameterBottom:1.25,tessellation:10},{x:p.x,y:baseHeight*.39,z:p.z},primary,metadata,collection);
    sphereNode(scene,parent,`${building.id}-canopy`,{diameter:2.3,segments:12},{x:p.x,y:baseHeight*.9,z:p.z},{x:width*.45,y:.5,z:depth*.45},mats.glass,{...metadata,kind:'district-archive-canopy',interactive:false},collection);
    boxNode(scene,parent,`${building.id}-index-bridge`,{width:width*1.25,depth:.25,height:.18},{x:p.x,y:baseHeight*.65,z:p.z},mats.accent,{...metadata,kind:'district-index-bridge',interactive:false},collection,variant.rotationStep+.35);
  } else if (variant.grammar === 'vault') {
    boxNode(scene,parent,`${building.id}-vault`,{width,depth,height:baseHeight*.72},{x:p.x,y:baseHeight*.36,z:p.z},primary,metadata,collection,variant.rotationStep);
    boxNode(scene,parent,`${building.id}-vault-door`,{width:width*.45,depth:.14,height:baseHeight*.44},{x:p.x,y:baseHeight*.28,z:p.z-depth*.52},mats.glass,{...metadata,kind:'district-vault-door'},collection,variant.rotationStep);
    for (const side of [-1,1]) cylinderNode(scene,parent,`${building.id}-sentinel-${side}`,{height:baseHeight*.86,diameter:.32,tessellation:8},{x:p.x+side*width*.56,y:baseHeight*.43,z:p.z},mats.warm,{...metadata,kind:'district-key-sentinel',interactive:false},collection);
  } else if (variant.grammar === 'civic-dome') {
    cylinderNode(scene,parent,`${building.id}-commons`,{height:baseHeight*.42,diameter:Math.max(width,depth),tessellation:20},{x:p.x,y:baseHeight*.21,z:p.z},primary,metadata,collection);
    sphereNode(scene,parent,`${building.id}-dome`,{diameter:2.2,segments:16},{x:p.x,y:baseHeight*.52,z:p.z},{x:width*.48,y:baseHeight*.22,z:depth*.48},mats.glass,{...metadata,kind:'district-civic-dome'},collection);
    for (const side of [-1,1]) boxNode(scene,parent,`${building.id}-arcade-${side}`,{width:.22,depth:depth*.85,height:baseHeight*.42},{x:p.x+side*width*.58,y:baseHeight*.21,z:p.z},mats.accent,{...metadata,kind:'district-key-light-arcade',interactive:false},collection,variant.rotationStep);
  } else if (variant.grammar === 'amphitheatre') {
    for (let tier=0;tier<3;tier+=1) cylinderNode(scene,parent,`${building.id}-tier-${tier}`,{height:.32,diameter:Math.max(width,depth)*(1-tier*.19),tessellation:24},{x:p.x,y:.16+tier*.3,z:p.z+tier*.2},tier===2?mats.warm:primary,metadata,collection);
    boxNode(scene,parent,`${building.id}-review-chamber`,{width:width*.62,depth:depth*.5,height:baseHeight*.72},{x:p.x,y:baseHeight*.36+.8,z:p.z+.3},mats.glass,metadata,collection,variant.rotationStep);
  } else if (variant.grammar === 'concourse') {
    boxNode(scene,parent,`${building.id}-concourse`,{width:width*1.2,depth,height:baseHeight*.48},{x:p.x,y:baseHeight*.24,z:p.z},primary,metadata,collection,variant.rotationStep);
    for (const side of [-1,1]) boxNode(scene,parent,`${building.id}-platform-${side}`,{width:width*.28,depth:depth*1.25,height:.22},{x:p.x+side*width*.62,y:.13,z:p.z},mats.accent,{...metadata,kind:'district-transit-platform'},collection,variant.rotationStep);
    boxNode(scene,parent,`${building.id}-signal-bridge`,{width:width*1.55,depth:.22,height:.22},{x:p.x,y:baseHeight*.9,z:p.z},mats.warm,{...metadata,kind:'district-signal-bridge',interactive:false},collection,variant.rotationStep);
  } else {
    boxNode(scene,parent,`${building.id}-body`,{width,depth,height:baseHeight},{x:p.x,y:baseHeight/2,z:p.z},primary,metadata,collection,variant.rotationStep);
  }
  boxNode(scene,parent,`${building.id}-entrance`,{width:Math.min(1.5,width*.48),height:1.7,depth:.09},{x:p.x,y:.85,z:p.z-depth/2-.055},mats.glass,{...metadata,kind:'complete-district-building-entrance'},collection,variant.rotationStep);
}
function createDistinctStation(scene,parent,district,mats,collection) {
  const identity=getEonCityW697DistrictVisualIdentity(district.id); const p=district.station.position; const meta={kind:'complete-district-transit-station',interactionKind:'station',districtId:district.id,stationId:district.station.id,label:district.station.label,stationGrammar:identity.stationGrammar,explicitTravelReviewRequired:true,automaticTravel:false,interactive:true};
  cylinderNode(scene,parent,`${district.id}-station-base`,{diameter:3,height:.16,tessellation:identity.stationGrammar==='multi-platform'?8:24},{x:p.x,y:.08,z:p.z},mats.primary,meta,collection);
  if(identity.stationGrammar==='multi-platform'){ for(const side of [-1,1]) boxNode(scene,parent,`${district.id}-station-platform-${side}`,{width:.65,depth:4.2,height:.12},{x:p.x+side*.9,y:.18,z:p.z},mats.accent,{...meta,kind:'district-transit-platform'},collection); }
  else if(identity.stationGrammar==='creator-ribbon') boxNode(scene,parent,`${district.id}-station-ribbon`,{width:3.6,depth:.24,height:.12},{x:p.x,y:.26,z:p.z},mats.accent,{...meta,kind:'district-creator-ribbon'},collection,.35);
  else if(identity.stationGrammar==='foundry-platform') for(const side of [-1,1]) cylinderNode(scene,parent,`${district.id}-station-vent-${side}`,{height:1.35,diameter:.28,tessellation:8},{x:p.x+side*1.1,y:.7,z:p.z},mats.warm,{...meta,kind:'district-foundry-vent',interactive:false},collection);
  else if(identity.stationGrammar==='library-bridge') boxNode(scene,parent,`${district.id}-station-bridge`,{width:4.2,depth:.42,height:.2},{x:p.x,y:.42,z:p.z},mats.glass,{...meta,kind:'district-library-bridge'},collection,.18);
  else if(identity.stationGrammar==='custody-platform') for(const side of [-1,1]) boxNode(scene,parent,`${district.id}-station-guard-${side}`,{width:.32,depth:.46,height:1.8},{x:p.x+side*1.25,y:.9,z:p.z},mats.warm,{...meta,kind:'district-custody-guard',interactive:false},collection);
  else torusNode(scene,parent,`${district.id}-station-identity`,{diameter:2.4,thickness:.08,tessellation:32},{x:p.x,y:.2,z:p.z},{x:Math.PI/2},mats.accent,{...meta,kind:'complete-district-station-identity',interactive:false},collection);
}
function createDistinctDiscovery(scene,parent,district,discovery,index,mats,collection){ const identity=getEonCityW697DistrictVisualIdentity(district.id); const p=discovery.position; const meta={kind:'complete-district-discovery',interactionKind:'discovery',districtId:district.id,discoveryId:discovery.id,label:discovery.label,discoveryKind:discovery.kind,discoveryGrammar:identity.discoveryGrammar,reviewFirst:true,interactive:true};
  if(['receipt-prism','forge-anvil','key-monolith'].includes(identity.discoveryGrammar)) boxNode(scene,parent,`${discovery.id}-marker`,{width:.45+(index%2)*.15,depth:.38,height:1.15},{x:p.x,y:.58,z:p.z},index%2?mats.warm:mats.accent,meta,collection,index*.2);
  else if(['knowledge-tree','holographic-gallery','eonkey-gallery'].includes(identity.discoveryGrammar)) sphereNode(scene,parent,`${discovery.id}-marker`,{diameter:.72,segments:10},{x:p.x,y:.82,z:p.z},{x:1,y:identity.discoveryGrammar==='knowledge-tree'?1.65:.65,z:1},index%2?mats.warm:mats.glass,meta,collection);
  else cylinderNode(scene,parent,`${discovery.id}-marker`,{height:1.15,diameterTop:.1,diameterBottom:.28,tessellation:8},{x:p.x,y:.58,z:p.z},index%2?mats.warm:mats.accent,meta,collection);
}


export function createEonCityW690DistrictBeltsBabylonRenderer({ scene, parent = null, quality = 'balanced', reducedEffects = false, mode = 'explore' } = {}) {
  if (!scene) throw new Error('w690-district-belts-scene-required');
  let plan = buildEonCityW690CompleteCoreIdentityPlan({ quality, reducedEffects, mode });
  const validation = validateEonCityW690CompleteCoreIdentityPlan(plan);
  if (!validation.ok) throw new Error(`w690-complete-core-invalid:${validation.errors.join(',')}`);
  const visualValidation = validateEonCityW697DistrictVisualIdentities();
  if (!visualValidation.ok) throw new Error(`w697-district-visual-identity-invalid:${visualValidation.errors.join(',')}`);
  const root = new TransformNode('w690-district-belts-root', scene); root.parent = parent || null;
  root.metadata = freeze({ kind: 'complete-district-belts-root', oneCanonicalScene: true, secondCanvasCreated: false, secondRenderLoopCreated: false, localOnly: true });
  const materials = [];
  const districtRoots = [];
  const buildingNodes = [];
  const terminalNodes = [];
  const populationNodes = [];
  const discoveryNodes = [];
  const stationNodes = [];
  const dockNodes = [];
  const gateNodes = [];
  let visible = true;
  let disposed = false;

  for (const district of plan.districts) {
    if (district.id === 'orientation-hall') continue;
    const districtRoot = new TransformNode(`w690-belt-root-${district.id}`, scene); districtRoot.parent = root;
    districtRoot.metadata = freeze({ kind: 'district-belt-root', districtId: district.id, identity: district.identity, localOnly: true });
    districtRoots.push(districtRoot);
    const primary = district.palette.primary || '#17263a';
    const accent = district.palette.accent || '#55eaff';
    const warm = district.palette.warm || '#ffc45c';
    const groundMat = makeMaterial(scene, `w690-${district.id}-ground`, '#07101b', primary, 0.12);
    const roadMat = makeMaterial(scene, `w690-${district.id}-road`, '#0b1119', primary, 0.12);
    const primaryMat = makeMaterial(scene, `w690-${district.id}-primary`, primary, accent, 0.28);
    const accentMat = makeMaterial(scene, `w690-${district.id}-accent`, '#102033', accent, 0.62);
    const warmMat = makeMaterial(scene, `w690-${district.id}-warm`, '#2b2113', warm, 0.58);
    const glassMat = makeMaterial(scene, `w690-${district.id}-glass`, '#0b2230', accent, 0.32, 0.42);
    const populationMat = makeMaterial(scene, `w690-${district.id}-population`, '#172138', accent, 0.4);
    materials.push(groundMat, roadMat, primaryMat, accentMat, warmMat, glassMat, populationMat);

    const ground = attach(MeshBuilder.CreateCylinder(`w690-${district.id}-belt-ground`, { diameter: district.radius * 2.05, height: 0.045, tessellation: 48 }, scene), districtRoot, groundMat, { kind: 'complete-district-belt-ground', districtId: district.id });
    ground.position.set(district.center.x, 0.018, district.center.z);
    for (const street of district.streets) {
      segment(scene, districtRoot, `w690-${street.id}`, street.from, street.to, Number(street.width) || 1.4, roadMat, { kind: 'complete-district-internal-street', districtId: district.id, streetId: street.id, pedestrianSafe: true });
      segment(scene, districtRoot, `w690-${street.id}-identity-lane`, street.from, street.to, 0.055, accentMat, { kind: 'complete-district-identity-lane', districtId: district.id, streetFamily: district.identity.streetFamily, decorative: true });
    }
    for (const [spaceIndex, space] of district.publicSpaces.entries()) {
      const plaza = attach(MeshBuilder.CreateCylinder(`w690-${space.id}`, { diameter: spaceIndex === 0 ? 5.2 : 3.8, height: 0.095, tessellation: 32 }, scene), districtRoot, spaceIndex === 0 ? primaryMat : glassMat, { kind: 'complete-district-public-space', districtId: district.id, publicSpaceId: space.id, label: space.label, productive: space.productive === true });
      plaza.position.set(space.position.x, 0.06, space.position.z);
    }
    const districtMaterials = { primary: primaryMat, accent: accentMat, warm: warmMat, glass: glassMat };
    for (const [index, building] of district.buildings.entries()) createDistinctBuilding(scene, districtRoot, district, building, index, districtMaterials, buildingNodes);
    for (const [index, terminal] of district.terminals.entries()) {
      const pedestal = attach(MeshBuilder.CreateBox(`w690-${terminal.id}-base`, { width: 0.72, height: 0.68, depth: 0.64 }, scene), districtRoot, primaryMat, { kind: 'complete-district-terminal-base', districtId: district.id, terminalId: terminal.id });
      pedestal.position.set(terminal.position.x, 0.34, terminal.position.z);
      const screen = attach(MeshBuilder.CreateBox(`w690-${terminal.id}-screen`, { width: 0.62, height: 0.5, depth: 0.055 }, scene), districtRoot, index % 2 ? warmMat : accentMat, { kind: 'complete-district-terminal', interactionKind: 'terminal', districtId: district.id, terminalId: terminal.id, label: terminal.label || terminal.id, reviewFirst: true, interactive: true, autoExecute: false, autoNavigate: false });
      screen.position.set(terminal.position.x, 0.94, terminal.position.z - 0.18); screen.rotation.x = -0.14; terminalNodes.push(pedestal, screen);
    }
    createDistinctStation(scene, districtRoot, district, districtMaterials, stationNodes);
    const dock = attach(MeshBuilder.CreateCylinder(`w690-${district.id}-eonbot-dock`, { diameter: 0.88, height: 0.16, tessellation: 24 }, scene), districtRoot, glassMat, { kind: 'complete-district-eonbot-dock', interactionKind: 'eonbot-dock', districtId: district.id, dockId: district.eonbotDock.id, explicitDockActionRequired: true, automaticDocking: false, interactive: true });
    dock.position.set(district.eonbotDock.position.x, 0.08, district.eonbotDock.position.z); dockNodes.push(dock);
    const gateLeft = attach(MeshBuilder.CreateBox(`w690-${district.id}-expanse-left`, { width: 0.34, height: 2.8, depth: 0.46 }, scene), districtRoot, primaryMat, { kind: 'complete-district-expanse-gate', interactionKind: 'expanse-gate', districtId: district.id, gatewayId: district.expanseGate.id, label: district.expanseGate.label, reviewFirst: true, separateConfirmationRequired: true, automaticEntry: false, interactive: true });
    gateLeft.position.set(district.expanseGate.position.x - 1.3, 1.4, district.expanseGate.position.z);
    const gateRight = attach(MeshBuilder.CreateBox(`w690-${district.id}-expanse-right`, { width: 0.34, height: 2.8, depth: 0.46 }, scene), districtRoot, primaryMat, gateLeft.metadata);
    gateRight.position.set(district.expanseGate.position.x + 1.3, 1.4, district.expanseGate.position.z);
    const gateBridge = attach(MeshBuilder.CreateBox(`w690-${district.id}-expanse-bridge`, { width: 2.95, height: 0.24, depth: 0.48 }, scene), districtRoot, warmMat, gateLeft.metadata);
    gateBridge.position.set(district.expanseGate.position.x, 2.65, district.expanseGate.position.z); gateNodes.push(gateLeft, gateRight, gateBridge);
    for (const [index, discovery] of district.discoveries.entries()) createDistinctDiscovery(scene, districtRoot, district, discovery, index, districtMaterials, discoveryNodes);
    for (const actor of district.ambientActors) {
      const node = attach(MeshBuilder.CreateCapsule(`w690-${actor.id}`, { height: 1.18, radius: 0.22, tessellation: 8 }, scene), districtRoot, populationMat, { kind: 'complete-district-ambient-population', districtId: district.id, actorId: actor.id, archetype: actor.archetype, activity: actor.activity, claimsRealWork: false });
      node.position.set(actor.anchor.x, 0.61, actor.anchor.z);
      populationNodes.push(freeze({ node, districtId: district.id, baseX: actor.anchor.x, baseZ: actor.anchor.z, radius: actor.pathRadius, phase: actor.phase, speed: actor.speed }));
    }
  }

  const getSummary = () => freeze({
    schema: EON_CITY_W690_DISTRICT_BELTS_BABYLON_SCHEMA,
    visible: visible && !disposed,
    renderedDistrictCount: districtRoots.length,
    completeDistrictCount: plan.districts.length,
    buildingNodeCount: buildingNodes.length,
    terminalNodeCount: terminalNodes.length,
    populationNodeCount: populationNodes.length,
    discoveryNodeCount: discoveryNodes.length,
    stationNodeCount: stationNodes.length,
    dockNodeCount: dockNodes.length,
    gateNodeCount: gateNodes.length,
    allNineBeltsVisibleWithOrientationRenderer: districtRoots.length === 8,
    distinctFunctionalIdentity: true,
    visualAdapterCount: visualValidation.identityCount,
    uniqueDistrictVisualFingerprints: visualValidation.uniqueFingerprints,
    genericRingDominance: false,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    networkRequestCreated: false,
    disposed
  });

  return freeze({
    getPlan: () => plan,
    getSummary,
    ownsDistrict(districtId = '') { return String(districtId || '') !== 'orientation-hall' && plan.districts.some((entry) => entry.id === String(districtId || '')); },
    setVisible(value) { visible = Boolean(value); root.setEnabled(visible); return getSummary(); },
    setPresentation({ nextMode = plan.mode, nextReducedEffects = plan.reducedEffects } = {}) { plan = buildEonCityW690CompleteCoreIdentityPlan({ quality: plan.quality, mode: nextMode, reducedEffects: Boolean(nextReducedEffects) }); return getSummary(); },
    update(now = globalThis.performance?.now?.() || Date.now()) {
      if (disposed || !visible || !plan.motionEnabled) return getSummary();
      const seconds = Number(now || 0) * 0.001;
      for (const actor of populationNodes) {
        const angle = seconds * actor.speed + actor.phase;
        actor.node.position.x = actor.baseX + Math.cos(angle) * actor.radius;
        actor.node.position.z = actor.baseZ + Math.sin(angle) * actor.radius;
        actor.node.rotation.y = -angle + Math.PI / 2;
      }
      return getSummary();
    },
    dispose() { if (disposed) return getSummary(); disposed = true; try { root.dispose?.(false, false); } catch { try { root.dispose?.(); } catch {} } for (const item of materials) { try { item.dispose?.(); } catch {} } return getSummary(); }
  });
}

export default freeze({ EON_CITY_W690_DISTRICT_BELTS_BABYLON_SCHEMA, createEonCityW690DistrictBeltsBabylonRenderer });
