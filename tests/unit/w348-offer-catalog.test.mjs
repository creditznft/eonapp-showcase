import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_OFFER_CATALOG_FEATURE_FLAGS,
  getEonOfferCatalog,
  getEonOfferCatalogPublicSummary,
  validateEonOfferCatalog
} from '../../assets/js/commerce/eon-offer-catalog.js';
import { runW348OfferCatalogGate } from '../../scripts/w348-offer-catalog-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W348 product direction makes the free local core explicit while commercial offers remain planned', () => {
  const catalog = getEonOfferCatalog();
  assert.equal(catalog.lifecycle, 'planning-with-active-free-local-core');
  assert.equal(catalog.offers.find((offer) => offer.id === 'eon-free-local')?.lifecycle, 'active-local');
  assert.equal(catalog.offers.find((offer) => offer.id === 'eon-studio-membership')?.lifecycle, 'planned');
  assert.equal(catalog.offers.find((offer) => offer.id === 'realm-share-relics')?.requiresPayment, false);
  assert.equal(catalog.offers.every((offer) => offer.transferable === false && offer.tokenOrNft === false), true);
});

test('W348 keeps every payment, subscription, licence, referral and economic flag disabled', () => {
  assert.equal(Object.values(EON_OFFER_CATALOG_FEATURE_FLAGS).every((value) => value === false), true);
  const summary = getEonOfferCatalogPublicSummary();
  assert.equal(summary.active, false);
  assert.match(summary.message, /no price, checkout, payment provider, subscription/i);
  assert.equal(validateEonOfferCatalog().ok, true);
});

test('W348 source gate remains green', () => {
  const result = runW348OfferCatalogGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});
