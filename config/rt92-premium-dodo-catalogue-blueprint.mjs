/**
 * RT92 premium Dodo catalogue blueprint.
 *
 * Owner-approved LIVE boundary (2026-08-17): the three provider catalogue records
 * already exist and their stable LIVE product IDs are the Production checkout
 * authority. EONAPP checkout remains server-created and only verified Dodo
 * webhook lifecycle events may grant or revoke access.
 */

export const RT92_PREMIUM_DODO_CATALOGUE_SCHEMA = 'eonapp.rt92.premium-dodo-catalogue.v1';
export const RT92_PREMIUM_DODO_CATALOGUE_STATUS = 'catalogue-records-live-checkout-enabled';
const freeze = Object.freeze;

const common = freeze({
  brand: 'EonApp',
  taxCategory: 'saas',
  currency: 'USD',
  discountPercent: 0,
  addons: freeze([]),
  dodoCreditsAttached: false,
  dodoEntitlementsAttached: false,
  paymentLinkRequired: false,
  checkoutEnabledInEonapp: true,
  serverWebhookEntitlementAuthority: true
});

export const RT92_PREMIUM_DODO_PRODUCTS = freeze([
  freeze({
    ...common,
    tierId: 'pro',
    productName: 'EONAPP Pro Monthly',
    pricingType: 'subscription',
    priceUsd: 99,
    repeatEvery: freeze({ quantity: 1, unit: 'month' }),
    trialDays: 7,
    subscriptionPeriodFallback: freeze({ quantity: 10, unit: 'year' }),
    description: 'Professional EONAPP for recurring workflows, business intelligence, advanced AI control, Local AI Autopilot, professional project orchestration and advanced Forge. Hosted AI and cloud capacity remain governed by plan limits; Local AI and BYOK remain available.',
    cloudflareProductEnv: 'DODO_PRODUCT_PRO',
    dodoProductId: 'pdt_0NlZKlIoQ2A6bSFNbBwMk',
    catalogueRecordCreated: true,
    metadata: freeze({
      eon_tier_id: 'pro',
      eon_billing_model: 'subscription-capacity',
      eon_catalog: 'rt92-premium-v1',
      eon_checkout_status: 'live-certified'
    })
  }),
  freeze({
    ...common,
    tierId: 'ultra',
    productName: 'EONAPP Ultra Monthly',
    pricingType: 'subscription',
    priceUsd: 199,
    repeatEvery: freeze({ quantity: 1, unit: 'month' }),
    trialDays: 7,
    subscriptionPeriodFallback: freeze({ quantity: 10, unit: 'year' }),
    description: 'EONAPP at professional scale: parallel EONBOT work, multi-client workflows, larger automation capacity, batch operations, advanced AI orchestration and scaled Forge operations. Hosted AI and cloud capacity remain governed by plan limits.',
    cloudflareProductEnv: 'DODO_PRODUCT_ULTRA',
    dodoProductId: 'pdt_0NlZLXhMLMnLeFkxNZMSw',
    catalogueRecordCreated: true,
    metadata: freeze({
      eon_tier_id: 'ultra',
      eon_billing_model: 'subscription-capacity',
      eon_catalog: 'rt92-premium-v1',
      eon_checkout_status: 'live-certified'
    })
  }),
  freeze({
    ...common,
    tierId: 'ultimate',
    productName: 'EONAPP Ultimate',
    pricingType: 'one-time',
    priceUsd: 1299,
    repeatEvery: null,
    trialDays: 0,
    subscriptionPeriodFallback: null,
    description: 'Permanent access to eligible premium EONAPP software capabilities, including advanced professional workflows, Local AI tooling, orchestration, premium Forge and productivity systems. Ultimate does not include unlimited EONAPP-funded hosted AI, cloud compute or recurring hosted capacity; those remain separately governed.',
    cloudflareProductEnv: 'DODO_PRODUCT_ULTIMATE',
    dodoProductId: 'pdt_0NlZMVaq84ItJEM2lPSrZ',
    catalogueRecordCreated: true,
    metadata: freeze({
      eon_tier_id: 'ultimate',
      eon_billing_model: 'perpetual-software',
      eon_catalog: 'rt92-premium-v1',
      eon_hosted_capacity: 'separate',
      eon_checkout_status: 'live-certified'
    })
  })
]);

export function getRt92PremiumDodoProduct(tierId = '') {
  const id = String(tierId || '').trim().toLowerCase();
  return RT92_PREMIUM_DODO_PRODUCTS.find((product) => product.tierId === id) || null;
}

export function validateRt92PremiumDodoCatalogueBlueprint() {
  const errors = [];
  if (RT92_PREMIUM_DODO_PRODUCTS.length !== 3) errors.push('Exactly Pro, Ultra and Ultimate catalogue records are required.');
  const ids = RT92_PREMIUM_DODO_PRODUCTS.map((product) => product.tierId);
  if (JSON.stringify(ids) !== JSON.stringify(['pro', 'ultra', 'ultimate'])) errors.push('Premium catalogue tier order must remain Pro, Ultra, Ultimate.');
  for (const product of RT92_PREMIUM_DODO_PRODUCTS) {
    if (product.brand !== 'EonApp' || product.taxCategory !== 'saas' || product.currency !== 'USD') errors.push(`${product.tierId} Dodo identity drifted.`);
    if (product.discountPercent !== 0 || product.addons.length || product.dodoCreditsAttached || product.dodoEntitlementsAttached) errors.push(`${product.tierId} must not attach discounts, add-ons, Dodo credits or Dodo entitlements.`);
    if (!product.checkoutEnabledInEonapp || product.paymentLinkRequired) errors.push(`${product.tierId} must use EONAPP server checkout and no standalone payment link.`);
    if (!/^DODO_PRODUCT_(PRO|ULTRA|ULTIMATE)$/.test(product.cloudflareProductEnv)) errors.push(`${product.tierId} Cloudflare product variable is invalid.`);
    if (!product.catalogueRecordCreated || !/^pdt_[A-Za-z0-9]+$/.test(product.dodoProductId || '')) errors.push(`${product.tierId} Dodo catalogue record/id is missing.`);
    if (product.metadata.eon_checkout_status !== 'live-certified') errors.push(`${product.tierId} metadata must record certified live checkout.`);
  }
  const pro = getRt92PremiumDodoProduct('pro');
  const ultra = getRt92PremiumDodoProduct('ultra');
  const ultimate = getRt92PremiumDodoProduct('ultimate');
  if (pro?.pricingType !== 'subscription' || pro?.priceUsd !== 99 || pro?.trialDays !== 7) errors.push('Pro Dodo blueprint drifted.');
  if (ultra?.pricingType !== 'subscription' || ultra?.priceUsd !== 199 || ultra?.trialDays !== 7) errors.push('Ultra Dodo blueprint drifted.');
  if (ultimate?.pricingType !== 'one-time' || ultimate?.priceUsd !== 1299 || ultimate?.trialDays !== 0) errors.push('Ultimate Dodo blueprint drifted.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: RT92_PREMIUM_DODO_CATALOGUE_SCHEMA });
}

export default freeze({
  RT92_PREMIUM_DODO_CATALOGUE_SCHEMA,
  RT92_PREMIUM_DODO_CATALOGUE_STATUS,
  RT92_PREMIUM_DODO_PRODUCTS,
  getRt92PremiumDodoProduct,
  validateRt92PremiumDodoCatalogueBlueprint
});
