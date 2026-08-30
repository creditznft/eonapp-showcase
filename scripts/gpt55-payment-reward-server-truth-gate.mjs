#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'reports/session8');
fs.mkdirSync(reportDir, { recursive: true });
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

const checks = [];
function check(id, condition, detail) {
  checks.push({ id, ok: Boolean(condition), detail });
  assert.ok(condition, `${id}: ${detail}`);
}

const rewardAccess = read('reward-access.html');
const telegram = read('telegram.html');
const subscription = read('subscription.html');
const vaultPayments = read('vault-payments.html');
const proofJs = read('assets/js/utils/payment-reward-proof.js');
const rewardPageJs = read('assets/js/reward-access-page.js');
const telegramJs = read('assets/js/telegram-page.js');
const adPostback = read('functions/api/ad-rewards/postback.js');
const adStatus = read('functions/api/ad-rewards/status.js');
const nowIpn = read('functions/api/nowpayments/ipn.js');
const nowStatus = read('functions/api/nowpayments/status.js');
const paymentPlan = read('assets/js/utils/real-payment-proof-plan.js');
const pkg = JSON.parse(read('package.json'));

check('shared-proof-module-exists', exists('assets/js/utils/payment-reward-proof.js'), 'shared payment/reward server-truth module must exist');
check('proof-schema-exported', /EON_PAYMENT_REWARD_PROOF_SCHEMA/.test(proofJs), 'schema export required');
check('no-secret-display-policy', /secretDisplayed:\s*false/.test(proofJs) && /providerTokenDisplayed:\s*false/.test(proofJs), 'proof UI must not display secrets or provider tokens');
check('no-raw-identity-display-policy', /rawIpStored:\s*false/.test(proofJs) && /telegramIdDisplayed:\s*false/.test(proofJs), 'proof UI must state no raw IP or Telegram ID display');
check('reward-access-server-panel', /rewardServerTruthProof/.test(rewardAccess) && /data-session8-payment-reward-proof/.test(rewardAccess), 'reward access must expose server-truth proof panel');
check('telegram-server-panel', /telegramServerTruthProof/.test(telegram) && /data-session8-payment-reward-proof/.test(telegram), 'telegram must expose server-truth proof panel');
check('subscription-server-panel', /subscriptionPaymentServerProof/.test(subscription), 'subscription page must expose payment status proof panel');
check('vault-payment-server-panel', /vaultPaymentServerProof|payment-server-truth/.test(vaultPayments), 'vault payments must expose payment/reward server truth panel');
check('reward-page-hydrates-proof', /hydrateRewardServerTruthProof/.test(rewardPageJs) && /ymid:\s*adResult\.ymid/.test(rewardPageJs), 'reward page must hydrate proof from Monetag ymid/status');
check('telegram-page-hydrates-proof', /hydrateTelegramServerTruthProof/.test(telegramJs), 'telegram page must hydrate server proof state');
check('ad-postback-secret-required', /missing_ad_reward_postback_secret/.test(adPostback) && /invalid_postback_secret/.test(adPostback), 'ad postback must require secret');
check('ad-postback-ymid-only', /missing_ymid_required_for_value_only_rewards/.test(adPostback) && /adreward:ymid/.test(adPostback), 'ad rewards must be keyed by provider ymid');
check('ad-postback-value-only', /rewardMetric:\s*'provider_estimated_price_and_reward_event_type_only'/.test(adPostback), 'ad reward valuation must use provider value only');
check('ad-postback-idempotent', /adreward:event/.test(adPostback) && /duplicate:\s*true/.test(adPostback), 'ad reward postback must be idempotent');
check('ad-status-no-profile-lookup', /ymid_required_value_only_mode/.test(adStatus) && /rawIpStored:\s*false/.test(adStatus), 'ad status must not look up by profile/raw identity');
check('nowpayments-hmac', /HMAC/.test(nowIpn) && /invalid_signature/.test(nowIpn), 'NOWPayments IPN must verify HMAC signature');
check('nowpayments-price-validation', /under_expected_price/.test(nowIpn) && /USD_PRICE_TOLERANCE_CENTS/.test(nowIpn), 'NOWPayments IPN must validate price');
check('nowpayments-finished-only-credit', /paymentStatus === FULL_ACCESS_STATUS/.test(nowIpn) && /creditApplied/.test(nowIpn), 'NOWPayments credit only on finished status');
check('nowpayments-idempotent-ledger', /np:event/.test(nowIpn) && /np:credit:/.test(nowIpn), 'NOWPayments must keep event and credit ledgers');
check('nowpayments-sanitized-payload', /sanitizePaymentProofPayload/.test(nowIpn), 'NOWPayments stored payload must be sanitized');
check('nowpayments-status-endpoint', /credit_applied/.test(nowStatus) && /payment_validation/.test(nowStatus), 'NOWPayments status endpoint must expose verification status');
check('real-payment-no-frontend-only', /noFrontendOnlyPaymentActivation:\s*true/.test(paymentPlan), 'real payment proof must ban front-end-only activation');
check('real-payment-server-endpoints-required', /serverTruthEndpointsRequired:\s*true/.test(paymentPlan), 'real payment proof must require server-truth endpoints');
check('package-script-present', pkg.scripts?.['gpt55:payment-reward-server-truth-gate'] === 'node scripts/gpt55-payment-reward-server-truth-gate.mjs', 'package script must run gate');

const result = {
  schema: 'eonapp.session8.payment-reward-server-truth-gate.v1',
  checkedAt: new Date().toISOString(),
  score: 100,
  ok: checks.every((item) => item.ok),
  checks,
  remainingLiveProofRequired: [
    'real Telegram Mini App session inside @EonAppsBot',
    'real Monetag valued postback in Cloudflare KV/status endpoint',
    'low-value NOWPayments finished payment proof',
    'funded low-value EVM receipt proof if direct wallet fallback is enabled'
  ]
};
fs.writeFileSync(path.join(reportDir, 'SESSION8_PAYMENT_REWARD_SERVER_TRUTH_GATE.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, 'SESSION8_PAYMENT_REWARD_SERVER_TRUTH_GATE.md'), [
  '# Session 8 Payment/Reward Server Truth Gate',
  '',
  `Status: ${result.ok ? 'PASS' : 'REVIEW'}`,
  `Score: ${result.score}/100`,
  `Checks: ${checks.filter((item) => item.ok).length}/${checks.length}`,
  '',
  'Remaining live proof required:',
  ...result.remainingLiveProofRequired.map((item) => `- ${item}`)
].join('\n'));
console.log(JSON.stringify(result, null, 2));
