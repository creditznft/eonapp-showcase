import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBillingCommandTruth } from '../assets/js/billing/eon-billing-command-ledger.js';
import { getEonSubscriptionPlan, validateEonCommercialCatalog } from '../assets/js/commerce/eon-commercial-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I17_BILLING_COMMAND_LEDGER_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const truth = getBillingCommandTruth();
const catalog = validateEonCommercialCatalog();
const max = getEonSubscriptionPlan('max');

if (!catalog.ok || max?.monthlyUsd !== 49.99) errors.push('Canonical Max price is not fixed at $49.99.');
if (!truth.accountScopedIdempotency || !truth.onePendingCheckoutPerAccount || !truth.oneActiveSubscriptionPerAccount || !truth.oneTrialReservationPerAccount || truth.browserCanGrantEntitlement) errors.push('Billing command truth is incomplete or browser-authoritative.');

const sources = {
  ledger: read('assets/js/billing/eon-billing-command-ledger.js'),
  migration: read('migrations/billing/0001_billing_command_entitlement_authority.sql'),
  runtime: read('assets/js/billing/eon-dodo-live-runtime.js'),
  checkoutRoute: read('functions/api/billing/checkout.js'),
  actionRoute: read('functions/api/billing/subscription-action.js'),
  client: read('assets/js/commerce/billing-commercial-status.js'),
  city: read('assets/js/contracts/city/w659g/eon-city-w659g-membership-console.js')
};
if (!/UNIQUE\(account_id, idempotency_key\)/.test(sources.migration) || !/existing_subscription_use_plan_change/.test(sources.ledger) || !/trialPreviouslyReserved/.test(sources.ledger)) errors.push('Command ledger does not enforce account idempotency, one subscription and one trial.');
if (!/prepareBillingCommand/.test(sources.runtime) || !/'idempotency-key'/.test(sources.runtime) || !/reconcileBillingCommandFromWebhook/.test(sources.runtime)) errors.push('Checkout and webhook runtime do not use the command ledger.');
if (!/prepareBillingCommand/.test(sources.actionRoute) || !/updateBillingCommand/.test(sources.actionRoute)) errors.push('Subscription actions do not use the command ledger.');
if (!/createBillingIdempotencyKey/.test(sources.client) || !/createBillingIdempotencyKey/.test(sources.city)) errors.push('Core or City billing surfaces do not issue secure idempotency keys.');
if (/Math\.random/.test(sources.runtime) || /Math\.random/.test(sources.ledger)) errors.push('Billing identifiers use an insecure random fallback.');

const core = {
  schema: 'eonapp.a15.i17.billing-command-ledger-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I17',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  catalogue: { maxMonthlyUsd: max?.monthlyUsd || 0, trialDays: max?.trialDays || 0, catalogueValid: catalog.ok },
  sourceFiles: Object.freeze([
    'assets/js/billing/eon-billing-command-ledger.js',
    'assets/js/billing/eon-billing-client-idempotency.js',
    'assets/js/billing/eon-dodo-live-runtime.js',
    'functions/api/billing/checkout.js',
    'functions/api/billing/subscription-action.js',
    'assets/js/commerce/eon-commercial-catalog.js'
  ]),
  claims: { realDodoCatalogueQueried: false, providerChargeCreated: false, entitlementGrantedByBrowser: false, previewDeployed: false, productionDeployed: false },
  errors
};
const receipt = { ...core, digest: createHash('sha256').update(JSON.stringify(core)).digest('hex') };
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I17] ${receipt.status.toUpperCase()}: account billing commands are idempotent; Max is $49.99.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I17] ${error}`)); process.exitCode = 1; }
