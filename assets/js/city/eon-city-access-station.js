/**
 * W649B — authenticated-only EON City access station.
 *
 * The full Babylon module is dynamically imported only after the safe City
 * access endpoint explicitly allows it. This is a boot/bandwidth reduction
 * control, not a substitute for edge-gated heavy asset delivery.
 */
import {
  EON_CITY_ACCESS_ROUTE,
  EON_CITY_GOOGLE_LOGIN_ROUTE,
  EON_CITY_ACCESS_SCHEMA,
  isEonCityHeavyBootAllowed
} from '../../../config/w554-eon-city-access-project-portals-contract.mjs';
import { bindEonCityClientLoadSequence, createEonCityClientLoadSequence, mountEonCityClientLoadScreen } from './eon-city-client-load-sequence.js';
import { inspectEonCityAssetCache, isEonCityAssetPathCached } from './eon-city-asset-cache-policy.js';
import { createEonCityRuntimeStateMachine } from './eon-city-runtime-state-machine.js';
import { getEonCityEntryExperience } from './eon-city-entry-experience.js';
import { mountBabylonCityProof as mountCanvasRecovery } from './eon-city-play-lightweight.js';
import { bindEonCityDirectionalControls } from './eon-city-input-contract.js';
import { mountCityPlayAnalogJoystick } from './eon-city-immersive-controls.js';
import { resolveEonCityQualityAuthority } from './eon-city-quality-authority.js';
import { refreshEonOfflineState } from '../eon-offline-manager.js';
import {
  createEonCityRuntimeIdentitySnapshot,
  ensureEonCityAccessMountIdentity,
  ensureEonCityDocumentIdentity,
  installEonCityRuntimeReadinessInspector,
  normalizeEonCityMountRequest,
  recordEonCityRuntimeReadinessEvent
} from './eon-city-runtime-identity.js';

export const EON_CITY_AUTO_LOADER_STYLESHEET = '/assets/css/eon-city-auto-loader.css';
export const EON_CITY_AUTHORED_REVEAL_TIMEOUT_MS = 12_000;
export const EON_CITY_FIRST_FRAME_TIMEOUT_MS = 8_000;
export const EON_CITY_STAGE4_DIAGNOSTIC_SCHEMA = 'eon.city.stage4.diagnostic.v1';

function safeDiagnosticCode(value = '', fallback = 'unknown') {
  return String(value || fallback).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 80) || fallback;
}

function safeDiagnosticReason(value = '') {
  const text = String(value || '').toLowerCase();
  if (text.includes('import')) return 'dynamic-import-failed';
  if (text.includes('scene')) return 'scene-create-failed';
  if (text.includes('engine') || text.includes('webgl')) return 'engine-create-failed';
  if (text.includes('asset') || text.includes('gltf') || text.includes('glb')) return 'critical-asset-failed';
  if (text.includes('timeout')) return 'startup-timeout';
  return 'full-runtime-failed';
}

/** Public, privacy-safe Stage-4 evidence: never carry raw exceptions, URLs or account data. */
export function createEonCityStage4Diagnostic({ phase = 'unknown', outcome = 'pending', reason = '', fallbackSelected = false, coreLoaded = false, partialRuntimeDisposed = false } = {}) {
  const normalizedOutcome = safeDiagnosticCode(outcome);
  const normalizedReason = normalizedOutcome === 'failed'
    ? safeDiagnosticReason(reason)
    : safeDiagnosticCode(reason, normalizedOutcome === 'started' ? 'in-progress' : 'none');
  return Object.freeze({
    schema: EON_CITY_STAGE4_DIAGNOSTIC_SCHEMA,
    phase: safeDiagnosticCode(phase),
    outcome: normalizedOutcome,
    reason: normalizedReason,
    fallbackSelected: fallbackSelected === true,
    coreLoaded: coreLoaded === true,
    partialRuntimeDisposed: partialRuntimeDisposed === true
  });
}

export { resolveEonCityQualityAuthority } from './eon-city-quality-authority.js';

export function ensureEonCityAutoLoaderStyles(documentRef = globalThis.document) {
  if (!documentRef?.head?.append) return null;
  const existing = documentRef.querySelector?.(`link[data-eon-city-auto-loader-styles="true"]`);
  if (existing) return existing;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = EON_CITY_AUTO_LOADER_STYLESHEET;
  link.dataset.eonCityAutoLoaderStyles = 'true';
  documentRef.head.append(link);
  return link;
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

export function normalizeEonCityLoginRoute(value = EON_CITY_GOOGLE_LOGIN_ROUTE) {
  const candidate = String(value || '').trim();
  // The access endpoint may describe identity state, but it is not navigation
  // authority. Keep the CTA pinned to the reviewed same-origin auth start path.
  return candidate === EON_CITY_GOOGLE_LOGIN_ROUTE ? candidate : EON_CITY_GOOGLE_LOGIN_ROUTE;
}

function setAccessRouteState(root, state = 'access-checking') {
  const normalized = String(state || 'access-checking').trim().toLowerCase() || 'access-checking';
  if (root?.dataset) root.dataset.eonCityRouteState = normalized;
  try {
    if (document?.body?.dataset) document.body.dataset.eonCityRouteState = normalized;
  } catch {}
  return normalized;
}


export function inspectEonCityDeviceProfile({
  navigatorRef = globalThis.navigator,
  documentRef = globalThis.document,
  matchMediaImpl = globalThis.matchMedia,
  devicePixelRatio = globalThis.devicePixelRatio,
  locationRef = globalThis.location,
  storageRef = (() => { try { return globalThis.localStorage; } catch { return null; } })(),
  qualityPreference = ''
} = {}) {
  const memoryGb = Math.max(0, Number(navigatorRef?.deviceMemory || 0));
  const logicalCores = Math.max(0, Number(navigatorRef?.hardwareConcurrency || 0));
  const connection = navigatorRef?.connection || navigatorRef?.mozConnection || navigatorRef?.webkitConnection || {};
  const saveData = connection?.saveData === true;
  const effectiveType = String(connection?.effectiveType || 'unknown');
  const reducedMotion = Boolean(matchMediaImpl?.('(prefers-reduced-motion: reduce)')?.matches);
  const pixelRatio = Math.max(1, Math.min(3, Number(devicePixelRatio || 1)));
  let webgl = 'unknown';
  let gpuRenderer = '';
  try {
    const canvas = documentRef?.createElement?.('canvas');
    const webgl2Context = canvas?.getContext?.('webgl2', { powerPreference: 'high-performance' });
    const context = webgl2Context
      || canvas?.getContext?.('webgl', { powerPreference: 'high-performance' })
      || canvas?.getContext?.('experimental-webgl');
    if (context) {
      webgl = webgl2Context ? 'webgl2' : 'webgl1';
      const debug = context.getExtension?.('WEBGL_debug_renderer_info');
      gpuRenderer = String(debug ? context.getParameter?.(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter?.(context.RENDERER) || '').replace(/\s+/g, ' ').trim().slice(0, 160);
    } else if (canvas) webgl = 'unavailable';
  } catch { webgl = 'unknown'; }

  const softwareRenderer = /swiftshader|llvmpipe|software|basic render|mesa offscreen/i.test(gpuRenderer);
  const discreteGpu = /\b(?:nvidia|geforce|quadro|radeon\s+(?:rx|pro)|arc\s+a\d|apple\s+m[1-9])\b/i.test(gpuRenderer);
  let storedPreference = '';
  try { storedPreference = String(storageRef?.getItem?.('eon:city:quality-preference:v1') || ''); } catch {}
  let queryPreference = '';
  try { queryPreference = String(new URLSearchParams(locationRef?.search || '').get('cityQuality') || ''); } catch {}
  const requestedPreference = [qualityPreference, queryPreference, storedPreference]
    .map((value) => String(value || '').trim().toLowerCase())
    .find((value) => ['cinematic', 'balanced', 'lite', 'auto'].includes(value)) || 'auto';

  // Reduced motion changes animation/effects only. It must not silently replace
  // high-resolution geometry on a capable gaming machine.
  const constrained = saveData || softwareRenderer || (memoryGb > 0 && memoryGb <= 4) || (logicalCores > 0 && logicalCores <= 4) || webgl === 'webgl1' || webgl === 'unavailable';
  const knownMemoryPowerful = memoryGb >= 8 && logicalCores >= 8;
  const desktopGpuPowerful = discreteGpu && logicalCores >= 6 && (memoryGb === 0 || memoryGb >= 6);
  const unknownMemoryPowerful = memoryGb === 0 && logicalCores >= 12;
  const automaticPowerful = !constrained && webgl === 'webgl2' && (knownMemoryPowerful || desktopGpuPowerful || unknownMemoryPowerful);

  let quality = constrained ? 'lite' : automaticPowerful ? 'cinematic' : 'balanced';
  let selection = constrained ? 'safety-fallback' : automaticPowerful ? 'capability-auto' : 'balanced-auto';
  if (!softwareRenderer && webgl !== 'unavailable' && requestedPreference !== 'auto') {
    quality = requestedPreference;
    selection = queryPreference ? 'query-preference' : qualityPreference ? 'supplied-preference' : 'stored-preference';
  }
  if (saveData && quality === 'cinematic') {
    quality = 'lite';
    selection = 'data-saver-safety';
  }

  const label = quality === 'cinematic' ? 'High detail' : quality === 'lite' ? 'Performance mode' : 'Balanced detail';
  const parts = [label];
  if (webgl !== 'unknown') parts.push(webgl.toUpperCase());
  if (gpuRenderer) parts.push(gpuRenderer);
  if (logicalCores > 0) parts.push(`${logicalCores} threads`);
  if (memoryGb > 0) parts.push(`${memoryGb} GB device memory`);
  else if (quality === 'cinematic') parts.push('desktop GPU/CPU capability');
  if (reducedMotion) parts.push('reduced animation');
  if (saveData) parts.push('data saver');
  return Object.freeze({
    quality,
    label,
    summary: parts.join(' · '),
    selection,
    requestedPreference,
    webgl,
    gpuRenderer,
    discreteGpu,
    softwareRenderer,
    memoryGb,
    logicalCores,
    reducedMotion,
    saveData,
    effectiveType,
    pixelRatio
  });
}

export function normalizeEonCityAccessPayload(value = {}) {
  const candidate = value && typeof value === 'object' ? value : {};
  return Object.freeze({
    schema: String(candidate.schema || ''),
    mode: 'authenticated-play',
    accessState: String(candidate.accessState || (candidate.canBootFullCity === true ? 'authorized' : candidate.identityAvailable === true ? 'signed-out' : 'identity-unavailable')),
    requiresIdentity: candidate.requiresIdentity === true,
    identityAvailable: candidate.identityAvailable === true,
    signedIn: candidate.signedIn === true,
    ownerWorldReview: candidate.ownerWorldReview === true,
    offlineAuthorized: candidate.offlineAuthorized === true,
    offlineReceiptExpiresAt: Math.max(0, Number(candidate.offlineReceiptExpiresAt || 0)),
    offlinePacks: Object.freeze(Array.isArray(candidate.offlinePacks) ? candidate.offlinePacks.map((item) => String(item || '')).filter(Boolean).slice(0, 4) : []),
    canBootFullCity: candidate.canBootFullCity === true,
    heavyRuntimeImportAllowed: candidate.heavyRuntimeImportAllowed === true,
    staticPortalOnly: candidate.staticPortalOnly === true || candidate.canBootFullCity !== true,
    publicPreviewAvailable: false,
    loginRoute: normalizeEonCityLoginRoute(candidate.loginRoute),
    reason: String(candidate.reason || 'EON Universe access could not be confirmed.'),
    dataCustody: String(candidate.dataCustody || 'Google Login is identity only. Local work remains in this browser unless you explicitly create an encrypted backup.')
  });
}

export function describeEonCityAccessView(payload = {}) {
  const access = normalizeEonCityAccessPayload(payload);
  if (isEonCityHeavyBootAllowed(access)) return Object.freeze({ kind: 'boot', title: 'Opening your private Command Hub…', detail: 'Choosing a safe device profile and preparing one complete productive City atrium.' });
  if (access.identityAvailable) return Object.freeze({ kind: 'login', title: 'Your work becomes a place.', detail: 'Sign in to open your private EON City Command Hub.' });
  return Object.freeze({ kind: 'unavailable', title: 'EON City is temporarily unavailable', detail: access.reason });
}

function renderAccessStation(root, view, payload) {
  const entry = getEonCityEntryExperience();
  const actions = view.kind === 'login'
    ? `<a class="eon-play-primary" data-eon-city-google-login href="${escapeHtml(payload.loginRoute)}">Continue with Google</a><a class="eon-play-secondary" href="/">Back to EONBOT</a>`
    : view.kind === 'unavailable'
      ? `<button class="eon-play-primary" type="button" data-eon-city-access-retry>Try again</button><a class="eon-play-secondary" href="/">Back to EONBOT</a>`
      : `<p class="eon-city-access-enter-note">Automatic private entry begins as soon as the first stable 3D frame and essential City visuals are ready.</p><a class="eon-play-secondary" href="/">Back to EONBOT</a>`;
  const highlights = entry.highlights.map((item) => `<li data-eon-city-entry-highlight="${escapeHtml(item.id)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></li>`).join('');
  const trust = entry.trustPoints.map((item) => `<li data-eon-city-entry-trust="${escapeHtml(item.id)}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></li>`).join('');
  root.dataset.eonCityAccessState = view.kind;
  setAccessRouteState(root, view.kind === 'boot' ? 'booting' : view.kind === 'unavailable' ? 'recovery' : view.kind);
  root.dataset.eonCityAccessMode = escapeHtml(payload.mode);
  root.dataset.eonCityEntryExperience = entry.schema;
  root.innerHTML = `
    <section class="eon-play-gate eon-city-access-gate" aria-labelledby="eon-city-access-title">
      <div class="eon-city-access-hero-copy">
        <p class="eon-play-kicker">${escapeHtml(entry.promise.kicker)}</p>
        <h1 id="eon-city-access-title">${escapeHtml(view.kind === 'login' ? entry.promise.title : view.title)}</h1>
        <p class="eon-city-access-lead">${escapeHtml(view.kind === 'login' ? entry.promise.detail : view.detail)}</p>
      </div>
      <div class="eon-city-access-world" aria-hidden="true"><span class="eon-city-access-orbit eon-city-access-orbit-a"></span><span class="eon-city-access-orbit eon-city-access-orbit-b"></span><span class="eon-city-access-skyline"></span><span class="eon-city-access-beacon"></span><span class="eon-city-access-rain"></span><span class="eon-city-access-world-label">COMMAND HUB</span></div>
      <section class="eon-city-access-awaits" aria-labelledby="eon-city-access-awaits-title"><h2 id="eon-city-access-awaits-title">Inside EON City</h2><ul>${highlights}</ul></section>
      <div class="eon-play-gate-actions eon-city-access-actions">${actions}</div>
      <ul class="eon-city-access-trust" aria-label="EON City trust promises">${trust}</ul>
      <p class="eon-city-access-note">${escapeHtml(payload.dataCustody)}</p>
    </section>`;
}

function renderProgressiveCity(root, deviceProfile = {}) {
  // W741: the Command Hub runtime is the sole owner of City launch controls.
  // Remove any stale fixed menu left by an interrupted/restarted runtime before
  // replacing the session DOM. A normal runtime destroy also performs this
  // cleanup, but the entry shell must remain safe after context loss or a
  // partially completed mount.
  const documentRef = root?.ownerDocument || globalThis.document;
  documentRef?.querySelectorAll?.('body > [data-eon-city-command-menu]')?.forEach?.((node) => node.remove());
  root.dataset.eonCityAccessState = 'playable-core';
  root.dataset.eonCityEntryState = 'PLAYABLE_CORE';
  root.dataset.eonCityRenderer = 'babylon-core';
  root.dataset.eonCityBootStage = 'BABYLON_CORE_MOUNTING';
  setAccessRouteState(root, 'running');
  root.innerHTML = `
    <section class="eon-play-session eon-city-reduced-session eon-city-full-session" aria-label="EON City compact Command Hub gameplay">
      <div class="eon-play-canvas-host eon-city-reduced-world" data-eon-city-reduced-world></div>
      <div class="eon-city-reduced-loading-overlay" data-eon-city-loading-overlay></div>
      <header class="eon-play-hud eon-play-hud-top eon-city-reduced-hud eon-city-reduced-hud-top">
        <div class="eon-play-brand eon-city-reduced-brand"><p class="eon-play-kicker">EON City · Command Hub</p><strong data-eon-city-district-title>Orientation Core</strong><p class="eon-city-reduced-quality" data-eon-city-quality-badge>${escapeHtml(deviceProfile.label || 'Balanced detail')}</p><p class="eon-city-reduced-runtime-status" data-eon-city-reduced-status aria-live="polite">Checking saved City art · preparing Command Hub…</p></div>
        <div class="eon-play-hud-actions eon-city-reduced-actions"><button type="button" data-eon-city-retry-3d hidden tabindex="-1" aria-hidden="true">Restart 3D</button><a href="/" data-eon-city-exit>Exit City</a></div>
      </header>
      <aside class="eon-play-hud eon-play-hud-objective eon-city-reduced-objective"><strong data-eon-city-reduced-objective>Choose a station or open City Menu</strong><span data-eon-city-reduced-position>Player x 0.00 · z 8.80</span></aside>
      <div class="eon-play-joystick eon-city-reduced-touch" data-eon-city-touch-controls data-eon-play-joystick role="group" aria-label="Analogue touch movement joystick">
        <span class="eon-play-joystick-core" aria-hidden="true"></span><span class="eon-play-joystick-knob" data-eon-play-joystick-knob aria-hidden="true"></span><span class="eon-play-joystick-label" aria-hidden="true">Move</span>
      </div>
      <div class="eon-play-touch-controls eon-city-reduced-dpad" data-eon-city-touch-dpad hidden aria-label="Alternative touch direction controls">
        <button type="button" data-eon-city-move="forward" aria-label="Move forward">↑</button><button type="button" data-eon-city-move="left" aria-label="Move left">←</button><button type="button" data-eon-city-move="backward" aria-label="Move backward">↓</button><button type="button" data-eon-city-move="right" aria-label="Move right">→</button>
      </div>
      <button type="button" class="eon-city-sprint-toggle" data-eon-city-sprint-toggle aria-pressed="false" aria-label="Toggle sprint">Sprint</button>
    </section>`;

  // W660J: the authenticated progressive entry shares the app shell. Keep the
  // movement surface in a deterministic hit-test layer even when trailing CSS
  // is optimized, delayed, or rejected by the browser. The loading artwork is
  // informational and must never intercept City input.
  const loadingOverlay = root.querySelector('[data-eon-city-loading-overlay]');
  const touchControls = root.querySelector('[data-eon-city-touch-controls]');
  const touchDpad = root.querySelector('[data-eon-city-touch-dpad]');
  if (loadingOverlay) loadingOverlay.style.pointerEvents = 'none';
  if (touchControls) {
    Object.assign(touchControls.style, {
      position: 'absolute',
      zIndex: '20',
      pointerEvents: 'auto',
      touchAction: 'none'
    });
  }
  touchDpad?.querySelectorAll('button[data-eon-city-move]').forEach((button) => { button.type = 'button'; });

}

async function mountProgressiveCityNow(root, { importCore, runtimeMachine, payload, sequence, loaderFacts, loaderOptions, deviceProfile }, mountRequestInput = {}) {
  const mountRequest = normalizeEonCityMountRequest(mountRequestInput, {
    defaultReason: '',
    defaultOwner: 'eon-city-access-station',
    defaultCaller: 'mountProgressiveCityNow'
  });
  const existingRuntime = root.__eonCityRuntime || null;
  const existingInputDispose = root.__eonCityInputDispose || null;
  const existingRuntimeHealthy = Boolean(
    existingRuntime
    && root.dataset.eonCityRuntimeLifecycle === 'running'
    && root.dataset.eonCityContextState !== 'lost'
  );
  if (!mountRequest.ok) {
    root.dataset.eonCityMountRejected = mountRequest.rejectionReason || 'mount-request-invalid';
    recordEonCityRuntimeReadinessEvent(root, 'mount-rejected', {
      mountRequest,
      reason: mountRequest.reason,
      owner: mountRequest.owner,
      caller: mountRequest.caller,
      result: mountRequest.rejectionReason || 'mount-request-invalid'
    });
    return Object.freeze({ ok: false, state: 'city-mount-rejected', reason: mountRequest.rejectionReason, mountRequest, payload, runtime: existingRuntime, deviceProfile });
  }
  if (existingRuntime && mountRequest.reason === 'initial-entry') {
    const reason = existingRuntimeHealthy ? 'healthy-runtime-already-running' : 'active-runtime-requires-verified-recovery';
    recordEonCityRuntimeReadinessEvent(root, 'mount-rejected', {
      mountRequest,
      reason: mountRequest.reason,
      owner: mountRequest.owner,
      caller: mountRequest.caller,
      result: reason
    });
    return Object.freeze({ ok: false, state: 'city-mount-rejected', reason, mountRequest, payload, runtime: existingRuntime, deviceProfile });
  }

  const mountGeneration = Number(root.dataset.eonCityMountGeneration || 0) + 1;
  root.dataset.eonCityMountGeneration = String(mountGeneration);
  root.dataset.eonCityMountReason = mountRequest.reason;
  root.dataset.eonCityMountOwner = mountRequest.owner;
  root.dataset.eonCityMountCaller = mountRequest.caller;
  delete root.dataset.eonCityMountRejected;
  recordEonCityRuntimeReadinessEvent(root, 'mount-request-accepted', {
    mountRequest,
    reason: mountRequest.reason,
    owner: mountRequest.owner,
    caller: mountRequest.caller,
    generation: mountGeneration,
    result: existingRuntime ? 'replacement-staging' : 'initial-runtime-staging'
  });

  const previousNodes = root.childNodes ? [...root.childNodes] : null;
  const previousInnerHTML = typeof root.innerHTML === 'string' ? root.innerHTML : '';
  const previousReducedRuntime = root.__eonCityReducedRuntime || null;
  const previousLifecycle = root.dataset.eonCityRuntimeLifecycle || '';
  const restorePreviousRuntime = (reason = 'replacement-failed') => {
    if (Number(root.dataset.eonCityMountGeneration || 0) !== mountGeneration || !existingRuntime) return false;
    try {
      if (previousNodes && typeof root.replaceChildren === 'function') root.replaceChildren(...previousNodes);
      else if ('innerHTML' in root) root.innerHTML = previousInnerHTML;
    } catch {}
    root.__eonCityRuntime = existingRuntime;
    root.__eonCityReducedRuntime = previousReducedRuntime || existingRuntime;
    root.__eonCityInputDispose = existingInputDispose;
    root.dataset.eonCityRuntimeLifecycle = previousLifecycle || 'running';
    try { existingRuntime.resume?.(); } catch {}
    recordEonCityRuntimeReadinessEvent(root, 'previous-runtime-restored', {
      mountRequest,
      reason: mountRequest.reason,
      owner: mountRequest.owner,
      caller: mountRequest.caller,
      generation: mountGeneration,
      result: reason
    });
    return true;
  };

  if (existingRuntime) {
    try { existingRuntime.pause?.(); } catch {}
    root.dataset.eonCityRuntimeLifecycle = 'replacement-staging';
  }
  renderProgressiveCity(root, deviceProfile);
  const preparationScreenCount = Number(root.dataset.eonCityPreparationScreenCount || 0) + 1;
  root.dataset.eonCityPreparationScreenCount = String(preparationScreenCount);
  recordEonCityRuntimeReadinessEvent(root, 'preparation-screen-shown', {
    mountRequest,
    reason: mountRequest.reason,
    owner: mountRequest.owner,
    caller: mountRequest.caller,
    generation: mountGeneration,
    result: existingRuntime ? 'explicit-replacement' : 'initial-entry'
  });
  const world = root.querySelector('[data-eon-city-reduced-world]');
  const loadingOverlay = root.querySelector('[data-eon-city-loading-overlay]');
  const overlayLoader = loadingOverlay && sequence
    ? mountEonCityClientLoadScreen(loadingOverlay, sequence, loaderOptions)
    : Object.freeze({ dispose() {} });
  const status = root.querySelector('[data-eon-city-reduced-status]');
  const position = root.querySelector('[data-eon-city-reduced-position]');
  const isCurrentMount = () => Number(root.dataset.eonCityMountGeneration || 0) === mountGeneration;
  let revealTimer = null;
  let firstFrameTimer = null;
  let firstFrameReady = false;
  let firstFrameFailurePending = false;
  let revealed = false;
  let activeAssetPath = '';
  let runtime = null;
  let coreLoaded = false;
  const showRestart3d = () => {
    const retry = root.querySelector('[data-eon-city-retry-3d]');
    if (!retry) return;
    retry.hidden = false;
    retry.tabIndex = 0;
    retry.removeAttribute?.('aria-hidden');
    retry.disabled = false;
    retry.textContent = 'Restart 3D';
  };
  const failMissingFirstFrame = () => {
    if (firstFrameReady || !isCurrentMount()) return;
    firstFrameFailurePending = true;
    if (firstFrameTimer) globalThis.clearTimeout?.(firstFrameTimer);
    root.dataset.eonCityBootStage = 'CITY_FIRST_FRAME_TIMEOUT';
    root.dataset.eonCityFirstFrame = 'missing';
    root.dataset.eonCityEntryState = 'FULL_CITY_FAILED';
    root.dataset.eonCityRuntimeLifecycle = 'first-frame-timeout';
    recordEonCityRuntimeReadinessEvent(root, 'full-city-first-frame-timeout', {
      mountRequest,
      reason: 'no-first-rendered-babylon-frame',
      owner: 'babylon-core',
      caller: 'first-frame-watchdog',
      generation: mountGeneration,
      result: 'full-city-failed'
    });
    if (loaderFacts?.assets) {
      loaderFacts.assets.value = '3D frame did not start';
      loaderFacts.assets.state = 'warning';
    }
    sequence?.fail?.('The complete 3D City did not produce a first frame. Restart 3D to try again.');
    if (status) status.textContent = 'The complete 3D City did not produce a first frame. Restart 3D to try again.';
    try { runtime?.destroy?.(); } catch {}
    if (root.__eonCityRuntime === runtime) root.__eonCityRuntime = null;
    if (root.__eonCityReducedRuntime === runtime) root.__eonCityReducedRuntime = null;
    showRestart3d();
  };
  const startFirstFrameWatchdog = () => {
    const check = () => {
      if (firstFrameReady || !isCurrentMount()) return;
      if (globalThis.document?.visibilityState === 'hidden') {
        firstFrameTimer = globalThis.setTimeout?.(check, 500) || null;
        return;
      }
      failMissingFirstFrame();
    };
    firstFrameTimer = globalThis.setTimeout?.(check, EON_CITY_FIRST_FRAME_TIMEOUT_MS) || null;
  };
  const revealCity = (detail, { degraded = false } = {}) => {
    if (revealed || !isCurrentMount()) return;
    revealed = true;
    if (revealTimer) globalThis.clearTimeout?.(revealTimer);
    if (firstFrameTimer) globalThis.clearTimeout?.(firstFrameTimer);
    if (loaderFacts?.assets) {
      loaderFacts.assets.value = degraded ? '3D core ready · detailed art continues' : 'Essential 3D visuals ready';
      loaderFacts.assets.state = degraded ? 'warning' : 'ready';
    }
    sequence?.ready?.(detail || 'EON City is ready.');
    root.dataset.eonCityReveal = 'ready';
    root.dataset.eonCityEntryState = root.dataset.eonCityRenderer === 'canvas-2d-fallback' ? 'PLAYABLE_RECOVERY' : 'PLAYABLE_3D_CORE';
    const hide = () => {
      overlayLoader.dispose?.();
      if (loadingOverlay) loadingOverlay.hidden = true;
    };
    if (deviceProfile?.reducedMotion) hide();
    else globalThis.setTimeout?.(hide, 280);
  };
  const updatePosition = () => {
    if (!isCurrentMount()) return;
    const snapshot = root.__eonCityReducedRuntime?.getRuntimeSummary?.();
    if (snapshot?.player && position) position.textContent = `Player x ${snapshot.player.x.toFixed(2)} · z ${snapshot.player.z.toFixed(2)}`;
    if (String(root.dataset.eonCityEntryState || '').startsWith('PLAYABLE_')) globalThis.requestAnimationFrame?.(updatePosition);
  };
  const qualityAuthority = resolveEonCityQualityAuthority({ detectedQuality: deviceProfile?.quality || 'balanced', deviceProfile });
  root.dataset.eonCityQualityDetected = qualityAuthority.detected;
  root.dataset.eonCityQualityEffective = qualityAuthority.effective;
  root.dataset.eonCityQualitySource = qualityAuthority.source;
  root.dataset.eonCityQualityOverrideAllowed = String(qualityAuthority.overrideAllowed);
  const callbacks = {
    host: world,
    quality: qualityAuthority.effective,
    qualityAuthority,
    reducedMotion: deviceProfile?.reducedMotion === true,
    ownerWorldReview: payload.ownerWorldReview === true,
    runtimeIdentity: Object.freeze({
      documentId: ensureEonCityDocumentIdentity(globalThis.document),
      accessMountId: ensureEonCityAccessMountIdentity(root),
      mountReason: mountRequest.reason,
      mountOwner: mountRequest.owner,
      mountCaller: mountRequest.caller,
      generation: mountGeneration
    }),
    onBootStage: ({ stage } = {}) => {
      if (/ENGINE_CREATE|CANVAS_ATTACHED|BABYLON_CORE/.test(String(stage || ''))) {
        sequence?.advance?.('engine-loading', { detail: 'Starting one verified Babylon engine for this browser.' });
      } else if (/SCENE_CREATE|FIRST_RENDER_REQUESTED/.test(String(stage || ''))) {
        sequence?.advance?.('world-building', { detail: 'Building the complete Command Hub first frame.' });
      }
    },
    onAssetProgress: ({ assetId = 'city-asset', path = '', loaded = 0, total = 0 } = {}) => {
      const safePath = String(path || '');
      if (!safePath) return;
      const cacheSnapshot = sequence?.getSnapshot?.()?.cache || {};
      const savedLocally = isEonCityAssetPathCached(cacheSnapshot, safePath);
      const transferDetail = savedLocally
        ? 'Restoring essential content-hashed City art from saved browser storage.'
        : 'Receiving new or uncached content-hashed City art directly from EONAPP.';
      if (activeAssetPath !== safePath) {
        activeAssetPath = safePath;
        sequence?.startAsset?.({ id: assetId, sourcePath: safePath, totalBytes: total, detail: transferDetail });
      }
      sequence?.reportAssetBytes?.({ id: assetId, sourcePath: safePath, loadedBytes: loaded, totalBytes: total, detail: transferDetail });
      if (loaderFacts?.assets) {
        const loadedKb = Math.max(0, Math.round(Number(loaded || 0) / 1024));
        const totalKb = Math.max(0, Math.round(Number(total || 0) / 1024));
        loaderFacts.assets.value = savedLocally
          ? `${assetId} · restoring saved local art`
          : totalKb > 0 ? `${assetId} · ${loadedKb} / ${totalKb} KB new/uncached` : `${assetId} · receiving new/uncached art`;
        loaderFacts.assets.state = 'loading';
      }
    },
    onFirstFrame: () => {
      firstFrameReady = true;
      if (firstFrameTimer) globalThis.clearTimeout?.(firstFrameTimer);
      root.dataset.eonCityBootStage = 'CITY_FIRST_PLAYABLE_FRAME';
      root.dataset.eonCityFirstFrame = 'ready';
      root.dataset.eonCityPlayerControls = 'enabled';
      sequence?.advance?.('world-building', { detail: 'The stable 3D frame is live. Preparing Pathfinder, EONBOT and the nearby work stations.' });
      if (status) status.textContent = 'Command Hub frame ready · local City visuals are preparing.';
      try { runtimeMachine?.transition?.('loading-shell', 'core-city-first-frame'); } catch {}
      if (!revealed && !revealTimer) {
        revealTimer = globalThis.setTimeout?.(() => {
          revealCity('The stable Command Hub is ready. Detailed local characters continue loading.', { degraded: true });
        }, EON_CITY_AUTHORED_REVEAL_TIMEOUT_MS) || null;
      }
    },
    onInitialAssetsReady: (result = {}) => {
      // Asset readiness is meaningful only after Babylon has actually rendered
      // the core frame. Never let an out-of-order callback turn a black canvas
      // into PLAYABLE_3D_CORE.
      if (!firstFrameReady) {
        failMissingFirstFrame();
        return;
      }
      const degraded = result?.degraded === true || result?.ok === false;
      if (status) {
        status.textContent = degraded
          ? 'Command Hub is playable · detailed local characters continue loading safely.'
          : 'Command Hub is ready · Pathfinder, EONBOT and nearby station art are active.';
      }
      revealCity(degraded ? 'Command Hub core ready. Detailed local City art continues loading in the background.' : 'Essential Command Hub visuals are ready.', { degraded });
    },
    onDetailStage: () => {},
    onStatus: (message) => { if (isCurrentMount() && status) status.textContent = String(message || 'Playable Command Hub.'); },
    onContextLoss: ({ recoveryAction = 'restart-3d' } = {}) => {
      if (!isCurrentMount()) return;
      root.dataset.eonCityContextState = 'lost';
      root.dataset.eonCityRecoveryAction = String(recoveryAction || 'restart-3d');
      recordEonCityRuntimeReadinessEvent(root, 'verified-context-loss', { mountRequest, reason: 'verified-context-loss-recovery', owner: 'babylon-context', caller: 'onContextLoss', generation: mountGeneration, result: 'recovery-offered' });
      const retry = root.querySelector('[data-eon-city-retry-3d]');
      if (retry) {
        retry.hidden = false;
        retry.tabIndex = 0;
        retry.removeAttribute?.('aria-hidden');
        retry.disabled = false;
        retry.textContent = 'Restart 3D';
      }
      if (status) status.textContent = 'City graphics paused safely. Restart 3D if the browser does not restore the scene.';
    },
    onContextRestored: () => {
      if (!isCurrentMount()) return;
      root.dataset.eonCityContextState = 'restored';
      delete root.dataset.eonCityRecoveryAction;
      const retry = root.querySelector('[data-eon-city-retry-3d]');
      if (retry) {
        retry.hidden = true;
        retry.tabIndex = -1;
        retry.setAttribute?.('aria-hidden', 'true');
      }
      if (status) status.textContent = 'City graphics restored. Your local position and work state were preserved.';
    },
    onPerformanceChange: ({ message = '', level = 0, hardwareScalingLevel = 1 } = {}) => {
      if (!isCurrentMount()) return;
      root.dataset.eonCityPerformanceProtection = String(Math.max(0, Number(level || 0)));
      root.dataset.eonCityHardwareScaling = String(Number(hardwareScalingLevel || 1).toFixed(2));
      if (status && message) status.textContent = String(message);
    },
    onLandmarkChange: (landmark) => {
      if (isCurrentMount() && landmark && status) status.textContent = `Near ${landmark.label}. Press E or use City Menu to open its workspace.`;
    }
  };
  const recordStage4 = (detail) => {
    const diagnostic = createEonCityStage4Diagnostic(detail);
    root.dataset.eonCityStage4Outcome = diagnostic.outcome;
    root.dataset.eonCityStage4Reason = diagnostic.reason;
    recordEonCityRuntimeReadinessEvent(root, 'stage4-full-runtime-diagnostic', { mountRequest, generation: mountGeneration, ...diagnostic });
    return diagnostic;
  };
  try {
    sequence?.advance?.('engine-loading', { detail: 'Loading the verified Babylon core without the legacy monolithic owner.' });
    recordStage4({ phase: 'full-runtime-import', outcome: 'started' });
    const core = await importCore();
    coreLoaded = true;
    recordStage4({ phase: 'full-runtime-import', outcome: 'resolved', reason: 'core-module-ready', coreLoaded: true });
    if (!isCurrentMount()) {
      overlayLoader.dispose?.();
      return Object.freeze({ ok: false, state: 'city-mount-superseded', payload, runtime: null, deviceProfile, mountRequest });
    }
    if (typeof core?.mountBabylonCityProof !== 'function') throw new Error('city_core_missing');
    sequence?.advance?.('world-building', { detail: 'Creating the first stable 3D frame behind this loading screen.' });
    runtime = core.mountBabylonCityProof(callbacks);
    recordStage4({ phase: 'full-runtime-mount', outcome: 'succeeded', reason: 'babylon-core-mounted', coreLoaded: true });
    if (firstFrameFailurePending) {
      try { runtime?.destroy?.(); } catch {}
      runtime = null;
      return Object.freeze({ ok: false, state: 'city-first-frame-failed', payload, runtime: null, deviceProfile, mountRequest, reason: 'no-first-rendered-babylon-frame' });
    }
    if (!isCurrentMount()) {
      try { runtime?.destroy?.(); } catch {}
      overlayLoader.dispose?.();
      return Object.freeze({ ok: false, state: 'city-mount-superseded', payload, runtime: null, deviceProfile, mountRequest });
    }
  } catch (error) {
    const errorCode = safeDiagnosticCode(error?.code || error?.name || error?.message, 'full-runtime-failed');
    if (existingRuntime && (!coreLoaded || mountRequest.reason === 'explicit-restart-3d')) {
      overlayLoader.dispose?.();
      const preservedReason = mountRequest.reason === 'explicit-restart-3d'
        ? 'explicit-restart-failed-old-runtime-preserved'
        : 'replacement-import-failed-old-runtime-preserved';
      restorePreviousRuntime(preservedReason);
      return Object.freeze({ ok: false, state: 'city-restart-failed-runtime-preserved', payload, runtime: existingRuntime, deviceProfile, mountRequest, reason: String(error?.message || error || 'restart-failed') });
    }
    if (coreLoaded) {
      recordStage4({ phase: 'full-runtime-mount', outcome: 'failed', reason: errorCode, coreLoaded: true, fallbackSelected: true, partialRuntimeDisposed: Boolean(runtime?.destroy) });
      root.dataset.eonCityRenderer = 'canvas-2d-fallback';
      root.dataset.eonCityBootStage = 'BABYLON_CORE_RECOVERY';
      if (loaderFacts?.device) {
        loaderFacts.device.value = 'WebGL recovery mode';
        loaderFacts.device.state = 'warning';
      }
      if (status) status.textContent = '3D could not start on this device. Opening the playable recovery City.';
      runtime = mountCanvasRecovery(callbacks);
      try { console.warn('[CITY_CORE_RECOVERY]', error); } catch {}
    } else {
      recordStage4({ phase: 'full-runtime-import', outcome: 'failed', reason: errorCode, fallbackSelected: false });
      root.dataset.eonCityRenderer = 'city-core-import-failed';
      root.dataset.eonCityBootStage = 'BABYLON_CORE_IMPORT_FAILED';
      root.dataset.eonCityEntryState = 'CITY_CORE_IMPORT_FAILED';
      try { runtimeMachine?.fail?.('city-core-import-failed'); } catch {}
      sequence?.fail?.('The complete City update could not load. Retry after the release is available.');
      if (loaderFacts?.device) {
        loaderFacts.device.value = 'City update unavailable';
        loaderFacts.device.state = 'warning';
      }
      if (status) status.textContent = 'The complete City update could not load. Retry after the release is available.';
      try { console.error('[CITY_CORE_IMPORT_FAILED]', error); } catch {}
      return Object.freeze({ ok: false, state: 'city-core-import-failed', payload, runtime: null, deviceProfile, mountRequest });
    }
  }

  root.__eonCityRuntime = runtime;
  root.__eonCityReducedRuntime = runtime;
  root.dataset.eonCityRuntimeLifecycle = 'running';
  if (existingInputDispose) {
    try { existingInputDispose(); } catch {}
  }
  if (existingRuntime && existingRuntime !== runtime) {
    try { existingRuntime.destroy?.(); } catch {}
  }
  if (!firstFrameReady) startFirstFrameWatchdog();
  updatePosition();
  const analogJoystick = mountCityPlayAnalogJoystick({
    root,
    onVector: (vector) => runtime?.setAnalogMove?.(vector, { source: 'touch-joystick', inputKind: 'touch-analog' }),
    onStatus: (message) => {
      const runtimeStatus = root.querySelector('[data-eon-city-reduced-status]');
      if (runtimeStatus) runtimeStatus.textContent = message;
    }
  });
  const fallbackDpad = root.querySelector('[data-eon-city-touch-dpad]');
  if (fallbackDpad && analogJoystick.active !== true) fallbackDpad.hidden = false;
  root.dataset.eonCityTouchControlScheme = analogJoystick.active ? 'analog-joystick' : 'fallback-dpad';
  const directionalInputDispose = bindEonCityDirectionalControls(root, runtime, {
    selector: '[data-eon-city-move]',
    datasetKey: 'eonCityMove',
    environment: globalThis,
    controlSource: 'touch-dpad'
  });
  const sprintToggle = root.querySelector('[data-eon-city-sprint-toggle]');
  let touchSprintActive = false;
  const syncSprintToggle = () => {
    if (!sprintToggle) return;
    sprintToggle.setAttribute('aria-pressed', touchSprintActive ? 'true' : 'false');
    sprintToggle.textContent = touchSprintActive ? 'Sprint On' : 'Sprint';
  };
  const onSprintToggle = () => {
    const requested = !touchSprintActive;
    const result = runtime?.setSprint?.(requested, { source: 'touch-sprint-toggle', inputKind: 'touch-toggle' });
    touchSprintActive = result?.ok === true ? result.active === true : false;
    syncSprintToggle();
  };
  const resetTouchSprint = (reason = 'lifecycle-reset') => {
    touchSprintActive = false;
    try { runtime?.setSprint?.(false, { source: 'touch-sprint-toggle', inputKind: `touch-toggle-${reason}` }); } catch {}
    syncSprintToggle();
  };
  const onInputLifecycleBlur = () => resetTouchSprint('blur');
  const onInputVisibilityChange = () => {
    if (globalThis.document?.visibilityState === 'hidden') resetTouchSprint('hidden');
  };
  sprintToggle?.addEventListener?.('click', onSprintToggle);
  globalThis.addEventListener?.('blur', onInputLifecycleBlur);
  globalThis.document?.addEventListener?.('visibilitychange', onInputVisibilityChange);
  syncSprintToggle();
  root.__eonCityInputDispose = () => {
    resetTouchSprint('dispose');
    sprintToggle?.removeEventListener?.('click', onSprintToggle);
    globalThis.removeEventListener?.('blur', onInputLifecycleBlur);
    globalThis.document?.removeEventListener?.('visibilitychange', onInputVisibilityChange);
    analogJoystick.destroy?.();
    directionalInputDispose?.();
  };
  root.dataset.eonCityBackgroundPreparation = 'W731_COMMAND_HUB_PROGRESSIVE_ASSETS';
  root.__eonCityRuntimeIdentity = createEonCityRuntimeIdentitySnapshot({ root, runtime, mountRequest, generation: mountGeneration });
  recordEonCityRuntimeReadinessEvent(root, 'runtime-mounted', {
    mountRequest,
    reason: mountRequest.reason,
    owner: mountRequest.owner,
    caller: mountRequest.caller,
    generation: mountGeneration,
    result: root.dataset.eonCityRenderer === 'canvas-2d-fallback' ? 'playable-recovery' : 'playable-3d',
    runtimeIds: root.__eonCityRuntimeIdentity
  });
  root.querySelector('[data-eon-city-retry-3d]')?.addEventListener('click', async () => {
    const retry = root.querySelector('[data-eon-city-retry-3d]');
    if (!isCurrentMount()) return;
    if (retry) { retry.disabled = true; retry.textContent = 'Restarting…'; }
    const contextLost = root.dataset.eonCityContextState === 'lost';
    try {
      const result = await mountProgressiveCityNow(root, { importCore, runtimeMachine, payload, sequence, loaderFacts, loaderOptions, deviceProfile }, {
        reason: contextLost ? 'verified-context-loss-recovery' : 'explicit-restart-3d',
        owner: 'restart-3d-control',
        caller: 'data-eon-city-retry-3d',
        explicitUserAction: true,
        verifiedContextLoss: contextLost
      });
      if (!result?.ok && retry?.isConnected !== false) { retry.disabled = false; retry.textContent = 'Restart 3D'; }
    } catch {
      if (retry?.isConnected !== false) { retry.disabled = false; retry.textContent = 'Restart 3D'; }
      const activeStatus = root.querySelector('[data-eon-city-reduced-status]');
      if (activeStatus) activeStatus.textContent = 'The City could not restart. The previous runtime was preserved when possible.';
    }
  });
  return Object.freeze({ ok: true, state: 'PLAYABLE_CITY', payload, runtime, deviceProfile, mountRequest, runtimeIdentity: root.__eonCityRuntimeIdentity });
}

async function inspectAuthorizedCityCache({ timeoutMs = 900, inspector = inspectEonCityAssetCache } = {}) {
  const inspection = inspector({ requestPersistence: true });
  let timer = null;
  try {
    return await Promise.race([
      inspection,
      new Promise((resolve) => { timer = globalThis.setTimeout?.(() => resolve(null), timeoutMs) || null; })
    ]);
  } finally {
    if (timer) globalThis.clearTimeout?.(timer);
  }
}

function importEonCityCoreModule() {
  return import('./eon-city-play-core.js');
}

export async function resolveInstalledOfflineCityAccess(offlineStateResolver = refreshEonOfflineState) {
  try {
    const state = await offlineStateResolver();
    if (state?.cityReady !== true || !Array.isArray(state?.packs) || !state.packs.includes('city')) return null;
    return normalizeEonCityAccessPayload({
      schema: EON_CITY_ACCESS_SCHEMA,
      mode: 'authenticated-play',
      accessState: 'authorized',
      requiresIdentity: true,
      identityAvailable: false,
      signedIn: false,
      offlineAuthorized: true,
      offlineReceiptExpiresAt: Number(state.expiresAt || 0),
      offlinePacks: state.packs,
      canBootFullCity: true,
      heavyRuntimeImportAllowed: true,
      staticPortalOnly: false,
      reason: 'A valid browser-installed offline City capability is active.',
      dataCustody: 'Offline City uses only the installed local shell, verified browser-cached assets, local missions and local progress. Cloud surfaces remain unavailable and no work is synchronized automatically.'
    });
  } catch {
    return null;
  }
}

async function fetchAccess(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(EON_CITY_ACCESS_ROUTE, { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
  if (!response?.ok) {
    const error = new Error('city_access_unavailable');
    error.status = Number(response?.status || 0);
    error.offlineFallbackAllowed = error.status >= 500;
    throw error;
  }
  const payload = normalizeEonCityAccessPayload(await response.json());
  if (payload.schema !== EON_CITY_ACCESS_SCHEMA) {
    const error = new Error('city_access_contract_invalid');
    error.offlineFallbackAllowed = false;
    throw error;
  }
  return payload;
}

export async function mountEonCityAccessStation(root = document.querySelector('[data-eon-city-play-root]'), { fetchImpl = globalThis.fetch, importImpl = importEonCityCoreModule, cacheInspector = inspectEonCityAssetCache, runtimeStateMachine = null, offlineStateResolver = refreshEonOfflineState } = {}) {
  if (!root) return null;
  ensureEonCityAutoLoaderStyles();
  ensureEonCityDocumentIdentity(globalThis.document);
  ensureEonCityAccessMountIdentity(root);
  installEonCityRuntimeReadinessInspector(root);
  if (root.__eonCityRuntime) {
    const reason = root.dataset.eonCityRuntimeLifecycle === 'running' && root.dataset.eonCityContextState !== 'lost'
      ? 'healthy-runtime-already-running'
      : 'active-runtime-requires-verified-recovery';
    recordEonCityRuntimeReadinessEvent(root, 'access-station-remount-rejected', { reason: 'initial-entry', owner: 'eon-city-access-station', caller: 'mountEonCityAccessStation', result: reason });
    return Object.freeze({ ok: false, state: 'city-mount-rejected', reason, runtime: root.__eonCityRuntime });
  }
  const runtimeMachine = runtimeStateMachine || createEonCityRuntimeStateMachine();
  const currentRuntimeState = runtimeMachine.getSnapshot().state;
  if (currentRuntimeState === 'idle') runtimeMachine.transition('checking-access', 'access-station-mounted');
  else if (['preview', 'recoverable-error'].includes(currentRuntimeState)) runtimeMachine.transition('checking-access', 'access-retry');
  const loaderFacts = {
    account: { id: 'account', label: 'Account', value: 'Checking private access', state: 'loading' },
    device: { id: 'device', label: 'Device', value: 'Waiting for access', state: 'loading' },
    assets: { id: 'assets', label: 'City assets', value: 'Renderer remains off', state: 'loading' }
  };
  const loaderOptions = {
    title: 'Preparing your EON City Command Hub',
    kicker: 'EON CITY · private Command Hub',
    getFacts: () => Object.values(loaderFacts)
  };
  const sequence = bindEonCityClientLoadSequence(root, createEonCityClientLoadSequence({ directEntry: true }));
  const loader = mountEonCityClientLoadScreen(root, sequence, loaderOptions);
  root.dataset.eonCityPreparationScreenCount = String(Number(root.dataset.eonCityPreparationScreenCount || 0) + 1);
  recordEonCityRuntimeReadinessEvent(root, 'preparation-screen-shown', { reason: 'initial-entry', owner: 'eon-city-access-station', caller: 'mountEonCityAccessStation', result: 'access-check' });
  root.dataset.eonCityAccessState = 'checking';
  setAccessRouteState(root, 'access-checking');
  sequence.advance('access-check', { detail: 'Checking City access before loading the renderer.' });
  let payload;
  try {
    payload = await fetchAccess(fetchImpl);
  } catch (error) {
    const offlinePayload = error?.offlineFallbackAllowed === false ? null : await resolveInstalledOfflineCityAccess(offlineStateResolver);
    if (offlinePayload) {
      payload = offlinePayload;
      root.dataset.eonCityOfflineCapability = 'active';
      root.dataset.eonCityOfflineReceiptExpiresAt = String(payload.offlineReceiptExpiresAt || 0);
      sequence.advance('access-confirmed', { detail: 'Public internet is unavailable. A valid installed offline City capability was found in this browser.' });
    } else {
      sequence.fail('City access could not be confirmed. The full renderer has not started.');
      payload = normalizeEonCityAccessPayload({
        schema: EON_CITY_ACCESS_SCHEMA,
        mode: 'authenticated-play',
        accessState: 'identity-unavailable',
        requiresIdentity: true,
        identityAvailable: false,
        signedIn: false,
        canBootFullCity: false,
        heavyRuntimeImportAllowed: false,
        reason: 'City access could not be confirmed. Install the Full offline pack while signed in before going offline.',
        dataCustody: 'No City account, project, Vault, provider, prompt or file data was requested.'
      });
    }
  }
  const view = describeEonCityAccessView(payload);
  if (view.kind === 'boot') {
    root.dataset.eonCityAccessState = 'authorized';
    setAccessRouteState(root, 'booting');
    loaderFacts.account.value = payload.offlineAuthorized ? 'Offline capability · private City pack confirmed' : 'Signed in · private City access confirmed';
    loaderFacts.account.state = 'ready';
    sequence.advance('access-confirmed', { detail: payload.offlineAuthorized ? 'Installed offline City access confirmed. Automatic local preparation is starting.' : 'Private City access confirmed. Automatic preparation is starting.' });
    const deviceProfile = inspectEonCityDeviceProfile();
    loaderFacts.device.value = deviceProfile.summary;
    loaderFacts.device.state = deviceProfile.webgl === 'unavailable' ? 'warning' : 'ready';
    root.dataset.eonCityQualityProfile = deviceProfile.quality;
    root.dataset.eonCityQualitySelection = deviceProfile.selection;
    root.dataset.eonCityWebglProfile = deviceProfile.webgl;
    root.dataset.eonCityGpuRenderer = deviceProfile.gpuRenderer || 'unknown';
    root.dataset.eonCityDiscreteGpu = deviceProfile.discreteGpu ? 'true' : 'false';
    root.dataset.eonCitySoftwareRenderer = deviceProfile.softwareRenderer ? 'true' : 'false';
    root.dataset.eonCityAutomaticEntry = 'true';
    sequence.advance('device-profile', { detail: `Selected ${deviceProfile.label.toLowerCase()} for this browser. No work, prompts, files or provider keys are being read.` });
    const cacheStatus = await inspectAuthorizedCityCache({ inspector: cacheInspector });
    if (cacheStatus) {
      const warmCachedCity = Number(cacheStatus.cachedEntries || 0) > 0 || Number(cacheStatus.cachedShellEntries || 0) > 0;
      loaderOptions.title = warmCachedCity ? 'Restoring your EON City Command Hub' : 'Preparing your EON City Command Hub';
      root.dataset.eonCityEntryAssetMode = warmCachedCity ? 'warm-cache-restore' : 'cold-or-uncached-entry';
      sequence.reportCacheStatus(cacheStatus);
      root.dataset.eonCityCachedAssetEntries = String(cacheStatus.cachedEntries || 0);
      root.dataset.eonCityStoragePersisted = cacheStatus.persisted ? 'true' : 'false';
      root.dataset.eonCityAssetCacheName = cacheStatus.cacheName;
      loaderFacts.assets.value = cacheStatus.cachedEntries > 0 || cacheStatus.cachedShellEntries > 0
        ? `${cacheStatus.cachedEntries || 0} saved art · ${cacheStatus.cachedShellEntries || 0} saved runtime files · restoring local City state`
        : 'First visit · preparing critical City runtime and 3D art';
      loaderFacts.assets.state = cacheStatus.cachedEntries > 0 ? 'ready' : 'loading';
    } else {
      root.dataset.eonCityCacheInspection = 'timed-out-non-blocking';
      loaderFacts.assets.value = 'Cache check skipped · direct loading available';
      loaderFacts.assets.state = 'warning';
    }
    let coreModulePromise = null;
    const preloadCore = () => {
      if (!coreModulePromise) {
        root.dataset.eonCityBootStage = 'BABYLON_CORE_IMPORT_STARTED';
        sequence.advance('engine-loading', { detail: 'Loading the verified compact Command Hub runtime. Retired world layers remain excluded.' });
        coreModulePromise = Promise.resolve().then(importImpl).then((core) => {
          root.dataset.eonCityCorePreload = 'ready';
          return core;
        }).catch((error) => {
          coreModulePromise = null;
          root.dataset.eonCityCorePreload = 'failed';
          throw error;
        });
      }
      return coreModulePromise;
    };
    let entryPromise = null;
    const enter = () => {
      if (entryPromise) return entryPromise;
      root.dataset.eonCityEntryStarting = 'true';
      root.dataset.eonCityBootStage = 'CITY_AUTOMATIC_ENTRY_STARTED';
      loader.dispose();
      entryPromise = Promise.resolve()
        .then(() => mountProgressiveCityNow(root, { importCore: preloadCore, runtimeMachine, payload, sequence, loaderFacts, loaderOptions, deviceProfile }, {
          reason: 'initial-entry',
          owner: 'eon-city-access-station',
          caller: 'authorized-automatic-entry'
        }))
        .catch((error) => {
          sequence.fail('Automatic City entry stopped safely. Reload the page to try again.');
          root.dataset.eonCityEntryError = String(error?.message || error || 'city-entry-failed').slice(0, 120);
          return Object.freeze({ ok: false, state: 'automatic-entry-failed', payload, deviceProfile });
        })
        .finally(() => { delete root.dataset.eonCityEntryStarting; });
      return entryPromise;
    };
    const automaticEntry = enter();
    return Object.freeze({ ok: true, state: 'automatic-entry', payload, enter, entryPromise: automaticEntry, deviceProfile });
  }
  loader.dispose();
  if (view.kind === 'login' || view.kind === 'unavailable') {
    try { runtimeMachine.transition('preview', `access-${view.kind}`); } catch { runtimeMachine.fail(`access-${view.kind}`); }
  }
  renderAccessStation(root, view, payload);
  root.querySelector('[data-eon-city-access-retry]')?.addEventListener('click', () => { void mountEonCityAccessStation(root, { fetchImpl, importImpl, cacheInspector, runtimeStateMachine: runtimeMachine, offlineStateResolver }); });
  return Object.freeze({ ok: false, state: view.kind, payload });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { void mountEonCityAccessStation(); }, { once: true });
  else void mountEonCityAccessStation();
}
