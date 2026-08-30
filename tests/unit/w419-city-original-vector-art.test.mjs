import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_VECTOR_ART_CATALOG, getCityVectorArtAsset, getCityVectorArtPlan, getCityVectorArtSummary, validateCityVectorArtCatalog } from '../../assets/js/city/eon-city-vector-art-kit.js';
import { W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT, validateW419CityOriginalVectorArtContract } from '../../config/w419-city-original-vector-art-contract.mjs';
import { inspectW419CityOriginalVectorArt } from '../../scripts/w419-city-original-vector-art-gate.mjs';

test('W419 foundation remains present inside the expanded original local vector City art system', () => {
  assert.equal(validateW419CityOriginalVectorArtContract().length, 0);
  assert.equal(validateCityVectorArtCatalog().ok, true);
  assert.ok(EON_CITY_VECTOR_ART_CATALOG.length >= W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT.requiredArtIds.length);
  assert.ok(W419_CITY_ORIGINAL_VECTOR_ART_CONTRACT.requiredArtIds.every((id) => EON_CITY_VECTOR_ART_CATALOG.some((entry) => entry.id === id)));
  assert.ok(EON_CITY_VECTOR_ART_CATALOG.every((entry) => entry.origin === 'EONAPP original in-house work' && entry.sameOrigin === true && entry.remoteNetwork === false && entry.finalBinaryArt === false));
});

test('W419 quality plans preserve mobile fallback while retaining a rich balanced and cinematic art kit', () => {
  assert.ok(getCityVectorArtPlan({ quality: 'lite' }).entries.length < getCityVectorArtPlan({ quality: 'balanced' }).entries.length);
  assert.equal(getCityVectorArtPlan({ quality: 'cinematic' }).entries.length, EON_CITY_VECTOR_ART_CATALOG.length);
  assert.equal(getCityVectorArtAsset('skyline-depth').category, 'backdrop');
  assert.equal(getCityVectorArtAsset('arrival-emblem').category, 'decal');
  const summary = getCityVectorArtSummary({ quality: 'cinematic' });
  assert.equal(summary.originalVectorArtShipped, true);
  assert.equal(summary.binaryArtShipped, false);
  assert.equal(summary.finalInstitutionalArtClaim, false);
});

test('W419 source gate verifies hashes, same-origin paths and Babylon composition integration', () => {
  const report = inspectW419CityOriginalVectorArt();
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 9);
  assert.equal(report.finalBinaryArt, false);
});
