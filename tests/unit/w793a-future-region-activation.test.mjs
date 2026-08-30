import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_EXPANSE_W793A_OWNER_AUTHORIZATION_SCHEMA,
  deriveEonExpanseW793AActivationAction,
  validateEonExpanseW793AActivationAction,
  confirmEonExpanseW793AActivation,
  sanitizeEonExpanseW793AActivation
} from '../../assets/js/city/w793/eon-expanse-w793a-future-region-activation.js';
import { EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA } from '../../assets/js/city/w785/eon-expanse-w785a-authored-region-package-certification.js';
import { EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA } from '../../assets/js/city/w780/eon-expanse-w780a-future-region-catalog.js';

const digest = 'a'.repeat(64);
const buildDigest = 'b'.repeat(64);
const regionId = 'storm-sector';
const gatewayId = 'future-gateway-storm-sector';
const releaseReview = { reviewId: `future-region-release-review:${regionId}`, regionId, packageDigest: digest, reviewedAt: 10 };
const packageCertification = {
  schema: EON_EXPANSE_W785A_REGION_PACKAGE_CERTIFICATION_SCHEMA,
  stateSchema: 'eon.expanse.authored-region-package-state.w789a.v1',
  regionCatalogSchema: EON_EXPANSE_W780A_FUTURE_REGION_SCHEMA,
  regionId, gatewayId, packageDigest: digest,
  heroAssets: ['storm-command-spire','atmospheric-stabilizer','charged-transit-gate'].map((id) => ({ id, visibleValidated: true, developmentProxy: false, materialsValid: true, boundsValid: true })),
  architectureKits: ['storm-relay-kit','industrial-platform-kit','charged-transit-kit'].map((id) => ({ id, authored: true, streamingReady: true })),
  environmentFamilies: ['electrical-storms','rain-sheets','charged-fog','signal-pylons'].map((id) => ({ id, authored: true, reducedSensorySafe: true })),
  audioFamilies: ['storm-distance','relay-hum','charged-wind'].map((id) => ({ id, authored: true, explicitStartPreserved: true })),
  missionFamilies: ['weather-restoration','relay-repair','storm-rescue'].map((id) => ({ id, manualPlaythroughPass: true, automaticCompletion: false })),
  qualityProfiles: ['lite','balanced','cinematic'].map((id) => ({ id, streamingBudgetPass: true, foregroundBrowserPass: true, transitionSoakPass: true })),
  browserProofs: ['chrome-desktop','edge-desktop','mobile-landscape'].map((id) => ({ id, authenticated: true, visualReviewPass: true })),
  collisionAuditPass: true, navigationAuditPass: true, captureReviewPass: true, privacyReviewPass: true, privateContentStored: false,
  developmentProxyReleaseCount: 0, oneCanonicalScene: true, ownsEngine: false, ownsScene: false, ownsRenderLoop: false, certifiedAt: 12,
  gatewayActivated: false, regionRendered: false, automaticRelease: false
};
const performanceEvidence = {
  quality: 'balanced', buildDigest,
  foregroundTelemetry: { foreground: true, browserProofId: 'chrome-desktop', p50Fps: 60, p95FrameMs: 24, sustainedSingleDigitFrames: 0, measuredAt: 20 },
  transitionSoak: { verified: true, completedTransitions: 10, memoryGrowthBytes: 0, measuredAt: 21 },
  oneCanonicalScene: true, ownsEngine: false, ownsScene: false, ownsRenderLoop: false, privateContentStored: false, backgroundThrottleReport: false
};
const ownerAuthorization = {
  schema: EON_EXPANSE_W793A_OWNER_AUTHORIZATION_SCHEMA,
  authorizationId: `future-region-owner-authorization:preview:${regionId}`,
  regionId, packageDigest: digest, buildDigest, deploymentChannel: 'preview', authorizedAt: 30,
  authorized: true, explicitOwnerAction: true, automaticAuthorization: false, privateContentStored: false
};

test('W793A activation requires exact release, package, performance and owner evidence', () => {
  const view = deriveEonExpanseW793AActivationAction({ releaseReview, packageCertification, performanceEvidence, ownerAuthorization });
  assert.equal(view.available, true);
  assert.equal(view.action.regionId, regionId);
  assert.equal(view.action.deploymentChannel, 'preview');
  assert.equal(view.regionRendered, false);
  assert.equal(view.automaticActivation, false);
});

test('W793A stale or incomplete evidence cannot activate', () => {
  assert.equal(deriveEonExpanseW793AActivationAction({ releaseReview, packageCertification, performanceEvidence, ownerAuthorization: { ...ownerAuthorization, buildDigest: 'c'.repeat(64) } }).available, false);
  assert.equal(deriveEonExpanseW793AActivationAction({ releaseReview, packageCertification, performanceEvidence, ownerAuthorization: { ...ownerAuthorization, explicitOwnerAction: false } }).available, false);
});

test('W793A validates a stale-proof token then persists gateway-only activation', () => {
  const view = deriveEonExpanseW793AActivationAction({ releaseReview, packageCertification, performanceEvidence, ownerAuthorization });
  const checked = validateEonExpanseW793AActivationAction(view, {
    explicitOwnerAction: true,
    expectedRegionId: regionId,
    expectedGatewayId: gatewayId,
    expectedPackageDigest: digest,
    expectedBuildDigest: buildDigest,
    expectedDeploymentChannel: 'preview',
    expectedActivationToken: view.action.activationToken
  });
  assert.equal(checked.ok, true);
  const confirmed = confirmEonExpanseW793AActivation(checked.action, { explicitOwnerAction: true, at: 40 });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.state.gatewayActivated, true);
  assert.equal(confirmed.state.regionRendered, false);
  assert.equal(confirmed.state.automaticActivation, false);
});

test('W793A sanitizer rejects forged rendered and automatic state', () => {
  assert.equal(sanitizeEonExpanseW793AActivation({ activationId: `future-region-activation:preview:${regionId}`, regionId, packageDigest: digest, buildDigest, deploymentChannel: 'preview', activatedAt: 40, gatewayActivated: true, regionRendered: true, explicitOwnerAction: true, automaticActivation: false }), null);
  assert.equal(sanitizeEonExpanseW793AActivation({ activationId: `future-region-activation:preview:${regionId}`, regionId, packageDigest: digest, buildDigest, deploymentChannel: 'preview', activatedAt: 40, gatewayActivated: true, regionRendered: false, explicitOwnerAction: true, automaticActivation: true }), null);
});
