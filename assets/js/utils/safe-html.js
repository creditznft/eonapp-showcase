/**
 * safe-html.js — SF-2: DOMPurify wrapper for all innerHTML / insertAdjacentHTML
 * Prevents XSS. All AI output, user-generated content, and dynamic HTML MUST
 * go through safeHTML() or safeInsert() before being rendered into the DOM.
 *
 * Usage:
 *   import { safeHTML, safeInsert, safeText } from './safe-html.js';
 *   safeHTML(el, '<b>user content</b>');          // sets innerHTML safely
 *   safeInsert(el, 'beforeend', '<li>item</li>'); // insertAdjacentHTML safely
 *   el.textContent = safeText(rawInput);           // strips all HTML tags
 */

import DOMPurifyLib from 'dompurify';

// -- DOMPurify configuration ------------------------------------------------
// Tightened config: no dangerous tags, no data: URIs, no javascript: hrefs.
const /** @type {any} */
PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'abbr', 'acronym', 'b', 'blockquote', 'br', 'caption', 'cite',
    'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'div', 'dl', 'dt',
    'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'pre',
    'q', 's', 'samp', 'section', 'small', 'span', 'strong', 'sub', 'sup',
    'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr', 'u',
    'ul', 'var'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'width', 'height',
    'colspan', 'rowspan', 'aria-label', 'aria-hidden', 'aria-describedby',
    'role', 'tabindex', 'data-mode', 'data-id', 'data-action',
    'target', 'rel', 'type', 'datetime'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form', 'input',
    'button', 'textarea', 'select', 'iframe', 'frame', 'svg', 'math',
    'template', 'slot', 'canvas'
  ],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'style',
    'srcdoc', 'action', 'formaction', 'xlink:href'
  ],
  // Disallow javascript:, data:, and vbscript: URIs in href/src
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|#):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  // Strip unknown tags rather than leaving them bare
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: false
};

// Config for AI output (slightly more permissive: allows pre+code for code blocks)
const /** @type {any} */
AI_PURIFY_CONFIG = {
  ...PURIFY_CONFIG,
  ALLOWED_TAGS: [...PURIFY_CONFIG.ALLOWED_TAGS, 'details', 'summary']
};

// Config for internally-generated trusted UI HTML (modals, cards, forms).
// Allows button, input, svg, path etc. — do NOT use for user/AI content.
const /** @type {any} */
UI_PURIFY_CONFIG = {
  ...PURIFY_CONFIG,
  ALLOWED_TAGS: [
    ...PURIFY_CONFIG.ALLOWED_TAGS,
    'button', 'input', 'label', 'select', 'option', 'textarea', 'fieldset', 'legend',
    'details', 'summary',
    'svg', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline',
    'polygon', 'g', 'defs', 'use', 'text', 'tspan', 'stop', 'linearGradient',
    'radialGradient', 'clipPath', 'mask', 'filter', 'feGaussianBlur',
    'feBlend', 'animate', 'animateTransform'
  ],
  ALLOWED_ATTR: [
    ...PURIFY_CONFIG.ALLOWED_ATTR,
    'aria-modal', 'aria-expanded', 'aria-controls', 'aria-selected',
    'aria-checked', 'aria-disabled', 'aria-live', 'aria-atomic',
    'placeholder', 'autocomplete', 'spellcheck', 'disabled', 'readonly',
    'checked', 'selected', 'multiple', 'value', 'name', 'min', 'max',
    'step', 'pattern', 'required', 'for',
    'data-listing-id', 'data-id', 'data-mode', 'data-action',
    // SVG attributes
    'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
    'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y',
    'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'opacity',
    'stop-color', 'stop-opacity', 'offset', 'gradientUnits',
    'gradientTransform', 'preserveAspectRatio', 'clip-path', 'mask',
    'font-size', 'font-family', 'text-anchor', 'dominant-baseline',
    'letter-spacing', 'attributeName', 'attributeType', 'values',
    'dur', 'repeatCount', 'begin', 'end', 'from', 'to', 'by', 'type',
    'calcMode', 'keyTimes', 'keySplines', 'additive', 'accumulate'
  ],
  ALLOW_DATA_ATTR: true,
  FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form',
    'iframe', 'frame', 'math', 'template', 'slot', 'canvas'
  ],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
    'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'style',
    'srcdoc', 'action', 'formaction', 'xlink:href'
  ]
};
const appWin = /** @type {any} */ (typeof window === 'undefined' ? {} : window);

// -- DOMPurify loader -------------------------------------------------------
/** @type {any} */
let _purify = null;

function getPurify() {
  if (_purify?.sanitize) return _purify;
  if (DOMPurifyLib?.sanitize) {
    _purify = DOMPurifyLib;
    return _purify;
  }
  // Global is compatibility-only for older documents.
  if (appWin.DOMPurify?.sanitize) {
    _purify = appWin.DOMPurify;
    return _purify;
  }
  // Fallback: strip all tags (no DOMPurify available)
  return null;
}

function _sanitize(/** @type {any} */ htmlString, /** @type {any} */ config = PURIFY_CONFIG) {
  if (!htmlString || typeof htmlString !== 'string') return '';
  const purify = getPurify();
  if (purify) {
    return purify.sanitize(htmlString, config);
  }
  // Hard fallback: strip all HTML tags entirely
  return htmlString
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '');
}

// -- Public API -------------------------------------------------------------

/**
 * Safely set element innerHTML after sanitization.
 * @param {Element} el - target DOM element
 * @param {string} htmlString - raw HTML to sanitize and inject
 * @param {boolean} [isAiOutput=false] - use AI output config (slightly looser)
 */
export function safeHTML(/** @type {any} */ el, /** @type {any} */ htmlString, /** @type {any} */ isAiOutput = false) {
  if (!el) return;
  if (isAiOutput === 'ui' && !getPurify()) {
    // W636: even internally generated templates fail closed when the sanitizer
    // is unavailable. Dynamic interpolation can turn an "internal" template
    // into an injection sink, so never fall back to raw innerHTML.
    el.textContent = safeText(typeof htmlString === 'string' ? htmlString : '');
    return;
  }
  const cfg = isAiOutput === 'ui' ? UI_PURIFY_CONFIG
            : isAiOutput ? AI_PURIFY_CONFIG
            : PURIFY_CONFIG;
  el.innerHTML = _sanitize(htmlString, cfg);
}

/**
 * Safely call insertAdjacentHTML after sanitization.
 * @param {Element} el
 * @param {'beforebegin'|'afterbegin'|'beforeend'|'afterend'} position
 * @param {string} htmlString
 */
export function safeInsert(/** @type {any} */ el, /** @type {any} */ position, /** @type {any} */ htmlString) {
  if (!el) return;
  el.insertAdjacentHTML(position, _sanitize(htmlString));
}

/**
 * Strip ALL HTML from a string and return plain text.
 * Use for tooltips, titles, aria-labels where HTML is never wanted.
 * @param {string} rawInput
 * @returns {string}
 */
export function safeText(/** @type {any} */ rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  const purify = getPurify();
  if (purify) return purify.sanitize(rawInput, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return rawInput.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize AI model output specifically (allows code blocks, details/summary).
 * @param {Element} el
 * @param {string} htmlString
 */
export function safeAIOutput(/** @type {any} */ el, /** @type {any} */ htmlString) {
  safeHTML(el, htmlString, true);
}

/**
 * Returns a sanitized HTML string without writing to the DOM.
 * Useful for building strings before insertion.
 * @param {string} htmlString
 * @returns {string}
 */
export function sanitize(/** @type {any} */ htmlString) {
  return _sanitize(htmlString);
}
