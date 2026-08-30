#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W703_CORE_BOUNDS,
  enforceEonCityW703WorldSafety,
  sanitizeEonCityW703CameraPose,
  sanitizeEonCityW703TransitionPose
} from '../assets/js/city/w703/eon-city-w703-world-safety.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
function vector(x = 0, y = 0, z = 0) { return { x, y, z, copyFromFloats(a, b, c) { this.x = a; this.y = b; this.z = c; } }; }

export function inspectW703WorldSafety() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const play = read('assets/js/city/eon-city-play-core.js');
  add('camera-hard-limits', /camera\.lowerBetaLimit = EON_CITY_W703_CORE_BOUNDS\.cameraBetaMin/.test(play) && /camera\.upperBetaLimit = EON_CITY_W703_CORE_BOUNDS\.cameraBetaMax/.test(play) && /camera\.lowerRadiusLimit/.test(play) && /camera\.upperRadiusLimit/.test(play), 'ArcRotate camera has hard orbit and zoom limits');
  add('per-frame-enforcement', /const enforceWorldSafety = \(\{ checkpoint = false \} = \{\}\) =>/.test(play) && /enforceWorldSafety\(\);\r?\n    scene\.render\(\)/.test(play), 'safety is enforced before every rendered frame');
  add('transition-sanitation', /sanitizeEonCityW703TransitionPose\(pose/.test(play) && /restoreExplorationPose\(pose = \{\}\)[\s\S]*return applyPose/.test(play) && /focusLandmark\(id\)[\s\S]*return applyPose/.test(play), 'restores, transitions and landmark focus use one safe pose authority');
  add('underside-occluder', /eon-city-w703-world-safety-underlay/.test(play) && /hidesWorldUnderside: true/.test(play) && /underside\.isPickable = false/.test(play), 'dark non-interactive geometry hides the map underside');
  const cameraSweep = [
    { beta: -99, radius: -4, target: { x: 0, y: -99, z: 0 } },
    { beta: 99, radius: 999, target: { x: 999, y: -1, z: -999 } },
    { beta: Number.NaN, radius: Number.NaN, target: { x: Number.NaN, y: Number.NaN, z: Number.NaN } }
  ].map((pose) => sanitizeEonCityW703CameraPose(pose));
  add('camera-sweep-safe', cameraSweep.every((pose) => pose.aboveGround && pose.estimatedPositionY >= EON_CITY_W703_CORE_BOUNDS.cameraPositionMinY && pose.target.y >= EON_CITY_W703_CORE_BOUNDS.cameraTargetMinY), 'hostile orbit inputs remain above ground');
  const transitions = [
    { x: Infinity, z: -Infinity, cameraBeta: 9 },
    { x: 9999, z: 9999, cameraRadius: -9 },
    { x: -9999, z: -9999, cameraRadius: 999 }
  ].map((pose) => sanitizeEonCityW703TransitionPose(pose, { fallback: { x: 0, z: 0 } }));
  add('transition-sweep-safe', transitions.every((pose) => pose.x >= EON_CITY_W703_CORE_BOUNDS.minX && pose.x <= EON_CITY_W703_CORE_BOUNDS.maxX && pose.z >= EON_CITY_W703_CORE_BOUNDS.minZ && pose.z <= EON_CITY_W703_CORE_BOUNDS.maxZ && pose.y === 0), 'hostile restored positions fail closed inside the world');
  const playerAnchor = { position: vector(500, -10, -500) };
  const camera = { alpha: 0, beta: 9, radius: 1, target: vector(0, -8, 0) };
  const enforced = enforceEonCityW703WorldSafety({ camera, playerAnchor });
  add('babylon-compatible-enforcement', enforced.aboveGround && playerAnchor.position.y === 0 && camera.target.y >= EON_CITY_W703_CORE_BOUNDS.cameraTargetMinY, 'runtime-compatible mutable objects are repaired in place');
  return Object.freeze({ schema: 'eonapp.w703.world-safety-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW703WorldSafety();
for (const check of report.checks) console.log(`[W703] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W703] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
