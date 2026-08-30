import { getLocalFirstBoundaryNotice } from './local-first/local-first-boundary.js';
import { createEonPwaRolloutGuard, getEonPwaRolloutTruth } from './eon-pwa-rollout-guard.js';
import { createEonPwaRecoveryRehearsal, getEonPwaRecoveryRehearsalTruth } from './eon-pwa-recovery-rehearsal.js';
/**
 * EONAPP W210 — PWA install, update, launch and local-profile truth manager.
 *
 * This module never claims cross-device sync or platform-wide install support.
 * It tracks only the current browser profile and a non-sensitive launch marker.
 */
export const EON_PWA_STATE_VERSION = 'w210-pwa-device-readiness-v2';
export const EON_PWA_STATE_KEY = 'eon:pwa:profile-state:v1';
export const EON_PWA_LAUNCH_KEY = 'eon:pwa:last-launch:v1';

const SAFE_PREFIXES = Object.freeze([
  'eon:chat:', 'eon:market:', 'eon:automation', 'eon:operator:', 'eon:projects:', 'eon:library:', 'eon:profile:', 'eon:local-ai:', 'eon:device:'
]);
const SENSITIVE_KEY_PATTERN = /(api[-_:]?key|secret|token|password|mnemonic|seed|private[-_:]?key|exchange)/i;
let deferredInstallPrompt = null;
let deferredInstallPromptCapturedAt = 0;
let installPromptInFlight = false;
let pwaInstallListenersBound = false;
let lastInstallOutcome = null;
let waitingWorker = null;
let waitingWorkerReleaseId = '';
let waitingReleaseRequest = null;
let serviceWorkerMessageListenerBound = false;
let updateRequestPending = false;
let updateActivatedAwaitingReload = false;
let activatedReleaseId = '';
let stateListener = null;

function safeStorage(storage = null) { if (storage) return storage; try { return globalThis.localStorage || null; } catch { return null; } }
function safeNow() { return Date.now(); }
function sanitizeReleaseId(value = '') { return String(value || '').trim().replace(/[^a-z0-9._-]/gi, '').slice(0, 96); }
function isStandaloneDisplay() {
  try { return window.matchMedia?.('(display-mode: standalone)')?.matches === true || window.navigator?.standalone === true; } catch { return false; }
}
function isIosBrowser(userAgent = '') { return /iphone|ipad|ipod/i.test(String(userAgent || '')); }
function listSafeStateKeys(storage = null) {
  const target = safeStorage(storage);
  if (!target || typeof target.length !== 'number') return [];
  const keys = [];
  for (let index = 0; index < target.length; index += 1) {
    const key = String(target.key(index) || '');
    if (!key || SENSITIVE_KEY_PATTERN.test(key)) continue;
    if (SAFE_PREFIXES.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  return keys.sort();
}
function readJson(storage, key, fallback = null) { try { const raw = storage?.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeJson(storage, key, value) { try { storage?.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }

export function ensureEonPwaProfileState(options = {}) {
  const storage = safeStorage(options.storage);
  const now = Number(options.now || safeNow());
  const existing = readJson(storage, EON_PWA_STATE_KEY, null);
  const safeKeys = listSafeStateKeys(storage);
  const next = {
    version: EON_PWA_STATE_VERSION,
    createdAt: Number(existing?.createdAt || now),
    lastCheckedAt: now,
    safeStateKeyCount: safeKeys.length,
    safeStateCategories: [...new Set(safeKeys.map((key) => key.split(':').slice(0, 2).join(':')))].slice(0, 16),
    sync: 'local-browser-profile-only',
    crossDeviceSync: false,
    note: getLocalFirstBoundaryNotice('pwa')
  };
  writeJson(storage, EON_PWA_STATE_KEY, next);
  return next;
}

export function recordEonPwaLaunch(options = {}) {
  const storage = safeStorage(options.storage);
  const search = String(options.search ?? (typeof window !== 'undefined' ? window.location.search : ''));
  const standalone = Boolean(options.standalone ?? isStandaloneDisplay());
  const source = new URLSearchParams(search).get('source') === 'pwa' ? 'pwa-start-url' : standalone ? 'standalone' : 'browser';
  const next = {
    schema: 'eon.pwa.launch.v1',
    source,
    standalone,
    path: '/',
    recordedAt: Number(options.now || safeNow()),
    note: source === 'pwa-start-url' ? 'EONAPP opened through the PWA start route. This does not by itself prove installation.' : 'EONAPP opened in the current browser profile.'
  };
  writeJson(storage, EON_PWA_LAUNCH_KEY, next);
  return next;
}

export function getEonPwaLaunchState(options = {}) { return readJson(safeStorage(options.storage), EON_PWA_LAUNCH_KEY, null); }

export function getEonPwaInstallGuidance(options = {}) {
  const ua = String(options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
  if (isIosBrowser(ua)) return 'On iPhone or iPad Safari, use Share → Add to Home Screen. The browser may not show a standard Install button.';
  return 'When Install is offered by this browser, choose it from the EONAPP sidebar. Otherwise use your browser menu to install or add this site to your device.';
}

export function getEonPwaState(options = {}) {
  const profile = ensureEonPwaProfileState(options);
  return {
    ...profile,
    standalone: options.standalone ?? isStandaloneDisplay(),
    installAvailable: Boolean(options.installAvailable ?? deferredInstallPrompt),
    installPromptInFlight: Boolean(options.installPromptInFlight ?? installPromptInFlight),
    installPromptCapturedAt: Number(options.installPromptCapturedAt ?? deferredInstallPromptCapturedAt) || null,
    updateReady: Boolean(options.updateReady ?? waitingWorker),
    updateReleaseId: sanitizeReleaseId(options.updateReleaseId ?? waitingWorkerReleaseId) || null,
    updateRequestPending: Boolean(options.updateRequestPending ?? updateRequestPending),
    reloadRequired: Boolean(options.reloadRequired ?? updateActivatedAwaitingReload),
    activatedReleaseId: sanitizeReleaseId(options.activatedReleaseId ?? activatedReleaseId) || null,
    automaticReload: false,
    lastInstallOutcome,
    launch: getEonPwaLaunchState(options),
    installGuidance: getEonPwaInstallGuidance(options),
    rolloutReview: createEonPwaRolloutGuard({ storage: safeStorage(options.storage) }).getSnapshot(),
    rolloutTruth: getEonPwaRolloutTruth(),
    recoveryRehearsal: createEonPwaRecoveryRehearsal({ storage: safeStorage(options.storage) }).getSnapshot(),
    recoveryRehearsalTruth: getEonPwaRecoveryRehearsalTruth()
  };
}

function emitState() {
  const state = getEonPwaState();
  try { stateListener?.(state); } catch {}
  try { window.dispatchEvent(new CustomEvent('eon:pwa-state', { detail: state })); } catch {}
  return state;
}

export async function requestEonPwaInstall({ explicitUserAction = false, userActivation = globalThis.navigator?.userActivation } = {}) {
  if (explicitUserAction !== true) return { ok: false, reason: 'explicit-user-action-required', guidance: getEonPwaInstallGuidance() };
  if (userActivation && userActivation.isActive === false) return { ok: false, reason: 'active-user-gesture-required', guidance: getEonPwaInstallGuidance() };
  if (installPromptInFlight) return { ok: false, reason: 'install-prompt-in-progress' };
  if (!deferredInstallPrompt || typeof deferredInstallPrompt.prompt !== 'function') return { ok: false, reason: 'install-not-available', guidance: getEonPwaInstallGuidance() };

  // A BeforeInstallPromptEvent is single-use. Consume and clear the captured
  // event before calling prompt() so a rejection, dismissal or repeated click
  // can never invoke prompt() on the same stale browser event.
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  deferredInstallPromptCapturedAt = 0;
  installPromptInFlight = true;
  emitState();
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    const outcome = String(choice?.outcome || 'dismissed');
    lastInstallOutcome = outcome;
    return { ok: outcome === 'accepted', outcome };
  } catch (error) {
    lastInstallOutcome = 'failed';
    return { ok: false, reason: 'install-prompt-failed', error: String(error?.message || error) };
  } finally {
    installPromptInFlight = false;
    emitState();
  }
}

function settleWaitingReleaseId(releaseId = '') {
  const clean = sanitizeReleaseId(releaseId);
  if (!clean) return '';
  waitingWorkerReleaseId = clean;
  if (waitingReleaseRequest) {
    globalThis.clearTimeout?.(waitingReleaseRequest.timeout);
    waitingReleaseRequest.resolve(clean);
    waitingReleaseRequest = null;
  }
  return clean;
}

function requestWaitingWorkerReleaseId(worker = waitingWorker) {
  if (waitingWorkerReleaseId) return Promise.resolve(waitingWorkerReleaseId);
  if (!worker || typeof worker.postMessage !== 'function') return Promise.resolve('');
  if (waitingReleaseRequest) return waitingReleaseRequest.promise;
  const request = {};
  request.promise = new Promise((resolve) => {
    request.resolve = resolve;
    request.timeout = globalThis.setTimeout?.(() => {
      if (waitingReleaseRequest === request) waitingReleaseRequest = null;
      resolve(waitingWorkerReleaseId);
    }, 700) || null;
  });
  waitingReleaseRequest = request;
  try { worker.postMessage({ type: 'EONAPP_RELEASE_ID_REQUEST' }); } catch {
    globalThis.clearTimeout?.(request.timeout);
    waitingReleaseRequest = null;
    request.resolve('');
  }
  return request.promise;
}

function onServiceWorkerMessage(event) {
  const data = event?.data || {};
  const type = String(data?.type || '');
  if (type === 'EONAPP_SW_UPDATE_WAITING') {
    settleWaitingReleaseId(data.releaseId);
    if (event?.source && typeof event.source.postMessage === 'function') waitingWorker = event.source;
    emitState();
    return;
  }
  if (type === 'EONAPP_SW_RELEASE_ID') {
    settleWaitingReleaseId(data.releaseId);
    emitState();
    return;
  }
  if (type === 'EONAPP_SW_ACTIVATED') {
    waitingWorker = null;
    waitingWorkerReleaseId = '';
    updateRequestPending = false;
    updateActivatedAwaitingReload = data.reloadRequired === true;
    activatedReleaseId = sanitizeReleaseId(data.releaseId);
    emitState();
  }
}

export async function applyEonPwaUpdate({ explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) return { ok: false, reason: 'explicit-user-action-required' };
  if (!waitingWorker || typeof waitingWorker.postMessage !== 'function') return { ok: false, reason: 'no-update-ready' };
  const releaseId = await requestWaitingWorkerReleaseId(waitingWorker);
  if (!releaseId) return { ok: false, reason: 'update-release-identity-unavailable' };
  updateRequestPending = true;
  waitingWorker.postMessage({ type: 'EONAPP_APPLY_UPDATE', releaseId, explicitUserAction: true });
  emitState();
  return { ok: true, action: 'user-approved-update-requested', releaseId, reloadRequired: false };
}

export function reloadEonPwaAfterUpdate({ explicitUserAction = false, locationRef = globalThis.location } = {}) {
  if (explicitUserAction !== true) return { ok: false, reason: 'explicit-user-action-required' };
  if (!updateActivatedAwaitingReload) return { ok: false, reason: 'updated-worker-not-activated' };
  if (!locationRef || typeof locationRef.reload !== 'function') return { ok: false, reason: 'reload-unavailable' };
  updateActivatedAwaitingReload = false;
  locationRef.reload();
  return { ok: true, action: 'user-approved-reload', releaseId: activatedReleaseId || null };
}

function watchServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!serviceWorkerMessageListenerBound) {
    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
    serviceWorkerMessageListenerBound = true;
  }
  navigator.serviceWorker.getRegistration('/sw.js').then((registration) => {
    if (!registration) return;
    waitingWorker = registration.waiting || null;
    if (waitingWorker) void requestWaitingWorkerReleaseId(waitingWorker);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = registration.waiting || worker;
          void requestWaitingWorkerReleaseId(waitingWorker);
          emitState();
        }
      });
    });
    emitState();
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    waitingWorker = null;
    waitingWorkerReleaseId = '';
    updateRequestPending = false;
    updateActivatedAwaitingReload = true;
    emitState();
  });
}

export function initEonPwaManager(options = {}) {
  stateListener = typeof options.onStateChange === 'function' ? options.onStateChange : null;
  ensureEonPwaProfileState();
  recordEonPwaLaunch();
  if (typeof window === 'undefined') return getEonPwaState();
  if (!pwaInstallListenersBound) {
    pwaInstallListenersBound = true;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      deferredInstallPromptCapturedAt = safeNow();
      emitState();
    });
    window.addEventListener('appinstalled', () => {
      lastInstallOutcome = 'accepted';
      deferredInstallPrompt = null;
      deferredInstallPromptCapturedAt = 0;
      installPromptInFlight = false;
      recordEonPwaLaunch({ standalone: true });
      emitState();
    });
  }
  watchServiceWorker();
  return emitState();
}

export function getEonPwaLocalProfileTruth() {
  return getLocalFirstBoundaryNotice('pwa');
}
