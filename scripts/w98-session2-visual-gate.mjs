import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const map = read('assets/js/realm3d/engine/EonCityMap.js');
const flagship = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const entry = read('assets/js/realm3d/eon-city-app.js');
const css = read('assets/css/realm3d.css');
const proof = read('scripts/w98-session2-public-proof.mjs');

const checks = {
  session2VisualSchema: flagship.includes('eon.realm3d.flagship-environment.w98.session2.v1'),
  authoredDistrictCity: ['addRoadNetwork()', 'addTransitAndCrosswalks()', 'addParkFurniture()', 'addDistrictLandmarks(map)', 'addSkyline()'].every((token) => flagship.includes(token)),
  authoredPrivateOffice: flagship.includes("office.name = 'flagship-private-workstation-architecture'") && flagship.includes("architecture: 'glass-command-office'"),
  detailedPrivateArchitecture: ['workstation-executive-command-desk', 'workstation-operator-chair', 'workstation-agent-pod', 'workstation-window-city-vista'].every((token) => flagship.includes(token)),
  privacySeparatedNpcMaps: map.includes('includeOwnerAgents: false, includeVisitors: true') && map.includes('includeOwnerAgents: true, includeVisitors: false'),
  agentAlcovePlacement: map.includes('Never place one on the') && map.includes('[-8.4, -2.4]') && map.includes('[5.4, -6.8]'),
  visitorGuidesPublicOnly: map.includes('Public EON City shows visitor-safe guides only'),
  curatedNineScreenOffice: map.includes('Keep station metadata for routing, but render one curated nine-screen wall') && map.includes('[0, -3.8]'),
  screenTexturesFaceUsers: world.includes('screenMesh.position.z = 0.096') && world.includes('users see live labels'),
  authoredSceneAuthority: world.includes("const authoredScene = this.mode === 'private-workstation' || this.mode === 'eon-city'") && world.includes('Legacy block maps remain available'),
  authoredSpatialCollision: world.includes('addAuthoredCollisions()') && world.includes('flagship-landmark-') && world.includes('office-command-desk'),
  legacyNoiseRemoved: world.includes('rendered over the private workstation') === false && world.includes('no longer bury the flagship scenes in visual noise'),
  companionRefined: world.includes('eonbot-companion-rendered') && world.includes('followOffset: { x: 3.8, y: 0.82, z: -4.8 }') && world.includes('badge.scale.set(1.86, 0.42, 1)'),
  heroSpawnAuthored: map.includes("spawn: { x: -4.6, y: 1.8, z: 9.2, yaw: -0.43 }"),
  liveSceneTelemetry: boot.includes('flagshipStats.objectCount') && boot.includes('flagshipStats.animatedCount'),
  mobileControlsScoped: boot.includes("root: this.root.querySelector('.realm3d-shell') || this.root") && css.includes('[data-eon-city-3d-root]:not(.realm3d-intro-dismissed) .realm3d-mobile-controls'),
  mobileQualityQuery: entry.includes("['low', 'standard', 'neon'].includes(requestedQuality)"),
  premiumLaunchShell: boot.includes('Operate your AI city.') && boot.includes('LIVE WORLD STATUS') && css.includes('W98 Session 2'),
  publicRouteProofHarness: proof.includes('/realm.html') && proof.includes('publicRealmRoute') && proof.includes('codeMakerSandbox') && proof.includes('controlsHiddenBehindIntro'),
  publicProofArtifactsPresent: ['W98_SESSION2_CITY_PROOF.json', 'W98_SESSION2_WORKSTATION_PROOF.json', 'W98_SESSION2_MOBILE_PROOF.json'].every((file) => exists(`CodexAuditPack/W98_SESSION2/${file}`)),
  screenshotSetPresent: [
    '01-public-city-launch-desktop.png',
    '02-public-city-world-desktop.png',
    '04-public-private-workstation-desktop.png',
    '05-public-code-maker-widget-desktop.png',
    '06-public-eonbot-guide-desktop.png',
    '07-public-city-launch-mobile.png',
    '08-public-city-world-mobile.png'
  ].every((file) => exists(`CodexAuditPack/W98_SESSION2/screenshots/${file}`))
};
const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session2.visual-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION2/W98_SESSION2_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
