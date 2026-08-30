/**
 * RT92 premium Cloudflare catalogue registration contract.
 *
 * The owner has created the three LIVE Dodo catalogue records. Product IDs
 * are non-secret identifiers and may be present in Production plain vars.
 * Production checkout is enabled only through the certified live release path.
 * Preview intentionally does not point at LIVE product IDs while its Dodo API
 * environment remains test.
 */
export const RT92_PREMIUM_CLOUDFLARE_ROLLOUT_SCHEMA = 'eonapp.rt92.premium-cloudflare-rollout.v1';
export const RT92_PREMIUM_CHECKOUT_ROLLOUT_ENV = 'EON_PREMIUM_CHECKOUT_ROLLOUT';
const freeze = Object.freeze;

export const RT92_PREMIUM_PRODUCTION_PRODUCT_VARS = freeze({
  DODO_PRODUCT_PRO: 'pdt_0NlZKlIoQ2A6bSFNbBwMk',
  DODO_PRODUCT_ULTRA: 'pdt_0NlZLXhMLMnLeFkxNZMSw',
  DODO_PRODUCT_ULTIMATE: 'pdt_0NlZMVaq84ItJEM2lPSrZ'
});

export const RT92_PREMIUM_CLOUDFLARE_BOUNDARY = freeze({
  local: freeze({ checkoutRollout: 'disabled', dodoApiEnvironment: 'test', liveProductIdsAllowed: false }),
  preview: freeze({ checkoutRollout: 'disabled', dodoApiEnvironment: 'test', liveProductIdsAllowed: false }),
  production: freeze({ checkoutRollout: 'production', dodoApiEnvironment: 'live', liveProductIdsAllowed: true })
});

export function validateRt92PremiumCloudflareRollout() {
  const errors = [];
  if (RT92_PREMIUM_CLOUDFLARE_BOUNDARY.production.checkoutRollout !== 'production') errors.push('Premium checkout must be enabled only in certified Production.');
  if (RT92_PREMIUM_CLOUDFLARE_BOUNDARY.preview.liveProductIdsAllowed) errors.push('Preview must not consume LIVE Dodo product IDs while DODO_API_ENVIRONMENT=test.');
  if (RT92_PREMIUM_CLOUDFLARE_BOUNDARY.local.liveProductIdsAllowed) errors.push('Local must not consume LIVE Dodo product IDs.');
  for (const [key, value] of Object.entries(RT92_PREMIUM_PRODUCTION_PRODUCT_VARS)) {
    if (!/^DODO_PRODUCT_(PRO|ULTRA|ULTIMATE)$/.test(key) || !/^pdt_[A-Za-z0-9]+$/.test(value)) errors.push(`Invalid premium Production product variable: ${key}`);
  }
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: RT92_PREMIUM_CLOUDFLARE_ROLLOUT_SCHEMA });
}

export default freeze({
  RT92_PREMIUM_CLOUDFLARE_ROLLOUT_SCHEMA,
  RT92_PREMIUM_CHECKOUT_ROLLOUT_ENV,
  RT92_PREMIUM_PRODUCTION_PRODUCT_VARS,
  RT92_PREMIUM_CLOUDFLARE_BOUNDARY,
  validateRt92PremiumCloudflareRollout
});
