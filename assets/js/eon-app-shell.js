import './utils/analytics-bridge.js';
import { initEonPwaManager, requestEonPwaInstall } from './eon-pwa-manager.js';
import { initEonOfflineManager } from './eon-offline-manager.js';
import { initEonRuntimeErrorTelemetry } from './utils/runtime-error-telemetry.js';
import { bootEonGrowthAttribution } from './growth/eon-growth-attribution.js';
import { ensureProfile, remixProfileAvatar, updateProfile } from './utils/profile.js';
import { renderAvatarMarkup } from './utils/avatar.js';
import { deleteChatThread, getActiveChatThread, getChatThreadQuery, listChatThreads, renameChatThread, setChatThreadPinned } from './utils/chat-threads.js';
import { getIdentityAccountHref } from './account/eon-identity-onboarding.js';
import { cancelEonNotificationReturnReminder, disableEonDeviceNotificationDelivery, getEonNotificationCenterSnapshot, markAllEonNotificationRead, markEonNotificationRead, renderEonNotificationCenterMarkup, requestEonDeviceNotificationDelivery, scheduleEonNotificationReturnReminder, testEonDeviceNotificationDelivery, updateEonNotificationPreferences } from './notifications/eon-notification-center.js';
import { bindEonShellProfileHover } from './shell/eon-shell-profile-popover.js';
import { installW630WholeAppUx } from './shell/eon-whole-app-ux.js';
import { installEonContinueSurface } from './retention/eon-continue-surface.js';
import { installEonQuickCommandSurface } from './command/eon-command-surface.js';
import { installEonWorkSurfaceHost } from './work-surface/eon-work-surface-host.js';
import {
  escapeEonShellText,
  getEonShellPageLabel,
  getEonShellPopoverPlacement,
  getEonShellDrawerAccessibilityState,
  isEonShellMobileViewport,
  normalizeEonShellPath,
  renderEonShellNavigationMarkup,
  resolveEonShellPage,
  shouldShowEonShellMobileProfileShortcut
} from './shell/eon-shell-navigation.js';
export { EONAPP_PRODUCT_HIERARCHY, EONAPP_COMPACT_PRIMARY_NAVIGATION } from './shell/eon-shell-navigation.js';
/**
 * W218 — Chat-first shell v2.
 *
 * This shell owns navigation chrome only. It does not access Vault secrets,
 * publish chats, or activate rewards, payments, referral payouts, ads, or
 * automatic social posting.
 */
const SIDEBAR_COLLAPSED_KEY = 'eon:shell:sidebar-collapsed:v1';
let currentShellIdentity = Object.freeze({ available: false, signedIn: false, rollout: 'disabled', resolved: false });
let signInDialogReturnFocus = null;
let shellModalReturnFocus = null;
let shellSignOutAction = null;
let activeShellSidebar = null;
let shellIdentityNotice = '';
async function openShellShareSheet(options = {}) {
  const module = await import('./utils/eon-share-sheet.js');
  return module.openEonShareSheet(options);
}

function scheduleWorkflowBridges(currentPage = '') {
  const page = String(currentPage || '').trim().toLowerCase();
  void import('./projects/eon-project-registry-bootstrap.js')
    .then((module) => module.installUniversalProjectRegistry())
    .catch(() => {});
  void import('./activation/eon-activation-service.js')
    .then((module) => module.installEonActivationService())
    .catch(() => {});
  void import('./notifications/eon-creator-outcome-activity-bridge.js')
    .then((module) => module.startEonCreatorOutcomeActivityBridge())
    .catch(() => {});
  if (page !== 'eoncity') {
    void import('./capabilities/eon-capability-service.js')
      .then((module) => module.installEonCapabilityService())
      .catch(() => {});
  }
  if (page === 'eoncity') {
    void import('./nexus/eon-nexus-city-projection-provider.js').then((module) => module.installEonNexusCityProjectionProvider()).catch(() => {});
  }
  if (new Set(['chat', 'create', 'projects', 'library', 'workspace', 'forge', 'automations']).has(page)) {
    void import('./referrals/eon-referral-server-client.js').then((module) => module.installReferralMilestoneBridge()).catch(() => {});
  }
  if (new Set(['chat', 'create', 'workspace', 'forge', 'automations']).has(page)) {
    void import('./notifications/eonbot-job-activity-bridge.js').then((module) => module.startEonbotJobActivityBridge()).catch(() => {});
  }
}

function normalizedPath(pathname = window.location.pathname) {
  return normalizeEonShellPath(pathname);
}
function resolvePage() {
  return resolveEonShellPage({
    pathname: window.location.pathname,
    explicit: String(document.body?.dataset?.eonAppPage || '').trim().toLowerCase()
  });
}
function escapeText(value = '') {
  return escapeEonShellText(value);
}
function isMobileViewport() {
  return isEonShellMobileViewport({ matchMedia: window.matchMedia?.bind(window), innerWidth: window.innerWidth });
}
export function shouldShowMobileProfileShortcut({ page = resolvePage(), hasHeaderAccount = Boolean(document.querySelector('[data-eon-header-account]')) } = {}) {
  return shouldShowEonShellMobileProfileShortcut({ page, hasHeaderAccount });
}
export function getShellPopoverPlacement(options = {}) {
  return getEonShellPopoverPlacement({
    ...options,
    viewportWidth: options.viewportWidth ?? window.innerWidth,
    viewportHeight: options.viewportHeight ?? window.innerHeight
  });
}
/**
 * W271-A0: every application-shell route receives the same non-blocking
 * accessibility and language bootstrap. The module is deliberately deferred
 * so shell navigation stays responsive; a failure here never blocks the page.
 */
function scheduleAccessibilityLanguageBootstrap() {
  const load = () => {
    import('./utils/accessibility-autoload.js').catch(() => {});
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(load, { timeout: 1200 });
  } else {
    window.setTimeout(load, 450);
  }
}
function readCollapsedPreference() {
  try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'; } catch { return false; }
}
function persistCollapsedPreference(value) {
  try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(Boolean(value))); } catch {}
}

function installRailTooltips(sidebar) {
  if (!sidebar || sidebar.querySelector('[data-eon-rail-tooltip]')) return () => {};
  const tooltip = document.createElement('div');
  tooltip.className = 'eon-app-rail-tooltip';
  tooltip.dataset.eonRailTooltip = '1';
  tooltip.hidden = true;
  tooltip.setAttribute('role', 'tooltip');
  document.body.appendChild(tooltip);
  const hide = () => { tooltip.hidden = true; tooltip.textContent = ''; };
  const show = (target) => {
    if (isMobileViewport() || !sidebar.classList.contains('is-collapsed')) return;
    const label = String(target?.dataset?.eonTooltip || target?.getAttribute?.('aria-label') || '').trim();
    if (!label) return;
    const rect = target.getBoundingClientRect();
    tooltip.textContent = label;
    tooltip.hidden = false;
    const width = tooltip.getBoundingClientRect().width || 120;
    const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right + 10));
    const top = Math.min(window.innerHeight - 38, Math.max(8, rect.top + (rect.height / 2) - 17));
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  };
  const listeners = [];
  sidebar.querySelectorAll('[data-eon-tooltip]').forEach((target) => {
    const onEnter = () => show(target);
    const onLeave = hide;
    const onFocus = () => show(target);
    const onBlur = hide;
    target.addEventListener('pointerenter', onEnter);
    target.addEventListener('pointerleave', onLeave);
    target.addEventListener('focus', onFocus);
    target.addEventListener('blur', onBlur);
    listeners.push([target, onEnter, onLeave, onFocus, onBlur]);
  });
  window.addEventListener('resize', hide);
  window.addEventListener('scroll', hide, true);
  return () => {
    listeners.forEach(([target, onEnter, onLeave, onFocus, onBlur]) => {
      target.removeEventListener('pointerenter', onEnter);
      target.removeEventListener('pointerleave', onLeave);
      target.removeEventListener('focus', onFocus);
      target.removeEventListener('blur', onBlur);
    });
    window.removeEventListener('resize', hide);
    window.removeEventListener('scroll', hide, true);
    tooltip.remove();
  };
}
function createNavMarkup(currentPage) {
  return renderEonShellNavigationMarkup(currentPage);
}
function focusableNodes(root) {
  return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hidden && node.offsetParent !== null);
}
function emitChatThreadChange(activeThreadId = '') {
  window.dispatchEvent(new CustomEvent('eon:chat-threads-changed', { detail: { activeThreadId } }));
}
function renderThreadRows(threads, active) {
  return threads.map((thread) => `
    <div class="eon-app-thread-row${thread.id === active?.id ? ' is-active' : ''}">
      <a class="eon-app-thread-link" href="${getChatThreadQuery(thread.id)}" aria-label="Open chat: ${escapeText(thread.title)}"${thread.id === active?.id ? ' aria-current="page"' : ''}><span>${escapeText(thread.title)}</span></a>
      <button type="button" class="eon-app-thread-menu-button" data-eon-thread-menu="${thread.id}" aria-label="Chat actions for ${escapeText(thread.title)}" aria-expanded="false">⋯</button>
      <div class="eon-app-thread-menu" data-eon-thread-actions="${thread.id}" hidden>
        <button type="button" data-eon-thread-pin="${thread.id}">${thread.pinned ? 'Unpin' : 'Pin'}</button>
        <button type="button" data-eon-thread-rename="${thread.id}">Rename</button>
        <button type="button" data-eon-thread-delete="${thread.id}">Delete</button>
      </div>
    </div>`).join('');
}
function renderChatHistory(sidebar) {
  const host = sidebar.querySelector('[data-eon-chat-history]');
  if (!host) return;
  const threads = listChatThreads();
  const active = getActiveChatThread();
  if (!threads.length) {
    host.innerHTML = '<section class="eon-app-thread-group"><p class="eon-app-nav-label">Recent</p><p class="eon-app-history-empty">Your local chats will appear here.</p></section>';
    return;
  }
  const pinned = threads.filter((thread) => Boolean(thread.pinned)).slice(0, 8);
  const recent = threads.filter((thread) => !thread.pinned).slice(0, 12);
  host.innerHTML = `${pinned.length ? `<section class="eon-app-thread-group"><p class="eon-app-nav-label">Pinned</p>${renderThreadRows(pinned, active)}</section>` : ''}<section class="eon-app-thread-group"><p class="eon-app-nav-label">Recent</p>${recent.length ? renderThreadRows(recent, active) : '<p class="eon-app-history-empty">No other local chats yet.</p>'}</section>`;
}
function closeThreadMenus(sidebar, exceptId = '') {
  sidebar.querySelectorAll('[data-eon-thread-actions]').forEach((menu) => {
    const keep = menu.dataset.eonThreadActions === exceptId;
    menu.hidden = !keep;
    const trigger = sidebar.querySelector(`[data-eon-thread-menu="${menu.dataset.eonThreadActions}"]`);
    if (trigger) trigger.setAttribute('aria-expanded', String(keep));
  });
}
/**
 * W424 — one close path for short-lived menus. These controls never persist
 * across a route restore, browser back-forward restore or a viewport change.
 * Modal dialogs are intentionally not touched here.
 */
function closeEphemeralShellOverlays({ except = '' } = {}) {
  const keep = String(except || '');
  document.querySelectorAll('[data-eon-thread-actions]').forEach((menu) => {
    const isThread = keep === 'thread';
    if (!isThread) menu.hidden = true;
    if (!isThread) {
      const trigger = document.querySelector(`[data-eon-thread-menu="${menu.dataset.eonThreadActions}"]`);
      trigger?.setAttribute('aria-expanded', 'false');
    }
  });
  const headerMenu = document.querySelector('[data-eon-header-menu]');
  if (headerMenu && keep !== 'header') headerMenu.hidden = true;
  if (keep !== 'header') document.querySelector('[data-eon-header-overflow]')?.setAttribute('aria-expanded', 'false');
  const sidebar = activeShellSidebar;
  if (!sidebar || keep === 'sidebar') return;
  sidebar.querySelector('[data-eon-shell-more]')?.setAttribute('hidden', '');
  sidebar.querySelector('[data-eon-shell-search]')?.setAttribute('hidden', '');
  sidebar.querySelector('[data-eon-shell-profile-menu]')?.setAttribute('hidden', '');
  sidebar.querySelector('[data-eon-shell-profile-trigger]')?.setAttribute('aria-expanded', 'false');
}
function resetEphemeralShellOverlayState() {
  closeEphemeralShellOverlays();
  document.querySelectorAll('[data-eon-thread-actions], [data-eon-header-menu], [data-eon-shell-more], [data-eon-shell-search], [data-eon-shell-profile-menu]').forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll('[data-eon-thread-menu], [data-eon-header-overflow], [data-eon-shell-profile-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
}
function bindChatHistory(sidebar) {
  sidebar.addEventListener('click', (event) => {
    const menuButton = event.target.closest('[data-eon-thread-menu]');
    if (menuButton) {
      event.preventDefault();
      const id = menuButton.dataset.eonThreadMenu || '';
      const menu = sidebar.querySelector(`[data-eon-thread-actions="${id}"]`);
      const shouldOpen = Boolean(menu?.hidden);
      if (shouldOpen) window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'thread' } }));
      closeThreadMenus(sidebar, shouldOpen ? id : '');
      return;
    }
    const pinButton = event.target.closest('[data-eon-thread-pin]');
    if (pinButton) {
      const id = pinButton.dataset.eonThreadPin || '';
      const current = listChatThreads().find((thread) => thread.id === id);
      const result = setChatThreadPinned(id, !current?.pinned);
      if (!result.ok && result.reason === 'pin-limit') window.alert('You can pin up to 8 local chats. Unpin one before adding another.');
      closeThreadMenus(sidebar);
      if (result.ok) emitChatThreadChange(id);
      return;
    }
    const renameButton = event.target.closest('[data-eon-thread-rename]');
    if (renameButton) {
      const id = renameButton.dataset.eonThreadRename || '';
      const current = listChatThreads().find((thread) => thread.id === id);
      const title = window.prompt('Rename chat', current?.title || 'New chat');
      if (title && renameChatThread(id, title)) emitChatThreadChange(id);
      closeThreadMenus(sidebar);
      return;
    }
    const deleteButton = event.target.closest('[data-eon-thread-delete]');
    if (deleteButton) {
      const id = deleteButton.dataset.eonThreadDelete || '';
      if (!window.confirm('Delete this local chat from this browser? This cannot be undone.')) return;
      const result = deleteChatThread(id);
      closeThreadMenus(sidebar);
      emitChatThreadChange(result.nextThread?.id || '');
      if (normalizedPath() === '/' || normalizedPath() === '/chat' || normalizedPath() === '/chat.html') {
        window.location.assign(result.nextThread ? getChatThreadQuery(result.nextThread.id) : '/?new=1');
      }
    }
  });
  document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target)) closeThreadMenus(sidebar);
  });
  window.addEventListener('eon:shell-popover-open', (event) => {
    if (event?.detail?.source !== 'thread') closeThreadMenus(sidebar);
  });
}
function setSidebarCollapsed(sidebar, collapsed) {
  const shouldCollapse = !isMobileViewport() && Boolean(collapsed);
  sidebar.classList.toggle('is-collapsed', shouldCollapse);
  document.body.classList.toggle('eon-app-sidebar-collapsed', shouldCollapse);
  const button = sidebar.querySelector('[data-eon-sidebar-collapse]');
  const brand = sidebar.querySelector('[data-eon-sidebar-brand-toggle]');
  if (button) {
    button.setAttribute('aria-pressed', String(shouldCollapse));
    button.setAttribute('aria-label', 'Collapse navigation');
    button.dataset.eonTooltip = 'Collapse sidebar';
    button.textContent = '‹';
  }
  if (brand) {
    brand.setAttribute('aria-label', shouldCollapse ? 'Open navigation' : 'EONAPP home');
    brand.dataset.eonTooltip = shouldCollapse ? 'Open sidebar' : 'EONAPP home';
    brand.dataset.eonBrandMode = shouldCollapse ? 'open-sidebar' : 'home';
  }
}
function bindHoverExpandSidebar(sidebar) {
  if (!sidebar) return () => {};
  let hoverCloseTimer = 0;
  const clearTimer = () => {
    if (hoverCloseTimer) window.clearTimeout(hoverCloseTimer);
    hoverCloseTimer = 0;
  };
  const canHoverExpand = () => !isMobileViewport()
    && sidebar.classList.contains('is-collapsed')
    && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches !== false;
  const open = () => {
    clearTimer();
    if (!canHoverExpand()) return;
    sidebar.classList.add('is-hover-expanded');
    sidebar.setAttribute('data-eon-hover-expanded', 'true');
  };
  const close = () => {
    clearTimer();
    hoverCloseTimer = window.setTimeout(() => {
      sidebar.classList.remove('is-hover-expanded');
      sidebar.removeAttribute('data-eon-hover-expanded');
    }, 120);
  };
  const closeNow = () => {
    clearTimer();
    sidebar.classList.remove('is-hover-expanded');
    sidebar.removeAttribute('data-eon-hover-expanded');
  };
  sidebar.addEventListener('pointerenter', open);
  sidebar.addEventListener('pointerleave', close);
  sidebar.addEventListener('focusin', open);
  sidebar.addEventListener('focusout', (event) => {
    if (!sidebar.contains(event.relatedTarget)) close();
  });
  window.addEventListener('resize', closeNow);
  window.addEventListener('eon:shell-popover-open', open);
  return () => {
    clearTimer();
    sidebar.removeEventListener('pointerenter', open);
    sidebar.removeEventListener('pointerleave', close);
    sidebar.removeEventListener('focusin', open);
    window.removeEventListener('resize', closeNow);
    window.removeEventListener('eon:shell-popover-open', open);
    closeNow();
  };
}
function setDrawerOpen(open, state) {
  const { sidebar, backdrop, mobileToggle, main } = state;
  const accessibility = getEonShellDrawerAccessibilityState({ mobile: isMobileViewport(), open });
  sidebar.dataset.eonDrawerState = accessibility.drawerState;
  sidebar.classList.toggle('is-open', accessibility.sidebarOpen);
  backdrop.classList.toggle('is-open', accessibility.backdropOpen);
  if (accessibility.sidebarAriaHidden) sidebar.setAttribute('aria-hidden', accessibility.sidebarAriaHidden);
  else sidebar.removeAttribute('aria-hidden');
  sidebar.inert = accessibility.sidebarInert;
  if (mobileToggle) mobileToggle.setAttribute('aria-expanded', accessibility.toggleExpanded);
  document.body.classList.toggle('eon-app-menu-open', accessibility.bodyMenuOpen);
  if (main) main.inert = accessibility.mainInert;
  if (accessibility.drawerState !== 'open') {
    closeEphemeralShellOverlays({ except: 'sidebar' });
    const restoreTarget = state.lastDrawerFocus;
    state.lastDrawerFocus = null;
    if (restoreTarget && !sidebar.contains(restoreTarget) && typeof restoreTarget.focus === 'function') {
      restoreTarget.focus();
    }
    return;
  }
  state.lastDrawerFocus = document.activeElement;
  requestAnimationFrame(() => sidebar.querySelector('[data-eon-mobile-close]')?.focus());
}
function focusNewChat() {
  if (resolvePage() !== 'chat') {
    window.location.assign('/?new=1');
    return;
  }
  window.dispatchEvent(new CustomEvent('eon:chat-new-thread', { detail: { focus: true } }));
}
function refreshShellProfile(profile = ensureProfile()) {
  const signedIn = Boolean(currentShellIdentity?.signedIn);
  const displayName = signedIn ? (profile.alias || 'EONAPP') : 'Guest';
  const avatar = renderAvatarMarkup(profile, { size: 36, alt: `${displayName} avatar` });
  document.querySelectorAll('[data-eon-shell-profile-avatar]').forEach((host) => { host.innerHTML = avatar; });
  document.querySelectorAll('[data-eon-shell-profile-alias]').forEach((host) => { host.textContent = displayName; });
}
function safeIdentityState(raw = {}) {
  return Object.freeze({
    available: Boolean(raw?.available),
    signedIn: Boolean(raw?.signedIn),
    rollout: String(raw?.rollout || 'disabled'),
    resolved: Boolean(raw?.resolved)
  });
}
async function readIdentityState() {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return safeIdentityState({ resolved: true });
    return safeIdentityState({ ...(await response.json()), resolved: true });
  } catch {
    return safeIdentityState({ resolved: true });
  }
}
function signInReturnTo() {
  // Keep an OAuth round-trip on the active public page. The server validates
  // this against its own allowlist before it ever becomes a redirect target.
  return normalizedPath();
}
function getIdentityNotice() {
  try {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('account');
    const safeCode = String(query.get('accountCode') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    if (status === 'cancelled') return 'Sign-in was cancelled. Your local workspace is still ready.';
    if (status === 'unavailable') return 'Google sign-in is not available on this deployment yet. Your local workspace is still ready.';
    if (status === 'error') {
      return safeCode
        ? `Sign-in did not finish. Try again. Reference: ${safeCode}.`
        : 'Sign-in did not finish. Please try again; your local workspace was not changed.';
    }
  } catch {}
  return '';
}
function captureAndCleanIdentityReturnQuery() {
  const notice = getIdentityNotice();
  if (notice) shellIdentityNotice = notice;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('account') && !url.searchParams.has('accountCode')) return;
    url.searchParams.delete('account');
    url.searchParams.delete('accountCode');
    const clean = `${url.pathname}${url.search}${url.hash}`;
    window.history?.replaceState?.(window.history.state, document.title, clean);
  } catch {}
}
function closeSimpleSignInDialog({ restoreFocus = true } = {}) {
  const layer = document.querySelector('[data-eon-signin-dialog-layer]');
  if (!layer || layer.hidden) return;
  layer.hidden = true;
  document.body?.classList.remove('eon-signin-dialog-open');
  if (restoreFocus && signInDialogReturnFocus instanceof HTMLElement && document.contains(signInDialogReturnFocus)) {
    signInDialogReturnFocus.focus({ preventScroll: true });
  }
  signInDialogReturnFocus = null;
}
function ensureSimpleSignInDialog() {
  let layer = document.querySelector('[data-eon-signin-dialog-layer]');
  if (layer) return layer;
  layer = document.createElement('div');
  layer.className = 'eon-signin-dialog-layer';
  layer.dataset.eonSigninDialogLayer = '1';
  layer.hidden = true;
  layer.innerHTML = '<section class="eon-signin-dialog" data-eon-signin-dialog role="dialog" aria-modal="true" aria-labelledby="eon-signin-dialog-title" tabindex="-1"></section>';
  document.body.appendChild(layer);
  layer.addEventListener('click', (event) => {
    if (event.target === layer) closeSimpleSignInDialog();
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSimpleSignInDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = layer.querySelector('[data-eon-signin-dialog]');
    const nodes = focusableNodes(dialog);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  return layer;
}
function renderSimpleSignInDialog(identity = currentShellIdentity) {
  const layer = ensureSimpleSignInDialog();
  const dialog = layer.querySelector('[data-eon-signin-dialog]');
  if (!dialog) return;
  const returnTo = signInReturnTo();
  const startHref = `/api/auth/google/start?${new URLSearchParams({ returnTo }).toString()}`;
  const checking = !identity.resolved;
  const available = Boolean(identity.available);
  const primary = checking
    ? '<button type="button" class="eon-signin-dialog-primary" data-eon-signin-google disabled aria-disabled="true">Checking Google sign-in…</button>'
    : (available
      ? `<a class="eon-signin-dialog-primary" data-eon-signin-google href="${startHref}"><span aria-hidden="true">G</span> Continue with Google</a>`
      : '<button type="button" class="eon-signin-dialog-primary" data-eon-signin-google disabled aria-disabled="true">Google sign-in unavailable</button>');
  const status = checking
    ? 'Checking whether Google sign-in is available…'
    : (shellIdentityNotice || getIdentityNotice() || (available ? '' : 'Google sign-in is not available on this deployment. You can still use EONAPP locally.'));
  dialog.innerHTML = `
    <button type="button" class="eon-signin-dialog-close" data-eon-signin-close aria-label="Close sign-in">×</button>
    <p class="eon-signin-dialog-kicker">EONAPP</p>
    <h2 id="eon-signin-dialog-title">Sign in to EONAPP</h2>
    <p class="eon-signin-dialog-copy">Use a Google account when you want to sign in. You can keep exploring as a guest.</p>
    <p class="eon-signin-dialog-privacy">Your chats, files, projects, Vault and City progress stay on this device unless you later choose a separate Sync action.</p>
    <div class="eon-signin-dialog-actions">${primary}</div>
    <p class="eon-signin-dialog-status" data-eon-signin-status role="status" aria-live="polite">${status}</p>`;
  dialog.querySelector('[data-eon-signin-close]')?.addEventListener('click', () => closeSimpleSignInDialog());
}
function openSimpleSignInDialog(trigger = document.activeElement) {
  if (currentShellIdentity.signedIn) {
    openShellUtilityModal('profile', trigger);
    return;
  }
  signInDialogReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  const layer = ensureSimpleSignInDialog();
  renderSimpleSignInDialog(currentShellIdentity);
  layer.hidden = false;
  document.body?.classList.add('eon-signin-dialog-open');
  window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'signin' } }));
  window.requestAnimationFrame(() => {
    const dialog = layer.querySelector('[data-eon-signin-dialog]');
    dialog?.querySelector('[data-eon-signin-google], [data-eon-signin-close]')?.focus({ preventScroll: true });
  });
}
const SETTINGS_TABS = Object.freeze([
  ['general', 'General'],
  ['appearance', 'Appearance'],
  ['voice', 'Voice & language'],
  ['sync', 'Data & recovery'],
  ['notifications', 'Notifications'],
  ['privacy', 'Privacy & safety'],
  ['local-ai', 'Local AI'],
  ['connected', 'Connections'],
  ['billing', 'Billing & plan'], ['invite', 'Invite & EON Keys']
]);
function closeShellUtilityModal({ restoreFocus = true } = {}) {
  const layer = document.querySelector('[data-eon-shell-modal-layer]');
  if (!layer || layer.hidden) return;
  layer.hidden = true;
  document.body?.classList.remove('eon-shell-modal-open');
  if (restoreFocus && shellModalReturnFocus instanceof HTMLElement && document.contains(shellModalReturnFocus)) {
    shellModalReturnFocus.focus({ preventScroll: true });
  }
  shellModalReturnFocus = null;
}
function ensureShellUtilityModal() {
  let layer = document.querySelector('[data-eon-shell-modal-layer]');
  if (layer) return layer;
  layer = document.createElement('div');
  layer.className = 'eon-shell-modal-layer';
  layer.dataset.eonShellModalLayer = '1';
  layer.hidden = true;
  layer.innerHTML = '<section class="eon-shell-modal" data-eon-shell-modal role="dialog" aria-modal="true" aria-labelledby="eon-shell-modal-title" tabindex="-1"></section>';
  document.body.appendChild(layer);
  layer.addEventListener('click', (event) => {
    if (event.target === layer) closeShellUtilityModal();
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeShellUtilityModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = layer.querySelector('[data-eon-shell-modal]');
    const nodes = focusableNodes(dialog);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  return layer;
}
function currentShellTheme() {
  try {
    const stored = String(localStorage.getItem('eon:theme') || '').trim().toLowerCase();
    return ['graphite', 'obsidian', 'ember'].includes(stored) ? stored : 'graphite';
  } catch {
    return document.documentElement.getAttribute('data-theme') || 'graphite';
  }
}
function applyShellTheme(theme) {
  const next = ['graphite', 'obsidian', 'ember'].includes(theme) ? theme : 'graphite';
  try { localStorage.setItem('eon:theme', next); } catch {}
  document.documentElement.setAttribute('data-theme', next);
  const colors = { graphite: '#111411', obsidian: '#070809', ember: '#17110e' };
  document.documentElement.style.backgroundColor = colors[next] || colors.graphite;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', colors[next] || colors.graphite));
  window.dispatchEvent(new CustomEvent('eon:theme-changed', { detail: { theme: next } }));
}
function renderSettingsPanel(tab = 'general') {
  const selected = SETTINGS_TABS.some(([id]) => id === tab) ? tab : 'general';
  const tabs = SETTINGS_TABS.map(([id, label]) => `<button type="button" role="tab" data-eon-settings-tab="${id}" aria-selected="${id === selected}" tabindex="${id === selected ? '0' : '-1'}">${label}</button>`).join('');
  const theme = currentShellTheme();
  const content = {
    general: '<p>Keep EONAPP simple: begin as a guest, create locally, and choose an account only when identity is useful.</p><p class="eon-shell-modal-note">For the complete view, open Profile & preferences. Your current browser work stays local by default.</p><a class="eon-shell-modal-link" href="/profile">Open Profile & preferences</a>',
    appearance: `<p>Choose the local dark appearance for this browser.</p><div class="eon-shell-theme-actions" role="group" aria-label="Appearance"><button type="button" data-eon-settings-theme="graphite" aria-pressed="${theme === 'graphite'}">Graphite</button><button type="button" data-eon-settings-theme="obsidian" aria-pressed="${theme === 'obsidian'}">Obsidian</button><button type="button" data-eon-settings-theme="ember" aria-pressed="${theme === 'ember'}">Ember</button></div>`,
    voice: '<p>Voice output and language choices are local preferences. Microphone input is always user-tapped and browser-permission based.</p><a class="eon-shell-modal-link" href="/profile#profile-voice-language">Open voice & language preferences</a>',
    'local-ai': '<p>Local AI stays opt-in on this device. Choose Make Local AI ready to check Local Lite or a supported desktop runtime; software/model downloads remain visible approvals and Local mode never silently switches to a hosted provider.</p><a class="eon-shell-modal-link" href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a>',
    sync: '<p><strong>One encrypted Portable Workspace Capsule.</strong> It is the live recovery path for all eligible local workspace records in this browser.</p><p>Google Login is identity-only. Google Drive will require a separate, future user-approved storage consent. Restore remains local, staged, confirmed, journaled, and fails closed when the file, passphrase, or selected browser state cannot be verified.</p><p class="eon-shell-modal-note">No cloud sync, provider connection, background upload, pairing, or automatic restore is active.</p><a class="eon-shell-modal-link" href="/vault#vault-backup">Open Vault backup</a>',
    notifications: renderEonNotificationCenterMarkup(getEonNotificationCenterSnapshot()),
    connected: '<p>No social, publishing, cloud-storage, wallet, payment or referral account is connected from this Settings view. Future connectors stay separate, explicit and approval-gated.</p><a class="eon-shell-modal-link" href="/profile#profile-sharing">Review sharing preferences</a>',
    privacy: '<p>Private browser work and Vault material are never shared from this modal. Diagnostics and aggregate measurement remain opt-in in your browser profile.</p><a class="eon-shell-modal-link" href="/profile#profile-privacy">Open Privacy preferences</a>',
    billing: '<p>Plans & Billing covers Plus, Studio, Power, Max, Pro and Ultra subscriptions plus the Ultimate one-time software purchase. Checkout is server-created and hosted by Dodo Payments; this dialog never handles card data or grants access itself.</p><a class="eon-shell-modal-link" href="/billing">Open Billing status</a><a class="eon-shell-modal-link" href="/eon-keys">Review EON Keys</a>',
    invite: '<p>EON Keys are non-cash app unlocks for eligible referral milestones. Reward issuance remains ledger-controlled and is never granted from this dialog.</p><a class="eon-shell-modal-link" href="/eon-keys">Open Invite & EON Keys</a>'
  }[selected] || '';
  return `<div class="eon-shell-modal-layout"><nav class="eon-shell-settings-tabs" role="tablist" aria-label="Settings sections">${tabs}</nav><section class="eon-shell-settings-panel" role="tabpanel" data-eon-settings-panel="${selected}"><h3>${SETTINGS_TABS.find(([id]) => id === selected)?.[1] || 'General'}</h3>${content}</section></div>`;
}
function renderProfilePanel() {
  const profile = ensureProfile();
  const signedIn = Boolean(currentShellIdentity.signedIn);
  const displayName = signedIn ? (profile.alias || 'EONAPP') : 'Guest';
  const accountLabel = signedIn ? 'Signed-in EONAPP account' : 'Guest workspace';
  const authActions = signedIn
    ? '<button type="button" class="eon-shell-modal-secondary" data-eon-shell-modal-signout>Log out</button><a class="eon-shell-modal-link" href="/profile#profile-account-backup">Account controls</a>'
    : '<button type="button" class="eon-shell-modal-primary" data-eon-shell-modal-signin>Continue with Google</button>';
  return `<div class="eon-shell-profile-modal-head"><span class="eon-shell-profile-modal-avatar">${renderAvatarMarkup(profile, { size: 58, alt: `${displayName} avatar` })}</span><div><p class="eon-shell-modal-kicker">${accountLabel}</p><h3>${escapeText(displayName)}</h3><p>Your local work remains in this browser until you create a Capsule.</p></div></div><label class="eon-shell-modal-field" for="eon-shell-profile-name">Display name<input id="eon-shell-profile-name" maxlength="24" autocomplete="nickname" value="${escapeText(profile.alias || '')}" placeholder="Add a local display name" /></label><div class="eon-shell-modal-actions"><button type="button" class="eon-shell-modal-primary" data-eon-shell-modal-save-name>Save name</button><button type="button" class="eon-shell-modal-secondary" data-eon-shell-modal-remix-avatar>New avatar</button></div><p class="eon-shell-modal-status" data-eon-shell-profile-status role="status" aria-live="polite"></p><div class="eon-shell-modal-divider"></div><div class="eon-shell-modal-actions"><a class="eon-shell-modal-link" href="/profile">Profile</a><a class="eon-shell-modal-link" href="/billing">Billing & plan</a><a class="eon-shell-modal-link" href="/eon-keys">EON Keys</a><a class="eon-shell-modal-link" href="/vault">Vault</a><a class="eon-shell-modal-link" href="/settings">Settings</a><a class="eon-shell-modal-link" href="/help">Help</a><a class="eon-shell-modal-link" href="/install">Install</a><a class="eon-shell-modal-link" href="/capsule">Backup Capsule</a>${authActions}</div>`;
}
function renderShellUtilityModal(kind = 'profile', detail = 'general') {
  const layer = ensureShellUtilityModal();
  const dialog = layer.querySelector('[data-eon-shell-modal]');
  if (!dialog) return;
  const mode = ['profile', 'settings'].includes(kind) ? kind : 'profile';
  const headings = { profile: 'Profile', settings: 'Settings' };
  const body = mode === 'profile' ? renderProfilePanel() : renderSettingsPanel(detail);
  dialog.dataset.eonShellModalMode = mode;
  dialog.dataset.eonShellModalDetail = detail;
  dialog.innerHTML = `<button type="button" class="eon-shell-modal-close" data-eon-shell-modal-close aria-label="Close ${headings[mode]}">×</button><header class="eon-shell-modal-header"><p class="eon-shell-modal-kicker">EONAPP</p><h2 id="eon-shell-modal-title">${headings[mode]}</h2></header><div class="eon-shell-modal-body">${body}</div>`;
  dialog.querySelector('[data-eon-shell-modal-close]')?.addEventListener('click', () => closeShellUtilityModal());
  dialog.querySelector('[data-eon-shell-modal-signin]')?.addEventListener('click', () => {
    closeShellUtilityModal({ restoreFocus: false });
    openSimpleSignInDialog(shellModalReturnFocus || document.activeElement);
  });
  dialog.querySelector('[data-eon-shell-modal-settings]')?.addEventListener('click', () => renderShellUtilityModal('settings', 'general'));
  dialog.querySelector('[data-eon-shell-open-apps]')?.addEventListener('click', () => renderShellUtilityModal('apps', 'general'));
  dialog.querySelector('[data-eon-notification-mark-all]')?.addEventListener('click', () => {
    markAllEonNotificationRead({ explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  });
  dialog.querySelectorAll('[data-eon-notification-mark-read]').forEach((button) => button.addEventListener('click', () => {
    markEonNotificationRead(button.dataset.eonNotificationMarkRead || '', { explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  }));
  dialog.querySelectorAll('[data-eon-notification-category]').forEach((input) => input.addEventListener('change', () => {
    updateEonNotificationPreferences({ categories: { [input.dataset.eonNotificationCategory || '']: input.checked } }, { explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  }));
  const updateNotificationQuietHours = () => {
    const enabled = Boolean(dialog.querySelector('[data-eon-notification-quiet-enabled]')?.checked);
    const start = String(dialog.querySelector('[data-eon-notification-quiet-start]')?.value || '22:00');
    const end = String(dialog.querySelector('[data-eon-notification-quiet-end]')?.value || '08:00');
    updateEonNotificationPreferences({ quietHours: { enabled, start, end } }, { explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  };
  dialog.querySelector('[data-eon-notification-quiet-enabled]')?.addEventListener('change', updateNotificationQuietHours);
  dialog.querySelector('[data-eon-notification-quiet-start]')?.addEventListener('change', updateNotificationQuietHours);
  dialog.querySelector('[data-eon-notification-quiet-end]')?.addEventListener('change', updateNotificationQuietHours);
  dialog.querySelector('[data-eon-notification-enable-device]')?.addEventListener('click', async () => {
    const status = dialog.querySelector('[data-eon-notification-device-status]');
    if (status) status.textContent = 'Requesting browser permission only because you pressed Enable…';
    const result = await requestEonDeviceNotificationDelivery({ explicitUserAction: true });
    if (status) status.textContent = result.ok ? (result.backgroundPush ? 'Device alerts enabled, including configured background Web Push.' : 'Device alerts enabled locally. Background Web Push still needs server configuration/proof.') : String(result.reason || result.error || 'Device alerts could not be enabled.');
    setTimeout(() => renderShellUtilityModal('settings', 'notifications'), 450);
  });
  dialog.querySelector('[data-eon-notification-test-device]')?.addEventListener('click', async () => {
    const status = dialog.querySelector('[data-eon-notification-device-status]');
    if (status) status.textContent = 'Sending one service-only test alert to your signed-in device…';
    const result = await testEonDeviceNotificationDelivery({ explicitUserAction: true });
    if (status) status.textContent = result.ok ? 'Push service accepted the device-alert test. Delivery is still verified on-device when you see it.' : String(result.reason || 'Device-alert test failed.');
  });
  dialog.querySelectorAll('[data-eon-notification-reminder]').forEach((button) => button.addEventListener('click', async () => {
    const status = dialog.querySelector('[data-eon-notification-device-status]');
    const delayMinutes = Number(button.dataset.eonNotificationReminder || 0);
    if (status) status.textContent = 'Scheduling one generic return reminder…';
    const result = await scheduleEonNotificationReturnReminder({ explicitUserAction: true, delayMinutes, route: location.pathname || '/' });
    if (status) status.textContent = result.ok ? 'One-time return reminder scheduled.' : String(result.reason || 'Return reminder could not be scheduled.');
    if (result.ok) setTimeout(() => renderShellUtilityModal('settings', 'notifications'), 350);
  }));
  dialog.querySelectorAll('[data-eon-notification-item-reminder]').forEach((button) => button.addEventListener('click', async () => {
    const status = dialog.querySelector('[data-eon-notification-device-status]');
    const delayMinutes = Number(button.dataset.eonNotificationItemReminder || 0);
    const route = String(button.dataset.eonNotificationReminderRoute || '/');
    if (status) status.textContent = 'Scheduling one return reminder for this activity…';
    const result = await scheduleEonNotificationReturnReminder({ explicitUserAction: true, delayMinutes, route });
    if (status) status.textContent = result.ok ? 'One-time activity reminder scheduled. It stores only the internal route and due time.' : String(result.reason || 'Return reminder could not be scheduled.');
    if (result.ok) setTimeout(() => renderShellUtilityModal('settings', 'notifications'), 350);
  }));
  dialog.querySelector('[data-eon-notification-cancel-reminder]')?.addEventListener('click', async () => {
    await cancelEonNotificationReturnReminder({ explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  });
  dialog.querySelector('[data-eon-notification-disable-device]')?.addEventListener('click', async () => {
    await disableEonDeviceNotificationDelivery({ explicitUserAction: true });
    renderShellUtilityModal('settings', 'notifications');
  });
  dialog.querySelectorAll('[data-eon-settings-tab]').forEach((button) => button.addEventListener('click', () => renderShellUtilityModal('settings', button.dataset.eonSettingsTab || 'general')));
  dialog.querySelectorAll('[data-eon-settings-theme]').forEach((button) => button.addEventListener('click', () => {
    applyShellTheme(button.dataset.eonSettingsTheme || 'graphite');
    renderShellUtilityModal('settings', 'appearance');
  }));
  dialog.querySelector('[data-eon-shell-modal-save-name]')?.addEventListener('click', () => {
    const input = dialog.querySelector('#eon-shell-profile-name');
    const status = dialog.querySelector('[data-eon-shell-profile-status]');
    const next = updateProfile({ alias: input?.value || '' });
    refreshShellProfile(next);
    window.dispatchEvent(new CustomEvent('eon:profile-changed'));
    if (status) status.textContent = 'Display name saved on this device.';
    const title = dialog.querySelector('.eon-shell-profile-modal-head h3');
    if (title) title.textContent = currentShellIdentity.signedIn ? (next.alias || 'EONAPP') : 'Guest';
  });
  dialog.querySelector('[data-eon-shell-modal-remix-avatar]')?.addEventListener('click', () => {
    const next = remixProfileAvatar();
    refreshShellProfile(next);
    window.dispatchEvent(new CustomEvent('eon:profile-changed'));
    renderShellUtilityModal('profile', 'general');
    const status = dialog.querySelector('[data-eon-shell-profile-status]');
    if (status) status.textContent = 'Local avatar refreshed.';
  });
  dialog.querySelector('[data-eon-shell-modal-signout]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await shellSignOutAction?.();
      closeShellUtilityModal();
    } catch {
      button.disabled = false;
    }
  });
}
function openShellUtilityModal(kind, trigger = document.activeElement, detail = 'general') {
  shellModalReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  const layer = ensureShellUtilityModal();
  renderShellUtilityModal(kind, detail);
  layer.hidden = false;
  document.body?.classList.add('eon-shell-modal-open');
  window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'shell-modal' } }));
  window.requestAnimationFrame(() => {
    const dialog = layer.querySelector('[data-eon-shell-modal]');
    dialog?.querySelector('input, [data-eon-shell-modal-save-name], [data-eon-settings-tab], a, button')?.focus({ preventScroll: true });
  });
}
function renderShellIdentityMenu(menu, identity = safeIdentityState()) {
  if (!menu) return;
  if (identity.signedIn) {
    menu.innerHTML = `
      <div class="eon-app-profile-menu-head"><strong>Signed in</strong><span>Account access is active. Your local work remains here until you create an encrypted Capsule.</span></div>
      <button type="button" role="menuitem" data-eon-shell-open-profile>Account</button>
      <button type="button" role="menuitem" data-eon-shell-open-settings>Settings</button>
      <button type="button" role="menuitem" data-eon-shell-open-appearance>Appearance</button>
      <a role="menuitem" href="/vault#provider-check">AI &amp; Providers</a><a role="menuitem" href="/capsule">Data &amp; backup</a><a role="menuitem" href="/billing">Billing &amp; plan</a><a role="menuitem" href="/help">Help</a>
      <button type="button" role="menuitem" data-eon-shell-signout>Sign out</button>`;
    return;
  }
  menu.innerHTML = `
    <div class="eon-app-profile-menu-head"><strong>Guest workspace</strong><span>Explore freely. Sign-in never creates a backup or grants Drive access.</span></div>
    <button type="button" role="menuitem" data-eon-shell-open-signin>Sign in with Google</button>
    <button type="button" role="menuitem" data-eon-shell-open-profile>Account</button>
    <button type="button" role="menuitem" data-eon-shell-open-settings>Settings</button>
    <button type="button" role="menuitem" data-eon-shell-open-appearance>Appearance</button>
    <a role="menuitem" href="/vault#provider-check">AI &amp; Providers</a><a role="menuitem" href="/capsule">Data &amp; backup</a><a role="menuitem" href="/billing">Billing &amp; plan</a><a role="menuitem" href="/help">Help</a>`;
}
function renderChatHeaderIdentityAction(identity = safeIdentityState()) {
  const action = document.querySelector('[data-eon-header-account]');
  if (!action) return;
  const label = identity.signedIn ? 'Profile' : 'Sign in';
  action.dataset.identityState = identity.signedIn ? 'signed-in' : (identity.available ? 'available' : 'guest');
  action.dataset.identityResolved = String(Boolean(identity.resolved));
  action.dataset.accountHref = getIdentityAccountHref(normalizedPath());
  action.setAttribute('aria-label', identity.signedIn ? 'Open profile and settings' : 'Sign in to EONAPP');
  action.title = identity.signedIn ? 'Profile and settings' : 'Sign in';
  const text = action.querySelector('[data-eon-header-account-label]');
  if (text) text.textContent = label;
  const glyph = action.querySelector('[data-eon-header-account-glyph]');
  if (glyph) {
    glyph.innerHTML = identity.signedIn
      ? renderAvatarMarkup(ensureProfile(), { size: 22, alt: '' })
      : '◌';
  }
}
function syncMobileProfileShortcut(mobileBar, page = resolvePage()) {
  const shortcut = mobileBar?.querySelector?.('[data-eon-mobile-profile]');
  if (!shortcut) return;
  const visible = shouldShowMobileProfileShortcut({ page, hasHeaderAccount: Boolean(document.querySelector('[data-eon-header-account]')) });
  shortcut.hidden = !visible;
  shortcut.setAttribute('aria-hidden', String(!visible));
  shortcut.tabIndex = visible ? 0 : -1;
}
function applyShellIdentityState(sidebar, identity = safeIdentityState()) {
  currentShellIdentity = safeIdentityState(identity);
  document.body.dataset.eonIdentityState = currentShellIdentity.signedIn ? 'signed-in' : 'guest';
  sidebar.querySelectorAll('[data-eon-shell-profile-mode]').forEach((node) => {
    node.textContent = currentShellIdentity.signedIn ? 'Signed in' : 'Guest · Sign in';
  });
  sidebar.querySelectorAll('[data-eon-shell-guest-utility]').forEach((node) => { node.hidden = Boolean(currentShellIdentity.signedIn); });
  refreshShellProfile();
  renderShellIdentityMenu(sidebar.querySelector('[data-eon-shell-profile-menu]'), currentShellIdentity);
  renderChatHeaderIdentityAction(currentShellIdentity);
  renderGlobalIdentityAction(currentShellIdentity);
  const signInLayer = document.querySelector('[data-eon-signin-dialog-layer]');
  if (signInLayer && !signInLayer.hidden) renderSimpleSignInDialog(currentShellIdentity);
}
function installChatHeaderActions() {
  if (resolvePage() !== 'chat') return;
  const header = document.querySelector('.chat-inner-header');
  if (!header || header.querySelector('[data-eon-chat-header-actions]')) return;
  const actions = document.createElement('div');
  actions.className = 'eon-chat-header-actions';
  actions.dataset.eonChatHeaderActions = '1';
  actions.innerHTML = `
    <button type="button" class="eon-chat-header-share" data-eon-header-share aria-label="Open Invite and Share Center" title="Share EONAPP"><span aria-hidden="true">↗</span><span>Share</span></button>
    <button type="button" class="eon-chat-header-account" data-eon-header-account data-identity-state="guest" aria-label="Sign in to EONAPP" aria-haspopup="dialog" title="Sign in"><span class="eon-chat-header-account-glyph" data-eon-header-account-glyph aria-hidden="true">◌</span><span data-eon-header-account-label>Sign in</span></button>
    <div class="eon-chat-overflow-wrap">
      <button type="button" class="eon-chat-overflow-button" data-eon-header-overflow aria-label="More chat options" aria-haspopup="menu" aria-expanded="false">⋯</button>
      <div class="eon-chat-overflow-menu" data-eon-header-menu role="menu" hidden>
        <button type="button" role="menuitem" data-eon-header-action="new">New chat</button>
        <button type="button" role="menuitem" data-eon-header-action="share">Share EONAPP</button>
        <button type="button" role="menuitem" data-eon-header-action="rename">Rename chat</button>
        <button type="button" role="menuitem" data-eon-header-action="profile">Profile &amp; settings</button>
        <button type="button" role="menuitem" data-eon-header-action="delete">Delete chat</button>
      </div>
    </div>`;
  header.appendChild(actions);
  const menu = actions.querySelector('[data-eon-header-menu]');
  const trigger = actions.querySelector('[data-eon-header-overflow]');
  const account = actions.querySelector('[data-eon-header-account]');
  const share = actions.querySelector('[data-eon-header-share]');
  const close = () => {
    if (menu) menu.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
  };
  const openShare = async () => {
    close();
    await openShellShareSheet({ type: 'eonapp' });
  };
  share?.addEventListener('click', () => { void openShare(); });
  account?.addEventListener('click', () => {
    close();
    if (account.dataset.identityState === 'signed-in') {
      openShellUtilityModal('profile', account);
      return;
    }
    openSimpleSignInDialog(account);
  });
  trigger?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const visible = Boolean(menu?.hidden);
    close();
    if (menu) menu.hidden = !visible;
    trigger.setAttribute('aria-expanded', String(visible));
    if (visible) window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'header' } }));
  });
  menu?.addEventListener('click', (event) => {
    const action = event.target.closest('[data-eon-header-action]')?.dataset.eonHeaderAction;
    if (!action) return;
    if (action === 'new') window.dispatchEvent(new CustomEvent('eon:chat-new-thread', { detail: { focus: true } }));
    if (action === 'share') void openShare();
    if (action === 'rename') window.dispatchEvent(new CustomEvent('eon:chat-rename-thread'));
    if (action === 'delete') window.dispatchEvent(new CustomEvent('eon:chat-delete-thread'));
    if (action === 'profile') openShellUtilityModal('profile', account);
    close();
  });
  document.addEventListener('click', (event) => { if (!actions.contains(event.target)) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('eon:shell-popover-open', (event) => { if (event?.detail?.source !== 'header') close(); });
}
function getShareTypeForPage(page = resolvePage()) {
  return page === 'eoncity' ? 'city' : 'eonapp';
}
function installGlobalShareCommandCenter(currentPage = resolvePage()) {
  if (document.querySelector('[data-eon-global-share-actions]')) return;
  // Chat already owns a native top-right header share button; EON City owns a
  // City HUD share button. Every other shell page gets the same top-right share
  // command center so the pattern is always present without duplicating controls.
  if (currentPage === 'chat' || currentPage === 'eoncity') return;
  const root = document.createElement('div');
  root.className = 'eon-app-global-actions';
  root.dataset.eonGlobalShareActions = '1';
  root.innerHTML = `
    <button type="button" class="eon-app-global-share" data-eon-global-share aria-label="Open EON Share Command Center"><span aria-hidden="true">↗</span><span>Share</span></button>
    <button type="button" class="eon-app-global-profile" data-eon-global-profile data-identity-state="guest" aria-label="Open profile and settings"><span data-eon-global-profile-glyph aria-hidden="true">◌</span><span data-eon-global-profile-label>Profile</span></button>
    <a class="eon-app-global-menu" href="/create" aria-label="Open Create" title="Create">＋</a>`;
  document.body.appendChild(root);
  root.querySelector('[data-eon-global-share]')?.addEventListener('click', async (event) => {
    event.preventDefault();
    await openShellShareSheet({ type: getShareTypeForPage(currentPage) });
  });
  root.querySelector('[data-eon-global-profile]')?.addEventListener('click', (event) => {
    if (currentShellIdentity.signedIn) {
      openShellUtilityModal('profile', event.currentTarget);
      return;
    }
    openSimpleSignInDialog(event.currentTarget);
  });
}
function installEonOfflineConnectivityIndicator() {
  let indicator = document.querySelector('[data-eon-offline-indicator]');
  if (!indicator) {
    indicator = document.createElement('a');
    indicator.href = '/install#offline-pack';
    indicator.className = 'eon-app-offline-indicator';
    indicator.dataset.eonOfflineIndicator = '1';
    indicator.hidden = true;
    indicator.setAttribute('aria-live', 'polite');
    indicator.setAttribute('aria-atomic', 'true');
    document.body.appendChild(indicator);
  }
  const render = (offlineState = {}) => {
    const offline = offlineState.online === false;
    document.body.dataset.eonConnectivity = offline ? 'offline' : 'online';
    document.body.dataset.eonOfflineCoreReady = offlineState.coreReady ? 'true' : 'false';
    document.body.dataset.eonOfflineCityReady = offlineState.cityReady ? 'true' : 'false';
    indicator.hidden = !offline;
    if (!offline) return;
    indicator.dataset.eonOfflineLevel = offlineState.coreReady ? (offlineState.cityReady ? 'full' : 'core') : 'limited';
    indicator.textContent = offlineState.cityReady
      ? 'Offline · EONAPP + City ready'
      : offlineState.coreReady
        ? 'Offline · EONAPP ready'
        : 'Offline · limited mode';
    indicator.title = offlineState.coreReady
      ? 'Local browser work remains available. Local Lite can continue when its cached browser model is ready, and desktop Local AI continues when its verified runtime is running; hosted-only actions stay disabled.'
      : 'Open Install while online to prepare EONAPP for reliable offline use.';
  };
  initEonOfflineManager({ onStateChange: render });
  return indicator;
}

function renderGlobalIdentityAction(identity = safeIdentityState()) {
  const action = document.querySelector('[data-eon-global-profile]');
  if (!action) return;
  action.dataset.identityState = identity.signedIn ? 'signed-in' : (identity.available ? 'available' : 'guest');
  action.setAttribute('aria-label', identity.signedIn ? 'Open profile and settings' : 'Sign in to EONAPP');
  const label = action.querySelector('[data-eon-global-profile-label]');
  if (label) label.textContent = identity.signedIn ? 'Profile' : 'Sign in';
  const glyph = action.querySelector('[data-eon-global-profile-glyph]');
  if (glyph) {
    glyph.innerHTML = identity.signedIn
      ? renderAvatarMarkup(ensureProfile(), { size: 22, alt: '' })
      : '◌';
  }
}
function installShell() {
  const body = document.body;
  if (!body || body.dataset.eonAppShell !== '1' || document.querySelector('.eon-app-sidebar')) return;
  bootEonGrowthAttribution();
  initEonRuntimeErrorTelemetry();
  initEonPwaManager();
  installEonOfflineConnectivityIndicator();
  captureAndCleanIdentityReturnQuery();
  scheduleAccessibilityLanguageBootstrap();
  const currentPage = resolvePage();
  scheduleWorkflowBridges(currentPage);
  const currentLabel = getEonShellPageLabel(currentPage);
  const profile = ensureProfile();
  const avatar = renderAvatarMarkup(profile, { size: 36, alt: `${profile.alias || 'EONAPP'} avatar` });
  const sidebar = document.createElement('aside');
  sidebar.className = 'eon-app-sidebar';
  sidebar.dataset.eonShellPage = currentPage;
  sidebar.setAttribute('aria-label', 'EONAPP application navigation');
  sidebar.innerHTML = `
    <div class="eon-app-sidebar-header">
      <div class="eon-app-brand-row">
        <a class="eon-app-brand" data-eon-sidebar-brand-toggle data-eon-tooltip="EONAPP home" href="/" aria-label="EONAPP home"><span aria-hidden="true">⚡</span><span class="eon-app-brand-title">EONAPP<em>.ch</em></span></a>
        <button type="button" class="eon-app-sidebar-collapse" data-eon-sidebar-collapse data-eon-tooltip="Collapse sidebar" aria-label="Collapse navigation" aria-pressed="false">‹</button>
        <button type="button" class="eon-app-mobile-close" data-eon-mobile-close aria-label="Close navigation">×</button>
      </div>
      <button type="button" class="eon-app-new-chat" data-eon-new-chat="1" data-eon-tooltip="New chat" aria-label="Start a new chat"><span aria-hidden="true">＋</span><span class="eon-app-new-chat-label">New chat</span></button>
    </div>
    <div class="eon-app-sidebar-scroll" data-eon-sidebar-scroll>
      <nav class="eon-app-nav" aria-label="Application">
        ${createNavMarkup(currentPage)}
      </nav>
      <section class="eon-app-chat-history-wrap" aria-label="Local chats">
        <div class="eon-app-chat-history" data-eon-chat-history></div>
      </section>
    </div>
    <div class="eon-app-search-popover" data-eon-shell-search hidden>
      <label><span>Search chats</span><input type="search" data-eon-shell-search-input placeholder="Search local chat titles" autocomplete="off" /></label>
      <div data-eon-shell-search-results></div>
    </div>
    <div class="eon-app-sidebar-footer" data-eon-sidebar-footer>
      <div class="eon-app-sidebar-utilities" data-eon-sidebar-utilities hidden aria-hidden="true"></div>
      <div class="eon-app-profile-menu" data-eon-shell-profile-menu role="menu" hidden></div>
      <button type="button" class="eon-app-profile-selector" data-eon-shell-profile-trigger data-eon-tooltip="Account, settings and help" aria-label="Open profile menu" aria-haspopup="menu" aria-expanded="false">
        <span class="eon-app-profile-avatar" data-eon-shell-profile-avatar>${avatar}</span>
        <span class="eon-app-profile-copy"><strong data-eon-shell-profile-alias>Guest</strong><small data-eon-shell-profile-mode>Guest · Sign in</small></span>
      </button>
    </div>`;
  const mobileBar = document.createElement('div');
  mobileBar.className = 'eon-app-mobilebar';
  mobileBar.innerHTML = `
    <button type="button" class="eon-app-mobile-menu" data-eon-sidebar-toggle aria-label="Open navigation" aria-expanded="false">☰</button>
    <div class="eon-app-mobile-title">${escapeText(currentLabel)}</div>
    <div class="eon-app-mobile-actions"><button type="button" class="eon-app-mobile-new" data-eon-mobile-new aria-label="New chat">＋</button><button type="button" class="eon-app-mobile-profile" data-eon-mobile-profile aria-label="Sign in to EONAPP" data-eon-shell-profile-avatar>${avatar}</button></div>`;
  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'eon-app-sidebar-backdrop';
  backdrop.tabIndex = -1;
  backdrop.setAttribute('aria-label', 'Close navigation');
  body.prepend(backdrop);
  body.prepend(sidebar);
  body.prepend(mobileBar);
  body.classList.add('eon-app-shell-active');
  const state = { sidebar, backdrop, mobileToggle: mobileBar.querySelector('[data-eon-sidebar-toggle]'), main: body.querySelector(':scope > main'), lastDrawerFocus: null };
  activeShellSidebar = sidebar;
  setSidebarCollapsed(sidebar, currentPage === 'eoncity' ? true : readCollapsedPreference());
  setDrawerOpen(false, state);
  renderChatHistory(sidebar);
  bindChatHistory(sidebar);
  // Never restore stale inline menus after browser navigation or a deployment update.
  resetEphemeralShellOverlayState();
  installChatHeaderActions();
  installGlobalShareCommandCenter(currentPage);
  installW630WholeAppUx();
  installEonContinueSurface();
  const workSurface = installEonWorkSurfaceHost({ environment: window, document });
  window.EONWorkSurface = workSurface;
  const quickCommand = installEonQuickCommandSurface({
    environment: window,
    document,
    page: currentPage,
    recentItems: currentPage === 'chat' ? listChatThreads().slice(0, 4).map((thread) => ({ label: thread.title, href: getChatThreadQuery(thread.id) })) : [],
    onShare: () => openShellShareSheet({ type: getShareTypeForPage(currentPage) })
  });
  window.EONQuickCommand = quickCommand;
  syncMobileProfileShortcut(mobileBar, currentPage);
  applyShellIdentityState(sidebar, safeIdentityState({ resolved: false }));
  void readIdentityState().then((identity) => applyShellIdentityState(sidebar, identity));
  state.mobileToggle?.addEventListener('click', () => setDrawerOpen(!sidebar.classList.contains('is-open'), state));
  sidebar.querySelector('[data-eon-mobile-close]')?.addEventListener('click', () => setDrawerOpen(false, state));
  backdrop.addEventListener('click', () => setDrawerOpen(false, state));
  sidebar.querySelector('[data-eon-new-chat]')?.addEventListener('click', focusNewChat);
  mobileBar.querySelector('[data-eon-mobile-new]')?.addEventListener('click', focusNewChat);
  mobileBar.querySelector('[data-eon-mobile-profile]')?.addEventListener('click', (event) => {
    if (currentShellIdentity.signedIn) {
      openShellUtilityModal('profile', event.currentTarget);
      return;
    }
    openSimpleSignInDialog(event.currentTarget);
  });
  sidebar.querySelector('[data-eon-sidebar-collapse]')?.addEventListener('click', () => {
    const next = !sidebar.classList.contains('is-collapsed');
    persistCollapsedPreference(next);
    setSidebarCollapsed(sidebar, next);
  });
  sidebar.querySelector('[data-eon-sidebar-brand-toggle]')?.addEventListener('click', (event) => {
    if (!isMobileViewport() && sidebar.classList.contains('is-collapsed')) {
      event.preventDefault();
      persistCollapsedPreference(false);
      setSidebarCollapsed(sidebar, false);
    }
  });
  const destroyRailTooltips = installRailTooltips(sidebar);
  if (currentPage === 'eoncity') {
    sidebar.classList.remove('is-hover-expanded');
    sidebar.removeAttribute('data-eon-hover-expanded');
    sidebar.dataset.eonCityHoverExpand = 'disabled';
  }
  const destroyHoverExpandSidebar = currentPage === 'eoncity'
    ? () => {}
    : bindHoverExpandSidebar(sidebar);
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setDrawerOpen(false, state)));
  const moreMenu = sidebar.querySelector('[data-eon-shell-more]');
  const searchPopover = sidebar.querySelector('[data-eon-shell-search]');
  const searchInput = sidebar.querySelector('[data-eon-shell-search-input]');
  const searchResults = sidebar.querySelector('[data-eon-shell-search-results]');
  const profileMenu = sidebar.querySelector('[data-eon-shell-profile-menu]');
  const profileTrigger = sidebar.querySelector('[data-eon-shell-profile-trigger]');
  const placePopover = (popover, anchor, { align = 'start', width = 264 } = {}) => {
    if (!popover || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const measured = popover.getBoundingClientRect();
    const placement = getShellPopoverPlacement({
      anchorRect: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      popoverWidth: measured.width || popover.scrollWidth || width,
      popoverHeight: measured.height || popover.scrollHeight || 320,
      align,
      collapsed: sidebar.classList.contains('is-collapsed')
    });
    popover.style.setProperty('--eon-shell-popover-left', `${placement.left}px`);
    popover.style.setProperty('--eon-shell-popover-top', `${placement.top}px`);
  };
  const profileHoverBinding = bindEonShellProfileHover({
    trigger: profileTrigger,
    menu: profileMenu,
    closeOthers: () => { if (moreMenu) moreMenu.hidden = true; if (searchPopover) searchPopover.hidden = true; },
    place: () => placePopover(profileMenu, profileTrigger, { align: 'end', width: 286 }),
    notifyOpen: () => window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'sidebar' } })),
    matchMedia: window.matchMedia?.bind(window)
  });
  const closeUtilityPopovers = () => {
    profileHoverBinding.clear();
    if (moreMenu) moreMenu.hidden = true;
    if (searchPopover) searchPopover.hidden = true;
    if (profileMenu) profileMenu.hidden = true;
    profileTrigger?.setAttribute('aria-expanded', 'false');
  };
  const renderSearch = () => {
    if (!searchResults) return;
    const query = String(searchInput?.value || '').trim().toLowerCase();
    const matches = listChatThreads().filter((thread) => !query || thread.title.toLowerCase().includes(query)).slice(0, 8);
    searchResults.innerHTML = matches.length
      ? matches.map((thread) => `<a href="${getChatThreadQuery(thread.id)}">${escapeText(thread.title)}</a>`).join('')
      : '<p>No local chats found.</p>';
  };
  sidebar.querySelectorAll('[data-eon-shell-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.eonShellAction;
    if (action === 'more') {
      const next = Boolean(moreMenu?.hidden);
      closeUtilityPopovers();
      if (moreMenu) {
        moreMenu.hidden = !next;
        if (next) placePopover(moreMenu, button, { width: 214 });
      }
      if (next) window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'sidebar' } }));
    }
    if (action === 'search') {
      const next = Boolean(searchPopover?.hidden);
      closeUtilityPopovers();
      if (searchPopover) {
        searchPopover.hidden = !next;
        if (next) placePopover(searchPopover, button, { width: 280 });
      }
      if (next) {
        window.dispatchEvent(new CustomEvent('eon:shell-popover-open', { detail: { source: 'sidebar' } }));
        renderSearch();
        window.requestAnimationFrame(() => searchInput?.focus());
      }
    }
  }));
  sidebar.querySelectorAll('[data-eon-shell-utility]').forEach((button) => button.addEventListener('click', () => {
    const utility = button.dataset.eonShellUtility;
    if (utility === 'settings') openShellUtilityModal('settings', button);
    if (utility === 'install') void requestInstall();
  }));
  searchInput?.addEventListener('input', renderSearch);
  window.addEventListener('eon:shell:open-search', () => {
    const trigger = sidebar.querySelector('[data-eon-shell-action="search"]');
    trigger?.click();
  });
  window.addEventListener('eon:shell:open-appearance', () => openShellUtilityModal('settings', document.querySelector('[data-eon-command-orb]'), 'appearance'));
  moreMenu?.querySelector('[data-eon-shell-more-settings]')?.addEventListener('click', () => {
    closeUtilityPopovers();
    openShellUtilityModal('settings', sidebar.querySelector('[data-eon-shell-action="more"]'), 'appearance');
  });
  const requestInstall = async () => {
    const result = await requestEonPwaInstall({ explicitUserAction: true });
    if (!result.ok && result.guidance) window.alert(result.guidance);
    return result;
  };
  shellSignOutAction = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    if (!response.ok) {
      window.alert('Sign out could not be completed. Your local EONAPP work was not changed.');
      throw new Error('logout_failed');
    }
    applyShellIdentityState(sidebar, safeIdentityState({ resolved: true, available: currentShellIdentity.available }));
    closeUtilityPopovers();
  };
  profileMenu?.addEventListener('click', async (event) => {
    const openProfile = event.target.closest('[data-eon-shell-open-profile]');
    if (openProfile) {
      closeUtilityPopovers();
      openShellUtilityModal('profile', profileTrigger);
      return;
    }
    const openSettings = event.target.closest('[data-eon-shell-open-settings]');
    if (openSettings) {
      closeUtilityPopovers();
      openShellUtilityModal('settings', profileTrigger);
      return;
    }
    const openAppearance = event.target.closest('[data-eon-shell-open-appearance]');
    if (openAppearance) {
      closeUtilityPopovers();
      openShellUtilityModal('settings', profileTrigger, 'appearance');
      return;
    }
    const signIn = event.target.closest('[data-eon-shell-open-signin]');
    if (signIn) {
      closeUtilityPopovers();
      openSimpleSignInDialog(profileTrigger);
      return;
    }
    const install = event.target.closest('[data-eon-shell-install]');
    if (install) {
      closeUtilityPopovers();
      void requestInstall();
      return;
    }
    const signOut = event.target.closest('[data-eon-shell-signout]');
    if (!signOut) return;
    signOut.disabled = true;
    try {
      await shellSignOutAction?.();
    } catch {
      signOut.disabled = false;
    }
  });
  sidebar.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) setDrawerOpen(false, state);
  });
  document.addEventListener('click', (event) => { if (!sidebar.contains(event.target)) closeUtilityPopovers(); });
  window.addEventListener('eon:shell-popover-open', (event) => { if (event?.detail?.source !== 'sidebar') closeUtilityPopovers(); });
  window.addEventListener('pagehide', () => {
    destroyRailTooltips();
    destroyHoverExpandSidebar();
    if (activeShellSidebar === sidebar) activeShellSidebar = null;
    shellSignOutAction = null;
    profileHoverBinding.clear();
  }, { once: true });
  window.addEventListener('eon:chat-threads-changed', () => { renderChatHistory(sidebar); renderSearch(); });
  window.addEventListener('eon:profile-changed', () => refreshShellProfile());
  window.addEventListener('storage', (event) => {
    if (event.key === 'eon:profile' || event.key === 'eon:profile:v1') window.location.reload();
    if (event.key === 'eon:chat:threads:v1' || event.key === 'eon:chat:active-thread:v1') renderChatHistory(sidebar);
  });
  // Menu surfaces are deliberately ephemeral: one escape, outside tap, scroll or
  // browser restore returns the shell to its clean closed state.
  document.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-eon-thread-actions], [data-eon-thread-menu], [data-eon-header-menu], [data-eon-header-overflow], [data-eon-shell-more], [data-eon-shell-search], [data-eon-shell-profile-menu], [data-eon-shell-profile-trigger], [data-eon-shell-action]')) {
      closeEphemeralShellOverlays();
    }
  }, true);
  window.addEventListener('scroll', () => closeEphemeralShellOverlays(), true);
  window.addEventListener('pageshow', () => resetEphemeralShellOverlayState());
  window.addEventListener('resize', () => {
    setSidebarCollapsed(sidebar, readCollapsedPreference());
    setDrawerOpen(sidebar.classList.contains('is-open'), state);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeSimpleSignInDialog(); closeShellUtilityModal(); closeUtilityPopovers(); closeEphemeralShellOverlays(); setDrawerOpen(false, state); }
    if (event.key !== 'Tab' || !isMobileViewport() || !sidebar.classList.contains('is-open')) return;
    const nodes = focusableNodes(sidebar);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}
export function initEonAppShell() {
  installShell();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installShell, { once: true });
} else {
  installShell();
}
