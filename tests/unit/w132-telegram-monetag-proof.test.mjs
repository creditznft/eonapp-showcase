import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
test('W132 proof-state utility models every Telegram + Monetag reward state', async () => {
  const mod = await import(`../../assets/js/utils/reward-proof-state.js?w132=${Date.now()}`);
  assert.equal(mod.W132_REWARD_PROOF_SCHEMA, 'eonapp.w132.telegram-monetag-proof.v1');
  const browser = mod.buildRewardProofState({ inTelegram: false, monetagSdkConfigured: true });
  assert.equal(browser.steps.length, 7);
  assert.equal(browser.steps.find((step) => step.id === 'browser')?.status, 'current');
  assert.equal(browser.steps.find((step) => step.id === 'telegram')?.status, 'blocked');
  const completed = mod.buildRewardProofState({ inTelegram: true, telegramSessionVerified: true, channelMember: true, monetagSdkConfigured: true, monetagSdkReady: true, adStarted: true, postbackPending: false, rewardGranted: true, accountRewardVerified: true });
  assert.equal(completed.steps.every((step) => step.status === 'complete'), true);
  assert.equal(mod.createRewardProofSummary(completed).stateCount, 7);
});
test('W132 Telegram page exposes visible reward proof states', () => {
  const html = read('telegram.html'); const js = read('assets/js/telegram-page.js'); const css = read('assets/css/telegram.css');
  assert.match(html, /data-w132-reward-proof="telegram-miniapp"/);
  assert.match(html, /Browser users, Telegram users, channel members, SDK readiness, postback pending, and reward granted states/);
  assert.match(js, /renderTelegramRewardProof/); assert.match(js, /renderRewardProofPanel/); assert.match(js, /browser-mode/); assert.match(js, /channel-membership-required/); assert.match(css, /tg-reward-proof-state/);
});
test('W132 reward access page exposes production proof states before any credit unlocks', () => {
  const html = read('reward-access.html'); const js = read('assets/js/reward-access-page.js'); const css = read('assets/css/reward-access.css');
  assert.match(html, /data-w132-reward-proof="reward-access"/); assert.match(html, /Production reward proof/); assert.match(js, /renderRewardAccessProof/); assert.match(js, /postbackPending: !valued/); assert.match(js, /accountRewardVerified: valued/); assert.match(js, /No credit was granted/); assert.match(css, /eon-reward-proof-state/);
});
test('W132 Monetag remains rewarded-only and Telegram-gated', () => {
  const config = read('assets/js/ads/config.js'); const reward = read('assets/js/reward-access-page.js'); const telegram = read('assets/js/telegram-page.js');
  assert.match(config, /11111741/); assert.match(config, /monetagRewardedInterstitial:\s*true/); assert.match(config, /monetagDirectLinkFallback:\s*false/); assert.match(reward, /verifyTelegramRewardAccess/); assert.match(reward, /channel-membership-required/); assert.match(read('telegram.html') + telegram, /https:\/\/t\.me\/EonAppsBot\?startapp=rewards/); assert.doesNotMatch(reward + telegram, /window\.location\.href\s*=\s*['"]\/?['"]/);
});
test('W132 quality gate stats report 100 score', () => {
  const statsPath = path.join(root, 'tmp', 'w132-telegram-monetag-proof-stats.json');
  if (!fs.existsSync(statsPath)) {
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w132-telegram-monetag-proof-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, 'eonapp.w132.telegram-monetag-proof.v1'); assert.equal(stats.ok, true); assert.equal(stats.score, 100); assert.equal(stats.monetagZone, '11111741'); assert.ok(stats.remainingProductionProof.length >= 6);
});
