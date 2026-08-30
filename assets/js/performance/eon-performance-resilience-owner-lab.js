/**
 * A15 I25 — Core performance, resilience and Owner Lab authority.
 *
 * This module evaluates already-captured, release-bound measurements. It does
 * not start observers, collect browser data, navigate, persist, upload, deploy
 * or certify a release automatically.
 */
export const EON_PERFORMANCE_RESILIENCE_SCHEMA = 'eonapp.performance-resilience-owner-lab.a15.i25.v1';
export const EON_CWV_RECEIPT_SCHEMA = 'eonapp.core-web-vitals-receipt.a15.i25.v1';
export const EON_ENDURANCE_RECEIPT_SCHEMA = 'eonapp.core-endurance-receipt.a15.i25.v1';
export const EON_OWNER_LAB_RECEIPT_SCHEMA = 'eonapp.owner-lab-receipt.a15.i25.v1';

export const EON_CORE_WEB_VITAL_THRESHOLDS = Object.freeze({
  lcpMsP75Max: 2500,
  inpMsP75Max: 200,
  clsP75Max: 0.1,
  minimumSamplesPerRouteProfile: 20
});

export const EON_CORE_ENDURANCE_REQUIREMENTS = Object.freeze({
  durationMinutesMin: 120,
  canonicalRouteCyclesMin: 50,
  maxHeapGrowthBytes: 20 * 1024 * 1024,
  maxHeapGrowthRatio: 0.1,
  resourceCounters: Object.freeze(['listeners', 'timers', 'observers', 'workers', 'sockets', 'pendingRequests'])
});

const freeze = Object.freeze;
const digestPattern = /^[a-f0-9]{64}$/i;
const gitPattern = /^[a-f0-9]{40}$/i;
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : NaN;
const boundedText = (value = '', max = 96) => String(value || '').trim().replace(/[^a-zA-Z0-9:._/-]/g, '-').slice(0, max);
const validDigest = (value) => digestPattern.test(String(value || ''));
const validGit = (value) => gitPattern.test(String(value || ''));

function percentile75(values = []) {
  const rows = values.map(finite).filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return null;
  return rows[Math.max(0, Math.ceil(rows.length * 0.75) - 1)];
}

function normalizeMetricSamples(samples = []) {
  return samples.map((sample) => freeze({
    lcpMs: finite(sample?.lcpMs),
    inpMs: finite(sample?.inpMs),
    cls: finite(sample?.cls)
  })).filter((sample) => Number.isFinite(sample.lcpMs) && Number.isFinite(sample.inpMs) && Number.isFinite(sample.cls));
}

export function createCoreWebVitalsReceipt(input = {}) {
  const releaseDigest = String(input.releaseDigest || '').toLowerCase();
  const profiles = Array.isArray(input.profiles) ? input.profiles.map((profile) => {
    const samples = normalizeMetricSamples(profile?.samples);
    const p75 = freeze({
      lcpMs: percentile75(samples.map((row) => row.lcpMs)),
      inpMs: percentile75(samples.map((row) => row.inpMs)),
      cls: percentile75(samples.map((row) => row.cls))
    });
    const evidenceDigest = String(profile?.evidenceDigest || '').toLowerCase();
    const measurementComplete = samples.length >= EON_CORE_WEB_VITAL_THRESHOLDS.minimumSamplesPerRouteProfile
      && validDigest(evidenceDigest)
      && Boolean(boundedText(profile?.route, 120))
      && Boolean(boundedText(profile?.browser, 40))
      && Boolean(boundedText(profile?.deviceProfile, 48));
    const withinBudgets = measurementComplete
      && p75.lcpMs <= EON_CORE_WEB_VITAL_THRESHOLDS.lcpMsP75Max
      && p75.inpMs <= EON_CORE_WEB_VITAL_THRESHOLDS.inpMsP75Max
      && p75.cls <= EON_CORE_WEB_VITAL_THRESHOLDS.clsP75Max;
    return freeze({
      route: boundedText(profile?.route, 120) || '/',
      browser: boundedText(profile?.browser, 40) || 'unknown',
      deviceProfile: boundedText(profile?.deviceProfile, 48) || 'unknown',
      sampleCount: samples.length,
      p75,
      evidenceDigest,
      measurementComplete,
      withinBudgets
    });
  }) : [];
  const measurementComplete = validDigest(releaseDigest) && profiles.length > 0 && profiles.every((row) => row.measurementComplete);
  const withinBudgets = measurementComplete && profiles.every((row) => row.withinBudgets);
  return freeze({
    schema: EON_CWV_RECEIPT_SCHEMA,
    releaseDigest,
    thresholds: EON_CORE_WEB_VITAL_THRESHOLDS,
    profiles: freeze(profiles),
    measurementComplete,
    withinBudgets,
    candidateReadyForManualReview: withinBudgets,
    externallyCertified: false,
    automaticCertification: false,
    containsUserContent: false,
    containsCredentials: false,
    externalActionPerformed: false
  });
}

function normalizeCounters(value = {}) {
  return freeze(Object.fromEntries(EON_CORE_ENDURANCE_REQUIREMENTS.resourceCounters.map((key) => [key, Math.max(0, Math.round(Number(value?.[key] || 0)))])));
}

export function createCoreEnduranceReceipt(input = {}) {
  const releaseDigest = String(input.releaseDigest || '').toLowerCase();
  const evidenceDigest = String(input.evidenceDigest || '').toLowerCase();
  const baseline = normalizeCounters(input.baselineResources);
  const final = normalizeCounters(input.finalResources);
  const resourceDeltas = freeze(Object.fromEntries(EON_CORE_ENDURANCE_REQUIREMENTS.resourceCounters.map((key) => [key, final[key] - baseline[key]])));
  const baselineHeapBytes = Math.max(0, finite(input.baselineHeapBytes) || 0);
  const finalHeapBytes = Math.max(0, finite(input.finalHeapBytes) || 0);
  const heapGrowthBytes = finalHeapBytes - baselineHeapBytes;
  const allowedHeapGrowthBytes = Math.max(
    EON_CORE_ENDURANCE_REQUIREMENTS.maxHeapGrowthBytes,
    Math.round(baselineHeapBytes * EON_CORE_ENDURANCE_REQUIREMENTS.maxHeapGrowthRatio)
  );
  const durationMinutes = Math.max(0, finite(input.durationMinutes) || 0);
  const canonicalRouteCycles = Math.max(0, Math.round(finite(input.canonicalRouteCycles) || 0));
  const measurementComplete = validDigest(releaseDigest)
    && validDigest(evidenceDigest)
    && durationMinutes >= EON_CORE_ENDURANCE_REQUIREMENTS.durationMinutesMin
    && canonicalRouteCycles >= EON_CORE_ENDURANCE_REQUIREMENTS.canonicalRouteCyclesMin
    && baselineHeapBytes > 0
    && finalHeapBytes > 0;
  const resourcesDisposed = measurementComplete && Object.values(resourceDeltas).every((value) => value <= 0);
  const heapBounded = measurementComplete && heapGrowthBytes <= allowedHeapGrowthBytes;
  return freeze({
    schema: EON_ENDURANCE_RECEIPT_SCHEMA,
    releaseDigest,
    evidenceDigest,
    durationMinutes,
    canonicalRouteCycles,
    baselineResources: baseline,
    finalResources: final,
    resourceDeltas,
    baselineHeapBytes,
    finalHeapBytes,
    heapGrowthBytes,
    allowedHeapGrowthBytes,
    measurementComplete,
    resourcesDisposed,
    heapBounded,
    passed: measurementComplete && resourcesDisposed && heapBounded,
    headedBrowserEvidenceRequired: true,
    externallyCertified: false,
    automaticCertification: false,
    containsUserContent: false,
    containsCredentials: false,
    externalActionPerformed: false
  });
}

export function createOwnerLabReceipt(input = {}) {
  const commit = String(input.commit || '').toLowerCase();
  const tree = String(input.tree || '').toLowerCase();
  const releaseDigest = String(input.releaseDigest || '').toLowerCase();
  const sourceReceiptDigest = String(input.sourceReceiptDigest || '').toLowerCase();
  const explicitUserAction = input.explicitUserAction === true;
  const vitals = input.vitalsReceipt || createCoreWebVitalsReceipt();
  const endurance = input.enduranceReceipt || createCoreEnduranceReceipt();
  const exactCandidate = validGit(commit) && validGit(tree) && validDigest(releaseDigest) && validDigest(sourceReceiptDigest)
    && vitals.releaseDigest === releaseDigest && endurance.releaseDigest === releaseDigest;
  const evidenceComplete = exactCandidate && vitals.measurementComplete && endurance.measurementComplete;
  const budgetsPass = evidenceComplete && vitals.withinBudgets && endurance.passed;
  return freeze({
    schema: EON_OWNER_LAB_RECEIPT_SCHEMA,
    commit,
    tree,
    releaseDigest,
    sourceReceiptDigest,
    explicitUserAction,
    exactCandidate,
    evidenceComplete,
    budgetsPass,
    ownerLabReadyForManualDecision: explicitUserAction && budgetsPass,
    ownerDecisionRecorded: false,
    productionAuthorized: false,
    automaticCertification: false,
    automaticDeployment: false,
    externalActionPerformed: false,
    containsUserContent: false,
    containsCredentials: false
  });
}

export function getPerformanceResilienceTruth() {
  return freeze({
    schema: EON_PERFORMANCE_RESILIENCE_SCHEMA,
    coreWebVitalsThresholds: EON_CORE_WEB_VITAL_THRESHOLDS,
    coreEnduranceRequirements: EON_CORE_ENDURANCE_REQUIREMENTS,
    coreInitialBundleMayContainCityImplementation: false,
    evidenceMustMatchExactRelease: true,
    browserMeasurementPerformedByThisModule: false,
    performanceObserverStarted: false,
    memoryReadPerformed: false,
    storageWritten: false,
    networkRequestCreated: false,
    navigationCreated: false,
    rawUserContentCollected: false,
    credentialsCollected: false,
    ownerLabIsDeploymentAuthority: false,
    automaticCertification: false
  });
}
