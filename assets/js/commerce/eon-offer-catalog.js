import { EON_AI_COST_BOUNDARY, EON_SUBSCRIPTION_TIERS, EON_LOCKED_FEATURE_UNLOCK_COPY } from '../referrals/eon-keys-catalog.js';
/**
 * W348-A — product direction catalog for a future card/UPI business.
 *
 * It is intentionally descriptive only. This is not a checkout, price list,
 * subscription, offer acceptance, payment request, entitlement service, user
 * account system, wallet flow, referral program, or sales launch.
 */

export const EON_OFFER_CATALOG_SCHEMA = 'eon.offer-catalog.v1';
export const EON_OFFER_CATALOG_VERSION = 1;

export const EON_OFFER_CATALOG_FEATURE_FLAGS = Object.freeze({
  publicPricingActive: false,
  checkoutActive: false,
  cardsOrUpiActive: false,
  cryptoCheckoutActive: false,
  subscriptionActive: false,
  oneTimePackSalesActive: false,
  paymentProviderActive: false,
  billingAccountActive: false,
  processorWebhookActive: false,
  serverReceiptAuthorityActive: false,
  licenseActivationActive: false,
  referralDiscountActive: false,
  referralCashOrCryptoActive: false,
  nftFeatureKeyActive: false,
  eonLiteActive: false,
  userMarketplaceActive: false,
  payoutActive: false
});

const OFFERS = Object.freeze([
  Object.freeze({
    id: 'eon-free-local',
    lifecycle: 'active-local',
    label: 'EON Free',
    type: 'local-core',
    availability: 'available without payment',
    summary: 'Local EONBOT planning, Workspace drafts, Creator Suite briefs, My Realm, and free Local Relics remain device-first. A chosen AI provider may have its own separate terms or usage cost.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: false
  }),
  Object.freeze({
    id: 'creator-outcome-kit-previews',
    lifecycle: 'active-local',
    label: 'Creator Outcome Kit previews',
    type: 'free-local-starting-brief',
    availability: 'available without payment',
    summary: 'Five local starting briefs for campaign, brand, build, creator export, and Realm style work are available in Workspace. They are editable previews only; no purchase, provider call, generation, licence, membership, referral value, or feature entitlement is created.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: false
  }),
  Object.freeze({
    id: 'eon-studio-membership',
    lifecycle: 'planned',
    label: 'EON Studio Membership',
    type: 'recurring-personal-license',
    availability: 'not offered or priced yet',
    summary: 'A future optional membership may package official premium workflow kits, recovery tooling, and City personalization after payment, cancellation, refund, licence, privacy, and support evidence are complete.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: true
  }),
  Object.freeze({
    id: 'creator-outcome-kits',
    lifecycle: 'planned',
    label: 'Creator Outcome Kits',
    type: 'one-time-personal-license',
    availability: 'not offered or priced yet',
    summary: 'Future official campaign, brand, build, and export kits may be sold as personal-use licences after verified hosted checkout and signed licence delivery exist. They are not user-resellable assets.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: true
  }),
  Object.freeze({
    id: 'realm-style-packs',
    lifecycle: 'planned',
    label: 'Realm Style Packs',
    type: 'one-time-personal-license',
    availability: 'not offered or priced yet',
    summary: 'Future official City themes, visual packs, and optional creator cosmetics may use ordinary personal licences. A Local Relic remains free and is never the payment key.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: true
  }),
  Object.freeze({
    id: 'eon-five-tier-subscriptions',
    lifecycle: 'planned-dodo-test-mode-first',
    label: 'Plus / Studio / Power / Max',
    type: 'recurring-personal-license',
    availability: 'planned; no checkout active',
    summary: `Future Dodo subscriptions map to ${EON_SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free').map((tier) => tier.label).join(', ')}. These tiers unlock EONAPP capability, limits, workflows, templates, automations, Vault Relics and City cosmetics.`,
    transferable: false,
    tokenOrNft: false,
    requiresPayment: true
  }),
  Object.freeze({
    id: 'eon-keys-feature-unlocks',
    lifecycle: 'planned-source-contract',
    label: 'EON Keys feature unlocks',
    type: 'non-cash-referral-feature-unlock',
    availability: 'planned; no live key grants active',
    summary: `Future EON Keys let users unlock selected premium features without paying: ${EON_LOCKED_FEATURE_UNLOCK_COPY.generic} ${EON_AI_COST_BOUNDARY.statement}`,
    transferable: false,
    tokenOrNft: false,
    requiresPayment: false
  }),
  Object.freeze({
    id: 'realm-share-relics',
    lifecycle: 'active-local',
    label: 'Realm Share Relics',
    type: 'free-local-cosmetic',
    availability: 'available without payment',
    summary: 'Signal and Welcome Relics are local cosmetic records. They are not NFTs, paid unlocks, referral conversion evidence, subscription time, wallets, tokens, sale items, or financial rewards.',
    transferable: false,
    tokenOrNft: false,
    requiresPayment: false
  })
]);

function getOffer(id = '') {
  return OFFERS.find((offer) => offer.id === String(id || '').trim()) || null;
}

export function getEonOfferCatalog() {
  return Object.freeze({
    schema: EON_OFFER_CATALOG_SCHEMA,
    version: EON_OFFER_CATALOG_VERSION,
    lifecycle: 'planning-with-active-free-local-core',
    flags: EON_OFFER_CATALOG_FEATURE_FLAGS,
    offers: OFFERS,
    paymentBoundary: Object.freeze({
      currentStatus: 'No checkout, payment provider, subscription activation, receipt, licence, refund, renewal, or EON Key grant is active.',
      futureRequirement: 'Hosted processor checkout plus server-side webhook evidence are required before charging users; EON Keys require a separate server-side referral ledger before grants are live.',
      excludedData: Object.freeze(['chat text', 'prompts', 'project content', 'asset content', 'provider keys', 'wallet secrets', 'private Realm state', 'card data'])
    }),
    referralBoundary: Object.freeze({
      currentStatus: 'Realm Share Relics are free local cosmetics only. EON Keys are planned feature unlocks only; no referral conversion, discount, cash, crypto, points, commission, payout, or live key grant is active.',
      futureConstraint: 'A future one-level referral system may grant non-cash EON Keys for activated users and verified Dodo events. It must unlock app features only, never cash, crypto, wallet balance, EONLite, transfer, resale, or multi-level payout.'
    })
  });
}

export function getEonOfferCatalogEntry(id = '') {
  return getOffer(id);
}

export function getEonOfferCatalogPublicSummary() {
  const catalog = getEonOfferCatalog();
  return Object.freeze({
    schema: catalog.schema,
    active: false,
    offers: catalog.offers.map((offer) => Object.freeze({ id: offer.id, lifecycle: offer.lifecycle, label: offer.label, summary: offer.summary })),
    message: 'EONAPP has a local free core. Plus, Studio, Power, Max and EON Keys are historical source-planned entries only; no price, checkout, payment provider, subscription activation, live key grant, token, NFT feature key, marketplace, or payout is active in this W348 planning contract. Current commercial truth is owned by the RT92 Billing catalogue.'
  });
}

export function validateEonOfferCatalog() {
  const catalog = getEonOfferCatalog();
  const errors = [];
  if (Object.values(catalog.flags).some(Boolean)) errors.push('A future product or payment flag was enabled without a separate commerce go decision.');
  if (catalog.offers.some((offer) => offer.transferable || offer.tokenOrNft)) errors.push('Official product direction must not make transferable, token, or NFT feature keys.');
  if (!catalog.offers.some((offer) => offer.id === 'eon-free-local' && offer.lifecycle === 'active-local')) errors.push('The free local core must remain explicit.');
  if (!catalog.offers.some((offer) => offer.id === 'realm-share-relics' && offer.lifecycle === 'active-local' && offer.requiresPayment === false)) errors.push('Realm Share Relics must stay free local cosmetics.');
  if (!catalog.offers.some((offer) => offer.id === 'creator-outcome-kit-previews' && offer.lifecycle === 'active-local' && offer.requiresPayment === false && offer.tokenOrNft === false)) errors.push('Creator Outcome Kit previews must stay free local starting briefs.');
  return Object.freeze({ ok: errors.length === 0, errors, schema: EON_OFFER_CATALOG_SCHEMA });
}

export default Object.freeze({
  EON_OFFER_CATALOG_SCHEMA,
  EON_OFFER_CATALOG_VERSION,
  EON_OFFER_CATALOG_FEATURE_FLAGS,
  getEonOfferCatalog,
  getEonOfferCatalogEntry,
  getEonOfferCatalogPublicSummary,
  validateEonOfferCatalog
});
