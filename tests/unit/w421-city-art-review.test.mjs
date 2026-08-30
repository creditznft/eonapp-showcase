import assert from 'node:assert/strict';
import test from 'node:test';
import { getCityArtReviewSummary, getCityCinematicShot, getCityCinematicShots, validateCityArtReview } from '../../assets/js/city/eon-city-art-review.js';
import { inspectW421CityArtReview } from '../../scripts/w421-city-art-review-gate.mjs';

test('W421 exposes six bounded local cinematic City compositions', () => {
  const validation = validateCityArtReview();
  assert.equal(validation.ok, true);
  assert.ok(validation.shotCount >= 6);
  assert.deepEqual(getCityCinematicShots().slice(0, 6).map((entry) => entry.id), ['arrival-gate', 'command-deck', 'creator-atrium', 'forge-bay', 'signal-tower', 'archive-gardens']);
  const shot = getCityCinematicShot('command-deck');
  assert.equal(shot.localOnly, true);
  assert.equal(shot.opensRoute, false);
  assert.equal(shot.capturesMedia, false);
  assert.equal(shot.uploadsMedia, false);
  assert.ok(shot.camera.radius >= 10 && shot.camera.radius <= 24);
});

test('W421 summarizes real shipped original vector art without a final-art claim', () => {
  const review = getCityArtReviewSummary({ quality: 'cinematic' });
  assert.equal(review.quality, 'cinematic');
  assert.ok(review.vectorArt.catalogCount >= 18);
  assert.equal(review.originalArtEntries.length, review.vectorArt.catalogCount);
  assert.equal(review.originalVectorArtShipped, true);
  assert.equal(review.binaryArtShipped, false);
  assert.equal(review.remoteNetwork, false);
  assert.equal(review.screenshotCapture, false);
  assert.equal(review.finalVisualCertification, false);
  assert.equal(review.finalInstitutionalArtClaim, false);
});

test('W421 source gate preserves local review and proof boundaries', () => {
  const report = inspectW421CityArtReview();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 8);
});
