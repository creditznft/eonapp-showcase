import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const atlas = read('assets/js/realm3d/engine/EonCityMaterialAtlas.js');
const flagship = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const map = read('assets/js/realm3d/engine/EonCityMap.js');
const agents = read('assets/js/realm3d/engine/EonCityAgentNpcRuntime.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const css = read('assets/css/realm3d.css');
const proof = exists('scripts/w98-session3-public-proof.mjs') ? read('scripts/w98-session3-public-proof.mjs') : '';
const intentProof = exists('scripts/w98-session3-intent-proof.mjs') ? read('scripts/w98-session3-intent-proof.mjs') : '';
const loader = read('assets/js/realm3d/eon-city-app.js');
const shell = read('assets/js/realm3d/realm-flagship-shell.js');
const realm = read('realm.html');

const checks = {
  session3VisualSchema: flagship.includes('eon.realm3d.flagship-environment.w98.session3.v1'),
  proceduralMaterialAtlas: atlas.includes("TILE_IDS = Object.freeze(['asphalt', 'sidewalk', 'metal', 'glass', 'foliage', 'officeFloor', 'wall', 'wood'])") && atlas.includes('eon.realm3d.material-atlas.w98.session3.v1'),
  sharedMaterialLibrary: ['road:', 'sidewalk:', 'brushedMetal:', 'facadeGlass:', 'foliage:', 'officeFloor:', 'wood:'].every((token) => atlas.includes(token)),
  atlasAppliedToCity: flagship.includes('this.materialAtlas?.materials?.road') && flagship.includes('this.materialAtlas?.materials?.sidewalk') && flagship.includes('this.materialAtlas?.materials?.foliage'),
  atlasAppliedToOffice: flagship.includes('this.materialAtlas?.materials?.officeFloor') && flagship.includes("materialAtlas: 'eon-city-session3'"),
  authoredLandmarkInteriors: flagship.includes('addLandmarkInterior(group, district, accent)') && flagship.includes('landmarkInteriorCount'),
  districtSpecificInteriors: ["district.id === 'vault'", "district.id === 'builder'", "district.id === 'store'", "district.id === 'portal'"].every((token) => flagship.includes(token)),
  boundedNpcRoutes: map.includes('bounded, deterministic route') && map.includes('patrolPath: visitorRoutes') && map.includes("loop: 'ping-pong'") && map.includes("loop: 'loop'"),
  npcProximityPause: map.includes('proximityPause') && world.includes('pausedForPlayer'),
  movingNpcRuntime: world.includes('distanceTravelled') && world.includes('pathPauseRemaining') && world.includes('npc.userData.moving = moving'),
  npcLabelsMoveWithCharacters: world.includes('group.add(sprite)') && world.includes('sprite.position.set(0, isOwnerAgent'),
  ownerStationStates: agents.includes('stationState: Object.freeze') && agents.includes('Awaiting an owner-approved task'),
  safeDialogueTopics: agents.includes('dialogueTopics: Object.freeze') && panels.includes('data-npc-topic-reply') && panels.includes('data-npc-reply'),
  eonbotGuidanceRuntime: world.includes('setCompanionGuidance') && world.includes('eonbot-guidance-marker') && world.includes('getCompanionGuidanceState'),
  eonbotStationRouting: panels.includes("realm3d:eonbot-guide") && boot.includes('startEonBotGuidance') && boot.includes('Follow the green route beacon'),
  conservativeCinematicGrade: boot.includes('THREE.ACESFilmicToneMapping') && css.includes('conservative cinematic grade'),
  lowQualityGradeReduced: css.includes('.realm3d-flagship-shell[data-quality="low"] .realm3d-stage-wrap::after'),
  frameTimingTelemetry: boot.includes('frameAverageMs') && boot.includes('frameP95Ms'),
  privacyBoundaryPreserved: map.includes('includeOwnerAgents: false, includeVisitors: true') && map.includes('includeOwnerAgents: true, includeVisitors: false'),
  publicProofHarness: proof.includes('/realm.html') && proof.includes('npcMovement') && proof.includes('guidanceMarker'),
  instancedSceneOptimization: flagship.includes('createInstancedMesh') && flagship.includes('instancedMeshCount') && flagship.includes('instanceCount'),
  intentFirstLoader: loader.includes('loadEngineModule') && loader.includes('shouldAutoboot') && !loader.includes("import { EonCity3dEngine }"),
  lightweightPublicShell: realm.includes('realm-flagship-shell.js') && !realm.includes('src="/assets/js/main.js"') && shell.includes('loadLegacyRealmEditorOnExplicitRequest'),
  intentFirstProofHarness: intentProof.includes('threeDeferredBeforeIntent') && intentProof.includes('engineBootsAfterIntent'),
  session2RegressionPreserved: flagship.includes('eon.realm3d.flagship-environment.w98.session2.v1') && css.includes('W98 Session 2')
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session3.visual-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION3/W98_SESSION3_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
