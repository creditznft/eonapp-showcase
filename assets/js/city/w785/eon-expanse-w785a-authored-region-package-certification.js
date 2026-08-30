/** W785A — exact certification contract for one authored future-region package. */
import { EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA, getEonExpanseW780AFutureRegion } from '../w780/eon-expanse-w780a-future-region-catalog.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA = 'eon.expanse.authored-region-package-certification.w785a.v1';
const QUALITY_PROFILES = freeze(['lite', 'balanced', 'cinematic']);
const REQUIRED_BROWSER_PROOFS = freeze(['chrome-desktop', 'edge-desktop', 'mobile-landscape']);

export function createEonExpanseW785ARegionPackageRequirements(regionId = '') {
  const region = getEonExpanseW780AFutureRegion(regionId);
  if (!region) return null;
  return freeze({
    schema: `${EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA}.requirements.v1`,
    regionCatalogSchema: EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA,
    regionId: region.id,
    gatewayId: region.gatewayId,
    authoredHeroAssetIds: region.heroRequirements,
    architectureKitIds: region.architecture,
    environmentFamilyIds: region.environment,
    audioFamilyIds: region.audio,
    missionFamilyIds: region.missionFamilies,
    qualityProfiles: QUALITY_PROFILES,
    requiredBrowserProofs: REQUIRED_BROWSER_PROOFS,
    requiresCollisionAudit: true,
    requiresNavigationAudit: true,
    requiresCaptureReview: true,
    requiresPrivacyReview: true,
    requiresForegroundTelemetry: true,
    requiresTransitionSoak: true,
    developmentProxyReleaseCount: 0,
    automaticCertification: false
  });
}

const exactIds = (records, ids, predicate) => {
  if (!Array.isArray(records)) return false;
  const byId = new Map(records.map((entry) => [String(entry?.id || ''), entry]));
  return ids.every((id) => byId.has(id) && predicate(byId.get(id)));
};

export function validateEonExpanseW785ARegionPackageCertification(receipt = null, { expectedRegionId = '' } = {}) {
  const requirements = createEonExpanseW785ARegionPackageRequirements(expectedRegionId || receipt?.regionId || '');
  const errors = [];
  if (!requirements) errors.push('maintained-region-required');
  if (receipt?.schema !== EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA) errors.push('schema-invalid');
  if (receipt?.regionId !== requirements?.regionId) errors.push('region-mismatch');
  if (receipt?.gatewayId !== requirements?.gatewayId) errors.push('gateway-mismatch');
  if (receipt?.regionCatalogSchema !== requirements?.regionCatalogSchema) errors.push('catalog-schema-mismatch');
  if (!/^[a-f0-9]{64}$/i.test(String(receipt?.packageDigest || ''))) errors.push('package-digest-invalid');
  if (!exactIds(receipt?.heroAssets, requirements?.authoredHeroAssetIds || [], (entry) => entry?.visibleValidated === true && entry?.developmentProxy === false && entry?.materialsValid === true && entry?.boundsValid === true)) errors.push('hero-assets-incomplete');
  if (!exactIds(receipt?.architectureKits, requirements?.architectureKitIds || [], (entry) => entry?.authored === true && entry?.streamingReady === true)) errors.push('architecture-kits-incomplete');
  if (!exactIds(receipt?.environmentFamilies, requirements?.environmentFamilyIds || [], (entry) => entry?.authored === true && entry?.reducedSensorySafe === true)) errors.push('environment-families-incomplete');
  if (!exactIds(receipt?.audioFamilies, requirements?.audioFamilyIds || [], (entry) => entry?.authored === true && entry?.explicitStartPreserved === true)) errors.push('audio-families-incomplete');
  if (!exactIds(receipt?.missionFamilies, requirements?.missionFamilyIds || [], (entry) => entry?.manualPlaythroughPass === true && entry?.automaticCompletion === false)) errors.push('mission-families-incomplete');
  if (!exactIds(receipt?.qualityProfiles, requirements?.qualityProfiles || [], (entry) => entry?.streamingBudgetPass === true && entry?.foregroundBrowserPass === true && entry?.transitionSoakPass === true)) errors.push('quality-profiles-incomplete');
  if (!exactIds(receipt?.browserProofs, requirements?.requiredBrowserProofs || [], (entry) => entry?.authenticated === true && entry?.visualReviewPass === true)) errors.push('browser-proofs-incomplete');
  if (receipt?.collisionAuditPass !== true) errors.push('collision-audit-required');
  if (receipt?.navigationAuditPass !== true) errors.push('navigation-audit-required');
  if (receipt?.captureReviewPass !== true) errors.push('capture-review-required');
  if (receipt?.privacyReviewPass !== true || receipt?.privateContentStored === true) errors.push('privacy-review-required');
  if (receipt?.developmentProxyReleaseCount !== 0) errors.push('development-proxies-forbidden');
  if (receipt?.oneCanonicalScene !== true || receipt?.ownsEngine === true || receipt?.ownsScene === true || receipt?.ownsRenderLoop === true) errors.push('runtime-authority-invalid');
  if (!(Number(receipt?.certifiedAt) > 0)) errors.push('certified-at-required');
  const ok = errors.length === 0;
  return freeze({
    ok,
    errors: freeze(errors),
    regionId: requirements?.regionId || '',
    gatewayId: requirements?.gatewayId || '',
    packageDigest: ok ? String(receipt.packageDigest).toLowerCase() : '',
    certifiedAt: ok ? Number(receipt.certifiedAt) : 0,
    automaticCertification: false,
    activatesGateway: false,
    rendersRegion: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export default freeze({
  EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
  createEonExpanseW785ARegionPackageRequirements,
  validateEonExpanseW785ARegionPackageCertification
});
