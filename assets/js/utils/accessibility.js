/**
 * Accessibility — WCAG 2.1 AA Compliance Utilities
 * ==================================================
 * Provides keyboard navigation, ARIA support, and focus management
 * for EONAPP.CH to meet WCAG 2.1 Level AA.
 *
 * FEATURES:
 * - Skip-to-main-content link injection
 * - Focus trap for modals and drawers (Esc to close, Tab cycles within)
 * - ARIA live regions for dynamic content announcements
 * - Keyboard navigation helpers (roving tabindex for lists/grids)
 * - Color contrast checker (dev-time utility)
 * - Visible focus indicator enforcement
 *
 * USAGE:
 *   import { initAccessibility } from './accessibility.js';
 *   initAccessibility(); // Call once on DOMContentLoaded
 *
 *   import { trapFocus, releaseFocus } from './accessibility.js';
 *   const cleanup = trapFocus(modalElement);
 *   cleanup(); // Release on modal close
 *
 *   import { announce } from './accessibility.js';
 *   announce('Offer published successfully'); // Polite live region
 *   announce('Error: Failed to publish', 'assertive');
 *
 * @module utils/accessibility
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

const SKIP_LINK_ID   = 'eon-skip-to-main';
const LIVE_REGION_ID = 'eon-live-region';
const FOCUS_CLASS    = 'eon-focus-visible';

/** Focusable element selectors per WCAG 2.1 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
  'audio[controls]',
  'video[controls]',
].join(', ');

// ─── Skip link ─────────────────────────────────────────────────────────────────

function _injectSkipLink() {
  if (document.getElementById(SKIP_LINK_ID)) return;
  // Guard: don't inject a second skip link if the page already has a static one
  if (document.querySelector('.skip-to-content, .skip-link, .skip')) return;

  const /** @type {any} */
link = document.createElement('a');
  link.id        = SKIP_LINK_ID;
  link.href      = '#main-content';
  link.className = 'eon-skip-link';
  link.textContent = 'Skip to main content';
  // Visibility toggled via CSS :focus selector — no inline style mutations needed.

  document.body.insertAdjacentElement('afterbegin', link);

  // Ensure there's a main content anchor
  const /** @type {any} */
main = document.querySelector('main, [role="main"], #main, #content, #app');
  if (main && !main.id) {
    (/** @type {HTMLElement} */ (main)).id = 'main-content';
  } else if (!document.getElementById('main-content') && !document.querySelector('main')) {
    // Create invisible anchor before first section
    const /** @type {any} */
anchor = document.createElement('span');
    anchor.id              = 'main-content';
    anchor.tabIndex        = -1;
    anchor.setAttribute('aria-hidden', 'true');
    const /** @type {any} */
firstSection = document.querySelector('section, article, .container, .page-content');
    if (firstSection) firstSection.insertAdjacentElement('beforebegin', anchor);
    else document.body.insertAdjacentElement('afterbegin', anchor);
  }
}

// ─── Live region ───────────────────────────────────────────────────────────────

function _ensureLiveRegion() {
  let /** @type {any} */
region = document.getElementById(LIVE_REGION_ID);
  if (region) return region;

  region = document.createElement('div');
  region.id = LIVE_REGION_ID;
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className = 'eon-live-region';
  document.body.appendChild(region);
  return region;
}

/** @type {ReturnType<typeof setTimeout> | null} */
let _announceTimer = null;

/**
 * Announce a message to screen readers via ARIA live region.
 * @param {string} message
 * @param {'polite' | 'assertive'} [priority]
 */
export function announce(/** @type {any} */ message, /** @type {any} */ priority = 'polite') {
  const region = _ensureLiveRegion();
  if (!region) return;

  region.setAttribute('aria-live', priority);

  // Clear then set — necessary for repeat announcements to re-trigger
  if (_announceTimer) clearTimeout(_announceTimer);
  region.textContent = '';
  _announceTimer = setTimeout(() => {
    if (region) region.textContent = String(message || '').slice(0, 500);
  }, 50);
}

// ─── Focus trap ─────────────────────────────────────────────────────────────────

/**
 * Trap keyboard focus within a container element (for modals, drawers, dialogs).
 * Returns a cleanup function — call it to release the trap.
 *
 * @param {HTMLElement} container
 * @param {{ onClose?: () => void }} [opts]
 * @returns {() => void} cleanup function
 */
export function trapFocus(/** @type {any} */ container, /** @type {any} */ opts = {}) {
  if (!container) return () => {};

  const prevActive = /** @type {HTMLElement | null} */ (document.activeElement);

  function _getFocusable() {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS))
      .filter(/** @type {any} */ el => !/** @type {HTMLElement} */ (el).hidden
        && !/** @type {HTMLInputElement} */ (el).disabled
        && /** @type {HTMLElement} */ (el).offsetParent !== null);
  }

  function _handleKeydown(/** @type {KeyboardEvent} */ e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (typeof opts.onClose === 'function') opts.onClose();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = _getFocusable();
    if (focusable.length === 0) { e.preventDefault(); return; }

    const first = /** @type {HTMLElement} */ (focusable[0]);
    const last  = /** @type {HTMLElement} */ (focusable[focusable.length - 1]);

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  // Auto-focus first focusable element
  const focusable = _getFocusable();
  if (focusable.length > 0) (/** @type {HTMLElement} */ (focusable[0])).focus();

  container.addEventListener('keydown', _handleKeydown);
  container.setAttribute('aria-modal', 'true');

  return function cleanup() {
    container.removeEventListener('keydown', _handleKeydown);
    container.removeAttribute('aria-modal');
    // Restore focus to element that had it before modal opened
    if (prevActive && 'focus' in prevActive) {
      try { /** @type {HTMLElement} */ (prevActive).focus(); } catch { /* ignore */ }
    }
  };
}

// ─── Roving tabindex (for lists, grids, toolbars) ──────────────────────────────

/**
 * Apply roving tabindex pattern to a group of items.
 * Arrow keys move focus; Tab leaves the group.
 *
 * @param {HTMLElement} container - The list/grid container
 * @param {string} [itemSelector] - Selector for focusable items (default: direct children)
 * @returns {() => void} cleanup function
 */
export function initRovingTabindex(/** @type {any} */ container, /** @type {any} */ itemSelector = ':scope > [role="option"], :scope > [role="tab"], :scope > [role="menuitem"], :scope > li') {
  if (!container) return () => {};

  function _items() {
    return Array.from(container.querySelectorAll(itemSelector));
  }

  function _setActive(/** @type {HTMLElement} */ el) {
    _items().forEach(/** @type {any} */ item => { (/** @type {HTMLElement} */ (item)).tabIndex = -1; });
    el.tabIndex = 0;
    el.focus();
  }

  function _handleKeydown(/** @type {KeyboardEvent} */ e) {
    const items = _items();
    const idx   = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (idx === -1) return;

    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      next = (idx + 1) % items.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      next = (idx - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = items.length - 1;
    }

    if (next !== -1) {
      e.preventDefault();
      _setActive(/** @type {HTMLElement} */ (items[next]));
    }
  }

  // Set initial tabindices
  const items = _items();
  items.forEach((/** @type {any} */ item, /** @type {any} */ i) => { (/** @type {HTMLElement} */ (item)).tabIndex = i === 0 ? 0 : -1; });

  container.addEventListener('keydown', _handleKeydown);

  return () => container.removeEventListener('keydown', _handleKeydown);
}

// ─── Focus visibility ──────────────────────────────────────────────────────────

/**
 * Enhance focus visibility for keyboard users.
 * Adds CSS class on keyboard navigation, removes on mouse click.
 * Ensures focus indicators meet WCAG 2.1 SC 2.4.7 minimum visibility.
 */
function _initFocusVisibility() {
  let usingKeyboard = false;

  document.addEventListener('mousedown', () => { usingKeyboard = false; document.body.classList.remove(FOCUS_CLASS); });
  document.addEventListener('keydown', (/** @type {any} */ e) => {
    if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      usingKeyboard = true;
      document.body.classList.add(FOCUS_CLASS);
    }
  });
  document.addEventListener('touchstart', () => { usingKeyboard = false; document.body.classList.remove(FOCUS_CLASS); }, { passive: true });

  void usingKeyboard;
}

// ─── ARIA role helpers ─────────────────────────────────────────────────────────

/**
 * Set up ARIA attributes for a custom button/toggle.
 * Handles aria-pressed, aria-expanded, aria-controls.
 *
 * @param {HTMLElement} el
 * @param {{ controls?: string, expanded?: boolean, pressed?: boolean }} opts
 */
export function ariaButton(/** @type {any} */ el, /** @type {any} */ opts = {}) {
  if (!el) return;
  if (typeof opts.controls === 'string') el.setAttribute('aria-controls', opts.controls);
  if (typeof opts.expanded === 'boolean') el.setAttribute('aria-expanded', String(opts.expanded));
  if (typeof opts.pressed  === 'boolean') el.setAttribute('aria-pressed',  String(opts.pressed));
  if (!el.getAttribute('role') && el.tagName !== 'BUTTON') el.setAttribute('role', 'button');
  if (!el.getAttribute('tabindex')) el.tabIndex = 0;

  // Keyboard activation for non-button elements
  if (el.tagName !== 'BUTTON') {
    el.addEventListener('keydown', (/** @type {any} */ e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  }
}

/**
 * Update the expanded state on a trigger+target pair.
 * @param {HTMLElement} trigger  - The button/control with aria-expanded
 * @param {boolean} expanded
 */
export function setExpanded(/** @type {any} */ trigger, /** @type {any} */ expanded) {
  if (!trigger) return;
  trigger.setAttribute('aria-expanded', String(expanded));
  const controlsId = trigger.getAttribute('aria-controls');
  if (controlsId) {
    const /** @type {any} */
target = document.getElementById(controlsId);
    if (target) {
      target.hidden = !expanded;
      target.setAttribute('aria-hidden', String(!expanded));
    }
  }
}

// ─── Color contrast checker (dev-time utility) ─────────────────────────────────

/**
 * Calculate relative luminance for an RGB color (WCAG 2.x formula).
 * @param {number} r - 0-255
 * @param {number} g - 0-255
 * @param {number} b - 0-255
 * @returns {number} 0-1 luminance
 */
export function relativeLuminance(/** @type {any} */ r, /** @type {any} */ g, /** @type {any} */ b) {
  const sRGB = [r, g, b].map(/** @type {any} */ c => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate WCAG 2.x contrast ratio between two colors.
 * @param {string} hex1 - CSS hex color (#rgb or #rrggbb)
 * @param {string} hex2 - CSS hex color
 * @returns {number} contrast ratio (1:1 to 21:1)
 */
export function contrastRatio(/** @type {any} */ hex1, /** @type {any} */ hex2) {
  function _parse(/** @type {any} */ hex) {
    const h = hex.replace('#', '');
    if (h.length === 3) return [parseInt(h[0]+h[0], 16), parseInt(h[1]+h[1], 16), parseInt(h[2]+h[2], 16)];
    return [parseInt(h.slice(0,2), 16), parseInt(h.slice(2,4), 16), parseInt(h.slice(4,6), 16)];
  }
  const [r1,g1,b1] = _parse(hex1);
  const [r2,g2,b2] = _parse(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a text/background pair meets WCAG 2.1 AA contrast (4.5:1 for normal, 3:1 for large).
 * @param {string} textHex
 * @param {string} bgHex
 * @param {boolean} [large] - Large text (>= 18pt or bold >= 14pt)
 * @returns {{ passes: boolean, ratio: number, required: number }}
 */
export function checkContrast(/** @type {any} */ textHex, /** @type {any} */ bgHex, /** @type {any} */ large = false) {
  const ratio    = contrastRatio(textHex, bgHex);
  const required = large ? 3 : 4.5;
  return { passes: ratio >= required, ratio: Math.round(ratio * 100) / 100, required };
}

// ─── Main init ─────────────────────────────────────────────────────────────────

/**
 * Initialize all accessibility features.
 * Call once on DOMContentLoaded (or after body is available).
 *
 * @param {object} [opts]
 * @param {boolean} [opts.skipLink]     - Inject skip-to-main link (default: true)
 * @param {boolean} [opts.liveRegion]   - Create ARIA live region (default: true)
 * @param {boolean} [opts.focusStyles]  - Inject focus visibility styles (default: true)
 */
export function initAccessibility(/** @type {any} */ opts = {}) {
  const { skipLink = true, liveRegion = true, focusStyles = true } = opts;

  if (typeof document === 'undefined') return;

  if (skipLink)   _injectSkipLink();
  if (liveRegion) _ensureLiveRegion();
  if (focusStyles) _initFocusVisibility();
  _autoLabelIconButtons();

  // Ensure all <img> have alt attributes (non-blocking audit)
  _auditImgAlts();
}

/**
 * Add a fallback aria-label to unlabeled icon-only controls.
 * This improves screen-reader and keyboard discoverability on pages with glyph-only buttons.
 */
function _autoLabelIconButtons() {
  const controls = Array.from(document.querySelectorAll('button, [role="button"]'));
  controls.forEach((/** @type {any} */ node) => {
    const el = /** @type {HTMLElement} */ (node);
    if (!el || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;

    const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 1) return;

    const hidden = el.getAttribute('aria-hidden') === 'true';
    if (hidden) return;

    const candidate = String(
      el.getAttribute('title') ||
      el.getAttribute('data-i18n-fallback') ||
      el.getAttribute('data-action') ||
      el.id ||
      ''
    ).trim();

    const normalized = candidate
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^\W+|\W+$/g, '')
      .trim();

    el.setAttribute('aria-label', normalized || 'Action');
  });
}

/** Quick non-blocking scan: warn about images missing alt in dev mode. */
function _auditImgAlts() {
  if (typeof window === 'undefined' || !(/** @type {any} */ (window)).DEBUG) return;
  requestAnimationFrame(() => {
    const imgs = Array.from(document.querySelectorAll('img:not([alt])'));
    if (imgs.length > 0) {
      console.warn(`[a11y] ${imgs.length} image(s) missing alt attribute:`, imgs.slice(0, 5));
    }
  });
}
