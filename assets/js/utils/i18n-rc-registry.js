import {
  EON_FULL_PRODUCT_LANGUAGE_MATRIX,
  EON_LANGUAGE_CAPABILITY_MATRIX
} from './language-matrix.js';

/**
 * A15 I24 release-interface language registry.
 *
 * Only fully certified interface languages are publicly selectable. Chat,
 * Guide and speech language capabilities are deliberately managed separately.
 */
export const RC_LANGUAGE_CODES = Object.freeze(EON_FULL_PRODUCT_LANGUAGE_MATRIX.map((entry) => entry.code));

export const RC_LANGUAGE_META = Object.freeze(Object.fromEntries(EON_FULL_PRODUCT_LANGUAGE_MATRIX.map((entry) => [
  entry.code,
  Object.freeze({
    code: entry.code,
    name: entry.name,
    englishName: entry.englishName,
    flag: entry.flag,
    dir: entry.dir,
    script: entry.script
  })
])));

export const RC_LANGUAGE_CAPABILITY_META = Object.freeze(Object.fromEntries(EON_LANGUAGE_CAPABILITY_MATRIX.map((entry) => [
  entry.code,
  Object.freeze({
    code: entry.code,
    name: entry.name,
    englishName: entry.englishName,
    flag: entry.flag,
    dir: entry.dir,
    script: entry.script,
    publishedFullUi: entry.publishedFullUi,
    chatGuide: entry.chatGuide,
    browserSpeech: entry.browserSpeech
  })
])));

export const RC_ROUTE_FAMILIES = Object.freeze({
  p0: Object.freeze({
    label: 'Canonical chat-first routes',
    routes: Object.freeze([
      '/index.html', '/create.html', '/projects.html', '/library.html', '/workspace.html',
      '/forge.html', '/eoncity.html', '/realm-studio.html', '/profile.html', '/vault.html',
      '/capsule.html', '/local-ai.html', '/automations.html'
    ])
  }),
  p1: Object.freeze({
    label: 'Canonical research and trust routes',
    routes: Object.freeze([
      '/market.html', '/trade.html', '/about.html', '/legal.html', '/privacy.html',
      '/terms.html', '/settings.html', '/help.html', '/status.html', '/install.html',
      '/billing.html', '/eon-keys.html'
    ])
  })
});

const RC_LANGUAGE_SET = new Set(RC_LANGUAGE_CODES);

export function isRcLanguage(value) {
  return RC_LANGUAGE_SET.has(String(value || '').trim().toLowerCase().split('-')[0]);
}

export function normalizeRcLanguage(value, fallback = 'en') {
  const code = String(value || '').trim().toLowerCase().replace('_', '-').split('-')[0];
  return isRcLanguage(code) ? code : fallback;
}

export function getRcLanguages() {
  return RC_LANGUAGE_CODES.map((code) => ({ ...RC_LANGUAGE_META[code], active: true, public: true, tier: 1, rtl: RC_LANGUAGE_META[code].dir === 'rtl' }));
}

export function getRcRouteFamily(pathname = '/') {
  const normalized = `/${String(pathname || '/').split('?')[0].split('#')[0].replace(/^\/+/, '')}`;
  for (const [family, meta] of Object.entries(RC_ROUTE_FAMILIES)) {
    if (meta.routes.includes(normalized)) return family;
  }
  return 'other';
}

export function applyLanguageDocumentProfile(doc, langCode) {
  if (!doc?.documentElement) return null;
  const code = normalizeRcLanguage(langCode);
  const meta = RC_LANGUAGE_META[code];
  doc.documentElement.lang = code;
  doc.documentElement.dir = meta.dir;
  doc.documentElement.dataset.eonLanguage = code;
  doc.documentElement.dataset.eonScript = meta.script;
  doc.documentElement.dataset.eonRtl = meta.dir === 'rtl' ? '1' : '0';
  return meta;
}
