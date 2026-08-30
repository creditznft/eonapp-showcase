#!/usr/bin/env node
/**
 * W247 — economic, commercial, legal and abuse firewall.
 *
 * This is a release gate, not a commercial feature. It joins the existing
 * disabled decision registries with the live import graph and built public
 * output so a historical provider/wallet/reward path cannot quietly become
 * reachable. It intentionally makes no legal approval claim.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETIRED_REDIRECTS } from '../config/route-contract.mjs';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import { auditActiveSurfaceImports, VALUE_BEARING_LEGACY_MODULES } from './active-surface-import-fence.mjs';
import { MONETIZATION_DECISION, isMonetizationActive, assertNoActiveMonetization } from '../assets/js/utils/monetization-decision-gate.js';
import { EON_ACCESS_MILESTONES_ACTIVE, getAccessMilestonePublicStatus, requestAccessMilestoneGrant } from '../assets/js/access/access-milestones-registry.js';
import { SPONSORED_DISCOVERY_ACTIVE, SPONSORED_DISCOVERY_MODE, getSponsoredDiscoveryStatus } from '../config/sponsored-discovery-policy.mjs';
import { EON_COMMERCIAL_ACTIVATION_FLAGS, getCommercialDecisionRegistry, getCommercialPublicStatus, requestCommercialActivation } from '../assets/js/commerce/commercial-decision-gate.js';
import { OFFICIAL_COMMERCE_FEATURE_FLAGS, getOfficialCommerceFoundation, getOfficialCommercePublicSummary, createDisabledCheckoutIntent } from '../assets/js/commerce/official-commerce-foundation.js';
import { AUTOMATION_PROVIDERS, getAutomationProvider, getAutomationProviderStats } from '../assets/js/utils/automation-provider-registry.js';
import { planWorkflowLocally } from '../assets/js/utils/automation-workflow-engine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REQUIRE_DIST = process.argv.includes('--require-dist');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const allFalse = (flags) => Object.values(flags).every((value) => value === false);
const providerPattern = /https?:\/\/[^'"\s]*(?:monetag|omg10|propeller|adwixio|nowpayments|stripe|razorpay|coinbase|walletconnect|metamask|rainbow\.me|rabby\.io)/i;
const valueActionPattern = /<(?:a|button)\b[^>]*>[\s\S]{0,220}?\b(?:buy(?:\s+now)?|checkout(?:\s+now)?|pay(?:\s+now)?|claim\s+(?:reward|credit|payout)|watch\s+(?:a\s+)?reward|earn\s+(?:reward|credit|points)|withdraw|cash\s*out|connect\s+wallet|mint(?:\s+now)?|list\s+for\s+sale|open\s+crate)\b[\s\S]{0,220}?<\/(?:a|button)>/i;
const remoteOperationPattern = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|navigator\.sendBeacon\s*\(/;
// Match quoted provider identifiers, not bare words: Babylon legitimately emits generic math/controller terms such as "Square".
const retiredAutomationValueProviderPattern = /["'](?:shopify|woocommerce|stripe|paypal|razorpay|square|bigcommerce|etsy|ebay|amazon-selling-partner|gumroad|lemonsqueezy|quickbooks|xero|freshbooks|plaid|wise-business|mercury)["']/;
const retiredAutomationValueProviderIds = Object.freeze(['shopify', 'woocommerce', 'stripe', 'paypal', 'razorpay', 'square', 'bigcommerce', 'etsy', 'ebay', 'amazon-selling-partner', 'gumroad', 'lemonsqueezy', 'quickbooks', 'xero', 'freshbooks', 'plaid', 'wise-business', 'mercury']);

function walk(dir, extension = '') {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(next, extension));
    else if (!extension || entry.name.endsWith(extension)) results.push(next);
  }
  return results.sort();
}

const imports = auditActiveSurfaceImports({ root: ROOT });
assert(imports.ok, `active import fence failed: ${[
  ...imports.legacyPrefixHits,
  ...imports.legacyValueHits,
  ...imports.forbiddenLiteralHits,
  ...imports.evmAddressLiteralHits
].join(', ')}`);

const newlyFencedLegacyModules = [
  'assets/js/utils/runtime-loader.js',
  'assets/js/utils/referral-cloud-storage.js',
  'assets/js/utils/referral-cta.js',
  'assets/js/utils/referral-share-center.js',
  'assets/js/utils/share-reward-policy.js',
  'assets/js/vault/vault-shell.js',
  'assets/js/utils/lootbox.js',
  'assets/js/utils/procedural-lootbox.js'
];
for (const module of newlyFencedLegacyModules) {
  assert(VALUE_BEARING_LEGACY_MODULES.includes(module), `legacy commercial module is not fenced: ${module}`);
  assert(!imports.reachableModules.includes(module), `legacy commercial module is reachable from active routes: ${module}`);
}

assert(isMonetizationActive() === false, 'Monetization must remain disabled.');
assert(MONETIZATION_DECISION.active === false, 'Monetization decision must be inactive.');
assert(assertNoActiveMonetization().code === 'monetization_disabled', 'Monetization assertion must fail closed.');
assert(EON_ACCESS_MILESTONES_ACTIVE === false, 'Access Milestones must remain disabled.');
assert(getAccessMilestonePublicStatus().active === false, 'Access Milestones public status must remain inactive.');
assert(SPONSORED_DISCOVERY_ACTIVE === false && SPONSORED_DISCOVERY_MODE === 'disabled', 'Sponsored Discovery must remain disabled.');
assert(getSponsoredDiscoveryStatus().active === false, 'Sponsored Discovery public status must remain inactive.');
assert(allFalse(EON_COMMERCIAL_ACTIVATION_FLAGS), 'Commercial activation flags must all be false.');
assert(allFalse(OFFICIAL_COMMERCE_FEATURE_FLAGS), 'Official-commerce flags must all be false.');
assert(getCommercialDecisionRegistry().decisions.every((decision) => decision.status === 'no-go' && decision.active === false && decision.activeRatePercent === 0), 'Commercial decisions must all be explicit no-go decisions.');
assert(getCommercialPublicStatus().active === false, 'Commercial public status must be inactive.');
assert(getOfficialCommerceFoundation().lifecycle === 'design-only', 'Official commerce foundation must remain design-only.');
assert(getOfficialCommercePublicSummary().active === false, 'Official commerce public summary must be inactive.');
const automationStats = getAutomationProviderStats();
assert(!AUTOMATION_PROVIDERS.some((provider) => ['commerce', 'finance'].includes(provider.category)), 'Automation registry exposes a value-bearing category.');
assert(automationStats.byCategory.commerce === undefined && automationStats.byCategory.finance === undefined, 'Automation registry category stats expose commerce or finance.');
for (const providerId of retiredAutomationValueProviderIds) assert(getAutomationProvider(providerId) === null, `Retired automation value provider remains available: ${providerId}`);
const restrictedAutomationPlan = planWorkflowLocally('Prepare a Stripe payment, refund, wallet transfer and marketplace listing.');
assert(restrictedAutomationPlan.family === 'local-boundary-review' && restrictedAutomationPlan.steps.every((step) => step.providerId === 'local-runner'), 'Value-bearing automation request must resolve only to local boundary-review steps.');

const commercialAttempt = requestCommercialActivation('attempt-payment');
assert(commercialAttempt.allowed === false && commercialAttempt.networkRequestCreated === false && commercialAttempt.storageWriteCreated === false && commercialAttempt.ledgerEntryCreated === false && commercialAttempt.tokenActionCreated === false, 'Commercial activation must fail closed with no side effects.');
const checkoutAttempt = createDisabledCheckoutIntent('unsafe-catalog');
assert(checkoutAttempt.status === 'disabled' && checkoutAttempt.networkRequestCreated === false && checkoutAttempt.clientPaymentAccepted === false && checkoutAttempt.receiptCreated === false && checkoutAttempt.deliveryCreated === false, 'Browser checkout intent must remain disabled with no side effects.');
const accessBefore = new Map();
const storage = { getItem: (key) => accessBefore.get(key) ?? null, setItem: (key, value) => accessBefore.set(key, String(value)) };
const accessAttempt = requestAccessMilestoneGrant({ id: 'city_cosmetic' }, { storage });
assert(accessAttempt.ok === false && accessAttempt.granted === false && accessAttempt.storageUnchanged === true && accessBefore.size === 0, 'Access milestone grant must fail closed without writing local value state.');

for (const directory of ['functions/api/rewards', 'functions/api/nowpayments', 'functions/api/evm', 'functions/api/referrals', 'functions/api/ad-rewards', 'functions/api/social', 'functions/api/telegram']) {
  assert(!fs.existsSync(path.join(ROOT, directory)), `retired commercial Pages Function exists: ${directory}`);
}

const automationStudioRedirect = RETIRED_REDIRECTS.find((row) => row.from === '/automation-studio.html');
assert(automationStudioRedirect?.to === '/automations' && automationStudioRedirect?.status === 301, 'Legacy Automation Studio must remain a redirect-only route to Automations.');
assert(!fs.existsSync(path.join(ROOT, 'automation-studio.html')), 'Legacy Automation Studio document must remain outside active source.');
assert(!fs.existsSync(path.join(ROOT, 'assets/js/automation-studio-page.js')), 'Legacy Automation Studio runtime must not remain in active source.');
assert(!fs.existsSync(path.join(ROOT, 'assets/css/automation-studio.css')), 'Legacy Automation Studio stylesheet must not remain in active source.');
const activeAutomationSources = ['assets/js/eon-automations-page.js', 'assets/js/utils/automation-provider-registry.js', 'assets/js/utils/automation-workflow-engine.js'];
for (const relative of activeAutomationSources) assert(!retiredAutomationValueProviderPattern.test(read(relative)), `${relative} contains a retired value-bearing automation provider.`);

for (const relative of [
  'assets/js/commerce/commercial-decision-gate.js',
  'assets/js/commerce/official-commerce-foundation.js',
  'assets/js/commerce/billing-commercial-status.js',
  'assets/js/access/rewards-status-page.js',
  'assets/js/market/eon-market-page.js'
]) {
  const source = read(relative);
  assert(!remoteOperationPattern.test(source), `${relative} contains a remote operation despite its no-go/local-only role.`);
  assert(!providerPattern.test(source), `${relative} contains a provider/payment destination.`);
}

const publicFiles = [...new Set([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES].map((route) => route.file).filter(Boolean))];
const publicProviderHits = [];
const publicValueActionHits = [];
for (const relative of publicFiles) {
  const source = read(relative);
  if (providerPattern.test(source)) publicProviderHits.push(relative);
  if (valueActionPattern.test(source)) publicValueActionHits.push(relative);
}
assert(publicProviderHits.length === 0, `current public HTML contains a commercial-provider destination: ${publicProviderHits.join(', ')}`);
assert(publicValueActionHits.length === 0, `current public HTML exposes a value-producing control: ${publicValueActionHits.join(', ')}`);

const marketHtml = read('market.html');
const marketPage = read('assets/js/market/eon-market-page.js');
assert(/Preview Studio · EONAPP/.test(marketHtml), '/market must present as Preview Studio, not an active marketplace.');
assert(/EON Preview Studio/.test(marketPage), 'Preview Studio runtime title missing.');
assert(/No official catalog is active/.test(marketPage), 'Preview Studio must state official catalog is inactive.');
assert(/not NFTs, investments, public listings, payment receipts, or transferable assets/.test(marketPage), 'Preview Studio must state local-preview boundaries.');
assert(!/EON Market/.test(`${marketHtml}\n${marketPage}`), 'Public Preview Studio source still presents an active EON Market name.');

const outputProviderHits = [];
const outputRetiredAutomationProviderHits = [];
if (REQUIRE_DIST) {
  assert(fs.existsSync(DIST), 'dist/ is missing; run npm run build before W247 output proof.');
  if (fs.existsSync(DIST)) {
    const outputFiles = walk(DIST).filter((file) => /\.(?:html|m?js)$/i.test(file));
    for (const file of outputFiles) {
      const text = fs.readFileSync(file, 'utf8');
      const relative = path.relative(ROOT, file).replaceAll('\\', '/');
      if (providerPattern.test(text)) outputProviderHits.push(relative);
      if (retiredAutomationValueProviderPattern.test(text)) outputRetiredAutomationProviderHits.push(relative);
    }
    const builtMarket = path.join(DIST, 'market', 'index.html');
    const builtRewards = path.join(DIST, 'rewards', 'index.html');
    const builtBilling = path.join(DIST, 'billing', 'index.html');
    assert(fs.existsSync(builtMarket), 'built /market page missing.');
    assert(fs.existsSync(builtRewards), 'built /rewards page missing.');
    assert(fs.existsSync(builtBilling), 'built /billing page missing.');
    if (fs.existsSync(builtMarket)) assert(/Preview Studio · EONAPP/.test(fs.readFileSync(builtMarket, 'utf8')), 'built /market page does not present Preview Studio title.');
    if (fs.existsSync(builtRewards)) assert(/data-monetization="disabled"/.test(fs.readFileSync(builtRewards, 'utf8')), 'built /rewards page does not carry disabled monetization state.');
  }
}
assert(outputProviderHits.length === 0, `built output contains a commercial-provider destination: ${outputProviderHits.join(', ')}`);
assert(outputRetiredAutomationProviderHits.length === 0, `built output contains a retired value-bearing automation provider: ${outputRetiredAutomationProviderHits.join(', ')}`);

const report = {
  schema: 'eonapp.w247.economic-commercial-firewall-report.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  requireDist: REQUIRE_DIST,
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount, legacyValueHits: imports.legacyValueHits },
  publicProviderHits,
  publicValueActionHits,
  outputProviderHits,
  outputRetiredAutomationProviderHits,
  newlyFencedLegacyModules,
  errors
};
const artifacts = path.join(ROOT, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
fs.writeFileSync(path.join(artifacts, 'W247_ECONOMIC_COMMERCIAL_FIREWALL_REPORT_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error('[W247] Economic/commercial firewall failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`[W247] PASS: ${imports.moduleCount} active modules; no value-producing public control, provider destination, reachable legacy commercial module, or enabled commercial capability.`);
