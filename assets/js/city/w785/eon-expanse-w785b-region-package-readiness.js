/** W785B — package checklist projection for a reviewed future-region programme. */
import {
  createEonExpanseW785ARegionPackageRequirements,
  validateEonExpanseW785ARegionPackageCertification
} from './eon-expanse-w785a-authored-region-package-certification.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W785B_REGION_PACKAGE_READINESS_SCHEMA = 'eon.expanse.region-package-readiness.w785b.v1';

export function deriveEonExpanseW785BRegionPackageReadiness({ reviewView = null, certificationReceipt = null } = {}) {
  const reviewed = reviewView?.reviewedRegion || null;
  if (!reviewed?.regionId) {return freeze({
    schema: EON_EXPANSE_W785B_REGION_PACKAGE_READINESS_SCHEMA,
    visible: false,
    regionId: '',
    status: 'programme-review-required',
    rows: freeze([]),
    completedRequirements: 0,
    totalRequirements: 0,
    certificationReady: false,
    activatesGateway: false,
    rendersRegion: false,
    privateContentStored: false
  });}
  const requirements = createEonExpanseW785ARegionPackageRequirements(reviewed.regionId);
  const validation = certificationReceipt
    ? validateEonExpanseW785ARegionPackageCertification(certificationReceipt, { expectedRegionId: reviewed.regionId })
    : null;
  const rows = freeze([
    freeze({ id: 'hero-assets', label: 'Authored hero assets', target: requirements.authoredHeroAssetIds.length, complete: validation?.ok === true, status: `${requirements.authoredHeroAssetIds.length} visible validated hero assets required` }),
    freeze({ id: 'architecture-kits', label: 'Architecture kits', target: requirements.architectureKitIds.length, complete: validation?.ok === true, status: `${requirements.architectureKitIds.length} authored streaming kits required` }),
    freeze({ id: 'environment-audio', label: 'Environment and audio', target: requirements.environmentFamilyIds.length + requirements.audioFamilyIds.length, complete: validation?.ok === true, status: 'Reduced-sensory environment and explicit-start audio proof required' }),
    freeze({ id: 'mission-families', label: 'Mission families', target: requirements.missionFamilyIds.length, complete: validation?.ok === true, status: `${requirements.missionFamilyIds.length} manual playthrough families required` }),
    freeze({ id: 'quality-profiles', label: 'Performance profiles', target: requirements.qualityProfiles.length, complete: validation?.ok === true, status: 'Lite, Balanced and Cinematic foreground plus soak evidence required' }),
    freeze({ id: 'browser-proofs', label: 'Authenticated browser proofs', target: requirements.requiredBrowserProofs.length, complete: validation?.ok === true, status: 'Chrome desktop, Edge desktop and mobile landscape required' }),
    freeze({ id: 'release-audits', label: 'Release audits', target: 4, complete: validation?.ok === true, status: 'Collision, navigation, capture and privacy review required' })
  ]);
  const complete = validation?.ok === true;
  return freeze({
    schema: EON_EXPANSE_W785B_REGION_PACKAGE_READINESS_SCHEMA,
    visible: true,
    regionId: reviewed.regionId,
    gatewayId: reviewed.gatewayId,
    status: complete ? 'authored-region-package-certified' : 'authored-region-package-evidence-required',
    rows,
    completedRequirements: complete ? rows.length : 0,
    totalRequirements: rows.length,
    certificationReady: complete,
    validationErrors: freeze([...(validation?.errors || [])]),
    packageDigest: complete ? validation.packageDigest : '',
    certifiedAt: complete ? validation.certifiedAt : 0,
    activatesGateway: false,
    rendersRegion: false,
    automaticCertification: false,
    grantsXp: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W785B_REGION_PACKAGE_READINESS_SCHEMA, deriveEonExpanseW785BRegionPackageReadiness });
