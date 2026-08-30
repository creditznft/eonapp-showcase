import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeEonExpanseW783AProgrammeReview,
  deriveEonExpanseW783AProgrammeReviewAction,
  validateEonExpanseW783AProgrammeReviewAction,
  confirmEonExpanseW783AProgrammeReview
} from '../../assets/js/city/w783/eon-expanse-w783a-future-region-programme-review.js';

const programme = { visible: true, reviewAvailable: true, status: 'programme-review-ready', recommendedRegion: { id: 'storm-sector', label: 'Storm Sector', gatewayId: 'future-gateway-storm-sector', heroRequirements: ['a','b','c'], missionFamilies: ['x','y','z'] } };

test('W783A exposes one explicit review action only after programme readiness', () => {
  const locked = deriveEonExpanseW783AProgrammeReviewAction({ programme: { visible: true, reviewAvailable: false } });
  const ready = deriveEonExpanseW783AProgrammeReviewAction({ programme });
  assert.equal(locked.available, false);
  assert.equal(ready.available, true);
  assert.equal(ready.action.regionId, 'storm-sector');
});

test('W783A rejects stale review identity before persistence', () => {
  const view = deriveEonExpanseW783AProgrammeReviewAction({ programme });
  assert.equal(validateEonExpanseW783AProgrammeReviewAction(view, { explicitUserAction: true, expectedRegionId: 'glass-desert', expectedGatewayId: view.action.gatewayId, expectedReviewToken: view.action.reviewToken }).ok, false);
  assert.equal(validateEonExpanseW783AProgrammeReviewAction(view, { explicitUserAction: true, expectedRegionId: view.action.regionId, expectedGatewayId: view.action.gatewayId, expectedReviewToken: view.action.reviewToken }).ok, true);
});

test('W783A persists only a sanitized reviewed programme without activating it', () => {
  const view = deriveEonExpanseW783AProgrammeReviewAction({ programme });
  const result = confirmEonExpanseW783AProgrammeReview(view.action, { explicitUserAction: true, at: 1000 });
  assert.equal(result.ok, true);
  assert.equal(result.state.regionId, 'storm-sector');
  assert.equal(result.state.status, 'programme-reviewed-not-unlocked');
  assert.equal(result.gatewayActivated, false);
  assert.equal(result.regionRendered, false);
});

test('W783A sanitizer rejects unknown, malformed or private programme state', () => {
  assert.equal(sanitizeEonExpanseW783AProgrammeReview({ reviewId: 'future-region-review:unknown', regionId: 'unknown', reviewedAt: 1 }), null);
  const state = sanitizeEonExpanseW783AProgrammeReview({ reviewId: 'future-region-review:archive-noir', regionId: 'archive-noir', reviewedAt: 2, privatePrompt: 'secret' });
  assert.equal(state.privateContentStored, false);
  assert.equal('privatePrompt' in state, false);
});
