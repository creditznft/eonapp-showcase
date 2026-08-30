import test from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('W124 Telegram rewards never render as dead buttons in web preview', () => {
  const source = read('assets/js/telegram-page.js');
  assert.match(source, /const BOT_URL = getTelegramDeepLinks\(\{ startApp: 'rewards' \}\)\.startApp/);
  assert.match(source, /data-telegram-state', state\.inTelegram \? 'join-channel-first' : 'open-miniapp-first'/);
  assert.match(source, /link\.setAttribute\('href', BOT_URL\)/);
  assert.match(source, /Open @EonAppsBot in Telegram to earn rewards/);
  assert.match(source, /if \(!state\.inTelegram\) \{\r?\n\s*setStatus\('Opening @EonAppsBot/);
  assert.doesNotMatch(source, /href="#join-channel-first"/);
});

test('W124 reward access explains Telegram and Monetag failure states instead of silently redirecting', () => {
  const source = read('assets/js/reward-access-page.js');
  assert.match(source, /TELEGRAM_REWARD_BOT_URL = 'https:\/\/t\.me\/EonAppsBot\?startapp=rewards'/);
  assert.match(source, /function renderTelegramRewardGuidance/);
  assert.match(source, /missing-telegram-initdata/);
  assert.match(source, /channel-membership-required/);
  assert.match(source, /No ad credit was granted/);
  assert.match(source, /telegram-browser-guidance/);
  assert.match(source, /renderSponsorFallbackIfNeeded/);
});

test('W124 chat gives free daily guide replies and remains scrollable before reward gating', () => {
  const source = read('assets/js/chat-page.js');
  const css = read('assets/css/chat.css');
  const html = read('chat.html');
  assert.match(source, /CHAT_DAILY_FREE_GUIDE_LIMIT = 25/);
  assert.match(source, /getFeatureAccessStatus\('ai_chat_burst'\)/);
  assert.match(source, /Daily free EONBOT guide replies are used for today/);
  assert.match(source, /Your text box stays available/);
  assert.match(source, /id="chat-daily-free-status"/);
  assert.match(css, /body\[data-page-type="chat"\][\s\S]*overflow-y: auto/);
  assert.match(css, /\.chat-free-limit-card/);
  assert.match(html, /overflow-y: auto/);
});

test('W124 EON Workstation opens app pages as full-screen workspaces with working EONBOT rail', () => {
  const source = read('assets/js/eon-workstation-page.js');
  const css = read('assets/css/eon-browser.css');
  const html = read('eon-browser.html');
  assert.match(source, /url: '\/market\.html'/);
  assert.match(source, /url: '\/workbench\.html#device-lab'/);
  assert.match(source, /url: '\/realm-code-preview\.html'/);
  assert.match(source, /full-screen workspace/);
  assert.match(source, /id="ew-app-minimize"/);
  assert.match(source, /id="ew-app-ask"/);
  assert.match(source, /ew-lightweight-rail/);
  assert.match(css, /ew-stage-app/);
  assert.match(css, /height: calc\(100dvh - 4\.9rem\)/);
  assert.match(html, /data-ew-open="\/market\.html"/);
});

test('W124 market avoids blank first load and converts dead seller actions into drawers', () => {
  const source = read('assets/js/market-page.js');
  const css = read('assets/css/market.css');
  assert.match(source, /MARKET_INITIAL_BATCH = 12/);
  assert.match(source, /MARKET_APPEND_BATCH = 6/);
  assert.match(source, /if \(!fullCatalog\.length\)/);
  assert.match(source, /mk-list-form--drawer/);
  assert.match(source, /opens a local listing drawer/);
  assert.match(css, /mk-list-form--drawer/);
  assert.match(css, /mk-items-grid:empty::before/);
});

test('W124 Workbench exposes Build OS before advanced modes', () => {
  const html = read('workbench.html');
  const css = read('assets/css/workbench.css');
  assert.match(html, /id="build-os"/);
  assert.match(html, /Choose one clear work lane/);
  assert.match(html, /Code Showcase/);
  assert.match(html, /Device Lab/);
  assert.match(html, /Ask EONBOT/);
  assert.match(css, /wb-build-os-grid/);
  assert.match(css, /wb-build-os-card/);
});
