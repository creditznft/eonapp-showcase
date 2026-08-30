#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { AD_CONFIG_VERSION, AD_GATEWAY_POLICY, AD_NETWORKS, canGrantPaidEntitlementFromCurrentAdCode, hasNetworkCode, isRewardedSdkConfigured } from '../assets/js/ads/config.js';

const ROOT = process.cwd();
const sensitive = ['admin.html', 'billing.html', 'vault.html', 'privacy.html', 'terms.html', 'legal.html', 'support.html'];
const allowedAdPages = ['reward-access.html'];
const disabledNeedles = ['adwixo.com/teg/js', 'quge5.com/88/tag.min.js', 'omg10.com/4/7024916'];
const runtimeMarkerRe = /adwixo|eon-ad-slot|data-ad-slot|rewardGateway|reward-ad-slot|show_11111741|libtl\.com\/sdk\.js|monetag\.com|propellerads|propeller-tracking/i;
const issues = [];
const warnings = [];

for (const page of sensitive) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (runtimeMarkerRe.test(html)) {
    issues.push(`${page} must stay free of ad gateway/runtime markers.`);
  }
}

for (const page of allowedAdPages) {
  const file = path.join(ROOT, page);
  const html = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!html.includes('reward-ad-slot')) issues.push(`${page} must expose scoped rewarded ad slots.`);
  for (const needle of disabledNeedles) {
    if (html.includes(needle)) issues.push(`${page} must not load disabled legacy ad code: ${needle}`);
  }
  if (!/monetag|rewarded/i.test(html)) warnings.push(`${page} should mention rewarded monetization for operator clarity.`);
}

if (AD_CONFIG_VERSION !== 'w60-monetag-rewarded-sdk-live-zone-v1') {
  issues.push(`Unexpected ad config version: ${AD_CONFIG_VERSION}`);
}
if (AD_GATEWAY_POLICY.mode !== 'monetag-rewarded-only-postback-proof') {
  issues.push(`Ad gateway mode must be monetag-rewarded-only-postback-proof, found ${AD_GATEWAY_POLICY.mode}`);
}
if (AD_GATEWAY_POLICY.primaryNetwork !== 'monetag') issues.push('Primary network must be monetag.');
if (AD_GATEWAY_POLICY.fallbackNetwork !== 'monetag') issues.push('Fallback network must also be monetag; no Adwixo/multitag fallback in W58.');
if (AD_NETWORKS.adwixo.enabled !== false) issues.push('Adwixo must stay disabled in W58.');
if (AD_NETWORKS.monetag.enabled !== true) issues.push('Monetag rewarded must be enabled as the only network.');
if (AD_GATEWAY_POLICY.activeFormats.passiveBanners) issues.push('Passive banners must be disabled in rewarded-only mode.');
if (AD_GATEWAY_POLICY.activeFormats.monetagSuperiorFallback) issues.push('Monetag website multitag fallback must be disabled.');
if (AD_GATEWAY_POLICY.activeFormats.monetagDirectLinkFallback) issues.push('Monetag direct-link fallback must be disabled.');
if (AD_GATEWAY_POLICY.requiresRewardedCompletion !== true) issues.push('Rewarded-only mode must require rewarded completion.');
if (AD_GATEWAY_POLICY.requireValuedPostbackForServerEntitlement !== true) issues.push('Account-wide subscription entitlements must require valued postback proof.');
if (hasNetworkCode('adwixo')) issues.push('Adwixo must not report active network code.');
if (canGrantPaidEntitlementFromCurrentAdCode('adwixo')) issues.push('Adwixo must never grant paid entitlements.');

if (!isRewardedSdkConfigured('monetag')) {
  issues.push('Monetag Rewarded SDK values must stay configured in W60: zone 11111741, script https://libtl.com/sdk.js, function show_11111741.');
}
if (isRewardedSdkConfigured('monetag') && !canGrantPaidEntitlementFromCurrentAdCode('monetag')) {
  issues.push('Configured Monetag Rewarded SDK must be paired with postback proof before paid entitlements can be granted.');
}

for (const entry of fs.readdirSync(ROOT)) {
  if (!entry.endsWith('.html') || allowedAdPages.includes(entry)) continue;
  const html = fs.readFileSync(path.join(ROOT, entry), 'utf8');
  for (const needle of disabledNeedles) {
    if (html.includes(needle)) issues.push(`${needle} appears outside disabled config/reference docs in ${entry}`);
  }
}

const report = {
  schema: 'eon.ad-gateway-readiness.v60',
  status: issues.length ? 'FAIL' : 'PASS',
  mode: AD_GATEWAY_POLICY.mode,
  primaryNetwork: AD_GATEWAY_POLICY.primaryNetwork,
  rewardedSdkConfigured: isRewardedSdkConfigured('monetag'),
  networks: Object.fromEntries(Object.keys(AD_NETWORKS).map((id) => [id, {
    enabled: AD_NETWORKS[id].enabled,
    hasActiveCode: hasNetworkCode(id),
    role: AD_NETWORKS[id].role,
    rewardProof: AD_NETWORKS[id].rewardProof,
    paidEntitlementAllowed: canGrantPaidEntitlementFromCurrentAdCode(id)
  }])),
  issues,
  warnings
};

console.log(JSON.stringify(report, null, 2));
if (issues.length) process.exit(1);
