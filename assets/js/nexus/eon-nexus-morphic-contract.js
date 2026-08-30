/**
 * W661A — Adaptive Morphic Contract.
 *
 * Resolves how the same privacy-projected EON NEXUS state should present on a
 * route and device. This module owns no assistant, task, project, approval or
 * renderer state. It never opens a route or starts work.
 */
import { getEonNexusCapability } from './eon-nexus-capability.js';

export const EON_NEXUS_MORPHIC_SCHEMA = 'eon.nexus.morphic.w661a.v1';
export const EON_NEXUS_MORPHIC_MAX_PRIMARY_CONTROLS = 3;

const freeze = Object.freeze;
const PRODUCTIVE_PAGES = freeze(new Set([
  'forge', 'projects', 'workspace', 'local-ai', 'library', 'automations',
  'create', 'market', 'preview-studio', 'apps', 'realm-studio', 'insights'
]));
const RESTRAINED_PAGES = freeze(new Set([
  'billing', 'vault', 'capsule', 'settings', 'profile', 'eon-keys',
  'support', 'help', 'install', 'retired-campaigns'
]));

function cleanPage(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
}

function matches(environment, query) {
  try { return environment?.matchMedia?.(query)?.matches === true; } catch { return false; }
}

export function getEonNexusMorphicContract({
  page = '',
  context = {},
  snapshot = {},
  environment = globalThis,
  userPreference = 'auto',
  capability = null
} = {}) {
  const pageId = cleanPage(page || context?.id || snapshot?.surface?.id || snapshot?.surface?.label || '');
  const resolvedCapability = capability || getEonNexusCapability({ environment, userPreference });
  const compactViewport = matches(environment, '(max-width: 899px)');
  const coarsePointer = matches(environment, '(pointer: coarse)');
  const hidden = environment?.document?.hidden === true || resolvedCapability.hidden === true;
  const reduced = resolvedCapability.reducedMotion === true || resolvedCapability.recommendedMode === 'static';
  const restrained = context?.presentation === 'restrained' || RESTRAINED_PAGES.has(pageId) || context?.allowLiveNexus === false;
  const productive = !restrained && (PRODUCTIVE_PAGES.has(pageId) || context?.allowLiveNexus === true);
  const state = String(snapshot?.eonbot?.state || 'ready');
  const requiresAttention = snapshot?.approval?.pending === true || ['error', 'offline'].includes(state);

  let presentation = restrained ? 'restrained' : 'compact';
  if (hidden) presentation = 'paused';
  else if (reduced) presentation = restrained ? 'restrained-static' : 'static';
  else if (productive) presentation = compactViewport ? 'immersive-drawer' : 'immersive';

  const directImmersiveOpen = productive && !hidden && !requiresAttention;
  const liveMode = compactViewport || coarsePointer ? 'full' : 'full';
  const renderer = productive && !hidden && !reduced && resolvedCapability.webgl ? 'babylon-living-core' : 'dom-static';

  return freeze({
    schema: EON_NEXUS_MORPHIC_SCHEMA,
    page: pageId || 'app',
    productive,
    restrained,
    presentation,
    liveMode,
    renderer,
    directImmersiveOpen,
    panelFirst: !directImmersiveOpen,
    maxPrimaryControls: EON_NEXUS_MORPHIC_MAX_PRIMARY_CONTROLS,
    compactViewport,
    coarsePointer,
    reducedMotion: reduced,
    hidden,
    motionActive: !hidden && !reduced,
    rendererPaused: hidden,
    staticFallback: true,
    allowsLiveNexus: productive,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false,
    reason: hidden
      ? 'Page hidden; Living Core rendering must pause.'
      : restrained
        ? 'Sensitive or support-oriented route keeps the restrained Pulse.'
        : reduced
          ? 'Reduced-motion or static preference keeps the same controls with a static Core.'
          : compactViewport
            ? 'Productive route opens the immersive mobile Living Core.'
            : 'Productive route opens the immersive Living Core directly.'
  });
}

export function getEonNexusMorphicTruth() {
  return freeze({
    samePrivacyProjectedState: true,
    secondAssistant: false,
    secondProjectStore: false,
    maximumPrimaryControls: EON_NEXUS_MORPHIC_MAX_PRIMARY_CONTROLS,
    productiveRoutesDirectImmersive: true,
    billingRestrained: true,
    reducedMotionStatic: true,
    hiddenRendererPaused: true,
    userActionRequired: true,
    automaticWork: false,
    automaticNavigation: false,
    automaticApproval: false
  });
}

export default freeze({
  EON_NEXUS_MORPHIC_SCHEMA,
  EON_NEXUS_MORPHIC_MAX_PRIMARY_CONTROLS,
  getEonNexusMorphicContract,
  getEonNexusMorphicTruth
});
