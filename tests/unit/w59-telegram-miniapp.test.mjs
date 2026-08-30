import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W59 telegram mini app shell exists and points to EonApps surfaces', () => {
  const html = read('telegram.html');
  assert.match(html, /EON Apps · Telegram Mini App/);
  assert.match(html, /https:\/\/telegram\.org\/js\/telegram-web-app\.js/);
  assert.match(html, /https:\/\/t\.me\/EonAppsBot\?startapp=rewards/);
  assert.match(html, /https:\/\/t\.me\/EonApps/);
  assert.match(html, /Open full EONAPP in browser/);
  assert.match(html, /Share EONAPP/);
});

test('W59 telegram runtime uses Telegram WebApp API without exposing bot token', () => {
  const js = read('assets/js/telegram-page.js');
  assert.match(js, /window\.Telegram\?\.WebApp/);
  assert.match(js, /\/api\/telegram\/session/);
  assert.match(js, /https:\/\/t\.me\/EonAppsBot/);
  assert.doesNotMatch(js, /\d{6,}:[A-Za-z0-9_-]{20,}/);
});

test('W59 telegram Cloudflare session validates initData and channel membership server-side', () => {
  const fn = read('functions/api/telegram/session.js');
  assert.match(fn, /TELEGRAM_BOT_TOKEN/);
  assert.match(fn, /TELEGRAM_CHANNEL_USERNAME/);
  assert.match(fn, /getChatMember/);
  assert.match(fn, /validateTelegramInitData/);
  assert.match(fn, /WebAppData/);
});
