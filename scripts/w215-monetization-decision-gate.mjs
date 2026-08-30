/** W238-safe successor to the W215 no-commercial-activation check. */
import fs from 'node:fs';
import { getMonetizationPublicStatus } from '../assets/js/utils/monetization-decision-gate.js';
import { getAccessMilestonePublicStatus } from '../assets/js/access/access-milestones-registry.js';
import { getSponsoredDiscoveryStatus } from '../config/sponsored-discovery-policy.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const monetization = getMonetizationPublicStatus();
const milestones = getAccessMilestonePublicStatus();
const sponsored = getSponsoredDiscoveryStatus();

assert(monetization.active === false, 'Monetization decision must remain inactive.');
assert(milestones.active === false && milestones.killSwitch.engaged === true, 'Access Milestones must remain disabled.');
assert(sponsored.active === false, 'Sponsored Discovery must remain disabled.');
for (const directory of ['functions/api/rewards', 'functions/api/nowpayments', 'functions/api/evm', 'functions/api/referrals', 'functions/api/ad-rewards', 'functions/api/social', 'functions/api/telegram']) {
  assert(!fs.existsSync(directory), `${directory} must not be present in active Pages Functions while commercial paths are disabled`);
}
for (const file of ['rewards.html', 'telegram.html', 'reward-access.html']) {
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  assert(!/monetag|propeller|libtl|partner\s+offerwall|watch\s+rewarded|earn\s+ad\s+credits/i.test(source), `${file} contains inactive commercial campaign copy or runtime`);
}
const rewardsPage = read('assets/js/access/rewards-status-page.js');
assert(/Rewarded Sponsor Terminal/.test(rewardsPage), 'Rewards status page must expose the RT92 rewarded Sponsor Terminal.');
assert(/qualifying server-validated completion adds exactly 1 Sponsor Key/.test(rewardsPage), 'Rewards status page must describe one server-validated completion as exactly one Sponsor Key.');
assert(/Reward issuance is server-authoritative and duplicate\/replay protected/.test(rewardsPage), 'Rewards status page must preserve server-authoritative replay-protected issuance.');
assert(/fetch\('\/api\/monetization\/rewarded'/.test(rewardsPage), 'Rewards status page must use the same-origin rewarded authority.');
assert(!/localStorage\.setItem|sessionStorage\.setItem|grantSponsorKey|mintSponsorKey|payout|cash reward/i.test(rewardsPage), 'Rewards status page must not mint locally or create payout/cash reward authority.');
const referral = read('assets/js/utils/referral-par.js');
assert(/REFERRAL_REWARDS_ENABLED = false/.test(referral), 'Referral value boundary must remain disabled.');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('W215 monetization decision gate: PASS (legacy campaign/payout rails disabled; RT92 Sponsor Keys remain same-origin server-authoritative)');
