#!/usr/bin/env node
/** R4-COMM-02 source gate: global commerce plan, multi-currency prices and inactive EON Invite. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  R4_COMM02_EON_INVITE,
  R4_COMM02_FEATURE_FLAGS,
  R4_COMM02_PRICE_BOOKS,
  R4_COMM02_PROVIDER_STRATEGY,
  R4_COMM02_SUPPORT_MODEL,
  R4_COMM02_TIER_DESIGN,
  validateR4Comm02Contract
} from '../config/r4-comm02-global-commerce-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectR4Comm02({ root = ROOT } = {}) {
  const errors = [...validateR4Comm02Contract()];
  const readAt = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const decision = readAt('docs/R4_COMM02_GLOBAL_COMMERCE_EON_INVITE_AND_PRICING_DECISION_2026-06-26.md');
  const ledger = JSON.parse(readAt('program/R4_PROGRAM_LEDGER_2026-06-26.json'));
  const currentCommercialStatus = readAt('assets/js/commerce/billing-commercial-status.js');
  const currentGate = readAt('assets/js/commerce/commercial-decision-gate.js');

  if (!/(Dodo Payments.*scoped|scoped research candidate:\s*Dodo Payments)/i.test(decision)) errors.push('Decision record must name Dodo Payments as a scoped research candidate.');
  if (!/Lemon Squeezy.*backup/i.test(decision)) errors.push('Decision record must name Lemon Squeezy as the backup research candidate.');
  if (!/KYC.*not optional/i.test(decision)) errors.push('Decision record must state that payment KYC cannot be bypassed.');
  if (!/20%/i.test(decision) || !/30-day Plus extension/i.test(decision)) errors.push('Decision record must specify the proposed EON Invite customer benefits.');
  if (!/not a commission/i.test(decision) || !/single-level/i.test(decision)) errors.push('Decision record must distinguish EON Invite from an affiliate scheme.');
  if (!/\$199\/month/i.test(decision) || !/₹15,999\/month/i.test(decision)) errors.push('Decision record must retain the future EON Scale price books.');
  if (!/not Enterprise/i.test(decision)) errors.push('Decision record must keep EON Scale distinct from Enterprise.');
  if (!/AI-first self-service/i.test(decision)) errors.push('Decision record must describe AI-first support boundaries.');
  if (Object.values(R4_COMM02_FEATURE_FLAGS).some(Boolean)) errors.push('No R4-COMM-02 activation flag may be true.');
  if (R4_COMM02_PROVIDER_STRATEGY.state !== 'research-complete-provider-not-selected') errors.push('Provider selection must remain uncommitted.');
  if (R4_COMM02_EON_INVITE.status !== 'planned-not-active-provider-approval-required') errors.push('EON Invite must stay inactive.');
  if (!R4_COMM02_EON_INVITE.prohibited.includes('commission')) errors.push('EON Invite must prohibit commission.');
  if (!R4_COMM02_EON_INVITE.prohibited.includes('multilevel reward')) errors.push('EON Invite must prohibit multilevel rewards.');
  if (R4_COMM02_PRICE_BOOKS.status !== 'planned-not-public-not-for-sale') errors.push('Price books must remain non-public planning values.');
  if (R4_COMM02_TIER_DESIGN.find((entry) => entry.id === 'eon-enterprise')?.state !== 'future-contract-only') errors.push('Enterprise must not be made self-serve by this wave.');
  if (R4_COMM02_SUPPORT_MODEL.state !== 'planned-not-active') errors.push('AI-first support design must stay planning-only.');
  if (!/checkoutActive:\s*false/.test(currentGate) || !/paymentProviderActive:\s*false/.test(currentGate)) errors.push('Current commercial gate must remain inactive.');
  if (!/No amount, renewal, card\/UPI option, processor, subscription, personal licence, referral discount/i.test(currentCommercialStatus) || !/Invite links help people discover EONAPP/i.test(currentGate) || !/No checkout, purchase, receipt, delivery, referral commission, payout/i.test(currentGate)) errors.push('Current public billing status must remain safely inactive until future activation work is proved.');
  const merchantLane = (ledger.lanes || []).find((lane) => lane.id === 'M-00');
  if (merchantLane?.status !== 'hold-governance') errors.push('M-00 must remain hold-governance.');
  if (!Array.isArray(merchantLane?.evidenceRefs) || !merchantLane.evidenceRefs.includes('docs/R4_COMM02_GLOBAL_COMMERCE_EON_INVITE_AND_PRICING_DECISION_2026-06-26.md')) errors.push('M-00 must reference the R4-COMM-02 decision record.');
  return Object.freeze({ ok: errors.length === 0, errors });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectR4Comm02();
  if (!result.ok) {
    result.errors.forEach((error) => console.error(`[R4-COMM-02] ${error}`));
    process.exitCode = 1;
  } else {
    console.log('R4-COMM-02 gate: PASS (global commerce is unselected; EON Invite remains a planned, non-cash single-level promotion).');
  }
}
