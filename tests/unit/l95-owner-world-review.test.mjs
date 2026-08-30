import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  deriveEonCityL95StormReviewActivation,
  projectEonCityL95OwnerReviewAvailability
} from '../../assets/js/city/l95/eon-city-l95-owner-world-review.js';
import { sanitizeEonExpanseW793AActivation } from '../../assets/js/city/w793/eon-expanse-w793a-future-region-activation.js';

test('L95 owner world review creates an exact transient Storm activation but no progression authority', () => {
  assert.equal(deriveEonCityL95StormReviewActivation({ enabled: false }), null);
  const review = deriveEonCityL95StormReviewActivation({ enabled: true, at: 123456 });
  assert.equal(review.ownerReview, true);
  assert.equal(review.reviewOnly, true);
  assert.equal(review.persistsActivation, false);
  assert.equal(review.grantsXp, false);
  assert.equal(review.grantsCampaignCompletion, false);
  assert.equal(review.grantsConstructionPermit, false);
  assert.equal(review.deploymentChannel, 'preview');
  assert.equal(Boolean(sanitizeEonExpanseW793AActivation(review)), true);
});

test('L95 owner review projects temporary availability without claiming public certification', () => {
  const review = deriveEonCityL95StormReviewActivation({ enabled: true, at: 123456 });
  const projected = projectEonCityL95OwnerReviewAvailability({ stormSector: { available: false, reason: 'certified-activation-required' } }, review);
  assert.equal(projected.stormSector.available, true);
  assert.equal(projected.stormSector.ownerReview, true);
  assert.equal(projected.stormSector.reviewOnly, true);
  assert.equal(projected.stormSector.publicCertified, false);
  assert.equal(projected.stormSector.certificationBypassedForPublic, false);
  assert.equal(projected.stormSector.persistsActivation, false);
});

test('L95 direct review projects the same transient package without an owner-only label', () => {
  const review = deriveEonCityL95StormReviewActivation({ enabled: true, ownerReview: false, at: 123456 });
  const projected = projectEonCityL95OwnerReviewAvailability({ stormSector: { available: false, reason: 'certified-activation-required' } }, review);
  assert.equal(projected.stormSector.available, true);
  assert.equal(projected.stormSector.ownerReview, false);
  assert.equal(projected.stormSector.directReview, true);
  assert.equal(projected.stormSector.reviewOnly, true);
  assert.equal(projected.stormSector.publicCertified, false);
});

test('L95 legacy preview mode cannot authorize owner world review', async () => {
  const station = await readFile(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
  const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(station, /ownerWorldReview: false/);
  assert.match(runtime, /const ownerWorldReviewEnabled = ownerWorldReview === true/);
  assert.match(runtime, /projectEonCityL95OwnerReviewAvailability\(publicAvailability, stormReviewActivation\)/);
  assert.match(runtime, /owner-review-read-only/);
  assert.match(runtime, /Review Storm Sector/);
  assert.match(runtime, /persistsActivation: availability\.stormSector\.reviewOnly !== true/);
});

test('L95 owner review marker is visible but cannot steal mobile input', async () => {
  const css = await readFile(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
  assert.match(css, /data-eon-city-owner-world-review="true"/);
  assert.match(css, /OWNER REVIEW · NO PROGRESSION/);
  assert.match(css, /pointer-events:none/);
  assert.match(css, /@media \(max-width:620px\)/);
});
