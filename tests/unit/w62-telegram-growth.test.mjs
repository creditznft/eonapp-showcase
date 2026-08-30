import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TELEGRAM_GROWTH_POLICY,
  shouldGateTelegramAction,
  getTelegramDeepLinks,
  getTelegramMemberRewardPlan,
  getTelegramRewardSummary,
  createTelegramGrowthCardHtml
} from '../../assets/js/utils/telegram-growth-rewards.js';

test('W62 Telegram growth policy uses EonApps brand and gates only reward actions', () => {
  assert.equal(TELEGRAM_GROWTH_POLICY.channelUsername, 'EonApps');
  assert.equal(TELEGRAM_GROWTH_POLICY.botUsername, 'EonAppsBot');
  assert.equal(shouldGateTelegramAction('rewarded-ad-credit'), true);
  assert.equal(shouldGateTelegramAction('supporter-pass'), true);
  assert.equal(shouldGateTelegramAction('open-eon-city'), false);
  assert.equal(shouldGateTelegramAction('open-chat'), false);
});

test('W62 Telegram member plan gives daily points only once per day', () => {
  const eligible = getTelegramMemberRewardPlan({ channelMember: true, telegramMemberStreakDays: 2, lastTelegramMemberClaimDay: '1999-01-01' });
  assert.equal(eligible.eligible, true);
  assert.equal(eligible.poolPoints, 2);
  const blocked = getTelegramMemberRewardPlan({ channelMember: true, lastTelegramMemberClaimDay: eligible.today });
  assert.equal(blocked.eligible, false);
  assert.equal(blocked.reason, 'already-claimed-today');
});

test('W62 Telegram deep links and card point to bot channel reward center', () => {
  const links = getTelegramDeepLinks({ startApp: 'rewards' });
  assert.equal(links.channel, 'https://t.me/EonApps');
  assert.match(links.startApp, /EonAppsBot/);
  assert.match(links.reward, /reward-access\.html/);
  const html = createTelegramGrowthCardHtml({ surface: 'onboarding' });
  assert.match(html, /Join @EonApps/);
  assert.match(html, /Open EON Apps Bot/);
});

test('W62 Telegram reward summary keeps subscription targets proof gated', () => {
  const summary = getTelegramRewardSummary({ channelMember: true, verifiedAdCredits: 25 });
  assert.equal(summary.nextSubscriptionTarget.credits, 84);
  assert.equal(summary.nextSubscriptionTarget.requiresPostback, true);
  assert.equal(summary.remainingCredits, 59);
});
