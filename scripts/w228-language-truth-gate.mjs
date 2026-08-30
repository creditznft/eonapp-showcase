#!/usr/bin/env node
/**
 * W228 local-language truth gate.
 *
 * Verifies the canonical language selector is a curated local UI layer rather
 * than an implicit provider/key/reward surface, and that it only lists current
 * public routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import multiLanguageService, { LANGUAGE_PACKS } from '../assets/js/utils/multi-language.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_PUBLIC_CODES = Object.freeze(['en']);
const EXPECTED_CHAT_GUIDE_CODES = Object.freeze(['en', 'es', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'ru', 'ar', 'hi']);
const REQUIRED_CORE_KEYS = Object.freeze(['common.language', 'common.select-language', 'common.auto', 'common.profile', 'common.share', 'nav.chat', 'nav.projects', 'nav.library', 'nav.workspace', 'nav.market', 'nav.automations', 'nav.local-ai']);

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function check(rows, name, passed, detail = null) {
  rows.push({ name, passed: Boolean(passed), detail });
}

export async function verifyW228LanguageTruth(root = ROOT) {
  const rows = [];
  const languageSource = fs.readFileSync(path.join(root, 'assets/js/utils/multi-language.js'), 'utf8');
  const registrySource = fs.readFileSync(path.join(root, 'assets/js/utils/i18n-rc-registry.js'), 'utf8');
  const offlineSource = fs.readFileSync(path.join(root, 'assets/js/utils/offline-screen-translations.js'), 'utf8');
  const curatedCacheSource = fs.readFileSync(path.join(root, 'assets/js/utils/offline-screen-translations.current.js'), 'utf8');
  const codes = multiLanguageService.getSelectableLanguages().map((item) => item.code);
  const chatGuideCodes = multiLanguageService.getChatGuideLanguages().map((item) => item.code);

  check(rows, 'exact published interface language set', JSON.stringify(codes) === JSON.stringify(EXPECTED_PUBLIC_CODES), codes);
  check(rows, 'exact Chat/Guide capability set', JSON.stringify(chatGuideCodes) === JSON.stringify(EXPECTED_CHAT_GUIDE_CODES), chatGuideCodes);
  check(rows, 'all core shell labels resolve', EXPECTED_CHAT_GUIDE_CODES.every((code) => REQUIRED_CORE_KEYS.every((key) => Boolean(String(LANGUAGE_PACKS[code]?.[key] || '').trim()))));
  check(rows, 'German core label is localized', LANGUAGE_PACKS.de['common.language'] === 'Sprache', LANGUAGE_PACKS.de['common.language']);
  check(rows, 'Hindi core label is localized', LANGUAGE_PACKS.hi['common.language'] === 'भाषा', LANGUAGE_PACKS.hi['common.language']);
  check(rows, 'Arabic remains the sole RTL Chat/Guide capability', multiLanguageService.getLanguageInfo('ar')?.rtl === true && multiLanguageService.getLanguageInfo('hi')?.rtl === false);
  check(rows, 'no hidden provider/key/model dependency', !/(mission-engine|ai-runtime|runMissionEngine|loadAISettings|getApiKey|PROVIDERS)/.test(languageSource));
  check(rows, 'no retired reward/token language engine', !/(Pool Points|EonPoolPoints|reward engine|token ledger|translation-ai)/i.test(languageSource));
  check(rows, 'live translation provider is intentionally off', (await multiLanguageService.hasLiveTranslationProvider()) === false);
  const known = await multiLanguageService.translate('Build', 'en', 'de');
  const unknown = await multiLanguageService.translate('A phrase with no static translation', 'en', 'de');
  check(rows, 'known static phrase localizes locally', known.translatedText === 'Werkbank' && known.mode === 'static-local-only', known);
  check(rows, 'unknown phrase safely falls back to authored text', unknown.translatedText === 'A phrase with no static translation' && unknown.quality === 0, unknown);
  check(rows, 'canonical offline map is the only runtime translation source', /offline-screen-translations\.current\.js/.test(offlineSource));
  check(rows, 'curated cache has no retired payment/token/reward vocabulary', !/(Pool Points|EonLite|EON Lite|Polygon|Mainnet|NOWPayments|Monetag|offerwall|lootbox|cash[- ]?out|affiliate payout)/i.test(curatedCacheSource));
  check(rows, 'language registry has no retired flagship surfaces', !/(\/rewards\.html|\/realmworld\.html|\/eon-browser\.html|\/workbench\.html|\/marketplace\.html)/.test(registrySource));
  const routeRows = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES].filter((row) => row.file);
  const missing = routeRows.filter((row) => !fs.existsSync(path.join(root, row.file))).map((row) => row.file);
  check(rows, 'every declared current surface has an HTML source file', missing.length === 0, missing);

  return { ok: rows.every((row) => row.passed), rows };
}

export async function main() {
  const result = await verifyW228LanguageTruth();
  console.log(JSON.stringify(result, null, 2));
  return result.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
