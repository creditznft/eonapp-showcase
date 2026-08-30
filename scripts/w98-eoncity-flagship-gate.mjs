import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = {};
const files = {
  realm: read('realm.html'),
  engine: read('assets/js/realm3d/engine/EngineBoot.js'),
  player: read('assets/js/realm3d/engine/PlayerController.js'),
  world: read('assets/js/realm3d/engine/VoxelWorld.js'),
  panels: read('assets/js/realm3d/engine/WorldPanels.js'),
  flagship: read('assets/js/realm3d/engine/EonCityFlagshipScene.js'),
  blueprint: read('assets/js/realm3d/engine/EonCityMegaBlueprint.js'),
  css: read('assets/css/realm3d.css')
};

checks.flagshipRendererExists = /class EonCityFlagshipScene/.test(files.flagship);
checks.dynamicEnvironment = /addSky|addWeather|addCityLandscaping|addPrivateWorkstation/.test(files.flagship);
checks.fullscreenLaunch = /launchImmersive/.test(files.engine) && /requestFullscreen/.test(files.engine);
checks.pointerLockAndDragLook = /requestPointerLock/.test(files.player) && /dragLooking/.test(files.player) && /onPointerMove/.test(files.player);
checks.safeExit = /Escape/.test(files.engine) && /releasePointerLock/.test(files.player);
checks.eonbotCompanionRendered = /EONBOT Companion/.test(files.world) && /addEonBotCompanion/.test(files.world);
checks.codeMakerInWorld = /screen-code/.test(files.blueprint) && /data-realm-code-widget/.test(files.panels) && /sandbox="allow-scripts"/.test(files.panels);
checks.chatInWorld = /data-eonbot-form/.test(files.panels) && /openEonBot/.test(files.panels);
checks.secretsRedacted = /API keys, seed phrases, private keys/.test(files.panels) && /secretSafe/.test(files.blueprint);
checks.flagshipPublicTruth = /AI Workstation World/.test(files.realm) && !/real Minecraft-style voxel city/.test(files.realm);
checks.legacySurfacesHidden = /realm3d-legacy-surface/.test(files.realm) && /main > section:not\(\.realm3d-hero\)/.test(files.css);
checks.responsiveGameShell = /100svh/.test(files.css) && /orientation: landscape/.test(files.css);
checks.offlineThreeVendored = fs.existsSync('assets/vendor/three.module.min.js') && fs.existsSync('assets/vendor/three.core.min.js');

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
const report = {
  schema: 'eon.w98.eoncity-flagship-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100)
};
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
