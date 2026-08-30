import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports, VALUE_BEARING_LEGACY_MODULES } from '../../scripts/active-surface-import-fence.mjs';
import { MONETIZATION_DECISION, assertNoActiveMonetization, isMonetizationActive } from '../../assets/js/utils/monetization-decision-gate.js';
import { EON_ACCESS_MILESTONES_ACTIVE, requestAccessMilestoneGrant } from '../../assets/js/access/access-milestones-registry.js';
import { SPONSORED_DISCOVERY_ACTIVE, SPONSORED_DISCOVERY_MODE } from '../../config/sponsored-discovery-policy.mjs';
import { EON_COMMERCIAL_ACTIVATION_FLAGS, getCommercialDecisionRegistry, requestCommercialActivation } from '../../assets/js/commerce/commercial-decision-gate.js';
import { OFFICIAL_COMMERCE_FEATURE_FLAGS, createDisabledCheckoutIntent } from '../../assets/js/commerce/official-commerce-foundation.js';
import { AUTOMATION_PROVIDERS, getAutomationProvider, getAutomationProviderStats } from '../../assets/js/utils/automation-provider-registry.js';
import { planWorkflowLocally } from '../../assets/js/utils/automation-workflow-engine.js';
import { RETIRED_REDIRECTS } from '../../config/route-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const allFalse = (flags) => Object.values(flags).every((value) => value === false);

test('W247 keeps all current value-capability registries disabled and terminal', () => {
  assert.equal(isMonetizationActive(), false);
  assert.equal(MONETIZATION_DECISION.active, false);
  assert.equal(assertNoActiveMonetization().code, 'monetization_disabled');
  assert.equal(EON_ACCESS_MILESTONES_ACTIVE, false);
  assert.equal(SPONSORED_DISCOVERY_ACTIVE, false);
  assert.equal(SPONSORED_DISCOVERY_MODE, 'disabled');
  assert.equal(allFalse(EON_COMMERCIAL_ACTIVATION_FLAGS), true);
  assert.equal(allFalse(OFFICIAL_COMMERCE_FEATURE_FLAGS), true);
  assert.equal(getCommercialDecisionRegistry().decisions.every((row) => row.status === 'no-go' && row.active === false && row.activeRatePercent === 0), true);

  const commercial = requestCommercialActivation('attempt-payment');
  assert.equal(commercial.allowed, false);
  assert.equal(commercial.networkRequestCreated, false);
  assert.equal(commercial.storageWriteCreated, false);
  assert.equal(commercial.ledgerEntryCreated, false);
  assert.equal(commercial.tokenActionCreated, false);

  const checkout = createDisabledCheckoutIntent('unsafe-catalog');
  assert.equal(checkout.status, 'disabled');
  assert.equal(checkout.networkRequestCreated, false);
  assert.equal(checkout.clientPaymentAccepted, false);
  assert.equal(checkout.receiptCreated, false);
  assert.equal(checkout.deliveryCreated, false);
});

test('W247 fences inactive wallet, reward, lootbox, cloud-referral and legacy Vault modules from live routes', () => {
  const expectedFences = [
    'assets/js/utils/runtime-loader.js',
    'assets/js/utils/referral-cloud-storage.js',
    'assets/js/utils/referral-cta.js',
    'assets/js/utils/referral-share-center.js',
    'assets/js/utils/share-reward-policy.js',
    'assets/js/vault/vault-shell.js',
    'assets/js/utils/lootbox.js',
    'assets/js/utils/procedural-lootbox.js'
  ];
  for (const relative of expectedFences) assert.ok(VALUE_BEARING_LEGACY_MODULES.includes(relative), relative);
  const imports = auditActiveSurfaceImports({ root });
  assert.equal(imports.ok, true);
  assert.deepEqual(imports.legacyValueHits, []);
  for (const relative of expectedFences) assert.equal(imports.reachableModules.includes(relative), false, relative);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W247 keeps Market/reward value systems absent while allowing the canonical Dodo subscription rail', () => {
  const marketHtml = read('market.html');
  const marketPage = read('assets/js/market/eon-market-page.js');
  const rewardsHtml = read('rewards.html');
  const billingHtml = read('billing.html');
  assert.match(marketHtml, /Preview Studio · EONAPP/);
  assert.match(marketPage, /EON Preview Studio/);
  assert.match(marketPage, /No official catalog is active/);
  assert.match(marketPage, /not NFTs, investments, public listings, payment receipts, or transferable assets/);
  assert.doesNotMatch(`${marketHtml}\n${marketPage}`, /EON Market/);
  assert.match(rewardsHtml, /data-monetization="disabled"/);
  assert.match(billingHtml, /data-billing-provider="dodo"/);
  assert.match(billingHtml, /data-checkout-authority="server-only"/);
  assert.match(billingHtml, /EONKEYS never create a free subscription tier/);
  assert.doesNotMatch(`${marketHtml}\n${rewardsHtml}\n${billingHtml}`, /(?:Claim reward|Watch rewarded|Earn ad credits|Withdraw now|Cash out|Connect wallet|Mint now|List for sale|Open crate)/i);
});

test('W247 rejects a milestone grant without local value-state mutation', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
  const result = requestAccessMilestoneGrant({ id: 'city_cosmetic' }, { storage });
  assert.equal(result.ok, false);
  assert.equal(result.granted, false);
  assert.equal(result.storageUnchanged, true);
  assert.equal(values.size, 0);
});


test('W247 removes value-bearing Automation Studio records and turns value requests into local boundary review only', () => {
  const retiredIds = ['shopify', 'woocommerce', 'stripe', 'paypal', 'razorpay', 'square', 'bigcommerce', 'etsy', 'ebay', 'amazon-selling-partner', 'gumroad', 'lemonsqueezy', 'quickbooks', 'xero', 'freshbooks', 'plaid', 'wise-business', 'mercury'];
  const stats = getAutomationProviderStats();
  assert.equal(AUTOMATION_PROVIDERS.some((provider) => ['commerce', 'finance'].includes(provider.category)), false);
  assert.equal(stats.byCategory.commerce, undefined);
  assert.equal(stats.byCategory.finance, undefined);
  for (const id of retiredIds) assert.equal(getAutomationProvider(id), null, `retired value provider must not be active: ${id}`);
  const review = planWorkflowLocally('Create a Stripe payment, refund, wallet transfer, token sale, and marketplace listing.');
  assert.equal(review.family, 'local-boundary-review');
  assert.equal(review.steps.every((step) => step.providerId === 'local-runner'), true);
  const retirement = RETIRED_REDIRECTS.find((row) => row.from === '/automation-studio.html');
  assert.deepEqual(retirement, { from: '/automation-studio.html', to: '/automations', status: 301 });
  assert.equal(fs.existsSync(path.join(root, 'automation-studio.html')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/js/automation-studio-page.js')), false);
  assert.equal(fs.existsSync(path.join(root, 'assets/css/automation-studio.css')), false);
});
