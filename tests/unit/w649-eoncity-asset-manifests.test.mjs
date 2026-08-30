import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_RUNTIME_ASSET_MANIFEST,
  EON_CITY_W649_RUNTIME_CACHE_VERSION,
  EON_CITY_W649_RUNTIME_EXTENSION_SCHEMA,
  validateEonCityRuntimeAssetManifest
} from '../../assets/js/city/eon-city-runtime-asset-manifest.js';
import {
  EON_CITY_W649_CHARACTER_MANIFEST,
  getEonCityW649Character,
  validateEonCityW649CharacterManifest
} from '../../assets/js/city/w649/eon-city-w649-character-manifest.js';
import {
  EON_CITY_W649_WORLD_MANIFEST,
  getEonCityW649WorldAsset,
  validateEonCityW649WorldManifest
} from '../../assets/js/city/w649/eon-city-w649-world-manifest.js';
import {
  EON_CITY_W649_ANIMATION_MANIFEST,
  resolveEonCityW649Clip,
  validateEonCityW649AnimationManifest
} from '../../assets/js/city/w649/eon-city-w649-animation-manifest.js';
import {
  EON_CITY_W649_DISTRICT_MANIFEST,
  validateEonCityW649DistrictManifest
} from '../../assets/js/city/w649/eon-city-w649-district-manifest.js';
import {
  resolveEonCityW649AssetVariant,
  validateEonCityW649CapabilityResolution
} from '../../assets/js/city/w649/eon-city-w649-capability-resolver.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const intake = JSON.parse(fs.readFileSync(path.join(root, 'config/w649-eoncity-asset-intake.json'), 'utf8'));
const activeAssets = [...EON_CITY_W649_CHARACTER_MANIFEST.entries, ...EON_CITY_W649_WORLD_MANIFEST.entries];

function localAssetPath(publicPath) {
  return path.join(root, String(publicPath || '').replace(/^\//, ''));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('W649C bridges the content-hashed library into the compatible runtime manifest', () => {
  const validation = validateEonCityRuntimeAssetManifest();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.w649.schema, EON_CITY_W649_RUNTIME_EXTENSION_SCHEMA);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.w649.cacheVersion, EON_CITY_W649_RUNTIME_CACHE_VERSION);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.w649.activeLogicalAssetCount, 33);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.w649.variantPolicy.preloadAll, false);
  assert.equal(EON_CITY_RUNTIME_ASSET_MANIFEST.w649.truth.authenticatedBootOnly, true);
});

test('W649C character, world, animation, and district manifests validate as one active set', () => {
  assert.deepEqual(validateEonCityW649CharacterManifest(), { ok: true, errors: [], count: 15 });
  assert.deepEqual(validateEonCityW649WorldManifest(), { ok: true, errors: [], count: 18 });
  assert.deepEqual(validateEonCityW649AnimationManifest(), { ok: true, errors: [], count: 15 });
  assert.deepEqual(validateEonCityW649DistrictManifest(), { ok: true, errors: [], count: 9 });
  assert.equal(activeAssets.length, 33);
  assert.equal(new Set(activeAssets.map((asset) => asset.id)).size, 33);
  assert.ok(getEonCityW649Character('eoncity-pathfinder-prime-11clips'));
  assert.ok(getEonCityW649WorldAsset('eoncity-orientation-hall'));
  assert.equal(resolveEonCityW649Clip('eon-x1-worker-9clips', 'idle'), 'Idle_12');
});

test('W649C every active logical asset has primary and decoder-free fallback variants', () => {
  for (const asset of activeAssets) {
    assert.equal(asset.lifecycle, 'active', asset.id);
    assert.match(asset.variants.primary.path, /^\/assets\/city\/w649\/primary\/(?:characters|world)\/.+\.[a-f0-9]{12}\.glb$/i, asset.id);
    assert.match(asset.variants.fallback.path, /^\/assets\/city\/w649\/fallback\/(?:characters|world)\/.+\.[a-f0-9]{12}\.glb$/i, asset.id);
    assert.match(asset.variants.primary.integrity, /^sha256-[a-f0-9]{64}$/i, asset.id);
    assert.match(asset.variants.fallback.integrity, /^sha256-[a-f0-9]{64}$/i, asset.id);
    assert.equal(validateEonCityW649CapabilityResolution(asset).ok, true, asset.id);
    assert.equal(resolveEonCityW649AssetVariant(asset, { meshoptDecoderReady: true, webpTextureReady: true }).variant, 'primary', asset.id);
    assert.equal(resolveEonCityW649AssetVariant(asset, { meshoptDecoderReady: false, webpTextureReady: true }).variant, 'fallback', asset.id);
    assert.equal(resolveEonCityW649AssetVariant(asset, { meshoptDecoderReady: true, webpTextureReady: true, reducedData: true }).variant, 'fallback', asset.id);
  }
});

test('W649C intake receipt accounts for 76 immutable binaries and keeps hold assets inactive', () => {
  assert.equal(intake.schema, 'eon.city.w649.asset-intake.v1');
  assert.equal(intake.assetCount, 76);
  assert.equal(intake.logicalAssetCount, 38);
  assert.equal(intake.activeLogicalAssetCount, 33);
  assert.deepEqual(intake.variants, ['primary', 'fallback']);
  assert.equal(intake.entries.length, 76);
  const activeIds = new Set(activeAssets.map((asset) => asset.id));
  const intakeActiveIds = new Set(intake.entries.filter((entry) => entry.lifecycle === 'active').map((entry) => entry.id));
  assert.deepEqual(intakeActiveIds, activeIds);
  const holdIds = new Set(intake.entries.filter((entry) => entry.lifecycle !== 'active').map((entry) => entry.id));
  assert.deepEqual(holdIds, new Set([
    'eoncity-civilian-static-candidate',
    'eoncity-creator-command-static',
    'eoncity-m4-maintenance-specialist-static',
    'eoncity-security-sentinel-static-candidate',
    'eoncity-x1-worker-8clips'
  ]));
});

test('W649C every imported binary matches its recorded byte count and SHA-256', () => {
  for (const entry of intake.entries) {
    const filePath = localAssetPath(entry.path);
    assert.equal(fs.existsSync(filePath), true, entry.path);
    assert.equal(fs.statSync(filePath).size, entry.bytes, entry.path);
    assert.equal(sha256(filePath), entry.sha256, entry.path);
    assert.equal(entry.integrity, `sha256-${entry.sha256}`, entry.path);
  }
});

test('W649C district residency is lazy and references only known active assets', () => {
  const activeIds = new Set(activeAssets.map((asset) => asset.id));
  const bootstrap = EON_CITY_W649_DISTRICT_MANIFEST.districts[0];
  assert.equal(bootstrap.id, 'bootstrap');
  assert.equal(bootstrap.proximityLoad, false);
  assert.equal(bootstrap.unloadOnExit, false);
  for (const district of EON_CITY_W649_DISTRICT_MANIFEST.districts) {
    for (const assetId of district.assets) assert.equal(activeIds.has(assetId), true, `${district.id}:${assetId}`);
    if (district.id !== 'bootstrap') {
      assert.equal(district.proximityLoad, true, district.id);
      assert.equal(district.unloadOnExit, true, district.id);
    }
  }
});
