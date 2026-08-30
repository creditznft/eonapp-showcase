import multiLanguageService, { LANGUAGE_PACKS } from './multi-language.js';

export const EONAPP_CHAT_GUIDE_LANGUAGES_W90 = Object.freeze(['en', 'es', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'ru', 'ar', 'hi']);
export const EONAPP_CRITICAL_I18N_KEYS_W90 = Object.freeze([
  'market.unified.title',
  'market.unified.subtitle',
  'market.lootboxes',
  'market.utility-nfts',
  'market.temporary-passes',
  'lootbox.open',
  'lootbox.unopened',
  'lootbox.opening',
  'lootbox.claim-summary',
  'lootbox.skip-animation',
  'lootbox.disclosed-odds',
  'lootbox.internal-only',
  'eonbot.guide.title',
  'eonbot.voice-fallback',
  'eonbot.visitor-safe',
  'realm.lootbox.station',
  'backup.nft-assets.title',
  'nft.generator.world-class',
  'nft.utility.ai-robot-core',
  'nft.utility.workstation-module',
  'nft.utility.realm-builder-pass',
  'nft.utility.creator-prism-pass',
  'nft.utility.vault-guardian',
  'nft.utility.agent-companion',
  'nft.utility.data-crystal',
  'nft.utility.drone-swarm',
  'nft.utility.city-key',
  'lootbox.reward.station',
  'ads.live.codex.test',
  'telegram.live.codex.test',
  'language.switch.stable',
  'api.keys.safe.update'
]);

export function verifyLanguagePackCompleteness({ languages = EONAPP_CHAT_GUIDE_LANGUAGES_W90, keys = EONAPP_CRITICAL_I18N_KEYS_W90 } = {}) {
  const rows = languages.map((lang) => {
    const pack = lang === 'en' ? LANGUAGE_PACKS.en : LANGUAGE_PACKS[lang];
    const missing = keys.filter((key) => !pack?.[key]);
    return Object.freeze({ lang, missing, complete: missing.length === 0 });
  });
  return Object.freeze({
    schema: 'eon.language-pack-completeness.w90.v1',
    languages,
    keys,
    rows,
    missingTotal: rows.reduce((sum, row) => sum + row.missing.length, 0),
    complete: rows.every((row) => row.complete)
  });
}

export function verifyLanguageSwitchRoundTrip({ language = 'es', key = 'market.unified.title' } = {}) {
  const original = multiLanguageService.getUserLanguage?.() || 'en';
  const english = LANGUAGE_PACKS.en?.[key] || 'AI Upgrade Market';
  multiLanguageService.setUserLanguage(language);
  const translated = multiLanguageService.t(key, english);
  multiLanguageService.setUserLanguage('en');
  const backToEnglish = multiLanguageService.t(key, english);
  multiLanguageService.setUserLanguage(original);
  return Object.freeze({
    schema: 'eon.language-roundtrip.w90.v1',
    language,
    key,
    translated,
    backToEnglish,
    stable: backToEnglish === english && translated !== key
  });
}

export function scoreLanguageStabilityGate() {
  const completeness = verifyLanguagePackCompleteness();
  const roundTrips = EONAPP_CHAT_GUIDE_LANGUAGES_W90.filter((lang) => lang !== 'en').map((language) => verifyLanguageSwitchRoundTrip({ language }));
  const checks = {
    allPacksComplete: completeness.complete,
    elevenChatGuideLanguages: completeness.languages.length === 11,
    roundTripStable: roundTrips.every((row) => row.stable),
    allCriticalKeysResolve: EONAPP_CRITICAL_I18N_KEYS_W90.every((key) => EONAPP_CHAT_GUIDE_LANGUAGES_W90.every((lang) => Boolean((lang === 'en' ? LANGUAGE_PACKS.en : LANGUAGE_PACKS[lang])?.[key]))),
    rtlSupported: ['ar'].every((lang) => multiLanguageService.isRTL?.(lang) === true),
    englishReturns: verifyLanguageSwitchRoundTrip({ language: 'hi' }).backToEnglish === LANGUAGE_PACKS.en['market.unified.title']
  };
  const total = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100);
  return Object.freeze({ schema: 'eon.language-stability-score.w90.v1', total, grade: total === 100 ? 'language-top-tier' : total >= 95 ? 'language-stable' : 'needs-language-work', checks, completeness, roundTrips });
}
