import {
  EON_WORK_SURFACE_CLOSE_EVENT,
  EON_WORK_SURFACE_OPEN_EVENT,
  EON_WORK_SURFACE_PRESENTATION_EVENT,
  EON_WORK_SURFACE_MINIMIZE_EVENT,
  EON_WORK_SURFACE_RESTORE_EVENT,
  dispatchEonWorkSurfaceOpen,
  normalizeEonWorkSurfaceInvocation,
  normalizeEonWorkSurfacePresentationMode
} from './eon-work-surface-registry.js';
import { mountEonCityW751StationWorkLoop } from './eon-station-work-loop.js';
import { mountEonCityW752ProgressionPanel } from './eon-city-progression-panel.js';

const STYLE_HREF = '/assets/css/eon-work-surface.css?release=w752-2026-07-29';
const HOST_SELECTOR = '[data-eon-work-surface-host]';
const freeze = (value) => Object.freeze(value);
const ADAPTER_LOAD_TIMEOUT_MS = 6000;

export const EON_WORK_SURFACE_ADAPTER_LOADERS = freeze({
  '/assets/js/work-surface/adapters/eon-chat-panel.js': () => import('./adapters/eon-chat-panel.js'),
  '/assets/js/work-surface/adapters/eon-productivity-panel.js': () => import('./adapters/eon-productivity-panel.js'),
  '/assets/js/work-surface/adapters/eon-nexus-panel.js': () => import('./adapters/eon-nexus-panel.js'),
  '/assets/js/work-surface/adapters/eon-command-centre-panel.js': () => import('./adapters/eon-command-centre-panel.js'),
  '/assets/js/work-surface/adapters/eon-share-panel.js': () => import('./adapters/eon-share-panel.js'),
  '/assets/js/work-surface/adapters/eon-creator-capture-panel.js': () => import('./adapters/eon-creator-capture-panel.js'),
  '/assets/js/work-surface/adapters/eon-plans-panel.js': () => import('./adapters/eon-plans-panel.js')
});

export function hasEonWorkSurfaceAdapterLoader(adapterPath = '') {
  return typeof EON_WORK_SURFACE_ADAPTER_LOADERS[String(adapterPath || '')] === 'function';
}

export async function loadEonWorkSurfaceAdapter(adapterPath = '') {
  const path = String(adapterPath || '');
  const loader = EON_WORK_SURFACE_ADAPTER_LOADERS[path];
  if (typeof loader !== 'function') throw new Error(`work-surface-adapter-not-registered:${path.slice(0, 120)}`);
  return loader();
}

async function loadEonWorkSurfaceAdapterBounded(adapterPath = '', environment = globalThis) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    const setTimer = environment?.setTimeout || globalThis.setTimeout;
    timer = setTimer?.(() => reject(new Error('work-surface-adapter-load-timeout')), ADAPTER_LOAD_TIMEOUT_MS) ?? null;
  });
  try { return await Promise.race([loadEonWorkSurfaceAdapter(adapterPath), timeout]); }
  finally {
    const clearTimer = environment?.clearTimeout || globalThis.clearTimeout;
    if (timer !== null) clearTimer?.(timer);
  }
}

function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function ensureStyle(documentRef) {
  if (documentRef.querySelector?.('link[data-eon-work-surface-style]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.eonWorkSurfaceStyle = '1';
  documentRef.head?.appendChild(link);
}

function focusableNodes(root) {
  return [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hidden && node.getAttribute('aria-hidden') !== 'true');
}

function isElementLike(environment, value) {
  const Constructor = environment?.HTMLElement;
  return typeof Constructor === 'function' ? value instanceof Constructor : Boolean(value?.focus && value?.nodeType === 1);
}

function renderHost(documentRef) {
  const root = documentRef.createElement('section');
  root.className = 'eon-work-surface';
  root.dataset.eonWorkSurfaceHost = '1';
  root.dataset.eonWorkSurfacePresentation = 'focus';
  root.hidden = true;
  root.style.cssText = 'position:fixed;z-index:1700;background:var(--clr-bg,#0d0f12);color:var(--clr-text,#f5f5f5);';
  root.tabIndex = -1;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'eon-work-surface-title');
  root.innerHTML = `<header class="eon-work-surface-header">
    <div class="eon-work-surface-brand"><span aria-hidden="true">✦</span><div><p data-eon-work-surface-eyebrow>Command workspace</p><h1 id="eon-work-surface-title" data-eon-work-surface-title>Loading…</h1></div></div>
    <div class="eon-work-surface-header-actions"><button type="button" data-eon-work-surface-minimize hidden aria-label="Minimize workspace and resume City">Minimize</button><button type="button" data-eon-work-surface-presentation hidden>Focus workspace</button><a href="/" data-eon-work-surface-fallback>Open page</a><button type="button" data-eon-work-surface-close aria-label="Close workspace">×</button></div>
  </header>
  <main class="eon-work-surface-main" data-eon-work-surface-main>
    <section class="eon-work-surface-loading" data-eon-work-surface-loading><span aria-hidden="true">✦</span><strong>Preparing workspace…</strong><p>Loading only the tools needed for this action.</p></section>
  </main>
  <footer class="eon-work-surface-footer"><span data-eon-work-surface-mode-copy>Shared 2D work surface · page, Quick Command and EON City use the same invocation contract</span><button type="button" data-eon-work-surface-close>Close</button></footer>`;
  return root;
}

export function installEonWorkSurfaceHost({ environment = globalThis, document: documentRef = environment?.document } = {}) {
  if (!documentRef?.body?.appendChild) return freeze({ ok: false, reason: 'work-surface-environment-unavailable', open() {}, close() {}, setPresentationMode() {}, dispose() {} });
  const existing = documentRef.querySelector(HOST_SELECTOR);
  if (existing?.EONWorkSurfaceController) return existing.EONWorkSurfaceController;
  ensureStyle(documentRef);
  const root = renderHost(documentRef);
  documentRef.body.appendChild(root);
  const main = root.querySelector('[data-eon-work-surface-main]');
  const title = root.querySelector('[data-eon-work-surface-title]');
  const eyebrow = root.querySelector('[data-eon-work-surface-eyebrow]');
  const fallback = root.querySelector('[data-eon-work-surface-fallback]');
  const minimizeButton = root.querySelector('[data-eon-work-surface-minimize]');
  const presentationButton = root.querySelector('[data-eon-work-surface-presentation]');
  const modeCopy = root.querySelector('[data-eon-work-surface-mode-copy]');
  let activeInvocation = null;
  let activeDispose = null;
  let returnFocus = null;
  let inertSnapshot = [];
  let generation = 0;
  let disposed = false;
  let minimized = false;

  const restoreInteraction = () => {
    for (const item of inertSnapshot) {
      item.element.inert = item.inert;
      if (item.hadAttribute) item.element.setAttribute('inert', '');
      else item.element.removeAttribute('inert');
    }
    inertSnapshot = [];
  };

  const isolate = () => {
    restoreInteraction();
    inertSnapshot = [...documentRef.body.children]
      .filter((element) => element !== root && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName))
      .map((element) => ({ element, inert: Boolean(element.inert), hadAttribute: element.hasAttribute('inert') }));
    for (const item of inertSnapshot) item.element.inert = true;
  };

  const cleanupAdapter = () => {
    try { activeDispose?.(); } catch {}
    activeDispose = null;
  };

  const isCityPresentation = () => activeInvocation?.context?.cityPresentation === true;

  const dispatchPresentation = () => {
    if (!activeInvocation || typeof environment.dispatchEvent !== 'function' || typeof environment.CustomEvent !== 'function') return;
    environment.dispatchEvent(new environment.CustomEvent(EON_WORK_SURFACE_PRESENTATION_EVENT, { detail: activeInvocation }));
  };

  const applyPresentationMode = (mode = 'focus', { announce = false } = {}) => {
    const presentationMode = normalizeEonWorkSurfacePresentationMode(mode);
    root.dataset.eonWorkSurfacePresentation = presentationMode;
    const blockingPresentation = presentationMode === 'focus' || presentationMode === 'sheet';
    root.setAttribute('aria-modal', blockingPresentation ? 'true' : 'false');
    documentRef.body.classList.toggle('eon-work-surface-focus-open', presentationMode === 'focus' && !root.hidden);
    documentRef.body.classList.toggle('eon-work-surface-dock-open', presentationMode === 'dock' && !root.hidden);
    documentRef.body.classList.toggle('eon-work-surface-sheet-open', presentationMode === 'sheet' && !root.hidden);
    if (blockingPresentation) isolate();
    else restoreInteraction();
    const allowModeToggle = isCityPresentation() && activeInvocation?.context?.allowFocusWorkspace !== false;
    const cityRoot = documentRef.querySelector?.('[data-eon-city-play-root]');
    const cityReturnMode = cityRoot?.dataset?.eonCityManagedSurfacePresentation === 'sheet' ? 'sheet' : 'dock';
    presentationButton.hidden = !allowModeToggle;
    minimizeButton.hidden = !isCityPresentation();
    presentationButton.textContent = presentationMode === 'focus' ? (cityReturnMode === 'sheet' ? 'Return to City Sheet' : 'Return to City Dock') : 'Focus workspace';
    presentationButton.setAttribute('aria-label', presentationMode === 'focus' ? (cityReturnMode === 'sheet' ? 'Return to City Sheet' : 'Return to City Dock') : 'Expand to Focus Workspace');
    modeCopy.textContent = presentationMode === 'sheet'
      ? 'City Sheet · touch-friendly workspace · close to resume the world exactly where you left it'
      : presentationMode === 'dock'
        ? 'City Dock · the world remains visible · movement and City audio are paused while you work'
        : isCityPresentation()
          ? `Focus Workspace · same adapter and state · return to City ${cityReturnMode === 'sheet' ? 'Sheet' : 'Dock'} or close to restore the exact City view`
          : 'Shared Focus Workspace · page, Quick Command and EON City use the same maintained adapter contract';
    if (activeInvocation) {
      activeInvocation = freeze({
        ...activeInvocation,
        presentationMode,
        context: freeze({ ...activeInvocation.context, presentationMode })
      });
    }
    if (announce) dispatchPresentation();
    return presentationMode;
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!activeInvocation && !minimized) return;
    generation += 1;
    cleanupAdapter();
    root.hidden = true;
    root.removeAttribute('data-eon-work-surface-id');
    documentRef.body.classList.remove('eon-work-surface-open', 'eon-work-surface-focus-open', 'eon-work-surface-dock-open', 'eon-work-surface-sheet-open');
    restoreInteraction();
    const invocation = activeInvocation;
    activeInvocation = null;
    minimized = false;
    root.dataset.eonWorkSurfaceMinimized = 'false';
    minimizeButton.hidden = true;
    presentationButton.hidden = true;
    if (restoreFocus && returnFocus?.focus) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    if (typeof environment.dispatchEvent === 'function' && typeof environment.CustomEvent === 'function') {
      environment.dispatchEvent(new environment.CustomEvent(EON_WORK_SURFACE_CLOSE_EVENT, { detail: invocation }));
    }
  };

  const navigate = (href = '/') => {
    const value = String(href || '/');
    if (!value.startsWith('/') || value.startsWith('//')) return false;
    close({ restoreFocus: false });
    environment.location?.assign?.(value);
    return true;
  };

  const dispatchLifecycle = (eventName, invocation) => {
    if (!invocation || typeof environment.dispatchEvent !== 'function' || typeof environment.CustomEvent !== 'function') return;
    environment.dispatchEvent(new environment.CustomEvent(eventName, { detail: invocation }));
  };

  const minimize = ({ restoreFocus = true } = {}) => {
    if (!activeInvocation || minimized) return freeze({ ok: false, reason: minimized ? 'work-surface-already-minimized' : 'work-surface-closed' });
    if (!isCityPresentation()) return freeze({ ok: false, reason: 'city-presentation-required' });
    minimized = true;
    root.dataset.eonWorkSurfaceMinimized = 'true';
    root.hidden = true;
    documentRef.body.classList.remove('eon-work-surface-open', 'eon-work-surface-focus-open', 'eon-work-surface-dock-open', 'eon-work-surface-sheet-open');
    restoreInteraction();
    const invocation = activeInvocation;
    if (restoreFocus && returnFocus?.focus) returnFocus.focus({ preventScroll: true });
    dispatchLifecycle(EON_WORK_SURFACE_MINIMIZE_EVENT, invocation);
    return freeze({ ok: true, minimized: true, invocation });
  };

  const restore = () => {
    if (!activeInvocation || !minimized) return freeze({ ok: false, reason: 'work-surface-not-minimized' });
    minimized = false;
    root.dataset.eonWorkSurfaceMinimized = 'false';
    root.hidden = false;
    documentRef.body.classList.add('eon-work-surface-open');
    const cityRoot = documentRef.querySelector?.('[data-eon-city-play-root]');
    const returnMode = cityRoot?.dataset?.eonCityManagedSurfacePresentation === 'sheet' ? 'sheet' : 'dock';
    applyPresentationMode(activeInvocation.presentationMode === 'focus' ? 'focus' : returnMode, { announce: false });
    dispatchLifecycle(EON_WORK_SURFACE_RESTORE_EVENT, activeInvocation);
    environment.requestAnimationFrame?.(() => (focusableNodes(root)[0] || root).focus?.({ preventScroll: true }));
    return freeze({ ok: true, minimized: false, invocation: activeInvocation });
  };

  const setPresentationMode = (mode = 'focus') => {
    if (root.hidden || !activeInvocation) return freeze({ ok: false, reason: 'work-surface-closed' });
    if (!isCityPresentation() && ['dock', 'sheet'].includes(normalizeEonWorkSurfacePresentationMode(mode))) return freeze({ ok: false, reason: 'city-presentation-required' });
    const presentationMode = applyPresentationMode(mode, { announce: true });
    environment.requestAnimationFrame?.(() => (focusableNodes(root)[0] || root).focus?.({ preventScroll: true }));
    return freeze({ ok: true, presentationMode, invocation: activeInvocation });
  };

  const open = async (input = {}, trigger = null) => {
    if (disposed) return freeze({ ok: false, reason: 'work-surface-disposed' });
    const invocation = normalizeEonWorkSurfaceInvocation(input);
    const request = ++generation;
    cleanupAdapter();
    const alreadyOpen = !root.hidden;
    activeInvocation = invocation;
    minimized = false;
    root.dataset.eonWorkSurfaceMinimized = 'false';
    if (!alreadyOpen) returnFocus = isElementLike(environment, trigger) ? trigger : documentRef.activeElement;
    root.hidden = false;
    root.dataset.eonWorkSurfaceId = invocation.id;
    documentRef.body.classList.add('eon-work-surface-open');
    title.textContent = invocation.definition.label;
    eyebrow.textContent = invocation.definition.eyebrow;
    fallback.href = invocation.definition.fallbackHref;
    fallback.textContent = `Open ${invocation.definition.label} page`;
    applyPresentationMode(invocation.presentationMode, { announce: false });
    main.innerHTML = `<section class="eon-work-surface-loading" data-eon-work-surface-loading><span aria-hidden="true">✦</span><strong>Preparing ${escapeText(invocation.definition.label)}…</strong><p>${escapeText(invocation.definition.description)}</p></section>`;
    root.scrollTop = 0;
    let pendingLoopDispose = null;
    try {
      const adapter = await loadEonWorkSurfaceAdapterBounded(invocation.definition.adapter, environment);
      if (request !== generation || root.hidden) return freeze({ ok: false, reason: 'work-surface-superseded' });
      const mount = adapter.mountEonWorkSurface || adapter.default;
      if (typeof mount !== 'function') throw new Error('adapter-mount-missing');
      main.innerHTML = '<section data-eon-city-progression-slot hidden></section><section data-eon-station-work-loop-slot hidden></section><div data-eon-work-surface-adapter-root></div>';
      const progressionSlot = main.querySelector('[data-eon-city-progression-slot]');
      const loopSlot = main.querySelector('[data-eon-station-work-loop-slot]');
      const adapterRoot = main.querySelector('[data-eon-work-surface-adapter-root]');
      const progressionResult = mountEonCityW752ProgressionPanel({ root: progressionSlot, environment, invocation: activeInvocation, open: (next, nextTrigger = null) => open(next, nextTrigger) });
      const loopResult = mountEonCityW751StationWorkLoop({ root: loopSlot, environment, invocation: activeInvocation });
      pendingLoopDispose = () => { try { progressionResult?.dispose?.(); } finally { loopResult?.dispose?.(); } };
      const result = await mount({
        root: adapterRoot,
        environment,
        document: documentRef,
        invocation: activeInvocation,
        close,
        navigate,
        setPresentationMode,
        open: (next, nextTrigger = null) => open(next, nextTrigger)
      });
      if (request !== generation || root.hidden) {
        try { result?.dispose?.(); } catch {}
        try { progressionResult?.dispose?.(); } catch {}
        try { loopResult?.dispose?.(); } catch {}
        return freeze({ ok: false, reason: 'work-surface-superseded' });
      }
      const adapterDispose = typeof result === 'function' ? result : result?.dispose || null;
      activeDispose = () => {
        try { adapterDispose?.(); } finally { try { progressionResult?.dispose?.(); } finally { loopResult?.dispose?.(); } }
      };
      pendingLoopDispose = null;
      const first = focusableNodes(root)[0] || root;
      environment.requestAnimationFrame?.(() => first.focus?.({ preventScroll: true }));
      return freeze({ ok: true, invocation: activeInvocation });
    } catch (error) {
      try { pendingLoopDispose?.(); } catch {}
      if (request !== generation) return freeze({ ok: false, reason: 'work-surface-superseded' });
      environment.console?.warn?.('[EON_WORK_SURFACE_ADAPTER_UNAVAILABLE]', invocation.id, error);
      const timedOut = String(error?.message || '') === 'work-surface-adapter-load-timeout';
      if (timedOut) {
        main.innerHTML = `<section class="eon-work-surface-error"><p>Workspace unavailable</p><h2>${escapeText(invocation.definition.label)} could not be opened here.</h2><p>This workspace took too long to prepare. Use the maintained page now or close and keep playing.</p><div><a href="${escapeText(invocation.definition.fallbackHref)}">Open ${escapeText(invocation.definition.label)} page</a><button type="button" data-eon-work-surface-close>Close</button></div><small>Reference: work-surface-load-timeout</small></section>`;
        return freeze({ ok: false, reason: 'adapter-load-timeout' });
      }
      main.innerHTML = `<section class="eon-work-surface-error"><p>Workspace unavailable</p><h2>${escapeText(invocation.definition.label)} could not be opened here.</h2><p>The normal page remains available and no action was performed automatically.</p><div><a href="${escapeText(invocation.definition.fallbackHref)}">Open normal page</a><button type="button" data-eon-work-surface-close>Close</button></div><small>Reference: work-surface-unavailable</small></section>`;
      return freeze({ ok: false, reason: 'adapter-load-failed' });
    }
  };

  const onOpen = (event) => { void open(event?.detail || {}, event?.detail?.trigger || null); };
  const onClick = (event) => {
    if (event.target.closest('[data-eon-work-surface-close]')) { close(); return; }
    if (event.target.closest('[data-eon-work-surface-minimize]')) { minimize(); return; }
    if (event.target.closest('[data-eon-work-surface-presentation]')) {
      const cityRoot = documentRef.querySelector?.('[data-eon-city-play-root]');
      const returnMode = cityRoot?.dataset?.eonCityManagedSurfacePresentation === 'sheet' ? 'sheet' : 'dock';
      const next = root.dataset.eonWorkSurfacePresentation === 'focus' ? returnMode : 'focus';
      setPresentationMode(next);
    }
  };
  const onKeydown = (event) => {
    if (root.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const nodes = focusableNodes(root);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && documentRef.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && documentRef.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  environment.addEventListener?.(EON_WORK_SURFACE_OPEN_EVENT, onOpen);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  const controller = freeze({
    ok: true,
    schema: 'eonapp.work-surface.host.w752.v4',
    open,
    close,
    minimize,
    restore,
    setPresentationMode,
    dispatch: (detail) => dispatchEonWorkSurfaceOpen(detail, environment),
    getState: () => freeze({ open: Boolean(activeInvocation), visible: Boolean(activeInvocation) && !root.hidden, minimized, invocation: activeInvocation, presentationMode: root.dataset.eonWorkSurfacePresentation || 'focus' }),
    dispose() {
      if (disposed) return;
      disposed = true;
      close({ restoreFocus: false });
      environment.removeEventListener?.(EON_WORK_SURFACE_OPEN_EVENT, onOpen);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeydown);
      root.remove();
    }
  });
  root.EONWorkSurfaceController = controller;
  return controller;
}
