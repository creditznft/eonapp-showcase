#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W731_LAUNCH_ASSET_MANIFEST } from '../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const groups = ['coreLazy', 'coreWorld', 'stationWorld', 'stationProps', 'discoveryWorld', 'roleCharacters', 'ambientAssets'];
const entries = groups.flatMap((group) => EON_CITY_W731_LAUNCH_ASSET_MANIFEST[group] || []);

function localPath(assetPath = '') {
  return path.join(root, String(assetPath).replace(/^\//, ''));
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function readGlbJson(file) {
  const buffer = fs.readFileSync(file);
  assert.equal(buffer.toString('utf8', 0, 4), 'glTF', `${file}: GLB magic`);
  assert.equal(buffer.readUInt32LE(4), 2, `${file}: GLB version`);
  assert.equal(buffer.readUInt32LE(8), buffer.length, `${file}: declared byte length`);
  const jsonLength = buffer.readUInt32LE(12);
  assert.equal(buffer.toString('utf8', 16, 20), 'JSON', `${file}: first chunk JSON`);
  return JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).replace(/[\0\s]+$/, ''));
}

let variantsChecked = 0;
let bytesChecked = 0;
for (const entry of entries) {
  for (const [variantName, variant] of Object.entries(entry.variants || {})) {
    const file = localPath(variant.path);
    assert.equal(fs.existsSync(file), true, `${entry.alias}:${variantName}: file exists`);
    const stats = fs.statSync(file);
    assert.equal(stats.size, variant.bytes, `${entry.alias}:${variantName}: bytes`);
    assert.equal(sha256(file), variant.sha256, `${entry.alias}:${variantName}: sha256`);
    const gltf = readGlbJson(file);
    assert.ok((gltf.meshes || []).length > 0, `${entry.alias}:${variantName}: mesh`);
    assert.ok((gltf.materials || []).length > 0, `${entry.alias}:${variantName}: material`);
    variantsChecked += 1;
    bytesChecked += stats.size;
  }
}

const pathfinder = entries.find((entry) => entry.alias === 'player-primary');
assert.ok(pathfinder, 'Pathfinder launch entry');
for (const [variantName, variant] of Object.entries(pathfinder.variants || {})) {
  const gltf = readGlbJson(localPath(variant.path));
  assert.deepEqual((gltf.animations || []).map((animation) => animation.name), pathfinder.animations, `Pathfinder ${variantName} clips`);
  assert.ok((gltf.skins || []).length > 0, `Pathfinder ${variantName} rig`);
}

const eonbot = entries.find((entry) => entry.alias === 'eonbot');
assert.ok(eonbot, 'EONBOT launch entry');
for (const [variantName, variant] of Object.entries(eonbot.variants || {})) {
  const gltf = readGlbJson(localPath(variant.path));
  assert.equal((gltf.animations || []).length, 0, `EONBOT ${variantName} uses runtime movement director`);
}

console.log(JSON.stringify({
  schema: 'eonapp.w745.launch-asset-binary-integrity.v1',
  ok: true,
  entriesChecked: entries.length,
  variantsChecked,
  bytesChecked,
  pathfinderClips: pathfinder.animations,
  eonbotRuntimeDirected: true
}, null, 2));
console.log('W745 ASSET BINARY INTEGRITY PASS');
