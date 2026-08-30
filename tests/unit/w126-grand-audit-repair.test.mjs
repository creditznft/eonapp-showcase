import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W126 market has visible pre-hydration starter cards instead of blank/loading-only catalog', () => {
  const html = read('market.html');
  const css = read('assets/css/market.css');
  assert.match(html, /data-w126-market-fallback="starter-nft"/);
  assert.match(html, /data-w126-market-fallback="genesis"/);
  assert.match(html, /data-w126-market-fallback="template"/);
  assert.match(html, /Citizen Sigil Starter NFT/);
  assert.doesNotMatch(html, /Your personal Market is preparing EON City starter NFTs/);
  assert.match(css, /W126 grand-audit repair: visible pre-hydration Market cards/);
});

test('W126 Telegram and reward fallback controls never default to dead local or # links', () => {
  const rewardHtml = read('reward-access.html');
  const telegramHtml = read('telegram.html');
  assert.match(rewardHtml, /id="reward-open-target"[^>]+href="https:\/\/t\.me\/EonAppsBot\?startapp=rewards"/);
  assert.match(rewardHtml, /id="reward-open-telegram-bot"[^>]+href="https:\/\/t\.me\/EonAppsBot\?startapp=rewards"/);
  assert.doesNotMatch(rewardHtml, /id="reward-open-target"[^>]+href="#"/);
  assert.match(telegramHtml, /href="https:\/\/t\.me\/EonAppsBot\?startapp=rewards"[^>]+data-telegram-route="reward"/);
  assert.match(telegramHtml, /Open EON Apps Bot/);
});

test('W126 chat and workstation force usable scroll/full-size app surfaces', () => {
  const chatCss = read('assets/css/chat.css');
  const browserCss = read('assets/css/eon-browser.css');
  assert.match(chatCss, /W126 grand-audit repair: chat must always scroll/);
  assert.match(chatCss, /overflow-y: auto !important/);
  assert.match(chatCss, /#chat-messages[\s\S]*overflow-y: auto !important/);
  assert.match(browserCss, /W126 grand-audit repair: any internal app must open as a large work surface/);
  assert.match(browserCss, /#browser-frame-host[\s\S]*height: min\(760px, calc\(100dvh - 14rem\)\)/);
});

test('W126 in-world code preview executes sandboxed demo JS so Activate-style samples work', () => {
  const preview = read('assets/js/realm3d/realm-code-preview.js');
  assert.match(preview, /scriptEl = document\.createElement\('script'\)/);
  assert.match(preview, /jsExecuted = true/);
  assert.doesNotMatch(preview, /JavaScript preview execution is disabled/);
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  assert.match(panels, /id="pulse">Activate<\/button>/);
  assert.match(panels, /Workstation active/);
});

test('W126 public EON City copy removes developer photo-mode wording', () => {
  const cityMap = read('assets/js/realm3d/engine/EonCityMap.js');
  const runtime = read('assets/js/realm3d/engine/EonCityW125GameExperienceRuntime.js');
  assert.doesNotMatch(cityMap, /Photo Mode|Photo Pad/);
  assert.match(cityMap, /Capture View|Capture Pad/);
  assert.doesNotMatch(runtime, /clean launch screenshots/);
  assert.match(runtime, /clean launch captures/);
});

test('W126 npm aggregate script exists for final gate', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['qa:w126-grand-audit-repair'], 'node --test tests/unit/w126-grand-audit-repair.test.mjs');
  assert.match(pkg.scripts['qa:w121-w126-visual-overhaul'], /qa:w126-grand-audit-repair/);
});
