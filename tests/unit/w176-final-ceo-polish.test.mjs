import assert from 'node:assert/strict';
import test from 'node:test';

function createStore() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); }
  };
}

const sponsor = await import('../../assets/js/ads/sponsor-boost.js');
const rules = await import('../../assets/js/ads/sponsor-boost-ceo-rules.js');
const assistant = await import('../../assets/js/chat/eonbot-launch-assistant.js');
const rewards = await import('../../assets/js/rewards/unified-reward-center.js');
const config = await import('../../assets/js/ads/config.js');

test('W176 Sponsor Boost launch contract keeps Monetag Direct Link/MultiTag optional and local-only', () => {
  const contract = rules.validateSponsorBoostLaunchContract({ requireCspHosts: true });
  assert.equal(contract.ok, true, contract.failures.join('\n'));
  assert.equal(contract.disclosure.bullets.some((entry) => /Off by default/i.test(entry)), true);
  assert.equal(contract.cspHosts.scriptSrc.includes('https://quge5.com'), true);
  assert.equal(config.AD_GATEWAY_POLICY.activeFormats.monetagDirectLinkSponsorBoostTapOnly, true);
  assert.equal(config.AD_GATEWAY_POLICY.activeFormats.monetagSuperiorSponsorBoostOptIn, true);
});

test('W176 EONBOT asks before enabling Sponsor Boost and offers clean-app opt-out', () => {
  const storage = createStore();
  const prompt = assistant.buildSponsorBoostOptInConversation({ sponsorOptions: { storage } });
  assert.equal(prompt.shouldAsk, true);
  assert.equal(prompt.approvalRequired, true);
  assert.match(prompt.text, /Want to activate optional Sponsor Boost/i);
  assert.ok(prompt.quickReplies.includes('No, keep app clean'));
  assert.match(prompt.truthNote, /No global auto ads/i);

  sponsor.setSponsorBoostEnabled(true, { storage, now: 1_800_000_000_000, source: 'test' });
  const enabled = assistant.buildSponsorBoostOptInConversation({ sponsorOptions: { storage } });
  assert.equal(enabled.enabled, true);
  assert.match(enabled.text, /already enabled/i);
});

test('W176 EONBOT feature answer index covers rewards, games, voice, operator and payments', () => {
  const index = assistant.buildEonbotFeatureAnswerIndex({ voiceOptions: { capabilities: { speechRecognition: false, getUserMedia: true } } });
  assert.match(index.answers.rewards.summary, /Verified rewarded ads/i);
  assert.match(index.answers.eonCity.summary, /flagship visual/i);
  assert.match(index.answers.voice.summary, /native browser/i);
  assert.equal(index.answers.operator.approvalRequired.includes('enable-sponsor-boost'), true);
  assert.equal(index.answers.payments.liveOnly, true);
});

test('W176 launch assistant routes user questions to actionable safe plans', () => {
  const sponsorGuide = assistant.buildEonbotLaunchAssistantGuide('can I enable multitag and direct link extra earning');
  assert.equal(sponsorGuide.topicId, 'sponsor-boost-opt-in');
  assert.equal(sponsorGuide.approvalRequired, true);
  assert.match(sponsorGuide.truthNote, /No direct-link auto-open/i);

  const gameGuide = assistant.buildEonbotLaunchAssistantGuide('how do I play game on mobile landscape');
  assert.equal(gameGuide.topicId, 'eon-city-gameplay');
  assert.equal(gameGuide.toolCTA.url, '/realmworld.html');
  assert.match(gameGuide.truthNote, /Real device gameplay proof/i);
});

test('W176 Reward Center still refuses account-wide unlock from Sponsor Boost and social paths', () => {
  const direct = rewards.decideRewardUnlock('direct-link-sponsor-boost');
  const multitag = rewards.decideRewardUnlock('multitag-sponsor-boost');
  const social = rewards.decideRewardUnlock('social-mission');
  assert.equal(direct.accountWide, false);
  assert.equal(multitag.accountWide, false);
  assert.equal(social.accountWide, false);
  assert.equal(direct.noPaidEntitlement, true);
});

test('W176 sensitive routes deny Sponsor Boost while game/reward surfaces allow it', () => {
  assert.equal(sponsor.isSponsorBoostAllowedOnRoute('/vault-api-keys.html'), false);
  assert.equal(sponsor.isSponsorBoostAllowedOnRoute('/vault-payments.html'), false);
  assert.equal(sponsor.isSponsorBoostAllowedOnRoute('/campaign-admin.html'), false);
  assert.equal(sponsor.isSponsorBoostAllowedOnRoute('/realmworld.html'), true);
  assert.equal(sponsor.isSponsorBoostAllowedOnRoute('/reward-access.html'), true);
});
