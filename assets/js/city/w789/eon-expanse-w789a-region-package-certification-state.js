/** W789A — normalized persisted state for an exactly validated authored region package. */
import {
  EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
  createEonExpanseW785ARegionPackageRequirements,
  validateEonExpanseW785ARegionPackageCertification
} from '../w785/eon-expanse-w785a-authored-region-package-certification.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W789A_PACKAGE_STATE_SCHEMA = 'eon.expanse.authored-region-package-state.w789a.v1';

const byId = (records = []) => new Map((Array.isArray(records) ? records : []).map((entry) => [String(entry?.id || ''), entry]));

export function sanitizeEonExpanseW789ARegionPackageCertification(receipt = null) {
  const validation = validateEonExpanseW785ARegionPackageCertification(receipt, { expectedRegionId: receipt?.regionId || '' });
  if (!validation.ok) return null;
  const requirements = createEonExpanseW785ARegionPackageRequirements(validation.regionId);
  if (!requirements) return null;
  const heroes = byId(receipt.heroAssets);
  const architecture = byId(receipt.architectureKits);
  const environments = byId(receipt.environmentFamilies);
  const audio = byId(receipt.audioFamilies);
  const missions = byId(receipt.missionFamilies);
  const profiles = byId(receipt.qualityProfiles);
  const browsers = byId(receipt.browserProofs);
  return freeze({
    schema: EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
    stateSchema: EON_EXPANSE_W789A_PACKAGE_STATE_SCHEMA,
    regionCatalogSchema: requirements.regionCatalogSchema,
    regionId: requirements.regionId,
    gatewayId: requirements.gatewayId,
    packageDigest: validation.packageDigest,
    heroAssets: freeze(requirements.authoredHeroAssetIds.map((id) => freeze({ id, visibleValidated: heroes.get(id)?.visibleValidated === true, developmentProxy: false, materialsValid: heroes.get(id)?.materialsValid === true, boundsValid: heroes.get(id)?.boundsValid === true }))),
    architectureKits: freeze(requirements.architectureKitIds.map((id) => freeze({ id, authored: architecture.get(id)?.authored === true, streamingReady: architecture.get(id)?.streamingReady === true }))),
    environmentFamilies: freeze(requirements.environmentFamilyIds.map((id) => freeze({ id, authored: environments.get(id)?.authored === true, reducedSensorySafe: environments.get(id)?.reducedSensorySafe === true }))),
    audioFamilies: freeze(requirements.audioFamilyIds.map((id) => freeze({ id, authored: audio.get(id)?.authored === true, explicitStartPreserved: audio.get(id)?.explicitStartPreserved === true }))),
    missionFamilies: freeze(requirements.missionFamilyIds.map((id) => freeze({ id, manualPlaythroughPass: missions.get(id)?.manualPlaythroughPass === true, automaticCompletion: false }))),
    qualityProfiles: freeze(requirements.qualityProfiles.map((id) => freeze({ id, streamingBudgetPass: profiles.get(id)?.streamingBudgetPass === true, foregroundBrowserPass: profiles.get(id)?.foregroundBrowserPass === true, transitionSoakPass: profiles.get(id)?.transitionSoakPass === true }))),
    browserProofs: freeze(requirements.requiredBrowserProofs.map((id) => freeze({ id, authenticated: browsers.get(id)?.authenticated === true, visualReviewPass: browsers.get(id)?.visualReviewPass === true }))),
    collisionAuditPass: true,
    navigationAuditPass: true,
    captureReviewPass: true,
    privacyReviewPass: true,
    privateContentStored: false,
    developmentProxyReleaseCount: 0,
    oneCanonicalScene: true,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    certifiedAt: validation.certifiedAt,
    status: 'authored-region-package-certified-not-released',
    gatewayActivated: false,
    regionRendered: false,
    automaticRelease: false
  });
}

export function validateEonExpanseW789ARegionPackageCertificationState(state = null, { expectedRegionId = '' } = {}) {
  if (state?.stateSchema !== EON_EXPANSE_W789A_PACKAGE_STATE_SCHEMA) return freeze({ ok: false, errors: freeze(['state-schema-invalid']) });
  if (state?.gatewayActivated || state?.regionRendered || state?.automaticRelease || state?.privateContentStored) return freeze({ ok: false, errors: freeze(['package-state-boundary-invalid']) });
  return validateEonExpanseW785ARegionPackageCertification(state, { expectedRegionId: expectedRegionId || state?.regionId || '' });
}

export default freeze({
  EON_EXPANSE_W789A_PACKAGE_STATE_SCHEMA,
  sanitizeEonExpanseW789ARegionPackageCertification,
  validateEonExpanseW789ARegionPackageCertificationState
});
