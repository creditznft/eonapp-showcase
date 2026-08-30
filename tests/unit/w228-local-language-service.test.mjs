import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import multiLanguageService, { LANGUAGE_PACKS } from '../../assets/js/utils/multi-language.js';
import { verifyW228LanguageTruth } from '../../scripts/w228-language-truth-gate.mjs';

test('W228 publishes English UI while retaining localized Chat/Guide packs', () => {
  assert.deepEqual(multiLanguageService.getSelectableLanguages().map((item) => item.code), ['en']);
  assert.deepEqual(multiLanguageService.getChatGuideLanguages().map((item) => item.code), ['en', 'es', 'zh', 'ja', 'ko', 'fr', 'de', 'pt', 'ru', 'ar', 'hi']);
  assert.equal(LANGUAGE_PACKS.de['common.language'], 'Sprache');
  assert.equal(LANGUAGE_PACKS.hi['common.language'], 'भाषा');
  assert.equal(LANGUAGE_PACKS.ar['common.language'], 'اللغة');
  assert.equal(multiLanguageService.isRTL('ar'), true);
  assert.equal(multiLanguageService.isRTL('de'), false);
});

test('W228 language service remains static/local-only with safe fallback', async () => {
  assert.equal(await multiLanguageService.hasLiveTranslationProvider(), false);
  const known = await multiLanguageService.translate('Build', 'en', 'de');
  assert.equal(known.translatedText, 'Werkbank');
  assert.equal(known.mode, 'static-local-only');
  const unknown = await multiLanguageService.translate('Phrase not in the curated cache', 'en', 'de');
  assert.equal(unknown.translatedText, 'Phrase not in the curated cache');
  assert.equal(unknown.quality, 0);
});

test('W228 language source cannot reintroduce provider, reward, or token runtime imports', () => {
  const source = fs.readFileSync(new URL('../../assets/js/utils/multi-language.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /mission-engine|ai-runtime|runMissionEngine|loadAISettings|getApiKey|PROVIDERS/);
  assert.doesNotMatch(source, /Pool Points|EonPoolPoints|translation-ai/);
});

test('W228 language truth gate stays green', async () => {
  const result = await verifyW228LanguageTruth();
  assert.equal(result.ok, true, JSON.stringify(result.rows.filter((row) => !row.passed), null, 2));
});
