#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W619_DODO_ENV_CONTRACT,
  W619_RUNTIME_FLAGS,
  W619_BILLING_API_SURFACES,
  decideW619PaidActivation,
  getW619DodoServerLedgerPlan,
  validateW619DodoServerLedgerContract
} from '../config/w619-dodo-server-ledger-contract.mjs';
import {
  buildReferralGrantDecision,
  buildW619PublicBillingStatus,
  createW619CheckoutPreparationDecision,
  rejectBrowserEntitlementClaim,
  validateW619ServerLedgerModel
} from '../assets/js/billing/eon-server-entitlement-ledger.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

export function inspectW619DodoServerLedgerGate() {
  const errors = [];
  const contract = validateW619DodoServerLedgerContract();
  if (!contract.ok) errors.push(...contract.errors);
  const model = validateW619ServerLedgerModel();
  if (!model.ok) errors.push(...model.errors);

  const plan = getW619DodoServerLedgerPlan();
  if (Object.values(W619_RUNTIME_FLAGS).some(Boolean)) errors.push('W619 runtime flags must remain false.');
  for (const name of W619_DODO_ENV_CONTRACT.forbiddenInFrontend) {
    const viteName = `VITE_${name}`;
    if (read('package.json').includes(viteName)) errors.push(`${viteName} must never be configured as a frontend secret.`);
  }

  const publicStatus = buildW619PublicBillingStatus();
  if (publicStatus.checkoutActive || publicStatus.trialActive || publicStatus.entitlementLedgerWriteEnabled || publicStatus.referralLedgerWriteEnabled) errors.push('Public billing status accidentally enabled billing/ledger state.');
  if (publicStatus.browserUnlockAllowed !== false || publicStatus.eonKeyRedemptionActive !== false) errors.push('Browser unlock or EON Key redemption must remain false.');

  const checkout = createW619CheckoutPreparationDecision({ tierId: 'plus', clientPaymentCallback: true });
  if (checkout.checkoutCreated || checkout.networkRequestCreated || checkout.entitlementCreated || checkout.ok) errors.push('Checkout decision must be terminally disabled in W619.');
  const reject = rejectBrowserEntitlementClaim({ source: 'query', claimedTier: 'power' });
  if (!reject.rejected || reject.entitlementCreated || reject.keyGrantCreated) errors.push('Browser entitlement claims must be rejected.');

  const activation = decideW619PaidActivation({ sourceQaPassed: true, browserProofPassed: true, cloudflareDeployProof: true, enablePaidActivation: true });
  if (!activation.blockers.some((item) => /Dodo product/.test(item))) errors.push('Paid activation must block without Dodo product proof.');
  if (!activation.blockers.some((item) => /webhook signature/.test(item))) errors.push('Paid activation must block without Dodo webhook signature proof.');
  if (!activation.blockers.some((item) => /entitlement ledger/.test(item))) errors.push('Paid activation must block without entitlement ledger proof.');
  const referral = buildReferralGrantDecision({ inviteePaid: true, retainedDays: 3, serverLedgerProof: true });
  if (referral.ok || referral.grantCreated || referral.cashOrDiscountCreated) errors.push('Referral grant cannot be live or cash/discount-backed in W619.');

  const requiredFiles = [
    'config/w619-dodo-server-ledger-contract.mjs',
    'assets/js/billing/eon-server-entitlement-ledger.js',
    'functions/api/billing/status.js',
    'functions/api/billing/checkout.js',
    'functions/api/billing/webhooks/dodo.js',
    'functions/api/billing/referral-status.js',
    'tests/unit/w619-dodo-server-ledger.test.mjs'
  ];
  for (const file of requiredFiles) if (!exists(file)) errors.push(`Missing W619 file: ${file}`);

  const sourceBundle = [
    read('config/w619-dodo-server-ledger-contract.mjs'),
    read('assets/js/billing/eon-server-entitlement-ledger.js'),
    read('functions/api/billing/checkout.js'),
    read('functions/api/billing/webhooks/dodo.js'),
    read('functions/api/billing/referral-status.js')
  ].join('\n');
  if (/fetch\s*\(/.test(sourceBundle)) errors.push('W619 must not call external Dodo/network fetch yet.');
  if (/checkoutActive:\s*true|trialActive:\s*true|entitlementLedgerWriteEnabled:\s*true|referralLedgerWriteEnabled:\s*true|eonKeyRedemptionActive:\s*true/.test(sourceBundle)) errors.push('A W619 source file contains an enabled activation flag.');
  if (/cashback|wallet balance|crypto payout|commission payout|passive income|guaranteed profit/i.test(sourceBundle)) errors.push('Forbidden value/reward claim found in W619 source.');
  if (!W619_BILLING_API_SURFACES.some((surface) => surface.route === '/api/billing/status' && surface.live === true)) errors.push('Billing status API surface missing.');
  if (!plan.codexProofRequired.some((item) => /CEO/.test(item))) errors.push('Codex proof plan must require CEO activation note.');

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: 'eonapp.w619.dodo-server-ledger-gate.v1', checks: 34 });
}

const report = inspectW619DodoServerLedgerGate();
if (!report.ok) {
  console.error(`[W619] Dodo/server ledger gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W619] Dodo/server ledger gate passed (${report.checks}/34).`);
