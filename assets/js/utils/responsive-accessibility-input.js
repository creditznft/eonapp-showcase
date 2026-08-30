/**
 * W634 — responsive, accessibility and input capability bridge.
 *
 * This module only describes the current browser surface and the user's latest
 * explicit input. It never starts audio, requests microphone/camera/sensors,
 * locks orientation, enters fullscreen, connects a controller, or transmits.
 */

export const EON_LAYOUT_PROFILES = Object.freeze(['compact', 'standard', 'wide']);
export const EON_INPUT_MODES = Object.freeze(['keyboard', 'pointer', 'touch', 'controller', 'voice', 'unknown']);
export const EON_ORIENTATIONS = Object.freeze(['portrait', 'landscape']);
export const EON_DISPLAY_MODES = Object.freeze(['browser', 'standalone']);

const asNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const matches = (environment, query) => {
  try { return Boolean(environment?.matchMedia?.(query)?.matches); } catch { return false; }
};

export function getEonResponsiveInputSnapshot(environment = globalThis.window) {
  const width = Math.max(0, asNumber(environment?.innerWidth));
  const height = Math.max(0, asNumber(environment?.innerHeight));
  const orientation = width > height ? 'landscape' : 'portrait';
  const coarsePointer = matches(environment, '(pointer: coarse)');
  const noHover = matches(environment, '(hover: none)');
  const standalone = matches(environment, '(display-mode: standalone)') || Boolean(environment?.navigator?.standalone);
  const reducedMotion = matches(environment, '(prefers-reduced-motion: reduce)');
  const moreContrast = matches(environment, '(prefers-contrast: more)') || matches(environment, '(forced-colors: active)');
  const layout = width <= 680 ? 'compact' : width <= 1180 ? 'standard' : 'wide';
  const shortLandscape = orientation === 'landscape' && height > 0 && height <= 520;
  return Object.freeze({
    schema: 'eonapp.responsive-input-snapshot.w634.v1',
    width,
    height,
    layout,
    orientation,
    displayMode: standalone ? 'standalone' : 'browser',
    coarsePointer,
    noHover,
    reducedMotion,
    moreContrast,
    shortLandscape,
    physicalDeviceCertified: false
  });
}

function writeSnapshot(root, snapshot) {
  if (!root?.dataset) return;
  root.dataset.eonLayout = snapshot.layout;
  root.dataset.eonOrientation = snapshot.orientation;
  root.dataset.eonDisplayMode = snapshot.displayMode;
  root.dataset.eonCoarsePointer = String(snapshot.coarsePointer);
  root.dataset.eonReducedMotion = String(snapshot.reducedMotion);
  root.dataset.eonMoreContrast = String(snapshot.moreContrast);
  root.dataset.eonShortLandscape = String(snapshot.shortLandscape);
}

function getFieldName(field) {
  const id = String(field?.id || '');
  if (id && typeof document !== 'undefined') {
    const label = document.querySelector(`label[for="${globalThis.CSS?.escape ? globalThis.CSS.escape(id) : id}"]`);
    const labelText = String(label?.textContent || '').replace(/\s+/g, ' ').trim();
    if (labelText) return labelText;
  }
  const wrapped = field?.closest?.('label');
  const wrappedText = String(wrapped?.textContent || '').replace(/\s+/g, ' ').trim();
  return wrappedText || String(field?.getAttribute?.('aria-label') || field?.name || 'this field');
}

export function bindEonResponsiveAccessibilityInput({
  environment = globalThis.window,
  documentRef = globalThis.document,
  announce = null
} = {}) {
  if (!environment || !documentRef?.documentElement) return Object.freeze({ ok: false, reason: 'browser-document-required' });
  const marker = '__eonW634ResponsiveAccessibilityInput';
  if (environment[marker]?.ok) return environment[marker];

  const cleanups = [];
  let inputMode = 'unknown';
  const root = documentRef.documentElement;
  const body = documentRef.body;
  const setInputMode = (next) => {
    if (!EON_INPUT_MODES.includes(next) || next === inputMode) return;
    inputMode = next;
    root.dataset.eonInput = next;
    if (body?.dataset) body.dataset.eonInput = next;
  };
  const refresh = () => {
    const snapshot = getEonResponsiveInputSnapshot(environment);
    writeSnapshot(root, snapshot);
    if (body) writeSnapshot(body, snapshot);
    return snapshot;
  };
  refresh();

  const onKeydown = (event) => {
    if (event?.isComposing) return;
    setInputMode('keyboard');
  };
  const onPointer = (event) => setInputMode(event?.pointerType === 'touch' ? 'touch' : 'pointer');
  const onTouch = () => setInputMode('touch');
  const onGamepad = () => setInputMode('controller');
  const onVoice = () => setInputMode('voice');
  const onInvalid = (event) => {
    const field = event?.target;
    if (!field?.setAttribute) return;
    field.setAttribute('aria-invalid', 'true');
    const message = String(field.validationMessage || '').trim();
    if (typeof announce === 'function') announce(`Check ${getFieldName(field)}${message ? `: ${message}` : '.'}`, 'assertive');
  };
  const onInput = (event) => {
    const field = event?.target;
    if (field?.checkValidity?.()) field.removeAttribute?.('aria-invalid');
  };

  const listen = (target, type, handler, options) => {
    target?.addEventListener?.(type, handler, options);
    cleanups.push(() => target?.removeEventListener?.(type, handler, options));
  };
  listen(documentRef, 'keydown', onKeydown, true);
  listen(documentRef, 'pointerdown', onPointer, { capture: true, passive: true });
  listen(documentRef, 'touchstart', onTouch, { capture: true, passive: true });
  listen(documentRef, 'invalid', onInvalid, true);
  listen(documentRef, 'input', onInput, true);
  listen(environment, 'resize', refresh, { passive: true });
  listen(environment, 'orientationchange', refresh, { passive: true });
  listen(environment, 'gamepadconnected', onGamepad);
  listen(environment, 'eon:voice-input-start', onVoice);

  const mediaQueries = [
    '(pointer: coarse)',
    '(hover: none)',
    '(display-mode: standalone)',
    '(prefers-reduced-motion: reduce)',
    '(prefers-contrast: more)',
    '(forced-colors: active)'
  ];
  for (const query of mediaQueries) {
    const media = environment.matchMedia?.(query);
    media?.addEventListener?.('change', refresh);
    cleanups.push(() => media?.removeEventListener?.('change', refresh));
  }

  const binding = Object.freeze({
    ok: true,
    schema: 'eonapp.responsive-accessibility-input-binding.w634.v1',
    networkRequestCreated: false,
    mediaPermissionRequested: false,
    orientationLocked: false,
    fullscreenRequested: false,
    controllerPolled: false,
    snapshot: refresh,
    setVoiceInputActive: () => setInputMode('voice'),
    dispose() {
      cleanups.splice(0).forEach((cleanup) => cleanup());
      try { delete environment[marker]; } catch {}
      return Object.freeze({ disposed: true });
    }
  });
  environment[marker] = binding;
  return binding;
}
