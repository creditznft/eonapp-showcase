import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CORE_ENDURANCE_REQUIREMENTS,
  EON_CORE_WEB_VITAL_THRESHOLDS,
  createCoreEnduranceReceipt,
  createCoreWebVitalsReceipt,
  createOwnerLabReceipt,
  getPerformanceResilienceTruth
} from '../../assets/js/performance/eon-performance-resilience-owner-lab.js';

const digest = 'a'.repeat(64);
const evidence = 'b'.repeat(64);
const git = 'c'.repeat(40);
const goodSamples = Array.from({ length: 20 }, (_, index) => ({ lcpMs: 1800 + index, inpMs: 110 + index, cls: 0.04 + index / 10000 }));

function goodVitals() {
  return createCoreWebVitalsReceipt({
    releaseDigest: digest,
    profiles: [{ route: '/', browser: 'chrome', deviceProfile: 'desktop-mid', evidenceDigest: evidence, samples: goodSamples }]
  });
}

function goodEndurance() {
  return createCoreEnduranceReceipt({
    releaseDigest: digest,
    evidenceDigest: evidence,
    durationMinutes: 120,
    canonicalRouteCycles: 50,
    baselineHeapBytes: 100 * 1024 * 1024,
    finalHeapBytes: 108 * 1024 * 1024,
    baselineResources: { listeners: 20, timers: 4, observers: 3, workers: 1, sockets: 0, pendingRequests: 0 },
    finalResources: { listeners: 20, timers: 4, observers: 3, workers: 1, sockets: 0, pendingRequests: 0 }
  });
}

test('I25 evaluates release-bound p75 Core Web Vitals without automatic certification', () => {
  const receipt = goodVitals();
  assert.equal(EON_CORE_WEB_VITAL_THRESHOLDS.lcpMsP75Max, 2500);
  assert.equal(receipt.measurementComplete, true);
  assert.equal(receipt.withinBudgets, true);
  assert.equal(receipt.candidateReadyForManualReview, true);
  assert.equal(receipt.externallyCertified, false);
  assert.equal(receipt.automaticCertification, false);
});

test('I25 rejects insufficient, over-budget or unbound Web Vitals evidence', () => {
  const short = createCoreWebVitalsReceipt({ releaseDigest: digest, profiles: [{ route: '/', browser: 'chrome', deviceProfile: 'mid', evidenceDigest: evidence, samples: goodSamples.slice(0, 19) }] });
  const slow = createCoreWebVitalsReceipt({ releaseDigest: digest, profiles: [{ route: '/', browser: 'chrome', deviceProfile: 'mid', evidenceDigest: evidence, samples: Array.from({ length: 20 }, () => ({ lcpMs: 3000, inpMs: 300, cls: 0.2 })) }] });
  assert.equal(short.measurementComplete, false);
  assert.equal(slow.measurementComplete, true);
  assert.equal(slow.withinBudgets, false);
  assert.equal(createCoreWebVitalsReceipt({ profiles: [] }).measurementComplete, false);
});

test('I25 requires two hours, fifty route cycles, bounded heap and exact resource disposal', () => {
  const pass = goodEndurance();
  assert.equal(EON_CORE_ENDURANCE_REQUIREMENTS.durationMinutesMin, 120);
  assert.equal(pass.measurementComplete, true);
  assert.equal(pass.resourcesDisposed, true);
  assert.equal(pass.heapBounded, true);
  assert.equal(pass.passed, true);

  const leak = createCoreEnduranceReceipt({
    releaseDigest: digest,
    evidenceDigest: evidence,
    durationMinutes: 120,
    canonicalRouteCycles: 50,
    baselineHeapBytes: 100 * 1024 * 1024,
    finalHeapBytes: 160 * 1024 * 1024,
    baselineResources: { listeners: 20 },
    finalResources: { listeners: 21 }
  });
  assert.equal(leak.resourcesDisposed, false);
  assert.equal(leak.heapBounded, false);
  assert.equal(leak.passed, false);
});

test('I25 Owner Lab binds evidence to one exact commit, tree and release but cannot deploy', () => {
  const receipt = createOwnerLabReceipt({
    commit: git,
    tree: git,
    releaseDigest: digest,
    sourceReceiptDigest: evidence,
    explicitUserAction: true,
    vitalsReceipt: goodVitals(),
    enduranceReceipt: goodEndurance()
  });
  assert.equal(receipt.exactCandidate, true);
  assert.equal(receipt.evidenceComplete, true);
  assert.equal(receipt.budgetsPass, true);
  assert.equal(receipt.ownerLabReadyForManualDecision, true);
  assert.equal(receipt.productionAuthorized, false);
  assert.equal(receipt.automaticDeployment, false);
});

test('I25 Owner Lab fails closed for a mismatched release or absent user action', () => {
  const receipt = createOwnerLabReceipt({
    commit: git,
    tree: git,
    releaseDigest: 'd'.repeat(64),
    sourceReceiptDigest: evidence,
    explicitUserAction: false,
    vitalsReceipt: goodVitals(),
    enduranceReceipt: goodEndurance()
  });
  assert.equal(receipt.exactCandidate, false);
  assert.equal(receipt.ownerLabReadyForManualDecision, false);
});

test('I25 truth performs no measurement, storage, network, navigation or certification', () => {
  const truth = getPerformanceResilienceTruth();
  assert.equal(truth.coreInitialBundleMayContainCityImplementation, false);
  assert.equal(truth.browserMeasurementPerformedByThisModule, false);
  assert.equal(truth.performanceObserverStarted, false);
  assert.equal(truth.memoryReadPerformed, false);
  assert.equal(truth.storageWritten, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.navigationCreated, false);
  assert.equal(truth.automaticCertification, false);
});
