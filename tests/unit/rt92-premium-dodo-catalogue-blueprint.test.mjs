import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RT92_PREMIUM_DODO_CATALOGUE_STATUS,
  RT92_PREMIUM_DODO_PRODUCTS,
  getRt92PremiumDodoProduct,
  validateRt92PremiumDodoCatalogueBlueprint
} from '../../config/rt92-premium-dodo-catalogue-blueprint.mjs';

test('premium Dodo catalogue freezes owner-approved LIVE records and server checkout authority', () => {
  assert.equal(RT92_PREMIUM_DODO_CATALOGUE_STATUS, 'catalogue-records-live-checkout-enabled');
  assert.equal(validateRt92PremiumDodoCatalogueBlueprint().ok, true);
  assert.deepEqual(RT92_PREMIUM_DODO_PRODUCTS.map((item) => item.tierId), ['pro', 'ultra', 'ultimate']);
  assert.equal(RT92_PREMIUM_DODO_PRODUCTS.every((item) => item.catalogueRecordCreated === true && /^pdt_/.test(item.dodoProductId)), true);
  assert.equal(RT92_PREMIUM_DODO_PRODUCTS.every((item) => item.checkoutEnabledInEonapp === true), true);
  assert.equal(RT92_PREMIUM_DODO_PRODUCTS.every((item) => item.dodoCreditsAttached === false && item.dodoEntitlementsAttached === false), true);
});

test('premium Dodo catalogue freezes the owner-approved prices and payment models', () => {
  const pro = getRt92PremiumDodoProduct('pro');
  const ultra = getRt92PremiumDodoProduct('ultra');
  const ultimate = getRt92PremiumDodoProduct('ultimate');
  assert.deepEqual([pro.priceUsd, ultra.priceUsd, ultimate.priceUsd], [99, 199, 1299]);
  assert.deepEqual([pro.pricingType, ultra.pricingType, ultimate.pricingType], ['subscription', 'subscription', 'one-time']);
  assert.deepEqual([pro.trialDays, ultra.trialDays, ultimate.trialDays], [7, 7, 0]);
  assert.equal(ultimate.metadata.eon_hosted_capacity, 'separate');
});
