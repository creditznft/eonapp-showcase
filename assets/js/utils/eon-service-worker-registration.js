/** W635 — one bounded service-worker registration path for current pages. */
export const EON_SERVICE_WORKER_REGISTRATION_SCHEMA = 'eon.service-worker.registration.w635.v1';
export const EON_SERVICE_WORKER_SCRIPT = '/sw.js';
export const EON_SERVICE_WORKER_SCOPE = '/';

export async function registerEonServiceWorker({
  navigatorRef = globalThis.navigator,
  disabled = false
} = {}) {
  const serviceWorker = navigatorRef?.serviceWorker;
  if (disabled || !serviceWorker || typeof serviceWorker.register !== 'function') {
    return Object.freeze({ ok: false, reason: disabled ? 'service-worker-disabled' : 'service-worker-unavailable', registration: null });
  }
  try {
    const registration = await serviceWorker.register(EON_SERVICE_WORKER_SCRIPT, {
      scope: EON_SERVICE_WORKER_SCOPE,
      updateViaCache: 'none'
    });
    return Object.freeze({
      ok: true,
      registration,
      script: EON_SERVICE_WORKER_SCRIPT,
      scope: EON_SERVICE_WORKER_SCOPE,
      updateViaCache: 'none',
      automaticUpdateApplication: false,
      automaticReload: false
    });
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'service-worker-registration-failed', error: String(error?.message || error), registration: null });
  }
}
