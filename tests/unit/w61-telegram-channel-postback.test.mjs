import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W61 postback accepts Monetag yes/no paid macro and keeps valued fallback', () => {
  const fn = read('functions/api/ad-rewards/postback.js');
  assert.match(fn, /rewardEventType/);
  assert.match(fn, /'yes'/);
  assert.match(fn, /'valued'/);
  assert.match(fn, /minimal-reward-receipt-ledger/);
  assert.match(fn, /acceptedRewardValues/);
});

test('W61 telegram mini app gates reward links behind channel membership', () => {
  const js = read('assets/js/telegram-page.js');
  assert.match(js, /showChannelGate/);
  assert.match(js, /setRewardLinksEnabled/);
  assert.match(js, /Join @EonApps/);
  assert.match(js, /channelMember/);
});

test('W61 reward-access verifies Telegram channel membership before triggering rewarded ads', () => {
  const js = read('assets/js/reward-access-page.js');
  assert.match(js, /verifyTelegramRewardAccess/);
  assert.match(js, /\/api\/telegram\/session/);
  assert.match(js, /channel-membership-required/);
  assert.match(js, /triggerGatewayActionAd/);
});

test('W61 reward access loads Telegram WebApp bridge for Mini App mode', () => {
  const html = read('reward-access.html');
  assert.match(html, /https:\/\/telegram\.org\/js\/telegram-web-app\.js/);
});
