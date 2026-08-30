import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getEonCityProceduralRendererProfile } from '../../assets/js/city/eon-city-procedural-renderer-profile.js';
import { inspectW416CityRendererHardening } from '../../scripts/w416-city-renderer-hardening-gate.mjs';
import { validateW416CityRendererHardeningContract } from '../../config/w416-city-renderer-hardening-contract.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W416 exposes a PBR procedural renderer profile without claiming binary final art', () => {
  const profile = getEonCityProceduralRendererProfile();
  assert.equal(profile.primaryWorldMaterial, 'PBRMetallicRoughnessMaterial');
  assert.equal(profile.displayMaterial, 'StandardMaterial (local DynamicTexture panels only)');
  assert.equal(profile.finalBinaryArt, false);
  assert.equal(profile.remoteAssets, false);
});

test('W416 limits shadows to cinematic opt-in quality', () => {
  const profile = getEonCityProceduralRendererProfile();
  assert.deepEqual(profile.shadows, { lite: false, balanced: false, cinematic: true });
  assert.equal(validateW416CityRendererHardeningContract().length, 0);
});

test('W416 renderer-hardening gate retains explicit proof limits', () => {
  const report = inspectW416CityRendererHardening();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 8);
});

test('W416 City art direction does not assign a getter-only Babylon scene property', () => {
  const source = read('assets/js/city/eon-city-play-babylon.js');
  assert.doesNotMatch(source, /scene\.imageProcessingConfiguration\s*=\s*configuration/);
  assert.match(source, /const configuration = scene\.imageProcessingConfiguration \|\| new ImageProcessingConfiguration\(\)/);
});

test('W416 Babylon shadow generator registers its required scene side effect', () => {
  const source = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(source, /import '@babylonjs\/core\/Lights\/Shadows\/shadowGeneratorSceneComponent';/);
});
