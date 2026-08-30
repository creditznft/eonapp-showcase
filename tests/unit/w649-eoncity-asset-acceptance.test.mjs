import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  auditW649StaticLibrary,
  parseW649Glb
} from '../../scripts/w649-eoncity-asset-acceptance.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const intake = JSON.parse(fs.readFileSync(path.join(root, 'config/w649-eoncity-asset-intake.json'), 'utf8'));

function localAssetPath(publicPath) {
  return path.join(root, String(publicPath || '').replace(/^\//, ''));
}

test('W649 asset acceptance parser rejects malformed GLB data', () => {
  assert.throws(() => parseW649Glb(Buffer.from('not-a-glb'), 'malformed.glb'), /too short|invalid GLB magic/);
});

test('W649 asset acceptance performs deep static validation over all 76 binaries', () => {
  const audit = auditW649StaticLibrary({ root, intake });
  assert.equal(audit.ok, true, JSON.stringify(audit.errors, null, 2));
  assert.equal(audit.entries.length, 76);
  assert.equal(audit.pairs.length, 38);
  assert.equal(audit.entries.filter((entry) => entry.variant === 'primary' && entry.signature.extensionsRequired.includes('EXT_meshopt_compression')).length, 38);
  assert.equal(audit.entries.filter((entry) => entry.variant === 'fallback' && !entry.signature.extensionsUsed.includes('EXT_meshopt_compression')).length, 38);
  assert.equal(audit.entries.filter((entry) => entry.signature.extensionsRequired.includes('EXT_texture_webp')).length, 76);
});

test('W649 Pathfinder Prime primary and fallback preserve the expected rig and eleven clips', () => {
  const primaryEntry = intake.entries.find((entry) => entry.id === 'eoncity-pathfinder-prime-11clips' && entry.variant === 'primary');
  const fallbackEntry = intake.entries.find((entry) => entry.id === 'eoncity-pathfinder-prime-11clips' && entry.variant === 'fallback');
  const primary = parseW649Glb(fs.readFileSync(localAssetPath(primaryEntry.path)), primaryEntry.path);
  const fallback = parseW649Glb(fs.readFileSync(localAssetPath(fallbackEntry.path)), fallbackEntry.path);
  assert.equal(primary.signature.skins, 1);
  assert.equal(primary.signature.animations, 11);
  assert.deepEqual(primary.signature.animationNames, primaryEntry.animationNames);
  assert.deepEqual(primary.signature.primitiveSignature, fallback.signature.primitiveSignature);
  assert.deepEqual(primary.signature.animationNames, fallback.signature.animationNames);
});
