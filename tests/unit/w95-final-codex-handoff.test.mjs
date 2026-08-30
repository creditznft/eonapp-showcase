import test from 'node:test';
import assert from 'node:assert/strict';

function installBrowserStubs() {
  if (!globalThis.localStorage) {
    const store = new Map();
    globalThis.localStorage = {
      getItem(key) { return store.has(String(key)) ? store.get(String(key)) : null; },
      setItem(key, value) { store.set(String(key), String(value)); },
      removeItem(key) { store.delete(String(key)); },
      clear() { store.clear(); }
    };
  }
  globalThis.CustomEvent ||= class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } };
  globalThis.window ||= globalThis;
  globalThis.document ||= {
    documentElement: { dir: 'ltr', lang: 'en', setAttribute() {} },
    body: { setAttribute() {}, appendChild() {} },
    querySelectorAll() { return []; },
    addEventListener() {},
    dispatchEvent() {},
    createElement() { return { style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, remove() {} }; }
  };
}
installBrowserStubs();

const { buildFlagshipNftQaReport } = await import('../../assets/js/utils/nft-flagship-market-preview.js');
const { buildUnifiedAiUpgradeMarketUx } = await import('../../assets/js/utils/ai-upgrade-market-ux.js');
const { scoreLanguageStabilityGate } = await import('../../assets/js/utils/language-stability-gate.js');

test('W95 raw NFT generator reaches final flagship source score', () => {
  const qa = buildFlagshipNftQaReport({ count: 128 });
  assert.equal(qa.launchGate.pass, true);
  assert.deepEqual(qa.qualityPercentiles, { p10: 100, p50: 100, p90: 100 });
  assert.equal(qa.lowQualityRate, 0);
  assert.equal(qa.brokenExportRate, 0);
});

test('W95 AI Upgrade Market autopopulates generated recoverable items for new users', () => {
  const market = buildUnifiedAiUpgradeMarketUx();
  assert.equal(market.newUserPreview.score.total, 100);
  assert.ok(market.rows.length >= 8);
  assert.equal(market.rows.every((row) => row.generatedForNewUser && row.backedUpByNftAssetBackup), true);
});

test('W95 language gate covers all final NFT, lootbox, EONBot, ad, Telegram, and backup copy', () => {
  const language = scoreLanguageStabilityGate();
  assert.equal(language.total, 100);
  assert.equal(language.grade, 'language-top-tier');
  assert.equal(language.completeness.missingTotal, 0);
});
