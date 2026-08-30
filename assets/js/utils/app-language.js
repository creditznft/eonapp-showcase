import multiLanguageService from './multi-language.js';
import { getOfflineScreenTranslation } from './offline-screen-translations.js';
import { applyLanguageDocumentProfile } from './i18n-rc-registry.js';
import { isEonChatGuideLanguage, isEonFullProductLanguage, normalizeEonChatGuideLanguage } from './language-matrix.js';

const LEGACY_LANG_KEY = 'eon:lang:v1';
const PREF_LANG_KEY = 'eon:lang:preference:v1';
const CHAT_LANG_KEY = 'eon:chat:language:v1';
const AUTO_LOCALIZE_ATTR = 'data-i18n-auto-source';
const AUTO_LOCALIZE_OBSERVER_KEY = '__eonAutoLocalizeObserver';
const AUTO_LOCALIZE_TIMER_KEY = '__eonAutoLocalizeTimer';
const AUTO_LOCALIZE_RUN_KEY = '__eonAutoLocalizeRun';
const AUTO_LOCALIZE_TEXT_CACHE = new WeakMap();
const COMMON_UI_COPY = {
  de: { skip: 'Zum Hauptinhalt springen', about: 'Über', privacy: 'Datenschutz' },
  zh: { skip: '跳到主要内容', about: '关于', privacy: '隐私' },
  ko: { skip: '본문으로 건너뛰기', about: '정보', privacy: '개인정보' },
  ar: { skip: 'تخطي إلى المحتوى الرئيسي', about: 'حول', privacy: 'الخصوصية' },
};

const SHELL_NAV_COPY = {
  de: { '/build': 'Bauen', '/create': 'Erstellen', '/insights': 'Research', '/trade': 'Research', '/vault': 'Vault', '/market': 'Markt', '/realm': 'Realm', '/local-ai': 'KI' },
  zh: { '/build': '构建', '/create': '创建', '/insights': '研究', '/trade': '研究', '/vault': '金库', '/market': '市场', '/realm': 'Realm', '/local-ai': 'AI' },
  ko: { '/build': '빌드', '/create': '크리에이트', '/insights': '연구', '/trade': '연구', '/vault': '볼트', '/market': '마켓', '/realm': '렐름', '/local-ai': 'AI' },
  ar: { '/build': 'البناء', '/create': 'الإنشاء', '/insights': 'بحث', '/trade': 'بحث', '/vault': 'الخزينة', '/market': 'السوق', '/realm': 'Realm', '/local-ai': 'AI' },
};

const /** @type {any} */
COMMON_NON_EN_HINTS = {
  es: /(\b(que|como|hola|gracias|mercado|boveda|bóveda)\b|[¿¡])/i,
  de: /(\b(und|oder|hallo|danke|markt|tresor)\b|[äöüß])/i,
  fr: /(\b(bonjour|merci|comment|march[eé]|coffre)\b|[àâçéèêëîïôûùüÿœ])/i,
  pt: /(\b(ola|olá|obrigado|mercado|cofre|como)\b|[ãõç])/i,
  it: /(\b(ciao|grazie|come|mercato)\b)/i,
  nl: /(\b(hallo|dankje|markt|kluis|taal)\b)/i,
  pl: /(\b(cześć|dziękuję|rynek|język)\b)/i,
  sv: /(\b(hej|tack|marknad|språk)\b)/i,
  da: /(\b(hej|tak|marked|sprog)\b)/i,
  fi: /(\b(hei|kiitos|markkina|kieli)\b)/i,
  no: /(\b(hallo|takk|marked|språk)\b)/i,
  el: /[\u0370-\u03FF]/,
  id: /(\b(hai|terima kasih|pasar|bahasa)\b)/i,
  ms: /(\b(hai|terima kasih|pasaran|bahasa)\b)/i,
  fil: /(\b(kumusta|salamat|merkado|wika)\b)/i,
  tr: /(\b(merhaba|tesekkur|teşekkür|pazar|nasıl)\b|[çğıöşü])/i,
  ru: /[\u0400-\u04FF]/,
  uk: /[\u0400-\u04FF]/,
  ar: /[\u0600-\u06FF]/,
  he: /[\u0590-\u05FF]/,
  hi: /[\u0900-\u097F]/,
  bn: /[\u0980-\u09FF]/,
  ta: /[\u0B80-\u0BFF]/,
  te: /[\u0C00-\u0C7F]/,
  zh: /[\u4E00-\u9FFF]/,
  ja: /[\u3040-\u30FF\u31F0-\u31FF]/,
  ko: /[\uAC00-\uD7AF\u1100-\u11FF]/,
  th: /[\u0E00-\u0E7F]/,
  vi: /(\b(xin|chao|cảm|ơn|thị trường)\b|[ăâđêôơư])/i
};

function safeGet(/** @type {any} */ key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(/** @type {any} */ key, /** @type {any} */ value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function normalizeLanguageCode(/** @type {any} */ value, /** @type {any} */ options = {}) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') raw = parsed;
  } catch {}
  raw = raw.replace(/^['"]|['"]$/g, '').trim().toLowerCase().replace('_', '-');
  if (options.allowAuto && raw === 'auto') return 'auto';
  const base = raw.split('-')[0];
  return isEonFullProductLanguage(base) ? base : '';
}


export function normalizeChatLanguageCode(value, options = {}) {
  let raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') raw = parsed;
  } catch {}
  raw = raw.replace(/^['"]|['"]$/g, '').trim().toLowerCase().replace('_', '-');
  if (options.allowAuto && raw === 'auto') return 'auto';
  return normalizeEonChatGuideLanguage(raw, '');
}

export function getCurrentLanguage() {
  const explicit = normalizeLanguageCode(safeGet(PREF_LANG_KEY) || safeGet(LEGACY_LANG_KEY), { allowAuto: true });
  if (explicit && explicit !== 'auto' && isEonFullProductLanguage(explicit)) return explicit;
  const detected = normalizeLanguageCode(multiLanguageService.detectBrowserLanguage?.() || 'en') || 'en';
  return isEonFullProductLanguage(detected) ? detected : 'en';
}

export function getPreferredLanguage() {
  const preferred = normalizeLanguageCode(safeGet(PREF_LANG_KEY) || safeGet(LEGACY_LANG_KEY), { allowAuto: true });
  if (!preferred || preferred === 'auto') return 'auto';
  return isEonFullProductLanguage(preferred) ? preferred : 'auto';
}

export function getChatLanguagePreference() {
  return normalizeChatLanguageCode(safeGet(CHAT_LANG_KEY), { allowAuto: true }) || 'auto';
}

export function setChatLanguagePreference(/** @type {any} */ value = 'auto') {
  const nextRaw = normalizeChatLanguageCode(value, { allowAuto: true }) || 'auto';
  const next = nextRaw !== 'auto' && !isEonChatGuideLanguage(nextRaw) ? 'auto' : nextRaw;
  safeSet(CHAT_LANG_KEY, next);
  return next;
}

export function resolveChatLanguage() {
  const pref = getChatLanguagePreference();
  if (pref && pref !== 'auto') return pref;
  const candidates = [globalThis.navigator?.language, ...(Array.isArray(globalThis.navigator?.languages) ? globalThis.navigator.languages : [])];
  for (const candidate of candidates) {
    const language = normalizeChatLanguageCode(candidate);
    if (language) return language;
  }
  return 'en';
}

export function initAppLanguage(options = {}) {
  const preferred = getPreferredLanguage();
  const resolved = preferred === 'auto'
    ? (multiLanguageService.detectBrowserLanguage?.() || 'en')
    : preferred;
  const normalizedResolved = normalizeLanguageCode(resolved) || 'en';
  const selectableResolved = isEonFullProductLanguage(normalizedResolved) ? normalizedResolved : 'en';

  if (multiLanguageService.getUserLanguage?.() !== selectableResolved) {
    multiLanguageService.setUserLanguage(selectableResolved);
  }
  safeSet(PREF_LANG_KEY, preferred);
  safeSet(LEGACY_LANG_KEY, preferred);

  applyLanguageDocumentProfile(document, selectableResolved);

  if (options.localize !== false && selectableResolved && selectableResolved !== 'en') {
    void autoLocalizePage(document);
  }

  return { preferred, resolved: selectableResolved };
}

export function detectLikelyLanguageFromText(/** @type {any} */ text) {
  const source = String(text || '').trim();
  if (!source) return null;
  for (const [lang, pattern] of Object.entries(COMMON_NON_EN_HINTS)) {
    if (pattern.test(source)) return lang;
  }
  if (/^[\p{ASCII}\s.,!?;:'"()\-_/]+$/u.test(source)) return 'en';
  return null;
}

export function shouldSuggestLanguageSwitch(/** @type {any} */ text, /** @type {any} */ currentLang = getCurrentLanguage()) {
  const detected = detectLikelyLanguageFromText(text);
  if (!detected || detected === 'en') return { suggest: false, detected };
  if (!isEonFullProductLanguage(detected)) return { suggest: false, detected };
  return { suggest: detected !== String(currentLang || 'en').toLowerCase(), detected };
}

export async function translateForUser(/** @type {any} */ text, /** @type {any} */ options = {}) {
  const sourceText = String(text || '').trim();
  if (!sourceText) return '';

  const fromLang = options.fromLang || 'en';
  const toLang = normalizeLanguageCode(options.toLang || getCurrentLanguage()) || 'en';
  const category = options.category || 'general';

  if (!toLang || toLang === fromLang) return sourceText;

  try {
    const translated = await multiLanguageService.translate(sourceText, fromLang, toLang, category);
    return translated?.translatedText || sourceText;
  } catch {
    return sourceText;
  }
}

function shouldAutoTranslateNode(/** @type {any} */ node) {
  if (!node) return false;
  if (node.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages, pre, code, kbd, samp, script, style, noscript, textarea')) return false;
  if (node.closest('[data-i18n-key]')) return false;
  if (node.children?.length) return false;
  const text = String(node.textContent || '').trim();
  if (!text) return false;
  if (text.length > 700) return false;
  if (/^[-+]?\d+(?:[.,]\d+)?$/.test(text)) return false;
  if (/^(https?:|\/|#|0x[0-9a-f]{6,})/i.test(text)) return false;
  if (/^[\W_]+$/.test(text)) return false;
  return true;
}

function shouldAutoTranslateAttributeValue(/** @type {any} */ value) {
  const text = String(value || '').trim();
  if (!text) return false;
  if (text.length > 240) return false;
  if (/^[-+]?\d+(?:[.,]\d+)?$/.test(text)) return false;
  if (/^(https?:|\/|#|0x[0-9a-f]{6,})/i.test(text)) return false;
  if (/^[\W_]+$/.test(text)) return false;
  return true;
}

function shouldAutoTranslateTextNode(/** @type {any} */ textNode) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return false;
  const parent = textNode.parentElement;
  if (!parent) return false;
  if (parent.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages, pre, code, kbd, samp, script, style, noscript, textarea')) return false;
  if (parent.closest('[data-i18n-key]')) return false;
  const text = String(textNode.textContent || '').trim();
  if (!text) return false;
  if (text.length > 700) return false;
  if (/^[-+]?\d+(?:[.,]\d+)?$/.test(text)) return false;
  if (/^(https?:|\/|#|0x[0-9a-f]{6,})/i.test(text)) return false;
  if (/^[\W_]+$/.test(text)) return false;
  return true;
}

function beginLocalizationRun() {
  if (typeof window === 'undefined') return 0;
  const win = /** @type {any} */ (window);
  const next = Number(win[AUTO_LOCALIZE_RUN_KEY] || 0) + 1;
  win[AUTO_LOCALIZE_RUN_KEY] = next;
  return next;
}

function isLocalizationRunCurrent(runId, lang) {
  if (typeof window === 'undefined') return true;
  const win = /** @type {any} */ (window);
  return Number(win[AUTO_LOCALIZE_RUN_KEY] || 0) === Number(runId)
    && getCurrentLanguage() === lang;
}

function queueAutoLocalize(/** @type {any} */ root = document) {
  if (typeof window === 'undefined') return;
  const win = /** @type {any} */ (window);
  if (win[AUTO_LOCALIZE_TIMER_KEY]) return;
  win[AUTO_LOCALIZE_TIMER_KEY] = window.setTimeout(() => {
    win[AUTO_LOCALIZE_TIMER_KEY] = null;
    void autoLocalizePage(root);
  }, 120);
}

function installAutoLocalizeObserver(/** @type {any} */ root = document) {
  if (typeof window === 'undefined' || !root) return;
  const win = /** @type {any} */ (window);
  if (win[AUTO_LOCALIZE_OBSERVER_KEY]) return;
  const target = root.body || root.documentElement || root;
  if (!target || typeof MutationObserver === 'undefined') return;

  const observer = new MutationObserver((/** @type {any} */ mutations) => {
    const current = getCurrentLanguage();
    if (!current || current === 'en') return;
    const relevant = Array.isArray(mutations) && mutations.some((/** @type {any} */ mutation) => {
      if (!mutation || mutation.type !== 'childList') return false;
      return Array.from(mutation.addedNodes || []).some((/** @type {any} */ node) => {
        if (!node || node.nodeType !== 1) return false;
        if (node.closest?.('[data-no-auto-i18n="1"], .ew-messages, .chat-messages, pre, code, kbd, samp, script, style, noscript, textarea')) return false;
        return shouldAutoTranslateNode(node) || Boolean(node.querySelector?.('h1,h2,h3,h4,h5,h6,p,button,a,span,label,li,th,td,small,strong,em,summary,option,input[placeholder],textarea[placeholder],[title],[aria-label],[aria-description],[alt]'));
      });
    });
    if (relevant) queueAutoLocalize(root);
  });

  observer.observe(target, { childList: true, subtree: true });
  win[AUTO_LOCALIZE_OBSERVER_KEY] = observer;
}


function getNodeSourceText(node) {
  return String(node?.getAttribute?.(AUTO_LOCALIZE_ATTR) || node?.textContent || '').trim();
}

function restoreNodeSourceText(node) {
  const source = node?.getAttribute?.(AUTO_LOCALIZE_ATTR);
  if (source && String(node.textContent || '').trim() !== source) node.textContent = source;
}

function localizeNodeFromOfflinePack(node, lang) {
  if (!node) return false;
  const source = getNodeSourceText(node);
  if (!source) return false;
  if (lang === 'en') {
    restoreNodeSourceText(node);
    return Boolean(node.getAttribute?.(AUTO_LOCALIZE_ATTR));
  }
  const localized = getOfflineScreenTranslation(source, lang);
  if (!localized || localized === source) return false;
  node.setAttribute(AUTO_LOCALIZE_ATTR, source);
  node.textContent = localized;
  return true;
}

function localizeTextNodeFromOfflinePack(textNode, lang) {
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return false;
  const cachedSource = AUTO_LOCALIZE_TEXT_CACHE.get(textNode);
  const source = String(cachedSource || textNode.textContent || '').trim();
  if (!source) return false;
  if (lang === 'en') {
    if (cachedSource && String(textNode.textContent || '').trim() !== cachedSource) textNode.textContent = cachedSource;
    return Boolean(cachedSource);
  }
  const localized = getOfflineScreenTranslation(source, lang);
  if (!localized || localized === source) return false;
  AUTO_LOCALIZE_TEXT_CACHE.set(textNode, source);
  textNode.textContent = localized;
  return true;
}

function localizeAttributeFromOfflinePack(node, attr, lang) {
  if (!node?.hasAttribute?.(attr)) return false;
  const sourceAttr = `${AUTO_LOCALIZE_ATTR}-${attr}`;
  const source = String(node.getAttribute(sourceAttr) || node.getAttribute(attr) || '').trim();
  if (!source || !shouldAutoTranslateAttributeValue(source)) return false;
  if (lang === 'en') {
    if (node.hasAttribute(sourceAttr)) node.setAttribute(attr, source);
    return node.hasAttribute(sourceAttr);
  }
  const localized = getOfflineScreenTranslation(source, lang);
  if (!localized || localized === source) return false;
  node.setAttribute(sourceAttr, source);
  node.setAttribute(attr, localized);
  return true;
}


export async function restoreEnglishPage(/** @type {any} */ root = document) {
  if (!root) return;
  const keyed = root.querySelectorAll?.('[data-i18n-key]') || [];
  for (const node of keyed) {
    const source = node.getAttribute?.(AUTO_LOCALIZE_ATTR)
      || node.getAttribute?.('data-i18n-fallback')
      || multiLanguageService.t(node.getAttribute?.('data-i18n-key'), node.textContent || '');
    if (source) node.textContent = source;
  }

  const translatedNodes = root.querySelectorAll?.(`[${AUTO_LOCALIZE_ATTR}]`) || [];
  for (const node of translatedNodes) restoreNodeSourceText(node);

  const NodeFilterCtor = /** @type {any} */ (window?.NodeFilter || globalThis.NodeFilter);
  const treeWalkerFactory = root.createTreeWalker ? root : document;
  if (NodeFilterCtor && treeWalkerFactory?.createTreeWalker) {
    const walker = treeWalkerFactory.createTreeWalker(root.body || root.documentElement || root, NodeFilterCtor.SHOW_TEXT);
    let textNode = /** @type {Text | null} */ (walker.nextNode());
    while (textNode) {
      const cachedSource = AUTO_LOCALIZE_TEXT_CACHE.get(textNode);
      if (cachedSource && String(textNode.textContent || '').trim() !== cachedSource) textNode.textContent = cachedSource;
      textNode = /** @type {Text | null} */ (walker.nextNode());
    }
  }

  const attrNodes = root.querySelectorAll?.('[data-i18n-auto-source-placeholder],[data-i18n-auto-source-title],[data-i18n-auto-source-aria-label],[data-i18n-auto-source-aria-description],[data-i18n-auto-source-alt]') || [];
  for (const node of attrNodes) {
    for (const attr of ['placeholder', 'title', 'aria-label', 'aria-description', 'alt']) {
      const source = node.getAttribute?.(`${AUTO_LOCALIZE_ATTR}-${attr}`);
      if (source !== null && source !== undefined) node.setAttribute(attr, source);
    }
  }
}

export async function autoLocalizePage(/** @type {any} */ root = document) {
  const current = getCurrentLanguage();
  const runId = beginLocalizationRun();
  applyLanguageDocumentProfile(document, current || 'en');
  if (!current || current === 'en') {
    await restoreEnglishPage(root);
    return;
  }
  if (!(await multiLanguageService.hasLiveTranslationProvider?.())) {
    await localizeStatic(root);
    installAutoLocalizeObserver(root);
    return;
  }
  const NodeFilterCtor = /** @type {any} */ (window?.NodeFilter || globalThis.NodeFilter);

  const /** @type {any} */
textNodes = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,button,a,span,label,li,th,td,small,strong,em,summary,option');
  for (const /** @type {any} */
node of textNodes) {
    if (!shouldAutoTranslateNode(node)) continue;
    const source = node.getAttribute(AUTO_LOCALIZE_ATTR) || String(node.textContent || '').trim();
    if (!source) continue;
    if (localizeNodeFromOfflinePack(node, current)) continue;
    node.setAttribute(AUTO_LOCALIZE_ATTR, source);
    const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
    if (isLocalizationRunCurrent(runId, current) && localized && localized !== source) node.textContent = localized;
  }

  if (!NodeFilterCtor) return;
  const walker = document.createTreeWalker(root.body || root.documentElement || root, NodeFilterCtor.SHOW_TEXT);
let textNode = /** @type {Text | null} */ (walker.nextNode());
  while (textNode) {
    const nextNode = /** @type {Text | null} */ (walker.nextNode());
    if (shouldAutoTranslateTextNode(textNode)) {
      const cachedSource = AUTO_LOCALIZE_TEXT_CACHE.get(textNode);
      const source = cachedSource || String(textNode.textContent || '').trim();
      if (source) {
        AUTO_LOCALIZE_TEXT_CACHE.set(textNode, source);
        if (!localizeTextNodeFromOfflinePack(textNode, current)) {
          const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
          if (isLocalizationRunCurrent(runId, current) && localized && localized !== source) textNode.textContent = localized;
        }
      }
    }
    textNode = nextNode;
  }

  const /** @type {any} */
placeholderNodes = root.querySelectorAll('input[placeholder], textarea[placeholder]');
  for (const /** @type {any} */
input of placeholderNodes) {
    if (input.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages')) continue;
    const source = input.getAttribute(AUTO_LOCALIZE_ATTR) || input.getAttribute('placeholder') || '';
    if (!source) continue;
    if (localizeAttributeFromOfflinePack(input, 'placeholder', current)) continue;
    input.setAttribute(AUTO_LOCALIZE_ATTR, source);
    const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
    if (isLocalizationRunCurrent(runId, current) && localized && localized !== source) input.setAttribute('placeholder', localized);
  }

  const /** @type {any} */
  attrNodes = root.querySelectorAll('[title],[aria-label],[aria-description],[alt]');
  for (const /** @type {any} */
  node of attrNodes) {
    if (node.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages, pre, code, kbd, samp, script, style, noscript, textarea')) continue;
    for (const attr of ['title', 'aria-label', 'aria-description', 'alt']) {
      if (!node.hasAttribute?.(attr)) continue;
      const source = node.getAttribute(`${AUTO_LOCALIZE_ATTR}-${attr}`) || node.getAttribute(attr) || '';
      if (!source || !shouldAutoTranslateAttributeValue(source)) continue;
      if (localizeAttributeFromOfflinePack(node, attr, current)) continue;
      node.setAttribute(`${AUTO_LOCALIZE_ATTR}-${attr}`, source);
      const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
      if (isLocalizationRunCurrent(runId, current) && localized && localized !== source) node.setAttribute(attr, localized);
    }
  }

  installAutoLocalizeObserver(root);
}


async function localizeScreenFallbacks(root = document, current = getCurrentLanguage()) {
  const textNodes = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,button,a,span,label,li,th,td,small,strong,em,summary,option,div');
  for (const node of textNodes) {
    if (!shouldAutoTranslateNode(node)) continue;
    localizeNodeFromOfflinePack(node, current);
  }

  const NodeFilterCtor = /** @type {any} */ (window?.NodeFilter || globalThis.NodeFilter);
  if (NodeFilterCtor) {
    const walker = document.createTreeWalker(root.body || root.documentElement || root, NodeFilterCtor.SHOW_TEXT);
    let textNode = /** @type {Text | null} */ (walker.nextNode());
    while (textNode) {
      const nextNode = /** @type {Text | null} */ (walker.nextNode());
      if (shouldAutoTranslateTextNode(textNode)) localizeTextNodeFromOfflinePack(textNode, current);
      textNode = nextNode;
    }
  }

  const placeholderNodes = root.querySelectorAll('input[placeholder], textarea[placeholder]');
  for (const input of placeholderNodes) {
    if (input.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages')) continue;
    localizeAttributeFromOfflinePack(input, 'placeholder', current);
  }

  const attrNodes = root.querySelectorAll('[title],[aria-label],[aria-description],[alt]');
  for (const node of attrNodes) {
    if (node.closest('[data-no-auto-i18n="1"], .ew-messages, .chat-messages, pre, code, kbd, samp, script, style, noscript, textarea')) continue;
    for (const attr of ['title', 'aria-label', 'aria-description', 'alt']) localizeAttributeFromOfflinePack(node, attr, current);
  }
}

export async function localizeStatic(/** @type {any} */ root = document) {
  const current = getCurrentLanguage();
  const runId = beginLocalizationRun();
  const stillCurrent = () => isLocalizationRunCurrent(runId, current);

  // English is the immutable source language. Never rebuild it from a translated
  // node or from a late async result belonging to a previous language run.
  if (!current || current === 'en') {
    await restoreEnglishPage(root);
    return;
  }

  const /** @type {any} */ nodes = root.querySelectorAll('[data-i18n-key]');
  for (const /** @type {any} */ node of nodes) {
    if (!stillCurrent()) return;
    const key = node.getAttribute('data-i18n-key');
    if (!key) continue;
    const storedSource = node.getAttribute(AUTO_LOCALIZE_ATTR);
    const source = storedSource
      || node.getAttribute('data-i18n-fallback')
      || node.textContent
      || key;
    if (!storedSource && source) node.setAttribute(AUTO_LOCALIZE_ATTR, source);

    const packed = multiLanguageService.t(key, source);
    if (packed && packed !== source) {
      if (stillCurrent()) node.textContent = packed;
      continue;
    }
    if (!stillCurrent()) return;
    if (localizeNodeFromOfflinePack(node, current)) continue;
    const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
    if (stillCurrent() && localized && localized !== source) node.textContent = localized;
  }

  if (!stillCurrent()) return;
  await localizeScreenFallbacks(root, current);
  if (!stillCurrent()) return;

  const common = /** @type {any} */ (COMMON_UI_COPY)[current];
  if (common) {
    const skipNodes = root.querySelectorAll('a.skip-to-content, a.skip-link, #eon-skip-to-main');
    for (const /** @type {any} */ node of skipNodes) {
      if (!stillCurrent()) return;
      node.textContent = common.skip;
    }
    const aboutNodes = root.querySelectorAll('a[href="/about"]');
    for (const /** @type {any} */ node of aboutNodes) {
      if (!stillCurrent()) return;
      if (String(node.textContent || '').trim().toLowerCase() === 'about') node.textContent = common.about;
    }
    const privacyNodes = root.querySelectorAll('a[href="/privacy"]');
    for (const /** @type {any} */ node of privacyNodes) {
      if (!stillCurrent()) return;
      if (String(node.textContent || '').trim().toLowerCase() === 'privacy') node.textContent = common.privacy;
    }
  }

  const translateShellNodes = async (/** @type {string} */ selector) => {
    const shellNodes = root.querySelectorAll(selector);
    for (const /** @type {any} */ node of shellNodes) {
      if (!stillCurrent()) return;
      const storedSource = node.getAttribute(AUTO_LOCALIZE_ATTR);
      const source = storedSource || String(node.textContent || '').trim();
      if (!source) continue;
      if (!storedSource) node.setAttribute(AUTO_LOCALIZE_ATTR, source);
      const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
      if (stillCurrent() && localized && localized !== source) node.textContent = localized;
    }
  };
  await translateShellNodes('a.skip-to-content, a.skip-link, #eon-skip-to-main');
  await translateShellNodes('a[href="/about"]');
  await translateShellNodes('a[href="/privacy"]');
  if (!stillCurrent()) return;

  const shellNav = /** @type {any} */ (SHELL_NAV_COPY)[current];
  if (shellNav) {
    const navNodes = root.querySelectorAll('header .nav a, .site-header .nav a, .footer-nav a');
    for (const /** @type {any} */ node of navNodes) {
      if (!stillCurrent()) return;
      const href = String(node.getAttribute('href') || '').split('?')[0];
      const label = shellNav[href];
      if (label) {
        node.textContent = label;
      } else {
        const storedSource = node.getAttribute(AUTO_LOCALIZE_ATTR);
        const source = storedSource || String(node.textContent || '').trim();
        if (source) {
          if (!storedSource) node.setAttribute(AUTO_LOCALIZE_ATTR, source);
          const localized = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
          if (stillCurrent() && localized && localized !== source) node.textContent = localized;
        }
      }
    }
    const footerCopyNodes = root.querySelectorAll('.footer-brand p, [data-i18n-key="site.footer.copy"]');
    for (const /** @type {any} */ node of footerCopyNodes) {
      if (!stillCurrent()) return;
      const storedSource = node.getAttribute(AUTO_LOCALIZE_ATTR);
      const source = storedSource || node.getAttribute('data-i18n-fallback') || node.textContent || '';
      if (!source) continue;
      if (!storedSource) node.setAttribute(AUTO_LOCALIZE_ATTR, source);
      const localized = multiLanguageService.t('site.footer.copy', source);
      if (localized && localized !== source) node.textContent = localized;
      else {
        const translated = await translateForUser(source, { fromLang: 'en', toLang: current, category: 'guide' });
        if (stillCurrent() && translated && translated !== source) node.textContent = translated;
      }
    }
  }
}
