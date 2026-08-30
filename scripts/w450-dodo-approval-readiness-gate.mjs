#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDodoApprovalReadinessPublicStatus, requestDodoCheckout } from '../assets/js/commerce/dodo-approval-readiness.js';
import { EONAPP_PRODUCT_SCOPE } from '../assets/js/product/eonapp-product-scope.js';
import { W450_DODO_STATUS, validateW450DodoApprovalReadinessContract } from '../config/w450-dodo-approval-readiness-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message, errors) => { if (!condition) errors.push(message); };

export function inspectW450DodoApprovalReadiness({ writeArtifact = false } = {}) {
  const errors = [...validateW450DodoApprovalReadinessContract()];
  const source = read('assets/js/commerce/dodo-approval-readiness.js');
  const billingRenderer = read('assets/js/commerce/billing-commercial-status.js');
  const billingPage = read('billing.html');
  const publicStatus = getDodoApprovalReadinessPublicStatus();
  const checkout = requestDodoCheckout();

  ensure(W450_DODO_STATUS.providerSelectedForPlanning === true && W450_DODO_STATUS.merchantApproved === false, 'Dodo must be selected for planning but approval must remain pending.', errors);
  ensure(EONAPP_PRODUCT_SCOPE.commerce.paymentProvider === 'dodo-payments-approval-pending', 'Product scope must expose Dodo as approval-pending, not live.', errors);
  ensure(EONAPP_PRODUCT_SCOPE.commerce.checkout === 'not-connected' && EONAPP_PRODUCT_SCOPE.commerce.subscriptionEntitlement === 'not-active', 'Product scope must keep checkout and entitlement inactive.', errors);
  ensure(publicStatus.checkoutActive === false && publicStatus.publicTrialActive === false, 'Public Dodo status must not claim live checkout or trials.', errors);
  ensure(checkout.ok === false && checkout.checkoutCreated === false && checkout.entitlementCreated === false && checkout.trialCreated === false, 'Checkout request must fail closed without creating state.', errors);
  ensure(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//i.test(source), 'Approval boundary must not contain a network/provider call.', errors);
  ensure(/eon-dodo-readiness/.test(billingRenderer) && /eon-dodo-readiness/.test(billingPage), 'Billing status must render an explicit approval-pending notice.', errors);
  ensure(/dodo-merchant-approval-and-proof-required/.test(source), 'Approval boundary must use a clear fail-closed reason.', errors);

  const report = Object.freeze({
    schema: 'eonapp.w450.dodo-approval-readiness-gate.v1',
    wave: 'W450',
    sourceOnly: true,
    status: errors.length ? 'fail' : 'pass',
    provider: publicStatus.provider,
    merchantApplication: publicStatus.status,
    checkoutActive: publicStatus.checkoutActive,
    trialActive: publicStatus.publicTrialActive,
    errors: Object.freeze(errors),
    limitations: Object.freeze([
      'No Dodo account, API key, checkout session, webhook endpoint, entitlement server, customer portal or live payment flow is connected.',
      'Merchant approval and every external proof item remain required before any public payment or free-trial offer.'
    ])
  });
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w450-dodo-approval-readiness-gate');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW450DodoApprovalReadiness({ writeArtifact: true });
  assert.equal(result.status, 'pass', result.errors.join('\n'));
  process.stdout.write('W450 Dodo approval-readiness gate passed. Checkout and trials remain fail-closed.\n');
}
