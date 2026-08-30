import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W102 authoritative language gate passes', () => {
  const run = spawnSync(process.execPath, ['scripts/w102-language-truth-gate.mjs'], {
    cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024
  });
  assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  const report = JSON.parse(read('CodexAuditPack/W102_LANGUAGE_TRUTH_REBUILD/W102_LANGUAGE_TRUTH_GATE.json'));
  assert.equal(report.ok, true);
  assert.equal(report.releaseLanguageCount, 1);
  assert.equal(report.chatGuideLanguageCount, 11);
  assert.equal(report.browserSpeechLanguageCount, 11);
  assert.ok(report.productionHtmlFiles >= 25, `expected current product routes, got ${report.productionHtmlFiles}`);
  assert.equal(report.missingTranslationCount, 0);
  assert.equal(report.falsePublicClaimCount, 0);
});

test('W102 registry publishes English and retains non-public capability profiles', async () => {
  const registry = await import('../../assets/js/utils/i18n-rc-registry.js');
  assert.deepEqual(registry.RC_LANGUAGE_CODES, ['en']);
  assert.equal(registry.RC_LANGUAGE_CAPABILITY_META.ar.dir, 'rtl');
  assert.equal(registry.RC_LANGUAGE_CAPABILITY_META.zh.script, 'cjk');
  assert.equal(registry.RC_LANGUAGE_CAPABILITY_META.ja.script, 'cjk');
  assert.equal(registry.RC_LANGUAGE_CAPABILITY_META.ko.script, 'cjk');
});

test('W102 restores English and blocks stale async language writes', () => {
  const source = read('assets/js/utils/app-language.js');
  assert.match(source, /export async function restoreEnglishPage/);
  assert.match(source, /AUTO_LOCALIZE_RUN_KEY/);
  assert.match(source, /isLocalizationRunCurrent/);
  assert.match(source, /await restoreEnglishPage\(root\)/);
});

test('W102 global shell and layout use logical RTL and CJK rules', () => {
  const shell = read('assets/js/utils/site-shell.js');
  const css = read('assets/css/layout.css');
  assert.match(shell, /applyLanguageDocumentProfile/);
  assert.match(shell, /nav\.more/);
  assert.match(shell, /common\.auto/);
  assert.match(css, /html\[dir=['"]rtl['"]\]/);
  assert.match(css, /data-eon-script=['"]cjk['"]/);
  assert.match(css, /line-break:\s*strict/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test('W102 completion pack covers reward, marketplace and shell copy', () => {
  const source = read('assets/js/utils/i18n-w102-completion-packs.js');
  for (const key of [
    'reward.proof.title', 'reward.proof.body', 'reward.proof.local',
    'reward.proof.sdk', 'reward.proof.server', 'common.auto', 'nav.more',
    'nav.plans', 'nav.nft-exchange', 'nav.tools', 'nav.support',
    'marketplace.hero.title', 'marketplace.action.check-readiness',
    'marketplace.inference.point.approval', 'marketplace.unified.title',
    'marketplace.unified.note'
  ]) assert.match(source, new RegExp(key.replaceAll('.', '\\.'), 'g'));
});

test('W102 lightweight picker preserves performance-sensitive flagship shells', () => {
  const picker = read('assets/js/utils/release-language-picker.js');
  assert.match(picker, /RC_LANGUAGE_CODES/);
  assert.match(picker, /applyLanguageDocumentProfile/);
  for (const route of ['market.html', 'create.html', 'eoncity.html', 'realm-studio.html']) {
    assert.match(read(route), /(?:release-language-picker|site-shell|eon-app-shell)\.js/);
  }
});
