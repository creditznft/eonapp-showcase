import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_COMMERCIAL_ACTIVATION_FLAGS,
  EON_COMMERCIAL_DECISION_SCHEMA,
  getCommercialDecisionRegistry,
  getCommercialPublicStatus,
  requestCommercialActivation
} from '../../assets/js/commerce/commercial-decision-gate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const allFalse = (flags) => Object.values(flags).every((value) => value === false);

test('W226 commercial registry is an explicit no-go decision with zero active rate and no value-producing path', () => {
  const registry = getCommercialDecisionRegistry();
  assert.equal(registry.schema, EON_COMMERCIAL_DECISION_SCHEMA);
  assert.equal(registry.lifecycle, 'decision-gate-only');
  assert.equal(allFalse(EON_COMMERCIAL_ACTIVATION_FLAGS), true);
  assert.equal(registry.decisions.length, 5);
  assert.equal(registry.decisions.every((decision) => decision.status === 'no-go' && decision.active === false), true);
  assert.equal(registry.decisions.every((decision) => decision.activeRatePercent === 0 && decision.reversalWindowDays === null), true);
  assert.match(registry.nonNegotiables.join('\n'), /clicks, page visits, generic sharing, idle activity, ad views/i);
  assert.match(registry.nonNegotiables.join('\n'), /one level only/i);
  assert.match(registry.nonNegotiables.join('\n'), /Token research remains archived/i);
});

test('W226 rejects any premature commercial activation without network, storage, ledger, or token side effects', () => {
  const attempted = requestCommercialActivation('affiliate-payout-now');
  assert.equal(attempted.action, 'affiliate-payout-now');
  assert.equal(attempted.allowed, false);
  assert.equal(attempted.status, 'no-go');
  assert.equal(attempted.networkRequestCreated, false);
  assert.equal(attempted.storageWriteCreated, false);
  assert.equal(attempted.ledgerEntryCreated, false);
  assert.equal(attempted.tokenActionCreated, false);
  assert.match(attempted.reason, /separate written go decision/i);
});

test('W226 public status keeps Share Center truthful: invite discovery only, never commission, payout, or active commercial account', () => {
  const status = getCommercialPublicStatus();
  assert.equal(status.active, false);
  assert.equal(status.activeRatePercent, 0);
  assert.equal(status.decisionCount, 5);
  assert.match(status.message, /No checkout, purchase, receipt, delivery, referral commission, payout, token settlement, or user selling is active/i);
  assert.match(status.inviteMessage, /do not create a reward, affiliate commission, payout, ownership right, or commercial account/i);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('W226 source, Billing UI, and server contract remain non-operative and do not contain activation controls', () => {
  const gate = read('assets/js/commerce/commercial-decision-gate.js');
  const renderer = read('assets/js/commerce/billing-commercial-status.js');
  const billing = read('billing.html');
  const contract = JSON.parse(read('platform-backend/contracts/eon-commercial-decision-gate.v1.json'));
  const share = read('assets/js/utils/eon-share-sheet.js');

  for (const source of [gate, renderer]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|\.post\s*\(|window\.open\s*\(|localStorage\s*\.|sessionStorage\s*\./i);
  }
  assert.match(billing, /id="eon-commercial-decision-status"/);
  assert.match(billing, /billing-commercial-status\.js/);
  assert.match(billing, /No checkout, subscription, payment rail, provider callback, or payment activation is active/i);
  assert.doesNotMatch(billing, /Activate affiliate|Start payout|Connect wallet|Withdraw now|Buy now|Checkout now/i);
  assert.doesNotMatch(share, /share to earn|commission active|payout active|cash out/i);
  assert.equal(contract.lifecycle, 'decision-gate-only');
  assert.equal(contract.active, false);
  assert.equal(allFalse(contract.activation), true);
  assert.equal(contract.commercialPolicy.currentAffiliateRatePercent, 0);
  assert.equal(contract.commercialPolicy.currentReversalWindowDays, null);
  assert.equal(contract.commercialPolicy.clickShareViewActivityAdRewardAllowed, false);
  assert.equal(contract.commercialPolicy.clientSidePaymentProofAllowed, false);
});
