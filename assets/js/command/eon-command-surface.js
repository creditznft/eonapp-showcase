import { getEonCommandSurfaceModel } from './eon-command-registry.js';
import { dispatchEonWorkSurfaceOpen } from '../work-surface/eon-work-surface-registry.js';

const STYLE_HREF = '/assets/css/eon-command-surface.css?release=w724-2026-07-27';
const HINT_KEY = 'eon:quick-command-hint-seen:v1';
const CRITICAL_STYLE = '[data-eon-command-surface][hidden]{display:none!important}[data-eon-command-surface]{position:fixed;inset:0;z-index:1500}[data-eon-command-orb]{position:fixed;right:1rem;bottom:var(--eon-command-safe-bottom,1rem);z-index:1460}';
const freeze = (value) => Object.freeze(value);

function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function ensureStyles(documentRef) {
  if (!documentRef.querySelector?.('style[data-eon-command-critical-style]')) {
    const critical = documentRef.createElement('style');
    critical.dataset.eonCommandCriticalStyle = '1';
    critical.textContent = CRITICAL_STYLE;
    documentRef.head?.appendChild(critical);
  }
  if (documentRef.querySelector?.('link[data-eon-command-surface-style]')) return;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.eonCommandSurfaceStyle = '1';
  documentRef.head?.appendChild(link);
}

function dispatchEonEvent(environment, name, detail) {
  if (typeof environment?.dispatchEvent !== 'function') return false;
  let event = null;
  if (typeof environment?.CustomEvent === 'function') event = new environment.CustomEvent(name, { detail });
  else if (typeof environment?.Event === 'function') {
    event = new environment.Event(name);
    try { Object.defineProperty(event, 'detail', { configurable: true, enumerable: true, value: detail }); } catch {}
  }
  if (!event) return false;
  environment.dispatchEvent(event);
  return true;
}

function isElementLike(environment, value) {
  const ElementConstructor = environment?.HTMLElement;
  return typeof ElementConstructor === 'function' ? value instanceof ElementConstructor : Boolean(value?.focus && value?.nodeType === 1);
}

function focusableNodes(root) {
  return [...root.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hidden && node.getAttribute('aria-hidden') !== 'true');
}

function actionMarkup(command) {
  return `<button type="button" class="eon-command-primary" data-eon-command-id="${escapeText(command.id)}">
    <span class="eon-command-primary-icon" aria-hidden="true">${escapeText(command.icon || '•')}</span>
    <span><strong>${escapeText(command.label)}</strong><small>${escapeText(command.description)}</small></span>
  </button>`;
}

function linkMarkup(entry, className) {
  if (entry.action === 'event') return `<button type="button" class="${className}" data-eon-command-event="${escapeText(entry.event)}">${escapeText(entry.label)}</button>`;
  if (entry.action === 'surface') return `<button type="button" class="${className}" data-eon-command-surface="${escapeText(entry.surface)}">${escapeText(entry.label)}</button>`;
  return `<a class="${className}" href="${escapeText(entry.href || '/')}">${escapeText(entry.label)}</a>`;
}

function renderSurface(model) {
  const recent = model.recent.length
    ? `<section class="eon-command-section"><div class="eon-command-section-head"><h2>Recent</h2><span>Local to this browser</span></div><div class="eon-command-links">${model.recent.map((entry) => linkMarkup(entry, 'eon-command-link')).join('')}</div></section>`
    : '';
  return `<section class="eon-command-surface" data-eon-command-surface role="dialog" aria-modal="true" aria-labelledby="eon-command-title" aria-describedby="eon-command-purpose" tabindex="-1" hidden>
    <header class="eon-command-header">
      <div class="eon-command-brand"><span class="eon-command-mark" aria-hidden="true">✦</span><div><p>Quick Command</p><h1 id="eon-command-title">${escapeText(model.label)}</h1></div></div>
      <div class="eon-command-header-actions"><span class="eon-command-shortcut" aria-label="Keyboard shortcut">Alt K</span><button type="button" class="eon-command-close" data-eon-command-close aria-label="Close Quick Command">×</button></div>
    </header>
    <main class="eon-command-main">
      <section class="eon-command-intro"><p class="eon-command-kicker">Work from here</p><h2 id="eon-command-purpose">${escapeText(model.purpose)}</h2><p>${escapeText(model.status)}</p></section>
      <section class="eon-command-primary-grid" aria-label="Primary commands">${model.primary.map(actionMarkup).join('')}</section>
      <div class="eon-command-lower-grid">
        ${recent}
        <section class="eon-command-section"><div class="eon-command-section-head"><h2>Jump to</h2><span>${escapeText(model.label)} context</span></div><div class="eon-command-links">${model.jumps.map((entry) => linkMarkup(entry, 'eon-command-link')).join('')}</div></section>
        <details class="eon-command-advanced"><summary>Advanced controls</summary><div><a href="/settings">Settings</a><a href="/automations">Automations</a><a href="/local-ai">Local AI</a><a href="/help">Help</a>${model.page === 'eoncity' ? '<button type="button" data-eon-command-surface="creator-capture">Creator Capture</button><button type="button" data-eon-command-surface="plans">Plans &amp; access</button><button type="button" data-eon-command-surface="my-realm">My Realm</button>' : ''}</div></details>
      </div>
    </main>
    <footer class="eon-command-footer"><span>2D work surface · no automatic external action</span>${model.page === 'eoncity' ? '<button type="button" data-eon-command-close>Return to City</button>' : '<a href="/eoncity">Enter EON City</a>'}</footer>
  </section>`;
}

function installOrbSafeZone({ environment, document: documentRef, orb }) {
  if (!orb) return () => {};
  const composerSelector = '[data-eonbot-home-composer], body[data-eon-app-page="chat"] .chat-input-bar';
  let observer = null;
  let frame = 0;
  const sync = () => {
    frame = 0;
    const page = String(documentRef?.body?.dataset?.eonAppPage || documentRef?.body?.dataset?.pageType || '').toLowerCase();
    const fallback = page === 'eoncity' ? 84 : page === 'chat' || page === 'home' ? 92 : 16;
    let safeBottom = fallback;
    const composer = documentRef?.querySelector?.(composerSelector);
    if (composer?.getBoundingClientRect) {
      const rect = composer.getBoundingClientRect();
      const layoutHeight = Number(documentRef?.documentElement?.clientHeight || environment?.innerHeight || 0);
      if (layoutHeight > 0 && Number.isFinite(rect.top) && rect.top > 0 && rect.top < layoutHeight) {
        safeBottom = Math.max(fallback, Math.ceil(layoutHeight - rect.top + 12));
      }
    }
    (orb.parentElement || orb).style?.setProperty?.('--eon-command-safe-bottom', `${safeBottom}px`);
  };
  const schedule = () => {
    if (frame) return;
    if (typeof environment?.requestAnimationFrame === 'function') frame = environment.requestAnimationFrame(sync);
    else sync();
  };
  schedule();
  environment?.addEventListener?.('resize', schedule);
  environment?.addEventListener?.('orientationchange', schedule);
  environment?.visualViewport?.addEventListener?.('resize', schedule);
  environment?.visualViewport?.addEventListener?.('scroll', schedule);
  const composer = documentRef?.querySelector?.(composerSelector);
  if (composer && typeof environment?.ResizeObserver === 'function') {
    observer = new environment.ResizeObserver(schedule);
    observer.observe(composer);
  }
  return () => {
    if (frame && typeof environment?.cancelAnimationFrame === 'function') environment.cancelAnimationFrame(frame);
    observer?.disconnect?.();
    environment?.removeEventListener?.('resize', schedule);
    environment?.removeEventListener?.('orientationchange', schedule);
    environment?.visualViewport?.removeEventListener?.('resize', schedule);
    environment?.visualViewport?.removeEventListener?.('scroll', schedule);
  };
}

function showFirstUseHint({ environment, document: documentRef, orb }) {
  let seen = false;
  try { seen = environment.localStorage?.getItem(HINT_KEY) === '1'; } catch {}
  if (seen) return () => {};
  const hint = documentRef.createElement('div');
  hint.className = 'eon-command-hint';
  hint.dataset.eonCommandHint = '1';
  hint.setAttribute('role', 'status');
  hint.textContent = 'Quick actions';
  orb.insertAdjacentElement('beforebegin', hint);
  const dismiss = () => {
    hint.remove();
    try { environment.localStorage?.setItem(HINT_KEY, '1'); } catch {}
  };
  const timer = environment.setTimeout?.(dismiss, 6500);
  return () => { if (timer !== undefined) environment.clearTimeout?.(timer); hint.remove(); };
}

export function installEonQuickCommandSurface({
  environment = globalThis,
  document: documentRef = environment?.document,
  page = 'chat',
  recentItems = [],
  onShare = null
} = {}) {
  if (!documentRef?.body?.appendChild) return freeze({ ok: false, reason: 'command-surface-environment-unavailable', dispose() {} });
  if (documentRef.querySelector('[data-eon-command-orb]')) return freeze({ ok: false, reason: 'command-surface-already-mounted', dispose() {} });
  ensureStyles(documentRef);
  const model = getEonCommandSurfaceModel(page, { recentItems });
  const host = documentRef.createElement('div');
  host.className = 'eon-command-host';
  host.dataset.eonCommandHost = '1';
  host.dataset.eonCommandPage = model.page;
  host.innerHTML = `${renderSurface(model)}<button type="button" class="eon-command-orb" data-eon-command-orb aria-label="Open Quick Command" aria-haspopup="dialog" aria-expanded="false" title="Quick actions"><span aria-hidden="true">✦</span><span class="eon-command-orb-label">Quick</span></button>`;
  documentRef.body.appendChild(host);
  const surface = host.querySelector('[data-eon-command-surface]');
  const orb = host.querySelector('[data-eon-command-orb]');
  let returnFocus = null;
  let disposed = false;
  let controller = null;
  let inertSnapshot = [];
  const removeHint = showFirstUseHint({ environment, document: documentRef, orb });
  const removeSafeZone = installOrbSafeZone({ environment, document: documentRef, orb });

  const restoreDocumentInteraction = () => {
    for (const snapshot of inertSnapshot) {
      snapshot.element.inert = snapshot.inert;
      if (snapshot.hadInertAttribute) snapshot.element.setAttribute('inert', '');
      else snapshot.element.removeAttribute('inert');
    }
    inertSnapshot = [];
  };

  const isolateSurface = () => {
    restoreDocumentInteraction();
    inertSnapshot = [...documentRef.body.children]
      .filter((element) => element !== host && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName))
      .map((element) => ({ element, inert: Boolean(element.inert), hadInertAttribute: element.hasAttribute('inert') }));
    for (const snapshot of inertSnapshot) snapshot.element.inert = true;
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!surface || surface.hidden) return;
    surface.hidden = true;
    orb?.setAttribute('aria-expanded', 'false');
    documentRef.body.classList.remove('eon-command-open');
    restoreDocumentInteraction();
    if (restoreFocus && returnFocus?.focus) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };

  const focusSurface = () => surface?.querySelector('[data-eon-command-id]')?.focus({ preventScroll: true });

  const open = (trigger = orb) => {
    if (!surface || disposed || !surface.hidden) return;
    removeHint();
    returnFocus = isElementLike(environment, trigger) ? trigger : documentRef.activeElement;
    surface.hidden = false;
    orb?.setAttribute('aria-expanded', 'true');
    documentRef.body.classList.add('eon-command-open');
    isolateSurface();
    if (typeof environment.requestAnimationFrame === 'function') environment.requestAnimationFrame(focusSurface);
    else focusSurface();
    dispatchEonEvent(environment, 'eon:shell-popover-open', { source: 'quick-command' });
  };

  const runCommand = async (commandId) => {
    const command = model.primary.find((entry) => entry.id === commandId);
    if (!command) return;
    if (command.action === 'close') { close(); return; }
    if (command.action === 'href') { environment.location?.assign?.(command.href); return; }
    if (command.action === 'event') {
      close({ restoreFocus: false });
      dispatchEonEvent(environment, command.event, { source: 'quick-command', explicitUserAction: true, focus: true });
      return;
    }
    if (command.action === 'surface') {
      close({ restoreFocus: false });
      dispatchEonWorkSurfaceOpen({ id: command.surface, source: 'quick-command', explicitUserAction: true, context: { page: model.page } }, environment);
      return;
    }
    if (command.action === 'share') {
      close({ restoreFocus: false });
      try {
        if (typeof onShare === 'function') await onShare({ page: model.page, source: 'quick-command' });
        else dispatchEonEvent(environment, 'eon:share-command-center-open', { page: model.page, source: 'quick-command', explicitUserAction: true });
      } catch (error) {
        dispatchEonEvent(environment, 'eon:quick-command-error', { action: 'share', message: String(error?.message || 'Share is unavailable.'), source: 'quick-command' });
      }
    }
  };

  const onClick = (event) => {
    const target = event.target?.closest ? event.target : null;
    const closeButton = target?.closest('[data-eon-command-close]');
    if (closeButton) { close(); return; }
    const commandButton = target?.closest('[data-eon-command-id]');
    if (commandButton) { void runCommand(commandButton.dataset.eonCommandId || ''); return; }
    const surfaceButton = target?.closest('[data-eon-command-surface]');
    if (surfaceButton) {
      close({ restoreFocus: false });
      dispatchEonWorkSurfaceOpen({ id: surfaceButton.dataset.eonCommandSurface, source: 'quick-command', explicitUserAction: true, context: { page: model.page } }, environment);
      return;
    }
    const eventButton = target?.closest('[data-eon-command-event]');
    if (eventButton) {
      close({ restoreFocus: false });
      dispatchEonEvent(environment, eventButton.dataset.eonCommandEvent, { source: 'quick-command', explicitUserAction: true });
    }
  };
  const onKeyDown = (event) => {
    if (event.altKey && String(event.key || '').toLowerCase() === 'k') {
      event.preventDefault();
      if (surface.hidden) open(documentRef.activeElement); else close();
      return;
    }
    if (surface.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const nodes = focusableNodes(surface);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && documentRef.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && documentRef.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const onOrbClick = () => open(orb);
  orb?.addEventListener('click', onOrbClick);
  surface?.addEventListener('click', onClick);
  documentRef.addEventListener('keydown', onKeyDown);
  const onPageHide = () => controller?.dispose();
  environment.addEventListener?.('pagehide', onPageHide, { once: true });

  controller = freeze({
    ok: true,
    reason: null,
    schema: 'eonapp.quick-command.surface.w724.v1',
    page: model.page,
    model,
    element: surface,
    orb,
    open,
    close,
    dispose() {
      if (disposed) return;
      disposed = true;
      close({ restoreFocus: false });
      removeHint();
      removeSafeZone();
      orb?.removeEventListener('click', onOrbClick);
      surface?.removeEventListener('click', onClick);
      documentRef.removeEventListener('keydown', onKeyDown);
      environment.removeEventListener?.('pagehide', onPageHide);
      host.remove();
    }
  });
  return controller;
}
