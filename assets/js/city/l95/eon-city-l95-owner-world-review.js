/**
 * L95 — non-persistent owner/release-review world authority.
 *
 * This authority exists only so an explicit preview/evidence session can inspect
 * an authored future world before public certification. It never grants XP,
 * campaign completion, construction authority, release certification or a
 * persisted future-region activation.
 */
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
export const EON_CITY_L95_OWNER_WORLD_REVIEW_SCHEMA = 'eon.city.owner-world-review.l95.v1';

export function deriveEonCityL95StormReviewActivation({ enabled = false, at = Date.now(), ownerReview = true } = {}) {
  if (enabled !== true) return null;
  return freeze({
    schema: EON_CITY_L95_OWNER_WORLD_REVIEW_SCHEMA,
    activationId: 'future-region-activation:preview:storm-sector',
    regionId: 'storm-sector',
    gatewayId: 'future-gateway-storm-sector',
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    // Review mode needs a structurally valid transient W793 activation so the
    // maintained Storm journey/presenter can be exercised without writing a
    // production/certification receipt. The review build digest is deliberately
    // tied to the exact authored package candidate and is never persisted.
    buildDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    deploymentChannel: 'preview',
    activatedAt: Math.max(1, Number(at) || Date.now()),
    gatewayActivated: true,
    regionRendered: false,
    explicitOwnerAction: true,
    automaticActivation: false,
    privateContentStored: false,
    ownerReview: ownerReview === true,
    directReview: ownerReview !== true,
    reviewOnly: true,
    grantsXp: false,
    grantsCampaignCompletion: false,
    grantsConstructionPermit: false,
    persistsActivation: false
  });
}

export function projectEonCityL95OwnerReviewAvailability(publicAvailability = null, reviewActivation = null) {
  if (!reviewActivation) return publicAvailability;
  const base = publicAvailability && typeof publicAvailability === 'object' ? publicAvailability : {};
  const publicStorm = base.stormSector && typeof base.stormSector === 'object' ? base.stormSector : {};
  return freeze({
    ...base,
    stormSector: freeze({
      ...publicStorm,
      available: true,
      reason: reviewActivation.ownerReview === true ? 'owner-review-preview' : 'direct-review-ready',
      activationId: reviewActivation.activationId,
      packageDigest: reviewActivation.packageDigest,
      ownerReview: reviewActivation.ownerReview === true,
      directReview: reviewActivation.directReview === true,
      reviewOnly: true,
      publicCertified: publicStorm.available === true,
      certificationBypassedForPublic: false,
      grantsXp: false,
      persistsActivation: false
    })
  });
}

export default freeze({
  EON_CITY_L95_OWNER_WORLD_REVIEW_SCHEMA,
  deriveEonCityL95StormReviewActivation,
  projectEonCityL95OwnerReviewAvailability
});
