import { inspectEonOriginStorage } from './pwa/eon-origin-storage-authority.js';
/**
 * W766IR2-E — explicit EONAPP offline-pack and connectivity authority.
 *
 * The service worker owns installation and cached bytes. This client module
 * exposes only bounded status. It never stores provider keys, prompts, files,
 * model outputs, cookies or cloud API responses.
 */
export const EON_OFFLINE_STATE_SCHEMA = 'eonapp.offline-state.w766ir2.v1';
export const EON_OFFLINE_PACKS = Object.freeze({ CORE: 'core', CITY: 'city' });

let initialized = false;
const listeners = new Set();
let state = Object.freeze({
  schema: EON_OFFLINE_STATE_SCHEMA,
  online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  installed: false,
  packs: Object.freeze([]),
  coreReady: false,
  cityReady: false,
  localAiPathReady: false,
  storageManagerAvailable: false,
  storagePersisted: false,
  storagePersistenceRequested: false,
  storagePersistenceGranted: false,
  storageUsageBytes: 0,
  storageQuotaBytes: 0,
  storageUsageRatio: null,
  busy: false,
  progress: null,
  lastError: '',
  serviceWorkerAvailable: typeof navigator !== 'undefined' && 'serviceWorker' in navigator
});

function freezeState(next = {}) {
  return Object.freeze({
    ...state,
    ...next,
    schema: EON_OFFLINE_STATE_SCHEMA,
    packs: Object.freeze([...(Array.isArray(next.packs) ? next.packs : state.packs || [])])
  });
}

function emit(next = {}) {
  state = freezeState(next);
  for (const listener of listeners) {
    try { listener(state); } catch {}
  }
  try { window.dispatchEvent(new CustomEvent('eon:offline-state', { detail: state })); } catch {}
  return state;
}

function errorMessage(code = '') {
  const value = String(code || 'offline-pack-operation-failed').replaceAll('_', '-');
  if (value === 'signed-in-required') return 'Sign in once while online to install EON City and the Expanse for offline use.';
  if (value === 'offline-manifest-unavailable') return 'The offline pack manifest could not be downloaded. Stay online and try again.';
  if (value.startsWith('offline-entry-integrity-mismatch')) return 'An offline file failed integrity verification. Nothing partial was activated.';
  if (value.startsWith('offline-entry-fetch-failed')) return 'An offline file could not be downloaded. The previous working pack was preserved.';
  if (value === 'service-worker-unavailable') return 'This browser cannot install the EONAPP offline pack.';
  if (value === 'explicit-user-action-required') return 'Offline installation requires your explicit button press.';
  return value.replaceAll('-', ' ');
}

async function resolveWorker(navigatorRef = globalThis.navigator) {
  if (!navigatorRef?.serviceWorker) return null;
  if (navigatorRef.serviceWorker.controller) return navigatorRef.serviceWorker.controller;
  try {
    const registration = await navigatorRef.serviceWorker.ready;
    return registration?.active || registration?.waiting || registration?.installing || null;
  } catch {
    return null;
  }
}

export async function sendEonOfflineWorkerMessage(message, { navigatorRef = globalThis.navigator, timeoutMs = 180_000 } = {}) {
  const worker = await resolveWorker(navigatorRef);
  if (!worker?.postMessage || typeof globalThis.MessageChannel !== 'function') throw new Error('service-worker-unavailable');
  return new Promise((resolve, reject) => {
    const channel = new globalThis.MessageChannel();
    const timeout = globalThis.setTimeout?.(() => {
      try { channel.port1.close(); channel.port2.close(); } catch {}
      reject(new Error('offline-worker-timeout'));
    }, Math.max(500, Number(timeoutMs || 0))) || null;
    channel.port1.onmessage = (event) => {
      if (timeout) globalThis.clearTimeout?.(timeout);
      try { channel.port1.close(); channel.port2.close(); } catch {}
      resolve(event.data || {});
    };
    try { worker.postMessage(message, [channel.port2]); }
    catch (error) {
      if (timeout) globalThis.clearTimeout?.(timeout);
      reject(error);
    }
  });
}

export function getEonOfflineState() {
  return state;
}

export async function inspectEonOfflineStorage({ navigatorRef = globalThis.navigator, requestPersistence = false } = {}) {
  const storage = navigatorRef?.storage || null;
  const originStorage = await inspectEonOriginStorage({ caches: globalThis.caches, indexedDb: globalThis.indexedDB });
  if (!storage) {
    return Object.freeze({
      originStorage,
      storageManagerAvailable: false,
      storagePersisted: false,
      storagePersistenceRequested: false,
      storagePersistenceGranted: false,
      storageUsageBytes: 0,
      storageQuotaBytes: 0,
      storageUsageRatio: null
    });
  }
  let storagePersistenceRequested = false;
  let storagePersistenceGranted = false;
  let storagePersisted = false;
  let estimate = null;
  if (requestPersistence === true && typeof storage.persist === 'function') {
    storagePersistenceRequested = true;
    try { storagePersistenceGranted = await storage.persist() === true; } catch {}
  }
  try { storagePersisted = storagePersistenceGranted || (typeof storage.persisted === 'function' && await storage.persisted() === true); } catch {
    storagePersisted = storagePersistenceGranted;
  }
  try { estimate = typeof storage.estimate === 'function' ? await storage.estimate() : null; } catch {}
  const usage = Math.max(0, Number(estimate?.usage || 0));
  const quota = Math.max(0, Number(estimate?.quota || 0));
  return Object.freeze({
    originStorage,
    storageManagerAvailable: true,
    storagePersisted,
    storagePersistenceRequested,
    storagePersistenceGranted,
    storageUsageBytes: Number.isFinite(usage) ? Math.floor(usage) : 0,
    storageQuotaBytes: Number.isFinite(quota) ? Math.floor(quota) : 0,
    storageUsageRatio: quota > 0 && Number.isFinite(usage) ? Math.min(1, usage / quota) : null
  });
}

export function isApprovedEonLocalAiLoopback(value = '') {
  try {
    const url = new URL(String(value || ''));
    const hostname = url.hostname.toLowerCase();
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1');
  } catch {
    return false;
  }
}

export async function refreshEonOfflineState(options = {}) {
  try {
    const [result, storage] = await Promise.all([
      sendEonOfflineWorkerMessage({ type: 'EONAPP_OFFLINE_PACK_STATUS_REQUEST' }, { ...options, timeoutMs: options.timeoutMs || 5_000 }),
      inspectEonOfflineStorage({ navigatorRef: options.navigatorRef })
    ]);
    if (result.type !== 'EONAPP_OFFLINE_PACK_STATUS') throw new Error('offline-status-invalid');
    return emit({
      ...result,
      ...storage,
      online: options.navigatorRef?.onLine ?? globalThis.navigator?.onLine ?? true,
      busy: false,
      progress: null,
      lastError: ''
    });
  } catch (error) {
    return emit({
      online: options.navigatorRef?.onLine ?? globalThis.navigator?.onLine ?? true,
      serviceWorkerAvailable: false,
      busy: false,
      progress: null,
      lastError: errorMessage(error?.message || error)
    });
  }
}

export async function installEonOfflinePack({ packs = ['core', 'city'], explicitUserAction = false, navigatorRef = globalThis.navigator } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', message: errorMessage('explicit-user-action-required') });
  const storageBefore = await inspectEonOfflineStorage({ navigatorRef, requestPersistence: true });
  emit({ ...storageBefore, busy: true, progress: { phase: 'starting', completed: 0, total: 0 }, lastError: '' });
  try {
    const result = await sendEonOfflineWorkerMessage({ type: 'EONAPP_OFFLINE_PACK_INSTALL', packs, explicitUserAction: true }, { navigatorRef, timeoutMs: 30 * 60 * 1000 });
    if (result?.ok !== true) throw new Error(String(result?.error || 'offline-pack-install-failed'));
    const storageAfter = await inspectEonOfflineStorage({ navigatorRef });
    emit({ ...result, ...storageAfter, storagePersistenceRequested: storageBefore.storagePersistenceRequested, storagePersistenceGranted: storageBefore.storagePersistenceGranted, online: navigatorRef?.onLine !== false, busy: false, progress: null, lastError: '' });
    return Object.freeze({ ok: true, ...result, ...storageAfter });
  } catch (error) {
    const code = String(error?.message || error || 'offline-pack-install-failed');
    const message = errorMessage(code);
    emit({ busy: false, progress: null, lastError: message });
    return Object.freeze({ ok: false, error: code, message });
  }
}

export async function uninstallEonOfflinePack({ explicitUserAction = false, navigatorRef = globalThis.navigator } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, error: 'explicit-user-action-required', message: errorMessage('explicit-user-action-required') });
  emit({ busy: true, progress: { phase: 'removing', completed: 0, total: 0 }, lastError: '' });
  try {
    const result = await sendEonOfflineWorkerMessage({ type: 'EONAPP_OFFLINE_PACK_UNINSTALL', explicitUserAction: true }, { navigatorRef, timeoutMs: 30_000 });
    if (result?.ok !== true) throw new Error(String(result?.error || 'offline-pack-uninstall-failed'));
    emit({ ...result, online: navigatorRef?.onLine !== false, busy: false, progress: null, lastError: '' });
    return Object.freeze({ ok: true, ...result });
  } catch (error) {
    const code = String(error?.message || error || 'offline-pack-uninstall-failed');
    const message = errorMessage(code);
    emit({ busy: false, progress: null, lastError: message });
    return Object.freeze({ ok: false, error: code, message });
  }
}

function handleWorkerMessage(event) {
  const data = event?.data || {};
  const type = String(data.type || '');
  if (type === 'EONAPP_OFFLINE_PACK_PROGRESS') {
    emit({
      busy: true,
      progress: Object.freeze({
        phase: data.phase || 'downloading',
        completed: Number(data.completed || 0),
        total: Number(data.total || 0),
        reusedEntries: Number(data.reusedEntries || 0),
        downloadedEntries: Number(data.downloadedEntries || 0)
      })
    });
    return;
  }
  if (type === 'EONAPP_OFFLINE_PACK_INSTALLED' || type === 'EONAPP_OFFLINE_PACK_REMOVED') {
    emit({ ...data, busy: false, progress: null, lastError: '' });
  }
}

export function initEonOfflineManager({ onStateChange = null, navigatorRef = globalThis.navigator, windowRef = globalThis.window } = {}) {
  if (typeof onStateChange === 'function') listeners.add(onStateChange);
  if (initialized || !windowRef) return state;
  initialized = true;
  const updateConnectivity = () => emit({ online: navigatorRef?.onLine !== false });
  windowRef.addEventListener?.('online', updateConnectivity);
  windowRef.addEventListener?.('offline', updateConnectivity);
  navigatorRef?.serviceWorker?.addEventListener?.('message', handleWorkerMessage);
  void refreshEonOfflineState({ navigatorRef });
  return emit({ online: navigatorRef?.onLine !== false, serviceWorkerAvailable: Boolean(navigatorRef?.serviceWorker) });
}
