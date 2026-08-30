import fs from 'node:fs';
import assert from 'node:assert/strict';

const requiredFiles = [
  'assets/js/ads/sponsor-boost.js',
  'assets/js/chat/eonbot-command-center.js',
  'assets/js/chat/native-voice-strategy.js',
  'tests/unit/w168-sponsor-boost-eonbot-voice.test.mjs',
  'LAUNCH/GPT55_W168_EONBOT_SPONSOR_BOOST_VOICE_CEO_HANDOVER_2026-06-15.md',
  'LAUNCH/GPT55_W168_CODEX_PROMPT_EONBOT_SPONSOR_BOOST_VOICE_2026-06-15.txt'
];

for (const file of requiredFiles) {
  assert.equal(fs.existsSync(file), true, `${file} missing`);
}

const sponsor = fs.readFileSync('assets/js/ads/sponsor-boost.js', 'utf8');
assert.match(sponsor, /noPaidEntitlement:\s*true/);
assert.match(sponsor, /optInOnly:\s*true/);
assert.match(sponsor, /noAutoOpen:\s*true/);
assert.match(sponsor, /https:\/\/omg10\.com\/4\/7024916/);
assert.match(sponsor, /https:\/\/quge5\.com\/88\/tag\.min\.js/);
assert.match(sponsor, /data-zone/);
assert.match(sponsor, /sensitive-or-denied-route/);

const rewardPage = fs.readFileSync('assets/js/reward-access-page.js', 'utf8');
assert.match(rewardPage, /renderSponsorBoostPanel/);
assert.match(rewardPage, /recordSponsorBoostDirectLinkTap/);
assert.match(rewardPage, /mountSponsorBoostMultiTag/);
assert.match(rewardPage, /Paid\/account-wide rewards still require rewarded postback/);

const guide = fs.readFileSync('assets/js/chat/guide-mode-playbooks.js', 'utf8');
assert.match(guide, /rewards_sponsor_boost/);
assert.match(guide, /eonbot_commander/);
assert.match(guide, /voice_commander/);
assert.match(guide, /eoncity_gameplay_help/);

const intents = fs.readFileSync('assets/js/chat/intents.js', 'utf8');
assert.match(intents, /direct link reward/);
assert.match(intents, /voice without api/);
assert.match(intents, /game windows blocking/);

console.log('W168 EONBOT + Sponsor Boost + Voice gate passed');
