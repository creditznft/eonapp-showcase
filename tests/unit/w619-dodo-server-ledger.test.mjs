import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  W619_DODO_ENV_CONTRACT,
  W619_RUNTIME_FLAGS,
  W619_REFERRAL_RULES,
  decideW619PaidActivation,
  getW619DodoServerLedgerPlan,
  validateW619DodoServerLedgerContract
} from '../../config/w619-dodo-server-ledger-contract.mjs';
import {
  applyVerifiedDodoEventToSnapshot,
  buildReferralGrantDecision,
  buildW619PublicBillingStatus,
  createW619CheckoutPreparationDecision,
  normalizeVerifiedDodoEvent,
  rejectBrowserEntitlementClaim,
  validateW619ServerLedgerModel
} from '../../assets/js/billing/eon-server-entitlement-ledger.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W619 contract validates and keeps all runtime payment/grant flags off', () => {
  const result = validateW619DodoServerLedgerContract();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(Object.values(W619_RUNTIME_FLAGS), Object.values(W619_RUNTIME_FLAGS).map(() => false));
  assert.equal(W619_REFERRAL_RULES.liveNow, false);
  assert.equal(W619_REFERRAL_RULES.retentionDaysBeforePaidMilestone, 14);
  assert.equal(W619_REFERRAL_RULES.maxPaidReferralRewardsPerInviterPerYear, 3);
});

test('W619 public status and checkout preparation fail closed', () => {
  const status = buildW619PublicBillingStatus();
  assert.equal(status.checkoutActive, false);
  assert.equal(status.trialActive, false);
  assert.equal(status.entitlementLedgerWriteEnabled, false);
  assert.equal(status.referralLedgerWriteEnabled, false);
  assert.equal(status.browserUnlockAllowed, false);

  const checkout = createW619CheckoutPreparationDecision({ tierId: 'studio', clientPaymentCallback: true });
  assert.equal(checkout.ok, false);
  assert.equal(checkout.checkoutCreated, false);
  assert.equal(checkout.networkRequestCreated, false);
  assert.equal(checkout.entitlementCreated, false);
  assert.match(checkout.reason, /Client payment callbacks|disabled/i);
});

test('W619 refuses browser-only entitlement and referral grant claims', () => {
  const claim = rejectBrowserEntitlementClaim({ claimedTier: 'max', source: 'localStorage' });
  assert.equal(claim.rejected, true);
  assert.equal(claim.entitlementCreated, false);
  assert.equal(claim.keyGrantCreated, false);
  assert.match(claim.reason, /localStorage|query parameters|server-ledger/i);

  const referral = buildReferralGrantDecision({ browserQueryParamGrant: true, inviteePaid: true, retainedDays: 30, serverLedgerProof: true });
  assert.equal(referral.ok, false);
  assert.equal(referral.grantCreated, false);
  assert.equal(referral.cashOrDiscountCreated, false);
  assert.equal(referral.walletOrCryptoCreated, false);
  assert.equal(referral.browserGrantAccepted, false);
});

test('W619 verified Dodo events normalize only after source verification', () => {
  const missingVerification = normalizeVerifiedDodoEvent({ providerEventId: 'evt_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'plus' });
  assert.equal(missingVerification.ok, false);
  assert.match(missingVerification.errors.join(' '), /verification/i);

  const verified = normalizeVerifiedDodoEvent({ sourceVerified: true, providerEventId: 'evt_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'plus' });
  assert.equal(verified.ok, true, verified.errors.join('\n'));
  assert.equal(verified.provider, 'dodo');
  assert.equal(verified.tierId, 'plus');
});

test('W619 simulated server ledger is idempotent and reversible', () => {
  const first = applyVerifiedDodoEventToSnapshot({}, { sourceVerified: true, providerEventId: 'evt_payment_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'power', providerSubscriptionRef: 'sub_1' });
  assert.equal(first.ok, true, first.errors?.join('\n'));
  assert.equal(first.duplicate, false);
  assert.equal(first.entitlement.status, 'active');
  assert.equal(first.entitlement.tierId, 'power');

  const duplicate = applyVerifiedDodoEventToSnapshot(first.snapshot, { sourceVerified: true, providerEventId: 'evt_payment_1', eventType: 'payment_succeeded', accountId: 'acc_1', tierId: 'power', providerSubscriptionRef: 'sub_1' });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.entitlementChanged, false);

  const refund = applyVerifiedDodoEventToSnapshot(first.snapshot, { sourceVerified: true, providerEventId: 'evt_refund_1', eventType: 'payment_refunded', accountId: 'acc_1', tierId: 'power', providerSubscriptionRef: 'sub_1' });
  assert.equal(refund.ok, true);
  assert.equal(refund.entitlement.status, 'revoked');
  assert.equal(refund.entitlement.tierId, 'free');
});

test('W619 referral decisions enforce retention and yearly cap before EON Key grants', () => {
  const tooEarly = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 13, rewardType: 'builder', serverLedgerProof: true });
  assert.equal(tooEarly.ok, false);
  assert.match(tooEarly.errors.join(' '), /14-day/);

  const capped = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 30, rewardType: 'power', inviterPaidRewardCountThisYear: 3, serverLedgerProof: true });
  assert.equal(capped.ok, false);
  assert.match(capped.errors.join(' '), /cap/);

  const eligibleFuture = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 30, rewardType: 'builder', inviterPaidRewardCountThisYear: 1, serverLedgerProof: true });
  assert.equal(eligibleFuture.ok, true);
  assert.equal(eligibleFuture.grantCreated, false);
  assert.equal(eligibleFuture.rewardStatus, 'eligible-after-future-activation');
});

test('W619 activation decision blocks paid and referral activation without external proof', () => {
  const paid = decideW619PaidActivation({ sourceQaPassed: true, browserProofPassed: true, cloudflareDeployProof: true, enablePaidActivation: true, enableReferralGrants: true });
  assert.equal(paid.decision, 'blocked');
  assert.ok(paid.blockers.some((item) => /Dodo product/.test(item)));
  assert.ok(paid.blockers.some((item) => /checkout/.test(item)));
  assert.ok(paid.blockers.some((item) => /webhook signature/.test(item)));
  assert.ok(paid.blockers.some((item) => /referral ledger/.test(item)));

  const sourceOnly = decideW619PaidActivation({ sourceQaPassed: true, browserProofPassed: true, cloudflareDeployProof: true });
  assert.equal(sourceOnly.decision, 'eligible-for-owner-review');
  assert.ok(sourceOnly.warnings.some((item) => /Paid activation remains off/.test(item)));
});

test('W619 env contract keeps Dodo secrets server-only and surfaces route contracts', () => {
  const plan = getW619DodoServerLedgerPlan();
  assert.ok(W619_DODO_ENV_CONTRACT.forbiddenInFrontend.includes('DODO_API_KEY'));
  assert.ok(W619_DODO_ENV_CONTRACT.forbiddenInFrontend.includes('DODO_WEBHOOK_SECRET'));
  assert.ok(plan.apiSurfaces.some((surface) => surface.route === '/api/billing/status' && surface.live === true));
  assert.ok(plan.apiSurfaces.some((surface) => surface.route === '/api/billing/webhooks/dodo' && surface.live === false));
});

test('W619 source endpoints exist and do not call Dodo network yet', () => {
  const files = [
    'functions/api/billing/status.js',
    'functions/api/billing/checkout.js',
    'functions/api/billing/webhooks/dodo.js',
    'functions/api/billing/referral-status.js',
    'assets/js/billing/eon-server-entitlement-ledger.js'
  ];
  const source = files.map(read).join('\n');
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /checkoutActive:\s*true|trialActive:\s*true|entitlementLedgerWriteEnabled:\s*true|referralLedgerWriteEnabled:\s*true|eonKeyRedemptionActive:\s*true/);
  assert.doesNotMatch(source, /cashback|wallet balance|crypto payout|commission payout|passive income|guaranteed profit/i);
});

test('W619 complete server ledger model validates', () => {
  const result = validateW619ServerLedgerModel();
  assert.equal(result.ok, true, result.errors.join('\n'));
});
