import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  RT92_FUTURE_DODO_PRODUCTS,
  RT92_FUTURE_SOFTWARE_GRANT_LEDGER,
  RT92_PREMIUM_ENTITLEMENT_AXES,
  validateRt92PremiumBillingDesign
} from '../../config/rt92-premium-billing-design.mjs';
import { buildEonPremiumPreviewModel, validateEonPremiumPreviewModel } from '../../assets/js/capabilities/eon-premium-preview-model.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('RT92 premium billing design separates recurring capacity from perpetual software capability', () => {
  const report = validateRt92PremiumBillingDesign();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(RT92_FUTURE_SOFTWARE_GRANT_LEDGER.migrationCreated, true);
  assert.equal(RT92_FUTURE_SOFTWARE_GRANT_LEDGER.runtimeImplemented, true);
  assert.equal(RT92_FUTURE_SOFTWARE_GRANT_LEDGER.runtimeActive, true);
  assert.equal(RT92_FUTURE_SOFTWARE_GRANT_LEDGER.browserAuthority, false);
  assert.ok(RT92_PREMIUM_ENTITLEMENT_AXES.softwareCapability.mustNotGovern.includes('unlimited-hosted-ai'));
  assert.equal(RT92_FUTURE_DODO_PRODUCTS.every((product) => product.catalogueCreated && /^pdt_/.test(product.productId)), true);
  assert.equal(RT92_FUTURE_DODO_PRODUCTS.every((product) => product.checkoutActive && product.entitlementActive), true);
});

test('RT92 Dodo runtime uses one recurring lifecycle through Ultra and reserves the software-grant branch for Ultimate', () => {
  const runtime = read('assets/js/billing/eon-dodo-live-runtime.js');
  const ultimateRuntime = read('assets/js/billing/eon-premium-dodo-runtime.js');
  for (const name of ['DODO_PRODUCT_PLUS', 'DODO_PRODUCT_STUDIO', 'DODO_PRODUCT_POWER', 'DODO_PRODUCT_MAX', 'DODO_PRODUCT_PRO', 'DODO_PRODUCT_ULTRA']) assert.match(runtime, new RegExp(name));
  assert.match(runtime, /tier === 'ultimate'/);
  assert.match(runtime, /premium_webhook_rollout_disabled/);
  assert.match(ultimateRuntime, /EON_PREMIUM_DODO_TIERS = Object\.freeze\(\['ultimate'\]\)/);
  assert.doesNotMatch(ultimateRuntime, /DODO_PRODUCT_PRO|DODO_PRODUCT_ULTRA/);
});

test('RT92 professional capability status stays non-authoritative while Billing owns checkout', () => {
  const report = validateEonPremiumPreviewModel();
  assert.equal(report.ok, true, report.errors.join('\n'));
  const cards = buildEonPremiumPreviewModel({ surface: 'forge', subscriptionTierId: 'max' });
  assert.ok(cards.length >= 2);
  for (const card of cards) {
    assert.equal(card.purchaseAvailable, true);
    assert.equal(card.checkoutHref, '');
    assert.equal(card.liveGrantAction, false);
    assert.equal(card.commercialStatus, 'production-live');
    assert.equal(card.hostedCapacityIncluded, false);
  }
});
