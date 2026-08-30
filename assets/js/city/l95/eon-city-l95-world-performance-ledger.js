/**
 * RT90 / L95 — bounded, local-only Open World performance ledger.
 *
 * This controller owns no timer, render loop, network request, persistence or
 * remote telemetry. The canonical City runtime feeds it events it already
 * owns: world entry, first rendered frame, the existing ~1 Hz FPS sample and
 * world return/switch. Network waterfall / duplicate-request evidence remains
 * an explicit headed-browser proof boundary rather than an inferred PASS.
 */
export const EON_CITY_L95_WORLD_PERFORMANCE_LEDGER_SCHEMA = 'eon.city.l95.world-performance-ledger.rt90.v1';

const freeze = Object.freeze;
const WORLD_IDS = new Set(['signal-frontier', 'storm-sector', 'my-frontier']);
const MAX_COMPLETED_SESSIONS = 12;
const MAX_FPS_SAMPLES_PER_SESSION = 18;
const MAX_ASSET_SNAPSHOTS_PER_SESSION = 6;

const safeWorldId = (value = '') => {
  const id = String(value || '').trim().toLowerCase();
  return WORLD_IDS.has(id) ? id : '';
};

const bounded = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : null;
};

const cleanText = (value = '', max = 120) => String(value || '').trim().slice(0, max);

function normalizeAssetSnapshot(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return freeze({
    requested: bounded(source.requested, { max: 10000 }),
    presented: bounded(source.presented, { max: 10000 }),
    queued: bounded(source.queued, { max: 10000 }),
    loading: bounded(source.loading, { max: 10000 }),
    pending: bounded(source.pending, { max: 10000 }),
    rejected: bounded(source.rejected, { max: 10000 }),
    mountedSectors: bounded(source.mountedSectors, { max: 10000 }),
    activeOptionalLoads: bounded(source.activeOptionalLoads, { max: 1000 }),
    source: cleanText(source.source || 'runtime-summary', 80)
  });
}

function cloneSession(session = null, now = 0) {
  if (!session) return null;
  const endAt = session.endedAtMonotonicMs ?? now;
  const firstFrameMs = session.firstFrameAtMonotonicMs === null
    ? null
    : Math.max(0, session.firstFrameAtMonotonicMs - session.enteredAtMonotonicMs);
  return freeze({
    schema: EON_CITY_L95_WORLD_PERFORMANCE_LEDGER_SCHEMA,
    sessionId: session.sessionId,
    worldRegionId: session.worldRegionId,
    entryOrdinal: session.entryOrdinal,
    entryReason: session.entryReason,
    exitReason: session.exitReason,
    enteredAtMonotonicMs: session.enteredAtMonotonicMs,
    endedAtMonotonicMs: session.endedAtMonotonicMs,
    sessionDurationMs: Math.max(0, endAt - session.enteredAtMonotonicMs),
    firstPlayableFrameMs: firstFrameMs,
    firstPlayableFrameObserved: session.firstFrameAtMonotonicMs !== null,
    engineCount: session.engineCount,
    sceneCount: session.sceneCount,
    renderLoopOwnerCount: session.renderLoopOwnerCount,
    fpsSamples: freeze(session.fpsSamples.map((entry) => freeze({ ...entry }))),
    assetSnapshots: freeze(session.assetSnapshots.map((entry) => freeze({ ...entry, snapshot: freeze({ ...entry.snapshot }) }))),
    network: freeze({
      duplicateRequestCount: null,
      networkRequestCount: null,
      transferBytes: null,
      headedBrowserWaterfallRequired: true,
      noDuplicateRequestPassClaimed: false
    })
  });
}

export function createEonCityL95WorldPerformanceLedger({ now = () => globalThis.performance?.now?.() ?? Date.now() } = {}) {
  const entryOrdinals = new Map();
  const completed = [];
  let active = null;
  let sequence = 0;

  const timestamp = () => {
    const value = Number(now?.());
    return Number.isFinite(value) ? Math.max(0, value) : Date.now();
  };

  const finishActive = ({ reason = 'world-switch', assetSnapshot = null } = {}) => {
    if (!active) return freeze({ ok: true, reason: 'no-active-world-session', session: null });
    if (assetSnapshot) {
      active.assetSnapshots.push(freeze({ phase: 'exit', atMonotonicMs: timestamp(), snapshot: normalizeAssetSnapshot(assetSnapshot) }));
      if (active.assetSnapshots.length > MAX_ASSET_SNAPSHOTS_PER_SESSION) active.assetSnapshots.shift();
    }
    active.exitReason = cleanText(reason || 'world-switch');
    active.endedAtMonotonicMs = timestamp();
    const snapshot = cloneSession(active, active.endedAtMonotonicMs);
    completed.push(snapshot);
    if (completed.length > MAX_COMPLETED_SESSIONS) completed.shift();
    active = null;
    return freeze({ ok: true, session: snapshot });
  };

  const begin = ({ worldRegionId = '', reason = 'explicit-entry', engineCount = 1, sceneCount = 1, renderLoopOwnerCount = 1, assetSnapshot = null } = {}) => {
    const id = safeWorldId(worldRegionId);
    if (!id) return freeze({ ok: false, reason: 'supported-world-required' });
    if (active?.worldRegionId === id) return freeze({ ok: true, reused: true, session: cloneSession(active, timestamp()) });
    if (active) finishActive({ reason: `world-switch:${active.worldRegionId}->${id}` });
    const ordinal = Number(entryOrdinals.get(id) || 0) + 1;
    entryOrdinals.set(id, ordinal);
    sequence += 1;
    const enteredAt = timestamp();
    active = {
      sessionId: `${id}:${sequence}`,
      worldRegionId: id,
      entryOrdinal: ordinal,
      entryReason: cleanText(reason || 'explicit-entry'),
      exitReason: '',
      enteredAtMonotonicMs: enteredAt,
      endedAtMonotonicMs: null,
      firstFrameAtMonotonicMs: null,
      engineCount: bounded(engineCount, { max: 8 }) ?? 1,
      sceneCount: bounded(sceneCount, { max: 8 }) ?? 1,
      renderLoopOwnerCount: bounded(renderLoopOwnerCount, { max: 8 }) ?? 1,
      fpsSamples: [],
      assetSnapshots: []
    };
    if (assetSnapshot) active.assetSnapshots.push(freeze({ phase: 'entry', atMonotonicMs: enteredAt, snapshot: normalizeAssetSnapshot(assetSnapshot) }));
    return freeze({ ok: true, reused: false, session: cloneSession(active, enteredAt) });
  };

  const recordFirstPlayableFrame = ({ worldRegionId = '', assetSnapshot = null } = {}) => {
    const id = safeWorldId(worldRegionId);
    if (!active || active.worldRegionId !== id) return freeze({ ok: false, reason: 'active-world-session-mismatch' });
    if (active.firstFrameAtMonotonicMs === null) active.firstFrameAtMonotonicMs = timestamp();
    if (assetSnapshot) {
      active.assetSnapshots.push(freeze({ phase: 'first-playable-frame', atMonotonicMs: timestamp(), snapshot: normalizeAssetSnapshot(assetSnapshot) }));
      if (active.assetSnapshots.length > MAX_ASSET_SNAPSHOTS_PER_SESSION) active.assetSnapshots.shift();
    }
    return freeze({ ok: true, session: cloneSession(active, timestamp()) });
  };

  const recordFpsSample = (sample = {}) => {
    if (!active) return freeze({ ok: false, reason: 'active-world-session-required' });
    const id = safeWorldId(sample?.worldRegionId);
    if (!id || id !== active.worldRegionId) return freeze({ ok: false, reason: 'fps-world-session-mismatch' });
    active.fpsSamples.push(freeze({
      at: bounded(sample.at, { max: Number.MAX_SAFE_INTEGER }),
      fps: bounded(sample.fps, { max: 1000 }),
      engineFps: bounded(sample.engineFps, { max: 1000 }),
      sampleMs: bounded(sample.sampleMs, { max: 120000 }),
      frames: bounded(sample.frames, { max: 10000 }),
      samplePhase: cleanText(sample.samplePhase || 'unknown', 32),
      hardwareScalingLevel: bounded(sample.hardwareScalingLevel, { max: 8 })
    }));
    if (active.fpsSamples.length > MAX_FPS_SAMPLES_PER_SESSION) active.fpsSamples.shift();
    return freeze({ ok: true, sampleCount: active.fpsSamples.length });
  };

  const recordAssetSnapshot = ({ worldRegionId = '', phase = 'runtime', snapshot = null } = {}) => {
    const id = safeWorldId(worldRegionId);
    if (!active || active.worldRegionId !== id || !snapshot) return freeze({ ok: false, reason: 'active-world-asset-snapshot-required' });
    active.assetSnapshots.push(freeze({ phase: cleanText(phase || 'runtime', 48), atMonotonicMs: timestamp(), snapshot: normalizeAssetSnapshot(snapshot) }));
    if (active.assetSnapshots.length > MAX_ASSET_SNAPSHOTS_PER_SESSION) active.assetSnapshots.shift();
    return freeze({ ok: true, snapshotCount: active.assetSnapshots.length });
  };

  const finish = ({ worldRegionId = '', reason = 'return-to-command-hub', assetSnapshot = null } = {}) => {
    const id = safeWorldId(worldRegionId);
    if (!active) return freeze({ ok: true, reason: 'no-active-world-session', session: null });
    if (id && id !== active.worldRegionId) return freeze({ ok: false, reason: 'active-world-session-mismatch' });
    return finishActive({ reason, assetSnapshot });
  };

  const getSnapshot = () => freeze({
    schema: EON_CITY_L95_WORLD_PERFORMANCE_LEDGER_SCHEMA,
    localOnly: true,
    persistence: 'memory-only',
    remoteTelemetry: false,
    ownsTimer: false,
    ownsRenderLoop: false,
    performsNetworkRequests: false,
    activeSession: cloneSession(active, timestamp()),
    completedSessions: freeze([...completed]),
    entryOrdinals: freeze(Object.fromEntries([...entryOrdinals.entries()])),
    proofBoundary: freeze({
      realGpuBrowserProofRequired: true,
      headedBrowserNetworkWaterfallRequired: true,
      duplicateNetworkRequestPassNeverInferred: true,
      softwareRendererFpsNotAcceptedAsHardwareCertification: true,
      automaticCertification: false
    })
  });

  return freeze({ begin, recordFirstPlayableFrame, recordFpsSample, recordAssetSnapshot, finish, getSnapshot });
}

export default freeze({ EON_CITY_L95_WORLD_PERFORMANCE_LEDGER_SCHEMA, createEonCityL95WorldPerformanceLedger });
