/**
 * W660A2 — capability and quality recommendation for future EON NEXUS renderers.
 *
 * This module does not create a Canvas/WebGL context or start animation. It only
 * produces a conservative display-safe recommendation. Static/list rendering is
 * always retained as the fallback.
 */

export const EON_NEXUS_CAPABILITY_SCHEMA = 'eon.nexus.capability.v1';

function boundedNumber(value, fallback = 0, max = 1024) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;
}

function prefersReducedMotion(environment = globalThis) {
  try { return environment?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch { return false; }
}

function hasCanvas(environment = globalThis) {
  return typeof environment?.HTMLCanvasElement === 'function' || typeof environment?.document?.createElement === 'function';
}

function hasWebGlApi(environment = globalThis) {
  return typeof environment?.WebGL2RenderingContext === 'function' || typeof environment?.WebGLRenderingContext === 'function';
}

export function getEonNexusCapability({
  environment = globalThis,
  reducedMotion = prefersReducedMotion(environment),
  saveData = environment?.navigator?.connection?.saveData === true,
  deviceMemory = boundedNumber(environment?.navigator?.deviceMemory, 0, 128),
  hardwareConcurrency = boundedNumber(environment?.navigator?.hardwareConcurrency, 0, 256),
  hidden = environment?.document?.hidden === true,
  userPreference = 'auto'
} = {}) {
  const canvas = hasCanvas(environment);
  const webgl = canvas && hasWebGlApi(environment);
  const preference = ['auto', 'full', 'balanced', 'low-power', 'static'].includes(String(userPreference || ''))
    ? String(userPreference)
    : 'auto';
  const weakMemory = deviceMemory > 0 && deviceMemory <= 4;
  const weakCpu = hardwareConcurrency > 0 && hardwareConcurrency <= 4;
  const constrained = saveData || weakMemory || weakCpu;

  let recommendedMode = 'balanced';
  let reason = 'Balanced mode keeps the Pulse lightweight while preserving useful motion.';

  if (preference !== 'auto') {
    recommendedMode = preference;
    reason = 'Using the user-selected EON NEXUS quality mode.';
  } else if (reducedMotion || !canvas) {
    recommendedMode = 'static';
    reason = reducedMotion
      ? 'Reduced motion is enabled, so EON NEXUS should use its static accessible representation.'
      : 'Canvas rendering is unavailable, so EON NEXUS should use its static accessible representation.';
  } else if (!webgl || constrained) {
    recommendedMode = 'low-power';
    reason = saveData
      ? 'Data Saver is enabled, so EON NEXUS should use low-power rendering.'
      : 'This device should begin with the low-power renderer.';
  } else if (deviceMemory >= 8 && hardwareConcurrency >= 8) {
    recommendedMode = 'full';
    reason = 'This device can begin with the full renderer, subject to measured frame-time downgrade.';
  }

  if (hidden) reason = 'The page is hidden; rendering must pause until it becomes visible.';

  return Object.freeze({
    schema: EON_NEXUS_CAPABILITY_SCHEMA,
    canvas,
    webgl,
    reducedMotion,
    saveData,
    deviceMemory,
    hardwareConcurrency,
    hidden,
    userPreference: preference,
    recommendedMode,
    renderActive: !hidden && recommendedMode !== 'static',
    initialFrameRateCap: recommendedMode === 'full' ? 60 : recommendedMode === 'balanced' ? 30 : recommendedMode === 'low-power' ? 20 : 0,
    staticFallbackAvailable: true,
    requiresBabylon: false,
    requiresGlb: false,
    reason
  });
}

export function getEonNexusCapabilityTruth() {
  return Object.freeze({
    createsRenderingContext: false,
    startsAnimation: false,
    staticFallbackRequired: true,
    userReducedMotionHonored: true,
    hiddenRenderingAllowed: false,
    pulseRequiresBabylon: false,
    pulseRequiresGlb: false,
    measuredRuntimeDowngradeStillRequired: true
  });
}

export default Object.freeze({
  EON_NEXUS_CAPABILITY_SCHEMA,
  getEonNexusCapability,
  getEonNexusCapabilityTruth
});
