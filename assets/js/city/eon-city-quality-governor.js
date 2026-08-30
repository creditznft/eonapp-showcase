/**
 * W431 — bounded, local-only City quality governor.
 *
 * This governor observes renderer frame intervals in memory for the current
 * City session. It may recommend one reversible local protection pass. It never
 * writes a device profile, sends telemetry, reduces user data, changes a saved
 * visual preference, reloads the route, or marks device certification complete.
 */
export const EON_CITY_QUALITY_GOVERNOR_SCHEMA = 'eon.city.quality-governor.w431.v1';

const freeze = (value) => Object.freeze(value);
const QUALITY_SET = new Set(['lite', 'balanced', 'cinematic']);
const MAX_FRAME_MS = 100;
const MAX_HISTORY = 12;

const POLICY = freeze({
  lite: freeze({ warmupSamples: 150, warmupAverageMs: 48, sustainedSamples: 300, sustainedAverageMs: 52, stutterWindow: 90, stutterFrameMs: 68, stutterLimit: 18, canApplyProtection: false }),
  balanced: freeze({ warmupSamples: 150, warmupAverageMs: 36, sustainedSamples: 300, sustainedAverageMs: 40, stutterWindow: 90, stutterFrameMs: 56, stutterLimit: 18, canApplyProtection: true }),
  cinematic: freeze({ warmupSamples: 150, warmupAverageMs: 32, sustainedSamples: 300, sustainedAverageMs: 37, stutterWindow: 90, stutterFrameMs: 50, stutterLimit: 15, canApplyProtection: true })
});

function safeQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return QUALITY_SET.has(quality) ? quality : 'balanced';
}

function cleanFrame(value) {
  const frame = Number(value);
  return Number.isFinite(frame) && frame >= 0 ? Math.min(MAX_FRAME_MS, frame) : null;
}

function average(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function boundedHistory(history = []) {
  return history.slice(-MAX_HISTORY).map((entry) => freeze({ ...entry }));
}

export function getCityQualityGovernorPolicy(quality = 'balanced') {
  const resolvedQuality = safeQuality(quality);
  return freeze({ quality: resolvedQuality, ...POLICY[resolvedQuality] });
}

export function createCityQualityGovernor({ quality = 'balanced', now = () => Date.now() } = {}) {
  const resolvedQuality = safeQuality(quality);
  const policy = POLICY[resolvedQuality];
  const frames = [];
  const stutterFrames = [];
  let state = 'monitoring';
  let protectionApplied = false;
  let safeModeRecommended = false;
  let reason = null;
  let appliedAt = null;
  let contextLost = false;
  let hidden = false;
  let history = [];

  const addHistory = (event, detail = '') => {
    history = boundedHistory([...history, { event, detail: String(detail || '').slice(0, 80), at: Number(now()) || Date.now() }]);
  };

  const snapshot = () => {
    const warmup = frames.slice(0, policy.warmupSamples);
    const sustained = frames.slice(-policy.sustainedSamples);
    return freeze({
      schema: EON_CITY_QUALITY_GOVERNOR_SCHEMA,
      quality: resolvedQuality,
      state,
      policy: freeze({ ...policy }),
      frameSamples: frames.length,
      warmupAverageMs: warmup.length ? Math.round(average(warmup) * 100) / 100 : null,
      sustainedAverageMs: sustained.length ? Math.round(average(sustained) * 100) / 100 : null,
      recentStutterCount: stutterFrames.length,
      protectionApplied,
      safeModeRecommended,
      contextLost,
      hidden,
      reason,
      appliedAt,
      history: freeze(history.map((entry) => freeze({ ...entry }))),
      localOnly: true,
      persistence: 'memory-only',
      remoteTelemetry: false,
      changesSavedPreference: false,
      changesUserData: false,
      automaticNavigation: false
    });
  };

  const recommend = (nextReason, action) => {
    const requestsSafeMode = action === 'recommend-safe-mode';
    if (requestsSafeMode ? safeModeRecommended : (state === 'protection-active' || state === 'safe-mode-recommended')) return null;
    reason = nextReason;
    state = requestsSafeMode ? 'safe-mode-recommended' : 'protection-recommended';
    safeModeRecommended = requestsSafeMode;
    addHistory(state, nextReason);
    return freeze({ action, reason: nextReason, snapshot: snapshot() });
  };

  const recordFrame = (frameMs) => {
    const frame = cleanFrame(frameMs);
    if (frame === null || hidden || contextLost) return freeze({ accepted: false, decision: null, snapshot: snapshot() });
    frames.push(frame);
    if (frames.length > policy.sustainedSamples) frames.shift();
    stutterFrames.push(frame > policy.stutterFrameMs ? 1 : 0);
    if (stutterFrames.length > policy.stutterWindow) stutterFrames.shift();
    let decision = null;
    if (!protectionApplied && policy.canApplyProtection) {
      if (frames.length >= policy.warmupSamples && average(frames.slice(0, policy.warmupSamples)) > policy.warmupAverageMs) {
        decision = recommend(`warmup-average-over-${policy.warmupAverageMs}ms`, 'apply-protection');
      } else if (frames.length >= policy.sustainedSamples && average(frames.slice(-policy.sustainedSamples)) > policy.sustainedAverageMs) {
        decision = recommend(`sustained-average-over-${policy.sustainedAverageMs}ms`, 'apply-protection');
      } else if (stutterFrames.length >= policy.stutterWindow && stutterFrames.reduce((total, item) => total + item, 0) >= policy.stutterLimit) {
        decision = recommend(`stutter-burst-over-${policy.stutterLimit}-frames`, 'apply-protection');
      }
    } else if (protectionApplied && !safeModeRecommended && frames.length >= policy.sustainedSamples && average(frames.slice(-policy.sustainedSamples)) > policy.sustainedAverageMs * 1.16) {
      decision = recommend('sustained-performance-after-protection', 'recommend-safe-mode');
    }
    return freeze({ accepted: true, decision, snapshot: snapshot() });
  };

  return freeze({
    recordFrame,
    markProtectionApplied(nextReason = reason || 'manual-local-protection') {
      if (protectionApplied) return snapshot();
      protectionApplied = true;
      state = 'protection-active';
      reason = String(nextReason || 'manual-local-protection').slice(0, 80);
      appliedAt = Number(now()) || Date.now();
      addHistory('protection-active', reason);
      return snapshot();
    },
    recordContextLoss() {
      contextLost = true;
      safeModeRecommended = true;
      state = 'safe-mode-recommended';
      reason = 'webgl-context-lost';
      addHistory('safe-mode-recommended', reason);
      return snapshot();
    },
    setVisibility(nextHidden = false) {
      hidden = Boolean(nextHidden);
      addHistory(hidden ? 'visibility-hidden' : 'visibility-visible');
      return snapshot();
    },
    getSnapshot: snapshot,
    clearSession() {
      frames.splice(0, frames.length);
      stutterFrames.splice(0, stutterFrames.length);
      state = 'monitoring';
      protectionApplied = false;
      safeModeRecommended = false;
      reason = null;
      appliedAt = null;
      contextLost = false;
      hidden = false;
      history = [];
      return snapshot();
    }
  });
}

export function getCityQualityGovernorTruth() {
  return freeze({
    schema: EON_CITY_QUALITY_GOVERNOR_SCHEMA,
    localOnly: true,
    persistence: 'memory-only',
    remoteTelemetry: false,
    modifiesSavedVisualPreference: false,
    modifiesUserData: false,
    automaticRouteChange: false,
    automaticSafeModeRestart: false,
    deviceCertificationCreated: false,
    finalPerformanceClaim: false
  });
}
