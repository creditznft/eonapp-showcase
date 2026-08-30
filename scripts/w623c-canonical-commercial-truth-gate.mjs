#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CREATOR_EXECUTION_BOUNDARY,
  EON_KEYS_REFERRAL_POLICY,
  EON_PAID_SUBSCRIPTION_PLANS,
  EON_PURCHASABLE_PLANS,
  validateEonCommercialCatalog
} from '../assets/js/commerce/eon-commercial-catalog.js';
import { EON_KEY_UNLOCK_MENU, EON_REFERRAL_REWARD_MATRIX, validateEonKeysCatalog } from '../assets/js/referrals/eon-keys-catalog.js';
import { validateLockedFeatureResolver } from '../assets/js/referrals/eon-feature-unlock-resolver.js';
import { validateW621LiveDodoRolloutContract } from '../config/w621-live-dodo-cloudflare-rollout-contract.mjs';
import { INFORMATIONAL_ROUTES } from '../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW623cCanonicalCommercialTruth() {
  const errors = [];
  const catalog = validateEonCommercialCatalog();
  const keys = validateEonKeysCatalog();
  const resolver = validateLockedFeatureResolver();
  const dodo = validateW621LiveDodoRolloutContract();
  if (!catalog.ok) errors.push(...catalog.errors);
  if (!keys.ok) errors.push(...keys.errors);
  if (!resolver.ok) errors.push(...resolver.errors);
  if (!dodo.ok) errors.push(...dodo.errors);

  const expected = Object.freeze({ plus: 4.99, studio: 14.99, power: 29.99, max: 49.99, pro: 99, ultra: 199 });
  for (const plan of EON_PAID_SUBSCRIPTION_PLANS) {
    if (plan.monthlyUsd !== expected[plan.id]) errors.push(`${plan.id} canonical price drifted.`);
    if (plan.trialDays !== 7) errors.push(`${plan.id} trial must remain seven days.`);
  }
  const ultimate = EON_PURCHASABLE_PLANS.find((plan) => plan.id === 'ultimate');
  if (!ultimate || ultimate.billingType !== 'one-time' || ultimate.oneTimeUsd !== 1299 || ultimate.trialDays !== 0) errors.push('Ultimate canonical one-time purchase truth drifted.');

  if (EON_KEYS_REFERRAL_POLICY.subscriptionDiscounts || EON_KEYS_REFERRAL_POLICY.subscriptionRenewalCredits || EON_KEYS_REFERRAL_POLICY.freeSubscriptionTiers || EON_KEYS_REFERRAL_POLICY.wholeTierEntitlements) errors.push('EONKEYS policy creates a forbidden subscription reward.');
  if (EON_KEY_UNLOCK_MENU.some((unlock) => unlock.category === 'feature-pass')) errors.push('EONKEYS unlock menu still contains a whole-tier feature pass.');
  const inviterRewards = EON_REFERRAL_REWARD_MATRIX.flatMap((row) => row.inviterReward || []).join(' ');
  if (/subscription discount|renewal credit|free month|free subscription|whole plan|whole tier/i.test(inviterRewards)) errors.push('Referral inviter rewards contain a subscription-equivalent reward.');
  if (EON_CREATOR_EXECUTION_BOUNDARY.cloudflareGenerationBackend || EON_CREATOR_EXECUTION_BOUNDARY.platformHostedImageOrVideoGeneration || EON_CREATOR_EXECUTION_BOUNDARY.promptProxyThroughEonapp) errors.push('Creator boundary incorrectly enables an EONAPP/Cloudflare generation backend.');

  const billing = read('billing.html');
  const billingRenderer = read('assets/js/commerce/billing-commercial-status.js');
  const support = read('help.html');
  const legal = read('legal.html');
  const terms = read('terms.html');
  const privacy = read('privacy.html');
  const keysPage = read('eon-keys.html');
  const customerTruth = `${billing}\n${support}\n${legal}\n${terms}\n${privacy}`;
  const stale = /Dodo Payments review is in progress|approval-pending billing|No checkout[^.]{0,100}active in this release|no paid plan, checkout|no subscription service[^.]{0,80}active/i;
  if (stale.test(customerTruth)) errors.push('A customer-facing policy surface still claims subscriptions are inactive.');
  for (const marker of ['Dodo Payments', 'seven-day trial', 'EONKEYS', 'server-verified']) if (!customerTruth.includes(marker)) errors.push(`Customer truth surfaces are missing ${marker}.`);
  if (!billing.includes('data-monetization="subscription"') || !billing.includes('data-checkout-authority="server-only"')) errors.push('Billing page does not declare the live server-authoritative subscription boundary.');
  if (!billingRenderer.includes("'/api/billing/status'") || !billingRenderer.includes("'/api/billing/checkout'") || !billingRenderer.includes('dodopayments.com') || !billingRenderer.includes('safeProviderUrl')) errors.push('Billing renderer does not use the required status, checkout and Dodo destination allowlist controls.');
  if (!keysPage.includes('data-commercial-active="true"') || !keysPage.includes('data-key-redemption-active="server-rollout"')) errors.push('EONKEYS page must distinguish live subscriptions from server-rollout-controlled key redemption.');
  const billingRoute = INFORMATIONAL_ROUTES.find((route) => route.id === 'billing');
  if (billingRoute?.lifecycle !== 'live-sensitive') errors.push('Billing route is not classified as live-sensitive.');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    schema: 'eonapp.qa.canonical-commercial-truth.w623c.v1',
    checks: 64,
    paidPlans: EON_PAID_SUBSCRIPTION_PLANS.map((plan) => Object.freeze({ id: plan.id, monthlyUsd: plan.monthlyUsd, trialDays: plan.trialDays })),
    purchasablePlans: EON_PURCHASABLE_PLANS.map((plan) => Object.freeze({ id: plan.id, billingType: plan.billingType, monthlyUsd: plan.monthlyUsd ?? null, oneTimeUsd: plan.oneTimeUsd ?? null, trialDays: plan.trialDays })),
    referralArchitecture: EON_KEYS_REFERRAL_POLICY.unlockScope,
    creatorExecution: 'local-or-user-owned-provider-key-only'
  });
}

const report = inspectW623cCanonicalCommercialTruth();
if (!report.ok) {
  console.error(`[W623C] Canonical commercial truth gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W623C] Canonical commercial truth gate passed (${report.checks}/64).`);
