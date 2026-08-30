import assert from 'node:assert/strict';
import test from 'node:test';

function createStore() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); },
    dump() { return Object.fromEntries(map); }
  };
}

const sponsor = await import('../../assets/js/ads/sponsor-boost.js');
const voice = await import('../../assets/js/chat/native-voice-strategy.js');
const commander = await import('../../assets/js/chat/eonbot-command-center.js');

test('W168 Sponsor Boost keeps Direct Link and MultiTag opt-in and local-only', () => {
  const policy = sponsor.getSponsorBoostPolicy();
  assert.equal(policy.optInOnly, true);
  assert.equal(policy.noAutoOpen, true);
  assert.equal(policy.noPaidEntitlement, true);
  assert.equal(policy.coreRewardedPathRemainsPrimary, true);
  assert.equal(policy.directLink.url, 'https://omg10.com/4/7024916');
  assert.equal(policy.multiTag.scriptUrl, 'https://quge5.com/88/tag.min.js');
  assert.equal(policy.multiTag.zone, '246944');
});

test('W168 Direct Link grants capped local soft credit only after user tap', () => {
  const storage = createStore();
  const now = 1_800_000_000_000;
  const first = sponsor.recordSponsorBoostDirectLinkTap({ storage, now, action: 'direct-test' });
  assert.equal(first.ok, true);
  assert.equal(first.noPaidEntitlement, true);
  assert.equal(first.credit, 1);
  assert.match(first.directUrl, /^https:\/\/omg10\.com\/4\/7024916/);

  const second = sponsor.recordSponsorBoostDirectLinkTap({ storage, now: now + 1000, action: 'direct-test' });
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'direct-link-cooldown');
});

test('W168 MultiTag cannot mount until toggle is enabled and never mounts on sensitive routes', () => {
  const storage = createStore();
  const now = 1_800_000_000_000;
  assert.equal(sponsor.canMountSponsorBoostMultiTag({ storage, now, route: '/market.html' }).ok, false);
  sponsor.setSponsorBoostEnabled(true, { storage, now, source: 'test' });
  assert.equal(sponsor.canMountSponsorBoostMultiTag({ storage, now, route: '/market.html' }).ok, true);
  const vault = sponsor.canMountSponsorBoostMultiTag({ storage, now, route: '/vault.html' });
  assert.equal(vault.ok, false);
  assert.equal(vault.reason, 'sensitive-or-denied-route');
});

test('W168 MultiTag soft credit requires dwell and stays local', () => {
  const storage = createStore();
  const now = 1_800_000_000_000;
  sponsor.setSponsorBoostEnabled(true, { storage, now, source: 'test' });
  storage.setItem(sponsor.SPONSOR_BOOST_SESSION_KEY, JSON.stringify({ startedAt: now, route: '/market.html' }));
  const early = sponsor.claimSponsorBoostMultiTagSessionCredit({ storage, now: now + 30_000, route: '/market.html' });
  assert.equal(early.ok, false);
  assert.equal(early.reason, 'multitag-dwell-required');
  const ready = sponsor.claimSponsorBoostMultiTagSessionCredit({ storage, now: now + 181_000, route: '/market.html' });
  assert.equal(ready.ok, true);
  assert.equal(ready.noPaidEntitlement, true);
  assert.equal(ready.credit, 1);
});

test('W168 EONBOT command center routes rewards, EON City and voice safely', () => {
  const rewards = commander.buildEonbotCommandPlan('enable multitag extra earnings');
  assert.equal(rewards.commandId, 'open-sponsor-boost');
  assert.equal(rewards.needsApproval, true);
  assert.match(rewards.truthNote, /account-wide/i);

  const city = commander.buildEonbotCommandPlan('play eon city and rotate city');
  assert.equal(city.commandId, 'open-eon-city');
  assert.equal(city.route, '/realmworld.html');
  assert.equal(city.needsApproval, false);

  const mic = commander.buildEonbotCommandPlan('talk to eonbot with microphone');
  assert.equal(mic.commandId, 'open-chat-voice');
  assert.equal(mic.needsApproval, true);
});

test('W168 native voice strategy is honest about no universal free ASR', () => {
  const chrome = voice.buildNativeVoiceCapabilityPlan({
    userAgent: 'Mozilla/5.0 Chrome/142.0',
    capabilities: { speechRecognition: true, speechSynthesis: true, getUserMedia: true, mediaRecorder: true }
  });
  assert.equal(chrome.recommendedMode, 'native-live-dictation');
  assert.equal(chrome.noUserApiKeyRequiredForCapture, true);

  const telegram = voice.buildNativeVoiceCapabilityPlan({
    userAgent: 'TelegramBot Like Telegram WebView Safari',
    telegramMiniApp: true,
    capabilities: { speechRecognition: false, speechSynthesis: true, getUserMedia: true, mediaRecorder: true }
  });
  assert.equal(telegram.recommendedMode, 'recording-or-typed-fallback');
  assert.match(telegram.truth, /no free universal browser speech recognition/i);
  assert.ok(telegram.warnings.some((entry) => /Telegram Mini App/i.test(entry)));
});
