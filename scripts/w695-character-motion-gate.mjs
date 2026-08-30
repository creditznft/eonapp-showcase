#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS,
  validateEonCityW695CalibrationRegistry
} from '../assets/js/city/w695/eon-city-w695-character-motion-truth.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const variants = Object.freeze({
  'eoncity-pathfinder-prime-11clips': Object.freeze({
    primary: 'assets/city/w649/primary/characters/eoncity_pathfinder_prime_11clips.4fc5f5bc696f.glb',
    fallback: 'assets/city/w649/fallback/characters/eoncity_pathfinder_prime_11clips.bd52fc0c68a6.glb'
  }),
  'eoncity-pathfinder-a-vanguard-6clips': Object.freeze({
    primary: 'assets/city/w649/primary/characters/eoncity_pathfinder_a_vanguard_6clips.341989730eef.glb',
    fallback: 'assets/city/w649/fallback/characters/eoncity_pathfinder_a_vanguard_6clips.f87948576117.glb'
  })
});

function readGlbJson(relative) {
  const body = fs.readFileSync(path.join(root, relative));
  if (body.toString('ascii', 0, 4) !== 'glTF') throw new Error(`invalid-glb:${relative}`);
  let offset = 12;
  while (offset + 8 <= body.length) {
    const length = body.readUInt32LE(offset);
    const type = body.readUInt32LE(offset + 4);
    offset += 8;
    const chunk = body.subarray(offset, offset + length);
    offset += length;
    if (type === 0x4e4f534a) return { json: JSON.parse(chunk.toString('utf8').replace(/[\0\s]+$/g, '')), body };
  }
  throw new Error(`json-chunk-missing:${relative}`);
}

function quaternionMatrix([x = 0, y = 0, z = 0, w = 1] = []) {
  return [
    1 - 2 * (y*y + z*z), 2 * (x*y - z*w), 2 * (x*z + y*w), 0,
    2 * (x*y + z*w), 1 - 2 * (x*x + z*z), 2 * (y*z - x*w), 0,
    2 * (x*z - y*w), 2 * (y*z + x*w), 1 - 2 * (x*x + y*y), 0,
    0, 0, 0, 1
  ];
}
function multiply(a, b) {
  const out = Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 4; col += 1) for (let k = 0; k < 4; k += 1) out[row*4+col] += a[row*4+k] * b[k*4+col];
  return out;
}
function trs(node = {}) {
  if (Array.isArray(node.matrix) && node.matrix.length === 16) {
    const m = node.matrix;
    return [m[0],m[4],m[8],m[12],m[1],m[5],m[9],m[13],m[2],m[6],m[10],m[14],m[3],m[7],m[11],m[15]];
  }
  const [tx=0,ty=0,tz=0] = node.translation || [];
  const [sx=1,sy=1,sz=1] = node.scale || [];
  const t = [1,0,0,tx,0,1,0,ty,0,0,1,tz,0,0,0,1];
  const r = quaternionMatrix(node.rotation);
  const s = [sx,0,0,0,0,sy,0,0,0,0,sz,0,0,0,0,1];
  return multiply(multiply(t,r),s);
}
function worldPositions(json) {
  const nodes = json.nodes || [];
  const parents = Array(nodes.length).fill(-1);
  nodes.forEach((node, index) => (node.children || []).forEach((child) => { parents[child] = index; }));
  const world = Array(nodes.length).fill(null);
  const resolve = (index) => {
    if (world[index]) return world[index];
    const local = trs(nodes[index]);
    world[index] = parents[index] >= 0 ? multiply(resolve(parents[index]), local) : local;
    return world[index];
  };
  const positions = new Map();
  nodes.forEach((node, index) => { const m = resolve(index); positions.set(node.name || `node-${index}`, { x:m[3], y:m[7], z:m[11] }); });
  return positions;
}
function delta(a, b) { return { x:a.x-b.x, y:a.y-b.y, z:a.z-b.z }; }

export function inspectW695CharacterMotion() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const registry = validateEonCityW695CalibrationRegistry();
  add('registry-valid', registry.ok, registry.errors.join(', ') || 'asset/variant calibrations validate');
  let allHashes = true;
  let allAxes = true;
  const audits = [];
  for (const [assetId, assetVariants] of Object.entries(variants)) {
    for (const [variant, relative] of Object.entries(assetVariants)) {
      const { json, body } = readGlbJson(relative);
      const sha256 = crypto.createHash('sha256').update(body).digest('hex');
      const calibration = EON_CITY_W695_CHARACTER_AXIS_CALIBRATIONS[assetId]?.variants?.[variant];
      allHashes &&= sha256 === calibration?.sha256;
      const positions = worldPositions(json);
      const head = positions.get('Head'); const headfront = positions.get('headfront');
      const leftFoot = positions.get('LeftFoot'); const leftToe = positions.get('LeftToeBase');
      const rightFoot = positions.get('RightFoot'); const rightToe = positions.get('RightToeBase');
      const headDelta = head && headfront ? delta(headfront, head) : null;
      const toeZ = leftFoot && leftToe && rightFoot && rightToe ? ((leftToe.z-leftFoot.z)+(rightToe.z-rightFoot.z))/2 : 0;
      const facesPositiveZ = Boolean(headDelta && headDelta.z > 0.02 && toeZ > 0.04);
      allAxes &&= facesPositiveZ && calibration?.modelForwardAxis === '+z' && Number(calibration?.visualHeadingOffset) === 0;
      audits.push(Object.freeze({ assetId, variant, relative, sha256, headfrontDeltaZ: Number(headDelta?.z?.toFixed?.(5) || 0), meanToeDeltaZ: Number(toeZ.toFixed(5)), facesPositiveZ }));
    }
  }
  add('exact-glb-hashes', allHashes, 'all four player GLB variants match frozen calibration hashes');
  add('bind-pose-forward-axis', allAxes, 'head-front and toe bind-pose evidence independently confirm +Z for every variant');
  const core = fs.readFileSync(path.join(root, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'), 'utf8');
  add('actual-displacement-integration', /createEonCityW695LocomotionTruthController/.test(core) && /lastCharacterMotionSnapshot\.moving/.test(core) && /lastCharacterMotionSnapshot\.blocked\s*\?\s*'idle'/.test(core), 'active W731 runtime derives movement and blocked idle from W695 post-clamp displacement');
  const loader = fs.readFileSync(path.join(root, 'assets/js/city/w649/eon-city-w649-babylon-core-runtime.js'), 'utf8');
  add('asset-specific-loader-calibration', /getEonCityW695CharacterAxisCalibration/.test(loader) && /modelHeadingOffset/.test(loader), 'player loader applies asset/variant-specific visual calibration');
  return Object.freeze({ schema:'eon.city.w695.character-motion-gate.v1', ok:checks.every((entry)=>entry.pass), passed:checks.filter((entry)=>entry.pass).length, total:checks.length, checks:Object.freeze(checks), audits:Object.freeze(audits) });
}

const report = inspectW695CharacterMotion();
for (const check of report.checks) console.log(`[W695] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
for (const audit of report.audits) console.log(`[W695] AXIS ${audit.assetId}:${audit.variant} headZ=${audit.headfrontDeltaZ} toeZ=${audit.meanToeDeltaZ} +Z=${audit.facesPositiveZ}`);
console.log(`[W695] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
