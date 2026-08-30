/**
 * W572 — optional local City soundscape policy.
 *
 * This module is deliberately policy and state only. It owns no media file,
 * loader, player, microphone, speech, network, storage, telemetry, or
 * background listener. The only currently eligible source is the existing
 * W369 source-controlled procedural tone layer, and it may be used only after
 * a visible user action. Captions and City visuals remain complete without it.
 */

export const EON_CITY_SOUNDSCAPE_POLICY_SCHEMA = 'eon.city.soundscape-policy.w572.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_SOUNDSCAPE_ASSET_POLICY = freeze({
  schema: EON_CITY_SOUNDSCAPE_POLICY_SCHEMA,
  policyStatus: 'source-controlled-no-media-pack',
  assetRegister: freeze([]),
  remoteAssetUrlsAllowed: false,
  streamingAllowed: false,
  edgeProxyAllowed: false,
  binaryProtectedArtClaimed: false,
  currentEligibleSource: freeze({
    id: 'w369-local-procedural-synthesis',
    kind: 'source-controlled-procedural-tone',
    mediaFileCount: 0,
    originalSourceOnly: true,
    userActionRequired: true,
    captionsFirst: true,
    finalSoundtrackClaimed: false,
    licensedMusicPackClaimed: false,
    voicePersonaClaimed: false
  }),
  futureAudioAssetRequirements: freeze({
    approvedProvenanceRequired: true,
    licenceReviewRequired: true,
    browserReviewRequired: true,
    physicalDeviceReviewRequired: true,
    explicitAssetPolicyUpdateRequired: true
  })
});

export const EON_CITY_SOUNDSCAPE_DEFAULT_STATE = freeze({
  preference: 'off',
  audibleState: 'off',
  reason: 'user-not-requested',
  userActionRecorded: false,
  muted: false,
  cityPaused: false,
  tabVisible: true,
  reducedEffects: false
});

function normalizeRuntime(value = {}) {
  return freeze({
    cityPaused: value.cityPaused === true,
    tabVisible: value.tabVisible !== false,
    reducedEffects: value.reducedEffects === true
  });
}

function blockedState(runtime, muted) {
  if (runtime.reducedEffects) return freeze({ audibleState: 'reduced-effects-silent', reason: 'reduced-effects' });
  if (runtime.cityPaused) return freeze({ audibleState: 'paused-silent', reason: 'city-paused' });
  if (!runtime.tabVisible) return freeze({ audibleState: 'hidden-silent', reason: 'tab-hidden' });
  if (muted) return freeze({ audibleState: 'muted', reason: 'user-muted' });
  return null;
}

/**
 * A display-safe policy summary. It is not a device proof or media-delivery
 * receipt, and it never implies that a sound pack is installed.
 */
export function getEonCitySoundscapePolicy() {
  return freeze({
    schema: EON_CITY_SOUNDSCAPE_POLICY_SCHEMA,
    assetPolicy: EON_CITY_SOUNDSCAPE_ASSET_POLICY,
    captionsFirst: true,
    visualCityCompleteWithoutAudio: true,
    audioStartsOnBoot: false,
    autoplay: false,
    explicitUserActionRequired: true,
    cityPauseStopsAudio: true,
    tabHiddenStopsAudio: true,
    reducedEffectsSilent: true,
    microphoneRequested: false,
    speechRecognitionStarted: false,
    voiceSessionStarted: false,
    providerRequestCreated: false,
    remoteAudioRequested: false,
    telemetryRecorded: false,
    listeningBehaviorPersisted: false,
    audioPreferencePersisted: false,
    notificationRequested: false,
    commercialClaimed: false,
    entitlementClaimed: false,
    deviceAudioProven: false
  });
}

/**
 * Holds one in-memory preference for the active City session. The host owns
 * actual procedural synthesis and must report its result back through
 * `reportPlaybackResult`; this controller never creates or starts media.
 */
export function createEonCitySoundscapePolicyController({ onState = null } = {}) {
  const listeners = new Set();
  let disposed = false;
  let state = { ...EON_CITY_SOUNDSCAPE_DEFAULT_STATE };

  const snapshot = () => freeze({
    schema: EON_CITY_SOUNDSCAPE_POLICY_SCHEMA,
    ...state,
    captionsFirst: true,
    visualCityCompleteWithoutAudio: true,
    audioPreferenceMemoryOnly: true,
    audioPreferencePersisted: false,
    listeningBehaviorPersisted: false,
    actualPlaybackStartedByPolicy: false,
    microphoneRequested: false,
    speechRecognitionStarted: false,
    voiceSessionStarted: false,
    providerRequestCreated: false,
    remoteAudioRequested: false,
    telemetryRecorded: false,
    notificationRequested: false,
    commercialClaimed: false,
    entitlementClaimed: false
  });
  const emit = () => {
    const current = snapshot();
    try { onState?.(current); } catch {}
    for (const listener of listeners) {
      try { listener(current); } catch {}
    }
    return current;
  };
  const update = (patch = {}) => {
    state = { ...state, ...patch };
    return emit();
  };
  const denied = (error) => freeze({ ok: false, error, snapshot: snapshot() });

  const setRuntime = (runtime = {}) => {
    if (disposed) return denied('controller-disposed');
    const normalized = normalizeRuntime(runtime);
    const blocked = blockedState(normalized, state.muted);
    if (blocked) {
      update({ ...normalized, ...(blocked || {}) });
      return freeze({ ok: true, shouldStopExistingAudio: true, snapshot: snapshot() });
    }
    const wasRuntimeSilenced = /^(?:paused-silent|hidden-silent|reduced-effects-silent)$/.test(state.audibleState);
    update({
      ...normalized,
      ...(wasRuntimeSilenced ? { preference: 'off', muted: false, audibleState: 'off', reason: 'runtime-ready-requires-new-action' } : {})
    });
    return freeze({ ok: true, shouldStopExistingAudio: false, snapshot: snapshot() });
  };

  const requestEnable = ({ explicitUserAction = false, runtime = {} } = {}) => {
    if (disposed) return denied('controller-disposed');
    if (!explicitUserAction) return denied('explicit-user-action-required');
    const normalized = normalizeRuntime(runtime);
    const blocked = blockedState(normalized, false);
    if (blocked) {
      update({ ...normalized, muted: false, preference: 'off', userActionRecorded: true, ...blocked });
      return freeze({ ok: false, error: blocked.reason, snapshot: snapshot() });
    }
    update({ ...normalized, preference: 'on', userActionRecorded: true, muted: false, audibleState: 'enable-pending-local-procedural-source', reason: 'explicit-user-request' });
    return freeze({ ok: true, action: 'request-existing-local-procedural-source', snapshot: snapshot() });
  };

  const reportPlaybackResult = ({ ok = false, reason = '' } = {}) => {
    if (disposed) return denied('controller-disposed');
    if (ok) {
      update({ audibleState: 'active-local-procedural', reason: 'existing-local-procedural-source' });
      return freeze({ ok: true, snapshot: snapshot() });
    }
    const normalizedReason = String(reason || 'local-audio-unsupported');
    const nextState = normalizedReason === 'audio-unavailable' || normalizedReason === 'audio-start-failed'
      ? 'unsupported'
      : normalizedReason === 'preferences-off' ? 'off' : 'off';
    update({ preference: 'off', audibleState: nextState, reason: normalizedReason });
    return freeze({ ok: false, error: normalizedReason, snapshot: snapshot() });
  };

  const mute = ({ explicitUserAction = false } = {}) => {
    if (disposed) return denied('controller-disposed');
    if (!explicitUserAction) return denied('explicit-user-action-required');
    update({ preference: 'off', muted: true, audibleState: 'muted', reason: 'user-muted', userActionRecorded: true });
    return freeze({ ok: true, shouldStopExistingAudio: true, snapshot: snapshot() });
  };

  const stop = ({ explicitUserAction = false, reason = 'user-stopped' } = {}) => {
    if (disposed) return denied('controller-disposed');
    if (!explicitUserAction) return denied('explicit-user-action-required');
    update({ preference: 'off', muted: false, audibleState: 'off', reason: String(reason || 'user-stopped'), userActionRecorded: true });
    return freeze({ ok: true, shouldStopExistingAudio: true, snapshot: snapshot() });
  };

  const subscribe = (listener) => {
    if (typeof listener !== 'function' || disposed) return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    listeners.clear();
    state = { ...EON_CITY_SOUNDSCAPE_DEFAULT_STATE, reason: 'controller-disposed' };
  };

  return freeze({
    schema: EON_CITY_SOUNDSCAPE_POLICY_SCHEMA,
    getSnapshot: snapshot,
    setRuntime,
    requestEnable,
    reportPlaybackResult,
    mute,
    stop,
    subscribe,
    dispose
  });
}

export function getEonCitySoundscapeTruth() {
  return freeze({
    ...getEonCitySoundscapePolicy(),
    localOnly: true,
    mediaFileShipped: false,
    mediaAssetLoaderUsed: false,
    playbackBehaviorAddedByW572: false,
    finalSoundtrackClaimed: false,
    localAudioGenerationClaimed: false,
    cloudTtsClaimed: false,
    cloudSttClaimed: false,
    liveAudioCaptureClaimed: false,
    socialListeningClaimed: false,
    multiplayerAudioClaimed: false,
    userUploadClaimed: false,
    productionDeploymentClaimed: false,
    physicalDeviceAudioProven: false
  });
}
