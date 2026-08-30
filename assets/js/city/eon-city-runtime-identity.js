/**
 * W766IR2-0 — privacy-safe EON City runtime identity and remount quarantine.
 *
 * IDs are ephemeral browser-tab diagnostics. They contain no account, project,
 * prompt, file, provider, billing or device fingerprint data.
 */
export const EON_CITY_RUNTIME_IDENTITY_SCHEMA = 'eon.city.runtime-identity.w766ir2-0.v1';
export const EON_CITY_RUNTIME_READINESS_EVENT_LIMIT = 96;
export const EON_CITY_ALLOWED_MOUNT_REASONS = Object.freeze([
  'initial-entry',
  'explicit-restart-3d',
  'explicit-approved-release-reload',
  'verified-context-loss-recovery'
]);

const ALLOWED_REASON_SET = new Set(EON_CITY_ALLOWED_MOUNT_REASONS);
const OBJECT_IDENTITIES = new WeakMap();
let fallbackCounter = 0;

function freeze(value) { return Object.freeze(value); }
function safeText(value = '', max = 96) { return String(value || '').replace(/[^a-z0-9._:/-]/gi, '-').replace(/-+/g, '-').slice(0, max); }
function nextToken(kind = 'object') {
  fallbackCounter += 1;
  let entropy = '';
  try { entropy = globalThis.crypto?.randomUUID?.() || ''; } catch {}
  if (!entropy) entropy = `${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
  return `${safeText(kind, 28) || 'object'}:${entropy}`;
}

export function getEonCityObjectIdentity(value, kind = 'object') {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return null;
  const existing = OBJECT_IDENTITIES.get(value);
  if (existing) return existing;
  const id = nextToken(kind);
  OBJECT_IDENTITIES.set(value, id);
  return id;
}

export function ensureEonCityDocumentIdentity(documentRef = globalThis.document) {
  if (!documentRef) return 'document:unavailable';
  try {
    if (!documentRef.__eonCityDocumentIdentity) {
      Object.defineProperty(documentRef, '__eonCityDocumentIdentity', {
        value: getEonCityObjectIdentity(documentRef, 'document'), configurable: false, enumerable: false, writable: false
      });
    }
    if (documentRef.documentElement?.dataset) documentRef.documentElement.dataset.eonCityDocumentIdentity = documentRef.__eonCityDocumentIdentity;
    return documentRef.__eonCityDocumentIdentity;
  } catch {
    return getEonCityObjectIdentity(documentRef, 'document') || 'document:unavailable';
  }
}

export function ensureEonCityAccessMountIdentity(root) {
  if (!root) return 'access-mount:unavailable';
  if (!root.__eonCityAccessMountIdentity) {
    try {
      Object.defineProperty(root, '__eonCityAccessMountIdentity', {
        value: getEonCityObjectIdentity(root, 'access-mount'), configurable: false, enumerable: false, writable: false
      });
    } catch { root.__eonCityAccessMountIdentity = getEonCityObjectIdentity(root, 'access-mount'); }
  }
  if (root.dataset) root.dataset.eonCityAccessMountIdentity = root.__eonCityAccessMountIdentity;
  return root.__eonCityAccessMountIdentity;
}

export function normalizeEonCityMountRequest(request = {}, { defaultReason = '', defaultOwner = 'eon-city-access-station', defaultCaller = 'unknown' } = {}) {
  const candidate = request && typeof request === 'object' ? request : {};
  const reason = safeText(candidate.reason || defaultReason, 64);
  const owner = safeText(candidate.owner || defaultOwner, 64) || 'eon-city-access-station';
  const caller = safeText(candidate.caller || defaultCaller, 96) || 'unknown';
  const explicitUserAction = candidate.explicitUserAction === true;
  const verifiedContextLoss = candidate.verifiedContextLoss === true;
  const allowed = ALLOWED_REASON_SET.has(reason);
  let rejectionReason = '';
  if (!allowed) rejectionReason = 'mount-reason-not-allowed';
  else if (reason === 'explicit-restart-3d' && !explicitUserAction) rejectionReason = 'explicit-user-action-required';
  else if (reason === 'explicit-approved-release-reload' && !explicitUserAction) rejectionReason = 'explicit-user-action-required';
  else if (reason === 'verified-context-loss-recovery' && !verifiedContextLoss) rejectionReason = 'verified-context-loss-required';
  return freeze({
    schema: EON_CITY_RUNTIME_IDENTITY_SCHEMA,
    ok: !rejectionReason,
    reason,
    owner,
    caller,
    explicitUserAction,
    verifiedContextLoss,
    requestedAt: Number(candidate.requestedAt || Date.now()),
    rejectionReason: rejectionReason || null
  });
}

function serviceWorkerSnapshot(navigatorRef = globalThis.navigator) {
  const serviceWorker = navigatorRef?.serviceWorker;
  const controller = serviceWorker?.controller || null;
  let scriptUrl = '';
  try { scriptUrl = String(controller?.scriptURL || ''); } catch {}
  return freeze({
    controllerId: getEonCityObjectIdentity(controller, 'service-worker-controller'),
    scriptUrl: scriptUrl ? scriptUrl.slice(0, 240) : null,
    state: String(controller?.state || 'uncontrolled').slice(0, 32)
  });
}

export function createEonCityRuntimeIdentitySnapshot({
  root = null,
  documentRef = globalThis.document,
  navigatorRef = globalThis.navigator,
  runtime = root?.__eonCityRuntime || null,
  mountRequest = null,
  generation = Number(root?.dataset?.eonCityMountGeneration || 0)
} = {}) {
  let runtimeIdentity = null;
  try { runtimeIdentity = runtime?.getRuntimeIdentitySnapshot?.() || runtime?.getRuntimeSummary?.()?.runtimeIdentity || null; } catch {}
  return freeze({
    schema: EON_CITY_RUNTIME_IDENTITY_SCHEMA,
    documentId: ensureEonCityDocumentIdentity(documentRef),
    accessMountId: ensureEonCityAccessMountIdentity(root),
    generation: Number(generation || 0),
    mountReason: String(mountRequest?.reason || root?.dataset?.eonCityMountReason || '') || null,
    mountOwner: String(mountRequest?.owner || root?.dataset?.eonCityMountOwner || '') || null,
    mountCaller: String(mountRequest?.caller || root?.dataset?.eonCityMountCaller || '') || null,
    runtimeLifecycle: String(root?.dataset?.eonCityRuntimeLifecycle || 'idle'),
    preparationScreenCount: Number(root?.dataset?.eonCityPreparationScreenCount || 0),
    canvasId: runtimeIdentity?.canvasId || getEonCityObjectIdentity(root?.querySelector?.('canvas'), 'canvas'),
    engineId: runtimeIdentity?.engineId || null,
    sceneId: runtimeIdentity?.sceneId || null,
    playerRootId: runtimeIdentity?.playerRootId || null,
    cameraId: runtimeIdentity?.cameraId || null,
    renderLoopId: runtimeIdentity?.renderLoopId || null,
    serviceWorker: serviceWorkerSnapshot(navigatorRef)
  });
}

export function recordEonCityRuntimeReadinessEvent(root, type = 'runtime-event', detail = {}) {
  if (!root) return null;
  const safeDetail = detail && typeof detail === 'object' ? detail : {};
  const event = freeze({
    schema: EON_CITY_RUNTIME_IDENTITY_SCHEMA,
    type: safeText(type, 64) || 'runtime-event',
    at: Date.now(),
    reason: safeText(safeDetail.reason, 64) || null,
    owner: safeText(safeDetail.owner, 64) || null,
    caller: safeText(safeDetail.caller, 96) || null,
    generation: Number(safeDetail.generation || root?.dataset?.eonCityMountGeneration || 0),
    state: safeText(safeDetail.state, 64) || null,
    result: safeText(safeDetail.result, 64) || null,
    runtimeIds: safeDetail.runtimeIds || createEonCityRuntimeIdentitySnapshot({ root, mountRequest: safeDetail.mountRequest || null })
  });
  const ledger = Array.isArray(root.__eonCityRuntimeReadinessEvents) ? root.__eonCityRuntimeReadinessEvents : [];
  ledger.push(event);
  while (ledger.length > EON_CITY_RUNTIME_READINESS_EVENT_LIMIT) ledger.shift();
  root.__eonCityRuntimeReadinessEvents = ledger;
  try { root.dispatchEvent?.(new CustomEvent('eon:city-runtime-readiness', { detail: event })); } catch {}
  return event;
}

export function installEonCityRuntimeReadinessInspector(root, options = {}) {
  if (!root) return null;
  const documentRef = options.documentRef || globalThis.document;
  let view = null;
  let transitionActive = false;
  let lastFocus = null;
  let lifecycleHandlers = freeze({ onShow: null, onHide: null });
  const normalizeLifecycleResult = (result) => result && typeof result === 'object' ? result : freeze({ ok: result !== false });
  const inspect = () => freeze({
    schema: EON_CITY_RUNTIME_IDENTITY_SCHEMA,
    identity: createEonCityRuntimeIdentitySnapshot({ root, documentRef, navigatorRef: options.navigatorRef }),
    events: freeze([...(root.__eonCityRuntimeReadinessEvents || [])]),
    privateDataIncluded: false
  });
  const refreshView = () => {
    const output = view?.querySelector?.('[data-eon-city-runtime-readiness-output]');
    if (output) output.textContent = JSON.stringify(inspect(), null, 2);
    return inspect();
  };
  const hide = (reason = 'explicit-close') => {
    if (!view?.isConnected) return true;
    transitionActive = true;
    const released = normalizeLifecycleResult(lifecycleHandlers.onHide?.({ ownerId: 'city-readiness', reason }) ?? true);
    if (!released.ok) {
      transitionActive = false;
      return false;
    }
    const activeElement = documentRef?.activeElement || null;
    if (view.contains?.(activeElement)) {
      const target = lastFocus?.isConnected ? lastFocus : root.querySelector?.('canvas') || root;
      try { target?.focus?.({ preventScroll: true }); } catch {}
      if (view.contains?.(documentRef?.activeElement)) {
        try { activeElement?.blur?.(); } catch {}
      }
    }
    try { view?.remove?.(); } catch {}
    view = null;
    lastFocus = null;
    transitionActive = false;
    return true;
  };
  const show = (source = 'runtime-readiness') => {
    if (!documentRef?.createElement || !documentRef?.body?.append) return null;
    if (!view?.isConnected) {
      transitionActive = true;
      const acquired = normalizeLifecycleResult(lifecycleHandlers.onShow?.({ ownerId: 'city-readiness', source, explicitUserAction: true }) ?? true);
      if (!acquired.ok) {
        transitionActive = false;
        return null;
      }
      lastFocus = documentRef.activeElement;
      view = documentRef.createElement('aside');
      view.dataset.eonCityRuntimeReadiness = 'developer-view';
      view.setAttribute('aria-label', 'EON City runtime readiness diagnostics');
      view.setAttribute('role', 'dialog');
      Object.assign(view.style, {
        position: 'fixed', right: '12px', bottom: '12px', zIndex: '2147483000',
        width: 'min(560px, calc(100vw - 24px))', maxHeight: '70vh', overflow: 'auto',
        padding: '12px', border: '1px solid currentColor', borderRadius: '10px',
        background: '#07101a', color: '#f4f7fb', font: '12px/1.45 ui-monospace, monospace'
      });
      view.innerHTML = '<div><strong>City Runtime Readiness</strong> <button type="button" data-eon-city-runtime-readiness-refresh>Refresh</button> <button type="button" data-eon-city-runtime-readiness-close>Close</button></div><pre data-eon-city-runtime-readiness-output style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>';
      view.querySelector('[data-eon-city-runtime-readiness-refresh]')?.addEventListener('click', refreshView);
      view.querySelector('[data-eon-city-runtime-readiness-close]')?.addEventListener('click', () => hide('close-button'));
      documentRef.body.append(view);
      transitionActive = false;
    }
    refreshView();
    return view;
  };
  const setLifecycleHandlers = (next = {}) => {
    lifecycleHandlers = freeze({
      onShow: typeof next?.onShow === 'function' ? next.onShow : null,
      onHide: typeof next?.onHide === 'function' ? next.onHide : null
    });
    return freeze({ ok: true, hasOnShow: Boolean(lifecycleHandlers.onShow), hasOnHide: Boolean(lifecycleHandlers.onHide) });
  };
  root.__eonCityGetRuntimeReadiness = inspect;
  const authority = freeze({
    schema: EON_CITY_RUNTIME_IDENTITY_SCHEMA,
    getSnapshot: inspect,
    show,
    hide,
    refresh: refreshView,
    setLifecycleHandlers,
    isOpen: () => Boolean(view?.isConnected),
    getSurfaceLifecycle: () => freeze({
      logicalOpen: Boolean(view?.isConnected),
      transitionActive,
      successorOwnerId: '',
      connected: Boolean(view?.isConnected),
      accessibilityHidden: false,
      intentionallyHidden: false,
      geometryVisible: view?.isConnected ? true : false
    })
  });
  root.__eonCityRuntimeReadinessAuthority = authority;
  try { globalThis.EON_CITY_RUNTIME_READINESS = authority; } catch {}
  try {
    if (new URLSearchParams(globalThis.location?.search || '').get('cityReadiness') === '1') show();
  } catch {}
  return inspect;
}
