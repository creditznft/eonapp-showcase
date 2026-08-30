/**
 * W571 — EONBOT procedural rig and companion staging contract.
 *
 * This module describes only local, source-controlled geometry and a bounded
 * staging envelope for the existing captions-first EONBOT companion. It does
 * not load assets, save state, request permissions, inspect user work, start
 * a provider request, or make a commercial/access claim.
 */
export const EON_CITY_EONBOT_RIG_SCHEMA = 'eon.city.eonbot-rig.w571.v1';

const freeze = (value) => Object.freeze(value);
const VALID_QUALITIES = new Set(['lite', 'balanced', 'cinematic']);
const QUALITY_ORDER = Object.freeze(['lite', 'balanced', 'cinematic']);

const QUALITY_PROFILES = freeze({
  lite: freeze({
    id: 'lite',
    detail: 'essential',
    shellSegments: 10,
    coreSegments: 8,
    orbitRingCount: 1,
    finCount: 0,
    haloCount: 0,
    stageBeaconCount: 0,
    lightIntensity: 3.0,
    lightRange: 3.0,
    hoverAmplitude: 0.035,
    orbitSpeed: 0,
    meshBudget: 8
  }),
  balanced: freeze({
    id: 'balanced',
    detail: 'full',
    shellSegments: 14,
    coreSegments: 10,
    orbitRingCount: 2,
    finCount: 2,
    haloCount: 1,
    stageBeaconCount: 1,
    lightIntensity: 4.8,
    lightRange: 4.2,
    hoverAmplitude: 0.12,
    orbitSpeed: 0.018,
    meshBudget: 17
  }),
  cinematic: freeze({
    id: 'cinematic',
    detail: 'showcase',
    shellSegments: 18,
    coreSegments: 12,
    orbitRingCount: 3,
    finCount: 4,
    haloCount: 2,
    stageBeaconCount: 2,
    lightIntensity: 5.6,
    lightRange: 4.8,
    hoverAmplitude: 0.18,
    orbitSpeed: 0.028,
    meshBudget: 27
  })
});

export const EON_CITY_EONBOT_RIG_QUALITY_PROFILES = QUALITY_PROFILES;

const DEFAULT_STAGING = freeze({
  id: 'operator-sidecar-stage',
  followOffset: freeze({ x: 1.15, y: 2.0, z: -0.52 }),
  envelope: freeze({ minHeight: 1.72, maxHeight: 2.38, maxHorizontalOffset: 1.72 }),
  captionOffset: freeze({ x: 0, y: 0.84, z: 0 }),
  haloOffset: freeze({ x: 0, y: 0.68, z: 0.02 }),
  localOnly: true,
  pauseRespected: true,
  reducedEffectsRespected: true
});

function normalizedQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return VALID_QUALITIES.has(quality) ? quality : 'balanced';
}

function resolvedProfile({ quality = 'balanced', reducedMotion = false } = {}) {
  const requestedQuality = normalizedQuality(quality);
  return reducedMotion ? QUALITY_PROFILES.lite : QUALITY_PROFILES[requestedQuality];
}

function createComponentIds(profile) {
  return freeze({
    shell: 'procedural-shell',
    core: 'procedural-core',
    orbitRings: freeze(Array.from({ length: profile.orbitRingCount }, (_, index) => `orbit-ring-${index + 1}`)),
    fins: freeze(Array.from({ length: profile.finCount }, (_, index) => `rig-fin-${index + 1}`)),
    halos: freeze(Array.from({ length: profile.haloCount }, (_, index) => `vector-halo-${index + 1}`)),
    stageBeacons: freeze(Array.from({ length: profile.stageBeaconCount }, (_, index) => `stage-beacon-${index + 1}`))
  });
}

function exactKeys(value, keys) {
  return Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
}

function finiteWithin(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

/**
 * Returns a deterministic, visual-only rig plan. `companionSkinId` is a
 * display label only; selecting it remains governed by the existing explicit
 * local appearance-preference flow.
 */
export function createEonCityEonbotRigPlan({ quality = 'balanced', reducedMotion = false, companionSkinId = '' } = {}) {
  const profile = resolvedProfile({ quality, reducedMotion });
  const components = createComponentIds(profile);
  return freeze({
    schema: EON_CITY_EONBOT_RIG_SCHEMA,
    quality: profile.id,
    detail: profile.detail,
    companionSkinId: String(companionSkinId || '').trim().toLowerCase(),
    rig: freeze({
      body: 'original-procedural-orbital-guide-rig',
      shellSegments: profile.shellSegments,
      coreSegments: profile.coreSegments,
      orbitRingCount: components.orbitRings.length,
      finCount: components.fins.length,
      haloCount: components.halos.length,
      stageBeaconCount: components.stageBeacons.length,
      meshBudget: profile.meshBudget,
      componentIds: components,
      originalProcedural: true,
      binaryAssets: false,
      remoteAssets: false
    }),
    staging: freeze({
      ...DEFAULT_STAGING,
      followOffset: freeze({ ...DEFAULT_STAGING.followOffset }),
      envelope: freeze({ ...DEFAULT_STAGING.envelope }),
      captionOffset: freeze({ ...DEFAULT_STAGING.captionOffset }),
      haloOffset: freeze({ ...DEFAULT_STAGING.haloOffset }),
      lightIntensity: profile.lightIntensity,
      lightRange: profile.lightRange,
      hoverAmplitude: profile.hoverAmplitude,
      orbitSpeed: profile.orbitSpeed,
      motionEnabled: !reducedMotion && profile.id !== 'lite'
    }),
    panel: freeze({
      id: 'eonbot-companion-panel',
      captionsFirst: true,
      opensSameSafePanel: true,
      startsVoice: false,
      requestsMicrophone: false,
      startsWork: false,
      opensRoute: false,
      readsPrivateData: false,
      backgroundActivity: false
    }),
    localOnly: true,
    visualOnly: true,
    browserStorageWritten: false,
    networkRequestCreated: false,
    privateDataRead: false,
    autonomousWorkStarted: false,
    microphoneRequested: false,
    voiceStarted: false,
    routeOpened: false,
    subscriptionEntitlementClaimed: false,
    commercialStatus: 'visual-only-no-entitlement'
  });
}

/** Returns the same deterministic plan through an explicit read-only accessor. */
export function getEonCityEonbotRigPlan(options = {}) {
  return createEonCityEonbotRigPlan(options);
}

/** Rejects malformed, enlarged, commercial, private, or network-shaped plans. */
export function validateEonCityEonbotRigPlan(plan = {}) {
  const errors = [];
  const value = plan && typeof plan === 'object' ? plan : {};
  const quality = normalizedQuality(value.quality);
  const profile = QUALITY_PROFILES[quality];
  const expected = createEonCityEonbotRigPlan({ quality, companionSkinId: value.companionSkinId });
  const allowedKeys = ['schema', 'quality', 'detail', 'companionSkinId', 'rig', 'staging', 'panel', 'localOnly', 'visualOnly', 'browserStorageWritten', 'networkRequestCreated', 'privateDataRead', 'autonomousWorkStarted', 'microphoneRequested', 'voiceStarted', 'routeOpened', 'subscriptionEntitlementClaimed', 'commercialStatus'];
  if (!exactKeys(value, allowedKeys)) errors.push('plan-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_EONBOT_RIG_SCHEMA || !VALID_QUALITIES.has(value.quality)) errors.push('plan-schema-or-quality-invalid');
  if (value.detail !== profile.detail) errors.push('detail-profile-invalid');
  if (typeof value.companionSkinId !== 'string' || value.companionSkinId.length > 80) errors.push('skin-id-invalid');
  if (!exactKeys(value.rig, ['body', 'shellSegments', 'coreSegments', 'orbitRingCount', 'finCount', 'haloCount', 'stageBeaconCount', 'meshBudget', 'componentIds', 'originalProcedural', 'binaryAssets', 'remoteAssets'])) errors.push('rig-has-unknown-fields');
  if (value.rig?.body !== expected.rig.body || value.rig?.shellSegments !== profile.shellSegments || value.rig?.coreSegments !== profile.coreSegments || value.rig?.orbitRingCount !== profile.orbitRingCount || value.rig?.finCount !== profile.finCount || value.rig?.haloCount !== profile.haloCount || value.rig?.stageBeaconCount !== profile.stageBeaconCount || value.rig?.meshBudget !== profile.meshBudget) errors.push('rig-profile-invalid');
  if (value.rig?.originalProcedural !== true || value.rig?.binaryAssets !== false || value.rig?.remoteAssets !== false) errors.push('rig-asset-truth-invalid');
  const ids = value.rig?.componentIds || {};
  if (!exactKeys(ids, ['shell', 'core', 'orbitRings', 'fins', 'halos', 'stageBeacons']) || ids.shell !== 'procedural-shell' || ids.core !== 'procedural-core' || !Array.isArray(ids.orbitRings) || !Array.isArray(ids.fins) || !Array.isArray(ids.halos) || !Array.isArray(ids.stageBeacons) || ids.orbitRings.length !== profile.orbitRingCount || ids.fins.length !== profile.finCount || ids.halos.length !== profile.haloCount || ids.stageBeacons.length !== profile.stageBeaconCount) errors.push('component-register-invalid');
  if (!exactKeys(value.staging, ['id', 'followOffset', 'envelope', 'captionOffset', 'haloOffset', 'localOnly', 'pauseRespected', 'reducedEffectsRespected', 'lightIntensity', 'lightRange', 'hoverAmplitude', 'orbitSpeed', 'motionEnabled'])) errors.push('staging-has-unknown-fields');
  if (value.staging?.id !== DEFAULT_STAGING.id || value.staging?.localOnly !== true || value.staging?.pauseRespected !== true || value.staging?.reducedEffectsRespected !== true) errors.push('staging-boundary-invalid');
  const offset = value.staging?.followOffset || {};
  const envelope = value.staging?.envelope || {};
  if (!finiteWithin(offset.x, -1.72, 1.72) || !finiteWithin(offset.y, 1.72, 2.38) || !finiteWithin(offset.z, -1.72, 1.72) || !finiteWithin(envelope.minHeight, 1.5, 2.0) || !finiteWithin(envelope.maxHeight, 2.1, 2.8) || envelope.maxHeight < envelope.minHeight || !finiteWithin(envelope.maxHorizontalOffset, 1.0, 2.4)) errors.push('staging-envelope-invalid');
  if (value.staging?.lightIntensity !== profile.lightIntensity || value.staging?.lightRange !== profile.lightRange || value.staging?.hoverAmplitude !== profile.hoverAmplitude || value.staging?.orbitSpeed !== profile.orbitSpeed || value.staging?.motionEnabled !== (profile.id !== 'lite')) errors.push('staging-profile-invalid');
  if (!exactKeys(value.panel, ['id', 'captionsFirst', 'opensSameSafePanel', 'startsVoice', 'requestsMicrophone', 'startsWork', 'opensRoute', 'readsPrivateData', 'backgroundActivity']) || value.panel?.id !== 'eonbot-companion-panel' || value.panel?.captionsFirst !== true || value.panel?.opensSameSafePanel !== true || value.panel?.startsVoice !== false || value.panel?.requestsMicrophone !== false || value.panel?.startsWork !== false || value.panel?.opensRoute !== false || value.panel?.readsPrivateData !== false || value.panel?.backgroundActivity !== false) errors.push('panel-boundary-invalid');
  if (value.localOnly !== true || value.visualOnly !== true || value.browserStorageWritten !== false || value.networkRequestCreated !== false || value.privateDataRead !== false || value.autonomousWorkStarted !== false || value.microphoneRequested !== false || value.voiceStarted !== false || value.routeOpened !== false || value.subscriptionEntitlementClaimed !== false || value.commercialStatus !== 'visual-only-no-entitlement') errors.push('truth-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), quality: profile.id, meshBudget: Number(value.rig?.meshBudget || 0) });
}

export function getEonCityEonbotRigTruth({ quality = 'balanced', reducedMotion = false } = {}) {
  const plan = createEonCityEonbotRigPlan({ quality, reducedMotion });
  const validation = validateEonCityEonbotRigPlan(plan);
  return freeze({
    schema: EON_CITY_EONBOT_RIG_SCHEMA,
    quality: plan.quality,
    valid: validation.ok,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    localOnly: true,
    visualOnly: true,
    captionsFirst: true,
    sameSafePanel: true,
    browserStorageWritten: false,
    networkRequestCreated: false,
    privateDataRead: false,
    autonomousWorkStarted: false,
    microphoneRequested: false,
    voiceStarted: false,
    routeOpened: false,
    subscriptionEntitlementClaimed: false,
    browserDeviceProofCaptured: false
  });
}

export function getEonCityEonbotRigQualityOrder() {
  return QUALITY_ORDER;
}
