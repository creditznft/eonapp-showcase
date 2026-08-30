/**
 * W660B2 — lightweight CSS-motion policy for EON Pulse.
 *
 * This module never creates Canvas/WebGL, starts a requestAnimationFrame loop,
 * reads Chat content, starts AI work or activates voice. It only applies bounded
 * data attributes and CSS custom properties to the existing Pulse root.
 */

export const EON_NEXUS_PULSE_MOTION_SCHEMA = 'eon.nexus.pulse-motion.w660b2.v1';

const PROFILES = Object.freeze(['auto', 'full', 'balanced', 'low-power', 'static']);
const STATES = Object.freeze([
  'ready',
  'listening',
  'processing',
  'speaking',
  'waiting-approval',
  'complete',
  'error',
  'offline'
]);

const STATE_MOTIONS = Object.freeze({
  ready: 'ready-breathe',
  listening: 'listening-ripple',
  processing: 'processing-orbit',
  speaking: 'speaking-pulse',
  'waiting-approval': 'approval-ring',
  complete: 'complete-once',
  error: 'error-once',
  offline: 'offline-static'
});

function boundedNumber(value, fallback = 0, max = 256) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;
}

function safeReducedMotion(environment = globalThis) {
  try { return environment?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch { return false; }
}

function normalizedProfile(value = 'auto') {
  const profile = String(value || 'auto');
  return PROFILES.includes(profile) ? profile : 'auto';
}

function normalizedState(value = 'ready') {
  const state = String(value || 'ready');
  return STATES.includes(state) ? state : 'ready';
}

export function getEonNexusPulseMotionPolicy({
  environment = globalThis,
  userPreference = 'auto',
  state = 'ready',
  privateRoute = false,
  reducedMotion = safeReducedMotion(environment),
  saveData = environment?.navigator?.connection?.saveData === true,
  deviceMemory = boundedNumber(environment?.navigator?.deviceMemory, 0, 128),
  hardwareConcurrency = boundedNumber(environment?.navigator?.hardwareConcurrency, 0, 256),
  hidden = environment?.document?.hidden === true
} = {}) {
  const preference = normalizedProfile(userPreference);
  const pulseState = normalizedState(state);
  const constrainedMemory = deviceMemory > 0 && deviceMemory <= 4;
  const constrainedCpu = hardwareConcurrency > 0 && hardwareConcurrency <= 4;

  let profile = 'balanced';
  let reason = 'Balanced motion keeps the Pulse expressive without a heavy renderer.';

  if (reducedMotion || preference === 'static') {
    profile = 'static';
    reason = reducedMotion
      ? 'Reduced motion is enabled, so the Pulse remains static.'
      : 'The user selected the static Pulse profile.';
  } else if (preference !== 'auto') {
    profile = preference;
    reason = 'Using the user-selected Pulse motion profile.';
  } else if (saveData || constrainedMemory || constrainedCpu) {
    profile = 'low-power';
    reason = saveData
      ? 'Data Saver is enabled, so the Pulse uses low-power motion.'
      : 'This device starts with low-power Pulse motion.';
  } else if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
    profile = 'full';
    reason = 'This device can use the full lightweight Pulse motion profile.';
  }

  const active = !hidden && profile !== 'static';
  const stateMotion = active ? STATE_MOTIONS[pulseState] : 'none';
  const durationScale = profile === 'full' ? 1 : profile === 'balanced' ? 1.25 : profile === 'low-power' ? 1.8 : 0;
  const intensity = profile === 'full' ? 1 : profile === 'balanced' ? 0.78 : profile === 'low-power' ? 0.52 : 0;

  if (hidden) reason = 'The page is hidden, so Pulse motion is paused.';

  return Object.freeze({
    schema: EON_NEXUS_PULSE_MOTION_SCHEMA,
    profile,
    userPreference: preference,
    state: pulseState,
    stateMotion,
    active,
    hidden,
    reducedMotion,
    saveData,
    deviceMemory,
    hardwareConcurrency,
    durationScale,
    intensity,
    privateRoute: privateRoute === true,
    usesCssMotion: profile !== 'static',
    continuousJsLoop: false,
    requiresCanvas: false,
    requiresWebGl: false,
    requiresBabylon: false,
    requiresGlb: false,
    reason
  });
}

function dispatchPolicy(root, environment, policy, reason) {
  try {
    const EventCtor = environment?.CustomEvent || globalThis.CustomEvent;
    root.dispatchEvent?.(new EventCtor('eon:nexus-pulse-motion-policy', {
      detail: {
        schema: policy.schema,
        profile: policy.profile,
        state: policy.state,
        stateMotion: policy.stateMotion,
        active: policy.active,
        reason: String(reason || 'update').slice(0, 80)
      }
    }));
  } catch {}
}

export function createEonNexusPulseMotionController({
  root,
  environment = globalThis,
  userPreference = 'auto',
  state = 'ready',
  privateRoute = false,
  onPolicy = null
} = {}) {
  if (!root?.dataset) return Object.freeze({ ok: false, reason: 'pulse-root-required', dispose() {} });

  const documentRef = environment?.document || null;
  const media = (() => {
    try { return environment?.matchMedia?.('(prefers-reduced-motion: reduce)') || null; } catch { return null; }
  })();
  let disposed = false;
  let preference = normalizedProfile(userPreference);
  let currentState = normalizedState(state);
  let currentPrivateRoute = privateRoute === true;
  let currentPolicy = null;

  const apply = (reason = 'update') => {
    if (disposed) return currentPolicy;
    currentPolicy = getEonNexusPulseMotionPolicy({
      environment,
      userPreference: preference,
      state: currentState,
      privateRoute: currentPrivateRoute,
      reducedMotion: media?.matches === true,
      hidden: documentRef?.hidden === true
    });
    root.dataset.motionProfile = currentPolicy.profile;
    root.dataset.motionActive = String(currentPolicy.active);
    root.dataset.motionState = currentPolicy.stateMotion;
    root.dataset.motionPaused = String(currentPolicy.hidden);
    root.style?.setProperty?.('--eon-nexus-motion-duration-scale', String(currentPolicy.durationScale || 0));
    root.style?.setProperty?.('--eon-nexus-motion-intensity', String(currentPolicy.intensity || 0));
    try { onPolicy?.(currentPolicy, reason); } catch {}
    dispatchPolicy(root, environment, currentPolicy, reason);
    return currentPolicy;
  };

  const onVisibility = () => apply('visibilitychange');
  const onReducedMotion = () => apply('reduced-motion-change');
  documentRef?.addEventListener?.('visibilitychange', onVisibility);
  media?.addEventListener?.('change', onReducedMotion);

  apply('controller-start');

  return Object.freeze({
    ok: true,
    reason: null,
    getPolicy: () => currentPolicy,
    update({ state: nextState = currentState, privateRoute: nextPrivateRoute = currentPrivateRoute } = {}) {
      currentState = normalizedState(nextState);
      currentPrivateRoute = nextPrivateRoute === true;
      return apply('state-update');
    },
    setPreference(nextPreference = 'auto') {
      preference = normalizedProfile(nextPreference);
      return apply('preference-update');
    },
    refresh: (reason = 'manual') => apply(reason),
    dispose() {
      if (disposed) return;
      disposed = true;
      documentRef?.removeEventListener?.('visibilitychange', onVisibility);
      media?.removeEventListener?.('change', onReducedMotion);
      root.dataset.motionActive = 'false';
      root.dataset.motionPaused = 'true';
      root.dataset.motionState = 'none';
    }
  });
}

export function getEonNexusPulseMotionTruth() {
  return Object.freeze({
    readsProjectedStateOnly: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    approvesAction: false,
    continuousJsLoop: false,
    cssStateMotionOnly: true,
    hiddenMotionPaused: true,
    reducedMotionStatic: true,
    staticFallbackRequired: true,
    requiresCanvas: false,
    requiresWebGl: false,
    requiresBabylon: false,
    requiresGlb: false
  });
}

export default Object.freeze({
  EON_NEXUS_PULSE_MOTION_SCHEMA,
  getEonNexusPulseMotionPolicy,
  createEonNexusPulseMotionController,
  getEonNexusPulseMotionTruth
});
