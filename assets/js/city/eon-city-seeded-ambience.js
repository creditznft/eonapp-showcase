/**
 * W573 — deterministic local City ambience contract.
 *
 * This is a bounded visual layer for the Command Horizon. It uses a source
 * seed and an explicit local phase index; it never reads device time, user
 * activity, account state, a calendar, or a network feed.
 */
export const EON_CITY_SEEDED_AMBIENCE_SCHEMA = 'eon.city.seeded-ambience.w573.v1';

const freeze = (value) => Object.freeze(value);
const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const SAFE_ID = /^[a-z][a-z0-9:-]{2,63}$/i;
const DEFAULT_SEED = 'eon-command-horizon';

const QUALITY_PROFILES = freeze({
  lite: freeze({ signCount: 2, npcCueCount: 0, trafficCount: 0, momentCount: 0, motionEnabled: false }),
  balanced: freeze({ signCount: 4, npcCueCount: 3, trafficCount: 2, momentCount: 1, motionEnabled: true }),
  cinematic: freeze({ signCount: 6, npcCueCount: 5, trafficCount: 4, momentCount: 2, motionEnabled: true })
});

const LOCAL_PHASES = freeze([
  freeze({ id: 'arrival-pulse', label: 'ARRIVAL PULSE', summary: 'wayfinding lights and calm arrivals', motions: freeze(['wayfinding-glance', 'calibration-turn', 'observatory-pause']) }),
  freeze({ id: 'maker-loop', label: 'MAKER LOOP', summary: 'quiet maintenance and maker movement', motions: freeze(['calibration-turn', 'wayfinding-glance', 'observatory-pause']) }),
  freeze({ id: 'signal-window', label: 'SIGNAL WINDOW', summary: 'observatory markers and relay lights', motions: freeze(['observatory-pause', 'wayfinding-glance', 'calibration-turn']) }),
  freeze({ id: 'night-settle', label: 'NIGHT SETTLE', summary: 'low-motion horizon and static signs', motions: freeze(['observatory-pause', 'calibration-turn', 'wayfinding-glance']) })
]);

const SIGN_BLUEPRINTS = freeze([
  freeze({ id: 'seeded-sign-arrival', label: 'ARRIVAL LOOP', x: -10.7, y: 2.55, z: 9.2, heading: 0.28, accent: '#76f5ff', scale: 0.78 }),
  freeze({ id: 'seeded-sign-forge', label: 'FORGE WAY', x: 9.25, y: 2.72, z: -7.65, heading: -0.42, accent: '#b58cff', scale: 0.78 }),
  freeze({ id: 'seeded-sign-quiet', label: 'QUIET TERRACE', x: -8.95, y: 2.42, z: -7.95, heading: 0.36, accent: '#8bf0cb', scale: 0.72 }),
  freeze({ id: 'seeded-sign-relay', label: 'RELAY OVERLOOK', x: 9.05, y: 2.46, z: 7.85, heading: -0.32, accent: '#f4ba67', scale: 0.72 }),
  freeze({ id: 'seeded-sign-command', label: 'COMMAND HORIZON', x: 0, y: 3.18, z: -11.35, heading: Math.PI, accent: '#76f5ff', scale: 0.92 }),
  freeze({ id: 'seeded-sign-observatory', label: 'OBSERVATORY WALK', x: 1.1, y: 2.36, z: 10.65, heading: Math.PI, accent: '#b58cff', scale: 0.68 })
]);

const TRAFFIC_BLUEPRINTS = freeze([
  freeze({ id: 'seeded-traffic-cyan', startX: -11.4, startZ: -10.7, endX: 11.4, endZ: -10.7, y: 3.15, accent: '#76f5ff', speed: 0.18, phase: 0.08 }),
  freeze({ id: 'seeded-traffic-violet', startX: 10.8, startZ: -8.8, endX: -10.8, endZ: -8.8, y: 4.15, accent: '#b58cff', speed: 0.14, phase: 0.44 }),
  freeze({ id: 'seeded-traffic-mint', startX: -9.6, startZ: 9.3, endX: 9.6, endZ: 9.3, y: 3.62, accent: '#8bf0cb', speed: 0.12, phase: 0.72 }),
  freeze({ id: 'seeded-traffic-amber', startX: 8.85, startZ: 8.15, endX: -8.85, endZ: 8.15, y: 4.68, accent: '#f4ba67', speed: 0.16, phase: 0.29 })
]);

const MOMENT_BLUEPRINTS = freeze([
  freeze({ id: 'seeded-moment-makers-lanterns', label: 'MAKER LANTERNS', x: -4.15, y: 0.1, z: -8.25, accent: '#76f5ff', rotationSpeed: 0.011 }),
  freeze({ id: 'seeded-moment-relay-rings', label: 'RELAY RINGS', x: 5.35, y: 0.1, z: 8.3, accent: '#b58cff', rotationSpeed: 0.014 })
]);

function normalizedQuality(quality = 'balanced') {
  return VALID_QUALITY.has(String(quality)) ? String(quality) : 'balanced';
}

function normalizeSeed(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  return SAFE_ID.test(candidate) ? candidate : DEFAULT_SEED;
}

function normalizePhaseIndex(value = 0) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric % LOCAL_PHASES.length : 0;
}

function hashSeed(seed = DEFAULT_SEED) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function clonePhase(phase) {
  return freeze({
    id: phase.id,
    label: phase.label,
    summary: phase.summary,
    localVisualOnly: true,
    realWorldTime: false,
    notification: false,
    calendar: false,
    social: false
  });
}

function cloneSigns(count) {
  return freeze(SIGN_BLUEPRINTS.slice(0, count).map((entry) => freeze({
    id: entry.id,
    label: entry.label,
    x: entry.x,
    y: entry.y,
    z: entry.z,
    heading: entry.heading,
    accent: entry.accent,
    scale: entry.scale,
    static: true,
    localVisualOnly: true,
    interactive: false
  })));
}

function cloneTraffic(count, seedOffset) {
  return freeze(TRAFFIC_BLUEPRINTS.slice(0, count).map((entry, index) => freeze({
    id: entry.id,
    startX: entry.startX,
    startZ: entry.startZ,
    endX: entry.endX,
    endZ: entry.endZ,
    y: entry.y,
    accent: entry.accent,
    speed: entry.speed,
    phase: Math.round((((entry.phase + ((seedOffset + index) * 0.071)) % 1) + 1) % 1 * 1000) / 1000,
    localVisualOnly: true,
    interactive: false
  })));
}

function cloneMoments(count) {
  return freeze(MOMENT_BLUEPRINTS.slice(0, count).map((entry) => freeze({
    id: entry.id,
    label: entry.label,
    x: entry.x,
    y: entry.y,
    z: entry.z,
    accent: entry.accent,
    rotationSpeed: entry.rotationSpeed,
    localVisualOnly: true,
    interactive: false,
    notification: false,
    calendar: false,
    social: false,
    reward: null
  })));
}

function buildNpcSchedule(phase, count, seedOffset) {
  return freeze(Array.from({ length: count }, (_, index) => {
    const motion = phase.motions[(index + seedOffset) % phase.motions.length];
    return freeze({
      id: `${phase.id}-npc-${index + 1}`,
      archetypeIndex: index % 3,
      motion,
      driftRadius: Math.round((0.055 + ((index % 3) * 0.025)) * 1000) / 1000,
      turnAmplitude: Math.round((0.07 + ((seedOffset + index) % 3) * 0.026) * 1000) / 1000,
      phase: Math.round((((seedOffset * 0.083) + (index * 0.173)) % 1) * 1000) / 1000,
      localVisualOnly: true,
      interactive: false
    });
  }));
}

function exactKeys(value, keys) {
  return Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
}

function hasFinite(value, minimum, maximum) {
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function motionStateFor(profile, { paused = false, reducedEffects = false } = {}) {
  if (paused) return 'city-paused';
  if (reducedEffects) return 'reduced-effects';
  return profile.motionEnabled ? 'animated' : 'quality-lite';
}

/** Returns a deterministic decorative plan; no system clock, user record, or external feed is consulted. */
export function getEonCitySeededAmbiencePlan({ quality = 'balanced', seed = DEFAULT_SEED, phaseIndex = 0, paused = false, reducedEffects = false } = {}) {
  const resolvedQuality = normalizedQuality(quality);
  const profile = QUALITY_PROFILES[resolvedQuality];
  const resolvedSeed = normalizeSeed(seed);
  const safePhaseIndex = normalizePhaseIndex(phaseIndex);
  const seedOffset = hashSeed(resolvedSeed) % LOCAL_PHASES.length;
  const phase = LOCAL_PHASES[(safePhaseIndex + seedOffset) % LOCAL_PHASES.length];
  const motionState = motionStateFor(profile, { paused: Boolean(paused), reducedEffects: Boolean(reducedEffects) });
  return freeze({
    schema: EON_CITY_SEEDED_AMBIENCE_SCHEMA,
    quality: resolvedQuality,
    seed: resolvedSeed,
    phaseIndex: safePhaseIndex,
    phase: clonePhase(phase),
    npcSchedule: buildNpcSchedule(phase, profile.npcCueCount, seedOffset),
    traffic: cloneTraffic(profile.trafficCount, seedOffset),
    signs: cloneSigns(profile.signCount),
    visualMoments: cloneMoments(profile.momentCount),
    motionEnabled: motionState === 'animated',
    motionState,
    staticSignsRemainVisible: true,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userData: false,
    interactive: false,
    autonomous: false,
    socialMultiplayer: false,
    readsDeviceClock: false,
    realWorldCalendar: false,
    notificationRequested: false,
    soundRequested: false,
    workloadJobStarted: false
  });
}

export function validateEonCitySeededAmbiencePlan(plan = {}) {
  const errors = [];
  const value = plan && typeof plan === 'object' ? plan : {};
  const profile = QUALITY_PROFILES[normalizedQuality(value.quality)];
  const allowedPlanKeys = ['schema', 'quality', 'seed', 'phaseIndex', 'phase', 'npcSchedule', 'traffic', 'signs', 'visualMoments', 'motionEnabled', 'motionState', 'staticSignsRemainVisible', 'originalProcedural', 'binaryAssets', 'remoteAssets', 'remoteTelemetry', 'userData', 'interactive', 'autonomous', 'socialMultiplayer', 'readsDeviceClock', 'realWorldCalendar', 'notificationRequested', 'soundRequested', 'workloadJobStarted'];
  if (!exactKeys(value, allowedPlanKeys)) errors.push('plan-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_SEEDED_AMBIENCE_SCHEMA || !VALID_QUALITY.has(value.quality)) errors.push('plan-schema-or-quality-invalid');
  if (!SAFE_ID.test(String(value.seed || '')) || !Number.isInteger(value.phaseIndex) || value.phaseIndex < 0 || value.phaseIndex >= LOCAL_PHASES.length) errors.push('seed-or-phase-invalid');
  if (!exactKeys(value.phase, ['id', 'label', 'summary', 'localVisualOnly', 'realWorldTime', 'notification', 'calendar', 'social']) || !LOCAL_PHASES.some((entry) => entry.id === value.phase?.id) || value.phase?.localVisualOnly !== true || value.phase?.realWorldTime !== false || value.phase?.notification !== false || value.phase?.calendar !== false || value.phase?.social !== false) errors.push('phase-boundary-invalid');
  if (!Array.isArray(value.npcSchedule) || value.npcSchedule.length !== profile.npcCueCount || !Array.isArray(value.traffic) || value.traffic.length !== profile.trafficCount || !Array.isArray(value.signs) || value.signs.length !== profile.signCount || !Array.isArray(value.visualMoments) || value.visualMoments.length !== profile.momentCount) errors.push('quality-budget-invalid');
  const allowedMotionStates = new Set(['animated', 'quality-lite', 'city-paused', 'reduced-effects']);
  if (!allowedMotionStates.has(value.motionState) || typeof value.motionEnabled !== 'boolean' || value.staticSignsRemainVisible !== true) errors.push('motion-state-invalid');
  if (value.motionState === 'animated' && (!profile.motionEnabled || value.motionEnabled !== true)) errors.push('motion-state-profile-invalid');
  if (value.motionState === 'quality-lite' && (value.quality !== 'lite' || value.motionEnabled !== false)) errors.push('lite-motion-boundary-invalid');
  if ((value.motionState === 'city-paused' || value.motionState === 'reduced-effects') && value.motionEnabled !== false) errors.push('runtime-motion-boundary-invalid');
  if (value.originalProcedural !== true || value.binaryAssets !== false || value.remoteAssets !== false || value.remoteTelemetry !== false || value.userData !== false || value.interactive !== false || value.autonomous !== false || value.socialMultiplayer !== false || value.readsDeviceClock !== false || value.realWorldCalendar !== false || value.notificationRequested !== false || value.soundRequested !== false || value.workloadJobStarted !== false) errors.push('truth-boundary-invalid');
  const ids = new Set();
  for (const entry of value.signs || []) {
    if (!exactKeys(entry, ['id', 'label', 'x', 'y', 'z', 'heading', 'accent', 'scale', 'static', 'localVisualOnly', 'interactive'])) errors.push('sign-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || ids.has(entry?.id)) errors.push('sign-id-invalid-or-duplicate');
    ids.add(entry?.id);
    if (!String(entry?.label || '').trim() || ![entry?.x, entry?.y, entry?.z, entry?.heading, entry?.scale].every((item) => Number.isFinite(item)) || Math.abs(entry?.x || 0) > 14 || Math.abs(entry?.z || 0) > 14 || !hasFinite(entry?.scale, 0.4, 1.2) || entry?.static !== true || entry?.localVisualOnly !== true || entry?.interactive !== false) errors.push('sign-boundary-invalid');
  }
  for (const entry of value.npcSchedule || []) {
    if (!exactKeys(entry, ['id', 'archetypeIndex', 'motion', 'driftRadius', 'turnAmplitude', 'phase', 'localVisualOnly', 'interactive'])) errors.push('npc-cue-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || !Number.isInteger(entry?.archetypeIndex) || entry.archetypeIndex < 0 || entry.archetypeIndex > 2 || !['wayfinding-glance', 'calibration-turn', 'observatory-pause'].includes(entry?.motion) || !hasFinite(entry?.driftRadius, 0.04, 0.16) || !hasFinite(entry?.turnAmplitude, 0.05, 0.16) || !hasFinite(entry?.phase, 0, 1) || entry?.localVisualOnly !== true || entry?.interactive !== false) errors.push('npc-cue-boundary-invalid');
  }
  for (const entry of value.traffic || []) {
    if (!exactKeys(entry, ['id', 'startX', 'startZ', 'endX', 'endZ', 'y', 'accent', 'speed', 'phase', 'localVisualOnly', 'interactive'])) errors.push('traffic-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || ![entry?.startX, entry?.startZ, entry?.endX, entry?.endZ, entry?.y, entry?.speed, entry?.phase].every(Number.isFinite) || Math.abs(entry?.startX || 0) > 14 || Math.abs(entry?.endX || 0) > 14 || Math.abs(entry?.startZ || 0) > 14 || Math.abs(entry?.endZ || 0) > 14 || !hasFinite(entry?.speed, 0.05, 0.3) || !hasFinite(entry?.phase, 0, 1) || entry?.localVisualOnly !== true || entry?.interactive !== false) errors.push('traffic-boundary-invalid');
  }
  for (const entry of value.visualMoments || []) {
    if (!exactKeys(entry, ['id', 'label', 'x', 'y', 'z', 'accent', 'rotationSpeed', 'localVisualOnly', 'interactive', 'notification', 'calendar', 'social', 'reward'])) errors.push('moment-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || !String(entry?.label || '').trim() || ![entry?.x, entry?.y, entry?.z, entry?.rotationSpeed].every(Number.isFinite) || Math.abs(entry?.x || 0) > 14 || Math.abs(entry?.z || 0) > 14 || !hasFinite(entry?.rotationSpeed, 0.005, 0.03) || entry?.localVisualOnly !== true || entry?.interactive !== false || entry?.notification !== false || entry?.calendar !== false || entry?.social !== false || entry?.reward !== null) errors.push('moment-boundary-invalid');
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), quality: value.quality || 'balanced' });
}

export function getEonCitySeededAmbienceTruth({ quality = 'balanced', seed = DEFAULT_SEED } = {}) {
  const plan = getEonCitySeededAmbiencePlan({ quality, seed });
  const validation = validateEonCitySeededAmbiencePlan(plan);
  return freeze({
    schema: EON_CITY_SEEDED_AMBIENCE_SCHEMA,
    quality: plan.quality,
    valid: validation.ok,
    staticSignCount: plan.signs.length,
    trafficCount: plan.traffic.length,
    npcCueCount: plan.npcSchedule.length,
    visualMomentCount: plan.visualMoments.length,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userData: false,
    interactive: false,
    autonomous: false,
    socialMultiplayer: false,
    readsDeviceClock: false,
    realWorldCalendar: false,
    notificationRequested: false,
    soundRequested: false,
    workloadJobStarted: false,
    browserDeviceProofCaptured: false
  });
}
