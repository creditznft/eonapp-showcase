import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const architecture = read('assets/js/realm3d/engine/EonCityArchitectureKit.js');
const character = read('assets/js/realm3d/engine/EonCityCharacterKit.js');
const flagship = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const app = read('assets/js/realm3d/eon-city-app.js');
const session3 = read('scripts/w98-session3-visual-gate.mjs');
const addNpcsBlock = world.slice(world.indexOf('\n  addNpcs()'), world.indexOf('\n  addAmbientDecor()'));

const checks = {
  architectureKitSchema: architecture.includes('eon.realm3d.architecture-kit.w98.session4.v1'),
  eightDistrictBuilders: ['addAiTower', 'addVault', 'addTrade', 'addBuilder', 'addStore', 'addMission', 'addReferral', 'addPortal'].every((name) => architecture.includes(`function ${name}`)),
  authoredEntrances: architecture.includes('addEntrance(group, accent'),
  facadeRhythm: architecture.includes('addFacadeRhythm'),
  streetFurniture: architecture.includes('addStreetFurniture'),
  sharedArchitectureGeometry: architecture.includes('const GEOMETRY = new Map()') && architecture.includes('getArchitectureKitGeometryCount'),
  architectureInstancing: architecture.includes('new THREE.InstancedMesh'),
  architectureIntegrated: flagship.includes("from './EonCityArchitectureKit.js'") && flagship.includes('buildDistrictArchitecture'),
  layeredPrivateStudio: flagship.includes("architecture: 'layered-command-studio'") && flagship.includes('workstation-arrival-arch'),
  privateStudioZones: ['workstation-meeting-hologram', 'workstation-lounge', 'workstation-eonbot-dock'].every((name) => flagship.includes(name)),
  modularCharacterSchema: character.includes('eon.realm3d.modular-character.w98.session4.v1'),
  modularHumanoidRig: ['character-torso', 'character-left-arm', 'character-right-arm', 'character-left-leg', 'character-right-leg'].every((name) => character.includes(name)),
  roleSpecificSilhouettes: ['guardian', 'builder', 'market', 'analyst', 'creator', 'herald', 'pilot', 'guide'].every((role) => character.includes(`'${role}'`)),
  ownerAgentAccessories: ['character-owner-halo', 'character-status-ring', 'character-tablet'].every((name) => character.includes(name)),
  characterAnimation: character.includes('animateModularCharacter') && world.includes('animateModularCharacter(npc'),
  characterIntegrated: world.includes("from './EonCityCharacterKit.js'") && world.includes('createModularCharacter'),
  legacyCapsulesRemovedFromNpcs: !addNpcsBlock.includes('CapsuleGeometry'),
  privacyBoundaryPreserved: world.includes("owner-private-workspace-only") && world.includes("realm-visitors-scripted-only"),
  visualSessionTelemetry: flagship.includes("visualSession: 'w98-session4'") && boot.includes("realmVisualSession = 'w98-session4'"),
  intentFirstPreserved: app.includes('realm-intent') || app.includes('autoBoot') || session3.includes('intentFirstLoader'),
  session3MaterialPerformancePreserved: flagship.includes('createEonCityMaterialAtlas') && flagship.includes('createInstancedMesh'),
  historicalGateCompatibility: flagship.includes("eon.realm3d.flagship-environment.w98.session3.v1") && flagship.includes("architecture: 'glass-command-office'")
};
const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = {
  schema: 'eon.w98.session4.visual-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
