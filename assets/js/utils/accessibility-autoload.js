/**
 * Accessibility Auto-Loader
 * ==========================
 * Drop this as a <script type="module"> on any page to automatically
 * initialise WCAG 2.1 AA accessibility features:
 *   - Skip-to-main-content link
 *   - ARIA live region for announcements
 *   - Keyboard focus visibility class
 *   - Focus trap helpers (available globally as window.__eonA11y)
 *   - Shared app language bootstrap + auto-localization on supported pages
 *
 * @module utils/accessibility-autoload
 */
import { initAccessibility, announce, trapFocus, initRovingTabindex, checkContrast } from './accessibility.js';
import { autoLocalizePage, initAppLanguage, localizeStatic } from './app-language.js';
import { bindEonResponsiveAccessibilityInput } from './responsive-accessibility-input.js';

// Expose helpers globally so page-specific scripts can use them without re-importing
/** @type {any} */
const win = window;
if (!win.__eonA11y) {
  win.__eonA11y = { announce, trapFocus, initRovingTabindex, checkContrast };
}
if (!win.__eonResponsiveAccessibilityInput) {
  win.__eonResponsiveAccessibilityInput = bindEonResponsiveAccessibilityInput({ announce });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAccessibility());
} else {
  initAccessibility();
}

function initLanguageBootstrap() {
  try {
    initAppLanguage();
    void localizeStatic(document);
    void autoLocalizePage(document);
  } catch {
    // Non-blocking: accessibility must still work even if i18n bootstrap fails.
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLanguageBootstrap());
} else {
  initLanguageBootstrap();
}
