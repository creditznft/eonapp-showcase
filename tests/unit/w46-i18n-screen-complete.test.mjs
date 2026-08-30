import test from 'node:test';
import assert from 'node:assert/strict';
import { getOfflineScreenTranslation } from '../../assets/js/utils/offline-screen-translations.js';

const languages = ['es', 'de', 'fr', 'pt', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko'];
const launchCriticalCopy = [
  'EONBOT AI Operator',
  'Ask, plan, and route work into the cockpit.',
  'Setup AI provider',
  'Start free',
  'See plans',
  'Enter EON City',
  'Open private workspace',
  'Generate My Realm',
  'Admin 1 launch commerce',
  'All launch income to Admin 1'
];

test('W46 offline screen translations cover launch-critical visible copy', () => {
  for (const text of launchCriticalCopy) {
    for (const lang of languages) {
      assert.ok(getOfflineScreenTranslation(text, lang), `${text} missing ${lang}`);
    }
  }
});

test('W46 offline screen translations restore English source for en', () => {
  const source = 'Start free';
  assert.equal(getOfflineScreenTranslation(source, 'en'), source);
  assert.equal(getOfflineScreenTranslation(source, 'en-US'), source);
});
