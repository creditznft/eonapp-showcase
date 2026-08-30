import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_CINEMATIC_ART_DIRECTION, getCityCinematicArtDirection, validateCityCinematicArtDirection } from '../../assets/js/city/eon-city-cinematic-art-direction.js';
import { W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT } from '../../config/w420-city-cinematic-art-direction-contract.mjs';
import { inspectW420CityCinematicArtDirection } from '../../scripts/w420-city-cinematic-art-direction-gate.mjs';

test('W420 offers bounded local Lite, Balanced and Cinematic composition profiles', () => {
  assert.equal(validateCityCinematicArtDirection().ok, true);
  assert.deepEqual(Object.keys(EON_CITY_CINEMATIC_ART_DIRECTION), ['lite', 'balanced', 'cinematic']);
  const lite = getCityCinematicArtDirection({ quality: 'lite' });
  const cinematic = getCityCinematicArtDirection({ quality: 'cinematic' });
  assert.equal(lite.vignette.enabled, false);
  assert.equal(cinematic.toneMapping, 'aces');
  assert.equal(cinematic.vignette.enabled, true);
  assert.equal(cinematic.dithering.enabled, false);
  assert.equal(cinematic.remoteLut, false);
  assert.equal(cinematic.finalVisualCertification, false);
});

test('W420 rejects invalid external or unbounded source profile values', () => {
  const invalid = JSON.parse(JSON.stringify(EON_CITY_CINEMATIC_ART_DIRECTION));
  invalid.cinematic.exposure = 2;
  invalid.cinematic.clearColor = 'https://example.invalid/lut';
  invalid.cinematic.remoteLut = true;
  const result = validateCityCinematicArtDirection(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => /exposure|colors|remote/i.test(message)));
});

test('W420 source gate retains no-final-art and no-device-proof boundaries', () => {
  const report = inspectW420CityCinematicArtDirection({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 7);
  assert.equal(W420_CITY_CINEMATIC_ART_DIRECTION_CONTRACT.boundary.finalVisualCertification, false);
});
