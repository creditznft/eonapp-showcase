import { CURRENT_SCREEN_TRANSLATIONS } from './offline-screen-translations.current.js';
import { W623F_CORE_SCREEN_TRANSLATIONS } from './offline-screen-translations.w623f.js';

/**
 * W228 canonical offline language lookup.
 *
 * This is intentionally a curated cache for the current chat-first product.
 * It never carries retired ad, reward, token, payment, marketplace, or seller
 * copy into canonical pages. Missing text remains in its authored source
 * language rather than making a capability claim through an outdated pack.
 */
export const OFFLINE_SCREEN_TRANSLATIONS = Object.freeze({ ...CURRENT_SCREEN_TRANSLATIONS, ...W623F_CORE_SCREEN_TRANSLATIONS });

export function normalizeScreenText(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function getOfflineScreenTranslation(source = '', lang = 'en') {
  const target = String(lang || 'en').trim().toLowerCase().split('-')[0];
  if (!target || target === 'en') return normalizeScreenText(source);
  const key = normalizeScreenText(source);
  if (!key) return '';
  const translated = OFFLINE_SCREEN_TRANSLATIONS[key]?.[target];
  return translated && translated !== key ? translated : '';
}
