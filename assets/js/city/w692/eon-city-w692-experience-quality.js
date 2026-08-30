/**
 * W692 — Focus/Explore, performance, mobile, accessibility and visual-polish
 * authority for the final N3+C3 local candidate.
 *
 * The resolver is deterministic and local. It never requests permissions,
 * changes routes, begins work or silently upgrades quality. The frame governor
 * can only recommend bounded degradation after sustained evidence and requires
 * explicit user action to return to a higher tier.
 */

export const EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA = 'eon.city.experience-quality.w692.v1';
const freeze = (value) => Object.freeze(value);
const QUALITY_ORDER = freeze(['lite', 'balanced', 'cinematic']);
const MODES = freeze(['focus', 'explore']);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function normalizeQuality(value = 'balanced') {
  return QUALITY_ORDER.includes(String(value)) ? String(value) : 'balanced';
}

function normalizeMode(value = 'explore') {
  return MODES.includes(String(value)) ? String(value) : 'explore';
}

export function resolveEonCityW692ExperienceProfile({
  mode = 'explore', quality = 'balanced', reducedMotion = false, saveData = false,
  touch = false, viewportWidth = 1366, viewportHeight = 768, deviceMemory = 8,
  hardwareConcurrency = 8, highContrast = false, textScale = 1, screenReader = false
} = {}) {
  const resolvedMode = normalizeMode(mode);
  let resolvedQuality = normalizeQuality(quality);
  const width = Math.max(240, Number(viewportWidth) || 1366);
  const height = Math.max(240, Number(viewportHeight) || 768);
  const memory = Math.max(0, Number(deviceMemory) || 0);
  const cores = Math.max(1, Number(hardwareConcurrency) || 1);
  const mobile = width < 820 || Boolean(touch && width < 1024);
  const portrait = height > width;
  const constrained = Boolean(saveData || memory > 0 && memory <= 4 || cores <= 4 || mobile && width < 480);
  if (constrained && resolvedQuality === 'cinematic') resolvedQuality = 'balanced';
  if (saveData || memory > 0 && memory <= 2 || cores <= 2) resolvedQuality = 'lite';
  const motionEnabled = !reducedMotion && resolvedQuality !== 'lite';
  const explorationEnabled = resolvedMode === 'explore';
  const densityMultiplier = resolvedQuality === 'lite' ? 0.5 : resolvedQuality === 'cinematic' ? 1.25 : 1;
  const modeMultiplier = resolvedMode === 'focus' ? 0.62 : 1;
  const ambientPopulationMultiplier = Number((densityMultiplier * modeMultiplier).toFixed(2));
  const minimumTouchTargetPx = 48;
  const resolvedTextScale = Number(clamp(Number(textScale) || 1, 1, 1.6).toFixed(2));
  return freeze({
    schema: EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA,
    mode: resolvedMode,
    quality: resolvedQuality,
    mobile,
    portrait,
    touch: Boolean(touch),
    constrained,
    reducedMotion: Boolean(reducedMotion),
    highContrast: Boolean(highContrast),
    screenReader: Boolean(screenReader),
    textScale: resolvedTextScale,
    motionEnabled,
    explorationEnabled,
    directWorkPriority: resolvedMode === 'focus',
    discoveriesVisible: explorationEnabled,
    ambientPopulationMultiplier,
    decorativeMotionBudget: motionEnabled ? (resolvedMode === 'focus' ? 1 : resolvedQuality === 'cinematic' ? 3 : 2) : 0,
    particleBudget: motionEnabled ? (resolvedQuality === 'cinematic' ? 140 : 70) : 0,
    realmTowerBudget: resolvedQuality === 'lite' ? 6 : resolvedQuality === 'cinematic' ? 12 : 9,
    residentCellRadius: 2,
    interactiveCellRadius: 1,
    minimumTouchTargetPx,
    panelLayout: mobile ? 'bottom-sheet' : 'side-panel',
    portraitSafeLayout: true,
    landscapeEnhancedLayout: mobile,
    keyboardNavigation: true,
    visibleFocusRing: true,
    ariaLiveStatus: true,
    colorNeverSoleSignal: true,
    captionsForVoiceState: true,
    focusModeKeepsFastTravel: true,
    exploreModeKeepsDirectActions: true,
    essentialFeatureRequiresExploration: false,
    cameraPermissionAutomatic: false,
    qualityUpgradeAutomatic: false,
    automaticNavigation: false,
    automaticExecution: false,
    networkRequestCreated: false
  });
}

export function createEonCityW692FrameGovernor({
  initialQuality = 'balanced', sampleWindow = 120, badFrameMs = 28, criticalFrameMs = 42,
  sustainedBadRatio = 0.3, now = () => Date.now()
} = {}) {
  let quality = normalizeQuality(initialQuality);
  const samples = [];
  const recommendations = [];
  let longTaskCount = 0;
  let memoryWarningCount = 0;
  const addSample = (frameMs) => {
    const value = clamp(Number(frameMs) || 0, 0, 1000);
    samples.push(value);
    if (samples.length > Math.max(30, Number(sampleWindow) || 120)) samples.shift();
    return value;
  };
  const snapshot = () => {
    const averageFrameMs = samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
    const badRatio = samples.length ? samples.filter((value) => value >= badFrameMs).length / samples.length : 0;
    const criticalRatio = samples.length ? samples.filter((value) => value >= criticalFrameMs).length / samples.length : 0;
    return freeze({
      schema: `${EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA}.frame-governor.v1`,
      quality,
      sampleCount: samples.length,
      averageFrameMs: Number(averageFrameMs.toFixed(2)),
      badFrameRatio: Number(badRatio.toFixed(3)),
      criticalFrameRatio: Number(criticalRatio.toFixed(3)),
      longTaskCount,
      memoryWarningCount,
      recommendations: freeze([...recommendations]),
      automaticQualityUpgrade: false,
      automaticRouteChange: false,
      automaticExecution: false
    });
  };
  const recommend = (reason) => {
    if (quality === 'lite') return freeze({ ok: false, reason: 'already-lite', snapshot: snapshot() });
    const nextQuality = quality === 'cinematic' ? 'balanced' : 'lite';
    const existing = recommendations.find((entry) => entry.nextQuality === nextQuality && entry.reason === reason);
    if (!existing) recommendations.push(freeze({ id: `quality-${nextQuality}-${recommendations.length + 1}`, reason, currentQuality: quality, nextQuality, createdAt: Number(now()) || 0, requiresExplicitUserAction: true }));
    return freeze({ ok: true, recommended: true, nextQuality, reason, snapshot: snapshot() });
  };
  return freeze({
    recordFrame(frameMs = 0) {
      addSample(frameMs);
      const state = snapshot();
      if (state.sampleCount >= 60 && (state.badFrameRatio >= sustainedBadRatio || state.criticalFrameRatio >= 0.12)) return recommend('sustained-frame-pressure');
      return freeze({ ok: true, recommended: false, snapshot: state });
    },
    recordLongTask(durationMs = 0) {
      if (Number(durationMs) >= 50) longTaskCount += 1;
      if (longTaskCount >= 4) return recommend('repeated-long-tasks');
      return freeze({ ok: true, recommended: false, snapshot: snapshot() });
    },
    recordMemory({ used = 0, limit = 0 } = {}) {
      const ratio = Number(limit) > 0 ? Number(used) / Number(limit) : 0;
      if (ratio >= 0.82) memoryWarningCount += 1;
      if (memoryWarningCount >= 3) return recommend('sustained-memory-pressure');
      return freeze({ ok: true, recommended: false, snapshot: snapshot() });
    },
    applyRecommendation(nextQuality = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', snapshot: snapshot() });
      const requested = normalizeQuality(nextQuality);
      const currentIndex = QUALITY_ORDER.indexOf(quality);
      const requestedIndex = QUALITY_ORDER.indexOf(requested);
      if (requestedIndex >= currentIndex) return freeze({ ok: false, reason: 'governor-only-applies-lower-quality', snapshot: snapshot() });
      quality = requested;
      recommendations.length = 0;
      samples.length = 0;
      longTaskCount = 0;
      memoryWarningCount = 0;
      return freeze({ ok: true, quality, snapshot: snapshot() });
    },
    getSnapshot: snapshot
  });
}

export function validateEonCityW692ExperienceProfile(profile = {}) {
  const errors = [];
  if (profile.schema !== EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA) errors.push('schema-invalid');
  if (!MODES.includes(profile.mode) || !QUALITY_ORDER.includes(profile.quality)) errors.push('mode-or-quality-invalid');
  if (profile.residentCellRadius !== 2 || profile.interactiveCellRadius !== 1) errors.push('streaming-contract-invalid');
  if (profile.minimumTouchTargetPx < 44 || !profile.portraitSafeLayout || !profile.keyboardNavigation || !profile.visibleFocusRing || !profile.ariaLiveStatus || !profile.colorNeverSoleSignal) errors.push('accessibility-invalid');
  if (!profile.focusModeKeepsFastTravel || !profile.exploreModeKeepsDirectActions || profile.essentialFeatureRequiresExploration) errors.push('mode-parity-invalid');
  if (profile.cameraPermissionAutomatic || profile.qualityUpgradeAutomatic || profile.automaticNavigation || profile.automaticExecution || profile.networkRequestCreated) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), mode: profile.mode, quality: profile.quality });
}

export function getEonCityW692Truth() {
  return freeze({
    schema: EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA,
    focusAndExploreParity: true,
    mobilePortraitSafe: true,
    reducedMotionFunctional: true,
    performanceDowngradeRequiresEvidenceAndConfirmation: true,
    automaticQualityUpgrade: false,
    essentialFeatureRequiresExploration: false,
    cameraPermissionAutomatic: false,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export default freeze({
  EON_CITY_W692_EXPERIENCE_QUALITY_SCHEMA,
  resolveEonCityW692ExperienceProfile,
  createEonCityW692FrameGovernor,
  validateEonCityW692ExperienceProfile,
  getEonCityW692Truth
});
