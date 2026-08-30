/**
 * W662H — one visible City modal, one focus owner, one input boundary.
 *
 * This coordinator does not open work, navigate, approve, start audio, or own
 * any panel content. It observes the existing review-first panels and keeps
 * keyboard focus, Escape, Tab and gameplay input coherent while one is open.
 */

export const EON_CITY_OVERLAY_COORDINATOR_SCHEMA = 'eon.city.overlay-coordinator.w662h.v1';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([hidden])',
  'button:not([disabled]):not([hidden])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function isVisible(node) {
  if (!node || node.hidden === true) return false;
  if (node.getAttribute?.('aria-hidden') === 'true') return false;
  try {
    const style = node.ownerDocument?.defaultView?.getComputedStyle?.(node);
    if (style?.display === 'none' || style?.visibility === 'hidden') return false;
  } catch {}
  return true;
}

function visibleFocusable(panel) {
  return [...(panel?.querySelectorAll?.(FOCUSABLE_SELECTOR) || [])]
    .filter((node) => isVisible(node) && node.getAttribute?.('aria-disabled') !== 'true');
}

function isCloseControl(node) {
  if (!node) return false;
  if ([...Object.keys(node.dataset || {})].some((key) => key.startsWith('eonPlayClose'))) return true;
  const label = String(node.getAttribute?.('aria-label') || node.textContent || '').trim().toLowerCase();
  return /^(close|return|stay|back|cancel|done|resume|explore)/.test(label);
}

function findCloseControl(panel) {
  const controls = visibleFocusable(panel);
  return controls.find(isCloseControl) || controls.at(-1) || null;
}

function clearGameplayInput(runtime) {
  try { runtime?.clearInput?.('overlay-open'); } catch {}
  for (const direction of ['forward', 'backward', 'left', 'right', 'up', 'down']) {
    try { runtime?.setMove?.(direction, false); } catch {}
  }
  try { runtime?.setAnalogMove?.({ x: 0, z: 0 }); } catch {}
}

export function getEonCityOverlayCoordinatorTruth() {
  return Object.freeze({
    schema: EON_CITY_OVERLAY_COORDINATOR_SCHEMA,
    oneVisibleModal: true,
    gameplayInputCleared: true,
    focusTrap: true,
    escapeUsesVisibleCloseAction: true,
    focusReturnsToTriggerOrCanvas: true,
    hidesCompetingHudWhileModalOpen: true,
    startsWork: false,
    navigatesAutomatically: false,
    approvesAutomatically: false
  });
}

export function bindEonCityOverlayCoordinator(root, {
  getRuntime = () => null,
  document: documentRef = root?.ownerDocument || globalThis.document,
  environment = documentRef?.defaultView || globalThis,
  onStatus = () => {}
} = {}) {
  if (!root?.querySelectorAll || !documentRef?.addEventListener) {
    return Object.freeze({ ok: false, reason: 'overlay-coordinator-environment-unavailable', dispose() {} });
  }

  if (!root.dataset) root.dataset = {};
  root.dataset.eonCityOverlayAuthority = EON_CITY_OVERLAY_COORDINATOR_SCHEMA;
  const readDialogs = () => [...root.querySelectorAll('[role="dialog"][aria-modal="true"]')];
  const session = root.querySelector('.eon-play-session') || root;
  const canvas = root.querySelector('[data-eon-play-canvas-host] canvas, .eon-play-canvas');
  let activePanel = null;
  let returnFocus = null;
  let lastExternalControl = null;
  let disposed = false;
  let synchronizing = false;

  const setModalState = (panel) => {
    activePanel = panel || null;
    const open = Boolean(activePanel);
    if (session?.dataset) session.dataset.eonCityModalOpen = String(open);
    root.classList?.toggle('eon-city-overlay-open', open);
    root.setAttribute?.('aria-busy', 'false');
    if (open) clearGameplayInput(getRuntime?.());
  };

  const restoreFocus = () => {
    const target = returnFocus?.isConnected && isVisible(returnFocus) ? returnFocus : canvas;
    returnFocus = null;
    try { target?.focus?.({ preventScroll: true }); } catch { try { target?.focus?.(); } catch {} }
  };

  const sync = () => {
    if (disposed || synchronizing) return;
    synchronizing = true;
    try {
      const visible = readDialogs().filter(isVisible);
      const chosen = visible.at(-1) || null;
      if (chosen) {
        if (activePanel !== chosen) {
          if (!returnFocus) {
            returnFocus = lastExternalControl?.isConnected ? lastExternalControl : documentRef.activeElement;
            if (chosen.contains?.(returnFocus)) returnFocus = lastExternalControl;
          }
          for (const panel of visible) {
            if (panel !== chosen) panel.hidden = true;
          }
          setModalState(chosen);
          const focusables = visibleFocusable(chosen);
          const current = documentRef.activeElement;
          if (!chosen.contains?.(current)) {
            const target = focusables.find((node) => !isCloseControl(node)) || focusables[0] || chosen;
            if (!target.hasAttribute?.('tabindex') && target === chosen) target.tabIndex = -1;
            try { target.focus?.({ preventScroll: true }); } catch { target.focus?.(); }
          }
          onStatus('City menu open. Movement is paused; Tab stays in this panel and Escape closes it.');
        }
      } else if (activePanel) {
        setModalState(null);
        restoreFocus();
        onStatus('Returned to City. Movement remains released until your next input.');
      }
    } finally {
      synchronizing = false;
    }
  };

  const onClickCapture = (event) => {
    const control = event.target?.closest?.('button, a[href], [role="button"], input, select, textarea');
    if (control && (!activePanel || !activePanel.contains(control))) lastExternalControl = control;
  };

  const onKeyDown = (event) => {
    const panel = activePanel && isVisible(activePanel) ? activePanel : readDialogs().filter(isVisible).at(-1);
    if (!panel) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      const close = findCloseControl(panel);
      if (close) close.click?.();
      else panel.hidden = true;
      queueMicrotask(sync);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = visibleFocusable(panel);
    if (!focusables.length) {
      event.preventDefault();
      panel.tabIndex = -1;
      panel.focus?.();
      return;
    }
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && documentRef.activeElement === first) {
      event.preventDefault();
      last.focus?.();
    } else if (!event.shiftKey && documentRef.activeElement === last) {
      event.preventDefault();
      first.focus?.();
    }
  };

  const onLifecycleBoundary = () => {
    clearGameplayInput(getRuntime?.());
    sync();
  };
  const onVisibilityChange = () => {
    if (documentRef?.visibilityState === 'hidden') onLifecycleBoundary();
    else sync();
  };
  const observer = typeof environment?.MutationObserver === 'function'
    ? new environment.MutationObserver(sync)
    : null;
  observer?.observe?.(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'style', 'class'] });
  root.addEventListener('click', onClickCapture, true);
  root.addEventListener('keydown', onKeyDown, true);
  environment?.addEventListener?.('blur', onLifecycleBoundary);
  environment?.addEventListener?.('pagehide', onLifecycleBoundary);
  environment?.addEventListener?.('orientationchange', onLifecycleBoundary);
  documentRef?.addEventListener?.('visibilitychange', onVisibilityChange);
  sync();

  return Object.freeze({
    ok: true,
    schema: EON_CITY_OVERLAY_COORDINATOR_SCHEMA,
    getActivePanel: () => activePanel,
    sync,
    closeActive() {
      const panel = activePanel;
      if (!panel) return false;
      const close = findCloseControl(panel);
      if (close) close.click?.(); else panel.hidden = true;
      queueMicrotask(sync);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect?.();
      root.removeEventListener('click', onClickCapture, true);
      root.removeEventListener('keydown', onKeyDown, true);
      environment?.removeEventListener?.('blur', onLifecycleBoundary);
      environment?.removeEventListener?.('pagehide', onLifecycleBoundary);
      environment?.removeEventListener?.('orientationchange', onLifecycleBoundary);
      documentRef?.removeEventListener?.('visibilitychange', onVisibilityChange);
      setModalState(null);
      if (root.dataset.eonCityOverlayAuthority === EON_CITY_OVERLAY_COORDINATOR_SCHEMA) delete root.dataset.eonCityOverlayAuthority;
    }
  });
}

export default Object.freeze({
  EON_CITY_OVERLAY_COORDINATOR_SCHEMA,
  bindEonCityOverlayCoordinator,
  getEonCityOverlayCoordinatorTruth
});
