#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const required = [
  'assets/js/realm3d/eon-city-app.js',
  'assets/js/realm3d/engine/EngineBoot.js',
  'assets/js/realm3d/engine/VoxelWorld.js',
  'assets/js/realm3d/engine/PlayerController.js',
  'assets/js/realm3d/engine/MobileControls.js',
  'assets/js/realm3d/engine/CollisionSystem.js',
  'assets/js/realm3d/engine/PortalSystem.js',
  'assets/js/realm3d/engine/WorldPanels.js',
  'assets/js/realm3d/engine/PerformanceGuard.js',
  'assets/css/realm3d.css'
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
const html = read('realm.html');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const world = read('assets/js/realm3d/engine/VoxelWorld.js');
const css = read('assets/css/realm3d.css');
const checks = {
  requiredFiles: missing.length === 0,
  realm3dRoot: /data-eon-city-3d-root/.test(html),
  threeRenderer: /WebGLRenderer/.test(boot),
  instancing: /InstancedMesh/.test(world),
  pointerLock: /requestPointerLock/.test(read('assets/js/realm3d/engine/PlayerController.js')),
  mobileJoystick: /realm3d-stick-move/.test(read('assets/js/realm3d/engine/MobileControls.js')),
  oldRealmHidden: /rl-hub-hero[\s\S]*display: none/.test(css),
  safetyLanguage: /no public chat|no uploads|no arbitrary HTML/i.test(html)
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { ok: missing.length === 0 && failed.length === 0, missing, checks, failed };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
