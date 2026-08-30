import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { getOfflineScreenTranslation } from '../../assets/js/utils/offline-screen-translations.js';

const LANGS = ['es', 'de', 'fr', 'pt', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko'];
const SAMPLE_STRINGS = [
  'EONBOT starts in safe guide mode, then connects to your own AI keys or local runtime when you are ready. Try a starter mission, then move serious work into the cockpit.',
  'API Keys & Providers',
  'Language & Voice',
  'Ad gateway, not sitewide ads',
  'Ads only appear on this access page for eligible reward actions. Sensitive pages, Vault, billing, privacy, legal and support stay ad-free.',
  'Choose your EONAPP plan',
  'Ad access credits',
  'Real paid subscription upgrades remain proof-gated until server ad completion/postback verification is live.',
  'Monetag rewarded SDK is configured for zone 11111741 inside the Telegram Mini App.',
  'Ad-sponsored subscription pass',
  'Server proof required for account-wide subscription upgrades.'
];

test('W47 screen-complete command passes expanded launch coverage', () => {
  const output = execFileSync(process.execPath, ['scripts/i18n-screen-complete.mjs'], { cwd: process.cwd(), encoding: 'utf8' });
  const report = JSON.parse(output);
  assert.equal(report.status, 'PASS');
  assert.ok(report.checkedPairs >= 1220, `expected at least 1220 checked pairs, got ${report.checkedPairs}`);
  assert.equal(report.missing.length, 0);
});

test('W47 offline language layer covers ad gateway and deep launch strings', () => {
  for (const source of SAMPLE_STRINGS) {
    for (const lang of LANGS) {
      const translated = getOfflineScreenTranslation(source, lang);
      assert.ok(translated, `${source} missing ${lang}`);
      assert.notEqual(translated, source, `${source} unchanged for ${lang}`);
    }
  }
});
