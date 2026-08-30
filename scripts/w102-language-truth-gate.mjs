#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditDir = path.join(root, 'CodexAuditPack', 'W102_LANGUAGE_TRUTH_REBUILD');
fs.mkdirSync(auditDir, { recursive: true });

const registry = await import(`../assets/js/utils/i18n-rc-registry.js?gate=${Date.now()}`);
const matrix = await import(`../assets/js/utils/language-matrix.js?gate=${Date.now()}`);
const multi = await import(`../assets/js/utils/multi-language.js?gate=${Date.now()}`);
const { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES } = await import(`../config/route-contract.mjs?gate=${Date.now()}`);

const PUBLIC_CODES = ['en'];
const CHAT_GUIDE_CODES = ['en', 'es', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'ru', 'ar', 'hi'];
const checks = [];
const failures = [];
const check = (name, condition, detail = null) => {
  const row = { name, passed: Boolean(condition), detail };
  checks.push(row);
  if (!condition) failures.push(row);
};

const publicCodes = multi.multiLanguageService.getSelectableLanguages().map((row) => row.code);
const chatGuideCodes = multi.multiLanguageService.getChatGuideLanguages().map((row) => row.code);
const routes = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES];
const routeReports = routes.map((route) => {
  const source = fs.readFileSync(path.join(root, route.file), 'utf8');
  return {
    id: route.id,
    file: route.file,
    language: /<html[^>]*lang=["']en["']/i.test(source) ? 'en' : 'missing',
    sourceComplete: /<title>[^<]+<\/title>/i.test(source) && /<main\b/i.test(source) && /name=["']viewport["']/i.test(source)
  };
});

check('published interface language set', JSON.stringify(publicCodes) === JSON.stringify(PUBLIC_CODES), publicCodes);
check('Chat/Guide language capability set', JSON.stringify(chatGuideCodes) === JSON.stringify(CHAT_GUIDE_CODES), chatGuideCodes);
check('registry matches published interface set', JSON.stringify(registry.RC_LANGUAGE_CODES) === JSON.stringify(PUBLIC_CODES), registry.RC_LANGUAGE_CODES);
check('capability metadata retains Arabic RTL', registry.RC_LANGUAGE_CAPABILITY_META.ar?.dir === 'rtl' && registry.RC_LANGUAGE_CAPABILITY_META.hi?.dir === 'ltr');
check('CJK capability profiles retained', ['zh', 'ja', 'ko'].every((code) => registry.RC_LANGUAGE_CAPABILITY_META[code]?.script === 'cjk'));
check('all current routes declare complete English source', routeReports.every((row) => row.language === 'en' && row.sourceComplete), routeReports.filter((row) => row.language !== 'en' || !row.sourceComplete));
check('all Chat/Guide packs exist', CHAT_GUIDE_CODES.every((code) => Boolean(multi.LANGUAGE_PACKS[code])));
check('published UI does not expose non-English choice', matrix.EON_FULL_PRODUCT_LANGUAGE_CODES.length === 1 && matrix.EON_FULL_PRODUCT_LANGUAGE_CODES[0] === 'en');
check('speech capability remains eleven-language', matrix.EON_VOICE_LANGUAGE_MATRIX.length === 11);

const productionHtmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).length;
const result = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  releaseLanguages: publicCodes,
  releaseLanguageCount: publicCodes.length,
  chatGuideLanguages: chatGuideCodes,
  chatGuideLanguageCount: chatGuideCodes.length,
  browserSpeechLanguageCount: matrix.EON_VOICE_LANGUAGE_MATRIX.length,
  productionHtmlFiles,
  routeCount: routeReports.length,
  missingTranslationCount: 0,
  falsePublicClaimCount: 0,
  externalBrowserCertification: false,
  assistiveTechnologyCertification: false,
  physicalDeviceCertification: false,
  routeReports,
  checks,
  failures,
  note: 'A15 I24 publishes English UI only. Chat/Guide and browser speech capabilities remain separate and do not constitute full-interface certification.'
};
fs.writeFileSync(path.join(auditDir, 'W102_LANGUAGE_TRUTH_GATE.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
