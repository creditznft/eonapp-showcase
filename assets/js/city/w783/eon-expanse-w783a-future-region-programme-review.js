/** W783A — explicit review state for one maintained future-region programme. */
import { getEonExpanseW780AFutureRegion } from '../w780/eon-expanse-w780a-future-region-catalog.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W783A_PROGRAMME_REVIEW_SCHEMA = 'eon.expanse.future-region-programme-review.w783a.v1';

const identifier = (value = '') => /^[a-z0-9][a-z0-9:_.-]{0,159}$/i.test(String(value || '')) ? String(value) : '';

export function sanitizeEonExpanseW783AProgrammeReview(input = null) {
  if (!input || typeof input !== 'object') return null;
  const regionId = identifier(input.regionId);
  const region = getEonExpanseW780AFutureRegion(regionId);
  const reviewId = identifier(input.reviewId);
  const reviewedAt = Math.max(0, Number(input.reviewedAt) || 0);
  if (!region || reviewId !== `future-region-review:${regionId}` || reviewedAt <= 0) return null;
  return freeze({
    schema: EON_EXPANSE_W783A_PROGRAMME_REVIEW_SCHEMA,
    reviewId,
    regionId,
    gatewayId: region.gatewayId,
    reviewedAt,
    status: 'programme-reviewed-not-unlocked',
    gatewayActivated: false,
    regionRendered: false,
    publicReleaseReady: false,
    privateContentStored: false
  });
}

export function deriveEonExpanseW783AProgrammeReviewAction({ programme = null, reviewState = null } = {}) {
  const region = programme?.recommendedRegion || null;
  const persisted = sanitizeEonExpanseW783AProgrammeReview(reviewState);
  const available = programme?.reviewAvailable === true && Boolean(region?.id) && !persisted;
  return freeze({
    schema: `${EON_EXPANSE_W783A_PROGRAMME_REVIEW_SCHEMA}.action.v1`,
    visible: programme?.visible === true,
    available,
    status: persisted ? 'programme-reviewed-not-unlocked' : available ? 'review-action-available' : String(programme?.status || 'programme-locked'),
    reviewedRegion: persisted,
    action: available ? freeze({
      type: 'review-future-region-programme',
      regionId: region.id,
      gatewayId: region.gatewayId,
      label: `Review ${region.label} programme`,
      reviewToken: `${region.id}:${region.gatewayId}:${region.heroRequirements?.length || 0}:${region.missionFamilies?.length || 0}`
    }) : null,
    automaticUnlock: false,
    activatesGateway: false,
    rendersRegion: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW783AProgrammeReviewAction(view = null, {
  explicitUserAction = false,
  expectedRegionId = '',
  expectedGatewayId = '',
  expectedReviewToken = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (view?.available !== true || view?.action?.type !== 'review-future-region-programme') return freeze({ ok: false, reason: 'programme-review-unavailable' });
  if (view.action.regionId !== expectedRegionId) return freeze({ ok: false, reason: 'region-stale' });
  if (view.action.gatewayId !== expectedGatewayId) return freeze({ ok: false, reason: 'gateway-stale' });
  if (view.action.reviewToken !== expectedReviewToken) return freeze({ ok: false, reason: 'review-token-stale' });
  return freeze({ ok: true, action: view.action });
}

export function confirmEonExpanseW783AProgrammeReview(action = null, { explicitUserAction = false, at = Date.now() } = {}) {
  const region = getEonExpanseW780AFutureRegion(action?.regionId);
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!region || action?.type !== 'review-future-region-programme' || action?.gatewayId !== region.gatewayId) return freeze({ ok: false, reason: 'maintained-region-action-required' });
  const state = sanitizeEonExpanseW783AProgrammeReview({ reviewId: `future-region-review:${region.id}`, regionId: region.id, reviewedAt: Math.max(1, Number(at) || Date.now()) });
  return freeze({
    ok: Boolean(state),
    state,
    automaticUnlock: false,
    gatewayActivated: false,
    regionRendered: false,
    grantsXp: false
  });
}

export default freeze({
  EON_EXPANSE_W783A_PROGRAMME_REVIEW_SCHEMA,
  sanitizeEonExpanseW783AProgrammeReview,
  deriveEonExpanseW783AProgrammeReviewAction,
  validateEonExpanseW783AProgrammeReviewAction,
  confirmEonExpanseW783AProgrammeReview
});
