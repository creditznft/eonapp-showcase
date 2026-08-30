/**
 * DOMPurify-based sanitizer for secure innerHTML operations
 * Prevents XSS attacks by sanitizing HTML before insertion
 *
 * DOMPurify is now bundled via npm (dompurify@3) — no CDN dependency.
 */
import DOMPurifyLib from 'dompurify';

/** @type {any} */
const DOMPurify = DOMPurifyLib;

// Synchronous init — bundled DOMPurify is always available.
// Retain loadDOMPurify() as an async wrapper for callers that expect it.
async function loadDOMPurify() {
  return DOMPurify || null;
}

/**
 * Sanitize HTML string before using with innerHTML
 * @param {string} dirty - Untrusted HTML string
 * @param {Object} config - Optional DOMPurify config
 * @returns {Promise<string>} - Sanitized HTML string
 */
export async function sanitizeHTML(/** @type {any} */ dirty, /** @type {any} */ config = {}) {
  if (!dirty || typeof dirty !== 'string') return '';
  
  // If no user-generated content detected, return as-is
  if (!/<[^>]*>/.test(dirty)) return dirty;
  
  const purifier = await loadDOMPurify();
  
  if (!purifier) {
    // Fallback: basic escape if DOMPurify fails to load
    return dirty
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  const /** @type {any} */
defaultConfig = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'small', 'button', 'section', 'article', 'header', 'footer'
    ],
    ALLOWED_ATTR: ['href', 'class', 'id', 'style', 'aria-label', 'title'],
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    ...config
  };
  
  return purifier.sanitize(dirty, defaultConfig);
}

/**
 * Safe alternative to innerHTML that automatically sanitizes
 * @param {HTMLElement} element - Target DOM element
 * @param {string} html - HTML string to insert
 * @param {Object} config - Optional DOMPurify config
 */
export async function setSafeInnerHTML(/** @type {any} */ element, /** @type {any} */ html, /** @type {any} */ config = {}) {
  if (!element || !html) return;
  
  const sanitized = await sanitizeHTML(html, config);
  element.innerHTML = sanitized;
}

/**
 * Quick check if string contains potentially dangerous patterns
 * @param {string} str - String to check
 * @returns {boolean} - True if potentially dangerous
 */
export function containsDangerousPatterns(/** @type {any} */ str) {
  if (!str || typeof str !== 'string') return false;
  
  const /** @type {any} */
dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i
  ];
  
  return dangerousPatterns.some((/** @type {any} */ pattern) => pattern.test(str));
}

/**
 * Sanitize user-generated content (challenge aliases, player names, etc.)
 * @param {string} content - User content to sanitize
 * @returns {string} - Sanitized content
 */
export function sanitizeUserContent(/** @type {any} */ content) {
  if (!content || typeof content !== 'string') return '';
  
  // Remove HTML tags entirely for user content
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .substring(0, 100); // Limit length
}
