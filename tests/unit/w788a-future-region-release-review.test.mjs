import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveEonExpanseW788AReleaseReviewAction, validateEonExpanseW788AReleaseReviewAction, confirmEonExpanseW788AReleaseReview, sanitizeEonExpanseW788AReleaseReview } from '../../assets/js/city/w788/eon-expanse-w788a-future-region-release-review.js';

const packageDigest = 'a'.repeat(64);
const ready = () => deriveEonExpanseW788AReleaseReviewAction({
  releaseMatrix: { visible: true, releaseReviewReady: true, regionId: 'storm-sector' },
  packageReadiness: { certificationReady: true, regionId: 'storm-sector', gatewayId: 'future-gateway-storm-sector', packageDigest, certifiedAt: 9000 }
});

test('W788A exposes final review only after all evidence and exact package certification', () => {
  assert.equal(deriveEonExpanseW788AReleaseReviewAction().available, false);
  const view = ready();
  assert.equal(view.available, true);
  assert.equal(view.action.packageDigest, packageDigest);
});

test('W788A rejects stale region, gateway, digest and token identity', () => {
  const view = ready();
  assert.equal(validateEonExpanseW788AReleaseReviewAction(view, { explicitUserAction: true, expectedRegionId: 'wrong', expectedGatewayId: view.action.gatewayId, expectedPackageDigest: packageDigest, expectedReviewToken: view.action.reviewToken }).ok, false);
  assert.equal(validateEonExpanseW788AReleaseReviewAction(view, { explicitUserAction: true, expectedRegionId: view.action.regionId, expectedGatewayId: view.action.gatewayId, expectedPackageDigest: 'b'.repeat(64), expectedReviewToken: view.action.reviewToken }).ok, false);
});

test('W788A confirmation persists review truth while keeping the gateway locked', () => {
  const view = ready();
  const validated = validateEonExpanseW788AReleaseReviewAction(view, { explicitUserAction: true, expectedRegionId: view.action.regionId, expectedGatewayId: view.action.gatewayId, expectedPackageDigest: view.action.packageDigest, expectedReviewToken: view.action.reviewToken });
  const confirmed = confirmEonExpanseW788AReleaseReview(validated.action, { explicitUserAction: true, at: 12000 });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.state.status, 'release-reviewed-gateway-still-locked');
  assert.equal(confirmed.state.gatewayActivated, false);
  assert.equal(confirmed.state.regionRendered, false);
});

test('W788A sanitizer strips private or activation claims', () => {
  const state = sanitizeEonExpanseW788AReleaseReview({ reviewId: 'future-region-release-review:storm-sector', regionId: 'storm-sector', packageDigest, reviewedAt: 1, gatewayActivated: true, privatePrompt: 'remove' });
  assert.equal(state.gatewayActivated, false);
  assert.equal(state.privatePrompt, undefined);
  assert.equal(state.privateContentStored, false);
});
