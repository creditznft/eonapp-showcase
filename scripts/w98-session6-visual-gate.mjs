import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const director = read('assets/js/realm3d/engine/EonCitySession6CharacterDirector.js');
const character = read('assets/js/realm3d/engine/EonCityCharacterKit.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const session5 = read('scripts/w98-session5-visual-gate.mjs');

const checks = {
  session6CharacterSchema: director.includes("SESSION6_CHARACTER_SCHEMA = 'eon.realm3d.character-direction.w98.session6.v1'"),
  deterministicRoleProfiles: ['guide:', 'guardian:', 'builder:', 'market:', 'analyst:', 'creator:', 'herald:', 'pilot:', 'operator:'].every((token) => director.includes(token)),
  naturalLocomotionBlend: character.includes('motion.locomotion') && character.includes('gaitAbs') && character.includes('stopSettle'),
  smoothTurning: world.includes('dampYaw') && world.includes('shortestAngleDelta'),
  gestureLibrary: ['greeting', 'pointing', 'explaining', 'typing', 'scanning', 'guarding', 'broadcasting', 'celebration', 'listening'].every((gesture) => character.includes(`case '${gesture}'`)),
  contextualWorkBehavior: director.includes("nextState = owner ? 'station-work'") && director.includes("profile.work"),
  visitorConversationBehavior: director.includes("'visitor-conversation'") && world.includes('conversationStaged'),
  ownerVisitorBehaviorDifference: director.includes("owner-private-workspace-only") && director.includes("realm-visitors-scripted-only"),
  crowdSpacing: world.includes('computeCrowdSeparation') && director.includes('neighbors'),
  characterFacing: world.includes('targetYaw') && world.includes('pausedForPlayer ? 8.5'),
  articulatedBodyMotion: ['parts.pelvis', 'parts.torso', 'parts.shoulders', 'parts.leftLeg', 'parts.rightLeg'].every((token) => character.includes(token)),
  expressiveEonbotModes: ['station-guide', 'arrived', 'social', 'workstation', 'escort', 'guide'].every((mode) => director.includes(`mode: '${mode}'`)),
  eonbotModeTransitions: world.includes('modeTransitions') && world.includes('lastMode'),
  eonbotVisualExpression: world.includes('expression.wingAmplitude') && world.includes('expression.browTilt') && world.includes('expression.core'),
  session6Telemetry: world.includes('buildSession6CharacterTelemetry') && world.includes('session6Characters'),
  publicPrivateSeparationPreserved: world.includes("role: isOwnerAgent ? 'owner-agent' : isVisitorGuide ? 'visitor-guide'"),
  noNewNetworkDependency: !director.includes('fetch(') && !director.includes('WebSocket') && !director.includes('XMLHttpRequest'),
  meshBudgetFriendly: !director.includes('new THREE.Mesh') && !director.includes('new THREE.Group'),
  intentFirstPreserved: boot.includes("realmVisualSession = 'w98-session5'") && boot.includes("realmVisualSession = 'w98-session6'"),
  historicalSession5GatePreserved: session5.includes('historicalSession4GatePreserved') && boot.includes("realmVisualSession = 'w98-session4'")
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session6.visual-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION6/W98_SESSION6_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
