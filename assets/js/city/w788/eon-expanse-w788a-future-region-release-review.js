/** W788A — explicit final release review without gateway activation. */
import { getEonExpanseW780AFutureRegion } from '../w780/eon-expanse-w780a-future-region-catalog.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W788A_RELEASE_REVIEW_SCHEMA = 'eon.expanse.future-region-release-review.w788a.v1';
const identifier = (value = '') => /^[a-z0-9][a-z0-9:_.-]{0,159}$/i.test(String(value || '')) ? String(value) : '';
const digest = (value = '') => /^[a-f0-9]{64}$/i.test(String(value || '')) ? String(value).toLowerCase() : '';

export function sanitizeEonExpanseW788AReleaseReview(input = null) {
  if (!input || typeof input !== 'object') return null;
  const regionId = identifier(input.regionId);
  const region = getEonExpanseW780AFutureRegion(regionId);
  const packageDigest = digest(input.packageDigest);
  const reviewId = identifier(input.reviewId);
  const reviewedAt = Math.max(0, Number(input.reviewedAt) || 0);
  if (!region || !packageDigest || reviewId !== `future-region-release-review:${regionId}` || reviewedAt <= 0) return null;
  return freeze({
    schema: EON_EXPANSE_W788A_RELEASE_REVIEW_SCHEMA,
    reviewId,
    regionId,
    gatewayId: region.gatewayId,
    packageDigest,
    reviewedAt,
    status: 'release-reviewed-gateway-still-locked',
    gatewayActivated: false,
    regionRendered: false,
    publicReleaseReady: false,
    automaticRelease: false,
    privateContentStored: false
  });
}

export function deriveEonExpanseW788AReleaseReviewAction({ releaseMatrix = null, packageReadiness = null, reviewState = null } = {}) {
  const persisted = sanitizeEonExpanseW788AReleaseReview(reviewState);
  const regionId = identifier(releaseMatrix?.regionId || packageReadiness?.regionId);
  const region = getEonExpanseW780AFutureRegion(regionId);
  const packageDigest = digest(packageReadiness?.packageDigest);
  const available = releaseMatrix?.releaseReviewReady === true
    && packageReadiness?.certificationReady === true
    && Boolean(region && packageDigest)
    && !persisted;
  return freeze({
    schema: `${EON_EXPANSE_W788A_RELEASE_REVIEW_SCHEMA}.action.v1`,
    visible: releaseMatrix?.visible === true,
    available,
    status: persisted ? persisted.status : available ? 'explicit-release-review-available' : 'release-evidence-incomplete',
    reviewedRelease: persisted,
    action: available ? freeze({
      type: 'review-future-region-release',
      regionId: region.id,
      gatewayId: region.gatewayId,
      packageDigest,
      label: `Review ${region.label} release package`,
      reviewToken: `${region.id}:${region.gatewayId}:${packageDigest}:${packageReadiness.certifiedAt}`
    }) : null,
    gatewayActivated: false,
    rendersRegion: false,
    automaticRelease: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW788AReleaseReviewAction(view = null, {
  explicitUserAction = false,
  expectedRegionId = '',
  expectedGatewayId = '',
  expectedPackageDigest = '',
  expectedReviewToken = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (view?.available !== true || view?.action?.type !== 'review-future-region-release') return freeze({ ok: false, reason: 'release-review-unavailable' });
  if (view.action.regionId !== expectedRegionId) return freeze({ ok: false, reason: 'region-stale' });
  if (view.action.gatewayId !== expectedGatewayId) return freeze({ ok: false, reason: 'gateway-stale' });
  if (view.action.packageDigest !== expectedPackageDigest) return freeze({ ok: false, reason: 'package-digest-stale' });
  if (view.action.reviewToken !== expectedReviewToken) return freeze({ ok: false, reason: 'review-token-stale' });
  return freeze({ ok: true, action: view.action });
}

export function confirmEonExpanseW788AReleaseReview(action = null, { explicitUserAction = false, at = Date.now() } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const region = getEonExpanseW780AFutureRegion(action?.regionId);
  if (!region || action?.type !== 'review-future-region-release' || action?.gatewayId !== region.gatewayId || !digest(action?.packageDigest)) return freeze({ ok: false, reason: 'maintained-release-action-required' });
  const state = sanitizeEonExpanseW788AReleaseReview({
    reviewId: `future-region-release-review:${region.id}`,
    regionId: region.id,
    packageDigest: action.packageDigest,
    reviewedAt: Math.max(1, Number(at) || Date.now())
  });
  return freeze({ ok: Boolean(state), state, gatewayActivated: false, regionRendered: false, automaticRelease: false, grantsXp: false });
}

export default freeze({
  EON_EXPANSE_W788A_RELEASE_REVIEW_SCHEMA,
  sanitizeEonExpanseW788AReleaseReview,
  deriveEonExpanseW788AReleaseReviewAction,
  validateEonExpanseW788AReleaseReviewAction,
  confirmEonExpanseW788AReleaseReview
});
