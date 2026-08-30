import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertNoForbiddenRewardFields,
  buildFeatureUnlockMenu,
  buildLifetimeNftQuote,
  buildNftPassPurchasePolicy,
  buildTemporaryUnlockQuote,
  canClaimTemporaryUnlock,
  canMintLifetimeNftPass,
  sanitizeProviderRewardReceipt
} from '../../assets/js/utils/feature-unlock-economy.js';
import { buildUtilityBundleChecklist, UTILITY_NFT_LIFETIME_UNLOCK_POLICY } from '../../assets/js/utils/nft-utility-catalog.js';

test('W71 temporary feature unlock can be priced at one verified ad/share without granting lifetime access', () => {
  const adQuote = buildTemporaryUnlockQuote('ai_chat_burst', 'ad');
  const socialQuote = buildTemporaryUnlockQuote('ai_chat_burst', 'social');
  assert.equal(adQuote.mode, 'temporary-ad');
  assert.equal(socialQuote.mode, 'temporary-social');
  assert.equal(adQuote.creditsRequired, 1);
  assert.equal(socialQuote.creditsRequired, 1);
  assert.equal(canClaimTemporaryUnlock({ featureId: 'ai_chat_burst', method: 'ad', adCredits: 1 }).ok, true);
  assert.equal(canClaimTemporaryUnlock({ featureId: 'ai_chat_burst', method: 'social', socialCredits: 1 }).ok, true);
});

test('W71 lifetime NFT pass cannot be unlocked by one ad view or one social share', () => {
  const quote = buildLifetimeNftQuote('realm_builder');
  assert.equal(quote.lifetime, true);
  assert.ok(quote.totalCreditsRequired >= 300);
  assert.ok(quote.minVerifiedAdEvents >= 50);
  assert.match(quote.warning, /One ad view or one social share can never/i);
  assert.equal(canMintLifetimeNftPass({ featureId: 'realm_builder', adCredits: 1, verifiedAdEvents: 1 }).ok, false);
  assert.equal(canMintLifetimeNftPass({ featureId: 'realm_builder', socialCredits: 1, verifiedSocialActions: 1 }).ok, false);
});

test('W71 lifetime NFT pass supports accumulated verified ad/social value or direct purchase', () => {
  const eligible = canMintLifetimeNftPass({
    featureId: 'private_workstation',
    adCredits: 350,
    socialCredits: 260,
    verifiedAdEvents: 80,
    verifiedSocialActions: 20
  });
  assert.equal(eligible.ok, true);
  assert.equal(eligible.reason, 'eligible');
  const paid = canMintLifetimeNftPass({ featureId: 'private_workstation', paid: true });
  assert.equal(paid.ok, true);
  assert.equal(paid.paidAccess, true);
});

test('W71 provider reward receipt is value-only and strips identity/location fields', () => {
  const receipt = sanitizeProviderRewardReceipt({
    provider: 'Monetag',
    ymid: 'ym-123',
    reward_event_type: 'rewarded_complete',
    estimated_price: '0.04',
    ip: '192.0.2.1',
    country: 'US',
    userAgent: 'browser',
    telegram_id: '12345',
    session_id: 's1'
  });
  assert.equal(receipt.provider, 'monetag');
  assert.equal(receipt.ymid, 'ym-123');
  assert.equal(receipt.estimatedPrice, 0.04);
  assert.ok(receipt.adCredits >= 4);
  assert.equal(Object.hasOwn(receipt, 'ip'), false);
  assert.equal(Object.hasOwn(receipt, 'country'), false);
  assert.equal(Object.hasOwn(receipt, 'telegram_id'), false);
  assert.equal(Object.hasOwn(receipt, 'session_id'), false);
  assert.equal(assertNoForbiddenRewardFields(receipt).ok, true);
});

test('W71 feature unlock menu offers four fair paths and blocks lifetime shortcut language', () => {
  const menu = buildFeatureUnlockMenu('nft_generator_pro');
  assert.equal(menu.options.length, 4);
  assert.equal(menu.policy.temporaryCanUseSingleAdOrShare, true);
  assert.equal(menu.policy.lifetimeNftRequiresAccumulation, true);
  assert.equal(menu.policy.noPaidSubscriptionFromSocialProofAlone, true);
  const nft = menu.options.find((option) => option.mode === 'lifetime-utility-nft');
  assert.ok(nft.totalCreditsRequired > 300);
});

test('W71 utility NFT catalog carries lifetime policy and disallows single ad/share lifetime unlocks', () => {
  assert.equal(UTILITY_NFT_LIFETIME_UNLOCK_POLICY.oneAdUnlocksLifetime, false);
  assert.equal(UTILITY_NFT_LIFETIME_UNLOCK_POLICY.oneShareUnlocksLifetime, false);
  const checklist = buildUtilityBundleChecklist('builder');
  assert.equal(checklist.lifetimeUnlockPolicy.oneAdUnlocksLifetime, false);
  assert.ok(checklist.lifetimeUnlockPolicy.lifetimeUnlockRequires.includes('accumulated-provider-value-credits'));
  const policy = buildNftPassPurchasePolicy('realm_builder');
  assert.ok(policy.disallowed.includes('single_ad_lifetime_unlock'));
  assert.ok(policy.disallowed.includes('single_share_lifetime_unlock'));
});
