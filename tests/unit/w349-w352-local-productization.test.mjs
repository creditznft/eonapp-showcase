import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_MERCHANT_READINESS_FLAGS,
  createDisabledMerchantCheckoutIntent,
  getEonMerchantReadiness,
  validateEonMerchantReadiness
} from '../../assets/js/commerce/eon-merchant-readiness.js';
import {
  EON_OUTCOME_KIT_FEATURE_FLAGS,
  listEonOutcomeKitPreviews,
  prepareEonOutcomeKitBrief,
  validateEonOutcomeKitCatalog
} from '../../assets/js/creator-suite-2/eon-outcome-kit-catalog.js';
import { runW349W352LocalProductizationGate } from '../../scripts/w349-w352-local-productization-gate.mjs';
import { buildEonbotLocalActionCardPlan } from '../../assets/js/chat/eonbot-action-cards.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('W349–W350 keeps merchant/application readiness pre-integration and blocks checkout', () => {
  const readiness = getEonMerchantReadiness();
  assert.equal(Object.values(EON_MERCHANT_READINESS_FLAGS).every((value) => value === false), true);
  assert.equal(readiness.lifecycle, 'owner-action-required');
  assert.equal(readiness.publicSurfaces.length, 6);
  assert.equal(validateEonMerchantReadiness().ok, true);
  const blocked = createDisabledMerchantCheckoutIntent('studio-membership');
  assert.equal(blocked.networkRequestCreated, false);
  assert.equal(blocked.hostedCheckoutOpened, false);
  assert.equal(blocked.paymentAccepted, false);
  assert.equal(blocked.licenceIssued, false);
});

test('W352 creates five safe local Outcome Kit previews but no commercial or provider effect', () => {
  const kits = listEonOutcomeKitPreviews();
  assert.equal(kits.length, 5);
  assert.equal(Object.values(EON_OUTCOME_KIT_FEATURE_FLAGS).every((value) => value === false), true);
  assert.equal(kits.every((kit) => kit.lifecycle === 'active-local-preview' && kit.requiresPayment === false && kit.transferable === false && kit.tokenOrNft === false && kit.entitlement === false), true);
  const prepared = prepareEonOutcomeKitBrief('campaign-launch');
  assert.equal(prepared.ok, true);
  assert.equal(prepared.draftCreated, false);
  assert.equal(prepared.providerCall, false);
  assert.equal(prepared.externalEffect, false);
  assert.equal(prepared.paymentRequired, false);
  assert.equal(prepared.brief.module, 'content');
  assert.match(prepared.brief.goal, /campaign launch/i);
  assert.equal(validateEonOutcomeKitCatalog().ok, true);
});

test('W349–W352 local productization source gate remains green', () => {
  const result = runW349W352LocalProductizationGate(root);
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('W352 routes an EONBOT outcome request to an editable local Workspace brief only', () => {
  const plan = buildEonbotLocalActionCardPlan('Help me make a campaign launch kit');
  assert.equal(plan.matched, true);
  assert.equal(plan.intent, 'outcome-kit:campaign-launch');
  assert.equal(plan.cards[0].capabilityId, 'creator-outcome-kit-previews');
  assert.equal(plan.cards[0].route, '/workspace?kit=campaign-launch');
  assert.match(plan.cards[0].summary, /no provider call, purchase, licence, subscription/i);
});
