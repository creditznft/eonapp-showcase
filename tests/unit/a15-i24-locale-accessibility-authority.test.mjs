import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CHAT_GUIDE_LANGUAGE_CODES,
  EON_FULL_PRODUCT_LANGUAGE_CODES,
  EON_VOICE_LANGUAGE_MATRIX,
  isEonChatGuideLanguage,
  isEonFullProductLanguage
} from '../../assets/js/utils/language-matrix.js';
import { RC_LANGUAGE_CODES } from '../../assets/js/utils/i18n-rc-registry.js';
import multiLanguageService, { LANGUAGE_PACKS } from '../../assets/js/utils/multi-language.js';
import { normalizeChatLanguageCode, normalizeLanguageCode } from '../../assets/js/utils/app-language.js';
import {
  createAccessibilityEvidenceReceipt,
  describeLanguageCapability,
  evaluateRouteLocalizationManifest,
  getLocaleAccessibilityTruth
} from '../../assets/js/locale/eon-locale-accessibility-authority.js';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES } from '../../config/route-contract.mjs';

const config = JSON.parse(fs.readFileSync('config/locale/a15-i24-language-certification.json', 'utf8'));

test('I24 publishes only English while retaining eleven Chat/Guide and speech capabilities', () => {
  assert.deepEqual(EON_FULL_PRODUCT_LANGUAGE_CODES, ['en']);
  assert.deepEqual(RC_LANGUAGE_CODES, ['en']);
  assert.equal(EON_CHAT_GUIDE_LANGUAGE_CODES.length, 11);
  assert.equal(EON_VOICE_LANGUAGE_MATRIX.length, 11);
  assert.equal(isEonFullProductLanguage('de'), false);
  assert.equal(isEonChatGuideLanguage('de'), true);
  assert.equal(normalizeLanguageCode('de'), '');
  assert.equal(normalizeChatLanguageCode('de-DE'), 'de');
  assert.deepEqual(multiLanguageService.getSelectableLanguages().map((row) => row.code), ['en']);
  assert.equal(multiLanguageService.getChatGuideLanguages().length, 11);
  assert.equal(Object.keys(LANGUAGE_PACKS).length, 11);
});

test('I24 describes non-English capability without publishing an interface claim', () => {
  const arabic = describeLanguageCapability('ar');
  assert.equal(arabic.direction, 'rtl');
  assert.equal(arabic.publishedFullUi, false);
  assert.equal(arabic.chatGuide, true);
  assert.equal(arabic.browserSpeech, true);
  assert.equal(arabic.interfaceFallback, 'en');
  assert.ok(arabic.publicationBlockedBy.includes('legal-copy'));
});

test('I24 route-derived English manifest covers every current primary and informational route', () => {
  const routes = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES];
  assert.equal(config.routes.length, routes.length);
  assert.deepEqual(config.routes.map((row) => row.id), routes.map((row) => row.id));
  for (const route of routes) {
    const html = fs.readFileSync(route.file, 'utf8');
    assert.match(html, /<html[^>]*lang=["']en["']/i, route.file);
    assert.match(html, /<title>[^<]+<\/title>/i, route.file);
    assert.match(html, /<main\b/i, route.file);
    assert.match(html, /name=["']viewport["']/i, route.file);
  }
  const result = evaluateRouteLocalizationManifest(config.routes);
  assert.equal(result.englishSourceComplete, true);
  assert.equal(result.routeCount, routes.length);
});

test('I24 accessibility receipt cannot fabricate browser, AT or device certification', () => {
  const empty = createAccessibilityEvidenceReceipt([]);
  assert.equal(empty.sourceReady, true);
  assert.equal(empty.externalComplete, false);
  assert.equal(empty.wcagConformanceCertified, false);
  assert.equal(empty.automaticCertification, false);
  const invalid = createAccessibilityEvidenceReceipt([{ id: 'nvda-chrome', status: 'pass', evidenceDigest: 'not-a-digest' }]);
  assert.equal(invalid.externalComplete, false);
});

test('I24 truth keeps certification and side effects fail closed', () => {
  const truth = getLocaleAccessibilityTruth();
  assert.equal(truth.publishedInterfaceLanguageCount, 1);
  assert.equal(truth.chatGuideLanguageCount, 11);
  assert.equal(truth.browserSpeechLanguageCount, 11);
  assert.equal(truth.minimumTargetPx, 48);
  assert.equal(truth.nonEnglishInterfacePublished, false);
  assert.equal(truth.wcagConformanceCertified, false);
  assert.equal(truth.assistiveTechnologyCertified, false);
  assert.equal(truth.physicalDeviceCertified, false);
  assert.equal(truth.networkRequestCreated, false);
  assert.equal(truth.storageWritten, false);
  assert.equal(truth.navigationCreated, false);
});
