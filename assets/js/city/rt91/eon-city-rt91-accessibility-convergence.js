/** RT91 — converge existing W624K + W756 accessibility truth without a new device authority. */
import { normalizeEonCityAccessibilityPreferences, EON_CITY_CONTROLLER_ACTIONS } from '../eon-city-accessibility-device-system.js';
import { buildEonCityW756ExperiencePlan, validateEonCityW756ExperiencePlan } from '../w756/eon-city-w756-onboarding-navigation-accessibility.js';

export const EON_CITY_RT91_ACCESSIBILITY_CONVERGENCE_SCHEMA = 'eon.city.accessibility-convergence.rt91.v1';
const freeze = Object.freeze;

export function buildEonCityRt91AccessibilityConvergence({ width = 1280, height = 720, coarsePointer = false, preferences = {} } = {}) {
  const prefs = normalizeEonCityAccessibilityPreferences(preferences);
  const experience = buildEonCityW756ExperiencePlan({ width, height, coarsePointer, reducedMotion: prefs.reducedMotion, highContrast: prefs.highContrast });
  return freeze({
    schema: EON_CITY_RT91_ACCESSIBILITY_CONVERGENCE_SCHEMA,
    preferences: prefs,
    experience,
    keyboardUse: 'KeyE',
    touchUse: 'interact',
    controllerUse: EON_CITY_CONTROLLER_ACTIONS.includes('interact') ? 'interact' : '',
    captionsPrimary: experience.accessibility.captionsPrimary,
    semanticAlternative: experience.accessibility.semanticAlternative,
    reducedMotionHonored: prefs.reducedMotion,
    reducedSensoryHonored: prefs.reducedSensory,
    highContrastHonored: prefs.highContrast,
    minimumTouchTargetPx: Math.max(prefs.touchTargetPx, experience.mobile.minimumTouchTargetPx),
    soundUsefulWhenOff: true,
    noAutomaticAudio: true,
    noAutomaticFullscreen: true,
    noAutomaticOrientationLock: true,
    noAutomaticNavigation: true,
    ownsAccessibilityPreferences: false,
    ownsNavigationRuntime: false
  });
}

export function validateEonCityRt91AccessibilityConvergence(plan = buildEonCityRt91AccessibilityConvergence()) {
  const errors = [];
  if (plan.schema !== EON_CITY_RT91_ACCESSIBILITY_CONVERGENCE_SCHEMA) errors.push('schema');
  if (!validateEonCityW756ExperiencePlan(plan.experience).ok) errors.push('w756');
  if (plan.keyboardUse !== 'KeyE' || plan.touchUse !== 'interact' || plan.controllerUse !== 'interact') errors.push('input-parity');
  if ((plan.minimumTouchTargetPx || 0) < 48 || !plan.captionsPrimary || !plan.semanticAlternative) errors.push('accessibility');
  if (!plan.noAutomaticAudio || !plan.noAutomaticFullscreen || !plan.noAutomaticOrientationLock || !plan.noAutomaticNavigation) errors.push('automatic-action');
  if (plan.ownsAccessibilityPreferences || plan.ownsNavigationRuntime) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_ACCESSIBILITY_CONVERGENCE_SCHEMA, buildEonCityRt91AccessibilityConvergence, validateEonCityRt91AccessibilityConvergence });
