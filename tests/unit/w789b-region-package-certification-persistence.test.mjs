import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW766AInitialState, createEonExpanseW766APersistence, validateEonExpanseW766AState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';
import { createEonExpanseW785ARegionPackageRequirements, EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA } from '../../assets/js/city/w785/eon-expanse-w785a-authored-region-package-certification.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

function validReceipt(regionId = 'storm-sector') {
  const req = createEonExpanseW785ARegionPackageRequirements(regionId);
  return {
    schema: EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
    regionCatalogSchema: req.regionCatalogSchema,
    regionId: req.regionId,
    gatewayId: req.gatewayId,
    packageDigest: 'b'.repeat(64),
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
    certifiedAt: 12345
  };
}

test('W789B revalidates and persists a complete normalized package receipt', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  persistence.write({ ...base, futureRegionPackageCertification: { ...validReceipt(), privateUrl: 'remove', gatewayActivated: true } });
  const restored = persistence.read(base);
  assert.equal(restored.futureRegionPackageCertification.regionId, 'storm-sector');
  assert.equal(restored.futureRegionPackageCertification.status, 'authored-region-package-certified-not-released');
  assert.equal(restored.futureRegionPackageCertification.gatewayActivated, false);
  assert.equal(restored.futureRegionPackageCertification.privateUrl, undefined);
});

test('W789B drops partial package certification during reload', () => {
  const storage = memoryStorage();
  const persistence = createEonExpanseW766APersistence({ storage, now: () => 5000 });
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const partial = validReceipt();
  partial.heroAssets = partial.heroAssets.slice(0, 1);
  persistence.write({ ...base, futureRegionPackageCertification: partial });
  assert.equal(persistence.read(base).futureRegionPackageCertification, null);
});

test('W789B state validation rejects package activation claims', () => {
  const base = createEonExpanseW766AInitialState({ now: 1000 });
  const validation = validateEonExpanseW766AState({ ...base, futureRegionPackageCertification: { gatewayActivated: true } });
  assert.equal(validation.ok, false);
  assert.match(validation.errors.join(','), /future-region-package-certification-boundary-invalid/);
});
