import { RC_LANGUAGE_CODES, getRcLanguages, isRcLanguage, normalizeRcLanguage } from './i18n-rc-registry.js';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_CHAT_GUIDE_LANGUAGE_MATRIX, isEonChatGuideLanguage, normalizeEonChatGuideLanguage } from './language-matrix.js';
import { getOfflineScreenTranslation } from './offline-screen-translations.js';

/**
 * W228 canonical local language service.
 *
 * Product truth:
 * - This is a local UI-language selector, not a translation provider.
 * - It never reads provider settings or API keys.
 * - It never calls a model, a network endpoint, a value-tracking service, or a commercial ledger.
 * - Missing static copy remains in authored English instead of inventing a capability claim.
 */

const LANGUAGE_PREFERENCE_KEY = 'eon:lang:preference:v1';
const LEGACY_LANGUAGE_KEY = 'eon:lang:v1';
const CUSTOM_PACKS_KEY = 'eon:lang:custom-packs:v1';
const GLOBAL = typeof window !== 'undefined' ? window : globalThis;

export const LANGUAGES = Object.freeze(getRcLanguages().map((language) => Object.freeze({ ...language })));
export const CHAT_GUIDE_LANGUAGES = Object.freeze(EON_CHAT_GUIDE_LANGUAGE_MATRIX.map((language) => Object.freeze({ ...language, active: true, public: false, capability: 'chat-guide', rtl: language.dir === 'rtl' })));

// Canonical shell labels are intentionally small and honest. Route/page copy is
// localized from the curated offline map by source phrase, with English fallback.
export const CANONICAL_ENGLISH_PACK = Object.freeze({
  'nav.chat': 'Chat',
  'nav.projects': 'Projects',
  'nav.library': 'Library',
  'nav.workspace': 'Workspace',
  'nav.city': 'EON City',
  'nav.market': 'Market',
  'nav.trade': 'Research Lab',
  'nav.automations': 'Automations',
  'nav.profile': 'Profile',
  'nav.vault': 'Vault',
  'nav.local-ai': 'Local AI',
  'nav.realm-studio': 'My Realm',
  'nav.more': 'More',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.close': 'Close',
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.success': 'Saved',
  'common.warning': 'Notice',
  'common.language': 'Language',
  'common.select-language': 'Choose language',
  'common.auto': 'Auto',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.settings': 'Settings',
  'common.profile': 'Profile',
  'common.search': 'Search',
  'common.share': 'Invite & Share',
  'common.copy': 'Copy',
  'common.generate': 'Generate',
  'chat.title': 'EONBOT',
  'chat.new': 'New chat',
  'chat.prompt': 'What would you like to work on?',
  'chat.guide': 'Guide',
  'chat.local': 'Local',
  'chat.connected': 'Connected',
  'share.title': 'Invite & Share Center',
  'share.invite': 'Invite someone to EONAPP',
  'share.city': 'Share EON City',
  'share.workspace': 'Share Workspace',
  'share.realm': 'Share My Realm identity',
  'share.review': 'Create a review schedule',
  'market.title': 'Create a private collection',
  'market.generate': 'Generate 4 originals',
  'market.local': 'Generated on this device',
  'market.save': 'Save local preview',
  'market.official': 'Official catalog is not active',
  'city.title': 'EON City',
  'city.enter': 'Enter City',
  'city.return': 'Return to workspace',
  'city.objective': 'Explore a district',
  'realm.title': 'My Realm',
  'realm.save': 'Save Realm',
  'realm.private': 'Private on this device',
  'vault.title': 'Vault & Backup',
  'vault.export': 'Export encrypted backup',
  'vault.restore': 'Restore backup',
  'local-ai.title': 'Local AI setup',
  'local-ai.check': 'Check this device',
  'local-ai.test': 'Test local runtime',
  'trade.title': 'Research Lab',
  'trade.readonly': 'Local research only. No live data or order path is available.',
  'billing.disabled': 'Commerce is not active',
  'rewards.disabled': 'No reward campaign is active',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms',
  'footer.support': 'Support'
});

function safeGet(key) {
  try {
    return GLOBAL?.localStorage?.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSet(key, value) {
  try {
    GLOBAL?.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeReadJson(key) {
  try {
    const raw = safeGet(key);
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function normalize(value, fallback = 'en') {
  return normalizeRcLanguage(value, fallback);
}

function normalizeChatGuide(value, fallback = 'en') {
  return normalizeEonChatGuideLanguage(value, fallback);
}

function staticTranslation(english, code) {
  const source = String(english || '').trim();
  const language = normalizeChatGuide(code);
  if (!source || language === 'en') return source;
  return getOfflineScreenTranslation(source, language) || source;
}

const CORE_KEY_TRANSLATIONS = Object.freeze({
  es: Object.freeze({
    'common.language': 'Idioma', 'common.select-language': 'Elige idioma', 'common.auto': 'Automático',
    'common.profile': 'Perfil', 'common.share': 'Invitar y compartir', 'nav.chat': 'Chat',
    'nav.projects': 'Proyectos', 'nav.library': 'Biblioteca', 'nav.workspace': 'Espacio de trabajo',
    'nav.market': 'Mercado', 'nav.automations': 'Automatizaciones', 'nav.local-ai': 'IA local'
  }),
  zh: Object.freeze({
    'common.language': '语言', 'common.select-language': '选择语言', 'common.auto': '自动',
    'common.profile': '个人资料', 'common.share': '邀请并分享', 'nav.chat': '聊天',
    'nav.projects': '项目', 'nav.library': '资料库', 'nav.workspace': '工作区',
    'nav.market': '市场', 'nav.automations': '自动化', 'nav.local-ai': '本地 AI'
  }),
  ja: Object.freeze({
    'common.language': '言語', 'common.select-language': '言語を選択', 'common.auto': '自動',
    'common.profile': 'プロフィール', 'common.share': '招待して共有', 'nav.chat': 'チャット',
    'nav.projects': 'プロジェクト', 'nav.library': 'ライブラリ', 'nav.workspace': 'ワークスペース',
    'nav.market': 'マーケット', 'nav.automations': '自動化', 'nav.local-ai': 'ローカル AI'
  }),
  ko: Object.freeze({
    'common.language': '언어', 'common.select-language': '언어 선택', 'common.auto': '자동',
    'common.profile': '프로필', 'common.share': '초대 및 공유', 'nav.chat': '채팅',
    'nav.projects': '프로젝트', 'nav.library': '라이브러리', 'nav.workspace': '작업 공간',
    'nav.market': '마켓', 'nav.automations': '자동화', 'nav.local-ai': '로컬 AI'
  }),
  fr: Object.freeze({
    'common.language': 'Langue', 'common.select-language': 'Choisir la langue', 'common.auto': 'Automatique',
    'common.profile': 'Profil', 'common.share': 'Inviter et partager', 'nav.chat': 'Discussion',
    'nav.projects': 'Projets', 'nav.library': 'Bibliothèque', 'nav.workspace': 'Espace de travail',
    'nav.market': 'Marché', 'nav.automations': 'Automatisations', 'nav.local-ai': 'IA locale'
  }),
  de: Object.freeze({
    'common.language': 'Sprache', 'common.select-language': 'Sprache auswählen', 'common.auto': 'Automatisch',
    'common.profile': 'Profil', 'common.share': 'Einladen und teilen', 'nav.chat': 'Chat',
    'nav.projects': 'Projekte', 'nav.library': 'Bibliothek', 'nav.workspace': 'Arbeitsbereich',
    'nav.market': 'Markt', 'nav.automations': 'Automatisierungen', 'nav.local-ai': 'Lokale KI'
  }),
  pt: Object.freeze({
    'common.language': 'Idioma', 'common.select-language': 'Escolher idioma', 'common.auto': 'Automático',
    'common.profile': 'Perfil', 'common.share': 'Convidar e partilhar', 'nav.chat': 'Chat',
    'nav.projects': 'Projetos', 'nav.library': 'Biblioteca', 'nav.workspace': 'Área de trabalho',
    'nav.market': 'Mercado', 'nav.automations': 'Automações', 'nav.local-ai': 'IA local'
  }),
  ru: Object.freeze({
    'common.language': 'Язык', 'common.select-language': 'Выберите язык', 'common.auto': 'Авто',
    'common.profile': 'Профиль', 'common.share': 'Пригласить и поделиться', 'nav.chat': 'Чат',
    'nav.projects': 'Проекты', 'nav.library': 'Библиотека', 'nav.workspace': 'Рабочее пространство',
    'nav.market': 'Рынок', 'nav.automations': 'Автоматизации', 'nav.local-ai': 'Локальный ИИ'
  }),
  ar: Object.freeze({
    'common.language': 'اللغة', 'common.select-language': 'اختر اللغة', 'common.auto': 'تلقائي',
    'common.profile': 'الملف الشخصي', 'common.share': 'دعوة ومشاركة', 'nav.chat': 'الدردشة',
    'nav.projects': 'المشاريع', 'nav.library': 'المكتبة', 'nav.workspace': 'مساحة العمل',
    'nav.market': 'السوق', 'nav.automations': 'الأتمتة', 'nav.local-ai': 'ذكاء اصطناعي محلي'
  }),
  hi: Object.freeze({
    'common.language': 'भाषा', 'common.select-language': 'भाषा चुनें', 'common.auto': 'स्वचालित',
    'common.profile': 'प्रोफ़ाइल', 'common.share': 'आमंत्रित करें और साझा करें', 'nav.chat': 'चैट',
    'nav.projects': 'प्रोजेक्ट', 'nav.library': 'लाइब्रेरी', 'nav.workspace': 'कार्यस्थान',
    'nav.market': 'मार्केट', 'nav.automations': 'ऑटोमेशन', 'nav.local-ai': 'स्थानीय AI'
  })
});

function buildLanguagePack(code) {
  const language = normalizeChatGuide(code);
  const base = Object.fromEntries(
    Object.entries(CANONICAL_ENGLISH_PACK).map(([key, english]) => [key, staticTranslation(english, language)])
  );
  return Object.freeze({ ...base, ...(CORE_KEY_TRANSLATIONS[language] || {}) });
}

export const LANGUAGE_PACKS = Object.freeze(Object.fromEntries(
  EON_CHAT_GUIDE_LANGUAGE_CODES.map((code) => [code, buildLanguagePack(code)])
));

export class MultiLanguageService {
  constructor() {
    const candidate = safeGet(LANGUAGE_PREFERENCE_KEY) || safeGet(LEGACY_LANGUAGE_KEY) || this.detectBrowserLanguage();
    this._userLang = normalize(candidate);
    this._customPacks = safeReadJson(CUSTOM_PACKS_KEY);
  }

  getUserLanguage() {
    return this._userLang;
  }

  setUserLanguage(language) {
    const normalized = normalize(language, 'en');
    this._userLang = normalized;
    safeSet(LANGUAGE_PREFERENCE_KEY, normalized);
    safeSet(LEGACY_LANGUAGE_KEY, normalized);
    try {
      GLOBAL?.dispatchEvent?.(new CustomEvent('eon:language-changed', { detail: { language: normalized } }));
    } catch {}
    return Object.freeze({ success: true, normalized, language: normalized, mode: 'static-local-only' });
  }

  detectBrowserLanguage() {
    const candidates = [
      GLOBAL?.navigator?.language,
      ...(Array.isArray(GLOBAL?.navigator?.languages) ? GLOBAL.navigator.languages : [])
    ];
    for (const candidate of candidates) {
      const normalized = normalize(candidate, '');
      if (normalized && isRcLanguage(normalized)) return normalized;
    }
    return 'en';
  }

  isRTL(language = this._userLang) {
    return this.getLanguageInfo(language)?.rtl === true;
  }

  getSupportedLanguages() {
    return LANGUAGES.map((language) => ({ ...language }));
  }

  getSelectableLanguages() {
    return this.getSupportedLanguages();
  }

  getChatGuideLanguages() {
    return CHAT_GUIDE_LANGUAGES.map((language) => ({ ...language }));
  }

  getLanguageCatalog() {
    return this.getChatGuideLanguages();
  }

  getLanguageInfo(language) {
    const normalized = normalizeChatGuide(language, '');
    return this.getChatGuideLanguages().find((item) => item.code === normalized) || null;
  }

  isLanguageSupported(language) {
    return isEonChatGuideLanguage(language);
  }

  isSelectableLanguage(language) {
    return isRcLanguage(language);
  }

  t(key, fallback = '') {
    const rawKey = String(key || '').trim();
    const english = String(CANONICAL_ENGLISH_PACK[rawKey] || fallback || rawKey || '').trim();
    if (!english) return '';
    const language = this._userLang;
    const custom = this._customPacks?.[language]?.[rawKey];
    if (typeof custom === 'string' && custom.trim()) return custom.trim();
    return LANGUAGE_PACKS[language]?.[rawKey] || staticTranslation(english, language) || english;
  }

  async translate(text, fromLang = 'en', toLang = this._userLang, _category = 'general') {
    const source = String(text || '');
    const from = normalizeChatGuide(fromLang);
    const to = normalizeChatGuide(toLang);
    if (!source || from === to) {
      return Object.freeze({ translatedText: source, fromLang: from, toLang: to, cached: true, quality: 100, mode: 'static-local-only' });
    }
    const translatedText = staticTranslation(source, to);
    const translated = translatedText !== source;
    return Object.freeze({
      translatedText,
      fromLang: from,
      toLang: to,
      cached: translated,
      quality: translated ? 95 : 0,
      mode: 'static-local-only'
    });
  }

  async translateBulk(texts, fromLang = 'en', toLang = this._userLang) {
    const list = Array.isArray(texts) ? texts : [];
    const results = [];
    for (const text of list) results.push((await this.translate(text, fromLang, toLang)).translatedText);
    return results;
  }

  addCustomPack(language, pack) {
    const normalized = normalize(language, '');
    if (!normalized || !pack || typeof pack !== 'object' || Array.isArray(pack)) {
      return Object.freeze({ success: false, reason: 'invalid-local-pack' });
    }
    const safeEntries = Object.entries(pack)
      .filter(([key, value]) => typeof key === 'string' && key.length <= 120 && typeof value === 'string' && value.length <= 1000)
      .slice(0, 200);
    this._customPacks[normalized] = { ...(this._customPacks[normalized] || {}), ...Object.fromEntries(safeEntries) };
    safeSet(CUSTOM_PACKS_KEY, JSON.stringify(this._customPacks));
    return Object.freeze({ success: true, normalized, entries: safeEntries.length, mode: 'local-only' });
  }

  async hasLiveTranslationProvider() {
    return false;
  }

  getStats() {
    return Object.freeze({
      totalLanguages: EON_CHAT_GUIDE_LANGUAGE_CODES.length,
      publicLanguages: RC_LANGUAGE_CODES.length,
      chatGuideLanguages: EON_CHAT_GUIDE_LANGUAGE_CODES.length,
      catalogLanguages: CHAT_GUIDE_LANGUAGES.length,
      rtlLanguages: 1,
      userLanguage: this._userLang,
      customPacks: Object.keys(this._customPacks).length,
      translationMode: 'static-local-only',
      liveProvider: false,
      tier1: LANGUAGES.filter((item) => item.tier === 1).length,
      tier2: 0,
      tier3: 0,
      tier4: 0
    });
  }
}

export const multiLanguageService = new MultiLanguageService();

export async function translateForUser(text, options = {}) {
  const result = await multiLanguageService.translate(
    text,
    options.fromLang || options.sourceLang || 'en',
    options.toLang || options.targetLang || multiLanguageService.getUserLanguage(),
    options.category || 'general'
  );
  return result.translatedText;
}

export default multiLanguageService;
