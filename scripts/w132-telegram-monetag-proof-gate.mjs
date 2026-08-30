import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const count = (source, pattern) => (source.match(pattern) || []).length;
const telegramHtml = read('telegram.html');
const rewardHtml = read('reward-access.html');
const telegramJs = read('assets/js/telegram-page.js');
const rewardJs = read('assets/js/reward-access-page.js');
const proofJs = read('assets/js/utils/reward-proof-state.js');
const configJs = read('assets/js/ads/config.js');
const requiredProofTerms = ['Browser mode', 'Telegram Mini App session', 'Channel membership', 'Monetag SDK readiness', 'Postback pending', 'Reward granted'];
const checks = {
  telegramProofPanel: /data-w132-reward-proof="telegram-miniapp"/.test(telegramHtml),
  rewardProofPanel: /data-w132-reward-proof="reward-access"/.test(rewardHtml),
  proofUtilityExists: /W132_REWARD_PROOF_SCHEMA/.test(proofJs) && /buildRewardProofState/.test(proofJs),
  proofTerms: requiredProofTerms.every((term) => proofJs.includes(term) || telegramHtml.includes(term) || rewardHtml.includes(term)),
  telegramRendersProof: /renderTelegramRewardProof/.test(telegramJs) && /renderRewardProofPanel/.test(telegramJs),
  rewardRendersProof: /renderRewardAccessProof/.test(rewardJs) && /renderRewardProofPanel/.test(rewardJs),
  channelGateStillRequired: /channel-membership-required/.test(rewardJs) && /Join @EonApps/.test(telegramJs),
  monetagZone: /11111741/.test(configJs),
  rewardedOnly: /monetagSuperiorFallback:\s*false/.test(configJs) && /monetagDirectLinkFallback:\s*false/.test(configJs),
  postbackPendingVisible: /postbackPending/.test(rewardJs) && /postback/.test(proofJs),
  noSilentHomepageRedirect: !/window\.location\.href\s*=\s*['"]\/?['"]/.test(rewardJs + telegramJs)
};
const proofStepCount = count(proofJs, /step\('/g);
const htmlProofStepCount = count(telegramHtml + rewardHtml, /data-reward-proof-step=/g);
const score = Object.values(checks).every(Boolean) && proofStepCount >= 7 && htmlProofStepCount >= 6 ? 100 : 0;
const stats = { schema: 'eonapp.w132.telegram-monetag-proof.v1', ok: score === 100, score, checks, proofStepCount, htmlProofStepCount, monetagZone: '11111741', remainingProductionProof: ['Deploy to Cloudflare Pages', 'Open https://t.me/EonAppsBot?startapp=rewards inside Telegram', 'Verify /api/telegram/session with real bot secret', 'Watch a real Monetag rewarded ad feed', 'Confirm Cloudflare postback with reward_event_type yes/valued', 'Confirm account-wide credit is granted only after postback proof'] };
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w132-telegram-monetag-proof-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (!stats.ok) { console.error(JSON.stringify(stats, null, 2)); process.exit(1); }
console.log(`W132 Telegram + Monetag proof gate passed: score ${score}`);
