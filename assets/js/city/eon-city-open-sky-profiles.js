/**
 * W574 — source-controlled open-sky visual profiles.
 *
 * These are session-selected visual styles for Command Horizon. They never
 * inspect a wall clock, forecast, calendar, network feed, device data, or
 * saved preference. The caller supplies only an allowlisted profile id.
 */
export const EON_CITY_OPEN_SKY_SCHEMA = 'eon.city.open-sky.w574.v1';
export const EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID = 'violet-dusk';

const freeze = (value) => Object.freeze(value);
const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const VALID_PROFILE_ID = /^[a-z][a-z0-9-]{2,31}$/;

const QUALITY_LAYER_BUDGETS = freeze({
  lite: 0,
  balanced: 1,
  cinematic: 2
});

const PROFILE_BLUEPRINTS = freeze([
  freeze({
    id: 'dawn-glass',
    label: 'Dawn Glass',
    summary: 'pale cyan horizon with a calm glass halo',
    sky: freeze({ clearColor: '#173653', shellColor: '#6bc5eb', fogColor: '#1a3b57', fogDensity: 0.013 }),
    lighting: freeze({ ambientColor: '#243f61', hemiColor: '#b9edff', groundColor: '#0b1b2b', keyColor: '#d7f5ff', keyIntensity: 1.18, glowIntensity: 0.28, keyDirection: freeze([-0.38, -1, 0.28]) }),
    layers: freeze([
      freeze({ id: 'dawn-glass-band', type: 'horizon-band', color: '#78e5ff', alpha: 0.16, height: 7.8, diameter: 31, rotationStep: 0.0018 }),
      freeze({ id: 'dawn-glass-arc', type: 'upper-arc', color: '#d5f7ff', alpha: 0.09, height: 10.2, diameter: 22, rotationStep: -0.0012 })
    ])
  }),
  freeze({
    id: 'clear-horizon',
    label: 'Clear Horizon',
    summary: 'neutral blue skyline with low visual contrast',
    sky: freeze({ clearColor: '#162d48', shellColor: '#5f9fd1', fogColor: '#19314c', fogDensity: 0.014 }),
    lighting: freeze({ ambientColor: '#253b58', hemiColor: '#b0ccf0', groundColor: '#0b1727', keyColor: '#cce0ff', keyIntensity: 1.08, glowIntensity: 0.24, keyDirection: freeze([-0.42, -1, 0.34]) }),
    layers: freeze([
      freeze({ id: 'clear-horizon-band', type: 'horizon-band', color: '#78aee8', alpha: 0.14, height: 7.6, diameter: 30, rotationStep: 0.0013 }),
      freeze({ id: 'clear-horizon-arc', type: 'upper-arc', color: '#c7dcf5', alpha: 0.07, height: 10.4, diameter: 21, rotationStep: -0.0009 })
    ])
  }),
  freeze({
    id: 'violet-dusk',
    label: 'Violet Dusk',
    summary: 'deep violet horizon with the Command Horizon neon palette',
    sky: freeze({ clearColor: '#1d1d42', shellColor: '#8266c7', fogColor: '#28244b', fogDensity: 0.015 }),
    lighting: freeze({ ambientColor: '#312b5f', hemiColor: '#b6a6ff', groundColor: '#12142c', keyColor: '#e0d3ff', keyIntensity: 1.15, glowIntensity: 0.31, keyDirection: freeze([-0.45, -1, 0.35]) }),
    layers: freeze([
      freeze({ id: 'violet-dusk-band', type: 'horizon-band', color: '#b58cff', alpha: 0.18, height: 7.9, diameter: 32, rotationStep: 0.0021 }),
      freeze({ id: 'violet-dusk-arc', type: 'upper-arc', color: '#75e5ff', alpha: 0.1, height: 10.3, diameter: 23, rotationStep: -0.0014 })
    ])
  }),
  freeze({
    id: 'signal-storm',
    label: 'Signal Storm',
    summary: 'high-contrast indigo signal arcs without weather semantics',
    sky: freeze({ clearColor: '#181a36', shellColor: '#6356a9', fogColor: '#242645', fogDensity: 0.016 }),
    lighting: freeze({ ambientColor: '#292955', hemiColor: '#9b91e8', groundColor: '#0b1021', keyColor: '#c5c0ff', keyIntensity: 1.22, glowIntensity: 0.36, keyDirection: freeze([-0.32, -1, 0.42]) }),
    layers: freeze([
      freeze({ id: 'signal-storm-band', type: 'horizon-band', color: '#7664d8', alpha: 0.19, height: 7.7, diameter: 31, rotationStep: 0.0025 }),
      freeze({ id: 'signal-storm-arc', type: 'upper-arc', color: '#78f0ff', alpha: 0.11, height: 10.5, diameter: 22, rotationStep: -0.0017 })
    ])
  })
]);

function normalizedQuality(quality = 'balanced') {
  return VALID_QUALITY.has(String(quality)) ? String(quality) : 'balanced';
}

export function normalizeEonCityOpenSkyProfileId(profileId = '') {
  const candidate = String(profileId || '').trim().toLowerCase();
  return PROFILE_BLUEPRINTS.some((profile) => profile.id === candidate) ? candidate : EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID;
}

function selectProfile(profileId = '') {
  const id = normalizeEonCityOpenSkyProfileId(profileId);
  return PROFILE_BLUEPRINTS.find((profile) => profile.id === id) || PROFILE_BLUEPRINTS[0];
}

function cloneProfile(profile) {
  return freeze({
    id: profile.id,
    label: profile.label,
    summary: profile.summary,
    visualStyleOnly: true,
    realWorldTime: false,
    realWorldWeather: false,
    forecast: false,
    saved: false
  });
}

function cloneSky(sky, staticFallback) {
  return freeze({
    clearColor: sky.clearColor,
    shellColor: sky.shellColor,
    fogColor: sky.fogColor,
    fogDensity: sky.fogDensity,
    staticFallback: Boolean(staticFallback)
  });
}

function cloneLighting(lighting) {
  return freeze({
    ambientColor: lighting.ambientColor,
    hemiColor: lighting.hemiColor,
    groundColor: lighting.groundColor,
    keyColor: lighting.keyColor,
    keyIntensity: lighting.keyIntensity,
    glowIntensity: lighting.glowIntensity,
    keyDirection: freeze([...lighting.keyDirection])
  });
}

function cloneLayers(profile, count, motionEnabled) {
  return freeze(profile.layers.slice(0, count).map((layer) => freeze({
    id: layer.id,
    type: layer.type,
    color: layer.color,
    alpha: layer.alpha,
    height: layer.height,
    diameter: layer.diameter,
    rotationStep: layer.rotationStep,
    animated: Boolean(motionEnabled),
    localVisualOnly: true,
    interactive: false
  })));
}

function motionStateFor(quality, { paused = false, reducedEffects = false } = {}) {
  if (paused) return 'city-paused';
  if (reducedEffects) return 'reduced-effects';
  if (quality === 'lite') return 'quality-lite';
  return 'animated';
}

function exactKeys(value, keys) {
  return Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
}

function finiteBetween(value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function validColor(value) {
  return HEX_COLOR.test(String(value || ''));
}

/** Returns a finite local visual plan; no system state, storage, or external signal is read. */
export function getEonCityOpenSkyProfilePlan({ quality = 'balanced', profileId = EON_CITY_OPEN_SKY_DEFAULT_PROFILE_ID, paused = false, reducedEffects = false } = {}) {
  const resolvedQuality = normalizedQuality(quality);
  const profile = selectProfile(profileId);
  const motionState = motionStateFor(resolvedQuality, { paused: Boolean(paused), reducedEffects: Boolean(reducedEffects) });
  const staticFallback = motionState !== 'animated';
  const layerCount = staticFallback ? 0 : QUALITY_LAYER_BUDGETS[resolvedQuality];
  return freeze({
    schema: EON_CITY_OPEN_SKY_SCHEMA,
    quality: resolvedQuality,
    profile: cloneProfile(profile),
    sky: cloneSky(profile.sky, staticFallback),
    lighting: cloneLighting(profile.lighting),
    atmosphereLayers: cloneLayers(profile, layerCount, motionState === 'animated'),
    motionEnabled: motionState === 'animated',
    motionState,
    localVisualOnly: true,
    sourceControlled: true,
    sessionOnly: true,
    proceduralGeometry: true,
    binaryAssets: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userData: false,
    readsDeviceClock: false,
    realWorldWeather: false,
    realWorldCalendar: false,
    notificationRequested: false,
    soundRequested: false,
    voiceRequested: false,
    storageRequested: false,
    workloadJobStarted: false,
    interactive: false,
    autonomous: false,
    commercial: false
  });
}

export function getEonCityOpenSkyProfileOptions() {
  return freeze(PROFILE_BLUEPRINTS.map((profile) => freeze({
    id: profile.id,
    label: profile.label,
    summary: profile.summary,
    sourceControlled: true,
    sessionOnly: true,
    visualStyleOnly: true
  })));
}

export function validateEonCityOpenSkyProfilePlan(plan = {}) {
  const errors = [];
  const value = plan && typeof plan === 'object' ? plan : {};
  const expectedLayerCount = value.motionState === 'animated' ? QUALITY_LAYER_BUDGETS[normalizedQuality(value.quality)] : 0;
  const allowedPlanKeys = ['schema', 'quality', 'profile', 'sky', 'lighting', 'atmosphereLayers', 'motionEnabled', 'motionState', 'localVisualOnly', 'sourceControlled', 'sessionOnly', 'proceduralGeometry', 'binaryAssets', 'remoteAssets', 'remoteTelemetry', 'userData', 'readsDeviceClock', 'realWorldWeather', 'realWorldCalendar', 'notificationRequested', 'soundRequested', 'voiceRequested', 'storageRequested', 'workloadJobStarted', 'interactive', 'autonomous', 'commercial'];
  if (!exactKeys(value, allowedPlanKeys)) errors.push('plan-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_OPEN_SKY_SCHEMA || !VALID_QUALITY.has(value.quality)) errors.push('plan-schema-or-quality-invalid');
  if (!exactKeys(value.profile, ['id', 'label', 'summary', 'visualStyleOnly', 'realWorldTime', 'realWorldWeather', 'forecast', 'saved']) || !VALID_PROFILE_ID.test(String(value.profile?.id || '')) || !PROFILE_BLUEPRINTS.some((entry) => entry.id === value.profile?.id) || value.profile?.visualStyleOnly !== true || value.profile?.realWorldTime !== false || value.profile?.realWorldWeather !== false || value.profile?.forecast !== false || value.profile?.saved !== false) errors.push('profile-boundary-invalid');
  if (!exactKeys(value.sky, ['clearColor', 'shellColor', 'fogColor', 'fogDensity', 'staticFallback']) || ![value.sky?.clearColor, value.sky?.shellColor, value.sky?.fogColor].every(validColor) || !finiteBetween(value.sky?.fogDensity, 0.005, 0.03) || typeof value.sky?.staticFallback !== 'boolean') errors.push('sky-invalid');
  if (!exactKeys(value.lighting, ['ambientColor', 'hemiColor', 'groundColor', 'keyColor', 'keyIntensity', 'glowIntensity', 'keyDirection']) || ![value.lighting?.ambientColor, value.lighting?.hemiColor, value.lighting?.groundColor, value.lighting?.keyColor].every(validColor) || !finiteBetween(value.lighting?.keyIntensity, 0.7, 1.5) || !finiteBetween(value.lighting?.glowIntensity, 0, 0.5) || !Array.isArray(value.lighting?.keyDirection) || value.lighting.keyDirection.length !== 3 || !value.lighting.keyDirection.every((entry) => finiteBetween(entry, -1.5, 1.5))) errors.push('lighting-invalid');
  if (!Array.isArray(value.atmosphereLayers) || value.atmosphereLayers.length !== expectedLayerCount || value.atmosphereLayers.length > QUALITY_LAYER_BUDGETS.cinematic) errors.push('atmosphere-budget-invalid');
  for (const layer of value.atmosphereLayers || []) {
    if (!exactKeys(layer, ['id', 'type', 'color', 'alpha', 'height', 'diameter', 'rotationStep', 'animated', 'localVisualOnly', 'interactive']) || !VALID_PROFILE_ID.test(String(layer.id || '')) || !['horizon-band', 'upper-arc'].includes(layer.type) || !validColor(layer.color) || !finiteBetween(layer.alpha, 0.03, 0.25) || !finiteBetween(layer.height, 5, 12) || !finiteBetween(layer.diameter, 16, 40) || !finiteBetween(layer.rotationStep, -0.005, 0.005) || layer.animated !== true || layer.localVisualOnly !== true || layer.interactive !== false) errors.push('atmosphere-layer-invalid');
  }
  const expectedMotion = value.motionState === 'animated';
  if (value.motionEnabled !== expectedMotion || value.sky?.staticFallback !== !expectedMotion || !['animated', 'city-paused', 'reduced-effects', 'quality-lite'].includes(value.motionState)) errors.push('motion-state-invalid');
  const requiredFalse = ['binaryAssets', 'remoteAssets', 'remoteTelemetry', 'userData', 'readsDeviceClock', 'realWorldWeather', 'realWorldCalendar', 'notificationRequested', 'soundRequested', 'voiceRequested', 'storageRequested', 'workloadJobStarted', 'interactive', 'autonomous', 'commercial'];
  if (value.localVisualOnly !== true || value.sourceControlled !== true || value.sessionOnly !== true || value.proceduralGeometry !== true || requiredFalse.some((key) => value[key] !== false)) errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonCityOpenSkyTruth(input = {}) {
  const plan = getEonCityOpenSkyProfilePlan(input);
  const validation = validateEonCityOpenSkyProfilePlan(plan);
  return freeze({
    schema: EON_CITY_OPEN_SKY_SCHEMA,
    valid: validation.ok,
    quality: plan.quality,
    profileId: plan.profile.id,
    localVisualOnly: plan.localVisualOnly,
    sourceControlled: plan.sourceControlled,
    sessionOnly: plan.sessionOnly,
    proceduralGeometry: plan.proceduralGeometry,
    binaryAssets: plan.binaryAssets,
    remoteAssets: plan.remoteAssets,
    remoteTelemetry: plan.remoteTelemetry,
    userData: plan.userData,
    readsDeviceClock: plan.readsDeviceClock,
    realWorldWeather: plan.realWorldWeather,
    realWorldCalendar: plan.realWorldCalendar,
    notificationRequested: plan.notificationRequested,
    soundRequested: plan.soundRequested,
    voiceRequested: plan.voiceRequested,
    storageRequested: plan.storageRequested,
    workloadJobStarted: plan.workloadJobStarted,
    interactive: plan.interactive,
    autonomous: plan.autonomous,
    commercial: plan.commercial,
    motionState: plan.motionState,
    validationErrors: validation.errors
  });
}
