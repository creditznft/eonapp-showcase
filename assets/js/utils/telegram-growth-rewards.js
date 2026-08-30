const CHANNEL_USERNAME = 'EonApps';
const BOT_USERNAME = 'EonAppsBot';

export const TELEGRAM_GROWTH_POLICY = Object.freeze({
  version: 'w62.telegram-growth.v1',
  channelUsername: CHANNEL_USERNAME,
  botUsername: BOT_USERNAME,
  channelUrl: `https://t.me/${CHANNEL_USERNAME}`,
  botUrl: `https://t.me/${BOT_USERNAME}`,
  miniAppUrl: 'https://eonapp.ch/telegram',
  rewardUrl: 'https://eonapp.ch/reward-access.html?mode=telegram',
  gatedActions: Object.freeze([
    'rewarded-ad-credit',
    'supporter-pass',
    'reward-pool-claim',
    'pool-point-boost',
    'telegram-streak',
    'limited-drop-entry'
  ]),
  openActions: Object.freeze([
    'open-eon-city',
    'open-chat',
    'open-vault',
    'open-tools',
    'open-full-site'
  ]),
  channelPerks: Object.freeze({
    joinBonusPoolPoints: 10,
    dailyMemberPoolPoints: 2,
    weeklyMemberPoolPoints: 20,
    channelStreakBonusEveryDays: 7,
    maxDailyMemberChecks: 1,
    maxDailyRewardedAdsFree: 6,
    maxDailyRewardedAdsSupporter: 10,
    cooldownMinutes: 5
  }),
  subscriptionTargets: Object.freeze([
    { credits: 24, label: '24h Supporter preview', durationHours: 24, requiresPostback: true },
    { credits: 84, label: '7-day Supporter pass', durationHours: 168, requiresPostback: true },
    { credits: 180, label: '30-day Supporter target', durationHours: 720, requiresPostback: true, requiresManualReview: true }
  ]),
  copy: Object.freeze({
    joinTitle: 'Join EonApps to unlock rewards',
    joinBody: 'EON Apps stays open to everyone. Rewarded ads, pool points, streak bonuses, and sponsored Supporter passes require official channel membership.',
    backupBody: 'Telegram can hold a reminder and bot link, but never send raw recovery phrases or unencrypted vault backups to any chat.',
    noSpamBody: 'No sitewide banners, popunders, or forced ads. Users choose rewarded ads when they want credits.'
  })
});

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function safeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

export function shouldGateTelegramAction(action = '') {
  return TELEGRAM_GROWTH_POLICY.gatedActions.includes(String(action || ''));
}

export function getTelegramDeepLinks(params = {}) {
  const startApp = String(params.startApp || params.startapp || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  const botBase = TELEGRAM_GROWTH_POLICY.botUrl;
  return Object.freeze({
    channel: TELEGRAM_GROWTH_POLICY.channelUrl,
    bot: botBase,
    miniApp: TELEGRAM_GROWTH_POLICY.miniAppUrl,
    reward: TELEGRAM_GROWTH_POLICY.rewardUrl,
    startApp: startApp ? `${botBase}?startapp=${encodeURIComponent(startApp)}` : botBase,
    shareChannel: `https://t.me/share/url?url=${encodeURIComponent(TELEGRAM_GROWTH_POLICY.miniAppUrl)}&text=${encodeURIComponent('Open EON Apps in Telegram and earn ad-sponsored Supporter credits.')}`
  });
}

export function getTelegramMemberRewardPlan(profile = {}) {
  const today = dayKey();
  const joined = Boolean(profile.channelMember || profile.isMember);
  const lastClaimDay = String(profile.lastTelegramMemberClaimDay || '');
  const streakDays = safeInt(profile.telegramMemberStreakDays, 0);
  const alreadyClaimedToday = lastClaimDay === today;
  const nextStreak = alreadyClaimedToday ? streakDays : joined ? streakDays + 1 : 0;
  const weeklyBonusDue = joined && !alreadyClaimedToday && nextStreak > 0 && nextStreak % TELEGRAM_GROWTH_POLICY.channelPerks.channelStreakBonusEveryDays === 0;
  const basePoints = joined && !alreadyClaimedToday ? TELEGRAM_GROWTH_POLICY.channelPerks.dailyMemberPoolPoints : 0;
  const weeklyPoints = weeklyBonusDue ? TELEGRAM_GROWTH_POLICY.channelPerks.weeklyMemberPoolPoints : 0;
  return Object.freeze({
    eligible: joined && !alreadyClaimedToday,
    channelMember: joined,
    alreadyClaimedToday,
    nextStreakDays: nextStreak,
    poolPoints: basePoints + weeklyPoints,
    basePoints,
    weeklyPoints,
    weeklyBonusDue,
    today,
    reason: !joined ? 'join-channel-first' : alreadyClaimedToday ? 'already-claimed-today' : 'eligible'
  });
}

export function getTelegramRewardSummary(profile = {}) {
  const plan = getTelegramMemberRewardPlan(profile);
  const adCredits = safeInt(profile.monetagCredits || profile.verifiedAdCredits || profile.credits, 0);
  const nextTarget = TELEGRAM_GROWTH_POLICY.subscriptionTargets.find((target) => adCredits < target.credits) || TELEGRAM_GROWTH_POLICY.subscriptionTargets.at(-1);
  return Object.freeze({
    ...plan,
    verifiedAdCredits: adCredits,
    nextSubscriptionTarget: nextTarget,
    remainingCredits: nextTarget ? Math.max(0, nextTarget.credits - adCredits) : 0,
    channelUrl: TELEGRAM_GROWTH_POLICY.channelUrl,
    rewardUrl: TELEGRAM_GROWTH_POLICY.rewardUrl
  });
}

export function createTelegramGrowthCardHtml(options = {}) {
  const links = getTelegramDeepLinks({ startApp: options.startApp || 'rewards' });
  const title = options.title || 'EON Apps on Telegram';
  const body = options.body || 'Join the official channel, open the Mini App, and earn verified rewarded-ad credits toward Supporter access.';
  const compact = Boolean(options.compact);
  return `
    <section class="eon-telegram-growth-card${compact ? ' is-compact' : ''}" data-telegram-growth-card="${options.surface || 'generic'}">
      <div class="eon-telegram-growth-copy">
        <p class="eon-telegram-growth-kicker">Telegram · EON Apps</p>
        <h2>${title}</h2>
        <p>${body}</p>
        <ul>
          <li>Join @${CHANNEL_USERNAME} for reward events and launch notices.</li>
          <li>Open @${BOT_USERNAME} to use the EON Apps Mini App.</li>
          <li>Earn Supporter credits only from verified Monetag Rewarded postbacks.</li>
        </ul>
      </div>
      <div class="eon-telegram-growth-actions">
        <a class="btn btn-primary" href="${links.startApp}" rel="noopener">Open EON Apps Bot</a>
        <a class="btn btn-outline" href="${links.channel}" rel="noopener">Join @${CHANNEL_USERNAME}</a>
        <a class="btn btn-outline" href="${links.reward}" rel="noopener">Earn rewards</a>
      </div>
    </section>
  `;
}

export default {
  TELEGRAM_GROWTH_POLICY,
  shouldGateTelegramAction,
  getTelegramDeepLinks,
  getTelegramMemberRewardPlan,
  getTelegramRewardSummary,
  createTelegramGrowthCardHtml
};
