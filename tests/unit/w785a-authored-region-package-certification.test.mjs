import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
  createEonExpanseW785ARegionPackageRequirements,
  validateEonExpanseW785ARegionPackageCertification
} from '../../assets/js/city/w785/eon-expanse-w785a-authored-region-package-certification.js';

function validReceipt(regionId = 'storm-sector') {
  const req = createEonExpanseW785ARegionPackageRequirements(regionId);
  return {
    schema: EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
    regionCatalogSchema: req.regionCatalogSchema,
    regionId: req.regionId,
    gatewayId: req.gatewayId,
    packageDigest: 'a'.repeat(64),
    heroAssets: req.authoredHeroAssetIds.map((id) => ({ id, visibleValidated: true, developmentProxy: false, materialsValid: true, boundsValid: true })),
    architectureKits: req.architectureKitIds.map((id) => ({ id, authored: true, streamingReady: true })),
    environmentFamilies: req.environmentFamilyIds.map((id) => ({ id, authored: true, reducedSensorySafe: true })),
    audioFamilies: req.audioFamilyIds.map((id) => ({ id, authored: true, explicitStartPreserved: true })),
    missionFamilies: req.missionFamilyIds.map((id) => ({ id, manualPlaythroughPass: true, automaticCompletion: false })),
    qualityProfiles: req.qualityProfiles.map((id) => ({ id, streamingBudgetPass: true, foregroundBrowserPass: true, transitionSoakPass: true })),
    browserProofs: req.requiredBrowserProofs.map((id) => ({ id, authenticated: true, visualReviewPass: true })),
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
    certifiedAt: 1000
  };
}

test('W785A derives exact authored package requirements from the maintained region catalog', () => {
  const req = createEonExpanseW785ARegionPackageRequirements('archive-noir');
  assert.equal(req.authoredHeroAssetIds.length, 3);
  assert.equal(req.architectureKitIds.length, 3);
  assert.deepEqual(req.qualityProfiles, ['lite','balanced','cinematic']);
  assert.deepEqual(req.requiredBrowserProofs, ['chrome-desktop','edge-desktop','mobile-landscape']);
  assert.equal(req.developmentProxyReleaseCount, 0);
});

test('W785A accepts only a complete exact authored region package receipt', () => {
  const receipt = validReceipt();
  const validation = validateEonExpanseW785ARegionPackageCertification(receipt, { expectedRegionId: 'storm-sector' });
  assert.equal(validation.ok, true, validation.errors.join(','));
  assert.equal(validation.activatesGateway, false);
  assert.equal(validation.rendersRegion, false);
});

test('W785A rejects missing hero art, browser evidence or foreground profile proof', () => {
  const missingHero = validReceipt(); missingHero.heroAssets.pop();
  const missingBrowser = validReceipt(); missingBrowser.browserProofs[0].authenticated = false;
  const missingForeground = validReceipt(); missingForeground.qualityProfiles[1].foregroundBrowserPass = false;
  assert.match(validateEonExpanseW785ARegionPackageCertification(missingHero).errors.join(','), /hero-assets-incomplete/);
  assert.match(validateEonExpanseW785ARegionPackageCertification(missingBrowser).errors.join(','), /browser-proofs-incomplete/);
  assert.match(validateEonExpanseW785ARegionPackageCertification(missingForeground).errors.join(','), /quality-profiles-incomplete/);
});

test('W785A rejects any release proxy, private content or second runtime authority', () => {
  const receipt = validReceipt();
  receipt.developmentProxyReleaseCount = 1;
  receipt.privateContentStored = true;
  receipt.ownsScene = true;
  const validation = validateEonExpanseW785ARegionPackageCertification(receipt);
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(','), /development-proxies-forbidden/);
  assert.match(validation.errors.join(','), /privacy-review-required/);
  assert.match(validation.errors.join(','), /runtime-authority-invalid/);
});
