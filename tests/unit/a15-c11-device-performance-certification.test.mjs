import test from 'node:test';
import assert from 'node:assert/strict';
import { EON_CITY_C11_EVIDENCE_LANES, createEonCityC11CertificationReceipt, validateEonCityC11CertificationReceipt, getEonCityC11CertificationTruth } from '../../assets/js/city/c11/eon-city-c11-device-performance-certification.js';
import { getEonOriginStorageTruth } from '../../assets/js/pwa/eon-origin-storage-authority.js';
import { getLocaleAccessibilityTruth } from '../../assets/js/locale/eon-locale-accessibility-authority.js';
import { getPerformanceResilienceTruth } from '../../assets/js/performance/eon-performance-resilience-owner-lab.js';
const build='a'.repeat(64); const proof='b'.repeat(64);
const storage=getEonOriginStorageTruth(); const locale=getLocaleAccessibilityTruth(); const performance=getPerformanceResilienceTruth();
const sourceAuthority={ serviceWorkerSourceGenerated:storage.serviceWorkerSourceGenerated, serviceWorkerMayDeleteProtectedDatabases:storage.serviceWorkerMayDeleteProtectedDatabases, minimumTargetPx:locale.minimumTargetPx, coreInitialBundleMayContainCityImplementation:performance.coreInitialBundleMayContainCityImplementation };

test('C11 defines the complete source-ready evidence matrix', () => {
  assert.equal(EON_CITY_C11_EVIDENCE_LANES.length, 22);
  assert.equal(new Set(EON_CITY_C11_EVIDENCE_LANES.map((lane)=>lane.id)).size, 22);
  const receipt=createEonCityC11CertificationReceipt([], { expectedBuildDigest: build, sourceAuthority });
  assert.equal(receipt.sourceReady, true);
  assert.equal(receipt.externalComplete, false);
  assert.equal(receipt.passedLaneCount, 0);
});

test('C11 rejects short soak, short endurance and unsafe storage proof', () => {
  const receipt=createEonCityC11CertificationReceipt([
    { id:'transition-soak', status:'pass', evidenceDigest:proof, buildDigest:build, measuredAt:1, completedTransitions:9 },
    { id:'endurance-four-hours', status:'pass', evidenceDigest:proof, buildDigest:build, measuredAt:1, durationMinutes:239 },
    { id:'protected-storage', status:'pass', evidenceDigest:proof, buildDigest:build, measuredAt:1, protectedDataPreserved:false }
  ], { expectedBuildDigest: build, sourceAuthority });
  assert.equal(receipt.passedLaneCount, 0);
});

test('C11 accepts exact-build evidence but still requires manual certification', () => {
  const evidence=EON_CITY_C11_EVIDENCE_LANES.map((lane)=>({ id:lane.id,status:'pass',evidenceDigest:proof,buildDigest:build,measuredAt:10,completedTransitions:10,durationMinutes:240,resourcesDisposed:true,protectedDataPreserved:true }));
  const receipt=createEonCityC11CertificationReceipt(evidence,{expectedBuildDigest:build,sourceAuthority});
  assert.equal(receipt.externalComplete,true);
  assert.equal(receipt.manualCertificationDecisionAvailable,true);
  assert.equal(receipt.accessibilityCertified,false);
  assert.equal(receipt.automaticCertification,false);
  assert.equal(receipt.automaticDeployment,false);
});

test('C11 source truth cannot fabricate physical evidence', () => {
  const result=validateEonCityC11CertificationReceipt(createEonCityC11CertificationReceipt([], { sourceAuthority }));
  assert.equal(result.ok,true,result.errors.join(','));
  const truth=getEonCityC11CertificationTruth(sourceAuthority);
  assert.equal(truth.sourceReady,true);
  assert.equal(truth.externalEvidenceComplete,false);
  assert.equal(truth.fourHourEnduranceRequired,true);
  assert.equal(truth.transitionSoakMinimum,10);
  assert.equal(truth.productionReady,false);
});
