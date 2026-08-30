const DEFAULT_COPY = Object.freeze({
  browser: { title: 'Browser mode', detail: 'Normal browser users can open EONAPP, but verified ad rewards must start inside @EonAppsBot.' },
  telegram: { title: 'Telegram Mini App session', detail: 'Telegram must provide signed Mini App initData before reward actions can continue.' },
  channel: { title: 'Channel membership', detail: '@EonApps membership is checked before Monetag rewarded ads can grant credits.' },
  monetag: { title: 'Monetag SDK readiness', detail: 'Rewarded SDK zone 11111741 must be loaded only after the user taps the reward button.' },
  ad: { title: 'Rewarded ad action', detail: 'The user watches a rewarded interstitial/popup; no banners or hidden sitewide ads are used.' },
  postback: { title: 'Postback pending', detail: 'Cloudflare waits for a paid yes/valued Monetag postback before account-wide credit is trusted.' },
  granted: { title: 'Reward granted', detail: 'Local temporary access can unlock after callback; server/account credits require postback proof.' }
});
export const W132_REWARD_PROOF_SCHEMA = 'eonapp.w132.telegram-monetag-proof.v1';
function bool(value) { return Boolean(value); }
function step(id, status, extra = {}) { const copy = DEFAULT_COPY[id] || { title: id, detail: '' }; return Object.freeze({ id, title: copy.title, detail: copy.detail, status, ...extra }); }
export function buildRewardProofState(context = {}) {
  const inTelegram = bool(context.inTelegram);
  const telegramSessionVerified = bool(context.telegramSessionVerified || context.verified);
  const channelMember = bool(context.channelMember);
  const monetagSdkConfigured = context.monetagSdkConfigured !== false;
  const monetagSdkReady = bool(context.monetagSdkReady || context.sdkReady);
  const adStarted = bool(context.adStarted || context.adAttempted);
  const postbackPending = bool(context.postbackPending);
  const rewardGranted = bool(context.rewardGranted);
  const accountRewardVerified = bool(context.accountRewardVerified || context.postbackVerified);
  const blockedReason = String(context.blockedReason || context.reason || '').trim();
  const steps = [
    step('browser', inTelegram ? 'complete' : 'current', { action: inTelegram ? 'Mini App mode detected.' : 'Open @EonAppsBot to enter verified reward mode.' }),
    step('telegram', inTelegram ? (telegramSessionVerified ? 'complete' : 'current') : 'blocked', { action: telegramSessionVerified ? 'Signed Telegram session verified.' : 'Waiting for Telegram initData + Cloudflare session check.' }),
    step('channel', telegramSessionVerified ? (channelMember ? 'complete' : 'current') : 'blocked', { action: channelMember ? '@EonApps membership verified.' : 'Join @EonApps, then verify again.' }),
    step('monetag', channelMember ? (monetagSdkReady ? 'complete' : (monetagSdkConfigured ? 'current' : 'blocked')) : 'blocked', { action: monetagSdkConfigured ? 'Zone 11111741 configured; load only on reward action.' : 'Monetag Rewarded SDK is not configured.' }),
    step('ad', monetagSdkReady ? (adStarted ? 'complete' : 'current') : 'blocked', { action: adStarted ? 'Rewarded ad callback returned.' : 'Tap reward button to start SDK.' }),
    step('postback', adStarted ? (accountRewardVerified ? 'complete' : (postbackPending ? 'current' : 'pending')) : 'blocked', { action: accountRewardVerified ? 'Server postback verified.' : 'Waiting for Monetag yes/valued postback.' }),
    step('granted', accountRewardVerified || rewardGranted ? 'complete' : (adStarted ? 'pending' : 'blocked'), { action: accountRewardVerified ? 'Account-wide reward trusted.' : rewardGranted ? 'Local temporary reward granted while server postback verifies.' : 'No reward is granted yet.' })
  ];
  const score = steps.reduce((sum, item) => sum + (item.status === 'complete' ? 2 : item.status === 'current' ? 1 : 0), 0);
  return Object.freeze({ schema: W132_REWARD_PROOF_SCHEMA, ok: steps.every((item) => ['complete', 'current', 'pending', 'blocked'].includes(item.status)), inTelegram, telegramSessionVerified, channelMember, monetagSdkConfigured, monetagSdkReady, postbackPending, rewardGranted, accountRewardVerified, blockedReason, score, steps });
}
function esc(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char)); }
export function renderRewardProofPanel(target, context = {}) {
  const root = typeof target === 'string' ? document.querySelector(target) : target;
  if (!root) return buildRewardProofState(context);
  const state = buildRewardProofState(context);
  root.classList.add('eon-reward-proof-state');
  root.setAttribute('data-w132-reward-proof', context.surface || root.getAttribute('data-w132-reward-proof') || 'reward-proof');
  root.setAttribute('data-reward-proof-schema', state.schema);
  root.innerHTML = `\n    <div class="eon-reward-proof-head"><span class="eon-reward-proof-kicker">Telegram + Monetag proof</span><h2>${esc(context.title || 'Reward state proof')}</h2><p>${esc(context.description || 'Every reward button explains the current state before any ad can run or credit can unlock.')}</p></div>\n    <ol class="eon-reward-proof-steps">${state.steps.map((item) => `<li class="is-${esc(item.status)}" data-reward-proof-step="${esc(item.id)}" data-proof-status="${esc(item.status)}"><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span><em>${esc(item.action || '')}</em></li>`).join('')}</ol>\n    ${state.blockedReason ? `<p class="eon-reward-proof-reason">Current block: ${esc(state.blockedReason)}</p>` : ''}`;
  return state;
}
export function createRewardProofSummary(context = {}) { const state = buildRewardProofState(context); return Object.freeze({ schema: state.schema, stateCount: state.steps.length, completeCount: state.steps.filter((item) => item.status === 'complete').length, currentCount: state.steps.filter((item) => item.status === 'current').length, blockedCount: state.steps.filter((item) => item.status === 'blocked').length, hasPostbackPendingState: state.steps.some((item) => item.id === 'postback'), hasRewardGrantedState: state.steps.some((item) => item.id === 'granted'), ok: state.ok }); }
export default { buildRewardProofState, renderRewardProofPanel, createRewardProofSummary };
