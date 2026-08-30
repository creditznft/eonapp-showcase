/**
 * W716 institutional accessibility, language and input authority.
 *
 * Pure projections only. This module never requests media, starts speech,
 * enters fullscreen, locks orientation, navigates, stores data or certifies a
 * physical device. Browser, assistive-technology and real-device evidence is
 * reserved for W718.
 */
import { getEonResponsiveInputSnapshot } from '../../utils/responsive-accessibility-input.js';
import {
  EON_CHAT_GUIDE_LANGUAGE_MATRIX,
  EON_FULL_PRODUCT_LANGUAGE_MATRIX,
  getEonChatGuideLanguage,
  normalizeEonChatGuideLanguage
} from '../../utils/language-matrix.js';
import {
  EON_NEXUS_W708_MIN_TARGET_PX,
  getEonNexusW708ResponsiveInteractionTruth,
  interpretEonNexusW708KeyboardInput,
  resolveEonNexusW708ResponsiveLayout
} from '../../nexus/w708/eon-nexus-w708-responsive-interaction.js';
import {
  EON_CITY_ACCESSIBILITY_DEFAULTS,
  getEonCityDeviceClass,
  normalizeEonCityAccessibilityPreferences
} from '../../city/eon-city-accessibility-device-system.js';

export const EONAPP_W716_ACCESSIBILITY_LANGUAGE_INPUT_SCHEMA = 'eonapp.accessibility-language-input.w716.v1';
export const EONAPP_W716_MIN_TARGET_PX = 48;

const freeze = Object.freeze;

export const EONAPP_W716_CRITICAL_JOURNEYS = freeze([
  freeze({ id: 'new-user', routes: freeze(['/', '/help', '/projects']), outcome: 'Understand EONAPP, create or select work and return safely.' }),
  freeze({ id: 'productive-city', routes: freeze(['/projects', '/eoncity', '/workspace']), outcome: 'Carry one reviewed work object into City and its native surface.' }),
  freeze({ id: 'flagship-expanse', routes: freeze(['/eoncity', '/eoncity#expanse']), outcome: 'Inspect, confirm, enter and return without hidden travel.' }),
  freeze({ id: 'cross-surface', routes: freeze(['/projects', '/atlas', '/eoncity']), outcome: 'Keep one selected project and one foreground object across surfaces.' }),
  freeze({ id: 'recovery', routes: freeze(['/vault', '/capsule', '/support']), outcome: 'Review recovery boundaries without accidental overwrite or disclosure.' }),
  freeze({ id: 'commercial', routes: freeze(['/billing', '/eon-keys', '/profile']), outcome: 'Understand identity, plan and feature-unlock boundaries before acting.' })
]);

export const EONAPP_W716_SEMANTIC_ALTERNATIVES = freeze([
  freeze({ surface: 'nexus', visual: 'Babylon spatial command field', alternative: 'Named work-object list, relationship status, selected-object summary and equivalent buttons.', liveRegion: 'polite' }),
  freeze({ surface: 'atlas', visual: 'Spatial project universe', alternative: 'Readable project centre, tasks, linked records, history, limitations and first-step actions.', liveRegion: 'polite' }),
  freeze({ surface: 'city', visual: 'Babylon navigable world', alternative: 'District identity, objective, nearby landmark, reviewed actions, touch/keyboard controls and non-3D fallback.', liveRegion: 'polite' }),
  freeze({ surface: 'command-centre', visual: 'In-world master room', alternative: 'Eight named stations with statuses and explicit review/open actions.', liveRegion: 'polite' })
]);

function mediaEnvironment({ width, height, coarsePointer, standalone, reducedMotion, highContrast } = {}) {
  const active = new Set();
  if (coarsePointer) active.add('(pointer: coarse)');
  if (coarsePointer) active.add('(hover: none)');
  if (standalone) active.add('(display-mode: standalone)');
  if (reducedMotion) active.add('(prefers-reduced-motion: reduce)');
  if (highContrast) active.add('(prefers-contrast: more)');
  return freeze({
    innerWidth: Number(width) || 1280,
    innerHeight: Number(height) || 800,
    navigator: freeze({ standalone: Boolean(standalone) }),
    matchMedia: (query) => freeze({ matches: active.has(query) })
  });
}

export function resolveEonAppW716Language(value = 'en', fallback = 'en') {
  const fallbackCode = normalizeEonChatGuideLanguage(fallback, 'en') || 'en';
  const code = normalizeEonChatGuideLanguage(value, fallbackCode);
  const entry = getEonChatGuideLanguage(code, EON_CHAT_GUIDE_LANGUAGE_MATRIX[0]);
  return freeze({
    code: entry.code,
    name: entry.name,
    englishName: entry.englishName,
    dir: entry.dir,
    script: entry.script,
    speechLocale: entry.speechLocale,
    fullProductLanguage: entry.publishedFullUi,
    publishedInterfaceLanguage: entry.publishedFullUi,
    chatGuideLanguage: entry.chatGuide,
    typedFallbackRequired: true,
    logicalCssRequired: entry.dir === 'rtl',
    overflowPolicy: entry.script === 'cjk' ? 'cjk-line-break' : 'wrap-and-hyphenate'
  });
}

function keyboardActions() {
  const samples = [
    { key: 'Escape' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' },
    { key: 'ArrowUp' }, { key: 'ArrowDown' }, { key: '0' },
    { key: 'Enter' }, { key: ' ' }, { key: '/' },
    { key: 'z', ctrlKey: true }, { key: 'z', ctrlKey: true, shiftKey: true }
  ];
  return freeze(samples.map((sample) => interpretEonNexusW708KeyboardInput(sample)).filter((row) => row.ok).map((row) => row.action));
}

export function buildEonAppW716AccessibilityPlan({
  width = 1280,
  height = 800,
  coarsePointer = false,
  standalone = false,
  embeddedInWorld = false,
  language = 'en',
  reducedMotion = false,
  highContrast = false,
  captions = true,
  textScale = 1,
  inputMode = 'auto',
  deviceMemory = 4,
  hardwareConcurrency = 4
} = {}) {
  const responsive = getEonResponsiveInputSnapshot(mediaEnvironment({ width, height, coarsePointer, standalone, reducedMotion, highContrast }));
  const resolvedLanguage = resolveEonAppW716Language(language);
  const nexus = resolveEonNexusW708ResponsiveLayout({ width, height, embeddedInWorld, coarsePointer, reducedMotion });
  const cityPreferences = normalizeEonCityAccessibilityPreferences({
    ...EON_CITY_ACCESSIBILITY_DEFAULTS,
    captions,
    reducedMotion,
    highContrast,
    textScale,
    inputMode
  });
  const deviceClass = getEonCityDeviceClass({ width, coarsePointer, deviceMemory, hardwareConcurrency });
  const minimumTargetPx = Math.max(EONAPP_W716_MIN_TARGET_PX, EON_NEXUS_W708_MIN_TARGET_PX, cityPreferences.touchTargetPx);
  return freeze({
    schema: EONAPP_W716_ACCESSIBILITY_LANGUAGE_INPUT_SCHEMA,
    viewport: responsive,
    language: resolvedLanguage,
    reading: freeze({
      documentLanguage: resolvedLanguage.code,
      direction: resolvedLanguage.dir,
      logicalPropertiesRequired: resolvedLanguage.logicalCssRequired,
      overflowPolicy: resolvedLanguage.overflowPolicy,
      textScale: cityPreferences.textScale,
      captionsPrimary: cityPreferences.captions
    }),
    layout: freeze({
      publicLayout: responsive.layout,
      orientation: responsive.orientation,
      shortLandscape: responsive.shortLandscape,
      standalone: responsive.displayMode === 'standalone',
      nexusMode: nexus.mode,
      nexusDetailPlacement: nexus.detailPlacement,
      safeAreasRequired: true,
      horizontalOverflowAllowed: false
    }),
    input: freeze({
      minimumTargetPx,
      keyboard: freeze({ supported: true, visibleFocusRequired: true, actions: keyboardActions() }),
      pointer: freeze({ supported: true, hoverRequired: false }),
      touch: freeze({ supported: true, coarsePointer: Boolean(coarsePointer), minimumTargetPx }),
      controller: freeze({ supported: true, remappable: true, connectAutomatically: false }),
      voice: freeze({ supportedWhenBrowserAvailable: true, pressToStart: true, typedFallbackRequired: true, startsAutomatically: false }),
      camera: freeze({ localOnly: true, explicitConsentRequired: true, startsAutomatically: false })
    }),
    sensory: freeze({
      reducedMotion: cityPreferences.reducedMotion,
      highContrast: cityPreferences.highContrast,
      captions: cityPreferences.captions,
      soundOptional: true,
      mutedByDefault: cityPreferences.muted,
      non3dFallback: cityPreferences.non3dFallbackEnabled
    }),
    device: freeze({ ...deviceClass, physicalDeviceCertified: false }),
    semanticAlternatives: EONAPP_W716_SEMANTIC_ALTERNATIVES,
    journeys: EONAPP_W716_CRITICAL_JOURNEYS,
    proof: freeze({
      sourceContractOnly: true,
      browserProofRequired: true,
      screenReaderProofRequired: true,
      zoomProofRequired: true,
      physicalDeviceProofRequired: true,
      evidenceWave: 'A15-I24/V06'
    }),
    boundaries: freeze({
      automaticNavigation: false,
      automaticCapture: false,
      automaticFullscreen: false,
      automaticOrientationLock: false,
      automaticControllerPolling: false,
      networkRequestCreated: false,
      localStorageWritten: false,
      deviceCertificationCreated: false
    })
  });
}

export function validateEonAppW716AccessibilityPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EONAPP_W716_ACCESSIBILITY_LANGUAGE_INPUT_SCHEMA) errors.push('schema');
  if (!plan.language?.chatGuideLanguage || !['ltr', 'rtl'].includes(plan.language?.dir)) errors.push('language');
  if (Number(plan.input?.minimumTargetPx) < EONAPP_W716_MIN_TARGET_PX) errors.push('target-size');
  if (!plan.input?.keyboard?.supported || !plan.input?.keyboard?.visibleFocusRequired || !plan.input?.touch?.supported || !plan.input?.controller?.remappable) errors.push('input-parity');
  if (!plan.input?.voice?.pressToStart || !plan.input?.voice?.typedFallbackRequired || plan.input?.voice?.startsAutomatically) errors.push('voice-boundary');
  if (!plan.input?.camera?.explicitConsentRequired || !plan.input?.camera?.localOnly || plan.input?.camera?.startsAutomatically) errors.push('camera-boundary');
  if (!plan.sensory?.soundOptional || !plan.sensory?.non3dFallback) errors.push('sensory-fallback');
  if (!Array.isArray(plan.semanticAlternatives) || plan.semanticAlternatives.length < 4) errors.push('semantic-alternatives');
  if (!Array.isArray(plan.journeys) || plan.journeys.length !== EONAPP_W716_CRITICAL_JOURNEYS.length) errors.push('journeys');
  if (!plan.proof?.browserProofRequired || !plan.proof?.screenReaderProofRequired || !plan.proof?.physicalDeviceProofRequired || plan.device?.physicalDeviceCertified) errors.push('proof-boundary');
  if (Object.values(plan.boundaries || {}).some((value) => value !== false)) errors.push('side-effect-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonAppW716AccessibilityLanguageInputTruth() {
  const nexus = getEonNexusW708ResponsiveInteractionTruth();
  return freeze({
    schema: `${EONAPP_W716_ACCESSIBILITY_LANGUAGE_INPUT_SCHEMA}.truth.v1`,
    fullProductLanguageCount: EON_FULL_PRODUCT_LANGUAGE_MATRIX.length,
    publishedInterfaceLanguageCount: EON_FULL_PRODUCT_LANGUAGE_MATRIX.length,
    chatGuideLanguageCount: EON_CHAT_GUIDE_LANGUAGE_MATRIX.length,
    rtlLanguages: freeze(EON_CHAT_GUIDE_LANGUAGE_MATRIX.filter((entry) => entry.dir === 'rtl').map((entry) => entry.code)),
    minimumTargetPx: EONAPP_W716_MIN_TARGET_PX,
    keyboardPointerTouchParity: nexus.mouseKeyboardTouchParity,
    controllerRemapping: true,
    typedVoiceFallback: true,
    semanticAlternativesRequired: true,
    non3dCityFallback: true,
    realBrowserProofRequired: true,
    assistiveTechnologyProofRequired: true,
    automaticCapture: false,
    automaticNavigation: false,
    performsNetworkRequest: false,
    writesStorage: false,
    certifiesDevice: false
  });
}

export default freeze({
  EONAPP_W716_ACCESSIBILITY_LANGUAGE_INPUT_SCHEMA,
  EONAPP_W716_MIN_TARGET_PX,
  EONAPP_W716_CRITICAL_JOURNEYS,
  EONAPP_W716_SEMANTIC_ALTERNATIVES,
  resolveEonAppW716Language,
  buildEonAppW716AccessibilityPlan,
  validateEonAppW716AccessibilityPlan,
  getEonAppW716AccessibilityLanguageInputTruth
});
