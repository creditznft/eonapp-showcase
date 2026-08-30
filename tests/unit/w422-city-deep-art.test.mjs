import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_CITY_VECTOR_ART_CATALOG, EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS, getCityVectorArtCategoryCounts, getCityVectorArtPlan, getCityVectorArtSummary, validateCityVectorArtCatalog } from '../../assets/js/city/eon-city-vector-art-kit.js';
import { EON_CITY_DEEP_ART_CHAPTERS, EON_CITY_DEEP_ART_PLACEMENTS, getCityDeepArtDirectionSummary, getCityDeepArtPlacementPlan, validateCityDeepArtDirection } from '../../assets/js/city/eon-city-deep-art-direction.js';
import { getCityArtReviewSummary, getCityCinematicShots } from '../../assets/js/city/eon-city-art-review.js';
import { W422_CITY_DEEP_ART_CONTRACT, validateW422CityDeepArtContract } from '../../config/w422-city-deep-art-contract.mjs';
import { inspectW422CityDeepArt } from '../../scripts/w422-city-deep-art-gate.mjs';

test('W422 expands EON City to a 58-piece original local art system with controlled category budgets', () => {
  assert.equal(validateW422CityDeepArtContract().length, 0);
  assert.equal(validateCityVectorArtCatalog().ok, true);
  assert.equal(EON_CITY_VECTOR_ART_CATALOG.length, 58);
  assert.equal(EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS.length, 40);
  assert.deepEqual(getCityVectorArtCategoryCounts(), { material: 12, backdrop: 8, decal: 30, prop: 8 });
  const summary = getCityVectorArtSummary({ quality: 'cinematic' });
  assert.equal(summary.catalogCount, 58);
  assert.equal(summary.foundationCatalogCount, 18);
  assert.equal(summary.deepArtExtensionCount, 40);
  assert.equal(summary.finalInstitutionalArtClaim, false);
});

test('W422 quality tiers progressively select local vector art without a final binary-art claim', () => {
  const lite = getCityVectorArtPlan({ quality: 'lite' });
  const balanced = getCityVectorArtPlan({ quality: 'balanced' });
  const cinematic = getCityVectorArtPlan({ quality: 'cinematic' });
  assert.ok(lite.entries.length < balanced.entries.length);
  assert.ok(balanced.entries.length < cinematic.entries.length);
  assert.equal(cinematic.entries.length, 58);
  assert.ok(cinematic.entries.every((entry) => entry.sameOrigin && entry.remoteNetwork === false && entry.finalBinaryArt === false));
});

test('W422 maps five authored City art chapters to thirty-three bounded local placements', () => {
  const validation = validateCityDeepArtDirection();
  assert.equal(validation.ok, true);
  assert.deepEqual(EON_CITY_DEEP_ART_CHAPTERS.map((entry) => entry.id), W422_CITY_DEEP_ART_CONTRACT.requiredChapterIds);
  assert.equal(EON_CITY_DEEP_ART_PLACEMENTS.length, 33);
  assert.ok(getCityDeepArtPlacementPlan({ quality: 'balanced' }).placements.length < getCityDeepArtPlacementPlan({ quality: 'cinematic' }).placements.length);
  const summary = getCityDeepArtDirectionSummary({ quality: 'cinematic' });
  assert.equal(summary.placementCount, 33);
  assert.equal(summary.finalInstitutionalArtClaim, false);
});

test('W422 art review exposes all 58 assets, filters/chapters and ten bounded local views', () => {
  const review = getCityArtReviewSummary({ quality: 'cinematic' });
  assert.equal(review.vectorArt.catalogCount, 58);
  assert.equal(review.originalArtEntries.length, 58);
  assert.equal(review.artChapters.length, 5);
  assert.deepEqual(getCityCinematicShots().map((entry) => entry.id), W422_CITY_DEEP_ART_CONTRACT.requiredShotIds);
  assert.equal(review.finalInstitutionalArtClaim, false);
});

test('W422 source gate keeps original art, local-only runtime and external final-art proof boundaries intact', () => {
  const report = inspectW422CityDeepArt();
  assert.equal(report.status, 'pass');
  assert.equal(report.checkCount, 10);
  assert.equal(report.artCatalog.total, 58);
  assert.equal(report.finalArtClaim, false);
});
