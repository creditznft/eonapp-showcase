import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const criticalHtml = [
  'telegram.html',
  'reward-access.html',
  'chat.html',
  'eon-browser.html',
  'market.html',
  'marketplace.html',
  'workbench.html',
  'trade.html',
  'tools.html',
  'support.html',
  'realm.html'
];

test('W127 critical pages do not ship silent dead hrefs', () => {
  for (const file of criticalHtml) {
    const html = read(file);
    assert.doesNotMatch(html, /href=["']#["']/i, `${file} contains href="#"`);
    assert.doesNotMatch(html, /href=["']javascript:/i, `${file} contains javascript: href`);
  }
});

test('W127 Telegram/reward routes have real targets and a share target section', () => {
  const telegram = read('telegram.html');
  const reward = read('reward-access.html');
  assert.match(telegram, /id="eon-share"/);
  assert.match(telegram, /https:\/\/t\.me\/EonAppsBot\?startapp=rewards/);
  assert.match(telegram, /https:\/\/t\.me\/share\/url/);
  assert.match(reward, /id="reward-open-target"[^>]+href="https:\/\/t\.me\/EonAppsBot\?startapp=rewards"/);
  assert.match(reward, /id="reward-open-telegram-bot"[^>]+href="https:\/\/t\.me\/EonAppsBot\?startapp=rewards"/);
});

test('W127 trade is multi-exchange, not Binance-only onboarding', () => {
  const trade = read('trade.html');
  assert.match(trade, /1 · Connect Exchange API/);
  assert.match(trade, /data-w127-exchange-connectors="multi"/);
  assert.match(trade, /Coinbase/);
  assert.match(trade, /Kraken/);
  assert.match(trade, /OKX/);
  assert.doesNotMatch(trade, /1 · Connect Binance API/);
});

test('W127 tools and support are coherent product surfaces', () => {
  const tools = read('tools.html');
  const support = read('support.html');
  assert.match(tools, /EONAPP Operator Tools Router/);
  assert.match(tools, /data-w127-tool-workspace="operator-router"/);
  assert.match(tools, /Open Workstation \/ Build OS/);
  assert.match(support, /EONBOT Support Center/);
  assert.match(support, /href="\/chat\.html\?support=1"/);
});

test('W127 button truth guard and registry are wired into production graph', () => {
  const guard = read('assets/js/utils/button-truth-guard.js');
  const registry = read('assets/js/utils/button-truth-registry.js');
  const shell = read('assets/js/site-shell-bootstrap.js');
  const pkg = JSON.parse(read('package.json'));
  assert.match(guard, /initButtonTruthGuard/);
  assert.match(guard, /dead-link-guarded/);
  assert.match(registry, /W127_CRITICAL_ROUTES/);
  assert.match(registry, /W127_CRITICAL_FLOWS/);
  assert.match(shell, /button-truth-guard/);
  assert.equal(pkg.scripts['qa:w127-button-truth'], 'node scripts/w127-button-truth-gate.mjs && node --test tests/unit/w127-button-truth-gate.test.mjs');
  assert.match(pkg.scripts['qa:w121-w127-visual-overhaul'], /qa:w127-button-truth/);
});

test('W127 preserves W124-W126 live repair invariants', () => {
  const market = read('market.html');
  const chat = read('assets/js/chat-page.js');
  const browserCss = read('assets/css/eon-browser.css');
  assert.match(market, /data-w126-market-fallback="starter-nft"/);
  assert.doesNotMatch(market, /Your personal Market is preparing EON City starter NFTs/);
  assert.match(chat, /100/);
  assert.match(chat, /free guide replies/);
  assert.match(browserCss, /W126 grand-audit repair: any internal app must open as a large work surface/);
  assert.match(browserCss, /ew-stage-app \.ew-app-frame/);
});
