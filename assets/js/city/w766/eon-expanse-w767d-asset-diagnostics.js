const freeze = (value) => Object.freeze(value);
const list = (value) => Array.isArray(value) ? value : [];
const bounded = (value = '', max = 220) => String(value || '').slice(0, max);

export const EON_EXPANSE_W767D_ASSET_DIAGNOSTICS_SCHEMA = 'eon.city.expanse.asset-diagnostics.w767d.v1';

const classifyVariant = (path = '', declared = '') => {
  if (declared === 'fallback' || String(path).includes('/fallback/')) return 'authored-fallback';
  if (declared === 'primary' || String(path).includes('/primary/')) return 'primary';
  return 'unknown';
};

const heroRecords = (summary = {}) => {
  const records = [];
  for (const entry of list(summary.assets)) {records.push(freeze({
    id: String(entry.id || ''), source: 'hero-landmark', zoneId: String(entry.zoneId || ''), assetId: String(entry.assetId || ''),
    state: 'presented', variant: classifyVariant(entry.truth?.requestedPath || '', entry.variant), requestedPath: bounded(entry.truth?.requestedPath || ''),
    visibleMeshCount: Number(entry.truth?.visibleMeshCount || 0), materialCount: Number(entry.truth?.materialCount || 0),
    worldBounds: entry.truth?.worldBounds || null, failureReason: '', fallbackPresented: entry.variant === 'fallback', proceduralFallbackPresented: false,
    attempts: freeze(list(entry.attempts).map((attempt) => freeze({ variant: attempt.variant || '', requestedPath: bounded(attempt.requestedPath || ''), ok: attempt.ok === true, failureReason: bounded(attempt.failureReason || '') })))
  }));}
  for (const entry of list(summary.failures)) {records.push(freeze({
    id: String(entry.id || ''), source: 'hero-landmark', zoneId: String(entry.zoneId || ''), assetId: String(entry.assetId || ''),
    state: 'fallback-presented', variant: 'procedural-fallback', requestedPath: '', visibleMeshCount: 0, materialCount: 0, worldBounds: null,
    failureReason: bounded(entry.reason || 'asset-presentation-rejected'), fallbackPresented: true, proceduralFallbackPresented: true,
    attempts: freeze(list(entry.attempts).map((attempt) => freeze({ variant: attempt.variant || '', requestedPath: bounded(attempt.requestedPath || ''), ok: attempt.ok === true, failureReason: bounded(attempt.failureReason || '') })))
  }));}
  for (const entry of list(summary.pendingAssets)) {records.push(freeze({
    id: String(entry.id || ''), source: 'hero-landmark', zoneId: String(entry.zoneId || ''), assetId: String(entry.assetId || ''), state: 'pending', variant: 'unknown',
    requestedPath: '', visibleMeshCount: 0, materialCount: 0, worldBounds: null, failureReason: '', fallbackPresented: true, proceduralFallbackPresented: true, attempts: freeze([])
  }));}
  return records;
};

const npcRecords = (summary = {}) => list(summary.assetStates).map((entry) => {
  const state = String(entry.state || 'loading');
  return freeze({
    id: String(entry.npcId || ''), source: 'npc', zoneId: String(entry.zoneId || ''), assetId: String(entry.characterId || entry.assetAlias || ''),
    state: state === 'loaded' ? 'presented' : state === 'fallback' ? 'fallback-presented' : 'pending',
    variant: state === 'fallback' ? 'procedural-fallback' : classifyVariant(entry.variantPath || ''), requestedPath: bounded(entry.variantPath || ''),
    visibleMeshCount: Number(entry.truth?.visibleMeshCount || entry.visibleMeshCount || 0),
    materialCount: Number(entry.truth?.materialCount || entry.materialCount || 0),
    worldBounds: entry.truth?.worldBounds || entry.worldBounds || null,
    failureReason: bounded(entry.failureReason || ''),
    fallbackPresented: state !== 'loaded' || String(entry.variantPath || '').includes('/fallback/'), proceduralFallbackPresented: state !== 'loaded',
    attempts: freeze(list(entry.attempts).map((attempt) => freeze({
      variant: attempt.variant || classifyVariant(attempt.path || ''), requestedPath: bounded(attempt.path || ''), ok: attempt.ok === true,
      failureReason: bounded(attempt.reason || attempt.truth?.failureReason || '')
    })))
  });
});

const activityRecords = (summary = {}) => list(summary.assetStates).map((entry) => {
  const state = String(entry.state || 'pending');
  return freeze({
    id: String(entry.id || ''), source: 'activity', zoneId: String(entry.zoneId || ''), assetId: String(entry.assetId || ''),
    state: state === 'loaded' ? 'presented' : state === 'failed' ? 'fallback-presented' : 'pending',
    variant: state === 'failed' ? 'procedural-fallback' : classifyVariant(entry.path || ''), requestedPath: bounded(entry.path || ''),
    visibleMeshCount: Number(entry.truth?.visibleMeshCount || entry.visibleMeshCount || 0),
    materialCount: Number(entry.truth?.materialCount || entry.materialCount || 0),
    worldBounds: entry.truth?.worldBounds || entry.worldBounds || null,
    failureReason: bounded(entry.failureReason || ''),
    fallbackPresented: state !== 'loaded' || String(entry.path || '').includes('/fallback/'), proceduralFallbackPresented: state !== 'loaded',
    attempts: freeze(list(entry.attempts).map((attempt) => freeze({
      variant: attempt.variant || classifyVariant(attempt.path || ''), requestedPath: bounded(attempt.path || ''), ok: attempt.ok === true,
      failureReason: bounded(attempt.reason || attempt.truth?.failureReason || '')
    })))
  });
});

export function buildEonExpanseW767DAssetTruthReport({ hero = {}, npcs = {}, activities = {}, expectedZoneIds = [] } = {}) {
  const records = freeze([...heroRecords(hero), ...npcRecords(npcs), ...activityRecords(activities)]);
  const totals = freeze({
    requested: records.length,
    presented: records.filter((entry) => entry.state === 'presented').length,
    pending: records.filter((entry) => entry.state === 'pending').length,
    rejected: records.filter((entry) => entry.failureReason).length,
    authoredFallback: records.filter((entry) => entry.variant === 'authored-fallback').length,
    proceduralFallback: records.filter((entry) => entry.proceduralFallbackPresented).length
  });
  const expected = [...new Set(list(expectedZoneIds).map(String).filter(Boolean))];
  const zoneCoverage = freeze(expected.map((zoneId) => {
    const landmarks = records.filter((entry) => entry.source === 'hero-landmark' && entry.zoneId === zoneId);
    const presented = landmarks.filter((entry) => entry.state === 'presented');
    return freeze({ zoneId, requested: landmarks.length, presented: presented.length, covered: presented.length > 0, fallbackOnly: presented.length === 0 && landmarks.some((entry) => entry.fallbackPresented) });
  }));
  const missingZoneIds = freeze(zoneCoverage.filter((entry) => !entry.covered).map((entry) => entry.zoneId));
  const releaseReady = totals.pending === 0 && totals.rejected === 0 && totals.proceduralFallback === 0 && missingZoneIds.length === 0;
  return freeze({
    schema: EON_EXPANSE_W767D_ASSET_DIAGNOSTICS_SCHEMA,
    generatedAt: new Date().toISOString(),
    totals,
    zoneCoverage,
    missingZoneIds,
    records,
    status: releaseReady ? 'release-ready' : totals.pending > 0 ? 'loading' : 'repair-required',
    releaseReady,
    truthBoundary: freeze({ promiseResolutionIsNotPresentation: true, proxySuppressionRequiresValidatedPresentation: true, browserEvidenceStillRequired: true })
  });
}

export function serializeEonExpanseW767DAssetTruthReport(report = {}, { pretty = true } = {}) {
  const payload = { ...report, exportedAt: new Date().toISOString() };
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}
