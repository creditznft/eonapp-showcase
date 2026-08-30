/**
 * W715 institutional performance and asset-engineering authority.
 *
 * Pure budgets and projections only. Real transfer, frame, memory, thermal and
 * device evidence remains a W718 browser/device responsibility.
 */
import { getEonCityW649PerformanceProfile } from '../../city/w649/eon-city-w649-performance-profile.js';
import { getEonCityCellStreamerTruth } from '../../city/eon-city-cell-streamer.js';
import { getCityPerformanceObservationTruth } from '../../city/eon-city-performance-observation.js';

export const EONAPP_W715_PERFORMANCE_ASSET_SCHEMA = 'eonapp.performance-asset-engineering.w715.v1';

const freeze = Object.freeze;
const QUALITY_IDS = freeze(['low', 'balanced', 'high']);

export const EONAPP_W715_BUDGETS = freeze({
  perBinaryAssetBytesMax: 4 * 1024 * 1024,
  firstPlayableBinaryBytesMax: freeze({ low: 8 * 1024 * 1024, balanced: 14 * 1024 * 1024, high: 22 * 1024 * 1024 }),
  initialRouteGzipBytesMax: freeze({ compact: 30000, records: 45000, conversational: 50000, immersive: 60000, workbench: 75000, informational: 110000 }),
  firstPlayableMsMax: freeze({ low: 7000, balanced: 5000, high: 4000 }),
  p95FrameMsMax: freeze({ low: 50, balanced: 33.34, high: 20 }),
  usedHeapBytesMax: freeze({ low: 350 * 1024 * 1024, balanced: 550 * 1024 * 1024, high: 850 * 1024 * 1024 }),
  visibleCellCountMax: 25,
  interactiveCellCountMax: 9,
  residentDistrictCountMax: freeze({ low: 1, balanced: 2, high: 2 })
});

function qualityId(value = 'balanced', { reducedData = false, deviceMemoryGb = 0 } = {}) {
  if (reducedData || (Number(deviceMemoryGb) > 0 && Number(deviceMemoryGb) <= 4)) return 'low';
  const requested = String(value || '').trim().toLowerCase();
  return QUALITY_IDS.includes(requested) ? requested : 'balanced';
}

function cityQuality(id) {
  return id === 'low' ? 'lite' : id === 'high' ? 'cinematic' : 'balanced';
}

export function buildEonAppW715PerformancePlan({ quality = 'balanced', reducedData = false, reducedMotion = false, deviceMemoryGb = 0 } = {}) {
  const id = qualityId(quality, { reducedData, deviceMemoryGb });
  const cityProfile = getEonCityW649PerformanceProfile(cityQuality(id), { reducedData: id === 'low', reducedMotion });
  const cellTruth = getEonCityCellStreamerTruth({ quality: cityQuality(id) });
  const observationTruth = getCityPerformanceObservationTruth();
  return freeze({
    schema: EONAPP_W715_PERFORMANCE_ASSET_SCHEMA,
    quality: id,
    cityQuality: cityProfile.id,
    reducedData: id === 'low' || reducedData === true,
    reducedMotion: reducedMotion === true,
    budgets: freeze({
      perBinaryAssetBytesMax: EONAPP_W715_BUDGETS.perBinaryAssetBytesMax,
      firstPlayableBinaryBytesMax: EONAPP_W715_BUDGETS.firstPlayableBinaryBytesMax[id],
      firstPlayableMsMax: EONAPP_W715_BUDGETS.firstPlayableMsMax[id],
      p95FrameMsMax: EONAPP_W715_BUDGETS.p95FrameMsMax[id],
      usedHeapBytesMax: EONAPP_W715_BUDGETS.usedHeapBytesMax[id],
      residentDistrictCountMax: EONAPP_W715_BUDGETS.residentDistrictCountMax[id],
      visibleCellCountMax: EONAPP_W715_BUDGETS.visibleCellCountMax,
      interactiveCellCountMax: EONAPP_W715_BUDGETS.interactiveCellCountMax
    }),
    runtime: freeze({
      preloadAll: false,
      optionalCharacters: cityProfile.optionalCharacters,
      proceduralDistantRepresentation: cityProfile.distantRepresentation === 'procedural-silhouette',
      primitiveCollisionOnly: cityProfile.collisionPolicy === 'primitive-proxies-only',
      visibleCellCount: cellTruth.residentCellCount,
      remoteAssetDependency: false,
      deviceStreamingProofPending: !cellTruth.deviceStreamingProofCaptured
    }),
    assetStore: freeze({
      canonicalSourceRoot: 'assets/city/w649',
      publicBuildMirrorRoot: 'public/assets/city/w649',
      buildShipsPublicMirrorOnly: true,
      contentHashedFilenamesRequired: true,
      sourcePublicByteParityRequired: true,
      duplicateBinariesWithinBuildForbidden: true
    }),
    cacheUpdate: freeze({
      persistentCityCache: 'eonapp-city-assets-v1',
      contentAddressedReadsOnly: true,
      explicitActivationRequired: true,
      explicitReloadRequired: true,
      automaticActivation: false,
      automaticReload: false
    }),
    observation: freeze({
      localOnly: observationTruth.localOnly,
      memoryOnly: observationTruth.persistence === 'memory-only',
      automaticCertification: observationTruth.automaticCertification,
      manualReviewRequired: observationTruth.manualReviewRequired
    }),
    remoteTelemetry: false,
    privateContentMeasured: false,
    deviceCertificationCreated: false
  });
}

export function evaluateEonAppW715Observation(observation = {}, plan = buildEonAppW715PerformancePlan()) {
  const firstFrameMs = Number(observation.firstFrameMs);
  const p95FrameMs = Number(observation.p95FrameMs);
  const usedHeapBytes = Number(observation.memory?.latestUsedBytes);
  const checks = freeze({
    firstPlayable: Number.isFinite(firstFrameMs) && firstFrameMs <= plan.budgets.firstPlayableMsMax,
    p95Frame: Number.isFinite(p95FrameMs) && p95FrameMs <= plan.budgets.p95FrameMsMax,
    memory: !Number.isFinite(usedHeapBytes) || usedHeapBytes <= plan.budgets.usedHeapBytesMax,
    contextStable: observation.contextLost !== true
  });
  return freeze({
    schema: `${EONAPP_W715_PERFORMANCE_ASSET_SCHEMA}.observation.v1`,
    ok: Object.values(checks).every(Boolean),
    checks,
    manualReviewRequired: true,
    automaticallyCertified: false
  });
}

export function validateEonAppW715PerformancePlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EONAPP_W715_PERFORMANCE_ASSET_SCHEMA) errors.push('schema');
  if (!QUALITY_IDS.includes(plan.quality)) errors.push('quality');
  if (plan.runtime?.preloadAll || plan.runtime?.remoteAssetDependency) errors.push('runtime-boundary');
  if (!plan.assetStore?.buildShipsPublicMirrorOnly || !plan.assetStore?.sourcePublicByteParityRequired || !plan.assetStore?.duplicateBinariesWithinBuildForbidden) errors.push('asset-store');
  if (!plan.cacheUpdate?.explicitActivationRequired || !plan.cacheUpdate?.explicitReloadRequired || plan.cacheUpdate?.automaticActivation || plan.cacheUpdate?.automaticReload) errors.push('update-boundary');
  if (!plan.observation?.localOnly || !plan.observation?.memoryOnly || plan.observation?.automaticCertification || !plan.observation?.manualReviewRequired) errors.push('observation-boundary');
  if (plan.remoteTelemetry || plan.privateContentMeasured || plan.deviceCertificationCreated) errors.push('truth-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonAppW715PerformanceAssetTruth() {
  return freeze({
    schema: `${EONAPP_W715_PERFORMANCE_ASSET_SCHEMA}.truth.v1`,
    qualityProfiles: QUALITY_IDS,
    canonicalBinarySource: 'assets/city/w649',
    publicBuildMirror: 'public/assets/city/w649',
    buildShipsOneBinaryCopy: true,
    preloadAll: false,
    localObservationOnly: true,
    realDeviceProofRequired: true,
    browserProofRequired: true,
    automaticCertification: false,
    performsNetworkRequest: false,
    mutatesCache: false
  });
}
