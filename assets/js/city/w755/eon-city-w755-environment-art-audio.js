/**
 * W755 — Living Circuit Citadel environment, final art and truthful local audio authority.
 *
 * This module composes the active W731 station map with the maintained material and
 * procedural soundscape policies. It never claims real weather, downloads remote
 * ambience, starts audio automatically or creates another Babylon scene/engine.
 */
import { EON_CITY_W731_STATIONS } from '../w731/eon-city-w731-command-hub-contract.js';
import { CITY_MATERIAL_FAMILIES, getCityMaterialProfile } from '../eon-city-material-policy.js';
import {
  CITY_SOUNDSCAPE_DEFAULTS,
  createCityAdaptiveSoundscape,
  normalizeCitySoundscapePreferences
} from '../eon-city-adaptive-soundscape.js';

export const EON_CITY_W755_SCHEMA = 'eon.city.environment-art-audio.w755.v1';
export const EON_CITY_W755_TIME_PROFILES = Object.freeze(['dawn', 'day', 'dusk', 'night']);
export const EON_CITY_W755_WEATHER_PROFILES = Object.freeze(['clear', 'mist', 'rain']);
export const EON_CITY_W755_DEFAULT_TIME = 'dusk';
export const EON_CITY_W755_DEFAULT_WEATHER = 'clear';

const freeze = (value) => Object.freeze(value);
const QUALITY = new Set(['lite', 'balanced', 'cinematic']);

const QUALITY_BUDGETS = freeze({
  lite: freeze({ skyline: freeze({ near: 10, mid: 10, far: 8 }), weatherParticles: 0, trafficSignals: 4, reflectionCues: 0, contactShadowTier: 'static', glassSegments: 6, puddleCues: 0 }),
  balanced: freeze({ skyline: freeze({ near: 14, mid: 18, far: 18 }), weatherParticles: 28, trafficSignals: 8, reflectionCues: 8, contactShadowTier: 'bounded-dynamic', glassSegments: 10, puddleCues: 8 }),
  cinematic: freeze({ skyline: freeze({ near: 18, mid: 24, far: 30 }), weatherParticles: 54, trafficSignals: 14, reflectionCues: 12, contactShadowTier: 'hero-dynamic', glassSegments: 14, puddleCues: 12 })
});

const TIME = freeze({
  dawn: freeze({ label: 'Dawn', clear: '#172b3a', fog: '#274353', ambient: '#315365', hemi: '#c7e8ee', ground: '#0b171c', key: '#f1d7ad', keyIntensity: 0.78, exposure: 1.08, contrast: 1.06 }),
  day: freeze({ label: 'Clear day', clear: '#17394e', fog: '#2a5362', ambient: '#355b68', hemi: '#d5f2f3', ground: '#102027', key: '#f6e7c8', keyIntensity: 0.92, exposure: 1.13, contrast: 1.04 }),
  dusk: freeze({ label: 'Violet dusk', clear: '#151529', fog: '#28243d', ambient: '#342d51', hemi: '#c9b9e9', ground: '#0a0d16', key: '#e7c992', keyIntensity: 0.76, exposure: 1.06, contrast: 1.1 }),
  night: freeze({ label: 'Signal night', clear: '#070a12', fog: '#101722', ambient: '#192533', hemi: '#9bbfca', ground: '#030509', key: '#90d8d2', keyIntensity: 0.58, exposure: 1.02, contrast: 1.13 })
});

const WEATHER = freeze({
  clear: freeze({ label: 'Clear ambience', fogMultiplier: 0.72, particles: false, puddles: false, audioCue: 'command-room', readabilityMultiplier: 1 }),
  mist: freeze({ label: 'Mist ambience', fogMultiplier: 1.28, particles: false, puddles: true, audioCue: 'mist', readabilityMultiplier: 0.96 }),
  rain: freeze({ label: 'Rain ambience', fogMultiplier: 1.02, particles: true, puddles: true, audioCue: 'rain', readabilityMultiplier: 0.94 })
});

function qualityId(value = 'balanced') {
  const id = String(value || '').toLowerCase();
  return QUALITY.has(id) ? id : 'balanced';
}

function timeId(value = EON_CITY_W755_DEFAULT_TIME) {
  const id = String(value || '').toLowerCase();
  return EON_CITY_W755_TIME_PROFILES.includes(id) ? id : EON_CITY_W755_DEFAULT_TIME;
}

function weatherId(value = EON_CITY_W755_DEFAULT_WEATHER) {
  const id = String(value || '').toLowerCase();
  return EON_CITY_W755_WEATHER_PROFILES.includes(id) ? id : EON_CITY_W755_DEFAULT_WEATHER;
}

export function resolveEonCityW755LocalTimeProfile(date = new Date()) {
  const hour = Number(date?.getHours?.());
  if (!Number.isFinite(hour)) return EON_CITY_W755_DEFAULT_TIME;
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

function stationSocket(station, index) {
  const position = freeze({ x: Number(station.position?.x || 0), y: 0.12, z: Number(station.position?.z || 0) });
  return freeze({
    id: `socket:${station.id}`,
    stationId: station.id,
    label: station.label,
    position,
    radius: station.ring === 'inner' ? 2.25 : 1.85,
    address: index + 1,
    accent: String(station.accent || station.color || '#78e6d7'),
    unique: true,
    interactiveStructure: false
  });
}

function busForSocket(socket) {
  const distance = Math.max(0.001, Math.hypot(socket.position.x, socket.position.z));
  return freeze({
    id: `bus:${socket.stationId}`,
    stationId: socket.stationId,
    from: freeze({ x: 0, y: 0.055, z: 0.8 }),
    to: freeze({ x: socket.position.x * 0.86, y: 0.055, z: socket.position.z * 0.86 }),
    length: Number(distance.toFixed(3)),
    walkingWidth: 1.65,
    signalWidth: 0.1,
    raisedMetallic: true,
    controlledEmissive: true,
    impliesUnavailablePath: false
  });
}

export function buildEonCityW755EnvironmentPlan({
  quality = 'balanced',
  timeProfile = EON_CITY_W755_DEFAULT_TIME,
  weatherProfile = EON_CITY_W755_DEFAULT_WEATHER,
  reducedEffects = false,
  reducedSensory = false
} = {}) {
  const resolvedQuality = qualityId(quality);
  const resolvedTime = timeId(timeProfile);
  const resolvedWeather = weatherId(weatherProfile);
  const budget = QUALITY_BUDGETS[resolvedQuality];
  const time = TIME[resolvedTime];
  const weather = WEATHER[resolvedWeather];
  const effectsReduced = Boolean(reducedEffects);
  const sensoryReduced = Boolean(reducedSensory);
  const sockets = EON_CITY_W731_STATIONS.map(stationSocket);
  const buses = sockets.map(busForSocket);
  const floor = freeze({
    identity: 'motherboard-command-floor',
    centralSocket: freeze({ id: 'socket:living-nexus-core', x: 0, y: 0.14, z: 0.8, radius: 4.4 }),
    sockets: freeze(sockets),
    buses: freeze(buses),
    stationSocketCount: sockets.length,
    busCount: buses.length,
    allStationsConnected: sockets.length === EON_CITY_W731_STATIONS.length && buses.length === EON_CITY_W731_STATIONS.length,
    widerWalkingRoutesThanSignals: buses.every((entry) => entry.walkingWidth > entry.signalWidth * 8),
    randomCrossings: false,
    graphitePbrBase: true,
    embeddedLabels: true
  });
  const skyline = freeze({
    tiers: freeze([
      freeze({ id: 'near', count: budget.skyline.near, radiusMin: 28, radiusMax: 42, heightMin: 7, heightMax: 17, motion: false }),
      freeze({ id: 'mid', count: budget.skyline.mid, radiusMin: 43, radiusMax: 62, heightMin: 10, heightMax: 24, motion: false }),
      freeze({ id: 'far', count: budget.skyline.far, radiusMin: 63, radiusMax: 92, heightMin: 13, heightMax: 34, motion: !effectsReduced })
    ]),
    total: budget.skyline.near + budget.skyline.mid + budget.skyline.far,
    trafficSignals: effectsReduced ? 0 : budget.trafficSignals,
    noEmptyBlackHorizon: true,
    noReachableUnfinishedRoad: true,
    sameOriginOnly: true
  });
  const lighting = freeze({
    clearColor: time.clear,
    fogColor: time.fog,
    ambientColor: time.ambient,
    hemisphereColor: time.hemi,
    groundColor: time.ground,
    keyColor: time.key,
    keyIntensity: Number((time.keyIntensity * weather.readabilityMultiplier).toFixed(3)),
    exposure: Number((time.exposure * weather.readabilityMultiplier).toFixed(3)),
    contrast: time.contrast,
    fogDensity: Number((0.0048 * weather.fogMultiplier * (resolvedQuality === 'lite' ? 1.08 : 1)).toFixed(5)),
    contactShadowTier: effectsReduced ? 'static' : budget.contactShadowTier,
    reflectionCueCount: effectsReduced ? 0 : budget.reflectionCues,
    controlledBloom: !effectsReduced && resolvedQuality !== 'lite',
    readableFacesAndTerminals: true,
    warningColorsDistinguishable: true
  });
  const weatherPlan = freeze({
    id: resolvedWeather,
    label: weather.label,
    visualAmbienceOnly: true,
    realWeather: false,
    forecast: false,
    geolocation: false,
    particleCount: weather.particles && !effectsReduced ? budget.weatherParticles : 0,
    puddleCueCount: weather.puddles && !effectsReduced ? budget.puddleCues : 0,
    shelterResponse: resolvedWeather === 'rain',
    labelsRemainReadable: true,
    controlsRemainReadable: true
  });
  const materials = freeze({
    policyQuality: resolvedQuality,
    profile: getCityMaterialProfile(resolvedQuality),
    families: freeze(CITY_MATERIAL_FAMILIES.map((entry) => entry.id)),
    pbrHeroSurfaces: freeze(['living-nexus-core', 'motherboard-floor', 'hero-stations', 'transit-capsule']),
    glassStructuralSections: budget.glassSegments,
    megaScreens: 5,
    remoteTextures: false,
    userDataTextures: false
  });
  const audio = freeze({
    channels: freeze(['master', 'ambience', 'effects', 'voice']),
    cues: freeze(['command-room', 'station-hum', 'nexus-state', 'eonbot', 'footsteps', 'transit', 'mission', 'reveal', 'weather']),
    defaultPreferences: normalizeCitySoundscapePreferences({ ...CITY_SOUNDSCAPE_DEFAULTS, ambience: false, ui: false, voice: false, reducedSensory: sensoryReduced }),
    automaticStart: false,
    userGestureRequired: true,
    remoteAudio: false,
    microphone: false,
    suddenHighVolume: false,
    reducedSensory: sensoryReduced
  });
  return freeze({
    schema: EON_CITY_W755_SCHEMA,
    quality: resolvedQuality,
    timeProfile: resolvedTime,
    timeLabel: time.label,
    weatherProfile: resolvedWeather,
    reducedEffects: effectsReduced,
    reducedSensory: sensoryReduced,
    artDirection: 'Living Circuit Citadel',
    floor,
    skyline,
    lighting,
    weather: weatherPlan,
    materials,
    audio,
    oneEngine: true,
    oneScene: true,
    oneRenderLoop: true,
    localOnly: true,
    realWeatherClaim: false,
    automaticAudio: false
  });
}

export function validateEonCityW755EnvironmentPlan(plan = buildEonCityW755EnvironmentPlan()) {
  const errors = [];
  if (plan.schema !== EON_CITY_W755_SCHEMA) errors.push('schema');
  if (plan.floor?.stationSocketCount !== EON_CITY_W731_STATIONS.length) errors.push('station-socket-count');
  if (plan.floor?.busCount !== EON_CITY_W731_STATIONS.length || plan.floor?.allStationsConnected !== true) errors.push('floor-bus-connectivity');
  if (plan.floor?.widerWalkingRoutesThanSignals !== true || plan.floor?.randomCrossings !== false) errors.push('floor-readability');
  if (!Array.isArray(plan.skyline?.tiers) || plan.skyline.tiers.length !== 3 || plan.skyline?.total < 28) errors.push('skyline-tiers');
  if (plan.skyline?.noEmptyBlackHorizon !== true) errors.push('empty-horizon');
  if (plan.weather?.realWeather !== false || plan.weather?.visualAmbienceOnly !== true || plan.realWeatherClaim !== false) errors.push('weather-truth');
  if (plan.lighting?.readableFacesAndTerminals !== true || plan.weather?.labelsRemainReadable !== true) errors.push('readability');
  if (plan.materials?.remoteTextures !== false || plan.materials?.glassStructuralSections < 6) errors.push('materials');
  if (plan.audio?.automaticStart !== false || plan.audio?.userGestureRequired !== true || plan.audio?.remoteAudio !== false) errors.push('audio-consent');
  if (plan.quality === 'lite' && (plan.weather?.particleCount !== 0 || plan.lighting?.reflectionCueCount !== 0)) errors.push('lite-effects-budget');
  if (plan.oneEngine !== true || plan.oneScene !== true || plan.oneRenderLoop !== true) errors.push('runtime-ownership');
  return freeze({ schema: EON_CITY_W755_SCHEMA, ok: errors.length === 0, errors: freeze(errors), plan });
}

export function createEonCityW755EnvironmentController({
  quality = 'balanced',
  timeProfile = EON_CITY_W755_DEFAULT_TIME,
  weatherProfile = EON_CITY_W755_DEFAULT_WEATHER,
  reducedEffects = false,
  reducedSensory = false,
  environment = globalThis,
  onState = () => {}
} = {}) {
  let disposed = false;
  let plan = buildEonCityW755EnvironmentPlan({ quality, timeProfile, weatherProfile, reducedEffects, reducedSensory });
  let soundscape = createCityAdaptiveSoundscape({
    environment,
    preferences: plan.audio.defaultPreferences,
    volume: 0.42,
    onStatus: (message) => onState(freeze({ type: 'audio-status', message, plan }))
  });
  const publish = (type) => {
    const snapshot = freeze({ schema: EON_CITY_W755_SCHEMA, type, disposed, plan, audio: soundscape.getSummary() });
    try { onState(snapshot); } catch {}
    return snapshot;
  };
  const rebuild = (next = {}) => {
    if (disposed) return publish('disposed');
    plan = buildEonCityW755EnvironmentPlan({
      quality: next.quality ?? plan.quality,
      timeProfile: next.timeProfile ?? plan.timeProfile,
      weatherProfile: next.weatherProfile ?? plan.weatherProfile,
      reducedEffects: next.reducedEffects ?? plan.reducedEffects,
      reducedSensory: next.reducedSensory ?? plan.reducedSensory
    });
    soundscape.setPreferences({ ...soundscape.getSummary().preferences, reducedSensory: plan.reducedSensory });
    return publish('environment-updated');
  };
  return freeze({
    schema: EON_CITY_W755_SCHEMA,
    getPlan: () => plan,
    getSnapshot: () => publish('snapshot'),
    setProfile(next = {}, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', plan });
      const snapshot = rebuild(next);
      return freeze({ ok: true, snapshot, visualAmbienceOnly: true, realWeather: false });
    },
    activateAudio({ explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', automaticAudio: false });
      return soundscape.activateFromUserGesture();
    },
    setAudioPreferences(next = {}, { explicitUserAction = false } = {}) {
      if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const preferences = soundscape.setPreferences(normalizeCitySoundscapePreferences(next));
      return freeze({ ok: true, preferences, automaticAudio: false });
    },
    cue(id = 'confirm') { return soundscape.cue(id); },
    stopAudio(reason = 'manual') { return soundscape.stopForRuntimeGuard(reason); },
    dispose() {
      if (disposed) return;
      disposed = true;
      soundscape.dispose();
      soundscape = freeze({ getSummary: () => freeze({ active: false, disposed: true }) });
    }
  });
}
