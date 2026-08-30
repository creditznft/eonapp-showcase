import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE,
  selectEonExpanseW792AStormSectorLod,
  validateEonExpanseW792AStormSectorPackage
} from '../../assets/js/city/w792/eon-expanse-w792a-storm-sector-authored-package.js';

const toImmutableCityBinaryUrl = (url, sha256) => {
  const source = String(url || '');
  const extensionIndex = source.lastIndexOf('.');
  const extension = extensionIndex >= 0 ? source.slice(extensionIndex) : '';
  const relative = source.replace(/^\/assets\/city\//, '').slice(0, extension ? -extension.length : undefined);
  return `/assets/city/immutable/${relative}.${String(sha256 || '').slice(0, 12)}${extension}`;
};

test('W792A package contains three authored heroes with exact LOD policy', () => {
  const result = validateEonExpanseW792AStormSectorPackage();
  assert.equal(result.ok, true, result.errors.join(','));
  assert.equal(result.authoredHeroCount, 3);
  assert.equal(result.localAudioCount, 3);
  assert.equal(result.certificationState, 'candidate-visible-validation-required');
  assert.equal(result.activatesGateway, false);
  assert.equal(result.rendersRegion, false);
});

test('W792A quality profiles select deterministic LODs', () => {
  assert.deepEqual(selectEonExpanseW792AStormSectorLod('lite').map((entry) => entry.level), [2, 2, 2]);
  assert.deepEqual(selectEonExpanseW792AStormSectorLod('balanced').map((entry) => entry.level), [1, 1, 1]);
  assert.deepEqual(selectEonExpanseW792AStormSectorLod('cinematic').map((entry) => entry.level), [0, 0, 0]);
});

test('W792A accepts production content-addressed hero URLs without weakening package authority', () => {
  const built = structuredClone(EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE);
  for (const entry of built.heroAssets) {
    for (const level of entry.lods) level.url = toImmutableCityBinaryUrl(level.url, level.sha256);
  }
  const result = validateEonExpanseW792AStormSectorPackage(built);
  assert.equal(result.ok, true, result.errors.join(','));
  assert.equal(result.packageDigest, EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.packageDigest);
  assert.ok(built.heroAssets.every((entry) => entry.lods.every((level) => /^\/assets\/city\/immutable\/future-regions\/storm-sector\/.+\.[a-f0-9]{12}\.glb$/i.test(level.url))));
});

test('W792A rejects malformed or cross-region immutable hero URLs', () => {
  const built = structuredClone(EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE);
  built.heroAssets[0].lods[0].url = '/assets/city/immutable/future-regions/other-sector/models/storm-command-spire-lod0.39b351b68b4d.glb';
  const result = validateEonExpanseW792AStormSectorPackage(built);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('hero-lod:storm-command-spire:0'));
});

test('W792A rejects proxy, autoplay and runtime ownership claims', () => {
  const bad = {
    ...EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE,
    heroAssets: [{ ...EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.heroAssets[0], developmentProxy: true }],
    audioFamilies: [{ ...EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.audioFamilies[0], explicitStartRequired: false }],
    ownsScene: true,
    automaticActivation: true
  };
  const result = validateEonExpanseW792AStormSectorPackage(bad);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => entry.startsWith('hero-policy:')));
  assert.ok(result.errors.some((entry) => entry.startsWith('audio-policy:')));
  assert.ok(result.errors.includes('runtime-authority-invalid'));
  assert.ok(result.errors.includes('safety-boundary-invalid'));
});
