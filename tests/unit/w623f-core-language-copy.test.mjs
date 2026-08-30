import assert from 'node:assert/strict';
import test from 'node:test';
import { EON_FULL_PRODUCT_LANGUAGE_CODES } from '../../assets/js/utils/language-matrix.js';
import { getOfflineScreenTranslation } from '../../assets/js/utils/offline-screen-translations.js';

const required = [
  'What would you like to make?',
  'Message EONBOT…',
  'Open Create',
  'Voice & language',
  'Reply language',
  'Speech recognition language',
  'Dictate — turn speech into editable text.',
  'Use Voice — talk with EONBOT using the current Guide, Local, or Connected route.',
  'Tell me what you want to make or solve. I’ll turn it into one clear next step—Create something new, continue a Project, find an item in Library, enter EON City, or open a private setting. No feature maze.'
];

test('W623F core Chat, Guide and voice copy exists for every non-English release language', () => {
  for (const language of EON_FULL_PRODUCT_LANGUAGE_CODES.filter((code) => code !== 'en')) {
    for (const source of required) {
      const translated = getOfflineScreenTranslation(source, language);
      assert.equal(Boolean(translated), true, `${language}: ${source}`);
      assert.notEqual(translated, source, `${language}: ${source}`);
    }
  }
});
