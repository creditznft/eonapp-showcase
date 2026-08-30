import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W649_CHARACTER_MANIFEST, validateEonCityW649CharacterManifest } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_ANIMATION_MANIFEST, validateEonCityW649AnimationManifest } from '../assets/js/city/w649/eon-city-w649-animation-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST, validateEonCityW649DistrictManifest } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'config/w662g-cast-certification.json'), 'utf8'));
const hashFile = async (file) => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');

assert.equal(validateEonCityW649CharacterManifest(EON_CITY_W649_CHARACTER_MANIFEST).ok, true, 'character manifest invalid');
assert.equal(validateEonCityW649AnimationManifest(EON_CITY_W649_ANIMATION_MANIFEST).ok, true, 'animation manifest invalid');
assert.equal(validateEonCityW649DistrictManifest(EON_CITY_W649_DISTRICT_MANIFEST).ok, true, 'district manifest invalid');
assert.equal(config.roster.length, EON_CITY_W649_CHARACTER_MANIFEST.entries.length);
assert.equal(config.counts.expectedVariantFiles, config.roster.length * 2);
const ids = new Set();
let totalBytes = 0;
for (const row of config.roster) {
  assert.ok(row.assetId && !ids.has(row.assetId), `duplicate cast id ${row.assetId}`);
  ids.add(row.assetId);
  assert.equal(row.authenticatedHumanProof, false, `${row.assetId} cannot be auto-certified`);
  assert.ok(Array.isArray(row.requiredBehaviorProof), `${row.assetId} behavior proof missing`);
  for (const variantName of ['primary', 'fallback']) {
    const variant = row.variants[variantName];
    assert.match(variant.path, /\.[a-f0-9]{12}\.glb$/i, `${row.assetId}:${variantName} unhashed path`);
    const localPath = path.join(root, variant.path.replace(/^\//, ''));
    const stat = await fs.stat(localPath);
    assert.equal(stat.size, variant.bytes, `${row.assetId}:${variantName} byte mismatch`);
    assert.equal(await hashFile(localPath), variant.sha256, `${row.assetId}:${variantName} hash mismatch`);
    totalBytes += stat.size;
  }
}
const districtIds = new Set(EON_CITY_W649_DISTRICT_MANIFEST.districts.flatMap((row) => row.assets));
for (const row of config.roster) assert.ok(districtIds.has(row.assetId) || row.assetId === 'eoncity-eonbot-charging-station', `${row.assetId} has no district/load link`);
console.log(JSON.stringify({ ok: true, schema: config.schema, castAssets: config.roster.length, variantFiles: config.counts.expectedVariantFiles, totalBytes, humanProofAccepted: false }, null, 2));
