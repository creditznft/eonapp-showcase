import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW785ARegionPackageRequirements, EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA } from '../../assets/js/city/w785/eon-expanse-w785a-authored-region-package-certification.js';
import { sanitizeEonExpanseW789ARegionPackageCertification, validateEonExpanseW789ARegionPackageCertificationState } from '../../assets/js/city/w789/eon-expanse-w789a-region-package-certification-state.js';

function validReceipt(regionId = 'storm-sector') {
  const req = createEonExpanseW785ARegionPackageRequirements(regionId);
  return {
    schema: EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
    regionCatalogSchema: req.regionCatalogSchema,
    regionId: req.regionId,
    gatewayId: req.gatewayId,
    packageDigest: 'a'.repeat(64),
    heroAssets: req.authoredHeroAssetIds.map((id) => ({ id, visibleValidated: true, developmentProxy: false, materialsValid: true, boundsValid: true, privateUrl: 'remove' })),
    architectureKits: req.architectureKitIds.map((id) => ({ id, authored: true, streamingReady: true })),
    environmentFamilies: req.environmentFamilyIds.map((id) => ({ id, authored: true, reducedSensorySafe: true })),
    audioFamilies: req.audioFamilyIds.map((id) => ({ id, authored: true, explicitStartPreserved: true })),
    missionFamilies: req.missionFamilyIds.map((id) => ({ id, manualPlaythroughPass: true, automaticCompletion: false })),
    qualityProfiles: req.qualityProfiles.map((id) => ({ id, streamingBudgetPass: true, foregroundBrowserPass: true, transitionSoakPass: true })),
    browserProofs: req.requiredBrowserProofs.map((id) => ({ id, authenticated: true, visualReviewPass: true, screenshotPath: 'remove' })),
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
    certifiedAt: 12345
  };
}

test('W789A normalizes only an exact complete package receipt', () => {
  const state = sanitizeEonExpanseW789ARegionPackageCertification(validReceipt());
  assert.ok(state);
  assert.equal(state.status, 'authored-region-package-certified-not-released');
  assert.equal(state.heroAssets[0].privateUrl, undefined);
  assert.equal(state.browserProofs[0].screenshotPath, undefined);
  assert.equal(validateEonExpanseW789ARegionPackageCertificationState(state, { expectedRegionId: 'storm-sector' }).ok, true);
});

test('W789A rejects partial or forged package evidence', () => {
  const partial = validReceipt();
  partial.browserProofs = partial.browserProofs.slice(0, 1);
  assert.equal(sanitizeEonExpanseW789ARegionPackageCertification(partial), null);
  const forged = validReceipt();
  forged.packageDigest = 'not-a-digest';
  assert.equal(sanitizeEonExpanseW789ARegionPackageCertification(forged), null);
});

test('W789A persisted state cannot claim activation, rendering or private content', () => {
  const state = sanitizeEonExpanseW789ARegionPackageCertification(validReceipt());
  assert.equal(validateEonExpanseW789ARegionPackageCertificationState({ ...state, gatewayActivated: true }).ok, false);
  assert.equal(validateEonExpanseW789ARegionPackageCertificationState({ ...state, privateContentStored: true }).ok, false);
});
