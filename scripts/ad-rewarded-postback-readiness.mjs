#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { AD_GATEWAY_POLICY, AD_NETWORKS } from '../assets/js/ads/config.js';
import { buildMonetagPostbackUrl, getMonetagRewardedConfig, getMonetagRewardedSetupChecklist } from '../assets/js/ads/monetag-rewarded.js';

const root = process.cwd();
const files = [
  'assets/js/ads/config.js',
  'assets/js/ads/monetag-rewarded.js',
  'functions/api/ad-rewards/postback.js',
  'functions/api/ad-rewards/status.js'
];
const missing = files.filter((file) => !fs.existsSync(path.join(root, file)));
const postbackSource = fs.readFileSync(path.join(root, 'functions/api/ad-rewards/postback.js'), 'utf8');
const cfg = getMonetagRewardedConfig();
const checks = {
  requiredFilesPresent: missing.length === 0,
  adRewardsKvConfiguredName: AD_GATEWAY_POLICY.serverKvBinding === 'AD_REWARDS_KV',
  fallbackKvSupported: postbackSource.includes('NOWPAYMENTS_SUBS_KV'),
  getPostbackSupported: postbackSource.includes('onRequestGet'),
  postPostbackSupported: postbackSource.includes('onRequestPost'),
  secretRequired: postbackSource.includes('AD_REWARD_POSTBACK_SECRET'),
  paidRewardValueSupported: postbackSource.includes("'yes'") && postbackSource.includes("'valued'"),
  ymidSupported: postbackSource.includes('ymid'),
  monetagWebsiteTagDisabled: Boolean(AD_NETWORKS.monetag?.disabledLegacyWebsiteCodes?.superiorTag && !AD_NETWORKS.monetag?.scriptUrls),
  monetagRewardedSdkConfigured: cfg.configured
};
const blockers = [];
for (const [key, ok] of Object.entries(checks)) {
  if (!ok && key !== 'monetagRewardedSdkConfigured') blockers.push(key);
}
const report = {
  schema: 'eon.ad-rewarded-postback-readiness.v61',
  status: blockers.length ? 'FAIL' : 'PASS',
  mode: cfg.configured ? 'verified-monetag-rewarded-sdk-ready' : 'monetag-rewarded-only-sdk-not-configured-yet',
  checks,
  blockers,
  monetagRewardedConfig: cfg,
  postbackUrlTemplate: buildMonetagPostbackUrl({ origin: 'https://eonapp.ch' }),
  setupChecklist: getMonetagRewardedSetupChecklist('https://eonapp.ch')
};
console.log(JSON.stringify(report, null, 2));
if (blockers.length) process.exit(1);
