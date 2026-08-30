/**
 * Escapes a string for safe insertion into HTML content or attributes.
 * Converts &, <, >, ", and ' to their HTML entity equivalents.
 * @param {any} value - The raw value to escape.
 * @returns {string} The HTML-escaped string.
 */
export function escapeHtml(/** @type {any} */ value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
