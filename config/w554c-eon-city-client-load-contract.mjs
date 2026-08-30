/**
 * W554C — client-first City load and delivery contract.
 *
 * Product boundary:
 * - The browser streams approved City assets directly from static same-origin
 *   paths. Pages Functions must not proxy GLB/KTX2/audio/image bodies.
 * - Google/EONAPP identity controls City entry. Browser-only identity is a
 *   boot gate, not a cryptographic download firewall.
 * - W649 binary art ships from content-hashed static paths after the signed-in
 *   boot gate. Google Login is a product-entry validator, not a cryptographic
 *   asset firewall; no Pages Function relays GLB bytes.
 * - Load progress may show stage progress immediately. Byte progress is shown
 *   only when an actual client-side stream reports bytes. No invented download
 *   percentages or fake ready state are permitted.
 */

export const EON_CITY_CLIENT_LOAD_SCHEMA = 'eon.city.client-load.w554c.v1';
export const EON_CITY_CLIENT_DELIVERY_SCHEMA = 'eon.city.client-delivery.w554c.v1';

export const EON_CITY_CLIENT_DELIVERY = Object.freeze({
  schema: EON_CITY_CLIENT_DELIVERY_SCHEMA,
  mode: 'client-first-static',
  identityEntry: 'existing-eonapp-google-session',
  browserBootGate: true,
  pagesFunctionAssetRelayAllowed: false,
  directStaticResponses: true,
  serverStoredProjectState: false,
  serverStoredCityProgress: false,
  currentHeavyArtReleased: true,
  privateBinaryArtRequirement: 'content-hashed-static-browser-cache',
  persistentAssetCacheName: 'eonapp-city-assets-v1',
  unchangedAssetsSurviveAppUpdates: true,
  logoutDoesNotClearAssetCache: true,
  lazyDistrictLoading: true,
  privateAssetExperimentPath: '/city-private/',
  approvedDirectStaticPrefixes: Object.freeze(['/assets/city/', '/city-assets/']),
  notes: Object.freeze([
    'Google Login controls entry to EON City; it does not create automatic backup or multi-device sync.',
    'Static asset bytes must travel directly from the CDN to the user browser, not through a custom Pages Function response relay.',
    'Google Login is the product entry validator. Static City art remains a same-origin public asset URL and is not presented as a cryptographic download firewall.',
    'Unchanged content-hashed W649 assets keep the same URL across deployments and are reused from browser caches whenever the browser retains them.',
    'Browser storage can be evicted by the browser or user; EONAPP must never claim a permanent one-time download guarantee.'
  ])
});

export const EON_CITY_CLIENT_LOAD_STAGES = Object.freeze([
  Object.freeze({ id: 'access-check', progress: 6, label: 'Checking private City access', detail: 'The full renderer is still off.' }),
  Object.freeze({ id: 'access-confirmed', progress: 16, label: 'City access confirmed', detail: 'Preparing this browser only.' }),
  Object.freeze({ id: 'device-profile', progress: 30, label: 'Choosing a display profile', detail: 'Matching City quality to this device.' }),
  Object.freeze({ id: 'engine-loading', progress: 52, label: 'Loading the City engine', detail: 'Loading local code without opening work or sending data.' }),
  Object.freeze({ id: 'world-building', progress: 78, label: 'Building Command Horizon', detail: 'Preparing the City scene locally.' }),
  Object.freeze({ id: 'art-streaming', progress: 92, label: 'Streaming approved City art', detail: 'Downloading only the selected static City assets.' }),
  Object.freeze({ id: 'first-frame', progress: 100, label: 'City ready', detail: 'Command Horizon is ready to explore.' })
]);

const stageById = new Map(EON_CITY_CLIENT_LOAD_STAGES.map((stage, index) => [stage.id, Object.freeze({ ...stage, index })]));
const allowedStaticPrefixes = EON_CITY_CLIENT_DELIVERY.approvedDirectStaticPrefixes;

export function normalizeEonCityLoadStage(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  return stageById.has(candidate) ? candidate : 'access-check';
}

export function getEonCityLoadStage(value = '') {
  return stageById.get(normalizeEonCityLoadStage(value)) || stageById.get('access-check');
}

export function getEonCityLoadStageCount() {
  return EON_CITY_CLIENT_LOAD_STAGES.length;
}

export function isDirectStaticEonCityAssetPath(value = '') {
  const path = String(value || '').trim();
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('\u0000')) return false;
  if (/[?#]/.test(path)) return false;
  return allowedStaticPrefixes.some((prefix) => path.startsWith(prefix));
}

export function normalizeDirectStaticEonCityAssetPath(value = '') {
  const path = String(value || '').trim();
  return isDirectStaticEonCityAssetPath(path) ? path : null;
}

export function createEonCityClientLoadSnapshot({
  stage = 'access-check',
  detail = '',
  asset = null,
  cache = null,
  status = 'loading'
} = {}) {
  const normalizedStage = getEonCityLoadStage(stage);
  const loadedBytes = Math.max(0, Number(asset?.loadedBytes || 0));
  const totalBytes = Math.max(0, Number(asset?.totalBytes || 0));
  const byteProgress = totalBytes > 0 ? Math.min(1, loadedBytes / totalBytes) : null;
  const assetProgress = normalizedStage.id === 'art-streaming' && byteProgress !== null
    ? Math.min(99, Math.max(normalizedStage.progress, Math.round(normalizedStage.progress + ((99 - normalizedStage.progress) * byteProgress))))
    : normalizedStage.progress;
  const progress = status === 'error' ? Math.min(assetProgress, 99) : status === 'ready' ? 100 : assetProgress;
  return Object.freeze({
    schema: EON_CITY_CLIENT_LOAD_SCHEMA,
    status: status === 'error' ? 'error' : status === 'ready' ? 'ready' : 'loading',
    stage: normalizedStage.id,
    stageIndex: normalizedStage.index,
    stageCount: EON_CITY_CLIENT_LOAD_STAGES.length,
    progress,
    stageProgress: normalizedStage.progress,
    label: normalizedStage.label,
    detail: String(detail || normalizedStage.detail),
    asset: asset && typeof asset === 'object'
      ? Object.freeze({
        id: String(asset.id || 'city-asset'),
        loadedBytes,
        totalBytes,
        byteProgress,
        directStatic: asset.directStatic === true,
        sourcePath: normalizeDirectStaticEonCityAssetPath(asset.sourcePath || '')
      })
      : null,
    cache: cache && typeof cache === 'object'
      ? Object.freeze({
        cacheName: String(cache.cacheName || EON_CITY_CLIENT_DELIVERY.persistentAssetCacheName),
        cachedEntries: Math.max(0, Number(cache.cachedEntries || 0)),
        persisted: cache.persisted === true,
        persistenceRequested: cache.persistenceRequested === true,
        cacheStorageSupported: cache.cacheStorageSupported !== false,
        releaseStableCacheName: cache.releaseStableCacheName !== false,
        appUpdatePreservesUnchangedAssets: cache.appUpdatePreservesUnchangedAssets !== false,
        userDataRead: false,
        userDataWritten: false
      })
      : null,
    directStaticResponses: true,
    pagesFunctionAssetRelayAllowed: false,
    remoteTelemetry: false,
    containsUserData: false
  });
}

export function describeEonCityLoadProgress(snapshot = {}) {
  const safe = createEonCityClientLoadSnapshot(snapshot);
  const stageText = `Stage ${Math.min(safe.stageIndex + 1, safe.stageCount)} of ${safe.stageCount}`;
  if (safe.asset?.totalBytes > 0) {
    const loaded = Math.round(safe.asset.loadedBytes / 1024);
    const total = Math.round(safe.asset.totalBytes / 1024);
    return `${stageText} · ${loaded} KB of ${total} KB`;
  }
  return stageText;
}

export function validateEonCityClientDeliveryContract() {
  const errors = [];
  if (EON_CITY_CLIENT_DELIVERY.pagesFunctionAssetRelayAllowed !== false) errors.push('Pages Function asset relay must remain disabled.');
  if (EON_CITY_CLIENT_DELIVERY.directStaticResponses !== true) errors.push('City assets must be delivered as direct static responses.');
  if (!Array.isArray(EON_CITY_CLIENT_DELIVERY.approvedDirectStaticPrefixes) || EON_CITY_CLIENT_DELIVERY.approvedDirectStaticPrefixes.length < 1) errors.push('At least one direct static asset prefix is required.');
  if (EON_CITY_CLIENT_DELIVERY.currentHeavyArtReleased !== true) errors.push('Current W649 heavy art must be declared released.');
  if (EON_CITY_CLIENT_DELIVERY.persistentAssetCacheName !== 'eonapp-city-assets-v1') errors.push('City asset cache name must remain stable across app releases.');
  if (EON_CITY_CLIENT_DELIVERY.unchangedAssetsSurviveAppUpdates !== true || EON_CITY_CLIENT_DELIVERY.logoutDoesNotClearAssetCache !== true) errors.push('Unchanged City assets must survive app updates and logout.');
  if (EON_CITY_CLIENT_DELIVERY.lazyDistrictLoading !== true) errors.push('City must retain lazy district loading.');
  if (EON_CITY_CLIENT_LOAD_STAGES.at(-1)?.id !== 'first-frame' || EON_CITY_CLIENT_LOAD_STAGES.at(-1)?.progress !== 100) errors.push('First frame must be the only 100% City loading stage.');
  const ids = EON_CITY_CLIENT_LOAD_STAGES.map((stage) => stage.id);
  if (new Set(ids).size !== ids.length) errors.push('City loading stage IDs must be unique.');
  return Object.freeze({ schema: EON_CITY_CLIENT_LOAD_SCHEMA, ok: errors.length === 0, errors: Object.freeze(errors) });
}

export default Object.freeze({
  EON_CITY_CLIENT_LOAD_SCHEMA,
  EON_CITY_CLIENT_DELIVERY_SCHEMA,
  EON_CITY_CLIENT_DELIVERY,
  EON_CITY_CLIENT_LOAD_STAGES,
  normalizeEonCityLoadStage,
  getEonCityLoadStage,
  getEonCityLoadStageCount,
  isDirectStaticEonCityAssetPath,
  normalizeDirectStaticEonCityAssetPath,
  createEonCityClientLoadSnapshot,
  describeEonCityLoadProgress,
  validateEonCityClientDeliveryContract
});
