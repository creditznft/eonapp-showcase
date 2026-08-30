/**
 * W344 — public truth and commerce-safe copy contract.
 *
 * The local-first product may explain a future possibility, but must not make a
 * present-tense claim about payment, token, rewards, connected accounts,
 * autonomous work, or a hidden model/provider action that does not exist.
 */
export const W344_PUBLIC_TRUTH_SCHEMA = 'eonapp.public-truth.v1';

export const W344_REQUIRED_STATUS_SURFACES = Object.freeze([
  {
    file: 'billing.html',
    required: [/no checkout/i, /no live checkout|no live.*subscription/i]
  },
  {
    file: 'terms.html',
    required: [/local-first/i, /no paid plan|no paid features/i, /no nft mint|no nft sale/i]
  },
  {
    file: 'legal.html',
    required: [/local-first/i, /no payment|does not activate paid/i, /not investment|no financial/i]
  },
  {
    file: 'privacy.html',
    required: [/local-first/i, /no checkout/i, /provider.*explicitly choose|explicitly choose.*provider/i]
  },
  {
    file: 'support.html',
    required: [/self-service guidance only/i, /no checkout/i, /no live payments/i]
  }
]);

export const W344_FLOATING_GUIDE_FILE = 'assets/js/utils/eon-chat-widget.js';

export const W344_FLOATING_GUIDE_FORBIDDEN = Object.freeze([
  /runMissionEngine/,
  /aiRuntime\./,
  /setApiKey\(/,
  /_extractProviderKeyFromText/,
  /secure key capture/i,
  /EON NFTs are earned by/i,
  /Pool Points are earned by/i,
  /claimable EonLite/i,
  /daily Pool Points/i,
  /full creator income loop/i,
  /crypto transfers/i,
  /secure checkout/i,
  /on-chain parcel ownership/i,
  /earn Creator NFTs/i,
  /earn Realm NFT/i,
  /referral-ready hooks/i,
  /EonLite Wallet/i
]);

export const W344_FLOATING_GUIDE_REQUIRED = Object.freeze([
  /local guide only/i,
  /does not accept or store provider keys/i,
  /No execution/i,
  /does not silently switch providers/i,
  /No token, wallet transfer, NFT sale, lootbox reward, EONLite claim, Pool Point conversion, or payout is active/i
]);

export const W344_COMMERCE_STATUS = Object.freeze({
  payments: 'blocked-no-processor-selected',
  nftCommerce: 'blocked-chain-proof-and-legal-review-required',
  token: 'blocked-no-app-integration',
  referrals: 'blocked-no-financial-program',
  ads: 'blocked-private-surfaces-protected'
});
