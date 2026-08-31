import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_GUIDE_ROUTES } from '../config/eon-guide-catalog.mjs';
import { EON_BIDVERTISER, EON_INFOLINKS, EON_SMARTLINK_PARTNERS, EON_ZYNTENT } from '../config/rt97-partner-monetization-contract.mjs';
import { EON_SPONSORED_DISCOVERY_PROVIDER, getSponsoredDiscoveryRuntimeConfig } from '../config/rt97-sponsored-discovery-contract.mjs';
import { EON_ORDINARY_DISPLAY_PRODUCT_ENABLED, EON_STANDARD_AD_SLOTS_PER_VIEW } from '../assets/js/monetization/eon-monetization-policy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const adsenseClient = 'ca-pub-6759380023085970';

// RT98 primary voluntary reward product: MyLead Sponsored Missions.
const rewardsHtml = read('rewards.html');
const rewardsJs = read('assets/js/rewards/eon-rewards-page.js');
const rewardPolicy = read('assets/js/rewards/eon-reward-policy.js');
const rewardPostback = read('functions/api/rewards/postback.js');
const rewardProviders = read('functions/api/rewards/_providers.js');
const rewardLedger = read('functions/api/rewards/_ledger.js');
check(rewardsHtml.includes('Reward Center') && rewardsHtml.includes('/assets/js/rewards/eon-rewards-page.js'), 'Reward Center surface is not wired.');
check(/MyLead|Sponsored Mission/i.test(rewardsHtml + rewardsJs), 'Reward Center must identify the current MyLead Sponsored Mission rail.');
check(!/exoclick|Sponsor Terminal|VAST playback/i.test(rewardsHtml), 'Current Reward Center must not present the legacy ExoClick/VAST terminal as the active reward product.');
check(rewardsJs.includes('/api/rewards/launch') && rewardsJs.includes('/api/rewards'), 'Reward Center must use server launch and ledger APIs.');
check(rewardPolicy.includes('browserCanMint: false') && rewardPolicy.includes('providerPostbackRequired: true'), 'Reward policy must preserve server-authoritative minting truth.');
check(rewardPostback.includes('validateMyLeadPostbackSecret') && rewardProviders.includes('EON_REWARD_MYLEAD_POSTBACK_SECRET'), 'MyLead postback secret authority is missing.');
check(rewardLedger.includes('mylead_launch_expired') && rewardLedger.includes('virtual_amount'), 'MyLead ledger must enforce launch expiry and exact virtual amount authority.');
check(exists('migrations/referrals/0006_mylead_reward_center.sql'), 'RT98 referrals migration 0006 is missing.');

// Public editorial ads: AdSense + Infolinks only on reviewed guide inventory.
let guidesWithAdsense = 0;
let guidesWithInfolinks = 0;
for (const guide of EON_GUIDE_ROUTES) {
  const html = read(guide.file);
  if (html.includes(`google-adsense-account\" content=\"${adsenseClient}`) || html.includes(`google-adsense-account" content="${adsenseClient}`)) guidesWithAdsense += 1;
  if (html.includes(`adsbygoogle.js?client=${adsenseClient}`)) guidesWithAdsense += 0; else failures.push(`${guide.file}: AdSense loader missing.`);
  if (html.includes(`var infolinks_pid = ${EON_INFOLINKS.publisherId}`) && html.includes('infolinks_main.js')) guidesWithInfolinks += 1;
}
check(guidesWithAdsense === EON_GUIDE_ROUTES.length, `AdSense ownership metadata expected on ${EON_GUIDE_ROUTES.length} guides; found ${guidesWithAdsense}.`);
check(guidesWithInfolinks === EON_GUIDE_ROUTES.length, `Infolinks expected on ${EON_GUIDE_ROUTES.length} reviewed guides; found ${guidesWithInfolinks}.`);
for (const appFile of ['index.html','chat.html','local-ai.html','vault.html','billing.html','workspace.html','profile.html','rewards.html']) {
  const html = read(appFile);
  check(!html.includes('infolinks_main.js'), `${appFile}: Infolinks must not load on app/private/reward surfaces.`);
}

// Ordinary app display remains intentionally off; legacy VAST is compatibility, not the RT98 reward authority.
check(EON_ORDINARY_DISPLAY_PRODUCT_ENABLED === false && EON_STANDARD_AD_SLOTS_PER_VIEW === 0, 'Ordinary app display ads must remain disabled by product policy.');

// Zyntent is only selected when its explicit server configuration is valid;
// otherwise Sponsored Discovery keeps the existing protected Vexrail fallback.
const zyntentAdapter = read('functions/_shared/eon-zyntent-sponsored-discovery.js');
const discoveryRuntime = read('functions/_shared/eon-sponsored-discovery-runtime.js');
check(EON_ZYNTENT.enabledByDefault === false, 'Zyntent must remain disabled by default before live credential proof.');
check(EON_ZYNTENT.adsSearchPath === '/public_api/v1/ads/search/', 'Zyntent adapter endpoint drifted from the current public test-bench path.');
check(zyntentAdapter.includes('source_id') && zyntentAdapter.includes('ads_limit'), 'Zyntent bounded server payload adapter is incomplete.');
check(EON_SPONSORED_DISCOVERY_PROVIDER === 'vexrail-primary-zyntent-companion' && getSponsoredDiscoveryRuntimeConfig().usesVexrailAuthority === true, 'Sponsored Discovery must preserve primary Vexrail authority.');
check(discoveryRuntime.includes('Promise.all') && discoveryRuntime.includes('fetchZyntentSponsoredDiscovery') && discoveryRuntime.includes('executeVexrailRequest'), 'Sponsored Discovery runtime must execute primary Vexrail and companion Zyntent inventory independently.');

// Backup/experimental rails are present but safe by default.
check(EON_BIDVERTISER.publisherAdsEnabledByDefault === false && EON_BIDVERTISER.automaticRedirectAllowed === false, 'BidVertiser must remain verification/backup only by default.');
for (const [name, partner] of Object.entries(EON_SMARTLINK_PARTNERS)) {
  check(partner.enabledByDefault === false && partner.explicitSponsoredClickOnly === true && partner.automaticKeywordRelinking === false, `${name} SmartLink must remain off/default, explicit-click-only, and never auto-relink.`);
}

// Paid rail remains a separate Dodo hosted-checkout/server-webhook authority.
const billingHtml = read('billing.html');
const checkout = read('functions/api/billing/checkout.js');
const webhook = read('functions/api/billing/webhooks/dodo.js');
check(/data-billing-provider="dodo"/i.test(billingHtml) && /hosted checkout/i.test(billingHtml), 'Billing must declare Dodo hosted checkout.');
check(/dodo/i.test(checkout) && /dodo/i.test(webhook), 'Dodo checkout/webhook server authority files are missing.');

const report = {
  ok: failures.length === 0,
  schema: 'eonapp.rt98.monetization-surface-readiness.v1',
  currentPrimaryRewardRail: 'mylead-sponsored-missions-server-postback',
  publicEditorial: {
    guideCount: EON_GUIDE_ROUTES.length,
    adsense: `code-ready-${guidesWithAdsense}-guides-external-approval-and-serving-required`,
    infolinks: `reviewed-guides-${guidesWithInfolinks}`
  },
  sponsoredDiscovery: {
    currentAuthority: EON_SPONSORED_DISCOVERY_PROVIDER,
    zyntent: 'server-configured-structured-companion-to-primary-vexrail-live-endpoint-proof-required'
  },
  ordinaryAppDisplay: 'disabled-by-product-policy',
  bidvertiser: 'verification-backup-disabled-by-default',
  smartlinks: 'disabled-by-default-explicit-click-only',
  paidRail: 'dodo-hosted-checkout-server-webhook',
  externalProofStillRequired: [
    'MyLead real/test provider postback on protected Preview',
    'Zyntent real API token/source-id endpoint and response contract',
    'AdSense account/site/CMP serving approval',
    'live geography/device/network ad delivery and no-fill behavior'
  ],
  failures
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
