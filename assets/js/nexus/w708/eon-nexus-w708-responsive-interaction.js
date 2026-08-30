/**
 * W708 — responsive NEXUS interaction authority.
 *
 * This module contains only deterministic layout, input and consent policy.
 * It owns no work data, starts no media capture and performs no navigation.
 */
export const EON_NEXUS_W708_RESPONSIVE_INTERACTION_SCHEMA = 'eon.nexus.responsive-interaction.w708.v1';
export const EON_NEXUS_W708_LAYOUT_MODES = Object.freeze(['compact', 'split', 'full', 'in-world']);
export const EON_NEXUS_W708_MIN_TARGET_PX = 48;

const freeze = Object.freeze;
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, finite(value, minimum)));

function normalizeRequestedMode(value = 'auto') {
  const mode = String(value || 'auto').toLowerCase();
  return mode === 'auto' || EON_NEXUS_W708_LAYOUT_MODES.includes(mode) ? mode : 'auto';
}

export function resolveEonNexusW708ResponsiveLayout({
  width = 1280,
  height = 800,
  requestedMode = 'auto',
  embeddedInWorld = false,
  coarsePointer = false,
  reducedMotion = false
} = {}) {
  const viewportWidth = clamp(width, 240, 7680);
  const viewportHeight = clamp(height, 320, 4320);
  const requested = normalizeRequestedMode(requestedMode);
  const constrainedHeight = viewportHeight < 620;
  const compactViewport = viewportWidth <= 560 || (viewportWidth <= 760 && constrainedHeight);
  const singleColumnViewport = viewportWidth < 900 || viewportHeight < 560;
  let mode = 'split';
  if (embeddedInWorld || requested === 'in-world') mode = 'in-world';
  else if (compactViewport) mode = 'compact';
  else if (requested === 'full' || singleColumnViewport) mode = 'full';
  else if (requested === 'compact') mode = 'compact';
  else mode = 'split';

  const primaryActionLimit = 3;
  const detailPlacement = mode === 'compact' ? 'bottom-sheet'
    : mode === 'in-world' ? 'context-dock'
      : mode === 'full' ? 'responsive-sidecar' : 'fixed-sidecar';
  const canvasMinimumHeight = mode === 'compact' ? 240 : mode === 'full' ? 320 : mode === 'in-world' ? 300 : 420;
  const modal = mode === 'compact' || mode === 'full';
  return freeze({
    schema: EON_NEXUS_W708_RESPONSIVE_INTERACTION_SCHEMA,
    mode,
    requestedMode: requested,
    viewport: freeze({ width: viewportWidth, height: viewportHeight, compact: compactViewport, singleColumn: singleColumnViewport }),
    detailPlacement,
    primaryActionLimit,
    advancedActionsPlacement: 'contextual-more',
    minimumTargetPx: EON_NEXUS_W708_MIN_TARGET_PX,
    canvasMinimumHeight,
    modal,
    focusTrapRequired: modal,
    canToggleFullScreen: !embeddedInWorld && !compactViewport,
    pointerModel: coarsePointer ? 'coarse' : 'fine',
    mouseSupported: true,
    touchSupported: true,
    keyboardSupported: true,
    reducedMotion: reducedMotion === true,
    automaticNavigation: false,
    automaticCapture: false
  });
}

export function interpretEonNexusW708KeyboardInput(event = {}, { editable = false } = {}) {
  const key = String(event.key || '');
  const modifier = event.ctrlKey === true || event.metaKey === true;
  if (editable) {
    if (key === 'Escape') return freeze({ ok: true, action: 'close', preventDefault: true });
    return freeze({ ok: false, reason: 'editable-target' });
  }
  if (modifier && key.toLowerCase() === 'z') {
    return freeze({ ok: true, action: event.shiftKey === true ? 'redo' : 'undo', preventDefault: true });
  }
  if (key === 'Escape') return freeze({ ok: true, action: 'close', preventDefault: true });
  if (key === 'ArrowLeft') return freeze({ ok: true, action: 'rotate', delta: -18, preventDefault: true });
  if (key === 'ArrowRight') return freeze({ ok: true, action: 'rotate', delta: 18, preventDefault: true });
  if (key === 'ArrowUp' || key === '+' || key === '=') return freeze({ ok: true, action: 'zoom', delta: 0.1, preventDefault: true });
  if (key === 'ArrowDown' || key === '-' || key === '_') return freeze({ ok: true, action: 'zoom', delta: -0.1, preventDefault: true });
  if (key === '0') return freeze({ ok: true, action: 'reset-view', preventDefault: true });
  if (key === 'Enter' || key === ' ') return freeze({ ok: true, action: 'activate-selected', preventDefault: key === ' ' });
  if (key === '/') return freeze({ ok: true, action: 'focus-command', preventDefault: true });
  return freeze({ ok: false, reason: 'unmapped-key' });
}

export function resolveEonNexusW708CapturePolicy({
  kind = 'voice',
  explicitUserAction = false,
  available = false,
  localOnly = false
} = {}) {
  const captureKind = kind === 'camera' ? 'camera' : 'voice';
  if (!explicitUserAction) return freeze({ ok: false, kind: captureKind, reason: 'explicit-user-action-required', startsCapture: false });
  if (!available) return freeze({ ok: false, kind: captureKind, reason: `${captureKind}-unavailable`, startsCapture: false });
  if (captureKind === 'camera' && !localOnly) return freeze({ ok: false, kind: captureKind, reason: 'local-only-camera-required', startsCapture: false });
  return freeze({
    ok: true,
    kind: captureKind,
    reason: null,
    startsCapture: true,
    pressToStart: true,
    automatic: false,
    cameraFramesUploaded: captureKind === 'camera' ? false : null
  });
}

export function getEonNexusW708ResponsiveInteractionTruth() {
  return freeze({
    schema: EON_NEXUS_W708_RESPONSIVE_INTERACTION_SCHEMA,
    compactSplitFullAndInWorld: true,
    deviceAutoFit: true,
    maximumPersistentActions: 3,
    advancedActionsContextual: true,
    minimumTargetPx: EON_NEXUS_W708_MIN_TARGET_PX,
    mouseKeyboardTouchParity: true,
    undoRedoReset: true,
    voicePressToStart: true,
    cameraExplicitConsent: true,
    cameraLocalOnly: true,
    captureStartsAutomatically: false,
    automaticNavigation: false,
    startsAiWork: false,
    secondStateStore: false
  });
}

export default freeze({
  EON_NEXUS_W708_RESPONSIVE_INTERACTION_SCHEMA,
  EON_NEXUS_W708_LAYOUT_MODES,
  EON_NEXUS_W708_MIN_TARGET_PX,
  resolveEonNexusW708ResponsiveLayout,
  interpretEonNexusW708KeyboardInput,
  resolveEonNexusW708CapturePolicy,
  getEonNexusW708ResponsiveInteractionTruth
});
